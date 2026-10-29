/* v1.27 오늘의 학습 목표 달성판 — 목표 입력·체크·전자칠판 */
'use strict';
let goalsFullscreen=false;
function goalNew(){return {id:safeId(),text:'',done:false};}
function makeDefaultGoals(){return {title:'오늘의 학습 목표',items:[goalNew(),goalNew(),goalNew()],celebrated:false};}
function normalizeGoals(raw){
 const x=raw&&typeof raw==='object'?raw:{},d=makeDefaultGoals(),ids=new Set();
 const items=Array.isArray(x.items)&&x.items.length?x.items.slice(0,8).filter(i=>i&&typeof i==='object').map(i=>{
  let id=String(i.id||safeId()).slice(0,90);if(ids.has(id))id=safeId();ids.add(id);
  return {id,text:String(i.text||'').slice(0,250),done:i.done===true};
 }):d.items;
 return {title:String(x.title||d.title).slice(0,90),items,celebrated:x.celebrated===true};
}
function goalsState(){const c=activeClass();return c.goals||(c.goals=makeDefaultGoals());}
function goalsReady(gs=goalsState()){return gs.items.filter(x=>x.text.trim());}
function goalsScore(gs=goalsState()){
 const items=goalsReady(gs),done=items.filter(i=>i.done).length;
 return {count:items.length,done,percentage:items.length?Math.round(done*100/items.length):0};
}
function goalText(id,text){
 const gs=goalsState(),x=gs.items.find(i=>i.id===id);if(!x)return;
 x.text=String(text||'').slice(0,250);if(!x.text.trim())x.done=false;gs.celebrated=false;save();
 // Editing in the main panel doesn't need a full render until blur.
}
function goalTitle(text){goalsState().title=String(text||'').slice(0,90);save();}
function goalToggle(id){
 const gs=goalsState(),x=gs.items.find(i=>i.id===id);
 if(!x||!x.text.trim())return toast('먼저 학습 목표를 입력해 주세요.');
 x.done=!x.done;
 const score=goalsScore(gs);
 if(score.count>0&&score.done===score.count&&!gs.celebrated){gs.celebrated=true;beep();toast('🎉 모든 학습 목표를 달성했습니다!');}
 if(score.done<score.count)gs.celebrated=false;
 save();render();
}
function goalAdd(){
 const gs=goalsState();if(gs.items.length>=8)return toast('학습 목표는 최대 8개까지 등록할 수 있습니다.');
 gs.items.push(goalNew());save();render();
}
function goalRemove(id){
 const gs=goalsState();if(gs.items.length===1)return toast('학습 목표는 최소 1개가 필요합니다.');
 gs.items=gs.items.filter(x=>x.id!==id);gs.celebrated=false;save();render();
}
function goalMove(id,dir){
 const gs=goalsState(),i=gs.items.findIndex(x=>x.id===id),to=i+dir;
 if(i<0||to<0||to>=gs.items.length)return;
 [gs.items[i],gs.items[to]]=[gs.items[to],gs.items[i]];save();render();
}
function goalReset(){
 const gs=goalsState();
 if(!gs.items.some(x=>x.done))return toast('초기화할 달성 기록이 없습니다.');
 if(!confirm('학습 목표의 달성 표시를 모두 초기화할까요? 작성한 목표는 유지됩니다.'))return;
 gs.items.forEach(x=>x.done=false);gs.celebrated=false;save();render();
}
function goalFullToggle(){goalsFullscreen=!goalsFullscreen;document.body.classList.toggle('goals-fullscreen',goalsFullscreen);render();if(goalsFullscreen)window.scrollTo({top:0,behavior:'instant'});}
function goalExitFull(){goalsFullscreen=false;document.body.classList.remove('goals-fullscreen');}
function goalCopy(){
 const gs=goalsState();
 copyText([gs.title,...gs.items.filter(i=>i.text.trim()).map((i,idx)=>(idx+1)+'. '+(i.done?'[달성] ':'[진행 중] ')+i.text)].join('\n'));
}
function goalBoard(){
 const gs=goalsState(),s=goalsScore(gs),active=gs.items.filter(i=>i.text.trim());
 const blocks=active.length?active.map((g,i)=>'<button type="button" class="goal-card '+(g.done?'is-achieved':'')+'" data-goal-toggle="'+escapeHtml(g.id)+'" aria-pressed="'+g.done+'">'+
 '<span class="goal-number">'+(i+1)+'</span><strong>'+escapeHtml(g.text)+'</strong><span class="goal-check">'+(g.done?'✅ 달성!':'○ 도전 중')+'</span></button>').join(''):
 '<div class="goal-empty">왼쪽에서 오늘의 학습 목표를 입력해 주세요.</div>';
 return '<section class="goal-board"><header><span>🎯 오늘의 학습 목표</span><h2>'+escapeHtml(gs.title)+'</h2></header>'+
 '<div class="goal-progress-title"><span>달성한 학습 목표</span><strong>'+s.done+' / '+s.count+'개 · '+s.percentage+'%</strong></div>'+
 '<div class="goal-progress"><div style="width:'+s.percentage+'%"></div></div>'+
 '<div class="goal-card-list">'+blocks+'</div>'+
 (s.count&&s.count===s.done?'<div class="goal-congrats">🎉 오늘의 학습 목표를 모두 달성했어요!</div>':'')+
 '</section>';
}
function goalActions(){
 return '<div class="goal-actions"><strong>👩‍🏫 교사용 목표 확인</strong><div>'+
 '<button type="button" class="btn btn-primary" id="goalFull">'+(goalsFullscreen?'✕ 관리 화면으로':'⛶ 전자칠판 크게 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="goalReset">↺ 달성 표시 초기화</button></div></div>';
}
function goalEditor(){
 const gs=goalsState();
 return '<section class="panel goal-editor"><h2>① 학습 목표 작성</h2><label>수업 제목<input type="text" id="goalTitle" class="field" maxlength="90" value="'+escapeHtml(gs.title)+'"></label>'+
 '<div class="goal-edit-list">'+gs.items.map((g,i)=>'<div class="goal-edit-row"><span>'+(i+1)+'</span>'+
 '<textarea rows="2" class="field" maxlength="250" data-goal-text="'+escapeHtml(g.id)+'" placeholder="예: 오늘 배운 개념을 설명할 수 있다.">'+escapeHtml(g.text)+'</textarea>'+
 '<div class="goal-edit-acts"><button type="button" class="btn btn-outline btn-small" data-goal-up="'+escapeHtml(g.id)+'" '+(i===0?'disabled':'')+'>↑</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-goal-down="'+escapeHtml(g.id)+'" '+(i===gs.items.length-1?'disabled':'')+'>↓</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-goal-remove="'+escapeHtml(g.id)+'" '+(gs.items.length===1?'disabled':'')+'>×</button></div></div>').join('')+'</div>'+
 '<div class="goal-editor-bottom"><button type="button" class="btn btn-secondary" id="goalAdd" '+(gs.items.length>=8?'disabled':'')+'>＋ 학습 목표 추가</button>'+
 '<button type="button" class="btn btn-outline" id="goalCopy">📋 목표·달성 결과 복사</button></div>'+
 '<p>학습 목표를 입력한 뒤 「전자칠판 크게 보기」에서 각 목표를 눌러 달성 표시를 할 수 있습니다.</p></section>';
}
function renderGoals(){
 if(goalsFullscreen)return '<div class="goal-full-head"><strong>🎯 학습 목표 달성판</strong><button id="goalFull" type="button" class="btn btn-outline btn-small">✕ 관리 화면으로</button></div>'+goalBoard()+goalActions();
 return title('수업 진행','오늘의 학습 목표 달성판','오늘 달성할 학습 목표를 등록하고 수업 종료 시 학생들과 함께 확인합니다.','🎯')+
 '<div class="goal-layout">'+goalEditor()+'<div class="goal-preview"><h2>② 학생용 진행판</h2>'+goalBoard()+goalActions()+'</div></div>';
}
