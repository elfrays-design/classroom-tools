/* v1.30 초성 맞히기 게임 — 한글 정답 초성, 3단계 힌트, 제한시간 */
'use strict';
let initialFull=false,initialEditIndex=0,initialInterval=null;
const INITIAL_ONSETS=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const INITIAL_MAX=20,INITIAL_TIMES=[0,15,30,45,60,90];
const INITIAL_SAMPLES=[
 {answer:'무지개',hints:['비가 그친 뒤 하늘에서 볼 수 있어요.','빛이 여러 색으로 나뉘는 현상이에요.','빨강부터 보라까지 일곱 빛깔이에요.']},
 {answer:'태양계',hints:['과학 시간에 배우는 우주의 한 부분이에요.','지구와 여러 행성이 속해 있어요.','태양을 중심으로 행성들이 공전해요.']},
 {answer:'광합성',hints:['식물에게 꼭 필요한 과정이에요.','햇빛을 이용하여 양분을 만들어요.','잎의 엽록체에서 일어나는 작용이에요.']},
 {answer:'도서관',hints:['조용히 이용하는 공간이에요.','책을 빌리거나 읽을 수 있어요.','책과 독서 자료가 모여 있어요.']},
 {answer:'지구 온난화',hints:['환경 문제와 관계가 있어요.','지구의 평균 기온이 올라가고 있어요.','온실가스 증가가 주요 원인 중 하나예요.']}
];
function initialNewQuestion(sample=null){return {id:safeId(),answer:sample?.answer||'',hints:[0,1,2].map(i=>String(sample?.hints?.[i]||'').slice(0,220))};}
function makeDefaultInitial(){return {title:'도전! 초성 맞히기',questions:INITIAL_SAMPLES.map(initialNewQuestion),index:0,limit:45,remaining:45000,since:0,running:false,timeup:false,hintCount:0,revealed:false,solved:[],sound:true};}
function initialInitials(word){
 const result=[];
 for(const ch of String(word||'').trim()){
  const n=ch.codePointAt(0);
  if(n>=0xac00&&n<=0xd7a3)result.push(INITIAL_ONSETS[Math.floor((n-0xac00)/588)]);
  else if(/\s/.test(ch))result.push(' ');
  else if(/[ㄱ-ㅎ]/.test(ch))result.push(ch);
  else if(/[a-zA-Z0-9가-힣]/.test(ch))result.push('□');
 }
 return result.join('').replace(/ +/g,' ').trim()||'❓';
}
function normalizeInitial(raw){
 const d=makeDefaultInitial(),v=raw&&typeof raw==='object'?raw:{},ids=new Set();
 const questions=Array.isArray(v.questions)&&v.questions.length?v.questions.slice(0,INITIAL_MAX).filter(x=>x&&typeof x==='object').map(x=>{
  let id=String(x.id||safeId()).slice(0,90);if(ids.has(id))id=safeId();ids.add(id);
  const hints=Array.isArray(x.hints)?x.hints.slice(0,3).map(k=>String(k??'').slice(0,220)):[];
  while(hints.length<3)hints.push('');
  return {id,answer:String(x.answer||'').slice(0,90),hints};
 }):d.questions;
 if(!questions.length)questions.push(initialNewQuestion());
 const limit=INITIAL_TIMES.includes(Number(v.limit))?Number(v.limit):45;
 const max=limit*1000;
 const remaining=limit===0?0:clamp(Math.floor(Number(v.remaining??max))-(v.running?Math.max(0,Date.now()-(Number(v.since)||Date.now())):0),0,max);
 const index=clamp(Math.floor(Number(v.index)||0),0,questions.length-1);
 const solved=Array.isArray(v.solved)?v.solved.filter(id=>ids.has(id)).filter((id,i,a)=>a.indexOf(id)===i).slice(0,INITIAL_MAX):[];
 return {title:String(v.title||d.title).slice(0,90),questions,index,limit,remaining,since:0,running:false,
 timeup:limit>0&&(remaining===0)&&(v.running===true||v.timeup===true),
 hintCount:clamp(Math.floor(Number(v.hintCount)||0),0,3),revealed:v.revealed===true,solved,sound:v.sound!==false};
}
function initialState(){const c=activeClass();return c.initial||(c.initial=makeDefaultInitial());}
function initialCurrent(s=initialState()){return s.questions[s.index];}
function initialStop(){if(initialInterval!==null){clearInterval(initialInterval);initialInterval=null;}}
function initialTimeLeft(s=initialState()){return s.limit===0?0:Math.max(0,s.remaining-(s.running?Math.max(0,Date.now()-s.since):0));}
function initialClock(ms){const sec=Math.ceil(ms/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function initialTick(){
 const s=initialState();if(!s.running){initialStop();return;}
 const left=initialTimeLeft(s),clock=document.getElementById('initialClock'),bar=document.getElementById('initialTimeBar');
 if(clock)clock.textContent=initialClock(left);
 if(bar)bar.style.width=(s.limit?Math.min(100,100*left/(s.limit*1000)):0).toFixed(2)+'%';
 if(left<=0){s.remaining=0;s.running=false;s.timeup=true;s.since=0;initialStop();
  if(s.sound)beep();save();if(currentView==='initial')render();toast('⏰ 제한시간이 끝났습니다! 힌트나 정답을 공개할 수 있어요.');}
}
function initialPause(){
 const s=initialState();
 if(s.running){s.remaining=initialTimeLeft(s);s.since=0;s.running=false;save();}
 initialStop();
}
function initialStart(){
 const s=initialState(),question=initialCurrent(s);
 if(!question?.answer.trim())return toast('정답을 먼저 입력해 주세요.');
 if(s.limit===0)return toast('제한시간이 없는 모드입니다. 힌트와 정답 공개를 이용하세요.');
 if(s.revealed)return toast('정답이 공개된 문제입니다. 다음 문제로 이동하거나 다시 시작해 주세요.');
 if(s.running){initialPause();render();return;}
 if(s.remaining<=0){return toast('시간이 끝났습니다. 같은 문제를 다시 풀려면 「시간 다시 시작」을 누르세요.');}
 soundUnlock();s.running=true;s.since=Date.now();s.timeup=false;
 initialStop();initialInterval=setInterval(initialTick,170);save();render();initialTick();
}
function initialResetTime(){
 const s=initialState();initialPause();s.remaining=s.limit*1000;s.timeup=false;save();render();
}
function initialRevealHint(){
 const s=initialState(),q=initialCurrent(s);
 if(!q?.answer.trim())return toast('정답을 먼저 입력해 주세요.');
 if(s.revealed)return;
 if(s.hintCount>=3)return toast('모든 힌트를 공개했습니다.');
 s.hintCount++;save();render();
}
function initialReveal(){
 const s=initialState(),q=initialCurrent(s);
 if(!q?.answer.trim())return toast('정답을 먼저 입력해 주세요.');
 if(s.revealed)return;
 initialPause();s.revealed=true;if(s.sound){soundUnlock();beep();}
 save();render();
}
function initialMarkSolved(){
 const s=initialState(),q=initialCurrent(s);if(!q?.answer.trim())return;
 initialPause();s.revealed=true;
 if(!s.solved.includes(q.id)){s.solved.push(q.id);if(s.sound){soundUnlock();beep();}}
 save();render();toast('🎉 정답 성공! 멋져요!');
}
function initialResetRound(s=initialState()){
 initialStop();s.running=false;s.since=0;s.remaining=s.limit*1000;s.timeup=false;s.hintCount=0;s.revealed=false;
}
function initialMove(direction){
 const s=initialState(),to=s.index+direction;
 if(to<0||to>=s.questions.length)return;
 initialResetRound(s);s.index=to;initialEditIndex=to;save();render();
}
function initialGo(index){
 const s=initialState();if(!Number.isInteger(index)||index<0||index>=s.questions.length)return;
 if(index===s.index){initialEditIndex=index;render();return;}
 initialResetRound(s);s.index=index;initialEditIndex=index;save();render();
}
function initialRestart(){
 const s=initialState();
 if((s.index||s.solved.length||s.hintCount||s.revealed||s.running)&&!confirm('1번부터 다시 시작하며 정답 기록도 초기화할까요? 입력한 문제와 힌트는 유지됩니다.'))return;
 initialResetRound(s);s.index=0;initialEditIndex=0;s.solved=[];save();render();
}
function initialShuffle(){
 const s=initialState();
 if((s.index||s.solved.length||s.hintCount||s.revealed)&&!confirm('문제 순서를 섞고 정답 기록을 초기화할까요?'))return;
 const old=s.questions.map(q=>q.id).join(',');
 s.questions=shuffled(s.questions);
 if(s.questions.length>1&&s.questions.map(q=>q.id).join(',')===old)[s.questions[0],s.questions[1]]=[s.questions[1],s.questions[0]];
 initialResetRound(s);s.index=0;initialEditIndex=0;s.solved=[];save();render();toast('🎲 문제 순서를 무작위로 섞었습니다!');
}
function initialSetLimit(value){
 const v=Number(value);if(!INITIAL_TIMES.includes(v))return;
 const s=initialState();initialResetRound(s);s.limit=v; s.remaining=v*1000;save();render();
}
function initialEditTarget(){const s=initialState();initialEditIndex=clamp(initialEditIndex,0,s.questions.length-1);return s.questions[initialEditIndex];}
function initialEditField(id,field,value){
 const s=initialState(),q=s.questions.find(x=>x.id===id);if(!q)return;
 const text=String(value??'');
 if(field==='answer')q.answer=text.slice(0,90);
 else if(/^hint[012]$/.test(field))q.hints[Number(field.slice(-1))]=text.slice(0,220);
 else return;
 s.solved=s.solved.filter(v=>v!==q.id);
 if(q.id===initialCurrent(s).id)initialResetRound(s);
 save();initialRefreshPreview();
}
function initialSetTitle(value){
 const s=initialState();s.title=String(value??'').slice(0,90);save();
 const x=document.getElementById('initialBoardTitle');if(x)x.textContent=s.title||'도전! 초성 맞히기';
}
function initialEditSelect(index){
 const s=initialState();if(index<0||index>=s.questions.length)return;
 initialEditIndex=index;render();
}
function initialAdd(){
 const s=initialState();if(s.questions.length>=INITIAL_MAX)return toast('최대 20문제까지 만들 수 있습니다.');
 s.questions.push(initialNewQuestion());initialEditIndex=s.questions.length-1;save();render();
}
function initialRemove(){
 const s=initialState();if(s.questions.length<=1)return toast('최소 1개의 문제는 필요합니다.');
 const index=initialEditIndex;
 if(!confirm((index+1)+'번 문제를 삭제할까요?'))return;
 initialPause();
 const [q]=s.questions.splice(index,1);s.solved=s.solved.filter(id=>id!==q.id);
 if(index<s.index)s.index--;
 else if(index===s.index){s.index=Math.min(s.index,s.questions.length-1);initialResetRound(s);}
 initialEditIndex=Math.min(index,s.questions.length-1);save();render();
}
function initialRestoreExamples(){
 if(!confirm('작성한 문제를 기본 예시 5문제로 교체하고 진행 기록을 초기화할까요?'))return;
 const s=initialState();initialResetRound(s);s.questions=INITIAL_SAMPLES.map(initialNewQuestion);s.index=0;initialEditIndex=0;s.solved=[];save();render();
}
function initialCopy(){
 const s=initialState();
 copyText([s.title,...s.questions.map((q,i)=>(i+1)+'. '+initialInitials(q.answer)+' / 정답: '+q.answer+
  (s.solved.includes(q.id)?' [성공]':'')+'\n'+q.hints.filter(Boolean).map((h,j)=>'   힌트 '+(j+1)+': '+h).join('\n'))].join('\n'));
}
function initialFullToggle(){
 initialFull=!initialFull;document.body.classList.toggle('initial-fullscreen',initialFull);
 render();if(initialFull)window.scrollTo({top:0,behavior:'instant'});
}
function initialExitFull(){initialFull=false;document.body.classList.remove('initial-fullscreen');}
function initialLeave(){initialPause();initialExitFull();}
function initialBoard(){
 const s=initialState(),q=initialCurrent(s),solved=s.solved.includes(q.id);
 const hints=Array.from({length:3},(_,i)=>'<div class="initial-hint '+(i<s.hintCount?'initial-hint-shown':'')+'">'+
 '<span>💡 힌트 '+(i+1)+'</span><strong>'+ (i<s.hintCount?escapeHtml(q.hints[i]||'등록된 힌트가 없어요.'): '🔒 아직 비밀이에요!') +'</strong></div>').join('');
 const display=s.revealed?'<div class="initial-revealed '+(solved?'initial-success':'')+'" role="status">'+(solved?'🎉 정답 성공!':'✨ 정답 공개')+
 '<strong>'+escapeHtml(q.answer||'입력된 정답이 없습니다.')+'</strong></div>':
 '<div class="initial-thinking">🤔 초성을 보고 답을 생각해 보세요!</div>';
 return '<section id="initialLiveBoard" class="initial-board '+(s.timeup?'initial-board-timeup':'')+'">'+
 '<header class="initial-board-head"><div><small>🔤 우리 반 초성 맞히기</small><h2 id="initialBoardTitle">'+escapeHtml(s.title||'도전! 초성 맞히기')+'</h2></div>'+
 '<div class="initial-round-count"><strong>'+(s.index+1)+' / '+s.questions.length+' 문제</strong><small>정답 성공 '+s.solved.length+'개</small></div></header>'+
 '<div class="initial-game-center"><div class="initial-challenge-label">🔎 다음 초성을 보고 정답을 맞혀 보세요!</div>'+
 '<h3 aria-label="초성 문제">'+escapeHtml(initialInitials(q.answer))+'</h3>'+
 '<div class="initial-hints">'+hints+'</div>'+
 (s.limit===0?'<div class="initial-free-time">⏳ 제한시간 없이 도전해 보세요!</div>':
 '<div class="initial-time"><span>남은 시간</span><strong id="initialClock">'+initialClock(initialTimeLeft(s))+'</strong>'+
 (s.timeup?'<em>⏰ 시간 종료!</em>':'')+'</div><div class="initial-time-track"><div id="initialTimeBar" style="width:'+Math.min(100,100*initialTimeLeft(s)/(s.limit*1000)).toFixed(2)+'%"></div></div>')+
 display+'</div>'+
 '<footer class="initial-board-foot"><span>학생들과 함께 생각하고 맞혀 보세요! 🌈</span><span>'+ (s.revealed?'✅ 정답 공개됨':'🔒 정답 비공개')+'</span></footer>'+
 '</section>';
}
function initialControls(){
 const s=initialState(),q=initialCurrent(s),hasAnswer=!!q.answer.trim(),timeMode=s.limit>0;
 return '<section class="initial-controls"><div class="initial-controls-title"><strong>👩‍🏫 교사용 게임 조작</strong><small>정답과 힌트는 선생님이 공개합니다.</small></div>'+
 '<div class="initial-control-buttons">'+
 '<button class="btn btn-outline" type="button" id="initialPrev" '+(s.index===0?'disabled':'')+'>← 이전 문제</button>'+
 (timeMode?'<button class="btn btn-outline" type="button" id="initialStart" '+(!hasAnswer||s.revealed?'disabled':'')+'>'+ (s.running?'⏸ 일시정지':s.remaining===0?'⏰ 시간 종료':'▶ '+(s.remaining<s.limit*1000?'계속':'시간 시작'))+'</button>'+
 '<button class="btn btn-outline" type="button" id="initialTimeReset">↺ 시간 초기화</button>':'')+
 '<button class="btn btn-secondary" type="button" id="initialHint" '+(!hasAnswer||s.hintCount>=3||s.revealed?'disabled':'')+'>💡 힌트 '+Math.min(3,s.hintCount+1)+' 공개</button>'+
 '<button class="btn btn-primary" type="button" id="initialReveal" '+(!hasAnswer||s.revealed?'disabled':'')+'>✨ 정답 공개</button>'+
 '<button class="btn btn-secondary" type="button" id="initialSolved" '+(!hasAnswer||s.solved.includes(q.id)?'disabled':'')+'>🎉 정답 맞혔어요!</button>'+
 '<button class="btn btn-outline" type="button" id="initialNext" '+(s.index===s.questions.length-1?'disabled':'')+'>다음 문제 →</button></div></section>';
}
function initialRefreshPreview(){
 if(initialFull||currentView!=='initial')return;
 const e=document.getElementById('initialLiveBoard');if(!e)return;
 const temp=document.createElement('div');temp.innerHTML=initialBoard();e.replaceWith(temp.firstElementChild);
 const actions=document.querySelector('.initial-controls');
 if(actions){const t=document.createElement('div');t.innerHTML=initialControls();actions.replaceWith(t.firstElementChild);}
}
function initialEditor(){
 const s=initialState(),q=initialEditTarget();
 return '<section class="panel initial-editor"><div class="initial-editor-head"><h2>① 문제와 힌트 만들기</h2><span>최대 20문제</span></div>'+
 '<label class="initial-field-label">퀴즈 제목<input class="field" id="initialTitle" type="text" maxlength="90" value="'+escapeHtml(s.title)+'"></label>'+
 '<div class="initial-editor-settings"><label>제한시간<select id="initialLimit" class="field">'+INITIAL_TIMES.map(t=>'<option value="'+t+'" '+(s.limit===t?'selected':'')+'>'+(t?t+'초':'제한 없음')+'</option>').join('')+'</select></label>'+
 '<label class="initial-sound-label"><input type="checkbox" id="initialSound" '+(s.sound?'checked':'')+'> 🔊 알림음</label></div>'+
 '<div class="initial-edit-tabs">'+s.questions.map((v,i)=>'<button type="button" class="initial-edit-chip '+(i===initialEditIndex?'is-editing ':'')+(i===s.index?'is-playing':'')+'" data-initial-edit="'+i+'">'+(i+1)+'번 '+(s.solved.includes(v.id)?'✅':'')+'</button>').join('')+'</div>'+
 '<div class="initial-editor-actions"><button class="btn btn-outline btn-small" type="button" id="initialAdd" '+(s.questions.length>=INITIAL_MAX?'disabled':'')+'>＋ 문제 추가</button>'+
 '<button class="btn btn-outline btn-small" type="button" id="initialDelete" '+(s.questions.length<=1?'disabled':'')+'>문제 삭제</button>'+
 '<button class="btn btn-outline btn-small" type="button" id="initialExamples">✨ 예시 문제</button></div>'+
 '<div class="initial-edit-card"><h3>✍️ '+(initialEditIndex+1)+'번 문제 편집</h3>'+
 '<label class="initial-field-label">정답<input class="field" data-initial-answer="'+escapeHtml(q.id)+'" maxlength="90" type="text" placeholder="예: 광합성" value="'+escapeHtml(q.answer)+'"></label>'+
 '<div class="initial-preview-onset">초성 자동 변환 <strong>'+escapeHtml(initialInitials(q.answer))+'</strong></div>'+
 [0,1,2].map(i=>'<label class="initial-field-label">💡 '+(i+1)+'단계 힌트<textarea class="field" rows="2" maxlength="220" data-initial-hint="'+i+'" data-initial-id="'+escapeHtml(q.id)+'" placeholder="학생들이 조금씩 정답을 떠올릴 수 있는 힌트">'+escapeHtml(q.hints[i])+'</textarea></label>').join('')+
 '</div><p class="initial-editor-note">한글을 입력하면 초성이 자동으로 만들어집니다. 교사용 편집 화면에는 정답이 보이지만, <strong>학생용 크게 보기에서는 정답 공개 전까지 정답이 표시되지 않습니다.</strong></p></section>';
}
function renderInitial(){
 if(initialFull)return '<div class="initial-full-head"><strong>🔤 초성 맞히기</strong><button type="button" class="btn btn-outline btn-small" id="initialFullExit">✕ 관리 화면으로</button></div>'+
 initialBoard()+initialControls();
 return title('교실 놀이·게임','초성 맞히기','정답을 입력하면 초성이 자동 생성되고, 힌트를 하나씩 공개하며 함께 맞힙니다.','🔤')+
 '<div class="initial-layout"><div>'+initialEditor()+'</div><div class="initial-play-area">'+
 '<div class="initial-play-head"><h2>② 학생용 초성 게임</h2><span>문제 '+(initialState().index+1)+'/'+initialState().questions.length+'</span></div>'+
 initialBoard()+initialControls()+
 '<div class="initial-management"><button type="button" class="btn btn-secondary" id="initialFull">⛶ 전자칠판 크게 보기</button>'+
 '<button type="button" class="btn btn-outline" id="initialRestart">↺ 1번부터 다시</button>'+
 '<button type="button" class="btn btn-outline" id="initialShuffle">🎲 문제 순서 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="initialCopy">📋 문제·정답 복사</button></div>'+
 '<div class="initial-jump"><strong>문제 바로가기</strong><div>'+initialState().questions.map((q,i)=>'<button type="button" class="btn btn-outline btn-small" data-initial-go="'+i+'" '+(i===initialState().index?'disabled':'')+'>'+(i+1)+'번</button>').join('')+'</div></div></div></div>';
}
