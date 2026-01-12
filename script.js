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
 const box=el("toast");
 box.textContent=t;
 box.classList.add("show");
 setTimeout(()=>box.classList.remove("show"),1500);
};

window.game={
 day:1,
 money:1000,
 reputation:25,
 customers:4,
 staff:[],
 autoOrder:false,
 orderAmount:10,
 alerts:[],

 products:[
  {id:1,name:"Brot",buy:1,sell:2,stock:30,unlock:0},
  {id:2,name:"Wasser",buy:0.5,sell:1.5,stock:40,unlock:0},
  {id:3,name:"Apfel",buy:0.8,sell:2,stock:25,unlock:0},
  {id:4,name:"Milch",buy:1.2,sell:2.5,stock:20,unlock:0},
  {id:5,name:"Eier",buy:1.5,sell:3,stock:15,unlock:0},

  {id:6,name:"Kaffee",buy:3,sell:6,stock:0,unlock:40},
  {id:7,name:"Sandwich",buy:4,sell:9,stock:0,unlock:45},
  {id:8,name:"Pizza",buy:5,sell:12,stock:0,unlock:50},
  {id:9,name:"Salat",buy:3,sell:7,stock:0,unlock:55},

  {id:10,name:"Kleidung",buy:12,sell:29,stock:0,unlock:70},
  {id:11,name:"Schuhe",buy:18,sell:49,stock:0,unlock:75},

  {id:12,name:"Kopfhörer",buy:30,sell:79,stock:0,unlock:90},
  {id:13,name:"Smartwatch",buy:80,sell:179,stock:0,unlock:100},
  {id:14,name:"Smartphone",buy:180,sell:349,stock:0,unlock:110},
  {id:15,name:"Laptop",buy:450,sell:899,stock:0,unlock:130},

  {id:16,name:"Gaming PC",buy:900,sell:1799,stock:0,unlock:160},
  {id:17,name:"E-Bike",buy:700,sell:1499,stock:0,unlock:170},
  {id:18,name:"Fernseher",buy:500,sell:999,stock:0,unlock:180},
  {id:19,name:"Konsole",buy:350,sell:699,stock:0,unlock:190},
  {id:20,name:"VR-Headset",buy:280,sell:599,stock:0,unlock:200}
 ]
};

loadGame();

function priceState(p){
 const fair=p.buy*2;
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

function ui(){
 el("day").textContent=game.day;
 el("money").textContent=Math.floor(game.money);
 el("reputation").textContent=Math.floor(game.reputation);
 el("customers").textContent=Math.floor(game.customers);

 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;
 el("hireBtn").disabled=game.reputation<60;

 renderProducts();
 renderStaff();
 renderAlerts();
 saveGame();
}

function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  if(game.reputation<p.unlock) return;
  let s=priceState(p);
  let c=s==="green"?"price-green":s==="yellow"?"price-yellow":"price-red";

  const d=document.createElement("div");
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

el("hireBtn").onclick=()=>{
 if(game.money<300) return;
 game.money-=300;
 game.staff.push({level:1});
 toast("👤 Mitarbeiter eingestellt");
 ui();
};

function renderStaff(){
 const b=el("staffList");
 b.innerHTML="";
 if(game.staff.length===0){b.textContent="Noch keine Mitarbeiter";return;}
 game.staff.forEach((s,i)=>{
  const d=document.createElement("div");
  d.className="product";
  d.textContent=`Mitarbeiter ${i+1} | Level ${s.level}`;
  b.appendChild(d);
 });
}

el("autoOrder").onchange=e=>{
 game.autoOrder=e.target.checked;
 saveGame();
};
el("orderAmount").onchange=e=>{
 game.orderAmount=parseInt(e.target.value);
 saveGame();
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

function autoSell(){
 let stockTotal=game.products.reduce((s,p)=>s+p.stock,0);
 let base=2+game.reputation/12;
 if(stockTotal<20) base*=0.6;
 if(stockTotal<5) base*=0.3;

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

let eventCD=0;
function randomEvent(){
 if(eventCD>0){eventCD--;return;}
 if(Math.random()>0.12) return;
 eventCD=8;

 const e=[
  {t:"📺 Werbung schalten (200€)",yes:g=>{g.money-=200;g.reputation+=6}},
  {t:"⚠️ Billiger Lieferant",yes:g=>{g.money+=300;g.reputation-=5}}
 ];
 const ev=e[Math.floor(Math.random()*e.length)];
 const box=el("eventBox");
 box.innerHTML=`<p>${ev.t}</p><button id="y">Annehmen</button>`;
 document.getElementById("y").onclick=()=>{
  ev.yes(game);
  box.innerHTML="";
  ui();
 };
}

function renderAlerts(){
 const b=el("alerts");b.innerHTML="";
 game.alerts.forEach(a=>{
  let p=document.createElement("p");
  p.textContent=a;
  b.appendChild(p);
 });
 game.alerts=[];
}

function nextDay(){
 game.day++;
 autoOrder();
 autoSell();
 randomEvent();
 ui();
}

setInterval(nextDay,4000);
ui();

});
