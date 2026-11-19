/* Sere · Practise (Donovan, 19 Nov 2026: "Practice tools on Sere").
   Honest practice tools: the main chords of a chosen key (not a song's own chords), guitar and
   ukulele shapes with a capo guide, a keyboard, sol-fa, the starting note and a click/chord loop.
   Sound is made in the browser (Web Audio); nothing is downloaded or stored except the reader's
   chosen key and speed per song, on this device. */
(function(root){
'use strict';
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const KEYS=[['C',0],['G',7],['D',2],['A',9],['E',4],['F',5],['Bb',10],['Eb',3]];
const FLAT_KEYS=new Set(['F','Bb','Eb']);
/* Degree: semitones above the key, chord quality. */
const DEGREES=[['I',0,''],['IV',5,''],['V',7,''],['vi',9,'m'],['V7',7,'7']];
const QUALITY={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10]};
const LOOPS=[['I–IV–V–I',['I','IV','V','I']],['I–vi–IV–V',['I','vi','IV','V']],['I–V–vi–IV',['I','V','vi','IV']],['I–IV–I–V7',['I','IV','I','V7']]];
/* Open shapes (low string first; x = not played), and which shape family + capo gives each key. */
const SHAPE_SETS={C:['C','F','G','Am','G7'],G:['G','C','D','Em','D7'],D:['D','G','A','Bm','A7'],F:['F','Bb','C','Dm','C7']};
const GUITAR={C:'x32010',F:'xx3211',G:'320003',Am:'x02210',G7:'320001',Em:'022000',D:'xx0232',D7:'xx0212',A:'x02220',Bm:'x24432',A7:'x02020'};
const UKE={C:'0003',F:'2010',G:'0232',Am:'2000',G7:'0212',Em:'0432',D:'2220',D7:'2223',A:'2100',Bm:'4222',A7:'0100',Bb:'3211',Dm:'2210',C7:'0001'};
const INSTR={
  guitar:{name:'Guitar',open:[40,45,50,55,59,64],labels:['E','A','D','G','B','E'],shapes:GUITAR,capo:{C:['C',0],G:['G',0],D:['D',0],A:['G',2],E:['D',2],F:['D',3],Bb:['G',3],Eb:['C',3]}},
  uke:{name:'Ukulele',open:[67,60,64,69],labels:['G','C','E','A'],shapes:UKE,capo:{C:['C',0],G:['G',0],F:['F',0],D:['D',0],A:['G',2],E:['D',2],Bb:['G',3],Eb:['C',3]}}
};
const SOLFA=['d','r','m','f','s','l','t',"d'"],MAJOR=[0,2,4,5,7,9,11,12];

const keyPc=k=>(KEYS.find(x=>x[0]===k)||KEYS[0])[1];
const noteName=(pc,key)=>(FLAT_KEYS.has(key)?FLAT:SHARP)[((pc%12)+12)%12];
function chordsFor(key){
  const r=keyPc(key);
  return DEGREES.map(([deg,step,q])=>{const pc=(r+step)%12;return {degree:deg,name:noteName(pc,key)+q,pc,quality:q,midi:QUALITY[q].map(i=>60+pc+i)};});
}
function shapesFor(key,instr){
  const I=INSTR[instr],[set,capo]=I.capo[key]||I.capo.C;
  return SHAPE_SETS[set].map((shape,i)=>{
    const frets=I.shapes[shape],sounds=chordsFor(key)[i].name;
    const midi=[...frets].map((f,s)=>f==='x'?null:I.open[s]+capo+Number(f)).filter(n=>n!==null);
    return {shape,frets,capo,sounds,midi};
  });
}
function capoText(key,instr){const [set,capo]=INSTR[instr].capo[key]||INSTR[instr].capo.C;return capo?`capo ${capo}, play ${set} shapes`:`no capo, ${set} shapes`;}
function solfaFor(key){const r=keyPc(key);return SOLFA.map((s,i)=>({syllable:s,name:noteName(r+MAJOR[i],key),midi:60+r+MAJOR[i]}));}
const api={KEYS,LOOPS,INSTR,chordsFor,shapesFor,capoText,solfaFor,noteName};
if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
root.SerePractice=api;

/* ---------- page ---------- */
const d=document,$=id=>d.getElementById(id);
if(!$('keys'))return;
const params=new URLSearchParams(location.search),songId=(params.get('song')||'').slice(0,120);
const song=(root.SONGS||[]).find(s=>s.id===songId),cat=song?null:(root.CATALOGUE||[]).find(s=>s.id===songId);
const store=k=>'sere.practice.'+(songId||'_')+'.'+k;
const load=(k,f)=>{try{return localStorage.getItem(store(k))??f;}catch{return f;}};
const save=(k,v)=>{try{localStorage.setItem(store(k),v);}catch{}};
let key=KEYS.some(k=>k[0]===load('key'))?load('key'):'C',instr='guitar';

/* Song context: words only for Sere's own songs; others link to their source. */
const title=song?.title||cat?.title||(params.get('title')||'').slice(0,120);
if(title){$('pr-title').textContent=title;d.title=title+' · Practise — Sere';
  const by=song?.artist||cat?.artist;$('pr-sub').textContent=(by?by+' · ':'')+'Pick the key you sing it in, get the starting note, and practise the chords.';}
{const links=$('pr-song-links'),add=(href,text)=>{const a=d.createElement('a');a.href=href;a.textContent=text;a.className='btn';if(/^https?:/.test(href)){a.target='_blank';a.rel='noopener';}links.append(a);};
  if(song)add('index.html#'+encodeURIComponent(song.id),'Open the song');
  if(cat&&(cat.fijianUrl||cat.sourceUrl)&&/^https:\/\//.test(cat.fijianUrl||cat.sourceUrl))add(cat.fijianUrl||cat.sourceUrl,'Read the words on '+(cat.sourceName||'the source')+' ↗');
  if(!song&&!cat)add('index.html','Choose a song');
  links.hidden=false;}
if(song?.lyricsFijian){$('words').hidden=false;$('words-text').textContent=song.lyricsFijian;}

/* Sound: a soft piano-like tone and a woodblock-like click. */
let ctx=null,master=null;
function audio(){if(!ctx){const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.gain.value=.5;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;master.connect(lp);lp.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume();return ctx;}
const hz=m=>440*Math.pow(2,(m-69)/12);
function tone(m,at,dur=1.2,vol=.18){const c=audio();if(!c)return;const t=at??c.currentTime,g=c.createGain();
  for(const [type,mult,v] of [['triangle',1,1],['sine',2,.25]]){const o=c.createOscillator(),og=c.createGain();o.type=type;o.frequency.value=hz(m)*mult;og.gain.value=v;o.connect(og);og.connect(g);o.start(t);o.stop(t+dur+.05);}
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(master);}
function strum(midis,at,dur){const c=audio();if(!c)return;const t=at??c.currentTime;midis.forEach((m,i)=>tone(m,t+i*.022,dur,.13));}
function click(at,accent){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=accent?1500:1000;
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(accent?.32:.18,at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.05);o.connect(g);g.connect(master);o.start(at);o.stop(at+.06);}

/* Rendering */
const el=(tag,cls,text)=>{const e=d.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
function keyButtons(){const box=$('keys');box.replaceChildren();for(const [k] of KEYS){const b=el('button','pr-key',k);b.type='button';b.setAttribute('aria-pressed',String(k===key));b.setAttribute('aria-label','Key of '+k);b.onclick=()=>{key=k;save('key',k);paint();};box.append(b);}}
function paint(){
  keyButtons();
  $('capo-line').textContent=`Guitar: ${capoText(key,'guitar')}. Ukulele: ${capoText(key,'uke')}.`;
  const sf=$('solfa');sf.replaceChildren();for(const n of solfaFor(key)){const b=el('button','pr-sol');b.type='button';b.append(el('b','',n.syllable),el('span','',n.name));b.setAttribute('aria-label',`${n.syllable}, ${n.name}`);b.onclick=()=>{tone(n.midi);light([n.midi]);};sf.append(b);}
  const ch=$('chords');ch.replaceChildren();for(const c of chordsFor(key)){const b=el('button','pr-chord');b.type='button';b.append(el('b','',c.name),el('span','',c.degree));b.setAttribute('aria-label',`${c.name}, chord ${c.degree}`);b.onclick=()=>{strum(c.midi,null,1.4);light(c.midi);};ch.append(b);}
  const lp=$('loop'),was=load('loop','0');lp.replaceChildren();LOOPS.forEach(([n],i)=>{const o=el('option','',n.replace(/V7|IV|vi|V|I/g,m=>chordsFor(key).find(c=>c.degree===m)?.name||m)+'  ('+n+')');o.value=String(i);lp.append(o);});lp.value=LOOPS[+was]?was:'0';
  shapes();
}
function diagram(s,I){
  const n=I.open.length,w=22*(n-1),fr=5,h=fr*22,svg=d.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`-14 -22 ${w+28} ${h+34}`);svg.setAttribute('class','pr-svg');svg.setAttribute('aria-hidden','true');
  const add=(tag,a)=>{const e=d.createElementNS(svg.namespaceURI,tag);for(const k in a)e.setAttribute(k,a[k]);svg.append(e);return e;};
  add('rect',{x:-1,y:-3,width:w+2,height:4,rx:1,class:s.capo?'pr-capo':'pr-nut'});
  for(let f=1;f<=fr;f++)add('line',{x1:0,x2:w,y1:f*22,y2:f*22,class:'pr-fret'});
  for(let i=0;i<n;i++)add('line',{x1:i*22,x2:i*22,y1:0,y2:h,class:'pr-string'});
  [...s.frets].forEach((f,i)=>{const x=i*22;
    if(f==='x'){const t=add('text',{x,y:-8,'text-anchor':'middle',class:'pr-mark'});t.textContent='×';}
    else if(f==='0'){add('circle',{cx:x,cy:-12,r:4,class:'pr-open'});}
    else add('circle',{cx:x,cy:(+f-.5)*22,r:7,class:'pr-dot'});});
  return svg;
}
const KB_LOW=60,KB_HIGH=83,BLACK=new Set([1,3,6,8,10]);
function keyboard(){const kb=el('div','pr-kb');kb.setAttribute('role','group');kb.setAttribute('aria-label','Keyboard');
  for(let m=KB_LOW;m<=KB_HIGH;m++){const pc=m%12,b=el('button',BLACK.has(pc)?'pr-bk':'pr-wk');b.type='button';b.dataset.midi=m;b.setAttribute('aria-label',noteName(pc,key));if(!BLACK.has(pc))b.append(el('span','',noteName(pc,key)));b.onclick=()=>{tone(m);light([m]);};kb.append(b);}
  return kb;}
function shapes(){
  const box=$('shapes');box.replaceChildren();
  for(const [id,v] of [['tab-guitar','guitar'],['tab-uke','uke'],['tab-keys','keys']])$(id).setAttribute('aria-selected',String(instr===v));
  if(instr==='keys'){box.append(keyboard(),el('p','pr-note','Tap a chord above to see its notes light up here.'));return;}
  const I=INSTR[instr],list=shapesFor(key,instr),grid=el('div','pr-shape-grid');
  box.append(el('p','pr-note',`${I.name} in ${key}: ${capoText(key,instr)}. Strings from left: ${I.labels.join(' ')}.`));
  for(const s of list){const b=el('button','pr-shape');b.type='button';b.setAttribute('aria-label',`${s.shape} shape${s.capo?' with capo '+s.capo:''}, sounds as ${s.sounds}`);
    b.append(el('b','',s.shape),diagram(s,I),el('span','',s.capo?`sounds as ${s.sounds}`:' '));b.onclick=()=>{strum(s.midi,null,1.4);};grid.append(b);}
  box.append(grid);
}
function light(midis){const set=new Set(midis);d.querySelectorAll('.pr-kb [data-midi]').forEach(k=>k.classList.toggle('on',set.has(+k.dataset.midi)));
  clearTimeout(light.t);light.t=setTimeout(()=>d.querySelectorAll('.pr-kb .on').forEach(k=>k.classList.remove('on')),1400);}
for(const [id,v] of [['tab-guitar','guitar'],['tab-uke','uke'],['tab-keys','keys']])$(id).onclick=()=>{instr=v;shapes();};
$('give-note').onclick=()=>{const c=audio();if(!c)return;const t=c.currentTime+.05,home=chordsFor(key)[0];strum(home.midi,t,1.2);tone(home.midi[0],t+1.3,1.4,.2);light(home.midi);};

/* Loop with a look-ahead scheduler so the beat stays steady. */
const bpmIn=$('bpm'),beatsIn=$('beats');bpmIn.value=String(Math.min(200,Math.max(40,+load('bpm','80')||80)));beatsIn.value=['2','3','4'].includes(load('beats'))?load('beats'):'4';
bpmIn.onchange=()=>{bpmIn.value=String(Math.min(200,Math.max(40,Math.round(+bpmIn.value)||80)));save('bpm',bpmIn.value);};
beatsIn.onchange=()=>{save('beats',beatsIn.value);dots();};$('loop').onchange=e=>save('loop',e.target.value);
function dots(){const box=$('beat-dots');box.replaceChildren();for(let i=0;i<+beatsIn.value;i++)box.append(el('span'));}
let timer=null,next=0,beat=0,bar=0;
function schedule(){const c=ctx;while(next<c.currentTime+.12){
  const per=+beatsIn.value,seq=LOOPS[+$('loop').value][1],chords=chordsFor(key),deg=seq[bar%seq.length],chord=chords.find(x=>x.degree===deg),spb=60/(+bpmIn.value||80);
  if($('use-click').checked)click(next,beat===0);
  if(beat===0&&$('use-chords').checked){strum(chord.midi,next,spb*per*.95);strum([chord.midi[0]-12],next,spb*per*.95);}
  const b=beat,name=chord.name,delay=Math.max(0,(next-c.currentTime)*1000);
  setTimeout(()=>{if(!timer)return;d.querySelectorAll('#beat-dots span').forEach((s,i)=>s.classList.toggle('on',i===b));if(b===0){$('now-chord').textContent=name;light(chord.midi);}},delay);
  next+=spb;beat=(beat+1)%per;if(beat===0)bar++;}}
function stop(){clearInterval(timer);timer=null;$('play').textContent='▶ Play';$('play').setAttribute('aria-pressed','false');$('now-chord').textContent='';d.querySelectorAll('#beat-dots span').forEach(s=>s.classList.remove('on'));}
$('play').onclick=()=>{if(timer)return stop();const c=audio();if(!c)return;next=c.currentTime+.1;beat=0;bar=0;timer=setInterval(schedule,25);schedule();$('play').textContent='■ Stop';$('play').setAttribute('aria-pressed','true');};
d.addEventListener('visibilitychange',()=>{if(d.hidden&&timer)stop();});
dots();paint();
})(typeof window!=='undefined'?window:globalThis);
