const $=id=>document.getElementById(id);
const RANKS="23456789TJQKA",SUITS=["♠","♥","♦","♣"],RED=new Set(["♥","♦"]);
const MODES={learning:"Approachable bots; personalities are intentionally readable and imperfect.",casual:"Loose opponents with noticeable mistakes.",standard:"Balanced opponents with sensible aggression.",tough:"Tighter ranges and stronger pressure.",expert:"The same personalities, but much more strategically coherent."};
const PERSONALITIES=[
{name:"The Nit",icon:"🧊",desc:"Ultra-selective. Folds almost everything marginal and rarely bluffs.",vpip:.13,agg:.20,bluff:.025,call:.18,tilt:.01,overbet:.05,trap:.08,patience:.95,timing:1.25},
{name:"Calling Station",icon:"📞",desc:"Hates folding. Calls too wide, chases too much, and almost never bluffs.",vpip:.82,agg:.10,bluff:.015,call:1.0,tilt:.18,overbet:.03,trap:.02,patience:.25,timing:.75},
{name:"The Maniac",icon:"🔥",desc:"Maximum pressure. Opens wide, barrels hard, bluffs relentlessly, and overbets.",vpip:.88,agg:1.0,bluff:.78,call:.25,tilt:.45,overbet:.85,trap:.03,patience:.12,timing:.55},
{name:"TAG",icon:"🎯",desc:"Tight-aggressive. Selective preflop, then attacks with credible strong ranges.",vpip:.24,agg:.78,bluff:.20,call:.32,tilt:.05,overbet:.18,trap:.18,patience:.82,timing:1.15},
{name:"LAG",icon:"⚡",desc:"Loose-aggressive. Plays many hands and applies pressure across streets.",vpip:.68,agg:.88,bluff:.52,call:.42,tilt:.22,overbet:.45,trap:.05,patience:.30,timing:.70},
{name:"The Gambler",icon:"🎲",desc:"Chases draws, overvalues pairs, and gets emotionally attached to big pots.",vpip:.78,agg:.62,bluff:.35,call:.88,tilt:.70,overbet:.55,trap:.01,patience:.18,timing:.45},
{name:"The Trapper",icon:"🪤",desc:"Patient and deceptive. Checks strong hands, then springs large raises over aggression.",vpip:.28,agg:.50,bluff:.24,call:.52,tilt:.02,overbet:.38,trap:.92,patience:.98,timing:1.45},
{name:"The Rock",icon:"🪨",desc:"Extremely risk-averse. Gives up easily and almost never takes thin spots.",vpip:.09,agg:.18,bluff:.01,call:.10,tilt:.005,overbet:.02,trap:.03,patience:1.0,timing:1.55},
{name:"Social Player",icon:"😎",desc:"Loose recreational style: curious, inconsistent, and occasionally creative.",vpip:.58,agg:.42,bluff:.28,call:.70,tilt:.30,overbet:.18,trap:.10,patience:.42,timing:.85},
{name:"The Explorer",icon:"🧭",desc:"Unpredictable. Mixes strange lines and frequencies rather than following a stable style.",vpip:.55,agg:.55,bluff:.48,call:.58,tilt:.38,overbet:.30,trap:.30,patience:.50,timing:.95}
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
 $("history").innerHTML="";
 let n=Math.max(2,Math.min(9,+$("playerCount").value||6)),stack=Math.max(100,+$("startingStack").value||1000);
 let sb=Math.max(1,+$("smallBlind").value||10),bb=Math.max(sb*2,+$("bigBlind").value||20);
 G={n,startingStack:stack,sb,bb,button:-1,hand:0,players:[],deck:[],board:[],pot:0,street:"",turn:-1,highest:0,actionable:false,acted:new Set(),contrib:[],raiseSize:bb,canRaise:new Set(),handOver:false,winners:[],lastActor:-1,lastAction:null,actionLog:[],teachPrev:null,decisionHistory:[]};
 $("modeDescription").textContent=MODES[$("mode").value];
 G.players=Array.from({length:n},(_,i)=>({name:i===0?"You":"Bot "+i,stack:stack,hole:[],folded:false,allin:false,eliminated:false,streetBet:0,reveal:false,noise:Math.random(),personality:pickPersonality(),lastThinkMs:null,lastActionAt:0,decisionCount:0}));
 newHand(true);
}
function newHand(isNewGame=false){
 if(!G.players?.length)return;
 if(!isNewGame && !G.handOver){
   $("status").textContent="Finish the current hand before starting a new one.";
   return;
 }
 if(!isNewGame){
   G.players.forEach(p=>{if(p.stack<=0)p.eliminated=true});
   if(G.players[0].eliminated){G.handOver=true;G.actionable=false;$("status").textContent="You are out of chips. Start a New Game to play again.";render();return}
   const active=activeIndices();
   if(active.length<2){G.handOver=true;G.actionable=false;$("status").textContent="You are the only player remaining — you win the session!";render();return}
 }
 G.hand++;G.winners=[];G.lastActor=-1;G.lastAction=null;G.actionLog=[];G.decisionHistory=[];G.teachPrev=null;G.deck=shuffle(makeDeck());G.board=[];G.pot=0;G.street="Preflop";G.highest=0;G.actionable=false;G.acted=new Set();G.canRaise=new Set(activeIndices());G.contrib=Array(G.players.length).fill(0);G.raiseSize=G.bb;G.handOver=false;
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
 const p=G.players[i],call=callAmount(i),oldHighest=G.highest;G.lastActor=i;
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
 G.lastAction={i,type,amount:type==="raise"?p.streetBet:call,street:G.street,pot:G.pot,highest:G.highest};
 G.actionLog.push({...G.lastAction});
 if(i===0){p.decisionCount=(p.decisionCount||0)+1;G.decisionHistory.push({...G.lastAction,heroStreetBet:p.streetBet,heroStack:p.stack});}
 if(i!==0&&p.lastThinkMs!=null)log(`${p.name} took ${(p.lastThinkMs/1000).toFixed(1)}s to decide.`);
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
function difficulty(){return{learning:.55,casual:.72,standard:.90,tough:1.05,expert:1.18}[$("mode").value]}
function botStrength(p){
 let e=evaluate([...p.hole,...G.board]),s=e[0]+(e[1]||0)/25,a=rank(p.hole[0]),b=rank(p.hole[1]);
 return s+(a+b)/30+(a===b?.7:0)+(p.hole[0].s===p.hole[1].s?.3:0)+(Math.abs(a-b)<=1?.2:0)
}
function handQuality(p){
 const a=rank(p.hole[0]),b=rank(p.hole[1]),pair=a===b,hi=Math.max(a,b),lo=Math.min(a,b),suited=p.hole[0].s===p.hole[1].s;
 if(pair)return .38+(hi-2)/30+(hi>=12?.18:0);
 return (hi>=14?.24:hi>=12?.16:hi>=10?.09:0)+(lo>=10?.08:0)+(suited?.07:0)+(hi-lo<=2?.05:0);
}
function timingRead(i){
 const p=G.players[i],actor=G.lastActor>=0?G.players[G.lastActor]:null;
 if(!actor||actor===p||actor.lastThinkMs==null)return 0;
 const ms=actor.lastThinkMs;
 const ap=actor.personality||PERSONALITIES[8];
 const expected=650+ap.patience*420;
 // Read hesitation relative to that player’s normal tempo.
 return Math.max(-.22,Math.min(.22,(ms-expected)/2800));
}
function botDecision(i){
 const p=G.players[i],per=$("personalityEnabled").checked?p.personality:PERSONALITIES[8],toCall=callAmount(i),skill=difficulty();
 const strength=botStrength(p),hq=handQuality(p),boardFactor=Math.min(1,G.board.length/5),potOdds=toCall/(G.pot+toCall||1);
 let effective=strength*skill+(p.noise-.5)*.8;
 if(G.street==="Preflop") effective += (hq-.25)*(2.7*per.vpip+1.2);
 else effective += boardFactor*.12;
 // Personality-specific tendencies are intentionally strong enough to be observable.
 effective += (per.call-.5)*.35 - (per.bluff<.08?.12:0);
 const read=timingRead(i)*(skill>.95?1.0:.45);
 effective += read;
 if(per.name==="The Gambler") effective += (Math.random()-.35)*.65;
 if(per.name==="The Trapper" && strength>3.0) effective -= .25;
 if(per.name==="The Trapper" && strength<2.2) effective += .08;
 if(per.name==="The Rock"||per.name==="The Nit") effective -= toCall>0?.18:0;
 if(per.name==="The Maniac") effective += .28;

 if(toCall>0){
   let fold=.60-effective*.16-potOdds*.52-(per.call-.5)*.58;
   fold=Math.max(.01,Math.min(.94,fold));
   if(per.name==="The Rock") fold=Math.min(.97,fold+.20);
   if(per.name==="The Nit") fold=Math.min(.95,fold+.14);
   if(per.name==="Calling Station") fold*=.16;
   if(per.name==="The Gambler") fold*=.55;
   if(Math.random()<fold&&!(strength>5.1&&Math.random()<.78))return["fold",0];
   let raiseChance=per.agg*.55+per.bluff*.22+(effective>3.0?.15:0)-potOdds*.16;
   if(per.name==="The Trapper"&&strength>3.2) raiseChance*=.45;
   raiseChance=Math.max(.01,Math.min(.92,raiseChance));
   if(Math.random()<raiseChance)return["raise",chooseRaiseTarget(i,Math.max(G.pot,G.bb)*(.35+per.agg*.62+per.overbet*.55))];
   return["call",0];
 }
 let betChance=per.agg*.48+per.bluff*.22+(effective>3.0?.16:0);
 if(per.name==="The Trapper"&&strength>3.2)betChance*=.35;
 if(per.name==="The Nit"&&strength<3.0)betChance*=.25;
 if(per.name==="The Rock"&&strength<3.8)betChance*=.35;
 betChance=Math.max(.005,Math.min(.94,betChance));
 if(Math.random()<betChance)return["raise",chooseRaiseTarget(i,Math.max(G.pot,G.bb)*(.32+per.agg*.55+per.overbet*.75))];
 return["check",0];
}
function chooseRaiseTarget(i,extra){
 const p=G.players[i],per=$("personalityEnabled").checked?p.personality:PERSONALITIES[8],min=G.highest?G.highest+G.raiseSize:G.bb;
 let multiplier=1;
 if(per.name==="The Maniac")multiplier=1.35+Math.random()*.65;
 else if(per.name==="The Trapper")multiplier=1.0+Math.random()*.45;
 else if(per.name==="The Rock"||per.name==="The Nit")multiplier=.72+Math.random()*.18;
 const target=Math.round(G.highest+Math.max(G.bb,extra*multiplier));
 return Math.min(p.streetBet+p.stack,Math.max(min,target));
}
function botThinkTime(i){
 const p=G.players[i],per=$("personalityEnabled").checked?p.personality:PERSONALITIES[8],skill=difficulty();
 const strength=botStrength(p),uncertainty=Math.max(0,1-Math.min(1,Math.abs(strength-3.0)/2.5));
 let base=320+Math.random()*420;
 base += uncertainty*(650*per.patience);
 base += per.patience*180;
 // Tougher bots deliberately randomize timing a little so timing is less reliable.
 if(skill>=1)base*=.88;
 const jitter=skill>=1?250:90;
 return Math.max(220,Math.round(base+(Math.random()-.5)*jitter));
}
function advanceBots(){
 if(!G.actionable)return;
 if(G.turn===0){showDecision();return}
 const i=G.turn,p=G.players[i],delay=botThinkTime(i),handId=G.hand;
 p.lastThinkMs=delay;
 $("status").textContent=`${p.name} is thinking…`;
 renderThinking(i,delay);
 setTimeout(()=>{if(G.hand!==handId||!G.actionable||G.turn!==i||G.turn===0)return;const[t,a]=botDecision(i);p.lastActionAt=Date.now();takeAction(i,t,a)},delay);
}
function renderThinking(i,ms){
 const el=document.querySelector(`.seat.s${i}`);if(el){el.classList.add("thinking");const box=el.querySelector(".box");if(box)box.dataset.think=`${ms>1150?"Hesitating · ":"Thinking · "}${(ms/1000).toFixed(1)}s`;}
}
function cardRanks(){return G.players[0].hole.map(rank)}
function currentHandInfo(){
 const cards=[...G.players[0].hole,...G.board],e=evaluate(cards),a=cardRanks().sort((x,y)=>y-x),boardRanks=G.board.map(rank),suits={};cards.forEach(c=>(suits[c.s]??=[]).push(rank(c)));
 const flushDraw=Object.values(suits).some(x=>x.length===4);
 const u=[...new Set(cards.map(rank))].sort((x,y)=>y-x);if(u.includes(14))u.push(1);
 let straightDraw=false;for(let i=0;i<=u.length-4;i++){const slice=u.slice(i,i+4);if(slice[0]-slice[3]<=4)straightDraw=true}
 const pair= e[0]===1||e[0]===2, made=handName(e);
 return {e,a,boardRanks,flushDraw,straightDraw,made,topPair:e[0]===1&&G.board.some(c=>rank(c)===a[0]),pair,high:a[0]||0};
}
function positionLabel(i=0){
 const ids=activeIndices(),pos=ids.indexOf(i);if(pos<0)return "out of position";
 if(ids.length===2)return i===G.button?"small blind / button":"big blind";
 const rel=(pos-ids.indexOf(G.button)+ids.length)%ids.length;
 if(rel===0)return "button";if(rel===1)return "small blind";if(rel===2)return "big blind";if(rel===ids.length-1)return "cutoff";return rel<=3?"early position":"middle position";
}
function boardDescription(info){
 if(!G.board.length)return "no community cards yet";
 const ranks=G.board.map(c=>c.r).join("");
 const paired=G.board.some((c,i)=>G.board.some((d,j)=>j>i&&d.r===c.r));
 return paired?`a paired board (${ranks})`:`${G.board.length===3?"a flop":G.board.length===4?"a turn":"a river"} (${ranks})`;
}
function opponentLabel(){
 const la=G.lastAction;if(!la||la.i===0)return null;const p=G.players[la.i];return p?`${p.name}${p.personality?` (${p.personality.name})`:""}`:null;
}
function timingComment(){
 const la=G.lastAction;if(!la||la.i===0||G.players[la.i].lastThinkMs==null)return "";
 const p=G.players[la.i],per=p.personality||PERSONALITIES[8],expected=650+per.patience*420,ratio=p.lastThinkMs/expected;
 if(ratio>1.55)return `${p.name} took ${(p.lastThinkMs/1000).toFixed(1)}s — noticeably longer than their usual tempo. Treat that as a possible sign of uncertainty, but not proof of weakness.`;
 if(ratio<.62)return `${p.name} acted very quickly (${(p.lastThinkMs/1000).toFixed(1)}s). Speed can indicate a routine decision; stronger bots will use it only as a small piece of evidence.`;
 return `${p.name}'s ${(p.lastThinkMs/1000).toFixed(1)}s decision is close to their normal tempo, so timing gives little information here.`;
}
function estimateEquity(trials=260){
 const hero=G.players[0],known=[...hero.hole,...G.board],deck=makeDeck().filter(c=>!known.some(k=>k.r===c.r&&k.s===c.s));let win=0,tie=0,n=0;
 for(let t=0;t<trials;t++){
  const d=shuffle(deck.slice()),opp=[d.pop(),d.pop()],run=[...G.board];while(run.length<5)run.push(d.pop());
  const h=evaluate([...hero.hole,...run]),o=evaluate([...opp,...run]),c=cmp(h,o);if(c>0)win++;else if(c===0)tie++;n++;
 }
 return (win+tie*.5)/n;
}
function teachingRangeNote(info){
 const la=G.lastAction;if(!la||la.i===0)return "No opponent action to interpret yet. Your starting point is mainly position and hand quality.";
 const p=G.players[la.i],per=p.personality||PERSONALITIES[8],name=per.name;
 if(la.type==="raise"){
  if(name==="The Nit"||name==="The Rock")return "Their raise deserves extra respect because this opponent's range is intentionally narrow.";
  if(name==="Calling Station")return "A raise is more meaningful from a Calling Station than one of their usual calls; don't assume their normal loose behavior means every raise is a bluff.";
  if(name==="The Maniac"||name==="LAG")return "Their wide aggressive range contains more bluffs and thin value than a conservative player's range.";
  if(name==="The Trapper")return "This opponent can slowplay strong hands, so their earlier passivity does not guarantee weakness.";
  if(name==="The Gambler")return "Their range can contain speculative hands and overplayed pairs, so the bet size alone is not enough to assume a monster.";
 }
 if(la.type==="call")return `A call removes some of ${p.name}'s weakest hands from consideration, but they can still have draws, pairs and weaker made hands.`;
 if(la.type==="check")return `${p.name} checked. That keeps many medium-strength and draw hands in their range; it does not automatically mean weakness.`;
 return "";
}
function recommendation(info,equity){
 const toCall=callAmount(0),pot=G.pot,odds=toCall/(pot+toCall||1),la=G.lastAction,mode=$("mode").value;
 if(G.handOver)return {label:"Hand complete",tone:"gold",reason:"Review the showdown and compare your decision with what the opponent actually showed."};
 if(!toCall){
  if(info.e[0]>=3)return {label:"Bet for value",tone:"good",reason:"You have a made hand strong enough to extract value; choose a size based on how coordinated the board is."};
  if(info.flushDraw||info.straightDraw)return {label:"Consider a small bet",tone:"good",reason:"Your draw can improve, and betting can sometimes win the pot immediately while building a pot for your strong outcomes."};
  if(info.e[0]===1&&info.topPair)return {label:"Usually bet small",tone:"good",reason:"Top pair can get value from worse pairs and draws without needing a huge bet."};
  return {label:"Check is reasonable",tone:"neutral",reason:"Your hand is not strong enough to value-bet automatically. Preserve the option to improve or react to the next card."};
 }
 if(equity>odds+.12)return {label:"Call comfortably",tone:"good",reason:`Your estimated equity is well above the ${(odds*100).toFixed(0)}% pot-odds threshold.`};
 if(equity>odds+.02)return {label:"Call is defensible",tone:"neutral",reason:`Your estimated equity is only modestly above the ${(odds*100).toFixed(0)}% threshold, so opponent range and future streets matter.`};
 if(equity<odds-.10)return {label:"Fold is preferred",tone:"bad",reason:`You need about ${(odds*100).toFixed(0)}% equity to call, and your current estimate is well below that.`};
 return {label:"Close decision",tone:"neutral",reason:`Your estimate is near the ${(odds*100).toFixed(0)}% pot-odds threshold. Opponent tendencies and implied odds can swing this decision.`};
}
function teachingText(){
 const info=currentHandInfo(),eq=analysisEquity(120),toCall=callAmount(0),odds=toCall/(G.pot+toCall||1),rec=recommendation(info,eq),pos=positionLabel(0),timing=timingComment(),opp=opponentLabel();
 const hand=`${info.made}${info.topPair?" · top pair":""}${info.flushDraw?" · flush draw":""}${info.straightDraw?" · straight possibility":""}`;
 let why=`You are in ${pos} with ${hand.toLowerCase()}. ${boardDescription(info)}.`;
 if(opp)why+=` ${teachingRangeNote(info)}`;
 if(toCall)why+=` The pot is ${money(G.pot)} and calling costs ${money(toCall)}, so you need about ${(odds*100).toFixed(0)}% equity.`;
 if(timing)why+=` ${timing}`;
 let changed="";
 if(G.teachPrev){const p=G.teachPrev;if(Math.abs(p.equity-eq)>.06)changed+=`Estimated equity moved from ${(p.equity*100).toFixed(0)}% to ${(eq*100).toFixed(0)}%. `;if(p.street!==G.street)changed+=`The new ${G.street.toLowerCase()} changed the decision context. `;if(p.toCall!==toCall)changed+=`The price to continue changed from ${money(p.toCall)} to ${money(toCall)}. `;if(p.lastActor!==G.lastAction?.i||p.lastType!==G.lastAction?.type)changed+=`New opponent action was added, so their likely range has changed.`;}
 G.teachPrev={equity:eq,street:G.street,toCall,lastActor:G.lastAction?.i,lastType:G.lastAction?.type};
 return `<div class="teach-head"><b>Coach · ${G.street}</b><span>Est. equity ${(eq*100).toFixed(0)}%</span></div><div class="teach-recommend ${rec.tone}"><b>${rec.label}</b><br>${rec.reason}</div><div class="teach-grid"><div><b>Situation</b><br>${why}</div><div><b>What changed</b><br>${changed||"This is the baseline for the current decision. As you and the opponents act, this section will update rather than repeating the same hand-strength advice."}</div></div><div class="teach-foot">Teaching note: equity is an estimate against a generic unseen hand, not a claim about the opponent's exact range. Expert bots can make more use of timing and personality.</div>`;
}
function showDecision(){
 const toCall=callAmount(0);$("status").textContent="Your turn.";$(`checkCall`).textContent=toCall?`Call ${money(toCall)}`:"Check";$(`raise`).textContent=G.highest?"Raise":"Bet";
 const min=G.highest?G.highest+G.raiseSize:G.bb;$(`betAmount`).min=min;$(`betAmount`).value=Math.min(Math.max(min,toCall+G.bb),G.players[0].streetBet+G.players[0].stack);
 $("decisionInfo").textContent=`Pot: ${money(G.pot)} · To call: ${money(toCall)}${toCall?` · Pot odds: ${(toCall/(G.pot+toCall)*100).toFixed(1)}% · Min raise to: ${money(min)}`:` · Min bet: ${money(G.bb)}`}`;
 if($(`mode`).value==="learning"){$("learningBox").innerHTML=teachingText()}else $("learningBox").textContent="";
}
function buildPots(){
 const levels=[...new Set(G.contrib.filter(x=>x>0))].sort((a,b)=>a-b),pots=[];let prev=0;
 for(const level of levels){const involved=G.players.map((p,i)=>G.contrib[i]>=level?i:-1).filter(i=>i>=0);const amount=(level-prev)*involved.length;if(amount>0){const eligible=involved.filter(i=>!G.players[i].folded&&!G.players[i].eliminated);pots.push({amount,eligible})}prev=level}
 return pots;
}
function awardPots(){
 G.winners=[];
 const pots=buildPots();let totalAwarded=0,summary=[];
 for(const pot of pots){if(!pot.eligible.length)continue;const scored=pot.eligible.map(i=>[i,evaluate([...G.players[i].hole,...G.board])]);const top=scored.reduce((best,x)=>!best||cmp(x[1],best[1])>0?x:best,null)[1];const winners=scored.filter(x=>cmp(x[1],top)===0).map(x=>x[0]);const share=Math.floor(pot.amount/winners.length);let rem=pot.amount-share*winners.length;winners.forEach(i=>{G.players[i].stack+=share;if(!G.winners.includes(i))G.winners.push(i)});const order=winners.slice().sort((a,b)=>((b-G.button+G.players.length)%G.players.length)-((a-G.button+G.players.length)%G.players.length));order.slice(0,rem).forEach(i=>G.players[i].stack++);totalAwarded+=pot.amount;summary.push(`${winners.map(i=>G.players[i].name).join(" & ")} ${winners.length>1?"split":"wins"} ${money(pot.amount)}`)}
 return summary;
}
function finish(){
 G.actionable=false;const alive=live();if(!alive.length)return;
 alive.forEach(p=>p.reveal=true);const summaries=awardPots();const scored=alive.map(p=>[p,evaluate([...p.hole,...G.board])]).sort((a,b)=>cmp(b[1],a[1]));
 log(`<b>Showdown:</b> ${scored.map(x=>`${x[0].name} — ${handName(x[1])}`).join(" · ")}`);summaries.forEach(s=>log(`<b>${s}</b>.`));G.handOver=true;
 const winnerNames=G.winners.map(i=>G.players[i].name).join(" & ");
 $("status").textContent=`🏆 ${winnerNames} won this hand!`;render();
}
function render(){
 $("pot").textContent=`Pot ${money(G.pot)}`;$("street").textContent=G.street;
 $("community").innerHTML=G.board.map(c=>`<div class="card ${RED.has(c.s)?"red":""}">${cardText(c)}</div>`).join("");$("seats").innerHTML="";
 G.players.forEach((p,i)=>{const el=document.createElement("div");el.className=`seat s${i} ${G.winners.includes(i)?"winner":""} ${p.folded?"folded":""} ${p.eliminated?"folded":""} ${G.actionable&&G.turn===i?"active":""}`;
 const cards=p.hole.map(c=>(i===0||p.reveal)?`<div class="card ${RED.has(c.s)?"red":""}">${cardText(c)}</div>`:`<div class="card back"></div>`).join("");
 const show=$("personalityEnabled").checked&&$("showPersonalities").checked&&i!==0&&!p.eliminated;const pl=show?`<div class="personality">${p.personality.icon} ${p.personality.name}</div>`:"";const timing=p.lastThinkMs!=null&&i!==0?`<div class="timing">Last decision: ${(p.lastThinkMs/1000).toFixed(1)}s</div>`:"";
 el.innerHTML=`<div class="box"><div class="win-badge">${G.winners.includes(i)?"🏆 WINNER":""}</div><div class="name">${p.name}${i===G.button?" ◉":""}</div><div class="stack">${p.eliminated?"BUSTED":money(p.stack)}${p.allin?" · ALL-IN":""}</div>${pl}${timing}<div class="mini">${cards}</div></div>`;$(`seats`).appendChild(el)});
 if(G.turn===0&&G.actionable)showDecision();
}
$("newGame").onclick=setup;$("newHand").onclick=()=>newHand(false);
$("mode").onchange=()=>{$("modeDescription").textContent=MODES[$("mode").value];if(G.players.length)render()};
$("personalityEnabled").onchange=()=>{if(G.players.length)render()};$("showPersonalities").onchange=()=>{if(G.players.length)render()};
$("fold").onclick=()=>takeAction(0,"fold");$("checkCall").onclick=()=>takeAction(0,callAmount(0)?"call":"check");
$("raise").onclick=()=>takeAction(0,"raise",Math.max(0,+$("betAmount").value||G.bb));
$("allIn").onclick=()=>{if(G.players[0]&&!G.players[0].eliminated){takeAction(0,"raise",G.players[0].streetBet+G.players[0].stack)}};
window.addEventListener("error",e=>{$("status").textContent="Game error: "+e.message});setup();

/* ===== Pocket Lab v4 Learning Layer ===== */
function v4RangeWidth(p){
 const per=p.personality||PERSONALITIES[8], pos=positionLabel(G.players.indexOf(p));
 let w=per.vpip+({"button":.20,"cutoff":.13,"middle position":.03,"early position":-.08,"small blind":.08,"big blind":.16}[pos]||0);
 if(per.name==="The Nit")w-=.04;if(per.name==="The Rock")w-=.08;if(per.name==="The Maniac")w+=.14;if(per.name==="Calling Station")w+=.12;if(per.name==="The Gambler")w+=.10;
 return Math.max(.05,Math.min(.92,w));
}
function v4RangeText(p){
 const w=v4RangeWidth(p),style=w<.22?"tight":w<.42?"moderate":w<.68?"wide":"very wide";
 const hands=w<.22?"premium pairs, strong aces and broadways":w<.42?"pairs, broadways, strong aces and selected suited connectors":w<.68?"many pairs, aces, broadways and suited connectors":"a very wide mix including weak aces and speculative suited hands";
 return `${p.name}'s likely starting range is <b>${style}</b> (${hands}).`;
}
function v4CoachFocus(){return $("trainingFocus")?.value||"free"}
function v4FocusHint(){const f=v4CoachFocus();const m={free:"Update your opponent's range after every action.",preflop:"Position changes how wide you can profitably enter the pot.",odds:"Compare the price you're being offered with the chance of improving or already being ahead.",ranges:"Think in ranges, not exact cards: what hands can realistically take this line?",value:"Before betting, name three worse hands that can call.",bluff:"Before bluffing, name the better hands you expect to fold and why your line is credible."};return m[f]||m.free}
function v4TeachingText(){
 const info=currentHandInfo(),eq=estimateEquity(350),toCall=callAmount(0),odds=toCall/(G.pot+toCall||1),pos=positionLabel(0);
 let rec=recommendation(info,eq), why=`You are in <b>${pos}</b>. Your hand is <b>${info.made.toLowerCase()}</b>${info.topPair?", with top pair":""}${info.flushDraw?", with a flush draw":""}${info.straightDraw?", with straight potential":""}.`;
 if(G.lastAction&&G.lastAction.i!==0){const p=G.players[G.lastAction.i];why+=`<br><br><b>Opponent range:</b> ${v4RangeText(p)} `;if(G.lastAction.type==="raise")why+=`Their raise shifts that range toward stronger hands, but the amount and personality determine how much.`;else if(G.lastAction.type==="call")why+=`Their call removes some very weak hands while keeping pairs, draws and medium-strength holdings.`;}
 if(toCall)why+=`<br><br><b>Price:</b> ${money(toCall)} to win a pot of ${money(G.pot)} → about <b>${(odds*100).toFixed(0)}%</b> required equity.`;
 const changed=G.teachPrev?(()=>{let a=[];if(G.teachPrev.street!==G.street)a.push(`new ${G.street.toLowerCase()} card`);if(G.teachPrev.toCall!==toCall)a.push(`price changed to ${money(toCall)}`);if(G.teachPrev.lastActor!==G.lastAction?.i||G.teachPrev.lastType!==G.lastAction?.type)a.push("new opponent information");return a.length?a.join(" + "):"no major new information"})():"baseline decision";
 G.teachPrev={equity:eq,street:G.street,toCall,lastActor:G.lastAction?.i,lastType:G.lastAction?.type};
 return `<div class="teach-head"><b>Coach · ${G.street}</b><span>Estimated equity ${Math.round(eq*100)}%</span></div><div class="teach-recommend ${rec.tone}"><b>${rec.label}</b><br>${rec.reason}</div><div class="teach-grid"><div><b>Why this decision?</b><br>${why}</div><div><b>What changed?</b><br>${changed}.<br><br><b>Training cue:</b> ${v4FocusHint()}</div></div><div class="range-summary"><b>Range principle</b><br>${G.lastAction&&G.lastAction.i!==0?v4RangeText(G.players[G.lastAction.i]):"No opponent has acted yet. Start with their position, personality and likely opening range."}</div><div class="teach-foot">Timing is a weak signal. Prioritize position, ranges, sizing, pot odds and the action history.</div>`;
}
function v4CoachStats(){return `<b>Training record</b><br>Hands played: ${G.hand||0} · Decisions made: ${G.players[0]?.decisionCount||0}<br>Current focus: ${v4CoachFocus()}`}
function v4Review(){if(!G.handOver){$("learningBox").innerHTML="<b>Finish the hand first.</b><br>Your review becomes meaningful once we have the full action and result.";return}const info=currentHandInfo();const result=G.winners.includes(0)?"You won — now check whether the decisions were profitable independently of the result.":"You lost this pot — that does not necessarily mean you played badly.";$("learningBox").innerHTML=`<div class="teach-head"><b>Hand Review</b><span>${handName(info.e)}</span></div><div class="teach-recommend gold"><b>${result}</b><br>${v4FocusHint()}</div><div class="range-summary"><b>What to review</b><br>1. Was your preflop range appropriate for position?<br>2. What range did each opponent represent after every action?<br>3. Did the pot odds justify continuing?<br>4. Could worse hands call when you bet?<br>5. Which new card or action most changed the decision?</div>`}
function v4ShowDecision(){
 const toCall=callAmount(0);$("status").textContent="Your turn.";$("checkCall").textContent=toCall?`Call ${money(toCall)}`:"Check";$("raise").textContent=G.highest?"Raise":"Bet";
 const min=G.highest?G.highest+G.raiseSize:G.bb;$("betAmount").min=min;$("betAmount").value=Math.min(Math.max(min,toCall+G.bb),G.players[0].streetBet+G.players[0].stack);
 $("decisionInfo").textContent=`Pot: ${money(G.pot)} · To call: ${money(toCall)}${toCall?` · Pot odds: ${(toCall/(G.pot+toCall)*100).toFixed(1)}% · Min raise to: ${money(min)}`:` · Min bet: ${money(G.bb)}`}`;
 if($("mode").value==="learning"){$("learningBox").innerHTML=v4TeachingText();$("coachStats").innerHTML=v4CoachStats()}else{$("learningBox").textContent="";$ ("coachStats").textContent=""}
}
showDecision=v4ShowDecision;
$("reviewHand").onclick=v4Review;$("trainingFocus").onchange=()=>{updateTraining&&updateTraining();if(G.actionable&&G.turn===0)showDecision()};
function updateTraining(){const f=v4CoachFocus(),n={free:"Free play",preflop:"Preflop & position",odds:"Pot odds & draws",ranges:"Reading ranges",value:"Value betting",bluff:"Bluffing & bluff-catching"};$("trainingProgress").innerHTML=`<b>${n[f]}</b><br>${v4FocusHint()}`}
updateTraining();

/* ===== Pocket Lab v6 Analysis Mode ===== */
MODES.analysis="Live tournament-style analysis: range-weighted equity, pot odds, action frequencies, and explicit reads.";
const _difficulty=difficulty;
difficulty=function(){return $("mode").value==="analysis"?1.18:_difficulty()};

// --- Range engine ---------------------------------------------------------
// Precompute the 1,326 unordered two-card combinations once. Rebuilding these
// combinations during every analysis render was a major source of lag in v5/v6.
const ALL_COMBOS=(()=>{const d=makeDeck(),out=[];for(let i=0;i<d.length;i++)for(let j=i+1;j<d.length;j++)out.push({cards:[d[i],d[j]],key:d[i].r+d[i].s+d[j].r+d[j].s});return out})();
const COMBO_CLASS=new Map();
for(const x of ALL_COMBOS){const [a,b]=x.cards;const ra=rank(a),rb=rank(b);const hi=Math.max(ra,rb),lo=Math.min(ra,rb);const cls=hi===lo?RANKS[hi-2]+RANKS[hi-2]:RANKS[hi-2]+RANKS[lo-2]+(a.s===b.s?'s':'o');x.cls=cls;(COMBO_CLASS.get(cls)||COMBO_CLASS.set(cls,[]).get(cls)).push(x)}
const RANGE_CACHE=new Map();
function classWeight(cls,p){
 const per=p?.personality||PERSONALITIES[8],pos=positionLabel(G.players.indexOf(p));
 const pair=cls.length===2,suited=cls.endsWith('s'),hi=RANK_INDEX[cls[0]],lo=RANK_INDEX[cls[1]],gap=hi-lo;
 let w=pair?.12+(hi/12)*.72:.03+(hi/12)*.32+(lo/12)*.18+(suited?.13:0)+(gap<=1?.10:gap===2?.06:gap===3?.025:0);
 const posBoost={"button":.24,"cutoff":.16,"middle position":.04,"early position":-.10,"small blind":.10,"big blind":.15}[pos]||0;
 w+=posBoost*(per.vpip>.5?1.15:.85);
 const mult={"The Nit":.58,"The Rock":.43,"The Maniac":1.45,"LAG":1.25,"Calling Station":1.18,"The Gambler":1.28,"The Trapper":.78,"TAG":.88}[per.name]||1;
 w*=mult;if(pair&&hi>=9)w+=.22;if(hi===12&&lo>=8)w+=.12;if(hi===11&&lo>=9)w+=.09;
 return Math.max(.001,Math.min(1,w));
}
function actionRangeFactor(p,cls){
 const la=G.lastAction;if(!la||la.i!==G.players.indexOf(p))return 1;
 const per=p?.personality||PERSONALITIES[8],pair=cls.length===2,suited=cls.endsWith('s'),hi=RANK_INDEX[cls[0]],lo=RANK_INDEX[cls[1]],premium=(pair&&hi>=9)||(hi>=11&&lo>=8),drawish=suited&&lo<=9&&hi-lo<=4;
 if(la.type==='raise'){
  let f=premium?1.8:drawish?.75+per.bluff*1.2:.38+per.bluff*.9;
  if(per.name==='The Nit'||per.name==='The Rock')f*=premium?1.25:.45;
  if(per.name==='The Maniac'||per.name==='LAG')f*=premium?1:1.5;
  if(per.name==='The Trapper'&&premium)f*=1.35;return f;
 }
 if(la.type==='call')return premium?1.25:drawish?1.35:1;
 if(la.type==='check')return premium?(per.trap>.5?1.35:.85):1;
 return 1;
}
function weightedOpponentCombos(p){
 const key=[G.hand,G.street,G.board.map(cardText).join(''),G.lastAction?.i,G.lastAction?.type,G.lastAction?.amount,p?.personality?.name,positionLabel(G.players.indexOf(p))].join('|');
 if(RANGE_CACHE.has(key))return RANGE_CACHE.get(key);
 const known=new Set([...G.players[0].hole,...G.board].map(cardText)),out=[];
 // Include cards already held by other opponents as unavailable when constructing
 // a candidate range. Their exact holdings are unknown, so this is only a small
 // correction; the sampled equity loop enforces cross-opponent card uniqueness.
 for(const x of ALL_COMBOS){if(x.cards.some(c=>known.has(cardText(c))))continue;const w=classWeight(x.cls,p)*actionRangeFactor(p,x.cls);if(w>.001)out.push({cards:x.cards,weight:w,cls:x.cls})}
 RANGE_CACHE.set(key,out);return out;
}
function sampleWeighted(arr){if(!arr.length)return null;let total=0;for(const x of arr)total+=x.weight;let r=Math.random()*total;for(const x of arr){r-=x.weight;if(r<=0)return x.cards}return arr[arr.length-1].cards}
function rangeForOpponent(i){return weightedOpponentCombos(G.players[i])}
function analysisEquity(trials=220){
 const hero=G.players[0];if(!hero.hole.length)return .5;
 const opps=activeIndices().filter(i=>i!==0&&!G.players[i].folded&&!G.players[i].eliminated);if(!opps.length)return 1;
 const known=[...hero.hole,...G.board],knownSet=new Set(known.map(cardText)),ranges=opps.map(rangeForOpponent),deck=makeDeck();let win=0,tie=0,n=0;
 for(let t=0;t<trials;t++){
  const used=new Set(knownSet),hands=[],order=ranges.map((r,i)=>({i,r})).sort((a,b)=>a.r.length-b.r.length);let failed=false;
  for(const {r} of order){const candidates=r.filter(x=>!x.cards.some(c=>used.has(cardText(c))));const h=sampleWeighted(candidates);if(!h){failed=true;break}hands.push(h);h.forEach(c=>used.add(cardText(c)))}
  if(failed)continue;
  const run=[...G.board],d=shuffle(deck.filter(c=>!used.has(cardText(c))));while(run.length<5&&d.length)run.push(d.pop());if(run.length<5)continue;
  const he=evaluate([...hero.hole,...run]);let best=0,tied=0;
  for(const h of hands){const c=cmp(he,evaluate([...h,...run]));if(c<0){best=-1;break}if(c===0)tied++}
  if(best>0||best===0&&tied===hands.length)win++;else if(best===0)tie++;n++;
 }
 return n?(win+tie*.5)/n:.5;
}
function analysisRangeStats(p){const arr=weightedOpponentCombos(p),total=arr.reduce((s,x)=>s+x.weight,0),premium=arr.filter(x=>{const e=evaluate(x.cards);return e[0]>=1&&Math.max(rank(x.cards[0]),rank(x.cards[1]))>=11}).reduce((s,x)=>s+x.weight,0);return {n:arr.length,pct:Math.min(.95,total/22),premium:total?premium/total:0}}
function analysisActionProb(eq){
 const toCall=callAmount(0),pot=G.pot,odds=toCall/(pot+toCall||1),info=currentHandInfo(),pos=positionLabel(0),la=G.lastAction;
 let fold,call,raise;
 const aggression=la&&la.i!==0?(G.players[la.i].personality?.agg||.5):.5;
 if(toCall){fold=Math.max(.015,Math.min(.92,(odds-eq)*2.05+.13));call=Math.max(.04,.28+(eq-odds)*1.85+(info.e[0]>=2?.08:0));raise=Math.max(.015,.12+(eq-.35)*.55+(info.e[0]>=3?.12:0)+aggression*.06);if(pos==='button')raise+=.04;const sum=fold+call+raise;return {fold:fold/sum,call:call/sum,raise:raise/sum}}
 raise=Math.max(.03,Math.min(.88,.10+(eq-.30)*.72+(info.e[0]>=3?.14:0)+aggression*.07));return {check:1-raise,raise};
}
function pct(x){return Math.round(x*100)+'%'}
function probRows(probs){return Object.entries(probs).map(([k,v])=>`<div class="prob-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><div class="prob-track"><div class="prob-fill" style="width:${Math.round(v*100)}%"></div></div><strong>${pct(v)}</strong></div>`).join('')}
function analysisOpponentRead(){
 const la=G.lastAction;if(!la||la.i===0)return `<span class="analysis-muted">No opponent action yet. The read starts with position and personality-adjusted starting ranges.</span>`;
 const p=G.players[la.i],stats=analysisRangeStats(p),timing=timingComment();
 const interpretation=la.type==='raise'?`The raise concentrates the range toward stronger made hands and credible draws, but aggressive personalities retain more bluffs.`:la.type==='call'?`The call removes many very weak hands while retaining pairs, draws and medium-strength holdings.`:la.type==='check'?`The check keeps a broad range; it is not evidence that the player has nothing.`:`The fold removes this player from the active range.`;
 return `<b>${p.name} ${la.type}${la.type==='raise'?`d to ${money(la.amount)}`:''}.</b> ${interpretation}<br><span class="analysis-muted">Estimated range: ${Math.round(stats.pct*100)}% of starting hands · ${stats.n} available combinations · ${Math.round(stats.premium*100)}% weighted toward premium-ish holdings.</span>${timing?`<div class="analysis-note">${timing}</div>`:''}`;
}
function analysisPanel(){
 if(!G.players?.length)return '';
 const eq=analysisEquity(180),probs=analysisActionProb(eq),toCall=callAmount(0),odds=toCall/(G.pot+toCall||1),info=currentHandInfo(),best=Object.entries(probs).sort((a,b)=>b[1]-a[1])[0],actionLabel=best[0]==='raise'?(G.highest?'Raise':'Bet'):best[0][0].toUpperCase()+best[0].slice(1);
 return `<div class="analysis-head"><b>📡 Live Analysis</b><span class="analysis-muted">${G.street} · range-weighted</span></div><div class="analysis-card"><b>What the table sees</b><br>${analysisOpponentRead()}<br><br><b>Your situation</b><br>${positionLabel(0)} · ${info.made}${info.flushDraw?' · flush draw':''}${info.straightDraw?' · straight potential':''} · Pot ${money(G.pot)}${toCall?` · Call ${money(toCall)}`:''}</div><div class="analysis-grid"><div class="analysis-card"><b>Estimated equity</b><div style="font-size:25px;font-weight:800">${pct(eq)}</div>${toCall?`You need <b>${pct(odds)}</b> equity to call.`:'No call is required.'}</div><div class="analysis-card"><b>Recommended action mix</b>${probRows(probs)}</div></div><div class="analysis-card"><div class="analysis-optimal">Highest-weight action: ${actionLabel} · ${pct(best[1])}</div><div class="analysis-muted">This is a range-weighted heuristic, not a GTO solver. The probabilities represent the model's preferred mix, not guaranteed outcomes.</div></div>`;
}
const _render=render;
render=function(){_render();if($("mode")?.value==="analysis")$("analysisBox").innerHTML=analysisPanel();else if($("analysisBox"))$("analysisBox").innerHTML="";};
const _showDecision=showDecision;
showDecision=function(){_showDecision();if($("mode").value==="analysis"){$("learningBox").innerHTML="";$("coachStats").innerHTML="";$('analysisBox').innerHTML=analysisPanel();}};
$("reviewHand").onclick=v4Review;
$("trainingFocus").onchange=()=>{updateTraining&&updateTraining();if(G.actionable&&G.turn===0)showDecision()};
$("mode").onchange=()=>{$("modeDescription").textContent=MODES[$("mode").value];if(G.players.length)render()};
