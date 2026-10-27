/* v1.24 즉석 확인 퀴즈판 — 학급별 OX/4지선다, 교사 공개 조작, 학생용 대형 화면 */
'use strict';
let quizFullscreen=false,quizEditIndex=0;
const QUIZ_MAX=20;
const QUIZ_ABCD=['A','B','C','D'];
function quizNewQuestion(type='ox'){
 return {id:safeId(),type:type==='choice'?'choice':'ox',text:'',options:['','','',''],answer:type==='choice'?'A':'O',explanation:''};
}
function makeDefaultQuiz(){return {title:'오늘의 즉석 확인 퀴즈',questions:[quizNewQuestion()],index:0,revealed:false,seen:[],sound:true};}
function normalizeQuiz(raw){
 const o=raw&&typeof raw==='object'?raw:{},seen=new Set();
 const questions=(Array.isArray(o.questions)?o.questions:[]).slice(0,QUIZ_MAX).filter(x=>x&&typeof x==='object').map(q=>{
  const type=q.type==='choice'?'choice':'ox';
  let id=String(q.id||safeId()).slice(0,90);
  if(seen.has(id))id=safeId();seen.add(id);
  const options=Array.isArray(q.options)?[...q.options.slice(0,4)]:[];
  while(options.length<4)options.push('');
  return {id,type,text:String(q.text||'').slice(0,400),options:options.map(v=>String(v||'').slice(0,160)),
   answer:(type==='choice'?QUIZ_ABCD:['O','X']).includes(q.answer)?q.answer:(type==='choice'?'A':'O'),
   explanation:String(q.explanation||'').slice(0,800)};
 });
 if(!questions.length)questions.push(quizNewQuestion());
 const seenIds=Array.isArray(o.seen)?o.seen.filter((id,i,arr)=>seen.has(id)&&arr.indexOf(id)===i).slice(0,QUIZ_MAX):[];
 const index=clamp(Math.floor(Number(o.index)||0),0,questions.length-1);
 return {title:String(o.title||'오늘의 즉석 확인 퀴즈').slice(0,80),questions,index,revealed:o.revealed===true&&seenIds.includes(questions[index].id),seen:seenIds,sound:o.sound!==false};
}
function quizState(){const c=activeClass();return c.quiz||(c.quiz=makeDefaultQuiz());}
function quizCurrent(q=quizState()){return q.questions[q.index];}
function quizValidation(item){
 if(!item||!item.text.trim())return '문제 내용을 입력해 주세요.';
 if(item.type==='choice'){
  if(item.options.length!==4||item.options.some(v=>!v.trim()))return '4지선다의 보기 A~D를 모두 입력해 주세요.';
  if(new Set(item.options.map(v=>v.trim())).size!==4)return '4개의 보기를 서로 다르게 입력해 주세요.';
 }
 return '';
}
function quizAnswerText(question){
 if(question.type==='ox')return question.answer==='O'?'O (맞다)':'X (틀리다)';
 return question.answer+'번 · '+(question.options[QUIZ_ABCD.indexOf(question.answer)]||'');
}
function quizEditTarget(){const q=quizState();quizEditIndex=clamp(quizEditIndex,0,q.questions.length-1);return q.questions[quizEditIndex];}
function quizEdited(question){
 const q=quizState();q.seen=q.seen.filter(id=>id!==question.id);
 if(quizCurrent(q).id===question.id)q.revealed=false;
 save();
}
function quizField(id,field,value){
 const q=quizState();
 if(field==='title'){q.title=String(value).slice(0,80);save();quizRefreshPreview();return;}
 const question=q.questions.find(x=>x.id===id);if(!question)return;
 if(field==='text')question.text=String(value).slice(0,400);
 else if(field==='explanation')question.explanation=String(value).slice(0,800);
 else if(field.startsWith('option')&&/^[0-3]$/.test(field.slice(-1)))question.options[Number(field.slice(-1))]=String(value).slice(0,160);
 else return;
 quizEdited(question);quizRefreshPreview();
}
function quizTypeChange(id,value){
 const q=quizState(),item=q.questions.find(v=>v.id===id);
 if(!item||!['ox','choice'].includes(value))return;
 item.type=value;item.answer=value==='ox'?'O':'A';quizEdited(item);render();
}
function quizAnswerChange(id,value){
 const q=quizState(),item=q.questions.find(v=>v.id===id);
 if(!item)return;
 const allowed=item.type==='ox'?['O','X']:QUIZ_ABCD;
 if(!allowed.includes(value))return;
 item.answer=value;quizEdited(item);render();
}
function quizSoundChange(on){quizState().sound=!!on;save();}
function quizAdd(type='ox'){
 const q=quizState();if(q.questions.length>=QUIZ_MAX)return toast('문제는 최대 20개까지 등록할 수 있습니다.');
 q.questions.push(quizNewQuestion(type));quizEditIndex=q.questions.length-1;save();render();
}
function quizRemove(id){
 const q=quizState();if(q.questions.length===1)return toast('문제는 최소 1개가 필요합니다.');
 const idx=q.questions.findIndex(x=>x.id===id);if(idx<0)return;
 if(!confirm((idx+1)+'번 문제를 삭제할까요?'))return;
 q.questions.splice(idx,1);q.seen=q.seen.filter(k=>k!==id);
 if(q.index>=q.questions.length)q.index=q.questions.length-1;
 else if(idx<q.index)q.index--;
 else if(idx===q.index)q.revealed=false;
 if(q.index>=q.questions.length)q.index=q.questions.length-1;
 quizEditIndex=Math.min(quizEditIndex,q.questions.length-1);
 save();render();
}
function quizSelectEdit(index){
 const q=quizState();if(index<0||index>=q.questions.length)return;
 quizEditIndex=index;render();
}
function quizGo(index){
 const q=quizState();if(index<0||index>=q.questions.length)return;
 q.index=index;q.revealed=false;save();render();
}
function quizReveal(){
 const q=quizState(),item=quizCurrent(q);if(q.revealed)return;
 const err=quizValidation(item);if(err)return toast(err);
 q.revealed=true;if(!q.seen.includes(item.id))q.seen.push(item.id);
 if(q.sound){soundUnlock();beep();}
 save();render();
}
function quizHide(){const q=quizState();if(!q.revealed)return;q.revealed=false;save();render();}
function quizMove(dir){
 const q=quizState(),n=q.index+dir;
 if(n<0||n>=q.questions.length)return;
 q.index=n;q.revealed=false;save();render();
}
function quizReset(){
 const q=quizState();if(!q.seen.length&&!q.index&&!q.revealed)return;
 if(!confirm('1번 문제부터 다시 시작하고 정답 공개 기록을 초기화할까요? 작성한 문제는 그대로 유지됩니다.'))return;
 q.index=0;q.revealed=false;q.seen=[];save();render();
}
function quizPresent(){
 const q=quizState();if(quizValidation(quizCurrent(q)))return toast('현재 문제를 입력해 주세요. 선택한 문제의 미리보기부터 시작할 수 있습니다.');
 quizFullscreen=true;document.body.classList.add('quiz-fullscreen');render();window.scrollTo({top:0,behavior:'instant'});
}
function quizExitFull(){quizFullscreen=false;document.body.classList.remove('quiz-fullscreen');}
function quizExit(){quizExitFull();render();}
function quizCopy(){
 const q=quizState();
 const lines=[q.title];
 q.questions.forEach((item,i)=>{
  lines.push('['+(i+1)+'] '+(item.type==='ox'?'OX':'4지선다')+' · '+item.text);
  if(item.type==='choice')item.options.forEach((s,j)=>lines.push(' '+QUIZ_ABCD[j]+'. '+s));
  lines.push(' 정답: '+quizAnswerText(item));
  if(item.explanation)lines.push(' 해설: '+item.explanation);
 });
 copyText(lines.join('\n'));
}
function quizControls(){
 const q=quizState(),item=quizCurrent(q);
 const isFirst=q.index===0,isLast=q.index===q.questions.length-1;
 return '<div class="quiz-controls" role="region" aria-label="교사용 퀴즈 조작">'+
 '<div class="quiz-controls-label"><strong>👩‍🏫 교사용 진행 조작</strong><small>'+(q.index+1)+' / '+q.questions.length+'번 문제</small></div>'+
 '<div class="quiz-controls-buttons">'+
 '<button class="btn btn-outline" type="button" id="quizPrev" '+(isFirst?'disabled':'')+'>← 이전 문제</button>'+
 '<button class="btn btn-primary" type="button" id="quizReveal" '+(q.revealed?'disabled':'')+'>✨ 정답 공개</button>'+
 '<button class="btn btn-outline" type="button" id="quizHide" '+(!q.revealed?'disabled':'')+'>🙈 정답 가리기</button>'+
 '<button class="btn btn-secondary" type="button" id="quizNext" '+(isLast?'disabled':'')+'>다음 문제 →</button>'+
 '</div>'+lessonReturnInline()+'</div>';
}
function quizStudentView(){
 const q=quizState(),item=quizCurrent(q),isOX=item.type==='ox';
 const options=isOX?[
  {key:'O',name:'O',detail:'맞다'},
  {key:'X',name:'X',detail:'틀리다'}
 ]:QUIZ_ABCD.map((letter,i)=>({key:letter,name:letter,detail:item.options[i]||'보기 '+letter+' 입력 대기'}));
 const opts=options.map((choice,i)=>{
  const correct=q.revealed&&choice.key===item.answer;
  return '<div class="quiz-answer-tile '+(isOX?'quiz-tile-ox ':'')+(correct?'is-answer':q.revealed?'is-muted':'')+'">'+
  (correct?'<span class="quiz-correct-mark" aria-label="정답">✓ 정답</span>':'')+
  '<span class="quiz-answer-letter">'+escapeHtml(choice.name)+'</span>'+
  '<span class="quiz-answer-detail">'+escapeHtml(choice.detail)+'</span></div>';
 }).join('');
 const valid=!quizValidation(item),prompt=item.text.trim()||'여기에 문제가 표시됩니다.';
 const explanation=q.revealed?'<div class="quiz-reveal-box" role="status"><strong>🎉 정답은 '+escapeHtml(quizAnswerText(item))+'입니다!</strong>'+
 (item.explanation.trim()?'<p>💡 '+escapeHtml(item.explanation)+'</p>':'')+'</div>':'<div class="quiz-thinking">'+(valid?'🤔 정답을 생각하고 발표해 보세요!':'왼쪽에서 문제와 보기를 입력해 주세요.')+'</div>';
 return '<section id="quizLivePreview" class="quiz-student-board '+(q.revealed?'quiz-is-revealed':'')+'">'+
 '<header class="quiz-student-header"><span>💡 즉석 확인 퀴즈</span><strong>'+escapeHtml(q.title||'오늘의 확인 퀴즈')+'</strong><small>'+(q.index+1)+' / '+q.questions.length+'</small></header>'+
 '<div class="quiz-student-main"><div class="quiz-question-label">'+(isOX?'⭕❌ OX 퀴즈':'🔢 4지선다 퀴즈')+'</div>'+
 '<h2>'+escapeHtml(prompt)+'</h2>'+
 '<div class="quiz-options '+(isOX?'quiz-options-ox':'quiz-options-choice')+'">'+opts+'</div>'+
 explanation+'</div>'+
 '<footer class="quiz-student-footer"><span>수업 참여 · 우리 반 함께 생각하기</span><span>확인한 문제 '+q.seen.length+' / '+q.questions.length+'</span></footer></section>';
}
function quizRefreshPreview(){
 if(currentView!=='quiz'||quizFullscreen)return;
 const el=document.getElementById('quizLivePreview');if(!el)return;
 const wrapper=document.createElement('div');wrapper.innerHTML=quizStudentView();
 el.replaceWith(wrapper.firstElementChild);
 const controls=document.querySelector('.quiz-controls');
 if(controls){const next=document.createElement('div');next.innerHTML=quizControls();controls.replaceWith(next.firstElementChild);}
 const stat=document.getElementById('quizRevealedCount');if(stat)stat.textContent=quizState().seen.length;
}
function quizEditor(){
 const q=quizState(),item=quizEditTarget();
 const nav=q.questions.map((v,i)=>'<button class="quiz-question-chip '+(quizEditIndex===i?'is-editing':'')+(q.index===i?' is-present':'')+'" type="button" data-quiz-edit="'+i+'">'+
 (i+1)+'번 '+(v.type==='ox'?'OX':'4지')+(q.seen.includes(v.id)?' ✓':'')+'</button>').join('');
 const opts=item.type==='choice'?'<div class="quiz-option-edit">'+QUIZ_ABCD.map((a,i)=>'<label>'+a+' 보기<input class="field" type="text" maxlength="160" data-quiz-option="'+i+'" data-quiz-id="'+escapeHtml(item.id)+'" value="'+escapeHtml(item.options[i])+'" placeholder="'+a+' 보기 입력"></label>').join('')+'</div>':'<p class="quiz-editor-hint">O는 맞다, X는 틀리다를 의미합니다.</p>';
 const answers=(item.type==='ox'?['O','X']:QUIZ_ABCD).map(k=>'<option value="'+k+'" '+(item.answer===k?'selected':'')+'>'+ (item.type==='ox'?(k==='O'?'O · 맞다':'X · 틀리다'):k+'번')+'</option>').join('');
 return '<section class="panel quiz-editor"><div class="quiz-panel-heading"><h2>① 퀴즈 문제 만들기</h2><span>최대 '+QUIZ_MAX+'문제</span></div>'+
 '<label class="quiz-form-label">퀴즈 제목<input type="text" class="field" id="quizTitle" maxlength="80" value="'+escapeHtml(q.title)+'" placeholder="예: 오늘의 과학 OX 퀴즈"></label>'+
 '<div class="quiz-question-chips">'+nav+'</div>'+
 '<div class="quiz-editor-actions"><button id="quizAddOX" type="button" class="btn btn-outline btn-small" '+(q.questions.length>=QUIZ_MAX?'disabled':'')+'>＋ OX 문제</button>'+
 '<button id="quizAddChoice" type="button" class="btn btn-outline btn-small" '+(q.questions.length>=QUIZ_MAX?'disabled':'')+'>＋ 4지선다</button>'+
 '<button id="quizRemove" type="button" class="btn btn-outline btn-small" '+(q.questions.length===1?'disabled':'')+'>문제 삭제</button></div>'+
 '<div class="quiz-edit-card"><h3>✏️ '+(quizEditIndex+1)+'번 문제 편집</h3>'+
 '<label class="quiz-form-label">문제 유형<select id="quizType" class="field" data-quiz-id="'+escapeHtml(item.id)+'"><option value="ox" '+(item.type==='ox'?'selected':'')+'>⭕❌ OX 퀴즈</option><option value="choice" '+(item.type==='choice'?'selected':'')+'>🔢 4지선다</option></select></label>'+
 '<label class="quiz-form-label">문제 내용<textarea class="field" rows="3" maxlength="400" data-quiz-text="'+escapeHtml(item.id)+'" placeholder="예: 지구는 태양 주위를 돈다.">'+escapeHtml(item.text)+'</textarea></label>'+
 opts+'<label class="quiz-form-label">정답 설정<select id="quizAnswer" class="field" data-quiz-id="'+escapeHtml(item.id)+'">'+answers+'</select></label>'+
 '<label class="quiz-form-label">정답 해설 (선택)<textarea class="field" rows="3" maxlength="800" data-quiz-explanation="'+escapeHtml(item.id)+'" placeholder="정답을 공개할 때 학생들에게 함께 보여줄 설명">'+escapeHtml(item.explanation)+'</textarea></label>'+
 '</div><p class="quiz-editor-hint">교사용 화면에서 설정한 정답은 학생용 크게 보기에서는 「정답 공개」를 누를 때까지 숨겨집니다.</p></section>';
}
function renderQuiz(){
 const q=quizState();
 const headline=title('수업 진행','즉석 확인 퀴즈판','OX 또는 4지선다 문제를 내고 학생들이 답한 뒤 정답·해설을 공개합니다.','💡');
 if(quizFullscreen)return '<div class="quiz-fullscreen-head"><strong>💡 즉석 확인 퀴즈판</strong><div class="quiz-fullscreen-head-buttons">'+(lessonReturnValid()?'<button type="button" class="btn btn-primary btn-small" data-lesson-bridge="back">↩ 수업 단계로 돌아가기</button>':'<button type="button" class="btn btn-primary btn-small" data-view="lesson">↩ 수업 단계 진행판으로</button>')+'<button type="button" id="quizExit" class="btn btn-outline btn-small">✕ 편집 화면으로</button></div></div>'+
 quizStudentView()+quizControls();
 return headline+'<div class="quiz-layout"><div class="quiz-left">'+quizEditor()+'</div>'+
 '<div class="quiz-right"><div class="quiz-preview-head"><h2>② 학생용 미리보기</h2><span>현재 출제 문제 '+(q.index+1)+'번</span></div>'+
 quizStudentView()+quizControls()+
 '<div class="quiz-management"><button id="quizPresent" type="button" class="btn btn-secondary">⛶ 전자칠판 크게 보기</button>'+
 '<button id="quizReset" type="button" class="btn btn-outline">↺ 1번부터 다시</button>'+
 '<button id="quizCopy" type="button" class="btn btn-outline">📋 문제·정답 복사</button></div>'+
 '<div class="quiz-stat-row"><span>📋 전체 '+q.questions.length+'문제</span><span>✅ 정답 공개한 문제 <strong id="quizRevealedCount">'+q.seen.length+'</strong>개</span>'+
 '<label><input type="checkbox" id="quizSound" '+(q.sound?'checked':'')+'> 🔊 정답 공개 알림음</label></div>'+
 '<div class="quiz-question-nav"><strong>문제 바로가기</strong><div>'+q.questions.map((v,i)=>'<button type="button" class="btn btn-outline btn-small" data-quiz-go="'+i+'" '+(i===q.index?'disabled':'')+'>'+(i+1)+'번</button>').join('')+'</div></div></div></div>';
}
