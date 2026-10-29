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
   BT2.2: silent from the clip's end through the hold and the whole dissolve (no transition sound); the reading's music
   comes back only once the page is up, starting barely there and rising slowly to its level (musicBack). The gold words are his own (book-words-gold.png, lifted from his clip's frames); the name is the
   page's own drawing of the reader's name, in his gold, drawn as crisply as his gold name.
   Vedic and Tropical: run(), on the same page. Combined: the dashboard runs it over a copy of Your Combined Reading's own
   sky until the gold has gone, then hands over, and combined-reading.html brings its words and pictures up over the same
   sky (arrive). A clip that stalls or fails, reduced motion, a wait for the reading and a reading opened straight away all
   land as before.
   BT2.1 (Oct 28 2026, after his test on staging, staging only): the same transition, made so a phone never skips it.
   - A phone that cannot give it full-size canvases gets them a size smaller (down to 1x), instead of no transition.
   - The clip's last frame is checked after it is captured (the page around the name must be parchment). A phone that
     hands back an empty or wrong frame gets the clip's own last frame instead (book-last-frame.jpg, the same picture,
     fetched only then), while the clip's last frame stays on screen.
   - If anything fails once it has started, its layer fades away onto the reading instead of staying on screen, and a
     safety timer finishes it if the screen stops drawing.
   - Lighter: the gold layer covers only the words and the name (it was the whole screen).
   - Every transition leaves a one-line record on the device (the last 12, localStorage "cozBTLog"); bt-report.html shows
     them. Nothing is sent anywhere.
   BT2.2 (Oct 28 2026, his ruling, staging only): the quiet holds through the name and the dissolve. His transition sound
   no longer plays. The reading's music (the living page's ambient bed) returns only once the reading page is visible: from
   barely there (-40 dB) to its usual level over 8 s, on an even curve (musicBack). Vedic and Tropical: when the page has
   come up (done). Combined: when Your Combined Reading's words and pictures have come up (arrive). The pictures are
   unchanged.
   BT2.3 (Oct 28 2026, after his iPhone screen recording, staging only): the dissolve ran on his phone but stalled twice
   for a moment in the middle of the breakup, then jumped ahead. The reading page is switched in under the book when the
   transition starts, and its first page's pictures (the read-aloud choice, about 360 KB each) arrived and were decoded
   during the breakup. Now: those pictures are fetched and decoded during the clip, about 10 s before its end, and held by
   the living page (so Your Combined Reading finds them too); and the dissolve's own one-time setup (the dust plan, the
   first draw of the breakup) happens during the name hold, when nothing moves. Nothing seen or heard changes.
   BT2.4 (Oct 29 2026, his Vedic test on staging, staging only): it still broke for a moment. The reading's night sky
   (vedic-moon-bg.png, 1.8 MB) and the reading page's logo were never loaded before the transition (the sky is hidden on
   the dashboard, and Safari loads no hidden backgrounds), so the sky arrived and was decoded in the middle of the
   breakup. Now every picture the transition and the reading's first view show (the sky, the logo, the read-aloud
   pictures; Combined: its page art) is fetched 25 s into the clip and held by the living page, the sky is decoded again
   while the name holds, and the breakup starts once the sky is ready (the hold lasts at most 2 s longer, only if a
   slow connection has not brought it in time). Nothing seen or heard changes otherwise.
   BT2.5 (Oct 29 2026, his Tropical test: "a flash, like a blink, right after the name"): the handover from the clip to
   the transition. On the phone a newly added layer (the copy of the page) can take a frame or two to appear, and the clip
   was taken away at once, so for that moment the screen showed the transition's dark background instead of the page.
   Now the transition's layer starts see-through with only the copy of the page in it, and the clip's own last frame (the
   same picture) stays underneath until the copy has been on screen for a few frames; only then do the dark background,
   the sky, the dust and the gold layers come on (all under the page) and the reading is switched in underneath.
   The copy of the page now also carries the clip's Back arrow in the corner, drawn as the page draws it (before, the
   arrow vanished at that moment); it stays through the hold and goes with the page as it breaks up. */
(function () {
  "use strict";
  if (window.CozBookToReading) return;
  var VER = "?v=1";
  var READINGS = {
    vedic:    { lead: 0 },
    tropical: { lead: 250 },
    compare:  { lead: 208 }
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
  /* BT2.1: the clip's own last frame (clip px), and six spots of plain parchment on it, away from the words and the name,
     with their colour there (r, g, b): a captured frame must show parchment at most of them */
  var STILL = { src: "book-last-frame.jpg" + VER, clip: /reading-reveal-fullscreen\.mp4/, w: 1068, h: 2320,   /* remake both if the clip changes */
                probes: [[150, 1250, 235, 217, 194], [350, 1300, 234, 216, 190], [600, 1220, 231, 210, 180],
                         [250, 1450, 232, 212, 185], [750, 1350, 225, 203, 172], [450, 1380, 232, 214, 185]], tol: 48 };
  var LOG = "cozBTLog", LOG_MAX = 12;
  var MUSIC = { from: 0.01, secs: 8 };                            /* BT2.2: the bed comes back from -40 dB to its level in 8 s */
  var BED = "cozBedBack";                                          /* BT2.2: Combined: the next page brings the music back */

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

  /* called in the reading tap: the lettering and the pattern are made ready (BT2.2: there is no transition sound), and
     (BT2.3, BT2.4) every picture the transition and the reading's first view show is fetched 25 s into the clip */
  function prime(name) {
    load();
    try { setTimeout(function () { warm(name); }, 25000); } catch (e) {}
  }
  /* BT2.3, BT2.4: the pictures the transition and the reading's first view show, exactly as the pages ask for them:
     the reading's sky (the pages' .vedic-bg; Combined: its page background) and logo, and the read-aloud choice
     (coz-voice.js VOICES with its ART version "?v=3"; update together). Held by the living page, so they stay loaded
     across Combined's page change. */
  var AVATAR = function (v) { return "avatars/avatar-" + v + ".jpg?v=3"; };
  var PICTURES = {
    vedic:    ["vedic-moon-bg.png", "vedic-logo.png", AVATAR("vedic-male"), AVATAR("vedic-female")],
    tropical: ["vedic-moon-bg.png", "vedic-logo.png", AVATAR("tropical-male"), AVATAR("tropical-female")],
    compare:  ["combined-top.jpg?v=1", "combined-mid.png?v=1", "combined-bottom.jpg?v=1",
               AVATAR("vedic-male"), AVATAR("vedic-female"), AVATAR("tropical-male"), AVATAR("tropical-female")]
  };
  function warm(name) {
    try {
      var H = host(), keep = H.__cozBTWarm || (H.__cozBTWarm = {});
      (PICTURES[name] || []).forEach(function (u) {
        var src = new URL(u, location.href).href;
        if (keep[src]) return;
        var im = new H.Image(); im.decoding = "async"; im.src = src; keep[src] = im;
        if (im.decode) im.decode().then(null, function () {});
      });
    } catch (e) {}
  }
  /* BT2.4: the sky's pictures, decoded now (a fetched picture may have been set aside since): resolves when all are
     ready (or could not be), so the breakup never shows the sky arriving */
  function skyPictures(spec) {
    var css = "";
    try { css = spec && spec.el ? getComputedStyle(spec.el).backgroundImage : (spec && spec.css) || ""; } catch (e) {}
    var urls = [], re = /url\(\s*["']?([^"')]+)["']?\s*\)/g, m;
    while ((m = re.exec(css))) urls.push(new URL(m[1], location.href).href);
    return Promise.all(urls.map(function (u) {
      return new Promise(function (res) {
        try {
          var im = new Image(); im.src = u;
          var done = function () { res(); };
          if (im.decode) im.decode().then(done, done);
          else if (im.complete) done(); else { im.onload = done; im.onerror = done; }
        } catch (e) { res(); }
      });
    }));
  }

  /* BT2.2: the reading's music back, gently: the living page's ambient bed starts from silence towards barely there
     (-40 dB), then rises on an even curve to its usual level over 8 s. Only ever called once the reading page is up.
     The engine's level is read back only once it is playing the bed (a level read at the start would be its default, a
     moment at full volume). */
  function musicBack(snd) {
    try {
      if (!snd) { var H = host(); snd = H.EMERGE_SOUND; }
      if (!snd || !snd.loop) return false;
      snd.loop("ambient", MUSIC.from);
      if (snd.swell && snd.fade) {
        setTimeout(function () {
          try { snd.swell("ambient", MUSIC.from, 0.15); } catch (e) {}
          setTimeout(function () { try { snd.fade("ambient", 1.0, MUSIC.secs); } catch (e) {} }, 200);
        }, 300);
        setTimeout(function () { try { snd.swell("ambient", 1.0, 3); } catch (e) {} }, 300 + 200 + MUSIC.secs * 1000 + 1000);   /* at its level in any case */
      }
      return true;
    } catch (e) { return false; }
  }

  /* BT2.1: a one-line record of what happened, kept on this device only (bt-report.html shows it) */
  function note(e) {
    try {
      var a = JSON.parse(localStorage.getItem(LOG) || "[]"); if (!Array.isArray(a)) a = [];
      e = e || {}; e.at = new Date().toISOString(); e.page = location.pathname.split("/").pop();
      e.screen = window.innerWidth + "x" + window.innerHeight + " @" + (window.devicePixelRatio || 1) + "x";
      e.device = String(navigator.userAgent || "").replace(/^Mozilla\/5\.0 /, "").slice(0, 140);
      a.push(e); while (a.length > LOG_MAX) a.shift();
      localStorage.setItem(LOG, JSON.stringify(a));
    } catch (x) {}
  }
  function msg(e) { return String((e && e.message) || e || "error").slice(0, 160); }
  /* a canvas that can really be drawn on (a phone short of canvas memory gives none, or one that draws nothing) */
  function canvas2d(w, h, opts) {
    var c = document.createElement("canvas"), cw = Math.max(1, Math.round(w)), ch = Math.max(1, Math.round(h));
    c.width = cw; c.height = ch;
    var x = c.getContext("2d", opts), ok = !!x;
    if (ok) {
      try { x.fillStyle = "#fff"; x.fillRect(0, 0, 1, 1); ok = x.getImageData(0, 0, 1, 1).data[3] === 255; x.clearRect(0, 0, 1, 1); }
      catch (e) { ok = true; }
    }
    if (!ok) { c.width = c.height = 0; throw new Error("no canvas " + cw + "x" + ch); }
    return { c: c, x: x };
  }
  function free(list) { for (var i = 0; i < list.length; i++) { try { if (list[i]) list[i].width = list[i].height = 0; } catch (e) {} } }

  /* the clip's own last frame, fetched only if a phone could not capture it */
  var stillImg = null;
  function loadStill(cb) {
    var settled = false;
    function fin() { if (settled) return; settled = true; cb(ready(stillImg) ? stillImg : null); }
    if (!stillImg) { stillImg = new Image(); stillImg.src = STILL.src; }
    if (ready(stillImg)) { fin(); return; }
    stillImg.addEventListener("load", fin); stillImg.addEventListener("error", fin);
    setTimeout(fin, 2500);
  }
  /* the captured frame shows the parchment where the clip's last frame has it ("yes"), or not ("no"); spots off the
     screen are skipped, and a phone that cannot read a canvas back is trusted ("unread") */
  function looksRight(x, f, dpr) {
    try {
      var P = STILL.probes, kx = f.w / STILL.w, ky = f.h / STILL.h, n = 0, on = 0, cw = x.canvas.width, ch = x.canvas.height;
      for (var i = 0; i < P.length; i++) {
        var px = Math.round((f.x + P[i][0] * kx) * dpr), py = Math.round((f.y + P[i][1] * ky) * dpr);
        if (px < 1 || py < 1 || px > cw - 2 || py > ch - 2) continue;
        on++;
        var d = x.getImageData(px - 1, py - 1, 3, 3).data, r = 0, gg = 0, b = 0;
        for (var j = 0; j < 9; j++) { r += d[j * 4]; gg += d[j * 4 + 1]; b += d[j * 4 + 2]; }
        if (Math.abs(r / 9 - P[i][2]) < STILL.tol && Math.abs(gg / 9 - P[i][3]) < STILL.tol && Math.abs(b / 9 - P[i][4]) < STILL.tol) n++;
      }
      if (on < 3) return "unread";
      return n >= on - 1 ? "yes" : "no";
    } catch (e) { return "unread"; }
  }

  /* the screen as it is at the clip's end, at this scale: black, the clip's last frame where the clip is (as the phone
     hands it over, or the clip's own last frame), the name on it */
  function snapshot(o, dpr, still) {
    var W = window.innerWidth, H = window.innerHeight;
    var C = canvas2d(W * dpr, H * dpr), c = C.c, x = C.x;
    try {
      var v = o.video, r = v.getBoundingClientRect();
      var vw = v.videoWidth || o.clipW, vh = v.videoHeight || o.clipH, k = Math.min(r.width / vw, r.height / vh);
      var f = { x: r.left + (r.width - vw * k) / 2, y: r.top + (r.height - vh * k) / 2, w: vw * k, h: vh * k };
      var paint = function (src) { x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, f.x * dpr, f.y * dpr, f.w * dpr, f.h * dpr); };
      var checkable = STILL.clip.test(v.currentSrc || v.src || ""), how = still ? "last frame file" : "clip", seen;
      paint(still || v);
      seen = checkable ? looksRight(x, f, dpr) : "unchecked";
      if (seen === "no" && !still) { paint(v); seen = looksRight(x, f, dpr); how = "clip, second try"; }   /* some phones hand it over on the second ask */
      var g = { canvas: c, dpr: dpr, W: W, H: H, P: o.place || { sx: 1, sy: 1, ox: 0, oy: 0 }, snap: how, seen: seen,
                fx: f.x, fy: f.y, kx: f.w / (o.clipW || vw), ky: f.h / (o.clipH || vh), name: null, nameM: null };
      var nc = o.stage && o.stage.querySelector(".coz-book-layer canvas"), layer = nc && nc.parentNode;
      if (nc && nc.width && layer && getComputedStyle(layer).visibility !== "hidden") {   /* the name, where the page drew it */
        var M = window.DOMMatrix || window.WebKitCSSMatrix, tf = getComputedStyle(nc).transform, m = new M(tf && tf !== "none" ? tf : undefined);
        var sr = o.stage.getBoundingClientRect(), s = sr.width / (o.stage.offsetWidth || sr.width);
        g.name = nc; g.nameM = [dpr * s * m.a, dpr * s * m.b, dpr * s * m.c, dpr * s * m.d, dpr * (sr.left + s * m.e), dpr * (sr.top + s * m.f)];
        x.setTransform.apply(x, g.nameM); x.drawImage(nc, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
      }
      /* BT2.5: the clip's Back arrow, as the page draws it (its own path, colour and stroke), so nothing on screen
         changes at the handover; it goes with the page */
      try {
        var bk = document.getElementById("revealBack"), sv = bk && bk.querySelector("svg");
        if (sv) {
          var bcs = getComputedStyle(bk), scs = getComputedStyle(sv), op = parseFloat(bcs.opacity), rb = sv.getBoundingClientRect();
          var vb = String(sv.getAttribute("viewBox") || "0 0 30 20").split(/[\s,]+/).map(Number);
          if (bcs.display !== "none" && bcs.visibility !== "hidden" && scs.visibility !== "hidden" && op > 0 && rb.width > 0 && vb[2] > 0 && vb[3] > 0) {
            var bsx = rb.width / vb[2], bsy = rb.height / vb[3];
            x.save();
            x.globalAlpha = isNaN(op) ? 1 : op;
            x.setTransform(dpr * bsx, 0, 0, dpr * bsy, dpr * (rb.left - vb[0] * bsx), dpr * (rb.top - vb[1] * bsy));
            x.strokeStyle = scs.color; x.fillStyle = "transparent";
            x.lineWidth = parseFloat(sv.getAttribute("stroke-width")) || 1.4;
            x.lineCap = sv.getAttribute("stroke-linecap") || "butt"; x.lineJoin = sv.getAttribute("stroke-linejoin") || "miter";
            [].forEach.call(sv.querySelectorAll("path"), function (pth) { var dd = pth.getAttribute("d"); if (dd) x.stroke(new Path2D(dd)); });
            x.restore();
          }
        }
      } catch (e) {}
      /* book px to screen (css px) */
      g.bx = g.fx + g.kx * g.P.ox; g.by = g.fy + g.ky * g.P.oy; g.bs = g.kx * g.P.sx; g.bt = g.ky * g.P.sy;
      return g;
    } catch (e) { free([c]); throw e; }
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
     the page's own drawing of it, its soft ink edge drawn crisp the way his gold name is. BT2.1: the layer covers only the
     words and the name (css px box), not the whole screen */
  function goldLayer(g) {
    var d = g.dpr, M = g.nameM;
    var x0 = g.bx + g.bs * WORDS.x, y0 = g.by + g.bt * WORDS.y, x1 = x0 + g.bs * WORDS.w, y1 = y0 + g.bt * WORDS.h;
    if (g.name) {
      var nw = g.name.width, nh = g.name.height, cs = [[0, 0], [nw, 0], [0, nh], [nw, nh]];
      for (var q = 0; q < 4; q++) {
        var X = (M[0] * cs[q][0] + M[2] * cs[q][1] + M[4]) / d, Y = (M[1] * cs[q][0] + M[3] * cs[q][1] + M[5]) / d;
        if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      }
    }
    x0 = Math.max(0, Math.floor(x0 - 4)); y0 = Math.max(0, Math.floor(y0 - 4));
    x1 = Math.min(g.W, Math.ceil(x1 + 4)); y1 = Math.min(g.H, Math.ceil(y1 + 4));
    var bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
    var C = canvas2d(bw * d, bh * d), c = C.c, x = C.x;
    c.style.cssText = "position:absolute;left:" + x0 + "px;top:" + y0 + "px;width:" + bw + "px;height:" + bh + "px";
    var home = function () { x.setTransform(1, 0, 0, 1, -x0 * d, -y0 * d); };
    home();
    if (ready(wordsImg)) x.drawImage(wordsImg, (g.bx + g.bs * WORDS.x) * d, (g.by + g.bt * WORDS.y) * d, g.bs * WORDS.w * d, g.bt * WORDS.h * d);
    if (g.name) {
      try {
        var nw2 = g.name.width, nh2 = g.name.height, im = g.name.getContext("2d").getImageData(0, 0, nw2, nh2), p = im.data, i, a;
        for (i = 0; i < nw2 * nh2; i++) {
          a = clamp((p[i * 4 + 3] / 255 - NAME_EDGE[0]) / (NAME_EDGE[1] - NAME_EDGE[0]));
          p[i * 4] = GOLD[0]; p[i * 4 + 1] = GOLD[1]; p[i * 4 + 2] = GOLD[2]; p[i * 4 + 3] = Math.round(255 * a * a * (3 - 2 * a));
        }
        var N = canvas2d(nw2, nh2); N.x.putImageData(im, 0, 0);
        home(); x.transform.apply(x, M); x.drawImage(N.c, 0, 0); home();
        free([N.c]);
      } catch (e) {   /* the name as the page drew it, in gold */
        var K = canvas2d(c.width, c.height), kx = K.x;
        kx.setTransform(1, 0, 0, 1, -x0 * d, -y0 * d); kx.transform.apply(kx, M); kx.drawImage(g.name, 0, 0); kx.setTransform(1, 0, 0, 1, 0, 0);
        kx.globalCompositeOperation = "source-in"; kx.fillStyle = "rgb(" + GOLD.join(",") + ")"; kx.fillRect(0, 0, K.c.width, K.c.height);
        x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(K.c, 0, 0); home();
        free([K.c]);
      }
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
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

  /* BT2.1: every layer of the transition at one scale, made before anything is shown (or nothing is made) */
  function build(o, scale, still) {
    var made = [];
    try {
      var g = snapshot(o, scale, still); made.push(g.canvas);
      var L = { g: g, made: made, scale: scale };
      if (g.seen === "no") return L;                             /* not the clip's last frame: the caller decides */
      L.gold = goldLayer(g); made.push(L.gold);
      var P = canvas2d(g.canvas.width, g.canvas.height); made.push(P.c); L.par = P.c; L.pctx = P.x;
      P.x.drawImage(g.canvas, 0, 0);
      L.ds = scale;                                               /* the dust, at the same scale (his fine specks stay crisp) */
      var D = canvas2d(g.W * L.ds, g.H * L.ds); made.push(D.c); L.dust = D.c; L.dctx = D.x;
      L.ms = Math.min(2, scale);                                  /* the breakup mask */
      var K = canvas2d(g.W * L.ms, g.H * L.ms); made.push(K.c); L.mc = K.c; L.mctx = K.x;
      return L;
    } catch (e) { free(made); throw e; }
  }

  /* land as before, with nothing added */
  function plain(o) {
    try { if (!o.handOff && o.under) o.under(); } catch (e) {}
    try { if (o.done) o.done(); } catch (e) {}
  }

  /* o: { video, stage, clipW, clipH, place (the clip's book geometry, as given to CozBookName), reading ("vedic",
          "tropical" or "compare": his clip it follows), sky (the reading's sky: { el } or { css, maxWidth }), base (its
          night blue), under() (switch the page to the reading underneath, unseen), done(), handOff (Combined) }
     Returns false (nothing done) when the transition cannot run: the caller lands as before. */
  function run(o) {
    if (!o || !o.video || !document.body) return false;
    if (reduced()) { note({ reading: o.reading, ok: false, why: "reduced motion" }); return false; }
    var R = reading(o.reading), top = Math.min(window.devicePixelRatio || 1, 3), scales = [top];
    [2, 1.5, 1].forEach(function (s) { if (s < top) scales.push(s); });
    function attempt(still) {   /* the largest size this phone can give, down to 1x */
      var err = "";
      for (var i = 0; i < scales.length; i++) {
        try {
          var L = build(o, scales[i], still);
          if (L.g.seen !== "no") return L;
          free(L.made);
          if (!still) return null;                                /* the phone's frame was not the clip's last frame */
          err = "the last frame file did not draw at " + scales[i] + "x";
        } catch (e) { err = msg(e) + " (" + scales[i] + "x)"; }
      }
      throw new Error(err || "no canvas");
    }
    var L;
    try { L = attempt(null); } catch (e) { note({ reading: o.reading, ok: false, why: "could not build: " + msg(e) }); return false; }
    if (!L) {   /* the clip's own last frame instead; meanwhile the clip's last frame stays on screen */
      loadStill(function (img) {
        var M = null, why = "the last frame file did not load";
        if (img) { try { M = attempt(img); } catch (e) { why = msg(e); } }
        if (M) { try { start(o, R, M); return; } catch (e) { why = "start: " + msg(e); } }
        note({ reading: o.reading, ok: false, why: "no usable frame: " + why });
        plain(o);
      });
      return true;
    }
    try { start(o, R, L); } catch (e) { note({ reading: o.reading, ok: false, why: "start: " + msg(e) }); free(L.made); return false; }
    return true;
  }

  function start(o, R, L) {
    var g = L.g, lead = R.lead, W = g.W, H = g.H, d = g.dpr, base = o.base || "rgb(1,14,34)";
    var par = L.par, pctx = L.pctx, gold = L.gold, dust = L.dust, dctx = L.dctx, ds = L.ds, mc = L.mc, mctx = L.mctx;
    var ms = L.ms, MW = mc.width, MH = mc.height;
    var sprites = null; try { sprites = dustSprites(); } catch (e) { sprites = null; }   /* made before anything is shown */
    var T = document.createElement("div");
    T.className = "coz-bt"; T.setAttribute("aria-hidden", "true");
    T.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;overflow:hidden;background:transparent;touch-action:none";
    var full = "position:absolute;left:0;top:0;width:100%;height:100%";
    var sky = skyLayer(o.sky), skyReady = false, held = 0, HOLD_MAX = 2000;
    try { skyPictures(o.sky).then(function () { skyReady = true; }); } catch (e) { skyReady = true; }
    dust.style.cssText = full; par.style.cssText = full;          /* the gold layer has its own box */
    T.appendChild(sky); T.appendChild(dust); T.appendChild(gold); T.appendChild(par);   /* the page lies over the rest */
    T.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });   /* the page under it stays still */
    /* BT2.5: the handover: at first only the copy of the page, see-through around it, over the clip's own last frame */
    sky.style.visibility = dust.style.visibility = gold.style.visibility = "hidden";
    document.body.appendChild(T);
    var settled = false, since = performance.now();
    function settle() {   /* the copy has been on screen for a few frames: the rest comes on under it, the reading underneath */
      if (settled) return; settled = true;
      T.style.background = base;
      sky.style.visibility = dust.style.visibility = gold.style.visibility = "";
      if (!o.handOff) { try { if (o.under) o.under(); } catch (e) {} }   /* BT2.2: no sound: the quiet holds */
    }
    var settleTimer = setTimeout(settle, 500);                    /* in any case */

    /* the breakup: each mask pixel's moment from his pattern (around the book, his pattern carries on mirrored) */
    var md = null, px = null, tm = null, lut = new Uint32Array(256);
    var LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    function prepare() {
      if (tm || !ready(mapImg)) return;
      var c = null;
      try {
        var C = canvas2d(MW, MH, { willReadFrequently: true }), x = C.x, img = mapImg; c = C.c;
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
      free([c]);                                                  /* BT2.1: its memory back at once */
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
    var plan = null, lo = 0, maxLife = Math.max(SPECKS.life[1], SPECKS.glintLife[1]);
    function timeAt(bx, by, rnd) {   /* the moment the page goes at this book px */
      if (tm) {
        var mx = Math.round(ms * (g.bx + g.bs * bx)), my = Math.round(ms * (g.by + g.bt * by));
        if (mx >= 0 && my >= 0 && mx < MW && my < MH) return MAP.t0 + tm[my * MW + mx] * (MAP.t1 - MAP.t0) / 255;
      }
      return FADE[0] + rnd() * (FADE[1] - FADE[0]);
    }
    function drawDust(t) {
      dctx.clearRect(0, 0, dust.width, dust.height);
      if (!plan || !sprites) return;
      while (lo < plan.length && plan[lo].b + maxLife < t) lo++;
      for (var i = lo; i < plan.length && plan[i].b <= t; i++) {
        var p = plan[i], age = t - p.b; if (age > p.l) continue;
        var u = age / p.l, s = age / 1000, rr = p.r * g.bs * ds * 1.6;
        var X = (g.bx + g.bs * (p.x + p.vx * s)) * ds, Y = (g.by + g.bt * (p.y + p.vy * s)) * ds;
        dctx.globalAlpha = p.a * smooth(u / 0.15) * (1 - smooth((u - 0.6) / 0.4)) * (0.7 + 0.3 * Math.sin(p.f * age + p.ph));
        dctx.drawImage(sprites[p.s], X - rr, Y - rr, 2 * rr, 2 * rr);
      }
      dctx.globalAlpha = 1;
    }

    var t0 = now(), over = false, stopped = false, broken = false, mode = null, frames = 0;
    var limit = (o.handOff ? HAND : EMERGE[1]) + lead + 4000;   /* on the transition's own clock */
    var safety = setInterval(function () { if (now() - t0 > limit) bail("the screen stopped drawing"); }, 1000);
    function finish(why) {
      if (over) return; over = true; clearInterval(safety); clearTimeout(settleTimer); settle();
      note({ reading: o.reading, ok: !why, why: why || "ran", scale: d, frame: g.snap, check: g.seen, mode: mode || "-",
             frames: frames, ms: Math.round(now() - t0) });
      if (o.handOff) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch (e) {}
        try { if (o.done) o.done(); } catch (e) {}   /* navigates; the sky stays until the next page is up */
        return;
      }
      try { T.remove(); } catch (e) {}
      free([par, gold, dust, mc, g.canvas]);                      /* their memory back at once */
      try { if (o.done) o.done(); } catch (e) {}
    }
    function bail(why) {   /* BT2.1: something failed once started: the layer fades onto the reading, never stays on screen */
      if (over || stopped) return; stopped = true;
      settle();
      if (o.handOff) { finish(why); return; }
      try { T.style.transition = "opacity 450ms ease"; T.style.opacity = "0"; T.style.pointerEvents = "none"; } catch (e) {}
      setTimeout(function () { finish(why); }, 480);
    }
    function frame() {
      if (over || stopped) return;
      try {
        var t = now() - t0 - lead;   /* his Vedic clip's time */
        if (!settled && ((frames >= 4 && performance.now() - since >= 150) || t >= MAP.t0 - BAND / 2 - 200)) settle();   /* BT2.5 */
        if (!skyReady && held < HOLD_MAX) {   /* BT2.4: the name holds until the sky is ready (2 s longer at most) */
          var edge = MAP.t0 - BAND / 2 - 30;
          if (t > edge) { var extra = Math.min(t - edge, HOLD_MAX - held); t0 += extra; held += extra; t -= extra; }
        }
        if (!tm && t > 60 - lead) {
          prepare();
          if (tm && !plan && !mode) {   /* BT2.3: during the hold, not when the breakup starts: the dust plan, and the breakup's
                                           first draw (at full opacity: the page looks the same) */
            plan = dustPlan(20261028, timeAt);
            try { breakup(0); } catch (e) {}
          }
        }
        if (!broken) {
          if (!mode && t >= MAP.t0 - BAND / 2) { mode = tm ? "map" : "fade"; if (!plan) plan = dustPlan(20261028, timeAt); }
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
      } catch (e) { bail("while running: " + msg(e)); return; }
      frames++;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Combined: combined-reading.html's words and pictures come up over its own sky, the sky the dashboard handed over
     on. Called at the very start of <body>, so they are never seen before. */
  /* BT2.2: Combined: the dashboard leaves the music to this page (sessionStorage "cozBedBack"); it comes back once the
     words and pictures are up */
  function takeMusic() {
    var m = null;
    try { m = JSON.parse(sessionStorage.getItem(BED) || "null"); sessionStorage.removeItem(BED); } catch (e) {}
    return !!(m && Date.now() - m.at < 20000);
  }
  function arrive() {
    var music = takeMusic(), back = false;
    function bed() { if (music && !back) { back = true; musicBack(); } }
    var h = null;
    try { h = JSON.parse(sessionStorage.getItem(KEY) || "null"); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!h || !(Date.now() - h.at < 15000) || reduced()) {
      if (music) {   /* the page shows as it loads: the music once it is up */
        var up = function () { setTimeout(bed, 600); };
        if (document.readyState === "complete") up(); else window.addEventListener("load", up, { once: true });
        setTimeout(bed, 4000);
      }
      return false;
    }
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
        if (e < 1) requestAnimationFrame(frame); else bed();       /* BT2.2: the words are up: the music comes back */
      })();
      els.forEach(function (el) { el.style.opacity = "0"; });
    }
    var ready = function () { try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go); } catch (e) { go(); } };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true }); else ready();
    setTimeout(go, 1500);
    if (music) setTimeout(bed, 1500 + ARRIVE + 2500);             /* if the screen is not drawing (a phone in the background) */
    return true;
  }

  /* the read-aloud voice stops the transition sound too (VO1.4: all background sound stops at play). BT2.2: there is no
     transition sound any more; kept so a page that calls it is unaffected */
  function quiet() { try { var a = host().__cozBTSound; if (a && !a.paused) a.pause(); } catch (e) {} }

  load();
  window.CozBookToReading = { run: run, arrive: arrive, prime: prime, quiet: quiet, note: note, musicBack: musicBack,
    times: { map: [MAP.t0, MAP.t1], band: BAND, goldOut: GOLD_OUT, dustOut: DUST_OUT, emerge: EMERGE, hand: HAND, arrive: ARRIVE,
             leads: { vedic: READINGS.vedic.lead, tropical: READINGS.tropical.lead, compare: READINGS.compare.lead } } };
})();
