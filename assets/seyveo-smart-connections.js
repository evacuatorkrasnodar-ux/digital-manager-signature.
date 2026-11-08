/* SEYVEO Smart Connections: one hub in Management only.
 * Navigation and preview only. No pairing, account linking or permission grant.
 */
(()=>{
 'use strict';
 const dialog=document.getElementById('manageConnectionsDialog');
 const manageOpen=document.getElementById('openManageConnections');
 const hub=document.getElementById('seyveoSmartConnectionsHub');
 if(!dialog||!manageOpen||!hub)return;
 const sections={
  people:document.getElementById('svSmartPeopleFold'),
  devices:document.getElementById('svSmartDevicesFold'),
  services:document.getElementById('svSmartServicesFold')
 };
 if(Object.values(sections).some(x=>!x))return;
 let updating=false;
 function select(section){
  if(!sections[section])return;
  updating=true;
  for(const [name,fold] of Object.entries(sections))fold.open=name===section;
  updating=false;
 }
 // Keep only one category expanded. This also works on older iPhone Safari.
 for(const [name,fold] of Object.entries(sections)){
  fold.addEventListener('toggle',()=>{
   if(updating||!fold.open)return;
   for(const [other,peer] of Object.entries(sections)){
    if(other!==name&&peer.open)peer.open=false;
   }
  });
 }
 manageOpen.addEventListener('click',()=>select('people'));
 function open(section='people'){
  // The one entry point is Management; reuse its existing dialog and handlers.
  if(!dialog.open)manageOpen.click();
  select(section);
 }
 // Business/connection help is always surfaced inside the same Services fold.
 window.addEventListener('seyveo:connection-help',()=>select('services'));
 window.SEYVEO_SMART_CONNECTIONS=Object.freeze({open});
})();
