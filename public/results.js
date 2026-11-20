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
      summary: function () { var r = results(); return r.score == null ? "" : r.score + "% ready"; },
      facts: function (s) { var r = results(); return { rows: [["Result", r.t && r.t.title], ["Readiness", r.score == null ? "" : r.score + "%"], ["Capacity", s.capacity], ["Measures not started", r.none]] }; }
    },
    "risk-assessment": {
      label: "Risk Assessment Generator", key: "fg-ra-builder-v1", tab: "report",
      ready: function (s) { return !!(s.type && (s.name || s.venue)); },
      title: function (s) { return s.name || s.venue || "Risk assessment"; },
      summary: function () { var n = results().all.length; return n + " hazard" + (n === 1 ? "" : "s"); },
      facts: function () { var r = results(); return { rows: [["Hazards identified", r.all.length], ["Rated high or very high", r.all.filter(function (h) { return h.score >= 10; }).length]], lines: r.all.slice(0, 15).map(function (h) { return h.haz + " (" + rating(h.score)[0].toLowerCase() + "): " + h.ctrl; }) }; }
    },
    "licensing": {
      label: "Licensing & TEN Guidance", key: "fg-licensing-v1", tab: "plan",
      ready: function (s) { return !!(s.postcode || (s.acts && s.acts.length)); },
      title: function (s) { return s.name || s.postcode || "Licensing check"; },
      summary: function (s) { return [s.council, s.date].filter(Boolean).join(", "); },
      facts: function (s) { return { rows: [["Council", s.council], ["Postcode", s.postcode], ["Date", s.date], ["Licensable activities", (s.acts || []).join(", ")]] }; }
    },
    "power-planner": {
      label: "Power Planner", key: "fg-power-planner-v1", tab: "power",
      ready: function (s) { var q = s.qty || {}; return Object.keys(q).some(function (k) { return q[k] > 0; }); },
      title: function (s) { return s.name || "Power plan"; },
      summary: function () { var c = calc(); return c.gen ? c.gen + " kVA " + (c.threePhase ? "three-phase" : "single-phase") + " generator" : "Over 1,000 kVA"; },
      facts: function () { var c = calc(); return { rows: [["Generator", c.gen ? c.gen + " kVA " + (c.threePhase ? "three-phase" : "single-phase") : "Over 1,000 kVA"], ["Peak load", (c.peakVA / 1000).toFixed(1) + " kVA"], ["Fuel use", c.lph ? c.lph.toFixed(1) + " litres an hour" : ""], ["Venue supply instead", c.supply && c.supply.amps ? c.supply.amps + " A " + c.supply.label : ""]] }; }
    },
    "run-sheet": {
      label: "Run Sheet & Call Sheet", key: "fg-run-sheet-v1", tab: "schedule",
      ready: function (s) { return !!(s.name && ((s.items && s.items.length) || (s.crew && s.crew.length))); },
      title: function (s) { return s.name || "Run sheet"; },
      summary: function (s) {
        var d = s.date ? new Date(s.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
        var n = (s.items || []).length, k = (s.crew || []).length;
        return [d, n + " cue" + (n === 1 ? "" : "s"), k + " crew call" + (k === 1 ? "" : "s")].filter(Boolean).join(", ");
      },
      facts: function (s) { var it = (s.items || []).slice().sort(function (a, b) { return ((a.date || s.date || "") + (a.start || "")).localeCompare((b.date || s.date || "") + (b.start || "")); }); return { rows: [["Date", s.date], ["Venue", s.venue], ["Nearest A&E", s.hospital], ["Cues", it.length], ["Crew calls", (s.crew || []).length]], lines: it.slice(0, 30).map(function (x) { return (x.start || "") + (x.end ? "–" + x.end : "") + " " + (x.title || "") + (x.where ? " (" + x.where + ")" : ""); }), contacts: (s.contacts || []).slice(0, 20).map(function (x) { return [x.name || "", x.role || "", x.phone || ""]; }) }; }
    },
    "staffing": {
      label: "Security Staffing Calculator", key: "fg-staffing-v1", tab: "staff",
      ready: function () { return calc().ready; },
      title: function (s) { return s.name || "Staffing plan"; },
      summary: function () { var c = calc(); return c.total + " staff for " + c.cap.toLocaleString("en-GB") + " people (" + c.ds + " door supervisors" + (c.st ? ", " + c.st + " stewards" : "") + ")"; },
      facts: function () { var c = calc(); return { rows: [["Door supervisors", c.ds], ["Stewards", c.st], ["Response team", c.resp], ["Supervisors", c.sup], ["Head of security", c.head], ["Relief", c.relief], ["Total", c.total], ["Female staff (of total)", c.female]], lines: [c.dsWhy, c.stWhy].filter(Boolean) }; }
    },
    "quote": {
      label: "Event Quote Estimator", key: "fg-quote-v1", tab: "estimate",
      ready: function (s) { return !!(s.name && ["security", "power", "crew", "equipment"].some(function (k) { return s[k] && s[k].on; })); },
      title: function (s) { return s.name || "Event estimate"; },
      summary: function (s) {
        var on = [["security", "security"], ["power", "power"], ["crew", "crew"], ["equipment", "equipment"]].filter(function (x) { return s[x[0]] && s[x[0]].on; }).map(function (x) { return x[1]; });
        return [s.date ? new Date(s.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "", on.join(", ")].filter(Boolean).join(": ");
      }
    },
    "welfare": {
      label: "Welfare & Provisions Calculator", key: "fg-welfare-v1", tab: "plan",
      ready: function () { return calc().ready; },
      title: function (s) { return s.name || "Welfare plan"; },
      summary: function () { var c = calc(); return c.wcNeeded + " toilets + " + c.urinals + " urinals, " + c.firstAid + " first aiders for " + c.people.toLocaleString("en-GB") + " people"; },
      facts: function () { var c = calc(); return { rows: [["Female toilets", c.fWC], ["Male toilets", c.mWC], ["Urinals", c.urinals], ["Accessible toilets", c.accessible], ["Hand-washing points", c.basins], ["Drinking water", c.water.toLocaleString("en-GB") + " litres"], ["Water points", c.outlets], ["First aiders", c.firstAid], ["Bins", c.bins]], lines: ["Based on: " + c.t.label.toLowerCase()] }; }
    },
    "event-plan": {
      label: "Event Management Plan", key: "fg-event-plan-v1", tab: "plan",
      ready: function (s) { return !!(s.name && s.type); },
      title: function (s) { return s.name || "Event plan"; },
      summary: function () { var p = progress(); return p.done + " of " + p.total + " sections complete" + (p.gaps ? ", " + p.gaps + " to do" : ""); }
    },
    "capacity": {
      label: "Capacity Calculator", key: "fg-capacity-v1", tab: "capacity",
      ready: function () { return calc().ready; },
      title: function (s) { return s.name || (s.mode === "outdoor" ? "Outdoor site" : "Venue"); },
      summary: function () { var c = calc(); return c.cap.toLocaleString("en-GB") + " people, set by " + c.min.label.toLowerCase(); },
      facts: function (s) { var c = calc(); return { rows: [["Safe capacity", c.cap.toLocaleString("en-GB")], ["Set by", c.min.label], [s.mode === "outdoor" ? "Crowd space allows" : "Floor space allows", c.floorCap.toLocaleString("en-GB")], ["Exit width allows", c.exitCap.toLocaleString("en-GB")], ["Exits", c.valid.length]] }; }
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

  var loading = false, timer = null, pending = null, busy = false, userId = null, inflight = Promise.resolve();

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

  // Key figures as plain strings, kept small, for the event plan builder.
  function clean(f) {
    var str = function (v) { return v == null || v === "" ? "" : String(v).slice(0, 400); };
    var out = {};
    out.rows = (f.rows || []).filter(function (r) { return str(r[1]) !== ""; }).map(function (r) { return [str(r[0]), str(r[1])]; });
    if (f.lines) out.lines = f.lines.map(str).filter(Boolean).slice(0, 30);
    if (f.contacts) out.contacts = f.contacts.map(function (r) { return r.map(str); });
    return out;
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
    var facts = null;
    try { facts = T.facts ? clean(T.facts(s)) : null; } catch (e) {}
    var row = { title: title, summary: summary, data: s, facts: facts };
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
    inflight = p.then(done, function () { status("Not saved"); done(); });
    return inflight;
  }

  // For tools that need their saved result's id straight away (e.g. a run sheet's crew link).
  window.FGResults.currentId = function () { return get(VIEW) ? null : get(LINK); };
  window.FGResults.saveNow = function () {
    clearTimeout(timer); timer = null;
    var r = save(get(T.key));
    return Promise.resolve(r || inflight).then(function () { return inflight; }).then(function () { return get(VIEW) ? null : get(LINK); });
  };
  window.FGResults.viewing = function () { return !!get(VIEW); };

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
