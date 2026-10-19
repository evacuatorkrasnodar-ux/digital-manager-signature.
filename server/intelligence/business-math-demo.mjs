/* SEYVEO Felix · offline math demonstration.
 * No Ollama, no keys, no network, no bank account and no real user data.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {calculateBusiness,verifyBusinessClaim} from './business-math.mjs';

export const DEMO_EXAMPLES=Object.freeze([
 Object.freeze({title:'Прибыль до налогов',metric:'profit-before-tax',
  values:Object.freeze({revenue:90000,variableCosts:50000,fixedCosts:15000})}),
 Object.freeze({title:'Безубыточность',metric:'break-even-orders',
  values:Object.freeze({fixedCosts:60000,salePrice:500,variableCostPerOrder:200})}),
 Object.freeze({title:'Конверсия',metric:'conversion',
  values:Object.freeze({visitors:600,orders:18})}),
 Object.freeze({title:'Стоимость заявки',metric:'cost-per-lead',
  values:Object.freeze({adSpend:12000,leads:30})})
]);
export function runMathDemonstration(log=console.log){
 log('SEYVEO · Business Math · исключительно примеры, не пользовательские данные');
 for(const item of DEMO_EXAMPLES){
  const result=calculateBusiness(item.metric,item.values);
  const verified=verifyBusinessClaim(item.metric,item.values,result.exact);
  log(item.title+': '+result.exact+' '+result.unit+'; проверка: '+verified.verdict);
 }
 log('Никаких платежей, интернет-запросов, сохранений или обучения весов модели.');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 runMathDemonstration();
