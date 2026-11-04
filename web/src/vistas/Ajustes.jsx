import { useEffect, useState } from 'react';
import { motorEncendido, useOficina } from '../datos/oficina.jsx';

export default function Ajustes() {
  const { config, motor, almacen } = useOficina();
  const [f, setF] = useState(null);
  const [guardado, setGuardado] = useState(false);
  useEffect(() => { if (config && !f) setF({ nombre: '', negocio: '', tono: '', color: '#7c5cff', logo: '', ...config }); }, [config, f]);
  if (!f) return <div className="pagina"><p className="suave">Cargando…</p></div>;
  const poner = (c) => (e) => setF({ ...f, [c]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    await almacen.fijar('config', 'oficina', f);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <div className="pagina angosta">
      <h1>Ajustes</h1>
      <form className="formulario" onSubmit={guardar}>
        <label>Nombre de la oficina<input required value={f.nombre} onChange={poner('nombre')} /></label>
        <label>Tu negocio<textarea rows={4} value={f.negocio} onChange={poner('negocio')} /><small>Todos los agentes leen esto antes de cada tarea.</small></label>
        <label>Tono de comunicación<input value={f.tono} onChange={poner('tono')} /></label>
        <div className="dos">
          <label>Color de marca<input type="color" value={f.color} onChange={poner('color')} /></label>
          <label>Logo (enlace a la imagen)<input type="url" value={f.logo} onChange={poner('logo')} placeholder="https://… o /logo.png" /></label>
        </div>
        <button className="btn btn-marca">{guardado ? 'Guardado ✓' : 'Guardar'}</button>
      </form>

      <h2>El motor</h2>
      <p className="suave">{motorEncendido(motor) ? 'Encendido: tus agentes pueden trabajar.' : 'Apagado: las tareas esperan hasta que lo enciendas.'}</p>
      <pre className="comando">npm run motor</pre>
      <p className="suave">Para que arranque solo al prender la computadora: <code>npm run autoarranque</code>.</p>
      <p className="firma">Oficina de agentes IA, de <a href="https://www.instagram.com/danielpuentes.one/" target="_blank" rel="noopener">@danielpuentes.one</a> · ONE Agencia</p>
    </div>
  );
}
