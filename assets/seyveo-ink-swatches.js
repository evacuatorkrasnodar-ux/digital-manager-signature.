/* SEYVEO Ink Studio · whole-swatch horizontal carousel.
   Keep the native touch scroller and all existing color button handlers.
   Fit an integer number of swatches so no half-circle is shown at rest. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const palette=dialog?.querySelector('.sv-paper-palette');
 const strip=palette?.querySelector('.sv-paper-swatches');
 const trigger=palette?.querySelector('.paper-color-control');
 if(!dialog||!palette||!strip||!trigger)return;

 let frame=0,cellStep=33;
 function fit(){
  frame=0;
  if(!dialog.open)return;
  const paletteRect=palette.getBoundingClientRect();
  const triggerWidth=trigger.getBoundingClientRect().width;
  const paletteStyle=getComputedStyle(palette);
  const gap=Number.parseFloat(paletteStyle.columnGap||paletteStyle.gap)||0;
  const available=Math.max(0,paletteRect.width-triggerWidth-gap);
  const first=strip.querySelector('button');
  if(!first||available<30)return;
  const stripStyle=getComputedStyle(strip);
  const itemWidth=first.getBoundingClientRect().width;
  const itemGap=Number.parseFloat(stripStyle.columnGap||stripStyle.gap)||0;
  const padStart=Number.parseFloat(stripStyle.paddingLeft)||0;
  const padEnd=Number.parseFloat(stripStyle.paddingRight)||0;
  if(!itemWidth)return;
  cellStep=itemWidth+itemGap;
  const count=strip.querySelectorAll(':scope > button').length;
  const slots=Math.max(1,Math.min(count,
   Math.floor((available-padStart-padEnd+itemGap)/cellStep)));
  const exactWidth=Math.ceil(slots*itemWidth+(slots-1)*itemGap+padStart+padEnd);
  strip.style.setProperty('--sv-ink-swatches-width',exactWidth+'px');
  // When device orientation changes, keep the scroll aligned to whole chips.
  if(!strip.matches(':active')&&strip.scrollWidth>strip.clientWidth){
   const wanted=Math.min(strip.scrollWidth-strip.clientWidth,
    Math.max(0,Math.round(strip.scrollLeft/cellStep)*cellStep));
   if(Math.abs(wanted-strip.scrollLeft)>2)strip.scrollLeft=wanted;
  }
 }
 function schedule(){
  if(!frame)frame=requestAnimationFrame(fit);
 }
 if(typeof ResizeObserver==='function'){
  const ro=new ResizeObserver(schedule);
  ro.observe(palette);
  ro.observe(trigger);
 }else window.addEventListener('resize',schedule,{passive:true});
 const mo=new MutationObserver(schedule);
 mo.observe(dialog,{attributes:true,attributeFilter:['open']});
 window.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 schedule();
})();
