// ================= GAME STATE =================
let game={
money:1000,
reputation:50,
satisfaction:60,
customers:10,
storage:50,
staff:0,
log:[],
products:[
 {id:1,name:"Brot",buy:1,sell:2,stock:10,unlock:0},
 {id:2,name:"Wasser",buy:0.5,sell:1.5,stock:10,unlock:0},
 {id:3,name:"Apfel",buy:0.8,sell:2,stock:5,unlock:0},
 {id:4,name:"Kaffee",buy:3,sell:6,stock:0,unlock:40},
 {id:5,name:"Kleidung",buy:10,sell:25,stock:0,unlock:70},
 {id:6,name:"Elektronik",buy:50,sell:120,stock:0,unlock:120}
],
events:[],
day:1
};

const el=id=>document.getElementById(id);

// ================= UI =================
function ui(){
el("money").textContent=Math.floor(game.money);
el("reputation").textContent=Math.floor(game.reputation);
el("satisfaction").textContent=Math.floor(game.satisfaction);
el("customers").textContent=Math.floor(game.customers);
el("storage").textContent=game.storage;

renderProducts();
renderSuppliers();
renderWarnings();
renderLog();
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
<b>${p.name}</b> | Bestand: ${p.stock}
<br>Einkauf: ${p.buy}€ | Verkauf:
<input type="number" value="${p.sell}" style="width:60px"
 onchange="setPrice(${p.id},this.value)">
<span class="${color}">●</span>
<button onclick="sellProduct(${p.id})">Verkaufen</button>
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
game.products.forEach(p=>{
if(game.reputation<p.unlock) return;
let div=document.createElement("div");
div.className="product";
div.innerHTML=`
${p.name} einkaufen:
<button onclick="buyProduct(${p.id},5)">+5</button>
<button onclick="buyProduct(${p.id},20)">+20</button>
`;
box.appendChild(div);
});
}

function buyProduct(id,amount){
let p=game.products.find(x=>x.id==id);
let cost=p.buy*amount;
if(game.money<cost) return;
if(getTotalStock()+amount>game.storage) return;

game.money-=cost;
p.stock+=amount;
log(`📦 ${amount}x ${p.name} eingekauft`);
ui();
}

// ================= SELLING =================
function sellProduct(id){
let p=game.products.find(x=>x.id==id);
if(p.stock<=0) return;

let state=getPriceState(p);
let sold=Math.max(1,Math.floor(game.customers/10));
sold=Math.min(sold,p.stock);

let income=sold*p.sell;
game.money+=income;
p.stock-=sold;

if(state=="red"){
game.reputation-=1;
game.satisfaction-=2;
if(Math.random()<0.15) triggerWarning();
}
if(state=="green"){
game.reputation+=0.2;
game.satisfaction+=0.2;
}

ui();
}

// ================= PRICE LOGIC =================
function getPriceState(p){
let fair=p.buy*2;
if(p.sell<=fair*1.1) return "green";
if(p.sell<=fair*1.5) return "yellow";
return "red";
}

// ================= WARNINGS =================
function renderWarnings(){
let box=el("priceWarnings");
box.innerHTML="";
game.products.forEach(p=>{
if(game.reputation<p.unlock) return;
let s=getPriceState(p);
if(s=="red"){
let d=document.createElement("div");
d.className="price-red";
d.textContent=`⚠️ ${p.name}: Preis sehr hoch! Risiko für Ruf & Abmahnung`;
box.appendChild(d);
}
});
}

// ================= STAFF =================
el("hireStaffBtn").onclick=()=>{
if(game.money<300) return;
game.money-=300;
game.staff++;
game.customers+=2;
game.satisfaction+=1;
log("👤 Mitarbeiter eingestellt");
ui();
};

// ================= EVENTS =================
function randomEvent(){
if(Math.random()>0.2) return;

let events=[
{
text:"🤝 Lieferant bietet billige Ware (Qualität schlecht)",
yes:g=>{g.money+=200;g.reputation-=3;log("Deal angenommen – Ruf leidet")},
no:g=>{log("Deal abgelehnt")}
},
{
text:"📰 Lokale Zeitung will über dich berichten",
yes:g=>{g.money-=100;g.reputation+=4;log("PR bezahlt – Ruf steigt")},
no:g=>{log("Chance verpasst")}
},
{
text:"⚖️ Amt kontrolliert Preise",
yes:g=>{g.money-=300;g.reputation+=1;log("Strafe gezahlt, Image gerettet")},
no:g=>{g.reputation-=5;log("Abmahnung erhalten!")}
}
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
}

// ================= WARNINGS =================
function triggerWarning(){
log("⚠️ Kunden beschweren sich über Abzockpreise!");
if(Math.random()<0.3){
log("⚖️ Abmahnung erhalten – 500€ Strafe");
game.money-=500;
}
}

// ================= ECONOMY =================
function dailyTick(){
game.day++;

let serviceBonus=1+game.staff*0.05;
let repBonus=1+(game.reputation-50)/200;
let satisBonus=1+(game.satisfaction-50)/200;

game.customers=Math.max(2,Math.floor(10*serviceBonus*repBonus*satisBonus));

game.reputation=Math.max(0,Math.min(150,game.reputation));
game.satisfaction=Math.max(0,Math.min(100,game.satisfaction));

randomEvent();
ui();
}

// ================= UTILS =================
function getTotalStock(){
return game.products.reduce((a,b)=>a+b.stock,0);
}

function log(t){
game.log.unshift("• "+t);
if(game.log.length>20)game.log.pop();
}

// ================= LOG UI =================
function renderLog(){
el("log").innerHTML=game.log.join("<br>");
}

// ================= LOOP =================
setInterval(dailyTick,4000);

// ================= START =================
ui();
