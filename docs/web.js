/* Sato Anti-Infective — the web version (iPhone, iPad, computers).
   Added only to the copy published on the web; the Android app never loads it.
   It stands in for what the Android side does: offline use, full screen while presenting,
   keeping the screen awake, sharing leaflet pages, and the version line. */
(function () {
  var APK = 'https://github.com/Gawish-1997/sato-anti-infective-releases/raw/main/Sato-Anti-Infective.apk';
  var html = document.documentElement;
  html.className += ' web';

  // Works offline after the first visit.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  function addClass(el, c) { if ((' ' + el.className + ' ').indexOf(' ' + c + ' ') < 0) el.className += ' ' + c; }
  function removeClass(el, c) { el.className = (' ' + el.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }

  /* ---------- the version line on the home screen ---------- */
  var ver = document.getElementById('ver');
  if (ver) {
    var show = function (v) {
      ver.innerHTML = 'Version ' + v + ' · web' + '<a href="' + APK + '" id="ver-apk">Get the Android app</a>';
      addClass(ver, 'on');
    };
    fetch('version.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
      .then(function (j) { show(String(j.versionName).replace(/[^0-9.]/g, '')); })
      .catch(function () {});
  }

  /* ---------- presenting ---------- */
  var S = window.Sato;
  if (S && S.on) {
    var hint = document.getElementById('dk-hint');
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (hint) hint.innerHTML = coarse ? 'Swipe, or tap the left or right edge.' : 'Use the arrow keys, or click the left or right edge.';
    var deck = document.getElementById('deck');
    if (deck && coarse) {
      var turn = document.createElement('div');
      turn.className = 'dk-turn';
      turn.id = 'dk-turn';
      turn.innerHTML = '<i></i>Turn your phone sideways for a bigger view.';
      deck.appendChild(turn);
    }
    var lock = null;
    var full = function (on) {
      var d = document, el = d.documentElement;
      try {
        if (on && !d.fullscreenElement && !d.webkitFullscreenElement) {
          var p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
          if (p && p.then) {
            p.then(function () {
              if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
            }).catch(function () {});
          }
        } else if (!on && (d.fullscreenElement || d.webkitFullscreenElement)) {
          if (d.exitFullscreen) d.exitFullscreen().catch(function () {}); else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
        }
      } catch (e) {}
    };
    var awake = function (on) {
      try {
        if (on && navigator.wakeLock && !lock) {
          navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
        } else if (!on && lock) { lock.release(); lock = null; }
      } catch (e) {}
    };
    S.on(function (id, prev) {
      if (id === 'deck' && prev !== 'deck') { full(true); awake(true); }
      else if (prev === 'deck' && id !== 'deck') { full(false); awake(false); }
    });
    // The screen lock is dropped whenever the page is hidden; take it again on return.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && S.current && S.current() === 'deck') awake(true);
    });
  }

  /* ---------- sharing the approved leaflet pages ---------- */
  var pages = document.getElementById('pages');
  if (pages) {
    var counts = { roya: 8, sag: 2 };
    var names = { roya: 'Royafloxacin 500 mg', sag: 'Saginkgo 120 mg' };
    var files = {};   // ready-made page files, so the share sheet opens straight from the tap
    var load = function (doc, n) {
      var key = doc + '-' + n;
      if (files[key]) return Promise.resolve(files[key]);
      return fetch('pages/' + key + '.jpg').then(function (r) { return r.blob(); }).then(function (b) {
        files[key] = new File([b], names[doc].replace(/ /g, '-') + '-page-' + n + '.jpg', { type: 'image/jpeg' });
        return files[key];
      });
    };
    var warm = function () {
      var d = (location.hash || '#roya').substring(1);
      if (!counts[d]) return;
      for (var i = 1; i <= counts[d]; i++) load(d, i).catch(function () {});
    };
    var save = function (list) {
      for (var i = 0; i < list.length; i++) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(list[i]);
        a.download = list[i].name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    var send = function (list, text) {
      if (navigator.canShare && navigator.canShare({ files: list })) {
        navigator.share({ files: list, title: text, text: text }).catch(function (e) {
          if (!e || e.name !== 'AbortError') save(list);
        });
      } else {
        save(list);
      }
    };
    pages.addEventListener('click', function (e) {
      var a = e.target;
      while (a && a !== pages && a.tagName !== 'A') a = a.parentNode;
      if (!a || a.tagName !== 'A') return;
      var m = /^sato:\/\/share\/(roya|sag)\/(all|\d+)$/.exec(a.getAttribute('href') || '');
      if (!m) return;
      e.preventDefault();
      var doc = m[1], total = counts[doc], list = [], i;
      var nums = [];
      if (m[2] === 'all') { for (i = 1; i <= total; i++) nums.push(i); } else { nums.push(+m[2]); }
      var text = names[doc] + ' — approved leaflet, ' + (m[2] === 'all' ? 'all ' + total + ' pages' : 'page ' + m[2] + ' of ' + total);
      for (i = 0; i < nums.length; i++) { if (files[doc + '-' + nums[i]]) list.push(files[doc + '-' + nums[i]]); }
      if (list.length === nums.length) { send(list, text); return; }
      Promise.all(nums.map(function (n) { return load(doc, n); })).then(function (l) { send(l, text); }).catch(function () {});
    }, true);
    window.addEventListener('hashchange', warm, false);
    warm();
  }
})();
