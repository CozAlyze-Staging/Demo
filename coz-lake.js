/* ============================================================
   COZALYZE · COZ_LAKE · LK2.1 (Nov 12 2026, staging only)
   The Current Life Cycle lake scene, shared by current-life-cycle.html,
   current-season.html, key-time-windows.html and what-comes-next.html.

   Jason's ruling (Nov 11 2026): one reusable scene, never 81 videos.
     MAIN = the Mahadasha lord, in the sky. Drawn from his nine lake scenes
            (lake-scene-<lord>.jpg), used exactly as supplied, each with its
            own reflection painted into the water. It never changes until
            the Mahadasha itself changes.
     SUB  = the Antardasha lord. LK2.0, his new design from his concept
            image: the subperiod lives INSIDE the Mahadasha planet. It comes
            up out of the water where the gold ripples are, travels up the
            gold path, grows smaller as it nears the Mahadasha planet and
            settles inside it with its symbol on it, so the larger period
            visibly holds the smaller one. Drawn with his plain planets and
            emblems (lake-orb-<lord>.webp); the symbols are the platform's
            graha glyphs (coz-graha.js).
     PATH + RIPPLES: drawn in code to match his concept, at his instruction
            ("draw it to match concept"): a gold light path curving from the
            water up into the Mahadasha planet, and gold ripple rings on the
            water where subperiods emerge.
     LABEL: his concept's three lines over the water (Current Sub-Period /
            Moon – Venus / Jun 2026 – Aug 2027); Previewing or Looking Back
            plus Back to You Are Here when another window is shown.
   Timing comes only from cozChartJSON.lifeCycle; nothing is recalculated.

   Motion, all of it, so it can be named and changed one item at a time:
     a. water: ripples below the shoreline, slow broad flow, glints across
        the lit reflections, and rings spreading from the emergence point,
        stronger while a planet comes up (WebGL)
     b. the whole scene breathes very slightly, 1% over 22 s, centred on
        the sky planet so the planet itself stays put
     c. the gold path rests softly lit with a small light running along it;
        it brightens while a planet travels it, then calms back down
     d. the gold ripple rings on the water spread slowly; they swell when a
        planet comes up
     e. subperiod change: the planet inside rises up out of the Mahadasha
        planet and fades away; the next one comes up out of the water,
        travels up the path shrinking, and settles inside; its symbol
        appears once it is in place
     f. Mahadasha change (What Comes Next): the subperiod leaves, the sky
        dissolves to the next lord's scene, the next one travels in
     g. overview only, the reveal: the medallion gathers light, his planet
        lifts out of it glowing and climbs to the sky, the lake opens around
        it as it rises while the scene brightens and settles from a slight
        zoom, the planet lands in the painted sky, the water wakes, the label
        appears, then the subperiod travels up into it
     h. while reading, the scene rises to the top of the screen and shrinks
        to the top quarter, softening into the page colour at its sides and
        bottom (his rulings LK1.2 to LK1.4); it is driven by the browser's
        own scrolling so it moves in step with the finger
   Reduced motion: a, b, c, d and the flight are off, changes are short fades.
   ============================================================ */
(function (global) {
  'use strict';
  if (global.CozLake) return;

  var V = 'v=1';
  var FW = 1267, FH = 1081;          /* scene frame */
  var AR = FH / FW;                  /* scene height in scene widths */
  var HORIZON = 0.566;               /* shoreline, fraction of scene height */
  var COMPACT = 0.115;               /* sky above the planets cropped away while reading, in scene widths */
  var QUARTER = 0.25;                /* while reading, the scene takes this share of the screen height */
  var EP = { x: 629, y: 700 };       /* where subperiods come up out of the water, scene frame px */
  var WATER_H = 150;                 /* a subperiod's height as it comes up, scene frame px */
  var INSIDE = 0.44;                 /* a settled subperiod's height, as a share of the Mahadasha planet's */

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
  /* His plain planets' proportions (lake-orb-<lord>.webp), width / height. */
  var ORB_A = { sun: 1.014, moon: .983, mars: .978, mercury: .969, jupiter: .975, venus: .989, saturn: 2.278, rahu: .978, ketu: .717 };
  var GLYPH = { sun: '☉', moon: '☽', mars: '♂', mercury: '☿', jupiter: '♃', venus: '♀', saturn: '♄' };

  var reduce = false;
  try { reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function key(l) { return String(l || '').toLowerCase(); }
  function cap1st(l) { l = key(l); return l.charAt(0).toUpperCase() + l.slice(1); }
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
    if (!el.animate) {
      var last = frames[frames.length - 1];
      for (var k in last) if (k !== 'offset') el.style[k] = last[k];
      return Promise.resolve();
    }
    var a = el.animate(frames, opt);
    return new Promise(function (r) { a.onfinish = function () { r(a); }; a.oncancel = function () { r(a); }; });
  }
  function stopAnims(el) { if (el.getAnimations) el.getAnimations().forEach(function (a) { if (!a.animationName) a.cancel(); }); }
  function skyBox(lord) { return SKY[key(lord)] || SKY.venus; }
  function skyCenterPx(lord) { var b = skyBox(lord); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }
  function skyCenter(lord) { var c = skyCenterPx(lord); return [c.x / FW, c.y / FH]; }
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
  var easeInOut = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };

  /* The gold path: from the emergence point up into the Mahadasha planet. */
  function pathFor(main) {
    var c = skyCenterPx(main);
    return { p0: { x: EP.x, y: EP.y }, c1: { x: EP.x - 330, y: EP.y - 125 }, c2: { x: c.x + 430, y: c.y + 250 }, p3: c };
  }
  function bez(P, t) {
    var u = 1 - t;
    return {
      x: u * u * u * P.p0.x + 3 * u * u * t * P.c1.x + 3 * u * t * t * P.c2.x + t * t * t * P.p3.x,
      y: u * u * u * P.p0.y + 3 * u * u * t * P.c1.y + 3 * u * t * t * P.c2.y + t * t * t * P.p3.y
    };
  }
  function pathD(P) { return 'M' + P.p0.x + ' ' + P.p0.y + 'C' + P.c1.x + ' ' + P.c1.y + ' ' + P.c2.x + ' ' + P.c2.y + ' ' + P.p3.x + ' ' + P.p3.y; }

  /* ---------------- styles ---------------- */
  function css() {
    if (document.getElementById('cozLakeCSS')) return;
    var s = document.createElement('style');
    s.id = 'cozLakeCSS';
    s.textContent =
      '.coz-lake,.coz-lake-spacer{width:100%;aspect-ratio:' + FW + '/' + FH + ';margin:0 auto}' +
      '@media (min-width:520px){.coz-lake,.coz-lake-spacer,.coz-lake-cap{max-width:480px}}' +
      '.coz-lake{position:fixed;top:0;left:0;right:0;z-index:30;overflow:hidden;pointer-events:auto;-webkit-tap-highlight-color:transparent;transform-origin:50% 0}' +
      '.coz-lake.lk-hidden{opacity:0;pointer-events:none}' +
      '.coz-lake-band{position:fixed;top:0;left:0;right:0;z-index:29;height:0;pointer-events:auto;transform-origin:50% 0;transform:scaleY(0)}' +
      '.coz-lake .lk-art{position:absolute;inset:0;-webkit-mask-image:linear-gradient(180deg,#000 97.6%,transparent);mask-image:linear-gradient(180deg,#000 97.6%,transparent)}' +
      '.coz-lake canvas,.coz-lake .lk-img{position:absolute;inset:0;width:100%;height:100%;display:block}' +
      '.coz-lake .lk-img{object-fit:cover}' +
      '.coz-lake .lk-fx{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}' +
      '.coz-lake .lk-path{opacity:.34}' +
      '.coz-lake .lk-spark{stroke-dasharray:70 1400;animation:lkSpark 7s linear infinite}' +
      '@keyframes lkSpark{from{stroke-dashoffset:1470}to{stroke-dashoffset:0}}' +
      '.coz-lake .lk-rip ellipse{transform-box:fill-box;transform-origin:center;animation:lkRip 6s ease-out infinite;opacity:0}' +
      '.coz-lake .lk-rip ellipse:nth-child(2){animation-delay:2s}.coz-lake .lk-rip ellipse:nth-child(3){animation-delay:4s}' +
      '@keyframes lkRip{0%{transform:scale(.25);opacity:0}15%{opacity:.55}100%{transform:scale(1);opacity:0}}' +
      '.coz-lake .lk-rips{opacity:.6}' +
      '.coz-lake .lk-trav{position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity}' +
      '.coz-lake .lk-trav img{position:absolute;inset:0;width:100%;height:100%;display:block;filter:drop-shadow(0 0 7px rgba(255,196,120,.55))}' +
      '.coz-lake .lk-trav .lk-gl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;' +
        'font-family:"Noto Sans Symbols","Segoe UI Symbol","Apple Symbols",serif;line-height:1;color:#f7dcab;' +
        'text-shadow:0 0 6px rgba(255,190,110,.9),0 1px 3px rgba(40,18,0,.85)}' +
      '.coz-lake .lk-veil{position:absolute;inset:0;pointer-events:none;opacity:0}' +
      '.coz-lake-cap{position:fixed;top:0;left:0;right:0;margin:0 auto;width:100%;z-index:31;text-align:center;pointer-events:none;' +
        'font-family:"Cormorant Garamond",Georgia,serif;color:#fbf3e4;text-shadow:0 1px 8px rgba(0,8,24,.95),0 0 2px rgba(0,8,24,.8)}' +
      '.coz-lake-cap.lk-off{opacity:0;visibility:hidden}' +
      '.coz-lake-cap .lk-k{display:flex;align-items:center;justify-content:center;gap:10px;font-size:12.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#ead1a1;line-height:1.3}' +
      '.coz-lake-cap .lk-k:before,.coz-lake-cap .lk-k:after{content:"";display:block;width:26px;height:1px;background:linear-gradient(90deg,transparent,#d9b27a)}' +
      '.coz-lake-cap .lk-k:after{background:linear-gradient(90deg,#d9b27a,transparent)}' +
      '.coz-lake-cap .lk-pair{display:block;font-size:clamp(22px,6.6vw,28px);font-weight:600;letter-spacing:.06em;text-transform:uppercase;line-height:1.12;margin:1px 0}' +
      '.coz-lake-cap .lk-dates{display:block;font-size:12.5px;font-weight:600;letter-spacing:.17em;text-transform:uppercase;color:#ecdcbd;line-height:1.3}' +
      '.coz-lake-cap .lk-back{display:inline-block;margin-top:1px;padding:2px 14px 3px;pointer-events:auto;cursor:pointer;' +
        'font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(15px,4.2vw,18px);font-weight:600;letter-spacing:.05em;' +
        'color:#d4a178;background:none;border:0;-webkit-tap-highlight-color:transparent;text-shadow:inherit}' +
      '.coz-lake-cap .lk-back:focus-visible{outline:1px solid #d4a178;outline-offset:2px}' +
      '.coz-lake-flyer{position:fixed;z-index:35;pointer-events:none;transform-origin:0 0;opacity:0;will-change:transform,opacity,filter}' +
      '@media (prefers-reduced-motion:reduce){.coz-lake .lk-spark,.coz-lake .lk-rip ellipse{animation:none}}';
    document.head.appendChild(s);
  }

  /* ---------------- WebGL scene ----------------
     A, B: the two scenes (B only during a Mahadasha dissolve, mixed by M)
     K: water life 0..1      L: light 0..1 (dark at the start of the reveal)
     Z: zoom about C (the sky planet's centre)      R: reveal radius around RC
     E: how strongly the water rings around EP (the emergence point) */
  var VS = 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS =
    'precision highp float;varying vec2 u;uniform sampler2D A;uniform sampler2D B;' +
    'uniform float M,T,K,H,Z,L,R,AR,E;uniform vec2 C,RC,EP;' +
    'void main(){' +
      'vec2 z=C+(u-C)/Z;' +
      'float d=clamp((z.y-H)/(1.-H),0.,1.);' +
      'float k=smoothstep(0.,.05,d)*K;' +
      'float f=mix(230.,55.,sqrt(d));' +
      'float ph=z.y*f;' +
      'float dx=(sin(ph+T*1.1)*.55+sin(ph*.51-T*.75+z.x*5.)*.3+sin(z.y*16.-T*.32+z.x*2.2)*.15)*mix(.0012,.0052,d)*k;' +
      'float dy=sin(ph*.87+T*.9+z.x*2.5)*mix(.0004,.0018,d)*k;' +
      'vec2 e=(z-EP)*vec2(1.,AR*3.4);float r=length(e);' +
      'dy+=sin(r*150.-T*4.2)*exp(-r*6.5)*(.25+E)*.0026*k;' +
      'vec2 q=z+vec2(dx,dy);' +
      'vec3 c=mix(texture2D(A,q).rgb,texture2D(B,q).rgb,M);' +
      'float lum=dot(c,vec3(.299,.587,.114));' +
      'float g=pow(max(0.,sin(ph*1.63+T*1.7+sin(z.x*11.+T*.6)*2.2)),18.)*(.55+.45*sin(z.x*37.+T*1.3+ph*.2))*smoothstep(.02,.25,d)*K;' +
      'c+=c*g*smoothstep(.12,.5,lum)*.9+g*.035*vec3(.75,.82,1.)*smoothstep(0.,.3,d);' +
      'c+=vec3(1.,.72,.38)*pow(max(0.,sin(r*150.-T*4.2)),6.)*exp(-r*5.)*(.04+E*.16)*smoothstep(0.,.03,d)*K;' +
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
    ['A', 'B', 'M', 'T', 'K', 'H', 'Z', 'L', 'R', 'AR', 'E', 'C', 'RC', 'EP'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1); gl.uniform1f(U.H, HORIZON); gl.uniform1f(U.AR, AR);
    gl.uniform2f(U.EP, EP.x / FW, EP.y / FH);
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

    var st = { M: 0, K: reduce ? 0 : 1, L: 1, R: 3, Z: 1, E: 0, C: [.4966, .27], RC: [.4966, .27], breath: !reduce, t0: performance.now(), raf: 0, live: false, tweens: 0 };
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
      gl.uniform1f(U.M, st.M); gl.uniform1f(U.K, st.K); gl.uniform1f(U.L, st.L); gl.uniform1f(U.E, st.E);
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
  var SVGNS = 'http://www.w3.org/2000/svg';
  function create(opt) {
    css();
    var root = document.createElement('div');
    root.className = 'coz-lake' + (opt.hidden ? ' lk-hidden' : '');
    root.id = 'cozLake';
    root.setAttribute('role', 'img');
    root.innerHTML =
      '<div class="lk-art"></div>' +
      '<svg class="lk-fx" viewBox="0 0 ' + FW + ' ' + FH + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="lkGoldV" gradientUnits="userSpaceOnUse" x1="0" y1="' + EP.y + '" x2="0" y2="200">' +
          '<stop offset="0" stop-color="#ffcf86" stop-opacity="0"/><stop offset=".12" stop-color="#ffcf86" stop-opacity="1"/>' +
          '<stop offset=".78" stop-color="#ffd99a" stop-opacity="1"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></linearGradient></defs>' +
        '<g class="lk-rips"><g class="lk-rip">' +
          '<ellipse cx="' + EP.x + '" cy="' + EP.y + '" rx="300" ry="44" fill="none" stroke="#ffc477" stroke-width="2.4"/>' +
          '<ellipse cx="' + EP.x + '" cy="' + EP.y + '" rx="300" ry="44" fill="none" stroke="#ffc477" stroke-width="2.4"/>' +
          '<ellipse cx="' + EP.x + '" cy="' + EP.y + '" rx="300" ry="44" fill="none" stroke="#ffc477" stroke-width="2.4"/>' +
        '</g></g>' +
        '<g class="lk-path">' +
          '<path class="lk-p1" fill="none" stroke="url(#lkGoldV)" stroke-width="20" stroke-linecap="round" opacity=".10"/>' +
          '<path class="lk-p2" fill="none" stroke="url(#lkGoldV)" stroke-width="10" stroke-linecap="round" opacity=".22"/>' +
          '<path class="lk-p3" fill="none" stroke="url(#lkGoldV)" stroke-width="3.2" stroke-linecap="round" opacity=".95"/>' +
          '<path class="lk-spark" fill="none" stroke="#fff1d0" stroke-width="4" stroke-linecap="round" opacity=".9"/>' +
        '</g>' +
      '</svg>' +
      '<div class="lk-trav"><img alt=""><span class="lk-gl" aria-hidden="true"></span></div>' +
      '<div class="lk-trav"><img alt=""><span class="lk-gl" aria-hidden="true"></span></div>' +
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
    var travs = [].slice.call(root.querySelectorAll('.lk-trav'));
    var pathG = root.querySelector('.lk-path'), ripsG = root.querySelector('.lk-rips');
    var paths = [].slice.call(pathG.querySelectorAll('path'));
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
    if (!glS) {
      art.removeChild(canvas);
      imgA = document.createElement('img'); imgA.className = 'lk-img'; imgA.alt = '';
      imgB = document.createElement('img'); imgB.className = 'lk-img'; imgB.alt = ''; imgB.style.opacity = '0';
      art.appendChild(imgA); art.appendChild(imgB);
    }

    var cur = { main: key(opt.main), sub: key(opt.sub) };
    var P = pathFor(cur.main);
    function drawPath() {
      P = pathFor(cur.main);
      var d = pathD(P);
      paths.forEach(function (p) { p.setAttribute('d', d); });
      var g = root.querySelector('#lkGoldV');
      g.setAttribute('y2', String(P.p3.y + skyBox(cur.main).h * .32));
    }
    drawPath();
    if (glS) { glS.st.C = skyCenter(cur.main); glS.st.RC = skyCenter(cur.main); }

    /* h. while reading, the scene rises to the top and shrinks to the top quarter,
          driven by the browser's own scrolling (LK1.4) */
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
      var cap0 = H - ch - H * .016;
      var cap1 = target - ch - H * s1 * .016;
      var band1 = Math.max(target, cap ? cap1 + ch + 4 : 0);
      return { W: W, H: H, s1: s1, ty1: ty1, target: target, D: Math.max(1, H - target), cap0: cap0, cap1: cap1, band1: band1 };
    }
    function apply(p) {
      var g = G, ty = g.ty1 * p, s = 1 + (g.s1 - 1) * p;
      root.style.transform = p ? 'translateY(' + ty.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')' : '';
      veil.style.opacity = p.toFixed(3);
      if (cap) cap.style.transform = 'translateY(' + (g.cap0 + (g.cap1 - g.cap0) * p).toFixed(2) + 'px)';
      band.style.transform = 'scaleY(' + (p > 0 ? 1 + (g.band1 / g.H - 1) * p : 0).toFixed(4) + ')';
    }
    function onScroll() {
      if (tick) return;
      tick = requestAnimationFrame(function () { tick = 0; apply(Math.min(1, Math.max(0, global.pageYOffset || 0) / G.D)); });
    }
    function layout() {
      G = geo();
      if (G.W !== lastW) { lastW = G.W; restAll(); }
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

    /* ---- the subperiod: placement in scene-frame px, converted to the scene's
            on-page size (k) at the moment it is used ---- */
    function kpx() { return root.offsetWidth / FW; }
    function travSize(lord) { var a = ORB_A[lord] || 1; return { w: WATER_H * a, h: WATER_H }; }
    function insideScale(lord) { var b = skyBox(cur.main); return Math.min(b.w, b.h) * INSIDE / WATER_H; }
    function tf(x, y, sz, s) {                       /* centre the traveller at frame point (x, y), scaled by s */
      var k = kpx();
      return 'translate(' + ((x - sz.w / 2) * k).toFixed(2) + 'px,' + ((y - sz.h / 2) * k).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
    }
    function prep(t, lord) {
      var sz = travSize(lord), k = kpx();
      t.style.width = (sz.w * k) + 'px'; t.style.height = (sz.h * k) + 'px';
      var gl = t.querySelector('.lk-gl');
      gl.textContent = GLYPH[lord] ? GLYPH[lord] + '︎' : '';
      gl.style.fontSize = (sz.h * k * .5) + 'px';
      t.setAttribute('data-lord', lord);
      return sz;
    }
    var shown = null, shownLord = null;
    function restAt(t, lord) {
      var sz = prep(t, lord), c = P.p3;
      stopAnims(t); stopAnims(t.querySelector('.lk-gl'));
      t.style.transform = tf(c.x, c.y, sz, insideScale(lord));
      t.style.opacity = '1';
      t.querySelector('.lk-gl').style.opacity = '1';
    }
    function restAll() { if (shown && shownLord) restAt(shown, shownLord); }

    function pathGlow(on) {
      if (reduce) return Promise.resolve();
      return anim(pathG, [{ opacity: on ? .34 : .95 }, { opacity: on ? .95 : .34 }], { duration: on ? 600 : 1300, easing: 'ease-in-out', fill: 'forwards' });
    }
    function ripples(on) {
      if (reduce) return;
      anim(ripsG, [{ opacity: on ? .6 : 1 }, { opacity: on ? 1 : .6 }], { duration: on ? 500 : 1600, fill: 'forwards' });
      if (glS) glS.tween('E', on ? 1 : 0, on ? 600 : 2200, easeInOut);
    }

    /* e. the subperiod leaves the Mahadasha planet: up and away */
    function leave() {
      var t = shown, lord = shownLord;
      shown = null; shownLord = null;
      if (!t) return Promise.resolve();
      stopAnims(t);
      var sz = travSize(lord), c = P.p3, s = insideScale(lord), b = skyBox(cur.main);
      anim(t.querySelector('.lk-gl'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      if (reduce) return anim(t, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      return anim(t, [
        { transform: tf(c.x, c.y, sz, s), opacity: 1 },
        { transform: tf(c.x, c.y - b.h * .35, sz, s * .85), opacity: .85, offset: .45 },
        { transform: tf(c.x, c.y - b.h * 1.05, sz, s * .55), opacity: 0 }
      ], { duration: 1100, easing: 'cubic-bezier(.45,0,.6,1)', fill: 'forwards' });
    }
    /* e. the next one comes up out of the water, travels the path, settles inside */
    function arrive(lord, avoid) {
      var t = avoid === travs[0] ? travs[1] : travs[0];
      return load(url('orb', lord)).then(function (im) {
        stopAnims(t); stopAnims(t.querySelector('.lk-gl'));
        var sz = prep(t, lord);
        t.querySelector('img').src = im.src;
        t.querySelector('.lk-gl').style.opacity = '0';
        shown = t; shownLord = lord;
        var sIn = insideScale(lord);
        if (reduce) {
          t.style.transform = tf(P.p3.x, P.p3.y, sz, sIn);
          return Promise.all([
            anim(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' }),
            anim(t.querySelector('.lk-gl'), [{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' })
          ]);
        }
        ripples(true); pathGlow(true);
        /* up out of the water */
        var up = anim(t, [
          { transform: tf(EP.x, EP.y + 46, sz, .62), opacity: 0 },
          { opacity: .85, offset: .5 },
          { transform: tf(EP.x, EP.y, sz, 1), opacity: 1 }
        ], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
        return up.then(function () {
          /* along the gold path, growing smaller as it nears the Mahadasha planet */
          var N = 28, frames = [];
          for (var i = 0; i <= N; i++) {
            var tt = i / N, pt = bez(P, tt);
            frames.push({ transform: tf(pt.x, pt.y, sz, 1 + (sIn - 1) * Math.pow(tt, 1.35)), offset: tt });
          }
          return anim(t, frames, { duration: 2300, easing: 'cubic-bezier(.42,0,.3,1)', fill: 'forwards' });
        }).then(function () {
          ripples(false); pathGlow(false);
          return anim(t.querySelector('.lk-gl'), [{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });
        });
      });
    }

    /* Changes run one at a time; a tap during one only moves the target. */
    var wantSub = cur.sub, busy = null;
    function settleSub() {
      if (busy) return busy;
      var run = (function step() {
        if (shownLord === wantSub) return Promise.resolve();
        var target = wantSub, leaving = shown;
        var out = leave();
        var inn = wait(leaving && !reduce ? 450 : 0).then(function () { return arrive(target, leaving); });
        return Promise.all([out, inn]).then(step);
      })();
      busy = run.then(function () { busy = null; }, function () { busy = null; });
      return busy;
    }
    var mainQ = Promise.resolve();

    function sceneImg(lord) { return load(url('scene', lord)); }
    function label(main, sub) { root.setAttribute('aria-label', cap1st(main) + ' Mahadasha, ' + cap1st(sub) + ' subperiod inside it'); }

    var ready = sceneImg(cur.main).then(function (im) {
      if (glS) { glS.setA(im); glS.start(); } else { imgA.src = im.src; }
      label(cur.main, cur.sub);
      return load(url('orb', cur.sub));
    }).then(function () { return cur; });

    var api = {
      el: root, ready: ready, gl: glS, art: art,
      showSub: function (lord) {
        wantSub = key(lord); cur.sub = wantSub; label(cur.main, cur.sub);
        return ready.then(function () { return mainQ; }).then(settleSub);
      },
      /* f. Mahadasha change: the subperiod leaves, the sky dissolves, the next one travels in. */
      setMain: function (main, sub) {
        main = key(main); sub = key(sub);
        mainQ = mainQ.then(function () { return ready; }).then(function () { return busy; }).then(function () {
          if (main === cur.main) { wantSub = sub; cur.sub = sub; label(cur.main, cur.sub); return settleSub(); }
          var next = sceneImg(main);
          var out = leave();
          return next.then(function (im) {
            var dissolve;
            if (glS) {
              glS.setB(im);
              dissolve = glS.tween('M', 1, reduce ? 250 : 2200, easeInOut, reduce ? 0 : 450).then(function () { glS.promote(im); glS.st.C = skyCenter(main); glS.st.RC = skyCenter(main); });
            } else {
              imgB.src = im.src;
              dissolve = anim(imgB, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 250 : 2200, delay: reduce ? 0 : 450, easing: 'ease-in-out', fill: 'forwards' })
                .then(function () { imgA.src = im.src; stopAnims(imgB); imgB.style.opacity = '0'; });
            }
            return Promise.all([out, dissolve]);
          }).then(function () {
            cur.main = main; drawPath();
            wantSub = sub; cur.sub = sub; label(cur.main, cur.sub);
            return settleSub();
          });
        }).catch(function (e) { if (global.console) console.warn('[LAKE] change failed: ' + (e && e.message)); });
        return mainQ;
      },
      caption: function (html) { if (cap) { cap.innerHTML = html; layout(); } },
      showCaption: function () { if (cap) { cap.classList.remove('lk-off'); if (cap.animate && !reduce) cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700 }); } },
      onBack: function (fn) { if (cap) cap.addEventListener('click', function (ev) { if (ev.target.closest('.lk-back')) fn(ev); }); },
      layout: layout,
      /* The sky planet's box on screen with the scene at rest (top of the page). */
      skyRect: function (lord) {
        var b = skyBox(lord), k = kpx();
        return { left: root.offsetLeft + b.x * k, top: b.y * k, width: b.w * k, height: b.h * k };
      },
      compactBottom: function () { return G ? G.band1 : 0; },
      state: function () { return { main: cur.main, sub: cur.sub }; }
    };

    /* LK2.1: Safari on his iPhone stopped the Tropical page's scroll-linked shrink partway; the
       same self-check guards this scene. On the first scroll past the start, if the scene's real
       size is not the size it should have, the CSS animation is dropped for the frame-synced path. */
    var verified = !TL;
    function verify() {
      if (verified || !G) return;
      var p = Math.min(1, Math.max(0, global.pageYOffset || 0) / G.D);
      if (p < .05) return;
      /* checked on every scroll, because the page grows when a drop-down opens */
      var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(root).transform || ''), sNow = m ? parseFloat(m[1].split(',')[0]) : 1;
      if (Math.abs(sNow - (1 + (G.s1 - 1) * p)) > .06) {
        verified = true; TL = false; if (tlStyle) tlStyle.textContent = '';
        global.addEventListener('scroll', onScroll, { passive: true });
        apply(Math.min(1, p));
      }
    }
    if (TL) global.addEventListener('scroll', function () { if (!verified) requestAnimationFrame(verify); }, { passive: true });
    else global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', function () { if (root.offsetWidth !== lastW) layout(); });
    layout();

    /* Pages other than the overview's first visit open with the subperiod already inside. */
    if (!opt.hidden) ready.then(function () {
      if (shownLord) return;
      var t = travs[0];
      return load(url('orb', cur.sub)).then(function (im) {
        t.querySelector('img').src = im.src;
        shown = t; shownLord = cur.sub;
        restAt(t, cur.sub);
        if (!reduce && t.animate) t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
      });
    });
    return api;
  }

  /* ---------------- g. overview: the reveal ---------------- */
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
        root.classList.remove('lk-hidden'); lake.layout(); lake.showCaption();
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

      if (glS) { glS.st.R = 0; glS.st.L = 0; glS.st.Z = 1.12; glS.st.K = 0; glS.draw(); }
      else { lake.art.style.clipPath = 'circle(0% at 50% 27%)'; }
      root.classList.remove('lk-hidden'); lake.layout();

      anim(fromEl, [
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 ' + GOLD + '0))' },
        { transform: 'scale(1.14)', filter: 'drop-shadow(0 0 14px ' + GOLD + '.85))' }
      ], { duration: 700, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
      anim(fly, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 450, fill: 'forwards' });
      anim(fromEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 750, fill: 'forwards' });
      var flight = anim(fly, [
        { transform: start, filter: 'drop-shadow(0 0 6px ' + GOLD + '.55))' },
        { filter: 'drop-shadow(0 0 22px ' + GOLD + '.9))', offset: .55 },
        { transform: 'translate(0px,0px) scale(1)', filter: 'drop-shadow(0 0 12px ' + GOLD + '.7))' }
      ], { duration: 2400, delay: 750, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
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
        var settle = anim(fly, [
          { opacity: 1, filter: 'drop-shadow(0 0 12px ' + GOLD + '.7))' },
          { opacity: 0, filter: 'drop-shadow(0 0 0 ' + GOLD + '0))' }
        ], { duration: 900, easing: 'ease-in', fill: 'forwards' });
        if (glS) glS.tween('K', 1, 2000, easeInOut, 150);
        var up = wait(650).then(function () { lake.showCaption(); return lake.showSub(lake.state().sub); });
        return Promise.all([settle, up, opening]);
      }).then(function () { if (fly.parentNode) fly.parentNode.removeChild(fly); });
    });
  }

  /* ---------------- period helpers and the label ---------------- */
  function periods(chart) {
    var lc = chart && chart.lifeCycle;
    if (!lc || !lc.mahadasha || !lc.antardasha || !lc.mahadasha.lord || !lc.antardasha.lord) return null;
    return { md: lc.mahadasha, ad: lc.antardasha, seq: lc.antardashaSequence || [], nextMd: lc.nextMahadasha || null };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function mY(iso) { var d = new Date(iso); return isNaN(d) ? '' : MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function datesOf(seg) {
    if (!seg) return '';
    if (seg.startTimestamp && seg.endTimestamp) return mY(seg.startTimestamp) + ' – ' + mY(seg.endTimestamp);
    if (seg.startTimestamp) return 'Begins ' + mY(seg.startTimestamp);
    return '';
  }
  function block(kicker, main, sub, seg, back) {
    var dt = datesOf(seg);
    return '<span class="lk-k">' + esc(kicker) + '</span>' +
           '<span class="lk-pair">' + esc(cap1st(main)) + ' – ' + esc(cap1st(sub)) + '</span>' +
           (dt ? '<span class="lk-dates">' + esc(dt) + '</span>' : '') +
           (back ? '<button type="button" class="lk-back">Back to You Are Here</button>' : '');
  }
  /* His concept's three lines: Current Sub-Period / Moon – Venus / Jun 2026 – Aug 2027 */
  function capHere(main, sub, seg) { return block('Current Sub-Period', main, sub, seg, false); }
  function capPreview(main, sub, seg) {
    var past = seg && seg.endTimestamp && new Date(seg.endTimestamp).getTime() <= Date.now();
    return block(past ? 'Looking Back' : 'Previewing', main, sub, seg, true);
  }

  global.CozLake = { create: create, reveal: reveal, periods: periods, capHere: capHere, capPreview: capPreview, preload: function (kind, lord) { return load(url(kind, lord)); } };
})(window);
