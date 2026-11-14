// Sends signed-out visitors back to the hub login, then returns them here.
(function () {
  var c = window.FG_CONFIG || {};
  function reveal() { var s = document.getElementById("fg-guard"); if (s) s.remove(); }
  function addBar() {
    var bar = document.createElement("div");
    bar.setAttribute("style", "font:600 14px/1 Manrope,Arial,sans-serif;background:#100f10;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px");
    bar.innerHTML = '<a href="/" style="color:#fff;text-decoration:none;font-family:Antonio,\'Arial Narrow\',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em">FORT GREEN TOOLS</a><a href="/" style="color:#fff">All tools</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY || !window.supabase) {
    reveal(); document.addEventListener("DOMContentLoaded", addBar); return;
  }
  var sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) {
      reveal();
      if (document.body) addBar(); else document.addEventListener("DOMContentLoaded", addBar);
    } else {
      location.replace("/?next=" + encodeURIComponent(location.pathname + location.hash));
    }
  }).catch(function () { location.replace("/"); });
})();
