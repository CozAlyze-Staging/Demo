/* ============================================================
   COZALYZE · COZ_LAKE · LK1.0 (Nov 11 2026, staging only)
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
   The scene pins to the top of each page and the reading scrolls under it.
   Timing comes only from cozChartJSON.lifeCycle; nothing is recalculated.

   Measurements (scene frame 1267 x 1081, the nine scenes share one
   background and were aligned to it): the sky planet boxes below were
   found by matching each plain planet against its own scene. The water
   planet sits where his New Mahadasha art puts it, scaled so its planet
   stays smaller than the Mahadasha planet in the sky.

   Motion, all of it, so it can be named and changed one item at a time:
     1. water shimmer, the lake below the shoreline only (WebGL)
     2. a slow float of the water planet, 7 s, about 1% of its height
     3. subperiod change: the water planet sinks, the next one rises
     4. Mahadasha change: the water planet sinks, the sky scene dissolves
        to the next lord's scene over 2 s, the next water planet rises
     5. overview only: the medallion's planet rises into the sky
   Reduced motion: 1, 2 and the flight are off, changes are short fades.
   ============================================================ */
(function (global) {
  'use strict';
  if (global.CozLake) return;

  var V = 'v=1';
  var FW = 1267, FH = 1081;          /* scene frame */
  var HORIZON = 0.566;               /* shoreline, fraction of scene height */
  var BODY_X = 0.4966;               /* sky planets' centre line, fraction of width */
  var SUB_BOTTOM = 0.700;            /* water planet's base ring, in scene widths from the top (room under it for the caption) */

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

  /* ---------------- styles ---------------- */
  function css() {
    if (document.getElementById('cozLakeCSS')) return;
    var s = document.createElement('style');
    s.id = 'cozLakeCSS';
    s.textContent =
      '.coz-lake,.coz-lake-spacer{width:100%;aspect-ratio:' + FW + '/' + FH + ';margin:0 auto}' +
      '@media (min-width:520px){.coz-lake,.coz-lake-spacer{max-width:480px}}' +
      '.coz-lake{position:fixed;top:0;left:0;right:0;z-index:30;overflow:hidden;pointer-events:auto;-webkit-tap-highlight-color:transparent}' +
      '.coz-lake.lk-hidden{opacity:0;pointer-events:none}' +
      '.coz-lake .lk-art{position:absolute;inset:0;-webkit-mask-image:linear-gradient(180deg,#000 97.6%,transparent);mask-image:linear-gradient(180deg,#000 97.6%,transparent)}' +
      '.coz-lake canvas,.coz-lake .lk-img{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.coz-lake .lk-img{object-fit:cover}' +
      '.coz-lake .lk-sub{position:absolute;overflow:hidden}' +
      '.coz-lake .lk-rise{position:absolute;inset:0;opacity:0}' +
      '.coz-lake .lk-rise img{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.coz-lake .lk-rise img.lk-bob{animation:lkBob 7s ease-in-out infinite}' +
      '@keyframes lkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.1%)}}' +
      '.coz-lake .lk-cap{position:absolute;left:0;right:0;bottom:1.6%;text-align:center;pointer-events:none;' +
        'font-family:"Cormorant Garamond",Georgia,serif;color:#fff;text-shadow:0 1px 6px rgba(0,8,24,.85)}' +
      '.coz-lake .lk-cap .lk-now{display:block;font-size:clamp(15px,4.3vw,19px);font-weight:500;letter-spacing:.09em;line-height:1.25}' +
      '.coz-lake .lk-cap .lk-back{display:inline-block;margin-top:0;padding:2px 14px 3px;pointer-events:auto;cursor:pointer;' +
        'font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(15px,4.2vw,18px);font-weight:600;letter-spacing:.05em;' +
        'color:#d4a178;background:none;border:0;-webkit-tap-highlight-color:transparent}' +
      '.coz-lake .lk-cap .lk-back:focus-visible{outline:1px solid #d4a178;outline-offset:2px}' +
      '.coz-lake-flyer{position:fixed;z-index:35;pointer-events:none;transform-origin:0 0;opacity:0;will-change:transform,opacity}' +
      '@media (prefers-reduced-motion:reduce){.coz-lake .lk-rise img.lk-bob{animation:none}}';
    document.head.appendChild(s);
  }

  /* ---------------- WebGL scene: two scenes for the dissolve, shimmer below the shoreline ---------------- */
  var VS = 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS =
    'precision highp float;varying vec2 u;uniform sampler2D A;uniform sampler2D B;uniform float M,T,K,H;' +
    'void main(){' +
      'float d=clamp((u.y-H)/(1.-H),0.,1.);' +
      'float k=smoothstep(0.,.06,d)*K;' +
      'float f=mix(240.,60.,sqrt(d));' +
      'float dx=(sin(u.y*f+T*1.15)*.65+sin(u.y*f*.53-T*.8+u.x*5.)*.35)*mix(.0007,.003,d)*k;' +
      'float dy=sin(u.y*f*.9+T*.95+u.x*2.5)*mix(.0003,.0014,d)*k;' +
      'vec2 q=u+vec2(dx,dy);' +
      'gl_FragColor=mix(texture2D(A,q),texture2D(B,q),M);' +
    '}';

  function GLScene(canvas) {
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false }); } catch (e) {}
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
    var U = { A: gl.getUniformLocation(pr, 'A'), B: gl.getUniformLocation(pr, 'B'), M: gl.getUniformLocation(pr, 'M'),
              T: gl.getUniformLocation(pr, 'T'), K: gl.getUniformLocation(pr, 'K'), H: gl.getUniformLocation(pr, 'H') };
    gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1); gl.uniform1f(U.H, HORIZON);
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
    var st = { mix: 0, amp: reduce ? 0 : 1, t0: performance.now(), raf: 0, live: false };
    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw() {
      size();
      gl.uniform1f(U.M, st.mix);
      gl.uniform1f(U.K, st.amp);
      gl.uniform1f(U.T, ((performance.now() - st.t0) / 1000) % 600);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() { st.raf = 0; if (!st.live || document.hidden) return; draw(); st.raf = requestAnimationFrame(loop); }
    function run() { if (!st.raf && st.live && !document.hidden) st.raf = requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) run(); });
    global.addEventListener('resize', function () { draw(); });
    return {
      setA: function (img) { put(0, tA, img); st.mix = 0; draw(); },
      setB: function (img) { put(1, tB, img); },
      dissolve: function (ms) {
        return new Promise(function (res) {
          var s = performance.now();
          (function step() {
            var p = Math.min(1, (performance.now() - s) / ms);
            st.mix = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            if (!st.live) draw();
            if (p < 1) requestAnimationFrame(step); else res();
          })();
        });
      },
      promote: function (img) { put(0, tA, img); st.mix = 0; draw(); },
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
      '<div class="lk-sub"><div class="lk-rise"><img alt="" class="' + (reduce ? '' : 'lk-bob') + '"></div></div>' +
      (opt.caption ? '<div class="lk-cap" aria-live="polite"></div>' : '');
    document.body.appendChild(root);
    if (opt.spacer) {
      var sp = document.createElement('div');
      sp.className = 'coz-lake-spacer';
      sp.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(sp, document.body.firstChild);
    }
    var art = root.querySelector('.lk-art');
    var subBox = root.querySelector('.lk-sub'), rise = root.querySelector('.lk-rise'), subImg = rise.querySelector('img');
    var cap = root.querySelector('.lk-cap');

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
    var subShown = null;

    function placeSub(lord) {
      var g = SUB[lord] || SUB.venus;
      var hW = g.w / g.a;                                     /* height in scene widths */
      var left = BODY_X - g.fx * g.w;
      var H = FH / FW;                                         /* scene height in widths */
      subBox.style.left = (left * 100) + '%';
      subBox.style.width = (g.w * 100) + '%';
      subBox.style.top = ((SUB_BOTTOM - hW) / H * 100) + '%';
      subBox.style.height = (hW / H * 100) + '%';
    }
    function label(main, sub) {
      var a = main.charAt(0).toUpperCase() + main.slice(1), b = sub.charAt(0).toUpperCase() + sub.slice(1);
      root.setAttribute('aria-label', a + ' Mahadasha, ' + b + ' subperiod');
    }

    /* Sub transitions run one at a time; a tap during one simply moves the
       target, and the scene goes straight there when the current one ends. */
    var wantSub = cur.sub, busy = null;
    function riseIn(lord) {
      placeSub(lord);
      return load(url('sub', lord)).then(function (im) {
        subImg.src = im.src; subShown = lord;
        if (reduce) return anim(rise, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, fill: 'forwards' });
        return anim(rise, [
          { opacity: 0, transform: 'translateY(100%)' },
          { opacity: .9, transform: 'translateY(30%)', offset: .55 },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 1150, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'forwards' });
      });
    }
    function sinkOut() {
      if (!subShown) return Promise.resolve();
      subShown = null;
      if (reduce) return anim(rise, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
      return anim(rise, [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: .75, transform: 'translateY(45%)', offset: .6 },
        { opacity: 0, transform: 'translateY(100%)' }
      ], { duration: 650, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
    }
    function settleSub() {
      if (busy) return busy;
      var run = (function step() {
        if (subShown === wantSub) return Promise.resolve();
        return sinkOut().then(function () { return riseIn(wantSub); }).then(step);
      })();
      busy = run.then(function () { busy = null; }, function () { busy = null; });
      return busy;
    }
    var mainQ = Promise.resolve();   /* Mahadasha changes run strictly one after another */

    function sceneImg(lord) { return load(url('scene', lord)); }

    var ready = sceneImg(cur.main).then(function (im) {
      if (glS) { glS.setA(im); glS.start(); } else { imgA.src = im.src; }
      label(cur.main, cur.sub);
      return load(url('sub', cur.sub));
    }).then(function () { return cur; });

    var api = {
      el: root,
      ready: ready,
      /* Show the water planet, rising from the water. */
      showSub: function (lord) {
        wantSub = key(lord); cur.sub = wantSub; label(cur.main, cur.sub);
        return ready.then(function () { return mainQ; }).then(settleSub);
      },
      /* Mahadasha change: sink, dissolve the sky to the next scene, rise. */
      setMain: function (main, sub) {
        main = key(main); sub = key(sub);
        mainQ = mainQ.then(function () { return ready; }).then(function () { return busy; }).then(function () {
          if (main === cur.main) { wantSub = sub; cur.sub = sub; label(cur.main, cur.sub); return settleSub(); }
          var next = sceneImg(main);
          return sinkOut().then(function () { return next; }).then(function (im) {
            cur.main = main;
            if (glS) {
              glS.setB(im);
              return glS.dissolve(reduce ? 250 : 2000).then(function () { glS.promote(im); });
            }
            imgB.src = im.src;
            return anim(imgB, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 250 : 2000, easing: 'ease-in-out', fill: 'forwards' })
              .then(function () { imgA.src = im.src; imgB.style.opacity = '0'; var a = imgB.getAnimations ? imgB.getAnimations() : []; a.forEach(function (x) { x.cancel(); }); });
          }).then(function () {
            wantSub = sub; cur.sub = sub; label(cur.main, cur.sub);
            return reduce ? null : wait(250);
          }).then(settleSub);
        }).catch(function (e) { if (global.console) console.warn('[LAKE] change failed: ' + (e && e.message)); });
        return mainQ;
      },
      caption: function (html) { if (cap) cap.innerHTML = html; },
      /* The sky planet's box on screen, for the flight. */
      skyRect: function (lord) {
        var b = SKY[key(lord)] || SKY.venus, r = root.getBoundingClientRect(), k = r.width / FW;
        return { left: r.left + b.x * k, top: r.top + b.y * k, width: b.w * k, height: b.h * k };
      },
      show: function (ms) {
        root.classList.remove('lk-hidden');
        if (!ms) return Promise.resolve();
        return anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-in-out', fill: 'backwards' });
      },
      state: function () { return { main: cur.main, sub: cur.sub }; }
    };
    placeSub(cur.sub);
    if (!opt.hidden && opt.sub) ready.then(settleSub);
    return api;
  }

  /* ---------------- overview: the medallion's planet rises into the sky ---------------- */
  function reveal(lake, fromEl, mainLord, fadeEls) {
    var orbP = load(url('orb', mainLord));
    return Promise.all([lake.ready, orbP]).then(function (r) {
      var orb = r[1];
      var to = lake.skyRect(mainLord);
      var from = fromEl.getBoundingClientRect();
      var s0 = Math.min(from.width * .66 / to.width, from.height * .66 / to.height);
      var x0 = from.left + from.width / 2 - to.width * s0 / 2 - to.left;
      var y0 = from.top + from.height / 2 - to.height * s0 / 2 - to.top;

      (fadeEls || []).forEach(function (el) { anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' }); });
      if (reduce) {
        if ((global.pageYOffset || 0) > 0) global.scrollTo(0, 0);
        anim(fromEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
        return lake.show(400).then(function () { return lake.showSub(lake.state().sub); });
      }

      var fly = document.createElement('img');
      fly.className = 'coz-lake-flyer'; fly.alt = ''; fly.src = orb.src;
      fly.style.left = to.left + 'px'; fly.style.top = to.top + 'px';
      fly.style.width = to.width + 'px'; fly.style.height = to.height + 'px';
      fly.style.transform = 'translate(' + x0 + 'px,' + y0 + 'px) scale(' + s0 + ')';
      document.body.appendChild(fly);

      /* the scene covers the art down to You Are Here only when the page is at its top */
      if ((global.pageYOffset || 0) > 0) global.scrollTo({ top: 0, behavior: 'smooth' });
      /* 0.0 s  the medallion hands over to his planet, in place */
      anim(fromEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
      anim(fly, [{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: 'forwards' });
      /* 0.3 s  it rises and grows into the sky position */
      var flight = anim(fly, [
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(' + s0 + ')' },
        { transform: 'translate(0px,0px) scale(1)' }
      ], { duration: 1800, delay: 300, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
      /* 0.7 s  the lake opens around it */
      wait(700).then(function () { return lake.show(1400); });
      return flight.then(function () { return wait(60); }).then(function () {
        /* 2.2 s  it settles into the painted sky, the water planet rises */
        var out = anim(fly, [{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
        var up = wait(160).then(function () { return lake.showSub(lake.state().sub); });
        return Promise.all([out, up]);
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
