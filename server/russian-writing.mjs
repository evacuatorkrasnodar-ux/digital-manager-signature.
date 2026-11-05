/* SEYVEO Russian writing layer. Never edits voice or the original user text. */
const WORK=/(?:письм[оаеиу]|документ|приказ|заявлени|договор|резюме|отч[её]т|клиент|сотрудник|официальн|делов|коммерческ|претензи|уведомлени)/iu;
const EDIT=/(?:исправ[ьи]|проверь|отредактируй|перепиши|грамотн|орфограф|пунктуац|ошибк|редактур|сформулируй|составь)/iu;
const TYPOS=new Map([
 ['вообщем','в общем'],['вобщем','в общем'],['извени','извини'],
 ['извените','извините'],['пожалуста','пожалуйста'],
 ['сдесь','здесь'],['будующий','будущий'],
 ['учавствовать','участвовать'],['прийдёт','придёт'],
 ['кстате','кстати'],['во первых','во-первых'],
 ['всётаки','всё-таки'],['все таки','всё-таки']
]);
export function russianWritingMode(request){
 const s=String(request||'').slice(0,1200);
 // Talking *about* a client or colleague is not automatically a formal letter.
 // Writing a document and correcting a document are distinct intents.
 const explicitDocument=/(?:напиши|составь|подготовь|оформи|создай|сформируй|ответь|сделай|редактируй|перепиши|исправь|проверь)[^.!?\\n]{0,110}(?:письм[оаеиу]|документ|приказ|заявлени|договор|резюме|отч[её]т|уведомлени|претензи|клиенту|сотруднику)/iu.test(s);
 const formalRequest=/(?:официальным|деловым|формальным|для клиента|для сотрудника|от имени компании)/iu.test(s);
 if(explicitDocument||formalRequest)return 'business';
 if(EDIT.test(s))return 'editing';
 return 'conversation';
}
export function russianWritingGuidance(request){
 const mode=russianWritingMode(request);
 const base='Пиши на грамотном и естественном русском. Проверяй согласование слов, падежи, орфографию и завершённость предложений. Не выдумывай факты. Не переписывай слова пользователя, цитаты и имена без просьбы.';
 if(mode==='business')return base+' Для деловых писем и документов применяй нейтральный профессиональный стиль без мата, сленга и мемов. Не придумывай реквизиты, суммы и факты.';
 if(mode==='editing')return base+' Исправляй только уверенные ошибки в запрошенном тексте, сохраняя авторский смысл, разговорные слова и стиль, если не запрошена литературная правка.';
 return base+' В обычном дружеском диалоге говори естественно. Сленг и шутки используй по контексту; не превращай разговор в канцелярит.';
}
/* Diagnostics only, never automatically modifies generated text. */
export function inspectRussianText(text){
 if(typeof text!=='string'||!text.trim())return {issues:[],unfinished:false};
 const input=text.trim(),issues=[];
 const unfinished=!/[.!?…»”)\]]$/u.test(input)&&/[а-яёa-z0-9]$/iu.test(input);
 if(unfinished)issues.push({type:'unfinished',message:'Возможно незавершённое предложение'});
 if(!/https?:\/\/|www\.|<[^>]+>/.test(input)){
  const words=[...input.matchAll(/[а-яё]+/giu)].map(m=>m[0]);
  for(let i=1;i<words.length&&issues.length<8;i++){
   if(words[i].length>=3&&words[i].toLowerCase()===words[i-1].toLowerCase())
    issues.push({type:'repeat',fragment:words[i],message:'Возможный повтор слова'});
  }
  // Multiword typos need phrase matching, not token matching.
  for(const [phrase,variant] of TYPOS){
   if(!phrase.includes(' ')||issues.length>=8)continue;
   const position=input.toLowerCase().indexOf(phrase);
   if(position<0)continue;
   const before=position>0?input[position-1]:' ';
   const after=input[position+phrase.length]||' ';
   if(!/[а-яё]/iu.test(before)&&!/[а-яё]/iu.test(after))
    issues.push({type:'possible-typo',fragment:input.slice(position,position+phrase.length),variant});
  }
  for(const word of words){
   const variant=TYPOS.get(word.toLowerCase());
   if(variant&&issues.length<8)issues.push({type:'possible-typo',fragment:word,variant});
  }
 }
 return {issues,unfinished};
}
