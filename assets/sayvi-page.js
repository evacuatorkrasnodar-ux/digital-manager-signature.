/* SEYVEO: old Sayvi chat removed. Fresh chat lives in sayvi-chat-new.html. */
(()=>{
'use strict';
const destination='sayvi-chat-new.html?v=f6d249c6';
function open(){window.location.assign(destination);return true}
function close(){if(window.location.pathname.endsWith('/sayvi-chat-new.html'))window.history.back()}
window.SEYVEO_CONVERSATION={
 open,close,
 renderTurns(){},status(){},beginStream(){open()},updateStream(){},endStream(){},
 beginBusinessIntroduction(){return open()},
 showSearchResults(){return open()},
 showRichAnswer(){return open()}
};
window.SEYVEO_CHAT_ACTIVITY={begin(){return false},finish(){},cancel(){return false},isBusy(){return false}};
document.getElementById('openSayviBusinessIntro')?.addEventListener('click',open);
})();
