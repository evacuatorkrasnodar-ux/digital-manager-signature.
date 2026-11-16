/* Voice requests keep short writing on Home and send rich content to chat. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const html=readFileSync(join(__dirname,'../index.html'),'utf8');
const first=html.indexOf('function showSpokenReply(');
const last=html.indexOf('function handleSpokenAssistant(',first);
assert.ok(first>0&&last>first,'the voice-only routing bridge exists');
assert.match(html,/notifyOrbPresence\('ack',\{reply:response\}\)/,
 'the actual answer is sent to the Home mini transcript');
const history=[],chat=[];
let canMini=true;
const window={
 SEYVEO_HOME_PRESENCE:{canDisplayReply:()=>canMini},
 SEYVEO_CHAT_HISTORY:{add:record=>history.push(record)}
};
const showWrittenReply=(question,answer,options)=>chat.push({question,answer,options});
const bridge=vm.runInNewContext(html.slice(first,last)+'\nshowSpokenReply;',{
 window,showWrittenReply
},{filename:'spoken-reply-bridge.js'});

assert.equal(bridge('Как дела?','Всё хорошо, я здесь.'),true);
assert.equal(history.length,1,'compact answer is saved in chat history');
assert.equal(history[0].kind,'voice-mini');
assert.equal(chat.length,0,'compact voice answer does not open full chat');

assert.equal(bridge('Покажи ссылку','Вот ссылка: https://seyveo.com'),false);
assert.equal(chat.length,1,'web link opens the real chat');
assert.equal(bridge('Прочитай документ','Документ находится в файле.pdf'),false);
assert.equal(chat.length,2,'file references stay in full chat');
assert.equal(bridge('Покажи снимок','Прикрепляю фотографию.'),false);
assert.equal(chat.length,3,'photo replies stay in full chat');
assert.equal(bridge('Расскажи подробно','Очень длинный ответ. '.repeat(20)),false);
assert.equal(chat.length,4,'long answers remain readable in the full chat');

assert.equal(bridge('Личное','Всё остаётся между нами.',{privateReply:true}),false);
assert.equal(history.length,1,'private voice answer is not persisted');
assert.equal(chat.length,5,'private answer stays in the full conversation');
canMini=false;
assert.equal(bridge('Когда есть карточки','Проверим в чате.'),false);
assert.equal(chat.length,6,'when Home mini is unavailable, use regular chat');

console.log('PASS: short voice answers stay under Sayvi; links, files, long or card views use chat.');
