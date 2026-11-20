// Sends signed-out visitors back to the hub login, then returns them here.
(function () {
  var c = window.FG_CONFIG || {};
  function reveal() { var s = document.getElementById("fg-guard"); if (s) s.remove(); }
  function addBar() {
    var bar = document.createElement("div");
    bar.setAttribute("style", "font:600 14px/1 Manrope,Arial,sans-serif;background:#100f10;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px");
    bar.innerHTML = '<a href="/" style="color:#fff;text-decoration:none;font-family:Antonio,\'Arial Narrow\',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em">FORT GREEN TOOLS</a><span style="display:flex;gap:16px;align-items:center"><span id="fg-save-state" style="font-weight:500;opacity:.7" aria-live="polite"></span><a href="/results/" style="color:#fff">My Results</a><a href="/" style="color:#fff">All tools</a></span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY || !window.supabase) {
    reveal(); document.addEventListener("DOMContentLoaded", addBar); return;
  }
  var sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) {
      return sb.rpc("hub_is_blocked").then(function (b) {
        if (b && b.data === true) { return sb.auth.signOut().finally(function () { location.replace("/?removed=1"); }); }
        reveal();
        if (document.body) addBar(); else document.addEventListener("DOMContentLoaded", addBar);
      });
    } else {
      location.replace("/?next=" + encodeURIComponent(location.pathname + location.hash));
    }
  }).catch(function () { location.replace("/"); });
})();
