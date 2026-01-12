document.addEventListener("DOMContentLoaded",()=>{

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
  customers:3,
  income:0,
  expenses:0,
  autoOrder:false,
  orderAmount:10,
  reorderLimit:10,
  staff:[],
  products:[],
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
 {name:"T-Shirt",buy:8,sell:19,unlock:120,stock:0},
 {name:"Schuhe",buy:20,sell:59,unlock:150,stock:0},
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
   exp:0
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
 renderReport();
 saveGame();
}

// ---------------- PRODUKTE ----------------
function priceState(p){
 let fair=p.buy*2*(1+p.level*0.2);
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  let div=document.createElement("div");
  div.className="product";
  if(!p.unlocked){div.innerHTML=`<b>${p.name}</b><br>Freischaltung ab Ruf ${p.unlockReputation}`; box.appendChild(div); return;}
  let s=priceState(p);
  let c=s==="green"?"price-green":s==="yellow"?"price-yellow":"price-red";
  div.innerHTML=`
   <b>${p.name}</b> | Lager ${p.stock}<br>
   Level ${p.level} | EK ${p.buy}€ | VK <input type="number" value="${p.sell}" data-id="${p.id}">
   <span class="${c}">●</span><br>
   Rabatt: <input type="number" value="${p.discount}" min="0" max="50" data-discount="${p.id}"> %
   <button onclick="upgradeProduct(${p.id})">Upgrade (nur XP)</button>
  `;
  box.appendChild(div);
 });

 document.querySelectorAll("[data-id]").forEach(i=>{i.oninput=()=>{let p=game.products.find(x=>x.id==i.dataset.id); p.sell=parseFloat(i.value); ui();}});
 document.querySelectorAll("[data-discount]").forEach(i=>{i.oninput=()=>{let p=game.products.find(x=>x.id==i.dataset.discount); p.discount=parseFloat(i.value)||0; ui();}});
}

function upgradeProduct(id){
 let p=game.products.find(x=>x.id===id);
 if(game.xp<p.level*10) return;
 game.xp-=p.level*10;
 p.level++;
 p.sell*=1.2;
 p.exp+=5;
 ui();
}

// ---------------- MITARBEITER ----------------
el("hireBtn").onclick=()=>{
 if(game.xp<50) return;
 game.xp-=50;
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
  let salary=80+s.level*20;
  div.innerHTML=`Level ${s.level} | 🛎${s.service} 💰${s.sales} 📦${s.logistics}<br>Lohn: ${salary}€/Tag<br>
  <button onclick="upgradeStaff(${s.id})">Skillen (nur XP)</button>
  <button class="danger" onclick="fireStaff(${s.id})">Kündigen</button>`;
  b.appendChild(div);
 });
}
window.upgradeStaff=id=>{let s=game.staff.find(x=>x.id==id); if(game.xp<s.level*10) return; game.xp-=s.level*10; s.level++; s.service++; s.sales++; s.logistics++; ui();}
window.fireStaff=id=>{let i=game.staff.findIndex(x=>x.id==id); if(i>=0) game.staff.splice(i,1); ui();}

// ---------------- KUNDEN & VERKAUF ----------------
function autoSell(){
 let baseCustomers=1 + Math.floor(game.reputation/5) + game.products.filter(p=>p.unlocked).length;
 let discountBoost=game.products.reduce((s,p)=>s+p.discount,0)/50;
 game.customers=Math.floor(baseCustomers*(1+discountBoost)+game.day*0.2);
 game.products.forEach(p=>{
  if(!p.unlocked||p.stock<=0) return;
  let demand=Math.min(Math.floor(Math.random()*3)+1, p.stock); // jeder Kunde kauft 1-3
  demand=Math.floor(demand*(1+(p.discount/100)));
  let state=priceState(p);
  if(state==="yellow") demand=Math.floor(demand*0.8);
  if(state==="red") demand=Math.floor(demand*0.5);
  let sold=Math.min(demand,p.stock);
  if(sold<=0) return;
  let revenue=sold*p.sell*(1-p.discount/100);
  p.stock-=sold;
  game.income+=revenue;
  game.xp+=sold;
  game.report.push(`🛒 ${p.name}: ${sold} verkauft (${Math.floor(revenue)}€)`);
  animateProduct(p.id);
 });
}

// ---------------- FREISCHALTEN ----------------
function unlockByReputation(){
 game.products.forEach(p=>{if(!p.unlocked && game.reputation>=p.unlockReputation){p.unlocked=true; p.stock=10; game.report.push(`🔓 ${p.name} freigeschaltet`);}})
}

// ---------------- AUTO ORDER ----------------
el("autoOrder").onchange=e=>{game.autoOrder=e.target.checked; ui();}
el("orderAmount").onchange=e=>{game.orderAmount=parseInt(e.target.value); ui();}
el("reorderLimit").onchange=e=>{game.reorderLimit=parseInt(e.target.value); ui();}

function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(!p.unlocked) return;
  if(p.stock>=game.reorderLimit) return;
  let cost=p.buy*game.orderAmount;
  if(game.money>=cost){p.stock+=game.orderAmount; game.money-=cost; game.expenses+=cost; game.report.push(`📦 ${p.name}: ${game.orderAmount} nachbestellt (${cost}€)`); animateProduct(p.id);}
 });
}

// ---------------- TAG ----------------
function nextDay(){
 game.day++; game.income=0; game.expenses=0; game.report=[];
 autoOrder(); autoSell(); unlockByReputation();
 let staffCost=game.staff.reduce((s,x)=>s+(80+x.level*20),0);
 game.expenses+=staffCost; game.money+=game.income-game.expenses;
 if(game.income-game.expenses>0) game.reputation+=0.5; else game.reputation-=0.3;
 ui();
}

// ---------------- REPORT ----------------
function renderReport(){const b=el("report"); if(game.report.length===0){b.textContent="Noch keine Daten"; return;} b.innerHTML=game.report.join("<br>");}

// ---------------- ANIMATION ----------------
function animateProduct(id){
 const divs=document.querySelectorAll(".product");
 divs.forEach(d=>{if(d.querySelector(`input[data-id="${id}"]`)){d.classList.add("sell-animation"); setTimeout(()=>d.classList.remove("sell-animation"),400);}});
}

// ---------------- START ----------------
setInterval(nextDay,4000);
ui();

});
