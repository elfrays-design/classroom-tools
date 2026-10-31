/* v1.31 — 교실 짝찾기: 개념과 설명을 기억해서 맞추는 카드 게임 */
'use strict';
let matchFull=false,matchInterval=null,matchHideTimer=null,matchLocked=false,matchEpoch=0;
const MATCH_COUNTS=[4,6,8];
const MATCH_SAMPLES=[
 {a:'광합성',b:'식물이 빛을 이용해 양분을 만드는 과정'},
 {a:'증발',b:'액체가 기체로 바뀌는 현상'},
 {a:'분수',b:'전체를 똑같이 나눈 부분을 나타낸 수'},
 {a:'직각',b:'90도인 각'},
 {a:'생태계',b:'생물과 주변 환경이 서로 영향을 주고받는 체계'},
 {a:'동의어',b:'뜻이 같거나 비슷한 낱말'},
 {a:'민주주의',b:'국민이 국가의 주인인 정치 원리'},
 {a:'공전',b:'천체가 다른 천체 주위를 도는 운동'}
];
function matchDeck(count){return shuffled(Array.from({length:count},(_,i)=>[{pair:i,side:'a'},{pair:i,side:'b'}]).flat());}
function makeDefaultMatch(){return {title:'짝을 찾아라! 기억력 카드',count:6,pairs:MATCH_SAMPLES.map(x=>({...x})),deck:matchDeck(6),matched:[],selected:[],moves:0,elapsed:0,since:0,running:false,sound:true};}
function normalizeMatch(raw){
 const base=makeDefaultMatch(),v=raw&&typeof raw==='object'?raw:{};
 const count=MATCH_COUNTS.includes(Number(v.count))?Number(v.count):6;
 const pairs=MATCH_SAMPLES.map((x,i)=>({a:String(v.pairs?.[i]?.a??x.a).slice(0,120),b:String(v.pairs?.[i]?.b??x.b).slice(0,120)}));
 const input=Array.isArray(v.deck)?v.deck:[];
 const deck=input.length===count*2&&input.every(x=>x&&Number.isInteger(x.pair)&&x.pair>=0&&x.pair<count&&['a','b'].includes(x.side))&&new Set(input.map(x=>x.pair+x.side)).size===count*2
  ?input.map(x=>({pair:x.pair,side:x.side})):matchDeck(count);
 const matched=Array.isArray(v.matched)?[...new Set(v.matched.filter(x=>Number.isInteger(x)&&x>=0&&x<count))]:[];
 return {title:String(v.title||base.title).slice(0,90),count,pairs,deck,matched,selected:[],
  moves:Math.min(100000,Math.max(0,Math.floor(Number(v.moves)||0))),
  elapsed:Math.min(86400000,Math.max(0,Math.floor(Number(v.elapsed)||0))),
  since:0,running:false,sound:v.sound!==false};
}
function matchState(){const c=activeClass();return c.match||(c.match=makeDefaultMatch());}
function matchElapsed(s=matchState()){return s.elapsed+(s.running?Math.max(0,Date.now()-s.since):0);}
function matchTime(ms){const sec=Math.floor(ms/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function matchTick(){const el=document.getElementById('matchClock');if(el)el.textContent=matchTime(matchElapsed());}
function matchStartClock(){
 const s=matchState();if(s.running||s.matched.length===s.count)return;
 s.running=true;s.since=Date.now();clearInterval(matchInterval);matchInterval=setInterval(matchTick,250);
}
function matchPause(){
 const s=matchState();if(s.running){s.elapsed=matchElapsed(s);s.running=false;s.since=0;save();}
 clearInterval(matchInterval);matchInterval=null;
}
function matchClearPending(){clearTimeout(matchHideTimer);matchHideTimer=null;matchLocked=false;matchEpoch++;}
function matchResetData(s,shuffle){
 matchClearPending();matchPause();s.matched=[];s.selected=[];s.moves=0;s.elapsed=0;s.since=0;s.running=false;
 if(shuffle)s.deck=matchDeck(s.count);
}
function matchClick(index){
 const s=matchState();if(matchLocked||s.matched.length===s.count||!Number.isInteger(index)||index<0||index>=s.deck.length)return;
 if(s.selected.includes(index)||s.matched.includes(s.deck[index].pair))return;
 const card=s.deck[index],pair=s.pairs[card.pair];
 if(!pair?.a.trim()||!pair?.b.trim())return toast('게임에 사용할 개념과 설명을 모두 입력해 주세요.');
 matchStartClock();s.selected.push(index);
 if(s.selected.length===2){
  s.moves++;
  const [a,b]=s.selected.map(i=>s.deck[i]);
  if(a.pair===b.pair){
   s.matched.push(a.pair);s.selected=[];
   if(s.sound){soundUnlock();beep();}
   if(s.matched.length===s.count){
    matchPause();history('짝찾기 게임',s.title+': '+s.moves+'번 시도, '+matchTime(s.elapsed));
    toast('🎉 모든 짝을 찾았습니다!');
   }else toast('🌟 정답! 카드 두 장이 짝이에요.');
  }else{
   matchLocked=true;const epoch=matchEpoch,classId=activeClass().id;
   matchHideTimer=setTimeout(()=>{
    if(epoch!==matchEpoch||activeClass().id!==classId)return;
    const current=matchState();current.selected=[];matchLocked=false;matchHideTimer=null;save();
    if(currentView==='match')render();
   },1150);
  }
 }
 save();render();
}
function matchReset(shuffle=false){
 const s=matchState();
 if((s.moves||s.matched.length)&&!confirm(shuffle?'카드를 다시 섞고 진행 기록을 초기화할까요?':'카드 순서는 유지하고 진행 기록만 초기화할까요?'))return;
 matchResetData(s,shuffle);save();render();
 if(shuffle)toast('🎲 카드를 다시 섞었습니다!');
}
function matchSetCount(value){
 const count=Number(value);if(!MATCH_COUNTS.includes(count))return;
 const s=matchState();if(s.count===count)return;
 if(s.moves&&!confirm('카드 개수를 변경하면 게임 진행 기록이 초기화됩니다. 계속할까요?')){render();return;}
 matchResetData(s,false);s.count=count;s.deck=matchDeck(count);save();render();
}
function matchSetTitle(value){const s=matchState();s.title=String(value??'').slice(0,90);save();const x=document.getElementById('matchBoardTitle');if(x)x.textContent=s.title||'짝찾기 기억력 카드';}
function matchEditCard(index,side,value){
 const s=matchState();if(!Number.isInteger(index)||index<0||index>=8||!['a','b'].includes(side))return;
 const next=String(value??'').slice(0,120);if(s.pairs[index][side]===next)return;
 if(s.moves||s.selected.length||s.matched.length)matchResetData(s,false);
 s.pairs[index][side]=next;save();matchRefreshBoard();
}
function matchPreset(){
 if(!confirm('작성한 카드를 예시 개념과 설명으로 교체하고 진행 기록을 초기화할까요?'))return;
 const s=matchState();matchResetData(s,true);s.pairs=MATCH_SAMPLES.map(x=>({...x}));save();render();
}
function matchCopy(){
 const s=matchState();
 copyText([s.title,'짝찾기 '+s.count+'쌍 | 시도 '+s.moves+'회 | 시간 '+matchTime(matchElapsed(s)),
  ...s.pairs.slice(0,s.count).map((p,i)=>(i+1)+'. '+p.a+' ↔ '+p.b)].join('\n'));
}
function matchFullToggle(){matchFull=!matchFull;document.body.classList.toggle('match-fullscreen',matchFull);render();if(matchFull)window.scrollTo({top:0,behavior:'instant'});}
function matchLeave(){matchClearPending();matchPause();const s=matchState();if(s.selected.length){s.selected=[];save();}matchFull=false;document.body.classList.remove('match-fullscreen');}
function matchBoard(){
 const s=matchState(),done=s.matched.length===s.count;
 return '<section id="matchLiveBoard" class="match-board">'+
 '<header class="match-board-head"><div><small>🧠 우리 반 기억력 카드</small><h2 id="matchBoardTitle">'+escapeHtml(s.title||'짝찾기 기억력 카드')+'</h2></div>'+
 '<div class="match-stats"><span>✅ <strong>'+s.matched.length+'/'+s.count+'</strong>쌍</span><span>🎯 <strong>'+s.moves+'</strong>회</span><span>⏱ <strong id="matchClock">'+matchTime(matchElapsed(s))+'</strong></span></div></header>'+
 '<p class="match-board-tip">'+(done?'🎊 축하해요! 모든 개념과 설명을 연결했어요!':'카드 두 장을 열어 알맞은 개념과 설명을 연결해 보세요.')+'</p>'+
 '<div class="match-card-grid">'+s.deck.map((card,i)=>{
  const shown=s.selected.includes(i)||s.matched.includes(card.pair);
  const correct=s.matched.includes(card.pair);
  return '<button type="button" class="match-card '+(shown?'is-open ':'')+(correct?'is-matched':'')+'" data-match-card="'+i+'" aria-label="'+(i+1)+'번 카드 '+(correct?'짝 찾기 완료':shown?'공개됨':'열기')+'" '+(shown||matchLocked||done?'disabled':'')+'>'+
   (shown?'<small>'+(card.side==='a'?'개념':'설명')+'</small><strong>'+escapeHtml(s.pairs[card.pair][card.side]||'내용 없음')+'</strong>':'<span class="match-card-back">❔</span><small>'+(i+1)+'번</small>')+
   (correct?'<span class="match-check">✓</span>':'')+'</button>';
 }).join('')+'</div>'+
 '<div class="match-board-footer">'+(done?'🏆 '+s.moves+'번의 도전 · '+matchTime(s.elapsed)+'에 완성했어요!':'같은 내용을 기억하고, 어울리는 짝을 찾아보세요. 🌈')+'</div></section>';
}
function matchRefreshBoard(){
 if(matchFull||currentView!=='match')return;
 const current=document.getElementById('matchLiveBoard');if(!current)return;
 const tmp=document.createElement('div');tmp.innerHTML=matchBoard();current.replaceWith(tmp.firstElementChild);
}
function matchControls(){
 return '<section class="match-controls"><strong>👩‍🏫 교사용 조작</strong><div class="match-control-buttons">'+
 '<button type="button" class="btn btn-outline" id="matchReset">↺ 같은 카드로 다시</button>'+
 '<button type="button" class="btn btn-secondary" id="matchShuffle">🎲 다시 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="matchCopy">📋 카드·결과 복사</button>'+
 (matchFull?'<button type="button" class="btn btn-primary" id="matchFull">✕ 관리 화면으로</button>':
 '<button type="button" class="btn btn-primary" id="matchFull">⛶ 전자칠판 크게 보기</button>')+'</div></section>';
}
function matchEditor(){
 const s=matchState();
 return '<section class="panel match-editor"><h2>① 개념과 설명 입력</h2><p>교과서 핵심 단어나 영어 단어와 뜻 등으로 바꿔 보세요.</p>'+
 '<label class="match-field">게임 제목<input type="text" class="field" maxlength="90" id="matchTitle" value="'+escapeHtml(s.title)+'"></label>'+
 '<div class="match-options"><label>짝 개수<select class="field" id="matchCount">'+MATCH_COUNTS.map(n=>'<option value="'+n+'" '+(s.count===n?'selected':'')+'>'+n+'쌍 · '+(n*2)+'장</option>').join('')+'</select></label>'+
 '<label class="match-sound"><input id="matchSound" type="checkbox" '+(s.sound?'checked':'')+'> 🔊 짝 성공 알림음</label></div>'+
 '<div class="match-editor-list">'+s.pairs.slice(0,s.count).map((p,i)=>'<div class="match-pair-edit"><strong>짝 '+(i+1)+'</strong>'+
 '<input class="field" type="text" maxlength="120" data-match-pair="'+i+'" data-match-side="a" placeholder="개념 또는 단어" value="'+escapeHtml(p.a)+'">'+
 '<textarea class="field" rows="2" maxlength="120" data-match-pair="'+i+'" data-match-side="b" placeholder="뜻 또는 설명">'+escapeHtml(p.b)+'</textarea></div>').join('')+'</div>'+
 '<div class="match-editor-foot"><button type="button" class="btn btn-outline btn-small" id="matchPreset">✨ 예시 카드 불러오기</button><small>편집 중에도 자동 저장됩니다.</small></div>'+
 '<p class="match-editor-note">※ 관리 화면에는 정답 쌍이 보입니다. <strong>전자칠판 크게 보기</strong>에서는 뒷면만 보이고, 카드를 누르면 내용이 공개됩니다.</p></section>';
}
function renderMatch(){
 if(matchFull)return '<div class="match-full-head"><strong>🧠 기억력 짝찾기</strong><button type="button" class="btn btn-outline btn-small" id="matchFull">✕ 관리 화면으로</button></div>'+matchBoard()+matchControls();
 return title('교실 놀이·게임','짝찾기 기억력 카드','뒤집은 카드의 개념과 설명을 기억해 알맞은 짝을 찾아보는 게임입니다.','🧠')+
 '<div class="match-layout"><div>'+matchEditor()+'</div><div class="match-play"><h2>② 우리 반 짝찾기</h2>'+
 matchBoard()+matchControls()+'</div></div>';
}
