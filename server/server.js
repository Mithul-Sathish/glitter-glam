// Glitter & Glam online server: player accounts, cloud saves and world rankings.
//
// No dependencies — plain Node 18+.  Start it with:
//
//   node server/server.js
//
// Settings (environment variables):
//   PORT            port to listen on (default 8787)
//   DATA_FILE       where accounts and scores are stored (default server/data/db.json)
//   ALLOWED_ORIGINS comma-separated list of sites allowed to call this server,
//                   e.g. "https://yourname.github.io". Default "*" (any site).
//
// What it stores per player: a display name, a salted password hash, their
// game save and their best scores. No email, no real name, no payments.

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const DATA_FILE = process.env.DATA_FILE || path.join(HERE, 'data', 'db.json');
const ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);

// Boards and the highest score each will accept (a simple guard against
// made-up scores; real play stays far below these).
const BOARDS = {
  starcatch: 20000, memory: 5000, bubble: 20000, rhythm: 30000, stylematch: 12000, simon: 20000,
  runway: 100, // best runway rating x10 (0..100)
};
const MAX_SAVE_BYTES = 64 * 1024;
const TOKEN_DAYS = 90;
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'rape', 'porn', 'sex', 'dick', 'pussy', 'whore', 'slut', 'nazi', 'hitler', 'admin', 'moderator'];

// ---------- storage (one JSON file, written atomically) ----------
let db = { users: {}, tokens: {} };
try { db = { users: {}, tokens: {}, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; } catch (e) { /* first run */ }
let dirty = false, writing = false;
function flush() {
  if (!dirty || writing) return;
  dirty = false; writing = true;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), (err) => {
    if (err) { writing = false; dirty = true; console.error('save failed', err.message); return; }
    fs.rename(tmp, DATA_FILE, () => { writing = false; if (dirty) flush(); });
  });
}
const touch = () => { dirty = true; };
setInterval(flush, 2000).unref();
function flushSync() {
  if (!dirty) return;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(db));
  fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
  dirty = false;
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flushSync(); process.exit(0); });

// ---------- helpers ----------
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function checkPassword(user, password) {
  const got = Buffer.from(hashPassword(password, user.salt).hash, 'hex');
  const want = Buffer.from(user.hash, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
function newToken(key) {
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens[sha(token)] = { key, exp: Date.now() + TOKEN_DAYS * 864e5 };
  touch();
  return token;
}
function userFor(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const t = db.tokens[sha(m[1])];
  if (!t) return null;
  if (t.exp < Date.now()) { delete db.tokens[sha(m[1])]; touch(); return null; }
  return db.users[t.key] || null;
}
function nameProblem(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(name)) return 'Names are 3 to 16 letters, numbers or _';
  const low = name.toLowerCase().replace(/[0134_]/g, (c) => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', _: '' }[c]));
  if (BLOCKED.some((w) => low.includes(w))) return 'Please pick a different name';
  return null;
}

// very small per-address rate limit
const hits = new Map();
function limited(ip, bucket, max, perMs) {
  const k = bucket + ip, now = Date.now();
  const h = hits.get(k) || { n: 0, t: now };
  if (now - h.t > perMs) { h.n = 0; h.t = now; }
  h.n++; hits.set(k, h);
  return h.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (now - h.t > 3600e3) hits.delete(k); }, 600e3).unref();

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    // oversize bodies are drained (not stored) so the 413 answer still arrives
    req.on('data', (c) => { size += c.length; if (size > max) { chunks.length = 0; reject(new Error('too big')); if (size > max * 4) req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (size > max) return; try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}
function board(game, me) {
  const rows = [];
  for (const u of Object.values(db.users)) { const s = u.scores[game]; if (s > 0) rows.push({ name: u.name, score: s, at: u.scoreAt?.[game] || 0 }); }
  rows.sort((a, b) => b.score - a.score || a.at - b.at);
  const top = rows.slice(0, 20).map((r, i) => ({ rank: i + 1, name: r.name, score: r.score }));
  let you = null;
  if (me) { const i = rows.findIndex((r) => r.name === me.name); if (i >= 0) you = { rank: i + 1, name: me.name, score: rows[i].score }; }
  return { game, total: rows.length, top, you };
}

// ---------- routes ----------
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (ORIGINS.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (origin && ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
  const url = new URL(req.url, 'http://x');
  const route = req.method + ' ' + url.pathname;
  try {
    if (limited(ip, 'all', 240, 60e3)) return send(res, 429, { error: 'Slow down a little and try again' });

    if (route === 'GET /api/health') return send(res, 200, { ok: true, players: Object.keys(db.users).length });

    if (route === 'POST /api/register' || route === 'POST /api/login') {
      if (limited(ip, 'auth', 20, 600e3)) return send(res, 429, { error: 'Too many tries. Wait a few minutes.' });
      const { name, password } = await readBody(req, 2048);
      if (typeof password !== 'string' || password.length < 6 || password.length > 72) return send(res, 400, { error: 'Passwords are 6 to 72 characters' });
      const key = String(name || '').toLowerCase();
      if (route === 'POST /api/register') {
        const problem = nameProblem(name);
        if (problem) return send(res, 400, { error: problem });
        if (db.users[key]) return send(res, 409, { error: 'That name is taken' });
        if (limited(ip, 'signup', 5, 3600e3)) return send(res, 429, { error: 'Too many new accounts from here. Try later.' });
        db.users[key] = { name, ...hashPassword(password), created: Date.now(), save: null, savedAt: 0, scores: {}, scoreAt: {} };
        touch();
        return send(res, 200, { name, token: newToken(key), save: null });
      }
      const user = db.users[key];
      if (!user || !checkPassword(user, password)) return send(res, 401, { error: 'Wrong name or password' });
      return send(res, 200, { name: user.name, token: newToken(key), save: user.save, savedAt: user.savedAt });
    }

    if (route === 'GET /api/leaderboard') {
      const game = url.searchParams.get('game');
      if (!(game in BOARDS)) return send(res, 400, { error: 'Unknown board' });
      return send(res, 200, board(game, userFor(req)));
    }

    // everything below needs a signed-in player
    const me = userFor(req);
    if (!me) return send(res, 401, { error: 'Please log in again' });

    if (route === 'POST /api/logout') {
      const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
      if (m) { delete db.tokens[sha(m[1])]; touch(); }
      return send(res, 200, { ok: true });
    }
    if (route === 'GET /api/save') return send(res, 200, { save: me.save, savedAt: me.savedAt });
    if (route === 'PUT /api/save') {
      const body = await readBody(req, MAX_SAVE_BYTES);
      const s = body.save;
      if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.coins !== 'number' || !Array.isArray(s.owned)) return send(res, 400, { error: 'Bad save' });
      me.save = s; me.savedAt = Date.now(); touch();
      return send(res, 200, { ok: true, savedAt: me.savedAt });
    }
    if (route === 'POST /api/score') {
      const { game, score } = await readBody(req, 1024);
      if (!(game in BOARDS)) return send(res, 400, { error: 'Unknown board' });
      if (!Number.isInteger(score) || score < 0 || score > BOARDS[game]) return send(res, 400, { error: 'Score not accepted' });
      if (score > (me.scores[game] || 0)) { me.scores[game] = score; me.scoreAt[game] = Date.now(); touch(); }
      return send(res, 200, board(game, me));
    }
    if (route === 'DELETE /api/account') {
      const { password } = await readBody(req, 2048);
      if (typeof password !== 'string' || !checkPassword(me, password)) return send(res, 401, { error: 'Wrong password' });
      const key = me.name.toLowerCase();
      delete db.users[key];
      for (const [k, t] of Object.entries(db.tokens)) if (t.key === key) delete db.tokens[k];
      touch();
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    return send(res, e.message === 'too big' ? 413 : 400, { error: 'Bad request' });
  }
});

server.listen(PORT, () => console.log(`Glitter & Glam server on port ${PORT} (data: ${DATA_FILE})`));
