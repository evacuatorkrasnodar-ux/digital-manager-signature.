/* SEYVEO Research Planner: decisions and source review, never model training.
   Public search results are untrusted excerpts, not proof of a claim. */
const CATEGORIES=Object.freeze([
 ['legal',/(?:закон|законодатель|постановлен|правил|регулирован|лицензи|налог)/iu],
 ['fact-check',/(?:правда|фейк|провер|слух|действительно|реально|на самом деле)/iu],
 ['shopping',/(?:цен|стоит|купить|характеристик|сравн|модел|товар)/iu],
 ['news',/(?:новост|последн|сегодня|вчера|недавно|объявил|выпустил|показал)/iu],
 ['science',/(?:исследован|открыти|научн|учёные|ученые|космос|медицин|технологи)/iu],
 ['reference',/./u]
]);
const SENSITIVE=/(?:^|[^а-яё])(?:мой|моя|моё|мои|моих|наш|наша|наше|наши)(?=$|[^а-яё])|(?:парол|паспорт|переписк|зарплат|договор|сотрудник|клиент|банковск|медицинск|здоровь|диагноз|адрес|телефон|личн(?:ый|ые|ая)|секретн|персональн)/iu
function domainOf(url){
 try{return new URL(url).hostname.toLowerCase().replace(/^www\./u,'')}catch{return ''}
}
function dateOf(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(value))return null;
 const parsed=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value?value:null;
}
export function planPublicResearch(question,{today=new Date().toISOString().slice(0,10)}={}){
 if(typeof question!=='string'||!question.trim()||question.length>1000)throw Error('invalid-question');
 const original=question.trim();
 if(SENSITIVE.test(original))return Object.freeze({
  allowed:false,reason:'potential-personal-information',category:'private',
  searchQuery:null,needsFreshness:false,reviewRules:[]});
 const category=CATEGORIES.find(([,pattern])=>pattern.test(original))?.[0]||'reference';
 const needsFreshness=['fact-check','news','shopping','legal'].includes(category);
 // Remove an assistant wake word and filler, but never make up missing subjects.
 const cleaned=original.replace(/^(?:с[эе]йви|с[эе]й)[,!\s]*/iu,'')
  .replace(/^(?:а\s+)?(?:что\s+)?(?:правда(?:\s+ли|\s+что)?|неужели)\s+/iu,'')
  .trim().replace(/[?!.]+$/u,'').trim();
 const searchQuery=(cleaned||original).slice(0,600);
 const reviewRules=category==='fact-check'
  ?['Сравнить исходное заявление с независимой публикацией','Отделить демонстрацию от планов и обещаний']
  :category==='legal'
   ?['Проверить юрисдикцию и дату действия нормы','Искать текст на официальном государственном ресурсе']
   :category==='shopping'
    ?['Проверить дату и регион цены','Отделять описание производителя от независимых испытаний']
    :category==='news'
     ?['Уточнить дату события и дату публикации','Сравнить минимум два разных источника']
     :['Проверить автора, происхождение и контекст','Сопоставить независимые сведения'];
 return Object.freeze({allowed:true,category,searchQuery,needsFreshness,
  searchedOn:dateOf(today),reviewRules});
}
export function reviewPublicSources(plan,results,{maxSources=6}={}){
 if(!plan?.allowed||!Array.isArray(results))throw Error('invalid-research-input');
 const grouped=new Map();
 for(const item of results){
  if(!item||typeof item!=='object')continue;
  const domain=domainOf(item.url);
  if(!domain)continue;
  if(!grouped.has(domain))grouped.set(domain,[]);
  grouped.get(domain).push(item);
 }
 const chosen=[],domains=[...grouped.keys()];
 // Diversify domains rather than letting one publisher occupy the whole answer.
 for(let round=0;round<2&&chosen.length<maxSources;round++){
  for(const domain of domains){
   const result=grouped.get(domain)[round];
   if(result){chosen.push(result);if(chosen.length>=maxSources)break}
  }
 }
 const dated=chosen.filter(x=>dateOf(x.publishedAt));
 const notes=['Результаты поиска — материалы для проверки, а не подтверждённый вывод.'];
 if(chosen.length&&domains.length<2)notes.push('Материалы пока только с одного сайта: нужна независимая проверка.');
 if(plan.needsFreshness&&dated.length<chosen.length)notes.push('Часть публикаций без подтверждённой даты.');
 if(plan.category==='legal')notes.push('Проверяй действующую редакцию нормативного документа и юрисдикцию.');
 return Object.freeze({results:chosen,sourceCount:chosen.length,distinctDomains:new Set(chosen.map(x=>domainOf(x.url))).size,
  factChecked:false,notes:Object.freeze(notes),reviewRules:plan.reviewRules});
}
