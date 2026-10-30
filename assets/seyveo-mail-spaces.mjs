/* SEYVEO mail workspace boundaries. Shared UI, separate account contexts. */
export const MAIL_SPACES=Object.freeze({
 personal:Object.freeze({id:'personal',label:'Личная почта',technology:'SEYVEO · PERSONAL MAIL'}),
 business:Object.freeze({id:'business',label:'Рабочая почта',technology:'SEYVEO · BUSINESS MAIL'})
});
export function mailSpaceFor(entry){
 if(entry==='personal'||entry==='business')return MAIL_SPACES[entry];
 throw new Error('Unknown mail space');
}
export function authorizeMailContext({space,accountSpace,role}={}){
 const scope=mailSpaceFor(space);
 if(accountSpace!==scope.id)throw new Error('Mailbox workspace boundary');
 if(scope.id==='business'&&!['owner','manager','authorized_employee'].includes(role))
  throw new Error('Business mailbox requires authorized role');
 return scope;
}
export function createScopedDraftStore(){
 const stores={personal:[],business:[]};
 return Object.freeze({
  list(space){mailSpaceFor(space);return stores[space].map(d=>({...d}));},
  add(space,draft){mailSpaceFor(space);stores[space].push({...draft});},
  update(space,index,draft){mailSpaceFor(space);if(!stores[space][index])throw new Error('Draft missing');stores[space][index]={...draft};},
  remove(space,index){mailSpaceFor(space);stores[space].splice(index,1);}
 });
}
/* Browser prototype only: never consider this function server-side authorization. */
