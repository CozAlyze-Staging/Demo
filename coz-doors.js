/* COZ DOORS · GD1 r2 (Oct 25 2026, staging only) · the guided four-door order on the three dashboards
   Tom's test (Oct 23) and the rules Jason agreed with Chat (Oct 25):
   - The four doors keep their place and order on his art (Reading, Ascendant, Current Life Cycle /
     Current Transits / Current Timing, Birth Chart). The marks are drawn over the art inside the
     dashboard's stage, so they grow and move with it through the opening zoom, a pinch or a pan,
     and stay on their doors and on the doors' tap areas.
   - Visited: a checkmark, and the door looks quieter but stays readable and tappable.
   - Progress belongs to one chart run (run ID + birth fingerprint) and one system (Vedic, Tropical,
     Combined). A new chart starts with none. Reopening a saved chart brings its run back, and with it
     that chart's own progress (kept on this device, like the saved charts themselves).
   - Next: the first door not visited yet, top to bottom, has a steady glow (no motion). None once all
     four are visited.
   r2 (Chat's review of 4ba603b):
   - A visit is recorded only once the door's actual content is on screen: never for a waiting, refused,
     failed or unavailable screen, and never because a page merely loaded. Each door's page calls
     CozDoors.mark(system, door, run) itself at that moment.
   - Every visit is bound to the run ID + fingerprint of the content actually displayed (the chart, the
     chart pair or the reading the page drew), never to whichever chart is current when the visit is
     written. A mark without that identity records nothing. Marks a page made before this file loaded
     are queued with their own identity and written as they were made.
   - A dashboard shows the progress of the chart it was opened for: the run its own content was drawn
     from, fixed for the page's life, even if another tab changes the current chart later.
   Nothing here starts a reading or sends anything anywhere. Stored on this device only, in
   localStorage "cozDoorVisits". Not used on the hidden pre-write page, inside a saved chart or a saved
   comparison, on a print page, or in a hidden chart export. */
(function () {
  if (window.CozDoors) return;
  if (/[?&](pregen=1|in=compare|saved=1|print=1|lcCapture=1|cozExport=1)\b/.test(location.search)) return;

  var KEY = "cozDoorVisits", MAX_RUNS = 100, SYSTEMS = ["vedic", "tropical", "compare"];
  var ORDER = ["reading", "ascendant", "timing", "chart"];
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");

  /* the dashboards: each door's outline measured on his art, in the art's own pixels
     [left, top, right, bottom] (outer edge of the gold line) and the corner radius */
  var DASH = {
    "vedic-reading":    { sys: "vedic",    w: 1068, h: 1940, r: 17,
      doors: [[210, 1058, 840, 1151], [211, 1185, 839, 1277], [214, 1307, 837, 1399], [215, 1433, 835, 1524]] },
    "tropical-reading": { sys: "tropical", w: 972,  h: 2128, r: 19,
      doors: [[149, 1187, 825, 1292], [149, 1328, 824, 1433], [145, 1465, 820, 1569], [147, 1608, 818, 1712]] },
    "compare-reading":  { sys: "compare",  w: 813,  h: 1763, r: 15,
      doors: [[134, 1033, 689, 1121], [133, 1157, 685, 1245], [137, 1279, 686, 1367], [140, 1400, 680, 1486]] }
  };
  var HOT = ['#hotReading', '.hot[data-dash="ascendant"]',
             '.hot[data-dash="life-cycle"],.hot[data-dash="transits"],.hot[data-dash="timing"]',
             '.hot[data-dash="birth-chart"],.hot[data-dash="birth-charts"]'];

  function lsJSON(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function nonEmpty(x){ return typeof x === "string" && x.trim().length > 0; }
  /* the identity a mark must carry: { runId, fingerprint } of the content on screen */
  function idOf(run){ return run && nonEmpty(run.runId) && nonEmpty(run.fingerprint) ? { runId: run.runId, fp: run.fingerprint } : null; }
  function read(){
    var s = lsJSON(KEY);
    return (s && s.runs && typeof s.runs === "object") ? s : { v: 1, runs: {} };
  }
  /* keeps the most recent runs; a run that belongs to a saved chart is never dropped */
  function prune(s){
    var ids = Object.keys(s.runs);
    if (ids.length <= MAX_RUNS) return;
    var saved = {};
    try { (lsJSON("cozSavedCharts") || { records: [] }).records.forEach(function (r) { if (r && r.runId) saved[r.runId] = 1; }); } catch (e) {}
    ids.sort(function (a, b) { return String(s.runs[a].at || "") < String(s.runs[b].at || "") ? -1 : 1; });
    for (var i = 0; i < ids.length && Object.keys(s.runs).length > MAX_RUNS; i++) if (!saved[ids[i]]) delete s.runs[ids[i]];
  }
  function entry(s, id){
    var e = s.runs[id.runId];
    return (e && e.fp === id.fp) ? e : null;               /* same run ID with other birth data: not this chart */
  }

  /* records one door as visited for the chart run whose content is on screen (run = that content's identity) */
  function mark(sys, door, run){
    var id = idOf(run);
    if (!id || ORDER.indexOf(door) < 0 || SYSTEMS.indexOf(sys) < 0) return false;
    var s = read(), e = entry(s, id), now = new Date().toISOString();
    if (!e) e = s.runs[id.runId] = { fp: id.fp };
    e[sys] = e[sys] || {};
    if (e[sys][door]) return true;                         /* already visited: nothing changes */
    e[sys][door] = now; e.at = now;
    prune(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (x) { return false; }
    try { console.log("[COZ DOORS] visited: " + sys + " " + door + " (run " + id.runId + ")"); } catch (x) {}
    try { window.dispatchEvent(new CustomEvent("COZ_DOORS_CHANGE", { detail: { sys: sys, door: door, runId: id.runId } })); } catch (x) {}
    return true;
  }
  /* the four doors of one system for one chart run */
  function visited(sys, run){
    var id = idOf(run), out = {};
    var e = id ? entry(read(), id) : null, v = (e && e[sys]) || {};
    ORDER.forEach(function (d) { out[d] = !!v[d]; });
    return out;
  }

  window.CozDoors = { mark: mark, visited: visited, ORDER: ORDER };
  /* marks made before this file loaded (content drawn early), each with the identity it was made with */
  try { (window.__cozDoorsQ || []).forEach(function (m) { mark(m[0], m[1], m[2]); }); window.__cozDoorsQ = []; } catch (e) {}

  /* ---------- a dashboard: the marks on the doors ---------- */
  var D = DASH[page];
  if (!D) return;
  /* the chart this dashboard was opened for: the run the page drew its own content from (set where it
     resolved its Ascendant), otherwise the chart current when the page opened. Fixed for the page's life. */
  var PAGE_RUN = idOf(window.COZ_DOORS_PAGE_RUN) ? window.COZ_DOORS_PAGE_RUN : (function () {
    var bd = lsJSON("emergeBirthData");
    return idOf(bd) ? { runId: bd.runId, fingerprint: bd.fingerprint } : null;
  })();

  function css(){
    if (document.getElementById("cozDoorsCSS")) return;
    var st = document.createElement("style"); st.id = "cozDoorsCSS";
    st.textContent =
      ".coz-door{position:absolute;pointer-events:none;box-sizing:border-box;margin:0}" +
      /* Visited: quieter, still readable */
      ".coz-door.is-visited{background:rgba(1,5,14,.42)}" +
      ".coz-door .coz-door-check{position:absolute;display:none;overflow:visible;color:#EED6B2}" +
      ".coz-door.is-visited .coz-door-check{display:block}" +
      /* Next: a steady champagne glow around the door, no motion */
      ".coz-door.is-next{box-shadow:0 0 0 .2cqw rgba(244,226,194,.5),0 0 2.2cqw .25cqw rgba(232,204,160,.32),inset 0 0 1.6cqw rgba(232,204,160,.13)}" +
      ".coz-door-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}";
    document.head.appendChild(st);
  }
  function pct(n){ return (Math.round(n * 10000) / 10000) + "%"; }
  var CHECK = '<svg class="coz-door-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.6 12.9 9.7 17.7 19.4 6.6"/></svg>';

  function build(stage){
    var made = stage.querySelectorAll(".coz-door");
    if (made.length === 4) return made;
    var first = stage.querySelector(".hot");
    D.doors.forEach(function (d, i) {
      var w = d[2] - d[0], h = d[3] - d[1];
      var el = document.createElement("div");
      el.className = "coz-door"; el.setAttribute("aria-hidden", "true"); el.dataset.door = ORDER[i];
      el.style.cssText = "left:" + pct(d[0] / D.w * 100) + ";top:" + pct(d[1] / D.h * 100) +
        ";width:" + pct(w / D.w * 100) + ";height:" + pct(h / D.h * 100) +
        ";border-radius:" + pct(D.r / w * 100) + " / " + pct(D.r / h * 100);
      el.innerHTML = CHECK;
      /* the check sits inside the door at its right end, centred top to bottom */
      var c = el.firstChild, side = 0.32 * h;
      c.style.cssText = "right:" + pct(0.12 * h / w * 100) + ";top:34%;height:32%;width:" + pct(side / w * 100);
      stage.insertBefore(el, first);
    });
    if (!document.getElementById("cozDoorVisitedText")) {
      var sr = document.createElement("span"); sr.className = "coz-door-sr"; sr.id = "cozDoorVisitedText"; sr.textContent = "Visited";
      var sn = document.createElement("span"); sn.className = "coz-door-sr"; sn.id = "cozDoorNextText"; sn.textContent = "Next";
      stage.appendChild(sr); stage.appendChild(sn);
    }
    return stage.querySelectorAll(".coz-door");
  }

  function paint(){
    var stage = document.getElementById("dashStage"); if (!stage) return;
    css();
    var els = build(stage), v = visited(D.sys, PAGE_RUN), next = -1, i;
    for (i = 0; i < ORDER.length; i++) if (!v[ORDER[i]]) { next = i; break; }
    for (i = 0; i < ORDER.length; i++) {
      els[i].classList.toggle("is-visited", v[ORDER[i]]);
      els[i].classList.toggle("is-next", i === next);
      var b = stage.querySelector(HOT[i]);
      if (b) { if (v[ORDER[i]]) b.setAttribute("aria-describedby", "cozDoorVisitedText");
               else if (i === next) b.setAttribute("aria-describedby", "cozDoorNextText");
               else b.removeAttribute("aria-describedby"); }
    }
  }
  window.CozDoors.pageRun = function () { return PAGE_RUN ? { runId: PAGE_RUN.runId, fingerprint: PAGE_RUN.fingerprint } : null; };

  paint();
  window.addEventListener("COZ_DOORS_CHANGE", paint);
  window.addEventListener("hashchange", paint);
  window.addEventListener("pageshow", paint);                 /* back from a door's page, from Safari's cache too */
  window.addEventListener("storage", function (e) { if (!e || !e.key || e.key === KEY) paint(); });
})();
