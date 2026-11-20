// Fort Green weather: shared helpers for the hub's weather card and the /weather/ page.
// Places live in Supabase (wx_places, max 3 per person). Forecasts come from the "weather"
// edge function, which calls the Met Office and caches the results.
(function () {
  var CODES = {
    0: "Clear night", 1: "Sunny", 2: "Partly cloudy", 3: "Partly cloudy", 4: "Unavailable", 5: "Mist", 6: "Fog",
    7: "Cloudy", 8: "Overcast", 9: "Light showers", 10: "Light showers", 11: "Drizzle", 12: "Light rain",
    13: "Heavy showers", 14: "Heavy showers", 15: "Heavy rain", 16: "Sleet showers", 17: "Sleet showers", 18: "Sleet",
    19: "Hail showers", 20: "Hail showers", 21: "Hail", 22: "Light snow showers", 23: "Light snow showers",
    24: "Light snow", 25: "Heavy snow showers", 26: "Heavy snow showers", 27: "Heavy snow", 28: "Thundery showers",
    29: "Thundery showers", 30: "Thunder"
  };
  var POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mph(ms) { return ms == null ? null : Math.round(ms * 2.23694); }
  function compass(d) { return d == null ? "" : POINTS[Math.round(((d % 360) + 360) % 360 / 22.5) % 16]; }
  function hhmm(t) { return new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }); }
  function dayLabel(t) {
    var d = new Date(t), now = new Date();
    var key = function (x) { return x.toLocaleDateString("en-GB", { timeZone: "Europe/London" }); };
    if (key(d) === key(now)) return "Today";
    if (key(d) === key(new Date(now.getTime() + 86400000))) return "Tomorrow";
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });
  }
  function when(t) { var d = dayLabel(t); return (d === "Today" ? "" : d + " ") + hhmm(t); }
  function atWhen(t) { var d = dayLabel(t); return (d === "Today" ? "" : d.replace("Tomorrow", "tomorrow") + " ") + "at " + hhmm(t); }
  // Arrow pointing the way the wind is blowing to. The icon points down (wind from the north), and the
  // Met Office gives the direction it comes from, so rotating by that bearing points it downwind.
  function arrow(d, size) {
    if (d == null) return "";
    size = size || 16;
    return '<svg class="wx-arrow" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + (((d % 360) + 360) % 360) + 'deg)"><path d="M12 3v18M5 14l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // Works out what the card and page show for one place.
  function summarise(fc, place) {
    var hours = (fc && fc.hours) || [];
    if (!hours.length) return null;
    var nowMs = Date.now();
    var now = hours.find(function (h) { return Date.parse(h.t) >= nowMs - 30 * 60000; }) || hours[0];
    function within(h, n) { var t = Date.parse(h.t); return t >= nowMs - 30 * 60000 && t <= nowMs + n * 3600000; }
    function peak(n) {
      var best = null;
      hours.filter(function (h) { return within(h, n); }).forEach(function (h) {
        var g = h.gust != null ? h.gust : h.maxGust;
        if (g != null && (!best || g > best.g)) best = { g: g, t: h.t };
      });
      return best ? { mph: mph(best.g), t: best.t } : null;
    }
    var p12 = peak(12), p24 = peak(24);
    var pop12 = 0;
    hours.filter(function (h) { return within(h, 12); }).forEach(function (h) { if (h.pop != null && h.pop > pop12) pop12 = h.pop; });
    var status = null;
    var caution = place && place.caution_gust_mph, stop = place && place.stop_gust_mph;
    if ((caution || stop) && p24) {
      var first = function (limit) {
        var h = hours.find(function (x) { var g = x.gust != null ? x.gust : x.maxGust; return within(x, 24) && g != null && mph(g) >= limit; });
        return h ? h.t : null;
      };
      var tStop = stop ? first(stop) : null, tCaution = caution ? first(caution) : null;
      if (tStop) status = { level: "stop", text: "Gusts reach your stop limit (" + stop + " mph) " + atWhen(tStop) };
      else if (tCaution) status = { level: "caution", text: "Gusts reach your caution limit (" + caution + " mph) " + atWhen(tCaution) };
      else status = { level: "ok", text: "Gusts stay under your limits for the next 24 hours" };
    }
    return {
      now: now, temp: now.temp != null ? Math.round(now.temp) : null, feels: now.feels != null ? Math.round(now.feels) : null,
      text: CODES[now.code] || "", wind: mph(now.wind), gust: mph(now.gust != null ? now.gust : now.maxGust), dir: now.dir,
      peak12: p12, peak24: p24, pop12: pop12, status: status
    };
  }

  async function loadPlaces(sb) {
    var r = await sb.from("wx_places").select("*").order("position").order("created_at");
    if (r.error) throw r.error;
    return r.data || [];
  }
  async function forecasts(sb, places) {
    if (!places.length) return [];
    var r = await sb.functions.invoke("weather", { body: { places: places.map(function (p) { return { lat: p.lat, lon: p.lon }; }) } });
    if (r.error || !r.data || !r.data.results) throw new Error("Weather is unavailable right now.");
    return r.data.results;
  }
  function problem(fc) {
    if (!fc) return "No forecast yet.";
    if (fc.error === "not_configured") return "The Met Office forecast isn’t connected yet.";
    if (fc.error === "busy") return "Forecast limit reached for today. It’ll be back after midnight.";
    if (fc.error) return "Forecast unavailable right now.";
    if (!fc.hours || !fc.hours.length) return "No forecast for this place.";
    return null;
  }

  function slideHTML(place, fc) {
    var s = summarise(fc, place), issue = problem(fc);
    var head = '<div class="wx-place"><b>' + esc(place.label) + '</b>' + (place.place && place.place !== place.label ? '<span>' + esc(place.place) + '</span>' : '') + '</div>';
    if (issue || !s) return '<a class="wx-slide" href="/weather/#p-' + place.id + '">' + head + '<p class="wx-issue">' + esc(issue || "No forecast yet.") + '</p></a>';
    return '<a class="wx-slide" href="/weather/#p-' + place.id + '">' + head +
      '<div class="wx-now"><b>' + (s.temp != null ? s.temp + "°" : "–") + '</b><span>' + esc(s.text) + '</span></div>' +
      '<div class="wx-wind">' + arrow(s.dir, 18) + '<span><b>' + (s.wind != null ? s.wind : "–") + '</b> mph ' + compass(s.dir) + ', gusts <b>' + (s.gust != null ? s.gust : "–") + '</b></span></div>' +
      '<div class="wx-next">Next 12 hours: gusts up to <b>' + (s.peak12 ? s.peak12.mph + " mph" : "–") + '</b>' + (s.peak12 ? " at " + hhmm(s.peak12.t) : "") + ', rain chance ' + s.pop12 + '%</div>' +
      (s.status ? '<div class="wx-status wx-' + s.status.level + '">' + esc(s.status.text) + '</div>' : '') +
      '</a>';
  }

  // Hub card: a swipeable gallery of the person's places.
  async function mountCard(card, sb) {
    if (!card || !sb) return;
    var body = card.querySelector("[data-wx-body]"), foot = card.querySelector("[data-wx-foot]");
    body.innerHTML = '<p class="wx-issue">Loading weather…</p>';
    try {
      var places = await loadPlaces(sb);
      if (!places.length) {
        body.innerHTML = '<div class="wx-empty"><p>See the Met Office forecast and wind gusts for up to three venues or sites, right here.</p><a class="btn" href="/weather/#add">Set your location</a></div>';
        if (foot) foot.textContent = "Met Office forecast";
        return;
      }
      var fcs = await forecasts(sb, places).catch(function () { return []; });
      body.innerHTML = '<div class="wx-gallery" tabindex="0" aria-label="Weather for your places">' +
        places.map(function (p, i) { return slideHTML(p, fcs[i]); }).join("") + '</div>' +
        (places.length > 1 ? '<div class="wx-dots" role="tablist">' + places.map(function (p, i) {
          return '<button type="button" role="tab" aria-label="' + esc(p.label) + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"></button>';
        }).join("") + '</div>' : "");
      var g = body.querySelector(".wx-gallery"), dots = body.querySelectorAll(".wx-dots button");
      var sync = function () {
        var i = Math.round(g.scrollLeft / Math.max(1, g.clientWidth));
        Array.prototype.forEach.call(dots, function (d, k) { d.setAttribute("aria-selected", k === i); });
      };
      g.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
      Array.prototype.forEach.call(dots, function (d) {
        d.onclick = function () { g.scrollTo({ left: Number(d.dataset.i) * g.clientWidth, behavior: "smooth" }); };
      });
      var newest = fcs.filter(function (f) { return f && f.fetchedAt; }).map(function (f) { return Date.parse(f.fetchedAt); }).sort().pop();
      if (foot) foot.textContent = "Met Office forecast" + (newest ? ", updated " + hhmm(newest) : "");
    } catch (e) {
      body.innerHTML = '<p class="wx-issue">Weather is unavailable right now.</p>';
    }
  }

  window.FGWeather = { CODES: CODES, esc: esc, mph: mph, compass: compass, hhmm: hhmm, dayLabel: dayLabel, when: when, atWhen: atWhen, arrow: arrow,
    summarise: summarise, loadPlaces: loadPlaces, forecasts: forecasts, problem: problem, slideHTML: slideHTML, mountCard: mountCard };
})();
