/* PRINT YOUR CHART · PL1 · Compare (Oct 27 2026, his approval of preview PP1, staging only)
   Compare's Your Birth Charts page has Print Your Chart in the middle of its bottom row; it opens Your Combined
   Reading with Expand All and Print / Save PDF at the top, the way a saved comparison opens, without tapping Save.
   This file builds an UNSAVED Compare record, in memory only, for the chart now on this device, under the id "live",
   from the places a save copies from: CozSaved._snapshotFor(runId) (this run's Combined Reading, Ascendant readings
   and both charts). Current Timing is calculated the way a save calculates it (saved-compare-library.js
   prepareSave: fresh, for this run ID + fingerprint), dated "As of" that moment and kept for this tab only, for up
   to an hour. The saved comparison's loader (CozSavedCompare.load) reads the record through CozSaved.get("live").
   Nothing is written to Saved Charts and no slot is used. No model call. A reopened saved comparison opens its own
   record. Compare pages only (compare-birth-charts.html, saved-compare-document.html). */
(function () {
  if (window.CozPrintLive || !window.CozSaved) return;
  var LIVE = "live", SS = "cozPrintLiveCompare", DOC = "saved-compare-document.html", FRESH_MS = 3600000;
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function parse(s){ try { return typeof s === "string" ? JSON.parse(s) : (s || null); } catch (e) { return null; } }
  function same(run, rec){ return !!(run && rec && run.runId && run.fingerprint && run.runId === rec.runId && run.fingerprint === rec.fingerprint); }

  function liveBirth(){
    var bd = parse(ls("emergeBirthData"));
    if (!bd || !bd.runId || !bd.fingerprint) return null;
    if (window.CozSaved.isRestoredRun && window.CozSaved.isRestoredRun()) return null;
    return bd;
  }
  function savedRecord(){
    var bd = parse(ls("emergeBirthData")), s = parse(ls(window.CozSaved.STORE || "cozSavedCharts")), out = null;
    if (!bd || !bd.runId || !s || !Array.isArray(s.records)) return null;
    s.records.forEach(function (r) { if (!out && r && r.runId === bd.runId && r.kind === "compare") out = r; });
    return out;
  }
  /* Current Timing calculated on this tab for this run, while it is less than an hour old */
  function cacheGet(rec){
    try {
      var v = JSON.parse(sessionStorage.getItem(SS) || "null"), t = v && v.timing;
      if (!t || !same(v, rec) || !same(t, rec)) return null;
      return Date.now() - Date.parse(t.asOf) < FRESH_MS ? t : null;
    } catch (e) { return null; }
  }
  function cachePut(rec, timing){
    try { var s = JSON.stringify({ runId: rec.runId, fingerprint: rec.fingerprint, timing: timing }); sessionStorage.setItem(SS, s); return sessionStorage.getItem(SS) === s; }
    catch (e) { return false; }
  }

  /* ---- the unsaved record ---- */
  function build(){
    var bd = liveBirth(); if (!bd || !window.CozSaved._snapshotFor) return null;
    var rec = { id: LIVE, live: true, kind: "compare", runId: bd.runId, fingerprint: bd.fingerprint, name: bd.name || "", birthDate: bd.birthDate || "",
                systems: {}, savedAt: null, updatedAt: null, snapshot: window.CozSaved._snapshotFor(bd.runId), library: { compare: {} } };
    var t = cacheGet(rec); if (t) rec.library.compare.timing = t;
    return rec;
  }
  var memo = null;
  function record(){ if (memo) return memo; try { memo = build(); } catch (e) { memo = null; } return memo; }
  var realGet = window.CozSaved.get;
  window.CozSaved.get = function (id) { return id === LIVE ? record() : realGet.apply(this, arguments); };

  /* Current Timing, calculated as a save calculates it; resolves true once it is kept for this tab */
  var busy = null;
  function makeTiming(){
    var rec = record(); if (!rec) return Promise.resolve(false);
    if (busy) return busy;
    if (!window.CozSavedCompare || !window.CozSavedCompare.prepareSave) return Promise.resolve(false);
    busy = window.CozSavedCompare.prepareSave({ runId: rec.runId, fingerprint: rec.fingerprint }).then(function (r) {
      try { window.CozSavedCompare.discard(); } catch (e) {}                  /* never handed to a save */
      return !!(r && r.ok && r.timing && same(r.timing, rec) && cachePut(rec, r.timing));
    }, function () { return false; });
    return busy;
  }

  /* ---- for the Your Birth Charts page ---- */
  function target(view){
    if (!liveBirth()) { var rec = savedRecord(); if (rec) return DOC + "?view=" + view + "&id=" + encodeURIComponent(rec.id); }
    return DOC + "?view=" + view + "&id=" + LIVE;
  }

  window.CozPrintLive = { sys: "compare", LIVE: LIVE, record: record, target: target, makeTiming: makeTiming };
})();
