/* ============================================================
   COZALYZE · TROPICAL · TRANSIT SCENE · TS-A1.0 (Nov 11 2026, staging only)
   tropical-current-transits.html. His ruling (Nov 11 2026): bring the lake
   animation idea to the Tropical cycles, "transit travels to wheel".

   On his transits artwork (tropical-transits-bg.jpg, 850 x 1850; wheel centre
   423,615, rim radius 225, shoreline row 845), each active transit (up to two
   faster planets and one slower, exactly the ones the page reads) comes up out
   of the water, travels a gold path around the wheel to a star point on its rim,
   and stops where its status puts it:
     exact       it rests on the star point, which glows
     building    it stops on the path short of the rim, nearer the tighter the orb
     easing      it touches the star point, then drifts back down the path
   Planets are his plain planet art (lake-orb-<planet>.webp). The gold path and
   ripple rings are drawn in code to match his Vedic lake concept. Nothing is
   written over the wheel or the water; every word stays below the water.
   Note his Sep 24 rule that the wheel never implies real positions: the star
   points are fixed slots, not the natal points' zodiac places.

   Motion, all of it: the planet's rise and travel (once, when the page has its
   transits), the path brightening while it travels and resting softly lit after,
   a small light running along each path, ripple rings spreading slowly where each
   planet came up, a slow glow on an exact star point, and a slight float on the
   planets at rest. Reduced motion: everything placed at once, nothing moving.
   ============================================================ */
(function (global) {
  'use strict';
  if (global.CozTransitScene) return;

  var AW = 850, AH = 1380;                 /* the hero area of the artwork, down to where text starts */
  var C = { x: 423, y: 615 }, RIM = 225;   /* wheel centre and rim */
  var SIZE = 66;                           /* planet height in art px */
  var ORB_A = { sun: 1.014, moon: .983, mars: .978, mercury: .969, jupiter: .975, venus: .989, saturn: 2.278 };
  /* Three fixed slots: the slower planet to the top star, the two faster to the side stars. */
  var SLOTS = [
    { ep: { x: 423, y: 1010 }, deg: 270, c1: { x: 40,  y: 990 }, c2: { x: 30,  y: 300 } },   /* top, sweeping wide round the left */
    { ep: { x: 300, y: 960 },  deg: 180, c1: { x: 190, y: 905 }, c2: { x: 150, y: 720 } },   /* left star, close in */
    { ep: { x: 546, y: 960 },  deg: 0,   c1: { x: 730, y: 900 }, c2: { x: 760, y: 700 } }    /* right star */
  ];
  var reduce = false;
  try { reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function key(l) { return String(l || '').toLowerCase(); }
  function rimPt(deg) { var r = deg * Math.PI / 180; return { x: C.x + RIM * Math.cos(r), y: C.y + RIM * Math.sin(r) }; }
  function bez(P, t) {
    var u = 1 - t;
    return { x: u*u*u*P.p0.x + 3*u*u*t*P.c1.x + 3*u*t*t*P.c2.x + t*t*t*P.p3.x,
             y: u*u*u*P.p0.y + 3*u*u*t*P.c1.y + 3*u*t*t*P.c2.y + t*t*t*P.p3.y };
  }
  function anim(el, frames, opt) {
    if (!el.animate) { var l = frames[frames.length - 1]; for (var k in l) if (k !== 'offset') el.style[k] = l[k]; return Promise.resolve(); }
    var a = el.animate(frames, opt);
    return new Promise(function (r) { a.onfinish = function () { r(a); }; a.oncancel = function () { r(a); }; });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function load(u) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = u; }); }

  function css() {
    if (document.getElementById('cozTSceneCSS')) return;
    var s = document.createElement('style');
    s.id = 'cozTSceneCSS';
    s.textContent =
      '.tt-scene{position:absolute;left:0;top:0;width:100%;height:calc(100cqw * ' + AH + ' / ' + AW + ');pointer-events:none;overflow:hidden}' +
      '.tt-scene svg{position:absolute;inset:0;width:100%;height:100%}' +
      '.tt-scene .tt-path{opacity:.3}' +
      '.tt-scene .tt-spark{stroke-dasharray:40 1600;animation:ttSpark 8s linear infinite}' +
      '@keyframes ttSpark{from{stroke-dashoffset:1640}to{stroke-dashoffset:0}}' +
      '.tt-scene .tt-rip ellipse{transform-box:fill-box;transform-origin:center;animation:ttRip 6.5s ease-out infinite;opacity:0}' +
      '.tt-scene .tt-rip ellipse:nth-child(2){animation-delay:2.2s}.tt-scene .tt-rip ellipse:nth-child(3){animation-delay:4.4s}' +
      '@keyframes ttRip{0%{transform:scale(.25);opacity:0}15%{opacity:.5}100%{transform:scale(1);opacity:0}}' +
      '.tt-scene .tt-star{opacity:0}' +
      '.tt-scene .tt-star.on{animation:ttStar 3.6s ease-in-out infinite}' +
      '@keyframes ttStar{0%,100%{opacity:.55}50%{opacity:1}}' +
      '.tt-scene .tt-pl{position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity}' +
      '.tt-scene .tt-pl img{width:100%;height:100%;display:block;filter:drop-shadow(0 0 6px rgba(255,196,120,.6))}' +
      '.tt-scene .tt-pl.rest img{animation:ttBob 7s ease-in-out infinite}' +
      '@keyframes ttBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}' +
      '@media (prefers-reduced-motion:reduce){.tt-scene .tt-spark,.tt-scene .tt-rip ellipse,.tt-scene .tt-star.on,.tt-scene .tt-pl.rest img{animation:none}.tt-scene .tt-star.on{opacity:.8}}';
    document.head.appendChild(s);
  }

  /* where on its path a transit rests: 1 is the star point */
  function restT(h) {
    if (h.status === 'exact') return 1;
    var allowed = h.allowed || 3, near = Math.max(0, Math.min(1, 1 - h.orb / allowed));
    return .5 + .44 * near;
  }

  function play(host, d) {
    if (!host || !d || !d.ok) return;
    var list = [];
    if (d.slow) list.push(d.slow);
    (d.fast || []).forEach(function (h) { list.push(h); });
    list = list.filter(function (h) { return ORB_A[key(h.planet)]; }).slice(0, 3);
    if (!list.length) return;
    css();
    var old = host.querySelector('.tt-scene'); if (old) old.parentNode.removeChild(old);
    var sc = document.createElement('div');
    sc.className = 'tt-scene';
    sc.setAttribute('aria-hidden', 'true');
    var svg = '<svg viewBox="0 0 ' + AW + ' ' + AH + '" preserveAspectRatio="none"><defs>' +
      '<radialGradient id="ttStarG"><stop offset="0" stop-color="#fff3d6" stop-opacity="1"/><stop offset=".35" stop-color="#ffd38a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>';
    /* the slower planet takes the top star; faster ones the side stars; a single transit takes the top */
    var slotIdx = d.slow ? [0, 1, 2] : (list.length === 1 ? [0] : [1, 2]);
    var paths = list.map(function (h, i) {
      var s = SLOTS[slotIdx[i]];
      return { h: h, s: s, P: { p0: s.ep, c1: s.c1, c2: s.c2, p3: rimPt(s.deg) } };
    });
    paths.forEach(function (o, i) {
      var P = o.P, dd = 'M' + P.p0.x + ' ' + P.p0.y + 'C' + P.c1.x + ' ' + P.c1.y + ' ' + P.c2.x + ' ' + P.c2.y + ' ' + P.p3.x + ' ' + P.p3.y;
      svg += '<g class="tt-rip" opacity=".7">' +
        [0, 1, 2].map(function () { return '<ellipse cx="' + P.p0.x + '" cy="' + P.p0.y + '" rx="120" ry="20" fill="none" stroke="#ffc477" stroke-width="1.6"/>'; }).join('') + '</g>' +
        '<g class="tt-path" data-i="' + i + '">' +
          '<path d="' + dd + '" fill="none" stroke="#ffcf86" stroke-width="12" stroke-linecap="round" opacity=".10"/>' +
          '<path d="' + dd + '" fill="none" stroke="#ffcf86" stroke-width="6" stroke-linecap="round" opacity=".22"/>' +
          '<path d="' + dd + '" fill="none" stroke="#ffd99a" stroke-width="1.8" stroke-linecap="round" opacity=".95"/>' +
          '<path class="tt-spark" d="' + dd + '" fill="none" stroke="#fff1d0" stroke-width="2.4" stroke-linecap="round" opacity=".9" style="animation-delay:-' + (i * 2.4) + 's"/>' +
        '</g>' +
        '<circle class="tt-star" data-i="' + i + '" cx="' + P.p3.x + '" cy="' + P.p3.y + '" r="30" fill="url(#ttStarG)"/>';
    });
    svg += '</svg>';
    sc.innerHTML = svg;
    host.insertBefore(sc, host.firstChild);

    function k() { return sc.clientWidth / AW; }
    function tf(o, x, y, s) {
      var a = ORB_A[key(o.h.planet)] || 1, w = SIZE * a, kk = k();
      return 'translate(' + ((x - w / 2) * kk).toFixed(2) + 'px,' + ((y - SIZE / 2) * kk).toFixed(2) + 'px) scale(' + s + ')';
    }
    function size(o, el) { var a = ORB_A[key(o.h.planet)] || 1, kk = k(); el.style.width = (SIZE * a * kk) + 'px'; el.style.height = (SIZE * kk) + 'px'; }

    var els = paths.map(function (o) {
      var el = document.createElement('div'); el.className = 'tt-pl';
      el.innerHTML = '<img alt="" src="lake-orb-' + key(o.h.planet) + '.webp?v=1">';
      sc.appendChild(el); size(o, el); return el;
    });
    function place(i, t) { var o = paths[i], p = bez(o.P, t); els[i].style.transform = tf(o, p.x, p.y, 1); }
    global.addEventListener('resize', function () {
      paths.forEach(function (o, i) { size(o, els[i]); if (els[i].dataset.t) { stopAll(els[i]); place(i, +els[i].dataset.t); } });
    });
    function stopAll(el) { if (el.getAnimations) el.getAnimations().forEach(function (a) { if (!a.animationName) a.cancel(); }); }
    var pathEls = [].slice.call(sc.querySelectorAll('.tt-path')), starEls = [].slice.call(sc.querySelectorAll('.tt-star'));

    function travel(i) {
      var o = paths[i], el = els[i], end = restT(o.h), easing = o.h.status === 'separating';
      var stopAt = easing ? 1 : end;
      if (reduce) { el.style.opacity = '1'; place(i, end); el.dataset.t = end; el.classList.add('rest'); if (end === 1 || easing) starEls[i].classList.add('on'); return Promise.resolve(); }
      anim(pathEls[i], [{ opacity: .3 }, { opacity: .95 }], { duration: 600, fill: 'forwards' });
      var ep = o.P.p0;
      return anim(el, [
        { transform: tf(o, ep.x, ep.y + 30, .6), opacity: 0 },
        { opacity: .85, offset: .5 },
        { transform: tf(o, ep.x, ep.y, 1), opacity: 1 }
      ], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).then(function () {
        var N = 30, fr = [];
        for (var n = 0; n <= N; n++) { var tt = n / N, p = bez(o.P, tt * stopAt); fr.push({ transform: tf(o, p.x, p.y, 1), offset: tt }); }
        return anim(el, fr, { duration: 1600 + 1300 * stopAt, easing: 'cubic-bezier(.42,0,.3,1)', fill: 'forwards' });
      }).then(function () {
        if (stopAt === 1) starEls[i].classList.add('on');
        if (!easing) return;
        /* easing: it has touched; it drifts back down the path to where it is now */
        return wait(500).then(function () {
          var N = 16, fr = [];
          for (var n = 0; n <= N; n++) { var tt = n / N, p = bez(o.P, 1 - (1 - end) * tt); fr.push({ transform: tf(o, p.x, p.y, 1), offset: tt }); }
          return anim(el, fr, { duration: 1500, easing: 'cubic-bezier(.4,0,.4,1)', fill: 'forwards' });
        });
      }).then(function () {
        stopAll(el); place(i, end); el.style.opacity = '1'; el.dataset.t = end; el.classList.add('rest');
        anim(pathEls[i], [{ opacity: .95 }, { opacity: .3 }], { duration: 1300, fill: 'forwards' });
      });
    }
    /* one after another, slower planet first */
    var chain = Promise.resolve();
    paths.forEach(function (o, i) { chain = chain.then(function () { var t = travel(i); return reduce ? t : wait(1100); }); });
    return chain;
  }

  global.CozTransitScene = { play: play };
})(window);
