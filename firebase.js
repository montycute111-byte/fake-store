import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
};

export function initFirebase() {
  const cfg = window.FIREBASE_CONFIG;

  if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.authDomain) {
    return {
      ok: false,
      message:
        "Missing window.FIREBASE_CONFIG. Add your Firebase web config in index.html before app.js."
    };
  }

  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);

  return { ok: true, app, auth, db };
}
