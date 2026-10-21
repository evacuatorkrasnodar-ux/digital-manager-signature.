/* SEYVEO · contact QR: generated on device from user-approved public contact fields. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const open=$('seyveoCompanyQrOpen'),dialog=$('seyveoQrCardDialog'),host=$('seyveoQrImage'),form=$('seyveoCompanyForm');
if(!open||!dialog||!host||!form)return;
const KEY='seyveo-company-passport-v1';
const esc=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').trim();
function record(){try{return JSON.parse(localStorage.getItem(KEY)||'null')||{}}catch{return {}}}
function safeWebsite(s){try{const url=new URL(String(s||''));return /^https?:$/.test(url.protocol)?url.href:''}catch{return ''}}
function cardText(r){
 const lines=['BEGIN:VCARD','VERSION:3.0','FN:'+esc(r.name),'ORG:'+esc(r.name)];
 if(r.industry)lines.push('TITLE:'+esc(r.industry));
 if(r.phone)lines.push('TEL;TYPE=WORK,VOICE:'+esc(r.phone));
 if(r.email)lines.push('EMAIL;TYPE=WORK:'+esc(r.email));
 const web=safeWebsite(r.website);if(web)lines.push('URL:'+web);
 if(r.city)lines.push('ADR;TYPE=WORK:;;;;'+esc(r.city)+';;');
 lines.push('END:VCARD');
 return lines.join('\r\n');
}
function update(){
 const r=record();
 if(!r.name){$('seyveoQrStatus').textContent='Сначала сохраните название бизнеса.';return false}
 $('seyveoQrCompanyName').textContent=r.name;
 $('seyveoQrCompanySubtitle').textContent=r.industry||'Цифровая визитка';
 $('seyveoQrCompanyContacts').textContent=[r.phone,r.email,r.website,r.city].filter(Boolean).join(' · ');
 host.replaceChildren();
 if(typeof window.QRCode!=='function'){
  $('seyveoQrStatus').textContent='Генератор QR не загрузился. Проверьте интернет и повторите.';
  return false;
 }
 try{
  new window.QRCode(host,{text:cardText(r),width:210,height:210,colorDark:'#101617',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});
  $('seyveoQrStatus').textContent='Наведите камеру другого телефона на QR, чтобы добавить контакт.';
  return true;
 }catch{
  $('seyveoQrStatus').textContent='Не удалось создать QR. Попробуйте сократить контактные данные.';
  return false;
 }
}
open.addEventListener('click',()=>{
 const r=record();
 if(!r.name){const s=$('seyveoCompanyDialog')?.querySelector('[data-passport-status]');if(s)s.textContent='Сохраните название бизнеса, чтобы создать визитку.';return}
 const owner=$('seyveoCompanyDialog');if(owner?.open)owner.close();
 if(!dialog.open)dialog.showModal();
 update();
});
$('seyveoQrClose')?.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
$('seyveoQrSave')?.addEventListener('click',()=>{
 const canvas=host.querySelector('canvas');
 const img=host.querySelector('img');
 const url=canvas?.toDataURL?.('image/png')||img?.src;
 if(!url){$('seyveoQrStatus').textContent='Пока нет QR для сохранения.';return}
 const a=document.createElement('a');a.href=url;a.download='seyveo-business-qr.png';document.body.append(a);a.click();a.remove();
});
$('seyveoQrShare')?.addEventListener('click',async()=>{
 const r=record();if(!r.name)return;
 const vcf=cardText(r);
 try{
  if(navigator.share){await navigator.share({title:r.name,text:vcf});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(vcf);$('seyveoQrStatus').textContent='Контакт скопирован.';return}
 }catch(e){if(e?.name==='AbortError')return}
 $('seyveoQrStatus').textContent='Отправка недоступна на этом устройстве.';
});
})();