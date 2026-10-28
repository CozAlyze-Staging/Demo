/* BK1 (Oct 27 2026, Jason's ruling, staging only): the reading clips now end with the book (his approved preview
   F1.2: the solar system at its original framing, then the book opens, the camera pushes in on the right page).
   The clip carries no name. This script writes the reader's first name on that page, under "written in the stars",
   the way the approved preview does: the same lettering (Parisienne), size, place, ink and timing, each part of the
   name coming up soft out of the page and settling into crisp ink, and riding the page while the camera is still
   arriving. It is drawn on a canvas laid exactly over the clip and locked to the clip's frames. No name, nothing drawn.
   Each reading page calls CozBookName.attach({...}) with its clip size and where the book sits in it. */
(function () {
  "use strict";
  var FONT_URL = "Parisienne-Regular.ttf?v=1", FAMILY = "CozBookScript";
  var BOOK_FPS = 347 / 11;                 /* the book part of the clip runs at 347/11 frames a second */
  var G = {                                /* measured on the approved preview, in the book's own pixels (1068 x 1936) */
    em: 152.25, stroke: 0.5, soft: 1.5, softBlur: 5.0, softGain: 1.15,
    centerX: 425, baseline: 850, slant: Math.tan(14 * Math.PI / 180),
    sweep: 1.5, mat: 0.34, fadeIn: 0.10, maxW: 640,
    start: 379, land: 405,                 /* book frame the writing starts on (12.0 s) and the frame the camera lands on */
    camera: [[0.81468,0.001387,-0.001461,0.812078,156.008191,162.641725],[0.825565,0.001388,-0.00133,0.823135,146.448643,152.73653],[0.836459,0.001373,-0.001254,0.83401,137.011622,143.191997],[0.84728,0.001319,-0.001222,0.844739,127.682327,133.986174],[0.857949,0.001234,-0.001173,0.855353,118.464869,124.784509],[0.868404,0.001017,-0.001102,0.865862,109.497801,115.628213],[0.878673,0.000809,-0.001064,0.876187,100.689792,106.80598],[0.888705,0.000823,-0.000975,0.886367,92.101581,98.13612],[0.898539,0.000835,-0.000844,0.896268,83.629283,89.655875],[0.90805,0.000751,-0.00073,0.905955,75.479684,81.233832],[0.917225,0.000628,-0.000648,0.915375,67.687724,72.959754],[0.92609,0.000558,-0.000601,0.924447,60.228131,64.976724],[0.934696,0.000456,-0.000495,0.933127,52.996308,57.582023],[0.942888,0.000411,-0.00037,0.941422,46.136096,50.509847],[0.950636,0.000422,-0.000231,0.949303,39.671567,43.771409],[0.957887,0.0003,-0.000145,0.956848,33.738094,37.257648],[0.964629,0.000174,-0.000082,0.96388,28.242074,31.173112],[0.970906,0.00005,-0.000108,0.970416,23.188558,25.466328],[0.976623,-0.000055,-0.000125,0.976364,18.59076,20.279094],[0.981832,-0.000079,-0.000097,0.981735,14.445651,15.645147],[0.986418,-0.0001,-0.000072,0.986465,10.795825,11.564892],[0.990428,-0.000089,-0.00005,0.990514,7.607085,8.092088],[0.993811,-0.000058,-0.000033,0.993867,4.918439,5.232022],[0.996483,-0.000033,-0.000019,0.996515,2.794838,2.973028],[0.998421,-0.000015,-0.000008,0.998435,1.254755,1.334754],[0.999601,-0.000004,-0.000002,0.999605,0.316856,0.337058],[1,0,0,1,0,0]]
  };
  var INK = [106, 58, 16];                 /* the clip's own ink colour, as the phone shows the clip */

  function smooth(t) { t = t < 0 ? 0 : (t > 1 ? 1 : t); return t * t * (3 - 2 * t); }
  function invSmooth(p) { p = p < 0 ? 0 : (p > 1 ? 1 : p); return 0.5 - Math.sin(Math.asin(1 - 2 * p) / 3); }

  /* the reader's first name: the onboarding name of this chart run, else the chart's own person record */
  function readerName() {
    var n = "";
    try { var b = JSON.parse(localStorage.getItem("emergeBirthData") || "null"); if (b && b.name) n = String(b.name); } catch (e) {}
    if (!n) { try { var c = JSON.parse(localStorage.getItem("cozChartJSON") || "null"); if (c && c.person) n = String(c.person.firstName || c.person.name || ""); } catch (e) {} }
    n = n.trim().split(/\s+/)[0] || "";
    if (n && (n === n.toUpperCase() || n === n.toLowerCase())) n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    return n;
  }

  function gaussian(src, w, h, sigma) {
    var r = Math.ceil(sigma * 3), k = new Float32Array(2 * r + 1), s = 0, i, x, y, j;
    for (i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); s += k[i + r]; }
    for (i = 0; i < k.length; i++) k[i] /= s;
    var tmp = new Float32Array(w * h), out = new Float32Array(w * h), acc, xx, yy;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      acc = 0;
      for (j = -r; j <= r; j++) { xx = x + j; if (xx >= 0 && xx < w) acc += src[y * w + xx] * k[j + r]; }
      tmp[y * w + x] = acc;
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      acc = 0;
      for (j = -r; j <= r; j++) { yy = y + j; if (yy >= 0 && yy < h) acc += tmp[yy * w + x] * k[j + r]; }
      out[y * w + x] = acc;
    }
    return out;
  }

  var fontReady = null;
  function loadFont() {
    if (fontReady) return fontReady;
    fontReady = new Promise(function (resolve) {
      try {
        var ff = new FontFace(FAMILY, "url(" + FONT_URL + ")");
        ff.load().then(function (f) { try { document.fonts.add(f); } catch (e) {} resolve(true); }, function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
    return fontReady;
  }

  /* lay the name out on the book's final page and precompute everything the frames need */
  function prepare(name) {
    function inkBox(em) {
      var c = document.createElement("canvas"), pad = Math.ceil(em);
      var ctx = c.getContext("2d");
      ctx.font = em + "px " + FAMILY;
      var tw = Math.ceil(ctx.measureText(name).width);
      c.width = tw + 2 * pad; c.height = Math.ceil(em * 2.4);
      ctx = c.getContext("2d");
      ctx.font = em + "px " + FAMILY; ctx.textBaseline = "alphabetic";
      ctx.lineWidth = 2 * G.stroke; ctx.lineJoin = "round"; ctx.strokeStyle = ctx.fillStyle = "#fff";
      var by = Math.ceil(em * 1.4);
      ctx.strokeText(name, pad, by); ctx.fillText(name, pad, by);
      var d = ctx.getImageData(0, 0, c.width, c.height).data, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, x, y;
      for (y = 0; y < c.height; y++) for (x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 13) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { c: c, pad: pad, by: by, x0: x0, x1: x1, y0: y0, y1: y1 };
    }
    var em = G.em, L = inkBox(em);
    if (L.x1 < 0) return null;
    if (L.x1 - L.x0 + 1 > G.maxW) { em = em * G.maxW / (L.x1 - L.x0 + 1); L = inkBox(em); }
    /* place: ink centred on centerX, baseline on the line under "the stars" (source canvas -> book pixels) */
    var dx = Math.round(G.centerX - (L.x0 + L.x1) / 2), dy = G.baseline - L.by, M = 40;
    var rx0 = L.x0 + dx - M, ry0 = L.y0 + dy - M;
    var rw = (L.x1 - L.x0 + 1) + 2 * M, rh = (L.y1 - L.y0 + 1) + 2 * M;
    var a0 = new Float32Array(rw * rh), sd = L.c.getContext("2d").getImageData(0, 0, L.c.width, L.c.height).data, x, y, sx, sy;
    var ox = L.x0 - M, oy = L.y0 - M;                                            /* region pixel -> source canvas pixel */
    for (y = 0; y < rh; y++) { sy = y + oy; if (sy < 0 || sy >= L.c.height) continue;
      for (x = 0; x < rw; x++) { sx = x + ox; if (sx < 0 || sx >= L.c.width) continue; a0[y * rw + x] = sd[(sy * L.c.width + sx) * 4 + 3] / 255; } }
    var sharp = gaussian(a0, rw, rh, G.soft), soft = gaussian(sharp, rw, rh, G.softBlur), i;
    for (i = 0; i < soft.length; i++) soft[i] *= G.softGain;
    /* when the pen reaches each pixel: a front leaning with the letters, eased across the name */
    var xp = new Float32Array(rw * rh), lo = 1e9, hi = -1e9, bx, byy;
    for (y = 0; y < rh; y++) for (x = 0; x < rw; x++) {
      bx = rx0 + x; byy = ry0 + y; i = y * rw + x;
      xp[i] = bx - (G.baseline - byy) * G.slant;
      if (sharp[i] > 0.02) { if (xp[i] < lo) lo = xp[i]; if (xp[i] > hi) hi = xp[i]; }
    }
    var reach = new Float32Array(rw * rh);
    for (i = 0; i < reach.length; i++) reach[i] = invSmooth((xp[i] - lo) / Math.max(1, hi - lo)) * G.sweep;
    return { name: name, x: rx0, y: ry0, w: rw, h: rh, sharp: sharp, soft: soft, reach: reach };
  }

  function attach(o) {
    var vid = o.video, stage = o.stage;
    if (!vid || !stage) return null;
    o.bookStart = o.bookStart || 1021 / 24; o.bookFrames = o.bookFrames || 442;
    var P = o.place || { sx: 1, sy: 1, ox: 0, oy: 0 };
    var layer = document.createElement("div");
    layer.className = "coz-book-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:6;visibility:hidden;";
    var cv = document.createElement("canvas");
    cv.style.cssText = "position:absolute;left:0;top:0;transform-origin:0 0;";
    layer.appendChild(cv);
    stage.appendChild(layer);
    var ctx = cv.getContext("2d"), N = null, img = null, lastFrame = -1, settled = false, running = false, wanted = "";

    function setup() {
      wanted = readerName();
      if (!wanted) { N = null; return; }
      if (N && N.name === wanted) return;
      N = null;
      loadFont().then(function (ok) {
        if (!ok || !wanted) return;
        try { N = prepare(wanted); } catch (e) { N = null; }
        if (!N) return;
        cv.width = N.w; cv.height = N.h; cv.style.width = N.w + "px"; cv.style.height = N.h + "px";
        img = ctx.createImageData(N.w, N.h);
        var d = img.data;
        for (var i = 0; i < N.w * N.h; i++) { d[i * 4] = INK[0]; d[i * 4 + 1] = INK[1]; d[i * 4 + 2] = INK[2]; d[i * 4 + 3] = 0; }
        lastFrame = -1; settled = false;
      });
    }
    function hide() { layer.style.visibility = "hidden"; lastFrame = -1; settled = false; }
    function draw(n) {
      var tau = (n - G.start + 1) / BOOK_FPS, d = img.data, i, age, r, e, a, done = tau > G.sweep + G.mat + 0.2;
      if (!(done && settled)) {
        for (i = 0; i < N.w * N.h; i++) {
          age = tau - N.reach[i];
          if (age <= 0) { d[i * 4 + 3] = 0; continue; }
          r = smooth(age / G.fadeIn); e = smooth(age / G.mat);
          a = r * (e * N.sharp[i] + (1 - e) * N.soft[i]);
          d[i * 4 + 3] = a >= 1 ? 255 : (a * 255 + 0.5) | 0;
        }
        ctx.putImageData(img, 0, 0);
        settled = done;
      }
      var m = n <= G.land ? G.camera[Math.max(0, n - G.start)] : G.camera[G.camera.length - 1];
      var k = stage.offsetWidth / o.clipW;
      var A = k * P.sx, B = k * P.sy;
      var tx = k * (P.sx * (m[0] * N.x + m[2] * N.y + m[4]) + P.ox);
      var ty = k * (P.sy * (m[1] * N.x + m[3] * N.y + m[5]) + P.oy);
      cv.style.transform = "matrix(" + (A * m[0]) + "," + (B * m[1]) + "," + (A * m[2]) + "," + (B * m[3]) + "," + tx + "," + ty + ")";
      layer.style.visibility = "visible";
    }
    function update(t) {
      if (!N || !img) { hide(); return; }
      var bt = t - o.bookStart;
      if (bt < 0) { hide(); return; }
      var n = Math.min(Math.round(bt * BOOK_FPS), o.bookFrames - 1);
      if (n < G.start) { hide(); return; }
      if (n === lastFrame) return;
      lastFrame = n; draw(n);
    }
    function loop() {
      if (!running) return;
      if (vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(function (now, md) { update(md.mediaTime); loop(); });
      else requestAnimationFrame(function () { update(vid.currentTime); loop(); });
    }
    vid.addEventListener("playing", function () {
      if (vid.currentTime < 1) { hide(); setup(); }
      if (!running) { running = true; loop(); }
    });
    vid.addEventListener("pause", function () { running = false; if (vid.currentTime < o.bookStart) hide(); });
    vid.addEventListener("ended", function () { running = false; update(vid.duration); });   /* the last frame keeps its name */
    vid.addEventListener("emptied", function () { running = false; hide(); });
    vid.addEventListener("seeked", function () { if (!running) update(vid.currentTime); });
    setup();
    return { update: update, hide: hide, setup: setup, ready: function () { return !!(N && img); } };
  }

  window.CozBookName = { attach: attach, readerName: readerName };
})();
