// Renders a run sheet and call sheet from the builder's saved data. Used by the builder's
// preview and PDFs (/run-sheet/) and by the crew link (/run-sheet/view/), so they always match.
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dayName(d) {
    if (!d) return "";
    var x = new Date(d + "T12:00:00");
    return isNaN(x) ? d : x.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function tel(p) { return String(p || "").replace(/[^0-9+]/g, ""); }
  // Current London date and time as "YYYY-MM-DD HH:MM", to compare with cue times.
  function londonNow() {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + "-" + p.month + "-" + p.day + " " + (p.hour === "24" ? "00" : p.hour) + ":" + p.minute;
  }
  function sorted(list, field, eventDate) {
    return (list || []).filter(function (x) { return x && (x.title || x.name || x[field]); }).map(function (x) {
      var d = x.date || eventDate || "";
      return Object.assign({}, x, { _d: d, _k: d + " " + (x[field] || "99:99") });
    }).sort(function (a, b) { return a._k < b._k ? -1 : a._k > b._k ? 1 : 0; });
  }
  // Groups cues by day. A single-day event keeps its date only in the header.
  function groups(list, eventDate) {
    var out = [];
    list.forEach(function (x) { var g = out[out.length - 1]; if (!g || g.d !== x._d) out.push(g = { d: x._d, items: [] }); g.items.push(x); });
    if (out.length === 1 && out[0].d === (eventDate || "")) out[0].d = "";
    return out;
  }

  // Works out which cue is happening now and which is next.
  function nowNext(items) {
    var now = londonNow(), cur = null, next = null;
    items.forEach(function (x, i) {
      if (!x.start || !x._d) return;
      var endK = x.end ? x._d + " " + x.end : (items[i + 1] && items[i + 1].start ? items[i + 1]._k : null);
      if (x._k <= now && (!endK || endK > now)) cur = x.id;
      if (!next && x._k > now) next = x.id;
    });
    return { cur: cur, next: next };
  }

  function header(s) {
    var addr = [s.venue, s.address, s.postcode].filter(Boolean).join(", ");
    var maps = addr ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr) : "";
    return '<header class="rs-head">' +
      '<h1>' + esc(s.name || "Run sheet") + '</h1>' +
      (s.date ? '<p class="rs-date">' + esc(dayName(s.date)) + '</p>' : '') +
      (addr ? '<p class="rs-addr">' + esc(addr) + (maps ? ' <a class="rs-link no-print" href="' + maps + '" target="_blank" rel="noopener">Map</a>' : '') + '</p>' : '') +
      '</header>';
  }
  function contacts(s) {
    var list = (s.contacts || []).filter(function (c) { return c.name || c.phone; });
    var rows = list.map(function (c) {
      return '<li><div><strong>' + esc(c.name) + '</strong>' + (c.role ? '<span>' + esc(c.role) + '</span>' : '') + '</div>' +
        (c.phone ? '<a class="rs-tel" href="tel:' + esc(tel(c.phone)) + '">' + esc(c.phone) + '</a>' : '') + '</li>';
    }).join("");
    var extra = (s.hospital ? '<p class="rs-note"><strong>Nearest A&amp;E:</strong> ' + esc(s.hospital) + '</p>' : '');
    if (!rows && !extra) return "";
    return '<section class="rs-sec"><h2>Key contacts</h2>' + (rows ? '<ul class="rs-contacts">' + rows + '</ul>' : '') + extra + '</section>';
  }
  function notes(s) {
    return s.notes ? '<section class="rs-sec"><h2>Notes</h2><p class="rs-notes">' + esc(s.notes).replace(/\n/g, "<br>") + '</p></section>' : "";
  }
  function schedule(s, live) {
    var items = sorted(s.items, "start", s.date);
    if (!items.length) return "";
    var nn = live ? nowNext(items) : { cur: null, next: null };
    return '<section class="rs-sec"><h2>Run sheet</h2>' + groups(items, s.date).map(function (g) {
      return (g.d ? '<h3 class="rs-day">' + esc(dayName(g.d)) + '</h3>' : '') + '<ol class="rs-run">' + g.items.map(function (x) {
        var cls = x.id === nn.cur ? " rs-now" : x.id === nn.next ? " rs-next" : "";
        var flag = x.id === nn.cur ? '<span class="rs-flag">Now</span>' : x.id === nn.next ? '<span class="rs-flag">Next</span>' : "";
        var sub = [x.where, x.who].filter(Boolean).map(esc).join(" · ");
        return '<li class="rs-cue' + cls + '"><div class="rs-time">' + esc(x.start || "TBC") + (x.end ? '<span>–' + esc(x.end) + '</span>' : '') + '</div>' +
          '<div class="rs-what">' + flag + '<strong>' + esc(x.title || "Untitled") + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') +
          (x.notes ? '<em>' + esc(x.notes) + '</em>' : '') + '</div></li>';
      }).join("") + '</ol>';
    }).join("") + '</section>';
  }
  function calls(s) {
    var crew = sorted(s.crew, "call", s.date);
    if (!crew.length) return "";
    return '<section class="rs-sec"><h2>Call sheet</h2>' + groups(crew, s.date).map(function (g) {
      return (g.d ? '<h3 class="rs-day">' + esc(dayName(g.d)) + '</h3>' : '') + '<ol class="rs-run">' + g.items.map(function (x) {
        var sub = [x.role, x.reportTo ? "Report to " + x.reportTo : ""].filter(Boolean).map(esc).join(" · ");
        return '<li class="rs-cue"><div class="rs-time">' + esc(x.call || "TBC") + '</div><div class="rs-what"><strong>' + esc(x.name || "Crew") + '</strong>' +
          (sub ? '<span>' + sub + '</span>' : '') + (x.phone ? '<a class="rs-tel" href="tel:' + esc(tel(x.phone)) + '">' + esc(x.phone) + '</a>' : '') +
          (x.notes ? '<em>' + esc(x.notes) + '</em>' : '') + '</div></li>';
      }).join("") + '</ol>';
    }).join("") + '</section>';
  }

  // mode: "both" (crew link and preview), "run" or "call" (PDFs). live: highlight now and next.
  function render(s, opts) {
    opts = opts || {}; s = s || {};
    var mode = opts.mode || "both";
    var body = mode === "call" ? calls(s) + contacts(s) + notes(s)
      : mode === "run" ? schedule(s, opts.live) + contacts(s) + notes(s)
      : schedule(s, opts.live) + calls(s) + contacts(s) + notes(s);
    return '<div class="rs">' + header(s) + (body || '<p class="rs-empty">Nothing added yet.</p>') + '</div>';
  }

  window.FGSheet = { render: render, esc: esc, dayName: dayName, londonNow: londonNow };
})();
