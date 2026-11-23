// Optional online layer: player accounts, cloud saves and world rankings.
// Everything here is a no-op unless an API address is configured (config.js),
// so the offline build never makes a network request.

import { ONLINE_API } from './config.js';
import { save, persist, onPersist, loadSaveData } from './save.js';

const SESSION_KEY = 'glitterglam_account_v1';
export const WORLD_BOARDS = ['starcatch', 'memory', 'bubble', 'rhythm', 'stylematch', 'simon', 'runway'];

function resolveApi() {
  let api = ONLINE_API;
  try {
    // local testing only: ?api=http://localhost:8787 on a localhost page
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/;
    const q = new URLSearchParams(location.search).get('api');
    if (q && local.test(location.hostname) && local.test(new URL(q).hostname)) api = q;
  } catch (e) { /* ignore */ }
  return (api || '').replace(/\/+$/, '');
}
const API = resolveApi();

let session = null;
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { session = null; }
if (session && (!session.name || !session.token)) session = null;

export const onlineEnabled = () => !!API;
export const account = () => (API && session ? { name: session.name } : null);

function setSession(s) {
  session = s;
  try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}

async function call(method, path, body) {
  if (!API) throw new Error('Online play is not set up');
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (session) headers.Authorization = 'Bearer ' + session.token;
  let res;
  try {
    res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) { throw new Error('Could not reach the game server. Check your connection.'); }
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty */ }
  if (res.status === 401 && session && path !== '/api/login' && path !== '/api/account') setSession(null);
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

// ---------- cloud save ----------
let pushTimer = null, pushing = false, pushAgain = false;
async function pushSaveNow() {
  if (!API || !session) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  try { await call('PUT', '/api/save', { save }); } catch (e) { /* retried on the next save */ }
  pushing = false;
  if (pushAgain) { pushAgain = false; pushSaveNow(); }
}
function queuePush() {
  if (!API || !session) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushSaveNow, 2500);
}
if (API) onPersist(queuePush);

function submitAllBests() {
  for (const id of WORLD_BOARDS) {
    const v = id === 'runway' ? Math.round((save.bestShow || 0) * 10) : (save.best[id] || 0);
    if (v > 0) submitScore(id, v);
  }
}

/** Send a score to the world ranking (ignored when signed out or offline). */
export function submitScore(game, score) {
  if (!API || !session) return;
  score = Math.round(score);
  if (!(score > 0)) return;
  call('POST', '/api/score', { game, score }).catch(() => {});
}

/** World ranking for one board: { total, top: [{rank,name,score}], you }. */
export function fetchBoard(game) { return call('GET', '/api/leaderboard?game=' + encodeURIComponent(game)); }

/**
 * Sign up or log in. Returns { name, restored } — restored is true when the
 * account's saved game replaced the one on this device (the page should reload).
 */
export async function signIn(mode, name, password) {
  const data = await call('POST', mode === 'register' ? '/api/register' : '/api/login', { name, password });
  setSession({ name: data.name, token: data.token });
  let restored = false;
  // Keep whichever game has more lifetime progress, so nothing is ever lost.
  if (data.save && (data.save.earned || 0) > (save.earned || 0)) restored = loadSaveData(data.save);
  await pushSaveNow();
  submitAllBests();
  return { name: data.name, restored };
}

export async function signOut() {
  persist();
  try { await pushSaveNow(); await call('POST', '/api/logout'); } catch (e) { /* signed out locally anyway */ }
  setSession(null);
}

export async function deleteAccount(password) {
  await call('DELETE', '/api/account', { password });
  setSession(null);
}

// when the page opens signed in, make sure the server has the latest
if (API && session) setTimeout(() => { pushSaveNow(); submitAllBests(); }, 1500);
