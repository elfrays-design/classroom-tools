/* v1.29 — 교실 빙고: 전자칠판에서 함께 도전하는 문제·단어 빙고 */
'use strict';
let bingoFull=false;
const BINGO_SIZES=[3,4,5];
const BINGO_PRESETS=[
 '오늘 배운 핵심 단어 한 가지 말하기','친구에게 칭찬 한마디 하기','배운 내용을 그림으로 설명하기',
 '교과서에서 중요한 문장 찾기','짝꿍과 정답 맞혀 보기','틀린 문장을 올바르게 고치기',
 '새로 알게 된 사실 한 가지 말하기','한 문장으로 핵심 내용 정리하기','궁금한 점 하나 질문하기',
 '배운 내용과 관련된 예시 말하기','오늘의 내용을 OX 문제로 만들기','우리 모둠의 의견 발표하기',
 '핵심 개념을 몸으로 표현하기','답을 고른 이유 설명하기','친구 생각에 덧붙여 말하기',
 '생활 속에서 비슷한 사례 찾기','단어 3개로 오늘 수업 요약하기','가장 어려웠던 점 말하기',
 '다음 수업에 궁금한 점 떠올리기','용어 뜻을 내 말로 설명하기','짝꿍에게 배운 내용 알려 주기',
 '오늘의 내용을 10초 안에 발표하기','새로운 문제 한 개 만들어 보기','배운 것 중 가장 재미있는 것 말하기',
 '오늘의 학습 목표를 다시 말하기'
];
function bingoNewOrder(size){return shuffled(Array.from({length:size*size},(_,i)=>i));}
function makeDefaultBingo(){return {title:'오늘의 교실 빙고',size:3,target:1,items:[...BINGO_PRESETS],order:bingoNewOrder(3),marked:[],selected:-1,sound:true,celebrated:false,seenLines:[]};}
function bingoLines(size,marked){
 const s=new Set(marked),lines=[];
 for(let r=0;r<size;r++){const a=Array.from({length:size},(_,c)=>r*size+c);if(a.every(v=>s.has(v)))lines.push(a);}
 for(let c=0;c<size;c++){const a=Array.from({length:size},(_,r)=>r*size+c);if(a.every(v=>s.has(v)))lines.push(a);}
 const d1=Array.from({length:size},(_,i)=>i*size+i),d2=Array.from({length:size},(_,i)=>i*size+(size-1-i));
 if(d1.every(v=>s.has(v)))lines.push(d1);
 if(d2.every(v=>s.has(v)))lines.push(d2);
 return lines;
}
function normalizeBingo(raw){
 const d=makeDefaultBingo(),v=raw&&typeof raw==='object'?raw:{};
 const size=BINGO_SIZES.includes(Number(v.size))?Number(v.size):3,total=size*size;
 let items=Array.isArray(v.items)?v.items.slice(0,25).map(x=>String(x??'').slice(0,230)):[];
 while(items.length<25)items.push(BINGO_PRESETS[items.length]);
 let order=Array.isArray(v.order)?v.order.slice(0,total).map(Number):[];
 if(order.length!==total||new Set(order).size!==total||order.some(n=>!Number.isInteger(n)||n<0||n>=total))order=bingoNewOrder(size);
 const marked=Array.isArray(v.marked)?v.marked.filter(n=>Number.isInteger(n)&&n>=0&&n<total).filter((n,i,a)=>a.indexOf(n)===i):[];
 const lines=bingoLines(size,marked);
 const validKeys=new Set(lines.map(line=>line.join(',')));
 const seenLines=Array.isArray(v.seenLines)?v.seenLines.filter(k=>validKeys.has(k)).filter((k,i,a)=>a.indexOf(k)===i):[];
 const target=Number.isInteger(v.target)?clamp(v.target,1,size):1;
 return {title:String(v.title||d.title).slice(0,90),size,target,items,order,marked,
  selected:Number.isInteger(v.selected)&&v.selected>=0&&v.selected<total?v.selected:-1,
  sound:v.sound!==false,celebrated:lines.length>=target&&v.celebrated===true,seenLines};
}
function bingoState(){const c=activeClass();return c.bingo||(c.bingo=makeDefaultBingo());}
function bingoResults(s=bingoState()){
 const lines=bingoLines(s.size,s.marked),keySet=new Set(lines.map(a=>a.join(',')));
 const winning=new Set(lines.flat());
 return {lines,keySet,winning,count:lines.length,complete:lines.length>=s.target,total:s.size*s.size};
}
function bingoOpen(pos){
 const s=bingoState(),total=s.size*s.size;
 if(!Number.isInteger(pos)||pos<0||pos>=total)return;
 s.selected=pos;save();render();
}
function bingoClose(){const s=bingoState();if(s.selected<0)return;s.selected=-1;save();render();}
function bingoMark(pos,mark){
 const s=bingoState(),total=s.size*s.size;
 if(!Number.isInteger(pos)||pos<0||pos>=total)return;
 const was=s.marked.includes(pos);
 if(mark&&!was)s.marked.push(pos);
 else if(!mark&&was)s.marked=s.marked.filter(v=>v!==pos);
 const found=bingoResults(s),newLines=found.lines.filter(line=>!s.seenLines.includes(line.join(',')));
 s.seenLines=found.lines.map(line=>line.join(','));
 if(newLines.length&&s.sound){soundUnlock();beep();}
 if(newLines.length)toast('🎊 빙고 '+found.count+'줄 완성! 축하합니다!');
 if(found.complete&&!s.celebrated){s.celebrated=true;toast('🏆 목표 '+s.target+'빙고 달성! 멋져요!');}
 if(!found.complete)s.celebrated=false;
 s.selected=-1;save();render();
}
function bingoMarkSelected(mark){const pos=bingoState().selected;if(pos>=0)bingoMark(pos,mark);}
function bingoSizeChange(n){
 const size=Number(n);if(!BINGO_SIZES.includes(size))return;
 const s=bingoState();if(s.size===size)return;
 if(s.marked.length&&!confirm('빙고판 크기를 바꾸면 표시한 칸과 빙고 기록이 초기화됩니다. 계속할까요?')){render();return;}
 s.size=size;s.target=Math.min(s.target,size);s.order=bingoNewOrder(size);s.marked=[];s.selected=-1;s.seenLines=[];s.celebrated=false;save();render();
}
function bingoTargetChange(n){
 const s=bingoState(),target=Number(n);
 if(!Number.isInteger(target)||target<1||target>s.size)return;
 s.target=target;s.celebrated=bingoResults(s).complete;save();render();
}
function bingoRestart(){
 const s=bingoState();
 if(s.marked.length&&!confirm('표시한 칸과 빙고 기록을 지우고 다시 시작할까요? 입력한 내용과 배치는 유지됩니다.'))return;
 s.marked=[];s.selected=-1;s.seenLines=[];s.celebrated=false;save();render();
}
function bingoShuffle(){
 const s=bingoState();
 if(s.marked.length&&!confirm('빙고판을 다시 섞으면 표시한 칸과 빙고 기록이 초기화됩니다. 계속할까요?'))return;
 const previous=s.order.join(',');
 s.order=bingoNewOrder(s.size);
 if(s.size>1&&previous===s.order.join(','))[s.order[0],s.order[1]]=[s.order[1],s.order[0]];
 s.marked=[];s.selected=-1;s.seenLines=[];s.celebrated=false;save();render();toast('🎲 새로운 빙고판으로 섞었습니다!');
}
function bingoPreset(){
 const s=bingoState();
 if(!confirm('입력한 문제·단어가 기본 예시로 바뀌고 진행 상태도 초기화됩니다. 계속할까요?'))return;
 s.items=[...BINGO_PRESETS];s.order=bingoNewOrder(s.size);s.marked=[];s.selected=-1;s.seenLines=[];s.celebrated=false;save();render();
}
function bingoSetTitle(value){
 const s=bingoState();s.title=String(value??'').slice(0,90);save();
 const el=document.getElementById('bingoBoardTitle');if(el)el.textContent=s.title||'오늘의 교실 빙고';
}
function bingoSetItem(i,text){
 const s=bingoState();if(!Number.isInteger(i)||i<0||i>=25)return;
 s.items[i]=String(text??'').slice(0,230);save();
}
function bingoCopy(){
 const s=bingoState(),res=bingoResults(s);
 const lines=[s.title,s.size+'×'+s.size+' 빙고 · '+res.count+'줄 / 목표 '+s.target+'줄',...s.order.map((id,i)=>(i+1)+'번 '+(s.marked.includes(i)?'✅':'⬜')+' '+(s.items[id]||'(빈 칸)'))];
 copyText(lines.join('\n'));
}
function bingoToggleFull(){
 bingoFull=!bingoFull;document.body.classList.toggle('bingo-fullscreen',bingoFull);
 render();if(bingoFull)window.scrollTo({top:0,behavior:'instant'});
}
function bingoExitFull(){bingoFull=false;document.body.classList.remove('bingo-fullscreen');}
function bingoBoard(){
 const s=bingoState(),r=bingoResults(s);
 const cards=s.order.map((content,i)=>{
  const marked=s.marked.includes(i),winning=r.winning.has(i);
  return '<button type="button" data-bingo-open="'+i+'" aria-label="'+(i+1)+'번 빙고 칸 열기'+(marked?', 성공 표시됨':'')+
   '" class="bingo-cell '+(marked?'bingo-cell-stamped ':'')+(winning?'bingo-cell-winning':'')+'">'+
   (marked?'<span class="bingo-check">✅</span>':'<span class="bingo-cell-symbol" aria-hidden="true">❔</span>')+
   '<strong>'+ (i+1)+'번</strong>'+
   '<small>'+(marked?'성공! 다시 눌러 확인':'열어 보세요!')+'</small></button>';
 }).join('');
 const selected=s.selected,riddle=selected>=0?s.items[s.order[selected]]||'문제가 없는 칸입니다.':'';
 const selectedMarked=selected>=0&&s.marked.includes(selected);
 const modal=selected>=0?'<div class="bingo-reveal-overlay" role="dialog" aria-modal="false" aria-label="'+(selected+1)+'번 빙고 도전">'+
 '<div class="bingo-reveal-card"><div class="bingo-reveal-star">✨ 🟦 ✨</div><span>도전! '+(selected+1)+'번 빙고 칸</span>'+
 '<h3>'+escapeHtml(riddle)+'</h3>'+
 '<div class="bingo-reveal-buttons">'+
 (selectedMarked?'<button type="button" class="btn btn-outline" id="bingoUnmark">↶ 성공 표시 취소</button>':'<button type="button" class="btn btn-primary" id="bingoMark">✅ 성공! 칸 표시</button>')+
 '<button type="button" class="btn btn-secondary" id="bingoClose">← 문제 닫기</button></div></div></div>':'';
 return '<section class="bingo-board">'+
 '<header class="bingo-board-head"><div><small>🎮 우리 반 교실 놀이·게임</small><h2 id="bingoBoardTitle">'+escapeHtml(s.title||'오늘의 교실 빙고')+'</h2></div>'+
 '<div class="bingo-line-score"><strong>🎉 '+r.count+' 빙고</strong><small>목표 '+s.target+'줄 · 완료 '+s.marked.length+'/'+r.total+'칸</small></div></header>'+
 '<p class="bingo-intro">칸을 선택해 문제를 확인하고, 성공했으면 표시해 주세요! 가로·세로·대각선이 완성되면 빙고!</p>'+
 '<div class="bingo-grid bingo-grid-'+s.size+'" role="group" aria-label="'+s.size+'×'+s.size+' 빙고판">'+cards+'</div>'+
 '<div class="bingo-progress"><div style="width:'+Math.round(s.marked.length*100/r.total)+'%"></div></div>'+
 (r.complete?'<div class="bingo-win-banner">🏆 목표 달성! '+r.count+'빙고 성공! 🎊</div>':'')+
 modal+'</section>';
}
function bingoControls(){
 const s=bingoState();
 return '<div class="bingo-controls"><strong>👩‍🏫 교사용 빙고 조작</strong><div>'+
 (s.selected>=0?'<button type="button" class="btn btn-primary" id="bingoCloseControl">↩ 빙고판으로</button>':'')+
 '<button type="button" class="btn btn-outline" id="bingoRestart">↺ 처음부터</button>'+
 '<button type="button" class="btn btn-secondary" id="bingoShuffle">🎲 다시 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="bingoFull">'+(bingoFull?'✕ 관리 화면으로':'⛶ 전자칠판 크게 보기')+'</button>'+
 '</div></div>';
}
function bingoEditor(){
 const s=bingoState(),count=s.size*s.size;
 const entries=Array.from({length:count},(_,i)=>'<label class="bingo-edit-item"><span>'+String(i+1).padStart(2,'0')+'번 문제·단어</span>'+
 '<textarea class="field" rows="2" maxlength="230" data-bingo-item="'+i+'" placeholder="예: 오늘 배운 단어를 설명하세요">'+escapeHtml(s.items[i])+'</textarea></label>').join('');
 return '<section class="panel bingo-editor"><h2>① 빙고 게임 준비</h2>'+
 '<label class="bingo-label">게임 제목<input type="text" id="bingoTitle" class="field" maxlength="90" value="'+escapeHtml(s.title)+'"></label>'+
 '<div class="bingo-settings"><label>빙고판 크기<select id="bingoSize" class="field">'+BINGO_SIZES.map(n=>'<option value="'+n+'" '+(s.size===n?'selected':'')+'>'+n+'×'+n+' ('+(n*n)+'칸)</option>').join('')+'</select></label>'+
 '<label>목표 빙고 줄 수<select id="bingoTarget" class="field">'+Array.from({length:s.size},(_,i)=>i+1).map(n=>'<option value="'+n+'" '+(s.target===n?'selected':'')+'>'+n+'줄</option>').join('')+'</select></label></div>'+
 '<div class="bingo-editor-actions"><button type="button" id="bingoPreset" class="btn btn-outline btn-small">✨ 예시 문제 불러오기</button>'+
 '<button type="button" id="bingoCopy" class="btn btn-outline btn-small">📋 빙고판·결과 복사</button></div>'+
 '<div class="bingo-edit-list">'+entries+'</div>'+
 '<label class="bingo-sound-setting"><input type="checkbox" id="bingoSound" '+(s.sound?'checked':'')+'> 🔊 빙고 완성 효과음 켜기</label>'+
 '<p class="bingo-editor-note">입력한 문제·단어를 무작위로 섞어 표시합니다. <strong>학생용 빙고판에서는 칸을 선택하기 전까지 내용을 숨깁니다.</strong> 진행 기록을 지우려면 「처음부터」를 누르세요.</p></section>';
}
function renderBingo(){
 if(bingoFull)return '<div class="bingo-full-head"><strong>🟦 교실 빙고</strong><button type="button" class="btn btn-outline btn-small" id="bingoFullExit">✕ 관리 화면으로</button></div>'+bingoBoard()+bingoControls();
 return title('교실 놀이·게임','교실 빙고','문제·단어를 열어 보고 성공한 칸을 표시하면 빙고 줄을 자동으로 판정합니다.','🟦')+
 '<div class="bingo-layout"><div>'+bingoEditor()+'</div><div class="bingo-preview"><h2>② 학생용 교실 빙고</h2>'+bingoBoard()+bingoControls()+'</div></div>';
}
