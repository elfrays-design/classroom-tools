/* 송이의 신기한 그림자 실험실 — 교사 PC·전자칠판용 간단한 2D 광선 모델 */
'use strict';
const SHADOW_MODES={match:'🎯 그림자 맞추기',predict:'🔍 결과 예상하기',free:'🔦 자유 실험'};
const SHADOW_LEVELS={easy:'🌱 쉬움',normal:'🌟 보통',hard:'🪄 도전'};
const SHADOW_SHAPES=[
{id:'rabbit',label:'🐰 토끼',path:'M-22,-9 C-31,-26 -31,-38 -25,-45 C-18,-49 -12,-32 -8,-24 C-6,-42 4,-54 11,-45 C17,-34 5,-20 3,-13 C17,-6 23,6 18,20 C31,16 42,26 34,33 L18,34 C4,44 -21,42 -29,23 C-37,14 -35,-1 -22,-9 Z M-20,24 L-35,33 L-13,35 Z'},
{id:'tree',label:'🌲 나무',path:'M-8,21 L-8,45 L10,45 L10,21 L33,23 L21,3 L30,4 L10,-20 L20,-20 L1,-48 L-20,-20 L-9,-20 L-29,4 L-18,4 L-35,23 Z'},
{id:'dino',label:'🦖 공룡',path:'M-45,21 L-22,13 L-20,-3 L-4,-9 L4,-26 L20,-39 L38,-35 L43,-22 L31,-16 L22,-20 L25,-8 L17,7 L27,23 L23,27 L10,24 L9,43 L-3,43 L-7,19 L-21,16 L-15,42 L-29,42 L-39,12 Z'},
{id:'pencil',label:'✏️ 연필',path:'M-10,39 L-10,-31 L0,-48 L10,-31 L10,39 L0,48 Z'},
{id:'mushroom',label:'🍄 버섯',path:'M-42,0 C-36,-44 31,-49 43,0 L20,7 L14,41 Q0,50 -14,41 L-20,7 Z'},
{id:'bird',label:'🐦 새',path:'M-45,4 L-14,2 C-4,-26 18,-36 33,-22 C43,-23 48,-17 46,-13 L31,-7 C27,15 12,25 -6,21 L-25,37 L-21,18 Z'},
{id:'car',label:'🚗 자동차',path:'M-43,5 L-29,-19 L21,-19 L40,5 L46,8 L46,27 L34,27 A12,12 0 0 1 10,27 L-13,27 A12,12 0 0 1 -37,27 L-46,27 L-46,12 Z'},
{id:'umbrella',label:'☂️ 우산',path:'M-45,-5 Q-35,-48 0,-48 Q35,-48 45,-5 Q30,-17 15,-4 Q0,-17 -15,-4 Q-30,-17 -45,-5 Z M-5,-7 L5,-7 L5,29 Q5,42 16,37 L20,44 Q-7,55 -7,29 Z'},
{id:'cat',label:'🐱 고양이',path:'M-33,-9 L-35,-45 L-11,-31 L11,-31 L35,-45 L33,-9 C43,4 38,18 24,22 L20,43 L6,43 L4,21 L-4,21 L-6,43 L-20,43 L-24,22 C-38,18 -43,4 -33,-9 Z'},
{id:'castle',label:'🏰 성',path:'M-45,43 L-45,-25 L-39,-25 L-39,-41 L-22,-41 L-22,-25 L-13,-25 L-13,-9 L-7,-9 L-7,-34 L-1,-34 L-1,-47 L14,-47 L14,-34 L20,-34 L20,-9 L28,-9 L28,-25 L34,-25 L34,-41 L45,-41 L45,-25 L48,-25 L48,43 L18,43 L18,12 Q6,-9 -7,12 L-7,43 Z'}
];
const SHADOW_SHAPE_MAP=Object.fromEntries(SHADOW_SHAPES.map(x=>[x.id,x]));
let shadowFull=false,shadowInfo='';
const shadowBound=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||min));
const shadowRound=n=>Math.round(n*100)/100;
function shadowLevelShapes(level,round){
 const first=SHADOW_SHAPES[((round||1)-1)%SHADOW_SHAPES.length].id;
 const second=SHADOW_SHAPES[((round||1)+3)%SHADOW_SHAPES.length].id;
 return level==='hard'?[first,second]:[first];
}
function shadowRandomTarget(level){
 const xs=[95,125,155,185,215],ys=[41,45,50,55,59],angles=[0,45,90,135,180,225,270,315];
 return {lightX:xs[Math.floor(Math.random()*xs.length)],lightY:level==='easy'?50:ys[Math.floor(Math.random()*ys.length)],
  rotations:[level==='easy'?0:angles[Math.floor(Math.random()*angles.length)],level==='hard'?angles[Math.floor(Math.random()*angles.length)]:0]};
}
function shadowPredictionOptions(model){
 const correct={lightX:model.lightX,lightY:model.lightY,rotations:model.rotations.slice()};
 const variations=[
 {...correct,lightX:Math.min(220,correct.lightX+70)},
 {...correct,lightX:Math.max(90,correct.lightX-70)},
 {...correct,lightY:correct.lightY>=50?correct.lightY-12:correct.lightY+12},
 {...correct,rotations:[(correct.rotations[0]+90)%360,correct.rotations[1]]}
 ];
 // Ensure distinct silhouettes and one original option, including at bounds.
 const options=[correct];for(const v of variations){
  if(options.length>=4)break;
  if(JSON.stringify(v)!==JSON.stringify(correct)&&!options.some(x=>JSON.stringify(x)===JSON.stringify(v)))options.push(v);
 }
 for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 return {options,correctIndex:options.findIndex(x=>JSON.stringify(x)===JSON.stringify(correct))};
}
function shadowNewState(){
 const base={mode:'match',level:'easy',round:1,winCount:0,attempts:0,hint:false,solved:false,sound:true,
  lightX:145,lightY:50,rotations:[0,0],objects:['rabbit'],target:null,options:[],correctIndex:0,
  choice:null,revealed:false};
 return shadowGenerate(base,true);
}
function shadowGenerate(s,initial=false){
 const target=shadowRandomTarget(s.level),shapes=shadowLevelShapes(s.level,s.round);
 s.objects=shapes;s.target=target;
 s.lightX=s.mode==='predict'?target.lightX:145;
 s.lightY=s.mode==='predict'?target.lightY:50;
 s.rotations=s.mode==='predict'?target.rotations.slice():[0,0];
 s.attempts=0;s.hint=false;s.solved=false;s.choice=null;s.revealed=false;
 if(s.mode==='predict'){const made=shadowPredictionOptions(target);s.options=made.options;s.correctIndex=made.correctIndex;}
 else{s.options=[];s.correctIndex=0;}
 if(s.mode==='free'&&!initial){s.lightX=145;s.lightY=50;s.rotations=[0,0];}
 return s;
}
function makeDefaultShadow(){return shadowNewState();}
function normalizeShadow(raw){
 const d=shadowNewState(),v=raw&&typeof raw==='object'?raw:{};
 const mode=Object.hasOwn(SHADOW_MODES,v.mode)?v.mode:'match';
 const level=Object.hasOwn(SHADOW_LEVELS,v.level)?v.level:'easy';
 const round=Number.isInteger(v.round)?shadowBound(v.round,1,9999):1;
 const s={...d,mode,level,round,winCount:shadowBound(Math.floor(Number(v.winCount)||0),0,9999),sound:v.sound!==false};
 s.objects=Array.isArray(v.objects)&&v.objects.length===(level==='hard'?2:1)&&
  v.objects.every(x=>Object.hasOwn(SHADOW_SHAPE_MAP,x))?v.objects.slice():shadowLevelShapes(level,round);
 if(mode==='free'&&s.objects.length===1&&level==='hard')s.objects.push('tree');
 const validTarget=v.target&&Number.isFinite(v.target.lightX)&&Number.isFinite(v.target.lightY)&&Array.isArray(v.target.rotations);
 s.target=validTarget?{lightX:shadowBound(v.target.lightX,90,220),lightY:level==='easy'?50:shadowBound(v.target.lightY,35,65),
  rotations:[0,1].map(i=>Math.floor(shadowBound(v.target.rotations[i]??0,0,359)/45)*45)}:shadowRandomTarget(level);
 s.lightX=shadowBound(v.lightX??145,90,220);
 s.lightY=level==='easy'&&mode!=='free'?50:shadowBound(v.lightY??50,35,65);
 s.rotations=[0,1].map(i=>level==='easy'&&mode!=='free'?0:Math.floor(shadowBound(v.rotations?.[i]??0,0,359)/45)*45);
 s.attempts=shadowBound(Math.floor(Number(v.attempts)||0),0,9999);
 s.hint=v.hint===true;s.solved=v.solved===true;s.revealed=v.revealed===true;
 if(mode==='predict'){
  const choices=Array.isArray(v.options)&&v.options.length===4?v.options:null;
  s.options=choices&&choices.every(o=>o&&Number.isFinite(o.lightX)&&Number.isFinite(o.lightY)&&Array.isArray(o.rotations))?
   choices.map(o=>({lightX:shadowBound(o.lightX,90,220),lightY:shadowBound(o.lightY,35,65),
    rotations:[0,1].map(i=>Math.floor(shadowBound(o.rotations[i]??0,0,359)/45)*45)})):shadowPredictionOptions(s.target).options;
  const idx=s.options.findIndex(o=>JSON.stringify(o)===JSON.stringify(s.target));
  if(idx<0){const made=shadowPredictionOptions(s.target);s.options=made.options;s.correctIndex=made.correctIndex;}
  else s.correctIndex=idx;
  s.choice=Number.isInteger(v.choice)&&v.choice>=0&&v.choice<4?v.choice:null;
  s.revealed=s.choice!==null&&s.revealed;
  s.solved=s.revealed&&s.choice===s.correctIndex;
 }else{s.options=[];s.correctIndex=0;s.choice=null;s.revealed=false;}
 return s;
}
function shadowState(){const c=activeClass();return c.shadowLab||(c.shadowLab=makeDefaultShadow());}
function shadowProjection(lightX,lightY,objectY){
 const mx=(775-lightX)/(405-lightX);
 const ly=50+lightY*4;
 const y=ly+(objectY-ly)*mx;
 return {scale:mx,y};
}
function shadowObjectY(i,level){return level==='hard'?(i===0?215:303):250;}
function shadowShapeSvg(id,x,y,scale,rotation,fill){
 const t=SHADOW_SHAPE_MAP[id]||SHADOW_SHAPE_MAP.rabbit;
 return '<g transform="translate('+shadowRound(x)+' '+shadowRound(y)+') rotate('+shadowRound(rotation)+') scale('+shadowRound(scale)+')" fill="'+fill+'">'+
 '<path d="'+t.path+'"/></g>';
}
function shadowLightModel(s,target=false){return target?s.target:s;}
function shadowWallShapes(s,model,offset=0){
 return s.objects.map((id,i)=>{
  const proj=shadowProjection(model.lightX,model.lightY,shadowObjectY(i,s.level));
  return shadowShapeSvg(id,775+offset,proj.y,proj.scale*0.95,model.rotations?.[i]||0,'#34384c');
 }).join('');
}
function shadowSceneBody(s){
 const isPredict=s.mode==='predict',hide=isPredict&&!s.revealed;
 const y=50+s.lightY*4,x=s.lightX;
 const wall=hide?'<g><rect x="704" y="54" width="234" height="392" fill="#faf9fd" rx="18"/><text x="821" y="267" font-size="94" text-anchor="middle" fill="#beb8d5">?</text></g>':
 '<g opacity=".85">'+shadowWallShapes(s,s)+'</g>';
 const objects=s.objects.map((id,i)=>shadowShapeSvg(id,405,shadowObjectY(i,s.level),.84,s.rotations[i]||0,'#bd87a6')).join('');
 return '<defs><linearGradient id="shadowSky" x2="0" y2="1"><stop stop-color="#f5f4ff"/><stop offset="1" stop-color="#f6fbff"/></linearGradient>'+
 '<linearGradient id="shadowBeam" x2="0" y2="1"><stop stop-color="#ffeeb4" stop-opacity=".45"/><stop offset="1" stop-color="#ffecaf" stop-opacity=".08"/></linearGradient></defs>'+
 '<rect width="960" height="500" rx="22" fill="url(#shadowSky)"/>'+
 '<path d="M0 407 Q470 398 960 408 V500 H0Z" fill="#edf3ee"/>'+
 '<rect x="688" y="45" width="263" height="408" rx="21" fill="#fff" stroke="#dad9ea" stroke-width="5"/>'+
 '<rect x="699" y="55" width="241" height="388" rx="16" fill="#fbfaff"/>'+
 '<path d="M'+x+' '+(y-12)+' L710 88 L710 412 L'+x+' '+(y+12)+'Z" fill="url(#shadowBeam)" pointer-events="none"/>'+
 '<g>'+wall+'</g>'+
 '<path d="M405 150 V355" stroke="#e1c6d8" stroke-width="3" stroke-dasharray="6 8"/>'+
 objects+
 '<g data-shadow-lamp="1" class="shadow-lamp" transform="translate('+x+' '+y+')">'+
 '<rect x="-33" y="-21" width="57" height="42" rx="18" fill="#d6bdf7" stroke="#917dc3" stroke-width="5"/>'+
 '<path d="M19 -17 L44 -30 L44 30 L19 17Z" fill="#ffe2a3" stroke="#d9af60" stroke-width="4"/>'+
 '<circle cx="-11" cy="0" r="8" fill="#fff9d8"/><circle cx="48" cy="0" r="8" fill="#ffe6a7"/>'+
 '<rect x="-48" y="-39" width="115" height="80" fill="transparent" data-shadow-lamp="1"/></g>'+
 '<text x="133" y="466" text-anchor="middle" fill="#897b9e" font-size="23" font-weight="700">🔦 손전등</text>'+
 '<text x="405" y="466" text-anchor="middle" fill="#897b9e" font-size="23" font-weight="700">🧸 물체</text>'+
 '<text x="820" y="466" text-anchor="middle" fill="#897b9e" font-size="23" font-weight="700">🖼️ 그림자 벽</text>';
}
function shadowTargetThumb(s,model,label=''){
 const ps=s.objects.map((id,i)=>{
  const proj=shadowProjection(model.lightX,model.lightY,shadowObjectY(i,s.level));
  return shadowShapeSvg(id,125,125+(proj.y-250)*.68,proj.scale*.65,model.rotations[i]||0,'#35394e');
 }).join('');
 return '<svg viewBox="0 0 250 250" role="img" aria-label="'+escapeHtml(label||'그림자 실루엣')+'">'+
 '<rect x="3" y="3" width="244" height="244" rx="17" fill="#f9f8fd" stroke="#e9e5f1" stroke-width="4"/>'+ps+'</svg>';
}
function shadowMatchScore(s){
 const a=s,b=s.target;
 const projA=shadowProjection(a.lightX,a.lightY,shadowObjectY(0,s.level));
 const projB=shadowProjection(b.lightX,b.lightY,shadowObjectY(0,s.level));
 let penalty=Math.abs(projA.scale-projB.scale)*88;
 if(s.level!=='easy'){
  penalty+=Math.abs(projA.y-projB.y)*.40;
  for(let i=0;i<s.objects.length;i++){
   const angle=Math.abs(((a.rotations[i]-b.rotations[i]+540)%360)-180);
   penalty+=angle*(s.level==='hard'?.18:.33);
  }
 }
 return Math.max(0,Math.min(100,Math.round(100-penalty)));
}
function shadowAnswerText(s){
 const target=s.target;
 if(s.level==='easy'){
  return s.lightX<target.lightX?'손전등을 물체 쪽으로 조금 더 가까이 움직여 보세요.':'손전등을 물체에서 조금 더 멀리 움직여 보세요.';
 }
 const a=shadowProjection(s.lightX,s.lightY,250),b=shadowProjection(target.lightX,target.lightY,250);
 if(Math.abs(a.scale-b.scale)>.10)return s.lightX<target.lightX?'손전등을 물체에 더 가까이 옮겨 그림자를 키워 보세요.':'손전등을 물체에서 멀리 옮겨 그림자를 줄여 보세요.';
 if(Math.abs(a.y-b.y)>12)return a.y<b.y?'그림자를 더 아래로 움직이려면 손전등을 위쪽으로 옮겨 보세요.':'그림자를 더 위로 움직이려면 손전등을 아래쪽으로 옮겨 보세요.';
 return '물체의 회전 방향을 조정해 목표 실루엣과 비교해 보세요.';
}
function shadowChangeMode(mode){
 if(!Object.hasOwn(SHADOW_MODES,mode))return;
 const s=shadowState();if(s.mode===mode)return;
 s.mode=mode;s.round=1;shadowGenerate(s);shadowInfo='🌟 새로운 실험 모드를 선택했어요.';
 save();render();
}
function shadowChangeLevel(level){
 if(!Object.hasOwn(SHADOW_LEVELS,level))return;
 const s=shadowState();if(s.level===level)return;
 s.level=level;s.round=1;shadowGenerate(s);shadowInfo='✨ 난이도에 맞춘 새로운 그림자 실험이에요.';
 save();render();
}
function shadowNewPuzzle(){
 const s=shadowState();s.round=s.round>=9999?1:s.round+1;
 shadowGenerate(s);shadowInfo='🔍 새로운 그림자 실험을 준비했어요!';save();render();
}
function shadowReset(){
 const s=shadowState();
 if(s.mode==='predict'){s.choice=null;s.revealed=false;s.solved=false;}
 else{s.lightX=145;s.lightY=50;s.rotations=[0,0];s.solved=false;s.attempts=0;s.hint=false;}
 shadowInfo='🔄 현재 실험을 처음부터 다시 시작해요.';
 save();render();
}
function shadowSetDistance(value){
 const s=shadowState();if(s.mode==='predict')return;
 s.lightX=shadowBound(Math.round(Number(value)/5)*5,90,220);
 s.solved=false;shadowInfo='';save();render();
}
function shadowSetHeight(value){
 const s=shadowState();if(s.mode==='predict'||s.level==='easy'&&s.mode!=='free')return;
 s.lightY=shadowBound(Math.round(Number(value)),35,65);
 s.solved=false;shadowInfo='';save();render();
}
function shadowRotate(i,direction){
 const s=shadowState();if(s.mode==='predict'||s.level==='easy'&&s.mode!=='free')return;
 if(!Number.isInteger(i)||i<0||i>=s.objects.length||![-1,1].includes(direction))return;
 s.rotations[i]=(s.rotations[i]+direction*45+360)%360;s.solved=false;
 shadowInfo='';save();render();
}
function shadowChooseObject(i,id){
 const s=shadowState();if(s.mode!=='free'||!Number.isInteger(i)||i<0||i>=s.objects.length||!Object.hasOwn(SHADOW_SHAPE_MAP,id))return;
 s.objects[i]=id;s.rotations[i]=0;save();render();
}
function shadowJudge(){
 const s=shadowState();if(s.mode!=='match')return;
 if(s.solved)return toast('이미 완성했어요! 다음 문제로 이동해 주세요.');
 s.attempts++;const score=shadowMatchScore(s);
 if(score>=90){
  s.solved=true;s.winCount=Math.min(9999,s.winCount+1);
  shadowInfo='🎉 송이가 기뻐해요! 목표 그림자와 '+score+'% 일치했어요!';
  if(s.sound){soundUnlock();beep();}
 }else{
  shadowInfo='🌷 '+score+'% 일치해요. 손전등 거리와 위치를 조금 더 조절해 보세요!';
 }
 save();render();
}
function shadowPredictAnswer(index){
 const s=shadowState();if(s.mode!=='predict'||s.revealed||!Number.isInteger(index)||index<0||index>=4)return;
 s.choice=index;s.revealed=true;s.attempts++;
 s.solved=index===s.correctIndex;
 if(s.solved){s.winCount=Math.min(9999,s.winCount+1);shadowInfo='🎉 맞았어요! 빛의 위치를 보고 그림자를 잘 예상했네요!';if(s.sound){soundUnlock();beep();}}
 else shadowInfo='🌷 아쉽지만 괜찮아요. 정답 그림자와 비교해 보세요!';
 save();render();
}
function shadowHint(){const s=shadowState();s.hint=!s.hint;save();render();}
function shadowSound(){const s=shadowState();s.sound=!s.sound;save();render();}
function shadowLeave(){shadowFull=false;document.body.classList.remove('shadow-fullscreen');shadowInfo='';}
function shadowToggleFull(){
 shadowFull=!shadowFull;document.body.classList.toggle('shadow-fullscreen',shadowFull);
 render();if(shadowFull)window.scrollTo({top:0,behavior:'instant'});
}
function shadowSettingsBar(){
 const s=shadowState();
 return '<div class="shadow-settings"><div class="shadow-mode-buttons" role="group" aria-label="그림자 실험 모드">'+
 Object.entries(SHADOW_MODES).map(([id,label])=>
 '<button type="button" class="shadow-tab'+(s.mode===id?' active':'')+'" data-shadow-mode="'+id+'" aria-pressed="'+(s.mode===id)+'">'+label+'</button>').join('')+'</div>'+
 '<div class="shadow-level-buttons" role="group" aria-label="그림자 실험 난이도">'+
 Object.entries(SHADOW_LEVELS).map(([id,label])=>
 '<button type="button" class="shadow-level'+(s.level===id?' active':'')+'" data-shadow-level="'+id+'" aria-pressed="'+(s.level===id)+'">'+label+'</button>').join('')+'</div></div>';
}
function shadowControls(){
 const s=shadowState(),disabled=s.mode==='predict',noY=disabled||s.level==='easy'&&s.mode!=='free';
 const slider=(id,label,min,max,value,disabled)=>
 '<label class="shadow-control-label" for="'+id+'"><span>'+label+'</span><strong>'+Math.round(value)+'</strong></label>'+
 '<input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="5" value="'+Math.round(value)+'" '+(disabled?'disabled':'')+' class="shadow-range">';
 return '<section class="shadow-controls"><div class="shadow-controls-title"><strong>🧪 실험 조작대</strong><span>'+(disabled?'이 모드에서는 위치를 관찰하고 그림자를 예상해요':'손전등을 끌거나 슬라이더를 움직여 보세요')+'</span></div>'+
 '<div class="shadow-slider-grid"><div>'+slider('shadowLightDistance','🔦 빛의 거리 (오른쪽일수록 물체에 가까움)',90,220,s.lightX,disabled)+'</div>'+
 '<div>'+slider('shadowLightHeight','↕ 손전등 높이 (위쪽 ~ 아래쪽)',35,65,s.lightY,noY)+'</div></div>'+
 '<div class="shadow-object-controls">'+s.objects.map((id,i)=>'<div class="shadow-object-row"><strong>'+escapeHtml(SHADOW_SHAPE_MAP[id].label)+'</strong>'+
 (s.mode==='free'?'<select class="field" data-shadow-object="'+i+'" aria-label="'+(i+1)+'번째 물체 선택">'+SHADOW_SHAPES.map(obj=>
 '<option value="'+obj.id+'" '+(id===obj.id?'selected':'')+'>'+escapeHtml(obj.label)+'</option>').join('')+'</select>':'')+
 '<button class="btn btn-outline" type="button" data-shadow-rotate="'+i+'" data-shadow-direction="-1" '+(noY?'disabled':'')+'>↶ 45°</button>'+
 '<button class="btn btn-outline" type="button" data-shadow-rotate="'+i+'" data-shadow-direction="1" '+(noY?'disabled':'')+'>↷ 45°</button>'+
 '<small>'+s.rotations[i]+'°</small></div>').join('')+'</div>'+
 '<div class="shadow-control-actions">'+
 (s.mode==='match'?'<button type="button" class="btn btn-primary" id="shadowJudge">✨ 그림자 일치 확인</button>':'')+
 '<button type="button" class="btn btn-outline" id="shadowHint">'+(s.hint?'💡 힌트 가리기':'💡 힌트 보기')+'</button>'+
 '<button type="button" class="btn btn-outline" id="shadowReset">🔄 처음부터</button>'+
 '<button type="button" class="btn btn-secondary" id="shadowNext">🌟 새로운 실험</button>'+
 '<button type="button" class="btn btn-outline" id="shadowFull">'+(shadowFull?'✕ 관리 화면':'⛶ 전자칠판 크게')+'</button>'+
 '<button type="button" class="btn btn-outline" id="shadowSound">'+(s.sound?'🔊 효과음':'🔇 무음')+'</button></div></section>';
}
function shadowPlayPanel(){
 const s=shadowState();
 return '<section class="shadow-stage"><div class="shadow-stage-header"><div><strong>🔦 그림자 실험 무대</strong><p>손전등을 드래그해 보세요. 물체를 지나 벽에 그림자가 생겨요.</p></div>'+
 '<span>실험 '+s.round+' · 성공 '+s.winCount+'회</span></div>'+
 '<svg id="shadowScene" viewBox="0 0 960 500" role="img" aria-label="손전등과 물체, 그림자가 투영되는 실험 무대" class="shadow-scene">'+shadowSceneBody(s)+'</svg>'+
 (s.mode==='free'?'<p class="shadow-teaching-note">📚 관찰: 빛이 물체에 가까워지면 그림자가 커지고, 빛을 위로 올리면 그림자는 아래로 움직여요.</p>':'')+
 (shadowInfo?'<div class="shadow-feedback'+(s.solved?' success':'')+'" role="status">'+escapeHtml(shadowInfo)+'</div>':'')+
 (s.hint?'<div class="shadow-hint">💡 '+escapeHtml(s.mode==='match'?shadowAnswerText(s):
 s.mode==='predict'?'손전등이 물체와 가까우면 그림자가 커집니다. 빛의 높이가 바뀌면 그림자가 반대쪽으로 이동해요.':
 '손전등을 물체 쪽으로 옮겨 보고, 위아래로 움직여 그림자 변화를 관찰해 보세요.')+'</div>':'')+
 '</section>';
}
function shadowQuestionPanel(){
 const s=shadowState();
 if(s.mode==='free')return '<section class="shadow-target-card shadow-free-note"><div class="shadow-card-heading"><strong>🌈 자유 실험 안내</strong><small>정해진 정답이 없어요</small></div>'+
 '<div class="shadow-free-emoji">🌞🔦🐰</div><h3>빛의 위치를 바꿔 봐요!</h3>'+
 '<p>손전등을 물체 가까이, 멀리 움직이거나 물체를 돌려서 그림자가 어떻게 변하는지 관찰해요.</p>'+
 '<p class="shadow-model-note">이 게임은 빛의 직진과 그림자의 변화를 설명하는 단순화된 2차원 학습 모델입니다. 실제 3차원 광학 현상을 완벽하게 재현하지는 않습니다.</p></section>';
 if(s.mode==='predict')return '<section class="shadow-target-card"><div class="shadow-card-heading"><strong>🔍 어떤 그림자가 생길까요?</strong><small>가장 알맞은 그림자 1개 선택</small></div>'+
 '<p class="shadow-target-description">손전등·물체의 위치를 관찰하고 벽에 나타날 그림자를 예상하세요.</p>'+
 '<div class="shadow-choices">'+s.options.map((o,i)=>
 '<button type="button" class="shadow-choice'+(s.revealed&&i===s.correctIndex?' correct':'')+
 (s.revealed&&s.choice===i&&i!==s.correctIndex?' wrong':'')+'" data-shadow-choice="'+i+'" '+(s.revealed?'disabled':'')+
 ' aria-label="'+(i+1)+'번 그림자 선택"><strong>'+(i+1)+'번</strong>'+shadowTargetThumb(s,o,(i+1)+'번 예상 그림자')+'</button>').join('')+'</div>'+
 (s.revealed?'<div class="shadow-answer-result">'+(s.solved?'✅ 정답입니다!':'💡 정답은 '+(s.correctIndex+1)+'번이에요.')+'</div>':'')+
 '</section>';
 return '<section class="shadow-target-card"><div class="shadow-card-heading"><strong>🎯 목표 그림자</strong><small>90% 이상 맞히면 성공!</small></div>'+
 '<p class="shadow-target-description">오른쪽 목표 모양과 실험 무대의 그림자를 비교하며 맞혀 보세요.</p>'+
 '<div class="shadow-target-image">'+shadowTargetThumb(s,s.target,'이번 단계의 목표 그림자')+'</div>'+
 '<div class="shadow-score-info"><strong>현재 일치율 <span>'+shadowMatchScore(s)+'%</span></strong>'+
 '<div role="progressbar" aria-label="그림자 일치율" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+shadowMatchScore(s)+'" class="shadow-score-track"><span style="width:'+shadowMatchScore(s)+'%"></span></div></div>'+
 (s.solved?'<div class="shadow-win">🎉 성공했어요! 다음 실험으로 넘어가 보세요.</div>':'')+
 '<p class="shadow-model-note">이 게임은 그림자 크기·위치·방향을 단순화하여 비교합니다. 실제 광학 실험과 일부 차이가 있을 수 있어요.</p></section>';
}
function shadowAfterRender(){
 const scene=document.getElementById('shadowScene');
 if(!scene||scene.dataset.dragReady==='1')return;
 scene.dataset.dragReady='1';let dragged=null;
 scene.addEventListener('pointerdown',e=>{
  if(shadowState().mode==='predict'||!e.target.closest('[data-shadow-lamp]'))return;
  dragged=e.pointerId;
  try{scene.setPointerCapture(e.pointerId);}catch(err){}
  e.preventDefault();
 });
 scene.addEventListener('pointermove',e=>{
  if(dragged!==e.pointerId)return;
  const rect=scene.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const s=shadowState();
  const x=(e.clientX-rect.left)/rect.width*960,y=(e.clientY-rect.top)/rect.height*500;
  s.lightX=shadowBound(Math.round(x/5)*5,90,220);
  s.lightY=s.level==='easy'&&s.mode!=='free'?50:shadowBound(Math.round((y-50)/4),35,65);
  s.solved=false;
  scene.innerHTML=shadowSceneBody(s);
  e.preventDefault();
 });
 const stop=e=>{if(dragged!==e.pointerId)return;dragged=null;shadowInfo='';save();render();};
 scene.addEventListener('pointerup',stop);
 scene.addEventListener('pointercancel',stop);
}
function renderShadow(){
 const s=shadowState();
 return (shadowFull?'<div class="shadow-full-header"><strong>🔦 송이의 신기한 그림자 실험실</strong><button class="btn btn-outline" id="shadowFull" type="button">✕ 관리 화면</button></div>':
 title('교실 놀이·게임','송이의 신기한 그림자 실험실','빛의 위치와 물체의 방향을 바꿔 그림자 변화를 관찰해요.','🔦'))+
 '<div class="shadow-layout">'+
 '<header class="shadow-hero"><div><span>🔦 SONGYI SCIENCE LAB</span><h2>송이의 신기한 그림자 실험실</h2>'+
 '<p>손전등을 움직이면 그림자가 달라져요! 친구들과 직접 탐구해 보세요.</p></div>'+
 '<div class="shadow-mascot" aria-hidden="true">🐿️✨🔦</div></header>'+
 shadowSettingsBar()+'<div class="shadow-main">'+shadowPlayPanel()+shadowQuestionPanel()+'</div>'+
 shadowControls()+
 (!shadowFull?'<p class="shadow-privacy">🔒 교사 PC 한 대로 사용합니다. 학생 로그인·서버 연결 없이 학급별 진행 상태를 브라우저에 저장해요.</p>':'')+
 '</div>';
}
