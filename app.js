(() => {
  const STORAGE_KEY = "fakebank_state_v1";
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

  const BOOSTS = [
    { id: "focus", name: "Work Focus", baseCost: 2500, durationMs: 5 * 60 * 1000, desc: "+15% payout" },
    { id: "drink", name: "Energy Drink", baseCost: 3000, durationMs: 5 * 60 * 1000, desc: "-15% duration" },
    { id: "charm", name: "Lucky Charm", baseCost: 4000, durationMs: 5 * 60 * 1000, desc: "Better risky odds" }
  ];

  const BUSINESSES = [
    { id: "lemonade", name: "Lemonade Stand", baseCost: 10000, intervalMs: 10 * 60 * 1000, basePayout: 50 },
    { id: "shop", name: "Online Shop", baseCost: 100000, intervalMs: 10 * 60 * 1000, basePayout: 300 },
    { id: "firm", name: "Investment Firm", baseCost: 1000000, intervalMs: 60 * 60 * 1000, basePayout: 0 }
  ];

  const SKILL_CAPS = { efficiency: 10, speed: 10, luck: 10, charisma: 30 };

  const dom = {
    tabBankBtn: document.getElementById("tabBankBtn"),
    tabSpendBtn: document.getElementById("tabSpendBtn"),
    bankTab: document.getElementById("bankTab"),
    spendTab: document.getElementById("spendTab"),
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
    mainJobTimer: document.getElementById("mainJobTimer"),
    mainFinishAt: document.getElementById("mainFinishAt"),
    claimMainJobBtn: document.getElementById("claimMainJobBtn"),
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
    boostTimer: document.getElementById("boostTimer"),
    boostShop: document.getElementById("boostShop"),

    skillPointText: document.getElementById("skillPointText"),
    trainingCostText: document.getElementById("trainingCostText"),
    buyTrainingBtn: document.getElementById("buyTrainingBtn"),
    skillsPanel: document.getElementById("skillsPanel"),

    businessPanel: document.getElementById("businessPanel"),

    coinBetInput: document.getElementById("coinBetInput"),
    coinFlipBtn: document.getElementById("coinFlipBtn"),
    coinFlipHint: document.getElementById("coinFlipHint"),
    coinFlipStats: document.getElementById("coinFlipStats"),

    confettiLayer: document.getElementById("confettiLayer")
  };

  const state = loadState();
  let balanceDisplay = state.bankBalance;

  function getDefaultState() {
    const now = Date.now();
    return {
      bankBalance: 500,
      bankLevel: 1,
      bankXP: 0,
      reputation: 0,
      txLog: [],

      activeJobId: null,
      jobAcceptedAt: null,
      jobFinishAt: null,
      jobCooldownUntil: null,

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

      activeBoostId: null,
      boostEndsAt: null,

      skillPoints: 0,
      trainingsBought: 0,
      skills: { efficiency: 0, speed: 0, luck: 0, charisma: 0 },

      ownedBusinesses: {},

      casinoStats: { wins: 0, losses: 0 },

      lastDailyBonusAt: null,
      lastInterestAt: null,

      passiveCapWindowStart: now,
      passiveEarnedInWindow: 0
    };
  }

  function loadState() {
    const defaults = getDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      const merged = { ...defaults, ...parsed };
      merged.skills = { ...defaults.skills, ...(parsed.skills || {}) };
      merged.casinoStats = { ...defaults.casinoStats, ...(parsed.casinoStats || {}) };
      merged.ownedBusinesses = parsed.ownedBusinesses || {};
      return merged;
    } catch {
      return defaults;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function fmtMoney(v) {
    return `$${Math.max(0, Math.floor(v)).toLocaleString()}`;
  }

  function fmtDur(ms) {
    if (ms <= 0) return "00:00";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function fmtTs(ts) {
    return ts ? new Date(ts).toLocaleTimeString() : "--";
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function streakBonusPct() {
    const s = state.mainStreak;
    if (s >= 10) return 0.15;
    if (s >= 5) return 0.08;
    if (s >= 2) return 0.03;
    return 0;
  }

  function getModifiers() {
    const efficiency = Math.min(state.skills.efficiency, 10);
    const speed = Math.min(state.skills.speed, 10);
    const luck = Math.min(state.skills.luck, 10);
    const charisma = Math.max(0, state.skills.charisma || 0);

    let payoutMult = 1 + efficiency * 0.02;
    let durationMult = 1 - speed * 0.02;
    let xpMult = 1;
    let interestMult = 1;
    let riskyLuckBonus = Math.min(0.15, luck * 0.015);

    if (state.activeBoostId && state.boostEndsAt && Date.now() < state.boostEndsAt) {
      if (state.activeBoostId === "focus") payoutMult *= 1.15;
      if (state.activeBoostId === "drink") durationMult *= 0.85;
      if (state.activeBoostId === "charm") riskyLuckBonus += 0.10;
    }

    payoutMult = Math.min(payoutMult, 2.5);
    durationMult = Math.max(durationMult, 0.60);

    return {
      payoutMult,
      durationMult,
      xpMult,
      interestMult,
      riskyLuckBonus,
      repGainBonus: Math.floor(charisma / 3)
    };
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

  function addTx(type, amount, meta = {}) {
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

  function canTakeMainJob(now = Date.now()) {
    if (state.activeJobId) return { ok: false, reason: "You already have an active main job." };
    if (state.jobCooldownUntil && now < state.jobCooldownUntil) return { ok: false, reason: "Main job cooldown active." };
    return { ok: true, reason: "" };
  }

  function acceptMainJob(jobId) {
    const now = Date.now();
    const job = MAIN_JOBS.find((j) => j.id === jobId);
    if (!job) return;
    if (state.bankLevel < job.unlockLevel) return;

    const check = canTakeMainJob(now);
    if (!check.ok) return;

    if (state.streakWindowUntil && now <= state.streakWindowUntil) state.mainStreak += 1;
    else state.mainStreak = 0;

    const mods = getModifiers();
    const effectiveDurationMs = Math.max(30 * 1000, Math.round(job.durationMin * 60 * 1000 * mods.durationMult));

    state.activeJobId = job.id;
    state.jobAcceptedAt = now;
    state.jobFinishAt = now + effectiveDurationMs;

    saveState();
    render();
  }

  function claimMainJob() {
    const now = Date.now();
    if (!state.activeJobId || !state.jobFinishAt || now < state.jobFinishAt) return;

    const job = MAIN_JOBS.find((j) => j.id === state.activeJobId);
    if (!job) return;

    state.activeJobId = null;
    state.jobAcceptedAt = null;
    state.jobFinishAt = null;
    saveState();

    const mods = getModifiers();
    let reward = Math.round(calcMainBaseReward(job) * mods.payoutMult);
    const risky = rollRiskyReward(job, reward, mods.riskyLuckBonus);
    reward = Math.round(risky.reward);

    const tax = Math.floor(reward * 0.10);
    let finalPayout = reward - tax;
    finalPayout = Math.round(finalPayout * (1 + streakBonusPct()));

    state.bankBalance += finalPayout;
    const xpBase = Math.ceil(job.durationMin / 2);
    gainXP(Math.ceil(xpBase * mods.xpMult));
    state.reputation += risky.repDelta + mods.repGainBonus;

    state.jobCooldownUntil = now + MAIN_COOLDOWN_MS;
    state.lastMainJobClaimAt = now;
    state.streakWindowUntil = now + STREAK_WINDOW_MS;

    addTx("main_job", finalPayout, { job: job.name, gross: reward, tax, streakBonus: streakBonusPct() });
    if (finalPayout > 5000) confettiBurst();

    saveState();
    render();
  }

  function resetQuickWindow(now = Date.now()) {
    if (!state.quickTaskWindowResetAt || now >= state.quickTaskWindowResetAt) {
      state.quickTasksUsedInWindow = 0;
      state.quickTaskWindowResetAt = now + QUICK_WINDOW_MS;
    }
  }

  function acceptQuickTask(id) {
    const now = Date.now();
    resetQuickWindow(now);
    if (state.quickTaskActiveId) return;
    if (state.quickTasksUsedInWindow >= QUICK_MAX_IN_WINDOW) return;

    const task = QUICK_TASKS.find((q) => q.id === id);
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
    const payout = scaled - tax;

    state.bankBalance += payout;
    gainXP(Math.max(1, Math.ceil(task.durationSec / 30)));
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
          id: `opp_${now}`,
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

    const check = canTakeMainJob(now);
    if (!check.ok) return;

    if (state.streakWindowUntil && now <= state.streakWindowUntil) state.mainStreak += 1;
    else state.mainStreak = 0;

    const mods = getModifiers();
    const durationMs = Math.max(30 * 1000, Math.round(opp.durationMin * 60 * 1000 * mods.durationMult));

    state.activeJobId = opp.id;
    state.jobAcceptedAt = now;
    state.jobFinishAt = now + durationMs;

    MAIN_JOBS.push({
      id: opp.id,
      name: opp.title,
      durationMin: opp.durationMin,
      basePay: opp.basePay,
      unlockLevel: 1,
      category: "general",
      temporary: true
    });

    state.activeOpportunity = null;
    saveState();
    render();
  }

  function boostCost(boost) {
    return Math.round(boost.baseCost * (1 + (state.bankLevel - 1) * 0.08));
  }

  function buyBoost(id) {
    const now = Date.now();
    if (state.activeBoostId && state.boostEndsAt && now < state.boostEndsAt) return;
    const boost = BOOSTS.find((b) => b.id === id);
    if (!boost) return;
    const cost = boostCost(boost);
    if (state.bankBalance < cost) return;

    state.bankBalance -= cost;
    state.activeBoostId = boost.id;
    state.boostEndsAt = now + boost.durationMs;
    addTx("boost_purchase", -cost, { boost: boost.name });
    saveState();
    render();
  }

  function getTrainingCost() {
    return Math.round(25000 * Math.pow(1.25, state.trainingsBought));
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
    const cap = SKILL_CAPS[skill] ?? 10;
    if (state.skills[skill] >= cap) return;

    state.skills[skill] += 1;
    state.skillPoints -= 1;
    saveState();
    render();
  }

  function businessEntry(id) {
    if (!state.ownedBusinesses[id]) state.ownedBusinesses[id] = { level: 0, lastPaidAt: Date.now() };
    return state.ownedBusinesses[id];
  }

  function businessUpgradeCost(biz, level) {
    return Math.round(biz.baseCost * Math.pow(1.8, Math.max(0, level)));
  }

  function buyOrUpgradeBusiness(id) {
    const biz = BUSINESSES.find((b) => b.id === id);
    if (!biz) return;
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

  function expectedActiveHourly() {
    const lvlFactor = 1 + state.bankLevel * 0.15;
    return Math.round(2200 * lvlFactor);
  }

  function processPassiveIncome() {
    const now = Date.now();
    const mods = getModifiers();

    if (!state.passiveCapWindowStart || now - state.passiveCapWindowStart >= 60 * 60 * 1000) {
      state.passiveCapWindowStart = now;
      state.passiveEarnedInWindow = 0;
    }

    const cap = Math.max(15000, Math.floor(expectedActiveHourly() * 0.35));
    let capLeft = Math.max(0, cap - state.passiveEarnedInWindow);

    for (const biz of BUSINESSES) {
      const ent = state.ownedBusinesses[biz.id];
      if (!ent || ent.level <= 0) continue;

      const last = ent.lastPaidAt || now;
      let intervals = Math.floor((now - last) / biz.intervalMs);
      if (intervals <= 0) continue;
      intervals = Math.min(intervals, 6);

      let payoutEach = 0;
      if (biz.id === "firm") {
        payoutEach = Math.min(Math.floor(state.bankBalance * 0.01 * (1 + 0.25 * (ent.level - 1))), Math.round(10000 * (1 + 0.2 * (ent.level - 1))));
      } else {
        payoutEach = Math.floor(biz.basePayout * (1 + 0.35 * (ent.level - 1)) * mods.payoutMult);
      }

      let total = payoutEach * intervals;
      if (total > capLeft) total = capLeft;
      if (total <= 0) {
        ent.lastPaidAt = now;
        continue;
      }

      state.bankBalance += total;
      state.passiveEarnedInWindow += total;
      capLeft -= total;
      ent.lastPaidAt = now;

      addTx("passive_income", total, { business: biz.name, intervals });
      if (capLeft <= 0) break;
    }
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
    const mods = getModifiers();
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
      dom.coinFlipHint.textContent = `Max bet right now is ${fmtMoney(maxBet)}.`;
      return;
    }
    if (bet > state.bankBalance) return;

    state.bankBalance -= bet;
    const win = Math.random() < 0.5;
    if (win) {
      const payout = Math.floor(bet * 1.9);
      state.bankBalance += payout;
      state.casinoStats.wins += 1;
      addTx("coin_flip", payout - bet, { bet, outcome: "win" });
      dom.coinFlipHint.textContent = `Win! Net +${fmtMoney(payout - bet)}.`;
    } else {
      state.casinoStats.losses += 1;
      addTx("coin_flip", -bet, { bet, outcome: "loss" });
      dom.coinFlipHint.textContent = `Loss. -${fmtMoney(bet)}.`;
    }
    saveState();
    render();
  }

  function resetSave() {
    if (!confirm("Reset all progress?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
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
    const active = state.activeJobId ? MAIN_JOBS.find((j) => j.id === state.activeJobId) : null;
    if (!active) {
      dom.mainJobStatus.textContent = "No active main job";
      dom.mainJobTimer.textContent = "--:--";
      dom.mainFinishAt.textContent = "Finish: --";
      dom.claimMainJobBtn.disabled = true;
    } else {
      const remain = state.jobFinishAt - now;
      dom.mainJobStatus.textContent = `Active: ${active.name}`;
      dom.mainJobTimer.textContent = fmtDur(remain);
      dom.mainFinishAt.textContent = `Finish: ${fmtTs(state.jobFinishAt)}`;
      dom.claimMainJobBtn.disabled = remain > 0;
    }

    const cooldownRemain = state.jobCooldownUntil && now < state.jobCooldownUntil ? state.jobCooldownUntil - now : 0;
    dom.cooldownStatus.textContent = cooldownRemain > 0 ? `Cooldown: ${fmtDur(cooldownRemain)}` : "Cooldown ready";

    const streakBonus = Math.round(streakBonusPct() * 100);
    dom.streakText.textContent = `Streak: ${state.mainStreak} (+${streakBonus}%)`;
    if (state.streakWindowUntil && now < state.streakWindowUntil) {
      dom.streakWindowText.textContent = `Keep streak: start next job within ${fmtDur(state.streakWindowUntil - now)}`;
    } else {
      if (state.streakWindowUntil && now >= state.streakWindowUntil) {
        state.mainStreak = 0;
        state.streakWindowUntil = null;
      }
      dom.streakWindowText.textContent = "No active streak window";
    }

    dom.jobBoard.innerHTML = "";
    const mods = getModifiers();
    MAIN_JOBS.filter((j) => !j.temporary).forEach((job) => {
      const can = canTakeMainJob(now).ok && state.bankLevel >= job.unlockLevel;
      const row = document.createElement("div");
      row.className = "job-row";
      const base = Math.round(calcMainBaseReward(job) * mods.payoutMult);
      const taxed = base - Math.floor(base * 0.1);
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
      btn.onclick = () => acceptMainJob(job.id);
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
      const taxed = scaled - Math.floor(scaled * 0.1);
      row.innerHTML = `<div class="row-head"><strong>${task.name}</strong><span>${task.durationSec}s</span></div><div class="row-meta">Est ${fmtMoney(taxed)}</div>`;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = "Start";
      btn.disabled = !!state.quickTaskActiveId || left <= 0;
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
      dom.opportunityStatus.textContent = `${opp.title} available!`;
      dom.opportunityTimer.textContent = remain > 0 ? `Accept within ${fmtDur(remain)}` : "Expired";
      dom.acceptOpportunityBtn.disabled = remain <= 0;
    }
    const next = state.nextOpportunityCheckAt && now < state.nextOpportunityCheckAt ? fmtDur(state.nextOpportunityCheckAt - now) : "rolling now";
    dom.nextOpportunityText.textContent = `Next roll: ${next}`;
  }

  function renderSpend(now) {
    if (state.activeBoostId && state.boostEndsAt && now >= state.boostEndsAt) {
      state.activeBoostId = null;
      state.boostEndsAt = null;
    }

    if (state.activeBoostId) {
      const boost = BOOSTS.find((b) => b.id === state.activeBoostId);
      dom.boostStatus.textContent = `Active boost: ${boost.name}`;
      dom.boostTimer.textContent = fmtDur(state.boostEndsAt - now);
    } else {
      dom.boostStatus.textContent = "No active boost";
      dom.boostTimer.textContent = "--:--";
    }

    dom.boostShop.innerHTML = "";
    BOOSTS.forEach((boost) => {
      const cost = boostCost(boost);
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>${boost.name}</strong><span>${fmtMoney(cost)}</span></div><div class="row-meta">${boost.desc} for 5m</div>`;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Buy";
      btn.disabled = !!state.activeBoostId || state.bankBalance < cost;
      btn.onclick = () => buyBoost(boost.id);
      row.appendChild(btn);
      dom.boostShop.appendChild(row);
    });

    dom.skillPointText.textContent = `Skill Points: ${state.skillPoints}`;
    dom.trainingCostText.textContent = `Training Cost: ${fmtMoney(getTrainingCost())}`;
    dom.buyTrainingBtn.disabled = state.bankBalance < getTrainingCost();

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

    dom.businessPanel.innerHTML = "";
    BUSINESSES.forEach((biz) => {
      const ent = businessEntry(biz.id);
      const cost = businessUpgradeCost(biz, ent.level);
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<div class="row-head"><strong>${biz.name}</strong><span>Lvl ${ent.level}/5</span></div><div class="row-meta">Upgrade ${fmtMoney(cost)} | interval ${fmtDur(biz.intervalMs)}</div>`;
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.textContent = ent.level === 0 ? "Buy" : "Upgrade";
      btn.disabled = ent.level >= 5 || state.bankBalance < cost;
      btn.onclick = () => buyOrUpgradeBusiness(biz.id);
      row.appendChild(btn);
      dom.businessPanel.appendChild(row);
    });

    dom.coinFlipStats.textContent = `Wins: ${state.casinoStats.wins} | Losses: ${state.casinoStats.losses}`;
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
    renderLog();

    saveState();
  }

  function tick1s() {
    const now = Date.now();
    if (state.streakWindowUntil && now > state.streakWindowUntil) {
      state.mainStreak = 0;
      state.streakWindowUntil = null;
    }
    render();
  }

  function tick30s() {
    opportunityCheck();
    processPassiveIncome();
    render();
  }

  function wire() {
    dom.tabBankBtn.onclick = () => {
      dom.tabBankBtn.classList.add("active");
      dom.tabSpendBtn.classList.remove("active");
      dom.bankTab.classList.remove("hidden");
      dom.spendTab.classList.add("hidden");
    };

    dom.tabSpendBtn.onclick = () => {
      dom.tabSpendBtn.classList.add("active");
      dom.tabBankBtn.classList.remove("active");
      dom.spendTab.classList.remove("hidden");
      dom.bankTab.classList.add("hidden");
    };

    dom.resetSaveBtn.onclick = resetSave;

    dom.claimMainJobBtn.onclick = claimMainJob;
    dom.claimQuickTaskBtn.onclick = claimQuickTask;
    dom.acceptOpportunityBtn.onclick = acceptOpportunity;

    dom.dailyBtn.onclick = claimDailyBonus;
    dom.interestBtn.onclick = applyInterest;

    dom.buyTrainingBtn.onclick = buyTrainingPoint;
    dom.coinFlipBtn.onclick = coinFlip;
  }

  function init() {
    const now = Date.now();

    if (!state.quickTaskWindowResetAt) state.quickTaskWindowResetAt = now + QUICK_WINDOW_MS;
    if (!state.nextOpportunityCheckAt) state.nextOpportunityCheckAt = now + randInt(5 * 60 * 1000, 10 * 60 * 1000);

    opportunityCheck();
    processPassiveIncome();

    wire();
    render();

    setInterval(tick1s, 1000);
    setInterval(tick30s, 30000);
  }

  init();
})();
