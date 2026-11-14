# Fort Green tools site

Source for **https://tools.fortgreen.co.uk**. Netlify (project `tools-fortgreen`) publishes this repository automatically whenever `main` changes. There is no build step: the files are served as they are.

**Never drag and drop a folder into Netlify for this site.** Make every change here so changes from different people and chats add up instead of overwriting each other.

## What's here

| Path | What it is |
|---|---|
| `index.html` | Hub: email sign-in (Supabase one-time code) and the list of tools. Staff-only cards show for @fortgreen.co.uk accounts. |
| `config.js` | Supabase project URL, public anon key and staff email domain, shared by every page. |
| `auth-guard.js` | Include on any tool page to send signed-out visitors to the hub sign-in and back again. |
| `netlify.toml` | Security headers for the whole site. |
| `martyns-law/` | Martyn's Law readiness checker |
| `risk-assessment/` | Risk assessment generator |
| `licensing/` | Licensing and TEN guidance |
| `power-planner/` | Event power planner |
| `equipment/` | Equipment check-out: kit lists, issue, receipt and check-in (staff) |

## Adding a tool

1. Add a folder with an `index.html`. In its `<head>`, include the guard so only signed-in users see it:
   ```html
   <style id="fg-guard">html{visibility:hidden}</style>
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   <script src="/config.js"></script>
   <script src="/auth-guard.js"></script>
   ```
2. Add a card for it in `index.html`: public tools in "Available to you", internal ones in "Staff only".
3. Commit to `main`. Netlify publishes in under a minute.

## Equipment tool: what lives outside this repo

- **Database:** Supabase project FORT GREEN PROJECT1, tables `eq_*`, functions `eq_issue`, `eq_acknowledge`, `eq_check_in` and `eq_cancel`.
- **Emails:** the n8n workflow "FG Equipment – email notifications" (sierra-six), sent through Gmail. The database posts to it when kit is issued, receipt is confirmed or kit is checked in. A daily 09:00 job (`eq-overdue-reminders`) sends overdue reminders.
