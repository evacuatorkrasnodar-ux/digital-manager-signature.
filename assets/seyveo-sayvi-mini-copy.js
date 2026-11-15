/* One Sayvi, two sizes: the dock uses the exact artwork of the Home orb.
   Keep the legacy sphere class only for the cinematic handoff visibility gate;
   the old independent multicolor renderer is no longer loaded. */
(() => {
  'use strict';
  const button=document.getElementById('assistantButton');
  const heroArtwork=document.getElementById('plasmaVisual');
  if(!button||!heroArtwork||button.querySelector('.sv-sayvi-mini-copy'))return;

  const copy=document.createElement('img');
  copy.className='sv-sayvi-mini-copy sv-sayvi-velvet-sphere';
  copy.alt='';
  copy.setAttribute('aria-hidden','true');
  copy.draggable=false;
  copy.decoding='async';

  const syncArtwork=()=>{
    const src=heroArtwork.getAttribute('src');
    if(src&&copy.getAttribute('src')!==src)copy.setAttribute('src',src);
  };
  syncArtwork();
  // The original hero changes its SVG when the user switches themes.
  new MutationObserver(syncArtwork).observe(heroArtwork,{
    attributes:true,attributeFilter:['src']
  });
  button.appendChild(copy);
  // The already-approved cinematic dock spark glints over the same artwork.
  const spark=document.createElement('span');
  spark.className='sv-cinema-dock-spark sv-sayvi-dock-idle-spark';
  spark.setAttribute('aria-hidden','true');
  button.appendChild(spark);
  button.classList.add('sv-sayvi-velvet-ready');
})();
