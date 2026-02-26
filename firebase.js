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
  const db = getFirestore(app);

  return { ok: true, app, auth, db };
}
