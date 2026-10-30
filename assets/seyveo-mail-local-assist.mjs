/* Offline deterministic assistance for manually pasted business correspondence.
   Not AI, not a connected inbox, and never sends mail. */
export function inspectPastedMail(raw){
 const text=String(raw||'').trim().slice(0,12000);
 if(!text)return {kind:'empty',summary:'Добавьте текст письма.',reply:''};
 const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const summary=(lines.find(x=>x.length>30)||lines[0]||'').slice(0,220);
 const topic=/счет|счёт|оплат|договор|акт/i.test(text)?'Документы и оплата':/достав|заказ|стоим|цен/i.test(text)?'Заказ или доставка':/жалоб|претенз|не работает|проблем/i.test(text)?'Обращение клиента':'Общий вопрос';
 const reply='Здравствуйте! Спасибо за ваше письмо. Мы изучим обращение и вернёмся с ответом после уточнения деталей.';
 return {kind:'local-rules',topic,summary,reply,requiresHumanReview:true};
}
