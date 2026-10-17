/* SEYVEO Web Push receiver (v1).
 * Network-only: do not cache app files or intercept fetches.
 * Delivery needs a separate authenticated backend that schedules pushes. */
'use strict';
self.addEventListener('install',()=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('push',event=>{
 let info=null;
 if(event.data){try{info=event.data.json()}catch{info=null}}
 const notification=info&&typeof info==='object'&&info.notification&&typeof info.notification==='object'
  ?info.notification:info;
 const safe=notification&&typeof notification==='object'?notification:{};
 const title=typeof safe.title==='string'&&safe.title.trim()?safe.title.slice(0,90):'SEYVEO · Напоминание';
 const body=typeof safe.body==='string'&&safe.body.trim()?safe.body.slice(0,170):'Посмотрите ближайшее событие в календаре.';
 const tag=typeof safe.tag==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(safe.tag)?safe.tag:'seyveo-calendar';
 // One user-visible notification for every push. Never send silent pushes.
 event.waitUntil(self.registration.showNotification(title,{
  body,lang:'ru',tag,icon:new URL('assets/apple-touch-icon.png',self.registration.scope).href,
  data:{open:'calendar'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL('./#calendar',self.registration.scope).href;
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(item=>item.url.startsWith(self.registration.scope));
  if(existing){
   if(typeof existing.navigate==='function')await existing.navigate(url);
   if(typeof existing.focus==='function')await existing.focus();
  }else if(self.clients.openWindow){
   await self.clients.openWindow(url);
  }
 })());
});