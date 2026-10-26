/* 선택 룰렛 v1.20 — 한 기기·한 학급의 로컬 추첨; 외부 연동 없음 */
'use strict';
const rouletteColors=['#FFE28F','#A7E4E0','#FBBAD0','#C7B9FA','#B5DF9F','#FFC19B','#AFCBF7','#EED0F5','#FDDBAB','#9CDCD1','#F6B5A5','#BED6FF'];
const rouletteTAU=Math.PI*2;
let rouletteSpinning=false,rouletteSpinTimer=null,rouletteSpinRAF=null,rouletteRoundIds=[],rouletteWinnerId=null,rouletteTargetAngle=0,rouletteSpinSerial=0;
function makeDefaultRoulette(){return {excludePicked:true,picked:[],lastId:null,lastPool:[],lastAngle:0,history:[]};}
function normalizeRoulette(raw,valid){
 const x=raw&&typeof raw==='object'?raw:{},seen=new Set();
 const picked=Array.isArray(x.picked)?x.picked.filter(id=>typeof id==='string'&&valid.has(id)&&!seen.has(id)&&seen.add(id)).slice(0,1000):[];
 const lastId=typeof x.lastId==='string'&&valid.has(x.lastId)?x.lastId:null;
 const lastPool=Array.isArray(x.lastPool)?[...new Set(x.lastPool.filter(id=>typeof id==='string'&&valid.has(id)))].slice(0,1000):[];
 const lastAngle=Number.isFinite(Number(x.lastAngle))?((Number(x.lastAngle)%rouletteTAU)+rouletteTAU)%rouletteTAU:0;
 const history=Array.isArray(x.history)?x.history.filter(h=>h&&typeof h.id==='string'&&valid.has(h.id)).slice(-50).map(h=>({id:h.id,at:typeof h.at==='string'?h.at.slice(0,40):''})):[];
 return {excludePicked:x.excludePicked!==false,picked,lastId,lastPool,lastAngle,history};
}
function rouletteState(){const c=activeClass();return c.roulette||(c.roulette=makeDefaultRoulette());}
function rouletteEligible(){
 const r=rouletteState(),ss=participants();
 return r.excludePicked?ss.filter(s=>!r.picked.includes(s.id)):ss;
}
function rouletteVisibleIds(){
 if(rouletteSpinning)return rouletteRoundIds;
 const r=rouletteState(),available=new Set(participants().map(s=>s.id));
 if(r.lastId&&r.lastPool.includes(r.lastId)&&r.lastPool.length&&r.lastPool.every(id=>available.has(id)))return r.lastPool;
 return rouletteEligible().map(s=>s.id);
}
function rouletteCancel(){
 rouletteSpinSerial++;rouletteSpinning=false;rouletteRoundIds=[];rouletteWinnerId=null;
 if(rouletteSpinTimer!==null){clearTimeout(rouletteSpinTimer);rouletteSpinTimer=null;}
 if(rouletteSpinRAF!==null){cancelAnimationFrame(rouletteSpinRAF);rouletteSpinRAF=null;}
}
function roulettePick(){
 if(rouletteSpinning)return;
 const pool=rouletteEligible();
 if(!pool.length)return toast(participants().length?'모든 학생을 뽑았습니다. 다시 전체 시작을 눌러주세요.':'먼저 학급 명단에 학생을 추가해 주세요.');
 const r=rouletteState(),ids=pool.map(s=>s.id);
 rouletteCancel();rouletteSpinning=true;rouletteRoundIds=ids;
 const chosenIndex=randomInt(ids.length);
 rouletteWinnerId=ids[chosenIndex];
 // Each sector center starts at 12 o'clock. Find the exact angle that puts the chosen sector under the fixed top pointer.
 const sector=rouletteTAU/ids.length;
 const angle=(((-chosenIndex*sector)%rouletteTAU)+rouletteTAU)%rouletteTAU;
 const prior=r.lastId&&r.lastPool.length===ids.length&&r.lastPool.every((id,i)=>id===ids[i])?r.lastAngle:0;
 const delta=((angle-prior+rouletteTAU)%rouletteTAU)+rouletteTAU*(5+randomInt(3));
 rouletteTargetAngle=prior+delta;
 soundUnlock();
 render();
 const serial=rouletteSpinSerial,spinner=document.getElementById('rouletteSpinner');
 if(spinner){
  spinner.style.transition='none';spinner.style.transform='rotate('+prior+'rad)';
  rouletteSpinRAF=requestAnimationFrame(()=>{rouletteSpinRAF=requestAnimationFrame(()=>{
   if(!rouletteSpinning||serial!==rouletteSpinSerial||currentView!=='roulette')return;
   const node=document.getElementById('rouletteSpinner');if(!node)return;
   node.style.transition='transform 5300ms cubic-bezier(.13,.76,.14,1)';
   node.style.transform='rotate('+rouletteTargetAngle+'rad)';
   rouletteSpinRAF=null;
  });});
 }
 rouletteSpinTimer=setTimeout(()=>rouletteFinish(serial),5450);
}
function rouletteFinish(serial){
 if(!rouletteSpinning||serial!==rouletteSpinSerial)return;
 const r=rouletteState(),winner=rouletteWinnerId;
 rouletteSpinTimer=null;rouletteSpinning=false;
 r.lastId=winner;r.lastPool=[...rouletteRoundIds];
 r.lastAngle=((rouletteTargetAngle%rouletteTAU)+rouletteTAU)%rouletteTAU;
 if(!r.picked.includes(winner))r.picked.push(winner);
 r.history.push({id:winner,at:dateString()});r.history=r.history.slice(-50);
 rouletteRoundIds=[];rouletteWinnerId=null;
 history('선택 룰렛',nameOf(winner)+' 선택');
 save();beep();render();toast('🎉 '+nameOf(winner)+' 학생이 선택되었습니다!');
}
function rouletteReset(){
 if(rouletteSpinning)return;
 const r=rouletteState();
 if(!r.picked.length&&!r.lastId)return;
 if(!confirm('뽑힌 학생 목록을 초기화하고 전체 학생으로 다시 시작할까요? 지난 추첨 이력은 유지됩니다.'))return;
 r.picked=[];r.lastId=null;r.lastPool=[];r.lastAngle=0;save();render();
}
function rouletteToggleExclude(exclude){
 if(rouletteSpinning)return;
 const r=rouletteState();r.excludePicked=!!exclude;
 r.lastId=null;r.lastPool=[];r.lastAngle=0;
 save();render();
}
function rouletteCopy(){
 const r=rouletteState();
 if(!r.history.length)return toast('복사할 추첨 기록이 없습니다.');
 copyText(activeClass().name+' 선택 룰렛 추첨 기록\n'+r.history.map((h,i)=>(i+1)+'. '+nameOf(h.id)+' ('+h.at+')').join('\n'));
}
function rouletteDraw(canvas,ids){
 if(!canvas||!canvas.getContext)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const size=1000,c=size/2,radius=481,n=ids.length;
 canvas.width=size;canvas.height=size;
 ctx.clearRect(0,0,size,size);
 if(!n){
  ctx.beginPath();ctx.arc(c,c,radius,0,rouletteTAU);ctx.fillStyle='#e8edf8';ctx.fill();
  ctx.fillStyle='#647995';ctx.textAlign='center';ctx.font='bold 46px sans-serif';ctx.fillText('학생을 등록해 주세요',c,c+14);
  return;
 }
 const arc=rouletteTAU/n,start=-Math.PI/2-arc/2;
 for(let i=0;i<n;i++){
  const a=start+i*arc,b=a+arc;
  ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,radius,a,b);ctx.closePath();
  ctx.fillStyle=rouletteColors[i%rouletteColors.length];ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=n>25?3:5;ctx.stroke();
  const middle=-Math.PI/2+i*arc,labelDistance=n===1?radius*.56:n>20?radius*.66:radius*.63;
  ctx.save();ctx.translate(c+Math.cos(middle)*labelDistance,c+Math.sin(middle)*labelDistance);
  let theta=middle+Math.PI/2;
  const wrapped=((theta%rouletteTAU)+rouletteTAU)%rouletteTAU;
  if(wrapped>Math.PI/2&&wrapped<Math.PI*1.5)theta+=Math.PI;
  ctx.rotate(theta);
  const name=String(nameOf(ids[i]));
  const font=n>=29?22:n>=20?25:n>=14?28:n>=9?32:40;
  ctx.font='900 '+font+'px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#30445f';
  let label=name;
  // Limit names to the width of a sector at their label radius.
  const width=n===1?radius*1.25:Math.max(58,Math.min(radius*.82,labelDistance*arc*.93));
  while(label.length>1&&ctx.measureText(label).width>width)label=label.slice(0,-1);
  if(label!==name)label=label.slice(0,Math.max(1,label.length-1))+'…';
  ctx.fillText(label,0,0);
  ctx.restore();
 }
 ctx.beginPath();ctx.arc(c,c,radius,0,rouletteTAU);
 ctx.lineWidth=18;ctx.strokeStyle='#fff';ctx.stroke();
 ctx.beginPath();ctx.arc(c,c,68,0,rouletteTAU);
 ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=9;ctx.strokeStyle='#7180b6';ctx.stroke();
 ctx.fillStyle='#6072af';ctx.font='900 32px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('GO!',c,c+2);
}
function rouletteAfterRender(){
 const canvas=document.getElementById('rouletteCanvas');
 if(!canvas)return;
 rouletteDraw(canvas,rouletteVisibleIds());
 const spinner=document.getElementById('rouletteSpinner');
 const r=rouletteState();
 if(spinner){spinner.style.transition='none';spinner.style.transform='rotate('+(r.lastId&&r.lastPool.length?r.lastAngle:0)+'rad)';}
}
function renderRoulette(){
 const ss=participants(),r=rouletteState(),available=rouletteEligible(),left=available.length;
 const last=r.lastId&&ss.some(s=>s.id===r.lastId)?nameOf(r.lastId):'';
 const pool=rouletteVisibleIds(),poolCount=pool.length;
 const notice=r.excludePicked&&!left&&ss.length?'모든 학생이 한 번씩 선택됐습니다. 다시 전체 시작을 눌러주세요.':!ss.length?'먼저 학급 명단에 학생을 추가하세요.':'화살표가 가리키는 학생이 선택됩니다.';
 const tags=ss.map(s=>'<span class="roulette-chip '+(r.picked.includes(s.id)?'roulette-picked':'')+' '+(s.id===r.lastId?'roulette-most-recent':'')+'">'+escapeHtml(s.name)+'</span>').join('');
 const historyHtml=r.history.length?'<ol class="roulette-history">'+r.history.slice(-12).reverse().map(h=>'<li><strong>'+escapeHtml(nameOf(h.id))+'</strong><small>'+escapeHtml(h.at)+'</small></li>').join('')+'</ol>':'<p class="roulette-hint">첫 번째 추첨을 기다리고 있어요.</p>';
 return title('학생 참여','선택 룰렛','학급 학생 이름이 적힌 룰렛판을 돌려 화살표가 가리키는 학생 한 명을 선택합니다.','🎡')+
 '<section class="roulette-layout"><div class="roulette-stage panel"><div class="roulette-stage-header"><strong>🎯 행운의 선택 룰렛</strong><span>참여 '+ss.length+'명 · '+(r.excludePicked?'남은 학생 '+left+'명':'중복 선택 가능')+'</span></div>'+
 '<div class="roulette-figure"><div class="roulette-pointer" aria-hidden="true"><span>▼</span></div><div class="roulette-disc" id="rouletteSpinner"><canvas id="rouletteCanvas" width="1000" height="1000" aria-label="'+poolCount+'명의 학생이 들어 있는 선택 룰렛">룰렛판 표시를 지원하지 않는 브라우저입니다.</canvas></div></div>'+
 '<div class="roulette-selection" aria-live="polite">'+(rouletteSpinning?'<span class="roulette-wait">🌪️ 빙글빙글… 누구일까요?</span>':last?'<span class="roulette-label">🎉 선택된 학생</span><strong>'+escapeHtml(last)+'</strong>':'<span class="roulette-wait">'+escapeHtml(notice)+'</span>')+'</div>'+
 '<div class="roulette-buttons"><button id="rouletteSpin" type="button" class="btn btn-primary btn-large" '+(rouletteSpinning||!left?'disabled':'')+'>'+(rouletteSpinning?'🎡 룰렛이 돌아가는 중…':left?'▶ 룰렛 돌리기':'✅ 모두 선택 완료')+'</button><button id="rouletteReset" type="button" class="btn btn-outline" '+(rouletteSpinning||(!r.picked.length&&!r.lastId)?'disabled':'')+'>↺ 다시 전체 시작</button></div>'+
 '<p class="roulette-footnote">※ 당첨자는 무작위로 결정되며, 위쪽 화살표가 멈춘 위치와 결과가 일치합니다. 학생 명단은 현재 기기에만 저장됩니다.</p></div>'+
 '<aside class="roulette-info"><section class="panel roulette-options"><h2>⚙️ 추첨 설정</h2><label class="roulette-check"><input type="checkbox" id="rouletteExclude" '+(r.excludePicked?'checked':'')+' '+(rouletteSpinning?'disabled':'')+'/>'+
 '<span><strong>뽑힌 학생은 다음 룰렛에서 제외</strong><small>모든 학생이 한 번씩 선택되도록 진행</small></span></label><p class="roulette-hint">선택 해제 시 동일 학생이 여러 번 나올 수 있습니다.</p>'+
 '<div class="roulette-stat-row"><div><small>전체 학생</small><strong>'+ss.length+'</strong></div><div><small>선택한 학생</small><strong>'+r.picked.filter(id=>ss.some(s=>s.id===id)).length+'</strong></div><div><small>남은 학생</small><strong>'+left+'</strong></div></div></section>'+
 '<section class="panel roulette-names"><h2>👧 👦 참여 학생 목록</h2><div class="roulette-chips">'+(tags||'<span class="roulette-hint">등록한 학생이 없습니다.</span>')+'</div></section>'+
 '<section class="panel roulette-past"><div class="roulette-past-head"><h2>📋 최근 추첨 결과</h2><button id="rouletteCopy" type="button" class="btn btn-outline btn-small" '+(!r.history.length?'disabled':'')+'>결과 복사</button></div>'+historyHtml+'</section></aside></section>';
}
