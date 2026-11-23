// Persistent progress in localStorage: coins, owned outfits, equipped looks,
// bests, daily streak, saved looks and character features.
//
// Saving is defensive: every write goes to the main key AND a backup key, the
// game also saves when the tab is hidden or closed, and a corrupted main save
// falls back to the backup instead of wiping progress. Players can also copy a
// "save code" and paste it on another link/device (see exportSave/importSave).

const KEY = 'glitterglam_save_v1';
const BACKUP_KEY = 'glitterglam_save_backup_v1';

const DEFAULTS = {
  coins: 120,          // little welcome gift so the first shop visit feels good
  earned: 120,         // lifetime coins earned — drives level
  owned: ['hair_waves_choc', 'dress_day_pink', 'shoes_flat_pink'],
  eq: {
    hair: 'hair_waves_choc',
    dress: 'dress_day_pink',
    shoes: 'shoes_flat_pink',
    hat: null,
    neck: null,
    bag: null,
    special: null,
  },
  skin: 0,
  // character features (indices into the tables in items.js)
  look: {
    hairDye: 0,        // 0 = the hairstyle's own colour
    eyeColor: 0,
    eyeShape: 0,
    brows: 0,
    mouth: 0,
    lips: 0,
    marks: 0,          // freckles / beauty mark / none
    blush: 0,
    lashes: 0,
  },
  looks: [null, null, null, null], // saved looks: { eq, skin, look }
  best: {},            // gameId -> best score
  plays: 0,
  shows: 0,
  wins: 0,
  winStreak: 0,        // fashion shows won back-to-back right now
  bestWinStreak: 0,
  bestShow: 0,         // best runway rating ever (0..10)
  sound: true,
  music: true,
  seenIntro: {},       // gameId -> true once instructions have been read
  daily: { last: '', streak: 0, best: 0 },  // daily attendance (local dates)
  challenge: { day: '', done: [] },          // today's challenges + which are claimed
  challengesDone: 0,                         // lifetime daily challenges completed
  stats: { day: '', plays: 0, shows: 0, coins: 0, games: {} }, // today's activity for challenges
  levelRewarded: 1,    // highest level whose level-up reward has been paid
  boostLeft: 3,        // first plays pay double coins (welcome boost)
  theme: 'day',        // 'day' | 'night'
};

// Lifetime-coins thresholds for each level (level 1 starts at 0).
export const LEVELS = [0, 300, 700, 1300, 2100, 3200, 4600, 6400, 8600, 11500, 15000];

export const save = load();

function merge(data) {
  const base = structuredClone(DEFAULTS);
  const out = { ...base, ...data };
  out.eq = { ...base.eq, ...(data.eq || {}) };
  out.look = { ...base.look, ...(data.look || {}) };
  out.daily = { ...base.daily, ...(data.daily || {}) };
  out.challenge = { ...base.challenge, ...(data.challenge || {}) };
  out.stats = { ...base.stats, ...(data.stats || {}) };
  if (!Array.isArray(out.looks)) out.looks = base.looks;
  while (out.looks.length < base.looks.length) out.looks.push(null);
  // migrate the old daily-gift streak into the new attendance streak
  if (data.lastGift && !data.daily) {
    out.daily = { last: data.lastGift, streak: data.giftStreak || 0, best: data.giftStreak || 0 };
  }
  delete out.lastGift;
  delete out.giftStreak;
  // players who already passed level 1 don't get a burst of back-pay
  if (data.levelRewarded == null && data.earned != null) out.levelRewarded = levelFor(out.earned);
  return out;
}

function readKey(k) {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch (e) { return null; }
}

function load() {
  const main = readKey(KEY);
  const backup = readKey(BACKUP_KEY);
  // prefer whichever save has more lifetime progress (guards against a
  // half-written or reset main key)
  let data = main;
  if (backup && (!main || (backup.earned || 0) > (main.earned || 0))) data = backup;
  if (data) return merge(data);
  return structuredClone(DEFAULTS);
}

export function persist() {
  try {
    const json = JSON.stringify(save);
    localStorage.setItem(KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  } catch (e) { /* private mode etc. */ }
  for (const fn of persistListeners) { try { fn(); } catch (e) { /* never block a save */ } }
}

const persistListeners = [];
/** Run fn after every save (used to sync a signed-in account). */
export function onPersist(fn) { persistListeners.push(fn); }

/** Replace the whole save with a plain save object (e.g. from an account). */
export function loadSaveData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.owned) || typeof data.coins !== 'number') return false;
  const merged = merge(data);
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, merged);
  persist();
  return true;
}

// Save when the tab is hidden or closed, so a refresh never loses a round.
try {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);
} catch (e) { /* non-browser */ }

/** A copyable save code (base64 JSON) so progress can move to another link or device. */
export function exportSave() {
  const json = JSON.stringify(save);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return 'GG1-' + btoa(bin);
}

/** Load a save code. Returns true on success. */
export function importSave(code) {
  try {
    const clean = String(code || '').trim().replace(/^GG1-/, '');
    const bin = atob(clean);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return loadSaveData(data);
  } catch (e) { return false; }
}

function levelFor(earned) {
  let lv = 1;
  for (let i = 1; i < LEVELS.length; i++) if (earned >= LEVELS[i]) lv = i + 1;
  // Past the table, +3500 coins per extra level.
  if (earned >= LEVELS[LEVELS.length - 1]) {
    lv = LEVELS.length + Math.floor((earned - LEVELS[LEVELS.length - 1]) / 3500);
  }
  return lv;
}

export function level() { return levelFor(save.earned); }

/** Lifetime coins needed to reach a level. */
export function levelThreshold(lv) {
  if (lv <= 1) return 0;
  if (lv - 1 < LEVELS.length) return LEVELS[lv - 1];
  return LEVELS[LEVELS.length - 1] + (lv - LEVELS.length) * 3500;
}

/** Progress 0..1 through the current level. */
export function levelProgress() {
  const lv = level();
  const lo = levelThreshold(lv);
  const hi = levelThreshold(lv + 1);
  return Math.min(1, (save.earned - lo) / (hi - lo));
}

/** Stylist title for a level — what levels mean to the player. */
export const RANKS = [
  { lv: 1, name: 'Style Newbie' },
  { lv: 3, name: 'Trend Spotter' },
  { lv: 5, name: 'Rising Star' },
  { lv: 7, name: 'Runway Regular' },
  { lv: 9, name: 'Fashion Darling' },
  { lv: 11, name: 'Glam Icon' },
  { lv: 14, name: 'Couture Legend' },
  { lv: 18, name: 'Mythic Muse' },
  { lv: 24, name: 'Queen of Glam' },
];

export function rankFor(lv = level()) {
  let r = RANKS[0];
  for (const rk of RANKS) if (lv >= rk.lv) r = rk;
  return r;
}

export function nextRank(lv = level()) {
  return RANKS.find((rk) => rk.lv > lv) || null;
}

/** Coins paid out when reaching a new level. */
export function levelReward(lv) { return 100 + lv * 50; }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today's activity counters, reset at local midnight. */
export function todayStats() {
  const t = todayStr();
  if (save.stats.day !== t) save.stats = { day: t, plays: 0, shows: 0, coins: 0, games: {} };
  return save.stats;
}

/** Add coins from gameplay. Returns { leveledUp, levels: [{lv, reward}] } */
export function earnCoins(n, { countToday = true } = {}) {
  const before = level();
  save.coins += n;
  save.earned += n;
  if (countToday) todayStats().coins += n;
  // level-up rewards: a coin bonus per new level (paid once each)
  const levels = [];
  const now = level();
  for (let lv = Math.max(before, save.levelRewarded) + 1; lv <= now; lv++) {
    const reward = levelReward(lv);
    save.coins += reward;
    levels.push({ lv, reward });
    save.levelRewarded = lv;
  }
  persist();
  return { leveledUp: now > before, levels };
}

export function spendCoins(n) {
  if (save.coins < n) return false;
  save.coins -= n;
  persist();
  return true;
}

export function ownItem(id) {
  if (!save.owned.includes(id)) save.owned.push(id);
  persist();
}

export function isOwned(id) { return save.owned.includes(id); }

export function equip(cat, id) {
  save.eq[cat] = id;
  persist();
}

/** Consume one charge of the welcome boost (first games pay double). */
export function useBoost() {
  if (save.boostLeft <= 0) return false;
  save.boostLeft--;
  persist();
  return true;
}

export function recordScore(gameId, score) {
  const prev = save.best[gameId] || 0;
  save.plays++;
  const st = todayStats();
  st.plays++;
  st.games[gameId] = Math.max(st.games[gameId] || 0, score);
  if (score > prev) save.best[gameId] = score;
  persist();
  return score > prev && prev > 0;
}
