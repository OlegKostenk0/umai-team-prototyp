// UM/AI Team-Seite, Prototyp „Orbit im Kosmos“ (Issue #115).
// Angelehnt an die Kosmos-Animationen der Website: Fibonacci-Kugel und Einflug
// aus cosmos.js (Timo), wandernde Punkte auf Verbindungen aus partner-bereich.js
// (Marek). Texte nur per textContent, Positionen per element.style (CSSOM),
// kein Polling: Die Animation läuft per requestAnimationFrame und nur, solange
// der Bereich sichtbar ist. prefers-reduced-motion: statisches Bild, kein Auto-Wechsel.

(function () {
  'use strict';

  var TEAMS = [
    { id: 'vorstand', name: 'Vorstand', desc: 'Gesamtverantwortung, Strategie und Vertretung nach außen', leute: [
      ['Timo Löschner', 'Co-Founder', 'timo-loeschner'],
      ['Don Didszuleit', 'Co-Founder', 'don-didszuleit']
    ] },
    { id: 'partnerships', name: 'Partnerships', desc: 'Unternehmen, Workshops und Sponsoring', leute: [
      ['Elias Wiemer', 'Head of Partnerships', 'elias-wiemer']
    ] },
    { id: 'finance', name: 'Finance', desc: 'Budget, Buchführung, Beiträge und Förderung', leute: [
      ['Nico Hinz', 'Head of Finance', 'nico-hinz']
    ] },
    { id: 'community-events', name: 'Community & Events', desc: 'Mitglieder, Onboarding und Veranstaltungen', leute: [
      ['Juli Zier', 'Head of Community & Events', 'juli-zier']
    ] },
    { id: 'ai', name: 'AI', desc: 'Use Cases, Technik und inhaltliche Qualität', leute: [
      ['Timo Löschner', 'Head of AI', 'timo-loeschner'],
      ['Oleg Kostenko', 'AI Developer', 'oleg-kostenko', 'Lernt lieber mit Claude als in der Vorlesung.']
    ] },
    { id: 'relations', name: 'Relations', desc: 'Marketingkanäle, Social Media, Uni-Netzwerk', leute: [
      ['Luisa Manderbach', 'Head of Relations', 'luisa-manderbach']
    ] }
  ];
  TEAMS.forEach(function (tm) { tm.n = tm.leute.length; });

  function leute(i) {
    return TEAMS[i].leute.map(function (p, k) {
      return {
        team: i, k: k, head: p[1].indexOf('Head of') === 0, foto: 'assets/team/' + p[2] + '.jpg',
        name: p[0], rolle: p[1], fakt: p[3] || '[Fun Fact, ein Satz]'
      };
    });
  }
  // Wer in zwei Ressorts ist, zählt in der Gesamtliste einmal, mit beiden Rollen.
  var ALLE = [];
  TEAMS.forEach(function (tm, i) {
    leute(i).forEach(function (m) {
      m.teamName = tm.name;
      m.slug = tm.id;
      var da = ALLE.filter(function (x) { return x.name === m.name; })[0];
      if (da) {
        da.rolle += ', ' + m.rolle;
        da.teamName += ', ' + m.teamName;
        da.head = da.head || m.head;
      } else {
        ALLE.push(m);
      }
    });
  });

  var REDUZIERT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var HANDY = !!(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);

  var z = { team: 4, person: 1, gedreht: false, auto: !REDUZIERT, wechsel: 0, intervall: 7.5, alle: false, q: '' };
  var maus = false, fokus = false, sichtbar = true, vergangen = 0, zuletzt = 0, t0 = 0, raf = 0;
  var schwarm = { start: -1, ziel: z.team };

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text != null) e.textContent = text;
    return e;
  };
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svgIcon(d, groesse, strich) {
    var s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('width', groesse); s.setAttribute('height', groesse); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', strich);
    s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    d.forEach(function (x) {
      var p = document.createElementNS(SVG_NS, x[0]);
      Object.keys(x[1]).forEach(function (a) { p.setAttribute(a, x[1][a]); });
      s.appendChild(p);
    });
    return s;
  }
  var PERSON = [['circle', { cx: '12', cy: '8', r: '4' }], ['path', { d: 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6' }]];

  /* ── Knoten ───────────────────────────────────────────────────────────── */
  var R = 38;
  var knotenEls = TEAMS.map(function (tm, i) {
    var a = -Math.PI / 2 + (i * 2 * Math.PI) / TEAMS.length;
    var b = el('button', 'knoten ' + (Math.sin(a) < -0.01 ? 'name-oben' : 'name-unten') +
      (Math.cos(a) < -0.01 ? ' name-links' : Math.cos(a) > 0.01 ? ' name-rechts' : ''));
    b.type = 'button';
    b.style.left = (50 + R * Math.cos(a)) + '%';
    b.style.top = (50 + R * Math.sin(a)) + '%';
    var punkt = el('span', 'knoten__punkt'); punkt.setAttribute('aria-hidden', 'true');
    b.append(punkt, el('span', 'knoten__name', tm.name));
    b.addEventListener('click', function () { waehlen(i, 0); z.auto = false; render(); });
    $('knoten').appendChild(b);
    return b;
  });

  function waehlen(i, person) {
    schwarm = { start: performance.now(), ziel: i };
    vergangen = 0;
    z.team = i; z.person = person; z.gedreht = false; z.wechsel++;
  }

  /* ── Panel und Karte ──────────────────────────────────────────────────── */
  function eintrag(m, aktiv, onClick, mitTeam) {
    var b = el('button', 'eintrag' + (aktiv ? ' ist-aktiv' : '') + '');
    b.type = 'button';
    if (!mitTeam) b.setAttribute('aria-pressed', aktiv ? 'true' : 'false');
    var av = el('span', 'avatar'); av.setAttribute('aria-hidden', 'true');
    av.appendChild(svgIcon(PERSON, 18, 1.4));
    if (m.foto) { var img = el('img'); img.src = m.foto; img.alt = ''; img.width = 36; img.height = 36; img.loading = 'lazy'; av.appendChild(img); }
    var txt = el('span', 'eintrag__text');
    var name = el('span', 'eintrag__name');
    name.appendChild(el('span', null, m.name));
    txt.append(name, el('span', 'eintrag__rolle' + (m.head ? ' rolle--head' : ''), mitTeam ? m.rolle + ' · ' + m.teamName : m.rolle));
    b.append(av, txt);
    if (mitTeam) b.setAttribute('aria-label', m.name + ', ' + m.rolle + ', ' + m.teamName + ', im Netz anzeigen');
    b.addEventListener('click', onClick);
    return b;
  }

  var letzterWechsel = -1;
  function render() {
    var tm = TEAMS[z.team];
    knotenEls.forEach(function (b, i) {
      b.classList.toggle('ist-aktiv', i === z.team);
      b.setAttribute('aria-pressed', i === z.team ? 'true' : 'false');
    });
    $('teamSlug').textContent = tm.id + '/';
    $('teamName').textContent = tm.name;
    $('teamText').textContent = tm.desc;

    var personen = leute(z.team);
    var leer = personen.length === 0;
    $('leer').hidden = !leer;
    $('panelInhalt').hidden = leer;
    // aria-live nur bei eigener Auswahl, damit der Auto-Wechsel Screenreader nicht zuschüttet.
    $('panelKopf').setAttribute('aria-live', z.auto ? 'off' : 'polite');

    if (z.wechsel !== letzterWechsel) {
      var kl = z.wechsel % 2 ? 'rein-a' : 'rein-b';
      ['panelKopf', 'liste', 'kartenSpalte'].forEach(function (id) { $(id).classList.remove('rein-a', 'rein-b'); $(id).classList.add(kl); });
      letzterWechsel = z.wechsel;
    }

    if (!leer) {
      var sel = Math.max(0, Math.min(z.person, personen.length - 1));
      $('liste').replaceChildren.apply($('liste'), personen.map(function (m, k) {
        var li = el('li');
        li.appendChild(eintrag(m, k === sel, function () { z.person = k; z.gedreht = false; z.auto = false; render(); }, false));
        return li;
      }));
      var p = personen[sel];
      var karte = $('karte');
      karte.setAttribute('aria-pressed', z.gedreht ? 'true' : 'false');
      $('karteAria').textContent = 'Karte von ' + p.name + ' umdrehen';
      $('karte-info').textContent = p.name + ', ' + p.rolle + '. Fun Fact: ' + p.fakt;
      $('karteName').textContent = p.name;
      $('karteRolle').textContent = p.rolle;
      $('karteFakt').textContent = p.fakt;
      $('karteFoto').src = p.foto;
      $('karteFoto').hidden = !p.foto;
      document.querySelectorAll('#karteSpass img').forEach(function (b) { b.src = p.foto; });
      $('karteSpass').hidden = !p.foto;
      $('karteRolle').classList.toggle('rolle--head', p.head);
    }

    var pausiert = !z.auto;
    $('autoKnopf').setAttribute('aria-pressed', pausiert ? 'true' : 'false');
    $('autoLabel').textContent = pausiert ? 'Auto-Wechsel starten' : 'Auto-Wechsel pausieren';
    $('autoHinweis').textContent = pausiert ? 'Pausiert' : 'Wechselt alle ' + String(z.intervall).replace('.', ',') + ' s';

    renderAlle();
    if (REDUZIERT) zeichnen(performance.now());
  }

  /* ── Alle Mitglieder mit Suche ────────────────────────────────────────── */
  function renderAlle() {
    $('alleKnopf').setAttribute('aria-expanded', z.alle ? 'true' : 'false');
    $('alleLabel').textContent = z.alle ? 'Alle Mitglieder ausblenden' : 'Alle ' + ALLE.length + ' Mitglieder anzeigen';
    $('alleBereich').hidden = !z.alle;
    if (!z.alle) return;
    var q = z.q.trim().toLowerCase();
    var treffer = ALLE.filter(function (m) {
      return !q || (m.name + ' ' + m.rolle + ' ' + m.teamName + ' ' + m.slug).toLowerCase().indexOf(q) !== -1;
    });
    $('trefferZahl').textContent = q ? treffer.length + ' von ' + ALLE.length + ' gefunden' : ALLE.length + ' Mitglieder';
    $('keineTreffer').hidden = treffer.length > 0;
    $('keineTreffer').textContent = 'Niemand gefunden für „' + z.q.trim() + '“. Probier einen Vornamen, eine Rolle oder ein Ressort.';
    $('raster').replaceChildren.apply($('raster'), treffer.map(function (m) {
      var li = el('li');
      li.appendChild(eintrag(m, false, function () {
        waehlen(m.team, m.k);
        z.auto = false;
        render();
        $('panel').scrollIntoView({ behavior: REDUZIERT ? 'auto' : 'smooth', block: 'start' });
      }, true));
      return li;
    }));
  }

  /* ── Ereignisse ───────────────────────────────────────────────────────── */
  $('karte').addEventListener('click', function () { z.gedreht = !z.gedreht; z.auto = false; render(); });
  $('autoKnopf').addEventListener('click', function () { z.auto = !z.auto; vergangen = 0; render(); });
  $('alleKnopf').addEventListener('click', function () { z.alle = !z.alle; render(); if (z.alle) $('suche').focus(); });
  $('suche').addEventListener('input', function (e) { z.q = e.target.value; renderAlle(); });
  $('optIntervall').addEventListener('change', function (e) { z.intervall = Number(e.target.value); vergangen = 0; render(); });
  // Maus und Tastatur-Fokus getrennt merken: Erst wenn beide weg sind, läuft der Wechsel weiter.
  var buehne = $('buehne');
  buehne.addEventListener('mouseenter', function () { maus = true; });
  buehne.addEventListener('mouseleave', function () { maus = false; });
  buehne.addEventListener('focusin', function () { fokus = true; });
  buehne.addEventListener('focusout', function (e) { if (!buehne.contains(e.relatedTarget)) fokus = false; });

  /* ── Kosmos zeichnen ──────────────────────────────────────────────────── */
  // Wie cosmos.js auf der Startseite: Fibonacci-Kugel mit Schalen und Jitter,
  // echte Perspektive, additive Leuchtpunkte (scharfer Kern, knapper Halo) und
  // Linien zwischen nahen Nachbarn. Ein Teil der Punkte bildet den Stern des
  // aktiven Ressorts (heller Kern, vier Strahlen) und fliegt beim Wechsel als
  // Schwarm zum nächsten Ressort.
  var cv = $('netz');
  var ctx = cv.getContext('2d');
  var COUNT = HANDY ? 600 : 1400;
  var STERN = HANDY ? 140 : 260;
  var CAM = 8.6, KUGEL = 2.55;
  var COL = ['59,255,212', '255,107,53', '123,111,240'];
  var RGB = [[59, 255, 212], [255, 107, 53], [123, 111, 240]];
  var gold = Math.PI * (3 - Math.sqrt(5));
  var netzP = new Float32Array(COUNT * 3), startP = new Float32Array(COUNT * 3);
  var versatz = new Float32Array(COUNT), saat = new Float32Array(COUNT), basis = new Float32Array(COUNT);
  var sternForm = new Float32Array(STERN * 2), sternIst = new Float32Array(STERN * 3);
  var sternBereit = false;
  for (var i = 0; i < COUNT; i++) {
    var inc = Math.acos(1 - 2 * (i / COUNT)), az = gold * i;
    var r = KUGEL * (0.55 + 0.45 * Math.sqrt(Math.random()));
    netzP[i * 3] = r * Math.sin(inc) * Math.cos(az) + (Math.random() - 0.5) * 0.5;
    netzP[i * 3 + 1] = r * Math.cos(inc) + (Math.random() - 0.5) * 0.5;
    netzP[i * 3 + 2] = r * Math.sin(inc) * Math.sin(az) + (Math.random() - 0.5) * 0.5;
    // Einflug: Start vor der Kugel, seitlich gestreut, Richtung Betrachter.
    var ea = Math.random() * 6.283, er = 1.5 + Math.random() * 4.5;
    startP[i * 3] = netzP[i * 3] + Math.cos(ea) * er;
    startP[i * 3 + 1] = netzP[i * 3 + 1] + Math.sin(ea) * er * 0.7;
    startP[i * 3 + 2] = 3 + Math.random() * 4.5;
    versatz[i] = Math.random();
    saat[i] = Math.random() * 6.283;
    basis[i] = 1.3 + Math.random() * 2.0;
  }
  // Sternform wie in cosmos.js: 8 % heller Kern, kompakter Kern, vier schmale Strahlen.
  for (var j = 0; j < STERN; j++) {
    var wurf = Math.random(), sx, sy;
    if (wurf < 0.08) {
      sx = (Math.random() - 0.5) * 0.06; sy = (Math.random() - 0.5) * 0.06; basis[j] = 5.2;
    } else if (wurf < 0.52) {
      var cr = Math.pow(Math.random(), 2.6) * 0.3, a1 = Math.random() * 6.283;
      sx = cr * Math.cos(a1); sy = cr * Math.sin(a1);
    } else {
      var strahl = Math.floor(Math.random() * 4);
      var lang = (strahl < 2 ? 1.7 : 1.05) * (0.92 + Math.random() * 0.16);
      var dd = [[0, 1], [0, -1], [1, 0], [-1, 0]][strahl];
      var weit = Math.pow(Math.random(), 2.1) * lang, wob = (1 - weit / lang) * 0.09;
      sx = dd[0] * weit + (Math.random() - 0.5) * wob; sy = dd[1] * weit + (Math.random() - 0.5) * wob;
    }
    sternForm[j * 2] = sx * 0.62; sternForm[j * 2 + 1] = sy * 0.62;
  }
  var paare = [];
  var maxPaare = HANDY ? 300 : 720;
  for (var versuch = 0; paare.length < maxPaare && versuch < COUNT * 30; versuch++) {
    var pa = STERN + ((Math.random() * (COUNT - STERN)) | 0), pb = STERN + ((Math.random() * (COUNT - STERN)) | 0);
    if (pa === pb) continue;
    var dx = netzP[pa * 3] - netzP[pb * 3], dy = netzP[pa * 3 + 1] - netzP[pb * 3 + 1], dz = netzP[pa * 3 + 2] - netzP[pb * 3 + 2];
    if (dx * dx + dy * dy + dz * dz < 1.05) paare.push([pa, pb]);
  }
  // Leuchtpunkt einmal vorzeichnen, wie der Shader in cosmos.js: scharfer Kern plus knapper Halo.
  function sprite(rgb) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), bild = g.createImageData(64, 64);
    for (var py = 0; py < 64; py++) for (var px = 0; px < 64; px++) {
      var d = Math.hypot(px - 31.5, py - 31.5) / 32;
      var kern = d >= 0.42 ? 0 : d <= 0.14 ? 1 : 1 - (d - 0.14) / 0.28;
      kern = kern * kern * (3 - 2 * kern);
      var a = Math.min(1, kern + Math.pow(Math.max(0, 1 - d), 3.5) * 0.3), o = (py * 64 + px) * 4;
      bild.data[o] = rgb[0]; bild.data[o + 1] = rgb[1]; bild.data[o + 2] = rgb[2]; bild.data[o + 3] = Math.round(a * 255);
    }
    g.putImageData(bild, 0, 0);
    return c;
  }
  var SPRITES = RGB.map(sprite);
  var neig = { x: 0, y: 0, zx: 0, zy: 0 };
  var orbitEl = cv.parentElement;
  if (!REDUZIERT) {
    // Wie auf der Startseite neigt sich das Netz leicht zur Maus.
    orbitEl.addEventListener('pointermove', function (e) {
      var b = orbitEl.getBoundingClientRect();
      neig.zx = ((e.clientX - b.left) / b.width - 0.5) * 0.5;
      neig.zy = ((e.clientY - b.top) / b.height - 0.5) * 0.35;
    });
    orbitEl.addEventListener('pointerleave', function () { neig.zx = 0; neig.zy = 0; });
  }
  var groesse = { w: 0, h: 0, dpr: 1 };

  function messen() {
    groesse.dpr = Math.min(HANDY ? 1.5 : 2, window.devicePixelRatio || 1);
    groesse.w = cv.clientWidth; groesse.h = cv.clientHeight;
    cv.width = Math.round(groesse.w * groesse.dpr); cv.height = Math.round(groesse.h * groesse.dpr);
    if (REDUZIERT) zeichnen(performance.now());
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(messen).observe(cv); else window.addEventListener('resize', messen);
  messen();

  function glow(x, y, r, c, a) {
    ctx.fillStyle = 'rgba(' + c + ',' + (a * 0.18) + ')';
    ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(' + c + ',' + a + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
  var bildX = new Float32Array(COUNT), bildY = new Float32Array(COUNT), bildOk = new Uint8Array(COUNT);

  function zeichnen(jetzt) {
    var w = groesse.w, h = groesse.h;
    if (!w || !h || !ctx) return;
    ctx.setTransform(groesse.dpr, 0, 0, groesse.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var S = Math.min(w, h), cx = w / 2, cy = h / 2, RR = 0.38 * S;
    var F = 0.34 * S * CAM / KUGEL, skala = S / 1000;
    var t = (jetzt - t0) / 1000;
    var dt = REDUZIERT ? 1 : Math.min(0.05, (jetzt - (zeichnen.letzt || jetzt)) / 1000);
    zeichnen.letzt = jetzt;
    var einflug = REDUZIERT ? 1 : Math.max(0, Math.min(1, (jetzt - t0) / 1800));
    neig.x += (neig.zx - neig.x) * 0.06; neig.y += (neig.zy - neig.y) * 0.06;
    var rot = (REDUZIERT ? 0.6 : t * 0.12) + neig.x, kipp = 0.25 + neig.y;
    var cr = Math.cos(rot), sr = Math.sin(rot), ck = Math.cos(kipp), sk = Math.sin(kipp);
    var knoten = TEAMS.map(function (_, k) {
      var a = -Math.PI / 2 + (k * 2 * Math.PI) / TEAMS.length;
      return { x: cx + RR * Math.cos(a), y: cy + RR * Math.sin(a) };
    });
    var akt = z.team;

    ctx.globalCompositeOperation = 'lighter';
    // Netz: Punkte drehen sich, beim Einflug kommen sie von vorne ins Bild.
    for (var i = STERN; i < COUNT; i++) {
      var o = i * 3, x = netzP[o], y = netzP[o + 1], zz = netzP[o + 2];
      var X = x * cr - zz * sr, Z1 = x * sr + zz * cr;
      var Y = y * ck - Z1 * sk, Z = y * sk + Z1 * ck;
      var ein = einflug >= 1 ? 1 : ease((einflug - versatz[i] * 0.35) / 0.45);
      if (ein < 1) {
        X = startP[o] + (X - startP[o]) * ein;
        Y = startP[o + 1] + (Y - startP[o + 1]) * ein;
        Z = startP[o + 2] + (Z - startP[o + 2]) * ein;
      }
      var abst = CAM - Z;
      if (abst < 0.4) { bildOk[i] = 0; continue; }
      var k = F / abst;
      var px = cx + X * k, py = cy + Y * k;
      bildX[i] = px; bildY[i] = py; bildOk[i] = 1;
      var gr = Math.max(2.5, Math.min(64, basis[i] * 52 / abst) * skala * 1.6);
      ctx.globalAlpha = Math.min(1, ein * 2.5) * (0.35 + 0.65 * Math.max(0, Math.min(1, (Z + KUGEL) / (2 * KUGEL))));
      ctx.drawImage(SPRITES[0], px - gr / 2, py - gr / 2, gr, gr);
    }
    // Linien erst, wenn fast alle Punkte gelandet sind, wie auf der Startseite.
    var linien = einflug >= 1 ? 1 : ease((einflug - 0.82) / 0.18);
    if (linien > 0.01) {
      ctx.globalAlpha = 0.28 * linien;
      ctx.strokeStyle = 'rgb(59,255,212)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (var p2 = 0; p2 < paare.length; p2++) {
        var a2 = paare[p2][0], b2 = paare[p2][1];
        if (!bildOk[a2] || !bildOk[b2]) continue;
        ctx.moveTo(bildX[a2], bildY[a2]); ctx.lineTo(bildX[b2], bildY[b2]);
      }
      ctx.stroke();
    }
    // Stern des aktiven Ressorts: Seine Punkte lösen sich aus dem Netz und fliegen gestaffelt zum Ziel.
    var ziel = knoten[akt], zx = (ziel.x - cx) / (F / CAM), zy = (ziel.y - cy) / (F / CAM);
    var farbe = akt % 3;
    if (!sternBereit) {
      for (var s0 = 0; s0 < STERN; s0++) {
        sternIst[s0 * 3] = startP[s0 * 3]; sternIst[s0 * 3 + 1] = startP[s0 * 3 + 1]; sternIst[s0 * 3 + 2] = startP[s0 * 3 + 2];
      }
      sternBereit = true;
    }
    var los = REDUZIERT ? 1 : ease((einflug - 0.5) / 0.5);
    for (var s = 0; s < STERN; s++) {
      var so = s * 3;
      if (REDUZIERT) {
        sternIst[so] = zx + sternForm[s * 2]; sternIst[so + 1] = zy + sternForm[s * 2 + 1]; sternIst[so + 2] = 0;
      } else if (los > 0) {
        var tempo = 1 - Math.exp(-dt * (1.6 + versatz[s] * 2.6) * los);
        sternIst[so] += (zx + sternForm[s * 2] - sternIst[so]) * tempo;
        sternIst[so + 1] += (zy + sternForm[s * 2 + 1] - sternIst[so + 1]) * tempo;
        sternIst[so + 2] += (0 - sternIst[so + 2]) * tempo;
      }
      var abst2 = CAM - sternIst[so + 2];
      if (abst2 < 0.4) continue;
      var k2 = F / abst2;
      var funkeln = REDUZIERT ? 1 : 1 + 0.18 * Math.sin(t * 2.6 + saat[s]);
      var gr2 = Math.max(2.5, Math.min(64, basis[s] * 52 / abst2) * skala * 2 * funkeln);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(SPRITES[farbe], cx + sternIst[so] * k2 - gr2 / 2, cy + sternIst[so + 1] * k2 - gr2 / 2, gr2, gr2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Kreisbahn der Ressorts und eine dezente Speiche zum aktiven.
    ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(45,47,58,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(59,255,212,0.35)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ziel.x, ziel.y); ctx.stroke();
    // Puls, sobald der Schwarm am neuen Ressort ankommt.
    var bt = schwarm.start < 0 || REDUZIERT ? 9 : (jetzt - schwarm.start) / 1000;
    var puls = (bt - 0.6) / 0.8;
    if (puls > 0 && puls < 1) {
      ctx.strokeStyle = 'rgba(' + COL[farbe] + ',' + (1 - puls) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ziel.x, ziel.y, 14 + puls * 40, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
    }
    // Mitglieder kreisen als gleich große Trabanten um den Stern.
    var cnt = TEAMS[akt].n, orb = 0.085 * S;
    for (var m = 0; m < cnt; m++) {
      var am = (REDUZIERT ? 0 : t * 0.5) + (m * 6.283) / cnt;
      glow(ziel.x + Math.cos(am) * orb, ziel.y + Math.sin(am) * orb, 2.6, COL[2], 0.9);
    }
    // Fortschritt bis zum nächsten Wechsel.
    if (z.auto && !REDUZIERT) {
      var pr = Math.min(1, vergangen / z.intervall), rb = orb + 9, ende = -Math.PI / 2 + pr * 6.283;
      var halt = maus || fokus;
      ctx.strokeStyle = 'rgba(59,255,212,0.12)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ziel.x, ziel.y, rb, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = halt ? 'rgba(136,146,164,0.9)' : 'rgba(59,255,212,1)'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(ziel.x, ziel.y, rb, -Math.PI / 2, ende); ctx.stroke(); ctx.lineCap = 'butt';
      glow(ziel.x + Math.cos(ende) * rb, ziel.y + Math.sin(ende) * rb, 2.2, halt ? '136,146,164' : COL[0], 1);
      ctx.lineWidth = 1;
    }
  }

  function bild(jetzt) {
    raf = 0;
    if (!sichtbar || document.hidden) { zuletzt = 0; zeichnen.letzt = 0; return; }
    var dt = zuletzt ? Math.min(0.05, (jetzt - zuletzt) / 1000) : 0;
    zuletzt = jetzt;
    if (!t0) t0 = jetzt;
    if (z.auto && !maus && !fokus) {
      vergangen += dt;
      if (vergangen >= z.intervall) { waehlen((z.team + 1) % TEAMS.length, 0); render(); }
    }
    zeichnen(jetzt);
    raf = requestAnimationFrame(bild);
  }
  function starten() { if (!raf && !REDUZIERT) raf = requestAnimationFrame(bild); }
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(function (e) { sichtbar = e[0].isIntersecting; if (sichtbar) starten(); }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) starten(); });

  render();
  if (REDUZIERT) { t0 = performance.now(); zeichnen(t0); } else starten();
})();
