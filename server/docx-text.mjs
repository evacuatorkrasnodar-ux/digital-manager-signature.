/* SEYVEO · read-only DOCX text extractor using Node's own ZIP support.
 * Only word/document.xml is read. No external services, Python, macros,
 * attachments, relationships or embedded document content are executed.
 */
import {inflateRawSync} from 'node:zlib';

const MAX_ARCHIVE=8*1024*1024;
const MAX_XML=4*1024*1024;
const MAX_PARTS=350;
const MAX_TEXT=5200;

const fail=message=>{throw Error(message)};
const decodeEntity=value=>{
 switch(value.toLowerCase()){
  case 'amp':return '&';case 'lt':return '<';case 'gt':return '>';
  case 'quot':return '"';case 'apos':return "'";
 }
 if(value[0]!=='#')return '&'+value+';';
 const hex=/^#x/i.test(value);
 const digits=hex?value.slice(2):value.slice(1);
 const number=Number.parseInt(digits,hex?16:10);
 if(!Number.isFinite(number)||number<=0||number>0x10ffff||
  (number>=0xd800&&number<=0xdfff))return '';
 return String.fromCodePoint(number);
};
const unescapeText=text=>text.replace(/&((?:amp|lt|gt|quot|apos)|#(?:x[0-9a-f]+|[0-9]+));/gi,(_,value)=>decodeEntity(value));

export function extractDocxText(buffer){
 if(!Buffer.isBuffer(buffer)||buffer.length<22||buffer.length>MAX_ARCHIVE)
  fail('Максимальный размер документа — 8 МБ.');
 const bytes=buffer;
 const u16=i=>bytes.readUInt16LE(i);
 const u32=i=>bytes.readUInt32LE(i);
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(u32(i)===0x06054b50){end=i;break}
 }
 if(end<0||u16(end+4)!==0||u16(end+6)!==0)
  fail('Повреждена структура Word-документа.');
 const count=u16(end+10),directorySize=u32(end+12),directoryStart=u32(end+16);
 if(!count||count>MAX_PARTS||count===0xffff||
    directoryStart>bytes.length||directoryStart+directorySize>end)
  fail('Повреждена структура Word-документа.');
 let cursor=directoryStart,entry=null;
 for(let i=0;i<count;i++){
  if(cursor+46>bytes.length||u32(cursor)!==0x02014b50)
   fail('Повреждена структура Word-документа.');
  const flags=u16(cursor+8),method=u16(cursor+10);
  const compressed=u32(cursor+20),expanded=u32(cursor+24);
  const nameLength=u16(cursor+28),extraLength=u16(cursor+30),commentLength=u16(cursor+32);
  const localOffset=u32(cursor+42);
  const finish=cursor+46+nameLength+extraLength+commentLength;
  if(finish>bytes.length)fail('Повреждена структура Word-документа.');
  if(flags&1)fail('Зашифрованные документы пока не поддерживаются.');
  const name=bytes.toString('utf8',cursor+46,cursor+46+nameLength);
  if(name==='word/document.xml'){
   if(entry)fail('Повреждена структура Word-документа.');
   entry={method,compressed,expanded,localOffset};
  }
  cursor=finish;
 }
 if(!entry)fail('В Word-документе отсутствует основной текст.');
 if(!entry.expanded||entry.expanded>MAX_XML||entry.compressed>MAX_ARCHIVE||
   entry.expanded>Math.max(entry.compressed,1024)*180)
  fail('Слишком большой или сложный документ.');
 const at=entry.localOffset;
 if(at+30>bytes.length||u32(at)!==0x04034b50||
    u16(at+8)!==entry.method||u16(at+6)&1)
  fail('Повреждена структура Word-документа.');
 const start=at+30+u16(at+26)+u16(at+28);
 if(start>bytes.length||start+entry.compressed>bytes.length)
  fail('Повреждена структура Word-документа.');
 const zipped=bytes.subarray(start,start+entry.compressed);
 let extracted;
 try{
  if(entry.method===0)extracted=zipped;
  else if(entry.method===8)
   extracted=inflateRawSync(zipped,{maxOutputLength:MAX_XML});
  else fail('Неподдерживаемое сжатие Word-документа.');
 }catch(error){
  if(error?.message==='Неподдерживаемое сжатие Word-документа.')throw error;
  fail('Не удалось распаковать текст Word-документа.');
 }
 if(extracted.length!==entry.expanded||extracted.length>MAX_XML)
  fail('Повреждена структура Word-документа.');
 let xml;
 try{xml=new TextDecoder('utf-8',{fatal:true}).decode(extracted)}
 catch{fail('Повреждена кодировка Word-документа.')}
 if(!/<w:document\b/.test(xml)||!/<w:body\b/.test(xml)||
   /<!DOCTYPE|<!ENTITY/i.test(xml))
  fail('Повреждена структура Word-документа.');
 const paragraphs=[];
 const paraPattern=/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
 const tokenPattern=/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:(?:tab|br|cr)\b[^>]*\/>/g;
 let total=0,match;
 while((match=paraPattern.exec(xml))!==null&&total<=MAX_TEXT+1400){
  let line='',token;
  tokenPattern.lastIndex=0;
  while((token=tokenPattern.exec(match[0]))!==null){
   line+=token[1]===undefined?(token[0].startsWith('<w:tab')?'\t':'\n'):unescapeText(token[1]);
  }
  paragraphs.push(line);
  total+=line.length+1;
 }
 const result=paragraphs.join('\n').trim();
 if(!result)fail('Текст не найден. Возможно, документ состоит из изображений.');
 return {text:result.slice(0,MAX_TEXT),truncated:result.length>MAX_TEXT,
  format:'docx',chars:result.length};
}
