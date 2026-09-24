
let ws,S,me=null,err='',dl=0,off=false,copied=false;
try{me=JSON.parse(localStorage.getItem('sos')||'null')}catch(e){localStorage.removeItem('sos');me=null}
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tx=m=>ws&&ws.readyState===1&&ws.send(JSON.stringify(m)),val=id=>document.getElementById(id)?.value||'';
const nm=id=>esc(S.players.find(p=>p.id===id)?.name||'?');
function conn(){
  ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
  ws.onopen=()=>{off=false;if(me)tx({t:'resume',code:me.code,token:me.token});render()};
  ws.onmessage=e=>{const m=JSON.parse(e.data);
    if(m.t==='joined'){me={code:m.code,token:m.token};localStorage.sos=JSON.stringify(me);err=''}
    else if(m.t==='state'){S=m;dl=Date.now()+m.left;err=''}
    else if(m.t==='err'){if(m.msg==='resume-fail'){me=null;S=null;localStorage.removeItem('sos')}else err=m.msg}
    render()};
  ws.onerror=()=>{off=true;err='Could not connect to the game server. Make sure npm start is still running.';render()};
  ws.onclose=()=>{off=true;render();setTimeout(conn,1200)};
}
function render(){
  const keep={};document.querySelectorAll('input').forEach(i=>keep[i.id]=i.value);const f=document.activeElement&&document.activeElement.id;
  $('#app').innerHTML=(off?'<div class="off">Reconnecting…</div>':'')+(S?game():home());
  for(const k in keep){const i=document.getElementById(k);if(i&&keep[k])i.value=keep[k]}
  if(f){const i=document.getElementById(f);i&&i.focus()}
}
setInterval(()=>{const e=$('#tm');if(e)e.textContent=Math.max(0,Math.ceil((dl-Date.now())/1000))},250);
const mk=()=>tx({t:'create',name:val('nm')}),jn=()=>tx({t:'join',name:val('nm'),code:val('cd')});
const leave=()=>{localStorage.removeItem('sos');location.href='/'};

const spyArt=()=>`<svg viewBox="0 0 420 210" role="img" aria-label="Spy silhouette illustration">
<defs><linearGradient id="coat" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#27364b"/></linearGradient>
<linearGradient id="red" x1="0" x2="1"><stop stop-color="#ff3d5a"/><stop offset="1" stop-color="#b81735"/></linearGradient></defs>
<circle cx="210" cy="92" r="76" fill="#111a28" stroke="#31445d" stroke-width="2"/>
<path d="M146 184c9-50 33-75 64-75s55 25 64 75z" fill="url(#coat)"/>
<circle cx="210" cy="83" r="36" fill="#c69a78"/>
<path d="M174 79c4-37 68-42 75 0-21-10-48-10-75 0z" fill="#111"/>
<path d="M170 70h80l-7 22h-66z" fill="#0b111a"/>
<path d="M173 73h74" stroke="#ff3d5a" stroke-width="5"/>
<circle cx="192" cy="83" r="4" fill="#59c8ff"/><circle cx="228" cy="83" r="4" fill="#59c8ff"/>
<path d="M183 112q27 16 54 0" fill="none" stroke="#1c2533" stroke-width="4"/>
<path d="M115 175h-44M349 175h-44" stroke="#e8bd58" stroke-width="2" stroke-dasharray="6 8"/>
<circle cx="58" cy="175" r="4" fill="#e8bd58"/><circle cx="362" cy="175" r="4" fill="#e8bd58"/>
<path d="M104 37l13 13M316 37l-13 13" stroke="#ff3d5a" stroke-width="3" opacity=".7"/>
</svg>`;

const dossierArt=()=>`<svg viewBox="0 0 300 120" role="img" aria-label="Classified dossier illustration">
<rect x="30" y="20" width="240" height="82" rx="8" fill="#e9dfc5" stroke="#b6a987" stroke-width="3"/>
<path d="M48 44h110M48 57h155M48 70h92" stroke="#4b463a" stroke-width="5" opacity=".55"/>
<circle cx="222" cy="61" r="25" fill="none" stroke="#b81735" stroke-width="4" opacity=".75"/>
<path d="M205 61l12 12 23-28" fill="none" stroke="#b81735" stroke-width="4"/>
<text x="150" y="92" text-anchor="middle" font-family="monospace" font-weight="900" font-size="11" fill="#b81735" opacity=".75">CLASSIFIED</text>
</svg>`;


const agentArt=()=>`<svg viewBox="0 0 500 300" role="img" aria-label="Original spy agent illustration">
<defs><linearGradient id="jacket" x1="0" x2="1"><stop stop-color="#0b111b"/><stop offset="1" stop-color="#26364a"/></linearGradient><linearGradient id="tie" x1="0" x2="1"><stop stop-color="#ff3655"/><stop offset="1" stop-color="#9e1230"/></linearGradient></defs>
<circle cx="250" cy="142" r="112" fill="#09111b" stroke="#2e425b" stroke-width="2"/>
<path d="M151 273c14-77 51-112 99-112s85 35 99 112z" fill="url(#jacket)" stroke="#34475f" stroke-width="2"/>
<path d="M211 181l39 58 39-58-18-25h-42z" fill="#e6dcc2"/><path d="M239 190l11 49 11-49-11-13z" fill="url(#tie)"/>
<circle cx="250" cy="120" r="51" fill="#c99b79"/><path d="M198 119c3-55 101-62 105 0-25-15-75-15-105 0z" fill="#090d13"/>
<path d="M201 111h98l-5 25h-88z" fill="#0a1018"/><path d="M205 116h90" stroke="#ff3655" stroke-width="6"/>
<circle cx="226" cy="126" r="4" fill="#56bdf5"/><circle cx="274" cy="126" r="4" fill="#56bdf5"/>
<path d="M226 157q24 14 48 0" fill="none" stroke="#6e4e3e" stroke-width="4"/>
<path class="scan" d="M55 50h390M55 255h390" stroke="#e8b94f" stroke-width="1" stroke-dasharray="8 12" opacity=".45"/>
<text x="250" y="36" text-anchor="middle" fill="#e8b94f" font-family="monospace" font-size="12" font-weight="900" letter-spacing="4">OPERATION: SPY</text>
</svg>`;

const shieldArt=()=>`<svg viewBox="0 0 100 80"><path d="M50 7l35 13v20c0 18-12 29-35 36C27 69 15 58 15 40V20z" fill="#101b2a" stroke="#46d99b" stroke-width="4"/><path d="M30 41l12 12 28-31" fill="none" stroke="#46d99b" stroke-width="6"/></svg>`;
const eyeArt=()=>`<svg viewBox="0 0 100 80"><path d="M8 40Q50 4 92 40Q50 76 8 40z" fill="#101b2a" stroke="#56bdf5" stroke-width="4"/><circle cx="50" cy="40" r="13" fill="#56bdf5"/><circle cx="50" cy="40" r="5" fill="#07101a"/></svg>`;
const voteArt=()=>`<svg viewBox="0 0 100 80"><path d="M22 12h56v56H22z" fill="#101b2a" stroke="#e8b94f" stroke-width="4"/><path d="M33 42l11 11 24-27" fill="none" stroke="#ff3655" stroke-width="6"/></svg>`;
const rulesModal=()=>`<div class="modal" id="rulesModal"><div class="modalBox"><button class="close" onclick="closeRules()">Close</button><div class="eyebrow">FIELD MANUAL · SPY / SAFE</div><h2>How to play</h2><p class="dim">Five fast rounds. One hidden Spy. One secret word. Your job is to sound convincing without giving the word away.</p>
<div class="rules">
<div class="rule"><span class="num">01</span><br><b>Receive a role</b><br><span class="dim">Safe players see the secret word. The Spy sees only the category.</span></div>
<div class="rule"><span class="num">02</span><br><b>Give one clue</b><br><span class="dim">Keep it short. Too obvious helps the Spy; too vague makes you suspicious.</span></div>
<div class="rule"><span class="num">03</span><br><b>Read the room</b><br><span class="dim">Compare every clue and watch for the player who sounds like they're fishing.</span></div>
<div class="rule"><span class="num">04</span><br><b>Vote</b><br><span class="dim">Everyone chooses one suspect. The most-voted player is caught if there is a unique majority.</span></div>
<div class="rule"><span class="num">05</span><br><b>Final guess</b><br><span class="dim">A caught Spy gets one shot at the secret word. Correct means the Spy steals the round.</span></div>
<div class="rule"><span class="num">06</span><br><b>Score</b><br><span class="dim">Spy escapes: +3. Spy caught and guesses correctly: +2. Each Safe player who votes the Spy: +2.</span></div>
</div>
<div class="card"><b>2-player Duel</b><p class="dim">With exactly two players, the game switches to a dedicated 1v1 variant so the match stays playable and competitive.</p></div>
<button class="pri" onclick="closeRules()">Ready for the mission</button></div></div>`;
function openRules(){document.body.insertAdjacentHTML('beforeend',rulesModal())}
function closeRules(){document.getElementById('rulesModal')?.remove()}
function home(){
 const q=String(new URLSearchParams(location.search).get('room')||'').toUpperCase().trim();
 const message=(typeof err==='string' && err.trim())?`<p class="err">${esc(err)}</p>`:'';
 return `<div class="hero">
  <div class="heroTop"><span class="tag"><span class="live"></span> LIVE · 2–8 AGENTS</span><span class="tag">NO LOGIN</span></div>
  <div class="heroGrid"><div class="heroCopy">
   <div class="eyebrow">CLASSIFIED PARTY GAME</div><h1>Spy<i>/</i>or Safe</h1>
   <p class="dim">Blend in. Read the clues. Catch the undercover player before they crack the word.</p>
   <div class="kpis"><div class="kpi"><b>2–8</b><span>PLAYERS</span></div><div class="kpi"><b>5</b><span>ROUNDS</span></div><div class="kpi"><b>1</b><span>SECRET SPY</span></div></div>
  </div><div class="art">${agentArt()}</div></div>

  <div class="joinPanel">
    <div class="field"><label>AGENT NAME</label><input id="nm" placeholder="Enter your name" maxlength="14" autocomplete="off"></div>
    <div class="field"><label>ROOM CODE</label><input id="cd" placeholder="Enter 4-letter code" maxlength="6" autocapitalize="characters" autocomplete="off" value="${esc(q)}"></div>
  </div>

  <div class="actionRow">
    <button class="pri" type="button" onclick="mk()">CREATE ROOM</button>
    <button type="button" onclick="jn()">JOIN ROOM</button>
  </div>
  <div class="actionHint">Already have a room code? Enter it above and press <b>JOIN ROOM</b>.</div>
  ${message}
 </div>
 <div class="section"><div class="sectionHead"><span class="eyebrow">THE MISSION</span><button style="width:auto;min-height:38px;padding:7px 12px;margin:0" onclick="openRules()">Rules & scoring</button></div>
  <div class="cards"><div class="feature"><div class="ico">${eyeArt()}</div><b>Get the word</b><p class="dim">Safe agents receive the same secret word. The Spy only sees the category.</p></div>
  <div class="feature"><div class="ico">${voteArt()}</div><b>Bluff & vote</b><p class="dim">Give a clever clue, spot suspicious answers, then vote simultaneously.</p></div>
  <div class="feature"><div class="ico">${shieldArt()}</div><b>Survive</b><p class="dim">Caught Spy gets a final guess. Five rounds decide the winner.</p></div></div>
 </div>
 <div class="section"><div class="sectionHead"><span class="eyebrow">QUICK RULES</span><span class="dim">FAST · SIMPLE · COMPETITIVE</span></div>
  <div class="rules"><div class="rule"><span class="num">01</span><br><b>One word. One clue.</b><br><span class="dim">Don't reveal the answer directly.</span></div><div class="rule"><span class="num">02</span><br><b>Find the Spy.</b><br><span class="dim">Use clues and discussion to identify the odd one out.</span></div><div class="rule"><span class="num">03</span><br><b>Spy gets a last chance.</b><br><span class="dim">If caught, guess the word to steal the round.</span></div><div class="rule"><span class="num">04</span><br><b>Highest score wins.</b><br><span class="dim">2-player rooms use the special Duel rules.</span></div></div>
 </div>`;
}
const avatarSeed=id=>{let h=0;for(let i=0;i<String(id||'').length;i++)h=(h*31+String(id)[i].charCodeAt(0))>>>0;return h};
const avatarIcons=['S','A','V','N','K','R','Z','X'];
const pfp=(id,name,small=false)=>{const n=avatarSeed(id)%8;const initial=(String(name||'?').trim()[0]||'?').toUpperCase();return `<span class="pfp p${n}${small?' sm':''}" title="Random agent avatar">${avatarIcons[n]||initial}</span>`};
function board(){return '<div class="sb">'+[...S.players].sort((a,b)=>b.score-a.score).map(p=>`<span class="pl${p.id===S.me?' me':''}${p.on?'':' off'}${p.done?' ok':''}"><span class="playerLine">${pfp(p.id,p.name)}<span class="name">${p.done?'✓ ':''}${esc(p.name)}${p.on?'':' (away)'}</span></span><b>${p.score}</b></span>`).join('')+'</div>'}
function chip(){return S.spy?`<span class="chip">You're the Spy · ${esc(S.cat)}</span>`:`<span class="chip">${esc(S.cat)} · word: ${esc(S.word)}</span>`}
function game(){
  const P=S.players.find(p=>p.id===S.me),host=S.host===S.me,live=!['lobby','end'].includes(S.phase);
  const on=S.players.filter(p=>p.on).length,timed=S.left>0;
  let b='';
  const spec=live&&!P.active;
  if(spec)b=`<div class="card"><h2>You're in next round</h2><p class="dim">You joined mid-round. Watch this one, then you'll play.</p></div>`;
  else if(S.phase==='lobby'){
    b=`<div class="card"><p class="dim" style="text-align:center">Room code. Friends enter this on their own phone.</p><div class="code">${S.code}</div>
    <div class="grid2"><button onclick="share()">${copied?'Link copied!':'Share invite link'}</button><button onclick="openRules()">Rules & scoring</button></div></div>
    <h2>Players (${S.players.length}/8)</h2>${board()}
    ${host?`<div class="card"><label class="dim">Rounds</label><select id="rd"><option>3</option><option selected>5</option><option>8</option></select>
    <button class="pri" ${on<2?'disabled':''} onclick="tx({t:'start',rounds:+val('rd')})">${on<2?'Waiting for 1 more player…':'Start game'}</button></div>`:'<p class="dim">Waiting for the host to start…</p>'}
    <p class="dim">2 players = Spy Duel · 3–8 players = Standard Spy.</p>`;
  }else if(S.phase==='role'){
    b=S.spy?`<div class="dossier"><small>CLASSIFIED</small><div class="big spy">You're the Spy</div><p>Category: <b>${esc(S.cat)}</b></p><p>You don't know the word. Listen to the clues and blend in.</p></div>`
    :`<div class="dossier"><small>YOUR SECRET WORD</small><div class="big">${esc(S.word)}</div><p>Category: <b>${esc(S.cat)}</b></p><p>One player doesn't have it. Give a clue that proves you do.</p></div>`;
  }else if(S.phase==='clue'){
    b=`${chip()}<h2>Give a one-word clue</h2><p class="dim">${S.spy?'Bluff: guess what the word might be.':'Hint at the word, but not so much that the Spy can guess it.'}</p>`+
    (P.done?`<div class="card good">Clue locked in. Waiting for the others…</div>`:`<input id="cl" maxlength="20" placeholder="Your clue" autocomplete="off" onkeydown="if(event.key==='Enter')clue()"><button class="pri" onclick="clue()">Lock in clue</button>`);
  }else if(S.phase==='vote'){
    b=`${chip()}<h2>Who is the Spy?</h2><p class="dim">Tap a player to vote. You can change it until everyone has voted.</p>`+
    S.clues.filter(c=>c.id!==S.me).map(c=>{const pp=S.players.find(x=>x.id===c.id)||{};return `<button class="vt${S.myVote===c.id?' sel':''}" onclick="tx({t:'vote',id:'${c.id}'})"><span class="playerLine">${pfp(c.id,pp.name,true)}<span class="name">${nm(c.id)}</span></span><span>${esc(c.text)}</span></button>`}).join('')+
    `<p class="dim">Your clue: <b>${esc((S.clues.find(c=>c.id===S.me)||{}).text||'')}</b></p>`;
  }else if(S.phase==='guess'){
    b=S.res.spy===S.me?`<div class="card"><h2 class="bad">You were caught!</h2><p>Guess the secret word to steal 200 points. Category: <b>${esc(S.cat)}</b></p>
    <input id="gs" maxlength="30" placeholder="The secret word is…" autocomplete="off" onkeydown="if(event.key==='Enter')gs()"><button class="pri" onclick="gs()">Guess</button></div>`
    :`<div class="card"><h2>${nm(S.res.spy)} was the Spy!</h2><p class="dim">They get one last chance to guess the word. Fingers crossed.</p></div>`;
  }else if(S.phase==='reveal'){
    const r=S.res,last=S.round>=S.rounds;
    b=`<div class="card"><h2>${r.void?'Round voided':nm(r.spy)+(r.caught?' was caught!':' got away!')}</h2>
    ${r.void?'<p class="dim">The Spy disconnected. No points this round.</p>':`<p>The word was <b>${esc(S.res.word||'')}</b>.${r.guess?` Spy guessed “${esc(r.guess)}” — <b class="${r.ok?'good':'bad'}">${r.ok?'correct, +200':'wrong'}</b>.`:''}</p>`}
    ${r.void?'':S.clues.map(c=>{const pp=S.players.find(x=>x.id===c.id)||{};return `<div class="row"><span class="leaderLine">${pfp(c.id,pp.name,true)}<span>${c.id===r.spy?'🕵️ ':''}${nm(c.id)}: <b>${esc(c.text)}</b><br><small class="dim">voted ${r.votes[c.id]?nm(r.votes[c.id]):'no one'}</small></span></span><b class="${r.gains[c.id]?'good':'dim'}">+${r.gains[c.id]||0}</b></div>`}).join('')}</div>`+
    (host?`<button class="pri" onclick="tx({t:'next'})">${last?'See final results':'Next round'}</button>`:'<p class="dim">Next up shortly…</p>');
  }else if(S.phase==='wait'){b=`<div class="card"><h2>Waiting for players…</h2><p class="dim">The game resumes when at least 2 players are connected.</p></div>`}
  else if(S.phase==='end'){
    const s=[...S.players].sort((a,b)=>b.score-a.score);
    b=`<h2>Final leaderboard</h2><div class="card">${s.map((p,i)=>`<div class="row"><span class="leaderLine">${pfp(p.id,p.name)}<span>${['🥇','🥈','🥉'][i]||i+1+'.'} ${esc(p.name)}${p.id===S.me?' (you)':''}</span></span><b class="${i?'':'good'}">${p.score}</b></div>`).join('')}</div>
    ${host?'<button class="pri" onclick="tx({t:\'again\'})">Play again</button>':'<p class="dim">Waiting for the host to start a rematch…</p>'}<button onclick="leave()">Leave room</button>`;
  }
  const pct=S.rounds?Math.max(0,Math.min(100,(S.round/S.rounds)*100)):0;
  return `<div class="hd"><span>ROOM <b>${S.code}</b></span><span>${live?`ROUND ${S.round}/${S.rounds} · ${S.phase.toUpperCase()}`:''}</span><span id="tm">${timed?Math.ceil(S.left/1000):''}</span></div>
  ${live?`<div class="progress" aria-label="Round progress"><i style="--w:${pct}%"></i></div>`:''}
  ${b}${S.phase==='lobby'||S.phase==='end'?'':board()}${err?`<p class="err">${esc(err)}</p>`:''}`;
}
const clue=()=>tx({t:'clue',text:val('cl')}),gs=()=>tx({t:'guess',text:val('gs')});
async function share(){const u=location.origin+'/?room='+S.code;
  try{if(navigator.share)await navigator.share({title:'Spy or Safe',text:'Join my game with code '+S.code,url:u});else{await navigator.clipboard.writeText(u);copied=true;render();setTimeout(()=>{copied=false;render()},2000)}}catch(e){}}
render();
conn();
