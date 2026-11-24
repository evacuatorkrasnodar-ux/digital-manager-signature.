/* SEYVEO · restored original 64 portraits, stable IDs 12–75.
   Split the original local 1536px artwork into individually clipped portrait
   images once per session. No sprite bleed, no enlarged gallery screenshots.
   Existing avatar IDs 0–11 and saved photos remain unchanged. */
(function(){
 const catalog=[["Кудрявый парень","Люди и герои"],["Блондинка","Люди и герои"],["Борода и очки","Люди и герои"],["В наушниках","Люди и герои"],["Пилот","Люди и герои"],["Космонавт","Люди и герои"],["Девушка в кепке","Люди и герои"],["Гитарист","Люди и герои"],["Врач","Люди и герои"],["Профессор","Люди и герои"],["Учёная","Люди и герои"],["Робот","Люди и герои"],["Художница","Люди и герои"],["Супергерой","Люди и герои"],["Ниндзя","Люди и герои"],["Эльфийка","Люди и герои"],["Путешественник","Люди и герои"],["Волшебник","Люди и герои"],["Принцесса","Люди и герои"],["Юный турист","Люди и герои"],["Геймерша","Люди и герои"],["Парень в очках","Люди и герои"],["Деловая девушка","Люди и герои"],["Деловой мужчина","Люди и герои"],["Зимняя шапка","Люди и герои"],["Лыжница","Люди и герои"],["В шлеме","Люди и герои"],["Летняя шляпка","Люди и герои"],["Шеф-повар","Люди и герои"],["Спортсменка","Люди и герои"],["Строитель","Люди и герои"],["Пожарный","Люди и герои"],["Оператор","Люди и герои"],["Кудрявый мальчик","Люди и герои"],["Девочка с зайцем","Люди и герои"],["Меломан","Люди и герои"],["Седые волосы","Люди и герои"],["Бабушка","Люди и герои"],["Дедушка","Люди и герои"],["Цветочный венок","Люди и герои"],["Хаски","Животные и фантазия"],["Кот","Животные и фантазия"],["Панда","Животные и фантазия"],["Лисёнок","Животные и фантазия"],["Кролик","Животные и фантазия"],["Дракончик","Животные и фантазия"],["Енот","Животные и фантазия"],["Сова","Животные и фантазия"],["Робопёс","Животные и фантазия"],["Голубая фея","Животные и фантазия"],["Лесной дух","Животные и фантазия"],["Пчёлка","Животные и фантазия"],["Кот-космонавт","Животные и фантазия"],["Корги","Животные и фантазия"],["Пингвин","Животные и фантазия"],["Зелёный дракон","Животные и фантазия"],["Кибергеймерша","Фантазия"],["Юный волшебник","Фантазия"],["Ангел","Фантазия"],["Кибергерой","Фантазия"],["Фиолетовая фея","Фантазия"],["Самурай","Фантазия"],["Пират","Фантазия"],["Ледяная королева","Фантазия"]];
 const source=new URL('seyveo-avatars-64-fixed.webp',document.currentScript.src).href;
 const rowBounds=[[7,151],[160,309],[316,464],[472,620],[628,776],[785,932],[949,1080],[1104,1235]];
 const cache=new Map();
 let atlasPromise;
 function bounds(tile,w,h){
  const row=Math.floor(tile/8),col=tile%8,[top,bottom]=rowBounds[row];
  return {x:(5+156*col)*w/1248,y:top*h/1248,w:146*w/1248,h:(bottom-top)*h/1248};
 }
 function atlas(){
  if(!atlasPromise)atlasPromise=new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=source;
  });
  return atlasPromise;
 }
 function individual(tile,insetRatio=0){
  const key=tile+':'+insetRatio;
  if(!cache.has(key))cache.set(key,atlas().then(img=>{
   const b=bounds(tile,img.naturalWidth,img.naturalHeight);
   const canvas=document.createElement('canvas');
   const size=Math.round(Math.min(b.w,b.h));canvas.width=canvas.height=size;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip();
   // Preserve the entire original portrait; allow a small breathing space in staff cards.
   const inset=Math.round(size*insetRatio),inner=size-2*inset;
   const scale=inner/Math.max(b.w,b.h),dw=b.w*scale,dh=b.h*scale;
   ctx.drawImage(img,b.x,b.y,b.w,b.h,(size-dw)/2,(size-dh)/2,dw,dh);
   return canvas.toDataURL('image/png');
  }));
  return cache.get(key);
 }
 function paint(el,index,options){
  if(!el||!Number.isInteger(index)||index<12||index>=76)return false;
  const tile=index-12,b=bounds(tile,1536,1536);
  el.style.setProperty('background-image','url("'+source+'")','important');
  el.style.setProperty('background-size',(1536/b.w*100)+'% '+(1536/b.h*100)+'%','important');
  el.style.setProperty('background-position',(b.x/(1536-b.w)*100)+'% '+(b.y/(1536-b.h)*100)+'%','important');
  el.style.setProperty('background-repeat','no-repeat','important');
  const insetRatio=options?.relaxedFit===true?.035:0;
  individual(tile,insetRatio).then(url=>{
   el.style.setProperty('background-image','url("'+url+'")','important');
   el.style.setProperty('background-size','100% 100%','important');
   el.style.setProperty('background-position','center','important');
  }).catch(()=>{/* The exact source crop remains available as fallback. */});
  return true;
 }
 window.SEYVEO_AVATAR_ART={catalog,paint};
})();