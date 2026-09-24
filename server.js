// Spy or Safe - authoritative realtime server. In-memory rooms, WebSocket transport.
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,K=process.env.FAST?0.1:1;
const T={role:5,clue:45,vote:45,guess:20,reveal:15};
const BANK={Food:['pizza','sushi','popcorn','pancake','burrito','ice cream','noodles','cheese'],
Animals:['penguin','giraffe','octopus','kangaroo','owl','dolphin','panda','camel'],
Places:['airport','library','beach','hospital','circus','museum','farm','submarine'],
Things:['umbrella','guitar','telescope','backpack','mirror','bicycle','candle','clock']};
const rooms=new Map(),rnd=a=>a[Math.random()*a.length|0],rid=()=>Math.random().toString(36).slice(2,10);
const clean=(s,n)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n);
const send=(p,m)=>{if(p.on&&p.ws&&p.ws.readyState===1)p.ws.send(JSON.stringify(m))};
const code=()=>{let c;do c=Array.from({length:4},()=>rnd('ABCDEFGHJKLMNPQRSTUVWXYZ')).join('');while(rooms.has(c));return c};

function view(r,p){
  const act=r.active,live=!['lobby','end'].includes(r.phase);
  const v={t:'state',code:r.code,me:p.id,host:r.host,phase:r.phase,round:r.round,rounds:r.rounds,mode:r.mode,
    left:r.deadline?Math.max(0,r.deadline-Date.now()):0,
    players:[...r.players.values()].map(q=>({id:q.id,name:q.name,score:q.score,on:q.on,active:act.includes(q.id),
      done:r.phase==='clue'?q.id in r.clues:r.phase==='vote'?q.id in r.votes:false}))};
  if(live&&act.includes(p.id)){v.cat=r.cat;if(p.id===r.spy)v.spy=true;else v.word=r.word}
  if(['vote','guess','reveal'].includes(r.phase)){v.clues=act.map(id=>({id,text:r.clues[id]||'-'}));v.myVote=r.votes[p.id]}
  if(['guess','reveal'].includes(r.phase)&&r.res)v.res={...r.res,word:r.phase==='reveal'?r.word:undefined};
  return v;
}
function push(r){r.last=Date.now();for(const p of r.players.values())send(p,view(r,p))}
function setPhase(r,ph,secs,fn){clearTimeout(r.timer);r.phase=ph;secs*=K;r.deadline=secs?Date.now()+secs*1000:0;if(secs)r.timer=setTimeout(fn,secs*1000);push(r)}
function fixHost(r){if(!r.players.get(r.host)?.on){const n=[...r.players.values()].find(p=>p.on);if(n)r.host=n.id}}

function startRound(r){
  const on=[...r.players.values()].filter(p=>p.on);
  if(on.length<2)return setPhase(r,'wait',120,()=>{r.round=0;setPhase(r,'lobby',0)}); // pause until 2+ players are connected
  r.round++;r.mode=on.length===2?'duel':'standard';r.active=on.map(p=>p.id);
  let pool=on.filter(p=>!p.spied);if(!pool.length){on.forEach(p=>p.spied=false);pool=on}
  const s=rnd(pool);s.spied=true;r.spy=s.id;
  let w;do{r.cat=rnd(Object.keys(BANK));w=rnd(BANK[r.cat])}while(r.used.has(w));r.used.add(w);r.word=w;
  r.clues={};r.votes={};r.res=null;
  setPhase(r,'role',T.role,()=>setPhase(r,'clue',T.clue,endClues.bind(0,r)));
}
const endClues=r=>setPhase(r,'vote',T.vote,()=>resolve(r));
function chk(r){
  const need=r.active.filter(id=>r.players.get(id)?.on);if(need.length<2)return; // timers handle a lone player
  if(r.phase==='clue'&&need.every(id=>id in r.clues))endClues(r);
  else if(r.phase==='vote'&&need.every(id=>id in r.votes))resolve(r);
}
function resolve(r){
  const gains={};r.active.forEach(id=>gains[id]=0);
  let caught=false,tie=false;
  if(r.mode==='duel'){
    const safe=r.active.find(id=>id!==r.spy);
    const safeVote=r.votes[safe];
    caught=safeVote===r.spy;
    if(caught)gains[safe]+=2;
  }else{
    const cnt={};
    for(const[v,t]of Object.entries(r.votes)){
      if(v===r.spy)continue; // Spy's vote does not determine who gets caught.
      if(r.active.includes(t))cnt[t]=(cnt[t]||0)+1;
    }
    const mx=Math.max(0,...Object.values(cnt));
    const top=Object.keys(cnt).filter(k=>cnt[k]===mx);
    caught=top.length===1&&top[0]===r.spy;
    tie=!caught&&top.length>1&&mx>0;
    for(const[v,t]of Object.entries(r.votes))if(v!==r.spy&&t===r.spy&&v in gains)gains[v]+=2;
  }
  if(!caught&&!tie)gains[r.spy]+=3;
  r.res={spy:r.spy,caught,tie,gains,votes:{...r.votes},guess:null,ok:false};
  if((caught||tie)&&r.players.get(r.spy)?.on)setPhase(r,'guess',T.guess,()=>reveal(r));else reveal(r);
}
function reveal(r){
  const g=r.res;
  if((g.caught||g.tie)&&g.guess&&g.guess.trim().toLowerCase()===r.word.toLowerCase()){g.ok=true;g.gains[r.spy]+=2}
  for(const[id,n]of Object.entries(g.gains)){const p=r.players.get(id);if(p)p.score+=n}
  setPhase(r,'reveal',T.reveal,()=>adv(r));
}
function adv(r){r.round>=r.rounds?setPhase(r,'end',0):startRound(r)}
function voidRound(r){
  r.res={spy:r.spy,void:true,caught:false,gains:{},votes:{},guess:null};
  setPhase(r,'reveal',T.reveal,()=>adv(r));
}

function add(r,name,ws){
  const names=new Set([...r.players.values()].map(p=>p.name.toLowerCase()));
  let n=name,i=1;while(names.has(n.toLowerCase()))n=name+' '+(++i);
  const p={id:rid(),token:rid()+rid(),name:n,score:0,on:true,ws,spied:false};
  r.players.set(p.id,p);if(!r.host)r.host=p.id;return p;
}
function attach(r,p,ws){send(p,{t:'joined',code:r.code,token:p.token});push(r);
  if(r.phase==='wait'&&[...r.players.values()].filter(q=>q.on).length>=2)startRound(r)}
function drop(r,p){
  p.on=false;fixHost(r);
  if(r.phase==='lobby')p.gone=setTimeout(()=>{if(!p.on){r.players.delete(p.id);fixHost(r);push(r)}},10000);
  else if(r.mode==='duel'&&['role','clue','vote','guess'].includes(r.phase)){
    const rd=r.round;setTimeout(()=>{if(!p.on&&r.round===rd&&['role','clue','vote','guess'].includes(r.phase))voidRound(r)},5000*K);
  }else if(p.id===r.spy&&['role','clue','vote'].includes(r.phase)){
    const rd=r.round;setTimeout(()=>{if(!p.on&&r.round===rd&&['role','clue','vote'].includes(r.phase))voidRound(r)},30000*K);
  }
  chk(r);push(r);
}
function act(r,p,m){
  const A=r.active.includes(p.id);
  switch(m.t){
    case'start':if(p.id===r.host&&r.phase==='lobby'&&[...r.players.values()].filter(q=>q.on).length>=2){
      r.rounds=[3,5,8].includes(m.rounds)?m.rounds:5;r.round=0;r.mode=null;r.used=new Set();startRound(r)}break;
    case'clue':{const c=clean(m.text,20);if(r.phase==='clue'&&A&&c&&!(p.id in r.clues)){r.clues[p.id]=c;chk(r);push(r)}break}
    case'vote':if(r.phase==='vote'&&A&&m.id!==p.id&&r.active.includes(m.id)){r.votes[p.id]=m.id;chk(r);push(r)}break;
    case'guess':{const g=clean(m.text,30);if(r.phase==='guess'&&p.id===r.spy&&(r.res.caught||r.res.tie)&&g){r.res.guess=g;reveal(r)}break}
    case'next':if(p.id===r.host&&r.phase==='reveal')adv(r);break;
    case'again':if(p.id===r.host&&r.phase==='end'){r.players.forEach(q=>{q.score=0;q.spied=false});r.round=0;r.mode=null;setPhase(r,'lobby',0)}break;
  }
}

const srv=http.createServer((q,s)=>{
  if(q.url==='/health'){s.end('ok');return}
  fs.readFile(path.join(__dirname,'public','index.html'),(e,d)=>{
    if(e){s.writeHead(500);return s.end('missing index.html')}
    s.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'});s.end(d)});
});
const wss=new WebSocketServer({server:srv,maxPayload:2048});
wss.on('connection',ws=>{
  let r,p;const err=msg=>ws.send(JSON.stringify({t:'err',msg}));
  ws.on('message',d=>{
    let m;try{m=JSON.parse(d)}catch{return}
    if(!r){
      const name=clean(m.name,14);
      if(m.t==='create'){
        if(!name)return err('Enter a name first.');
        r={code:code(),players:new Map(),host:null,phase:'lobby',round:0,rounds:5,mode:null,active:[],clues:{},votes:{},used:new Set(),last:Date.now()};
        rooms.set(r.code,r);p=add(r,name,ws);p.ws=ws;attach(r,p,ws);
      }else if(m.t==='join'){
        const x=rooms.get(String(m.code||'').toUpperCase().trim());
        if(!name)return err('Enter a name first.');
        if(!x)return err('No room with that code.');
        if(x.phase==='end')return err('That room has finished. Ask the host to start a new game.');
        if(x.players.size>=8)return err('That room is full (8 players).');
        r=x;p=add(r,name,ws);p.ws=ws;attach(r,p,ws);
      }else if(m.t==='resume'){
        const x=rooms.get(String(m.code||'')),q=x&&[...x.players.values()].find(y=>y.token===m.token);
        if(!q)return err('resume-fail');
        r=x;p=q;clearTimeout(p.gone);if(p.ws&&p.ws!==ws)try{p.ws.close()}catch{}
        p.ws=ws;p.on=true;fixHost(r);attach(r,p,ws);
      }
    }else act(r,p,m);
  });
  ws.on('close',()=>{if(r&&p&&p.ws===ws)drop(r,p)});
});
setInterval(()=>{for(const[c,r]of rooms)if(![...r.players.values()].some(p=>p.on)&&Date.now()-r.last>30*60000){clearTimeout(r.timer);rooms.delete(c)}},60000).unref();
if(require.main===module)srv.listen(PORT,()=>console.log('Spy or Safe running on http://localhost:'+PORT));
module.exports={rooms,view,add,attach,drop,act,startRound,resolve,reveal,adv,voidRound,setPhase};
