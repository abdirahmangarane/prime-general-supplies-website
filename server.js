/**
 * Prime General Supplies & Services Company — website server
 * Pure Node.js (no npm dependencies) so it runs anywhere `node` runs.
 *
 * Serves the static frontend from /public and exposes a small JSON API:
 *   GET  /api/projects   -> real, verifiable contract history
 *   GET  /api/team       -> management team
 *   GET  /api/clients    -> partner organisations
 *   POST /api/contact    -> receives contact-form submissions, stores them
 *                            to data/messages.json and (optionally) emails
 *                            the office via a webhook if CONTACT_WEBHOOK_URL
 *                            is set in the environment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');

// ---------------------------------------------------------------------------
// Company data — sourced from the company profile and the company's real,
// signed purchase orders / works contracts.
// ---------------------------------------------------------------------------

const PROJECTS = [
  { id: 1, title: 'Construction of Institutional Toilets', client: 'NRC', clientFull: 'Norwegian Refugee Council', year: 2023, amount: 82789.97, location: 'Kismayo', category: 'WASH & Construction' },
  { id: 2, title: 'Rehabilitation of Shallow Wells', client: 'ALIGHT', clientFull: 'ALIGHT (American Refugee Committee)', year: 2023, amount: 54500.00, location: 'Kismayo', category: 'Water & Sanitation' },
  { id: 3, title: 'Supply of NFI Kits', client: 'CONTRASAD', clientFull: 'CONTRASAD', year: 2022, amount: 9789.13, location: 'Kismayo', category: 'General Supply' },
  { id: 4, title: 'Construction of Shallow Well with Mini-Solar Pump — Barka Village', client: 'SADO', clientFull: 'Social-Life & Agricultural Development Organization', year: 2022, amount: 49711.10, location: 'Barka Village, Kismayo', category: 'Water & Sanitation' },
  { id: 5, title: 'Rehabilitation of Primary School', client: 'ALIGHT', clientFull: 'ALIGHT (American Refugee Committee)', year: 2022, amount: 72784.45, location: 'Dhobley', category: 'Construction' },
  { id: 6, title: 'Rehabilitation of 2 Shallow Wells — Dalxiska', client: 'NRC', clientFull: 'Norwegian Refugee Council', year: 2021, amount: 36441.00, location: 'Kismayo', category: 'Water & Sanitation' },
  { id: 7, title: 'Construction of Latrines', client: 'ACTED', clientFull: 'Agency for Technical Cooperation and Development', year: 2020, amount: 45650.00, location: 'Kismayo', category: 'WASH & Construction' },
  { id: 8, title: 'Vehicle Rental — Monitoring & Evaluation', client: 'ARD', clientFull: 'ARD', year: 2019, amount: 18600.00, location: 'Dhobley', category: 'Logistics & Transport' },
  { id: 9, title: 'Borehole Assessment Survey', client: 'ACTED', clientFull: 'Agency for Technical Cooperation and Development', year: 2019, amount: 1850.00, location: 'Birole', category: 'Water & Sanitation' },
  { id: 10, title: 'Institutional Construction Works', client: 'Islamic Relief', clientFull: 'Islamic Relief Somalia', year: 2018, amount: 67950.00, location: 'Balcad', category: 'Construction' },
  { id: 11, title: 'Transportation of Food Stuff', client: 'WFP', clientFull: 'World Food Programme', year: 2017, amount: 68600.00, location: 'Gobweyn', category: 'Logistics & Transport' },
  { id: 12, title: 'Construction of Shallow Well', client: 'NRC', clientFull: 'Norwegian Refugee Council', year: 2017, amount: 33750.00, location: 'Gobweyn', category: 'Water & Sanitation' },
  { id: 13, title: 'Rehabilitation of Commissioner Building', client: 'SAVE', clientFull: 'Save the Children', year: 2017, amount: 11550.00, location: 'Kismayo', category: 'Construction' },
  { id: 14, title: 'Construction of Water Reservoirs', client: 'CONTRASAD', clientFull: 'CONTRASAD', year: 2016, amount: 4905.00, location: 'Dhobley', category: 'Water & Sanitation' },
  { id: 15, title: 'Construction of Slaughterhouse', client: 'NRC', clientFull: 'Norwegian Refugee Council', year: 2015, amount: 42450.00, location: 'Kismayo', category: 'Construction' },
  { id: 16, title: 'Construction of 9 Classrooms & 10 Latrines', client: 'Islamic Relief', clientFull: 'Islamic Relief Somalia', year: 2023, amount: null, location: 'Bardhere, Gedo', category: 'Construction' },
  { id: 17, title: 'Construction of 50 Emergency Shelters for New IDPs', client: 'Islamic Relief', clientFull: 'Islamic Relief Somalia', year: 2024, amount: null, location: 'Baidoa, Bay Region', category: 'Construction' },
  { id: 18, title: 'Flood-Protected Latrines with Solar Lighting', client: 'ACTED', clientFull: 'Agency for Technical Cooperation and Development', year: 2024, amount: 44815.74, location: 'Dhobley IDP Sites', category: 'WASH & Construction' },
  { id: 19, title: 'Supply of School DRR & Hygiene Kits', client: 'NRC / SADO', clientFull: 'Norwegian Refugee Council', year: 2025, amount: 3000.00, location: 'Kismayo Schools', category: 'General Supply' },
  { id: 20, title: 'Office & Institutional Supplies (multiple purchase orders)', client: 'WIS', clientFull: 'Windle International Somalia', year: 2025, amount: null, location: 'Kismayo / Nairobi', category: 'General Supply' },
  ];

const TEAM = [
  { id: 1, name: 'Abdirahman Garane', role: 'Chief Executive Officer', bio: 'Holds a Bachelor\u2019s degree in Business Management with 10+ years of experience in the private sector, especially humanitarian assistance.', photo: '/images/team/ceo_abdirahman_garane.jpeg' },
  { id: 2, name: 'Abdiaziz Gedow', role: 'ICT / Admin / Digital Director', bio: 'Holds a Bachelor\u2019s degree in ICT, specialising in market digitalisation, with 5+ years of experience in the private sector.', photo: '/images/team/ict_abdiaziz_gedow.jpeg' },
  { id: 3, name: 'Abdinoor Mohamed', role: 'Operations Manager', bio: 'Holds a Bachelor\u2019s degree in Business Management, specialising in marketing and supply-chain management, with 10+ years of private-sector experience.', photo: '/images/team/ops_abdinoor_mohamed.jpeg' },
  { id: 4, name: 'Abdiaziz Omar', role: 'HR Manager', bio: 'Holds a Bachelor\u2019s degree in Human Resource Management with 7+ years of experience across public and private sectors.', photo: '/images/team/hr_abdiaziz_omar.jpeg' },
  ];

const CLIENTS = [
  { name: 'Norwegian Refugee Council', short: 'NRC', logo: '/images/clients/NRC-Logo.png' },
  { name: 'Windle International Somalia', short: 'WIS', logo: '/images/clients/WIS_logo.jpeg' },
  { name: 'Islamic Relief Somalia', short: 'Islamic Relief', logo: '/images/clients/Islamic_relief_logo.png' },
  { name: 'ACTED', short: 'ACTED', logo: '/images/clients/Acted_Logo.jpeg' },
  { name: 'Social-Life & Agricultural Development Organization', short: 'SADO', logo: '/images/clients/SADO_logo.jpeg' },
  { name: 'ALIGHT', short: 'ALIGHT', logo: '/images/clients/ALIGHT_Logo.jpeg' },
  { name: 'World Food Programme', short: 'WFP', logo: '/images/clients/WFP_logo.png' },
  { name: 'Save the Children', short: 'SAVE', logo: '/images/clients/Save_logo.jpeg' },
  { name: 'CONTRASAD', short: 'CONTRASAD', logo: null },
  { name: 'ARD', short: 'ARD', logo: null },
  ];

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
};

function sendJSON(res, status, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(status, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
          'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
}

function readBody(req, maxBytes = 1e6) {
    return new Promise((resolve, reject) => {
          let data = '';
          let size = 0;
          req.on('data', (chunk) => {
                  size += chunk.length;
                  if (size > maxBytes) {
                            reject(new Error('Payload too large'));
                            req.destroy();
                            return;
                  }
                  data += chunk;
          });
          req.on('end', () => resolve(data));
          req.on('error', reject);
    });
}

// Extremely small in-memory rate limiter (per IP, per minute) to deter spam.
const rateBucket = new Map();
function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 5;
    const hits = (rateBucket.get(ip) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    rateBucket.set(ip, hits);
    return hits.length > limit;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

                                   // --- API routes ---------------------------------------------------------
                                   if (pathname === '/api/projects' && req.method === 'GET') {
                                         return sendJSON(res, 200, { ok: true, projects: PROJECTS });
                                   }

                                   if (pathname === '/api/team' && req.method === 'GET') {
                                         return sendJSON(res, 200, { ok: true, team: TEAM });
                                   }

                                   if (pathname === '/api/clients' && req.method === 'GET') {
                                         return sendJSON(res, 200, { ok: true, clients: CLIENTS });
                                   }

                                   if (pathname === '/api/contact' && req.method === 'POST') {
                                         try {
                                                 const ip = req.socket.remoteAddress || 'unknown';
                                                 if (isRateLimited(ip)) {
                                                           return sendJSON(res, 429, { ok: false, error: 'Too many requests. Please try again in a minute.' });
                                                 }

                                           const raw = await readBody(req);
                                                 let payload;
                                                 try {
                                                           payload = JSON.parse(raw);
                                                 } catch {
                                                           return sendJSON(res, 400, { ok: false, error: 'Invalid request body.' });
                                                 }

                                           const { name, email, phone, message, company, website } = payload || {};

                                           // Honeypot field — real users never fill this in.
                                           if (website) {
                                                     return sendJSON(res, 200, { ok: true }); // pretend success, drop silently
                                           }

                                           if (!name || !String(name).trim()) {
                                                     return sendJSON(res, 400, { ok: false, error: 'Please enter your name.' });
                                           }
                                                 if (!email || !isValidEmail(String(email).trim())) {
                                                           return sendJSON(res, 400, { ok: false, error: 'Please enter a valid email address.' });
                                                 }
                                                 if (!message || !String(message).trim()) {
                                                           return sendJSON(res, 400, { ok: false, error: 'Please enter a message.' });
                                                 }

                                           const entry = {
                                                     id: Date.now(),
                                                     name: String(name).trim().slice(0, 200),
                                                     email: String(email).trim().slice(0, 200),
                                                     phone: phone ? String(phone).trim().slice(0, 50) : '',
                                                     company: company ? String(company).trim().slice(0, 200) : '',
                                                     message: String(message).trim().slice(0, 4000),
                                                     receivedAt: new Date().toISOString(),
                                           };

                                           const existing = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
                                                 existing.push(entry);
                                                 fs.writeFileSync(MESSAGES_FILE, JSON.stringify(existing, null, 2));

                                           // Optional: forward to a webhook (e.g. Slack, Zapier, email service)
                                           // if the deployer sets CONTACT_WEBHOOK_URL as an environment variable.
                                           if (process.env.CONTACT_WEBHOOK_URL) {
                                                     const { CONTACT_WEBHOOK_URL } = process.env;
                                                     const https = CONTACT_WEBHOOK_URL.startsWith('https') ? require('https') : require('http');
                                                     try {
                                                                 const reqBody = JSON.stringify(entry);
                                                                 const target = new URL(CONTACT_WEBHOOK_URL);
                                                                 const whReq = https.request(
                                                                   {
                                                                                   hostname: target.hostname,
                                                                                   path: target.pathname + target.search,
                                                                                   port: target.port || (target.protocol === 'https:' ? 443 : 80),
                                                                                   method: 'POST',
                                                                                   headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reqBody) },
                                                                   },
                                                                               () => {}
                                                                             );
                                                                 whReq.on('error', () => {});
                                                                 whReq.write(reqBody);
                                                                 whReq.end();
                                                     } catch {
                                                                 /* non-fatal */
                                                     }
                                           }

                                           return sendJSON(res, 200, { ok: true, message: 'Thank you — your message has been received. We will get back to you shortly.' });
                                         } catch (err) {
                                                 return sendJSON(res, 500, { ok: false, error: 'Something went wrong. Please try again later.' });
                                         }
                                   }

                                   // --- Static file serving -------------------------------------------------
                                   if (req.method !== 'GET' && req.method !== 'HEAD') {
                                         res.writeHead(405);
                                         return res.end('Method Not Allowed');
                                   }

                                   let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

                                   // Prevent path traversal
                                   if (!filePath.startsWith(PUBLIC_DIR)) {
                                         res.writeHead(403);
                                         return res.end('Forbidden');
                                   }

                                   fs.stat(filePath, (err, stat) => {
                                         if (err || !stat.isFile()) {
                                                 // SPA-style fallback for unknown routes -> index.html
                                           const fallback = path.join(PUBLIC_DIR, 'index.html');
                                                 fs.readFile(fallback, (err2, data) => {
                                                           if (err2) {
                                                                       res.writeHead(404);
                                                                       return res.end('Not found');
                                                           }
                                                           res.writeHead(200, { 'Content-Type': MIME['.html'] });
                                                           res.end(data);
                                                 });
                                                 return;
                                         }
                                         const ext = path.extname(filePath).toLowerCase();
                                         res.writeHead(200, {
                                                 'Content-Type': MIME[ext] || 'application/octet-stream',
                                                 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
                                         });
                                         fs.createReadStream(filePath).pipe(res);
                                   });
});

server.listen(PORT, () => {
    console.log(`Prime General Supplies & Services Company website running at http://localhost:${PORT}`);
});
