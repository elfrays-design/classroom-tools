/* v1.27 모둠 활동 진행판 — 기존 모둠 편성·역할 배정 데이터와 연결 */
'use strict';
let groupProgressFull=false,groupProgressInterval=null;
const GP_STATES=['ready','working','done'];
function makeDefaultGroupProgress(){return {title:'오늘의 모둠 활동',signature:'',stages:[],minutes:15,remaining:900000,since:0,running:false,sound:true};}
function normalizeGroupProgress(raw){
 const x=raw&&typeof raw==='object'?raw:{},d=makeDefaultGroupProgress();
 const minutes=clamp(Math.floor(Number(x.minutes)||15),1,90),max=minutes*60000;
 const running=x.running===true;
 const since=Number(x.since)||Date.now();
 const remaining=clamp(Math.floor(Number(x.remaining) || (x.remaining===0?0:max))-(running?Math.max(0,Date.now()-since):0),0,max);
 return {title:String(x.title||d.title).slice(0,90),signature:String(x.signature||'').slice(0,20000),
  stages:Array.isArray(x.stages)?x.stages.slice(0,30).map(v=>GP_STATES.includes(v)?v:'ready'):[],
  minutes,remaining,since:0,running:false,sound:x.sound!==false};
}
function gpCurrentGroups(){
 const included=new Set(participants().map(s=>s.id));
 return activeClass().groups.slice(0,30).map(m=>m.filter(id=>included.has(id)));
}
function gpSignature(){return JSON.stringify(gpCurrentGroups());}
function gpState(){
 const c=activeClass(),p=c.groupProgress||(c.groupProgress=makeDefaultGroupProgress());
 const groups=gpCurrentGroups(),sig=JSON.stringify(groups);
 if(p.signature!==sig||p.stages.length!==groups.length){
  p.signature=sig;p.stages=groups.map(()=>'ready');p.remaining=p.minutes*60000;p.running=false;p.since=0;gpStop();
  save();
 }
 return p;
}
function gpStop(){if(groupProgressInterval!==null){clearInterval(groupProgressInterval);groupProgressInterval=null;}}
function gpRemaining(p=gpState()){return Math.max(0,p.remaining-(p.running?Math.max(0,Date.now()-p.since):0));}
function gpClock(ms){const v=Math.ceil(ms/1000);return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');}
function gpTick(){
 const p=gpState();
 if(!p.running){gpStop();return;}
 const rem=gpRemaining(p),el=document.getElementById('gpClock');
 if(el)el.textContent=gpClock(rem);
 if(rem<=0){
  p.remaining=0;p.running=false;p.since=0;gpStop();
  if(p.sound)beep();save();if(currentView==='groupProgress')render();
  toast('⏰ 모둠 활동 시간이 종료되었습니다.');
 }
}
function gpStartPause(){
 const p=gpState(),groups=gpCurrentGroups();
 if(!groups.some(g=>g.length))return toast('모둠 편성에서 먼저 모둠을 만들어 주세요.');
 if(p.running){p.remaining=gpRemaining(p);p.running=false;p.since=0;gpStop();save();render();return;}
 if(p.remaining<=0)return toast('설정 시간이 종료됐습니다. 활동 시간을 다시 설정해 주세요.');
 soundUnlock();p.running=true;p.since=Date.now();
 if(p.stages.every(s=>s==='ready'))p.stages=p.stages.map((s,i)=>groups[i].length?'working':'ready');
 gpStop();groupProgressInterval=setInterval(gpTick,200);save();render();gpTick();
}
function gpSetTime(minutes){
 const n=Math.floor(Number(minutes));if(!Number.isInteger(n)||n<1||n>90)return toast('활동 시간은 1~90분입니다.');
 const p=gpState();
 if(p.running)return toast('타이머를 일시정지한 뒤 활동 시간을 변경해 주세요.');
 p.minutes=n;p.remaining=n*60000;save();render();
}
function gpSetStage(index,stage){
 const p=gpState(),g=gpCurrentGroups();
 if(!Number.isInteger(index)||index<0||index>=g.length||!g[index].length||!GP_STATES.includes(stage))return;
 p.stages[index]=stage;
 save();render();
 if(stage==='done'&&g.every((members,i)=>!members.length||p.stages[i]==='done')){if(p.sound)beep();toast('🎉 모든 모둠이 활동을 완료했습니다!');}
}
function gpNextStage(index){
 const p=gpState(),now=p.stages[index];
 gpSetStage(index,now==='ready'?'working':now==='working'?'done':'ready');
}
function gpReset(){
 if(!confirm('모둠별 진행 상태와 활동 타이머를 처음부터 다시 시작할까요? 모둠 편성은 유지됩니다.'))return;
 const p=gpState();gpStop();p.running=false;p.since=0;p.remaining=p.minutes*60000;p.stages=p.stages.map(()=>'ready');save();render();
}
function gpFullToggle(){
 groupProgressFull=!groupProgressFull;
 document.body.classList.toggle('group-progress-fullscreen',groupProgressFull);
 render();if(groupProgressFull)window.scrollTo({top:0,behavior:'instant'});
}
function gpExitFull(){groupProgressFull=false;document.body.classList.remove('group-progress-fullscreen');}
function gpLeave(){const p=gpState();if(p.running){p.remaining=gpRemaining(p);p.running=false;p.since=0;save();}gpStop();gpExitFull();}
function gpCopy(){
 const p=gpState(),g=gpCurrentGroups(),label={ready:'준비',working:'진행 중',done:'완료'};
 copyText([p.title,...g.map((members,i)=>(i+1)+'모둠 · '+label[p.stages[i]]+' · '+members.map(nameOf).join(', '))].join('\n'));
}
function gpActions(){
 const p=gpState(),any=gpCurrentGroups().some(g=>g.length),disabled=!any;
 return '<div class="gp-actions"><strong>👩‍🏫 모둠 활동 조작</strong><div class="gp-action-buttons">'+
 '<button id="gpStart" type="button" class="btn btn-primary" '+(disabled?'disabled':'')+'>'+(p.running?'⏸ 일시정지':'▶ 활동 시작 / 계속')+'</button>'+
 '<button id="gpReset" type="button" class="btn btn-outline">↺ 진행 초기화</button>'+
 '<button id="gpFull" type="button" class="btn btn-secondary">'+(groupProgressFull?'✕ 편집 화면으로':'⛶ 전자칠판 크게 보기')+'</button></div></div>';
}
function gpBoard(){
 const g=gpCurrentGroups(),p=gpState(),n=g.filter(x=>x.length).length;
 const done=g.filter((x,i)=>x.length&&p.stages[i]==='done').length;
 const working=g.filter((x,i)=>x.length&&p.stages[i]==='working').length;
 const label={ready:'준비',working:'진행 중',done:'완료'};
 const cards=g.map((members,i)=>'<section class="gp-team gp-team-'+p.stages[i]+'">'+
 '<header><strong>'+(i+1)+'모둠</strong><span>'+label[p.stages[i]]+'</span></header>'+
 '<p class="gp-members">'+(members.length?members.map(id=>escapeHtml(nameOf(id))).join(' · '):'참여 학생 없음')+'</p>'+
 '<div class="gp-team-buttons"><button type="button" class="btn btn-outline btn-small" data-gp-stage="'+i+'" data-gp-status="ready" '+(!members.length?'disabled':'')+'>준비</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-gp-stage="'+i+'" data-gp-status="working" '+(!members.length?'disabled':'')+'>진행</button>'+
 '<button type="button" class="btn btn-secondary btn-small" data-gp-stage="'+i+'" data-gp-status="done" '+(!members.length?'disabled':'')+'>✓ 완료</button></div></section>').join('');
 return '<section class="gp-board"><header class="gp-board-head"><div><small>🧩 협력 학습</small><h2>'+escapeHtml(p.title)+'</h2></div>'+
 '<span class="gp-stat">완료 '+done+'/'+n+'모둠 · 진행 중 '+working+'모둠</span></header>'+
 '<div class="gp-timer"><span>활동 남은 시간</span><strong id="gpClock">'+gpClock(gpRemaining(p))+'</strong></div>'+
 '<div class="gp-progress"><div style="width:'+(n?done*100/n:0)+'%"></div></div>'+
 (g.length?'<div class="gp-grid">'+cards+'</div>':'<div class="gp-empty">모둠 편성에서 모둠을 먼저 만들어 주세요.</div>')+
 (n&&done===n?'<div class="gp-celebrate">🎉 모든 모둠이 활동을 완료했어요!</div>':'')+'</section>';
}
function renderGroupProgress(){
 const p=gpState(),groups=gpCurrentGroups(),tot=groups.filter(g=>g.length).length;
 if(groupProgressFull)return '<div class="gp-full-head"><strong>🧩 모둠 활동 진행판</strong><button type="button" class="btn btn-outline btn-small" id="gpFull">✕ 관리 화면으로</button></div>'+gpBoard()+gpActions();
 const options=[5,10,15,20,30,40,45].map(n=>'<option value="'+n+'" '+(p.minutes===n?'selected':'')+'>'+n+'분</option>').join('');
 return title('수업 진행','모둠 활동 진행판','기존 모둠 편성 결과를 이용해 모둠별 활동 진행과 완료 현황을 한눈에 관리합니다.','🧩')+
 '<section class="panel gp-settings"><label>활동 제목<input class="field" id="gpTitle" maxlength="90" value="'+escapeHtml(p.title)+'"></label>'+
 '<label>활동 시간<select id="gpMinutes" class="field" '+(p.running?'disabled':'')+'>'+options+( [5,10,15,20,30,40,45].includes(p.minutes)?'':'<option value="'+p.minutes+'" selected>'+p.minutes+'분</option>')+'</select></label>'+
 '<label class="gp-sound"><input id="gpSound" type="checkbox" '+(p.sound?'checked':'')+'> 종료 알림음</label>'+
 '<button type="button" class="btn btn-outline" id="gpToGroups">🧩 모둠 편성 열기</button>'+
 '<button type="button" class="btn btn-outline" id="gpCopy" '+(!tot?'disabled':'')+'>📋 진행 결과 복사</button></section>'+
 gpBoard()+gpActions()+
 '<p class="gp-footnote">모둠별 준비·진행·완료 버튼으로 상태를 바꿀 수 있습니다. 모둠을 다시 편성하면 진행 상태는 새 모둠에 맞춰 초기화됩니다.</p>';
}
