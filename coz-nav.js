/* COZ NAV · NAV1 (Oct 24 2026, staging only) · page-opening message, dashboard Home, Account
   Jason's rulings with Chat (Tom's test, Oct 23):
   - A tap that opens another page: if this page is still showing 8 seconds later, a message appears:
       "This page is taking longer than usual to open. You can try again."      [Cancel] [Try again]
     If the phone is offline (when tapped, or when the 8 seconds pass):
       "You're offline. Reconnect, then tap Try again."                          [Cancel] [Try again]
   - Try again only repeats the page change. A link or a dashboard door opens its address again. A
     control the page handles itself (Saved, a saved-chart card, Create a New Chart, the Your Ascendants
     cards, a birth chart's Back) is tapped again, so it saves, reopens or moves on exactly as the first
     tap did. Nothing in this file starts a reading or sends a request to a reading server.
   - Cancel closes the message. The message goes away by itself when the next page opens, and it is
     cleared when a page comes back from Safari's Back cache.
   - Home on the three dashboards (Vedic, Tropical, Compare) returns to the platform's start page
     (index.html). The current chart and its readings stay on the phone. Saved Charts is unchanged.
   - Account, on every page: "Your account page is coming soon."                  [OK]
   - Look: the on-page message panel already approved for Compare saves (coz-saved.js CS1.8): Saved
     Charts' panel strip, its text style and its pills; pill text at least 15 px (RD1).
   Not used on the hidden pre-write page (?pregen=1) or inside an embedded chart (?in=compare). */
(function () {
  if (window.CozNav) return;
  if (/[?&](pregen=1|in=compare)\b/.test(location.search)) return;

  var WAIT_MS = 8000;
  var SLOW = "This page is taking longer than usual to open. You can try again.";
  var OFFLINE = "You’re offline. Reconnect, then tap Try again.";
  var ACCOUNT = "Your account page is coming soon.";
  /* the Saved controls, exactly as coz-saved.js finds them */
  var SAVED_SEL = '[data-dash="saved"],[data-foot="saved"],.nav a.saved,a[aria-label="Saved"],button[aria-label="Saved"]';
  var ACCOUNT_SEL = '[data-dash="account"],[data-foot="account"],[data-nav="account"],a.acct,a.nav-acct,a[aria-label="Account"],a[aria-label="Profile"],button[aria-label="Account"]';
  /* controls whose page change is made by the page's own script */
  var SCRIPT_SEL = '#create,#backBtn,#wTog,#vTog,#comb';
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  var DASHBOARD = { "vedic-reading": 1, "tropical-reading": 1, "compare-reading": 1 };
  var START = new URL("index.html", location.href).href;

  var timer = null, retry = null, panel = null;

  /* ---------- the message panel (CS1.8 style) ---------- */
  function css(){
    if (document.getElementById("cozNavNoteCSS")) return;
    var st = document.createElement("style"); st.id = "cozNavNoteCSS";
    st.textContent =
      "#cozNavNote{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:transparent;" +
        "padding:0 0 env(safe-area-inset-bottom);-webkit-tap-highlight-color:transparent}" +
      "#cozNavNote .box{width:min(100%,640px);container-type:inline-size;--K:calc(100cqw / 1185);" +
        "background:url('sc-mid.png?v=1') center top/100% 1px repeat-y #00050f;color:#EEE7D8;text-align:center;" +
        "padding:calc(40 * var(--K)) calc(120 * var(--K));display:flex;flex-direction:column;align-items:center;gap:calc(30 * var(--K))}" +
      "#cozNavNote .msg{font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;font-weight:300;font-size:max(15px,calc(36 * var(--K)));line-height:1.5;margin:0}" +
      "#cozNavNote .pills{display:flex;gap:calc(30 * var(--K));flex-wrap:wrap;justify-content:center}" +
      "#cozNavNote .pill{position:relative;font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;font-weight:300;font-size:max(15px,calc(30 * var(--K)));line-height:1;color:#EEE7D8;" +
        "background:none;cursor:pointer;border:1.5px solid #C9A27C;border-radius:999px;height:calc(59 * var(--K));min-height:30px;" +
        "padding:0 calc(36 * var(--K));display:inline-flex;align-items:center;-webkit-tap-highlight-color:transparent}" +
      "#cozNavNote .pill::after{content:\"\";position:absolute;left:-6px;right:-6px;top:50%;height:44px;transform:translateY(-50%)}" +
      "#cozNavNote .pill:focus-visible{outline:1px solid #F2C898;outline-offset:2px}";
    document.head.appendChild(st);
  }
  function close(){
    if (panel) { panel.remove(); panel = null; }
  }
  /* buttons: [[label, onTap], ...] */
  function show(text, buttons){
    if (document.getElementById("cozSaveNote")) return;            /* a Save message is already up */
    css(); close();
    var n = document.createElement("div"); n.id = "cozNavNote";
    n.setAttribute("role", "alertdialog"); n.setAttribute("aria-modal", "true"); n.setAttribute("aria-describedby", "cozNavNoteMsg");
    var box = document.createElement("div"); box.className = "box";
    var m = document.createElement("p"); m.className = "msg"; m.id = "cozNavNoteMsg"; m.setAttribute("aria-live", "assertive"); m.textContent = text;
    var row = document.createElement("div"); row.className = "pills";
    var last = null;
    buttons.forEach(function (b) {
      var el = document.createElement("button"); el.type = "button"; el.className = "pill"; el.textContent = b[0];
      el.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); b[1](); });
      row.appendChild(el); last = el;
    });
    n.addEventListener("click", function (ev) { ev.stopPropagation(); });   /* taps on the message never reach the page */
    box.appendChild(m); box.appendChild(row); n.appendChild(box); document.body.appendChild(n);
    panel = n;
    try { last && last.focus({ preventScroll: true }); } catch (e) {}
    try { console.log("[COZ NAV] message: " + text); } catch (e) {}
  }

  /* ---------- watching a page change ---------- */
  function offline(){ return navigator.onLine === false; }
  function stop(){ clearTimeout(timer); timer = null; }
  function cancel(){ stop(); retry = null; close(); }
  function slowOrOffline(){ show(offline() ? OFFLINE : SLOW, [["Cancel", cancel], ["Try again", again]]); }
  function watch(fn){
    stop(); close(); retry = fn;
    if (offline()) { slowOrOffline(); return; }
    timer = setTimeout(function () { timer = null; if (retry) slowOrOffline(); }, WAIT_MS);
  }
  function again(){
    var fn = retry; close();
    if (!fn) return;
    if (offline()) { slowOrOffline(); return; }                   /* still offline: nothing is attempted */
    watch(fn);
    try { fn(); } catch (e) {}
  }
  function goTo(url){ return function () { location.href = url; }; }
  function tapAgain(el){ return function () { if (el && el.isConnected) el.click(); }; }
  function goStart(){ try { window.top.location.href = START; } catch (e) { location.href = START; } }

  /* the page changes; a page brought back from the Back cache shows no old message */
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", function (ev) { if (ev.persisted) cancel(); });

  /* which kind of control was tapped: null if it does not open another page */
  function kindOf(el){
    if (!el || !el.closest) return null;
    var a;
    if ((a = el.closest(ACCOUNT_SEL))) return { k: "account", el: a };
    if (DASHBOARD[page] && (a = el.closest('.hot[data-dash="home"]'))) return { k: "home", el: a };
    if (page !== "saved-charts" && (a = el.closest(SAVED_SEL))) return { k: "script", el: a };
    if (page === "compare-reading" && (a = el.closest('.hot[data-dash="ascendant"]'))) return { k: "script", el: a };
    if (page === "saved-charts" && !/[?&]chart=demo\b/.test(location.search) && (a = el.closest(".card")) &&
        !el.closest(".mark") && !a.classList.contains("confirming")) return { k: "script", el: a };
    if ((a = el.closest(SCRIPT_SEL))) return { k: "script", el: a };
    if ((a = el.closest("[data-href]"))) return { k: "url", el: a, url: new URL(a.getAttribute("data-href"), location.href).href };
    if ((a = el.closest("a[href]"))) {
      var h = a.getAttribute("href") || "";
      if (!h || h.charAt(0) === "#" || /^(javascript|mailto|tel):/i.test(h) || a.target === "_blank" || a.hasAttribute("download")) return null;
      var u; try { u = new URL(h, location.href); } catch (e) { return null; }
      if (u.origin !== location.origin) return null;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return null;   /* same page, another section */
      return { k: "link", el: a, url: u.href };
    }
    return null;
  }

  /* Seen first (window, capture), before any page script, so a handler that stops the tap does not
     hide it. The decision waits until the tap has finished, when every page handler has run. */
  window.addEventListener("click", function (ev) {
    if (panel && panel.contains(ev.target)) return;
    var t = kindOf(ev.target);
    if (!t) return;
    if (t.k === "account") { ev.preventDefault(); show(ACCOUNT, [["OK", cancel]]); return; }
    if (t.k === "home") { ev.preventDefault(); watch(goStart); if (!offline()) goStart(); return; }   /* offline: the message only */
    var held = t.k === "link" && offline();
    if (held) ev.preventDefault();                                  /* offline: a link is not tried until Try again */
    setTimeout(function () {
      if (t.k === "url") { watch(goTo(t.url)); return; }
      if (t.k === "script") { watch(tapAgain(t.el)); return; }
      /* a link: if no page script stopped it, the browser is opening its address */
      if (held || !ev.defaultPrevented) { watch(goTo(t.url)); return; }
      /* stopped by the page: a repeat tap the page ignores while a change is already watched,
         or a link the page opens by its own script */
      if (timer || panel) return;
      watch(tapAgain(t.el));
    }, 0);
  }, true);

  window.CozNav = { WAIT_MS: WAIT_MS, SLOW: SLOW, OFFLINE: OFFLINE, ACCOUNT: ACCOUNT,
    state: function () { return { watching: !!timer, message: panel ? panel.querySelector(".msg").textContent : null }; } };
})();
