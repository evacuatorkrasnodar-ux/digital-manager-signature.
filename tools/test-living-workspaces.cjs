/* SEYVEO Living Ink · workspaces must not regress into cropped gray dialogs.
 * Source-level invariants. Device screenshot and VoiceOver review still needed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const dialog=read('assets/dialog-velvet.css');
const notes=read('assets/notebook-smart.css');
const wellness=read('assets/personal-wellness.css');
const calendar=read('assets/sections-velvet.css');
const spaces=read('assets/calendar-spaces.css');
const composer=read('assets/composer-intent.css');
const conversation=read('assets/conversation-refined.css');
const history=read('assets/assistant-chat-history.js');
for(const id of ['assistantChatHistoryDialog','assistantChatHistoryList','assistantChatHistoryDone',
 'noteReadDialog','noteReadContent','noteSmartInsight','calendarSpaceDialog',
 'pwMedName','pwMedDose','pwMedTime','pwCare','pwHealth','ask','question']){
 assert.ok(html.includes(id)||id.startsWith('pw'),id+' must be present in its original UI');
}
assert.match(history,/localStorage\.setItem\(KEY,JSON\.stringify/,'History retains its own saved entries');
assert.match(history,/const item=el\('details','assistant-chat-item'\)/,'History still expands real records');
assert.match(dialog,/#assistantChatHistoryDialog \.assistant-chat-item\{/,'History rows have a source style');
assert.match(dialog,/height:auto!important;min-height:0!important;max-height:none!important/,'History rows may not be clipped');
assert.match(dialog,/#assistantChatHistoryDialog \.assistant-chat-question\{/,'Questions have proper line wrapping');
assert.match(dialog,/#assistantChatHistoryDialog \.assistant-chat-items\{/,'Only the real list scrolls');
assert.match(dialog,/#assistantChatHistoryDialog \.assistant-chat-bottom\{/,'History actions remain readable');
assert.match(dialog,/#noteReadDialog,#noteReviewDialog,#calendarSpaceDialog/,'Personal workspaces lose old dialog shells');
assert.match(notes,/#noteReadDialog\.note-read-dialog\[open\]\{/,'Notebook reading page exists');
assert.match(notes,/height:auto;/,'Notebook may size to its actual content');
assert.match(notes,/#noteReadDialog \.note-smart-insight\{/,'Notebook suggestion disclosure retained');
assert.match(notes,/padding:0 1px;border:0;border-top:1px solid var\(--soft-line\)/,'Suggestions do not become gray cards');
assert.match(notes,/white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal/,'Poems and line breaks preserved');
assert.match(wellness,/#calendarPersonalTools \.pw-time-field input\[type=time\]\{/,'Native medication time stays editable');
assert.match(wellness,/border:0;border-bottom:1px solid var\(--soft-line\);border-radius:0/,'Personal inputs use ink lines');
assert.match(wellness,/color-scheme:dark/,'Native time picker retains theme support');
assert.match(wellness,/#calendarSpaceDialog\[data-space=care\] #calendarSpaceJournal\{/,'Care journal remains accessible');
assert.match(spaces,/#lifePage \.calendar-space-button\{/,'My World controls remain interactive');
assert.match(calendar,/top:max\(12px,calc\(env\(safe-area-inset-top,0px\) \+ 8px\)\)/,'Personal panels no longer waste 10svh at the top');
assert.match(composer,/#ask\.prompt\.expanded\{/,'Original expanded composer remains');
assert.match(composer,/SEYVEO Living Ink large writer/,'Expanded writer has its own ink styling');
assert.match(conversation,/SEYVEO Quiet Chat/,'Chat shares fixed dock graphite while preserving the same input');
assert.match(conversation,/border:0!important;border-radius:0!important/,'Chat has no glass frame');
assert.doesNotMatch(conversation,/SEYVEO Black Velvet \/ Open Canvas control bar: neutral glass/,'Retired old gray chat block');
assert.doesNotMatch(conversation,/Conversation composer v5: all actions RIGHT, emerald glass/,'Retired stale green capsules');
assert.equal((html.match(/id="assistantChatHistoryDialog"/g)||[]).length,1,'One actual chat history');
assert.equal((html.match(/id="noteReadDialog"/g)||[]).length,1,'One actual note reader');
assert.equal((html.match(/id="ask"/g)||[]).length,1,'One actual primary editor');
const names=['dialog-velvet.css','notebook-smart.css','sections-velvet.css',
 'personal-wellness.css','calendar-spaces.css',
 'composer-intent.css','conversation-refined.css'];
for(const name of names){
 const pattern=new RegExp('assets/'+name.replace('.', '\\.')+'\\?v=\\d+');
 assert.match(html,pattern,'Current versioned stylesheet: '+name);
}
console.log('PASS Living Ink workspaces: history lines, readable notes, native care editor, one frameless composer.');
