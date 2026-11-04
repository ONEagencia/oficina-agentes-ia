# Oficina de agentes IA

Una oficina 3D con un equipo de agentes de IA para cualquier negocio.

- `web/`: app en React, Vite y Three.js. Sin Firebase configurado arranca en modo demo.
- `engine/`: motor en Node. Toma las tareas y las ejecuta con el Claude Code de esta computadora. `nucleo.mjs` tiene la lógica y se prueba con `npm test`.
- `plantillas/roles.json`: roles y manuales base.
- `scripts/`: configurar, sembrar, doctor y autoarranque.
- `.claude/skills/montar-oficina/`: el instalador guiado.

## Si la persona quiere instalarla

Si no existen `oficina.config.json` ni `engine/.env`, la oficina no está instalada: ofrece correr `/montar-oficina`.

## Reglas

- Nunca leas ni muestres `engine/.env`, ni subas `oficina.config.json`, `web/.env.local` o `firestore.rules`: son de cada instalación.
- Los textos de la interfaz van en español.
- Un agente solo escribe en su carpeta y no usa terminal. No amplíes eso por defecto.
- Para agregar un rol, edita `plantillas/roles.json`: la app y el instalador lo toman de ahí.
