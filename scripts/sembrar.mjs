// Carga en Firebase la marca y el equipo de oficina.config.json. Se puede correr de nuevo sin duplicar.
import { readFileSync } from 'node:fs';
import { conectar } from '../engine/almacen.mjs';

const COLORES = ['#7c5cff', '#ff6b9d', '#3ecfb2', '#ffb547', '#4aa8ff', '#ff7a59', '#a3d94f', '#e879f9', '#22d3ee', '#f87171'];
const cfg = JSON.parse(readFileSync(new URL('../oficina.config.json', import.meta.url), 'utf8'));
const roles = JSON.parse(readFileSync(new URL('../plantillas/roles.json', import.meta.url), 'utf8'));
const id = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const agentes = cfg.agentes || [];
if (!agentes.length) { console.error('✖ Agrega al menos un agente en oficina.config.json.'); process.exit(1); }
for (const a of agentes) {
  if (!a.nombre) { console.error('✖ Hay un agente sin nombre.'); process.exit(1); }
  if (!roles[a.rol]) { console.error(`✖ El rol "${a.rol}" de ${a.nombre} no existe. Opciones: ${Object.keys(roles).join(', ')}`); process.exit(1); }
}

// Sin base de datos, Firestore reintenta para siempre en silencio: mejor avisar.
setTimeout(() => {
  console.error('\n✖ Firestore no responde. Revisa que la base de datos exista (npm run publicar la crea) y vuelve a intentarlo.');
  process.exit(1);
}, 180_000).unref();

try {
  const almacen = await conectar();
  const marca = { nombre: cfg.nombre, negocio: cfg.negocio, tono: cfg.tono, color: cfg.color || '#7c5cff', logo: cfg.logo || '' };
  // Las reglas recién publicadas pueden tardar hasta un minuto en aplicarse.
  for (let intento = 1; ; intento++) {
    try {
      await almacen.fijar('config', 'oficina', marca);
      break;
    } catch (e) {
      if (!String(e.code).includes('permission-denied') || intento === 5) throw e;
      console.log('Esperando a que se apliquen las reglas de seguridad…');
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
  for (const [i, a] of agentes.entries()) {
    const r = roles[a.rol];
    await almacen.fijar('agentes', id(a.nombre), {
      nombre: a.nombre, rol: a.rol, titulo: a.titulo || r.titulo, manual: a.manual || r.manual,
      web: a.web ?? r.web, coordinador: !!r.coordinador, color: a.color || COLORES[i % COLORES.length],
      orden: i, activo: true, estado: 'libre', tareaActual: null,
    });
    console.log(`✔ ${a.nombre} (${r.titulo})`);
  }
  if (cfg.primeraTarea?.agente && cfg.primeraTarea?.titulo) {
    const ahora = Date.now();
    await almacen.crear('tareas', {
      titulo: cfg.primeraTarea.titulo, detalle: cfg.primeraTarea.detalle || '', agenteId: id(cfg.primeraTarea.agente),
      prioridad: 'alta', estado: 'pendiente', origen: 'instalacion', creada: ahora, actualizada: ahora,
      historial: [{ en: ahora, texto: 'Primera tarea de la oficina' }],
    });
    console.log(`✔ Primera tarea para ${cfg.primeraTarea.agente}: ${cfg.primeraTarea.titulo}`);
  }
  console.log('\nEquipo cargado. Enciende la oficina con: npm run motor');
  process.exit(0);
} catch (e) {
  console.error(`\n✖ No pude cargar el equipo: ${e.code || e.message}`);
  if (String(e.code).includes('permission-denied')) console.error('  Publica las reglas primero: npm run publicar');
  process.exit(1);
}
