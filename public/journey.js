// Fort Green tools: "Planning an event?" progress strip.
// Shows the tools in planning order, ticks the ones the signed-in person has a saved result for
// (from My Results / hub_results) and highlights the next one. Guidance only: every tool works on its own.
(function () {
  var STEPS = [
    ["licensing", "Licensing", "/licensing/", "Can you hold it?"],
    ["capacity", "Capacity", "/capacity/", "How many people"],
    ["staffing", "Staffing", "/staffing/", "Security and stewards"],
    ["welfare", "Welfare", "/welfare/", "Toilets, water, first aid"],
    ["power-planner", "Power", "/power-planner/", "Generators and power"],
    ["risk-assessment", "Risk assessment", "/risk-assessment/", "Hazards and controls"],
    ["martyns-law", "Martyn’s Law", "/martyns-law/", "Terror readiness"],
    ["run-sheet", "Run sheet", "/run-sheet/", "Timings and contacts"],
    ["event-plan", "Event plan", "/event-plan/", "Pulls it all together"],
    ["quote", "Quote", "/quote/", "Price it with Fort Green"]
  ];
  var CSS = ".fgj{border:1px solid var(--ink);background:var(--surface);padding:18px 20px;margin:0 0 22px}" +
    ".fgj-top{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline;justify-content:space-between;margin-bottom:12px}" +
    ".fgj-top h3{margin:0;font-family:Antonio,'Arial Narrow',sans-serif;font-weight:700;font-size:26px;text-transform:uppercase;line-height:1}" +
    ".fgj-top p{margin:0;font-size:14px;color:var(--muted)}" +
    ".fgj-bar{height:6px;background:var(--line);margin:0 0 14px}.fgj-bar i{display:block;height:100%;background:var(--ink)}" +
    ".fgj ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}" +
    "@media (max-width:900px){.fgj ol{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}.fgj li{flex:0 0 46%;scroll-snap-align:start}}" +
    ".fgj a{display:grid;grid-template-columns:28px minmax(0,1fr);gap:2px 10px;align-items:center;padding:10px;border:1px solid var(--line);text-decoration:none;color:var(--ink);min-height:56px}" +
    ".fgj a:hover{border-color:var(--ink)}" +
    ".fgj .d{grid-row:span 2;width:28px;height:28px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--muted)}" +
    ".fgj .t{font-weight:700;font-size:14px;line-height:1.2}.fgj .s{font-size:12px;color:var(--muted);line-height:1.25}" +
    ".fgj li.done .d{background:var(--ink);border-color:var(--ink);color:var(--bg)}" +
    ".fgj li.next a{border:2px solid var(--ink)}.fgj li.next .s{color:var(--ink);font-weight:700}" +
    ".fgj .hide{background:none;border:0;padding:0;font:600 13px Manrope,Arial,sans-serif;color:var(--muted);text-decoration:underline;cursor:pointer}";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function render(el, done, opts) {
    var n = STEPS.filter(function (s) { return done[s[0]]; }).length;
    var next = STEPS.find(function (s) { return !done[s[0]] && s[0] !== (opts.here || ""); });
    el.innerHTML = '<section class="fgj" aria-labelledby="fgj-h">' +
      '<div class="fgj-top"><h3 id="fgj-h">' + esc(opts.title || "Planning an event?") + "</h3><p>" +
      (n ? n + " of " + STEPS.length + " done" + (next ? " · next: " + esc(next[1]) : " · all done") : "Use the tools in this order. Each one feeds the next, and your event plan pulls them together.") +
      (opts.hideable ? ' · <button type="button" class="hide">Hide</button>' : "") + "</p></div>" +
      '<div class="fgj-bar" aria-hidden="true"><i style="width:' + Math.round(n / STEPS.length * 100) + '%"></i></div>' +
      '<ol>' + STEPS.map(function (s, i) {
        var d = !!done[s[0]], isNext = next && next[0] === s[0];
        return '<li class="' + (d ? "done" : "") + (isNext ? " next" : "") + '"><a href="' + s[2] + '"' + (isNext ? ' aria-current="step"' : "") + '>' +
          '<span class="d" aria-hidden="true">' + (d ? "✓" : i + 1) + '</span><span class="t">' + esc(s[1]) + (d ? '<span class="sr"> (done)</span>' : "") + '</span>' +
          '<span class="s">' + (isNext ? "Next: " : "") + esc(s[3]) + "</span></a></li>";
      }).join("") + "</ol></section>";
    var cur = el.querySelector("li.next"), list = el.querySelector(".fgj ol");
    if (cur && list && list.scrollWidth > list.clientWidth) list.scrollLeft = cur.offsetLeft - list.offsetLeft - 8;  // phones: start at the next step
    var h = el.querySelector(".hide");
    if (h) h.onclick = function () { try { localStorage.setItem("fg-journey-hidden", "1"); } catch (e) {} mount(el, opts.sb, opts); };
  }

  async function mount(el, sb, opts) {
    if (!el) return;
    opts = opts || {}; opts.sb = sb;
    if (!document.getElementById("fgj-css")) { var st = document.createElement("style"); st.id = "fgj-css"; st.textContent = CSS + ".fgj .sr{position:absolute;left:-9999px}"; document.head.appendChild(st); }
    if (opts.hideable) {
      var hidden = false; try { hidden = localStorage.getItem("fg-journey-hidden") === "1"; } catch (e) {}
      if (hidden) {
        el.hidden = false;
        el.innerHTML = '<p style="margin:0 0 14px"><button type="button" class="fgj-show" style="background:none;border:0;padding:0;font:600 14px Manrope,Arial,sans-serif;color:var(--ink);text-decoration:underline;cursor:pointer">Planning an event? Show the steps</button></p>';
        el.querySelector(".fgj-show").onclick = function () { show(); mount(el, sb, opts); };
        return;
      }
    }
    var done = {};
    try {
      var s = sb && await sb.auth.getSession();
      var uid = s && s.data && s.data.session && s.data.session.user.id;
      if (uid) {
        var r = await sb.from("hub_results").select("tool").eq("user_id", uid).in("tool", STEPS.map(function (x) { return x[0]; }));
        (r.data || []).forEach(function (x) { done[x.tool] = true; });
      }
    } catch (e) { /* show the order without ticks */ }
    el.hidden = false;
    render(el, done, opts);
  }
  function show() { try { localStorage.removeItem("fg-journey-hidden"); } catch (e) {} }

  window.FGJourney = { mount: mount, show: show, steps: STEPS };
})();
