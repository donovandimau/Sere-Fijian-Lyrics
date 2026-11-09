const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const q=$("q"),box=$("songs"),count=$("count"),dlg=$("song-dialog"),dlgBody=$("dlg-body");
const SONG_LIST=window.SONGS||[],CAT=window.CATALOGUE||[];
const pageSize=24;let cataloguePage=0;
const hues=[200,188,214,176,226,194];
const hue=s=>hues[[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%hues.length];
const initials=t=>esc(String(t).replace(/\(.*?\)/g,"").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase());
$("stat-songs").textContent=SONG_LIST.length;$("stat-cat").textContent=CAT.length;
$("catalogue-overview").textContent=`${CAT.length} song entries and their sources.`;
const first=t=>String(t||"").split("\n").find(l=>l.trim())||"";
function featureCard(s){return `<button type="button" class="card feature" data-song="${esc(s.id)}" style="--h:${hue(s.id)}"><span class="art">${initials(s.title)}</span><span class="meta">${s.type?`<span class="chip">${esc(s.type)}</span>`:""}<span class="title">${esc(s.title)}</span><span class="artist">${esc(s.artist)}</span>${s.lyricsFijian?`<span class="line" lang="fj">“${esc(first(s.lyricsFijian))}”</span>`:""}</span><span class="open">Open lyrics →</span></button>`}
function catCard(s){return `<button type="button" class="card cat" data-cat="${esc(s.id)}" style="--h:${hue(s.id)}"><span class="art sm">${initials(s.title)}</span><span class="meta"><span class="title">${esc(s.title)}</span><span class="artist">${esc(s.artist)}</span></span></button>`}
const link=(href,label,cls="")=>href?`<a class="btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`:"";
function songView(s){return `<div class="dlg-hero" style="--h:${hue(s.id)}"><span class="art lg">${initials(s.title)}</span><div>${s.type?`<span class="chip">${esc(s.type)}</span>`:""}<h2 id="dlg-title">${esc(s.title)}</h2><p class="artist">${esc(s.artist)}</p>${s.credit?`<p class="credit">${esc(s.credit)}</p>`:""}</div></div>
<div class="actions"><a class="btn primary" href="studio.html?song=${encodeURIComponent(s.id)}">Create a lyric video</a>${s.youtube?link(s.youtube,s.youtube.includes("/results?")?"Find on YouTube":"Listen on YouTube"):""}</div>
<div class="lyrics ${s.translationEnglish?"two":""}">${s.lyricsFijian?`<section><h3>Fijian</h3><pre lang="fj">${esc(s.lyricsFijian)}</pre></section>`:""}${s.translationEnglish?`<section><h3>English</h3><pre>${esc(s.translationEnglish)}</pre></section>`:""}</div>
<p class="source">Source: ${s.source?`<a href="${esc(s.source)}" target="_blank" rel="noopener">${esc(s.source)}</a>`:"none yet"}</p>`}
function catView(s){const rec=(s.recordings||[])[0];return `<div class="dlg-hero" style="--h:${hue(s.id)}"><span class="art lg">${initials(s.title)}</span><div>${s.genre?`<span class="chip">${esc(String(s.genre).replace(/^unspecified \((.*)\)$/,"$1"))}</span>`:""}<h2 id="dlg-title">${esc(s.title)}</h2><p class="artist">${esc(s.artist)}</p>${s.year?`<p class="credit">${esc(s.year)}</p>`:""}</div></div>
<div class="actions"><a class="btn primary" href="studio.html?song=${encodeURIComponent(s.id)}">Create a lyric video</a>${link(s.fijianUrl||s.sourceUrl,"Read the lyrics")}${rec?link(rec.url,"Listen to a recording"):""}</div>
<p class="note">Full lyrics for this song are held by ${esc(s.sourceName||"the source")}. Open them there, then add your recording in the studio to make a video.</p>`}
function openView(html,hash){dlgBody.innerHTML=html;if(!dlg.open)dlg.showModal();dlg.querySelector(".dlg").scrollTop=0;if(hash)history.replaceState(null,"","#"+hash)}
function closeView(){if(dlg.open)dlg.close()}
dlg.addEventListener("close",()=>{if(location.hash)history.replaceState(null,"",location.pathname+location.search)});
dlg.addEventListener("click",e=>{if(e.target===dlg||e.target.closest(".dlg-close"))closeView()});
document.addEventListener("click",e=>{const c=e.target.closest("[data-song],[data-cat]");if(!c)return;
 if(c.dataset.song){const s=SONG_LIST.find(x=>x.id===c.dataset.song);s&&openView(songView(s),s.id)}else{const s=CAT.find(x=>x.id===c.dataset.cat);s&&openView(catView(s),s.id)}});
function fromHash(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const s=SONG_LIST.find(x=>x.id===id);if(s)return openView(songView(s));const c=CAT.find(x=>x.id===id);if(c)openView(catView(c))}
function render(){const t=q.value.trim().toLowerCase();const r=SONG_LIST.filter(s=>[s.title,s.artist,s.type,s.lyricsFijian,s.translationEnglish].join(" ").toLowerCase().includes(t));
count.textContent=`${r.length} song${r.length==1?"":"s"}`;box.innerHTML=r.map(featureCard).join("")||'<p class="empty">No full-lyric songs match. Try the catalogue below.</p>';
const catalogue=CAT.filter(s=>[s.title,s.artist,s.genre].join(" ").toLowerCase().includes(t));
const pages=Math.max(1,Math.ceil(catalogue.length/pageSize));cataloguePage=Math.max(0,Math.min(cataloguePage,pages-1));
$("catalogue-count").textContent=`${catalogue.length} entr${catalogue.length===1?"y":"ies"}`;
$("catalogue-page").textContent=`Page ${cataloguePage+1} of ${pages}`;
$("catalogue-previous").disabled=cataloguePage===0;$("catalogue-next").disabled=cataloguePage>=pages-1;
$("catalogue").innerHTML=catalogue.slice(cataloguePage*pageSize,(cataloguePage+1)*pageSize).map(catCard).join("")||'<p class="empty">No catalogue entries match your search.</p>'}
q.addEventListener("input",()=>{cataloguePage=0;render()});
const jump=d=>{cataloguePage+=d;render();$("catalogue-heading").scrollIntoView({behavior:"smooth",block:"start"})};
$("catalogue-previous").addEventListener("click",()=>jump(-1));$("catalogue-next").addEventListener("click",()=>jump(1));
window.addEventListener("hashchange",fromHash);render();fromHash();
