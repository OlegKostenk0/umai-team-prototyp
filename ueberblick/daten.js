// UM/AI Team-Seite, Entwürfe „Überblick“ (Issue #115): gemeinsame Daten und Helfer.
// 48 Plätze. Echte Fotos gibt es bisher nur von Vorstand, Heads und Oleg, der Rest sind Platzhalter.
// Die Verteilung auf die Ressorts ist eine Annahme, bis die Cockpit-Umfrage zurück ist.
// Texte nur per textContent, kein innerHTML.

window.UMAI = (function () {
  'use strict';

  var FOTO = '../assets/team/';
  function fill(m, n) {
    while (m.length < n) m.push(['[Name]', 'Mitglied', '']);
    return m;
  }

  var RESSORTS = [
    { id: 'vorstand', name: 'Vorstand', kurz: 'VS', desc: 'Strategie, Gesamtverantwortung und Vertretung nach außen',
      m: [['Timo Löschner', 'Co-Founder · Vorstand', 'timo-loeschner'], ['Don Didszuleit', 'Co-Founder · Vorstand', 'don-didszuleit']] },
    { id: 'partnerships', name: 'Partnerships', kurz: 'PA', desc: 'Unternehmen, Workshops und Sponsoring',
      m: fill([['Elias Wiemer', 'Head of Partnerships', 'elias-wiemer']], 9) },
    { id: 'finance', name: 'Finance', kurz: 'FI', desc: 'Budget, Buchführung, Beiträge und Förderung',
      m: fill([['Nico Hinz', 'Head of Finance', 'nico-hinz']], 6) },
    { id: 'community', name: 'Community & Events', kurz: 'CE', desc: 'Mitglieder, Onboarding und Veranstaltungen',
      m: fill([['Elisabeth [Nachname]', 'Head of Community & Events', '']], 10) },
    { id: 'ai', name: 'AI', kurz: 'AI', desc: 'Use Cases, Technik und inhaltliche Qualität',
      m: fill([['Timo Löschner', 'Head of AI', 'timo-loeschner'], ['Oleg Kostenko', 'AI Developer', 'oleg-kostenko']], 14) },
    { id: 'relations', name: 'Relations', kurz: 'RE', desc: 'Marketingkanäle, Social Media und Uni-Netzwerk',
      m: fill([['Luisa Manderbach', 'Head of Relations', 'luisa-manderbach']], 8) }
  ];

  // Personen-Objekte: platzhalter = noch kein Name, key = gleiche Person über Ressorts hinweg.
  RESSORTS.forEach(function (r, i) {
    r.index = i;
    r.leute = r.m.map(function (p, k) {
      var platzhalter = p[0] === '[Name]';
      return {
        name: p[0], rolle: p[1], ressort: r, k: k,
        foto: p[2] ? FOTO + p[2] + '.jpg' : '',
        platzhalter: platzhalter,
        key: platzhalter ? r.id + '-' + k : p[0],
        hervor: /Head of|Vorstand/.test(p[1]),
        initial: platzhalter ? '' : p[0].charAt(0)
      };
    });
  });

  var namen = {};
  var gesamt = 0;
  RESSORTS.forEach(function (r) {
    r.leute.forEach(function (p) {
      if (!namen[p.key]) { namen[p.key] = true; gesamt++; }
    });
  });

  // Kleiner DOM-Baukasten: el('div', { class: 'x', text: 'Hallo', on: { click: fn } }, [kinder])
  function el(tag, opt, kinder) {
    var svgTags = { svg: 1, circle: 1, line: 1, path: 1, rect: 1, g: 1 };
    var n = svgTags[tag] ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    opt = opt || {};
    Object.keys(opt).forEach(function (a) {
      var v = opt[a];
      if (a === 'text') n.textContent = v;
      else if (a === 'on') Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else if (a === 'style') Object.keys(v).forEach(function (s) { n.style.setProperty(s, v[s]); });
      else if (v !== undefined && v !== null && v !== false) n.setAttribute(a, v === true ? '' : v);
    });
    (kinder || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function personIcon(size) {
    return el('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#6A7184', 'stroke-width': '1.5', 'aria-hidden': 'true' }, [
      el('circle', { cx: 12, cy: 8, r: 4 }),
      el('path', { d: 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6' })
    ]);
  }

  // Foto oder Platzhalter. form: 'rund' oder 'eckig'
  function bild(p, cls, iconSize) {
    if (p.foto) return el('img', { class: cls, src: p.foto, alt: '', loading: 'lazy', decoding: 'async' });
    return el('span', { class: cls + ' platzhalter', 'aria-hidden': 'true' }, [p.initial ? p.initial : personIcon(iconSize || 22)]);
  }

  function anzahl(n) { return n + (n === 1 ? ' Person' : ' Personen'); }

  return { RESSORTS: RESSORTS, gesamt: gesamt, el: el, bild: bild, anzahl: anzahl, personIcon: personIcon };
})();
