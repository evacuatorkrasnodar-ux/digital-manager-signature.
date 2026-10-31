const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../assets/seyveo-live-search-ui.js'),'utf8');
function node(tag){
 return {tag,children:[],attributes:{},textContent:'',append(...items){this.children.push(...items)},
  setAttribute(key,value){this.attributes[key]=value}};
}
const context={window:{},document:{createElement:node},URL};
vm.runInNewContext(src,context);
const render=context.window.SEYVEO_LIVE_SEARCH_UI.render;
function all(root){return [root,...root.children.flatMap(all)]}
test('no source or photo cards without real results',()=>{
 assert.equal(render({status:'unavailable',results:[]}),null);
 assert.equal(render({status:'results',results:[{url:'javascript:alert(1)',title:'Bad'}]}),null);
});
test('renders approved imagery and linkable sources without markup injection',()=>{
 const card=render({status:'results',results:[
  {title:'<script>alert(1)</script>',snippet:'Сведения',url:'https://news.example.org/story',imageUrl:'https://img.example.org/a.jpg',imageApproved:true,imageCredit:'Author'},
  {title:'Other',snippet:'No rights',url:'https://news.example.org/other',imageUrl:'https://img.example.org/b.jpg',imageApproved:false}
 ]});
 const nodes=all(card);
 assert.equal(nodes.filter(n=>n.tag==='img').length,1);
 assert.equal(nodes.filter(n=>n.tag==='a').length,3);
 assert.ok(nodes.some(n=>n.textContent==='<script>alert(1)</script>'));
 assert.ok(nodes.filter(n=>n.tag==='a').every(n=>n.rel==='noopener noreferrer'));
});
