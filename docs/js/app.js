/* Sato Anti-Infective — router, section chips, accordions.
   ES5 only, so it runs on the oldest Android WebView. */
(function () {
  var views = { '': 'home', roya: 'roya', sag: 'sag', present: 'deck' };
  var current = null;
  var pendingJump = null;
  var pendingEl = null;
  var savedY = {};
  var hooks = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function hasClass(el, c) { return (' ' + el.className + ' ').indexOf(' ' + c + ' ') > -1; }
  function addClass(el, c) { if (!hasClass(el, c)) el.className = (el.className + ' ' + c).replace(/^\s+/, ''); }
  function removeClass(el, c) { el.className = (' ' + el.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }

  function offsetTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function scrollY() { return window.pageYOffset || document.documentElement.scrollTop; }

  /* Routes: #/  #/roya  #/sag  #/present, and "/find" on any of the first three opens search over it. */
  function route() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var id = views.hasOwnProperty(parts[0]) ? views[parts[0]] : 'home';
    var overlay = parts[1] || '';
    // A product the chosen speciality does not see opens the home screen instead.
    if ((id === 'roya' || id === 'sag') && window.SatoSp && !window.SatoSp.has(id)) { location.replace('#/'); return; }
    var prev = current;
    if (id !== current) {
      if (current) { savedY[current] = scrollY(); removeClass(document.getElementById(current), 'on'); }
      current = id;
      addClass(document.getElementById(id), 'on');
      // Leaving the presentation puts the reader back where they were; anything else opens at the top.
      window.scrollTo(0, prev === 'deck' && savedY[id] ? savedY[id] : 0);
    }
    if (pendingJump) {
      var target = document.getElementById(pendingJump);
      pendingJump = null;
      if (target) setTimeout(function () { window.scrollTo(0, offsetTop(target)); }, 30);
    }
    if (pendingEl) {
      var el = pendingEl;
      pendingEl = null;
      setTimeout(function () { showEl(el); }, 40);
    }
    for (var i = 0; i < hooks.length; i++) hooks[i](id, prev, overlay);
    syncChips();
    setTimeout(reveal, 60);
  }

  /* Brings one element into view below the fixed bars, opening any accordion it sits in, and flashes it. */
  function showEl(el) {
    for (var p = el; p && p !== document.body; p = p.parentNode) {
      if (p.className && hasClass(p, 'acc')) addClass(p, 'open');
      if (p.className && hasClass(p, 'rv')) addClass(p, 'in');
    }
    var bars = $('.chips', document.getElementById(current)) ? 112 : 68;
    window.scrollTo(0, Math.max(0, offsetTop(el) - bars));
    addClass(el, 'hit');
    setTimeout(function () { removeClass(el, 'hit'); }, 1800);
    reveal();
  }

  function syncChips() {
    var view = document.getElementById(current);
    var chips = $$('.chips a', view);
    if (!chips.length) return;
    var y = (window.pageYOffset || document.documentElement.scrollTop) + 120;
    var on = chips[0];
    for (var i = 0; i < chips.length; i++) {
      var t = document.getElementById(chips[i].getAttribute('data-to'));
      if (t && offsetTop(t) <= y) on = chips[i];
    }
    for (var j = 0; j < chips.length; j++) {
      if (chips[j] === on) { addClass(chips[j], 'on'); } else { removeClass(chips[j], 'on'); }
    }
    var bar = on.parentNode;
    var left = on.offsetLeft - 24;
    if (left < bar.scrollLeft || on.offsetLeft + on.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = left;
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document && !(el.tagName === 'A')) el = el.parentNode;
    if (!el || el === document) return;

    if (el.getAttribute('data-to')) {
      e.preventDefault();
      var t = document.getElementById(el.getAttribute('data-to'));
      if (t) window.scrollTo(0, offsetTop(t));
      return;
    }
    if (hasClass(el, 'hd') && hasClass(el.parentNode, 'acc')) {
      e.preventDefault();
      var acc = el.parentNode;
      if (hasClass(acc, 'open')) { removeClass(acc, 'open'); } else { addClass(acc, 'open'); }
      reveal();
      return;
    }
    if (el.getAttribute('data-back') && history.length > 1 && current !== 'home') {
      e.preventDefault();
      history.back();
      return;
    }
    if (el.getAttribute('data-jump')) pendingJump = el.getAttribute('data-jump');
  }, false);

  /* Turning the phone keeps the reader on the same block: remember the block at the top
     of the screen while scrolling, and scroll back to it once the width has changed. */
  var keep = null, lastW = window.innerWidth;
  function remember() {
    if (!current) return;
    var y = (window.pageYOffset || document.documentElement.scrollTop) + 110;
    var blocks = $$('.field, .facts, .sec, .foot-white, .next, .contact', document.getElementById(current));
    keep = null;
    for (var i = 0; i < blocks.length; i++) {
      var top = offsetTop(blocks[i]);
      if (top <= y) keep = { el: blocks[i], frac: (y - top) / Math.max(1, blocks[i].offsetHeight) };
    }
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    var k = keep;
    setTimeout(function () {
      if (k && k.el.offsetHeight) window.scrollTo(0, Math.max(0, offsetTop(k.el) + k.frac * k.el.offsetHeight - 110));
      syncChips(); reveal();
    }, 120);
  }, false);

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    setTimeout(function () { ticking = false; syncChips(); reveal(); remember(); }, 80);
  }, false);


  /* ---------- reveal, growing bars, counting figures ---------- */
  var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (f) { return setTimeout(function () { f(+new Date()); }, 16); };
  function now() { return (window.performance && performance.now) ? performance.now() : +new Date(); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function tween(ms, step, done) {
    var t0 = now();
    (function tick() {
      var t = Math.min(1, (now() - t0) / ms);
      step(ease(t));
      if (t < 1) { raf(tick); } else if (done) { done(); }
    })();
  }
  function fmt(v, el) {
    var dec = +(el.getAttribute('data-dec') || 0);
    var str = v.toFixed(dec);
    if (el.getAttribute('data-sep')) str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return str;
  }
  function countUp(el) {
    if (el.getAttribute('data-done')) return;
    el.setAttribute('data-done', '1');
    var to = parseFloat(el.getAttribute('data-to'));
    tween(1100, function (k) { el.textContent = fmt(to * k, el); }, function () { el.textContent = fmt(to, el); });
  }
  function growBars(svg) {
    if (svg.getAttribute('data-done')) return;
    svg.setAttribute('data-done', '1');
    var bars = $$('rect.gbar', svg);
    var spec = [];
    for (var i = 0; i < bars.length; i++) {
      var y = parseFloat(bars[i].getAttribute('y')), h = parseFloat(bars[i].getAttribute('height'));
      spec.push({ el: bars[i], base: y + h, h: h });
      bars[i].setAttribute('height', '0'); bars[i].setAttribute('y', String(y + h));
    }
    tween(900, function (k) {
      for (var j = 0; j < spec.length; j++) {
        var hh = spec[j].h * k;
        spec[j].el.setAttribute('height', hh.toFixed(2));
        spec[j].el.setAttribute('y', (spec[j].base - hh).toFixed(2));
      }
    });
  }
  function reveal() {
    if (!current) return;
    var view = document.getElementById(current);
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var items = $$('.rv', view);
    var lag = 0;
    var de = document.documentElement;
    var atEnd = (window.pageYOffset || de.scrollTop) + vh >= Math.max(de.scrollHeight, document.body.scrollHeight) - 8;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (hasClass(el, 'in')) continue;
      var r = el.getBoundingClientRect();
      if ((r.top < vh * 0.94 && r.bottom > -40) || (atEnd && r.top < vh)) {
        (function (node, delay) {
          setTimeout(function () {
            addClass(node, 'in');
            var svg = node.getElementsByTagName('svg')[0];
            if (svg) growBars(svg);
            var c = $$('.cnt', node);
            for (var k = 0; k < c.length; k++) countUp(c[k]);
          }, delay);
        })(el, lag);
        lag = Math.min(lag + 60, 240);
      }
    }
    var heroCounts = $$('.field .cnt', view);
    for (var h = 0; h < heroCounts.length; h++) countUp(heroCounts[h]);
  }

  // The fade at the right of the chips row goes once the row is scrolled to its end.
  var chipRows = $$('.chips');
  for (var cr = 0; cr < chipRows.length; cr++) {
    (function (row) {
      var view = row.parentNode;
      function edge() {
        if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 4) addClass(view, 'chips-end'); else removeClass(view, 'chips-end');
      }
      row.addEventListener('scroll', edge, false);
      window.addEventListener('resize', edge, false);
      setTimeout(edge, 300);
    })(chipRows[cr]);
  }

  window.Sato = {
    $: $, $$: $$, hasClass: hasClass, addClass: addClass, removeClass: removeClass,
    offsetTop: offsetTop, growBars: growBars, countUp: countUp, reveal: reveal,
    current: function () { return current; },
    on: function (f) { hooks.push(f); },
    // Opens a screen and brings one element of it into view (used by search).
    go: function (hash, el) { pendingEl = el; if (location.hash === hash) { route(); } else { location.replace(hash); } }
  };

  window.addEventListener('hashchange', route, false);
  // The first route waits for every script on the page (tools.js adds the deck and search), however slowly they load.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route, false); else route();

  // The splash stays until the brand faces are in, so the first screen never shows a fallback font.
  var splash = document.getElementById('splash');
  function hide() {
    if (!splash) return;
    addClass(splash, 'gone');
    reveal();
    var s = splash; splash = null;
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 500);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { setTimeout(hide, 350); });
    setTimeout(hide, 2500);
  } else {
    setTimeout(hide, 900);
  }
})();
