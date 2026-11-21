// Staff-only pages: signed-out visitors go to the hub login; signed-in non-staff go back to the hub.
(function () {
  var c = window.FG_CONFIG || {};
  function reveal() { var s = document.getElementById("fg-guard"); if (s) s.remove(); }
  function addBar() {
    // Shared print rules for every tool: the bar never prints.
    var ps = document.createElement("style"); ps.textContent = "@media print{.fg-bar{display:none!important}}"; document.head.appendChild(ps);
    var bar = document.createElement("div");
    bar.className = "fg-bar";
    bar.setAttribute("style", "font:600 14px/1 Manrope,Arial,sans-serif;background:#100f10;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px");
    bar.innerHTML = '<a href="/" style="color:#fff;text-decoration:none;font-family:Antonio,\'Arial Narrow\',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em">FORT GREEN TOOLS</a><span style="display:flex;gap:16px;align-items:center"><span id="fg-save-state" style="font-weight:500;opacity:.7" aria-live="polite"></span><a href="/results/" style="color:#fff">My Results</a><a href="/" style="color:#fff">All tools</a></span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  function isStaff(email) {
    var d = (c.STAFF_DOMAIN || "").toLowerCase();
    return !!d && (email || "").toLowerCase().endsWith("@" + d);
  }
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY || !window.supabase) {
    reveal(); document.addEventListener("DOMContentLoaded", addBar); return;
  }
  var sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session;
    if (!s) { location.replace("/?next=" + encodeURIComponent(location.pathname + location.hash)); return; }
    if (!isStaff(s.user.email)) { location.replace("/"); return; }
    return sb.rpc("hub_is_blocked").then(function (b) {
      if (b && b.data === true) { return sb.auth.signOut().finally(function () { location.replace("/?removed=1"); }); }
      reveal();
      if (document.body) addBar(); else document.addEventListener("DOMContentLoaded", addBar);
    });
  }).catch(function () { location.replace("/"); });
})();
