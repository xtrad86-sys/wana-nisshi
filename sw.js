// わな猟日誌 Service Worker（オフラインで画面を開けるようにする）
const CACHE='wanalog-v3d';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./leaflet.js','./leaflet.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!=='wanalog-tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // 地理院タイル：一度見た場所は圏外でも表示できるよう保存（最大約3000枚）
  if(e.request.method==='GET'&&u.hostname==='cyberjapandata.gsi.go.jp'){
    e.respondWith(caches.open('wanalog-tiles').then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{c.put(e.request,r.clone());c.keys().then(k=>{if(k.length>3000)c.delete(k[0])});return r}))));
    return;
  }
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // API・天気はキャッシュしない
  // 画面はネット優先（更新を反映）、圏外ならキャッシュ
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
});
