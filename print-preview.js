/* PRINT YOUR CHART · PREVIEW PP1 (Oct 27 2026, staging only, standalone, linked from no page).
   His request (Oct 27): the birth chart page at the end of each reading (Vedic, Tropical, Combined) offers the
   readings ready to open, expand and print without tapping Save first, and a Print Your Chart button in the
   middle of the bottom row (Save Chart · Print Your Chart · Add-ons) that opens the full reading with Expand All
   and Print / Save PDF at the top, exactly as a saved chart's reading opens. Preview first, then into the system.

   How: the saved documents already render from one record (CozSaved.get(id)). This file builds an UNSAVED record
   for the chart run now on this device, in memory only, under the id "live", from the same places a save copies
   from (CozSaved._snapshotFor(runId) and each library's own per-run capture), and lets the document pages'
   existing loaders read it. Nothing is written to Saved Charts. Nothing is calculated except what a saved page
   already calculates when it opens (Tropical transits, and here Compare's Current Timing and the Vedic Life Cycle
   text, both made the same way a save makes them). No model call. A reopened saved chart is not "live": it has
   its own saved record, so it opens its saved documents.
   Every piece must carry this run's run ID and fingerprint, as on a save. */
(function () {
  if (window.CozPrintPreview || !window.CozSaved) return;
  var LIVE = "live", SS = "cozPrintPreviewCache";
  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function parse(s){ try { return typeof s === "string" ? JSON.parse(s) : (s || null); } catch (e) { return null; } }
  function same(run, rec){ return !!(run && rec && run.runId && run.fingerprint && run.runId === rec.runId && run.fingerprint === rec.fingerprint); }
  /* which reading: ?sys= on the preview's chart page, otherwise the document page's own name */
  function sys(){
    var q = null; try { q = new URLSearchParams(location.search).get("sys"); } catch (e) {}
    if (q === "vedic" || q === "tropical" || q === "compare") return q;
    var p = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    return /compare/.test(p) ? "compare" : /tropical/.test(p) ? "tropical" : "vedic";
  }

  /* the chart run now on this device, or null (none, or a reopened saved chart) */
  function liveBirth(){
    var bd = parse(ls("emergeBirthData"));
    if (!bd || !bd.runId || !bd.fingerprint) return null;
    if (window.CozSaved.isRestoredRun && window.CozSaved.isRestoredRun()) return null;
    return bd;
  }

  /* results made on this page visit (Life Cycle text, Compare timing), kept for the tab so a reload shows them */
  function cacheGet(name, rec){
    try { var c = JSON.parse(sessionStorage.getItem(SS) || "{}"), v = c[name]; return v && v.runId === rec.runId && v.fingerprint === rec.fingerprint ? v : null; } catch (e) { return null; }
  }
  function cachePut(name, v){
    try { var c = JSON.parse(sessionStorage.getItem(SS) || "{}"); c[name] = v; sessionStorage.setItem(SS, JSON.stringify(c)); return true; } catch (e) { return false; }
  }

  /* ---- Vedic: the reading and Lagna this device captured for this run (saved-vedic-library.js), the Life Cycle data ---- */
  function ascSign(chart){
    var a = chart && Array.isArray(chart.planets) ? chart.planets.filter(function (p) { return p && p.name === "Ascendant"; })[0] : null;
    var n = a ? a.signNumber : chart && chart.ascendantSignNumber;
    return (n >= 1 && n <= 12) ? SIGNS[n - 1] : null;
  }
  function readingOk(c){ return !!(c && c.sections && Array.isArray(c.order) && c.order.length &&
    c.order.every(function (s) { return s && Array.isArray(c.sections[s.id]) && c.sections[s.id].length > 0; })); }
  function vedicLib(rec){
    var lib = {}, chart = parse(rec.snapshot.cozChartJSON);
    if (!chart || !same(chart.run, rec)) return lib;
    var cap = parse(ls("cozVedicSavedCapture")), e = cap && cap.runs && cap.runs[rec.runId];
    if (e && same(e.run, rec)) {
      if (readingOk(e.reading) && same(e.reading.run, rec)) lib.reading = e.reading;
      if (e.lagna && e.lagna.sign && same(e.lagna.run, rec) && e.lagna.sign === ascSign(chart)) lib.lagna = e.lagna;
    }
    if (chart.lifeCycle && chart.lifeCycle.mahadasha) {
      var t = cacheGet("lifeCycleText", rec);
      lib.lifeCycle = { data: chart.lifeCycle, text: t || { status: "pending", runId: rec.runId, fingerprint: rec.fingerprint, requestedAt: new Date().toISOString() } };
    }
    return lib;
  }
  /* the full Life Cycle text, made exactly as a save makes it (SL1.7): the three live pages in hidden frames */
  var LC_PAGES = [
    { id: "current-season",   title: "Your Current Season", panel: "csPanel",  empty: ".cs-empty"  },
    { id: "key-time-windows", title: "Key Time Windows",    panel: "ktwPanel", empty: ".ktw-empty" },
    { id: "what-comes-next",  title: "What Comes Next",     panel: "wcnPanel", empty: ".wcn-empty" }
  ];
  function blocksOf(panel){
    var out = [];
    Array.prototype.forEach.call(panel.querySelectorAll("p, h1, h2, h3"), function (n) {
      if (n.closest(".cs-explore, .ktw-explore, .wcn-explore, nav, [aria-hidden='true']")) return;
      var c = n.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll("br"), function (b) { b.parentNode.replaceChild(document.createTextNode(" "), b); });
      var t = (c.textContent || "").replace(/\s+/g, " ").trim();
      if (t) out.push({ k: String(n.className || n.tagName.toLowerCase()).split(" ")[0], t: t });
    });
    return out;
  }
  function renderPage(pg){
    return new Promise(function (resolve) {
      var f = document.createElement("iframe"), t0 = Date.now(), timer = null, done = false;
      f.setAttribute("aria-hidden", "true"); f.tabIndex = -1;
      f.style.cssText = "position:fixed;left:-10000px;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none";
      function finish(r){ if (done) return; done = true; clearInterval(timer); try { f.remove(); } catch (e) {} resolve(r); }
      timer = setInterval(function () {
        var d = null; try { d = f.contentDocument; } catch (e) {}
        var panel = d && d.getElementById(pg.panel);
        if (panel && panel.querySelector(pg.empty)) return finish({ failed: true });
        if (panel && panel.querySelector("h1") && panel.querySelector("p")) return finish({ blocks: blocksOf(panel) });
        if (Date.now() - t0 > 15000) finish({ timeout: true });
      }, 200);
      f.src = pg.id + ".html?in=compare&lcCapture=1&t=" + Date.now();
      document.body.appendChild(f);
    });
  }
  var lcBusy = false;
  function makeLifeCycleText(rec){
    if (lcBusy) return; lcBusy = true;
    var results = [];
    LC_PAGES.reduce(function (p, pg) { return p.then(function () { return renderPage(pg).then(function (r) { results.push(r); }); }); }, Promise.resolve())
      .then(function () {
        var b = liveBirth();
        if (!b || b.runId !== rec.runId || b.fingerprint !== rec.fingerprint) return;   /* the chart changed meanwhile */
        var now = new Date().toISOString(), t;
        if (results.some(function (x) { return x.failed; })) t = { status: "unavailable", runId: rec.runId, fingerprint: rec.fingerprint, at: now };
        else if (results.some(function (x) { return x.timeout || !x.blocks || !x.blocks.length; })) t = { status: "unavailable", runId: rec.runId, fingerprint: rec.fingerprint, at: now };
        else t = { status: "complete", runId: rec.runId, fingerprint: rec.fingerprint, capturedAt: now,
                   pages: LC_PAGES.map(function (pg, i) { return { id: pg.id, title: pg.title, blocks: results[i].blocks }; }) };
        cachePut("lifeCycleText", t);
        try { window.dispatchEvent(new CustomEvent("COZ_SAVED_VEDIC_LC_FILLED", { detail: { ids: [LIVE] } })); } catch (e) {}
      })
      .then(function () { lcBusy = false; }, function () { lcBusy = false; });
  }

  /* ---- Tropical: this run's reading (cozTropicalReading) and the Ascendant captured for this run ---- */
  var TROPICAL_SECTIONS = [                                   /* saved-tropical-library.js SECTIONS, for pages without it */
    { id: "at-your-core", number: 1, title: "At Your Core" }, { id: "love-desire-creativity", number: 2, title: "Love, Desire & Creativity" },
    { id: "work-money-expression", number: 3, title: "Work, Money & Expression" }, { id: "wisdom-purpose-legacy", number: 4, title: "Wisdom, Purpose & Legacy" },
    { id: "challenges-resilience", number: 5, title: "Challenges & Resilience" }, { id: "essential-takeaway", number: 6, title: "Your Essential Takeaway" }
  ];
  function tropicalLib(rec){
    var lib = {}, chart = parse(rec.snapshot.cozTropicalChartJSON);
    if (!chart || !same(chart.run, rec)) return lib;
    var src = parse(rec.snapshot.cozTropicalReading);
    if (src && src.fixture !== true && src.sample !== true && src.run && src.run.runId === rec.runId &&
        (!src.run.fingerprint || src.run.fingerprint === rec.fingerprint)) {
      var map = Array.isArray(src.sections) ? (function () { var m = {}; src.sections.forEach(function (s) { if (s && s.id && Array.isArray(s.body)) m[s.id] = s.body; }); return m; })() : src;
      var order = ((window.CozSavedTropical && window.CozSavedTropical.SECTIONS) || TROPICAL_SECTIONS).map(function (s) { return { id: s.id, number: s.number, title: s.title }; });
      var sections = {}, complete = order.length > 0;
      order.forEach(function (s) {
        var p = Array.isArray(map[s.id]) ? map[s.id].filter(function (x) { return typeof x === "string" && x.trim(); }) : [];
        if (!p.length) complete = false; sections[s.id] = p;
      });
      if (complete) lib.reading = { order: order, sections: sections };
    }
    var asc = parse(ls("cozTropicalAscendantCapture"));
    if (asc && same(asc.run, rec) && asc.capture && asc.capture.sign) lib.ascendant = asc.capture;
    return lib;
  }

  /* ---- Compare: the readings are in this run's own keys; Current Timing is made fresh, as a save makes it ---- */
  function compareLib(rec){
    var t = cacheGet("compareTiming", rec);
    return t && t.timing ? { timing: t.timing } : {};
  }
  var timingBusy = null;
  function makeCompareTiming(rec){
    if (timingBusy) return timingBusy;
    if (!window.CozSavedCompare || !window.CozSavedCompare.prepareSave) return Promise.resolve(false);
    timingBusy = window.CozSavedCompare.prepareSave({ runId: rec.runId, fingerprint: rec.fingerprint }).then(function (r) {
      try { window.CozSavedCompare.discard(); } catch (e) {}                 /* never consumed by a save */
      if (r && r.ok && r.timing && same(r.timing, rec)) { cachePut("compareTiming", { runId: rec.runId, fingerprint: rec.fingerprint, timing: r.timing }); return true; }
      return false;
    }, function () { return false; });
    return timingBusy;
  }

  /* ---- the unsaved record ---- */
  var memo = null;
  function liveRecord(){
    if (memo) return memo;
    var bd = liveBirth(); if (!bd) return null;
    var s = sys(), snap = window.CozSaved._snapshotFor ? window.CozSaved._snapshotFor(bd.runId) : null;
    if (!snap) return null;
    var now = new Date().toISOString();
    var rec = { id: LIVE, live: true, kind: s === "compare" ? "compare" : "chart", runId: bd.runId, fingerprint: bd.fingerprint,
                name: bd.name || "", birthDate: bd.birthDate || "", systems: {}, savedAt: null, updatedAt: null, openedAt: now, snapshot: snap, library: {} };
    if (s === "vedic") { rec.systems.vedic = true; rec.library.vedic = vedicLib(rec); }
    else if (s === "tropical") { rec.systems.tropical = true; rec.library.tropical = tropicalLib(rec); }
    else rec.library.compare = compareLib(rec);
    memo = rec;
    return rec;
  }
  /* the document pages' loaders read records through CozSaved.get(id): "live" is the unsaved record */
  var realGet = window.CozSaved.get;
  window.CozSaved.get = function (id) { return id === LIVE ? liveRecord() : realGet.apply(this, arguments); };

  /* what each page can show for the live chart (the chart page's Your Readings links use it) */
  function available(){
    var rec = liveRecord(); if (!rec) return null;
    var s = sys();
    if (s === "vedic") { var v = rec.library.vedic || {}; return { reading: !!v.reading, lagna: !!v.lagna, lifeCycle: !!v.lifeCycle }; }
    if (s === "tropical") { var t = rec.library.tropical || {}; return { reading: !!t.reading, ascendant: !!t.ascendant, transits: !!parse(rec.snapshot.cozTropicalChartJSON) }; }
    return { combined: true, ascendants: true, timing: true, charts: true };
  }

  window.CozPrintPreview = { LIVE: LIVE, record: liveRecord, available: available, liveBirth: liveBirth,
    makeLifeCycleText: function () { var r = liveRecord(); if (r) makeLifeCycleText(r); },
    makeCompareTiming: function () { var r = liveRecord(); return r ? makeCompareTiming(r) : Promise.resolve(false); } };
})();
