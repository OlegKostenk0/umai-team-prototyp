// Entwurf B · Porträt-Mosaik mit Filter und Suche. Filter dimmen nur, nichts verschwindet.
(function () {
  'use strict';
  var U = window.UMAI, el = U.el, R = U.RESSORTS;
  var app = document.getElementById('app');
  var state = { sel: 'alle', q: '' };
  var chips = [], zeilen = [], personen = [];

  app.appendChild(el('div', { class: 'kopf' }, [
    el('div', { class: 'kopf__text' }, [
      el('p', { class: 'label', text: 'Team · ' + U.gesamt + ' Mitglieder in ' + R.length + ' Ressorts' }),
      el('h2', { class: 'titel', text: 'Die Menschen hinter UM/AI' }),
      el('p', { class: 'intro', text: 'Alle Gesichter auf einen Blick, geordnet nach Ressort. Filter und Suche heben hervor, ohne den Überblick zu verlieren.' })
    ])
  ]));

  function chip(id, label, n) {
    var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', on: { click: function () {
      state.sel = (state.sel === id && id !== 'alle') ? 'alle' : id; zeichnen();
    } } }, [label, el('span', { class: 'zahl', text: String(n) })]);
    b.dataset.id = id;
    chips.push(b);
    return b;
  }
  var eingabe = el('input', { type: 'search', placeholder: 'Name oder Rolle', 'aria-label': 'Person oder Rolle suchen',
    on: { input: function (e) { state.q = e.target.value; zeichnen(); } } });
  app.appendChild(el('div', { class: 'b-leiste' }, [
    el('div', { class: 'chips', role: 'group', 'aria-label': 'Nach Ressort filtern' },
      [chip('alle', 'Alle', U.gesamt)].concat(R.map(function (r) { return chip(r.id, r.name, r.leute.length); }))),
    el('label', { class: 'suche' }, [
      el('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#8892A4', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
        el('circle', { cx: 11, cy: 11, r: 7 }), el('path', { d: 'M20 20l-3.5-3.5' })
      ]),
      eingabe
    ])
  ]));

  var liste = el('div', {});
  R.forEach(function (r) {
    var z = el('section', { class: 'b-zeile', 'aria-label': r.name }, [
      el('div', { class: 'b-info' }, [
        el('h3', { text: r.name }),
        el('span', { text: U.anzahl(r.leute.length) }),
        el('small', { text: r.desc })
      ]),
      el('ul', { class: 'b-raster' }, r.leute.map(function (p) {
        var li = el('li', { class: 'b-person' }, [
          U.bild(p, 'b-foto', 24),
          el('span', { class: 'b-name' + (p.platzhalter ? ' name-ph' : ''), text: p.name }),
          el('span', { class: 'rolle' + (p.hervor ? ' hervor' : ''), text: p.rolle })
        ]);
        personen.push({ li: li, text: (p.platzhalter ? '' : p.name + ' ' + p.rolle).toLowerCase() });
        return li;
      }))
    ]);
    z.dataset.id = r.id;
    zeilen.push(z);
    liste.appendChild(z);
  });
  app.appendChild(liste);

  app.appendChild(el('aside', { class: 'abschluss' }, [
    el('div', {}, [el('h3', { text: 'Hier ist noch Platz für dich.' }), el('p', { text: 'Jedes Ressort sucht Leute, die mitgestalten wollen.' })]),
    el('a', { class: 'knopf', href: '#', text: 'Jetzt bewerben' })
  ]));

  function zeichnen() {
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.id === state.sel)); });
    zeilen.forEach(function (z) {
      var an = state.sel === 'alle' || state.sel === z.dataset.id;
      z.classList.toggle('gedimmt', !an);
      z.classList.toggle('aktiv', state.sel === z.dataset.id);
    });
    var q = state.q.trim().toLowerCase();
    personen.forEach(function (p) {
      var treffer = q && p.text.indexOf(q) >= 0;
      p.li.classList.toggle('treffer', !!treffer);
      p.li.classList.toggle('gedimmt', !!q && !treffer);
    });
  }
  zeichnen();
})();
