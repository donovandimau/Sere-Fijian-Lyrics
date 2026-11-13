/* Sere pictures (owner-approved 13 Nov 2026, from his reference links). Uses the site's own data; nothing is sent anywhere.
   Song library (index.html): every catalogue song as a dot, grouped by kind, coloured by recording or by source, from
     catalogue.js; tap a group to list its songs and open one (the page's own song view, through the address hash).
     The gold row is the songs with full words and a translation, from songs.js.
   Lyrics & video (studio.html): the studio's two roads, lyric video or just the lyrics, following the page's own
     "What would you like to make?" choice; each stop lists what you can do there and its limits.
   Picture first; tapping part of a picture opens a plain list underneath; each has a Picture | List switch. */
(function () {
  'use strict';
  var CSSTEXT = ":host{display:block;min-width:0;max-width:100%;text-align:left;margin-top:2rem;--bg:#EAF7FD;--ink:#12324A;--dim:#4C6A80;--card:#fff;--line:#cfe3ee;\n --blue:#1F7FBF;--coral:#c0563a;--teal:#0e7c8c;--cyan:#21c3e6;--sun:#f2b92b;--plum:#7a4fa3;--leaf:#3f9a46;--pink:#d6457e;\n --xray:#0b1640;--sea:#59c3dd;--sea2:#2f9fc4;--land:#8cc56a;--land2:#6bb04f;--road:#56636a;\n --display:\"Manrope\",system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;--body:\"Manrope\",system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color-scheme:light}\n*{box-sizing:border-box}\n[hidden]{display:none!important}\n.wrap{display:flex;flex-direction:column;gap:30px;color:var(--ink);font-family:Lexend,system-ui,sans-serif}\nsection{display:flex;flex-direction:column;gap:10px;min-width:0}\nh2{font:900 clamp(24px,4vw,36px)/1.05 var(--display);margin:0;color:var(--blue);text-transform:uppercase}\nh2 small{display:block;font:800 13px var(--body);color:var(--dim);text-transform:none;margin-bottom:2px}\n.board{background:var(--card);border-radius:24px;border:2px solid var(--line);overflow:hidden;position:relative}\n.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}\nsvg{display:block;width:100%;height:auto}\nsvg text{font-family:var(--body)}\n.num{font-family:var(--display);font-weight:900}\n.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}\n.chips{display:flex;gap:8px;flex-wrap:wrap}\n.btn,.chip{min-height:42px;padding:0 16px;border-radius:999px;border:2px solid var(--ink);background:var(--card);color:var(--ink);font:800 14px var(--body);cursor:pointer}\n.btn.go{background:var(--blue);border-color:var(--blue);color:#fff}\n.btn:disabled{opacity:.4;cursor:default}\n.chip{min-height:38px;border-color:var(--line)}\n.chip[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:#fff}\n.btn:focus-visible,.chip:focus-visible,.hot:focus-visible,.stop:focus-visible,select:focus-visible{outline:3px solid var(--blue);outline-offset:3px}\n.read{font:900 clamp(17px,2.4vw,23px) var(--display);margin-left:auto;font-variant-numeric:tabular-nums}\n.hint{font:700 13px var(--body);color:var(--dim)}\n.pop{opacity:0;translate:0 16px;transition:opacity .45s,translate .45s cubic-bezier(.3,1.5,.5,1)}\n.in .pop{opacity:1;translate:0 0}\n.hot{cursor:pointer}.hot .ring{animation:pulse 1.8s ease-out infinite;transform-box:fill-box;transform-origin:center}\n@keyframes pulse{0%{opacity:.7;scale:1}100%{opacity:0;scale:2.1}}\n.stop{cursor:pointer}.stop .halo{opacity:0;transition:opacity .3s}.stop.on .halo{opacity:1}\n.beam{mix-blend-mode:screen}\n/* layer 3: the list that slides out under the picture */\n.sheet{border:2px solid var(--line);border-radius:22px;background:var(--card);overflow:hidden;animation:slide .32s cubic-bezier(.3,1.3,.5,1)}\n@keyframes slide{from{opacity:0;translate:0 -14px}}\n.shead{display:flex;align-items:center;gap:12px;padding:12px 16px;color:#fff}\n.shead b{font:900 40px/1 var(--display)}.shead h3{font:900 21px/1.1 var(--display);margin:0;flex:1}\n.shead span{font:800 13px var(--body);opacity:.9;white-space:nowrap}\n.sx{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.25);color:#fff;font:800 20px var(--body);cursor:pointer;flex:none}\n.sbody{padding:14px 16px;display:grid;grid-template-columns:72px minmax(0,1fr);gap:14px;align-items:start}\n.sbody .art{width:72px;height:72px}\n.sbody.noart{grid-template-columns:minmax(0,1fr)}.sbody.noart .sart{display:none}\n.slist li>div:first-child,.plain li>div:first-child{min-width:0}\n.mchip{display:inline-flex;border-radius:999px;padding:5px 12px;font:800 13px var(--body);color:#fff;margin:0 6px 6px 0}\n.sp{margin:4px 0 0;font-size:16px;line-height:1.45}\n.slist,.plain{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}\n.slist li,.plain li{display:flex;justify-content:space-between;align-items:center;gap:10px;border:2px solid var(--line);border-radius:12px;padding:8px 12px;font-weight:800}\n.slist li span,.plain li span{color:var(--dim);font-weight:700}\n.slist li.me,.plain li.me{border-color:var(--blue);background:#eef2ff}\n.acts{display:flex;gap:6px;flex:none}.acts .btn{min-height:34px;padding:0 12px;font-size:13px}\n.acts .btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#fff}\n.stick{margin-top:12px}.stick[aria-pressed=true]{background:var(--leaf);border-color:var(--leaf);color:#fff}\n.sfoot{display:flex;justify-content:space-between;gap:10px;padding:0 16px 14px}\n/* Picture | List */\n.head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.seg{display:inline-flex;border:2px solid var(--ink);border-radius:999px;overflow:hidden;flex:none}\n.seg button{min-height:38px;padding:0 16px;border:0;background:var(--card);color:var(--ink);font:800 14px var(--body);cursor:pointer}\n.seg button[aria-pressed=true]{background:var(--ink);color:#fff}\n.seg button:focus-visible,.acts .btn:focus-visible,.chk input:focus-visible{outline:3px solid var(--blue);outline-offset:2px}\n.listmode .board,.listmode .picbtn,.listmode .pichint{display:none!important}\n.listview{background:var(--card);border:2px solid var(--line);border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}\n.listview h4{margin:6px 0 0;font:900 17px var(--display)}\n.chk{display:flex;gap:12px;align-items:flex-start;border:2px solid var(--line);border-radius:14px;padding:10px 12px;cursor:pointer}\n.chk input{width:24px;height:24px;margin:2px 0 0;accent-color:var(--leaf);flex:none}\n.chk b{display:block}.chk small{display:block;color:var(--dim);font-size:14px;line-height:1.4;margin-top:2px}\n.chk:has(input:checked){border-color:var(--leaf);background:#f1f9ef}\n.search{font:700 16px var(--body);padding:10px 14px;border-radius:14px;border:2px solid var(--line);width:100%}\nol.steps{margin:0;padding-left:22px;display:grid;gap:8px}ol.steps li{line-height:1.45}ol.steps b{display:block}\n/* compare */\n.cmp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;position:relative}\n.side{padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}\n.side select{font:800 15px var(--body);padding:10px 12px;border-radius:14px;border:2px solid var(--line);max-width:100%;background:#fff;color:var(--ink)}\n.side h3{margin:0;font:900 22px/1.1 var(--display)}\n.demo{display:inline-block;background:#fff3c4;color:#6b4d00;border-radius:999px;padding:3px 10px;font:800 12px var(--body)}\n.rows{grid-column:1/3}\n@media (max-width:700px){.wide{min-width:900px}.mid{min-width:680px}.sbody{grid-template-columns:56px minmax(0,1fr)}.sbody .art{width:56px;height:56px}.slist li,.plain li{padding:8px 10px;font-size:15px}.acts .btn{padding:0 10px}.read{margin-left:0;width:100%}.side{padding:12px 8px}.side h3{font-size:17px}}\n@media (prefers-reduced-motion:reduce){.pop{transition:none;opacity:1;translate:0 0}.hot .ring{animation:none;opacity:0}.sheet{animation:none}}\nsection{background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 10px 30px rgba(11,58,91,.08)}\n@media (max-width:700px){section{padding:14px 12px}}\n";
  var SECTIONS = {"library":"<section id=\"s1\"><h2><small>Song library</small>Every song on one map</h2>\n    <div class=\"chips\" id=\"colourBy\" role=\"group\" aria-label=\"Colour the dots by\"></div>\n    <div class=\"board\"><div class=\"scroll\"><svg id=\"library\" class=\"wide\" viewBox=\"0 0 1000 600\" role=\"group\" aria-label=\"All catalogue songs as dots, grouped by kind of song\"></svg></div></div>\n    <div class=\"bar\"><span class=\"read\" id=\"read1\" aria-live=\"polite\"></span></div>\n    <div class=\"hint pichint\">One dot is one song in the catalogue. Tap a group to list its songs and open one.</div>\n  </section>","roads":"<section id=\"s2\"><h2><small>Lyrics &amp; video studio</small>Two roads through the studio</h2>\n        <div class=\"board\"><div class=\"scroll\"><svg id=\"roads\" class=\"wide\" viewBox=\"0 0 1000 520\" role=\"group\" aria-label=\"From your music to a lyric video, or to just the lyrics\"></svg></div></div>\n    <div class=\"bar\"><span class=\"read\" id=\"read2\" aria-live=\"polite\"></span></div>\n    <div class=\"hint pichint\">Everything runs in your browser; your music stays on this device. Pick Lyric video or Just the lyrics above to light up that road. Tap a stop to see what you can do there.</div>\n  </section>"};
  function engine(ROOTS) {
    function allQ(sel) { var out = []; ROOTS.forEach(function (r) { out.push.apply(out, r.querySelectorAll(sel)); }); return out; }
    /* ===================== IMAGE SLOTS =====================
       Every picture is a slot. Put the file at the path shown and list its name in ART; it replaces the placeholder. */
    var SLOTS = {};
    var ART = {};
    function artSrc(key, id) { var s = SLOTS[key]; if (!s) return ''; var f = s.file.replace('{id}', id); return ART[f.split('/').pop()] ? f : ''; }
    var NS = 'http://www.w3.org/2000/svg', $ = function (id) { for (var r = 0; r < ROOTS.length; r++) { var e = ROOTS[r].getElementById(id); if (e) return e; } return null; };
    function el(tag, a, parent, text) { var e = document.createElementNS(NS, tag); if (tag === 'text' && !a.fill) a.fill = '#141b41'; for (var k in a) e.setAttribute(k, a[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
    var CSS = getComputedStyle(ROOTS[0].host), V = function (n) { return CSS.getPropertyValue('--' + n).trim(); };
    var ICON = {
      plate: '<rect x="4" y="12" width="40" height="24" rx="4"/><path d="M11 20h6M11 28h14M27 20h10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
      doc: '<path d="M10 4h20l10 10v30H10z"/><path d="M16 22h16M16 29h16M16 36h10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
      gauge: '<path d="M4 34a20 20 0 0140 0z"/><path d="M24 34l9-13" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="34" r="4" fill="currentColor"/>',
      wrench: '<path d="M38 6a10 10 0 00-12 13L6 39l3 3 20-20a10 10 0 0013-12l-6 6-6-2-2-6z"/>',
      key: '<circle cx="15" cy="24" r="10"/><circle cx="15" cy="24" r="4" fill="currentColor"/><path d="M24 22h20v6h-4v6h-6v-6h-10z"/>',
      wallet: '<rect x="4" y="12" width="40" height="28" rx="5"/><path d="M8 12l26-8 3 8z"/><circle cx="35" cy="26" r="3.5" fill="currentColor"/>',
      sun: '<circle cx="24" cy="24" r="10"/><path d="M24 2v7M24 39v7M2 24h7M39 24h7M8 8l5 5M35 35l5 5M8 40l5-5M35 13l5-5" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
      phone: '<rect x="12" y="3" width="24" height="42" rx="5"/><rect x="18" y="20" width="12" height="10" rx="2" fill="currentColor"/><path d="M20 20v-3a4 4 0 018 0v3" stroke="currentColor" stroke-width="2.6" fill="none"/>',
      id: '<rect x="3" y="10" width="42" height="28" rx="4"/><circle cx="15" cy="22" r="5" fill="currentColor"/><path d="M8 33c1-5 13-5 14 0" fill="currentColor"/><path d="M27 19h12M27 26h12M27 32h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
      pen: '<path d="M8 6h24v36H8z"/><path d="M13 14h14M13 21h14M13 28h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M42 18l-14 18-5 2 1-5 14-18z"/>',
      stop: '<path d="M16 4h16l12 12v16L32 44H16L4 32V16z"/><path d="M15 24h18" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
      pin: '<path d="M24 46C12 31 8 24 8 18a16 16 0 0132 0c0 6-4 13-16 28z"/><circle cx="24" cy="18" r="6" fill="currentColor"/>',
      ship: '<path d="M4 30h40l-6 12H10z"/><rect x="12" y="18" width="22" height="12"/><rect x="18" y="8" width="6" height="10"/>',
      coins: '<ellipse cx="18" cy="34" rx="12" ry="5"/><path d="M6 28v6c0 3 5 5 12 5s12-2 12-5v-6c0 3-5 5-12 5S6 31 6 28z"/><ellipse cx="18" cy="24" rx="12" ry="5"/><circle cx="35" cy="15" r="9"/>',
      eye: '<path d="M2 24C10 12 38 12 46 24 38 36 10 36 2 24z"/><circle cx="24" cy="24" r="8" fill="currentColor"/>',
      camera: '<rect x="4" y="14" width="40" height="28" rx="5"/><rect x="16" y="8" width="16" height="8" rx="2"/><circle cx="24" cy="28" r="8" fill="currentColor"/>',
      people: '<circle cx="24" cy="15" r="6"/><path d="M12 38c0-8 5-13 12-13s12 5 12 13z"/><circle cx="9" cy="20" r="4"/><circle cx="39" cy="20" r="4"/>',
      star: '<path d="M24 4l6 13 14 2-10 10 2 14-12-7-12 7 2-14L4 19l14-2z"/>',
      tick: '<path d="M8 25l10 10L40 13" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      car: '<path d="M4 32l3-10 10-2 6-8h12l7 8 4 2v10z"/><circle cx="14" cy="34" r="5" fill="currentColor"/><circle cx="36" cy="34" r="5" fill="currentColor"/>'
    };
    function icon(name, parent, x, y, size, color) { var g = el('g', { transform: 'translate(' + x + ',' + y + ') scale(' + size / 48 + ')', fill: '#fff', color: color || '#000' }, parent); g.innerHTML = ICON[name] || ICON.star; return g; }
    function slot(parent, key, id, x, y, size, color, fallback) {
      var g = el('g', { 'data-slot': key.replace('*', id) }, parent); icon(fallback, g, x, y, size, color);
      var src = artSrc(key, id); if (!src) return g; var probe = new Image();
      probe.onload = function () { g.innerHTML = ''; el('image', { href: src, x: x, y: y, width: size, height: size }, g); };
      probe.src = src; return g;
    }
    function slotHTML(key, id, color, fallback) { var src = artSrc(key, id); return '<svg viewBox="0 0 96 96" class="art"><circle cx="48" cy="48" r="47" fill="' + color + '"/><g transform="translate(20,20) scale(1.166)" fill="#fff" color="' + color + '">' + (ICON[fallback] || ICON.star) + '</g>' + (src ? '<image href="' + src + '" x="0" y="0" width="96" height="96"/>' : '') + '</svg>'; }
  
    // ===================== LAYER 3: THE LIST UNDER THE PICTURE =====================
    // Tapping part of a picture opens its list directly underneath (no pop-up over the page). Back/Next walk the same set.
    var cur = null, pickForCompare = null;
    function esc(t) { var d = document.createElement('span'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
    function sheetFor(sec) {
      var d = sec.querySelector('.sheet'); if (d) return d;
      d = document.createElement('div'); d.className = 'sheet'; d.hidden = true; d.setAttribute('role', 'region');
      d.innerHTML = '<div class="shead"><b class="sn"></b><h3 class="st"></h3><span class="sc"></span><button class="sx" type="button" aria-label="Close">×</button></div><div class="sbody"><div class="sart"></div><div><div class="schips"></div><p class="sp"></p><ul class="slist"></ul><button class="btn stick" type="button" hidden></button></div></div><div class="sfoot"><button class="btn sprev" type="button">← Back</button><button class="btn go snext" type="button">Next →</button></div>';
      var after = sec.querySelector('.listview') || sec.querySelector('.board'); after.parentNode.insertBefore(d, after.nextSibling);
      d.setAttribute('aria-labelledby', ''); d.querySelector('.sx').onclick = function () { closeSheet(sec); };
      d.querySelector('.sprev').onclick = function () { if (cur && cur.i > 0) open(cur.list, cur.i - 1, null, sec); };
      d.querySelector('.snext').onclick = function () { if (cur && cur.i < cur.list.length - 1) open(cur.list, cur.i + 1, null, sec); else closeSheet(sec); };
      d.querySelector('.stick').onclick = function () { var it = cur.list[cur.i]; setTick(it.tick, !ticks[it.tick]); open(rebuild(), cur.i, null, sec); };
      return d;
    }
    function rebuild() { return cur.make ? cur.make() : cur.list; }
    function closeSheet(sec) { var d = sec.querySelector('.sheet'); if (d) d.hidden = true; var o = cur && cur.opener; cur = null; if (o && o.focus) o.focus({ preventScroll: true }); }
    function rowHTML(it, k) { var acts = (it[2] || []).map(function (a, j) { return '<button class="btn" type="button" data-k="' + k + '" data-j="' + j + '"' + (a[2] != null ? ' aria-pressed="' + !!a[2] + '"' : '') + '>' + esc(a[0]) + '</button>'; }).join('');
      return '<li' + (it[3] ? ' class="me"' : '') + '><div>' + esc(it[0]) + (it[1] ? ' <span>' + esc(it[1]) + '</span>' : '') + '</div>' + (acts ? '<div class="acts">' + acts + '</div>' : '') + '</li>'; }
    function wireActs(host, items, after) { host.querySelectorAll('.acts .btn').forEach(function (b) { b.onclick = function () { items[+b.dataset.k][2][+b.dataset.j][1](); if (after) after(); }; }); }
    // list: the set to step through; make (optional): rebuilds the set after a tick or a pick so it stays current
    function open(list, i, from, secIn, make) {
      if (typeof list === 'function') { make = list; list = make(); }
      var sec = secIn || (from && from.closest('section')) || (cur && cur.sec); if (!sec) return;
      var d = sheetFor(sec), s = list[i]; cur = { list: list, i: i, sec: sec, opener: from || (cur && cur.opener), make: make || (cur && cur.sec === sec ? cur.make : null) };
      allQ('.sheet').forEach(function (x) { if (x !== d) x.hidden = true; });
      d.querySelector('.shead').style.background = s.c; d.querySelector('.sn').textContent = s.n != null ? s.n : i + 1; d.querySelector('.st').textContent = s.title;
      d.querySelector('.sc').textContent = list.length > 1 ? (i + 1) + ' of ' + list.length : ''; d.querySelector('.sart').innerHTML = s.art || ''; d.querySelector('.sbody').classList.toggle('noart', !s.art);
      d.querySelector('.schips').innerHTML = (s.chips || []).map(function (c) { return '<span class="mchip" style="background:' + (c[1] || s.c) + '">' + esc(c[0]) + '</span>'; }).join('');
      d.querySelector('.sp').textContent = s.text || ''; d.querySelector('.sp').hidden = !s.text;
      var ul = d.querySelector('.slist'), items = s.items || []; ul.innerHTML = items.map(rowHTML).join(''); ul.hidden = !items.length; wireActs(ul, items, function () { open(rebuild(), cur.i, null, sec); });
      var t = d.querySelector('.stick'); t.hidden = !s.tick; if (s.tick) { var on = !!ticks[s.tick]; t.setAttribute('aria-pressed', String(on)); t.textContent = on ? '✓ Checked' : 'Tick it off'; }
      d.querySelector('.sfoot').hidden = list.length < 2; d.querySelector('.sprev').disabled = i === 0; d.querySelector('.snext').textContent = i === list.length - 1 ? 'Done' : 'Next →';
      d.hidden = false; var r = d.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) d.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (s.onOpen) s.onOpen();
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) closeSheet(cur.sec); });
    // Picture | List switch for each piece; the choice is remembered on this device
    var LISTS = {};
    function viewSwitch(secId, render) {
      var sec = $(secId), h2 = sec.querySelector('h2'), head = document.createElement('div'); head.className = 'head'; h2.parentNode.insertBefore(head, h2); head.appendChild(h2);
      var seg = document.createElement('div'); seg.className = 'seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Show as');
      seg.innerHTML = '<button type="button" aria-pressed="true">Picture</button><button type="button" aria-pressed="false">List</button>'; head.appendChild(seg);
      var lv = document.createElement('div'); lv.className = 'listview'; lv.hidden = true; var board = sec.querySelector('.board'); board.parentNode.insertBefore(lv, board.nextSibling);
      LISTS[secId] = function () { if (!lv.hidden) render(lv); };
      var set = function (list) { seg.children[0].setAttribute('aria-pressed', String(!list)); seg.children[1].setAttribute('aria-pressed', String(list)); sec.classList.toggle('listmode', list); lv.hidden = !list; if (list) render(lv); var d = sec.querySelector('.sheet'); if (d) d.hidden = true;
        try { localStorage.setItem('sere-view-' + secId, list ? 'list' : 'picture'); } catch (e) {} };
      seg.children[0].onclick = function () { set(false); }; seg.children[1].onclick = function () { set(true); };
      var saved = null; try { saved = localStorage.getItem('sere-view-' + secId); } catch (e) {} if (saved === 'list') set(true);
    }
    function refreshLists() { for (var k in LISTS) LISTS[k](); }
    function checkList(host, items, intro) {
      host.innerHTML = '<p class="hint" style="margin:0">' + esc(intro) + '</p>' + items.map(function (c) { return '<label class="chk"><input type="checkbox" data-id="' + c.id + '"' + (ticks[c.id] ? ' checked' : '') + '><span><b>' + esc(c.title) + '</b><small>' + esc(c.text) + '</small></span></label>'; }).join('');
      host.querySelectorAll('input').forEach(function (x) { x.onchange = function () { setTick(x.dataset.id, x.checked); }; });
    }
    function hot(parent, x, y, color, label, fn) {
      var g = el('g', { 'class': 'hot pop', tabindex: 0, role: 'button', 'aria-label': label, transform: 'translate(' + x + ',' + y + ')' }, parent);
      el('circle', { 'class': 'ring', r: 13, fill: color }, g); el('circle', { r: 13, fill: color, stroke: '#fff', 'stroke-width': 3 }, g);
      el('path', { d: 'M-6 0h12M0-6v12', stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g);
      g.addEventListener('click', function (e) { e.stopPropagation(); fn(g); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(g); } });
      return g;
    }
    function clickable(g, label, fn) { g.setAttribute('tabindex', 0); g.setAttribute('role', 'button'); g.setAttribute('aria-label', label); g.addEventListener('click', function () { fn(g); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(g); } }); }
    function arm(node) { var p = node.querySelectorAll('.pop'); for (var i = 0; i < p.length; i++) p[i].style.transitionDelay = Math.min(i * 30, 900) + 'ms';
      var go = function () { node.classList.add('in'); };
      if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { threshold: .15 }); io.observe(node); setTimeout(go, 4000); } else go(); }
    function chipRow(host, items, onPick, start) { host.innerHTML = ''; items.forEach(function (it) { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = it[1]; b.dataset.k = it[0]; b.setAttribute('aria-pressed', String(it[0] === start)); b.onclick = function () { host.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); onPick(it[0]); }; host.appendChild(b); }); }
    function anim(dur, f, done) { var t0 = null; var step = function (ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur); f(k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, k); if (k < 1) requestAnimationFrame(step); else if (done) done(); }; requestAnimationFrame(step); }
    function scrollTo(sc, x, w) { if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = x / w * sc.scrollWidth - sc.clientWidth / 2; }
  
    // ===================== REAL DATA: catalogue.js (window.CATALOGUE, 495 source entries) and songs.js (window.SONGS) =====================
    var CAT = window.CATALOGUE || [], SONGS = window.SONGS || [];
    var GROUPS = [
      { k: 'hymn', name: 'Hymns', c: '#1F7FBF', test: function (g) { return /^hymn/.test(g); } },
      { k: 'children', name: 'Children\'s songs', c: '#e0912f', test: function (g) { return g === 'children\'s song'; } },
      { k: 'songbook', name: 'Songbook', c: '#7a4fa3', test: function (g) { return g === 'songbook'; } },
      { k: 'youth', name: 'Youth songs', c: '#2f8f6e', test: function (g) { return g === 'youth song'; } },
      { k: 'contemporary', name: 'Contemporary & other', c: '#c0563a', test: function (g) { return /^unspecified/.test(g); } },
      { k: 'folk', name: 'Folk, cibi & patriotic', c: '#0B3A5B', test: function (g) { return /folk|cibi|patriotic/.test(g); } }
    ];
    var REC = function (s) { var t = (s.recordings || []).map(function (r) { return r.type; }); return t.indexOf('vocal') >= 0 ? 'vocal' : t.indexOf('video') >= 0 ? 'video' : t.indexOf('accompaniment') >= 0 ? 'accompaniment' : 'none'; };
    var RECS = { vocal: ['Sung recording', '#c0563a'], video: ['Video', '#7a4fa3'], accompaniment: ['Accompaniment only', '#1F7FBF'], none: ['No recording linked', '#b9c8d4'] };
    var SRC = { 'LyricsTranslate': '#2f8f6e', 'SingPraises.net': '#e0912f' };
    var openSong = function (id) { location.hash = encodeURIComponent(id); try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) {} };
  
    // ===================== 1 · EVERY SONG ON ONE MAP =====================
    if ($('library')) {
      var lib = $('library'), colour = 'rec', B1 = [];
      var groupData = function () { return B1.map(function (b) { var tally = {}; b.songs.forEach(function (s) { var k = colour === 'rec' ? REC(s) : s.sourceName; tally[k] = (tally[k] || 0) + 1; });
        return { n: b.songs.length, title: b.g.name, c: b.g.c, chips: Object.keys(tally).map(function (k) { return [(colour === 'rec' ? RECS[k][0] : k) + ': ' + tally[k], colour === 'rec' ? RECS[k][1] : SRC[k]]; }), text: b.songs.length + ' source entries in this group. Tap Open to see a song\'s details and links.',
          items: b.songs.slice(0, 60).map(function (s) { return [s.title, s.artist + ' · ' + RECS[REC(s)][0], [['Open', function () { openSong(s.id); }]]]; }).concat(b.songs.length > 60 ? [['…and ' + (b.songs.length - 60) + ' more in the song catalogue below', '']] : []) }; }); };
      function draw1() { lib.innerHTML = ''; el('rect', { width: 1000, height: 600, fill: '#EAF7FD' }, lib); B1 = [];
        var x = 30, y = 70, rowH = 0, sp = 12;
        el('text', { x: 30, y: 40, 'font-size': 16, 'font-weight': 900, fill: '#12324A' }, lib, CAT.length + ' songs, one dot each');
        GROUPS.forEach(function (g, gi) { var songs = CAT.filter(function (s) { return g.test(s.genre || ''); }); if (!songs.length) return;
          var cols = Math.max(6, Math.ceil(Math.sqrt(songs.length * 1.8)), Math.ceil((g.name.length * 8.6 + 60 - 24) / sp)), rows = Math.ceil(songs.length / cols), w = cols * sp + 24, h = rows * sp + 58;
          if (x + w > 975) { x = 30; y += rowH + 18; rowH = 0; }
          var gEl = el('g', { 'class': 'stop pop' }, lib); el('rect', { 'class': 'halo', x: x - 4, y: y - 4, width: w + 8, height: h + 8, rx: 16, fill: 'none', stroke: g.c, 'stroke-width': 4 }, gEl);
          el('rect', { x: x, y: y, width: w, height: h, rx: 12, fill: '#fff', stroke: g.c, 'stroke-width': 2.5 }, gEl);
          el('text', { x: x + 12, y: y + 22, 'font-size': 13.5, 'font-weight': 900, fill: g.c }, gEl, g.name);
          el('text', { 'class': 'num', x: x + w - 12, y: y + 22, 'text-anchor': 'end', 'font-size': 14, fill: '#12324A' }, gEl, String(songs.length));
          songs.forEach(function (s, i) { var cx = x + 12 + (i % cols) * sp + 5, cy = y + 40 + Math.floor(i / cols) * sp + 5, col = colour === 'rec' ? RECS[REC(s)][1] : SRC[s.sourceName] || '#999'; el('circle', { cx: cx, cy: cy, r: 4.4, fill: col }, gEl); });
          B1.push({ g: g, songs: songs }); var bi = B1.length - 1;
          clickable(gEl, g.name + ': ' + songs.length + ' songs', function (o) { open(groupData, bi, o); });
          x += w + 18; rowH = Math.max(rowH, h); });
        // the four songs with full words and an English translation
        var fy = y + rowH + 30, fg = el('g', { 'class': 'stop pop' }, lib); el('rect', { 'class': 'halo', x: 26, y: fy - 4, width: 948, height: 58, rx: 16, fill: 'none', stroke: '#d4a017', 'stroke-width': 4 }, fg);
        el('rect', { x: 30, y: fy, width: 940, height: 50, rx: 12, fill: '#fff8e1', stroke: '#d4a017', 'stroke-width': 2.5 }, fg);
        el('text', { x: 48, y: fy + 31, 'font-size': 14, 'font-weight': 900, fill: '#8a6400' }, fg, '★ Full Fijian words with English translation: ' + SONGS.length + ' songs · ' + SONGS.map(function (s) { return s.title.replace(/\s*\(.*\)/, ''); }).join(' · '));
        clickable(fg, 'Songs with full words and translation', function (o) { open(function () { return [{ n: SONGS.length, title: 'Full words and translation', c: '#d4a017', chips: [['Fijian and English']], text: 'These songs have their complete Fijian words and an English translation in Sere.', items: SONGS.map(function (s) { return [s.title, s.artist || s.type || '', [['Open', function () { openSong(s.id); }]]]; }) }]; }, 0, o); });
        // legend
        var keys = colour === 'rec' ? Object.keys(RECS) : Object.keys(SRC), lx = 30, ly = fy + 82;
        keys.forEach(function (k) { var lab = colour === 'rec' ? RECS[k][0] : k, col = colour === 'rec' ? RECS[k][1] : SRC[k], n = CAT.filter(function (s) { return (colour === 'rec' ? REC(s) : s.sourceName) === k; }).length;
          el('circle', { cx: lx + 6, cy: ly - 5, r: 6, fill: col }, lib); var t = el('text', { x: lx + 18, y: ly, 'font-size': 13, 'font-weight': 800, fill: '#12324A' }, lib, lab + ' ' + n); lx += 34 + (lab + ' ' + n).length * 7.2; });
        lib.setAttribute('viewBox', '0 0 1000 ' + (ly + 24)); lib.firstChild.setAttribute('height', ly + 24);
        var withRec = CAT.filter(function (s) { return (s.recordings || []).length; }).length;
        $('read1').textContent = CAT.length + ' source entries · ' + withRec + ' with a recording link · ' + SONGS.length + ' with full words and translation';
        arm(lib); }
      chipRow($('colourBy'), [['rec', 'Colour by recording'], ['src', 'Colour by source']], function (k) { colour = k; draw1(); }, 'rec');
      draw1();
      viewSwitch('s1', function (h) { h.innerHTML = '<ul class="plain">' + groupData().map(function (x) { return '<li><div>' + esc(x.title) + ' <span>' + esc(x.chips.map(function (c) { return c[0]; }).join(' · ')) + '</span></div><b>' + x.n + '</b></li>'; }).join('') + '</ul>'; });
    }
  
    // ===================== 2 · TWO ROADS THROUGH THE STUDIO =====================
    if ($('roads')) {
      var rd = $('roads'), mode = 'video';
      var STOPS = [
        { id: 'choose', road: 'both', x: 90, y: 270, t: 'What would you like to make?', short: 'Choose', c: '#0B3A5B', text: 'Lyric video: words on screen with your music. Just the lyrics: transcribe, edit, copy or download text. You can switch at any time without losing music, words or timing.', items: [['Lyric video', 'Words on screen, with your music'], ['Just the lyrics', 'Transcribe, edit, copy or download text']] },
        { id: 'music', road: 'both', x: 270, y: 270, t: '01 Your music', short: 'Your music', c: '#1F7FBF', text: 'Drop music or choose audio from your device, or a whole music folder. Your music stays on this device.', items: [['Formats', 'MP3, WAV, M4A, OGG, FLAC and others your browser can play'], ['Track queue', 'Each track keeps its own lyrics, timing and style while the studio is open'], ['Source recordings', 'Load a song\'s linked recording when the source allows browser access; the original link stays available']] },
        { id: 'words', road: 'both', x: 450, y: 270, t: '02 The words', short: 'The words', c: '#2f8f6e', text: 'Three ways to get the words, then review and edit them one line at a time.', items: [['Start with a Sere song', 'Choose from the song library'], ['Import lyrics', 'TXT, LRC, SRT or VTT'], ['Transcribe audio', 'Runs on this device with Whisper tiny; first use downloads about 41 MB. Up to 15 minutes and 150 MB. Drafts need checking, especially Fijian singing']] },
        { id: 'timing', road: 'video', x: 620, y: 140, t: 'Line timing', short: 'Timing', c: '#7a4fa3', text: 'Build the timeline from the words, then play the music and tap each line as it begins.', items: [['Build timeline', 'Plain lyrics start with estimated timings'], ['Spread lines across track', 'Even spacing to start from'], ['Tap next line', 'Tap when each line starts; edit start and end times'], ['Download', 'LRC or VTT']] },
        { id: 'style', road: 'video', x: 780, y: 140, t: '03 Make it yours', short: 'Make it yours', c: '#e0912f', text: 'Pick a colour and a frame. Project files save the words, timing and style.', items: [['Colour', 'Lagoon, Sunset or Midnight'], ['Frame', 'Landscape 16:9, Portrait 9:16 or Square 1:1'], ['Save project', 'Reattach your audio when you open it again']] },
        { id: 'video', road: 'video', x: 930, y: 140, t: 'Your video', short: 'Video', c: '#c0563a', text: 'Create the lyric video with your audio. It takes the length of the track, so keep the tab in front while it renders.', items: [['Create lyric video', 'WebM or MP4, depending on your browser'], ['Download video', 'When it finishes']] },
        { id: 'edit', road: 'lyrics', x: 680, y: 400, t: 'Review and edit', short: 'Review', c: '#7a4fa3', text: 'Fix the draft line by line. Stanza breaks and special letters are kept.', items: [['Edit', 'One line at a time'], ['Timed imports', 'Words are exported without timestamps']] },
        { id: 'text', road: 'lyrics', x: 900, y: 400, t: 'Copy or download', short: 'Text', c: '#c0563a', text: 'Take the words with you. No timeline or video needed.', items: [['Copy lyrics', 'If copying is blocked, the words are selected for you to copy'], ['Download TXT', 'Plain text with your edits']] }
      ];
      var stopData = function () { return STOPS.map(function (s) { return { n: '', title: s.t, c: s.c, chips: [[s.road === 'both' ? 'Both' : s.road === 'video' ? 'Lyric video' : 'Just the lyrics']], text: s.text, items: s.items }; }); };
      function draw2() { rd.innerHTML = ''; el('rect', { width: 1000, height: 520, fill: '#EAF7FD' }, rd);
        var on = function (r) { return r === 'both' || r === mode; };
        var roadPath = function (d, r) { el('path', { d: d, fill: 'none', stroke: on(r) ? '#9fc6de' : '#dbe8f0', 'stroke-width': 40, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, rd); el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '14 12', opacity: on(r) ? 1 : .5 }, rd); };
        roadPath('M90 270 H450', 'both');
        roadPath('M450 270 C520 270 540 140 620 140 H930', 'video');
        roadPath('M450 270 C520 270 560 400 680 400 H900', 'lyrics');
        el('text', { x: 780, y: 56, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 900, fill: on('video') ? '#0B3A5B' : '#9fb5c4' }, rd, 'Lyric video');
        el('text', { x: 790, y: 470, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 900, fill: on('lyrics') ? '#0B3A5B' : '#9fb5c4' }, rd, 'Just the lyrics');
        el('path', { d: 'M640 175 C640 300 660 330 670 360', fill: 'none', stroke: '#87a7bd', 'stroke-width': 2.5, 'stroke-dasharray': '4 6' }, rd);
        el('text', { x: 560, y: 335, 'font-size': 12, 'font-weight': 800, fill: '#4C6A80' }, rd, 'switch any time');
        STOPS.forEach(function (s, i) { var lit = on(s.road), g = el('g', { 'class': 'stop pop' }, rd), big = s.id === 'words';
          el('circle', { 'class': 'halo', cx: s.x, cy: s.y, r: big ? 50 : 42, fill: 'none', stroke: s.c, 'stroke-width': 4 }, g);
          el('circle', { cx: s.x, cy: s.y, r: big ? 38 : 30, fill: '#fff', stroke: lit ? s.c : '#c5d4de', 'stroke-width': 5 }, g);
          if (big) [['♪', -16, -8], ['⤓', 16, -8], ['✎', 0, 16]].forEach(function (q) { el('text', { x: s.x + q[1], y: s.y + q[2] + 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 900, fill: lit ? s.c : '#c5d4de' }, g, q[0]); });
          else el('text', { 'class': 'num', x: s.x, y: s.y + 8, 'text-anchor': 'middle', 'font-size': 20, fill: lit ? s.c : '#c5d4de' }, g, String(s.road === 'both' ? i + 1 : 4 + STOPS.filter(function (q) { return q.road === s.road; }).indexOf(s)));
          var ly = s.y + (s.road === 'video' ? -52 : big ? 66 : 58); el('text', { x: s.x, y: ly, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 900, fill: lit ? '#12324A' : '#9fb5c4' }, g, s.short);
          clickable(g, s.t, function (o) { open(stopData, i, o); }); });
        el('text', { x: 450, y: 352, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: '#4C6A80' }, rd, 'library · import · transcribe');
        $('read2').textContent = mode === 'video' ? 'Lyric video: music, words, timing, style, then create the video' : 'Just the lyrics: music, words, review, then copy or download';
        arm(rd); }
      var outputs = document.querySelectorAll('input[name="output"]'), picked = document.querySelector('input[name="output"]:checked'); if (picked) mode = picked.value;
      outputs.forEach(function (r) { r.addEventListener('change', function () { if (r.checked && r.value !== mode) { mode = r.value; draw2(); } }); });
      draw2();
      viewSwitch('s2', function (h) { h.innerHTML = '<ol class="steps">' + STOPS.filter(function (s) { return s.road === 'both' || s.road === mode; }).map(function (s) { return '<li><b>' + esc(s.t) + '</b>' + esc(s.text) + '</li>'; }).join('') + '</ol>'; });
    }
  }
  function boot() {
    var roots = [];
    document.querySelectorAll('.vig-mount[data-vig]').forEach(function (host) {
      var html = SECTIONS[host.getAttribute('data-vig')]; if (!html || host.shadowRoot || !host.attachShadow) return;
      var root = host.attachShadow({ mode: 'open' }); root.innerHTML = '<style>' + CSSTEXT + '</style><div class="wrap">' + html + '</div>'; roots.push(root);
    });
    if (!roots.length) return;
    try { engine(roots); roots.forEach(function (r) { r.host.classList.add('drawn'); }); } catch (e) { roots.forEach(function (r) { r.innerHTML = ''; }); if (window.console) console.warn('Sere pictures not drawn:', e && e.message); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
