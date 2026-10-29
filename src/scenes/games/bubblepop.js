// Bubble Pop: sparkly bubbles drift up — pop them! Golden bubbles rain bonus
// points, thorny ones sting.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { makeIcon } from '../../ui.js';
import { sparkleBurst, floatText, shake } from '../../effects.js';
import { tween, Ease } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { rand, choice } from '../../util.js';

export class BubblePopScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'bubble';
    this.title = 'Bubble Pop';
    this.icon = 'bubble';
    this.howTo = 'Pop the sparkly bubbles before they float away! Golden bubbles are worth 40. Don\'t touch the thorny ones!';
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
  }

  begin() { this.spawnT = 300; }

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
      const col = kind === 'gold' ? 0xffd35c : choice([0xaee2fb, 0xffc9e5, 0xd8c8fa, 0xbef0d8]);
      g.beginFill(col, kind === 'gold' ? 0.92 : 0.55);
      g.drawCircle(0, 0, r);
      g.endFill();
      g.lineStyle({ width: 2.5, color: 0xffffff, alpha: 0.8 });
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
      c, kind, r,
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
    const pts = item.kind === 'gold' ? 40 : Math.round(30 - item.r * 0.4); // small bubbles score more
    Sfx.pop();
    sparkleBurst(gp.x, gp.y, {
      n: item.kind === 'gold' ? 16 : 9,
      colors: item.kind === 'gold' ? [0xffd35c, 0xffffff, 0xffe9a8] : [0xffffff, 0xaee2fb, 0xffc9e5],
    });
    // pop ring
    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 4, color: 0xffffff, alpha: 0.9 });
    ring.drawCircle(0, 0, item.r);
    ring.position.copyFrom(item.c.position);
    this.playLayer.addChild(ring);
    tween(ring.scale, { x: 1.8, y: 1.8 }, 240, { ease: Ease.quadOut });
    tween(ring, { alpha: 0 }, 240, { onDone: () => !ring.destroyed && ring.destroy() });
    this.addScore(Math.max(8, pts), gp.x, gp.y);
    item.c.destroy();
  }

  tick(ms) {
    const k = ms / 16.667;
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
