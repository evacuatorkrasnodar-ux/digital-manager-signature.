'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/seyveo-editor-capsule.js'),'utf8'),{window});
const api=window.SEYVEO_EDITOR_CAPSULE;
function rail(ids){
 const node={dataset:{},children:ids.map(id=>({dataset:{svSmartTool:id},handle:()=>id})),append(control){this.children.splice(this.children.indexOf(control),1);this.children.push(control);}};
 return node;
}
test('context priorities preserve real controls and place unknown actions last',()=>{
 const node=rail(['redo','custom','sayvi','undo','size','align','format','clear','copy']);
 const original=node.children.slice();api.prioritize(node,'word');
 assert.deepEqual(node.children.map(n=>n.dataset.svSmartTool),['size','align','format','sayvi','undo','copy','clear','redo','custom']);
 assert.equal(node.children.length,original.length);assert.ok(original.every(n=>node.children.includes(n)));
 api.prioritize(node,'word');assert.equal(node.children[0].handle(),'size');
});
test('PDF keeps drawing actions first, never injects unsupported text controls',()=>{
 const node=rail(['sayvi','redo','view','text','marker','pen','signature','color','eraser','undo']);api.prioritize(node,'pdf');
 assert.deepEqual(node.children.map(n=>n.dataset.svSmartTool),['text','pen','marker','eraser','color','signature','view','undo','redo','sayvi']);
});
test('notebook controls recognize original delegated data attributes',()=>{
 const node=rail(['sayvi','text','draw','heading']);node.children[2].dataset={noteTool:'draw'};node.children[3].dataset={noteTool:'heading'};
 api.prioritize(node,'notebook');
 assert.equal(node.children[0].handle(),'text');assert.equal(node.children[1].handle(),'draw');
});
