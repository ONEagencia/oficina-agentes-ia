import { useEffect, useState } from 'react';
import { esDemo } from './datos/almacen.js';
import { ProveedorOficina, abrirAlmacen, motorEncendido, useOficina } from './datos/oficina.jsx';
import Ajustes from './vistas/Ajustes.jsx';
import Chat from './vistas/Chat.jsx';
import Equipo from './vistas/Equipo.jsx';
import Oficina from './vistas/Oficina.jsx';
import Rutinas from './vistas/Rutinas.jsx';
import Tareas from './vistas/Tareas.jsx';

const VISTAS = [
  ['oficina', 'Oficina', Oficina],
  ['tareas', 'Tareas', Tareas],
  ['equipo', 'Equipo', Equipo],
  ['rutinas', 'Rutinas', Rutinas],
  ['ajustes', 'Ajustes', Ajustes],
];

function Marco({ usuario }) {
  const { config, motor, tareas, falla, almacen } = useOficina();
  const [vista, setVista] = useState('oficina');
  const [chat, setChat] = useState(false);
  const [, refrescar] = useState(0);
  useEffect(() => { const r = setInterval(() => refrescar((n) => n + 1), 30_000); return () => clearInterval(r); }, []);

  const pendientes = tareas.filter((t) => ['revision', 'pregunta', 'error'].includes(t.estado)).length;
  const encendido = motorEncendido(motor);
  const Vista = VISTAS.find((v) => v[0] === vista)[2];

  return (
    <div className="marco">
      <header className="barra">
        <div className="logo">
          {config?.logo ? <img src={config.logo} alt="" /> : <span className="logo-punto" />}
          <strong>{config?.nombre || 'Mi oficina'}</strong>
        </div>
        <nav>
          {VISTAS.map(([id, nombre]) => (
            <button key={id} className={vista === id ? 'activa' : ''} onClick={() => setVista(id)}>
              {nombre}{id === 'tareas' && pendientes > 0 && <span className="globo">{pendientes}</span>}
            </button>
          ))}
        </nav>
        <div className="barra-der">
          <span className={`motor ${encendido ? 'on' : ''}`} title={encendido ? 'Tus agentes pueden trabajar' : 'Enciende el motor con: npm run motor'}>
            <i />{encendido ? 'Motor encendido' : 'Motor apagado'}
          </span>
          <button className="btn btn-marca" onClick={() => setChat((c) => !c)}>Hablar con el equipo</button>
          {!esDemo && <button className="btn btn-suave" onClick={() => almacen.salir()} title={usuario?.email}>Salir</button>}
        </div>
      </header>

      {esDemo && <div className="aviso">Modo demo: los datos son de ejemplo y se borran al recargar. <b>Instálala con /montar-oficina.</b></div>}
      {falla && <div className="aviso aviso-error">No se pudieron leer los datos ({falla}). Revisa que tu correo esté autorizado y que las reglas estén publicadas.</div>}

      <main className={`contenido contenido-${vista}`}><Vista /></main>
      {chat && <Chat alCerrar={() => setChat(false)} />}
    </div>
  );
}

function Entrada({ almacen }) {
  const [error, setError] = useState(null);
  return (
    <div className="entrada">
      <div className="entrada-caja">
        <span className="logo-punto grande" />
        <h1>Tu oficina de agentes</h1>
        <p>Entra con la cuenta de Google que autorizaste al instalarla.</p>
        <button className="btn btn-marca" onClick={() => almacen.entrar().catch((e) => setError(e.code))}>Entrar con Google</button>
        {error && <p className="error">No se pudo entrar: {error}</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [almacen, setAlmacen] = useState(null);
  const [usuario, setUsuario] = useState(undefined);

  useEffect(() => {
    let fin;
    abrirAlmacen().then((a) => { setAlmacen(a); fin = a.alCambiarSesion(setUsuario); });
    return () => fin?.();
  }, []);

  if (!almacen || usuario === undefined) return <div className="cargando">Abriendo la oficina…</div>;
  if (!usuario) return <Entrada almacen={almacen} />;
  return <ProveedorOficina almacen={almacen}><Marco usuario={usuario} /></ProveedorOficina>;
}
