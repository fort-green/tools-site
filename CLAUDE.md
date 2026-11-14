# Rules for working on the Fort Green tools site

This repository is the **only** source for https://tools.fortgreen.co.uk. Netlify (project `tools-fortgreen`) publishes `main` automatically.

1. **Every change to the hub or any tool is committed and pushed to `main` on `fort-green/tools-site`.** That is how changes go live. Do not hand the user files to upload, and never tell them to drag and drop a folder into Netlify, because that overwrites the site and loses other people's changes.
2. **Start from the latest `main`.** Pull before editing, because other chats and people also push here. Never rebuild a file from an older copy held elsewhere.
3. Site files live in `public/`. Only that folder is published, so anything outside it (README, notes) stays private.
4. A new tool goes in `public/<tool-name>/index.html`, uses the auth guard (see README), and gets a card in `public/index.html`.
5. After pushing, check that the live page loads at https://tools.fortgreen.co.uk/<path>/ (deploys take under a minute), then tell the user what changed.
6. Write a clear commit message saying what changed and why, so the history explains itself.

See README.md for the site layout and for the services that live outside this repo (Supabase, n8n).
