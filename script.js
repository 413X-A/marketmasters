document.addEventListener("DOMContentLoaded", () => {
const el=id=>document.getElementById(id);

// ---------------- SAVE & LOAD ----------------
function saveGame(){localStorage.setItem("retailEmpireSave",JSON.stringify(game));}
function loadGame(){const d=localStorage.getItem("retailEmpireSave"); if(d) Object.assign(game,JSON.parse(d));}

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
 el("money").textContent=Math.floor(game.money);
 el("reputation").textContent=Math.floor(game.reputation);
 el("xp").textContent=Math.floor(game.xp);
 el("customers").textContent=Math.floor(game.customers);
 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;
 el("reorderLimit").value=game.reorderLimit;
 el("income").textContent=Math.floor(game.income);
 el("expenses").textContent=Math.floor(game.expenses);
 el("profit").textContent=Math.floor(game.income-game.expenses);
 renderProducts();
 renderStaff();
 renderAchievements();
 renderReport();
 saveGame();
}

// ---------------- PRODUKTE ----------------
function priceState(p){
 let fair=p.buy*2*(1+p.level*0.2);
 if(p.sell< p.buy) return "red"; 
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "orange"; 
}

function priceLabel(p){
 let fair=p.buy*2*(1+p.level*0.2);
 if(p.sell< p.buy) return "⚠ Unter EK";
 if(p.sell<=fair*1.1) return "Günstig";
 if(p.sell<=fair*1.4) return "Fair";
 if(p.sell<=fair*1.7) return "Teuer";
 return "Abzocke";
}

function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  if(!p.unlocked) return; 

  let div=document.createElement("div");
  div.className="product";

  let c=priceState(p);
  div.innerHTML=`
   <b>${p.name}</b> | Lager ${p.stock}<br>
   Level ${p.level} | EK ${p.buy} | VK: ${p.sell.toFixed(2)} €
   <button onclick="adjustPrice(${p.id},-0.1)">-</button>
   <button onclick="adjustPrice(${p.id},0.1)">+</button>
   <span class="${c}">${priceLabel(p)}</span><br>
   Rabatt: ${p.discount.toFixed(0)}%
   <button onclick="adjustDiscount(${p.id},-1)">-</button>
   <button onclick="adjustDiscount(${p.id},1)">+</button>
   | <button onclick="upgradeProduct(${p.id})">Upgrade (${p.level*10} XP)</button>
   | <button onclick="toggleSelling(${p.id})">${p.selling ? "Stoppen" : "Starten"}</button>
   <br>XP pro Verkauf: ${p.level}
  `;
  box.appendChild(div);
 });
}

function adjustPrice(id,amount){
 let p = game.products.find(x=>x.id===id);
 p.sell = Math.max(0.1, Math.round((p.sell + amount)*10)/10);
 ui();
}

function adjustDiscount(id,amount){
 let p = game.products.find(x=>x.id===id);
 p.discount = Math.min(50,Math.max(0,p.discount+amount));
 ui();
}

function upgradeProduct(id){
 let p = game.products.find(x=>x.id===id);
 let cost = p.level*10;
 if(game.xp<cost) return;
 game.xp -= cost;
 p.level++;
 p.sell = Math.round(p.sell*1.1*10)/10; 
 p.exp +=5;
 game.report.push(`⬆️ ${p.name} auf Level ${p.level} verbessert!`);
 ui();
}

window.toggleSelling=id=>{
 let p = game.products.find(x=>x.id===id);
 p.selling = !p.selling;
 ui();
}

// ---------------- MITARBEITER ----------------
el("hireBtn").onclick=()=>{
 if(game.money<100) return;
 game.money-=100;
 game.staff.push({id:Date.now(),level:1,service:1,sales:1,logistics:1});
 ui();
};

function renderStaff(){
 const b=el("staffList");
 b.innerHTML="";
 if(game.staff.length===0){b.textContent="Keine Mitarbeiter"; return;}
 game.staff.forEach(s=>{
  let div=document.createElement("div");
  div.className="product";
  let salary = 10+s.level*5;
  div.innerHTML=`Level ${s.level} | 🛎${s.service} 💰${s.sales} 📦${s.logistics}<br>
  Lohn: ${salary}€/Tag
  <button onclick="upgradeStaff(${s.id})">Skillen (${s.level*10} XP)</button>
  <button class="danger" onclick="fireStaff(${s.id})">Kündigen</button>`;
  b.appendChild(div);
 });
}

window.upgradeStaff = id => {
 let s = game.staff.find(x => x.id===id);
 let cost = s.level*10;
 if(game.xp<cost) return;
 game.xp -= cost;
 s.level++; s.service++; s.sales++; s.logistics++;
 game.report.push(`⬆️ Mitarbeiter auf Level ${s.level} verbessert!`);
 ui();
}

window.fireStaff=id=>{
 let i=game.staff.findIndex(x=>x.id==id);
 if(i>=0) game.staff.splice(i,1);
 ui();
}

// ---------------- KUNDEN ----------------
function calculateCustomers(){
 let base = Math.max(1,Math.floor(game.reputation/5));
 let availableProducts = game.products.filter(p=>p.unlocked && p.stock>0).length;

 if(availableProducts===0){
  game.reputation -= 0.5;
 }

 let dayBoost = Math.min(game.day*0.1,base*2);
 let discountBoost = game.products.reduce((sum,p)=>sum+p.discount,0)/50;
 let staffBoost = game.staff.reduce((sum,s)=>sum+s.service*0.05,0);

 return Math.floor(base*(1+discountBoost+staffBoost)+dayBoost) * availableProducts / Math.max(1, game.products.filter(p=>p.unlocked).length);
}

// ---------------- VERKAUF ----------------
function autoSell(){
 game.customers = calculateCustomers();
 let budgets=[];
 for(let i=0;i<game.customers;i++) budgets.push(20+Math.random()*50);

 game.products.forEach(p=>{
  if(!p.selling || p.stock<=0) return;

  budgets.forEach((budget,index)=>{
   if(budget<=0 || p.stock<=0) return;

   let maxBuy=Math.floor(budget/p.sell);
   if(maxBuy<=0) return;

   let demand=Math.min(maxBuy,Math.floor(Math.random()*3)+1);
   demand = Math.min(demand,p.stock);

   let revenue=demand*p.sell*(1-p.discount/100);
   p.stock-=demand;
   budgets[index]-=revenue;
   game.income+=revenue;
   game.xp+=demand*p.level;
   game.reputation+=0.01*demand;
   game.report.push(`🛒 ${p.name}: ${demand} verkauft (${revenue.toFixed(2)}€) | XP ${demand*p.level}`);
   animateProduct(p.id);
  });
 });
}

// ---------------- FREISCHALTEN ----------------
function unlockByReputation(){
 game.products.forEach(p=>{
  if(!p.unlocked && game.reputation>=p.unlockReputation){
   p.unlocked=true;
   p.stock=10;
   game.report.push(`🔓 ${p.name} freigeschaltet`);
   animateProduct(p.id);
  }
 });
}

// ---------------- AUTO ORDER ----------------
el("autoOrder").onchange=e=>{game.autoOrder=e.target.checked; ui();}
el("orderAmount").onchange=e=>{game.orderAmount=parseInt(e.target.value); ui();}
el("reorderLimit").onchange=e=>{game.reorderLimit=parseInt(e.target.value); ui();}

function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(!p.unlocked || p.stock>=game.reorderLimit) return;
  let cost=p.buy*game.orderAmount;
  if(game.money>=cost){
   p.stock+=game.orderAmount;
   game.money-=cost;
   game.expenses+=cost;
   game.report.push(`📦 ${p.name}: ${game.orderAmount} nachbestellt (${cost.toFixed(2)}€)`);
   animateProduct(p.id);
  }
 });
}

// ---------------- TAG ----------------
function nextDay(){
 game.day++;
 game.income=0; game.expenses=0; game.report=[];

 autoOrder(); autoSell(); unlockByReputation();

 let staffCost=game.staff.reduce((s,x)=>s+10+x.level*5,0);
 game.expenses+=staffCost;

 game.money+=game.income-game.expenses;

 if(game.products.filter(p=>p.unlocked && p.stock>0).length===0) game.reputation-=1;

 checkAchievements();
 ui();
}

// ---------------- ACHIEVEMENTS ----------------
function checkAchievements(){
 const ach = [];
 if(game.money>=1000) ach.push("💰 1000€ erreicht!");
 if(game.money>=5000) ach.push("💰 5000€ erreicht!");
 if(game.reputation>=50) ach.push("⭐ Ruf 50!");
 if(game.reputation>=100) ach.push("⭐ Ruf 100!");
 if(game.xp>=500) ach.push("🎖 500 XP erreicht!");
 if(game.products.some(p=>p.level>=5)) ach.push("🛍 Produkt Level 5!");
 if(game.staff.length>=5) ach.push("👥 5 Mitarbeiter!");
 game.achievements = ach;
}

function renderAchievements(){
 const b = el("achievements");
 if(game.achievements.length===0){b.textContent="Noch keine Achievements"; return;}
 b.innerHTML = game.achievements.join("<br>");
}

// ---------------- REPORT ----------------
function renderReport(){
 const b = el("report");
 if(game.report.length===0){b.textContent="Noch keine Daten"; return;}
 b.innerHTML = game.report.join("<br>");
}

// ---------------- ANIMATION ----------------
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
