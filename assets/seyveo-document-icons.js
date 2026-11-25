/* SEYVEO document action glyphs. Shared 24-unit geometry, rounded thin strokes.
   App-source icons and the colored file/folder illustrations stay separate. */
(function(root){
'use strict';
const paths=Object.freeze({
 camera:'<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
 gallery:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-5 5 6"/>',
 scan:'<path d="M8 3.5H6A2.5 2.5 0 0 0 3.5 6v2M16 3.5h2A2.5 2.5 0 0 1 20.5 6v2M20.5 16v2a2.5 2.5 0 0 1-2.5 2.5h-2M8 20.5H6A2.5 2.5 0 0 1 3.5 18v-2"/><rect x="8" y="6.5" width="8" height="11" rx="1.3" opacity=".55"/><path d="M6 12h12"/>',
 file:'<path d="M7 3.5h6.5L18 8v10.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M13.5 3.5V7a1 1 0 0 0 1 1H18" opacity=".7"/><circle cx="15.8" cy="16.8" r="4.2" fill="currentColor" fill-opacity=".10" stroke="none"/><path d="M12.8 16.8h6M15.8 13.8v6"/>',
 create:'<path d="M12 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H18a2 2 0 0 0 2-2v-3.5"/><path d="M8 8h5M8 12h3" opacity=".7"/><path d="m11.5 17 1-4 6-6a1.4 1.4 0 0 1 2 2l-6 6-3 2Z" fill="currentColor" fill-opacity=".08"/><path d="m17 8.5 2 2" opacity=".6"/>',
 sign:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7 9h10M7 12h6" opacity=".7"/><path d="M7 16c2-4 2 2 4 0s2 1 4 0l2-1"/><path d="M7 17.5h10" opacity=".32"/>',
 print:'<path d="M7 9V4h10v5M7 16.5H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2h-2M7 14.5h10V20H7z"/><path d="M9.5 17.3h5" opacity=".55"/><circle cx="17.8" cy="11.8" r=".75" fill="currentColor" opacity=".6" stroke="none"/>',
 original:'<path d="M7 3.5h6.5L19 9v9.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M13.5 3.5V8a1 1 0 0 0 1 1H19M8.5 12h7M8.5 15.5h7" opacity=".72"/>',
 download:'<path d="M12 3.5v11m-4-4 4 4 4-4M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>',
 share:'<path d="M12 15V3.5m-4 4 4-4 4 4M7.5 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5"/>',
 more:'<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
 archive:'<path d="M3.5 9V6a2 2 0 0 1 2-2h4l3 3h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="M3.5 10h17M9 15h6" opacity=".7"/>',
 rename:'<path d="M4.5 8.5V5a2 2 0 0 1 2-2H15M4.5 15.5V19a2 2 0 0 0 2 2H15"/><path d="m10 16 1-4 7-7a1.5 1.5 0 0 1 2 2l-7 7-3 2ZM15.5 7.5l2 2"/>',
 delete:'<path d="M4.5 6.5h15M9 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 4.8v1.7M6.5 6.5l.8 12.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8l.8-12.2M10 10v6.5M14 10v6.5"/>',
 first:'<path d="M4.5 4.5h15M12 20V8.5m-4 4 4-4 4 4"/>',
 last:'<path d="M4.5 19.5h15M12 4v11.5m-4-4 4 4 4-4"/>',
 back:'<path d="m15.5 5-7 7 7 7"/>',
 undo:'<path d="m9 6-5 5 5 5M4 11h9a6 6 0 0 1 6 6v2"/>',
 redo:'<path d="m15 6 5 5-5 5M20 11h-9a6 6 0 0 0-6 6v2"/>',
 copy:'<rect x="8.5" y="8.5" width="11.5" height="12" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5"/>',
 clear:'<path d="m4.5 14.5 9-9a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L11.1 20H8L4.5 16.5a1.5 1.5 0 0 1 0-2Z"/><path d="m9 10 6.5 6.5M11.1 20H21"/>',
 heading:'<path d="m4 19 6-14 6 14M6 15h8M19 6v13"/>',
 check:'<path d="m5 12 4 4 10-10"/>',
 info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8h.01"/>',
 history:'<path d="M3.5 11a8.5 8.5 0 1 1 3 7.5M3.5 5v6h6M12 7.5V12l3 2"/>',
 down:'<path d="m7 10 5 5 5-5"/>',
 'align-left':'<path d="M4 5h16M4 10h10M4 15h16M4 20h10"/>',
 'align-center':'<path d="M4 5h16M7 10h10M4 15h16M7 20h10"/>',
 'align-right':'<path d="M4 5h16M10 10h10M4 15h16M10 20h10"/>',
 'align-both':'<path d="M4 5h16M4 10h16M4 15h16M4 20h16"/>'
});
const aliases=Object.freeze({edit:'create',signature:'sign',image:'gallery',pdf:'original'});
function markup(key){
 const name=Object.prototype.hasOwnProperty.call(aliases,key)?aliases[key]:key;
 if(!Object.prototype.hasOwnProperty.call(paths,name))return '';
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true" data-sv-document-icon="'+name+'">'+paths[name]+'</svg>';
}
root.SEYVEO_DOCUMENT_ICONS=Object.freeze({markup});
})(window);
