export type OfflineRoute = 'knowledge'|'device-notes'|'offline-maps'|'network-required'|'on-device-model'|'knowledge-search'|'local-help';
export type OfflinePlan = Readonly<{route: OfflineRoute; needsInternet:boolean; pack?:string; priority?:string; deviceLocation?:boolean}>;
export function planOfflineReply(question:string,options?:{online?:boolean;modelReady?:boolean;packs?:string[];deviceLocation?:boolean}): OfflinePlan;
export function offlineFallback(plan:OfflinePlan):string|null;
