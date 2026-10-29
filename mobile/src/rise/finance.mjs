export function financeSummary(items,months=3){
 if(!Array.isArray(items)||!Number.isSafeInteger(months)||months<0||months>24)throw new TypeError('Invalid budget');
 let startup=0,monthly=0;
 for(const item of items){
  if(!item||!Number.isSafeInteger(item.amount)||item.amount<0||item.amount>1e10||!['startup','monthly'].includes(item.kind))throw new TypeError('Invalid cost');
  if(item.kind==='startup')startup+=item.amount;else monthly+=item.amount;
 }
 const reserve=monthly*months,total=startup+reserve;
 if(![startup,monthly,reserve,total].every(Number.isSafeInteger))throw new RangeError('Budget overflow');
 return {startup,monthly,reserve,months,total};
}
