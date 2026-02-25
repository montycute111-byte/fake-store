const DB_KEY = "megacart_accounts_v1";
const LISTINGS_CACHE_KEY = "megacart_listings_cache_v1";
const firebaseConfig = {
  apiKey: "AIzaSyDScVaJ4oPh_XcYUqafoz0v1o3KgQeRclU",
  authDomain: "fakestoresim.firebaseapp.com",
  projectId: "fakestoresim",
  storageBucket: "fakestoresim.firebasestorage.app",
  messagingSenderId: "475969514502",
  appId: "1:475969514502:web:fc9dba8fde83fb6398a787",
  measurementId: "G-K1Q2861LZG"
};
const GUEST_USER_ID_KEY = "megacart_guest_user_id_v1";
const DEMO_LISTING_IDS = new Set(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"]);
const DEMO_LISTING_TITLES = new Set([
  "Nimbus Noise-Canceling Cloud Headphones",
  "Self-Stirring Galaxy Coffee Mug",
  "Quantum Speed Running Shoes",
  "AI-Powered Desk Plant (Never Dies)",
  "Retro Arcade Mini Console",
  "Levitating LED Night Orb",
  "Titan Backpack of Endless Pockets",
  "PixelChef Smart Air Fryer",
  "UltraSoft Nebula Blanket",
  "HoverPen Pro Stylus",
  "Reserve Oak Barrel Collector Set"
]);

const SEED_PRODUCTS = [];

const db = loadDb();
ensureRoninAccount();
enforceRoninPassword();
purgeDemoListingsForAllAccountsOnce();
let activeTab = "store";
let activeListingId = null;
let fundTimerIntervalId = null;
let deliveryPopupQueue = [];
const AGE_ID_PRICE = 75;
const SELL_TAX_RATE = 0.05;
const SELL_CAP = 50000;
const MYTHIC_SELL_COOLDOWN_MS = 2 * 60 * 1000;
const REWARD5_MIN_COOLDOWN_MS = 5 * 60 * 1000;
const REWARD5_MIN_DAILY_CAP = 1200;
const REWARD5_MIN_TIERS = [
  { key: "common", min: 5, max: 15, weight: 55 },
  { key: "uncommon", min: 16, max: 35, weight: 25 },
  { key: "rare", min: 36, max: 70, weight: 12 },
  { key: "epic", min: 71, max: 120, weight: 6 },
  { key: "legendary", min: 121, max: 250, weight: 2 }
];
const JOB_DAILY_EARNINGS_CAP = 1000;
const JOB_CLAIM_COOLDOWN_MS = 10 * 60 * 1000;
const JOB_MIN_DURATION_MINUTES = 2;
const JOB_MAX_DURATION_MINUTES = 30;
const JOB_MIN_PAYOUT = 20;
const JOB_MAX_PAYOUT = 400;
const P2P_DAILY_CAP = 3000;
const P2P_TX_CAP = 1000;
const P2P_COOLDOWN_MS = 30 * 1000;
const TRADE_MONEY_CAP = 2000;
const TRADE_MAX_ITEMS_PER_SIDE = 20;
const TRADE_EXPIRE_MS = 24 * 60 * 60 * 1000;
const AUTO_CATALOG_MIN_ITEMS = 40;
const AUTO_CATALOG_MAX_ITEMS = 80;
const AUTO_CATALOG_LOCAL_CONFIG_KEY = "megacart_auto_catalog_config_v1";
const AUTO_CATALOG_DEFAULT_ENABLED = true;
const AUTO_CATALOG_AI_IMAGES_DEFAULT_ENABLED = true;
const AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT = 40;
const AUTO_CATALOG_RARITY_WEIGHTS = [
  { key: "common", weight: 70 },
  { key: "uncommon", weight: 20 },
  { key: "rare", weight: 8 },
  { key: "epic", weight: 1.8 },
  { key: "legendary", weight: 0.2 }
];
const AUTO_CATALOG_RARITY_RULES = {
  common: { priceMin: 10, priceMax: 60, stockMin: 30, stockMax: 200, ratingMin: 3.2, ratingMax: 4.4, reviewsMin: 800, reviewsMax: 5000 },
  uncommon: { priceMin: 40, priceMax: 140, stockMin: 15, stockMax: 90, ratingMin: 3.6, ratingMax: 4.6, reviewsMin: 300, reviewsMax: 2200 },
  rare: { priceMin: 120, priceMax: 300, stockMin: 5, stockMax: 30, ratingMin: 3.9, ratingMax: 4.8, reviewsMin: 80, reviewsMax: 900 },
  epic: { priceMin: 250, priceMax: 600, stockMin: 2, stockMax: 10, ratingMin: 4.2, ratingMax: 4.9, reviewsMin: 20, reviewsMax: 240 },
  legendary: { priceMin: 500, priceMax: 1200, stockMin: 1, stockMax: 3, ratingMin: 4.5, ratingMax: 5.0, reviewsMin: 5, reviewsMax: 80 }
};
const AUTO_CATALOG_MODEL_NAMES = ["X2", "Pro", "Lite", "Max", "S", "Ultra", "Prime", "Flex"];
const AUTO_CATALOG_FAKE_BRAND_SYLLABLES = {
  first: ["No", "Ae", "Kly", "Bri", "Van", "So", "Lu", "Ze", "Tri", "Mer", "Cal", "Ora", "Dri", "Nex", "Vel", "Ar"],
  middle: ["va", "ro", "na", "ly", "mi", "to", "ra", "zi", "lo", "ne", "ta", "ri", "sa", "vo", "ke", "no"],
  last: ["ra", "za", "na", "ro", "ta", "va", "la", "ry", "nix", "nest", "line", "core", "nova", "rise", "craft", "wave"]
};
const AUTO_CATALOG_CATEGORY_TEMPLATES = {
  Tech: {
    imageKey: "tech",
    productTypes: ["Earbuds", "Mechanical Keyboard", "USB-C Charger", "Smart Light Kit", "Webcam", "Laptop Stand"],
    descriptors: ["Wireless", "Low-Latency", "Compact", "Fast-Charge", "AI Focus", "Noise Shield", "Desk-Ready", "Portable"],
    featurePool: ["Bluetooth 5.3", "USB-C power delivery", "Low-latency connection", "Foldable build", "Touch controls", "Quick-pair setup", "Cable included", "Multi-device support"],
    descriptionPool: [
      "Built for daily setup upgrades with reliable performance and quick setup.",
      "Designed for smooth everyday use with clean controls and stable output."
    ]
  },
  Home: {
    imageKey: "home",
    productTypes: ["Cozy Blanket", "Table Lamp", "Storage Bin Set", "Air Fryer", "Closet Organizer", "Kitchen Rack"],
    descriptors: ["Space-Saving", "Soft-Touch", "Warm Glow", "Stackable", "Quiet", "Modern", "Easy-Clean", "Family Size"],
    featurePool: ["Simple setup", "Wipe-clean finish", "Compact footprint", "Durable shell", "Low-noise operation", "Heat-safe materials", "Easy carry handles", "Fits small spaces"],
    descriptionPool: [
      "A practical home essential made for busy routines and clean spaces.",
      "Built to improve daily comfort with a tidy look and simple controls."
    ]
  },
  Beauty: {
    imageKey: "beauty",
    productTypes: ["Hydration Lotion", "Skincare Set", "Dryer Brush", "Nail Kit", "Face Roller", "Travel Vanity Kit"],
    descriptors: ["Glow", "Hydra", "Smooth", "Soft Finish", "Salon", "Gentle", "Daily Care", "Quick Style"],
    featurePool: ["Travel-ready case", "Gentle daily use", "Lightweight design", "Easy-grip handle", "Fast heat-up", "Soft-touch finish", "Simple cleaning", "Includes starter accessories"],
    descriptionPool: [
      "Made for simple daily routines with smooth results and easy handling.",
      "A lightweight beauty pick that fits morning and evening routines."
    ]
  },
  Fitness: {
    imageKey: "fitness",
    productTypes: ["Resistance Band Set", "Shaker Bottle", "Yoga Mat", "Massage Device", "Training Rope", "Core Slider Kit"],
    descriptors: ["Power", "Flex", "Active", "Recovery", "Grip", "Studio", "Endurance", "Move"],
    featurePool: ["Sweat-resistant finish", "Portable carry bag", "Grip-safe texture", "Quick-rinse cleaning", "Compact storage", "Workout guide card", "Stable support", "Daily training ready"],
    descriptionPool: [
      "Built for home or gym sessions with reliable grip and easy transport.",
      "Helps keep workouts consistent with practical features and durable materials."
    ]
  },
  Gaming: {
    imageKey: "gaming",
    productTypes: ["Controller Grip Kit", "Mouse Pad", "Headset Stand", "Desk RGB Strip", "Trigger Caps", "Cable Bungee"],
    descriptors: ["Pro Play", "Arena", "Speed", "Precision", "Night Mode", "Ultra Glide", "Steady Aim", "Desk Sync"],
    featurePool: ["Non-slip base", "Low-friction surface", "Cable management slot", "Desk-friendly size", "Quick install", "Stable frame", "Color mode presets", "Scratch-resistant coating"],
    descriptionPool: [
      "Designed to keep your setup clean, responsive, and ready for long sessions.",
      "A setup upgrade focused on control, comfort, and stable play."
    ]
  }
};
const AUTO_CATALOG_IMAGE_FILES = {
  tech: ["tech-01.svg", "tech-02.svg", "tech-03.svg", "tech-04.svg", "tech-05.svg", "tech-06.svg"],
  home: ["home-01.svg", "home-02.svg", "home-03.svg", "home-04.svg", "home-05.svg", "home-06.svg"],
  beauty: ["beauty-01.svg", "beauty-02.svg", "beauty-03.svg", "beauty-04.svg", "beauty-05.svg", "beauty-06.svg"],
  fitness: ["fitness-01.svg", "fitness-02.svg", "fitness-03.svg", "fitness-04.svg", "fitness-05.svg", "fitness-06.svg"],
  gaming: ["gaming-01.svg", "gaming-02.svg", "gaming-03.svg", "gaming-04.svg", "gaming-05.svg", "gaming-06.svg"]
};
const JOB_POOL = [
  { title: "Stock Shelf Reset", description: "Re-organize incoming items and reset shelf labels." },
  { title: "Package Scan Shift", description: "Scan outgoing packages and verify tracking IDs." },
  { title: "Cart Recovery Calls", description: "Contact shoppers who abandoned carts and offer support." },
  { title: "Returns Processing", description: "Inspect return requests and restock valid inventory." },
  { title: "Warehouse Sweep", description: "Audit aisle locations and clean pick-paths for speed." },
  { title: "Priority Packing", description: "Pack express orders with fragile-safe wrapping." },
  { title: "Listing Quality Check", description: "Review listing details and image quality for trust." },
  { title: "Support Desk Queue", description: "Answer customer messages and resolve delivery issues." },
  { title: "Price Tag Update", description: "Apply dynamic price tags based on market trends." },
  { title: "Night Cycle Inventory", description: "Count overnight stock and reconcile differences." },
  { title: "Fraud Flag Review", description: "Inspect suspicious orders and clear valid transactions." },
  { title: "Driver Dispatch Assist", description: "Assign routes and confirm pickup readiness." }
];
let firestoreDb = null;
let firestoreUnsubscribeListings = null;
let listingsRefreshIntervalId = null;
let friendsState = {
  friendships: [],
  usersById: {}
};
let tradesState = {
  trades: []
};
let activeFriendsSubtab = "search";
let sendMoneyTargetUid = null;
let activeTradeEditId = null;

const ui = {
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  productGrid: document.querySelector("#productGrid"),
  cartItems: document.querySelector("#cartItems"),
  cartCount: document.querySelector("#cartCount"),
  summaryItems: document.querySelector("#summaryItems"),
  summaryTotal: document.querySelector("#summaryTotal"),
  checkoutBtn: document.querySelector("#checkoutBtn"),
  checkoutMsg: document.querySelector("#checkoutMsg"),
  clearCartBtn: document.querySelector("#clearCartBtn"),
  ordersList: document.querySelector("#ordersList"),
  cartPanel: document.querySelector("#cartPanel"),
  cartToggle: document.querySelector("#cartToggle"),
  walletBalance: document.querySelector("#walletBalance"),
  openCreditsBtn: document.querySelector("#openCreditsBtn"),
  accountLabel: document.querySelector("#accountLabel"),
  logoutBtn: document.querySelector("#logoutBtn"),
  authModal: document.querySelector("#authModal"),
  authMsg: document.querySelector("#authMsg"),
  signupForm: document.querySelector("#signupForm"),
  loginForm: document.querySelector("#loginForm"),
  storeTabBtn: document.querySelector("#storeTabBtn"),
  creditsTabBtn: document.querySelector("#creditsTabBtn"),
  collectionTabBtn: document.querySelector("#collectionTabBtn"),
  trackingTabBtn: document.querySelector("#trackingTabBtn"),
  jobsTabBtn: document.querySelector("#jobsTabBtn"),
  statsTabBtn: document.querySelector("#statsTabBtn"),
  friendsTabBtn: document.querySelector("#friendsTabBtn"),
  tradesTabBtn: document.querySelector("#tradesTabBtn"),
  storeView: document.querySelector("#storeView"),
  storefrontContent: document.querySelector("#storefrontContent"),
  listingPreview: document.querySelector("#listingPreview"),
  closePreviewBtn: document.querySelector("#closePreviewBtn"),
  previewImage: document.querySelector("#previewImage"),
  previewTitle: document.querySelector("#previewTitle"),
  previewMeta: document.querySelector("#previewMeta"),
  previewPrice: document.querySelector("#previewPrice"),
  previewDescription: document.querySelector("#previewDescription"),
  previewFeatures: document.querySelector("#previewFeatures"),
  previewAddToCartBtn: document.querySelector("#previewAddToCartBtn"),
  previewReviewsList: document.querySelector("#previewReviewsList"),
  previewReviewForm: document.querySelector("#previewReviewForm"),
  previewReviewMsg: document.querySelector("#previewReviewMsg"),
  creditsView: document.querySelector("#creditsView"),
  collectionView: document.querySelector("#collectionView"),
  collectionGrid: document.querySelector("#collectionGrid"),
  trackingView: document.querySelector("#trackingView"),
  trackingList: document.querySelector("#trackingList"),
  jobsView: document.querySelector("#jobsView"),
  jobsActiveCard: document.querySelector("#jobsActiveCard"),
  jobsMeta: document.querySelector("#jobsMeta"),
  jobsMsg: document.querySelector("#jobsMsg"),
  jobsList: document.querySelector("#jobsList"),
  statsView: document.querySelector("#statsView"),
  friendsView: document.querySelector("#friendsView"),
  tradesView: document.querySelector("#tradesView"),
  syncStatusMsg: document.querySelector("#syncStatusMsg"),
  statsEarned: document.querySelector("#statsEarned"),
  statsSpent: document.querySelector("#statsSpent"),
  friendsSearchTabBtn: document.querySelector("#friendsSearchTabBtn"),
  friendsRequestsTabBtn: document.querySelector("#friendsRequestsTabBtn"),
  friendsListTabBtn: document.querySelector("#friendsListTabBtn"),
  friendsBlockedTabBtn: document.querySelector("#friendsBlockedTabBtn"),
  friendsSearchPanel: document.querySelector("#friendsSearchPanel"),
  friendsRequestsPanel: document.querySelector("#friendsRequestsPanel"),
  friendsListPanel: document.querySelector("#friendsListPanel"),
  friendsBlockedPanel: document.querySelector("#friendsBlockedPanel"),
  friendsMsg: document.querySelector("#friendsMsg"),
  friendSearchInput: document.querySelector("#friendSearchInput"),
  friendSearchBtn: document.querySelector("#friendSearchBtn"),
  friendSearchResults: document.querySelector("#friendSearchResults"),
  friendIncomingList: document.querySelector("#friendIncomingList"),
  friendOutgoingList: document.querySelector("#friendOutgoingList"),
  friendsList: document.querySelector("#friendsList"),
  friendsBlockedList: document.querySelector("#friendsBlockedList"),
  tradesMsg: document.querySelector("#tradesMsg"),
  newTradeFriendSelect: document.querySelector("#newTradeFriendSelect"),
  newTradeMoneyInput: document.querySelector("#newTradeMoneyInput"),
  newTradeInventoryList: document.querySelector("#newTradeInventoryList"),
  createTradeBtn: document.querySelector("#createTradeBtn"),
  myTradesList: document.querySelector("#myTradesList"),
  tradeEditPanel: document.querySelector("#tradeEditPanel"),
  tradeEditMeta: document.querySelector("#tradeEditMeta"),
  tradeEditMoneyInput: document.querySelector("#tradeEditMoneyInput"),
  tradeEditInventoryList: document.querySelector("#tradeEditInventoryList"),
  saveTradeOfferBtn: document.querySelector("#saveTradeOfferBtn"),
  sendMoneyModal: document.querySelector("#sendMoneyModal"),
  sendMoneyTarget: document.querySelector("#sendMoneyTarget"),
  sendMoneyAmountInput: document.querySelector("#sendMoneyAmountInput"),
  sendMoneyNoteInput: document.querySelector("#sendMoneyNoteInput"),
  sendMoneyConfirmBtn: document.querySelector("#sendMoneyConfirmBtn"),
  sendMoneyCancelBtn: document.querySelector("#sendMoneyCancelBtn"),
  sendMoneyMsg: document.querySelector("#sendMoneyMsg"),
  creditsUserLabel: document.querySelector("#creditsUserLabel"),
  creditsBalance: document.querySelector("#creditsBalance"),
  creditsMsg: document.querySelector("#creditsMsg"),
  reward5minStatus: document.querySelector("#reward5minStatus"),
  reward5minCountdown: document.querySelector("#reward5minCountdown"),
  reward5minClaimBtn: document.querySelector("#reward5minClaimBtn"),
  reward5minLast: document.querySelector("#reward5minLast"),
  reward5minToday: document.querySelector("#reward5minToday"),
  idStatus: document.querySelector("#idStatus"),
  buyIdBtn: document.querySelector("#buyIdBtn"),
  adminPanel: document.querySelector("#adminPanel"),
  adminAddForm: document.querySelector("#adminAddForm"),
  adminAddBtn: document.querySelector("#adminAddBtn"),
  adminListings: document.querySelector("#adminListings"),
  adminOrders: document.querySelector("#adminOrders"),
  adminMsg: document.querySelector("#adminMsg"),
  adminAutoCatalogToggle: document.querySelector("#adminAutoCatalogToggle"),
  adminAiImagesToggle: document.querySelector("#adminAiImagesToggle"),
  adminAiImageDailyLimitInput: document.querySelector("#adminAiImageDailyLimitInput"),
  adminGenerateTodayBtn: document.querySelector("#adminGenerateTodayBtn"),
  adminAutoCatalogStatus: document.querySelector("#adminAutoCatalogStatus"),
  deliveryPopup: document.querySelector("#deliveryPopup"),
  deliveryPopupImage: document.querySelector("#deliveryPopupImage"),
  deliveryPopupText: document.querySelector("#deliveryPopupText"),
  deliveryPopupClose: document.querySelector("#deliveryPopupClose")
};

init();

function init() {
  ensureActiveShopperSession();
  hydrateCatalogFromLocalCache();
  populateCategories();
  bindEvents();
  startFundTimerTicker();
  renderAll();
  initializeGlobalListingSync();
  refreshFriendsData().catch(() => {});
  refreshTradesData().catch(() => {});
}

function bindEvents() {
  ui.searchInput.addEventListener("input", () => {
    const progress = getProgressOrNull();
    if (!progress) return;
    progress.search = ui.searchInput.value.trim();
    persistDb();
    renderProducts();
  });

  ui.categoryFilter.addEventListener("change", () => {
    const progress = getProgressOrNull();
    if (!progress) return;
    progress.category = ui.categoryFilter.value;
    persistDb();
    renderProducts();
  });

  ui.sortFilter.addEventListener("change", () => {
    const progress = getProgressOrNull();
    if (!progress) return;
    progress.sort = ui.sortFilter.value;
    persistDb();
    renderProducts();
  });

  ui.checkoutBtn.addEventListener("click", checkout);
  ui.clearCartBtn.addEventListener("click", clearCart);

  ui.cartToggle.addEventListener("click", () => {
    ui.cartPanel.classList.toggle("hidden");
  });

  ui.openCreditsBtn.addEventListener("click", () => {
    switchTab("credits");
  });

  ui.storeTabBtn.addEventListener("click", () => {
    switchTab("store");
  });

  ui.creditsTabBtn.addEventListener("click", () => {
    switchTab("credits");
  });
  ui.collectionTabBtn.addEventListener("click", () => {
    switchTab("collection");
  });
  ui.trackingTabBtn.addEventListener("click", () => {
    switchTab("tracking");
  });
  ui.jobsTabBtn.addEventListener("click", () => {
    switchTab("jobs");
  });
  ui.statsTabBtn.addEventListener("click", () => {
    switchTab("stats");
  });
  ui.friendsTabBtn.addEventListener("click", () => {
    switchTab("friends");
  });
  ui.tradesTabBtn.addEventListener("click", () => {
    switchTab("trades");
  });

  ui.reward5minClaimBtn.addEventListener("click", handleClaim5MinReward);
  if (ui.buyIdBtn) {
    ui.buyIdBtn.addEventListener("click", handleBuyAgeId);
  }

  ui.closePreviewBtn.addEventListener("click", closeListingPreview);
  ui.previewAddToCartBtn.addEventListener("click", () => {
    if (activeListingId) {
      addToCart(activeListingId);
    }
  });
  ui.previewReviewForm.addEventListener("submit", handlePreviewReviewSubmit);
  if (ui.adminAddForm) {
    ui.adminAddForm.addEventListener("submit", handleAdminAdd);
  }
  if (ui.adminAutoCatalogToggle) {
    ui.adminAutoCatalogToggle.addEventListener("change", handleAdminAutoCatalogToggle);
  }
  if (ui.adminAiImagesToggle) {
    ui.adminAiImagesToggle.addEventListener("change", handleAdminAiImagesToggle);
  }
  if (ui.adminAiImageDailyLimitInput) {
    ui.adminAiImageDailyLimitInput.addEventListener("change", handleAdminAiImageDailyLimitChange);
  }
  if (ui.adminGenerateTodayBtn) {
    ui.adminGenerateTodayBtn.addEventListener("click", handleAdminGenerateTodayNow);
  }
  if (ui.friendsSearchTabBtn) {
    ui.friendsSearchTabBtn.addEventListener("click", () => setFriendsSubtab("search"));
    ui.friendsRequestsTabBtn.addEventListener("click", () => setFriendsSubtab("requests"));
    ui.friendsListTabBtn.addEventListener("click", () => setFriendsSubtab("friends"));
    ui.friendsBlockedTabBtn.addEventListener("click", () => setFriendsSubtab("blocked"));
  }
  if (ui.friendSearchBtn) {
    ui.friendSearchBtn.addEventListener("click", handleFriendSearch);
  }
  if (ui.friendSearchInput) {
    ui.friendSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleFriendSearch();
      }
    });
  }
  if (ui.createTradeBtn) {
    ui.createTradeBtn.addEventListener("click", handleCreateTrade);
  }
  if (ui.saveTradeOfferBtn) {
    ui.saveTradeOfferBtn.addEventListener("click", handleSaveTradeOffer);
  }
  if (ui.friendsView) {
    ui.friendsView.addEventListener("click", handleFriendsViewClick);
  }
  if (ui.myTradesList) {
    ui.myTradesList.addEventListener("click", handleTradesViewClick);
  }
  if (ui.sendMoneyCancelBtn) {
    ui.sendMoneyCancelBtn.addEventListener("click", closeSendMoneyModal);
  }
  if (ui.sendMoneyConfirmBtn) {
    ui.sendMoneyConfirmBtn.addEventListener("click", handleConfirmSendMoney);
  }
  ui.signupForm.addEventListener("submit", handleSignup);
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.logoutBtn.addEventListener("click", handleLogout);
  ui.accountLabel.addEventListener("click", () => {
    ui.authModal.classList.remove("hidden");
    setAuthMessage("Sign in to switch account.", false);
  });
  ui.deliveryPopupClose.addEventListener("click", hideDeliveryPopup);
  ui.collectionGrid.addEventListener("click", handleCollectionAction);
  ui.jobsList.addEventListener("click", handleJobsAction);
  ui.jobsActiveCard.addEventListener("click", handleJobsAction);
  window.addEventListener("storage", handleStorageSync);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncListingsNow();
    }
  });
  window.addEventListener("focus", () => {
    syncListingsNow();
  });
}

function switchTab(tab) {
  if ((tab === "credits" || tab === "collection" || tab === "tracking" || tab === "jobs" || tab === "stats" || tab === "friends" || tab === "trades") && !ensureSignedIn("Sign in first to continue.")) {
    return;
  }

  activeTab = tab === "credits" || tab === "collection" || tab === "tracking" || tab === "jobs" || tab === "stats" || tab === "friends" || tab === "trades" ? tab : "store";
  if (activeTab === "store") {
    ensureAutoCatalogFresh().catch((error) => {
      console.error("[AutoCatalog] store refresh failed:", error);
    });
  } else if (activeTab === "friends") {
    refreshFriendsData().catch((error) => {
      console.error("[Friends] refresh failed:", error);
    });
  } else if (activeTab === "trades") {
    refreshTradesData().catch((error) => {
      console.error("[Trades] refresh failed:", error);
    });
  }
  if (activeTab !== "store") {
    closeListingPreview();
  }
  renderTabState();
  renderCreditsShop();
  renderCollection();
  renderTracking();
  renderDailyJobs();
  renderStats();
  renderFriends();
  renderTrades();
}

function renderTabState() {
  const storeActive = activeTab === "store";
  const creditsActive = activeTab === "credits";
  const collectionActive = activeTab === "collection";
  const trackingActive = activeTab === "tracking";
  const jobsActive = activeTab === "jobs";
  const statsActive = activeTab === "stats";
  const friendsActive = activeTab === "friends";
  const tradesActive = activeTab === "trades";

  ui.storeView.classList.toggle("hidden", !storeActive);
  ui.creditsView.classList.toggle("hidden", !creditsActive);
  ui.collectionView.classList.toggle("hidden", !collectionActive);
  ui.trackingView.classList.toggle("hidden", !trackingActive);
  ui.jobsView.classList.toggle("hidden", !jobsActive);
  ui.statsView.classList.toggle("hidden", !statsActive);
  ui.friendsView.classList.toggle("hidden", !friendsActive);
  ui.tradesView.classList.toggle("hidden", !tradesActive);
  ui.storeTabBtn.classList.toggle("active", storeActive);
  ui.creditsTabBtn.classList.toggle("active", creditsActive);
  ui.collectionTabBtn.classList.toggle("active", collectionActive);
  ui.trackingTabBtn.classList.toggle("active", trackingActive);
  ui.jobsTabBtn.classList.toggle("active", jobsActive);
  ui.statsTabBtn.classList.toggle("active", statsActive);
  ui.friendsTabBtn.classList.toggle("active", friendsActive);
  ui.tradesTabBtn.classList.toggle("active", tradesActive);
}

function populateCategories() {
  const current = ui.categoryFilter.value || "all";
  const categories = [...new Set(getCatalog().map((product) => product.category))].sort();
  ui.categoryFilter.innerHTML = '<option value="all">All</option>';

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    ui.categoryFilter.append(option);
  }

  ui.categoryFilter.value = categories.includes(current) || current === "all" ? current : "all";
}

function renderAll() {
  renderAuthState();
  populateCategories();
  renderTabState();
  renderWallet();
  renderCreditsShop();
  renderProducts();
  renderCart();
  renderOrders();
  renderListingPreview();
  renderCollection();
  renderTracking();
  renderDailyJobs();
  renderStats();
  renderFriends();
  renderTrades();
  checkForDeliveredItems();
}

function renderAuthState() {
  const user = getCurrentUser();

  if (user) {
    ui.accountLabel.textContent = isGuestUser(user) ? "Guest Shopper (tap to sign in)" : `@${user.username} (tap to switch)`;
    ui.logoutBtn.classList.remove("hidden");
    ui.authModal.classList.add("hidden");
    setAuthMessage("");

    ui.searchInput.value = user.progress.search;
    ui.categoryFilter.value = user.progress.category;
    ui.sortFilter.value = user.progress.sort;
  } else {
    ui.accountLabel.textContent = "Not signed in";
    ui.logoutBtn.classList.add("hidden");
    ui.authModal.classList.remove("hidden");

    ui.searchInput.value = "";
    ui.categoryFilter.value = "all";
    ui.sortFilter.value = "featured";
    activeTab = "store";
    closeListingPreview();
    deliveryPopupQueue = [];
    hideDeliveryPopup();
  }
}

function renderWallet() {
  const progress = getProgressOrNull();
  const balance = progress ? progress.balance : 0;
  ui.walletBalance.textContent = money(balance);
}

function addMoney(amount, reason = "unknown", meta = {}) {
  const progress = getProgressOrNull();
  if (!progress) return 0;
  const safeAmount = round2(Number(amount) || 0);
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) return 0;

  progress.balance = round2((Number(progress.balance) || 0) + safeAmount);
  progress.totalFundsCollected = round2((Number(progress.totalFundsCollected) || 0) + safeAmount);
  if (!Array.isArray(progress.moneyLedger)) {
    progress.moneyLedger = [];
  }
  progress.moneyLedger.unshift({
    id: crypto.randomUUID(),
    amount: safeAmount,
    reason: String(reason || "unknown"),
    createdAt: new Date().toISOString(),
    meta: meta && typeof meta === "object" ? meta : {}
  });
  progress.moneyLedger = progress.moneyLedger.slice(0, 200);
  syncCurrentUserEconomyToFirestore().catch(() => {});
  return safeAmount;
}

async function syncCurrentUserEconomyToFirestore() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  await firestoreDb
    .collection("users")
    .doc(String(user.id))
    .set(
      {
        uid: String(user.id),
        username: String(user.username),
        usernameLower: String(user.username).toLowerCase(),
        balance: round2(Number(user.progress?.balance) || 0),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}

function renderCreditsShop() {
  const user = getCurrentUser();
  if (!user) {
    ui.creditsUserLabel.textContent = "No active account.";
    ui.creditsBalance.textContent = "$0.00";
    ui.reward5minClaimBtn.disabled = true;
    ui.reward5minStatus.textContent = "Sign in to claim.";
    ui.reward5minCountdown.textContent = "Ready";
    ui.reward5minLast.textContent = "Last reward: $0.00";
    ui.reward5minToday.textContent = `Today's 5-min total: $0.00 / ${money(REWARD5_MIN_DAILY_CAP)}`;
    if (ui.buyIdBtn) {
      ui.buyIdBtn.disabled = true;
      ui.buyIdBtn.textContent = `Buy 21+ ID (${money(AGE_ID_PRICE)})`;
    }
    if (ui.idStatus) {
      ui.idStatus.textContent = "Sign in to buy a 21+ ID.";
    }
    ui.adminPanel.classList.add("hidden");
    ui.adminListings.innerHTML = "";
    return;
  }

  ui.creditsUserLabel.textContent = `Signed in as @${user.username}`;
  ui.creditsBalance.textContent = money(Number(user.progress.balance) || 0);
  renderAgeIdShop(user.progress);
  renderFiveMinuteReward(user.progress);

  if (isAdminUser(user)) {
    ui.adminPanel.classList.remove("hidden");
    renderAdminAutoCatalogControls();
    renderAdminListings();
    renderAdminOrders().catch((error) => {
      console.error("[Firestore] admin orders render failed:", error);
    });
  } else {
    ui.adminPanel.classList.add("hidden");
    ui.adminListings.innerHTML = "";
    if (ui.adminOrders) {
      ui.adminOrders.innerHTML = "";
    }
  }

  syncUserOrdersFromFirestore().catch((error) => {
    console.error("[Firestore] user orders sync failed:", error);
  });
}

function renderAgeIdShop(progress) {
  if (!ui.idStatus || !ui.buyIdBtn) return;
  const hasId = Boolean(progress.hasAgeId);
  ui.idStatus.textContent = hasId ? "21+ ID Active. You can buy 21+ items." : "No 21+ ID owned.";
  ui.buyIdBtn.textContent = hasId ? "21+ ID Owned" : `Buy 21+ ID (${money(AGE_ID_PRICE)})`;
  ui.buyIdBtn.disabled = hasId;
}

function startFundTimerTicker() {
  if (fundTimerIntervalId) {
    clearInterval(fundTimerIntervalId);
  }

  fundTimerIntervalId = setInterval(() => {
    const progress = getProgressOrNull();
    if (!progress) return;
    if (activeTab === "credits") {
      renderFiveMinuteReward(progress);
    }
    checkForDeliveredItems();
    if (activeTab === "collection") {
      renderCollection();
    }
    if (activeTab === "tracking") {
      renderTracking();
    }
    if (activeTab === "jobs") {
      renderDailyJobs();
    }
    if (activeTab === "stats") {
      renderStats();
    }
  }, 1000);
}

function renderAdminListings() {
  ui.adminListings.innerHTML = "";
  const catalog = getCatalog();

  for (const product of catalog) {
    const effectiveRating = getEffectiveRating(product);
    const stockLabel = Number.isFinite(Number(product.stock)) ? `Stock ${Math.max(0, Math.floor(Number(product.stock)))}` : "Stock n/a";
    const row = document.createElement("article");
    row.className = "admin-row";
    row.innerHTML = `
      <img src="${product.image}" alt="${product.title}" class="admin-thumb" />
      <div class="admin-row-body">
        <div class="admin-row-head">
          <strong class="admin-title">${product.title}</strong>
          <span class="admin-price">${money(product.price)}</span>
        </div>
        <p class="admin-meta">${product.brand || "NovaGoods"} • ${product.category}${product.ageRestricted ? " • 21+" : ""} • ${stockLabel} • ${product.shippingTime || "Standard shipping"} • Rarity hidden until delivery • Rating ${effectiveRating.toFixed(1)} • @${product.ownerUsername}</p>
        <div class="admin-row-controls">
          <label class="admin-price-input">
            Price
            <input type="number" min="0.01" step="0.01" value="${Number(product.price).toFixed(2)}" />
          </label>
          <button type="button" data-action="price" data-id="${product.id}" class="admin-save-btn">Save Price</button>
          <button type="button" data-action="regen-image" data-id="${product.id}" class="admin-save-btn">Regenerate Image</button>
          <button type="button" data-action="delete" data-id="${product.id}" class="admin-delete-btn">Delete</button>
        </div>
      </div>
    `;
    attachImageFallback(row.querySelector("img"), product.title);

    const input = row.querySelector("input");
    const priceBtn = row.querySelector('[data-action="price"]');
    const regenBtn = row.querySelector('[data-action="regen-image"]');
    const delBtn = row.querySelector('[data-action="delete"]');

    priceBtn.addEventListener("click", () => {
      handleAdminSetPrice(product.id, input.value);
    });
    regenBtn.addEventListener("click", () => {
      handleAdminRegenerateImage(product.id);
    });

    delBtn.addEventListener("click", () => {
      handleAdminDelete(product.id);
    });

    ui.adminListings.append(row);
  }
}

async function renderAdminOrders() {
  if (!ui.adminOrders || !firestoreDb || !isAdminUser(getCurrentUser())) return;
  ui.adminOrders.innerHTML = "";

  const head = document.createElement("header");
  head.className = "admin-head";
  head.innerHTML = `
    <h3>All Orders</h3>
    <p>Global Firestore purchase history.</p>
  `;
  ui.adminOrders.append(head);

  const orders = await fetchAllOrdersForAdmin();
  if (!orders.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No Firestore orders yet.";
    ui.adminOrders.append(empty);
    return;
  }

  for (const order of orders.slice(0, 40)) {
    const card = document.createElement("article");
    card.className = "admin-row";
    card.innerHTML = `
      <div class="admin-row-body">
        <div class="admin-row-head">
          <strong class="admin-title">Order ${order.id}</strong>
          <span class="admin-price">${money(Number(order.priceAtPurchase) || 0)}</span>
        </div>
        <p class="admin-meta">Listing: ${order.listingId} • Buyer: ${order.buyerUid} • Status: ${order.status}</p>
        <p class="admin-meta">${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
      </div>
    `;
    ui.adminOrders.append(card);
  }
}

async function renderAdminAutoCatalogControls() {
  if (!ui.adminAutoCatalogToggle || !ui.adminGenerateTodayBtn || !ui.adminAutoCatalogStatus) return;
  const config = await readAutoCatalogConfig();
  const enabled = config.autoEnabled !== false;
  const aiEnabled = config.aiImagesEnabled !== false;
  const aiLimit = clamp(Math.floor(Number(config.aiImagesDailyLimit) || AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT), 0, 80);
  ui.adminAutoCatalogToggle.checked = enabled;
  if (ui.adminAiImagesToggle) {
    ui.adminAiImagesToggle.checked = aiEnabled;
  }
  if (ui.adminAiImageDailyLimitInput) {
    ui.adminAiImageDailyLimitInput.value = String(aiLimit);
  }
  ui.adminGenerateTodayBtn.disabled = !firestoreDb;
  ui.adminAutoCatalogStatus.textContent = firestoreDb
    ? `Auto generation is ${enabled ? "ON" : "OFF"} • AI images ${aiEnabled ? "ON" : "OFF"} (${aiLimit}/day).`
    : "Connect Firestore to use auto generation controls.";
}

async function handleAdminAutoCatalogToggle(event) {
  if (!ensureAdmin()) return;
  try {
    const enabled = event.currentTarget.checked === true;
    await writeAutoCatalogConfig({ autoEnabled: enabled });
    if (enabled) {
      await ensureAutoCatalogFresh(true);
    }
    setAdminMessage(`Auto catalog generation ${enabled ? "enabled" : "disabled"}.`);
    renderAdminAutoCatalogControls().catch((error) => {
      console.error("[AutoCatalog] toggle render failed:", error);
    });
  } catch (error) {
    console.error("[AutoCatalog] toggle failed:", error);
    setAdminMessage(`Auto catalog toggle failed: ${error?.message || "Try again."}`, true);
  }
}

async function handleAdminAiImagesToggle(event) {
  if (!ensureAdmin()) return;
  const enabled = event.currentTarget.checked === true;
  try {
    await writeAutoCatalogConfig({ aiImagesEnabled: enabled });
    setAdminMessage(`AI image generation ${enabled ? "enabled" : "disabled"}.`);
    await renderAdminAutoCatalogControls();
  } catch (error) {
    console.error("[AutoCatalog] ai toggle failed:", error);
    setAdminMessage(`AI image toggle failed: ${error?.message || "Try again."}`, true);
  }
}

async function handleAdminAiImageDailyLimitChange(event) {
  if (!ensureAdmin()) return;
  const value = clamp(Math.floor(Number(event.currentTarget.value) || 0), 0, 80);
  try {
    await writeAutoCatalogConfig({ aiImagesDailyLimit: value });
    setAdminMessage(`AI image daily limit set to ${value}.`);
    await renderAdminAutoCatalogControls();
  } catch (error) {
    console.error("[AutoCatalog] ai limit save failed:", error);
    setAdminMessage(`AI image limit save failed: ${error?.message || "Try again."}`, true);
  }
}

async function handleAdminGenerateTodayNow() {
  if (!ensureAdmin()) return;
  if (!firestoreDb) {
    setAdminMessage("Connect Firestore before generating.", true);
    return;
  }
  try {
    await ensureAutoCatalogFresh(true);
    setAdminMessage("Generated today's auto catalog batch.");
  } catch (error) {
    console.error("[AutoCatalog] manual generate failed:", error);
    setAdminMessage(`Generate failed: ${error?.message || "Try again."}`, true);
  }
}

async function ensureAutoCatalogFresh(force = false) {
  if (!firestoreDb) return;
  const todayKey = getTodayKeyLocal();
  const config = await readAutoCatalogConfig();
  const enabled = config.autoEnabled !== false;
  if (!enabled && !force) return;

  const generatedSnapshot = await firestoreDb
    .collection("listings")
    .where("generated", "==", true)
    .where("dayKey", "==", todayKey)
    .get();
  if (!force && generatedSnapshot.size >= AUTO_CATALOG_MIN_ITEMS) {
    return;
  }

  const generatedListings = buildGeneratedCatalogForDay(todayKey);
  const withImages = await enrichGeneratedListingsWithImages(generatedListings, todayKey, config);
  const batch = firestoreDb.batch();
  for (const listing of withImages) {
    const ref = firestoreDb.collection("listings").doc(String(listing.id));
    batch.set(ref, {
      title: listing.title,
      brand: listing.brand,
      category: listing.category,
      price: listing.price,
      rating: listing.rating,
      reviewCount: listing.reviewCount,
      description: listing.description,
      features: listing.features,
      rarity: listing.rarity,
      stock: listing.stock,
      shippingTime: listing.shippingTime,
      is21plus: listing.is21plus,
      imageUrl: listing.imageUrl,
      createdBy: listing.createdBy,
      createdByName: listing.createdByName,
      status: listing.status,
      generated: true,
      dayKey: todayKey,
      reviews: [],
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  await writeAutoCatalogConfig({
    autoEnabled: enabled,
    aiImagesEnabled: config.aiImagesEnabled !== false,
    aiImagesDailyLimit: clamp(Math.floor(Number(config.aiImagesDailyLimit) || AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT), 0, 80),
    lastGeneratedDayKey: todayKey,
    lastGeneratedCount: withImages.length
  });
}

async function enrichGeneratedListingsWithImages(listings, dayKey, config) {
  const out = listings.map((item) => ({ ...item }));
  const aiEnabled = config.aiImagesEnabled !== false;
  const dailyLimit = clamp(Math.floor(Number(config.aiImagesDailyLimit) || AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT), 0, 80);
  if (!aiEnabled || dailyLimit <= 0) return out;

  const maxCount = Math.min(dailyLimit, out.length);
  const targetIndexes = [];
  for (let i = 0; i < maxCount; i += 1) {
    targetIndexes.push(i);
  }

  await mapWithConcurrency(targetIndexes, 2, async (index) => {
    const listing = out[index];
    if (!listing) return;
    try {
      const imageUrl = await generateImageForListingViaApi(listing, { force: false });
      if (imageUrl) {
        listing.imageUrl = imageUrl;
      }
    } catch (error) {
      console.error("[AutoCatalog] image generation failed for listing:", listing.id, error);
      listing.imageUrl = fallbackImageForCategory(listing.category);
    }
  });
  return out;
}

function buildGeneratedCatalogForDay(dayKey) {
  const rng = createSeededRandom(`site|${dayKey}|auto-catalog`);
  const count = AUTO_CATALOG_MIN_ITEMS + Math.floor(rng() * (AUTO_CATALOG_MAX_ITEMS - AUTO_CATALOG_MIN_ITEMS + 1));
  const generated = [];
  for (let i = 0; i < count; i += 1) {
    const category = pickCatalogCategory(rng);
    const template = AUTO_CATALOG_CATEGORY_TEMPLATES[category] || AUTO_CATALOG_CATEGORY_TEMPLATES.Tech;
    const rarity = pickWeightedWithRng(AUTO_CATALOG_RARITY_WEIGHTS, rng);
    const rarityRules = AUTO_CATALOG_RARITY_RULES[rarity] || AUTO_CATALOG_RARITY_RULES.common;
    const brand = buildFakeBrand(rng);
    const model = AUTO_CATALOG_MODEL_NAMES[Math.floor(rng() * AUTO_CATALOG_MODEL_NAMES.length)];
    const productType = template.productTypes[Math.floor(rng() * template.productTypes.length)];
    const descriptor = template.descriptors[Math.floor(rng() * template.descriptors.length)];
    const title = `${brand} ${model} ${descriptor} ${productType}`.replaceAll(/\s+/g, " ").trim().slice(0, 120);
    const features = buildFeatureList(template, rng);
    const description = buildGeneratedDescription(template, productType, descriptor).slice(0, 500);
    const imageUrl = pickCatalogImageUrl(template.imageKey, dayKey, i, title);
    const price = randomIntWithRng(rng, rarityRules.priceMin, rarityRules.priceMax);
    const stock = randomIntWithRng(rng, rarityRules.stockMin, rarityRules.stockMax);
    const rating = round2(randomFloatWithRng(rng, rarityRules.ratingMin, rarityRules.ratingMax));
    const reviewCount = randomIntWithRng(rng, rarityRules.reviewsMin, rarityRules.reviewsMax);
    generated.push({
      id: buildGeneratedListingId(dayKey, i, title),
      title,
      brand,
      category,
      description,
      features,
      price,
      stock,
      rarity,
      rating,
      reviewCount,
      imageUrl,
      createdAt: new Date().toISOString(),
      dayKey,
      generated: true,
      shippingTime: `${randomIntWithRng(rng, 1, 4)}-${randomIntWithRng(rng, 5, 9)} business days`,
      is21plus: false,
      createdBy: "auto_catalog",
      createdByName: "system",
      status: "active"
    });
  }
  return generated;
}

function pickCatalogCategory(rng) {
  const keys = Object.keys(AUTO_CATALOG_CATEGORY_TEMPLATES);
  return keys[Math.floor(rng() * keys.length)] || "Tech";
}

function buildFakeBrand(rng) {
  const first = AUTO_CATALOG_FAKE_BRAND_SYLLABLES.first[Math.floor(rng() * AUTO_CATALOG_FAKE_BRAND_SYLLABLES.first.length)] || "No";
  const middle = AUTO_CATALOG_FAKE_BRAND_SYLLABLES.middle[Math.floor(rng() * AUTO_CATALOG_FAKE_BRAND_SYLLABLES.middle.length)] || "va";
  const last = AUTO_CATALOG_FAKE_BRAND_SYLLABLES.last[Math.floor(rng() * AUTO_CATALOG_FAKE_BRAND_SYLLABLES.last.length)] || "ra";
  return `${first}${middle}${last}`.slice(0, 16);
}

function buildFeatureList(template, rng) {
  const pool = shuffleWithRng((template?.featurePool || []).slice(), rng);
  const count = randomIntWithRng(rng, 3, 6);
  const out = [];
  for (let i = 0; i < Math.min(count, pool.length); i += 1) {
    out.push(pool[i]);
  }
  return out;
}

function buildGeneratedDescription(template, productType, descriptor) {
  const pool = Array.isArray(template?.descriptionPool) ? template.descriptionPool : [];
  const first = pool[0] || "Built for everyday use and reliable performance.";
  const second = pool[1] || "A practical pick for shoppers who want value and clean design.";
  return `${descriptor} ${productType}. ${first} ${second}`;
}

function pickCatalogImageUrl(imageKey, dayKey, index, title) {
  const key = String(imageKey || "tech").toLowerCase();
  const list = AUTO_CATALOG_IMAGE_FILES[key] || AUTO_CATALOG_IMAGE_FILES.tech;
  const seed = hashStringToInt(`${dayKey}|${index}|${title}`);
  const imageName = list[seed % list.length] || list[0];
  return `/public/images/catalog/${key}/${imageName}`;
}

function fallbackImageForCategory(category) {
  const key = String(category || "tech").toLowerCase();
  if (key.includes("home")) return "/public/images/catalog/home/home-01.svg";
  if (key.includes("beauty")) return "/public/images/catalog/beauty/beauty-01.svg";
  if (key.includes("fitness")) return "/public/images/catalog/fitness/fitness-01.svg";
  if (key.includes("gaming")) return "/public/images/catalog/gaming/gaming-01.svg";
  return "/public/images/catalog/tech/tech-01.svg";
}

function buildListingImageKey(listing, dayKey, versionSuffix = "") {
  const title = String(listing?.title || "");
  const category = String(listing?.category || "");
  const features = Array.isArray(listing?.features) ? listing.features.join("|") : "";
  const base = `${title}|${category}|${features}|${dayKey}|${versionSuffix}`;
  return `img_${hashStringToInt(base).toString(36)}`;
}

async function generateImageForListingViaApi(listing, options = {}) {
  const dayKey = String(listing?.dayKey || getTodayKeyLocal());
  const imageKey = buildListingImageKey(listing, dayKey, String(options.versionSuffix || ""));
  const payload = {
    listing: {
      title: String(listing?.title || "Product"),
      category: String(listing?.category || "Tech"),
      features: Array.isArray(listing?.features) ? listing.features.slice(0, 6) : [],
      rarity: normalizeRarity(listing?.rarity || "common")
    },
    dayKey,
    imageKey,
    force: options.force === true,
    autoGeneration: true
  };

  if (typeof window === "undefined" || window.location?.protocol === "file:") {
    return fallbackImageForCategory(payload.listing.category);
  }

  const response = await fetch("/api/generateProductImage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Image API failed (${response.status})`);
  }
  const data = await response.json();
  const imageUrl = String(data?.imageUrl || "").trim();
  if (!imageUrl) throw new Error("Image API returned empty URL");
  return imageUrl;
}

async function mapWithConcurrency(values, concurrency, worker) {
  const queue = Array.isArray(values) ? values.slice() : [];
  const running = [];
  const limit = Math.max(1, Math.floor(Number(concurrency) || 1));

  async function runOne() {
    if (!queue.length) return;
    const value = queue.shift();
    await worker(value);
    await runOne();
  }

  for (let i = 0; i < Math.min(limit, queue.length); i += 1) {
    running.push(runOne());
  }
  await Promise.all(running);
}

function buildGeneratedListingId(dayKey, index, title) {
  const suffix = hashStringToInt(`${dayKey}|${index}|${title}`).toString(36).slice(0, 6);
  return `gen-${dayKey}-${String(index + 1).padStart(3, "0")}-${suffix}`;
}

async function readAutoCatalogConfig() {
  const fallback = readAutoCatalogConfigLocal();
  if (!firestoreDb) return fallback;
  try {
    const doc = await firestoreDb.collection("system").doc("catalogConfig").get();
    if (!doc.exists) return fallback;
    const data = doc.data() || {};
    return {
      autoEnabled: data.autoEnabled !== false,
      aiImagesEnabled: data.aiImagesEnabled !== false,
      aiImagesDailyLimit: clamp(Math.floor(Number(data.aiImagesDailyLimit) || fallback.aiImagesDailyLimit || AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT), 0, 80),
      lastGeneratedDayKey: String(data.lastGeneratedDayKey || fallback.lastGeneratedDayKey || ""),
      lastGeneratedCount: Math.max(0, Math.floor(Number(data.lastGeneratedCount) || 0))
    };
  } catch (error) {
    console.error("[AutoCatalog] config read failed:", error);
    return fallback;
  }
}

async function writeAutoCatalogConfig(patch) {
  const current = readAutoCatalogConfigLocal();
  const next = {
    autoEnabled: patch?.autoEnabled === undefined ? current.autoEnabled : patch.autoEnabled !== false,
    aiImagesEnabled: patch?.aiImagesEnabled === undefined ? current.aiImagesEnabled : patch.aiImagesEnabled !== false,
    aiImagesDailyLimit: clamp(Math.floor(Number(patch?.aiImagesDailyLimit ?? current.aiImagesDailyLimit ?? AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT)), 0, 80),
    lastGeneratedDayKey: String(patch?.lastGeneratedDayKey || current.lastGeneratedDayKey || ""),
    lastGeneratedCount: Math.max(0, Math.floor(Number(patch?.lastGeneratedCount ?? current.lastGeneratedCount ?? 0)))
  };
  writeAutoCatalogConfigLocal(next);
  if (!firestoreDb) return next;
  await firestoreDb.collection("system").doc("catalogConfig").set(
    {
      autoEnabled: next.autoEnabled,
      aiImagesEnabled: next.aiImagesEnabled,
      aiImagesDailyLimit: next.aiImagesDailyLimit,
      lastGeneratedDayKey: next.lastGeneratedDayKey,
      lastGeneratedCount: next.lastGeneratedCount,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return next;
}

function readAutoCatalogConfigLocal() {
  try {
    const raw = localStorage.getItem(AUTO_CATALOG_LOCAL_CONFIG_KEY);
    if (!raw) {
      return {
        autoEnabled: AUTO_CATALOG_DEFAULT_ENABLED,
        aiImagesEnabled: AUTO_CATALOG_AI_IMAGES_DEFAULT_ENABLED,
        aiImagesDailyLimit: AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT,
        lastGeneratedDayKey: "",
        lastGeneratedCount: 0
      };
    }
    const parsed = JSON.parse(raw);
    return {
      autoEnabled: parsed?.autoEnabled !== false,
      aiImagesEnabled: parsed?.aiImagesEnabled !== false,
      aiImagesDailyLimit: clamp(Math.floor(Number(parsed?.aiImagesDailyLimit) || AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT), 0, 80),
      lastGeneratedDayKey: String(parsed?.lastGeneratedDayKey || ""),
      lastGeneratedCount: Math.max(0, Math.floor(Number(parsed?.lastGeneratedCount) || 0))
    };
  } catch {
    return {
      autoEnabled: AUTO_CATALOG_DEFAULT_ENABLED,
      aiImagesEnabled: AUTO_CATALOG_AI_IMAGES_DEFAULT_ENABLED,
      aiImagesDailyLimit: AUTO_CATALOG_AI_IMAGES_DAILY_LIMIT_DEFAULT,
      lastGeneratedDayKey: "",
      lastGeneratedCount: 0
    };
  }
}

function writeAutoCatalogConfigLocal(config) {
  try {
    localStorage.setItem(AUTO_CATALOG_LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore local cache write failures.
  }
}

function pickWeightedWithRng(weightedItems, rng) {
  const total = weightedItems.reduce((sum, item) => sum + Number(item?.weight || 0), 0);
  let roll = rng() * total;
  for (const item of weightedItems) {
    roll -= Number(item?.weight || 0);
    if (roll <= 0) return String(item?.key || "common");
  }
  return String(weightedItems[weightedItems.length - 1]?.key || "common");
}

function randomIntWithRng(rng, min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

function randomFloatWithRng(rng, min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + rng() * (hi - lo);
}

function handleBuyAgeId() {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to buy a 21+ ID.")) return;
  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;
  if (nextProgress.hasAgeId) {
    setFundMessage("You already own a 21+ ID.");
    renderCreditsShop();
    return;
  }
  if ((Number(nextProgress.balance) || 0) < AGE_ID_PRICE) {
    setFundMessage(`Not enough money for ID. Need ${money(AGE_ID_PRICE)}.`, true);
    return;
  }

  nextProgress.balance = round2((Number(nextProgress.balance) || 0) - AGE_ID_PRICE);
  nextProgress.totalSpent = round2((Number(nextProgress.totalSpent) || 0) + AGE_ID_PRICE);
  nextProgress.hasAgeId = true;
  persistDb();
  syncCurrentUserEconomyToFirestore().catch(() => {});
  setFundMessage("21+ ID purchased. You can now buy 21+ items.");
  renderWallet();
  renderCreditsShop();
  renderStats();
  renderProducts();
  renderListingPreview();
}

function handleClaim5MinReward() {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to claim 5-minute rewards.")) return;
  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  const state = ensureFiveMinuteRewardState(nextProgress);
  const now = Date.now();
  const remainingCooldown = Math.max(0, Number(state.nextClaimAt || 0) - now);
  const todayRemaining = Math.max(0, REWARD5_MIN_DAILY_CAP - (Number(state.todayTotal5minRewards) || 0));

  if (todayRemaining <= 0) {
    setFundMessage("Daily cap reached for 5-minute rewards.", true);
    renderFiveMinuteReward(nextProgress);
    return;
  }
  if (remainingCooldown > 0) {
    setFundMessage(`Ready in ${formatCountdown(remainingCooldown)}.`, true);
    renderFiveMinuteReward(nextProgress);
    return;
  }

  const tier = pickWeightedTier();
  const rolledAmount = randomInt(tier.min, tier.max);
  const payout = Math.max(0, Math.min(rolledAmount, todayRemaining));
  if (payout <= 0) {
    setFundMessage("Daily cap reached for 5-minute rewards.", true);
    renderFiveMinuteReward(nextProgress);
    return;
  }

  addMoney(payout, "5min_reward", { tier: tier.key });
  state.lastClaimAt = now;
  state.nextClaimAt = now + REWARD5_MIN_COOLDOWN_MS;
  state.lastRewardAmount = payout;
  state.todayTotal5minRewards = round2((Number(state.todayTotal5minRewards) || 0) + payout);
  state.claimHistory.unshift({
    ts: new Date(now).toISOString(),
    amount: payout,
    tier: tier.key
  });
  state.claimHistory = state.claimHistory.slice(0, 10);

  persistDb();
  setFundMessage(`Reward claimed: ${money(payout)} (${tier.key}).`);
  renderWallet();
  renderCreditsShop();
  renderStats();
}

function renderFiveMinuteReward(progress) {
  const state = ensureFiveMinuteRewardState(progress);
  const now = Date.now();
  const remainingCooldown = Math.max(0, Number(state.nextClaimAt || 0) - now);
  const todayTotal = round2(Number(state.todayTotal5minRewards) || 0);
  const capRemaining = Math.max(0, REWARD5_MIN_DAILY_CAP - todayTotal);
  const canClaim = remainingCooldown <= 0 && capRemaining > 0;

  ui.reward5minClaimBtn.disabled = !canClaim;
  ui.reward5minCountdown.textContent = canClaim ? "Ready" : formatCountdown(remainingCooldown);
  ui.reward5minStatus.textContent = capRemaining <= 0
    ? "Daily cap reached."
    : canClaim
      ? "Reward ready to claim."
      : `Next reward in ${formatCountdown(remainingCooldown)}.`;
  ui.reward5minLast.textContent = `Last reward: ${money(Number(state.lastRewardAmount) || 0)}`;
  ui.reward5minToday.textContent = `Today's 5-min total: ${money(todayTotal)} / ${money(REWARD5_MIN_DAILY_CAP)}`;
}

function ensureFiveMinuteRewardState(progress) {
  const todayKey = getTodayKey();
  if (!progress.fiveMinReward || typeof progress.fiveMinReward !== "object") {
    progress.fiveMinReward = {
      todayKey,
      lastClaimAt: null,
      nextClaimAt: null,
      todayTotal5minRewards: 0,
      lastRewardAmount: 0,
      claimHistory: []
    };
    return progress.fiveMinReward;
  }
  const state = progress.fiveMinReward;
  if (String(state.todayKey || "") !== todayKey) {
    state.todayKey = todayKey;
    state.todayTotal5minRewards = 0;
    state.claimHistory = [];
  }
  state.lastClaimAt = Number(state.lastClaimAt) > 0 ? Number(state.lastClaimAt) : null;
  state.nextClaimAt = Number(state.nextClaimAt) > 0 ? Number(state.nextClaimAt) : null;
  state.todayTotal5minRewards = round2(Math.max(0, Number(state.todayTotal5minRewards) || 0));
  state.lastRewardAmount = round2(Math.max(0, Number(state.lastRewardAmount) || 0));
  state.claimHistory = Array.isArray(state.claimHistory) ? state.claimHistory.slice(0, 10) : [];
  return state;
}

function getTodayKey(ts = Date.now()) {
  return getTodayKeyLocal(ts);
}

function pickWeightedTier() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const tier of REWARD5_MIN_TIERS) {
    cumulative += Number(tier.weight || 0);
    if (roll < cumulative) return tier;
  }
  return REWARD5_MIN_TIERS[REWARD5_MIN_TIERS.length - 1];
}

function randomInt(min, max) {
  const lo = Math.ceil(Number(min) || 0);
  const hi = Math.floor(Number(max) || 0);
  if (hi <= lo) return lo;
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function setFundMessage(message, isError = false) {
  ui.creditsMsg.textContent = message;
  ui.creditsMsg.classList.toggle("error", isError);
}

function filteredProducts() {
  const progress = getProgressOrNull();
  const search = (progress?.search || "").toLowerCase();
  const category = progress?.category || "all";
  const sort = progress?.sort || "featured";

  const filtered = getCatalog().filter((product) => {
    if (String(product.status || "active") !== "active") return false;
    const haystack = `${product.title} ${product.brand || ""} ${product.description || ""}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a));
  }

  return filtered;
}

function renderProducts() {
  const products = filteredProducts();
  ui.productGrid.innerHTML = "";

  if (!products.length) {
    const message = document.createElement("p");
    message.textContent = "No items found. Try different filters.";
    ui.productGrid.append(message);
    return;
  }

  for (const product of products) {
    const effectiveRating = getEffectiveRating(product);
    const starCount = Math.max(1, Math.min(5, Math.round(effectiveRating)));
    const reviewCount = Math.max(0, Math.floor(Number(product.reviewCount) || getReviewsForProduct(product).length || 0));
    const ageBadge = product.ageRestricted ? '<span class="age-badge">21+</span>' : "";
    const newDropBadge = isNewDrop(product.createdAt) ? '<span class="new-drop-badge">New Drop</span>' : "";
    const outOfStock = Number(product.stock) === 0;
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}" />
      <h3 class="product-title">${product.title}${ageBadge}${newDropBadge}</h3>
      <p class="product-sub">${escapeHtml(product.brand || "NovaGoods")} • ${escapeHtml(product.category)}</p>
      <p class="rating">${"★".repeat(starCount)} ${effectiveRating.toFixed(1)} (${reviewCount.toLocaleString()} reviews)</p>
      <p class="product-desc">${escapeHtml((product.description || "").slice(0, 110))}</p>
      <div class="meta">
        <span class="price">${money(product.price)} • Stock ${Math.max(0, Number(product.stock) || 0)}</span>
        <button type="button" data-id="${product.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Sold Out" : "Add"}</button>
      </div>
    `;

    const button = card.querySelector("button");
    attachImageFallback(card.querySelector("img"), product.title);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addToCart(product.id);
    });
    card.addEventListener("click", () => openListingPreview(product.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openListingPreview(product.id);
      }
    });
    ui.productGrid.append(card);
  }
}

function openListingPreview(productId) {
  const product = findProductById(productId);
  if (!product) return;
  activeListingId = product.id;
  renderListingPreview();
}

function closeListingPreview() {
  activeListingId = null;
  ui.previewReviewMsg.textContent = "";
  ui.previewReviewMsg.classList.remove("error");
  renderListingPreview();
}

function renderListingPreview() {
  const product = activeListingId ? findProductById(activeListingId) : null;
  const showPreview = Boolean(product) && activeTab === "store";
  ui.storefrontContent.classList.toggle("hidden", showPreview);
  ui.listingPreview.classList.toggle("hidden", !showPreview);

  if (!showPreview || !product) {
    return;
  }

  const reviews = getReviewsForProduct(product);
  const canBuyAgeRestricted = !product.ageRestricted || hasAgeIdFor21Plus();
  const outOfStock = Number(product.stock) === 0;
  const effectiveRating = getEffectiveRating(product);
  const starCount = Math.max(1, Math.min(5, Math.round(effectiveRating)));
  const reviewCount = Math.max(0, Math.floor(Number(product.reviewCount) || reviews.length || 0));
  ui.previewImage.src = product.image;
  ui.previewImage.alt = product.title;
  attachImageFallback(ui.previewImage, product.title);
  ui.previewTitle.textContent = product.title;
  ui.previewMeta.textContent = `${product.brand || "NovaGoods"} • ${product.category}${product.ageRestricted ? " • 21+ item" : ""} • Rarity is random on delivery • Stock ${Math.max(0, Number(product.stock) || 0)} • ${product.shippingTime || "Standard shipping"} • Seller @${product.ownerUsername} • ${"★".repeat(starCount)} ${effectiveRating.toFixed(1)} • ${reviewCount.toLocaleString()} reviews`;
  ui.previewPrice.textContent = money(product.price);
  ui.previewDescription.textContent = product.description || `${product.title} is available in our marketplace.`;
  ui.previewFeatures.innerHTML = "";
  const featureList = Array.isArray(product.features) ? product.features.filter(Boolean).slice(0, 6) : [];
  if (featureList.length) {
    for (const feature of featureList) {
      const li = document.createElement("li");
      li.textContent = feature;
      ui.previewFeatures.append(li);
    }
  } else {
    const li = document.createElement("li");
    li.textContent = "Standard marketplace quality.";
    ui.previewFeatures.append(li);
  }
  ui.previewAddToCartBtn.disabled = !canBuyAgeRestricted || outOfStock;
  ui.previewAddToCartBtn.textContent = outOfStock ? "Sold Out" : canBuyAgeRestricted ? "Add To Cart" : "21+ ID Required";
  renderPreviewReviews(reviews);
}

function renderPreviewReviews(reviews) {
  ui.previewReviewsList.innerHTML = "";
  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No reviews yet. Be the first to review this listing.";
    ui.previewReviewsList.append(empty);
    return;
  }

  for (const review of reviews.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    const item = document.createElement("article");
    item.className = "review-item";
    item.innerHTML = `
      <strong>${"★".repeat(Math.max(1, Math.min(5, Number(review.rating) || 1)))} by @${review.username}</strong>
      <p>${escapeHtml(review.text)}</p>
      <p class="hint">${new Date(review.createdAt).toLocaleString()}</p>
    `;
    ui.previewReviewsList.append(item);
  }
}

function renderCart() {
  const progress = getProgressOrNull();
  const entries = progress ? Object.entries(progress.cart) : [];
  ui.cartItems.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Your cart is empty.";
    ui.cartItems.append(empty);
  }

  for (const [productId, qty] of entries) {
    const product = findProductById(productId);
    if (!product) continue;

    const item = document.createElement("article");
    item.className = "cart-item";
    item.innerHTML = `
      <div class="cart-item-head">
        <strong>${product.title}</strong>
        <span>${money(product.price * qty)}</span>
      </div>
      <div class="qty-row">
        <button type="button" data-op="dec">-</button>
        <span>Qty: ${qty}</span>
        <button type="button" data-op="inc">+</button>
        <button type="button" data-op="remove" class="link-btn">Remove</button>
      </div>
    `;

    item.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => updateQty(productId, btn.dataset.op));
    });

    ui.cartItems.append(item);
  }

  const totals = cartTotals();
  ui.cartCount.textContent = String(totals.items);
  ui.summaryItems.textContent = String(totals.items);
  ui.summaryTotal.textContent = money(totals.total);
}

function renderOrders() {
  const progress = getProgressOrNull();
  const localOrders = progress ? progress.orders : [];
  const remoteOrders = progress && Array.isArray(progress.firestoreOrders) ? progress.firestoreOrders : [];
  const orders = [...localOrders, ...remoteOrders].slice(0, 20);
  ui.ordersList.innerHTML = "";

  if (!orders.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No orders yet.";
    ui.ordersList.append(empty);
    return;
  }

  for (const order of orders.slice(0, 8)) {
    const shipping = getShippingSnapshot(order);
    const card = document.createElement("article");
    card.className = "order-card";
    card.innerHTML = `
      <div>
        <strong>${order.itemCount} items</strong>
        <p>${order.products.join(", ")}</p>
        <p><strong>Shipping:</strong> ${shipping.carrier} • ${shipping.service}</p>
        <p><strong>Tracking:</strong> ${shipping.trackingId}</p>
      </div>
      <div>
        <strong>${money(order.total)}</strong>
        <p>${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>ETA:</strong> ${shipping.etaLabel}</p>
        <p><strong>To:</strong> ${shipping.destination}</p>
        <p><strong>Status:</strong> ${shipping.status}</p>
      </div>
    `;
    ui.ordersList.append(card);
  }
}

function renderCollection() {
  const progress = getProgressOrNull();
  const inventory = progress ? normalizeCollectionInventory(progress.collectionInventory) : [];

  ui.collectionGrid.innerHTML = "";
  if (!inventory.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No delivered items yet. Bought items appear here when delivered.";
    ui.collectionGrid.append(empty);
    return;
  }

  for (const item of inventory) {
    const card = document.createElement("article");
    card.className = `collection-card rarity-${item.rarity}`;
    const estimate = estimateNetSaleValue(item);
    const conditionsText = item.conditions.length ? item.conditions.join(", ") : "None";
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" />
      <p class="title">${item.title}</p>
      <p class="meta">Qty: ${item.qty}</p>
      <p class="meta">Rarity: <span class="rarity rarity-${item.rarity}">${item.rarity}</span></p>
      <p class="meta">Base Price: ${money(item.valueEach)}</p>
      <p class="meta">Conditions: ${conditionsText}</p>
      <button type="button" class="collection-sell-btn" data-id="${item.id}">
        Sell Item (est. ${money(estimate)})
      </button>
    `;
    attachImageFallback(card.querySelector("img"), item.title);
    ui.collectionGrid.append(card);
  }
}

function renderTracking() {
  const progress = getProgressOrNull();
  const orders = progress ? progress.orders : [];
  ui.trackingList.innerHTML = "";

  if (!orders.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No packages to track yet. Buy something first.";
    ui.trackingList.append(empty);
    return;
  }

  for (const order of orders.slice(0, 20)) {
    const shipping = getShippingSnapshot(order);
    const pct = shippingProgressPercent(order, shipping);
    const card = document.createElement("article");
    card.className = "tracking-card";
    card.innerHTML = `
      <div class="tracking-head">
        <strong>${shipping.carrier} • ${shipping.service}</strong>
        <span>${shipping.status}</span>
      </div>
      <p class="tracking-meta"><strong>Tracking:</strong> ${shipping.trackingId}</p>
      <p class="tracking-meta"><strong>Destination:</strong> ${shipping.destination}</p>
      <p class="tracking-meta"><strong>ETA:</strong> ${shipping.etaLabel}</p>
      <div class="tracking-progress">
        <div class="tracking-progress-bar" style="width:${pct}%"></div>
      </div>
      <p class="tracking-meta">Progress: ${pct}%</p>
    `;
    ui.trackingList.append(card);
  }
}

function renderStats() {
  const progress = getProgressOrNull();
  if (!progress) {
    ui.statsEarned.textContent = "$0.00";
    ui.statsSpent.textContent = "$0.00";
    return;
  }

  const spentFallback = round2(
    (Array.isArray(progress.orders) ? progress.orders : []).reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  );
  const spent = round2(Math.max(Number(progress.totalSpent) || 0, spentFallback));
  const earnedTracked = round2((Number(progress.totalFundsCollected) || 0) + (Number(progress.totalFromSales) || 0));
  const earnedFallback = round2((Number(progress.balance) || 0) + spent);
  const earned = round2(Math.max(earnedTracked, earnedFallback));

  ui.statsEarned.textContent = money(earned);
  ui.statsSpent.textContent = money(spent);
}

function setFriendsSubtab(tab) {
  activeFriendsSubtab = ["search", "requests", "friends", "blocked"].includes(tab) ? tab : "search";
  renderFriends();
}

function setFriendsMessage(message, isError = false) {
  if (!ui.friendsMsg) return;
  ui.friendsMsg.textContent = message;
  ui.friendsMsg.classList.toggle("error", isError);
}

function setTradesMessage(message, isError = false) {
  if (!ui.tradesMsg) return;
  ui.tradesMsg.textContent = message;
  ui.tradesMsg.classList.toggle("error", isError);
}

function sortedPairId(a, b) {
  return [String(a || ""), String(b || "")].sort().join("_");
}

function friendsOtherUid(friendship, myUid) {
  return friendship.userA === myUid ? friendship.userB : friendship.userA;
}

async function ensureUserProfileDoc(user = getCurrentUser()) {
  if (!firestoreDb || !user) return;
  await firestoreDb
    .collection("users")
    .doc(String(user.id))
    .set(
      {
        uid: String(user.id),
        username: String(user.username),
        usernameLower: String(user.username).toLowerCase(),
        balance: round2(Number(user.progress?.balance) || 0),
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}

async function syncCurrentBalanceFromFirestore() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  const snap = await firestoreDb.collection("users").doc(String(user.id)).get();
  if (!snap.exists) return;
  const data = snap.data() || {};
  const remoteBalance = round2(Math.max(0, Number(data.balance) || 0));
  if (remoteBalance !== round2(Number(user.progress.balance) || 0)) {
    user.progress.balance = remoteBalance;
    persistDb();
    renderWallet();
    renderCreditsShop();
    renderStats();
  }
}

async function refreshFriendsData() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  await ensureUserProfileDoc(user);
  await syncCurrentInventoryToFirestore(user.id);

  const uid = String(user.id);
  const [asA, asB] = await Promise.all([
    firestoreDb.collection("friendships").where("userA", "==", uid).get(),
    firestoreDb.collection("friendships").where("userB", "==", uid).get()
  ]);
  const map = new Map();
  [...asA.docs, ...asB.docs].forEach((doc) => {
    const data = doc.data() || {};
    map.set(doc.id, {
      id: doc.id,
      userA: String(data.userA || ""),
      userB: String(data.userB || ""),
      status: String(data.status || "pending"),
      requestedBy: String(data.requestedBy || ""),
      blockedBy: data.blockedBy ? String(data.blockedBy) : null,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
    });
  });
  friendsState.friendships = Array.from(map.values());

  const otherIds = Array.from(new Set(friendsState.friendships.map((f) => friendsOtherUid(f, uid)).filter(Boolean)));
  friendsState.usersById = {};
  for (const chunk of chunkArray(otherIds, 10)) {
    if (!chunk.length) continue;
    const snap = await firestoreDb.collection("users").where("uid", "in", chunk).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      friendsState.usersById[String(data.uid || doc.id)] = {
        uid: String(data.uid || doc.id),
        username: String(data.username || "unknown"),
        usernameLower: String(data.usernameLower || "").toLowerCase(),
        avatarUrl: String(data.avatarUrl || "")
      };
    }
  }
  renderFriends();
  renderTrades();
}

function renderFriends() {
  if (!ui.friendsView) return;
  const user = getCurrentUser();
  const signedIn = Boolean(user);
  const uid = String(user?.id || "");

  ui.friendsSearchTabBtn.classList.toggle("active", activeFriendsSubtab === "search");
  ui.friendsRequestsTabBtn.classList.toggle("active", activeFriendsSubtab === "requests");
  ui.friendsListTabBtn.classList.toggle("active", activeFriendsSubtab === "friends");
  ui.friendsBlockedTabBtn.classList.toggle("active", activeFriendsSubtab === "blocked");
  ui.friendsSearchPanel.classList.toggle("hidden", activeFriendsSubtab !== "search");
  ui.friendsRequestsPanel.classList.toggle("hidden", activeFriendsSubtab !== "requests");
  ui.friendsListPanel.classList.toggle("hidden", activeFriendsSubtab !== "friends");
  ui.friendsBlockedPanel.classList.toggle("hidden", activeFriendsSubtab !== "blocked");

  if (!signedIn) {
    ui.friendSearchResults.innerHTML = '<p class="hint">Sign in to use friends.</p>';
    ui.friendIncomingList.innerHTML = "";
    ui.friendOutgoingList.innerHTML = "";
    ui.friendsList.innerHTML = "";
    ui.friendsBlockedList.innerHTML = "";
    return;
  }

  const all = friendsState.friendships || [];
  const incoming = all.filter((f) => f.status === "pending" && f.requestedBy !== uid);
  const outgoing = all.filter((f) => f.status === "pending" && f.requestedBy === uid);
  const accepted = all.filter((f) => f.status === "accepted");
  const blocked = all.filter((f) => f.status === "blocked");

  renderFriendCards(ui.friendIncomingList, incoming, uid, ["accept", "decline"]);
  renderFriendCards(ui.friendOutgoingList, outgoing, uid, ["cancel"]);
  renderFriendCards(ui.friendsList, accepted, uid, ["send", "trade", "remove", "block"]);
  renderFriendCards(ui.friendsBlockedList, blocked, uid, ["unblock"]);
}

function renderFriendCards(container, friendships, myUid, actions) {
  if (!container) return;
  container.innerHTML = "";
  if (!friendships.length) {
    container.innerHTML = '<p class="hint">None.</p>';
    return;
  }
  for (const friendship of friendships) {
    const otherUid = friendsOtherUid(friendship, myUid);
    const profile = friendsState.usersById[otherUid] || { username: "unknown" };
    const card = document.createElement("article");
    card.className = "admin-row";
    const buttons = actions
      .map((action) => `<button type="button" data-action="${action}" data-fid="${friendship.id}" data-uid="${otherUid}">${friendActionLabel(action)}</button>`)
      .join("");
    card.innerHTML = `
      <div class="admin-row-body">
        <div class="admin-row-head">
          <strong class="admin-title">@${profile.username}</strong>
          <span class="admin-meta">${friendship.status}</span>
        </div>
        <div class="admin-row-controls">${buttons}</div>
      </div>
    `;
    container.append(card);
  }
}

function friendActionLabel(action) {
  if (action === "accept") return "Accept";
  if (action === "decline") return "Decline";
  if (action === "cancel") return "Cancel";
  if (action === "send") return "Send Money";
  if (action === "trade") return "Trade";
  if (action === "remove") return "Remove";
  if (action === "block") return "Block";
  if (action === "unblock") return "Unblock";
  return action;
}

async function handleFriendSearch() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  await ensureUserProfileDoc(user);
  const q = String(ui.friendSearchInput?.value || "").trim().toLowerCase();
  ui.friendSearchResults.innerHTML = "";
  if (!q) {
    setFriendsMessage("Type a username to search.", true);
    return;
  }
  const snap = await firestoreDb
    .collection("users")
    .where("usernameLower", ">=", q)
    .where("usernameLower", "<=", `${q}\uf8ff`)
    .limit(20)
    .get();
  const currentUid = String(user.id);
  const rows = [];
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const uid = String(data.uid || doc.id);
    if (uid === currentUid) continue;
    rows.push({
      uid,
      username: String(data.username || "unknown")
    });
  }
  if (!rows.length) {
    ui.friendSearchResults.innerHTML = '<p class="hint">No users found.</p>';
    return;
  }
  for (const row of rows) {
    const card = document.createElement("article");
    card.className = "admin-row";
    card.innerHTML = `
      <div class="admin-row-body">
        <div class="admin-row-head">
          <strong class="admin-title">@${row.username}</strong>
        </div>
        <div class="admin-row-controls">
          <button type="button" data-action="send-request" data-uid="${row.uid}">Send Request</button>
        </div>
      </div>
    `;
    ui.friendSearchResults.append(card);
  }
  setFriendsMessage("");
}

async function handleFriendsViewClick(event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const action = String(btn.dataset.action || "");
  const fid = String(btn.dataset.fid || "");
  const targetUid = String(btn.dataset.uid || "");
  try {
    if (action === "send-request") {
      await sendFriendRequest(targetUid);
      setFriendsMessage("Friend request sent.");
      await refreshFriendsData();
    } else if (action === "accept") {
      await respondFriendRequest(fid, true);
      setFriendsMessage("Friend request accepted.");
      await refreshFriendsData();
    } else if (action === "decline" || action === "cancel") {
      await removeFriendship(fid);
      setFriendsMessage(action === "decline" ? "Request declined." : "Request canceled.");
      await refreshFriendsData();
    } else if (action === "remove") {
      if (!confirm("Remove this friend?")) return;
      await removeFriendship(fid);
      setFriendsMessage("Friend removed.");
      await refreshFriendsData();
    } else if (action === "block") {
      if (!confirm("Block this user?")) return;
      await blockFriend(fid);
      setFriendsMessage("User blocked.");
      await refreshFriendsData();
    } else if (action === "unblock") {
      await unblockFriend(fid);
      setFriendsMessage("User unblocked.");
      await refreshFriendsData();
    } else if (action === "send") {
      openSendMoneyModal(targetUid);
    } else if (action === "trade") {
      switchTab("trades");
      if (ui.newTradeFriendSelect) {
        ui.newTradeFriendSelect.value = targetUid;
      }
    }
  } catch (error) {
    console.error("[Friends] action failed:", error);
    setFriendsMessage(error?.message || "Action failed.", true);
  }
}

async function sendFriendRequest(targetUid) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required");
  const myUid = String(user.id);
  if (!targetUid || targetUid === myUid) throw new Error("Invalid user.");
  const id = sortedPairId(myUid, targetUid);
  const ref = firestoreDb.collection("friendships").doc(id);
  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data() || {};
      if (String(data.status || "") === "accepted") {
        throw new Error("Already friends.");
      }
      if (String(data.status || "") === "blocked") {
        throw new Error("This connection is blocked.");
      }
    }
    tx.set(
      ref,
      {
        userA: [myUid, targetUid].sort()[0],
        userB: [myUid, targetUid].sort()[1],
        status: "pending",
        requestedBy: myUid,
        blockedBy: null,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });
}

async function respondFriendRequest(friendshipId, accept) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required");
  const ref = firestoreDb.collection("friendships").doc(String(friendshipId));
  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Request not found.");
    const data = snap.data() || {};
    if (String(data.status || "") !== "pending") throw new Error("Request is no longer pending.");
    const myUid = String(user.id);
    if (String(data.requestedBy || "") === myUid) throw new Error("Cannot accept your own outgoing request.");
    if (accept) {
      tx.update(ref, {
        status: "accepted",
        blockedBy: null,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      tx.delete(ref);
    }
  });
}

async function removeFriendship(friendshipId) {
  if (!firestoreDb) throw new Error("Firestore not ready.");
  await firestoreDb.collection("friendships").doc(String(friendshipId)).delete();
}

async function blockFriend(friendshipId) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required");
  await firestoreDb.collection("friendships").doc(String(friendshipId)).set(
    {
      status: "blocked",
      blockedBy: String(user.id),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function unblockFriend(friendshipId) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required");
  const ref = firestoreDb.collection("friendships").doc(String(friendshipId));
  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Record missing.");
    const data = snap.data() || {};
    if (String(data.status || "") !== "blocked") throw new Error("Not blocked.");
    if (String(data.blockedBy || "") !== String(user.id)) throw new Error("Only blocker can unblock.");
    tx.delete(ref);
  });
}

function openSendMoneyModal(targetUid) {
  const profile = friendsState.usersById[String(targetUid)] || { username: "unknown" };
  sendMoneyTargetUid = String(targetUid);
  ui.sendMoneyTarget.textContent = `To @${profile.username}`;
  ui.sendMoneyAmountInput.value = "";
  ui.sendMoneyNoteInput.value = "";
  ui.sendMoneyMsg.textContent = "";
  ui.sendMoneyMsg.classList.remove("error");
  ui.sendMoneyModal.classList.remove("hidden");
}

function closeSendMoneyModal() {
  sendMoneyTargetUid = null;
  ui.sendMoneyModal.classList.add("hidden");
}

async function handleConfirmSendMoney() {
  const toUid = String(sendMoneyTargetUid || "");
  const amount = Math.floor(Number(ui.sendMoneyAmountInput.value || 0));
  const note = String(ui.sendMoneyNoteInput.value || "").trim().slice(0, 80);
  if (!toUid) return;
  try {
    const sent = await sendMoneyToFriend(toUid, amount, note);
    ui.sendMoneyMsg.textContent = `Sent ${money(sent)}.`;
    ui.sendMoneyMsg.classList.remove("error");
    await refreshFriendsData();
    await syncCurrentBalanceFromFirestore();
    setTimeout(closeSendMoneyModal, 500);
  } catch (error) {
    ui.sendMoneyMsg.textContent = error?.message || "Transfer failed.";
    ui.sendMoneyMsg.classList.add("error");
  }
}

async function sendMoneyToFriend(toUid, amount, note = "") {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required.");
  const fromUid = String(user.id);
  if (!Number.isFinite(amount) || amount < 1) throw new Error("Amount must be at least 1.");
  if (amount > P2P_TX_CAP) throw new Error(`Max per transfer is ${money(P2P_TX_CAP)}.`);
  const friendshipId = sortedPairId(fromUid, toUid);
  const todayKey = getTodayKeyLocal();
  const nowMs = Date.now();
  const statsRef = firestoreDb.collection("user_stats").doc(fromUid).collection("daily").doc(todayKey);
  const fromRef = firestoreDb.collection("users").doc(fromUid);
  const toRef = firestoreDb.collection("users").doc(toUid);
  const friendshipRef = firestoreDb.collection("friendships").doc(friendshipId);
  const txRef = firestoreDb.collection("transactions").doc();

  await firestoreDb.runTransaction(async (tx) => {
    const [friendshipSnap, fromSnap, toSnap, statsSnap] = await Promise.all([
      tx.get(friendshipRef),
      tx.get(fromRef),
      tx.get(toRef),
      tx.get(statsRef)
    ]);
    if (!friendshipSnap.exists) throw new Error("Not friends.");
    const friendship = friendshipSnap.data() || {};
    if (String(friendship.status || "") !== "accepted") throw new Error("Can only send money to accepted friends.");
    const fromData = fromSnap.data() || {};
    const toData = toSnap.data() || {};
    const fromBalance = round2(Math.max(0, Number(fromData.balance) || 0));
    const toBalance = round2(Math.max(0, Number(toData.balance) || 0));
    if (fromBalance < amount) throw new Error("Insufficient balance.");

    const stats = statsSnap.exists ? statsSnap.data() || {} : {};
    const outgoingTotal = round2(Math.max(0, Number(stats.outgoingTransfersTotal) || 0));
    const lastTransferAt = Number(stats.lastTransferAtMs) || 0;
    if (nowMs - lastTransferAt < P2P_COOLDOWN_MS) {
      const wait = formatCountdown(P2P_COOLDOWN_MS - (nowMs - lastTransferAt));
      throw new Error(`Cooldown active: ${wait}`);
    }
    if (outgoingTotal + amount > P2P_DAILY_CAP) {
      throw new Error(`Daily cap reached (${money(P2P_DAILY_CAP)}).`);
    }

    tx.set(statsRef, {
      outgoingTransfersTotal: round2(outgoingTotal + amount),
      lastTransferAtMs: nowMs,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(fromRef, { balance: round2(fromBalance - amount), updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    tx.set(toRef, { balance: round2(toBalance + amount), updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    tx.set(txRef, {
      type: "p2p_transfer",
      fromUid,
      toUid,
      amount: round2(amount),
      note,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  const progress = getProgressOrNull();
  if (progress) {
    progress.balance = round2(Math.max(0, Number(progress.balance) - amount));
    persistDb();
    renderWallet();
    renderCreditsShop();
    renderStats();
  }
  return amount;
}

async function syncCurrentInventoryToFirestore(uid = getCurrentUser()?.id) {
  const progress = getProgressOrNull();
  if (!firestoreDb || !uid || !progress) return;
  const inventory = normalizeCollectionInventory(progress.collectionInventory);
  const batch = firestoreDb.batch();
  for (const item of inventory) {
    const ref = firestoreDb.collection("user_inventory").doc(String(uid)).collection("items").doc(String(item.id));
    batch.set(ref, {
      itemId: String(item.id),
      title: String(item.title),
      imageUrl: String(item.image || ""),
      rarity: normalizeRarity(item.rarity),
      quantity: Math.max(1, Math.floor(Number(item.qty) || 1)),
      acquiredAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      source: "purchase"
    }, { merge: true });
  }
  await batch.commit();
}

async function loadInventoryForUser(uid) {
  if (!firestoreDb || !uid) return [];
  const snap = await firestoreDb.collection("user_inventory").doc(String(uid)).collection("items").get();
  return snap.docs
    .map((doc) => {
      const data = doc.data() || {};
      return {
        itemId: String(data.itemId || doc.id),
        title: String(data.title || "Item"),
        imageUrl: String(data.imageUrl || fallbackImageForTitle(data.title || "item")),
        rarity: normalizeRarity(data.rarity),
        quantity: Math.max(0, Math.floor(Number(data.quantity) || 0))
      };
    })
    .filter((item) => item.quantity > 0);
}

async function refreshTradesData() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  await ensureUserProfileDoc(user);
  await syncCurrentInventoryToFirestore(user.id);
  const uid = String(user.id);
  const [asA, asB] = await Promise.all([
    firestoreDb.collection("trades").where("userA", "==", uid).get(),
    firestoreDb.collection("trades").where("userB", "==", uid).get()
  ]);
  const map = new Map();
  [...asA.docs, ...asB.docs].forEach((doc) => {
    const data = doc.data() || {};
    map.set(doc.id, {
      id: doc.id,
      userA: String(data.userA || ""),
      userB: String(data.userB || ""),
      status: String(data.status || "draft"),
      offerA: normalizeTradeOffer(data.offerA),
      offerB: normalizeTradeOffer(data.offerB),
      lastActionBy: String(data.lastActionBy || ""),
      expiresAtMs: data.expiresAt?.toMillis ? data.expiresAt.toMillis() : Number(data.expiresAtMs) || Date.now() + TRADE_EXPIRE_MS,
      createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    });
  });
  tradesState.trades = Array.from(map.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
  renderTrades();
}

function normalizeTradeOffer(raw) {
  const offer = raw && typeof raw === "object" ? raw : {};
  return {
    items: Array.isArray(offer.items)
      ? offer.items
          .map((item) => ({
            itemId: String(item?.itemId || ""),
            quantity: Math.max(1, Math.floor(Number(item?.quantity) || 1)),
            title: String(item?.title || "Item"),
            imageUrl: String(item?.imageUrl || "")
          }))
          .filter((item) => item.itemId)
          .slice(0, TRADE_MAX_ITEMS_PER_SIDE)
      : [],
    money: round2(clamp(Number(offer.money) || 0, 0, TRADE_MONEY_CAP))
  };
}

function tradeFriendUid(trade, myUid) {
  return trade.userA === myUid ? trade.userB : trade.userA;
}

function myTradeOffer(trade, myUid) {
  return trade.userA === myUid ? trade.offerA : trade.offerB;
}

function renderTrades() {
  if (!ui.tradesView) return;
  const user = getCurrentUser();
  if (!user) {
    ui.myTradesList.innerHTML = '<p class="hint">Sign in to manage trades.</p>';
    return;
  }
  const uid = String(user.id);
  const acceptedFriends = (friendsState.friendships || [])
    .filter((f) => f.status === "accepted")
    .map((f) => friendsOtherUid(f, uid));
  ui.newTradeFriendSelect.innerHTML = acceptedFriends.length
    ? acceptedFriends
        .map((friendUid) => {
          const profile = friendsState.usersById[friendUid] || { username: friendUid.slice(0, 8) };
          return `<option value="${friendUid}">@${profile.username}</option>`;
        })
        .join("")
    : '<option value="">No friends yet</option>';

  const localInventory = normalizeCollectionInventory(user.progress.collectionInventory);
  ui.newTradeInventoryList.innerHTML = "";
  for (const item of localInventory) {
    const row = document.createElement("label");
    row.className = "checkbox-row";
    row.innerHTML = `
      <input type="checkbox" data-role="new-trade-item" data-item-id="${item.id}" />
      <span>${item.title} (Qty ${item.qty})</span>
      <input type="number" min="1" max="${item.qty}" value="1" data-role="new-trade-qty" data-item-id="${item.id}" />
    `;
    ui.newTradeInventoryList.append(row);
  }

  renderTradeEditor(localInventory);

  ui.myTradesList.innerHTML = "";
  if (!tradesState.trades.length) {
    ui.myTradesList.innerHTML = '<p class="hint">No trades yet.</p>';
    return;
  }
  for (const trade of tradesState.trades) {
    const friendUid = tradeFriendUid(trade, uid);
    const friend = friendsState.usersById[friendUid] || { username: friendUid };
    const mine = myTradeOffer(trade, uid);
    const theirs = trade.userA === uid ? trade.offerB : trade.offerA;
    const canAccept = ["proposed", "accepted_by_a", "accepted_by_b"].includes(trade.status) && Date.now() < trade.expiresAtMs;
    const card = document.createElement("article");
    card.className = "admin-row";
    card.innerHTML = `
      <div class="admin-row-body">
        <div class="admin-row-head">
          <strong class="admin-title">Trade with @${friend.username}</strong>
          <span class="admin-meta">${trade.status}</span>
        </div>
        <p class="admin-meta">Mine: ${mine.items.length} items + ${money(mine.money)} | Theirs: ${theirs.items.length} items + ${money(theirs.money)}</p>
        <p class="admin-meta">Expires: ${new Date(trade.expiresAtMs).toLocaleString()}</p>
        <div class="admin-row-controls">
          <button type="button" data-action="edit-trade-offer" data-trade-id="${trade.id}">Edit My Offer</button>
          <button type="button" data-action="accept-trade" data-trade-id="${trade.id}" ${canAccept ? "" : "disabled"}>Accept</button>
          <button type="button" data-action="cancel-trade" data-trade-id="${trade.id}">Cancel</button>
        </div>
      </div>
    `;
    ui.myTradesList.append(card);
  }
}

function renderTradeEditor(localInventory) {
  if (!ui.tradeEditPanel) return;
  if (!activeTradeEditId) {
    ui.tradeEditPanel.classList.add("hidden");
    return;
  }
  const trade = tradesState.trades.find((entry) => entry.id === activeTradeEditId);
  const user = getCurrentUser();
  if (!trade || !user) {
    ui.tradeEditPanel.classList.add("hidden");
    return;
  }
  const uid = String(user.id);
  const myOffer = myTradeOffer(trade, uid);
  ui.tradeEditPanel.classList.remove("hidden");
  const friendUid = tradeFriendUid(trade, uid);
  const friend = friendsState.usersById[friendUid] || { username: friendUid };
  ui.tradeEditMeta.textContent = `Editing offer for trade with @${friend.username}.`;
  ui.tradeEditMoneyInput.value = String(Math.floor(Number(myOffer.money) || 0));
  const picked = new Map(myOffer.items.map((item) => [item.itemId, item.quantity]));
  ui.tradeEditInventoryList.innerHTML = "";
  for (const item of localInventory) {
    const qty = picked.get(item.id) || 1;
    const checked = picked.has(item.id) ? "checked" : "";
    const row = document.createElement("label");
    row.className = "checkbox-row";
    row.innerHTML = `
      <input type="checkbox" data-role="edit-trade-item" data-item-id="${item.id}" ${checked} />
      <span>${item.title} (Qty ${item.qty})</span>
      <input type="number" min="1" max="${item.qty}" value="${qty}" data-role="edit-trade-qty" data-item-id="${item.id}" />
    `;
    ui.tradeEditInventoryList.append(row);
  }
}

async function handleCreateTrade() {
  const user = getCurrentUser();
  if (!firestoreDb || !user) return;
  const friendUid = String(ui.newTradeFriendSelect?.value || "");
  if (!friendUid) {
    setTradesMessage("Choose a friend first.", true);
    return;
  }
  const accepted = (friendsState.friendships || []).some((f) => {
    const other = friendsOtherUid(f, String(user.id));
    return other === friendUid && f.status === "accepted";
  });
  if (!accepted) {
    setTradesMessage("You can trade only with accepted friends.", true);
    return;
  }
  const offerItems = collectOfferItemsFromContainer(ui.newTradeInventoryList, "new-trade");
  if (offerItems.length > TRADE_MAX_ITEMS_PER_SIDE) {
    setTradesMessage(`Max ${TRADE_MAX_ITEMS_PER_SIDE} items per trade.`, true);
    return;
  }
  const money = clamp(Math.floor(Number(ui.newTradeMoneyInput.value || 0)), 0, TRADE_MONEY_CAP);
  const tradeRef = firestoreDb.collection("trades").doc();
  await tradeRef.set({
    userA: String(user.id),
    userB: friendUid,
    status: "proposed",
    lastActionBy: String(user.id),
    offerA: { items: offerItems, money },
    offerB: { items: [], money: 0 },
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + TRADE_EXPIRE_MS),
    expiresAtMs: Date.now() + TRADE_EXPIRE_MS
  });
  setTradesMessage("Trade proposed.");
  await refreshTradesData();
}

function collectOfferItemsFromContainer(container, prefix) {
  if (!container) return [];
  const selected = Array.from(container.querySelectorAll(`input[data-role='${prefix}-item']:checked`));
  const result = [];
  for (const checkbox of selected) {
    const itemId = String(checkbox.dataset.itemId || "");
    if (!itemId) continue;
    const qtyInput = container.querySelector(`input[data-role='${prefix}-qty'][data-item-id='${itemId}']`);
    const qty = Math.max(1, Math.floor(Number(qtyInput?.value || 1)));
    const progress = getProgressOrNull();
    const local = normalizeCollectionInventory(progress?.collectionInventory || []).find((item) => item.id === itemId);
    result.push({
      itemId,
      quantity: qty,
      title: local?.title || "Item",
      imageUrl: local?.image || ""
    });
  }
  return result.slice(0, TRADE_MAX_ITEMS_PER_SIDE);
}

function handleTradesViewClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = String(button.dataset.action || "");
  const tradeId = String(button.dataset.tradeId || "");
  if (!tradeId) return;
  if (action === "edit-trade-offer") {
    activeTradeEditId = tradeId;
    renderTrades();
    return;
  }
  if (action === "accept-trade") {
    acceptTrade(tradeId).catch((error) => {
      setTradesMessage(error?.message || "Accept failed.", true);
    });
    return;
  }
  if (action === "cancel-trade") {
    if (!confirm("Cancel this trade?")) return;
    cancelTrade(tradeId).catch((error) => {
      setTradesMessage(error?.message || "Cancel failed.", true);
    });
  }
}

async function handleSaveTradeOffer() {
  if (!activeTradeEditId) return;
  const money = clamp(Math.floor(Number(ui.tradeEditMoneyInput.value || 0)), 0, TRADE_MONEY_CAP);
  const items = collectOfferItemsFromContainer(ui.tradeEditInventoryList, "edit-trade");
  await saveMyTradeOffer(activeTradeEditId, { items, money });
  setTradesMessage("Offer saved.");
  await refreshTradesData();
}

async function saveMyTradeOffer(tradeId, offer) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required.");
  const uid = String(user.id);
  const ref = firestoreDb.collection("trades").doc(String(tradeId));
  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Trade not found.");
    const data = snap.data() || {};
    if (![String(data.userA), String(data.userB)].includes(uid)) throw new Error("Not your trade.");
    if (Date.now() > Number(data.expiresAtMs || Date.now() + 1)) throw new Error("Trade expired.");
    const update = uid === String(data.userA) ? { offerA: offer } : { offerB: offer };
    tx.update(ref, {
      ...update,
      status: "proposed",
      lastActionBy: uid,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

async function acceptTrade(tradeId) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required.");
  const uid = String(user.id);
  const ref = firestoreDb.collection("trades").doc(String(tradeId));

  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Trade not found.");
    const trade = snap.data() || {};
    const userA = String(trade.userA || "");
    const userB = String(trade.userB || "");
    if (uid !== userA && uid !== userB) throw new Error("Not a participant.");
    if (Date.now() > Number(trade.expiresAtMs || 0)) {
      tx.update(ref, { status: "expired", updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() });
      throw new Error("Trade expired.");
    }
    const status = String(trade.status || "draft");
    if (["completed", "canceled", "expired"].includes(status)) throw new Error("Trade closed.");

    const mineIsA = uid === userA;
    if (status === "proposed") {
      tx.update(ref, {
        status: mineIsA ? "accepted_by_a" : "accepted_by_b",
        lastActionBy: uid,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
      return;
    }
    if ((status === "accepted_by_a" && mineIsA) || (status === "accepted_by_b" && !mineIsA)) {
      throw new Error("You already accepted.");
    }
    if (status !== "accepted_by_a" && status !== "accepted_by_b") {
      throw new Error("Trade not ready.");
    }

    const offerA = normalizeTradeOffer(trade.offerA);
    const offerB = normalizeTradeOffer(trade.offerB);
    await executeTradeCompletionInTransaction(tx, ref, {
      tradeId,
      userA,
      userB,
      offerA,
      offerB
    });
  });

  await refreshTradesData();
  await syncCurrentBalanceFromFirestore();
  setTradesMessage("Trade accepted.");
}

async function executeTradeCompletionInTransaction(tx, tradeRef, payload) {
  const { tradeId, userA, userB, offerA, offerB } = payload;
  if (offerA.items.length > TRADE_MAX_ITEMS_PER_SIDE || offerB.items.length > TRADE_MAX_ITEMS_PER_SIDE) {
    throw new Error("Too many items in trade.");
  }
  if (offerA.money > TRADE_MONEY_CAP || offerB.money > TRADE_MONEY_CAP) {
    throw new Error("Money offer exceeds cap.");
  }

  const userARef = firestoreDb.collection("users").doc(userA);
  const userBRef = firestoreDb.collection("users").doc(userB);
  const [aSnap, bSnap] = await Promise.all([tx.get(userARef), tx.get(userBRef)]);
  const aBalance = round2(Math.max(0, Number(aSnap.data()?.balance) || 0));
  const bBalance = round2(Math.max(0, Number(bSnap.data()?.balance) || 0));
  if (aBalance < offerA.money || bBalance < offerB.money) {
    throw new Error("One side lacks required balance.");
  }

  for (const item of offerA.items) {
    const fromRef = firestoreDb.collection("user_inventory").doc(userA).collection("items").doc(String(item.itemId));
    const toRef = firestoreDb.collection("user_inventory").doc(userB).collection("items").doc(String(item.itemId));
    const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
    const fromQty = Math.max(0, Math.floor(Number(fromSnap.data()?.quantity) || 0));
    if (fromQty < item.quantity) throw new Error("Trade failed: item unavailable.");
    tx.set(fromRef, { quantity: fromQty - item.quantity }, { merge: true });
    const toQty = Math.max(0, Math.floor(Number(toSnap.data()?.quantity) || 0));
    tx.set(
      toRef,
      {
        itemId: String(item.itemId),
        title: String(item.title || fromSnap.data()?.title || "Item"),
        imageUrl: String(item.imageUrl || fromSnap.data()?.imageUrl || ""),
        rarity: normalizeRarity(fromSnap.data()?.rarity || "common"),
        quantity: toQty + item.quantity,
        source: "trade",
        acquiredAt: window.firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  for (const item of offerB.items) {
    const fromRef = firestoreDb.collection("user_inventory").doc(userB).collection("items").doc(String(item.itemId));
    const toRef = firestoreDb.collection("user_inventory").doc(userA).collection("items").doc(String(item.itemId));
    const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
    const fromQty = Math.max(0, Math.floor(Number(fromSnap.data()?.quantity) || 0));
    if (fromQty < item.quantity) throw new Error("Trade failed: item unavailable.");
    tx.set(fromRef, { quantity: fromQty - item.quantity }, { merge: true });
    const toQty = Math.max(0, Math.floor(Number(toSnap.data()?.quantity) || 0));
    tx.set(
      toRef,
      {
        itemId: String(item.itemId),
        title: String(item.title || fromSnap.data()?.title || "Item"),
        imageUrl: String(item.imageUrl || fromSnap.data()?.imageUrl || ""),
        rarity: normalizeRarity(fromSnap.data()?.rarity || "common"),
        quantity: toQty + item.quantity,
        source: "trade",
        acquiredAt: window.firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  tx.set(userARef, { balance: round2(aBalance - offerA.money + offerB.money), updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  tx.set(userBRef, { balance: round2(bBalance - offerB.money + offerA.money), updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  if (offerA.money > 0) {
    tx.set(firestoreDb.collection("transactions").doc(), {
      type: "trade_transfer",
      fromUid: userA,
      toUid: userB,
      amount: round2(offerA.money),
      relatedTradeId: tradeId,
      note: "Trade money offer",
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  if (offerB.money > 0) {
    tx.set(firestoreDb.collection("transactions").doc(), {
      type: "trade_transfer",
      fromUid: userB,
      toUid: userA,
      amount: round2(offerB.money),
      relatedTradeId: tradeId,
      note: "Trade money offer",
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  tx.update(tradeRef, {
    status: "completed",
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function cancelTrade(tradeId) {
  const user = getCurrentUser();
  if (!firestoreDb || !user) throw new Error("Sign in required.");
  const uid = String(user.id);
  const ref = firestoreDb.collection("trades").doc(String(tradeId));
  await firestoreDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Trade missing.");
    const data = snap.data() || {};
    if (![String(data.userA), String(data.userB)].includes(uid)) throw new Error("Not participant.");
    const status = String(data.status || "");
    if (["completed", "expired"].includes(status)) throw new Error("Cannot cancel closed trade.");
    tx.update(ref, {
      status: "canceled",
      lastActionBy: uid,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  setTradesMessage("Trade canceled.");
  await refreshTradesData();
}

function chunkArray(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

function renderDailyJobs() {
  if (!ui.jobsList || !ui.jobsActiveCard || !ui.jobsMeta) return;
  const user = getCurrentUser();
  if (!user) {
    ui.jobsActiveCard.classList.add("hidden");
    ui.jobsList.innerHTML = '<p class="hint">Sign in to use Daily Jobs.</p>';
    ui.jobsMeta.textContent = "Sign in required.";
    return;
  }

  const state = ensureDailyJobsStateFresh(user);
  const now = Date.now();
  const capRemaining = Math.max(0, JOB_DAILY_EARNINGS_CAP - (Number(state.todayEarnings) || 0));
  const cooldownRemainingMs = Math.max(0, Number(state.cooldownUntil || 0) - now);
  const activeJob = state.activeJobId ? state.jobs.find((job) => job.id === state.activeJobId) : null;
  const activeRemainingMs = activeJob ? Math.max(0, Number(state.endsAt || 0) - now) : 0;
  const hasActive = Boolean(activeJob);
  const readyToClaim = hasActive && activeRemainingMs <= 0 && !state.claimed;

  ui.jobsMeta.textContent = `Today earned: ${money(Number(state.todayEarnings) || 0)} / ${money(JOB_DAILY_EARNINGS_CAP)} • Remaining cap: ${money(capRemaining)}`;

  if (hasActive) {
    ui.jobsActiveCard.classList.remove("hidden");
    ui.jobsActiveCard.innerHTML = `
      <div class="jobs-active-head">
        <strong>Active Job: ${activeJob.title}</strong>
        <span class="jobs-difficulty ${activeJob.difficulty.toLowerCase()}">${activeJob.difficulty}</span>
      </div>
      <p class="hint">${activeJob.description}</p>
      <p><strong>Payout:</strong> ${money(activeJob.payout)} • <strong>Duration:</strong> ${formatJobDuration(activeJob.durationMs)}</p>
      <p><strong>Status:</strong> ${readyToClaim ? "Completed" : `In progress (${formatCountdown(activeRemainingMs)})`}</p>
      ${readyToClaim ? '<button type="button" data-action="claim-job">Claim Reward</button>' : ""}
    `;
  } else {
    ui.jobsActiveCard.classList.add("hidden");
    ui.jobsActiveCard.innerHTML = "";
  }

  const acceptBlockedByCooldown = cooldownRemainingMs > 0;
  const acceptBlockedByCap = capRemaining <= 0;
  ui.jobsList.innerHTML = "";
  for (const job of state.jobs) {
    const card = document.createElement("article");
    card.className = "jobs-card";
    const blockedByActive = hasActive;
    const canAccept = !blockedByActive && !acceptBlockedByCooldown && !acceptBlockedByCap;
    let buttonText = "Accept";
    if (blockedByActive) buttonText = "Job Active";
    else if (acceptBlockedByCooldown) buttonText = `Cooldown ${formatCountdown(cooldownRemainingMs)}`;
    else if (acceptBlockedByCap) buttonText = "Daily Cap Reached";
    card.innerHTML = `
      <div class="jobs-card-head">
        <strong>${job.title}</strong>
        <span class="jobs-difficulty ${job.difficulty.toLowerCase()}">${job.difficulty}</span>
      </div>
      <p class="hint">${job.description}</p>
      <p><strong>Duration:</strong> ${formatJobDuration(job.durationMs)} • <strong>Payout:</strong> ${money(job.payout)}</p>
      <button type="button" data-action="accept-job" data-job-id="${job.id}" ${canAccept ? "" : "disabled"}>${buttonText}</button>
    `;
    ui.jobsList.append(card);
  }
}

function handleJobsAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = String(button.dataset.action || "");
  if (action === "accept-job") {
    const jobId = String(button.dataset.jobId || "");
    if (!jobId) return;
    acceptDailyJob(jobId);
    return;
  }
  if (action === "claim-job") {
    claimDailyJob();
  }
}

function acceptDailyJob(jobId) {
  const user = getCurrentUser();
  if (!user) {
    ensureSignedIn("Sign in first to accept jobs.");
    return;
  }
  const state = ensureDailyJobsStateFresh(user);
  const now = Date.now();
  const cooldownRemainingMs = Math.max(0, Number(state.cooldownUntil || 0) - now);
  if (state.activeJobId) {
    setJobsMessage("You already have an active job.", true);
    renderDailyJobs();
    return;
  }
  if (cooldownRemainingMs > 0) {
    setJobsMessage(`Cooldown active: ${formatCountdown(cooldownRemainingMs)} remaining.`, true);
    renderDailyJobs();
    return;
  }
  if ((Number(state.todayEarnings) || 0) >= JOB_DAILY_EARNINGS_CAP) {
    setJobsMessage("Daily jobs cap reached. Come back tomorrow.", true);
    renderDailyJobs();
    return;
  }
  const job = state.jobs.find((entry) => entry.id === jobId);
  if (!job) {
    setJobsMessage("Job not found.", true);
    return;
  }

  state.activeJobId = job.id;
  state.acceptedAt = now;
  state.endsAt = now + Number(job.durationMs);
  state.claimed = false;
  persistDb();
  setJobsMessage(`Accepted: ${job.title}`);
  renderDailyJobs();
}

function claimDailyJob() {
  const user = getCurrentUser();
  if (!user) {
    ensureSignedIn("Sign in first to claim jobs.");
    return;
  }
  const state = ensureDailyJobsStateFresh(user);
  const now = Date.now();
  if (!state.activeJobId) {
    setJobsMessage("No active job to claim.", true);
    return;
  }
  const activeJob = state.jobs.find((entry) => entry.id === state.activeJobId);
  if (!activeJob) {
    state.activeJobId = null;
    state.acceptedAt = null;
    state.endsAt = null;
    state.claimed = false;
    persistDb();
    setJobsMessage("Active job was reset.", true);
    renderDailyJobs();
    return;
  }
  if (Number(state.endsAt || 0) > now) {
    setJobsMessage(`Job still in progress: ${formatCountdown(Number(state.endsAt || 0) - now)} remaining.`, true);
    return;
  }

  const remainingCap = Math.max(0, JOB_DAILY_EARNINGS_CAP - (Number(state.todayEarnings) || 0));
  const payout = round2(Math.max(0, Math.min(Number(activeJob.payout) || 0, remainingCap)));
  if (payout > 0) {
    addMoney(payout, "job_reward", { jobId: activeJob.id, title: activeJob.title, todayKey: state.todayKey });
    state.todayEarnings = round2((Number(state.todayEarnings) || 0) + payout);
  }

  state.claimed = true;
  state.activeJobId = null;
  state.acceptedAt = null;
  state.endsAt = null;
  state.cooldownUntil = now + JOB_CLAIM_COOLDOWN_MS;
  persistDb();

  if (payout > 0) {
    setJobsMessage(`Reward claimed: ${money(payout)} added to wallet.`);
  } else {
    setJobsMessage("Daily cap reached. Job completed with no payout.");
  }
  renderWallet();
  renderStats();
  renderDailyJobs();
}

function ensureDailyJobsStateFresh(user) {
  const progress = user.progress;
  const todayKey = getTodayKeyLocal();
  if (!progress.jobsState || typeof progress.jobsState !== "object") {
    progress.jobsState = buildInitialJobsState(user.id, todayKey);
  }
  const state = progress.jobsState;
  if (state.todayKey !== todayKey) {
    progress.jobsState = buildInitialJobsState(user.id, todayKey);
    return progress.jobsState;
  }
  if (!Array.isArray(state.jobs) || !state.jobs.length) {
    state.jobs = generateDailyJobsForUser(user.id, todayKey);
  }
  if (state.activeJobId && !state.jobs.some((job) => job.id === state.activeJobId)) {
    state.activeJobId = null;
    state.acceptedAt = null;
    state.endsAt = null;
    state.claimed = false;
  }
  return state;
}

function buildInitialJobsState(userId, todayKey) {
  return {
    todayKey,
    jobs: generateDailyJobsForUser(userId, todayKey),
    activeJobId: null,
    acceptedAt: null,
    endsAt: null,
    claimed: false,
    todayEarnings: 0,
    cooldownUntil: null
  };
}

function generateDailyJobsForUser(userId, todayKey) {
  const rng = createSeededRandom(`${userId}|${todayKey}|daily-jobs`);
  const jobsCount = 6 + Math.floor(rng() * 5);
  const pool = shuffleWithRng(JOB_POOL.slice(), rng);
  const jobs = [];
  for (let i = 0; i < jobsCount; i += 1) {
    const template = pool[i % pool.length];
    const durationMinutes = JOB_MIN_DURATION_MINUTES + Math.floor(rng() * (JOB_MAX_DURATION_MINUTES - JOB_MIN_DURATION_MINUTES + 1));
    const durationMs = durationMinutes * 60 * 1000;
    const difficulty = durationMinutes <= 8 ? "Easy" : durationMinutes <= 18 ? "Medium" : "Hard";
    const diffBonus = difficulty === "Hard" ? 70 : difficulty === "Medium" ? 35 : 0;
    const base = durationMinutes * (8 + rng() * 6) + diffBonus;
    const payout = clamp(Math.round(base), JOB_MIN_PAYOUT, JOB_MAX_PAYOUT);
    jobs.push({
      id: `${todayKey}-${i + 1}-${Math.floor(rng() * 1000000)}`,
      title: template.title,
      description: template.description,
      durationMs,
      payout: round2(payout),
      difficulty
    });
  }
  return jobs;
}

function setJobsMessage(message, isError = false) {
  if (!ui.jobsMsg) return;
  ui.jobsMsg.textContent = message;
  ui.jobsMsg.classList.toggle("error", isError);
}

function getTodayKeyLocal(ts = Date.now()) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashStringToInt(value) {
  let hash = 2166136261;
  const str = String(value || "");
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seedSource) {
  let seed = hashStringToInt(seedSource);
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatJobDuration(durationMs) {
  const minutes = Math.max(1, Math.round(Number(durationMs || 0) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function handleCollectionAction(event) {
  const target = event.target.closest(".collection-sell-btn");
  if (!target) return;
  const itemId = target.dataset.id;
  if (!itemId) return;

  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to manage collection.")) return;
  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  const inventory = normalizeCollectionInventory(nextProgress.collectionInventory);
  const item = inventory.find((entry) => entry.id === itemId);
  if (!item || item.qty <= 0) return;

  if (item.rarity === "mythic" && Number(nextProgress.lastMythicSaleAt || 0) > Date.now() - MYTHIC_SELL_COOLDOWN_MS) {
    const waitMs = MYTHIC_SELL_COOLDOWN_MS - (Date.now() - Number(nextProgress.lastMythicSaleAt || 0));
    setCheckoutMessage(`Mythic sale cooldown active: ${formatCountdown(waitMs)} remaining.`, true);
    return;
  }

  const result = computeSaleResult(item);
  const payout = result.netValue;
  item.qty -= 1;
  nextProgress.balance = round2((Number(nextProgress.balance) || 0) + payout);
  nextProgress.totalFromSales = round2((Number(nextProgress.totalFromSales) || 0) + payout);
  if (item.rarity === "mythic") {
    nextProgress.lastMythicSaleAt = Date.now();
  }
  nextProgress.collectionInventory = inventory.filter((entry) => entry.qty > 0);
  persistDb();
  syncCurrentUserEconomyToFirestore().catch(() => {});
  setCheckoutMessage(`Sold ${item.title} for ${money(payout)}. ${result.marketMessage}`);
  const card = target.closest(".collection-card");
  if (card) {
    card.classList.remove("flash-surge", "flash-crash");
    if (result.marketEvent === "surge") {
      card.classList.add("flash-surge");
    } else if (result.marketEvent === "crash") {
      card.classList.add("flash-crash");
    }
    setTimeout(() => card.classList.remove("flash-surge", "flash-crash"), 800);
  }
  renderWallet();
  renderCollection();
  renderStats();
}

function addToCart(productId) {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to add items.")) return;

  const nextProgress = getProgressOrNull();
  const product = findProductById(productId);
  if (!nextProgress || !product) return;
  if (Number(product.stock) === 0) {
    setCheckoutMessage("This item is sold out.", true);
    return;
  }
  if (product.ageRestricted && !nextProgress.hasAgeId) {
    setCheckoutMessage("This is a 21+ item. Buy a 21+ ID in Add Funds first.", true);
    return;
  }

  nextProgress.cart[productId] = (nextProgress.cart[productId] || 0) + 1;
  persistDb();
  renderCart();
}

async function handlePreviewReviewSubmit(event) {
  event.preventDefault();
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to review listings.")) return;
  if (!activeListingId) return;

  const product = findProductById(activeListingId);
  const user = getCurrentUser();
  if (!product || !user) return;

  const form = new FormData(event.currentTarget);
  const rating = clamp(Number(form.get("rating") || 5), 1, 5);
  const text = String(form.get("text") || "").trim();
  if (!text) {
    ui.previewReviewMsg.textContent = "Review text is required.";
    ui.previewReviewMsg.classList.add("error");
    return;
  }

  const review = {
    id: crypto.randomUUID(),
    username: user.username,
    rating: Math.round(rating),
    text: text.slice(0, 240),
    createdAt: new Date().toISOString()
  };

  const key = String(product.id || "");
  if (!key) return;

  if (firestoreDb) {
    try {
      const listingRef = firestoreDb.collection("listings").doc(key);
      await listingRef.update({
        reviews: window.firebase.firestore.FieldValue.arrayUnion(review)
      });
      if (!Array.isArray(product.reviews)) {
        product.reviews = [];
      }
      product.reviews.push(review);
      ui.previewReviewForm.reset();
      ui.previewReviewMsg.textContent = "Review posted.";
      ui.previewReviewMsg.classList.remove("error");
      renderListingPreview();
      renderProducts();
      return;
    } catch (error) {
      console.error("[Firestore] review write failed:", error);
      ui.previewReviewMsg.textContent = "Review save failed online. Saved locally only.";
      ui.previewReviewMsg.classList.add("error");
    }
  }

  if (!db.listingReviews || typeof db.listingReviews !== "object") {
    db.listingReviews = {};
  }
  if (!Array.isArray(db.listingReviews[key])) {
    db.listingReviews[key] = [];
  }
  db.listingReviews[key].push(review);
  db.listingReviews[key] = normalizeReviews(db.listingReviews[key]).slice(-500);

  persistDb();
  ui.previewReviewForm.reset();
  ui.previewReviewMsg.textContent = "Review posted.";
  ui.previewReviewMsg.classList.remove("error");
  renderListingPreview();
  renderProducts();
  renderCreditsShop();
}

function updateQty(productId, op) {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to edit your cart.")) return;

  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  const qty = nextProgress.cart[productId] || 0;
  if (!qty) return;

  if (op === "inc") {
    nextProgress.cart[productId] = qty + 1;
  } else if (op === "dec") {
    nextProgress.cart[productId] = Math.max(1, qty - 1);
  } else if (op === "remove") {
    delete nextProgress.cart[productId];
  }

  persistDb();
  renderCart();
}

function clearCart() {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to clear your cart.")) return;

  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  nextProgress.cart = {};
  setCheckoutMessage("");
  persistDb();
  renderCart();
}

async function checkout() {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to buy items.")) return;

  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  const totals = cartTotals();
  if (!totals.items) {
    setCheckoutMessage("Add fake items first.", true);
    return;
  }

  if (nextProgress.balance < totals.total) {
    setCheckoutMessage("Not enough money. Use the Add Funds tab.", true);
    return;
  }

  const cartProductIds = Object.keys(nextProgress.cart);
  const hasBlocked21Item = cartProductIds.some((id) => {
    const product = findProductById(id);
    return product?.ageRestricted && !nextProgress.hasAgeId;
  });
  if (hasBlocked21Item) {
    setCheckoutMessage("Your cart contains 21+ items. Buy a 21+ ID in Add Funds first.", true);
    return;
  }

  const products = Object.entries(nextProgress.cart)
    .map(([id, qty]) => {
      const product = findProductById(id);
      return product ? `${product.title} x${qty}` : null;
    })
    .filter(Boolean);
  const lineItems = [];
  let pityCounter = Math.max(0, Number(nextProgress.pityNoLegendaryCount) || 0);
  for (const [id, qty] of Object.entries(nextProgress.cart)) {
    const product = findProductById(id);
    if (!product) continue;
    for (let i = 0; i < qty; i += 1) {
      const rarity = rollRarityForPurchase(product.price, pityCounter);
      const conditions = rollConditionModifiers();
      lineItems.push({
        productId: product.id,
        title: product.title,
        qty: 1,
        image: product.image,
        price: product.price,
        rarity,
        conditions
      });
      if (rarity === "legendary" || rarity === "mythic") {
        pityCounter = 0;
      } else {
        pityCounter += 1;
      }
    }
  }
  nextProgress.pityNoLegendaryCount = pityCounter;
  const shipping = generateShippingDetails();

  nextProgress.orders.unshift({
    id: crypto.randomUUID(),
    itemCount: totals.items,
    total: totals.total,
    products,
    lineItems,
    createdAt: new Date().toISOString(),
    shipping
  });

  try {
    for (const [id, qty] of Object.entries(nextProgress.cart)) {
      for (let i = 0; i < qty; i += 1) {
        await buyListing(id);
      }
    }
  } catch (error) {
    console.error("[Firestore] buyListing failed during checkout:", error);
  }

  nextProgress.balance = round2(nextProgress.balance - totals.total);
  nextProgress.totalSpent = round2((Number(nextProgress.totalSpent) || 0) + totals.total);
  nextProgress.cart = {};
  setCheckoutMessage("thank you!");
  persistDb();
  syncCurrentUserEconomyToFirestore().catch(() => {});
  renderWallet();
  renderCreditsShop();
  renderCart();
  renderOrders();
  renderCollection();
  checkForDeliveredItems();
  renderStats();
}

function generateShippingDetails() {
  const carriers = ["MegaShip", "PrimeParcel", "SkyPost", "RocketExpress"];
  const services = ["Standard", "Priority", "2-Day", "Overnight"];
  const cities = ["Austin, TX", "Miami, FL", "Seattle, WA", "Denver, CO", "Phoenix, AZ", "Chicago, IL"];

  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const service = services[Math.floor(Math.random() * services.length)];
  const destination = cities[Math.floor(Math.random() * cities.length)];
  const etaMinutes = 1 + Math.floor(Math.random() * 4);
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + etaMinutes);
  const trackingId = `${carrier.slice(0, 2).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  return {
    carrier,
    service,
    trackingId,
    etaTs: eta.getTime(),
    destination,
    status: "In transit"
  };
}

function defaultShippingDetails() {
  return {
    carrier: "MegaShip",
    service: "Standard",
    trackingId: "PENDING",
    etaTs: null,
    destination: "Address on file",
    status: "Preparing shipment"
  };
}

function getShippingSnapshot(order) {
  const shipping = { ...defaultShippingDetails(), ...(order.shipping || {}) };
  const etaTs = Number(shipping.etaTs) || Date.now();
  const isDelivered = Date.now() >= etaTs;
  return {
    ...shipping,
    etaTs,
    etaLabel: new Date(etaTs).toLocaleString(),
    status: isDelivered ? "Delivered" : "In transit",
    isDelivered
  };
}

function shippingProgressPercent(order, shippingSnapshot) {
  if (shippingSnapshot.isDelivered) return 100;
  const startTs = new Date(order.createdAt || Date.now()).getTime();
  const endTs = Number(shippingSnapshot.etaTs) || startTs;
  if (endTs <= startTs) return 0;
  const pct = ((Date.now() - startTs) / (endTs - startTs)) * 100;
  return Math.max(0, Math.min(99, Math.round(pct)));
}

function checkForDeliveredItems() {
  const progress = getProgressOrNull();
  if (!progress) return;

  if (!Array.isArray(progress.notifiedDeliveredOrderIds)) {
    progress.notifiedDeliveredOrderIds = [];
  }
  const inventory = normalizeCollectionInventory(progress.collectionInventory);
  const inventoryByProduct = new Map(
    inventory.map((item) => [collectionStackKey(item), item])
  );

  const seen = new Set(progress.notifiedDeliveredOrderIds);
  const newlyDelivered = [];

  for (const order of progress.orders || []) {
    const shipping = getShippingSnapshot(order);
    const hasTrackableEta = Number(order?.shipping?.etaTs) > 0;
    if (hasTrackableEta && shipping.isDelivered && !seen.has(order.id)) {
      newlyDelivered.push(order);
      seen.add(order.id);
    }
  }

  if (!newlyDelivered.length) return;

  for (const order of newlyDelivered) {
    const deliveredItems = expandOrderItemsByQuantity(getOrderItems(order));
    for (const delivered of deliveredItems) {
      const resolvedImage = resolveOrderItemImage(delivered);
      const valueEach = round2(Number(delivered.price) || Number(findProductById(delivered.productId)?.price) || 1);
      const key = collectionStackKey(delivered);
      const existing = inventoryByProduct.get(key);
      if (existing) {
        existing.qty += 1;
        if (!existing.image) existing.image = resolvedImage;
      } else {
        const entry = {
          id: crypto.randomUUID(),
          productId: delivered.productId || null,
          title: delivered.title,
          image: resolvedImage,
          qty: 1,
          valueEach,
          rarity: normalizeRarity(delivered.rarity),
          conditions: normalizeConditions(delivered.conditions)
        };
        inventory.push(entry);
        inventoryByProduct.set(key, entry);
      }
    }
  }

  progress.collectionInventory = inventory;
  progress.notifiedDeliveredOrderIds = Array.from(seen);
  persistDb();
  syncCurrentInventoryToFirestore(getCurrentUser()?.id).catch(() => {});

  for (const order of newlyDelivered) {
    const deliveredItems = expandOrderItemsByQuantity(getOrderItems(order));
    const first = deliveredItems[0];
    const firstTitle = first?.title || "item";
    const firstImage = resolveOrderItemImage(first);
    deliveryPopupQueue.push({
      text: `Delivery arrived: ${firstTitle}`,
      image: firstImage
    });
    if (deliveredItems.some((item) => item.rarity === "mythic")) {
      deliveryPopupQueue.push({
        text: "MYTHIC PULL",
        image: firstImage,
        kind: "mythic"
      });
    }
  }
  showNextDeliveryPopup();
}

function getOrderItems(order) {
  const lineItems = Array.isArray(order?.lineItems) ? order.lineItems : [];
  if (lineItems.length) {
    return lineItems.map((item) => ({
      productId: item.productId || null,
      title: String(item.title || "Delivered item"),
      qty: Math.max(1, Number(item.qty) || 1),
      image: item.image || null,
      price: round2(Math.max(0.01, Number(item.price) || 0.01)),
      rarity: normalizeRarity(item.rarity),
      conditions: normalizeConditions(item.conditions)
    }));
  }

  const products = Array.isArray(order?.products) ? order.products : [];
  if (!products.length) {
    const fallbackQty = Math.max(1, Number(order?.itemCount) || 1);
    return [{ productId: null, title: "Delivered item", qty: fallbackQty, image: null }];
  }

  const parsed = products.map((entry) => parseOrderProductEntry(entry));
  const totalQty = parsed.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  const expectedQty = Math.max(1, Number(order?.itemCount) || totalQty || 1);
  if (totalQty < expectedQty) {
    parsed.push({
      productId: null,
      title: "Delivered item",
      qty: expectedQty - totalQty,
      image: null,
      price: 1,
      rarity: "common",
      conditions: []
    });
  }
  return parsed;
}

function expandOrderItemsByQuantity(items) {
  if (!Array.isArray(items) || !items.length) return [];
  const expanded = [];
  for (const item of items) {
    const qty = Math.max(1, Number(item?.qty) || 1);
    for (let i = 0; i < qty; i += 1) {
      expanded.push({
        ...item,
        qty: 1
      });
    }
  }
  return expanded;
}

function parseOrderProductEntry(entry) {
  const raw = String(entry || "").trim();
  if (!raw) {
    return { productId: null, title: "Delivered item", qty: 1, image: null };
  }

  const match = raw.match(/^(.*)\sx(\d+)$/i);
  const title = (match ? match[1] : raw).trim();
  const qty = match ? Math.max(1, Number(match[2]) || 1) : 1;
  const source = findProductByTitle(title);

  return {
    productId: source?.id || null,
    title,
    qty,
    image: source?.image || null,
    price: round2(Math.max(0.01, Number(source?.price) || 1)),
    rarity: normalizeRarity("common"),
    conditions: []
  };
}

function collectionStackKey(item) {
  const productPart = item.productId ? `id:${item.productId}` : `title:${String(item.title || "").trim().toLowerCase()}`;
  const rarityPart = normalizeRarity(item.rarity);
  const conditionsPart = normalizeConditions(item.conditions)
    .slice()
    .sort()
    .join("|");
  return `${productPart}::${rarityPart}::${conditionsPart}`;
}

function resolveOrderItemImage(item) {
  if (!item) return fallbackImageForTitle("item");
  if (item.image) return item.image;
  if (item.productId) {
    const sourceById = findProductById(item.productId);
    if (sourceById?.image) return sourceById.image;
  }
  const sourceByTitle = findProductByTitle(item.title);
  if (sourceByTitle?.image) return sourceByTitle.image;
  return fallbackImageForTitle(item.title || "item");
}

function showNextDeliveryPopup() {
  if (!deliveryPopupQueue.length) return;
  const payload = deliveryPopupQueue.shift();
  ui.deliveryPopupText.textContent = payload.text;
  ui.deliveryPopupImage.src = payload.image;
  ui.deliveryPopupImage.alt = payload.text;
  ui.deliveryPopup.classList.toggle("mythic-popup", payload.kind === "mythic");
  ui.deliveryPopup.classList.remove("hidden");
}

function hideDeliveryPopup() {
  ui.deliveryPopup.classList.remove("mythic-popup");
  ui.deliveryPopup.classList.add("hidden");
  if (deliveryPopupQueue.length) {
    showNextDeliveryPopup();
  }
}

function cartTotals() {
  const progress = getProgressOrNull();
  if (!progress) {
    return { items: 0, total: 0 };
  }

  let items = 0;
  let total = 0;

  for (const [id, qty] of Object.entries(progress.cart)) {
    const product = findProductById(id);
    if (!product) continue;
    items += qty;
    total += product.price * qty;
  }

  return { items, total: round2(total) };
}

async function handleAdminAdd(event) {
  event.preventDefault();
  if (!ensureAdmin()) return;
  setAdminMessage("");

  try {
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "").trim();
    const descriptionInput = String(form.get("description") || "").trim();
    const price = Number(form.get("price"));
    const stockInput = Number(form.get("stock"));
    const stock = Number.isFinite(stockInput) && stockInput >= 0 ? Math.floor(stockInput) : 50;
    const shippingInput = String(form.get("shippingTime") || "").trim().slice(0, 50);
    const ratingRaw = form.get("rating");
    const imageFile = form.get("imageFile");
    const ageRestricted = form.get("ageRestricted") === "on";

    const rating = ratingRaw ? Number(ratingRaw) : 4.2;
    if (!title || !category || !Number.isFinite(price) || price <= 0) {
      setAdminMessage("Title, category, and a valid price are required.", true);
      return;
    }

    const safeRating = clamp(Number.isFinite(rating) ? rating : 4.2, 1, 5);
    const description = (descriptionInput || `Listed by @${getCurrentUser()?.username || "ronin"} in ${category.slice(0, 40)}.`).slice(0, 500);
    const shippingTime = shippingInput || "2-4 business days";
    let image = fallbackImageForTitle(title);

    if (imageFile instanceof File && imageFile.size > 0) {
      try {
        image = await readFileAsDataUrl(imageFile);
      } catch {
        setAdminMessage("Could not read that image file. Try another image.", true);
        return;
      }
    }

    const listingPayload = {
      title: title.slice(0, 120),
      brand: (title.split(/\s+/)[0] || "NovaGoods").slice(0, 40),
      category: category.slice(0, 40),
      description: description.slice(0, 500),
      rarity: "common",
      price: round2(price),
      rating: round2(safeRating),
      reviewCount: randomInt(5, 120),
      features: [],
      stock,
      shippingTime,
      imageUrl: image,
      is21plus: ageRestricted,
      createdBy: getCurrentUser()?.id || "ronin",
      createdByName: getCurrentUser()?.username || "ronin",
      status: "active"
    };

    const savedListing = await addListing(listingPayload);
    db.catalog = [savedListing, ...db.catalog.filter((item) => item.id !== savedListing.id)];
    cacheListingsLocal(db.catalog);

    const progress = getProgressOrNull();
    if (progress) {
      progress.search = "";
      progress.category = "all";
      progress.sort = "featured";
    }
    persistDb();
    ui.adminAddForm.reset();
    activeTab = "store";
    setAdminMessageAndMaybeHint("Listing added and synced globally.");
    renderTabState();
    renderWallet();
    populateCategories();
    renderProducts();
    renderCart();
    renderOrders();
    renderCreditsShop();
  } catch (error) {
    console.error("[Firestore] add listing failed:", error);
    const code = String(error?.code || "");
    if (code.includes("permission-denied")) {
      setAdminMessageAndMaybeHint("Add listing failed: Firestore permissions deny writes. Update rules.", true);
    } else if (code.includes("unauthenticated")) {
      setAdminMessageAndMaybeHint("Add listing failed: Firestore requires auth for writes.", true);
    } else if (code.includes("resource-exhausted")) {
      setAdminMessageAndMaybeHint("Add listing failed: image too large or quota exceeded. Try a smaller image.", true);
    } else {
      setAdminMessageAndMaybeHint(`Add listing failed: ${error?.message || "Try again."}`, true);
    }
  }
}

async function handleAdminSetPrice(productId, priceValue) {
  if (!ensureAdmin()) return;
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0) {
    setAdminMessage("Enter a valid price above 0.", true);
    return;
  }

  const product = db.catalog.find((item) => item.id === productId);
  if (!product) {
    setAdminMessage("Listing not found.", true);
    return;
  }

  try {
    await updateListing(productId, { price: round2(price) });
    setAdminMessage(`Updated price for ${product.title}.`);
    renderAll();
  } catch (error) {
    console.error("[Firestore] update listing failed:", error);
    setAdminMessage(`Price update failed: ${error?.message || "Try again."}`, true);
  }
}

async function handleAdminDelete(productId) {
  if (!ensureAdmin()) return;
  const product = db.catalog.find((item) => item.id === productId);
  if (!product) {
    setAdminMessage("Listing not found.", true);
    return;
  }

  try {
    await deleteListing(productId);
  } catch (error) {
    console.error("[Firestore] delete listing failed:", error);
    setAdminMessageAndMaybeHint(`Delete failed: ${error?.message || "Try again."}`, true);
    return;
  }

  const deletedTitle = product.title;
  db.catalog = db.catalog.filter((item) => item.id !== productId);
  for (const user of db.users) {
    if (user.progress?.cart?.[productId]) {
      delete user.progress.cart[productId];
    }
  }

  persistDb();
  setAdminMessageAndMaybeHint(`Deleted listing: ${deletedTitle}.`);
  renderProducts();
  renderListingPreview();
  populateCategories();
  renderCreditsShop();
}

async function handleAdminRegenerateImage(productId) {
  if (!ensureAdmin()) return;
  const product = findProductById(productId);
  if (!product) {
    setAdminMessage("Listing not found.", true);
    return;
  }
  try {
    const imageUrl = await generateImageForListingViaApi(
      {
        title: product.title,
        category: product.category,
        features: Array.isArray(product.features) ? product.features : [],
        rarity: product.rarity || "common",
        dayKey: product.dayKey || getTodayKeyLocal()
      },
      { force: true, versionSuffix: `v${Date.now()}` }
    );
    await updateListing(productId, { imageUrl });
    setAdminMessage("Listing image regenerated.");
    await syncListingsNow();
  } catch (error) {
    console.error("[AutoCatalog] regenerate image failed:", error);
    setAdminMessage(`Regenerate image failed: ${error?.message || "Try again."}`, true);
  }
}

function ensureAdmin() {
  const user = getCurrentUser();
  if (!isAdminUser(user)) {
    setAdminMessage("Only @ronin can use admin controls.", true);
    return false;
  }
  return true;
}

function setAdminMessage(message, isError = false) {
  ui.adminMsg.textContent = message;
  ui.adminMsg.classList.toggle("error", isError);
}

function setAdminMessageAndMaybeHint(message, isError = false) {
  if (firestoreDb) {
    setAdminMessage(message, isError);
    return;
  }
  const hint = " Firestore is not connected yet. Check Firebase config and network.";
  setAdminMessage(`${message}${hint}`, isError);
}

function isAdminUser(user) {
  return Boolean(user) && user.username === "ronin";
}

function findProductById(id) {
  return getCatalog().find((item) => item.id === id) || null;
}

function findProductByTitle(title) {
  const needle = String(title || "").trim().toLowerCase();
  if (!needle) return null;
  return getCatalog().find((item) => String(item.title || "").trim().toLowerCase() === needle) || null;
}

function getCatalog() {
  return db.catalog;
}

async function initializeGlobalListingSync() {
  setSyncStatusMessage("Connecting to Firestore...");
  try {
    await initFirebase();
    await ensureUserProfileDoc(getCurrentUser());
    await syncCurrentUserEconomyToFirestore();
    try {
      await ensureAutoCatalogFresh();
    } catch (error) {
      console.error("[AutoCatalog] startup generate skipped:", error);
    }
    const initial = await getListings();
    applyIncomingListings(initial);
    subscribeListings(applyIncomingListings);
    startListingsRefreshLoop();
  } catch (error) {
    console.error("[Firestore] connection/init failed:", error);
    setSyncStatusMessage(`Firestore error: ${error?.message || "config/permission issue"}`, true);
  }
}

function startListingsRefreshLoop() {
  if (listingsRefreshIntervalId) {
    clearInterval(listingsRefreshIntervalId);
  }
  listingsRefreshIntervalId = setInterval(() => {
    if (!document.hidden) {
      syncListingsNow();
    }
  }, 15000);
}

async function syncListingsNow() {
  if (!firestoreDb) return;
  try {
    const live = await getListings();
    applyIncomingListings(live);
    if (!firestoreUnsubscribeListings) {
      subscribeListings(applyIncomingListings);
    }
  } catch (error) {
    console.error("[Firestore] focus/refresh sync failed:", error);
  }
}

function applyIncomingListings(listings) {
  const normalized = normalizeCatalog(listings, [], false);
  db.catalog = normalized;
  console.log("[Firestore] Listings fetched:", db.catalog.length);
  cacheListingsLocal(db.catalog);
  setSyncStatusMessage(`Firestore connected. ${db.catalog.length} listing(s) live.`);
  populateCategories();
  renderProducts();
  renderOrders();
  renderListingPreview();
  if (activeTab === "credits") {
    renderCreditsShop();
  }
}

function setSyncStatusMessage(message, isError = false) {
  if (!ui.syncStatusMsg) return;
  ui.syncStatusMsg.textContent = message;
  ui.syncStatusMsg.classList.toggle("error", isError);
}

async function loadFirebaseSdk() {
  if (window.firebase?.apps) return;
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
  await loadScriptOnce("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js");
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-sdk-src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      if (existing.dataset.loaded === "1") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.sdkSrc = src;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });
}

async function initFirebase() {
  await loadFirebaseSdk();
  if (!window.firebase?.initializeApp) {
    throw new Error("Firebase SDK not available.");
  }
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
  if (!hasConfig) {
    throw new Error("Firebase config missing. Fill firebaseConfig in app.js.");
  }
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
    console.log("[Firestore] Firebase initialized");
  }
  firestoreDb = window.firebase.firestore();
  console.log("[Firestore] Firestore connected");
}

function subscribeListings(callback) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  if (firestoreUnsubscribeListings) {
    firestoreUnsubscribeListings();
  }
  firestoreUnsubscribeListings = firestoreDb
    .collection("listings")
    .where("status", "==", "active")
    .onSnapshot(
      (snapshot) => {
        const listings = snapshot.docs
          .map((doc) => mapFirestoreDocToListing(doc))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(listings);
      },
      (error) => {
        console.error("[Firestore] subscribe error:", error);
        firestoreUnsubscribeListings = null;
        if (String(error?.code || "").includes("permission-denied")) {
          setSyncStatusMessage("Firestore permission denied. Check rules.", true);
        } else {
          setSyncStatusMessage(`Firestore realtime error: ${error?.message || "unknown"}`, true);
        }
      }
    );
}

function hydrateCatalogFromLocalCache() {
  const cached = readListingsCache();
  if (!cached.length) return;
  db.catalog = cached;
}

function cacheListingsLocal(listings) {
  try {
    localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(listings));
  } catch {
    // Ignore cache write errors.
  }
}

function readListingsCache() {
  try {
    const raw = localStorage.getItem(LISTINGS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeCatalog(parsed, [], false);
  } catch {
    return [];
  }
}

function handleStorageSync(event) {
  if (event.key !== LISTINGS_CACHE_KEY || !event.newValue) return;
  try {
    const parsed = JSON.parse(event.newValue);
    if (!Array.isArray(parsed)) return;
    db.catalog = normalizeCatalog(parsed, [], false);
    populateCategories();
    renderProducts();
    renderListingPreview();
  } catch {
    // Ignore invalid storage events.
  }
}

function mapFirestoreDocToListing(doc) {
  const data = doc.data() || {};
  const createdAtMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
  const category = String(data.category || "General");
  const rawImage = data.imageUrl || data.base64Image || fallbackImageForTitle(data.title || "item");
  let image = normalizeRuntimeImageUrl(rawImage);
  if (shouldForceFallbackImageUrl(image)) {
    image = normalizeRuntimeImageUrl(fallbackImageForCategory(category));
  }
  const rarity = normalizeRarity(data.rarity || "common");
  const features = Array.isArray(data.features)
    ? data.features.map((item) => String(item || "").trim().slice(0, 80)).filter(Boolean).slice(0, 6)
    : [];
  return {
    id: doc.id,
    title: String(data.title || "Untitled Item"),
    brand: String(data.brand || "NovaGoods").trim().slice(0, 40) || "NovaGoods",
    category,
    price: round2(Math.max(0.01, Number(data.price) || 0.01)),
    rating: round2(clamp(Number(data.rating) || 4.2, 1, 5)),
    reviewCount: Math.max(0, Math.floor(Number(data.reviewCount) || 0)),
    image,
    ageRestricted: Boolean(data.is21plus),
    rarity,
    features,
    stock: Math.max(0, Math.floor(Number(data.stock) || 50)),
    shippingTime: String(data.shippingTime || "2-4 business days"),
    ownerUsername: normalizeUsername(data.createdByName || data.createdBy || "ronin") || "ronin",
    isPublic: true,
    status: String(data.status || "active"),
    description: String(data.description || "").slice(0, 500),
    reviews: normalizeReviews(data.reviews),
    dayKey: String(data.dayKey || ""),
    generated: data.generated === true,
    createdAt: new Date(createdAtMs).toISOString()
  };
}

async function addListing(listing) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  const payload = {
    title: String(listing.title || "").trim(),
    brand: String(listing.brand || "NovaGoods").trim().slice(0, 40) || "NovaGoods",
    category: String(listing.category || "").trim(),
    price: round2(Math.max(0.01, Number(listing.price) || 0.01)),
    rating: round2(clamp(Number(listing.rating) || 4.2, 1, 5)),
    reviewCount: Math.max(0, Math.floor(Number(listing.reviewCount) || 0)),
    description: String(listing.description || "").trim().slice(0, 500),
    rarity: normalizeRarity(listing.rarity || "common"),
    features: Array.isArray(listing.features)
      ? listing.features.map((item) => String(item || "").trim().slice(0, 80)).filter(Boolean).slice(0, 6)
      : [],
    stock: Math.max(0, Math.floor(Number(listing.stock) || 0)),
    shippingTime: String(listing.shippingTime || "2-4 business days").trim().slice(0, 50),
    is21plus: Boolean(listing.is21plus),
    createdBy: String(listing.createdBy || "ronin"),
    createdByName: String(listing.createdByName || "ronin"),
    status: String(listing.status || "active"),
    dayKey: String(listing.dayKey || ""),
    generated: listing.generated === true,
    reviews: [],
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  };
  if (listing.imageUrl) payload.imageUrl = String(listing.imageUrl);
  if (listing.base64Image) payload.base64Image = String(listing.base64Image);
  const ref = await firestoreDb.collection("listings").add(payload);
  const saved = await ref.get();
  return mapFirestoreDocToListing(saved);
}

async function updateListing(id, updates) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  return firestoreDb.collection("listings").doc(String(id)).update(updates);
}

async function deleteListing(id) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  return firestoreDb.collection("listings").doc(String(id)).delete();
}

async function getListings() {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  const snapshot = await firestoreDb.collection("listings").where("status", "==", "active").get();
  const listings = snapshot.docs
    .map((doc) => mapFirestoreDocToListing(doc))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return listings;
}

async function createListing(input) {
  return addListing(input);
}

async function fetchListings() {
  return getListings();
}

async function buyListing(listingId) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  const buyer = getCurrentUser();
  if (!buyer) throw new Error("Sign in required");

  const listingRef = firestoreDb.collection("listings").doc(String(listingId));
  const orderRef = firestoreDb.collection("orders").doc();
  await firestoreDb.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef);
    if (!listingSnap.exists) {
      throw new Error("Listing not found");
    }
    const listing = listingSnap.data() || {};
    if (String(listing.status || "active") !== "active") {
      throw new Error("Listing already sold");
    }
    const currentStock = Math.max(0, Math.floor(Number(listing.stock) || 0));
    if (currentStock <= 0) {
      throw new Error("Listing out of stock");
    }

    tx.set(orderRef, {
      listingId: String(listingId),
      buyerUid: String(buyer.id),
      buyerEmail: null,
      priceAtPurchase: round2(Number(listing.price) || 0),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      status: "created"
    });
    tx.update(listingRef, {
      stock: currentStock - 1,
      status: "active"
    });
  });

  return orderRef.id;
}

async function fetchOrdersForUser(uid = getCurrentUser()?.id) {
  if (!firestoreDb || !uid) return [];
  const snapshot = await firestoreDb.collection("orders").where("buyerUid", "==", String(uid)).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTs - aTs;
    })
    .map((item) => ({
      ...item,
      createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : new Date().toISOString()
    }));
}

async function fetchAllOrdersForAdmin() {
  if (!firestoreDb) return [];
  if (!isAdminUser(getCurrentUser())) throw new Error("Admin only");
  const snapshot = await firestoreDb.collection("orders").get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTs - aTs;
    })
    .map((item) => ({
      ...item,
      createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : new Date().toISOString()
    }));
}

async function syncUserOrdersFromFirestore() {
  const progress = getProgressOrNull();
  const user = getCurrentUser();
  if (!progress || !user) return;
  const orders = await fetchOrdersForUser(user.id);
  progress.firestoreOrders = orders.map((order) => ({
    id: `fs-${order.id}`,
    itemCount: 1,
    total: round2(Number(order.priceAtPurchase) || 0),
    products: [`Listing ${order.listingId}`],
    lineItems: [],
    createdAt: order.createdAt,
    shipping: {
      carrier: "MegaCart",
      service: "Digital",
      trackingId: order.id,
      etaTs: new Date(order.createdAt || Date.now()).getTime(),
      destination: "Account inventory",
      status: order.status === "cancelled" ? "Cancelled" : "Delivered"
    }
  }));
  persistDb();
  renderOrders();
}

async function handleSignup(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const username = normalizeUsername(form.get("username"));
  const password = String(form.get("password") || "");

  if (!username) {
    setAuthMessage("Username can only use letters, numbers, and underscore.");
    return;
  }

  if (password.length < 4) {
    setAuthMessage("Password must be at least 4 characters.");
    return;
  }

  if (db.users.some((user) => user.username === username)) {
    setAuthMessage("That username already exists.");
    return;
  }
  if (firestoreDb) {
    try {
      const existing = await firestoreDb
        .collection("users")
        .where("usernameLower", "==", username)
        .limit(1)
        .get();
      if (!existing.empty) {
        setAuthMessage("That username is already taken.");
        return;
      }
    } catch (error) {
      console.error("[Auth] Firestore username check failed:", error);
    }
  }

  db.users.push({
    id: crypto.randomUUID(),
    username,
    password,
    progress: defaultProgress()
  });
  db.currentUserId = db.users[db.users.length - 1].id;
  const createdUser = getCurrentUser();
  if (createdUser?.progress) {
    createdUser.progress.search = "";
    createdUser.progress.category = "all";
    createdUser.progress.sort = "featured";
  }

  persistDb();
  ui.signupForm.reset();
  ui.loginForm.reset();
  ui.creditsMsg.textContent = "";
  setAuthMessage("");
  setCheckoutMessage(`Signed in as @${username}.`);
  ensureUserProfileDoc(createdUser).catch(() => {});
  refreshFriendsData().catch(() => {});
  refreshTradesData().catch(() => {});
  renderAll();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const username = normalizeUsername(form.get("username"));
  const password = String(form.get("password") || "");

  const user = db.users.find((item) => item.username === username);
  if (!user || user.password !== password) {
    setAuthMessage("Invalid username or password.");
    return;
  }

  db.currentUserId = user.id;
  user.progress.search = "";
  user.progress.category = "all";
  user.progress.sort = "featured";
  persistDb();
  ui.signupForm.reset();
  ui.loginForm.reset();
  ui.creditsMsg.textContent = "";
  setAuthMessage("");
  setCheckoutMessage(`Welcome back, @${user.username}.`);
  ensureUserProfileDoc(user).catch(() => {});
  syncCurrentBalanceFromFirestore().catch(() => {});
  refreshFriendsData().catch(() => {});
  refreshTradesData().catch(() => {});
  renderAll();
}

function handleLogout() {
  db.currentUserId = null;
  ensureActiveShopperSession();
  persistDb();
  ui.creditsMsg.textContent = "";
  ui.adminMsg.textContent = "";
  setCheckoutMessage("");
  setAuthMessage("");
  closeSendMoneyModal();
  friendsState = { friendships: [], usersById: {} };
  tradesState = { trades: [] };
  activeTradeEditId = null;
  renderAll();
}

function setCheckoutMessage(message, isError = false) {
  ui.checkoutMsg.textContent = message;
  ui.checkoutMsg.classList.toggle("error", isError);
}

function setAuthMessage(message, isError = true) {
  ui.authMsg.textContent = message;
  ui.authMsg.classList.toggle("error", isError);
}

function ensureSignedIn(message) {
  if (getCurrentUser()) return true;
  setAuthMessage(message || "Sign in first.");
  ui.authModal.classList.remove("hidden");
  return false;
}

function getCurrentUser() {
  return db.users.find((user) => user.id === db.currentUserId) || null;
}

function getProgressOrNull() {
  const user = getCurrentUser();
  return user ? user.progress : null;
}

function isGuestUser(user) {
  if (!user) return false;
  return user.id === localStorage.getItem(GUEST_USER_ID_KEY) || String(user.username || "").startsWith("guest_");
}

function ensureActiveShopperSession() {
  if (getCurrentUser()) return;

  const storedGuestId = localStorage.getItem(GUEST_USER_ID_KEY);
  const existingGuest = db.users.find((user) => user.id === storedGuestId);
  if (existingGuest) {
    db.currentUserId = existingGuest.id;
    return;
  }

  const guestUsername = `guest_${Math.random().toString(36).slice(2, 8)}`;
  const guestUser = {
    id: crypto.randomUUID(),
    username: normalizeUsername(guestUsername),
    password: crypto.randomUUID(),
    progress: defaultProgress()
  };
  db.users.push(guestUser);
  db.currentUserId = guestUser.id;
  localStorage.setItem(GUEST_USER_ID_KEY, guestUser.id);
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

function defaultProgress() {
  return {
    balance: 0,
    hasAgeId: false,
    fundTimerEndsAt: null,
    notifiedDeliveredOrderIds: [],
    collectionInventory: [],
    totalFundsCollected: 0,
    totalFromSales: 0,
    totalSpent: 0,
    pityNoLegendaryCount: 0,
    lastMythicSaleAt: null,
    cart: {},
    orders: [],
    firestoreOrders: [],
    jobsState: null,
    fiveMinReward: null,
    moneyLedger: [],
    search: "",
    category: "all",
    sort: "featured"
  };
}

function purgeDemoListingsForAllAccountsOnce() {
  if (db.demoListingsPurgedAt) return;

  const isDemoListing = (item) => {
    const id = String(item?.id || "");
    const title = String(item?.title || "").trim();
    return DEMO_LISTING_IDS.has(id) || DEMO_LISTING_TITLES.has(title);
  };

  db.catalog = (db.catalog || []).filter((item) => !isDemoListing(item));
  db.deletedCatalogIds = (db.deletedCatalogIds || []).filter((id) => DEMO_LISTING_IDS.has(String(id)));
  for (const id of DEMO_LISTING_IDS) {
    if (!db.deletedCatalogIds.includes(id)) {
      db.deletedCatalogIds.push(id);
    }
  }

  for (const user of db.users || []) {
    const progress = user?.progress;
    if (!progress) continue;

    if (progress.cart && typeof progress.cart === "object") {
      for (const id of Object.keys(progress.cart)) {
        if (DEMO_LISTING_IDS.has(String(id))) {
          delete progress.cart[id];
        }
      }
    }

    if (Array.isArray(progress.collectionInventory)) {
      progress.collectionInventory = progress.collectionInventory.filter(
        (item) => !isDemoListing(item) && !DEMO_LISTING_IDS.has(String(item?.productId || ""))
      );
    }
  }

  db.demoListingsPurgedAt = new Date().toISOString();
  persistDb();
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      return {
        users: [],
        currentUserId: null,
        deletedCatalogIds: [],
        catalog: SEED_PRODUCTS.map((item) => ({ ...item })),
        listingReviews: {}
      };
    }

    const parsed = JSON.parse(raw);
    const deletedCatalogIds = [];
    const catalog = [];
    const users = Array.isArray(parsed.users)
      ? parsed.users
          .map((user) => ({
            id: user.id || crypto.randomUUID(),
            username: normalizeUsername(user.username),
            password: String(user.password || ""),
            progress: normalizeProgress(user.progress, catalog)
          }))
          .filter((user) => user.username && user.password)
      : [];

    const validIds = new Set(users.map((user) => user.id));
    const listingReviews = normalizeListingReviews(parsed.listingReviews);

    return {
      users,
      currentUserId: validIds.has(parsed.currentUserId) ? parsed.currentUserId : null,
      deletedCatalogIds,
      catalog,
      listingReviews
    };
  } catch {
    return {
      users: [],
      currentUserId: null,
      deletedCatalogIds: [],
      catalog: SEED_PRODUCTS.map((item) => ({ ...item })),
      listingReviews: {}
    };
  }
}

function enforceRoninPassword() {
  if (!db || !Array.isArray(db.users)) return;
  const ronin = db.users.find((user) => user.username === "ronin");
  if (!ronin) return;
  if (ronin.password === "ronin") return;
  ronin.password = "ronin";
  persistDb();
}

function ensureRoninAccount() {
  if (!db || !Array.isArray(db.users)) return;
  const exists = db.users.some((user) => user.username === "ronin");
  if (exists) return;
  db.users.push({
    id: crypto.randomUUID(),
    username: "ronin",
    password: "ronin",
    progress: defaultProgress()
  });
  persistDb();
}

function normalizeCatalog(catalogRaw, deletedCatalogIds = [], includeSeedDefaults = true) {
  const source = Array.isArray(catalogRaw) && catalogRaw.length
    ? includeSeedDefaults
      ? [...catalogRaw, ...SEED_PRODUCTS]
      : [...catalogRaw]
    : includeSeedDefaults
      ? SEED_PRODUCTS
      : [];
  const normalized = [];
  const seen = new Set();
  const deleted = new Set((deletedCatalogIds || []).map((id) => String(id)));

  for (const item of source) {
    const id = String(item.id || crypto.randomUUID());
    if (seen.has(id)) continue;
    if (deleted.has(id)) continue;
    seen.add(id);

    const title = String(item.title || "Untitled Item").trim().slice(0, 120) || "Untitled Item";
    const brand = String(item.brand || "NovaGoods").trim().slice(0, 40) || "NovaGoods";
    const category = String(item.category || "General").trim().slice(0, 40) || "General";
    const price = round2(Math.max(0.01, Number(item.price) || 0.01));
    const rating = round2(clamp(Number(item.rating) || 4.2, 1, 5));
    const reviewCount = Math.max(0, Math.floor(Number(item.reviewCount) || 0));
    const image = normalizeRuntimeImageUrl(String(item.image || "").trim() || fallbackImageForTitle(title));
    const ownerUsername = normalizeUsername(item.ownerUsername || "ronin") || "ronin";
    const isPublic = true;
    const status = ["active", "sold", "archived"].includes(String(item.status || "active")) ? String(item.status || "active") : "active";
    const ageRestricted = item.ageRestricted === true;
    const rarity = normalizeRarity(item.rarity || "common");
    const parsedStock = Number(item.stock);
    const stock = Number.isFinite(parsedStock) ? Math.max(0, Math.floor(parsedStock)) : 50;
    const shippingTime = String(item.shippingTime || "2-4 business days")
      .trim()
      .slice(0, 50) || "2-4 business days";
    const description = String(
      item.description || `${title} is available in the ${category} collection at MegaCart.`
    )
      .trim()
      .slice(0, 500);
    const features = Array.isArray(item.features)
      ? item.features.map((entry) => String(entry || "").trim().slice(0, 80)).filter(Boolean).slice(0, 6)
      : [];
    const reviews = normalizeReviews(item.reviews);
    const dayKey = String(item.dayKey || "");
    const generated = item.generated === true;
    const createdAt = item.createdAt || new Date().toISOString();

    normalized.push({
      id,
      title,
      brand,
      category,
      price,
      rating,
      reviewCount,
      image,
      ownerUsername,
      isPublic,
      status,
      ageRestricted,
      rarity,
      features,
      stock,
      shippingTime,
      description,
      dayKey,
      generated,
      reviews,
      createdAt
    });
  }

  return normalized;
}

function normalizeListingReviews(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const [productId, reviews] of Object.entries(input)) {
    const key = String(productId || "").trim();
    if (!key) continue;
    const normalized = normalizeReviews(reviews);
    if (normalized.length) {
      out[key] = normalized.slice(-500);
    }
  }
  return out;
}

function normalizeReviews(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((review) => ({
      id: review.id || crypto.randomUUID(),
      username: normalizeUsername(review.username || "shopper") || "shopper",
      rating: Math.round(clamp(Number(review.rating) || 5, 1, 5)),
      text: String(review.text || "").trim().slice(0, 240),
      createdAt: review.createdAt || new Date().toISOString()
    }))
    .filter((review) => review.text);
}

function getEffectiveRating(product) {
  const reviews = getReviewsForProduct(product);
  if (!reviews.length) {
    return clamp(Number(product?.rating) || 4.2, 1, 5);
  }

  const total = reviews.reduce((sum, review) => sum + clamp(Number(review.rating) || 1, 1, 5), 0);
  return clamp(round2(total / reviews.length), 1, 5);
}

function getReviewsForProduct(product) {
  const embedded = Array.isArray(product?.reviews) ? normalizeReviews(product.reviews) : [];
  const key = String(product?.id || "");
  const persisted = key && db.listingReviews && Array.isArray(db.listingReviews[key])
    ? normalizeReviews(db.listingReviews[key])
    : [];
  if (!embedded.length) return persisted;
  if (!persisted.length) return embedded;
  const merged = [...embedded, ...persisted];
  const seen = new Set();
  return merged.filter((review) => {
    if (seen.has(review.id)) return false;
    seen.add(review.id);
    return true;
  });
}

function normalizeCollectionInventory(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      productId: item.productId ? String(item.productId) : null,
      title: String(item.title || "Item").trim() || "Item",
      image: normalizeRuntimeImageUrl(String(item.image || "").trim() || fallbackImageForTitle(item.title || "item")),
      qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
      valueEach: round2(Math.max(0.01, Number(item.valueEach) || 1)),
      rarity: normalizeRarity(item.rarity),
      conditions: normalizeConditions(item.conditions)
    }))
    .filter((item) => item.qty > 0);
}

function normalizeRarity(value) {
  const rarity = String(value || "").trim().toLowerCase();
  if (["common", "uncommon", "rare", "epic", "legendary", "mythic"].includes(rarity)) {
    return rarity;
  }
  return "common";
}

function formatRarityLabel(value) {
  const rarity = normalizeRarity(value);
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

function normalizeConditions(input) {
  const allowed = new Set(["Factory Sealed", "Signed", "Glitched Edition", "Damaged"]);
  if (!Array.isArray(input)) return [];
  return input.filter((value) => allowed.has(String(value)));
}

function rollConditionModifiers() {
  const picked = [];
  if (Math.random() < 0.08) picked.push("Factory Sealed");
  if (Math.random() < 0.05) picked.push("Signed");
  if (Math.random() < 0.02) picked.push("Glitched Edition");
  if (Math.random() < 0.1) picked.push("Damaged");
  return picked;
}

function rollRarityForPurchase(basePrice, pityCount) {
  let table = basePrice > 200 ? protectedRarityTable() : standardRarityTable();
  if (pityCount >= 50 && pityCount < 100) {
    table = applyLegendaryBoost(table, 2);
  }

  let rarity = weightedPick(table);
  if (pityCount >= 100 && !["legendary", "mythic"].includes(rarity)) {
    rarity = "legendary";
  }
  return rarity;
}

function standardRarityTable() {
  return {
    common: 50,
    uncommon: 25,
    rare: 13,
    epic: 7,
    legendary: 4,
    mythic: 1
  };
}

function protectedRarityTable() {
  // Legendary/Mythic reduced for expensive items, others rebalanced proportionally.
  const remaining = 100 - 2 - 0.2;
  const scale = remaining / (50 + 25 + 13 + 7);
  return {
    common: 50 * scale,
    uncommon: 25 * scale,
    rare: 13 * scale,
    epic: 7 * scale,
    legendary: 2,
    mythic: 0.2
  };
}

function applyLegendaryBoost(table, boostPct) {
  const mutable = { ...table };
  const sourceKeys = ["common", "uncommon", "rare", "epic"];
  const sourceTotal = sourceKeys.reduce((sum, key) => sum + (mutable[key] || 0), 0);
  if (sourceTotal <= 0) return mutable;

  for (const key of sourceKeys) {
    const share = (mutable[key] || 0) / sourceTotal;
    mutable[key] = Math.max(0, (mutable[key] || 0) - boostPct * share);
  }
  mutable.legendary = (mutable.legendary || 0) + boostPct;
  return mutable;
}

function weightedPick(table) {
  const entries = Object.entries(table);
  const total = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= Number(weight || 0);
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function rarityValueMultiplier(rarity) {
  if (rarity === "mythic") return 20;
  if (rarity === "legendary") return 8;
  if (rarity === "epic") return 4;
  if (rarity === "rare") return 2;
  if (rarity === "uncommon") return 1.3;
  return 0.9;
}

function conditionValueMultiplier(conditions) {
  const normalized = normalizeConditions(conditions);
  let mult = 1;
  for (const condition of normalized) {
    if (condition === "Factory Sealed") mult *= 1.1;
    else if (condition === "Signed") mult *= 1.25;
    else if (condition === "Glitched Edition") mult *= 1.5;
    else if (condition === "Damaged") mult *= 0.7;
  }
  return mult;
}

function crashChanceByRarity(rarity) {
  if (rarity === "mythic") return 0.4;
  if (rarity === "legendary") return 0.3;
  if (rarity === "epic") return 0.25;
  if (rarity === "rare") return 0.2;
  if (rarity === "uncommon") return 0.15;
  return 0.1;
}

function computeSaleResult(item) {
  const rarityMult = rarityValueMultiplier(item.rarity);
  const conditionMult = conditionValueMultiplier(item.conditions);
  const baseValue = round2(item.valueEach * rarityMult * conditionMult);

  let marketEvent = "stable";
  let marketMessage = "Market Stable - Full value received";
  let valueAfterMarket = baseValue;

  if (Math.random() < 0.05) {
    marketEvent = "surge";
    valueAfterMarket = round2(baseValue * 1.1);
    marketMessage = "Market Surge! +10% bonus!";
  } else if (Math.random() < crashChanceByRarity(item.rarity)) {
    marketEvent = "crash";
    valueAfterMarket = round2(baseValue * 0.85);
    marketMessage = "Market Dip! -15% value";
  }

  const taxed = round2(valueAfterMarket * (1 - SELL_TAX_RATE));
  const netValue = round2(Math.min(SELL_CAP, taxed));
  return {
    baseValue,
    marketEvent,
    marketMessage,
    netValue
  };
}

function estimateNetSaleValue(item) {
  const base = round2(item.valueEach * rarityValueMultiplier(item.rarity) * conditionValueMultiplier(item.conditions));
  return round2(Math.min(SELL_CAP, base * (1 - SELL_TAX_RATE)));
}

function normalizeJobsState(raw, progress, todayKey) {
  if (!raw || typeof raw !== "object") return null;
  const jobs = Array.isArray(raw.jobs)
    ? raw.jobs
        .map((job) => ({
          id: String(job?.id || ""),
          title: String(job?.title || "Job"),
          description: String(job?.description || ""),
          durationMs: Math.max(60 * 1000, Math.floor(Number(job?.durationMs) || 0)),
          payout: round2(Math.max(0, Number(job?.payout) || 0)),
          difficulty: ["Easy", "Medium", "Hard"].includes(String(job?.difficulty)) ? String(job.difficulty) : "Easy"
        }))
        .filter((job) => job.id)
    : [];

  const state = {
    todayKey: String(raw.todayKey || todayKey),
    jobs,
    activeJobId: raw.activeJobId ? String(raw.activeJobId) : null,
    acceptedAt: Number(raw.acceptedAt) > 0 ? Number(raw.acceptedAt) : null,
    endsAt: Number(raw.endsAt) > 0 ? Number(raw.endsAt) : null,
    claimed: raw.claimed === true,
    todayEarnings: round2(Math.max(0, Number(raw.todayEarnings) || 0)),
    cooldownUntil: Number(raw.cooldownUntil) > 0 ? Number(raw.cooldownUntil) : null
  };
  if (state.todayKey !== todayKey) return null;
  if (state.activeJobId && !state.jobs.some((job) => job.id === state.activeJobId)) {
    state.activeJobId = null;
    state.acceptedAt = null;
    state.endsAt = null;
    state.claimed = false;
  }
  return state;
}

function normalizeFiveMinRewardState(raw, todayKey) {
  if (!raw || typeof raw !== "object") return null;
  const normalized = {
    todayKey: String(raw.todayKey || todayKey),
    lastClaimAt: Number(raw.lastClaimAt) > 0 ? Number(raw.lastClaimAt) : null,
    nextClaimAt: Number(raw.nextClaimAt) > 0 ? Number(raw.nextClaimAt) : null,
    todayTotal5minRewards: round2(Math.max(0, Number(raw.todayTotal5minRewards) || 0)),
    lastRewardAmount: round2(Math.max(0, Number(raw.lastRewardAmount) || 0)),
    claimHistory: Array.isArray(raw.claimHistory) ? raw.claimHistory.slice(0, 10) : []
  };
  if (normalized.todayKey !== todayKey) {
    normalized.todayKey = todayKey;
    normalized.todayTotal5minRewards = 0;
    normalized.claimHistory = [];
  }
  return normalized;
}

function normalizeProgress(progress, catalog) {
  const base = defaultProgress();
  if (!progress || typeof progress !== "object") {
    return base;
  }

  const validProductIds = new Set((catalog || []).map((item) => item.id));
  const cart = {};
  for (const [id, qty] of Object.entries(progress.cart || {})) {
    if (validProductIds.has(id) && Number(qty) > 0) {
      cart[id] = Math.floor(Number(qty));
    }
  }

  const categories = ["all", ...new Set((catalog || []).map((item) => item.category))];

  return {
    balance: round2(Math.max(0, Number(progress.balance) || 0)),
    hasAgeId: progress.hasAgeId === true,
    fundTimerEndsAt:
      Number(progress.fundTimerEndsAt) > Date.now() - 24 * 60 * 60 * 1000
        ? Number(progress.fundTimerEndsAt)
        : null,
    notifiedDeliveredOrderIds: Array.isArray(progress.notifiedDeliveredOrderIds)
      ? progress.notifiedDeliveredOrderIds.map((id) => String(id))
      : [],
    collectionInventory: normalizeCollectionInventory(progress.collectionInventory),
    totalFundsCollected: round2(Math.max(0, Number(progress.totalFundsCollected) || 0)),
    totalFromSales: round2(Math.max(0, Number(progress.totalFromSales) || 0)),
    totalSpent: round2(Math.max(0, Number(progress.totalSpent) || 0)),
    pityNoLegendaryCount: Math.max(0, Math.floor(Number(progress.pityNoLegendaryCount) || 0)),
    lastMythicSaleAt: Number(progress.lastMythicSaleAt) > 0 ? Number(progress.lastMythicSaleAt) : null,
    cart,
    orders: Array.isArray(progress.orders) ? progress.orders.slice(0, 50) : [],
    firestoreOrders: Array.isArray(progress.firestoreOrders) ? progress.firestoreOrders.slice(0, 100) : [],
    jobsState: normalizeJobsState(progress.jobsState, progress, getTodayKeyLocal()),
    fiveMinReward: normalizeFiveMinRewardState(progress.fiveMinReward, getTodayKeyLocal()),
    moneyLedger: Array.isArray(progress.moneyLedger) ? progress.moneyLedger.slice(0, 200) : [],
    search: String(progress.search || ""),
    category: categories.includes(progress.category) ? progress.category : "all",
    sort: ["featured", "price-low", "price-high", "rating"].includes(progress.sort) ? progress.sort : "featured"
  };
}

function hasAgeIdFor21Plus() {
  return Boolean(getProgressOrNull()?.hasAgeId);
}

function isNewDrop(createdAt) {
  const ts = new Date(createdAt || 0).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return Date.now() - ts <= 24 * 60 * 60 * 1000;
}

function fallbackImageForTitle(title) {
  const seed = hashStringToInt(String(title || "product"));
  const all = Object.values(AUTO_CATALOG_IMAGE_FILES).flat();
  const name = all[seed % all.length] || "tech-01.svg";
  const folder = name.split("-")[0] || "tech";
  return `/public/images/catalog/${folder}/${name}`;
}

function normalizeRuntimeImageUrl(src) {
  const value = String(src || "").trim();
  if (!value) return value;
  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (typeof window !== "undefined" && window.location?.protocol === "file:") {
    if (value.startsWith("/public/")) return `.${value}`;
    if (value.startsWith("/")) return `.${value}`;
  }
  if (value.startsWith("public/")) return `/${value}`;
  return value;
}

function shouldForceFallbackImageUrl(imageUrl) {
  const value = String(imageUrl || "");
  if (!value) return true;
  return value.startsWith("public/generated-products/") || value.startsWith("/public/generated-products/");
}

function attachImageFallback(imageEl, title) {
  if (!imageEl) return;
  const safeFallback = normalizeRuntimeImageUrl(fallbackImageForTitle(title || "item"));
  imageEl.onerror = () => {
    if (imageEl.dataset.fallbackApplied === "1") return;
    imageEl.dataset.fallbackApplied = "1";
    imageEl.src = safeFallback;
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.onload = () => {
      const src = String(reader.result || "");
      if (!src) {
        reject(new Error("file-read-empty"));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error("image-decode-failed"));
      image.onload = () => {
        const maxSide = 900;
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas-context-failed"));
          return;
        }

        ctx.drawImage(image, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function persistDb() {
  const payload = {
    users: db.users,
    currentUserId: db.currentUserId,
    demoListingsPurgedAt: db.demoListingsPurgedAt,
    listingReviews: normalizeListingReviews(db.listingReviews)
  };
  localStorage.setItem(DB_KEY, JSON.stringify(payload));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
