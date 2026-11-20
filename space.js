/* 별이와 송이의 수업도구 상자 — 별이의 우주탐험 (교사 PC 전용) */
'use strict';
const SPACE_STOPS=[
 ['🌍','지구 출발'],['🌙','달 기지'],['🪐','고리 행성'],['☄️','혜성 길'],
 ['⭐','별빛 구역'],['🌌','은하수'],['🛸','우주 정거장'],['🌠','소원별'],['🏰','별의 성']
];
const SPACE_EXAMPLES=[
 ['7 + 5는 얼마인가요?','12','10에 2를 더해 보세요.'],
 ['우리나라의 수도는 어디인가요?','서울','한강이 흐르는 도시예요.'],
 ['삼각형의 변은 모두 몇 개일까요?','3개','이름에 힌트가 있어요.'],
 ['한 시간은 몇 분일까요?','60분','시계의 긴바늘을 생각해 보세요.'],
 ['18 - 9는 얼마인가요?','9','10에서 1을 빼 보세요.'],
 ['식물에 물을 주는 도구를 한 가지 말해 보세요.','물뿌리개','물을 뿌려 주는 도구예요.'],
 ['1년은 몇 개월일까요?','12개월','1월부터 12월까지 세어 보세요.'],
 ['3 × 4는 얼마인가요?','12','4를 세 번 더해 보세요.'],
 ['하루는 몇 시간인가요?','24시간','오전 12시간, 오후 12시간이에요.'],
 ['물의 온도를 재는 도구는 무엇인가요?','온도계','온도를 측정하는 기구예요.'],
 ['100은 10이 몇 개 모인 수일까요?','10개','10, 20, 30… 세어 보세요.'],
 ['5의 두 배는 얼마인가요?','10','5 + 5를 계산해 보세요.'],
 ['봄, 여름, 가을, 겨울은 모두 몇 계절인가요?','4계절','봄부터 겨울까지 세어 보세요.'],
 ['1m는 몇 cm인가요?','100cm','30cm 자보다 훨씬 길어요.'],
 ['우리 몸에서 피를 온몸으로 보내는 기관은?','심장','가슴에서 두근두근 뛰어요.'],
 ['2 + 8 + 5는 얼마인가요?','15','먼저 2와 8을 더해 보세요.']
];
let spaceFull=false,spaceSetupOpen=false,spaceLastTurn=null;
function spaceSampleQuestions(){return SPACE_EXAMPLES.map(a=>({q:a[0],a:a[1],h:a[2]}));}
function makeDefaultSpace(){return {title:'별이의 우주탐험',mode:'class',teamCount:2,teamNames:['1모둠','2모둠','3모둠','4모둠'],questions:spaceSampleQuestions(),questionIndex:0,teamIndex:0,scores:[0,0,0,0],revealed:false,hintShown:false,completed:false};}
function normalizeSpace(raw){
 const v=raw&&typeof raw==='object'?raw:{},d=makeDefaultSpace();
 const questions=Array.isArray(v.questions)?v.questions.slice(0,80).map(x=>({
  q:String(x?.q??'').slice(0,220).trim(),a:String(x?.a??'').slice(0,160).trim(),h:String(x?.h??'').slice(0,160).trim()
 })).filter(x=>x.q&&x.a):[];
 const names=Array.from({length:4},(_,i)=>String(v.teamNames?.[i]??d.teamNames[i]).trim().slice(0,24)||d.teamNames[i]);
 const scores=Array.from({length:4},(_,i)=>Math.max(0,Math.min(8,Math.floor(Number(v.scores?.[i])||0))));
 const mode=v.mode==='teams'?'teams':'class',teamCount=Math.max(2,Math.min(4,Math.floor(Number(v.teamCount)||2)));
 const completed=mode==='class'?scores[0]>=8:scores.slice(0,teamCount).some(x=>x>=8);
 return {title:String(v.title??d.title).trim().slice(0,80)||d.title,mode,teamCount,teamNames:names,
  questions:questions.length?questions:d.questions,questionIndex:Math.max(0,Math.min(100000,Math.floor(Number(v.questionIndex)||0))),
  teamIndex:Math.max(0,Math.floor(Number(v.teamIndex)||0))%(mode==='class'?1:teamCount),
  scores,revealed:v.revealed===true,hintShown:v.hintShown===true,completed};
}
function spaceState(){const c=activeClass();return c.space||(c.space=makeDefaultSpace());}
function spaceTeams(s){return s.mode==='class'?['우리 반']:s.teamNames.slice(0,s.teamCount);}
function spaceCurrentQuestion(s){return s.questions[s.questionIndex%s.questions.length];}
function spaceExitFull(){spaceFull=false;document.body.classList.remove('space-fullscreen');}
function spaceLeave(){spaceExitFull();spaceSetupOpen=false;spaceLastTurn=null;}
function spaceToggleFull(){
 if(!spaceFull)spaceSetupOpen=false;
 spaceFull=!spaceFull;document.body.classList.toggle('space-fullscreen',spaceFull);
 render();window.scrollTo({top:0,behavior:'instant'});
}
function spaceToggleSetup(){spaceSetupOpen=!spaceSetupOpen;render();}
function spaceJudge(correct){
 const s=spaceState();if(s.completed)return;
 spaceLastTurn={classId:activeClass().id,questionIndex:s.questionIndex,teamIndex:s.teamIndex,
  scores:s.scores.slice(),revealed:s.revealed,hintShown:s.hintShown,completed:s.completed};
 const n=s.mode==='class'?1:s.teamCount,who=s.mode==='class'?0:s.teamIndex;
 if(correct){s.scores[who]=Math.min(8,s.scores[who]+1);soundUnlock();beep();}
 s.completed=s.scores[who]>=8;
 if(!s.completed){s.questionIndex++;s.teamIndex=(who+1)%n;}
 s.revealed=false;s.hintShown=false;save();render();
 if(s.completed)toast('🎉 '+spaceTeams(s)[who]+' 우주탐험 성공!');
 else toast(correct?'🚀 정답! 우주선이 한 칸 전진했어요!':'🌠 다음 문제로 넘어갑니다.');
}
function spaceUndo(){
 const t=spaceLastTurn,s=spaceState();
 if(!t||t.classId!==activeClass().id)return toast('취소할 직전 판정이 없습니다.');
 Object.assign(s,{questionIndex:t.questionIndex,teamIndex:t.teamIndex,scores:t.scores.slice(),
  revealed:t.revealed,hintShown:t.hintShown,completed:t.completed});
 spaceLastTurn=null;save();render();toast('직전 판정을 취소했습니다.');
}
function spaceRestart(){
 const s=spaceState();if(s.questionIndex||s.scores.some(Boolean)){
  if(!confirm('우주탐험 진행 기록을 초기화하고 처음부터 시작할까요? 입력한 문제는 유지됩니다.'))return;
 }
 spaceResetProgress(s);save();render();toast('새로운 우주탐험을 시작해요!');
}
function spaceResetProgress(s){
 s.questionIndex=0;s.teamIndex=0;s.scores=[0,0,0,0];s.completed=false;s.revealed=false;s.hintShown=false;spaceLastTurn=null;
}
function spaceReveal(which){
 const s=spaceState();if(which==='hint')s.hintShown=!s.hintShown;
 else s.revealed=!s.revealed;
 save();render();
}
function spaceParseQuestions(text){
 const lines=String(text||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 if(!lines.length)return {error:'문제를 한 개 이상 입력해 주세요.'};
 if(lines.length>80)return {error:'문제는 최대 80개까지 등록할 수 있습니다.'};
 const questions=[];
 for(let i=0;i<lines.length;i++){
  const parts=lines[i].split('|').map(s=>s.trim());
  if(parts.length<2||!parts[0]||!parts[1])return {error:(i+1)+'번째 줄에 문제와 정답을 | 기호로 구분해 주세요.'};
  if(parts[0].length>220||parts[1].length>160||(parts[2]||'').length>160)return {error:(i+1)+'번째 줄이 너무 깁니다.'};
  questions.push({q:parts[0],a:parts[1],h:parts[2]||''});
 }
 return {questions};
}
function spaceApplySettings(){
 const s=spaceState(),area=document.getElementById('spaceQuestionsInput');
 if(!area)return;
 const parsed=spaceParseQuestions(area.value);
 if(parsed.error)return toast(parsed.error);
 const mode=document.getElementById('spaceModeInput')?.value==='teams'?'teams':'class';
 const teamCount=Math.max(2,Math.min(4,Number(document.getElementById('spaceTeamCountInput')?.value)||2));
 const title=String(document.getElementById('spaceTitleInput')?.value||'별이의 우주탐험').trim().slice(0,80)||'별이의 우주탐험';
 const teamNames=Array.from({length:4},(_,i)=>String(document.getElementById('spaceTeamName'+i)?.value||((i+1)+'모둠')).trim().slice(0,24)||((i+1)+'모둠'));
 const changed=mode!==s.mode||teamCount!==s.teamCount||JSON.stringify(parsed.questions)!==JSON.stringify(s.questions);
 if(changed&&(s.questionIndex||s.scores.some(Boolean))&&!confirm('게임 방식 또는 문제를 바꾸면 현재 탐험 진행 상황이 초기화됩니다. 계속할까요?'))return;
 Object.assign(s,{mode,teamCount,title,teamNames,questions:parsed.questions});
 if(changed)spaceResetProgress(s);
 spaceSetupOpen=false;save();render();toast('✨ 문제와 설정을 이 PC에 저장했습니다.');
}
function spaceFillExamples(){
 const area=document.getElementById('spaceQuestionsInput');
 if(!area)return;
 if(area.value.trim()&&!confirm('편집 중인 문제를 예시 16문제로 교체할까요? 저장 버튼을 누르기 전에는 기존 문제가 유지됩니다.'))return;
 area.value=spaceSampleQuestions().map(q=>[q.q,q.a,q.h].join(' | ')).join('\n');
 toast('예시 문제를 입력했습니다. 저장 버튼을 눌러 적용하세요.');
}
function spaceCopyQuestions(){
 const s=spaceState();copyText(s.questions.map(q=>[q.q,q.a,q.h].join(' | ')).join('\n'));
}
function spaceTrack(s,teamIndex){
 const score=s.scores[teamIndex],name=spaceTeams(s)[teamIndex];
 return '<div class="space-lane'+(!s.completed&&teamIndex===s.teamIndex?' space-lane-active':'')+'">'+
 '<div class="space-lane-head"><strong>'+(s.mode==='class'?'🌟 ':'🛸 ')+escapeHtml(name)+'</strong><span>🚀 '+score+' / 8단계</span></div>'+
 '<div class="space-route">'+SPACE_STOPS.map(([icon,label],i)=>{
  const here=score===i,done=score>i;
  return '<div class="space-stop'+(here?' space-stop-here':'')+(done?' space-stop-done':'')+'" title="'+escapeHtml(label)+'">'+
  '<span aria-hidden="true">'+(here?'🚀':icon)+'</span><small>'+escapeHtml(label)+'</small></div>';
 }).join('')+'</div></div>';
}
function spaceBoard(){
 const s=spaceState(),q=spaceCurrentQuestion(s),names=spaceTeams(s),winner=s.completed?names[s.mode==='class'?0:s.teamIndex]:'';
 return '<section class="space-board" aria-label="별이의 우주탐험 게임">'+
 '<div class="space-sky"><div class="space-sky-stars" aria-hidden="true">✦ · ✨ · ✦ · 🌟 · ✧ · ✦</div>'+
 '<div class="space-sky-title"><span>🚀 별이와 함께 우주로!</span><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>선생님 컴퓨터 한 대로 우리 반이 함께 떠나는 8단계 우주 미션</p></div>'+
 '<div class="space-sky-mascot" aria-hidden="true">⭐🛸</div></div>'+
 '<div class="space-lanes">'+names.map((_,i)=>spaceTrack(s,i)).join('')+'</div>'+
 (s.completed?'<div class="space-victory" role="status"><span>🎉🏆🌟</span><h3>'+escapeHtml(winner)+' 우주탐험 성공!</h3><p>8개 미션을 돌파하고 별의 성에 도착했어요!</p></div>':
 '<div class="space-question"><div class="space-question-meta"><span>🎯 도전 '+(s.questionIndex+1)+'번째 문제</span><strong>지금 차례: '+escapeHtml(names[s.teamIndex])+'</strong></div>'+
 '<div class="space-question-text">'+escapeHtml(q.q)+'</div>'+
 (s.hintShown?'<div class="space-hint">💡 힌트: '+escapeHtml(q.h||'이 문제에는 힌트가 없습니다.')+'</div>':'')+
 (s.revealed?'<div class="space-answer" role="status">✅ 정답: '+escapeHtml(q.a)+'</div>':'')+
 '<p class="space-question-note">친구들이 답을 말하면 선생님이 정답 여부를 눌러 주세요.</p></div>')+
 '</section>';
}
function spaceControls(){
 const s=spaceState();
 return '<div class="space-controls" aria-label="교사용 우주탐험 조작">'+
 '<div class="space-control-buttons">'+
 (!s.completed?'<button type="button" class="btn btn-outline" id="spaceHint">💡 '+(s.hintShown?'힌트 가리기':'힌트 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="spaceReveal">👀 '+(s.revealed?'정답 가리기':'정답 공개')+'</button>'+
 '<button type="button" class="btn btn-primary" id="spaceCorrect">✅ 정답! 한 칸 전진</button>'+
 '<button type="button" class="btn btn-secondary" id="spaceWrong">↪ 다음 문제</button>':'')+
 '<button type="button" class="btn btn-outline" id="spaceUndo" '+(!spaceLastTurn||spaceLastTurn.classId!==activeClass().id?'disabled':'')+'>↩ 판정 취소</button>'+
 '<button type="button" class="btn btn-outline" id="spaceRestart">🔄 새 탐험</button>'+
 '<button type="button" class="btn btn-outline" id="spaceFull">'+(spaceFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!spaceFull?'<button type="button" class="btn btn-outline" id="spaceEdit">'+(spaceSetupOpen?'✕ 설정 닫기':'⚙️ 문제·설정 편집')+'</button>':'')+
 '</div></div>';
}
function spaceEditor(){
 const s=spaceState();
 return '<section class="panel space-editor"><h2>👩‍🏫 우주탐험 준비하기</h2>'+
 '<p class="space-editor-note">학생 로그인·QR 접속 없이 선생님 PC와 전자칠판만으로 진행합니다. 학급별 내용은 브라우저에 자동 저장되고 전체 백업에도 포함돼요.</p>'+
 '<div class="space-editor-grid"><label>게임 제목<input class="field" id="spaceTitleInput" maxlength="80" value="'+escapeHtml(s.title)+'"></label>'+
 '<label>게임 방식<select class="field" id="spaceModeInput"><option value="class" '+(s.mode==='class'?'selected':'')+'>🌟 학급 전체 협동</option><option value="teams" '+(s.mode==='teams'?'selected':'')+'>🚀 모둠 대항</option></select></label>'+
 '<label>모둠 수 (모둠 대항일 때 적용)<select class="field" id="spaceTeamCountInput">'+[2,3,4].map(n=>'<option value="'+n+'" '+(s.teamCount===n?'selected':'')+'>'+n+'개 모둠</option>').join('')+'</select></label></div>'+
 '<div class="space-names">'+Array.from({length:4},(_,i)=>'<label>모둠 '+(i+1)+' 이름<input class="field" maxlength="24" id="spaceTeamName'+i+'" value="'+escapeHtml(s.teamNames[i])+'"></label>').join('')+'</div>'+
 '<label class="space-question-label" for="spaceQuestionsInput">수업 문제 (한 줄에 하나)</label>'+
 '<p class="space-editor-note"><strong>문제 | 정답 | 힌트</strong> 형식으로 입력하세요. 힌트는 생략할 수 있습니다. 최대 80문제까지 저장돼요.</p>'+
 '<textarea class="field space-questions-input" id="spaceQuestionsInput" rows="10" spellcheck="false" placeholder="7 + 5는? | 12 | 10에 2를 더해 보세요.">'+escapeHtml(s.questions.map(q=>[q.q,q.a,q.h].join(' | ')).join('\n'))+'</textarea>'+
 '<div class="space-editor-actions"><button type="button" class="btn btn-primary" id="spaceSaveSettings">💾 설정·문제 저장</button>'+
 '<button type="button" class="btn btn-outline" id="spaceExamples">✨ 예시 16문제 불러오기</button>'+
 '<button type="button" class="btn btn-outline" id="spaceCopy">📋 문제 복사</button></div></section>';
}
function renderSpace(){
 return title('교실 놀이·게임','별이의 우주탐험','문제를 맞히며 행성을 지나 별의 성까지! 교사 PC 한 대로 진행하는 학급 협동·모둠 도전 게임입니다.','🚀')+
 '<div class="space-layout">'+
 (spaceFull?'<div class="space-full-head"><strong>⭐ 별이의 우주탐험</strong><button class="btn btn-outline btn-small" id="spaceFull" type="button">✕ 관리 화면으로</button></div>':'')+
 spaceBoard()+spaceControls()+
 (!spaceFull&&spaceSetupOpen?spaceEditor():'')+
 (!spaceFull?'<p class="space-footnote">🔒 다른 기기와 실시간 연결하지 않아요. 정답 판정은 선생님이 직접 합니다.</p>':'')+'</div>';
}
