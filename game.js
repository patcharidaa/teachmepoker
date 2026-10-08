const $=id=>document.getElementById(id);
const RANKS="23456789TJQKA",SUITS=["♠","♥","♦","♣"],RED=new Set(["♥","♦"]);
const MODES={learning:"Approachable bots; personalities are intentionally readable and imperfect.",casual:"Loose opponents with noticeable mistakes.",standard:"Balanced opponents with sensible aggression.",tough:"Tighter ranges and stronger pressure.",expert:"The same personalities, but much more strategically coherent."};
const PERSONALITIES=[
{name:"The Nit",icon:"🧊",desc:"Very selective; waits for strong spots.",vpip:.18,agg:.22,bluff:.05,call:.18,tilt:.03},
{name:"Calling Station",icon:"📞",desc:"Hates folding and loves seeing another card.",vpip:.72,agg:.18,bluff:.08,call:.92,tilt:.08},
{name:"The Maniac",icon:"🔥",desc:"Relentless pressure, lots of bets and raises.",vpip:.78,agg:.88,bluff:.62,call:.35,tilt:.30},
{name:"TAG",icon:"🎯",desc:"Tight-aggressive and selective about pressure.",vpip:.30,agg:.72,bluff:.22,call:.42,tilt:.08},
{name:"LAG",icon:"⚡",desc:"Loose-aggressive; attacks weakness frequently.",vpip:.62,agg:.78,bluff:.42,call:.48,tilt:.16},
{name:"The Gambler",icon:"🎲",desc:"Chases draws and gets attached to big pots.",vpip:.68,agg:.60,bluff:.48,call:.78,tilt:.38},
{name:"The Trapper",icon:"🪤",desc:"Likes slow-playing strong hands and springing traps.",vpip:.32,agg:.55,bluff:.28,call:.58,tilt:.10},
{name:"The Rock",icon:"🪨",desc:"Extremely conservative and risk-averse.",vpip:.22,agg:.30,bluff:.03,call:.25,tilt:.02},
{name:"Social Player",icon:"😎",desc:"Broad range, occasional creative plays.",vpip:.52,agg:.48,bluff:.30,call:.62,tilt:.20},
{name:"The Explorer",icon:"🧭",desc:"Unpredictable; experiments with unusual lines.",vpip:.58,agg:.52,bluff:.40,call:.60,tilt:.25}
];
let G={};
const money=n=>"$"+Math.round(n).toLocaleString();
const cardText=c=>c.r+c.s;
function log(x){$("history").innerHTML+=`<div>${x}</div>`;$("history").scrollTop=$("history").scrollHeight}
function makeDeck(){let d=[];for(const r of RANKS)for(const s of SUITS)d.push({r,s});return d}
function shuffle(d){for(let i=d.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function rank(c){return RANKS.indexOf(c.r)+2}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){let x=a[i]??0,y=b[i]??0;if(x!==y)return x-y}return 0}
function handName(e){return["High card","Pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"][e[0]]}
function evaluate(cs){
 let a=cs.map(rank).sort((x,y)=>y-x),counts={};a.forEach(v=>counts[v]=(counts[v]||0)+1);
 let suits={};cs.forEach(c=>(suits[c.s]??=[]).push(rank(c)));
 let flush=Object.values(suits).find(x=>x.length>=5),u=[...new Set(a)];if(u.includes(14))u.push(1);
 let straight=0;for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4){straight=u[i];break}
 if(flush){let f=[...new Set(flush)].sort((x,y)=>y-x);if(f.includes(14))f.push(1);for(let i=0;i<=f.length-5;i++)if(f[i]-f[i+4]===4)return[8,f[i]]}
 let groups=Object.entries(counts).map(([v,n])=>({v:+v,n})).sort((x,y)=>y.n-x.n||y.v-x.v);
 let q=groups.find(x=>x.n===4),t=groups.filter(x=>x.n>=3).map(x=>x.v),p=groups.filter(x=>x.n>=2).map(x=>x.v);
 if(q)return[7,q.v,...a.filter(x=>x!==q.v).slice(0,1)];
 if(t.length&&(t.length>1||p.some(x=>x!==t[0])))return[6,t[0],t[1]||p.find(x=>x!==t[0])];
 if(flush)return[5,...flush.sort((x,y)=>y-x).slice(0,5)];
 if(straight)return[4,straight];
 if(t.length)return[3,t[0],...a.filter(x=>x!==t[0]).slice(0,2)];
 if(p.length>=2){let pp=[...new Set(p)].sort((x,y)=>y-x);return[2,pp[0],pp[1],...a.filter(x=>x!==pp[0]&&x!==pp[1]).slice(0,1)]}
 if(p.length)return[1,p[0],...a.filter(x=>x!==p[0]).slice(0,3)];
 return[0,...a.slice(0,5)]
}
function pickPersonality(){return PERSONALITIES[Math.floor(Math.random()*PERSONALITIES.length)]}
function activeIndices(){return G.players.map((p,i)=>p.eliminated?-1:i).filter(i=>i>=0)}
function nextActive(i){const ids=activeIndices();if(!ids.length)return -1;let pos=ids.indexOf(i);if(pos<0)return ids[0];return ids[(pos+1)%ids.length]}
function setup(){
 let n=Math.max(2,Math.min(9,+$("playerCount").value||6)),stack=Math.max(100,+$("startingStack").value||1000);
 let sb=Math.max(1,+$("smallBlind").value||10),bb=Math.max(sb*2,+$("bigBlind").value||20);
 G={n,startingStack:stack,sb,bb,button:-1,hand:0,players:[],deck:[],board:[],pot:0,street:"",turn:-1,highest:0,actionable:false,acted:new Set(),contrib:[],raiseSize:bb,canRaise:new Set(),handOver:false};
 $("modeDescription").textContent=MODES[$("mode").value];
 G.players=Array.from({length:n},(_,i)=>({name:i===0?"You":"Bot "+i,stack:stack,hole:[],folded:false,allin:false,eliminated:false,streetBet:0,reveal:false,noise:Math.random(),personality:pickPersonality()}));
 newHand(true);
}
function newHand(isNewGame=false){
 if(!G.players?.length)return;
 if(!isNewGame){
   G.players.forEach(p=>{if(p.stack<=0)p.eliminated=true});
   if(G.players[0].eliminated){G.handOver=true;G.actionable=false;$("status").textContent="You are out of chips. Start a New Game to play again.";render();return}
   const active=activeIndices();
   if(active.length<2){G.handOver=true;G.actionable=false;$("status").textContent="You are the only player remaining — you win the session!";render();return}
 }
 G.hand++;G.deck=shuffle(makeDeck());G.board=[];G.pot=0;G.street="Preflop";G.highest=0;G.actionable=false;G.acted=new Set();G.canRaise=new Set(activeIndices());G.contrib=Array(G.players.length).fill(0);G.raiseSize=G.bb;G.handOver=false;
 G.button=nextActive(G.button);
 G.players.forEach(p=>{p.hole=[];p.folded=p.eliminated;p.allin=false;p.streetBet=0;p.reveal=false});
 const ids=activeIndices();
 for(let r=0;r<2;r++)for(const i of ids)G.players[i].hole.push(G.deck.pop());
 let sbPos,bbPos,first;
 if(ids.length===2){sbPos=G.button;bbPos=nextActive(G.button);first=G.button}
 else{sbPos=nextActive(G.button);bbPos=nextActive(sbPos);first=nextActive(bbPos)}
 put(sbPos,G.sb);put(bbPos,G.bb);G.highest=Math.min(G.bb,G.players[bbPos].streetBet);G.turn=first;G.actionable=true;
 log(`<b>Hand #${G.hand}</b> — blinds ${money(G.sb)}/${money(G.bb)}.`);$("status").textContent="Bots are thinking…";render();advanceBots();
}
function put(i,amount){let p=G.players[i],x=Math.min(Math.max(0,amount),p.stack);p.stack-=x;G.contrib[i]+=x;p.streetBet+=x;G.pot+=x;if(p.stack===0)p.allin=true;return x}
function nextEligible(i){const ids=activeIndices();if(!ids.length)return -1;let pos=ids.indexOf(i);if(pos<0)pos=0;for(let k=1;k<=ids.length;k++){let j=ids[(pos+k)%ids.length],p=G.players[j];if(!p.folded&&!p.allin&&p.stack>0)return j}return -1}
function callAmount(i){return Math.max(0,G.highest-G.players[i].streetBet)}
function live(){return G.players.filter(p=>!p.eliminated&&!p.folded)}
function roundDone(){const ids=G.players.map((p,i)=>!p.eliminated&&!p.folded&&!p.allin&&p.stack>0?i:-1).filter(i=>i>=0);return ids.length===0||ids.every(i=>G.acted.has(i)&&G.players[i].streetBet===G.highest)}
function takeAction(i,type,target=0){
 if(!G.actionable||G.turn!==i||G.handOver)return;
 const p=G.players[i],call=callAmount(i),oldHighest=G.highest;
 if(type==="fold"){p.folded=true;G.acted.add(i);log(`${p.name} folds.`)}
 else if(type==="check"){if(call>0)return;G.acted.add(i);log(`${p.name} checks.`)}
 else if(type==="call"){put(i,call);G.acted.add(i);log(`${p.name} calls ${money(call)}.`)}
 else if(type==="raise"){
   let desired=Math.max(0,Math.round(target));
   const maxTarget=p.streetBet+p.stack;
   desired=Math.min(desired,maxTarget);
   const isAllIn=desired===maxTarget;
   const minTarget=oldHighest+G.raiseSize;
   if(oldHighest===0)desired=Math.max(desired,G.bb);
   else if(desired<minTarget&&!isAllIn)desired=minTarget;
   if(desired<=oldHighest){
     if(call>0){put(i,call);G.acted.add(i);log(`${p.name} calls ${money(call)}.`)}
     else{G.acted.add(i);log(`${p.name} checks.`)}
   }else{
     const newHighestTarget=desired;
     const raiseBy=newHighestTarget-oldHighest;
     const fullRaise=oldHighest===0?true:raiseBy>=G.raiseSize;
     if(oldHighest>0&&!G.canRaise.has(i)&&!isAllIn){
       put(i,call);G.acted.add(i);log(`${p.name} calls ${money(call)}.`);
     }else{
       put(i,newHighestTarget-p.streetBet);const newHighest=p.streetBet;
       G.highest=Math.max(G.highest,newHighest);
       if(fullRaise){G.raiseSize=raiseBy||G.bb;G.acted=new Set([i]);G.canRaise=new Set(activeIndices());G.canRaise.delete(i)}
       else{G.acted.add(i);G.canRaise.delete(i)} // a short all-in does not reopen raising
       log(`${p.name} ${oldHighest?"raises":"bets"} to ${money(newHighest)}${isAllIn?" (ALL-IN)":""}.`)
     }
   }
 }
 if(live().length===1){finish();return}
 if(roundDone()){nextStreet();return}
 G.turn=nextEligible(i);if(G.turn<0){nextStreet();return}render();advanceBots();
}
function nextStreet(){
 G.actionable=false;G.players.forEach(p=>p.streetBet=0);G.highest=0;G.acted=new Set();G.canRaise=new Set(activeIndices());G.raiseSize=G.bb;
 if(G.street==="Preflop"){G.board.push(G.deck.pop(),G.deck.pop(),G.deck.pop());G.street="Flop"}
 else if(G.street==="Flop"){G.board.push(G.deck.pop());G.street="Turn"}
 else if(G.street==="Turn"){G.board.push(G.deck.pop());G.street="River"}
 else{finish();return}
 G.turn=nextEligible(G.button);if(G.turn<0){finish();return}G.actionable=true;log(`<b>${G.street}</b>`);render();advanceBots();
}
function difficulty(){return{learning:.62,casual:.78,standard:.92,tough:1.05,expert:1.16}[$("mode").value]}
function botStrength(p){
 let e=evaluate([...p.hole,...G.board]),s=e[0]+(e[1]||0)/25,a=rank(p.hole[0]),b=rank(p.hole[1]);
 return s+(a+b)/30+(a===b?.7:0)+(p.hole[0].s===p.hole[1].s?.3:0)+(Math.abs(a-b)<=1?.2:0)
}
function perVpip(x){return x.vpip}
function botDecision(i){
 const p=G.players[i],per=$("personalityEnabled").checked?p.personality:PERSONALITIES[8],toCall=callAmount(i),s=botStrength(p),skill=difficulty();
 let effective=s*skill+(p.noise-.5)*(1.15-skill)*2;
 if(G.street==="Preflop"&&toCall>0){const pair=rank(p.hole[0])===rank(p.hole[1]),high=Math.max(rank(p.hole[0]),rank(p.hole[1]));const q=(pair?1:0)+(high>=13?.55:high>=11?.3:0)+(p.hole[0].s===p.hole[1].s?.18:0);effective+=(q-.65)*per.vpip*1.8}
 if(toCall>0){
   const potOdds=toCall/(G.pot+toCall);let fold=.62-effective*.095-potOdds*.42+(0.48-perVpip(per))*.25-per.call*.20;fold=Math.max(.015,Math.min(.9,fold));
   if(Math.random()<fold&&!(effective>4.8&&Math.random()<.7))return["fold",0];
   let raiseChance=Math.max(.02,Math.min(.78,per.agg*.48+per.bluff*.16+(effective>3.3?.18:0)));
   if(Math.random()<raiseChance)return["raise",chooseRaiseTarget(i,Math.max(G.pot,G.bb)*(.30+per.agg*.42))];
   return["call",0];
 }
 let betChance=Math.max(.02,Math.min(.88,per.agg*.38+per.bluff*.14+(effective>3?.20:0)));
 if(Math.random()<betChance)return["raise",chooseRaiseTarget(i,Math.max(G.pot,G.bb)*(.28+per.agg*.38))];
 return["check",0];
}
function chooseRaiseTarget(i,extra){
 const p=G.players[i],min=G.highest?G.highest+G.raiseSize:G.bb,target=Math.round(G.highest+Math.max(G.bb,extra));
 return Math.min(p.streetBet+p.stack,Math.max(min,target));
}
function advanceBots(){if(!G.actionable)return;if(G.turn===0){showDecision();return}$("status").textContent="Bots are thinking…";setTimeout(()=>{if(!G.actionable||G.turn===0)return;const[t,a]=botDecision(G.turn);takeAction(G.turn,t,a)},450+Math.random()*600)}
function showDecision(){
 const toCall=callAmount(0);$("status").textContent="Your turn.";$("checkCall").textContent=toCall?`Call ${money(toCall)}`:"Check";$("raise").textContent=G.highest?"Raise":"Bet";
 const min=G.highest?G.highest+G.raiseSize:G.bb;$(`betAmount`).min=min;$(`betAmount`).value=Math.min(Math.max(min,toCall+G.bb),G.players[0].streetBet+G.players[0].stack);
 $("decisionInfo").textContent=`Pot: ${money(G.pot)} · To call: ${money(toCall)}${toCall?` · Pot odds: ${(toCall/(G.pot+toCall)*100).toFixed(1)}% · Min raise to: ${money(min)}`:` · Min bet: ${money(G.bb)}`}`;
 if($("mode").value==="learning"){let s=botStrength(G.players[0]),d=s>4.5?"very strong":s>3.2?"strong":s>2.2?"medium":"weak";$("learningBox").textContent=`Learning cue: your current hand/board is roughly ${d}. Position, ranges and future cards still matter.`}else $("learningBox").textContent="";
}
function buildPots(){
 const levels=[...new Set(G.contrib.filter(x=>x>0))].sort((a,b)=>a-b),pots=[];let prev=0;
 for(const level of levels){const involved=G.players.map((p,i)=>G.contrib[i]>=level?i:-1).filter(i=>i>=0);const amount=(level-prev)*involved.length;if(amount>0){const eligible=involved.filter(i=>!G.players[i].folded&&!G.players[i].eliminated);pots.push({amount,eligible})}prev=level}
 return pots;
}
function awardPots(){
 const pots=buildPots();let totalAwarded=0,summary=[];
 for(const pot of pots){if(!pot.eligible.length)continue;const scored=pot.eligible.map(i=>[i,evaluate([...G.players[i].hole,...G.board])]);const top=scored.reduce((best,x)=>!best||cmp(x[1],best[1])>0?x:best,null)[1];const winners=scored.filter(x=>cmp(x[1],top)===0).map(x=>x[0]);const share=Math.floor(pot.amount/winners.length);let rem=pot.amount-share*winners.length;winners.forEach(i=>G.players[i].stack+=share);const order=winners.slice().sort((a,b)=>((b-G.button+G.players.length)%G.players.length)-((a-G.button+G.players.length)%G.players.length));order.slice(0,rem).forEach(i=>G.players[i].stack++);totalAwarded+=pot.amount;summary.push(`${winners.map(i=>G.players[i].name).join(" & ")} ${winners.length>1?"split":"wins"} ${money(pot.amount)}`)}
 return summary;
}
function finish(){
 G.actionable=false;const alive=live();if(!alive.length)return;
 alive.forEach(p=>p.reveal=true);const summaries=awardPots();const scored=alive.map(p=>[p,evaluate([...p.hole,...G.board])]).sort((a,b)=>cmp(b[1],a[1]));
 log(`<b>Showdown:</b> ${scored.map(x=>`${x[0].name} — ${handName(x[1])}`).join(" · ")}`);summaries.forEach(s=>log(`<b>${s}</b>.`));G.handOver=true;
 $("status").textContent="Hand complete — start the next hand when ready.";render();
}
function render(){
 $("pot").textContent=`Pot ${money(G.pot)}`;$("street").textContent=G.street;
 $("community").innerHTML=G.board.map(c=>`<div class="card ${RED.has(c.s)?"red":""}">${cardText(c)}</div>`).join("");$("seats").innerHTML="";
 G.players.forEach((p,i)=>{const el=document.createElement("div");el.className=`seat s${i} ${p.folded?"folded":""} ${p.eliminated?"folded":""} ${G.actionable&&G.turn===i?"active":""}`;
 const cards=p.hole.map(c=>(i===0||p.reveal)?`<div class="card ${RED.has(c.s)?"red":""}">${cardText(c)}</div>`:`<div class="card back"></div>`).join("");
 const show=$("personalityEnabled").checked&&$("showPersonalities").checked&&i!==0&&!p.eliminated;const pl=show?`<div class="personality">${p.personality.icon} ${p.personality.name}</div>`:"";
 el.innerHTML=`<div class="box"><div class="name">${p.name}${i===G.button?" ◉":""}</div><div class="stack">${p.eliminated?"BUSTED":money(p.stack)}${p.allin?" · ALL-IN":""}</div>${pl}<div class="mini">${cards}</div></div>`;$(`seats`).appendChild(el)});
 if(G.turn===0&&G.actionable)showDecision();
}
$("newGame").onclick=setup;$("newHand").onclick=()=>newHand(false);
$("mode").onchange=()=>{$("modeDescription").textContent=MODES[$("mode").value];if(G.players.length)render()};
$("personalityEnabled").onchange=()=>{if(G.players.length)render()};$("showPersonalities").onchange=()=>{if(G.players.length)render()};
$("fold").onclick=()=>takeAction(0,"fold");$("checkCall").onclick=()=>takeAction(0,callAmount(0)?"call":"check");
$("raise").onclick=()=>takeAction(0,"raise",Math.max(0,+$("betAmount").value||G.bb));
$("allIn").onclick=()=>{if(G.players[0]&&!G.players[0].eliminated){takeAction(0,"raise",G.players[0].streetBet+G.players[0].stack)}};
window.addEventListener("error",e=>{$("status").textContent="Game error: "+e.message});setup();
