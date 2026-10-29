// Persistent progress in localStorage: coins, owned outfits, equipped looks, bests.

const KEY = 'glitterglam_save_v1';

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
  best: {},            // gameId -> best score
  plays: 0,
  shows: 0,
  wins: 0,
  sound: true,
  seenIntro: {},       // gameId -> true once instructions have been read
  lastGift: '',        // YYYY-MM-DD of last claimed daily gift
  theme: 'day',        // 'day' | 'night'
};

// Lifetime-coins thresholds for each level (level 1 starts at 0).
export const LEVELS = [0, 300, 700, 1300, 2100, 3200, 4600, 6400, 8600, 11500, 15000];

export const save = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...structuredClone(DEFAULTS), ...data, eq: { ...DEFAULTS.eq, ...(data.eq || {}) } };
    }
  } catch (e) { /* corrupted or unavailable storage — start fresh */ }
  return structuredClone(DEFAULTS);
}

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode etc. */ }
}

export function level() {
  let lv = 1;
  for (let i = 1; i < LEVELS.length; i++) if (save.earned >= LEVELS[i]) lv = i + 1;
  // Past the table, +3500 coins per extra level.
  if (save.earned >= LEVELS[LEVELS.length - 1]) {
    lv = LEVELS.length + Math.floor((save.earned - LEVELS[LEVELS.length - 1]) / 3500);
  }
  return lv;
}

/** Progress 0..1 through the current level. */
export function levelProgress() {
  const lv = level();
  const lo = lv - 1 < LEVELS.length ? LEVELS[lv - 1] : LEVELS[LEVELS.length - 1] + (lv - LEVELS.length) * 3500;
  const hi = lv < LEVELS.length ? LEVELS[lv] : lo + 3500;
  return Math.min(1, (save.earned - lo) / (hi - lo));
}

/** Add coins from gameplay. Returns { leveledUp } */
export function earnCoins(n) {
  const before = level();
  save.coins += n;
  save.earned += n;
  persist();
  return { leveledUp: level() > before };
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

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function giftAvailable() { return save.lastGift !== today(); }

/** Claim the daily gift. Returns coins granted (0 if already claimed). */
export function claimGift() {
  if (!giftAvailable()) return 0;
  const amount = 60 + level() * 15;
  save.lastGift = today();
  earnCoins(amount);
  return amount;
}

export function recordScore(gameId, score) {
  const prev = save.best[gameId] || 0;
  save.plays++;
  if (score > prev) save.best[gameId] = score;
  persist();
  return score > prev && prev > 0;
}
