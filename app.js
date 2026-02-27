(() => {
  const STORAGE_KEY = "fakebank_state_v1";
  const LOCAL_USER_KEY = "fakebank_local_user";
  const LOCAL_ACCOUNTS_KEY = "fakebank_local_accounts_v1";
  const REQUIRED_FIREBASE_KEYS = ["apiKey", "authDomain", "projectId", "appId"];

  const SCHEMA_VERSION = 2;
  const XP_PER_LEVEL_BASE = 40;
  const MAIN_COOLDOWN_MS = 5 * 60 * 1000;
  const QUICK_WINDOW_MS = 5 * 60 * 1000;
  const QUICK_MAX_IN_WINDOW = 3;
  const STREAK_WINDOW_MS = 60 * 1000;

  const MAIN_JOBS = [
    { id: "data_entry", name: "Data Entry", durationMin: 2, basePay: 40, unlockLevel: 1, category: "general" },
    { id: "deliver_package", name: "Deliver Package", durationMin: 5, basePay: 90, unlockLevel: 1, category: "labor" },
    { id: "fast_food", name: "Fast Food Shift", durationMin: 10, basePay: 180, unlockLevel: 1, category: "labor" },
    { id: "warehouse", name: "Warehouse Shift", durationMin: 30, basePay: 700, unlockLevel: 3, category: "labor" },
    { id: "route", name: "Delivery Route", durationMin: 45, basePay: 1100, unlockLevel: 4, category: "labor" },
    { id: "night_shift", name: "Night Shift", durationMin: 60, basePay: 1500, unlockLevel: 5, category: "general" },
    { id: "crypto", name: "Crypto Trading", durationMin: 20, basePay: 500, unlockLevel: 7, category: "risky", riskType: "crypto" },
    { id: "flip", name: "Investment Flip", durationMin: 60, basePay: 1500, unlockLevel: 8, category: "risky", riskType: "flip" },
    { id: "contract", name: "High Stakes Contract", durationMin: 120, basePay: 2800, unlockLevel: 10, category: "risky", riskType: "contract" }
  ];

  const QUICK_TASKS = [
    { id: "survey", name: "Answer Survey", durationSec: 45, basePay: 35 },
    { id: "sorting", name: "Package Sorting", durationSec: 30, basePay: 25 },
    { id: "sprint", name: "Delivery Sprint", durationSec: 60, basePay: 60 },
    { id: "support", name: "Customer Support Reply", durationSec: 50, basePay: 45 }
  ];

  const BOOST_SHOP = [
    { id: "focus", name: "Work Focus", baseCost: 2500, type: "moneyMultiplier", value: 0.15, durationMs: 5 * 60 * 1000 },
    { id: "drink", name: "Energy Drink", baseCost: 3000, type: "cooldownReduction", value: 0.15, durationMs: 5 * 60 * 1000 },
    { id: "charm", name: "Lucky Charm", baseCost: 4000, type: "luckBonus", value: 0.10, durationMs: 5 * 60 * 1000 }
  ];

  const POWER_DURATION_MS = 21 * 60 * 60 * 1000;
  const MAX_ACTIVE_POWER_BOOSTS = 6;
  const MAX_POWER_PURCHASES_PER_MIN = 6;

  const ITEM_CATALOG = [
    {
      id: "energy_drink",
      name: "Energy Drink",
      price: 120,
      description: "Cuts cooldown and duration for a short burst.",
      maxStack: 25,
      icon: "⚡",
      boost: { type: "cooldownReduction", value: 0.12, durationMs: 21 * 60 * 60 * 1000 }
    },
    {
      id: "coffee",
      name: "Premium Coffee",
      price: 180,
      description: "Boosts payout multiplier for 4 minutes.",
      maxStack: 25,
      icon: "☕",
      boost: { type: "moneyMultiplier", value: 0.10, durationMs: 21 * 60 * 60 * 1000 }
    },
    {
      id: "protein_bar",
      name: "Protein Bar",
      price: 260,
      description: "Adds payout bonus for next 4 payout events.",
      maxStack: 20,
      icon: "🍫",
      boost: { type: "payoutBonusNextN", value: 0.08, durationMs: 21 * 60 * 60 * 1000, remainingUses: 4 }
    },
    {
      id: "lucky_coin",
      name: "Lucky Coin",
      price: 340,
      description: "Improves risky outcome odds for 6 minutes.",
      maxStack: 15,
      icon: "🪙",
      boost: { type: "luckBonus", value: 0.08, durationMs: 21 * 60 * 60 * 1000 }
    },
    {
      id: "quantum_payday",
      name: "Quantum Payday",
      price: 250000,
      rarity: "Mythic",
      description: "Power Item: +250% ALL passive income payouts.",
      maxStack: 3,
      icon: "🧬",
      category: "power",
      power: { effect: "passiveIncomeMultiplier", value: 2.5, stackable: true, maxStacks: 3 }
    },
    {
      id: "double_dip_rewards",
      name: "Double Dip Rewards",
      price: 180000,
      rarity: "Legendary",
      description: "Power Item: Adds an extra +80% payout on reward triggers.",
      maxStack: 1,
      icon: "🎁",
      category: "power",
      power: { effect: "duplicatePayoutFactor", value: 0.8, stackable: false, maxStacks: 1 }
    },
    {
      id: "lucky_magnet",
      name: "Lucky Magnet",
      price: 220000,
      rarity: "Legendary",
      description: "Power Item: Strongly boosts high-roll chances.",
      maxStack: 2,
      icon: "🧲",
      category: "power",
      power: { effect: "luckyMagnet", value: 1, stackable: true, maxStacks: 2 }
    },
    {
      id: "overclock_mode",
      name: "Overclock Mode",
      price: 260000,
      rarity: "Mythic",
      description: "Power Item: Reduces timers/cooldowns by 40%.",
      maxStack: 1,
      icon: "🚀",
      category: "power",
      power: { effect: "cooldownMultiplier", value: 0.6, stackable: false, maxStacks: 1 }
    },
    {
      id: "black_friday_pass",
      name: "Black Friday Pass",
      price: 200000,
      rarity: "Epic",
      description: "Power Item: Shop prices -35% (floor factor 0.75).",
      maxStack: 1,
      icon: "🛍️",
      category: "power",
      power: { effect: "shopDiscountFactor", value: 0.65, stackable: false, maxStacks: 1 }
    },
    {
      id: "vault_insurance",
      name: "Vault Insurance",
      price: 300000,
      rarity: "Mythic",
      description: "Power Item: Immunity to penalty loss events.",
      maxStack: 1,
      icon: "🛡️",
      category: "power",
      power: { effect: "lossImmunity", value: 1, stackable: false, maxStacks: 1 }
    },
    {
      id: "instant_delivery_token",
      name: "Instant Delivery Token",
      price: 150000,
      rarity: "Epic",
      description: "Power Item: +5 instant-delivery charges while active.",
      maxStack: 3,
      icon: "📦",
      category: "power",
      power: { effect: "instantDeliveryCharges", value: 5, stackable: true, maxStacks: 3 }
    },
    {
      id: "mega_inventory_expand",
      name: "Mega Inventory Expand",
      price: 175000,
      rarity: "Rare",
      description: "Power Item: +200 inventory capacity while active.",
      maxStack: 1,
      icon: "🗄️",
      category: "power",
      power: { effect: "inventoryCapacityBonus", value: 200, stackable: false, maxStacks: 1 }
    }
  ];

  const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "MegaShip"];

  const BUSINESSES = [
    { id: "lemonade", name: "Lemonade Stand", icon: "🍋", baseCost: 10000, intervalMs: 2 * 60 * 1000, basePayout: 50, unlockType: "totalEarned", unlockValue: 0 },
    { id: "hotdog", name: "Hotdog Stand", icon: "🌭", baseCost: 25000, intervalMs: 2 * 60 * 1000, basePayout: 120, unlockType: "totalEarned", unlockValue: 500 },
    { id: "pizza", name: "Pizza Delivery", icon: "🍕", baseCost: 75000, intervalMs: 2 * 60 * 1000, basePayout: 260, unlockType: "totalEarned", unlockValue: 2500 },
    { id: "coffee_shop", name: "Coffee Shop", icon: "☕", baseCost: 150000, intervalMs: 2 * 60 * 1000, basePayout: 420, unlockType: "totalEarned", unlockValue: 8000 },
    { id: "film_studio", name: "Film Studio", icon: "🎬", baseCost: 600000, intervalMs: 2 * 60 * 1000, basePayout: 1400, unlockType: "totalEarned", unlockValue: 25000 },
    { id: "firm", name: "Investment Firm", icon: "🏦", baseCost: 1000000, intervalMs: 2 * 60 * 1000, basePayout: 0, unlockType: "totalEarned", unlockValue: 70000 }
  ];

  const BUSINESS_UPGRADES = [
    { id: "profit_boost_1", name: "Profit Boost I", cost: 85000, desc: "x1.25 payout on all businesses." },
    { id: "speed_boost_1", name: "Speed Boost I", cost: 90000, desc: "Cycle time -10% on all businesses." }
  ];

  const SKILL_CAPS = { efficiency: 10, speed: 10, luck: 10, charisma: 30 };
  const POWER_ITEM_BY_ID = Object.fromEntries(ITEM_CATALOG.filter((x) => x.category === "power").map((x) => [x.id, x]));

  const dom = {
    authScreen: document.getElementById("authScreen"),
    gameScreen: document.getElementById("gameScreen"),
    usernameInput: document.getElementById("usernameInput"),
    passwordInput: document.getElementById("passwordInput"),
    loginBtn: document.getElementById("loginBtn"),
    signupBtn: document.getElementById("signupBtn"),
    guestBtn: document.getElementById("guestBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    whoami: document.getElementById("whoami"),
    authError: document.getElementById("authError"),
    setupMessage: document.getElementById("setupMessage"),

    tabBankBtn: document.getElementById("tabBankBtn"),
    tabSpendBtn: document.getElementById("tabSpendBtn"),
    tabStoreBtn: document.getElementById("tabStoreBtn"),
    tabInventoryBtn: document.getElementById("tabInventoryBtn"),
    tabOrdersBtn: document.getElementById("tabOrdersBtn"),
    tabFriendsBtn: document.getElementById("tabFriendsBtn"),
    tabTradeBtn: document.getElementById("tabTradeBtn"),
    tabSendBtn: document.getElementById("tabSendBtn"),

    bankTab: document.getElementById("bankTab"),
    spendTab: document.getElementById("spendTab"),
    storeTab: document.getElementById("storeTab"),
    inventoryTab: document.getElementById("inventoryTab"),
    ordersTab: document.getElementById("ordersTab"),
    friendsTab: document.getElementById("friendsTab"),
    tradeTab: document.getElementById("tradeTab"),
    sendTab: document.getElementById("sendTab"),

    saveStatus: document.getElementById("saveStatus"),
    saveNowBtn: document.getElementById("saveNowBtn"),
    resetSaveBtn: document.getElementById("resetSaveBtn"),

    balanceText: document.getElementById("balanceText"),
    levelText: document.getElementById("levelText"),
    xpText: document.getElementById("xpText"),
    repText: document.getElementById("repText"),
    xpBar: document.getElementById("xpBar"),
    dailyBtn: document.getElementById("dailyBtn"),
    interestBtn: document.getElementById("interestBtn"),
    dailyStatus: document.getElementById("dailyStatus"),
    interestStatus: document.getElementById("interestStatus"),

    mainJobStatus: document.getElementById("mainJobStatus"),
    mainSlotsText: document.getElementById("mainSlotsText"),
    mainJobTimer: document.getElementById("mainJobTimer"),
    mainFinishAt: document.getElementById("mainFinishAt"),
    claimMainJobBtn: document.getElementById("claimMainJobBtn"),
    activeJobsList: document.getElementById("activeJobsList"),
    cooldownStatus: document.getElementById("cooldownStatus"),
    streakText: document.getElementById("streakText"),
    streakWindowText: document.getElementById("streakWindowText"),
    jobBoard: document.getElementById("jobBoard"),

    quickQuotaText: document.getElementById("quickQuotaText"),
    quickTaskStatus: document.getElementById("quickTaskStatus"),
    quickTaskTimer: document.getElementById("quickTaskTimer"),
    claimQuickTaskBtn: document.getElementById("claimQuickTaskBtn"),
    quickTaskBoard: document.getElementById("quickTaskBoard"),

    opportunityStatus: document.getElementById("opportunityStatus"),
    opportunityTimer: document.getElementById("opportunityTimer"),
    acceptOpportunityBtn: document.getElementById("acceptOpportunityBtn"),
    nextOpportunityText: document.getElementById("nextOpportunityText"),

    txLog: document.getElementById("txLog"),

    boostStatus: document.getElementById("boostStatus"),
    boostShop: document.getElementById("boostShop"),
    skillPointText: document.getElementById("skillPointText"),
    trainingCostText: document.getElementById("trainingCostText"),
    buyTrainingBtn: document.getElementById("buyTrainingBtn"),
    parallelUpgradeText: document.getElementById("parallelUpgradeText"),
    buyParallelUpgradeBtn: document.getElementById("buyParallelUpgradeBtn"),
    skillsPanel: document.getElementById("skillsPanel"),
    businessPanel: document.getElementById("businessPanel"),
    businessMoneyBar: document.getElementById("businessMoneyBar"),
    restartBusinessesBtn: document.getElementById("restartBusinessesBtn"),
    bizTabBusinessesBtn: document.getElementById("bizTabBusinessesBtn"),
    bizTabUpgradesBtn: document.getElementById("bizTabUpgradesBtn"),
    bizTabManagersBtn: document.getElementById("bizTabManagersBtn"),
    bizTabStatsBtn: document.getElementById("bizTabStatsBtn"),
    bizPanelBusinesses: document.getElementById("bizPanelBusinesses"),
    bizPanelUpgrades: document.getElementById("bizPanelUpgrades"),
    bizPanelManagers: document.getElementById("bizPanelManagers"),
    bizPanelStats: document.getElementById("bizPanelStats"),
    businessUpgradesPanel: document.getElementById("businessUpgradesPanel"),
    businessManagersPanel: document.getElementById("businessManagersPanel"),
    businessStatsPanel: document.getElementById("businessStatsPanel"),

    coinBetInput: document.getElementById("coinBetInput"),
    coinFlipBtn: document.getElementById("coinFlipBtn"),
    coinFlipHint: document.getElementById("coinFlipHint"),
    coinFlipStats: document.getElementById("coinFlipStats"),

    storeList: document.getElementById("storeList"),
    shopLastUpdated: document.getElementById("shopLastUpdated"),
    inventoryList: document.getElementById("inventoryList"),
    activeBoostList: document.getElementById("activeBoostList"),
    effectiveModsText: document.getElementById("effectiveModsText"),
    ordersList: document.getElementById("ordersList"),
    trackPanel: document.getElementById("trackPanel"),
    trackingSearchInput: document.getElementById("trackingSearchInput"),
    trackingSearchBtn: document.getElementById("trackingSearchBtn"),

    friendSearchInput: document.getElementById("friendSearchInput"),
    friendSearchBtn: document.getElementById("friendSearchBtn"),
    friendSearchResults: document.getElementById("friendSearchResults"),
    friendsList: document.getElementById("friendsList"),
    incomingRequestsList: document.getElementById("incomingRequestsList"),
    outgoingRequestsList: document.getElementById("outgoingRequestsList"),

    tradeFriendSelect: document.getElementById("tradeFriendSelect"),
    tradeOfferMoneyInput: document.getElementById("tradeOfferMoneyInput"),
    tradeRequestMoneyInput: document.getElementById("tradeRequestMoneyInput"),
    tradeOfferItemsInput: document.getElementById("tradeOfferItemsInput"),
    tradeRequestItemsInput: document.getElementById("tradeRequestItemsInput"),
    createTradeBtn: document.getElementById("createTradeBtn"),
    incomingTradesList: document.getElementById("incomingTradesList"),
    outgoingTradesList: document.getElementById("outgoingTradesList"),
    tradeHistoryList: document.getElementById("tradeHistoryList"),

    sendFriendSelect: document.getElementById("sendFriendSelect"),
    sendAmountInput: document.getElementById("sendAmountInput"),
    sendNoteInput: document.getElementById("sendNoteInput"),
    sendMoneyBtn: document.getElementById("sendMoneyBtn"),
    recentTransfersList: document.getElementById("recentTransfersList"),

    toast: document.getElementById("toast"),
    confettiLayer: document.getElementById("confettiLayer")
  };

  const state = loadLocalState();
  let selectedTrackOrderId = null;
  let balanceDisplay = state.bankBalance;
  let gameStarted = false;

  let auth = null;
  let db = null;
  let currentUid = null;
  let firebaseReady = false;
  let localAuthMode = false;

  let tick1sHandle = null;
  let tick30sHandle = null;
  let tick12sHandle = null;
  let saveTimer = null;
  let saveInFlight = false;
  let cloudDirty = false;

  let purchaseLock = false;
  let serverSession = { username: "", password: "" };
  let serverShopSlots = [];
  let serverShopLastUpdatedAt = null;
  let serverOrders = [];
  let activeBusinessTab = "businesses";
  let serverMirrorSaveTimer = null;
  let serverReachable = false;
  let lastBoostCleanupAt = 0;

  let firebaseApi = {
    onAuthStateChanged: null,
    createUserWithEmailAndPassword: null,
    signInWithEmailAndPassword: null,
    signOut: null,
    doc: null,
    collection: null,
    query: null,
    where: null,
    orderBy: null,
    limit: null,
    addDoc: null,
    deleteDoc: null,
    writeBatch: null,
    runTransaction: null,
    increment: null,
    onSnapshot: null,
    getDocs: null,
    documentId: null,
    getDoc: null,
    setDoc: null,
    updateDoc: null,
    serverTimestamp: null,
    Timestamp: null
  };

  const social = {
    searchResults: [],
    incomingRequests: [],
    outgoingRequests: [],
    friends: [],
    incomingTrades: [],
    outgoingTrades: [],
    tradeHistory: [],
    transfers: []
  };
  const socialProfiles = new Map();
  const socialUnsubs = [];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function uniqueId(prefix) {
    const n = crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(2)) : [Date.now(), Math.floor(Math.random() * 1e9)];
    return `${prefix}_${n[0].toString(36)}${n[1].toString(36)}`;
  }

  function trackingNumber() {
    let digits = "";
    for (let i = 0; i < 10; i += 1) digits += String(randInt(0, 9));
    return `MS${digits}`;
  }

  function fmtMoney(v) {
    return `$${Math.max(0, Math.floor(v)).toLocaleString()}`;
  }

  function fmtDur(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "00:00";
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function fmtTs(ts) {
    return ts ? new Date(ts).toLocaleString() : "--";
  }

  function stampMs(v) {
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (typeof v?.toMillis === "function") return v.toMillis();
    if (typeof v?.seconds === "number") return Math.floor(v.seconds * 1000);
    return Number(v) || 0;
  }

  function toast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => dom.toast.classList.add("hidden"), 2400);
  }

  function setSaveStatus(status, detail = "") {
    if (!dom.saveStatus) return;
    const suffix = detail ? ` (${detail})` : "";
    if (status === "saved") dom.saveStatus.textContent = `Save status: Saved${suffix}`;
    else if (status === "saving") dom.saveStatus.textContent = `Save status: Saving...${suffix}`;
    else if (status === "offline") dom.saveStatus.textContent = `Save status: Offline / pending${suffix}`;
    else dom.saveStatus.textContent = `Save status: Save failed${suffix}`;
  }

  function hasServerSession() {
    return Boolean(serverSession.username && serverSession.password);
  }

  function setServerSession(username, password) {
    serverSession = { username: String(username || ""), password: String(password || "") };
    if (serverSession.username) localStorage.setItem("server_shop_username", serverSession.username);
    if (serverSession.password) sessionStorage.setItem("server_shop_password", serverSession.password);
  }

  function clearServerSession() {
    serverSession = { username: "", password: "" };
    localStorage.removeItem("server_shop_username");
    sessionStorage.removeItem("server_shop_password");
  }

  async function postJson(url, payload) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const err = new Error(data?.error || `Request failed (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    return data;
  }

  function getDefaultState() {
    const now = Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      bankBalance: 500,
      bankLevel: 1,
      bankXP: 0,
      reputation: 0,
      txLog: [],

      activeJobs: [],
      jobCooldownUntil: null,
      parallelJobUpgradeLevel: 0,

      quickTaskActiveId: null,
      quickTaskAcceptedAt: null,
      quickTaskFinishAt: null,
      quickTasksUsedInWindow: 0,
      quickTaskWindowResetAt: now + QUICK_WINDOW_MS,

      mainStreak: 0,
      streakWindowUntil: null,
      lastMainJobClaimAt: null,

      activeOpportunity: null,
      nextOpportunityCheckAt: now + randInt(5 * 60 * 1000, 10 * 60 * 1000),

      inventory: {},
      orders: {},
      activeBoosts: {},

      skillPoints: 0,
      trainingsBought: 0,
      skills: { efficiency: 0, speed: 0, luck: 0, charisma: 0 },
      totalEarned: 0,
      upgrades: {},

      ownedBusinesses: {},
      casinoStats: { wins: 0, losses: 0 },

      lastDailyBonusAt: null,
      lastInterestAt: null,

      passiveCapWindowStart: now,
      passiveEarnedInWindow: 0,
      powerPurchaseWindow: []
    };
  }

  function deepMerge(defaultObj, loadedObj) {
    if (Array.isArray(defaultObj)) return Array.isArray(loadedObj) ? loadedObj : defaultObj;
    if (defaultObj && typeof defaultObj === "object") {
      const out = { ...defaultObj };
      if (loadedObj && typeof loadedObj === "object") {
        for (const key of Object.keys(loadedObj)) {
          out[key] = deepMerge(defaultObj[key], loadedObj[key]);
        }
      }
      return out;
    }
    return loadedObj === undefined ? defaultObj : loadedObj;
  }

  function migrateState(raw) {
    const defaults = getDefaultState();
    const merged = deepMerge(defaults, raw || {});
    if (!merged.schemaVersion || merged.schemaVersion < SCHEMA_VERSION) {
      merged.schemaVersion = SCHEMA_VERSION;
    }
    if (!merged.orders || typeof merged.orders !== "object") merged.orders = {};
    if (!merged.inventory || typeof merged.inventory !== "object") merged.inventory = {};
    if (!merged.activeBoosts || typeof merged.activeBoosts !== "object") merged.activeBoosts = {};
    if (!Array.isArray(merged.powerPurchaseWindow)) merged.powerPurchaseWindow = [];
    merged.powerPurchaseWindow = merged.powerPurchaseWindow
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x))
      .slice(-20);
    if (!merged.upgrades || typeof merged.upgrades !== "object") merged.upgrades = {};
    if (!Number.isFinite(merged.totalEarned)) merged.totalEarned = 0;
    if (!merged.ownedBusinesses || typeof merged.ownedBusinesses !== "object") merged.ownedBusinesses = {};
    for (const [bizId, val] of Object.entries(merged.ownedBusinesses)) {
      if (!val || typeof val !== "object") {
        merged.ownedBusinesses[bizId] = { level: 0, lastPaidAt: Date.now(), hasManager: false, needsRestart: false };
        continue;
      }
      if (!Number.isFinite(val.level)) val.level = 0;
      if (!Number.isFinite(val.lastPaidAt)) val.lastPaidAt = Date.now();
      if (typeof val.hasManager !== "boolean") val.hasManager = false;
      if (typeof val.needsRestart !== "boolean") val.needsRestart = false;
    }
    if (!Array.isArray(merged.activeJobs)) {
      merged.activeJobs = [];
      if (merged.activeJobId && merged.jobFinishAt) {
        merged.activeJobs.push({
          runId: uniqueId("job"),
          jobId: merged.activeJobId,
          name: merged.activeJobMeta?.name || merged.activeJobId,
          durationMin: merged.activeJobMeta?.durationMin || 1,
          basePay: merged.activeJobMeta?.basePay || 1,
          riskType: merged.activeJobMeta?.riskType || null,
          category: merged.activeJobMeta?.category || "general",
          acceptedAt: merged.jobAcceptedAt || Date.now(),
          finishAt: merged.jobFinishAt
        });
      }
    }
    if (typeof merged.parallelJobUpgradeLevel !== "number" || merged.parallelJobUpgradeLevel < 0) {
      merged.parallelJobUpgradeLevel = 0;
    }
    return merged;
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(getLocalStateStorageKey());
      if (!raw) return getDefaultState();
      return migrateState(JSON.parse(raw));
    } catch {
      return getDefaultState();
    }
  }

  function replaceState(next) {
    const fresh = migrateState(next);
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
  }

  function exportGameStateForSave() {
    return JSON.parse(JSON.stringify(state));
  }

  function saveLocalState() {
    localStorage.setItem(getLocalStateStorageKey(), JSON.stringify(state));
  }

  function getLocalStateStorageKey() {
    const localUser = localStorage.getItem(LOCAL_USER_KEY);
    if (!localUser) return STORAGE_KEY;
    return `${STORAGE_KEY}__${String(localUser).trim().toLowerCase()}`;
  }

  function loadLocalAccounts() {
    try {
      const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveLocalAccounts(accounts) {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  async function loginLocalUser(username, password) {
    const key = String(username || "").trim().toLowerCase();
    const accounts = loadLocalAccounts();
    const record = accounts[key];
    if (!record || record.password !== password) {
      throw new Error("Invalid username or password.");
    }
    clearServerSession();
    localStorage.setItem(LOCAL_USER_KEY, key);
    localAuthMode = true;
    await handleAuthState({ uid: `local_${key}`, email: `${key}@local.test` });
  }

  async function signupLocalUser(username, password) {
    const key = String(username || "").trim().toLowerCase();
    const accounts = loadLocalAccounts();
    if (accounts[key]) {
      throw new Error("Username already exists on this device.");
    }
    accounts[key] = {
      username: key,
      password: String(password || ""),
      createdAt: Date.now()
    };
    saveLocalAccounts(accounts);
    clearServerSession();
    localStorage.setItem(LOCAL_USER_KEY, key);
    localAuthMode = true;
    await handleAuthState({ uid: `local_${key}`, email: `${key}@local.test` });
  }

  function saveState() {
    saveLocalState();
    scheduleAutosave();
    scheduleServerMirrorSave();
  }

  async function loadUserGameState(uid) {
    if (!firebaseReady || !uid) return;
    const userRef = firebaseApi.doc(db, "users", uid);
    const snap = await firebaseApi.getDoc(userRef);
    if (!snap.exists()) {
      const initial = getDefaultState();
      replaceState(initial);
      await firebaseApi.setDoc(userRef, {
        email: auth.currentUser?.email || "",
        username: usernameFromUser(auth.currentUser),
        usernameLower: usernameFromUser(auth.currentUser),
        displayName: usernameFromUser(auth.currentUser),
        createdAt: firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp(),
        balance: Number(initial.bankBalance || 0),
        gameState: initial
      }, { merge: true });
      await firebaseApi.setDoc(inventoryDocRef(uid), { items: initial.inventory || {} }, { merge: true });
      await firebaseApi.setDoc(activeBoostsDocRef(uid), { boosts: {}, updatedAt: firebaseApi.serverTimestamp() }, { merge: true });
      setSaveStatus("saved");
      return;
    }
    const data = snap.data() || {};
    const loaded = migrateState(data.gameState || {});
    if (Number.isFinite(data.balance)) loaded.bankBalance = Number(data.balance);
    const invSnap = await firebaseApi.getDoc(inventoryDocRef(uid));
    if (invSnap.exists()) {
      loaded.inventory = invSnap.data()?.items && typeof invSnap.data().items === "object" ? invSnap.data().items : loaded.inventory;
    }
    const boostsSnap = await firebaseApi.getDoc(activeBoostsDocRef(uid));
    if (boostsSnap.exists()) {
      loaded.activeBoosts = normalizeBoostMap(boostsSnap.data()?.boosts || {});
    }
    replaceState(loaded);
    saveLocalState();
    setSaveStatus("saved");
  }

  async function saveUserGameState(uid, gameState) {
    if (!firebaseReady || !uid) return;
    const userRef = firebaseApi.doc(db, "users", uid);
    await firebaseApi.setDoc(userRef, {
      email: auth.currentUser?.email || "",
      username: usernameFromUser(auth.currentUser),
      usernameLower: usernameFromUser(auth.currentUser),
      displayName: usernameFromUser(auth.currentUser),
      updatedAt: firebaseApi.serverTimestamp(),
      lastActiveAt: firebaseApi.serverTimestamp(),
      balance: Number(gameState.bankBalance || 0),
      gameState
    }, { merge: true });
    await firebaseApi.setDoc(inventoryDocRef(uid), { items: gameState.inventory || {} }, { merge: true });
    const boostPayload = {};
    for (const [boostId, boost] of Object.entries(gameState.activeBoosts || {})) {
      const startedMs = stampMs(boost.startedAt) || Date.now();
      const endsMs = stampMs(boost.endsAt) || (startedMs + POWER_DURATION_MS);
      boostPayload[boostId] = {
        id: boost.id || boostId,
        itemId: boost.itemId || boostId,
        name: boost.name || POWER_ITEM_BY_ID[boost.itemId || boostId]?.name || boostId,
        type: boost.type || "custom",
        value: Number(boost.value || 0),
        stacks: Math.max(1, Math.floor(Number(boost.stacks || 1))),
        meta: boost.meta && typeof boost.meta === "object" ? boost.meta : {},
        remainingUses: boost.remainingUses !== undefined ? Math.max(0, Math.floor(Number(boost.remainingUses || 0))) : null,
        purchasedAt: firebaseApi.Timestamp.fromMillis(startedMs),
        expiresAt: firebaseApi.Timestamp.fromMillis(endsMs)
      };
    }
    await firebaseApi.setDoc(activeBoostsDocRef(uid), {
      boosts: boostPayload,
      updatedAt: firebaseApi.serverTimestamp()
    }, { merge: true });
  }

  async function flushCloudSave() {
    if (localAuthMode) {
      saveLocalState();
      setSaveStatus("saved", "local");
      return;
    }
    if (!firebaseReady || !currentUid || !cloudDirty || saveInFlight) return;
    saveInFlight = true;
    cloudDirty = false;
    setSaveStatus("saving");
    try {
      await saveUserGameState(currentUid, exportGameStateForSave());
      setSaveStatus("saved");
    } catch (err) {
      cloudDirty = true;
      setSaveStatus(navigator.onLine ? "error" : "offline", err?.code || "");
    } finally {
      saveInFlight = false;
      if (cloudDirty) scheduleAutosave();
    }
  }

  function scheduleAutosave() {
    if (localAuthMode) {
      saveLocalState();
      setSaveStatus("saved", "local");
      return;
    }
    if (!firebaseReady || !currentUid) {
      if (localAuthMode) setSaveStatus("saved", "local");
      return;
    }
    cloudDirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      flushCloudSave();
    }, 500);
  }

  async function flushServerMirrorSave() {
    if (!hasServerSession()) return;
    try {
      await postJson("/api/progress/save", {
        username: serverSession.username,
        password: serverSession.password,
        progress: exportGameStateForSave()
      });
      serverReachable = true;
    } catch {
      serverReachable = false;
    }
  }

  function scheduleServerMirrorSave() {
    if (!hasServerSession()) return;
    clearTimeout(serverMirrorSaveTimer);
    serverMirrorSaveTimer = setTimeout(() => {
      flushServerMirrorSave();
    }, 700);
  }


  function flushPendingSavesNow() {
    if (localAuthMode) {
      saveLocalState();
      return;
    }
    if (firebaseReady && currentUid && cloudDirty && !saveInFlight) {
      flushCloudSave();
    }
    if (hasServerSession()) {
      flushServerMirrorSave();
    }
  }

  function showAuthScreen() {
    dom.authScreen.classList.remove("hidden");
    dom.gameScreen.classList.add("hidden");
  }

  function showGameScreen() {
    dom.authScreen.classList.add("hidden");
    dom.gameScreen.classList.remove("hidden");
  }

  function usernameToEmail(usernameRaw) {
    const clean = String(usernameRaw || "").trim().toLowerCase();
    const safe = clean.replace(/[^a-z0-9._-]/g, "");
    return safe ? `${safe}@player.fakebank.local` : "";
  }

  function setAuthError(msg) {
    dom.authError.textContent = msg || "";
  }

  function formatAuthError(err) {
    const code = err?.code || "";
    if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Invalid username or password.";
    if (code.includes("user-not-found")) return "No account found for that username.";
    if (code.includes("email-already-in-use")) return "Username already exists.";
    if (code.includes("weak-password")) return "Password must be at least 6 characters.";
    if (code.includes("network-request-failed")) return "Network error. Try again.";
    if (code.includes("too-many-requests")) return "Too many attempts. Try later.";
    return `Something went wrong. Please try again.${code ? ` (${code})` : ""}`;
  }

  function bindAuthEvents() {
    dom.loginBtn.onclick = async () => {
      setAuthError("");
      const username = String(dom.usernameInput.value || "").trim();
      const email = usernameToEmail(username);
      const password = dom.passwordInput.value;
      if (!username || !password) {
        setAuthError("Enter username and password.");
        return;
      }

      if (!firebaseReady) {
        try {
          await loginLocalUser(username, password);
          setAuthError("");
        } catch (err) {
          setAuthError(err?.message || "Local login failed.");
        }
        return;
      }

      try {
        await firebaseApi.signInWithEmailAndPassword(auth, email, password);
        setServerSession(username, password);
      } catch (err) {
        setAuthError(formatAuthError(err));
      }
    };

    dom.signupBtn.onclick = async () => {
      setAuthError("");
      const username = String(dom.usernameInput.value || "").trim();
      const email = usernameToEmail(username);
      const password = dom.passwordInput.value;
      if (!username || !password) {
        setAuthError("Enter username and password.");
        return;
      }

      if (!firebaseReady) {
        try {
          await signupLocalUser(username, password);
          setAuthError("");
        } catch (err) {
          setAuthError(err?.message || "Local sign up failed.");
        }
        return;
      }

      try {
        await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
        setServerSession(username, password);
      } catch (err) {
        setAuthError(formatAuthError(err));
      }
    };

    dom.guestBtn.onclick = async () => {
      clearServerSession();
      localStorage.setItem(LOCAL_USER_KEY, "guest");
      localAuthMode = true;
      await handleAuthState({ uid: "local_guest", email: "guest@local.test" });
    };

    dom.logoutBtn.onclick = async () => {
      if (localAuthMode) {
        localStorage.removeItem(LOCAL_USER_KEY);
        clearServerSession();
        clearSocialListeners();
        resetSocialState();
        currentUid = null;
        showAuthScreen();
        dom.whoami.textContent = "";
        return;
      }
      if (!firebaseReady) return;
      await firebaseApi.signOut(auth);
      clearServerSession();
    };

    dom.passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") dom.loginBtn.click();
    });
  }

  async function initFirebaseServices() {
    const isLocalLikeContext =
      location.protocol === "file:" ||
      location.protocol === "about:" ||
      !/^https?:$/.test(location.protocol) ||
      location.origin === "null";

    if (isLocalLikeContext) {
      localAuthMode = false;
      dom.setupMessage.textContent = "Cloud login is disabled on file://. Local username/password login works for testing on this device, or use your deployed URL for cross-device saves.";
      return;
    }

    const hasRequired = (cfg) => Boolean(cfg) && REQUIRED_FIREBASE_KEYS.every((k) => Boolean(cfg[k]));

    if (!hasRequired(window.FIREBASE_CONFIG)) {
      try {
        const resp = await fetch("/api/firebase-config-data", { cache: "no-store" });
        if (resp.ok) {
          const payload = await resp.json();
          if (payload?.config) {
            window.FIREBASE_CONFIG = payload.config;
            window.FIREBASE_CONFIG_SOURCE = payload.source || "api/firebase-config-data";
            window.FIREBASE_CONFIG_ERROR = "";
          } else if (payload?.error) {
            window.FIREBASE_CONFIG_ERROR = payload.error;
          }
        }
      } catch {
        // ignored
      }
    }

    if (typeof window.FIREBASE_CONFIG === "string") {
      try {
        window.FIREBASE_CONFIG = JSON.parse(window.FIREBASE_CONFIG);
      } catch (err) {
        dom.setupMessage.textContent = err.message;
        return;
      }
    }

    if (!hasRequired(window.FIREBASE_CONFIG)) {
      dom.setupMessage.textContent = window.FIREBASE_CONFIG_ERROR || "Cloud sign up is not set up yet. Use Play As Guest.";
      return;
    }

    try {
      const firebaseModuleUrl = new URL("./firebase.js", window.location.href).href;
      const mod = await import(firebaseModuleUrl);
      const result = mod.initFirebase();
      if (!result.ok) {
        dom.setupMessage.textContent = result.message;
        return;
      }
      auth = result.auth;
      db = result.db;
      firebaseReady = true;
      firebaseApi = {
        onAuthStateChanged: mod.onAuthStateChanged,
        createUserWithEmailAndPassword: mod.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: mod.signInWithEmailAndPassword,
        signOut: mod.signOut,
        doc: mod.doc,
        collection: mod.collection,
        query: mod.query,
        where: mod.where,
        orderBy: mod.orderBy,
        limit: mod.limit,
        addDoc: mod.addDoc,
        deleteDoc: mod.deleteDoc,
        writeBatch: mod.writeBatch,
        runTransaction: mod.runTransaction,
        increment: mod.increment,
        onSnapshot: mod.onSnapshot,
        getDocs: mod.getDocs,
        documentId: mod.documentId,
        getDoc: mod.getDoc,
        setDoc: mod.setDoc,
        updateDoc: mod.updateDoc,
        serverTimestamp: mod.serverTimestamp,
        Timestamp: mod.Timestamp
      };
      dom.setupMessage.textContent = "";
    } catch (err) {
      dom.setupMessage.textContent = err?.message || "Firebase failed to initialize.";
    }
  }

  async function handleAuthState(user) {
    if (!user) {
      clearSocialListeners();
      resetSocialState();
      currentUid = null;
      showAuthScreen();
      dom.whoami.textContent = "";
      return;
    }
    currentUid = user.uid;
    try {
      if (!localAuthMode) await loadUserGameState(user.uid);
      else replaceState(loadLocalState());
      balanceDisplay = state.bankBalance;
    } catch (err) {
      console.error("State load failed during auth:", err);
    }

    try {
      const uname = user.email ? user.email.split("@")[0] : "Player";
      dom.whoami.textContent = `Signed in as ${uname}`;
      showGameScreen();
      if (!gameStarted) startGame();
      else render();
      setAuthError("");
    } catch (err) {
      console.error("Post-login startup failed:", err);
      setAuthError(err?.message || "Login succeeded but the app failed to load.");
      showAuthScreen();
      return;
    }

    if (!localAuthMode && firebaseReady) {
      try {
        await ensureUserProfileRecord(user);
      } catch (err) {
        console.error("Profile sync failed:", err);
        toast(`Profile sync failed: ${err?.message || "unknown error"}`);
      }
      try {
        startSocialListeners();
      } catch (err) {
        console.error("Social listeners failed:", err);
        toast(`Social features unavailable: ${err?.message || "unknown error"}`);
      }
    }

    if (hasServerSession()) {
      try {
        await flushServerMirrorSave();
      } catch (err) {
        console.error("Server mirror save failed after login:", err);
      }
      try {
        await refreshRotatingShop(true);
      } catch (err) {
        console.error("Rotating shop refresh failed after login:", err);
      }
      try {
        await refreshServerOrders();
      } catch (err) {
        console.error("Server orders refresh failed after login:", err);
      }
    }
  }

  function getCurrentUid() {
    return currentUid;
  }

  function resetSocialState() {
    social.searchResults = [];
    social.incomingRequests = [];
    social.outgoingRequests = [];
    social.friends = [];
    social.incomingTrades = [];
    social.outgoingTrades = [];
    social.tradeHistory = [];
    social.transfers = [];
    socialProfiles.clear();
  }

  function clearSocialListeners() {
    while (socialUnsubs.length) {
      const fn = socialUnsubs.pop();
      try { fn?.(); } catch {}
    }
  }

  function friendDocRef(uid, friendUid) {
    return firebaseApi.doc(db, "friends", uid, "list", friendUid);
  }

  function userDocRef(uid) {
    return firebaseApi.doc(db, "users", uid);
  }

  function inventoryDocRef(uid) {
    return firebaseApi.doc(db, "inventories", uid);
  }

  function activeBoostsDocRef(uid) {
    return firebaseApi.doc(db, "activeBoosts", uid);
  }

  function normalizeBoostMap(boostMap) {
    const out = {};
    for (const [id, raw] of Object.entries(boostMap || {})) {
      if (!raw || typeof raw !== "object") continue;
      const purchasedAtMs = stampMs(raw.purchasedAt);
      const expiresAtMs = stampMs(raw.expiresAt);
      out[id] = {
        id: raw.id || id,
        itemId: raw.itemId || raw.id || id,
        name: raw.name || POWER_ITEM_BY_ID[raw.itemId || id]?.name || id,
        type: raw.type || POWER_ITEM_BY_ID[raw.itemId || id]?.power?.effect || "custom",
        value: Number(raw.value || POWER_ITEM_BY_ID[raw.itemId || id]?.power?.value || 0),
        startedAt: purchasedAtMs || Date.now(),
        endsAt: expiresAtMs || (Date.now() + POWER_DURATION_MS),
        stacks: Math.max(1, Math.floor(Number(raw.stacks || 1))),
        remainingUses: raw.remainingUses !== undefined ? Math.max(0, Math.floor(Number(raw.remainingUses || 0))) : undefined,
        meta: raw.meta && typeof raw.meta === "object" ? raw.meta : {},
        _fromCloud: true
      };
    }
    return out;
  }

  function sanitizeUsername(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  }

  function usernameFromUser(user) {
    return sanitizeUsername(user?.email ? user.email.split("@")[0] : "player");
  }

  async function ensureUserProfileRecord(user) {
    if (!firebaseReady || !user?.uid) return;
    const uid = user.uid;
    const usernameLower = usernameFromUser(user);
    const userRef = userDocRef(uid);
    const usernameRef = firebaseApi.doc(db, "usernames", usernameLower);

    await firebaseApi.runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const existing = userSnap.exists() ? userSnap.data() : {};
      const oldUsername = sanitizeUsername(existing?.usernameLower || existing?.username || "");
      const usernameSnap = await tx.get(usernameRef);

      if (usernameSnap.exists() && String(usernameSnap.data()?.uid || "") !== uid) {
        throw new Error("Username is already taken.");
      }

      const nextUserDoc = {
        email: user.email || existing?.email || "",
        username: usernameLower,
        usernameLower,
        displayName: existing?.displayName || usernameLower,
        createdAt: existing?.createdAt || firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp(),
        lastActiveAt: firebaseApi.serverTimestamp(),
        balance: Number(existing?.balance ?? state.bankBalance ?? 0),
        blocked: existing?.blocked || {}
      };

      if (existing?.gameState && typeof existing.gameState === "object") {
        nextUserDoc.gameState = existing.gameState;
      }

      tx.set(userRef, nextUserDoc, { merge: true });

      tx.set(usernameRef, { uid, createdAt: firebaseApi.serverTimestamp() }, { merge: true });
      if (oldUsername && oldUsername !== usernameLower) {
        tx.delete(firebaseApi.doc(db, "usernames", oldUsername));
      }
    });
  }

  async function refreshProfilesForUids(uids) {
    if (!firebaseReady || !uids?.length) return;
    const missing = [...new Set(uids)].filter((uid) => uid && !socialProfiles.has(uid));
    if (!missing.length) return;
    for (let i = 0; i < missing.length; i += 10) {
      const chunk = missing.slice(i, i + 10);
      const q = firebaseApi.query(
        firebaseApi.collection(db, "users"),
        firebaseApi.where(firebaseApi.documentId(), "in", chunk)
      );
      const snap = await firebaseApi.getDocs(q);
      snap.forEach((docSnap) => socialProfiles.set(docSnap.id, docSnap.data() || {}));
    }
  }

  async function isFriends(uidA, uidB) {
    if (!uidA || !uidB) return false;
    const [a, b] = await Promise.all([
      firebaseApi.getDoc(friendDocRef(uidA, uidB)),
      firebaseApi.getDoc(friendDocRef(uidB, uidA))
    ]);
    return a.exists() && b.exists();
  }

  async function createFriendRequest(toUid) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!toUid) throw new Error("Choose a user.");
    if (uid === toUid) throw new Error("You cannot add yourself.");
    const reqId = `${uid}_${toUid}`;
    const reverseReqId = `${toUid}_${uid}`;
    const reqRef = firebaseApi.doc(db, "friendRequests", reqId);
    const reverseRef = firebaseApi.doc(db, "friendRequests", reverseReqId);

    await firebaseApi.runTransaction(db, async (tx) => {
      const [friendA, friendB, reqSnap, reverseSnap] = await Promise.all([
        tx.get(friendDocRef(uid, toUid)),
        tx.get(friendDocRef(toUid, uid)),
        tx.get(reqRef),
        tx.get(reverseRef)
      ]);
      if (friendA.exists() && friendB.exists()) throw new Error("Already friends.");
      if (reqSnap.exists() && reqSnap.data()?.status === "pending") throw new Error("Request already sent.");
      if (reverseSnap.exists() && reverseSnap.data()?.status === "pending") {
        throw new Error("They already requested you. Accept from Incoming Requests.");
      }
      tx.set(reqRef, {
        fromUid: uid,
        toUid,
        status: "pending",
        createdAt: firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp()
      }, { merge: true });
    });
  }

  async function acceptFriendRequest(fromUid) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!fromUid) throw new Error("Invalid request.");
    const reqRef = firebaseApi.doc(db, "friendRequests", `${fromUid}_${uid}`);
    await firebaseApi.runTransaction(db, async (tx) => {
      const snap = await tx.get(reqRef);
      if (!snap.exists()) throw new Error("Request not found.");
      const req = snap.data() || {};
      if (req.status !== "pending") throw new Error("Request is not pending.");
      if (req.toUid !== uid) throw new Error("Not allowed.");
      tx.set(friendDocRef(uid, fromUid), { uid: fromUid, since: firebaseApi.serverTimestamp() }, { merge: true });
      tx.set(friendDocRef(fromUid, uid), { uid, since: firebaseApi.serverTimestamp() }, { merge: true });
      tx.update(reqRef, { status: "accepted", updatedAt: firebaseApi.serverTimestamp() });
    });
  }

  async function declineFriendRequest(fromUid) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!fromUid) throw new Error("Invalid request.");
    const reqRef = firebaseApi.doc(db, "friendRequests", `${fromUid}_${uid}`);
    await firebaseApi.updateDoc(reqRef, { status: "declined", updatedAt: firebaseApi.serverTimestamp() });
  }

  async function cancelFriendRequest(toUid) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!toUid) throw new Error("Invalid request.");
    const reqRef = firebaseApi.doc(db, "friendRequests", `${uid}_${toUid}`);
    await firebaseApi.updateDoc(reqRef, { status: "canceled", updatedAt: firebaseApi.serverTimestamp() });
  }

  async function removeFriend(friendUid) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!friendUid) throw new Error("Invalid friend.");
    const batch = firebaseApi.writeBatch(db);
    batch.delete(friendDocRef(uid, friendUid));
    batch.delete(friendDocRef(friendUid, uid));
    await batch.commit();
  }

  function parseItemMap(raw) {
    const out = {};
    const text = String(raw || "").trim();
    if (!text) return out;
    text.split(",").map((x) => x.trim()).filter(Boolean).forEach((part) => {
      const [itemIdRaw, qtyRaw] = part.split(":").map((x) => (x || "").trim());
      const itemId = itemIdRaw;
      const qty = Math.max(0, Math.floor(Number(qtyRaw || "0")));
      if (itemId && qty > 0) out[itemId] = (out[itemId] || 0) + qty;
    });
    return out;
  }

  function adjustItemMap(items, deltaMap, sign = 1) {
    const next = { ...(items || {}) };
    Object.entries(deltaMap || {}).forEach(([itemId, qty]) => {
      next[itemId] = Math.max(0, Math.floor(Number(next[itemId] || 0) + sign * Number(qty || 0)));
      if (next[itemId] <= 0) delete next[itemId];
    });
    return next;
  }

  function hasEnoughItems(items, required) {
    return Object.entries(required || {}).every(([id, qty]) => Number(items?.[id] || 0) >= Number(qty || 0));
  }

  async function sendMoney(friendUid, amount, note = "") {
    const uid = getCurrentUid();
    const money = Math.floor(Number(amount));
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!friendUid) throw new Error("Pick a friend.");
    if (!Number.isFinite(money) || money <= 0) throw new Error("Enter a valid amount.");
    if (money > 50000) throw new Error("Max transfer is 50,000.");

    await firebaseApi.runTransaction(db, async (tx) => {
      const [fwd, rev, fromSnap, toSnap] = await Promise.all([
        tx.get(friendDocRef(uid, friendUid)),
        tx.get(friendDocRef(friendUid, uid)),
        tx.get(userDocRef(uid)),
        tx.get(userDocRef(friendUid))
      ]);
      if (!fwd.exists() || !rev.exists()) throw new Error("You can only send money to friends.");
      const fromBalance = Number(fromSnap.data()?.balance ?? state.bankBalance ?? 0);
      const toBalance = Number(toSnap.data()?.balance ?? 0);
      if (fromBalance < money) throw new Error("Insufficient balance.");

      const transferRef = firebaseApi.doc(firebaseApi.collection(db, "transfers"));
      tx.set(transferRef, {
        fromUid: uid,
        toUid: friendUid,
        amount: money,
        note: String(note || "").slice(0, 120),
        participants: [uid, friendUid],
        createdAt: firebaseApi.serverTimestamp()
      });
      tx.set(userDocRef(uid), {
        balance: fromBalance - money,
        gameState: { ...state, bankBalance: fromBalance - money },
        lastActiveAt: firebaseApi.serverTimestamp()
      }, { merge: true });
      tx.set(userDocRef(friendUid), {
        balance: toBalance + money,
        lastActiveAt: firebaseApi.serverTimestamp()
      }, { merge: true });
    });
    state.bankBalance = Math.max(0, state.bankBalance - money);
    addTx("send_money", -money, { toUid: friendUid, note: String(note || "").slice(0, 120) });
    saveState();
  }

  async function createTrade(toUid, offer, request) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!toUid || toUid === uid) throw new Error("Pick a valid friend.");
    const offerMoney = Math.max(0, Math.floor(Number(offer?.money || 0)));
    const requestMoney = Math.max(0, Math.floor(Number(request?.money || 0)));
    const offerItems = offer?.items || {};
    const requestItems = request?.items || {};
    const offerHasItems = Object.keys(offerItems).length > 0;
    const requestHasItems = Object.keys(requestItems).length > 0;
    if (offerMoney <= 0 && requestMoney <= 0 && !offerHasItems && !requestHasItems) {
      throw new Error("Trade cannot be empty.");
    }

    await firebaseApi.runTransaction(db, async (tx) => {
      const [fwd, rev, fromUser, fromInv] = await Promise.all([
        tx.get(friendDocRef(uid, toUid)),
        tx.get(friendDocRef(toUid, uid)),
        tx.get(userDocRef(uid)),
        tx.get(inventoryDocRef(uid))
      ]);
      if (!fwd.exists() || !rev.exists()) throw new Error("Trades are only allowed with friends.");
      const fromBalance = Number(fromUser.data()?.balance ?? state.bankBalance ?? 0);
      const fromItems = (fromInv.data()?.items || state.inventory || {});
      if (fromBalance < offerMoney) throw new Error("Not enough offered money.");
      if (!hasEnoughItems(fromItems, offerItems)) throw new Error("Not enough offered items.");

      const tradeRef = firebaseApi.doc(firebaseApi.collection(db, "trades"));
      tx.set(tradeRef, {
        fromUid: uid,
        toUid,
        status: "pending",
        offer: { money: offerMoney, items: offerItems },
        request: { money: requestMoney, items: requestItems },
        participants: [uid, toUid],
        createdAt: firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp()
      });
    });
  }

  async function acceptTrade(tradeId) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!tradeId) throw new Error("Invalid trade.");
    const tradeRef = firebaseApi.doc(db, "trades", tradeId);
    await firebaseApi.runTransaction(db, async (tx) => {
      const tradeSnap = await tx.get(tradeRef);
      if (!tradeSnap.exists()) throw new Error("Trade not found.");
      const trade = tradeSnap.data() || {};
      if (trade.status !== "pending") throw new Error("Trade is not pending.");
      if (trade.toUid !== uid) throw new Error("Only recipient can accept.");

      const fromUid = trade.fromUid;
      const toUid = trade.toUid;
      const [fwd, rev, fromUser, toUser, fromInv, toInv] = await Promise.all([
        tx.get(friendDocRef(fromUid, toUid)),
        tx.get(friendDocRef(toUid, fromUid)),
        tx.get(userDocRef(fromUid)),
        tx.get(userDocRef(toUid)),
        tx.get(inventoryDocRef(fromUid)),
        tx.get(inventoryDocRef(toUid))
      ]);
      if (!fwd.exists() || !rev.exists()) throw new Error("Users are no longer friends.");

      const offer = trade.offer || { money: 0, items: {} };
      const request = trade.request || { money: 0, items: {} };
      const fromBalance = Number(fromUser.data()?.balance ?? 0);
      const toBalance = Number(toUser.data()?.balance ?? 0);
      if (fromBalance < Number(offer.money || 0)) throw new Error("Sender no longer has offered money.");
      if (toBalance < Number(request.money || 0)) throw new Error("You no longer have requested money.");

      const fromItems = fromInv.data()?.items || {};
      const toItems = toInv.data()?.items || {};
      if (!hasEnoughItems(fromItems, offer.items || {})) throw new Error("Sender no longer has offered items.");
      if (!hasEnoughItems(toItems, request.items || {})) throw new Error("You no longer have requested items.");

      const nextFromItems = adjustItemMap(adjustItemMap(fromItems, offer.items, -1), request.items, +1);
      const nextToItems = adjustItemMap(adjustItemMap(toItems, request.items, -1), offer.items, +1);
      const nextFromBal = fromBalance - Number(offer.money || 0) + Number(request.money || 0);
      const nextToBal = toBalance - Number(request.money || 0) + Number(offer.money || 0);

      tx.set(userDocRef(fromUid), { balance: nextFromBal, lastActiveAt: firebaseApi.serverTimestamp() }, { merge: true });
      tx.set(userDocRef(toUid), { balance: nextToBal, lastActiveAt: firebaseApi.serverTimestamp() }, { merge: true });
      tx.set(inventoryDocRef(fromUid), { items: nextFromItems }, { merge: true });
      tx.set(inventoryDocRef(toUid), { items: nextToItems }, { merge: true });
      tx.update(tradeRef, { status: "accepted", updatedAt: firebaseApi.serverTimestamp() });

      if (toUid === uid) {
        tx.set(userDocRef(uid), {
          gameState: { ...state, bankBalance: nextToBal, inventory: nextToItems }
        }, { merge: true });
      }
    });
  }

  async function declineOrCancelTrade(tradeId, nextStatus) {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    if (!tradeId) throw new Error("Invalid trade.");
    const tradeRef = firebaseApi.doc(db, "trades", tradeId);
    const snap = await firebaseApi.getDoc(tradeRef);
    if (!snap.exists()) throw new Error("Trade not found.");
    const trade = snap.data() || {};
    if (trade.status !== "pending") throw new Error("Trade is already closed.");
    if (nextStatus === "declined" && trade.toUid !== uid) throw new Error("Only recipient can decline.");
    if (nextStatus === "canceled" && trade.fromUid !== uid) throw new Error("Only sender can cancel.");
    await firebaseApi.updateDoc(tradeRef, { status: nextStatus, updatedAt: firebaseApi.serverTimestamp() });
  }

  async function runFriendSearch() {
    const uid = getCurrentUid();
    if (!firebaseReady || !uid) throw new Error("Cloud features require login on deployed site.");
    const term = sanitizeUsername(dom.friendSearchInput?.value || "");
    if (!term) {
      social.searchResults = [];
      renderSocialSections();
      return;
    }
    const results = [];
    const usernameSnap = await firebaseApi.getDoc(firebaseApi.doc(db, "usernames", term));
    if (usernameSnap.exists()) {
      const foundUid = String(usernameSnap.data()?.uid || "");
      if (foundUid && foundUid !== uid) results.push(foundUid);
    }
    const prefixQ = firebaseApi.query(
      firebaseApi.collection(db, "users"),
      firebaseApi.where("usernameLower", ">=", term),
      firebaseApi.where("usernameLower", "<=", `${term}\uf8ff`),
      firebaseApi.limit(8)
    );
    const displayQ = firebaseApi.query(
      firebaseApi.collection(db, "users"),
      firebaseApi.where("displayName", ">=", term),
      firebaseApi.where("displayName", "<=", `${term}\uf8ff`),
      firebaseApi.limit(5)
    );
    const [snap, displaySnap] = await Promise.all([firebaseApi.getDocs(prefixQ), firebaseApi.getDocs(displayQ)]);
    snap.forEach((d) => {
      if (d.id !== uid && !results.includes(d.id)) results.push(d.id);
      socialProfiles.set(d.id, d.data() || {});
    });
    displaySnap.forEach((d) => {
      if (d.id !== uid && !results.includes(d.id)) results.push(d.id);
      socialProfiles.set(d.id, d.data() || {});
    });
    await refreshProfilesForUids(results);
    social.searchResults = results;
    renderSocialSections();
  }

  function startSocialListeners() {
    clearSocialListeners();
    resetSocialState();
    if (!firebaseReady || !currentUid) return;
    const uid = currentUid;
    const coll = firebaseApi.collection;
    const q = firebaseApi.query;
    const where = firebaseApi.where;
    const limit = firebaseApi.limit;
    const onSnapshot = firebaseApi.onSnapshot;

    socialUnsubs.push(onSnapshot(
      q(coll(db, "friends", uid, "list"), limit(200)),
      async (snap) => {
        social.friends = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        await refreshProfilesForUids(social.friends.map((f) => f.uid || f.id));
        renderSocialSections();
      }
    ));

    socialUnsubs.push(onSnapshot(
      q(coll(db, "friendRequests"), where("toUid", "==", uid), where("status", "==", "pending"), limit(50)),
      async (snap) => {
        social.incomingRequests = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        await refreshProfilesForUids(social.incomingRequests.map((r) => r.fromUid));
        renderSocialSections();
      }
    ));

    socialUnsubs.push(onSnapshot(
      q(coll(db, "friendRequests"), where("fromUid", "==", uid), where("status", "==", "pending"), limit(50)),
      async (snap) => {
        social.outgoingRequests = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        await refreshProfilesForUids(social.outgoingRequests.map((r) => r.toUid));
        renderSocialSections();
      }
    ));

    socialUnsubs.push(onSnapshot(
      q(coll(db, "trades"), where("participants", "array-contains", uid), limit(80)),
      async (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        social.incomingTrades = all.filter((t) => t.toUid === uid && t.status === "pending");
        social.outgoingTrades = all.filter((t) => t.fromUid === uid && t.status === "pending");
        social.tradeHistory = all.filter((t) => t.status !== "pending").slice(0, 50);
        await refreshProfilesForUids(all.flatMap((t) => [t.fromUid, t.toUid]));
        renderSocialSections();
      }
    ));

    socialUnsubs.push(onSnapshot(
      q(coll(db, "transfers"), where("participants", "array-contains", uid), limit(25)),
      async (snap) => {
        social.transfers = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        await refreshProfilesForUids(social.transfers.flatMap((t) => [t.fromUid, t.toUid]));
        renderSocialSections();
      }
    ));

    socialUnsubs.push(onSnapshot(
      activeBoostsDocRef(uid),
      (snap) => {
        if (!snap.exists()) return;
        state.activeBoosts = normalizeBoostMap(snap.data()?.boosts || {});
        saveLocalState();
        render();
      }
    ));
  }

  function profileLabel(uid) {
    const p = socialProfiles.get(uid) || {};
    return p.displayName || p.username || uid?.slice(0, 8) || "Unknown";
  }

  function toItemsText(items) {
    const entries = Object.entries(items || {});
    if (!entries.length) return "none";
    return entries.map(([id, qty]) => `${id} x${qty}`).join(", ");
  }

  function renderFriendSelects() {
    const selectTargets = [dom.tradeFriendSelect, dom.sendFriendSelect];
    selectTargets.forEach((select) => {
      if (!select) return;
      const prev = select.value;
      select.innerHTML = "";
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "-- Select Friend --";
      select.appendChild(empty);
      social.friends.forEach((f) => {
        const friendUid = f.uid || f.id;
        const option = document.createElement("option");
        option.value = friendUid;
        option.textContent = `${profileLabel(friendUid)} (@${(socialProfiles.get(friendUid)?.username || friendUid.slice(0, 8))})`;
        select.appendChild(option);
      });
      if ([...select.options].some((o) => o.value === prev)) select.value = prev;
    });
  }

  function renderSocialSections() {
    if (!dom.friendsTab) return;
    renderFriendSelects();

    dom.friendSearchResults.innerHTML = "";
    if (!social.searchResults.length) dom.friendSearchResults.innerHTML = "<p class='hint'>No search results.</p>";
    social.searchResults.forEach((uid) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const isFriend = social.friends.some((f) => (f.uid || f.id) === uid);
      const outgoing = social.outgoingRequests.some((r) => r.toUid === uid);
      const incoming = social.incomingRequests.some((r) => r.fromUid === uid);
      const p = socialProfiles.get(uid) || {};
      row.innerHTML = `<div class="row-head"><strong>${p.displayName || p.username || uid}</strong><span>@${p.username || uid.slice(0, 8)}</span></div>`;
      const btns = document.createElement("div");
      btns.className = "top-actions";
      if (isFriend) {
        const remove = document.createElement("button");
        remove.className = "btn secondary";
        remove.textContent = "Remove Friend";
        remove.onclick = async () => { try { await removeFriend(uid); toast("Friend removed."); } catch (e) { toast(e.message); } };
        btns.appendChild(remove);
      } else if (incoming) {
        const accept = document.createElement("button");
        accept.className = "btn";
        accept.textContent = "Accept";
        accept.onclick = async () => { try { await acceptFriendRequest(uid); toast("Friend request accepted."); } catch (e) { toast(e.message); } };
        const decline = document.createElement("button");
        decline.className = "btn secondary";
        decline.textContent = "Decline";
        decline.onclick = async () => { try { await declineFriendRequest(uid); toast("Friend request declined."); } catch (e) { toast(e.message); } };
        btns.appendChild(accept); btns.appendChild(decline);
      } else if (outgoing) {
        const cancel = document.createElement("button");
        cancel.className = "btn secondary";
        cancel.textContent = "Cancel Request";
        cancel.onclick = async () => { try { await cancelFriendRequest(uid); toast("Request canceled."); } catch (e) { toast(e.message); } };
        btns.appendChild(cancel);
      } else {
        const add = document.createElement("button");
        add.className = "btn";
        add.textContent = "Add Friend";
        add.onclick = async () => { try { await createFriendRequest(uid); toast("Friend request sent."); } catch (e) { toast(e.message); } };
        btns.appendChild(add);
      }
      row.appendChild(btns);
      dom.friendSearchResults.appendChild(row);
    });

    dom.friendsList.innerHTML = "";
    if (!social.friends.length) dom.friendsList.innerHTML = "<p class='hint'>No friends yet.</p>";
    social.friends.forEach((f) => {
      const uid = f.uid || f.id;
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>${profileLabel(uid)}</strong><span>@${socialProfiles.get(uid)?.username || uid.slice(0, 8)}</span></div>`;
      const actions = document.createElement("div");
      actions.className = "top-actions";
      const sendBtn = document.createElement("button");
      sendBtn.className = "btn secondary";
      sendBtn.textContent = "Send";
      sendBtn.onclick = () => { setActiveTab("send"); dom.sendFriendSelect.value = uid; };
      const tradeBtn = document.createElement("button");
      tradeBtn.className = "btn secondary";
      tradeBtn.textContent = "Trade";
      tradeBtn.onclick = () => { setActiveTab("trade"); dom.tradeFriendSelect.value = uid; };
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn tertiary";
      removeBtn.textContent = "Remove";
      removeBtn.onclick = async () => { try { await removeFriend(uid); toast("Friend removed."); } catch (e) { toast(e.message); } };
      actions.appendChild(sendBtn); actions.appendChild(tradeBtn); actions.appendChild(removeBtn);
      row.appendChild(actions);
      dom.friendsList.appendChild(row);
    });

    dom.incomingRequestsList.innerHTML = "";
    if (!social.incomingRequests.length) dom.incomingRequestsList.innerHTML = "<p class='hint'>No incoming requests.</p>";
    [...social.incomingRequests].sort((a, b) => stampMs(b.createdAt) - stampMs(a.createdAt)).forEach((r) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>${profileLabel(r.fromUid)}</strong><span>${fmtTs(stampMs(r.createdAt))}</span></div>`;
      const actions = document.createElement("div");
      actions.className = "top-actions";
      const accept = document.createElement("button");
      accept.className = "btn";
      accept.textContent = "Accept";
      accept.onclick = async () => { try { await acceptFriendRequest(r.fromUid); toast("Accepted."); } catch (e) { toast(e.message); } };
      const decline = document.createElement("button");
      decline.className = "btn secondary";
      decline.textContent = "Decline";
      decline.onclick = async () => { try { await declineFriendRequest(r.fromUid); toast("Declined."); } catch (e) { toast(e.message); } };
      actions.appendChild(accept); actions.appendChild(decline);
      row.appendChild(actions);
      dom.incomingRequestsList.appendChild(row);
    });

    dom.outgoingRequestsList.innerHTML = "";
    if (!social.outgoingRequests.length) dom.outgoingRequestsList.innerHTML = "<p class='hint'>No outgoing requests.</p>";
    [...social.outgoingRequests].sort((a, b) => stampMs(b.createdAt) - stampMs(a.createdAt)).forEach((r) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>${profileLabel(r.toUid)}</strong><span>${fmtTs(stampMs(r.createdAt))}</span></div>`;
      const cancel = document.createElement("button");
      cancel.className = "btn secondary";
      cancel.textContent = "Cancel";
      cancel.onclick = async () => { try { await cancelFriendRequest(r.toUid); toast("Canceled."); } catch (e) { toast(e.message); } };
      row.appendChild(cancel);
      dom.outgoingRequestsList.appendChild(row);
    });

    dom.incomingTradesList.innerHTML = "";
    if (!social.incomingTrades.length) dom.incomingTradesList.innerHTML = "<p class='hint'>No incoming trades.</p>";
    social.incomingTrades.forEach((t) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>From ${profileLabel(t.fromUid)}</strong><span>${statusBadge(t.status)}</span></div>
      <div class="row-meta">Offer: $${Math.floor(t.offer?.money || 0)} + ${toItemsText(t.offer?.items)}</div>
      <div class="row-meta">Request: $${Math.floor(t.request?.money || 0)} + ${toItemsText(t.request?.items)}</div>`;
      const actions = document.createElement("div");
      actions.className = "top-actions";
      const accept = document.createElement("button");
      accept.className = "btn";
      accept.textContent = "Accept";
      accept.onclick = async () => { try { await acceptTrade(t.id); toast("Trade accepted."); await loadUserGameState(currentUid); render(); } catch (e) { toast(e.message); } };
      const decline = document.createElement("button");
      decline.className = "btn secondary";
      decline.textContent = "Decline";
      decline.onclick = async () => { try { await declineOrCancelTrade(t.id, "declined"); toast("Trade declined."); } catch (e) { toast(e.message); } };
      actions.appendChild(accept); actions.appendChild(decline);
      row.appendChild(actions);
      dom.incomingTradesList.appendChild(row);
    });

    dom.outgoingTradesList.innerHTML = "";
    if (!social.outgoingTrades.length) dom.outgoingTradesList.innerHTML = "<p class='hint'>No outgoing trades.</p>";
    social.outgoingTrades.forEach((t) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>To ${profileLabel(t.toUid)}</strong><span>${statusBadge(t.status)}</span></div>
      <div class="row-meta">Offer: $${Math.floor(t.offer?.money || 0)} + ${toItemsText(t.offer?.items)}</div>
      <div class="row-meta">Request: $${Math.floor(t.request?.money || 0)} + ${toItemsText(t.request?.items)}</div>`;
      const cancel = document.createElement("button");
      cancel.className = "btn secondary";
      cancel.textContent = "Cancel";
      cancel.onclick = async () => { try { await declineOrCancelTrade(t.id, "canceled"); toast("Trade canceled."); } catch (e) { toast(e.message); } };
      row.appendChild(cancel);
      dom.outgoingTradesList.appendChild(row);
    });

    dom.tradeHistoryList.innerHTML = "";
    if (!social.tradeHistory.length) dom.tradeHistoryList.innerHTML = "<p class='hint'>No trade history.</p>";
    [...social.tradeHistory].sort((a, b) => stampMs(b.updatedAt || b.createdAt) - stampMs(a.updatedAt || a.createdAt)).forEach((t) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const ts = stampMs(t.updatedAt || t.createdAt);
      row.innerHTML = `<div class="row-head"><strong>${profileLabel(t.fromUid)} ↔ ${profileLabel(t.toUid)}</strong><span>${statusBadge(t.status)}</span></div><div class="row-meta">${fmtTs(ts)}</div>`;
      dom.tradeHistoryList.appendChild(row);
    });

    dom.recentTransfersList.innerHTML = "";
    if (!social.transfers.length) dom.recentTransfersList.innerHTML = "<p class='hint'>No recent transfers.</p>";
    [...social.transfers].sort((a, b) => stampMs(b.createdAt) - stampMs(a.createdAt)).forEach((t) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const mineOut = t.fromUid === currentUid;
      const otherUid = mineOut ? t.toUid : t.fromUid;
      const ts = stampMs(t.createdAt);
      row.innerHTML = `<div class="row-head"><strong>${mineOut ? "Sent" : "Received"} ${fmtMoney(t.amount || 0)}</strong><span>${fmtTs(ts)}</span></div>
      <div class="row-meta">${mineOut ? "to" : "from"} ${profileLabel(otherUid)}${t.note ? ` | ${t.note}` : ""}</div>`;
      dom.recentTransfersList.appendChild(row);
    });
  }

  function addTx(type, amount, meta = {}) {
    if (Number(amount) > 0) {
      state.totalEarned = Math.max(0, Number(state.totalEarned || 0) + Number(amount));
    }
    state.txLog.unshift({ ts: Date.now(), type, amount, meta });
    state.txLog = state.txLog.slice(0, 25);
  }

  function gainXP(amount) {
    state.bankXP += amount;
    let threshold = state.bankLevel * XP_PER_LEVEL_BASE;
    while (state.bankXP >= threshold) {
      state.bankXP -= threshold;
      state.bankLevel += 1;
      threshold = state.bankLevel * XP_PER_LEVEL_BASE;
    }
  }

  function removeExpiredBoosts(now = Date.now()) {
    for (const [boostId, boost] of Object.entries(state.activeBoosts)) {
      const doneByTime = stampMs(boost.endsAt) && now >= stampMs(boost.endsAt);
      const doneByUses = boost.type === "payoutBonusNextN" && (boost.remainingUses || 0) <= 0;
      if (doneByTime || doneByUses) {
        delete state.activeBoosts[boostId];
      }
    }
  }

  function getActiveBoostEffects(now = Date.now()) {
    removeExpiredBoosts(now);

    const effects = {
      payoutMultiplier: 1,
      extraRewardRolls: 0,
      duplicatePayoutFactor: 0,
      rarityChanceMultiplier: 1,
      cooldownMultiplier: 1,
      shopDiscountFactor: 1,
      lossImmunity: false,
      instantDeliveryCharges: 0,
      inventoryCapacityBonus: 0,
      passiveIncomeMultiplier: 1,
      payoutBonusNextN: 0,
      luckBonus: 0
    };

    for (const boost of Object.values(state.activeBoosts)) {
      const expiresMs = stampMs(boost.endsAt);
      if (expiresMs && now >= expiresMs) continue;
      const stacks = Math.max(1, Math.floor(Number(boost.stacks || 1)));
      const powerId = String(boost.itemId || boost.id || "");

      if (powerId === "quantum_payday") effects.passiveIncomeMultiplier = Math.max(effects.passiveIncomeMultiplier, 1 + 2.5);
      if (powerId === "double_dip_rewards") effects.duplicatePayoutFactor = Math.max(effects.duplicatePayoutFactor, 0.8);
      if (powerId === "lucky_magnet") {
        const magnetBonus = stacks >= 2 ? 2.25 + 0.35 : 2.25;
        effects.rarityChanceMultiplier = Math.max(effects.rarityChanceMultiplier, magnetBonus);
      }
      if (powerId === "overclock_mode") effects.cooldownMultiplier = Math.min(effects.cooldownMultiplier, 0.60);
      if (powerId === "black_friday_pass") effects.shopDiscountFactor = Math.min(effects.shopDiscountFactor, 0.65);
      if (powerId === "vault_insurance") effects.lossImmunity = true;
      if (powerId === "instant_delivery_token") effects.instantDeliveryCharges += Math.max(0, Math.floor(Number(boost?.meta?.charges || 0)));
      if (powerId === "mega_inventory_expand") effects.inventoryCapacityBonus = Math.max(effects.inventoryCapacityBonus, 200);

      if (boost.type === "moneyMultiplier") effects.payoutMultiplier *= (1 + Number(boost.value || 0));
      if (boost.type === "payoutBonusNextN" && (boost.remainingUses || 0) > 0) effects.payoutBonusNextN += Number(boost.value || 0);
      if (boost.type === "cooldownReduction") effects.cooldownMultiplier *= Math.max(0.60, 1 - Number(boost.value || 0));
      if (boost.type === "luckBonus") effects.luckBonus += Number(boost.value || 0);
      if (boost.type === "duplicatePayoutFactor") effects.duplicatePayoutFactor = Math.max(effects.duplicatePayoutFactor, Number(boost.value || 0));
    }

    effects.shopDiscountFactor = Math.max(0.75, effects.shopDiscountFactor);
    effects.payoutMultiplier = Math.min(2.5, effects.payoutMultiplier);
    return effects;
  }

  function consumePayoutBonusUses() {
    for (const [boostId, boost] of Object.entries(state.activeBoosts)) {
      if (boost.type !== "payoutBonusNextN") continue;
      if ((boost.remainingUses || 0) <= 0) continue;
      boost.remainingUses -= 1;
      if (boost.remainingUses <= 0) delete state.activeBoosts[boostId];
    }
  }

  function getModifiers(now = Date.now()) {
    const skills = state.skills || {};
    const efficiency = Math.min(skills.efficiency || 0, 10);
    const speed = Math.min(skills.speed || 0, 10);
    const luck = Math.min(skills.luck || 0, 10);
    const charisma = Math.max(0, skills.charisma || 0);

    const effects = getActiveBoostEffects(now);

    let payoutMult = (1 + efficiency * 0.02) * effects.payoutMultiplier;
    let durationMult = 1 - speed * 0.02;
    let xpMult = 1;
    let interestMult = 1;
    let riskyLuckBonus = (Math.min(0.15, luck * 0.015) + effects.luckBonus) * Math.max(1, effects.rarityChanceMultiplier / 1.4);

    durationMult *= effects.cooldownMultiplier;

    payoutMult = Math.min(2.5, payoutMult);
    durationMult = Math.max(0.60, durationMult);
    riskyLuckBonus = Math.min(0.35, riskyLuckBonus);

    return {
      payoutMult,
      durationMult,
      xpMult,
      interestMult,
      riskyLuckBonus,
      repGainBonus: Math.floor(charisma / 3),
      payoutBonusNextN: effects.payoutBonusNextN,
      cooldownReduction: Math.min(0.40, 1 - effects.cooldownMultiplier),
      duplicatePayoutFactor: effects.duplicatePayoutFactor,
      shopDiscountFactor: effects.shopDiscountFactor,
      lossImmunity: effects.lossImmunity,
      instantDeliveryCharges: effects.instantDeliveryCharges,
      inventoryCapacityBonus: effects.inventoryCapacityBonus,
      passiveIncomeMultiplier: effects.passiveIncomeMultiplier
    };
  }

  function streakBonusPct() {
    const s = state.mainStreak || 0;
    if (s >= 10) return 0.15;
    if (s >= 5) return 0.08;
    if (s >= 2) return 0.03;
    return 0;
  }

  function calcMainBaseReward(job) {
    const timeMultiplier = Math.min(1 + job.durationMin / 20, 6);
    const levelMultiplier = Math.min(1 + (state.bankLevel - 1) * 0.06, 2.5);
    return Math.round(job.basePay * timeMultiplier * levelMultiplier);
  }

  function rollRiskyReward(job, baseReward, luckBonus) {
    if (!job.riskType) return { reward: baseReward, repDelta: 1 };
    const r = Math.random();

    if (job.riskType === "crypto") {
      const shift = Math.min(luckBonus, 0.12);
      const p1 = 0.60 - shift;
      const p2 = 0.30;
      const p3 = 0.09 + shift * 0.7;
      if (r < p1) return { reward: randInt(0, 400), repDelta: 1 };
      if (r < p1 + p2) return { reward: randInt(400, 1200), repDelta: 1 };
      if (r < p1 + p2 + p3) return { reward: randInt(1200, 3000), repDelta: 1 };
      return { reward: randInt(3000, 5000), repDelta: 1 };
    }

    if (job.riskType === "flip") {
      const winChance = Math.min(0.70 + luckBonus * 0.5, 0.85);
      if (r < winChance) return { reward: Math.round(baseReward * 1.6), repDelta: 1 };
      return { reward: Math.round(baseReward * 0.7), repDelta: -2 };
    }

    if (job.riskType === "contract") {
      const successChance = Math.min(0.65 + luckBonus * 0.45, 0.80);
      if (r < successChance) return { reward: Math.round(baseReward * 2.2), repDelta: 1 };
      return { reward: 0, repDelta: -4 };
    }

    return { reward: baseReward, repDelta: 1 };
  }

  function canTakeMainJob(now = Date.now()) {
    if (state.activeJobs.length >= getMaxConcurrentJobs()) return { ok: false, reason: "All job slots are full." };
    return { ok: true, reason: "" };
  }

  function getMaxConcurrentJobs() {
    return 3 + (state.parallelJobUpgradeLevel || 0);
  }

  function getParallelUpgradeCost() {
    return Math.round(5000 * Math.pow(1.9, state.parallelJobUpgradeLevel || 0));
  }

  function buyParallelUpgrade() {
    const level = state.parallelJobUpgradeLevel || 0;
    const cost = getParallelUpgradeCost();
    if (state.bankBalance < cost) {
      toast("Not enough money for upgrade.");
      return;
    }
    state.bankBalance -= cost;
    state.parallelJobUpgradeLevel = level + 1;
    addTx("parallel_upgrade", -cost, { level: state.parallelJobUpgradeLevel, maxJobs: getMaxConcurrentJobs() });
    saveState();
    render();
    toast(`Job slots upgraded. Max jobs: ${getMaxConcurrentJobs()}`);
  }

  function acceptMainJob(jobId, asOpportunity = false) {
    const now = Date.now();
    const job = MAIN_JOBS.find((j) => j.id === jobId);
    if (!job) return;
    if (state.bankLevel < job.unlockLevel) return;

    const check = canTakeMainJob(now);
    if (!check.ok) return;

    if (state.streakWindowUntil && now <= state.streakWindowUntil) state.mainStreak += 1;
    else state.mainStreak = 0;

    const mods = getModifiers(now);
    const effectiveDurationMs = Math.max(30 * 1000, Math.round(job.durationMin * 60 * 1000 * mods.durationMult));

    state.activeJobs.push({
      runId: uniqueId("job"),
      jobId: job.id,
      name: asOpportunity ? "Flash Contract" : job.name,
      durationMin: job.durationMin,
      basePay: asOpportunity ? Math.round(job.basePay * 2) : job.basePay,
      riskType: job.riskType || null,
      category: job.category || "general",
      acceptedAt: now,
      finishAt: now + effectiveDurationMs
    });

    if (asOpportunity) state.activeOpportunity = null;

    saveState();
    render();
  }

  function claimMainJob(runId = null) {
    const now = Date.now();
    let idx = -1;
    if (runId) idx = state.activeJobs.findIndex((j) => j.runId === runId);
    if (idx < 0) idx = state.activeJobs.findIndex((j) => now >= j.finishAt);
    if (idx < 0) return;

    const job = { ...state.activeJobs[idx] };
    if (now < job.finishAt) return;

    state.activeJobs.splice(idx, 1);
    saveState();

    const mods = getModifiers(now);
    let reward = Math.round(calcMainBaseReward(job) * mods.payoutMult);
    const risky = rollRiskyReward(job, reward, mods.riskyLuckBonus);
    reward = Math.round(risky.reward);

    const tax = Math.floor(reward * 0.10);
    let payout = reward - tax;

    payout = Math.round(payout * (1 + streakBonusPct()));
    if (mods.payoutBonusNextN > 0) {
      payout = Math.round(payout * (1 + mods.payoutBonusNextN));
      consumePayoutBonusUses();
    }
    if (mods.duplicatePayoutFactor > 0) {
      payout += Math.round(payout * mods.duplicatePayoutFactor);
    }

    state.bankBalance += payout;
    const xpBase = Math.ceil(job.durationMin / 2);
    gainXP(Math.ceil(xpBase * mods.xpMult));
    state.reputation += risky.repDelta + mods.repGainBonus;

    state.lastMainJobClaimAt = now;
    state.streakWindowUntil = now + STREAK_WINDOW_MS;

    addTx("main_job", payout, { job: job.name, gross: reward, tax, streakBonus: streakBonusPct() });
    if (payout > 5000) confettiBurst();

    saveState();
    render();
  }

  function resetQuickWindow(now = Date.now()) {
    if (!state.quickTaskWindowResetAt || now >= state.quickTaskWindowResetAt) {
      state.quickTasksUsedInWindow = 0;
      state.quickTaskWindowResetAt = now + QUICK_WINDOW_MS;
    }
  }

  function acceptQuickTask(taskId) {
    const now = Date.now();
    resetQuickWindow(now);
    if (state.quickTaskActiveId) return;
    if (state.quickTasksUsedInWindow >= QUICK_MAX_IN_WINDOW) return;

    const task = QUICK_TASKS.find((q) => q.id === taskId);
    if (!task) return;

    state.quickTaskActiveId = task.id;
    state.quickTaskAcceptedAt = now;
    state.quickTaskFinishAt = now + task.durationSec * 1000;
    state.quickTasksUsedInWindow += 1;

    saveState();
    render();
  }

  function claimQuickTask() {
    const now = Date.now();
    if (!state.quickTaskActiveId || !state.quickTaskFinishAt || now < state.quickTaskFinishAt) return;

    const task = QUICK_TASKS.find((q) => q.id === state.quickTaskActiveId);
    if (!task) return;

    state.quickTaskActiveId = null;
    state.quickTaskAcceptedAt = null;
    state.quickTaskFinishAt = null;
    saveState();

    const scaled = Math.round(task.basePay * (1 + (state.bankLevel - 1) * 0.03));
    const tax = Math.floor(scaled * 0.10);
    let payout = scaled - tax;

    const mods = getModifiers(now);
    if (mods.payoutBonusNextN > 0) {
      payout = Math.round(payout * (1 + mods.payoutBonusNextN));
      consumePayoutBonusUses();
    }
    if (mods.duplicatePayoutFactor > 0) {
      payout += Math.round(payout * mods.duplicatePayoutFactor);
    }

    state.bankBalance += payout;
    gainXP(Math.max(1, Math.ceil(task.durationSec / 35)));
    addTx("quick_task", payout, { task: task.name, gross: scaled, tax });

    saveState();
    render();
  }

  function opportunityCheck() {
    const now = Date.now();

    if (state.activeOpportunity && now >= state.activeOpportunity.offerExpiresAt) {
      state.activeOpportunity = null;
    }

    if (!state.nextOpportunityCheckAt) {
      state.nextOpportunityCheckAt = now + randInt(5 * 60 * 1000, 10 * 60 * 1000);
    }

    if (!state.activeOpportunity && now >= state.nextOpportunityCheckAt) {
      state.nextOpportunityCheckAt = now + randInt(5 * 60 * 1000, 10 * 60 * 1000);
      if (Math.random() < 0.20) {
        state.activeOpportunity = {
          id: uniqueId("opp"),
          title: "Flash Contract",
          durationMin: 2,
          basePay: 80,
          offerExpiresAt: now + 30 * 1000
        };
      }
    }
  }

  function acceptOpportunity() {
    const now = Date.now();
    const opp = state.activeOpportunity;
    if (!opp) return;
    if (now > opp.offerExpiresAt) {
      state.activeOpportunity = null;
      saveState();
      render();
      return;
    }

    const tempJob = {
      id: opp.id,
      name: opp.title,
      durationMin: opp.durationMin,
      basePay: opp.basePay,
      unlockLevel: 1,
      category: "general"
    };

    MAIN_JOBS.push(tempJob);
    acceptMainJob(tempJob.id, true);
    MAIN_JOBS.pop();
  }

  function boostCost(boost) {
    return Math.round(boost.baseCost * (1 + (state.bankLevel - 1) * 0.08));
  }

  function buyBoost(boostId) {
    const now = Date.now();
    const boost = BOOST_SHOP.find((b) => b.id === boostId);
    if (!boost) return;

    const cost = boostCost(boost);
    if (state.bankBalance < cost) {
      toast("Not enough money for boost.");
      return;
    }

    state.bankBalance -= cost;
    const entryId = uniqueId(`boost_${boost.id}`);
    state.activeBoosts[entryId] = {
      itemId: boost.id,
      type: boost.type,
      value: boost.value,
      startedAt: now,
      endsAt: now + boost.durationMs
    };

    addTx("boost_purchase", -cost, { boost: boost.name });
    saveState();
    render();
    toast(`${boost.name} activated.`);
  }

  function getTrainingCost() {
    return Math.round(25000 * Math.pow(1.25, state.trainingsBought || 0));
  }

  function buyTrainingPoint() {
    const cost = getTrainingCost();
    if (state.bankBalance < cost) return;
    state.bankBalance -= cost;
    state.skillPoints += 1;
    state.trainingsBought += 1;
    addTx("training", -cost, { gain: 1 });
    saveState();
    render();
  }

  function spendSkillPoint(skill) {
    if (!state.skillPoints) return;
    if (!Object.prototype.hasOwnProperty.call(state.skills, skill)) return;
    const cap = SKILL_CAPS[skill] || 10;
    if (state.skills[skill] >= cap) return;

    state.skills[skill] += 1;
    state.skillPoints -= 1;
    saveState();
    render();
  }

  function businessEntry(id, createIfMissing = true) {
    if (!state.ownedBusinesses[id] && createIfMissing) {
      state.ownedBusinesses[id] = { level: 0, lastPaidAt: Date.now(), hasManager: false, needsRestart: false };
    }
    return state.ownedBusinesses[id];
  }

  function businessUpgradeCost(biz, level) {
    const currentLevel = Math.max(0, Math.floor(Number(level || 0)));
    return 1000 * (currentLevel + 1);
  }

  function managerCostForBusiness(biz) {
    return Math.round(biz.baseCost * 10);
  }

  function isBusinessUnlocked(biz) {
    if (!biz) return false;
    if (biz.unlockType === "prevLevel") {
      const prev = BUSINESSES[BUSINESSES.findIndex((x) => x.id === biz.id) - 1];
      if (!prev) return true;
      const prevEnt = businessEntry(prev.id, false);
      return Number(prevEnt?.level || 0) >= Number(biz.unlockValue || 1);
    }
    return Number(state.totalEarned || 0) >= Number(biz.unlockValue || 0);
  }

  function businessGlobalProfitMult() {
    let mult = 1;
    if (state.upgrades?.profit_boost_1) mult *= 1.25;
    return mult;
  }

  function businessGlobalSpeedMult() {
    let mult = 1;
    if (state.upgrades?.speed_boost_1) mult *= 0.9;
    return mult;
  }

  function businessIntervalMs(biz) {
    const mods = getModifiers(Date.now());
    return Math.max(2 * 1000, Math.round(biz.intervalMs * businessGlobalSpeedMult() * mods.durationMult));
  }

  function businessPayoutPerInterval(biz, ent, mods) {
    if (!biz || !ent || ent.level <= 0) return 0;
    if (biz.id === "firm") {
      let payout = Math.min(
        Math.floor(state.bankBalance * 0.01 * (1 + 0.25 * (ent.level - 1))),
        Math.round(10000 * (1 + 0.2 * (ent.level - 1)))
      );
      payout = Math.floor(payout * businessGlobalProfitMult() * (ent.hasManager ? 1.05 : 1));
      return payout;
    }
    return Math.floor(
      biz.basePayout *
      (1 + 0.35 * (ent.level - 1)) *
      mods.payoutMult *
      businessGlobalProfitMult() *
      (ent.hasManager ? 1.05 : 1)
    );
  }

  function buyOrUpgradeBusiness(id) {
    const biz = BUSINESSES.find((b) => b.id === id);
    if (!biz) return;
    if (!isBusinessUnlocked(biz)) {
      toast("This business is locked.");
      return;
    }

    const ent = businessEntry(id);
    if (ent.level >= 5) return;

    const cost = businessUpgradeCost(biz, ent.level);
    if (state.bankBalance < cost) return;

    state.bankBalance -= cost;
    ent.level += 1;
    if (!ent.lastPaidAt) ent.lastPaidAt = Date.now();

    addTx("business_upgrade", -cost, { business: biz.name, level: ent.level });
    saveState();
    render();
  }

  function buyBusinessUpgrade(upgradeId) {
    const upgrade = BUSINESS_UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    if (state.upgrades[upgradeId]) return;
    if (state.bankBalance < upgrade.cost) {
      toast("Not enough money for upgrade.");
      return;
    }
    state.bankBalance -= upgrade.cost;
    state.upgrades[upgradeId] = true;
    addTx("business_global_upgrade", -upgrade.cost, { upgrade: upgrade.name });
    saveState();
    render();
  }

  function hireBusinessManager(id) {
    const biz = BUSINESSES.find((b) => b.id === id);
    if (!biz) return;
    const ent = businessEntry(id, false);
    if (!ent || ent.level <= 0 || ent.hasManager) return;
    const cost = managerCostForBusiness(biz);
    if (state.bankBalance < cost) {
      toast("Not enough money to hire manager.");
      return;
    }
    state.bankBalance -= cost;
    ent.hasManager = true;
    addTx("manager_hired", -cost, { business: biz.name });
    saveState();
    render();
  }

  function restartAllBusinesses() {
    toast("Businesses auto-restart now.");
  }

  function expectedActiveHourly() {
    const lvlFactor = 1 + state.bankLevel * 0.15;
    return Math.round(2200 * lvlFactor);
  }

  function processPassiveIncome() {
    const now = Date.now();
    const mods = getModifiers(now);
    let changed = false;

    for (const biz of BUSINESSES) {
      const ent = state.ownedBusinesses[biz.id];
      if (!ent || ent.level <= 0) continue;
      const last = ent.lastPaidAt || now;
      const intervalMs = businessIntervalMs(biz);
      let intervals = Math.floor((now - last) / intervalMs);
      if (intervals <= 0) continue;
      intervals = Math.min(intervals, 6);

      let payoutEach = businessPayoutPerInterval(biz, ent, mods);

      let total = Math.round(payoutEach * intervals * mods.passiveIncomeMultiplier);
      if (mods.payoutBonusNextN > 0) {
        total = Math.round(total * (1 + mods.payoutBonusNextN));
        consumePayoutBonusUses();
      }
      if (mods.duplicatePayoutFactor > 0) {
        total += Math.round(total * mods.duplicatePayoutFactor);
      }
      if (total <= 0) {
        ent.lastPaidAt = now;
        continue;
      }

      state.bankBalance += total;
      ent.lastPaidAt = now;
      ent.needsRestart = false;

      addTx("passive_income", total, { business: biz.name, intervals });
      changed = true;
    }

    return changed;
  }

  function claimDailyBonus() {
    const now = Date.now();
    if (state.lastDailyBonusAt && now - state.lastDailyBonusAt < 24 * 60 * 60 * 1000) return;
    const bonus = randInt(300, 700);
    state.bankBalance += bonus;
    state.lastDailyBonusAt = now;
    addTx("daily_bonus", bonus);
    saveState();
    render();
  }

  function applyInterest() {
    const now = Date.now();
    if (state.lastInterestAt && now - state.lastInterestAt < 60 * 60 * 1000) return;

    const mods = getModifiers(now);
    let interest = Math.floor(state.bankBalance * 0.01 * mods.interestMult);
    interest = Math.min(interest, 5000);
    if (interest <= 0) return;

    state.bankBalance += interest;
    state.lastInterestAt = now;
    addTx("interest", interest);

    saveState();
    render();
  }

  function coinFlip() {
    const bet = Math.floor(Number(dom.coinBetInput.value));
    if (!Number.isFinite(bet) || bet <= 0) return;

    const maxBet = Math.min(state.bankBalance, 5000 + state.bankLevel * 500);
    if (bet > maxBet) {
      dom.coinFlipHint.textContent = `Max bet is ${fmtMoney(maxBet)}.`;
      return;
    }

    if (bet > state.bankBalance) return;

    state.bankBalance -= bet;
    const win = Math.random() < 0.5;
    const mods = getModifiers(Date.now());

    if (win) {
      const payout = Math.floor(bet * 1.9);
      state.bankBalance += payout;
      state.casinoStats.wins += 1;
      addTx("coin_flip", payout - bet, { bet, outcome: "win" });
      dom.coinFlipHint.textContent = `Win. Net +${fmtMoney(payout - bet)}.`;
    } else {
      state.casinoStats.losses += 1;
      if (mods.lossImmunity) {
        state.bankBalance += bet;
        addTx("coin_flip", 0, { bet, outcome: "loss_blocked" });
        dom.coinFlipHint.textContent = "Loss prevented by Vault Insurance.";
      } else {
        addTx("coin_flip", -bet, { bet, outcome: "loss" });
        dom.coinFlipHint.textContent = `Loss. -${fmtMoney(bet)}.`;
      }
    }

    saveState();
    render();
  }

  function itemById(itemId) {
    return ITEM_CATALOG.find((i) => i.id === itemId);
  }

  function deriveOrderStatus(order, now = Date.now()) {
    if (!order) return "Processing";
    if (["Processing", "Shipped", "OutForDelivery", "Delivered", "Cancelled"].includes(order.status)) {
      if (order.status === "Cancelled") return "Cancelled";
      if (now >= Number(order.etaAt || 0)) return "Delivered";
      if (now >= Number(order.outForDeliveryAt || 0)) return "OutForDelivery";
      if (now >= Number(order.shippedAt || 0)) return "Shipped";
      return "Processing";
    }
    if (order.status === "cancelled") return "Cancelled";
    if (now < order.shippedAt) return "Processing";
    if (now < order.outForDeliveryAt) return "Shipped";
    if (now < order.deliveredAt) return "OutForDelivery";
    return "Delivered";
  }

  function statusBadge(status) {
    if (status === "OutForDelivery") return "Out for Delivery";
    if (status === "out_for_delivery") return "Out for Delivery";
    return String(status || "").replace(/_/g, " ");
  }

  function updateOrderStatuses(now = Date.now()) {
    for (const order of Object.values(state.orders)) {
      const next = deriveOrderStatus(order, now);
      if (order.status !== next) {
        if (!Array.isArray(order.timeline)) order.timeline = [];
        order.timeline.push({ status: next, at: now });
        order.status = next;
        order.lastStatusUpdateAt = now;
      }
    }
  }

  async function refreshRotatingShop(force = false) {
    if (!hasServerSession() && !localAuthMode) return;
    if (!force && serverShopSlots.length) return;
    try {
      const resp = await fetch("/api/shop", { cache: "no-store" });
      if (!resp.ok) throw new Error(`Shop fetch failed (${resp.status})`);
      const data = await resp.json();
      serverShopSlots = Array.isArray(data.slots) ? data.slots : [];
      serverShopLastUpdatedAt = data.lastUpdatedAt || Date.now();
      serverReachable = true;
    } catch {
      serverReachable = false;
    }
  }

  async function refreshServerOrders() {
    if (!hasServerSession()) return;
    try {
      const data = await postJson("/api/orders/list", {
        username: serverSession.username,
        password: serverSession.password
      });
      serverOrders = Array.isArray(data.orders) ? data.orders : [];
      const progressResp = await postJson("/api/progress/load", {
        username: serverSession.username,
        password: serverSession.password
      });
      if (progressResp?.progress && typeof progressResp.progress === "object") {
        const progress = progressResp.progress;
        if (typeof progress.bankBalance === "number") state.bankBalance = progress.bankBalance;
        if (progress.inventory && typeof progress.inventory === "object") state.inventory = progress.inventory;
        if (typeof progress.totalEarned === "number") state.totalEarned = progress.totalEarned;
        if (progress.upgrades && typeof progress.upgrades === "object") state.upgrades = progress.upgrades;
        if (progress.ownedBusinesses && typeof progress.ownedBusinesses === "object") state.ownedBusinesses = progress.ownedBusinesses;
      }
      serverReachable = true;
    } catch {
      serverReachable = false;
    }
  }

  async function trackOrderByTrackingId() {
    const trackingId = String(dom.trackingSearchInput?.value || "").trim();
    if (!trackingId) return;
    if (!hasServerSession()) {
      toast("Log in to track cloud orders.");
      return;
    }
    try {
      const data = await postJson("/api/orders/track", {
        username: serverSession.username,
        password: serverSession.password,
        trackingId
      });
      if (data?.order) {
        const existing = serverOrders.findIndex((x) => x.orderId === data.order.orderId);
        if (existing >= 0) serverOrders[existing] = data.order;
        else serverOrders.unshift(data.order);
        selectedTrackOrderId = data.order.orderId;
        render();
      }
    } catch (err) {
      toast(err.message || "Tracking lookup failed.");
    }
  }

  function getItemPrice(item) {
    const mods = getModifiers(Date.now());
    const raw = Math.round(Number(item?.price || 0) * Math.max(0.75, mods.shopDiscountFactor || 1));
    return Math.max(1, raw);
  }

  function countInventorySlots(itemsObj) {
    return Object.keys(itemsObj || {}).length;
  }

  function maxInventorySlots() {
    const mods = getModifiers(Date.now());
    return 200 + (mods.inventoryCapacityBonus || 0);
  }

  function canBuyPowerItem(item, now = Date.now()) {
    if (!item || item.category !== "power") return true;
    const activeBoosts = Object.values(state.activeBoosts || {}).filter((b) => stampMs(b.endsAt) > now);
    const activeCount = activeBoosts.length;
    const existing = state.activeBoosts?.[item.id];
    const stacks = Math.max(1, Math.floor(Number(existing?.stacks || 1)));
    const maxStacks = Math.max(1, Number(item.power?.maxStacks || 1));
    const activeExisting = existing && stampMs(existing.endsAt) > now;
    if (!activeExisting && activeCount >= MAX_ACTIVE_POWER_BOOSTS) return false;
    if (activeExisting && item.power?.stackable && stacks >= maxStacks) return false;
    return true;
  }

  async function cleanupExpiredCloudBoosts(nowMs = Date.now()) {
    if (!firebaseReady || !currentUid) return;
    const ref = activeBoostsDocRef(currentUid);
    const snap = await firebaseApi.getDoc(ref);
    if (!snap.exists()) return;
    const boosts = snap.data()?.boosts || {};
    const next = {};
    let changed = false;
    for (const [id, b] of Object.entries(boosts)) {
      const exp = stampMs(b?.expiresAt);
      if (exp && nowMs >= exp) {
        changed = true;
        continue;
      }
      next[id] = b;
    }
    if (changed) {
      await firebaseApi.setDoc(ref, { boosts: next, updatedAt: firebaseApi.serverTimestamp() }, { merge: true });
      state.activeBoosts = normalizeBoostMap(next);
      saveLocalState();
    }
  }

  async function applyPowerBoostPurchase(item) {
    if (!item || item.category !== "power") return false;
    if (!firebaseReady || !currentUid) throw new Error("Power Items require cloud login.");

    const now = Date.now();
    const windowStart = now - 60 * 1000;
    state.powerPurchaseWindow = (state.powerPurchaseWindow || []).filter((ts) => ts >= windowStart);
    if (state.powerPurchaseWindow.length >= MAX_POWER_PURCHASES_PER_MIN) {
      throw new Error("Rate limit reached. Try again in a minute.");
    }

    const uid = currentUid;
    const userRef = userDocRef(uid);
    const invRef = inventoryDocRef(uid);
    const boostRef = activeBoostsDocRef(uid);
    const itemId = item.id;
    const itemPrice = getItemPrice(item);

    let needsFinalizeTimestamp = false;

    await firebaseApi.runTransaction(db, async (tx) => {
      const [userSnap, invSnap, boostSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(invRef),
        tx.get(boostRef)
      ]);
      const bal = Number(userSnap.data()?.balance ?? state.bankBalance ?? 0);
      if (bal < itemPrice) throw new Error("Not enough money for this Power Item.");

      const invItems = { ...(invSnap.data()?.items || state.inventory || {}) };
      const invSlots = countInventorySlots(invItems);
      const hasItemSlot = Boolean(invItems[itemId]);
      const cap = maxInventorySlots();
      if (!hasItemSlot && invSlots >= cap) {
        throw new Error(`Inventory full (${cap} slots).`);
      }
      const boostMap = { ...(boostSnap.data()?.boosts || {}) };
      const activeCount = Object.values(boostMap).filter((b) => {
        const exp = stampMs(b?.expiresAt);
        return exp ? exp > now : true;
      }).length;

      const existing = boostMap[itemId] || null;
      const powerCfg = item.power || {};
      const stackable = Boolean(powerCfg.stackable);
      const maxStacks = Math.max(1, Number(powerCfg.maxStacks || 1));
      const existingStacks = Math.max(1, Math.floor(Number(existing?.stacks || 1)));
      const existingExpiryMs = stampMs(existing?.expiresAt);
      const stillActive = existingExpiryMs > now;

      if ((!existing || !stillActive) && activeCount >= MAX_ACTIVE_POWER_BOOSTS) {
        throw new Error("Maximum active boosts reached (6).");
      }

      if (!invItems[itemId]) invItems[itemId] = { qty: 0 };
      invItems[itemId].qty = Math.min(item.maxStack || 99, Number(invItems[itemId].qty || 0) + 1);

      const nextEntry = {
        id: itemId,
        itemId,
        name: item.name,
        type: powerCfg.effect || "custom",
        value: Number(powerCfg.value || 0),
        purchasedAt: firebaseApi.serverTimestamp(),
        expiresAt: firebaseApi.Timestamp.fromMillis(now + POWER_DURATION_MS),
        stacks: 1,
        meta: existing?.meta && typeof existing.meta === "object" ? { ...existing.meta } : {}
      };

      if (stillActive) {
        if (stackable) {
          const nextStacks = Math.min(maxStacks, existingStacks + 1);
          nextEntry.stacks = nextStacks;
          nextEntry.expiresAt = firebaseApi.Timestamp.fromMillis(
            (existingExpiryMs || now) + (nextStacks > existingStacks ? POWER_DURATION_MS : 0)
          );
        } else {
          nextEntry.stacks = 1;
          needsFinalizeTimestamp = true;
        }
      } else {
        needsFinalizeTimestamp = true;
      }

      if (itemId === "instant_delivery_token") {
        const prevCharges = Math.max(0, Math.floor(Number(existing?.meta?.charges || 0)));
        nextEntry.meta.charges = prevCharges + 5;
      }

      tx.set(userRef, {
        balance: bal - itemPrice,
        lastActiveAt: firebaseApi.serverTimestamp(),
        gameState: { ...state, bankBalance: bal - itemPrice }
      }, { merge: true });
      tx.set(invRef, { items: invItems }, { merge: true });
      tx.set(boostRef, {
        boosts: { ...boostMap, [itemId]: nextEntry },
        updatedAt: firebaseApi.serverTimestamp()
      }, { merge: true });
    });

    if (needsFinalizeTimestamp) {
      await firebaseApi.runTransaction(db, async (tx) => {
        const snap = await tx.get(boostRef);
        const map = { ...(snap.data()?.boosts || {}) };
        const entry = map[itemId];
        if (!entry) return;
        const purchasedAtMs = stampMs(entry.purchasedAt) || Date.now();
        entry.expiresAt = firebaseApi.Timestamp.fromMillis(purchasedAtMs + POWER_DURATION_MS);
        map[itemId] = entry;
        tx.set(boostRef, { boosts: map, updatedAt: firebaseApi.serverTimestamp() }, { merge: true });
      });
    }

    const [userPost, invPost, boostPost] = await Promise.all([
      firebaseApi.getDoc(userRef),
      firebaseApi.getDoc(invRef),
      firebaseApi.getDoc(boostRef)
    ]);
    if (userPost.exists()) state.bankBalance = Number(userPost.data()?.balance ?? state.bankBalance);
    if (invPost.exists()) state.inventory = invPost.data()?.items || state.inventory;
    if (boostPost.exists()) state.activeBoosts = normalizeBoostMap(boostPost.data()?.boosts || {});
    state.powerPurchaseWindow.push(now);
    state.powerPurchaseWindow = state.powerPurchaseWindow.slice(-20);
    addTx("power_item_purchase", -itemPrice, { item: item.name, duration: "21h" });
    saveState();
    render();
    return true;
  }

  async function consumeInstantDeliveryCharge() {
    const boostId = "instant_delivery_token";
    const local = state.activeBoosts?.[boostId];
    if (!local) return false;
    const charges = Math.max(0, Math.floor(Number(local?.meta?.charges || 0)));
    if (charges <= 0) return false;

    if (firebaseReady && currentUid) {
      const ref = activeBoostsDocRef(currentUid);
      await firebaseApi.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const boosts = { ...(snap.data()?.boosts || {}) };
        const entry = boosts[boostId];
        const nextCharges = Math.max(0, Math.floor(Number(entry?.meta?.charges || 0)) - 1);
        if (!entry) return;
        entry.meta = { ...(entry.meta || {}), charges: nextCharges };
        boosts[boostId] = entry;
        tx.set(ref, { boosts, updatedAt: firebaseApi.serverTimestamp() }, { merge: true });
      });
      const fresh = await firebaseApi.getDoc(ref);
      if (fresh.exists()) state.activeBoosts = normalizeBoostMap(fresh.data()?.boosts || {});
    } else {
      local.meta = { ...(local.meta || {}), charges: Math.max(0, charges - 1) };
    }
    saveState();
    return true;
  }

  async function placeSingleItemOrder(itemId, preferredSlotId = "") {
    if (purchaseLock) return;
    purchaseLock = true;
    try {
      const item = itemById(itemId);
      if (!item) return;
      const price = getItemPrice(item);

      if (item.category === "power") {
        await applyPowerBoostPurchase(item);
        toast(`Activated ${item.name} for 21 hours.`);
        return;
      }

      if (hasServerSession()) {
        try {
          const modsForDelivery = getModifiers(Date.now());
          if ((modsForDelivery.instantDeliveryCharges || 0) > 0) {
            await consumeInstantDeliveryCharge();
            toast("Instant Delivery Token charge used.");
          }
          await flushServerMirrorSave();
          const itemDef = itemById(itemId);
          if (!itemDef) return;

          const data = await postJson("/api/shop/buy", {
            username: serverSession.username,
            password: serverSession.password,
            itemId: itemDef.id
          });
          if (typeof data.bankBalance === "number") state.bankBalance = data.bankBalance;
          addTx("store_order", -price, { item: itemDef.name, via: "server", trackingId: data.trackingId });
          await refreshServerOrders();
          if (data.orderId) selectedTrackOrderId = data.orderId;
          saveState();
          render();
          toast(`Order placed for ${itemDef.name}. Tracking: ${data.trackingId || "pending"}`);
          return;
        } catch {
          serverReachable = false;
          toast("Cloud order API unavailable. Using local delivery tracking.");
        }
      }

      if (state.bankBalance < price) {
        toast("Not enough money for this item.");
        return;
      }
      const modsForDelivery = getModifiers(Date.now());
      if ((modsForDelivery.instantDeliveryCharges || 0) > 0) {
        await consumeInstantDeliveryCharge();
        toast("Instant Delivery Token charge used.");
      }
      state.bankBalance -= price;
      const order = createLocalOrder(item, price);
      addTx("store_order", -price, { item: item.name, via: "local", trackingId: order.trackingId });

      saveState();
      render();
      toast(`Order placed for ${item.name}. Tracking: ${order.trackingId}`);
    } finally {
      purchaseLock = false;
    }
  }

  function createLocalOrder(item, unitPrice) {
    const now = Date.now();
    const orderId = uniqueId("ord");
    const trackingId = trackingNumber();
    const carrier = CARRIERS[randInt(0, CARRIERS.length - 1)];
    const shippedAt = now + randInt(20 * 1000, 60 * 1000);
    const outForDeliveryAt = shippedAt + randInt(60 * 1000, 180 * 1000);
    const defaultDeliveredAt = outForDeliveryAt + randInt(120 * 1000, 300 * 1000);
    const mods = getModifiers(now);
    const instant = (mods.instantDeliveryCharges || 0) > 0;
    const deliveredAt = instant ? (now + 60 * 1000) : defaultDeliveredAt;
    const itemLine = { itemId: item.id, name: item.name, qty: 1, price: unitPrice };
    const order = {
      orderId,
      trackingId,
      carrier,
      status: "Processing",
      createdAt: now,
      shippedAt: instant ? now + 15 * 1000 : shippedAt,
      outForDeliveryAt: instant ? now + 35 * 1000 : outForDeliveryAt,
      etaAt: deliveredAt,
      deliveredAt,
      lastStatusUpdateAt: now,
      subtotal: unitPrice,
      shippingFee: 0,
      total: unitPrice,
      items: [itemLine],
      deliveredClaimedToInventory: false,
      timeline: [{ status: "Processing", at: now }]
    };
    state.orders[orderId] = order;
    selectedTrackOrderId = orderId;
    return order;
  }

  function claimDeliveredOrder(orderId) {
    const order = state.orders?.[orderId];
    if (!order) return;
    const now = Date.now();
    const status = deriveOrderStatus(order, now);
    if (status !== "Delivered") {
      toast("Order not delivered yet.");
      return;
    }
    if (order.deliveredClaimedToInventory) {
      toast("Order already claimed.");
      return;
    }
    for (const line of (order.items || [])) {
      const item = itemById(line.itemId);
      if (!item) continue;
      const existing = state.inventory?.[line.itemId];
      if (!existing && countInventorySlots(state.inventory) >= maxInventorySlots()) {
        toast(`Inventory full (${maxInventorySlots()} slots).`);
        return;
      }
      if (!state.inventory[line.itemId]) state.inventory[line.itemId] = { qty: 0 };
      const qty = Math.max(1, Math.floor(Number(line.qty || 1)));
      state.inventory[line.itemId].qty = Math.min(item.maxStack || 99, Number(state.inventory[line.itemId].qty || 0) + qty);
    }
    order.deliveredClaimedToInventory = true;
    order.lastStatusUpdateAt = now;
    addTx("order_claim", 0, { orderId, trackingId: order.trackingId });
    saveState();
    render();
    toast("Order claimed to inventory.");
  }

  function useInventoryItem(itemId) {
    const item = itemById(itemId);
    if (!item || !item.boost) return;

    const slot = state.inventory[itemId];
    if (!slot || slot.qty <= 0) return;

    slot.qty -= 1;
    if (slot.qty <= 0) delete state.inventory[itemId];

    const now = Date.now();
    const boostId = uniqueId(`inv_${itemId}`);
    state.activeBoosts[boostId] = {
      itemId: item.id,
      type: item.boost.type,
      value: item.boost.value,
      startedAt: now,
      endsAt: now + (item.boost.durationMs || 60 * 1000),
      remainingUses: item.boost.remainingUses || undefined
    };

    addTx("item_used", 0, { item: item.name, boost: item.boost.type });
    saveState();
    render();
    toast(`${item.name} used.`);
  }

  function animateBalance(target) {
    const start = balanceDisplay;
    const diff = target - start;
    const duration = 300;
    const t0 = performance.now();

    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      balanceDisplay = start + diff * p;
      dom.balanceText.textContent = fmtMoney(balanceDisplay);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function confettiBurst() {
    for (let i = 0; i < 24; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${50 + randInt(-15, 15)}%`;
      piece.style.top = `${35 + randInt(-5, 5)}%`;
      piece.style.background = ["#35e2ff", "#5fff9a", "#ffd26e", "#ff7e95"][randInt(0, 3)];
      piece.style.setProperty("--dx", `${randInt(-260, 260)}px`);
      piece.style.setProperty("--dy", `${randInt(120, 300)}px`);
      dom.confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 900);
    }
  }

  function renderMainJob(now) {
    const activeJobs = [...state.activeJobs].sort((a, b) => a.finishAt - b.finishAt);
    const maxJobs = getMaxConcurrentJobs();
    dom.mainSlotsText.textContent = `Job slots: ${activeJobs.length} / ${maxJobs}`;

    if (!activeJobs.length) {
      dom.mainJobStatus.textContent = "No active main job";
      dom.mainJobTimer.textContent = "--:--";
      dom.mainFinishAt.textContent = "Finish: --";
      dom.claimMainJobBtn.disabled = true;
    } else {
      const next = activeJobs[0];
      const remain = next.finishAt - now;
      dom.mainJobStatus.textContent = `Active jobs: ${activeJobs.length}`;
      dom.mainJobTimer.textContent = fmtDur(remain);
      dom.mainFinishAt.textContent = `Next finish: ${fmtTs(next.finishAt)}`;
      dom.claimMainJobBtn.disabled = !activeJobs.some((j) => now >= j.finishAt);
    }

    dom.activeJobsList.innerHTML = "";
    activeJobs.forEach((job) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="row-head"><strong>${job.name}</strong><span>${fmtDur(job.finishAt - now)}</span></div>
        <div class="row-meta">Finish: ${fmtTs(job.finishAt)}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = "Claim";
      btn.disabled = now < job.finishAt;
      btn.onclick = () => claimMainJob(job.runId);
      row.appendChild(btn);
      dom.activeJobsList.appendChild(row);
    });

    dom.cooldownStatus.textContent = "Cooldown removed";

    const streakBonus = Math.round(streakBonusPct() * 100);
    dom.streakText.textContent = `Streak: ${state.mainStreak} (+${streakBonus}%)`;
    if (state.streakWindowUntil && now < state.streakWindowUntil) {
      dom.streakWindowText.textContent = `Keep streak: start next job within ${fmtDur(state.streakWindowUntil - now)}`;
    } else {
      dom.streakWindowText.textContent = "No active streak window";
    }

    dom.jobBoard.innerHTML = "";
    const mods = getModifiers(now);

    MAIN_JOBS.forEach((job) => {
      const can = canTakeMainJob(now).ok && state.bankLevel >= job.unlockLevel;
      const row = document.createElement("div");
      row.className = "job-row";
      const base = Math.round(calcMainBaseReward(job) * mods.payoutMult);
      const taxed = base - Math.floor(base * 0.10);
      const low = Math.round(taxed * 0.85);
      const high = Math.round(taxed * 1.15);
      const effectiveDur = Math.round(job.durationMin * 60 * 1000 * mods.durationMult);
      row.innerHTML = `
        <div class="row-head"><strong>${job.name}</strong><span>${fmtDur(effectiveDur)}</span></div>
        <div class="row-meta">Est payout ${fmtMoney(low)} - ${fmtMoney(high)} | unlock lvl ${job.unlockLevel}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Accept";
      btn.disabled = !can;
      btn.onclick = () => acceptMainJob(job.id, false);
      row.appendChild(btn);
      dom.jobBoard.appendChild(row);
    });
  }

  function renderQuick(now) {
    resetQuickWindow(now);
    const left = Math.max(0, QUICK_MAX_IN_WINDOW - state.quickTasksUsedInWindow);
    dom.quickQuotaText.textContent = `Quick tasks left in this window: ${left}/${QUICK_MAX_IN_WINDOW}`;

    const active = state.quickTaskActiveId ? QUICK_TASKS.find((q) => q.id === state.quickTaskActiveId) : null;
    if (!active) {
      dom.quickTaskStatus.textContent = "No active quick task";
      dom.quickTaskTimer.textContent = "--:--";
      dom.claimQuickTaskBtn.disabled = true;
    } else {
      const remain = state.quickTaskFinishAt - now;
      dom.quickTaskStatus.textContent = `Active: ${active.name}`;
      dom.quickTaskTimer.textContent = fmtDur(remain);
      dom.claimQuickTaskBtn.disabled = remain > 0;
    }

    dom.quickTaskBoard.innerHTML = "";
    QUICK_TASKS.forEach((task) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const scaled = Math.round(task.basePay * (1 + (state.bankLevel - 1) * 0.03));
      const taxed = scaled - Math.floor(scaled * 0.10);
      row.innerHTML = `<div class="row-head"><strong>${task.name}</strong><span>${task.durationSec}s</span></div><div class="row-meta">Est ${fmtMoney(taxed)}</div>`;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = "Start";
      btn.disabled = Boolean(state.quickTaskActiveId) || left <= 0;
      btn.onclick = () => acceptQuickTask(task.id);
      row.appendChild(btn);
      dom.quickTaskBoard.appendChild(row);
    });
  }

  function renderOpportunity(now) {
    const opp = state.activeOpportunity;
    if (!opp) {
      dom.opportunityStatus.textContent = "No active flash contract";
      dom.opportunityTimer.textContent = "--:--";
      dom.acceptOpportunityBtn.disabled = true;
    } else {
      const remain = opp.offerExpiresAt - now;
      dom.opportunityStatus.textContent = `${opp.title} available`;
      dom.opportunityTimer.textContent = remain > 0 ? `Accept within ${fmtDur(remain)}` : "Expired";
      dom.acceptOpportunityBtn.disabled = remain <= 0;
    }
    const next = state.nextOpportunityCheckAt && now < state.nextOpportunityCheckAt ? fmtDur(state.nextOpportunityCheckAt - now) : "rolling now";
    dom.nextOpportunityText.textContent = `Next roll: ${next}`;
  }

  function renderSpend(now) {
    removeExpiredBoosts(now);
    const activeBoostCount = Object.keys(state.activeBoosts).length;
    dom.boostStatus.textContent = activeBoostCount ? `Active boosts: ${activeBoostCount}` : "No active boosts.";

    dom.boostShop.innerHTML = "";
    BOOST_SHOP.forEach((boost) => {
      const cost = boostCost(boost);
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="row-head"><strong>${boost.name}</strong><span>${fmtMoney(cost)}</span></div>
        <div class="row-meta">${boost.type} for ${fmtDur(boost.durationMs)}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Buy & Use";
      btn.disabled = state.bankBalance < cost;
      btn.onclick = () => buyBoost(boost.id);
      row.appendChild(btn);
      dom.boostShop.appendChild(row);
    });

    dom.skillPointText.textContent = `Skill Points: ${state.skillPoints}`;
    dom.trainingCostText.textContent = `Training Cost: ${fmtMoney(getTrainingCost())}`;
    dom.buyTrainingBtn.disabled = state.bankBalance < getTrainingCost();
    dom.parallelUpgradeText.textContent = `Level ${state.parallelJobUpgradeLevel} | Max jobs ${getMaxConcurrentJobs()} | Next ${fmtMoney(getParallelUpgradeCost())}`;
    dom.buyParallelUpgradeBtn.disabled = state.bankBalance < getParallelUpgradeCost();

    const skillMeta = [
      ["efficiency", "Efficiency", "+2% payout / point"],
      ["speed", "Speed", "-2% duration / point"],
      ["luck", "Luck", "Better risky odds"],
      ["charisma", "Charisma", "+1 rep every 3 points"]
    ];

    dom.skillsPanel.innerHTML = "";
    skillMeta.forEach(([id, name, desc]) => {
      const cur = state.skills[id];
      const cap = SKILL_CAPS[id] || 10;
      const capped = cur >= cap;
      const row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML = `<div><strong>${name}</strong> <span class="hint">${desc}</span><br><span class="row-meta">${cur}/${cap}${capped ? " (capped)" : ""}</span></div>`;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = "+1";
      btn.disabled = state.skillPoints <= 0 || capped;
      btn.onclick = () => spendSkillPoint(id);
      row.appendChild(btn);
      dom.skillsPanel.appendChild(row);
    });

    dom.businessMoneyBar.textContent = `Money ${fmtMoney(state.bankBalance)} | Total Earned ${fmtMoney(state.totalEarned || 0)}`;
    dom.businessPanel.innerHTML = "";
    BUSINESSES.forEach((biz) => {
      const unlocked = isBusinessUnlocked(biz);
      const ent = businessEntry(biz.id, false) || { level: 0, lastPaidAt: now, hasManager: false };
      const cost = businessUpgradeCost(biz, ent.level);
      const intervalMs = businessIntervalMs(biz);
      const payout = businessPayoutPerInterval(biz, { ...ent, level: Math.max(1, ent.level || 1) }, getModifiers(now));
      const needsRestart = false;
      const timeLeft = ent.level > 0
        ? (needsRestart ? 0 : Math.max(0, (Number(ent.lastPaidAt || now) + intervalMs) - now))
        : intervalMs;
      const progressRatio = ent.level > 0
        ? (needsRestart ? 1 : Math.max(0, Math.min(1, (now - Number(ent.lastPaidAt || now)) / intervalMs)))
        : 0;

      const row = document.createElement("div");
      row.className = `item-row business-tile${unlocked ? "" : " locked"}`;
      row.innerHTML = `
        <div class="row-head">
          <strong>${biz.icon || "🏪"} ${biz.name}</strong>
          <span>${ent.level || 0}/5</span>
        </div>
        <div class="business-badges">
          <span class="chip">Cost ${fmtMoney(cost)}</span>
          <span class="chip">Payout ${fmtMoney(Math.max(0, payout))}</span>
          <span class="chip">Timer ${fmtDur(timeLeft)}</span>
          ${unlocked ? "" : `<span class="chip">Locked</span>`}
        </div>
        <div class="business-progress"><span style="width:${Math.round(progressRatio * 100)}%"></span></div>
        <div class="row-meta">
          ${unlocked
            ? `Unlock target met. Interval ${fmtDur(intervalMs)}${ent.hasManager ? " | Manager active (+5% payout)" : ""} | Auto restart on`
            : `Unlock at Total Earned ${fmtMoney(biz.unlockValue || 0)}`}
        </div>
      `;

      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = unlocked
        ? (ent.level === 0 ? "Buy" : (ent.level >= 5 ? "Running" : "Upgrade"))
        : "Coming Soon";
      btn.disabled = !unlocked || ent.level >= 5 || state.bankBalance < cost;
      btn.onclick = () => buyOrUpgradeBusiness(biz.id);
      row.appendChild(btn);
      dom.businessPanel.appendChild(row);
    });

    dom.businessUpgradesPanel.innerHTML = "";
    BUSINESS_UPGRADES.forEach((upgrade) => {
      const owned = Boolean(state.upgrades[upgrade.id]);
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="row-head"><strong>${upgrade.name}</strong><span>${owned ? "Owned" : fmtMoney(upgrade.cost)}</span></div>
        <div class="row-meta">${upgrade.desc}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = owned ? "Purchased" : "Buy Upgrade";
      btn.disabled = owned || state.bankBalance < upgrade.cost;
      btn.onclick = () => buyBusinessUpgrade(upgrade.id);
      row.appendChild(btn);
      dom.businessUpgradesPanel.appendChild(row);
    });

    dom.businessManagersPanel.innerHTML = "";
    BUSINESSES.forEach((biz) => {
      const ent = businessEntry(biz.id, false) || { level: 0, hasManager: false };
      const unlocked = isBusinessUnlocked(biz);
      const row = document.createElement("div");
      row.className = "item-row";
      const cost = managerCostForBusiness(biz);
      row.innerHTML = `
        <div class="row-head"><strong>${biz.icon || "🏪"} ${biz.name}</strong><span>${ent.hasManager ? "Hired" : fmtMoney(cost)}</span></div>
        <div class="row-meta">${!unlocked ? "Locked business" : ent.level <= 0 ? "Own this business first." : "Manager auto-runs this business (+5% payout)."}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = ent.hasManager ? "Manager Active" : "Hire Manager";
      btn.disabled = !unlocked || ent.level <= 0 || ent.hasManager || state.bankBalance < cost;
      btn.onclick = () => hireBusinessManager(biz.id);
      row.appendChild(btn);
      dom.businessManagersPanel.appendChild(row);
    });

    dom.businessStatsPanel.innerHTML = `
      <div class="item-row">
        <div class="row-head"><strong>Business Stats</strong><span>Overview</span></div>
        <div class="row-meta">Total Earned: ${fmtMoney(state.totalEarned || 0)}</div>
        <div class="row-meta">Owned Businesses: ${BUSINESSES.filter((b) => (businessEntry(b.id, false)?.level || 0) > 0).length}/${BUSINESSES.length}</div>
        <div class="row-meta">Managers Hired: ${BUSINESSES.filter((b) => businessEntry(b.id, false)?.hasManager).length}</div>
      </div>
    `;

    dom.coinFlipStats.textContent = `Wins: ${state.casinoStats.wins} | Losses: ${state.casinoStats.losses}`;
  }

  function renderStore() {
    dom.storeList.innerHTML = "";
    const now = Date.now();
    dom.shopLastUpdated.textContent = `Last updated: ${fmtTs(now)}`;
    const groups = [
      { key: "standard", title: "Standard Items", items: ITEM_CATALOG.filter((i) => i.category !== "power") },
      { key: "power", title: "Power Items", items: ITEM_CATALOG.filter((i) => i.category === "power") }
    ];

    groups.forEach((group) => {
      const title = document.createElement("h3");
      title.textContent = group.title;
      dom.storeList.appendChild(title);

      group.items.forEach((item) => {
        const price = getItemPrice(item);
        const ownedQty = Math.max(0, Math.floor(Number(state.inventory?.[item.id]?.qty || 0)));
        const row = document.createElement("div");
        row.className = "item-row";
        const rarity = item.rarity ? ` | ${item.rarity}` : "";
        const duration = item.category === "power" ? " | Duration 21 hours" : "";
        row.innerHTML = `
          <div class="row-head"><strong>${item.icon || "📦"} ${item.name}</strong><span>${fmtMoney(price)}</span></div>
          <div class="row-meta">${item.description}${rarity}${duration}</div>
          <div class="row-meta">Owned: ${ownedQty}</div>
        `;
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Buy";
        btn.disabled = purchaseLock || state.bankBalance < Number(price || 0) || !canBuyPowerItem(item, now);
        btn.onclick = () => placeSingleItemOrder(item.id);
        row.appendChild(btn);
        dom.storeList.appendChild(row);
      });
    });
  }

  function renderInventory(now) {
    removeExpiredBoosts(now);

    dom.inventoryList.innerHTML = "";
    const inventoryEntries = Object.entries(state.inventory)
      .filter(([, v]) => (v.qty || 0) > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (!inventoryEntries.length) {
      dom.inventoryList.innerHTML = "<p class='hint'>No items in inventory yet. Delivered orders will auto-add items.</p>";
    } else {
      for (const [itemId, slot] of inventoryEntries) {
        const item = itemById(itemId);
        if (!item) continue;
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `
          <div class="row-head"><strong>${item.icon} ${item.name}</strong><span>Qty ${slot.qty}</span></div>
          <div class="row-meta">${item.description}</div>
        `;
        const btn = document.createElement("button");
        btn.className = "btn secondary";
        if (item.category === "power") {
          btn.textContent = "Auto Active";
          btn.disabled = true;
        } else {
          btn.textContent = "Use";
          btn.disabled = slot.qty <= 0;
          btn.onclick = () => useInventoryItem(itemId);
        }
        row.appendChild(btn);
        dom.inventoryList.appendChild(row);
      }
    }

    dom.activeBoostList.innerHTML = "";
    const boosts = Object.entries(state.activeBoosts);
    if (!boosts.length) {
      dom.activeBoostList.innerHTML = "<p class='hint'>No active boosts.</p>";
    } else {
      boosts.forEach(([boostId, boost]) => {
        const row = document.createElement("div");
        row.className = "item-row";
        const endMs = stampMs(boost.endsAt) || now;
        const startMs = stampMs(boost.startedAt) || Math.max(0, endMs - POWER_DURATION_MS);
        const remain = Math.max(0, endMs - now);
        const total = Math.max(1000, endMs - startMs);
        const pct = Math.max(0, Math.min(100, Math.round((remain / total) * 100)));
        const stacks = Math.max(1, Math.floor(Number(boost.stacks || 1)));
        const uses = boost.remainingUses !== undefined ? ` | uses left ${boost.remainingUses}` : "";
        row.innerHTML = `
          <div class="row-head"><strong>${boost.name || boost.itemId}</strong><span>${fmtDur(remain)}</span></div>
          <div class="row-meta">${boost.type}${boost.value ? ` ${Math.round(boost.value * 100)}%` : ""} | stacks ${stacks}${uses}</div>
          <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
        `;
        dom.activeBoostList.appendChild(row);
      });
    }

    const mods = getModifiers(now);
    dom.effectiveModsText.textContent = `Effective: payout x${mods.payoutMult.toFixed(2)}, passive x${mods.passiveIncomeMultiplier.toFixed(2)}, duration x${mods.durationMult.toFixed(2)}, shop x${(mods.shopDiscountFactor || 1).toFixed(2)}`;
  }

  function renderOrders(now) {
    updateOrderStatuses(now);
    const orders = hasServerSession() && serverOrders.length
      ? [...serverOrders].sort((a, b) => b.createdAt - a.createdAt)
      : Object.values(state.orders).sort((a, b) => b.createdAt - a.createdAt);
    dom.ordersList.innerHTML = "";

    if (!orders.length) {
      dom.ordersList.innerHTML = "<p class='hint'>No orders yet. Buy items in Store.</p>";
      dom.trackPanel.innerHTML = "<p class='hint'>Select an order to track.</p>";
      return;
    }

    if (!selectedTrackOrderId) selectedTrackOrderId = orders[0].orderId || orders[0].id;

    orders.forEach((order) => {
      const status = deriveOrderStatus(order, now);
      const statusClass = String(status).replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
      const row = document.createElement("div");
      row.className = "item-row";
      const orderId = order.orderId || order.id;
      const shortId = String(orderId).slice(-8).toUpperCase();
      const safeItems = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = safeItems.length
        ? safeItems.map((it) => `${it?.name || it?.itemId || "Item"} x${it?.qty || 1}`).join(", ")
        : "No item details";

      row.innerHTML = `
        <div class="row-head">
          <strong>Order #${shortId}</strong>
          <span class="badge ${statusClass}">${statusBadge(status)}</span>
        </div>
        <div class="row-meta">${order.carrier || "MegaShip"} • ${order.trackingId || order.trackingNumber}</div>
        <div class="row-meta">Created: ${fmtTs(order.createdAt)} | ETA: ${fmtTs(order.etaAt || order.estimatedDeliveryAt)}</div>
        <div class="row-meta">${itemsSummary}</div>
      `;

      const actions = document.createElement("div");
      actions.className = "top-actions";

      const trackBtn = document.createElement("button");
      trackBtn.className = "btn secondary";
      trackBtn.textContent = "Track";
      trackBtn.onclick = () => {
        selectedTrackOrderId = orderId;
        render();
      };
      actions.appendChild(trackBtn);

      const canClaimLocal = !hasServerSession() && status === "Delivered" && !order.deliveredClaimedToInventory;
      if (canClaimLocal) {
        const claimBtn = document.createElement("button");
        claimBtn.className = "btn";
        claimBtn.textContent = "Claim Items";
        claimBtn.onclick = () => claimDeliveredOrder(orderId);
        actions.appendChild(claimBtn);
      } else if (!hasServerSession() && status === "Delivered" && order.deliveredClaimedToInventory) {
        const claimedBtn = document.createElement("button");
        claimedBtn.className = "btn secondary";
        claimedBtn.textContent = "Claimed";
        claimedBtn.disabled = true;
        actions.appendChild(claimedBtn);
      }

      row.appendChild(actions);
      dom.ordersList.appendChild(row);
    });

    const selected = orders.find((o) => (o.orderId || o.id) === selectedTrackOrderId) || orders[0];
    if (!selected) {
      dom.trackPanel.innerHTML = "<p class='hint'>Select an order to track.</p>";
      return;
    }
    selectedTrackOrderId = selected.orderId || selected.id;

    const status = deriveOrderStatus(selected, now);
    const stepIndex = status === "Processing" ? 1 : status === "Shipped" ? 2 : status === "OutForDelivery" ? 3 : 4;
    const progress = Math.round((stepIndex / 4) * 100);
    const countdown = status === "Delivered" ? "Delivered" : fmtDur((selected.etaAt || selected.deliveredAt) - now);

    dom.trackPanel.innerHTML = `
      <p><strong>${selected.carrier || "MegaShip"} ${selected.trackingId || selected.trackingNumber || "No Tracking"}</strong></p>
      <p class="row-meta">Order total: ${fmtMoney(Number(selected.total || 0))} | Created: ${fmtTs(selected.createdAt)}</p>
      <p class="row-meta">ETA: ${fmtTs(selected.etaAt || selected.estimatedDeliveryAt)}</p>
      <div class="progress-wrap"><div class="progress-bar" style="width:${progress}%"></div></div>
      <p class="row-meta">Status: ${statusBadge(status)} | Countdown: ${countdown}${selected.deliveredClaimedToInventory ? " | Claimed to inventory" : ""}</p>
      <ol class="timeline">
        ${(selected.timeline || []).map((t) => `<li>${statusBadge(t.status)}: ${fmtTs(t.at)}</li>`).join("") || `
        <li>Order placed: ${fmtTs(selected.createdAt)}</li>
        <li>Shipped: ${fmtTs(selected.shippedAt)}</li>
        <li>Out for delivery: ${fmtTs(selected.outForDeliveryAt)}</li>
        <li>Delivered: ${fmtTs(selected.deliveredAt)}</li>`}
      </ol>
    `;
    if (!hasServerSession() && status === "Delivered" && !selected.deliveredClaimedToInventory) {
      const claimBtn = document.createElement("button");
      claimBtn.className = "btn";
      claimBtn.textContent = "Claim Items";
      claimBtn.onclick = () => claimDeliveredOrder(selectedTrackOrderId);
      dom.trackPanel.appendChild(claimBtn);
    }
  }

  function renderLog() {
    dom.txLog.innerHTML = "";
    state.txLog.slice(0, 10).forEach((tx) => {
      const li = document.createElement("li");
      const sign = tx.amount >= 0 ? "+" : "-";
      li.textContent = `${new Date(tx.ts).toLocaleTimeString()} | ${tx.type} | ${sign}${fmtMoney(Math.abs(tx.amount))}`;
      dom.txLog.appendChild(li);
    });
  }

  function render() {
    const now = Date.now();

    animateBalance(state.bankBalance);

    dom.levelText.textContent = `Lvl ${state.bankLevel}`;
    const threshold = state.bankLevel * XP_PER_LEVEL_BASE;
    dom.xpText.textContent = `XP ${state.bankXP} / ${threshold}`;
    dom.repText.textContent = `Rep ${state.reputation}`;
    dom.xpBar.style.width = `${Math.min(100, Math.round((state.bankXP / threshold) * 100))}%`;

    const dailyReady = !state.lastDailyBonusAt || now - state.lastDailyBonusAt >= 24 * 60 * 60 * 1000;
    dom.dailyBtn.disabled = !dailyReady;
    dom.dailyStatus.textContent = dailyReady ? "Daily ready" : `Ready in ${fmtDur((24 * 60 * 60 * 1000) - (now - state.lastDailyBonusAt))}`;

    const interestReady = !state.lastInterestAt || now - state.lastInterestAt >= 60 * 60 * 1000;
    dom.interestBtn.disabled = !interestReady;
    dom.interestStatus.textContent = interestReady ? "Interest ready" : `Ready in ${fmtDur((60 * 60 * 1000) - (now - state.lastInterestAt))}`;

    renderMainJob(now);
    renderQuick(now);
    renderOpportunity(now);
    renderSpend(now);
    renderStore();
    renderInventory(now);
    renderOrders(now);
    renderSocialSections();
    renderLog();
  }

  function tick1s() {
    const now = Date.now();
    let shouldSave = false;
    if (state.streakWindowUntil && now > state.streakWindowUntil) {
      state.mainStreak = 0;
      state.streakWindowUntil = null;
      shouldSave = true;
    }
    if (processPassiveIncome()) {
      shouldSave = true;
    }
    if (shouldSave) {
      saveState();
    }
    render();
  }

  function tick30s() {
    opportunityCheck();
    if (hasServerSession()) refreshServerOrders();
    const now = Date.now();
    if (now - lastBoostCleanupAt >= 5 * 60 * 1000) {
      lastBoostCleanupAt = now;
      removeExpiredBoosts(now);
      if (firebaseReady && currentUid) {
        cleanupExpiredCloudBoosts(now).catch(() => {});
      }
    }
    saveState();
    render();
  }

  function tick12s() {
    if (hasServerSession()) {
      refreshRotatingShop(true).then(() => render());
    }
  }

  function setActiveTab(name) {
    const tabs = {
      bank: [dom.tabBankBtn, dom.bankTab],
      spend: [dom.tabSpendBtn, dom.spendTab],
      store: [dom.tabStoreBtn, dom.storeTab],
      inventory: [dom.tabInventoryBtn, dom.inventoryTab],
      orders: [dom.tabOrdersBtn, dom.ordersTab],
      friends: [dom.tabFriendsBtn, dom.friendsTab],
      trade: [dom.tabTradeBtn, dom.tradeTab],
      send: [dom.tabSendBtn, dom.sendTab]
    };

    for (const [key, [btn, panel]] of Object.entries(tabs)) {
      btn.classList.toggle("active", key === name);
      panel.classList.toggle("hidden", key !== name);
    }
  }

  function setBusinessTab(name) {
    activeBusinessTab = name;
    const tabs = {
      businesses: [dom.bizTabBusinessesBtn, dom.bizPanelBusinesses],
      upgrades: [dom.bizTabUpgradesBtn, dom.bizPanelUpgrades],
      managers: [dom.bizTabManagersBtn, dom.bizPanelManagers],
      stats: [dom.bizTabStatsBtn, dom.bizPanelStats]
    };
    for (const [key, [btn, panel]] of Object.entries(tabs)) {
      if (btn) btn.classList.toggle("active", key === name);
      if (panel) panel.classList.toggle("hidden", key !== name);
    }
  }

  function resetSave() {
    if (!confirm("Reset all progress?")) return;
    localStorage.removeItem(STORAGE_KEY);
    if (localAuthMode) localStorage.removeItem(LOCAL_USER_KEY);
    location.reload();
  }

  function wire() {
    dom.tabBankBtn.onclick = () => setActiveTab("bank");
    dom.tabSpendBtn.onclick = () => setActiveTab("spend");
    dom.tabStoreBtn.onclick = () => setActiveTab("store");
    dom.tabInventoryBtn.onclick = () => setActiveTab("inventory");
    dom.tabOrdersBtn.onclick = () => setActiveTab("orders");
    dom.tabFriendsBtn.onclick = () => setActiveTab("friends");
    dom.tabTradeBtn.onclick = () => setActiveTab("trade");
    dom.tabSendBtn.onclick = () => setActiveTab("send");
    dom.bizTabBusinessesBtn.onclick = () => setBusinessTab("businesses");
    dom.bizTabUpgradesBtn.onclick = () => setBusinessTab("upgrades");
    dom.bizTabManagersBtn.onclick = () => setBusinessTab("managers");
    dom.bizTabStatsBtn.onclick = () => setBusinessTab("stats");

    dom.claimMainJobBtn.onclick = claimMainJob;
    dom.claimQuickTaskBtn.onclick = claimQuickTask;
    dom.acceptOpportunityBtn.onclick = acceptOpportunity;

    dom.dailyBtn.onclick = claimDailyBonus;
    dom.interestBtn.onclick = applyInterest;

    dom.buyTrainingBtn.onclick = buyTrainingPoint;
    dom.buyParallelUpgradeBtn.onclick = buyParallelUpgrade;
    dom.restartBusinessesBtn.onclick = restartAllBusinesses;
    dom.coinFlipBtn.onclick = coinFlip;
    dom.trackingSearchBtn.onclick = trackOrderByTrackingId;
    dom.friendSearchBtn.onclick = () => { runFriendSearch().catch((e) => toast(e.message || "Search failed.")); };
    dom.friendSearchInput.onkeydown = (e) => { if (e.key === "Enter") dom.friendSearchBtn.click(); };
    dom.sendMoneyBtn.onclick = async () => {
      try {
        await sendMoney(dom.sendFriendSelect.value, dom.sendAmountInput.value, dom.sendNoteInput.value);
        toast("Money sent.");
      } catch (e) {
        toast(e.message || "Send failed.");
      }
    };
    dom.createTradeBtn.onclick = async () => {
      try {
        await createTrade(
          dom.tradeFriendSelect.value,
          { money: dom.tradeOfferMoneyInput.value, items: parseItemMap(dom.tradeOfferItemsInput.value) },
          { money: dom.tradeRequestMoneyInput.value, items: parseItemMap(dom.tradeRequestItemsInput.value) }
        );
        toast("Trade offer created.");
      } catch (e) {
        toast(e.message || "Trade failed.");
      }
    };

    dom.saveNowBtn.onclick = () => {
      saveState();
      if (!localAuthMode) flushCloudSave();
      toast("Save requested.");
    };

    dom.resetSaveBtn.onclick = resetSave;
  }

  function startGame() {
    const now = Date.now();

    if (!state.quickTaskWindowResetAt) state.quickTaskWindowResetAt = now + QUICK_WINDOW_MS;
    if (!state.nextOpportunityCheckAt) state.nextOpportunityCheckAt = now + randInt(5 * 60 * 1000, 10 * 60 * 1000);

    opportunityCheck();
    removeExpiredBoosts(now);
    if (firebaseReady && currentUid) {
      cleanupExpiredCloudBoosts(now).catch(() => {});
    }
    processPassiveIncome();
    if (hasServerSession()) {
      refreshRotatingShop(true);
      refreshServerOrders();
    }

    wire();
    setActiveTab("bank");
    setBusinessTab(activeBusinessTab);
    render();

    tick1sHandle = setInterval(tick1s, 1000);
    tick12sHandle = setInterval(tick12s, 12000);
    tick30sHandle = setInterval(tick30s, 30000);
    gameStarted = true;
  }

  async function init() {
    showAuthScreen();
    bindAuthEvents();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPendingSavesNow();
    });
    window.addEventListener("pagehide", flushPendingSavesNow);
    window.addEventListener("beforeunload", flushPendingSavesNow);
    setSaveStatus("saved", "local");
    const rememberedUsername = localStorage.getItem("server_shop_username") || "";
    const rememberedPassword = sessionStorage.getItem("server_shop_password") || "";
    if (rememberedUsername && rememberedPassword) {
      setServerSession(rememberedUsername, rememberedPassword);
    }

    await initFirebaseServices();

    if (!firebaseReady) {
      const savedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUser) {
        localAuthMode = true;
        await handleAuthState({ uid: `local_${savedUser}`, email: `${savedUser}@local.test` });
      }
      return;
    }

    if (localAuthMode) {
      const savedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUser) {
        await handleAuthState({ uid: `local_${savedUser}`, email: `${savedUser}@local.test` });
      }
      return;
    }

    if (!firebaseReady) return;

    firebaseApi.onAuthStateChanged(auth, handleAuthState);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushCloudSave();
    });
    window.addEventListener("beforeunload", () => {
      flushCloudSave();
    });
  }

  init();
})();
