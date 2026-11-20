/* 별이와 송이의 수업도구 상자 — ⑤ 송이의 이야기 마법상자 · 교사 PC 단독 */
'use strict';
const STORY_KEYS=['character','place','event'];
const STORY_LABELS=['🦊 등장인물','🏰 장소','✨ 사건'];
const STORY_ICONS=['🎭','🗺️','🔮'];
const STORY_PRESETS=[
 {title:'송이의 신나는 동화 마법상자',pools:{
  character:['🐰 용감한 토끼','🦊 수줍은 여우','🐻 요리를 좋아하는 곰','🐱 노래하는 고양이','🧚 마음씨 좋은 요정','🐿️ 호기심 많은 다람쥐','🦄 무지개 유니콘','🐧 길을 잃은 펭귄','🐲 작고 친절한 용','🐶 모험을 좋아하는 강아지','🤖 고장 난 로봇','🦉 지혜로운 부엉이'],
  place:['🌳 비밀의 숲','🏰 구름 위의 성','🏖️ 반짝이는 바닷가','🌌 별빛이 쏟아지는 마을','🏫 밤이 된 학교','🌈 무지개 다리','📚 마법 도서관','🎡 장난감 놀이공원','🪸 바닷속 궁전','⛄ 눈사람이 사는 마을','🌻 해바라기 정원','🚂 신비한 기차역'],
  event:['🔑 신기한 열쇠를 발견했어요','🎁 주인을 잃은 선물을 찾았어요','⛈️ 갑자기 큰 비가 내렸어요','🗺️ 보물지도를 발견했어요','💌 비밀 편지가 도착했어요','🎈 풍선이 모두 날아갔어요','🕰️ 시간이 거꾸로 흐르기 시작했어요','🌱 하룻밤 사이 씨앗이 자랐어요','🎵 어디선가 노랫소리가 들렸어요','✨ 소원이 한 가지 이루어졌어요','🚪 열리지 않던 문이 열렸어요','🤝 도움이 필요한 친구를 만났어요']
 }},
 {title:'우리 반 학교 이야기',pools:{
  character:['👧 새 친구','👦 반장','👩‍🏫 담임 선생님','🧑‍🤝‍🧑 짝꿍 두 명','🎨 그림을 좋아하는 친구','⚽ 운동을 좋아하는 친구','📚 책 읽기를 좋아하는 친구','🦉 학교 마스코트','🎤 발표를 어려워하는 친구','🌟 친절한 도우미'],
  place:['🏫 우리 반 교실','📚 학교 도서관','🍱 급식실','🌳 학교 운동장','🎨 미술실','🎶 음악실','🪴 학교 화단','🚏 등굣길','🧩 방과후 교실','🏕️ 현장 체험학습 장소'],
  event:['📦 주인 없는 상자를 발견했어요','🤝 새로운 친구가 전학 왔어요','📣 깜짝 발표를 하게 됐어요','🎁 잃어버린 물건을 찾았어요','🌧️ 비 때문에 계획이 바뀌었어요','🪴 식물이 시들어 있었어요','🧹 교실이 엉망이 되었어요','🧩 어려운 문제를 함께 풀게 됐어요','💌 감사 편지를 받았어요','🏆 모둠이 새로운 목표에 도전했어요']
 }},
 {title:'상상력이 반짝이는 미래 탐험',pools:{
  character:['🤖 감정을 배우는 로봇','🧑‍🚀 어린 우주비행사','🛸 작은 외계인','🧑‍🔬 발명가 친구','🐳 말을 하는 고래','🐉 시간을 여행하는 용','🦋 빛을 내는 나비','🪄 마법을 배우는 학생','🔭 별을 연구하는 과학자','🌱 식물과 대화하는 소녀'],
  place:['🪐 고리 행성','🌙 달의 연구소','🌊 깊은 바닷속 도시','🏙️ 하늘을 나는 미래 도시','🌋 오래된 화산섬','🧊 얼음 동굴','🛰️ 우주 정거장','🌲 미래의 숲','🏛️ 시간 박물관','☁️ 구름 위 정원'],
  event:['⏳ 10분 동안 시간이 멈췄어요','🌍 지구로 돌아갈 길이 사라졌어요','🔋 로봇의 배터리가 떨어졌어요','🚀 우주선에 이상한 신호가 왔어요','🌱 처음 보는 식물이 자랐어요','🗝️ 비밀 통로가 열렸어요','📡 먼 곳에서 구조 요청이 왔어요','🧲 물건들이 하늘로 떠올랐어요','💫 소원을 담은 별똥별이 떨어졌어요','🎈 하늘을 나는 배를 발견했어요']
 }}
];
let storyFull=false,storyEditOpen=false,storyNotice='',storyFresh=[false,false,false];
function storyTrim(v,max){return String(v??'').trim().slice(0,max);}
function storyMakePreset(p){
 return {title:p.title,pools:Object.fromEntries(STORY_KEYS.map(k=>[k,p.pools[k].slice()])),
  picked:[null,null,null],locked:[false,false,false],notes:{begin:'',middle:'',end:''},archives:[],sound:true};
}
function makeDefaultStory(){return storyMakePreset(STORY_PRESETS[0]);}
function storyValidPool(raw,fall){
 const arr=Array.isArray(raw)?raw.slice(0,35).map(x=>storyTrim(x,100)).filter(Boolean):[];
 const unique=Array.from(new Set(arr));return unique.length>=3?unique:fall.slice();
}
function normalizeStory(raw){
 const d=makeDefaultStory(),v=raw&&typeof raw==='object'?raw:{};
 const pools={};
 STORY_KEYS.forEach(k=>{pools[k]=storyValidPool(v.pools?.[k],d.pools[k]);});
 const picked=Array.from({length:3},(_,i)=>v.picked?.[i]===null?null:
  (typeof v.picked?.[i]==='string'?storyTrim(v.picked[i],100)||null:null));
 const locked=Array.from({length:3},(_,i)=>Boolean(picked[i]&&v.locked?.[i]===true));
 const notes={};for(const k of ['begin','middle','end'])notes[k]=String(v.notes?.[k]??'').slice(0,1200);
 const archives=Array.isArray(v.archives)?v.archives.slice(-20).map((r,i)=>{
  if(!r||typeof r!=='object')return null;
  const cards=Array.from({length:3},(_,j)=>storyTrim(r.cards?.[j],100));
  if(cards.some(x=>!x))return null;
  const savedNotes={};for(const k of ['begin','middle','end'])savedNotes[k]=String(r.notes?.[k]??'').slice(0,1200);
  return {id:storyTrim(r.id,90)||'saved-'+i,date:storyTrim(r.date,60),title:storyTrim(r.title,80)||'우리의 이야기',cards,notes:savedNotes};
 }).filter(Boolean):[];
 return {title:storyTrim(v.title,80)||d.title,pools,picked,locked,notes,archives,sound:v.sound!==false};
}
function storyState(){const c=activeClass();return c.story||(c.story=makeDefaultStory());}
function storyComplete(s){return s.picked.every(Boolean);}
function storyDrafted(s){return Object.values(s.notes).some(v=>v.trim());}
function storyRandom(pool,previous){
 const others=pool.length>1?pool.filter(item=>item!==previous):pool;
 const candidates=others.length?others:pool;
 return candidates[Math.floor(Math.random()*candidates.length)];
}
function storyLeave(){
 storyFull=false;document.body.classList.remove('story-fullscreen');
 storyEditOpen=false;storyNotice='';storyFresh=[false,false,false];
}
function storyToggleFull(){
 if(!storyFull)storyEditOpen=false;
 storyFull=!storyFull;document.body.classList.toggle('story-fullscreen',storyFull);
 storyFresh=[false,false,false];render();if(storyFull)window.scrollTo({top:0,behavior:'instant'});
}
function storyToggleEdit(){storyEditOpen=!storyEditOpen;storyFresh=[false,false,false];render();}
function storyDraw(index){
 const s=storyState();
 if(!Number.isInteger(index)||index<0||index>2)return;
 if(s.locked[index])return toast('🔒 잠긴 카드는 다시 뽑을 수 없어요. 잠금을 먼저 해제해 주세요.');
 const k=STORY_KEYS[index],pool=s.pools[k];s.picked[index]=storyRandom(pool,s.picked[index]);
 storyFresh=[false,false,false];storyFresh[index]=true;
 storyNotice='✨ '+STORY_LABELS[index]+' 카드에서 새로운 마법이 나타났어요!';
 if(s.sound){soundUnlock();beep();}
 save();render();
}
function storyDrawAll(){
 const s=storyState();let changed=0;storyFresh=[false,false,false];
 STORY_KEYS.forEach((k,i)=>{if(s.locked[i])return;s.picked[i]=storyRandom(s.pools[k],s.picked[i]);storyFresh[i]=true;changed++;});
 if(!changed)return toast('모든 카드가 잠겨 있어요. 잠금을 해제해 주세요.');
 storyNotice='🎉 '+changed+'개의 마법 카드가 반짝이며 열렸어요!';
 if(s.sound){soundUnlock();beep();}
 save();render();
}
function storyToggleLock(i){
 const s=storyState();
 if(!Number.isInteger(i)||i<0||i>2)return;
 if(!s.picked[i])return toast('먼저 카드를 뽑아 주세요.');
 s.locked[i]=!s.locked[i];storyFresh=[false,false,false];
 save();render();toast(s.locked[i]?'🔒 카드를 고정했어요.':'🔓 카드 고정을 해제했어요.');
}
function storyNew(){
 const s=storyState();
 if((s.picked.some(Boolean)||storyDrafted(s))&&!confirm('현재 뽑은 카드와 작성 중인 이야기 내용을 지우고 새 이야기를 시작할까요? 저장한 이야기 모음은 유지됩니다.'))return;
 s.picked=[null,null,null];s.locked=[false,false,false];s.notes={begin:'',middle:'',end:''};
 storyFresh=[false,false,false];storyNotice='마법상자가 새 이야기를 기다리고 있어요! 🌷';
 save();render();
}
function storyWrite(id,value){
 const key=({storyBegin:'begin',storyMiddle:'middle',storyEnd:'end'})[id];
 if(!key)return;
 const s=storyState();s.notes[key]=String(value??'').slice(0,1200);save();
 const preview=document.getElementById('storyLive'+key[0].toUpperCase()+key.slice(1));
 if(preview)preview.textContent=s.notes[key].trim()||({begin:'이야기의 시작을 적어보세요.',middle:'어떤 일이 벌어졌나요?',end:'어떻게 해결되었나요?'})[key];
}
function storySetTitle(value){
 const s=storyState();s.title=storyTrim(value,80)||'송이의 이야기 마법상자';save();
 const heading=document.getElementById('storyMagicTitle');
 if(heading)heading.textContent=s.title;
}
function storyParsePool(raw,label){
 const lines=String(raw??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(lines.length<3||lines.length>35)return {error:label+' 카드는 3~35개로 입력해 주세요.'};
 if(lines.some(x=>x.length>100))return {error:label+' 카드 내용은 100자 이내로 입력해 주세요.'};
 if(new Set(lines).size!==lines.length)return {error:label+' 카드에서 중복 내용을 정리해 주세요.'};
 return {cards:lines};
}
function storySaveSettings(){
 const s=storyState(),pools={};
 for(let i=0;i<STORY_KEYS.length;i++){
  const k=STORY_KEYS[i],el=document.getElementById('storyCards'+i);
  if(!el)return;
  const parsed=storyParsePool(el.value,STORY_LABELS[i]);if(parsed.error)return toast(parsed.error);
  pools[k]=parsed.cards;
 }
 const title=storyTrim(document.getElementById('storyTitleInput')?.value,80)||'송이의 이야기 마법상자';
 const changed=STORY_KEYS.some(k=>JSON.stringify(s.pools[k])!==JSON.stringify(pools[k]));
 if(changed&&s.picked.some(Boolean)&&!confirm('카드 목록이 변경되었습니다. 현재 뽑은 카드를 초기화할까요? 작성한 이야기와 저장한 작품은 유지됩니다.'))return;
 s.title=title;s.pools=pools;
 if(changed){s.picked=[null,null,null];s.locked=[false,false,false];}
 storyEditOpen=false;storyFresh=[false,false,false];storyNotice='카드 내용을 저장했어요. 새로운 이야기를 뽑아 보세요!';save();render();toast('💾 마법 카드 구성을 저장했어요.');
}
function storyLoadPreset(){
 const i=Number(document.getElementById('storyPresetSelect')?.value),p=STORY_PRESETS[i];
 if(!p)return;
 const s=storyState();
 if((s.picked.some(Boolean)||storyDrafted(s))&&!confirm('예시 카드를 불러오면 뽑은 카드와 작성 중인 이야기가 초기화됩니다. 저장한 이야기 모음은 유지됩니다. 계속할까요?'))return;
 const fresh=storyMakePreset(p);
 s.title=fresh.title;s.pools=fresh.pools;s.picked=fresh.picked;s.locked=fresh.locked;s.notes=fresh.notes;
 storyEditOpen=false;storyFresh=[false,false,false];storyNotice='✨ '+p.title+' 카드를 불러왔어요!';
 save();render();toast(storyNotice);
}
function storySound(){const s=storyState();s.sound=!s.sound;save();render();}
function storyPrompt(s){
 if(!storyComplete(s))return '등장인물·장소·사건 카드를 모두 뽑으면 이야기의 재료가 완성돼요.';
 return '오늘의 등장인물: '+s.picked[0]+' / 장소: '+s.picked[1]+' / 일어난 사건: '+s.picked[2]+' 이 세 가지를 넣어 이야기의 시작·전개·마무리를 만들어 보세요!';
}
function storyCopyPrompt(){const s=storyState();if(!storyComplete(s))return toast('먼저 등장인물·장소·사건 카드를 모두 뽑아 주세요.');copyText(storyPrompt(s));}
function storyStoryText(s){
 const intro='제목: '+s.title+'\n등장인물: '+(s.picked[0]||'미선택')+'\n장소: '+(s.picked[1]||'미선택')+'\n사건: '+(s.picked[2]||'미선택');
 return intro+'\n\n이야기 시작\n'+(s.notes.begin||'(미작성)')+
 '\n\n이야기 전개\n'+(s.notes.middle||'(미작성)')+
 '\n\n이야기 마무리\n'+(s.notes.end||'(미작성)');
}
function storyCopyDraft(){const s=storyState();copyText(storyStoryText(s));}
function storyArchive(){
 const s=storyState();
 if(!storyComplete(s))return toast('먼저 세 가지 마법 카드를 모두 뽑아 주세요.');
 if(!storyDrafted(s))return toast('이야기의 시작·전개·마무리 중 하나 이상을 작성해 주세요.');
 if(s.archives.length>=20&&!confirm('저장 작품은 최대 20편입니다. 계속하면 가장 오래된 작품 한 편이 삭제됩니다. 진행할까요?'))return;
 const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 s.archives.push({id,date:dateString(),title:s.title,cards:s.picked.slice(),notes:{...s.notes}});
 if(s.archives.length>20)s.archives=s.archives.slice(-20);
 save();render();toast('📚 이야기 한 편을 이 PC에 저장했어요!');
}
function storyOpenArchive(id){
 const s=storyState(),entry=s.archives.find(x=>x.id===id);if(!entry)return;
 if((s.picked.some(Boolean)||storyDrafted(s))&&!confirm('선택한 작품을 불러오면 현재 뽑은 카드와 작성 중인 이야기가 바뀝니다. 저장된 작품 자체는 유지됩니다. 계속할까요?'))return;
 s.title=entry.title;s.picked=entry.cards.slice();s.locked=[false,false,false];s.notes={...entry.notes};
 storyFresh=[false,false,false];storyNotice='📖 저장된 이야기를 다시 열었어요!';
 save();render();toast(storyNotice);
}
function storyDeleteArchive(id){
 const s=storyState(),entry=s.archives.find(x=>x.id===id);if(!entry)return;
 if(!confirm('선택한 이야기 작품을 목록에서 삭제할까요? 삭제 후 되돌릴 수 없습니다.'))return;
 s.archives=s.archives.filter(x=>x.id!==id);save();render();toast('저장된 작품을 삭제했어요.');
}
function storyBox(s,i){
 const value=s.picked[i],locked=s.locked[i],fresh=storyFresh[i];
 return '<article class="story-box story-box-'+i+(fresh?' story-box-fresh':'')+'">'+
 '<div class="story-box-top"><span>'+STORY_LABELS[i]+'</span><span class="story-magic-sparkles" aria-hidden="true">✦ ✨</span></div>'+
 '<div class="story-box-art" aria-hidden="true">'+(value?STORY_ICONS[i]:'🎁')+'</div>'+
 '<div class="story-box-answer">'+(value?'<strong>'+escapeHtml(value)+'</strong>':'<strong class="story-box-placeholder">어떤 이야기가 숨어 있을까요?</strong>')+'</div>'+
 '<div class="story-box-actions"><button type="button" class="btn '+(value?'btn-outline':'btn-primary')+'" data-story-draw="'+i+'" '+(locked?'disabled':'')+'>'+ (value?'🎲 다시 뽑기':'🎁 상자 열기')+'</button>'+
 '<button type="button" class="btn btn-outline" data-story-lock="'+i+'" '+(!value?'disabled':'')+' aria-pressed="'+locked+'">'+(locked?'🔒 고정됨':'🔓 카드 고정')+'</button></div></article>';
}
function storyBoard(){
 const s=storyState(),ready=storyComplete(s);
 return '<section class="story-board" aria-label="송이의 이야기 마법상자 게임">'+
 '<div class="story-hero"><div><span>🌈 상상이 톡톡! 이야기 만들기</span><h2 id="storyMagicTitle">'+escapeHtml(s.title)+'</h2>'+
 '<p>등장인물·장소·사건을 뽑아 우리 반만의 특별한 이야기를 만들어 보세요.</p></div>'+
 '<div class="story-hero-mascot" aria-hidden="true">🐿️🪄</div></div>'+
 '<div class="story-magic-cloud" aria-hidden="true">⭐ · 🌸 · ✨ · ☁️ · 🌟 · ✨</div>'+
 '<div class="story-box-grid">'+STORY_KEYS.map((_,i)=>storyBox(s,i)).join('')+'</div>'+
 '<div class="story-prompt-panel"><div class="story-prompt-head"><strong>🪄 송이의 이야기 주문</strong><span>'+(ready?'✨ 이야기 재료 완성!':'먼저 세 상자를 모두 열어 보세요!')+'</span></div>'+
 '<p>'+escapeHtml(storyPrompt(s))+'</p>'+
 '<div class="story-prompt-actions"><button type="button" class="btn btn-primary" id="storyDrawAll">🎲 '+(s.picked.some(Boolean)?'마법 카드 다시 뽑기':'세 상자 한꺼번에 열기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="storyCopyPrompt" '+(!ready?'disabled':'')+'>📋 이야기 주문 복사</button></div></div>'+
 (storyNotice?'<p class="story-feedback" role="status">'+escapeHtml(storyNotice)+'</p>':'')+'</section>';
}
function storyDraft(){
 const s=storyState();return '<section class="panel story-draft"><div class="story-section-header"><h2>✍️ 우리 반 이야기 쓰기</h2><span>작성 내용은 이 PC에 자동 저장돼요</span></div>'+
 '<p class="story-editor-help">학생들과 이야기의 시작·중간·끝을 말로 만들어 보거나, 선생님이 문장을 받아 적어 보세요.</p>'+
 '<div class="story-draft-grid">'+
 [['begin','storyBegin','① 시작','주인공과 장소를 소개해 보세요.'],['middle','storyMiddle','② 전개','어떤 일이 벌어졌나요?'],['end','storyEnd','③ 마무리','어떻게 해결되었나요?']].map(x=>
 '<label class="story-draft-field"><strong>'+x[2]+'</strong><textarea class="field" id="'+x[1]+'" maxlength="1200" rows="5" placeholder="'+x[3]+'">'+escapeHtml(s.notes[x[0]])+'</textarea></label>').join('')+'</div>'+
 '<div class="story-editor-actions"><button type="button" class="btn btn-primary" id="storyArchive" '+(!storyComplete(s)?'disabled':'')+'>📚 완성한 이야기 저장</button>'+
 '<button type="button" class="btn btn-outline" id="storyCopyDraft">📋 이야기 전체 복사</button>'+
 '<button type="button" class="btn btn-outline" id="storyNew">🌷 새 이야기 시작</button></div></section>';
}
function storyArchives(){
 const s=storyState();return '<section class="panel story-archive"><div class="story-section-header"><h2>📚 저장한 이야기 ('+s.archives.length+'/20편)</h2><span>기존 전체 백업·복원에 포함됩니다</span></div>'+
 (!s.archives.length?'<p class="story-empty">아직 저장한 작품이 없어요. 세 가지 카드를 뽑아 우리 반 이야기를 만들어 보세요!</p>':
 '<div class="story-archive-list">'+s.archives.slice().reverse().map(entry=>
 '<div class="story-saved-card"><div><strong>'+escapeHtml(entry.title)+'</strong><small>'+escapeHtml(entry.date)+' · '+escapeHtml(entry.cards.join(' / '))+'</small></div>'+
 '<div class="story-saved-actions"><button type="button" class="btn btn-outline btn-small" data-story-open="'+escapeHtml(entry.id)+'">📖 불러오기</button>'+
 '<button type="button" class="btn btn-outline btn-small" data-story-delete="'+escapeHtml(entry.id)+'">✕ 삭제</button></div></div>').join('')+'</div>')+'</section>';
}
function storyEditor(){
 const s=storyState();
 return '<section class="panel story-editor"><div class="story-section-header"><h2>👩‍🏫 이야기 마법 카드 편집</h2><span>학생 접속 없이 교사용으로 관리합니다</span></div>'+
 '<p class="story-editor-help">한 줄에 하나씩 입력해 주세요. 분야별 3~35장까지 가능하며, 카드 내용을 저장하면 새로운 이야기 뽑기에 사용됩니다.</p>'+
 '<div class="story-preset-row"><label>기본 카드 모음<select id="storyPresetSelect" class="field">'+STORY_PRESETS.map((p,i)=>'<option value="'+i+'">'+escapeHtml(p.title)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="storyPreset">✨ 예시 카드 불러오기</button></div>'+
 '<label class="story-title-field">활동 제목<input type="text" class="field" maxlength="80" id="storyTitleInput" value="'+escapeHtml(s.title)+'"></label>'+
 '<div class="story-editor-grid">'+STORY_KEYS.map((k,i)=>'<label><strong>'+STORY_LABELS[i]+' 카드</strong><textarea id="storyCards'+i+'" class="field" rows="10" spellcheck="false" placeholder="한 줄에 한 장">'+escapeHtml(s.pools[k].join('\n'))+'</textarea></label>').join('')+'</div>'+
 '<div class="story-editor-actions"><button type="button" class="btn btn-primary" id="storySaveSettings">💾 카드 구성 저장</button>'+
 '<button type="button" class="btn btn-outline" id="storySound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div></section>';
}
function renderStory(){
 return (storyFull?'<div class="story-full-head"><strong>🪄 송이의 이야기 마법상자</strong><button type="button" class="btn btn-outline btn-small" id="storyFull">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','송이의 이야기 마법상자','등장인물·장소·사건을 뽑아 상상력을 키우는 전자칠판 이야기 놀이입니다.','🪄'))+
 '<div class="story-layout">'+storyBoard()+
 '<div class="story-controls"><button type="button" class="btn btn-outline" id="storyFull">'+(storyFull?'✕ 관리 화면으로':'⛶ 전자칠판 크게 보기')+'</button>'+
 (!storyFull?'<button type="button" class="btn btn-outline" id="storyEdit">'+(storyEditOpen?'✕ 카드 편집 닫기':'⚙️ 마법 카드 편집')+'</button>':'')+
 '</div>'+
 (!storyFull?storyDraft()+storyArchives()+(storyEditOpen?storyEditor():'')+
 '<p class="story-privacy">🔒 학생 로그인·QR 접속·실시간 서버 연결이 없습니다. 이야기와 카드 정보는 교사 PC의 브라우저에만 저장됩니다.</p>':'')+
 '</div>';
}
