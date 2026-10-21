/* COZALYZE · COMPARE SERVER ADAPTER · CSA1.3 (Oct 14 2026, STAGING ONLY, offline, not deployed)
   CI1 (e) (Demo integration, Oct 20 2026): a chart reopened from Saved Charts (cozRestoredRunId) is only shown. Once a
   page knows it was reopened, nothing more is sent to the Compare server for it from that page: its job is never read
   again, because a read can wake the job's worker and spend the calls it has left, and no start is sent, not even one
   already under way (index.html, CI1 (a), never begins one for it). Its pages show what this device has stored:
   finished readings and the Combined sections already released. Every other section or reading says it hadn't finished
   when the chart was saved (MSG.saved, the Saved Charts line from coz-saved.js), and the dashboard's door does not wait.
   A recorded refusal, error or access stop shows as before. Nothing of its reading or its server choice changes on the
   device: an answer that lands after the reopening is not kept. A follow that started before the reopening stops for
   good, and the pages following it settle on what is stored. A page knows of a reopening from its own checks (the chart
   reopened now), from Saved Charts' restore() when the reopening is made on this page, from the storage event of a
   reopening made on another page (with the chart that event names), and from the device's list of reopened server
   charts ("cozCmpReopenedRuns", the last 50), which every page with this adapter reads at every check and adds to when
   the reopened chart has a server choice (no other chart can send anything, so a device without one never gets the
   list). So a page that missed a reopening (kept for the Back button) learns it from any such page that saw it. Once
   known, a reopening is kept for the page's life: reopening another chart later never revives anything of it, not a
   follow, not an answer still on its way, not a start waiting for its retry (r3 and r4, after ChatGPT's review of r2).
   CSA1.3 (one tester password, DTC2): the Compare server is reached with the same saved Demo tester password
   the Vedic and Tropical readings use, read under the same names in the same order as the DTC2 block in
   coz-vedic-server.js / coz-tropical-server.js ("cozDemoTesterCode", then "cozVedicServerKey", then
   "cozTropicalServerKey"). The switch "cozCmpServer" now holds only { on, url }; a code still stored there
   from CSA1.2 is ignored. At the purchase the choice keeps a short fingerprint of the password that started
   the job (cred, never the password), and the job is always followed with that same password, so a newer
   saved password never cuts off a running job. No saved password at the purchase: no choice is recorded and
   the run keeps the existing browser path, exactly as with the switch off. A refused password (the server answers 403) stops
   polling for that job (no endless retry); released text already stored stays. Nothing else changed.
   CSA1.3 r3 (Oct 14): followAll and ascReading also respect a recorded access stop (no request at all);
   released text and the job ID stay as they are.
   CSA1.3 r2 (Oct 14, after Chat's review):
   - A refused password never removes text: released sections stay on screen and on the device, the job ID stays
     on the choice (marked access: true), polling stops, and only sections never released show the failed line.
   - Every released Combined section is kept on the device as it arrives ("cozCmpPartial:<runId>", matched on run
     ID + fingerprint + job ID), so reopening the page shows it at once, before any poll.
   - follow() never calls back synchronously: a cached answer (or a refusal) is handed over on the next turn,
     after the caller has its stop function, and only if that caller is still attached. Every caller also stops
     through a guard that works whichever comes first.
   - firstSectionState(pair) for the Compare dashboard's door: "ready" once Shared Themes is released for this
     run's job, "wait" while it is being written, "go" when there is nothing to wait for (no server choice,
     refused, error, access). The dashboard holds the end of the clip on "wait" (compare-reading.html CRG1).
   CSA1.2 (Oct 5 2026, package 2b r2)
   Connects the Compare pages to the Compare server (cozalyze-compare-server). Loaded by index.html,
   combined-reading.html, your-ascendants.html and ascendant-reading.html.
   ROUTING RULE (r1, after Chat's review): ONLY the Compare purchase in index.html starts a server job.
   - Switch: localStorage "cozCmpServer" = { on, url, code } (set on compare-staging-setup.html).
     Read in exactly one place: markPurchase(), called by index.html at the Compare purchase.
   - Choice: at the purchase, markPurchase() records "cozCompareWriter:<runId>" = { writer:"server",
     state:"starting", fingerprint, url, at } synchronously, before anything is queued. purchaseStart()
     (index.html only) then creates the job and completes the record to state "job" (jobId), "refused"
     or "error". Every other page only FOLLOWS a recorded choice, matched on run ID AND birth
     fingerprint. A run with no recorded choice (older, restored, or bought with the switch off) keeps
     the existing browser path whatever the switch says. No page other than the purchase calls create.
     r2: EVERY match is run ID AND fingerprint, including index.html's routing check and the purchase.
     A choice for the same run ID with a different fingerprint is stale: the run is unassigned, takes the
     browser path, and the stale record is never reused, completed or changed.
   - Follow: one poll per page, every 1.5 s while the page is visible, and at once when it becomes
     visible again. Released text is shown as it arrives; finished readings are written into the
     existing cache keys with server version segments, so the Saved Library reads them unchanged:
       cozCombinedReadingDEV:<run>|<fp>|<trop>|<vedic>|cmp-p1-server|cmp-p1-server|<sel>|<tax>|westernClaims=<W>
       cozAscReading:<run>|<fp>|<sys>|<sign>|<engine(s)>|asc-server-1
   No model call is ever made from the browser on this path. */
(function(){
  if (window.COZ_CMP_SERVER) return;
  var VERSION = "CSA1.3 r3 + CI1 (e)";
  var MSG = {   /* approved customer copy (Oct 3, Tropical/Vedic rulings and Compare limit wording) */
    writing: "This section is still being written\u2026",
    failed: "This section couldn\u2019t be completed.",
    limit: "The test limit was reached before this section was written.",
    refused: "The test limit has been reached. No reading was started.",
    notStarted: "Your reading hasn\u2019t started yet. Please check back in a moment.",   /* PROPOSED, pending Jason's wording approval */
    saved: "This reading hadn't finished when this chart was saved."   /* CI1 (e): the Saved Charts line (coz-saved.js, S1.1) */
  };
  var POLL_MS = 1500;
  function lsJSON(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch(e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } }
  function config(){ var c = lsJSON("cozCmpServer"); return c && c.url ? { on: !!c.on, url: c.url } : null; }   /* CSA1.3: no code here */
  /* ---------- CSA1.3: the one Demo tester password (same names and order as the DTC2 block) ---------- */
  var CODE_KEY = "cozDemoTesterCode", PREV_KEY = "cozDemoTesterCodePrevious", VEDIC_OLD = "cozVedicServerKey", TROP_OLD = "cozTropicalServerKey";
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function credOf(s){ var h = 0x811c9dc5; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return "c-" + ("0000000" + (h >>> 0).toString(16)).slice(-8); }
  function codeForNew(){ return lsGet(CODE_KEY) || lsGet(VEDIC_OLD) || lsGet(TROP_OLD) || null; }
  function codeForJob(a){                                        /* only the password this job was started with */
    if (!a || !a.cred) return null;
    var n = [CODE_KEY, VEDIC_OLD, TROP_OLD, PREV_KEY];
    for (var i = 0; i < n.length; i++) { var v = lsGet(n[i]); if (v && credOf(v) === a.cred) return v; }
    return null;
  }
  function on(){ var c = config(); return !!(c && c.on); }
  function aKey(runId){ return "cozCompareWriter:" + runId; }
  /* the assignment for THIS pair, only if run ID and fingerprint both match */
  function assignedFor(pair){
    if (!pair || !pair.runId) return null;
    var a = lsJSON(aKey(pair.runId));
    return a && a.writer === "server" && a.fingerprint === pair.fingerprint ? a : null;
  }
  /* CI1 (e): this pair's chart was reopened from Saved Charts; this job is a reopened chart's. A reopening this page
     knows of is kept for the page's life, with its job, so a later reopening of another chart never makes an earlier
     one count as not reopened again. Each check notes the chart reopened now, and the device's list of reopened server
     charts. A reopening made on another page is also noted from its storage event, with the chart the event names: a
     later reopening may have replaced it by the time the event arrives. A reopening noted of a chart with a server
     choice is added to the list, which keeps the last 50. Storage that can't be read counts as reopened. */
  var reopenedRuns = {}, reopenedJobs = {}, REOPENED_KEY = "cozCmpReopenedRuns";
  function remember(r){ if (!r || reopenedRuns[r]) return; reopenedRuns[r] = true; var x = lsJSON(aKey(r)); if (x && x.jobId) reopenedJobs[x.jobId] = true; }
  function noteReopened(v){
    try { hookRestore(); } catch(e){}
    var r = v || localStorage.getItem("cozRestoredRunId"), l = lsJSON(REOPENED_KEY); l = Array.isArray(l) ? l : [];
    l.forEach(function(x){ if (typeof x === "string") remember(x); });
    if (!r) return;
    remember(r);
    var c = lsJSON(aKey(r)); if (l.indexOf(r) < 0 && c && c.writer === "server") lsSet(REOPENED_KEY, l.concat([r]).slice(-50));
  }
  function restored(pair){ try { noteReopened(); return !!(pair && pair.runId && reopenedRuns[pair.runId]); } catch(e){ return true; } }
  function restoredJob(a){
    try { noteReopened(); if (a && a.jobId && reopenedJobs[a.jobId]) return true;
          for (var r in reopenedRuns) { var x = lsJSON(aKey(r)); if (x && x.jobId && a && x.jobId === a.jobId) return true; }
          return false; } catch(e){ return true; }
  }
  /* A reopening made on this page sends it no storage event, so Saved Charts' restore() (coz-saved.js) is wrapped here:
     the reopening is noted as restore() returns. coz-saved.js may load after this file, so every check looks for it. */
  function hookRestore(){
    var CS = window.CozSaved; if (!CS || typeof CS.restore !== "function" || CS.restore.cmpNoted) return;
    var orig = CS.restore;
    CS.restore = function(){ var out = orig.apply(this, arguments); try { noteReopened(); } catch(e){} return out; };
    CS.restore.cmpNoted = true;
  }
  try { hookRestore(); noteReopened(); } catch(e){}
  try { window.addEventListener("storage", function(ev){ if (!ev || ev.key === null || ev.key === "cozRestoredRunId") { try { if (ev && ev.newValue) noteReopened(ev.newValue); noteReopened(); } catch(e){} } }); } catch(e){}
  function savedEnd(){ var e = new Error(MSG.saved); e.saved = true; return e; }   /* CI1 (e): what a follow's pages get when its chart is reopened */
  function authHeaders(code){ return { "x-tester-code": code || "" }; }   /* CSA1.3: header name kept as the server expects (CSA1.2) */
  /* state of a recorded choice: starting | job | refused | error */
  function stateOf(a){ return a.jobId ? "job" : a.refused ? "refused" : a.state || "starting"; }
  var NOT_STARTED_MS = 90000;   /* the server's notStarted rule, applied to a create that never confirmed */
  /* index.html, at the Compare purchase only: record the server choice for this run (synchronous) */
  function markPurchase(runId, fingerprint){
    if (!runId || !fingerprint) return null;
    var have = lsJSON(aKey(runId));
    if (have && have.writer === "server") return have.fingerprint === fingerprint ? have : null;   /* r2: a stale choice is never reused */
    var c = config(); if (!c || !c.on) return null;
    var code = codeForNew(); if (!code) return null;                                     /* CSA1.3: no saved password: browser path */
    var a = { writer: "server", state: "starting", fingerprint: fingerprint, url: c.url, at: Date.now(), chosenAt: "purchase", cred: credOf(code) };
    return lsSet(aKey(runId), a) ? a : null;
  }
  /* complete a choice still "starting" (never overwrites a job, a refusal or an error already recorded) */
  function complete(runId, fingerprint, f){
    var a = lsJSON(aKey(runId)); if (!a || a.writer !== "server" || a.fingerprint !== fingerprint) return null;   /* r2: never touches a stale choice */
    if (stateOf(a) !== "starting") return a;
    var b = Object.assign({}, a, f); lsSet(aKey(runId), b); return b;
  }
  function failStart(runId, fingerprint, message){
    if (restored({ runId: runId })) return lsJSON(aKey(runId));                                    /* CI1 (e): nothing is recorded for a reopened chart */
    return complete(runId, fingerprint, { state: "error", message: String(message || "start failed").slice(0, 200), endedAt: Date.now() }); }
  var starting = {};
  var RETRY_MS = [3000, 9000];   /* the purchase start is retried twice on a network error or a 5xx; create is idempotent on the server */
  /* index.html only, right after markPurchase(). res = COZ_ASC.ensurePair() result (charts + pair) */
  function purchaseStart(res){
    var pair = res.pair, a = assignedFor(pair);
    if (!a) return Promise.reject(new Error("DEV: no Compare server choice recorded at purchase for this chart run"));
    if (stateOf(a) !== "starting") return Promise.resolve(a);
    if (starting[pair.runId]) return starting[pair.runId];
    var code = codeForJob(a);                                                            /* CSA1.3: the password recorded at the purchase */
    if (!code) return Promise.resolve(failStart(pair.runId, pair.fingerprint, "DEV: the tester password used at the purchase is no longer on this device"));
    var G = window.COZ_COMBINED_GEN, E = window.COZ_COMPARE_EVIDENCE, A = window.COZ_ASC, m = null;
    starting[pair.runId] = E.buildManifest(res).then(function(man){
      m = man;
      var sup = G._supplied(m), user = G._userMessage(m, pair, sup);
      return Promise.all(["tropical", "vedic", "combined"].map(function(sys){ return A._build.evidence(sys, res); })).then(function(evs){
        var asc = {};
        ["tropical", "vedic", "combined"].forEach(function(sys, i){
          var ev = evs[i];
          asc[sys] = { user: A._build.user(sys, ev), nak: sys === "tropical" ? null : (sys === "vedic" ? ev.ascNakshatra : ev.vedic.ascNakshatra) || null };
        });
        return JSON.stringify({ runId: pair.runId, fingerprint: pair.fingerprint, pair: pair, sup: sup, userFromPage: user, asc: asc,
          versions: { selection: m.selectionVersion, taxonomy: m.taxonomyVersion, tropical: pair.engineVersions.tropical, vedic: pair.engineVersions.vedic } });
      });
    }).then(function(body){
      function attempt(n){
        if (restored(pair)) return Promise.resolve({ status: -1, j: {}, restored: true });          /* CI1 (e): not sent once its chart is reopened, retries included */
        return fetch(a.url + "/.netlify/functions/compare-create", { method: "POST", headers: Object.assign({ "content-type": "application/json" }, authHeaders(code)), body: body })
          .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { status: r.status, j: j }; }); },
                function(e){ return { status: 0, j: { error: (e && e.message) || "network" } }; })
          .then(function(x){
            if ((x.status === 0 || x.status >= 500) && n < RETRY_MS.length)
              return new Promise(function(r){ setTimeout(r, RETRY_MS[n]); }).then(function(){ return attempt(n + 1); });
            return x;
          });
      }
      return attempt(0);
    }).then(function(x){
      if (x.restored || restored(pair)) return assignedFor(pair);                                  /* CI1 (e): an answer after the reopening is not recorded */
      var v = { versions: { selection: m.selectionVersion, taxonomy: m.taxonomyVersion } };
      if (x.status === 200 && x.j.jobId) return complete(pair.runId, pair.fingerprint, Object.assign(v, { state: "job", jobId: x.j.jobId }));
      if (x.status === 401 || x.status === 403) return failStart(pair.runId, pair.fingerprint, "DEV: Compare server refused the tester password (" + x.status + ")");   /* CSA1.3 */
      if (x.status === 429) return complete(pair.runId, pair.fingerprint, Object.assign(v, { state: "refused", refused: true, message: x.j.message || MSG.refused }));
      return failStart(pair.runId, pair.fingerprint, "DEV: Compare server answered " + x.status + (x.j && x.j.error ? " (" + x.j.error + ")" : ""));
    }, function(e){ return failStart(pair.runId, pair.fingerprint, (e && e.message) || "DEV: could not build the Compare request"); });
    starting[pair.runId].then(function(){ delete starting[pair.runId]; }, function(){ delete starting[pair.runId]; });
    return starting[pair.runId];
  }
  /* pages: wait for a recorded choice to leave "starting". Never starts anything.
     onWait(late) is called while waiting; late = true once the choice is 90 s old with no job. */
  function awaitJob(pair, onWait){
    var a = assignedFor(pair);
    if (!a) return Promise.reject(new Error("DEV: this chart run isn't assigned to the Compare server"));
    if (stateOf(a) !== "starting" || restored(pair)) return Promise.resolve(a);                   /* CI1 (e): a reopened chart never waits for a start */
    return new Promise(function(resolve){
      var t = null;
      function check(){
        var x = assignedFor(pair);
        if (x && (stateOf(x) !== "starting" || restored(pair))) { clearInterval(t); resolve(x); return; }   /* CI1 (e): nor once it is reopened while waiting */
        if (onWait) try { onWait(!x || Date.now() - (x.at || 0) > NOT_STARTED_MS); } catch(e){}
      }
      t = setInterval(check, 1000); check();
    });
  }
  /* one shared poll per job on this page */
  var watchers = {}, lastView = {};
  function poll(a){
    var code = codeForJob(a);                                                            /* CSA1.3 */
    if (!code) { var e0 = new Error("DEV: no tester password for this job on this device"); e0.access = true; return Promise.reject(e0); }
    return fetch(a.url + "/.netlify/functions/compare-read?job=" + encodeURIComponent(a.jobId), { headers: authHeaders(code), cache: "no-store" })
      .then(function(r){ if (!r.ok) { var e = new Error("DEV: Compare server read " + r.status); if (r.status === 401 || r.status === 403) e.access = true; throw e; } return r.json(); });
  }
  var pairs = {};   /* jobId -> its chart pair, for caching from any poll */
  function follow(a, cb){
    var w = watchers[a.jobId];
    if (!w) {
      w = watchers[a.jobId] = { cbs: [], timer: null, busy: false, lastErr: null };
      var tickFn = function(){
        if (w.dead) return;
        if (restoredJob(a)) { clearInterval(w.timer); w.dead = true; w.lastErr = savedEnd(); w.cbs.slice().forEach(function(f){ try { f(null, w.lastErr); } catch(x){} }); return; }   /* CI1 (e): stopped for good, checked before the busy return */
        if (w.busy) return; w.busy = true;
        poll(a).then(function(v){ if (restoredJob(a)) return; lastView[a.jobId] = v; try {                 /* CI1 (e): an answer after the reopening is not kept */ if (pairs[a.jobId]) cacheReleased(pairs[a.jobId], a, v); } catch(e){} w.cbs.slice().forEach(function(f){ try { f(v, null); } catch(e){} }); })
          .catch(function(e){
            if (restoredJob(a)) return;                                                              /* CI1 (e): nor marked */
            if (e && e.access) { clearInterval(w.timer); w.dead = true; w.lastErr = e; markAccess(a); }   /* CSA1.3: no endless retry on a refused password */
            w.cbs.slice().forEach(function(f){ try { f(null, e); } catch(x){} }); })
          .then(function(){ w.busy = false; });
      };
      w.tick = tickFn;
      w.timer = setInterval(function(){ if (!document.hidden) tickFn(); }, POLL_MS);
      document.addEventListener("visibilitychange", function(){ if (!document.hidden && !w.dead) tickFn(); });
      tickFn();
    }
    w.cbs.push(cb);
    /* r2: never synchronously. The caller gets its stop function first; the cached answer (or the refusal
       that ended this watcher) follows on the next turn, only if this caller is still attached. */
    if (lastView[a.jobId] || w.lastErr) setTimeout(function(){
      if (w.cbs.indexOf(cb) < 0) return;
      try { if (w.lastErr) cb(null, w.lastErr); else cb(lastView[a.jobId], null); } catch(e){}
    }, 0);
    return function stop(){ w.cbs = w.cbs.filter(function(f){ return f !== cb; }); if (!w.cbs.length) { clearInterval(w.timer); if (watchers[a.jobId] === w) delete watchers[a.jobId]; } };
  }
  /* r2: attach a follower whose callback may need to stop it at any moment (even before follow() returns) */
  function attach(a, cb){
    var stop = null, ended = false;
    function halt(){ ended = true; if (stop) { var s0 = stop; stop = function(){}; s0(); } }
    stop = follow(a, function(v, err){ if (!ended) cb(v, err, halt); });
    if (ended) { var s1 = stop; stop = function(){}; s1(); }
    return halt;
  }
  /* r2: a refused password keeps the job ID; the choice is only marked, never cleared */
  function markAccess(a){
    try { var ks = []; for (var i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
      ks.forEach(function(k){
        if (!k || k.indexOf("cozCompareWriter:") !== 0) return;
        var x = lsJSON(k); if (x && x.jobId === a.jobId && !x.access) { x.access = true; x.accessAt = Date.now(); lsSet(k, x); }
      }); } catch(e){}
  }
  /* ---------- Combined ---------- */
  /* the generator's own key with its two step-version segments replaced: same family and shape, never equal */
  function combinedKey(pair, a){
    var parts = window.COZ_COMBINED_GEN.keyFor(pair, { selectionVersion: a.versions.selection, taxonomyVersion: a.versions.taxonomy }).split("|");
    parts[4] = "cmp-p1-server"; parts[5] = "cmp-p1-server";
    return parts.join("|");
  }
  function peekCombined(pair){
    var a = assignedFor(pair); if (!a || !a.jobId) return null;
    var o = lsJSON(combinedKey(pair, a));
    return o && o.sharedThemes && o.differentEmphases && o.integratedView ? o : null;
  }
  function combinedRecord(pair, a, sections){
    var rec = { runId: pair.runId, fingerprint: pair.fingerprint, writer: "compare-server", promptVersion: "cmp-p1",
      selectionVersion: a.versions.selection, taxonomyVersion: a.versions.taxonomy, generatedAt: new Date().toISOString(),
      developmentOnly: true, productionEligible: false, attempts: null, fromServer: true,
      vedicEvidenceStatus: {}, tropicalEvidenceStatus: "", trace: { validation: { soft: [] }, comparableThemes: {} }, firstAttemptProblems: [] };
    ["sharedThemes", "differentEmphases", "integratedView"].forEach(function(k){
      var d = sections[k].data || {};
      rec[k] = { paragraphs: d.paragraphs || [], evidence: d.evidence || [], wordCountMeasured: (d.paragraphs || []).join(" ").split(/\s+/).filter(Boolean).length };
    });
    return rec;
  }
  /* r2: released Combined sections kept on the device as they arrive, per run + fingerprint + job */
  function partialKey(runId){ return "cozCmpPartial:" + runId; }
  function partialFor(pair, a){
    var p = lsJSON(partialKey(pair.runId));
    return p && p.fingerprint === pair.fingerprint && a && p.jobId === a.jobId && p.sections ? p : null;
  }
  function savePartial(pair, a, C){
    if (!C || !C.sections) return;
    var p = partialFor(pair, a) || { runId: pair.runId, fingerprint: pair.fingerprint, jobId: a.jobId, sections: {}, final: {} }, changed = false;
    p.final = p.final || {};
    SECTION_KEYS.forEach(function(k){
      var x = C.sections[k];
      if (x && x.state === "released" && x.data && !p.sections[k]) { p.sections[k] = { paragraphs: x.data.paragraphs || [], evidence: x.data.evidence || [], at: Date.now() }; changed = true; }
      if (x && (x.state === "failed" || x.state === "limit") && !p.final[k]) { p.final[k] = x.state; changed = true; }   /* never released: nothing to wait for */
    });
    if (changed) { p.updatedAt = Date.now(); lsSet(partialKey(pair.runId), p); }
  }
  /* r2: the dashboard door. "ready" | "wait" | "go" (see the header) */
  function firstSectionState(pair){
    var a = assignedFor(pair); if (!a) return "go";
    var st = stateOf(a); if (st === "refused" || st === "error" || a.access || restored(pair)) return "go";   /* CI1 (e): nothing to wait for */
    if (st !== "job") return "wait";
    try { if (peekCombined(pair)) return "ready"; } catch(e){}                              /* pages without the generator: the partial decides */
    var p = partialFor(pair, a);
    if (p && p.sections.sharedThemes) return "ready";
    if (p && p.final && p.final.sharedThemes) return "go";
    return "wait";
  }
  /* r2: the dashboard follows the job itself while it waits, so the door never depends on another page
     polling. Only the released Combined sections are kept (savePartial); nothing is started or written. */
  var firstWatch = {};
  function watchFirst(pair){
    var a = assignedFor(pair); if (!a || stateOf(a) !== "job" || a.access || firstWatch[a.jobId]) return;
    if (firstSectionState(pair) !== "wait") return;
    firstWatch[a.jobId] = attach(a, function(v, err, halt){
      if (err && (err.access || err.saved)) { halt(); return; }                                    /* CI1 (e) */
      if (!v || !v.combined) return;
      savePartial(pair, a, v.combined);
      if (firstSectionState(pair) !== "wait") halt();
    });
  }
  /* onUpdate(state) with state = { sections: { key: { state, paragraphs?, message? } }, done, record? } */
  var SECTION_KEYS = ["sharedThemes", "differentEmphases", "integratedView"];
  function allSections(state, message){ var s = {}; SECTION_KEYS.forEach(function(k){ s[k] = { state: state, message: message }; }); return s; }
  function followCombined(pair, onUpdate){
    if (!assignedFor(pair)) return Promise.reject(new Error("DEV: this chart run isn't assigned to the Compare server"));
    return awaitJob(pair, function(late){ onUpdate({ sections: allSections("writing", late ? MSG.notStarted : MSG.writing), done: false }); }).then(function(a){
    var st = stateOf(a);
    if (st === "refused") { onUpdate({ refused: true, message: a.message || MSG.refused, sections: {} }); return { done: true, refused: true }; }
    if (st === "error") { var se = allSections("failed", MSG.failed); onUpdate({ sections: se, done: true }); return { done: true, sections: se }; }
    var hit = peekCombined(pair); if (hit) return { done: true, record: hit };
    pairs[a.jobId] = pair;
    /* r2: what this page shows, starting from the released sections already on the device */
    var shown = {}, part = partialFor(pair, a);
    SECTION_KEYS.forEach(function(k){
      var ps = part && part.sections[k];
      shown[k] = ps ? { state: "released", paragraphs: ps.paragraphs } : { state: "writing", message: MSG.writing };
    });
    function copy(){ var o = {}; SECTION_KEYS.forEach(function(k){ o[k] = shown[k]; }); return o; }
    function accessEnd(msg){                                /* r2: keep released text, fail only what never arrived */
      SECTION_KEYS.forEach(function(k){ if (shown[k].state !== "released") shown[k] = { state: "failed", message: msg || MSG.failed }; });
      return { sections: copy(), done: true, access: true };
    }
    if (a.access || restored(pair)) { var r0 = accessEnd(a.access ? MSG.failed : MSG.saved); onUpdate(r0); return r0; }   /* CI1 (e): a reopened chart shows what is stored */
    if (part) onUpdate({ sections: copy(), done: false });
    return new Promise(function(resolve){
      attach(a, function(v, err, halt){
        if (err && (err.access || err.saved)) { var ra = accessEnd(err.saved ? MSG.saved : MSG.failed); halt(); onUpdate(ra); resolve(ra); return; }   /* CSA1.3 r2 · CI1 (e) */
        if (err || !v || !v.combined) return;   /* transient: keep the sections already shown, try again on the next poll */
        var C = v.combined, all = true, final = true;
        SECTION_KEYS.forEach(function(k){
          var x = C.sections[k] || { state: "writing" };
          if (shown[k].state === "released") return;                                            /* r2: released text is never replaced */
          shown[k] = x.state === "released" ? { state: "released", paragraphs: x.data.paragraphs }
               : { state: x.state, message: x.state === "failed" ? MSG.failed : x.state === "limit" ? MSG.limit : (C.notStarted ? MSG.notStarted : MSG.writing) };
        });
        SECTION_KEYS.forEach(function(k){ if (shown[k].state !== "released") all = false; if (["released", "failed", "limit"].indexOf(shown[k].state) < 0) final = false; });
        if (all && SECTION_KEYS.every(function(k){ return C.sections[k] && C.sections[k].state === "released"; })) {
          var rec = combinedRecord(pair, a, C.sections);
          lsSet(combinedKey(pair, a), rec);
          halt(); onUpdate({ sections: copy(), done: true, record: rec }); resolve({ done: true, record: rec }); return;
        }
        onUpdate({ sections: copy(), done: final });
        if (final) { halt(); resolve({ done: true, sections: copy() }); }
      });
    });
    });
  }
  /* ---------- Ascendants (called from ascendant-library getReading for a server-assigned run) ---------- */
  function ascKey(sys, ctx, libKey){ return libKey.split("|").slice(0, 5).join("|") + "|asc-server-1"; }
  /* the same key from the pair alone (mirrors the library's signFor + engine segment), for background caching */
  function ascSign(sys, pair){ return sys === "tropical" ? pair.tropical.sign : sys === "vedic" ? pair.vedic.sign : pair.tropical.sign + "+" + pair.vedic.sign; }
  function ascKeyFor(sys, pair){
    var ev = pair.engineVersions, eng = sys === "tropical" ? ev.tropical : sys === "vedic" ? ev.vedic : ev.tropical + "+" + ev.vedic;
    return "cozAscReading:" + [pair.runId, pair.fingerprint, sys, ascSign(sys, pair), eng, "asc-server-1"].join("|");
  }
  function ascRecord(sys, pair, R){
    return { paragraphs: R.data.paragraphs, preview: R.data.preview, runId: pair.runId, fingerprint: pair.fingerprint, system: sys, sign: ascSign(sys, pair),
      engineVersion: "asc-server-1", generatedAt: new Date().toISOString(), developmentOnly: true, writer: "compare-server",
      provenance: "Compare server (asc-server-1): ascendant-library L2.4 prompts and check, written on the server" };
  }
  function cacheReleased(pair, a, v){
    if (v && v.combined) savePartial(pair, a, v.combined);                                  /* r2 */
    if (v && v.asc) ["tropical", "vedic", "combined"].forEach(function(sys){
      var R = v.asc.readings[sys], k = ascKeyFor(sys, pair);
      if (R && R.state === "released" && !lsJSON(k)) lsSet(k, ascRecord(sys, pair, R));
    });
    if (v && v.combined && ["sharedThemes", "differentEmphases", "integratedView"].every(function(x){ return v.combined.sections[x] && v.combined.sections[x].state === "released"; })) {
      var ck = combinedKey(pair, a); if (!lsJSON(ck)) lsSet(ck, combinedRecord(pair, a, v.combined.sections));
    }
  }
  /* index.html (the living page) follows the whole job and stores every finished reading on the device,
     as the browser coordinator did, so the Saved Library has them whether or not their pages are opened.
     Follows a recorded choice only; one follow per run on a page. */
  var following = {};
  function followAll(pair){
    if (!assignedFor(pair) || restored(pair)) return Promise.resolve(null);                        /* CI1 (e): a reopened chart is never followed */
    if (following[pair.runId]) return following[pair.runId];
    following[pair.runId] = awaitJob(pair).then(function(a){
      if (stateOf(a) !== "job" || a.access) return null;                                  /* r3: a recorded access stop is respected: no request */
      pairs[a.jobId] = pair;
      return new Promise(function(resolve){
        attach(a, function(v, err, halt){
          if (err && (err.access || err.saved)) { halt(); resolve(null); return; }           /* CSA1.3 · CI1 (e) */
          if (!v) return;
          var cDone = v.combined && SECTION_KEYS.every(function(x){ return ["released", "failed", "limit"].indexOf((v.combined.sections[x] || {}).state) >= 0; });
          var aDone = v.asc && ["tropical", "vedic", "combined"].every(function(x){ return ["released", "failed", "limit"].indexOf((v.asc.readings[x] || {}).state) >= 0; });
          if (cDone && aDone) { halt(); resolve(v); }
        });
      });
    });
    return following[pair.runId];
  }
  function peekAsc(sys, ctx, libKey){ var o = lsJSON(ascKey(sys, ctx, libKey)); return o && Array.isArray(o.paragraphs) ? o : null; }
  /* called from ascendant-library getReading for a run whose server choice was recorded at its purchase */
  function ascReading(sys, ctx, libKey, sign){
    var pair = ctx.pair;
    if (!assignedFor(pair)) return Promise.reject(new Error("DEV: this chart run isn't assigned to the Compare server"));
    return awaitJob(pair).then(function(a){
      var st = stateOf(a);
      if (st === "refused") { var r0 = new Error(a.message || MSG.refused); r0.kind = "refused"; throw r0; }
      if (st === "error") { var e0 = new Error(MSG.failed); e0.kind = "failed"; throw e0; }
      var hit = peekAsc(sys, ctx, libKey); if (hit) { hit.fromCache = true; return hit; }
      if (a.access || restored(pair)) { var ea0 = new Error(a.access ? MSG.failed : MSG.saved); ea0.kind = a.access ? "failed" : "saved"; throw ea0; }   /* r3: no request after a recorded access stop · CI1 (e): nor for a reopened chart */
      pairs[a.jobId] = pair;
      return new Promise(function(resolve, reject){
        attach(a, function(v, err, halt){
          if (err && (err.access || err.saved)) { var ea = new Error(err.saved ? MSG.saved : MSG.failed); ea.kind = err.saved ? "saved" : "failed"; halt(); reject(ea); return; }   /* CSA1.3 · CI1 (e) */
          if (err || !v || !v.asc) return;
          var R = v.asc.readings[sys] || { state: "writing" };
          if (R.state === "released") {
            var rec = lsJSON(ascKey(sys, ctx, libKey)) || ascRecord(sys, pair, R);   /* already stored by the poll */
            lsSet(ascKey(sys, ctx, libKey), rec); halt(); resolve(rec); return;
          }
          if (R.state === "failed" || R.state === "limit") { var e = new Error(R.state === "limit" ? MSG.limit : MSG.failed); e.kind = R.state; halt(); reject(e); }
        });
      });
    });
  }
  window.COZ_CMP_SERVER = { VERSION: VERSION, MSG: MSG, config: config, on: on, assignedFor: assignedFor, stateOf: stateOf,
    markPurchase: markPurchase, purchaseStart: purchaseStart, failStart: failStart, awaitJob: awaitJob,
    followCombined: followCombined, followAll: followAll, peekCombined: peekCombined, firstSectionState: firstSectionState, watchFirst: watchFirst, _partialKey: partialKey, ascReading: ascReading, _combinedKey: combinedKey, _ascKey: ascKey, _ascKeyFor: ascKeyFor };
})();
