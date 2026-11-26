/* SEYVEO · Optional, verified meeting-place suggestions. */
(()=>{
 'use strict';
 const places=window.SEYVEO_TASK_PLACES,hub=window.SEYVEO_SEARCH_HUB;
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 const dialog=document.getElementById('personalTaskDialog');
 const title=document.getElementById('personalTaskTitle');
 const placePanel=document.getElementById('svNewTaskPlacePanel');
 if(!places||!hub||!editor||!dialog||!title||!placePanel)return;
 const moods=[
  {id:'date',label:'Свидание',kind:'ресторан',hint:'романтический ресторан'},
  {id:'work',label:'Деловая',kind:'кафе',hint:'тихое кафе для деловой встречи'},
  {id:'friends',label:'С друзьями',kind:'кафе',hint:'кафе для встречи с друзьями'},
  {id:'family',label:'С семьёй',kind:'ресторан',hint:'семейный ресторан'},
  {id:'coffee',label:'Кофе',kind:'кофейня',hint:'кофейня'}
 ];
 function suggestedMood(value){
  if(/(?:свидан|романтическ|с девушкой|с парнем)/iu.test(value))return 'date';
  if(/(?:делов|переговор|поставщик|заказчик|клиент|партн[её]р|подрядчик|коллег|совещан)/iu.test(value))return 'work';
  if(/(?:семей|семь[еёйию]|с детьми|с ребёнком|с ребенком|с мамой|с папой)/iu.test(value))return 'family';
  if(/(?:с друз|с другом|с подругой|дружеск)/iu.test(value))return 'friends';
  if(/(?:кофе|кофей)/iu.test(value))return 'coffee';
  return '';
 }
 const section=document.createElement('section');section.className='sv-meeting-place-picker';section.hidden=true;
 section.setAttribute('aria-label','Сэйви подберёт место встречи');placePanel.after(section);
 let expanded=false,mood='',candidates=[],busy=false,note='',dismissed=false,token=0,visible=5,cityValue='';
 let timer=0;
 function node(tag,cls,copy){
  const el=document.createElement(tag);if(cls)el.className=cls;if(copy!==undefined)el.textContent=copy;return el;
 }
 function button(copy,click,cls=''){
  const el=node('button',cls,copy);el.type='button';el.addEventListener('click',click);return el;
 }
 function hasMeeting(){
  const value=String(title.value||'');
  return /(?:встреч|встрет|свидан|переговор|пообед|поужин|позавтрак|обед|ужин|посидим|кофе\s+с\s+)/iu.test(value)&&
   !/(?:^|\s)(?:в|во)\s+(?:кафе|ресторане|кофейне|баре|пиццерии|бистро)\b/iu.test(value);
 }
 function render(){
  section.hidden=!dialog.open||dismissed||!hasMeeting()||Boolean(places.extract(title.value))||Boolean(editor.hasPlace?.());
  section.replaceChildren();if(section.hidden)return;
  const top=node('div','sv-meeting-place-heading');
  const mark=node('img','sv-meeting-place-star');mark.src='assets/seyveo-sayvi-user-upload.svg?v=3';mark.alt='';
  const recommended=moods.find(item=>item.id===suggestedMood(title.value));
  top.append(mark,node('strong','',recommended?'Подберём место · '+recommended.label:'Подберём место для встречи?'));
  section.append(top);
  if(!expanded){
   section.append(button('Подобрать место',()=>{expanded=true;const city=cityValue||places.suggestedCity();if(recommended&&city)void choose(recommended);else render()},'sv-meeting-place-open'));
   return;
  }
  const currentCity=cityValue||places.suggestedCity();
  if(!currentCity){
   const row=node('div','sv-meeting-place-city');
   const input=node('input');input.type='text';input.maxLength=60;input.placeholder='В каком городе?';
   input.setAttribute('aria-label','Город для подбора места');
   const accept=()=>{
    const value=input.value.replace(/\s+/gu,' ').trim();
    if(!places.setPreferredCity(value)){note='Укажи город, например Краснодар.';render();return}
    cityValue=value;note='';render();
   };
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();accept()}});
   row.append(input,button('Найти',accept));section.append(row);
  }else{
   const chips=node('div','sv-meeting-place-moods');
   const preferred=suggestedMood(title.value);
   const ordered=[...moods].sort((a,b)=>Number(b.id===preferred)-Number(a.id===preferred));
   for(const item of ordered){
    chips.append(button(item.label,()=>void choose(item),
     'sv-meeting-place-mood'+(mood===item.id?' is-active':'')));
   }
   section.append(chips);
  }
  if(!mood){
   section.append(node('p','sv-meeting-place-muted',recommended?'Учла характер встречи. Можно выбрать другой вариант.':'Выбери характер встречи.'));
  }
  if(busy)section.append(node('p','sv-meeting-place-muted','Ищу места в справочнике…'));
  else if(candidates.length)section.append(node('p','sv-meeting-place-muted','Места по типу заведения. Атмосферу, цены и наличие столиков нужно уточнить.'));
  if(note)section.append(node('p','sv-meeting-place-muted',note));
  for(const candidate of candidates.slice(0,visible)){
   const option=button('',()=>{
    if(editor.suggest?.(candidate)){
     dismissed=true;render();window.dispatchEvent(new Event('seyveo:task-place-updated'));
    }
   },'sv-meeting-place-choice');
   option.append(node('strong','',candidate.name),node('small','',candidate.address));section.append(option);
  }
  if(candidates.length>visible)section.append(button('Показать ещё',()=>{visible+=5;render()},'sv-meeting-place-more'));
  section.append(button('Не сейчас',()=>{dismissed=true;render()},'sv-meeting-place-dismiss'));
 }
 async function choose(item){
  mood=item.id;note='';busy=true;candidates=[];visible=5;const sequence=++token;render();
  try{
   const city=cityValue||places.suggestedCity();
   const proposal={query:item.kind+', '+city,kind:item.kind,venueName:'',city,citySelected:Boolean(cityValue)};
   const found=await hub.findPlace(proposal);
   if(sequence!==token||!dialog.open||places.extract(title.value)||editor.hasPlace?.())return;
   if(found?.consentRequired)note='Разреши поиск мест, чтобы Сэйви показала реальные варианты.';
   else if(found?.cityRequired)note='Сначала укажи город.';
   else{
    const raw=found?.ambiguous?found.candidates:found?[found]:[];
    // Unnamed OSM objects such as three indistinguishable "Кафе" rows are
    // insufficient for a useful recommendation. Never invent venue names.
    const generic=/^(?:кафе|ресторан|кофейня|кофе|бар|паб|бистро|пиццерия|пекарня)$/iu;
    candidates=raw.map(places.cleanPlace).filter(value=>value&&!generic.test(value.name)).slice(0,15);
    if(!candidates.length)note='Пока нет проверенных вариантов. Уточни район или попробуй позже.';
   }
  }catch{if(sequence===token)note='Не удалось проверить заведения. Попробуй ещё раз позже.'}
  if(sequence===token){busy=false;render()}
 }
 function reset(){token++;expanded=false;mood='';candidates=[];busy=false;note='';dismissed=false;visible=5;cityValue='';render()}
 title.addEventListener('input',()=>{
  clearTimeout(timer);token++;mood='';candidates=[];note='';busy=false;dismissed=false;
  timer=setTimeout(render,620);
 });
 window.addEventListener('seyveo:task-place-updated',render);
 dialog.addEventListener('close',reset);
 new MutationObserver(()=>{if(dialog.open)reset()}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.SEYVEO_MEETING_PLACE_PICKER=Object.freeze({reset,render});
})();
