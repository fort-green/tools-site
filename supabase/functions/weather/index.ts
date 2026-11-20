// Fort Green weather: returns Met Office Global Spot hourly forecasts for up to 3 places.
// Signed-in hub users only. The Met Office key lives in the METOFFICE_API_KEY secret and never
// reaches the browser. Forecasts are cached per ~2 km grid point for an hour (table wx_cache) and
// calls are counted per UTC day (wx_usage) so the DataHub plan isn't exceeded.
import { createClient } from "npm:@supabase/supabase-js@2";

const MO_URL = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly";
const CACHE_MINUTES = 60;
const DAILY_LIMIT = Number(Deno.env.get("METOFFICE_DAILY_LIMIT") ?? "340"); // free plan is 360 a day

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const grid = (x: number) => Math.round(x * 50) / 50; // 0.02 degrees, about 2 km
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);

// Keep only what the tool shows, for the next 48 hours.
function trim(api: any) {
  const f = api?.features?.[0];
  const p = f?.properties ?? {};
  const now = Date.now() - 3600000;
  const hours = (Array.isArray(p.timeSeries) ? p.timeSeries : [])
    .filter((t: any) => Date.parse(t.time) >= now)
    .slice(0, 49)
    .map((t: any) => ({
      t: t.time,
      temp: num(t.screenTemperature),
      feels: num(t.feelsLikeTemperature),
      wind: num(t.windSpeed10m),
      gust: num(t.windGustSpeed10m),
      maxGust: num(t.max10mWindGust),
      dir: num(t.windDirectionFrom10m),
      pop: num(t.probOfPrecipitation),
      rain: num(t.precipitationRate),
      code: num(t.significantWeatherCode),
      vis: num(t.visibility),
    }));
  return { name: p.location?.name ?? null, distance: num(p.requestPointDistance), modelRun: p.modelRunDate ?? null, hours };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: u } = await user.auth.getUser();
    if (!u?.user) return json({ error: "Please sign in again." }, 401);
    const { data: blocked } = await user.rpc("hub_is_blocked");
    if (blocked === true) return json({ error: "Your access has been removed." }, 403);

    const body = await req.json().catch(() => ({}));
    const places = (Array.isArray(body.places) ? body.places : []).slice(0, 3)
      .map((p: any) => ({ lat: Number(p?.lat), lon: Number(p?.lon) }))
      .filter((p: any) => isFinite(p.lat) && isFinite(p.lon) && p.lat >= 49 && p.lat <= 61.5 && p.lon >= -9 && p.lon <= 2.5);

    const key = Deno.env.get("METOFFICE_API_KEY");
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const results = [];
    for (const p of places) {
      const lat = grid(p.lat), lon = grid(p.lon), k = lat.toFixed(2) + "," + lon.toFixed(2);
      const { data: cached } = await admin.from("wx_cache").select("data,fetched_at").eq("key", k).maybeSingle();
      const age = cached ? (Date.now() - Date.parse(cached.fetched_at)) / 60000 : Infinity;
      if (cached && age < CACHE_MINUTES) { results.push({ ...cached.data, fetchedAt: cached.fetched_at }); continue; }

      const stale = cached ? { ...cached.data, fetchedAt: cached.fetched_at, stale: true } : null;
      if (!key) { results.push(stale ?? { error: "not_configured" }); continue; }
      const { data: allowed } = await admin.rpc("wx_take_call", { p_limit: DAILY_LIMIT });
      if (allowed !== true) { results.push(stale ?? { error: "busy" }); continue; }

      const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), includeLocationName: "true", excludeParameterMetadata: "true" });
      const r = await fetch(`${MO_URL}?${q}`, { headers: { apikey: key, accept: "application/json" } });
      if (!r.ok) { console.error("Met Office", r.status, await r.text().catch(() => "")); results.push(stale ?? { error: "unavailable" }); continue; }
      const data = trim(await r.json());
      const fetchedAt = new Date().toISOString();
      await admin.from("wx_cache").upsert({ key: k, data, fetched_at: fetchedAt });
      results.push({ ...data, fetchedAt });
    }
    return json({ results, source: "Met Office" });
  } catch (e) {
    console.error(e);
    return json({ error: "Weather is unavailable right now." }, 500);
  }
});
