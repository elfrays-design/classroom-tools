/* 별이와 송이 수업도구 — ⑥ 우리 반 생각 그래프 (교사 PC 수동 집계) */
'use strict';
const OPINION_MAX_OPTIONS=6,OPINION_MAX_VOTES=9999,OPINION_MAX_ARCHIVES=20;
const OPINION_SYMBOLS=['🌟','🌸','🦋','🍀','🌈','🍎'];
const OPINION_PRESETS=[
 {title:'우리 반이 좋아하는 쉬는 시간 활동은?',options:['📚 책 읽기','⚽ 운동하기','🎨 그림 그리기','🎲 보드게임']},
 {title:'가장 좋아하는 과일은?',options:['🍎 사과','🍌 바나나','🍓 딸기','🍇 포도','🍉 수박']},
 {title:'읽고 싶은 책의 종류는?',options:['🧚 동화','🔎 추리','🌱 과학','🧭 모험']},
 {title:'오늘 모둠 활동으로 하고 싶은 것은?',options:['🧩 퍼즐 풀기','🎭 역할극','🎨 만들기','🗣️ 토의하기']},
 {title:'우리가 함께 기르고 싶은 식물은?',options:['🌻 해바라기','🌷 튤립','🍅 방울토마토','🌿 바질']}
];
let opinionFull=false,opinionEditOpen=false,opinionLastChange=null;
function opinionClamp(v){
 const n=Number(v);
 return Number.isFinite(n)?Math.max(0,Math.min(OPINION_MAX_VOTES,Math.floor(n))):0;
}
function opinionMakePreset(p){
 return {title:p.title,options:p.options.slice(),counts:p.options.map(()=>0),view:'bar',archives:[]};
}
function makeDefaultOpinion(){return opinionMakePreset(OPINION_PRESETS[0]);}
function opinionNormalizeOptions(raw,fallback){
 const options=Array.isArray(raw)?raw.slice(0,OPINION_MAX_OPTIONS).map(x=>String(x??'').trim().slice(0,35)):[];
 if(options.length<2||options.some(x=>!x)||new Set(options).size!==options.length)return fallback.slice();
 return options;
}
function opinionArchiveNormalize(raw){
 if(!raw||typeof raw!=='object')return null;
 const options=opinionNormalizeOptions(raw.options,[]);
 if(options.length<2)return null;
 const counts=Array.from({length:options.length},(_,i)=>opinionClamp(raw.counts?.[i]));
 return {id:String(raw.id??'').slice(0,90)||'old-'+Math.random().toString(36).slice(2),
  date:String(raw.date??'').slice(0,60),title:String(raw.title??'우리 반 생각 그래프').trim().slice(0,100)||'우리 반 생각 그래프',options,counts};
}
function normalizeOpinion(raw){
 const d=makeDefaultOpinion(),v=raw&&typeof raw==='object'?raw:{};
 const incoming=opinionNormalizeOptions(v.options,[]);
 const options=incoming.length?incoming:d.options;
 const counts=options.map((_,i)=>incoming.length?opinionClamp(v.counts?.[i]):0);
 const archives=Array.isArray(v.archives)?v.archives.slice(-OPINION_MAX_ARCHIVES).map(opinionArchiveNormalize).filter(Boolean):[];
 return {title:String(v.title??d.title).trim().slice(0,100)||d.title,
  options,counts,view:v.view==='picture'?'picture':'bar',archives};
}
function opinionState(){const c=activeClass();return c.opinion||(c.opinion=makeDefaultOpinion());}
function opinionStats(s){
 const total=s.counts.reduce((sum,n)=>sum+n,0),max=Math.max(0,...s.counts);
 const winners=total>0?s.options.filter((_,i)=>s.counts[i]===max):[];
 return {total,max,winners,options:s.options.length};
}
function opinionPictureUnit(max){
 for(const unit of [1,2,5,10,20,50,100,200,500,1000])if(Math.ceil(max/unit)<=22)return unit;
 return 1000;
}
function opinionLeave(){
 opinionFull=false;document.body.classList.remove('opinion-fullscreen');opinionEditOpen=false;opinionLastChange=null;
}
function opinionToggleFull(){
 if(!opinionFull)opinionEditOpen=false;
 opinionFull=!opinionFull;document.body.classList.toggle('opinion-fullscreen',opinionFull);
 render();if(opinionFull)window.scrollTo({top:0,behavior:'instant'});
}
function opinionToggleEdit(){opinionEditOpen=!opinionEditOpen;render();}
function opinionSetView(mode){
 if(mode!=='picture'&&mode!=='bar')return;
 const s=opinionState();s.view=mode;save();render();
}
function opinionChange(index,delta){
 const s=opinionState();if(!Number.isInteger(index)||index<0||index>=s.options.length)return;
 const previous=s.counts[index],next=opinionClamp(previous+delta);
 if(next===previous){if(delta<0)toast('0표보다 작게 입력할 수 없어요.');else toast('한 항목은 최대 '+OPINION_MAX_VOTES+'표까지 기록할 수 있어요.');return;}
 opinionLastChange={classId:activeClass().id,index,previous,next};
 s.counts[index]=next;save();render();
}
function opinionSetCount(index,value){
 const s=opinionState();if(!Number.isInteger(index)||index<0||index>=s.options.length)return;
 const text=String(value??'').trim(),number=Number(text);
 if(!text||!Number.isInteger(number)||number<0||number>OPINION_MAX_VOTES){toast('투표 수는 0~'+OPINION_MAX_VOTES+' 사이의 정수를 입력해 주세요.');render();return;}
 const previous=s.counts[index];if(previous===number)return;
 opinionLastChange={classId:activeClass().id,index,previous,next:number};
 s.counts[index]=number;save();render();
}
function opinionUndo(){
 const change=opinionLastChange,s=opinionState();
 if(!change||change.classId!==activeClass().id)return toast('취소할 직전 투표 변경이 없어요.');
 s.counts[change.index]=change.previous;opinionLastChange=null;save();render();toast('↩ 직전 집계를 되돌렸어요.');
}
function opinionReset(){
 const s=opinionState();
 if(s.counts.some(Boolean)&&!confirm('현재 투표 수를 모두 0으로 초기화할까요? 질문과 저장된 결과는 유지됩니다.'))return;
 s.counts=s.options.map(()=>0);opinionLastChange=null;save();render();toast('새 투표를 시작할 수 있어요!');
}
function opinionParseOptions(text){
 const items=String(text??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(items.length<2||items.length>OPINION_MAX_OPTIONS)return {error:'선택지는 2~6개로 입력해 주세요.'};
 if(items.some(x=>x.length>35))return {error:'각 선택지는 35자 이내로 작성해 주세요.'};
 if(new Set(items).size!==items.length)return {error:'선택지 이름을 중복 없이 작성해 주세요.'};
 return {options:items};
}
function opinionSaveSettings(){
 const s=opinionState(),area=document.getElementById('opinionOptionsInput');if(!area)return;
 const parsed=opinionParseOptions(area.value);
 if(parsed.error)return toast(parsed.error);
 const title=String(document.getElementById('opinionTitleInput')?.value??'').trim().slice(0,100);
 if(!title)return toast('투표 질문을 입력해 주세요.');
 const changed=JSON.stringify(s.options)!==JSON.stringify(parsed.options);
 if(changed&&s.counts.some(Boolean)&&!confirm('선택지를 변경하면 현재 투표 수가 0으로 초기화됩니다. 저장한 결과는 유지됩니다. 계속할까요?'))return;
 s.title=title;
 if(changed){s.options=parsed.options;s.counts=s.options.map(()=>0);opinionLastChange=null;}
 opinionEditOpen=false;save();render();toast('💾 투표 질문과 선택지를 저장했어요.');
}
function opinionLoadPreset(){
 const i=Number(document.getElementById('opinionPresetSelect')?.value),p=OPINION_PRESETS[i];
 if(!p)return;
 const s=opinionState();
 if(s.counts.some(Boolean)&&!confirm('예시를 불러오면 현재 투표 수가 초기화됩니다. 저장한 결과는 유지됩니다. 계속할까요?'))return;
 s.title=p.title;s.options=p.options.slice();s.counts=s.options.map(()=>0);
 opinionLastChange=null;opinionEditOpen=false;save();render();toast('🌈 '+p.title+' 예시를 불러왔어요.');
}
function opinionSaveResult(){
 const s=opinionState(),total=opinionStats(s).total;
 if(total===0)return toast('한 표 이상 집계한 다음 결과를 저장해 주세요.');
 if(s.archives.length>=OPINION_MAX_ARCHIVES&&!confirm('저장된 결과는 최대 20개입니다. 계속하면 가장 오래된 결과가 삭제됩니다. 저장할까요?'))return;
 const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 s.archives.push({id,date:dateString(),title:s.title,options:s.options.slice(),counts:s.counts.slice()});
 if(s.archives.length>OPINION_MAX_ARCHIVES)s.archives=s.archives.slice(-OPINION_MAX_ARCHIVES);
 save();render();toast('📚 현재 투표 결과를 이 PC에 저장했어요.');
}
function opinionLoadResult(id){
 const s=opinionState(),item=s.archives.find(x=>x.id===id);if(!item)return;
 if(s.counts.some(Boolean)&&!confirm('저장된 결과를 불러오면 현재 투표 질문과 집계 수가 바뀝니다. 계속할까요?'))return;
 s.title=item.title;s.options=item.options.slice();s.counts=item.counts.slice();
 opinionLastChange=null;save();render();toast('📊 저장된 그래프를 불러왔어요.');
}
function opinionDeleteResult(id){
 const s=opinionState(),item=s.archives.find(x=>x.id===id);if(!item)return;
 if(!confirm('이 저장 결과를 삭제할까요? 삭제한 결과는 되돌릴 수 없습니다.'))return;
 s.archives=s.archives.filter(x=>x.id!==id);save();render();toast('저장된 결과를 삭제했어요.');
}
function opinionSummary(s){
 const stat=opinionStats(s);
 return ['우리 반 생각 그래프',s.title,'※ 선생님이 직접 입력한 표 수입니다. 학생 고유 인원 수가 아닙니다.',
 ...s.options.map((label,i)=>label+': '+s.counts[i]+'표'), '총 '+stat.total+'표'].join('\n');
}
function opinionCopy(){copyText(opinionSummary(opinionState()));}
function opinionExportCsv(){
 const s=opinionState();
 const data=[['항목','투표수','전체 표 대비 비율(%)'],...s.options.map((name,i)=>{
  const total=opinionStats(s).total;return [name,s.counts[i],total?Math.round(s.counts[i]/total*1000)/10:0];
 }),['합계',opinionStats(s).total,opinionStats(s).total?100:0]];
 download('우리반_생각그래프_'+new Date().toISOString().slice(0,10)+'.csv',csv(data),'text/csv;charset=utf-8');
 toast('CSV 결과 파일을 저장했어요.');
}
function opinionGraphSummary(s,stat){
 if(!stat.total)return '아직 집계한 표가 없어요. 손을 든 학생 수를 선택지별로 입력해 보세요!';
 if(stat.winners.length===1)return '🌟 가장 많이 선택한 항목은 '+stat.winners[0]+' ('+stat.max+'표)입니다.';
 return '🌸 '+stat.winners.length+'개 항목이 '+stat.max+'표로 공동 1위예요: '+stat.winners.join(', ');
}
function opinionBarChart(s,stat){
 const max=Math.max(1,stat.max);
 return '<div class="opinion-bars" role="group" aria-label="항목별 막대그래프">'+s.options.map((label,i)=>{
  const votes=s.counts[i],pct=Math.round(votes/max*1000)/10,
  share=stat.total?Math.round(votes/stat.total*1000)/10:0;
  return '<div class="opinion-bar-row">'+
   '<div class="opinion-bar-label">'+OPINION_SYMBOLS[i]+' '+escapeHtml(label)+'</div>'+
   '<div class="opinion-bar-meter" aria-label="'+escapeHtml(label)+' '+votes+'표"><div class="opinion-bar-fill opinion-color-'+i+'" style="width:'+pct+'%"></div></div>'+
   '<strong class="opinion-bar-value">'+votes+'표 <small>('+share+'%)</small></strong></div>';
 }).join('')+'</div>';
}
function opinionPictureChart(s,stat){
 const unit=opinionPictureUnit(stat.max);
 return '<div class="opinion-pictures" role="group" aria-label="항목별 그림그래프">'+
 '<p class="opinion-unit">🖼️ 그림 하나는 <strong>'+unit+'표</strong>를 뜻해요. 그림으로 표시하지 못한 나머지 표는 숫자로 표시합니다.</p>'+
 s.options.map((label,i)=>{
  const n=s.counts[i],full=Math.floor(n/unit),rem=n%unit;
  return '<div class="opinion-picture-row"><div class="opinion-picture-label">'+escapeHtml(label)+'</div>'+
   '<div class="opinion-picture-icons" aria-label="'+escapeHtml(label)+' '+n+'표">'+
   (full?Array.from({length:full},()=>'<span aria-hidden="true">'+OPINION_SYMBOLS[i]+'</span>').join(''):'<span class="opinion-no-votes">표시할 그림 없음</span>')+
   (rem?'<span class="opinion-remain">+'+rem+'표</span>':'')+'</div>'+
   '<strong class="opinion-picture-count">'+n+'표</strong></div>';
 }).join('')+'</div>';
}
function opinionBoard(){
 const s=opinionState(),stat=opinionStats(s);
 return '<section class="opinion-board" aria-label="우리 반 생각 그래프">'+
 '<div class="opinion-hero"><div><span>🌟 내 생각을 모으면 그래프가 돼요!</span><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>손들기 투표를 한 뒤 선생님이 표 수를 입력해 주세요.</p></div><div class="opinion-mascot" aria-hidden="true">⭐🐿️📊</div></div>'+
 '<div class="opinion-total"><span>📣 우리 반이 모은 의견</span><strong>'+stat.total+'표</strong>'+
 '<small>※ 학생 고유 인원이 아닌, 입력된 투표 수의 합계</small></div>'+
 '<div class="opinion-chart-head"><h3>'+ (s.view==='bar'?'📊 막대그래프':'🌼 그림그래프')+'</h3>'+
 '<div class="opinion-chart-switch" role="group" aria-label="그래프 종류 선택">'+
 '<button type="button" class="btn '+(s.view==='bar'?'btn-primary':'btn-outline')+'" data-opinion-view="bar" aria-pressed="'+(s.view==='bar')+'">📊 막대그래프</button>'+
 '<button type="button" class="btn '+(s.view==='picture'?'btn-primary':'btn-outline')+'" data-opinion-view="picture" aria-pressed="'+(s.view==='picture')+'">🌼 그림그래프</button></div></div>'+
 '<div class="opinion-chart-area">'+(s.view==='bar'?opinionBarChart(s,stat):opinionPictureChart(s,stat))+'</div>'+
 '<p class="opinion-interpretation" role="status">'+escapeHtml(opinionGraphSummary(s,stat))+'</p>'+
 '</section>';
}
function opinionVotePad(){
 const s=opinionState();
 return '<section class="opinion-vote-panel"><div class="opinion-section-head"><h3>👩‍🏫 선생님 투표 집계판</h3><span>학생들이 손을 들면 해당 항목의 +1을 눌러 주세요.</span></div>'+
 '<div class="opinion-vote-grid">'+s.options.map((label,i)=>
 '<div class="opinion-vote-card opinion-vote-'+i+'">'+
 '<strong class="opinion-vote-label">'+OPINION_SYMBOLS[i]+' '+escapeHtml(label)+'</strong>'+
 '<div class="opinion-vote-controls"><button type="button" class="opinion-minus" data-opinion-change="'+i+'" data-opinion-delta="-1" aria-label="'+escapeHtml(label)+' 한 표 줄이기" '+(!s.counts[i]?'disabled':'')+'>−</button>'+
 '<label class="opinion-count-label"><span class="sr-only">'+escapeHtml(label)+' 투표 수</span><input type="number" inputmode="numeric" pattern="[0-9]*" class="field opinion-count-input" data-opinion-count="'+i+'" min="0" max="'+OPINION_MAX_VOTES+'" step="1" value="'+s.counts[i]+'" aria-label="'+escapeHtml(label)+' 투표 수"></label>'+
 '<button type="button" class="opinion-plus" data-opinion-change="'+i+'" data-opinion-delta="1" aria-label="'+escapeHtml(label)+' 한 표 늘리기" '+(s.counts[i]>=OPINION_MAX_VOTES?'disabled':'')+'>+1</button></div></div>'
 ).join('')+'</div></section>';
}
function opinionControls(){
 const s=opinionState();
 return '<div class="opinion-controls">'+
 '<button type="button" class="btn btn-outline" id="opinionUndo" '+(!opinionLastChange||opinionLastChange.classId!==activeClass().id?'disabled':'')+'>↩ 직전 변경 취소</button>'+
 '<button type="button" class="btn btn-outline" id="opinionReset">🔄 투표 초기화</button>'+
 (!opinionFull?'<button type="button" class="btn btn-primary" id="opinionArchive">📚 현재 결과 저장</button>'+
 '<button type="button" class="btn btn-outline" id="opinionCopy">📋 결과 복사</button>'+
 '<button type="button" class="btn btn-outline" id="opinionCsv">📥 CSV 내보내기</button>'+
 '<button type="button" class="btn btn-outline" id="opinionEdit">'+(opinionEditOpen?'✕ 설정 닫기':'⚙️ 질문·선택지 편집')+'</button>':'')+
 '<button type="button" class="btn btn-outline" id="opinionFull">'+(opinionFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button></div>';
}
function opinionEditor(){
 const s=opinionState();
 return '<section class="panel opinion-editor"><h2>👩‍🏫 질문과 선택지 준비하기</h2>'+
 '<p>실시간 접속을 이용하지 않습니다. 교사가 질문을 보여주고 학생들이 손을 들어 투표하면 결과를 직접 입력합니다.</p>'+
 '<div class="opinion-presets"><label>수업 예시<select id="opinionPresetSelect" class="field">'+OPINION_PRESETS.map((p,i)=>
 '<option value="'+i+'">'+escapeHtml(p.title)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="opinionPreset">✨ 예시 불러오기</button></div>'+
 '<label for="opinionTitleInput">투표 질문<input class="field" type="text" id="opinionTitleInput" maxlength="100" value="'+escapeHtml(s.title)+'"></label>'+
 '<label for="opinionOptionsInput">선택지 (한 줄에 하나씩, 2~6개)</label>'+
 '<textarea class="field opinion-options-input" id="opinionOptionsInput" rows="7" maxlength="600" placeholder="📚 책 읽기&#10;⚽ 운동하기&#10;🎨 그림 그리기">'+escapeHtml(s.options.join('\n'))+'</textarea>'+
 '<p>선택지를 수정하면 기존 투표 수가 초기화될 수 있어요. 미리 결과를 저장해 두세요.</p>'+
 '<button type="button" class="btn btn-primary" id="opinionSaveSettings">💾 질문·선택지 저장</button></section>';
}
function opinionArchives(){
 const s=opinionState();
 return '<section class="panel opinion-archive"><div class="opinion-section-head"><h3>📚 저장한 투표 결과 ('+s.archives.length+'/'+OPINION_MAX_ARCHIVES+')</h3><span>기존 학급 전체 백업·복원에도 포함돼요.</span></div>'+
 (!s.archives.length?'<p class="opinion-empty">저장한 결과가 없어요. 수업 중 투표를 진행한 뒤 결과를 보관해 보세요!</p>':
 '<div class="opinion-archive-list">'+s.archives.slice().reverse().map(item=>
 '<div class="opinion-archive-item"><div><strong>'+escapeHtml(item.title)+'</strong>'+
 '<small>'+escapeHtml(item.date)+' · 총 '+item.counts.reduce((sum,n)=>sum+n,0)+'표</small></div>'+
 '<div class="opinion-archive-actions"><button type="button" class="btn btn-outline btn-small" data-opinion-load="'+escapeHtml(item.id)+'">📊 결과 불러오기</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-opinion-delete="'+escapeHtml(item.id)+'">✕ 삭제</button></div></div>').join('')+'</div>')+'</section>';
}
function renderOpinion(){
 return (opinionFull?'<div class="opinion-full-head"><strong>🌈 우리 반 생각 그래프</strong><button type="button" class="btn btn-outline btn-small" id="opinionFull">✕ 관리 화면으로</button></div>':
 title('교실 놀이·게임','우리 반 생각 그래프','손들기 투표 결과를 선생님이 입력하면 막대그래프와 그림그래프가 바로 완성됩니다.','📊'))+
 '<div class="opinion-layout">'+opinionBoard()+opinionVotePad()+opinionControls()+
 (!opinionFull&&opinionEditOpen?opinionEditor():'')+
 (!opinionFull?opinionArchives()+'<p class="opinion-footnote">🔒 학생 로그인·QR 접속·실시간 서버 기능이 없습니다. 교사 PC에서 입력한 표 수만 저장됩니다.</p>':'')+
 '</div>';
}
