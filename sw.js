const CACHE='encore-shell-v18';
const FILES=['./','./index.html','./styles.css?v=18','./app.js?v=18','./manifest.webmanifest','./icon.png','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('encore-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;e.respondWith(fetch(r).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}return res}).catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))))});
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{}}catch{data={title:'ENCORE update',body:'Open ENCORE for the latest concert information.'}}
 const title=String(data.title||'ENCORE update').slice(0,120),body=String(data.body||'').slice(0,260);
 // iOS requires every received push to present a visible notification.
 event.waitUntil(self.registration.showNotification(title,{body,icon:'./icon.png',badge:'./icon.png',tag:String(data.tag||'encore-update'),data:{url:'./'}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const path=new URL('./',self.registration.scope).href;const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const tab of windows){if(tab.url.startsWith(path)){await tab.focus();return}}await self.clients.openWindow(path)})())});
