// Entwurf D · Gesichter-Wand mit Verzeichnis. Hover oder Fokus verknüpft Foto und Namen in beide Richtungen.
(function () {
  'use strict';
  var U = window.UMAI, el = U.el, R = U.RESSORTS;
  var app = document.getElementById('app');
  var state = { sel: -1 };
  var kacheln = {};   // key -> { li, knopf, ressorts: [index] }
  var zeilen = {};    // key -> [li]
  var bloecke = [], chips = [];

  function markieren(key, an) {
    if (kacheln[key]) kacheln[key].knopf.classList.toggle('an', an);
    (zeilen[key] || []).forEach(function (z) { z.classList.toggle('an', an); });
  }
  function hover(key) {
    return { mouseenter: function () { markieren(key, true); }, mouseleave: function () { markieren(key, false); },
      focus: function () { markieren(key, true); }, blur: function () { markieren(key, false); } };
  }

  var chipLeiste = el('div', { class: 'chips', role: 'group', 'aria-label': 'Ressort hervorheben' });
  [{ name: 'Alle', i: -1 }].concat(R.map(function (r, i) { return { name: r.name, i: i }; })).forEach(function (c) {
    var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: c.name,
      on: { click: function () { state.sel = c.i; zeichnen(); } } });
    b.dataset.i = c.i;
    chips.push(b);
    chipLeiste.appendChild(b);
  });

  app.appendChild(el('div', { class: 'kopf' }, [
    el('div', { class: 'kopf__text' }, [
      el('p', { class: 'label', text: 'Team · ' + U.gesamt + ' Köpfe' }),
      el('h2', { class: 'titel', text: 'Alle auf einen Blick.' }),
      el('p', { class: 'intro', text: 'Oben jedes Gesicht, unten wer wofür zuständig ist. Fährt man über ein Foto, leuchtet der Name im Verzeichnis auf, und umgekehrt.' })
    ]),
    chipLeiste
  ]));

  // Wand: jede Person einmal, auch wenn sie in zwei Ressorts ist (Timo)
  var wand = el('ul', { class: 'd-wand', 'aria-label': 'Alle Mitglieder als Fotos' });
  R.forEach(function (r, i) {
    r.leute.forEach(function (p) {
      if (kacheln[p.key]) { kacheln[p.key].ressorts.push(i); return; }
      var info = el('span', { class: 'd-info', 'aria-hidden': 'true' }, [
        el('b', { text: p.platzhalter ? 'Name folgt' : p.name }),
        el('small', { class: p.hervor ? 'hervor' : '', text: r.name })
      ]);
      var knopf = el('button', { type: 'button', class: 'd-kachel', 'aria-label': (p.platzhalter ? 'Mitglied, Name folgt' : p.name) + ', ' + r.name,
        on: hover(p.key) }, [U.bild(p, '', 22), info]);
      var li = el('li', {}, [knopf]);
      kacheln[p.key] = { li: li, knopf: knopf, ressorts: [i], info: info };
      wand.appendChild(li);
    });
  });
  // Doppelrollen in der Info zeigen
  Object.keys(kacheln).forEach(function (key) {
    var k = kacheln[key];
    if (k.ressorts.length > 1) k.info.lastChild.textContent = k.ressorts.map(function (i) { return R[i].name; }).join(' · ');
  });
  app.appendChild(wand);

  app.appendChild(el('div', { class: 'd-trenner' }, [el('h3', { text: 'Wer macht was' }), el('i', { 'aria-hidden': 'true' }), el('span', { text: R.length + ' Ressorts' })]));

  function block(r, i) {
    var kopf = el('button', { type: 'button', class: 'd-block__kopf', 'aria-pressed': 'false',
      on: { click: function () { state.sel = state.sel === i ? -1 : i; zeichnen(); } } }, [
      el('b', { text: r.name }), el('span', { text: String(r.leute.length) })
    ]);
    var b = el('section', { class: 'd-block', 'aria-label': r.name }, [
      kopf,
      el('ul', {}, r.leute.map(function (p) {
        var z = el('li', { class: 'd-zeile', on: hover(p.key) }, [
          el('span', { class: p.platzhalter ? 'name-ph' : '', text: p.name }),
          el('span', { class: 'rolle' + (p.hervor ? ' hervor' : ''), text: p.rolle.indexOf('Head of') === 0 ? 'Head' : (p.rolle.indexOf('Vorstand') >= 0 ? 'Co-Founder' : p.rolle) })
        ]);
        (zeilen[p.key] = zeilen[p.key] || []).push(z);
        return z;
      }))
    ]);
    bloecke[i] = { el: b, kopf: kopf };
    return b;
  }
  // Drei Spalten mit ähnlicher Höhe: AI + Vorstand, Community + Finance, Partnerships + Relations
  var aufteilung = [[4, 0], [3, 2], [1, 5]];
  app.appendChild(el('div', { class: 'd-verzeichnis' }, aufteilung.map(function (sp) {
    return el('div', { class: 'd-spalte' }, sp.map(function (i) { return block(R[i], i); }));
  })));

  function zeichnen() {
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(Number(c.dataset.i) === state.sel)); });
    bloecke.forEach(function (b, i) {
      b.el.classList.toggle('gedimmt', state.sel >= 0 && state.sel !== i);
      b.kopf.setAttribute('aria-pressed', String(state.sel === i));
    });
    Object.keys(kacheln).forEach(function (key) {
      var k = kacheln[key];
      k.li.classList.toggle('gedimmt', state.sel >= 0 && k.ressorts.indexOf(state.sel) < 0);
    });
  }
  zeichnen();
})();
