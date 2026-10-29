// Star Catch: stars rain down — tap them before they hit the floor.
// Pink gems are worth 5x, storm clouds cost you points.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { sparkleBurst, floatText, shake } from '../../effects.js';
import { tween, Ease } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { rand, starPoints, drawDiamond, choice } from '../../util.js';

export class StarCatchScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'starcatch';
    this.title = 'Star Catch';
    this.icon = 'star';
    this.howTo = 'Tap the falling stars before they touch the ground! Pink gems are worth 5×. Avoid the grumpy storm clouds!';
    this.duration = 45000;
    this.coinRate = 0.28;
    this.bgTop = 0x2d2350;
    this.bgBot = 0x7a4a9e;
  }

  setup(W, H) {
    this.items = [];
    this.spawnT = 0;
    this.spawnEvery = 800;
    this.combo = 0;
    this.comboT = 0;
    // twinkling backdrop stars
    const bg = new PIXI.Graphics();
    for (let i = 0; i < 40; i++) {
      bg.beginFill(0xffffff, rand(0.2, 0.6));
      bg.drawCircle(rand(0, W), rand(0, H), rand(1, 2.5));
      bg.endFill();
    }
    this.playLayer.addChild(bg);
    // ground glow
    const ground = new PIXI.Graphics();
    ground.beginFill(0xffffff, 0.15);
    ground.drawRect(0, H - 26, W, 26);
    ground.endFill();
    this.playLayer.addChild(ground);

    this.comboText = new PIXI.Text('', {
      fontFamily: 'GameFont', fontSize: 24, fontWeight: '900',
      fill: 0xffe08a, stroke: 0x8a3060, strokeThickness: 5,
    });
    this.comboText.anchor.set(0.5);
    this.comboText.position.set(W / 2, 92);
    this.playLayer.addChild(this.comboText);
  }

  begin() { this.spawnT = 400; }

  spawn() {
    const { W } = this;
    const roll = Math.random();
    const kind = roll < 0.09 ? 'gem' : roll < 0.22 ? 'cloud' : 'star';
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    let r = rand(22, 34);
    if (kind === 'star') {
      const col = choice([0xffd35c, 0xffe08a, 0xfff3b0]);
      g.beginFill(col);
      g.drawPolygon(starPoints(0, 0, 5, r, r * 0.5));
      g.endFill();
      g.beginFill(0xffffff, 0.85);
      g.drawCircle(-r * 0.25, -r * 0.3, r * 0.14);
      g.endFill();
      // cute face
      g.beginFill(0x8a5a00);
      g.drawCircle(-r * 0.18, 0, 2.4); g.drawCircle(r * 0.18, 0, 2.4);
      g.endFill();
      g.lineStyle({ width: 2, color: 0x8a5a00, cap: PIXI.LINE_CAP.ROUND });
      g.moveTo(-r * 0.1, r * 0.16); g.quadraticCurveTo(0, r * 0.26, r * 0.1, r * 0.16);
      g.lineStyle(0);
    } else if (kind === 'gem') {
      r = 26;
      g.beginFill(0xff6fb5);
      drawDiamond(g, 0, 0, r);
      g.endFill();
      g.beginFill(0xffffff, 0.8);
      g.drawPolygon([0, -r, r * 0.35, -r * 0.25, 0, 0, -r * 0.35, -r * 0.25]);
      g.endFill();
    } else {
      r = 30;
      g.beginFill(0x6a6a8a);
      g.drawCircle(-14, 4, 14); g.drawCircle(2, -6, 18); g.drawCircle(18, 6, 13);
      g.drawRect(-14, 4, 32, 13);
      g.endFill();
      g.beginFill(0x44445c);
      g.drawCircle(-6, 0, 3); g.drawCircle(8, 0, 3);
      g.endFill();
      g.lineStyle({ width: 2.5, color: 0x44445c, cap: PIXI.LINE_CAP.ROUND });
      g.moveTo(-4, 8); g.quadraticCurveTo(1, 4, 6, 8);
      g.lineStyle(0);
    }
    c.addChild(g);
    c.x = rand(40, W - 40);
    c.y = -40;
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const item = {
      c, kind,
      vy: rand(1.6, 2.6) + (45000 - this.timeLeft) / 22000, // speeds up over the round
      vr: rand(-0.03, 0.03),
      sway: kind === 'cloud' ? 0 : rand(0.3, 1),
      swayT: rand(0, 9),
      dead: false,
    };
    c.on('pointerdown', (e) => this.hit(item, G.ev(e)));
    this.items.push(item);
    this.playLayer.addChild(c);
  }

  hit(item, gp) {
    if (item.dead || !this.running) return;
    item.dead = true;
    if (item.kind === 'cloud') {
      Sfx.bad();
      this.addScore(-15, gp.x, gp.y);
      shake(this.root, 10, 300);
      this.combo = 0;
      this.comboText.text = '';
      tween(item.c, { alpha: 0, y: item.c.y + 30 }, 250, { onDone: () => !item.c.destroyed && item.c.destroy() });
      return;
    }
    this.combo++;
    this.comboT = 2000;
    const mult = 1 + Math.min(4, Math.floor(this.combo / 5));
    const pts = (item.kind === 'gem' ? 50 : 10) * mult;
    Sfx.pop();
    if (item.kind === 'gem') Sfx.sparkle();
    sparkleBurst(gp.x, gp.y, { n: item.kind === 'gem' ? 18 : 8, colors: item.kind === 'gem' ? [0xff6fb5, 0xffffff, 0xffc0e2] : undefined });
    this.addScore(pts, gp.x, gp.y);
    if (this.combo > 0 && this.combo % 5 === 0) {
      this.comboText.text = `combo ×${mult}!`;
      Sfx.perfect();
      tween(this.comboText.scale, { x: 1.3, y: 1.3 }, 140, { onDone: () => tween(this.comboText.scale, { x: 1, y: 1 }, 200) });
    }
    tween(item.c.scale, { x: 1.5, y: 1.5 }, 130, { ease: Ease.quadOut });
    tween(item.c, { alpha: 0 }, 130, { onDone: () => !item.c.destroyed && item.c.destroy() });
  }

  tick(ms) {
    const k = ms / 16.667;
    this.spawnT -= ms;
    this.spawnEvery = 800 - (45000 - this.timeLeft) / 90; // up to ~2x spawn rate
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = this.spawnEvery * rand(0.7, 1.3);
    }
    this.comboT -= ms;
    if (this.comboT <= 0 && this.combo > 0) {
      this.combo = 0;
      this.comboText.text = '';
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.dead || it.c.destroyed) { this.items.splice(i, 1); continue; }
      it.swayT += ms / 400;
      it.c.y += it.vy * k;
      it.c.x += Math.sin(it.swayT) * it.sway * k;
      it.c.rotation += it.vr * k;
      if (it.c.y > this.H - 10) {
        if (it.kind !== 'cloud') {
          Sfx.miss();
          this.combo = 0;
          this.comboText.text = '';
          floatText(it.c.x, this.H - 40, 'miss', { size: 18, fill: 0xffc0c0, stroke: 0x6a2040 });
        }
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
