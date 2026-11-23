// Fashion Show: you and three rivals strut the red carpet, the crowd goes
// wild, judges hold up score cards, and the best outfit takes the crown.

import { submitScore } from '../online.js';
import { G } from '../game.js';
import { save, earnCoins, persist, level, todayStats } from '../save.js';
import { styleScore, randomOutfit, randomLook, SKINS } from '../items.js';
import { makeButton, makeHUD, makePanel, makeIcon, iconButton, textStyle, PALETTE } from '../ui.js';
import { createCharacter } from '../character.js';
import { sparkleBurst, confetti, floatHearts, floatText, coinFly } from '../effects.js';
import { tween, Ease, delay, killTweensOf } from '../tween.js';
import { Sfx } from '../sound.js';
import { gameplayStart, gameplayStop, happytime } from '../portal.js';
import { rand, randi, choice, shuffle, fmt, darken, lighten, mixColor } from '../util.js';

const NPC_NAMES = ['Bella', 'Coco', 'Ruby', 'Luna', 'Mimi', 'Star', 'Posie', 'Violet'];
const JUDGES = [
  { name: 'Miss Prim', color: 0xff5f9e },
  { name: 'Coco L.', color: 0xa66ae0 },
  { name: 'Mr. Chic', color: 0x5ba8ec },
];

export class FashionShowScene {
  constructor(params) {
    this.params = params;
    this.resizeMode = 'scale';
    this.alive = true;
    this.t = 0;
    this.flashes = [];
    this.clapT = 0;
    this.clapping = false;
  }

  dispose() { this.alive = false; }

  build(W, H) {
    this.W = W; this.H = H;
    const r = this.root;

    // ---------- stage backdrop ----------
    const bg = new PIXI.Graphics();
    for (let i = 0; i < 20; i++) {
      bg.beginFill(mixColor(0x3a1a4e, 0x8a2a6e, i / 19));
      bg.drawRect(0, (H / 20) * i - 1, W, H / 20 + 2);
      bg.endFill();
    }
    r.addChild(bg);

    // spotlight cones
    const cones = new PIXI.Graphics();
    for (const x of [W * 0.25, W * 0.5, W * 0.75]) {
      cones.beginFill(0xfff3c0, 0.1);
      cones.drawPolygon([x - 26, 0, x + 26, 0, x + 150, H * 0.75, x - 150, H * 0.75]);
      cones.endFill();
    }
    r.addChild(cones);

    // glitter wall dots
    const wall = new PIXI.Graphics();
    for (let i = 0; i < 60; i++) {
      wall.beginFill(0xffffff, rand(0.1, 0.5));
      wall.drawCircle(rand(0, W), rand(0, H * 0.5), rand(1, 3));
      wall.endFill();
    }
    r.addChild(wall);

    // banner
    const banner = new PIXI.Container();
    const bg2 = new PIXI.Graphics();
    const bw = Math.min(W * 0.8, 460);
    bg2.beginFill(0xd1274b);
    bg2.drawRoundedRect(-bw / 2, -30, bw, 60, 30);
    bg2.endFill();
    bg2.lineStyle({ width: 3, color: 0xffd35c });
    bg2.drawRoundedRect(-bw / 2, -30, bw, 60, 30);
    bg2.lineStyle(0);
    banner.addChild(bg2);
    const bt = new PIXI.Text('★ FASHION NIGHT ★', textStyle(Math.min(28, bw * 0.055), 0xffe08a, 0x8a1a30, 5));
    bt.anchor.set(0.5);
    banner.addChild(bt);
    const short = H < 520; // sideways phones
    banner.position.set(W / 2, short ? 30 : (W < 560 ? 100 : 64));
    if (short) banner.scale.set(0.7);
    r.addChild(banner);
    this.banner = banner;
    tween(banner.scale, { x: banner.scale.x * 1.03, y: banner.scale.y * 1.03 }, 900, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });

    // ---------- red carpet ----------
    this.carpetY = H * 0.66;
    const carpet = new PIXI.Graphics();
    carpet.beginFill(0xb01e3e);
    carpet.drawPolygon([0, this.carpetY - 40, W, this.carpetY - 40, W, this.carpetY + 90, 0, this.carpetY + 90]);
    carpet.endFill();
    carpet.beginFill(0xd12b50);
    carpet.drawRect(0, this.carpetY - 40, W, 14);
    carpet.endFill();
    carpet.beginFill(0x8a1630);
    carpet.drawRect(0, this.carpetY + 76, W, 14);
    carpet.endFill();
    // gold rope posts
    for (const x of [W * 0.12, W * 0.38, W * 0.62, W * 0.88]) {
      carpet.beginFill(0xf5b21a);
      carpet.drawRect(x - 4, this.carpetY - 92, 8, 52);
      carpet.drawCircle(x, this.carpetY - 96, 8);
      carpet.endFill();
    }
    carpet.lineStyle({ width: 6, color: 0xf5b21a, alpha: 0.9 });
    carpet.moveTo(W * 0.12, this.carpetY - 84);
    carpet.quadraticCurveTo(W * 0.25, this.carpetY - 62, W * 0.38, this.carpetY - 84);
    carpet.quadraticCurveTo(W * 0.5, this.carpetY - 62, W * 0.62, this.carpetY - 84);
    carpet.quadraticCurveTo(W * 0.75, this.carpetY - 62, W * 0.88, this.carpetY - 84);
    carpet.lineStyle(0);
    r.addChild(carpet);

    // curtains
    const curt = new PIXI.Graphics();
    for (const side of [0, 1]) {
      const cx = side === 0 ? 0 : W;
      const dir = side === 0 ? 1 : -1;
      curt.beginFill(0x8a1a5e);
      curt.moveTo(cx, 0);
      curt.lineTo(cx + dir * W * 0.13, 0);
      curt.quadraticCurveTo(cx + dir * W * 0.16, H * 0.3, cx + dir * W * 0.05, H * 0.62);
      curt.lineTo(cx, H * 0.62);
      curt.closePath();
      curt.endFill();
      curt.beginFill(0xa8347a);
      for (let i = 0; i < 3; i++) {
        curt.drawEllipse(cx + dir * (W * 0.028 + i * W * 0.036), H * 0.24, W * 0.014, H * 0.26);
      }
      curt.endFill();
    }
    r.addChild(curt);

    // ---------- walk layer (contestants walk here) ----------
    this.walkLayer = new PIXI.Container();
    r.addChild(this.walkLayer);

    // spotlight puddle at center
    this.spot = new PIXI.Graphics();
    this.spot.beginFill(0xfff3c0, 0.35);
    this.spot.drawEllipse(0, 0, 130, 34);
    this.spot.endFill();
    this.spot.position.set(W / 2, this.carpetY + 46);
    this.spot.alpha = 0;
    r.addChildAt(this.spot, r.getChildIndex(this.walkLayer));

    // ---------- audience (front row silhouettes) ----------
    this.crowd = new PIXI.Container();
    const crowdY = H - 8;
    const n = Math.ceil(W / 70) + 1;
    this.crowdHeads = [];
    for (let i = 0; i < n; i++) {
      const p = new PIXI.Container();
      const col = mixColor(0x241030, 0x3a1a50, Math.random());
      const g = new PIXI.Graphics();
      g.beginFill(col);
      g.drawCircle(0, -46, 20);
      g.drawRoundedRect(-26, -34, 52, 40, 14);
      g.endFill();
      p.addChild(g);
      // hands (for clapping)
      const hands = new PIXI.Graphics();
      hands.beginFill(col);
      hands.drawCircle(-12, -58, 7);
      hands.drawCircle(12, -58, 7);
      hands.endFill();
      hands.alpha = 0;
      p.addChild(hands);
      p.hands = hands;
      p.baseY = crowdY + rand(-6, 6);
      p.phase = rand(0, Math.PI * 2);
      p.position.set(i * 70 + rand(-12, 12), p.baseY);
      this.crowd.addChild(p);
      this.crowdHeads.push(p);
    }
    r.addChild(this.crowd);

    // ---------- applause meter ----------
    this.meter = new PIXI.Container();
    const mw = Math.min(W * 0.6, 320);
    const mg = new PIXI.Graphics();
    mg.beginFill(0x2a1030, 0.8);
    mg.drawRoundedRect(-mw / 2 - 4, -16, mw + 8, 32, 16);
    mg.endFill();
    this.meter.addChild(mg);
    this.meterFill = new PIXI.Graphics();
    this.meterFill.beginFill(0xffd35c);
    this.meterFill.drawRoundedRect(0, 0, mw, 20, 10);
    this.meterFill.endFill();
    this.meterFill.position.set(-mw / 2, -10);
    this.meterFill.scale.x = 0;
    this.meter.addChild(this.meterFill);
    // tick marks at every point so the bar reads as a 0-10 scale
    const ticks = new PIXI.Graphics();
    for (let i = 1; i < 10; i++) {
      ticks.beginFill(0x2a1030, i === 5 ? 0.55 : 0.3);
      ticks.drawRect(-mw / 2 + (mw / 10) * i - 1, -10, 2, 20);
      ticks.endFill();
    }
    this.meter.addChild(ticks);
    const mlabel = new PIXI.Text('JUDGES\' RATING', textStyle(13, 0xffffff, 0x2a1030, 3));
    mlabel.anchor.set(0, 0.5);
    mlabel.position.set(-mw / 2, -30);
    this.meter.addChild(mlabel);
    this.meterNum = new PIXI.Text('0.0 / 10', textStyle(18, 0xffe08a, 0x2a1030, 4));
    this.meterNum.anchor.set(1, 0.5);
    this.meterNum.position.set(mw / 2, -31);
    this.meter.addChild(this.meterNum);
    for (const [txt, fx] of [['0', -mw / 2], ['5', 0], ['10', mw / 2]]) {
      const tl = new PIXI.Text(txt, textStyle(11, 0xffffff, 0x2a1030, 3));
      tl.anchor.set(0.5);
      tl.position.set(fx, 25);
      this.meter.addChild(tl);
    }
    this.meter.position.set(W / 2, short ? 118 : H * 0.28);
    this.meter.alpha = 0;
    r.addChild(this.meter);

    // name tag for whoever is on the carpet
    this.nameTag = new PIXI.Text('', textStyle(24, 0xffffff, 0x8a1a5e, 5));
    this.nameTag.anchor.set(0.5);
    this.nameTag.position.set(W / 2, short ? 68 : this.carpetY - 130 - H * 0.30);
    if (short) this.nameTag.scale.set(0.8);
    this.nameTag.alpha = 0;
    r.addChild(this.nameTag);

    // back + hud
    const back = iconButton('back', 48, PALETTE.pink, async () => {
      this.alive = false;
      const { MenuScene } = await import('./menu.js');
      G.go(MenuScene);
    });
    back.position.set(36, H - 40);
    r.addChild(back);
    this.hud = makeHUD(W);
    r.addChild(this.hud);

    this.buildContestants();
    this.showIntro();
  }

  buildContestants() {
    const lv = level();
    const names = shuffle(NPC_NAMES).slice(0, 3);
    this.contestants = [
      { name: 'You ♥', eq: save.eq, skin: save.skin, look: save.look, isPlayer: true, style: styleScore(save.eq) },
      ...names.map((name) => {
        const eq = randomOutfit(lv);
        return { name, eq, skin: randi(0, SKINS.length - 1), look: randomLook(), isPlayer: false, style: styleScore(eq) };
      }),
    ];
    // final scores with a dash of judge whimsy (player gets a tiny home-crowd edge)
    for (const c of this.contestants) {
      c.score = c.style * (c.isPlayer ? rand(0.92, 1.15) : rand(0.82, 1.08));
      // ONE rating, always out of 10, used by the applause bar, the number
      // beside it and the final score card. It rises quickly for early
      // outfits and flattens near the top, so it can never pass 10.
      c.rating = Math.min(10, Math.round(10 * (4 + 6 * (1 - Math.exp(-c.score / 350)))) / 10);
    }
    // no exact ties: nudge later contestants down a tenth
    const seen = new Set();
    for (const c of [...this.contestants].sort((a, b) => b.score - a.score)) {
      while (seen.has(c.rating) && c.rating > 0.1) c.rating = Math.round((c.rating - 0.1) * 10) / 10;
      seen.add(c.rating);
    }
  }

  showIntro() {
    const { W, H } = this;
    const ov = new PIXI.Container();
    const dim = new PIXI.Graphics();
    dim.beginFill(0x20081c, 0.6);
    dim.drawRect(0, 0, W, H);
    dim.endFill();
    dim.eventMode = 'static';
    ov.addChild(dim);
    const pw = Math.min(410, W - 30);
    const panel = makePanel(pw, 300, { border: PALETTE.gold });
    panel.position.set(W / 2, H / 2);
    ov.addChild(panel);
    const ic = makeIcon('crown', 60);
    ic.position.set(W / 2, H / 2 - 100);
    ov.addChild(ic);
    const t = new PIXI.Text('Fashion Night!', textStyle(32, PALETTE.gold, 0xffffff, 0));
    t.anchor.set(0.5);
    t.position.set(W / 2, H / 2 - 48);
    ov.addChild(t);
    const d = new PIXI.Text(
      'Strut the red carpet against 3 rivals!\nJudges love rare, sparkly outfits —\ndress your best in the Wardrobe first.',
      { ...textStyle(17, PALETTE.text, 0xffffff, 0), fontWeight: '600', align: 'center', lineHeight: 25 },
    );
    d.anchor.set(0.5);
    d.position.set(W / 2, H / 2 + 12);
    ov.addChild(d);
    const go = makeButton('Start the show!', {
      w: 230, h: 60, color: PALETTE.gold,
      onTap: () => {
        tween(ov, { alpha: 0 }, 250, { onDone: () => { ov.destroy({ children: true }); this.runShow(); } });
      },
    });
    go.position.set(W / 2, H / 2 + 104);
    ov.addChild(go);
    panel.scale.set(0.75);
    tween(panel.scale, { x: 1, y: 1 }, 380, { ease: Ease.backOut });
    this.root.addChild(ov);
  }

  wait(ms) {
    return new Promise((res) => delay(ms, res));
  }

  async runShow() {
    Sfx.fanfare();
    gameplayStart();
    await this.wait(600);
    for (const c of this.contestants) {
      if (!this.alive) return;
      await this.walkOne(c);
    }
    if (!this.alive) return;
    await this.judging();
  }

  async walkOne(c) {
    const { W, H } = this;
    const charH = Math.min(H * 0.34, 300);
    const ch = createCharacter(c.eq, c.skin, { look: c.look });
    const s = charH / 560;
    ch.scale.set(s);
    ch.position.set(-80, this.carpetY + 50);
    this.walkLayer.addChild(ch);
    this.curChar = ch;

    this.nameTag.text = c.name;
    this.nameTag.alpha = 0;
    tween(this.nameTag, { alpha: 1 }, 400);

    // walk in
    Sfx.whoosh();
    this.clapping = true;
    const walkMs = 1700;
    const startX = -80, endX = W / 2;
    await new Promise((res) => {
      tween({ t: 0 }, { t: 1 }, walkMs, {
        onUpdate: (e, p) => {
          if (ch.destroyed) return;
          ch.x = startX + (endX - startX) * p;
          ch.y = this.carpetY + 50 - Math.abs(Math.sin(p * Math.PI * 6)) * 10;
          ch.rotation = Math.sin(p * Math.PI * 6) * 0.04;
        },
        onDone: res,
      });
    });
    if (!this.alive || ch.destroyed) return;

    // pose in the spotlight
    tween(this.spot, { alpha: 1 }, 300);
    ch.rotation = 0;
    Sfx.sparkle();
    sparkleBurst(W / 2, this.carpetY - charH * 0.4, { n: 20, power: 1.2 });
    floatHearts(W / 2, this.carpetY - charH * 0.5, 5);
    killTweensOf(ch.scale);
    tween(ch.scale, { x: s * 1.12, y: s * 1.12 }, 250, { ease: Ease.backOut });
    delay(500, () => !ch.destroyed && tween(ch.scale, { x: s, y: s }, 300));

    // applause meter fills toward their score
    this.meter.alpha = 0;
    this.meterFill.scale.x = 0;
    tween(this.meter, { alpha: 1 }, 250);
    const frac = c.rating / 10;
    this.meterNum.text = '0.0 / 10';
    await new Promise((res) => {
      tween(this.meterFill.scale, { x: frac }, 1000, {
        ease: Ease.quadOut,
        onUpdate: (e) => {
          this.meterNum.text = (c.rating * e).toFixed(1) + ' / 10';
          if (Math.random() < 0.2) {
            Sfx.clap();
            this.flash();
          }
          if (Math.random() < 0.1) floatHearts(rand(W * 0.2, W * 0.8), H - 60, 1);
        },
        onDone: res,
      });
    });
    this.meterNum.text = c.rating.toFixed(1) + ' / 10';
    if (!this.alive) return;
    floatText(W / 2, H * 0.28 + 64, this.applauseWord(frac), { size: 30, fill: 0xffe08a, stroke: 0x8a1a5e });
    await this.wait(500);
    if (!this.alive || ch.destroyed) return;

    // walk off
    tween(this.spot, { alpha: 0 }, 300);
    tween(this.meter, { alpha: 0 }, 300);
    tween(this.nameTag, { alpha: 0 }, 300);
    const offX = W + 90;
    await new Promise((res) => {
      tween({ t: 0 }, { t: 1 }, 1200, {
        onUpdate: (e, p) => {
          if (ch.destroyed) return;
          ch.x = W / 2 + (offX - W / 2) * p;
          ch.y = this.carpetY + 50 - Math.abs(Math.sin(p * Math.PI * 5)) * 10;
          ch.rotation = Math.sin(p * Math.PI * 5) * 0.04;
        },
        onDone: res,
      });
    });
    this.clapping = false;
    if (!ch.destroyed) ch.destroy({ children: true });
  }

  applauseWord(frac) {
    if (frac >= 0.9) return 'STUNNING!';
    if (frac >= 0.7) return 'Gorgeous!';
    if (frac >= 0.45) return 'Lovely!';
    return 'Cute!';
  }

  flash() {
    const { W, H } = this;
    const f = new PIXI.Graphics();
    f.beginFill(0xffffff, 0.9);
    f.drawCircle(0, 0, rand(3, 7));
    f.endFill();
    f.position.set(rand(W * 0.05, W * 0.95), rand(H * 0.72, H * 0.95));
    this.root.addChild(f);
    tween(f, { alpha: 0 }, 300, { onDone: () => !f.destroyed && f.destroy() });
  }

  async judging() {
    const { W, H } = this;
    if (!this.alive) return;
    Sfx.drum();
    tween(this.banner, { alpha: 0 }, 400);

    // judges pop up behind a desk
    const deskH = Math.min(120, H * 0.16);
    const judgesC = new PIXI.Container();
    const desk = new PIXI.Graphics();
    desk.beginFill(0x5e2a7e);
    desk.drawRoundedRect(-W * 0.35, -deskH * 0.35, W * 0.7, deskH * 0.8, 16);
    desk.endFill();
    desk.lineStyle({ width: 4, color: 0xf5b21a });
    desk.drawRoundedRect(-W * 0.35, -deskH * 0.35, W * 0.7, deskH * 0.8, 16);
    desk.lineStyle(0);
    judgesC.addChild(desk);
    JUDGES.forEach((j, i) => {
      const jx = (i - 1) * W * 0.22;
      const g = new PIXI.Graphics();
      g.beginFill(0xffdfc9);
      g.drawCircle(jx, -deskH * 0.55, deskH * 0.28);
      g.endFill();
      g.beginFill(j.color);
      g.arc(jx, -deskH * 0.58, deskH * 0.3, Math.PI, 0);
      g.closePath();
      g.endFill();
      g.beginFill(0x3a2a22);
      g.drawCircle(jx - 8, -deskH * 0.55, 2.5);
      g.drawCircle(jx + 8, -deskH * 0.55, 2.5);
      g.endFill();
      g.lineStyle({ width: 2, color: 0xc2447c, cap: PIXI.LINE_CAP.ROUND });
      g.moveTo(jx - 5, -deskH * 0.47);
      g.quadraticCurveTo(jx, -deskH * 0.44, jx + 5, -deskH * 0.47);
      g.lineStyle(0);
      judgesC.addChild(g);
    });
    judgesC.position.set(W / 2, H + deskH);
    this.root.addChild(judgesC);
    await new Promise((res) => tween(judgesC, { y: H - deskH * 0.5 }, 600, { ease: Ease.backOut, onDone: res }));
    if (!this.alive) return;

    const ranked = [...this.contestants].sort((a, b) => b.score - a.score);
    const playerPlace = ranked.findIndex((c) => c.isPlayer) + 1;

    // score cards pop for each contestant, worst to best for drama
    const reveal = [...ranked].reverse();
    const cardW = Math.min(W * 0.86, 420);
    const rowsC = new PIXI.Container();
    rowsC.position.set(W / 2, H * 0.17);
    this.root.addChild(rowsC);
    for (let i = 0; i < reveal.length; i++) {
      if (!this.alive) return;
      const c = reveal[i];
      const place = ranked.indexOf(c) + 1;
      const row = new PIXI.Container();
      const rg = new PIXI.Graphics();
      const col = place === 1 ? 0xffd35c : c.isPlayer ? 0xffc0dd : 0xffffff;
      rg.beginFill(col, 0.95);
      rg.drawRoundedRect(-cardW / 2, -24, cardW, 48, 24);
      rg.endFill();
      rg.lineStyle({ width: 3, color: place === 1 ? 0xc78a00 : 0xd88ab8 });
      rg.drawRoundedRect(-cardW / 2, -24, cardW, 48, 24);
      rg.lineStyle(0);
      row.addChild(rg);
      const medal = ['🥇', '🥈', '🥉', '4th'][place - 1];
      const nm = new PIXI.Text(`${medal}  ${c.name}`, textStyle(20, 0x8a3060, 0xffffff, 0));
      nm.anchor.set(0, 0.5);
      nm.x = -cardW / 2 + 18;
      row.addChild(nm);
      const sc = new PIXI.Text(c.rating.toFixed(1) + ' / 10', textStyle(22, place === 1 ? 0xc78a00 : 0xa66ae0, 0xffffff, 0));
      sc.anchor.set(1, 0.5);
      sc.x = cardW / 2 - 18;
      row.addChild(sc);
      row.y = (place - 1) * 56;
      row.scale.set(0);
      rowsC.addChild(row);
      Sfx.note(3 - i);
      tween(row.scale, { x: 1, y: 1 }, 380, { ease: Ease.backOut });
      await this.wait(550);
    }
    if (!this.alive) return;

    // winner flourish
    const winner = ranked[0];
    await this.wait(300);
    Sfx.fanfare();
    confetti(W, 100);
    for (const p of this.crowdHeads) floatHearts(p.x, H - 70, 1);
    const wt = new PIXI.Text(
      winner.isPlayer ? '👑 YOU WIN! 👑' : `${winner.name} wins!`,
      textStyle(Math.min(44, W * 0.085), 0xffe08a, 0xc2447c, 8),
    );
    wt.anchor.set(0.5);
    wt.position.set(W / 2, Math.max(56, H * 0.17 - 68));
    wt.scale.set(0);
    this.root.addChild(wt);
    tween(wt.scale, { x: 1, y: 1 }, 500, { ease: Ease.elasticOut });

    // rewards
    save.shows++;
    todayStats().shows++;
    const mine = this.contestants[0];
    save.bestShow = Math.max(save.bestShow || 0, mine.rating);
    submitScore('runway', Math.round(mine.rating * 10));
    if (playerPlace === 1) {
      save.wins++;
      save.winStreak = (save.winStreak || 0) + 1;
      save.bestWinStreak = Math.max(save.bestWinStreak || 0, save.winStreak);
    } else save.winStreak = 0;
    persist();
    gameplayStop();
    if (playerPlace === 1) happytime();
    const placeReward = [300, 150, 80, 40][playerPlace - 1];
    const styleBonus = Math.min(150, Math.round(this.contestants[0].style / 2));
    const total = placeReward + styleBonus;
    const { leveledUp, levels } = earnCoins(total);
    const lvBonus = levels.reduce((a, l) => a + l.reward, 0);

    await this.wait(1100);
    if (!this.alive) return;
    const pw = Math.min(400, W - 30);
    const panel = new PIXI.Container();
    const pg = makePanel(pw, 250, { border: PALETTE.gold });
    panel.addChild(pg);
    const rt = new PIXI.Text(playerPlace === 1 ? 'Best Dressed!' : `You placed ${['1st', '2nd', '3rd', '4th'][playerPlace - 1]}!`, textStyle(28, PALETTE.pink, 0xffffff, 0));
    rt.anchor.set(0.5);
    rt.y = -84;
    panel.addChild(rt);
    const coinRow = new PIXI.Container();
    coinRow.addChild(makeIcon('coin', 38));
    const ct = new PIXI.Text(`+${fmt(total)}  (place ${fmt(placeReward)} + style ${fmt(styleBonus)})`, textStyle(19, 0xf5a91a, 0xffffff, 0));
    ct.anchor.set(0, 0.5);
    ct.x = 26;
    coinRow.addChild(ct);
    coinRow.x = -coinRow.width / 2 + 12;
    coinRow.y = -36;
    panel.addChild(coinRow);
    const tip = new PIXI.Text(
      leveledUp ? `LEVEL UP! Lv ${level()}  +${fmt(lvBonus)} bonus coins` : playerPlace === 1 ? (save.winStreak > 1 ? `${save.winStreak} wins in a row! Your rating: ${mine.rating.toFixed(1)} / 10` : `Your rating: ${mine.rating.toFixed(1)} / 10`) : `Your rating: ${mine.rating.toFixed(1)} / 10 — rarer outfits score higher!`,
      textStyle(17, PALETTE.purple, 0xffffff, 0),
    );
    tip.anchor.set(0.5);
    tip.y = 4;
    if (tip.width > pw - 30) tip.scale.set((pw - 30) / tip.width);
    panel.addChild(tip);
    const again = makeButton('Encore!', { w: pw * 0.4, h: 56, color: PALETTE.gold, fontSize: 20, onTap: () => G.go(FashionShowScene) });
    again.position.set(-pw * 0.22, 66);
    panel.addChild(again);
    const home = makeButton('Boutique', {
      w: pw * 0.4, h: 56, color: PALETTE.purple, fontSize: 20,
      onTap: async () => {
        const { MenuScene } = await import('./menu.js');
        G.go(MenuScene);
      },
    });
    home.position.set(pw * 0.22, 66);
    panel.addChild(home);
    // Keep the reward panel clear of the score cards on every screen shape.
    const rowsBottom = rowsC.y + 3 * 56 + 28;
    let pk = 1;
    if (rowsBottom + 262 <= H) {
      panel.position.set(W / 2, Math.max(H * 0.60, rowsBottom + 133));
    } else if (W > H * 1.3) {
      // short, wide screens (sideways phones): cards on the left, rewards on the right
      const rk = Math.min(1, (W * 0.5 - 16) / cardW, (H - 70) / 200);
      rowsC.scale.set(rk);
      rowsC.position.set(W * 0.26, 66 + 26 * rk);
      wt.position.set(W / 2, 28);
      wt.scale.set(Math.min(0.7, (W - 440) / wt.width));
      pk = Math.min(1, (H - 12) / 250, (W * 0.48 - 12) / pw);
      panel.position.set(W * 0.74, H / 2);
    } else {
      pk = Math.max(0.6, Math.min(1, (H - rowsBottom - 8) / 250));
      panel.position.set(W / 2, H - 4 - 125 * pk);
    }
    panel.scale.set(0);
    this.root.addChild(panel);
    tween(panel.scale, { x: pk, y: pk }, 450, { ease: Ease.backOut });
    coinFly(W / 2, H * 0.4, W - 130, 34, 10, () => this.hud.bumpCoin());
  }

  update(ms) {
    this.t += ms;
    // audience sway / clap
    for (const p of this.crowdHeads) {
      if (p.destroyed) continue;
      if (this.clapping) {
        p.y = p.baseY - Math.abs(Math.sin(this.t / 140 + p.phase)) * 7;
        p.hands.alpha = 1;
        p.hands.y = -Math.abs(Math.sin(this.t / 140 + p.phase)) * 8;
      } else {
        p.y = p.baseY - Math.sin(this.t / 900 + p.phase) * 2;
        p.hands.alpha = 0;
      }
    }
    if (this.clapping && Math.random() < 0.05) this.flash();
    if (this.curChar && !this.curChar.destroyed) this.curChar.charUpdate(ms);
  }
}
