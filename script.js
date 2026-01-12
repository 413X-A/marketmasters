// ---------------- SAVE ----------------
function saveGame(){
 localStorage.setItem("retailEmpireSave",JSON.stringify(game));
}
function loadGame(){
 const d=localStorage.getItem("retailEmpireSave");
 if(d) Object.assign(game,JSON.parse(d));
}

document.addEventListener("DOMContentLoaded",()=>{

const el=id=>document.getElementById(id);

// ---------------- GAME ----------------
window.game={
 day:1,
 money:1200,
 reputation:20,
 xp:0,
 customers:5,

 income:0,
 expenses:0,

 autoOrder:true,
 orderAmount:10,

 staff:[],
 products:[],

 report:[]
};

// ---------------- PRODUKTE ----------------
const productDB=[
 {name:"Brot",buy:1,sell:2,unlock:0},
 {name:"Wasser",buy:0.5,sell:1.5,unlock:0},
 {name:"Apfel",buy:0.8,sell:2,unlock:0},

 {name:"Milch",buy:1.2,sell:2.5,unlock:30},
 {name:"Kaffee",buy:3,sell:6,unlock:50},
 {name:"Sandwich",buy:4,sell:9,unlock:70},
 {name:"Pizza",buy:5,sell:12,unlock:90},

 {name:"T-Shirt",buy:8,sell:19,unlock:120},
 {name:"Schuhe",buy:20,sell:59,unlock:150},

 {name:"Smartphone",buy:180,sell:349,unlock:200},
 {name:"Laptop",buy:450,sell:899,unlock:250}
];

productDB.forEach((p,i)=>{
 game.products.push({
  id:i+1,
  name:p.name,
  buy:p.buy,
  sell:p.sell,
  stock:i<3?20:0,
  unlockReputation:p.unlock,
  unlocked:p.unlock===0,
  discount:0
 });
});

loadGame();

// ---------------- PREIS STATUS ----------------
function priceState(p){
 let fair=p.buy*2;
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

// ---------------- UI ----------------
function ui(){
 el("day").textContent=game.day;
 el("money").textContent=Math.floor(game.money);
 el("reputation").textContent=Math.floor(game.reputation);
 el("xp").textContent=Math.floor(game.xp);
 el("customers").textContent=Math.floor(game.customers);

 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;

 renderProducts();
 renderStaff();
 renderReport();
 saveGame();
}

// ---------------- PRODUKTE UI ----------------
function renderProducts(){
 const box=el("productList");
 box.innerHTML="";

 game.products.forEach(p=>{
  let div=document.createElement("div");
  div.className="product";

  if(!p.unlocked){
   div.innerHTML=`
    <b>${p.name}</b><br>
    Wird freigeschaltet ab Ruf ${p.unlockReputation}
   `;
   box.appendChild(div);
   return;
  }

  let s=priceState(p);
  let c=s==="green"?"price-green":s==="yellow"?"price-yellow":"price-red";

  div.innerHTML=`
   <b>${p.name}</b> | Lager ${p.stock}<br>
   EK ${p.buy}€ | VK 
   <input type="number" value="${p.sell}" data-id="${p.id}">
   <span class="${c}">●</span><br>
   Rabatt:
   <input type="number" value="${p.discount}" min="0" max="50" data-discount="${p.id}"> %
  `;
  box.appendChild(div);
 });

 document.querySelectorAll("[data-id]").forEach(i=>{
  i.oninput=()=>{
   let p=game.products.find(x=>x.id==i.dataset.id);
   p.sell=parseFloat(i.value);
   saveGame();
  };
 });

 document.querySelectorAll("[data-discount]").forEach(i=>{
  i.oninput=()=>{
   let p=game.products.find(x=>x.id==i.dataset.discount);
   p.discount=parseFloat(i.value)||0;
   saveGame();
  };
 });
}

// ---------------- AUTO ORDER ----------------
el("autoOrder").onchange=e=>{
 game.autoOrder=e.target.checked;saveGame();
};
el("orderAmount").onchange=e=>{
 game.orderAmount=parseInt(e.target.value);saveGame();
};

function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(!p.unlocked) return;
  if(p.stock>0) return;
  let cost=p.buy*game.orderAmount;
  if(game.money>=cost){
   p.stock+=game.orderAmount;
   game.money-=cost;
   game.expenses+=cost;
   game.report.push(`📦 ${p.name}: ${game.orderAmount} eingekauft`);
  }
 });
}

// ---------------- MITARBEITER ----------------
el("hireBtn").onclick=()=>{
 if(game.money<300) return;
 game.money-=300;
 game.staff.push({
  id:Date.now(),
  level:1,
  service:1,
  sales:1,
  logistics:1
 });
 ui();
};

function renderStaff(){
 const b=el("staffList");
 b.innerHTML="";
 if(game.staff.length===0){
  b.textContent="Keine Mitarbeiter";
  return;
 }

 game.staff.forEach(s=>{
  let div=document.createElement("div");
  div.className="product";
  let salary=80+s.level*20;
  div.innerHTML=`
   Level ${s.level} | 🛎${s.service} 💰${s.sales} 📦${s.logistics}<br>
   Lohn: ${salary}€/Tag<br>
   <button onclick="upgradeStaff(${s.id})">Skillen</button>
   <button class="danger" onclick="fireStaff(${s.id})">Kündigen</button>
  `;
  b.appendChild(div);
 });
}

window.upgradeStaff=id=>{
 let s=game.staff.find(x=>x.id===id);
 let cost=200*s.level;
 if(game.money<cost) return;
 game.money-=cost;
 s.level++;
 s.service++;s.sales++;s.logistics++;
 ui();
};

window.fireStaff=id=>{
 let i=game.staff.findIndex(x=>x.id===id);
 if(i>=0) game.staff.splice(i,1);
 ui();
};

// ---------------- KUNDENLOGIK ----------------
function autoSell(){
 let stockTotal=game.products.reduce((s,p)=>s+p.stock,0);

 let baseCustomers =
  3 +
  game.reputation/10 +
  game.staff.reduce((s,x)=>s+x.service,0)*0.4;

 if(stockTotal<10) baseCustomers*=0.6;
 if(stockTotal<5) baseCustomers*=0.3;

 game.customers=Math.max(1,Math.floor(baseCustomers));

 game.products.forEach(p=>{
  if(!p.unlocked||p.stock<=0) return;

  let state=priceState(p);
  let demand=game.customers;

  if(state==="yellow") demand*=0.8;
  if(state==="red") demand*=0.6;

  demand*=1+(p.discount/100);

  let sold=Math.min(p.stock,Math.floor(demand/3));
  if(sold<=0) return;

  p.stock-=sold;

  let price=p.sell*(1-p.discount/100);
  let revenue=sold*price;
  game.income+=revenue;

  game.xp+=sold;
  game.report.push(`🛒 ${p.name}: ${sold} verkauft (${Math.floor(revenue)}€)`);
 });
}

// ---------------- FREISCHALTEN ----------------
function unlockByReputation(){
 game.products.forEach(p=>{
  if(!p.unlocked && game.reputation>=p.unlockReputation){
   p.unlocked=true;
   p.stock=10;
   game.report.push(`🔓 ${p.name} jetzt im Sortiment`);
  }
 });
}

// ---------------- TAG ----------------
function nextDay(){
 game.day++;
 game.income=0;
 game.expenses=0;
 game.report=[];

 autoOrder();
 autoSell();
 unlockByReputation();

 // Mitarbeiterkosten
 let staffCost=game.staff.reduce((s,x)=>s+(80+x.level*20),0);
 game.expenses+=staffCost;
 game.money-=staffCost;

 // Ruf-Logik
 let profit=game.income-game.expenses;
 if(profit>0) game.reputation+=0.5;
 if(profit<0) game.reputation-=0.3;

 ui();
}

// ---------------- REPORT ----------------
function renderReport(){
 const b=el("report");
 if(game.report.length===0){
  b.textContent="Noch keine Daten";
  return;
 }
 b.innerHTML=game.report.join("<br>");
}

// ---------------- START ----------------
setInterval(nextDay,4000);
ui();

});
