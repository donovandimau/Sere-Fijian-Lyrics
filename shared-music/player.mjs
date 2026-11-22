import {loadCatalogue,playlists,ALL,OTHER} from './core.mjs';
// Shared music player: playlists, the listener's own mixes (saved on this device), shuffle and repeat.
let dialog,audio,shadow,status,list,search,count,title,play,prev,next,retry,badge,origin,chips,mixbar,adder,shuffleBtn,repeatBtn;
let tracks=[],selected=null,loading=0,attempt=0,buffering=false,lastPlaying=false,current=ALL,history=[],chipKey='',chipShown='',addFor=null,confirmDelete=false,renaming=false;
const MIXES='My mixes',PICK='dimau.shared-music.playlist',MIXKEY='dimau.shared-music.mixes',MODEKEY='dimau.shared-music.modes';
const REPEATS=['off','all','one'],REPEAT_LABEL={off:'Repeat off',all:'Repeat all',one:'Repeat one'};
const store={get(key,fallback){try{const v=JSON.parse(globalThis.localStorage.getItem(key));return v??fallback;}catch(_){return fallback;}},set(key,value){try{globalThis.localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));}catch(_){}}};
try{current=globalThis.localStorage.getItem(PICK)||ALL;}catch(_){}
let modes=(()=>{const m=store.get(MODEKEY,{});return{shuffle:m.shuffle===true,repeat:REPEATS.includes(m.repeat)?m.repeat:'off'};})();
let mixes=cleanMixes(store.get(MIXKEY,[]));
function cleanMixes(value){
  if(!Array.isArray(value))return[];
  return value.filter(m=>m&&typeof m.id==='string'&&/^[a-z0-9-]{1,40}$/.test(m.id)&&typeof m.name==='string'&&m.name.trim()).slice(0,50)
    .map(m=>({id:m.id,name:m.name.trim().slice(0,40),ids:[...new Set((Array.isArray(m.ids)?m.ids:[]).filter(id=>typeof id==='string'))].slice(0,500)}));
}
const saveMixes=()=>store.set(MIXKEY,mixes);
const mixOf=key=>key?.startsWith('mix:')?mixes.find(m=>'mix:'+m.id===key):null;
const byId=id=>tracks.find(t=>t.id===id);
function inList(){
  if(current===ALL)return tracks;
  if(current===MIXES)return[];
  const mix=mixOf(current);if(mix)return mix.ids.map(byId).filter(Boolean);
  return tracks.filter(t=>t.playlist===current);
}
const listName=()=>current===ALL?'':mixOf(current)?.name||(current===MIXES?MIXES:current);
const asset=name=>new URL(name,import.meta.url).href;
const SVGNS='http://www.w3.org/2000/svg';
function svg(paths,box='0 0 24 24'){
  const s=document.createElementNS(SVGNS,'svg');s.setAttribute('viewBox',box);s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
  for(const [tag,attrs] of paths){const n=document.createElementNS(SVGNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);s.append(n);}
  return s;
}
const ICON={
  prev:[['path',{d:'M6 5v14M19 5 9 12l10 7z'}]],
  next:[['path',{d:'M18 5v14M5 5l10 7-10 7z'}]],
  play:[['path',{d:'M7 4.5v15l12-7.5z'}]],
  pause:[['path',{d:'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'}]],
  shuffle:[['path',{d:'M3 7h3.5c2 0 3.2 1 4.3 2.8l2.4 4.4c1.1 1.8 2.3 2.8 4.3 2.8H21M17 4l4 3-4 3M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M13.8 8.4c.8-.9 1.8-1.4 3.2-1.4M17 14l4 3-4 3'}]],
  repeat:[['path',{d:'M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3'}]],
  add:[['path',{d:'M12 5v14M5 12h14'}]],
  remove:[['path',{d:'M6 6l12 12M18 6 6 18'}]]
};
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function button(text,fn,cls){const node=el('button',text,cls);node.type='button';node.addEventListener('click',fn);return node;}
function iconButton(icon,label,fn,cls){const b=button('',fn,cls);b.append(svg(ICON[icon]),el('span',label,'label'));return b;}
function setIcon(b,icon,label){b.querySelector('svg').replaceWith(svg(ICON[icon]));b.querySelector('.label').textContent=label;}
function live(){return !!audio&&!audio.paused&&!audio.ended&&!audio.error&&!buffering;}
function sync(){
  const playing=live(),pausable=!audio.paused&&!audio.ended&&!audio.error;dialog.setAttribute('data-playing',String(playing));
  setIcon(play,pausable?'pause':'play',pausable?'Pause':'Play');play.setAttribute('aria-pressed',String(pausable));
  const set=inList();play.disabled=!tracks.length;prev.disabled=next.disabled=set.length<2&&!(modes.repeat!=='off'&&set.length===1);title.textContent=selected?.title||'Choose a song';
  shuffleBtn.setAttribute('aria-pressed',String(modes.shuffle));
  repeatBtn.dataset.repeat=modes.repeat;repeatBtn.setAttribute('aria-pressed',String(modes.repeat!=='off'));repeatBtn.querySelector('.label').textContent=REPEAT_LABEL[modes.repeat];
  list.querySelectorAll('[data-track]').forEach(b=>{if(b.dataset.track===selected?.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  if(playing!==lastPlaying){lastPlaying=playing;window.dispatchEvent(new CustomEvent('dimau-shared-music-state',{detail:{playing}}));}
}
export function pause(){attempt++;if(audio){audio.pause();buffering=false;status.textContent=selected?'Paused · '+selected.title:'Choose a song to begin.';sync();}}
async function choose(index,{fromHistory=false}={}){
  const track=inList()[index];if(!track)return;
  if(!fromHistory&&selected&&selected.id!==track.id){history.push(selected.id);if(history.length>200)history.shift();}
  const run=++attempt;
  if(selected?.id!==track.id||!audio.getAttribute('src')||audio.error){audio.pause();selected=track;audio.src=track.url;}
  buffering=true;status.textContent='Loading · '+track.title;sync();
  try{await audio.play();if(run!==attempt)return;status.textContent=live()?'Playing · '+track.title:'Loading · '+track.title;sync();}
  catch(_){if(run===attempt){buffering=false;status.textContent='Could not play this song. Tap Play to retry, or choose another song.';sync();}}
}
function randomIndex(set){if(set.length<2)return 0;const at=set.findIndex(t=>t.id===selected?.id);let i;do{i=Math.floor(Math.random()*set.length);}while(i===at);return i;}
function move(delta){
  const set=inList();if(!set.length)return;const at=set.findIndex(t=>t.id===selected?.id);
  if(modes.shuffle){
    if(delta<0){while(history.length){const id=history.pop(),i=set.findIndex(t=>t.id===id);if(i>=0)return choose(i,{fromHistory:true});}return choose(at<0?0:at,{fromHistory:true});}
    return choose(randomIndex(set));
  }
  choose(at<0?0:(at+delta+set.length)%set.length);
}
function ended(){
  const set=inList(),at=set.findIndex(t=>t.id===selected?.id);
  if(modes.repeat==='one'&&selected){audio.currentTime=0;return choose(Math.max(0,at));}
  if(!set.length)return;
  if(modes.shuffle||modes.repeat==='all'||(at>=0&&at<set.length-1))return move(1);
  status.textContent='Finished'+(listName()?' · '+listName():'')+'. Press Play to start again.';sync();
}
function setMode(key,value){modes[key]=value;store.set(MODEKEY,modes);if(key==='shuffle')history=[];sync();}
function pickList(name){current=name;store.set(PICK,name);addFor=null;confirmDelete=false;renaming=false;render();list.scrollTop=0;}
function renderChips(){
  const names=playlists(tracks).filter(n=>n!==OTHER);
  const mixView=current===MIXES||!!mixOf(current);
  if(current!==ALL&&!mixView&&!names.includes(current))current=ALL;
  if(current.startsWith('mix:')&&!mixOf(current))current=MIXES;
  const counts=[[ALL,tracks.length],[MIXES,mixes.length],...names.map(n=>[n,tracks.filter(t=>t.playlist===n).length])],key=JSON.stringify(counts);
  if(key!==chipKey){
    // Rebuild only when the playlists themselves change, so a tap keeps the row's scroll position and keyboard focus.
    chipKey=key;chips.replaceChildren();chips.hidden=!tracks.length;
    for(const [name,n] of counts){const b=button('',()=>pickList(name===MIXES&&mixes.length?'mix:'+mixes[0].id:name),'chip'+(name===MIXES?' chip-mixes':''));b.dataset.playlist=name;b.append(el('span',name),el('span',String(n),'chip-count'));b.setAttribute('aria-label',name===MIXES?`${name}, ${n} mixes`:`${name}, ${n} songs`);chips.append(b);}
  }
  const active=mixView?MIXES:current,reveal=chipShown!==key+active;chipShown=key+active;
  for(const b of chips.querySelectorAll('.chip')){
    const on=b.dataset.playlist===active;b.setAttribute('aria-pressed',String(on));
    // Scroll only the playlist row sideways; never the whole music window.
    if(on&&reveal){const left=b.offsetLeft-chips.offsetLeft,right=left+b.offsetWidth;if(left<chips.scrollLeft)chips.scrollLeft=Math.max(0,left-8);else if(right>chips.scrollLeft+chips.clientWidth)chips.scrollLeft=right-chips.clientWidth+8;}
  }
}
function newMixForm(onDone,label='New mix'){
  const form=el('form',undefined,'mix-form'),input=el('input');input.type='text';input.maxLength=40;input.required=true;input.placeholder='Name your mix';input.setAttribute('aria-label','Mix name');input.value=`My mix ${mixes.length+1}`;
  const go=el('button',label,'primary');go.type='submit';form.append(input,go);
  function submit(){const name=input.value.trim().slice(0,40);if(!name)return;if(mixes.length>=50){status.textContent='You can keep up to 50 mixes.';return;}const mix={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,ids:[]};mixes.push(mix);saveMixes();onDone(mix);}
  form.addEventListener('submit',e=>{e.preventDefault();submit();});return form;
}
function renderMixbar(){
  const mix=mixOf(current),show=current===MIXES||!!mix;mixbar.hidden=!show;mixbar.replaceChildren();if(!show)return;
  if(!mixes.length){mixbar.append(el('p','Make your own mix of songs from any playlist. Your mixes are saved on this device.','hint'),newMixForm(m=>pickList('mix:'+m.id),'Create mix'));return;}
  const row=el('div',undefined,'mix-tabs');row.setAttribute('role','group');row.setAttribute('aria-label','Your mixes');
  for(const m of mixes){const b=button(m.name,()=>pickList('mix:'+m.id),'chip small');b.setAttribute('aria-pressed',String(mix?.id===m.id));row.append(b);}
  row.append(button('+ New mix',()=>{renaming=false;mixbar.querySelector('.mix-tools')?.replaceChildren(newMixForm(m=>pickList('mix:'+m.id),'Create mix'));mixbar.querySelector('.mix-tools input')?.focus();},'chip small ghost'));
  mixbar.append(row);
  const tools=el('div',undefined,'mix-tools');mixbar.append(tools);if(!mix)return;
  if(renaming){
    const form=el('form',undefined,'mix-form'),input=el('input');input.type='text';input.maxLength=40;input.value=mix.name;input.setAttribute('aria-label','New name for this mix');
    const save=el('button','Save name','primary');save.type='submit';form.append(input,save,button('Cancel',()=>{renaming=false;renderMixbar();}));
    form.addEventListener('submit',e=>{e.preventDefault();const name=input.value.trim().slice(0,40);if(name){mix.name=name;saveMixes();}renaming=false;render();});tools.append(form);return;
  }
  tools.append(el('span',mix.ids.length?`${mix.ids.length} song${mix.ids.length===1?'':'s'} · tap + on any song to add more`:'Empty mix · open any playlist and tap + on a song to add it here','hint'),
    button('Rename',()=>{renaming=true;renderMixbar();mixbar.querySelector('.mix-tools input')?.focus();}),
    button(confirmDelete?'Tap again to delete':'Delete mix',()=>{if(!confirmDelete){confirmDelete=true;renderMixbar();mixbar.querySelector('.danger')?.focus();return;}mixes=mixes.filter(m=>m.id!==mix.id);saveMixes();confirmDelete=false;pickList(mixes.length?'mix:'+mixes[0].id:MIXES);},'danger'));
}
function toggleInMix(mix,track){const i=mix.ids.indexOf(track.id);if(i>=0)mix.ids.splice(i,1);else if(mix.ids.length<500)mix.ids.push(track.id);saveMixes();}
function renderAdder(){
  adder.replaceChildren();adder.hidden=!addFor;if(!addFor)return;
  const head=el('div',undefined,'adder-head');head.append(el('strong',`Add “${addFor.title}” to a mix`),button('Done',()=>{const id=addFor.id;addFor=null;renderAdder();[...list.querySelectorAll('[data-add]')].find(b=>b.dataset.add===id)?.focus();}));adder.append(head);
  const row=el('div',undefined,'mix-tabs');
  for(const m of mixes){const inIt=m.ids.includes(addFor.id),b=button((inIt?'✓ ':'')+m.name,()=>{toggleInMix(m,addFor);chipKey='';renderChips();renderAdder();adder.querySelectorAll('.mix-tabs button')[mixes.indexOf(m)]?.focus();},'chip small');b.setAttribute('aria-pressed',String(inIt));row.append(b);}
  if(mixes.length)adder.append(row);
  adder.append(newMixForm(m=>{toggleInMix(m,addFor);chipKey='';renderChips();renderAdder();status.textContent=`Added to ${m.name}`;},mixes.length?'Add to new mix':'Create mix and add'));
}
function render(){
  renderChips();renderMixbar();renderAdder();list.replaceChildren();const query=search.value.trim().toLocaleLowerCase(),set=inList(),mix=mixOf(current);let shown=0;
  list.setAttribute('aria-label',current===ALL?'Shared library songs':listName()+' songs');
  set.forEach((track,index)=>{
    if(query&&!track.title.toLocaleLowerCase().includes(query))return;shown++;
    const row=el('li'),pick=button('',()=>choose(index));pick.dataset.track=track.id;pick.append(el('span',String(index+1).padStart(2,'0'),'number'),el('span',track.title));pick.setAttribute('aria-label','Play '+track.title);row.append(pick);
    const extra=mix?iconButton('remove','Remove',()=>{toggleInMix(mix,track);chipKey='';render();},'row-action'):iconButton('add','Add to mix',()=>{addFor=track;confirmDelete=false;renderAdder();adder.querySelector('input,button')?.focus();},'row-action');
    extra.setAttribute('aria-label',mix?`Remove ${track.title} from ${mix.name}`:`Add ${track.title} to a mix`);extra.dataset.add=track.id;row.append(extra);list.append(row);
  });
  if(!shown&&set.length)list.append(el('li','No songs match your search.','empty'));
  const label=current===ALL?'':` in ${listName()}`;
  const songs=n=>`${n} song${n===1?'':'s'}`;
  count.textContent=current===MIXES?'':query?`${shown} of ${songs(set.length)}${label}`:`${songs(set.length)}${label}`;sync();
}
async function load(force=false){
  const run=++loading;retry.disabled=true;status.textContent='Connecting to the shared library…';
  try{const result=await loadCatalogue({force});if(run!==loading)return;tracks=result.tracks;chipKey='';render();status.textContent=result.stale?'Saved catalogue · Connection unavailable. Music needs an internet connection.':selected?(live()?'Playing · ':'Selected · ')+selected.title:'Choose a song to begin. Music starts only when you press Play.';retry.hidden=!result.stale;}
  catch(_){if(run!==loading)return;status.textContent='The shared music library could not connect. Try again when your signal returns.';if(!tracks.length)count.textContent='Songs unavailable';retry.hidden=false;sync();}
  finally{if(run===loading)retry.disabled=false;}
}
function close(){if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');dialog.dispatchEvent(new Event('close'));}}
function create(){
  const host=el('div');host.setAttribute('data-dimau-shared-music-host','');shadow=host.attachShadow({mode:'open'});
  const css=el('link');css.rel='stylesheet';css.href=asset('player.css');shadow.append(css);
  dialog=el('dialog');dialog.setAttribute('aria-labelledby','dsm-title');dialog.setAttribute('aria-modal','true');
  const box=el('div',undefined,'player'),head=el('header'),heading=el('h2','Your shared music');heading.id='dsm-title';const quit=button('×',close,'close');quit.setAttribute('aria-label','Close music library');head.append(heading,quit);
  // The flag turns while music plays; the music note on top stays still.
  const hero=el('section',undefined,'hero'),mark=el('span',undefined,'badge');badge=el('img');badge.src=asset('badge.svg');badge.alt='';badge.width=72;badge.height=72;
  mark.append(badge,svg([['circle',{cx:'22',cy:'22',r:'11.5',fill:'#fff'}],['path',{d:'M19.3 27V17.8l7.4-1.4v8.9',fill:'none',stroke:'#000080','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round'}],['circle',{cx:'17.3',cy:'27',r:'2',fill:'none',stroke:'#000080','stroke-width':'1.5'}],['circle',{cx:'24.7',cy:'25.7',r:'2',fill:'none',stroke:'#000080','stroke-width':'1.5'}]],'0 0 44 44'));
  mark.lastChild.classList.add('note');title=el('strong','Choose a song');hero.append(mark,title);
  audio=el('audio');audio.controls=true;audio.crossOrigin='anonymous';audio.preload='none';audio.setAttribute('aria-label','Shared music audio');audio.setAttribute('data-dimau-shared-music-audio','');
  const transport=el('div',undefined,'transport');transport.setAttribute('role','group');transport.setAttribute('aria-label','Music playback');
  prev=iconButton('prev','Previous',()=>move(-1));play=iconButton('play','Play',()=>!audio.paused&&!audio.ended?pause():choose(Math.max(0,inList().findIndex(t=>t.id===selected?.id))));next=iconButton('next','Next',()=>move(1));transport.append(prev,play,next);
  const modeRow=el('div',undefined,'modes');modeRow.setAttribute('role','group');modeRow.setAttribute('aria-label','Play order');
  shuffleBtn=iconButton('shuffle','Shuffle',()=>setMode('shuffle',!modes.shuffle),'mode');repeatBtn=iconButton('repeat','Repeat off',()=>setMode('repeat',REPEATS[(REPEATS.indexOf(modes.repeat)+1)%3]),'mode');modeRow.append(shuffleBtn,repeatBtn);
  status=el('p','Connecting to the shared library…','status');status.setAttribute('role','status');retry=button('Retry library',()=>load(true),'retry');retry.hidden=true;
  chips=el('div',undefined,'chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Playlists');chips.hidden=true;
  mixbar=el('div',undefined,'mixbar');mixbar.hidden=true;adder=el('div',undefined,'adder');adder.setAttribute('role','group');adder.setAttribute('aria-label','Add to a mix');adder.hidden=true;
  const label=el('label','Find your next favourite');label.htmlFor='dsm-search';search=el('input');search.id='dsm-search';search.type='search';search.placeholder='Search songs or artists';search.maxLength=120;search.addEventListener('input',render);
  count=el('p','Loading songs…','count');list=el('ol');list.setAttribute('aria-label','Shared library songs');
  box.append(head,hero,audio,transport,modeRow,status,retry,chips,mixbar,adder,label,search,count,list);dialog.append(box);shadow.append(dialog);document.body.append(host);
  audio.addEventListener('play',()=>{buffering=true;sync();});audio.addEventListener('playing',()=>{buffering=false;status.textContent='Playing · '+(selected?.title||'music');sync();});
  for(const event of ['pause','emptied'])audio.addEventListener(event,()=>{buffering=false;if(selected)status.textContent='Paused · '+selected.title;sync();});
  audio.addEventListener('ended',()=>{buffering=false;sync();ended();});
  audio.addEventListener('waiting',()=>{buffering=true;if(selected)status.textContent='Buffering · '+selected.title;sync();});
  audio.addEventListener('stalled',()=>{if(audio.readyState<3){buffering=true;if(selected)status.textContent='Buffering · '+selected.title;}sync();});
  audio.addEventListener('error',()=>{buffering=false;status.textContent='This song could not load. Tap Play to retry, or choose another song.';sync();});
  document.addEventListener('play',event=>{if(event.target!==audio&&['AUDIO','VIDEO'].includes(event.target?.tagName)){pause();}},true);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(!dialog.open&&origin?.isConnected)origin.focus({preventScroll:true});});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}if(event.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,input,audio')].filter(n=>!n.disabled&&!n.hidden&&!n.closest('[hidden]')),first=nodes[0],last=nodes.at(-1),focused=shadow.activeElement;if(event.shiftKey&&focused===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&focused===last){event.preventDefault();first.focus();}}});
  sync();
}
export function open({opener=document.activeElement}={}){
  if(!dialog)create();if(dialog.open)return;
  origin=opener;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');dialog.querySelector('.close').focus();load();
}
