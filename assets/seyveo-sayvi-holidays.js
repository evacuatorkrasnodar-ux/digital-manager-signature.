/* SEYVEO · optional local holiday artwork. Never change chat geometry.
   Official icon stays in use until the full local artwork pack is installed. */
(function(){
 const variants=[['emoji','Сэйви улыбается'],['refined','Сэйви · жемчуг'],['halloween','Хэллоуин'],['christmas','Рождество'],['newyear','Новый год'],['valentine','День влюблённых'],['easter','Пасха'],['birthday','День рождения']];
 const base=new URL('sayvi-holidays/',document.currentScript.src);
 const url=id=>new URL(id+'.webp',base).href;
 const key='seyveo-sayvi-holiday-mode-v1';
 const mode='auto';let ready=false;
 // Retire any manual choice saved by older versions.
 try{localStorage.removeItem(key)}catch{}
 function auto(date){
  const m=date.getMonth()+1,d=date.getDate(),y=date.getFullYear();
  if(m===10&&d===31)return 'halloween';
  if(m===12&&d>=24&&d<=26||m===1&&d===7)return 'christmas';
  if(m===12&&d>=30||m===1&&d<=2)return 'newyear';
  if(m===2&&d===14)return 'valentine';
  // Gregorian and Orthodox Easter, calculated for the current year.
  const a=y%19,b=Math.floor(y/100),c=y%100,e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-Math.floor(b/4)-g+15)%30,l=(32+2*e+2*Math.floor(c/4)-h-c%4)%7,n=Math.floor((a+11*h+22*l)/451),k=h+l-7*n+114;
  const western=new Date(y,Math.floor(k/31)-1,k%31+1);
  const j=(19*(y%19)+15)%30,z=(2*(y%4)+4*(y%7)-j+34)%7,q=j+z+114;
  const eastern=new Date(y,Math.floor(q/31)-1,q%31+1+Math.floor(y/100)-Math.floor(y/400)-2);
  if([western,eastern].some(x=>x.getMonth()+1===m&&x.getDate()===d))return 'easter';
  return '';
 }
 function apply(){
  const id=ready?auto(new Date()):'';
  const root=document.documentElement;
  if(variants.some(x=>x[0]===id)){
   root.dataset.svSayviHoliday=id;
   root.style.setProperty('--sv-sayvi-holiday-art','url("'+url(id)+'")');
  }else{delete root.dataset.svSayviHoliday;root.style.removeProperty('--sv-sayvi-holiday-art')}
 }
 function setMode(value){
  // Compatibility for older callers: holiday mode is always automatic.
  apply();
 }
 function paint(el,index){
  if(index<76||index>=84||!Number.isInteger(index))return false;
  const id=variants[index-76][0];
  el.style.setProperty('background-image','url("'+(ready?url(id):new URL('../seyveo-sayvi-avatar-crisp.png',base).href)+'")','important');
  el.style.setProperty('background-position','center','important');
  el.style.setProperty('background-size','contain','important');
  el.style.setProperty('background-repeat','no-repeat','important');
  return true;
 }
 window.SEYVEO_SAYVI_HOLIDAY={catalog:variants.map(x=>[x[1],'Сэйви']),variants,get ready(){return ready},get mode(){return mode},setMode,paint};
 fetch(new URL('manifest.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('not installed');return r.json()}).then(m=>{
  if(m.version!==1)throw Error('unknown pack');
  return Promise.all(variants.map(([id])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url(id)})));
 }).then(()=>{ready=true;apply()}).catch(()=>{});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
 window.addEventListener('pageshow',apply);setInterval(apply,60000);
})();