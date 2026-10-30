/* Safe guidance for failed SEYVEO demo actions; no artificial send or success. */
const root=document.getElementById('unifiedPersonalTasksView');
if(root){
 const css=document.createElement('style');
 css.textContent='.sah-recovery{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap}.sah-recovery button{border:1px solid var(--soft-line,#526b60);border-radius:99px;padding:7px 10px;background:transparent;color:inherit;font:inherit;font-size:12px}.sah-recovery-note{display:block;margin-top:7px;font-size:12px;opacity:.75}';
 document.head.append(css);
 function enhance(){
  for(const row of root.querySelectorAll('.sah-row[data-state="failed"]')){
   if(row.querySelector('.sah-recovery'))continue;
   const actions=document.createElement('div');actions.className='sah-recovery';
   const note=document.createElement('small');note.className='sah-recovery-note';
   for(const [name,message] of [['Исправить','Проверь данные исходной карточки. Повторное исполнение ещё не подключено.'],['Повторить','Исполнитель не подключён. Задача остаётся незавершённой.']]){
    const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',()=>{note.textContent=message;});actions.append(b);
   }
   row.append(actions,note);
  }
 }
 const observer=new MutationObserver(enhance);observer.observe(root,{subtree:true,childList:true});enhance();
}
