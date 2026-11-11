/* ============================================================
   COZALYZE · COZ_LAKE · LK1.4 (Nov 11 2026, staging only)
   The Current Life Cycle lake scene, shared by current-life-cycle.html,
   current-season.html, key-time-windows.html and what-comes-next.html.

   Jason's ruling (Nov 11 2026): one reusable scene, never 81 videos.
     MAIN slot  = the Mahadasha lord, in the sky. Drawn from his nine lake
                  scenes (lake-scene-<lord>.jpg), used exactly as supplied,
                  each with its own reflection painted into the water.
     SUB slot   = the Antardasha lord, on the water. His gold-ring planets
                  (lake-sub-<lord>.webp), cut from his sheet and his ring
                  Rahu / Ketu files, nothing redrawn.
     FLIGHT     = his plain planets and emblems (lake-orb-<lord>.webp), used
                  only for the rise from the medallion on the overview page.
   Timing comes only from cozChartJSON.lifeCycle; nothing is recalculated.

   LK1.1, his notes after seeing LK1.0 on his phone (Nov 11 2026):
     1. a more dramatic first reveal with a sense of build
     2. more life in the water
     3. no popping: the leaving subperiod planet rises away up the water's
        centre line (the line of the sky planet's reflection) and the
        arriving one rises into place along the same line, both moving at once
     4. the scene takes less of the screen while reading
   Motion, all of it, so it can be named and changed one item at a time:
     a. water: ripples below the shoreline, slow broad flow, glints that
        travel across the lit reflections (WebGL)
     b. the whole scene breathes very slightly, 1% over 22 s, centred on
        the sky planet so the planet itself stays put
     c. the water planet floats, 7 s, about 1% of its height
     d. subperiod change: the leaving planet rises up the centre line toward
        the shoreline, growing smaller and fading as it goes, while the
        arriving planet rises up the same line from below the frame
     e. Mahadasha change: the water planet leaves the same way, the sky
        dissolves to the next lord's scene, the next water planet arrives
     f. overview only, the reveal: the medallion gathers light, his planet
        lifts out of it glowing and climbs to the sky, the lake opens around
        it as it rises while the scene brightens and settles from a
        slight zoom, the planet lands in the painted sky, the water wakes,
        then the subperiod planet rises
     g. LK1.2 (his ruling, Nov 11 2026, option A of the two he was shown):
        as the page scrolls into the reading, the whole scene rises to the
        very top of the screen and shrinks until it takes the top quarter,
        both planets still in view, the empty sky above the planet cropped
        away; a band in the page's own background colour fills the sides so
        the reading never shows beside it; the caption stays full size under
        the planets. At the top of the page the scene is full size again.
        LK1.3 (his note: blend it into the words, less distracting): as it
        shrinks, the scene softens into the page colour at its sides and
        bottom and dims slightly, so it sits behind the reading instead of
        ending in a hard edge.
   Reduced motion: a, b, c and the flight are off, changes are short fades.
   ============================================================ */
(function (global) {
  'use strict';
  if (global.CozLake) return;

  var V = 'v=1';
  var FW = 1267, FH = 1081;          /* scene frame */
  var AR = FH / FW;                  /* scene height in scene widths */
  var HORIZON = 0.566;               /* shoreline, fraction of scene height */
  var BODY_X = 0.4966;               /* sky planets' centre line, fraction of width */
  var SUB_BOTTOM = 0.700;            /* water planet's base ring, in scene widths from the top */
  var COMPACT = 0.115;               /* sky above the planets cropped away while reading, in scene widths */
  var QUARTER = 0.25;                /* while reading, the scene takes this share of the screen height */

  /* Sky planet boxes in the scene frame, matched from his art. */
  var SKY = {
    sun:     { x: 518, y: 183, w: 228, h: 225 },
    moon:    { x: 540, y: 196, w: 184, h: 187 },
    mars:    { x: 525, y: 191, w: 216, h: 221 },
    mercury: { x: 525, y: 183, w: 212, h: 219 },
    jupiter: { x: 522, y: 176, w: 220, h: 226 },
    venus:   { x: 525, y: 187, w: 208, h: 211 },
    saturn:  { x: 464, y: 213, w: 344, h: 151 },
    rahu:    { x: 539, y: 192, w: 188, h: 192 },
    ketu:    { x: 558, y: 193, w: 152, h: 212 }
  };
  /* Water planets: width as a fraction of the scene width, image aspect,
     and where the planet's body sits across its own image (fx). */
  var SUB = {
    sun:     { w: 0.300, a: 1.7552, fx: 0.511 },
    moon:    { w: 0.300, a: 1.7527, fx: 0.530 },
    mars:    { w: 0.300, a: 1.8235, fx: 0.527 },
    mercury: { w: 0.300, a: 1.7343, fx: 0.526 },
    jupiter: { w: 0.300, a: 1.7739, fx: 0.490 },
    venus:   { w: 0.300, a: 1.8427, fx: 0.522 },
    saturn:  { w: 0.300, a: 1.8622, fx: 0.531 },
    rahu:    { w: 0.223, a: 1.4657, fx: 0.480 },
    ketu:    { w: 0.223, a: 1.4797, fx: 0.508 }
  };

  var reduce = false;
  try { reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function key(l) { return String(l || '').toLowerCase(); }
  function url(kind, lord) { return 'lake-' + kind + '-' + key(lord) + (kind === 'scene' ? '.jpg' : '.webp') + '?' + V; }
  var cache = {};
  function load(u) {
    if (cache[u]) return cache[u];
    cache[u] = new Promise(function (res, rej) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { (im.decode ? im.decode().catch(function () {}) : Promise.resolve()).then(function () { res(im); }); };
      im.onerror = function () { rej(new Error('missing ' + u)); };
      im.src = u;
    });
    return cache[u];
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function anim(el, frames, opt) {
    if (!el.animate) {                       /* no Web Animations: jump to the end state */
      var last = frames[frames.length - 1];
      for (var k in last) if (k !== 'offset') el.style[k] = last[k];
      return Promise.resolve();
    }
    var a = el.animate(frames, opt);
    return new Promise(function (r) { a.onfinish = function () { r(a); }; a.oncancel = function () { r(a); }; });
  }
  function stopAnims(el) { if (el.getAnimations) el.getAnimations().forEach(function (a) { if (!a.animationName) a.cancel(); }); }
  function skyCenter(lord) { var b = SKY[key(lord)] || SKY.venus; return [(b.x + b.w / 2) / FW, (b.y + b.h / 2) / FH]; }
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
  var easeInOut = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };

  /* ---------------- styles ---------------- */
  function css() {
    if (document.getElementById('cozLakeCSS')) return;
    var s = document.createElement('style');
    s.id = 'cozLakeCSS';
    s.textContent =
      '.coz-lake,.coz-lake-spacer{width:100%;aspect-ratio:' + FW + '/' + FH + ';margin:0 auto}' +
      '@media (min-width:520px){.coz-lake,.coz-lake-spacer,.coz-lake-cap{max-width:480px}}' +
      '.coz-lake-cap.lk-off{display:none}' +
      '.coz-lake{position:fixed;top:0;left:0;right:0;z-index:30;overflow:hidden;pointer-events:auto;-webkit-tap-highlight-color:transparent}' +
      '.coz-lake.lk-hidden{opacity:0;pointer-events:none}' +
      '.coz-lake .lk-art{position:absolute;inset:0;-webkit-mask-image:linear-gradient(180deg,#000 97.6%,transparent);mask-image:linear-gradient(180deg,#000 97.6%,transparent)}' +
      '.coz-lake canvas,.coz-lake .lk-img{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.coz-lake .lk-img{object-fit:cover}' +
      '.coz-lake .lk-slot{position:absolute;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}' +
      '.coz-lake .lk-slot img{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.coz-lake .lk-slot img.lk-bob{animation:lkBob 7s ease-in-out infinite}' +
      '@keyframes lkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.1%)}}' +
      '.coz-lake-band{position:fixed;top:0;left:0;right:0;z-index:29;height:0;pointer-events:auto;transform-origin:50% 0;transform:scaleY(0)}' +
      '.coz-lake{transform-origin:50% 0}' +
      '.coz-lake .lk-veil{position:absolute;inset:0;pointer-events:none;opacity:0}' +
      '.coz-lake-cap{position:fixed;top:0;left:0;right:0;margin:0 auto;width:100%;z-index:31;text-align:center;pointer-events:none;' +
        'font-family:"Cormorant Garamond",Georgia,serif;color:#fff;text-shadow:0 1px 6px rgba(0,8,24,.85)}' +
      '.coz-lake-cap .lk-now{display:block;font-size:clamp(15px,4.3vw,19px);font-weight:500;letter-spacing:.09em;line-height:1.25}' +
      '.coz-lake-cap .lk-back{display:inline-block;margin-top:0;padding:2px 14px 3px;pointer-events:auto;cursor:pointer;' +
        'font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(15px,4.2vw,18px);font-weight:600;letter-spacing:.05em;' +
        'color:#d4a178;background:none;border:0;-webkit-tap-highlight-color:transparent}' +
      '.coz-lake-cap .lk-back:focus-visible{outline:1px solid #d4a178;outline-offset:2px}' +
      '.coz-lake-flyer{position:fixed;z-index:35;pointer-events:none;transform-origin:0 0;opacity:0;will-change:transform,opacity,filter}' +
      '@media (prefers-reduced-motion:reduce){.coz-lake .lk-slot img.lk-bob{animation:none}}';
    document.head.appendChild(s);
  }

  /* ---------------- WebGL scene ----------------
     A, B: the two scenes (B only during a Mahadasha dissolve, mixed by M)
     K: water life 0..1      L: light 0..1 (dark at the start of the reveal)
     Z: zoom about C (the sky planet's centre)      R: reveal radius around RC */
  var VS = 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS =
    'precision highp float;varying vec2 u;uniform sampler2D A;uniform sampler2D B;' +
    'uniform float M,T,K,H,Z,L,R,AR;uniform vec2 C,RC;' +
    'void main(){' +
      'vec2 z=C+(u-C)/Z;' +
      'float d=clamp((z.y-H)/(1.-H),0.,1.);' +
      'float k=smoothstep(0.,.05,d)*K;' +
      'float f=mix(230.,55.,sqrt(d));' +
      'float ph=z.y*f;' +
      'float dx=(sin(ph+T*1.1)*.55+sin(ph*.51-T*.75+z.x*5.)*.3+sin(z.y*16.-T*.32+z.x*2.2)*.15)*mix(.0012,.0052,d)*k;' +
      'float dy=sin(ph*.87+T*.9+z.x*2.5)*mix(.0004,.0018,d)*k;' +
      'vec2 q=z+vec2(dx,dy);' +
      'vec3 c=mix(texture2D(A,q).rgb,texture2D(B,q).rgb,M);' +
      'float lum=dot(c,vec3(.299,.587,.114));' +
      'float g=pow(max(0.,sin(ph*1.63+T*1.7+sin(z.x*11.+T*.6)*2.2)),18.)*(.55+.45*sin(z.x*37.+T*1.3+ph*.2))*smoothstep(.02,.25,d)*K;' +
      'c+=c*g*smoothstep(.12,.5,lum)*.9+g*.035*vec3(.75,.82,1.)*smoothstep(0.,.3,d);' +
      'c*=mix(.2,1.,L);' +
      'float m=1.-smoothstep(R-.2,R,length((u-RC)*vec2(1.,AR)));' +
      'gl_FragColor=vec4(c*m,m);' +
    '}';

  function GLScene(canvas) {
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false }); } catch (e) {}
    if (!gl) return null;
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['A', 'B', 'M', 'T', 'K', 'H', 'Z', 'L', 'R', 'AR', 'C', 'RC'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1); gl.uniform1f(U.H, HORIZON); gl.uniform1f(U.AR, AR);
    gl.clearColor(0, 0, 0, 0);
    function tex(unit) {
      var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }
    var tA = tex(0), tB = tex(1);
    function put(unit, t, img) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }

    var st = { M: 0, K: reduce ? 0 : 1, L: 1, R: 3, Z: 1, C: [BODY_X, .27], RC: [BODY_X, .27], breath: !reduce, t0: performance.now(), raf: 0, live: false, tweens: 0 };
    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw() {
      size();
      var t = (performance.now() - st.t0) / 1000;
      var breath = st.breath ? 1 + .006 * (1 - Math.cos(t * 2 * Math.PI / 22)) : 1;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.M, st.M); gl.uniform1f(U.K, st.K); gl.uniform1f(U.L, st.L);
      gl.uniform1f(U.R, st.R); gl.uniform1f(U.Z, st.Z * breath); gl.uniform2f(U.C, st.C[0], st.C[1]); gl.uniform2f(U.RC, st.RC[0], st.RC[1]);
      gl.uniform1f(U.T, t % 600);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() {
      st.raf = 0;
      if (document.hidden || !(st.live || st.tweens)) return;
      draw(); st.raf = requestAnimationFrame(loop);
    }
    function run() { if (!st.raf) st.raf = requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) run(); });
    global.addEventListener('resize', function () { draw(); });
    function tween(name, to, ms, ease, delay) {
      return wait(delay || 0).then(function () {
        return new Promise(function (res) {
          var from = st[name], s = performance.now();
          st.tweens++; run();
          (function step() {
            var p = ms ? Math.min(1, (performance.now() - s) / ms) : 1;
            st[name] = from + (to - from) * (ease || easeInOut)(p);
            if (p < 1) requestAnimationFrame(step); else { st.tweens--; draw(); res(); }
          })();
        });
      });
    }
    return {
      st: st,
      setA: function (img) { put(0, tA, img); st.M = 0; draw(); },
      setB: function (img) { put(1, tB, img); },
      promote: function (img) { put(0, tA, img); st.M = 0; draw(); },
      tween: tween,
      start: function () { st.live = !reduce; draw(); run(); },
      draw: draw
    };
  }

  /* ---------------- the scene ---------------- */
  function create(opt) {
    css();
    var root = document.createElement('div');
    root.className = 'coz-lake' + (opt.hidden ? ' lk-hidden' : '');
    root.id = 'cozLake';
    root.setAttribute('role', 'img');
    root.innerHTML =
      '<div class="lk-art"></div>' +
      '<div class="lk-slot"><img alt="" class="' + (reduce ? '' : 'lk-bob') + '"></div>' +
      '<div class="lk-slot"><img alt="" class="' + (reduce ? '' : 'lk-bob') + '"></div>' +
      '<div class="lk-veil"></div>';
    var band = document.createElement('div');
    band.className = 'coz-lake-band';
    band.setAttribute('aria-hidden', 'true');
    var bg = '';
    try { bg = getComputedStyle(document.body).backgroundColor; } catch (e) {}
    var bandColor = opt.band || ((!bg || /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) ? 'rgb(2,11,26)' : bg);
    band.style.background = bandColor;
    document.body.appendChild(band);
    document.body.appendChild(root);
    var cap = null;
    if (opt.caption) {
      cap = document.createElement('div');
      cap.className = 'coz-lake-cap' + (opt.hidden ? ' lk-off' : '');
      cap.setAttribute('aria-live', 'polite');
      document.body.appendChild(cap);
    }
    if (opt.spacer) {
      var sp = document.createElement('div');
      sp.className = 'coz-lake-spacer';
      sp.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(sp, document.body.firstChild);
    }
    /* The scene stands in for the page's logo header, as it does on the overview. */
    if (opt.hideHeader) { var hh = document.querySelector(opt.hideHeader); if (hh) hh.style.display = 'none'; }

    var art = root.querySelector('.lk-art');
    var slots = [].slice.call(root.querySelectorAll('.lk-slot'));
    /* LK1.3: the soft edge and slight dim, in the page's own colour, shown as the scene shrinks */
    var veil = root.querySelector('.lk-veil');
    (function () {
      var m = String(bandColor).match(/\d+(\.\d+)?/g) || [2, 11, 26], c = m.slice(0, 3).join(',');
      var a = function (x) { return 'rgba(' + c + ',' + x + ')'; };
      veil.style.background =
        'linear-gradient(90deg,' + a(1) + ' 0%,' + a(0) + ' 13%,' + a(0) + ' 87%,' + a(1) + ' 100%),' +
        'linear-gradient(180deg,' + a(.18) + ' 0%,' + a(.18) + ' 70%,' + a(.75) + ' 90%,' + a(1) + ' 100%)';
    })();

    var canvas = document.createElement('canvas');
    art.appendChild(canvas);
    var glS = GLScene(canvas);
    var imgA = null, imgB = null;
    if (!glS) {                                       /* fallback: two stacked images */
      art.removeChild(canvas);
      imgA = document.createElement('img'); imgA.className = 'lk-img'; imgA.alt = '';
      imgB = document.createElement('img'); imgB.className = 'lk-img'; imgB.alt = ''; imgB.style.opacity = '0';
      art.appendChild(imgA); art.appendChild(imgB);
    }

    var cur = { main: key(opt.main), sub: key(opt.sub) };
    if (glS) glS.st.C = skyCenter(cur.main);

    /* g. while reading, the scene rises to the top and shrinks to the top quarter.
       LK1.4 (his note: it jitters as you move): the shrink is handed to the
       browser's own scrolling (a scroll-linked CSS animation) so it moves in
       step with the finger, and its size is worked out from the phone's fixed
       screen height, not the visible height that changes as Safari's bars
       shrink. Browsers without scroll-linked animation get a frame-synced
       fallback with every measurement taken ahead of time. */
    var G = null, lastW = 0, tick = 0;
    var TL = false;
    try { TL = !!(global.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')); } catch (e) {}
    var tlStyle = null;
    function geo() {
      var W = root.offsetWidth, H = root.offsetHeight;
      var sh = (global.screen && global.screen.height) || global.innerHeight || 700;
      var target = Math.max(150, Math.min(sh * QUARTER, H * .8));
      var s1 = target / (H - W * COMPACT), ty1 = -W * COMPACT * s1;
      var ch = cap ? cap.offsetHeight : 0;
      /* the caption sits under the water planet, never over it; in the small scene a
         two-line caption runs onto the band, which grows to hold it */
      var cap0 = Math.max(H - ch - H * .016, (SUB_BOTTOM + .01) * W);
      var cap1 = Math.max(target - ch - H * s1 * .016, ty1 + (SUB_BOTTOM + .01) * W * s1);
      var band1 = Math.max(target, cap ? cap1 + ch + 4 : 0);
      return { W: W, H: H, s1: s1, ty1: ty1, target: target, D: Math.max(1, H - target), cap0: cap0, cap1: cap1, band1: band1 };
    }
    function apply(p) {                       /* fallback path: same in-between values the CSS animation uses */
      var g = G, ty = g.ty1 * p, s = 1 + (g.s1 - 1) * p;
      root.style.transform = p ? 'translateY(' + ty.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')' : '';
      veil.style.opacity = p.toFixed(3);
      if (cap) cap.style.transform = 'translateY(' + (g.cap0 + (g.cap1 - g.cap0) * p).toFixed(2) + 'px)';
      band.style.transform = 'scaleY(' + (p > 0 ? 1 + (g.band1 / g.H - 1) * p : 0).toFixed(4) + ')';
    }
    function onScroll() {
      if (tick) return;
      tick = requestAnimationFrame(function () {
        tick = 0;
        apply(Math.min(1, Math.max(0, global.pageYOffset || 0) / G.D));
      });
    }
    function layout() {
      G = geo(); lastW = G.W;
      band.style.height = G.H + 'px';
      band.style.display = root.classList.contains('lk-hidden') ? 'none' : '';
      if (TL) {
        if (!tlStyle) { tlStyle = document.createElement('style'); document.head.appendChild(tlStyle); }
        var run = 'animation-timing-function:linear;animation-fill-mode:both;animation-duration:1ms;animation-duration:auto;' +
                  'animation-timeline:scroll(root block);animation-range:0px ' + G.D.toFixed(1) + 'px;';
        tlStyle.textContent =
          '@keyframes lkRoot{from{transform:translateY(0px) scale(1)}to{transform:translateY(' + G.ty1.toFixed(2) + 'px) scale(' + G.s1.toFixed(4) + ')}}' +
          '@keyframes lkVeil{from{opacity:0}to{opacity:1}}' +
          '@keyframes lkCap{from{transform:translateY(' + G.cap0.toFixed(2) + 'px)}to{transform:translateY(' + G.cap1.toFixed(2) + 'px)}}' +
          '@keyframes lkBand{0%{transform:scaleY(0)}0.5%{transform:scaleY(1)}100%{transform:scaleY(' + (G.band1 / G.H).toFixed(4) + ')}}' +
          '#cozLake{animation-name:lkRoot;' + run + '}' +
          '#cozLake .lk-veil{animation-name:lkVeil;' + run + '}' +
          '.coz-lake-cap{animation-name:lkCap;' + run + '}' +
          '.coz-lake-band{animation-name:lkBand;' + run + '}';
      } else {
        apply(Math.min(1, Math.max(0, global.pageYOffset || 0) / G.D));
      }
    }
    if (!TL) global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', function () { if (root.offsetWidth !== lastW) layout(); });   /* Safari's bars changing height do not count */
    layout();

    function geom(lord) {
      var g = SUB[lord] || SUB.venus, hW = g.w / g.a;
      return { g: g, hW: hW, left: BODY_X - g.fx * g.w, top: SUB_BOTTOM - hW };
    }
    function place(slot, lord) {
      var q = geom(lord);
      slot.style.left = (q.left * 100) + '%';
      slot.style.width = (q.g.w * 100) + '%';
      slot.style.top = (q.top / AR * 100) + '%';
      slot.style.height = (q.hW / AR * 100) + '%';
    }
    function label(main, sub) {
      var a = main.charAt(0).toUpperCase() + main.slice(1), b = sub.charAt(0).toUpperCase() + sub.slice(1);
      root.setAttribute('aria-label', a + ' Mahadasha, ' + b + ' subperiod');
    }

    /* d. the water's centre line: arrivals come up it from below the frame,
          departures go on up it toward the shoreline and fade into the distance */
    var shownSlot = null, shownLord = null;
    function arrive(lord, delay, leaving) {
      var slot = leaving === slots[0] ? slots[1] : slots[0];
      place(slot, lord);
      return load(url('sub', lord)).then(function (im) {
        stopAnims(slot);
        slot.querySelector('img').src = im.src;
        shownSlot = slot; shownLord = lord;
        if (reduce) return anim(slot, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: delay || 0, fill: 'both' });
        var q = geom(lord);
        var below = ((AR - q.top) / q.hW) * 100 + 6;          /* fully below the frame, in its own heights */
        return anim(slot, [
          { transform: 'translateY(' + below + '%)', opacity: 0 },
          { opacity: 1, offset: .22 },
          { transform: 'translateY(0)', opacity: 1 }
        ], { duration: 1750, delay: delay || 0, easing: 'cubic-bezier(.22,.72,.26,1)', fill: 'both' });
      });
    }
    function depart() {
      var slot = shownSlot, lord = shownLord;
      shownSlot = null; shownLord = null;
      if (!slot) return Promise.resolve();
      stopAnims(slot);
      if (reduce) return anim(slot, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      var q = geom(lord);
      var rise = ((SUB_BOTTOM - HORIZON * AR) / q.hW) * 100;   /* base ring up to the shoreline */
      return anim(slot, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { opacity: .9, offset: .45 },
        { transform: 'translateY(-' + rise + '%) scale(.38)', opacity: 0 }
      ], { duration: 1600, easing: 'cubic-bezier(.42,0,.5,1)', fill: 'forwards' });
    }

    /* Changes run one at a time; a tap during one only moves the target,
       and the scene goes straight there when the current change ends. */
    var wantSub = cur.sub, busy = null;
    function settleSub() {
      if (busy) return busy;
      var run = (function step() {
        if (shownLord === wantSub) return Promise.resolve();
        var target = wantSub, leaving = shownSlot;
        var out = depart();
        var inn = arrive(target, reduce ? 0 : 180, leaving);
        return Promise.all([out, inn]).then(step);
      })();
      busy = run.then(function () { busy = null; }, function () { busy = null; });
      return busy;
    }
    var mainQ = Promise.resolve();

    function sceneImg(lord) { return load(url('scene', lord)); }

    var ready = sceneImg(cur.main).then(function (im) {
      if (glS) { glS.setA(im); glS.start(); } else { imgA.src = im.src; }
      label(cur.main, cur.sub);
      return load(url('sub', cur.sub));
    }).then(function () { return cur; });

    var api = {
      el: root,
      ready: ready,
      gl: glS,
      art: art,
      showSub: function (lord) {
        wantSub = key(lord); cur.sub = wantSub; label(cur.main, cur.sub);
        return ready.then(function () { return mainQ; }).then(settleSub);
      },
      /* e. Mahadasha change: the water planet leaves, the sky dissolves, the next one arrives. */
      setMain: function (main, sub) {
        main = key(main); sub = key(sub);
        mainQ = mainQ.then(function () { return ready; }).then(function () { return busy; }).then(function () {
          if (main === cur.main) { wantSub = sub; cur.sub = sub; label(cur.main, cur.sub); return settleSub(); }
          var next = sceneImg(main);
          var out = depart();
          return next.then(function (im) {
            cur.main = main;
            var dissolve;
            if (glS) {
              glS.setB(im);
              dissolve = glS.tween('M', 1, reduce ? 250 : 2200, easeInOut, reduce ? 0 : 350).then(function () { glS.promote(im); glS.st.C = skyCenter(main); });
            } else {
              imgB.src = im.src;
              dissolve = anim(imgB, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 250 : 2200, delay: reduce ? 0 : 350, easing: 'ease-in-out', fill: 'forwards' })
                .then(function () { imgA.src = im.src; stopAnims(imgB); imgB.style.opacity = '0'; });
            }
            return Promise.all([out, dissolve]);
          }).then(function () {
            wantSub = sub; cur.sub = sub; label(cur.main, cur.sub);
            return settleSub();
          });
        }).catch(function (e) { if (global.console) console.warn('[LAKE] change failed: ' + (e && e.message)); });
        return mainQ;
      },
      caption: function (html) { if (cap) { cap.innerHTML = html; layout(); } },
      /* Back to You Are Here, wherever the caption offers it */
      onBack: function (fn) { if (cap) cap.addEventListener('click', function (ev) { if (ev.target.closest('.lk-back')) fn(ev); }); },
      layout: layout,
      /* The sky planet's box on screen with the scene at rest (top of the page). */
      skyRect: function (lord) {
        var b = SKY[key(lord)] || SKY.venus, W = root.offsetWidth, k = W / FW;
        return { left: root.offsetLeft + b.x * k, top: b.y * k, width: b.w * k, height: b.h * k };
      },
      /* Where the scene ends on screen once the page has scrolled into the reading. */
      compactBottom: function () { return G ? G.band1 : 0; },
      state: function () { return { main: cur.main, sub: cur.sub }; }
    };
    if (!opt.hidden && opt.sub) ready.then(settleSub);
    return api;
  }

  /* ---------------- f. overview: the reveal ---------------- */
  function reveal(lake, fromEl, mainLord, fadeEls) {
    var orbP = load(url('orb', mainLord));
    return Promise.all([lake.ready, orbP]).then(function (r) {
      var orb = r[1];
      var root = lake.el, glS = lake.gl;
      if ((global.pageYOffset || 0) > 0) global.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var to = lake.skyRect(mainLord);
      var from = fromEl.getBoundingClientRect();

      (fadeEls || []).forEach(function (el) { anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }); });
      if (reduce) {
        anim(fromEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
        root.classList.remove('lk-hidden'); lake.layout();
        return anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'backwards' })
          .then(function () { return lake.showSub(lake.state().sub); });
      }

      var s0 = Math.min(from.width * .66 / to.width, from.height * .66 / to.height);
      var x0 = from.left + from.width / 2 - to.width * s0 / 2 - to.left;
      var y0 = from.top + from.height / 2 - to.height * s0 / 2 - to.top;
      var start = 'translate(' + x0 + 'px,' + y0 + 'px) scale(' + s0 + ')';
      var fly = document.createElement('img');
      fly.className = 'coz-lake-flyer'; fly.alt = ''; fly.src = orb.src;
      fly.style.left = to.left + 'px'; fly.style.top = to.top + 'px';
      fly.style.width = to.width + 'px'; fly.style.height = to.height + 'px';
      fly.style.transform = start;
      document.body.appendChild(fly);
      var GOLD = 'rgba(255,206,140,';

      /* the lake waits dark and closed, zoomed in a little on the landing point */
      if (glS) { glS.st.R = 0; glS.st.L = 0; glS.st.Z = 1.12; glS.st.K = 0; glS.draw(); }
      else { lake.art.style.clipPath = 'circle(0% at 50% 27%)'; }
      root.classList.remove('lk-hidden'); lake.layout();

      /* 0.0 s  the medallion gathers light */
      anim(fromEl, [
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 ' + GOLD + '0))' },
        { transform: 'scale(1.14)', filter: 'drop-shadow(0 0 14px ' + GOLD + '.85))' }
      ], { duration: 700, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
      /* 0.45 s  his planet appears inside it, already glowing */
      anim(fly, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 450, fill: 'forwards' });
      anim(fromEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 750, fill: 'forwards' });
      /* 0.75 s  it lifts slowly, gathers speed, then glides into the sky; the glow swells and eases */
      var flight = anim(fly, [
        { transform: start, filter: 'drop-shadow(0 0 6px ' + GOLD + '.55))' },
        { filter: 'drop-shadow(0 0 22px ' + GOLD + '.9))', offset: .55 },
        { transform: 'translate(0px,0px) scale(1)', filter: 'drop-shadow(0 0 12px ' + GOLD + '.7))' }
      ], { duration: 2400, delay: 750, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
      /* 1.5 s  the lake opens around the rising planet, following it up,
                brightening and settling, so the painted planet only shows as it lands */
      var opening, flying = true;
      if (glS) {
        (function follow() {
          var a = fly.getBoundingClientRect(), b = root.getBoundingClientRect();
          if (b.width) glS.st.RC = [(a.left + a.width / 2 - b.left) / b.width, (a.top + a.height / 2 - b.top) / b.height];
          if (flying) requestAnimationFrame(follow); else glS.st.RC = skyCenter(mainLord);
        })();
        opening = Promise.all([
          glS.tween('R', 1.15, 2700, easeInOut, 1500),
          glS.tween('L', 1, 2800, easeInOut, 1500),
          glS.tween('Z', 1, 2300, easeOut, 1600)
        ]).then(function () { glS.st.R = 3; });
      } else {
        opening = anim(lake.art, [{ clipPath: 'circle(0% at 50% 27%)' }, { clipPath: 'circle(150% at 50% 27%)' }],
          { duration: 2500, delay: 1600, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' })
          .then(function () { stopAnims(lake.art); lake.art.style.clipPath = ''; });
      }
      return flight.then(function () {
        flying = false;
        /* 3.15 s  it lands in the painted sky; the water wakes; the subperiod planet rises */
        var settle = anim(fly, [
          { opacity: 1, filter: 'drop-shadow(0 0 12px ' + GOLD + '.7))' },
          { opacity: 0, filter: 'drop-shadow(0 0 0 ' + GOLD + '0))' }
        ], { duration: 900, easing: 'ease-in', fill: 'forwards' });
        if (glS) glS.tween('K', 1, 2000, easeInOut, 150);
        var up = wait(550).then(function () { return lake.showSub(lake.state().sub); });
        return Promise.all([settle, up, opening]);
      }).then(function () { if (fly.parentNode) fly.parentNode.removeChild(fly); });
    });
  }

  /* ---------------- period helpers ---------------- */
  function periods(chart) {
    var lc = chart && chart.lifeCycle;
    if (!lc || !lc.mahadasha || !lc.antardasha || !lc.mahadasha.lord || !lc.antardasha.lord) return null;
    return { md: lc.mahadasha, ad: lc.antardasha, seq: lc.antardashaSequence || [], nextMd: lc.nextMahadasha || null };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function year(iso) { return new Date(iso).getUTCFullYear(); }
  /* Captions, in the wording of his spec: "You Are Here · Ketu–Venus",
     "Previewing · Ketu–Saturn · Begins 2028", and the way back. */
  function capHere(main, sub) {
    return '<span class="lk-now">You Are Here · ' + esc(main) + '–' + esc(sub) + '</span>';
  }
  function capPreview(main, sub, seg) {
    var past = new Date(seg.endTimestamp).getTime() <= Date.now();
    var when = past ? 'Ended ' + year(seg.endTimestamp) : 'Begins ' + year(seg.startTimestamp);
    return '<span class="lk-now">' + (past ? 'Looking Back' : 'Previewing') + ' · ' + esc(main) + '–' + esc(sub) + ' · ' + when + '</span>' +
           '<button type="button" class="lk-back">Back to You Are Here</button>';
  }

  global.CozLake = { create: create, reveal: reveal, periods: periods, capHere: capHere, capPreview: capPreview, preload: function (kind, lord) { return load(url(kind, lord)); } };
})(window);
