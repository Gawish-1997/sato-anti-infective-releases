/* Sato Anti-Infective — the doctor's speciality.
   The rep picks it every time the app opens. It decides which products appear and which
   parts of each product are shown: anything marked data-sp="..." is shown only to the
   specialities it lists. ES5 only; runs before app.js. */
(function () {
  var html = document.documentElement;
  var LIST = [
    { id: 'uro', name: 'Urology', pr: ['roya'] },
    { id: 'chest', name: 'Chest', pr: ['roya'] },
    { id: 'im', name: 'IM / GP', pr: ['roya', 'sag'] },
    { id: 'ent', name: 'ENT', pr: ['roya', 'sag'] },
    { id: 'neuro', name: 'Neurology', pr: ['sag'] },
    { id: 'surg', name: 'Surgery', pr: ['roya'] }
  ];
  var BY = {};
  for (var i = 0; i < LIST.length; i++) BY[LIST[i].id] = LIST[i];

  function store(k, v) {
    try {
      var s = k.charAt(0) === '!' ? window.sessionStorage : window.localStorage;
      k = k.replace('!', '');
      if (v === undefined) return s.getItem(k);
      s.setItem(k, v);
    } catch (e) { return null; }
    return null;
  }
  function addClass(el, c) { if ((' ' + el.className + ' ').indexOf(' ' + c + ' ') < 0) el.className = (el.className ? el.className + ' ' : '') + c; }
  function removeClass(el, c) { el.className = (' ' + el.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }

  var asked = /[?&]sp=([a-z]+)/.exec(location.search || '');
  var cur = asked && BY[asked[1]] ? asked[1] : (BY[store('sato-sp')] ? store('sato-sp') : 'im');
  var hooks = [];

  function apply(id) {
    cur = id;
    html.setAttribute('data-sp', id);
    var c = BY[id];
    html.className = html.className.replace(/\s*\bpr-\w+/g, '');
    addClass(html, c.pr.length > 1 ? 'pr-both' : 'pr-' + c.pr[0]);
  }
  apply(cur);

  var SP = window.SatoSp = {
    list: LIST,
    current: function () { return cur; },
    name: function (id) { return BY[id || cur].name; },
    // Is this product (roya / sag) shown to the chosen speciality?
    has: function (pr) { return BY[cur].pr.join(' ').indexOf(pr) >= 0; },
    both: function () { return BY[cur].pr.length > 1; },
    // Is this element shown to the chosen speciality? Walks up through its parents.
    shows: function (el) {
      for (var p = el; p && p.getAttribute; p = p.parentNode) {
        var a = p.getAttribute('data-sp');
        if (a && (' ' + a + ' ').indexOf(' ' + cur + ' ') < 0) return false;
      }
      return true;
    },
    on: function (f) { hooks.push(f); },
    choose: function (id) {
      if (!BY[id]) return;
      apply(id);
      store('sato-sp', id);
      store('!sato-sp-chosen', '1');
      removeClass(html, 'sp-pick');
      paint();
      for (var k = 0; k < hooks.length; k++) hooks[k](id);
    },
    ask: function () { paint(); addClass(html, 'sp-pick'); }
  };

  // Every time the app opens: once per app session, unless a test opens it with ?sp=.
  if (!asked && !store('!sato-sp-chosen')) addClass(html, 'sp-pick');

  function paint() {
    var lab = document.getElementById('sp-chip-t');
    if (lab) lab.innerHTML = BY[cur].name;
    var eb = document.getElementById('sp-eyebrow');
    if (eb) eb.innerHTML = BY[cur].name;
    var rows = document.querySelectorAll ? document.querySelectorAll('#sp-pick a[data-pick]') : [];
    for (var r = 0; r < rows.length; r++) {
      if (rows[r].getAttribute('data-pick') === cur && store('sato-sp')) addClass(rows[r], 'last'); else removeClass(rows[r], 'last');
    }
    var lf = document.querySelectorAll ? document.querySelectorAll('a[data-leaflets]') : [];
    for (var l = 0; l < lf.length; l++) lf[l].setAttribute('href', 'viewer.html#' + (SP.has('roya') ? 'roya' : 'sag'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    paint();
    var pick = document.getElementById('sp-pick');
    if (pick) pick.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== pick && !(t.getAttribute && t.getAttribute('data-pick'))) t = t.parentNode;
      if (!t || t === pick) return;
      e.preventDefault();
      SP.choose(t.getAttribute('data-pick'));
    }, false);
    var chip = document.getElementById('sp-chip');
    if (chip) chip.addEventListener('click', function (e) { e.preventDefault(); SP.ask(); }, false);
  }, false);
})();
