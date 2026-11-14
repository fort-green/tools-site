# Fort Green tools site

Source for **https://tools.fortgreen.co.uk**. Netlify (project `tools-fortgreen`) publishes this repository automatically whenever `main` changes. There is no build step. Only the `public/` folder is published (set in `netlify.toml`), so this README stays private.

**Never drag and drop a folder into Netlify for this site.** Make every change here so changes from different people and chats add up instead of overwriting each other.

## What's here

| Path | What it is |
|---|---|
| `public/index.html` | Hub: email sign-in (Supabase one-time code) and the list of tools. Staff-only cards show for @fortgreen.co.uk accounts. |
| `public/config.js` | Supabase project URL, public anon key and staff email domain, shared by every page. |
| `public/auth-guard.js` | Include on any tool page to send signed-out visitors to the hub sign-in and back again. |
| `netlify.toml` | Publishes `public/` and sets security headers for the whole site. |
| `public/martyns-law/` | Martyn's Law readiness checker |
| `public/risk-assessment/` | Risk assessment generator |
| `public/licensing/` | Licensing and TEN guidance |
| `public/power-planner/` | Event power planner |
| `public/equipment/` | Equipment check-out: kit lists, issue, receipt and check-in (staff) |

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
