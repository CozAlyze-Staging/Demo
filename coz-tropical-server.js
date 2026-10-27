/* COZ TROPICAL SERVER · VT1 + DX1
   DX1 (Oct 27 2026, staging only): when this page's own status poll sees a job end, the server's final record (requests,
   tokens, cost, timeline, section checks, soft findings; not the sections or rejected drafts, no password) is kept in
   "cozTropicalServerFinal" for review. No other change.
   VT1 (Oct 26 2026, staging only)
   VT1: the Tropical reading bought from the Vedic reveal (the Tropical option on the Vedic result page). Only
   tropical-reveal.html calculates the Tropical chart, so on that path this device had no Tropical chart for the run, and
   start() stopped at "no Tropical chart for this run; nothing started": no job, and the reading page waited with nothing
   being written. start() now calculates the chart first, silently: the Tropical engine loads in a hidden frame in its
   export-only mode (tropical-reveal.html?cozExport=1, the mode the Ascendant pairing has used since Sep 18; not one
   calculation line changes), and start() runs again once the chart for this exact run (runId + fingerprint) is saved.
   While it calculates, the run's record says "starting", so the reading shows "Your reading is still being written...".
   One calculation per run at a time in a page; the frame waits for the page change to settle (15 s at most) and is
   removed as soon as the chart is saved. No chart within 25 s: offline, the run waits for the connection (the TSA1.5
   retry); online, the run is marked refused, so the reading shows "This section couldn't be completed." instead of
   waiting forever. A newer chart replacing the run ends the calculation without touching anything. The timing record
   gets two marks, chartCalc and chartReady. Everything else is unchanged.
   COZ TROPICAL SERVER · TSA1.5 r2 (Oct 25 2026, staging only)
   TSA1.5: a start that can't reach the server (no connection, or the request never gets an answer) is tried again after
   a pause that grows each time, 3, 6, 12, 24 and 48 seconds, then once a minute, instead of about every 50 ms (Chat's
   review: about 360 attempts in 20 seconds while offline). The count of tries and the end of the pause (retryAt) are kept
   with the run's record, so every page, including one opened later, keeps the same pause.
   r2 (Chat's review of TSA1.5): start() is the one place a start request is sent, and it checks first, so GOTO_TROPICAL,
   a password just entered, the retry timer and repeated calls all follow the same rules: nothing is sent while the phone
   says it is offline (the first start included), nothing before the saved pause is over, and nothing while this page's
   own start for the same chart is still waiting for its answer. Coming back online ends the pause for every page
   (retryAt = now); it never lets a start through while the phone is offline. A pause never holds a start for more than
   a minute, even if the phone clock is moved. A start that reaches the server, and everything after it, is unchanged.
   COZ TROPICAL SERVER · TSA1.4 (TS1.1.7 review package r2, Oct 16 2026, offline, not deployed)
   TSA1.4: (1) a timing record per run in localStorage "cozTropicalTiming" for the Section 1 readiness test, written by
   this file and by tropical-reading.html through CozTropicalServer.timing. It holds the run identity and job id, phone-clock
   marks (jobStart, s1Seen, s1Failed), one record per reveal attempt (door tap, reveal done, any entry wait, first view of
   Section 1, Section 1 shown) and a PERMANENT timing-failure flag: once any attempt waited for Section 1, or opened it
   unready, the run stays failed whatever happens later. Attempts are never deleted. Nothing the customer sees changes.
   (2) A section the server reports "failed" is shown as could-not-be-completed at once instead of "still being written"
   until the whole job ends: the server never changes a failed section again (TS1.1.7: a failed early Section 1 repair is
   final), so the reading entry is not held for a section that will never arrive.
   TSA1.3 (DTC2, Oct 14 2026)
   DTC2: one tester password for the whole Demo (see the DTC2 block below). The start no longer asks with a box: with no
   password the run is marked "access" and every section shows the tester line, which the reader taps to enter it. A
   refused password is never deleted. A job id and its passed sections are never cleared by an access problem; a run that
   has a job is only ever followed, never started again. A verified password entered for a run that never got a job starts
   that run's reading once (the start the reader asked for). Nothing else changed.
   TSA1.2 (Stage 2A, Sep 28 2026)
   TSA1.2 also: a device can be pointed at the Netlify "test" BRANCH deploy of the same server for free testing, by
   setting localStorage "cozTropicalServerBase" to https://test--cozalyze-tropical-server.netlify.app (that exact
   address only, matching index.html's CSP; anything else falls back to production). A job keeps the server it was
   started on for every request, including a retried start that never got a job id.
   TSA1.2: a restored (reopened Saved) chart still NEVER starts a job, but it FOLLOWS a job this device already
   holds for the exact same run (runId + fingerprint): status reads only, never a POST. A completed job whose
   reading was removed by the restore is written back to cozTropicalReading for that run.
   TSA1.1 (Sep 27 2026)
   TSA1.1: a page that is not the poller also checks the saved progress itself on every tick and
   tells its page when it changed. Safari did not deliver the storage event into the reading page
   inside index.html's frame, so an open section stayed on "still being written" (first Demo run).
   The Demo's link to the CozAlyze Tropical server (cozalyze-tropical-server.netlify.app).
   Tropical only. Loaded by index.html (starts the job) and tropical-reading.html (shows it).
   Never loaded by Vedic or Compare pages. Never talks to Anthropic; no server secret lives here.

   START: only when the Tropical product is released (the reveal's GOTO_TROPICAL message to
   index.html). Sends the chart this device already calculated (cozTropicalChartJSON) after
   checking it belongs to the current run (emergeBirthData runId + fingerprint). The server
   returns the same job for the same chart, so a repeated start never pays twice. A restored
   saved chart never starts or polls anything.
   FOLLOW: polls the job's status, keeps one small record per run in localStorage
   "cozTropicalServerJob" (job id, overall state, each section passed / pending / failed with
   the passed text). One page polls at a time (a heartbeat lock); the others follow through the
   storage event. Leaving or closing a page never stops the server; any page that loads this
   file picks the same job up again.
   FINISH: when all six sections have passed, writes "cozTropicalReading" in the existing reading
   contract with this run's identity, so the reading page, Saved and the Tropical library work
   exactly as before. A reading with a section that could not be completed is not written there.
   DEMO ACCESS (DTC2): one tester password for the whole Demo, entered by tapping the tester line and kept in localStorage
   "cozDemoTesterCode"; the old names are still read. Production authentication is a later stage. */
(function () {
  if (window.CozTropicalServer) return;
  var BASE = "https://cozalyze-tropical-server.netlify.app/.netlify/functions";
  function chosenBase(){                                                /* TSA1.2: optional branch-deploy override, this device only */
    var o = null; try { o = localStorage.getItem("cozTropicalServerBase"); } catch (e) {}
    return (o === "https://test--cozalyze-tropical-server.netlify.app") ? o + "/.netlify/functions" : BASE;
  }
  var JOB = "cozTropicalServerJob", OWN_OLD = "cozTropicalServerKey", OTHER_OLD = "cozVedicServerKey", LOCK = "cozTropicalServerPoll";   /* DTC2 */
  var POLL_MS = 4000, LOCK_STALE_MS = 12000;
  /* TSA1.5: the pause before trying a start again, saved with the run's record as retryAt (phone clock, ms) */
  var RETRY_FIRST_MS = 3000, RETRY_MAX_MS = 60000, sending = {};       /* r2: runs whose start this page sent and still waits for */
  function retryWait(j){ var n = Math.max(1, (j && j.retries) || 1); return Math.min(RETRY_MAX_MS, RETRY_FIRST_MS * Math.pow(2, n - 1)); }
  function retryAt(j){ return typeof j.retryAt === "number" ? j.retryAt : (Date.parse(j.updatedAt) || 0) + retryWait(j); }   /* a record saved before r2 */
  function runKey(r){ return r.runId + "|" + r.fingerprint; }
  function held(run, rec){                                              /* TSA1.5 r2: why this run's start can't be sent now, or "" */
    if (sending[runKey(run)]) return "sending";                         /* this page's start is still waiting for its answer */
    if (navigator.onLine === false) return "offline";                   /* always, whatever else is true */
    if (rec && !rec.jobId && rec.state === "retry") {
      var left = retryAt(rec) - Date.now();
      if (left > 0 && left <= RETRY_MAX_MS) return "paused";            /* more than the longest pause left: the phone clock moved */
    }
    return "";
  }
  var OWNER = "tsa-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  var SECTIONS = [
    { id: "at-your-core",           number: 1, title: "At Your Core" },
    { id: "love-desire-creativity", number: 2, title: "Love, Desire & Creativity" },
    { id: "work-money-expression",  number: 3, title: "Work, Money & Expression" },
    { id: "wisdom-purpose-legacy",  number: 4, title: "Wisdom, Purpose & Legacy" },
    { id: "challenges-resilience",  number: 5, title: "Challenges & Resilience" },
    { id: "essential-takeaway",     number: 6, title: "Your Essential Takeaway" }
  ];
  var timer = null;
  /* ---------- TSA1.4: the timing record for this run (phone clock throughout) ---------- */
  var TIMING = "cozTropicalTiming";
  function timingRec(){
    var run = currentRun(); if (!run) return null;
    var t = lsJSON(TIMING);
    if (!t || t.v !== 2 || t.runId !== run.runId || t.fingerprint !== run.fingerprint) t = { v: 2, runId: run.runId, fingerprint: run.fingerprint, jobId: null, marks: {}, attempts: [], failure: null, direct: null };
    return t;
  }
  function timingEdit(fn){ var t = timingRec(); if (!t) return null; fn(t); lsSet(TIMING, t); return t; }
  var timing = {
    get: function () { return timingRec(); },
    mark: function (name, extra) { timingEdit(function (t) { if (t.marks[name]) return; var m = { at: Date.now() }; if (extra) for (var k in extra) m[k] = extra[k]; t.marks[name] = m; }); },
    jobId: function (id) { timingEdit(function (t) { if (!t.jobId) t.jobId = id; }); },
    attemptStart: function () { timingEdit(function (t) { t.attempts.push({ n: t.attempts.length + 1, doorTap: Date.now() }); }); },
    attemptMark: function (name, extra) { timingEdit(function (t) { var a = t.attempts[t.attempts.length - 1]; if (!a || a[name]) return; var m = { at: Date.now() }; if (extra) for (var k in extra) m[k] = extra[k]; a[name] = m; }); },
    fail: function (reason) { timingEdit(function (t) { if (t.failure) return; t.failure = { at: Date.now(), reason: reason, attempt: t.attempts.length }; }); },
    direct: function (state) { timingEdit(function (t) { if (!t.direct) t.direct = { at: Date.now(), state: state }; }); },
    restored: restored
  };

  function lsJSON(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function log(m){ try { console.log("[TROPICAL SERVER] " + m); } catch (e) {} }
  /* DX1: the server's final record for a job, exactly as this page's own status poll received it, kept on this device
     for review (newest first, 8 jobs). Requests, tokens, cost, timeline, each section's checks and the soft findings
     (which quote only the sentences they flag); never the sections themselves, a rejected draft or a password. Nothing
     extra is sent; the page is unchanged. */
  var FINAL = "cozTropicalServerFinal", FINAL_MAX = 8;
  function num(x){ return typeof x === "number" ? x : null; }
  function keepFinal(view, j){
    try {
      var a = lsJSON(FINAL); a = Array.isArray(a) ? a.filter(function (x) { return x && x.jobId !== view.jobId; }) : [];
      a.unshift({ keptAt: new Date().toISOString(), server: String((j && j.base) || "").replace("/.netlify/functions", "") || null, runId: (j && j.runId) || null,
        jobId: view.jobId, state: view.state, config: view.config || null, note: view.note || "", launches: num(view.launches),
        requests: Array.isArray(view.requests) ? view.requests : [], cost: view.cost || null, timeline: view.timeline || null,
        sections: (view.sections || []).map(function (s) { return { id: s.id, state: s.state, source: s.source || null, words: num(s.words),
          arrivedMs: num(s.arrivedMs), readableMs: num(s.readableMs), soft: s.soft || [], error: s.error || null,
          checks: (s.checks || []).map(function (c) { return { source: c.source || null, hard: c.hard || null, soft: c.soft || null, words: num(c.words) }; }) }; }),
        quality: view.quality || null });
      lsSet(FINAL, a.slice(0, FINAL_MAX));
    } catch (e) {}
  }
  function notify(){ try { window.dispatchEvent(new CustomEvent("COZ_TROPICAL_SERVER_UPDATE")); } catch (e) {} }
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

  /* the current run, and the chart that belongs to it */
  function currentRun(){ var bd = lsJSON("emergeBirthData"); return bd && bd.runId && bd.fingerprint ? { runId: bd.runId, fingerprint: bd.fingerprint } : null; }
  function restored(){ var r = null; try { r = localStorage.getItem("cozRestoredRunId"); } catch (e) {} var run = currentRun(); return !!(r && run && run.runId === r); }
  function chartFor(run){
    var c = lsJSON("cozTropicalChartJSON");
    if (!c || !c.run || !run || c.run.runId !== run.runId || c.run.fingerprint !== run.fingerprint) return null;
    return c;
  }
  function record(){ var run = currentRun(), j = lsJSON(JOB); return (j && run && j.runId === run.runId && j.fingerprint === run.fingerprint) ? j : null; }
  function finalReadingExists(run){
    var r = lsJSON("cozTropicalReading");
    return !!(r && r.run && run && r.run.runId === run.runId && r.run.fingerprint === run.fingerprint && Array.isArray(r.sections) && r.sections.length === 6);
  }
  function probe(code){                                                 /* DTC2: a status request for a job that does not exist */
    var rec = record(), base = (rec && rec.base) ? rec.base : chosenBase();
    return fetch(base + "/tropical-status?job=00000000000000000000000000000000", { method: "GET", headers: { "Authorization": "Bearer " + code }, cache: "no-store" })
      .then(function (r) { return r.status; }, function () { return 0; });
  }
  function jobStatus(j, code){                                           /* DTC2: this job's own status with one password */
    return fetch((j.base || chosenBase()) + "/tropical-status?job=" + encodeURIComponent(j.jobId), { method: "GET", headers: { "Authorization": "Bearer " + code }, cache: "no-store" })
      .then(function (r) { return r.status; }, function () { return 0; });
  }
  function afterCode(code){                                              /* DTC2: never clears a job, never starts one again */
    var j = record();
    if (j && j.jobId) {                                                 /* the job is continued with its own password, or not at all */
      findJobCode(j, code, function (k) { var c = record(); if (!c || c.jobId !== j.jobId) return;
        if (k) { c.cred = credOf(k); c.state = "writing"; c.reason = null; } else { c.state = "access"; c.reason = "other"; }
        c.updatedAt = new Date().toISOString(); lsSet(JOB, c); notify(); if (k) follow(); });
      return;
    }
    if (j && j.state === "access") { start(); return; }                   /* this run never got a job: its first start, once */
    notify();
  }
  function api(path, opt){
    opt = opt || {}; var k = opt.code || "";                             /* DTC2: the caller names the password */
    var rec = record(), base = (rec && rec.base) ? rec.base : chosenBase();   /* a job (and any retried start) stays on its own server */
    var h = { "Authorization": "Bearer " + (k || "") }; if (opt.body) h["Content-Type"] = "application/json";
    return fetch(base + path, { method: opt.method || "GET", headers: h, body: opt.body || undefined, cache: "no-store" })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (b) { return { status: res.status, body: b }; }); });
  }

  /* ---------- VT1: the Tropical chart for a Tropical purchase made from the Vedic reveal ---------- */
  var CALC_MS = 25000, calculating = {};                                /* VT1: runs whose chart this page is calculating now */
  function calcChart(run, rec){
    var key = runKey(run);
    if (calculating[key]) { log("the Tropical chart for this run is still being calculated"); return; }
    if (!document.body) { log("no Tropical chart for this run; nothing started"); return; }
    calculating[key] = true;
    lsSet(JOB, { v: 1, runId: run.runId, fingerprint: run.fingerprint, jobId: null, state: "starting", sections: {}, base: (rec && rec.base) || chosenBase(), updatedAt: new Date().toISOString(), retries: (rec && rec.retries) || 0 });
    timing.mark("chartCalc");
    notify();
    log("no Tropical chart for this run yet (Tropical bought from the Vedic reveal); calculating it first");
    var f = null, iv = null, t0 = 0;
    function finish(outcome){
      clearInterval(iv); try { if (f) f.remove(); } catch (e) {} delete calculating[key];
      if (outcome === "ready") { timing.mark("chartReady"); log("Tropical chart calculated for this run"); start(); return; }
      if (outcome === "replaced") { log("a newer chart replaced this run; its Tropical chart is no longer needed"); return; }
      var j = record(); if (!j || runKey(j) !== key || j.jobId) return;
      if (navigator.onLine === false) { j.state = "retry"; j.retryAt = Date.now(); log("offline: the Tropical chart is calculated when the connection is back"); }
      else { j.state = "refused"; j.detail = "the Tropical chart could not be calculated on this device"; log("the Tropical chart could not be calculated; nothing started"); }
      j.updatedAt = new Date().toISOString(); lsSet(JOB, j); notify(); follow();
    }
    function check(){
      var cur = currentRun();
      if (!cur || runKey(cur) !== key) finish("replaced");
      else if (chartFor(run)) finish("ready");
      else if (t0 && Date.now() - t0 > CALC_MS) finish("failed");
    }
    function load(){
      f = document.createElement("iframe");
      f.setAttribute("aria-hidden", "true"); f.tabIndex = -1; f.title = "preparing";
      f.style.cssText = "position:fixed;left:-20px;top:0;width:1px;height:1px;opacity:0;border:0;pointer-events:none";
      f.src = "tropical-reveal.html?cozExport=1&t=" + Date.now();
      t0 = Date.now(); document.body.appendChild(f);
    }
    iv = setInterval(check, 250);
    var since = Date.now();
    function whenSettled(){                                             /* like the Combined writer: never during a page change, 15 s at most */
      if (!calculating[key]) return;
      if (!window.__cozNavBusy || Date.now() - since > 15000) load(); else setTimeout(whenSettled, 250);
    }
    setTimeout(whenSettled, 300);                                       /* index.html marks its page change right after this same message */
  }

  /* ---------- start (index.html, on GOTO_TROPICAL) ---------- */
  function start(){
    var run = currentRun();
    if (!run) { log("no current run; nothing started"); return; }
    if (restored()) { log("saved chart reopened; never starts a reading"); return; }
    if (finalReadingExists(run)) { log("this run's reading is already complete"); return; }
    var rec = record();
    if (rec && rec.jobId) { log("job already exists for this run; following it"); follow(); return; }
    var chart = chartFor(run);
    if (!chart) { calcChart(run, rec); return; }                        /* VT1: bought from the Vedic reveal; calculated first */
    var code = codeForNew();
    if (!code) { lsSet(JOB, { v: 1, runId: run.runId, fingerprint: run.fingerprint, jobId: null, state: "access", reason: "missing", sections: {}, base: (rec && rec.base) || chosenBase(), updatedAt: new Date().toISOString() }); notify(); log("no tester password on this device; nothing started"); return; }   /* DTC2 */
    var why = held(run, rec);                                             /* TSA1.5 r2: every start is checked here before it is sent */
    if (why) {
      if (why === "offline" && !(rec && rec.state === "retry")) {         /* nothing tried yet: no pause, it waits for the connection */
        lsSet(JOB, { v: 1, runId: run.runId, fingerprint: run.fingerprint, jobId: null, state: "retry", sections: {}, base: (rec && rec.base) || chosenBase(), cred: credOf(code), updatedAt: new Date().toISOString(), retries: (rec && rec.retries) || 0, retryAt: Date.now() });
        notify();
      }
      log("start not sent (" + why + "); it is tried when it may be"); follow(); return;
    }
    lsSet(JOB, { v: 1, runId: run.runId, fingerprint: run.fingerprint, jobId: null, state: "starting", sections: {}, base: (rec && rec.base) || chosenBase(), cred: credOf(code), startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), retries: (rec && rec.retries) || 0 });   /* TSA1.5: tries so far kept */
    timing.mark("jobStart");                                              /* TSA1.4 */
    notify();
    var key = runKey(run); sending[key] = true;                           /* TSA1.5 r2 */
    api("/tropical-start", { method: "POST", body: JSON.stringify({ chart: chart }), code: code }).then(function (r) {
      delete sending[key];                                                /* TSA1.5 r2 */
      var j = record(); if (!j) return;
      if ((r.status === 200 || r.status === 201) && r.body && r.body.jobId) {
        j.jobId = r.body.jobId; j.state = "writing"; j.updatedAt = new Date().toISOString(); lsSet(JOB, j); timing.jobId(j.jobId); notify();   /* TSA1.4 */
        log((r.status === 201 ? "new job " : "existing job ") + "started"); follow();
      } else if (r.status === 401) {
        j.state = "access"; j.reason = "refused"; lsSet(JOB, j); notify(); log("tester password refused; nothing deleted (DTC2)");
      } else {
        j.state = "refused"; j.detail = String((r.body && r.body.error) || ("HTTP " + r.status)).slice(0, 200); lsSet(JOB, j); notify();
        log("start refused before any writing: " + j.detail);
      }
    }).catch(function (e) {
      delete sending[key];                                                /* TSA1.5 r2 */
      var j = record(); if (!j) return;
      j.state = "retry"; j.retries = (j.retries || 0) + 1; j.retryAt = Date.now() + retryWait(j); j.updatedAt = new Date().toISOString(); lsSet(JOB, j); notify();   /* TSA1.5: counted, and the pause saved */
      log("start did not reach the server; it retries while a page is open, next in " + Math.round(retryWait(j) / 1000) + " s");
      follow();
    });
  }

  /* ---------- follow (any page) ---------- */
  function haveLock(){
    var l = lsJSON(LOCK), now = Date.now();
    if (l && l.owner !== OWNER && now - l.at < LOCK_STALE_MS) return false;
    lsSet(LOCK, { owner: OWNER, at: now }); return true;
  }
  function done(state){ return state === "complete" || state === "finished" || state === "refused" || state === "access"; }   /* DTC2: unchanged */
  var lastSeen = null;
  function tick(){
    timer = null;
    var j = record();
    var seen = j ? (j.jobId || "") + "|" + j.state + "|" + (j.updatedAt || "") : "";
    if (seen !== lastSeen) { lastSeen = seen; notify(); }             /* TSA1.1: progress written by another page */
    if (j && j.state === "complete" && !finalReadingExists(currentRun())) writeFinal(j);   /* TSA1.2: e.g. removed by a restore */
    if (!j || done(j.state)) return;
    if (restored() && !j.jobId) return;                              /* TSA1.2: restored never starts or re-starts; it only follows */
    if (!haveLock()) { timer = setTimeout(tick, POLL_MS); return; }
    if (j.state === "retry" && !j.jobId) {
      /* TSA1.5: wait out the saved pause after a start that didn't reach the server; nothing is tried while offline.
         r2: start() checks the same rules again before it sends. */
      var why = held(j, j);                                           /* the record carries its run's identity */
      if (why) { timer = setTimeout(tick, why === "paused" ? Math.max(250, Math.min(retryAt(j) - Date.now(), POLL_MS)) : POLL_MS); return; }
      restart(); return;
    }
    if (!j.jobId) { timer = setTimeout(tick, POLL_MS); return; }
    var kc = codeForJob(j);                                                 /* DTC2 */
    if (!kc) { j.state = "access"; j.reason = j.cred ? "other" : "missing"; lsSet(JOB, j); notify(); return; }
    api("/tropical-status?job=" + encodeURIComponent(j.jobId), { code: kc }).then(function (r) {
      var cur = record(); if (!cur || cur.jobId !== j.jobId) return;
      if (r.status === 200 && r.body && Array.isArray(r.body.sections)) { if (!cur.cred) cur.cred = credOf(kc); apply(cur, r.body); }   /* DTC2: bind a job from before DTC2 */
      else if (r.status === 401) { cur.state = "access"; cur.reason = "refused"; lsSet(JOB, cur); notify(); }   /* DTC2: no endless retry; job kept */
      else if (r.status === 404) { cur.state = "refused"; cur.detail = "job no longer on the server"; lsSet(JOB, cur); notify(); }
      if (!done((record() || {}).state)) timer = setTimeout(tick, POLL_MS);
    }).catch(function () { timer = setTimeout(tick, POLL_MS * 2); });
  }
  function restart(){ var j = record(); if (j) { lsSet(JOB, Object.assign(j, { jobId: null })); } start(); }
  function follow(){ if (!timer) timer = setTimeout(tick, 50); }

  function apply(j, view){
    var final = view.state === "complete" || view.state === "finished" || view.state === "failed";
    var secs = {};
    view.sections.forEach(function (s) {
      if (s.state === "passed" && Array.isArray(s.body)) secs[s.id] = { state: "passed", body: s.body };
      else if (j.sections && j.sections[s.id] && j.sections[s.id].state === "passed") secs[s.id] = j.sections[s.id];   /* DTC2 */
      else if (s.state === "failed") secs[s.id] = { state: "failed" };    /* TSA1.4: final on the server, shown at once */
      else secs[s.id] = { state: final ? "failed" : "pending" };
    });
    timing.jobId(j.jobId);                                                /* TSA1.4: a job followed from before the record existed */
    if (secs["at-your-core"] && secs["at-your-core"].state === "passed") timing.mark("s1Seen");
    else if (secs["at-your-core"] && secs["at-your-core"].state === "failed") timing.mark("s1Failed");
    j.sections = secs; j.state = final ? (view.state === "complete" ? "complete" : "finished") : "writing"; j.updatedAt = new Date().toISOString();
    lsSet(JOB, j); lastSeen = (j.jobId || "") + "|" + j.state + "|" + j.updatedAt;
    if (final) keepFinal(view, j);                                        /* DX1 */
    if (j.state === "complete") writeFinal(j);
    notify();
  }
  function writeFinal(j){
    var secs = j.sections || {};
    if (!SECTIONS.every(function (s) { return secs[s.id] && secs[s.id].state === "passed" && Array.isArray(secs[s.id].body); })) return;
    var reading = { system: "tropical", title: "Your Tropical Reading", source: "server", jobId: j.jobId,
      run: { runId: j.runId, fingerprint: j.fingerprint }, generatedAt: new Date().toISOString(),
      sections: SECTIONS.map(function (s) { return { id: s.id, number: s.number, title: s.title, body: secs[s.id].body }; }) };
    lsSet("cozTropicalReading", reading);
    try { window.COZ_TROPICAL_READING = reading; } catch (e) {}
    log("reading complete; stored for this run");
  }

  /* ---------- what a page shows for one section ---------- */
  var COPY = { writing: "Your reading is still being written\u2026", pending: "This section is still being written\u2026", failed: "This section couldn\u2019t be completed." };
  function sectionView(id){
    var j = record();
    if (!j) return null;                                           /* no server job for this run */
    var s = j.sections && j.sections[id];
    if (s && s.state === "passed") return { state: "passed", paragraphs: s.body, run: { runId: j.runId, fingerprint: j.fingerprint } };   /* GD1 r2: whose text this is */
    if (j.state === "access") return { state: "access:" + (j.reason || ""), paragraphs: [lineFor(j)] };   /* DTC2: the reason is in the state, so the page redraws when it changes */
    if (j.state === "refused") return { state: "failed", paragraphs: [COPY.failed] };
    if (s && s.state === "failed") return { state: "failed", paragraphs: [COPY.failed] };
    if (!j.sections || !Object.keys(j.sections).length) return { state: "writing", paragraphs: [COPY.writing] };
    return { state: "pending", paragraphs: [COPY.pending] };
  }

  /* index.html: the Tropical product release starts the job */
  window.addEventListener("message", function (ev) { var d = ev && ev.data; if (d && d.coz === "GOTO_TROPICAL") start(); });
  /* another page wrote progress: tell this page */
  window.addEventListener("storage", function (ev) { if (ev && (ev.key === JOB || ev.key === "cozTropicalReading")) notify(); });
  /* TSA1.5: back online: a start waiting out its pause is tried at once. r2: only the pause ends, saved for every page
     (retryAt = now); start() still sends nothing while the phone is offline. */
  window.addEventListener("online", function () {
    var j = record(); if (!j || j.jobId || j.state !== "retry") return;
    if (retryAt(j) > Date.now()) { j.retryAt = Date.now(); lsSet(JOB, j); }
    if (timer) { clearTimeout(timer); timer = null; } follow();
  });

  window.CozTropicalServer = { start: start, resume: follow, sectionView: sectionView, record: record, COPY: COPY, timing: timing };   /* TSA1.4 */
  follow();                                                         /* pick up a job already under way */
  wireCodeEntry();                                                  /* DTC2 */
})();
