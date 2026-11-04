import { useEffect, useRef, useState } from 'react';
import { ETIQUETA, useOficina } from '../datos/oficina.jsx';
import { crearOficina3D } from '../escena/oficina3d.js';
import NuevaTarea from './NuevaTarea.jsx';

export default function Oficina() {
  const { agentes, tareas, config } = useOficina();
  const lienzo = useRef(null);
  const escena = useRef(null);
  const [seleccion, setSeleccion] = useState(null);
  const [asignar, setAsignar] = useState(null);
  const [fallo3d, setFallo3d] = useState(false);

  useEffect(() => {
    try {
      escena.current = crearOficina3D(lienzo.current, { alSeleccionar: setSeleccion });
    } catch (e) {
      console.error(e);
      setFallo3d(true);
    }
    return () => escena.current?.destruir();
  }, []);

  useEffect(() => { escena.current?.actualizar({ agentes, tareas, config }); }, [agentes, tareas, config]);

  const agente = agentes.find((a) => a.id === seleccion);
  const delAgente = agente ? tareas.filter((t) => t.agenteId === agente.id && t.estado !== 'lista').slice(0, 4) : [];
  const trabajando = agentes.filter((a) => a.estado === 'trabajando');

  return (
    <div className="oficina">
      <div ref={lienzo} className="lienzo" />
      {fallo3d && <div className="sin-3d">Tu navegador no pudo abrir la vista 3D. Puedes usar Tareas y Equipo con normalidad.</div>}

      <aside className="panel-oficina">
        <h3>Ahora mismo</h3>
        {trabajando.length === 0 && <p className="suave">Todos libres. Asígnale algo a un agente.</p>}
        {trabajando.map((a) => (
          <button key={a.id} className="fila-agente" onClick={() => setSeleccion(a.id)}>
            <span className="punto" style={{ background: a.color }} />
            <b>{a.nombre}</b>
            <span className="suave recorte">{tareas.find((t) => t.id === a.tareaActual)?.titulo || 'Trabajando'}</span>
          </button>
        ))}
        <h3 style={{ marginTop: 14 }}>Equipo</h3>
        {agentes.map((a) => (
          <button key={a.id} className={`fila-agente ${seleccion === a.id ? 'activa' : ''}`} onClick={() => setSeleccion(a.id)}>
            <span className="punto" style={{ background: a.color }} />
            <b>{a.nombre}</b><span className="suave recorte">{a.titulo || a.rol}</span>
          </button>
        ))}
      </aside>

      {agente && (
        <div className="tarjeta-agente">
          <button className="cerrar" aria-label="Cerrar" onClick={() => setSeleccion(null)}>×</button>
          <div className="tarjeta-cab">
            <span className="avatar" style={{ background: agente.color }}>{agente.nombre[0]}</span>
            <div><h3>{agente.nombre}</h3><p className="suave">{agente.titulo || agente.rol}</p></div>
          </div>
          {delAgente.length === 0 && <p className="suave">Sin tareas abiertas.</p>}
          {delAgente.map((t) => <p key={t.id} className="linea-tarea"><span className="suave">{ETIQUETA[t.estado]}</span> {t.titulo}</p>)}
          <button className="btn btn-marca ancho" onClick={() => setAsignar(agente.id)}>Asignarle una tarea</button>
        </div>
      )}
      {asignar && <NuevaTarea agenteId={asignar} alCerrar={() => setAsignar(null)} />}
    </div>
  );
}
