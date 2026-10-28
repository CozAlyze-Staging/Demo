/* coz-voice.js · VO1 (Oct 27 2026, his ruling, staging only) · the reading read aloud in the voice the reader chooses.
   Approved preview: voice-preview.html (VP1/VP2). No moving avatar, only the voice.
   - First page of a reading (kind "first"): "Have Your Chart Read By" with the avatar pictures (two on Vedic and
     Tropical, all four on Compare). Tapping one remembers that voice, shows that picture with Pause and Stop, says
     the spoken welcome with the reader's first name, then reads the page.
   - Following pages of the six-section reading (kind "next"): "Have This Page Read" in the remembered voice, or the
     voice buttons when none was chosen yet.
   - Pages of their own, like the Ascendant or Current Transits (kind "page"): "Have This Page Read By" with the
     voice buttons.
   When a section of the six-section reading finishes, the voice turns to the next section and keeps reading, through
   Section 06, as the approved preview says. Text that is still being written is read when it arrives.
   The text comes from the page itself, one paragraph at a time, from the CozAlyze voice server (testers only: the
   tester password saved on this device). Each paragraph is voiced once and kept there, so a replay costs nothing.
   Leaving the page, Stop, or changing section by hand stops the voice.
   VO1.1 (Oct 27 2026, after his first listen, "a bit of a delay"): no silent gaps. The first lines of a page are asked
   for together; the next section's first lines are made while the current section ends; the first long paragraph of
   each page starts with its first sentences as a short piece; the welcome comes in three pieces (VS2.2), so it starts
   about 2 seconds after the tap; and opening a page checks the tester password in advance. Same text, same cost.
   VO1.2 (Oct 27 2026, his ruling): the background music stays on but goes well down while the voice reads, on every
   reading, and comes back up when the voice pauses, stops, finishes or waits for text still being written.
   VO1.3 (Oct 27 2026, his ruling after listening on Tropical, "still too distracting"): when the voice comes on, the
   music fades out over about two seconds to practically nothing (about 40 dB down), on an even decibel curve so it
   eases away rather than cutting (engine e28 fade; an older engine falls back to its straight-line swell). It still
   comes back up the same way when the voice pauses, stops, finishes or waits.
   VO1.4 (Oct 27 2026, his ruling, replaces VO1.2 and VO1.3: "as soon as the person hits play when they're listening
   to their reading, all background music needs to stop"): the moment the reader taps a voice (or Have This Page Read,
   Resume, Play again, Try again), every background loop on the app's sound engine stops: the music bed and the low
   hum under it, and any other bed still running. It goes in 0.4 s, which is heard as stopping at the tap (a hard cut
   clicks). Nothing here brings it back: not Pause, Stop, the end of the reading, a turn to the next section, text
   still being written, or leaving the page. A page that starts the music again on its own (the dashboard's reading
   door, the Ascendant view) still does; tapping play there stops it again. */
(function () {
  if (window.CozVoice) return;
  var SERVER = "https://cozalyze-voice-server.netlify.app";
  var ART = "?v=3";
  var SILENT = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABwAAA5EAUFBQUFBQUFBQUFBQUFBtbW1tbW1tbW1tbW1tbYqKioqKioqKioqKioqKqKioqKioqKioqKioqKioxcXFxcXFxcXFxcXFxcXi4uLi4uLi4uLi4uLi4v//////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQDKgAAAAAAAAORy3JmoQAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";   /* 0.18 s of silence, played inside the tap to unlock audio on iPhone */
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0 13.6 10.4 24 12 13.6 13.6 12 24 10.4 13.6 0 12 10.4 10.4Z"/></svg>';
  var VOICES = {
    vedic:    ["vedic-male", "vedic-female"],
    tropical: ["tropical-male", "tropical-female"],
    compare:  ["vedic-male", "vedic-female", "tropical-male", "tropical-female"]
  };
  var BUTTON = { "vedic-male": "Male Voice", "vedic-female": "Female Voice", "tropical-male": "Male Voice", "tropical-female": "Female Voice" };
  var BUTTON_COMPARE = { "vedic-male": "Vedic Male", "vedic-female": "Vedic Female", "tropical-male": "Western Male", "tropical-female": "Western Female" };
  var MONTHS = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", Jun: "June", Jul: "July", Aug: "August",
                 Sep: "September", Sept: "September", Oct: "October", Nov: "November", Dec: "December" };
  var MAXCHUNK = 1800;     /* the voice server takes up to 2,500 characters at a time */
  var HEAD = 240;          /* VO1.1: the first long paragraph of a page starts with a short piece (its first sentences) */
  var FIRST = 4, AHEAD = 3, KEEP = 30;   /* VO1.1: asked for at the start; asked for ahead while playing; kept on the page */
  /* VO1.4: the app's background music is every loop on the living page's sound engine (emerge-sound.js IS_LOOP):
     the music bed (ambient), the low hum the chart reveal starts (hum), and the other beds. All of them stop at play. */
  var MUSIC = ["ambient", "hum", "voidatm", "choice", "orbit", "calc"];
  var HUSH_S = 0.4;
  var TURN_MS = 900;       /* the pause before the next section opens */
  var WAIT_MS = 2500;      /* how often text still being written is looked for */

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function sysOf(o) { return VOICES[o && o.sys] ? o.sys : "vedic"; }
  function remembered(sys) { var v = get("cozVoice-" + sys); return VOICES[sys].indexOf(v) >= 0 ? v : null; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function warn(m) { try { console.warn("[coz-voice] " + m); } catch (e) {} }

  /* ---------- look: the approved preview, in each page's own colours and fonts (a page can pass its own) ---------- */
  var CSS =
    ".cv{margin:22px 0 4px;text-align:center;" +
      "--cv-gold:var(--vedic-gold,var(--gold,#d4a178));--cv-line:var(--vedic-gold-muted,var(--gold-soft,rgba(212,161,120,.65)));" +
      "--cv-muted:var(--vedic-ivory-muted,var(--cream,rgba(229,212,197,.88)));" +
      "--cv-title-font:var(--display-font,\"Cormorant Garamond\",Georgia,serif);--cv-text-font:var(--body-font,\"Avenir Next\",\"Helvetica Neue\",Arial,sans-serif);" +
      "--cv-title-size:clamp(1.6rem,6.4vw,1.9rem);--cv-title-spacing:normal;--cv-btn-font:var(--cv-text-font);--cv-btn-size:clamp(16px,4.3vw,18px);--cv-btn-spacing:normal}" +
    ".cv--cinzel{--cv-title-size:clamp(1.15rem,4.9vw,1.45rem);--cv-title-spacing:.06em}" +
    ".cv-title{font-family:var(--cv-title-font);font-size:var(--cv-title-size);letter-spacing:var(--cv-title-spacing);font-weight:500;line-height:1.12;color:var(--cv-gold);margin:0 0 14px}" +
    ".cv-title--bar{margin-bottom:6px}" +
    ".cv-options{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}" +
    ".cv-option{flex:0 1 40%;max-width:220px;padding:0;margin:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".cv-option img,.cv-picture{display:block;width:100%;height:auto;border:1px solid var(--cv-line)}" +
    ".cv-picture{margin:0 auto}" +
    ".cv-rule{display:flex;align-items:center;gap:10px;color:var(--cv-gold);margin:10px 0 0}" +
    ".cv-rule:before,.cv-rule:after{content:\"\";flex:1 1 auto;height:1px;background:var(--cv-line)}" +
    ".cv-rule svg{width:14px;height:14px;flex:0 0 auto;display:block}" +
    ".cv-controls{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:6px}" +
    ".cv-controls--bare{margin-top:10px}" +
    ".cv-controls span{font-family:var(--cv-text-font);font-size:clamp(16px,4.3vw,18px);color:var(--cv-muted)}" +
    ".cv button.cv-b{font-family:var(--cv-btn-font);font-size:var(--cv-btn-size);letter-spacing:var(--cv-btn-spacing);font-weight:400;line-height:1.2;color:var(--cv-gold);" +
      "background:transparent;border:0;border-radius:0;padding:0;margin:0;min-height:44px;cursor:pointer;-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent}" +
    ".cv button.cv-cta{font-family:var(--cv-title-font);font-size:var(--cv-title-size);letter-spacing:var(--cv-title-spacing);font-weight:500;line-height:1.12}" +
    ".cv-pair{display:flex;justify-content:center;align-items:center;gap:18px;color:var(--cv-gold)}" +
    ".cv-pair svg{width:14px;height:14px;flex:0 0 auto;display:block}" +
    ".cv button:focus-visible{outline:1px solid var(--cv-line);outline-offset:4px;border-radius:4px}";
  function css() {
    if (document.getElementById("coz-voice-css")) return;
    var st = document.createElement("style"); st.id = "coz-voice-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- the block in each state ---------- */
  function buttonsHtml(sys) {
    var names = sys === "compare" ? BUTTON_COMPARE : BUTTON, list = VOICES[sys], rows = [];
    for (var i = 0; i < list.length; i += 2) {
      rows.push('<div class="cv-pair"><button type="button" class="cv-b cv-pick" data-voice="' + list[i] + '">' + names[list[i]] + '</button>' + STAR +
        '<button type="button" class="cv-b cv-pick" data-voice="' + list[i + 1] + '">' + names[list[i + 1]] + '</button></div>');
    }
    return rows.join("");
  }
  function controlsHtml(label, rule) {   /* the star rule only under the picture; elsewhere the page's own divider is right above */
    return (rule ? '<div class="cv-rule" aria-hidden="true">' + STAR + '</div>' : '') +
      '<div class="cv-controls' + (rule ? '' : ' cv-controls--bare') + '"><button type="button" class="cv-b cv-pause">Pause</button><span>' + esc(label || "") + '</span>' +
      '<button type="button" class="cv-b cv-stop">Stop</button></div>';
  }
  function inner(o, reading, voice) {
    var sys = sysOf(o);
    if (o.kind === "first") {
      if (reading) return '<img class="cv-picture" src="avatars/avatar-' + voice + '.jpg' + ART + '" alt="" width="1024" height="1536">' + controlsHtml(o.label, true);
      return '<div class="cv-title" role="heading" aria-level="2">Have Your Chart Read By</div><div class="cv-options">' +
        VOICES[sys].map(function (v) {
          return '<button type="button" class="cv-option cv-pick" data-voice="' + v + '" aria-label="' + (sys === "compare" ? BUTTON_COMPARE[v] : BUTTON[v]) + '"><img src="avatars/avatar-' + v + '.jpg' + ART +
            '" alt="" width="1024" height="1536" decoding="async"></button>';
        }).join("") + '</div>';
    }
    if (reading) return controlsHtml(o.label, false);
    var mine = o.kind === "next" ? remembered(sys) : null;
    if (mine) return '<button type="button" class="cv-b cv-cta cv-pick" data-voice="' + mine + '">Have This Page Read</button>';
    return '<div class="cv-title cv-title--bar" role="heading" aria-level="2">Have This Page Read By</div>' + buttonsHtml(sys);
  }

  /* ---------- the page's own text, in reading order ---------- */
  function textOf(el) {   /* a line break counts as a space ("YOUR<br>COMBINED" is two words) */
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll("br"), function (b) { b.parentNode.replaceChild(document.createTextNode(" "), b); });
    return (c.textContent || "").replace(/\s+/g, " ").trim();
  }
  function collect(root, opt) {
    opt = opt || {};
    if (!root) return [];
    var sel = opt.include || "h1,h2,h3,h4,p,li,dt,dd",
        ex = ".cv,nav,script,style,[hidden],.dev,.dev-label" + (opt.exclude ? "," + opt.exclude : "");
    var out = [];
    [].forEach.call(root.querySelectorAll(sel), function (el) {
      if (el.closest(ex)) return;
      for (var p = el.parentElement; p && p !== root; p = p.parentElement) if (p.matches && p.matches(sel)) return;   /* counted with its parent */
      var t = textOf(el);
      if (t) out.push({ text: t, el: el });
    });
    return out;
  }
  /* what is said: headings set in capitals are read as words, and the page's date and pair signs as words */
  function speech(t) {
    t = String(t == null ? "" : t).replace(/\s+/g, " ").trim();
    if (t.length > 3 && /[A-Z]/.test(t) && !/[a-z]/.test(t)) t = t.toLowerCase().replace(/(^|[\s(\/–—-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
    return t.replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?(?=\s+\d)/g, function (m, a) { return MONTHS[a]; })
            .replace(/\s*·\s*/g, ", ")
            .replace(/(\d)\s*–\s*(?=[A-Za-z0-9])/g, "$1 to ")
            .replace(/([A-Za-z])\s*–\s*(?=[A-Za-z])/g, "$1, ")
            .replace(/\s\+\s/g, " and ");
  }
  var SENT = /[^.!?]+[.!?]+["'\u201D\u2019)]*\s*|[^.!?]+$/g;   /* one sentence, with its closing quote and space */
  function split(t) {   /* a long paragraph goes in pieces, at sentence ends */
    if (t.length <= MAXCHUNK) return [t];
    var parts = t.match(SENT) || [t], out = [], cur = "";
    parts.forEach(function (s) {
      if ((cur + s).length > MAXCHUNK && cur) { out.push(cur.trim()); cur = ""; }
      while (s.length > MAXCHUNK) { out.push(s.slice(0, MAXCHUNK)); s = s.slice(MAXCHUNK); }
      cur += s;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function chunksFrom(items) {
    var out = [], headDone = false;
    (items || []).forEach(function (it) {
      var raw = typeof it === "string" ? it : it && it.text, el = it && typeof it === "object" ? it.el || null : null;
      var t = speech(raw); if (!t) return;
      var pieces = null;
      if (!headDone && t.length > HEAD) {   /* VO1.1: the first long paragraph starts with its first sentences, so it is ready sooner */
        headDone = true;
        var sents = t.match(SENT) || [t], head = "";
        for (var j = 0; j < sents.length && (head + sents[j]).length <= HEAD; j++) head += sents[j];
        if (head.trim() && head.length < t.length) pieces = [head.trim()].concat(split(t.slice(head.length).trim()));
      }
      (pieces || split(t)).forEach(function (c) { out.push({ text: c, el: el }); });
    });
    return out;
  }
  function texts(o) { try { return o.collect ? o.collect() || [] : []; } catch (e) { warn(e && e.message); return []; } }
  function firstName() {
    var n = "";
    try { n = ((JSON.parse(get("emergeBirthData") || "null") || {}).name) || ""; } catch (e) {}
    if (!n) try { var c = JSON.parse(get("cozChartJSON") || "null"); n = c && c.person && (c.person.firstName || c.person.name) || ""; } catch (e) {}
    return String(n).trim().split(/\s+/)[0] || "";
  }

  /* ---------- playing: one audio element for the whole page; the first tap unlocks it, as iPhone requires ---------- */
  var player = null, S = null, seq = 0, pending = null;
  function audio() {
    if (!player) {
      player = new Audio(); player.preload = "auto"; player.setAttribute("playsinline", "");
      player.addEventListener("ended", function () { var s = S; if (s && s.phase === "playing" && s.cur === s.i) advance(s); });   /* the unlock clip ending is not a paragraph ending */
      player.addEventListener("error", function () { var s = S; if (s && s.phase === "playing" && s.cur === s.i) phase(s, "error"); });
    }
    return player;
  }
  function unlock() { var a = audio(); try { a.src = SILENT; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  /* VO1.4: the music stops when the reader taps play, and stays off (the VO1.2/VO1.3 lowering and raising are gone) */
  function engine() {
    try { if (window.parent !== window && window.parent.EMERGE_SOUND) return window.parent.EMERGE_SOUND; } catch (e) {}
    return window.EMERGE_SOUND || null;
  }
  function hush() {
    /* BT2 (Oct 28 2026): the book-to-reading transition's sound (an audio element on the living page) stops too */
    try { var h = window.parent !== window ? window.parent : window, bt = h.__cozBTSound; if (bt && !bt.paused) bt.pause(); } catch (e) {}
    var snd = engine(); if (!snd || !snd.stopLoop) return;   /* no music on this page: nothing to stop */
    MUSIC.forEach(function (n) { try { snd.stopLoop(n, HUSH_S); } catch (e) {} });   /* also cancels a loop still waiting to start */
  }
  /* loading, playing, paused, waiting (text still being written), turning (to the next section), done, error */
  function phase(s, ph) {
    s.phase = ph;
    if (s !== S || !s.el) return;
    var b = s.el.querySelector(".cv-pause");
    if (b) b.textContent = ph === "paused" ? "Resume" : ph === "done" ? "Play again" : ph === "error" ? "Try again" : "Pause";
  }

  /* VO1.1: every piece voiced on this page is kept here (the last 30), whichever reading asked for it, so the next
     section's first lines can be made before it opens and a replay never waits. */
  var STORE = {}, ORDER = [];
  function keyOf(voice, c) { return voice + "|" + (c.welcome ? "welcome" + c.welcome + (c.welcome === 1 ? ":" + firstName() : "") : c.text); }
  function bodyOf(voice, list, i) {
    var c = list[i], prevC = list[i - 1], nextC = list[i + 1];
    if (c.welcome) return { avatar: voice, welcome: true, part: c.welcome, name: firstName(), next: nextC && !nextC.welcome ? nextC.text : "" };
    return { avatar: voice, text: c.text, prev: prevC && !prevC.welcome ? prevC.text : "", next: nextC && !nextC.welcome ? nextC.text : "" };
  }
  function want(voice, list, i) {
    var c = list[i]; if (!c) return Promise.reject(new Error("nothing to read"));
    var k = keyOf(voice, c), e = STORE[k];
    if (e) { ORDER.splice(ORDER.indexOf(k), 1); ORDER.push(k); return e.p; }
    e = { url: null };
    e.p = fetch(SERVER + "/api/speak", {
      method: "POST", headers: { "Content-Type": "application/json", "x-tester-code": get("cozDemoTesterCode") || "" }, body: JSON.stringify(bodyOf(voice, list, i))
    }).then(function (r) {
      if (!r.ok) { warn("the voice server answered " + r.status); throw new Error("voice " + r.status); }
      return r.blob();
    }).then(function (b) { e.url = URL.createObjectURL(b); return e.url; })
      .catch(function (err) { if (STORE[k] === e) { delete STORE[k]; ORDER.splice(ORDER.indexOf(k), 1); } throw err; });
    STORE[k] = e; ORDER.push(k);
    while (ORDER.length > KEEP) {
      var old = ORDER.shift(), oe = STORE[old]; delete STORE[old];
      if (oe && oe.url && !(player && player.src === oe.url)) { try { URL.revokeObjectURL(oe.url); } catch (x) {} }
    }
    return e.p;
  }
  function fetchChunk(s, i) { return want(s.voice, s.chunks, i); }
  function aheadNext(s) {   /* VO1.1: the next section's first lines, made while this one ends */
    if (s.nextAsked || !s.o.then || !s.o.nextTexts) return;
    s.nextAsked = true;
    var list = []; try { list = chunksFrom(s.o.nextTexts() || []); } catch (e) {}
    for (var k = 0; k < 2 && k < list.length; k++) want(s.voice, list, k).catch(function () {});
  }
  function playChunk(s, i) {
    if (s !== S) return;
    s.i = i; s.cur = -1; s.mid = false; phase(s, "loading");
    var c = s.chunks[i];
    if (c && c.el && s.o.follow) { try { s.o.follow(c.el); } catch (e) {} }   /* e.g. open the drop-down being read */
    fetchChunk(s, i).then(function (u) {
      if (s !== S || s.i !== i || s.phase !== "loading") return;   /* paused, stopped or moved on while it loaded */
      var a = audio(); a.src = u; s.cur = i; phase(s, "playing");
      var p = a.play(); if (p && p.catch) p.catch(function () { if (s === S && s.cur === i && s.phase === "playing") phase(s, "error"); });
      for (var k = 1; k <= AHEAD; k++) if (s.chunks[i + k]) fetchChunk(s, i + k).catch(function () {});   /* the next ones get ready while this plays */
      if (i >= s.chunks.length - 2) aheadNext(s);
    }, function () { if (s === S && s.i === i && s.phase === "loading") phase(s, "error"); });
  }
  function refresh(s) {   /* text written while they listened: read too (pages only ever add text at the end) */
    var now = chunksFrom(texts(s.o));
    if (now.length <= s.textCount) return false;
    s.chunks = s.chunks.concat(now.slice(s.textCount)); s.textCount = now.length;
    return true;
  }
  function advance(s) {
    if (s !== S) return;
    clearTimeout(s.wait);
    if (s.i + 1 < s.chunks.length || refresh(s)) { playChunk(s, s.i + 1); return; }
    var more = false; try { more = !!(s.o.more && s.o.more()); } catch (e) {}
    if (more) {   /* the rest is still being written: read it the moment it is on the page */
      phase(s, "waiting");
      s.wait = setTimeout(function () { if (s === S && s.phase === "waiting") advance(s); }, WAIT_MS);
      return;
    }
    var then = s.o.then;
    if (then && then.key && then.hash) {   /* the next section of the reading, in the same voice */
      phase(s, "turning");
      s.turn = setTimeout(function () {
        if (s !== S || s.phase !== "turning") return;
        pending = { key: then.key, hash: then.hash, voice: s.voice };
        location.hash = then.hash;
      }, TURN_MS);
      return;
    }
    phase(s, "done");
  }
  function start(el, o, voice, auto) {
    stop();
    hush();                                              /* VO1.4: the music stops at the tap */
    if (!auto) unlock();                                 /* inside the tap */
    if (o.kind === "first" || o.kind === "next" || o.remember) set("cozVoice-" + sysOf(o), voice);   /* the pages after this one use it */
    var chunks = chunksFrom(texts(o));
    var welcome = o.kind === "first" && !auto ? [{ welcome: 1, text: "" }, { welcome: 2, text: "" }, { welcome: 3, text: "" }] : [];   /* VS2.2: the welcome in three pieces */
    var s = { el: el, o: o, voice: voice, hash: location.hash, id: ++seq,
              chunks: welcome.concat(chunks), textCount: chunks.length, i: -1, cur: -1, phase: "loading", mid: false };
    S = s;
    el.innerHTML = inner(o, true, voice); hook(el, o);
    if (!s.chunks.length) { advance(s); return; }
    playChunk(s, 0);
    for (var k = 1; k < FIRST && k < s.chunks.length; k++) fetchChunk(s, k).catch(function () {});   /* VO1.1: the first lines together */
  }
  function stop() {
    var s = S; S = null; pending = null;
    if (player) { try { player.pause(); } catch (e) {} }   /* VO1.4: the music stays off */
    if (!s) return;
    clearTimeout(s.wait); clearTimeout(s.turn);
    if (s.el && s.el.isConnected) { s.el.innerHTML = inner(s.o, false); hook(s.el, s.o); }
  }
  function onPause(el) {
    var s = S; if (!s || s.el !== el) return;
    if (s.phase === "playing") { try { audio().pause(); } catch (e) {} s.mid = true; phase(s, "paused"); return; }
    if (s.phase === "loading" || s.phase === "waiting") { s.mid = false; s.held = s.phase; clearTimeout(s.wait); phase(s, "paused"); return; }
    if (s.phase === "turning") { clearTimeout(s.turn); phase(s, "done"); return; }   /* stay on this section */
    hush();                                              /* VO1.4: Resume, Play again and Try again are play taps too */
    if (s.phase === "paused") {
      if (s.mid) {
        var p = audio().play(); phase(s, "playing");
        if (p && p.catch) p.catch(function () { if (s === S && s.phase === "playing") { s.mid = false; phase(s, "error"); } });
        return;
      }
      if (s.held === "waiting") { s.held = null; phase(s, "waiting"); advance(s); return; }
      unlock(); playChunk(s, s.i); return;
    }
    if (s.phase === "done") { unlock(); playChunk(s, 0); return; }   /* Play again */
    if (s.phase === "error") { unlock(); playChunk(s, s.i < 0 ? 0 : s.i); }   /* Try again: the same paragraph */
  }
  function hook(el, o) {
    [].forEach.call(el.querySelectorAll(".cv-pick"), function (b) {
      b.addEventListener("click", function () { start(el, o, b.getAttribute("data-voice"), false); });
    });
    var pause = el.querySelector(".cv-pause");
    if (pause) pause.addEventListener("click", function () { onPause(el); });
    var stopB = el.querySelector(".cv-stop");
    if (stopB) stopB.addEventListener("click", function () { if (S && S.el === el) stop(); });
  }

  /* Put the block on the page and make it work.
     where: an element; how: "beforebegin" | "afterbegin" | "beforeend" | "afterend".
     o: { sys: "vedic" | "tropical" | "compare", kind: "first" | "next" | "page", label, key (this page or section),
          collect: () => the page's text, more: () => true while text is still being written,
          then: { key, hash } (the next section), nextTexts: () => the next section's text (VO1.1, made ahead),
          follow: (element being read) => ..., font: "cinzel", style: { css property or --cv- variable: value } } */
  var warmed = false;
  function warm() {   /* VO1.1: a reading page opened: the voice server checks the tester password now, nothing is voiced */
    var code = get("cozDemoTesterCode");
    if (warmed || !code) return;
    warmed = true;
    try { fetch(SERVER + "/api/speak", { method: "POST", headers: { "Content-Type": "application/json", "x-tester-code": code }, body: '{"warm":true}' }).catch(function () {}); } catch (e) {}
  }
  function attach(where, how, o) {
    if (!where || !o) return null;
    try {
      css(); warm();
      var el = document.createElement("div");
      el.className = "cv" + (o.font === "cinzel" ? " cv--cinzel" : "");
      el.setAttribute("role", "region"); el.setAttribute("aria-label", "Have this read aloud");
      if (o.style) Object.keys(o.style).forEach(function (k) { el.style.setProperty(k, o.style[k]); });   /* the page's own fonts, colours, column */
      where.insertAdjacentElement(how || "afterend", el);
      /* the page redrew this section while it was being read (new text arrived): the reading carries on in the new block */
      if (S && o.key && S.o.key === o.key && !(S.el && S.el.isConnected)) {
        S.el = el; S.o = o; el.innerHTML = inner(o, true, S.voice); hook(el, o); phase(S, S.phase);
        return el;
      }
      el.innerHTML = inner(o, false); hook(el, o);
      /* the previous section finished and turned to this one: keep reading, in the same voice */
      if (pending && o.key && pending.key === o.key && pending.hash === location.hash) { var v = pending.voice; pending = null; start(el, o, v, true); }
      return el;
    } catch (e) { warn(e && e.message); return null; }
  }

  window.addEventListener("hashchange", function () {
    if (S && S.hash === location.hash) return;          /* the reading that just started on this section (the page drew it first) */
    var keep = pending && pending.hash === location.hash ? pending : null;
    stop(); pending = keep;                             /* a hand-made change of section stops the voice; the music stays off either way */
  });
  window.addEventListener("pagehide", function () { stop(); });
  window.CozVoice = { attach: attach, collect: collect, stop: stop, speech: speech };
})();
