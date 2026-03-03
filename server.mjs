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
const NORMAL_SLOT_COUNT = 4;
const SPECIAL_SLOT_COUNT = 2;
const ORDER_TICK_MS = 15 * 1000;
const DELIVERY_MIN_MAX_BY_RARITY_MIN = {
  common: [1, 3],
  uncommon: [1, 2],
  rare: [1, 2],
  epic: [1, 1],
  legendary: [1, 1],
  mythic: [1, 1]
};
const RARITY_CONFIG = {
  common: { weight: 60, durationMs: 24 * 60 * 60 * 1000 },
  uncommon: { weight: 22, durationMs: 6 * 60 * 60 * 1000 },
  rare: { weight: 10, durationMs: 60 * 60 * 1000 },
  epic: { weight: 6, durationMs: 20 * 60 * 1000 },
  legendary: { weight: 1.5, durationRangeMs: [5 * 60 * 1000, 10 * 60 * 1000] },
  mythic: { weight: 0.5, durationRangeMs: [5 * 60 * 1000, 10 * 60 * 1000] }
};
const SHOP_CATALOG = [
  { id: "energy_drink", name: "Energy Drink", basePrice: 120, rarity: "common", maxStack: 25 },
  { id: "coffee", name: "Premium Coffee", basePrice: 180, rarity: "uncommon", maxStack: 25 },
  { id: "protein_bar", name: "Protein Bar", basePrice: 260, rarity: "rare", maxStack: 20 },
  { id: "lucky_coin", name: "Lucky Coin", basePrice: 340, rarity: "epic", maxStack: 15 },
  { id: "vip_crate", name: "VIP Crate", basePrice: 520, rarity: "legendary", maxStack: 10 },
  { id: "mythic_cache", name: "Mythic Cache", basePrice: 900, rarity: "mythic", maxStack: 8 }
];

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
setInterval(() => {
  processOrderStatusUpdates().catch(() => {});
  processRotatingShopState().catch(() => {});
}, ORDER_TICK_MS);

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

  if (req.method === "GET" && url.pathname === "/api/shop") {
    await processRotatingShopState();
    const slots = Array.isArray(db.shopState?.slots) ? db.shopState.slots : [];
    sendJson(res, 200, { slots, lastUpdatedAt: db.shopState?.lastUpdatedAt || Date.now() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/shop/buy") {
    const body = await parseJsonBody(req);
    const username = normalizeUsername(body?.username);
    const password = String(body?.password || "");
    const slotId = String(body?.slotId || "").trim();
    const itemId = String(body?.itemId || "").trim();
    verifyUserCredentials(username, password);
    const now = Date.now();
    let slot = null;
    if (itemId) {
      const directItem = SHOP_CATALOG.find((item) => item.id === itemId);
      if (!directItem) {
        sendJson(res, 404, { error: "Item not found" });
        return;
      }
      slot = {
        slotId: `direct_${directItem.id}`,
        slotType: "normal",
        itemId: directItem.id,
        name: directItem.name,
        rarity: directItem.rarity || "common",
        price: Number(directItem.basePrice || 0),
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000
      };
    } else {
      if (!slotId) {
        sendJson(res, 400, { error: "slotId or itemId is required" });
        return;
      }
      await processRotatingShopState();
      const slots = Array.isArray(db.shopState?.slots) ? db.shopState.slots : [];
      slot = slots.find((s) => s.slotId === slotId);
      if (!slot) {
        sendJson(res, 404, { error: "Slot not found" });
        return;
      }
      if (slot.expiresAt <= now) {
        sendJson(res, 409, { error: "Slot expired" });
        return;
      }
      if (!slot.itemId) {
        sendJson(res, 409, { error: "No item in this slot" });
        return;
      }
    }

    const progress = ensureUserProgress(username, password);
    const money = Number(progress.bankBalance) || 0;
    if (money < slot.price) {
      sendJson(res, 409, { error: "Insufficient funds" });
      return;
    }
    const catalogItem = SHOP_CATALOG.find((item) => item.id === slot.itemId);
    if (!catalogItem) {
      sendJson(res, 409, { error: "Item no longer valid" });
      return;
    }
    const purchasedMeta = {
      itemId: catalogItem.id,
      name: slot.name || catalogItem.name,
      rarity: slot.rarity
    };

    progress.bankBalance = Math.floor((money - slot.price) * 100) / 100;
    if (!Array.isArray(progress.txLog)) progress.txLog = [];
    progress.txLog.unshift({
      ts: now,
      type: "shop_order",
      amount: -slot.price,
      meta: { itemId: slot.itemId, rarity: slot.rarity, slotId: slot.slotId }
    });
    progress.txLog = progress.txLog.slice(0, 25);

    const order = createOrderForSlot(username, slot);
    db.orders[order.orderId] = order;
    if (!Array.isArray(db.userOrders[username])) db.userOrders[username] = [];
    db.userOrders[username].unshift(order.orderId);

    if (!itemId) rotateSlotNow(slot, now);

    db.userProgress[username] = {
      passwordHash: sha256(password),
      progress,
      updatedAt: new Date().toISOString()
    };
    await persistDb();

    sendJson(res, 200, {
      ok: true,
      purchasedItem: purchasedMeta,
      bankBalance: progress.bankBalance,
      orderId: order.orderId,
      trackingId: order.trackingId
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/shop/admin/force-rotate") {
    requireAdminSession(req);
    db.shopState = null;
    await processRotatingShopState();
    await persistDb();
    sendJson(res, 200, { ok: true, slots: db.shopState?.slots || [] });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders/list") {
    const body = await parseJsonBody(req);
    const username = normalizeUsername(body?.username);
    const password = String(body?.password || "");
    verifyUserCredentials(username, password);
    await processOrderStatusUpdates();
    const ids = Array.isArray(db.userOrders[username]) ? db.userOrders[username] : [];
    const orders = ids.map((id) => db.orders[id]).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
    sendJson(res, 200, { orders });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders/track") {
    const body = await parseJsonBody(req);
    const username = normalizeUsername(body?.username);
    const password = String(body?.password || "");
    const trackingId = String(body?.trackingId || "").trim();
    verifyUserCredentials(username, password);
    if (!trackingId) {
      sendJson(res, 400, { error: "trackingId is required" });
      return;
    }
    await processOrderStatusUpdates();
    const order = Object.values(db.orders).find((o) => o.userId === username && o.trackingId === trackingId);
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }
    sendJson(res, 200, { order });
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

function ensureUserProgress(username, password) {
  const existing = db.userProgress[username]?.progress;
  const now = new Date().toISOString();
  const progress =
    existing && typeof existing === "object"
      ? existing
      : {
          schemaVersion: 2,
          bankBalance: 500,
          bankLevel: 1,
          bankXP: 0,
          reputation: 0,
          inventory: {},
          txLog: []
        };
  db.userProgress[username] = {
    passwordHash: sha256(password),
    progress,
    updatedAt: now
  };
  return progress;
}

function dayBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return { start, end, dateKey: `${y}-${m}-${d}` };
}

function ensureDailySchedule(now = Date.now()) {
  const bounds = dayBounds(new Date(now));
  if (!db.dailyShopSchedules[bounds.dateKey]) {
    const count = randInt(2, 6);
    const specialSpawns = [];
    for (let i = 0; i < count; i += 1) {
      specialSpawns.push(randInt(bounds.start, bounds.end - 1));
    }
    specialSpawns.sort((a, b) => a - b);
    db.dailyShopSchedules[bounds.dateKey] = {
      dateKey: bounds.dateKey,
      generatedAt: now,
      specialSpawns
    };
  }
  return db.dailyShopSchedules[bounds.dateKey];
}

function ensureShopState(now = Date.now()) {
  const schedule = ensureDailySchedule(now);
  const bounds = dayBounds(new Date(now));
  if (!db.shopState || db.shopState.dateKey !== schedule.dateKey) {
    db.shopState = {
      dateKey: schedule.dateKey,
      lastUpdatedAt: now,
      lastProcessedSpawnAt: bounds.start - 1,
      slots: [
        ...Array.from({ length: NORMAL_SLOT_COUNT }).map((_, i) => createEmptySlot(`normal_${i + 1}`, "normal")),
        ...Array.from({ length: SPECIAL_SLOT_COUNT }).map((_, i) => createEmptySlot(`special_${i + 1}`, "special"))
      ]
    };
  }
  return db.shopState;
}

function createEmptySlot(slotId, slotType) {
  return {
    slotId,
    slotType,
    itemId: null,
    name: null,
    rarity: null,
    price: null,
    createdAt: null,
    expiresAt: 0
  };
}

function pickRarityForSlot(slotType) {
  const pool = slotType === "special"
    ? [
        { rarity: "legendary", weight: RARITY_CONFIG.legendary.weight },
        { rarity: "mythic", weight: RARITY_CONFIG.mythic.weight }
      ]
    : [
        { rarity: "common", weight: RARITY_CONFIG.common.weight },
        { rarity: "uncommon", weight: RARITY_CONFIG.uncommon.weight },
        { rarity: "rare", weight: RARITY_CONFIG.rare.weight },
        { rarity: "epic", weight: RARITY_CONFIG.epic.weight }
      ];
  const total = pool.reduce((sum, x) => sum + x.weight, 0);
  let roll = Math.random() * total;
  for (const p of pool) {
    roll -= p.weight;
    if (roll <= 0) return p.rarity;
  }
  return pool[0].rarity;
}

function durationForRarity(rarity) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  if (cfg.durationRangeMs) return randInt(cfg.durationRangeMs[0], cfg.durationRangeMs[1]);
  return cfg.durationMs;
}

function rotateSlotNow(slot, now = Date.now(), forcedRarity = null) {
  if (!slot) return;
  if (slot.slotType === "special" && !forcedRarity) {
    Object.assign(slot, createEmptySlot(slot.slotId, "special"));
    return;
  }
  const rarity = forcedRarity || pickRarityForSlot(slot.slotType);
  const candidates = SHOP_CATALOG.filter((x) => x.rarity === rarity);
  const item = candidates[randInt(0, Math.max(0, candidates.length - 1))] || SHOP_CATALOG[0];
  const rarityMultMap = { common: 1, uncommon: 1.12, rare: 1.26, epic: 1.45, legendary: 1.75, mythic: 2.1 };
  const price = Math.max(1, Math.round(item.basePrice * (rarityMultMap[rarity] || 1)));
  slot.itemId = item.id;
  slot.name = item.name;
  slot.rarity = rarity;
  slot.price = price;
  slot.createdAt = now;
  slot.expiresAt = now + durationForRarity(rarity);
}

function processSpecialSpawns(shopState, now = Date.now()) {
  const schedule = db.dailyShopSchedules[shopState.dateKey];
  if (!schedule || !Array.isArray(schedule.specialSpawns)) return;
  const due = schedule.specialSpawns.filter((ts) => ts > Number(shopState.lastProcessedSpawnAt || 0) && ts <= now);
  if (!due.length) return;
  const specials = shopState.slots.filter((slot) => slot.slotType === "special");
  for (const ts of due) {
    const openSlot = specials.find((slot) => !slot.itemId || now >= Number(slot.expiresAt || 0));
    if (!openSlot) continue;
    rotateSlotNow(openSlot, ts, pickRarityForSlot("special"));
    shopState.lastProcessedSpawnAt = ts;
  }
  if (due.length) {
    shopState.lastProcessedSpawnAt = Math.max(Number(shopState.lastProcessedSpawnAt || 0), due[due.length - 1]);
  }
}

async function processRotatingShopState(now = Date.now()) {
  const shopState = ensureShopState(now);
  let dirty = false;
  for (const slot of shopState.slots) {
    if (slot.slotType === "normal") {
      if (!slot.itemId || now >= Number(slot.expiresAt || 0)) {
        rotateSlotNow(slot, now);
        dirty = true;
      }
    } else if (slot.slotType === "special") {
      if (slot.itemId && now >= Number(slot.expiresAt || 0)) {
        rotateSlotNow(slot, now, null);
        dirty = true;
      }
    }
  }
  const before = JSON.stringify(shopState.slots);
  processSpecialSpawns(shopState, now);
  if (before !== JSON.stringify(shopState.slots)) dirty = true;
  shopState.lastUpdatedAt = now;
  if (dirty) await persistDb();
}

function createOrderForSlot(username, slot) {
  const now = Date.now();
  const [minMin, maxMin] = DELIVERY_MIN_MAX_BY_RARITY_MIN[slot.rarity] || DELIVERY_MIN_MAX_BY_RARITY_MIN.common;
  const etaMs = randInt(minMin, maxMin) * 60 * 1000;
  const etaAt = now + etaMs;
  const shippedAt = now + Math.max(60 * 1000, Math.floor(etaMs * 0.25));
  const outForDeliveryAt = now + Math.max(2 * 60 * 1000, Math.floor(etaMs * 0.75));
  return {
    orderId: `ord_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
    userId: username,
    trackingId: buildTrackingId(),
    items: [{ itemId: slot.itemId, name: slot.name, qty: 1, price: slot.price, rarity: slot.rarity }],
    subtotal: slot.price,
    shippingFee: 0,
    total: slot.price,
    status: "Processing",
    createdAt: now,
    etaAt,
    shippedAt,
    outForDeliveryAt,
    deliveredAt: null,
    inventoryGranted: false,
    timeline: [{ status: "Processing", at: now }]
  };
}

function buildTrackingId() {
  let digits = "";
  for (let i = 0; i < 10; i += 1) digits += String(randInt(0, 9));
  return `MS${digits}`;
}

async function processOrderStatusUpdates() {
  const now = Date.now();
  let dirty = false;

  for (const order of Object.values(db.orders)) {
    if (!order || order.status === "Delivered") {
      if (order && order.status === "Delivered" && !order.inventoryGranted) {
        grantDeliveredItems(order);
        order.inventoryGranted = true;
        order.deliveredAt = order.deliveredAt || now;
        dirty = true;
      }
      continue;
    }

    let nextStatus = "Processing";
    if (now >= order.etaAt) nextStatus = "Delivered";
    else if (now >= order.outForDeliveryAt) nextStatus = "OutForDelivery";
    else if (now >= order.shippedAt) nextStatus = "Shipped";

    if (nextStatus !== order.status) {
      order.status = nextStatus;
      order.timeline.push({ status: nextStatus, at: now });
      dirty = true;
      if (nextStatus === "Delivered") {
        order.deliveredAt = now;
        if (!order.inventoryGranted) {
          grantDeliveredItems(order);
          order.inventoryGranted = true;
        }
      }
    }
  }

  if (dirty) await persistDb();
}

function grantDeliveredItems(order) {
  const username = order.userId;
  const account = db.userProgress[username];
  if (!account || !account.progress || typeof account.progress !== "object") return;
  const progress = account.progress;
  if (!progress.inventory || typeof progress.inventory !== "object") progress.inventory = {};

  for (const line of order.items || []) {
    const item = SHOP_CATALOG.find((x) => x.id === line.itemId);
    const maxStack = item?.maxStack || 99;
    const current = Number(progress.inventory[line.itemId]?.qty || 0);
    const next = Math.min(maxStack, current + Math.max(1, Number(line.qty) || 1));
    progress.inventory[line.itemId] = { qty: next };
  }
  account.updatedAt = new Date().toISOString();
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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function loadDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      userProgress: parsed.userProgress && typeof parsed.userProgress === "object" ? parsed.userProgress : {},
      generatedImages: parsed.generatedImages && typeof parsed.generatedImages === "object" ? parsed.generatedImages : {},
      rotatingShop: parsed.rotatingShop && typeof parsed.rotatingShop === "object" ? parsed.rotatingShop : {},
      orders: parsed.orders && typeof parsed.orders === "object" ? parsed.orders : {},
      userOrders: parsed.userOrders && typeof parsed.userOrders === "object" ? parsed.userOrders : {},
      dailyShopSchedules: parsed.dailyShopSchedules && typeof parsed.dailyShopSchedules === "object" ? parsed.dailyShopSchedules : {},
      shopState: parsed.shopState && typeof parsed.shopState === "object" ? parsed.shopState : null
    };
  } catch {
    const empty = { listings: [], sessions: [], userProgress: {}, generatedImages: {}, rotatingShop: {}, orders: {}, userOrders: {}, dailyShopSchedules: {}, shopState: null };
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
