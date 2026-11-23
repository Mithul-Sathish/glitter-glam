// Bubble Pop: bubbles drift up — pop them! The banner names a TARGET colour:
// those are worth the most, and popping them in a row builds a streak. Other
// colours still score a little. Golden bubbles pay bonus points, thorny ones sting.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { makeIcon } from '../../ui.js';
import { sparkleBurst, floatText, shake } from '../../effects.js';
import { tween, Ease } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { rand, choice, darken } from '../../util.js';

const COLOURS = [
  { name: 'MINT', hex: 0x4fd6a0 },
  { name: 'PINK', hex: 0xff6fb0 },
  { name: 'PURPLE', hex: 0x9a6ee0 },
  { name: 'YELLOW', hex: 0xffcf3a },
  { name: 'ORANGE', hex: 0xff8a3c },
];
const TARGET_MS = 9000;

export class BubblePopScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'bubble';
    this.title = 'Bubble Pop';
    this.icon = 'bubble';
    this.howTo = 'The banner names a colour — pop THAT colour for big points and a streak! Other colours are safe but only worth a few points. Coin bubbles pay 40. Don\'t touch the thorny ones!';
    this.duration = 45000;
    this.coinRate = 0.28;
    this.bgTop = 0xbfe8f7;
    this.bgBot = 0x7fc4ec;
  }

  setup(W, H) {
    this.items = [];
    this.spawnT = 0;
    // sea sparkle floor
    const g = new PIXI.Graphics();
    for (let i = 0; i < 5; i++) {
      g.beginFill(0xffffff, 0.12);
      g.drawEllipse(rand(0, W), H - rand(0, 40), rand(60, 140), 18);
      g.endFill();
    }
    this.playLayer.addChild(g);

    // target banner
    this.streak = 0;
    this.target = null;
    this.targetT = 0;
    const b = new PIXI.Container();
    this.bannerBg = new PIXI.Graphics();
    b.addChild(this.bannerBg);
    this.bannerSwatch = new PIXI.Graphics();
    b.addChild(this.bannerSwatch);
    this.bannerText = new PIXI.Text('', {
      fontFamily: 'GameFont', fontSize: 24, fontWeight: '900',
      fill: 0xffffff, stroke: 0x1d3a5c, strokeThickness: 5,
    });
    this.bannerText.anchor.set(0, 0.5);
    b.addChild(this.bannerText);
    this.bannerBar = new PIXI.Graphics();
    b.addChild(this.bannerBar);
    b.position.set(W / 2, 96);
    b.visible = false;
    this.banner = b;
    this.root.addChild(b); // above the bubbles
  }

  begin() { this.spawnT = 300; this.newTarget(); }

  newTarget() {
    const options = COLOURS.filter((c) => c !== this.target);
    this.target = choice(options);
    this.targetT = TARGET_MS;
    this.streak = 0;
    const t = this.bannerText;
    t.text = `Pop ${this.target.name}!`;
    const w = t.width + 78;
    const bg = this.bannerBg;
    bg.clear();
    bg.beginFill(0x1d3a5c, 0.9);
    bg.drawRoundedRect(-w / 2, -26, w, 52, 26);
    bg.endFill();
    bg.lineStyle({ width: 4, color: this.target.hex });
    bg.drawRoundedRect(-w / 2, -26, w, 52, 26);
    bg.lineStyle(0);
    const sw = this.bannerSwatch;
    sw.clear();
    sw.beginFill(this.target.hex);
    sw.drawCircle(0, 0, 16);
    sw.endFill();
    sw.lineStyle({ width: 2.5, color: 0xffffff });
    sw.drawCircle(0, 0, 16);
    sw.lineStyle(0);
    sw.beginFill(0xffffff, 0.8);
    sw.drawEllipse(-5, -6, 5, 3);
    sw.endFill();
    sw.x = -w / 2 + 30;
    t.x = -w / 2 + 54;
    this.bannerW = w;
    this.banner.visible = true;
    this.banner.scale.set(1.25);
    tween(this.banner.scale, { x: 1, y: 1 }, 320, { ease: Ease.backOut });
    Sfx.sparkle();
    // make sure a couple of the new colour are on the way
    this.forceTarget = 2;
  }

  spawn() {
    const { W, H } = this;
    const roll = Math.random();
    const kind = roll < 0.1 ? 'gold' : roll < 0.24 ? 'thorn' : 'normal';
    const r = kind === 'gold' ? rand(26, 32) : rand(24, 42);
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    if (kind === 'thorn') {
      g.beginFill(0x5c4a6a, 0.9);
      g.drawCircle(0, 0, r);
      g.endFill();
      g.lineStyle({ width: 3, color: 0x3c2a4a });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        g.lineTo(Math.cos(a) * (r + 9), Math.sin(a) * (r + 9));
      }
      g.lineStyle(0);
      g.beginFill(0xff8080);
      g.drawCircle(-r * 0.25, -r * 0.1, 3); g.drawCircle(r * 0.25, -r * 0.1, 3);
      g.endFill();
    } else {
      // ~45% of normal bubbles are the target colour, the rest are a mix
      let colour = null;
      if (kind === 'normal') {
        const wantTarget = this.forceTarget > 0 || Math.random() < 0.45;
        if (this.forceTarget > 0) this.forceTarget--;
        colour = wantTarget && this.target ? this.target : choice(COLOURS.filter((cc) => cc !== this.target));
      }
      this.spawnColour = colour;
      const col = kind === 'gold' ? 0xffd35c : colour.hex;
      g.beginFill(col, kind === 'gold' ? 0.92 : 0.82);
      g.drawCircle(0, 0, r);
      g.endFill();
      g.lineStyle({ width: 3, color: kind === 'gold' ? 0xffffff : darken(col, 0.28), alpha: 0.95 });
      g.drawCircle(0, 0, r);
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.85);
      g.drawEllipse(-r * 0.35, -r * 0.38, r * 0.22, r * 0.13);
      g.endFill();
      if (kind === 'gold') {
        const ic = makeIcon('coin', r * 0.9);
        c.addChild(ic);
      }
    }
    c.addChildAt(g, 0);
    c.x = rand(40, W - 40);
    c.y = H + r + 10;
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const item = {
      c, kind, r, colour: kind === 'normal' ? this.spawnColour : null,
      vy: -(rand(1.3, 2.4) + (45000 - this.timeLeft) / 25000),
      sway: rand(0.5, 1.4),
      swayT: rand(0, 9),
      wob: rand(0.8, 1.2),
      dead: false,
    };
    c.on('pointerdown', (e) => this.pop(item, G.ev(e)));
    this.items.push(item);
    this.playLayer.addChild(c);
  }

  pop(item, gp) {
    if (item.dead || !this.running) return;
    item.dead = true;
    if (item.kind === 'thorn') {
      Sfx.bad();
      this.addScore(-20, gp.x, gp.y);
      shake(this.root, 10, 300);
      tween(item.c.scale, { x: 0.6, y: 0.6 }, 200);
      tween(item.c, { alpha: 0 }, 220, { onDone: () => !item.c.destroyed && item.c.destroy() });
      return;
    }
    const onTarget = item.kind === 'normal' && item.colour === this.target;
    let pts;
    if (item.kind === 'gold') pts = 40;
    else if (onTarget) {
      this.streak++;
      pts = Math.round(36 - item.r * 0.4) + Math.min(30, (this.streak - 1) * 5); // small bubbles score more
      if (this.streak >= 3) floatText(gp.x, gp.y - 44, `${this.streak} in a row!`, { size: 18, fill: 0xffe08a, stroke: 0x1d3a5c });
      if (this.streak % 5 === 0) Sfx.perfect();
    } else {
      this.streak = 0; // wrong colour never hurts — it just pays less
      pts = 5;
    }
    Sfx.pop();
    sparkleBurst(gp.x, gp.y, {
      n: item.kind === 'gold' ? 16 : 9,
      colors: item.kind === 'gold' ? [0xffd35c, 0xffffff, 0xffe9a8] : [0xffffff, item.colour.hex],
    });
    // pop ring
    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 4, color: 0xffffff, alpha: 0.9 });
    ring.drawCircle(0, 0, item.r);
    ring.position.copyFrom(item.c.position);
    this.playLayer.addChild(ring);
    tween(ring.scale, { x: 1.8, y: 1.8 }, 240, { ease: Ease.quadOut });
    tween(ring, { alpha: 0 }, 240, { onDone: () => !ring.destroyed && ring.destroy() });
    this.addScore(pts, gp.x, gp.y);
    item.c.destroy();
  }

  tick(ms) {
    const k = ms / 16.667;
    this.targetT -= ms;
    if (this.targetT <= 0) this.newTarget();
    // countdown bar under the banner
    const bw = this.bannerW - 52;
    this.bannerBar.clear();
    this.bannerBar.beginFill(this.target.hex);
    this.bannerBar.drawRoundedRect(-bw / 2, 30, Math.max(4, bw * (this.targetT / TARGET_MS)), 5, 2.5);
    this.bannerBar.endFill();
    this.spawnT -= ms;
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (720 - (45000 - this.timeLeft) / 100) * rand(0.7, 1.3);
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.dead || it.c.destroyed) { this.items.splice(i, 1); continue; }
      it.swayT += ms / 350;
      it.c.y += it.vy * k;
      it.c.x += Math.sin(it.swayT) * it.sway * k;
      it.c.scale.set(1 + Math.sin(it.swayT * it.wob) * 0.05);
      if (it.c.y < -it.r - 20) {
        if (it.kind !== 'thorn') Sfx.miss();
        it.c.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  cleanup() {
    for (const it of this.items) if (!it.c.destroyed) it.c.destroy();
    this.items = [];
  }
}
