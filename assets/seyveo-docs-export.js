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
  const h=Math.max(160,Math.round(595*p.height/p.width));
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
function docxFromText(text){
 if(typeof text!=='string'||!text.trim()||text.length>60000)
  throw Error('Введите текст до 60 000 знаков');
 const lines=text.replace(/\r\n?/g,'\n').split('\n');
 const paragraphs=lines.map(line=>'<w:p><w:r><w:t xml:space="preserve">'+
   escapeXml(line)+'</w:t></w:r></w:p>').join('');
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
   '<w:body>'+paragraphs+'<w:sectPr/></w:body></w:document>']
 ];
 return new Blob([zip(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
window.SEYVEO_DOCS_EXPORT=Object.freeze({pdfFromJpegs,docxFromText});
})();
