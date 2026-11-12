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
    'precision highp float;varying vec2 u;uniform sampler2D A;uniform float T,Y0,Y1,S;' +
    'void main(){' +
      'float y=mix(Y0,Y1,u.y);' +                                   /* row in the whole artwork, 0..1 */
      'float d=clamp((y-S)/(Y1-S),0.,1.);' +                       /* 0 at the shoreline, 1 at the bottom of the layer */
      'float k=smoothstep(0.,.05,d)*smoothstep(1.,.82,u.y);' +     /* still at the shoreline and at the layer\'s bottom edge */
      'float f=mix(900.,260.,sqrt(d));float ph=y*f;' +
      'float dx=(sin(ph+T*1.1)*.55+sin(ph*.51-T*.75+u.x*5.)*.3+sin(y*60.-T*.32+u.x*2.2)*.15)*mix(.0012,.0052,d)*k;' +
      'float dy=sin(ph*.87+T*.9+u.x*2.5)*mix(.00012,.0005,d)*k;' +
      'vec3 c=texture2D(A,vec2(u.x+dx,y+dy)).rgb;' +
      'float lum=dot(c,vec3(.299,.587,.114));' +
      'float g=pow(max(0.,sin(ph*1.63+T*1.7+sin(u.x*11.+T*.6)*2.2)),18.)*(.55+.45*sin(u.x*37.+T*1.3+ph*.2))*smoothstep(.02,.25,d)*k;' +
      'c+=c*g*smoothstep(.12,.5,lum)*.9+g*.035*vec3(.75,.82,1.)*smoothstep(0.,.3,d);' +
      'float a=smoothstep(0.,.03,u.y);' +                          /* the layer\'s top edge melts into the painted art */
      'gl_FragColor=vec4(c*a,a);' +
    '}';
  function water(host) {
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
    gl.clearColor(0, 0, 0, 0);
    var t0 = performance.now(), raf = 0, onScreen = true, ready = false;
    function draw() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ((performance.now() - t0) / 1000) % 600);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() { raf = 0; if (!ready || document.hidden || !onScreen) return; draw(); raf = requestAnimationFrame(loop); }
    function run() { if (!raf) raf = requestAnimationFrame(loop); }
    var img = new Image();
    img.onload = function () {
      var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(gl.getUniformLocation(pr, 'A'), 0);
      ready = true; host.insertBefore(cv, host.firstChild); run();
    };
    img.src = 'tropical-transits-bg.jpg?v=1';
    document.addEventListener('visibilitychange', function () { if (!document.hidden) run(); });
    if (global.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) run(); }).observe(cv);
  }

  global.CozTransitScene = { play: play, water: water };
})(window);
