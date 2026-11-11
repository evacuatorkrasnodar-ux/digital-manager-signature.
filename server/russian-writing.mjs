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
// A document-writing request is a task, not a discussion about software abilities.
// The same predicate is used by the local model and the HTTP response guard.
export function isDocumentWritingRequest(request){
 const s=String(request||'').slice(0,4000);
 const kind=/(?:заявлени[еяюем]|договор|приказ|документ|письм[оауе]|справк[ауе]|акт[ауе]?(?![а-яё])|претензи|уведомлени|доверенност|резюме|отч[её]т|служебн.{0,12}записк|pdf|docx|word)/iu;
 const command=/(?:сделай|сделать|создай|создать|составь|составить|подготовь|подготовить|напиши|написать|оформи|оформить|сформируй|сформировать|обнови|обновить|исправь|исправить|измени|изменить|перепиши|переписать|переделай|переделать|заполни|заполнить|отредактируй|редактировать|сохрани|сохранить|скачай|скачать)/iu;
 return kind.test(s)&&command.test(s);
}
export function documentWritingGuidance(){
 return [
  'SEYVEO УМЕЕТ готовить документ в этом чате. На экране уже есть работающие действия: посмотреть документ, сохранить Word (DOCX) и PDF, распечатать. Файл создаётся соответствующим обработчиком приложения по нажатию пользователя. Тебе не нужно самой пересылать бинарные файлы.',
  'Если человек просит составить, обновить, исправить или оформить документ, ПРЯМО СЕЙЧАС напиши полный пригодный текст документа. Не отвечай отказом «не могу создать/передать файл», «у меня нет возможности работать с DOCX» или предложением скопировать текст в сторонний Word.',
  'Помести только готовый текст между отдельными строками --- и ---, с понятным заголовком («Заявление», «Договор», «Письмо» и т. п.), чтобы интерфейс автоматически предложил просмотр и сохранение. Короткое объяснение можешь написать после документа, но не затягивай.',
  'При просьбе исправить уже составленный документ используй предыдущий вариант из диалога, сохрани неизменённые сведения и поменяй только указанное. Если пользователь просит изменить дату на «16 декабря», не спрашивай о дате повторно. Если год не указан и его нельзя надёжно установить, оставь поле [год].',
  'Не придумывай ФИО, адрес, должность, реквизиты, длительность отпуска, правовую причину и другие отсутствующие факты. Для отсутствующих данных используй аккуратные поля [ФИО], [должность], [год] и т. д. Если даже цель документа неизвестна, задай ОДИН необходимый уточняющий вопрос.',
  'Никаких шуток, эмодзи, разговорных обещаний, длинных извинений или заявлений о технической беспомощности в ответе на просьбу сделать документ. Нельзя заявлять о сохранении или отправке файла до подтверждения интерфейса.'
 ].join(' ');
}
export function russianWritingGuidance(request){
 const mode=russianWritingMode(request);
 const base='Пиши на грамотном и естественном русском. Проверяй согласование слов, падежи, орфографию и завершённость предложений. Не выдумывай факты. Не переписывай слова пользователя, цитаты и имена без просьбы.';
 if(isDocumentWritingRequest(request))return base+' '+documentWritingGuidance();
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
