/* Sato Anti-Infective — presenting deck, search, text size, renal dose finder.
   ES5 only. Every slide and every search hit is read from the screens themselves,
   so nothing here restates the approved text. */
(function () {
  var S = window.Sato;
  if (!S) return;
  var $ = S.$, $$ = S.$$, hasClass = S.hasClass, addClass = S.addClass, removeClass = S.removeClass;
  var html = document.documentElement;
  var R = document.getElementById('roya'), G = document.getElementById('sag'), H = document.getElementById('home');
  var app = window.SatoApp || null;   // the Android side, when there is one
  var SP = window.SatoSp;               // the doctor's speciality (js/sp.js)
  function shown(el) { return !SP || SP.shows(el); }
  function hasPr(pr) { return !SP || SP.has(pr); }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''); }
  function txt(sel, root) { var n = $(sel, root); return n ? norm(n.textContent) : ''; }
  function store(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) { return null; } return null; }
  function setT(e, v) { e.style.webkitTransform = v; e.style.transform = v; }
  function inside(e, cls) { for (var p = e; p && p.getAttribute; p = p.parentNode) if (hasClass(p, cls) || p.id === cls) return true; return false; }

  /* A copy of a live element for the deck: no reveal state, no duplicate ids, SVG gradients renamed. */
  function strip(root) {
    var gone = root.querySelectorAll ? root.querySelectorAll('[data-sp]') : [];
    for (var g = gone.length - 1; g >= 0; g--) if (!shown(gone[g]) && gone[g].parentNode) gone[g].parentNode.removeChild(gone[g]);
    var all = [root].concat(Array.prototype.slice.call(root.getElementsByTagName('*')));
    for (var i = 0; i < all.length; i++) {
      var n = all[i], c = n.getAttribute('class'), id = n.getAttribute('id');
      if (id) n.setAttribute('id', 'dk-' + id);
      if (c) n.setAttribute('class', norm((' ' + c + ' ').replace(/ (rv|in) /g, ' ').replace(/ (rv|in) /g, ' ')));
      n.removeAttribute('data-done');
      for (var a = 0; a < 2; a++) {
        var at = a ? 'stroke' : 'fill', v = n.getAttribute(at);
        if (v && v.indexOf('url(#') === 0) n.setAttribute(at, v.replace('url(#', 'url(#dk-'));
      }
    }
    return root;
  }
  function copy(sel, root) {
    var ns = $$(sel, root), n = null;
    for (var i = 0; i < ns.length && !n; i++) if (shown(ns[i])) n = ns[i];
    return n ? strip(n.cloneNode(true)) : document.createElement('div');
  }
  function secOf(sel, root) { var n = $(sel, root); while (n && !hasClass(n, 'sec')) n = n.parentNode; return n; }

  /* ===================== the presenting deck ===================== */
  var deck = document.getElementById('deck'), track = document.getElementById('track');
  var stage = $('.stage', deck), slides = [], cur = 0, startAt = 0, scale = 1, cameFrom = null, rStart = 0, gStart = 0;

  function slide(cls, inner) {
    var d = document.createElement('div');
    d.className = 'sl ' + (cls || '');
    d.innerHTML = '<div class="frm"></div><span class="brk tl"></span><span class="brk br"></span>' + (inner || '');
    return d;
  }
  function box(cls, parent, inner) {
    var d = document.createElement('div');
    d.className = 'ab ' + cls;
    if (inner) d.innerHTML = inner;
    parent.appendChild(d);
    return d;
  }
  function head(parent, kick, red, title, sans) {
    return box('c-head a', parent, '<div class="kick' + (red ? ' r' : '') + '">' + esc(kick) + '</div><h2' + (sans ? ' class="sans"' : '') + '>' + esc(title) + '</h2>');
  }

  // Key points: the same list as the screen, beside the pack.
  function keySlide(cls, view, name, pack) {
    var kp = $('.kp', view), s = slide(cls + ' kps');
    head(s, name, cls === 'r', txt('h2', kp), cls !== 'r');
    var b = copy('.kpl', kp); b.className = 'ab kpl kp-list a a2'; s.appendChild(b);
    box('kp-pack a a3', s, '<img src="' + pack + '" alt="">');
    return s;
  }

  function buildDeck() {
    slides = []; cur = 0;
    while (track.firstChild) track.removeChild(track.firstChild);
    var both = hasPr('roya') && hasPr('sag');
    var rName = txt('.bar .ttl', R), gName = txt('.bar .ttl', G);
    var packs = '<img class="p1" src="img/royafloxacin-500-carton.png" alt=""><img class="p2" src="img/saginkgo-120-carton.png" alt="">';
    var wm = '<img class="wm" src="img/sato-arabic-navy.png" alt="">';
    var s, b;

    // 1 — the combination
    if (both) {
    s = slide('t', wm);
    b = box('t-txt a', s, '<div class="kick">' + esc(txt('.home-hero .eyebrow', H)) + '</div>');
    b.appendChild(copy('.home-hero h1', H)); b.appendChild(copy('.home-hero .ruleset', H)); b.appendChild(copy('.home-hero .sub', H));
    box('t-packs a a2', s, packs);
    box('hcpl', s, esc(txt('.home-hero .hcp', H)));
    slides.push(s);
    }

    // 2 — Royafloxacin
    var rh = $('.p-hero', R), gh = $('.p-hero', G);
    if (hasPr('roya')) {
    rStart = slides.length;
    s = slide('r');
    b = box('h-txt a', s);
    b.appendChild(copy('.hcp', rh)); b.appendChild(copy('h1', rh)); b.appendChild(copy('.str', rh)); b.appendChild(copy('.gen', rh));
    b = copy('.pack', rh); b.className = 'ab h-pack a a2'; s.appendChild(b);
    s.appendChild(copy('.facts', R));
    slides.push(s);
    slides.push(keySlide('r', R, rName, 'img/royafloxacin-500-carton.png'));

    // 3 — indications
    var ind = secOf('.ticks', R);
    s = slide('r');
    head(s, rName, true, txt('h2', ind));
    b = copy('.ticks', ind); b.className = 'ab ind-list a a2'; s.appendChild(b);
    b = box('mos a a3', s);
    var ms = $$('.mosaic .m', R);
    for (var i = 0; i < ms.length; i++) { if (!shown(ms[i])) continue; var m = strip(ms[i].cloneNode(true)); m.className = 'm'; b.appendChild(m); }
    if (b.childNodes.length === 1) b.className += ' one';
    slides.push(s);

    // 4 — posology, as one table
    var dose = secOf('.dose', R), cards = [], all = $$('.dose', dose), ks = $$('.k', all[0]);
    for (var a = 0; a < all.length; a++) if (shown(all[a])) cards.push(all[a]);
    var t = '<div class="tbl-wrap"><table><tr><th>Indication</th><th>' + esc(norm(ks[0].textContent)) + '</th><th>' + esc(norm(ks[1].textContent)) + '</th></tr>';
    for (var d = 0; d < cards.length; d++) {
      var vs = $$('.v', cards[d]);
      t += '<tr><td class="k">' + esc(txt('.ind', cards[d])) + '</td><td class="v">' + esc(norm(vs[0].textContent)) + '</td><td class="d">' + esc(norm(vs[1].textContent)) + '</td></tr>';
    }
    s = slide('r');
    head(s, rName, true, txt('h2', dose));
    box('tbl a a2', s, t + '</table></div><div class="sub-note">' + esc(txt('.note', dose)) + '</div>');
    slides.push(s);

    // 5 — renal dosing
    var ren = secOf('.calc', R) || secOf('.tbl-wrap', R);
    s = slide('r');
    head(s, rName + ' · ' + txt('h2', ren), true, txt('h3', ren)).lastChild.className = 'sm';
    b = box('tbl a a2', s);
    b.appendChild(copy('.tbl-wrap', ren));
    var fn = copy('p.note', ren); fn.className = 'sub-note'; b.appendChild(fn);
    var pops = $$('.pop', ren), pp = box('pops a a3', s);
    for (var p = 0; p < pops.length; p++) pp.appendChild(strip(pops[p].cloneNode(true)));
    slides.push(s);
    }

    // 6 — Saginkgo
    if (hasPr('sag')) {
    gStart = slides.length;
    s = slide('sg');
    s.appendChild(copy('.leaf', G));
    b = box('h-txt a', s);
    b.appendChild(copy('.hcp', gh)); b.appendChild(copy('h1', gh)); b.appendChild(copy('.str', gh)); b.appendChild(copy('.gen', gh)); b.appendChild(copy('.orbs', gh));
    b = copy('.pack', gh); b.className = 'ab h-pack a a2'; s.appendChild(b);
    s.appendChild(copy('.facts', G));
    slides.push(s);
    slides.push(keySlide('sg', G, gName, 'img/saginkgo-120-carton.png'));

    // 7 — vertigo, 8 — tinnitus
    var claims = $$('.claim', G);
    for (var c = 0; c < claims.length; c++) {
      var sec = secOf('.claim' + (c ? '.deep' : ''), G);
      s = slide('sg');
      head(s, gName, false, txt('h2', sec), true);
      b = box('cl1 a a2', s); b.appendChild(copy('.claim', sec));
      b = box('ch a a3', s); b.appendChild(copy('.chart', sec));
      b = box('side a a4', s);
      if ($('.stat', sec)) b.appendChild(copy('.stat', sec));
      b.appendChild(copy('.callout', sec));
      var notes = $$('p.note', sec);
      if (notes.length > 1) b.appendChild(strip(notes[notes.length - 1].cloneNode(true)));
      slides.push(s);
    }

    // 9 — dose and benefits
    var ben = secOf('.grid', G), gs = $$('.grid .g', ben), dz = $('.dosebig', G);
    s = slide('sg');
    head(s, gName, false, txt('h2', ben), true);
    b = box('ben a a2', s);
    var cell = document.createElement('div'); cell.className = 'g';
    cell.innerHTML = '<div class="gi dz"><div class="micro">' + esc(txt('.micro', dz)) + '</div></div>';
    cell.firstChild.appendChild(copy('.n', dz));
    b.appendChild(cell);
    for (var g = 1; g < gs.length; g++) {
      if (!shown(gs[g])) continue;
      var gc = document.createElement('div'); gc.className = 'g';
      gc.appendChild(copy('.gi', gs[g]));
      b.appendChild(gc);
    }
    slides.push(s);

    }

    // 10 — in combination (or the one product, for a one-product speciality)
    var ap = $('.approval', R), con = $$('.contact a', R);
    s = slide('cl', wm);
    if (both) {
      box('cl a', s, '<div class="kick">' + esc(txt('.next .micro', R)) + '</div><div class="combo"><span>' + esc(txt('h1', rh)) + '</span><em>+</em><span class="s">' + esc(txt('h1', gh)) + '</span></div>');
      box('cl-packs a a2', s, packs);
    } else {
      var one = hasPr('roya');
      box('cl a', s, '<div class="kick">' + esc(SP ? SP.name() : '') + '</div><div class="combo"><span' + (one ? '' : ' class="s"') + '>' + esc(txt('h1', one ? rh : gh)) + '</span></div>');
      box('cl-packs a a2 solo', s, one ? '<img class="p1" src="img/royafloxacin-500-carton.png" alt="">' : '<img class="p2" src="img/saginkgo-120-carton.png" alt="">');
    }
    box('cl-foot a a3', s,
      '<div class="l"><img src="img/sato-pharma-reverse.png" alt="Sato Pharma"><br>' + esc(norm(con[0].textContent)) + ' &nbsp;·&nbsp; ' + esc(norm(con[1].textContent)) + '</div>' +
      (hasPr('roya') ? '<div class="r"><div class="micro">' + esc(txt('.micro', ap)) + ' · ' + esc(rName) + '</div><b>' + esc(txt('.val', ap)) + '</b><br>' + esc(txt('.home-hero .hcp', H)) + '</div>'
        : '<div class="r">' + esc(txt('.home-hero .hcp', H)) + '</div>'));
    slides.push(s);

    for (var k = 0; k < slides.length; k++) { slides[k].style.left = (k * 960) + 'px'; track.appendChild(slides[k]); }
    track.style.width = (slides.length * 960) + 'px';
  }

  function layout() {
    var w = window.innerWidth || html.clientWidth, h = window.innerHeight || html.clientHeight;
    scale = Math.min(w / 960, h / 540);
    setT(stage, 'scale(' + scale + ')');
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (slides[cur]) removeClass(slides[cur], 'cur');
    cur = i;
    setT(track, 'translate3d(' + (-i * 960) + 'px,0,0)');
    var sl = slides[i];
    setTimeout(function () {
      if (cur !== i) return;
      addClass(sl, 'cur');
      // Charts grow and figures count every time their slide comes up.
      var svgs = sl.getElementsByTagName('svg');
      for (var k = 0; k < svgs.length; k++) { svgs[k].removeAttribute('data-done'); S.growBars(svgs[k]); }
      var cn = $$('.cnt', sl);
      for (var j = 0; j < cn.length; j++) { cn[j].removeAttribute('data-done'); S.countUp(cn[j]); }
    }, 220);
    document.getElementById('dk-n').innerHTML = (i + 1) + ' / ' + slides.length;
    document.getElementById('dk-bar').style.width = ((i + 1) / slides.length * 100) + '%';
  }
  S.deckKey = function (d) { if (S.current() === 'deck') go(cur + d); };

  function enter(prev) {
    cameFrom = prev;
    addClass(html, 'deck-on');
    removeClass(deck, 'quiet');
    layout();
    for (var k = 0; k < slides.length; k++) removeClass(slides[k], 'cur');
    addClass(track, 'drag'); go(startAt);
    setTimeout(function () { removeClass(track, 'drag'); }, 30);
    startAt = 0;
    var hint = document.getElementById('dk-hint');
    removeClass(hint, 'gone');
    setTimeout(function () { addClass(hint, 'gone'); }, 3800);
    if (app && app.present) app.present(true);
  }
  function exit() {
    removeClass(html, 'deck-on');
    if (app && app.present) app.present(false);
  }
  function leaveDeck() {
    if (cameFrom) { history.back(); } else { location.replace('#/'); }
  }

  // swipe, with the slide following the finger
  var x0 = 0, y0 = 0, dx = 0, dy = 0, touching = false;
  deck.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { touching = false; return; }
    touching = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; dy = 0;
    addClass(track, 'drag');
  }, false);
  deck.addEventListener('touchmove', function (e) {
    if (!touching) return;
    dx = e.touches[0].clientX - x0; dy = e.touches[0].clientY - y0;
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      setT(track, 'translate3d(' + (-cur * 960 + dx / scale) + 'px,0,0)');
    }
  }, false);
  deck.addEventListener('touchend', function () {
    if (!touching) return;
    touching = false;
    removeClass(track, 'drag');
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1)); } else { go(cur); }
  }, false);
  // taps: the outer thirds turn the page, the middle hides the controls
  deck.addEventListener('click', function (e) {
    var t = e.target;
    if (t.id === 'dk-x') { e.preventDefault(); leaveDeck(); return; }
    var w = window.innerWidth || html.clientWidth;
    if (e.clientX < w * 0.3) { go(cur - 1); } else if (e.clientX > w * 0.7) { go(cur + 1); } else if (hasClass(deck, 'quiet')) { removeClass(deck, 'quiet'); } else { addClass(deck, 'quiet'); }
  }, false);
  // presentation clickers and keyboards
  document.addEventListener('keydown', function (e) {
    if (S.current() !== 'deck') return;
    var k = e.keyCode;
    if (k === 39 || k === 34 || k === 32 || k === 40) { e.preventDefault(); go(cur + 1); }
    else if (k === 37 || k === 33 || k === 38) { e.preventDefault(); go(cur - 1); }
    else if (k === 27) { leaveDeck(); }
  }, false);
  window.addEventListener('resize', function () { if (S.current() === 'deck') layout(); }, false);

  var fab = document.getElementById('fab');
  fab.addEventListener('click', function () {
    var c = S.current();
    startAt = c === 'roya' ? rStart : c === 'sag' ? gStart : 0;
  }, false);
  // the Present button steps aside while reading down the page and returns on the way up
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || html.scrollTop;
    if (y > lastY + 8 && y > 240) addClass(fab, 'away'); else if (y < lastY - 8 || y < 240) removeClass(fab, 'away');
    lastY = y;
  }, false);

  /* ===================== search ===================== */
  var find = document.getElementById('find'), q = document.getElementById('q'), fres = document.getElementById('fres');
  var index = null, hits = [], timer = null;
  var TRY = ['QT', 'tendon', 'pregnancy', 'renal', 'myasthenia', 'vertigo', 'tinnitus', 'dose'];

  function buildIndex() {
    index = [];
    var views = [['roya', R, 'r'], ['sag', G, 's']];
    for (var v = 0; v < views.length; v++) {
      if (!hasPr(views[v][0])) continue;
      var name = txt('.bar .ttl', views[v][1]), secs = $$('.sec', views[v][1]);
      for (var s = 0; s < secs.length; s++) {
        var where = name + (txt('h2', secs[s]) ? ' · ' + txt('h2', secs[s]) : '');
        var els = $$('h3, p, li, tr, .acc .hd, .claim, .callout, .dose, .pop .micro, .stat .t, .gi .tx, .approval .val, .dosebig .n', secs[s]);
        for (var e = 0; e < els.length; e++) {
          if (inside(els[e], 'calc') || !shown(els[e])) continue;
          var t = norm(els[e].textContent);
          if (t.length < 2) continue;
          index.push({ v: views[v][0], c: views[v][2], el: els[e], t: t, lt: t.toLowerCase(), where: where });
        }
      }
    }
  }
  function tryHits(w) { w = w.toLowerCase(); for (var i = 0; i < index.length; i++) if (index[i].lt.indexOf(w) >= 0) return true; return false; }
  function snippet(t, words) {
    var lt = t.toLowerCase(), pos = lt.indexOf(words[0]);
    var a = Math.max(0, pos - 60), b = Math.min(t.length, pos + 150);
    var out = esc((a > 0 ? '…' : '') + t.substring(a, b) + (b < t.length ? '…' : ''));
    for (var i = 0; i < words.length; i++) {
      var w = esc(words[i]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp('(' + w + ')', 'gi'), '<mark>$1</mark>');
    }
    return out;
  }
  function search() {
    if (!index) buildIndex();
    var raw = norm(q.value).toLowerCase();
    if (raw.length < 2) {
      var tips = '<div class="tips"><div class="micro">Popular searches</div>';
      for (var i = 0; i < TRY.length; i++) if (tryHits(TRY[i])) tips += '<a href="#" data-try="' + TRY[i] + '">' + TRY[i] + '</a>';
      fres.innerHTML = tips + '</div>';
      return;
    }
    var words = raw.split(' ');
    hits = [];
    for (var n = 0; n < index.length; n++) {
      var it = index[n], ok = true;
      for (var w = 0; w < words.length; w++) if (it.lt.indexOf(words[w]) < 0) { ok = false; break; }
      if (ok) hits.push(it);
      if (hits.length >= 80) break;
    }
    var h = '<div class="fx">' + (hits.length ? hits.length + (hits.length === 80 ? '+' : '') + ' result' + (hits.length === 1 ? '' : 's') : 'No results for “' + esc(q.value) + '”') + '</div>';
    for (var k = 0; k < hits.length; k++) {
      h += '<a class="fr ' + hits[k].c + '" href="#" data-hit="' + k + '"><div class="micro">' + esc(hits[k].where) + '</div><div class="tx">' + snippet(hits[k].t, words) + '</div></a>';
    }
    fres.innerHTML = h;
    fres.scrollTop = 0;
  }
  function openFind() {
    if (!index) buildIndex();
    addClass(find, 'on'); addClass(html, 'find-on');
    search();
  }
  function closeFind() {
    removeClass(find, 'on'); removeClass(html, 'find-on');
    if (q.blur) q.blur();
  }
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(search, 120); }, false);
  q.addEventListener('keyup', function (e) { if (e.keyCode === 13 && q.blur) q.blur(); }, false);
  fres.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== fres && !(t.getAttribute && (t.getAttribute('data-hit') || t.getAttribute('data-try')))) t = t.parentNode;
    if (!t || t === fres) return;
    e.preventDefault();
    if (t.getAttribute('data-try')) { q.value = t.getAttribute('data-try'); search(); return; }
    var hit = hits[+t.getAttribute('data-hit')];
    if (hit) S.go('#/' + hit.v, hit.el);
  }, false);
  document.getElementById('find-x').addEventListener('click', function (e) { e.preventDefault(); history.back(); }, false);
  var fbs = $$('.find-btn');
  for (var f = 0; f < fbs.length; f++) {
    fbs[f].addEventListener('click', function (e) {
      e.preventDefault();
      var c = S.current();
      location.hash = '#/' + (c === 'home' ? '' : c) + '/find';
      if (q.focus) q.focus();
    }, false);
  }

  /* ===================== text size ===================== */
  var LEVELS = [85, 100, 115, 130, 150];
  var SIZED = [['.sec p', 14.5], ['.ticks li', 14.5], ['.dots li', 14.5], ['.acc .hd', 14.5], ['.acc .bd p', 14], ['.acc .bd li', 14],
    ['.dose .ind', 14.5], ['.dose .v', 14], ['.pop p', 14], ['.alert p', 14], ['.claim', 16.5], ['.callout', 14.5], ['.sec .note', 12],
    ['.refs li', 12], ['.grid .gi .tx', 12.5], ['.stat .t', 12.5], ['.sec h3', 15], ['table', 12.5], ['th', 11]];
  var tsz = document.getElementById('tsz'), tzStyle = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(tzStyle);
  var level = +(store('sato-tz') || 1);
  if (!(level >= 0 && level < LEVELS.length)) level = 1;
  function applyTz() {
    var f = LEVELS[level] / 100, css = '';
    if (f !== 1) {
      for (var i = 0; i < SIZED.length; i++) css += 'html ' + SIZED[i][0] + '{font-size:' + (SIZED[i][1] * f).toFixed(1) + 'px}';
      css += 'html .grid .g:not(.wide) .gi{height:' + Math.round(178 + Math.max(0, f - 1) * 120) + 'px}';
    }
    if (tzStyle.styleSheet) { tzStyle.styleSheet.cssText = css; } else { tzStyle.innerHTML = css; }
    document.getElementById('tz-v').innerHTML = LEVELS[level] + '%';
    store('sato-tz', String(level));
  }
  applyTz();
  var tzb = $$('.tz-btn');
  for (var z = 0; z < tzb.length; z++) {
    tzb[z].addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (hasClass(tsz, 'on')) removeClass(tsz, 'on'); else addClass(tsz, 'on');
    }, false);
  }
  tsz.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    var d = e.target.getAttribute && e.target.getAttribute('data-tz');
    if (!d) return;
    level = Math.max(0, Math.min(LEVELS.length - 1, level + +d));
    applyTz(); S.reveal();
  }, false);
  document.addEventListener('click', function () { removeClass(tsz, 'on'); }, false);
  window.addEventListener('scroll', function () { removeClass(tsz, 'on'); }, false);

  /* ===================== renal dose finder ===================== */
  var calc = document.getElementById('calc');
  if (calc) {
    var sec = secOf('.calc', R), table = $('table', sec), rows = table.rows;
    var seg = document.getElementById('calc-reg'), crcl = document.getElementById('calc-crcl'), res = document.getElementById('calc-res');
    var regs = rows[1].cells, reg = Math.min(1, regs.length - 1), segH = '';
    for (var r = 0; r < regs.length; r++) segH += '<a href="#" data-r="' + r + '"' + (r === reg ? ' class="on"' : '') + '>' + esc(norm(regs[r].textContent)) + '</a>';
    seg.innerHTML = segH;
    var cellText = function (cell) { var c = cell.cloneNode(true), sups = c.getElementsByTagName('sup'); while (sups.length) sups[0].parentNode.removeChild(sups[0]); return norm(c.textContent); };
    var footnote = norm(txt('p.note', sec).replace(/^1\s*/, ''));
    var compute = function () {
      var v = parseFloat(String(crcl.value).replace(',', '.'));
      if (isNaN(v)) { res.innerHTML = '<div class="calc-ph">Enter creatinine clearance to see the dose.</div>'; return; }
      if (v < 0 || v > 250) { res.innerHTML = '<div class="calc-ph">Please check the number: ' + esc(crcl.value) + ' ml/min.</div>'; return; }
      var rg = esc(norm(regs[reg].textContent));
      if (v > 50) {
        res.innerHTML = '<div class="band">Creatinine clearance &gt; 50 ml/min</div><div class="ok">No change needed. Give the usual dose: <b>' + rg + '</b>.</div>';
        return;
      }
      var row = v >= 20 ? 3 : v >= 10 ? 4 : 5;
      var first = cellText(rows[2].cells[reg + 1]), then = cellText(rows[row].cells[reg + 1]).replace(/^then\s+/i, '');
      res.innerHTML = '<div class="band">' + esc(cellText(rows[row].cells[0])) + ' · usual dose ' + rg + '</div>' +
        '<div class="kv"><div class="k">' + esc(cellText(rows[2].cells[0])) + '</div><div class="v r">' + esc(first) + '</div></div>' +
        '<div class="kv"><div class="k">Then</div><div class="v">' + esc(then) + '</div></div>' +
        (row === 5 ? '<div class="fn">' + esc(footnote) + '</div>' : '');
    };
    seg.addEventListener('click', function (e) {
      e.preventDefault();
      var a = e.target;
      if (!a.getAttribute || a.getAttribute('data-r') === null) return;
      reg = +a.getAttribute('data-r');
      var as = $$('a', seg);
      for (var i = 0; i < as.length; i++) { if (i === reg) addClass(as[i], 'on'); else removeClass(as[i], 'on'); }
      compute();
    }, false);
    crcl.addEventListener('input', compute, false);
    crcl.addEventListener('keyup', compute, false);

    // Cockcroft–Gault, for when only the serum creatinine is known
    var est = document.getElementById('calc-est'), out = document.getElementById('cg-out');
    var age = document.getElementById('cg-age'), wt = document.getElementById('cg-wt'), scr = document.getElementById('cg-scr'), sexSeg = document.getElementById('cg-sex');
    var female = false;
    document.getElementById('calc-est-t').addEventListener('click', function (e) {
      e.preventDefault();
      if (hasClass(est, 'on')) removeClass(est, 'on'); else addClass(est, 'on');
    }, false);
    var estimate = function () {
      var a = parseFloat(age.value), w = parseFloat(String(wt.value).replace(',', '.')), c = parseFloat(String(scr.value).replace(',', '.'));
      if (isNaN(a) || isNaN(w) || isNaN(c)) { out.innerHTML = 'Uses the Cockcroft–Gault formula.'; return; }
      if (a < 18) { out.innerHTML = 'Adults only. Levofloxacin is contraindicated in children and growing adolescents.'; return; }
      if (a > 110 || w < 25 || w > 250 || c <= 0) { out.innerHTML = 'Please check age, weight and creatinine.'; return; }
      var umol = c > 20, mg = umol ? c / 88.4 : c;
      var v = (140 - a) * w / (72 * mg) * (female ? 0.85 : 1);
      v = Math.max(0, Math.round(v));
      out.innerHTML = 'Creatinine clearance: about ' + v + ' ml/min' + (umol ? ' (creatinine read as µmol/L)' : '') + '.';
      crcl.value = v;
      compute();
    };
    age.addEventListener('input', estimate, false); wt.addEventListener('input', estimate, false); scr.addEventListener('input', estimate, false);
    sexSeg.addEventListener('click', function (e) {
      e.preventDefault();
      var a = e.target;
      if (!a.getAttribute || !a.getAttribute('data-v')) return;
      female = a.getAttribute('data-v') === 'f';
      var as = $$('a', sexSeg);
      for (var i = 0; i < as.length; i++) { if (as[i] === a) addClass(as[i], 'on'); else removeClass(as[i], 'on'); }
      estimate();
    }, false);
  }


  /* ===================== updates ===================== */
  var upd = document.getElementById('upd'), updT = document.getElementById('upd-t'), updB = document.getElementById('upd-b');
  var toast = document.getElementById('toast'), toastTimer = null, appVersion = '';
  function say(msg, ms) {
    toast.innerHTML = esc(msg);
    addClass(toast, 'on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { removeClass(toast, 'on'); }, ms || 4500);
  }
  function banner(title, sub, buttons) {
    updT.innerHTML = esc(title) + (sub ? '<span>' + esc(sub) + '</span>' : '');
    updB.innerHTML = buttons || '';
    updB.style.display = buttons ? '' : 'none';
    addClass(upd, 'on'); addClass(html, 'upd-on');
  }
  function unbanner() { removeClass(upd, 'on'); removeClass(html, 'upd-on'); }
  var dismissed = false;
  // Called by the Android side once the home page has loaded.
  S.appInfo = function (info) {
    appVersion = info && info.version ? info.version : '';
    var v = document.getElementById('ver');
    v.innerHTML = 'Version ' + esc(appVersion) + '<a href="sato://check" id="ver-check">Check for updates</a>';
    addClass(v, 'on');
  };
  S.updateState = function (u) {
    var st = u && u.state;
    if (st === 'available') {
      if (dismissed) return;
      banner('Update available: version ' + u.version, 'You have version ' + appVersion + '. Your settings stay the same.',
        '<a href="sato://update" id="upd-go">Update</a><a href="#" class="later" id="upd-later">Later</a>');
    } else if (st === 'downloading') {
      banner('Downloading version ' + u.version, 'See progress in the notification bar. The installer opens when the download ends.', '');
    } else if (st === 'installing') {
      banner('Opening the installer', 'Tap Install to finish.', '');
      setTimeout(unbanner, 6000);
    } else if (st === 'latest') {
      unbanner();
      say('You have the latest version' + (appVersion ? ' (' + appVersion + ')' : '') + '.');
    } else if (st === 'error') {
      if (hasClass(upd, 'on')) unbanner();
      say(u.message || 'The update failed. Please try again later.', 6500);
    }
  };
  updB.addEventListener('click', function (e) {
    if (e.target.id === 'upd-later') { e.preventDefault(); dismissed = true; unbanner(); }
  }, false);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'ver-check') say('Checking for updates…', 2500);
  }, false);

  /* ===================== routes ===================== */
  buildDeck();
  if (SP) SP.on(function () {
    buildDeck(); index = null;
    var c = S.current();
    if ((c === 'roya' && !hasPr('roya')) || (c === 'sag' && !hasPr('sag'))) location.replace('#/');
    window.scrollTo(0, 0);
  });
  S.on(function (id, prev, overlay) {
    if (id === 'deck' && prev !== 'deck') enter(prev);
    else if (prev === 'deck' && id !== 'deck') exit();
    if (overlay === 'find' && id !== 'deck') openFind(); else closeFind();
    removeClass(tsz, 'on');
    removeClass(fab, 'away');
  });
  // If the first route ran before this script, catch up with it.
  if (S.current() === 'deck') enter(null);
  if (S.current() && /\/find$/.test(location.hash || '')) openFind();
})();
