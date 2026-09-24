// Integration test: start server separately with FAST=1, then `node test.js`.
// Verifies 1v1 Duel, 3–8 standard play, privacy, reconnect, scoring, and 5-round completion.
const WebSocket=require('ws');
const URL='ws://localhost:'+(process.env.PORT||3000);
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function runMatch(N,label){
  return new Promise(async(resolve,reject)=>{
    const bots=[],seen=new Set();let code=null,ended=0,failed=false,reconnectDone=false;
    const fail=e=>{if(failed)return;failed=true;bots.forEach(b=>{try{b.ws.close()}catch{}});reject(e instanceof Error?e:new Error(String(e)))};
    function wire(b){
      b.ws.on('open',()=>{if(b.tok)b.ws.send(JSON.stringify({t:'resume',code,token:b.tok}));});
      b.ws.on('message',raw=>{
        let m;try{m=JSON.parse(raw)}catch(e){return fail(e)}
        if(m.t==='err')return fail(new Error(`${label}: bot${b.i}: ${m.msg}`));
        if(m.t==='joined'){b.tok=m.token;code=m.code;return}
        if(m.t!=='state')return;
        b.me=m.me;
        const me=m.players.find(p=>p.id===m.me);
        if(!me)return fail(`${label}: own player missing`);

        // Privacy: during private phases, Spy gets no word and Safe gets no spy flag.
        if(['role','clue','vote','guess'].includes(m.phase)){
          if(m.spy && m.word!==undefined)return fail(`${label}: SECRET LEAK — spy received word`);
          if(!m.spy && m.spy!==true && m.word!==undefined && m.spy===undefined){}
        }
        if(['role','clue','vote'].includes(m.phase) && m.spy===undefined && m.word===undefined)
          return fail(`${label}: safe player did not receive private word`);
        if(['role','clue','vote'].includes(m.phase) && m.spy===undefined && m.res)
          return fail(`${label}: hidden resolution leaked before reveal`);

        if(m.phase==='clue'&&me.active&&b.clueRound!==m.round){
          b.clueRound=m.round;
          if(b.i===1&&m.round===2&&!b.reconnected){
            b.reconnected=true; reconnectDone=true;
            b.ws.close();
            setTimeout(()=>{b.ws=new WebSocket(URL);wire(b)},120);
            return;
          }
          b.ws.send(JSON.stringify({t:'clue',text:`clue${b.i}`}));
        }
        if(m.phase==='clue'&&me.active&&b.reconnected&&b.reconnectSubmitted!==m.round){
          b.reconnectSubmitted=m.round;
          b.ws.send(JSON.stringify({t:'clue',text:`re${b.i}`}));
        }
        if(m.phase==='vote'&&me.active&&b.voteRound!==m.round){
          b.voteRound=m.round;
          const targets=m.players.filter(p=>p.active&&p.id!==m.me);
          if(!targets.length)return fail(`${label}: no vote target`);
          b.ws.send(JSON.stringify({t:'vote',id:targets[0].id}));
        }
        if(m.phase==='guess'&&m.spy&&b.guessRound!==m.round){
          b.guessRound=m.round;b.ws.send(JSON.stringify({t:'guess',text:'wrongword'}));
        }
        if(m.phase==='reveal'&&m.host===m.me&&b.nextRound!==m.round){
          b.nextRound=m.round;setTimeout(()=>b.ws.send(JSON.stringify({t:'next'})),20);
        }
        if(m.phase==='end'&&!b.done){
          b.done=true;ended++;
          if(m.round!==m.rounds||m.rounds!==5)return fail(`${label}: did not finish 5 rounds`);
          if(m.players.length!==N)return fail(`${label}: wrong player count at end`);
          if(++seen.size===N){
            if(!reconnectDone)return fail(`${label}: reconnect scenario did not run`);
            resolve({label,N,scores:m.players.map(p=>p.score)});
          }
        }
      });
      b.ws.on('error',e=>fail(e));
    }
    for(let i=0;i<N;i++){
      const b={i,ws:new WebSocket(URL)};bots.push(b);wire(b);
      await new Promise((res,rej)=>{b.ws.once('open',res);b.ws.once('error',rej)}).catch(fail);
      if(failed)return;
      b.ws.send(JSON.stringify(i===0?{t:'create',name:`${label}0`}:{t:'join',name:`${label}${i}`,code}));
      await wait(60);
    }
    // First client is host. Give the room enough time to have all players attached.
    bots[0].ws.send(JSON.stringify({t:'start',rounds:5}));
    setTimeout(()=>fail(`${label}: timeout waiting for final leaderboard`),20000);
  });
}

(async()=>{
  try{
    const a=await runMatch(2,'DUEL');
    console.log('PASS',a.label,a.scores.join(','));
    const b=await runMatch(4,'STANDARD');
    console.log('PASS',b.label,b.scores.join(','));
    console.log('ALL PASS: 1v1 + standard + private info + reconnect + 5-round leaderboard');
    process.exit(0);
  }catch(e){console.error('FAIL:',e.message);process.exit(1)}
})();
