// Entwurf A · Struktur-Spalten
(function () {
  'use strict';
  var U = window.UMAI, el = U.el, R = U.RESSORTS;
  var app = document.getElementById('app');

  function person(p) {
    return el('li', { class: 'a-person' }, [
      U.bild(p, 'a-foto', 16),
      el('div', {}, [
        el('span', { class: 'a-person__name' + (p.platzhalter ? ' name-ph' : ''), text: p.name }),
        el('span', { class: 'rolle' + (p.hervor ? ' hervor' : ''), text: p.rolle })
      ])
    ]);
  }
  function karte(r, extra) {
    return el('article', { class: 'a-karte ' + (extra || '') }, [
      el('div', { class: 'a-karte__kopf' }, [el('h3', { text: r.name }), el('span', { class: 'a-karte__zahl', text: U.anzahl(r.leute.length) })]),
      el('p', { class: 'a-karte__desc', text: r.desc }),
      el('ul', { class: 'a-liste' }, r.leute.map(person))
    ]);
  }

  app.appendChild(el('div', { class: 'kopf' }, [
    el('div', { class: 'kopf__text' }, [
      el('p', { class: 'label', text: '~/um-ai $ tree team' }),
      el('h2', { class: 'titel', text: 'Das Team hinter UM/AI' }),
      el('p', { class: 'intro', text: 'Sechs Ressorts, ein Netzwerk. Auf einen Blick sehen, wer wofür zuständig ist und wen man ansprechen kann.' })
    ]),
    el('dl', { class: 'a-stats' }, [
      el('div', {}, [el('dt', { text: 'Ressorts' }), el('dd', { text: String(R.length) })]),
      el('div', {}, [el('dt', { text: 'Mitglieder' }), el('dd', { text: String(U.gesamt) })])
    ])
  ]));

  app.appendChild(el('div', { class: 'a-baum' }, [
    karte(R[0], 'a-vorstand'),
    el('div', { class: 'a-strich', 'aria-hidden': 'true' }),
    el('div', { class: 'a-reihe' }, [
      el('div', { class: 'a-spalten' }, R.slice(1).map(function (r) {
        return el('div', { class: 'a-spalte' }, [karte(r)]);
      }))
    ])
  ]));
})();
