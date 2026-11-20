/* 별이와 송이 수업도구 ⑩ 우리 반 협동 퍼즐 — 교사 PC·전자칠판만 사용 */
'use strict';
const COOP_THEMES=[
 {id:'forest',label:'🌳 별이와 송이의 숲속 소풍',title:'숲속 소풍'},
 {id:'sea',label:'🐳 바닷속 친구들',title:'바닷속 친구들'},
 {id:'space',label:'🚀 반짝이는 우주여행',title:'우주여행'},
 {id:'rainbow',label:'🌈 무지개 학교',title:'무지개 학교'}
];
const COOP_TEAM_NAMES=['1모둠','2모둠','3모둠','4모둠'];
const COOP_IMAGE_LIMIT=420000;
let coopFull=false,coopEditorOpen=false,coopSelected=null,coopFeedback='',coopWrong=-1;
function coopSvg(theme){
 const defs='<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#b8e9ff"/><stop offset="1" stop-color="#fdf6d2"/></linearGradient>'+
 '<linearGradient id="sea" x2="0" y2="1"><stop stop-color="#b0ecff"/><stop offset="1" stop-color="#167eae"/></linearGradient></defs>';
 const base='<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">'+defs;
 if(theme==='sea')return base+
 '<rect width="720" height="720" fill="url(#sea)"/><circle cx="590" cy="110" r="69" fill="#fffac8" opacity=".7"/>'+
 '<path d="M0 590 Q150 520 330 590 T720 595 V720 H0Z" fill="#ffe6ae"/>'+
 '<g opacity=".45" stroke="#ecffff" stroke-width="12" fill="none"><path d="M0 200 Q110 150 220 200 T440 200 T660 200"/><path d="M0 265 Q160 215 310 265 T620 265"/></g>'+
 '<g fill="#a5e5cf"><ellipse cx="198" cy="375" rx="120" ry="82"/><ellipse cx="335" cy="357" rx="64" ry="54"/>'+
 '<path d="M90 365 L23 310 L25 425Z"/><ellipse cx="180" cy="450" rx="35" ry="70" transform="rotate(35 180 450)"/></g>'+
 '<circle cx="351" cy="340" r="10" fill="#385d68"/><circle cx="355" cy="338" r="3" fill="white"/>'+
 '<g fill="#f6aff1"><path d="M450 265 Q520 210 592 270 Q520 338 450 265"/><path d="M450 265 L410 220 L410 310Z"/></g>'+
 '<circle cx="545" cy="263" r="7" fill="#73547c"/>'+
 '<g stroke-linecap="round" stroke-width="19" fill="none"><path d="M81 680 Q65 590 102 540" stroke="#6dd3aa"/><path d="M148 698 Q170 600 135 520" stroke="#a5e7c7"/><path d="M631 700 Q600 600 645 525" stroke="#7ad3a0"/><path d="M675 687 Q697 607 674 576" stroke="#6aceb4"/></g>'+
 '<g fill="#ffeaa7"><circle cx="398" cy="576" r="12"/><circle cx="416" cy="589" r="12"/><circle cx="430" cy="563" r="12"/></g>'+
 '<g fill="#fff" opacity=".75"><circle cx="91" cy="147" r="12"/><circle cx="110" cy="110" r="7"/><circle cx="630" cy="375" r="13"/><circle cx="598" cy="405" r="8"/></g></svg>';
 if(theme==='space')return base+
 '<rect width="720" height="720" fill="#22285f"/><circle cx="580" cy="145" r="125" fill="#aa8af6"/>'+
 '<ellipse cx="580" cy="145" rx="173" ry="51" transform="rotate(-22 580 145)" fill="none" stroke="#ffda9a" stroke-width="27"/>'+
 '<g fill="#fff3af"><circle cx="55" cy="64" r="5"/><circle cx="155" cy="132" r="7"/><circle cx="270" cy="62" r="6"/><circle cx="390" cy="120" r="5"/><circle cx="107" cy="330" r="7"/><circle cx="653" cy="350" r="6"/><circle cx="610" cy="570" r="7"/><circle cx="245" cy="665" r="6"/></g>'+
 '<g transform="translate(170 150) rotate(22 170 230)"><path d="M160 42 Q282 171 215 370 H106 Q40 171 160 42" fill="#f9f6ff"/>'+
 '<path d="M117 360 L68 425 L97 300" fill="#f4a9bd"/><path d="M202 360 L253 425 L224 301" fill="#f4a9bd"/>'+
 '<ellipse cx="160" cy="226" rx="64" ry="67" fill="#95d9ff" stroke="#b3a6ed" stroke-width="19"/>'+
 '<circle cx="148" cy="215" r="20" fill="#fff" opacity=".5"/><path d="M128 373 L160 486 L193 373" fill="#ffd66c"/>'+
 '<path d="M145 370 L160 435 L173 370" fill="#ff9a9b"/></g>'+
 '<circle cx="560" cy="518" r="67" fill="#89d9c1"/><path d="M499 527 Q554 470 610 544" fill="none" stroke="#dfffe6" stroke-width="16"/>'+
 '<path d="M35 605 L48 630 L75 640 L48 650 L35 680 L22 650 L0 640 L22 630Z" fill="#fff0bc"/>'+
 '<path d="M480 358 L490 379 L512 390 L490 402 L480 425 L469 402 L447 390 L469 379Z" fill="#fff0bc"/></svg>';
 if(theme==='rainbow')return base+
 '<rect width="720" height="720" fill="#dceeff"/><rect y="550" width="720" height="170" fill="#c7f3c9"/>'+
 '<g fill="none" stroke-width="25"><path d="M78 485 A288 288 0 0 1 654 485" stroke="#f29cbd"/>'+
 '<path d="M112 485 A254 254 0 0 1 620 485" stroke="#ffd783"/>'+
 '<path d="M145 485 A221 221 0 0 1 587 485" stroke="#aaddab"/>'+
 '<path d="M179 485 A187 187 0 0 1 553 485" stroke="#96bbee"/></g>'+
 '<g fill="#fff"><ellipse cx="121" cy="434" rx="105" ry="48"/><ellipse cx="184" cy="439" rx="78" ry="47"/>'+
 '<ellipse cx="546" cy="435" rx="112" ry="50"/><ellipse cx="620" cy="440" rx="95" ry="45"/></g>'+
 '<rect x="240" y="295" width="252" height="330" rx="22" fill="#fff4cb" stroke="#deaf9b" stroke-width="14"/>'+
 '<path d="M220 306 L362 191 L514 306Z" fill="#f4aabc" stroke="#de96b5" stroke-width="11"/>'+
 '<rect x="322" y="468" width="93" height="157" rx="18" fill="#a6cbe8"/><circle cx="398" cy="553" r="6" fill="#fff"/>'+
 '<rect x="277" y="337" width="177" height="93" rx="10" fill="#8cccbb"/>'+
 '<path d="M296 385 L312 403 L332 370 L352 405 L382 368 L400 396 L424 372" fill="none" stroke="#fff" stroke-width="11" stroke-linejoin="round"/>'+
 '<g fill="#ffd971"><circle cx="105" cy="598" r="22"/><circle cx="184" cy="633" r="18"/><circle cx="589" cy="609" r="25"/></g>'+
 '<g stroke="#7fbb8a" stroke-width="9"><path d="M103 617 V684"/><path d="M184 647 V704"/><path d="M588 632 V697"/></g></svg>';
 return base+
 '<rect width="720" height="720" fill="url(#sky)"/><circle cx="580" cy="134" r="84" fill="#fff2aa"/>'+
 '<path d="M0 418 Q190 243 352 390 Q523 206 720 402 V720 H0Z" fill="#b4e4c1"/>'+
 '<path d="M0 510 Q165 427 351 518 T720 500 V720 H0Z" fill="#8fd2aa"/>'+
 '<g><rect x="108" y="230" width="36" height="317" rx="10" fill="#a77b68"/><circle cx="127" cy="210" r="113" fill="#85c99c"/>'+
 '<circle cx="64" cy="239" r="74" fill="#9bd9ab"/><circle cx="187" cy="234" r="75" fill="#93d2a7"/></g>'+
 '<g><rect x="548" y="285" width="36" height="291" rx="11" fill="#9d795a"/><circle cx="566" cy="276" r="108" fill="#7fcaa1"/>'+
 '<circle cx="496" cy="282" r="60" fill="#a9dfb0"/><circle cx="632" cy="294" r="62" fill="#a8e1af"/></g>'+
 '<g><ellipse cx="349" cy="580" rx="126" ry="98" fill="#fff2da"/>'+
 '<circle cx="282" cy="508" r="53" fill="#fff2da"/><circle cx="418" cy="512" r="53" fill="#fff2da"/>'+
 '<ellipse cx="292" cy="548" rx="13" ry="16" fill="#7a697c"/><ellipse cx="403" cy="548" rx="13" ry="16" fill="#7a697c"/>'+
 '<path d="M340 577 Q351 590 364 577" stroke="#c995a3" stroke-width="10" fill="none" stroke-linecap="round"/>'+
 '<ellipse cx="275" cy="584" rx="19" ry="10" fill="#fac2c3"/><ellipse cx="421" cy="584" rx="19" ry="10" fill="#fac2c3"/></g>'+
 '<g fill="#f3b1be"><circle cx="62" cy="622" r="23"/><circle cx="669" cy="615" r="28"/></g>'+
 '<g fill="#f9d877"><circle cx="55" cy="622" r="10"/><circle cx="674" cy="615" r="10"/></g>'+
 '<g fill="#ffffff" opacity=".7"><ellipse cx="265" cy="120" rx="100" ry="36"/><ellipse cx="327" cy="127" rx="77" ry="39"/></g></svg>';
}
const COOP_URLS=Object.fromEntries(COOP_THEMES.map(t=>[t.id,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(coopSvg(t.id))]));
function coopShuffled(count){
 const values=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 if(count>1&&values.every((x,i)=>x===i))[values[0],values[1]]=[values[1],values[0]];
 return values;
}
function coopMakeDefault(){
 return {theme:'forest',size:3,title:'우리 반 협동 퍼즐',customImage:null,slots:Array(9).fill(null),order:coopShuffled(9),
  moves:[],wrong:0,hint:false,teamCount:1,team:0,teamNames:COOP_TEAM_NAMES.slice(),teamScores:[0,0,0,0],sound:true};
}
function makeDefaultCoop(){return coopMakeDefault();}
function coopCleanImage(value){
 return typeof value==='string'&&value.length<=COOP_IMAGE_LIMIT&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)?value:null;
}
function normalizeCoop(raw){
 const d=coopMakeDefault(),v=raw&&typeof raw==='object'?raw:{};
 const size=[3,4,5].includes(v.size)?v.size:3,count=size*size;
 const customImage=coopCleanImage(v.customImage),theme=(v.theme==='custom'&&customImage)?'custom':
  COOP_THEMES.some(t=>t.id===v.theme)?v.theme:'forest';
 const slots=Array.from({length:count},(_,i)=>v.slots?.[i]===i?i:null);
 let order=Array.isArray(v.order)?v.order.slice():[];
 if(order.length!==count||order.some(x=>!Number.isInteger(x)||x<0||x>=count)||new Set(order).size!==count)order=coopShuffled(count);
 const teamCount=[1,2,3,4].includes(v.teamCount)?v.teamCount:1;
 const teamNames=Array.from({length:4},(_,i)=>String(v.teamNames?.[i]??d.teamNames[i]).trim().slice(0,22)||d.teamNames[i]);
 const team=Number.isInteger(v.team)&&v.team>=0&&v.team<teamCount?v.team:0;
 let moves=Array.isArray(v.moves)?v.moves.slice(0,count).filter(m=>m&&Number.isInteger(m.slot)&&m.slot>=0&&m.slot<count&&slots[m.slot]===m.slot&&Number.isInteger(m.team)&&m.team>=0&&m.team<teamCount):[];
 const seen=new Set();moves=moves.filter(m=>!seen.has(m.slot)&&seen.add(m.slot)).map(m=>({slot:m.slot,team:m.team}));
 const teamScores=Array.from({length:4},(_,i)=>moves.filter(m=>m.team===i).length);
 return {theme,size,title:String(v.title??d.title).trim().slice(0,75)||d.title,customImage,slots,order,moves,
  wrong:Math.max(0,Math.min(9999,Math.floor(Number(v.wrong)||0))),hint:v.hint===true,
  teamCount,team,teamNames,teamScores,sound:v.sound!==false};
}
function coopState(){const c=activeClass();return c.coop||(c.coop=makeDefaultCoop());}
function coopStats(s){
 const completed=s.slots.filter(x=>x!==null).length,total=s.size*s.size;
 return {completed,total,percent:Math.round(completed/total*100),finished:completed===total};
}
function coopImage(s){return s.theme==='custom'?s.customImage||COOP_URLS.forest:COOP_URLS[s.theme]||COOP_URLS.forest;}
function coopTeamLabel(s,i){return s.teamCount===1?'우리 반':s.teamNames[i];}
function coopPiecePos(piece,size){
 const x=piece%size,y=Math.floor(piece/size),scale=size>1?100/(size-1):0;
 return 'background-position:'+(x*scale).toFixed(4)+'% '+(y*scale).toFixed(4)+'%;background-size:'+(size*100)+'% '+(size*100)+'%';
}
function coopLeave(){
 coopFull=false;document.body.classList.remove('coop-fullscreen');coopEditorOpen=false;
 coopSelected=null;coopWrong=-1;coopFeedback='';
}
function coopToggleFull(){
 if(!coopFull)coopEditorOpen=false;
 coopFull=!coopFull;document.body.classList.toggle('coop-fullscreen',coopFull);
 coopWrong=-1;render();if(coopFull)window.scrollTo({top:0,behavior:'instant'});
}
function coopToggleEdit(){coopEditorOpen=!coopEditorOpen;coopSelected=null;render();}
function coopSelect(id){
 const s=coopState(),count=s.size*s.size;
 if(!Number.isInteger(id)||id<0||id>=count||s.slots.includes(id)||coopStats(s).finished)return;
 coopSelected=coopSelected===id?null:id;coopWrong=-1;
 coopFeedback=coopSelected===null?'조각 선택을 취소했어요.':'🧩 선택한 조각을 그림판의 알맞은 위치에 놓아 보세요.';
 render();
}
function coopPlace(slot,id=coopSelected){
 const s=coopState(),n=s.size*s.size;
 if(!Number.isInteger(slot)||slot<0||slot>=n||!Number.isInteger(id)||id<0||id>=n||coopStats(s).finished)return;
 if(s.slots[slot]!==null)return toast('이미 조각을 맞힌 자리예요. 다른 빈 칸을 골라 보세요.');
 if(s.slots.includes(id))return;
 if(id!==slot){s.wrong=Math.min(9999,s.wrong+1);coopWrong=slot;coopFeedback='🌷 아쉽지만 이 조각의 자리가 아니에요. 다시 찾아볼까요?';save();render();return;}
 s.slots[slot]=id;s.moves.push({slot,team:s.team});s.teamScores[s.team]++;
 coopSelected=null;coopWrong=-1;
 const stat=coopStats(s);
 coopFeedback=stat.finished?'🎉 우리 반 모두 힘을 모아 퍼즐을 완성했어요!':'🌟 성공! '+stat.completed+' / '+stat.total+'조각을 맞혔어요.';
 if(s.sound){soundUnlock();beep();}
 save();render();
 if(stat.finished)toast('🎉 모두 함께 퍼즐을 완성했어요!');
}
function coopRemove(slot){
 const s=coopState();if(!Number.isInteger(slot)||slot<0||slot>=s.slots.length||s.slots[slot]===null)return;
 const moveIndex=s.moves.findIndex(m=>m.slot===slot);
 if(moveIndex!==-1){
  const [move]=s.moves.splice(moveIndex,1);
  s.teamScores[move.team]=Math.max(0,s.teamScores[move.team]-1);
 }
 s.slots[slot]=null;coopSelected=null;coopWrong=-1;
 coopFeedback='↩ 조각을 그림판에서 꺼냈어요. 다시 맞춰 보세요.';
 save();render();
}
function coopUndo(){
 const s=coopState(),last=s.moves[s.moves.length-1];
 if(!last)return toast('되돌릴 조각이 없어요.');
 coopRemove(last.slot);
}
function coopToggleHint(){const s=coopState();s.hint=!s.hint;save();render();}
function coopNextTeam(){
 const s=coopState();s.team=(s.team+1)%s.teamCount;coopSelected=null;coopWrong=-1;
 coopFeedback='🤝 '+coopTeamLabel(s,s.team)+' 차례예요. 함께 맞혀 봐요!';
 save();render();
}
function coopRestart(reshuffle=false){
 const s=coopState();
 if(coopStats(s).completed>0&&!confirm(reshuffle?'맞힌 조각을 초기화하고 조각을 새로 섞을까요?':'맞힌 조각을 모두 초기화하고 다시 도전할까요?'))return;
 const n=s.size*s.size;
 s.slots=Array(n).fill(null);s.moves=[];s.teamScores=[0,0,0,0];s.team=0;s.wrong=0;s.hint=false;
 if(reshuffle)s.order=coopShuffled(n);
 coopSelected=null;coopWrong=-1;coopFeedback=reshuffle?'🎲 그림 조각을 새로 섞었어요.':'🌈 새 퍼즐을 시작해요!';
 save();render();
}
function coopSaveSettings(){
 const s=coopState();
 const theme=document.getElementById('coopThemeInput')?.value;
 const size=Number(document.getElementById('coopSizeInput')?.value);
 const teamCount=Number(document.getElementById('coopTeamCountInput')?.value);
 const title=String(document.getElementById('coopTitleInput')?.value??'').trim().slice(0,75);
 if(!title)return toast('퍼즐 제목을 입력해 주세요.');
 if(![3,4,5].includes(size)||![1,2,3,4].includes(teamCount))return toast('난이도 또는 모둠 수를 확인해 주세요.');
 if(theme!=='custom'&&!COOP_THEMES.some(t=>t.id===theme))return toast('그림을 선택해 주세요.');
 if(theme==='custom'&&!s.customImage)return toast('우리 반 사진을 먼저 등록해 주세요.');
 const names=[];
 for(let i=0;i<4;i++){
  const name=String(document.getElementById('coopTeamName'+i)?.value??'').trim();
  if(!name||name.length>22)return toast('모둠 이름은 1~22자로 작성해 주세요.');
  names.push(name);
 }
 if(new Set(names.slice(0,teamCount)).size!==teamCount)return toast('모둠 이름은 서로 다르게 입력해 주세요.');
 const changes=theme!==s.theme||size!==s.size||teamCount!==s.teamCount;
 if(changes&&coopStats(s).completed>0&&!confirm('그림·난이도·모둠 구성을 변경하면 현재 조각과 점수 진행 기록이 초기화됩니다. 계속할까요?'))return;
 s.title=title;s.teamNames=names;
 if(changes){
  s.theme=theme;s.size=size;s.teamCount=teamCount;s.team=0;
  const n=size*size;s.slots=Array(n).fill(null);s.order=coopShuffled(n);s.moves=[];s.teamScores=[0,0,0,0];s.wrong=0;s.hint=false;
 }
 coopEditorOpen=false;coopSelected=null;coopFeedback='✨ 그림 퍼즐 설정을 저장했어요!';
 save();render();toast('💾 우리 반 협동 퍼즐 설정을 저장했습니다.');
}
function coopFilePicked(file){
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024){
  return toast('JPG·PNG·WEBP 사진(4MB 이하)만 등록할 수 있어요.');
 }
 const classId=activeClass().id,old=coopState();
 if(coopStats(old).completed>0&&!confirm('사진을 변경하면 현재 퍼즐 진행이 초기화됩니다. 저장된 다른 수업도구는 유지됩니다. 계속할까요?'))return;
 const reader=new FileReader();
 reader.onerror=()=>toast('사진을 읽지 못했어요. 다시 선택해 주세요.');
 reader.onload=()=>{
  if(currentView!=='coop'||activeClass().id!==classId)return;
  const image=new Image();
  image.onerror=()=>toast('지원되지 않는 이미지 파일이에요.');
  image.onload=()=>{
   if(currentView!=='coop'||activeClass().id!==classId)return;
   try{
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('canvas');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,640,640);
    const side=Math.min(image.naturalWidth,image.naturalHeight);
    ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,640,640);
    const data=canvas.toDataURL('image/jpeg',0.78);
    if(!coopCleanImage(data))return toast('사진 저장 크기가 너무 큽니다. 다른 사진을 선택해 주세요.');
    const s=coopState(),n=s.size*s.size;
    s.customImage=data;s.theme='custom';s.slots=Array(n).fill(null);s.order=coopShuffled(n);
    s.moves=[];s.teamScores=[0,0,0,0];s.team=0;s.wrong=0;s.hint=false;
    coopSelected=null;coopFeedback='🖼️ 우리 반 사진을 불러왔어요. 새로운 퍼즐에 도전해 보세요!';
    coopEditorOpen=false;save();render();toast('우리 반 사진을 퍼즐로 만들었어요!');
   }catch(error){toast('사진 변환에 실패했어요. 다른 사진을 사용해 주세요.');}
  };
  image.src=String(reader.result);
 };
 reader.readAsDataURL(file);
}
function coopSound(){const s=coopState();s.sound=!s.sound;save();render();}
function coopPiece(s,id,kind){
 const selected=coopSelected===id,placed=s.slots.includes(id);
 if(kind==='pool'&&placed)return '';
 return '<button type="button" class="coop-piece coop-piece-'+kind+(selected?' coop-piece-selected':'')+
  '" data-coop-piece="'+id+'" draggable="'+(kind==='pool')+'" aria-label="그림 조각 '+(id+1)+(selected?' 선택됨':'')+'" aria-pressed="'+selected+'">'+
  '<span class="coop-piece-art" aria-hidden="true" style="'+coopPiecePos(id,s.size)+'"></span>'+
  (kind==='pool'?'<span class="coop-piece-stamp" aria-hidden="true">✦</span>':'')+'</button>';
}
function coopBoard(){
 const s=coopState(),stat=coopStats(s),img=coopImage(s);
 return '<section class="coop-board" style="--coop-image:url(&quot;'+escapeHtml(img)+'&quot;)" aria-label="우리 반 협동 그림 퍼즐">'+
 '<div class="coop-hero"><div><span>🤝 하나씩 맞추면 큰 그림이 돼요!</span><h2>'+escapeHtml(s.title)+'</h2>'+
 '<p>친구들과 힘을 모아 그림 조각을 제자리에 놓아 보세요.</p></div><div class="coop-mascot" aria-hidden="true">⭐🐿️🧩</div></div>'+
 '<div class="coop-progress"><span>🌟 완성한 조각 <strong>'+stat.completed+' / '+stat.total+'</strong></span>'+
 '<span>🎉 완성도 <strong>'+stat.percent+'%</strong></span>'+
 '<span>🌷 다시 도전 <strong>'+s.wrong+'번</strong></span>'+
 '<span>👥 현재 차례 <strong>'+escapeHtml(coopTeamLabel(s,s.team))+'</strong></span></div>'+
 '<div class="coop-meter" role="progressbar" aria-label="퍼즐 완성도" aria-valuenow="'+stat.percent+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+stat.percent+'%"></span></div>'+
 '<div class="coop-content-grid"><div class="coop-target"><div class="coop-section-head"><strong>🖼️ 그림을 함께 완성해요</strong>'+
 '<span>'+s.size+'×'+s.size+' 퍼즐</span></div>'+
 '<div class="coop-grid coop-grid-'+s.size+(s.hint?' coop-grid-hint':'')+'" style="--coop-grid-size:'+s.size+'">'+
 Array.from({length:stat.total},(_,i)=>'<button type="button" class="coop-slot'+(s.slots[i]!==null?' coop-slot-filled':'')+
  (coopWrong===i?' coop-slot-wrong':'')+'" data-coop-slot="'+i+'" aria-label="퍼즐 위치 '+(i+1)+(s.slots[i]!==null?' 조각 완료':' 비어 있음')+'"'+(stat.finished?' disabled':'')+'>'+
 (s.slots[i]!==null?'<span class="coop-piece-art" aria-hidden="true" style="'+coopPiecePos(i,s.size)+'"></span>':
 '<span class="coop-slot-number">'+(i+1)+'</span>')+'</button>').join('')+'</div>'+
 '<p class="coop-target-help">'+(s.hint?'💡 원본 그림을 참고해 보세요.':'👆 아래에서 조각을 선택하고 위의 알맞은 칸을 눌러 주세요.')+'</p></div>'+
 '<div class="coop-piecebox"><div class="coop-section-head"><strong>🧩 아직 맞추지 않은 조각</strong><span>'+(stat.total-stat.completed)+'개 남음</span></div>'+
 '<div class="coop-pieces coop-pieces-'+s.size+'">'+s.order.filter(id=>s.slots[id]===null).map(id=>coopPiece(s,id,'pool')).join('')+
 (stat.finished?'<div class="coop-all-done">✨ 모든 조각을 완성했어요!</div>':'')+'</div>'+
 '<div class="coop-preview-wrap">'+(s.hint?'<div class="coop-preview"><strong>🔎 원본 그림 힌트</strong><img alt="퍼즐 원본 그림" src="'+escapeHtml(img)+'"></div>':'')+'</div>'+
 '</div></div>'+
 (coopFeedback?'<div class="coop-feedback'+(stat.finished?' coop-feedback-success':'')+'" role="status">'+escapeHtml(coopFeedback)+'</div>':'')+
 (stat.finished?'<div class="coop-celebrate" role="status"><span>🎊🌈🏆</span><h3>우리 반 협동 퍼즐 완성!</h3>'+
 '<p>친구들의 생각과 힘을 모아 '+stat.total+'조각의 그림을 완성했어요!</p></div>':'')+
 '</section>';
}
function coopControls(){
 const s=coopState();
 return '<section class="coop-control-panel">'+
 '<div class="coop-section-head"><strong>🤝 우리 반 협동 기록</strong><span>모둠별로 맞힌 조각 수</span></div>'+
 '<div class="coop-teams coop-teams-'+s.teamCount+'">'+Array.from({length:s.teamCount},(_,i)=>
 '<div class="coop-team'+(s.team===i?' coop-team-current':'')+'"><strong>'+escapeHtml(coopTeamLabel(s,i))+
 '</strong><span>⭐ '+s.teamScores[i]+'개</span></div>').join('')+'</div>'+
 '<div class="coop-buttons">'+
 '<button type="button" class="btn btn-primary" id="coopNextTeam">'+(s.teamCount===1?'🤝 다음 친구 차례':'🤝 다음 모둠 차례')+'</button>'+
 '<button type="button" class="btn btn-outline" id="coopUndo" '+(!s.moves.length?'disabled':'')+'>↩ 직전 조각 되돌리기</button>'+
 '<button type="button" class="btn btn-outline" id="coopHint">🔎 '+(s.hint?'원본 가리기':'원본 그림 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="coopShuffle">🎲 새로 섞기</button>'+
 '<button type="button" class="btn btn-outline" id="coopRestart">🔄 다시 시작</button>'+
 '<button type="button" class="btn btn-outline" id="coopFull">'+(coopFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 (!coopFull?'<button type="button" class="btn btn-outline" id="coopEdit">'+(coopEditorOpen?'✕ 편집 닫기':'⚙️ 그림·난이도 편집')+'</button>':'')+
 '</div></section>';
}
function coopEditor(){
 const s=coopState();
 return '<section class="panel coop-editor"><h2>👩‍🏫 협동 퍼즐 준비하기</h2>'+
 '<p>그림과 조각 수를 선택하고 학생들이 돌아가며 그림을 완성하게 해 주세요. 학급별 설정·진행 상황은 기존 백업에 포함됩니다.</p>'+
 '<div class="coop-editor-grid"><label>활동 이름<input id="coopTitleInput" class="field" maxlength="75" value="'+escapeHtml(s.title)+'"></label>'+
 '<label>그림 선택<select id="coopThemeInput" class="field">'+COOP_THEMES.map(t=>'<option value="'+t.id+'" '+(s.theme===t.id?'selected':'')+'>'+escapeHtml(t.label)+'</option>').join('')+
 (s.customImage?'<option value="custom" '+(s.theme==='custom'?'selected':'')+'>🖼️ 우리 반 등록 사진</option>':'')+'</select></label>'+
 '<label>조각 수·난이도<select id="coopSizeInput" class="field">'+[3,4,5].map(n=>'<option value="'+n+'" '+(s.size===n?'selected':'')+'>'+n+'×'+n+' ('+(n*n)+'조각)</option>').join('')+'</select></label>'+
 '<label>함께할 모둠<select id="coopTeamCountInput" class="field">'+[1,2,3,4].map(n=>'<option value="'+n+'" '+(s.teamCount===n?'selected':'')+'>'+(n===1?'우리 반 전체':'모둠 '+n+'개')+'</option>').join('')+'</select></label></div>'+
 '<div class="coop-editor-teamnames">'+Array.from({length:4},(_,i)=>
 '<label>'+(i+1)+'모둠 이름<input id="coopTeamName'+i+'" class="field" maxlength="22" value="'+escapeHtml(s.teamNames[i])+'"></label>').join('')+'</div>'+
 '<div class="coop-editor-upload"><label>🖼️ 내 그림으로 만들기 (선택)<input type="file" id="coopFileInput" class="field" accept="image/jpeg,image/png,image/webp"></label>'+
 '<p>JPG·PNG·WEBP 파일(4MB 이하)을 선택하면 정사각형으로 잘라 작은 JPEG로 저장해요. 사진의 개인 정보와 저작권을 확인해 주세요.</p></div>'+
 '<div class="coop-editor-actions"><button type="button" class="btn btn-primary" id="coopSave">💾 설정 저장</button>'+
 '<button type="button" class="btn btn-outline" id="coopSound">'+(s.sound?'🔊 효과음 켜짐':'🔇 효과음 꺼짐')+'</button></div></section>';
}
function coopAfterRender(){
 const root=document.getElementById('content');
 if(!root||root.dataset.coopDragReady==='1')return;
 root.dataset.coopDragReady='1';
 root.addEventListener('dragstart',e=>{
  if(currentView!=='coop')return;
  const tile=e.target.closest('[data-coop-piece]');
  if(!tile||!e.dataTransfer)return;
  const id=Number(tile.dataset.coopPiece),s=coopState();
  if(s.slots.includes(id)){e.preventDefault();return;}
  e.dataTransfer.setData('text/plain','coop:'+id);e.dataTransfer.effectAllowed='move';
 });
 root.addEventListener('dragover',e=>{
  if(currentView!=='coop')return;
  const slot=e.target.closest('[data-coop-slot]');
  if(!slot||slot.classList.contains('coop-slot-filled'))return;
  e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';
 });
 root.addEventListener('drop',e=>{
  if(currentView!=='coop')return;
  const slot=e.target.closest('[data-coop-slot]');
  if(!slot)return;
  e.preventDefault();
  const raw=e.dataTransfer?.getData('text/plain')||'';
  if(!/^coop:\d{1,2}$/.test(raw))return;
  coopPlace(Number(slot.dataset.coopSlot),Number(raw.slice(5)));
 });
}
function renderCoop(){
 return (coopFull?'<div class="coop-full-head"><strong>🧩 우리 반 협동 퍼즐</strong><button class="btn btn-outline btn-small" id="coopFull" type="button">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','우리 반 협동 퍼즐','친구들과 한 조각씩 맞추며 하나의 그림을 완성하는 전자칠판 협동 놀이입니다.','🧩'))+
 '<div class="coop-layout">'+coopBoard()+coopControls()+
 (!coopFull&&coopEditorOpen?coopEditor():'')+
 (!coopFull?'<p class="coop-privacy">🔒 학생 개별 접속 없이 교사 PC 한 대에서 사용합니다. 사진·퍼즐 진행 기록은 현재 학급의 브라우저에 저장돼요.</p>':'')+
 '</div>';
}
