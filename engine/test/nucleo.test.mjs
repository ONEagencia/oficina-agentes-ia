import assert from 'node:assert/strict';
import { test } from 'node:test';
import { armarPrompt, crearNucleo, leerRespuesta } from '../nucleo.mjs';
import { argumentos, herramientasDe } from '../ejecutor.mjs';

function almacenFalso() {
  const datos = { tareas: new Map(), agentes: new Map(), mensajes: new Map(), rutinas: new Map() };
  let n = 0;
  return {
    datos,
    crear: async (col, d) => { const id = `id${++n}`; datos[col].set(id, { id, ...d }); return id; },
    guardar: async (col, id, d) => { datos[col].set(id, { ...(datos[col].get(id) || { id }), ...d }); },
  };
}
const esperar = () => new Promise((r) => setTimeout(r, 20));
const nora = { id: 'a1', nombre: 'Nora', coordinador: true };
const leo = { id: 'a2', nombre: 'León', rol: 'ideas' };

test('lee pregunta y encargos de la respuesta', () => {
  const r = leerRespuesta('Hola\n```encargos\n[{"agente":"Leo","titulo":"X"}]\n```\n```pregunta\n¿Cuál?\n```');
  assert.equal(r.limpio, 'Hola');
  assert.equal(r.pregunta, '¿Cuál?');
  assert.equal(r.encargos.length, 1);
});

test('una lista de encargos dañada no rompe la entrega', () => {
  const r = leerRespuesta('Texto\n```encargos\nno es json\n```');
  assert.equal(r.limpio, 'Texto');
  assert.ok(r.aviso);
});

test('una tarea terminada pasa a revisión y libera al agente', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: 'Mi entrega', archivos: [] }) });
  nucleo.recibir('agentes', [leo]);
  nucleo.recibir('tareas', [{ id: 't1', titulo: 'Ideas', agenteId: 'a2', estado: 'pendiente', creada: 1 }]);
  await esperar();
  const t = almacen.datos.tareas.get('t1');
  assert.equal(t.estado, 'revision');
  assert.equal(t.entrega, 'Mi entrega');
  assert.equal(almacen.datos.agentes.get('a2').estado, 'libre');
});

test('si el agente pregunta, la tarea espera al dueño', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: '```pregunta\n¿Qué producto?\n```' }) });
  nucleo.recibir('agentes', [leo]);
  nucleo.recibir('tareas', [{ id: 't1', titulo: 'Ideas', agenteId: 'a2', estado: 'pendiente', creada: 1 }]);
  await esperar();
  const t = almacen.datos.tareas.get('t1');
  assert.equal(t.estado, 'pregunta');
  assert.equal(t.pregunta, '¿Qué producto?');
});

test('un fallo queda visible en la tarea y el agente queda libre', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => { throw new Error('límite de uso'); } });
  nucleo.recibir('agentes', [leo]);
  nucleo.recibir('tareas', [{ id: 't1', titulo: 'Ideas', agenteId: 'a2', estado: 'pendiente', creada: 1 }]);
  await esperar();
  assert.equal(almacen.datos.tareas.get('t1').estado, 'error');
  assert.match(almacen.datos.tareas.get('t1').error, /límite/);
  assert.equal(almacen.datos.agentes.get('a2').estado, 'libre');
});

test('el coordinador delega ignorando tildes y mayúsculas', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: 'Hecho\n```encargos\n[{"agente":"leon","titulo":"10 ideas"},{"agente":"Nadie","titulo":"Y"}]\n```' }) });
  nucleo.recibir('agentes', [nora, leo]);
  nucleo.recibir('tareas', [{ id: 't1', titulo: 'Plan', agenteId: 'a1', estado: 'pendiente', creada: 1 }]);
  await esperar();
  const creada = [...almacen.datos.tareas.values()].find((t) => t.titulo === '10 ideas');
  assert.equal(creada.agenteId, 'a2');
  const padre = almacen.datos.tareas.get('t1');
  assert.equal(padre.estado, 'lista');
  assert.match(padre.entrega, /Nadie/);
});

test('un agente que no es coordinador no puede delegar', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: 'Hecho\n```encargos\n[{"agente":"Nora","titulo":"Hackeo"}]\n```' }) });
  nucleo.recibir('agentes', [nora, leo]);
  nucleo.recibir('tareas', [{ id: 't1', titulo: 'Ideas', agenteId: 'a2', estado: 'pendiente', creada: 1 }]);
  await esperar();
  assert.equal([...almacen.datos.tareas.values()].filter((t) => t.titulo === 'Hackeo').length, 0);
  assert.equal(almacen.datos.tareas.get('t1').estado, 'revision');
});

test('un mismo agente nunca trabaja dos tareas a la vez', async () => {
  const almacen = almacenFalso();
  let simultaneas = 0;
  let maximo = 0;
  const nucleo = crearNucleo({
    almacen,
    concurrencia: 3,
    ejecutar: async () => { simultaneas++; maximo = Math.max(maximo, simultaneas); await esperar(); simultaneas--; return { texto: 'ok' }; },
  });
  nucleo.recibir('agentes', [leo]);
  nucleo.recibir('tareas', [
    { id: 't1', titulo: 'A', agenteId: 'a2', estado: 'pendiente', creada: 1 },
    { id: 't2', titulo: 'B', agenteId: 'a2', estado: 'pendiente', creada: 2 },
  ]);
  await esperar();
  assert.equal(maximo, 1);
});

test('el mensaje del chat llega al coordinador y crea encargos', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async ({ agente }) => { assert.equal(agente.id, 'a1'); return { texto: 'Le paso a León\n```encargos\n[{"agente":"León","titulo":"Ideas"}]\n```' }; } });
  nucleo.recibir('agentes', [nora, leo]);
  nucleo.recibir('mensajes', [{ id: 'm1', de: 'dueno', texto: 'Dame ideas', estado: 'nuevo', creado: 1 }]);
  await esperar();
  assert.equal(almacen.datos.mensajes.get('m1').estado, 'leido');
  const r = [...almacen.datos.mensajes.values()].find((m) => m.de === 'agente');
  assert.match(r.texto, /León/);
  assert.equal([...almacen.datos.tareas.values()].length, 1);
});

test('la rutina crea una sola tarea por día y respeta día y hora', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: 'ok' }) });
  const rutina = { id: 'r1', titulo: 'Ideas', agenteId: 'a2', dias: [1], hora: '08:00' };
  almacen.datos.rutinas.set('r1', rutina);
  nucleo.recibir('rutinas', [rutina]);
  await nucleo.revisarRutinas(new Date(2026, 10, 2, 7, 59)); // lunes, antes de la hora
  assert.equal(almacen.datos.tareas.size, 0);
  await nucleo.revisarRutinas(new Date(2026, 10, 3, 9, 0)); // martes
  assert.equal(almacen.datos.tareas.size, 0);
  await nucleo.revisarRutinas(new Date(2026, 10, 2, 8, 0)); // lunes, a la hora
  assert.equal(almacen.datos.tareas.size, 1);
  nucleo.recibir('rutinas', [almacen.datos.rutinas.get('r1')]);
  await nucleo.revisarRutinas(new Date(2026, 10, 2, 9, 0));
  assert.equal(almacen.datos.tareas.size, 1);
});

test('al reiniciar devuelve a la cola lo que quedó a medias', async () => {
  const almacen = almacenFalso();
  const nucleo = crearNucleo({ almacen, ejecutar: async () => ({ texto: 'ok' }) });
  nucleo.pausar(true);
  nucleo.recibir('agentes', [{ ...leo, estado: 'trabajando' }]);
  await nucleo.recuperar([{ id: 't1', titulo: 'A', agenteId: 'a2', estado: 'trabajando' }]);
  assert.equal(almacen.datos.tareas.get('t1').estado, 'pendiente');
  assert.equal(almacen.datos.agentes.get('a2').estado, 'libre');
});

test('el prompt incluye manual, cambios pedidos y reglas', () => {
  const p = armarPrompt({
    config: { nombre: 'Mi Oficina', negocio: 'Vendo pan' },
    agente: { ...leo, manual: 'MANUAL-LEO' },
    equipo: [leo],
    tarea: { titulo: 'T', entrega: 'ANTERIOR', feedback: 'MÁS CORTO' },
  });
  for (const texto of ['MANUAL-LEO', 'Vendo pan', 'ANTERIOR', 'MÁS CORTO', 'no órdenes']) assert.ok(p.includes(texto), texto);
});

test('sin web ni terminal por defecto, y descarta herramientas extra sospechosas', () => {
  assert.ok(!herramientasDe({}).some((h) => h.startsWith('Web')));
  assert.ok(argumentos({})[argumentos({}).indexOf('--disallowedTools') + 1].includes('Bash'));
  assert.ok(herramientasDe({ web: true }).includes('WebSearch'));
  assert.ok(!herramientasDe({ herramientasExtra: ['Bash; rm -rf /'] }).some((h) => h.includes('rm')));
  assert.ok(!argumentos({ modelo: 'x; rm' }).includes('--model'));
});
