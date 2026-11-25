/* SEYVEO Docs · offline document exports for developer studio.
 * No network, fake server/AI, token storage or automatic upload.
 * JPEG scans -> real image-only PDF. Plain text -> minimal editable DOCX.
 */
(()=>{
'use strict';
const enc=new TextEncoder();
const MAX=28*1024*1024;
const u16=n=>Uint8Array.of(n&255,(n>>>8)&255);
const u32=n=>Uint8Array.of(n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255);
const bytes=v=>typeof v==='string'?enc.encode(v):v;
function join(parts){
 let length=0;
 for(const part of parts)length+=part.length;
 if(length>MAX+1000000)throw Error('Слишком большой файл');
 const out=new Uint8Array(length),at={n:0};
 for(const part of parts){out.set(part,at.n);at.n+=part.length;}
 return out;
}
function pdfFromJpegs(pages){
 if(!Array.isArray(pages)||pages.length===0||pages.length>12)
  throw Error('Можно собрать от 1 до 12 страниц');
 let total=0;
 for(const page of pages){
  if(!Number.isSafeInteger(page.width)||!Number.isSafeInteger(page.height)||
     page.width<1||page.height<1||page.width>6000||page.height>6000||
     !(page.jpegBytes instanceof Uint8Array)||page.jpegBytes.length<4||
     page.jpegBytes[0]!==255||page.jpegBytes[1]!==216)
    throw Error('Неверное изображение страницы');
  total+=page.jpegBytes.length;
 }
 if(total>MAX)throw Error('Слишком большой PDF');
 const parts=[],offsets=[0];let size=0;
 const put=v=>{const part=bytes(v);parts.push(part);size+=part.length;};
 const obj=(index,body)=>{
  offsets[index]=size;
  put(String(index)+' 0 obj\n');
  if(Array.isArray(body))for(const part of body)put(part);
  else put(body);
  put('\nendobj\n');
 };
 put('%PDF-1.4\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 const refs=pages.map((_,i)=>String(3+i*3)+' 0 R').join(' ');
 obj(2,'<< /Type /Pages /Kids [ '+refs+' ] /Count '+pages.length+' >>');
 for(let i=0;i<pages.length;i++){
  const p=pages[i],pg=3+i*3,stream=pg+1,img=pg+2;
  const w=595;
  const h=Math.max(1,Math.round(595*p.height/p.width));
  const text='q\n'+w+' 0 0 '+h+' 0 0 cm\n/Im0 Do\nQ\n';
  obj(pg,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+w+' '+h+'] /Resources << /XObject << /Im0 '+img+' 0 R >> >> /Contents '+stream+' 0 R >>');
  obj(stream,['<< /Length '+enc.encode(text).length+' >>\nstream\n',text,'endstream']);
  obj(img,[
   '<< /Type /XObject /Subtype /Image /Width '+p.width+' /Height '+p.height+
   ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+
   p.jpegBytes.length+' >>\nstream\n',p.jpegBytes,'\nendstream'
  ]);
 }
 const xref=size,count=3+3*pages.length;
 put('xref\n0 '+count+'\n0000000000 65535 f \n');
 for(let i=1;i<count;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 put('trailer\n<< /Size '+count+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
 return new Blob(parts,{type:'application/pdf'});
}
// Text PDF uses one fixed A4-ratio canvas for measuring AND drawing.
// Never truncate the source text or shrink a paragraph to fit one line.
function pdfFromText(text,createCanvas=()=>document.createElement('canvas')){
 if(typeof text!=='string'||!text.trim())throw Error('Введите текст');
 if(text.length>12000)throw Error('Введите текст до 12 000 знаков');
 const W=900,H=1273,M=70,guard=4,font='28px Arial,sans-serif',leading=36;
 const x=M+guard,firstBaseline=100,usable=W-2*x;
 const rows=Math.floor((H-M-8-firstBaseline)/leading)+1;
 const canvas=createCanvas();canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен');
 ctx.font=font;ctx.textAlign='left';ctx.textBaseline='alphabetic';
 const fits=value=>{
  const m=ctx.measureText(value);
  return Math.max(m.width,m.actualBoundingBoxRight||0)<=usable&&Math.max(0,m.actualBoundingBoxLeft||0)<=guard;
 };
 const lines=[];
 const push=line=>{lines.push(line);if(lines.length>rows*12)throw Error('Слишком много страниц PDF (максимум 12). Разделите документ.');};
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
 const characters=value=>segmenter?Array.from(segmenter.segment(value),part=>part.segment):Array.from(value);
 for(const raw of text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
  let line='';
  for(const token of raw.match(/\s+|\S+/gu)||[]){
   if(fits(line+token)){line+=token;continue;}
   if(line){push(line);line='';}
   if(fits(token)){line=token;continue;}
   for(const ch of characters(token)){
    if(line&&!fits(line+ch)){push(line);line='';}
    if(!fits(ch))throw Error('Символ не помещается на странице PDF');
    line+=ch;
   }
  }
  push(line);
 }
 const pages=[];
 for(let i=0;i<lines.length;i+=rows){
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#172027';ctx.font=font;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  let y=firstBaseline;
  for(const line of lines.slice(i,i+rows)){
   if(!fits(line))throw Error('Строка выходит за поля страницы PDF');
   ctx.fillText(line,x,y,usable);y+=leading;
  }
  const encoded=canvas.toDataURL('image/jpeg',0.90);
  if(!encoded.startsWith('data:image/jpeg;base64,'))throw Error('Не удалось сформировать страницу PDF');
  const jpegBytes=Uint8Array.from(atob(encoded.split(',')[1]),ch=>ch.charCodeAt(0));
  pages.push({width:W,height:H,jpegBytes});
 }
 return pdfFromJpegs(pages);
}
const escapeXml=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function crc32(data){
 let crc=0xffffffff;
 for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function zip(entries){
 const local=[],central=[];let position=0;
 for(const [name,value] of entries){
  const filename=enc.encode(name),data=bytes(value),crc=crc32(data);
  const header=join([u32(0x04034b50),u16(20),u16(2048),u16(0),u16(0),u16(0),
   u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),filename]);
  local.push(header,data);
  central.push(join([
   u32(0x02014b50),u16(20),u16(20),u16(2048),u16(0),u16(0),u16(0),
   u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),
   u16(0),u16(0),u16(0),u32(0),u32(position),filename
  ]));
  position+=header.length+data.length;
 }
 const center=join(central),tail=join([
  u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),
  u32(center.length),u32(position),u16(0)
 ]);
 return join([...local,center,tail]);
}
function docxFromText(text,options={}){
 if(typeof text!=='string'||!text.trim()||text.length>60000)
  throw Error('Введите текст до 60 000 знаков');
 const lines=text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\r\n?/g,'\n').split('\n');
 const size=[10,11,12,14,16,18].includes(Number(options.size))?Number(options.size):12;
 const alignment=['left','center','right','both'].includes(options.alignment)?options.alignment:'left';
 const paragraphs=lines.map((line,i)=>{
  const heading=options.heading===true&&i===0;
  const fontSize=heading?Math.max(16,size):size;
  return '<w:p><w:pPr><w:jc w:val="'+alignment+'"/></w:pPr><w:r><w:rPr>'+
   (heading?'<w:b/>':'')+'<w:sz w:val="'+fontSize*2+'"/><w:szCs w:val="'+fontSize*2+'"/></w:rPr>'+
   '<w:t xml:space="preserve">'+escapeXml(line)+'</w:t></w:r></w:p>';
 }).join('');
 const files=[
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
   '</Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'+
   '</Relationships>'],
  ['word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
   '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
   '<w:body>'+paragraphs+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>']
 ];
 return new Blob([zip(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
// Read only the exact image-page layout created by this exporter. General PDF
// parsing, arbitrary object streams, encrypted PDFs and text editing are not
// supported. Never rewrite the source. Reject unexpected syntax and lengths.
async function readScanPdf(file){
 if(!(file instanceof Blob)||file.size<1||file.size>MAX+1000000)throw Error('PDF слишком большой или пустой.');
 const raw=new Uint8Array(await file.arrayBuffer());
 const str=new TextDecoder('latin1').decode(raw);
 let cursor=0;
 function take(value){if(!str.startsWith(value,cursor))throw Error('Редактирование страниц доступно только для PDF-сканов SEYVEO.');cursor+=value.length;}
 function match(pattern){const m=pattern.exec(str.slice(cursor,cursor+2048));if(!m)throw Error('Этот PDF нельзя разобрать как скан SEYVEO.');cursor+=m[0].length;return m;}
 take('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [ ');
 const kids=match(/^((?:\d+ 0 R ?){1,12}) \] \/Count (\d{1,2}) >>\nendobj\n/);
 const count=Number(kids[2]);if(count<1||count>12||kids[1]!==Array.from({length:count},(_,i)=>String(3+i*3)+' 0 R').join(' '))throw Error('Неизвестная структура PDF.');
 const pages=[];
 for(let i=0;i<count;i++){
  const pg=3+i*3,stream=pg+1,img=pg+2;
  take(pg+' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ');
  const h=match(/^(\d{1,9})\] /)[1];
  take('/Resources << /XObject << /Im0 '+img+' 0 R >> >> /Contents '+stream+' 0 R >>\nendobj\n');
  take(stream+' 0 obj\n<< /Length ');
  const length=Number(match(/^(\d{1,5}) >>\nstream\n/)[1]);
  const content='q\n595 0 0 '+h+' 0 0 cm\n/Im0 Do\nQ\n';
  if(length!==content.length)throw Error('Неизвестное содержимое страницы.');
  take(content+'endstream\nendobj\n');
  take(img+' 0 obj\n<< /Type /XObject /Subtype /Image /Width ');
  const dims=match(/^(\d{1,4}) \/Height (\d{1,4}) \/ColorSpace \/DeviceRGB \/BitsPerComponent 8 \/Filter \/DCTDecode \/Length (\d{1,8}) >>\nstream\n/);
  const width=Number(dims[1]),height=Number(dims[2]),size=Number(dims[3]);
  if(width<1||height<1||width>6000||height>6000||size<4||cursor+size>raw.length||raw[cursor]!==255||raw[cursor+1]!==216||raw[cursor+size-2]!==255||raw[cursor+size-1]!==217)throw Error('Повреждённая страница скана.');
  if(![Math.max(1,Math.round(595*height/width)),Math.max(160,Math.round(595*height/width))].includes(Number(h)))throw Error('Неизвестный размер страницы.');
  pages.push({width,height,jpegBytes:raw.slice(cursor,cursor+size)});cursor+=size;
  take('\nendstream\nendobj\n');
 }
 const trailer=str.slice(cursor);
 if(!/^xref\n0 \d+\n[\s\S]*?trailer\n<< \/Size \d+ \/Root 1 0 R >>\nstartxref\n\d+\n%%EOF\n$/.test(trailer)||trailer.length>2000)throw Error('Неизвестная структура PDF.');
 return pages;
}
window.SEYVEO_DOCS_EXPORT=Object.freeze({pdfFromJpegs,pdfFromText,docxFromText,readScanPdf});
})();
