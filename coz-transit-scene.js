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

   TS-A1.7 (Nov 12 2026, his note: still no shrink on his iPhone): the page no longer lets its body
   become its own scroller (overflow-x clip), the scroll is read from whichever element scrolls and
   heard on the document, and developer view shows how the shrink is running in the stamp.

   TS-A1.6 (Nov 12 2026, from his screen recording): the water moves 1.8 times faster so it is
   easy to see, and the shrink to the top quarter checks itself on the first scroll (Safari
   stopped the scroll-linked version partway) and falls back to following the scroll frame by frame.
   TS-A1.5 (Nov 12 2026, his note: he cannot see the water move on his phone): the water layer
   now starts the way the Vedic lake does (in place from the start, no on-screen check while
   pinned, which Safari could leave switched off), and every wave rolls forward toward the viewer.
   TS-A1.4 (Nov 12 2026, his note: no movement at the bottom of the lake): the waves now run at
   full strength to the bottom of the scene and grow larger toward the front, and moonlit
   wave crests roll in across the dark water so its movement shows where there is little light.
   TS-A1.3 (Nov 12 2026, his ruling, as on the Vedic life-cycle pages): the scene is
   pinned. At the top of the page it is exactly the artwork as before (logo, title,
   wheel, water). As the page scrolls into the reading, the whole scene rises to the
   top of the screen and shrinks to the top quarter, keeping the wheel, the planets
   and the lit water (art rows 360 to 1110), softening into the page's own dark blue
   at its sides and bottom and dimming slightly; a band of that blue fills the sides
   so no text shows beside it. Driven by the browser's own scrolling (scroll-linked
   CSS animation) with a frame-synced fallback; size from the fixed screen height.
   TS-A1.2 (Nov 12 2026): the water's movement made clearly visible on a phone (about twice the
   ripple, more glints, a shimmer through the gold reflections) after he could not see it.
   TS-A1.1 (Nov 12 2026, his note "bring it to life"): the water lives, the same
   treatment as the Vedic lake: ripples below the shoreline, a slow broad flow and
   glints travelling across the lit reflections, drawn from his own artwork in a
   WebGL layer over the water only (art rows 830 to 1380, the shoreline at 845),
   under the paths and planets. It pauses when the water is off screen or the page
   is hidden. Reduced motion: no water layer, the art stays still.

   Motion, all of it: the water (above), the planet's rise and travel (once, when the page has its
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
      '.tt-scene{position:absolute;left:0;top:0;width:100%;height:calc(100cqw * ' + AH + ' / ' + AW + ');pointer-events:none;overflow:hidden;z-index:2}' +
      '.tt-water{position:absolute;left:0;width:100%;pointer-events:none;z-index:1;display:block}' +
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
    if (PIN) host = PIN.root;
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

  /* ---------------- TS-A1.1: the living water ---------------- */
  var ART_H = 1850, W0 = 830, W1 = 1380, SHORE = 845;
  var VS = 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS =
    'precision highp float;varying vec2 u;uniform sampler2D A;uniform float T,Y0,Y1,S,PN;' +
    'void main(){' +
      'float y=mix(Y0,Y1,u.y);' +                                   /* row in the whole artwork, 0..1 */
      'float d=clamp((y-S)/(Y1-S),0.,1.);' +                       /* 0 at the shoreline, 1 at the bottom of the layer */
      'float k=smoothstep(0.,.05,d)*(PN>.5?1.:1.-smoothstep(.82,1.,u.y));' +   /* still at the shoreline; full strength to the bottom when pinned */
      'float f=mix(900.,260.,sqrt(d));float ph=y*f;' +
      'float dx=(sin(ph-T*1.1)*.55+sin(ph*.51-T*.75+u.x*5.)*.3+sin(y*60.-T*.32+u.x*2.2)*.15)*mix(.0030,.0190,d*d)*k;' +
      'float dy=sin(ph*.87-T*.9+u.x*2.5)*mix(.0003,.0024,d*d)*k;' +
      'vec3 c=texture2D(A,vec2(u.x+dx,y+dy)).rgb;' +
      'float lum=dot(c,vec3(.299,.587,.114));' +
      'float g=pow(max(0.,sin(ph*1.63-T*1.7+sin(u.x*11.+T*.6)*2.2)),10.)*(.55+.45*sin(u.x*37.+T*1.3+ph*.2))*smoothstep(.02,.25,d)*k;' +
      'c+=c*g*smoothstep(.1,.45,lum)*1.5+g*.06*vec3(.75,.82,1.)*smoothstep(0.,.3,d);' +
      'c*=1.+.24*sin(ph*.7-T*2.2+u.x*3.)*smoothstep(.18,.55,lum)*k;' +   /* the gold reflections shimmer */
      'float wv=y*mix(700.,140.,sqrt(d))+sin(u.x*7.+T*.45)*1.6+sin(u.x*17.-T*.7)*.6-T*1.05;' +
      'float crest=pow(max(0.,sin(wv)),26.)*smoothstep(.04,.35,d);' +
      'c+=vec3(.62,.72,.95)*crest*(.07+.10*d)*(.6+.4*sin(u.x*5.-T*.35))*k;' +   /* moonlit wave crests rolling in across the dark water */
      'float a=smoothstep(0.,.03,u.y);' +                          /* the layer\'s top edge melts into the painted art */
      'gl_FragColor=vec4(c*a,a);' +
    '}';
  function water(host) {
    if (PIN) host = PIN.root;
    if (!host || reduce || host.querySelector('.tt-water')) return;
    css();
    var cv = document.createElement('canvas');
    cv.className = 'tt-water';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.top = 'calc(100cqw * ' + W0 + ' / ' + AW + ')';
    cv.style.height = 'calc(100cqw * ' + (W1 - W0) + ' / ' + AW + ')';
    var gl = null;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false }); } catch (e) {}
    if (!gl) return;
    function sh(t, src) { var q = gl.createShader(t); gl.shaderSource(q, src); gl.compileShader(q); return gl.getShaderParameter(q, gl.COMPILE_STATUS) ? q : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(pr, 'T');
    gl.uniform1f(gl.getUniformLocation(pr, 'Y0'), W0 / ART_H);
    gl.uniform1f(gl.getUniformLocation(pr, 'Y1'), W1 / ART_H);
    gl.uniform1f(gl.getUniformLocation(pr, 'S'), SHORE / ART_H);
    gl.uniform1f(gl.getUniformLocation(pr, 'PN'), PIN ? 1 : 0);   /* pinned: the layer ends at the scene's edge, no fade needed */
    gl.clearColor(0, 0, 0, 0);
    host.insertBefore(cv, host.firstChild);     /* in place from the start (TS-A1.5); transparent until the art is loaded */
    var t0 = performance.now(), raf = 0, onScreen = true, ready = false;
    function draw() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ((performance.now() - t0) / 1000 * 1.8) % 600);   /* TS-A1.6: water moves 1.8x faster, his note */
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() { raf = 0; if (!ready || document.hidden || !onScreen) return; draw(); raf = requestAnimationFrame(loop); }
    function run() { if (!raf) raf = requestAnimationFrame(loop); }
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { (img.decode ? img.decode().catch(function () {}) : Promise.resolve()).then(start); };
    function start() {
      var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(gl.getUniformLocation(pr, 'A'), 0);
      ready = true; draw(); run();
    }
    img.src = 'tropical-transits-bg.jpg?v=1';
    document.addEventListener('visibilitychange', function () { if (!document.hidden) run(); });
    /* the pinned scene is always on screen, so the on-screen check is only used when the scene scrolls away */
    if (!PIN && global.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) run(); }).observe(cv);
  }

  /* ---------------- TS-A1.3: pinned, shrinking to the top quarter while reading ---------------- */
  var PIN = null;
  var KEEP_TOP = 360, KEEP_BOT = 1110, QUARTER = .25, WATERC = 'rgb(0,0,6)';
  function pin() {
    if (PIN) return PIN;
    var page = document.querySelector('.page'), hero = page && page.querySelector('.hero');
    if (!page || !hero) return null;
    var st = document.createElement('style');
    st.textContent =
      '.tt-pin{position:fixed;top:0;left:0;right:0;margin:0 auto;width:100%;max-width:640px;aspect-ratio:' + AW + '/' + AH + ';z-index:30;' +
        'container-type:inline-size;overflow:hidden;transform-origin:50% 0;pointer-events:auto}' +
      '.tt-pin-art{position:absolute;inset:0;background:url("tropical-transits-bg.jpg?v=1") center top/100% auto no-repeat,' + WATERC + '}' +
      '.tt-pin .tt-pin-head{position:relative;z-index:3}' +
      '.tt-pin-veil{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;' +
        'background:linear-gradient(90deg,rgba(0,0,6,1) 0%,rgba(0,0,6,0) 13%,rgba(0,0,6,0) 87%,rgba(0,0,6,1) 100%),' +
        'linear-gradient(180deg,rgba(0,0,6,.18) 0%,rgba(0,0,6,.18) ' + (KEEP_BOT / AH * 100 - 13).toFixed(1) + '%,rgba(0,0,6,.8) ' + (KEEP_BOT / AH * 100 - 3).toFixed(1) + '%,rgba(0,0,6,1) ' + (KEEP_BOT / AH * 100).toFixed(1) + '%)}' +
      '.tt-pin-band{position:fixed;top:0;left:0;right:0;z-index:29;height:0;transform-origin:50% 0;transform:scaleY(0);background:' + WATERC + ';pointer-events:auto}';
    document.head.appendChild(st);
    var root = document.createElement('div'); root.className = 'tt-pin';
    var art = document.createElement('div'); art.className = 'tt-pin-art'; root.appendChild(art);
    var head = document.createElement('div'); head.className = 'hero tt-pin-head';      /* his logo and title, moved in with the art */
    while (hero.firstChild) head.appendChild(hero.firstChild);
    root.appendChild(head);
    var veil = document.createElement('div'); veil.className = 'tt-pin-veil'; root.appendChild(veil);
    var band = document.createElement('div'); band.className = 'tt-pin-band'; band.setAttribute('aria-hidden', 'true');
    document.body.appendChild(band); document.body.appendChild(root);

    var G = null, lastW = 0, tick = 0, tlStyle = null, TL = false;
    /* TS-A1.7: read the scroll from whichever element is scrolling (on his iPhone the page body
       may be the scroller, which leaves the window's own position at 0) */
    function sy() {
      var se = document.scrollingElement, b = document.body, d = document.documentElement;
      return Math.max(0, global.pageYOffset || 0, se ? se.scrollTop : 0, b ? b.scrollTop : 0, d ? d.scrollTop : 0);
    }
    try { TL = !!(global.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')); } catch (e) {}
    function geo() {
      var W = root.offsetWidth, k = W / AW, H = AH * k;
      var sh = (global.screen && global.screen.height) || global.innerHeight || 700;
      var target = Math.max(150, Math.min(sh * QUARTER, H * .6));
      var s1 = target / ((KEEP_BOT - KEEP_TOP) * k);
      return { W: W, k: k, H: H, target: target, s1: s1, ty1: -KEEP_TOP * k * s1, clip1: (AH - KEEP_BOT) * k, D: Math.max(1, H - target) };
    }
    /* q: how far the shrink has gone (0..1); the visible bottom edge at q */
    function at(q) {
      var g = G, s = 1 + (g.s1 - 1) * q, ty = g.ty1 * q, clip = g.clip1 * q;
      return { s: s, ty: ty, clip: clip, bottom: ty + s * (g.H - clip) };
    }
    /* the q that puts the bottom edge exactly where the reading's top has scrolled to, so they move together */
    function qFor(p) {
      var want = G.H - p * (G.H - G.target), lo = 0, hi = 1;
      for (var i = 0; i < 22; i++) { var m = (lo + hi) / 2; if (at(m).bottom > want) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function frame(q) {
      var a = at(q);
      return { tf: 'translateY(' + a.ty.toFixed(2) + 'px) scale(' + a.s.toFixed(4) + ')', clip: 'inset(0px 0px ' + a.clip.toFixed(2) + 'px 0px)', bottom: a.bottom };
    }
    function apply(p) {
      var q = qFor(p), f = frame(q);
      root.style.transform = q ? f.tf : '';
      root.style.clipPath = q ? f.clip : '';
      veil.style.opacity = q.toFixed(3);
      band.style.transform = 'scaleY(' + (q > 0 ? f.bottom / G.H : 0).toFixed(4) + ')';
    }
    function layout() {
      G = geo(); lastW = G.W;
      band.style.height = G.H + 'px';
      if (TL) {
        if (!tlStyle) { tlStyle = document.createElement('style'); document.head.appendChild(tlStyle); }
        var kr = '', kv = '', kb = '';
        for (var i = 0; i <= 10; i++) {
          var p = i / 10, q = qFor(p), f = frame(q), o = (i * 10) + '%';
          kr += o + '{transform:' + f.tf + ';clip-path:' + f.clip + '}';
          kv += o + '{opacity:' + q.toFixed(3) + '}';
          kb += o + '{transform:scaleY(' + (i ? f.bottom / G.H : 0).toFixed(4) + ')}';
          if (i === 0) kb += '0.5%{transform:scaleY(1)}';
        }
        var run = 'animation-timing-function:linear;animation-fill-mode:both;animation-duration:1ms;animation-duration:auto;' +
                  'animation-timeline:scroll(root block);animation-range:0px ' + G.D.toFixed(1) + 'px;';
        tlStyle.textContent = '@keyframes ttPin{' + kr + '}@keyframes ttVeil{' + kv + '}@keyframes ttBand{' + kb + '}' +
          '.tt-pin{animation-name:ttPin;' + run + '}.tt-pin-veil{animation-name:ttVeil;' + run + '}.tt-pin-band{animation-name:ttBand;' + run + '}';
      } else {
        apply(Math.min(1, sy() / G.D));
      }
    }
    function onScroll() {
      if (tick) return;
      tick = requestAnimationFrame(function () { tick = 0; apply(Math.min(1, sy() / G.D)); });
    }
    /* TS-A1.6: Safari on his iPhone ran the scroll-linked animation but stopped it partway (the
       scene stayed large). On the first scroll past the start the page compares the scene's real
       size with the size it should have; if they differ it drops the CSS animation and follows
       the scroll frame by frame instead. */
    var verified = !TL;
    function verify() {
      if (verified || !G) return;
      var p = Math.min(1, sy() / G.D);
      if (p < .05) return;
      /* checked on every scroll, because the page grows when a drop-down opens */
      var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(root).transform || ''), sNow = m ? parseFloat(m[1].split(',')[0]) : 1;
      if (Math.abs(sNow - at(qFor(p)).s) > .06) {
        verified = true; TL = false; if (tlStyle) tlStyle.textContent = '';
        document.addEventListener('scroll', onScroll, { passive: true, capture: true });
        apply(Math.min(1, p));
      }
    }
    if (TL) document.addEventListener('scroll', function () { if (!verified) requestAnimationFrame(verify); }, { passive: true, capture: true });
    else document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    global.addEventListener('resize', function () { if (root.offsetWidth !== lastW) layout(); });   /* Safari's bars changing height do not count */
    layout();
    PIN = { root: root, bottom: function () { return G ? G.target : 0; },
      /* developer view only: how the shrink is running on this device */
      state: function () {
        var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(root).transform || '');
        var se = document.scrollingElement;
        return (TL ? 'css' : 'js') + ' y' + Math.round(sy()) + ' w' + Math.round(global.pageYOffset || 0) + ' b' + Math.round(document.body.scrollTop || 0) +
          (se && se !== document.documentElement ? ' se=' + se.nodeName : '') + ' s' + (m ? parseFloat(m[1].split(',')[0]).toFixed(2) : '1.00') + (G ? '/' + G.s1.toFixed(2) + ' D' + Math.round(G.D) : '');
      } };
    return PIN;
  }

  global.CozTransitScene = { play: play, water: water, pin: pin, pinBottom: function () { return PIN ? PIN.bottom() : 0; }, pinState: function () { return PIN ? PIN.state() : 'no pin'; } };
})(window);
