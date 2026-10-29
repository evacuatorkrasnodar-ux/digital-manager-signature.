export function salesProgress(revenue,cost,fixed){
 if(![revenue,cost,fixed].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12))throw new TypeError('Invalid amounts');
 return {contribution:revenue-cost,remaining:Math.max(0,fixed-(revenue-cost))};
}
