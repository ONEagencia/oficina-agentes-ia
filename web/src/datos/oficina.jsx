import { createContext, useContext, useEffect, useState } from 'react';
import { abrirAlmacen } from './almacen.js';

const Contexto = createContext(null);
export const useOficina = () => useContext(Contexto);

export const COLUMNAS = [
  { id: 'porhacer', titulo: 'Por hacer', estados: ['pendiente', 'cambios'] },
  { id: 'trabajando', titulo: 'Trabajando', estados: ['trabajando'] },
  { id: 'revisar', titulo: 'Te toca', estados: ['revision', 'pregunta', 'error'] },
  { id: 'lista', titulo: 'Lista', estados: ['lista'] },
];

export const ETIQUETA = {
  pendiente: 'En cola', cambios: 'Con cambios', trabajando: 'Trabajando',
  revision: 'Para revisar', pregunta: 'Tiene una pregunta', error: 'Falló', lista: 'Lista',
};

export const COLORES = ['#7c5cff', '#ff6b9d', '#3ecfb2', '#ffb547', '#4aa8ff', '#ff7a59', '#a3d94f', '#e879f9', '#22d3ee', '#f87171'];

export const motorEncendido = (motor) => !!motor?.ultimoLatido && Date.now() - motor.ultimoLatido < 90_000;

export function ProveedorOficina({ almacen, children }) {
  const [datos, setDatos] = useState({ config: null, motor: null, agentes: [], tareas: [], mensajes: [], rutinas: [] });
  const [falla, setFalla] = useState(null);

  useEffect(() => {
    const poner = (clave) => (valor) => setDatos((d) => ({ ...d, [clave]: valor }));
    const alFallar = (e) => setFalla(e.code || e.message);
    const fin = [
      almacen.escucharDoc('config', 'oficina', poner('config'), alFallar),
      almacen.escucharDoc('motor', 'estado', poner('motor'), alFallar),
      ...['agentes', 'tareas', 'mensajes', 'rutinas'].map((c) => almacen.escuchar(c, poner(c), alFallar)),
    ];
    return () => fin.forEach((f) => f());
  }, [almacen]);

  useEffect(() => {
    if (datos.config?.color) document.documentElement.style.setProperty('--marca', datos.config.color);
    if (datos.config?.nombre) document.title = datos.config.nombre;
  }, [datos.config]);

  const agentes = [...datos.agentes].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
  return <Contexto.Provider value={{ ...datos, agentes, falla, almacen }}>{children}</Contexto.Provider>;
}

export { abrirAlmacen };
