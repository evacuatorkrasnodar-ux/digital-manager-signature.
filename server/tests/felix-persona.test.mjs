import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FELIX_PERSONA_RULES,FELIX_PERSONA_VERSION,felixPersonaInstruction} from '../felix-school/persona.mjs';
import {safeInstruction} from '../hybrid-core.mjs';

test('all Felix persona rules are shared with the active system prompt',()=>{
 const rules=felixPersonaInstruction();
 const prompt=safeInstruction('Феликс');
 assert.equal(FELIX_PERSONA_VERSION,'1.0.0');
 assert.ok(FELIX_PERSONA_RULES.length>=10);
 assert.ok(Object.isFrozen(FELIX_PERSONA_RULES));
 for(const rule of FELIX_PERSONA_RULES)assert.ok(prompt.includes(rule));
 assert.match(prompt,/чувством юмора/);
 assert.match(prompt,/Не соглашайся автоматически/);
 assert.match(prompt,/не в каждом ответе/i);
 assert.match(prompt,/разрешен|разрешен|разрешения|разрешений/i);
});
test('Felix never jokes about emergencies or money and never fakes tools',()=>{
 const prompt=safeInstruction('Феликс');
 assert.match(prompt,/здоровья, безопасности, денег/);
 assert.match(prompt,/Не высмеивай опечатки/);
 assert.match(prompt,/Не обещай фоновую работу/);
 assert.match(prompt,/Никогда не утверждай, что отправил письмо/);
 assert.match(prompt,/Нельзя выполнять действия вне этого разговора/);
});
test('personality does not change the assistant identity or presume user familiarity',()=>{
 const milissa=safeInstruction('Милисса');
 assert.match(milissa,/Ты Милисса/);
 assert.match(milissa,/не имя пользователя/);
 assert.match(milissa,/Не навязывай обращения/);
 const felix=safeInstruction('Феликс');
 assert.match(felix,/Ты Феликс/);
});
test('synthetic Felix persona lessons are valid example dialogues',async()=>{
 const raw=await readFile(new URL('../felix-school/persona-lessons.jsonl',import.meta.url),'utf8');
 const lines=raw.trim().split(/\r?\n/u);
 assert.equal(lines.length,12);
 const skills=new Set();
 for(const line of lines){
  const item=JSON.parse(line);
  assert.equal(typeof item.skill,'string');
  assert.equal(item.messages.length,2);
  assert.deepEqual(item.messages.map(m=>m.role),['user','assistant']);
  assert.ok(item.messages.every(m=>typeof m.content==='string'&&m.content.trim()));
  assert.ok(!skills.has(item.skill));
  skills.add(item.skill);
 }
 assert.ok(skills.has('no-humor-urgent'));
 assert.ok(skills.has('no-humor-money'));
 assert.ok(skills.has('disagree-thoughtfully'));
 assert.ok(skills.has('no-fake-execution'));
});
