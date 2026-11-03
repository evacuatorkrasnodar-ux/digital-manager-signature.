/* SEYVEO My World · App Library navigation.
 * The Home owns live updates and tasks, Life Events owns the underlying data.
 * My World is a quiet launch surface, not a second feed or search. */
(()=>{
'use strict';
const entry=document.getElementById('lifeManageEntry');
if(!entry)return;
entry.addEventListener('click',()=>{location.hash='#manage'});
})();
