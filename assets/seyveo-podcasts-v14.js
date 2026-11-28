/* SEYVEO Podcasts — public RSS, local subscriptions and playback positions. */
(()=>{
'use strict';
const init=()=>{
const panel=document.getElementById('svMusicPodcasts');if(!panel)return;
const get=id=>document.getElementById(id),audio=get('svPodcastAudio'),form=get('svPodcastForm'),input=get('svPodcastUrl'),list=get('svPodcastFeeds'),episodes=get('svPodcastEpisodes'),status=get('svPodcastStatus'),player=get('svPodcastPlayer'),file=get('svPodcastXml');
const KEY='seyveo-podcasts-v1';
// Dedicated viewport layer; independent of the music page's grid and dock.
const overlay=document.createElement('section');overlay.id='svPodcastViewport';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Плеер подкаста');
const notice=document.createElement('p');notice.id='svPodcastViewportNotice';notice.hidden=true;notice.setAttribute('role','status');
const polish=document.createElement('style');polish.id='svPodcastPlayerPolishV26';polish.textContent=`
html body #svPodcastViewport[hidden],html body #svPodcastViewport [hidden]{display:none!important}
html body #svPodcastViewport:not([hidden]){display:block!important;position:fixed!important;inset:0!important;z-index:2147483000!important;overflow:hidden!important;background:#151515!important;color:#fff!important;isolation:isolate;--text:#fff;--secondary:#ffffffa8;--soft-line:#ffffff38}
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){position:relative!important;display:flex!important;flex-direction:column!important;justify-content:flex-end!important;align-items:stretch!important;gap:14px!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;margin:0!important;padding:0 24px calc(22px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;overflow-y:auto!important;border:0!important;border-radius:0!important;background:#151515!important;box-shadow:none!important;color:#fff!important}
html body #svPodcastViewport #svPodcastFullCover{display:block!important;position:relative!important;flex:1 1 0!important;min-height:160px!important;max-height:none!important;width:calc(100% + 48px)!important;margin:0 -24px!important;overflow:hidden!important;isolation:isolate;background:#25262c}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art{display:grid!important;place-items:center!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:0!important;overflow:hidden!important;background:radial-gradient(ellipse at 45% 20%,#465267,#272d39 48%,#151515 100%)!important;color:#ffffffb0}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 42%!important;display:block!important}
html body #svPodcastViewport #svPodcastFullCover::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#0004 0%,transparent 15%,transparent 52%,#151515 100%);pointer-events:none}
#svPodcastViewport #svPodcastFullCover .sv-podcast-art>svg{width:70px;height:70px}
#svPodcastViewport .sv-podcast-cover-label{position:absolute;top:15%;left:8%;right:8%;font-size:clamp(23px,7vw,40px);font-weight:650;line-height:1.15;text-align:center;overflow-wrap:anywhere;color:#f5f5f7}
html body #svPodcastViewport #svPodcastCollapse{display:grid!important;place-items:center!important;position:absolute!important;z-index:3;top:env(safe-area-inset-top,0px);left:50%;transform:translateX(-50%)!important;width:64px!important;height:44px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
#svPodcastViewport #svPodcastCollapse span{width:36px;height:4px;border-radius:9px;background:#ffffffa8;box-shadow:none}
#svPodcastViewport #svPodcastNowArt{display:none!important}
#svPodcastViewport .sv-podcast-now-identity,#svPodcastViewport .sv-podcast-timeline,#svPodcastViewport .sv-podcast-transport{width:100%;max-width:480px;margin:0 auto!important;flex:0 0 auto;box-sizing:border-box}
#svPodcastViewport .sv-podcast-now-copy{display:grid;gap:5px;min-width:0}
#svPodcastViewport #svPodcastPlaying{font-size:clamp(19px,5vw,25px);font-weight:650;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#fff}
#svPodcastViewport #svPodcastPlayingFeed{font-size:14px;color:#ffffffa8}
#svPodcastViewport .sv-podcast-timeline{display:grid;gap:4px}
#svPodcastViewport .sv-podcast-times{display:flex;justify-content:space-between;font-size:12px;color:#ffffffa8;font-variant-numeric:tabular-nums}
html body #svPodcastViewport #svPodcastSeek{appearance:none;-webkit-appearance:none;width:100%!important;height:24px!important;min-height:0!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;accent-color:#fff}
#svPodcastViewport #svPodcastSeek::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:linear-gradient(to right,#fff var(--sv-podcast-progress,0%),#ffffff40 var(--sv-podcast-progress,0%))}
#svPodcastViewport #svPodcastSeek::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;margin-top:-4px}
#svPodcastViewport #svPodcastSeek::-moz-range-track{height:4px;background:#ffffff40;border-radius:99px}
#svPodcastViewport #svPodcastSeek::-moz-range-progress{height:4px;background:#fff}
#svPodcastViewport #svPodcastSeek::-moz-range-thumb{width:12px;height:12px;background:#fff;border:0;border-radius:50%}
html body #svPodcastViewport .sv-podcast-transport{display:grid!important;grid-template-columns:repeat(5,minmax(44px,1fr));align-items:center;justify-items:center;gap:0!important;padding:4px 0 8px!important}
html body #svPodcastViewport .sv-podcast-transport button,html body #svPodcastViewport .sv-podcast-transport .sv-podcast-quick{display:grid!important;place-items:center!important;position:relative!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;padding:0!important;margin:0!important;color:#fff!important;background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important;transform:none!important;font:inherit}
#svPodcastViewport .sv-podcast-transport button::before,#svPodcastViewport .sv-podcast-transport button::after{content:none!important}
#svPodcastViewport .sv-podcast-transport button svg{width:30px;height:30px}
#svPodcastViewport #svPodcastToggle svg{width:44px;height:44px}
#svPodcastViewport .sv-podcast-quick>span{font-size:14px;font-weight:600;pointer-events:none}
#svPodcastViewport .sv-podcast-quick>svg{width:24px;height:24px;pointer-events:none}
html body #svPodcastViewport .sv-podcast-quick select{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;cursor:pointer}
#svPodcastViewport .sv-podcast-quick:focus-within{outline:2px solid #fff9;border-radius:12px}
#svPodcastViewport .sv-podcast-quick.is-active{color:#8fbbff!important}
#svPodcastViewport .sv-podcast-player-tools{display:none!important}
#svPodcastViewportNotice{flex:0 0 auto;color:#ffffffa8;text-align:center;font-size:12px;margin:0}
@media(min-width:650px){html body #svPodcastViewport #svPodcastFullCover{width:min(calc(100% + 48px),680px)!important;margin:0 auto!important}}
@media(max-height:600px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:7px!important;padding-bottom:12px!important}html body #svPodcastViewport #svPodcastFullCover{min-height:120px!important}}

#svPodcastViewport #svPodcastFullCover .sv-podcast-art.is-low-res img{width:min(100%,var(--sv-art-side,150px))!important;height:auto!important;max-height:70%;object-fit:contain!important;object-position:center!important;border-radius:12px}
#svPodcastViewport #svPodcastFullCover .sv-podcast-art:not(.is-low-res) img{object-fit:contain!important;object-position:center top!important}
#svPodcastViewport #svPodcastFullCover::after{background:linear-gradient(180deg,#0003 0%,transparent 17%,transparent 55%,#151515 100%)}
#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{display:flex;align-items:center;gap:12px;width:100%;max-width:480px;margin:0 auto;flex:0 0 auto;color:#a6a6aa}
#svPodcastViewport .sv-podcast-volume svg{width:17px;height:17px;flex-shrink:0}
html body #svPodcastViewport .sv-podcast-volume input,html body #svPodcastViewport .sv-podcast-speed-pop input{appearance:none;-webkit-appearance:none;min-width:0;width:100%;height:28px;min-height:0!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;accent-color:#b9b9bd}
#svPodcastViewport .sv-podcast-volume input::-webkit-slider-runnable-track,#svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-runnable-track{height:4px;background:linear-gradient(to right,#b9b9bd var(--sv-value,50%),#ffffff30 var(--sv-value,50%));border-radius:8px}
#svPodcastViewport .sv-podcast-volume input::-webkit-slider-thumb,#svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;background:#ddd}
#svPodcastViewport .sv-podcast-bottom-tools{justify-content:space-evenly}
html body #svPodcastViewport .sv-podcast-bottom-tools button,html body #svPodcastViewport .sv-podcast-speed-pop button,html body #svPodcastViewport .sv-podcast-queue-pop button{border:0!important;background:transparent!important;box-shadow:none!important;transform:none!important;color:inherit!important;min-height:44px!important;padding:0 8px!important;font:inherit}
#svPodcastViewport .sv-podcast-bottom-tools button{display:grid;place-items:center;min-width:44px}
#svPodcastViewport .sv-podcast-bottom-tools svg{width:24px;height:24px}
#svPodcastViewport .sv-podcast-bottom-tools button[aria-pressed=true]{color:#ff696d!important}
#svPodcastViewport .sv-podcast-speed-pop,#svPodcastViewport .sv-podcast-queue-pop{position:absolute;z-index:5;bottom:calc(145px + env(safe-area-inset-bottom,0px));left:24px;right:24px;max-width:380px;margin:0 auto;padding:16px;border:1px solid #ffffff25;border-radius:22px;background:#232326f5;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);color:#fff;box-sizing:border-box}
#svPodcastViewport .sv-podcast-speed-pop{right:auto;width:min(280px,calc(100% - 48px));display:grid;gap:8px}
#svPodcastViewport .sv-podcast-speed-pop small{color:#aaa;text-align:center}
#svPodcastViewport .sv-podcast-queue-pop{max-height:50%;overflow:auto}
#svPodcastViewport .sv-podcast-queue-pop strong{display:block;margin:0 0 8px}
#svPodcastViewport .sv-podcast-queue-pop button{display:block;width:100%;text-align:left;border-bottom:1px solid #ffffff15!important;font-size:14px;line-height:1.35}
#svPodcastViewport .sv-podcast-queue-pop button[aria-current=true]{color:#91bfff!important}
@media(max-height:650px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:7px!important}#svPodcastViewport .sv-podcast-speed-pop,#svPodcastViewport .sv-podcast-queue-pop{bottom:110px}}

/* Fade the actual artwork, not its taller empty container. */
html body #svPodcastViewport #svPodcastFullCover{background:#151515!important;margin-bottom:-8px!important}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art{background:#151515!important;align-items:start!important}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art:not(.is-low-res) img{width:100%!important;height:auto!important;max-height:100%!important;object-fit:contain!important;object-position:center top!important;align-self:start;-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 46%,rgba(0,0,0,.92) 63%,rgba(0,0,0,.55) 81%,transparent 100%);mask-image:linear-gradient(to bottom,#000 0%,#000 46%,rgba(0,0,0,.92) 63%,rgba(0,0,0,.55) 81%,transparent 100%)}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art.is-low-res{align-items:center!important;background:radial-gradient(ellipse at 50% 24%,#343842,#151515 77%)!important}
#svPodcastViewport #svPodcastFullCover .sv-podcast-art:not(:has(img)){align-items:center!important;background:radial-gradient(ellipse at 50% 24%,#343842,#151515 77%)!important}
#svPodcastViewport #svPodcastFullCover::after{background:linear-gradient(to bottom,#0005 0%,transparent 15%);pointer-events:none}
#svPodcastViewport #svPodcastCollapse span{background:#ffffffb8;box-shadow:0 1px 5px #0005}
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:12px!important;padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))!important}
#svPodcastViewport #svPodcastPlaying{font-weight:600;font-size:clamp(18px,4.7vw,23px)}
#svPodcastViewport .sv-podcast-now-copy{gap:4px}
#svPodcastViewport .sv-podcast-volume{margin-top:8px}
#svPodcastViewport .sv-podcast-bottom-tools{margin-top:2px}
html body #svPodcastViewport .sv-podcast-speed-pop{bottom:var(--sv-speed-pop-bottom,155px);left:var(--sv-speed-pop-left,24px);width:min(270px,calc(100% - 48px));padding:14px 16px 12px;background:#202023ed;border-color:#ffffff30;box-shadow:0 12px 30px #0003}
#svPodcastViewport .sv-podcast-speed-pop::after{content:'';position:absolute;bottom:-6px;left:var(--sv-speed-arrow,23px);width:10px;height:10px;transform:rotate(45deg);background:#202023;border-right:1px solid #ffffff30;border-bottom:1px solid #ffffff30}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-runnable-track{height:26px;border-radius:0;background:repeating-linear-gradient(90deg,transparent 0px,transparent 6px,#ffffff40 6px,#ffffff40 8px,transparent 8px,transparent 10px)}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-thumb{height:26px;width:3px;border-radius:3px;margin-top:0;background:#f5f5f7}
html body #svPodcastViewport .sv-podcast-speed-pop input::-moz-range-track{height:26px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 6px,#ffffff40 6px,#ffffff40 8px,transparent 8px,transparent 10px)}
html body #svPodcastViewport .sv-podcast-speed-pop input::-moz-range-thumb{height:26px;width:3px;border:0;border-radius:3px;background:#f5f5f7}
@media(max-height:650px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:7px!important;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))!important}#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{margin-top:0}}

/* Editorial full-screen artwork: preserve the square original; extend only its soft colour field. */
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art.has-cover{display:block!important;background:#151515!important}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art.has-cover .sv-podcast-art-ambient{position:absolute!important;inset:10% -12% -12%!important;width:124%!important;height:102%!important;max-height:none!important;object-fit:cover!important;object-position:center!important;filter:blur(32px);opacity:.28;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 38%,#000 53%,transparent 94%);mask-image:linear-gradient(to bottom,transparent 0%,#000 38%,#000 53%,transparent 94%)}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art.has-cover .sv-podcast-art-main{position:relative!important;z-index:1;display:block!important;width:100%!important;height:auto!important;max-height:100%!important;object-fit:contain!important;object-position:center top!important;-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 61%,rgba(0,0,0,.95) 73%,rgba(0,0,0,.55) 88%,transparent 100%);mask-image:linear-gradient(to bottom,#000 0%,#000 61%,rgba(0,0,0,.95) 73%,rgba(0,0,0,.55) 88%,transparent 100%)}
html body #svPodcastViewport #svPodcastFullCover::after{z-index:2;background:linear-gradient(to bottom,#0003 0%,transparent 13%,transparent 65%,#151515 100%)}
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:15px!important;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))!important}
#svPodcastViewport .sv-podcast-now-identity{padding-bottom:1px}
#svPodcastViewport .sv-podcast-transport{padding-top:7px!important;padding-bottom:10px!important}
#svPodcastViewport .sv-podcast-volume{margin-top:12px}
#svPodcastViewport .sv-podcast-bottom-tools{margin-top:4px}
#svPodcastViewport .sv-podcast-bottom-tools button{opacity:.86}
#svPodcastViewport .sv-podcast-bottom-tools button[aria-pressed=true]{opacity:1}
@media(max-height:700px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:8px!important;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{margin-top:0}#svPodcastViewport .sv-podcast-transport{padding-top:0!important;padding-bottom:4px!important}}
@media(prefers-reduced-motion:reduce){#svPodcastViewport .sv-podcast-art-ambient{filter:blur(24px)}}

/* Playback controls only. Artwork pipeline deliberately unchanged. */
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){padding-left:24px!important;padding-right:24px!important;gap:12px!important;padding-bottom:calc(22px + env(safe-area-inset-bottom,0px))!important}
#svPodcastViewport .sv-podcast-now-identity,#svPodcastViewport .sv-podcast-timeline,#svPodcastViewport .sv-podcast-transport,#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{max-width:440px}
#svPodcastViewport .sv-podcast-now-copy{gap:4px}
#svPodcastViewport #svPodcastPlaying{font-size:clamp(18px,4.5vw,23px);font-weight:600;letter-spacing:-.025em}
#svPodcastViewport #svPodcastPlayingFeed{font-size:13px;letter-spacing:-.01em;color:#ffffff99}
#svPodcastViewport .sv-podcast-times{font-size:11px;color:#ffffff80}
html body #svPodcastViewport .sv-podcast-transport{grid-template-columns:repeat(5,minmax(44px,1fr));padding:5px 0 7px!important}
html body #svPodcastViewport .sv-podcast-transport button{width:44px!important;height:44px!important;min-height:44px!important}
#svPodcastViewport .sv-podcast-transport button svg{width:27px;height:27px}
#svPodcastViewport .sv-podcast-transport #svPodcastToggle svg{width:42px;height:42px}
#svPodcastViewport .sv-podcast-quick>span{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.03em}
#svPodcastViewport .sv-podcast-quick[aria-expanded=true]{color:#a8c9ff!important}
#svPodcastViewport .sv-podcast-quick.is-active{color:#a8c9ff!important}
#svPodcastViewport #svPodcastSeek::-webkit-slider-thumb,#svPodcastViewport .sv-podcast-volume input::-webkit-slider-thumb{width:9px;height:9px;margin-top:-2.5px}
#svPodcastViewport #svPodcastSeek::-moz-range-thumb,#svPodcastViewport .sv-podcast-volume input::-moz-range-thumb{width:9px;height:9px;border:0;background:#ddd;border-radius:50%}
#svPodcastViewport .sv-podcast-volume input::-moz-range-track{height:4px;background:#ffffff30;border-radius:8px}
#svPodcastViewport .sv-podcast-volume input::-moz-range-progress{height:4px;background:#b9b9bd;border-radius:8px}
#svPodcastViewport .sv-podcast-volume{margin-top:7px;gap:10px}
#svPodcastViewport .sv-podcast-bottom-tools{margin-top:2px;justify-content:space-around}
#svPodcastViewport .sv-podcast-bottom-tools svg{width:22px;height:22px}
#svPodcastViewport button:focus-visible,#svPodcastViewport input:focus-visible{outline:2px solid #a8c9ff;outline-offset:3px;border-radius:10px}
#svPodcastViewport .sv-podcast-speed-pop,#svPodcastViewport .sv-podcast-queue-pop,#svPodcastViewport .sv-podcast-sleep-pop{background:rgba(34,34,36,.88);border:1px solid #ffffff25;box-shadow:0 12px 32px #0004;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
#svPodcastViewport .sv-podcast-sleep-pop{position:absolute;z-index:5;right:var(--sv-sleep-right,24px);bottom:var(--sv-sleep-bottom,145px);width:min(230px,calc(100% - 48px));padding:8px 13px;border-radius:20px;box-sizing:border-box;color:#fff}
#svPodcastViewport .sv-podcast-sleep-pop::after{content:'';position:absolute;bottom:-6px;right:var(--sv-sleep-arrow,20px);width:10px;height:10px;transform:rotate(45deg);background:#222224;border-right:1px solid #ffffff25;border-bottom:1px solid #ffffff25}
#svPodcastViewport .sv-podcast-sleep-pop strong{display:block;font-size:12px;font-weight:500;color:#ffffff80;padding:7px 8px 4px}
html body #svPodcastViewport .sv-podcast-sleep-pop button{display:flex!important;align-items:center;justify-content:space-between;width:100%;height:44px;min-height:44px!important;padding:0 8px!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;transform:none!important;color:#fff!important;font-size:14px;font-weight:400;text-align:left}
#svPodcastViewport .sv-podcast-sleep-pop button+button{border-top:1px solid #ffffff12!important}
#svPodcastViewport .sv-podcast-sleep-pop button svg{width:16px;height:16px;color:#a8c9ff}
@media(max-height:700px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:8px!important;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{margin-top:0}}
@media(max-width:350px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){padding-left:18px!important;padding-right:18px!important}}
@media(prefers-reduced-transparency:reduce){#svPodcastViewport .sv-podcast-speed-pop,#svPodcastViewport .sv-podcast-queue-pop,#svPodcastViewport .sv-podcast-sleep-pop{background:#242426!important}}

/* Refined playback hierarchy: a generous transport row, quiet sliders and a stable bottom toolbar. */
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:14px!important;padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))!important}
#svPodcastViewport .sv-podcast-now-identity{display:flex;align-items:center;gap:12px;padding-bottom:0}
#svPodcastViewport .sv-podcast-now-copy{flex:1;min-width:0}
#svPodcastViewport #svPodcastPlaying{font-size:clamp(18px,4.7vw,23px);line-height:1.22;letter-spacing:-.02em}
#svPodcastViewport #svPodcastPlayingFeed{font-size:13px;line-height:1.3}
html body #svPodcastViewport .sv-podcast-transport{padding:9px 0 15px!important;align-items:center}
#svPodcastViewport .sv-podcast-transport #svPodcastRewind svg,#svPodcastViewport .sv-podcast-transport #svPodcastForward svg{width:32px;height:32px}
#svPodcastViewport .sv-podcast-transport #svPodcastToggle svg{width:44px;height:44px}
#svPodcastViewport .sv-podcast-transport .sv-podcast-quick svg{width:22px;height:22px}
#svPodcastViewport .sv-podcast-quick>span{font-size:16px;font-weight:550}
#svPodcastViewport .sv-podcast-volume{margin-top:11px;gap:12px}
#svPodcastViewport .sv-podcast-bottom-tools{margin-top:6px;justify-content:space-evenly}
#svPodcastViewport .sv-podcast-bottom-tools svg{width:23px;height:23px}
#svPodcastViewport #svPodcastSeek::-webkit-slider-runnable-track,#svPodcastViewport .sv-podcast-volume input::-webkit-slider-runnable-track{height:5px;border-radius:8px}
#svPodcastViewport #svPodcastSeek::-webkit-slider-thumb,#svPodcastViewport .sv-podcast-volume input::-webkit-slider-thumb{width:5px;height:5px;margin-top:0;border-radius:50%;background:#c9c9cc;transition:opacity .15s;opacity:0}
#svPodcastViewport #svPodcastSeek:active::-webkit-slider-thumb,#svPodcastViewport #svPodcastSeek:focus-visible::-webkit-slider-thumb,#svPodcastViewport .sv-podcast-volume input:active::-webkit-slider-thumb,#svPodcastViewport .sv-podcast-volume input:focus-visible::-webkit-slider-thumb{opacity:1}
#svPodcastViewport #svPodcastSeek::-moz-range-thumb,#svPodcastViewport .sv-podcast-volume input::-moz-range-thumb{width:5px;height:5px;opacity:0}
#svPodcastViewport #svPodcastSeek:active::-moz-range-thumb,#svPodcastViewport #svPodcastSeek:focus-visible::-moz-range-thumb,#svPodcastViewport .sv-podcast-volume input:active::-moz-range-thumb,#svPodcastViewport .sv-podcast-volume input:focus-visible::-moz-range-thumb{opacity:1}
html body #svPodcastViewport #svPodcastMore{display:grid!important;place-items:center;flex:0 0 44px;width:44px;height:44px;min-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%;background:transparent!important;box-shadow:none!important;transform:none!important;color:#fff!important}
#svPodcastViewport #svPodcastMore svg{width:28px;height:28px}
#svPodcastViewport .sv-podcast-more-pop{position:absolute;z-index:5;right:var(--sv-more-right,24px);bottom:var(--sv-more-bottom,220px);width:min(250px,calc(100% - 48px));padding:6px 12px;border:1px solid #ffffff25;border-radius:20px;background:#222224ed;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 12px 32px #0004;color:#fff}
html body #svPodcastViewport .sv-podcast-more-pop button{display:flex!important;align-items:center;gap:10px;width:100%;min-height:44px!important;padding:0 6px!important;margin:0!important;color:#fff!important;background:transparent!important;box-shadow:none!important;transform:none!important;border:0!important;border-radius:0!important;font:inherit;font-size:14px;text-align:left}
#svPodcastViewport .sv-podcast-more-pop button+button{border-top:1px solid #ffffff15!important}
#svPodcastViewport .sv-podcast-more-pop svg{width:19px;height:19px;flex-shrink:0}
@media(max-height:700px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:8px!important;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))!important}html body #svPodcastViewport .sv-podcast-transport{padding:2px 0 6px!important}#svPodcastViewport .sv-podcast-volume,#svPodcastViewport .sv-podcast-bottom-tools{margin-top:0}}

/* Compact smoked-glass speed control, anchored to its own button. */
html body #svPodcastViewport .sv-podcast-speed-pop{width:min(252px,calc(100% - 32px));padding:12px 15px 13px;gap:9px;border-radius:22px;border:1px solid #ffffff24;background:rgba(28,28,30,.79);-webkit-backdrop-filter:blur(24px) saturate(115%);backdrop-filter:blur(24px) saturate(115%);box-shadow:none}
#svPodcastViewport .sv-podcast-speed-pop::after{background:#1c1c1e;border-color:#ffffff24}
#svPodcastViewport .sv-podcast-speed-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:34px;border-bottom:1px solid #ffffff15;padding-bottom:4px}
#svPodcastViewport .sv-podcast-speed-head>strong{font-size:15px;font-weight:550;letter-spacing:-.02em}
html body #svPodcastViewport .sv-podcast-speed-head button{font-size:12px!important;font-weight:500;min-height:34px!important;padding:0 3px!important;color:#ffffffa8!important}
#svPodcastViewport .sv-podcast-speed-scale{display:flex;align-items:center;gap:8px;min-height:36px}
#svPodcastViewport .sv-podcast-speed-scale svg{width:20px;height:20px;flex:0 0 20px;color:#ffffff75}
html body #svPodcastViewport .sv-podcast-speed-scale input{flex:1;min-width:0;width:100%;height:34px}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-runnable-track{height:22px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 4px,#ffffff40 4px,#ffffff40 5.5px,transparent 5.5px,transparent 7px)}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-thumb{height:26px;width:2px;margin-top:-2px;border-radius:2px}
html body #svPodcastViewport .sv-podcast-speed-pop input::-moz-range-track{height:22px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 4px,#ffffff40 4px,#ffffff40 5.5px,transparent 5.5px,transparent 7px)}
html body #svPodcastViewport .sv-podcast-speed-pop input::-moz-range-thumb{height:26px;width:2px}
#svPodcastViewport .sv-podcast-speed-pop small{font-size:11px;color:#ffffff80;line-height:1.35}
#svPodcastViewport .sv-podcast-quick[aria-expanded=true]{color:#fff!important}
#svPodcastViewport .sv-podcast-quick[aria-expanded=true]::after{content:''!important;display:block!important;position:absolute;bottom:2px;left:calc(50% - 1.5px);height:3px;width:3px;background:#fff;border-radius:50%;pointer-events:none}
@media(prefers-reduced-transparency:reduce){html body #svPodcastViewport .sv-podcast-speed-pop{background:#242426!important}}

/* One useful top action rather than two copies of the playback speed. */
html body #svPodcastViewport .sv-podcast-speed-pop{padding:9px 14px 12px;gap:8px;background:rgba(24,24,26,.76);border-color:#ffffff20}
#svPodcastViewport .sv-podcast-speed-pop::after{background:#18181a;border-color:#ffffff20}
#svPodcastViewport .sv-podcast-speed-head{display:block;min-height:44px;padding-bottom:2px}
html body #svPodcastViewport .sv-podcast-speed-head .sv-podcast-pitch{display:flex!important;align-items:center;gap:8px;width:100%;height:44px;min-height:44px!important;padding:0!important;color:#f5f5f7!important;font-size:13px!important;font-weight:400!important;white-space:nowrap;letter-spacing:-.02em;text-align:left}
#svPodcastViewport .sv-podcast-pitch svg{width:17px;height:17px;flex-shrink:0}
#svPodcastViewport .sv-podcast-pitch .sv-podcast-pitch-check{visibility:hidden}
#svPodcastViewport .sv-podcast-pitch[aria-pressed=true] .sv-podcast-pitch-check{visibility:visible}
#svPodcastViewport .sv-podcast-speed-scale{min-height:37px;gap:7px}
#svPodcastViewport .sv-podcast-speed-pop small{font-weight:400;font-size:11px}
html body #svPodcastViewport .sv-podcast-speed-pop .sv-podcast-reset{font-size:11px!important;min-height:30px!important;padding:0 6px!important;color:#ffffff90!important}

/* Final playback detail pass: no changes to cover artwork. */
html body #svPodcastViewport .sv-podcast-speed-pop{width:min(248px,calc(100% - 32px));padding:8px 15px 11px;gap:7px;border-radius:26px;border-color:#ffffff20;background:rgba(24,24,26,.76)}
#svPodcastViewport .sv-podcast-speed-head{padding-bottom:1px}
html body #svPodcastViewport .sv-podcast-speed-head .sv-podcast-pitch{font-family:inherit;font-weight:400!important;font-size:13px!important;letter-spacing:0;gap:7px}
#svPodcastViewport .sv-podcast-pitch svg{width:15px;height:15px}
#svPodcastViewport .sv-podcast-speed-scale{gap:7px;min-height:34px}
#svPodcastViewport .sv-podcast-speed-scale svg{width:19px;height:19px}
#svPodcastViewport .sv-podcast-speed-pop small{font-size:11px;font-weight:400;letter-spacing:0}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-runnable-track{height:20px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 3.5px,#ffffff40 3.5px,#ffffff40 5px,transparent 5px,transparent 7px)}
html body #svPodcastViewport .sv-podcast-speed-pop input::-webkit-slider-thumb{height:25px;margin-top:-2.5px}
html body #svPodcastViewport .sv-podcast-speed-pop input::-moz-range-track{height:20px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 3.5px,#ffffff40 3.5px,#ffffff40 5px,transparent 5px,transparent 7px)}
#svPodcastViewport .sv-podcast-quick>span{font-size:15px;font-weight:500;letter-spacing:-.02em}
#svPodcastViewport .sv-podcast-transport #svPodcastRewind svg,#svPodcastViewport .sv-podcast-transport #svPodcastForward svg{width:30px;height:30px}
#svPodcastViewport .sv-podcast-transport #svPodcastToggle svg{width:44px;height:44px}
#svPodcastViewport .sv-podcast-volume svg{width:16px;height:16px}
#svPodcastViewport .sv-podcast-bottom-tools svg{width:22px;height:22px}
@media(prefers-reduced-transparency:reduce){html body #svPodcastViewport .sv-podcast-speed-pop{background:#242426!important}}

/* Interaction polish; keep the approved playback composition and artwork. */
html body #svPodcastViewport #svPodcastCollapse{touch-action:none;cursor:grab}
#svPodcastViewport .sv-podcast-speed-pop{transform-origin:20% 100%}
#svPodcastViewport .sv-podcast-speed-pop:not([hidden]),#svPodcastViewport .sv-podcast-sleep-pop:not([hidden]),#svPodcastViewport .sv-podcast-more-pop:not([hidden]){animation:svPodcastMenuIn .14s ease-out}
@keyframes svPodcastMenuIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){#svPodcastViewport .sv-podcast-speed-pop,#svPodcastViewport .sv-podcast-sleep-pop,#svPodcastViewport .sv-podcast-more-pop{animation:none!important}}
#svPodcastViewport .sv-podcast-speed-scale svg{width:24px;height:20px;flex:0 0 24px;color:#ffffff70;display:block}
`;document.head.appendChild(polish);
overlay.append(player);player.append(notice);document.body.append(overlay);
const speedSelect=get('svPodcastSpeed'),sleepSelect=get('svPodcastSleep'),transport=player.querySelector('.sv-podcast-transport');
const speedQuick=document.createElement('button'),sleepQuick=document.createElement('button');sleepQuick.type='button';sleepQuick.setAttribute('aria-label','Таймер сна');sleepQuick.setAttribute('aria-expanded','false');speedQuick.type='button';speedQuick.setAttribute('aria-label','Скорость воспроизведения');speedQuick.setAttribute('aria-expanded','false');speedQuick.className=sleepQuick.className='sv-podcast-quick';
const speedText=document.createElement('span');speedText.textContent='1×';speedSelect.setAttribute('aria-label','Скорость воспроизведения');speedQuick.append(speedText);
sleepQuick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/><path d="M15 3h4l-4 4h4"/></svg>';sleepSelect.setAttribute('aria-label','Таймер сна');transport.prepend(speedQuick);transport.append(sleepQuick);
function updateQuick(){speedText.textContent=String(speedSelect.value||'1').replace('.',',')+'×';sleepQuick.classList.toggle('is-active',Number(sleepSelect.value)>0)}
speedSelect.addEventListener('change',updateQuick);sleepSelect.addEventListener('change',updateQuick);
const sleepPop=document.createElement('div');sleepPop.className='sv-podcast-sleep-pop';sleepPop.hidden=true;player.append(sleepPop);
function showSleep(value){sleepPop.hidden=!value;sleepQuick.setAttribute('aria-expanded',String(value));if(!value)return;showSpeed(false);queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false');sleepPop.replaceChildren(el('strong','','Таймер сна'));for(const option of Array.from(sleepSelect.options)){const b=button(option.textContent,()=>{sleepSelect.value=option.value;sleepSelect.dispatchEvent(new Event('change'));showSleep(false);sleepQuick.focus({preventScroll:true})});if(option.value===sleepSelect.value){const tick=el('span');tick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>';b.append(tick)}sleepPop.append(b)}const p=player.getBoundingClientRect(),b=sleepQuick.getBoundingClientRect();const right=Math.max(12,p.right-b.right-12);sleepPop.style.setProperty('--sv-sleep-right',right+'px');sleepPop.style.setProperty('--sv-sleep-bottom',(p.bottom-b.top+8)+'px');sleepPop.style.setProperty('--sv-sleep-arrow',Math.max(12,p.right-b.right-right+b.width/2-5)+'px')}
sleepQuick.addEventListener('click',()=>showSleep(sleepPop.hidden));
const skipIcon=(seconds,back)=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(back?'M10 3 6 8l6 1M6 8a12 12 0 1 1-2 12':'M22 3l4 5-6 1M26 8a12 12 0 1 0 2 12')+'"/><text x="16" y="21" font-family="system-ui,sans-serif" font-size="11" font-weight="550" text-anchor="middle" fill="currentColor" stroke="none">'+seconds+'</text></svg>';
get('svPodcastRewind').innerHTML=skipIcon(15,true);get('svPodcastForward').innerHTML=skipIcon(30,false);get('svPodcastMiniForward').innerHTML=skipIcon(30,false);
const speedPop=document.createElement('div');speedPop.className='sv-podcast-speed-pop';speedPop.hidden=true;
const speedRange=document.createElement('input');speedRange.type='range';speedRange.min='0.75';speedRange.max='2';speedRange.step='0.05';speedRange.value='1';speedRange.setAttribute('aria-label','Скорость речи');
const moreButton=document.createElement('button');moreButton.id='svPodcastMore';moreButton.type='button';moreButton.setAttribute('aria-label','Дополнительные действия');moreButton.setAttribute('aria-expanded','false');moreButton.innerHTML='<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="currentColor" opacity=".09"/><g fill="currentColor"><circle cx="8" cy="14" r="1.35"/><circle cx="14" cy="14" r="1.35"/><circle cx="20" cy="14" r="1.35"/></g></svg>';player.querySelector('.sv-podcast-now-identity').append(moreButton);
const morePop=document.createElement('div');morePop.className='sv-podcast-more-pop';morePop.hidden=true;player.append(morePop);
function showMore(value){morePop.hidden=!value;moreButton.setAttribute('aria-expanded',String(value));if(!value)return;showSpeed(false);showSleep(false);queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false');morePop.replaceChildren();const active=!!(current&&state.favorites[current.id]);const favorite=button(active?'Убрать из избранного':'В избранное',()=>{favButton.click();showMore(false)});const listButton=button('Все выпуски',()=>{showMore(false);queueButton.click()});listButton.addEventListener('click',e=>e.stopPropagation());morePop.append(favorite,listButton);const p=player.getBoundingClientRect(),b=moreButton.getBoundingClientRect();morePop.style.setProperty('--sv-more-right',Math.max(12,p.right-b.right)+'px');morePop.style.setProperty('--sv-more-bottom',(p.bottom-b.top+8)+'px')}
moreButton.addEventListener('click',()=>showMore(morePop.hidden));
const speedNote=document.createElement('small');speedNote.textContent='Скорость воспроизведения';const speedRead=document.createElement('strong');speedRead.textContent='1×';
const speedHead=document.createElement('div');speedHead.className='sv-podcast-speed-head';
const speedReset=document.createElement('button');speedReset.type='button';speedReset.className='sv-podcast-reset';speedReset.textContent='Обычная скорость';speedReset.setAttribute('aria-label','Вернуть обычную скорость');speedReset.addEventListener('click',()=>{speedRange.value='1';speedRange.dispatchEvent(new Event('input'))});
const pitchKey=['preservesPitch','webkitPreservesPitch','mozPreservesPitch'].find(k=>k in audio);
const pitchButton=document.createElement('button');pitchButton.type='button';pitchButton.className='sv-podcast-pitch';pitchButton.setAttribute('aria-pressed','true');pitchButton.innerHTML='<svg class="sv-podcast-pitch-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 12h2m3-4v8m4-12v16m4-13v10m4-5h1"/></svg><span>Сохранять тон голоса</span>';
function applyPitch(){if(!pitchKey)return;try{audio[pitchKey]=state.preservePitch!==false;pitchButton.setAttribute('aria-pressed',String(audio[pitchKey]!==false))}catch{}}
pitchButton.addEventListener('click',()=>{if(!pitchKey)return;state.preservePitch=audio[pitchKey]===false;applyPitch();persist()});
if(pitchKey)speedHead.append(pitchButton);else speedHead.append(speedReset);
const speedScale=document.createElement('div');speedScale.className='sv-podcast-speed-scale';
const slow=document.createElement('span');slow.innerHTML='<svg viewBox="0 0 32 24" fill="currentColor" aria-hidden="true"><path d="M4.6 14.5C4.8 8.8 8.8 4.8 14.2 4.8c5.6 0 10 4 10.1 9.7H4.6Z"/><path d="M2.2 15.8h22.4c.9-2.4 2-4.1 4-4.1 1.7 0 2.8 1.2 2.8 2.7 0 1.8-1.6 2.8-3.5 2.8h-4l-2 2.7h-3.8l1-2.7H9.4l-2.3 2.7H3.5l1-2.7H2.2l-1.9-2.5z"/><path d="m8.2 7.3 3.8 7.2m6.6-8.6-3.5 8.6" stroke="#1b1b1d" stroke-width="1.25" fill="none" stroke-linecap="round"/></svg>';
const fast=document.createElement('span');fast.innerHTML='<svg viewBox="0 0 32 24" fill="currentColor" aria-hidden="true"><path d="M3.3 13.1c-1.9-.9-2.9-2-2.5-3.4.4-1.3 2.1-1.6 3.7-.7l2.2 1.1c3.3-3.4 8.7-3.1 12.2-.8l2.3-2.2-3-4.6c-1.8-3 1-3.5 3.2-.9l3 3.5 1-3c.9-2.6 3.1-2.2 2.9.4l-.3 4.8c2.6.7 4 2.5 3.3 4.1-.6 1.2-2.1 1.9-4.2 1.6l-3.2-.5-2.4 3.2 5.3 2.8c1.9 1.2.9 2.8-1 2.2l-8.1-2.4-3 2.2H7.4c-2.2 0-2.1-2.2.2-2.5l3.9-.5-3-2-5.8 1.6c-2.1.5-2.7-1.1-.8-2.2l3.4-2z"/><circle cx="27.9" cy="9.3" r=".65" fill="#1b1b1d"/></svg>';
speedScale.append(slow,speedRange,fast);speedRange.addEventListener('dblclick',()=>{speedRange.value='1';speedRange.dispatchEvent(new Event('input'))});speedRange.addEventListener('keydown',e=>{if(e.key==='Home'&&e.altKey){e.preventDefault();speedRange.value='1';speedRange.dispatchEvent(new Event('input'))}});speedPop.append(speedHead,speedScale,speedNote);player.append(speedPop);
function showSpeed(value){speedPop.hidden=!value;speedQuick.setAttribute('aria-expanded',String(value));if(value){showSleep(false);queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false');speedRange.value=String(audio.playbackRate||1);applyPitch();paintSpeed();const p=player.getBoundingClientRect(),b=speedQuick.getBoundingClientRect();const left=Math.max(12,Math.min(p.width- speedPop.offsetWidth-12,b.left-p.left-12));speedPop.style.setProperty('--sv-speed-pop-left',left+'px');speedPop.style.setProperty('--sv-speed-pop-bottom',(p.bottom-b.top+8)+'px');speedPop.style.setProperty('--sv-speed-arrow',Math.max(12,b.left-p.left-left+b.width/2-5)+'px')}}
function paintSpeed(){speedRead.textContent=String(Number(speedRange.value)).replace('.',',')+'×';speedRange.setAttribute('aria-valuetext',speedRead.textContent);speedRange.style.setProperty('--sv-value',((Number(speedRange.value)-.75)/1.25*100)+'%')}
speedQuick.addEventListener('click',()=>showSpeed(speedPop.hidden));speedRange.addEventListener('input',()=>{const v=String(Number(speedRange.value));if(!Array.from(speedSelect.options).some(o=>o.value===v))speedSelect.add(new Option(v.replace('.',',')+'×',v));speedSelect.value=v;speedSelect.dispatchEvent(new Event('change'));paintSpeed()});
const volumeRow=document.createElement('div');volumeRow.className='sv-podcast-volume';volumeRow.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/></svg><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Громкость"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path fill="currentColor" stroke="none" d="M2 9h4l5-4v14l-5-4H2z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const volume=volumeRow.querySelector('input');let volumeSupported=false;try{const old=audio.volume;audio.volume=old===.5?.6:.5;volumeSupported=audio.volume!==old;audio.volume=old}catch{}volumeRow.hidden=!volumeSupported;player.insertBefore(volumeRow,speedPop);function paintVolume(){volume.value=String(audio.volume);volume.style.setProperty('--sv-value',audio.volume*100+'%')}volume.addEventListener('input',()=>{audio.volume=Number(volume.value);paintVolume()});audio.addEventListener('volumechange',paintVolume);paintVolume();
const bottom=document.createElement('div');bottom.className='sv-podcast-bottom-tools';
const favButton=document.createElement('button'),queueButton=document.createElement('button');favButton.type=queueButton.type='button';favButton.setAttribute('aria-label','В избранное');favButton.setAttribute('aria-pressed','false');queueButton.setAttribute('aria-label','Выпуски подкаста');queueButton.setAttribute('aria-expanded','false');
const heartIcon='<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 4.1-8.8 9.6-8.8 9.6S3.2 12.8 3.2 8.7a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9Z"/></svg>';
queueButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/></svg>';bottom.append(favButton);
if(typeof audio.webkitShowPlaybackTargetPicker==='function'){const output=document.createElement('button');output.type='button';output.setAttribute('aria-label','Выбрать устройство воспроизведения');output.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 16a9 9 0 1 1 16 0M7 14a6 6 0 1 1 10 0M12 14l5 7H7z"/></svg>';output.addEventListener('click',()=>audio.webkitShowPlaybackTargetPicker());bottom.append(output)}
bottom.append(queueButton);player.insertBefore(bottom,speedPop);
const queuePop=document.createElement('div');queuePop.className='sv-podcast-queue-pop';queuePop.hidden=true;player.append(queuePop);
function updateFavorite(){const active=!!(current&&state.favorites[current.id]);favButton.setAttribute('aria-pressed',String(active));favButton.setAttribute('aria-label',active?'Убрать из избранного':'В избранное');favButton.innerHTML=heartIcon;favButton.querySelector('svg').setAttribute('fill',active?'currentColor':'none')}
favButton.addEventListener('click',()=>{if(!current)return;if(state.favorites[current.id])delete state.favorites[current.id];else state.favorites[current.id]=true;persist();updateFavorite();renderEpisodes();renderHighlights()});
queueButton.addEventListener('click',()=>{const open=queuePop.hidden;showSpeed(false);showSleep(false);queuePop.hidden=!open;queueButton.setAttribute('aria-expanded',String(open));if(!open)return;queuePop.replaceChildren(el('strong','','Выпуски подкаста'));const feed=state.feeds.find(f=>f.id===current?.feed);if(!feed)return;for(const ep of feed.items){const b=button(ep.title,()=>{queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false');play(feed,ep)});b.setAttribute('aria-current',String(ep.id===current?.id));queuePop.append(b)}});
function closePopups(){showMore(false);showSpeed(false);showSleep(false);queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false')}
player.addEventListener('click',e=>{if(!morePop.contains(e.target)&&!moreButton.contains(e.target))showMore(false);if(!sleepPop.contains(e.target)&&!sleepQuick.contains(e.target))showSleep(false);if(!speedPop.contains(e.target)&&!speedQuick.contains(e.target))showSpeed(false);if(!queuePop.contains(e.target)&&!queueButton.contains(e.target)){queuePop.hidden=true;queueButton.setAttribute('aria-expanded','false')}});


let state={feeds:[],progress:{},favorites:{},last:null,speed:1,preservePitch:true},selected=null,current=null,loadToken=0,lastSave=0,sleepTimer=null,fullOpen=false,podcastOwnsAudio=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Array.isArray(saved.feeds)){state={...state,...saved};state.progress=state.progress||{};state.favorites=state.favorites||{}}}catch{}
const say=t=>{status.textContent=t||'';status.hidden=!t;notice.textContent=t||'';notice.hidden=!t};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{say('Не удалось сохранить изменения на устройстве.');return false}};
const el=(tag,cls,t)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(t!=null)n.textContent=t;return n};
const button=(t,fn)=>{const b=el('button','sv-podcast-button',t);b.type='button';b.addEventListener('click',fn);return b};
const https=(v,base)=>{try{const u=new URL(v,base);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
const direct=(node,name)=>Array.from(node?.children||[]).find(x=>x.localName===name);
const value=(node,name)=>direct(node,name)?.textContent?.trim()||'';
function parse(xml,base){
const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw Error('Не удалось прочитать RSS.');
const channel=d.getElementsByTagName('channel')[0];if(!channel)throw Error('Это не RSS-лента подкаста.');
const title=value(channel,'title')||'Подкаст',items=[];
for(const item of Array.from(channel.children).filter(n=>n.localName==='item').slice(0,100)){
const enc=direct(item,'enclosure'),url=enc?.getAttribute('url');if(!url)continue;const type=enc.getAttribute('type')||'',src=https(url,base);
if(!src||type&&!/^(audio\/|application\/ogg)/i.test(type))continue;
const id=src;if(items.some(x=>x.id===id))continue;
const image=direct(item,'image');const imageUrl=image?.getAttribute('href')||value(image,'url');items.push({id,src,title:(value(item,'title')||'Выпуск').slice(0,250),date:value(item,'pubDate').slice(0,100),artwork:imageUrl?https(imageUrl,base):''});
}
if(!items.length)throw Error('В этой ленте нет доступных аудиовыпусков.');
const author=value(channel,'author')||value(channel,'managingEditor');const images=Array.from(channel.children).filter(x=>x.localName==='image');const artUrl=images.map(x=>x.getAttribute('href')||value(x,'url')).find(Boolean);const artwork=artUrl?https(artUrl,base):'';return {title:title.slice(0,160),author:author.slice(0,160),artwork,items};
}
function storeFeed(id,data){
const existing=state.feeds.find(f=>f.id===id);
if(existing){const merged=new Map(existing.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);existing.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);existing.title=data.title;existing.author=data.author||existing.author||'';existing.artwork=data.artwork||existing.artwork||'';existing.directoryArtwork=data.directoryArtwork||existing.directoryArtwork||'';existing.directoryId=data.directoryId||existing.directoryId||null;existing.country=data.country||existing.country||'RU';existing.updated=Date.now()}
else{if(state.feeds.length>=30)throw Error('Достигнут предел подписок.');state.feeds.unshift({id,...data,updated:Date.now()})}
persist();render();
}
const localServer=()=>['localhost','127.0.0.1'].includes(location.hostname);
async function readFeed(id,signal){
 if(localServer()){
  const res=await fetch('/api/seyveo-podcast-feed?'+new URLSearchParams({url:id}),{signal,credentials:'same-origin'});
  if(!res.ok)throw Error(res.status===404?'Обнови и перезапусти локальный сервер.':'Не удалось получить выпуски.');
  const data=await res.json();if(typeof data.xml!=='string'||data.xml.length>3000000)throw Error('Лента недоступна.');
  return {xml:data.xml,url:data.url||id}
 }
 const res=await fetch(id,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)throw Error('Лента недоступна.');const xml=await res.text();if(xml.length>3000000)throw Error('Лента слишком большая.');return {xml,url:res.url||id}
}
async function load(url,meta=null){
const id=https(url);if(!id){say('Вставь HTTPS-ссылку на RSS подкаста.');return}
const token=++loadToken;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
say('Загружаю выпуски…');get('svPodcastAdd').disabled=true;
try{const response=await readFeed(id,controller.signal);if(token!==loadToken)return;const data=parse(response.xml,response.url);if(meta){data.author=data.author||meta.author||'';data.directoryArtwork=meta.directoryArtwork||meta.artwork||'';data.artwork=data.artwork||meta.artwork||'';data.directoryId=meta.directoryId||null;data.country=meta.country||'RU'}storeFeed(id,data);input.value='';closeManual();say('');return true}
catch(e){if(token===loadToken){if(meta?.directoryId){try{const data=await directoryEpisodes(meta);if(token!==loadToken)return false;storeFeed(id,data);say('');return true}catch{}}say(e.message==='Failed to fetch'||e.name==='AbortError'||e instanceof TypeError?'Сайт не разрешает загрузить ленту из приложения. Можно добавить скачанный RSS-файл.':e.message||'Не удалось загрузить ленту.');return false}}
finally{clearTimeout(timeout);if(token===loadToken)get('svPodcastAdd').disabled=false}
}
form.addEventListener('submit',e=>{e.preventDefault();load(input.value.trim())});
file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;try{if(f.size>3000000)throw Error('Файл слишком большой.');const xml=typeof f.text==='function'?await f.text():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(f)});const data=parse(xml);storeFeed('file:'+data.title,data);say('')}catch(e){say(e.message||'Не удалось прочитать файл.')}finally{file.value=''}});
const duration=s=>{const n=Math.max(0,Math.floor(s||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
function savePosition(force=false){if(!current||audio.readyState<1||!Number.isFinite(audio.currentTime))return;if(!force&&Date.now()-lastSave<5000)return;lastSave=Date.now();state.progress[current.id]={position:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:0,finished:audio.ended,updated:Date.now()};state.last={feed:current.feed,id:current.id};persist()}
function play(feed,ep){
if(current?.id===ep.id&&podcastOwnsAudio){openFull();if(audio.paused)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));return}
savePosition(true);audio.pause();current=null;const pos=state.progress[ep.id];current={...ep,feed:feed.id};player.hidden=false;get('svPodcastPlaying').textContent=ep.title;get('svPodcastPlayingFeed').textContent=feed.title;paintCurrentCover(feed,ep);updateFavorite();get('svPodcastMiniTitle').textContent=ep.title;get('svPodcastMiniAuthor').textContent=feed.title;podcastOwnsAudio=true;openFull();updateTransport();
const main=document.getElementById('sayviMusicAudio');main?.pause();
audio.src=ep.src;audio.playbackRate=state.speed||1;applyPitch();if(!Array.from(speedSelect.options).some(o=>Number(o.value)===audio.playbackRate))speedSelect.add(new Option(String(audio.playbackRate)+'×',String(audio.playbackRate)));get('svPodcastSpeed').value=String(audio.playbackRate);updateQuick();
const expected=ep.src;
const resume=()=>{if(current?.src!==expected)return;if(pos&&!pos.finished&&pos.position>0&&(!Number.isFinite(audio.duration)||pos.position<audio.duration-2))try{audio.currentTime=pos.position}catch{}};
audio.addEventListener('loadedmetadata',resume,{once:true});audio.play().catch(()=>say('Нажми воспроизведение, чтобы начать слушать.'));state.last={feed:feed.id,id:ep.id};persist();renderEpisodes();renderHighlights();
}
audio.addEventListener('play',()=>{document.getElementById('sayviMusicAudio')?.pause();say('')});
const seek=get('svPodcastSeek'),toggle=get('svPodcastToggle'),mini=get('svPodcastMini'),miniToggle=get('svPodcastMiniToggle'),root=document.documentElement,page=get('sayviMusicPage');
function syncPodcastView(){
 const inside=page.dataset.musicView&&root.classList.contains('sv-music-screen'),browse=inside&&page.dataset.musicView!=='player';
 const full=!!(fullOpen&&current&&podcastOwnsAudio&&page.dataset.musicView==='podcasts'&&!panel.hidden);
 root.classList.toggle('sv-podcast-full-open',full);
 panel.classList.toggle('sv-podcast-full-open',full);
 overlay.hidden=!full;player.hidden=!full;
 if(full)get('svPodcastCollapse').focus({preventScroll:true});
 const showMini=!!(current&&podcastOwnsAudio&&browse&&!full);
 mini.hidden=!showMini;root.classList.toggle('sv-podcast-mini-active',showMini);
}
function openFull(){
 if(!current||!podcastOwnsAudio)return;
 if(page.dataset.musicView!=='podcasts')window.SEYVEO_MUSIC_DOCK?.show?.('podcasts');
 openSearch(false);resetTools();fullOpen=true;syncPodcastView();page.scrollTop=0;renderHighlights();
}
function closeFull(){closePopups();fullOpen=false;syncPodcastView();renderHighlights();page.scrollTop=0;if(!mini.hidden)get('svPodcastMiniOpen').focus({preventScroll:true})}
const collapseHandle=get('svPodcastCollapse');let collapseGesture=null,ignoreCollapseClick=0;
collapseHandle.addEventListener('click',()=>{if(Date.now()>ignoreCollapseClick)closeFull()});
function finishCollapseGesture(x,y){if(!collapseGesture)return;const dx=x-collapseGesture.x,dy=y-collapseGesture.y;collapseGesture=null;if(dy>48&&dy>Math.abs(dx)*1.3){ignoreCollapseClick=Date.now()+450;closeFull()}}
if(window.PointerEvent){collapseHandle.addEventListener('pointerdown',e=>{if(e.button!==0)return;collapseGesture={x:e.clientX,y:e.clientY};try{collapseHandle.setPointerCapture(e.pointerId)}catch{}});collapseHandle.addEventListener('pointerup',e=>finishCollapseGesture(e.clientX,e.clientY));collapseHandle.addEventListener('pointercancel',()=>{collapseGesture=null})}
else{collapseHandle.addEventListener('touchstart',e=>{const t=e.touches[0];if(t)collapseGesture={x:t.clientX,y:t.clientY}},{passive:true});collapseHandle.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(t)finishCollapseGesture(t.clientX,t.clientY)});collapseHandle.addEventListener('touchcancel',()=>{collapseGesture=null})}

get('svPodcastMiniOpen').addEventListener('click',openFull);
miniToggle.addEventListener('click',()=>{if(current){if(audio.paused||audio.ended)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));else audio.pause()}});
get('svPodcastMiniForward').addEventListener('click',()=>jump(30));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullOpen){e.preventDefault();if(!morePop.hidden||!speedPop.hidden||!sleepPop.hidden||!queuePop.hidden)closePopups();else closeFull()}});

function updateTransport(){
 const d=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,t=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 seek.disabled=!d;seek.max=String(d||1);seek.value=String(Math.min(t,d||1));seek.style.setProperty('--sv-podcast-progress',(d?100*t/d:0)+'%');get('svPodcastElapsed').textContent=duration(t);get('svPodcastRemaining').textContent='−'+duration(Math.max(0,d-t));
 const playing=!audio.paused&&!audio.ended;if(toggle.dataset.playing===String(playing))return;toggle.dataset.playing=String(playing);toggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');toggle.innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 4.7a1 1 0 0 1 1.5-.85l12 7.3a1 1 0 0 1 0 1.7L9 20.15a1 1 0 0 1-1.5-.85z"/></svg>';miniToggle.innerHTML=toggle.innerHTML;miniToggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
}
function jump(delta){if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+delta));updateTransport()}}
seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(seek.value);updateTransport()}});
get('svPodcastRewind').addEventListener('click',()=>jump(-15));get('svPodcastForward').addEventListener('click',()=>jump(30));
toggle.addEventListener('click',()=>{if(!current)return;if(audio.paused||audio.ended)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));else audio.pause()});
for(const type of ['play','pause','ended','loadedmetadata','durationchange','timeupdate','seeking','emptied'])audio.addEventListener(type,updateTransport);
document.getElementById('sayviMusicAudio')?.addEventListener('play',()=>{audio.pause();clearTimeout(sleepTimer);get('svPodcastSleep').value='0';updateQuick();podcastOwnsAudio=false;fullOpen=false;syncPodcastView();renderHighlights()});
audio.addEventListener('timeupdate',()=>savePosition());audio.addEventListener('pause',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('ended',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('error',()=>say('Выпуск сейчас недоступен.'));
get('svPodcastSpeed').addEventListener('change',e=>{state.speed=Number(e.target.value)||1;audio.playbackRate=state.speed;applyPitch();persist()});
get('svPodcastSleep').addEventListener('change',e=>{clearTimeout(sleepTimer);const minutes=Number(e.target.value);if(minutes>0)sleepTimer=setTimeout(()=>{audio.pause();get('svPodcastSleep').value='0';updateQuick();say('Таймер сна завершён.')},minutes*60000)});
window.addEventListener('pagehide',()=>savePosition(true));
function renderEpisodes(){
episodes.replaceChildren();const feed=state.feeds.find(f=>f.id===selected);if(!feed)return;
const header=el('div','sv-podcast-detail-title');header.append(artwork(feed),copyOf(feed.title,feed.author||feed.items.length+' выпусков'));episodes.append(header);
for(const ep of feed.items){
const row=el('div','sv-podcast-episode'),copy=button(ep.title,()=>{play(feed,ep);document.getElementById('sayviMusicPage').scrollTop=0});copy.className='sv-podcast-episode-title';
const pos=state.progress[ep.id],date=Date.parse(ep.date),meta=el('small','',[(Number.isFinite(date)?new Date(date).toLocaleDateString('ru-RU'):''),pos?.finished?'Прослушано':pos?.position>0?'Продолжить · '+duration(pos.position):''].filter(Boolean).join(' · '));
const heart=button(state.favorites[ep.id]?'♥':'♡',()=>{if(state.favorites[ep.id])delete state.favorites[ep.id];else state.favorites[ep.id]=true;persist();renderEpisodes();renderHighlights()});heart.className='sv-podcast-heart';heart.setAttribute('aria-label',state.favorites[ep.id]?'Убрать из избранного':'В избранное');heart.setAttribute('aria-pressed',String(!!state.favorites[ep.id]));
const body=el('div','sv-podcast-episode-copy');body.append(copy,meta);const p=action('',()=>{play(feed,ep);document.getElementById('sayviMusicPage').scrollTop=0});p.classList.add('sv-podcast-episode-play');p.setAttribute('aria-label','Слушать '+ep.title);p.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="m8 5 12 7-12 7z"/></svg>';row.append(body,p,heart);episodes.append(row);
}
}

const searchOpen=get('svPodcastSearchOpen'),searchForm=get('svPodcastSearchBar'),searchInput=get('svPodcastSearchInput'),results=get('svPodcastSearchResults'),manage=get('svPodcastManage'),manual=get('svPodcastManual');
let searchSerial=0,manageOpen=false;
const options=get('svPodcastOptions'),editSubscriptions=get('svPodcastEditSubscriptions');
function closeOptions(){options.hidden=true;manage.setAttribute('aria-expanded','false')}
function closeManual(){const wasOpen=!manual.hidden;manual.hidden=true;panel.classList.remove('sv-podcast-manual-active');input.blur();if(wasOpen){const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent='Подкасты';if(!panel.hidden)document.getElementById('sayviMusicPage').scrollTop=0}}
function resetTools(){closeOptions();closeManual();manageOpen=false;manage.setAttribute('aria-label','Управление подписками')}
function openSearch(value=true){
 searchForm.hidden=!value;searchOpen.setAttribute('aria-expanded',String(value));
 if(value){selected=null;resetTools();render();searchInput.focus()}else{searchSerial++;results.hidden=true;results.replaceChildren();searchInput.value='';panel.classList.remove('sv-podcast-search-active');if(!panel.hidden)document.getElementById('sayviMusicPage').scrollTop=0}
}
searchOpen.addEventListener('click',()=>openSearch(searchForm.hidden));
const back=document.querySelector('#sayviMusicPage .sv-music-inner-back');back?.addEventListener('click',e=>{if(panel.hidden)return;if(!searchForm.hidden||selected||!manual.hidden){e.preventDefault();e.stopImmediatePropagation();if(!searchForm.hidden)openSearch(false);selected=null;resetTools();render();document.getElementById('sayviMusicPage').scrollTop=0}},true);
manage.addEventListener('click',()=>{if(manageOpen){manageOpen=false;manage.setAttribute('aria-label','Управление подписками');render();return}if(!options.hidden){closeOptions();return}editSubscriptions.hidden=!state.feeds.length;options.hidden=false;manage.setAttribute('aria-expanded','true')});
editSubscriptions.addEventListener('click',()=>{closeOptions();closeManual();manageOpen=true;manage.setAttribute('aria-label','Завершить управление подписками');render()});
get('svPodcastAddLink').addEventListener('click',()=>{closeOptions();selected=null;manageOpen=false;render();manual.hidden=false;panel.classList.add('sv-podcast-manual-active');say('');const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent='Добавить подкаст';document.getElementById('sayviMusicPage').scrollTop=0;input.focus()});
get('svPodcastCloseManual').addEventListener('click',()=>{closeManual();say('')});
get('svPodcastAddFile').addEventListener('click',()=>{closeOptions();file.click()});
document.addEventListener('click',e=>{if(!options.hidden&&!options.contains(e.target)&&!manage.contains(e.target))closeOptions()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!options.hidden){closeOptions();manage.focus()}});

function artwork(feed,large=false){
 const a=el('span','sv-podcast-art');a.setAttribute('aria-hidden','true');
 const fallback=()=>{a.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"><circle cx="12" cy="10" r="2"/><path d="M7.5 16a7 7 0 1 1 9 0M5 19a11 11 0 1 1 14 0M11 14h2l1 7h-4z"/></svg>';if(large&&feed.title)a.append(el('span','sv-podcast-cover-label',feed.title))};
 fallback();const urls=[feed.episodeArtwork,large?feed.artwork:feed.directoryArtwork,large?feed.directoryArtwork:feed.artwork].map(v=>https(v)).filter(Boolean);
 const upscale=url=>{try{const u=new URL(url);if(!/(^|\.)mzstatic\.com$/i.test(u.hostname))return url;u.pathname=u.pathname.replace(/\/\d+x\d+bb(?=\.)/i,'/1200x1200bb');return u.href}catch{return url}};
 const choices=[...new Set(large?[...urls.map(upscale),...urls]:urls)];let best=null;
 const put=(img,low=false)=>{a.classList.toggle('is-low-res',low);a.classList.toggle('has-cover',large&&!low);if(low)a.style.setProperty('--sv-art-side',Math.min(260,Math.max(100,img.naturalWidth*1.35))+'px');if(large&&!low){const ambient=img.cloneNode(false);ambient.className='sv-podcast-art-ambient';ambient.setAttribute('aria-hidden','true');img.className='sv-podcast-art-main';a.replaceChildren(ambient,img)}else a.replaceChildren(img)};
 const tryNext=()=>{const url=choices.shift();if(!url){if(best)put(best,true);else fallback();return}const img=el('img');img.alt='';img.loading='eager';img.referrerPolicy='no-referrer';img.addEventListener('error',tryNext,{once:true});img.addEventListener('load',()=>{if(!large||Math.min(img.naturalWidth,img.naturalHeight)>=450){put(img);return}if(!best||img.naturalWidth*img.naturalHeight>best.naturalWidth*best.naturalHeight)best=img;tryNext()},{once:true});img.src=url};if(choices.length)tryNext();return a
}
function paintCurrentCover(feed,ep){const cover={...feed,episodeArtwork:ep.artwork||''};get('svPodcastNowArt').replaceChildren(artwork(cover));get('svPodcastFullCover').replaceChildren(artwork(cover,true));get('svPodcastMiniArt').replaceChildren(artwork(cover))}
function copyOf(title,sub,fn){const c=fn?button('',fn):el('div');c.className='sv-podcast-row-copy';c.append(el('strong','',title));if(sub)c.append(el('small','',sub));return c}
function action(t,fn){const b=button(t,fn);b.classList.add('sv-podcast-flat-action');return b}
function episodeCard(feed,ep,sub){
 const go=()=>{play(feed,ep);render();document.getElementById('sayviMusicPage').scrollTop=0};const row=el('div','sv-podcast-episode-card');const p=action('▶',go);p.setAttribute('aria-label','Слушать '+ep.title);row.append(artwork(feed),copyOf(ep.title,sub||feed.title,go),p);return row
}
function renderHighlights(){
 const resume=get('svPodcastResume'),news=get('svPodcastNew'),recs=get('svPodcastForYou');resume.replaceChildren();news.replaceChildren();recs.replaceChildren();
 const all=[];for(const feed of state.feeds)for(const ep of feed.items)all.push({feed,ep,pos:state.progress[ep.id]});
 const visibleCurrent=current&&podcastOwnsAudio?current.id:null;
 const unfinished=all.filter(x=>x.ep.id!==visibleCurrent&&x.pos?.position>0&&!x.pos.finished).sort((a,b)=>b.pos.updated-a.pos.updated);
 resume.hidden=!unfinished.length;
 if(unfinished.length){resume.append(el('h3','sv-podcast-heading','Продолжить слушать'));for(const x of unfinished.slice(0,3))resume.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+duration(x.pos.position)))}
 const fresh=all.filter(x=>x.ep.id!==visibleCurrent&&!x.pos?.position&&!x.pos?.finished&&Number.isFinite(Date.parse(x.ep.date))).sort((a,b)=>Date.parse(b.ep.date)-Date.parse(a.ep.date));news.hidden=!fresh.length;
 if(fresh.length){news.append(el('h3','sv-podcast-heading','Последние выпуски'));for(const x of fresh.slice(0,4))news.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+new Date(x.ep.date).toLocaleDateString('ru-RU')))}
 const weights=new Map();for(const x of all)if(x.pos?.position>0||state.favorites[x.ep.id])weights.set(x.feed.id,(weights.get(x.feed.id)||0)+Math.min(60,(x.pos?.position||0)/60)+(state.favorites[x.ep.id]?10:0));
 const featured=new Set(fresh.slice(0,4).map(x=>x.ep.id));const picks=all.filter(x=>x.ep.id!==visibleCurrent&&weights.has(x.feed.id)&&!x.pos?.position&&!x.pos?.finished&&!featured.has(x.ep.id)).sort((a,b)=>weights.get(b.feed.id)-weights.get(a.feed.id)||((Date.parse(b.ep.date)||0)-(Date.parse(a.ep.date)||0)));
 recs.hidden=!picks.length;if(picks.length){recs.append(el('h3','sv-podcast-heading','Для тебя'),el('p','sv-podcast-muted','На основе твоих прослушиваний и избранного.'));for(const x of picks.slice(0,3))recs.append(episodeCard(x.feed,x.ep))}
}
function render(){
 list.replaceChildren();list.classList.toggle('sv-podcast-grid',state.feeds.length>0&&!manageOpen);if(!state.feeds.some(f=>f.id===selected))selected=null;panel.classList.toggle('sv-podcast-detail',!!selected);syncPodcastView();const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent=manual.hidden?'Подкасты':'Добавить подкаст';
 get('svPodcastIntro').hidden=!!state.feeds.length;editSubscriptions.hidden=!state.feeds.length;
 get('svPodcastTopics').hidden=!!state.feeds.length;
 for(const feed of state.feeds){
  const go=()=>{selected=feed.id;resetTools();render();document.getElementById('sayviMusicPage').scrollTop=0};
  const row=el('div','sv-podcast-feed'),title=copyOf(feed.title,feed.author||feed.items.length+' выпусков',go);title.setAttribute('aria-pressed',String(feed.id===selected));if(manageOpen)row.append(artwork(feed),title);else{const tile=button('',go);tile.className='sv-podcast-tile';tile.append(artwork(feed),title.querySelector('strong'),title.querySelector('small'));row.append(tile)}
  if(manageOpen){if(https(feed.id)){const refresh=action('↻',()=>load(feed.id,feed));refresh.setAttribute('aria-label','Обновить выпуски');row.append(refresh)}const remove=action('',()=>{if(!confirm('Убрать подписку «'+feed.title+'»?'))return;if(current?.feed===feed.id){audio.pause();current=null;fullOpen=false;podcastOwnsAudio=false;audio.removeAttribute('src');audio.load();syncPodcastView()}state.feeds=state.feeds.filter(f=>f.id!==feed.id);persist();render()});remove.classList.add('sv-podcast-trash');remove.setAttribute('aria-label','Удалить подписку «'+feed.title+'»');row.append(remove)}
  list.append(row)
 }
 if(!state.feeds.length){list.append(el('p','sv-podcast-muted','Найди любимого автора, чтобы не пропускать выпуски.'));}
 renderHighlights();renderEpisodes();
}
// Cross-site callback runs in an opaque sandbox, not in the app origin.
async function directoryRequest(path,params){
 const url=new URL('https://itunes.apple.com/'+path);for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{const response=await fetch(url.href,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('directory');return await response.json()}catch{}finally{clearTimeout(timer)}
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('aria-hidden','true');
  url.searchParams.set('callback','svPodcastDirectoryCallback');const nonce=String(Date.now())+Math.random().toString(36).slice(2);
  let timeout;const cleanup=()=>{clearTimeout(timeout);window.removeEventListener('message',onMessage);frame.remove()};
  const onMessage=e=>{if(e.source!==frame.contentWindow||e.data?.nonce!==nonce)return;const data=e.data.data;cleanup();if(data&&Array.isArray(data.results))resolve(data);else reject(Error('Каталог временно недоступен.'))};
  window.addEventListener('message',onMessage);timeout=setTimeout(()=>{cleanup();reject(Error('Каталог временно недоступен.'))},10000);
  const source=JSON.stringify(url.href).replace(/</g,'\\u003c'),key=JSON.stringify(nonce);
  frame.srcdoc='<script>function svPodcastDirectoryCallback(data){parent.postMessage({nonce:'+key+',data:data},"*")}var s=document.createElement("script");s.src='+source+';s.onerror=function(){parent.postMessage({nonce:'+key+',data:null},"*")};document.head.appendChild(s);<\/script>';
  document.body.append(frame)
 })
}
function countryFor(term){if(/[а-яё]/i.test(term))return 'RU';const region=(navigator.language||'').split('-')[1];return /^[A-Z]{2}$/.test(region||'')?region:'US'}
async function directoryEpisodes(meta){
 const data=localServer()?await fetch('/api/seyveo-podcast-episodes?'+new URLSearchParams({id:meta.directoryId,country:meta.country||'RU'}),{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Каталог выпусков недоступен.');return r.json()}):await directoryRequest('lookup',{id:meta.directoryId,entity:'podcastEpisode',limit:50,country:meta.country||'RU'});
 const items=[];for(const x of (data.results||[])){const src=https(x.episodeUrl);if(x.kind!=='podcast-episode'||!src||items.some(e=>e.id===src))continue;items.push({id:src,src,title:String(x.trackName||'Выпуск').slice(0,250),date:String(x.releaseDate||'').slice(0,100),artwork:https(x.artworkUrl600||x.artworkUrl160||x.artworkUrl100)})}
 if(!items.length)throw Error('Выпуски недоступны');
 return {title:meta.title,author:meta.author||'',directoryId:meta.directoryId,country:meta.country||'RU',artwork:meta.artwork||'',directoryArtwork:meta.directoryArtwork||meta.artwork||'',items}
}
let following=false;
async function search(term){
 term=String(term||'').trim();if(!term)return;
 const token=++searchSerial;panel.classList.add('sv-podcast-search-active');document.getElementById('sayviMusicPage').scrollTop=0;searchInput.blur();results.hidden=false;results.replaceChildren(el('p','sv-podcast-muted','Ищу подкасты…'));
 try{
  const country=countryFor(term);const data=await directoryRequest('search',{term,media:'podcast',entity:'podcast',limit:24,country});if(token!==searchSerial)return;
  results.replaceChildren(el('h3','sv-podcast-heading','Результаты поиска'));
  const found=[];for(const x of (data.results||[])){const id=https(x.feedUrl);if(!id||found.some(f=>f.id===id))continue;found.push({id,title:String(x.collectionName||x.trackName||'Подкаст').slice(0,160),author:String(x.artistName||'').slice(0,160),directoryId:Number(x.collectionId||x.trackId)||null,artwork:https(String(x.artworkUrl600||x.artworkUrl100||x.artworkUrl60||'').replace(/^http:\/\/(?=[^/]+\.mzstatic\.com\/)/i,'https://')),country})}
  if(!found.length)results.append(el('p','sv-podcast-muted','Ничего не найдено. Попробуй другое название или тему.'));
  for(const feed of found){const saved=state.feeds.find(f=>f.id===feed.id);if(saved&&feed.artwork){saved.directoryArtwork=feed.artwork;saved.directoryId=feed.directoryId||saved.directoryId;persist()}const row=el('div','sv-podcast-result');const subscribed=state.feeds.some(f=>f.id===feed.id);const follow=action(subscribed?'✓':'＋',async()=>{if(following||state.feeds.some(f=>f.id===feed.id))return;following=true;follow.disabled=true;follow.textContent='…';try{const ok=await load(feed.id,feed);follow.textContent=ok?'✓':'＋';follow.disabled=!!ok;if(ok)follow.setAttribute('aria-label','Уже в подписках');if(!ok&&status.textContent&&token===searchSerial){const note=el('small','sv-podcast-row-error',status.textContent);row.querySelector('.sv-podcast-row-copy').append(note)}}finally{following=false}});follow.disabled=subscribed;follow.setAttribute('aria-label',subscribed?'Уже в подписках':'Подписаться на '+feed.title);row.append(artwork(feed),copyOf(feed.title,feed.author),follow);results.append(row)}
  if(found.length)results.append(el('small','sv-podcast-directory-credit','Каталог: Apple Podcasts. Аудио — из открытых лент издателей.'));
 }catch{if(token===searchSerial)results.replaceChildren(el('p','sv-podcast-muted','Каталог временно недоступен. Попробуй ещё раз.'))}
}
searchForm.addEventListener('submit',e=>{e.preventDefault();search(searchInput.value)});
searchInput.addEventListener('input',()=>{if(!searchInput.value.trim()){searchSerial++;results.hidden=true;results.replaceChildren();panel.classList.remove('sv-podcast-search-active')}});
searchInput.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();openSearch(false);searchOpen.focus()}});
get('svPodcastTopics').addEventListener('click',e=>{const b=e.target.closest('[data-podcast-topic]');if(!b)return;openSearch();searchInput.value=b.dataset.podcastTopic;search(searchInput.value)});
let refreshing=false,repairing=false;
const artAttempts=new Set();
async function restoreArtwork(){
 if(repairing)return;repairing=true;
 try{for(const feed of state.feeds){if(panel.hidden)break;if(feed.directoryArtwork||artAttempts.has(feed.id)||!https(feed.id))continue;artAttempts.add(feed.id);
  try{const data=await directoryRequest('search',{term:feed.title,media:'podcast',entity:'podcast',limit:20,country:feed.country||countryFor(feed.title)});if(!state.feeds.includes(feed))continue;
   const exact=(data.results||[]).find(x=>(feed.directoryId&&Number(x.collectionId||x.trackId)===Number(feed.directoryId))||https(x.feedUrl)===feed.id);if(!exact)continue;
   const art=https(String(exact.artworkUrl600||exact.artworkUrl100||exact.artworkUrl60||'').replace(/^http:\/\/(?=[^/]+\.mzstatic\.com\/)/i,'https://'));if(!art)continue;feed.directoryArtwork=art;feed.directoryId=Number(exact.collectionId||exact.trackId)||feed.directoryId;persist();if(current?.feed===feed.id)paintCurrentCover(feed,current);if(!panel.hidden)render();
  }catch{}}
 }finally{repairing=false}
}
async function refreshSubscriptions(){
 if(refreshing)return;refreshing=true;
 try{
  const due=state.feeds.filter(f=>https(f.id)&&Date.now()-(f.updated||0)>3600000);
  for(const feed of due){
   if(panel.hidden)break;
   const c=new AbortController(),timeout=setTimeout(()=>c.abort(),18000);
   try{
    let data;
    try{const response=await readFeed(feed.id,c.signal);data=parse(response.xml,response.url)}
    catch{if(!feed.directoryId)continue;data=await directoryEpisodes(feed)}
    if(!state.feeds.includes(feed))continue;
    const merged=new Map(feed.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);
    feed.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);
    feed.title=data.title;feed.author=data.author||feed.author||'';feed.artwork=data.artwork||feed.artwork||'';feed.updated=Date.now();persist();
    if(current?.feed===feed.id)paintCurrentCover(feed,feed.items.find(ep=>ep.id===current.id)||current);
    if(!panel.hidden){renderHighlights();renderEpisodes()}
   }catch{}finally{clearTimeout(timeout)}
  }
 }finally{refreshing=false}
}
document.addEventListener('seyveo:music-view',e=>{if(e.detail?.view==='podcasts'){render();refreshSubscriptions();restoreArtwork()}else{fullOpen=false;selected=null;openSearch(false);resetTools();if(current){savePosition(true);if(!e.detail?.view||e.detail.view==='player')audio.pause()}syncPodcastView()}});
render();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();