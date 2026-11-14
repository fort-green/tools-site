// Staff-only pages: signed-out visitors go to the hub login; signed-in non-staff go back to the hub.
(function () {
  var c = window.FG_CONFIG || {};
  function reveal() { var s = document.getElementById("fg-guard"); if (s) s.remove(); }
  function addBar() {
    var bar = document.createElement("div");
    bar.setAttribute("style", "font:600 14px/1 Manrope,Arial,sans-serif;background:#100f10;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px");
    bar.innerHTML = '<a href="/" style="color:#fff;text-decoration:none;font-family:Antonio,\'Arial Narrow\',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em">FORT GREEN TOOLS</a><a href="/" style="color:#fff">All tools</a>';
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
    reveal();
    if (document.body) addBar(); else document.addEventListener("DOMContentLoaded", addBar);
  }).catch(function () { location.replace("/"); });
})();
