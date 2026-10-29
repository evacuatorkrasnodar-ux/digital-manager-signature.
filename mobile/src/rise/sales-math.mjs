// Integer money units, e.g. whole rubles. No invented market prices.
export function breakEvenOrders(monthlyFixed,pricePerOrder,variablePerOrder){
 for(const n of [monthlyFixed,pricePerOrder,variablePerOrder])if(!Number.isSafeInteger(n)||n<0||n>1e10)throw new TypeError('Invalid value');
 const margin=pricePerOrder-variablePerOrder;
 if(margin<=0)return {possible:false,margin,orders:null,revenue:null};
 const orders=Math.ceil(monthlyFixed/margin);
 const revenue=orders*pricePerOrder;
 if(!Number.isSafeInteger(revenue))throw new RangeError('Revenue overflow');
 return {possible:true,margin,orders,revenue};
}
