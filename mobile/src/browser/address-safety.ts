/** Local URL heuristics only; not a threat-intelligence service. */
export function checkBrowserAddress(value:string):{allowed:boolean;warning:string}{
 try{
  if(value.length>2048)return {allowed:false,warning:'Слишком длинный адрес.'};
  const u=new URL(value);
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password)
   return {allowed:false,warning:'Неподдерживаемая или небезопасная схема адреса.'};
  if(u.protocol==='http:')
   return {allowed:true,warning:'Соединение без HTTPS: передаваемые данные могут быть не защищены.'};
  if(u.hostname.includes('xn--'))
   return {allowed:true,warning:'Адрес содержит международное доменное имя. Проверьте написание сайта.'};
  return {allowed:true,warning:''};
 }catch{return {allowed:false,warning:'Некорректный адрес сайта.'}}
}
