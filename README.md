# Fort Green tools site

Source for **https://tools.fortgreen.co.uk**. Netlify (project `tools-fortgreen`) publishes this repository automatically whenever `main` changes. There is no build step. Only the `public/` folder is published (set in `netlify.toml`), so this README stays private.

**Never drag and drop a folder into Netlify for this site.** Make every change here so changes from different people and chats add up instead of overwriting each other.

## What's here

| Path | What it is |
|---|---|
| `public/index.html` | Hub: email sign-in (Supabase one-time code) and the list of tools. Staff-only cards show for @fortgreen.co.uk accounts. |
| `public/config.js` | Supabase project URL, public anon key and staff email domain, shared by every page. |
| `public/auth-guard.js` | Include on any tool page to send signed-out visitors to the hub sign-in and back again. |
| `public/staff-guard.js` | Use instead of `auth-guard.js` on staff-only pages: also sends signed-in non-staff back to the hub. |
| `netlify.toml` | Publishes `public/` and sets security headers for the whole site. |
| `public/martyns-law/` | Martyn's Law readiness checker |
| `public/risk-assessment/` | Risk assessment generator (free, client version). Its `HAZARDS` and `GAP` lists are the hazard library for both versions. |
| `public/risk-assessment-full/` | Risk assessment generator, full staff version: editable hazards and actions, revisions, branded Word and PDF export (staff) |
| `public/licensing/` | Licensing and TEN guidance |
| `public/power-planner/` | Event power planner, with a Fuel tab: litres per hour, amount to order (+10%, rounded to 50 L), hours per tank, refuelling schedule (refill at a quarter tank), cost and CO2 (2.66 kg CO2e/L diesel). Works from the equipment list or a generator size and load typed in |
| `public/capacity/` | Capacity calculator: safe capacity from floor space and exits (indoor, Approved Document B) or crowd density and egress time (outdoor, Green Guide rates), with Martyn's Law tier |
| `public/equipment/` | Equipment check-out: kit lists, issue, receipt and check-in (staff) |
| `public/portal/` | Client portal: bookings calendar, documents, extra staff requests, invoicing details, toolkit; staff manage client access |
| `supabase/functions/client-portal/` | Source of the client-portal edge function (deployed to Supabase, not served by Netlify) |
| `public/weather/` | Weather and wind: Met Office forecast and gusts for up to 3 saved UK places, 48-hour wind chart, optional caution/stop gust limits. The same places show as a swipeable gallery on the hub's first card |
| `public/wx.js` | Shared weather helpers and the hub weather card (`FGWeather.mountCard`) |
| `supabase/functions/weather/` | Source of the `weather` edge function (deployed to Supabase, not served by Netlify) |
| `public/run-sheet/` | Run sheet & call sheet builder: event details, contacts, timed cues, crew calls, crew link and PDFs. Saves to My Results (`hub_results`, tool `run-sheet`) |
| `public/run-sheet/view/` | Public crew view of a published run sheet (`?t=<token>`, no sign-in). `sheet.js`/`sheet.css` render it for both pages |
| `public/staffing/` | Security staffing calculator: door supervisors (1 per 100, or per entrance), stewards (1:250 / 1:100 by risk), response, supervisors, relief, with reasoning. Capacity Calculator links in with `?capacity=&mode=&name=` |
| `public/results/` | My Results: everyone's saved results from the free tools, with open, duplicate and delete. Admins can switch to all clients' results |
| `public/results.js` | Include on free tool pages (after auth-guard.js): autosaves the tool's work to `hub_results` and reopens it from `?result=<id>`. Tool settings (which localStorage key, title, summary) are in its `TOOLS` list |
| `public/users/` | Users (admins only): everyone who has signed in, with remove and restore access |
| `public/staff-guard.js` | Like auth-guard, but also sends non-staff back to the hub |

## Adding a tool

1. Add a folder inside `public/` with an `index.html`. In its `<head>`, include the guard so only signed-in users see it:
   ```html
   <style id="fg-guard">html{visibility:hidden}</style>
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   <script src="/config.js"></script>
   <script src="/auth-guard.js"></script>
   ```
2. Add a card for it in `public/index.html`: public tools in "Available to you", internal ones in "Staff only".
3. Commit to `main`. Netlify publishes in under a minute.

## Equipment tool: what lives outside this repo

- **Database:** Supabase project FORT GREEN PROJECT1, tables `eq_*`, functions `eq_issue`, `eq_acknowledge`, `eq_check_in` and `eq_cancel`.
- **Emails:** the n8n workflow "FG Equipment – email notifications" (sierra-six), sent through Gmail. The database posts to it when kit is issued, receipt is confirmed or kit is checked in. A daily 09:00 job (`eq-overdue-reminders`) sends overdue reminders.

## Martyn's Law checker: what lives outside this repo

- **Report form** posts to the n8n workflow "Martyn's Law: report request (lead capture)" (sierra-six, webhook `martyns-law-lead`). It emails the visitor their report via Gmail, logs every lead on the "Martyn's Law leads" tab of the Fort Green email list sheet, and adds opted-in people to the "Email list" tab.
- **Book a readiness review** posts to the n8n workflow "Martyn's Law: readiness review request alert" (webhook `martyns-law-review`), which emails niall@fortgreen.co.uk.
- **Save as PDF**: anyone who unlocks the report with an @fortgreen.co.uk email gets the Fort Green-branded version; everyone else gets a neutral version with Fort Green named only in the disclaimer.
- Both webhooks are public; a bot check (e.g. Cloudflare Turnstile) is still to be added.

## Risk assessment generator (full): what lives outside this repo

- **Database:** Supabase project FORT GREEN PROJECT1, table `ra_assessments` (one row per assessment, full job in `data`). Row-level security allows only signed-in @fortgreen.co.uk accounts, via `ra_is_staff()`. A trigger stamps `created_by`, `updated_by` and `updated_at`.
- **Hazard library:** read at page load from `public/risk-assessment/index.html` (the `HAZARDS` and `GAP` constants). Keep those two lines in the same format, or the full version can't load them.
- **Word export:** uses the `docx` library (8.5.0) from jsDelivr.

## Users and removing access

- **Admins** are the emails in the Supabase table `hub_admins` (currently Niall). Only they see the Users card and page.
- **Removing access** (`hub_remove_access`) records the person in `hub_blocks`, bans their sign-in and ends their sessions on every device. The staff checks (`eq_is_staff`, `ra_is_staff`, `lf_is_staff`) also refuse removed people, and every page using `auth-guard.js` or `staff-guard.js` signs them out. `hub_restore_access` undoes it. Every change is logged in `hub_access_log`.
- This covers every tool on this Supabase project. Staff Check-In (checkin.fortgreen.co.uk) runs on its own Supabase project, so removing access here doesn't affect it.

## Client portal

- **Who sees what:** staff (@fortgreen.co.uk) see every venue. Clients see only the venues their email is linked to, which staff set in the portal's Client access tab (table `cp_venue_access`). Venue names are copied from Staff Check-In into `cp_venues` whenever staff open the portal.
- **Bookings and extra staff:** shifts are read live from the Staff Check-In Supabase project through the `client-portal` edge function, which calls `portal_schedule`, `portal_list_venues` and `portal_add_staff` there with a shared key (vault secret `cp_checkin_key` here, hash in `portal_keys` there). Only shifts with a venue set in Staff Check-In appear. Clients only see staff first names. Requests are stored in `cp_staff_requests`; approving one raises `staff_needed` on the job in Staff Check-In.
- **New booking:** clients request a booking (event details, staff by role, special requests such as a sound system) into `cp_bookings`. Staff add a cost, VAT treatment, notes and quote documents (`cp_documents` kind `quote`, linked by `booking_id`) with `cp_quote_booking`; clients accept or decline with `cp_respond_booking`. Staff can decline (`cp_decline_booking`) and clients can cancel before accepting (`cp_cancel_booking`). Every step emails both Fort Green and the client. Accepted bookings still need their shifts set up in Staff Check-In by hand.
- **Documents:** private storage bucket `client-docs`, files at `<venue_id>/<kind>/...`, listed in `cp_documents`. Clients upload licences and other files; only staff can upload invoices.
- **Invoicing details:** `cp_billing`, with every change kept in `cp_billing_log`.
- **Emails:** n8n workflow "FG Client portal – email notifications" (sierra-six), sent through Gmail. Fort Green alerts go to info@fortgreen.co.uk (set as OPS in its Build email node); clients get emails when requests are decided and invoices are added.

## My Results: what lives outside this repo

- **Table:** `hub_results` in FORT GREEN PROJECT1 (one row per saved result; the tool's whole state in `data`). Row-level security: people read, change and delete only their own rows; admins (`hub_is_admin()`) can read everyone's. A trigger keeps `user_id`, `email`, `tool` and `created_at` fixed and stamps `updated_at`.
- **How saving works:** each free tool already keeps its work in one localStorage key. `results.js` watches that key and saves it about a second after each change, once the tool's `ready` check passes. A tool's "start again" button calls `FGResults.startNew()` so the next save becomes a new result.
- **Admins viewing a client's result:** it opens in the tool with a red banner, nothing is saved, and the admin's own work on that device is put back when they close it.
- **Adding a new free tool:** add it to `TOOLS` in `results.js`, add it to the `tool` check constraint on `hub_results`, include `results.js` on the page and call `FGResults.startNew()` in its reset button.

## Capacity calculator and power planner: what lives outside this repo

- **Report forms** post to the n8n workflows "Capacity calculator: report request (lead capture)" (webhook `capacity-lead`) and "Power planner: plan request (lead capture)" (webhook `power-planner-lead`) on sierra-six. Each emails the visitor their full report via Gmail, logs every lead on its own tab of the Fort Green email list sheet ("Capacity leads", "Power planner leads"), and adds opted-in people to the "Email list" tab.
- Both webhooks only accept browser requests from tools.fortgreen.co.uk, but like the Martyn's Law one they're public, so a bot check (e.g. Cloudflare Turnstile) is still to be added.

## Weather and wind: what lives outside this repo

- **Forecasts:** Met Office Weather DataHub, Site Specific **Global Spot** hourly API. The key is the Supabase edge function secret `METOFFICE_API_KEY` (never in this repo or the browser). Until it's set, the card and page say the forecast isn't connected.
- **Edge function `weather`** (source in `supabase/functions/weather/`): signed-in users only; takes up to 3 places, rounds each to a ~2 km grid point, serves cached forecasts from `wx_cache` for 60 minutes and otherwise calls the Met Office. Calls are counted per UTC day in `wx_usage` and stop at `METOFFICE_DAILY_LIMIT` (default 340, under the free plan's 360); after that it serves the last cached forecast. On a paid plan, raise that secret.
- **Places:** table `wx_places` (owner-only RLS, max 3 per person enforced by a trigger), with optional caution/stop gust limits in mph.
- **Place search:** postcodes.io (free, no key) for postcodes, outcodes, place names and "use my current location".

## Run sheet: what lives outside this repo

- **Saved run sheets** are rows in `hub_results` with tool `run-sheet`, autosaved by `results.js` like the other tools.
- **Crew links:** table `rs_shares` (one row per published run sheet, 64-character random token; owner-only via `rs_owns()`). Deleting the row turns the link off. The public view reads through `rs_view(token)`, the only part callable without signing in, which returns just that run sheet's content. The view refreshes every minute, so crew see edits without a new link.

## Staffing calculator: what lives outside this repo

- **Report form** posts to the n8n workflow "Staffing calculator: plan request (lead capture)" (webhook `staffing-lead`): emails the plan with the liability box at the top, logs to the "Staffing leads" tab, adds opted-in people to the Email list.
- **Ratios:** door supervisors 1 per 100 people (licensing model conditions) or enough for every entrance; stewards 1:250 lower risk and 1:100 higher risk or with children (Green Guide / SGSA). Everything else (risk points, response team, 1 supervisor per 10, head of security at 20+, 10% relief over 6 hours) is a Fort Green planning assumption and is labelled as such on the page.
