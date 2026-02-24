const DB_KEY = "megacart_accounts_v1";
const LISTINGS_CACHE_KEY = "megacart_listings_cache_v1";
// Primary static config block: fill these with your Firebase Web App credentials.
const FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
const FIREBASE_CONFIG_DEFAULT = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
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
purgeDemoListingsForAllAccountsOnce();
let activeTab = "store";
let activeListingId = null;
let fundTimerIntervalId = null;
let deliveryPopupQueue = [];
const FUND_TIMER_DURATION_MS = 2.5 * 60 * 1000;
const FUND_TIMER_LABEL = "02:30";
const AGE_ID_PRICE = 75;
const SELL_TAX_RATE = 0.05;
const SELL_CAP = 50000;
const MYTHIC_SELL_COOLDOWN_MS = 2 * 60 * 1000;
let firestoreDb = null;
let firestoreUnsubscribeListings = null;
let listingsRefreshIntervalId = null;

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
  statsTabBtn: document.querySelector("#statsTabBtn"),
  storeView: document.querySelector("#storeView"),
  storefrontContent: document.querySelector("#storefrontContent"),
  listingPreview: document.querySelector("#listingPreview"),
  closePreviewBtn: document.querySelector("#closePreviewBtn"),
  previewImage: document.querySelector("#previewImage"),
  previewTitle: document.querySelector("#previewTitle"),
  previewMeta: document.querySelector("#previewMeta"),
  previewPrice: document.querySelector("#previewPrice"),
  previewDescription: document.querySelector("#previewDescription"),
  previewAddToCartBtn: document.querySelector("#previewAddToCartBtn"),
  previewReviewsList: document.querySelector("#previewReviewsList"),
  previewReviewForm: document.querySelector("#previewReviewForm"),
  previewReviewMsg: document.querySelector("#previewReviewMsg"),
  creditsView: document.querySelector("#creditsView"),
  collectionView: document.querySelector("#collectionView"),
  collectionGrid: document.querySelector("#collectionGrid"),
  trackingView: document.querySelector("#trackingView"),
  trackingList: document.querySelector("#trackingList"),
  statsView: document.querySelector("#statsView"),
  syncStatusMsg: document.querySelector("#syncStatusMsg"),
  statsEarned: document.querySelector("#statsEarned"),
  statsSpent: document.querySelector("#statsSpent"),
  creditsUserLabel: document.querySelector("#creditsUserLabel"),
  creditsBalance: document.querySelector("#creditsBalance"),
  creditsMsg: document.querySelector("#creditsMsg"),
  fundTimerStatus: document.querySelector("#fundTimerStatus"),
  fundTimerCountdown: document.querySelector("#fundTimerCountdown"),
  fundTimerBtn: document.querySelector("#fundTimerBtn"),
  idStatus: document.querySelector("#idStatus"),
  buyIdBtn: document.querySelector("#buyIdBtn"),
  adminPanel: document.querySelector("#adminPanel"),
  adminAddForm: document.querySelector("#adminAddForm"),
  adminAddBtn: document.querySelector("#adminAddBtn"),
  adminListings: document.querySelector("#adminListings"),
  adminMsg: document.querySelector("#adminMsg"),
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
  ui.statsTabBtn.addEventListener("click", () => {
    switchTab("stats");
  });

  ui.fundTimerBtn.addEventListener("click", handleFundTimerAction);
  ui.buyIdBtn.addEventListener("click", handleBuyAgeId);

  ui.closePreviewBtn.addEventListener("click", closeListingPreview);
  ui.previewAddToCartBtn.addEventListener("click", () => {
    if (activeListingId) {
      addToCart(activeListingId);
    }
  });
  ui.previewReviewForm.addEventListener("submit", handlePreviewReviewSubmit);
  ui.adminAddForm.addEventListener("submit", handleAdminAdd);
  ui.signupForm.addEventListener("submit", handleSignup);
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.logoutBtn.addEventListener("click", handleLogout);
  ui.accountLabel.addEventListener("click", () => {
    ui.authModal.classList.remove("hidden");
    setAuthMessage("Sign in to switch account.", false);
  });
  ui.deliveryPopupClose.addEventListener("click", hideDeliveryPopup);
  ui.collectionGrid.addEventListener("click", handleCollectionAction);
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
  if ((tab === "credits" || tab === "collection" || tab === "tracking" || tab === "stats") && !ensureSignedIn("Sign in first to continue.")) {
    return;
  }

  activeTab = tab === "credits" || tab === "collection" || tab === "tracking" || tab === "stats" ? tab : "store";
  if (activeTab !== "store") {
    closeListingPreview();
  }
  renderTabState();
  renderCreditsShop();
  renderCollection();
  renderTracking();
  renderStats();
}

function renderTabState() {
  const storeActive = activeTab === "store";
  const creditsActive = activeTab === "credits";
  const collectionActive = activeTab === "collection";
  const trackingActive = activeTab === "tracking";
  const statsActive = activeTab === "stats";

  ui.storeView.classList.toggle("hidden", !storeActive);
  ui.creditsView.classList.toggle("hidden", !creditsActive);
  ui.collectionView.classList.toggle("hidden", !collectionActive);
  ui.trackingView.classList.toggle("hidden", !trackingActive);
  ui.statsView.classList.toggle("hidden", !statsActive);
  ui.storeTabBtn.classList.toggle("active", storeActive);
  ui.creditsTabBtn.classList.toggle("active", creditsActive);
  ui.collectionTabBtn.classList.toggle("active", collectionActive);
  ui.trackingTabBtn.classList.toggle("active", trackingActive);
  ui.statsTabBtn.classList.toggle("active", statsActive);
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
  renderStats();
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

function renderCreditsShop() {
  const user = getCurrentUser();
  if (!user) {
    ui.creditsUserLabel.textContent = "No active account.";
    ui.creditsBalance.textContent = "$0.00";
    ui.fundTimerBtn.disabled = true;
    ui.buyIdBtn.disabled = true;
    ui.buyIdBtn.textContent = `Buy 21+ ID (${money(AGE_ID_PRICE)})`;
    ui.idStatus.textContent = "Sign in to buy a 21+ ID.";
    ui.fundTimerStatus.textContent = "Sign in to use the timer.";
    ui.fundTimerCountdown.textContent = `Random • ${FUND_TIMER_LABEL}`;
    ui.adminPanel.classList.add("hidden");
    ui.adminListings.innerHTML = "";
    return;
  }

  ui.creditsUserLabel.textContent = `Signed in as @${user.username}`;
  ui.creditsBalance.textContent = money(Number(user.progress.balance) || 0);
  renderAgeIdShop(user.progress);
  renderFundTimer(user.progress);

  if (isAdminUser(user)) {
    ui.adminPanel.classList.remove("hidden");
    renderAdminListings();
  } else {
    ui.adminPanel.classList.add("hidden");
    ui.adminListings.innerHTML = "";
  }
}

function renderAgeIdShop(progress) {
  const hasId = Boolean(progress.hasAgeId);
  ui.idStatus.textContent = hasId ? "21+ ID Active. You can buy 21+ items." : "No 21+ ID owned.";
  ui.buyIdBtn.textContent = hasId ? "21+ ID Owned" : `Buy 21+ ID (${money(AGE_ID_PRICE)})`;
  ui.buyIdBtn.disabled = hasId;
}

function renderFundTimer(progress) {
  const endsAt = Number(progress.fundTimerEndsAt || 0);
  const now = Date.now();
  ui.fundTimerBtn.disabled = false;

  if (!endsAt) {
    ui.fundTimerStatus.textContent = "Start a 2:30 timer for a random payout.";
    ui.fundTimerCountdown.textContent = `Random • ${FUND_TIMER_LABEL}`;
    ui.fundTimerBtn.textContent = `Start ${FUND_TIMER_LABEL} Timer`;
    return;
  }

  if (now < endsAt) {
    const remaining = formatCountdown(endsAt - now);
    ui.fundTimerStatus.textContent = "Timer running...";
    ui.fundTimerCountdown.textContent = `Random • ${remaining}`;
    ui.fundTimerBtn.textContent = "Timer Running";
    ui.fundTimerBtn.disabled = true;
    return;
  }

  ui.fundTimerStatus.textContent = "Timer finished. Collect your random payout.";
  ui.fundTimerCountdown.textContent = "Random • Ready";
  ui.fundTimerBtn.textContent = "Collect Reward";
}

function startFundTimerTicker() {
  if (fundTimerIntervalId) {
    clearInterval(fundTimerIntervalId);
  }

  fundTimerIntervalId = setInterval(() => {
    const progress = getProgressOrNull();
    if (!progress) return;
    if (activeTab === "credits") {
      renderFundTimer(progress);
    }
    checkForDeliveredItems();
    if (activeTab === "collection") {
      renderCollection();
    }
    if (activeTab === "tracking") {
      renderTracking();
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
        <p class="admin-meta">${product.category}${product.ageRestricted ? " • 21+" : ""} • ${stockLabel} • ${product.shippingTime || "Standard shipping"} • Rarity ${normalizeRarity(product.rarity)} • Rating ${effectiveRating.toFixed(1)} • @${product.ownerUsername}</p>
        <div class="admin-row-controls">
          <label class="admin-price-input">
            Price
            <input type="number" min="0.01" step="0.01" value="${Number(product.price).toFixed(2)}" />
          </label>
          <button type="button" data-action="price" data-id="${product.id}" class="admin-save-btn">Save Price</button>
          <button type="button" data-action="delete" data-id="${product.id}" class="admin-delete-btn">Delete</button>
        </div>
      </div>
    `;

    const input = row.querySelector("input");
    const priceBtn = row.querySelector('[data-action="price"]');
    const delBtn = row.querySelector('[data-action="delete"]');

    priceBtn.addEventListener("click", () => {
      handleAdminSetPrice(product.id, input.value);
    });

    delBtn.addEventListener("click", () => {
      handleAdminDelete(product.id);
    });

    ui.adminListings.append(row);
  }
}

function handleFundTimerAction() {
  const progress = getProgressOrNull();
  if (!progress && !ensureSignedIn("Sign in first to add money.")) return;
  const nextProgress = getProgressOrNull();
  if (!nextProgress) return;

  const now = Date.now();
  const endsAt = Number(nextProgress.fundTimerEndsAt || 0);

  if (!endsAt) {
    nextProgress.fundTimerEndsAt = now + FUND_TIMER_DURATION_MS;
    persistDb();
    setFundMessage(`Timer started. Come back in ${FUND_TIMER_LABEL}.`);
    renderCreditsShop();
    return;
  }

  if (now < endsAt) {
    const remaining = formatCountdown(endsAt - now);
    setFundMessage(`Timer still running: ${remaining}`, true);
    renderCreditsShop();
    return;
  }

  const reward = getRandomTimerReward();
  nextProgress.balance = round2((Number(nextProgress.balance) || 0) + reward);
  nextProgress.totalFundsCollected = round2((Number(nextProgress.totalFundsCollected) || 0) + reward);
  nextProgress.fundTimerEndsAt = now + FUND_TIMER_DURATION_MS;
  persistDb();
  setFundMessage(`Collected ${money(reward)}. Next timer started automatically.`);
  setCheckoutMessage(`Added ${money(reward)} to your wallet.`);
  renderWallet();
  renderCreditsShop();
  renderStats();
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
  setFundMessage("21+ ID purchased. You can now buy 21+ items.");
  renderWallet();
  renderCreditsShop();
  renderStats();
  renderProducts();
  renderListingPreview();
}

function setFundMessage(message, isError = false) {
  ui.creditsMsg.textContent = message;
  ui.creditsMsg.classList.toggle("error", isError);
}

function getRandomTimerReward() {
  const progress = getProgressOrNull();
  const balance = Number(progress?.balance) || 0;
  const scale = balance > 10000 ? 0.92 : 1;

  // 15% jackpot chance for $100.
  if (Math.random() < 0.15) {
    return round2(100 * scale);
  }

  const rewards = [5.34, 10.23, 15.43, 25.9, 50.43];
  return round2(rewards[Math.floor(Math.random() * rewards.length)] * scale);
}

function filteredProducts() {
  const progress = getProgressOrNull();
  const search = (progress?.search || "").toLowerCase();
  const category = progress?.category || "all";
  const sort = progress?.sort || "featured";

  const filtered = getCatalog().filter((product) => {
    const matchesSearch = !search || product.title.toLowerCase().includes(search);
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
    const ageBadge = product.ageRestricted ? '<span class="age-badge">21+</span>' : "";
    const newDropBadge = isNewDrop(product.createdAt) ? '<span class="new-drop-badge">New Drop</span>' : "";
    const outOfStock = Number(product.stock) === 0;
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}" />
      <h3 class="product-title">${product.title}${ageBadge}${newDropBadge}</h3>
      <p class="rating">${"★".repeat(starCount)} (${effectiveRating.toFixed(1)})</p>
      <div class="meta">
        <span class="price">${money(product.price)}</span>
        <button type="button" data-id="${product.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Sold Out" : "Add"}</button>
      </div>
    `;

    const button = card.querySelector("button");
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

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const canBuyAgeRestricted = !product.ageRestricted || hasAgeIdFor21Plus();
  const outOfStock = Number(product.stock) === 0;
  const effectiveRating = getEffectiveRating(product);
  const starCount = Math.max(1, Math.min(5, Math.round(effectiveRating)));
  ui.previewImage.src = product.image;
  ui.previewImage.alt = product.title;
  ui.previewTitle.textContent = product.title;
  ui.previewMeta.textContent = `${product.category}${product.ageRestricted ? " • 21+ item" : ""} • ${normalizeRarity(product.rarity)} • Stock ${Math.max(0, Number(product.stock) || 0)} • ${product.shippingTime || "Standard shipping"} • Seller @${product.ownerUsername} • ${"★".repeat(starCount)} ${effectiveRating.toFixed(1)} • ${reviews.length} reviews`;
  ui.previewPrice.textContent = money(product.price);
  ui.previewDescription.textContent = product.description || `${product.title} is available in our marketplace.`;
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
  const orders = progress ? progress.orders : [];
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

function handlePreviewReviewSubmit(event) {
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

  if (!Array.isArray(product.reviews)) {
    product.reviews = [];
  }

  product.reviews.push({
    id: crypto.randomUUID(),
    username: user.username,
    rating: Math.round(rating),
    text: text.slice(0, 240),
    createdAt: new Date().toISOString()
  });

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

  nextProgress.balance = round2(nextProgress.balance - totals.total);
  nextProgress.totalSpent = round2((Number(nextProgress.totalSpent) || 0) + totals.total);
  nextProgress.cart = {};
  setCheckoutMessage("thank you!");
  persistDb();
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
    const deliveredItems = getOrderItems(order);
    for (const delivered of deliveredItems) {
      const resolvedImage = resolveOrderItemImage(delivered);
      const valueEach = round2(Number(delivered.price) || Number(findProductById(delivered.productId)?.price) || 1);
      const key = collectionStackKey(delivered);
      const existing = inventoryByProduct.get(key);
      if (existing) {
        existing.qty += Math.max(1, Number(delivered.qty) || 1);
        if (!existing.image) existing.image = resolvedImage;
      } else {
        const entry = {
          id: crypto.randomUUID(),
          productId: delivered.productId || null,
          title: delivered.title,
          image: resolvedImage,
          qty: Math.max(1, Number(delivered.qty) || 1),
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

  for (const order of newlyDelivered) {
    const deliveredItems = getOrderItems(order);
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
    return [{ productId: null, title: "Delivered item", qty: 1, image: null }];
  }

  return products.map((entry) => parseOrderProductEntry(entry));
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
    const rarity = normalizeRarity(form.get("rarity") || "common");
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
      category: category.slice(0, 40),
      description: description.slice(0, 500),
      rarity,
      price: round2(price),
      rating: round2(safeRating),
      stock,
      shippingTime,
      imageUrl: image,
      is21plus: ageRestricted,
      createdBy: getCurrentUser()?.username || "ronin"
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
    const initial = await getListings();
    if (initial.length) {
      applyIncomingListings(initial);
    }
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
    if (live.length) {
      applyIncomingListings(live);
    }
    if (!firestoreUnsubscribeListings) {
      subscribeListings(applyIncomingListings);
    }
  } catch (error) {
    console.error("[Firestore] focus/refresh sync failed:", error);
  }
}

function applyIncomingListings(listings) {
  const normalized = normalizeCatalog(listings, [], false);
  if (!normalized.length) {
    const cached = readListingsCache();
    if (cached.length) {
      console.warn("[Firestore] Empty snapshot received; keeping cached listings fallback.");
      db.catalog = cached;
      setSyncStatusMessage(`Firestore returned empty; using cached ${cached.length} listing(s).`, true);
      populateCategories();
      renderProducts();
      renderOrders();
      renderListingPreview();
      if (activeTab === "credits") {
        renderCreditsShop();
      }
      return;
    }
  }

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
  const runtimeConfig = window.__MEGACART_FIREBASE_CONFIG__ || window.FIREBASE_CONFIG || {};
  const mergedConfig = {
    ...FIREBASE_CONFIG_DEFAULT,
    ...FIREBASE_CONFIG,
    ...runtimeConfig
  };
  const hasConfig = mergedConfig.apiKey && mergedConfig.apiKey !== "REPLACE_ME" && mergedConfig.projectId;
  if (!hasConfig) {
    throw new Error("Firebase config missing. Set window.__MEGACART_FIREBASE_CONFIG__ or window.FIREBASE_CONFIG.");
  }
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(mergedConfig);
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
  const image = data.imageUrl || data.base64Image || fallbackImageForTitle(data.title || "item");
  return {
    id: doc.id,
    title: String(data.title || "Untitled Item"),
    category: String(data.category || "General"),
    price: round2(Math.max(0.01, Number(data.price) || 0.01)),
    rating: round2(clamp(Number(data.rating) || 4.2, 1, 5)),
    image,
    ageRestricted: Boolean(data.is21plus),
    rarity: normalizeRarity(data.rarity || "common"),
    stock: Math.max(0, Math.floor(Number(data.stock) || 50)),
    shippingTime: String(data.shippingTime || "2-4 business days"),
    ownerUsername: normalizeUsername(data.createdBy || "ronin") || "ronin",
    isPublic: true,
    description: String(data.description || "").slice(0, 500),
    reviews: [],
    createdAt: new Date(createdAtMs).toISOString()
  };
}

async function addListing(listing) {
  if (!firestoreDb) throw new Error("Firestore not initialized");
  const payload = {
    title: String(listing.title || "").trim(),
    category: String(listing.category || "").trim(),
    price: round2(Math.max(0.01, Number(listing.price) || 0.01)),
    rating: round2(clamp(Number(listing.rating) || 4.2, 1, 5)),
    description: String(listing.description || "").trim().slice(0, 500),
    rarity: normalizeRarity(listing.rarity || "common"),
    stock: Math.max(0, Math.floor(Number(listing.stock) || 0)),
    shippingTime: String(listing.shippingTime || "2-4 business days").trim().slice(0, 50),
    is21plus: Boolean(listing.is21plus),
    createdBy: String(listing.createdBy || "ronin"),
    createdAt: new Date()
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
  const snapshot = await firestoreDb.collection("listings").get();
  const listings = snapshot.docs
    .map((doc) => mapFirestoreDocToListing(doc))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return listings;
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
        catalog: SEED_PRODUCTS.map((item) => ({ ...item }))
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

    return {
      users,
      currentUserId: validIds.has(parsed.currentUserId) ? parsed.currentUserId : null,
      deletedCatalogIds,
      catalog
    };
  } catch {
    return {
      users: [],
      currentUserId: null,
      deletedCatalogIds: [],
      catalog: SEED_PRODUCTS.map((item) => ({ ...item }))
    };
  }
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
    const category = String(item.category || "General").trim().slice(0, 40) || "General";
    const price = round2(Math.max(0.01, Number(item.price) || 0.01));
    const rating = round2(clamp(Number(item.rating) || 4.2, 1, 5));
    const image = String(item.image || "").trim() || fallbackImageForTitle(title);
    const ownerUsername = normalizeUsername(item.ownerUsername || "ronin") || "ronin";
    const isPublic = true;
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
    const reviews = normalizeReviews(item.reviews);
    const createdAt = item.createdAt || new Date().toISOString();

    normalized.push({
      id,
      title,
      category,
      price,
      rating,
      image,
      ownerUsername,
      isPublic,
      ageRestricted,
      rarity,
      stock,
      shippingTime,
      description,
      reviews,
      createdAt
    });
  }

  return normalized;
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
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  if (!reviews.length) {
    return clamp(Number(product?.rating) || 4.2, 1, 5);
  }

  const total = reviews.reduce((sum, review) => sum + clamp(Number(review.rating) || 1, 1, 5), 0);
  return clamp(round2(total / reviews.length), 1, 5);
}

function normalizeCollectionInventory(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      productId: item.productId ? String(item.productId) : null,
      title: String(item.title || "Item").trim() || "Item",
      image: String(item.image || "").trim() || fallbackImageForTitle(item.title || "item"),
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
  const encoded = encodeURIComponent(title || "product");
  return `https://picsum.photos/seed/${encoded}/600/600`;
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
    demoListingsPurgedAt: db.demoListingsPurgedAt
  };
  localStorage.setItem(DB_KEY, JSON.stringify(payload));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
