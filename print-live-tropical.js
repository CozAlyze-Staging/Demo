/* PRINT YOUR CHART · PL1 · Tropical (Oct 27 2026, his approval of preview PP1, staging only)
   The Tropical birth chart page offers its readings ready to open, expand and print without tapping Save
   (Your Readings), and Print Your Chart opens Your Tropical Reading with Expand All and Print / Save PDF at the top,
   the way a saved chart's reading opens.
   This file builds an UNSAVED record, in memory only, for the Tropical chart now on this device, under the id
   "live", from the places a save copies from: CozSaved._snapshotFor(runId) (this run's cozTropicalReading and
   chart) and the Ascendant saved-tropical-library.js captured for this run ("cozTropicalAscendantCapture"), taken
   with the same checks a save makes. The saved documents' loader (CozSavedTropical.load) reads it through
   CozSaved.get("live"). Nothing is written to Saved Charts. Current Transits are calculated when that page opens,
   as they are for a saved chart. No model call. A reopened saved chart is not "live": it opens its own saved record.
   Tropical pages only (tropical-birth-chart.html, saved-tropical-document.html); Vedic and Compare have their own. */
(function () {
  if (window.CozPrintLive || !window.CozSaved) return;
  var LIVE = "live", DOC = "saved-tropical-document.html";
  var SECTIONS = [                                            /* saved-tropical-library.js SECTIONS, for pages without it */
    { id: "at-your-core", number: 1, title: "At Your Core" }, { id: "love-desire-creativity", number: 2, title: "Love, Desire & Creativity" },
    { id: "work-money-expression", number: 3, title: "Work, Money & Expression" }, { id: "wisdom-purpose-legacy", number: 4, title: "Wisdom, Purpose & Legacy" },
    { id: "challenges-resilience", number: 5, title: "Challenges & Resilience" }, { id: "essential-takeaway", number: 6, title: "Your Essential Takeaway" }
  ];
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function parse(s){ try { return typeof s === "string" ? JSON.parse(s) : (s || null); } catch (e) { return null; } }
  function runMatches(run, rec){                                            /* saved-tropical-library.js runMatches */
    if (!run || !rec || !rec.runId || run.runId !== rec.runId) return false;
    if (run.fingerprint && rec.fingerprint && run.fingerprint !== rec.fingerprint) return false;
    return true;
  }

  /* the chart run now on this device, or null (none, or a reopened saved chart) */
  function liveBirth(){
    var bd = parse(ls("emergeBirthData"));
    if (!bd || !bd.runId || !bd.fingerprint) return null;
    if (window.CozSaved.isRestoredRun && window.CozSaved.isRestoredRun()) return null;
    return bd;
  }
  /* a reopened saved chart: its own saved Tropical record (by run ID) */
  function savedRecord(){
    var bd = parse(ls("emergeBirthData")), s = parse(ls(window.CozSaved.STORE || "cozSavedCharts")), out = null;
    if (!bd || !bd.runId || !s || !Array.isArray(s.records)) return null;
    s.records.forEach(function (r) { if (!out && r && r.runId === bd.runId && r.kind === "chart" && r.systems && r.systems.tropical) out = r; });
    return out;
  }

  /* ---- the unsaved record ---- */
  function build(){
    var bd = liveBirth(); if (!bd || !window.CozSaved._snapshotFor) return null;
    var snap = window.CozSaved._snapshotFor(bd.runId);
    var rec = { id: LIVE, live: true, kind: "chart", runId: bd.runId, fingerprint: bd.fingerprint, name: bd.name || "", birthDate: bd.birthDate || "",
                systems: { tropical: true }, savedAt: null, updatedAt: null, snapshot: snap, library: { tropical: {} } };
    var lib = rec.library.tropical;
    /* the reading: this run's own, every section present (as saved-tropical-library.js captureReading takes it) */
    var src = parse(snap.cozTropicalReading);
    if (src && src.fixture !== true && src.sample !== true && runMatches(src.run, rec)) {
      var map = src;
      if (Array.isArray(src.sections)) { map = {}; src.sections.forEach(function (s) { if (s && s.id && Array.isArray(s.body)) map[s.id] = s.body; }); }
      var order = ((window.CozSavedTropical && window.CozSavedTropical.SECTIONS) || SECTIONS).map(function (s) { return { id: s.id, number: s.number, title: s.title }; });
      var sections = {}, complete = order.length > 0;
      order.forEach(function (s) {
        var p = Array.isArray(map[s.id]) ? map[s.id].filter(function (x) { return typeof x === "string" && x.trim(); }) : [];
        if (!p.length) complete = false; sections[s.id] = p;
      });
      if (complete) lib.reading = { order: order, sections: sections };
    }
    /* the Ascendant composed for this run on the reading page, when this run's chart is here (captureAscendant, TL1.1) */
    var chart = parse(snap.cozTropicalChartJSON);
    if (chart && Array.isArray(chart.bodies) && chart.angles && chart.angles.ascendant && runMatches(chart.run, rec)) {
      var asc = parse(ls("cozTropicalAscendantCapture"));
      if (asc && asc.run && asc.run.runId === rec.runId && asc.run.fingerprint === rec.fingerprint && asc.capture && asc.capture.sign) lib.ascendant = asc.capture;
    }
    return rec;
  }
  var memo = null;
  function record(){ if (memo) return memo; try { memo = build(); } catch (e) { memo = null; } return memo; }
  /* the saved documents read records through CozSaved.get(id): "live" is this unsaved record */
  var realGet = window.CozSaved.get;
  window.CozSaved.get = function (id) { return id === LIVE ? record() : realGet.apply(this, arguments); };

  /* ---- for the birth chart page ---- */
  function target(view){
    if (!liveBirth()) { var rec = savedRecord(); if (rec) return DOC + "?view=" + view + "&id=" + encodeURIComponent(rec.id); }
    return DOC + "?view=" + view + "&id=" + LIVE;
  }
  /* which readings are ready to open (saved: a reopened saved chart's own record) */
  function available(){
    var L = {}, chart = null, saved = false;
    if (liveBirth()) { var r = record(); L = (r && r.library.tropical) || {}; chart = r ? parse(r.snapshot.cozTropicalChartJSON) : null; }
    else { var s = savedRecord(); if (s) { saved = true; L = (s.library && s.library.tropical) || {}; chart = s.snapshot ? parse(s.snapshot.cozTropicalChartJSON) : null; } }
    return { saved: saved, reading: !!(L.reading && L.reading.sections), ascendant: !!(L.ascendant && L.ascendant.sign), transits: !!(chart && chart.run) };
  }

  window.CozPrintLive = { sys: "tropical", LIVE: LIVE, record: record, target: target, available: available };
})();
