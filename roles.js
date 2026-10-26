/* v1.19 모둠 역할 배정 — 학급별 브라우저 저장, 외부 통신 없음 */
'use strict';
let rolesFullscreen=false,rolesSwapFirst=null;
const builtinGroupRoles=[
 {id:'leader',name:'👑 모둠장'},
 {id:'presenter',name:'🎤 발표자'},
 {id:'recorder',name:'✏️ 기록자'},
 {id:'timekeeper',name:'⏱️ 시간지킴이'},
 {id:'materials',name:'📦 자료담당'}
];
function makeDefaultGroupRoles(){return {roles:builtinGroupRoles.map(r=>({...r})),mode:'rotate',shortage:'omit',signature:'',entries:[],history:[]};}
function normalizeGroupRoles(raw,valid){
 const x=raw&&typeof raw==='object'?raw:{},def=makeDefaultGroupRoles(),used=new Set();
 const roles=Array.isArray(x.roles)?x.roles.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string').slice(0,10).map(r=>({id:r.id.slice(0,100),name:r.name.trim().slice(0,24)})).filter(r=>r.id&&r.name&&!used.has(r.id)&&used.add(r.id)):def.roles;
 const roleIds=new Set(roles.map(r=>r.id));
 const parseEntry=e=>e&&typeof e.id==='string'&&valid.has(e.id)?{id:e.id,roles:Array.isArray(e.roles)?[...new Set(e.roles.filter(id=>roleIds.has(id)))].slice(0,10):[],locked:e.locked===true}:null;
 const found=new Set(),entries=Array.isArray(x.entries)?x.entries.map(parseEntry).filter(e=>e&&!found.has(e.id)&&found.add(e.id)).slice(0,1000):[];
 const history=Array.isArray(x.history)?x.history.slice(-25).map(h=>({
  at:typeof h?.at==='string'?h.at.slice(0,40):'',
  entries:Array.isArray(h?.entries)?h.entries.slice(0,1000).map(parseEntry).filter(Boolean).map(e=>({id:e.id,roles:e.roles})):[]
 })):[];
 return {roles:roles.length?roles:def.roles,mode:x.mode==='random'?'random':'rotate',shortage:x.shortage==='share'?'share':'omit',signature:typeof x.signature==='string'?x.signature.slice(0,30000):'',entries,history};
}
function groupRolesState(){const c=activeClass();return c.groupRoles||(c.groupRoles=makeDefaultGroupRoles());}
function roleGroups(){
 const active=new Set(participants().map(s=>s.id));
 return activeClass().groups.map(g=>g.filter(id=>active.has(id)));
}
function roleSignature(groups=roleGroups()){return JSON.stringify(groups);}
function roleHasResults(){const r=groupRolesState();return r.entries.length>0&&r.signature===roleSignature();}
function roleLabel(id){return groupRolesState().roles.find(r=>r.id===id)?.name||'지정되지 않음';}
function roleResultsLines(){
 const groups=roleGroups(),r=groupRolesState(),map=new Map(r.entries.map(e=>[e.id,e]));
 return groups.flatMap((g,i)=>[(i+1)+'모둠',...g.map(id=>'  '+nameOf(id)+' : '+((map.get(id)?.roles||[]).map(roleLabel).join(' · ')||'미배정')),'']);
}
function roleHistorySync(){
 const r=groupRolesState();
 if(!r.history.length)return;
 const prev=r.history[r.history.length-1];prev.entries=r.entries.map(e=>({id:e.id,roles:[...e.roles]}));
}
function roleScore(id,roleId,groupCounts){
 const r=groupRolesState();
 if(r.mode==='random')return (groupCounts.get(roleId)||0)*3+Math.random();
 let total=0,last=false;
 for(let i=0;i<r.history.length;i++){
  const past=r.history[i].entries.find(x=>x.id===id);
  if(past?.roles.includes(roleId)){total++;if(i===r.history.length-1)last=true;}
 }
 return (last?95:0)+total*12+(groupCounts.get(roleId)||0)*5+Math.random()*0.5;
}
function roleAssign(){
 const groups=roleGroups(),r=groupRolesState();
 if(!groups.length||!groups.some(g=>g.length))return toast('모둠 편성을 먼저 해주세요.');
 if(!r.roles.length)return toast('역할을 하나 이상 등록해 주세요.');
 const signature=roleSignature(groups),same=r.signature===signature;
 if(r.entries.length&&!same&&!confirm('모둠 구성이 변경되었습니다. 기존 역할 배정은 초기화하고 새 모둠으로 배정할까요? 기존 이력은 유지됩니다.'))return;
 const current=new Map((same?r.entries:[]).map(e=>[e.id,e]));
 const assigned=[];
 for(const members of groups){
  const roles=r.roles.map(x=>x.id),counts=new Map(roles.map(id=>[id,0]));
  const byPerson=new Map();
  for(const id of members){
   const e=current.get(id);
   if(e?.locked){
    const fixed=[...new Set(e.roles.filter(role=>roles.includes(role)))];
    if(fixed.length){byPerson.set(id,{id,roles:fixed,locked:true});fixed.forEach(role=>counts.set(role,(counts.get(role)||0)+1));}
   }
  }
  for(const id of shuffled(members.filter(id=>!byPerson.has(id)))){
   const unused=roles.filter(role=>(counts.get(role)||0)===0);
   const choices=unused.length?unused:roles;
   const chosen=choices.reduce((best,role)=>{const score=roleScore(id,role,counts);return score<best.score?{id:role,score}:best;},{id:choices[0],score:Infinity}).id;
   byPerson.set(id,{id,roles:[chosen],locked:false});
   counts.set(chosen,(counts.get(chosen)||0)+1);
  }
  if(r.shortage==='share'&&roles.length>members.length){
   const uncovered=roles.filter(role=>(counts.get(role)||0)===0);
   for(const role of uncovered){
    const candidates=members.map(id=>byPerson.get(id)).filter(e=>e&&!e.locked&&!e.roles.includes(role));
    if(!candidates.length)continue;
    candidates.sort((a,b)=>a.roles.length-b.roles.length||roleScore(a.id,role,counts)-roleScore(b.id,role,counts));
    candidates[0].roles.push(role);counts.set(role,(counts.get(role)||0)+1);
   }
  }
  for(const id of members)if(byPerson.has(id))assigned.push(byPerson.get(id));
 }
 r.signature=signature;r.entries=assigned;r.history.push({at:dateString(),entries:assigned.map(e=>({id:e.id,roles:[...e.roles]}))});r.history=r.history.slice(-25);
 rolesSwapFirst=null;history('모둠 역할',r.mode==='rotate'?'이전 역할 고려 순환 배정':'무작위 역할 배정');save();render();toast('✅ '+groups.filter(g=>g.length).length+'개 모둠 역할을 배정했습니다.');
}
function roleManualChange(id,roleId){
 const r=groupRolesState(),e=r.entries.find(x=>x.id===id);
 if(!roleHasResults()||!e||!r.roles.some(x=>x.id===roleId))return;
 e.roles=[roleId,...e.roles.filter(v=>v!==roleId)];roleHistorySync();save();render();
}
function roleLock(id){
 const e=groupRolesState().entries.find(x=>x.id===id);
 if(!roleHasResults()||!e)return;e.locked=!e.locked;rolesSwapFirst=null;save();render();
}
function roleSwap(id){
 const r=groupRolesState(),e=r.entries.find(x=>x.id===id);
 if(!roleHasResults()||!e)return;
 if(e.locked)return toast('고정된 학생입니다. 자물쇠를 해제한 후 역할을 교환하세요.');
 if(!rolesSwapFirst){rolesSwapFirst=id;render();toast('역할을 맞바꿀 다른 학생의 교환 버튼을 눌러주세요.');return;}
 if(rolesSwapFirst===id){rolesSwapFirst=null;render();return;}
 const first=r.entries.find(x=>x.id===rolesSwapFirst);
 if(!first||first.locked){rolesSwapFirst=null;render();return toast('고정된 학생과 역할을 교환할 수 없습니다.');}
 [first.roles,e.roles]=[e.roles,first.roles];rolesSwapFirst=null;roleHistorySync();save();render();toast('역할을 서로 바꿨습니다.');
}
function roleSetName(id,name){
 const r=groupRolesState(),target=r.roles.find(x=>x.id===id),v=String(name||'').trim().slice(0,24);
 if(!target)return;
 if(!v)return toast('역할 이름을 입력해 주세요.');
 if(r.roles.some(x=>x.id!==id&&x.name===v))return toast('동일한 역할 이름이 있습니다.');
 target.name=v;save();render();
}
function roleAdd(){
 const r=groupRolesState();if(r.roles.length>=10)return toast('역할은 최대 10개까지 추가할 수 있습니다.');
 r.roles.push({id:safeId(),name:'새 역할 '+(r.roles.length+1)});save();render();
}
function roleRemove(id){
 const r=groupRolesState();if(r.roles.length<=1)return toast('역할은 최소 1개가 필요합니다.');
 if(r.entries.some(e=>e.roles.includes(id))&&!confirm('이 역할이 배정된 학생이 있습니다. 해당 역할을 제외할까요?'))return;
 r.roles=r.roles.filter(x=>x.id!==id);
 r.entries.forEach(e=>e.roles=e.roles.filter(x=>x!==id));
 roleHistorySync();save();render();
}
function roleSetOption(key,value){
 if(!['mode','shortage'].includes(key))return;
 const r=groupRolesState();
 if(key==='mode'&&['random','rotate'].includes(value))r.mode=value;
 else if(key==='shortage'&&['omit','share'].includes(value))r.shortage=value;
 save();render();
}
function roleReset(){
 const r=groupRolesState();if(!r.entries.length)return;
 if(!confirm('현재 모둠의 역할 배정 결과를 지울까요? 역할 설정과 이전 역할 이력은 유지됩니다.'))return;
 r.entries=[];r.signature='';rolesSwapFirst=null;save();render();
}
function roleToggleFull(){
 if(!roleHasResults())return toast('먼저 역할을 배정해 주세요.');
 rolesFullscreen=!rolesFullscreen;document.body.classList.toggle('roles-fullscreen',rolesFullscreen);render();window.scrollTo({top:0,behavior:'instant'});
}
function roleExitFull(){rolesFullscreen=false;rolesSwapFirst=null;document.body.classList.remove('roles-fullscreen');}
function roleCopy(){if(!roleHasResults())return toast('역할을 배정한 뒤 복사해 주세요.');copyText(activeClass().name+' 모둠 역할 배정\n'+roleResultsLines().join('\n'));}
function rolePrint(){if(!roleHasResults())return toast('역할을 배정한 뒤 인쇄해 주세요.');printList(activeClass().name+' 모둠 역할 배정',roleResultsLines());}
function roleExport(){
 if(!roleHasResults())return toast('역할을 배정한 뒤 내보내기 해주세요.');
 const r=groupRolesState(),map=new Map(r.entries.map(e=>[e.id,e])),rows=[['모둠','학생','배정된 역할','역할 고정']];
 roleGroups().forEach((members,i)=>members.forEach(id=>{const e=map.get(id);rows.push([i+1,nameOf(id),(e?.roles||[]).map(roleLabel).join(' / '),e?.locked?'고정':'']);}));
 download(safeFilename(activeClass().name)+'_모둠역할배정.csv',csv(rows),'text/csv;charset=utf-8');
}
function renderRoleCards(full=false){
 const groups=roleGroups(),r=groupRolesState(),map=new Map(r.entries.map(e=>[e.id,e])),validRoles=r.roles.map(v=>v.id);
 return '<div class="role-cards">'+groups.map((members,i)=>'<section class="role-card"><header><h3>🧩 '+(i+1)+'모둠</h3><span>'+members.length+'명</span></header><div class="role-people">'+members.map(id=>{
  const e=map.get(id),names=(e?.roles||[]).map(roleLabel).join(' · '),chosen=e?.roles?.[0]||'';
  const opts=r.roles.map(v=>'<option value="'+escapeHtml(v.id)+'" '+(v.id===chosen?'selected':'')+'>'+escapeHtml(v.name)+'</option>').join('');
  return '<div class="role-person '+(rolesSwapFirst===id?'swap-active':'')+'"><div class="role-person-main"><strong>'+escapeHtml(nameOf(id))+'</strong><span>'+escapeHtml(names||'역할 미배정')+'</span></div>'+
  (full?'':'<div class="role-person-tools"><select class="field" data-role-person="'+escapeHtml(id)+'" aria-label="'+escapeHtml(nameOf(id))+' 역할 지정">'+opts+'</select><button type="button" class="role-icon-btn" data-role-lock="'+escapeHtml(id)+'" aria-label="'+escapeHtml(nameOf(id))+' 역할 '+(e?.locked?'고정 해제':'고정')+'" title="다음 자동 배정에서도 이 역할 유지">'+(e?.locked?'🔒':'🔓')+'</button><button type="button" class="role-icon-btn" data-role-swap="'+escapeHtml(id)+'" '+(e?.locked?'disabled':'')+' title="다른 학생과 역할 교환">↔</button></div>')+'</div>';
 }).join('')+'</div></section>').join('')+'</div>';
}

function roleHistoryPanel(){
 const r=groupRolesState();
 if(!r.history.length)return '';
 const recent=r.history.slice(-5).reverse();
 return '<details class="role-history"><summary>📚 지난 역할 배정 이력 · 최근 '+recent.length+'회 보기</summary><div class="role-history-records">'+recent.map((h,i)=>
  '<section><h3>'+escapeHtml(h.at||'날짜 미상')+(i===0?' · 최근 배정':'')+'</h3><p>'+h.entries.map(e=>escapeHtml(nameOf(e.id))+' — '+escapeHtml(e.roles.map(roleLabel).join(' · ')||'미배정')).join('<span class="role-history-divider"> / </span>')+'</p></section>').join('')+'</div></details>';
}

function renderGroupRoles(){
 const c=activeClass(),groups=roleGroups(),r=groupRolesState(),any=groups.some(g=>g.length),matching=roleHasResults();
 if(rolesFullscreen){
  return '<div class="role-full-head"><strong>🎭 '+escapeHtml(c.name)+' 모둠 역할</strong><button type="button" id="roleFullBtn" class="btn btn-outline btn-small">✕ 관리 화면으로</button></div>'+
  '<div class="role-full-stage">'+renderRoleCards(true)+'</div>';
 }
 const heading=title('모둠·학급 운영','모둠 역할 배정','모둠 편성과 연결해 역할을 자동 배정하고, 역할을 바꾸거나 다음 수업에 순환합니다.','🎭');
 if(!any)return heading+'<section class="panel role-empty"><span>🧩</span><h2>먼저 모둠을 편성해 주세요</h2><p>기존 「모둠 편성」에서 만든 모둠을 그대로 가져옵니다.</p><button type="button" data-view="groups" class="btn btn-primary">모둠 편성으로 이동 →</button></section>';
 const options='<section class="panel role-config"><div class="role-config-head"><h2>① 역할 이름 설정</h2><span>원하는 역할로 이름을 바꾸거나 추가·삭제할 수 있습니다.</span></div><div class="role-definitions">'+r.roles.map((role,i)=>
  '<label class="role-definition"><span>'+(i+1)+'</span><input class="field" maxlength="24" data-role-name="'+escapeHtml(role.id)+'" value="'+escapeHtml(role.name)+'" aria-label="'+(i+1)+'번 역할 이름"><button type="button" class="role-icon-btn" data-role-remove="'+escapeHtml(role.id)+'" '+(r.roles.length<=1?'disabled':'')+' title="역할 삭제">✕</button></label>').join('')+
  '</div><button type="button" id="roleAdd" class="btn btn-outline btn-small" '+(r.roles.length>=10?'disabled':'')+'>＋ 역할 추가 (최대 10개)</button></section>';
 const setup='<section class="panel role-config"><div class="role-config-head"><h2>② 역할 배정 방식</h2><span>'+groups.filter(g=>g.length).length+'개 모둠 · '+groups.reduce((n,g)=>n+g.length,0)+'명</span></div>'+
  '<div class="role-selects"><label>배정 방식 <select id="roleMode" class="field"><option value="rotate" '+(r.mode==='rotate'?'selected':'')+'>이전 역할 고려·순환 (추천)</option><option value="random" '+(r.mode==='random'?'selected':'')+'>완전 무작위 배정</option></select></label>'+
  '<label>역할이 학생보다 많을 때 <select id="roleShortage" class="field"><option value="omit" '+(r.shortage==='omit'?'selected':'')+'>남는 역할은 제외</option><option value="share" '+(r.shortage==='share'?'selected':'')+'>한 학생이 두 역할 이상 겸임</option></select></label></div>'+
  '<p class="role-explain">학생이 역할보다 많으면 일부 역할을 공동으로 맡습니다. 🔒 고정한 학생은 다음 자동 배정에도 현재 역할을 유지합니다.</p>'+
  '<div class="role-main-actions"><button type="button" id="roleAssign" class="btn btn-primary btn-large">🎲 '+(matching?'역할 다시 배정':'모둠별 역할 자동 배정')+'</button><button type="button" data-view="groups" class="btn btn-outline">🧩 모둠 편성 확인</button></div></section>';
 const stale=r.entries.length&&!matching?'<div class="role-warning">⚠ 모둠 구성 또는 학생 명단이 변경되어 이전 배정을 표시하지 않습니다. 「역할 자동 배정」을 다시 눌러주세요. 이전 역할 이력은 유지됩니다.</div>':'';
 const results=matching?'<section class="role-results"><div class="role-results-header"><div><h2>③ 역할 확인·조정</h2><p>역할 선택, 🔓/🔒 고정, ↔ 두 학생의 역할 맞바꾸기</p></div><div class="role-results-actions"><button type="button" id="roleFullBtn" class="btn btn-secondary">⛶ 전자칠판 크게 보기</button><button type="button" id="roleCopy" class="btn btn-outline btn-small">📋 복사</button><button type="button" id="rolePrint" class="btn btn-outline btn-small">🖨 인쇄</button><button type="button" id="roleExport" class="btn btn-outline btn-small">⬇ CSV</button><button type="button" id="roleReset" class="btn btn-outline btn-small">↺ 결과 초기화</button></div></div>'+
  (rolesSwapFirst?'<div class="role-swap-guide">↔ 역할을 맞바꿀 두 번째 학생의 교환 버튼을 누르세요. 같은 학생을 누르면 취소됩니다.</div>':'')+
  renderRoleCards()+roleHistoryPanel()+'<p class="role-explain">④ 다음 수업에는 「역할 다시 배정」을 누르세요. 이전 이력을 고려해 같은 역할의 연속 배정을 줄입니다. 배정 결과와 이력은 학급별로 자동 저장됩니다.</p></section>':'<section class="panel role-empty role-small-empty"><span>🎭</span><h2>모둠별 역할을 배정해 보세요</h2><p>위에서 역할과 배정 방식을 선택한 뒤 자동 배정을 누르면 결과가 표시됩니다.</p></section>';
 return heading+'<div class="role-top-grid">'+options+setup+'</div>'+stale+results;
}
