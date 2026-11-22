/* SEYVEO · Кошелёк: личный учёт. Банковские платежи не подключены. */
(()=>{'use strict';
const dialog=document.getElementById('seyveoPayDialog');if(!dialog)return;
let launchButton=null;
const css=document.createElement('link');css.rel='stylesheet';css.href='assets/seyveo-personal-wallet.css?v=2';document.head.appendChild(css);
const ready=new Promise(resolve=>{const script=document.createElement('script');script.src='assets/seyveo-personal-wallet.js?v=3';script.onload=()=>resolve(true);script.onerror=()=>resolve(false);document.body.appendChild(script);});
async function open(){
 launchButton=document.activeElement;
 if(!await ready){window.alert('Кошелёк пока не загрузился. Попробуй обновить страницу.');return;}
 if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
 window.SEYVEO_WALLET?.open?.();
}
function close(){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');launchButton?.focus?.();}
document.addEventListener('click',ev=>{
 if(ev.target.closest('[data-calendar-space="wallet"],[data-world-space="wallet"]')){ev.preventDefault();ev.stopImmediatePropagation();open();}
},true);
dialog.addEventListener('click',ev=>{if(ev.target.closest('[data-syp="close"]'))close();else if(ev.target===dialog)close();});
dialog.addEventListener('close',()=>launchButton?.focus?.());
// Reuse the existing locally stored wallet from the permanent Work navigation.
window.SEYVEO_PAY=Object.freeze({open,close});
})();
