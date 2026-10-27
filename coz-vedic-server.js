/* COZ VEDIC SERVER · VSA1.2 + DX1
   DX1 (Oct 27 2026, staging only): when this page's own status poll sees a job finish, the server's final record
   (requests, tokens, cost, timing, soft findings; not the sections, no password) is kept in "cozVedicServerFinal" for
   review. No other change.
   VSA1.2 (DTC2, Oct 14 2026)
   DTC2: one tester password for the whole Demo (see the DTC2 block below), read before the old names. A job is followed
   with the password that started it. No password, or a refused one, marks the run "access": polling stops, released
   sections stay, the others show the tester line, which the reader taps to enter the password. After a verified
   password the line says to open the reading again; nothing is started or followed by the entry itself. A run that has
   a job is only ever followed, never started again. Still never deletes a password. Nothing else changed.
   VSA1.1 (Sep 29 2026)
   VSA1.1: pinned(run) = this device already holds a server job record for this run + fingerprint, so a run that
   started on the server keeps following it even if the switch is later turned OFF (OFF governs new runs only).
   Device-only link from vedic-reading.html to the isolated Vedic server (cozalyze-vedic-server). Vedic only;
   never touches Tropical keys or files. DEFAULT OFF: inert unless this device's localStorage
   "cozVedicServerBase" is EXACTLY https://cozalyze-vedic-server.netlify.app or
   https://test--cozalyze-vedic-server.netlify.app. OFF = the page runs today's locked writer unchanged.
   ON: Sections 1-2 stay in the browser (unchanged); Sections 3-6 come from the server job, each section shown as
   soon as the server releases it (VR1). One record per run in "cozVedicServerJob". A restored (reopened Saved)
   chart never starts a job; it only follows a job this device already holds for the same run + fingerprint.
   Tester key: "cozVedicServerKey", else the Tropical tester key on this device. No server secret here. */
(function () {
  if (window.CozVedicServer) return;
  var OK = ["https://cozalyze-vedic-server.netlify.app", "https://test--cozalyze-vedic-server.netlify.app"];
  var JOB = "cozVedicServerJob", POLL_MS = 3000, OWN_OLD = "cozVedicServerKey", OTHER_OLD = "cozTropicalServerKey";   /* DTC2 */
  var IDS = ["relationships-karmic", "dharma-direction", "rahu-ketu", "essential-takeaway"];
  var COPY = { pending: "This section is still being written\u2026", failed: "This section couldn\u2019t be completed." };
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsJSON(k){ try { return JSON.parse(ls(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function notify(){ try { window.dispatchEvent(new CustomEvent("COZ_VEDIC_SERVER_UPDATE")); } catch (e) {} }
  /* DX1: the server's final record for a job, exactly as this page's own status poll received it, kept on this device
     for review (newest first, 8 jobs). Requests, tokens, cost, timing and the soft findings (which quote only the
     sentences they flag); never the sections themselves, never a password. Nothing extra is sent; the page is unchanged. */
  var FINAL = "cozVedicServerFinal", FINAL_MAX = 8;
  function num(x){ return typeof x === "number" ? x : null; }
  function keepFinal(v, runId, b){
    try {
      var a = lsJSON(FINAL); a = Array.isArray(a) ? a.filter(function (x) { return x && x.jobId !== v.jobId; }) : [];
      a.unshift({ keptAt: new Date().toISOString(), server: String(b || "").replace("/.netlify/functions", ""), runId: runId || null,
        jobId: v.jobId, state: v.state, version: v.version, model: v.model, launches: num(v.launches),
        requests: Array.isArray(v.requests) ? v.requests : [], cost: v.cost || null, finishedMs: num(v.finishedMs),
        sections: (v.sections || []).map(function (s) { return { id: s.id, state: s.state, source: s.source || null, readableMs: num(s.readableMs) }; }),
        quality: v.quality || null });
      lsSet(FINAL, a.slice(0, FINAL_MAX));
    } catch (e) {}
  }
  /* ---------- DTC2: one tester password for the whole Demo (identical block in coz-tropical-server.js and coz-vedic-server.js) ----------
     Saved once as "cozDemoTesterCode"; the old per-reading names are still read. A job keeps only a short fingerprint of the
     password that started it (never the password) and is always followed with that same password, so a newer saved password
     never cuts off an existing job. A job id and its released text are never cleared by an access problem, and a reading that
     already has a job is never started again. The password is entered by tapping the tester line itself (no new element):
     it is checked with the server first (a status request for a job that does not exist; no reading, no charge) and saved
     only if accepted. The password it replaces is kept for the jobs it started. An existing job is continued only with a
     password that job itself accepts (checked with that job's own status), and that password is then bound to it. */
  var CODE_KEY = "cozDemoTesterCode", PREV_KEY = "cozDemoTesterCodePrevious";   /* the one before a change, kept for its jobs */
  var LINE = { access: "This device needs the tester password. Tap here to enter it.",
               ready: "Tester password saved. Open this reading again to continue.",
               other: "This reading was started with a different tester password. Tap here to enter that one." };
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function credOf(s){ var h = 0x811c9dc5; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return "c-" + ("0000000" + (h >>> 0).toString(16)).slice(-8); }
  function codeForNew(){ return lsGet(CODE_KEY) || lsGet(OWN_OLD) || lsGet(OTHER_OLD) || null; }
  function codeForJob(j){
    if (j && j.cred) { var n = [CODE_KEY, OWN_OLD, OTHER_OLD, PREV_KEY]; for (var i = 0; i < n.length; i++) { var v = lsGet(n[i]); if (v && credOf(v) === j.cred) return v; } return null; }
    return lsGet(OWN_OLD) || lsGet(OTHER_OLD) || lsGet(CODE_KEY) || null;     /* a job saved before DTC2: the order used before */
  }
  function lineFor(j){ return j.state === "ready" ? LINE.ready : (j.reason === "other" ? LINE.other : LINE.access); }
  function wireCodeEntry(){
    if (window.__cozCodeEntry) return; window.__cozCodeEntry = true;
    if (!/-reading\.html$/.test(location.pathname) || /pregen=1/.test(location.search)) return;   /* only the visible reading pages */
    var mark = function () { try { var ps = document.querySelectorAll("p"); for (var i = 0; i < ps.length; i++) {
      var tx = ps[i].textContent.trim(); if ((tx === LINE.access || tx === LINE.other) && !ps[i].hasAttribute("data-coz-code")) { ps[i].setAttribute("data-coz-code", "1"); ps[i].setAttribute("role", "button"); ps[i].setAttribute("tabindex", "0"); } } } catch (e) {} };
    var hit = function (t) { return t && t.closest ? t.closest("[data-coz-code]") : null; };
    document.addEventListener("click", function (e) { if (hit(e.target)) { e.preventDefault(); enterCode(); } }, true);
    document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && hit(e.target)) { e.preventDefault(); enterCode(); } }, true);
    try { new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    mark();
  }
  function findJobCode(j, entered, done){                                /* which password does this job itself accept? */
    var c = [], add = function (v) { if (v && c.indexOf(v) < 0) c.push(v); };
    if (j.cred) { if (credOf(entered) === j.cred) add(entered); add(codeForJob(j)); }   /* only the one it was bound to */
    else { add(entered); add(lsGet(OWN_OLD)); add(lsGet(OTHER_OLD)); add(lsGet(CODE_KEY)); add(lsGet(PREV_KEY)); }   /* a job from before DTC2 */
    (function next(i){ if (i >= c.length) return done(null);
      jobStatus(j, c[i]).then(function (s) { if (s === 200) done(c[i]); else next(i + 1); }); })(0);   /* 200 only for the job's own password */
  }
  function say(m){ try { window.alert(m); } catch (e) {} }
  function enterCode(){
    var t = ""; try { t = (window.prompt("Tester password for the CozAlyze Demo (this device only):") || "").trim(); } catch (e) { t = ""; }
    if (!t) return;
    probe(t).then(function (s) {
      if (s === 404) { try { var was = localStorage.getItem(CODE_KEY); if (was && was !== t) localStorage.setItem(PREV_KEY, was); localStorage.setItem(CODE_KEY, t); } catch (e) {} afterCode(t); }
      else if (s === 401) say("That tester password wasn\u2019t accepted. Nothing was saved.");
      else say("The tester password couldn\u2019t be checked right now. Nothing was saved. Try again in a moment.");
    });
  }
  /* ---------- end of the DTC2 block ---------- */
  function probe(code){                                                 /* DTC2: a status request for a job that does not exist */
    var j = lsJSON(JOB), b = (j && j.base) || base() || (OK[0] + "/.netlify/functions");
    return fetch(b + "/vedic-status?job=00000000000000000000000000000000", { method: "GET", headers: { "Authorization": "Bearer " + code }, cache: "no-store" })
      .then(function (r) { return r.status; }, function () { return 0; });
  }
  function jobStatus(j, code){                                           /* DTC2: this job's own status with one password */
    return fetch((j.base || base() || (OK[0] + "/.netlify/functions")) + "/vedic-status?job=" + encodeURIComponent(j.jobId), { method: "GET", headers: { "Authorization": "Bearer " + code }, cache: "no-store" })
      .then(function (r) { return r.status; }, function () { return 0; });
  }
  function afterCode(code){                                              /* DTC2: marks the run ready; starts and follows nothing */
    var j = lsJSON(JOB);
    if (!j || j.state !== "access") { notify(); return; }
    if (!j.jobId) { j.state = "ready"; j.reason = null; lsSet(JOB, j); notify(); return; }
    findJobCode(j, code, function (k) { var c = lsJSON(JOB); if (!c || c.jobId !== j.jobId) return; if (k) { c.cred = credOf(k); c.state = "ready"; c.reason = null; } else c.reason = "other"; lsSet(JOB, c); notify(); });
  }
  function base(){ var b = ls("cozVedicServerBase"); return OK.indexOf(b) >= 0 ? b + "/.netlify/functions" : null; }
  function restored(runId){ return !!runId && ls("cozRestoredRunId") === runId; }
  function recordFor(run){ var j = lsJSON(JOB); return j && run && j.runId === run.runId && j.fingerprint === run.fingerprint ? j : null; }
  function api(b, path, opt){ opt = opt || {};
    var h = { "Authorization": "Bearer " + (opt.code || "") }; if (opt.body) h["Content-Type"] = "application/json";   /* DTC2 */
    return fetch(b + path, { method: opt.method || "GET", headers: h, body: opt.body, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (x) { return { status: r.status, body: x }; }); }); }

  function write(chart, reading12, firstName){
    var run = chart && chart.run ? { runId: chart.run.runId, fingerprint: chart.run.fingerprint } : null;
    return new Promise(function (resolve, reject) {
      var rec = recordFor(run);
      var b = (rec && rec.base) || base();
      if (!run || !b) return reject(new Error("Vedic server not enabled on this device"));
      var follow = function (jobId, code) {
        (function tick(){
          api(b, "/vedic-status?job=" + encodeURIComponent(jobId), { code: code }).then(function (r) {
            var cur = recordFor(run) || { runId: run.runId, fingerprint: run.fingerprint, jobId: jobId, base: b };
            if (r.status === 401) { cur.state = "access"; cur.reason = "refused"; lsSet(JOB, cur); notify(); return reject(new Error("tester password refused")); }   /* DTC2: no endless retry; job kept */
            if (r.status !== 200 || !r.body || !Array.isArray(r.body.sections)) { if (r.status === 404) { cur.state = "failed"; lsSet(JOB, cur); notify(); return reject(new Error("job not found")); } return setTimeout(tick, POLL_MS * 2); }
            var v = r.body, secs = {}; v.sections.forEach(function (s) { secs[s.id] = s.state === "released" ? { state: "released", body: s.body } : (cur.sections && cur.sections[s.id] && cur.sections[s.id].state === "released" ? cur.sections[s.id] : { state: s.state }); }); if (!cur.cred) cur.cred = credOf(code);   /* DTC2: keep released text; bind a job from before DTC2 */
            var changed = JSON.stringify(cur.sections) !== JSON.stringify(secs) || cur.state !== v.state;
            cur.sections = secs; cur.state = v.state; lsSet(JOB, cur); if (changed) notify();
            if (v.state === "complete" || v.state === "finished") keepFinal(v, run.runId, b);   /* DX1 */
            if (v.state === "complete") {
              var sections = {}; IDS.forEach(function (id) { sections[id] = secs[id].body; });
              return resolve({ sections: sections, inputs: { runId: run.runId, fingerprint: run.fingerprint, server: true },
                trace: { model: v.model, generatedAt: new Date().toISOString(), inputTokens: v.cost.inTokens, outputTokens: v.cost.outTokens, estimatedCostUSD: v.cost.estimateUSD, fromCache: false, server: v.version, jobId: v.jobId } });
            }
            if (v.state === "finished") return reject(new Error("some sections could not be completed"));
            setTimeout(tick, POLL_MS);
          }, function () { setTimeout(tick, POLL_MS * 2); });
        })();
      };
      if (rec && rec.jobId) {                                               /* resume or restored: follow only, never start again */
        var kc = codeForJob(rec);
        if (!kc) { rec.state = "access"; rec.reason = rec.cred ? "other" : "missing"; lsSet(JOB, rec); notify(); return reject(new Error("no tester password for this job")); }
        if (rec.state === "access" || rec.state === "ready") { rec.state = "writing"; rec.reason = null; lsSet(JOB, rec); notify(); }
        return follow(rec.jobId, kc);
      }
      if (restored(run.runId)) return reject(new Error("saved chart reopened: no new writing"));
      var code = codeForNew();                                              /* DTC2 */
      if (!code) { lsSet(JOB, Object.assign({ runId: run.runId, fingerprint: run.fingerprint, jobId: null, base: b, sections: {} }, rec || {}, { state: "access", reason: "missing" })); notify(); return reject(new Error("no tester key on this device")); }
      lsSet(JOB, { runId: run.runId, fingerprint: run.fingerprint, jobId: null, base: b, state: "starting", sections: {}, cred: credOf(code) }); notify();
      api(b, "/vedic-start", { method: "POST", body: JSON.stringify({ chart: chart, reading12: { "essential-nature": reading12["essential-nature"] || [], "mind-intuition": reading12["mind-intuition"] || [] }, firstName: firstName || "" }), code: code })
        .then(function (r) {
          if ((r.status === 200 || r.status === 201) && r.body && r.body.jobId) { var cur = recordFor(run); cur.jobId = r.body.jobId; cur.state = "writing"; lsSet(JOB, cur); notify(); return follow(r.body.jobId, code); }
          var c2 = recordFor(run); if (c2) { c2.state = r.status === 401 ? "access" : "refused"; if (r.status === 401) c2.reason = "refused"; lsSet(JOB, c2); notify(); }   /* DTC2 */
          reject(new Error("start refused: HTTP " + r.status));
        }, function (e) { reject(e); });
    });
  }
  function sectionView(run, id){
    var j = recordFor(run); if (!j) return null;
    var s = j.sections && j.sections[id];
    if (s && s.state === "released") return { state: "released", paragraphs: s.body };
    if (j.state === "access" || j.state === "ready") return { state: j.state + ":" + (j.reason || ""), paragraphs: [lineFor(j)] };   /* DTC2 */
    if ((s && s.state === "failed") || j.state === "refused" || j.state === "failed" || j.state === "finished") return { state: "failed", paragraphs: [COPY.failed] };
    return { state: "pending", paragraphs: [COPY.pending] };
  }
  window.addEventListener("storage", function (e) { if (e && e.key === JOB) notify(); });
  function pinned(run){ var j = recordFor(run); return !!(j && j.base && OK.some(function (o) { return j.base === o + "/.netlify/functions"; })); }
  window.CozVedicServer = { enabled: function () { return !!base(); }, pinned: pinned, write: write, sectionView: sectionView, COPY: COPY };
  wireCodeEntry();                                                  /* DTC2 */
})();
