self.addEventListener('push', event => {
 let data={};try{data=event.data?.json()||{};}catch{}
 event.waitUntil(self.registration.showNotification('درخواست جدید خونه‌نما',{
  body:'یک درخواست مشتری در صندوق غرفه شما ثبت شد.',icon:'/khonenama-icon.png',tag:String(data.tag||'new-request'),data:{url:'/dashboard#leads'}
 }));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 event.waitUntil((async()=>{
  const url=new URL('/dashboard#leads',self.location.origin).href;
  const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const tab of tabs){if(new URL(tab.url).origin===self.location.origin){await tab.navigate(url);return tab.focus();}}
  return self.clients.openWindow(url);
 })());
});
