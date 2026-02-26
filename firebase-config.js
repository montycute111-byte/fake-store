// Local fallback only.
// In Vercel, /api/firebase-config.js should set window.FIREBASE_CONFIG from env vars first.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || null;
window.FIREBASE_CONFIG_SOURCE = window.FIREBASE_CONFIG ? "local-fallback-file" : "unset";
