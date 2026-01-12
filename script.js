document.addEventListener("DOMContentLoaded",()=>{

const el=id=>document.getElementById(id);
const money=v=>v.toFixed(2).replace(".",",")+" €";

let game={};

function newGame(){
 game={
  day:1,
  hour:8,
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
  report:[]
 };

 const productDB=[
  {name:"Brot",buy:1,sell:2,unlock:0,stock:10},
  {name:"Wasser",buy:0.5,sell:1.5,unlock:0,stock:10},
  {name:"Apfel",buy:0.8,sell:2,unlock:0,stock:10},
  {name:"Milch",buy:1.2,sell:2.5,unlock:30,stock:0},
  {name:"Kaffee",buy:3,sell:6,unlock:50,stock:0},
  {name:"Pizza",buy:5,sell:12,unlock:90,stock:0}
 ];

 productDB.forEach((p,i)=>{
  game.products.push({
   id:i+1,
   ...p,
   unlocked:p.unlock===0,
   discount:0,
   level:1,
   selling:true,
   tolerance:1
  });
 });

 ui();
}
newGame();
el("newGameBtn").onclick=newGame;

/* UI */
function ui(){
 el("day").textContent=game.day;
 el("clock").textContent=String(game.hour).padStart(2,"0")+":00";
 el("money").textContent=money(game.money);
 el("reputation").textContent=Math.floor(game.reputation);
 el("xp").textContent=Math.floor(game.xp);
 el("customers").textContent=Math.floor(game.customers);
 el("income").textContent=money(game.income);
 el("expenses").textContent=money(game.expenses);
 el("profit").textContent=money(game.income-game.expenses);
 el("autoOrder").checked=game.autoOrder;
 el("orderAmount").value=game.orderAmount;
 el("reorderLimit").value=game.reorderLimit;
 renderProducts();
 renderStaff();
 renderReport();
}

/* Produkte */
function priceState(p){
 let fair=p.buy*2*p.tolerance;
 if(p.sell<=fair*1.1) return "green";
 if(p.sell<=fair*1.4) return "yellow";
 return "red";
}

function renderProducts(){
 const box=el("productList");
 box.innerHTML="";
 game.products.forEach(p=>{
  if(!p.unlocked) return;
  const d=document.createElement("div");
  d.className="product";
  d.id=`product-${p.id}`;
  const c=priceState(p)==="green"?"🟢":priceState(p)==="yellow"?"🟡":"🔴";
  d.innerHTML=`
   <b>${p.name}</b> | Lager ${p.stock}<br>
   Level ${p.level} | VK ${money(p.sell)} ${c}<br>
   <button onclick="changePrice(${p.id},-1)">-</button>
   <button onclick="changePrice(${p.id},1)">+</button><br>
   Rabatt ${p.discount}%<br>
   <button onclick="upgradeProduct(${p.id})">Upgrade (${p.level*20} XP)</button>
   <button onclick="toggleSelling(${p.id})">${p.selling?"Stop":"Start"}</button>
  `;
  box.appendChild(d);
 });
}

window.changePrice=(id,v)=>{
 const p=game.products.find(x=>x.id===id);
 p.sell=Math.max(0.1,p.sell+v);
 ui();
};

/* Mitarbeiter */
el("hireBtn").onclick=()=>{
 if(game.money<100) return alert("Nicht genug Geld");
 game.money-=100;
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
 if(game.staff.length===0){b.textContent="Keine Mitarbeiter";return;}
 game.staff.forEach(s=>{
  const d=document.createElement("div");
  d.className="product";
  d.innerHTML=`
   Level ${s.level}<br>
   🛎${s.service} 💰${s.sales} 📦${s.logistics}<br>
   <button onclick="upgradeStaff(${s.id})">Skill (${s.level*20} XP)</button>
  `;
  b.appendChild(d);
 });
}

window.upgradeStaff=id=>{
 const s=game.staff.find(x=>x.id===id);
 if(game.xp<s.level*20) return alert("Zu wenig XP");
 game.xp-=s.level*20;
 s.level++; s.service++; s.sales++; s.logistics++;
 ui();
};

/* Verkauf */
function calculateCustomers(){
 let base=Math.max(1,Math.floor(game.reputation/5));
 let service=game.staff.reduce((s,x)=>s+x.service,0);
 return base+service;
}

function sellHour(){
 game.customers=calculateCustomers();
 game.products.forEach(p=>{
  if(!p.selling||p.stock<=0) return;
  let strict=1+game.day*0.05;
  let state=priceState(p);
  let chance=state==="green"?1:state==="yellow"?0.6:0.2;
  let sold=Math.min(p.stock,Math.floor(Math.random()*chance*game.customers));
  if(sold>0){
   let rev=sold*p.sell;
   p.stock-=sold;
   game.income+=rev;
   game.money+=rev;
   game.xp+=sold*p.level;
   animateProduct(p.id);
  }
  if(state==="red"){
   game.reputation=Math.max(0,game.reputation-0.2*strict);
  }
 });
}

/* Produkt Upgrade */
window.upgradeProduct=id=>{
 const p=game.products.find(x=>x.id===id);
 if(game.xp<p.level*20) return alert("Zu wenig XP");
 game.xp-=p.level*20;
 p.level++;
 p.tolerance+=0.15;
 const d=el(`product-${p.id}`);
 if(d){d.classList.add("upgrade");setTimeout(()=>d.classList.remove("upgrade"),600);}
 ui();
};

window.toggleSelling=id=>{
 const p=game.products.find(x=>x.id===id);
 p.selling=!p.selling;
 ui();
};

/* Auto Order */
el("autoOrder").onchange=e=>game.autoOrder=e.target.checked;
el("orderAmount").onchange=e=>game.orderAmount=parseInt(e.target.value);
el("reorderLimit").onchange=e=>game.reorderLimit=parseInt(e.target.value);

function autoOrder(){
 if(!game.autoOrder) return;
 game.products.forEach(p=>{
  if(p.stock<game.reorderLimit){
   let cost=p.buy*game.orderAmount;
   if(game.money>=cost){
    game.money-=cost;
    game.expenses+=cost;
    p.stock+=game.orderAmount;
   }
  }
 });
}

/* Zeit */
setInterval(()=>{
 game.hour++;
 if(game.hour>=24){
  endDay();
 }else{
  sellHour();
 }
 ui();
},5000);

/* Tagesende */
function endDay(){
 el("dayOverlay").classList.remove("hidden");
 el("daySummary").innerHTML=`
  💰 Gewinn: ${money(game.income-game.expenses)}<br>
  👥 Kunden: ${game.customers}<br>
  ⭐ Ruf: ${Math.floor(game.reputation)}<br>
  📈 XP: ${Math.floor(game.xp)}
 `;
}

el("nextDayBtn").onclick=()=>{
 game.day++;
 game.hour=8;
 game.income=0;
 game.expenses=0;
 game.report=[];
 autoOrder();
 el("dayOverlay").classList.add("hidden");
 ui();
};

/* Effekte */
function animateProduct(id){
 const d=el(`product-${id}`);
 if(!d) return;
 d.classList.add("sell");
 setTimeout(()=>d.classList.remove("sell"),300);
}

/* Report */
function renderReport(){
 const b=el("report");
 if(game.report.length===0){b.textContent="Noch keine Daten";return;}
 b.innerHTML=game.report.join("<br>");
}

});
