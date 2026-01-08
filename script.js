// ================= GAME STATE =================
let game={
cash:0,
income:0,
reputation:10,
happiness:70,
eco:50,
marketShare:1,
workers:0,
managers:0,
staff:[],
branches:0,
taxRate:20,
takeoverThreat:0,
prestige:0,
unlock:{management:false,staff:false,sustain:false,politics:false,branches:false,acquisition:false,hostile:false,prestige:false},
statsLog:[]
};

const el=id=>document.getElementById(id);

// ================= SAVE / LOAD =================
function save(){localStorage.setItem("corpAscSave",JSON.stringify(game))}
function load(){let d=localStorage.getItem("corpAscSave");if(d)game=JSON.parse(d)}

// ================= UI =================
function ui(){
el("cash").textContent=Math.floor(game.cash);
el("income").textContent=game.income.toFixed(1);
el("reputation").textContent=Math.floor(game.reputation);
el("happiness").textContent=Math.floor(game.happiness);
el("eco").textContent=Math.floor(game.eco);
el("marketShare").textContent=game.marketShare.toFixed(1);
el("workers").textContent=game.workers;
el("managers").textContent=game.managers;
el("branches").textContent=game.branches;
el("taxRate").textContent=game.taxRate;

unlockLogic();
renderStaff();
updateTakeoverRisk();
}

// ================= FREISCHALT LOGIK =================
function unlockLogic(){
if(game.workers>=5) unlock("managementPanel","management");
if(game.workers>=3) unlock("staffPanel","staff");
if(game.reputation>=20) unlock("sustainPanel","sustain");
if(game.income>=2000) unlock("branchesPanel","branches");
if(game.marketShare>=10) unlock("politicsPanel","politics");
if(game.prestige>=1) unlock("acquisitionPanel","acquisition");
if(game.marketShare>=25) unlock("hostilePanel","hostile");
if(game.marketShare>=60) unlock("prestigePanel","prestige");
}

function unlock(id,key){
if(!game.unlock[key]){
game.unlock[key]=true;
document.getElementById(id).classList.remove("locked");
log("🔓 Neues System freigeschaltet: "+key);
}
}

// ================= ACTIONS =================
el("workBtn").onclick=()=>{game.cash+=10;game.reputation+=0.1;ui();}
el("hireWorkerBtn").onclick=()=>{
if(game.cash>=100){game.cash-=100;game.workers++;game.happiness-=1;recalc();ui();}
};
el("hireManagerBtn").onclick=()=>{
if(game.cash>=2000){game.cash-=2000;game.managers++;recalc();ui();}
};

// ================= STAFF & SKILLS =================
const skills=["Produktion","Marketing","Forschung","Management"];
const names=["Alex","Sam","Jordan","Chris","Mika","Robin","Taylor"];

el("hireSkilledBtn").onclick=()=>{
if(game.cash<500) return;
game.cash-=500;
let s={name:names[Math.floor(Math.random()*names.length)],
skill:skills[Math.floor(Math.random()*skills.length)],
level:1};
game.staff.push(s);
log("🧑‍💼 "+s.name+" eingestellt ("+s.skill+")");
recalc();ui();
};

function renderStaff(){
let box=el("staffList");
if(!box) return;
box.innerHTML="";
game.staff.forEach((s,i)=>{
let div=document.createElement("div");
div.className="staffItem";
div.innerHTML=`👤 ${s.name} – ${s.skill} Lvl ${s.level} <button onclick="trainStaff(${i})">Trainieren</button>`;
box.appendChild(div);
});
}

function trainStaff(i){
let s=game.staff[i];
let cost=300*s.level;
if(game.cash<cost || s.level>=5) return;
game.cash-=cost;
s.level++;
log("📚 "+s.name+" trainiert → Level "+s.level);
recalc();ui();
}

// ================= SUSTAINABILITY =================
el("greenInvestBtn").onclick=()=>{
if(game.cash>=5000){game.cash-=5000;game.eco=Math.min(100,game.eco+10);game.reputation+=3;ui();}
};
el("cheapProdBtn").onclick=()=>{
game.cash+=3000;game.reputation-=4;game.eco-=10;ui();
};

// ================= POLITICS =================
el("lobbyBtn").onclick=()=>{
if(game.cash>=3000){game.cash-=3000;game.taxRate=Math.max(5,game.taxRate-2);game.reputation-=1;log("⚖️ Lobbyarbeit: Steuern gesenkt, Ruf leicht gefallen");ui();}
};

// ================= BRANCHES =================
el("openEuropeBtn").onclick=()=>openBranch(10000,5);
el("openUSABtn").onclick=()=>openBranch(25000,8);
el("openAsiaBtn").onclick=()=>openBranch(50000,12);

function openBranch(cost,share){
if(game.cash>=cost){game.cash-=cost;game.branches++;game.marketShare+=share;recalc();ui();}
}

// ================= ACQUISITION =================
el("buyCompanyBtn").onclick=()=>{
if(game.cash>=40000){game.cash-=40000;game.marketShare+=8;game.reputation-=5;log("🏦 Firma übernommen – Markt wächst, Ruf leidet");ui();}
};

// ================= ECONOMY =================
function recalc(){
let base=game.workers*5;
let mgmt=1+game.managers*0.2;
let branch=1+game.branches*0.4;
let ecoBonus=1+(game.eco-50)/200;
let happyBonus=1+(game.happiness-50)/200;
let taxPenalty=1-game.taxRate/100;

// Skills
let prodBonus=1, marketBonus=0, ecoSkill=0, happySkill=0;
game.staff.forEach(s=>{
if(s.skill=="Produktion") prodBonus+=0.02*s.level;
if(s.skill=="Marketing") marketBonus+=0.01*s.level;
if(s.skill=="Forschung") ecoSkill+=2*s.level;
if(s.skill=="Management") happySkill+=2*s.level;
});
game.eco=Math.min(100,game.eco+ecoSkill*0.01);
game.happiness=Math.min(100,game.happiness+happySkill*0.01);

game.income=base*mgmt*branch*ecoBonus*happyBonus*taxPenalty*prodBonus;
game.marketShare+=marketBonus;
}

// ================= LOGIC =================
function tickLogic(){
// Steuern zu hoch → Ruf sinkt
if(game.taxRate>30){game.reputation-=0.2;}
// Unzufriedenheit → Streik
if(game.happiness<40 && Math.random()<0.02){
crisis("😡 Mitarbeiter streiken!",[{t:"Löhne erhöhen",e:g=>{g.cash-=3000;g.happiness+=10}},{t:"Ignorieren",e:g=>{g.income*=0.7;g.reputation-=3}}]);
}
// Umwelt schlecht → Skandal
if(game.eco<30 && Math.random()<0.02){
crisis("📰 Umweltskandal!",[{t:"PR-Kampagne",e:g=>{g.cash-=4000;g.reputation+=2}},{t:"Aussitzen",e:g=>{g.reputation-=5}}]);
}

// Feindliche Übernahme
if(game.takeoverThreat>60 && Math.random()<0.01){hostileTakeover();}
}

// ================= CRISIS =================
function crisis(text,options){
const box=el("decisionBox");
box.innerHTML="<p>"+text+"</p>";
options.forEach(o=>{
let b=document.createElement("button");
b.textContent=o.t;
b.onclick=()=>{o.e(game);box.style.display="none";recalc();ui();};
box.appendChild(b);
});
box.style.display="block";
}

// ================= HOSTILE TAKEOVER =================
function updateTakeoverRisk(){
let risk=0;
if(game.reputation<20) risk+=30;
if(game.cash<5000) risk+=20;
if(game.marketShare>30) risk+=30;
game.takeoverThreat=Math.min(100,risk);
let txt="Niedrig";
if(risk>30) txt="Mittel";
if(risk>60) txt="Hoch";
el("takeoverRisk").textContent=txt;
}

function hostileTakeover(){
crisis("⚔️ Feindliche Übernahme!",[
{t:"Abwehren (5000€)",e:g=>{g.cash-=5000;g.reputation+=2;log("🛡️ Übernahme abgewehrt");}},
{t:"Teilverkauf",e:g=>{g.cash+=8000;g.marketShare-=10;g.reputation-=2;log("💸 Anteile verkauft");}},
{t:"Fusion",e:g=>{g.marketShare+=15;g.reputation-=5;g.income*=1.2;log("🔗 Fusion abgeschlossen");}}
]);
}

// ================= LOG =================
function log(t){game.statsLog.unshift("• "+t);el("statsLog").innerHTML=game.statsLog.slice(0,10).join("<br>");}

// ================= PRESTIGE =================
el("prestigeBtn").onclick=()=>{
if(game.marketShare<60) return;
game.prestige++;
log("🌟 Prestige erreicht!");
game={
...game,
cash:0,income:0,reputation:10,happiness:70,eco:50,marketShare:1,
workers:0,managers:0,staff:[],branches:0,taxRate:20
};
ui();
};

// ================= LOOP =================
setInterval(()=>{
game.cash+=game.income;
tickLogic();
ui();
},1000);

setInterval(save,10000);

// ================= START =================
load();
recalc();
ui();
