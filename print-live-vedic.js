/* PRINT YOUR CHART · PL1 · Vedic (Oct 27 2026, his approval of preview PP1, staging only)
   The Vedic birth chart page offers its readings ready to open, expand and print without tapping Save
   (Your Readings), and Print Your Chart opens Your Vedic Reading with Expand All and Print / Save PDF at the top,
   the way a saved chart's reading opens.
   This file builds an UNSAVED record, in memory only, for the Vedic chart now on this device, under the id "live",
   from the places a save copies from: CozSaved._snapshotFor(runId) and saved-vedic-library.js's own per-run capture
   ("cozVedicSavedCapture"), taken with the same checks a save makes (run ID AND fingerprint on every piece, the
   reading's verified version, the Lagna's sign against this run's chart). The saved documents' loader
   (CozSavedVedic.load) reads it through CozSaved.get("live"). Nothing is written to Saved Charts.
   The full Life Cycle text is made the way a save makes it (SL1.7: the three live pages in hidden frames) when that
   page asks, and kept for this tab only (sessionStorage). No model call. A reopened saved chart is not "live": it
   opens its own saved record.
   Vedic pages only (vedic-birth-chart.html, saved-vedic-document.html); Tropical and Compare have their own files. */
(function () {
  if (window.CozPrintLive || !window.CozSaved) return;
  var LIVE = "live", SS = "cozPrintLiveVedic", DOC = "saved-vedic-document.html", RETRY_MS = 120000;
  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function parse(s){ try { return typeof s === "string" ? JSON.parse(s) : (s || null); } catch (e) { return null; } }
  function same(run, rec){ return !!(run && rec && run.runId && run.fingerprint && run.runId === rec.runId && run.fingerprint === rec.fingerprint); }
  function runMatches(run, rec){                                            /* saved-vedic-library.js runMatches (Life Cycle) */
    if (!run || !rec || !rec.runId || run.runId !== rec.runId) return false;
    if (run.fingerprint && rec.fingerprint && run.fingerprint !== rec.fingerprint) return false;
    return true;
  }
  function ascSign(chart){
    var a = chart && Array.isArray(chart.planets) ? chart.planets.filter(function (p) { return p && p.name === "Ascendant"; })[0] : null;
    var n = a ? a.signNumber : chart && chart.ascendantSignNumber;
    return (n >= 1 && n <= 12) ? SIGNS[n - 1] : null;
  }
  function readingOk(c){ return !!(c && c.sections && Array.isArray(c.order) && c.order.length &&
    c.order.every(function (s) { return s && Array.isArray(c.sections[s.id]) && c.sections[s.id].length > 0; })); }
  /* the reading's version, checked exactly as a save checks it (saved-vedic-library.js SL1.5 versionOk) */
  function hash(s){ var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return (h >>> 0).toString(36); }
  function s12Of(r){ return r ? hash(JSON.stringify([r["essential-nature"] || [], r["mind-intuition"] || []])) : null; }
  function versionOk(cap, rec){
    var v = cap && cap.version;
    if (!v || v.verified !== true || v.runId !== rec.runId || v.fingerprint !== rec.fingerprint) return false;
    if (!readingOk(cap)) return false;
    var r = {}; r["essential-nature"] = cap.sections["essential-nature"]; r["mind-intuition"] = cap.sections["mind-intuition"];
    if (s12Of(r) !== v.s12) return false;
    if (v.path === "server") return !!v.job;
    if (v.path === "browser") return !!v.draft;
    if (v.path === "reviewed") return !!(v.label && v.identityKey);
    return false;
  }

  /* the chart run now on this device, or null (none, or a reopened saved chart) */
  function liveBirth(){
    var bd = parse(ls("emergeBirthData"));
    if (!bd || !bd.runId || !bd.fingerprint) return null;
    if (window.CozSaved.isRestoredRun && window.CozSaved.isRestoredRun()) return null;
    return bd;
  }
  /* a reopened saved chart: its own saved Vedic record (by run ID) */
  function savedRecord(){
    var bd = parse(ls("emergeBirthData")), s = parse(ls(window.CozSaved.STORE || "cozSavedCharts")), out = null;
    if (!bd || !bd.runId || !s || !Array.isArray(s.records)) return null;
    s.records.forEach(function (r) { if (!out && r && r.runId === bd.runId && r.kind === "chart" && r.systems && r.systems.vedic) out = r; });
    return out;
  }
  /* the full Life Cycle text made on this tab; a text that couldn't be made is tried again after a couple of minutes */
  function cacheGet(rec){
    try {
      var v = JSON.parse(sessionStorage.getItem(SS) || "null");
      if (!v || v.runId !== rec.runId || v.fingerprint !== rec.fingerprint) return null;
      if (v.status === "unavailable" && !(Date.now() - Date.parse(v.at) < RETRY_MS)) return null;
      return v;
    } catch (e) { return null; }
  }
  function cachePut(v){ try { var s = JSON.stringify(v); sessionStorage.setItem(SS, s); return sessionStorage.getItem(SS) === s; } catch (e) { return false; } }

  /* ---- the unsaved record ---- */
  function build(){
    var bd = liveBirth(); if (!bd || !window.CozSaved._snapshotFor) return null;
    var snap = window.CozSaved._snapshotFor(bd.runId);
    var rec = { id: LIVE, live: true, kind: "chart", runId: bd.runId, fingerprint: bd.fingerprint, name: bd.name || "", birthDate: bd.birthDate || "",
                systems: { vedic: true }, savedAt: null, updatedAt: null, snapshot: snap, library: { vedic: {} } };
    var lib = rec.library.vedic, chart = parse(snap.cozChartJSON);
    if (chart && !Array.isArray(chart.planets)) chart = null;
    /* the reading and the Lagna this device captured for this run, as a save takes them (SL1.5 payload) */
    var cap = parse(ls("cozVedicSavedCapture")), e = cap && cap.runs && cap.runs[rec.runId];
    if (e && same(e.run, rec)) {
      if (readingOk(e.reading) && same(e.reading.run, rec) && versionOk(e.reading, rec)) lib.reading = e.reading;
      if (e.lagna && e.lagna.sign && same(e.lagna.run, rec) && chart && same(chart.run, rec) && e.lagna.sign === ascSign(chart)) lib.lagna = e.lagna;
    }
    /* the Life Cycle of this run's chart (captureLifeCycle), and its full text once this tab has made it */
    if (chart && runMatches(chart.run, rec) && chart.lifeCycle && chart.lifeCycle.mahadasha)
      lib.lifeCycle = { data: chart.lifeCycle, text: cacheGet(rec) || { status: "pending", runId: rec.runId, fingerprint: rec.fingerprint, requestedAt: new Date().toISOString() } };
    return rec;
  }
  var memo = null;
  function record(){ if (memo) return memo; try { memo = build(); } catch (e) { memo = null; } return memo; }
  /* the saved documents read records through CozSaved.get(id): "live" is this unsaved record */
  var realGet = window.CozSaved.get;
  window.CozSaved.get = function (id) { return id === LIVE ? record() : realGet.apply(this, arguments); };

  /* ---- the full Life Cycle text, made as a save makes it (saved-vedic-library.js SL1.7) ---- */
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
  /* resolves true once the text (or "it couldn't be made") is kept for this tab; false if it couldn't be kept */
  var lcBusy = null;
  function makeLifeCycleText(){
    var rec = record(); if (!rec || !rec.library.vedic.lifeCycle) return Promise.resolve(false);
    if (lcBusy) return lcBusy;
    var results = [];
    lcBusy = LC_PAGES.reduce(function (p, pg) { return p.then(function () { return renderPage(pg).then(function (r) { results.push(r); }); }); }, Promise.resolve())
      .then(function () {
        var b = liveBirth();
        if (!b || b.runId !== rec.runId || b.fingerprint !== rec.fingerprint) return false;            /* the chart changed meanwhile */
        var now = new Date().toISOString(), t;
        if (results.some(function (x) { return x.failed || x.timeout || !x.blocks || !x.blocks.length; }))
          t = { status: "unavailable", runId: rec.runId, fingerprint: rec.fingerprint, at: now };
        else t = { status: "complete", runId: rec.runId, fingerprint: rec.fingerprint, capturedAt: now,
                   pages: LC_PAGES.map(function (pg, i) { return { id: pg.id, title: pg.title, blocks: results[i].blocks }; }) };
        return cachePut(t);
      })
      .then(function (kept) { lcBusy = null; return kept; }, function () { lcBusy = null; return false; });
    return lcBusy;
  }

  /* ---- for the birth chart page ---- */
  /* where a reading opens: the unsaved chart on this device, or a reopened saved chart's own saved record */
  function target(view){
    if (!liveBirth()) { var rec = savedRecord(); if (rec) return DOC + "?view=" + view + "&id=" + encodeURIComponent(rec.id); }
    return DOC + "?view=" + view + "&id=" + LIVE;
  }
  /* which readings are ready to open (saved: a reopened saved chart's own record) */
  function available(){
    var L = {}, saved = false;
    if (liveBirth()) { var r = record(); L = (r && r.library.vedic) || {}; }
    else { var s = savedRecord(); if (s) { saved = true; L = (s.library && s.library.vedic) || {}; } }
    return { saved: saved, reading: !!(L.reading && L.reading.sections), lagna: !!(L.lagna && L.lagna.sign), lifeCycle: !!(L.lifeCycle && L.lifeCycle.data) };
  }

  window.CozPrintLive = { sys: "vedic", LIVE: LIVE, record: record, target: target, available: available, makeLifeCycleText: makeLifeCycleText };
})();
