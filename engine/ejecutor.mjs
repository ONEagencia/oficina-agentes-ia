// Ejecuta a un agente con el Claude Code de esta computadora, en su propia carpeta y con permisos mínimos.
import { spawn } from 'node:child_process';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const MINUTOS_MAX = Number(process.env.MINUTOS_POR_TAREA || 20);
export const CARPETA_BASE = process.env.CARPETA_ENTREGAS || path.join(homedir(), 'Oficina IA', 'entregas');

const seguro = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().slice(0, 60) || 'tarea';

export const BLOQUEADAS = ['Bash', 'PowerShell', 'NotebookEdit', 'Agent', 'Task'];

/** Solo lee y escribe en su carpeta y, si su rol lo pide, busca en internet. Sin terminal. */
export function herramientasDe(agente) {
  const lista = ['Read(./**)', 'Glob', 'Grep', 'Write(./**)', 'Edit(./**)'];
  if (agente.web) lista.push('WebSearch', 'WebFetch');
  for (const extra of agente.herramientasExtra || []) if (/^[\w*:()./-]+$/.test(extra)) lista.push(extra);
  return lista;
}

export function argumentos(agente) {
  // El bloqueo explícito gana sobre cualquier permiso que la persona tenga en su Claude Code.
  const args = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', herramientasDe(agente).join(','), '--disallowedTools', BLOQUEADAS.join(',')];
  if (agente.modelo && /^[\w.-]+$/.test(agente.modelo)) args.push('--model', agente.modelo);
  return args;
}

async function listarArchivos(carpeta) {
  const salida = [];
  for (const nombre of await readdir(carpeta).catch(() => [])) {
    if (nombre.startsWith('.')) continue;
    const s = await stat(path.join(carpeta, nombre)).catch(() => null);
    if (s?.isFile()) salida.push({ nombre, bytes: s.size });
  }
  return salida;
}

export async function ejecutar({ prompt, agente, tarea }) {
  const carpeta = path.join(CARPETA_BASE, seguro(agente.nombre), `${seguro(tarea.titulo)}-${String(tarea.id).slice(-6)}`);
  await mkdir(carpeta, { recursive: true });
  const binario = process.env.CLAUDE_BIN || 'claude';
  const enWindows = process.platform === 'win32';
  // En Windows `claude` puede ser un .cmd y necesita la consola; las comillas protegen las reglas con paréntesis.
  const args = argumentos(agente).map((a) => (enWindows ? `"${a}"` : a));

  const texto = await new Promise((resolve, reject) => {
    const hijo = spawn(enWindows ? `"${binario}"` : binario, args, { cwd: carpeta, shell: enWindows, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    let err = '';
    const reloj = setTimeout(() => { hijo.kill(); reject(new Error(`Superó ${MINUTOS_MAX} minutos`)); }, MINUTOS_MAX * 60_000);
    hijo.stdout.on('data', (d) => { out += d; });
    hijo.stderr.on('data', (d) => { err += d; });
    hijo.on('error', (e) => { clearTimeout(reloj); reject(new Error(`No pude abrir Claude Code: ${e.message}`)); });
    hijo.on('close', (codigo) => {
      clearTimeout(reloj);
      let datos = null;
      try { datos = JSON.parse(out); } catch { /* se reporta abajo */ }
      if (datos?.is_error) return reject(new Error(datos.result || 'Claude Code devolvió un error'));
      if (codigo !== 0 && !datos) return reject(new Error((err || out || `Salió con código ${codigo}`).slice(0, 400)));
      resolve(datos?.result ?? out);
    });
    hijo.stdin.end(prompt);
  });
  return { texto, carpeta, archivos: await listarArchivos(carpeta) };
}
