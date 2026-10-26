/* v1.22 찬반 토론 진행판: 학급별 발언시간·교대·전자칠판 큰 화면 */
'use strict';
let debateFullscreen=false,debateInterval=null;
function makeDefaultDebate(){
 return {topic:'오늘의 토론 주제를 입력해 주세요',limit:60,side:'pro',status:'ready',elapsedMs:0,since:0,turn:1,records:[],proMs:0,conMs:0,proCount:0,conCount:0};
}
function normalizeDebate(raw){
 const x=raw&&typeof raw==='object'?raw:{},d=makeDefaultDebate();
 const limit=clamp(Math.floor(Number(x.limit)||60),5,900);
 let elapsedMs=clamp(Math.floor(Number(x.elapsedMs)||0),0,limit*1000);
 let status=['ready','running','paused','timeup','complete'].includes(x.status)?x.status:'ready';
 if(status==='running'){
  const since=Number(x.since)||Date.now();
  elapsedMs=clamp(elapsedMs+Math.max(0,Date.now()-since),0,limit*1000);
  status=elapsedMs>=limit*1000?'timeup':'paused';
 }
 if(status==='timeup')elapsedMs=limit*1000;
 const records=(Array.isArray(x.records)?x.records:[]).slice(-200).filter(e=>e&&(e.side==='pro'||e.side==='con')).map(e=>({
  side:e.side,ms:clamp(Math.floor(Number(e.ms)||0),0,900000),at:String(e.at||'').slice(0,45)
 }));
 return {topic:String(x.topic||d.topic).slice(0,140),limit,side:x.side==='con'?'con':'pro',status,
  elapsedMs,since:0,turn:clamp(Math.floor(Number(x.turn)||1),1,10000),records,
  proMs:clamp(Math.floor(Number(x.proMs)||0),0,86400000),
  conMs:clamp(Math.floor(Number(x.conMs)||0),0,86400000),
  proCount:clamp(Math.floor(Number(x.proCount)||0),0,10000),
  conCount:clamp(Math.floor(Number(x.conCount)||0),0,10000)};
}
function debateData(){const c=activeClass();return c.debate||(c.debate=makeDefaultDebate());}
function debateOther(side){return side==='pro'?'con':'pro';}
function debateLabel(side){return side==='pro'?'찬성':'반대';}
function debateElapsed(p=debateData()){
 return clamp(p.elapsedMs+(p.status==='running'?Math.max(0,Date.now()-p.since):0),0,p.limit*1000);
}
function debateTime(ms,ceil=false){
 const sec=Math.max(0,ceil?Math.ceil(ms/1000):Math.floor(ms/1000));
 return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function debateStopClock(){if(debateInterval!==null){clearInterval(debateInterval);debateInterval=null;}}
function debateTick(){
 const p=debateData();if(p.status!=='running'){debateStopClock();return;}
 const elapsed=debateElapsed(p),remaining=Math.max(0,p.limit*1000-elapsed);
 const clock=document.getElementById('debateClock'),used=document.getElementById('debateElapsed'),bar=document.getElementById('debateBar');
 if(clock)clock.textContent=debateTime(remaining,true);
 if(used)used.textContent=debateTime(elapsed);
 if(bar)bar.style.width=(elapsed*100/(p.limit*1000)).toFixed(1)+'%';
 if(remaining===0){
  p.elapsedMs=p.limit*1000;p.since=0;p.status='timeup';
  debateStopClock();save();beep();
  if(currentView==='debate')render();
  toast('⏰ '+debateLabel(p.side)+' 측의 발언 시간이 종료됐습니다. 선생님이 다음 발언으로 넘겨주세요.');
 }
}
function debateStart(){
 const p=debateData();
 if(!['ready','paused'].includes(p.status))return;
 if(p.elapsedMs>=p.limit*1000)return;
 soundUnlock();p.since=Date.now();p.status='running';save();
 debateStopClock();debateInterval=setInterval(debateTick,150);
 render();debateTick();
}
function debatePause(){
 const p=debateData();
 if(p.status==='running'){
  p.elapsedMs=debateElapsed(p);p.since=0;
  p.status=p.elapsedMs>=p.limit*1000?'timeup':'paused';
  save();
 }
 debateStopClock();
}
function debateSelectSide(side){
 if(!['pro','con'].includes(side))return;
 const p=debateData();
 if(p.status!=='ready')return toast('현재 발언을 종료한 뒤 다음 팀을 선택할 수 있습니다.');
 p.side=side;save();render();
}
function debateSetTopic(value){
 const p=debateData();p.topic=String(value||'').slice(0,140);save();
}
function debateSetLimit(){
 const p=debateData();
 if(p.status!=='ready')return toast('현재 발언을 종료한 뒤 시간을 변경해 주세요.');
 const min=Number(document.getElementById('debateMinutes')?.value);
 const sec=Number(document.getElementById('debateSeconds')?.value);
 if(!Number.isInteger(min)||!Number.isInteger(sec)||min<0||min>15||sec<0||sec>59||min*60+sec<5||min*60+sec>900)
  return toast('발언시간은 5초부터 15분까지 설정할 수 있습니다.');
 p.limit=min*60+sec;p.elapsedMs=0;save();render();toast('발언시간을 '+debateTime(p.limit*1000)+'으로 설정했습니다.');
}
function debatePreset(n){
 const p=debateData();if(p.status!=='ready')return toast('발언 종료 후 시간을 변경해 주세요.');
 if(![30,60,90,120,180,300].includes(n))return;
 p.limit=n;p.elapsedMs=0;save();render();
}
function debateRecordCurrent(p){
 const used=debateElapsed(p);
 if(!['running','paused','timeup'].includes(p.status))return false;
 const side=p.side;
 p.records.push({side,ms:used,at:dateString()});p.records=p.records.slice(-200);
 if(side==='pro'){p.proMs+=used;p.proCount++;}else{p.conMs+=used;p.conCount++;}
 return true;
}
function debateEndTurn(){
 const p=debateData();
 if(p.status==='complete'||p.status==='ready')return toast('먼저 발언 타이머를 시작해 주세요.');
 debateRecordCurrent(p);debateStopClock();
 const previous=p.side;
 p.side=debateOther(previous);p.elapsedMs=0;p.since=0;p.status='ready';p.turn++;
 save();render();toast('✅ '+debateLabel(previous)+' 측 발언 완료. 다음은 '+debateLabel(p.side)+' 측 차례입니다.');
}
function debateFinish(){
 const p=debateData();
 if(p.status==='complete')return;
 if(!confirm('토론을 종료할까요? 현재 진행 중인 발언시간도 기록하고 종료합니다.'))return;
 if(['running','paused','timeup'].includes(p.status))debateRecordCurrent(p);
 debateStopClock();p.status='complete';p.elapsedMs=0;p.since=0;
 save();render();toast('🏁 찬반 토론이 종료됐습니다.');
}
function debateReset(){
 const p=debateData();
 if(!confirm('토론 진행 기록과 발언 누적시간을 지우고 처음부터 시작할까요? 주제와 제한시간은 유지됩니다.'))return;
 debateStopClock();
 activeClass().debate={...makeDefaultDebate(),topic:p.topic,limit:p.limit};
 save();render();
}
function debateToggleFull(){
 debateFullscreen=!debateFullscreen;
 document.body.classList.toggle('debate-fullscreen',debateFullscreen);
 render();
 if(debateFullscreen)window.scrollTo({top:0,behavior:'instant'});
}
function debateExitFull(){
 debateFullscreen=false;document.body.classList.remove('debate-fullscreen');
}
function debateCopy(){
 const p=debateData();
 const lines=[activeClass().name+' · 찬반 토론', '주제: '+p.topic,'발언 제한: '+debateTime(p.limit*1000),
  '찬성: '+p.proCount+'회 · 누적 '+debateTime(p.proMs),
  '반대: '+p.conCount+'회 · 누적 '+debateTime(p.conMs),
  ...p.records.map((r,i)=>(i+1)+'회 '+debateLabel(r.side)+' 측 · '+debateTime(r.ms))];
 copyText(lines.join('\n'));
}
function debateControls(){
 const p=debateData(),ready=p.status==='ready',running=p.status==='running',resume=p.status==='paused';
 const canEnd=running||resume||p.status==='timeup';
 return '<div class="debate-controls" aria-label="교사용 토론 진행 조작">'+
 '<div class="debate-controls-identity"><strong>👩‍🏫 교사용 조작</strong><span>현재 '+debateLabel(p.side)+' · 다음 '+debateLabel(debateOther(p.side))+'</span></div>'+
 '<div class="debate-controls-buttons">'+
 '<button type="button" id="debateStart" class="btn btn-primary" '+(ready||resume?'':'disabled')+'>▶ '+(resume?'계속하기':'발언 시작')+'</button>'+
 '<button type="button" id="debatePause" class="btn btn-outline" '+(running?'':'disabled')+'>⏸ 일시정지</button>'+
 '<button type="button" id="debateNext" class="btn btn-secondary" '+(canEnd?'':'disabled')+'>✓ 종료 + '+debateLabel(debateOther(p.side))+' 측</button>'+
 '<button type="button" id="debateFinish" class="btn btn-outline" '+(p.status==='complete'?'disabled':'')+'>🏁 토론 종료</button>'+
 '</div></div>';
}
function debateCard(side,p){
 const active=p.status!=='complete'&&p.side===side;
 const count=side==='pro'?p.proCount:p.conCount,ms=side==='pro'?p.proMs:p.conMs;
 return '<section class="debate-team-card debate-'+side+(active?' is-speaking':'')+'" aria-label="'+debateLabel(side)+' 측">'+
 '<div class="debate-team-icon">'+(side==='pro'?'👍':'👎')+'</div>'+
 '<h2>'+debateLabel(side)+' 측</h2>'+
 '<span class="debate-team-status">'+(p.status==='complete'?'토론 완료':active?'🎤 현재 발언':'발언 대기')+'</span>'+
 '<div class="debate-team-metrics"><div><small>발언 횟수</small><strong>'+count+'회</strong></div><div><small>누적 발언시간</small><strong>'+debateTime(ms)+'</strong></div></div></section>';
}
function renderDebate(){
 const p=debateData(),left=Math.max(0,p.limit*1000-debateElapsed(p)),used=debateElapsed(p);
 const isEnded=p.status==='complete',isTimed=p.status==='timeup';
 const desc={ready:'발언 준비',running:'🎙 발언 중',paused:'⏸ 일시정지',timeup:'⏰ 제한시간 종료',complete:'🏁 토론 완료'};
 const board='<div class="debate-board">'+
 '<div class="debate-topic-banner"><span>💬 오늘의 토론 주제</span><h2>'+escapeHtml(p.topic||'토론 주제를 입력해 주세요')+'</h2></div>'+
 '<div class="debate-match"><div>'+debateCard('pro',p)+'</div><div class="debate-vs">VS</div><div>'+debateCard('con',p)+'</div></div>'+
 '<div class="debate-center-clock '+(isTimed?'is-timeup':'')+'"><span>'+escapeHtml(desc[p.status]||'발언 준비')+' · '+(isEnded?'전체 토론 종료':debateLabel(p.side)+' 측 · '+p.turn+'번째 발언')+'</span>'+
 '<div id="debateClock" class="debate-countdown" role="timer" aria-label="남은 발언시간">'+debateTime(isEnded?0:left,true)+'</div>'+
 '<div class="debate-progress-track"><div id="debateBar" class="debate-progress-fill" style="width:'+Math.min(100,used*100/(p.limit*1000)).toFixed(2)+'%"></div></div>'+
 '<p>경과 <strong id="debateElapsed">'+debateTime(used)+'</strong> / 제한 '+debateTime(p.limit*1000)+' · 발언 종료 후 다음 측으로 전환</p></div>'+
 '</div>';
 const header=debateFullscreen?'<div class="debate-full-head"><strong>🗣️ 찬반 토론 진행판</strong><button id="debateFullBtn" class="btn btn-outline btn-small">✕ 관리 화면으로</button></div>':title('수업 진행','찬반 토론 진행판','찬성·반대가 번갈아 발언하고 선생님이 제한시간과 차례를 관리합니다.','🗣️');
 if(debateFullscreen)return header+board+debateControls();
 const settings='<section class="panel debate-settings">'+
 '<div class="debate-setting-title"><h2>⚙️ 토론 설정</h2><span>학급별로 자동 저장됩니다</span></div>'+
 '<div class="debate-setting-fields"><label>오늘의 토론 주제<input type="text" class="field" id="debateTopic" maxlength="140" value="'+escapeHtml(p.topic)+'" placeholder="예: 우리 학교에 휴대전화 사용을 허용해야 할까요?" '+(isEnded?'disabled':'')+'></label>'+
 '<div class="debate-duration"><span>한 번 발언 제한시간</span><div><input type="number" class="field" id="debateMinutes" min="0" max="15" value="'+Math.floor(p.limit/60)+'" '+(p.status==='ready'?'':'disabled')+' aria-label="발언시간 분">분 <input type="number" class="field" id="debateSeconds" min="0" max="59" value="'+p.limit%60+'" '+(p.status==='ready'?'':'disabled')+' aria-label="발언시간 초">초 <button type="button" class="btn btn-outline btn-small" id="debateApplyTime" '+(p.status==='ready'?'':'disabled')+'>시간 적용</button></div>'+
 '<div class="debate-presets">'+[30,60,90,120,180].map(n=>'<button type="button" data-debate-preset="'+n+'" class="btn btn-outline btn-small" '+(p.status==='ready'?'':'disabled')+'>'+debateTime(n*1000)+'</button>').join('')+'</div></div></div>'+
 '<div class="debate-settings-bottom"><span>첫 발언 측</span><button type="button" id="debatePro" class="btn btn-small '+(p.side==='pro'?'btn-primary':'btn-outline')+'" '+(p.status==='ready'?'':'disabled')+'>👍 찬성</button><button type="button" id="debateCon" class="btn btn-small '+(p.side==='con'?'btn-secondary':'btn-outline')+'" '+(p.status==='ready'?'':'disabled')+'>👎 반대</button><span class="debate-help">발언을 마치면 자동으로 반대편 차례를 준비합니다.</span></div></section>';
 const records=p.records.slice(-12).reverse().map((r,i)=>'<li><strong>'+debateLabel(r.side)+' 측</strong><span>'+debateTime(r.ms)+'</span><small>'+escapeHtml(r.at)+'</small></li>').join('');
 const foot='<section class="panel debate-records"><div><h2>📋 발언 기록</h2><div class="debate-record-buttons"><button type="button" id="debateCopy" class="btn btn-outline btn-small">기록 복사</button><button type="button" id="debateReset" class="btn btn-outline btn-small">↺ 처음부터 다시</button><button type="button" id="debateFullBtn" class="btn btn-secondary btn-small">⛶ 전자칠판 크게 보기</button></div></div>'+
 (records?'<ol>'+records+'</ol>':'<p>아직 완료된 발언이 없습니다.</p>')+'</section>';
 return header+settings+board+debateControls()+foot;
}
