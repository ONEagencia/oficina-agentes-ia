// La oficina en 3D. Cada agente tiene escritorio; va a él cuando trabaja y pasea cuando está libre.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ANCHO = 26;
const FONDO = 18;
const VELOCIDAD = 2.4;
const FILAS_Z = [-1.2, 4.2]; // filas de escritorios
const PASILLO_Z = 1.5;
const ZONA_LIBRE = [[-10.5, 7], [-8.5, 7.4], [10.2, -5.6], [8.8, -6.4], [10.6, 6], [8.6, 7.2], [0, 7.8], [-9.8, -6]];

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02, ...extra });

function caja(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function texturaLienzo(w, h, dibujar) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function piso() {
  const tex = texturaLienzo(512, 512, (g, w, h) => {
    g.fillStyle = '#b98f66';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 3; x++) {
        const l = 40 + Math.floor(((x * 7 + y * 13) % 9) * 3);
        g.fillStyle = `rgb(${150 + l},${110 + l * 0.8},${74 + l * 0.6})`;
        g.fillRect(x * 171 + (y % 2) * 60, y * 64, 169, 62);
      }
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, FONDO), mat(0xffffff, { map: tex }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function planta(x, z, escala = 1) {
  const g = new THREE.Group();
  g.add(caja(0.6, 0.55, 0.6, mat(0xe9e2d6), 0, 0.28, 0));
  const hoja = mat(0x4f9d69, { flatShading: true });
  for (const [hx, hy, hz, r] of [[0, 1, 0, 0.55], [0.3, 1.35, 0.1, 0.38], [-0.25, 1.4, -0.1, 0.4], [0, 1.75, 0.05, 0.32]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), hoja);
    b.position.set(hx, hy, hz);
    b.castShadow = true;
    g.add(b);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(escala);
  return g;
}

function estructura(escena) {
  escena.add(piso());
  const pared = mat(0xf0ebe3);
  const acento = mat(0x2b2740);
  escena.add(caja(ANCHO + 0.6, 4.6, 0.3, pared, 0, 2.3, -FONDO / 2));
  escena.add(caja(0.3, 4.6, FONDO, pared, -ANCHO / 2, 2.3, 0));
  // Muro de marca: sobre él va el letrero con el nombre.
  escena.add(caja(9.4, 4.6, 0.12, acento, 0, 2.3, -FONDO / 2 + 0.2));
  // Ventanales
  const vidrio = mat(0xbfe3ff, { emissive: 0x9fd4ff, emissiveIntensity: 0.65 });
  for (const z of [-5, 0, 5]) {
    escena.add(caja(0.08, 2.7, 3.6, vidrio, -ANCHO / 2 + 0.2, 2.4, z));
    escena.add(caja(0.14, 2.9, 0.1, acento, -ANCHO / 2 + 0.22, 2.4, z - 1.85));
    escena.add(caja(0.14, 2.9, 0.1, acento, -ANCHO / 2 + 0.22, 2.4, z + 1.85));
  }
  // Tapete central
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(19, 10.5), mat(0x3a3556));
  tapete.rotation.x = -Math.PI / 2;
  tapete.position.set(0, 0.012, 1.5);
  tapete.receiveShadow = true;
  escena.add(tapete);
  // Sala de descanso
  const tela = mat(0x5c6bc0);
  escena.add(caja(3.6, 0.55, 1.2, tela, 10, 0.35, 7.6));
  escena.add(caja(3.6, 0.9, 0.3, tela, 10, 0.8, 8.2));
  escena.add(caja(1.3, 0.3, 0.8, mat(0x8a6a4a), 10, 0.25, 5.8));
  // Cafetera
  escena.add(caja(1.8, 1.05, 0.8, mat(0x8a6a4a), -10.4, 0.53, 8.2));
  escena.add(caja(0.5, 0.6, 0.45, mat(0x26242f), -10.4, 1.35, 8.2));
  // Estantería
  const madera = mat(0x7a5a3e);
  escena.add(caja(3.2, 3.2, 0.5, madera, 9.4, 1.6, -8.5));
  for (let i = 0; i < 9; i++) {
    const color = [0xe57373, 0x64b5f6, 0xffd54f, 0x81c784, 0xba68c8][i % 5];
    escena.add(caja(0.28, 0.72, 0.3, mat(color), 8.3 + (i % 3) * 1.05 + (i % 2) * 0.3, 0.75 + Math.floor(i / 3) * 1, -8.2));
  }
  escena.add(planta(-11.6, -7.6, 1.3), planta(12, -7.4, 1.1), planta(12, 2.8, 1), planta(-11.8, 3, 0.9), planta(5.8, -8.1, 0.9), planta(-5.8, -8.1, 0.9));
}

function etiqueta(texto, color = '#ffffff') {
  const tex = texturaLienzo(256, 72, (g, w, h) => {
    g.font = '600 34px Inter, Arial, sans-serif';
    const ancho = Math.min(g.measureText(texto).width + 34, w - 4);
    g.fillStyle = 'rgba(18,16,30,.82)';
    g.beginPath();
    g.roundRect((w - ancho) / 2, 12, ancho, 48, 24);
    g.fill();
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, w / 2, 37, w - 30);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(1.9, 0.53, 1);
  return s;
}

function burbuja(simbolo, fondo) {
  const tex = texturaLienzo(128, 128, (g, w, h) => {
    g.fillStyle = fondo;
    g.beginPath();
    g.arc(w / 2, h / 2 - 6, 50, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(w / 2 - 14, h - 34);
    g.lineTo(w / 2, h - 8);
    g.lineTo(w / 2 + 14, h - 34);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '700 56px Inter, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(simbolo, w / 2, h / 2 - 4);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.75, 0.75, 1);
  return s;
}

const BURBUJAS = {
  trabajando: () => burbuja('…', '#4f7cff'),
  pregunta: () => burbuja('?', '#f5a524'),
  revision: () => burbuja('✓', '#22b07d'),
  error: () => burbuja('!', '#e5484d'),
};

function crearEscritorio(x, z, color) {
  const g = new THREE.Group();
  const tablero = mat(0xd9b48a);
  const metal = mat(0x2f2c3d);
  g.add(caja(2.5, 0.12, 1.15, tablero, 0, 1, 0));
  for (const [px, pz] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) g.add(caja(0.08, 1, 0.08, metal, px, 0.5, pz));
  g.add(caja(0.5, 0.05, 0.3, metal, 0, 1.08, -0.25));
  g.add(caja(0.09, 0.32, 0.09, metal, 0, 1.24, -0.25));
  const pantallaMat = mat(0x171522, { emissive: new THREE.Color(color), emissiveIntensity: 0.06 });
  g.add(caja(1.25, 0.72, 0.06, pantallaMat, 0, 1.6, -0.27));
  g.add(caja(0.8, 0.03, 0.3, mat(0x3b3849), 0, 1.08, 0.2));
  // Silla: el respaldo lleva el color del agente.
  g.add(caja(0.8, 0.12, 0.8, metal, 0, 0.62, 1.05));
  g.add(caja(0.8, 0.8, 0.1, mat(color), 0, 1.05, 1.42));
  g.add(caja(0.1, 0.56, 0.1, metal, 0, 0.3, 1.05));
  g.position.set(x, 0, z);
  return { grupo: g, pantallaMat };
}

function crearPersonaje(color) {
  const g = new THREE.Group();
  const cuerpoMat = mat(color);
  const piel = mat(0xf0c9a6);
  const oscuro = mat(0x2a2838);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.42, 6, 14), cuerpoMat);
  torso.position.y = 1;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), piel);
  cabeza.position.y = 1.68;
  const pelo = new THREE.Mesh(new THREE.SphereGeometry(0.295, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), oscuro);
  pelo.position.y = 1.7;
  pelo.rotation.x = -0.25;
  for (const o of [torso, cabeza, pelo]) { o.castShadow = true; g.add(o); }

  const pierna = (x) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 8), oscuro);
    m.position.y = -0.3;
    m.castShadow = true;
    p.add(m);
    p.position.set(x, 0.66, 0);
    g.add(p);
    return p;
  };
  const brazo = (x) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 4, 8), cuerpoMat);
    m.position.y = -0.27;
    m.castShadow = true;
    p.add(m);
    p.position.set(x, 1.3, 0);
    g.add(p);
    return p;
  };
  return { grupo: g, piernas: [pierna(-0.14), pierna(0.14)], brazos: [brazo(-0.38), brazo(0.38)], cuerpoMat };
}

export function crearOficina3D(contenedor, { alSeleccionar }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x14121f);
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camara.position.set(19, 21, 27);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.set(0, 0.8, 0);
  controles.enableDamping = true;
  controles.minDistance = 12;
  controles.maxDistance = 60;
  controles.maxPolarAngle = Math.PI / 2.25;
  controles.minAzimuthAngle = -0.4;
  controles.maxAzimuthAngle = Math.PI / 2;

  escena.add(new THREE.HemisphereLight(0xfff4e6, 0x3a3556, 1.5));
  const sol = new THREE.DirectionalLight(0xfff0dd, 2.4);
  sol.position.set(-14, 22, 10);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, far: 60 });
  sol.shadow.bias = -0.0006;
  escena.add(sol);

  estructura(escena);

  // Letrero con el nombre de la oficina
  const letrero = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.9), new THREE.MeshBasicMaterial({ transparent: true }));
  letrero.position.set(0, 2.9, -FONDO / 2 + 0.28);
  escena.add(letrero);
  // Pizarra con el estado del día
  const pizarra = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  pizarra.position.set(-ANCHO / 2 + 0.2, 2.4, -7.3);
  pizarra.rotation.y = Math.PI / 2;
  // La pizarra va en el muro del fondo, junto al letrero.
  pizarra.position.set(-7, 2.5, -FONDO / 2 + 0.17);
  pizarra.rotation.y = 0;
  escena.add(pizarra);

  const pintar = (material, nueva) => { material.map?.dispose(); material.map = nueva; material.needsUpdate = true; };
  let firmaLetrero = '';
  function dibujarLetrero(config) {
    const firma = `${config?.nombre}|${config?.color}`;
    if (firma === firmaLetrero) return;
    firmaLetrero = firma;
    pintar(letrero.material, texturaLienzo(1024, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = config?.color || '#7c5cff';
      g.fillRect(w / 2 - 70, h - 26, 140, 8);
      g.fillStyle = '#ffffff';
      g.font = '700 86px "Space Grotesk", Inter, Arial, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(config?.nombre || 'Mi oficina', w / 2, h / 2 - 8, w - 50);
    }));
  }
  let firmaPizarra = '';
  function dibujarPizarra(tareas) {
    const n = (estados) => tareas.filter((t) => estados.includes(t.estado)).length;
    const filas = [['Por hacer', n(['pendiente', 'cambios'])], ['Trabajando', n(['trabajando'])], ['Te toca', n(['revision', 'pregunta', 'error'])], ['Listas', n(['lista'])]];
    const firma = JSON.stringify(filas);
    if (firma === firmaPizarra) return;
    firmaPizarra = firma;
    pintar(pizarra.material, texturaLienzo(512, 300, (g, w, h) => {
      g.fillStyle = '#fbfaf7';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#4b4860';
      g.lineWidth = 10;
      g.strokeRect(5, 5, w - 10, h - 10);
      g.textBaseline = 'middle';
      filas.forEach(([t, v], i) => {
        const y = 54 + i * 64;
        g.fillStyle = '#35324a';
        g.font = '500 36px Inter, Arial, sans-serif';
        g.textAlign = 'left';
        g.fillText(t, 34, y);
        g.font = '700 42px "Space Grotesk", Inter, Arial, sans-serif';
        g.textAlign = 'right';
        g.fillText(v, w - 34, y);
      });
    }));
  }

  const gente = new Map();
  const seleccionables = [];
  let ultimoTiempo = performance.now();
  let reloj = 0;

  function puesto(i, total) {
    // El coordinador se sienta adelante, de frente al equipo; los demás en dos filas.
    const porFila = Math.max(3, Math.ceil(total / 2));
    const fila = Math.min(FILAS_Z.length - 1, Math.floor(i / porFila));
    const col = i % porFila;
    const paso = Math.min(5.8, 19 / porFila);
    return { x: (col - (porFila - 1) / 2) * paso, z: FILAS_Z[fila] };
  }

  function quitar(id) {
    const p = gente.get(id);
    if (!p) return;
    escena.remove(p.personaje.grupo, p.escritorio.grupo);
    const i = seleccionables.indexOf(p.personaje.grupo);
    if (i >= 0) seleccionables.splice(i, 1);
    gente.delete(id);
  }

  function ruta(desde, hacia) {
    // Pasa por el pasillo para no atravesar los escritorios.
    if (Math.abs(desde.x - hacia.x) < 0.5 && Math.abs(desde.z - hacia.z) < 3) return [hacia];
    return [new THREE.Vector3(desde.x, 0, PASILLO_Z), new THREE.Vector3(hacia.x, 0, PASILLO_Z), hacia];
  }

  function irA(p, destino, alLlegar) {
    p.camino = ruta(p.personaje.grupo.position, destino);
    p.alLlegar = alLlegar || null;
    p.sentado = false;
  }

  const silla = (p) => new THREE.Vector3(p.mesa.x, 0, p.mesa.z + 1.05);

  function actualizar({ agentes, tareas, config }) {
    dibujarLetrero(config);
    dibujarPizarra(tareas);
    const visibles = agentes.filter((a) => a.activo !== false);
    for (const id of [...gente.keys()]) if (!visibles.some((a) => a.id === id)) quitar(id);

    visibles.forEach((a, i) => {
      const lugar = puesto(i, visibles.length);
      let p = gente.get(a.id);
      if (!p) {
        const personaje = crearPersonaje(a.color || '#7c5cff');
        const escritorio = crearEscritorio(lugar.x, lugar.z, a.color || '#7c5cff');
        personaje.grupo.position.set(lugar.x, 0, lugar.z + 1.05);
        personaje.grupo.userData.agenteId = a.id;
        personaje.grupo.traverse((o) => { o.userData.agenteId = a.id; });
        const nombre = etiqueta(a.nombre);
        nombre.position.y = 2.42;
        personaje.grupo.add(nombre);
        escena.add(personaje.grupo, escritorio.grupo);
        seleccionables.push(personaje.grupo);
        p = { personaje, escritorio, mesa: lugar, camino: [], espera: 2 + Math.random() * 6, sentado: true, estadoVisto: null, tareaVista: null, burbuja: null, fase: Math.random() * 6, nombre, nombreVisto: a.nombre };
        gente.set(a.id, p);
      }
      p.agente = a;
      if (p.nombreVisto !== a.nombre) {
        p.personaje.grupo.remove(p.nombre);
        p.nombre = etiqueta(a.nombre);
        p.nombre.position.y = 2.42;
        p.personaje.grupo.add(p.nombre);
        p.nombreVisto = a.nombre;
      }
      p.personaje.cuerpoMat.color.set(a.color || '#7c5cff');
      p.mesa = lugar;
      p.escritorio.grupo.position.set(lugar.x, 0, lugar.z);

      // Estado visible: trabajando, o lo que espera tu atención.
      const abierta = tareas.find((t) => t.agenteId === a.id && ['pregunta', 'error', 'revision'].includes(t.estado));
      const estado = a.estado === 'trabajando' ? 'trabajando' : abierta?.estado || 'libre';
      if (estado !== p.estadoVisto) {
        if (p.burbuja) p.personaje.grupo.remove(p.burbuja);
        p.burbuja = BURBUJAS[estado]?.() || null;
        if (p.burbuja) { p.burbuja.position.y = 3; p.personaje.grupo.add(p.burbuja); }
        p.estadoVisto = estado;
        p.escritorio.pantallaMat.emissiveIntensity = estado === 'trabajando' ? 1.1 : 0.06;
        if (estado !== 'libre' && !p.sentado) irA(p, silla(p), () => { p.sentado = true; });
      }
      // Cuando llega trabajo nuevo, el coordinador camina a entregarlo y vuelve a su puesto.
      if (a.estado === 'trabajando' && a.tareaActual && a.tareaActual !== p.tareaVista && !a.coordinador) {
        const jefe = [...gente.values()].find((x) => x.agente?.coordinador);
        if (jefe && !jefe.entregando && jefe.estadoVisto === 'libre') {
          jefe.entregando = true;
          irA(jefe, new THREE.Vector3(lugar.x + 1.6, 0, lugar.z + 1.3), () => {
            jefe.espera = 1.2;
            jefe.alTerminarEspera = () => irA(jefe, silla(jefe), () => { jefe.sentado = true; jefe.entregando = false; jefe.espera = 4 + Math.random() * 6; });
          });
        }
      }
      p.tareaVista = a.tareaActual || null;
    });
  }

  function animar(p, dt) {
    const { grupo, piernas, brazos } = p.personaje;
    p.fase += dt * 9;
    if (p.camino.length) {
      const destino = p.camino[0];
      const dir = destino.clone().sub(grupo.position).setY(0);
      const dist = dir.length();
      if (dist < 0.08) {
        p.camino.shift();
        if (!p.camino.length) { const fn = p.alLlegar; p.alLlegar = null; fn?.(); }
      } else {
        dir.normalize();
        grupo.position.addScaledVector(dir, Math.min(VELOCIDAD * dt, dist));
        grupo.rotation.y = THREE.MathUtils.lerp(grupo.rotation.y, Math.atan2(dir.x, dir.z), 0.18);
      }
      const giro = Math.sin(p.fase) * 0.65;
      piernas[0].rotation.x = giro;
      piernas[1].rotation.x = -giro;
      brazos[0].rotation.x = -giro * 0.8;
      brazos[1].rotation.x = giro * 0.8;
      grupo.position.y = Math.abs(Math.sin(p.fase)) * 0.05;
      return;
    }
    if (p.sentado) {
      grupo.position.y = -0.1;
      grupo.rotation.y = Math.PI; // de frente a la pantalla
      piernas[0].rotation.x = piernas[1].rotation.x = 1.25;
      if (p.estadoVisto === 'trabajando') {
        brazos[0].rotation.x = -1.2 + Math.sin(p.fase * 1.6) * 0.12;
        brazos[1].rotation.x = -1.2 + Math.cos(p.fase * 1.6) * 0.12;
      } else {
        brazos[0].rotation.x = brazos[1].rotation.x = -0.7;
      }
    } else {
      grupo.position.y = 0;
      piernas[0].rotation.x = piernas[1].rotation.x = 0;
      brazos[0].rotation.x = brazos[1].rotation.x = Math.sin(p.fase * 0.2) * 0.05;
    }
    // Agentes libres: se levantan a pasear de vez en cuando.
    p.espera -= dt;
    if (p.espera > 0) return;
    if (p.alTerminarEspera) { const fn = p.alTerminarEspera; p.alTerminarEspera = null; fn(); return; }
    if (p.estadoVisto !== 'libre' || p.entregando) { p.espera = 2; return; }
    if (p.sentado) {
      const [x, z] = ZONA_LIBRE[Math.floor(Math.random() * ZONA_LIBRE.length)];
      irA(p, new THREE.Vector3(x, 0, z), () => { p.espera = 5 + Math.random() * 8; });
    } else {
      irA(p, silla(p), () => { p.sentado = true; p.espera = 8 + Math.random() * 14; });
    }
  }

  const rayo = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let abajo = null;
  const lienzo = renderer.domElement;
  const alBajar = (e) => { abajo = [e.clientX, e.clientY]; };
  const alSubir = (e) => {
    if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 6) return;
    const r = lienzo.getBoundingClientRect();
    puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(puntero, camara);
    const toque = rayo.intersectObjects(seleccionables, true).find((h) => h.object.userData.agenteId);
    alSeleccionar(toque?.object.userData.agenteId || null);
  };
  lienzo.addEventListener('pointerdown', alBajar);
  lienzo.addEventListener('pointerup', alSubir);

  const ajustar = () => {
    const w = contenedor.clientWidth || 1;
    const h = contenedor.clientHeight || 1;
    renderer.setSize(w, h);
    camara.aspect = w / h;
    // En pantallas angostas la cámara se aleja para que quepa toda la oficina.
    camara.fov = w / h < 1 ? 52 : 32;
    camara.updateProjectionMatrix();
  };
  const observador = new ResizeObserver(ajustar);
  observador.observe(contenedor);
  ajustar();

  let cuadro;
  function bucle(t) {
    cuadro = requestAnimationFrame(bucle);
    if (document.hidden) { ultimoTiempo = t; return; }
    const dt = Math.min((t - ultimoTiempo) / 1000, 0.1);
    ultimoTiempo = t;
    reloj += dt;
    gente.forEach((p) => {
      animar(p, dt);
      if (p.burbuja) p.burbuja.position.y = 3 + Math.sin(reloj * 2.4 + p.fase * 0.01) * 0.06;
    });
    controles.update();
    renderer.render(escena, camara);
  }
  cuadro = requestAnimationFrame(bucle);

  return {
    actualizar,
    destruir() {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointerup', alSubir);
      controles.dispose();
      renderer.dispose();
      lienzo.remove();
    },
  };
}
