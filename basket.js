/* 별이와 송이의 수업도구 상자 — 송이의 분류 바구니 (교사 PC 전용) */
'use strict';
const BASKET_PRESETS=[
 {name:'동물과 식물',title:'송이의 동물·식물 분류',categories:['동물','식물'],items:[
  ['🐶 강아지',0],['🌻 해바라기',1],['🐱 고양이',0],['🌲 소나무',1],
  ['🐰 토끼',0],['🌹 장미',1],['🐟 물고기',0],['🌾 벼',1],
  ['🦋 나비',0],['🌵 선인장',1],['🐻 곰',0],['🌷 튤립',1]]},
 {name:'사계절 분류',title:'송이의 사계절 바구니',categories:['봄','여름','가을','겨울'],items:[
  ['🌸 벚꽃',0],['⛄ 눈사람',3],['🏖️ 해수욕',1],['🍁 단풍',2],
  ['❄️ 눈송이',3],['🌷 봄꽃',0],['🌊 물놀이',1],['🌰 도토리 줍기',2],
  ['🌱 새싹',0],['☀️ 무더위',1],['🍂 낙엽',2],['🧣 목도리',3]]},
 {name:'평면도형 분류',title:'송이의 도형 분류',categories:['원','삼각형','사각형'],items:[
  ['⚪ 동그란 원',0],['🔺 빨간 삼각형',1],['🟦 파란 정사각형',2],
  ['🔵 파란 원',0],['△ 세모 모양',1],['▭ 직사각형',2],
  ['○ 빈 원',0],['▲ 까만 삼각형',1],['□ 네모 모양',2]]}
];
const BASKET_MAX_ITEMS=60;
const BASKET_ICONS=['🍯','🌼','🫐','🍓'];
let basketFull=false,basketEditOpen=false,basketSelected=false,basketFeedback=null;
function basketMix(arr){
 const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
function basketFromPreset(p){
 return {title:p.title,categories:p.categories.slice(),items:p.items.map(x=>({text:x[0],cat:x[1]})),
  order:basketMix(p.items.map((_,i)=>i)),actions:[],wrong:0,sound:true};
}
function makeDefaultBasket(){return basketFromPreset(BASKET_PRESETS[0]);}
function normalizeBasket(raw){
 const d=makeDefaultBasket(),v=raw&&typeof raw==='object'?raw:{};
 let categories=Array.isArray(v.categories)?v.categories.slice(0,4).map(x=>String(x??'').trim().slice(0,24)):[];
 if(categories.length<2||categories.some(x=>!x)||new Set(categories).size!==categories.length)categories=d.categories;
 let items=Array.isArray(v.items)?v.items.slice(0,BASKET_MAX_ITEMS).map(x=>({
  text:String(x?.text??'').trim().slice(0,120),cat:Number(x?.cat)
 })).filter(x=>x.text&&Number.isInteger(x.cat)&&x.cat>=0&&x.cat<categories.length):[];
 if(!items.length){categories=d.categories;items=d.items;}
 let order=Array.isArray(v.order)?v.order.slice():[];
 if(order.length!==items.length||order.some(x=>!Number.isInteger(x)||x<0||x>=items.length)||new Set(order).size!==items.length)order=basketMix(items.map((_,i)=>i));
 const actions=[];
 if(Array.isArray(v.actions)){
  for(const action of v.actions.slice(0,items.length)){
   if(!action||action.i!==order[actions.length]||typeof action.ok!=='boolean')break;
   actions.push({i:action.i,ok:action.ok});
  }
 }
 return {title:String(v.title??d.title).trim().slice(0,80)||d.title,
  categories,items,order,actions,wrong:Math.max(0,Math.min(10000,Math.floor(Number(v.wrong)||0))),sound:v.sound!==false};
}
function basketState(){const c=activeClass();return c.basket||(c.basket=makeDefaultBasket());}
function basketStats(s){
 const good=s.actions.filter(a=>a.ok).length,skipped=s.actions.length-good;
 return {good,skipped,done:s.actions.length,total:s.items.length,finished:s.actions.length>=s.items.length};
}
function basketCurrent(s){const stat=basketStats(s);return stat.finished?null:s.items[s.order[s.actions.length]];}
function basketLeave(){basketFull=false;document.body.classList.remove('basket-fullscreen');basketEditOpen=false;basketSelected=false;basketFeedback=null;}
function basketToggleFull(){
 if(!basketFull)basketEditOpen=false;
 basketFull=!basketFull;document.body.classList.toggle('basket-fullscreen',basketFull);
 basketSelected=false;render();window.scrollTo({top:0,behavior:'instant'});
}
function basketToggleEdit(){basketEditOpen=!basketEditOpen;basketFeedback=null;render();}
function basketToggleCard(){basketSelected=!basketSelected;render();}
function basketSound(){const s=basketState();s.sound=!s.sound;save();render();}
function basketChoose(target){
 const s=basketState(),item=basketCurrent(s);
 if(!item||!Number.isInteger(target)||target<0||target>=s.categories.length)return;
 if(item.cat!==target){
  s.wrong=Math.min(10000,s.wrong+1);
  basketFeedback={type:'wrong',message:'송이가 응원해요! 다른 바구니를 생각해 보세요. 💛'};
  basketSelected=false;save();render();return;
 }
 const selectedIndex=s.order[s.actions.length];
 s.actions.push({i:selectedIndex,ok:true});
 basketFeedback={type:'correct',message:'참 잘했어요! '+s.categories[target]+' 바구니에 쏙! ✨'};
 basketSelected=false;
 if(s.sound){soundUnlock();beep();}
 save();render();
 if(basketStats(s).finished)toast('🎉 송이의 분류 바구니를 모두 정리했어요!');
}
function basketSkip(){
 const s=basketState(),item=basketCurrent(s);if(!item)return;
 s.actions.push({i:s.order[s.actions.length],ok:false});
 basketFeedback={type:'skip',message:'괜찮아요! 이 카드는 다음에 다시 연습해 봐요. 🌷'};
 basketSelected=false;save();render();
}
function basketUndo(){
 const s=basketState();if(!s.actions.length)return toast('되돌릴 카드가 없습니다.');
 s.actions.pop();basketFeedback=null;basketSelected=false;save();render();toast('↩ 직전 분류를 되돌렸어요.');
}
function basketReset(shuffle=false){
 const s=basketState();
 if(s.actions.length&&!confirm(shuffle?'지금까지의 진행 기록을 지우고 카드를 다시 섞을까요?':'현재 분류 진행 기록을 처음으로 되돌릴까요?'))return;
 if(shuffle){const before=s.order.join(',');s.order=basketMix(s.items.map((_,i)=>i));
  if(s.order.length>1&&before===s.order.join(',')){[s.order[0],s.order[1]]=[s.order[1],s.order[0]];}
 }
 s.actions=[];s.wrong=0;basketFeedback=null;basketSelected=false;save();render();
 toast(shuffle?'🎲 카드를 새롭게 섞었습니다.':'🧺 다시 시작해요!');
}
function basketCountChanged(){
 const v=Math.max(2,Math.min(4,Math.floor(Number(document.getElementById('basketCountInput')?.value)||2)));
 document.querySelectorAll('[data-basket-cat-wrap]').forEach(el=>{
  const n=Number(el.dataset.basketCatWrap);el.hidden=n>=v;
 });
 const hint=document.getElementById('basketCountHelp');
 if(hint)hint.textContent='1~'+v+'번 바구니 이름을 입력하세요.';
}
function basketParseItems(text,categories){
 const lines=String(text??'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 if(!lines.length)return {error:'분류할 카드를 한 개 이상 입력해 주세요.'};
 if(lines.length>BASKET_MAX_ITEMS)return {error:'카드는 최대 '+BASKET_MAX_ITEMS+'개까지 등록할 수 있어요.'};
 const items=[];
 for(let i=0;i<lines.length;i++){
  const split=lines[i].split('|').map(x=>x.trim());
  if(split.length!==2||!split[0]||!split[1])return {error:(i+1)+'번째 줄은 [카드 | 바구니 이름]으로 입력해 주세요.'};
  if(split[0].length>120)return {error:(i+1)+'번째 카드 글자가 너무 길어요. (120자 이내)'};
  const byNumber=/^[1-4]$/.test(split[1])?Number(split[1])-1:-1;
  const cat=byNumber>=0?byNumber:categories.indexOf(split[1]);
  if(cat<0||cat>=categories.length)return {error:(i+1)+'번째 카드의 바구니를 확인해 주세요. ('+categories.join(', ')+')'};
  items.push({text:split[0],cat});
 }
 return {items};
}
function basketApplySettings(){
 const s=basketState(),n=Math.max(2,Math.min(4,Number(document.getElementById('basketCountInput')?.value)||2));
 const cats=Array.from({length:n},(_,i)=>String(document.getElementById('basketCat'+i)?.value??'').trim());
 if(cats.some(x=>!x||x.length>24)||new Set(cats).size!==cats.length)return toast('바구니 이름은 1~24자로, 서로 다르게 입력해 주세요.');
 const parsed=basketParseItems(document.getElementById('basketItemsInput')?.value,cats);
 if(parsed.error)return toast(parsed.error);
 const title=String(document.getElementById('basketTitleInput')?.value??'송이의 분류 바구니').trim().slice(0,80)||'송이의 분류 바구니';
 const changed=JSON.stringify(cats)!==JSON.stringify(s.categories)||JSON.stringify(parsed.items)!==JSON.stringify(s.items);
 if(changed&&s.actions.length&&!confirm('바구니나 카드를 변경하면 현재 분류 기록이 초기화됩니다. 계속할까요?'))return;
 s.title=title;s.categories=cats;s.items=parsed.items;
 if(changed){s.order=basketMix(s.items.map((_,i)=>i));s.actions=[];s.wrong=0;}
 basketSelected=false;basketFeedback=null;basketEditOpen=false;save();render();toast('💾 분류 문제와 설정을 저장했어요.');
}
function basketLoadPreset(){
 const id=Number(document.getElementById('basketPresetSelect')?.value);
 const preset=BASKET_PRESETS[id];
 if(!preset)return;
 if(!confirm('현재 바구니와 카드를 ['+preset.name+'] 예시로 바꿀까요? 기존 분류 진행 기록도 초기화됩니다.'))return;
 const c=activeClass(),old=basketState();c.basket=basketFromPreset(preset);c.basket.sound=old.sound;
 basketFeedback=null;basketSelected=false;basketEditOpen=false;save();render();toast('🌈 '+preset.name+' 예시를 불러왔어요.');
}
function basketCopy(){
 const s=basketState();
 copyText([s.title,'바구니: '+s.categories.join(', '),...s.items.map(i=>i.text+' | '+s.categories[i.cat])].join('\n'));
}
function basketBuckets(s){
 const count=s.categories.length;
 return '<div class="basket-targets basket-targets-'+count+'" role="group" aria-label="분류할 바구니">'+
 s.categories.map((name,cat)=>{
  const placed=s.actions.filter(a=>a.ok&&s.items[a.i].cat===cat).map(a=>s.items[a.i].text);
  return '<button type="button" class="basket-target basket-target-'+cat+'" data-basket-target="'+cat+'" aria-label="'+escapeHtml(name)+' 바구니에 넣기">'+
   '<span class="basket-bucket-icon" aria-hidden="true">🧺</span>'+
   '<strong>'+escapeHtml(name)+'</strong><small>모은 카드 '+placed.length+'개</small>'+
   (placed.length?'<div class="basket-collected">'+placed.slice(-5).map(x=>'<span>'+escapeHtml(x)+'</span>').join('')+(placed.length>5?'<span>+'+(placed.length-5)+'개</span>':'')+'</div>':'<span class="basket-bucket-help">여기에 카드를 넣어요!</span>')+
   '</button>';
 }).join('')+'</div>';
}
function basketBoard(){
 const s=basketState(),stat=basketStats(s),card=basketCurrent(s);
 const feedback=basketFeedback?'<div class="basket-feedback basket-feedback-'+basketFeedback.type+'" role="status">'+escapeHtml(basketFeedback.message)+'</div>':'';
 return '<section class="basket-board" aria-label="송이의 분류 바구니 게임">'+
 '<div class="basket-hero"><div><small>🌈 교실에서 만나는 즐거운 분류 놀이</small><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>송이와 함께 카드를 보고 알맞은 바구니에 넣어 보세요!</p></div>'+
 '<div class="basket-mascot" aria-hidden="true">🐿️🌸</div></div>'+
 '<div class="basket-game-meta"><span>🧺 카드 '+stat.done+' / '+stat.total+'</span><span>⭐ 맞힌 카드 '+stat.good+'</span><span>🌷 다시 연습 '+stat.skipped+'</span><span>💡 다시 시도 '+s.wrong+'</span></div>'+
 '<div class="basket-progress-track" role="progressbar" aria-label="분류 진행률" aria-valuenow="'+stat.done+'" aria-valuemin="0" aria-valuemax="'+stat.total+'"><span style="width:'+(stat.done/stat.total*100)+'%"></span></div>'+
 (stat.finished?'<div class="basket-finish" role="status"><div>🌟🎉🧺</div><h3>송이의 바구니 정리 성공!</h3><p>총 '+stat.total+'장 중 <strong>'+stat.good+'장</strong>을 바르게 분류했어요. '+(stat.skipped?'건너뛴 '+stat.skipped+'장은 다시 도전해 봐요!':'모든 카드를 분류했어요!')+'</p></div>':
 '<div class="basket-stage"><div class="basket-current-label">✨ 지금 분류할 카드 · '+(stat.done+1)+'번째</div>'+
 '<button class="basket-item-card'+(basketSelected?' basket-item-selected':'')+(basketFeedback?.type==='wrong'?' basket-item-tryagain':'')+'" id="basketCard" draggable="true" type="button" aria-label="분류 카드 '+escapeHtml(card.text)+' 선택">'+
 '<span class="basket-card-sparkles" aria-hidden="true">✧ 🌟 ✧</span><strong>'+escapeHtml(card.text)+'</strong><small>카드를 끌거나, 바구니를 눌러 넣으세요!</small></button>'+
 '<div class="basket-stage-arrow" aria-hidden="true">↓</div></div>')+
 feedback+basketBuckets(s)+
 '<p class="basket-board-instruction">👆 바구니를 눌러도 분류할 수 있어요. 터치스크린은 카드를 누른 다음 바구니를 선택하세요.</p>'+
 '</section>';
}
function basketControls(){
 const s=basketState(),st=basketStats(s);
 return '<div class="basket-controls"><div class="basket-control-buttons">'+
 (!st.finished?'<button type="button" class="btn btn-secondary" id="basketSkip">↪ 이 카드 건너뛰기</button>':'')+
 '<button type="button" class="btn btn-outline" id="basketUndo" '+(!s.actions.length?'disabled':'')+'>↩ 직전 분류 취소</button>'+
 '<button type="button" class="btn btn-outline" id="basketRestart">🔄 처음부터</button>'+
 '<button type="button" class="btn btn-outline" id="basketShuffle">🎲 카드 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="basketFullscreen">'+(basketFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!basketFull?'<button type="button" class="btn btn-outline" id="basketEdit">'+(basketEditOpen?'✕ 설정 닫기':'⚙️ 문제·바구니 편집')+'</button>':'')+
 '</div></div>';
}
function basketEditor(){
 const s=basketState();
 return '<section class="panel basket-editor"><h2>👩‍🏫 송이의 분류 놀이 준비하기</h2>'+
 '<p class="basket-editor-note">한 대의 교사 PC에서 실행합니다. 학급별 바구니·진행 기록은 브라우저에 저장되고 기존 전체 백업에도 포함됩니다.</p>'+
 '<div class="basket-preset-row"><label>예시 활동 선택<select id="basketPresetSelect" class="field">'+BASKET_PRESETS.map((p,i)=>'<option value="'+i+'">'+escapeHtml(p.name)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-outline" id="basketPreset">✨ 선택한 예시 불러오기</button></div>'+
 '<div class="basket-editor-grid"><label>활동 제목<input id="basketTitleInput" class="field" maxlength="80" value="'+escapeHtml(s.title)+'"></label>'+
 '<label>바구니 개수<select class="field" id="basketCountInput">'+[2,3,4].map(n=>'<option value="'+n+'" '+(n===s.categories.length?'selected':'')+'>'+n+'개</option>').join('')+'</select></label></div>'+
 '<p id="basketCountHelp" class="basket-editor-note">1~'+s.categories.length+'번 바구니 이름을 입력하세요.</p>'+
 '<div class="basket-category-editor">'+Array.from({length:4},(_,i)=>'<label data-basket-cat-wrap="'+i+'" '+(i>=s.categories.length?'hidden':'')+'>'+(i+1)+'번 바구니<input id="basketCat'+i+'" class="field" maxlength="24" value="'+escapeHtml(s.categories[i]||('바구니 '+(i+1)))+'"></label>').join('')+'</div>'+
 '<label class="basket-items-label" for="basketItemsInput">분류 카드 직접 입력</label>'+
 '<p class="basket-editor-note">한 줄에 한 장씩 <strong>카드 내용 | 정답 바구니 이름</strong> (또는 바구니 번호)을 입력하세요. 최대 60장입니다.</p>'+
 '<textarea id="basketItemsInput" class="field basket-items-editor" rows="10" spellcheck="false" placeholder="🐶 강아지 | 동물">'+escapeHtml(s.items.map(item=>item.text+' | '+s.categories[item.cat]).join('\n'))+'</textarea>'+
 '<div class="basket-editor-actions"><button type="button" class="btn btn-primary" id="basketSave">💾 설정·카드 저장</button>'+
 '<button type="button" class="btn btn-outline" id="basketCopy">📋 카드 목록 복사</button>'+
 '<button type="button" class="btn btn-outline" id="basketSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div></section>';
}
function renderBasket(){
 return (basketFull?'<div class="basket-full-head"><strong>🌷 송이의 분류 바구니</strong><button type="button" class="btn btn-outline btn-small" id="basketFullscreen">✕ 관리 화면으로</button></div>':
 title('교실 놀이·게임','송이의 분류 바구니','동물·식물, 사계절, 도형을 재미있게 분류하는 전자칠판 학습 놀이입니다.','🧺'))+
 '<div class="basket-layout">'+basketBoard()+basketControls()+
 (!basketFull&&basketEditOpen?basketEditor():'')+
 (!basketFull?'<p class="basket-privacy-note">🔒 학생별 접속·로그인·실시간 통신이 없습니다. 교사 PC 한 대에서 실행됩니다.</p>':'')+'</div>';
}
function basketAfterRender(){
 if(currentView!=='basket')return;
 const card=document.getElementById('basketCard');
 if(card)card.addEventListener('dragstart',event=>{
  const s=basketState();if(!basketCurrent(s)){event.preventDefault();return;}
  event.dataTransfer.effectAllowed='move';
  event.dataTransfer.setData('text/plain','basket-card-'+s.actions.length);
  card.classList.add('basket-being-dragged');
 });
 document.querySelectorAll('[data-basket-target]').forEach(el=>{
  el.addEventListener('dragover',event=>{if(!basketCurrent(basketState()))return;event.preventDefault();event.dataTransfer.dropEffect='move';});
  el.addEventListener('dragenter',event=>{if(!basketCurrent(basketState()))return;event.preventDefault();el.classList.add('basket-drop-hover');});
  el.addEventListener('dragleave',()=>el.classList.remove('basket-drop-hover'));
  el.addEventListener('drop',event=>{
   event.preventDefault();el.classList.remove('basket-drop-hover');
   const s=basketState(),mark=event.dataTransfer.getData('text/plain');
   if(mark!=='basket-card-'+s.actions.length)return;
   basketChoose(Number(el.dataset.basketTarget));
  });
 });
}
