export const plan=[
 ['concept','Описать идею и будущего клиента'],
 ['demand','Проверить спрос'],
 ['budget','Подготовить смету'],
 ['legal','Проверить местные требования'],
 ['launch','Подготовить первые продажи']
];
export function sumBudget(amounts){
 if(!Array.isArray(amounts)||amounts.some(x=>!Number.isSafeInteger(x)||x<0||x>1e10))throw Error('Invalid amount');
 return amounts.reduce((sum,x)=>sum+x,0);
}
