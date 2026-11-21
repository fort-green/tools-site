# Rules for working on the Fort Green tools site

This repository is the **only** source for https://tools.fortgreen.co.uk. Netlify (project `tools-fortgreen`) publishes `main` automatically.

1. **Every change to the hub or any tool is committed and pushed to `main` on `fort-green/tools-site`.** That is how changes go live. Do not hand the user files to upload, and never tell them to drag and drop a folder into Netlify, because that overwrites the site and loses other people's changes.
2. **Start from the latest `main`.** Pull before editing, because other chats and people also push here. Never rebuild a file from an older copy held elsewhere.
3. Site files live in `public/`. Only that folder is published, so anything outside it (README, notes) stays private.
4. A new tool goes in `public/<tool-name>/index.html`, uses the auth guard (see README), and gets a card in `public/index.html`.
5. After pushing, check that the live page loads at https://tools.fortgreen.co.uk/<path>/ (deploys take under a minute), then tell the user what changed.
6. Write a clear commit message saying what changed and why, so the history explains itself.

See README.md for the site layout and for the services that live outside this repo (Supabase, n8n).

## Tool standard (every client tool works the same way)

Check a new or changed tool against this list before pushing.

1. **Page setup:** the `fg-guard` style, then supabase-js, `/config.js`, `/auth-guard.js` (or `/staff-guard.js` for staff-only pages), `/results.js` and `/lead.js`, in that order. The guard adds the top bar and the shared print rules (bar hidden, A4 portrait), so don't add your own `@page` unless the document really needs another size.
2. **My Results:** add the tool to `TOOLS` in `results.js` with `key`, `tab`, `ready`, `title`, `summary` and a `facts` function (key figures as label/value rows). Add its id to the `hub_results_tool_check` constraint.
3. **Free result, then email gate:** the headline result is free. The full report and Save as PDF unlock after name, email, organisation and a marketing tick box in the bottom sheet.
4. **Lead and email:** set `LEAD_ENDPOINT` to `https://sierra-six.app.n8n.cloud/webhook/<tool>-lead` and send with `FGLead.post(LEAD_ENDPOINT, lead)`, never a plain `fetch` and never a blank endpoint. Every tool has its own n8n workflow built the same way: Webhook (allowed origin tools.fortgreen.co.uk) → Check signed in (Supabase `/auth/v1/user` with the sent `access_token`) merged with the webhook → Build code (escape and clip everything from the request) → append to the tool's tab in the Fort Green email list sheet, Gmail to the visitor with the red "Important: please read before using this…" liability box at the top, and opted-in people to the Email list tab. Test with a request without a token (must stop at Check signed in) and one real sign-up.
5. **PDF:** a `#print-doc` built from the report, in the Martyn's Law layout: black header bar (FORT GREEN only when the person's email is @fortgreen.co.uk, otherwise the document name), big title, meta line, Antonio section headings with a rule, tables in the `pd-` style, and a liability footer. Hide everything else with `body > *:not(#print-doc)`. Rebuild it on `beforeprint`.
6. **Hub card** in `public/index.html`, and a row in the README tools table naming the n8n workflow and sheet tab.

