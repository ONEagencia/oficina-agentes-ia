// Una sola puerta a los datos: Firebase cuando la oficina está instalada, memoria en modo demo.
const proyecto = import.meta.env.VITE_FIREBASE_PROJECT_ID;
export const esDemo = !proyecto || new URLSearchParams(location.search).has('demo');

async function conFirebase() {
  const { initializeApp } = await import('firebase/app');
  const { GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPopup, signOut } = await import('firebase/auth');
  const { addDoc, collection, connectFirestoreEmulator, deleteDoc, doc, getFirestore, limit, onSnapshot, orderBy, query, setDoc, updateDoc } = await import('firebase/firestore');

  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: proyecto,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (import.meta.env.VITE_EMULADOR === '1') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  const ORDEN = { tareas: ['actualizada', 300], mensajes: ['creado', 100] };

  return {
    alCambiarSesion: (cb) => onAuthStateChanged(auth, cb),
    entrar: () => signInWithPopup(auth, new GoogleAuthProvider()),
    salir: () => signOut(auth),
    escuchar(col, cb, alFallar) {
      const base = collection(db, col);
      const q = ORDEN[col] ? query(base, orderBy(ORDEN[col][0], 'desc'), limit(ORDEN[col][1])) : base;
      return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), alFallar);
    },
    escucharDoc: (col, id, cb, alFallar) => onSnapshot(doc(db, col, id), (d) => cb(d.exists() ? d.data() : null), alFallar),
    crear: (col, datos) => addDoc(collection(db, col), datos).then((r) => r.id),
    guardar: (col, id, datos) => updateDoc(doc(db, col, id), datos),
    fijar: (col, id, datos) => setDoc(doc(db, col, id), datos, { merge: true }),
    borrar: (col, id) => deleteDoc(doc(db, col, id)),
  };
}

let promesa;
export function abrirAlmacen() {
  promesa ||= esDemo ? import('./demo.js').then((m) => m.crearDemo()) : conFirebase();
  return promesa;
}
