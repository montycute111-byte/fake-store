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
  initializeFirestore,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  increment,
  onSnapshot,
  getDocs,
  documentId,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  increment,
  onSnapshot,
  getDocs,
  documentId,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
};

export function initFirebase() {
  const cfg = window.FIREBASE_CONFIG;
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  const missing = required.filter((key) => !cfg?.[key]);
  const apiKeyExists = Boolean(cfg?.apiKey);
  const apiKeyLength = apiKeyExists ? String(cfg.apiKey).length : 0;

  console.info(
    `[firebase-debug] initFirebase: source=${window.FIREBASE_CONFIG_SOURCE || "unknown"}, apiKeyExists=${apiKeyExists}, apiKeyLength=${apiKeyLength}, missing=${missing.join(",") || "none"}`
  );

  if (!cfg || missing.length > 0) {
    return {
      ok: false,
      message: `Missing Firebase config values: ${missing.join(", ")}.`
    };
  }

  if (!String(cfg.apiKey).startsWith("AIza")) {
    console.warn("[firebase-debug] apiKey does not start with expected Firebase Web API key prefix (AIza).");
  }

  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
  });

  return { ok: true, app, auth, db };
}
