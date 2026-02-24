const DB_KEY = "megacart_accounts_v1";

const ui = {
  creditsBalance: document.querySelector("#creditsBalance"),
  creditsUserLabel: document.querySelector("#creditsUserLabel"),
  creditsMsg: document.querySelector("#creditsMsg"),
  options: document.querySelectorAll(".credit-option")
};

init();

function init() {
  render();
  ui.options.forEach((button) => {
    button.addEventListener("click", () => {
      const amount = Number(button.dataset.amount || 0);
      if (!amount || amount < 0) return;
      addCredits(amount);
    });
  });
}

function addCredits(amount) {
  const db = loadDb();
  const user = db.users.find((item) => item.id === db.currentUserId);
  if (!user) {
    ui.creditsMsg.textContent = "Sign in on the store page first.";
    ui.creditsMsg.classList.add("error");
    return;
  }

  user.progress.balance = round2((Number(user.progress.balance) || 0) + amount);
  persistDb(db);
  render();
  ui.creditsMsg.textContent = `Added ${amount} credits to @${user.username}.`;
  ui.creditsMsg.classList.remove("error");
}

function render() {
  const db = loadDb();
  const user = db.users.find((item) => item.id === db.currentUserId);

  if (!user) {
    ui.creditsUserLabel.textContent = "No active account.";
    ui.creditsBalance.textContent = "0.00 Credits";
    ui.options.forEach((button) => {
      button.disabled = true;
    });
    return;
  }

  ui.creditsUserLabel.textContent = `Signed in as @${user.username}`;
  ui.creditsBalance.textContent = `${(Number(user.progress.balance) || 0).toFixed(2)} Credits`;
  ui.options.forEach((button) => {
    button.disabled = false;
  });
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users)
          ? parsed.users.map((user) => ({
              id: user.id,
              username: String(user.username || ""),
              password: String(user.password || ""),
              progress: {
                ...(user.progress || {}),
                balance: Number(user.progress?.balance) || 0
              }
            }))
          : [],
        currentUserId: parsed.currentUserId || null
      };
    }
  } catch {
    // fallback below
  }

  return { users: [], currentUserId: null };
}

function persistDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
