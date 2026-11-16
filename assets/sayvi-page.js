/* SEYVEO: old Sayvi chat removed. Fresh chat lives in sayvi-chat-new.html. */
(()=>{
'use strict';
function destination(){return 'sayvi-chat-new.html?v='+Date.now()};
function open(){window.location.assign(destination());return true}
function preparePublicSearch(question){
 const query=String(question||'').trim().slice(0,600);
 if(!query)return;
 // Only an explicitly submitted public question; no URL history or files.
 try{sessionStorage.setItem('seyveo.sayvi.search-handoff.v1',JSON.stringify({question:query,at:Date.now()}))}catch{}
}
function close(){if(window.location.pathname.endsWith('/sayvi-chat-new.html'))window.history.back()}
window.SEYVEO_CONVERSATION={
 open,close,
 renderTurns(){},status(){},beginStream(question){preparePublicSearch(question);return open()},updateStream(){},endStream(){},
 beginBusinessIntroduction(){return open()},
 showSearchResults(){return open()},
 showRichAnswer(){return open()}
};
window.SEYVEO_CHAT_ACTIVITY={begin(){return false},finish(){},cancel(){return false},isBusy(){return false}};
document.getElementById('openSayviBusinessIntro')?.addEventListener('click',open);
})();
