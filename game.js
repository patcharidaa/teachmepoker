const $=id=>document.getElementById(id);
const RANKS="23456789TJQKA", SUITS=["♠","♥","♦","♣"], RED=new Set(["♥","♦"]);
const MODE_TEXT={
 learning:"Bots are intentionally approachable and the trainer explains your decisions.",
 casual:"Bots make simple, human-like mistakes and play relatively loose.",
 standard:"Balanced opponents with basic range, pot-odds and aggression heuristics.",
 tough:"Stronger opponents: tighter ranges, better value betting and more pressure.",
 expert:"The strongest simulation: tighter ranges, position awareness and more disciplined aggression."
};
let G={};

function deck(){let d=[];for(const r of RANKS)for(const s of SUITS)d.push({r,s});return d}
function shuffle(d){for(let i=d.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function rv(c){return RANKS.indexOf(c.r)+2}
function key(c){return c.r+c.s}
function fmt(n){return "$"+Math.round(n).toLocaleString()}
function log(s){$("history").innerHTML+=`<div>${s}</div>`;$("history").scrollTop=$("history").scrollHeight}
function handName(e){return ["High card","Pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"][e[0]]}

function evaluate(cs){
 let a=cs.map(c=>rv(c.r)).sort((x,y)=>y-x), counts={};a.forEach(v=>counts[v]=(counts[v]||0)+1);
 let bySuit={};cs.forEach(c=>(bySuit[c.s]??=[]).push(rv(c.r)));
 let flush=Object.values(bySuit).find(x=>x.length>=5);
 let uniq=[...new Set(a)];if(uniq.includes(14))uniq.push(1);
 let straight=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break}
 if(flush){let u=[...new Set(flush)].sort((x,y)=>y-x);if(u.includes(14))u.push(1);for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4)return [8,u[i]]}
 let groups=Object.entries(counts).map(([v,n])=>({v:+v,n})).sort((x,y)=>y.n-x.n||y.v-x.v);
 let q=groups.find(g=>g.n===4), t=groups.filter(g=>g.n>=3).map(g=>g.v), p=groups.filter(g=>g.n>=2).map(g=>g.v);
 if(q)return [7,q.v,...a.filter(x=>x!==q.v).slice(0,1)];
 if(t.length>=1&&(t.length>=2||p.some(x=>x!==t[0])))return [6,t[0],(t[1]||p.find(x=>x!==t[0]))];
 if(flush)return [5,...[...flush].sort((x,y)=>y-x).slice(0,5)];
 if(straight)return [4,straight];
 if(t.length)return [3,t[0],...a.filter(x=>x!==t[0]).slice(0,2)];
 if(p.length>=2){let pp=[...new Set(p)].sort((x,y)=>y-x);return [2,pp[0],pp[1],...a.filter(x=>x!==pp[0]&&x!==pp[1]).slice(0,1)]}
 if(p.length)return [1,p[0],...a.filter(x=>x!==p[0]).slice(0,3)];
 return [0,...a.slice(0,5)]
}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){let x=a[i]??0,y=b[i]??0;if(x!==y)return x-y}return 0}

function setupGame(){
 let n=Math.max(2,Math.min(9,+$("playerCount").value)), stack=Math.max(100,+$("startingStack").value);
 let sb=Math.max(1,+$("smallBlind").value),bb=Math.max(sb*2,+$("bigBlind").value);
 G={n,stack,sb,bb,button:-1,hand:0,players:[],deck:[],board:[],pot:0,street:"",turn:0,highest:0,contrib:[],actionable:false};
 $("modeDescription").textContent=MODE_TEXT[$("mode").value];
 newHand(true);
}
function newHand(first=false){
 if(!first && G.players.length){
   // Keep the existing stacks; a new game resets them.
 }
 G.hand++;G.deck=shuffle(deck());G.board=[];G.pot=0;G.street="Preflop";G.highest=0;G.contrib=Array(G.n).fill(0);G.actionable=false;
 G.button=(G.button+1)%G.n;
 G.players=Array.from({length:G.n},(_,i)=>({name:i===0?"You":"Bot "+i,stack:G.stack,hole:[],folded:false,allin:false,streetBet:0,reveal:false,personality:Math.random()}));
 for(let r=0;r<2;r++)for(let i=0;i<G.n;i++)G.players[i].hole.push(G.deck.pop());
 const sbPos=(G.button+1)%G.n,bbPos=(G.button+2)%G.n;
 put(sbPos,G.sb);put(bbPos,G.bb);G.highest=G.bb;
 G.turn=next(G.button+2);
 log(`<b>Hand #${G.hand}</b> — ${G.n} players, blinds ${fmt(G.sb)}/${fmt(G.bb)}.`);
 $("status").textContent="Bots are thinking…";render();runBotsUntilHuman();
}
function put(i,amount){
 const p=G.players[i],x=Math.min(amount,p.stack);p.stack-=x;G.contrib[i]+=x;p.streetBet+=x;G.pot+=x;if(p.stack===0)p.allin=true;
}
function next(i){
 for(let k=1;k<=G.n;k++){let j=(i+k)%G.n,p=G.players[j];if(!p.folded&&!p.allin&&p.stack>0)return j}return -1;
}
function active(){return G.players.filter(p=>!p.folded)}
function callAmount(i){return Math.max(0,G.highest-G.contrib[i])}
function roundComplete(){
 const live=G.players.filter(p=>!p.folded&&!p.allin);
 return live.length===0 || live.every(p=>p.streetBet===G.highest);
}
function action(i,type,amount=0){
 if(!G.actionable||G.turn!==i)return;
 const p=G.players[i],call=callAmount(i);
 if(type==="fold"){p.folded=true;log(`${p.name} folds.`)}
 else if(type==="check"){if(call>0)return;log(`${p.name} checks.`)}
 else if(type==="call"){put(i,call);log(`${p.name} calls ${fmt(call)}.`)}
 else if(type==="raise"){
   let target=Math.max(G.highest+amount,G.bb,G.contrib[i]+call);
   let add=Math.min(p.stack,target-G.contrib[i]);put(i,add);G.highest=Math.max(G.highest,G.contrib[i]);
   log(`${p.name} ${G.highest>G.bb?"raises":"bets"} to ${fmt(G.contrib[i])}.`);
 }
 if(active().length===1){endHand();return}
 if(roundComplete()){nextStreet();return}
 G.turn=next(i);
 if(G.turn<0){nextStreet();return}
 G.actionable=true;render();runBotsUntilHuman();
}
function nextStreet(){
 G.actionable=false;G.players.forEach(p=>p.streetBet=0);G.contrib=Array(G.n).fill(0);G.highest=0;
 if(G.street==="Preflop"){G.board.push(G.deck.pop(),G.deck.pop(),G.deck.pop());G.street="Flop"}
 else if(G.street==="Flop"){G.board.push(G.deck.pop());G.street="Turn"}
 else if(G.street==="Turn"){G.board.push(G.deck.pop());G.street="River"}
 else {endHand();return}
 G.turn=next(G.button);G.actionable=true;
 log(`<b>${G.street}</b>`);
 render();runBotsUntilHuman();
}
function strength(p){
 const e=evaluate([...p.hole,...G.board]);
 let base=e[0]+(e[1]||0)/30;
 if(G.board.length<5){
   const ranks=p.hole.map(rv), suited=p.hole[0].s===p.hole[1].s, gap=Math.abs(ranks[0]-ranks[1]);
   base+=(ranks.reduce((a,b)=>a+b,0)-8)/18+(suited?.25:0)+(gap<=1?.25:0);
 }
 return base;
}
function botProfile(){
 const m=$("mode").value;
 return {learning:[.28,.20],casual:[.42,.27],standard:[.52,.20],tough:[.64,.14],expert:[.74,.08]}[m];
}
function botDecision(i){
 const p=G.players[i],toCall=callAmount(i),s=strength(p),[agg,error]=botProfile();
 const noise=(p.personality-.5)*error*3;
 const effective=s+noise;
 const potOdds=toCall?toCall/(G.pot+toCall):0;
 let foldChance;
 if(toCall===0)foldChance=0;
 else foldChance=Math.max(0,Math.min(.82,.72-effective*.12-potOdds*.55));
 if(Math.random()<foldChance)return ["fold",0];
 if(toCall>0){
   if(effective>4.2 || (effective>2.3&&Math.random()<agg))return ["raise",Math.max(G.bb,Math.round(G.pot*(.45+agg*.5)))];
   return ["call",0];
 }
 if(effective>3.1 || Math.random()<agg*.28)return ["raise",Math.max(G.bb,Math.round(Math.max(G.pot,G.bb)*(.4+agg*.5)))];
 return ["check",0];
}
function runBotsUntilHuman(){
 if(!G.actionable||G.turn===0){if(G.turn===0){$("status").textContent="Your turn.";showDecision()}return}
 setTimeout(()=>{if(G.actionable&&G.turn!==0){let [t,a]=botDecision(G.turn);action(G.turn,t,a)}},350+Math.random()*650);
}
function showDecision(){
 if(G.turn!==0)return;
 const toCall=callAmount(0),potOdds=toCall?(toCall/(G.pot+toCall)*100):0;
 $("checkCall").textContent=toCall?`Call ${fmt(toCall)}`:"Check";
 $("raise").textContent=G.highest?"Raise":"Bet";
 $("betAmount").value=Math.max(G.bb,toCall+G.bb);
 $("decisionInfo").textContent=`Pot: ${fmt(G.pot)} · To call: ${fmt(toCall)}${toCall?` · Pot odds: ${potOdds.toFixed(1)}%`:""}`;
 if($("mode").value==="learning"){
   const s=strength(G.players[0]),desc=s>4.5?"very strong":s>3.2?"strong":s>2.2?"medium":"weak";
   $("learningBox").textContent=`Learning cue: your current hand/board scores as roughly “${desc}.” That is only a heuristic; position, ranges and future cards matter.`;
 }else $("learningBox").textContent="";
}
function endHand(){
 G.actionable=false;
 const alive=active(),scored=alive.map(p=>[p,evaluate([...p.hole,...G.board])]).sort((a,b)=>cmp(b[1],a[1]));
 scored.forEach(x=>x[0].reveal=true);
 const top=scored[0][1],winners=scored.filter(x=>cmp(x[1],top)===0).map(x=>x[0]);
 const share=Math.floor(G.pot/winners.length);winners.forEach(p=>p.stack+=share);
 log(`<b>Showdown:</b> ${scored.map(x=>`${x[0].name} — ${handName(x[1])}`).join(" · ")}`);
 log(`<b>${winners.map(p=>p.name).join(" & ")}</b> ${winners.length>1?"split":"wins"} ${fmt(share)}.`);
 $("status").textContent=`${winners.map(p=>p.name).join(" & ")} ${winners.length>1?"split":"wins"} the pot.`;
 render();
}
function render(){
 $("pot").textContent=`Pot ${fmt(G.pot)}`;$("street").textContent=G.street;
 $("community").innerHTML=G.board.map(c=>`<div class="card ${RED.has(c.s)?"red":""}">${key(c)}</div>`).join("");
 $("seats").innerHTML="";
 G.players.forEach((p,i)=>{
  const el=document.createElement("div");el.className=`seat s${i} ${p.folded?"folded":""} ${G.actionable&&G.turn===i?"active":""}`;
  const cards=p.hole.map(c=>(i===0||p.reveal)?`<div class="card ${RED.has(c.s)?"red":""}">${key(c)}</div>`:`<div class="card back"></div>`).join("");
  el.innerHTML=`<div class="box"><div class="name">${p.name}${i===G.button?" ◉":""}</div><div class="stack">${fmt(p.stack)}${p.allin?" · ALL-IN":""}</div><div class="mini">${cards}</div></div>`;
  $("seats").appendChild(el);
 });
 $("decisionPanel").style.opacity=G.actionable&&G.turn===0?1:.72;
 if(G.actionable&&G.turn===0)showDecision();
}
$("newGame").onclick=setupGame;
$("newHand").onclick=()=>newHand();
$("mode").onchange=()=>{$("modeDescription").textContent=MODE_TEXT[$("mode").value];if(G.players.length)render()};
$("fold").onclick=()=>action(0,"fold");
$("checkCall").onclick=()=>action(0,callAmount(0)?"call":"check");
$("raise").onclick=()=>action(0,"raise",Math.max(1,+$("betAmount").value));
$("allIn").onclick=()=>{const p=G.players[0];$("betAmount").value=p.stack+callAmount(0);};
setupGame();
