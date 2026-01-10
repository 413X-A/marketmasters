// --- Speichern in localStorage ---
function saveGame() {
    localStorage.setItem("retailEmpireGame", JSON.stringify(game));
}

// --- Laden aus localStorage ---
function loadGame() {
    const data = localStorage.getItem("retailEmpireGame");
    if(data){
        const saved = JSON.parse(data);
        Object.keys(saved).forEach(k => {
            if(game.hasOwnProperty(k)) game[k] = saved[k];
        });
    }
}

document.addEventListener("DOMContentLoaded",()=>{

const el=id=>document.getElementById(id);

let game={
 money:1000,
 reputation:40,
 satisfaction:60,
 customers:15,
 staff:[],
 openHours:8,
 taxRate:19,
 autoReorder:false,
 orderAmount:10,
 reorderThreshold:10,
 income:0,
 expenses:0,
 alerts:[],
 log:[],

 products:[
  {id:1,name:"Brot",buy:1,sell:2,stock:30,unlock:0,level:1,discount:false},
  {id:2,name:"Wasser",buy:0.5,sell:1.5,stock:40,unlock:0,level:1,discount:false},
  {id:3,name:"Apfel",buy:0.8,sell:2,stock:20,unlock:0,level:1,discount:false},
  {id:4,name:"Kaffee",buy:3,sell:6,stock:0,unlock:50,level:1,discount:false},
  {id:5,name:"Sandwich",buy:4,sell:9,stock:0,unlock:60,level:1,discount:false},
  {id:6,name:"Kleidung",buy:12,sell:29,stock:0,unlock:80,level:1,discount:false},
  {id:7,name:"Elektronik",buy:60,sell:139,stock:0,unlock:110,level:1,discount:false},
  {id:8,name:"Smartphone",buy:180,sell:349,stock:0,unlock:130,level:1,discount:false},
  {id:9,name:"Laptop",buy:450,sell:899,stock:0,unlock:150,level:1,discount:false}
 ]
};

// --- Lade Spielstand ---
loadGame();

// ---------- PREIS LOGIK ----------
function getPriceState(p){
 let fair=p.buy*(2+(p.level-1)*0.25);
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

// ---------- UI ----------
function ui(){
    el("money").textContent=Math.floor(game.money);
    el("reputation").textContent=Math.floor(game.reputation);
    el("satisfaction").textContent=Math.floor(game.satisfaction);
    el("customers").textContent=Math.floor(game.customers);
    el("staffCount").textContent=game.staff.length;
    el("openHours").textContent=game.openHours;
    el("income").textContent=Math.floor(game.income);
    el("expenses").textContent=Math.floor(game.expenses);
    el("profit").textContent=Math.floor(game.income-game.expenses);
    el("taxRate").textContent=game.taxRate;
    el("dashStock").textContent=game.products.reduce((s,p)=>s+p.stock,0);
    renderProducts();
    renderStaff();
    renderLog();
    renderAlerts();

    saveGame(); // speichert alles automatisch
}

// ---------- PRODUKTE ----------
function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  if(game.reputation<p.unlock) return;
  let state=getPriceState(p);
  let color=state==="green"?"price-green":state==="yellow"?"price-yellow":"price-red";
  let label=state==="green"?"Günstig":state==="yellow"?"Teuer":"Abzocke";
  let div=document.createElement("div");
  div.className="product";
  div.innerHTML=`
   <b>${p.name}</b> | Lager: ${p.stock}<br>
   Level ${p.level} | Einkauf: ${p.buy}€ | Verkauf:
   <input type="number" value="${p.sell}" step="0.1"
    onchange="setPrice(${p.id},this.value)">
   <span class="${color}">● ${label}</span><br>
   <label>
    <input type="checkbox" ${p.discount?"checked":""}
     onchange="toggleDiscount(${p.id},this.checked)">
    Rabatt
   </label>
   <button onclick="upgradeProduct(${p.id})">Upgrade (${p.level*150}€)</button>
  `;
  box.appendChild(div);
 });
}

window.setPrice=(id,val)=>{
 let p=game.products.find(x=>x.id===id);
 p.sell=parseFloat(val);
 ui();
};

window.toggleDiscount=(id,state)=>{
 let p=game.products.find(x=>x.id===id);
 p.discount=state;
 log(`🏷 Rabatt ${state?"aktiv":"aus"}: ${p.name}`);
 ui();
};

window.upgradeProduct=(id)=>{
 let p=game.products.find(x=>x.id===id);
 let cost=150*p.level;
 if(game.money<cost) return log("❌ Nicht genug Geld");
 game.money-=cost;
 p.level++;
 log(`📦 ${p.name} verbessert`);
 ui();
};

// ---------- EINKAUF ----------
window.toggleAutoOrder = function(state){
    game.autoReorder = state;
    log(`📦 Automatische Nachbestellung ${state ? "aktiv" : "deaktiv"}`);
    ui();
};

window.setReorderThreshold = function(val){
    game.reorderThreshold = val;
    el("reorderThresholdDisplay").textContent = val;
    ui();
};

window.setOrderAmount = function(val){
    game.orderAmount = val;
    el("orderAmountDisplay").textContent = val;
    ui();
};

function autoOrder(){
    if(!game.autoReorder) return;

    game.products.forEach(p=>{
        if(game.reputation < p.unlock) return;
        if(p.stock >= game.reorderThreshold) return;

        let cost = p.buy * game.orderAmount;
        if(game.money >= cost){
            p.stock += game.orderAmount;
            game.money -= cost;
            game.expenses += cost;
            log(`📦 ${p.name} automatisch nachbestellt (${game.orderAmount} Stück)`);
        } else {
            log(`❌ Nicht genug Geld für ${p.name}`);
        }
    });
}

// ---------- MITARBEITER ----------
window.hireStaff=()=>{
 if(game.money<300) return log("❌ Zu wenig Geld");
 game.money-=300;
 game.staff.push({id:Date.now(),level:1,service:1,sales:1,logistics:1});
 log("👤 Mitarbeiter eingestellt");
 ui();
};

window.upgradeStaff=id=>{
 let s=game.staff.find(x=>x.id===id);
 let cost=200*s.level;
 if(game.money<cost) return log("❌ Nicht genug Geld");
 game.money-=cost;
 s.level++; s.service++; s.sales++; s.logistics++;
 log(`📚 Mitarbeiter verbessert (Level ${s.level})`);
 ui();
};

function renderStaff(){
 const box=el("staffList");
 box.innerHTML="";
 if(game.staff.length===0){
    box.textContent="Keine Mitarbeiter angestellt";
    return;
 }
 game.staff.forEach(s=>{
  let daily=80+s.level*20;
  let div=document.createElement("div");
  div.className="product";
  div.innerHTML=`
   <b>Mitarbeiter</b> | Level ${s.level}<br>
   🛎 Service: ${s.service} | 💰 Verkauf: ${s.sales} | 📦 Logistik: ${s.logistics}<br>
   💸 Lohn/Tag: ${daily}€<br>
   <button onclick="upgradeStaff(${s.id})">Upgrade (${200*s.level}€)</button>
  `;
  box.appendChild(div);
 });
}

// ---------- VERKAUF ----------
function autoSell(){
 let sold=0;
 game.products.forEach(p=>{
  if(p.stock<=0 || game.reputation<p.unlock) return;
  let state=getPriceState(p);

  let demand=game.customers*(game.openHours/8);
  if(state==="yellow") demand*=0.7;
  if(state==="red") demand*=p.discount?0.25:0;
  if(p.discount) demand*=1.5;

  let soldAmount=Math.min(p.stock,Math.floor(demand/10));
  if(soldAmount<=0) return;
  p.stock-=soldAmount;
  game.income+=soldAmount*p.sell*(p.discount?0.85:1);
  sold+=soldAmount;
 });
 if(sold>0) log(`🛒 ${sold} Artikel verkauft`);
}

// ---------- EVENTS ----------
function randomEvent(){
 if(Math.random()>0.3) return;
 let e=[
  {t:"📺 Influencer Werbung (200€)", yes:g=>{g.money-=200;g.reputation+=6}, no:g=>{g.reputation-=2}},
  {t:"⚠️ Billiger Lieferant – Qualität sinkt", yes:g=>{g.money+=300;g.reputation-=5}, no:g=>{g.reputation+=1}}
 ];
 let ev=e[Math.floor(Math.random()*e.length)];
 let box=el("eventBox");
 box.innerHTML=`
 <p>${ev.t}</p>
 <button id="y">Annehmen</button>
 <button id="n">Ablehnen</button>`;
 document.getElementById("y").onclick=()=>{ev.yes(game); box.innerHTML=""; ui();};
 document.getElementById("n").onclick=()=>{ev.no(game); box.innerHTML=""; ui();};
}

// ---------- LOG ----------
function log(t){
 game.log.unshift("• "+t);
 if(game.log.length>30) game.log.pop();
}
function renderLog(){el("log").innerHTML=game.log.join("<br>");}

// ---------- ALERTS ----------
function renderAlerts(){
 const b=el("alerts"); b.innerHTML="";
 game.alerts.forEach(a=>{
  let p=document.createElement("p");
  p.textContent=a;
  b.appendChild(p);
 });
 game.alerts=[];
}

// ---------- TAG ----------
function nextDay(){
 game.income=0;
 game.expenses=0;

 let totalStock=game.products.reduce((s,p)=>s+p.stock,0);
 if(totalStock<30){
  game.customers=Math.floor(game.customers*0.7);
  game.alerts.push("📦 Leere Regale – Kunden bleiben weg");
 }

 autoOrder();
 autoSell();

 let staffCost=game.staff.reduce((s,x)=>s+(80+x.level*20),0);
 let tax=(game.income*game.taxRate)/100;
 game.expenses+=staffCost+tax;
 game.money+=game.income-game.expenses;

 game.customers=Math.max(5,Math.floor(15+(game.reputation/4)));

 randomEvent();
 ui();
}

// ---------- START ----------
setInterval(nextDay,4000);
ui();

});
