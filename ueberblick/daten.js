// UM/AI Team-Seite, Entwürfe „Überblick“ (Issue #115): gemeinsame Daten und Helfer.
// Teamliste von Timo (Stand 07.11.2026). Fotos gibt es bisher nur von Vorstand, Heads und Oleg,
// die übrigen kommen aus der Cockpit-Umfrage. Bis dahin zeigen die Karten Initialen.
// Julie Zier fehlt bewusst: Elisabeth übernimmt Community & Events, Julies Status ist offen.
// Texte nur per textContent, kein innerHTML.

window.UMAI = (function () {
  'use strict';

  var FOTO = '../assets/team/';
  var UC = 'AI Projects', LE = 'AI Learning';
  function mitglieder(namen, team) {
    return namen.map(function (n) { return [n, 'Mitglied', '', team || '']; });
  }

  // Reihenfolge nicht ändern: Entwurf D verteilt die Ressorts per Index auf die Spalten.
  var RESSORTS = [
    { id: 'vorstand', name: 'Vorstand', kurz: 'VS', desc: 'Strategie, Gesamtverantwortung und Vertretung nach außen',
      m: [['Timo Löschner', 'Vorstand · Lead AI', 'timo-loeschner'], ['Don Didszuleit', 'Vorstand · Lead Community & Events und Relations', 'don-didszuleit']] },
    { id: 'partnerships', name: 'Partnerships', kurz: 'PA', desc: 'Unternehmen, Workshops und Sponsoring',
      m: [['Elias Wiemer', 'Head of Partnerships', 'elias-wiemer']].concat(mitglieder([
        'Lukas Beermann', 'Mats Glumm', 'Rico Graf', 'Michael Gref', 'Marco Kaspar', 'Julius Müller',
        'Maximilian Schubert', 'Miron Drewinski', 'Timo Winter', 'Louis N.', 'Santi C.'])) },
    { id: 'finance', name: 'Finance', kurz: 'FI', desc: 'Budget, Buchführung, Beiträge und Förderung',
      m: [['Nico Hinz', 'Head of Finance', 'nico-hinz']].concat(mitglieder(['Lukas Maurer'])) },
    { id: 'community', name: 'Community & Events', kurz: 'CE', desc: 'Mitglieder, Onboarding und Veranstaltungen',
      m: [['Elisabeth von Falkenhausen', 'Head of Community & Events', '']].concat(mitglieder([
        'Laura Adler', 'Tamás Fogarasi-Krauss', 'Carlo Grüne', 'Wanja Kraus', 'Nicolas Pfaadt', 'Merle Radowski'])) },
    { id: 'ai', name: 'AI', kurz: 'AI', desc: 'Use Cases, Projekte und Lernangebote rund um KI',
      teams: [UC, LE],
      m: [['Timo Löschner', 'Lead AI', 'timo-loeschner', UC], ['Nico Hinz', 'Lead AI', 'nico-hinz', UC]].concat(
        mitglieder(['Florian Backmann', 'Joris Brüggemann', 'Oleg Kostenko', 'Maximilian Leinert', 'Julia Matheis',
          'Lena Meier', 'Marek Resch', 'Mara Schneider', 'Yanik Stettner', 'Justus Wiemann'], UC),
        mitglieder(['Lukas Bachmann', 'Tim Franczewski', 'Felix Schiener', 'Tim Matthias Sielaff', 'Malte Suntrup'], LE)) },
    { id: 'relations', name: 'Relations', kurz: 'RE', desc: 'Marketingkanäle, Social Media und Uni-Netzwerk',
      m: [['Luisa Manderbach', 'Lead Relations', 'luisa-manderbach']].concat(mitglieder([
        'Max Böttger', 'Phuong-Ngan Bui', 'Felicitas Holl', 'Melina Lind', 'Benet Mertel', 'Charlotte von Reuss', 'Jakob Winzig'])) }
  ];
  // Fotos, die schon da sind (Oleg ist einfaches Mitglied, hat aber eins)
  var VORHANDEN = { 'Oleg Kostenko': 'oleg-kostenko' };

  function initialen(name) {
    var t = name.replace(/\./g, '').split(' ').filter(Boolean);
    return (t[0].charAt(0) + (t.length > 1 ? t[t.length - 1].charAt(0) : '')).toUpperCase();
  }

  // Personen-Objekte: key = gleiche Person über Ressorts hinweg (Timo, Nico).
  RESSORTS.forEach(function (r, i) {
    r.index = i;
    r.leute = r.m.map(function (p, k) {
      var slug = p[2] || VORHANDEN[p[0]] || '';
      return {
        name: p[0], rolle: p[1], ressort: r, k: k, team: p[3] || '',
        foto: slug ? FOTO + slug + '.jpg' : '',
        platzhalter: false,
        key: p[0],
        hervor: /Head of|Lead|Vorstand/.test(p[1]),
        initial: initialen(p[0])
      };
    });
  });

  // Mitglieder = Einträge je Ressort (Timo und Nico zählen in beiden Ressorts mit, Stand Teamliste: 48)
  var gesamt = 0;
  RESSORTS.forEach(function (r) { gesamt += r.leute.length; });

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
