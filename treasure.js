/* 별이와 송이 수업도구 ⑦ 송이의 보물찾기 미션 — 교사 PC 한 대, 학생 접속 없음 */
'use strict';
const TREASURE_STOPS=[
 {icon:'🌲',name:'속삭이는 숲'},{icon:'🌉',name:'무지개 다리'},
 {icon:'🏖️',name:'조개 해변'},{icon:'⛰️',name:'바람 언덕'},
 {icon:'🌻',name:'해바라기 들판'},{icon:'🏰',name:'오래된 성'},
 {icon:'🌋',name:'용암 바위'},{icon:'🌊',name:'반짝이는 호수'},
 {icon:'💎',name:'비밀 보물 동굴'}
];
const TREASURE_PRESETS=[
 {label:'🔢 수학 탐험',title:'송이의 수학 보물찾기',questions:[
  ['8 + 7은 얼마일까요?','15','8에 2를 먼저 더해 보세요.'],
  ['24 ÷ 6은 얼마일까요?','4','6을 몇 번 더해야 24가 될까요?'],
  ['삼각형의 변은 몇 개일까요?','3개','삼각형을 그려서 세어 보세요.'],
  ['1m는 몇 cm일까요?','100cm','10cm 자를 열 개 이어 보세요.'],
  ['9 × 3은 얼마일까요?','27','9를 세 번 더해 보세요.'],
  ['40 - 18은 얼마일까요?','22','40에서 20을 빼고 2를 더해 보세요.'],
  ['1시간은 몇 분일까요?','60분','시계 긴바늘이 한 바퀴 돌아요.'],
  ['36 ÷ 4는 얼마일까요?','9','4 × 9를 계산해 보세요.'],
  ['최종 보물 미션! 12 + 13은 얼마일까요?','25','12 + 10 + 3으로 나누어 계산해 보세요.']
 ]},
 {label:'✏️ 국어 어휘 탐험',title:'송이의 국어 보물찾기',questions:[
  ['‘높다’의 반대말은 무엇일까요?','낮다','높지 않은 상태예요.'],
  ['‘기쁘다’와 비슷한 뜻의 낱말 한 가지는?','즐겁다','마음이 즐거울 때예요.'],
  ['‘해가 뜨는 때’를 뜻하는 낱말은?','아침','하루를 시작하는 시간이랍니다.'],
  ['‘밤하늘에서 반짝이는 천체’를 한 단어로 말하면?','별','해와 달 외에도 밤에 보여요.'],
  ['‘모르는 것을 물어 알아봄’을 뜻하는 말은?','질문','궁금할 때 선생님께 해요.'],
  ['‘공손하게 인사를 함’을 나타내는 말은?','인사','만나거나 헤어질 때 해요.'],
  ['‘발을 이용해 움직이는 것’을 뜻하는 동사는?','걷다','달리기보다 천천히 움직여요.'],
  ['‘사과’를 이루는 음절은 몇 개일까요?','2개','사 / 과로 나누어 보세요.'],
  ['최종 보물 미션! ‘학교’라는 낱말의 음절은 몇 개일까요?','2개','학 / 교로 나누어 보세요.']
 ]},
 {label:'🌱 과학·생활 탐험',title:'송이의 자연 보물찾기',questions:[
  ['식물이 땅속에서 물을 흡수하는 부분은?','뿌리','땅속으로 자라는 부분이에요.'],
  ['해가 뜨는 방향은 어느 쪽일까요?','동쪽','나침반의 동서남북을 생각해 보세요.'],
  ['낮과 밤이 생기는 주된 까닭은 지구의 무엇 때문일까요?','자전','지구가 스스로 빙글빙글 돌아요.'],
  ['자석의 같은 극끼리는 서로 어떻게 될까요?','밀어낸다','N극과 N극을 가까이 해 보세요.'],
  ['물에 열을 가해 끓을 때 생기는 기체는?','수증기','물의 기체 상태예요.'],
  ['달은 태양 빛을 내는 것일까요, 반사하는 것일까요?','반사한다','달은 스스로 빛을 내지 않아요.'],
  ['씨앗에서 가장 먼저 나오는 식물의 기관 중 하나는?','뿌리','씨앗이 발아할 때 나와요.'],
  ['한 해의 계절은 모두 몇 개일까요?','4개','봄, 여름, 가을, 겨울이에요.'],
  ['최종 보물 미션! 지구의 자연 위성은 무엇일까요?','달','밤하늘에서 볼 수 있어요.']
 ]}
];
let treasureFull=false,treasureEditOpen=false,treasureUndoSnapshot=null,treasureMessage='';
function treasureRandomKeys(){
 const positions=Array.from({length:8},(_,i)=>i);
 for(let i=positions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
 return positions.slice(0,3).sort((a,b)=>a-b);
}
function treasureMakePreset(p){
 return {title:p.title,questions:p.questions.map(row=>({q:row[0],a:row[1],h:row[2]})),
  keyPositions:treasureRandomKeys(),cleared:Array(9).fill(null),
  wrong:Array(9).fill(0),active:null,hintShown:false,revealed:false,sound:true,completed:false};
}
function makeDefaultTreasure(){return treasureMakePreset(TREASURE_PRESETS[0]);}
function treasureValidateKeys(keys){
 return Array.isArray(keys)&&keys.length===3&&keys.every(n=>Number.isInteger(n)&&n>=0&&n<8)&&new Set(keys).size===3;
}
function normalizeTreasure(raw){
 const v=raw&&typeof raw==='object'?raw:{},d=makeDefaultTreasure();
 const questions=Array.isArray(v.questions)?v.questions.slice(0,9).map(q=>({
  q:String(q?.q??'').trim().slice(0,220),
  a:String(q?.a??'').trim().slice(0,140),
  h:String(q?.h??'').trim().slice(0,180)
 })):[];
 const validQuestions=questions.length===9&&questions.every(q=>q.q&&q.a);
 const qs=validQuestions?questions:d.questions;
 const keys=treasureValidateKeys(v.keyPositions)?v.keyPositions.slice():d.keyPositions;
 const cleared=Array.isArray(v.cleared)&&v.cleared.length===9?
  v.cleared.map(x=>x==='solved'||x==='revealed'?x:null):Array(9).fill(null);
 const wrong=Array.from({length:9},(_,i)=>Math.max(0,Math.min(9999,Math.floor(Number(v.wrong?.[i])||0))));
 const allKeys=keys.every(i=>cleared[i]!==null);
 if(!allKeys)cleared[8]=null;
 const completed=allKeys&&cleared[8]!==null;
 const active=Number.isInteger(v.active)&&v.active>=0&&v.active<=8&&cleared[v.active]===null&&
  (v.active!==8||allKeys)?v.active:null;
 return {title:String(v.title??d.title).trim().slice(0,80)||d.title,questions:qs,keyPositions:keys,
  cleared,wrong,active,hintShown:active!==null&&v.hintShown===true,
  revealed:active!==null&&v.revealed===true,sound:v.sound!==false,completed};
}
function treasureState(){const c=activeClass();return c.treasure||(c.treasure=makeDefaultTreasure());}
function treasureStats(s){
 const keys=s.keyPositions.filter(i=>s.cleared[i]!==null).length;
 return {keys,cleared:s.cleared.slice(0,8).filter(Boolean).length,
  found:s.cleared.filter(x=>x==='solved').length,revealed:s.cleared.filter(x=>x==='revealed').length,
  wrong:s.wrong.reduce((a,b)=>a+b,0),caveUnlocked:keys===3,completed:s.completed};
}
function treasureLeave(){
 treasureFull=false;document.body.classList.remove('treasure-fullscreen');
 treasureEditOpen=false;treasureUndoSnapshot=null;treasureMessage='';
}
function treasureToggleFull(){
 if(!treasureFull)treasureEditOpen=false;
 treasureFull=!treasureFull;document.body.classList.toggle('treasure-fullscreen',treasureFull);
 render();if(treasureFull)window.scrollTo({top:0,behavior:'instant'});
}
function treasureToggleEdit(){treasureEditOpen=!treasureEditOpen;render();}
function treasureSelect(i){
 const s=treasureState(),stat=treasureStats(s);
 if(s.completed)return toast('보물찾기를 완료했어요! 새 탐험을 시작해 주세요.');
 if(!Number.isInteger(i)||i<0||i>8)return;
 if(i===8&&!stat.caveUnlocked)return toast('먼저 지도에서 황금 열쇠 3개를 모두 찾아야 해요.');
 if(s.cleared[i])return toast('이미 완료한 장소예요. 새로운 장소를 탐험해 보세요!');
 if(s.active!==null&&s.active!==i)return toast('지금 열린 미션을 해결하거나 닫은 뒤 다른 장소로 이동해 주세요.');
 s.active=i;s.hintShown=false;s.revealed=false;treasureMessage='🔍 친구들과 문제를 풀어 보세요!';
 save();render();
}
function treasureClose(){
 const s=treasureState();if(s.active===null)return;
 s.active=null;s.hintShown=false;s.revealed=false;treasureMessage='';
 save();render();
}
function treasureHint(){
 const s=treasureState();if(s.active===null)return;
 s.hintShown=!s.hintShown;save();render();
}
function treasureReveal(){
 const s=treasureState();if(s.active===null)return;
 s.revealed=!s.revealed;save();render();
}
function treasureWrong(){
 const s=treasureState();if(s.active===null||s.completed)return;
 s.wrong[s.active]=Math.min(9999,s.wrong[s.active]+1);
 treasureMessage='🌷 괜찮아요! 송이와 함께 다시 생각해 보세요.';
 save();render();
}
function treasureCorrect(){
 const s=treasureState(),i=s.active;if(i===null||s.completed)return;
 if(i===8&&!treasureStats(s).caveUnlocked)return;
 treasureUndoSnapshot={classId:activeClass().id,cleared:s.cleared.slice(),active:s.active,
  hintShown:s.hintShown,revealed:s.revealed,completed:s.completed};
 s.cleared[i]=s.revealed?'revealed':'solved';
 const isKey=i<8&&s.keyPositions.includes(i);
 s.active=null;s.hintShown=false;s.revealed=false;
 const stat=treasureStats(s);
 if(i===8){
  s.completed=true;treasureMessage='🎉 송이와 함께 비밀 보물상자를 열었어요!';
 }else if(isKey){
  treasureMessage='🗝️ 황금 열쇠를 발견했어요! ('+stat.keys+'/3)'+(stat.caveUnlocked?' 이제 보물 동굴이 열렸어요!':'');
 }else{
  treasureMessage='⭐ 미션 성공! 탐험 별을 획득했어요!';
 }
 if(s.sound){soundUnlock();beep();}
 save();render();
 if(s.completed)toast('🎉 보물찾기 성공! 송이의 보물상자를 열었어요!');
}
function treasureUndo(){
 const snap=treasureUndoSnapshot,s=treasureState();
 if(!snap||snap.classId!==activeClass().id)return toast('되돌릴 직전 정답 판정이 없어요.');
 s.cleared=snap.cleared.slice();s.active=snap.active;
 s.hintShown=snap.hintShown;s.revealed=snap.revealed;s.completed=snap.completed;
 treasureUndoSnapshot=null;treasureMessage='↩ 직전 정답 판정을 취소했습니다.';
 save();render();
}
function treasureRestart(){
 const s=treasureState(),stat=treasureStats(s);
 if((s.active!==null||stat.cleared||s.completed||stat.wrong)&&!confirm('현재 미션 진행 기록을 초기화하고, 열쇠 위치도 다시 섞을까요? 문제와 저장된 설정은 유지됩니다.'))return;
 s.keyPositions=treasureRandomKeys();s.cleared=Array(9).fill(null);s.wrong=Array(9).fill(0);
 s.active=null;s.hintShown=false;s.revealed=false;s.completed=false;
 treasureUndoSnapshot=null;treasureMessage='🌈 새로운 보물찾기가 시작됐어요!';
 save();render();
}
function treasureParseQuestions(text){
 const lines=String(text??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(lines.length!==9)return {error:'미션은 지도 8곳과 최종 동굴 1곳, 총 9개를 입력해 주세요.'};
 const questions=[];
 for(let i=0;i<9;i++){
  const p=lines[i].split('|').map(x=>x.trim());
  if(p.length!==3||!p[0]||!p[1])return {error:(i+1)+'번째 줄을 [문제 | 정답 | 힌트] 형식으로 작성해 주세요. 힌트는 빈칸이어도 괜찮아요.'};
  if(p[0].length>220||p[1].length>140||p[2].length>180)return {error:(i+1)+'번째 문제의 글자 수가 너무 많아요.'};
  questions.push({q:p[0],a:p[1],h:p[2]});
 }
 return {questions};
}
function treasureSaveSettings(){
 const s=treasureState(),area=document.getElementById('treasureQuestionsInput');
 if(!area)return;
 const result=treasureParseQuestions(area.value);
 if(result.error)return toast(result.error);
 const title=String(document.getElementById('treasureTitleInput')?.value??'').trim().slice(0,80)||'송이의 보물찾기 미션';
 const changed=JSON.stringify(s.questions)!==JSON.stringify(result.questions);
 const stat=treasureStats(s);
 if(changed&&(stat.cleared||stat.wrong||s.active!==null)&&!confirm('문제를 변경하면 현재 미션 기록이 초기화됩니다. 계속할까요?'))return;
 s.title=title;
 if(changed){
  s.questions=result.questions;s.keyPositions=treasureRandomKeys();
  s.cleared=Array(9).fill(null);s.wrong=Array(9).fill(0);
  s.active=null;s.hintShown=false;s.revealed=false;s.completed=false;treasureUndoSnapshot=null;
 }
 treasureEditOpen=false;treasureMessage='✨ 새로운 미션을 준비했어요!';
 save();render();toast('💾 보물찾기 문제를 저장했습니다.');
}
function treasureLoadPreset(){
 const i=Number(document.getElementById('treasurePresetSelect')?.value),p=TREASURE_PRESETS[i];
 if(!p)return;
 const s=treasureState(),stat=treasureStats(s);
 if((stat.cleared||stat.wrong||s.active!==null)&&!confirm('예시 미션을 불러오면 현재 진행 기록이 초기화됩니다. 계속할까요?'))return;
 const fresh=treasureMakePreset(p);
 Object.assign(s,fresh,{sound:s.sound});
 treasureUndoSnapshot=null;treasureEditOpen=false;treasureMessage='✨ '+p.label+' 예시를 불러왔어요!';
 save();render();toast(treasureMessage);
}
function treasureSound(){const s=treasureState();s.sound=!s.sound;save();render();}
function treasureCopy(){const s=treasureState();copyText(s.questions.map(q=>[q.q,q.a,q.h].join(' | ')).join('\n'));}
function treasureTile(s,i){
 const final=i===8,stat=treasureStats(s),done=s.cleared[i]!==null,
  locked=final&&!stat.caveUnlocked,isKey=done&&s.keyPositions.includes(i),
  active=s.active===i,icon=done?(final?'🏆':isKey?'🗝️':'⭐'):locked?'🔒':TREASURE_STOPS[i].icon;
 return '<button type="button" class="treasure-tile'+(done?' treasure-tile-done':'')+
  (locked?' treasure-tile-locked':'')+(active?' treasure-tile-active':'')+
  (final?' treasure-tile-final':'')+'" data-treasure-tile="'+i+'"'+(done||locked||s.completed?' disabled':'')+
  ' aria-label="'+(i+1)+'번 '+escapeHtml(TREASURE_STOPS[i].name)+(done?' 완료':locked?' 열쇠 필요':' 탐험')+'">'+
  '<span class="treasure-spot-badge">'+(final?'🏁 최종 미션':String(i+1)+'번 장소')+'</span>'+
  '<span class="treasure-spot-icon" aria-hidden="true">'+icon+'</span>'+
  '<strong>'+escapeHtml(TREASURE_STOPS[i].name)+'</strong>'+
  '<small>'+(done?(final?'보물 발견!':isKey?'열쇠 획득!':'탐험 완료'):locked?'열쇠 3개 필요':active?'미션 도전 중':'터치하여 미션 열기')+'</small></button>';
}
function treasureMap(){
 const s=treasureState(),stat=treasureStats(s);
 return '<section class="treasure-board" aria-label="송이의 보물찾기 지도">'+
 '<div class="treasure-hero"><div><span>🌈 송이와 떠나는 신나는 보물찾기!</span><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>지도에서 장소를 선택하고 문제를 풀어 황금 열쇠 3개를 찾아요!</p></div><div class="treasure-mascot" aria-hidden="true">🐿️🧭</div></div>'+
 '<div class="treasure-stats"><span>🗝️ 찾은 열쇠 <strong>'+stat.keys+' / 3</strong></span>'+
 '<span>⭐ 탐험 완료 <strong>'+stat.cleared+' / 8</strong></span>'+
 '<span>🧠 스스로 해결 <strong>'+stat.found+'개</strong></span>'+
 '<span>🌷 다시 시도 <strong>'+stat.wrong+'번</strong></span></div>'+
 '<div class="treasure-map-wrapper"><div class="treasure-map-heading"><strong>🗺️ 송이의 보물지도</strong>'+
 '<span>'+(stat.caveUnlocked?'🔓 보물 동굴이 열렸어요!':'🗝️ 열쇠를 모두 찾으면 보물 동굴에 갈 수 있어요')+'</span></div>'+
 '<div class="treasure-grid">'+TREASURE_STOPS.map((_,i)=>treasureTile(s,i)).join('')+'</div>'+
 '<p class="treasure-map-foot">💡 열쇠가 어느 장소에 숨었는지는 미리 알 수 없어요. 교사가 정답을 판정하면 발견한 열쇠가 표시됩니다.</p></div>'+
 (treasureMessage?'<div class="treasure-message" role="status">'+escapeHtml(treasureMessage)+'</div>':'')+
 (s.completed?'<div class="treasure-victory" role="status"><span>🎉🏆💎</span><h3>송이의 보물찾기 성공!</h3><p>세 개의 황금 열쇠를 모으고 비밀 보물 동굴의 마지막 미션까지 해결했어요!</p></div>':'')+
 '</section>';
}
function treasureMission(){
 const s=treasureState(),i=s.active;
 if(i===null)return '<section class="treasure-mission treasure-mission-idle"><div>🎒🔍🗺️</div><h3>어디부터 탐험할까요?</h3><p>지도에서 아직 탐험하지 않은 장소를 누르면 문제를 볼 수 있어요.</p></section>';
 const q=s.questions[i],final=i===8;
 return '<section class="treasure-mission" aria-label="교사용 보물 미션 판정">'+
 '<div class="treasure-mission-head"><strong>'+(final?'💎 최종 보물 동굴':'🧭 '+(i+1)+'번 '+escapeHtml(TREASURE_STOPS[i].name))+'</strong>'+
 '<button type="button" class="btn btn-outline btn-small" id="treasureClose">✕ 미션 닫기</button></div>'+
 '<div class="treasure-question"><span>📜 송이의 비밀 미션</span><p>'+escapeHtml(q.q)+'</p></div>'+
 (s.hintShown?'<div class="treasure-hint">💡 힌트: '+escapeHtml(q.h||'친구들과 함께 천천히 생각해 보세요.')+'</div>':'')+
 (s.revealed?'<div class="treasure-answer">✅ 정답: '+escapeHtml(q.a)+'</div>':'')+
 '<div class="treasure-mission-help">친구들이 구두로 답하면 선생님이 정답 여부를 판정해 주세요.</div>'+
 '<div class="treasure-mission-actions">'+
 '<button type="button" class="btn btn-outline" id="treasureHint">💡 '+(s.hintShown?'힌트 가리기':'힌트 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="treasureReveal">👀 '+(s.revealed?'정답 가리기':'정답 공개')+'</button>'+
 '<button type="button" class="btn btn-secondary" id="treasureWrong">🌷 다시 도전</button>'+
 '<button type="button" class="btn btn-primary" id="treasureCorrect">✅ 미션 성공!</button></div></section>';
}
function treasureControls(){
 const s=treasureState();return '<div class="treasure-controls">'+
 '<button type="button" class="btn btn-outline" id="treasureUndo" '+(!treasureUndoSnapshot||treasureUndoSnapshot.classId!==activeClass().id?'disabled':'')+'>↩ 직전 판정 취소</button>'+
 '<button type="button" class="btn btn-secondary" id="treasureRestart">🔄 새 보물찾기</button>'+
 '<button type="button" class="btn btn-outline" id="treasureFull">'+(treasureFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!treasureFull?'<button type="button" class="btn btn-outline" id="treasureEdit">'+(treasureEditOpen?'✕ 편집 닫기':'⚙️ 미션·문제 편집')+'</button>':'')+
 '</div>';
}
function treasureEditor(){
 const s=treasureState();
 return '<section class="panel treasure-editor"><h2>👩‍🏫 송이의 보물찾기 문제 편집</h2>'+
 '<p class="treasure-editor-help">지도 1~8번 장소와 마지막 보물 동굴에 사용할 문제를 한 줄씩 입력합니다. 총 9문제예요. <strong>문제 | 정답 | 힌트</strong> 순서로 구분해 주세요.</p>'+
 '<div class="treasure-preset-row"><label>예시 미션 선택<select id="treasurePresetSelect" class="field">'+
 TREASURE_PRESETS.map((p,i)=>'<option value="'+i+'">'+escapeHtml(p.label)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="treasurePreset">✨ 예시 불러오기</button></div>'+
 '<label for="treasureTitleInput">활동 제목<input id="treasureTitleInput" class="field" maxlength="80" value="'+escapeHtml(s.title)+'"></label>'+
 '<label for="treasureQuestionsInput">문제 9개 (각 줄: 문제 | 정답 | 힌트)</label>'+
 '<textarea id="treasureQuestionsInput" class="field treasure-questions-input" rows="11" spellcheck="false" placeholder="8 + 7은? | 15 | 8에 2를 더해 보세요.">'+
 escapeHtml(s.questions.map(q=>[q.q,q.a,q.h].join(' | ')).join('\n'))+'</textarea>'+
 '<p class="treasure-editor-help">마지막 9번째 문제가 최종 동굴 미션입니다. 문제를 수정하면 미션 진행 기록은 초기화되지만, 다른 학급이나 수업도구 정보는 유지됩니다.</p>'+
 '<div class="treasure-editor-actions"><button type="button" class="btn btn-primary" id="treasureSave">💾 문제 저장</button>'+
 '<button type="button" class="btn btn-outline" id="treasureCopy">📋 문제 목록 복사</button>'+
 '<button type="button" class="btn btn-outline" id="treasureSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div></section>';
}
function renderTreasure(){
 return (treasureFull?'<div class="treasure-full-head"><strong>🗝️ 송이의 보물찾기 미션</strong><button type="button" class="btn btn-outline btn-small" id="treasureFull">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','송이의 보물찾기 미션','지도를 탐험하고 문제를 맞혀 열쇠 3개를 모아 최종 보물 동굴에 도전하세요!','🗝️'))+
 '<div class="treasure-layout">'+treasureMap()+treasureMission()+treasureControls()+
 (!treasureFull&&treasureEditOpen?treasureEditor():'')+
 (!treasureFull?'<p class="treasure-privacy">🔒 교사 PC 한 대에서 진행합니다. 학생 로그인·QR 접속·실시간 서버가 필요 없고 학급별 기록은 브라우저에 저장됩니다.</p>':'')+
 '</div>';
}
