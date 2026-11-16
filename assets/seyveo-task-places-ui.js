/* SEYVEO · Verified meeting location card in the smart-first New screen.
 * Not an address autocomplete: one lookup after the user commits the phrase. */
(()=>{
 'use strict';
 const places=window.SEYVEO_TASK_PLACES;
 const search=window.SEYVEO_SEARCH_HUB;
 const dialog=document.getElementById('personalTaskDialog');
 const title=document.getElementById('personalTaskTitle');
 const panel=document.getElementById('svNewTaskPlacePanel');
 if(!places||!dialog||!title||!panel)return;
 let proposal=null,place=null,confirmed=false,choices=[],choicesExpanded=false,choicesNearby=false,query='',sourceQuery='',status='idle',request=0,photoRequest=0,searchTimer=0,refining=false,refineText='',cityEditing=false,photoViewer=null,mapViewer=null,mapCleanup=null;
 const node=(tag,cls,text)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;
  return el;
 };
 function closePhotoViewer(){if(photoViewer){photoViewer.remove();photoViewer=null}}
 function closeMapViewer(){
  if(!mapViewer)return;
  mapCleanup?.();mapCleanup=null;mapViewer.remove();mapViewer=null;
 }
 function openMapViewer(value){
  const target=places.cleanPlace(value);if(!target||!dialog.open)return;
  closePhotoViewer();closeMapViewer();
  const shade=node('div','sv-place-map-overlay');shade.setAttribute('role','dialog');
  shade.setAttribute('aria-modal','true');shade.setAttribute('aria-label','Карта места встречи');
  const sheet=node('div','sv-place-map-sheet');sheet.addEventListener('click',event=>event.stopPropagation());
  const handle=node('div','sv-place-map-handle');handle.setAttribute('aria-hidden','true');
  const header=node('div','sv-place-map-header');
  const headline=node('div','sv-place-map-headline');
  headline.append(node('strong','',target.name),node('span','',target.address));
  const close=node('button','sv-place-map-close','⌄');close.type='button';
  close.setAttribute('aria-label','Свернуть карту');close.addEventListener('click',closeMapViewer);
  header.append(headline,close);
  const viewport=node('div','sv-place-map-viewport');viewport.setAttribute('aria-label','Интерактивная карта: перетаскивай, увеличивай двумя пальцами или кнопками');
  const tilesLayer=node('div','sv-place-map-layer');
  const pin=node('span','sv-place-map-marker');pin.setAttribute('aria-label','Выбранное место');
  const controls=node('div','sv-place-map-controls');
  const zoomIn=node('button','sv-place-map-zoom','+');zoomIn.type='button';zoomIn.setAttribute('aria-label','Приблизить карту');
  const zoomOut=node('button','sv-place-map-zoom','−');zoomOut.type='button';zoomOut.setAttribute('aria-label','Отдалить карту');
  const centerButton=node('button','sv-place-map-center','◎');centerButton.type='button';centerButton.setAttribute('aria-label','Вернуться к месту встречи');
  controls.append(zoomIn,zoomOut,centerButton);
  const attribution=node('a','sv-place-map-credit','© OpenStreetMap contributors');
  attribution.href='https://www.openstreetmap.org/copyright';attribution.target='_blank';attribution.rel='noopener noreferrer';
  viewport.append(tilesLayer,pin,controls,attribution);
  const footer=node('div','sv-place-map-footer');
  const navigatorLink=node('a','sv-place-map-route-primary','Маршрут в Навигаторе');
  navigatorLink.href=places.navigatorRouteURL(target);
  navigatorLink.setAttribute('aria-label','Передать адрес в Яндекс Навигатор');
  footer.append(navigatorLink);
  sheet.append(handle,header,viewport,footer);shade.append(sheet);
  shade.addEventListener('click',closeMapViewer);
  shade.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeMapViewer()}});
  // A downward swipe from the sheet header dismisses it. Map gestures stay
  // independent so dragging the streets never accidentally closes the panel.
  let dismissGesture=null;
  const startDismiss=event=>{
   if(event.target.closest?.('button,a'))return;
   dismissGesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY};
  };
  const endDismiss=event=>{
   if(!dismissGesture||dismissGesture.pointerId!==event.pointerId)return;
   const {startX,startY}=dismissGesture;dismissGesture=null;
   if(event.clientY-startY>90&&Math.abs(event.clientX-startX)<110)closeMapViewer();
  };
  for(const area of [handle,header]){
   area.addEventListener('pointerdown',startDismiss);
   area.addEventListener('pointerup',endDismiss);
   area.addEventListener('pointercancel',()=>{dismissGesture=null});
  }
  mapViewer=shade;dialog.append(shade);
  let centerLat=target.lat,centerLon=target.lon,zoom=16;
  const activePointers=new Map(),tileNodes=new Map();let pinchDistance=0;
  function world(lat,lon){
   const size=256*2**zoom,radians=Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180;
   return {x:(lon+180)/360*size,y:(1-Math.log(Math.tan(radians)+1/Math.cos(radians))/Math.PI)/2*size};
  }
  function pan(dx,dy){
   const size=256*2**zoom,old=world(centerLat,centerLon);
   const x=old.x-dx,y=Math.max(0,Math.min(size,old.y-dy));
   centerLon=((x/size*360)%360+540)%360-180;
   centerLat=(2*Math.atan(Math.exp(Math.PI*(1-2*y/size)))-Math.PI/2)*180/Math.PI;
  }
  function draw(){
   if(!mapViewer)return;
   const width=viewport.clientWidth||Math.min(window.innerWidth||390,440);
   const height=viewport.clientHeight||Math.min((window.innerHeight||820)*.59,530);
   const tiles=places.mapTiles({...target,lat:centerLat,lon:centerLon},width,height,zoom);
   const used=new Set();
   for(const tile of tiles){
    let img=tileNodes.get(tile.url);
    if(!img){
     img=node('img','sv-place-map-tile');img.src=tile.url;img.alt='';img.draggable=false;
     img.setAttribute('aria-hidden','true');img.decoding='async';img.referrerPolicy='strict-origin-when-cross-origin';
     tileNodes.set(tile.url,img);tilesLayer.append(img);
    }
    img.style.left=tile.left+'px';img.style.top=tile.top+'px';used.add(tile.url);
   }
   for(const [url,img] of tileNodes){if(!used.has(url)){img.remove();tileNodes.delete(url)}}
   const point=world(target.lat,target.lon),origin=world(centerLat,centerLon);
   pin.style.left='calc(50% + '+(point.x-origin.x)+'px)';
   pin.style.top='calc(50% + '+(point.y-origin.y)+'px)';
   zoomIn.disabled=zoom>=18;zoomOut.disabled=zoom<=3;
  }
  function changeZoom(delta){zoom=Math.max(3,Math.min(18,zoom+delta));draw()}
  zoomIn.addEventListener('click',()=>changeZoom(1));zoomOut.addEventListener('click',()=>changeZoom(-1));
  centerButton.addEventListener('click',()=>{centerLat=target.lat;centerLon=target.lon;zoom=16;draw()});
  viewport.addEventListener('pointerdown',event=>{
   if(event.target.closest?.('button,a'))return;
   activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   viewport.setPointerCapture?.(event.pointerId);
   if(activePointers.size===2){const [a,b]=[...activePointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y)}
  });
  viewport.addEventListener('pointermove',event=>{
   const last=activePointers.get(event.pointerId);if(!last)return;
   activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(activePointers.size===1){pan(event.clientX-last.x,event.clientY-last.y);draw()}
   else if(activePointers.size===2){
    const [a,b]=[...activePointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinchDistance>0&&distance/pinchDistance>1.4){changeZoom(1);pinchDistance=distance}
    else if(pinchDistance>0&&distance/pinchDistance<.72){changeZoom(-1);pinchDistance=distance}
   }
  });
  const pointerEnd=event=>{activePointers.delete(event.pointerId);pinchDistance=0};
  viewport.addEventListener('pointerup',pointerEnd);viewport.addEventListener('pointercancel',pointerEnd);
  viewport.addEventListener('lostpointercapture',pointerEnd);
  viewport.addEventListener('wheel',event=>{event.preventDefault();changeZoom(event.deltaY<0?1:-1)},{passive:false});
  const onResize=()=>draw();window.addEventListener?.('resize',onResize);
  mapCleanup=()=>window.removeEventListener?.('resize',onResize);
  draw();close.focus?.({preventScroll:true});
 }
 function openPhotoViewer(location){
  const info=places.photoInfo(location),src=places.photoURL(location,960);
  if(!info||!src)return;
  closeMapViewer();closePhotoViewer();
  const shade=node('div','sv-place-photo-lightbox');
  shade.setAttribute('role','dialog');shade.setAttribute('aria-modal','true');
  shade.setAttribute('aria-label',info.label);
  const frame=node('div','sv-place-photo-viewer');
  frame.addEventListener('click',event=>event.stopPropagation());
  const close=node('button','sv-place-photo-close','×');close.type='button';
  close.setAttribute('aria-label','Закрыть фотографию');close.addEventListener('click',closePhotoViewer);
  const img=node('img','sv-place-photo-large');img.src=src;img.alt=info.label;
  img.addEventListener('error',()=>{
   img.remove();frame.append(node('p','sv-place-photo-unavailable','Не удалось загрузить фото. Открой оригинал ниже.'));
  },{once:true});
  const caption=node('div','sv-place-photo-caption');caption.append(node('strong','',info.label));
  const credit=node('div','sv-place-photo-attribution');
  const source=node('a','',info.author?'Фото: '+info.author:'Источник: Wikimedia Commons');
  source.href=info.sourceURL;source.target='_blank';source.rel='noopener noreferrer';credit.append(source);
  if(info.license){
   const license=node('a','',info.license);license.href=info.licenseURL;
   license.target='_blank';license.rel='noopener noreferrer';credit.append(license);
  }
  caption.append(credit);frame.append(close,img,caption);shade.append(frame);
  shade.addEventListener('click',closePhotoViewer);
  shade.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();closePhotoViewer()}
  });
  photoViewer=shade;dialog.append(shade);close.focus?.({preventScroll:true});
 }
 function reset(){
  clearTimeout(searchTimer);
  closePhotoViewer();closeMapViewer();
  request++;photoRequest++;proposal=null;place=null;confirmed=false;choices=[];choicesExpanded=false;choicesNearby=false;query='';sourceQuery='';status='idle';refining=false;refineText='';cityEditing=false;
  panel.replaceChildren();panel.hidden=true;
 }
 function load(saved){
  closePhotoViewer();closeMapViewer();
  place=places.cleanPlace(saved);confirmed=Boolean(place);choices=[];choicesExpanded=false;choicesNearby=false;proposal=places.extract(title.value);
  query=proposal?.query||'';sourceQuery=query;status=place?'found':'idle';request++;render();resolvePlacePhoto();
 }
 function placeForSave(){return confirmed?places.cleanPlace(place):null}
 // A place suggested for a date or business meeting still needs the person's
 // explicit confirmation before it can become a task destination.
 function suggest(candidate){
  const next=places.cleanPlace(candidate);if(!next||!dialog.open)return false;
  request++;photoRequest++;clearTimeout(searchTimer);closeMapViewer();
  place=next;confirmed=false;choices=[];choicesExpanded=false;choicesNearby=false;
  proposal=null;query='';sourceQuery='';status='found';refining=false;refineText='';cityEditing=false;
  render();resolvePlacePhoto();window.dispatchEvent(new Event('seyveo:task-place-updated'));
  return true;
 }
 async function resolvePlacePhoto(){
  if(!place||place.source==='known-address'||
   (!place.photo&&!place.wikidata)||(place.photo&&place.photoAuthor&&place.photoLicense))return;
  const token=++photoRequest,target=place;
  const updated=await (search?.findPlacePhoto?.(target)||places.resolvePhoto(target));
  if(token!==photoRequest||!dialog.open||!place||place.lat!==target.lat||place.lon!==target.lon)return;
  if(updated?.photo){place=places.cleanPlace(updated);render()}
 }
 function render(){
  if(!dialog.open)return;
  // Reveal the place card only once a place is actually mentioned or loaded.
  panel.hidden=!place&&!proposal;panel.replaceChildren();
  if(panel.hidden)return;
  const heading=node('div','sv-place-heading');
  heading.append(node('strong','','Место'));
  if(place)heading.append(node('span','',confirmed?'Место подтверждено':'Уточни адрес'));
  else if(proposal){
   if(proposal.explicitCity)heading.append(node('span','','Поиск: '+proposal.city));
   else{
    const city=node('button','sv-place-city-trigger',proposal.city?proposal.city+' · изменить':'Указать город');city.type='button';
    city.setAttribute('aria-label',proposal.city?'Изменить город поиска: '+proposal.city:'Указать город поиска');
    city.addEventListener('click',()=>{cityEditing=!cityEditing;render()});heading.append(city);
   }
  }
  panel.append(heading);
  const card=node('div','sv-place-card');panel.append(card);
  if(!place&&!proposal){
   card.classList.add('is-empty');
   const action=node('button','sv-place-empty-action');action.type='button';
   action.append(node('strong','','Добавить место'),node('small','','Напиши название места или адрес в поле выше'));
   action.addEventListener('click',()=>title.focus({preventScroll:true}));
   card.append(action);
  }else if(place){
   const copy=node('div','sv-place-copy');
   copy.append(node('strong','sv-place-name',place.name));
   copy.append(node('p','sv-place-address',place.address));
   card.append(copy);
   const visual=node('div','sv-place-visual');
   const photoURL=places.photoURL(place);
   if(photoURL){
    card.className+=' sv-place-card-has-photo';
    visual.className+=' sv-place-visual-has-photo';
    const photo=document.createElement('button');photo.className='sv-place-photo-link';photo.type='button';
    const info=places.photoInfo(place);
    photo.title=info?.label||'Фото места';
    photo.setAttribute('aria-label',(info?.label||'Фото места')+' — увеличить');
    photo.setAttribute('data-caption',info?.label?.startsWith('Вход в ТРЦ')?'Вход в ТРЦ':'Фото места');
    photo.addEventListener('click',()=>openPhotoViewer(place));
    const img=document.createElement('img');img.src=photoURL;img.loading='lazy';
    img.alt=info?.label||'Фото места';
    let retried=false;
    img.addEventListener('error',()=>{
     const fallback=places.photoURL(place,250);
     if(!retried&&fallback!==photoURL){retried=true;img.src=fallback;return}
     // Never silently hide the entire image: otherwise the user cannot tell
     // whether the app has no photo or whether the network failed.
     img.remove();photo.className+=' sv-place-photo-unavailable';
     photo.textContent='Фото временно недоступно';
     photo.setAttribute('aria-label','Фото недоступно — открыть источник');
    });
    photo.append(img);visual.append(photo);
   }
   const link=document.createElement('button');link.type='button';link.className='sv-place-map';
   link.setAttribute('aria-label','Увеличить карту внутри SEYVEO');
   link.addEventListener('click',()=>openMapViewer(place));
   const narrow=window.matchMedia('(max-width:370px)').matches;
   if(place.source==='yandex'){
    // Keep Yandex business data on the Yandex directory, not on OSM tiles.
    link.className+=' sv-place-map-yandex';
    link.append(node('span','sv-place-map-yandex-label','Открыть\nкарту ↗'));
   }else{
    for(const tile of places.mapTiles(place,narrow?96:112,photoURL?(narrow?96:112):(narrow?88:96))){
     const img=document.createElement('img');img.className='sv-place-map-tile';img.loading='lazy';
     img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';
     img.referrerPolicy='strict-origin-when-cross-origin';img.src=tile.url;
     img.style.left=tile.left+'px';img.style.top=tile.top+'px';link.append(img);
    }
    link.append(node('span','sv-place-map-pin','●'));
   }
   visual.append(link);card.append(visual);
   if(!confirmed){
    const actions=node('div','sv-place-confirm-actions');
    const accept=node('button','sv-place-confirm','Это место');accept.type='button';
    accept.addEventListener('click',()=>{confirmed=true;refining=false;refineText='';render();window.dispatchEvent(new Event('seyveo:task-place-updated'))});
    const change=node('button','sv-place-refine-trigger',refining?'Отмена':'Другой адрес');change.type='button';
    change.setAttribute('aria-expanded',String(refining));
    change.addEventListener('click',()=>{refining=!refining;render()});
    actions.append(accept,change);panel.append(actions);
   }
   const details=places.venueInfo?.(place);
   if(details){
    const strip=node('div','sv-place-venue-details');
    const addRow=(label,value,body)=>{
     const row=node('div','sv-place-info-row');
     const toggle=node('button','sv-place-info-toggle');toggle.type='button';
     const id='sv-place-info-'+strip.children.length;
     toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',id);
     toggle.append(node('span','sv-place-info-label',label),node('strong','sv-place-info-value',value),node('span','sv-place-info-chevron','⌄'));
     const content=node('div','sv-place-info-content');content.id=id;content.hidden=true;
     toggle.addEventListener('click',()=>{
      content.hidden=!content.hidden;toggle.setAttribute('aria-expanded',String(!content.hidden));
     });
     body(content);row.append(toggle,content);strip.append(row);
    };
    if(details.hours)addRow('Часы работы',details.hours,content=>{
     if(details.hoursNote)content.append(node('p','sv-place-info-note',details.hoursNote));
     if(details.hoursSourceURL){
      const source=node('a','sv-place-info-source','Источник графика ↗');
      source.href=details.hoursSourceURL;source.target='_blank';source.rel='noopener noreferrer';content.append(source);
     }
    });
    if(details.menuURL){
     addRow('Меню и цены','Посмотреть',content=>{
      for(const item of details.menuPreview||[]){
       const line=node('div','sv-place-price-row');
       line.append(node('span','',item.name),node('strong','',item.price));content.append(line);
      }
      if(details.menuNote)content.append(node('p','sv-place-info-note',details.menuNote));
      const menu=node('a','sv-place-menu-link','Всё меню на официальном сайте ↗');
      menu.href=details.menuURL;menu.target='_blank';menu.rel='noopener noreferrer';
      menu.setAttribute('aria-label','Открыть полное официальное меню, цены могут отличаться');
      content.append(menu);
     });
    }
    panel.append(strip);
   }
   if(place.websiteURL){
    const website=node('a','sv-place-manual-map','Сайт заведения ↗');
    website.href=place.websiteURL;website.target='_blank';website.rel='noopener noreferrer';panel.append(website);
   }
  }else if(choices.length){
   card.classList.add('sv-place-choices');
   card.append(node('p','sv-place-choice-intro',choicesNearby?
    'Сначала ближайшие'+(proposal?.city?' в городе '+proposal.city:' к тебе')+'. Выбери нужное:':
    proposal?.city?'Нашла места в городе '+proposal.city+'. Выбери нужное:':'Нашла несколько похожих мест. Выбери нужное:'));
   for(const candidate of (choicesExpanded?choices:choices.slice(0,5))){
    const option=node('button','sv-place-choice');option.type='button';
    option.append(node('strong','',candidate.name),node('small','',candidate.address));
    option.addEventListener('click',()=>{place=candidate;confirmed=false;choices=[];choicesExpanded=false;status='found';render();resolvePlacePhoto();window.dispatchEvent(new Event('seyveo:task-place-updated'))});
    card.append(option);
   }
   if(!choicesExpanded&&choices.length>5){
    const more=node('button','sv-place-refine-trigger','Показать ещё');more.type='button';
    more.addEventListener('click',()=>{choicesExpanded=true;render()});card.append(more);
   }
   const other=node('button','sv-place-refine-trigger',refining?'Отмена':'Другой адрес');other.type='button';
   other.setAttribute('aria-expanded',String(refining));
   other.addEventListener('click',()=>{refining=!refining;render()});card.append(other);
  }else{
   const copy=node('div','sv-place-copy');
   const headline=proposal?.label||'Место пока не указано';
   copy.append(node('strong','sv-place-name',headline));
   const text=status==='loading'?'Ищу адрес и точку на карте…':
    status==='city'?'Укажи город — Сэйви найдёт место рядом, а не по всей России.':
    status==='not-found'?'Точный адрес не найден. Уточни название или город в тексте.':
    status==='restart'?'Сервер SEYVEO работает в старой версии. Перезапусти его для поиска мест.':
    status==='error'?'Не удалось связаться с картой. Можно проверить адрес вручную.':
    status==='permission'?'Для поиска адреса нужно разрешение.':
    proposal?'Сэйви проверит адрес, когда закончишь ввод.':'Добавь название кафе или адрес — Сэйви найдёт место.';
   copy.append(node('p','sv-place-address',text));card.append(copy);
   if(proposal&&status!=='loading'&&status!=='restart'&&status!=='city'){
    const retry=node('button','sv-place-retry',status==='idle'?'Найти на карте':'Проверить снова');
    retry.type='button';retry.addEventListener('click',lookup);card.append(retry);
   }
  }
  if(cityEditing&&proposal&&!proposal.explicitCity){
   const row=node('div','sv-place-refine-row');
   const input=node('input','sv-place-refine-input');input.type='text';input.maxLength=60;
   input.value=proposal.city||'';input.placeholder='Город';input.setAttribute('aria-label','Город поиска');
   const apply=node('button','sv-place-refine-apply','Найти');apply.type='button';
   apply.addEventListener('click',()=>{
    const city=input.value.replace(/\s+/gu,' ').trim();
    if(!places.setPreferredCity(city))return;
    proposal=places.extract(title.value,{city});query=proposal?.query||'';sourceQuery=query;
    request++;photoRequest++;place=null;confirmed=false;choices=[];choicesExpanded=false;choicesNearby=false;status='idle';cityEditing=false;refining=false;
    render();void lookup();
   });
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply.click()}});
   row.append(input,apply);panel.append(row);
  }
  if(refining&&proposal){
   const row=node('div','sv-place-refine-row');
   const input=node('input','sv-place-refine-input');input.type='text';input.maxLength=140;
   input.value=refineText;input.addEventListener('input',()=>{refineText=input.value});
   input.placeholder='Улица или точный адрес';input.setAttribute('aria-label','Уточнить место встречи');
   const apply=node('button','sv-place-refine-apply','Найти');apply.type='button';
   apply.addEventListener('click',()=>{
    const detail=input.value.replace(/\s+/gu,' ').trim();
    if(detail.length<4)return;
    const base=proposal.kind&&proposal.venueName?proposal.kind+' '+proposal.venueName+', '+detail:detail;
    proposal={...proposal,query:[base,proposal.city].filter(Boolean).join(', ').slice(0,140),
     explicitAddress:Boolean(!proposal.kind),locationHint:detail};
    query=proposal.query;place=null;confirmed=false;choices=[];choicesExpanded=false;choicesNearby=false;status='idle';refining=false;refineText='';
    void lookup();
   });
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply.click()}});
   row.append(input,apply);
   // Keep address refinement next to its trigger, before opening hours/menu.
   const strip=panel.querySelector('.sv-place-venue-details, .sv-place-manual-map');
   if(strip)panel.insertBefore(row,strip);
   else panel.append(row);
  }
 }
 function sync(){
  clearTimeout(searchTimer);
  closePhotoViewer();closeMapViewer();
  const next=places.extract(title.value);
  const nextQuery=next?.query||'';
  if(nextQuery!==sourceQuery){
   request++;photoRequest++;place=null;confirmed=false;choices=[];choicesExpanded=false;choicesNearby=false;status='idle';query=nextQuery;sourceQuery=nextQuery;refining=false;refineText='';cityEditing=false;
   proposal=next;
  }
  if(!proposal)proposal=next;
  render();
  if(proposal&&status==='idle'&&search?.hasPlaceConsent?.())searchTimer=setTimeout(()=>{
   if(dialog.open&&status==='idle')void lookup();
  },950);
 }
 async function lookup(){
  if(!proposal||!dialog.open||status==='loading')return;
  const sequence=++request,requestedQuery=query;
  status='loading';render();
  try{
   const result=await (search?.findPlace(proposal)||places.lookup(proposal));
   if(sequence!==request||requestedQuery!==query||!dialog.open)return;
   if(result?.consentRequired){status='permission';choices=[];place=null;confirmed=false}
   else if(result?.cityRequired){status='city';choices=[];place=null;confirmed=false;cityEditing=true}
   else if(result?.ambiguous&&Array.isArray(result.candidates)){
    choices=result.candidates.map(places.cleanPlace).filter(Boolean);
    choicesExpanded=false;choicesNearby=Boolean(result.nearby);
    place=null;confirmed=false;status=choices.length?'choose':'not-found';
   }else{place=places.cleanPlace(result);confirmed=Boolean(place&&proposal?.explicitAddress);choices=[];status=place?'found':'not-found'}
  }catch(error){
   if(sequence!==request||requestedQuery!==query||!dialog.open)return;
   status=error?.message==='seyveo-place-server-restart-needed'?'restart':'error';
  }
  render();resolvePlacePhoto();
  window.dispatchEvent(new Event('seyveo:task-place-updated'));
 }
 title.addEventListener('input',sync);
 title.addEventListener('blur',()=>{if(proposal&&status==='idle'&&search?.hasPlaceConsent?.())void lookup()});
 const openObserver=new MutationObserver(()=>{if(dialog.open)sync()});
 openObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('close',reset);
 window.SEYVEO_TASK_PLACE_EDITOR=Object.freeze({reset,load,suggest,placeForSave,lookup,sync});
})();
