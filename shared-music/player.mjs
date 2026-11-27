import {loadCatalogue,playlists,ALL,OTHER} from './core.mjs';
// Shared music player: playlists, the listener's own mixes (on this device, and in their Dimau account once signed in), shuffle and repeat.
let dialog,audio,shadow,status,list,search,count,title,play,prev,next,retry,badge,origin,chips,mixbar,adder,shuffleBtn,repeatBtn;
let picker,clearSearch,queueContext,jumpToSong,upNext;
let tracks=[],selected=null,loading=0,attempt=0,buffering=false,lastPlaying=false,current=ALL,history=[],chipKey='',chipShown='',addFor=null,confirmDelete=false,renaming=false;
let queue=null;
const MIXES='My mixes',PICK='dimau.shared-music.playlist',MIXKEY='dimau.shared-music.mixes',MODEKEY='dimau.shared-music.modes';
const REPEATS=['off','all','one'],REPEAT_LABEL={off:'Repeat off',all:'Repeat all',one:'Repeat one'};
const store={get(key,fallback){try{const v=JSON.parse(globalThis.localStorage.getItem(key));return v??fallback;}catch(_){return fallback;}},set(key,value){try{globalThis.localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));}catch(_){}}};
try{current=globalThis.localStorage.getItem(PICK)||ALL;}catch(_){}
let modes=(()=>{const m=store.get(MODEKEY,{});return{shuffle:m.shuffle===true,repeat:REPEATS.includes(m.repeat)?m.repeat:'off'};})();
let mixes=cleanMixes(store.get(MIXKEY,[]));
function cleanMixes(value){
  if(!Array.isArray(value))return[];
  return value.filter(m=>m&&typeof m.id==='string'&&/^[a-z0-9-]{1,40}$/.test(m.id)&&typeof m.name==='string'&&m.name.trim()).slice(0,50)
    .map(m=>({id:m.id,name:m.name.trim().slice(0,40),ids:[...new Set((Array.isArray(m.ids)?m.ids:[]).filter(id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)))].slice(0,500),updated:Number.isFinite(m.updated)?m.updated:0}));
}
// Dimau account sync (22 Nov 2026). The music window keeps its own Dimau session (email + 6-digit code), separate from
// the site's sign-in, so the two never refresh each other's tokens. Mixes are rows in public.dimau_music_mixes (own rows only).
const SB='https://xnxmumbvgtmlpenutlii.supabase.co',SBKEY='sb_publishable_WFJ3jKwImNhGdTdrS9W6mg_3CUSUYIM',SESSION='dimau.shared-music.session',GONE='dimau.shared-music.mixes-deleted';
let session=cleanSession(store.get(SESSION,null)),gone=cleanGone(store.get(GONE,[])),acct={stage:'idle',email:'',note:''},syncTimer=0,syncRun=null,syncAgain=false,accountBox=null;
function cleanSession(v){return v&&typeof v.access==='string'&&typeof v.refresh==='string'&&Number.isFinite(v.exp)?{access:v.access,refresh:v.refresh,exp:v.exp,email:typeof v.email==='string'?v.email:''}:null;}
function cleanGone(v){return Array.isArray(v)?v.filter(g=>g&&typeof g.id==='string'&&/^[a-z0-9-]{1,40}$/.test(g.id)&&Number.isFinite(g.updated)).slice(-200).map(g=>({id:g.id,name:String(g.name||'Deleted mix').slice(0,40)||'Deleted mix',updated:g.updated})):[];}
// Every change stamps the mix and, when signed in, saves it to the account a moment later.
function saveMixes(changed){if(changed)changed.updated=Date.now();store.set(MIXKEY,mixes);store.set(GONE,gone);schedulePush();}
function forgetMix(mix){gone=gone.filter(g=>g.id!==mix.id);gone.push({id:mix.id,name:mix.name,updated:Date.now()});mixes=mixes.filter(m=>m.id!==mix.id);saveMixes();}
function schedulePush(){if(!session)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncMixes(),1200);}
async function authCall(path,body){
  const r=await globalThis.fetch(SB+'/auth/v1/'+path,{method:'POST',credentials:'omit',headers:{apikey:SBKEY,'content-type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const m=String(j.msg||j.error_description||j.message||'');throw Error(/expired|invalid/i.test(m)?'That code is wrong or has expired. Ask for a new one.':/rate|many/i.test(m)?'Too many tries just now. Wait a minute and try again.':'Sign-in did not work. Check your connection and try again.');}
  return j;
}
function keepSession(j){if(!j?.access_token||!j?.refresh_token)throw Error('Sign-in did not work. Try again.');session={access:j.access_token,refresh:j.refresh_token,exp:Math.floor(Date.now()/1000)+(Number(j.expires_in)||3600),email:j.user?.email||session?.email||acct.email||''};store.set(SESSION,session);}
function signOut(note=''){session=null;try{globalThis.localStorage.removeItem(SESSION);}catch(_){}acct={stage:'idle',email:'',note};renderAccount();}
async function accessToken(){
  if(!session)return null;
  if(session.exp-60>Date.now()/1000)return session.access;
  try{keepSession(await authCall('token?grant_type=refresh_token',{refresh_token:session.refresh}));return session.access;}
  catch(_){signOut('Your sign-in ended. Sign in again to keep your mixes in sync.');return null;}
}
async function rest(method,query,body,prefer){
  const t=await accessToken();if(!t)throw Error('signed-out');
  const headers={apikey:SBKEY,authorization:'Bearer '+t,'content-type':'application/json'};if(prefer)headers.prefer=prefer;
  const r=await globalThis.fetch(SB+'/rest/v1/dimau_music_mixes'+query,{method,credentials:'omit',headers,body:body?JSON.stringify(body):undefined});
  if(r.status===401){signOut('Your sign-in ended. Sign in again to keep your mixes in sync.');throw Error('signed-out');}
  if(!r.ok)throw Error('sync '+r.status);
  if(method!=='GET')return null;
  return r.json();
}
const asRow=(m,deleted=false)=>({mix_id:m.id,name:m.name,track_ids:deleted?[]:m.ids,deleted,updated_at:new Date(m.updated||0).toISOString()});
// Merge this device's mixes with the account: for each mix the newer change wins; deletions travel as tombstones.
export function mergeMixes(local,deletedHere,remoteRows){
  const remote=new Map();
  for(const r of remoteRows||[])if(r&&typeof r.mix_id==='string')remote.set(r.mix_id,{id:r.mix_id,name:String(r.name||'').slice(0,40),ids:Array.isArray(r.track_ids)?r.track_ids:[],deleted:r.deleted===true,updated:Date.parse(r.updated_at)||0});
  const here=new Map(local.map(m=>[m.id,m])),dead=new Map(deletedHere.map(g=>[g.id,g]));
  const keep=[],push=[];
  for(const id of new Set([...here.keys(),...dead.keys(),...remote.keys()])){
    const L=here.get(id),G=dead.get(id),R=remote.get(id),mine=L?L.updated:G?G.updated:-1;
    if(!R){if(L){keep.push(L);push.push(asRow(L));}continue;}
    if(R.updated>mine){if(!R.deleted)keep.push({id,name:R.name||'My mix',ids:R.ids,updated:R.updated});continue;}
    if(R.updated<mine){if(L){keep.push(L);push.push(asRow(L));}else if(!R.deleted)push.push(asRow(G,true));continue;}
    if(L&&!R.deleted)keep.push(L);
  }
  const order=new Map(local.map((m,i)=>[m.id,i])),rank=m=>order.has(m.id)?order.get(m.id):1e6-m.updated/1e13;
  keep.sort((a,b)=>rank(a)-rank(b));
  return{mixes:cleanMixes(keep),push};
}
async function syncMixes(){
  if(!session)return;
  if(syncRun){syncAgain=true;return syncRun;}
  syncRun=(async()=>{
    acct.note='Saving to your Dimau account…';renderAccount();
    try{
      const rows=await rest('GET','?select=mix_id,name,track_ids,deleted,updated_at');
      const merged=mergeMixes(mixes,gone,rows);
      if(merged.push.length)await rest('POST','?on_conflict=user_id,mix_id',merged.push,'resolution=merge-duplicates,return=minimal');
      const before=JSON.stringify(mixes);mixes=merged.mixes;gone=[];store.set(MIXKEY,mixes);store.set(GONE,gone);
      acct.note='Saved to your Dimau account';
      if(dialog&&JSON.stringify(mixes)!==before){if(current===MIXES&&mixes.length)current='mix:'+mixes[0].id;chipKey='';render();}
    }catch(e){if(e.message!=='signed-out')acct.note='Could not reach your Dimau account. Your mixes are safe on this device and will sync next time.';}
    finally{syncRun=null;renderAccount();if(syncAgain){syncAgain=false;syncMixes();}}
  })();
  return syncRun;
}
// The sign-in panel inside My mixes: email, then the 6-digit code from the Dimau sign-in email.
const sessionLineIndexes = new Map();
  function nextSessionLine(bucket, lines, appName) {
    const key = 'dimau.session-lines.v2.' + appName + '.' + bucket;
    let index = sessionLineIndexes.get(key) || 0;
    try {
      const stored = Number(localStorage.getItem(key));
      if (Number.isSafeInteger(stored) && stored >= 0 && localStorage.getItem(key) !== null) index = stored;
    } catch (_) {}
    const next = (index + 1) % lines.length;
    sessionLineIndexes.set(key, next);
    try { localStorage.setItem(key, String(next)); } catch (_) {}
    return lines[index % lines.length];
  }
  function playfulFarewell(appName, hour = new Date().getHours(), workSaved = false) {
    const lines = [
      'Logged out. Off to pretend that you did some hard work and need a break. 🌿',
      workSaved ? 'Session closed. Your work is saved; your excuses are getting better. 🚶' : 'Session closed. Your excuses are getting better. 🚶',
      'Signed out. The server is going to lie down and recover for a bit. 🛌',
      'Logging off. Whatever you just did, we all saw it. 🤐',
      'Session ended. Go forth and ignore important things elsewhere. 👀',
      "Out for now. Don't worry, we didn't complain while we did all the work for you. 🔋",
      "Logged out. You're free—until you start getting bored and nosey again. 🔔",
      'Session closed. Go drink some water. I never said grog or beer. 💧'
    ];
    if (hour < 5) lines.push('It’s past midnight. Are we going to pretend to do some real work now? 🌙');
    if (hour < 5 || hour >= 22) {
      lines.push('Logging out late. Go to sleep before your eyes start looking like you drank grog all night. 🛌');
      return nextSessionLine(hour < 5 ? 'after-midnight' : 'evening', lines, appName);
    }
    return nextSessionLine('day', lines, appName);
  }
  function arrivalAside(appName, hour = new Date().getHours()) {
    const lines = ['', 'Signed in. You again. We were just planning to escape from you. 🫠',
      '', "Authenticated. Somehow we're still doing this. Give us a break. ⚙️"];
    if (hour >= 22 || hour < 5) {
      lines.push('Signed in late. Brave of you to trust your judgment at this hour. 🫠');
      return nextSessionLine('night-arrival', lines, appName);
    }
    return nextSessionLine('day-arrival', lines, appName);
  }

function renderAccount(){
  if(!accountBox)return;
  accountBox.replaceChildren();
  if(session){
    const line=el('p',undefined,'hint');line.append(el('strong','Synced to your Dimau account'),document.createTextNode(session.email?' · '+session.email:''));
    accountBox.append(line);
    if(acct.note)accountBox.append(el('p',acct.note,'account-note'));
    const leave = button('Sign out of music sync', () => {
      const cancel = button('Cancel', () => {
        renderAccount();
        accountBox.querySelector('button')?.focus();
      }, 'ghost-link');
      const confirm = button('Sign out', () => {
        signOut(playfulFarewell('Dimau Music') + ' Your mixes stay on this device.');
      }, 'ghost-link');
      const question = el('p', 'Sign out of music sync? Your mixes stay on this device.', 'hint');
      accountBox.replaceChildren(question, cancel, confirm);
      cancel.focus();
    }, 'ghost-link');
    accountBox.append(leave);
    return;
  }
  if(acct.stage==='idle'){
    accountBox.append(el('p','Sign in with your Dimau account to keep your mixes on every Dimau app and device.','hint'));
    if(acct.note)accountBox.append(el('p',acct.note,'account-note'));
    accountBox.append(button('Sign in to sync',()=>{acct={stage:'email',email:'',note:''};renderAccount();accountBox.querySelector('input')?.focus();},'primary'));
    return;
  }
  const form=el('form',undefined,'mix-form account-form'),input=el('input'),go=el('button',undefined,'primary');go.type='submit';
  if(acct.stage==='email'){
    input.type='email';input.autocomplete='email';input.required=true;input.maxLength=254;input.placeholder='you@example.com';input.setAttribute('aria-label','Email for your Dimau account');input.value=acct.email;go.textContent='Send code';
  }else{
    input.type='text';input.inputMode='numeric';input.autocomplete='one-time-code';input.required=true;input.maxLength=6;input.pattern='[0-9]{6}';input.placeholder='123456';input.setAttribute('aria-label','6-digit code from the email');go.textContent='Sign in';
  }
  form.append(input,go,button('Cancel',()=>{acct={stage:'idle',email:'',note:''};renderAccount();}));
  if(acct.stage==='code')accountBox.append(el('p',`We sent a 6-digit code to ${acct.email}. Type it here.`,'hint'));
  accountBox.append(form);
  if(acct.note)accountBox.append(el('p',acct.note,'account-note'));
  form.addEventListener('submit',async e=>{
    e.preventDefault();const value=input.value.trim();go.disabled=true;
    try{
      if(acct.stage==='email'){
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw Error('Type a full email address.');
        await authCall('otp',{email:value,create_user:true,data:{app:'shared-music'}});acct={stage:'code',email:value,note:''};
      }else{
        if(!/^\d{6}$/.test(value))throw Error('The code is 6 numbers.');
        keepSession(await authCall('verify',{type:'email',email:acct.email,token:value}));acct={stage:'idle',email:'',note:''};
        status.textContent=(arrivalAside('Dimau Music') || 'Bula! It’s good to see you.') + ' Music sync is on.';syncMixes();
      }
    }catch(err){acct.note=err.message;}
    renderAccount();accountBox.querySelector('input')?.focus();
  });
}
const mixOf=key=>key?.startsWith('mix:')?mixes.find(m=>'mix:'+m.id===key):null;
const byId=id=>tracks.find(t=>t.id===id);
function inList(name=current){
  if(name===ALL)return tracks;
  if(name===MIXES)return[];
  const mix=mixOf(name);if(mix)return mix.ids.map(byId).filter(Boolean);
  return tracks.filter(t=>t.playlist===name);
}
const listName=(name=current)=>name===ALL?'':mixOf(name)?.name||name;
const playbackList=()=>queue?.startsWith('mix:')&&!mixOf(queue)?ALL:queue||current;
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

function createUpNext({el,button,available,changed}) {
  let scheduled=null,edited=false,painted='';
  const key=track=>track.key||track.id;
  const items=()=>scheduled??available();
  const box=el('section',undefined,'up-next');
  const heading=el('h3',undefined,'up-next-heading');
  const toggle=button('',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));refresh();},'up-next-toggle');
  const preview=el('span',undefined,'up-next-preview');
  toggle.append(el('span','Up Next'),preview);
  heading.append(toggle);
  const panel=el('div',undefined,'up-next-panel');
  const list=el('ol',undefined,'up-next-list');
  list.setAttribute('aria-label','Upcoming songs');
  const empty=el('p','No songs are queued. Use Play Next on a song to add it.','up-next-empty');
  const announcement=el('span',undefined,'up-next-announcement');
  announcement.setAttribute('role','status');
  panel.id='music-up-next';
  panel.hidden=true;
  toggle.setAttribute('aria-controls',panel.id);
  toggle.setAttribute('aria-expanded','false');
  panel.append(list,empty);
  box.append(heading,panel,announcement);

  function refresh() {
    const songs=items();
    preview.textContent=songs.length?'· '+songs[0].title:'· Empty';
    if(panel.hidden)return;
    const signature=JSON.stringify(songs.map(track=>[key(track),track.title]));
    if(signature===painted)return;
    painted=signature;
    empty.hidden=!!songs.length;
    list.hidden=!songs.length;
    list.replaceChildren(...songs.map((track,index)=>{
      const row=el('li',undefined,'up-next-track');
      row.dataset.queueTrack=key(track);
      row.append(el('span',track.title,'up-next-song'));
      const actions=el('div',undefined,'up-next-actions');
      const reorder=(label,mark,delta)=>{
        const control=button(mark,()=>move(track,delta),'up-next-move');
        control.dataset.direction=String(delta);
        control.setAttribute('aria-label','Move '+track.title+' '+label);
        control.title='Move '+label;
        control.disabled=index+delta<0||index+delta>=songs.length;
        return control;
      };
      actions.append(reorder('up','↑',-1),reorder('down','↓',1));
      row.append(actions);
      return row;
    }));
  }
  function move(track,delta) {
    const order=[...items()];
    const index=order.findIndex(song=>key(song)===key(track));
    const destination=index+delta;
    if(index<0||destination<0||destination>=order.length)return;
    [order[index],order[destination]]=[order[destination],order[index]];
    scheduled=order;
    edited=true;
    announcement.textContent=track.title+' moved to position '+(destination+1)+'.';
    changed();
    const row=list.children[destination];
    const controls=[...row.querySelectorAll('button')];
    const target=controls.find(control=>control.dataset.direction===String(delta)&&!control.disabled)||controls.find(control=>!control.disabled);
    target?.focus();
  }
  function promote(track) {
    scheduled=[track,...items().filter(song=>key(song)!==key(track))];
    edited=true;
    announcement.textContent=track.title+' will play next.';
    changed();
  }

  return {
    box,refresh,items,
    edited:()=>edited,
    reset(order=null){scheduled=order;edited=false;},
    take(){scheduled=[...items()];return scheduled.shift();},
    restore(track){scheduled=[track,...items().filter(song=>key(song)!==key(track))];},
    remove(track){scheduled=items().filter(song=>key(song)!==key(track));},
    promote,
    action(track){
      const control=button('Play Next',()=>promote(track),'up-next-add');
      control.setAttribute('aria-label','Play Next: '+track.title);
      return control;
    }
  };
}

function upcomingOrder(tracks, selected, shuffle, wraps) {
  const key=track=>track?.key||track?.id;
  const index=tracks.findIndex(track=>key(track)===key(selected));
  if(shuffle&&index>=0){
    const shuffled=tracks.filter((_,i)=>i!==index);
    for(let i=shuffled.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }
    return shuffled;
  }
  if(wraps&&index>=0)return tracks.slice(index+1).concat(tracks.slice(0,index));
  return tracks.slice(index+1);
}

function live(){return !!audio&&!audio.paused&&!audio.ended&&!audio.error&&!buffering;}
function sync(){
  const playing=live(),pausable=!audio.paused&&!audio.ended&&!audio.error;dialog.setAttribute('data-playing',String(playing));
  setIcon(play,pausable?'pause':'play',pausable?'Pause':'Play');play.setAttribute('aria-pressed',String(pausable));
  const set=inList(playbackList());
  const planned=upNext.items();
  play.disabled=!selected&&!set.length&&!planned.length;
  prev.disabled=!history.length&&set.length<2&&!(modes.repeat!=='off'&&set.length===1);
  next.disabled=!planned.length&&set.length<2&&!(modes.repeat!=='off'&&set.length===1);
  upNext.refresh();
  title.textContent=selected?.title||'Choose a song';
  queueContext.hidden=jumpToSong.hidden=!selected;
  queueContext.textContent=selected?(listName(playbackList())||ALL):'';
  shuffleBtn.setAttribute('aria-pressed',String(modes.shuffle));
  repeatBtn.dataset.repeat=modes.repeat;repeatBtn.setAttribute('aria-pressed',String(modes.repeat!=='off'));repeatBtn.querySelector('.label').textContent=REPEAT_LABEL[modes.repeat];
  list.querySelectorAll('[data-track]').forEach(b=>{if(b.dataset.track===selected?.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  if(playing!==lastPlaying){lastPlaying=playing;window.dispatchEvent(new CustomEvent('dimau-shared-music-state',{detail:{playing}}));}
}
export function pause(){attempt++;if(audio){audio.pause();buffering=false;status.textContent=selected?'Paused · '+selected.title:'Choose a song to begin.';sync();}}
function choose(index){
  const set=inList(),track=set[index];
  if(!track)return;
  const samePlaylist=queue===current;
  if(!samePlaylist)history=[];
  if(upNext.edited())upNext.remove(track);
  else upNext.reset(upcomingOrder(set,track,modes.shuffle,modes.repeat==='all'));
  return playTrack(track,current,!samePlaylist);
}

async function playTrack(track,from,fromHistory=false){
  if(!track)return;
  queue=from;
  if(!fromHistory&&selected&&selected.id!==track.id){history.push(selected);if(history.length>200)history.shift();}
  const run=++attempt;
  if(selected?.id!==track.id||!audio.getAttribute('src')||audio.error){audio.pause();selected=track;audio.src=track.url;}
  buffering=true;status.textContent='Loading · '+track.title;sync();
  try{await audio.play();if(run!==attempt)return;status.textContent=live()?'Playing · '+track.title:'Loading · '+track.title;sync();}
  catch(_){if(run===attempt){buffering=false;status.textContent='Could not play this song. Tap Play to retry, or choose another song.';sync();}}
}
function move(delta,automatic=false){
  const from=playbackList(),set=inList(from),at=set.findIndex(track=>track.id===selected?.id);
  if(delta<0&&history.length){
    const previous=history.pop();
    if(selected)upNext.restore(selected);
    return playTrack(previous,from,true);
  }
  if(delta>0){
    let upcoming=upNext.take();
    if(!upcoming&&(modes.shuffle||modes.repeat==='all')){
      upNext.reset(upcomingOrder(set,selected,modes.shuffle,true));
      upcoming=upNext.take()||set[0];
    }
    if(upcoming){
      if(upcoming.id===selected?.id)audio.currentTime=0;
      return playTrack(upcoming,from);
    }
    if(automatic){status.textContent='Finished'+(listName(from)?' · '+listName(from):'')+'. Press Play to start again.';sync();return;}
  }
  if(!set.length)return;
  const track=set[at<0?0:(at+delta+set.length)%set.length];
  upNext.reset(upcomingOrder(set,track,modes.shuffle,modes.repeat==='all'));
  return playTrack(track,from);
}
function ended(){
  if(modes.repeat==='one'&&selected){audio.currentTime=0;return playTrack(selected,playbackList(),true);}
  return move(1,true);
}
function setMode(key,value){
  modes[key]=value;store.set(MODEKEY,modes);
  if(selected&&!upNext.edited())upNext.reset(upcomingOrder(inList(playbackList()),selected,modes.shuffle,modes.repeat==='all'));
  sync();
}
function pickList(name){
  if(name!==current)search.value='';
  current=name;
  store.set(PICK,name);
  addFor=null;
  confirmDelete=false;
  renaming=false;
  render();
  list.scrollTop=0;
}
function openPlaylist(name){pickList(name===MIXES&&mixes.length?'mix:'+mixes[0].id:name);}
function showCurrentSong(){
  if(!selected)return;
  const from=playbackList();
  search.value='';
  pickList(inList(from).some(track=>track.id===selected.id)?from:ALL);
  const row=list.querySelector('[aria-current=true]');
  if(!row)return;
  list.scrollTop+=row.getBoundingClientRect().top-list.getBoundingClientRect().top;
  row.focus({preventScroll:true});
}
function renderChips(){
  const names=playlists(tracks).filter(n=>n!==OTHER);
  const mixView=current===MIXES||!!mixOf(current);
  if(current!==ALL&&!mixView&&!names.includes(current))current=ALL;
  if(current.startsWith('mix:')&&!mixOf(current))current=MIXES;
  const counts=[[ALL,tracks.length],[MIXES,mixes.length],...names.map(n=>[n,tracks.filter(t=>t.playlist===n).length])],key=JSON.stringify(counts);
  if(key!==chipKey){
    // Rebuild only when the playlists themselves change, so a tap keeps the row's scroll position and keyboard focus.
    chipKey=key;chips.replaceChildren();chips.hidden=!tracks.length;
    picker.replaceChildren();
    picker.disabled=!tracks.length;
    for(const [name,n] of counts){
      const unit=name===MIXES?'mixes':'songs';
      const b=button('',()=>openPlaylist(name),'chip'+(name===MIXES?' chip-mixes':''));
      b.dataset.playlist=name;
      b.append(el('span',name),el('span',String(n),'chip-count'));
      b.setAttribute('aria-label',`${name}, ${n} ${unit}`);
      chips.append(b);
      const option=el('option',`${name} · ${n} ${unit}`);
      option.value=name;
      picker.append(option);
    }
  }
  const active=mixView?MIXES:current,reveal=chipShown!==key+active;chipShown=key+active;
  picker.value=active;
  for(const b of chips.querySelectorAll('.chip')){
    const on=b.dataset.playlist===active;b.setAttribute('aria-pressed',String(on));
    if(on&&reveal&&chips.clientHeight){
      const top=b.getBoundingClientRect().top-chips.getBoundingClientRect().top;
      if(top<0)chips.scrollTop+=top-4;
      else if(top+b.offsetHeight>chips.clientHeight)chips.scrollTop+=top+b.offsetHeight-chips.clientHeight+4;
    }
  }
}
function newMixForm(onDone,label='New mix'){
  const form=el('form',undefined,'mix-form'),input=el('input');input.type='text';input.maxLength=40;input.required=true;input.placeholder='Name your mix';input.setAttribute('aria-label','Mix name');input.value=`My mix ${mixes.length+1}`;
  const go=el('button',label,'primary');go.type='submit';form.append(input,go);
  function submit(){const name=input.value.trim().slice(0,40);if(!name)return;if(mixes.length>=50){status.textContent='You can keep up to 50 mixes.';return;}const mix={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,ids:[],updated:0};mixes.push(mix);saveMixes(mix);onDone(mix);}
  form.addEventListener('submit',e=>{e.preventDefault();submit();});return form;
}
function renderMixbar(){
  const mix=mixOf(current),show=current===MIXES||!!mix;mixbar.hidden=!show;mixbar.replaceChildren();if(!show)return;
  accountBox=el('div',undefined,'account');accountBox.setAttribute('aria-live','polite');mixbar.append(accountBox);renderAccount();
  if(!mixes.length){mixbar.append(el('p','Make your own mix of songs from any playlist. Your mixes are saved on this device, and in your Dimau account when you sign in.','hint'),newMixForm(m=>pickList('mix:'+m.id),'Create mix'));return;}
  const row=el('div',undefined,'mix-tabs');row.setAttribute('role','group');row.setAttribute('aria-label','Your mixes');
  for(const m of mixes){const b=button(m.name,()=>pickList('mix:'+m.id),'chip small');b.setAttribute('aria-pressed',String(mix?.id===m.id));row.append(b);}
  row.append(button('+ New mix',()=>{renaming=false;mixbar.querySelector('.mix-tools')?.replaceChildren(newMixForm(m=>pickList('mix:'+m.id),'Create mix'));mixbar.querySelector('.mix-tools input')?.focus();},'chip small ghost'));
  mixbar.append(row);
  const tools=el('div',undefined,'mix-tools');mixbar.append(tools);if(!mix)return;
  if(renaming){
    const form=el('form',undefined,'mix-form'),input=el('input');input.type='text';input.maxLength=40;input.value=mix.name;input.setAttribute('aria-label','New name for this mix');
    const save=el('button','Save name','primary');save.type='submit';form.append(input,save,button('Cancel',()=>{renaming=false;renderMixbar();}));
    form.addEventListener('submit',e=>{e.preventDefault();const name=input.value.trim().slice(0,40);if(name){mix.name=name;saveMixes(mix);}renaming=false;render();});tools.append(form);return;
  }
  tools.append(el('span',mix.ids.length?`${mix.ids.length} song${mix.ids.length===1?'':'s'} · tap + on any song to add more`:'Empty mix · open any playlist and tap + on a song to add it here','hint'),
    button('Rename',()=>{renaming=true;renderMixbar();mixbar.querySelector('.mix-tools input')?.focus();}),
    button(confirmDelete?'Tap again to delete':'Delete mix',()=>{if(!confirmDelete){confirmDelete=true;renderMixbar();mixbar.querySelector('.danger')?.focus();return;}forgetMix(mix);confirmDelete=false;pickList(mixes.length?'mix:'+mixes[0].id:MIXES);},'danger'));
}
function toggleInMix(mix,track){const i=mix.ids.indexOf(track.id);if(i>=0)mix.ids.splice(i,1);else if(mix.ids.length<500)mix.ids.push(track.id);saveMixes(mix);}
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
  clearSearch.hidden=!search.value;
  list.setAttribute('aria-label',current===ALL?'Shared library songs':listName()+' songs');
  set.forEach((track,index)=>{
    if(query&&!track.title.toLocaleLowerCase().includes(query))return;shown++;
    const row=el('li'),pick=button('',()=>choose(index));pick.dataset.track=track.id;pick.append(el('span',String(index+1).padStart(2,'0'),'number'),el('span',track.title));pick.setAttribute('aria-label','Play '+track.title);row.append(pick);
    const extra=mix?iconButton('remove','Remove',()=>{toggleInMix(mix,track);chipKey='';render();},'row-action'):iconButton('add','Add to mix',()=>{addFor=track;confirmDelete=false;renderAdder();adder.querySelector('input,button')?.focus();},'row-action');
    extra.setAttribute('aria-label',mix?`Remove ${track.title} from ${mix.name}`:`Add ${track.title} to a mix`);extra.dataset.add=track.id;row.append(upNext.action(track),extra);list.append(row);
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
  mark.lastChild.classList.add('note');
  const songInfo=el('div',undefined,'song-info');
  title=el('strong','Choose a song');
  queueContext=el('p',undefined,'queue-context');
  jumpToSong=button('Go to song',showCurrentSong,'jump-to-song');
  songInfo.append(title,queueContext);
  hero.append(mark,songInfo,jumpToSong);
  audio=el('audio');audio.controls=true;audio.crossOrigin='anonymous';audio.preload='none';audio.setAttribute('aria-label','Shared music audio');audio.setAttribute('data-dimau-shared-music-audio','');
  const transport=el('div',undefined,'transport');transport.setAttribute('role','group');transport.setAttribute('aria-label','Music playback');
  prev=iconButton('prev','Previous',()=>move(-1));
  play=iconButton('play','Play',()=>{
    if(!audio.paused&&!audio.ended)return pause();
    if(selected)return playTrack(selected,playbackList(),true);
    if(upNext.edited()&&upNext.items().length)return move(1);
    return choose(0);
  });
  next=iconButton('next','Next',()=>move(1));transport.append(prev,play,next);
  const modeRow=el('div',undefined,'modes');modeRow.setAttribute('role','group');modeRow.setAttribute('aria-label','Play order');
  shuffleBtn=iconButton('shuffle','Shuffle',()=>setMode('shuffle',!modes.shuffle),'mode');repeatBtn=iconButton('repeat','Repeat off',()=>setMode('repeat',REPEATS[(REPEATS.indexOf(modes.repeat)+1)%3]),'mode');modeRow.append(shuffleBtn,repeatBtn);
  status=el('p','Connecting to the shared library…','status');status.setAttribute('role','status');retry=button('Retry library',()=>load(true),'retry');retry.hidden=true;
  chips=el('div',undefined,'chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Playlists');chips.hidden=true;
  mixbar=el('div',undefined,'mixbar');mixbar.hidden=true;adder=el('div',undefined,'adder');adder.setAttribute('role','group');adder.setAttribute('aria-label','Add to a mix');adder.hidden=true;
  const library=el('div',undefined,'library');
  const navigation=el('nav',undefined,'library-nav');
  navigation.setAttribute('aria-label','Playlists');
  navigation.append(el('h3','Playlists','library-caption'),chips);
  const content=el('div',undefined,'library-content');
  const mobilePicker=el('div',undefined,'mobile-library-picker');
  const pickerLabel=el('label','Playlist');
  picker=el('select');
  picker.id=pickerLabel.htmlFor='dsm-playlist';
  picker.disabled=true;
  picker.addEventListener('change',()=>openPlaylist(picker.value));
  mobilePicker.append(pickerLabel,picker);
  const songSearch=el('div',undefined,'song-search');
  const label=el('label','Search songs');
  label.htmlFor='dsm-search';
  search=el('input');
  search.id='dsm-search';
  search.type='search';
  search.maxLength=120;
  search.addEventListener('input',render);
  clearSearch=button('Clear search',()=>{
    search.value='';
    render();
    search.focus();
  },'clear-search');
  clearSearch.hidden=true;
  songSearch.append(label,search,clearSearch);
  count=el('p','Loading songs…','count');list=el('ol');list.setAttribute('aria-label','Shared library songs');
  count.setAttribute('aria-live','polite');
  content.append(mobilePicker,mixbar,adder,songSearch,count,list);
  library.append(navigation,content);
  const toolbar=el('div',undefined,'playback-toolbar');
  toolbar.append(transport,modeRow);
  upNext=createUpNext({el,button,available:()=>inList(playbackList()),changed:sync});
  box.append(head,hero,audio,toolbar,upNext.box,status,retry,library);dialog.append(box);shadow.append(dialog);document.body.append(host);
  audio.addEventListener('play',()=>{buffering=true;sync();});audio.addEventListener('playing',()=>{buffering=false;status.textContent='Playing · '+(selected?.title||'music');sync();});
  for(const event of ['pause','emptied'])audio.addEventListener(event,()=>{buffering=false;if(selected)status.textContent='Paused · '+selected.title;sync();});
  audio.addEventListener('ended',()=>{buffering=false;sync();ended();});
  audio.addEventListener('waiting',()=>{buffering=true;if(selected)status.textContent='Buffering · '+selected.title;sync();});
  audio.addEventListener('stalled',()=>{if(audio.readyState<3){buffering=true;if(selected)status.textContent='Buffering · '+selected.title;}sync();});
  audio.addEventListener('error',()=>{buffering=false;status.textContent='This song could not load. Tap Play to retry, or choose another song.';sync();});
  document.addEventListener('play',event=>{if(event.target!==audio&&['AUDIO','VIDEO'].includes(event.target?.tagName)){pause();}},true);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(!dialog.open&&origin?.isConnected)origin.focus({preventScroll:true});});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}if(event.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,input,select,audio')].filter(n=>!n.disabled&&!n.hidden&&!n.closest('[hidden]')),first=nodes[0],last=nodes.at(-1),focused=shadow.activeElement;if(event.shiftKey&&focused===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&focused===last){event.preventDefault();first.focus();}}});
  sync();
}
export function open({opener=document.activeElement}={}){
  if(!dialog)create();if(dialog.open)return;
  origin=opener;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');dialog.querySelector('.close').focus();load().then(()=>{if(session)syncMixes();});
}
