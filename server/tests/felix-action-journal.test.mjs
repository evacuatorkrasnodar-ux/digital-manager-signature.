import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const SRC=new URL('../../assets/felix-action-journal.js',import.meta.url);
async function setup({store,notes:initialNotes=[]}={}){
 const storage=store||new Map();
 let notes=initialNotes.slice(),writes=0,networkCalls=0;
 const handlers=new Map(),windows=new Map(),timers=[];
 const nodes={
  question:{value:'',dispatchEvent(){}},
  orbInlineReplyText:{textContent:'',scrollHeight:1,scrollTop:0},
  orbInlineReply:{hidden:true},
  stage:{classList:{add(){}}},
  calendarEventDialog:{open:true,addEventListener(type,fn){handlers.set('calendar:'+type,fn)}},
  noteReviewDialog:{open:true,dataset:{noteMode:'draft'},addEventListener(type,fn){handlers.set('note:'+type,fn)}},
  calendarEventName:{value:'Встреча с клиентом'},
  calendarEventDate:{value:'2026-10-21'},
  calendarEventTime:{value:'10:00'},
  calendarEventStatus:{textContent:''},
  noteReviewText:{value:'Секретный бизнес-план компании'},
  noteReviewStatus:{textContent:'',hidden:true}
 };
 const root={
  localStorage:{
   getItem(k){return storage.get(k)||null},
   setItem(k,v){writes++;storage.set(k,v)}
  },
  SEYVEO_NOTES_API:{getNotes(){return notes.slice()}},
  SEYVEO_LOCAL_DIALOGUE:{turns:[]},
  document:{
   readyState:'complete',
   getElementById(id){return nodes[id]||null},
   addEventListener(name,fn){const all=handlers.get(name)||[];all.push(fn);handlers.set(name,all)}
  },
  addEventListener(name,fn){windows.set(name,fn)},
  setTimeout(fn,delay){timers.push({fn,delay})}
 };
 const source=await readFile(SRC,'utf8');
 runInNewContext(source,{window:root,Event:class Event{
  constructor(type){this.type=type}
 }}, {filename:'felix-action-journal.js',timeout:2000});
 const journal=root.SEYVEO_FELIX_JOURNAL;
 const tick=()=>{const queued=timers.splice(0);for(const timer of queued)timer.fn()};
 function submit(id){
  let prevented=0,stopped=false;
  const ev={target:{id,dataset:{composerMode:'ask'}},
   preventDefault(){prevented++},
   stopImmediatePropagation(){stopped=true}};
  for(const fn of handlers.get('submit')||[]){fn(ev);if(stopped)break}
  return prevented;
 }
 const fire=(name)=>windows.get(name)?.();
 const close=(kind)=>{
  nodes[kind==='calendar'?'calendarEventDialog':'noteReviewDialog'].open=false;
  handlers.get(kind+':close')?.();
 };
 return {journal,root,store:storage,nodes,submit,fire,close,tick,
  setNotes(next){notes=next;},
  get writes(){return writes},
  get networkCalls(){return networkCalls}
 };
}
test('a draft is prepared first and requires visible confirmation before awaiting state',async()=>{
 const d=await setup();
 const item=d.journal.begin('calendar');
 assert.equal(item.status,'prepared');
 assert.equal(d.journal.entries()[0].status,'prepared');
 assert.equal(d.journal.entries()[0].label,'Событие Календаря');
 d.tick();
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 assert.match(d.journal.format(),/Ожидаю подтверждения/u);
 assert.equal(d.journal.entries().length,1);
 assert.equal(d.root.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
});
test('saving a verified NEW calendar record is required for completed; unrelated change cannot complete',async()=>{
 const d=await setup();
 d.journal.begin('calendar');d.tick();d.submit('calendarEventForm');
 d.store.set('seyveo-calendar-events-v1',JSON.stringify([
  {id:'unrelated',date:'2026-10-22',time:'10:00',title:'Другое событие'}
 ]));
 d.fire('seyveo:calendar-changed');
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 d.store.set('seyveo-calendar-events-v1',JSON.stringify([
  {id:'unrelated',date:'2026-10-22',time:'10:00',title:'Другое событие'},
  {id:'new',date:'2026-10-21',time:'10:00',title:'Встреча с клиентом'}
 ]));
 d.fire('seyveo:calendar-changed');
 assert.equal(d.journal.entries()[0].status,'completed');
 d.close('calendar');
 assert.equal(d.journal.entries()[0].status,'completed');
});
test('notebook requires a matching confirmed note; personal text never persists in journal',async()=>{
 const d=await setup();
 d.journal.begin('note');d.tick();
 d.submit('noteReviewForm');
 d.setNotes([{id:'someone-else',text:'Unrelated text'}]);
 d.fire('seyveo:notes-changed');
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 d.setNotes([
  {id:'new-note',text:'Секретный бизнес-план компании'},
  {id:'someone-else',text:'Unrelated text'}
 ]);
 d.fire('seyveo:notes-changed');
 assert.equal(d.journal.entries()[0].status,'completed');
 assert.equal(d.journal.entries()[0].label,'Запись в Блокнот');
 assert.ok(!JSON.stringify(d.journal.entries()).includes('Секретный'));
 assert.ok(!d.store.get('seyveo-felix-action-journal-v1').includes('Секретный'));
 assert.equal(d.networkCalls,0);
});
test('dismissed draft shows cancelled, but never completed',async()=>{
 const d=await setup();
 d.journal.begin('calendar');d.tick();
 d.close('calendar');
 assert.equal(d.journal.entries()[0].status,'cancelled');
 assert.match(d.journal.format(),/Отменено/u);
});
test('form validation failure reports failed, and retry may still complete on actual save',async()=>{
 const d=await setup();
 d.journal.begin('note');d.tick();
 d.submit('noteReviewForm');
 d.nodes.noteReviewStatus.textContent='Не удалось сохранить. Проверьте память.';
 d.nodes.noteReviewStatus.hidden=false;
 d.tick();
 assert.equal(d.journal.entries()[0].status,'failed');
 d.nodes.noteReviewStatus.textContent='';
 d.nodes.noteReviewStatus.hidden=true;
 d.submit('noteReviewForm');
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 d.setNotes([{id:'finally-saved',text:'Секретный бизнес-план компании'}]);
 d.fire('seyveo:notes-changed');
 assert.equal(d.journal.entries()[0].status,'completed');
});
test('journal command uses the original response panel and does not invoke model or memory',async()=>{
 const d=await setup();
 d.journal.begin('calendar');d.tick();
 d.nodes.question.value='Филя, журнал действий';
 assert.equal(d.submit('ask'),1);
 assert.match(d.nodes.orbInlineReplyText.textContent,/Событие Календаря/u);
 assert.match(d.nodes.orbInlineReplyText.textContent,/Ожидаю подтверждения/u);
 assert.equal(d.nodes.question.value,'');
 assert.equal(d.nodes.orbInlineReply.hidden,false);
 assert.equal(d.root.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
 assert.equal(d.networkCalls,0);
});
test('reload marks unfinished drafts cancelled instead of falsely pending',async()=>{
 const store=new Map();
 const d=await setup({store});
 d.journal.begin('note');d.tick();
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 const next=await setup({store});
 assert.equal(next.journal.entries()[0].status,'cancelled');
 assert.match(next.journal.format(),/Сеанс был прерван/u);
});
test('journal never records external integrations, arbitrary data, or completed without submit',async()=>{
 const d=await setup();
 assert.equal(d.journal.begin('bank'),null);
 d.journal.begin('calendar');
 d.tick();
 d.store.set('seyveo-calendar-events-v1',JSON.stringify([
  {id:'added-without-approval',date:'2026-10-21',time:'10:00',title:'Встреча с клиентом'}
 ]));
 d.fire('seyveo:calendar-changed');
 assert.equal(d.journal.entries()[0].status,'awaiting_confirmation');
 assert.equal(d.journal.entries().length,1);
 assert.equal(d.writes>0,true);
});
