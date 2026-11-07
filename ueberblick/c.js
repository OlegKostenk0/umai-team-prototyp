// Entwurf C · Kosmos-Netz: alle Ressorts und Mitglieder gleichzeitig, rechts das ganze Ressort.
// Koordinaten im 720×760-Raster, Positionen als Prozent, damit das Netz mitskaliert.
(function () {
  'use strict';
  var U = window.UMAI, el = U.el, R = U.RESSORTS;
  var app = document.getElementById('app');
  var W = 720, H = 760, CX = 360, CY = 380, RR = 205, GRAD = Math.PI / 180;
  var state = { r: 4, p: 1, gedreht: -1 };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function px(x) { return (x / W * 100) + '%'; }
  function py(y) { return (y / H * 100) + '%'; }

  app.appendChild(el('div', { class: 'kopf' }, [
    el('div', { class: 'kopf__text' }, [
      el('p', { class: 'label', text: 'Team · Netzwerk' }),
      el('h2', { class: 'titel', text: 'Ein Netzwerk aus ' + U.gesamt + ' Köpfen' }),
      el('p', { class: 'intro', text: 'Alle Ressorts und Mitglieder gleichzeitig im Netz. Ein Klick auf einen Knoten zeigt rechts das ganze Ressort, ein Klick auf eine Karte dreht sie um.' })
    ])
  ]));

  var svg = el('svg', { class: 'c-linien', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  var netz = el('div', { class: 'c-netz', role: 'group', 'aria-label': 'Netz aller Ressorts und Mitglieder' }, [svg]);

  // Hintergrund-Punkte, fester Zufall, damit das Bild immer gleich ist
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (var i = 0; i < 160; i++) {
    var t = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 360;
    var c = el('circle', { class: 'c-punkt', cx: (CX + d * Math.cos(t)).toFixed(1), cy: (CY + d * Math.sin(t)).toFixed(1), r: rnd() < 0.15 ? 1.6 : 0.9, fill: '#8892A4' });
    c.style.animationDelay = (rnd() * 4).toFixed(2) + 's';
    svg.appendChild(c);
  }

  netz.appendChild(el('div', { class: 'c-hub', 'aria-hidden': 'true' }, [
    el('span', { class: 'c-hub__puls' }),
    el('div', { class: 'c-hub__kern' }, ['UM', el('span', { text: '/' }), 'AI'])
  ]));

  var ressortTeile = [];
  R.forEach(function (r, i) {
    var a = (-90 + i * 60) * GRAD;
    var x = CX + RR * Math.cos(a), y = CY + RR * Math.sin(a);
    var hauptlinie = el('line', { x1: CX, y1: CY, x2: x.toFixed(1), y2: y.toFixed(1), stroke: '#3BFFD4', 'stroke-width': 1 });
    svg.appendChild(hauptlinie);
    svg.appendChild(el('line', { class: 'c-fluss', x1: CX, y1: CY, x2: x.toFixed(1), y2: y.toFixed(1), stroke: '#3BFFD4', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 38', 'stroke-opacity': 0.9 }));

    var innen = a + Math.PI, n = r.leute.length, n1 = Math.min(n, 8), n2 = n - n1, span = 290 * GRAD;
    var teile = { knoten: [], linien: [], haupt: hauptlinie };
    r.leute.forEach(function (p, k) {
      var ring2 = k >= n1, cnt = ring2 ? n2 : n1, idx = ring2 ? k - n1 : k, rad = ring2 ? 88 : 50;
      var b = innen + 35 * GRAD + (idx + 0.5) * span / cnt + (ring2 ? 6 * GRAD : 0);
      var mx = x + rad * Math.cos(b), my = y + rad * Math.sin(b);
      var l = el('line', { x1: x.toFixed(1), y1: y.toFixed(1), x2: mx.toFixed(1), y2: my.toFixed(1), stroke: '#3BFFD4', 'stroke-width': 1 });
      svg.appendChild(l);
      teile.linien.push(l);
      var label = p.platzhalter ? 'Mitglied in ' + r.name + ', Name folgt' : p.name + ', ' + p.rolle;
      var knopf = el('button', { type: 'button', class: 'c-knoten', 'aria-label': label, title: label,
        style: { left: px(mx), top: py(my) },
        on: { click: function () { state.r = i; state.p = k; state.gedreht = -1; zeichnen(); } } }, [U.bild(p, '', 14)]);
      netz.appendChild(knopf);
      teile.knoten.push(knopf);
    });

    teile.knopf = el('button', { type: 'button', class: 'c-ressort', 'aria-label': 'Ressort ' + r.name + ' anzeigen', text: r.kurz,
      style: { left: px(x), top: py(y) },
      on: { click: function () { state.r = i; state.p = 0; state.gedreht = -1; zeichnen(); } } });
    netz.appendChild(teile.knopf);
    var lr = RR + 120;
    teile.label = el('span', { class: 'c-label', 'aria-hidden': 'true', text: r.name + ' · ' + n,
      style: { left: px(CX + lr * Math.cos(a)), top: py(CY + lr * Math.sin(a)) } });
    netz.appendChild(teile.label);
    ressortTeile.push(teile);
  });

  var titel = el('h3', {}), zahl = el('span', { class: 'c-panel__zahl' }), desc = el('p', { class: 'c-panel__desc' });
  var karten = el('ul', { class: 'c-karten' });
  var panel = el('div', { class: 'c-panel', 'aria-live': 'polite' }, [
    el('div', { class: 'c-panel__kopf' }, [titel, zahl]), desc, karten
  ]);
  app.appendChild(el('div', { class: 'c-buehne' }, [netz, panel]));

  function karte(p, k) {
    var name = p.platzhalter ? 'Mitglied' : p.name;
    var knopf = el('button', { type: 'button', class: 'c-karte', 'aria-pressed': 'false', 'aria-label': name + ': Karte umdrehen',
      on: { click: function () { state.p = k; state.gedreht = state.gedreht === k ? -1 : k; zeichnen(); } } }, [
      el('span', { class: 'c-flip' }, [
        el('span', { class: 'c-flip__innen' }, [
          el('span', { class: 'c-seite c-seite--vorne' }, [U.bild(p, '', 22)]),
          el('span', { class: 'c-seite c-seite--hinten' }, [
            el('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#3BFFD4', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
              el('rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }), el('circle', { cx: 9, cy: 11, r: 2 }), el('path', { d: 'M21 16l-5-5-8 8' })
            ]),
            'Spaßbild folgt'
          ])
        ])
      ]),
      el('span', { class: 'b-name' + (p.platzhalter ? ' name-ph' : ''), text: p.name }),
      el('span', { class: 'rolle' + (p.hervor ? ' hervor' : ''), text: p.rolle })
    ]);
    return el('li', {}, [knopf]);
  }

  var gezeigt = -1;
  function zeichnen() {
    var r = R[state.r];
    if (gezeigt !== state.r) {
      titel.textContent = r.name;
      zahl.textContent = U.anzahl(r.leute.length);
      desc.textContent = r.desc;
      while (karten.firstChild) karten.removeChild(karten.firstChild);
      r.leute.forEach(function (p, k) { karten.appendChild(karte(p, k)); });
      gezeigt = state.r;
    }
    Array.prototype.forEach.call(karten.querySelectorAll('.c-karte'), function (b, k) {
      b.classList.toggle('gewaehlt', k === state.p);
      b.classList.toggle('gedreht', k === state.gedreht);
      b.setAttribute('aria-pressed', String(k === state.gedreht));
    });
    ressortTeile.forEach(function (t, i) {
      var an = i === state.r;
      t.knopf.setAttribute('aria-pressed', String(an));
      t.label.classList.toggle('aktiv', an);
      t.haupt.setAttribute('stroke-opacity', an ? 0.7 : 0.3);
      t.haupt.setAttribute('stroke-width', an ? 1.5 : 1);
      t.linien.forEach(function (l) { l.setAttribute('stroke-opacity', an ? 0.5 : 0.14); });
      t.knoten.forEach(function (k, j) {
        k.classList.toggle('imressort', an);
        k.classList.toggle('gewaehlt', an && j === state.p);
      });
    });
  }
  zeichnen();
})();
