// Daily attendance, streaks and daily challenges — the "come back tomorrow" loop.
// Local calendar days only. Missing one day is forgiven (a 1-day grace), two
// missed days restart the streak. Day 7 of each week adds a surprise outfit piece.

import { G } from './game.js';
import { save, persist, earnCoins, ownItem, isOwned, level, todayStats } from './save.js';
import { ITEMS, byId, DYES, isMythic } from './items.js';
import { GAME_NAMES } from './mythic.js';
import { makePanel, makeButton, makeIcon, iconButton, textStyle, PALETTE } from './ui.js';
import { confetti, coinFly, sparkleBurst, floatText } from './effects.js';
import { tween, Ease } from './tween.js';
import { Sfx } from './sound.js';
import { colorFamily, choice, fmt } from './util.js';

export const REWARDS = [40, 60, 80, 100, 130, 160, 250]; // day 1..7, repeats weekly

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayGap(fromStr, toStr) {
  if (!fromStr) return Infinity;
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

export function dailyState() {
  const today = todayStr();
  const gap = dayGap(save.daily.last, today);
  const alive = gap <= 2; // 1-day grace
  return {
    today,
    claimable: gap !== 0,
    streak: alive ? save.daily.streak || 0 : 0,          // streak as it stands right now
    nextStreak: alive ? (save.daily.streak || 0) + 1 : 1, // streak after claiming today
  };
}

/** Claim today's attendance reward. Returns { day, coins, gift, streak } or null. */
export function claimDaily() {
  const st = dailyState();
  if (!st.claimable) return null;
  save.daily.streak = st.nextStreak;
  save.daily.best = Math.max(save.daily.best || 0, save.daily.streak);
  save.daily.last = st.today;
  const day = ((save.daily.streak - 1) % 7) + 1;
  let coins = REWARDS[day - 1] + Math.min(10, level()) * 5;
  let gift = null;
  if (day === 7) {
    const pool = ITEMS.filter((it) => !isMythic(it) && it.rar <= 3 && it.lvl <= level() + 1 && !isOwned(it.id));
    if (pool.length) { gift = choice(pool); ownItem(gift.id); } else coins += 150;
  }
  earnCoins(coins, { countToday: false });
  persist();
  return { day, coins, gift, streak: save.daily.streak };
}

// ------------------------------ daily challenges ------------------------------

function colourWorn(fam) {
  for (const [cat, id] of Object.entries(save.eq)) {
    const it = id && byId[id];
    if (!it) continue;
    if (cat === 'hair' && save.look.hairDye) {
      const dye = DYES[save.look.hairDye];
      if (dye && dye.hex != null) { if (colorFamily(dye.hex) === fam) return 1; continue; }
    }
    if (colorFamily(it.p.c1) === fam) return 1;
  }
  return 0;
}

const SCORE_GOALS = { starcatch: 350, memory: 250, bubble: 400, rhythm: 500, stylematch: 300, simon: 200 };

// Three pools; one challenge from each per day.
const POOL_PLAY = [
  { id: 'play3', text: 'Play 3 minigames', need: 3, have: () => todayStats().plays, coins: 60 },
  { id: 'play5', text: 'Play 5 minigames', need: 5, have: () => todayStats().plays, coins: 90 },
  { id: 'earn300', text: 'Earn 300 coins today', need: 300, have: () => todayStats().coins, coins: 80 },
  { id: 'earn500', text: 'Earn 500 coins today', need: 500, have: () => todayStats().coins, coins: 110 },
];
const POOL_SCORE = Object.keys(SCORE_GOALS).map((g) => ({
  id: 'score_' + g, text: `Score ${SCORE_GOALS[g]}+ in ${GAME_NAMES[g]}`, need: SCORE_GOALS[g],
  have: () => todayStats().games[g] || 0, coins: 90,
}));
const POOL_STYLE = [
  { id: 'show1', text: 'Walk in a Fashion Show', need: 1, have: () => todayStats().shows, coins: 70 },
  { id: 'show2', text: 'Walk in 2 Fashion Shows', need: 2, have: () => todayStats().shows, coins: 100 },
  ...['pink', 'blue', 'purple', 'yellow', 'green', 'red'].map((fam) => ({
    id: 'wear_' + fam, text: `Wear something ${fam}`, need: 1, have: () => colourWorn(fam), coins: 60, outfit: true,
  })),
  { id: 'wear_hat', text: 'Wear a hair deco', need: 1, have: () => (save.eq.hat ? 1 : 0), coins: 60, outfit: true },
  { id: 'wear_neck', text: 'Wear a necklace', need: 1, have: () => (save.eq.neck ? 1 : 0), coins: 60, outfit: true },
  { id: 'wear_magic', text: 'Wear something magic', need: 1, have: () => (save.eq.special ? 1 : 0), coins: 60, outfit: true },
];
export const ALL_DONE_BONUS = 150;

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Today's three challenges (same all day), each with live { have, need, done, claimed }. */
export function todaysChallenges() {
  const today = todayStr();
  if (save.challenge.day !== today) {
    save.challenge = { day: today, done: [] };
    persist();
  }
  const h = hash(today);
  const picks = [
    POOL_PLAY[h % POOL_PLAY.length],
    POOL_SCORE[(h >>> 5) % POOL_SCORE.length],
    POOL_STYLE[(h >>> 11) % POOL_STYLE.length],
  ];
  return picks.map((c) => {
    const have = Math.min(c.need, c.have());
    return { ...c, have, done: have >= c.need, claimed: save.challenge.done.includes(c.id) };
  });
}

/** Claim a finished challenge. Returns { coins, bonus } or null. */
export function claimChallenge(id) {
  const list = todaysChallenges();
  const c = list.find((x) => x.id === id);
  if (!c || !c.done || c.claimed) return null;
  save.challenge.done.push(id);
  save.challengesDone = (save.challengesDone || 0) + 1;
  const bonus = save.challenge.done.length === list.length ? ALL_DONE_BONUS : 0;
  earnCoins(c.coins + bonus, { countToday: false });
  persist();
  return { coins: c.coins, bonus };
}

/** How many things are waiting to be claimed (drives the badge on the menu button). */
export function dailyPending() {
  let n = dailyState().claimable ? 1 : 0;
  for (const c of todaysChallenges()) if (c.done && !c.claimed) n++;
  return n;
}

// ------------------------------ the Daily panel ------------------------------

/** Open the Daily panel over a scene. onClose fires when it is dismissed. */
export function openDailyPanel(scene, onClose) {
  const W = G.W, H = G.H;
  const ov = new PIXI.Container();
  const dim = new PIXI.Graphics();
  dim.beginFill(0x50104a, 0.6);
  dim.drawRect(0, 0, W, H);
  dim.endFill();
  dim.eventMode = 'static';
  ov.addChild(dim);

  const pw = Math.min(430, W - 20);
  const ph = 520;
  const box = new PIXI.Container();
  box.position.set(W / 2, H / 2);
  ov.addChild(box);
  const fit = Math.min(1, (H - 16) / ph);

  const close = () => {
    if (ov.destroyed) return;
    tween(ov, { alpha: 0 }, 180, { onDone: () => { if (!ov.destroyed) ov.destroy({ children: true }); if (onClose) onClose(); } });
  };

  const render = () => {
    box.removeChildren().forEach((c) => c.destroy({ children: true }));
    box.addChild(makePanel(pw, ph, { border: PALETTE.gold }));
    const st = dailyState();
    const top = -ph / 2;

    // ---- streak header ----
    const flame = makeIcon('flame', 44);
    flame.position.set(-pw / 2 + 42, top + 44);
    box.addChild(flame);
    const shown = st.claimable ? st.nextStreak : st.streak;
    const t = new PIXI.Text(`Day ${shown} streak`, textStyle(26, PALETTE.pink, 0xffffff, 0));
    t.anchor.set(0, 0.5);
    t.position.set(-pw / 2 + 72, top + 36);
    box.addChild(t);
    const sub = new PIXI.Text(`Best: ${save.daily.best || 0} days  •  miss one day and it survives`, { ...textStyle(12, PALETTE.purple, 0xffffff, 0), fontWeight: '700' });
    sub.anchor.set(0, 0.5);
    sub.position.set(-pw / 2 + 72, top + 60);
    if (sub.width > pw - 130) sub.scale.set((pw - 130) / sub.width);
    box.addChild(sub);
    const x = iconButton('close', 40, 0xb9a8b8, close);
    x.position.set(pw / 2 - 30, top + 30);
    box.addChild(x);

    // ---- 7-day strip ----
    const today = ((shown - 1) % 7 + 7) % 7; // index of today's cell
    const cellW = (pw - 36) / 7;
    for (let i = 0; i < 7; i++) {
      const cx = -pw / 2 + 18 + cellW * i + cellW / 2;
      const cy = top + 122;
      const past = i < today || (i === today && !st.claimable);
      const isToday = i === today;
      const g = new PIXI.Graphics();
      g.beginFill(past ? 0xd9f5e6 : isToday ? 0xfff0b8 : 0xf7ecf5);
      g.drawRoundedRect(cx - cellW / 2 + 3, cy - 38, cellW - 6, 76, 12);
      g.endFill();
      g.lineStyle({ width: isToday ? 3 : 2, color: past ? 0x46c791 : isToday ? PALETTE.gold : 0xe3c8dc });
      g.drawRoundedRect(cx - cellW / 2 + 3, cy - 38, cellW - 6, 76, 12);
      g.lineStyle(0);
      box.addChild(g);
      const dl = new PIXI.Text('Day ' + (i + 1), { ...textStyle(11, PALETTE.text, 0xffffff, 0), fontWeight: '800' });
      dl.anchor.set(0.5);
      dl.position.set(cx, cy - 26);
      box.addChild(dl);
      const ic = makeIcon(past ? 'check' : i === 6 ? 'gift' : 'coin', 24);
      ic.position.set(cx, cy);
      box.addChild(ic);
      const rl = new PIXI.Text(i === 6 ? 'Gift!' : '+' + REWARDS[i], { ...textStyle(12, past ? 0x2f9e57 : 0xc78a00, 0xffffff, 0), fontWeight: '800' });
      rl.anchor.set(0.5);
      rl.position.set(cx, cy + 25);
      box.addChild(rl);
    }

    // ---- claim button ----
    if (st.claimable) {
      const btn = makeButton("Claim today's reward", {
        w: Math.min(300, pw - 60), h: 52, color: PALETTE.gold, fontSize: 19,
        onTap: () => {
          const res = claimDaily();
          if (!res) return;
          Sfx.fanfare();
          confetti(W, res.gift ? 110 : 60);
          const spot = scene.hud ? scene.hud.coinTarget() : { x: W - 100, y: 30 };
          coinFly(W / 2, H / 2, spot.x, spot.y, 10, () => scene.hud && !scene.hud.destroyed && scene.hud.bumpCoin());
          floatText(W / 2, H / 2 - 60, `+${fmt(res.coins)} coins`, { size: 30, fill: 0xffe08a });
          if (res.gift) floatText(W / 2, H / 2 - 100, `Gift: ${res.gift.name}!`, { size: 24, fill: 0xffffff, dur: 2200 });
          render();
        },
      });
      btn.position.set(0, top + 198);
      box.addChild(btn);
      tween(btn.scale, { x: 1.05, y: 1.05 }, 600, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });
    } else {
      const done = new PIXI.Text('Claimed today — come back tomorrow!', textStyle(16, 0x2f9e57, 0xffffff, 0));
      done.anchor.set(0.5);
      done.position.set(0, top + 198);
      if (done.width > pw - 30) done.scale.set((pw - 30) / done.width);
      box.addChild(done);
    }

    // ---- challenges ----
    const ch = new PIXI.Text('DAILY CHALLENGES', { ...textStyle(15, PALETTE.purple, 0xffffff, 0), letterSpacing: 2 });
    ch.anchor.set(0.5);
    ch.position.set(0, top + 250);
    box.addChild(ch);
    const list = todaysChallenges();
    list.forEach((c, i) => {
      const y = top + 300 + i * 66;
      const rw = pw - 36;
      const g = new PIXI.Graphics();
      g.beginFill(c.claimed ? 0xe9f8ef : 0xfdf3f9);
      g.drawRoundedRect(-rw / 2, y - 28, rw, 56, 16);
      g.endFill();
      g.lineStyle({ width: 2, color: c.claimed ? 0x46c791 : 0xf0c4de });
      g.drawRoundedRect(-rw / 2, y - 28, rw, 56, 16);
      g.lineStyle(0);
      box.addChild(g);
      const name = new PIXI.Text(c.text, { ...textStyle(15, PALETTE.text, 0xffffff, 0), fontWeight: '800' });
      name.anchor.set(0, 0.5);
      name.position.set(-rw / 2 + 14, y - 10);
      const room = rw - 150;
      if (name.width > room) name.scale.set(room / name.width);
      box.addChild(name);
      // progress bar
      const bw = room;
      const bg = new PIXI.Graphics();
      bg.beginFill(0xe8d3e2);
      bg.drawRoundedRect(-rw / 2 + 14, y + 6, bw, 10, 5);
      bg.endFill();
      bg.beginFill(c.done ? 0x46c791 : PALETTE.pink);
      bg.drawRoundedRect(-rw / 2 + 14, y + 6, Math.max(10, bw * (c.have / c.need)), 10, 5);
      bg.endFill();
      box.addChild(bg);
      const pt = new PIXI.Text(c.outfit ? (c.done ? 'wearing it!' : 'change in Wardrobe') : `${fmt(c.have)} / ${fmt(c.need)}`, { ...textStyle(10, 0xa08aa8, 0xffffff, 0), fontWeight: '800' });
      pt.anchor.set(1, 0.5);
      pt.position.set(-rw / 2 + 14 + bw, y - 22 + 44);
      pt.y = y + 23;
      box.addChild(pt);
      if (c.claimed) {
        const ok = makeIcon('check', 30);
        ok.position.set(rw / 2 - 60, y);
        box.addChild(ok);
      } else if (c.done) {
        const b = makeButton(`+${c.coins}`, {
          w: 104, h: 42, color: PALETTE.mint, fontSize: 18, icon: 'coin',
          onTap: () => {
            const res = claimChallenge(c.id);
            if (!res) return;
            Sfx.buy();
            const gp = G.pt(b.getGlobalPosition());
            sparkleBurst(gp.x, gp.y, { n: 16 });
            const spot = scene.hud ? scene.hud.coinTarget() : { x: W - 100, y: 30 };
            coinFly(gp.x, gp.y, spot.x, spot.y, 8, () => scene.hud && !scene.hud.destroyed && scene.hud.bumpCoin());
            if (res.bonus) { confetti(W, 80); Sfx.fanfare(); floatText(W / 2, H / 2 - 40, `All three done! +${res.bonus} bonus`, { size: 24, fill: 0xffe08a, dur: 2000 }); }
            render();
          },
        });
        b.position.set(rw / 2 - 64, y);
        box.addChild(b);
      } else {
        const rc = new PIXI.Container();
        const ci = makeIcon('coin', 22);
        rc.addChild(ci);
        const rt = new PIXI.Text('+' + c.coins, textStyle(17, 0xc78a00, 0xffffff, 0));
        rt.anchor.set(0, 0.5);
        rt.x = 16;
        rc.addChild(rt);
        rc.position.set(rw / 2 - 96, y);
        box.addChild(rc);
      }
    });
    const allDone = list.every((c) => c.claimed);
    const foot = new PIXI.Text(allDone ? 'All done today! New challenges tomorrow.' : `Finish all three for a +${ALL_DONE_BONUS} bonus`, { ...textStyle(13, PALETTE.purple, 0xffffff, 0), fontWeight: '700' });
    foot.anchor.set(0.5);
    foot.position.set(0, top + ph - 22);
    box.addChild(foot);
  };

  render();
  box.scale.set(fit * 0.75);
  tween(box.scale, { x: fit, y: fit }, 360, { ease: Ease.backOut });
  ov.alpha = 0;
  tween(ov, { alpha: 1 }, 220);
  scene.root.addChild(ov);
  return ov;
}
