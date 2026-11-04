// Revisa la instalación y dice exactamente qué falta. No muestra ninguna clave.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallas = 0;
const bien = (m) => console.log(`✔ ${m}`);
const mal = (m, ayuda) => { fallas++; console.log(`✖ ${m}\n    → ${ayuda}`); };

const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor > 20 || (mayor === 20 && menor >= 6)) bien(`Node ${process.versions.node}`);
else mal(`Node ${process.versions.node} es muy antiguo`, 'Instala la versión LTS desde nodejs.org.');

const claude = spawnSync(process.env.CLAUDE_BIN || 'claude', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
if (claude.status === 0) bien(`Claude Code ${claude.stdout.trim()}`);
else mal('No encuentro Claude Code', 'Instálalo desde claude.com/claude-code e inicia sesión.');

for (const [archivo, ayuda] of [
  ['oficina.config.json', 'Corre /montar-oficina dentro de Claude Code.'],
  ['web/.env.local', 'Corre: npm run configurar'],
  ['engine/.env', 'Corre: npm run configurar'],
  ['firestore.rules', 'Corre: npm run configurar'],
  ['node_modules', 'Corre: npm install'],
]) {
  if (existsSync(path.join(raiz, archivo))) bien(archivo);
  else mal(`Falta ${archivo}`, ayuda);
}

const envRuta = path.join(raiz, 'engine', '.env');
if (existsSync(envRuta)) {
  for (const l of readFileSync(envRuta, 'utf8').split(/\r?\n/)) {
    const i = l.indexOf('=');
    if (i > 0 && !process.env[l.slice(0, i)]) process.env[l.slice(0, i)] = l.slice(i + 1);
  }
  try {
    const { conectar } = await import('../engine/almacen.mjs');
    const almacen = await conectar();
    bien('El motor puede entrar a Firebase');
    const leer = (col) => new Promise((res, rej) => { const fin = almacen.escuchar(col, (l) => { fin(); res(l); }, rej); });
    const agentes = await leer('agentes');
    if (agentes.length) bien(`${agentes.length} agentes en la oficina`);
    else mal('La oficina no tiene agentes', 'Corre: npm run sembrar');
    if (agentes.length && !agentes.some((a) => a.coordinador)) mal('No hay coordinador', 'Crea uno en Equipo para que el chat funcione.');
  } catch (e) {
    const c = String(e.code || e.message);
    if (c.includes('permission-denied')) mal('Firebase rechazó al motor', 'Publica las reglas: npm run publicar');
    else if (c.includes('invalid-credential') || c.includes('user-not-found')) mal('La cuenta del motor no entra', 'Revisa que siga existiendo en Authentication → Usuarios, o borra engine/.env y corre: npm run configurar');
    else mal(`Firebase respondió: ${c}`, 'Revisa tu conexión y la configuración del proyecto.');
  }
}

console.log(fallas ? `\n${fallas} cosa(s) por resolver.` : '\nTodo en orden. Enciende la oficina con: npm run motor');
process.exit(fallas ? 1 : 0);
