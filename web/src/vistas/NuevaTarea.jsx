import { useState } from 'react';
import { useOficina } from '../datos/oficina.jsx';

export default function NuevaTarea({ agenteId, alCerrar }) {
  const { agentes, almacen } = useOficina();
  const [f, setF] = useState({ titulo: '', detalle: '', agenteId: agenteId || agentes[0]?.id || '', prioridad: 'media' });
  const poner = (c) => (e) => setF({ ...f, [c]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    const ahora = Date.now();
    await almacen.crear('tareas', { ...f, titulo: f.titulo.trim(), estado: 'pendiente', origen: 'dueno', creada: ahora, actualizada: ahora, historial: [{ en: ahora, texto: 'Creaste la tarea' }] });
    alCerrar();
  }

  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <form className="modal modal-chico" onSubmit={crear}>
        <button type="button" className="cerrar" aria-label="Cerrar" onClick={alCerrar}>×</button>
        <h2>Nueva tarea</h2>
        <label>Qué necesitas<input autoFocus required maxLength={200} value={f.titulo} onChange={poner('titulo')} placeholder="Ej. 5 ideas de reels para esta semana" /></label>
        <label>Contexto y formato de entrega<textarea rows={5} value={f.detalle} onChange={poner('detalle')} placeholder="Mientras más claro, mejor sale a la primera." /></label>
        <div className="dos">
          <label>Agente
            <select required value={f.agenteId} onChange={poner('agenteId')}>
              {agentes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </label>
          <label>Prioridad
            <select value={f.prioridad} onChange={poner('prioridad')}>
              <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
            </select>
          </label>
        </div>
        <button className="btn btn-marca ancho" disabled={!f.agenteId}>Crear tarea</button>
      </form>
    </div>
  );
}
