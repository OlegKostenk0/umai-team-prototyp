// Team-Seite · Kosmos (Entwurf C, Timos Idee): Logo mit Vorstand in der Mitte, Ressorts schweben im Kosmos,
// rechts das ganze Ressort mit Karten zum Umdrehen. Dazu automatischer Ressort-Wechsel (7,5 s)
// und „Alle Mitglieder anzeigen“ mit Suche und Filter.
// Vier Varianten zur Abstimmung, gewählt über <body data-variante="…">:
//   gehirn       – Gehirn mit getrennten Hälften, Ressorts frei verteilt, Mitglieder in Ringen
//   galaxie      – Spiralgalaxie, Ressorts im Fünfeck, Mitglieder als Sonnenblumen-Spirale
//   neuronen     – Neuronales Netz in Schichten mit Signalen, Ressorts im Fünfeck, Mitglieder als Fächer nach außen
//   wellen       – schwingendes Wellengitter, Ressorts in zwei Reihen, Mitglieder als Bienenwabe
// Texte nur per textContent, kein innerHTML, keine Inline-Skripte.
(function () {
  'use strict';
  var U = window.UMAI, el = U.el, R = U.RESSORTS;
  var app = document.getElementById('app');
  var W = 720, H = 760, BOX = 240, CX = 360, CY = 385;
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var handy = window.matchMedia('(max-width: 767px)').matches;
  var INTERVALL = 7500;

  function fuenfeck(start, rad, dy) {
    dy = dy || 0;
    var ids = ['ai', 'partnerships', 'finance', 'community', 'relations'], o = {};
    ids.forEach(function (id, k) {
      var a = (start + k * 72) * Math.PI / 180;
      o[id] = [CX + rad * Math.cos(a), CY + dy + rad * Math.sin(a) * 1.02];
    });
    o.vorstand = [CX, CY];
    return o;
  }
  var VARIANTEN = {
    gehirn: { kosmos: 'gehirn', anordnung: 'ringe', label: 'oben',
      orte: { vorstand: [360, 385], ai: [178, 208], partnerships: [560, 192], finance: [602, 470], community: [488, 640], relations: [196, 590] } },
    galaxie: { kosmos: 'galaxie', anordnung: 'spirale', label: 'aussen', orte: fuenfeck(-90, 226, 22) },
    // Neuronales Netz: Schichten von Neuronen wie in einem KI-Modell, Signale laufen hindurch
    neuronen: { kosmos: 'neuronen', anordnung: 'faecher', label: 'innen', orte: fuenfeck(-54, 228), schlicht: true },
    // Orbit-Karte: feine Kreisbahnen um das Logo wie eine Sternkarte, Ressorts liegen auf einer Bahn
    karte: { kosmos: 'karte', anordnung: 'ringe', label: 'aussen', orte: fuenfeck(-90, 230), schlicht: true },
    // Team-Kacheln: Fotos als abgerundete Kacheln in einem ordentlichen Block neben dem Ressort
    kacheln: { kosmos: 'gehirn', anordnung: 'kacheln', label: 'kachel',
      orte: { vorstand: [360, 400], ai: [130, 92], relations: [360, 92], partnerships: [590, 92], community: [220, 694], finance: [500, 694] } },
    // Schwebend: Ressorts mit ihren Mitgliedern schweben frei um das Logo, ganz ohne Linien
    schwebend: { kosmos: 'gehirn', anordnung: 'ringe', label: 'aussen', orte: fuenfeck(-90, 232), ohneLinien: true },
    // Perlenkranz: jedes Team als geschlossener Kranz um sein Ressort, die Größe zeigt die Teamgröße
    kranz: { kosmos: 'gehirn', anordnung: 'kranz', label: 'oben',
      orte: { vorstand: [360, 385], ai: [178, 205], partnerships: [560, 192], finance: [602, 470], community: [488, 640], relations: [196, 590] } },
    // Platine: Punktraster wie Millimeterpapier, Leiterbahnen vom Logo zu den Ressorts
    platine: { kosmos: 'platine', anordnung: 'waben', label: 'aussen', schlicht: true,
      orte: { vorstand: [360, 400], ai: [128, 170], relations: [360, 150], partnerships: [592, 170], community: [200, 610], finance: [520, 610] } },
    // Wellenfeld: schwingendes Gitter wie eine Klangwelle, Ressorts in zwei Reihen, Mitglieder als Bienenwabe
    wellen: { kosmos: 'wellen', anordnung: 'waben', label: 'aussen', schlicht: true,
      orte: { vorstand: [360, 400], ai: [128, 170], relations: [360, 150], partnerships: [592, 170], community: [200, 610], finance: [520, 610] } }
  };
  // Sechseck-Raster für die Wabe: Abstand 44, sortiert von innen nach außen
  var WABEN = (function () {
    var z = [], d = 44;
    for (var q = -3; q <= 3; q++) for (var r2 = -3; r2 <= 3; r2++) {
      var s = -q - r2;
      if (Math.max(Math.abs(q), Math.abs(r2), Math.abs(s)) === 0 || Math.max(Math.abs(q), Math.abs(r2), Math.abs(s)) > 2) continue;
      var x = d * (q + r2 / 2), y = d * r2 * Math.sqrt(3) / 2;
      z.push({ r: Math.hypot(x, y), w: Math.atan2(y, x) - Math.PI / 2 });
    }
    z.sort(function (a, b) { return a.r - b.r || a.w - b.w; });
    return z;
  })();
  var V = VARIANTEN[document.body.getAttribute('data-variante')] || VARIANTEN.gehirn;
  var REIHE = ['vorstand', 'ai', 'partnerships', 'finance', 'community', 'relations'].map(function (id) {
    return R.findIndex(function (r) { return r.id === id; });
  });

  var state = { r: REIHE[1], p: -1, gedreht: -1 };
  function pct(v, ganz) { return (v / ganz * 100) + '%'; }

  app.appendChild(el('div', { class: 'kopf' }, [
    el('div', { class: 'kopf__text' }, [
      el('p', { class: 'label', text: 'Team · Netzwerk' }),
      el('h2', { class: 'titel', text: 'Ein Netzwerk aus ' + U.gesamt + ' Köpfen' }),
      el('p', { class: 'intro', text: 'Alle Ressorts und Mitglieder gleichzeitig im Kosmos. Ein Klick auf ein Ressort zeigt rechts das ganze Team, ein Klick auf eine Karte dreht sie um.' })
    ])
  ]));

  var leinwand = el('canvas', { class: 'c-kosmos', 'aria-hidden': 'true' });
  var netz = el('div', { class: 'c-netz' + (V.schlicht ? ' c-netz--schlicht' : '') + (V.ohneLinien ? ' c-netz--schwebend' : ''), role: 'group', 'aria-label': 'Kosmos aller Ressorts und Mitglieder' }, [leinwand]);

  var cluster = [], hubTeil = null;
  function waehlen(i, k, vonHand) {
    state.r = i; state.p = k; state.gedreht = -1;
    if (vonHand) autoStoppen();
    zeichnen();
  }

  // ── Ressorts und Mitglieder ──
  R.forEach(function (r, i) {
    var ort = V.orte[r.id], istHub = r.id === 'vorstand';
    var box = el('div', { class: istHub ? 'c-hub' : 'c-cluster' });
    box.style.left = pct(ort[0], W);
    box.style.top = pct(ort[1], H);
    if (!istHub) {
      box.style.animationDuration = (8 + i * 0.7) + 's, 0.9s';
      box.style.animationDelay = (-i * 1.7) + 's, ' + (0.6 + i * 0.12) + 's';
    }
    var linien = el('svg', { viewBox: '0 0 ' + BOX + ' ' + BOX, 'aria-hidden': 'true' });
    box.appendChild(linien);

    var aus = Math.atan2(ort[1] - CY, ort[0] - CX); // Richtung vom Logo weg
    var n = r.leute.length, knoten = [], reihe1 = [], reihe2 = [], monde = [];
    var art = istHub ? 'hub' : V.anordnung;
    var faecher = art === 'faecher';
    var n1 = faecher ? Math.min(n, 6) : Math.min(n, 8);
    var aussenRad = 0;
    r.leute.forEach(function (p, k) {
      var rad, w, zweite = false;
      if (art === 'hub') {
        rad = 96; w = k === 0 ? Math.PI : 0;
      } else if (art === 'spirale') {
        // Sonnenblumen-Spirale: jedes Mitglied um den goldenen Winkel weitergedreht
        rad = 22 * Math.sqrt(k + 8); w = k * 2.39996 + i;
      } else if (art === 'kacheln') {
        // Block aus Kacheln unter (obere Reihe) bzw. über (untere Reihe) dem Ressort
        var spalten = n <= 2 ? 2 : n <= 12 ? 4 : 5, zeile = Math.floor(k / spalten), sp = k % spalten;
        var inZeile = Math.min(spalten, n - zeile * spalten), richtung = ort[1] < CY ? 1 : -1;
        var kx = (sp - (inZeile - 1) / 2) * 36, ky = richtung * (26 + 20 + 17 + zeile * 36);
        rad = Math.hypot(kx, ky); w = Math.atan2(ky, kx);
      } else if (art === 'kranz') {
        // Geschlossener Kranz, Fotos berühren sich fast
        rad = Math.max(50, n * 36 / (2 * Math.PI)); w = -Math.PI / 2 + k * 2 * Math.PI / n;
      } else if (art === 'waben') {
        // Bienenwabe: Mitglieder auf einem Sechseck-Raster um das Ressort, innen zuerst
        var zelle = WABEN[k];
        rad = zelle.r; w = zelle.w;
      } else {
        zweite = k >= n1;
        var cnt = zweite ? n - n1 : n1, j = zweite ? k - n1 : k;
        rad = faecher ? (zweite ? 100 : 62) : (zweite ? 86 : 50);
        if (faecher) {
          var span = (zweite ? 220 : 200) * Math.PI / 180;
          w = aus - span / 2 + (j + 0.5) * span / cnt;
        } else {
          w = -Math.PI / 2 + (j + (zweite ? 0.5 : 0)) * 2 * Math.PI / cnt + i * 0.4;
        }
      }
      aussenRad = Math.max(aussenRad, rad);
      var x = BOX / 2 + rad * Math.cos(w), y = BOX / 2 + rad * Math.sin(w);
      var strich = el('line', { x1: BOX / 2, y1: BOX / 2, x2: x.toFixed(1), y2: y.toFixed(1) });
      if (!V.ohneLinien && art !== 'kacheln' && art !== 'kranz') linien.appendChild(strich);
      (zweite ? reihe2 : reihe1).push([x, y]);
      var label = p.name + ', ' + p.rolle;
      var b = el('button', { type: 'button', class: 'c-knoten' + (art === 'kacheln' ? ' c-knoten--kachel' : ''), 'aria-label': label, title: label,
        on: { click: function () { waehlen(i, k, true); } } }, [U.bild(p, '', 12)]);
      b.style.left = pct(x, BOX);
      b.style.top = pct(y, BOX);
      box.appendChild(b);
      knoten.push(b);
      monde.push({ b: b, strich: strich, rad: rad, w: w });
    });
    // Sternbild-Ketten (nicht im Sonnensystem, dort drehen sich die Monde)
    if (art === 'spirale') {
      // Spirale: jedes Mitglied mit dem nächsten auf der Spirale verbinden
      for (var s1 = 0; s1 < monde.length - 1; s1++) {
        var m1 = monde[s1], m2 = monde[s1 + 1];
        linien.appendChild(el('line', { class: 'kette',
          x1: (BOX / 2 + m1.rad * Math.cos(m1.w)).toFixed(1), y1: (BOX / 2 + m1.rad * Math.sin(m1.w)).toFixed(1),
          x2: (BOX / 2 + m2.rad * Math.cos(m2.w)).toFixed(1), y2: (BOX / 2 + m2.rad * Math.sin(m2.w)).toFixed(1) }));
      }
    } else if (art === 'kacheln') {
      // Rahmen um den Block und eine Linie vom Ressort zum Block
      var xs = monde.map(function (m) { return m.rad * Math.cos(m.w); }), ys = monde.map(function (m) { return m.rad * Math.sin(m.w); });
      var x0 = Math.min.apply(null, xs) - 22, x1 = Math.max.apply(null, xs) + 22, y0 = Math.min.apply(null, ys) - 22, y1 = Math.max.apply(null, ys) + 22;
      linien.insertBefore(el('rect', { class: 'rahmen', x: (BOX / 2 + x0).toFixed(1), y: (BOX / 2 + y0).toFixed(1), width: (x1 - x0).toFixed(1), height: (y1 - y0).toFixed(1), rx: 12 }), linien.firstChild);
      var nah = Math.abs(y0) < Math.abs(y1) ? y0 : y1;
      linien.appendChild(el('line', { x1: BOX / 2, y1: BOX / 2, x2: BOX / 2, y2: (BOX / 2 + nah).toFixed(1) }));
      aussenRad = 26;
    } else if (art === 'kranz') {
      // Kranzlinie durch alle Fotos und vier feine Speichen
      var rk = monde.length ? monde[0].rad : 50;
      linien.insertBefore(el('circle', { class: 'kranz', cx: BOX / 2, cy: BOX / 2, r: rk.toFixed(1) }), linien.firstChild);
      [0, 1, 2, 3].forEach(function (q) {
        var a4 = q * Math.PI / 2 + Math.PI / 4;
        linien.appendChild(el('line', { class: 'kette', x1: (BOX / 2 + 30 * Math.cos(a4)).toFixed(1), y1: (BOX / 2 + 30 * Math.sin(a4)).toFixed(1), x2: (BOX / 2 + (rk - 18) * Math.cos(a4)).toFixed(1), y2: (BOX / 2 + (rk - 18) * Math.sin(a4)).toFixed(1) }));
      });
    } else if (!V.ohneLinien && art !== 'orbit' && art !== 'hub') {
      [reihe1, reihe2].forEach(function (rh) {
        if (rh.length < 3) return;
        var bis = faecher ? rh.length - 1 : rh.length;
        for (var k = 0; k < bis; k++) {
          var q = rh[(k + 1) % rh.length];
          linien.appendChild(el('line', { class: 'kette', x1: rh[k][0].toFixed(1), y1: rh[k][1].toFixed(1), x2: q[0].toFixed(1), y2: q[1].toFixed(1) }));
        }
      });
      reihe2.forEach(function (p) {
        var best = null, bd = 1e9;
        reihe1.forEach(function (q) { var d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; best = q; } });
        if (best) linien.appendChild(el('line', { class: 'kette', x1: p[0].toFixed(1), y1: p[1].toFixed(1), x2: best[0].toFixed(1), y2: best[1].toFixed(1) }));
      });
    }
    if (art === 'orbit') {
      // Umlaufbahn der Monde als feiner Kreis
      linien.insertBefore(el('circle', { class: 'bahn', cx: BOX / 2, cy: BOX / 2, r: 50 }), linien.firstChild);
      if (n > n1) linien.insertBefore(el('circle', { class: 'bahn', cx: BOX / 2, cy: BOX / 2, r: 86 }), linien.firstChild);
    }

    var knopf;
    if (istHub) {
      box.appendChild(el('span', { class: 'c-hub__puls', 'aria-hidden': 'true' }));
      knopf = el('button', { type: 'button', class: 'c-hub__logo', 'aria-label': 'Vorstand anzeigen',
        on: { click: function () { waehlen(i, -1, true); } } }, ['UM', el('span', { text: '/' }), 'AI']);
    } else {
      knopf = el('button', { type: 'button', class: 'c-ressort', 'aria-label': 'Ressort ' + r.name + ' anzeigen', text: r.kurz,
        on: { click: function () { waehlen(i, -1, true); } } });
      knopf.style.left = '50%';
      knopf.style.top = '50%';
    }
    box.appendChild(knopf);
    var lab = el('span', { class: 'c-label', 'aria-hidden': 'true', text: r.name + ' · ' + n });
    box.appendChild(lab);
    netz.appendChild(box);

    // Richtung und Startabstand der Beschriftung
    // Beschriftung immer senkrecht versetzen (bleibt so innerhalb der Fläche),
    // nur bei Fächern links und rechts waagrecht zur Mitte hin, weil dort Platz ist.
    var aussen = aussenRad + 16, rx = 0, ry = -1, start = aussen + 18, waagrecht = false;
    var unten = Math.sin(aus) > 0.3;
    if (V.label === 'aussen') { ry = unten ? 1 : -1; }
    if (V.label === 'kachel') { ry = ort[1] < CY ? -1 : 1; start = 46; }
    if (V.label === 'innen') {
      if (Math.abs(Math.sin(aus)) < 0.5) { ry = -1; start = (n > n1 ? 100 : 62) + 30; }
      else { ry = unten ? -1 : 1; start = 46; }
    }
    var teil = { id: r.id, i: i, box: box, knopf: knopf, knoten: knoten, label: lab, hub: istHub, rx: rx, ry: ry, start: start, waagrecht: waagrecht, winkel: aus, monde: monde };
    if (istHub) hubTeil = teil; else cluster.push(teil);
  });
  var alleTeile = [hubTeil].concat(cluster);
  // Nachbarn für die Fäden zwischen Ressorts: im Kreis um das Logo sortiert
  var RUNDE = cluster.slice().sort(function (a, b) { return a.winkel - b.winkel; });

  // ── Panel rechts ──
  var titel = el('h3', {}), zahl = el('span', { class: 'c-panel__zahl' }), desc = el('p', { class: 'c-panel__desc' });
  var inhalt = el('div', {});
  var panel = el('div', { class: 'c-panel', 'aria-live': 'polite' }, [el('div', { class: 'c-panel__kopf' }, [titel, zahl]), desc, inhalt]);

  // Steuerung für den automatischen Wechsel (WCAG 2.2.2: anhalten können)
  var fortschritt = el('span', { class: 'c-steuerung__balken' });
  var pauseKnopf = el('button', { type: 'button', class: 'c-steuerung__knopf', 'aria-pressed': 'false' });
  var steuerText = el('span', { class: 'c-steuerung__text' });
  var steuerung = el('div', { class: 'c-steuerung' }, [pauseKnopf, steuerText, el('span', { class: 'c-steuerung__spur', 'aria-hidden': 'true' }, [fortschritt])]);
  // Auf dem Handy sind die Beschriftungen im Netz zu eng, dort steht eine Legende darunter
  var legende = el('p', { class: 'c-legende' }, [el('b', { text: 'UM/AI' }), 'Vorstand']);
  cluster.forEach(function (c) {
    legende.appendChild(document.createTextNode(' · '));
    legende.appendChild(el('b', { text: R[c.i].kurz }));
    legende.appendChild(document.createTextNode(R[c.i].name));
  });
  var links = el('div', { class: 'c-links' }, [netz, legende, steuerung]);
  var buehne = el('div', { class: 'c-buehne' }, [links, panel]);
  app.appendChild(buehne);

  var karten = [];
  function karte(p, k) {
    var b = el('button', { type: 'button', class: 'c-karte', 'aria-pressed': 'false', 'aria-label': p.name + ', ' + p.rolle + ': Karte umdrehen',
      on: { click: function () { state.p = k; state.gedreht = state.gedreht === k ? -1 : k; autoStoppen(); zeichnen(); } } }, [
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
      el('span', { class: 'b-name', text: p.name }),
      el('span', { class: 'rolle' + (p.hervor ? ' hervor' : ''), text: p.rolle })
    ]);
    karten[k] = b;
    return el('li', {}, [b]);
  }

  var gezeigt = -1;
  function zeichnen() {
    var r = R[state.r];
    if (gezeigt !== state.r) {
      titel.textContent = r.name;
      zahl.textContent = U.anzahl(r.leute.length);
      desc.textContent = r.desc;
      while (inhalt.firstChild) inhalt.removeChild(inhalt.firstChild);
      karten = [];
      // Bei AI nur ein feiner Strich mit kleiner Beschriftung zwischen Projects und Learning
      (r.teams || ['']).forEach(function (t, ti) {
        if (t) inhalt.appendChild(el('p', { class: 'c-team' + (ti ? ' c-team--strich' : ''), text: t }));
        var ul = el('ul', { class: 'c-karten' });
        r.leute.forEach(function (p, k) { if (!t || p.team === t) ul.appendChild(karte(p, k)); });
        inhalt.appendChild(ul);
      });
      gezeigt = state.r;
    }
    karten.forEach(function (b, k) {
      b.classList.toggle('gewaehlt', k === state.p);
      b.classList.toggle('gedreht', k === state.gedreht);
      b.setAttribute('aria-pressed', String(k === state.gedreht));
    });
    alleTeile.forEach(function (c) {
      var an = c.i === state.r;
      c.box.classList.toggle('aktiv', an);
      c.knopf.setAttribute('aria-pressed', String(an));
      c.knoten.forEach(function (k, j) { k.classList.toggle('gewaehlt', an && j === state.p); });
    });
  }
  zeichnen();

  // ── Automatischer Wechsel ──
  var auto = { an: !ruhig, gestoppt: ruhig, pause: false, seit: performance.now(), rest: INTERVALL };
  function autoText() {
    var laeuft = auto.an && !auto.gestoppt;
    pauseKnopf.textContent = laeuft ? 'Pause' : 'Weiter';
    pauseKnopf.setAttribute('aria-pressed', String(!laeuft));
    pauseKnopf.setAttribute('aria-label', laeuft ? 'Automatischen Wechsel anhalten' : 'Automatischen Wechsel starten');
    steuerText.textContent = laeuft ? 'Wechselt alle 7,5 s' : 'Wechsel angehalten';
    steuerung.classList.toggle('steht', !laeuft);
  }
  function autoStoppen() { auto.gestoppt = true; autoText(); }
  pauseKnopf.addEventListener('click', function () {
    auto.gestoppt = !auto.gestoppt; auto.an = true; auto.seit = performance.now(); auto.rest = INTERVALL; autoText();
  });
  // Pausieren, solange Maus oder Fokus auf der Bühne sind
  var maus = false, fokus = false;
  buehne.addEventListener('mouseenter', function () { maus = true; });
  buehne.addEventListener('mouseleave', function () { maus = false; });
  buehne.addEventListener('focusin', function () { fokus = true; });
  buehne.addEventListener('focusout', function (e) { if (!buehne.contains(e.relatedTarget)) fokus = false; });
  var letzter = performance.now();
  function autoTakt(t) {
    var dt = t - letzter; letzter = t;
    var laeuft = auto.an && !auto.gestoppt;
    if (laeuft && !maus && !fokus && !document.hidden) {
      auto.rest -= dt;
      if (auto.rest <= 0) {
        var pos = REIHE.indexOf(state.r);
        state.r = REIHE[(pos + 1) % REIHE.length]; state.p = -1; state.gedreht = -1;
        zeichnen();
        auto.rest = INTERVALL;
      }
    }
    fortschritt.style.transform = 'scaleX(' + (laeuft ? 1 - Math.max(0, auto.rest) / INTERVALL : 0) + ')';
  }
  autoText();

  // ── Alle Mitglieder mit Suche und Filter ──
  // Ein Eintrag pro Ressort-Zugehörigkeit (Timo und Nico stehen zweimal, wie in der Teamliste: 48)
  var liste = [];
  R.forEach(function (r, i) {
    r.leute.forEach(function (p, k) { liste.push({ p: p, orte: [{ i: i, k: k, rolle: p.rolle }] }); });
  });
  liste.sort(function (a, b) {
    return a.p.name.localeCompare(b.p.name, 'de') || R[a.orte[0].i].name.localeCompare(R[b.orte[0].i].name, 'de');
  });
  var alleKnopf = el('button', { type: 'button', class: 'c-alle__knopf', 'aria-expanded': 'false', 'aria-controls': 'alleMitglieder',
    text: 'Alle ' + U.gesamt + ' Mitglieder anzeigen' });
  var suche = el('input', { type: 'search', placeholder: 'Name oder Rolle', 'aria-label': 'Mitglieder durchsuchen' });
  var filterWert = -1;
  var chips = [{ i: -1, name: 'Alle' }].concat(REIHE.map(function (i) { return { i: i, name: R[i].name }; })).map(function (c) {
    var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(c.i === -1), text: c.name,
      on: { click: function () { filterWert = c.i; filtern(); } } });
    b.dataset.i = c.i;
    return b;
  });
  var treffer = el('p', { class: 'c-alle__treffer', 'aria-live': 'polite' });
  var leer = el('p', { class: 'c-alle__leer', text: 'Niemand gefunden. Anderen Namen oder „Alle“ probieren.', hidden: true });
  var raster = el('ul', { class: 'c-alle__raster' });
  liste.forEach(function (e) {
    var ressorts = e.orte.map(function (o) { return R[o.i].name; }).join(' · ');
    var rolle = e.orte.map(function (o) { return o.rolle; }).filter(function (v, x, a) { return a.indexOf(v) === x; }).join(' · ');
    var hervor = e.orte.some(function (o) { return /Head of|Lead|Vorstand/.test(o.rolle); });
    var b = el('button', { type: 'button', class: 'c-person', 'aria-label': e.p.name + ', ' + rolle + ', ' + ressorts + ': im Netz zeigen',
      on: { click: function () {
        waehlen(e.orte[0].i, e.orte[0].k, true);
        netz.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'center' });
      } } }, [
      U.bild(e.p, 'c-person__foto', 16),
      el('span', { class: 'c-person__text' }, [
        el('span', { class: 'b-name', text: e.p.name }),
        el('span', { class: 'rolle' + (hervor ? ' hervor' : ''), text: rolle }),
        el('span', { class: 'c-person__ressort', text: ressorts })
      ])
    ]);
    var li = el('li', {}, [b]);
    e.li = li;
    e.text = (e.p.name + ' ' + rolle + ' ' + ressorts).toLowerCase();
    raster.appendChild(li);
  });
  var alleBereich = el('div', { class: 'c-alle__bereich', id: 'alleMitglieder', hidden: true }, [
    el('div', { class: 'c-alle__leiste' }, [
      el('div', { class: 'chips', role: 'group', 'aria-label': 'Nach Ressort filtern' }, chips),
      el('label', { class: 'suche' }, [
        el('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#8892A4', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
          el('circle', { cx: 11, cy: 11, r: 7 }), el('path', { d: 'M20 20l-3.5-3.5' })
        ]),
        suche
      ])
    ]),
    treffer, leer, raster
  ]);
  // Knopf direkt unter dem Kosmos, damit er von Anfang an zu sehen ist; die Liste klappt darunter auf
  links.appendChild(alleKnopf);
  app.appendChild(el('section', { class: 'c-alle', 'aria-label': 'Alle Mitglieder' }, [alleBereich]));
  alleKnopf.addEventListener('click', function () {
    var auf = alleBereich.hidden;
    alleBereich.hidden = !auf;
    alleKnopf.setAttribute('aria-expanded', String(auf));
    alleKnopf.textContent = auf ? 'Mitgliederliste schließen' : 'Alle ' + U.gesamt + ' Mitglieder anzeigen';
    if (auf) {
      alleBereich.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { suche.focus({ preventScroll: true }); }, ruhig ? 0 : 400);
    }
  });
  suche.addEventListener('input', filtern);
  function filtern() {
    var q = suche.value.trim().toLowerCase(), n = 0;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(Number(c.dataset.i) === filterWert)); });
    liste.forEach(function (e) {
      var passt = (filterWert < 0 || e.orte.some(function (o) { return o.i === filterWert; })) && (!q || e.text.indexOf(q) >= 0);
      e.li.hidden = !passt;
      if (passt) n++;
    });
    treffer.textContent = n + (n === 1 ? ' Person' : ' Personen');
    leer.hidden = n > 0;
  }
  filtern();

  // Beschriftungen in ihrer Richtung verschieben, bis sie keinen Fotokreis berühren
  function labelsPlatzieren() {
    cluster.forEach(function (t) {
      var d = t.start;
      if (t.waagrecht) {
        var bw = t.box.getBoundingClientRect().width || 1;
        d = 26 + (t.label.getBoundingClientRect().width * BOX / bw) / 2 + 10;
      }
      for (var s = 0; s < 14; s++) {
        t.label.style.left = pct(BOX / 2 + t.rx * d, BOX);
        t.label.style.top = pct(BOX / 2 + t.ry * d, BOX);
        var l = t.label.getBoundingClientRect();
        var trifft = t.knoten.concat([t.knopf]).some(function (k) {
          var r = k.getBoundingClientRect();
          return !(l.right + 3 <= r.left || r.right + 3 <= l.left || l.bottom + 3 <= r.top || r.bottom + 3 <= l.top);
        });
        if (!trifft) break;
        d += 6;
      }
    });
  }
  labelsPlatzieren();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(labelsPlatzieren);

  // ── Kosmos ──
  var ctx = leinwand.getContext('2d');
  var seed = 11;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  var pts = [], paare = [], ANZ = 0, plexus = V.kosmos === 'plexus';

  var eigenePaare = false;
  if (V.kosmos === 'gehirn') {
    // Gehirn aus zwei Hälften mit Mittelfurche, flacher Innenwand und Windungen
    ANZ = handy ? 520 : 1100;
    var gold = Math.PI * (3 - Math.sqrt(5)), haelfte = Math.ceil(ANZ / 2);
    for (var i = 0; i < ANZ; i++) {
      var seite = i % 2 ? 1 : -1, j = Math.floor(i / 2);
      var uy = 1 - (2 * (j + 0.5)) / haelfte, rr = Math.sqrt(1 - uy * uy), th = gold * j, ph = Math.acos(uy);
      var ux = Math.cos(th) * rr, uz = Math.sin(th) * rr;
      if (ux * seite < 0) ux *= 0.3;
      if (uy < -0.35) uy *= 0.75;
      var windung = 1 + 0.075 * Math.sin(7 * th + seite) * Math.sin(6 * ph) + 0.035 * Math.sin(15 * th + 1.3) * Math.sin(13 * ph);
      var schale = (rnd() < 0.85 ? 0.9 + 0.1 * rnd() : 0.45 + 0.4 * rnd()) * windung;
      pts.push({ x: seite * 0.53 + ux * 0.52 * schale, y: uy * 0.66 * schale, z: uz * 0.95 * schale, t: rnd() * 6.28, sp: rnd() * 1.4, hell: rnd() < 0.07 });
    }
  } else if (V.kosmos === 'neuronen') {
    // Neuronales Netz: fünf Schichten (wie Eingabe, verdeckte Schichten, Ausgabe),
    // jedes Neuron mit den drei nächsten der folgenden Schicht verbunden
    eigenePaare = true;
    // Schlicht wie ein Schema: Spalten mit gleichmäßig verteilten Neuronen, Nachbarschichten voll verbunden
    var GROESSEN = handy ? [4, 6, 7, 6, 4] : [5, 8, 10, 8, 5], schichtStart = [];
    GROESSEN.forEach(function (anz, l) {
      schichtStart.push(pts.length);
      for (var nn = 0; nn < anz; nn++) {
        pts.push({ x: -1 + l * 0.5, y: (nn - (anz - 1) / 2) * 0.17, z: 0, l: l, t: 0, sp: 0, hell: false });
      }
    });
    for (var l2 = 0; l2 < GROESSEN.length - 1; l2++) {
      for (var a1 = schichtStart[l2]; a1 < schichtStart[l2] + GROESSEN[l2]; a1++) {
        for (var b1 = schichtStart[l2 + 1]; b1 < schichtStart[l2 + 1] + GROESSEN[l2 + 1]; b1++) paare.push([a1, b1]);
      }
    }
    ANZ = pts.length;
  } else if (V.kosmos === 'karte' || V.kosmos === 'platine') {
    // Keine Punktwolke: die Fläche wird direkt in malen() gezeichnet
    eigenePaare = true; ANZ = 0;
  } else if (V.kosmos === 'wellen') {
    // Wellenfeld: Gitter, das wie eine Klangwelle schwingt (Höhe wird jedes Bild neu berechnet)
    eigenePaare = true;
    var GX = handy ? 18 : 28, GZ = handy ? 10 : 14;
    for (var gz = 0; gz < GZ; gz++) for (var gx = 0; gx < GX; gx++) {
      pts.push({ x: -1.35 + 2.7 * gx / (GX - 1), y: 0, z: -1 + 2 * gz / (GZ - 1), t: rnd() * 6.28, sp: rnd() * 1.4, hell: rnd() < 0.05 });
      var idx0 = gz * GX + gx;
      if (gx > 0) paare.push([idx0 - 1, idx0]);
      if (gz > 0) paare.push([idx0 - GX, idx0]);
    }
    ANZ = pts.length;
  } else if (V.kosmos === 'galaxie') {
    // Spiralgalaxie: heller Kern, zwei Arme, flache Scheibe
    ANZ = handy ? 520 : 1100;
    for (var g = 0; g < ANZ; g++) {
      var x, y, z;
      if (g < ANZ * 0.18) {
        var uu = rnd() * 2 - 1, tt = rnd() * Math.PI * 2, ss = Math.sqrt(1 - uu * uu), rk = Math.pow(rnd(), 0.7) * 0.22;
        x = ss * Math.cos(tt) * rk; y = uu * rk * 0.6; z = ss * Math.sin(tt) * rk;
      } else {
        var arm = g % 2, rg = 0.18 + Math.pow(rnd(), 0.8) * 0.9;
        var wg = arm * Math.PI + rg * 3.4 + gauss() * 0.32 * (1.1 - rg * 0.5);
        x = Math.cos(wg) * rg; z = Math.sin(wg) * rg; y = gauss() * 0.05 * (1.2 - rg);
      }
      pts.push({ x: x, y: y, z: z, t: rnd() * 6.28, sp: rnd() * 1.4, hell: rnd() < 0.08 });
    }
  } else {
    // Treibendes Punkte-Netz über die ganze Fläche (wie der Partner-Bereich)
    ANZ = handy ? 150 : 280;
    for (var q2 = 0; q2 < ANZ; q2++) {
      pts.push({ x: rnd(), y: rnd(), vx: (rnd() - 0.5) * 0.00004, vy: (rnd() - 0.5) * 0.00004, t: rnd() * 6.28, sp: rnd() * 1.4, hell: rnd() < 0.1 });
    }
  }
  if (!plexus && !eigenePaare) {
    var NACHBARN = 5, ZELLE = 0.13, gitter = {};
    var zk = function (x, y, z) { return Math.floor(x / ZELLE) + ',' + Math.floor(y / ZELLE) + ',' + Math.floor(z / ZELLE); };
    pts.forEach(function (p, i) { var k = zk(p.x, p.y, p.z); (gitter[k] = gitter[k] || []).push(i); });
    pts.forEach(function (p, a) {
      var cx = Math.floor(p.x / ZELLE), cy = Math.floor(p.y / ZELLE), cz = Math.floor(p.z / ZELLE), best = [];
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) for (var dz = -1; dz <= 1; dz++) {
        (gitter[(cx + dx) + ',' + (cy + dy) + ',' + (cz + dz)] || []).forEach(function (b) {
          if (b === a) return;
          var q = pts[b];
          best.push([b, (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) + (p.z - q.z) * (p.z - q.z)]);
        });
      }
      best.sort(function (m, q) { return m[1] - q[1]; });
      best.slice(0, NACHBARN).forEach(function (bb) { if (a < bb[0] && bb[1] < ZELLE * ZELLE) paare.push([a, bb[0]]); });
    });
  }

  var breite = 0, hoehe = 0, dpr = 1;
  function groesse() {
    dpr = Math.min(window.devicePixelRatio || 1, handy ? 1.5 : 2);
    breite = leinwand.clientWidth; hoehe = leinwand.clientHeight;
    leinwand.width = Math.round(breite * dpr); leinwand.height = Math.round(hoehe * dpr);
  }
  var neigX = 0, neigY = 0, zielX = 0, zielY = 0;
  netz.addEventListener('pointermove', function (e) {
    var bx = netz.getBoundingClientRect();
    zielY = ((e.clientX - bx.left) / bx.width - 0.5) * 0.45;
    zielX = ((e.clientY - bx.top) / bx.height - 0.5) * 0.3;
  });
  netz.addEventListener('pointerleave', function () { zielX = 0; zielY = 0; });

  function mitte(elem, cr) {
    var r = elem.getBoundingClientRect();
    return [r.left + r.width / 2 - cr.left, r.top + r.height / 2 - cr.top];
  }
  function faden(a, b, biegung) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = -(b[1] - a[1]) * biegung, ny = (b[0] - a[0]) * biegung;
    ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx + nx, my + ny, b[0], b[1]);
    return [mx + nx, my + ny];
  }
  function aufKurve(a, c, b, t) {
    var u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  }

  var start0 = 0, proj = new Float32Array(Math.max(ANZ, 1) * 3);
  var LINIE = ['rgba(59,255,212,0.08)', 'rgba(59,255,212,0.17)', 'rgba(59,255,212,0.3)'];
  var PUNKT = ['rgba(136,146,164,0.4)', 'rgba(205,215,230,0.65)', 'rgba(59,255,212,0.95)'];

  function projizieren(t, e) {
    var mx = breite / 2, my = hoehe / 2, i;
    if (plexus) {
      for (i = 0; i < ANZ; i++) {
        var p = pts[i];
        if (!ruhig) {
          p.x += p.vx * 16; p.y += p.vy * 16;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
        proj[i * 3] = p.x * breite + neigY * 30; proj[i * 3 + 1] = p.y * hoehe + neigX * 30; proj[i * 3 + 2] = 0;
      }
      return;
    }
    var rot, kipp, sk;
    if (!ANZ) return;
    if (V.kosmos === 'wellen') {
      // Wellen laufen über das Gitter; Blick schräg von oben, Maus kippt leicht
      var tw = ruhig ? 0 : t;
      for (i = 0; i < pts.length; i++) {
        var wp = pts[i];
        wp.y = 0.05 * Math.sin(2.6 * wp.x + tw * 0.0004) + 0.035 * Math.sin(3.2 * wp.z - tw * 0.0003);
      }
      rot = neigY * 0.4; kipp = 0.95 + neigX * 0.4; sk = Math.min(breite, hoehe) * 0.46;
    } else if (V.kosmos === 'neuronen') {
      // Netz dreht sich langsam um die senkrechte Achse, Schichten wandern so vor und zurück
      rot = neigY * 0.3; kipp = neigX * 0.3; sk = Math.min(breite, hoehe) * 0.36;
    } else if (V.kosmos === 'gehirn') {
      rot = (ruhig ? 0 : 0.45 * Math.sin(t * 0.00013)) + neigY; kipp = 0.5 + neigX; sk = Math.min(breite, hoehe) * 0.3;
    } else {
      rot = (ruhig ? 0.5 : t * 0.00006) + neigY; kipp = 1.05 + neigX; sk = Math.min(breite, hoehe) * 0.4;
    }
    var cr = Math.cos(rot), sr = Math.sin(rot), cx2 = Math.cos(kipp), sx2 = Math.sin(kipp);
    for (i = 0; i < ANZ; i++) {
      var q = pts[i], x = q.x * cr - q.z * sr, z = q.x * sr + q.z * cr;
      var y = q.y * cx2 - z * sx2; z = q.y * sx2 + z * cx2;
      var f = 2.6 / (2.6 + z + (1 - e) * 3.2), g = 0.6 + 0.4 * e;
      proj[i * 3] = mx + x * sk * f * g; proj[i * 3 + 1] = my + y * sk * f * g; proj[i * 3 + 2] = z;
    }
  }

  function malen(t) {
    if (!start0) start0 = t;
    var ein = ruhig ? 1 : Math.min(1, (t - start0) / 1800), e = 1 - Math.pow(1 - ein, 3);
    neigX += (zielX - neigX) * 0.05; neigY += (zielY - neigY) * 0.05;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, breite, hoehe);
    projizieren(t, e);
    ctx.lineWidth = 1;
    if (plexus) {
      var grenze = handy ? 70 : 92, g2 = grenze * grenze;
      for (var st0 = 0; st0 < 3; st0++) {
        ctx.beginPath();
        for (var a0 = 0; a0 < ANZ; a0++) for (var b0 = a0 + 1; b0 < ANZ; b0++) {
          var ddx = proj[a0 * 3] - proj[b0 * 3], ddy = proj[a0 * 3 + 1] - proj[b0 * 3 + 1], dd = ddx * ddx + ddy * ddy;
          if (dd > g2) continue;
          var stufe = dd > g2 * 0.55 ? 0 : dd > g2 * 0.2 ? 1 : 2;
          if (stufe !== st0) continue;
          ctx.moveTo(proj[a0 * 3], proj[a0 * 3 + 1]); ctx.lineTo(proj[b0 * 3], proj[b0 * 3 + 1]);
        }
        ctx.globalAlpha = e; ctx.strokeStyle = LINIE[st0]; ctx.stroke();
      }
    } else {
      for (var st = 0; st < 3; st++) {
        ctx.beginPath();
        for (var k = 0; k < paare.length; k++) {
          var a = paare[k][0], b = paare[k][1], tiefe = (proj[a * 3 + 2] + proj[b * 3 + 2]) / 2;
          if ((tiefe < -0.3 ? 0 : tiefe < 0.3 ? 1 : 2) !== st) continue;
          ctx.moveTo(proj[a * 3], proj[a * 3 + 1]); ctx.lineTo(proj[b * 3], proj[b * 3 + 1]);
        }
        ctx.globalAlpha = e * (V.kosmos === 'neuronen' ? 0.45 : V.schlicht ? 0.6 : 1); ctx.strokeStyle = LINIE[st]; ctx.stroke();
      }
    }
    if (V.kosmos === 'neuronen' && !ruhig && !V.schlicht && paare.length) {
      // Signale laufen von Schicht zu Schicht durch das Netz
      for (var sg = 0; sg < 22; sg++) {
        var takt = t / 1300 + sg * 0.618, nr = Math.floor(takt), anteil = takt - nr;
        var pi2 = paare[Math.floor(Math.abs(Math.sin((nr + 1) * 12.9898 + sg * 78.233) * 43758.5453) % paare.length)];
        var sx = proj[pi2[0] * 3] + (proj[pi2[1] * 3] - proj[pi2[0] * 3]) * anteil;
        var sy = proj[pi2[0] * 3 + 1] + (proj[pi2[1] * 3 + 1] - proj[pi2[0] * 3 + 1]) * anteil;
        ctx.globalAlpha = e * Math.sin(anteil * Math.PI);
        ctx.fillStyle = '#3BFFD4';
        ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (var j = 0; j < ANZ; j++) {
      var zt = proj[j * 3 + 2], q = pts[j];
      var funkel = ruhig || V.schlicht ? 1 : 0.6 + 0.4 * Math.sin(t * 0.001 * (0.6 + q.sp) + q.t);
      var s2 = q.hell && zt >= 0 ? 2 : zt < -0.3 ? 0 : 1, gr = s2 === 2 ? 2.2 : zt > 0.3 ? 1.6 : (plexus ? 1.6 : 1.1);
      if (V.kosmos === 'neuronen') { gr = 4; s2 = 1; }
      if (V.kosmos === 'wellen') { gr = 1.2; s2 = 0; }
      ctx.globalAlpha = funkel * e; ctx.fillStyle = PUNKT[s2];
      ctx.fillRect(proj[j * 3] - gr / 2, proj[j * 3 + 1] - gr / 2, gr, gr);
    }

    // Team-Netz mit dem Kosmos verbinden
    var cRect = leinwand.getBoundingClientRect();
    if (V.orbit) {
      // Umlaufbahn der Planeten als gestrichelte Ellipse um die Sonne
      var nRect = netz.getBoundingClientRect(), fx = nRect.width / W, fy = nRect.height / H;
      ctx.globalAlpha = e; ctx.beginPath();
      ctx.ellipse(nRect.left - cRect.left + CX * fx, nRect.top - cRect.top + CY * fy, 232 * fx, 236 * fy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59,255,212,0.18)'; ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
    }
    var hub = mitte(hubTeil.knopf, cRect), zentren = {};
    cluster.forEach(function (c) { zentren[c.id] = mitte(c.knopf, cRect); });
    ctx.globalAlpha = e;
    if (V.kosmos === 'karte' || V.kosmos === 'platine') { flaeche(t, e, cRect, hub, zentren); ctx.globalAlpha = 1; return; }
    if (V.ohneLinien) { ctx.globalAlpha = 1; return; }
    var kurven = [];
    ctx.beginPath();
    cluster.forEach(function (c, ci) {
      kurven.push([hub, faden(hub, zentren[c.id], ci % 2 ? 0.12 : -0.12), zentren[c.id], c.i === state.r]);
    });
    ctx.strokeStyle = 'rgba(59,255,212,' + (V.schlicht ? 0.16 : 0.22) + ')'; if (!V.schlicht) ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath();
    RUNDE.forEach(function (c, k) { faden(zentren[c.id], zentren[RUNDE[(k + 1) % RUNDE.length].id], 0.08); });
    ctx.strokeStyle = 'rgba(59,255,212,0.1)'; ctx.stroke();
    ctx.beginPath();
    var nahe = V.schlicht ? 0 : 46 * 46, schritt = plexus ? 1 : 2;
    alleTeile.forEach(function (c) {
      c.knoten.forEach(function (kn) {
        var m = mitte(kn, cRect), b1 = -1, d1 = nahe, b2 = -1, d2 = nahe;
        for (var j2 = 0; j2 < ANZ; j2 += schritt) {
          var dxx = proj[j2 * 3] - m[0], dyy = proj[j2 * 3 + 1] - m[1], d3 = dxx * dxx + dyy * dyy;
          if (d3 < d1) { d2 = d1; b2 = b1; d1 = d3; b1 = j2; } else if (d3 < d2) { d2 = d3; b2 = j2; }
        }
        [b1, b2].forEach(function (bb) { if (bb >= 0) { ctx.moveTo(m[0], m[1]); ctx.lineTo(proj[bb * 3], proj[bb * 3 + 1]); } });
      });
    });
    ctx.strokeStyle = 'rgba(59,255,212,0.14)'; ctx.stroke();
    if (!ruhig && !V.schlicht) {
      kurven.forEach(function (kv, k) {
        for (var z2 = 0; z2 < 2; z2++) {
          var tt = ((t * 0.00018) + k * 0.21 + z2 * 0.5) % 1, pnt = aufKurve(kv[0], kv[1], kv[2], tt);
          ctx.globalAlpha = e * (kv[3] ? 1 : 0.6) * Math.sin(tt * Math.PI);
          ctx.fillStyle = '#3BFFD4';
          ctx.beginPath(); ctx.arc(pnt[0], pnt[1], kv[3] ? 2.2 : 1.6, 0, Math.PI * 2); ctx.fill();
        }
      });
    }
    ctx.globalAlpha = 1;
  }

  // ── Orbit-Karte und Platine: ruhige, grafische Flächen statt Punktwolke ──
  function flaeche(t, e, cRect, hub, zentren) {
    var nRect = netz.getBoundingClientRect(), fx = nRect.width / W, fy = nRect.height / H;
    var ox = nRect.left - cRect.left, oy = nRect.top - cRect.top;
    function P(x, y) { return [ox + x * fx, oy + y * fy]; }
    var mitteP = P(CX, CY), f = Math.min(fx, fy);
    // weiches Leuchten hinter dem Logo
    var glanz = ctx.createRadialGradient(mitteP[0], mitteP[1], 0, mitteP[0], mitteP[1], 300 * f);
    glanz.addColorStop(0, 'rgba(59,255,212,0.07)'); glanz.addColorStop(1, 'rgba(59,255,212,0)');
    ctx.globalAlpha = e; ctx.fillStyle = glanz;
    ctx.fillRect(0, 0, breite, hoehe);
    if (V.kosmos === 'karte') {
      var BAHNEN = [96, 160, 230, 300, 360];
      // Strahlen alle 30 Grad
      ctx.beginPath();
      for (var w = 0; w < 12; w++) {
        var a = w * Math.PI / 6;
        ctx.moveTo(mitteP[0] + Math.cos(a) * 70 * f, mitteP[1] + Math.sin(a) * 70 * f);
        ctx.lineTo(mitteP[0] + Math.cos(a) * 360 * f, mitteP[1] + Math.sin(a) * 360 * f);
      }
      ctx.strokeStyle = 'rgba(136,146,164,0.1)'; ctx.lineWidth = 1; ctx.stroke();
      // Kreisbahnen, die Ressort-Bahn etwas kräftiger
      BAHNEN.forEach(function (r, k) {
        ctx.beginPath();
        ctx.ellipse(mitteP[0], mitteP[1], r * fx, r * fy * (r === 230 ? 1.02 : 1), 0, 0, Math.PI * 2);
        ctx.strokeStyle = r === 230 ? 'rgba(59,255,212,0.32)' : 'rgba(136,146,164,' + (0.22 - k * 0.025) + ')';
        if (k % 2) ctx.setLineDash([2, 6]);
        ctx.stroke(); ctx.setLineDash([]);
      });
      // aktives Ressort: kurzer heller Bogen auf seiner Bahn
      cluster.forEach(function (c) {
        if (c.i !== state.r) return;
        var o = V.orte[c.id], aa = Math.atan2((o[1] - CY) / 1.02, o[0] - CX);
        ctx.beginPath();
        ctx.ellipse(mitteP[0], mitteP[1], 230 * fx, 230 * 1.02 * fy, 0, aa - 0.32, aa + 0.32);
        ctx.strokeStyle = 'rgba(59,255,212,0.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      });
      // wenige Punkte auf den Bahnen, die sehr langsam wandern
      var dreh = ruhig ? 0 : t * 0.00002;
      ctx.fillStyle = 'rgba(205,215,230,0.55)';
      for (var p = 0; p < 36; p++) {
        var rb = BAHNEN[p % BAHNEN.length], ab = p * 2.39996 + dreh * (p % 2 ? 1 : -1);
        ctx.beginPath(); ctx.arc(mitteP[0] + Math.cos(ab) * rb * fx, mitteP[1] + Math.sin(ab) * rb * fy, 1.3, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    // Platine: Punktraster
    var abstand = 24 * f;
    ctx.fillStyle = 'rgba(136,146,164,0.22)';
    for (var gx = ox % abstand; gx < breite; gx += abstand) {
      for (var gy = oy % abstand; gy < hoehe; gy += abstand) ctx.fillRect(gx - 0.6, gy - 0.6, 1.2, 1.2);
    }
    // Leiterbahnen: erst gerade, dann im 45-Grad-Knick zum Ressort
    function bahn(a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1;
      ctx.moveTo(a[0], a[1]);
      if (Math.abs(dy) > Math.abs(dx)) {
        var g1 = Math.abs(dy) - Math.abs(dx);
        ctx.lineTo(a[0], a[1] + sy * g1);
      } else {
        var g2 = Math.abs(dx) - Math.abs(dy);
        ctx.lineTo(a[0] + sx * g2, a[1]);
      }
      ctx.lineTo(b[0], b[1]);
    }
    cluster.forEach(function (c) {
      var an = c.i === state.r;
      ctx.beginPath(); bahn(hub, zentren[c.id]);
      ctx.strokeStyle = an ? 'rgba(59,255,212,0.75)' : 'rgba(59,255,212,0.28)';
      ctx.lineWidth = an ? 1.6 : 1.1; ctx.stroke();
      // Lötpunkt am Ende
      ctx.beginPath(); ctx.arc(zentren[c.id][0], zentren[c.id][1], 3, 0, Math.PI * 2);
      ctx.fillStyle = an ? '#3BFFD4' : 'rgba(59,255,212,0.5)'; ctx.fill();
    });
    ctx.lineWidth = 1;
    // ein paar kurze, blinde Bahnen am Rand für den Platinen-Look
    ctx.beginPath();
    [[40, 300, 1], [680, 320, -1], [60, 470, 1], [660, 480, -1], [300, 740, 1], [420, 30, -1]].forEach(function (s0) {
      var a0 = P(s0[0], s0[1]);
      ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a0[0] + s0[2] * 48 * f, a0[1]); ctx.lineTo(a0[0] + s0[2] * 72 * f, a0[1] - 24 * f);
    });
    ctx.strokeStyle = 'rgba(136,146,164,0.18)'; ctx.stroke();
  }

  var laeuft = false, rafId = 0;
  // Sonnensystem: Planeten (Ressorts) kreisen langsam um die Sonne (Logo), Monde (Mitglieder) um ihren Planeten.
  // Hält an, solange die Maus auf dem Netz ist, damit sich alles bequem anklicken lässt.
  var umlauf = { phi: 0, psi: 0, zuletzt: 0, ueber: false };
  if (V.orbit) {
    netz.addEventListener('mouseenter', function () { umlauf.ueber = true; });
    netz.addEventListener('mouseleave', function () { umlauf.ueber = false; });
    cluster.forEach(function (c) {
      var o = V.orte[c.id];
      c.basis = Math.atan2(o[1] - CY, o[0] - CX);
      c.box.classList.add('c-cluster--orbit');
    });
  }
  function bewegen(t) {
    if (!V.orbit) return;
    var dt = umlauf.zuletzt ? Math.min(t - umlauf.zuletzt, 100) : 0;
    umlauf.zuletzt = t;
    if (!ruhig && !umlauf.ueber) {
      umlauf.phi += dt * 2 * Math.PI / 240000;   // ein Umlauf in 4 Minuten
      umlauf.psi += dt * 2 * Math.PI / 90000;    // Monde in 1,5 Minuten
    }
    cluster.forEach(function (c, ci) {
      var a = c.basis + umlauf.phi;
      c.box.style.left = pct(CX + 232 * Math.cos(a), W);
      c.box.style.top = pct(CY + 236 * Math.sin(a), H);
      var richtung = ci % 2 ? -1 : 1;
      c.monde.forEach(function (m) {
        var w = m.w + richtung * umlauf.psi, x = BOX / 2 + m.rad * Math.cos(w), y = BOX / 2 + m.rad * Math.sin(w);
        m.b.style.left = pct(x, BOX); m.b.style.top = pct(y, BOX);
        m.strich.setAttribute('x2', x.toFixed(1)); m.strich.setAttribute('y2', y.toFixed(1));
      });
    });
  }
  function schleife(t) { bewegen(t); malen(t); autoTakt(t); if (laeuft) rafId = requestAnimationFrame(schleife); }
  function an() { if (laeuft) return; laeuft = true; letzter = performance.now(); rafId = requestAnimationFrame(schleife); }
  function aus() { laeuft = false; cancelAnimationFrame(rafId); }
  groesse();
  window.addEventListener('resize', function () { groesse(); labelsPlatzieren(); if (ruhig) malen(performance.now()); });
  if (ruhig) { malen(performance.now()); }
  else if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? an() : aus(); }).observe(netz);
  else an();
  document.addEventListener('visibilitychange', function () { if (!ruhig) { document.hidden ? aus() : an(); } });
})();
