/* SEYVEO · one deterministic monogram palette for Mail, Contacts and Chats.
   The first displayed initial is the common key. No identity matching by name. */
(()=>{
 'use strict';
 const palette=Object.freeze(['#E9EFF5','#E9F2EF','#EEEAF4','#F3EDE6','#E8F1F4','#F1EBF0']);
 function tint(initial){
  const key=[...String(initial||'').trim().toLocaleLowerCase('ru-RU')][0]||'';
  if(!key||key==='?'||key==='•')return '#E9EAED';
  return palette[key.codePointAt(0)%palette.length];
 }
 window.SEYVEO_AVATAR_COLORS=Object.freeze({tint});
})();
