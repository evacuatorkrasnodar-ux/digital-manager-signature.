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
 let proposal=null,place=null,confirmed=false,choices=[],query='',sourceQuery='',status='idle',request=0,photoRequest=0,searchTimer=0,refining=false,refineText='',cityEditing=false;
 const node=(tag,cls,text)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;
  return el;
 };
 function reset(){
  clearTimeout(searchTimer);
  request++;photoRequest++;proposal=null;place=null;confirmed=false;choices=[];query='';sourceQuery='';status='idle';refining=false;refineText='';cityEditing=false;
  panel.replaceChildren();panel.hidden=true;
 }
 function load(saved){
  place=places.cleanPlace(saved);confirmed=Boolean(place);choices=[];proposal=places.extract(title.value);
  query=proposal?.query||'';sourceQuery=query;status=place?'found':'idle';request++;render();resolvePlacePhoto();
 }
 function placeForSave(){return confirmed?places.cleanPlace(place):null}
 async function resolvePlacePhoto(){
  if(!place||place.photo||!place.wikidata)return;
  const token=++photoRequest,target=place;
  const updated=await (search?.findPlacePhoto(target)||places.resolvePhoto(target));
  if(token!==photoRequest||!dialog.open||!place||place.lat!==target.lat||place.lon!==target.lon)return;
  if(updated?.photo){place=updated;render()}
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
    const photo=document.createElement('a');photo.className='sv-place-photo-link';
    photo.href='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(place.photo);
    photo.target='_blank';photo.rel='noopener noreferrer';photo.title='Фото из Wikimedia Commons';
    const img=document.createElement('img');img.src=photoURL;img.loading='lazy';
    img.alt='Фотография места из Wikimedia Commons';img.addEventListener('error',()=>photo.remove(),{once:true});
    photo.append(img);visual.append(photo);
   }
   const link=document.createElement('a');link.className='sv-place-map';
   link.href=places.fullMapURL(place);link.target='_blank';link.rel='noopener noreferrer';
   link.setAttribute('aria-label','Открыть место на OpenStreetMap');
   const narrow=window.matchMedia('(max-width:370px)').matches;
   for(const tile of places.mapTiles(place,narrow?96:112,narrow?88:96)){
    const img=document.createElement('img');img.className='sv-place-map-tile';img.loading='lazy';
    img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';
    // OSM tile servers require an identifying Referer; the page-wide private
    // no-referrer policy was causing an "Access blocked" picture in the map.
    img.referrerPolicy='strict-origin-when-cross-origin';img.src=tile.url;
    img.style.left=tile.left+'px';img.style.top=tile.top+'px';link.append(img);
   }
   link.append(node('span','sv-place-map-pin','●'));
   visual.append(link);card.append(visual);
   if(!confirmed){
    const actions=node('div','sv-place-confirm-actions');
    const accept=node('button','sv-place-confirm','Это место');accept.type='button';
    accept.addEventListener('click',()=>{confirmed=true;refining=false;refineText='';render();window.dispatchEvent(new Event('seyveo:task-place-updated'))});
    const change=node('button','sv-place-refine-trigger','Другой адрес');change.type='button';
    change.addEventListener('click',()=>{refining=!refining;render()});
    actions.append(accept,change);panel.append(actions);
   }
  }else if(choices.length){
   card.classList.add('sv-place-choices');
   card.append(node('p','sv-place-choice-intro',proposal?.city?'Нашла места в городе '+proposal.city+'. Выбери нужное:':'Нашла несколько похожих мест. Уточни город:'));
   for(const candidate of choices){
    const option=node('button','sv-place-choice');option.type='button';
    option.append(node('strong','',candidate.name),node('small','',candidate.address));
    option.addEventListener('click',()=>{place=candidate;confirmed=false;choices=[];status='found';render();resolvePlacePhoto();window.dispatchEvent(new Event('seyveo:task-place-updated'))});
    card.append(option);
   }
   const other=node('button','sv-place-refine-trigger','Другой адрес');other.type='button';
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
   if(proposal&&(status==='error'||status==='not-found'||status==='restart')){
    const fallback=node('a','sv-place-manual-map','Найти в картах ↗');
    fallback.href='https://www.openstreetmap.org/search?query='+encodeURIComponent(proposal.query);
    fallback.target='_blank';fallback.rel='noopener noreferrer';panel.append(fallback);
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
    request++;photoRequest++;place=null;confirmed=false;choices=[];status='idle';cityEditing=false;refining=false;
    render();void lookup();
   });
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply.click()}});
   row.append(input,apply);panel.append(row);
  }
  if(refining&&proposal){
   const row=node('div','sv-place-refine-row');
   const input=node('input','sv-place-refine-input');input.type='text';input.maxLength=140;
   input.value=refineText;input.addEventListener('input',()=>{refineText=input.value});
   input.placeholder='Улица, район или точный адрес';input.setAttribute('aria-label','Уточнить место встречи');
   const apply=node('button','sv-place-refine-apply','Найти');apply.type='button';
   apply.addEventListener('click',()=>{
    const detail=input.value.replace(/\s+/gu,' ').trim();
    if(detail.length<4)return;
    const base=proposal.kind&&proposal.venueName?proposal.kind+' '+proposal.venueName+', '+detail:detail;
    proposal={...proposal,query:base.slice(0,140),city:'',explicitAddress:Boolean(!proposal.kind)};
    query=proposal.query;place=null;confirmed=false;choices=[];status='idle';refining=false;refineText='';
    void lookup();
   });
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply.click()}});
   row.append(input,apply);panel.append(row);
  }
 }
 function sync(){
  clearTimeout(searchTimer);
  const next=places.extract(title.value);
  const nextQuery=next?.query||'';
  if(nextQuery!==sourceQuery){
   request++;photoRequest++;place=null;confirmed=false;choices=[];status='idle';query=nextQuery;sourceQuery=nextQuery;refining=false;refineText='';cityEditing=false;
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
 window.SEYVEO_TASK_PLACE_EDITOR=Object.freeze({reset,load,placeForSave,lookup,sync});
})();
