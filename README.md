# Prime General Supplies & Services Company — Website

A full-stack website for **Prime General Supplies & Services Company** (Kismayo, Somalia): a static frontend (plain HTML/CSS/JS, no build step) plus a small Node.js backend that serves the site and a JSON API (projects, team, clients, and a working contact form).

The design is a "dispatch manifest" system — built around the look of the company's own stamped purchase orders and delivery notes — using real content pulled from the company profile and 18 signed contracts/purchase orders on file.

## What's inside

```
site/
├── server.js              Node.js backend (zero npm dependencies)
├── package.json
├── data/                  Contact-form submissions are stored here at runtime
└── public/
    ├── index.html
    ├── css/style.css
    ├── js/main.js
    └── images/
        ├── logos/         Company logo (from your uploaded file)
        ├── team/          Real management-team photos (cropped from company profile)
        └── gallery/       Real project/site photos (cropped from company profile)
```

## Run it locally

Requires only [Node.js](https://nodejs.org) 18+ — no `npm install` needed.

```bash
cd site
node server.js
```

Then open **http://localhost:3000**.

## What the backend does

- Serves the frontend (`public/`)
- `GET /api/projects` — the 20 real contracts/purchase orders, used to render the "Contracts" section
- `GET /api/team` — the 4 management-team profiles
- `GET /api/clients` — the 10 partner organisations
- `POST /api/contact` — validates and stores contact-form submissions to `data/messages.json`, with basic spam protection (honeypot field + rate limiting)

To edit the contracts, team, or client list, edit the arrays at the top of `server.js` — the frontend re-renders automatically from whatever the API returns.

### Optional: forward contact-form messages to Slack/email

Set an environment variable before starting the server:

```bash
CONTACT_WEBHOOK_URL=https://hooks.slack.com/services/XXX node server.js
```

Any webhook that accepts a JSON `POST` will work (Slack incoming webhook, Zapier, Make, etc.).

## Putting it on the internet

This sandbox has no internet access, so the site could not be deployed live from here — but it's built to deploy in minutes on any of these:

### Option A — Render.com (free tier, easiest)
1. Push this `site/` folder to a GitHub repository.
2. On [render.com](https://render.com) → **New → Web Service** → connect the repo.
3. Build command: *(leave blank)*. Start command: `node server.js`.
4. Deploy. Render gives you a public `https://your-app.onrender.com` URL immediately.

### Option B — Railway.app
1. Push to GitHub, then **New Project → Deploy from GitHub repo** on [railway.app](https://railway.app).
2. Railway auto-detects Node.js and runs `node server.js`. Done.

### Option C — Any VPS (DigitalOcean, Linode, a Somalia-based host, etc.)
```bash
git clone <your-repo>
cd site
node server.js            # or use pm2 / systemd to keep it running
```
Put Nginx or Caddy in front for HTTPS and to map port 80/443 → 3000.

### Live URL
The site is currently live at **https://prime-general-supplies-website.onrender.com**.

### Custom domain (optional, later)
If you buy a domain in future, point it at the host with a CNAME (Render/Railway) or an A record (VPS), then enable HTTPS (all three options above provide free TLS).

## Notes on the content

- **Team photos** and **project/site photos** are real images extracted from the company's own company-profile deck.
- **Contract data** (client, year, amount, location) is transcribed from the company's real signed purchase orders and works contracts on file — not placeholder text.
- **Client logos**: rather than pulling third-party organisations' trademarked logo files from the internet, partner names are shown as clean text plates. If you have permission to use the official logo files for NRC, Islamic Relief, ACTED, WFP, etc., drop them into `public/images/clients/` and swap the `.client-plate` markup in `public/js/main.js` for `<img>` tags.
- The map on the Contact section uses OpenStreetMap (no API key required). Swap in a Google Maps embed if you'd prefer.
