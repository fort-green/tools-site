// Fort Green tools hub: "Show me around" guided tour for Fort Green staff.
// Spotlights each part of the hub in turn with a short explanation. Steps whose part isn't
// on screen for this person (e.g. admin-only cards) are skipped. Started from the button in the
// account bar; offered once automatically on a staff member's first visit.
(function () {
  var card = function (href) { return 'a.card[href="' + href + '"]'; };
  var STEPS = [
    { t: "Welcome to the tools hub", b: "This is what clients see when they sign in, plus a Staff only section for the team. This tour takes about two minutes. Use Next, or the arrow keys, and Esc to stop at any time." },
    { s: "#who", t: "Your account", b: "Shows who's signed in. My Results opens everything this account has made with the tools. Clients see the same bar." },
    { s: "#journey", t: "Planning an event?", b: "The free tools in planning order. Each step ticks off once the person has a saved result for it, and the next one is outlined. Clients can hide it if they only want one tool." },
    { s: "#card-weather", t: "Live weather", b: "Met Office forecast for up to three places, with wind and gusts for the next 12 hours. Set the places on the Weather page. It cycles between them every 3 seconds." },
    { s: "#card-live", t: "Live capacity (staff only)", b: "Live door counts from the Staff Check-In clicker for every job counting right now, refreshed every 20 seconds. Tap a venue to open its Live now tab in the client portal." },
    { s: "#card-portal", t: "Client portal", b: "Staff see every venue; clients only see venues they're linked to. Bookings calendar from Staff Check-In, new booking requests and quotes, documents (licences in, invoices out), extra staff requests, invoicing details, Live now and door counts. Use “View as client” to see exactly what they see." },
    { s: card("/results/"), t: "My Results", b: "Every report and plan is saved automatically to the person's account. They can reopen, change or print any of them. The Event Management Plan pulls figures from here." },
    { s: card("/licensing/"), t: "01 Licensing", b: "Which licences and notices an event needs (premises licence, TENs) based on where it is and what's happening, with deadlines and the council to contact." },
    { s: card("/capacity/"), t: "02 Capacity Calculator", b: "Safe capacity from floor space and exit widths, showing which one limits it and the Martyn's Law tier. Links straight into Staffing and Welfare with the capacity filled in." },
    { s: card("/staffing/"), t: "03 Staffing Calculator", b: "Suggested door supervisors, stewards and supervisors with the reasoning, from crowd size, alcohol, finish time, entrances and searching." },
    { s: card("/welfare/"), t: "04 Welfare & Provisions", b: "Toilets, urinals, accessible toilets, hand washing, drinking water, first aid and bins, from UK event guidance." },
    { s: card("/power-planner/"), t: "05 Power Planner", b: "Pick the equipment on site and it works out the running load, generator size and phases, plus a fuel plan." },
    { s: card("/risk-assessment/"), t: "06 Risk Assessment Generator", b: "A draft risk assessment with hazards, scores, controls and the law that applies. Staff have a fuller branded version in Staff only." },
    { s: card("/martyns-law/"), t: "07 Martyn's Law Readiness", b: "Scope and tier from capacity, a readiness score and the gaps to close. “Book a readiness review” sends the request to tools@fortgreen.co.uk." },
    { s: card("/run-sheet/"), t: "08 Run Sheet & Call Sheet", b: "Running order and crew call times, shared as one link crew can open on their phones." },
    { s: card("/event-plan/"), t: "09 Event Management Plan", b: "A plan under the headings a Safety Advisory Group expects, pulling in saved results from the other tools. Every gap is a to-do that links straight to the field to fill in." },
    { s: card("/quote/"), t: "10 Event Quote Estimator", b: "An instant estimate from the rates set in Quote rates. “Get a firm quote” emails the request to tools@fortgreen.co.uk; reply to it to reach the client." },
    { s: card("https://wa.me/447399232855"), t: "Need something else?", b: "Opens the 24/7 WhatsApp line for anything the tools don't cover." },
    { t: "How leads come in", b: "The headline result in each tool is free. The full report and PDF unlock after name, email and organisation, which adds them to the Fort Green email list sheet. New sign-ups fill in a short profile and are emailed to tools@ to review on the Users page." },
    { s: "#h-staff", t: "Staff only", b: "Everything below is only shown to @fortgreen.co.uk accounts." },
    { s: card("https://checkin.fortgreen.co.uk/"), t: "Staff Check-In", b: "Shifts, staff check-in and check-out, and the door clicker. Shifts and counts here feed the client portal and the Live capacity tile." },
    { s: card("/risk-assessment-full/"), t: "Risk Assessment — Full", b: "The complete risk assessment for the Fort Green team, with branded output for clients." },
    { s: card("https://claude.ai/artifact/2UiunnHeWiEujNKjAG492D"), t: "Lead Finder", b: "Find and track new sales leads." },
    { s: card("/equipment/"), t: "Equipment Check Tool", b: "Issue kit lists to staff, who confirm receipt by email; check it back in and flag damaged or missing items. Overdue kit is chased daily." },
    { s: card("/talent-match/"), t: "Talent Match", b: "Enter a gig, add acts from our own list or search the internet, send booking requests artists confirm online, then track each booking through to paid." },
    { s: "#card-rates", t: "Quote rates (admins)", b: "The rates behind the quote estimator. Clients never see them; anything without a rate shows as not priced." },
    { s: "#card-users", t: "Users (admins)", b: "Everyone who has signed in. Review new sign-ups (the To review list), link client emails to their venues, and remove or restore access." },
    { t: "That's it", b: "You can run this tour again from “Show me around” at the top. Questions or problems: tools@fortgreen.co.uk." }
  ];

  var CSS = ".fgt-dim{position:fixed;inset:0;z-index:9998;background:transparent}" +
    ".fgt-spot{position:absolute;z-index:9999;border:3px solid #fff;outline:3px solid #b42318;box-shadow:0 0 0 9999px rgba(16,15,16,.62);transition:all .25s ease;pointer-events:none}" +
    ".fgt-spot.none{left:50%!important;top:40%!important;width:0!important;height:0!important;border:0;outline:0}" +
    ".fgt-box{position:fixed;z-index:10000;width:min(400px,calc(100vw - 32px));background:#fff;color:#100f10;border:2px solid #100f10;padding:20px;font:500 16px/1.5 Manrope,Arial,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.25)}" +
    ".fgt-box h2{margin:0 0 8px;font:700 28px/1.05 Antonio,'Arial Narrow',sans-serif;text-transform:uppercase}" +
    ".fgt-box p{margin:0 0 16px}" +
    ".fgt-n{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5f5f5f;margin-bottom:6px}" +
    ".fgt-bar{height:4px;background:#e2e2e2;margin:0 0 14px}.fgt-bar i{display:block;height:100%;background:#100f10}" +
    ".fgt-row{display:flex;gap:10px;align-items:center}" +
    ".fgt-row .x{margin-right:auto;background:none;border:0;padding:8px 0;font:600 14px Manrope,Arial,sans-serif;color:#5f5f5f;text-decoration:underline;cursor:pointer}" +
    ".fgt-btn{min-height:44px;padding:0 18px;border:1px solid #100f10;background:#100f10;color:#fff;font:700 13px Manrope,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}" +
    ".fgt-btn.ghost{background:#fff;color:#100f10}" +
    "@media (max-width:600px){.fgt-box{left:12px!important;right:12px;width:auto;bottom:12px;top:auto!important}}" +
    "@media (prefers-reduced-motion:reduce){.fgt-spot{transition:none}}";

  var steps = [], i = 0, els = null, lastFocus = null;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function visible(sel) {
    if (!sel) return true;
    var el = document.querySelector(sel);
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return !el.closest("[hidden]") && (r.width > 0 || r.height > 0);
  }

  function place() {
    if (!els) return;
    var s = steps[i], el = s.s && document.querySelector(s.s), spot = els.spot, box = els.box;
    if (!el) {
      spot.className = "fgt-spot none";
      // Phones: the box is pinned to the bottom of the screen by CSS, so no centring transform.
      if (innerWidth <= 600) { box.style.left = ""; box.style.top = ""; box.style.transform = ""; return; }
      box.style.left = "50%"; box.style.top = "50%"; box.style.transform = "translate(-50%,-50%)"; return;
    }
    var r = el.getBoundingClientRect(), pad = 8;
    spot.className = "fgt-spot";
    spot.style.left = (r.left + scrollX - pad) + "px"; spot.style.top = (r.top + scrollY - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
    box.style.transform = "";
    if (innerWidth <= 600) { box.style.left = ""; box.style.top = ""; return; }
    var bw = box.offsetWidth, bh = box.offsetHeight;
    var below = r.bottom + 16 + bh < innerHeight, above = r.top - 16 - bh > 0;
    var top = below ? r.bottom + 16 : above ? r.top - 16 - bh : Math.max(16, innerHeight - bh - 16);
    var left = Math.min(Math.max(16, r.left), innerWidth - bw - 16);
    if (!below && !above) {  // no room above or below: sit beside the highlighted part
      if (r.right + 16 + bw < innerWidth) left = r.right + 16;
      else if (r.left - 16 - bw > 0) left = r.left - 16 - bw;
      top = Math.max(16, Math.min(r.top, innerHeight - bh - 16));
    }
    box.style.left = left + "px"; box.style.top = top + "px";
  }

  function show(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    var s = steps[i], el = s.s && document.querySelector(s.s);
    els.box.innerHTML = '<div class="fgt-n">' + (i + 1) + " of " + steps.length + '</div><div class="fgt-bar"><i style="width:' + Math.round((i + 1) / steps.length * 100) + '%"></i></div>' +
      '<h2 id="fgt-h">' + esc(s.t) + '</h2><p id="fgt-b">' + esc(s.b) + "</p>" +
      '<div class="fgt-row"><button type="button" class="x">' + (i === steps.length - 1 ? "" : "End tour") + "</button>" +
      (i ? '<button type="button" class="fgt-btn ghost" data-k="back">Back</button>' : "") +
      '<button type="button" class="fgt-btn" data-k="next">' + (i === steps.length - 1 ? "Finish" : "Next") + "</button></div>";
    els.box.querySelector(".x").onclick = end;
    var bk = els.box.querySelector('[data-k="back"]'); if (bk) bk.onclick = function () { show(i - 1); };
    els.box.querySelector('[data-k="next"]').onclick = function () { i === steps.length - 1 ? end() : show(i + 1); };
    if (el) {
      var smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: innerWidth <= 600 ? "start" : "center", behavior: smooth ? "smooth" : "auto" });
      if (innerWidth <= 600) setTimeout(function () { scrollBy(0, -24); }, smooth ? 350 : 0);
    }
    place(); setTimeout(place, 380); setTimeout(place, 700);
    els.box.querySelector('[data-k="next"]').focus({ preventScroll: true });
  }

  function key(e) {
    if (!els) return;
    if (e.key === "Escape") end();
    else if (e.key === "ArrowRight") { e.preventDefault(); i === steps.length - 1 ? end() : show(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
    else if (e.key === "Tab") { // keep focus inside the tour box
      var f = els.box.querySelectorAll("button"); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }
  function onResize() { if (els) place(); }

  function start() {
    if (els) return;
    if (!document.getElementById("fgt-css")) { var st = document.createElement("style"); st.id = "fgt-css"; st.textContent = CSS; document.head.appendChild(st); }
    steps = STEPS.filter(function (s) { return visible(s.s); });
    lastFocus = document.activeElement;
    var dim = document.createElement("div"); dim.className = "fgt-dim"; dim.onclick = function () {};
    var spot = document.createElement("div"); spot.className = "fgt-spot";
    var box = document.createElement("div"); box.className = "fgt-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "fgt-h"); box.setAttribute("aria-describedby", "fgt-b");
    document.body.appendChild(dim); document.body.appendChild(spot); document.body.appendChild(box);
    els = { dim: dim, spot: spot, box: box };
    document.addEventListener("keydown", key); addEventListener("resize", onResize); addEventListener("scroll", onResize, { passive: true });
    try { localStorage.setItem("fg-tour-seen", "1"); } catch (e) {}
    show(0);
  }
  function end() {
    if (!els) return;
    els.dim.remove(); els.spot.remove(); els.box.remove(); els = null;
    document.removeEventListener("keydown", key); removeEventListener("resize", onResize); removeEventListener("scroll", onResize);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Adds the "Show me around" button for staff, and offers the tour once on their first visit.
  function offer(isStaff) {
    var b = document.getElementById("tour-btn");
    if (b) b.hidden = !isStaff;
    if (!isStaff) return;
    var seen = false; try { seen = localStorage.getItem("fg-tour-seen") === "1"; } catch (e) {}
    if (!seen) setTimeout(function () { if (!document.getElementById("view-hub").hidden) start(); }, 1200);
  }

  window.FGTour = { start: start, end: end, offer: offer, steps: STEPS };
})();
