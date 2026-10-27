/* v1.23 수업 단계 진행판 — 학급별 저장·알림·시간 조절·전자칠판 */
'use strict';
let lessonFullscreen=false,lessonInterval=null;
const lessonTools=[
 {id:'',name:'연결 없음'},
 {id:'timer',name:'⏱️ 수업 타이머'},
 {id:'groups',name:'🧩 모둠 편성'},
 {id:'groupRoles',name:'🎭 모둠 역할 배정'},
 {id:'debate',name:'🗣️ 찬반 토론'},
 {id:'race',name:'🐰 발표 레이스'},
 {id:'speaker',name:'🎤 발표 스톱워치'},
 {id:'grading',name:'📝 채점 줄서기'},
 {id:'lessonQr',name:'🔗 수업 QR 안내'},
 {id:'dashboard',name:'🖥️ 우리 반 전자칠판'},
 {id:'notice',name:'📋 알림장 칠판'},
 {id:'picker',name:'🎯 랜덤 발표자'},
 {id:'roulette',name:'🎡 선택 룰렛'},
 {id:'quiz',name:'💡 즉석 확인 퀴즈판'}
];
function lessonPresetSteps(minutes){
 const defs=minutes===45?[
 ['💡 생각 열기',5],['📖 배움 준비',10],['🧩 모둠 활동',18],['🎤 결과 발표',8],['✅ 배운 내용 정리',4]
 ]:minutes===50?[
 ['💡 생각 열기',5],['📖 배움 준비',12],['🧩 모둠 활동',20],['🎤 결과 발표',9],['✅ 배운 내용 정리',4]
 ]:[
 ['💡 생각 열기',5],['📖 배움 준비',10],['🧩 모둠 활동',15],['🎤 결과 발표',7],['✅ 배운 내용 정리',3]
 ];
 return defs.map(([name,min])=>({id:safeId(),name,seconds:min*60,tool:''}));
}
function makeDefaultLesson(){
 return {title:'오늘의 수업',steps:lessonPresetSteps(40),index:0,status:'ready',
 elapsedMs:0,since:0,warned:false,warnings:true,sounds:true,actual:[],templates:[],finished:[]};
}
function lessonNormalizeStep(obj){
 if(!obj||typeof obj!=='object')return null;
 const name=String(obj.name||'수업 활동').trim().slice(0,65)||'수업 활동';
 return {id:String(obj.id||safeId()).slice(0,100),name,seconds:clamp(Math.floor(Number(obj.seconds)||300),5,7200),tool:lessonTools.some(x=>x.id===obj.tool)?obj.tool:''};
}
function normalizeLesson(raw){
 const d=makeDefaultLesson(),v=raw&&typeof raw==='object'?raw:{};
 const stepIds=new Set();
 const steps=Array.isArray(v.steps)&&v.steps.length?v.steps.slice(0,16).map(lessonNormalizeStep).filter(Boolean).map(s=>{if(stepIds.has(s.id))s.id=safeId();stepIds.add(s.id);return s;}):d.steps;
 const index=clamp(Math.floor(Number(v.index)||0),0,steps.length);
 const current=steps[index],maxMs=(current?.seconds||60)*1000+3600000;
 let elapsedMs=clamp(Math.floor(Number(v.elapsedMs)||0),0,maxMs);
 let status=['ready','running','paused','timeup','complete'].includes(v.status)?v.status:'ready';
 if(status==='running'){
  const since=Number(v.since)||Date.now();
  elapsedMs=clamp(elapsedMs+Math.max(0,Date.now()-since),0,maxMs);
  status=elapsedMs>=(current?.seconds||60)*1000?'timeup':'paused';
 }
 if(index>=steps.length)status='complete';
 else if(status==='complete')status='ready';
 if(!current)elapsedMs=0;
 const valid=new Set(steps.map(s=>s.id));
 const actual=Array.isArray(v.actual)?v.actual.slice(0,16).filter(x=>x&&valid.has(x.id)).map(x=>({id:x.id,ms:clamp(Math.floor(Number(x.ms)||0),0,36000000),completed:!!x.completed})):[];
 const templates=Array.isArray(v.templates)?v.templates.slice(-12).filter(t=>t&&typeof t==='object').map(t=>({
  id:String(t.id||safeId()).slice(0,100),name:String(t.name||'저장한 수업').slice(0,65),
  title:String(t.title||'오늘의 수업').slice(0,80),
  steps:Array.isArray(t.steps)?t.steps.slice(0,16).map(lessonNormalizeStep).filter(Boolean):d.steps
 })):[];
 const finished=Array.isArray(v.finished)?v.finished.slice(-15).filter(x=>x&&typeof x==='object').map(x=>({
  title:String(x.title||'수업').slice(0,80),date:String(x.date||'').slice(0,40),
  steps:clamp(Math.floor(Number(x.steps)||0),0,16),
  ms:clamp(Math.floor(Number(x.ms)||0),0,36000000)
 })):[];
 return {title:String(v.title||d.title).slice(0,80),steps,index,status,elapsedMs,since:0,
  warned:!!v.warned,warnings:v.warnings!==false,sounds:v.sounds!==false,
  actual,templates,finished};
}
function lessonData(){const c=activeClass();return c.lesson||(c.lesson=makeDefaultLesson());}
function lessonCurrent(d=lessonData()){return d.steps[d.index]||null;}
function lessonSpent(d=lessonData()){
 if(!lessonCurrent(d))return 0;
 return clamp(d.elapsedMs+(d.status==='running'?Math.max(0,Date.now()-d.since):0),0,10800000);
}
function lessonLeft(d=lessonData()){const x=lessonCurrent(d);return x?Math.max(0,x.seconds*1000-lessonSpent(d)):0;}
function lessonStamp(ms,ceil=false){const x=Math.max(0,ceil?Math.ceil(ms/1000):Math.floor(ms/1000));return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');}
function lessonStopTick(){if(lessonInterval!==null){clearInterval(lessonInterval);lessonInterval=null;}}
function lessonSoftAlert(){
 try{
  if(!audioContext)return;
  const ctx=audioContext,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.value=650;
  gain.gain.setValueAtTime(.001,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.03);
  gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);
  osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.24);
 }catch(e){}
}
function lessonTick(){
 const d=lessonData();if(d.status!=='running'){lessonStopTick();return;}
 const step=lessonCurrent(d);if(!step){lessonStopTick();return;}
 const spent=lessonSpent(d),left=Math.max(0,step.seconds*1000-spent);
 const clock=document.getElementById('lessonClock'),used=document.getElementById('lessonUsed'),bar=document.getElementById('lessonBar');
 if(clock)clock.textContent=lessonStamp(left,true);
 if(used)used.textContent=lessonStamp(spent);
 if(bar)bar.style.width=Math.min(100,spent*100/(step.seconds*1000)).toFixed(2)+'%';
 if(d.warnings&&!d.warned&&step.seconds>60&&spent>=1000&&left<=60000&&left>0){
  d.warned=true;
  if(d.sounds)lessonSoftAlert();
  save();
  if(currentView==='lesson')render();
  toast('🔔 '+step.name+' 종료 1분 전입니다.');
 }
 if(left<=0){
  d.status='timeup';d.elapsedMs=Math.min(spent,step.seconds*1000);d.since=0;lessonStopTick();
  if(d.sounds)beep();
  save();if(currentView==='lesson')render();
  toast('⏰ '+step.name+' 시간이 끝났습니다. +1분, +3분 또는 다음 단계를 선택하세요.');
 }
}
function lessonStart(){
 const d=lessonData();if(!lessonCurrent(d)||!['ready','paused'].includes(d.status))return;
 soundUnlock();d.since=Date.now();d.status='running';
 lessonStopTick();lessonInterval=setInterval(lessonTick,170);save();render();lessonTick();
}
function lessonPause(){
 const d=lessonData();
 if(d.status==='running'){d.elapsedMs=lessonSpent(d);d.since=0;d.status=d.elapsedMs>=(lessonCurrent(d)?.seconds||0)*1000?'timeup':'paused';save();}
 lessonStopTick();
}
function lessonAddTime(extra){
 if(![60,180].includes(extra))return;
 const d=lessonData(),step=lessonCurrent(d);
 if(!step||d.status==='complete')return;
 if(step.seconds+extra>7200)return toast('한 단계의 제한시간은 120분까지 설정할 수 있습니다.');
 const wasTimeup=d.status==='timeup';step.seconds+=extra;
 if(wasTimeup)d.status='paused';
 if(d.warnings&&lessonLeft(d)>60000)d.warned=false;
 save();render();toast('⏳ '+(extra/60)+'분을 추가했습니다.');
}
function lessonRecordCurrent(d){
 const step=lessonCurrent(d);if(!step)return;
 const spent=lessonSpent(d);
 d.actual=d.actual.filter(x=>x.id!==step.id);
 d.actual.push({id:step.id,ms:spent,completed:true});
}
function lessonNext(){
 const d=lessonData();
 if(d.status==='complete')return;
 if(!confirm('현재 활동을 완료하고 다음 단계로 넘어갈까요?'))return;
 lessonStopTick();lessonRecordCurrent(d);
 d.index++;d.elapsedMs=0;d.since=0;d.warned=false;
 if(d.index>=d.steps.length){
  d.status='complete';
  const sum=d.actual.reduce((n,x)=>n+x.ms,0);
  d.finished.push({title:d.title,date:dateString(),steps:d.steps.length,ms:sum});d.finished=d.finished.slice(-15);
  if(d.sounds)beep();
  toast('🎉 모든 수업 단계를 완료했습니다!');
 }else{
  d.status='ready';
  if(d.sounds)lessonSoftAlert();
  toast('✅ 다음 단계: '+d.steps[d.index].name+' · 시작 버튼을 누르세요.');
 }
 history('수업 단계',d.status==='complete'?'전체 수업 완료':(d.index+1)+'단계 준비');save();render();
}
function lessonJump(index){
 const d=lessonData();if(!Number.isInteger(index)||index<0||index>=d.steps.length||index===d.index)return;
 if(!confirm('현재 단계를 중단하고 '+(index+1)+'단계로 이동할까요? 남은 단계의 완료 상태가 재정렬됩니다.'))return;
 lessonStopTick();
 if(d.status!=='ready'&&d.status!=='complete')lessonRecordCurrent(d);
 d.actual=d.actual.filter(a=>d.steps.findIndex(s=>s.id===a.id)<index);
 d.index=index;d.status='ready';d.elapsedMs=0;d.since=0;d.warned=false;
 save();render();
}
function lessonReset(){
 const d=lessonData();
 if(!confirm('현재 수업의 진행 기록을 지우고 처음 단계부터 다시 시작할까요? 저장된 템플릿은 유지됩니다.'))return;
 lessonStopTick();d.index=0;d.status='ready';d.elapsedMs=0;d.since=0;d.warned=false;d.actual=[];
 save();render();
}
function lessonChangeField(key,value){
 const d=lessonData();
 
 if(key==='title')d.title=String(value||'').trim().slice(0,80)||'오늘의 수업';
 if(key==='warnings')d.warnings=!!value;
 if(key==='sounds')d.sounds=!!value;
 save();render();
}
function lessonUpdateStep(id,field,value){
 const d=lessonData(),s=d.steps.find(step=>step.id===id);if(!s)return;
 if(d.status==='running')return toast('타이머 실행 중에는 단계를 편집할 수 없습니다. 일시정지해 주세요.');
 if(field==='name')s.name=String(value||'').trim().slice(0,65)||'수업 활동';
 else if(field==='tool')s.tool=lessonTools.some(t=>t.id===value)?value:'';
 else if(field==='seconds'){
  const sec=Math.floor(Number(value));
  if(!Number.isFinite(sec)||sec<5||sec>7200)return toast('단계별 시간은 5초부터 120분까지 설정할 수 있습니다.');
  s.seconds=sec;
  if(d.index===d.steps.indexOf(s)&&d.elapsedMs>=sec*1000)d.status='timeup';
 }
 save();render();
}
function lessonSetStepDuration(id){
 const min=Number(document.getElementById('lessonMin-'+id)?.value);
 const sec=Number(document.getElementById('lessonSec-'+id)?.value);
 if(!Number.isInteger(min)||!Number.isInteger(sec)||min<0||min>120||sec<0||sec>59||min*60+sec<5||min*60+sec>7200)
  return toast('시간은 5초부터 120분까지 설정할 수 있습니다.');
 lessonUpdateStep(id,'seconds',min*60+sec);
}
function lessonEditSteps(action,id){
 const d=lessonData();
 if(d.status==='running')return toast('타이머를 일시정지한 후 단계를 수정해 주세요.');
 if(d.status!=='ready'&&d.status!=='complete'&&d.index>0)return toast('수업 진행 중에는 단계 구성을 변경할 수 없습니다. 수업 초기화 후 수정해 주세요.');
 const index=d.steps.findIndex(s=>s.id===id);
 if(action==='add'){
  if(d.steps.length>=16)return toast('단계는 최대 16개까지 추가할 수 있습니다.');
  d.steps.push({id:safeId(),name:'새로운 활동',seconds:300,tool:''});
 }else if(action==='remove'){
  if(d.steps.length<=1)return toast('최소 1개의 수업 단계가 필요합니다.');
  if(index<0)return;
  d.steps.splice(index,1);
 }else if(action==='up'||action==='down'){
  if(index<0)return;const next=index+(action==='up'?-1:1);
  if(next<0||next>=d.steps.length)return;
  [d.steps[index],d.steps[next]]=[d.steps[next],d.steps[index]];
 }else return;
 if((d.index>0||d.actual.length||d.elapsedMs>0)&&!confirm('단계 구성을 바꾸면 이번 수업 진행 기록이 초기화됩니다. 계속할까요?'))return;
 lessonStopTick();d.index=0;d.status='ready';d.elapsedMs=0;d.since=0;d.actual=[];d.warned=false;
 save();render();
}
function lessonApplyPreset(n){
 if(![40,45,50].includes(n))return;
 const d=lessonData();if(!confirm(n+'분 수업 기본 구성으로 교체할까요? 현재 진행 기록은 초기화됩니다. 저장한 수업 템플릿은 유지됩니다.'))return;
 lessonStopTick();d.steps=lessonPresetSteps(n);d.index=0;d.status='ready';d.elapsedMs=0;d.since=0;d.actual=[];d.warned=false;
 save();render();toast('📚 '+n+'분 수업 구성을 불러왔습니다.');
}
function lessonSaveTemplate(){
 const d=lessonData();
 const name=prompt('저장할 수업 템플릿 이름을 입력하세요.',d.title);
 if(name===null)return;
 const clean=name.trim().slice(0,65);if(!clean)return toast('템플릿 이름을 입력해 주세요.');
 if(d.templates.length>=12)return toast('템플릿은 12개까지 저장할 수 있습니다. 기존 템플릿을 삭제한 뒤 추가해 주세요.');
 d.templates.push({id:safeId(),name:clean,title:d.title,steps:d.steps.map(s=>({...s}))});
 save();render();toast('💾 '+clean+' 템플릿을 저장했습니다.');
}
function lessonLoadTemplate(id){
 const d=lessonData(),t=d.templates.find(v=>v.id===id);if(!t)return;
 if(!confirm('「'+t.name+'」 템플릿을 불러오면 현재 진행 기록이 초기화됩니다. 계속할까요?'))return;
 lessonStopTick();d.title=t.title;d.steps=t.steps.map(s=>({...s,id:safeId()}));
 d.index=0;d.status='ready';d.elapsedMs=0;d.since=0;d.warned=false;d.actual=[];
 save();render();toast('저장한 수업 구성을 불러왔습니다.');
}
function lessonDeleteTemplate(id){
 const d=lessonData(),t=d.templates.find(v=>v.id===id);if(!t||!confirm('「'+t.name+'」 템플릿을 삭제할까요?'))return;
 d.templates=d.templates.filter(v=>v.id!==id);save();render();
}
function lessonCopyRecord(){
 const d=lessonData();
 const rows=[d.title,'전체 단계 '+d.steps.length+'개','현재 상태: '+(d.status==='complete'?'완료':'진행 중')];
 for(let i=0;i<d.steps.length;i++){
  const step=d.steps[i],actual=d.actual.find(a=>a.id===step.id);
  rows.push((i+1)+'. '+step.name+' (설정 '+lessonStamp(step.seconds*1000)+')'+(actual?' · 실제 '+lessonStamp(actual.ms)+' ✓':''));
 }
 copyText(rows.join('\n'));
}
function lessonToggleFull(){
 lessonFullscreen=!lessonFullscreen;document.body.classList.toggle('lesson-fullscreen',lessonFullscreen);
 render();if(lessonFullscreen)window.scrollTo({top:0,behavior:'instant'});
}
function lessonExitFull(){lessonFullscreen=false;document.body.classList.remove('lesson-fullscreen');}

// v1.25 수업 단계 → 연결 도구 → 수업 단계 복귀
let lessonReturnContext=null;
const LESSON_RETURN_KEY='classroom-toolbox-lesson-return';
function lessonReturnSave(){
 try{if(lessonReturnContext)sessionStorage.setItem(LESSON_RETURN_KEY,JSON.stringify(lessonReturnContext));else sessionStorage.removeItem(LESSON_RETURN_KEY);}catch(e){}
}
function lessonReturnLoad(){
 try{
  const x=JSON.parse(sessionStorage.getItem(LESSON_RETURN_KEY)||'null');
  if(x&&typeof x.classId==='string'&&typeof x.stepId==='string'&&typeof x.tool==='string'&&x.classId.length<=100&&x.stepId.length<=100&&tools.some(t=>t.id===x.tool))lessonReturnContext={classId:x.classId,stepId:x.stepId,tool:x.tool};
 }catch(e){}
}
function lessonReturnClear(){
 lessonReturnContext=null;lessonReturnSave();
 const target=document.getElementById('lessonReturnDock');
 if(target){target.hidden=true;target.innerHTML='';}
 document.body.classList.remove('has-lesson-return');
}
function lessonReturnStart(step,tool){
 if(!step||!tools.some(t=>t.id===tool))return;
 lessonReturnContext={classId:activeClass().id,stepId:step.id,tool};
 lessonReturnSave();
}

function lessonReturnValid(){
 const ctx=lessonReturnContext;
 if(!ctx)return false;
 const d=lessonData(),step=lessonCurrent(d);
 return activeClass().id===ctx.classId&&!!step&&ctx.stepId===step.id&&d.status!=='complete';
}
function lessonReturnEnsure(tool){
 if(currentView==='lesson'||lessonReturnContext)return;
 const d=lessonData(),step=lessonCurrent(d);
 if(step&&d.status!=='complete'&&step.tool===tool&&tools.some(t=>t.id===tool)){
  lessonPause();
  lessonReturnStart(step,tool);
 }
}
function lessonReturnInline(){
 if(!lessonReturnValid())return '<div class="quiz-lesson-bridge quiz-lesson-bridge-plain" role="group" aria-label="수업 단계 진행판으로 이동"><span>📚 수업 단계 진행판도 바로 열 수 있어요.</span><div class="quiz-lesson-bridge-actions"><button type="button" class="btn btn-primary" data-view="lesson">↩ 수업 단계 진행판으로 이동</button></div></div>';
 const d=lessonData(),last=d.index===d.steps.length-1;
 return '<div class="quiz-lesson-bridge" role="group" aria-label="수업 단계 진행판 복귀와 다음 단계">'+
  '<span>📚 수업 단계 · '+(d.index+1)+'/'+d.steps.length+'단계 <strong>'+escapeHtml(lessonCurrent(d).name)+'</strong></span>'+
  '<div class="quiz-lesson-bridge-actions">'+
  '<button type="button" class="btn btn-primary" data-lesson-bridge="back">↩ 수업 단계로 돌아가기</button>'+
  '<button type="button" class="btn btn-secondary" data-lesson-bridge="next">✓ '+(last?'현재 수업 완료':(d.index+1)+'단계 완료 → '+(d.index+2)+'단계')+'</button>'+
  '</div></div>';
}

function lessonReturnRender(){
 const dock=document.getElementById('lessonReturnDock');
 if(!dock)return;
 const ctx=lessonReturnContext;
 if(!ctx||currentView==='lesson'){dock.hidden=true;dock.innerHTML='';document.body.classList.remove('has-lesson-return');return;}
 const c=activeClass(),d=lessonData(),step=lessonCurrent(d);
 if(!lessonReturnValid()){lessonReturnClear();return;}
 const paused=d.status==='paused'?'⏸ 타이머 일시정지':d.status==='timeup'?'⏰ 예정시간 종료':d.status==='ready'?'▶ 시작 대기':'⏸ 수업 진행 대기';
 dock.hidden=false;document.body.classList.add('has-lesson-return');
 dock.innerHTML='<div class="lesson-return-summary"><span>📚 수업 단계 진행판 · '+(d.index+1)+'/'+d.steps.length+'</span><strong title="'+escapeHtml(step.name)+'">'+escapeHtml(step.name)+'</strong><small>'+paused+'</small></div>'+
 '<div class="lesson-return-buttons"><button type="button" class="btn btn-primary" id="lessonReturnBack">↩ 수업 단계로 돌아가기</button>'+
 '<button type="button" class="btn btn-outline" id="lessonReturnFinish">✓ 완료하고 다음</button>'+
 '<button type="button" id="lessonReturnDismiss" class="lesson-return-dismiss" aria-label="수업 단계 연결 해제" title="연결 해제">✕</button></div>';
}
function lessonReturnBack(){
 if(!lessonReturnContext)return;
 navigate('lesson'); // 연결 도구의 크게 보기/타이머 종료 등 기존 화면 정리 절차 이용
 toast('📚 수업 단계로 돌아왔습니다. 필요한 경우 「계속」을 눌러 타이머를 재개하세요.');
}
function lessonReturnFinish(){
 if(!lessonReturnContext)return;
 navigate('lesson'); // 완료 확인은 lessonNext에서 처리. 취소해도 수업 단계 화면으로 복귀
 lessonNext();
}

function lessonOpenTool(){
 const d=lessonData(),step=lessonCurrent(d);
 if(!step?.tool)return;
 lessonPause();if(lessonFullscreen)lessonExitFull();
 lessonReturnStart(step,step.tool);
 navigate(step.tool);
 toast('⏸ 단계 타이머를 일시정지했습니다. 화면의 「수업 단계로 돌아가기」 버튼을 이용하세요.');
}
function lessonActions(){
 const d=lessonData(),start=d.status==='ready'||d.status==='paused',running=d.status==='running';
 const complete=d.status==='complete',step=lessonCurrent(d);
 const advance=!!step&&!complete;
 return '<div class="lesson-actions" aria-label="교사용 수업 조작">'+
 '<div class="lesson-actions-label"><strong>👩‍🏫 교사용 진행 조작</strong><small>'+(complete?'수업 완료':(d.index+1)+' / '+d.steps.length+'단계')+'</small></div>'+
 '<div class="lesson-actions-buttons">'+
 '<button type="button" class="btn btn-primary" id="lessonStart" '+(start?'':'disabled')+'>▶ '+(d.status==='paused'?'계속':'시작')+'</button>'+
 '<button type="button" class="btn btn-outline" id="lessonPause" '+(running?'':'disabled')+'>⏸ 일시정지</button>'+
 '<button type="button" class="btn btn-outline" id="lessonPlus1" '+(advance?'':'disabled')+'>＋1분</button>'+
 '<button type="button" class="btn btn-outline" id="lessonPlus3" '+(advance?'':'disabled')+'>＋3분</button>'+
 '<button type="button" class="btn btn-secondary" id="lessonNext" '+(advance?'':'disabled')+'>✓ '+(d.index===d.steps.length-1?'수업 완료':'다음 단계')+'</button>'+
 '</div></div>';
}
function lessonStudentBoard(){
 const d=lessonData(),current=lessonCurrent(d),left=lessonLeft(d),spent=lessonSpent(d);
 const pct=d.steps.length?Math.round(d.index*100/d.steps.length):0,done=d.status==='complete';
 const upcoming=d.steps[d.index+1];
 const tag=d.status==='timeup'?'⏰ 예정시간 종료':d.status==='running'?'🎙 활동 진행 중':d.status==='paused'?'⏸ 일시정지':done?'🎉 수업 완료':'활동 준비';
 const alert=d.status==='timeup'?'⏰ 설정한 활동 시간이 끝났습니다.':d.warnings&&d.warned&&d.status==='running'?'🔔 곧 활동이 끝나요! 남은 시간 1분 이하':''; 
 return '<section class="lesson-presentation '+(d.status==='timeup'?'is-over':'')+'">'+
 '<header class="lesson-presentation-head"><div><small>📚 오늘의 수업</small><h2>'+escapeHtml(d.title)+'</h2></div><span>'+tag+'</span></header>'+
 '<div class="lesson-presentation-main">'+(done?'<div class="lesson-main-badge">🎉 모든 활동 완료!</div>':'<div class="lesson-main-badge">'+(d.index+1)+' / '+d.steps.length+'번째 활동</div>')+
 '<h3>'+escapeHtml(done?'수업을 마쳤습니다!':current?.name||'수업 단계')+'</h3>'+
 '<div class="lesson-clock-label">남은 활동시간</div><div id="lessonClock" class="lesson-clock" role="timer">'+lessonStamp(done?0:left,true)+'</div>'+
 '<div class="lesson-progress-track"><div class="lesson-progress-fill" id="lessonBar" style="width:'+Math.min(100,current?spent*100/(current.seconds*1000):0).toFixed(2)+'%"></div></div>'+
 '<div class="lesson-clock-used">경과 <strong id="lessonUsed">'+lessonStamp(spent)+'</strong> · 설정 '+lessonStamp((current?.seconds||0)*1000)+'</div>'+
 (alert?'<div class="lesson-alert" role="status">'+alert+'</div>':'')+'</div>'+
 '<div class="lesson-stage-footer"><div><small>다음 활동</small><strong>'+escapeHtml(done?'모든 활동 완료':upcoming?.name||'이번 활동이 마지막입니다')+'</strong></div><div><small>전체 진행률</small><strong>'+ (done?100:pct)+'%</strong></div></div></section>';
}
function lessonStageEditor(){
 const d=lessonData(),locked=d.status==='running'||(d.index>0&&!['ready','complete'].includes(d.status));
 const toolSelect=tool=>lessonTools.map(x=>'<option value="'+escapeHtml(x.id)+'" '+(x.id===tool?'selected':'')+'>'+escapeHtml(x.name)+'</option>').join('');
 return '<section class="panel lesson-editor"><div class="lesson-section-head"><h2>① 수업 구성·시간 설정</h2><div class="lesson-template-presets">'+[40,45,50].map(n=>'<button type="button" class="btn btn-outline btn-small" data-lesson-preset="'+n+'">'+n+'분 기본</button>').join('')+'</div></div>'+
 '<label class="lesson-title-input">오늘의 수업 제목<input type="text" class="field" id="lessonTitle" maxlength="80" value="'+escapeHtml(d.title)+'" aria-label="오늘의 수업 제목"></label>'+
 '<div class="lesson-step-list">'+d.steps.map((s,i)=>{
 const actual=d.actual.find(a=>a.id===s.id),isCurrent=i===d.index&&!['complete'].includes(d.status);
 return '<div class="lesson-step-editor '+(isCurrent?'is-current':'')+'"><div class="lesson-editor-num">'+(i+1)+'</div>'+
 '<div class="lesson-editor-fields"><input type="text" class="field" data-lesson-name="'+escapeHtml(s.id)+'" maxlength="65" value="'+escapeHtml(s.name)+'" aria-label="'+(i+1)+'단계 활동 이름" '+(locked?'disabled':'')+'>'+
 '<div class="lesson-editor-sub"><label>시간 <input type="number" class="field" id="lessonMin-'+escapeHtml(s.id)+'" min="0" max="120" value="'+Math.floor(s.seconds/60)+'" '+(locked?'disabled':'')+'> 분</label><label><input type="number" class="field" id="lessonSec-'+escapeHtml(s.id)+'" min="0" max="59" value="'+s.seconds%60+'" '+(locked?'disabled':'')+'> 초</label>'+
 '<button type="button" class="btn btn-outline btn-small" data-lesson-duration="'+escapeHtml(s.id)+'" '+(locked?'disabled':'')+'>적용</button>'+
 '<label>연결 도구 <select class="field" data-lesson-tool="'+escapeHtml(s.id)+'" '+(locked?'disabled':'')+'>'+toolSelect(s.tool)+'</select></label></div></div>'+
 '<div class="lesson-step-edit-actions"><button type="button" class="btn btn-outline btn-small" title="위로 이동" aria-label="'+(i+1)+'단계 위로 이동" data-lesson-up="'+escapeHtml(s.id)+'" '+(i===0||locked?'disabled':'')+'>↑</button><button type="button" class="btn btn-outline btn-small" title="아래로 이동" aria-label="'+(i+1)+'단계 아래로 이동" data-lesson-down="'+escapeHtml(s.id)+'" '+(i===d.steps.length-1||locked?'disabled':'')+'>↓</button><button type="button" class="btn btn-outline btn-small" title="단계 삭제" aria-label="'+(i+1)+'단계 삭제" data-lesson-remove="'+escapeHtml(s.id)+'" '+(d.steps.length<=1||locked?'disabled':'')+'>×</button></div>'+
 (actual?'<div class="lesson-step-actual">✓ 완료 · 실제 '+lessonStamp(actual.ms)+'</div>':'')+'</div>';
 }).join('')+'</div>'+
 '<div class="lesson-editor-bottom"><button type="button" id="lessonAddStep" class="btn btn-outline" '+(d.steps.length>=16||locked?'disabled':'')+'>＋ 단계 추가</button><span>전체 설정 시간 <strong>'+lessonStamp(d.steps.reduce((n,s)=>n+s.seconds,0)*1000)+'</strong> · '+d.steps.length+'단계</span></div></section>';
}
function lessonTemplatePanel(){
 const d=lessonData();
 return '<section class="panel lesson-template-panel"><div class="lesson-section-head"><h2>④ 수업 템플릿·알림</h2><button id="lessonSaveTemplate" type="button" class="btn btn-outline btn-small" '+(d.templates.length>=12?'disabled':'')+'>💾 현재 구성 저장</button></div>'+
 '<div class="lesson-notify-settings"><label><input type="checkbox" id="lessonWarn" '+(d.warnings?'checked':'')+'> 🔔 종료 1분 전 알림</label><label><input type="checkbox" id="lessonSound" '+(d.sounds?'checked':'')+'> 🔊 알림음 켜기</label></div>'+
 '<p class="lesson-explain">시간이 다 되면 화면에 종료 안내가 나타나고, 알림음이 켜져 있으면 소리가 납니다. 다음 단계는 선생님이 직접 이동합니다.</p>'+
 (d.templates.length?'<div class="lesson-template-items">'+d.templates.map(t=>'<div><span>'+escapeHtml(t.name)+'</span><button type="button" class="btn btn-outline btn-small" data-lesson-load="'+escapeHtml(t.id)+'">불러오기</button><button type="button" class="btn btn-outline btn-small" data-lesson-delete="'+escapeHtml(t.id)+'">삭제</button></div>').join('')+'</div>':'<p class="lesson-explain">저장된 수업 템플릿이 없습니다. 현재 구성을 저장하면 다음 수업에 다시 사용할 수 있습니다.</p>')+'</section>';
}
function renderLesson(){
 const d=lessonData(),current=lessonCurrent(d);
 if(lessonFullscreen)return '<div class="lesson-full-head"><strong>📚 수업 단계 진행판</strong><button type="button" class="btn btn-outline btn-small" id="lessonFullBtn">✕ 관리 화면으로</button></div>'+
 lessonStudentBoard()+lessonActions()+
 (current?.tool?'<div class="lesson-full-tool"><button type="button" class="btn btn-outline" id="lessonOpenTool">🔗 연결 도구 열기 · '+escapeHtml(lessonTools.find(t=>t.id===current.tool)?.name||'')+'</button></div>':'');
 const tools=current?.tool?'<button type="button" class="btn btn-outline" id="lessonOpenTool">🔗 '+escapeHtml(lessonTools.find(t=>t.id===current.tool)?.name||'연결 도구')+' 열기</button>':'';
 const controls='<section class="lesson-management">'+lessonActions()+'<div class="lesson-management-bottom">'+tools+
 '<button type="button" id="lessonFullBtn" class="btn btn-secondary">⛶ 전자칠판 크게 보기</button>'+
 '<button type="button" id="lessonCopy" class="btn btn-outline">📋 진행 결과 복사</button>'+
 '<button type="button" id="lessonReset" class="btn btn-outline">↺ 수업 처음부터</button></div></section>';
 const overview='<section class="panel lesson-overview"><div class="lesson-section-head"><h2>③ 전체 단계·진행 현황</h2><span>'+d.actual.length+' / '+d.steps.length+'단계 완료</span></div>'+
 '<div class="lesson-overview-list">'+d.steps.map((s,i)=>{
 const finished=d.actual.find(a=>a.id===s.id),selected=i===d.index&&d.status!=='complete';
 return '<button type="button" class="lesson-overview-row '+(finished?'is-done':selected?'is-active':'')+'" data-lesson-jump="'+i+'" '+(selected||d.status==='complete'?'disabled':'')+'><span class="lesson-overview-num">'+(finished?'✓':i+1)+'</span><span class="lesson-overview-name">'+escapeHtml(s.name)+'</span><small>'+lessonStamp(s.seconds*1000)+'</small><span class="lesson-overview-status">'+(finished?'완료':selected?'진행 단계':'대기')+'</span></button>';
 }).join('')+'</div><div class="lesson-total-progress"><span>수업 단계 진행률</span><strong>'+Math.round((d.status==='complete'?1:d.index/d.steps.length)*100)+'%</strong></div><div class="lesson-total-track"><div style="width:'+Math.round((d.status==='complete'?1:d.index/d.steps.length)*100)+'%"></div></div></section>';
 const archives=d.finished.length?'<section class="panel lesson-finished"><h2>📚 최근 완료 수업</h2>'+d.finished.slice(-5).reverse().map(a=>'<div><strong>'+escapeHtml(a.title)+'</strong><span>'+escapeHtml(a.date)+' · '+a.steps+'단계 · 실제 '+lessonStamp(a.ms)+'</span></div>').join('')+'</section>':'';
 return title('수업 진행','수업 단계 진행판','수업 흐름에 따라 단계·타이머·종료 알림을 관리하고 다른 수업도구로 연결합니다.','📚')+
 '<div class="lesson-workflow-layout"><div class="lesson-workflow-left">'+lessonStageEditor()+lessonTemplatePanel()+'</div>'+
 '<div class="lesson-workflow-right"><div class="lesson-preview-heading"><strong>② 수업 실행</strong><small>현재 단계 · 남은 시간 · 다음 단계</small></div>'+
 lessonStudentBoard()+controls+overview+archives+'</div></div>';
}
