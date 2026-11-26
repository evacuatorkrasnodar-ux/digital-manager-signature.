/* SEYVEO navigation glyph standard — 26 Nov 2026.
 * Shared optical scale from the approved Sky chat. Do not alter button
 * surfaces, click handlers, labels, layout, dock or editor toolbars.
 * Only recognized simple navigation/action artwork is normalized. */
(()=>{'use strict';
 if(window.SEYVEO_NAV_GLYPHS)return;
 const spec=Object.freeze({
  back:Object.freeze({d:'M14.5 5.5 8 12l6.5 6.5',size:22,stroke:1.55}),
  plus:Object.freeze({d:'M12 5.5v13M5.5 12h13',size:24,stroke:1.4}),
  search:Object.freeze({d:'M15.7 15.7 L21 21',size:25,stroke:1.65}),
  history:Object.freeze({d:'M3.8 11.4a8.2 8.2 0 1 1 2.4 6M3.8 6.6v4.8h4.8M12 7.3V12l3.2 2',size:24,stroke:1.65})
 });
 const skyBack=Object.freeze({d:'M15.5 5 L7.4 12 L15.5 19',size:29,stroke:1.9});
 function glyphSpec(svg,kind){
  if(kind!=='back')return spec[kind];
  const work=svg.closest('#svcpWorkChatScreen');
  return work?.dataset.view==='room'&&work.querySelector('#svcpConversation[data-chat-wallpaper="sky"]')?skyBack:spec.back;
 }
 const compact=s=>(s||'').replace(/\s+/g,' ').trim();
 const backPaths=new Set([
  'm14.5 5-7 7 7 7','m14 5-7 7 7 7','m15 5-7 7 7 7',
  'M14.5 5.5 8 12l6.5 6.5','m14.5 5.5-7 6.5 7 6.5',
  'm14.5 5.5-6.5 6.5 6.5 6.5','M15.5 5 L7.4 12 L15.5 19',
  'm13.75 6.75-5.25 5.25 5.25 5.25M8.5 12H19'
 ]);
 const plusPaths=new Set([
  'M12 4v16M4 12h16','M12 5v14M5 12h14',
  'M12 5.5v13M5.5 12h13','M12 6v12M6 12h12',
  'M12 5V19M5 12H19','M12 4v16M4 12H20'
 ]);
 const searchPaths=new Set(['m16 16 5 5','m15.7 15.7 5 5','M15.7 15.7 L21 21']);
 const excluded='footer.dock,.sv-note-tool-row,.sv-newdock-button,.sv-editor-capsule,.sv-paper-tools,.svcp-attach-menu,.svcp-bubble,.svdv-reader-body,.sv-nav-redundant';
 const navClasses='.sv-nav-back,.sv-nav-arrow,.sv-header-material-circle,.sv-note-nav-circle,.sv-top-action,.svcp-work-chat-back,.svcp-work-history-top,.svcp-directory-search-toggle,.sv-doc-head-icon,.sv-mail-icon-button,.sv-doc-shelf-add,.sv-cabinet-plus,.calendar-header-add,.personal-tasks-add,.svcp-manager-task-create';
 const headerArea='header,.sv-continuity-titlebar,.sv-deep-top,.sv-note-reader-header,.sv-note-nav-actions,.sv-paper-top,.sv-doc-head-tools,.svdv-reader-head,.svmc-head,.sv-med-header,.history-head,.sv-inbox-sheet-head,.sv-recruit-head,.syp-top';
 function styleSvg(svg,kind){
  const s=glyphSpec(svg,kind);
  svg.setAttribute('data-sv-nav-glyph',kind);
  for(const [k,v] of Object.entries({'width':s.size+'px','height':s.size+'px','stroke-width':String(s.stroke),'stroke-linecap':'round','stroke-linejoin':'round'}))svg.style.setProperty(k,v,'important');
  if(kind==='back')for(const key of ['min-width','max-width','min-height','max-height'])svg.style.setProperty(key,s.size+'px','important');
  for(const child of svg.querySelectorAll('path,circle,line,polyline,rect')){
   child.style.setProperty('stroke-width',String(s.stroke),'important');
   child.style.setProperty('stroke-linecap','round','important');
   child.style.setProperty('stroke-linejoin','round','important');
  }
 }
 function normalize(svg){
  if(svg.getAttribute('viewBox')!=='0 0 24 24')return;
  const button=svg.closest('button,a.sv-top-action');
  if(!button)return;
  // V140: pure plus artwork is safe to normalize even in compact menus and editors.
  // Preserve those controls' own glyph size and hit area.
  const purePlus=svg.children.length===1&&svg.firstElementChild?.tagName.toLowerCase()==='path'&&plusPaths.has(compact(svg.firstElementChild.getAttribute('d')));
  if(purePlus){
   const p=svg.firstElementChild;
   if(p.getAttribute('d')!==spec.plus.d)p.setAttribute('d',spec.plus.d);
   for(const n of [svg,p])for(const [k,v] of Object.entries({'stroke-width':String(spec.plus.stroke),'stroke-linecap':'round','stroke-linejoin':'round'}))n.style.setProperty(k,v,'important');
   if(!button.closest(excluded)&&!button.textContent.trim()){styleSvg(svg,'plus');}
   return;
  }
  if(button.closest(excluded))return;
  const named=button.matches(navClasses)||button.closest(headerArea)||
   /(?:back|close|plus|add|search|history|attachfile|attachbutton|new)$/i.test(button.id)||
   /(?:^|[\s-])(?:back|plus|add|search|history)(?:[\s-]|$)/i.test(button.className||'');
  if(!named)return;
  if(button.textContent.trim()&&!button.matches(navClasses)&&!button.closest(headerArea))return;
  const paths=svg.querySelectorAll(':scope > path');
  const circles=svg.querySelectorAll(':scope > circle');
  if(paths.length!==1)return;
  const path=paths[0],d=compact(path.getAttribute('d'));
  let kind=null;
  if(svg.children.length===1&&backPaths.has(d))kind='back';
  else if(svg.children.length===1&&plusPaths.has(d))kind='plus';
  else if(svg.children.length===2&&circles.length===1&&searchPaths.has(d))kind='search';
  else if(svg.children.length===1&&d===spec.history.d)kind='history';
  if(!kind)return;
  if(kind==='search'){
   circles[0].setAttribute('cx','10.8');circles[0].setAttribute('cy','10.8');circles[0].setAttribute('r','6.6');
  }
  const shape=glyphSpec(svg,kind);
  if(path.getAttribute('d')!==shape.d)path.setAttribute('d',shape.d);
  styleSvg(svg,kind);
 }
 function scan(root){
  if(root.nodeType===1&&root.matches('svg'))normalize(root);
  root.querySelectorAll?.('button > svg,button > span > svg,a.sv-top-action > svg').forEach(normalize);
 }
 function svg(kind){
  const s=spec[kind];if(!s)return '';
  const circle=kind==='search'?'<circle cx="10.8" cy="10.8" r="6.6"/>':'';
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-sv-nav-glyph="'+kind+'" style="width:'+s.size+'px!important;height:'+s.size+'px!important;stroke-width:'+s.stroke+'!important;stroke-linecap:round!important;stroke-linejoin:round!important">'+circle+'<path d="'+s.d+'"/></svg>';
 }
 window.SEYVEO_NAV_GLYPHS=Object.freeze({spec,svg});
 scan(document);
 const observer=new MutationObserver(records=>{
  const roots=new Set();
  for(const record of records){
   if(record.type==='attributes'){
    roots.add(record.target.closest('#svcpWorkChatScreen')||record.target);
    continue;
   }
   for(const n of record.addedNodes){
    if(n.nodeType!==1)continue;
    const parentSvg=n.closest('svg');
    if(parentSvg)roots.add(parentSvg);
    else roots.add(n);
   }
  }
  roots.forEach(scan);
 });
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-chat-wallpaper','data-view']});
})();
