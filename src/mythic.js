// Mythic trials — the long game.
//
// Mythic items (rar 6, `req: [...]` in the catalog) can't be bought the moment
// you can afford them: every one asks for proof of a different kind of play —
// runway wins, minigame mastery, daily streaks, collection depth.
//
// A trial is `{ k, ...args }`. Everything reads from `save`, so trials are
// retroactive. Nothing here writes state.

import { save, level } from './save.js';
import { ITEMS, byId, byCat, isMythic } from './items.js';

export const GAME_NAMES = {
  starcatch: 'Star Catch',
  memory: 'Memory Match',
  bubble: 'Bubble Pop',
  rhythm: 'Runway Rhythm',
  stylematch: 'Style Rush',
  simon: 'Encore',
};
export const GAME_IDS = Object.keys(GAME_NAMES);

export function mythicsOwned() {
  return ITEMS.filter((it) => isMythic(it) && save.owned.includes(it.id)).length;
}

/** Non-mythic items owned in a category — collection trials shouldn't be circular. */
function catOwned(cat) {
  return byCat(cat).filter((it) => !isMythic(it) && save.owned.includes(it.id)).length;
}

const CAT_WORDS = { hair: 'hairstyles', dress: 'dresses', shoes: 'shoes', hat: 'hair decos', neck: 'necklaces', bag: 'bags', special: 'magic items' };
const fmtNum = (v) => Math.round(v).toLocaleString('en-US');

function bar(label, have, need, opts = {}) {
  const done = have >= need;
  return {
    label, have, need, done,
    text: opts.boolean
      ? (done ? 'Done!' : 'Not yet')
      : `${(opts.fmt || fmtNum)(Math.min(have, need))} / ${(opts.fmt || fmtNum)(need)}`,
  };
}

/** One trial -> { label, have, need, done, text }. */
export function trialStatus(t) {
  switch (t.k) {
    case 'plays': return bar('Play minigames', save.plays || 0, t.n);
    case 'shows': return bar('Walk the runway', save.shows || 0, t.n);
    case 'wins': return bar('Win Fashion Shows', save.wins || 0, t.n);
    case 'winStreak': return bar('Win shows in a row', save.bestWinStreak || 0, t.n);
    case 'bestShow': return bar('Get a runway rating of', save.bestShow || 0, t.n, { fmt: (v) => v.toFixed(1) });
    case 'streak': return bar('Daily streak (days)', (save.daily && save.daily.best) || 0, t.n);
    case 'challenges': return bar('Finish daily challenges', save.challengesDone || 0, t.n);
    case 'earned': return bar('Earn coins (lifetime)', save.earned || 0, t.n);
    case 'best': return bar(`High score in ${GAME_NAMES[t.game] || t.game}`, (save.best && save.best[t.game]) || 0, t.n);
    case 'allBest': {
      const done = GAME_IDS.filter((g) => ((save.best && save.best[g]) || 0) >= t.n).length;
      return bar(`Score ${t.n}+ in every minigame`, done, GAME_IDS.length);
    }
    case 'ownCat': return bar(`Collect ${CAT_WORDS[t.cat] || t.cat}`, catOwned(t.cat), t.n);
    case 'own': {
      const it = byId[t.id];
      return bar(`Own the ${it ? it.name : t.id}`, save.owned.includes(t.id) ? 1 : 0, 1, { boolean: true });
    }
    case 'mythics': return bar('Own Mythic pieces', mythicsOwned(), t.n);
    default: return bar('Unknown trial', 1, 1);
  }
}

/** Full trial report for an item: { trials, done, total, met }. */
export function trialReport(item) {
  const trials = (item.req || []).map(trialStatus);
  const done = trials.filter((t) => t.done).length;
  return { trials, done, total: trials.length, met: done === trials.length };
}

export function trialsMet(item) {
  if (!isMythic(item)) return true;
  return item.req.every((t) => trialStatus(t).done);
}

/** The Mythic the player is closest to landing — teased on the home screen. */
export function nextMythicGoal() {
  const lv = level();
  let best = null;
  for (const it of ITEMS) {
    if (!isMythic(it) || save.owned.includes(it.id)) continue;
    const rep = trialReport(it);
    const trialFrac = rep.total
      ? rep.trials.reduce((a, t) => a + Math.min(1, t.need ? t.have / t.need : 1), 0) / rep.total
      : 1;
    const frac = Math.min(1, lv / it.lvl) * 0.3 + trialFrac * 0.7;
    if (!best || frac > best.frac) best = { item: it, rep, frac };
  }
  return best;
}

export function mythicTally() {
  const all = ITEMS.filter(isMythic);
  return { owned: all.filter((it) => save.owned.includes(it.id)).length, total: all.length };
}
