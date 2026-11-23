// Rankings: what levels and high scores are FOR.
// - Your stylist rank (a title earned by levelling up, plus what comes next)
// - A medal and a league place for every minigame, measured against the
//   boutique's nine rival stylists (in-game characters, not other players)
// - Your runway record

import { G } from './game.js';
import { save, level, levelProgress, levelThreshold, rankFor, nextRank, levelReward } from './save.js';
import { GAME_NAMES, GAME_IDS, mythicTally } from './mythic.js';
import { makePanel, makeIcon, iconButton, textStyle, PALETTE } from './ui.js';
import { tween, Ease } from './tween.js';
import { fmt } from './util.js';
import { onlineEnabled, account, fetchBoard } from './online.js';

// Score that earns the top (Diamond) medal in each game.
export const DIAMOND = { starcatch: 1200, memory: 800, bubble: 1000, rhythm: 1500, stylematch: 700, simon: 900 };
const TIERS = [
  { name: 'Diamond', frac: 1, color: 0x6fd6f5 },
  { name: 'Gold', frac: 0.7, color: 0xf5a91a },
  { name: 'Silver', frac: 0.45, color: 0xaab4c4 },
  { name: 'Bronze', frac: 0.2, color: 0xc9834e },
];
const RIVALS = [
  ['Bella', 1.22], ['Coco', 1.04], ['Ruby', 0.9], ['Luna', 0.76], ['Mimi', 0.62],
  ['Star', 0.5], ['Posie', 0.38], ['Violet', 0.26], ['Dot', 0.14],
];

export function medalFor(gameId, score) {
  for (const t of TIERS) if (score >= DIAMOND[gameId] * t.frac) return t;
  return null;
}

/** League table for one game: [{ name, score, you }] sorted best first. */
export function leagueFor(gameId) {
  const rows = RIVALS.map(([name, f], i) => ({ name, score: Math.round((DIAMOND[gameId] * f + i * 3) / 5) * 5, you: false }));
  rows.push({ name: 'You', score: save.best[gameId] || 0, you: true });
  rows.sort((a, b) => b.score - a.score || (a.you ? -1 : 1));
  return rows;
}

export function openRankings(scene) {
  const W = G.W, H = G.H;
  const ov = new PIXI.Container();
  const dim = new PIXI.Graphics();
  dim.beginFill(0x50104a, 0.6);
  dim.drawRect(0, 0, W, H);
  dim.endFill();
  dim.eventMode = 'static';
  ov.addChild(dim);
  const pw = Math.min(440, W - 16);
  const ph = 590;
  const box = new PIXI.Container();
  box.position.set(W / 2, H / 2);
  ov.addChild(box);
  const fit = Math.min(1, (H - 12) / ph);
  const close = () => { if (!ov.destroyed) tween(ov, { alpha: 0 }, 180, { onDone: () => !ov.destroyed && ov.destroy({ children: true }) }); };

  let view = 0; // bumps on every render so late network answers are ignored
  const render = (detail, world = false) => {
    const myView = ++view;
    if (detail === 'runway') world = true;
    box.removeChildren().forEach((c) => c.destroy({ children: true }));
    box.addChild(makePanel(pw, ph, { border: PALETTE.purple }));
    const top = -ph / 2;
    const x = iconButton('close', 40, 0xb9a8b8, close);
    x.position.set(pw / 2 - 30, top + 30);
    box.addChild(x);

    if (detail) {
      // ---------- one game's league table ----------
      const back = iconButton('back', 40, PALETTE.purple, () => render(null));
      back.position.set(-pw / 2 + 30, top + 30);
      box.addChild(back);
      const online = onlineEnabled();
      const gameName = detail === 'runway' ? 'Runway' : GAME_NAMES[detail];
      const t = new PIXI.Text(gameName + (world ? ' World' : ' League'), textStyle(22, PALETTE.pink, 0xffffff, 0));
      t.anchor.set(0.5);
      t.position.set(0, top + 32);
      box.addChild(t);
      const sub = new PIXI.Text(
        world ? (detail === 'runway' ? 'Best runway rating of real players' : 'Best scores of real players')
          : 'You against the boutique\'s rival stylists',
        { ...textStyle(12, PALETTE.purple, 0xffffff, 0), fontWeight: '700' });
      sub.anchor.set(0.5);
      sub.position.set(0, top + 58);
      box.addChild(sub);
      // Boutique / World switch (only when online play is set up)
      if (online && detail !== 'runway') {
        [['Boutique', false], ['World', true]].forEach(([label, w], i) => {
          const on = w === world;
          const tab = new PIXI.Container();
          const tg = new PIXI.Graphics();
          tg.beginFill(on ? PALETTE.pink : 0xf3e3ef);
          tg.drawRoundedRect(-58, -15, 116, 30, 15);
          tg.endFill();
          tab.addChild(tg);
          const tt = new PIXI.Text(label, { ...textStyle(14, on ? 0xffffff : PALETTE.purple, 0xffffff, 0), fontWeight: '900' });
          tt.anchor.set(0.5);
          tab.addChild(tt);
          tab.position.set(i ? 62 : -62, top + 88);
          tab.eventMode = 'static';
          tab.cursor = 'pointer';
          tab.on('pointertap', () => render(detail, w));
          box.addChild(tab);
        });
      }
      const listTop = top + (online ? 130 : 98);
      const step = online ? 44 : 47;
      const drawRow = (i, place, name, scoreText, you, medal) => {
        const y = listTop + i * step;
        const rw = pw - 40;
        const g = new PIXI.Graphics();
        g.beginFill(you ? 0xffe9b0 : 0xfaf1f8);
        g.drawRoundedRect(-rw / 2, y - 19, rw, 38, 12);
        g.endFill();
        if (you) { g.lineStyle({ width: 2.5, color: PALETTE.gold }); g.drawRoundedRect(-rw / 2, y - 19, rw, 38, 12); g.lineStyle(0); }
        box.addChild(g);
        const pl = new PIXI.Text('#' + place, textStyle(16, place <= 3 ? 0xc78a00 : 0x9a8aa8, 0xffffff, 0));
        pl.anchor.set(0, 0.5);
        pl.position.set(-rw / 2 + 12, y);
        box.addChild(pl);
        const nm = new PIXI.Text(name, { ...textStyle(16, PALETTE.text, 0xffffff, 0), fontWeight: you ? '900' : '700' });
        nm.anchor.set(0, 0.5);
        nm.position.set(-rw / 2 + 62, y);
        box.addChild(nm);
        if (medal) { const mi = makeIcon('medal', 22, medal.color); mi.position.set(rw / 2 - 96, y); box.addChild(mi); }
        const sc = new PIXI.Text(scoreText, textStyle(17, PALETTE.purple, 0xffffff, 0));
        sc.anchor.set(1, 0.5);
        sc.position.set(rw / 2 - 12, y);
        box.addChild(sc);
      };
      const note = (text, y) => {
        const n = new PIXI.Text(text, { ...textStyle(14, 0x9a6ab0, 0xffffff, 0), fontWeight: '700', align: 'center', wordWrap: true, wordWrapWidth: pw - 60 });
        n.anchor.set(0.5);
        n.position.set(0, y);
        box.addChild(n);
        return n;
      };
      if (world) {
        const show = (v) => (detail === 'runway' ? (v / 10).toFixed(1) + ' / 10' : fmt(v));
        const wait = note('Loading the world ranking…', top + ph / 2);
        fetchBoard(detail).then((b) => {
          if (ov.destroyed || myView !== view) return;
          wait.destroy();
          const me = account();
          const rows = b.top.slice(0, 9);
          rows.forEach((r, i) => drawRow(i, r.rank, r.name, show(r.score), !!me && r.name === me.name, detail === 'runway' ? null : medalFor(detail, r.score)));
          let n = rows.length;
          if (b.you && b.you.rank > rows.length) { drawRow(n, b.you.rank, b.you.name, show(b.you.score), true, null); n++; }
          const foot = !rows.length ? 'No scores yet. Be the first!'
            : !me ? 'Log in from the home screen to join the world ranking.'
              : !b.you ? 'Play a round to get on the board!'
                : `You are #${b.you.rank} of ${fmt(b.total)} players`;
          note(foot, Math.min(top + ph - 30, listTop + n * step + 8));
        }).catch((e) => {
          if (ov.destroyed || myView !== view) return;
          wait.text = e.message || 'The world ranking is not available right now.';
        });
        return;
      }
      leagueFor(detail).forEach((row, i) => drawRow(i, i + 1, row.name, fmt(row.score), row.you, medalFor(detail, row.score)));
      return;
    }

    // ---------- overview ----------
    const lv = level();
    const rk = rankFor(lv), nx = nextRank(lv);
    const crown = makeIcon('crown', 40);
    crown.position.set(-pw / 2 + 42, top + 42);
    box.addChild(crown);
    const title = new PIXI.Text(rk.name, textStyle(24, PALETTE.pink, 0xffffff, 0));
    title.anchor.set(0, 0.5);
    title.position.set(-pw / 2 + 72, top + 32);
    box.addChild(title);
    const sub = new PIXI.Text(
      `Level ${lv}  •  ${nx ? `next title "${nx.name}" at Lv ${nx.lv}` : 'top title reached!'}`,
      { ...textStyle(12, PALETTE.purple, 0xffffff, 0), fontWeight: '700' },
    );
    sub.anchor.set(0, 0.5);
    sub.position.set(-pw / 2 + 72, top + 56);
    if (sub.width > pw - 130) sub.scale.set((pw - 130) / sub.width);
    box.addChild(sub);
    // level bar + what the next level gives
    const bw = pw - 40;
    const bar = new PIXI.Graphics();
    bar.beginFill(0xe8d3e2);
    bar.drawRoundedRect(-bw / 2, top + 78, bw, 12, 6);
    bar.endFill();
    bar.beginFill(PALETTE.gold);
    bar.drawRoundedRect(-bw / 2, top + 78, Math.max(12, bw * levelProgress()), 12, 6);
    bar.endFill();
    box.addChild(bar);
    const need = levelThreshold(lv + 1) - save.earned;
    const nxt = new PIXI.Text(
      `${fmt(Math.max(0, need))} more coins to Lv ${lv + 1}: +${levelReward(lv + 1)} bonus coins and new outfits unlock`,
      { ...textStyle(11, 0x9a6ab0, 0xffffff, 0), fontWeight: '700' },
    );
    nxt.anchor.set(0.5);
    nxt.position.set(0, top + 104);
    if (nxt.width > bw) nxt.scale.set(bw / nxt.width);
    box.addChild(nxt);

    const head = new PIXI.Text('MINIGAME RANKINGS', { ...textStyle(14, PALETTE.purple, 0xffffff, 0), letterSpacing: 2 });
    head.anchor.set(0.5);
    head.position.set(0, top + 134);
    box.addChild(head);

    GAME_IDS.forEach((id, i) => {
      const y = top + 176 + i * 54;
      const rw = pw - 36;
      const best = save.best[id] || 0;
      const league = leagueFor(id);
      const place = league.findIndex((r2) => r2.you) + 1;
      const above = place > 1 ? league[place - 2] : null;
      const m = medalFor(id, best);
      const row = new PIXI.Container();
      const g = new PIXI.Graphics();
      g.beginFill(0xfaf1f8);
      g.drawRoundedRect(-rw / 2, y - 23, rw, 46, 14);
      g.endFill();
      g.lineStyle({ width: 2, color: 0xf0c4de });
      g.drawRoundedRect(-rw / 2, y - 23, rw, 46, 14);
      g.lineStyle(0);
      row.addChild(g);
      const mi = makeIcon('medal', 28, m ? m.color : 0xd8cbd8);
      mi.position.set(-rw / 2 + 24, y);
      if (!m) mi.alpha = 0.6;
      row.addChild(mi);
      const nm = new PIXI.Text(GAME_NAMES[id], { ...textStyle(15, PALETTE.text, 0xffffff, 0), fontWeight: '900' });
      nm.anchor.set(0, 0.5);
      nm.position.set(-rw / 2 + 46, y - 9);
      row.addChild(nm);
      const hint = new PIXI.Text(
        !best ? 'Not played yet' : above ? `${m ? m.name + ' • ' : ''}beat ${above.name}: ${fmt(above.score)}` : 'Diamond • top of the league!',
        { ...textStyle(11, 0x9a6ab0, 0xffffff, 0), fontWeight: '700' },
      );
      hint.anchor.set(0, 0.5);
      hint.position.set(-rw / 2 + 46, y + 10);
      row.addChild(hint);
      const pl = new PIXI.Text(best ? `#${place}` : '—', textStyle(20, place <= 3 && best ? 0xc78a00 : PALETTE.purple, 0xffffff, 0));
      pl.anchor.set(1, 0.5);
      pl.position.set(rw / 2 - 86, y);
      row.addChild(pl);
      const sc = new PIXI.Text(fmt(best), textStyle(16, PALETTE.pink, 0xffffff, 0));
      sc.anchor.set(1, 0.5);
      sc.position.set(rw / 2 - 30, y);
      row.addChild(sc);
      const chev = new PIXI.Graphics();
      chev.lineStyle({ width: 3, color: PALETTE.purple, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND });
      chev.moveTo(-4, -7); chev.lineTo(3, 0); chev.lineTo(-4, 7);
      chev.position.set(rw / 2 - 14, y);
      row.addChild(chev);
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.on('pointertap', () => render(id));
      box.addChild(row);
    });

    // runway record
    const ry = top + 176 + GAME_IDS.length * 54 + 14;
    const mt = mythicTally();
    const stats = [
      ['trophy', `${fmt(save.wins || 0)} wins`],
      ['star', `best ${(save.bestShow || 0).toFixed(1)} / 10`],
      ['flame', `${save.bestWinStreak || 0} win streak`],
      ['mythic', `${mt.owned}/${mt.total} Mythics`],
    ];
    const cellW = (pw - 30) / stats.length;
    const rh = new PIXI.Text('RUNWAY RECORD', { ...textStyle(12, PALETTE.purple, 0xffffff, 0), letterSpacing: 2 });
    rh.anchor.set(0.5);
    rh.position.set(0, ry - 6);
    box.addChild(rh);
    if (onlineEnabled()) {
      // tap through to the world runway ranking
      rh.text = 'RUNWAY RECORD  •  WORLD RANKING ›';
      rh.style.fill = PALETTE.pink;
      rh.eventMode = 'static';
      rh.cursor = 'pointer';
      rh.hitArea = new PIXI.Rectangle(-pw / 2 + 10, -16, pw - 20, 32);
      rh.on('pointertap', () => render('runway', true));
    }
    stats.forEach(([icon, label], i) => {
      const cx = -pw / 2 + 15 + cellW * i + cellW / 2;
      const ic = makeIcon(icon, 22);
      ic.position.set(cx, ry + 22);
      box.addChild(ic);
      const t = new PIXI.Text(label, { ...textStyle(12, PALETTE.text, 0xffffff, 0), fontWeight: '800' });
      t.anchor.set(0.5);
      t.position.set(cx, ry + 44);
      if (t.width > cellW - 4) t.scale.set((cellW - 4) / t.width);
      box.addChild(t);
    });
  };

  render(null);
  box.scale.set(fit * 0.75);
  tween(box.scale, { x: fit, y: fit }, 360, { ease: Ease.backOut });
  ov.alpha = 0;
  tween(ov, { alpha: 1 }, 220);
  scene.root.addChild(ov);
  return ov;
}
