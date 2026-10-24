'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse,findMatches,isJuliaAlias}=require('../assets/contact-call-intent.js');
const cases=[
 ['Сэйви, позвони Юльчику','Юльчику'],
 ['сейви позвони юле','юле'],
 ['Сэйви! позвони, пожалуйста, Юльчику','Юльчику'],
 ['Пожалуйста, позвони маме','маме'],
 ['Набери папу','папу'],
 ['Позвони, пожалуйста, Юлии Ивановой','Юлии Ивановой'],
 ['Позвони Юличке!','Юличке'],
 ['Перезвони Мирону','Мирону'],
 ['Напомни позвонить Юльчику',''],
 ['Позвони Юльчику завтра',''],
 ['Позвони Юльчику послезавтра',''],
 ['Позвони Юльчику в понедельник',''],
 ['Позвони Юльчику в 8:00',''],
 ['Сэйви, позвони 89161234567',''],
 ['Позвони someone@example.com',''],
 ['', '']
];
for(const [phrase,target] of cases)assert.equal(parse(phrase),target,phrase);
assert.equal(parse('позвони\nмаме'),'');
assert.equal(parse('позвони '+('а'.repeat(260))),'');
const contacts=[
 {id:'1',name:'Юлия Иванова',phone:'+79990000001'},
 {id:'2',name:'Юлия Петрова',phone:'+79990000002'},
 {id:'3',name:'Мама',phone:'+79990000003'},
 {id:'4',name:'Мирон',phone:'+79990000004'}
];
assert.deepEqual(findMatches('Юльчику',contacts).map(x=>x.id),['1','2'],
 'Two Julias cannot be silently disambiguated');
assert.deepEqual(findMatches('маме',contacts).map(x=>x.id),['3']);
assert.deepEqual(findMatches('Мирону',contacts).map(x=>x.id),['4']);
assert.equal(findMatches('несуществующему',contacts).length,0);
assert.deepEqual(findMatches('Юльчик',[{id:'5',name:'Юльчик'},...contacts]).map(x=>x.id),['5'],
 'Exact contact name takes priority over nickname-only candidates');
assert.equal(isJuliaAlias('Юльчику'),true);
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html'),task=read('assets/personal-tasks.js'),css=read('assets/personal-tasks.css');
assert.ok(html.indexOf('contact-call-intent.js')<html.indexOf('assets/personal-tasks.js'),
 'Pure name matching must load before call UI');
assert.match(task,/callIntent\?\.parse\(raw\)/,'Text and voice share interpreter');
assert.match(task,/callIntent\?\.findMatches\(target,rows\)/);
assert.match(task,/dial\.href='tel:'\+entry\.phone/,'Uses system phone, never a simulated call');
assert.match(task,/const c=readContacts\(\)\.find\(x=>x\.id===chosenContact\)/,
 'Number is checked again at the moment of handoff');
assert.match(task,/callHandoffPending=true/,'Tracks system handoff without inferring completion');
assert.match(task,/callWasHidden/,'Only real visibility return updates status');
assert.match(task,/verified:false/,'Call outcome always unknown');
assert.doesNotMatch(task,/function personAliases\(/,'Legacy matching logic was removed');
assert.match(css,/\.personal-call-dialog\[open\]\{/,'Call scene remains in original stylesheet');
assert.equal((html.match(/id="seyveoCallDialog"/g)||[]).length,1);
assert.equal((html.match(/id="seyveoCallDial"/g)||[]).length,1);
console.log('PASS SEYVEO Call Intent: 16 commands, unambiguous and ambiguous people, real dialer handoff.');
