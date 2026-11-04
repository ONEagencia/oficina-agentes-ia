// Convierte oficina.config.json en todo lo que la instalación necesita.
// La contraseña del motor se genera aquí y va directo a engine/.env: nunca se imprime.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...p) => path.join(raiz, ...p);
const parar = (m) => { console.error(`\n✖ ${m}\n`); process.exit(1); };

if (!existsSync(ruta('oficina.config.json'))) parar('Falta oficina.config.json. Copia oficina.config.ejemplo.json o corre /montar-oficina.');
const cfg = JSON.parse(readFileSync(ruta('oficina.config.json'), 'utf8'));
const fb = cfg.firebase || {};
for (const c of ['apiKey', 'authDomain', 'projectId', 'appId']) if (!fb[c]) parar(`Falta firebase.${c} en oficina.config.json.`);
const duenos = (cfg.duenos || []).map((d) => String(d).trim().toLowerCase()).filter(Boolean);
if (!duenos.length) parar('Agrega al menos un correo en "duenos".');
if (duenos.some((d) => !/^[^@\s"]+@[^@\s"]+\.[^@\s"]+$/.test(d))) parar('Hay un correo inválido en "duenos".');

function leerEnv(archivo) {
  if (!existsSync(archivo)) return {};
  return Object.fromEntries(readFileSync(archivo, 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  }));
}

async function crearCuentaMotor() {
  const [usuario, dominio] = duenos[0].split('@');
  // Un alias del correo del dueño: no hay que crear ningún buzón nuevo.
  const email = `${usuario}+motor-${randomBytes(3).toString('hex')}@${dominio}`;
  const password = randomBytes(24).toString('base64url');
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${fb.apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });
  const d = await r.json();
  if (!r.ok) {
    const c = d.error?.message || 'ERROR';
    if (c.startsWith('OPERATION_NOT_ALLOWED')) parar('Activa "Correo electrónico/contraseña" en Firebase: Authentication → Método de acceso.');
    if (c.startsWith('CONFIGURATION_NOT_FOUND')) parar('Activa Authentication en tu proyecto de Firebase: Authentication → Comenzar.');
    parar(`Firebase no creó la cuenta del motor: ${c}`);
  }
  return { email, password, uid: d.localId };
}

const envMotor = leerEnv(ruta('engine', '.env'));
const mismaBase = envMotor.FIREBASE_PROJECT_ID === fb.projectId;
const cuenta = mismaBase && envMotor.MOTOR_UID
  ? { email: envMotor.MOTOR_EMAIL, password: envMotor.MOTOR_PASSWORD, uid: envMotor.MOTOR_UID }
  : await crearCuentaMotor();

const nuevoEnv = {
  ...envMotor,
  FIREBASE_API_KEY: fb.apiKey,
  FIREBASE_AUTH_DOMAIN: fb.authDomain,
  FIREBASE_PROJECT_ID: fb.projectId,
  FIREBASE_APP_ID: fb.appId,
  MOTOR_EMAIL: cuenta.email,
  MOTOR_PASSWORD: cuenta.password,
  MOTOR_UID: cuenta.uid,
};
if (cfg.zonaHoraria) nuevoEnv.TZ = cfg.zonaHoraria;
writeFileSync(ruta('engine', '.env'), `${Object.entries(nuevoEnv).map(([k, v]) => `${k}=${v}`).join('\n')}\n`, { mode: 0o600 });

writeFileSync(ruta('web', '.env.local'), [
  `VITE_FIREBASE_API_KEY=${fb.apiKey}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${fb.authDomain}`,
  `VITE_FIREBASE_PROJECT_ID=${fb.projectId}`,
  `VITE_FIREBASE_APP_ID=${fb.appId}`,
  '',
].join('\n'));

writeFileSync(ruta('.firebaserc'), `${JSON.stringify({ projects: { default: fb.projectId } }, null, 2)}\n`);

const reglas = readFileSync(ruta('firestore.rules.plantilla'), 'utf8')
  .replace('__DUENOS__', duenos.map((d) => `"${d}"`).join(', '))
  .replace('__MOTOR_UID__', cuenta.uid);
writeFileSync(ruta('firestore.rules'), reglas);

console.log('✔ Configuración lista: web/.env.local, engine/.env, .firebaserc y firestore.rules');
console.log('  Sigue con: npm run publicar  y luego  npm run sembrar');
