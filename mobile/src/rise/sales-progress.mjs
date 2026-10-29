export function salesProgress(revenue,cost,fixed){
 if(![revenue,cost,fixed].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12))throw new TypeError('Invalid amounts');
 return {contribution:revenue-cost,remaining:Math.max(0,fixed-(revenue-cost))};
}

export function compareSalesMonths(current,previous){
 const margin=month=>month.revenue-month.cost;
 const change=margin(current)-margin(previous);
 let advice='Проверьте данные продаж за оба месяца.';
 if(previous.orders>0&&current.orders>0){
  if(current.revenue>previous.revenue&&current.cost-previous.cost>current.revenue-previous.revenue)
   advice='Выручка выросла, но затраты увеличились сильнее. Проверьте себестоимость заказов.';
  else if(change>0)advice='Маржинальный доход вырос. Проверьте, какие действия помогли.';
  else if(change<0)advice='Маржинальный доход снизился. Сравните заказы и затраты.';
  else advice='Маржинальный доход не изменился.';
 }
 return {change,advice};
}
