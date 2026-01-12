// ---------- SAVE / LOAD ----------
function saveGame(){
  localStorage.setItem("retailEmpireGame", JSON.stringify(game));
}
function loadGame(){
  const d = localStorage.getItem("retailEmpireGame");
  if(d){
    const s = JSON.parse(d);
    Object.assign(game, s);
  }
}

document.addEventListener("DOMContentLoaded",()=>{

const el=id=>document.getElementById(id);

// ---------- GAME ----------
window.game={
 day:1,
 money:800,
 reputation:20,
 satisfaction:60,
 customers:5,
 staff:[],
 openHours:8,
 autoReorder:false,
 orderAmount:10,
 alerts:[],

 products:[
  {id:1,name:"Brot",buy:1,sell:2,stock:25,unlock:0},
  {id:2,name:"Wasser",buy:0.5,sell:1.5,stock:30,unlock:0},
  {id:3,name:"Apfel",buy:0.8,sell:2,stock:20,unlock:0},

  {id:4,name:"Kaffee",buy:3,sell:6,stock:0,unlock:40},
  {id:5,name:"Sandwich",buy:4,sell:9,stock:0,unlock:50},
  {id:6,name:"Kleidung",buy:12,sell:29,stock:0,unlock:70},
  {id:7,name:"Elektronik",buy:60,sell:139,stock:0,unlock:90},
  {id:8,name:"Smartphone",buy:180,sell:349,stock:0,unlock:110},
  {id:9,name:"Laptop",buy:450,sell:899,stock:0,unlock:130}
 ]
};

loadGame();

// ---------- PRICE STATE ----------
function priceState(p){
 const fair=p.buy*2;
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

// ---------- UI ----------
function ui(){
 el("day").textContent=game.day;
 el("money").textContent=Math.floor(game.money);
 el("reputation").textContent=Math.floor(game.reputation);
 el("satisfaction").textContent=Math.floor(game.satisfaction);
 el("customers").textContent=Math.floor(game.customers);

 el("autoOrderChk").checked=game.autoReorder;
 el("orderAmount").value=game.orderAmount;

 // Mitarbeiter erst später
 el("hireBtn").disabled = game.reputation < 60;

 renderProducts();
 renderStaff();
 renderAlerts();

 saveGame();
}

// ---------- PRODUCTS ----------
function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  if(game.reputation<p.unlock) return;
  let s=priceState(p);
  let c=s==="green"?"price-green":s==="yellow"?"price-yellow":"price-red";

  const div=document.createElement("div");
  div.className="product";
  div.innerHTML=`
   <b>${p.name}</b> | Lager: ${p.stock}<br>
   Einkauf: ${p.buy}€ | Verkauf:
   <input type="number" value="${p.sell}" data-id="${p.id}" class="priceInput">
   <span class="${c}">●</span>
  `;
  box.appendChild(div);
 });

 document.querySelectorAll(".priceInput").forEach(inp=>{
  inp.onchange=()=>{
   let p=game.products.find(x=>x.id==inp.dataset.id);
   p.sell=parseFloat(inp.value);
   saveGame();
  };
 });
}

// ---------- STAFF ----------
el("hireBtn").onclick=()=>{
 if(game.money<300) return;
 game.money-=300;
 game.staff.push({level:1});
 ui();
};

function renderStaff(){
 const b=el("staffList");
 b.innerHTML="";
 if(game.staff.length===0){
  b.textContent="Noch keine Mitarbeiter";
  return;
 }
 game.staff.forEach((s,i)=>{
  const d=document.createElement("div");
  d.className="product";
  d.textContent=`Mitarbeiter ${i+1} | Level ${s.level}`;
  b.appendChild(d);
 });
}

// ---------- AUTO ORDER ----------
el("autoOrderChk").onchange=e=>{
 game.autoReorder=e.target.checked;
 saveGame();
};
el("orderAmount").onchange=e=>{
 game.orderAmount=parseInt(e.target.value);
 saveGame();
};

function autoOrder(){
 if(!game.autoReorder) return;
 game.products.forEach(p=>{
  if(game.reputation<p.unlock) return;
  if(p.stock>0) return;
  let cost=p.buy*game.orderAmount;
  if(game.money>=cost){
   p.stock+=game.orderAmount;
   game.money-=cost;
  }
 });
}

// ---------- SALES ----------
function autoSell(){
 let sold=0;
 let stockTotal=game.products.reduce((s,p)=>s+p.stock,0);

 let baseCustomers=3 + game.reputation/10;
 if(stockTotal<20) baseCustomers*=0.6;
 if(stockTotal<5) baseCustomers*=0.3;

 game.products.forEach(p=>{
  if(p.stock<=0 || game.reputation<p.unlock) return;

  let state=priceState(p);
  let demand=baseCustomers;

  if(state==="yellow") demand*=0.7;
  if(state==="red") demand*=0.4;

  let s=Math.min(p.stock,Math.floor(demand/5));
  if(s<=0) return;

  p.stock-=s;
  game.money+=s*p.sell;
  sold+=s;
 });

 game.customers=Math.max(1,Math.floor(baseCustomers));
}

// ---------- EVENTS ----------
let eventCooldown=0;

function randomEvent(){
 if(eventCooldown>0){eventCooldown--;return;}
 if(Math.random()>0.15) return;

 eventCooldown=6;

 const events=[
  {
   t:"📺 Werbung buchen (200€)",
   yes:g=>{g.money-=200;g.reputation+=5}
  },
  {
   t:"⚠️ Billiger Lieferant",
   yes:g=>{g.money+=300;g.reputation-=4}
  }
 ];

 const e=events[Math.floor(Math.random()*events.length)];
 const box=el("eventBox");
 box.innerHTML=`
 <p>${e.t}</p>
 <button id="evYes">Annehmen</button>
 <button id="evNo">Ignorieren</button>
 `;
 document.getElementById("evYes").onclick=()=>{
  e.yes(game);
  box.innerHTML="";
  ui();
 };
 document.getElementById("evNo").onclick=()=>box.innerHTML="";
}

// ---------- ALERTS ----------
function renderAlerts(){
 const b=el("alerts");
 b.innerHTML="";
 game.alerts.forEach(a=>{
  let p=document.createElement("p");
  p.textContent=a;
  b.appendChild(p);
 });
 game.alerts=[];
}

// ---------- DAY ----------
function nextDay(){
 game.day++;

 autoOrder();
 autoSell();

 randomEvent();

 ui();
}

// ---------- START ----------
setInterval(nextDay,4000);
ui();

});
