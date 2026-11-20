/* 별이와 송이 수업도구 — 별이의 순서 기차 v1.0, 교사 PC 전용 */
'use strict';
const TRAIN_MAX=10,TRAIN_MIN=3;
const TRAIN_PRESETS=[
 {label:'🔢 수의 크기',title:'작은 수부터 큰 수까지',instruction:'숫자 카드를 작은 수부터 큰 수 순서로 놓아 보세요.',hint:'맨 앞 칸에는 가장 작은 수가 와요.',cards:['14','29','36','51','68']},
 {label:'🌱 식물의 한살이',title:'씨앗에서 꽃까지',instruction:'식물이 자라는 모습을 순서대로 기차에 실어 보세요.',hint:'씨앗을 심은 뒤 싹이 나오고, 줄기와 잎이 자라요.',cards:['🌰 씨앗을 심어요','🌱 싹이 나와요','🌿 줄기와 잎이 자라요','🌼 꽃이 피어요','🫘 열매가 맺혀요']},
 {label:'📖 이야기 순서',title:'학교 가는 아침',instruction:'아침에 학교로 가는 과정을 순서대로 완성해 보세요.',hint:'잠자리에서 일어나는 일이 가장 먼저예요.',cards:['🌞 잠자리에서 일어나요','🫧 세수를 해요','🍚 아침밥을 먹어요','🎒 가방을 챙겨요','🏫 학교에 가요']},
 {label:'📝 문장 만들기',title:'낱말 기차로 문장 완성',instruction:'낱말을 읽고 자연스러운 문장이 되도록 순서대로 배치해 보세요.',hint:'누가 무엇을 하는지 생각해 보세요.',cards:['작은','토끼가','풀밭에서','신나게','뛰어요.']},
 {label:'🌈 무지개 순서',title:'무지개 색 순서 맞히기',instruction:'무지개 색깔을 빨강부터 보라까지 순서대로 놓아 보세요.',hint:'빨주노초파남보를 기억해 보세요.',cards:['🔴 빨강','🟠 주황','🟡 노랑','🟢 초록','🔵 파랑','🟣 남색','🟪 보라']}
];
let trainFull=false,trainEditOpen=false,trainSelected=null,trainBadSlots=[],trainNotice='';
function trainShuffle(values){
 const out=values.slice();
 for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 if(out.length>1&&out.every((v,i)=>v===i)){[out[0],out[1]]=[out[1],out[0]];}
 return out;
}
function trainFromPreset(p){
 const cards=p.cards.slice();
 return {title:p.title,instruction:p.instruction,hint:p.hint,cards,order:trainShuffle(cards.map((_,i)=>i)),
  slots:Array(cards.length).fill(null),attempts:0,completed:false,checked:false,hintShown:false,answerShown:false,sound:true};
}
function makeDefaultTrain(){return trainFromPreset(TRAIN_PRESETS[0]);}
function normalizeTrain(raw){
 const d=makeDefaultTrain(),v=raw&&typeof raw==='object'?raw:{};
 let cards=Array.isArray(v.cards)?v.cards.slice(0,TRAIN_MAX).map(x=>String(x??'').trim().slice(0,110)):[];
 if(cards.length<TRAIN_MIN||cards.some(x=>!x))cards=d.cards;
 const n=cards.length,indices=cards.map((_,i)=>i);
 let order=Array.isArray(v.order)?v.order.slice():[];
 if(order.length!==n||order.some(x=>!Number.isInteger(x)||x<0||x>=n)||new Set(order).size!==n)order=trainShuffle(indices);
 let slots=Array.isArray(v.slots)?v.slots.slice():[];
 if(slots.length!==n||slots.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>=n))||new Set(slots.filter(x=>x!==null)).size!==slots.filter(x=>x!==null).length)slots=Array(n).fill(null);
 const solved=slots.every((x,i)=>x===i);
 return {title:String(v.title??d.title).trim().slice(0,80)||d.title,
  instruction:String(v.instruction??d.instruction).trim().slice(0,200)||d.instruction,
  hint:String(v.hint??'').trim().slice(0,200),
  cards,order,slots,attempts:Math.max(0,Math.min(9999,Math.floor(Number(v.attempts)||0))),
  completed:v.completed===true&&solved,checked:v.checked===true,
  hintShown:v.hintShown===true,answerShown:v.answerShown===true,sound:v.sound!==false};
}
function trainState(){const c=activeClass();return c.train||(c.train=makeDefaultTrain());}
function trainStats(s){return {placed:s.slots.filter(x=>x!==null).length,total:s.cards.length,solved:s.slots.every((x,i)=>x===i)};}
function trainLeave(){
 trainFull=false;document.body.classList.remove('train-fullscreen');
 trainEditOpen=false;trainSelected=null;trainBadSlots=[];trainNotice='';
}
function trainToggleFull(){
 if(!trainFull)trainEditOpen=false;
 trainFull=!trainFull;document.body.classList.toggle('train-fullscreen',trainFull);
 trainSelected=null;render();if(trainFull)window.scrollTo({top:0,behavior:'instant'});
}
function trainToggleEdit(){trainEditOpen=!trainEditOpen;trainSelected=null;trainBadSlots=[];trainNotice='';render();}
function trainSelect(id){
 const s=trainState();if(s.completed||!Number.isInteger(id)||id<0||id>=s.cards.length)return;
 trainSelected=trainSelected===id?null:id;trainNotice='';render();
}
function trainPlace(index,id=trainSelected){
 const s=trainState();
 if(s.completed||!Number.isInteger(index)||index<0||index>=s.cards.length)return;
 if(id===null){
  if(s.slots[index]!==null){trainSelected=s.slots[index];trainNotice='다른 칸을 누르면 카드를 옮길 수 있어요.';render();}
  else toast('먼저 아래 카드에서 옮길 카드를 선택해 주세요.');
  return;
 }
 if(!Number.isInteger(id)||id<0||id>=s.cards.length)return;
 const from=s.slots.indexOf(id);
 if(from===index){trainSelected=null;render();return;}
 const displaced=s.slots[index];
 s.slots[index]=id;
 if(from>=0)s.slots[from]=displaced;
 trainSelected=null;trainBadSlots=[];trainNotice='기차 칸에 카드를 실었어요. 🚂';
 s.checked=false;s.answerShown=false;
 save();render();
}
function trainRemove(index){
 const s=trainState();
 if(s.completed||!Number.isInteger(index)||index<0||index>=s.cards.length||s.slots[index]===null)return;
 s.slots[index]=null;s.checked=false;s.answerShown=false;
 trainSelected=null;trainBadSlots=[];trainNotice='카드를 다시 아래 카드함으로 옮겼어요.';
 save();render();
}
function trainCheck(){
 const s=trainState(),stats=trainStats(s);
 if(s.completed)return;
 if(stats.placed!==stats.total)return toast('빈 기차 칸에 카드를 모두 실은 뒤 확인해 주세요.');
 s.attempts=Math.min(9999,s.attempts+1);s.checked=true;
 trainBadSlots=s.slots.map((id,i)=>id===i?-1:i).filter(x=>x>=0);
 if(!trainBadSlots.length){
  s.completed=true;trainSelected=null;s.answerShown=false;
  trainNotice='🎉 순서 정답! 별이의 기차가 출발합니다!';
  if(s.sound){soundUnlock();beep();}
 }else{
  trainNotice='아직 순서가 달라요. 표시된 칸을 다시 확인해 보세요. 💛';
 }
 save();render();
}
function trainUndo(){
 const s=trainState();if(s.completed)return toast('완료된 기차는 다시 시작으로 초기화해 주세요.');
 const filled=s.slots.map((id,i)=>id===null?-1:i).filter(i=>i>=0);
 if(!filled.length)return toast('되돌릴 카드가 없습니다.');
 trainRemove(filled[filled.length-1]);
}
function trainRestart(shuffle=false){
 const s=trainState();if((s.slots.some(x=>x!==null)||s.attempts||s.completed)&&!confirm(shuffle?'진행 기록을 초기화하고 카드를 새로 섞을까요?':'지금까지의 배치를 지우고 다시 시작할까요?'))return;
 if(shuffle)s.order=trainShuffle(s.cards.map((_,i)=>i));
 s.slots=Array(s.cards.length).fill(null);s.attempts=0;s.completed=false;s.checked=false;s.hintShown=false;s.answerShown=false;
 trainSelected=null;trainBadSlots=[];trainNotice='새로운 기차 여행을 시작해요! 🌈';save();render();
}
function trainToggleHint(){
 const s=trainState();s.hintShown=!s.hintShown;save();render();
}
function trainToggleAnswer(){
 const s=trainState();s.answerShown=!s.answerShown;save();render();
}
function trainSound(){const s=trainState();s.sound=!s.sound;save();render();}
function trainValidateCards(raw){
 const cards=String(raw??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(cards.length<TRAIN_MIN||cards.length>TRAIN_MAX)return {error:'순서 카드는 '+TRAIN_MIN+'~'+TRAIN_MAX+'장으로 입력해 주세요.'};
 if(cards.some(x=>x.length>110))return {error:'각 카드의 글자는 110자 이내로 입력해 주세요.'};
 return {cards};
}
function trainApplySettings(){
 const s=trainState(),area=document.getElementById('trainCardsInput');
 if(!area)return;
 const parsed=trainValidateCards(area.value);
 if(parsed.error)return toast(parsed.error);
 const title=String(document.getElementById('trainTitleInput')?.value??'별이의 순서 기차').trim().slice(0,80)||'별이의 순서 기차';
 const instruction=String(document.getElementById('trainInstructionInput')?.value??'').trim().slice(0,200)||'카드를 올바른 순서로 배열해 보세요.';
 const hint=String(document.getElementById('trainHintInput')?.value??'').trim().slice(0,200);
 const changed=JSON.stringify(parsed.cards)!==JSON.stringify(s.cards);
 if(changed&&(s.slots.some(x=>x!==null)||s.attempts||s.completed)&&!confirm('카드 순서를 바꾸면 지금까지의 배치와 시도 기록이 초기화됩니다. 계속할까요?'))return;
 s.title=title;s.instruction=instruction;s.hint=hint;
 if(changed){s.cards=parsed.cards;s.order=trainShuffle(s.cards.map((_,i)=>i));s.slots=Array(s.cards.length).fill(null);s.attempts=0;s.completed=false;s.checked=false;s.hintShown=false;s.answerShown=false;}
 trainSelected=null;trainBadSlots=[];trainNotice='새 설정을 저장했어요. ✨';trainEditOpen=false;save();render();toast('💾 순서 기차 문제를 저장했어요.');
}
function trainLoadPreset(){
 const id=Number(document.getElementById('trainPresetSelect')?.value),p=TRAIN_PRESETS[id];
 if(!p)return;
 const s=trainState();
 if((s.slots.some(x=>x!==null)||s.attempts||s.completed)&&!confirm('현재 진행 기록을 지우고 '+p.label+' 예시로 바꿀까요?'))return;
 const prevSound=s.sound;activeClass().train=trainFromPreset(p);activeClass().train.sound=prevSound;
 trainSelected=null;trainBadSlots=[];trainNotice=p.label+' 예시를 불러왔어요.';trainEditOpen=false;save();render();toast('🚂 '+p.label+' 문제를 불러왔어요.');
}
function trainCopy(){const s=trainState();copyText([s.title,s.instruction,'정답 순서:',...s.cards.map((x,i)=>(i+1)+'. '+x)].join('\n'));}
function trainCardButton(s,id,placed=false){
 return '<button type="button" draggable="'+(!s.completed)+'" class="train-card'+(trainSelected===id?' train-card-selected':'')+(placed?' train-card-placed':'')+'" data-train-card="'+id+'" aria-pressed="'+(trainSelected===id)+'" aria-label="'+escapeHtml(s.cards[id])+' 카드 '+(placed?'이동':'선택')+'">'+
 '<span aria-hidden="true" class="train-card-emoji">🎫</span><strong>'+escapeHtml(s.cards[id])+'</strong></button>';
}
function trainBoard(){
 const s=trainState(),stat=trainStats(s);
 return '<section class="train-board" aria-label="별이의 순서 기차 학습 게임">'+
 '<div class="train-hero"><div class="train-hero-copy"><span>🚂 별이와 함께 떠나는 순서 여행</span><h2>'+escapeHtml(s.title)+'</h2><p>'+escapeHtml(s.instruction)+'</p></div><div class="train-hero-mascot" aria-hidden="true">🌟🚂</div></div>'+
 '<div class="train-stats"><span>🚃 채운 기차칸 <b>'+stat.placed+' / '+stat.total+'</b></span><span>🔍 확인 횟수 <b>'+s.attempts+'</b></span><span>'+(s.completed?'🏁 여행 완료':'🌈 순서 맞추는 중')+'</span></div>'+
 '<div class="train-track-head"><strong>① 순서대로 기차에 카드를 실어요</strong><small>기차 맨 앞이 1번 칸이에요.</small></div>'+
 '<div class="train-track">'+
 '<div class="train-engine" aria-hidden="true"><span>🌟</span><span>🚂</span><small>출발!</small></div>'+
 '<div class="train-wagons'+(s.completed?' train-wagons-go':'')+'">'+s.slots.map((id,i)=>{
  const bad=s.checked&&trainBadSlots.includes(i);
  return '<div class="train-wagon'+(id!==null?' train-wagon-filled':'')+(bad?' train-wagon-error':'')+'">'+
  '<span class="train-wagon-number">'+(i+1)+'번 칸</span>'+
  '<button type="button" class="train-wagon-target" data-train-slot="'+i+'" draggable="'+(id!==null&&!s.completed)+'" '+(id!==null?'data-train-card="'+id+'"':'')+' aria-label="'+(i+1)+'번 칸'+(id===null?' 비어 있음':', '+escapeHtml(s.cards[id]))+'">'+
  (id===null?'<span class="train-wagon-empty">여기에 쏙!</span>':'<span class="train-wagon-text">'+escapeHtml(s.cards[id])+'</span>')+'</button>'+
  (id!==null&&!s.completed?'<button type="button" class="train-wagon-remove" data-train-remove="'+i+'" aria-label="'+(i+1)+'번 칸 비우기">✕</button>':'')+
  '<div class="train-wheels" aria-hidden="true">⚫ ⚫</div></div>';
 }).join('')+'</div></div>'+
 '<div class="train-pool"><div class="train-pool-head"><strong>② 아래 카드를 선택하거나 끌어놓으세요</strong><small>카드를 누른 뒤 빈 기차칸을 눌러도 돼요.</small></div>'+
 '<div class="train-cards">'+s.order.filter(id=>!s.slots.includes(id)).map(id=>trainCardButton(s,id)).join('')+
 (stat.placed===stat.total?'<div class="train-pool-empty">✨ 카드함이 비었어요! 이제 순서를 확인해 보세요.</div>':'')+'</div></div>'+
 (trainNotice?'<div class="train-feedback'+(s.completed?' train-feedback-win':trainBadSlots.length?' train-feedback-try':'')+'" role="status">'+escapeHtml(trainNotice)+'</div>':'')+
 (s.hintShown?'<div class="train-hint">💡 별이의 힌트: '+escapeHtml(s.hint||'첫 번째 칸에 무엇이 와야 할지 생각해 보세요.')+'</div>':'')+
 (s.answerShown?'<div class="train-answer"><strong>🔑 정답 순서</strong><p>'+s.cards.map((x,i)=>(i+1)+'. '+escapeHtml(x)).join(' → ')+'</p></div>':'')+
 (s.completed?'<div class="train-victory" role="status"><span>🚂✨🎉</span><h3>칙칙폭폭! 순서 기차 출발!</h3><p>멋지게 순서를 완성했어요. 다음 여행도 도전해 보세요!</p></div>':'')+
 '</section>';
}
function trainControls(){
 const s=trainState(),stat=trainStats(s);
 return '<div class="train-controls" aria-label="교사용 기차 조작"><div class="train-control-buttons">'+
 (!s.completed?'<button type="button" class="btn btn-primary" id="trainCheck" '+(stat.placed!==stat.total?'disabled':'')+'>✅ 순서 확인하기</button>':'')+
 '<button type="button" class="btn btn-outline" id="trainHint">💡 '+(s.hintShown?'힌트 가리기':'힌트 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="trainAnswer">🔑 '+(s.answerShown?'정답 가리기':'정답 공개')+'</button>'+
 (!s.completed?'<button type="button" class="btn btn-outline" id="trainUndo" '+(!stat.placed?'disabled':'')+'>↩ 오른쪽 카드 빼기</button>':'')+
 '<button type="button" class="btn btn-secondary" id="trainRestart">🔄 다시 시작</button>'+
 '<button type="button" class="btn btn-outline" id="trainShuffle">🎲 카드 다시 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="trainFull">'+(trainFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!trainFull?'<button type="button" class="btn btn-outline" id="trainEdit">'+(trainEditOpen?'✕ 설정 닫기':'⚙️ 순서 카드 편집')+'</button>':'')+
 '</div></div>';
}
function trainEditor(){
 const s=trainState();
 return '<section class="panel train-editor"><h2>👩‍🏫 순서 기차 문제 만들기</h2>'+
 '<p class="train-editor-note">정답이 되는 순서대로 한 줄에 하나씩 입력하세요. 게임에서는 카드가 무작위로 섞여 나옵니다. 학급별로 이 PC에 저장됩니다.</p>'+
 '<div class="train-preset"><label>수업 예시 선택<select class="field" id="trainPresetSelect">'+TRAIN_PRESETS.map((p,i)=>'<option value="'+i+'">'+escapeHtml(p.label)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="trainPreset">✨ 예시 불러오기</button></div>'+
 '<div class="train-fields"><label>게임 제목<input class="field" id="trainTitleInput" maxlength="80" value="'+escapeHtml(s.title)+'"></label>'+
 '<label>문제 안내 문구<input class="field" id="trainInstructionInput" maxlength="200" value="'+escapeHtml(s.instruction)+'"></label>'+
 '<label>힌트<input class="field" id="trainHintInput" maxlength="200" value="'+escapeHtml(s.hint)+'"></label></div>'+
 '<label for="trainCardsInput" class="train-cards-label">순서 카드 (정답 순서대로 '+TRAIN_MIN+'~'+TRAIN_MAX+'줄)</label>'+
 '<textarea id="trainCardsInput" class="field train-cards-input" rows="9" spellcheck="false" placeholder="씨앗 심기&#10;싹이 나기&#10;잎이 자라기&#10;꽃 피기">'+escapeHtml(s.cards.join('\n'))+'</textarea>'+
 '<div class="train-editor-actions"><button type="button" class="btn btn-primary" id="trainSave">💾 설정·카드 저장</button>'+
 '<button type="button" class="btn btn-outline" id="trainCopy">📋 문제 복사</button>'+
 '<button type="button" class="btn btn-outline" id="trainSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div>'+
 '<p class="train-editor-note">🔒 학생 개인 접속·로그인·실시간 데이터 전송 없이 교사 PC만으로 운영합니다. 현재 학급의 전체 백업·복원에도 포함돼요.</p></section>';
}
function renderTrain(){
 return (trainFull?'<div class="train-full-head"><strong>🚂 별이의 순서 기차</strong><button type="button" class="btn btn-outline btn-small" id="trainFull">✕ 관리 화면으로</button></div>':
 title('교실 놀이·게임','별이의 순서 기차','카드를 바른 순서로 배열하면 귀여운 기차가 출발하는 전자칠판 학습 게임입니다.','🚂'))+
 '<div class="train-layout">'+trainBoard()+trainControls()+
 (!trainFull&&trainEditOpen?trainEditor():'')+
 (!trainFull?'<p class="train-footnote">🌈 학생 로그인 없이 PC 한 대로! 숫자·이야기·과학 과정·문장 순서를 함께 연습해요.</p>':'')+'</div>';
}
function trainAfterRender(){
 if(currentView!=='train')return;
 document.querySelectorAll('[data-train-card]').forEach(el=>{
  el.addEventListener('dragstart',event=>{
   const s=trainState(),id=Number(el.dataset.trainCard);
   if(s.completed||!Number.isInteger(id)){event.preventDefault();return;}
   event.dataTransfer.effectAllowed='move';
   event.dataTransfer.setData('text/plain','train-card:'+id);
  });
 });
 document.querySelectorAll('[data-train-slot]').forEach(el=>{
  el.addEventListener('dragover',event=>{if(trainState().completed)return;event.preventDefault();event.dataTransfer.dropEffect='move';});
  el.addEventListener('dragenter',event=>{if(trainState().completed)return;event.preventDefault();el.closest('.train-wagon')?.classList.add('train-drop-hover');});
  el.addEventListener('dragleave',()=>el.closest('.train-wagon')?.classList.remove('train-drop-hover'));
  el.addEventListener('drop',event=>{
   event.preventDefault();el.closest('.train-wagon')?.classList.remove('train-drop-hover');
   const match=/^train-card:(\d+)$/.exec(event.dataTransfer.getData('text/plain'));
   if(match)trainPlace(Number(el.dataset.trainSlot),Number(match[1]));
  });
 });
}
