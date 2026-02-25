import { createServer } from "node:http";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.join(__dirname, "market-db.json");
const DEMO_LISTING_IDS = new Set(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"]);
const ADMIN_USERNAME = "ronin";
const ADMIN_PASSWORD_HASH = sha256(process.env.ADMIN_PASSWORD || "ronin");
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const NEW_DROP_WINDOW_MS = 24 * 60 * 60 * 1000;
const GENERATED_DIR = path.join(__dirname, "public", "generated-products");
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || "openai").toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AUTO_IMAGE_FALLBACK_BASE = "public/images/catalog";
const KNOWN_BRANDS = new Set([
  "apple", "samsung", "sony", "nintendo", "xbox", "playstation", "microsoft", "google", "amazon", "temu",
  "walmart", "target", "dell", "hp", "asus", "lenovo", "razer", "logitech", "beats", "bose", "nike", "adidas"
]);

const db = await loadDb();
const removedDemoCount = stripDemoListings(db);
if (removedDemoCount > 0) {
  await persistDb();
}
const clients = new Set();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, Number(error?.statusCode) || 500, { error: error?.message || "Internal server error" });
  }
});

setInterval(() => {
  cleanupSessions();
  for (const client of clients) {
    client.res.write(": ping\n\n");
  }
}, 20_000);

server.listen(PORT, () => {
  if (removedDemoCount > 0) {
    console.log(`Removed ${removedDemoCount} demo listing(s) from database.`);
  }
  console.log(`MegaCart server listening on http://localhost:${PORT}`);
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/listings") {
    sendJson(res, 200, { listings: db.listings });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/events") {
    handleSse(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/session") {
    const body = await parseJsonBody(req);
    validateAdminCredentials(body);
    const token = randomUUID();
    db.sessions.push({
      token,
      username: ADMIN_USERNAME,
      expiresAt: Date.now() + SESSION_TTL_MS
    });
    await persistDb();
    sendJson(res, 200, { token, expiresAt: Date.now() + SESSION_TTL_MS });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generateProductImage") {
    const body = await parseJsonBody(req);
    const listing = normalizeImageListingInput(body?.listing);
    const dayKey = normalizeDayKey(body?.dayKey);
    const force = body?.force === true;
    const imageKey = normalizeImageKey(body?.imageKey || buildImageKey(listing, dayKey));
    const providerAllowed = IMAGE_PROVIDER === "openai" && Boolean(OPENAI_API_KEY);
    if (!providerAllowed) {
      const fallback = fallbackImageForCategory(listing.category);
      sendJson(res, 200, { imageUrl: fallback, imageKey, cached: false, fallback: true, reason: "provider_not_configured" });
      return;
    }

    const authOk = isAdminAuthorized(req);
    if (!authOk && body?.autoGeneration !== true) {
      sendJson(res, 401, { error: "Admin or auto generation context required" });
      return;
    }

    db.generatedImages = db.generatedImages && typeof db.generatedImages === "object" ? db.generatedImages : {};
    const cached = db.generatedImages[imageKey];
    if (!force && cached?.imageUrl && !cached.failed && !isFallbackImagePath(cached.imageUrl)) {
      sendJson(res, 200, { imageUrl: cached.imageUrl, imageKey, cached: true, fallback: false });
      return;
    }

    try {
      const output = await generateAndStoreProductImage({ listing, imageKey, dayKey });
      db.generatedImages[imageKey] = {
        imageUrl: output.imageUrl,
        dayKey,
        createdAt: new Date().toISOString(),
        provider: IMAGE_PROVIDER,
        promptHash: sha256(output.prompt)
      };
      await persistDb();
      sendJson(res, 200, { imageUrl: output.imageUrl, imageKey, cached: false, fallback: false });
    } catch (error) {
      const fallback = fallbackImageForCategory(listing.category);
      db.generatedImages[imageKey] = {
        imageUrl: fallback,
        dayKey,
        createdAt: new Date().toISOString(),
        provider: IMAGE_PROVIDER,
        failed: true,
        error: String(error?.message || "generation_failed")
      };
      await persistDb();
      sendJson(res, 200, { imageUrl: fallback, imageKey, cached: false, fallback: true, reason: "generation_failed" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/progress/load") {
    const body = await parseJsonBody(req);
    const username = normalizeUsername(body?.username);
    const password = String(body?.password || "");
    verifyUserCredentials(username, password);
    const record = db.userProgress[username] || null;
    sendJson(res, 200, { progress: record?.progress || null, updatedAt: record?.updatedAt || null });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/progress/save") {
    const body = await parseJsonBody(req);
    const username = normalizeUsername(body?.username);
    const password = String(body?.password || "");
    verifyUserCredentials(username, password);
    if (!body || typeof body.progress !== "object" || !body.progress) {
      sendJson(res, 400, { error: "progress object is required" });
      return;
    }
    db.userProgress[username] = {
      passwordHash: sha256(password),
      progress: body.progress,
      updatedAt: new Date().toISOString()
    };
    await persistDb();
    sendJson(res, 200, { ok: true, updatedAt: db.userProgress[username].updatedAt });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/listings") {
    requireAdminSession(req);
    const body = await parseJsonBody(req);
    const listing = validateListingPayload(body);
    const nowIso = new Date().toISOString();
    const created = {
      id: `listing-${randomUUID()}`,
      ...listing,
      ownerUsername: ADMIN_USERNAME,
      createdAt: nowIso,
      updatedAt: nowIso,
      isPublic: true,
      reviews: []
    };
    db.listings.unshift(created);
    await persistDb();
    broadcast("listing_created", {
      listing: created,
      message: "New Drop just landed.",
      newDropUntil: Date.now() + NEW_DROP_WINDOW_MS
    });
    sendJson(res, 201, { listing: created });
    return;
  }

  const patchMatch = url.pathname.match(/^\/api\/listings\/([^/]+)$/);
  if (patchMatch && req.method === "PATCH") {
    requireAdminSession(req);
    const listingId = decodeURIComponent(patchMatch[1]);
    const body = await parseJsonBody(req);
    const listing = db.listings.find((item) => item.id === listingId);
    if (!listing) {
      sendJson(res, 404, { error: "Listing not found" });
      return;
    }

    if (body.title !== undefined) listing.title = normalizeString(body.title, 120, "title");
    if (body.description !== undefined) listing.description = normalizeString(body.description, 500, "description");
    if (body.category !== undefined) listing.category = normalizeString(body.category, 40, "category");
    if (body.shippingTime !== undefined) listing.shippingTime = normalizeString(body.shippingTime, 50, "shippingTime");
    if (body.image !== undefined) listing.image = normalizeImage(body.image);
    if (body.rarity !== undefined) listing.rarity = normalizeRarity(body.rarity);
    if (body.price !== undefined) listing.price = normalizeMoney(body.price, "price");
    if (body.rating !== undefined) listing.rating = normalizeRating(body.rating);
    if (body.stock !== undefined) listing.stock = normalizeStock(body.stock);
    if (body.ageRestricted !== undefined) listing.ageRestricted = Boolean(body.ageRestricted);
    listing.updatedAt = new Date().toISOString();

    await persistDb();
    broadcast("listing_updated", { listingId, listing });
    sendJson(res, 200, { listing });
    return;
  }

  if (patchMatch && req.method === "DELETE") {
    requireAdminSession(req);
    const listingId = decodeURIComponent(patchMatch[1]);
    const before = db.listings.length;
    db.listings = db.listings.filter((item) => item.id !== listingId);
    if (db.listings.length === before) {
      sendJson(res, 404, { error: "Listing not found" });
      return;
    }
    await persistDb();
    broadcast("listing_deleted", { listingId });
    sendJson(res, 200, { ok: true });
    return;
  }

  const stockMatch = url.pathname.match(/^\/api\/listings\/([^/]+)\/decrement-stock$/);
  if (stockMatch && req.method === "POST") {
    const listingId = decodeURIComponent(stockMatch[1]);
    const body = await parseJsonBody(req);
    const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1));
    const listing = db.listings.find((item) => item.id === listingId);
    if (!listing) {
      sendJson(res, 404, { error: "Listing not found" });
      return;
    }
    if (listing.stock < quantity) {
      sendJson(res, 409, { error: "Insufficient stock" });
      return;
    }
    listing.stock -= quantity;
    listing.updatedAt = new Date().toISOString();
    await persistDb();
    broadcast("listing_updated", { listingId, listing });
    sendJson(res, 200, { listing });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
}

function handleSse(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  const client = { id: randomUUID(), res };
  clients.add(client);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on("close", () => {
    clients.delete(client);
  });
}

function broadcast(event, payload) {
  const packet = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.res.write(packet);
  }
}

function requireAdminSession(req) {
  cleanupSessions();
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const error = new Error("Admin token required");
    error.statusCode = 401;
    throw error;
  }
  const session = db.sessions.find((item) => item.token === token && item.username === ADMIN_USERNAME);
  if (!session || Number(session.expiresAt) <= Date.now()) {
    const error = new Error("Invalid or expired admin session");
    error.statusCode = 401;
    throw error;
  }
}

function isAdminAuthorized(req) {
  try {
    requireAdminSession(req);
    return true;
  } catch {
    return false;
  }
}

function validateAdminCredentials(body) {
  const username = normalizeUsername(body?.username);
  const passwordHash = sha256(String(body?.password || ""));
  const sameHash =
    passwordHash.length === ADMIN_PASSWORD_HASH.length &&
    timingSafeEqual(Buffer.from(passwordHash), Buffer.from(ADMIN_PASSWORD_HASH));

  if (username !== ADMIN_USERNAME || !sameHash) {
    const error = new Error("Invalid admin credentials");
    error.statusCode = 401;
    throw error;
  }
}

function verifyUserCredentials(username, password) {
  if (!username || !password) {
    const error = new Error("username and password are required");
    error.statusCode = 400;
    throw error;
  }
  const existing = db.userProgress[username];
  if (existing && existing.passwordHash) {
    const incomingHash = sha256(password);
    const sameHash =
      incomingHash.length === existing.passwordHash.length &&
      timingSafeEqual(Buffer.from(incomingHash), Buffer.from(existing.passwordHash));
    if (!sameHash) {
      const error = new Error("Invalid account credentials");
      error.statusCode = 401;
      throw error;
    }
  }
}

function validateListingPayload(body) {
  return {
    title: normalizeString(body.title, 120, "title"),
    description: normalizeString(body.description, 500, "description"),
    category: normalizeString(body.category, 40, "category"),
    rarity: normalizeRarity(body.rarity),
    image: normalizeImage(body.image),
    price: normalizeMoney(body.price, "price"),
    rating: normalizeRating(body.rating),
    stock: normalizeStock(body.stock),
    shippingTime: normalizeString(body.shippingTime, 50, "shippingTime"),
    ageRestricted: Boolean(body.ageRestricted)
  };
}

function normalizeString(value, maxLen, field) {
  const normalized = String(value || "").trim().slice(0, maxLen);
  if (!normalized) {
    const error = new Error(`${field} is required`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function normalizeMoney(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    const error = new Error(`${field} must be greater than 0`);
    error.statusCode = 400;
    throw error;
  }
  return Math.round(n * 100) / 100;
}

function normalizeRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 4.2;
  return Math.max(1, Math.min(5, Math.round(n * 10) / 10));
}

function normalizeStock(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) {
    const error = new Error("stock must be 0 or greater");
    error.statusCode = 400;
    throw error;
  }
  return n;
}

function normalizeRarity(value) {
  const rarity = String(value || "").trim().toLowerCase();
  const allowed = new Set(["common", "uncommon", "rare", "epic", "legendary", "mythic"]);
  if (!allowed.has(rarity)) {
    const error = new Error("Invalid rarity");
    error.statusCode = 400;
    throw error;
  }
  return rarity;
}

function normalizeImage(value) {
  const image = String(value || "").trim();
  if (!image) {
    const error = new Error("image is required");
    error.statusCode = 400;
    throw error;
  }
  return image.slice(0, 2_000_000);
}

function normalizeImageListingInput(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    title: normalizeLooseText(input.title, 120, "Generated Product"),
    category: normalizeLooseText(input.category, 40, "Tech"),
    features: Array.isArray(input.features) ? input.features.map((item) => normalizeLooseText(item, 80, "")).filter(Boolean).slice(0, 6) : [],
    rarity: normalizeLooseText(input.rarity, 20, "common")
  };
}

function normalizeDayKey(value) {
  const raw = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeImageKey(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 120);
  if (key) return key;
  return `img_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function normalizeLooseText(value, maxLen, fallback) {
  const text = String(value || "").trim().slice(0, maxLen);
  return text || fallback;
}

function buildImageKey(listing, dayKey) {
  const base = `${listing.title}|${listing.category}|${(listing.features || []).join("|")}|${dayKey}`;
  return `img_${sha256(base).slice(0, 20)}`;
}

function fallbackImageForCategory(category) {
  const key = String(category || "tech").toLowerCase();
  if (key.includes("home")) return `${AUTO_IMAGE_FALLBACK_BASE}/home/home-01.svg`;
  if (key.includes("beauty")) return `${AUTO_IMAGE_FALLBACK_BASE}/beauty/beauty-01.svg`;
  if (key.includes("fitness")) return `${AUTO_IMAGE_FALLBACK_BASE}/fitness/fitness-01.svg`;
  if (key.includes("gaming")) return `${AUTO_IMAGE_FALLBACK_BASE}/gaming/gaming-01.svg`;
  return `${AUTO_IMAGE_FALLBACK_BASE}/tech/tech-01.svg`;
}

function isFallbackImagePath(imageUrl) {
  const url = String(imageUrl || "");
  return url.startsWith("public/images/catalog/");
}

function sanitizeImageText(text) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      const stripped = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (KNOWN_BRANDS.has(stripped)) return "generic";
      return word;
    })
    .join(" ")
    .slice(0, 220);
}

function categoryStyle(category) {
  const key = String(category || "").toLowerCase();
  if (key.includes("home")) return "home goods item, fabric/wood/metal realistic textures";
  if (key.includes("beauty")) return "cosmetic container or beauty tool, clean minimal design";
  if (key.includes("fitness")) return "fitness accessory, rubber/foam textures, sporty look";
  if (key.includes("gaming")) return "gaming accessory, subtle RGB accent glow, no text";
  return "modern consumer electronics, matte plastic and aluminum, subtle details";
}

function rarityStyle(rarity) {
  const key = String(rarity || "").toLowerCase();
  if (key === "epic" || key === "legendary" || key === "mythic") {
    return "premium materials, subtle cinematic accent lighting, still realistic";
  }
  if (key === "rare") return "slightly premium materials and finish";
  return "standard realistic product finish";
}

function buildImagePrompt(listing) {
  const safeTitle = sanitizeImageText(listing.title);
  const safeFeatures = (listing.features || []).map(sanitizeImageText).filter(Boolean).slice(0, 6);
  const styleBase = "High-quality studio product photography of a single generic product on a clean background, soft diffused lighting, realistic shadows, centered composition, 1:1 square, ultra sharp, no text, no logo, no watermark, no brand marks, no packaging text.";
  const cat = categoryStyle(listing.category);
  const rare = rarityStyle(listing.rarity);
  const featureHints = safeFeatures.length ? `Visual hints: ${safeFeatures.join(", ")}.` : "";
  return `${styleBase} Product: ${safeTitle}. Category style: ${cat}. Material quality: ${rare}. ${featureHints}`.trim();
}

async function generateAndStoreProductImage({ listing, imageKey, dayKey }) {
  const prompt = buildImagePrompt(listing);
  const negativePrompt = "no text, no letters, no words, no logos, no watermark, no brand, no human hands, no face, no messy background, no multiple products";

  // Try a richer payload first, then fall back to a minimal request for compatibility.
  const firstPayload = {
    model: IMAGE_MODEL,
    prompt,
    size: "1024x1024",
    n: 1,
    response_format: "b64_json",
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {})
  };
  let response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(firstPayload)
  });

  if (!response.ok) {
    const minimalPayload = {
      model: IMAGE_MODEL,
      prompt,
      size: "1024x1024",
      n: 1
    };
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(minimalPayload)
    });
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`image_api_failed:${response.status}:${txt.slice(0, 240)}`);
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json || "";
  const hostedUrl = data?.data?.[0]?.url || "";
  if (!b64 && !hostedUrl) throw new Error("image_api_no_payload");

  if (b64) {
    const dir = path.join(GENERATED_DIR, dayKey);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${imageKey}.jpg`);
    await fs.writeFile(filePath, Buffer.from(b64, "base64"));
    return {
      imageUrl: `public/generated-products/${dayKey}/${imageKey}.jpg`,
      prompt
    };
  }
  return {
    imageUrl: String(hostedUrl),
    prompt
  };
}

function cleanupSessions() {
  db.sessions = db.sessions.filter((item) => Number(item.expiresAt) > Date.now());
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
}

async function serveStatic(req, res, url) {
  let target = decodeURIComponent(url.pathname);
  if (target === "/") target = "/index.html";

  const absolute = path.normalize(path.join(__dirname, target));
  if (!absolute.startsWith(__dirname)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(absolute);
    res.writeHead(200, { "Content-Type": contentType(absolute) });
    res.end(content);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

async function loadDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      userProgress: parsed.userProgress && typeof parsed.userProgress === "object" ? parsed.userProgress : {},
      generatedImages: parsed.generatedImages && typeof parsed.generatedImages === "object" ? parsed.generatedImages : {}
    };
  } catch {
    const empty = { listings: [], sessions: [], userProgress: {}, generatedImages: {} };
    await fs.writeFile(DB_PATH, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function persistDb() {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempPath, DB_PATH);
}

function stripDemoListings(state) {
  const before = Array.isArray(state.listings) ? state.listings.length : 0;
  state.listings = (state.listings || []).filter((listing) => {
    const id = String(listing?.id || "");
    if (DEMO_LISTING_IDS.has(id)) return false;
    if (id.startsWith("p") && /^p\d+$/.test(id)) return false;
    return true;
  });
  return before - state.listings.length;
}
