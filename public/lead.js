// Sends a tool's form to n8n with proof that the person is signed in to the tools hub.
// The access token travels in the body (not a header, to keep the request simple for CORS);
// each n8n workflow checks it with Supabase (/auth/v1/user) before doing anything, so posts
// that don't come from a signed-in user are rejected.
(function () {
  var c = window.FG_CONFIG || {};
  var sb = window.supabase && c.SUPABASE_URL ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null;
  async function token() {
    if (!sb) return "";
    try {
      var r = await sb.auth.getSession();          // refreshes an expired token if needed
      return (r.data && r.data.session && r.data.session.access_token) || "";
    } catch (e) { return ""; }
  }
  async function post(url, body) {
    var t = await token();
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({}, body, { access_token: t }))
    });
  }
  window.FGLead = { post: post, token: token };
})();
