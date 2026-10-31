const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../assets/seyveo-rich-answer-ui.js'),'utf8');
function element(tag){
 return {tag,children:[],attributes:{},style:{},textContent:'',
  append(...children){this.children.push(...children)},
  setAttribute(name,value){this.attributes[name]=value}};
}
const ctx={window:{},document:{createElement:element},URL};
vm.runInNewContext(src,ctx);
const api=ctx.window.SEYVEO_RICH_ANSWER;
const walk=n=>[n,...n.children.flatMap(walk)];
test('never renders unsupported or unsourced content',()=>{
 assert.equal(api.render([]),null);
 assert.equal(api.render([{type:'image',url:'https://example.org/i.jpg',alt:'x',approved:true}]),null);
 assert.equal(api.render([{type:'image',url:'javascript:alert(1)',sourceUrl:'https://example.org',approved:true,credit:'Author',alt:'x'}]),null);
});
test('renders table rows as text rather than executable HTML',()=>{
 const view=api.render([{type:'table',title:'Сравнение',columns:['Параметр','Цена'],rows:[['<script>alert(1)</script>','250 ₽']]}]);
 const nodes=walk(view);
 assert.equal(nodes.filter(n=>n.tag==='table').length,1);
 assert.equal(nodes.filter(n=>n.tag==='script').length,0);
 assert.ok(nodes.some(n=>n.tag==='td'&&n.textContent==='<script>alert(1)</script>'));
});
test('bars use only valid explicitly provided numbers',()=>{
 const blocks=api.cleanBlocks([{type:'bars',items:[{label:'A',value:15},{label:'B',value:null},{label:'C',value:-10}]}]);
 assert.equal(blocks[0].items.length,1);
 const view=api.render(blocks);
 const fills=walk(view).filter(n=>n.tag==='span'&&n.style.width);
 assert.equal(fills.length,1);
 assert.equal(fills[0].style.width,'100%');
});
test('approved illustrations link to attributed original source',()=>{
 const view=api.render([{type:'image',approved:true,title:'Схема',alt:'Внешняя иллюстрация',
  url:'https://images.example.org/asset.jpg',sourceUrl:'https://publisher.example.org/post',credit:'Издатель'}]);
 const nodes=walk(view);
 assert.equal(nodes.filter(n=>n.tag==='img').length,1);
 const link=nodes.find(n=>n.tag==='a');
 assert.equal(link.href,'https://publisher.example.org/post');
 assert.equal(link.rel,'noopener noreferrer');
});
test('steps remain semantic and bounded',()=>{
 const view=api.render([{type:'steps',items:['Открыть','Проверить','Подтвердить']}]);
 assert.equal(walk(view).filter(n=>n.tag==='li').length,3);
});
