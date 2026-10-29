/* v1.27 집중 신호등 — 전자칠판 수업 집중 신호 */
'use strict';
let signalFullscreen=false,signalInterval=null;
const SIGNAL_MODES=['green','yellow','red'];
function makeDefaultSignal(){return {mode:'green',seconds:10,remaining:10000,since:0,running:false,sound:true,caption:'우리 반, 함께 집중해요!'};}
function normalizeSignal(raw){
 const x=raw&&typeof raw==='object'?raw:{},seconds=[5,10,15,30].includes(Number(x.seconds))?Number(x.seconds):10;
 const max=seconds*1000,now=Date.now();
 return {mode:SIGNAL_MODES.includes(x.mode)?x.mode:'green',seconds,
  remaining:clamp(Math.floor(Number(x.remaining) || (x.remaining===0?0:max))-(x.running?Math.max(0,now-(Number(x.since)||now)):0),0,max),
  since:0,running:false,sound:x.sound!==false,caption:String(x.caption||'우리 반, 함께 집중해요!').slice(0,90)};
}
function signalState(){const c=activeClass();return c.signal||(c.signal=makeDefaultSignal());}
function signalStop(){if(signalInterval!==null){clearInterval(signalInterval);signalInterval=null;}}
function signalLeft(s=signalState()){return Math.max(0,s.remaining-(s.running?Math.max(0,Date.now()-s.since):0));}
function signalCountdownText(ms){return Math.ceil(ms/1000)+'초';}
function signalTick(){
 const s=signalState();if(!s.running){signalStop();return;}
 const left=signalLeft(s),e=document.getElementById('signalSeconds');
 if(e)e.textContent=signalCountdownText(left);
 if(left<=0){s.running=false;s.since=0;s.remaining=0;s.mode='red';signalStop();if(s.sound)beep();save();if(currentView==='signal')render();toast('🔴 모두 주목! 집중할 시간입니다.');}
}
function signalSelect(mode){
 if(!SIGNAL_MODES.includes(mode))return;
 const s=signalState();signalStop();s.running=false;s.since=0;s.mode=mode;s.remaining=s.seconds*1000;
 if(s.sound){soundUnlock();beep();}
 save();render();
}
function signalBegin(){
 const s=signalState();
 if(s.running)return;
 if(s.remaining<=0)s.remaining=s.seconds*1000;
 soundUnlock();s.mode='yellow';s.since=Date.now();s.running=true;
 signalStop();signalInterval=setInterval(signalTick,150);save();render();signalTick();
}
function signalPause(){
 const s=signalState();
 if(s.running){s.remaining=signalLeft(s);s.running=false;s.since=0;save();}
 signalStop();
}
function signalReset(){
 signalStop();const s=signalState();s.running=false;s.since=0;s.remaining=s.seconds*1000;s.mode='green';save();render();
}
function signalSetSeconds(v){
 const n=Number(v);if(![5,10,15,30].includes(n))return;
 const s=signalState();signalStop();s.running=false;s.since=0;s.seconds=n;s.remaining=n*1000;save();render();
}
function signalFullToggle(){signalFullscreen=!signalFullscreen;document.body.classList.toggle('signal-fullscreen',signalFullscreen);render();if(signalFullscreen)window.scrollTo({top:0,behavior:'instant'});}
function signalExitFull(){signalFullscreen=false;document.body.classList.remove('signal-fullscreen');}
function signalLeave(){signalPause();signalExitFull();}
function signalActions(){
 const s=signalState(),text=s.running?'⏸ 일시정지':s.remaining<s.seconds*1000&&s.mode==='yellow'?'▶ 계속 카운트다운':'⏳ 집중 카운트다운';
 return '<div class="signal-actions"><strong>👩‍🏫 교사용 신호 조작</strong>'+
 '<div class="signal-action-buttons"><button id="signalGreen" type="button" class="btn btn-secondary">🟢 활동 중</button>'+
 '<button id="signalYellow" type="button" class="btn btn-outline">🟡 정리 준비</button>'+
 '<button id="signalRed" type="button" class="btn btn-outline">🔴 모두 주목</button>'+
 '<button id="signalBegin" type="button" class="btn btn-primary">'+text+'</button>'+
 '<button id="signalFull" type="button" class="btn btn-outline">'+(signalFullscreen?'✕ 편집 화면으로':'⛶ 크게 보기')+'</button></div></div>';
}
function signalBoard(){
 const s=signalState(),content={
 green:{icon:'🟢',title:'자유롭게 활동해요!',sub:'친구들과 함께 활동하는 시간이에요.',hint:'활동 중'},
 yellow:{icon:'🟡',title:'정리하고 준비해요!',sub:'지금 하는 일을 마무리해 주세요.',hint:'정리 준비'},
 red:{icon:'🔴',title:'모두 주목!',sub:'이제 선생님 이야기에 집중해 주세요.',hint:'선생님께 집중'}
 }[s.mode];
 return '<section class="signal-board signal-'+s.mode+'">'+
 '<div class="signal-board-top"><span>🚦 집중 신호등</span><strong>'+escapeHtml(s.caption)+'</strong></div>'+
 '<div class="signal-light-stack" aria-label="현재 신호: '+content.hint+'">'+
 SIGNAL_MODES.map(mode=>'<div class="signal-bulb signal-bulb-'+mode+(mode===s.mode?' signal-is-on':'')+'"></div>').join('')+'</div>'+
 '<div class="signal-main-icon" aria-hidden="true">'+content.icon+'</div>'+
 '<h2>'+content.title+'</h2><p>'+content.sub+'</p>'+
 (s.mode==='yellow'?'<div class="signal-remaining">'+(s.running?'집중 준비까지':'준비 카운트다운')+' <strong id="signalSeconds">'+signalCountdownText(signalLeft(s))+'</strong></div>':'<div class="signal-status-pill">'+content.hint+'</div>')+
 '</section>';
}
function renderSignal(){
 const s=signalState();
 if(signalFullscreen)return '<div class="signal-full-head"><strong>🚦 집중 신호등</strong><button id="signalFull" type="button" class="btn btn-outline btn-small">✕ 관리 화면으로</button></div>'+signalBoard()+signalActions();
 return title('수업 진행','집중 신호등','초록·노랑·빨강 신호를 학생들에게 크게 보여주고 주목 카운트다운을 진행합니다.','🚦')+
 '<section class="panel signal-settings"><label>안내 제목<input type="text" class="field" id="signalCaption" maxlength="90" value="'+escapeHtml(s.caption)+'"></label>'+
 '<label>집중 카운트다운<select id="signalDuration" class="field">'+[5,10,15,30].map(n=>'<option value="'+n+'" '+(s.seconds===n?'selected':'')+'>'+n+'초</option>').join('')+'</select></label>'+
 '<label class="signal-check"><input id="signalSound" type="checkbox" '+(s.sound?'checked':'')+'> 알림음</label>'+
 '<button id="signalReset" type="button" class="btn btn-outline">↺ 초록 신호로 초기화</button></section>'+
 signalBoard()+signalActions()+'<p class="signal-note">집중 카운트다운을 시작하면 노란색으로 바뀌고, 카운트다운 종료 후 빨간색과 알림음으로 집중을 안내합니다. 알림음은 끌 수 있습니다.</p>';
}
