// Telegram es opcional: pedirle cosas al coordinador desde el celular y recibir avisos.
const LIMITE = 3900;

export function crearTelegram({ token, dueno, alMensaje, resumen, log = console.log, ahora = () => Date.now() }) {
  const api = (metodo, cuerpo) => fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).then((r) => r.json());

  const enviar = async (chat, texto) => {
    for (let i = 0; i < texto.length; i += LIMITE) await api('sendMessage', { chat_id: chat, text: texto.slice(i, i + LIMITE) });
  };

  async function escuchar() {
    let desde = 0;
    let abierto = true;
    (async () => {
      while (abierto) {
        try {
          const r = await api('getUpdates', { offset: desde, timeout: 30 });
          for (const u of r.result || []) {
            desde = u.update_id + 1;
            const m = u.message;
            if (!m?.text) continue;
            if (String(m.from.id) !== String(dueno)) {
              // Solo responde el ID, para poder configurar TELEGRAM_DUENO. Nadie más puede dar órdenes.
              await enviar(m.chat.id, `Tu ID de Telegram es ${m.from.id}. Solo el dueño de la oficina puede dar órdenes.`);
              continue;
            }
            if (m.text === '/estado') { await enviar(m.chat.id, await resumen()); continue; }
            await alMensaje({ de: 'dueno', texto: m.text, estado: 'nuevo', origen: 'telegram', creado: ahora() });
          }
        } catch (e) {
          log('Telegram no responde, reintento en 30 s:', e.message);
          await new Promise((res) => setTimeout(res, 30_000));
        }
      }
    })();
    return () => { abierto = false; };
  }

  return { escuchar, avisar: (texto) => (dueno ? enviar(dueno, texto).catch(() => {}) : Promise.resolve()) };
}
