// ======================
// SPIELZUSTAND
// ======================
const game = {
  day: 1,
  money: 2000,
  reputation: 50,
  prestige: 0,
  satisfaction: 60,
  marketShare: 5,

  maxStaff: 2,
  staff: [],

  upgrades: {
    marketing: 0,
    service: 0,
    warehouse: 0
  },

  branches: 1,

  products: [
    {id:1,name:"Wasser", buy:0.3, price:1, stock:50, unlocked:true},
    {id:2,name:"Brot", buy:0.5, price:1.5, stock:40, unlocked:true},
    {id:3,name:"Kaffee", buy:1, price:3, stock:0, unlocked:false},
    {id:4,name:"Premium Snack", buy:2, price:5, stock:0, unlocked:false},
    {id:5,name:"Luxus Box", buy:5, price:12, stock:0, unlocked:false}
  ]
};

// ======================
// PREISAMPEL
// ======================
function priceStatus(p){
  const r = p.price / p.buy;
  if(r < 2) return ["green","Fair"];
  if(r < 3.5) return ["yellow","Teuer"];
  return ["red","Abzocke"];
}

// ======================
// NACHFRAGE
// ======================
function demandChance(p){
  let c = 0.3;
  const r = p.price / p.buy;

  if(r < 2) c += 0.25;
  else if(r < 3.5) c += 0.05;
  else c -= 0.3;

  c += game.reputation / 200;
  c += game.satisfaction / 200;
  c += game.upgrades.marketing * 0.05;

  return Math.max(0.05, Math.min(0.95, c));
}

// ======================
// TAGESSIMULATION
// ======================
function nextDay(){
  let complaints = 0;
  let soldTotal = 0;

  game.products.forEach(p=>{
    if(!p.unlocked || p.stock <= 0) return;

    const customers = Math.floor((5 + Math.random()*10) * game.branches);
    const chance = demandChance(p);

    for(let i=0;i<customers;i++){
      if(p.stock <= 0) break;
      if(Math.random() < chance){
        p.stock--;
        game.money += p.price;
        soldTotal++;
        game.satisfaction += 0.05;
      }
    }

    if(priceStatus(p)[0] === "red" && Math.random() < 0.25){
      complaints++;
    }
  });

  if(complaints > 0){
    game.reputation -= complaints * 4;
    game.satisfaction -= complaints * 2;
    logEvent("⚠️ " + complaints + " Beschwerden wegen hoher Preise!");
  }

  game.marketShare += soldTotal * 0.01;
  if(game.marketShare > 100) game.marketShare = 100;

  if(Math.random() < 0.3) randomEvent();

  checkRisks();
  unlockSystem();

  game.day++;
  render();
}

// ======================
// EVENTS
// ======================
function randomEvent(){
  const r = Math.random();

  if(r < 0.33){
    game.money += 400;
    game.reputation += 8;
    logEvent("📺 TV-Bericht bringt +400€, +8 Ruf");
  }else if(r < 0.66){
    game.money -= 300;
    game.reputation -= 12;
    logEvent("🚨 Skandal kostet -300€, -12 Ruf");
  }else{
    game.prestige += 2;
    logEvent("🏆 Branchenpreis: +2 Ansehen");
  }
}

// ======================
// STRAFEN
// ======================
function checkRisks(){
  if(game.reputation < 20 && Math.random() < 0.3){
    game.money -= 500;
    logEvent("🚓 Behördenstrafe: -500€");
  }
}

// ======================
// FREISCHALTUNGEN
// ======================
function unlockSystem(){
  if(game.reputation > 60) unlockProduct(3);
  if(game.reputation > 80){
    unlockProduct(4);
    game.maxStaff = 4;
  }
  if(game.prestige >= 5){
    unlockProduct(5);
    game.branches = 2;
  }
}

function unlockProduct(id){
  const p = game.products.find(x=>x.id===id);
  if(!p.unlocked){
    p.unlocked = true;
    p.stock = 30;
    logEvent("🔓 Neues Produkt freigeschaltet: " + p.name);
  }
}

// ======================
// LAGER
// ======================
function buyStock(id){
  const p = game.products.find(x=>x.id===id);
  const cost = p.buy * 20 * (1 + game.upgrades.warehouse * 0.1);
  if(game.money >= cost){
    game.money -= cost;
    p.stock += 20;
    render();
  }
}

// ======================
// PREISE
// ======================
function setPrice(id,val){
  const p = game.products.find(x=>x.id===id);
  p.price = parseFloat(val);
  render();
}

// ======================
// MITARBEITER
// ======================
function hire(){
  if(game.staff.length >= game.maxStaff){
    alert("Maximale Mitarbeiter erreicht!");
    return;
  }
  if(game.money < 600) return;

  game.money -= 600;
  const roles = ["Verkauf","Marketing","Service","Einkauf"];
  const role = roles[Math.floor(Math.random()*roles.length)];
  game.staff.push({role:role, level:1});
  logEvent("👤 Neuer Mitarbeiter: " + role);
  render();
}

// ======================
// UPGRADES
// ======================
function buyUpgrade(type){
  const cost = 1000 * (game.upgrades[type] + 1);
  if(game.money < cost) return;

  game.money -= cost;
  game.upgrades[type]++;
  logEvent("⬆️ Upgrade " + type + " Stufe " + game.upgrades[type]);
  render();
}

// ======================
// UI
// ======================
function logEvent(text){
  const e = document.getElementById("events");
  e.innerHTML = "<div>" + text + "</div>" + e.innerHTML;
}

function render(){
  document.getElementById("stats").innerHTML = `
    Tag: ${game.day}<br>
    Geld: ${game.money.toFixed(2)} €<br>
    Ruf: ${game.reputation}<br>
    Zufriedenheit: ${game.satisfaction.toFixed(1)}<br>
    Ansehen: ${game.prestige}<br>
    Marktanteil: ${game.marketShare.toFixed(1)}%<br>
    Filialen: ${game.branches}<br>
    Mitarbeiter: ${game.staff.length}/${game.maxStaff}
  `;

  // Produkte
  let phtml = "";
  game.products.forEach(p=>{
    if(!p.unlocked) return;
    const st = priceStatus(p);
    phtml += `
      <div class="box">
        <b>${p.name}</b><br>
        Lager: ${p.stock}<br>
        Preis:
        <input type="number" value="${p.price}" step="0.1"
          onchange="setPrice(${p.id},this.value)"> €<br>
        Status: <span class="${st[0]}">${st[1]}</span><br>
        <button onclick="buyStock(${p.id})">Nachkaufen</button>
      </div>
    `;
  });
  document.getElementById("products").innerHTML = phtml;

  // Mitarbeiter
  let shtml = "";
  game.staff.forEach(s=>{
    shtml += `<div class="box">👤 ${s.role} (Lvl ${s.level})</div>`;
  });
  document.getElementById("staff").innerHTML = shtml;

  // Upgrades
  document.getElementById("upgrades").innerHTML = `
    <button onclick="buyUpgrade('marketing')">Marketing</button>
    <button onclick="buyUpgrade('service')">Service</button>
    <button onclick="buyUpgrade('warehouse')">Lager</button>
  `;

  // Filialen
  document.getElementById("branches").innerHTML =
    `<div class="box">Aktive Filialen: ${game.branches}</div>`;
}

// ======================
// EVENTS BINDEN
// ======================
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("nextDayBtn").addEventListener("click",nextDay);
  document.getElementById("hireBtn").addEventListener("click",hire);
  render();
});
