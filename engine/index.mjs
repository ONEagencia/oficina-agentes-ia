// Motor de la oficina: mantenlo encendido y tus agentes trabajan.
import { conectar } from './almacen.mjs';
import { CARPETA_BASE, ejecutar } from './ejecutor.mjs';
import { crearNucleo } from './nucleo.mjs';
import { crearTelegram } from './telegram.mjs';

process.noDeprecation = true; // Los argumentos del ejecutor son fijos o validados; el aviso de Node solo confunde.
const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);

function salirConError(e) {
  console.error(`\nNo pude iniciar el motor: ${e.code || e.message}`);
  console.error('Corre "npm run doctor" para ver qué falta.\n');
  process.exit(1);
}

const almacen = await conectar().catch(salirConError);
log('Conectado a Firebase. Las entregas se guardan en:', CARPETA_BASE);

let telegram = null;
const nucleo = crearNucleo({
  almacen,
  ejecutar,
  log,
  concurrencia: Number(process.env.AGENTES_A_LA_VEZ || 2),
  avisar: (t) => telegram?.avisar(t) ?? Promise.resolve(),
});

if (process.env.TELEGRAM_TOKEN) {
  telegram = crearTelegram({
    token: process.env.TELEGRAM_TOKEN,
    dueno: process.env.TELEGRAM_DUENO,
    log,
    alMensaje: (m) => almacen.crear('mensajes', m),
    resumen: async () => {
      const { agentes, tareas } = nucleo.estado;
      const trabajando = agentes.filter((a) => a.estado === 'trabajando').map((a) => a.nombre);
      const revisar = tareas.filter((t) => t.estado === 'revision' || t.estado === 'pregunta').length;
      return `Trabajando: ${trabajando.join(', ') || 'nadie'}\nPor revisar: ${revisar}`;
    },
  });
  await telegram.escuchar();
  log('Telegram conectado.');
}

// La primera lectura de tareas sirve para retomar lo que quedó a medias.
let primeraLectura = true;
const alFallar = (e) => log('Se perdió una suscripción:', e.code || e.message);
almacen.escucharDoc('config', 'oficina', (c) => nucleo.recibirConfig(c), alFallar);
almacen.escuchar('agentes', (l) => nucleo.recibir('agentes', l), alFallar);
almacen.escuchar('rutinas', (l) => nucleo.recibir('rutinas', l), alFallar);
almacen.escuchar('mensajes', (l) => nucleo.recibir('mensajes', l), alFallar);
almacen.escuchar('tareas', async (lista) => {
  if (primeraLectura) {
    primeraLectura = false;
    await nucleo.recuperar(lista);
  }
  nucleo.recibir('tareas', lista);
}, alFallar);

async function latido() {
  await almacen.fijar('motor', 'estado', { ultimoLatido: Date.now(), ocupado: nucleo.ocupado().length }).catch((e) => log('Latido falló:', e.code || e.message));
}
await latido();
setInterval(latido, 30_000);
setInterval(() => nucleo.revisarRutinas().catch((e) => log('Rutinas:', e.message)), 60_000);

log('Motor encendido. Déjame abierto mientras tus agentes trabajan (Ctrl+C para apagar).');
process.on('SIGINT', () => { log('Motor apagado.'); process.exit(0); });
