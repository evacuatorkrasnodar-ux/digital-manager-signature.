/* SEYVEO Evidence Brief: cautious summaries of retrieved search snippets.
   This is not independent fact checking or an LLM. */
const clean=value=>String(value??'').replace(/\s+/gu,' ').trim();
export function composeEvidenceBrief(research){
 if(!research||!Array.isArray(research.results))throw Error('invalid-research');
 const items=research.results.slice(0,4).filter(x=>x&&clean(x.title)&&clean(x.snippet));
 if(!items.length)return {answer:'Не нашла достаточных материалов для ответа. Ничего не буду придумывать.',confidence:'insufficient',cited:[]};
 const diverse=research.distinctDomains>=2;
 const lines=items.map((x,i)=>{
  const text=clean(x.snippet).slice(0,220);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(x.publishedAt||'')?' · '+x.publishedAt:'';
  return (i+1)+'. '+text+' ['+(i+1)+']'+date;
 });
 const intro=diverse?'Нашла публикации из нескольких источников. Вот что в них говорится:':
  'Пока удалось найти материалы только из одного источника. Вот что в нём говорится:';
 const caution=research.category==='fact-check'
  ?'Одних поисковых выдержек недостаточно, чтобы подтвердить или опровергнуть заявление.'
  :research.category==='legal'
   ?'Нормы нужно сверять с актуальными официальными документами и юрисдикцией.'
   :'Это выдержки из поиска, а не независимо проверенный вывод.';
 return {answer:intro+'\n\n'+lines.join('\n')+'\n\n'+caution,
  confidence:'unverified',cited:items.map((x,i)=>({number:i+1,url:x.url}))};
}
