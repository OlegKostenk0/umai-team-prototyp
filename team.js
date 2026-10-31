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

  /* ── Netz zeichnen ────────────────────────────────────────────────────── */
  var cv = $('netz');
  var ctx = cv.getContext('2d');
  var N = HANDY ? 80 : 150;
  var gold = Math.PI * (3 - Math.sqrt(5));
  var pts = [];
  for (var i = 0; i < N; i++) {
    var y = 1 - (2 * (i + 0.5)) / N;
    var rr = Math.sqrt(1 - y * y);
    var s = Math.sin(i * 12.9898) * 43758.5453;
    pts.push({ x: Math.cos(gold * i) * rr, y: y, z: Math.sin(gold * i) * rr, k: 0.75 + 0.35 * (s - Math.floor(s)), c: i % 10 < 7 ? 0 : (i % 10 < 9 ? 2 : 1) });
  }
  var nb = pts.map(function (p, a) {
    var d = pts.map(function (q, b) { return { b: b, d: a === b ? 9 : (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) + (p.z - q.z) * (p.z - q.z) }; });
    d.sort(function (u, v) { return u.d - v.d; });
    return [d[0].b, d[1].b];
  });
  var fluss = [];
  for (var q = 0; q < 18; q++) fluss.push({ k: q % 6, u: (q * 0.379) % 1, v: 0.10 + ((q * 0.613) % 1) * 0.08, dir: q % 2 ? 1 : -1 });
  var COL = ['59,255,212', '255,107,53', '123,111,240'];
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

  function zeichnen(jetzt) {
    var w = groesse.w, h = groesse.h;
    if (!w || !h || !ctx) return;
    ctx.setTransform(groesse.dpr, 0, 0, groesse.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var S = Math.min(w, h), cx = w / 2, cy = h / 2, RR = 0.38 * S;
    var t = (jetzt - t0) / 1000;
    var einflug = REDUZIERT ? 1 : ease(t / 1.8);
    var rot = REDUZIERT ? 0.6 : t * 0.12, tilt = 0.35, Rs = 0.30 * S * (1 + 2.2 * (1 - einflug));
    var proj = pts.map(function (p) {
      var x1 = p.x * Math.cos(rot) - p.z * Math.sin(rot);
      var z1 = p.x * Math.sin(rot) + p.z * Math.cos(rot);
      var y2 = p.y * Math.cos(tilt) - z1 * Math.sin(tilt);
      var z2 = p.y * Math.sin(tilt) + z1 * Math.cos(tilt);
      return { x: cx + x1 * Rs * p.k, y: cy + y2 * Rs * p.k, d: (z2 + 1) / 2, c: p.c };
    });
    ctx.lineWidth = 1;
    proj.forEach(function (a, ai) {
      nb[ai].forEach(function (bi) {
        var b = proj[bi];
        ctx.strokeStyle = 'rgba(59,255,212,' + (0.07 * einflug * (a.d + b.d) / 2) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
    });
    proj.forEach(function (p) { glow(p.x, p.y, 0.8 + 1.2 * p.d, COL[p.c], einflug * (0.15 + 0.55 * p.d)); });

    var knoten = TEAMS.map(function (_, k) {
      var a = -Math.PI / 2 + (k * 2 * Math.PI) / TEAMS.length;
      return { x: cx + RR * Math.cos(a), y: cy + RR * Math.sin(a) };
    });
    var akt = z.team;
    ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(45,47,58,0.9)';
    ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    knoten.forEach(function (n, k) {
      ctx.strokeStyle = k === akt ? 'rgba(59,255,212,0.85)' : 'rgba(136,146,164,0.22)';
      ctx.lineWidth = k === akt ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
    });
    ctx.lineWidth = 1;
    if (!REDUZIERT) {
      var dt = Math.min(0.05, (jetzt - (zeichnen.letzt || jetzt)) / 1000);
      zeichnen.letzt = jetzt;
      fluss.forEach(function (f) {
        f.u = (f.u + f.v * dt * (f.k === akt ? 2 : 1)) % 1;
        var s2 = f.dir > 0 ? f.u : 1 - f.u, n = knoten[f.k];
        glow(cx + (n.x - cx) * s2, cy + (n.y - cy) * s2, f.k === akt ? 2 : 1.4, f.dir > 0 ? COL[0] : COL[2], f.k === akt ? 0.95 : 0.45);
      });
    }
    // Wechsel: Schwarm vom Zentrum zum neuen Ressort, dort ein Puls.
    var bt = schwarm.start < 0 || REDUZIERT ? 9 : (jetzt - schwarm.start) / 1000;
    if (bt < 1.4) {
      var nz = knoten[schwarm.ziel];
      for (var k = 0; k < 14; k++) {
        var sk = ease((bt - k * 0.03) / 0.7);
        if (sk <= 0 || sk >= 1) continue;
        var off = Math.sin(k * 2.1) * 10 * Math.sin(sk * Math.PI);
        glow(cx + (nz.x - cx) * sk - ((nz.y - cy) / RR) * off, cy + (nz.y - cy) * sk + ((nz.x - cx) / RR) * off, 2, COL[k % 3], 1 - sk * 0.4);
      }
      var pt = (bt - 0.7) / 0.7;
      if (pt > 0 && pt < 1) {
        ctx.strokeStyle = 'rgba(59,255,212,' + (1 - pt) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(nz.x, nz.y, 12 + pt * 38, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
      }
    }
    // Mitglieder kreisen als gleich große Trabanten.
    var an = knoten[akt], cnt = TEAMS[akt].n, orb = 0.07 * S;
    ctx.strokeStyle = 'rgba(123,111,240,0.25)';
    ctx.beginPath(); ctx.arc(an.x, an.y, orb, 0, 6.283); ctx.stroke();
    for (var m = 0; m < cnt; m++) {
      var am = (REDUZIERT ? 0 : t * 0.6) + (m * 6.283) / cnt;
      glow(an.x + Math.cos(am) * orb, an.y + Math.sin(am) * orb, 3, COL[2], 0.95);
    }
    // Fortschritt bis zum nächsten Wechsel.
    if (z.auto && !REDUZIERT) {
      var pr = Math.min(1, vergangen / z.intervall), rb = Math.min(22, orb * 0.6), ende = -Math.PI / 2 + pr * 6.283;
      var halt = maus || fokus;
      ctx.strokeStyle = 'rgba(59,255,212,0.15)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(an.x, an.y, rb, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = halt ? 'rgba(136,146,164,0.9)' : 'rgba(59,255,212,1)'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(an.x, an.y, rb, -Math.PI / 2, ende); ctx.stroke(); ctx.lineCap = 'butt';
      glow(an.x + Math.cos(ende) * rb, an.y + Math.sin(ende) * rb, 2.5, halt ? '136,146,164' : COL[0], 1);
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
