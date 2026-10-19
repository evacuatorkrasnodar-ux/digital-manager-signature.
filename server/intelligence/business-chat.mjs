/* SEYVEO · local, explicit business arithmetic requests.
 * Only closed numerical templates. NO natural-language number guessing.
 * Read-only, offline, no model, no bank and no persistence.
 */
import {calculateBusiness} from './business-math.mjs';

const NUMBER='(?:\\d{1,10}|\\d{1,3}(?: \\d{3}){1,3})(?:[.,]\\d{1,2})?';
const METRICS=Object.freeze({
 'конверсию':{key:'conversion',title:'Конверсия',fields:{
  visitors:'посетител(?:ь|я|ей)',orders:'заказ(?:ов|а)?'
 },example:'600 посетителей и 18 заказов'},
 'прибыль':{key:'profit-before-tax',title:'Расчётная прибыль до налогов',fields:{
  revenue:'выручк(?:а|и|у)',variableCosts:'переменны(?:е|х) расход(?:ы|ов)?',
  fixedCosts:'постоянны(?:е|х) расход(?:ы|ов)?'
 },example:'выручка 90000, переменные расходы 50000, постоянные расходы 15000'},
 'выручку':{key:'revenue',title:'Выручка',fields:{
  unitPrice:'цен(?:а|у|ы)',quantity:'количеств(?:о|а)'
 },example:'цена 125.50 и количество 3'},
 'маржу':{key:'gross-margin',title:'Валовая маржа',fields:{
  salePrice:'цен(?:а|у|ы)',unitCost:'себестоимост(?:ь|и)'
 },example:'цена 1000 и себестоимость 600'},
 'наценку':{key:'markup',title:'Наценка',fields:{
  salePrice:'цен(?:а|у|ы)',unitCost:'себестоимост(?:ь|и)'
 },example:'цена 1000 и себестоимость 600'},
 'безубыточность':{key:'break-even-orders',title:'Заказов для безубыточности',fields:{
  fixedCosts:'постоянны(?:е|х) расход(?:ы|ов)?',
  salePrice:'цен(?:а|у|ы)(?: заказа)?',
  variableCostPerOrder:'переменны(?:е|х) расход(?:ы|ов)? на заказ'
 },example:'постоянные расходы 60000, цена заказа 500, переменные расходы на заказ 200'},
 'стоимость заявки':{key:'cost-per-lead',title:'Стоимость заявки',fields:{
  adSpend:'(?:расход(?:ы|ов)? на рекламу|рекламны(?:е|х) расход(?:ы|ов)?)',
  leads:'заяв(?:ка|ки|ок)'
 },example:'расходы на рекламу 12000 и 30 заявок'},
 'стоимость клиента':{key:'customer-acquisition-cost',title:'Стоимость нового клиента',fields:{
  adSpend:'(?:расход(?:ы|ов)? на рекламу|рекламны(?:е|х) расход(?:ы|ов)?)',
  newCustomers:'новы(?:й|х|е) клиент(?:ов|а|ы)?'
 },example:'расходы на рекламу 8000 и 4 новых клиента'}
});
const names=Object.keys(METRICS).sort((a,b)=>b.length-a.length);
const COMMAND=new RegExp(
 '^(?:(?:филя|феликс)[,\\s]+)?(?:посчитай|рассчитай|вычисли)\\s+('+
 names.join('|')+')(?::\\s*(.*))?\\s*$','iu'
);
function fieldValue(part,label){
 const optionalCurrency='(?:\\s+руб(?:лей|ля|ль|\\.)?)?';
 const before=new RegExp('^('+NUMBER+')\\s+('+label+')'+optionalCurrency+'$','iu');
 const after=new RegExp('^('+label+')\\s+('+NUMBER+')'+optionalCurrency+'$','iu');
 const first=part.match(before),last=part.match(after);
 const raw=first?.[1]??last?.[2];
 if(raw===undefined)return null;
 const normalized=raw.replace(/ /gu,'').replace(',','.');
 if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u.test(normalized))return null;
 return normalized;
}
function parseFields(details,fields){
 if(details.length>330||/[\r\n\t]/u.test(details))return null;
 // A decimal comma (125,50) is not a field delimiter.
 const parts=details.split(/,\s*(?=[а-яё])|\s+и\s+/iu).map(s=>s.trim());
 const keys=Object.keys(fields);
 if(parts.length!==keys.length||parts.some(s=>!s))return null;
 const parsed={};
 for(const part of parts){
  let matches=0;
  for(const [key,label] of Object.entries(fields)){
   const found=fieldValue(part,label);
   if(found!==null){
    if(Object.hasOwn(parsed,key))return null;
    parsed[key]=found;matches++;
   }
  }
  if(matches!==1)return null;
 }
 return Object.keys(parsed).length===keys.length?parsed:null;
}
const localUnit=unit=>unit==='RUB'?'₽':unit==='percent'?'%':'заказов';
function fmtInput(key,value){return key+' = '+value}

/** Null means "not a supported explicit math command"; the LLM handles it.
 * Supported but incomplete commands ALWAYS fail closed with a format hint.
 */
export function businessChatAnswer(message){
 if(typeof message!=='string'||message.length>600)return null;
 const match=message.trim().match(COMMAND);
 if(!match)return null;
 const kind=METRICS[match[1].toLowerCase()];
 const raw=match[2]?.trim()||'';
 const values=parseFields(raw,kind.fields);
 if(!values){
  return Object.freeze({
   status:'needs-details',metric:kind.key,modelCalled:false,executed:false,
   text:'Для точного расчёта укажи только необходимые цифры с подписями.\n'+
    'Пример: «Филя, посчитай '+match[1]+': '+kind.example+'».\n'+
    'Я не буду угадывать пропущенные или неоднозначные значения.'
  });
 }
 try{
  const result=calculateBusiness(kind.key,values);
  const given=Object.entries(values).map(([k,v])=>fmtInput(k,v)).join('; ');
  const answer=result.status==='calculated'
   ?kind.title+': '+result.exact+' '+localUnit(result.unit)+'.'
   :kind.title+': сейчас нельзя рассчитать ('+result.reason+').';
  return Object.freeze({
   status:result.status,metric:kind.key,
   modelCalled:false,executed:false,externalCallsMade:0,
   text:answer+'\nФормула: '+result.formula+
    '\nИсходные значения: '+given+
    '\nВажно: проверена арифметика, но не достоверность цифр, налоги или полнота расходов.',
   result
  });
 }catch{
  return Object.freeze({
   status:'needs-details',metric:kind.key,modelCalled:false,executed:false,
   text:'Эти значения не удаётся безопасно рассчитать. Проверь величины, формат чисел и подписи.\n'+
    'Пример: «Филя, посчитай '+match[1]+': '+kind.example+'».'
  });
 }
}
