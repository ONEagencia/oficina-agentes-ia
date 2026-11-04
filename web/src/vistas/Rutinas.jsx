import { useState } from 'react';
import { useOficina } from '../datos/oficina.jsx';

const DIAS = [[1, 'L'], [2, 'M'], [3, 'X'], [4, 'J'], [5, 'V'], [6, 'S'], [7, 'D']];

function Editor({ rutina, alCerrar }) {
  const { agentes, almacen } = useOficina();
  const [f, setF] = useState(rutina || { titulo: '', detalle: '', agenteId: agentes[0]?.id || '', dias: [1], hora: '08:00', activa: true });
  const poner = (c) => (e) => setF({ ...f, [c]: e.target.value });
  const alternar = (d) => setF({ ...f, dias: f.dias.includes(d) ? f.dias.filter((x) => x !== d) : [...f.dias, d] });

  async function guardar(e) {
    e.preventDefault();
    const datos = { ...f, titulo: f.titulo.trim() };
    delete datos.id;
    if (rutina) await almacen.guardar('rutinas', rutina.id, datos);
    else await almacen.crear('rutinas', datos);
    alCerrar();
  }

  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <form className="modal modal-chico" onSubmit={guardar}>
        <button type="button" className="cerrar" aria-label="Cerrar" onClick={alCerrar}>×</button>
        <h2>{rutina ? 'Editar rutina' : 'Nueva rutina'}</h2>
        <label>Qué debe hacer<input autoFocus required value={f.titulo} onChange={poner('titulo')} placeholder="Ej. 5 ideas de contenido de la semana" /></label>
        <label>Instrucciones<textarea rows={4} value={f.detalle} onChange={poner('detalle')} /></label>
        <div className="dos">
          <label>Agente<select required value={f.agenteId} onChange={poner('agenteId')}>{agentes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
          <label>Hora<input type="time" required value={f.hora} onChange={poner('hora')} /></label>
        </div>
        <div className="dias" role="group" aria-label="Días">
          {DIAS.map(([d, l]) => <button type="button" key={d} aria-pressed={f.dias.includes(d)} className={f.dias.includes(d) ? 'sel' : ''} onClick={() => alternar(d)}>{l}</button>)}
        </div>
        <div className="fila entre">
          {rutina ? <button type="button" className="enlace-peligro" onClick={async () => { await almacen.borrar('rutinas', rutina.id); alCerrar(); }}>Borrar</button> : <span />}
          <button className="btn btn-marca" disabled={!f.dias.length}>Guardar</button>
        </div>
      </form>
    </div>
  );
}

export default function Rutinas() {
  const { rutinas, agentes, almacen } = useOficina();
  const [editar, setEditar] = useState(null);
  return (
    <div className="pagina">
      <div className="cabecera">
        <div><h1>Rutinas</h1><p className="suave">Trabajo que se repite solo. Corren cuando el motor está encendido; si estaba apagado, se crean al encenderlo.</p></div>
        <button className="btn btn-marca" disabled={!agentes.length} onClick={() => setEditar('nueva')}>Nueva rutina</button>
      </div>
      {rutinas.length === 0 && <p className="vacio grande">Aún no tienes rutinas. Empieza con algo que haces cada semana.</p>}
      <div className="lista">
        {rutinas.map((r) => {
          const a = agentes.find((x) => x.id === r.agenteId);
          return (
            <div key={r.id} className="rutina">
              <button className="rutina-texto" onClick={() => setEditar(r)}>
                <strong>{r.titulo}</strong>
                <span className="suave">{a?.nombre || 'Sin agente'} · {DIAS.filter(([d]) => r.dias?.includes(d)).map(([, l]) => l).join(' ')} · {r.hora}</span>
              </button>
              <label className="check"><input type="checkbox" checked={r.activa !== false} onChange={(e) => almacen.guardar('rutinas', r.id, { activa: e.target.checked })} /> Activa</label>
            </div>
          );
        })}
      </div>
      {editar && <Editor rutina={editar === 'nueva' ? null : editar} alCerrar={() => setEditar(null)} />}
    </div>
  );
}
