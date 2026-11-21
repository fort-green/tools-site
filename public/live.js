// Fort Green tools hub: live door count tile. Reads the clicker counts for shifts running now
// at every venue. Fort Green staff only. One job shows large; several show together as a gallery.
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hhmm(t) { return new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }); }
  function ago(t) {
    var m = Math.round((Date.now() - Date.parse(t)) / 60000);
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : "at " + hhmm(t);
  }

  function slideHTML(s) {
    var cap = s.capacity, inside = Math.max(0, s.inside || 0);
    var pct = cap ? Math.round(inside / cap * 100) : null;
    var level = pct == null ? "" : pct >= 100 ? " lv-stop" : pct >= 90 ? " lv-caution" : "";
    var groups = (s.groups || []).filter(function (g) { return g.arrivals || g.departures || g.id; });
    var link = "/portal/#live&v=" + encodeURIComponent(s.venue_id);
    return '<a class="wx-slide lv-slide" href="' + link + '">' +
      '<div class="wx-place"><b>' + esc(s.venue) + '</b><span>' + esc(s.title) + ' · ' + hhmm(s.starts_at) + '–' + hhmm(s.ends_at) + '</span></div>' +
      (s.started ? '' : '<p class="lv-note">Starts at ' + hhmm(s.starts_at) + '</p>') +
      '<div class="wx-now lv-now' + level + '"><b>' + inside + '</b><span>' + (cap ? 'of ' + cap + ' inside' : 'inside now') + '</span></div>' +
      (cap ? '<div class="lv-bar' + level + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + cap + '" aria-valuenow="' + inside +
        '" aria-label="' + esc(s.venue) + ' capacity"><i style="width:' + Math.min(100, pct) + '%"></i></div><p class="lv-pct' + level + '">' + pct + '% of capacity' +
        (pct >= 100 ? ': at capacity' : pct >= 90 ? ': nearly full' : '') + '</p>' : '') +
      '<p class="lv-in">' + (s.arrivals || 0) + ' in · ' + (s.departures || 0) + ' out' +
      (groups.length > 1 ? '<br>' + groups.map(function (g) { return esc(g.name) + ' ' + Math.max(0, g.inside) + (g.expected ? '/' + g.expected : ''); }).join(' · ') : '') + '</p>' +
      '</a>';
  }

  // Compact cell for the gallery when several jobs are counting at once
  function cellHTML(s) {
    var cap = s.capacity, inside = Math.max(0, s.inside || 0);
    var pct = cap ? Math.round(inside / cap * 100) : null;
    var level = pct == null ? "" : pct >= 100 ? " lv-stop" : pct >= 90 ? " lv-caution" : "";
    return '<a class="lv-cell" href="/portal/#live&v=' + encodeURIComponent(s.venue_id) + '">' +
      '<span class="v">' + esc(s.venue) + '</span><span class="s">' + esc(s.title) + ' · ' + hhmm(s.starts_at) + '–' + hhmm(s.ends_at) + (s.started ? "" : " (not started)") + '</span>' +
      '<span class="n' + level + '">' + inside + '<small>' + (cap ? 'of ' + cap + (pct >= 100 ? ' · full' : '') : 'inside') + '</small></span>' +
      (cap ? '<span class="lv-bar' + level + '" aria-hidden="true"><i style="width:' + Math.min(100, pct) + '%"></i></span>' : '') +
      '<span class="s">' + (s.arrivals || 0) + ' in · ' + (s.departures || 0) + ' out' + (s.last_tap_at ? ' · ' + ago(s.last_tap_at) : '') + '</span></a>';
  }

  async function load(sb) {
    var r = await sb.functions.invoke("client-portal", { body: { action: "live" } });
    if (r.error || !r.data) throw new Error("Live counts are unavailable right now.");
    if (r.data.error) throw new Error(r.data.error);
    return r.data;
  }

  // Shows the card when the person has venues; keeps it fresh every 20 seconds and
  // cycles through venues every 3 seconds (pausing while someone is using the tile).
  async function mountCard(card, sb) {
    if (!card || !sb) return;
    var body = card.querySelector("[data-lv-body]"), foot = card.querySelector("[data-lv-foot]");
    if (card._lvRefresh) clearInterval(card._lvRefresh);
    if (card._lvCycle) clearInterval(card._lvCycle);
    var shown = -1, key = "";

    async function refresh() {
      if (document.hidden) return;
      var d;
      try { d = await load(sb); }
      catch (e) { if (!card.hidden) { foot.textContent = "Couldn’t refresh: trying again shortly"; } return; }
      if (!d.staff || !d.venues) { card.hidden = true; clearInterval(card._lvRefresh); clearInterval(card._lvCycle); return; }
      card.hidden = false;
      var shifts = d.shifts || [];
      var g = body.querySelector(".wx-gallery");
      var at = g ? Math.round(g.scrollLeft / Math.max(1, g.clientWidth)) : 0;
      card.classList.toggle("lv-multi", shifts.length > 1);
      if (shifts.length > 1) {
        body.innerHTML = '<p class="lv-note">' + shifts.length + ' jobs counting now</p><div class="lv-grid" aria-live="polite">' + shifts.map(cellHTML).join("") + '</div>';
        shown = 0; key = "";
      } else if (!shifts.length) {
        body.innerHTML = '<div class="wx-empty"><p>No shift is running right now at any venue' +
          '. The door count appears here when the team starts counting.</p></div>';
        shown = 0; key = "";
      } else {
        var k = shifts.map(function (s) { return s.job_id; }).join();
        body.innerHTML = '<div class="wx-gallery" tabindex="0" aria-label="Live door counts" aria-live="polite">' + shifts.map(slideHTML).join("") + '</div>' +
          (shifts.length > 1 ? '<div class="wx-dots" role="tablist">' + shifts.map(function (s, i) {
            return '<button type="button" role="tab" aria-label="' + esc(s.venue) + '" aria-selected="' + (i === (k === key ? at : 0)) + '" data-i="' + i + '"></button>';
          }).join("") + '</div>' : "");
        g = body.querySelector(".wx-gallery");
        if (k === key && at) g.scrollLeft = at * g.clientWidth;
        key = k; shown = shifts.length;
        var dots = body.querySelectorAll(".wx-dots button");
        g.addEventListener("scroll", function () {
          window.requestAnimationFrame(function () {
            var i = Math.round(g.scrollLeft / Math.max(1, g.clientWidth));
            Array.prototype.forEach.call(dots, function (b, n) { b.setAttribute("aria-selected", n === i); });
          });
        }, { passive: true });
        Array.prototype.forEach.call(dots, function (b) {
          b.onclick = function () { g.scrollTo({ left: Number(b.dataset.i) * g.clientWidth, behavior: "smooth" }); };
        });
      }
      var last = shifts.map(function (s) { return s.last_tap_at; }).filter(Boolean).sort().pop();
      foot.textContent = shifts.length ? (last ? "Last count " + ago(last) : "No counts yet") : "Staff Check-In clicker";
    }

    var held = false, resumeAt = 0;
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hold = function () { held = true; }, release = function () { held = false; resumeAt = Date.now() + 3000; };
    card.addEventListener("pointerenter", hold); card.addEventListener("pointerleave", release);
    card.addEventListener("touchstart", hold, { passive: true }); card.addEventListener("touchend", release, { passive: true });
    card.addEventListener("focusin", hold); card.addEventListener("focusout", release);
    card._lvCycle = setInterval(function () {
      var g = body.querySelector(".wx-gallery");
      if (!g || shown < 2 || held || document.hidden || Date.now() < resumeAt) return;
      var i = Math.round(g.scrollLeft / Math.max(1, g.clientWidth));
      g.scrollTo({ left: ((i + 1) % shown) * g.clientWidth, behavior: calm ? "auto" : "smooth" });
    }, 3000);
    card._lvRefresh = setInterval(refresh, 20000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
    await refresh();
  }

  window.FGLive = { mountCard: mountCard, slideHTML: slideHTML };
})();
