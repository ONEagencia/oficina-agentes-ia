// Conexión del motor con Firebase, usando la cuenta de servicio creada por `npm run configurar`.
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, connectFirestoreEmulator, doc, getFirestore, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export async function conectar(env = process.env) {
  const app = initializeApp({
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    appId: env.FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (env.EMULADOR === '1') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  await signInWithEmailAndPassword(auth, env.MOTOR_EMAIL, env.MOTOR_PASSWORD);

  return {
    crear: (col, datos) => addDoc(collection(db, col), datos).then((r) => r.id),
    guardar: (col, id, datos) => updateDoc(doc(db, col, id), datos),
    fijar: (col, id, datos) => setDoc(doc(db, col, id), datos, { merge: true }),
    escuchar: (col, cb, alFallar) => onSnapshot(collection(db, col), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), alFallar),
    escucharDoc: (col, id, cb, alFallar) => onSnapshot(doc(db, col, id), (d) => cb(d.exists() ? d.data() : null), alFallar),
  };
}
