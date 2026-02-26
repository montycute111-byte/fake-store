module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim() !== "") || "";
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  const sanitize = (cfg) => {
    const out = {};
    Object.keys(cfg || {}).forEach((k) => {
      if (cfg[k] !== "") out[k] = cfg[k];
    });
    return out;
  };

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
      res.status(200).json({
        ok: false,
        error: err && err.message ? err.message : "Invalid FIREBASE_CONFIG JSON.",
        config: null,
        source: "invalid-json"
      });
      return;
    }
  }

  const missing = requiredKeys.filter((k) => !config?.[k]);
  const apiKeyExists = Boolean(config?.apiKey);
  const apiKeyLength = apiKeyExists ? String(config.apiKey).length : 0;
  console.info(
    `[firebase-debug] /api/firebase-config-data source=${source || "none"} apiKeyExists=${apiKeyExists} apiKeyLength=${apiKeyLength} missing=${missing.join(",") || "none"}`
  );

  if (!config || missing.length > 0) {
    res.status(200).json({
      ok: false,
      error: `Missing Firebase env fields: ${missing.join(", ")}. Set FIREBASE_CONFIG JSON or FIREBASE_API_KEY/FIREBASE_AUTH_DOMAIN/FIREBASE_PROJECT_ID/FIREBASE_APP_ID.`,
      config: null,
      source
    });
    return;
  }

  res.status(200).json({ ok: true, error: "", config, source });
};
