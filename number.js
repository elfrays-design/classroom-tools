/* 별이와 송이 수업도구 ⑧ 숫자 마법사 — 교사용 PC 한 대의 사칙연산 퍼즐 */
'use strict';
const NUMBER_MODES={
 easy:{label:'🌱 쉬움 · 덧셈·뺄셈 (3장)',n:3,ops:['+','-']},
 medium:{label:'🌟 보통 · 곱셈 포함 (4장)',n:4,ops:['+','-','×']},
 hard:{label:'🪄 도전 · 나눗셈 포함 (4장)',n:4,ops:['+','-','×','÷']}
};
const NUMBER_EXAMPLES=[
 {label:'쉬움 · 목표 10',mode:'easy',numbers:[3,5,2],target:10},
 {label:'보통 · 목표 17',mode:'medium',numbers:[2,3,4,5],target:17},
 {label:'도전 · 목표 10',mode:'hard',numbers:[2,3,4,6],target:10}
];
let numberFull=false,numberEditOpen=false,numberSelected=[],numberNotice='';
function numberValue(a,b,op){
 let v;
 if(op==='+')v=a+b;
 else if(op==='-')v=a-b;
 else if(op==='×')v=a*b;
 else if(op==='÷')v=b!==0&&a%b===0?a/b:NaN;
 else return null;
 return Number.isInteger(v)&&v>0&&v<=200?v:null;
}
function numberCards(numbers){return numbers.map((v,i)=>({id:i,value:v,expr:String(v)}));}
function numberApply(cards,move,nextId,ops){
 if(!move||!ops.includes(move.op)||!Number.isInteger(move.a)||!Number.isInteger(move.b)||move.a===move.b)return null;
 const left=cards.find(x=>x.id===move.a),right=cards.find(x=>x.id===move.b);
 if(!left||!right)return null;
 const value=numberValue(left.value,right.value,move.op);
 if(value===null)return null;
 return [...cards.filter(x=>x.id!==move.a&&x.id!==move.b),
  {id:nextId,value,expr:'('+left.expr+' '+move.op+' '+right.expr+')'}];
}
function numberReplay(numbers,moves,mode){
 let cards=numberCards(numbers),validMoves=[];
 for(const move of moves.slice(0,numbers.length-1)){
  const next=numberApply(cards,move,numbers.length+validMoves.length,NUMBER_MODES[mode].ops);
  if(!next)break;
  cards=next;validMoves.push({a:move.a,b:move.b,op:move.op});
 }
 return {cards,moves:validMoves};
}
function numberSolve(cards,target,ops){
 const failures=new Set();
 function dfs(items,steps){
  if(items.length===1)return items[0].value===target?steps:null;
  const key=items.map(x=>x.value).sort((a,b)=>a-b).join(',');
  if(failures.has(key))return null;
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j],remaining=items.filter((_,k)=>k!==i&&k!==j);
   for(const op of ops){
    const candidates=(op==='-'||op==='÷')?[[a,b],[b,a]]:[[a,b]];
    for(const [left,right] of candidates){
     const value=numberValue(left.value,right.value,op);
     if(value===null)continue;
     const entry={a:left.value,b:right.value,op,value,leftExpr:left.expr,rightExpr:right.expr};
     const next={id:-1,value,expr:'('+left.expr+' '+op+' '+right.expr+')'};
     const found=dfs([...remaining,next],[...steps,entry]);
     if(found)return found;
    }
   }
  }
  failures.add(key);return null;
 }
 return dfs(cards,[]);
}
function numberRandomPuzzle(mode){
 const def=NUMBER_MODES[mode];
 for(let attempt=0;attempt<75;attempt++){
  const numbers=Array.from({length:def.n},()=>2+Math.floor(Math.random()*8));
  let value=numbers[0],uses=new Set(),valid=true;
  for(let i=1;i<numbers.length;i++){
   const b=numbers[i],choices=def.ops.map(op=>({op,v:numberValue(value,b,op)}))
    .filter(x=>x.v!==null&&x.v<100&&(x.op!=='×'||b>1)&&(x.op!=='÷'||b>1));
   if(!choices.length){valid=false;break;}
   const pick=choices[Math.floor(Math.random()*choices.length)];
   uses.add(pick.op);value=pick.v;
  }
  if(!valid||value<3||value>99)continue;
  // 어려운 단계는 곱셈/나눗셈이 실제로 필요해지도록 가능한 범위에서 문제를 생성합니다.
  if(mode==='medium'&&!uses.has('×')&&attempt<40)continue;
  if(mode==='hard'&&!uses.has('÷')&&attempt<55)continue;
  if(numberSolve(numberCards(numbers),value,def.ops))
   return {mode,numbers,target:value};
 }
 const p=NUMBER_EXAMPLES.find(x=>x.mode===mode);
 return {mode,numbers:p.numbers.slice(),target:p.target};
}
function numberFromPuzzle(p,sound=true){
 return {mode:p.mode,numbers:p.numbers.slice(),target:p.target,moves:[],round:0,hintShown:false,answerShown:false,sound};
}
function makeDefaultNumber(){return numberFromPuzzle(NUMBER_EXAMPLES[0]);}
function normalizeNumber(raw){
 const d=makeDefaultNumber(),v=raw&&typeof raw==='object'?raw:{};
 const mode=Object.hasOwn(NUMBER_MODES,v.mode)?v.mode:d.mode;
 const numbers=Array.isArray(v.numbers)?v.numbers.map(Number):[];
 const target=Number(v.target);
 const validNumbers=numbers.length===NUMBER_MODES[mode].n&&numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=20);
 const validTarget=Number.isInteger(target)&&target>=1&&target<=199;
 const valid=validNumbers&&validTarget&&!!numberSolve(numberCards(numbers),target,NUMBER_MODES[mode].ops);
 const base=valid?{mode,numbers,target}:NUMBER_EXAMPLES[0];
 const moves=Array.isArray(v.moves)?v.moves.slice(0,base.numbers.length-1):[];
 const replay=numberReplay(base.numbers,moves,base.mode);
 return {mode:base.mode,numbers:base.numbers.slice(),target:base.target,moves:replay.moves,round:0,
  hintShown:v.hintShown===true,answerShown:v.answerShown===true,sound:v.sound!==false};
}
function numberState(){const c=activeClass();return c.number||(c.number=makeDefaultNumber());}
function numberBoardState(s){
 const replay=numberReplay(s.numbers,s.moves,s.mode),cards=replay.cards;
 return {cards,steps:replay.moves.length,won:cards.length===1&&cards[0].value===s.target,
  ended:cards.length===1&&cards[0].value!==s.target};
}
function numberLeave(){
 numberFull=false;document.body.classList.remove('number-fullscreen');
 numberEditOpen=false;numberSelected=[];numberNotice='';
}
function numberToggleFull(){
 if(!numberFull)numberEditOpen=false;
 numberFull=!numberFull;document.body.classList.toggle('number-fullscreen',numberFull);
 numberSelected=[];render();if(numberFull)window.scrollTo({top:0,behavior:'instant'});
}
function numberToggleEdit(){numberEditOpen=!numberEditOpen;numberSelected=[];render();}
function numberSelect(id){
 const s=numberState(),board=numberBoardState(s);
 if(board.won||board.ended||!Number.isInteger(id)||!board.cards.some(x=>x.id===id))return;
 if(numberSelected.includes(id))numberSelected=numberSelected.filter(x=>x!==id);
 else if(numberSelected.length<2)numberSelected.push(id);
 else numberSelected=[numberSelected[0],id];
 numberNotice='';render();
}
function numberCombine(op){
 const s=numberState(),board=numberBoardState(s);
 if(board.won||board.ended)return;
 if(!NUMBER_MODES[s.mode].ops.includes(op))return;
 if(numberSelected.length!==2)return toast('먼저 계산할 숫자 카드 두 장을 차례로 선택해 주세요.');
 const a=board.cards.find(x=>x.id===numberSelected[0]),b=board.cards.find(x=>x.id===numberSelected[1]);
 if(!a||!b)return;
 const value=numberValue(a.value,b.value,op);
 if(value===null)return toast('계산 결과는 1~200의 자연수여야 해요. 나눗셈은 나누어떨어질 때만 사용할 수 있어요.');
 s.moves.push({a:a.id,b:b.id,op});
 numberSelected=[];s.hintShown=false;s.answerShown=false;
 const result=numberBoardState(s);
 numberNotice=result.won?'🎉 마법 성공! 모든 숫자 카드로 목표 숫자를 만들었어요!':
  result.ended?'🌷 아깝지만 목표 숫자와 달라요. 직전 계산 취소나 다시 시작을 눌러 보세요.':
  '✨ '+a.value+' '+op+' '+b.value+' = '+value+'! 다음 계산을 이어가 보세요.';
 if(result.won&&s.sound){soundUnlock();beep();}
 save();render();
}
function numberUndo(){
 const s=numberState();if(!s.moves.length)return toast('되돌릴 계산이 없어요.');
 s.moves.pop();numberSelected=[];s.hintShown=false;s.answerShown=false;
 numberNotice='↩ 직전 계산을 취소하고 숫자 카드를 되돌렸어요.';
 save();render();
}
function numberReset(){
 const s=numberState();
 if(s.moves.length&&!confirm('현재 계산 과정을 처음으로 되돌릴까요? 문제 숫자와 목표 숫자는 유지됩니다.'))return;
 s.moves=[];s.hintShown=false;s.answerShown=false;numberSelected=[];
 numberNotice='숫자 마법에 다시 도전해 보세요! 🌈';save();render();
}
function numberNewRound(){
 const s=numberState();
 if(s.moves.length&&!confirm('현재 계산 과정을 지우고 새로운 무작위 문제를 만들까요?'))return;
 const next=numberRandomPuzzle(s.mode);Object.assign(s,numberFromPuzzle(next,s.sound));
 numberSelected=[];numberNotice='🪄 새로운 숫자 마법 문제가 나타났어요!';
 save();render();
}
function numberHint(){
 const s=numberState();s.hintShown=!s.hintShown;save();render();
}
function numberAnswer(){
 const s=numberState();s.answerShown=!s.answerShown;save();render();
}
function numberSound(){const s=numberState();s.sound=!s.sound;save();render();}
function numberParseNumbers(text,mode){
 const numbers=String(text??'').split(/[\s,，]+/).map(x=>x.trim()).filter(Boolean).map(Number);
 if(numbers.length!==NUMBER_MODES[mode].n)return {error:'선택한 난이도에서는 숫자 카드 '+NUMBER_MODES[mode].n+'장을 입력해야 해요.'};
 if(numbers.some(x=>!Number.isInteger(x)||x<1||x>20))return {error:'숫자 카드는 1~20 사이의 자연수로 입력해 주세요.'};
 return {numbers};
}
function numberSaveSettings(){
 const mode=document.getElementById('numberModeInput')?.value;
 if(!Object.hasOwn(NUMBER_MODES,mode))return toast('난이도를 선택해 주세요.');
 const numbersResult=numberParseNumbers(document.getElementById('numberCardsInput')?.value,mode);
 if(numbersResult.error)return toast(numbersResult.error);
 const target=Number(document.getElementById('numberTargetInput')?.value);
 if(!Number.isInteger(target)||target<1||target>199)return toast('목표 숫자는 1~199 사이의 자연수로 입력해 주세요.');
 if(!numberSolve(numberCards(numbersResult.numbers),target,NUMBER_MODES[mode].ops))
  return toast('이 문제는 모든 숫자 카드를 한 번씩 써서 목표 숫자를 만들 수 없습니다. 숫자나 목표를 바꿔 주세요.');
 const s=numberState(),newPuzzle={mode,numbers:numbersResult.numbers,target};
 const changed=s.mode!==mode||s.target!==target||JSON.stringify(s.numbers)!==JSON.stringify(newPuzzle.numbers);
 if(changed&&s.moves.length&&!confirm('문제 설정을 바꾸면 현재 계산 기록이 초기화됩니다. 계속할까요?'))return;
 if(changed)Object.assign(s,numberFromPuzzle(newPuzzle,s.sound));
 numberEditOpen=false;numberSelected=[];numberNotice='💾 선생님이 만든 숫자 문제가 준비됐어요!';
 save();render();toast('직접 만든 숫자 문제를 저장했어요.');
}
function numberLoadExample(){
 const i=Number(document.getElementById('numberPresetInput')?.value),p=NUMBER_EXAMPLES[i];if(!p)return;
 const s=numberState();if(s.moves.length&&!confirm('현재 계산 기록을 지우고 예시 문제를 불러올까요?'))return;
 Object.assign(s,numberFromPuzzle(p,s.sound));
 numberSelected=[];numberEditOpen=false;numberNotice='🌟 '+p.label+' 문제를 불러왔어요!';
 save();render();
}
function numberHintContent(s){
 const board=numberBoardState(s);
 const solution=numberSolve(board.cards,s.target,NUMBER_MODES[s.mode].ops);
 if(!solution)return '지금 남은 카드로 목표 숫자를 만들 수 없어요. 직전 계산을 취소하거나 다시 시작해 보세요.';
 if(!solution.length)return '이미 목표 숫자를 완성했어요!';
 const first=solution[0];return '힌트: '+first.a+' '+first.op+' '+first.b+' = '+first.value+' 계산을 시도해 보세요.';
}
function numberAnswerContent(s){
 const solution=numberSolve(numberCards(s.numbers),s.target,NUMBER_MODES[s.mode].ops);
 if(!solution)return '계산 방법을 찾을 수 없어요. 설정을 확인해 주세요.';
 return solution.map((step,i)=>(i+1)+'단계: '+step.a+' '+step.op+' '+step.b+' = '+step.value).join(' → ');
}
function numberBoard(){
 const s=numberState(),board=numberBoardState(s);
 const solved=board.won,failed=board.ended;
 return '<section class="number-board" aria-label="숫자 마법사 사칙연산 게임">'+
 '<div class="number-hero"><div><span>✨ 별이와 함께 숫자 마법을 완성해요!</span><h2>숫자 마법사</h2><p>숫자 카드를 두 장씩 선택하고 연산해서 목표 숫자를 만들어 보세요.</p></div>'+
 '<div class="number-hero-mascot" aria-hidden="true">🧙‍♀️⭐</div></div>'+
 '<div class="number-target"><span>🎯 오늘의 마법 목표</span><strong>'+s.target+'</strong><small>'+escapeHtml(NUMBER_MODES[s.mode].label)+'</small></div>'+
 '<div class="number-rules">🪄 모든 숫자 카드를 정확히 한 번씩 사용해요. 두 장을 순서대로 누른 뒤 연산 기호를 선택하세요.</div>'+
 '<div class="number-play"><div class="number-play-top"><strong>🔮 마법 숫자 카드</strong><span>계산 '+board.steps+' / '+(s.numbers.length-1)+'번</span></div>'+
 '<div class="number-cards" role="group" aria-label="현재 계산에 사용할 숫자 카드">'+board.cards.map(card=>
 '<button type="button" class="number-card'+(numberSelected.includes(card.id)?' number-card-selected':'')+'" data-number-card="'+card.id+'"'+(solved||failed?' disabled':'')+
 ' aria-pressed="'+numberSelected.includes(card.id)+'" aria-label="숫자 '+card.value+' 선택"><span class="number-card-star" aria-hidden="true">✦</span>'+
 '<strong>'+card.value+'</strong><small>'+escapeHtml(card.expr)+'</small></button>').join('')+'</div>'+
 '<div class="number-operators" role="group" aria-label="계산 연산 선택">'+NUMBER_MODES[s.mode].ops.map(op=>
 '<button type="button" data-number-op="'+escapeHtml(op)+'" class="number-op" '+(numberSelected.length!==2||solved||failed?'disabled':'')+' aria-label="'+({'+' :'덧셈','-':'뺄셈','×':'곱셈','÷':'나눗셈'}[op])+'">'+op+'</button>').join('')+'</div>'+
 '<p class="number-pick-info">'+(numberSelected.length===2?'선택한 순서: '+board.cards.find(c=>c.id===numberSelected[0])?.value+' → '+board.cards.find(c=>c.id===numberSelected[1])?.value+' · 이제 연산 기호를 누르세요!':
 numberSelected.length===1?'첫 번째 숫자를 선택했어요. 두 번째 숫자를 눌러 주세요.':'두 숫자를 차례로 선택하면 연산 버튼이 켜져요.')+'</p></div>'+
 (numberNotice?'<div class="number-feedback'+(solved?' number-feedback-success':failed?' number-feedback-fail':'')+'" role="status">'+escapeHtml(numberNotice)+'</div>':'')+
 (s.hintShown?'<div class="number-hint">💡 '+escapeHtml(numberHintContent(s))+'</div>':'')+
 (s.answerShown?'<div class="number-answer"><strong>🔑 예시 정답 과정</strong><p>'+escapeHtml(numberAnswerContent(s))+'</p></div>':'')+
 (solved?'<div class="number-victory" role="status"><span>✨🌟🎉</span><h3>숫자 마법 성공!</h3><p>모든 숫자 카드를 사용해서 목표 숫자 '+s.target+'을 만들었어요!</p></div>':'')+
 (failed?'<div class="number-fail" role="status">🌷 마지막 숫자가 '+board.cards[0].value+'이 되었어요. 직전 계산 취소나 다시 시작으로 도전할 수 있어요.</div>':'')+
 '</section>';
}
function numberControls(){
 const s=numberState();return '<div class="number-controls">'+
 '<button type="button" class="btn btn-outline" id="numberUndo" '+(!s.moves.length?'disabled':'')+'>↩ 직전 계산 취소</button>'+
 '<button type="button" class="btn btn-outline" id="numberHint">💡 '+(s.hintShown?'힌트 가리기':'힌트 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="numberAnswer">🔑 '+(s.answerShown?'정답 가리기':'정답 공개')+'</button>'+
 '<button type="button" class="btn btn-outline" id="numberReset">🔄 같은 문제 다시</button>'+
 '<button type="button" class="btn btn-primary" id="numberNew">🎲 새 숫자 문제</button>'+
 '<button type="button" class="btn btn-outline" id="numberFull">'+(numberFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!numberFull?'<button type="button" class="btn btn-outline" id="numberEdit">'+(numberEditOpen?'✕ 편집 닫기':'⚙️ 난이도·문제 편집')+'</button>':'')+
 '</div>';
}
function numberEditor(){
 const s=numberState();return '<section class="panel number-editor"><h2>👩‍🏫 숫자 마법사 문제 준비</h2>'+
 '<p>쉬움은 3장, 보통·도전은 4장의 숫자 카드로 모든 숫자를 한 번씩 사용합니다. 문제 저장 시 정답이 존재하는지 확인해요.</p>'+
 '<div class="number-examples"><label>예시 문제<select id="numberPresetInput" class="field">'+NUMBER_EXAMPLES.map((p,i)=>
 '<option value="'+i+'">'+escapeHtml(p.label)+'</option>').join('')+'</select></label><button type="button" class="btn btn-outline" id="numberPreset">✨ 예시 불러오기</button></div>'+
 '<div class="number-editor-grid"><label>난이도<select class="field" id="numberModeInput">'+Object.entries(NUMBER_MODES).map(([key,val])=>
 '<option value="'+key+'" '+(s.mode===key?'selected':'')+'>'+escapeHtml(val.label)+'</option>').join('')+'</select></label>'+
 '<label>목표 숫자 (1~199)<input type="number" id="numberTargetInput" class="field" min="1" max="199" step="1" value="'+s.target+'"></label></div>'+
 '<label>숫자 카드 (쉼표 또는 공백으로 구분)<input id="numberCardsInput" class="field" placeholder="예: 2, 3, 4, 5" value="'+escapeHtml(s.numbers.join(', '))+'"></label>'+
 '<p class="number-editor-help">같은 숫자가 두 번 있어도 각각 별개의 카드입니다. 숫자는 1~20까지 가능하며 음수와 소수 계산은 사용하지 않습니다.</p>'+
 '<div class="number-editor-actions"><button type="button" class="btn btn-primary" id="numberSave">💾 직접 만든 문제 저장</button>'+
 '<button type="button" class="btn btn-outline" id="numberSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div></section>';
}
function renderNumber(){
 return (numberFull?'<div class="number-full-head"><strong>🪄 숫자 마법사</strong><button class="btn btn-outline btn-small" type="button" id="numberFull">✕ 관리 화면으로</button></div>':
 title('교실 놀이·게임','숫자 마법사','숫자 카드를 사칙연산으로 조합해 목표 숫자를 만드는 초등 수학 게임입니다.','🧙'))+
 '<div class="number-layout">'+numberBoard()+numberControls()+
 (!numberFull&&numberEditOpen?numberEditor():'')+
 (!numberFull?'<p class="number-privacy">🔒 학생 계정·QR 접속·실시간 서버 없이 교사 PC와 전자칠판에서 즐길 수 있어요. 학급별 진행 내용은 브라우저에 보관됩니다.</p>':'')+'</div>';
}
