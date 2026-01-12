document.addEventListener("DOMContentLoaded", () => {
const el=id=>document.getElementById(id);

// ---------------- HILFSFUNKTIONEN ----------------
function saveGame(){localStorage.setItem("retailEmpireSave",JSON.stringify(game));}
function loadGame(){const d=localStorage.getItem("retailEmpireSave"); if(d) Object.assign(game,JSON.parse(d));}
function formatMoney(amount){return amount.toFixed(2).replace(".",",")+" €";}

// ---------------- GAME ----------------
window.game={};

// ---------------- NEUES SPIEL ----------------
function newGame(){
 game={
  day:1,
  money:800,
  reputation:20,
  xp:0,
  customers:0,
  income:0,
  expenses:0,
  autoOrder:false,
  orderAmount:10,
  reorderLimit:10,
  staff:[],
  products:[],
  achievements:[],
  report:[]
 };

 const productDB=[
 {name:"Brot",buy:1,sell:2,unlock:0,stock:10},
 {name:"Wasser",buy:0.5,sell:1.5,unlock:0,stock:10},
 {name:"Apfel",buy:0.8,sell:2,unlock:0,stock:10},
 {name:"Milch",buy:1.2,sell:2.5,unlock:30,stock:0},
 {name:"Kaffee",buy:3,sell:6,unlock:50,stock:0},
 {name:"Sandwich",buy:4,sell:9,unlock:70,stock:0},
 {name:"Pizza",buy:5,sell:12,unlock:90,stock:0},
 {name:"Smoothie",buy:2.5,sell:5,unlock:60,stock:0},
 {name:"Salat",buy:3,sell:7,unlock:80,stock:0},
 {name:"T-Shirt",buy:8,sell:19,unlock:120,stock:0},
 {name:"Schuhe",buy:20,sell:59,unlock:150,stock:0},
 {name:"Jeans",buy:25,sell:59,unlock:160,stock:0},
 {name:"Sneakers",buy:50,sell:120,unlock:180,stock:0},
 {name:"Smartphone",buy:180,sell:349,unlock:200,stock:0},
 {name:"Laptop",buy:450,sell:899,unlock:250,stock:0}
 ];

 productDB.forEach((p,i)=>{
  game.products.push({
   id:i+1,
   name:p.name,
   buy:p.buy,
   sell:p.sell,
   stock:p.stock,
   unlockReputation:p.unlock,
   unlocked:p.unlock===0,
   discount:0,
   level:1,
   exp:0,
   selling:true
  });
 });

 ui();
 saveGame();
}
el("newGameBtn").onclick=newGame;
loadGame();

// ---------------- UI ----------------
function ui(){
 el("day").textContent=game.day;
 el("money").textContent=formatMoney(Math.floor(game.money*100)/100);
 el("reputation").textContent=Math.max(0,Math.floor(game.reputation));
 el("xp").textContent=Math.floor(game.xp);
 el("customers").textContent=Math.floor(game.customers);
 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;
 el("reorderLimit").value=game.reorderLimit;
 el("income").textContent=formatMoney(Math.floor(game.income*100)/100);
 el("expenses").textContent=formatMoney(Math.floor(game.expenses*100)/100);
 el("profit").textContent=formatMoney(Math.floor((game.income-game.expenses)*100)/100);
 renderProducts();
 renderStaff();
 renderAchievements();
 renderReport();
 saveGame();
}

// ---------------- PRODUKTE ----------------
function priceState(p){
 let fair = p.buy*2*(1+p.level*0.2);
 if(p.sell<=fair*1.1) return "green"; // günstig
 if(p.sell<=fair*1.4) return "yellow"; // fair/teuer
 return "red"; // abzocke
}

function renderProducts(){
 const box = el("productList");
 box.innerHTML = "";
 game.products.forEach(p=>{
  if(!p.unlocked) return;
  const div = document.createElement("div");
  div.className="product";
  div.id=`product-${p.id}`;
  let color = priceState(p);
  let colorSymbol = color==="green"?"🟢":color==="yellow"?"🟡":"🔴";
  div.innerHTML=`
   <b>${p.name}</b> | Lager: ${p.stock}<br>
   Level ${p.level} | EK: ${formatMoney(p.buy)} | VK: <span id="price-${p.id}">${formatMoney(p.sell)}</span> ${colorSymbol}<br>
   <button class="price-btn" data-id="${p.id}" data-change="-0.1">-</button>
   <button class="price-btn" data-id="${p.id}" data-change="0.1">+</button><br>
   Rabatt: <span id="discount-${p.id}">${p.discount}</span>%
   <button class="discount-btn" data-id="${p.id}" data-change="-1">-</button>
   <button class="discount-btn" data-id="${p.id}" data-change="1">+</button><br>
   <button onclick="upgradeProduct(${p.id})">Upgrade (${p.level*20} XP)</button>
   <button onclick="toggleSelling(${p.id})">${p.selling?"Stoppen":"Starten"}</button>
  `;
  box.appendChild(div);
 });

 document.querySelectorAll(".price-btn").forEach(btn=>{
   btn.onclick=()=>{adjustPrice(parseInt(btn.dataset.id),parseFloat(btn.dataset.change))}});
 document.querySelectorAll(".discount-btn").forEach(btn=>{
   btn.onclick=()=>{adjustDiscount(parseInt(btn.dataset.id),parseFloat(btn.dataset.change))}});
}

function adjustPrice(id, amount){
 let p = game.products.find(x=>x.id===id);
 p.sell = Math.max(0.1,Math.round((p.sell+amount)*100)/100);
 updateProductUI(p);
 ui();
}

function adjustDiscount(id, amount){
 let p = game.products.find(x=>x.id===id);
 p.discount = Math.min(50,Math.max(0,p.discount+amount));
 updateProductUI(p);
 ui();
}

function updateProductUI(p){
 const priceEl = el(`price-${p.id}`);
 const discountEl = el(`discount-${p.id}`);
 if(priceEl) priceEl.textContent=formatMoney(p.sell);
 if(discountEl) discountEl.textContent=p.discount;
}

// ---------------- Upgrade Produkt ----------------
window.upgradeProduct = function(id){
  const p = game.products.find(x=>x.id===id);
  const cost = p.level*20; // XP-Kosten steigen pro Level
  if(game.xp<cost){
    alert("Nicht genug XP!");
    return;
  }
  game.xp -= cost;
  p.level++;
  p.sell = Math.round(p.sell*1.1*100)/100; // VK steigt
  game.report.push(`⬆️ ${p.name} auf Level ${p.level} verbessert (VK erhöht)`);
  ui();
}

// ---------------- Toggle Verkauf ----------------
window.toggleSelling = function(id){
  const p = game.products.find(x=>x.id===id);
  p.selling = !p.selling;
  game.report.push(`${p.name} Verkauf ${p.selling?"aktiviert":"gestoppt"}`);
  ui();
}

// ---------------- Upgrade Mitarbeiter ----------------
 function renderStaff(){
  const b = el("staffList");
  b.innerHTML = "";
  if(game.staff.length === 0){
    b.textContent = "Keine Mitarbeiter";
    return;
  }

  game.staff.forEach(s => {
    const div = document.createElement("div");
    div.className = "product";

    let salary = 10 + s.level * 5;

    // Infos als Text
    const info = document.createElement("div");
    info.innerHTML = `Level ${s.level} | 🛎${s.service} 💰${s.sales} 📦${s.logistics}<br>Lohn: ${formatMoney(salary)}`;
    div.appendChild(info);

    // Upgrade Button
    const upgradeBtn = document.createElement("button");
    upgradeBtn.textContent = `Skillen (${s.level*20} XP)`;
    upgradeBtn.addEventListener("click", () => upgradeStaff(s.id));
    div.appendChild(upgradeBtn);

    // Kündigen Button
    const fireBtn = document.createElement("button");
    fireBtn.textContent = "Kündigen";
    fireBtn.className = "danger";
    fireBtn.addEventListener("click", () => fireStaff(s.id));
    div.appendChild(fireBtn);

    b.appendChild(div);
  });
}

window.upgradeStaff = function(id){
  const s = game.staff.find(x=>x.id===id);
  const cost = s.level*20; // XP-Kosten steigen pro Level
  if(game.xp<cost){
    alert("Nicht genug XP!");
    return;
  }
  game.xp -= cost;
  s.level++; s.service++; s.sales++; s.logistics++;
  game.report.push(`⬆️ Mitarbeiter auf Level ${s.level} verbessert`);
  ui();
}

// ---------------- Mitarbeiter Kündigen ----------------
window.fireStaff = function(id){
  const index = game.staff.findIndex(x=>x.id===id);
  if(index>=0){
    game.staff.splice(index,1);
    game.report.push(`❌ Mitarbeiter entlassen`);
    ui();
  }
}

// ---------------- Kunden ----------------
function calculateCustomers(){
 let base = Math.max(1,Math.floor(game.reputation/5));
 let availableProducts = game.products.filter(p=>p.unlocked && p.stock>0 && p.selling).length;
 if(availableProducts===0) game.reputation=Math.max(0,game.reputation-0.5);
 let dayBoost = Math.min(game.day*0.1,base*2);
 let discountBoost = game.products.reduce((s,p)=>s+p.discount,0)/50;
 let staffBoost = game.staff.reduce((s,sf)=>s+sf.service*0.05,0);
 return Math.floor(base*(1+discountBoost+staffBoost)+dayBoost);
}

// ---------------- Verkauf ----------------
function autoSell(){
 game.customers=calculateCustomers();
 let budgets=[];
 for(let i=0;i<game.customers;i++) budgets.push(20+Math.random()*50);
 game.products.forEach(p=>{
  if(!p.selling||p.stock<=0) return;
  budgets.forEach((budget,index)=>{
   if(budget<=0||p.stock<=0) return;
   let maxBuy = Math.floor(budget/(p.sell*(1-p.discount/100)));
   if(maxBuy<=0) return;
   let demand = Math.min(maxBuy,Math.floor(Math.random()*3)+1);
   demand = Math.min(demand,p.stock);
   let revenue = demand*p.sell*(1-p.discount/100);
   p.stock-=demand; budgets[index]-=revenue;
   game.income+=revenue;
   game.xp+=demand*p.level;
   game.reputation+=0.01*demand;
   game.reputation=Math.max(0,game.reputation);
   game.report.push(`🛒 ${p.name}: ${demand} verkauft (${formatMoney(revenue)})`);
   animateProduct(p.id);
  });
 });
}

// ---------------- Freischalten ----------------
function unlockByReputation(){
 game.products.forEach(p=>{
  if(!p.unlocked && game.reputation>=p.unlockReputation){
   p.unlocked=true; p.stock=10;
   game.report.push(`🔓 ${p.name} freigeschaltet`);
   animateProduct(p.id);
  }
 });
}

// ---------------- Auto Order ----------------
el("autoOrder").onchange=e=>{game.autoOrder=e.target.checked; ui();}
el("orderAmount").onchange=e=>{game.orderAmount=parseInt(e.target.value); ui();}
el("reorderLimit").onchange=e=>{game.reorderLimit=parseInt(e.target.value); ui();}
function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(!p.unlocked||p.stock>=game.reorderLimit) return;
  let cost = p.buy*game.orderAmount;
  if(game.money>=cost){
   p.stock+=game.orderAmount; game.money-=cost; game.expenses+=cost;
   game.report.push(`📦 ${p.name}: ${game.orderAmount} nachbestellt (${formatMoney(cost)})`);
   animateProduct(p.id);
  }
 });
}

// ---------------- Tag ----------------
function nextDay(){
 game.day++; game.income=0; game.expenses=0; game.report=[];
 autoOrder(); autoSell(); unlockByReputation();
 let staffCost = game.staff.reduce((s,x)=>s+10+x.level*5,0);
 game.expenses+=staffCost;
 game.money+=game.income-game.expenses;
 if(game.products.filter(p=>p.unlocked && p.stock>0 && p.selling).length===0) game.reputation=Math.max(0,game.reputation-1);
 checkAchievements();
 ui();
}

// ---------------- Achievements ----------------
function checkAchievements(){
 const ach=[];
 if(game.money>=1000) ach.push("💰 1000€ erreicht!");
 if(game.money>=5000) ach.push("💰 5000€ erreicht!");
 if(game.reputation>=50) ach.push("⭐ Ruf 50!");
 if(game.reputation>=100) ach.push("⭐ Ruf 100!");
 if(game.xp>=500) ach.push("🎖 500 XP erreicht!");
 if(game.products.some(p=>p.level>=5)) ach.push("🛍 Produkt Level 5!");
 if(game.staff.length>=5) ach.push("👥 5 Mitarbeiter!");
 game.achievements=ach;
}
function renderAchievements(){const b=el("achievements"); if(game.achievements.length===0){b.textContent="Noch keine Achievements"; return;} b.innerHTML=game.achievements.join("<br>");}

// ---------------- Report ----------------
function renderReport(){const b=el("report"); if(game.report.length===0){b.textContent="Noch keine Daten"; return;} b.innerHTML=game.report.join("<br>");}

// ---------------- Animation ----------------
function animateProduct(id){
 const divs=document.querySelectorAll(".product");
 divs.forEach(d=>{
  if(d.querySelector(`button[onclick*="${id}"]`)){
   d.classList.add("sell-animation");
   setTimeout(()=>d.classList.remove("sell-animation"),400);
  }
 });
}

// ---------------- START ----------------
setInterval(nextDay,4000);
ui();

});
