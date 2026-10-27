/* SEYVEO · One real dock in full-screen workspaces.
 * Modal dialogs are in the browser top layer. The original dock must move
 * into the active workspace to remain accessible. Never duplicate the dock.
 * Compact alerts remain modal and may temporarily obscure navigation.
 */
(()=>{
'use strict';
const dock=document.querySelector('footer.dock');
if(!dock||window.SEYVEO_DOCK_CONTINUITY)return;
const WORKSPACES=new Set([
 'calendarSpaceDialog','seyveoSmartHomeDialog','seyveoContactsDialog','seyveoFamilyDialog',
 'notesDialog','noteReadDialog','noteReviewDialog','noteModeDialog','notePaperDialog',
 'noteScanDialog','calendarEventDialog','personalTaskDialog','manageRoadmapDialog',
 'manageConnectionsDialog','manageDataDialog','assistantChatHistoryDialog',
 'homeWidgetsManageDialog','seyveoAccountDemo','seyveoPulseDialog','seyveoStudioDialog',
 'seyveoCompanyDialog','seyveoQrCardDialog','seyveoAvatarDialog','homeWidgetDetails',
 'pictureBreakdownDialog','assistantQuickSettings','onboardDialog','seyveoPayDialog'
]);
const ROUTES=new Set(['navHome','navTasks','navPicture','navManage','assistantButton']);
const origin=document.createComment('SEYVEO original dock location');
dock.parentNode.insertBefore(origin,dock);
let order=[];
let current=null;
const isWorkspace=el=>el?.tagName==='DIALOG'&&WORKSPACES.has(el.id);
function update(){
 order=order.filter(el=>el.isConnected&&el.open&&isWorkspace(el));
 for(const item of document.querySelectorAll('dialog[open]')){
  if(isWorkspace(item)&&!order.includes(item))order.push(item);
 }
 const next=order[order.length-1]||null;
 if(next===current&&dock.parentNode===(next||origin.parentNode))return;
 if(next){
  next.appendChild(dock);
  next.classList.add('seyveo-dock-host');
 }else if(origin.isConnected){
  origin.parentNode.insertBefore(dock,origin.nextSibling);
 }
 if(current&&current!==next)current.classList.remove('seyveo-dock-host');
 current=next;
}
const watch=new MutationObserver(records=>{
 for(const record of records){
  const el=record.target;
  if(!isWorkspace(el))continue;
  order=order.filter(x=>x!==el);
  if(el.open)order.push(el);
 }
 update();
});
watch.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open']});
// Keep the existing navigation button handlers. Before a destination click,
// close open full-screen dialogs so routing is not blocked by their top layer.
// In music mode the outer four buttons are player controls: leave them alone.
dock.addEventListener('click',event=>{
 const button=event.target.closest?.('button');
 if(!button||!ROUTES.has(button.id))return;
 if(dock.classList.contains('seyveo-music-dock')&&button.dataset.svMusicAction)return;
 const visible=order.filter(d=>d.open);
 if(!visible.length)return;
 for(const dialog of [...visible].reverse())if(dialog.open)dialog.close();
 update();
},true);
document.addEventListener('close',event=>{
 if(isWorkspace(event.target))update();
},true);
window.SEYVEO_DOCK_CONTINUITY=Object.freeze({
 refresh:update,
 isPortaled:()=>!!current,
 workspace:()=>current?.id||null
});
update();
})();
