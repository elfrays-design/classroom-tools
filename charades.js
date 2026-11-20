/* 별이와 송이의 수업도구 상자 — ⑨ 몸으로 표현해요! · 교사 PC 단독 */
'use strict';
const CHARADES_CATEGORIES=[
 {id:'animals',label:'🐾 동물',words:['🐰 토끼','🐢 거북이','🦒 기린','🐘 코끼리','🐧 펭귄','🦀 게','🦘 캥거루','🐸 개구리','🐙 문어','🐒 원숭이','🦋 나비','🐻 곰','🦆 오리','🦁 사자']},
 {id:'jobs',label:'👩‍🚒 직업',words:['🧑‍🚒 소방관','👩‍🍳 요리사','👨‍⚕️ 의사','🧑‍🏫 선생님','🧑‍🚀 우주비행사','🧑‍🎨 화가','👨‍🌾 농부','🧑‍✈️ 비행기 조종사','🧑‍🔧 정비사','🧑‍🎤 가수','🧑‍💻 프로그래머','👷 건축 노동자','📷 사진작가','🧑‍🔬 과학자']},
 {id:'sports',label:'⚽ 운동',words:['⚽ 축구하기','🏀 농구하기','🏊 수영하기','🚴 자전거 타기','🏸 배드민턴 치기','🏓 탁구 치기','⛷️ 스키 타기','🏃 달리기','🤸 체조하기','⛸️ 스케이트 타기','🥋 태권도 하기','🏐 배구하기','⛳ 골프 치기','🤾 공 던지기']},
 {id:'daily',label:'🏡 일상생활',words:['🪥 양치하기','🧹 청소하기','🧴 손 씻기','🛌 잠자기','🧦 양말 신기','📖 책 읽기','🎒 가방 메기','🍜 라면 먹기','☂️ 우산 쓰기','📞 전화하기','🎂 생일 축하하기','🪴 화분에 물 주기','🧊 시원한 물 마시기','📝 글씨 쓰기']},
 {id:'nature',label:'🌤️ 자연·상상',words:['🌲 바람에 흔들리는 나무','☔ 비 맞는 사람','🌸 피어나는 꽃','⛄ 눈사람 만들기','🦖 공룡','🚀 우주선 출발','🧙 마법 주문 외우기','🤖 로봇','🌊 파도','🎈 바람에 날리는 풍선','🌈 무지개','🍂 떨어지는 낙엽','🐣 알에서 나오는 병아리','🗿 움직이는 돌 조각상']}
];
const CHARADES_IDS=CHARADES_CATEGORIES.map(x=>x.id);
const CHARADES_DURATIONS=[30,60,90,120];
let charadesFull=false,charadesEditorOpen=false,charadesTickId=null,charadesDeadline=0,charadesUndoData=null,charadesNotice='';
function charadesDefaultPools(){return Object.fromEntries(CHARADES_CATEGORIES.map(x=>[x.id,x.words.slice()]));}
function charadesNew(){return {category:'animals',pools:charadesDefaultPools(),duration:60,remaining:60,
 teamCount:1,teamNames:['우리 반','1모둠','2모둠','3모둠'],scores:[0,0,0,0],team:0,
 phase:'ready',current:null,used:[],reveal:false,correct:0,passed:0,turnCorrect:0,turnPassed:0,turns:0,sound:true};}
function makeDefaultCharades(){return charadesNew();}
function charadesPoolItems(s){
 const ids=s.category==='all'?CHARADES_IDS:[s.category];
 return ids.flatMap(id=>s.pools[id].map(word=>({id,word,key:id+'\u0000'+word})));
}
function normalizeCharades(raw){
 const d=charadesNew(),v=raw&&typeof raw==='object'?raw:{},pools={};
 for(const id of CHARADES_IDS){
  const input=Array.isArray(v.pools?.[id])?v.pools[id].slice(0,40).map(x=>String(x??'').trim().slice(0,55)).filter(Boolean):[];
  const unique=Array.from(new Set(input));
  pools[id]=unique.length>=3?unique:d.pools[id].slice();
 }
 const duration=CHARADES_DURATIONS.includes(v.duration)?v.duration:60;
 const teamCount=[1,2,3,4].includes(v.teamCount)?v.teamCount:1;
 const teamNames=Array.from({length:4},(_,i)=>String(v.teamNames?.[i]??d.teamNames[i]).trim().slice(0,24)||d.teamNames[i]);
 const scores=Array.from({length:4},(_,i)=>Math.max(0,Math.min(99999,Math.floor(Number(v.scores?.[i])||0))));
 const category=(v.category==='all'||CHARADES_IDS.includes(v.category))?v.category:'animals';
 const state={category,pools,duration,remaining:Math.max(0,Math.min(duration,Math.ceil(Number(v.remaining)||0))),teamCount,teamNames,scores,
  team:Math.max(0,Math.min(teamCount-1,Math.floor(Number(v.team)||0))),
  phase:['ready','playing','paused','ended'].includes(v.phase)?v.phase:'ready',
  current:null,used:[],reveal:v.reveal===true,correct:Math.max(0,Math.min(99999,Math.floor(Number(v.correct)||0))),
  passed:Math.max(0,Math.min(99999,Math.floor(Number(v.passed)||0))),
  turnCorrect:Math.max(0,Math.min(99999,Math.floor(Number(v.turnCorrect)||0))),
  turnPassed:Math.max(0,Math.min(99999,Math.floor(Number(v.turnPassed)||0))),
  turns:Math.max(0,Math.min(99999,Math.floor(Number(v.turns)||0))),sound:v.sound!==false};
 if(state.phase==='playing')state.phase='paused';// 새로고침 이후 자동으로 타이머가 시작되지 않도록
 if(state.phase==='ready'&&state.remaining<=0)state.remaining=duration;
 const selected=charadesPoolItems(state);
 const keys=new Set(selected.map(x=>x.key));
 const used=Array.isArray(v.used)?v.used.filter(x=>typeof x==='string'&&keys.has(x)).slice(-200):[];
 state.used=Array.from(new Set(used));
 if(v.current&&typeof v.current==='object'&&typeof v.current.id==='string'&&typeof v.current.word==='string'){
  state.current=selected.find(x=>x.id===v.current.id&&x.word===v.current.word)||null;
 }
 if(state.phase==='ended')state.remaining=0;
 return state;
}
function charadesState(){const c=activeClass();return c.charades||(c.charades=makeDefaultCharades());}
function charadesStopClock(){if(charadesTickId!==null){clearInterval(charadesTickId);charadesTickId=null;}charadesDeadline=0;}
function charadesRefreshClock(){
 const s=charadesState(),el=document.getElementById('charadesSeconds'),bar=document.getElementById('charadesTimerFill');
 if(el)el.textContent=String(s.remaining).padStart(2,'0')+'초';
 if(bar)bar.style.width=(100*s.remaining/s.duration)+'%';
 const parent=document.getElementById('charadesClock');
 if(parent)parent.classList.toggle('charades-clock-urgent',s.remaining<=10&&s.remaining>0);
}
function charadesTick(){
 const s=charadesState();if(s.phase!=='playing')return;
 const remaining=Math.max(0,Math.ceil((charadesDeadline-Date.now())/1000));
 if(remaining===s.remaining)return;
 s.remaining=remaining;charadesRefreshClock();save();
 if(!remaining)charadesFinish();
}
function charadesPause(){
 const s=charadesState();if(s.phase!=='playing')return;
 s.remaining=Math.max(0,Math.ceil((charadesDeadline-Date.now())/1000));
 charadesStopClock();if(s.remaining===0){charadesFinish();return;}
 s.phase='paused';charadesNotice='⏸️ 잠깐 멈췄어요. 이어하기를 누르면 다시 시작해요.';
 save();render();
}
function charadesFinish(){
 const s=charadesState();if(s.phase==='ended')return;
 charadesStopClock();s.phase='ended';s.remaining=0;s.reveal=false;s.turns++;
 charadesNotice='⏰ 시간이 끝났어요! '+s.teamNames[s.team]+'의 도전을 마쳤어요.';
 if(s.sound){soundUnlock();beep();}
 save();render();
}
function charadesLeave(){
 const s=charadesState();
 if(s.phase==='playing'){
  s.remaining=Math.max(0,Math.ceil((charadesDeadline-Date.now())/1000));
  s.phase=s.remaining?'paused':'ended';if(!s.remaining)s.turns++;save();
 }
 charadesStopClock();charadesFull=false;document.body.classList.remove('charades-fullscreen');
 charadesEditorOpen=false;charadesUndoData=null;charadesNotice='';
}
function charadesToggleFull(){
 charadesFull=!charadesFull;if(charadesFull)charadesEditorOpen=false;
 document.body.classList.toggle('charades-fullscreen',charadesFull);
 render();if(charadesFull)window.scrollTo({top:0,behavior:'instant'});
}
function charadesPickNew(s){
 const all=charadesPoolItems(s);if(!all.length){s.current=null;return;}
 const available=all.filter(item=>!s.used.includes(item.key));
 let choices=available;
 if(!choices.length){s.used=[];choices=all.length>1?all.filter(x=>x.key!==(s.current?.key)):all;}
 const picked=choices[Math.floor(Math.random()*choices.length)];
 s.current={...picked};s.used.push(picked.key);s.reveal=false;
}
function charadesStart(){
 const s=charadesState();if(s.phase==='ended')return toast('먼저 다음 모둠 또는 다시 시작을 선택해 주세요.');
 if(s.phase==='playing')return;
 if(s.remaining<=0)s.remaining=s.duration;
 if(!s.current)charadesPickNew(s);
 s.phase='playing';charadesNotice='🎬 몸짓으로 표현하고 친구들이 맞혀 보세요!';
 charadesStopClock();charadesDeadline=Date.now()+s.remaining*1000;
 charadesTickId=setInterval(charadesTick,200);save();render();
}
function charadesToggleReveal(){
 const s=charadesState();if(s.phase==='ended')return;
 if(!s.current)charadesPickNew(s);
 s.reveal=!s.reveal;save();render();
}
function charadesMark(right){
 const s=charadesState();if(s.phase!=='playing')return toast('시간 시작 버튼을 누른 후 정답·통과를 기록할 수 있어요.');
 if(!s.current)charadesPickNew(s);
 charadesUndoData={classId:activeClass().id,team:s.team,current:{...s.current},used:s.used.slice(),scores:s.scores.slice(),
  correct:s.correct,passed:s.passed,turnCorrect:s.turnCorrect,turnPassed:s.turnPassed};
 if(right){s.scores[s.team]=Math.min(99999,s.scores[s.team]+1);s.correct++;s.turnCorrect++;charadesNotice='⭐ 정답! 멋져요! 다음 제시어에 도전해요.';}
 else{s.passed++;s.turnPassed++;charadesNotice='🌷 괜찮아요! 다음 제시어를 뽑았어요.';}
 charadesPickNew(s);save();render();
}
function charadesUndo(){
 const s=charadesState(),a=charadesUndoData;
 if(!a||a.classId!==activeClass().id||a.team!==s.team||s.phase==='ended')return toast('되돌릴 직전 판정이 없어요.');
 s.current={...a.current};s.used=a.used.slice();s.scores=a.scores.slice();s.correct=a.correct;s.passed=a.passed;
 s.turnCorrect=a.turnCorrect;s.turnPassed=a.turnPassed;s.reveal=false;
 charadesUndoData=null;charadesNotice='↩ 직전 정답·통과 판정을 취소했어요.';save();render();
}
function charadesNextTurn(){
 const s=charadesState();
 if(s.phase==='playing'||s.phase==='paused'){
  if(!confirm('현재 차례를 종료하고 다음 차례를 시작할까요? 남은 시간은 사라집니다.'))return;
  s.turns++;
 }
 charadesStopClock();s.team=s.teamCount===1?0:(s.team+1)%s.teamCount;
 s.phase='ready';s.remaining=s.duration;s.turnCorrect=0;s.turnPassed=0;s.reveal=false;
 charadesPickNew(s);charadesUndoData=null;charadesNotice='🎭 '+s.teamNames[s.team]+'의 새로운 차례예요!';
 save();render();
}
function charadesResetScores(){
 const s=charadesState();
 if((s.scores.some(Boolean)||s.correct||s.passed||s.turns)&&!confirm('모든 모둠 점수와 게임 진행 기록을 초기화할까요? 제시어 목록은 유지됩니다.'))return;
 charadesStopClock();s.scores=[0,0,0,0];s.correct=0;s.passed=0;s.turns=0;s.team=0;s.turnCorrect=0;s.turnPassed=0;
 s.phase='ready';s.remaining=s.duration;s.current=null;s.used=[];s.reveal=false;
 charadesUndoData=null;charadesNotice='✨ 새 게임을 시작해요!';save();render();
}
function charadesScore(i,delta){
 const s=charadesState();if(!Number.isInteger(i)||i<0||i>=s.teamCount||![-1,1].includes(delta))return;
 s.scores[i]=Math.max(0,Math.min(99999,s.scores[i]+delta));
 charadesUndoData=null;save();render();
}
function charadesParsePool(raw,label){
 const lines=String(raw??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(lines.length<3||lines.length>40)return {error:label+' 제시어는 3~40개로 등록해 주세요.'};
 if(lines.some(x=>x.length>55))return {error:label+' 제시어는 55자 이내로 작성해 주세요.'};
 if(new Set(lines).size!==lines.length)return {error:label+'에 중복된 제시어가 있어요.'};
 return {words:lines};
}
function charadesSaveSettings(){
 const s=charadesState();
 const category=document.getElementById('charadesCategory')?.value;
 if(category!=='all'&&!CHARADES_IDS.includes(category))return toast('제시어 주제를 선택해 주세요.');
 const duration=Number(document.getElementById('charadesDuration')?.value);
 const teamCount=Number(document.getElementById('charadesTeamCount')?.value);
 if(!CHARADES_DURATIONS.includes(duration)||![1,2,3,4].includes(teamCount))return toast('제한시간 또는 모둠 수를 확인해 주세요.');
 const pools={},names=[];
 for(const cat of CHARADES_CATEGORIES){
  const result=charadesParsePool(document.getElementById('charadesPool'+cat.id)?.value,cat.label);
  if(result.error)return toast(result.error);
  pools[cat.id]=result.words;
 }
 for(let i=0;i<4;i++){
  const name=String(document.getElementById('charadesTeamName'+i)?.value??'').trim();
  if(!name||name.length>24)return toast('모둠 이름은 1~24자로 입력해 주세요.');
  names.push(name);
 }
 if(new Set(names.slice(0,teamCount)).size!==teamCount)return toast('모둠 이름은 중복 없이 작성해 주세요.');
 const deckChanged=category!==s.category||CHARADES_IDS.some(id=>JSON.stringify(s.pools[id])!==JSON.stringify(pools[id]));
 const formatChanged=duration!==s.duration||teamCount!==s.teamCount;
 if((deckChanged||formatChanged)&&(s.phase!=='ready'||s.scores.some(Boolean)||s.correct||s.passed)&&
 !confirm('문제 주제·제한시간·모둠 구성을 바꾸면 진행 중인 차례가 초기화됩니다. 모둠 수가 바뀌면 점수도 초기화됩니다. 계속할까요?'))return;
 if(deckChanged||formatChanged){
  charadesStopClock();s.phase='ready';s.remaining=duration;s.current=null;s.used=[];s.reveal=false;
  s.turnCorrect=0;s.turnPassed=0;charadesUndoData=null;
 }
 if(teamCount!==s.teamCount){s.scores=[0,0,0,0];s.correct=0;s.passed=0;s.turns=0;s.team=0;}
 s.category=category;s.duration=duration;s.teamCount=teamCount;s.teamNames=names;s.pools=pools;
 if(s.team>=teamCount)s.team=0;
 charadesEditorOpen=false;charadesNotice='💾 교실 놀이 설정을 저장했어요!';
 save();render();toast('몸으로 표현해요! 설정을 저장했어요.');
}
function charadesResetWords(){
 const s=charadesState();
 if(!confirm('기본 제시어를 다시 불러올까요? 직접 작성한 제시어는 사라지지만 모둠 점수는 유지됩니다.'))return;
 charadesStopClock();s.pools=charadesDefaultPools();s.used=[];s.current=null;s.reveal=false;
 s.remaining=s.duration;s.phase='ready';s.turnCorrect=0;s.turnPassed=0;charadesUndoData=null;
 charadesEditorOpen=false;charadesNotice='🌈 기본 제시어를 다시 불러왔어요.';
 save();render();
}
function charadesCategoryName(s){return s.category==='all'?'🌈 모든 주제 섞기':CHARADES_CATEGORIES.find(x=>x.id===s.category)?.label||'제시어';}
function charadesBoard(){
 const s=charadesState(),playing=s.phase==='playing',ended=s.phase==='ended',visible=s.reveal&&!ended;
 return '<section class="charades-board" aria-label="몸으로 표현해요 몸짓 게임">'+
 '<div class="charades-hero"><div><span>🎭 별이와 송이의 신나는 몸짓 놀이!</span><h2>몸으로 표현해요!</h2>'+
 '<p>말 대신 몸짓으로 표현하고 친구들이 맞혀 보세요.</p></div><div class="charades-mascot" aria-hidden="true">🌟🐿️🎭</div></div>'+
 '<div class="charades-metadata"><span>'+escapeHtml(charadesCategoryName(s))+'</span><span>👥 '+escapeHtml(s.teamNames[s.team])+' 차례</span><span>⭐ 이번 차례 정답 '+s.turnCorrect+'개</span>'+
 '<span>🌷 통과 '+s.turnPassed+'개</span></div>'+
 '<div id="charadesClock" class="charades-clock'+(s.remaining<=10&&s.remaining>0?' charades-clock-urgent':'')+'"><span>⏳ 남은 시간</span>'+
 '<strong id="charadesSeconds">'+String(s.remaining).padStart(2,'0')+'초</strong>'+
 '<div class="charades-time-track"><span id="charadesTimerFill" style="width:'+(100*s.remaining/s.duration)+'%"></span></div></div>'+
 (ended?'<div class="charades-finish" role="status"><span>🎉👏🌟</span><h3>이번 차례가 끝났어요!</h3><p>'+escapeHtml(s.teamNames[s.team])+' · 정답 '+s.turnCorrect+'개 · 통과 '+s.turnPassed+'개</p></div>':
 '<div class="charades-prompt"><p class="charades-prompt-label">🪄 송이의 비밀 제시어</p>'+
 (visible?'<div class="charades-visible-word" role="status">'+escapeHtml(s.current?.word||'준비된 제시어가 없어요')+'</div>':
 '<div class="charades-hidden-word" aria-label="제시어 가림">🔒 비밀 제시어<br><small>교사가 공개 버튼을 누르면 나타나요!</small></div>')+
 '<div class="charades-prompt-actions"><button type="button" class="btn btn-outline" id="charadesReveal">'+(visible?'🙈 제시어 가리기':'👀 제시어 잠깐 공개')+'</button></div>'+
 '<p class="charades-prompt-help">💡 공개할 때는 정답을 맞힐 친구들이 화면을 보지 않도록 해 주세요. 공개 후 다시 가릴 수 있습니다.</p></div>')+
 (charadesNotice?'<div class="charades-notice" role="status">'+escapeHtml(charadesNotice)+'</div>':'')+
 '</section>';
}
function charadesScoreBoard(){
 const s=charadesState();return '<section class="charades-scoreboard"><div class="charades-score-head"><h3>🏆 우리 반 점수판</h3><span>이번 활동 누적 정답 '+s.correct+'개 · 전체 통과 '+s.passed+'개</span></div>'+
 '<div class="charades-score-grid charades-score-grid-'+s.teamCount+'">'+Array.from({length:s.teamCount},(_,i)=>
 '<div class="charades-score-card'+(s.team===i?' charades-score-current':'')+'">'+
 '<strong>'+escapeHtml(s.teamNames[i])+(s.team===i?' ✨':'')+'</strong>'+
 '<span>'+s.scores[i]+'점</span>'+
 '<div class="charades-score-actions"><button type="button" class="btn btn-outline btn-small" data-charades-score="'+i+'" data-charades-delta="-1" aria-label="'+escapeHtml(s.teamNames[i])+' 점수 1점 줄이기" '+(!s.scores[i]?'disabled':'')+'>−</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-charades-score="'+i+'" data-charades-delta="1" aria-label="'+escapeHtml(s.teamNames[i])+' 점수 1점 늘리기">+1</button></div></div>').join('')+'</div></section>';
}
function charadesControls(){
 const s=charadesState(),running=s.phase==='playing',ended=s.phase==='ended';
 return '<div class="charades-controls">'+
 (!ended?'<button type="button" class="btn btn-primary" id="charadesStart">'+(running?'⏸️ 잠깐 멈추기':s.phase==='paused'?'▶️ 이어하기':'▶️ 시간 시작')+'</button>':'')+
 (running?'<button type="button" class="btn btn-primary" id="charadesCorrect">⭐ 정답! +1점</button>'+
 '<button type="button" class="btn btn-secondary" id="charadesPass">🌷 통과</button>':'')+
 '<button type="button" class="btn btn-outline" id="charadesUndo" '+(!charadesUndoData||charadesUndoData.classId!==activeClass().id||ended?'disabled':'')+'>↩ 직전 판정 취소</button>'+
 '<button type="button" class="btn btn-outline" id="charadesNext">🎬 '+(s.teamCount===1?'다음 차례':'다음 모둠')+'</button>'+
 '<button type="button" class="btn btn-outline" id="charadesReset">🔄 점수·진행 초기화</button>'+
 '<button type="button" class="btn btn-outline" id="charadesFull">'+(charadesFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!charadesFull?'<button type="button" class="btn btn-outline" id="charadesEdit">'+(charadesEditorOpen?'✕ 설정 닫기':'⚙️ 제시어·모둠 편집')+'</button>':'')+
 '</div>';
}
function charadesEditor(){
 const s=charadesState();
 return '<section class="panel charades-editor"><h2>👩‍🏫 몸짓 놀이 준비하기</h2>'+
 '<p>학생 개별 접속 없이 한 대의 PC에서 제시어와 시간을 관리합니다. 모둠 수를 변경하면 현재 점수가 초기화될 수 있습니다.</p>'+
 '<div class="charades-editor-grid">'+
 '<label>제시어 주제<select class="field" id="charadesCategory"><option value="all" '+(s.category==='all'?'selected':'')+'>🌈 모든 주제 섞기</option>'+
 CHARADES_CATEGORIES.map(x=>'<option value="'+x.id+'" '+(x.id===s.category?'selected':'')+'>'+escapeHtml(x.label)+'</option>').join('')+'</select></label>'+
 '<label>한 차례 제한시간<select class="field" id="charadesDuration">'+CHARADES_DURATIONS.map(n=>'<option value="'+n+'" '+(s.duration===n?'selected':'')+'>'+n+'초</option>').join('')+'</select></label>'+
 '<label>모둠 수<select class="field" id="charadesTeamCount">'+[1,2,3,4].map(n=>'<option value="'+n+'" '+(s.teamCount===n?'selected':'')+'>'+ (n===1?'우리 반 함께':'모둠 '+n+'개')+'</option>').join('')+'</select></label></div>'+
 '<div class="charades-team-names">'+Array.from({length:4},(_,i)=>
 '<label>'+(i===0?'우리 반 또는 1모둠':(i+1)+'모둠')+' 이름<input class="field" id="charadesTeamName'+i+'" maxlength="24" value="'+escapeHtml(s.teamNames[i])+'"></label>').join('')+'</div>'+
 '<h3>🎫 제시어 직접 편집</h3><p>한 줄에 제시어 하나씩 입력합니다. 주제당 3~40개까지 가능하며, 같은 제시어는 중복 등록하지 않습니다.</p>'+
 '<div class="charades-editor-pools">'+CHARADES_CATEGORIES.map(x=>
 '<details><summary>'+escapeHtml(x.label)+' 제시어 ('+s.pools[x.id].length+'개)</summary>'+
 '<textarea class="field" id="charadesPool'+x.id+'" rows="9" spellcheck="false" placeholder="한 줄에 제시어 하나">'+escapeHtml(s.pools[x.id].join('\n'))+'</textarea></details>').join('')+'</div>'+
 '<div class="charades-editor-actions"><button type="button" class="btn btn-primary" id="charadesSave">💾 설정·제시어 저장</button>'+
 '<button type="button" class="btn btn-outline" id="charadesDefaultWords">🎁 기본 제시어 복구</button>'+
 '<button type="button" class="btn btn-outline" id="charadesSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div>'+
 '</section>';
}
function charadesSound(){const s=charadesState();s.sound=!s.sound;save();render();}
function renderCharades(){
 return (charadesFull?'<div class="charades-full-head"><strong>🎭 몸으로 표현해요!</strong><button type="button" class="btn btn-outline btn-small" id="charadesFull">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','몸으로 표현해요!','말하지 않고 동작으로 표현해 제시어를 맞히는 몸짓 놀이입니다.','🎭'))+
 '<div class="charades-layout">'+charadesBoard()+charadesScoreBoard()+charadesControls()+
 (!charadesFull&&charadesEditorOpen?charadesEditor():'')+
 (!charadesFull?'<p class="charades-foot">🔒 학생 로그인·QR 접속·서버 통신 없이 교사 PC 한 대로 진행합니다. 제시어와 점수는 학급별로 저장돼요.</p>':'')+
 '</div>';
}
