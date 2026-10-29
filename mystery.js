/* v1.28 교실 놀이·게임: 미스터리 상자 열기 */
'use strict';
let mysteryFull=false;
const MYSTERY_COUNTS=[6,9,12],MYSTERY_MODES=['general','mission','reward'];
const MYSTERY_PRESETS={
 general:['친구 한 명 칭찬하기 💖','오늘 배운 것 한 가지 발표하기 🎤','선생님 찬스 사용하기 👩‍🏫','한 번 더 상자 선택하기 🎁','몸으로 표현하고 맞히기 🎭','짝꿍과 하이파이브! 🙌','오늘 가장 기억에 남는 것 말하기 💡','모둠 친구와 생각 나누기 🧩','행운의 별을 받았습니다! ⭐','알쏭달쏭 퀴즈 도전 🧠','고마운 친구에게 인사하기 😊','스스로 칭찬 한마디 하기 🌈'],
 mission:['수업 핵심 단어 3개 말하기 📚','오늘 배운 내용을 10초로 설명하기 🎤','짝과 새로운 질문 만들기 ❓','친구의 의견에 이유 덧붙이기 💬','책에서 단서 하나 찾아오기 🔍','3초 안에 답해보기! ⏱️','교과서 핵심 문장 읽어보기 📖','모둠이 함께 정답 발표하기 🧩','오늘의 내용 OX 질문 만들기 ⭕','그림으로 배운 내용 표현하기 🎨','틀린 설명 고쳐 보기 🧠','새로운 예시 한 가지 생각하기 💡'],
 reward:['참여 칭찬 별 하나 ⭐','선생님의 따뜻한 칭찬 💖','행운! 다시 한 번 뽑기 🎁','칭찬 박수 다섯 번 👏','오늘의 도전 왕! 🏆','고마운 친구 한 명 소개 😊','모둠 하이파이브! 🙌','발표 도전 기회 🎤','웃음 선물 하나 😄','짝꿍과 응원 한마디 🌈','행운의 미소 보내기 ✨','오늘의 반짝이는 생각 소개 💡']
};
function mysteryMakeOrder(n){return shuffled(Array.from({length:n},(_,i)=>i));}
function makeDefaultMystery(){return {title:'오늘의 미스터리 상자',count:9,mode:'general',cards:[...MYSTERY_PRESETS.general],order:mysteryMakeOrder(9),opened:[],completed:[],selected:-1,sound:true,repeat:false};}
function normalizeMystery(raw){
 const d=makeDefaultMystery(),v=raw&&typeof raw==='object'?raw:{};
 const count=MYSTERY_COUNTS.includes(Number(v.count))?Number(v.count):9,mode=MYSTERY_MODES.includes(v.mode)?v.mode:'general';
 let cards=Array.isArray(v.cards)?v.cards.slice(0,12).map(x=>String(x??'').slice(0,180)):[];
 while(cards.length<12)cards.push(MYSTERY_PRESETS[mode][cards.length]);
 let order=Array.isArray(v.order)?v.order.slice(0,count).map(Number):[];
 if(order.length!==count||order.some(x=>!Number.isInteger(x)||x<0||x>=count)||new Set(order).size!==count)order=mysteryMakeOrder(count);
 const opened=Array.isArray(v.opened)?v.opened.filter(x=>Number.isInteger(x)&&x>=0&&x<count).filter((x,i,a)=>a.indexOf(x)===i):[];
 const completed=Array.isArray(v.completed)?v.completed.filter(x=>opened.includes(x)).filter((x,i,a)=>a.indexOf(x)===i):[];
 const selected=Number.isInteger(v.selected)&&opened.includes(v.selected)?v.selected:-1;
 return {title:String(v.title||d.title).slice(0,90),count,mode,cards,order,opened,completed,selected,sound:v.sound!==false,repeat:v.repeat===true};
}
function mysteryState(){const c=activeClass();return c.mystery||(c.mystery=makeDefaultMystery());}
function mysteryOpen(index){
 const s=mysteryState();if(!Number.isInteger(index)||index<0||index>=s.count)return;
 const already=s.opened.includes(index);if(already&&!s.repeat)return;
 if(!already){s.opened.push(index);if(s.sound){soundUnlock();beep();}}
 s.selected=index;save();render();
}
function mysteryClose(){const s=mysteryState();if(s.selected<0)return;s.selected=-1;save();render();}
function mysteryComplete(){
 const s=mysteryState(),idx=s.selected;
 if(idx<0||s.mode!=='mission'||!s.opened.includes(idx))return;
 if(!s.completed.includes(idx))s.completed.push(idx);
 s.selected=-1;save();render();toast('🎉 미션을 완료했습니다!');
}
function mysteryRestart(){
 const s=mysteryState();
 if(s.opened.length&&!confirm('열었던 상자를 다시 닫고 처음부터 시작할까요? 상자 안 내용과 배치는 유지됩니다.'))return;
 s.opened=[];s.completed=[];s.selected=-1;save();render();
}
function mysteryShuffle(){
 const s=mysteryState();
 if(s.opened.length&&!confirm('상자 속 내용을 새로 섞고 진행 기록을 초기화할까요?'))return;
 const before=s.order.join(',');s.order=mysteryMakeOrder(s.count);
 if(s.count>1&&s.order.join(',')===before)[s.order[0],s.order[1]]=[s.order[1],s.order[0]];
 s.opened=[];s.completed=[];s.selected=-1;save();render();toast('🎲 상자 속 미션을 새롭게 섞었습니다!');
}
function mysteryCountChange(raw){
 const n=Number(raw);if(!MYSTERY_COUNTS.includes(n))return;
 const s=mysteryState();if(s.count===n)return;
 if(s.opened.length&&!confirm('상자 개수를 바꾸면 열어본 기록이 초기화됩니다. 계속할까요?')){render();return;}
 s.count=n;s.order=mysteryMakeOrder(n);s.opened=[];s.completed=[];s.selected=-1;save();render();
}
function mysteryModeChange(mode){
 if(!MYSTERY_MODES.includes(mode))return;const s=mysteryState();if(s.mode===mode)return;
 if(s.opened.length&&!confirm('게임 방식을 바꾸면 열어본 기록이 초기화됩니다. 계속할까요?')){render();return;}
 s.mode=mode;s.opened=[];s.completed=[];s.selected=-1;save();render();
}
function mysteryPreset(){
 const s=mysteryState();
 if(!confirm('현재 상자 내용이 선택한 게임 방식의 예시로 교체됩니다. 계속할까요?'))return;
 s.cards=[...MYSTERY_PRESETS[s.mode]];s.order=mysteryMakeOrder(s.count);s.opened=[];s.completed=[];s.selected=-1;save();render();
}
function mysteryEditTitle(value){
 const s=mysteryState();s.title=String(value??'').slice(0,90);save();
 const e=document.getElementById('mysteryBoardTitle');if(e)e.textContent=s.title||'오늘의 미스터리 상자';
}
function mysteryEditCard(i,value){
 const s=mysteryState();if(!Number.isInteger(i)||i<0||i>=12)return;
 s.cards[i]=String(value??'').slice(0,180);
 if(s.selected>=0&&s.order[s.selected]===i)s.selected=-1;
 save();
}
function mysteryCopy(){
 const s=mysteryState();
 const lines=[s.title,'상자 '+s.count+'개 · '+s.opened.length+'개 열림 · '+s.completed.length+'개 미션 완료',
 ...s.order.map((content,i)=>(i+1)+'번 '+(s.opened.includes(i)?'[열림]':'[닫힘]')+' '+(s.cards[content]||'(빈 상자)'))];
 copyText(lines.join('\n'));
}
function mysteryFullToggle(){
 mysteryFull=!mysteryFull;document.body.classList.toggle('mystery-fullscreen',mysteryFull);
 render();if(mysteryFull)window.scrollTo({top:0,behavior:'instant'});
}
function mysteryFullExit(){mysteryFull=false;document.body.classList.remove('mystery-fullscreen');}
function mysteryModeLabel(mode){return mode==='mission'?'도전 미션':mode==='reward'?'행운·칭찬':'깜짝 미션';}
function mysteryBoard(){
 const s=mysteryState(),done=s.opened.length;
 const boxes=s.order.map((content,i)=>{
  const opened=s.opened.includes(i),completed=s.completed.includes(i);
  return '<button type="button" class="mystery-box '+(opened?'mystery-box-open':'mystery-box-closed')+(completed?' mystery-box-complete':'')+
   '" data-mystery-open="'+i+'" '+(opened&&!s.repeat?'disabled':'')+' aria-label="'+(i+1)+'번 상자'+(opened?' 이미 열림':' 열기')+'">'+
   '<span class="mystery-box-art" aria-hidden="true">'+(opened?'🎀':'🎁')+'</span>'+
   '<strong>'+(i+1)+'번 상자</strong><small>'+(completed?'✅ 미션 완료':opened?'✓ 열어봤어요':'두근두근!')+'</small></button>';
 }).join('');
 const popup=s.selected>=0?'<div class="mystery-result-layer" role="dialog" aria-modal="false" aria-label="선택한 상자 결과">'+
 '<div class="mystery-result-card"><span class="mystery-sparkles" aria-hidden="true">✨ ⭐ ✨</span>'+
 '<div class="mystery-result-icon">🎉</div><small>'+(s.selected+1)+'번 상자 · '+mysteryModeLabel(s.mode)+'</small>'+
 '<h3>'+escapeHtml(s.cards[s.order[s.selected]]||'깜짝 빈 상자입니다!')+'</h3>'+
 '<div class="mystery-result-actions">'+
 (s.mode==='mission'&&!s.completed.includes(s.selected)?'<button type="button" class="btn btn-primary" id="mysteryComplete">✅ 미션 완료</button>':'')+
 '<button type="button" class="btn btn-secondary" id="mysteryClose">🎁 다음 상자 선택</button></div></div></div>':'';
 return '<section class="mystery-board">'+
 '<header class="mystery-board-header"><div><span>🎮 우리 반 교실 놀이·게임</span><h2 id="mysteryBoardTitle">'+escapeHtml(s.title||'오늘의 미스터리 상자')+'</h2></div><span class="mystery-board-stat">🎁 '+done+' / '+s.count+'개 열었어요</span></header>'+
 '<div class="mystery-intro">마음에 드는 상자 하나를 골라보세요! 상자 속 미션은 열기 전까지 비밀입니다. 🤫</div>'+
 '<div class="mystery-grid mystery-grid-'+s.count+'">'+boxes+'</div>'+
 '<div class="mystery-board-progress"><div style="width:'+(done*100/s.count)+'%"></div></div>'+
 (done===s.count?'<div class="mystery-all-open">🎊 모든 상자를 열었어요! 정말 멋져요! 🎊</div>':'')+
 popup+'</section>';
}
function mysteryControls(){
 const s=mysteryState();
 return '<div class="mystery-controls"><strong>👩‍🏫 교사용 게임 조작</strong><div class="mystery-control-buttons">'+
 (s.selected>=0?'<button type="button" class="btn btn-primary" id="mysteryCloseControl">↩ 상자판으로 돌아가기</button>':'')+
 '<button type="button" class="btn btn-outline" id="mysteryRestart">↺ 다시 시작</button>'+
 '<button type="button" class="btn btn-secondary" id="mysteryShuffle">🎲 다시 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="mysteryFull">'+(mysteryFull?'✕ 편집 화면으로':'⛶ 전자칠판 크게 보기')+'</button></div></div>';
}
function mysteryEditor(){
 const s=mysteryState();
 const items=Array.from({length:s.count},(_,i)=>'<label class="mystery-edit-item"><span>'+String(i+1).padStart(2,'0')+'번 미션</span>'+
 '<textarea class="field" rows="2" maxlength="180" data-mystery-card="'+i+'" placeholder="상자를 열면 나올 미션을 입력하세요">'+escapeHtml(s.cards[i])+'</textarea></label>').join('');
 return '<section class="panel mystery-editor"><h2>① 미스터리 상자 준비하기</h2>'+
 '<label class="mystery-label">게임 제목<input type="text" id="mysteryTitle" class="field" maxlength="90" value="'+escapeHtml(s.title)+'"></label>'+
 '<div class="mystery-settings-row"><label>상자 개수<select id="mysteryCount" class="field">'+MYSTERY_COUNTS.map(n=>'<option value="'+n+'" '+(s.count===n?'selected':'')+'>'+n+'개</option>').join('')+'</select></label>'+
 '<label>게임 방식<select id="mysteryMode" class="field">'+
 [['general','🎁 일반'],['mission','🧠 미션 수행'],['reward','⭐ 행운·칭찬']].map(([k,v])=>'<option value="'+k+'" '+(s.mode===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div>'+
 '<div class="mystery-editor-actions"><button type="button" class="btn btn-outline btn-small" id="mysteryPreset">✨ 예시 미션 불러오기</button>'+
 '<button type="button" class="btn btn-outline btn-small" id="mysteryCopy">📋 게임 내용 복사</button></div>'+
 '<div class="mystery-edit-list">'+items+'</div>'+
 '<div class="mystery-editor-checks"><label><input type="checkbox" id="mysterySound" '+(s.sound?'checked':'')+'> 🔊 상자 열기 효과음</label>'+
 '<label><input type="checkbox" id="mysteryRepeat" '+(s.repeat?'checked':'')+'> 🔁 열었던 상자 다시 선택 허용</label></div>'+
 '<p>상자 속 내용은 무작위 배치됩니다. <strong>학생 화면에서는 상자를 열기 전까지 내용이 표시되지 않습니다.</strong></p></section>';
}
function renderMystery(){
 if(mysteryFull)return '<div class="mystery-full-head"><strong>🎁 미스터리 상자 열기</strong><button type="button" class="btn btn-outline btn-small" id="mysteryExitFull">✕ 관리 화면으로</button></div>'+mysteryBoard()+mysteryControls();
 return title('교실 놀이·게임','미스터리 상자 열기','상자 속 깜짝 미션을 골라 열어 보는 전자칠판 수업 게임입니다.','🎁')+
 '<div class="mystery-layout"><div>'+mysteryEditor()+'</div><div class="mystery-preview"><h2>② 우리 반 상자 게임</h2>'+mysteryBoard()+mysteryControls()+'</div></div>';
}
