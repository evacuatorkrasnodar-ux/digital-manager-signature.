/* SEYVEO Rich Answers — safe, lightweight content blocks inside Feather Chat.
   No HTML from a model is executed. No figures or numbers are invented by this renderer. */
(()=>{
'use strict';
const MAX_BLOCKS=6;
const short=(value,max=300)=>String(value??'').trim().slice(0,max);
const https=value=>{
 try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}
 catch{return null}
};
const make=(tag,cls,content)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(content!==undefined)el.textContent=content;
 return el;
};
function cleanBlocks(value){
 if(!Array.isArray(value))return [];
 return value.slice(0,MAX_BLOCKS).flatMap(block=>{
  if(!block||typeof block!=='object')return [];
  const title=short(block.title,110);
  if(block.type==='table'){
   const columns=Array.isArray(block.columns)?block.columns.slice(0,6).map(v=>short(v,75)):[];
   if(!columns.length||!Array.isArray(block.rows))return [];
   const rows=block.rows.slice(0,20).filter(row=>Array.isArray(row))
    .map(row=>columns.map((_,i)=>short(row[i],190)));
   if(!rows.length)return [];
   return [{type:'table',title,columns,rows}];
  }
  if(block.type==='bars'){
   const values=Array.isArray(block.items)?block.items.slice(0,8).flatMap(item=>{
    const raw=item?.value;
    if(typeof raw!=='number')return [];
    const value=raw,label=short(item?.label,60);
    return label&&Number.isFinite(value)&&value>=0&&value<=1e12?[{label,value}]:[];
   }):[];
   if(!values.length)return [];
   return [{type:'bars',title,items:values,unit:short(block.unit,20),source:short(block.source,150)}];
  }
  if(block.type==='steps'){
   const items=Array.isArray(block.items)?block.items.slice(0,7).map(v=>short(v,210)).filter(Boolean):[];
   if(!items.length)return [];
   return [{type:'steps',title,items}];
  }
  if(block.type==='image'){
   const url=https(block.url),sourceUrl=https(block.sourceUrl);
   const credit=short(block.credit,110),alt=short(block.alt,160);
   if(block.approved!==true||!url||!sourceUrl||!credit||!alt)return [];
   return [{type:'image',title,url,sourceUrl,credit,alt}];
  }
  if(block.type==='note'){
   const body=short(block.body,400);
   return body?[{type:'note',title,body}]:[];
  }
  return [];
 });
}
function render(input){
 const blocks=cleanBlocks(input);
 if(!blocks.length)return null;
 const outer=make('div','seyveo-rich-answer');
 outer.setAttribute('aria-label','Иллюстрации и структурированные данные ответа');
 for(const block of blocks){
  const section=make('section','seyveo-rich-block seyveo-rich-'+block.type);
  if(block.title)section.append(make('h4','seyveo-rich-title',block.title));
  if(block.type==='table'){
   const scroller=make('div','seyveo-rich-table-scroll');
   const table=make('table','seyveo-rich-table');
   const thead=document.createElement('thead'),head=document.createElement('tr');
   for(const c of block.columns)head.append(make('th','',c));
   thead.append(head);table.append(thead);
   const tbody=document.createElement('tbody');
   for(const row of block.rows){
    const tr=document.createElement('tr');
    for(const cell of row)tr.append(make('td','',cell));
    tbody.append(tr);
   }
   table.append(tbody);scroller.append(table);section.append(scroller);
  }
  if(block.type==='bars'){
   const max=Math.max(...block.items.map(i=>i.value),1);
   const list=make('div','seyveo-rich-bars');
   for(const item of block.items){
    const row=make('div','seyveo-rich-bar');
    const line=make('div','seyveo-rich-bar-heading');
    line.append(make('span','',item.label),make('strong','',item.value.toLocaleString('ru-RU')+(block.unit?' '+block.unit:'')));
    const track=make('div','seyveo-rich-bar-track');
    const fill=make('span','seyveo-rich-bar-fill');
    fill.style.width=Math.round(item.value/max*1000)/10+'%';
    track.append(fill);row.append(line,track);list.append(row);
   }
   section.append(list);
   if(block.source)section.append(make('p','seyveo-rich-source',block.source));
  }
  if(block.type==='steps'){
   const ol=make('ol','seyveo-rich-steps');
   for(const item of block.items)ol.append(make('li','',item));
   section.append(ol);
  }
  if(block.type==='image'){
   const link=make('a','seyveo-rich-image');
   link.href=block.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';
   const img=document.createElement('img');
   img.src=block.url;img.alt=block.alt;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   link.append(img,make('small','',block.credit));section.append(link);
  }
  if(block.type==='note')section.append(make('p','seyveo-rich-note',block.body));
  outer.append(section);
 }
 return outer;
}
window.SEYVEO_RICH_ANSWER=Object.freeze({render,cleanBlocks});
})();
