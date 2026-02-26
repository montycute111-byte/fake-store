module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim() !== "") || "";
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];

  const fromSplitEnv = () => ({
    apiKey: pick(
      process.env.FIREBASE_API_KEY,
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      process.env.VITE_FIREBASE_API_KEY
    ),
    authDomain: pick(
      process.env.FIREBASE_AUTH_DOMAIN,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      process.env.VITE_FIREBASE_AUTH_DOMAIN
    ),
    projectId: pick(
      process.env.FIREBASE_PROJECT_ID,
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      process.env.VITE_FIREBASE_PROJECT_ID
    ),
    storageBucket: pick(
      process.env.FIREBASE_STORAGE_BUCKET,
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      process.env.VITE_FIREBASE_STORAGE_BUCKET
    ),
    messagingSenderId: pick(
      process.env.FIREBASE_MESSAGING_SENDER_ID,
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: pick(
      process.env.FIREBASE_APP_ID,
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      process.env.VITE_FIREBASE_APP_ID
    ),
    measurementId: pick(
      process.env.FIREBASE_MEASUREMENT_ID,
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      process.env.VITE_FIREBASE_MEASUREMENT_ID
    )
  });

  const sanitize = (cfg) => {
    const out = {};
    Object.keys(cfg || {}).forEach((k) => {
      if (cfg[k] !== "") out[k] = cfg[k];
    });
    return out;
  };

  const findMissing = (cfg) => requiredKeys.filter((k) => !cfg?.[k]);
  const raw = process.env.FIREBASE_CONFIG;
  let config = null;
  let source = "";

  if (!raw) {
    config = sanitize(fromSplitEnv());
    source = "split-env";
  } else {
    try {
      config = sanitize(JSON.parse(raw));
      source = "FIREBASE_CONFIG";
    } catch (err) {
      const msg = err && err.message ? err.message : "Invalid FIREBASE_CONFIG JSON.";
      const safeMsg = JSON.stringify(msg);
      res.status(200).send(
        `window.FIREBASE_CONFIG = null; window.FIREBASE_CONFIG_ERROR = ${safeMsg}; window.FIREBASE_CONFIG_SOURCE = 'invalid-json';`
      );
      return;
    }
  }

  const missing = findMissing(config);
  const apiKeyExists = Boolean(config?.apiKey);
  const apiKeyLength = apiKeyExists ? String(config.apiKey).length : 0;
  console.info(
    `[firebase-debug] /api/firebase-config.js source=${source || "none"} apiKeyExists=${apiKeyExists} apiKeyLength=${apiKeyLength} missing=${missing.join(",") || "none"}`
  );

  if (!config || missing.length > 0) {
    const msg = `Missing Firebase env fields: ${missing.join(", ")}. Set FIREBASE_CONFIG JSON or FIREBASE_API_KEY/FIREBASE_AUTH_DOMAIN/FIREBASE_PROJECT_ID/FIREBASE_APP_ID.`;
    const safeMsg = JSON.stringify(msg);
    res.status(200).send(
      `window.FIREBASE_CONFIG = null; window.FIREBASE_CONFIG_ERROR = ${safeMsg}; window.FIREBASE_CONFIG_SOURCE = ${JSON.stringify(source || "none")};`
    );
    return;
  }

  try {
    const safeJson = JSON.stringify(config);
    res.status(200).send(
      `window.FIREBASE_CONFIG = ${safeJson}; window.FIREBASE_CONFIG_ERROR = ''; window.FIREBASE_CONFIG_SOURCE = ${JSON.stringify(source)};`
    );
  } catch (err) {
    const msg = err && err.message ? err.message : "Unable to serialize Firebase config.";
    const safeMsg = JSON.stringify(msg);
    res.status(200).send(
      `window.FIREBASE_CONFIG = null; window.FIREBASE_CONFIG_ERROR = ${safeMsg}; window.FIREBASE_CONFIG_SOURCE = ${JSON.stringify(source || "none")};`
    );
  }
};
