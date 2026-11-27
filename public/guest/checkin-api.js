// Calls the guest list functions in the Staff Check-In database (public anon key; every function checks its own access).
window.FGCheckin = (function () {
  var URL = "https://yereihjkxbbnguvbjpcp.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcmVpaGpreGJibmd1dmJqcGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTY3MzUsImV4cCI6MjEwOTM5MjczNX0.678GmM_-HMw8dEsoDf6exVJ2196fE0afqdz02f9_OOk";
  var NICE = {
    not_signed_in: "Your sign-in has expired. Sign in again.", wrong_mobile_or_pin: "That mobile number or PIN isn't right.",
    guest_list_not_open: "This guest list isn't open to you. It opens on the day for staff working the shift."
  };
  async function rpc(fn, args) {
    var r = await fetch(URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
    var body = null; try { body = await r.json(); } catch (e) {}
    if (!r.ok) { var m = (body && body.message) || "Something went wrong (" + r.status + ")."; throw new Error(NICE[m] || m); }
    return body;
  }
  return { rpc: rpc, qr: function (token) { return "https://nphmjcqasumkmjfnkmxo.supabase.co/functions/v1/guest-qr?t=" + encodeURIComponent(token); } };
})();
