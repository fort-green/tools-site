// Fort Green client portal: reads shifts from the Staff Check-In project and handles
// extra-staff requests. Signed-in users only; venue access is checked on every call.
import { createClient } from "npm:@supabase/supabase-js@2";

const CHECKIN_URL = "https://yereihjkxbbnguvbjpcp.supabase.co";
const CHECKIN_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcmVpaGpreGJibmd1dmJqcGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTY3MzUsImV4cCI6MjEwOTM5MjczNX0.678GmM_-HMw8dEsoDf6exVJ2196fE0afqdz02f9_OOk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const DAY = 86400000;
const isUuid = (s: unknown) => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

async function checkin(fn: string, args: Record<string, unknown>) {
  const r = await fetch(`${CHECKIN_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: CHECKIN_ANON, Authorization: `Bearer ${CHECKIN_ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error((body && body.message) || `Staff Check-In error ${r.status}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await user.auth.getUser();
    if (!u?.user?.email) return json({ error: "Please sign in again." }, 401);
    const email = u.user.email.toLowerCase();
    const { data: blocked } = await user.rpc("hub_is_blocked");
    if (blocked === true) return json({ error: "Your access has been removed." }, 403);
    const { data: isStaff } = await user.rpc("cp_is_staff");

    const { data: keyRow, error: keyErr } = await admin.rpc("cp_checkin_key");
    if (keyErr || !keyRow) return json({ error: "Portal isn't connected to Staff Check-In." }, 503);
    const key = keyRow as string;

    const p = await req.json().catch(() => ({}));
    const canVenue = async (v: string) => {
      if (!isUuid(v)) return false;
      const { data } = await user.rpc("cp_can_venue", { p_venue: v });
      return data === true;
    };

    if (p.action === "venues") {
      if (isStaff === true) {
        const list = await checkin("portal_list_venues", { p_key: key });
        if (Array.isArray(list) && list.length) {
          await admin.from("cp_venues").upsert(
            list.map((v: any) => ({ venue_id: v.id, name: v.name, address: v.address, active: v.active, synced_at: new Date().toISOString() })),
            { onConflict: "venue_id" },
          );
        }
      }
      const { data, error } = await user.from("cp_venues").select("venue_id,name,address,active").order("name");
      if (error) throw error;
      return json({ staff: isStaff === true, email, venues: (data ?? []).filter((v) => v.active || isStaff === true) });
    }

    if (p.action === "schedule") {
      if (!(await canVenue(p.venue_id))) return json({ error: "Not allowed" }, 403);
      const from = new Date(p.from), to = new Date(p.to);
      if (isNaN(+from) || isNaN(+to) || to <= from || +to - +from > 62 * DAY) return json({ error: "Bad date range" }, 400);
      const shifts = await checkin("portal_schedule", { p_key: key, p_venue: p.venue_id, p_from: from.toISOString(), p_to: to.toISOString() });
      return json({ shifts });
    }

    if (p.action === "clicker") {
      if (!(await canVenue(p.venue_id))) return json({ error: "Not allowed" }, 403);
      const from = new Date(p.from), to = new Date(p.to);
      if (isNaN(+from) || isNaN(+to) || to <= from || +to - +from > 93 * DAY) return json({ error: "Bad date range" }, 400);
      const shifts = await checkin("portal_clicker", { p_key: key, p_venue: p.venue_id, p_from: from.toISOString(), p_to: to.toISOString() });
      return json({ shifts });
    }

    if (p.action === "request_staff") {
      if (!(await canVenue(p.venue_id))) return json({ error: "Not allowed" }, 403);
      const extra = Number(p.extra);
      if (!Number.isInteger(extra) || extra < 1 || extra > 50) return json({ error: "Choose between 1 and 50 extra staff." }, 400);
      if (!isUuid(p.job_id)) return json({ error: "Pick a shift." }, 400);
      const now = Date.now();
      const shifts = await checkin("portal_schedule", {
        p_key: key, p_venue: p.venue_id, p_from: new Date(now).toISOString(), p_to: new Date(now + 62 * DAY).toISOString(),
      });
      const job = (shifts || []).find((s: any) => s.id === p.job_id);
      if (!job) return json({ error: "That shift isn't open for changes (it may have finished or be more than 2 months away)." }, 400);
      const note = typeof p.note === "string" ? p.note.trim().slice(0, 1000) : null;
      const { data, error } = await admin.from("cp_staff_requests").insert({
        venue_id: p.venue_id, job_id: job.id, job_title: job.title, job_starts_at: job.starts_at, job_ends_at: job.ends_at,
        extra_staff: extra, note: note || null, requested_by: email, staff_needed_at_request: job.staff_needed,
      }).select().single();
      if (error) throw error;
      return json({ request: data });
    }

    if (p.action === "decide") {
      if (isStaff !== true) return json({ error: "Only Fort Green staff can do this." }, 403);
      if (!isUuid(p.request_id)) return json({ error: "Bad request id" }, 400);
      const { data: r } = await admin.from("cp_staff_requests").select("*").eq("id", p.request_id).single();
      if (!r) return json({ error: "Request not found" }, 404);
      if (r.status !== "pending") return json({ error: "This request has already been " + r.status + "." }, 409);
      const note = typeof p.note === "string" ? p.note.trim().slice(0, 1000) : null;
      let newNeeded: number | null = null;
      if (p.approve === true) {
        newNeeded = await checkin("portal_add_staff", { p_key: key, p_venue: r.venue_id, p_job: r.job_id, p_add: r.extra_staff });
      }
      const { data, error } = await admin.from("cp_staff_requests").update({
        status: p.approve === true ? "approved" : "declined", decided_by: email, decided_at: new Date().toISOString(),
        decision_note: note || null, new_staff_needed: newNeeded,
      }).eq("id", r.id).eq("status", "pending").select().single();
      if (error) throw error;
      return json({ request: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || "Something went wrong." }, 500);
  }
});
