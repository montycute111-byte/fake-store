function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function pick(...vals) {
  return vals.find((v) => typeof v === "string" && v.trim() !== "") || "";
}

function getFirebaseConfig() {
  const raw = process.env.FIREBASE_CONFIG;
  if (raw) {
    return JSON.parse(raw);
  }
  return {
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
  };
}

function normalizeUsername(usernameRaw) {
  return String(usernameRaw || "").trim().toLowerCase();
}

function usernameToEmail(usernameRaw) {
  const safe = normalizeUsername(usernameRaw).replace(/[^a-z0-9._-]/g, "");
  return safe ? `${safe}@player.fakebank.local` : "";
}

async function signInWithPassword(cfg, username, password) {
  const apiKey = String(cfg?.apiKey || "").trim();
  if (!apiKey) {
    const err = new Error("Missing FIREBASE apiKey");
    err.status = 500;
    err.code = "missing-api-key";
    throw err;
  }
  const email = usernameToEmail(username);
  if (!email) {
    const err = new Error("username is required");
    err.status = 400;
    err.code = "missing-username";
    throw err;
  }

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: String(password || ""),
        returnSecureToken: true
      })
    }
  );
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data?.error?.message || `Auth sign-in failed (${resp.status})`);
    err.status = resp.status;
    err.code = data?.error?.message || `auth-${resp.status}`;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg?.projectId;
    if (!projectId) {
      res.status(500).json({ ok: false, error: "Missing FIREBASE projectId" });
      return;
    }

    const body = await readJson(req);
    const authHeader = req.headers.authorization || "";
    let uid = String(body?.uid || "").trim();
    let effectiveAuthHeader = authHeader;

    if (!effectiveAuthHeader) {
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "");
      if (!username || !password) {
        res.status(401).json({ ok: false, error: "Missing Authorization header" });
        return;
      }
      const authData = await signInWithPassword(cfg, username, password);
      uid = String(authData?.localId || "").trim();
      effectiveAuthHeader = `Bearer ${authData.idToken}`;
    }

    if (!uid) {
      res.status(400).json({ ok: false, error: "uid is required" });
      return;
    }

    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
      {
        method: "GET",
        headers: {
          Authorization: effectiveAuthHeader
        }
      }
    );

    if (resp.status === 404) {
      res.status(200).json({ ok: true, document: null });
      return;
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      res.status(resp.status).json({
        ok: false,
        error: data?.error?.message || `Firestore load failed (${resp.status})`,
        code: data?.error?.status || `firestore-load-${resp.status}`
      });
      return;
    }

    res.status(200).json({ ok: true, document: data });
  } catch (err) {
    res.status(err?.status || 500).json({
      ok: false,
      error: err && err.message ? err.message : "Unexpected load error",
      code: err?.code || "load-error"
    });
  }
};
