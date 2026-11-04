import { useState } from 'react';
import roles from '../../../plantillas/roles.json';
import { COLORES, useOficina } from '../datos/oficina.jsx';

function Editor({ agente, alCerrar }) {
  const { agentes, almacen } = useOficina();
  const inicial = agente || (() => {
    const hayCoordinador = agentes.some((a) => a.coordinador);
    const rol = hayCoordinador ? 'ideas' : 'coordinador';
    return { nombre: '', rol, titulo: roles[rol].titulo, manual: roles[rol].manual, web: roles[rol].web, coordinador: !!roles[rol].coordinador, color: COLORES[agentes.length % COLORES.length], activo: true, modelo: '', herramientasExtra: [] };
  })();
  const [f, setF] = useState(inicial);
  const poner = (c) => (e) => setF({ ...f, [c]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  function cambiarRol(e) {
    const rol = e.target.value;
    const r = roles[rol];
    // Solo reemplaza el manual si todavía es el de la plantilla anterior: nunca pisa lo que escribiste.
    const sinTocar = f.manual === roles[f.rol]?.manual || !f.manual;
    setF({ ...f, rol, titulo: r.titulo, web: r.web, coordinador: !!r.coordinador, manual: sinTocar ? r.manual : f.manual });
  }

  async function guardar(e) {
    e.preventDefault();
    const datos = { ...f, nombre: f.nombre.trim() };
    delete datos.id;
    if (agente) await almacen.guardar('agentes', agente.id, datos);
    else await almacen.crear('agentes', { ...datos, estado: 'libre', tareaActual: null, orden: agentes.length, creado: Date.now() });
    alCerrar();
  }
  async function borrar() {
    if (confirm(`¿Sacar a ${agente.nombre} del equipo? Sus tareas se conservan.`)) { await almacen.borrar('agentes', agente.id); alCerrar(); }
  }

  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <form className="modal" onSubmit={guardar}>
        <button type="button" className="cerrar" aria-label="Cerrar" onClick={alCerrar}>×</button>
        <h2>{agente ? `Editar a ${agente.nombre}` : 'Contratar un agente'}</h2>
        <div className="dos">
          <label>Nombre<input autoFocus required maxLength={30} value={f.nombre} onChange={poner('nombre')} placeholder="El que tú quieras" /></label>
          <label>Rol
            <select value={f.rol} onChange={cambiarRol}>
              {Object.entries(roles).map(([id, r]) => <option key={id} value={id}>{r.titulo}</option>)}
            </select>
          </label>
        </div>
        <p className="suave">{roles[f.rol]?.resumen}</p>
        <label>Su manual
          <textarea rows={13} className="mono" value={f.manual} onChange={poner('manual')} />
          <small>Lo lee antes de cada tarea. Si algo sale mal, corrige el manual y no volverá a pasar.</small>
        </label>
        <div className="colores" role="radiogroup" aria-label="Color">
          {COLORES.map((c) => <button key={c} type="button" role="radio" aria-checked={f.color === c} aria-label={c} className={f.color === c ? 'sel' : ''} style={{ background: c }} onClick={() => setF({ ...f, color: c })} />)}
        </div>
        <label className="check"><input type="checkbox" checked={!!f.web} onChange={poner('web')} /> Puede buscar en internet</label>
        <label className="check"><input type="checkbox" checked={f.activo !== false} onChange={poner('activo')} /> Activo en la oficina</label>
        <details className="avanzado">
          <summary>Avanzado</summary>
          <label>Modelo de Claude (vacío usa el de tu cuenta)<input value={f.modelo || ''} onChange={poner('modelo')} placeholder="Ej. sonnet" /></label>
          <label>Herramientas extra, separadas por coma
            <input value={(f.herramientasExtra || []).join(', ')} onChange={(e) => setF({ ...f, herramientasExtra: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Ej. mcp__metricool__*" />
            <small>Por seguridad, cada agente solo escribe en su carpeta y no usa la terminal. Dale únicamente lo que necesite.</small>
          </label>
        </details>
        <div className="fila entre">
          {agente ? <button type="button" className="enlace-peligro" onClick={borrar}>Sacar del equipo</button> : <span />}
          <button className="btn btn-marca">Guardar</button>
        </div>
      </form>
    </div>
  );
}

export default function Equipo() {
  const { agentes, tareas } = useOficina();
  const [editar, setEditar] = useState(null);
  return (
    <div className="pagina">
      <div className="cabecera">
        <div><h1>Equipo</h1><p className="suave">Cada agente tiene un nombre, un rol y un manual. El manual es lo que más cambia la calidad.</p></div>
        <button className="btn btn-marca" onClick={() => setEditar('nuevo')}>Contratar un agente</button>
      </div>
      <div className="rejilla">
        {agentes.map((a) => {
          const hechas = tareas.filter((t) => t.agenteId === a.id && t.estado === 'lista').length;
          return (
            <button key={a.id} className={`agente ${a.activo === false ? 'apagado' : ''}`} onClick={() => setEditar(a)}>
              <span className="avatar" style={{ background: a.color }}>{a.nombre[0]}</span>
              <h3>{a.nombre}{a.coordinador && <span className="sello">Coordina</span>}</h3>
              <p className="suave">{a.titulo || a.rol}</p>
              <p className="pie-agente">{a.estado === 'trabajando' ? 'Trabajando ahora' : a.activo === false ? 'Inactivo' : 'Libre'} · {hechas} listas</p>
            </button>
          );
        })}
      </div>
      {editar && <Editor agente={editar === 'nuevo' ? null : editar} alCerrar={() => setEditar(null)} />}
    </div>
  );
}
