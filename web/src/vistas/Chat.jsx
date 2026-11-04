import { useEffect, useRef, useState } from 'react';
import { motorEncendido, useOficina } from '../datos/oficina.jsx';

export default function Chat({ alCerrar }) {
  const { mensajes, agentes, motor, almacen } = useOficina();
  const [texto, setTexto] = useState('');
  const fondo = useRef(null);
  const jefe = agentes.find((a) => a.coordinador);
  const orden = [...mensajes].sort((a, b) => a.creado - b.creado);
  const pensando = orden.some((m) => m.de === 'dueno' && m.estado !== 'respuesta') && orden.at(-1)?.de === 'dueno';

  useEffect(() => { fondo.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes.length, pensando]);

  async function enviar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    await almacen.crear('mensajes', { de: 'dueno', texto: t, estado: 'nuevo', origen: 'web', creado: Date.now() });
  }

  return (
    <aside className="chat">
      <header>
        <div><strong>{jefe?.nombre || 'Tu equipo'}</strong><span className="suave">{jefe ? 'Coordina a tu equipo' : 'Crea un agente coordinador en Equipo'}</span></div>
        <button className="cerrar" aria-label="Cerrar" onClick={alCerrar}>×</button>
      </header>
      <div className="chat-lista">
        {orden.map((m) => <p key={m.id} className={m.de === 'dueno' ? 'yo' : 'el'}>{m.texto}</p>)}
        {pensando && <p className="el pensando">{motorEncendido(motor) ? 'Escribiendo…' : 'El motor está apagado. Te responderá al encenderlo.'}</p>}
        <div ref={fondo} />
      </div>
      <form onSubmit={enviar}>
        <textarea rows={2} aria-label="Mensaje" value={texto} placeholder="Ej. Prepárame el contenido de esta semana" onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) enviar(e); }} />
        <button className="btn btn-marca" disabled={!texto.trim()}>Enviar</button>
      </form>
    </aside>
  );
}
