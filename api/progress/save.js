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

function pick() {
  for (const value of arguments) {
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return "";
}

function getFirebaseConfig() {
  const raw = process.env.FIREBASE_CONFIG;
  if (raw) return JSON.parse(raw);
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

function encodeFirestoreValue(value) {
  if (value === undefined || value === null) return { nullValue: null };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => encodeFirestoreValue(item))
      }
    };
  }
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { nullValue: null };
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === "object") {
    const fields = {};
    Object.entries(value).forEach(([key, entry]) => {
      fields[key] = encodeFirestoreValue(entry);
    });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
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

async function patchUserDocument(projectId, authHeader, payload) {
  const patchBody = {
    fields: {
      email: encodeFirestoreValue(String(payload.email || "")),
      username: encodeFirestoreValue(String(payload.username || "")),
      usernameLower: encodeFirestoreValue(String(payload.usernameLower || "")),
      displayName: encodeFirestoreValue(String(payload.displayName || "")),
      updatedAt: { timestampValue: payload.nowIso },
      lastActiveAt: { timestampValue: payload.nowIso },
      balance: encodeFirestoreValue(Number.isFinite(payload.balance) ? payload.balance : 0),
      gameState: encodeFirestoreValue(payload.gameState && typeof payload.gameState === "object" ? payload.gameState : {})
    }
  };

  const params = new URLSearchParams();
  [
    "email",
    "username",
    "usernameLower",
    "displayName",
    "updatedAt",
    "lastActiveAt",
    "balance",
    "gameState"
  ].forEach((fieldPath) => params.append("updateMask.fieldPaths", fieldPath));

  const resp = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(payload.uid)}?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patchBody)
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data?.error?.message || `Firestore save failed (${resp.status})`);
    err.status = resp.status;
    err.code = data?.error?.status || `firestore-save-${resp.status}`;
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
    const nowIso = new Date().toISOString();

    if (authHeader) {
      const uid = String(body?.uid || "").trim();
      if (!uid) {
        res.status(400).json({ ok: false, error: "uid is required" });
        return;
      }
      const username = String(body?.username || "").trim();
      const normalized = normalizeUsername(username);
      const gameState = body?.gameState && typeof body.gameState === "object" ? body.gameState : {};
      const balance = Number(body?.balance || 0);

      const data = await patchUserDocument(projectId, authHeader, {
        uid,
        email: String(body?.email || ""),
        username,
        usernameLower: normalized,
        displayName: username,
        balance,
        gameState,
        nowIso
      });

      res.status(200).json({ ok: true, document: data });
      return;
    }

    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const progress = body?.progress && typeof body.progress === "object" ? body.progress : null;
    if (!username || !password || !progress) {
      res.status(401).json({ ok: false, error: "Missing Authorization header" });
      return;
    }

    const authData = await signInWithPassword(cfg, username, password);
    const normalized = normalizeUsername(username);
    const balance = Number(progress?.bankBalance || 0);

    const data = await patchUserDocument(projectId, `Bearer ${authData.idToken}`, {
      uid: String(authData.localId || "").trim(),
      email: String(authData.email || ""),
      username,
      usernameLower: normalized,
      displayName: username,
      balance,
      gameState: progress,
      nowIso
    });

    res.status(200).json({ ok: true, document: data });
  } catch (err) {
    res.status(err?.status || 500).json({
      ok: false,
      error: err && err.message ? err.message : "Unexpected save error",
      code: err?.code || "save-error"
    });
  }
};
