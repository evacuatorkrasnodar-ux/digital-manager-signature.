/* Regression: original generated PDF, not viewer CSS. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../assets/seyveo-docs-export.js'),'utf8');
function setup(){
 const window={};
 vm.runInNewContext(code,{window,TextEncoder,TextDecoder,Uint8Array,Blob,atob});
 const api=window.SEYVEO_DOCS_EXPORT,drawn=[],pages=[];
 const measureText=value=>({width:Array.from(value).reduce((w,c)=>w+(c===' '?8:c==='W'?27:16),0)});
 const ctx={measureText,fillRect(){drawn.length=0;},fillText(value,x,y,max){
  assert.ok(x>=70&&x+measureText(value).width<=830,'horizontal margin');
  assert.ok(y>=70&&y+8<=1203,'vertical margin');
  assert.ok(measureText(value).width<=max,'no horizontal compression required');
  drawn.push(value);
 }};
 const canvas={width:0,height:0,getContext:()=>ctx,toDataURL(){
  pages.push(drawn.slice());
  return 'data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
 }};
 return {api,pages,make:()=>canvas};
}
test('Russian contract, long identifiers, indentation and blank lines survive export',async()=>{
 const {api,pages,make}=setup();
 const text='ДОГОВОР ОКАЗАНИЯ УСЛУГ\n\n  Заказчик: [реквизиты, представитель и основание полномочий]\n'+
  'Исполнитель: '+('W'.repeat(180))+'\nРеквизиты и подписи: __________________';
 const pdf=api.pdfFromText(text,make);
 assert.equal(pdf.type,'application/pdf');
 assert.equal(pages.flat().join('').replace(/\r/g,''),text.replace(/\n/g,''));
 assert.equal(pages.flat()[1],'');
 assert.ok(pages.flat().some(x=>x.startsWith('  Заказчик')));
 const raw=Buffer.from(await pdf.arrayBuffer()).toString('latin1');
 assert.match(raw,/\/MediaBox \[0 0 595 842\]/);
 assert.match(raw,/\/Count 1\b/);
 const decoded=await api.readScanPdf(pdf);
 assert.equal(decoded[0].width,900);assert.equal(decoded[0].height,1273);
});
test('all text reaches the last PDF page within printable bounds',async()=>{
 const {api,pages,make}=setup();
 const text=Array.from({length:80},(_,i)=>'Строка '+(i+1)+' — реквизиты 12345').join('\n');
 const pdf=api.pdfFromText(text,make);
 assert.equal(pages.length,3);assert.equal(pages[0].length,31);
 assert.equal(pages.flat().join('\n'),text);
 assert.match(Buffer.from(await pdf.arrayBuffer()).toString('latin1'),/\/Count 3\b/);
});
test('reject oversized text and too many pages instead of clipping',()=>{
 const {api,make}=setup();
 assert.throws(()=>api.pdfFromText('x'.repeat(12001),make),/12 000/);
 assert.throws(()=>api.pdfFromText('строка\n'.repeat(400),make),/максимум 12/);
});
