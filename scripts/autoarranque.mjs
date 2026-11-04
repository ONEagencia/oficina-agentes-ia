// Hace que el motor arranque solo al iniciar sesión. Para quitarlo: npm run autoarranque -- quitar
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motor = path.join(raiz, 'engine');
const quitar = process.argv[2] === 'quitar';
const NOMBRE = 'OficinaAgentesIA';

if (process.platform === 'win32') {
  const carpeta = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const archivo = path.join(carpeta, `${NOMBRE}.vbs`);
  if (quitar) {
    rmSync(archivo, { force: true });
    console.log('Listo: el motor ya no arranca solo.');
  } else {
    // Sin ventana: si el motor se cae, vuelve a intentarlo a los 30 segundos.
    const bucle = path.join(motor, 'arrancar-motor.cmd');
    writeFileSync(bucle, `@echo off\r\ncd /d "%~dp0"\r\n:inicio\r\ncall npm start >> motor.log 2>&1\r\ntimeout /t 30 /nobreak >nul\r\ngoto inicio\r\n`);
    writeFileSync(archivo, `CreateObject("WScript.Shell").Run """${bucle}""", 0, False\r\n`);
    console.log(`Listo: el motor arrancará al iniciar sesión.\nLos registros quedan en ${path.join(motor, 'motor.log')}`);
  }
} else if (process.platform === 'darwin') {
  const dir = path.join(homedir(), 'Library', 'LaunchAgents');
  const archivo = path.join(dir, `ia.oficina.motor.plist`);
  if (quitar) {
    spawnSync('launchctl', ['unload', archivo]);
    rmSync(archivo, { force: true });
    console.log('Listo: el motor ya no arranca solo.');
  } else {
    mkdirSync(dir, { recursive: true });
    const ruta = process.env.PATH;
    writeFileSync(archivo, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ia.oficina.motor</string>
  <key>ProgramArguments</key><array><string>${process.execPath}</string><string>--env-file=.env</string><string>index.mjs</string></array>
  <key>WorkingDirectory</key><string>${motor}</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>${ruta}</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${path.join(motor, 'motor.log')}</string>
  <key>StandardErrorPath</key><string>${path.join(motor, 'motor.log')}</string>
</dict></plist>
`);
    spawnSync('launchctl', ['load', archivo]);
    console.log('Listo: el motor arrancará al iniciar sesión.');
  }
} else {
  console.log('En Linux usa un servicio de systemd que ejecute "npm start" dentro de engine/.');
}
