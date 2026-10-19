/* SEYVEO · deterministic business calculator v0.1.
 * Pure mathematics: no LLM, internet, user files, bank access, writes or actions.
 * ONLY explicitly supplied numeric values are used, never guessed from chat.
 */
export const BUSINESS_METRICS=Object.freeze([
 'revenue','profit-before-tax','gross-margin','markup','break-even-orders',
 'conversion','cost-per-lead','customer-acquisition-cost','order-growth'
]);
const UNITS=Object.freeze({
 'revenue':'RUB','profit-before-tax':'RUB','gross-margin':'percent',
 'markup':'percent','break-even-orders':'orders','conversion':'percent',
 'cost-per-lead':'RUB','customer-acquisition-cost':'RUB','order-growth':'percent'
});
const LIMIT_CENTS=100000000000; // 1,000,000,000 rubles per input
const MAX_COUNT=10000000;
function record(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)}
function decimal(value,{negative=false}={}){
 if(typeof value!=='string'&&typeof value!=='number')throw Error('invalid-number');
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('invalid-number');
 const text=String(value);
 const rule=negative?/^-?(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/u:/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/u;
 if(!rule.test(text))throw Error('invalid-decimal: use rubles and up to two decimals');
 const minus=text.startsWith('-');
 const [whole,fraction='']=text.replace(/^-/, '').split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents>LIMIT_CENTS)throw Error('amount-too-large');
 return minus?-cents:cents;
}
function integer(value){
 if((typeof value!=='number'&&typeof value!=='string')||!/^(?:0|[1-9]\d{0,7})$/u.test(String(value)))
  throw Error('invalid-count');
 const number=Number(value);
 if(!Number.isSafeInteger(number)||number>MAX_COUNT)throw Error('invalid-count');
 return number;
}
function percentBasis(numerator,denominator){
 if(denominator<=0)return null;
 return Math.round(numerator*10000/denominator);
}
function formatMinor(minor){
 const sign=minor<0?'-':'',amount=Math.abs(minor);
 return sign+Math.floor(amount/100)+'.'+String(amount%100).padStart(2,'0');
}
function formatResult(minor,unit){
 return unit==='orders'?String(minor):formatMinor(minor);
}
function expectedInputKeys(metric){
 return ({
  revenue:['unitPrice','quantity'],
  'profit-before-tax':['revenue','variableCosts','fixedCosts'],
  'gross-margin':['salePrice','unitCost'],
  markup:['salePrice','unitCost'],
  'break-even-orders':['fixedCosts','salePrice','variableCostPerOrder'],
  conversion:['visitors','orders'],
  'cost-per-lead':['adSpend','leads'],
  'customer-acquisition-cost':['adSpend','newCustomers'],
  'order-growth':['previousOrders','currentOrders']
 })[metric];
}
function validate(metric,values){
 if(!BUSINESS_METRICS.includes(metric))throw Error('unsupported-metric');
 if(!record(values))throw Error('invalid-inputs');
 const names=expectedInputKeys(metric);
 if(Object.keys(values).length!==names.length||names.some(k=>!Object.hasOwn(values,k)))
  throw Error('missing-or-unexpected-fields');
 const counts=new Set(['quantity','visitors','orders','leads','newCustomers','previousOrders','currentOrders']);
 const parsed={};
 for(const key of names)parsed[key]=counts.has(key)?integer(values[key]):decimal(values[key]);
 return parsed;
}
function safeProduct(a,b){
 const n=a*b;
 if(!Number.isSafeInteger(n)||Math.abs(n)>LIMIT_CENTS)throw Error('calculation-overflow');
 return n;
}
const WARNING='Чистая арифметика по переданным значениям; реальность исходных данных, налоги и полнота расходов не проверялись.';

/** Output minor units = kopecks (RUB), hundredths of a percent, or orders.
 * Both the inputs and the model-produced claims are untrusted until checked.
 */
export function calculateBusiness(metric,values){
 const x=validate(metric,values),unit=UNITS[metric];
 let minor=null,formula='',reason='';
 switch(metric){
  case 'revenue':
   minor=safeProduct(x.unitPrice,x.quantity);
   formula='unitPrice × quantity';
   break;
  case 'profit-before-tax':
   minor=x.revenue-x.variableCosts-x.fixedCosts;
   formula='revenue − variableCosts − fixedCosts';
   break;
  case 'gross-margin':
   minor=percentBasis(x.salePrice-x.unitCost,x.salePrice);
   formula='(salePrice − unitCost) / salePrice × 100%';
   reason='Sale price must be greater than zero';break;
  case 'markup':
   minor=percentBasis(x.salePrice-x.unitCost,x.unitCost);
   formula='(salePrice − unitCost) / unitCost × 100%';
   reason='Unit cost must be greater than zero';break;
  case 'break-even-orders': {
   const contribution=x.salePrice-x.variableCostPerOrder;
   formula='ceil(fixedCosts / (salePrice − variableCostPerOrder))';
   if(contribution<=0){
    minor=null;reason='Non-positive contribution per sale';
   }else{
    minor=Math.ceil(x.fixedCosts/contribution);
    if(!Number.isSafeInteger(minor)||minor>MAX_COUNT){minor=null;reason='Required count exceeds supported range';}
   }
   break;
  }
  case 'conversion':
   if(x.orders>x.visitors)throw Error('orders-exceed-visitors');
   minor=percentBasis(x.orders,x.visitors);
   formula='orders / visitors × 100%';reason='Visitor count is zero';break;
  case 'cost-per-lead':
   minor=x.leads?Math.round(x.adSpend/x.leads):null;
   formula='adSpend / leads';reason='No leads supplied';break;
  case 'customer-acquisition-cost':
   minor=x.newCustomers?Math.round(x.adSpend/x.newCustomers):null;
   formula='adSpend / newCustomers';reason='No new customers supplied';break;
  case 'order-growth':
   minor=x.previousOrders?percentBasis(x.currentOrders-x.previousOrders,x.previousOrders):null;
   formula='(currentOrders − previousOrders) / previousOrders × 100%';
   reason='No previous orders to form a growth baseline';break;
  default:throw Error('unsupported-metric');
 }
 if(minor!==null&&!Number.isSafeInteger(minor))throw Error('calculation-overflow');
 return Object.freeze({
  metric,status:minor===null?'not-calculable':'calculated',
  formula,unit,
  value:minor===null?null:minor/(unit==='orders'?1:100),
  exact:minor===null?null:formatResult(minor,unit),
  minorValue:minor, // internal exact comparison: kopecks, basis points, or orders
  reason:minor===null?reason:null,
  warning:WARNING,
  inputSource:'caller-provided-only',
  inputFactsVerified:false,modelCalled:false,externalCallsMade:0,
  executed:false,paymentMade:false,filesChanged:false
 });
}
/** Compare a numerical model claim with deterministic arithmetic.
 * Never infer the original numbers from prose; a caller supplies both inputs.
 */
export function verifyBusinessClaim(metric,values,claim){
 const expected=calculateBusiness(metric,values);
 if(expected.status!=='calculated')return Object.freeze({
  verdict:'unverifiable',expected:expected.exact,unit:expected.unit,reason:expected.reason,
  executed:false
 });
 const claimed=expected.unit==='orders'?integer(claim):decimal(claim,{negative:true});
 return Object.freeze({
  verdict:claimed===expected.minorValue?'match':'mismatch',
  expected:expected.exact,claimed:formatResult(claimed,expected.unit),
  unit:expected.unit,formula:expected.formula,
  inputFactsVerified:false,executed:false
 });
}
