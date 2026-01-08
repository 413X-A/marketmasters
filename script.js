// ================= GAME STATE =================
let game = {
  cash: 0,
  incomePerSec: 0,
  reputation: 0,
  prestige: 0,

  workers: 0,
  managers: 0,

  branches: 0,
  europe: false,
  usa: false,
  asia: false,

  marketShare: 1,

  aiPower: 10,

  achievements: []
};

const el = id => document.getElementById(id);

// ================= SAVE / LOAD =================
function saveGame() {
  localStorage.setItem("corpAscensionSave", JSON.stringify(game));
}
function loadGame() {
  const data = localStorage.getItem("corpAscensionSave");
  if (data) game = JSON.parse(data);
}

// ================= UI =================
function updateUI() {
  el("cash").textContent = Math.floor(game.cash);
  el("income").textContent = game.incomePerSec.toFixed(1);
  el("reputation").textContent = game.reputation;
  el("prestige").textContent = game.prestige;
  el("marketShare").textContent = game.marketShare.toFixed(1);

  el("workers").textContent = game.workers;
  el("managers").textContent = game.managers;
  el("branches").textContent = game.branches;
  el("aiPower").textContent = game.aiPower;

  if (game.cash >= 2000) unlock("managementPanel", "🏢 Management");
  if (game.cash >= 8000) unlock("branchesPanel", "🌍 Filialen");
  if (game.reputation >= 20) unlock("stockPanel", "🏦 Investoren");
  if (game.marketShare >= 50) unlock("prestigePanel", "🌟 Prestige");

  checkAchievements();
}

function unlock(id, title) {
  const p = el(id);
  if (p.classList.contains("locked")) {
    p.classList.remove("locked");
    p.querySelector("h2").textContent = title;
  }
}

// ================= MECHANIK =================
el("workBtn").onclick = () => {
  game.cash += 10;
  game.reputation += 0.1;
  updateUI();
};

el("hireWorkerBtn").onclick = () => {
  if (game.cash >= 100) {
    game.cash -= 100;
    game.workers++;
    recalcIncome();
    updateUI();
  }
};

el("hireManagerBtn").onclick = () => {
  if (game.cash >= 2000) {
    game.cash -= 2000;
    game.managers++;
    recalcIncome();
    updateUI();
  }
};

// ================= FILIALEN =================
el("openEuropeBtn").onclick = () => openBranch("europe", 10000, 5);
el("openUSABtn").onclick = () => openBranch("usa", 25000, 8);
el("openAsiaBtn").onclick = () => openBranch("asia", 50000, 12);

function openBranch(region, cost, shareGain) {
  if (game.cash >= cost && !game[region]) {
    game.cash -= cost;
    game[region] = true;
    game.branches++;
    game.marketShare += shareGain;
    recalcIncome();
    updateUI();
  }
}

// ================= INVESTOREN =================
el("sellSharesBtn").onclick = () => {
  game.cash += 20000;
  game.reputation = Math.max(0, game.reputation - 5);
  updateUI();
};

// ================= ECONOMY =================
function recalcIncome() {
  let base = game.workers * 5;
  let mgmt = 1 + game.managers * 0.25;
  let branchBonus = 1 + game.branches * 0.4;
  let prestigeBonus = 1 + game.prestige * 0.3;
  let marketBonus = 1 + game.marketShare / 100;

  game.incomePerSec = base * mgmt * branchBonus * prestigeBonus * marketBonus;
}

// ================= KONKURRENZ (AI) =================
function aiTick() {
  game.aiPower += 0.2;
  if (game.marketShare > 1) {
    game.marketShare -= game.aiPower * 0.001;
    if (game.marketShare < 1) game.marketShare = 1;
  }
}
setInterval(aiTick, 3000);

// ================= PRESTIGE =================
el("prestigeBtn").onclick = () => {
  if (game.marketShare < 50) return;

  game.prestige++;
  game = {
    ...game,
    cash: 0,
    incomePerSec: 0,
    reputation: 0,
    workers: 0,
    managers: 0,
    branches: 0,
    europe: false,
    usa: false,
    asia: false,
    marketShare: 1,
    aiPower: 10
  };

  alert("🌟 Prestige! Dein Konzern startet neu – aber stärker.");
  updateUI();
};

// ================= ACHIEVEMENTS =================
const achievementsData = [
  { id: "firstHire", text: "Erster Mitarbeiter", check: () => game.workers >= 1 },
  { id: "global", text: "Global Player", check: () => game.branches >= 3 },
  { id: "dominator", text: "Marktführer", check: () => game.marketShare >= 60 }
];

function checkAchievements() {
  achievementsData.forEach(a => {
    if (!game.achievements.includes(a.id) && a.check()) {
      game.achievements.push(a.id);
      const li = document.createElement("li");
      li.textContent = "🏆 " + a.text;
      li.className = "achievement";
      el("achievementList").appendChild(li);
    }
  });
}

// ================= EVENTS / STORY =================
const events = [
  { text: "📈 Medienhype! Ruf +5", effect: () => game.reputation += 5 },
  { text: "📉 Skandal! Ruf -5", effect: () => game.reputation = Math.max(0, game.reputation - 5) },
  { text: "🤝 Großkunde! +10.000€", effect: () => game.cash += 10000 }
];

function randomEvent() {
  const e = events[Math.floor(Math.random() * events.length)];
  el("eventBox").style.display = "block";
  el("eventBox").textContent = e.text;
  e.effect();
  setTimeout(() => el("eventBox").style.display = "none", 5000);
}
setInterval(randomEvent, 45000);

// ================= GAME LOOP =================
setInterval(() => {
  game.cash += game.incomePerSec;
  updateUI();
}, 1000);

setInterval(saveGame, 10000);

// ================= START =================
loadGame();
recalcIncome();
updateUI();
