import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const SOURCE=new URL('../../assets/felix-personal-context.js',import.meta.url);
const TODAY=new Date(2026,9,20,12,0,0);
function setup({events=[],tasks=[],notes=[],withDocument=false}={}){
 const calls={writes:0,reads:[],network:0,submit:null,events:[]};
 const store=new Map([
  ['seyveo-calendar-events-v1',JSON.stringify(events)],
  ['seyveo-personal-tasks-v1',JSON.stringify(tasks)],
  ['seyveo-life-spaces-v1',JSON.stringify([{title:'Чужие медицинские сведения',date:'2026-10-21'}])]
 ]);
 const window={
  localStorage:{
   getItem(k){calls.reads.push(k);return store.get(k)||null;},
   setItem(){calls.writes++;throw Error('No write permission');}
  },
  SEYVEO_NOTES_API:{getNotes(){return notes;}},
  fetch(){calls.network++;throw Error('No network permission');},
  SEYVEO_LOCAL_DIALOGUE:{turns:[]}
 };
 if(withDocument){
  const nodes=new Map();
  const question={value:'',dispatchEvent(event){calls.events.push(event.type);}};
  const overlay={hidden:true},stage={classList:{add(x){calls.events.push(x)}}};
  const panel={textContent:'',scrollTop:0,scrollHeight:0};
  nodes.set('question',question);
  nodes.set('orbInlineReplyText',panel);
  nodes.set('orbInlineReply',overlay);
  nodes.set('stage',stage);
  window.document={
   addEventListener(name,cb,capture){if(name==='submit'){assert.equal(capture,true);calls.submit=cb;}},
   getElementById(id){return nodes.get(id)||null;}
  };
  calls.nodes={question,overlay,stage,panel};
 }
 return {window,calls};
}
async function load(options={}){
 const env=setup(options);
 const source=await readFile(SOURCE,'utf8');
 runInNewContext(source,{window:env.window,Event:class Event{
  constructor(type){this.type=type}
 }}, {filename:'felix-personal-context.js',timeout:1500});
 return {...env,context:env.window.SEYVEO_FELIX_CONTEXT};
}

test('calendar agenda uses only local events and outstanding task deadlines on requested day',async()=>{
 const {context,calls}=await load({
  events:[
   {title:'Встреча с дизайнером',date:'2026-10-21',time:'16:00'},
   {title:'Согласование',date:'2026-10-21',time:'11:30'},
   {title:'Не на этот день',date:'2026-10-22'}
  ],
  tasks:[
   {title:'Позвонить клиенту',due:'2026-10-21',done:false},
   {title:'Уже выполнено',due:'2026-10-21',done:true}
  ]
 });
 const res=context.answer('Филя, что у меня завтра?',{storage:setup({
  events:[{title:'Встреча с дизайнером',date:'2026-10-21',time:'16:00'},
    {title:'Согласование',date:'2026-10-21',time:'11:30'}],
  tasks:[{title:'Позвонить клиенту',due:'2026-10-21',done:false},{title:'Уже выполнено',due:'2026-10-21',done:true}]
 }).window.localStorage,now:TODAY});
 assert.equal(res.kind,'calendar');
 assert.match(res.text,/2026-10-21/u);
 assert.match(res.text,/11:30 · Согласование/u);
 assert.match(res.text,/16:00 · Встреча с дизайнером/u);
 assert.match(res.text,/Позвонить клиенту/u);
 assert.ok(!res.text.includes('Уже выполнено'));
 assert.ok(!res.text.includes('Чужие медицинские сведения'));
 assert.equal(res.modelCalled,false);
 assert.equal(res.localOnly,true);
 assert.equal(calls.writes,0);
});

test('calendar reports empty days honestly and does not fetch future external events',async()=>{
 const {context,window,calls}=await load();
 const res=context.answer('Какие у меня планы на сегодня',{now:TODAY,storage:window.localStorage});
 assert.match(res.text,/не нашёл/u);
 assert.equal(calls.network,0);
 assert.ok(calls.reads.every(k=>['seyveo-calendar-events-v1','seyveo-personal-tasks-v1'].includes(k)));
});

test('notebook searches permitted text only, trims snippets and understands common word endings',async()=>{
 const {context,window}=await load({
  notes:[
   {id:'a',text:'Запланировать рекламную кампанию для SEYVEO.'},
   {id:'b',text:'Клиенту предложить макет сайта.'},
   {id:'c',paper:true,text:'Реклама по рукописному листу — не индексировать.'},
   {id:'d',paper:{strokes:[1]},text:'Реклама внутри бумаги — не индексировать.'}
  ]
 });
 const res=context.answer('Найди заметку про рекламу',{noteAPI:window.SEYVEO_NOTES_API});
 assert.match(res.text,/рекламную кампанию/u);
 assert.ok(!res.text.includes('не индексировать'));
 assert.ok(!res.text.includes('бумаги'));
 assert.equal(res.cloud,false);
 assert.equal(res.executed,false);
});

test('ordinary conversation, note writes, unknown personal categories cannot be intercepted',async()=>{
 const {context}=await load();
 for(const q of [
  'Привет, Филя','Как твои дела?','Филя, сохрани новую заметку',
  'Филя, запиши встречу завтра в 15:00',
  'Скажи мой пульс сегодня','Покажи заметки о здоровье',
  'Филя, что у меня в мире','Позвони маме'
 ])assert.equal(context.answer(q),null,q);
 assert.equal(context.parse('Филя, что у меня послезавтра?')?.shift,2);
 assert.equal(context.parse('Найди заметку про клиента')?.kind,'note-search');
});

test('capture-stage submit displays the local answer without submitting to Qwen or history',async()=>{
 const {context,window,calls}=await load({
  withDocument:true,
  notes:[{id:'abc',text:'Не забыть подготовить рекламу.'}]
 });
 assert.ok(context);
 assert.equal(typeof calls.submit,'function');
 const form={id:'ask',dataset:{composerMode:'ask'}};
 let prevented=0,stopped=0;
 calls.nodes.question.value='Найди заметку про рекламу';
 const event={target:form,preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}};
 calls.submit(event);
 assert.equal(prevented,1);
 assert.equal(stopped,1);
 assert.equal(calls.nodes.question.value,'');
 assert.match(calls.nodes.panel.textContent,/подготовить рекламу/u);
 assert.equal(calls.nodes.overlay.hidden,false);
 assert.equal(window.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
 assert.equal(calls.network,0);
 assert.equal(calls.writes,0);
 assert.equal(window.SEYVEO_LOCAL_CHAT_ACTIVE,true);
});

test('notes composer mode and unrelated messages fall through to approved existing handlers',async()=>{
 const {calls}=await load({withDocument:true});
 calls.nodes.question.value='Филя, что у меня завтра?';
 let stopped=0;
 const req={target:{id:'ask',dataset:{composerMode:'notes'}},
  preventDefault(){stopped++},stopImmediatePropagation(){stopped++}};
 calls.submit(req);
 assert.equal(stopped,0);
 calls.nodes.question.value='Привет Филя';
 calls.submit({...req,target:{id:'ask',dataset:{composerMode:'ask'}}});
 assert.equal(stopped,0);
 assert.equal(calls.nodes.overlay.hidden,true);
});

test('pending local request does not reveal private data inside a competing answer',async()=>{
 const {window,calls}=await load({withDocument:true,notes:[{id:'p',text:'Секретная реклама фирмы'}]});
 window.SEYVEO_LOCAL_PENDING=true;
 calls.nodes.question.value='Найди заметку про рекламу';
 calls.submit({
  target:{id:'ask',dataset:{composerMode:'ask'}},
  preventDefault(){},stopImmediatePropagation(){}
 });
 assert.match(calls.nodes.panel.textContent,/ещё отвечает/u);
 assert.ok(!calls.nodes.panel.textContent.includes('Секретная'));
 assert.equal(calls.nodes.question.value,'Найди заметку про рекламу');
});


async function loadWithDraftParsers(options={}){
 const env=setup(options);
 const context={
  window:env.window,
  Event:class Event{constructor(type){this.type=type}}
 };
 for(const name of ['calendar-natural.js','notebook-natural.js','felix-personal-context.js']){
  const source=await readFile(new URL('../../assets/'+name,import.meta.url),'utf8');
  runInNewContext(source,context,{filename:name,timeout:1500});
 }
 return {...env,context:env.window.SEYVEO_FELIX_CONTEXT};
}

test('Felix can prepare a real Calendar/Notebook draft without a second storage implementation',async()=>{
 const {window,context}=await loadWithDraftParsers();
 const examples=[
  ['Филя, запиши встречу завтра в 10:00','calendar-draft','запиши встречу завтра в 10:00'],
  ['Филя запиши встречу завтра в 10:00','calendar-draft','запиши встречу завтра в 10:00'],
  ['Феликс, назначь встречу на 23 октября в 12:30','calendar-draft','назначь встречу на 23 октября в 12:30'],
  ['Филя, запомни мысль: проверить рекламу','note-draft','запомни мысль: проверить рекламу'],
  ['Филя, запиши в блокнот: подготовить письмо','note-draft','запиши в блокнот: подготовить письмо']
 ];
 for(const [q,kind,command] of examples){
  const match=context.draftCommand(q);
  assert.equal(match?.kind,kind,q);
  assert.equal(match.command,command,q);
  assert.equal(match.status,'ready',q);
 }
 assert.equal(window.SEYVEO_NOTE_NL('запомни мысль: проверить рекламу').text,'проверить рекламу');
 const expected=window.SEYVEO_CALENDAR_NL('запиши встречу завтра в 10:00',new Date(2026,9,20));
 assert.equal(expected.date,'2026-10-21');
 assert.equal(expected.time,'10:00');
});

test('draft aliases only change the question so existing app displays review before Save',async()=>{
 const {context,window,calls}=await loadWithDraftParsers({withDocument:true});
 const form={id:'ask',dataset:{composerMode:'ask'}};
 const event={target:form,preventDefault(){throw Error('draft must reach existing handler')},
  stopImmediatePropagation(){throw Error('draft must reach existing handler')}};
 for(const [q,expected] of [
  ['Филя, запиши встречу завтра в 10:00','запиши встречу завтра в 10:00'],
  ['Филя, запомни мысль: проверить рекламу','запомни мысль: проверить рекламу']
 ]){
  calls.nodes.question.value=q;
  calls.submit(event);
  assert.equal(calls.nodes.question.value,expected);
 }
 assert.equal(calls.writes,0);
 assert.equal(calls.network,0);
 assert.equal(window.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
 assert.equal(calls.nodes.overlay.hidden,true);
 assert.equal(context.draftCommand('Привет, Филя'),null);
 assert.equal(context.draftCommand('Филя, запомни: это для памяти'),null);
});

test('multiline note drafts preserve original text and never leak to model',async()=>{
 const {calls,window,context}=await loadWithDraftParsers({withDocument:true});
 const phrase='Филя, запомни мысль:\nПервая строка\nВторая строка';
 const selected=context.draftCommand(phrase);
 assert.equal(selected.kind,'draft-clarify');
 calls.nodes.question.value=phrase;
 let stopped=0;
 calls.submit({target:{id:'ask',dataset:{composerMode:'ask'}},
  preventDefault(){stopped++},stopImmediatePropagation(){stopped++}});
 assert.equal(stopped,2);
 assert.equal(calls.nodes.question.value,phrase);
 assert.match(calls.nodes.panel.textContent,/переносами строк/u);
 assert.equal(calls.nodes.overlay.hidden,false);
 assert.equal(window.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
 assert.equal(calls.network,0);
 assert.equal(calls.writes,0);
});

test('missing local parser safely refuses explicit event and note drafts',async()=>{
 const {context,window}=await load({withDocument:true});
 assert.equal(context.draftCommand('Филя, запиши встречу завтра в 10:00')?.kind,'draft-clarify');
 assert.equal(context.draftCommand('Филя, запомни мысль: проверить рекламу')?.kind,'draft-clarify');
 assert.equal(context.draftCommand('Филя, расскажи анекдот'),null);
 assert.equal(context.draftCommand('Филя, заплати клиенту'),null);
 assert.equal(context.draftCommand('Филя, сохрани в блокнот: секрет')?.kind,'draft-clarify');
});

test('draft capture does not execute in the direct-notes composer mode',async()=>{
 const {calls}=await loadWithDraftParsers({withDocument:true});
 calls.nodes.question.value='Филя, запиши встречу завтра в 10:00';
 let blocked=0;
 calls.submit({target:{id:'ask',dataset:{composerMode:'notes'}},
  preventDefault(){blocked++},stopImmediatePropagation(){blocked++}});
 assert.equal(blocked,0);
 assert.equal(calls.nodes.question.value,'Филя, запиши встречу завтра в 10:00');
});
