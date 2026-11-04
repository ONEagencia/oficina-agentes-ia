import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useState } from 'react';
import { COLUMNAS, ETIQUETA, useOficina } from '../datos/oficina.jsx';
import NuevaTarea from './NuevaTarea.jsx';

function hace(ms) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return `hace ${Math.round(min / 1440)} d`;
}

function Detalle({ tarea, alCerrar }) {
  const { agentes, almacen } = useOficina();
  const [texto, setTexto] = useState('');
  const [copiado, setCopiado] = useState(false);
  const agente = agentes.find((a) => a.id === tarea.agenteId);

  const mover = async (cambios, nota) => {
    await almacen.guardar('tareas', tarea.id, { ...cambios, actualizada: Date.now(), historial: [...(tarea.historial || []), { en: Date.now(), texto: nota }].slice(-30) });
    alCerrar();
  };
  const copiar = async () => {
    await navigator.clipboard.writeText(tarea.entrega || '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="modal">
        <button className="cerrar" aria-label="Cerrar" onClick={alCerrar}>×</button>
        <span className={`estado estado-${tarea.estado}`}>{ETIQUETA[tarea.estado]}</span>
        <h2>{tarea.titulo}</h2>
        <p className="suave">{agente?.nombre || 'Sin agente'} · {hace(tarea.actualizada)}</p>
        {tarea.detalle && <p className="detalle">{tarea.detalle}</p>}

        {tarea.estado === 'pregunta' && (
          <div className="caja caja-marca">
            <b>{agente?.nombre} pregunta:</b>
            <p>{tarea.pregunta}</p>
            <textarea rows={3} autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Tu respuesta" />
            <button className="btn btn-marca" disabled={!texto.trim()} onClick={() => mover({ estado: 'cambios', respuesta: texto.trim() }, 'Respondiste la pregunta')}>Responder y continuar</button>
          </div>
        )}
        {tarea.estado === 'error' && (
          <div className="caja caja-error">
            <b>No se pudo completar</b><p>{tarea.error}</p>
            <button className="btn btn-suave" onClick={() => mover({ estado: 'pendiente', error: null }, 'Reintentaste la tarea')}>Reintentar</button>
          </div>
        )}
        {tarea.entrega && (
          <>
            <div className="entrega-cab"><h3>Entrega</h3><button className="btn btn-suave chico" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</button></div>
            {/* El texto viene de un agente que pudo leer páginas externas: siempre se limpia antes de mostrarlo. */}
            <div className="entrega" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(tarea.entrega)) }} />
          </>
        )}
        {tarea.archivos?.length > 0 && (
          <div className="archivos">
            <b>Archivos en tu computadora</b>
            <code>{tarea.carpeta}</code>
            <ul>{tarea.archivos.map((a) => <li key={a.nombre}>{a.nombre}</li>)}</ul>
          </div>
        )}
        {tarea.estado === 'revision' && (
          <div className="caja">
            <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Si hace falta, escribe qué cambiar" />
            <div className="fila">
              <button className="btn btn-marca" onClick={() => mover({ estado: 'lista' }, 'Aprobaste la entrega')}>Aprobar</button>
              <button className="btn btn-suave" disabled={!texto.trim()} onClick={() => mover({ estado: 'cambios', feedback: texto.trim() }, 'Pediste cambios')}>Pedir cambios</button>
            </div>
          </div>
        )}
        <details className="historial">
          <summary>Historial</summary>
          {(tarea.historial || []).map((h, i) => <p key={i} className="suave">{hace(h.en)} · {h.texto}</p>)}
          <button className="enlace-peligro" onClick={async () => { if (confirm('¿Borrar esta tarea?')) { await almacen.borrar('tareas', tarea.id); alCerrar(); } }}>Borrar tarea</button>
        </details>
      </div>
    </div>
  );
}

export default function Tareas() {
  const { tareas, agentes } = useOficina();
  const [abierta, setAbierta] = useState(null);
  const [nueva, setNueva] = useState(false);
  const [filtro, setFiltro] = useState('');
  const visibles = tareas.filter((t) => !filtro || t.agenteId === filtro);
  const actual = tareas.find((t) => t.id === abierta);

  return (
    <div className="tareas">
      <div className="cabecera">
        <h1>Tareas</h1>
        <div className="fila">
          <select aria-label="Filtrar por agente" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todo el equipo</option>
            {agentes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <button className="btn btn-marca" onClick={() => setNueva(true)}>Nueva tarea</button>
        </div>
      </div>
      <div className="tablero">
        {COLUMNAS.map((c) => {
          const lista = visibles.filter((t) => c.estados.includes(t.estado)).sort((a, b) => b.actualizada - a.actualizada);
          return (
            <section key={c.id} className="columna">
              <h3>{c.titulo} <span>{lista.length}</span></h3>
              {lista.length === 0 && <p className="vacio">Nada aquí</p>}
              {lista.map((t) => {
                const a = agentes.find((x) => x.id === t.agenteId);
                return (
                  <button key={t.id} className={`ficha ${t.estado === 'trabajando' ? 'viva' : ''}`} onClick={() => setAbierta(t.id)}>
                    <span className={`estado estado-${t.estado}`}>{ETIQUETA[t.estado]}</span>
                    <strong>{t.titulo}</strong>
                    <span className="ficha-pie">
                      <span className="mini" style={{ background: a?.color || '#555' }}>{a?.nombre?.[0] || '?'}</span>
                      {a?.nombre || 'Sin agente'}
                      <em>{hace(t.actualizada)}</em>
                    </span>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>
      {actual && <Detalle tarea={actual} alCerrar={() => setAbierta(null)} />}
      {nueva && <NuevaTarea alCerrar={() => setNueva(false)} />}
    </div>
  );
}
