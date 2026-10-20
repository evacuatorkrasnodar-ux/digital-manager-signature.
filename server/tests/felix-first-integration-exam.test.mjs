import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

// A synthetic browser protocol exam. It uses REAL Felix parsers, action journal,
// Calendar agenda and Notebook search. It simulates the existing Save button;
// it does NOT substitute for real-browser or user-device acceptance testing.
async function exam(){
 const memory=new Map(),listeners=new Map(),timers=[];
 let notes=[],requests=0,storageWrites=0;
 const controls={
  question:{value:'',dispatchEvent(){}},
  orbInlineReplyText:{textContent:'',scrollTop:0,scrollHeight:0},
  orbInlineReply:{hidden:true},
  stage:{classList:{add() {}}},
  calendarEventDialog:{open:false,addEventListener(k,fn){listeners.set('cal:'+k,fn)}},
  noteReviewDialog:{open:false,dataset:{noteMode:'new'},addEventListener(k,fn){listeners.set('note:'+k,fn)}},
  calendarEventName:{value:''},calendarEventDate:{value:''},
  calendarEventTime:{value:''},calendarEventStatus:{textContent:''},
  noteReviewText:{value:''},noteReviewStatus:{textContent:'',hidden:true}
 };
 const root={
  document:{
   readyState:'complete',
   getElementById(id){return controls[id]},
   addEventListener(k,fn){listeners.set(k,[...(listeners.get(k)||[]),fn])}
  },
  localStorage:{
   getItem(k){return memory.get(k)||null},
   setItem(k,v){storageWrites++;memory.set(k,v)}
  },
  SEYVEO_NOTES_API:{getNotes(){return notes.slice()}},
  SEYVEO_LOCAL_DIALOGUE:{turns:[]},
  SEYVEO_CHAT_HISTORY:{add(){throw Error('A private draft must never enter model chat history')}},
  fetch(){requests++;throw Error('Network calls are forbidden in private exam')},
  setTimeout(fn){timers.push(fn)},
  addEventListener(k,fn){listeners.set('window:'+k,fn)}
 };
 const ctx={window:root,Event:class Event{constructor(type){this.type=type}}};
 for(const filename of ['calendar-natural.js','notebook-natural.js',
  'felix-action-journal.js','felix-personal-context.js']){
  const file=await readFile(new URL('../../assets/'+filename,import.meta.url),'utf8');
  runInNewContext(file,ctx,{filename,timeout:1200});
 }
 function fireSubmit(target,mode='ask'){
  let stopped=false,prevented=false;
  const event={
   target:{id:target,dataset:{composerMode:mode}},
   preventDefault(){prevented=true},
   stopImmediatePropagation(){stopped=true}
  };
  for(const fn of listeners.get('submit')||[]){
   fn(event);
   if(stopped)break;
  }
  return {stopped,prevented};
 }
 function tick(){
  const active=timers.splice(0);
  for(const fn of active)fn();
 }
 function beginFromFelix(phrase){
  controls.question.value=phrase;
  const dispatched=fireSubmit('ask');
  if(!dispatched.stopped){
   // The real app's native handler reads the now-normalized question
   // and opens its existing human-review form. The exam simulates only
   // those effects, never a save.
   const q=controls.question.value;
   const cal=root.SEYVEO_CALENDAR_NL(q);
   if(cal?.status==='ready'){
    controls.calendarEventDialog.open=true;
    controls.calendarEventName.value=cal.title;
    controls.calendarEventDate.value=cal.date;
    controls.calendarEventTime.value=cal.time;
   }else{
    const note=root.SEYVEO_NOTE_NL(q);
    if(note?.status==='ready'){
     controls.noteReviewDialog.open=true;
     controls.noteReviewText.value=note.text;
    }
   }
  }
  tick();
  return dispatched;
 }
 function saveCalendar(){
  assert.equal(controls.calendarEventDialog.open,true);
  fireSubmit('calendarEventForm');
  const old=JSON.parse(memory.get('seyveo-calendar-events-v1')||'[]');
  const rec={id:'synthetic-event-'+old.length,
   title:controls.calendarEventName.value,
   date:controls.calendarEventDate.value,time:controls.calendarEventTime.value};
  memory.set('seyveo-calendar-events-v1',JSON.stringify([...old,rec]));
  listeners.get('window:seyveo:calendar-changed')?.();
  controls.calendarEventDialog.open=false;
  listeners.get('cal:close')?.();
 }
 function saveNote(){
  assert.equal(controls.noteReviewDialog.open,true);
  fireSubmit('noteReviewForm');
  notes=[{id:'synthetic-note-'+notes.length,text:controls.noteReviewText.value},...notes];
  listeners.get('window:seyveo:notes-changed')?.();
  controls.noteReviewDialog.open=false;
  listeners.get('note:close')?.();
 }
 function cancelCalendar(){
  controls.calendarEventDialog.open=false;
  listeners.get('cal:close')?.();
 }
 const journal=root.SEYVEO_FELIX_JOURNAL;
 return {beginFromFelix,saveCalendar,saveNote,cancelCalendar,journal,root,controls,memory,
  fireSubmit,tick,get network(){return requests},get writes(){return storageWrites},
  get notes(){return notes}};
}

test('Felix Calendar: explicit request -> review form -> real local save -> agenda',async()=>{
 const app=await exam();
 app.beginFromFelix('Филя, запиши встречу 23.10.2030 в 10:00');
 assert.equal(app.controls.calendarEventDialog.open,true);
 assert.equal(app.journal.entries().at(-1).status,'awaiting_confirmation');
 assert.equal(app.memory.has('seyveo-calendar-events-v1'),false);
 assert.equal(app.controls.calendarEventTime.value,'10:00');
 app.saveCalendar();
 assert.equal(app.journal.entries().at(-1).status,'completed');
 const agenda=app.root.SEYVEO_FELIX_CONTEXT.answer('Филя, что у меня завтра?',{
  storage:app.root.localStorage,now:new Date(2030,9,22,12)
 });
 assert.match(agenda.text,/Встреча ·|Встреча/u);
 assert.match(agenda.text,/10:00/u);
 assert.equal(app.network,0);
 assert.equal(app.root.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
});
test('Felix Notebook: draft remains private until the real Save and is found thereafter',async()=>{
 const app=await exam();
 app.beginFromFelix('Филя, запомни мысль: обсудить рекламную кампанию');
 assert.equal(app.controls.noteReviewDialog.open,true);
 assert.equal(app.journal.entries().at(-1).status,'awaiting_confirmation');
 assert.equal(app.notes.length,0);
 app.saveNote();
 assert.equal(app.journal.entries().at(-1).status,'completed');
 const found=app.root.SEYVEO_FELIX_CONTEXT.answer('Филя, найди заметку про рекламу');
 assert.match(found.text,/рекламную кампанию/u);
 const audit=app.memory.get('seyveo-felix-action-journal-v1');
 assert.ok(!audit.includes('рекламную кампанию'));
 assert.equal(app.network,0);
 assert.equal(app.root.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
});
test('Closing unsaved Calendar draft is cancelled rather than completed',async()=>{
 const app=await exam();
 app.beginFromFelix('Филя, запиши встречу 23.10.2030 в 12:30');
 assert.equal(app.journal.entries().at(-1).status,'awaiting_confirmation');
 app.cancelCalendar();
 assert.equal(app.journal.entries().at(-1).status,'cancelled');
 assert.equal(app.memory.has('seyveo-calendar-events-v1'),false);
 assert.match(app.journal.format(),/Отменено/u);
});
test('Journal command is local read-only and does not call Qwen or copy note content',async()=>{
 const app=await exam();
 app.beginFromFelix('Филя, запомни мысль: очень личная заметка');
 app.controls.question.value='Филя, журнал действий';
 const ev=app.fireSubmit('ask');
 assert.equal(ev.stopped,true);
 assert.match(app.controls.orbInlineReplyText.textContent,/Журнал действий Феликса/u);
 assert.ok(!app.controls.orbInlineReplyText.textContent.includes('очень личная'));
 assert.equal(app.network,0);
 assert.equal(app.root.SEYVEO_LOCAL_DIALOGUE.turns.length,0);
});
test('Multiline or ambiguous content is not sent to model or silently saved',async()=>{
 const app=await exam();
 const phrase='Филя, запомни мысль:\nПервая строка\nВторая строка';
 const ev=app.beginFromFelix(phrase);
 assert.equal(ev.stopped,true);
 assert.equal(app.journal.entries().length,0);
 assert.equal(app.notes.length,0);
 assert.equal(app.controls.question.value,phrase);
 assert.equal(app.network,0);
 assert.match(app.controls.orbInlineReplyText.textContent,/переносами строк/u);
});
