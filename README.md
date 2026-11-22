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
| `public/risk-assessment/` | Risk assessment generator (free, client version). Its `HAZARDS` and `GAP` lists are the hazard library for both versions. The report and A4 PDF unlock after name/email and are emailed by n8n workflow `risk-assessment-lead`, which logs to the **Risk assessment leads** tab |
| `public/risk-assessment-full/` | Risk assessment generator, full staff version: editable hazards and actions, revisions, branded Word and PDF export (staff) |
| `public/licensing/` | Licensing and TEN guidance. The dated action plan unlocks after name/email and is emailed by n8n workflow `licensing-lead`, which logs to the **Licensing leads** tab |
| `public/power-planner/` | Event power planner, with a Fuel tab: litres per hour, amount to order (+10%, rounded to 50 L), hours per tank, refuelling schedule (refill at a quarter tank), cost and CO2 (2.66 kg CO2e/L diesel). Works from the equipment list or a generator size and load typed in |
| `public/capacity/` | Capacity calculator: safe capacity from floor space and exits (indoor, Approved Document B) or crowd density and egress time (outdoor, Green Guide rates), with Martyn's Law tier |
| `public/equipment/` | Equipment check-out: kit lists, issue, receipt and check-in (staff) |
| `public/portal/` | Client portal: bookings calendar, documents, extra staff requests, invoicing details, toolkit; staff manage client access |
| `supabase/functions/client-portal/` | Source of the client-portal edge function (deployed to Supabase, not served by Netlify) |
| `public/weather/` | Weather and wind: Met Office forecast and gusts for up to 3 saved UK places, 48-hour wind chart, optional caution/stop gust limits. The same places show as a swipeable gallery on the hub's first card |
| `public/wx.js` | Shared weather helpers and the hub weather card (`FGWeather.mountCard`) |
| `public/live.js` | Hub Live capacity tile (`FGLive.mountCard`), Fort Green staff only: every job counting now from the Staff Check-In clicker, as a gallery when there's more than one |
| `public/tour.js` | Staff "Show me around" tour of the hub (button in the account bar, offered once on a staff member's first visit). Steps live in its `STEPS` list (selector, title, text); steps whose part isn't on screen, such as admin-only cards, are skipped. Add a step when a tool or hub feature is added |
| `public/journey.js` | "Planning an event?" strip (hub and Event Management Plan start): the free tools in planning order, ticked from the person's saved results in `hub_results`, next one highlighted. The order is its `STEPS` list; keep the hub cards in the same order |
| `supabase/functions/weather/` | Source of the `weather` edge function (deployed to Supabase, not served by Netlify) |
| `public/run-sheet/` | Run sheet & call sheet builder: event details, contacts, timed cues, crew calls, crew link and PDFs. Saves to My Results (`hub_results`, tool `run-sheet`) |
| `public/run-sheet/view/` | Public crew view of a published run sheet (`?t=<token>`, no sign-in). `sheet.js`/`sheet.css` render it for both pages |
| `public/staffing/` | Security staffing calculator: door supervisors (1 per 100, or per entrance), stewards (1:250 / 1:100 by risk), response, supervisors, relief, with reasoning. Capacity Calculator links in with `?capacity=&mode=&name=` |
| `public/quote/` | Event quote estimator: security, power, crew and equipment → one estimate (+VAT) from `qe_estimate()`, then a firm quote request |
| `public/quote/rates/` | Quote rates (admins only): edit the rate card in `qe_rates` |
| `public/welfare/` | Welfare & provisions calculator: toilets (Event Safety Guide / Purple Guide ratios by duration, alcohol and camping), hand washing, accessible toilets, drinking water, first aid (St John Ambulance), bins. Capacity Calculator links in with `?people=&name=`. Toilet numbers are free; the full plan (water, first aid, bins, PDF) unlocks after name/email and is emailed by n8n workflow `welfare-lead` ("Welfare calculator: plan request"), which checks the sign-in token, logs to the **Welfare leads** tab and adds opt-ins to the Email list |
| `public/event-plan/` | Event management plan builder: event details, team, and a 22-section checklist under Safety Advisory Group headings (Purple Guide / HSE). Each section can pull in a saved result from My Results (capacity, staffing, Martyn’s Law, welfare, run sheet, licensing, power, risk assessment) using the `facts` each tool saves. Progress and contents are free; the full written plan and PDF unlock after name/email and are emailed by n8n workflow `event-plan-lead`, which logs to the **Event plan leads** tab |
| `public/results/` | My Results: everyone's saved results from the free tools, with open, duplicate and delete. Admins can switch to all clients' results |
| `public/results.js` | Include on free tool pages (after auth-guard.js): autosaves the tool's work to `hub_results` and reopens it from `?result=<id>`. Tool settings (which localStorage key, title, summary) are in its `TOOLS` list |
| `public/users/` | Users (admins only): everyone who has signed in, with remove and restore access |
| `public/talent-match/` | Talent Match (staff, @fortgreen.co.uk): Gigs (gig details, then add talent from our list or search the internet), Bookings CRM by venue (Shortlisted → Offer sent → Confirmed → Performed → Invoiced → Paid), Venues, Our talent |
| `public/talent-match/confirm/` | Public artist page (`#t=<token>`, no sign-in): the artist reviews a booking, agrees the terms and accepts or declines |
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
- **Door counts:** the Door counts tab shows finished shifts at the venue that have clicker counts from the Staff Check-In app (staff count people in and out on the night). The `client-portal` function's `clicker` action calls `portal_clicker` there (same key), which returns totals, groups (e.g. PDR) and 15-minute trends. No staff names or notes reach clients.
- **New booking:** clients request a booking (event details, staff by role, special requests such as a sound system) into `cp_bookings`. Staff add a cost, VAT treatment, notes and quote documents (`cp_documents` kind `quote`, linked by `booking_id`) with `cp_quote_booking`; clients accept or decline with `cp_respond_booking`. Staff can decline (`cp_decline_booking`) and clients can cancel before accepting (`cp_cancel_booking`). Every step emails both Fort Green and the client. Accepted bookings still need their shifts set up in Staff Check-In by hand.
- **Documents:** private storage bucket `client-docs`, files at `<venue_id>/<kind>/...`, listed in `cp_documents`. Clients upload licences and other files; only staff can upload invoices.
- **Invoicing details:** `cp_billing`, with every change kept in `cp_billing_log`.
- **Live now:** the Live now tab shows shifts running at the venue (or starting within the hour) with people inside, came in, left, last count and groups, refreshed every 20 seconds. The `client-portal` function's `venue_live` action calls `portal_live` in Staff Check-In. Capacity comes from the venue capacity staff set in Client access (`cp_venues.capacity` and `warn_pct`, via the `set_capacity` action), or failing that the capacity the door team set on the shift. The bar turns amber at the warning level and red at capacity.
- **End of shift overview:** n8n workflow "FG Client portal – end of shift overview" runs every 15 minutes and calls the `client-portal` function with the `x-fg-cp-secret` header (checked against vault secret `cp_n8n_secret` by `cp_n8n_ok`). The function returns shifts that ended 30 minutes to 12 hours ago with door counts, at venues with client emails, that are not yet in `cp_shift_reports`. n8n emails each linked client separately (people in, peak inside, busiest 15 minutes, % of capacity, hour by hour, groups), then calls `report_sent` so each shift is only sent once.
- **Emails:** n8n workflow "FG Client portal – email notifications" (sierra-six), sent through Gmail. Fort Green alerts go to tools@fortgreen.co.uk (the Send email step swaps the OPS address in Build email for tools@); clients get emails when requests are decided and invoices are added.

## Printable reports (`public/report.js`)

Every tool's Save as PDF builds a separate A4 portrait document with `FGReport` (capacity, staffing, welfare, power and fuel, event plan, run and call sheets). The document is rebuilt on `beforeprint`, so Ctrl+P gives the same result as the button. Nothing else on the page prints. FORT GREEN branding in the header bar only appears when the signed-in person has a @fortgreen.co.uk email. Martyn's Law and the risk assessment use their own builders in the same layout.

## My Results

- **Key figures (`facts`):** each tool in `results.js` also saves a small `facts` object (rows of label and value, plus a few lines) to `hub_results.facts`, worked out with that tool's own calculations. The event plan builder reads these so it never has to re-run another tool. Results saved before November 2026 have no facts until they are opened again.: what lives outside this repo

- **Table:** `hub_results` in FORT GREEN PROJECT1 (one row per saved result; the tool's whole state in `data`). Row-level security: people read, change and delete only their own rows; admins (`hub_is_admin()`) can read everyone's. A trigger keeps `user_id`, `email`, `tool` and `created_at` fixed and stamps `updated_at`.
- **How saving works:** each free tool already keeps its work in one localStorage key. `results.js` watches that key and saves it about a second after each change, once the tool's `ready` check passes. A tool's "start again" button calls `FGResults.startNew()` so the next save becomes a new result.
- **Admins viewing a client's result:** it opens in the tool with a red banner, nothing is saved, and the admin's own work on that device is put back when they close it.
- **Adding a new free tool:** add it to `TOOLS` in `results.js`, add it to the `tool` check constraint on `hub_results`, include `results.js` on the page and call `FGResults.startNew()` in its reset button.

## Capacity calculator and power planner: what lives outside this repo

- **Report forms** post to the n8n workflows "Capacity calculator: report request (lead capture)" (webhook `capacity-lead`) and "Power planner: plan request (lead capture)" (webhook `power-planner-lead`) on sierra-six. Each emails the visitor their full report via Gmail, logs every lead on its own tab of the Fort Green email list sheet ("Capacity leads", "Power planner leads"), and adds opted-in people to the "Email list" tab.

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

## Sign-up forms: bot protection

- Every tool form posts through `public/lead.js` (`FGLead.post`), which adds the signed-in user's Supabase access token to the body.
- Each lead workflow in n8n (Martyn's Law report and review, capacity, power planner, staffing) starts with **Check signed in**: it calls `/auth/v1/user` on FORT GREEN PROJECT1 with that token. A missing or invalid token gets a 401/403, which stops the workflow before any email or sheet row. **Signed-in request** then merges the original webhook data back so the rest runs unchanged.
- A new tool form must use `FGLead.post`, and its workflow needs the same two nodes.

## Quote estimator: what lives outside this repo

- **Rate card:** table `qe_rates` (excluding VAT). Only admins (`hub_is_admin()`) can read or change it, on `/quote/rates/`; a trigger records who changed what. Blank rates are left out of estimates and listed as "not priced".
- **Estimates:** `qe_estimate(jsonb)` (security definer, signed-in users only) works out the total and per-service subtotals on the server, so clients never see unit rates. Staff and crew pay at least the minimum shift (`sec_min_hours`, `crew_min_hours`) per person per day; generators are per day plus delivery once each; the booking fee is added once.
- **Firm quote requests** post (with sign-in proof) to the n8n workflow "Quote estimator: firm quote request" (webhook `quote-request`): emails tools@fortgreen.co.uk (reply goes to the client), sends the client a confirmation with the "estimate, not a quote" box at the top, logs to the "Quote requests" tab, adds opted-in people to the Email list.

## Talent Match: what lives outside this repo

- **Who can use it:** every signed-in @fortgreen.co.uk account that hasn't had its access removed (`tm_is_staff()`) sees briefs, shortlists and bookings. Only admins (`hub_admins`) can create, change and send bookings.
- **Flow:** a gig (row in `tm_briefs`: name, `venue_id`, details in `event`, search acts in `acts`) is created first. Talent is added either "From our list" (`tm_roster`) or from "Search the internet" results (`tm_candidates`). Either way "Add to bookings" creates a `tm_bookings` row (status `draft`, shown as Shortlisted) carrying the gig's `brief_id`, `venue_id`, venue name and address.
- **Venues:** view `tm_venue_list` = active client-portal venues (`cp_venues`, synced from Staff Check-In) plus venues added in Talent Match (`tm_venues`, staff read/write, removed by setting `active` false). Talent-only venues are kept out of `cp_venues` so the client portal and its Staff Check-In calls are unaffected.
- **CRM stages:** draft (Shortlisted), sent/viewed (Offer sent), accepted (Confirmed), then `performed`, `invoiced`, `paid` set only by admins through `tm_booking_stage(p_id, p_stage)` (one step forward or back; stamps `performed_at`, `invoiced_at`, `paid_at`; logs kind `stage`). `invoice_ref` holds the artist's invoice number. Declined/cancelled close a booking.
- **Search:** "Search the internet" calls `tm_start_search`, which posts the brief to the n8n workflow "Talent match: brief to artist shortlist" (sierra-six, webhook `talent-match`, header from vault secret `tm_n8n_secret`). n8n searches the web, Instagram, TikTok, Facebook and Mixcloud through Brave Search, Claude scores the results, and the shortlist comes back through `tm_save_results`. A copy also goes to the Google Sheet "Fort Green – Talent Match Shortlists". Unbooked shortlisted acts are deleted after 12 months (`tm-purge-stale-candidates`).
- **Roster:** table `tm_roster` (staff read and write): acts Fort Green already works with, with contact name, email, WhatsApp number (stored as +44…) and which of the two to use for booking requests and reminders. "Add from our roster" puts roster acts on a brief's shortlist (`tm_candidates.roster_id`, origin `roster`); "Add to roster" saves a searched act. Bookings made from a roster act copy its email and WhatsApp and keep `tm_bookings.roster_id`. Email is sent automatically; WhatsApp is still one-tap until the WhatsApp Business account is approved.
- **Bookings:** tables `tm_bookings` and `tm_booking_log`. Admins send with `tm_booking_send` (email) or `tm_booking_whatsapp` (records a one-tap WhatsApp: the page opens wa.me with the message and link written, the admin presses send). `tm_booking_cancel` and `tm_booking_reopen` change status; nothing else can change status, token or tracking columns.
- **Artist link:** `https://tools.fortgreen.co.uk/talent-match/confirm/#t=<token>`. The page calls `tm_booking_view` (marks it opened) and `tm_booking_respond` (accept with terms agreed, or decline). Internal notes are never returned. When an artist confirms a booking made from a shortlist, the act is marked Booked there.
- **Emails:** n8n workflow "FG Talent – booking emails" (webhook `fg-talent-booking`, header from vault secret `tm_booking_n8n_secret`), sent from Gmail as "Fort Green Bookings": booking request, updated details, reminders, cancellations to the artist; accepted, declined and no-answer alerts to admins.
- **Automatic reminders:** daily job `tm-booking-daily` (09:05 UTC, `tm_private.daily()`): chases unanswered requests by email every 2 days, 3 times, then emails admins; reminds confirmed artists 7 days and 1 day before the event.
- **Automatic WhatsApp (later):** once Meta approves the WhatsApp Business Platform account and a message template, add a WhatsApp Business Cloud node to "FG Talent – booking emails". Its "Build booking email" step already outputs `artist_phone` and `whatsapp_text`.

## Sign-up profiles and review

- **First sign-in:** everyone outside @fortgreen.co.uk fills in a short profile (name, company or venue, role, optional phone and plans) on the hub before using any tool. Table `hub_profiles` (own row only; admins read all). `auth-guard.js` sends anyone without a profile back to the hub, then on to the tool they wanted.
- **Alert:** a trigger on `hub_profiles` posts to the n8n workflow "FG Hub – new sign-up alert" (webhook `fg-hub-signup`, header from vault secret `cp_n8n_secret`), which emails tools@fortgreen.co.uk with their details and a link to `/users/#new`.
- **Review:** the Users page has a "To review" filter and count. `hub_review_user(user, reviewed, note)` (admins only) marks someone reviewed with a note. Removing access works as before.

## Email inbox

All Fort Green alerts from the tools (sign-ups, client portal, quote requests, Martyn's Law review requests, Talent Match accepted/declined/no answer, Xero drafts) go to **tools@fortgreen.co.uk**, and every email sent to clients, visitors and artists has tools@ as its reply-to. Emails are still sent through the n8n Gmail credential "Gmail account" until a credential for tools@ is connected. Sign-in codes come from access@fortgreen.co.uk through Resend and are separate.
