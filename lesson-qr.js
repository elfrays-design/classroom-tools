/* v1.21 수업 QR 안내화면: QR코드는 브라우저 안에서 생성하며 URL을 전송·저장하지 않습니다. */
'use strict';
let lessonQrUrl='',lessonQrTitle='채움AI 수업 참여',lessonQrExpanded=false,lessonQrError='';
function lessonQrValidate(raw){
 const value=String(raw||'').trim();
 if(!value)return {ok:false,message:'학생용 링크 주소를 입력해 주세요.'};
 if(value.length>1200)return {ok:false,message:'URL이 너무 깁니다. 1,200자 이하의 학생용 공유 링크를 사용해 주세요.'};
 if(/[\r\n\t]/.test(value))return {ok:false,message:'URL은 한 줄로 입력해 주세요.'};
 let u;try{u=new URL(value);}catch(e){return {ok:false,message:'https://로 시작하는 올바른 링크 주소를 붙여넣어 주세요.'};}
 if(!['https:','http:'].includes(u.protocol)||!u.hostname||u.username||u.password)
   return {ok:false,message:'웹사이트의 http:// 또는 https:// 학생용 링크만 사용할 수 있습니다.'};
 if(/^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(u.hostname))
   return {ok:false,message:'교실 학생 휴대전화에서 접속 가능한 인터넷 주소를 사용해 주세요.'};
 if(u.href.length>1400)return {ok:false,message:'URL이 너무 깁니다. 더 짧은 학생용 링크를 사용해 주세요.'};
 return {ok:true,url:u.href,domain:u.hostname};
}
function lessonQrSafeTitle(value){return String(value||'').trim().slice(0,70)||'채움AI 수업 참여';}
function lessonQrGenerate(){
 const input=document.getElementById('lessonQrUrl'),heading=document.getElementById('lessonQrTitle');
 const valid=lessonQrValidate(input?.value||'');
 const nextTitle=lessonQrSafeTitle(heading?.value);
 if(!valid.ok){lessonQrError=valid.message;lessonQrTitle=nextTitle;lessonQrRenderError();return;}
 if(typeof QRCode==='undefined'){lessonQrError='QR코드 생성 파일을 불러오지 못했습니다. 새로고침해 주세요.';lessonQrRenderError();return;}
 lessonQrTitle=nextTitle;lessonQrError='';
 // QR 인코딩이 실패하면 이미 표시한 QR은 유지합니다.
 const candidate=valid.url,previous=lessonQrUrl;
 lessonQrUrl=candidate;
 try{render();}catch(err){lessonQrUrl=previous;lessonQrError='QR 생성에 실패했습니다. URL을 확인하거나 더 짧은 링크를 사용해 주세요.';render();}
}
function lessonQrRenderError(){
 const el=document.getElementById('lessonQrError');if(el){el.textContent=lessonQrError;el.hidden=!lessonQrError;}
}
function lessonQrClear(){
 if(lessonQrExpanded)lessonQrCollapse(false);
 lessonQrUrl='';lessonQrError='';lessonQrTitle='채움AI 수업 참여';render();
}
function lessonQrCollapse(repaint=true){
 lessonQrExpanded=false;
 document.body.classList.remove('lesson-qr-expanded');
 if(repaint&&currentView==='lessonQr')render();
}
function lessonQrExpand(){
 if(!lessonQrUrl)return toast('먼저 학생용 URL을 QR코드로 만들어 주세요.');
 lessonQrExpanded=true;
 document.body.classList.add('lesson-qr-expanded');
 render();
 window.scrollTo({top:0,behavior:'instant'});
}
function lessonQrCopy(){
 if(!lessonQrUrl)return toast('먼저 학생용 링크를 입력해 주세요.');
 copyText(lessonQrUrl);
}
function lessonQrAfterRender(){
 if(!lessonQrUrl)return;
 const el=document.getElementById('lessonQrCode');if(!el)return;
 const lib=typeof QRCode!=='undefined'?QRCode:null;
 if(!lib){lessonQrError='QR코드 생성 모듈이 없습니다. 페이지를 새로고침해 주세요.';lessonQrRenderError();return;}
 try{
  el.innerHTML='';
  new lib(el,{text:lessonQrUrl,width:1000,height:1000,colorDark:'#162640',colorLight:'#FFFFFF',correctLevel:lib.CorrectLevel.M});
  lessonQrError='';
 }catch(e){
  el.innerHTML='';
  lessonQrError='QR코드로 바꿀 수 없는 URL입니다. 더 짧은 학생용 링크를 사용해 주세요.';
 }
 lessonQrRenderError();
}
function lessonQrStudentCard(){
 const checked=lessonQrValidate(lessonQrUrl);
 const domain=checked.ok?checked.domain:'';
 return '<section class="lesson-qr-display" aria-label="학생용 수업 QR 안내 화면">'+
 '<div class="lesson-qr-display-label">🌈 함께 배우는 우리 반</div>'+
 '<h2>'+escapeHtml(lessonQrTitle)+'</h2>'+
 '<p class="lesson-qr-instruction">휴대전화 카메라로 QR코드를 스캔해 주세요!</p>'+
 '<div class="lesson-qr-white"><div id="lessonQrCode" class="lesson-qr-code" role="img" aria-label="'+escapeHtml(lessonQrTitle)+' 수업 참여 QR코드"></div></div>'+
 '<div class="lesson-qr-domain">'+escapeHtml(domain)+'</div>'+
 '<p class="lesson-qr-steps">① 카메라 실행　② QR 스캔　③ 링크 눌러 참여</p>'+
 '</section>';
}
function renderLessonQr(){
 if(lessonQrExpanded)return '<div class="lesson-qr-expanded-head"><strong>🔗 수업 QR 안내화면</strong><button id="lessonQrBack" type="button" class="btn btn-outline">✕ 편집 화면으로</button></div>'+lessonQrStudentCard();
 const has=!!lessonQrUrl,domain=has?lessonQrValidate(lessonQrUrl).domain:'';
 return title('수업 안내자료','수업 QR 안내화면','채움AI의 학생용 링크를 붙여넣으면 QR코드로 만들어 전자칠판에 크게 보여줍니다.','🔗')+
 '<div class="lesson-qr-layout"><section class="panel lesson-qr-editor"><h2>① 학생용 링크 입력</h2>'+
 '<p>채움AI에서 <strong>학생에게 공유할 링크</strong>를 복사해서 붙여넣으세요.</p>'+
 '<form id="lessonQrForm" novalidate><label for="lessonQrTitle">수업 안내 제목</label><input class="field" type="text" id="lessonQrTitle" maxlength="70" value="'+escapeHtml(lessonQrTitle)+'" placeholder="예: 오늘의 채움AI 수업 참여"/>'+
 '<label for="lessonQrUrl">학생용 URL 주소</label><textarea class="field lesson-qr-input" id="lessonQrUrl" rows="4" spellcheck="false" autocomplete="off" placeholder="https://… 학생용 링크 주소를 붙여넣으세요">'+escapeHtml(lessonQrUrl)+'</textarea>'+
 '<div class="lesson-qr-editor-actions"><button type="submit" class="btn btn-primary btn-large">🔗 QR로 바꾸기</button><button type="button" id="lessonQrClear" class="btn btn-outline">↺ 초기화</button></div></form>'+
 '<p id="lessonQrError" class="lesson-qr-error" '+(!lessonQrError?'hidden':'')+'>'+escapeHtml(lessonQrError)+'</p>'+
 '<div class="lesson-qr-privacy">🔒 입력한 URL은 서버로 보내거나 학급 저장 데이터에 기록하지 않습니다. QR은 이 브라우저에서 생성됩니다.</div>'+
 '<p class="lesson-qr-help">※ 로그인한 교사 전용 주소가 아니라 학생용으로 공유 가능한 링크인지 확인해 주세요. 링크에 비밀 코드가 포함된 경우 QR을 보는 학생 누구나 접속할 수 있습니다.</p></section>'+
 '<section class="panel lesson-qr-preview"><div class="lesson-qr-preview-head"><h2>② QR 미리보기</h2><span>'+escapeHtml(has?domain:'학생용 링크 대기')+'</span></div>'+
 (has?lessonQrStudentCard():'<div class="lesson-qr-placeholder"><span>🔗</span><strong>QR코드가 여기에 표시됩니다.</strong><p>왼쪽에서 학생용 URL을 입력하고 「QR로 바꾸기」를 눌러 주세요.</p></div>')+
 '<div class="lesson-qr-preview-actions"><button type="button" id="lessonQrExpand" class="btn btn-secondary btn-large" '+(has?'':'disabled')+'>⛶ ③ 전자칠판 크게 보기</button>'+
 '<button type="button" id="lessonQrCopy" class="btn btn-outline" '+(has?'':'disabled')+'>📋 링크 복사</button></div></section></div>';
}
