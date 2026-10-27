/* ACCOUNT AREA · AC1 (Oct 27 2026, staging only) · shared script for the five account pages.
   Loaded in <head>, before the page draws, so the saved Text Size and Reduce Motion apply at once.

   What is real here and what is not (Jason's spec, Oct 27):
   - This site has no account service yet: no sign-in provider, no account records, no purchase or entitlement
     records, no email service, no data export or account deletion service. CozAccount, below, is the one place
     such a service will connect (every call there must be checked against the signed-in account on the server,
     and no key or secret ever goes in this file). Until then every account operation answers "unavailable", and
     the pages say so in the approved wording (Oct 14): "This will be available once you can sign in to your
     CozAlyze account." Nothing is ever shown as saved, purchased, exported or deleted when it was not.
   - Saved charts are this device's own (coz-saved.js, "cozSavedCharts"). These pages read them and never write them.
   - Display preferences (Text Size, Reduce Motion) need no account. They are real settings saved on this device
     ("cozDisplayPrefs") and apply to the account pages.
   - Terms and Privacy are not published yet. Their links say so, in the approved wording (Oct 14). */
(function () {
  if (window.CozAcct) return;
  var doc = document.documentElement;

  /* ---------- developer view (DV1): version stamps only on a device with cozDevView = "1" ---------- */
  try { if (localStorage.getItem("cozDevView") === "1") doc.classList.add("coz-dev"); } catch (e) {}

  /* ---------- display preferences, saved on this device ---------- */
  var PREFS = "cozDisplayPrefs", SIZES = ["standard", "large", "larger"];
  var mq = null; try { mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null; } catch (e) {}
  function deviceReduce(){ return !!(mq && mq.matches); }
  /* the saved choice, or null; reduceMotion is null until someone saves a choice (the device's setting applies) */
  function readPrefs(){
    try {
      var p = JSON.parse(localStorage.getItem(PREFS) || "null");
      if (!p || typeof p !== "object") return null;
      return { textSize: SIZES.indexOf(p.textSize) >= 0 ? p.textSize : "standard",
               reduceMotion: typeof p.reduceMotion === "boolean" ? p.reduceMotion : null };
    } catch (e) { return null; }
  }
  function effective(p){
    return { textSize: p && SIZES.indexOf(p.textSize) >= 0 ? p.textSize : "standard",
             reduceMotion: p && typeof p.reduceMotion === "boolean" ? p.reduceMotion : deviceReduce() };
  }
  function apply(e){ doc.setAttribute("data-coz-text", e.textSize); doc.setAttribute("data-coz-motion", e.reduceMotion ? "reduce" : "full"); }
  /* resolves only once the choice is really stored (read back), so "saved" is never shown for a write that failed */
  function savePrefs(next){
    return new Promise(function (res, rej) {
      var rec = { v: 1, textSize: SIZES.indexOf(next.textSize) >= 0 ? next.textSize : "standard", reduceMotion: !!next.reduceMotion,
                  savedAt: new Date().toISOString() };
      try { localStorage.setItem(PREFS, JSON.stringify(rec)); } catch (e) { rej(e); return; }
      var back = readPrefs();
      if (!back || back.textSize !== rec.textSize || back.reduceMotion !== rec.reduceMotion) { rej(new Error("not stored")); return; }
      res(back);
    });
  }
  apply(effective(readPrefs()));
  function follow(){ if (!CozAcct.previewing) apply(effective(readPrefs())); }
  /* a page brought back by Safari's Back follows what is saved (Settings re-applies its own unsaved preview) */
  window.addEventListener("pageshow", function (ev) { if (ev.persisted) follow(); });
  try { mq && (mq.addEventListener ? mq.addEventListener("change", follow) : mq.addListener(follow)); } catch (e) {}

  /* ---------- the account service: not connected on this site yet ---------- */
  var UNAVAILABLE = "This will be available once you can sign in to your CozAlyze account.";   /* approved, Oct 14 */
  var SIGNED_OUT = "You aren’t signed in. Accounts aren’t available yet.";              /* approved, Oct 14 */
  var CozAccount = {
    connected: false,
    /* the signed-in account, or null: nobody can sign in until a sign-in provider is connected */
    session: function () { return Promise.resolve(null); },
    /* every account operation (profile, birth details, purchases, receipts, email preferences, password, export,
       deletion) goes through here; with no service connected each one answers "unavailable" and nothing is changed */
    call: function (op) {
      var e = new Error(UNAVAILABLE); e.code = "unavailable"; e.op = op;
      return Promise.reject(e);
    }
  };

  /* ---------- the on-page message (the approved CS1.8 panel look), with one or more buttons ---------- */
  var open = null;
  function close(run){
    if (!open) return;
    var o = open; open = null;
    o.node.remove();
    o.inerted.forEach(function (el) { el.removeAttribute("inert"); });
    document.removeEventListener("keydown", o.keys, true);
    if (typeof run === "function") run();
    else if (o.from && o.from.isConnected) { try { o.from.focus({ preventScroll: true }); } catch (e) {} }
  }
  /* opts: { title, text, paragraphs: [...], buttons: [[label, fn], ...], cancel: index of the button Escape presses, from } */
  function note(opts){
    close();
    var n = document.createElement("div"); n.id = "acctNote";
    n.setAttribute("role", opts.title ? "dialog" : "alertdialog"); n.setAttribute("aria-modal", "true");
    var box = document.createElement("div"); box.className = "box";
    if (opts.title) {
      var h = document.createElement("h2"); h.id = "acctNoteTitle"; h.textContent = opts.title; box.appendChild(h);
      n.setAttribute("aria-labelledby", "acctNoteTitle");
    }
    var ids = [];
    (opts.paragraphs || [opts.text]).forEach(function (t, i) {
      if (!t) return;
      var p = document.createElement("p"); p.id = "acctNoteP" + i; p.textContent = t; box.appendChild(p); ids.push(p.id);
    });
    n.setAttribute("aria-describedby", ids.join(" "));
    var row = document.createElement("div"); row.className = "pills";
    var buttons = (opts.buttons && opts.buttons.length ? opts.buttons : [["OK"]]).map(function (b) {
      var el = document.createElement("button"); el.type = "button"; el.className = "pill"; el.textContent = b[0];
      el.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); close(b[1]); });
      row.appendChild(el); return el;
    });
    box.appendChild(row); n.appendChild(box);
    n.addEventListener("click", function (ev) { ev.stopPropagation(); });   /* taps on the message never reach the page */
    var inerted = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el.tagName !== "SCRIPT" && el.tagName !== "STYLE" && !el.hasAttribute("inert")) { el.setAttribute("inert", ""); inerted.push(el); }
    });
    var cancelAt = typeof opts.cancel === "number" ? opts.cancel : buttons.length - 1;
    function keys(ev){
      if (ev.key === "Escape") { ev.preventDefault(); buttons[cancelAt].click(); }
      else if (ev.key === "Tab") {                                             /* focus stays on the message's buttons */
        var i = buttons.indexOf(document.activeElement);
        ev.preventDefault();
        buttons[(i + (ev.shiftKey ? buttons.length - 1 : 1) + buttons.length) % buttons.length].focus();
      }
    }
    document.addEventListener("keydown", keys, true);
    document.body.appendChild(n);
    open = { node: n, inerted: inerted, keys: keys, from: opts.from || document.activeElement };
    try { buttons[typeof opts.focus === "number" ? opts.focus : cancelAt].focus({ preventScroll: true }); } catch (e) {}
    try { console.log("[COZ ACCOUNT] message: " + (opts.title ? opts.title + ": " : "") + (opts.paragraphs || [opts.text]).join(" ")); } catch (e) {}
    return n;
  }
  function tell(text, from){ return note({ text: text, from: from }); }

  /* Terms and Privacy (not published yet) and every control that needs an account */
  var UNPUBLISHED = { terms: "The Terms page isn’t published yet.", privacy: "The Privacy page isn’t published yet." };   /* approved, Oct 14 */
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest("[data-unpublished],[data-needs-account]");
    if (!t) return;
    ev.preventDefault();
    if (t.hasAttribute("data-unpublished")) tell(UNPUBLISHED[t.getAttribute("data-unpublished")] || UNPUBLISHED.privacy, t);
    else tell(UNAVAILABLE, t);
  });

  /* ---------- this device's saved charts, one entry per chart run (its stable run ID) ---------- */
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function parse(s){ try { return JSON.parse(s); } catch (e) { return null; } }
  function longDate(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : ""; }
  function shortDay(iso){ var d = new Date(iso); return isNaN(d) ? "" : MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate(); }
  function shortDate(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? MONTHS[+m[2] - 1].slice(0, 3) + " " + (+m[3]) + ", " + m[1] : ""; }
  /* the birth record a saved chart was made from; only one that belongs to that same run counts */
  function birthOf(rec){
    var bd = rec && rec.snapshot ? parse(rec.snapshot.emergeBirthData) : null;
    return bd && typeof bd === "object" && bd.runId === rec.runId ? bd : null;
  }
  /* resolves to [{ id: run ID, label, name, birth, chart: record or null, compare: record or null }], newest save first */
  function charts(){
    if (!window.CozSaved || !CozSaved.list) return Promise.reject(new Error("saved charts unavailable"));
    return CozSaved.list().then(function (recs) {
      var by = {}, out = [];
      recs.forEach(function (r) {
        if (!r || typeof r.runId !== "string" || !r.runId) return;
        var g = by[r.runId];
        if (!g) { g = by[r.runId] = { id: r.runId, chart: null, compare: null, birth: null, name: "", savedAt: r.updatedAt || r.savedAt || "" }; out.push(g); }
        if (r.kind === "compare") { if (!g.compare) g.compare = r; }
        else if (r.kind === "chart" && !g.chart) g.chart = r;
        if (!g.birth) g.birth = birthOf(r);
        if (!g.name && r.name) g.name = String(r.name);
      });
      out.forEach(function (g) {
        if (!g.name && g.birth && g.birth.name) g.name = String(g.birth.name);
        var any = g.chart || g.compare;
        g.label = [g.name || "Your Chart", shortDate((g.birth && g.birth.birthDate) || (any && any.birthDate))].filter(Boolean).join(" · ");
      });
      /* two charts that read the same are told apart by when they were saved, then by order */
      var count = {}; out.forEach(function (g) { count[g.label] = (count[g.label] || 0) + 1; });
      out.forEach(function (g) { if (count[g.label] > 1 && g.savedAt) g.label += " · saved " + shortDay(g.savedAt); });
      var seen = {}; out.forEach(function (g) { seen[g.label] = (seen[g.label] || 0) + 1; if (seen[g.label] > 1) g.label += " (" + seen[g.label] + ")"; });
      return out;
    });
  }
  /* The chart selector. Options are keyed by run ID, never by name. The choice is kept in the address (?chart=)
     so a reload or Back keeps it, and for the visit, so Birth Information and Purchases & Access open on the same
     chart. onPick(id) runs for the first choice and every change; it may return false to keep the old choice. */
  var LAST = "cozAcctChart";
  function picker(select, list, onPick){
    select.innerHTML = "";
    list.forEach(function (g) { var o = document.createElement("option"); o.value = g.id; o.textContent = g.label; select.appendChild(o); });
    var want = null; try { want = new URLSearchParams(location.search).get("chart"); } catch (e) {}
    if (!list.some(function (g) { return g.id === want; })) { try { want = sessionStorage.getItem(LAST); } catch (e) { want = null; } }
    if (!list.some(function (g) { return g.id === want; })) want = list.length ? list[0].id : null;
    var current = want;
    function keep(id){
      try { var u = new URL(location.href); u.searchParams.set("chart", id); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (e) {}
      try { sessionStorage.setItem(LAST, id); } catch (e) {}
    }
    if (current) { select.value = current; keep(current); onPick(current); }
    select.addEventListener("change", function () {
      var id = select.value;
      if (id === current) return;
      if (onPick(id, current) === false) { select.value = current; return; }
      current = id; keep(id);
    });
    return { get: function () { return current; }, set: function (id) { if (list.some(function (g) { return g.id === id; })) { current = id; select.value = id; keep(id); } } };
  }

  /* ---------- one submission at a time ---------- */
  function busy(btn, on){
    if (on) { btn.setAttribute("aria-busy", "true"); btn.setAttribute("data-busy", "1"); }
    else { btn.removeAttribute("aria-busy"); btn.removeAttribute("data-busy"); }
  }
  function isBusy(btn){ return btn.getAttribute("data-busy") === "1"; }

  window.CozAccount = CozAccount;
  var CozAcct = window.CozAcct = {
    UNAVAILABLE: UNAVAILABLE, SIGNED_OUT: SIGNED_OUT, UNPUBLISHED: UNPUBLISHED,
    tell: tell, note: note, close: close,
    prefs: { read: readPrefs, effective: effective, apply: apply, save: savePrefs, deviceReduce: deviceReduce, SIZES: SIZES },
    previewing: false,
    charts: charts, picker: picker, longDate: longDate, parse: parse,
    busy: busy, isBusy: isBusy
  };
})();
