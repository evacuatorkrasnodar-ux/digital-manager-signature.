/* SEYVEO offline PDF export: browser-canvas pages, no cloud calls or libraries.
   First version stores rendered pages as JPEG, not selectable PDF text. */
(function(){
 'use strict';
 const enc=new TextEncoder();
 const ascii=s=>enc.encode(s);
 const concat=parts=>{
  const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);
  let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out;
 };
 function imageBytes(canvas){
  const data=canvas.toDataURL('image/jpeg',0.87).split(',')[1];
  const raw=atob(data),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
 }
 async function buildPdf(source){
  const text=String(source||'').slice(0,15000).replace(/\r\n?/g,'\n').trim();
  if(!text)throw Error('Нет текста для PDF');
  const W=1190,H=1684,left=105,right=105,top=100,bottom=110,lineHeight=39;
  const width=W-left-right;
  const makePage=()=>{
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Просмотрщик не поддерживает PDF');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
   ctx.font='28px Arial, sans-serif';ctx.fillStyle='#1a1a1a';ctx.textBaseline='top';
   return {canvas,ctx,y:top};
  };
  const pages=[];let current=makePage();
  function finish(){
   pages.push(imageBytes(current.canvas));
   if(pages.length>40)throw Error('Слишком большой документ для PDF');
   current=makePage();
  }
  function write(line){
   if(current.y+lineHeight>H-bottom)finish();
   current.ctx.fillText(line,left,current.y);
   current.y+=lineHeight;
  }
  const normalized=text.replace(/\t/g,'    ').split('\n');
  for(const paragraph of normalized){
   if(!paragraph.trim()){write('');continue}
   let line='';
   for(const word of paragraph.split(/\s+/u)){
    const candidate=line?line+' '+word:word;
    if(current.ctx.measureText(candidate).width<=width){line=candidate;continue}
    if(line){write(line);line=''}
    if(current.ctx.measureText(word).width<=width){line=word;continue}
    // Break unspaced strings without clipping (URLs, long identifiers).
    let fragment='';
    for(const ch of word){
     if(fragment&&current.ctx.measureText(fragment+ch).width>width){write(fragment);fragment=''}
     fragment+=ch;
    }
    line=fragment;
   }
   write(line);
  }
  if(current.y>top||!pages.length)pages.push(imageBytes(current.canvas));
  // Simple PDF 1.4 page tree with one RGB JPEG XObject per A4 page.
  const objects=[null],add=body=>(objects.push(body),objects.length-1);
  const catalog=add(null),pagesId=add(null),pageIds=[];
  const objBody=(items)=>concat(items.map(item=>typeof item==='string'?ascii(item):item));
  for(let i=0;i<pages.length;i++){
   const imageId=add(objBody(['<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+pages[i].length+' >>\nstream\n',pages[i],'\nendstream']));
   const content=ascii('q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n');
   const streamId=add(objBody(['<< /Length '+content.length+' >>\nstream\n',content,'endstream']));
   pageIds.push(add(ascii('<< /Type /Page /Parent '+pagesId+' 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 '+imageId+' 0 R >> >> /Contents '+streamId+' 0 R >>')));
  }
  objects[catalog]=ascii('<< /Type /Catalog /Pages '+pagesId+' 0 R >>');
  objects[pagesId]=ascii('<< /Type /Pages /Kids ['+pageIds.map(i=>i+' 0 R').join(' ')+'] /Count '+pageIds.length+' >>');
  const parts=[ascii('%PDF-1.4\n%SEYVEO\n')],offsets=[0];let cursor=parts[0].length;
  for(let i=1;i<objects.length;i++){
   offsets.push(cursor);
   const obj=objBody([i+' 0 obj\n',objects[i],'\nendobj\n']);
   parts.push(obj);cursor+=obj.length;
  }
  const xref=cursor;
  let index='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
  for(let i=1;i<objects.length;i++)index+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  index+='trailer\n<< /Size '+objects.length+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  parts.push(ascii(index));
  return new Blob([concat(parts)],{type:'application/pdf'});
 }
 window.SEYVEO_CREATE_PDF=buildPdf;
})();
