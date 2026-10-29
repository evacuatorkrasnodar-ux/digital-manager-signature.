export const salesProgress=(revenue,cost,fixed)=>({remaining:Math.max(0,fixed-(revenue-cost))});
