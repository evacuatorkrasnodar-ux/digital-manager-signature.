/* Pure model checks for the local manager-review workflow. */
export function shouldShowManagerReview(task){
 return !!(task&&task.source==='business-mail'&&task.approvalFlow===true&&task.reviewStatus==='review'&&task.done!==true);
}
export function checkReviewStateRules(){
 const base={source:'business-mail',approvalFlow:true,done:false};
 const cases=[
  ['Назначено', {...base,reviewStatus:'assigned'},false],
  ['На проверке',{...base,reviewStatus:'review'},true],
  ['Возвращено',{...base,reviewStatus:'rework'},false],
  ['Принято',{...base,reviewStatus:'approved',done:true},false],
  ['Личная задача',{...base,source:'personal',reviewStatus:'review'},false],
  ['Без согласования',{...base,approvalFlow:false,reviewStatus:'review'},false]
 ];
 return cases.map(([name,task,expected])=>({name,passed:shouldShowManagerReview(task)===expected}));
}
