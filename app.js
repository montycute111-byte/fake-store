const GUEST_STATE_KEY = "fakebank_guest_state_v1";

const dom = {
  authScreen: document.getElementById("authScreen"),
  gameScreen: document.getElementById("gameScreen"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  authError: document.getElementById("authError"),
  setupMessage: document.getElementById("setupMessage"),
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  forgotBtn: document.getElementById("forgotBtn"),
  guestBtn: document.getElementById("guestBtn"),

  whoami: document.getElementById("whoami"),
  saveStatus: document.getElementById("saveStatus"),
  saveNowBtn: document.getElementById("saveNowBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  linkGuestBtn: document.getElementById("linkGuestBtn"),

  balanceText: document.getElementById("balanceText"),
  levelText: document.getElementById("levelText"),
  xpText: document.getElementById("xpText"),
  repText: document.getElementById("repText"),
  jobStatus: document.getElementById("jobStatus"),
  jobTimer: document.getElementById("jobTimer"),

  startJobBtn: document.getElementById("startJobBtn"),
  claimJobBtn: document.getElementById("claimJobBtn"),
  dailyBtn: document.getElementById("dailyBtn"),
  buyItemBtn: document.getElementById("buyItemBtn"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  inventoryList: document.getElementById("inventoryList")
};

let auth = null;
let db = null;
let firebaseReady = false;
let firebaseApi = {
  onAuthStateChanged: null,
  createUserWithEmailAndPassword: null,
  signInWithEmailAndPassword: null,
  sendPasswordResetEmail: null,
  signOut: null,
  doc: null,
  getDoc: null,
  setDoc: null,
  updateDoc: null,
  serverTimestamp: null
};

let state = getDefaultGameState();
let currentUser = null;
let isGuestMode = false;
let saveTimer = null;
let saveInFlight = false;
let saveDirty = false;
let saveQueuedAfterFlight = false;
let pendingGuestStateForLink = null;

function getDefaultGameState() {
  const now = Date.now();

  return {
    bankBalance: 500,
    bankLevel: 1,
    bankXP: 0,
    reputation: 0,

    activeJobId: null,
    activeJobName: null,
    activeJobReward: 0,
    jobAcceptedAt: null,
    jobFinishAt: null,

    inventory: {
      upgradesBought: 0
    },

    lastDailyBonusAt: null,

    stats: {
      jobsCompleted: 0,
      dailyClaims: 0,
      totalEarned: 0,
      totalSpent: 0
    },

    meta: {
      version: 1,
      lastPlayedAt: now
    }
  };
}

function deepMerge(defaultObj, loadedObj) {
  if (Array.isArray(defaultObj)) return Array.isArray(loadedObj) ? loadedObj : defaultObj;
  if (defaultObj && typeof defaultObj === "object") {
    const out = { ...defaultObj };
    const src = loadedObj && typeof loadedObj === "object" ? loadedObj : {};
    for (const key of Object.keys(out)) {
      out[key] = deepMerge(out[key], src[key]);
    }
    for (const key of Object.keys(src)) {
      if (!(key in out)) out[key] = src[key];
    }
    return out;
  }
  return loadedObj === undefined || loadedObj === null ? defaultObj : loadedObj;
}

function applyLoadedGameState(loaded) {
  state = deepMerge(getDefaultGameState(), loaded || {});
  state.meta.lastPlayedAt = Date.now();
}

function exportGameStateForSave() {
  const merged = deepMerge(getDefaultGameState(), state);
  merged.meta.lastPlayedAt = Date.now();
  return merged;
}

async function loadUserGameState(uid) {
  const userRef = firebaseApi.doc(db, "users", uid);
  const snap = await firebaseApi.getDoc(userRef);

  if (!snap.exists()) {
    const defaultState = getDefaultGameState();
    await firebaseApi.setDoc(
      userRef,
      {
        email: auth.currentUser?.email || "",
        createdAt: firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp(),
        gameState: defaultState
      },
      { merge: true }
    );
    return defaultState;
  }

  const data = snap.data() || {};
  return deepMerge(getDefaultGameState(), data.gameState || {});
}

async function saveUserGameState(uid, gameState) {
  const userRef = firebaseApi.doc(db, "users", uid);

  try {
    await firebaseApi.updateDoc(userRef, {
      email: auth.currentUser?.email || "",
      updatedAt: firebaseApi.serverTimestamp(),
      gameState
    });
  } catch {
    await firebaseApi.setDoc(
      userRef,
      {
        email: auth.currentUser?.email || "",
        createdAt: firebaseApi.serverTimestamp(),
        updatedAt: firebaseApi.serverTimestamp(),
        gameState
      },
      { merge: true }
    );
  }
}

function setSaveStatus(status) {
  dom.saveStatus.className = `status ${status}`;

  if (status === "saved") dom.saveStatus.textContent = "Saved";
  if (status === "saving") dom.saveStatus.textContent = "Saving...";
  if (status === "error") dom.saveStatus.textContent = "Save failed";
  if (status === "offline") dom.saveStatus.textContent = "Offline / save pending";
}

async function flushSaveQueue() {
  if (!currentUser || isGuestMode) return;
  if (saveInFlight) {
    saveQueuedAfterFlight = true;
    return;
  }
  if (!saveDirty) return;

  saveInFlight = true;
  saveDirty = false;
  setSaveStatus("saving");

  try {
    await saveUserGameState(currentUser.uid, exportGameStateForSave());
    setSaveStatus("saved");
  } catch {
    saveDirty = true;
    setSaveStatus(navigator.onLine ? "error" : "offline");
  } finally {
    saveInFlight = false;
    if (saveQueuedAfterFlight || saveDirty) {
      saveQueuedAfterFlight = false;
      scheduleAutosave();
    }
  }
}

function scheduleAutosave() {
  if (!firebaseReady || !currentUser || isGuestMode) {
    saveGuestState();
    return;
  }

  saveDirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSaveQueue, 500);
}

async function saveNow() {
  if (!firebaseReady || isGuestMode) {
    saveGuestState();
    setSaveStatus("saved");
    return;
  }

  saveDirty = true;
  clearTimeout(saveTimer);
  await flushSaveQueue();
}

function saveGuestState() {
  localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(exportGameStateForSave()));
}

function loadGuestState() {
  try {
    const raw = localStorage.getItem(GUEST_STATE_KEY);
    if (!raw) return getDefaultGameState();
    const parsed = JSON.parse(raw);
    return deepMerge(getDefaultGameState(), parsed);
  } catch {
    return getDefaultGameState();
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

function setAuthError(msg) {
  dom.authError.textContent = msg || "";
}

function formatError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential")) return "Invalid email or password.";
  if (code.includes("wrong-password")) return "Invalid email or password.";
  if (code.includes("user-not-found")) return "No account found for that email.";
  if (code.includes("email-already-in-use")) return "Email already in use.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("invalid-email")) return "Invalid email address.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again later.";
  return "Something went wrong. Please try again.";
}

function xpToNext(level) {
  return level * 50;
}

function addXP(amount) {
  state.bankXP += amount;

  while (state.bankXP >= xpToNext(state.bankLevel)) {
    state.bankXP -= xpToNext(state.bankLevel);
    state.bankLevel += 1;
  }
}

function canClaimDaily() {
  const now = Date.now();
  return !state.lastDailyBonusAt || now - state.lastDailyBonusAt >= 24 * 60 * 60 * 1000;
}

function startMainJob() {
  if (state.activeJobId) return;

  const now = Date.now();
  const baseReward = 120 + state.bankLevel * 20;

  state.activeJobId = "main-job";
  state.activeJobName = "General Shift";
  state.activeJobReward = baseReward;
  state.jobAcceptedAt = now;
  state.jobFinishAt = now + 60 * 1000;

  scheduleAutosave();
  render();
}

function claimMainJob() {
  if (!state.activeJobId || !state.jobFinishAt) return;
  if (Date.now() < state.jobFinishAt) return;

  const tax = Math.floor(state.activeJobReward * 0.1);
  const payout = state.activeJobReward - tax;

  state.bankBalance += payout;
  state.stats.totalEarned += payout;
  state.stats.jobsCompleted += 1;
  state.reputation += 1;
  addXP(12);

  state.activeJobId = null;
  state.activeJobName = null;
  state.activeJobReward = 0;
  state.jobAcceptedAt = null;
  state.jobFinishAt = null;

  saveNow();
  render();
}

function claimDailyBonus() {
  if (!canClaimDaily()) return;

  const bonus = 300 + Math.floor(Math.random() * 401);
  state.bankBalance += bonus;
  state.stats.totalEarned += bonus;
  state.stats.dailyClaims += 1;
  state.lastDailyBonusAt = Date.now();

  saveNow();
  render();
}

function buyUpgrade() {
  const cost = 250;
  if (state.bankBalance < cost) return;

  state.bankBalance -= cost;
  state.stats.totalSpent += cost;
  state.inventory.upgradesBought += 1;

  saveNow();
  render();
}

function resetProgress() {
  const ok = window.confirm("Reset all progress for this account?");
  if (!ok) return;

  state = getDefaultGameState();
  saveNow();
  render();
}

function render() {
  dom.balanceText.textContent = `$${state.bankBalance.toLocaleString()}`;
  dom.levelText.textContent = String(state.bankLevel);
  dom.xpText.textContent = `${state.bankXP} / ${xpToNext(state.bankLevel)}`;
  dom.repText.textContent = String(state.reputation);

  const now = Date.now();
  const hasJob = !!state.activeJobId;
  const readyToClaim = hasJob && now >= (state.jobFinishAt || 0);

  dom.jobStatus.textContent = hasJob ? `${state.activeJobName} - Reward $${state.activeJobReward}` : "No active job";

  if (!hasJob) {
    dom.jobTimer.textContent = "--:--";
  } else {
    const remaining = Math.max(0, state.jobFinishAt - now);
    const sec = Math.floor(remaining / 1000);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    dom.jobTimer.textContent = readyToClaim ? "Ready to claim" : `${mm}:${ss}`;
  }

  dom.startJobBtn.disabled = hasJob;
  dom.claimJobBtn.disabled = !readyToClaim;
  dom.dailyBtn.disabled = !canClaimDaily();
  dom.buyItemBtn.disabled = state.bankBalance < 250;

  dom.inventoryList.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = `Upgrades bought: ${state.inventory.upgradesBought}`;
  dom.inventoryList.appendChild(item);
}

function bindGameEvents() {
  dom.startJobBtn.addEventListener("click", startMainJob);
  dom.claimJobBtn.addEventListener("click", claimMainJob);
  dom.dailyBtn.addEventListener("click", claimDailyBonus);
  dom.buyItemBtn.addEventListener("click", buyUpgrade);
  dom.resetProgressBtn.addEventListener("click", resetProgress);
  dom.saveNowBtn.addEventListener("click", saveNow);

  dom.linkGuestBtn.addEventListener("click", async () => {
    if (!pendingGuestStateForLink || !currentUser || isGuestMode) return;
    applyLoadedGameState(pendingGuestStateForLink);
    await saveNow();
    localStorage.removeItem(GUEST_STATE_KEY);
    pendingGuestStateForLink = null;
    dom.linkGuestBtn.classList.add("hidden");
    render();
  });

  dom.logoutBtn.addEventListener("click", async () => {
    if (isGuestMode) {
      isGuestMode = false;
      currentUser = null;
      setSaveStatus("saved");
      showAuthScreen();
      return;
    }
    if (!auth || !firebaseReady) return;
    await firebaseApi.signOut(auth);
  });

  setInterval(() => {
    if (!dom.gameScreen.classList.contains("hidden")) render();
  }, 1000);
}

function bindAuthEvents() {
  dom.loginBtn.addEventListener("click", async () => {
    setAuthError("");
    if (!auth || !firebaseReady) {
      setAuthError("Cloud login is not set up yet. Use Play As Guest.");
      return;
    }

    try {
      await firebaseApi.signInWithEmailAndPassword(
        auth,
        dom.emailInput.value.trim(),
        dom.passwordInput.value
      );
    } catch (err) {
      setAuthError(formatError(err));
    }
  });

  dom.signupBtn.addEventListener("click", async () => {
    setAuthError("");
    if (!auth || !firebaseReady) {
      setAuthError("Cloud sign up is not set up yet. Use Play As Guest.");
      return;
    }

    try {
      await firebaseApi.createUserWithEmailAndPassword(
        auth,
        dom.emailInput.value.trim(),
        dom.passwordInput.value
      );
    } catch (err) {
      setAuthError(formatError(err));
    }
  });

  dom.forgotBtn.addEventListener("click", async () => {
    setAuthError("");
    if (!auth || !firebaseReady) {
      setAuthError("Cloud auth is not set up yet. Use Play As Guest.");
      return;
    }

    const email = dom.emailInput.value.trim();
    if (!email) {
      setAuthError("Enter your email first.");
      return;
    }

    try {
      await firebaseApi.sendPasswordResetEmail(auth, email);
      setAuthError("Password reset email sent.");
    } catch (err) {
      setAuthError(formatError(err));
    }
  });

  dom.guestBtn.addEventListener("click", () => {
    setAuthError("");
    isGuestMode = true;
    currentUser = { uid: "guest" };
    applyLoadedGameState(loadGuestState());
    dom.whoami.textContent = "Guest mode (local only)";
    dom.linkGuestBtn.classList.add("hidden");
    showGameScreen();
    setSaveStatus("saved");
    render();
  });
}

async function handleAuthState(user) {
  if (!user) {
    if (!isGuestMode) {
      currentUser = null;
      state = getDefaultGameState();
      showAuthScreen();
      setSaveStatus("saved");
    }
    return;
  }

  isGuestMode = false;
  currentUser = user;

  try {
    setSaveStatus("saving");

    const guestLocal = loadGuestState();
    pendingGuestStateForLink = localStorage.getItem(GUEST_STATE_KEY) ? guestLocal : null;

    const loaded = await loadUserGameState(user.uid);
    applyLoadedGameState(loaded);

    dom.whoami.textContent = `${user.email || "Account"}`;
    dom.linkGuestBtn.classList.toggle("hidden", !pendingGuestStateForLink);

    showGameScreen();
    setSaveStatus("saved");
    render();
  } catch {
    setSaveStatus("offline");
    setAuthError("Failed to load cloud save. Check connection and try again.");
  }
}

async function initFirebaseServices() {
  if (!window.FIREBASE_CONFIG) {
    dom.setupMessage.textContent =
      "Firebase is not configured. Add window.FIREBASE_CONFIG to enable cloud login.";
    return;
  }

  try {
    const mod = await import("./firebase.js");
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
      sendPasswordResetEmail: mod.sendPasswordResetEmail,
      signOut: mod.signOut,
      doc: mod.doc,
      getDoc: mod.getDoc,
      setDoc: mod.setDoc,
      updateDoc: mod.updateDoc,
      serverTimestamp: mod.serverTimestamp
    };
    dom.setupMessage.textContent = "";
  } catch {
    dom.setupMessage.textContent =
      "Failed to load Firebase SDK. Check internet/CORS settings or use Play As Guest.";
  }
}

async function init() {
  bindGameEvents();
  bindAuthEvents();
  showAuthScreen();

  await initFirebaseServices();

  if (firebaseReady) {
    firebaseApi.onAuthStateChanged(auth, handleAuthState);
  }

  window.addEventListener("online", () => {
    if (currentUser && !isGuestMode && firebaseReady) {
      scheduleAutosave();
    }
  });
}

init();
