// Modo demo: una oficina en memoria, sin Firebase, para ver cómo funciona antes de instalar.
import roles from '../../../plantillas/roles.json';

const ahora = () => Date.now();
const equipo = [
  ['nora', 'Nora', 'coordinador', '#7c5cff'],
  ['leo', 'Leo', 'ideas', '#ff6b9d'],
  ['vera', 'Vera', 'guiones', '#3ecfb2'],
  ['max', 'Max', 'estrategia', '#ffb547'],
  ['iris', 'Iris', 'investigacion', '#4aa8ff'],
  ['teo', 'Teo', 'web', '#ff7a59'],
];

export function crearDemo() {
  const tablas = {
    agentes: new Map(equipo.map(([id, nombre, rol, color], i) => [id, {
      id, nombre, rol, color, orden: i, activo: true, estado: id === 'iris' ? 'trabajando' : 'libre', tareaActual: id === 'iris' ? 't2' : null,
      titulo: roles[rol].titulo, manual: roles[rol].manual, web: roles[rol].web, coordinador: !!roles[rol].coordinador,
    }])),
    tareas: new Map([
      ['t1', { id: 't1', titulo: '10 ideas de reels para noviembre', detalle: 'Enfocadas en la oferta de temporada.', agenteId: 'leo', prioridad: 'alta', estado: 'revision', creada: ahora() - 9e6, actualizada: ahora() - 6e5,
        entrega: '## 10 ideas para noviembre\n\n| Idea | Gancho | Puntaje |\n|---|---|---|\n| El error que te cuesta clientes | "Esto te está haciendo perder ventas" | 9 |\n| Antes y después real | "Mira lo que cambió en 30 días" | 8 |\n| Mito del sector | "Nadie te dice esto" | 8 |\n\nDatos de ejemplo del modo demo.', historial: [{ en: ahora() - 6e5, texto: 'Leo entregó' }] }],
      ['t2', { id: 't2', titulo: 'Analizar a 3 competidores', detalle: 'Qué ofrecen, a qué precio y qué hacen en redes.', agenteId: 'iris', prioridad: 'media', estado: 'trabajando', creada: ahora() - 3e6, actualizada: ahora() - 1e5, historial: [] }],
      ['t3', { id: 't3', titulo: 'Guion del reel de lanzamiento', detalle: 'Máximo 45 segundos.', agenteId: 'vera', prioridad: 'media', estado: 'pregunta', pregunta: '¿Cuál es el precio de lanzamiento que puedo mencionar?', creada: ahora() - 2e6, actualizada: ahora() - 3e5, historial: [] }],
      ['t4', { id: 't4', titulo: 'Plan de marketing del mes', detalle: '', agenteId: 'max', prioridad: 'baja', estado: 'lista', entrega: 'Plan aprobado.', creada: ahora() - 9e7, actualizada: ahora() - 8e7, historial: [] }],
    ]),
    mensajes: new Map([
      ['m1', { id: 'm1', de: 'agente', agenteId: 'nora', texto: '¡Hola! Soy Nora. Pídeme lo que necesites y lo reparto en el equipo. Esto es una demo: las respuestas son de ejemplo.', estado: 'respuesta', creado: ahora() - 1e6 }],
    ]),
    rutinas: new Map([
      ['r1', { id: 'r1', titulo: '5 ideas de contenido de la semana', detalle: 'Basadas en lo que está pasando en el sector.', agenteId: 'leo', dias: [1], hora: '08:00', activa: true }],
    ]),
  };
  const docs = {
    'config/oficina': { nombre: 'Oficina de Mi Marca', negocio: 'Vendo un servicio a dueños de negocio.', tono: 'Cercano y directo', color: '#7c5cff', logo: '' },
    'motor/estado': { ultimoLatido: ahora(), ocupado: 1 },
  };
  const oyentes = {};
  const oyentesDoc = {};
  const avisar = (col) => (oyentes[col] || []).forEach((cb) => cb([...tablas[col].values()]));
  const avisarDoc = (ruta) => (oyentesDoc[ruta] || []).forEach((cb) => cb(docs[ruta]));

  setInterval(() => { docs['motor/estado'].ultimoLatido = ahora(); avisarDoc('motor/estado'); }, 20_000);

  const api = {
    alCambiarSesion(cb) { setTimeout(() => cb({ email: 'demo@oficina.ia', displayName: 'Modo demo' }), 0); return () => {}; },
    entrar: async () => {},
    salir: async () => { location.reload(); },
    escuchar(col, cb) {
      (oyentes[col] ||= []).push(cb);
      cb([...tablas[col].values()]);
      return () => { oyentes[col] = oyentes[col].filter((x) => x !== cb); };
    },
    escucharDoc(col, id, cb) {
      const ruta = `${col}/${id}`;
      (oyentesDoc[ruta] ||= []).push(cb);
      cb(docs[ruta] || null);
      return () => { oyentesDoc[ruta] = oyentesDoc[ruta].filter((x) => x !== cb); };
    },
    async crear(col, datos) {
      const id = `${col[0]}${Math.random().toString(36).slice(2, 8)}`;
      tablas[col].set(id, { id, ...datos });
      avisar(col);
      simular(col, id);
      return id;
    },
    async guardar(col, id, datos) {
      tablas[col].set(id, { ...tablas[col].get(id), ...datos });
      avisar(col);
      simular(col, id);
    },
    async fijar(col, id, datos) {
      const ruta = `${col}/${id}`;
      docs[ruta] = { ...docs[ruta], ...datos };
      avisarDoc(ruta);
    },
    async borrar(col, id) { tablas[col].delete(id); avisar(col); },
  };

  // Hace de motor: mueve las tareas para que se vea el flujo completo.
  function simular(col, id) {
    if (col === 'mensajes') {
      const m = tablas.mensajes.get(id);
      if (m?.de !== 'dueno' || m.estado !== 'nuevo') return;
      m.estado = 'leido';
      setTimeout(() => api.crear('mensajes', { de: 'agente', agenteId: 'nora', texto: `Recibido: "${m.texto}". En la oficina real, aquí repartiría el trabajo entre tu equipo.`, estado: 'respuesta', creado: ahora() }), 1600);
      return;
    }
    if (col !== 'tareas') return;
    const t = tablas.tareas.get(id);
    if (!t || !['pendiente', 'cambios'].includes(t.estado)) return;
    const agente = tablas.agentes.get(t.agenteId);
    setTimeout(() => {
      api.guardar('tareas', id, { estado: 'trabajando', actualizada: ahora() });
      if (agente) api.guardar('agentes', agente.id, { estado: 'trabajando', tareaActual: id });
    }, 1200);
    setTimeout(() => {
      api.guardar('tareas', id, { estado: 'revision', entrega: `## ${t.titulo}\n\nEsta es una entrega de ejemplo del modo demo. En tu oficina, aquí verás el trabajo real de ${agente?.nombre || 'tu agente'}.`, actualizada: ahora() });
      if (agente) api.guardar('agentes', agente.id, { estado: 'libre', tareaActual: null });
    }, 9000);
  }

  return api;
}
