// ================= GAME STATE =================
let game={
money:1000,
reputation:40,
satisfaction:60,
customers:15,
staff:0,
openHours:8,
day:1,
log:[],
autoReorder:false,
orderAmount:5,
alerts:[],

products:[
{id:1,name:"Brot",buy:1,sell:2,stock:20,unlock:0},
{id:2,name:"Wasser",buy:0.5,sell:1.5,stock:20,unlock:0},
{id:3,name:"Apfel",buy:0.8,sell:2,stock:10,unlock:0},
{id:4,name:"Kaffee",buy:3,sell:6,stock:0,unlock:50},
{id:5,name:"Sandwich",buy:4,sell:9,stock:0,unlock:60},
{id:6,name:"Kleidung",buy:10,sell:25,stock:0,unlock:80},
{id:7,name:"Elektronik",buy:50,sell:120,stock:0,unlock:120}
],

suppliers:[
{id:1,name:"Standard Lieferant",fee:0},
{id:2,name:"Premium Lieferant",fee:50}
]
};

const el=id=>document.getElementById(id);

// ================= UI =================
function ui(){
el("money").textContent=Math.floor(game.money);
el("reputation").textContent=Math.floor(game.reputation);
el("satisfaction").textContent=Math.floor(game.satisfaction);
el("customers").textContent=Math.floor(game.customers);
el("staffCount").textContent=game.staff;
el("openHours").textContent=game.openHours;

renderProducts();
renderSuppliers();
renderStaff();
renderLog();
updateDashboard();
renderAlerts();
}

// ================= OPEN HOURS =================
function setOpen(h){
game.openHours=h;
log(`⏰ Öffnungszeiten auf ${h}h gesetzt`);
ui();
}

// ================= PRODUCTS =================
function renderProducts(){
const box=el("productList");
box.innerHTML="";
game.products.forEach(p=>{
if(game.reputation<p.unlock) return;

let state=getPriceState(p);
let color=state=="green"?"price-green":state=="yellow"?"price-yellow":"price-red";

let div=document.createElement("div");
div.className="product";
div.innerHTML=`
<b>${p.name}</b> | Bestand: ${p.stock}<br>
Einkauf: ${p.buy}€ | Verkauf:
<input type="number" value="${p.sell}" style="width:60px"
 onchange="setPrice(${p.id},this.value)">
<span class="${color}">●</span>
`;
box.appendChild(div);
});
}

function setPrice(id,val){
let p=game.products.find(x=>x.id==id);
p.sell=parseFloat(val);
}

// ================= SUPPLIERS =================
function renderSuppliers(){
const box=el("supplierList");
box.innerHTML="";
game.suppliers.forEach(s=>{
let div=document.createElement("div");
div.className="product";
div.innerHTML=`
<b>${s.name}</b>
<button onclick="manualOrder(${s.id})">Manuell bestellen</button>
`;
box.appendChild(div);
});
}

// ================= AUTO ORDER =================
function toggleAutoOrder(state){
game.autoReorder=state;
log(`📦 Automatische Nachbestellung ${state?"aktiv":"deaktiviert"}`);
}

function setOrderAmount(amount){
game.orderAmount=amount;
el("orderAmountDisplay").textContent=amount;
log(`📦 Bestellmenge auf ${amount} gesetzt`);
}

function manualOrder(supplierId){
let supplier=game.suppliers.find(x=>x.id==supplierId);
let totalCost=0;
game.products.forEach(p=>{
if(game.reputation<p.unlock) return;
let amount=game.orderAmount;
p.stock+=amount;
totalCost+=p.buy*amount;
log(`📦 ${amount}x ${p.name} manuell nachbestellt`);
});
totalCost+=supplier.fee;
if(totalCost>game.money){log("❌ Nicht genug Geld"); return;}
game.money-=totalCost;
ui();
}

function autoOrderCheck(supplierId){
if(!game.autoReorder) return;
let supplier=game.suppliers.find(x=>x.id==supplierId);
let totalCost=0;
game.products.forEach(p=>{
if(game.reputation<p.unlock) return;
if(p.stock>0) return; // nur wenn Bestand 0
let amount=game.orderAmount;
p.stock+=amount;
totalCost+=p.buy*amount;
log(`📦 ${amount}x ${p.name} automatisch nachbestellt`);
});
totalCost+=supplier.fee;
if(totalCost>game.money){log("❌ Nicht genug Geld"); return;}
game.money-=totalCost;
}

// ================= STAFF =================
function hireStaff(){
if(game.money<300) {log("❌ Nicht genug Geld"); return;}
game.money-=300;
game.staff++;
game.customers+=3;
game.satisfaction+=2;
log("👤 Mitarbeiter eingestellt");
ui();
}

function renderStaff(){
el("staffList").innerHTML=`Anzahl Mitarbeiter: ${game.staff}`;
}

// ================= PRICE LOGIC =================
function getPriceState(p){
let fair=p.buy*2;
if(p.sell<=fair*1.1) return "green";
if(p.sell<=fair*1.5) return "yellow";
return "red";
}

// ================= AUTO SALES =================
function autoSell(){
let totalSold=0;
game.products.forEach(p=>{
if(p.stock<=0 || game.reputation<p.unlock) return;

let state=getPriceState(p);
let demand = game.customers * (game.openHours/8);

if(state=="yellow") demand*=0.8;
if(state=="red") demand*=0.5;

let sold=Math.min(p.stock,Math.floor(demand/10));
if(sold<=0) return;

p.stock-=sold;
let income=sold*p.sell;
game.money+=income;
totalSold+=sold;

if(state=="red"){
game.reputation-=0.3;
game.satisfaction-=0.5;
game.alerts.push("⚠️ Kunden beschweren sich über hohe Preise!");
if(Math.random()<0.15){
game.money-=500;
game.alerts.push("⚖️ Abmahnung – 500€ Strafe");
}
}
if(state=="green"){
game.reputation+=0.1;
game.satisfaction+=0.1;
}
});
if(totalSold>0) log(`🛒 Kunden kauften ${totalSold} Artikel`);
}

// ================= EVENTS =================
function randomEvent(){
if(Math.random()>0.3) return;

let events=[
{text:"🤝 Lieferant bietet billige Ware",yes:g=>{g.money+=300;g.reputation-=4;log("Deal angenommen – Ruf leidet")},no:g=>{log("Deal abgelehnt")}},
{text:"📰 Influencer Werbung",yes:g=>{g.money-=200;g.reputation+=5;log("Werbung gebucht")},no:g=>{log("Werbung abgelehnt")}},
{text:"⚖️ Kontrolle prüft Preise",yes:g=>{g.money-=300;g.reputation+=1;log("Strafe bezahlt")},no:g=>{g.reputation-=6;log("Abmahnung erhalten")}},
{text:"📦 Trendprodukt boomt",yes:g=>{g.customers+=5;log("Mehr Kunden durch Trend")},no:g=>{log("Trend ignoriert")}}
];

let e=events[Math.floor(Math.random()*events.length)];
let box=el("eventBox");
box.innerHTML=`
<p>${e.text}</p>
<button id="evYes">Annehmen</button>
<button id="evNo">Ablehnen</button>
`;

document.getElementById("evYes").onclick=()=>{
e.yes(game);box.innerHTML="";ui();
};
document.getElementById("evNo").onclick=()=>{
e.no(game);box.innerHTML="";ui();
};

// ================= LOG =================
function log(t){
game.log.unshift("• "+t);
if(game.log.length>25)game.log.pop();
}

// ================= LOG UI =================
function renderLog(){
el("log").innerHTML=game.log.join("<br>");
}

// ================= DASHBOARD =================
function updateDashboard(){
el("dashMoney").textContent=Math.floor(game.money);
el("dashReputation").textContent=Math.floor(game.reputation);
el("dashSatisfaction").textContent=Math.floor(game.satisfaction);
el("dashCustomers").textContent=Math.floor(game.customers);

// Lager gesamt
let totalStock = game.products.reduce((sum,p)=>sum+p.stock,0);
el("dashStock").textContent = totalStock;

// Top Produkt
let top = game.products.filter(p=>game.reputation>=p.unlock).sort((a,b)=>(b.sell*b.stock)-(a.sell*a.stock))[0];
el("dashTopProduct").textContent = top ? `${top.name} (${top.stock})` : "-";
}

// ================= ALERTS =================
function renderAlerts(){
const box=el("alerts");
box.innerHTML="";
game.alerts.forEach(a=>{
let p=document.createElement("p");
p.textContent=a;
box.appendChild(p);
});
game.alerts=[];
}

// ================= DAILY TICK =================
function nextDay(){
game.day++;
let staffBonus=1+game.staff*0.1;
let repBonus=1+(game.reputation-50)/200;
let satisBonus=1+(game.satisfaction-50)/200;
game.customers=Math.max(3,Math.floor(15*staffBonus*repBonus*satisBonus));

// Auto-Bestellung nur wenn aktiv
game.suppliers.forEach(s=>autoOrderCheck(s.id));

autoSell();
randomEvent();

game.reputation=Math.max(0,Math.min(150,game.reputation));
game.satisfaction=Math.max(0,Math.min(100,game.satisfaction));

ui();
}

// ================= LOOP =================
setInterval(nextDay,4000);

// ================= START =================
ui();
