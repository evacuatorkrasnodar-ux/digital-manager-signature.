/* SEYVEO 2026-11-22 · Shared local poll UI for Work and Family chats.
   No server delivery, fabricated votes, remote identities or AI calls.
   The host chat owns persistence; this component only validates and renders. */
(function(){
'use strict';
if(window.SEYVEO_CHAT_POLLS)return;
const make=(tag,cls,txt)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=txt;
 return node;
};
const button=(label,fn,cls)=>{
 const node=make('button',cls,label);
 node.type='button';node.addEventListener('click',fn);return node;
};
const textValue=value=>String(value||'').trim();
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
const validPoll=p=>p&&Array.isArray(p.options)&&p.options.length>=2&&
 typeof p.question==='string'&&p.question.trim().length>0;
const cleanChoices=choices=>(choices||[]).map(textValue).filter(Boolean);
function openEditor({mount,onCreate,heading='Новый опрос'}){
 if(!mount||typeof onCreate!=='function')return;
 mount.querySelector('.sv-poll-overlay')?.remove();
 const overlay=make('div','sv-poll-overlay');
 const shade=make('button','sv-poll-shade');
 shade.type='button';shade.setAttribute('aria-label','Закрыть создание опроса');
 const form=make('form','sv-poll-editor');
 form.setAttribute('role','dialog');
 form.setAttribute('aria-modal','true');
 form.setAttribute('aria-label',heading);
 const top=make('div','sv-poll-editor-head');
 const cancel=button('Отмена',close,'sv-poll-editor-cancel');
 const title=make('strong',null,heading);
 top.append(cancel,title,make('span'));
 const label=make('label','sv-poll-editor-label','Вопрос');
 const question=make('input','sv-poll-editor-input');
 question.type='text';question.maxLength=140;question.required=true;
 question.placeholder='О чём спросим?';
 question.setAttribute('aria-label','Вопрос опроса');
 label.append(question);
 const optionsLabel=make('strong','sv-poll-editor-options-label','Варианты ответа');
 const inputs=make('div','sv-poll-editor-options');
 function addInput(value=''){
  if(inputs.children.length>=8)return;
  const row=make('div','sv-poll-editor-option-row');
  const field=make('input','sv-poll-editor-input');
  field.type='text';field.maxLength=100;
  field.placeholder='Вариант '+(inputs.children.length+1);
  field.setAttribute('aria-label',field.placeholder);
  field.value=value;
  const remove=button('×',()=>{
   if(inputs.children.length<=2)return;
   row.remove();refreshFields();
  },'sv-poll-editor-remove');
  remove.setAttribute('aria-label','Удалить вариант');
  row.append(field,remove);inputs.append(row);
  refreshFields();
 }
 function refreshFields(){
  Array.from(inputs.children).forEach((row,i)=>{
   const input=row.querySelector('input');
   input.placeholder='Вариант '+(i+1);
   input.setAttribute('aria-label',input.placeholder);
   row.querySelector('button').hidden=inputs.children.length<=2;
  });
  if(addChoice)addChoice.disabled=inputs.children.length>=8;
 }
 const addChoice=button('＋ Добавить вариант',()=>addInput(),'sv-poll-editor-add');
 addInput();addInput();
 const multi=make('label','sv-poll-editor-multiple');
 const multiCheck=make('input');multiCheck.type='checkbox';multiCheck.checked=true;
 multi.append(multiCheck,make('span',null,'Можно выбрать несколько вариантов'));
 const error=make('small','sv-poll-editor-error');error.setAttribute('role','alert');
 const footer=make('div','sv-poll-editor-footer');
 const submit=make('button','sv-poll-editor-submit','Создать опрос');submit.type='submit';
 footer.append(submit);
 form.append(top,label,optionsLabel,inputs,addChoice,multi,error,footer);
 overlay.append(shade,form);mount.append(overlay);
 const previousFocus=document.activeElement;
 let closed=false;
 function close(){
  if(closed)return;
  closed=true;document.removeEventListener('keydown',onKey,true);overlay.remove();
  if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
 }
 function onKey(e){
  if(e.key==='Escape'){e.preventDefault();close();}
  if(e.key==='Tab'){
   const focusables=Array.from(form.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled])'));
   const first=focusables[0],last=focusables[focusables.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 }
 document.addEventListener('keydown',onKey,true);
 shade.addEventListener('click',close);
 form.addEventListener('submit',event=>{
  event.preventDefault();error.textContent='';
  const values=Array.from(inputs.querySelectorAll('input')).map(node=>node.value.trim());
  const choices=cleanChoices(values);
  const unique=new Set(choices.map(value=>value.toLocaleLowerCase('ru-RU')));
  if(!question.value.trim()){error.textContent='Напиши вопрос.';question.focus();return;}
  if(choices.length<2){error.textContent='Нужно минимум два варианта.';return;}
  if(unique.size!==choices.length){error.textContent='Варианты не должны повторяться.';return;}
  const poll={
   id:uid(),question:question.value.trim(),
   multiple:multiCheck.checked,closed:false,
   options:choices.map(text=>({id:uid(),text,voters:[]}))
  };
  try{
   if(onCreate(poll)!==false)close();
   else error.textContent='Не получилось сохранить опрос на этом устройстве.';
  }catch(err){console.warn('SEYVEO local poll creation failed',err);error.textContent='Не получилось сохранить опрос.';}
 });
 // On touch phones, do not summon the keyboard before the user taps a field.
 if(window.matchMedia?.('(pointer:fine)').matches)question.focus({preventScroll:true});
 return {close,element:overlay};
}
function render({poll,currentUser='me',names={},canClose=false,onUpdate}){
 const shell=make('section','sv-poll-card');
 if(!validPoll(poll)){
  shell.append(make('span','sv-poll-error','Опрос недоступен'));return shell;
 }
 shell.setAttribute('aria-label','Опрос: '+poll.question);
 const header=make('div','sv-poll-card-head');
 header.append(make('span','sv-poll-eyebrow','ОПРОС'),make('span','sv-poll-mode',poll.closed?'Завершён':poll.multiple?'Несколько ответов':'Один ответ'));
 const title=make('strong','sv-poll-question',poll.question);
 const options=make('div','sv-poll-choices');
 shell.append(header,title,options);
 const setPoll=next=>{if(typeof onUpdate==='function')onUpdate(next)};
 const active=String(currentUser||'me');
 const allVoters=new Set();
 for(const option of poll.options)for(const v of Array.isArray(option.voters)?option.voters:[])allVoters.add(v);
 const total=allVoters.size;
 poll.options.slice(0,8).forEach((opt,i)=>{
  if(!opt||typeof opt.text!=='string')return;
  const voters=Array.isArray(opt.voters)?Array.from(new Set(opt.voters.map(String))):[];
  const selected=voters.includes(active);
  const row=button('',()=>{
   if(poll.closed)return;
   const next={...poll,options:poll.options.map(item=>{
    const own=Array.isArray(item.voters)?Array.from(new Set(item.voters.map(String))):[];
    const current=own.includes(active);
    if(item.id===opt.id)return {...item,voters:current?own.filter(x=>x!==active):[...own,active]};
    return poll.multiple?{...item,voters:own}:{...item,voters:own.filter(x=>x!==active)};
   })};
   setPoll(next);
  },'sv-poll-choice');
  row.setAttribute('aria-label',opt.text+': '+voters.length+' голосов');
  row.setAttribute('aria-pressed',String(selected));
  if(selected)row.classList.add('is-selected');
  if(poll.closed)row.disabled=true;
  const name=make('span','sv-poll-choice-name',opt.text);
  const side=make('span','sv-poll-choice-side');
  const avatars=make('span','sv-poll-voters');
  avatars.setAttribute('aria-label',voters.length?'Голосовали: '+voters.map(v=>names[v]||v).join(', '):'Никто не голосовал');
  voters.slice(0,3).forEach(id=>{
   const person=String(names[id]||id);
   const avatar=make('span','sv-poll-voter-avatar',person.charAt(0).toLocaleUpperCase('ru-RU'));
   avatar.title=person;avatars.append(avatar);
  });
  if(voters.length>3)avatars.append(make('span','sv-poll-voter-more','+'+(voters.length-3)));
  const tally=make('span','sv-poll-choice-count',voters.length?String(voters.length):'');
  const circle=make('span','sv-poll-choice-circle',selected?'✓':'');
  circle.setAttribute('aria-hidden','true');
  side.append(avatars,tally,circle);
  row.append(name,side);
  options.append(row);
 });
 const foot=make('div','sv-poll-card-footer');
 const sum=make('span','sv-poll-summary',total?total+' '+(total===1?'участник':'участников'):'Пока нет голосов');
 foot.append(sum);
 if(!poll.closed&&poll.options.length<8){
  const add=button('＋ Добавить вариант',()=>{
   if(add.parentNode?.querySelector('.sv-poll-add-row'))return;
   const wrap=make('form','sv-poll-add-row');
   const field=make('input');field.type='text';field.maxLength=100;
   field.placeholder='Новый вариант';field.required=true;
   field.setAttribute('aria-label','Новый вариант опроса');
   const save=make('button',null,'Добавить');save.type='submit';
   const cancel=button('×',()=>wrap.remove());
   cancel.setAttribute('aria-label','Отменить добавление варианта');
   wrap.append(field,save,cancel);
   wrap.addEventListener('submit',event=>{
    event.preventDefault();const value=field.value.trim();
    if(!value)return;
    if(poll.options.some(x=>x.text.toLocaleLowerCase('ru-RU')===value.toLocaleLowerCase('ru-RU'))){
     field.setCustomValidity('Такой вариант уже существует');field.reportValidity();return;
    }
    const next={...poll,options:[...poll.options,{id:uid(),text:value,voters:[]}]};
    setPoll(next);
   });
   field.addEventListener('input',()=>field.setCustomValidity(''));
   add.insertAdjacentElement('afterend',wrap);
   field.focus({preventScroll:true});
  },'sv-poll-add-choice');
  foot.append(add);
 }
 if(canClose&&!poll.closed){
  const close=button('Завершить',()=>{
   if(window.confirm('Завершить опрос? После этого голоса нельзя изменить.'))
    setPoll({...poll,closed:true});
  },'sv-poll-close');
  foot.append(close);
 }
 shell.append(foot);
 return shell;
}
window.SEYVEO_CHAT_POLLS=Object.freeze({openEditor,render,validPoll});
})();