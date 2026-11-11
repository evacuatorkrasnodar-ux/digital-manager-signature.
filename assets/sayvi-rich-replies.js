/* SEYVEO Rich Replies · semantic formatting without rendering untrusted HTML.
 * Preserve the exact assistant source for exports, speech and copy.
 */
(()=>{
 'use strict';
 if(window.SEYVEO_RICH_REPLIES)return;
 const el=(tag,cls='',text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 function urlSafe(value){
  try{
   const url=new URL(value);
   return /^(?:https?:)$/u.test(url.protocol)&&url.hostname&&
    !url.username&&!url.password?url.href:null;
  }catch{return null}
 }
 function textParts(node,value){
  const input=String(value||''),regex=/(\[([^\]\n]{1,100})\]\((https?:\/\/[^\s)<>]{3,440})\)|\*\*([^*\n]+)\*\*|(https?:\/\/[^\s<>"']{5,500})|([\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[A-Za-z]{2,15}))/giu;
  let last=0,match;
  while((match=regex.exec(input))){
   if(match.index>last)node.append(document.createTextNode(input.slice(last,match.index)));
   if(match[4])node.append(el('strong','',match[4]));
   else if(match[3]||match[5]||match[6]){
    const email=!!match[6];
    const raw=match[3]||match[5]||match[6];
    const end=email?'':(raw.match(/[.,!?;:]+$/u)?.[0]||'');
    const cleaned=end?raw.slice(0,-end.length):raw;
    const url=email?'mailto:'+cleaned:urlSafe(cleaned);
    if(!url)node.append(document.createTextNode(match[0]));
    else{
     const a=el('a','sv-rich-link',match[2]||cleaned);
     a.href=url;
     if(!email){a.target='_blank';a.rel='noopener noreferrer'}
     node.append(a);
     if(end)node.append(document.createTextNode(end));
    }
   }else node.append(document.createTextNode(match[0]));
   last=regex.lastIndex;
  }
  if(last<input.length)node.append(document.createTextNode(input.slice(last)));
 }
 const naturalHeading=/^(?:Коротко|Главное|Что важно|Что делать дальше|Что изменилось|Что исправлено|Результат|Контакты|Адресат|Основной адресат|Надзорный орган|Вложения|Документы|Следующие шаги|Рекомендации|План действий|Проверка|Причины|Источники|Вывод|Итог|Важные детали|Как это работает|Пример|Варианты)\s*[:—]?$/iu;
 const itemPattern=/^\s{0,4}(?:([-*•])|(\d{1,2})[.)])\s+(.+)$/u;
 function blocks(parent,value){
  const lines=String(value||'').replace(/\r\n?/gu,'\n').slice(0,110000).split('\n');
  let paragraph=[],items=[],ordered=false,inCode=false,code=[];
  function flushP(){
   if(!paragraph.length)return;
   const p=el('p','sv-rich-p');textParts(p,paragraph.join('\n').trim());
   parent.append(p);paragraph=[];
  }
  function flushList(){
   if(!items.length)return;
   const group=el(ordered?'ol':'ul','sv-rich-list');
   for(const value of items){const li=el('li');textParts(li,value);group.append(li)}
   parent.append(group);items=[];
  }
  function flushCode(){
   if(!code.length)return;
   parent.append(el('pre','sv-rich-code',code.join('\n')));code=[];
  }
  for(let i=0;i<lines.length;i++){
   const line=lines[i],trimmed=line.trim();
   if(/^\x60{3}/u.test(trimmed)){
    flushP();flushList();
    if(inCode)flushCode();
    inCode=!inCode;continue;
   }
   if(inCode){code.push(line);continue}
   if(!trimmed){flushP();flushList();continue}
   if(/^(?:---+|___+|\*\*\*+)\s*$/u.test(trimmed)){
    flushP();flushList();parent.append(el('hr','sv-rich-rule'));continue;
   }
   const md=/^#{1,4}\s+(.+)$/u.exec(trimmed);
   const strong=/^\*\*([^*\n]{4,100})\*\*:?\s*$/u.exec(trimmed);
   const heading=md?.[1]||strong?.[1]||
    ((i===0||!lines[i-1].trim())&&naturalHeading.test(trimmed)&&lines[i+1]?.trim()?trimmed.replace(/[:—]$/u,''):null);
   if(heading&&heading.length<=100){
    flushP();flushList();
    const title=el('h3','sv-rich-heading');textParts(title,heading);
    parent.append(title);continue;
   }
   const item=itemPattern.exec(line);
   if(item){
    flushP();
    const isOrdered=!!item[2];
    if(items.length&&ordered!==isOrdered)flushList();
    ordered=isOrdered;items.push(item[3]);continue;
   }
   if(items.length&&/^\s{2,}\S/u.test(line)){
    items[items.length-1]+='\n'+trimmed;continue;
   }
   flushList();
   if(/^>\s?/u.test(trimmed)){
    flushP();const quote=el('blockquote','sv-rich-quote');
    textParts(quote,trimmed.replace(/^>\s?/u,''));parent.append(quote);continue;
   }
   paragraph.push(line);
  }
  flushP();flushList();flushCode();
 }
 function icon(name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.5');svg.setAttribute('aria-hidden','true');
  svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const paths={
   copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
   expand:'<path d="M9 4H4v5M15 20h5v-5M4 9l6-6M20 15l-6 6"/>'
  };
  svg.innerHTML=paths[name]||'';return svg;
 }
 function card(draft,actions){
  const holder=el('button','sv-rich-document-card');
  holder.type='button';
  holder.setAttribute('aria-label','Открыть документ для проверки и редактирования');
  const titleMatch=/^\s*(?:#{1,4}\s*)?(?:\*\*)?([^\n]{4,80})/u.exec(draft);
  const title=(titleMatch?.[1]||'Документ').replace(/\*\*/g,'').trim();
  const top=el('div','sv-rich-document-head');
  const sheet=el('span','sv-rich-document-sheet');
  sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 2.8h8.5L19 7.3V21H6zM14.5 2.8v4.5H19M9 12h7M9 15.5h7M9 19h5"/></svg>';
  const description=el('div','sv-rich-document-description');
  const name=el('strong','sv-rich-document-name',title.slice(0,70));
  const incomplete=/\[[^\]\n]{2,80}\]/u.test(draft);
  const subtitle=el('span','sv-rich-document-label',incomplete?'Нужно заполнить данные':'Подготовлен · проверь перед сохранением');
  description.append(name,subtitle);
  const arrow=el('span','sv-rich-document-chevron');arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
  top.append(sheet,description,arrow);
  holder.append(top);
  holder.addEventListener('click',()=>actions.preview?.());
  return holder;
 }
 function incompleteDocument(draft){
  return /\[[^\]\n]{2,80}\]/u.test(String(draft||''));
 }
 function render(bubble,source,options={}){
  if(!bubble)return;
  const text=String(source||'').slice(0,110000);
  bubble._sayviRawText=text;
  const draft=typeof options.draft==='string'?options.draft:'';
  const isRich=!!draft||text.length>240||/\n\s*\n/u.test(text)||
   /^(?:[-*•] |\d{1,2}[.)] |#{1,4} )/mu.test(text);
  if(!isRich){
   bubble.classList.remove('sv-rich','sv-rich-document');
   bubble.textContent=text;return;
  }
  const content=el('div','sv-rich-content');
  if(draft){
   const start=text.indexOf(draft);
   if(start>=0){
    const before=text.slice(0,start).replace(/(?:^|\n)\s*(?:---+|___+|\*\*\*+)\s*$/u,'').trim();
    const after=text.slice(start+draft.length).replace(/^\s*(?:---+|___+|\*\*\*+)\s*/u,'').trim();
    // The manuscript stays inside the document viewer, not repeated in chat.
    // A short neutral explanation replaces long preambles and follow-up prompts.
    const intro=incompleteDocument(draft)
     ?'Подготовила документ. В нём остались поля для заполнения.'
     :'Подготовила документ. Открой его, чтобы проверить текст и сохранить.';
    content.append(el('p','sv-rich-document-intro',intro));
    content.append(card(draft,options));
    // Preserve meaningful warnings without turning the chat into a second editor.
    const caution=[before,after].join(' ').match(/(?:проверь|обрати внимание|важно)[^.!?\n]{12,150}[.!?]?/iu);
    if(caution)content.append(el('p','sv-rich-document-hint',caution[0].trim()));
   }else content.append(card(draft,options));
   bubble.classList.add('sv-rich','sv-rich-document');
  }else{
   blocks(content,text);
   bubble.classList.add('sv-rich');bubble.classList.remove('sv-rich-document');
  }
  bubble.replaceChildren(content);
 }
 function raw(bubble){
  return typeof bubble?._sayviRawText==='string'?bubble._sayviRawText:bubble?.textContent||'';
 }
 function suggestions(text,draft,question){
  const q=String(question||'');
  if(text.length>14000||(!draft&&text.length<135))return [];
  if(draft){
   if(/письм|сообщен|ответ|электронн/iu.test(q+' '+draft.slice(0,300)))
    return [
     {label:'Сделай короче',query:'Сократи последнее подготовленное письмо, сохрани вежливый тон и важные сведения.'},
     {label:'Официальнее',query:'Перепиши последнее письмо официальнее, сохрани смысл и данные.'}
    ];
   return [
    {label:'Проверь документ',query:'Проверь последний подготовленный документ на ошибки, пропущенные данные и даты. Не выдумывай сведения.'},
    {label:'Исправить',query:'Помоги изменить последний подготовленный документ, сохрани все остальные сведения.'}
   ];
  }
  if(/как сделать|настрой|инструкц|по шагам|пошагово/iu.test(q))
   return [{label:'Объясни проще',query:'Объясни предыдущую инструкцию проще и короче, по шагам.'}];
  if(/почему|что значит|разниц|сравн/iu.test(q))
   return [{label:'Приведи пример',query:'Приведи один наглядный пример к предыдущему объяснению.'}];
  return [];
 }
 window.SEYVEO_RICH_REPLIES=Object.freeze({render,raw,suggestions,version:'1'});
})();