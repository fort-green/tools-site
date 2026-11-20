// My Results: saves each free tool's work to the signed-in person's account (table hub_results)
// and reopens it from /results/. Include after auth-guard.js on a tool page.
// Each tool already keeps its work in one localStorage key, so this script watches that key and
// autosaves it. A tool's "start again" button calls FGResults.startNew() so the next save is a new result.
(function () {
  var TOOLS = {
    "martyns-law": {
      label: "Martyn’s Law Readiness Checker", key: "fg-martyns-law-v1", tab: "report",
      ready: function (s) { return s.answers && Object.keys(s.answers).length > 0; },
      title: function (s) { return s.name || (s.mode === "event" ? "Event" : "Venue"); },
      summary: function () { var r = results(); return r.score == null ? "" : r.score + "% ready"; }
    },
    "risk-assessment": {
      label: "Risk Assessment Generator", key: "fg-ra-builder-v1", tab: "report",
      ready: function (s) { return !!(s.type && (s.name || s.venue)); },
      title: function (s) { return s.name || s.venue || "Risk assessment"; },
      summary: function () { var n = results().all.length; return n + " hazard" + (n === 1 ? "" : "s"); }
    },
    "licensing": {
      label: "Licensing & TEN Guidance", key: "fg-licensing-v1", tab: "plan",
      ready: function (s) { return !!(s.postcode || (s.acts && s.acts.length)); },
      title: function (s) { return s.name || s.postcode || "Licensing check"; },
      summary: function (s) { return [s.council, s.date].filter(Boolean).join(", "); }
    },
    "power-planner": {
      label: "Power Planner", key: "fg-power-planner-v1", tab: "power",
      ready: function (s) { var q = s.qty || {}; return Object.keys(q).some(function (k) { return q[k] > 0; }); },
      title: function (s) { return s.name || "Power plan"; },
      summary: function () { var c = calc(); return c.gen ? c.gen + " kVA " + (c.threePhase ? "three-phase" : "single-phase") + " generator" : "Over 1,000 kVA"; }
    },
    "capacity": {
      label: "Capacity Calculator", key: "fg-capacity-v1", tab: "capacity",
      ready: function () { return calc().ready; },
      title: function (s) { return s.name || (s.mode === "outdoor" ? "Outdoor site" : "Venue"); },
      summary: function () { var c = calc(); return c.cap.toLocaleString("en-GB") + " people, set by " + c.min.label.toLowerCase(); }
    }
  };
  window.FG_RESULT_TOOLS = TOOLS;
  window.FGResults = { startNew: function () {} };

  var toolId = location.pathname.split("/")[1], T = TOOLS[toolId];
  var c = window.FG_CONFIG || {};
  if (!T || !window.supabase || !c.SUPABASE_URL) return;

  var sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  var LINK = T.key + ":result", VIEW = T.key + ":viewing", STASH = T.key + ":stash";
  var ls = window.localStorage, origSet = Storage.prototype.setItem;
  function get(k) { try { return ls.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { origSet.call(ls, k, v); } catch (e) {} }
  function del(k) { try { ls.removeItem(k); } catch (e) {} }

  var loading = false, timer = null, pending = null, busy = false, userId = null;

  // Opening a saved result: /tool/?result=<id>
  var rid = new URLSearchParams(location.search).get("result");
  if (rid) {
    loading = true;
    document.documentElement.style.visibility = "hidden";
    sb.auth.getSession().then(function (r) {
      var uid = r.data && r.data.session && r.data.session.user.id;
      return sb.from("hub_results").select("id,user_id,data").eq("id", rid).maybeSingle().then(function (q) {
        var row = q.data;
        if (row) {
          if (row.user_id === uid) {
            if (get(VIEW)) restoreStash();
            put(T.key, JSON.stringify(row.data)); put(LINK, row.id); del(VIEW);
          } else {
            // An admin looking at someone else's result: keep their own work aside and don't save changes.
            if (!get(VIEW)) { var own = get(T.key); if (own) put(STASH, own); else del(STASH); }
            put(T.key, JSON.stringify(row.data)); put(VIEW, row.id); del(LINK);
          }
        }
        location.replace(location.pathname + "#" + (row ? T.tab : "start"));
      });
    }).catch(function () { location.replace(location.pathname); });
    return;
  }

  function restoreStash() {
    var s = get(STASH);
    if (s) put(T.key, s); else del(T.key);
    del(STASH); del(VIEW); del(LINK);
  }

  window.FGResults.startNew = function () { if (get(VIEW)) { del(STASH); del(VIEW); } del(LINK); };

  function status(text) {
    var el = document.getElementById("fg-save-state");
    if (el) el.textContent = text;
  }

  function save(raw) {
    if (get(VIEW) || !userId) return;
    // Prefer the tool's live state (the title and summary helpers read it too), so the two never disagree.
    var s;
    try { s = (typeof state === "object" && state) ? JSON.parse(JSON.stringify(state)) : JSON.parse(raw); } catch (e) { return; }
    var ready = false; try { ready = T.ready(s); } catch (e) {}
    if (!ready) return;
    if (busy) { pending = raw; return; }
    var title = "", summary = "";
    try { title = String(T.title(s) || "").slice(0, 200); } catch (e) {}
    try { summary = String(T.summary(s) || "").slice(0, 300); } catch (e) {}
    var row = { title: title, summary: summary, data: s };
    var id = get(LINK);
    busy = true; status("Saving…");
    var done = function () {
      busy = false;
      if (pending) { var p = pending; pending = null; save(p); }
    };
    var insert = function () {
      return sb.from("hub_results").insert(Object.assign({ tool: toolId }, row)).select("id").single().then(function (r) {
        if (r.data) { put(LINK, r.data.id); status("Saved to My Results"); } else status("Not saved");
      });
    };
    var p = id
      ? sb.from("hub_results").update(row).eq("id", id).select("id").then(function (r) {
          if (r.data && r.data.length) { status("Saved to My Results"); return; }
          del(LINK); return insert(); // deleted elsewhere: save as a new result
        })
      : insert();
    p.then(done, function () { status("Not saved"); done(); });
  }

  function schedule(raw) {
    pending = null;
    clearTimeout(timer);
    timer = setTimeout(function () { timer = null; save(raw); }, 1200);
  }
  function flush() { if (timer) { clearTimeout(timer); timer = null; save(get(T.key)); } }

  Storage.prototype.setItem = function (k, v) {
    origSet.apply(this, arguments);
    if (this === ls && k === T.key && !loading) schedule(v);
  };
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });

  function banner() {
    if (!get(VIEW)) return;
    var b = document.createElement("div");
    b.setAttribute("style", "font:500 14px/1.4 Manrope,Arial,sans-serif;background:#b42318;color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap");
    b.innerHTML = "<span><strong>Viewing a client’s result.</strong> Changes here aren’t saved.</span>";
    var x = document.createElement("button");
    x.textContent = "Close and go back to My Results";
    x.setAttribute("style", "font:600 14px Manrope,Arial,sans-serif;background:#fff;color:#b42318;border:0;padding:8px 12px;cursor:pointer");
    x.onclick = function () { restoreStash(); location.href = "/results/"; };
    b.appendChild(x);
    document.body.insertBefore(b, document.body.firstChild);
  }

  sb.auth.getSession().then(function (r) {
    if (!(r.data && r.data.session)) return;
    userId = r.data.session.user.id;
    var start = function () {
      banner();
      // Saves work already on this device (including work done before My Results existed).
      if (!get(VIEW) && get(T.key)) save(get(T.key));
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  });
})();
