/* 별이와 송이 수업도구 — ④ 틀린 곳을 찾아라! (교사용 로컬 오류 탐정) */
'use strict';
const DETECTIVE_MAX=40;
const DETECTIVE_PRESETS=[
 {label:'🔢 수학 오류 탐정',title:'수학 오류 탐정',questions:[
  ['7 + 5 = [[13]]','12','7에 5를 더해 보세요.','7 + 5 = 12입니다.'],
  ['삼각형의 변은 모두 [[4개]]입니다.','3개','삼각형 모양의 선을 세어 보세요.','삼각형은 변이 3개인 도형입니다.'],
  ['1m는 [[10cm]]입니다.','100cm','1m를 cm로 바꾸어 보세요.','1m = 100cm입니다.'],
  ['6 × 4 = [[20]]','24','6을 네 번 더해 보세요.','6 × 4 = 24입니다.'],
  ['1시간은 [[100분]]입니다.','60분','시계의 긴바늘 한 바퀴를 생각해 보세요.','1시간 = 60분입니다.']
 ]},
 {label:'✏️ 국어 맞춤법 탐정',title:'맞춤법 오류 탐정',questions:[
  ['오늘은 [[웬지]] 기분이 좋아요.','왠지','이유 없이 그런 느낌이 든다는 말이에요.','‘왠지’는 ‘왜인지’의 준말입니다.'],
  ['친구가 [[몇일]] 뒤에 온대요.','며칠','날짜를 셀 때 쓰는 한 단어예요.','‘며칠’이 바른 표기입니다.'],
  ['주머니에 연필을 [[너었다]].','넣었다','‘넣다’의 과거형을 생각해 보세요.','‘넣었다’가 바른 표기입니다.'],
  ['나는 책을 [[읽엇어요]].','읽었어요','‘읽다’의 과거 표현을 생각해 보세요.','‘읽었어요’가 바른 표기입니다.'],
  ['깨끗이 [[씻은후]] 잠자리에 들었어요.','씻은 후','‘후’는 앞말과 띄어 써요.','의존 명사 ‘후’는 앞말과 띄어 씁니다.']
 ]},
 {label:'🌱 과학 개념 탐정',title:'과학 개념 오류 탐정',questions:[
  ['달은 스스로 [[빛을 내는]] 천체예요.','빛을 내지 않고 햇빛을 반사하는','달빛이 어디에서 오는지 생각해 보세요.','달은 태양 빛을 반사하여 밝게 보입니다.'],
  ['식물은 주로 [[뿌리]]에서 광합성을 해요.','잎','햇빛을 많이 받는 부분을 떠올려 보세요.','많은 식물은 주로 잎에서 광합성을 합니다.'],
  ['자석의 같은 극끼리는 서로 [[끌어당깁니다]].','밀어냅니다','N극과 N극을 가까이 하면 어떻게 될까요?','자석은 같은 극끼리 밀어냅니다.'],
  ['표준 대기압에서 물은 [[0℃]]에서 끓습니다.','100℃','얼음이 녹는 온도와 끓는 온도를 구별해 보세요.','표준 대기압에서 순수한 물은 약 100℃에서 끓습니다.'],
  ['지구가 한 바퀴 자전하는 데에는 약 [[1년]]이 걸려요.','하루','낮과 밤이 바뀌는 시간을 생각해 보세요.','지구의 자전 주기는 약 24시간입니다.']
 ]},
 {label:'🌈 통합 오류 탐정',title:'우리 반 오류 탐정',questions:[
  ['9 + 8 = [[16]]','17','9에 1을 더하면 10이에요.','9 + 8 = 17입니다.'],
  ['나는 [[몇일]] 후에 생일이에요.','며칠','날짜를 셀 때 쓰는 한 단어예요.','‘며칠’이 바른 표기입니다.'],
  ['식물은 주로 [[뿌리]]에서 광합성을 해요.','잎','햇빛을 받는 부분을 생각해 보세요.','많은 식물은 주로 잎에서 광합성을 합니다.'],
  ['삼각형의 꼭짓점은 [[4개]]입니다.','3개','삼각형의 모서리를 세어 보세요.','삼각형의 꼭짓점은 3개입니다.'],
  ['자석은 같은 극끼리 서로 [[끌어당깁니다]].','밀어냅니다','같은 자석의 극을 가까이 해 보세요.','같은 극끼리는 밀어냅니다.']
 ]}
];
let detectiveFull=false,detectiveEditOpen=false,detectiveNotice='',detectiveWrongToken=-1;
function detectiveShuffle(values){
 const arr=values.slice();
 for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
 if(arr.length>1&&arr.every((value,index)=>value===index))[arr[0],arr[1]]=[arr[1],arr[0]];
 return arr;
}
function detectiveIssue(markup){
 const text=String(markup??'');
 const matches=[...text.matchAll(/\[\[([\s\S]*?)\]\]/g)];
 if(matches.length!==1||!matches[0][1].trim()||text.length>330||text.replace(matches[0][0],'').includes('[[')||text.replace(matches[0][0],'').includes(']]'))return '문장에 틀린 부분을 [[ ]]로 정확히 한 번 표시해 주세요.';
 if(!text.replace(matches[0][0],'').trim())return '틀린 부분 이외에 함께 읽을 문장도 입력해 주세요.';
 return '';
}
function detectiveFromPreset(p){
 const questions=p.questions.map(x=>({markup:x[0],correction:x[1],hint:x[2],explanation:x[3]}));
 return {title:p.title,questions,order:questions.map((_,i)=>i),index:0,outcomes:[],mistakes:Array(questions.length).fill(0),hintShown:false,revealed:false,sound:true};
}
function makeDefaultDetective(){return detectiveFromPreset(DETECTIVE_PRESETS[3]);}
function normalizeDetective(raw){
 const d=makeDefaultDetective(),v=raw&&typeof raw==='object'?raw:{};
 const questions=Array.isArray(v.questions)?v.questions.slice(0,DETECTIVE_MAX).map(q=>({
  markup:String(q?.markup??'').slice(0,330),
  correction:String(q?.correction??'').trim().slice(0,160),
  hint:String(q?.hint??'').trim().slice(0,180),
  explanation:String(q?.explanation??'').trim().slice(0,240)
 })).filter(q=>!detectiveIssue(q.markup)&&q.correction):[];
 const qs=questions.length?questions:d.questions;
 let order=Array.isArray(v.order)?v.order.slice():[];
 if(order.length!==qs.length||order.some(n=>!Number.isInteger(n)||n<0||n>=qs.length)||new Set(order).size!==qs.length)order=qs.map((_,i)=>i);
 const index=Math.max(0,Math.min(qs.length,Math.floor(Number(v.index)||0)));
 const outcomes=Array.isArray(v.outcomes)?v.outcomes.slice(0,qs.length).map(x=>['found','revealed','skipped'].includes(x)?x:null):[];
 while(outcomes.length<qs.length)outcomes.push(null);
 for(let i=index+1;i<qs.length;i++)outcomes[i]=null;
 const mistakes=Array.from({length:qs.length},(_,i)=>Math.max(0,Math.min(9999,Math.floor(Number(v.mistakes?.[i])||0))));
 return {title:String(v.title??d.title).trim().slice(0,80)||d.title,questions:qs,order,index,outcomes,mistakes,
  hintShown:index<qs.length&&v.hintShown===true,revealed:index<qs.length&&v.revealed===true,
  sound:v.sound!==false};
}
function detectiveState(){const c=activeClass();return c.detective||(c.detective=makeDefaultDetective());}
function detectiveQuestion(s){return s.index<s.questions.length?s.questions[s.order[s.index]]:null;}
function detectiveStats(s){
 const done=s.outcomes.filter(Boolean).length;
 return {total:s.questions.length,done,found:s.outcomes.filter(x=>x==='found').length,revealed:s.outcomes.filter(x=>x==='revealed').length,
  skipped:s.outcomes.filter(x=>x==='skipped').length,wrong:s.mistakes.reduce((a,b)=>a+b,0),finished:s.index>=s.questions.length};
}
function detectivePieces(markup){
 const chunks=[],rx=/\[\[([\s\S]*?)\]\]/g;
 let pos=0,match;
 const add=(s,isWrong)=>{
  if(!s)return;
  if(isWrong){chunks.push({text:s,correct:true,space:false});return;}
  for(const piece of s.split(/(\s+)/)){
   if(!piece)continue;
   chunks.push({text:piece,correct:false,space:/^\s+$/.test(piece)});
  }
 };
 while((match=rx.exec(markup))!==null){add(markup.slice(pos,match.index),false);add(match[1],true);pos=rx.lastIndex;}
 add(markup.slice(pos),false);
 return chunks;
}
function detectiveCorrected(q){
 return q.markup.replace(/\[\[([\s\S]*?)\]\]/,()=>q.correction);
}
function detectiveLeave(){
 detectiveFull=false;document.body.classList.remove('detective-fullscreen');
 detectiveEditOpen=false;detectiveNotice='';detectiveWrongToken=-1;
}
function detectiveToggleFull(){
 if(!detectiveFull)detectiveEditOpen=false;
 detectiveFull=!detectiveFull;document.body.classList.toggle('detective-fullscreen',detectiveFull);
 detectiveNotice='';detectiveWrongToken=-1;render();
 if(detectiveFull)window.scrollTo({top:0,behavior:'instant'});
}
function detectiveToggleEdit(){detectiveEditOpen=!detectiveEditOpen;detectiveNotice='';render();}
function detectivePick(index){
 const s=detectiveState(),q=detectiveQuestion(s);
 if(!q||s.revealed||s.outcomes[s.index])return;
 const chunks=detectivePieces(q.markup),part=chunks[index];
 if(!part||part.space)return;
 if(!part.correct){
  s.mistakes[s.index]=Math.min(9999,s.mistakes[s.index]+1);
  detectiveWrongToken=index;detectiveNotice='🔍 조금 더 살펴봐요. 다른 부분을 찾아볼까요?';
  save();render();return;
 }
 s.outcomes[s.index]='found';detectiveWrongToken=-1;
 detectiveNotice='🌟 정답! 잘못된 부분을 찾아냈어요!';
 if(s.sound){soundUnlock();beep();}
 save();render();
}
function detectiveHint(){
 const s=detectiveState();if(!detectiveQuestion(s))return;
 s.hintShown=!s.hintShown;save();render();
}
function detectiveReveal(){
 const s=detectiveState();if(!detectiveQuestion(s))return;
 if(s.outcomes[s.index]==='found')return;
 s.revealed=!s.revealed;
 detectiveWrongToken=-1;
 detectiveNotice=s.revealed?'👩‍🏫 정답과 해설을 확인해 보세요. 다음 문제로 이동하면 정답 공개로 기록됩니다.':'';
 save();render();
}
function detectiveAdvance(skipped=false){
 const s=detectiveState(),q=detectiveQuestion(s);
 if(!q)return;
 if(!skipped&&!s.outcomes[s.index]&&!s.revealed)return toast('틀린 곳을 찾아보거나 정답을 공개한 다음 이동해 주세요.');
 if(!s.outcomes[s.index])s.outcomes[s.index]=skipped?'skipped':'revealed';
 s.index++;s.hintShown=false;s.revealed=false;
 detectiveWrongToken=-1;detectiveNotice='';save();render();
 if(s.index===s.questions.length)toast('🎉 오류 탐정 활동을 모두 마쳤어요!');
}
function detectiveBack(){
 const s=detectiveState();if(s.index<=0)return toast('첫 번째 문제예요.');
 s.index--;s.outcomes[s.index]=null;s.hintShown=false;s.revealed=false;
 detectiveWrongToken=-1;detectiveNotice='직전 문제를 다시 도전해요!';save();render();
}
function detectiveRestart(shuffle=false){
 const s=detectiveState(),hasProgress=s.index>0||s.outcomes.some(Boolean)||s.mistakes.some(Boolean);
 if(hasProgress&&!confirm(shuffle?'진행 기록을 지우고 문제 순서를 새로 섞을까요?':'진행 기록을 지우고 첫 번째 문제부터 다시 시작할까요?'))return;
 s.index=0;s.outcomes=Array(s.questions.length).fill(null);s.mistakes=Array(s.questions.length).fill(0);
 s.hintShown=false;s.revealed=false;
 if(shuffle)s.order=detectiveShuffle(s.questions.map((_,i)=>i));
 detectiveNotice='';detectiveWrongToken=-1;save();render();
 toast(shuffle?'🎲 문제 순서를 새로 섞었어요.':'🔍 탐정 활동을 다시 시작해요!');
}
function detectiveSound(){const s=detectiveState();s.sound=!s.sound;save();render();}
function detectiveParse(raw){
 const lines=String(raw??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(!lines.length||lines.length>DETECTIVE_MAX)return {error:'문제는 1~'+DETECTIVE_MAX+'개까지 입력할 수 있어요.'};
 const questions=[];
 for(let i=0;i<lines.length;i++){
  const fields=lines[i].split('|').map(x=>x.trim());
  if(fields.length!==4||!fields[1])return {error:(i+1)+'번째 문제는 [문장 | 바른 표현 | 힌트 | 이유] 형식으로 입력해 주세요.'};
  const issue=detectiveIssue(fields[0]);
  if(issue)return {error:(i+1)+'번째 문제: '+issue};
  if(fields[1].length>160||fields[2].length>180||fields[3].length>240)return {error:(i+1)+'번째 문제 글자가 너무 길어요.'};
  questions.push({markup:fields[0],correction:fields[1],hint:fields[2],explanation:fields[3]});
 }
 return {questions};
}
function detectiveSave(){
 const s=detectiveState(),area=document.getElementById('detectiveQuestionsInput');
 if(!area)return;
 const parsed=detectiveParse(area.value);
 if(parsed.error)return toast(parsed.error);
 const title=String(document.getElementById('detectiveTitleInput')?.value??'틀린 곳을 찾아라!').trim().slice(0,80)||'틀린 곳을 찾아라!';
 const changed=JSON.stringify(parsed.questions)!==JSON.stringify(s.questions);
 if(changed&&(s.index>0||s.outcomes.some(Boolean)||s.mistakes.some(Boolean))&&!confirm('문제를 수정하면 현재 탐정 진행 기록이 초기화됩니다. 계속할까요?'))return;
 s.title=title;
 if(changed){
  s.questions=parsed.questions;s.order=s.questions.map((_,i)=>i);
  s.index=0;s.outcomes=Array(s.questions.length).fill(null);s.mistakes=Array(s.questions.length).fill(0);
  s.hintShown=false;s.revealed=false;
 }
 detectiveEditOpen=false;detectiveNotice='';detectiveWrongToken=-1;save();render();toast('💾 오류 탐정 문제를 저장했습니다.');
}
function detectivePreset(){
 const i=Number(document.getElementById('detectivePresetInput')?.value);
 const p=DETECTIVE_PRESETS[i];
 if(!p)return;
 const s=detectiveState();
 if((s.index>0||s.outcomes.some(Boolean)||s.mistakes.some(Boolean))&&!confirm('현재 진행 기록이 초기화됩니다. '+p.label+' 예시를 불러올까요?'))return;
 const sound=s.sound;activeClass().detective=detectiveFromPreset(p);
 activeClass().detective.sound=sound;detectiveEditOpen=false;detectiveNotice='';detectiveWrongToken=-1;save();render();toast('✨ '+p.label+' 예시를 불러왔어요!');
}
function detectiveCopy(){
 const s=detectiveState();copyText(s.questions.map(q=>[q.markup,q.correction,q.hint,q.explanation].join(' | ')).join('\n'));
}
function detectiveSentence(s,q){
 const pieces=detectivePieces(q.markup),done=s.outcomes[s.index],revealed=s.revealed||Boolean(done);
 return '<div class="detective-sentence" role="group" aria-label="틀린 부분을 찾을 문장">'+pieces.map((p,i)=>{
  if(p.space)return '<span class="detective-space">'+escapeHtml(p.text)+'</span>';
  return '<button type="button" class="detective-word'+(revealed&&p.correct?' detective-word-answer':'')+
   (!revealed&&i===detectiveWrongToken?' detective-word-miss':'')+'" data-detective-token="'+i+'"'+
   (revealed?' disabled':'')+' aria-label="'+escapeHtml(p.text)+(revealed&&p.correct?' 잘못된 부분':'')+'">'+escapeHtml(p.text)+'</button>';
 }).join('')+'</div>';
}
function detectiveBoard(){
 const s=detectiveState(),stat=detectiveStats(s),q=detectiveQuestion(s),outcome=stat.finished?'':s.outcomes[s.index];
 return '<section class="detective-board" aria-label="틀린 곳을 찾아라 오류 탐정 게임">'+
 '<div class="detective-hero"><div><span>🕵️ 별이와 송이의 오류 탐정 사무소</span><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>문장을 살펴보고 잘못된 부분을 찾아 눌러 보세요!</p></div><div class="detective-mascot" aria-hidden="true">🦊🔍</div></div>'+
 '<div class="detective-stats"><span>📚 진행 '+stat.done+' / '+stat.total+'</span><span>🌟 스스로 발견 '+stat.found+'</span><span>💡 정답 공개 '+stat.revealed+'</span><span>🌷 건너뜀 '+stat.skipped+'</span></div>'+
 '<div class="detective-progress" role="progressbar" aria-label="문제 진행률" aria-valuemin="0" aria-valuemax="'+stat.total+'" aria-valuenow="'+stat.done+'"><span style="width:'+(stat.done/stat.total*100)+'%"></span></div>'+
 (stat.finished?'<div class="detective-victory" role="status"><span>🎉🔍🏆</span><h3>멋진 오류 탐정이에요!</h3>'+
 '<p>'+stat.total+'문제를 살펴봤어요. 스스로 찾아낸 문제 '+stat.found+'개 · 정답 공개 '+stat.revealed+'개 · 건너뛴 문제 '+stat.skipped+'개</p></div>':
 '<div class="detective-question"><div class="detective-question-meta"><strong>사건 파일 '+(s.index+1)+' / '+stat.total+'</strong><span>잘못된 부분은 어디일까요?</span></div>'+
 '<div class="detective-casefile"><span aria-hidden="true">📜</span>'+detectiveSentence(s,q)+'</div>'+
 '<p class="detective-guidance">👆 틀렸다고 생각되는 낱말이나 표현을 클릭하세요. 학생들과 함께 토론한 뒤 교사가 눌러도 좋아요.</p>'+
 (detectiveNotice?'<div class="detective-feedback'+(outcome==='found'?' detective-feedback-good':s.revealed?' detective-feedback-revealed':'')+'" role="status">'+escapeHtml(detectiveNotice)+'</div>':'')+
 (s.hintShown?'<div class="detective-hint">💡 힌트: '+escapeHtml(q.hint||'문장을 천천히 다시 읽어 보세요.')+'</div>':'')+
 (outcome==='found'||s.revealed?'<div class="detective-solution"><span>✅ 바르게 고치면</span><strong>'+escapeHtml(detectiveCorrected(q))+'</strong>'+
 '<p>🔎 '+escapeHtml(q.explanation||'어느 부분을 어떻게 고쳤는지 함께 이야기해 보세요.')+'</p></div>':'')+
 '</div>')+'</section>';
}
function detectiveControls(){
 const s=detectiveState(),stat=detectiveStats(s),current=!stat.finished,done=current?s.outcomes[s.index]:null;
 return '<div class="detective-controls"><div class="detective-control-buttons">'+
 (current?'<button class="btn btn-outline" type="button" id="detectiveHint">💡 '+(s.hintShown?'힌트 가리기':'힌트 보기')+'</button>'+
 (!done?'<button class="btn btn-outline" type="button" id="detectiveReveal">👀 '+(s.revealed?'정답 가리기':'정답 공개')+'</button>':'')+
 (done||s.revealed?'<button class="btn btn-primary" type="button" id="detectiveNext">➡️ 다음 문제</button>':
 '<button class="btn btn-secondary" type="button" id="detectiveSkip">↪ 이 문제 건너뛰기</button>'):'')+
 '<button class="btn btn-outline" type="button" id="detectiveBack" '+(s.index<=0?'disabled':'')+'>↩ 이전 문제 재도전</button>'+
 '<button class="btn btn-outline" type="button" id="detectiveRestart">🔄 다시 시작</button>'+
 '<button class="btn btn-outline" type="button" id="detectiveShuffle">🎲 문제 섞기</button>'+
 '<button class="btn btn-outline" type="button" id="detectiveFull">'+(detectiveFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!detectiveFull?'<button class="btn btn-outline" type="button" id="detectiveEdit">'+(detectiveEditOpen?'✕ 설정 닫기':'⚙️ 문제 편집')+'</button>':'')+
 '</div></div>';
}
function detectiveEditor(){
 const s=detectiveState();
 return '<section class="panel detective-editor"><h2>👩‍🏫 오류 탐정 문제 만들기</h2>'+
 '<p class="detective-editor-note">문장 속 <strong>틀린 부분을 [[두 개의 대괄호]]로 표시</strong>하세요. 학생 화면에서는 대괄호가 보이지 않고, 어떤 부분이 틀렸는지도 공개 전까지 알 수 없어요.</p>'+
 '<div class="detective-preset"><label>기본 예시 선택<select id="detectivePresetInput" class="field">'+DETECTIVE_PRESETS.map((p,i)=>'<option value="'+i+'">'+escapeHtml(p.label)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="detectivePreset">✨ 예시 불러오기</button></div>'+
 '<label>게임 제목<input id="detectiveTitleInput" class="field" maxlength="80" value="'+escapeHtml(s.title)+'"></label>'+
 '<label for="detectiveQuestionsInput" class="detective-input-label">문제 입력 (최대 '+DETECTIVE_MAX+'개)</label>'+
 '<p class="detective-editor-note"><strong>문장 [[틀린 부분]] | 바른 표현 | 힌트 | 왜 틀렸는지 설명</strong><br/>한 줄에 한 문제씩 입력하세요. 구분 기호로 세로줄(|)을 사용합니다.</p>'+
 '<textarea id="detectiveQuestionsInput" class="field detective-questions-input" rows="11" spellcheck="false" placeholder="7 + 5 = [[13]] | 12 | 다시 더해 보세요. | 7 + 5 = 12입니다.">'+
 escapeHtml(s.questions.map(q=>[q.markup,q.correction,q.hint,q.explanation].join(' | ')).join('\n'))+'</textarea>'+
 '<div class="detective-editor-actions"><button type="button" class="btn btn-primary" id="detectiveSave">💾 설정·문제 저장</button>'+
 '<button type="button" class="btn btn-outline" id="detectiveCopy">📋 문제 목록 복사</button>'+
 '<button type="button" class="btn btn-outline" id="detectiveSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div>'+
 '<p class="detective-editor-note">🔒 학생 개별 접속이나 서버는 필요 없어요. 현재 학급의 브라우저 저장과 전체 백업·복원 기능을 그대로 사용합니다.</p></section>';
}
function renderDetective(){
 return (detectiveFull?'<div class="detective-full-head"><strong>🕵️ 틀린 곳을 찾아라!</strong><button class="btn btn-outline btn-small" type="button" id="detectiveFull">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','틀린 곳을 찾아라!','국어·수학·과학의 잘못된 표현을 찾아 고치는 우리 반 오류 탐정 놀이입니다.','🔍'))+
 '<div class="detective-layout">'+detectiveBoard()+detectiveControls()+
 (!detectiveFull&&detectiveEditOpen?detectiveEditor():'')+
 (!detectiveFull?'<p class="detective-foot">🔒 교사 PC 한 대로 참여할 수 있습니다. 터치·마우스·키보드로 틀린 부분을 찾아보세요.</p>':'')+'</div>';
}
