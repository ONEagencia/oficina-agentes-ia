---
name: montar-oficina
description: Monta de punta a punta la oficina de agentes de IA de esta persona. Entrevista sobre su negocio, diseña el equipo y le escribe un manual a cada agente, crea el proyecto de Firebase, publica la app y enciende el motor hasta ver la primera entrega. Úsala cuando digan /montar-oficina, "instala la oficina", "configura esto" o abran este repositorio sin haberlo instalado.
---

# Montar la oficina

Tu trabajo termina cuando la persona ve **la primera entrega real de un agente sobre su negocio** dentro de su oficina publicada. No antes.

Quien instala esto se maneja con herramientas digitales, aunque no programe. No le expliques qué es una terminal, pero sí di qué hace cada paso y por qué. Avanza por fases, en español y con mensajes cortos. Muestra al inicio de cada fase en qué número va (de 6).

## Reglas de seguridad

- Nunca pidas, muestres ni leas `engine/.env`. La contraseña del motor la genera `npm run configurar` y nadie necesita verla.
- La configuración web de Firebase (`apiKey`, `appId`…) es pública: esa sí la puedes manejar.
- Los inicios de sesión los hace la persona en su navegador.
- Antes de crear algo en su cuenta de Firebase, di qué vas a crear y confírmalo.
- Si un comando falla, lee el error, explica la causa en una línea y resuélvelo. `npm run doctor` diagnostica la instalación.

## Fase 1 · Revisar el terreno

1. Comprueba Node 20.6 o superior (`node --version`). Si falta, indica instalar la versión LTS de nodejs.org.
2. Corre `npm install`.
3. Recuerda lo que hace falta: cuenta de Google y plan de pago de Claude. Los agentes consumen el límite de ese plan.
4. Si `engine/.env` y `oficina.config.json` ya existen, la oficina ya está instalada: corre `npm run doctor` y pregunta qué quiere cambiar en vez de empezar de cero.
5. Ofrece ver la demo con `npm run demo` si quiere conocerla antes de instalar. Es opcional.

## Fase 2 · Entrevista

Pregunta en bloques, no todo a la vez:

- **Negocio:** qué vende, a quién, qué lo hace distinto, cómo vende hoy.
- **Voz:** tono de comunicación y 2 o 3 cosas que nunca diría su marca.
- **Marca:** nombre de la oficina, color principal en hexadecimal y logo (opcional). Si da un archivo, cópialo a `web/public/logo.png` y usa `/logo.png`.
- **Dueños:** el correo de Google con el que va a entrar y cualquier otra persona autorizada.
- **Zona horaria**, para las rutinas (formato `America/Bogota`).
- **Dolor:** las 3 tareas que más tiempo le quitan cada semana.

Con eso **propón el equipo**: de 3 a 6 agentes, siempre con uno de rol `coordinador`. Usa los roles de `plantillas/roles.json`. Por cada uno explica qué le quita de encima a la persona. Ella decide cuántos y qué nombre lleva cada uno.

## Fase 3 · Escribir los manuales

Este paso separa una oficina útil de un juguete: no uses la plantilla tal cual.

Por cada agente parte del manual de su rol en `plantillas/roles.json` y **reescríbelo con lo que aprendiste**: su producto real, su cliente, su tono, las cosas que nunca diría. Mantén las 6 partes: OBJETIVO, CUÁNDO SE ACTIVA, PASOS, NUNCA HAGAS, PREGÚNTAME SI y ENTREGA. Conserva siempre en NUNCA HAGAS: no publicar, no enviar mensajes, no gastar dinero, no inventar datos.

Muestra un manual de ejemplo y pide correcciones antes de escribir los demás.

Define también la `primeraTarea`: un encargo corto y concreto para un agente que no sea el coordinador, relacionado con su dolor principal, que se resuelva en menos de 5 minutos.

## Fase 4 · Firebase

Usamos Firebase porque con una sola cuenta de Google incluye base de datos, inicio de sesión y hosting. El plan gratuito Spark alcanza y no pide tarjeta.

La persona inicia sesión escribiendo en este chat:

```
! npx -y firebase-tools@latest login
```

Luego, tú:

1. Propón un ID único (minúsculas, números y guiones) y crea el proyecto, tras confirmarlo:
   `npx -y firebase-tools@latest projects:create <id> --display-name "<nombre>"`
2. Crea la app web: `npx -y firebase-tools@latest apps:create web "<nombre>" --project <id>`
3. Lee su configuración: `npx -y firebase-tools@latest apps:sdkconfig web --project <id>`

Lo demás se hace en la consola (el comando para crear la base falla en proyectos nuevos hasta que se propaga la API). Dale cada enlace y espera a que confirme.

**Inicio de sesión:** `https://console.firebase.google.com/project/<id>/authentication/providers`

1. **Comenzar**, si es la primera vez.
2. Activar **Correo electrónico/contraseña** (solo el primer interruptor): lo usa únicamente el motor.
3. Activar **Google** (pide elegir un correo de asistencia).

**Base de datos:** `https://console.firebase.google.com/project/<id>/firestore`

1. **Crear base de datos**, edición **Standard**.
2. Región: la más cercana a la persona. No se puede cambiar después.
3. Modo de producción. Tus reglas de seguridad reemplazan las de ejemplo en el siguiente paso.

## Fase 5 · Configurar y publicar

1. Escribe `oficina.config.json` en la raíz, siguiendo `oficina.config.ejemplo.json`, con la configuración de Firebase, la marca, los dueños, los agentes con su `manual` y la `primeraTarea`:
   `"primeraTarea": { "agente": "Nombre", "titulo": "…", "detalle": "…" }`
2. `npm run configurar`: genera los archivos de entorno y las reglas de seguridad, y crea la cuenta del motor.
3. `npm run publicar`: publica la app y las reglas.
4. `npm run sembrar`: carga la marca y el equipo. Las reglas tardan hasta un minuto en aplicarse; el comando espera solo y avisa.
5. Dale la URL `https://<id>.web.app` y pídele que entre con su Google.

## Fase 6 · Encender y ver la primera entrega

1. Corre `npm run doctor`. Resuelve lo que marque.
2. Pídele que abra una terminal aparte en esta carpeta y corra `npm run motor`, para que quede a la vista y siga vivo cuando cierre este chat.
3. Debe ver "Motor encendido" en la app. El agente de la primera tarea se pondrá a trabajar en su escritorio.
4. Cuando la entrega llegue a **Te toca**, pídele que la abra y que la apruebe o pida un cambio. Ese es el final de la instalación.

Cierra con este resumen: su URL, cómo encender el motor, dónde corregir un manual (Equipo) y estos 3 siguientes pasos:

- `npm run autoarranque` para que el motor arranque solo al prender la computadora.
- Crear su primera rutina semanal en **Rutinas**.
- Conectar Telegram para pedir cosas desde el celular (abajo).

Por último, recomiéndale cerrar el registro cuando ya haya entrado con su Google: Authentication → Configuración → Acciones del usuario → desmarcar "Habilitar creación". Las reglas ya impiden que un extraño vea sus datos; esto evita además cuentas ajenas. Si después autoriza a otra persona, tendrá que reactivarlo un momento.

## Si pide Telegram

1. En Telegram, con `@BotFather`: `/newbot`. Le entrega un token.
2. Abre `engine/.env` en su editor para que agregue la línea `TELEGRAM_TOKEN=…` ella misma (el token no debe pasar por este chat) y reinicie el motor.
3. Que le escriba al bot: responderá con su ID.
4. Ese ID no es secreto: agrega `TELEGRAM_DUENO=<id>` a `engine/.env` con un comando que no imprima el archivo, y reinicia el motor. Desde ahí solo le obedece a esa persona.

## Si pide conectar sus herramientas

Los agentes pueden usar los conectores de su Claude Code (por ejemplo, datos de redes o anuncios). Cada agente tiene el campo **Herramientas extra** en Equipo → Avanzado, con el formato `mcp__<servidor>__*`. Explica el riesgo antes de dar acceso de escritura a algo real: un agente no debería poder publicar ni gastar dinero sin aprobación.
