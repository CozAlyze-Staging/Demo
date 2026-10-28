/* PG3 (Oct 28 2026, staging): the closing note never prints alone on the last page.
   PG1 asked the closing note (.doc-footer) to stay with what comes before it ("break-before: avoid"), but iOS Safari
   ignores that rule: in two of Jason's three Oct 28 PDFs the note printed alone on page 8. So, just before printing, the
   last paragraph of the last section and the closing note are put together in one block that is never split
   (.doc-keep-end, saved-document.css). When the page has room for both, nothing changes on paper; when it does not, the
   last paragraph goes over with the note, so the last page always has reading text on it. A spacer carries the
   section's own rule, so the printed look stays the same. Everything goes back where it was after printing, and the
   screen never changes. It only acts when the note and that section share the same document card, so the Compare
   chart view (whose note sits on its own card) is left as it is. */
(function () {
  "use strict";
  var moved = null;
  function keep(){
    if (moved) return;
    try {
      var foot = document.querySelector(".doc-footer");
      if (!foot || !foot.parentNode) return;
      var secs = foot.parentNode.querySelectorAll(":scope > .doc-section"), last = null;
      for (var i = secs.length - 1; i >= 0 && !last; i--) { var ps = secs[i].querySelectorAll(".doc-copy p"); if (ps.length) last = { section: secs[i], p: ps[ps.length - 1] }; }
      if (!last || !last.p.parentNode) return;
      var wrap = document.createElement("div"), rule = document.createElement("div");
      wrap.className = "doc-keep-end"; rule.className = "doc-keep-rule";
      moved = { foot: foot, parent: foot.parentNode, next: foot.nextSibling, p: last.p, wrap: wrap, section: last.section };
      last.p.parentNode.insertBefore(wrap, last.p);
      wrap.appendChild(last.p); wrap.appendChild(rule); wrap.appendChild(foot);
      last.section.classList.add("doc-keep-host");
    } catch (e) { restore(); }                                         /* on any error the page prints as before */
  }
  function restore(){
    if (!moved) return;
    var m = moved; moved = null;
    try {
      if (m.wrap.parentNode) m.wrap.parentNode.insertBefore(m.p, m.wrap);
      m.parent.insertBefore(m.foot, m.next && m.next.parentNode === m.parent ? m.next : null);
      if (m.wrap.parentNode) m.wrap.parentNode.removeChild(m.wrap);
      m.section.classList.remove("doc-keep-host");
    } catch (e) {}
  }
  window.addEventListener("beforeprint", keep);
  window.addEventListener("afterprint", restore);
  window.CozPrintKeep = { keep: keep, restore: restore };              /* for the offline print test */
})();
