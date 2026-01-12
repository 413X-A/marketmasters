// ---------- SAVE ----------
function saveGame(){
 localStorage.setItem("retailEmpireSave",JSON.stringify(game));
}
function loadGame(){
 const d=localStorage.getItem("retailEmpireSave");
 if(d) Object.assign(game,JSON.parse(d));
}

document.addEventListener("DOMContentLoaded",()=>{

const el=id=>document.getElementById(id);
const toast=t=>{
 const b=el("toast");
 b.textContent=t;b.classList.add("show");
 setTimeout(()=>b.classList.remove("show"),1500);
};

// ---------- GAME ----------
window.game={
 day:1,
 money:1200,
 reputation:20,
 satisfaction:60,
 customers:4,
 autoOrder:false,
 orderAmount:10,
 alerts:[],
 marketing:0,

 staff:[],

 products:[],

 competitors:[
  {name:"MegaMart",pressure:0.9},
  {name:"CityShop",pressure:0.95}
 ]
};

// ---------- PRODUKT-DATEN ----------
const productDB=[
 // Food
 ["Brot",1,2,0],["Wasser",0.5,1.5,0],["Apfel",0.8,2,0],
 ["Milch",1.2,2.5,0],["Eier",1.5,3,0],["Butter",2,4,10],
 ["Kaffee",3,6,30],["Sandwich",4,9,40],["Pizza",5,12,50],
 ["Salat",3,7,55],
 // Kleidung
 ["T-Shirt",8,19,60],["Hose",15,39,70],["Schuhe",20,59,75],
 // Elektronik
 ["Kopfhörer",30,79,90],["Smartwatch",80,179,100],
 ["Smartphone",180,349,110],["Laptop",450,899,130],
 ["Gaming-PC",900,1799,160],["Konsole",350,699,180],
 ["TV",500,999,190],["VR-Headset",280,599,200]
];

// Init products
productDB.forEach((p,i)=>{
 game.products.push({
  id:i+1,name:p[0],buy:p[1],sell:p[2],
  stock:i<5?20:0,unlock:p[3]
 });
});

loadGame();

// ---------- PRICE STATE ----------
function priceState(p){
 let fair=p.buy*2;
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

 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;

 el("hireBtn").disabled=game.reputation<60;

 renderProducts();
 renderStaff();
 renderAlerts();
 saveGame();
}

// ---------- PRODUCTS ----------
function renderProducts(){
 const box=el("productList");box.innerHTML="";
 game.products.forEach(p=>{
  if(game.reputation<p.unlock) return;
  let s=priceState(p);
  let c=s==="green"?"price-green":s==="yellow"?"price-yellow":"price-red";

  let d=document.createElement("div");
  d.className="product";
  d.innerHTML=`
   <b>${p.name}</b> | Lager ${p.stock}<br>
   EK ${p.buy}€ | VK 
   <input type="number" value="${p.sell}" data-id="${p.id}">
   <span class="${c}">●</span>
  `;
  box.appendChild(d);
 });

 document.querySelectorAll("#productList input").forEach(i=>{
  i.onchange=()=>{
   let p=game.products.find(x=>x.id==i.dataset.id);
   p.sell=parseFloat(i.value);
   saveGame();
  };
 });
}

// ---------- STAFF ----------
el("hireBtn").onclick=()=>{
 if(game.money<300) return toast("❌ Zu wenig Geld");
 game.money-=300;
 game.staff.push({level:1,service:1,sales:1});
 toast("👤 Mitarbeiter eingestellt");
 ui();
};

function renderStaff(){
 const b=el("staffList");b.innerHTML="";
 if(game.staff.length===0){b.textContent="Noch keine Mitarbeiter";return;}
 game.staff.forEach((s,i)=>{
  let d=document.createElement("div");
  d.className="product";
  d.textContent=`Mitarbeiter ${i+1} | Level ${s.level}`;
  b.appendChild(d);
 });
}

// ---------- AUTO ORDER ----------
el("autoOrder").onchange=e=>{
 game.autoOrder=e.target.checked;saveGame();
};
el("orderAmount").onchange=e=>{
 game.orderAmount=parseInt(e.target.value);saveGame();
};

function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(game.reputation<p.unlock||p.stock>0) return;
  let cost=p.buy*game.orderAmount;
  if(game.money>=cost){
   p.stock+=game.orderAmount;
   game.money-=cost;
  }
 });
}

// ---------- COMPETITION ----------
function competitionFactor(){
 let f=1;
 game.competitors.forEach(c=>{
  if(Math.random()<0.3) f*=c.pressure;
 });
 return f;
}

// ---------- SALES ----------
function autoSell(){
 let stockTotal=game.products.reduce((s,p)=>s+p.stock,0);
 let base=2+game.reputation/12;

 if(stockTotal<20) base*=0.6;
 if(stockTotal<5) base*=0.3;

 base*=competitionFactor();
 base*=1+(game.marketing/100);

 game.products.forEach(p=>{
  if(p.stock<=0||game.reputation<p.unlock) return;
  let state=priceState(p);
  let demand=base;

  if(state==="yellow") demand*=0.75;
  if(state==="red") demand*=0.4;

  let sold=Math.min(p.stock,Math.floor(demand/4));
  if(sold<=0) return;

  p.stock-=sold;
  game.money+=sold*p.sell;
  toast(`🛒 +${sold} ${p.name}`);
 });

 game.customers=Math.max(1,Math.floor(base));
}

// ---------- MARKETING ----------
el("adBtn").onclick=()=>{
 if(game.money<200) return toast("❌ Zu wenig Geld");
 game.money-=200;
 game.marketing+=10;
 toast("📢 Werbung läuft");
 ui();
};

// ---------- EVENTS ----------
let eventCD=0;
function randomEvent(){
 if(eventCD>0){eventCD--;return;}
 if(Math.random()>0.1) return;
 eventCD=8;

 let e=[
  {t:"⚠️ Lieferverzug",yes:g=>{g.reputation-=3}},
  {t:"📰 Gute Presse",yes:g=>{g.reputation+=4}},
  {t:"🤝 Händler-Deal",yes:g=>{g.money+=300;g.reputation-=2}}
 ];
 let ev=e[Math.floor(Math.random()*e.length)];
 let box=el("eventBox");
 box.innerHTML=`<p>${ev.t}</p><button id="ev">OK</button>`;
 document.getElementById("ev").onclick=()=>{
  ev.yes(game);box.innerHTML="";ui();
 };
}

// ---------- ALERTS ----------
function renderAlerts(){
 const b=el("alerts");b.innerHTML="";
 game.alerts.forEach(a=>{
  let p=document.createElement("p");
  p.textContent=a;b.appendChild(p);
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
