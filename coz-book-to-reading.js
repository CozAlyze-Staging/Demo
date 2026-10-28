/* coz-book-to-reading.js · BT2 (Oct 28 2026, his three transition clips, staging only)
   After the clip lands on the reader's name, the book gives way to the reading the way his transition clips do it, with
   each reader's own name. Times below are his Vedic clip's, in ms from the clip's end; his Tropical and Combined clips are
   the same transition 6 and 5 frames later (with their own sound), and play that way here.
   0 - 1.0 s       the book page with the name holds
   1.0 - 2.5 s     the parchment gives way in his own pattern: book-break.png was read off his clip frame by frame, so every
                   spot of the page goes when it goes in his clip, fading over 0.12 s as it does there. Behind it: the
                   reading's own night sky, the words and the name in gold where the ink was (the ink turns to gold as the
                   page leaves it, as in his clip), and fine gold dust rising and twinkling over the page
   2.65 - 3.47 s   the gold words fade away, evenly, as in his clip; the dust thins out and has gone by 3.6 s
   3.05 - 4.4 s    the reading page comes up through the sky (its sky is the page's own, so only its words and pictures
                   appear)
   His transition sound plays from the first moment; the reading's background music comes back when the page is up (the
   page's done callback). The gold words are his own (book-words-gold.png, lifted from his clip's frames); the name is the
   page's own drawing of the reader's name, in his gold, drawn as crisply as his gold name.
   Vedic and Tropical: run(), on the same page. Combined: the dashboard runs it over a copy of Your Combined Reading's own
   sky until the gold has gone, then hands over, and combined-reading.html brings its words and pictures up over the same
   sky (arrive). A clip that stalls or fails, reduced motion, a wait for the reading and a reading opened straight away all
   land as before. */
(function () {
  "use strict";
  if (window.CozBookToReading) return;
  var VER = "?v=1";
  var READINGS = {
    vedic:    { lead: 0,   sound: "book-to-reading-sound.m4a" + VER },
    tropical: { lead: 250, sound: "book-to-reading-sound-tropical.m4a" + VER },
    compare:  { lead: 208, sound: "book-to-reading-sound-compare.m4a" + VER }
  };
  /* his breakup: grey level 0..255 = the moment t0..t1 that spot of the page goes; the map covers his clip's frame, which is
     the book frame 2 px lower (book px) */
  var MAP = { src: "book-break.png" + VER, t0: 1000, t1: 2450, x: 0, y: -2, w: 1068, h: 1940 };
  var BAND = 120;                                                 /* each spot fades over 0.12 s (his clips) */
  var GOLD_OUT = [2650, 3470], DUST_OUT = [3000, 3600], EMERGE = [3050, 4400];   /* gold: an even fade */
  var HAND = 3600, ARRIVE = 1300;                                 /* Combined: hand over once the gold and dust have gone */
  var FADE = [1100, 2300];                                        /* only if the pattern has not loaded: a plain fade */
  var KEY = "cozBookToReading";
  var WORDS = { src: "book-words-gold.png" + VER, x: 96, y: 378, w: 704, h: 360 };   /* his gold lettering, from his frames */
  var GOLD = [248, 180, 82];                                      /* his gold, measured on his clips */
  var NAME_EDGE = [0.34, 0.9];                                     /* the name's soft ink drawn crisp, as his gold name is */
  /* his dust (measured on his clip): the page gives off fine gold specks where it breaks, most of them within half a
     second of that spot going, so the dust follows the breakup and thins out a second or so behind it; the specks rise
     about 110 px a second and twinkle; fewer towards the page's sides and few on its lower edge (book px, ms) */
  var SPECKS = { count: 6500, x: [60, 1010], y: [0, 1700], side: [180, 890], foot: 1500, after: 1800, early: [0.35, 600],
                 rise: [85, 140], drift: 50, life: [250, 600], size: [1.1, 3.0], glint: 0.15, glintLife: [120, 250], glintSize: [0.8, 1.3] };
  var SILENT = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABwAAA5EAUFBQUFBQUFBQUFBQUFBtbW1tbW1tbW1tbW1tbYqKioqKioqKioqKioqKqKioqKioqKioqKioqKioxcXFxcXFxcXFxcXFxcXi4uLi4uLi4uLi4uLi4v//////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQDKgAAAAAAAAORy3JmoQAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";

  function now() { return window.__cozBTClock != null ? window.__cozBTClock : performance.now(); }   /* tests drive time */
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function span(t, a) { return smooth((t - a[0]) / (a[1] - a[0])); }
  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function host() { try { if (window.parent !== window && window.parent.document) return window.parent; } catch (e) {} return window; }
  function reading(name) { return READINGS[name] || READINGS.vedic; }

  /* the lettering and his breakup pattern, loaded ahead */
  var wordsImg = null, mapImg = null;
  function load() {
    if (!wordsImg) { wordsImg = new Image(); wordsImg.decoding = "async"; wordsImg.src = WORDS.src; }   /* his gold words */
    if (!mapImg) { mapImg = new Image(); mapImg.decoding = "async"; mapImg.src = MAP.src; }
  }
  function ready(img) { return !!(img && img.complete && img.naturalWidth); }

  /* the sound: an audio element on the living page (so it carries on when Combined changes page), unlocked inside the
     reading tap the way the read-aloud voice is (a moment of silence), the file fetched ahead */
  var soundFor = null, soundUrl = null;
  function prime(name) {
    load();
    var R = reading(name);
    try {
      var H = host(), a = H.__cozBTSound;
      if (!a) { a = new H.Audio(); a.preload = "auto"; a.setAttribute("playsinline", ""); H.__cozBTSound = a; }
      a.src = SILENT; var p = a.play(); if (p && p.catch) p.catch(function () {});
      if (soundFor !== R.sound) {
        soundFor = R.sound; soundUrl = null;
        fetch(R.sound).then(function (r) { return r.ok ? r.blob() : null; })
          .then(function (b) { if (b && soundFor === R.sound) soundUrl = H.URL.createObjectURL(b); }).catch(function () {});
      }
    } catch (e) {}
  }
  function playSound(R) {
    try {
      var a = host().__cozBTSound; if (!a) return;
      a.src = (soundFor === R.sound && soundUrl) || new URL(R.sound, location.href).href;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  /* the screen as it is at the clip's end: black, the clip's last frame where the clip is, the name on it */
  function snapshot(o) {
    var W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
    var c = document.createElement("canvas"); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height);
    var v = o.video, r = v.getBoundingClientRect();
    var vw = v.videoWidth || o.clipW, vh = v.videoHeight || o.clipH, k = Math.min(r.width / vw, r.height / vh);
    var f = { x: r.left + (r.width - vw * k) / 2, y: r.top + (r.height - vh * k) / 2, w: vw * k, h: vh * k };
    x.drawImage(v, f.x * dpr, f.y * dpr, f.w * dpr, f.h * dpr);
    var g = { canvas: c, dpr: dpr, W: W, H: H, P: o.place || { sx: 1, sy: 1, ox: 0, oy: 0 },
              fx: f.x, fy: f.y, kx: f.w / (o.clipW || vw), ky: f.h / (o.clipH || vh), name: null, nameM: null };
    var nc = o.stage && o.stage.querySelector(".coz-book-layer canvas"), layer = nc && nc.parentNode;
    if (nc && nc.width && layer && getComputedStyle(layer).visibility !== "hidden") {   /* the name, where the page drew it */
      var M = window.DOMMatrix || window.WebKitCSSMatrix, m = new M(getComputedStyle(nc).transform);
      var sr = o.stage.getBoundingClientRect(), s = sr.width / (o.stage.offsetWidth || sr.width);
      g.name = nc; g.nameM = [dpr * s * m.a, dpr * s * m.b, dpr * s * m.c, dpr * s * m.d, dpr * (sr.left + s * m.e), dpr * (sr.top + s * m.f)];
      x.setTransform.apply(x, g.nameM); x.drawImage(nc, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
    }
    /* book px to screen (css px) */
    g.bx = g.fx + g.kx * g.P.ox; g.by = g.fy + g.ky * g.P.oy; g.bs = g.kx * g.P.sx; g.bt = g.ky * g.P.sy;
    return g;
  }

  /* the reading's own sky: a copy of the page's background (Vedic and Tropical: its fixed .vedic-bg layer;
     Combined: its page background, given as CSS) */
  function skyLayer(spec) {
    var d = document.createElement("div");
    if (spec && spec.el) {
      var cs = getComputedStyle(spec.el);
      d.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%";
      d.style.backgroundColor = cs.backgroundColor; d.style.backgroundImage = cs.backgroundImage;
      d.style.backgroundSize = cs.backgroundSize; d.style.backgroundPosition = cs.backgroundPosition; d.style.backgroundRepeat = cs.backgroundRepeat;
    } else if (spec && spec.css) {
      d.style.cssText = "position:absolute;top:0;left:50%;height:100%;-webkit-transform:translateX(-50%);transform:translateX(-50%);width:" +
        (spec.maxWidth ? "min(100%," + spec.maxWidth + "px)" : "100%");
      d.style.background = spec.css;
    }
    return d;
  }

  /* the words (his own gold lettering) and the reader's name in his gold, exactly where the ink is on the page; the name is
     the page's own drawing of it, its soft ink edge drawn crisp the way his gold name is */
  function goldLayer(g) {
    var c = document.createElement("canvas"); c.width = g.canvas.width; c.height = g.canvas.height;
    var x = c.getContext("2d"), d = g.dpr;
    if (ready(wordsImg)) x.drawImage(wordsImg, (g.bx + g.bs * WORDS.x) * d, (g.by + g.bt * WORDS.y) * d, g.bs * WORDS.w * d, g.bt * WORDS.h * d);
    if (g.name) {
      try {
        var nw = g.name.width, nh = g.name.height, im = g.name.getContext("2d").getImageData(0, 0, nw, nh), p = im.data, i, a;
        for (i = 0; i < nw * nh; i++) {
          a = clamp((p[i * 4 + 3] / 255 - NAME_EDGE[0]) / (NAME_EDGE[1] - NAME_EDGE[0]));
          p[i * 4] = GOLD[0]; p[i * 4 + 1] = GOLD[1]; p[i * 4 + 2] = GOLD[2]; p[i * 4 + 3] = Math.round(255 * a * a * (3 - 2 * a));
        }
        var nc = document.createElement("canvas"); nc.width = nw; nc.height = nh; nc.getContext("2d").putImageData(im, 0, 0);
        x.setTransform.apply(x, g.nameM); x.drawImage(nc, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
      } catch (e) {   /* the name as the page drew it, in gold */
        var k = document.createElement("canvas"); k.width = c.width; k.height = c.height; var kx = k.getContext("2d");
        kx.setTransform.apply(kx, g.nameM); kx.drawImage(g.name, 0, 0); kx.setTransform(1, 0, 0, 1, 0, 0);
        kx.globalCompositeOperation = "source-in"; kx.fillStyle = "rgb(" + GOLD.join(",") + ")"; kx.fillRect(0, 0, k.width, k.height);
        x.drawImage(k, 0, 0);
      }
    }
    return c;
  }

  /* his rising, twinkling dust: small gold specks, a few of them paler quick glints, planned ahead (the same every time) */
  function dustSprites() {
    return ["255,214,150", "255,204,136", "255,224,170", "255,238,204"].map(function (c, i) {
      var s = document.createElement("canvas"); s.width = s.height = 32;
      var x = s.getContext("2d"), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, "rgba(" + c + ",1)"); gr.addColorStop(i === 3 ? 0.35 : 0.5, "rgba(" + c + ",1)"); gr.addColorStop(1, "rgba(" + c + ",0)");
      x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
      return s;
    });
  }
  function dustPlan(seed, timeAt) {   /* each speck: where, when (soon after the page there goes), for how long, how it moves */
    var R = rng(seed), S = SPECKS, list = [], i;
    function soon() {   /* ms after that spot goes: some at once, most within the first half second, a few a second or more later */
      if (R() < S.early[0]) return S.early[1] * R();
      var a = [R(), R(), R(), R()]; a.sort(function (p, q) { return p - q; }); return S.after * a[1];
    }
    for (i = 0; i < S.count; i++) {
      var bx = S.x[0] + R() * (S.x[1] - S.x[0]), by = S.y[0] + R() * (S.y[1] - S.y[0]);
      if ((bx < S.side[0] || bx > S.side[1]) && R() < 0.55) continue;     /* fewer towards the page's sides */
      if (by > S.foot && R() < 0.7) continue;                              /* few on its lower edge */
      var glint = R() < S.glint, L = glint ? S.glintLife : S.life, Z = glint ? S.glintSize : S.size;
      list.push({ b: timeAt(bx, by, R) + soon(), l: L[0] + R() * (L[1] - L[0]), x: bx, y: by,
                  vx: (R() - 0.5) * S.drift, vy: -(S.rise[0] + R() * (S.rise[1] - S.rise[0])), r: Z[0] + R() * R() * (Z[1] - Z[0]),
                  s: glint ? 3 : (R() * 3) | 0, a: 0.7 + R() * 0.25, f: 0.035 + R() * 0.04, ph: R() * 6.283 });
    }
    list.sort(function (p, q) { return p.b - q.b; });
    return list;
  }

  /* o: { video, stage, clipW, clipH, place (the clip's book geometry, as given to CozBookName), reading ("vedic",
          "tropical" or "compare": his clip it follows), sky (the reading's sky: { el } or { css, maxWidth }), base (its
          night blue), under() (switch the page to the reading underneath, unseen), done(), handOff (Combined) }
     Returns false (nothing done) when the transition cannot run: the caller lands as before. */
  function run(o) {
    if (reduced() || !o || !o.video || !document.body) return false;
    var g;
    try { g = snapshot(o); } catch (e) { return false; }
    var R = reading(o.reading), lead = R.lead, W = g.W, H = g.H, d = g.dpr, base = o.base || "rgb(1,14,34)";
    var T = document.createElement("div");
    T.className = "coz-bt"; T.setAttribute("aria-hidden", "true");
    T.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;overflow:hidden;background:" + base + ";touch-action:none";
    var full = "position:absolute;left:0;top:0;width:100%;height:100%";
    var sky = skyLayer(o.sky);
    var dust = document.createElement("canvas"); dust.width = g.canvas.width; dust.height = g.canvas.height; dust.style.cssText = full;
    var gold = goldLayer(g); gold.style.cssText = full;
    var par = document.createElement("canvas"); par.width = g.canvas.width; par.height = g.canvas.height; par.style.cssText = full;
    var pctx = par.getContext("2d"); pctx.drawImage(g.canvas, 0, 0);
    T.appendChild(sky); T.appendChild(dust); T.appendChild(gold); T.appendChild(par);   /* the page lies over the rest */
    T.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });   /* the page under it stays still */
    document.body.appendChild(T);
    if (!o.handOff) { try { if (o.under) o.under(); } catch (e) {} }
    playSound(R);

    /* the breakup: each mask pixel's moment from his pattern (around the book, his pattern carries on mirrored) */
    var ms = Math.min(2, d), MW = Math.max(1, Math.round(W * ms)), MH = Math.max(1, Math.round(H * ms));
    var mc = document.createElement("canvas"); mc.width = MW; mc.height = MH;
    var mctx = mc.getContext("2d"), md = null, px = null, tm = null, lut = new Uint32Array(256);
    var LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    function prepare() {
      if (tm || !ready(mapImg)) return;
      try {
        var c = document.createElement("canvas"); c.width = MW; c.height = MH;
        var x = c.getContext("2d", { willReadFrequently: true }), img = mapImg, iw = img.naturalWidth, ih = img.naturalHeight;
        var bx = ms * (g.bx + g.bs * MAP.x), by = ms * (g.by + g.bt * MAP.y), bw = ms * g.bs * MAP.w, bh = ms * g.bt * MAP.h;
        x.imageSmoothingEnabled = true;
        for (var j = -1; j <= 1; j++) for (var k = -1; k <= 1; k++) {   /* the pattern and its mirror images all round */
          if ((j && (bx + j * bw >= MW || bx + (j + 1) * bw <= 0)) || (k && (by + k * bh >= MH || by + (k + 1) * bh <= 0))) continue;
          x.setTransform(j ? -1 : 1, 0, 0, k ? -1 : 1, j ? 2 * (bx + (j > 0 ? bw : 0)) : 0, k ? 2 * (by + (k > 0 ? bh : 0)) : 0);
          x.drawImage(img, bx, by, bw, bh);
        }
        x.setTransform(1, 0, 0, 1, 0, 0);
        var src = x.getImageData(0, 0, MW, MH).data, n = MW * MH, a = new Uint8Array(n), i;
        for (i = 0; i < n; i++) a[i] = src[i * 4];
        md = mctx.createImageData(MW, MH); px = new Uint32Array(md.data.buffer); tm = a;
      } catch (e) { tm = null; }
    }
    function breakup(t) {   /* each spot's opacity: full until its moment, gone BAND later */
      var i, k = (MAP.t1 - MAP.t0) / 255;
      for (i = 0; i < 256; i++) {
        var A = Math.round(255 * clamp((MAP.t0 + i * k - t) / BAND + 0.5));
        lut[i] = LE ? A * 16777216 : A;
      }
      for (i = 0; i < tm.length; i++) px[i] = lut[tm[i]];
      mctx.putImageData(md, 0, 0);
      pctx.globalCompositeOperation = "copy"; pctx.drawImage(g.canvas, 0, 0);
      pctx.globalCompositeOperation = "destination-in"; pctx.drawImage(mc, 0, 0, par.width, par.height);
      pctx.globalCompositeOperation = "source-over";
    }

    /* the dust, released where the page breaks */
    var sprites = dustSprites(), plan = null, lo = 0, dctx = dust.getContext("2d"), maxLife = Math.max(SPECKS.life[1], SPECKS.glintLife[1]);
    function timeAt(bx, by, rnd) {   /* the moment the page goes at this book px */
      if (tm) {
        var mx = Math.round(ms * (g.bx + g.bs * bx)), my = Math.round(ms * (g.by + g.bt * by));
        if (mx >= 0 && my >= 0 && mx < MW && my < MH) return MAP.t0 + tm[my * MW + mx] * (MAP.t1 - MAP.t0) / 255;
      }
      return FADE[0] + rnd() * (FADE[1] - FADE[0]);
    }
    function drawDust(t) {
      dctx.clearRect(0, 0, dust.width, dust.height);
      if (!plan) return;
      while (lo < plan.length && plan[lo].b + maxLife < t) lo++;
      for (var i = lo; i < plan.length && plan[i].b <= t; i++) {
        var p = plan[i], age = t - p.b; if (age > p.l) continue;
        var u = age / p.l, s = age / 1000, rr = p.r * g.bs * d * 1.6;
        var X = (g.bx + g.bs * (p.x + p.vx * s)) * d, Y = (g.by + g.bt * (p.y + p.vy * s)) * d;
        dctx.globalAlpha = p.a * smooth(u / 0.15) * (1 - smooth((u - 0.6) / 0.4)) * (0.7 + 0.3 * Math.sin(p.f * age + p.ph));
        dctx.drawImage(sprites[p.s], X - rr, Y - rr, 2 * rr, 2 * rr);
      }
      dctx.globalAlpha = 1;
    }

    var t0 = now(), over = false, broken = false, mode = null;
    function finish() {
      if (over) return; over = true;
      if (o.handOff) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch (e) {}
        try { if (o.done) o.done(); } catch (e) {}   /* navigates; the sky stays until the next page is up */
        return;
      }
      try { T.remove(); } catch (e) {}
      try { [par, gold, dust, mc, g.canvas].forEach(function (c) { c.width = c.height = 0; }); } catch (e) {}   /* their memory back at once */
      try { if (o.done) o.done(); } catch (e) {}
    }
    function frame() {
      if (over) return;
      var t = now() - t0 - lead;   /* his Vedic clip's time */
      if (!tm && t > 60 - lead) prepare();
      if (!broken) {
        if (!mode && t >= MAP.t0 - BAND / 2) { mode = tm ? "map" : "fade"; plan = dustPlan(20261028, timeAt); }
        if (mode === "map") { if (t >= MAP.t1 + BAND / 2) { broken = true; par.style.display = "none"; } else breakup(t); }
        else if (mode === "fade") { var f = span(t, FADE); par.style.opacity = String(1 - f); if (f >= 1) { broken = true; par.style.display = "none"; } }
      }
      gold.style.opacity = String(1 - clamp((t - GOLD_OUT[0]) / (GOLD_OUT[1] - GOLD_OUT[0])));
      if (t < DUST_OUT[1]) { if (t >= MAP.t0 - BAND / 2) { dust.style.opacity = String(1 - span(t, DUST_OUT)); drawDust(t); } }
      else if (dust.style.display !== "none") dust.style.display = "none";
      if (o.handOff) { if (t >= HAND) { finish(); return; } }
      else {
        var u = clamp((t - EMERGE[0]) / (EMERGE[1] - EMERGE[0])), e = 0.5 * u + 0.5 * smooth(u); T.style.opacity = String(1 - e);
        if (e > 0.6) T.style.pointerEvents = "none";
        if (t >= EMERGE[1]) { finish(); return; }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return true;
  }

  /* Combined: combined-reading.html's words and pictures come up over its own sky, the sky the dashboard handed over
     on. Called at the very start of <body>, so they are never seen before. */
  function arrive() {
    var h = null;
    try { h = JSON.parse(sessionStorage.getItem(KEY) || "null"); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!h || !(Date.now() - h.at < 15000) || reduced()) return false;
    var de = document.documentElement, st = document.createElement("style");
    st.textContent = "html.coz-bt-arrive .content,html.coz-bt-arrive .art-bottom{opacity:0}";
    (document.head || de).appendChild(st); de.classList.add("coz-bt-arrive");
    var started = false;
    function go() {
      if (started) return; started = true;
      var els = [].slice.call(document.querySelectorAll(".content,.art-bottom")), t0 = now();
      de.classList.remove("coz-bt-arrive");
      (function frame() {
        var e = smooth((now() - t0) / ARRIVE);
        els.forEach(function (el) { el.style.opacity = e >= 1 ? "" : String(e); });
        if (e < 1) requestAnimationFrame(frame);
      })();
      els.forEach(function (el) { el.style.opacity = "0"; });
    }
    var ready = function () { try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go); } catch (e) { go(); } };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true }); else ready();
    setTimeout(go, 1500);
    return true;
  }

  /* the read-aloud voice stops the transition sound too (VO1.4: all background sound stops at play) */
  function quiet() { try { var a = host().__cozBTSound; if (a && !a.paused) a.pause(); } catch (e) {} }

  load();
  window.CozBookToReading = { run: run, arrive: arrive, prime: prime, quiet: quiet,
    times: { map: [MAP.t0, MAP.t1], band: BAND, goldOut: GOLD_OUT, dustOut: DUST_OUT, emerge: EMERGE, hand: HAND, arrive: ARRIVE,
             leads: { vedic: READINGS.vedic.lead, tropical: READINGS.tropical.lead, compare: READINGS.compare.lead } } };
})();
