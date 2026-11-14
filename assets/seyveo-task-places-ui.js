/* SEYVEO · Verified meeting location card in the smart-first New screen.
 * Not an address autocomplete: one lookup after the user commits the phrase. */
(()=>{
 'use strict';
 const places=window.SEYVEO_TASK_PLACES;
 const dialog=document.getElementById('personalTaskDialog');
 const title=document.getElementById('personalTaskTitle');
 const panel=document.getElementById('svNewTaskPlacePanel');
 if(!places||!dialog||!title||!panel)return;
 let proposal=null,place=null,choices=[],query='',status='idle',request=0,photoRequest=0;
 const node=(tag,cls,text)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;
  return el;
 };
 function reset(){
  request++;photoRequest++;proposal=null;place=null;choices=[];query='';status='idle';
  panel.replaceChildren();panel.hidden=true;
 }
 function load(saved){
  place=places.cleanPlace(saved);choices=[];proposal=places.extract(title.value);
  query=proposal?.query||'';status=place?'found':'idle';request++;render();resolvePlacePhoto();
 }
 function placeForSave(){return places.cleanPlace(place)}
 async function resolvePlacePhoto(){
  if(!place||place.photo||!place.wikidata)return;
  const token=++photoRequest,target=place;
  const updated=await places.resolvePhoto(target);
  if(token!==photoRequest||!dialog.open||!place||place.lat!==target.lat||place.lon!==target.lon)return;
  if(updated?.photo){place=updated;render()}
 }
 function render(){
  if(!dialog.open)return;
  const visible=Boolean(place||proposal);
  panel.hidden=!visible;panel.replaceChildren();if(!visible)return;
  const heading=node('div','sv-place-heading');
  heading.append(node('strong','','Место встречи'));
  if(place)heading.append(node('span','','Найдено на карте'));
  panel.append(heading);
  const card=node('div','sv-place-card');panel.append(card);
  if(place){
   const copy=node('div','sv-place-copy');
   copy.append(node('strong','sv-place-name',place.name));
   copy.append(node('p','sv-place-address',place.address));
   const photoURL=places.photoURL(place);
   if(photoURL){
    const photo=document.createElement('a');photo.className='sv-place-photo-link';
    photo.href='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(place.photo);
    photo.target='_blank';photo.rel='noopener noreferrer';photo.title='Фото из Wikimedia Commons';
    const img=document.createElement('img');img.src=photoURL;img.loading='lazy';
    img.alt='Фотография места из Wikimedia Commons';img.addEventListener('error',()=>photo.remove(),{once:true});
    photo.append(img);copy.append(photo);
   }
   card.append(copy);
   const link=document.createElement('a');link.className='sv-place-map';
   link.href=places.fullMapURL(place);link.target='_blank';link.rel='noopener noreferrer';
   link.setAttribute('aria-label','Открыть место на OpenStreetMap');
   const narrow=window.matchMedia('(max-width:370px)').matches;
   for(const tile of places.mapTiles(place,narrow?104:127,narrow?90:96)){
    const img=document.createElement('img');img.className='sv-place-map-tile';img.loading='lazy';
    img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';img.src=tile.url;
    img.style.left=tile.left+'px';img.style.top=tile.top+'px';link.append(img);
   }
   link.append(node('span','sv-place-map-pin','●'),node('span','sv-place-attribution','© OSM'));
   card.append(link);
   const credit=node('div','sv-place-credit');
   const source=document.createElement('a');source.href='https://www.openstreetmap.org/copyright';
   source.target='_blank';source.rel='noopener noreferrer';source.textContent='© OpenStreetMap contributors';
   credit.append(node('span','','Проверь адрес перед сохранением'),source);panel.append(credit);
  }else if(choices.length){
   card.classList.add('sv-place-choices');
   card.append(node('p','sv-place-choice-intro','Нашла несколько похожих мест. Выбери нужное:'));
   for(const candidate of choices){
    const option=node('button','sv-place-choice');option.type='button';
    option.append(node('strong','',candidate.name),node('small','',candidate.address));
    option.addEventListener('click',()=>{place=candidate;choices=[];status='found';render();resolvePlacePhoto()});
    card.append(option);
   }
  }else{
   const copy=node('div','sv-place-copy');
   const headline=proposal?.label||'Место пока не указано';
   copy.append(node('strong','sv-place-name',headline));
   const text=status==='loading'?'Ищу адрес и точку на карте…':
    status==='not-found'?'Точный адрес не найден. Уточни название или город в тексте.':
    status==='error'?'Поиск места временно недоступен. Можно сохранить дело без карты.':
    proposal?'Сэйви проверит адрес, когда закончишь ввод.':'Добавь название кафе или адрес — Сэйви найдёт место.';
   copy.append(node('p','sv-place-address',text));card.append(copy);
   if(proposal&&status!=='loading'){
    const retry=node('button','sv-place-retry',status==='idle'?'Найти на карте':'Проверить снова');
    retry.type='button';retry.addEventListener('click',lookup);card.append(retry);
   }
  }
 }
 function sync(){
  const next=places.extract(title.value);
  const nextQuery=next?.query||'';
  if(nextQuery!==query){
   request++;photoRequest++;place=null;choices=[];status='idle';query=nextQuery;
  }
  proposal=next;render();
 }
 async function lookup(){
  if(!proposal||!dialog.open||status==='loading')return;
  const sequence=++request,requestedQuery=query;
  status='loading';render();
  try{
   const result=await places.lookup(proposal);
   if(sequence!==request||requestedQuery!==query||!dialog.open)return;
   if(result?.ambiguous&&Array.isArray(result.candidates)){
    choices=result.candidates.map(places.cleanPlace).filter(Boolean);
    place=null;status=choices.length?'choose':'not-found';
   }else{place=places.cleanPlace(result);choices=[];status=place?'found':'not-found'}
  }catch{
   if(sequence!==request||requestedQuery!==query||!dialog.open)return;
   status='error';
  }
  render();resolvePlacePhoto();
 }
 title.addEventListener('input',sync);
 title.addEventListener('blur',()=>{if(proposal&&status==='idle')lookup()});
 dialog.addEventListener('close',reset);
 window.SEYVEO_TASK_PLACE_EDITOR=Object.freeze({reset,load,placeForSave,lookup,sync});
})();
