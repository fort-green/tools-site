// Shared printable report (PDF) for every Fort Green tool, so all documents look the same.
// A tool calls FGReport.attach(() => FGReport.doc({...})) once, and FGReport.print() from its
// "Save as PDF" button. The document is rebuilt just before printing, so it always matches the
// latest answers. Layout follows the Martyn's Law report: black header bar, big title, meta line,
// Antonio section headings, pd- tables and a liability footer. FORT GREEN branding only appears
// when the signed-in person has a @fortgreen.co.uk email; everyone else gets the document name.
(function () {
  var CSS = [
    "#print-doc{display:none}",
    "@page{size:A4;margin:14mm}",
    "@media print{html,body{background:#fff!important;color:#000}body::before{display:none}",
    "body:not(.fg-nodoc) > *:not(#print-doc){display:none!important}",
    "body:not(.fg-nodoc) #print-doc{display:block!important;font-family:'Manrope',Arial,sans-serif;font-size:10pt;line-height:1.45;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}}",
    ".pd-head{display:flex;justify-content:space-between;align-items:center;background:#000;color:#fff;padding:12px 16px}",
    ".pd-brand{font-family:'Antonio','Arial Narrow',sans-serif;font-weight:700;font-size:22pt;letter-spacing:.02em;line-height:1;text-transform:uppercase}",
    ".pd-doc{font-family:'Antonio','Arial Narrow',sans-serif;font-size:11pt;text-transform:uppercase;letter-spacing:.06em;text-align:right;line-height:1.3}",
    ".pd-title{font-family:'Antonio','Arial Narrow',sans-serif;font-weight:700;text-transform:uppercase;font-size:30pt;line-height:1;margin:18px 0 6px}",
    ".pd-meta{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:9.5pt;color:#444;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #cecece}",
    ".pd-meta b{color:#000;font-weight:600}",
    ".pd-cards{display:flex;gap:10px;margin:0 0 12px}",
    ".pd-cards > .pd-card{flex:1 1 0;min-width:0}",
    ".pd-card{border:1.5px solid #000;padding:10px 12px;break-inside:avoid}",
    ".pd-card.dark{background:#000;color:#fff}",
    ".pd-label{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;opacity:.7;margin-bottom:4px}",
    ".pd-big{font-family:'Antonio','Arial Narrow',sans-serif;font-weight:700;font-size:28pt;line-height:1}",
    ".pd-small{font-size:9pt;opacity:.8;margin-top:4px}",
    ".pd-h2{font-family:'Antonio','Arial Narrow',sans-serif;font-weight:700;text-transform:uppercase;font-size:14pt;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid #000;break-after:avoid}",
    ".pd-table{width:100%;border-collapse:collapse;font-size:9.5pt;margin:0 0 6px}",
    ".pd-table thead{display:table-header-group}",
    "#print-doc table{break-inside:auto!important}",
    ".pd-table th{text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em;color:#5f5f5f;font-weight:600;padding:0 8px 6px 0;border-bottom:1px solid #cecece;vertical-align:bottom}",
    ".pd-table td{vertical-align:top;padding:7px 8px 7px 0;border-bottom:1px solid #e3e3e3}",
    ".pd-table tr{break-inside:avoid}",
    ".pd-table td.r,.pd-table th.r{text-align:right;padding-right:0;white-space:nowrap}",
    ".pd-table td.r + td,.pd-table th.r + th{padding-left:14px}",
    ".pd-kv th{width:38%;font-size:8.5pt;text-transform:none;letter-spacing:0;color:#444;padding:6px 8px 6px 0;border-bottom:1px solid #e3e3e3;vertical-align:top}",
    ".pd-kv td{font-weight:600}",
    ".pd-why{color:#5f5f5f;font-size:8.5pt}",
    ".pd-p{margin:0 0 8px}",
    ".pd-list{margin:4px 0 8px;padding-left:18px}.pd-list li{margin:3px 0}",
    ".pd-note{border-left:4px solid #000;background:#f2f2f2;padding:8px 12px;margin:8px 0;break-inside:avoid}",
    ".pd-todo{border-left:4px solid #b42318;background:#fbe4e1;padding:8px 12px;margin:8px 0;break-inside:avoid}",
    ".pd-todo b.t{color:#b42318;text-transform:uppercase;font-size:8.5pt;letter-spacing:.04em}",
    ".pd-warn{border:2px solid #b42318;background:#fff4e5;padding:10px 12px;margin:0 0 12px;font-size:9pt;break-inside:avoid}",
    ".pd-warn b{display:block;color:#b42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}",
    ".pd-foot{margin-top:16px;font-size:7.5pt;color:#5f5f5f;border-top:1px solid #cecece;padding-top:6px;break-inside:avoid}"
  ].join("\n");

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Email of the signed-in person, read from the Supabase session in this browser.
  function email() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) { var s = JSON.parse(localStorage.getItem(k)); return (s && s.user && s.user.email) || ""; }
      }
    } catch (e) {}
    return "";
  }
  function branded() { return /@fortgreen\.co\.uk$/i.test(email()); }

  function el() {
    var d = document.getElementById("print-doc");
    if (!d) { d = document.createElement("div"); d.id = "print-doc"; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d); }
    if (!document.getElementById("fg-report-css")) { var st = document.createElement("style"); st.id = "fg-report-css"; st.textContent = CSS; document.head.appendChild(st); }
    return d;
  }

  // Building blocks. Values passed to kv/table/cards are escaped unless given as {html: "..."}.
  function v(x) { return x && typeof x === "object" && "html" in x ? x.html : esc(x); }
  var R = {
    esc: esc,
    branded: branded,
    h2: function (t) { return '<div class="pd-h2">' + esc(t) + "</div>"; },
    p: function (t, html) { return '<p class="pd-p">' + (html ? t : esc(t)) + "</p>"; },
    why: function (t) { return '<p class="pd-p pd-why">' + esc(t) + "</p>"; },
    list: function (items) { return items && items.length ? '<ul class="pd-list">' + items.map(function (i) { return "<li>" + v(i) + "</li>"; }).join("") + "</ul>" : ""; },
    note: function (html) { return '<div class="pd-note">' + html + "</div>"; },
    todo: function (title, items) { return items && items.length ? '<div class="pd-todo"><b class="t">' + esc(title) + "</b>" + R.list(items) + "</div>" : ""; },
    kv: function (rows) {
      rows = (rows || []).filter(function (r) { return r && r[1] !== "" && r[1] != null; });
      return rows.length ? '<table class="pd-table pd-kv"><tbody>' + rows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + v(r[1]) + "</td></tr>"; }).join("") + "</tbody></table>" : "";
    },
    // head: ["Col", ...]; a column name ending in ">" is right-aligned (the ">" is not shown).
    table: function (head, rows) {
      var right = head.map(function (h) { return /&gt;$|>$/.test(h); });
      return '<table class="pd-table"><thead><tr>' + head.map(function (h, i) { return "<th" + (right[i] ? ' class="r"' : "") + ">" + esc(h.replace(/>$/, "")) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return "<td" + (right[i] ? ' class="r"' : "") + ">" + v(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    },
    // cards: [{label, big, small, dark}]
    cards: function (list) {
      return '<div class="pd-cards">' + list.filter(Boolean).map(function (c) {
        return '<div class="pd-card' + (c.dark ? " dark" : "") + '"><div class="pd-label">' + esc(c.label) + '</div><div class="pd-big">' + v(c.big) + "</div>" + (c.small ? '<div class="pd-small">' + v(c.small) + "</div>" : "") + "</div>";
      }).join("") + "</div>";
    },
    // The whole document. o: {doc, title, meta: [[label, value]], warn: [title, text], body: html, footer: text}
    doc: function (o) {
      var b = branded();
      var today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      var meta = [["Date", today]].concat(o.meta || []);
      if (b) meta.push(["Prepared by", "Fort Green"]);
      var docName = String(o.doc || "Report");
      var words = docName.split(" "), half = Math.ceil(words.length / 2);
      return (b
          ? '<div class="pd-head"><div class="pd-brand">FORT GREEN</div><div class="pd-doc">' + esc(words.slice(0, half).join(" ")) + "<br>" + esc(words.slice(half).join(" ")) + "</div></div>"
          : '<div class="pd-head"><div class="pd-brand">' + esc(docName) + '</div><div class="pd-doc">' + esc(o.kind || "Report") + "</div></div>") +
        '<div class="pd-title">' + esc(o.title || docName) + "</div>" +
        '<div class="pd-meta">' + meta.filter(function (m) { return m && m[1]; }).map(function (m) { return "<span><b>" + esc(m[0]) + "</b> " + esc(m[1]) + "</span>"; }).join("") + "</div>" +
        (o.warn ? '<div class="pd-warn"><b>' + esc(o.warn[0]) + "</b>" + esc(o.warn[1]) + "</div>" : "") +
        (o.body || "") +
        '<div class="pd-foot">' + esc(o.footer || "") + (o.footer ? " " : "") + "Produced with the Fort Green tools (tools.fortgreen.co.uk). Fort Green Limited accepts no responsibility or liability for decisions made using this document.</div>";
    }
  };

  var builder = null;
  // With no document (report still locked), the page prints as it is instead of a blank sheet.
  function build() {
    var html = builder ? builder() : "";
    el().innerHTML = html || "";
    document.body.classList.toggle("fg-nodoc", !html);
    return !!html;
  }
  R.attach = function (fn) { builder = fn; el(); window.addEventListener("beforeprint", build); };
  R.print = function () { build(); window.print(); };
  window.FGReport = R;
})();
