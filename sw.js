// Offline-ready service worker — v1.26
const CACHE_NAME='classroom-toolbox-static-v1.30';
const ASSETS=['./','./index.html','./style.css','./roles.css','./roles.js','./roulette.css','./roulette.js','./lesson-qr.css','./qrcode.min.js','./lesson-qr.js','./debate.css','./debate.js','./lesson.css','./lesson.js','./quiz.css','./quiz.js','./classroom-extras.css','./extras-extra.css','./group-progress.js','./signal.js','./goals.js','./mystery.css','./mystery.js','./bingo.css','./bingo.js','./initial.css','./initial.js','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./byeol-songi-custom.jpg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('classroom-toolbox-static-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const networkFirst=event.request.mode==='navigate'||/\.(?:js|css)$/i.test(url.pathname);
 if(networkFirst){
  event.respondWith(fetch(event.request).then(response=>{
   if(response.ok&&url.pathname.startsWith(new URL(self.registration.scope).pathname)){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));
   }
   return response;
  }).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?await caches.match('./index.html'):Response.error())));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok&&url.pathname.startsWith(new URL(self.registration.scope).pathname)){
   const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));
  }
  return response;
 })));
});
