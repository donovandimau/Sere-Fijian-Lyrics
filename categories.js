/* Sere song categories (15 Nov 2026, owner request: "categorise them in genre or whatever they do in the music industry").
   Every song gets several labels, the way music services file music: genre (main type), style, language and occasion.
   Labels come only from what each record already says (its genre field, type, title and singer). Nothing is guessed:
   a song with no usable genre is "Not yet labelled" so a person can sort it later.
   New songs added by collectors should carry these fields directly: genre, style, languages, occasions. */
(function () {
  'use strict';
  var GENRES = [
    ['church', 'Church & sacred'],
    ['traditional', 'Traditional & folk'],
    ['sigidrigi', 'Sigidrigi'],
    ['pop', 'Fijian pop & dance'],
    ['indo', 'Indo-Fijian'],
    ['islands', 'Rotuman & other islands'],
    ['national', 'National & community'],
    ['children', "Children's"],
    ['unlabelled', 'Not yet labelled']
  ];
  var OCCASIONS = [
    ['church', 'Church service'], ['christmas', 'Christmas'], ['easter', 'Easter'], ['wedding', 'Wedding'],
    ['funeral', 'Funeral'], ['farewell', 'Farewell'], ['welcome', 'Welcome'], ['national', 'National days'], ['dance', 'Dance & meke']
  ];
  var has = function (s, re) { return re.test(String(s || '').toLowerCase()); };

  function classify(s, full) {
    var g = String(s.genre || s.type || '').toLowerCase(), t = String(s.title || ''), a = String(s.artist || '');
    var genre = 'unlabelled', style = '', occ = [];
    if (/hymn|religious/.test(g)) { genre = 'church'; style = 'Hymn'; occ.push('church'); }
    else if (/songbook/.test(g)) { genre = 'church'; style = 'Songbook'; occ.push('church'); }
    else if (/youth/.test(g)) { genre = 'church'; style = 'Youth song'; occ.push('church'); }
    else if (/children/.test(g)) { genre = 'children'; style = "Children's song"; if (s.sourceName === 'SingPraises.net') occ.push('church'); }
    else if (/anthem|patriotic/.test(g)) { genre = 'national'; style = /anthem/.test(g) || /meda dau doka/i.test(t) ? 'Anthem' : 'Patriotic'; occ.push('national'); }
    else if (/cibi|war dance/.test(g)) { genre = 'traditional'; style = 'Cibi (war dance)'; occ.push('dance'); }
    else if (/meke/.test(g)) { genre = 'traditional'; style = 'Meke'; occ.push('dance'); }
    else if (/sigidrigi/.test(g)) { genre = 'sigidrigi'; style = 'Sigidrigi'; }
    else if (/vude|reggae|pop|r&b|hip/.test(g)) { genre = 'pop'; style = g.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
    else if (/bhajan|kirtan|qawwali|chutney|hindi/.test(g)) { genre = 'indo'; style = g; }
    else if (/rotuman|tautoga|banaban/.test(g)) { genre = 'islands'; style = g; }
    else if (/folk|farewell|welcome/.test(g)) { genre = 'traditional'; style = 'Folk song'; }
    else if (/contemporary/.test(g)) {
      if (has(a, /choir|cmf|church|methodist|catholic|sda|aog/)) { genre = 'church'; style = 'Choir'; occ.push('church'); }
      else { genre = 'pop'; style = 'Contemporary'; }
    }
    if (/isa lei/i.test(t)) occ.push('farewell');
    if (/bula maleya/i.test(t)) occ.push('welcome');
    if (has(t, /sucu|christmas|noeli|kalokalo ni/)) occ.push('christmas');
    if (has(t, /tucake|easter|lako cake|vakaturi/)) occ.push('easter');
    if (has(t, /vakamau|wedding/)) occ.push('wedding');
    var langs = String(s.language || 'Fijian').split(/,\s*/).filter(function (x) { return x && !/^\+/.test(x) && !/^\+\d/.test(x); });
    if (langs.length > 4) langs = ['Fijian', 'Many Pacific languages'];
    return { genre: genre, style: style, languages: langs, occasions: occ.filter(function (x, i, arr) { return arr.indexOf(x) === i; }), full: !!full };
  }

  var all = [];
  (window.SONGS || []).forEach(function (s) { s.cat = classify(s, true); all.push(s); });
  (window.CATALOGUE || []).forEach(function (s) { s.cat = classify(s, false); all.push(s); });

  function counts(key) {
    var m = {};
    all.forEach(function (s) { var v = s.cat[key]; (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x) m[x] = (m[x] || 0) + 1; }); });
    return m;
  }
  window.SERE_CATEGORIES = {
    genres: GENRES, occasions: OCCASIONS, classify: classify, counts: counts,
    genreName: function (k) { var f = GENRES.filter(function (x) { return x[0] === k; })[0]; return f ? f[1] : k; },
    occasionName: function (k) { var f = OCCASIONS.filter(function (x) { return x[0] === k; })[0]; return f ? f[1] : k; }
  };
})();
