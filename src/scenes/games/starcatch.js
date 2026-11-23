// Star Catch: stars rain down — tap them before they hit the floor.
// Pink gems are worth 5x, storm clouds cost you points. Constellations
// (4-5 linked stars) pay a big bonus when you catch every star in them, and
// shooting stars streak across for extra points.

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
    this.howTo = 'Tap the falling stars! Pink gems are worth 5×. Catch EVERY star in a linked constellation for a big bonus, and grab shooting stars as they zoom by. Avoid the storm clouds!';
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
    this.groups = [];        // constellations in flight
    this.shooters = [];      // shooting stars in flight
    this.constT = 6500;      // first constellation arrives early so players meet it
    this.shootT = 4000;
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

  // ---------------- constellations ----------------
  spawnConstellation() {
    const { W } = this;
    const n = Math.random() < 0.5 ? 4 : 5;
    const span = Math.min(W - 80, 300);
    const c = new PIXI.Container();
    const lines = new PIXI.Graphics();
    c.addChild(lines);
    const group = { c, lines, stars: [], caught: 0, vy: 1.15 + (45000 - this.timeLeft) / 60000, dead: false };
    // a gentle zig-zag of linked stars
    for (let i = 0; i < n; i++) {
      const sx = -span / 2 + (span / (n - 1)) * i + rand(-10, 10);
      const sy = (i % 2 ? -1 : 1) * rand(22, 46);
      const g = new PIXI.Graphics();
      const star = { g, x: sx, y: sy, caught: false };
      this.drawConstStar(star);
      g.position.set(sx, sy);
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.hitArea = new PIXI.Circle(0, 0, 34);
      g.on('pointerdown', (e) => this.hitConst(group, star, G.ev(e)));
      c.addChild(g);
      group.stars.push(star);
    }
    this.drawConstLines(group);
    c.x = rand(span / 2 + 40, W - span / 2 - 40);
    if (span / 2 + 40 > W - span / 2 - 40) c.x = W / 2;
    c.y = -70;
    this.groups.push(group);
    this.playLayer.addChild(c);
    floatText(W / 2, 150, 'Constellation! Catch them all', { size: 20, fill: 0xbfe8ff, stroke: 0x2d2350, dur: 1500 });
  }

  drawConstStar(star) {
    const g = star.g;
    g.clear();
    const r = 24;
    g.beginFill(star.caught ? 0xffe08a : 0x8fd8ff, 0.3);
    g.drawCircle(0, 0, r + 8);
    g.endFill();
    g.beginFill(star.caught ? 0xffd35c : 0xdff4ff);
    g.drawPolygon(starPoints(0, 0, 5, r, r * 0.48));
    g.endFill();
    g.lineStyle({ width: 3, color: star.caught ? 0xf5a91a : 0x5bb8f0 });
    g.drawPolygon(starPoints(0, 0, 5, r, r * 0.48));
    g.lineStyle(0);
    g.beginFill(0xffffff, 0.9);
    g.drawCircle(-r * 0.25, -r * 0.3, r * 0.14);
    g.endFill();
  }

  drawConstLines(group) {
    const l = group.lines;
    l.clear();
    for (let i = 0; i < group.stars.length - 1; i++) {
      const a = group.stars[i], b = group.stars[i + 1];
      const lit = a.caught && b.caught;
      l.lineStyle({ width: lit ? 5 : 3, color: lit ? 0xffd35c : 0xbfe8ff, alpha: lit ? 1 : 0.7, cap: PIXI.LINE_CAP.ROUND });
      l.moveTo(a.x, a.y);
      l.lineTo(b.x, b.y);
    }
    l.lineStyle(0);
  }

  hitConst(group, star, gp) {
    if (star.caught || group.dead || !this.running) return;
    star.caught = true;
    group.caught++;
    this.drawConstStar(star);
    this.drawConstLines(group);
    Sfx.note(Math.min(3, group.caught - 1));
    sparkleBurst(gp.x, gp.y, { n: 10, colors: [0xbfe8ff, 0xffffff, 0xffe08a] });
    this.addScore(15, gp.x, gp.y);
    if (group.caught === group.stars.length) {
      group.dead = true;
      const bonus = group.stars.length * 30; // 120 or 150
      Sfx.fanfare();
      const cx = group.c.x, cy = group.c.y;
      this.addScore(bonus);
      floatText(cx, cy - 50, `CONSTELLATION! +${bonus}`, { size: 28, fill: 0xffe08a, stroke: 0x2d2350, dur: 1500 });
      for (const st of group.stars) sparkleBurst(cx + st.x, cy + st.y, { n: 12, colors: [0xffd35c, 0xffffff, 0xbfe8ff], power: 1.2 });
      tween(group.c.scale, { x: 1.25, y: 1.25 }, 380, { ease: Ease.quadOut });
      tween(group.c, { alpha: 0 }, 420, { onDone: () => !group.c.destroyed && group.c.destroy({ children: true }) });
    }
  }

  // ---------------- shooting stars ----------------
  spawnShooter() {
    const { W, H } = this;
    const fromLeft = Math.random() < 0.5;
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    // glowing tail (drawn pointing back along -x)
    for (let i = 0; i < 4; i++) {
      g.beginFill(i % 2 ? 0xffffff : 0xffe08a, 0.42 - i * 0.08);
      g.drawPolygon([0, -9 + i * 2, 0, 9 - i * 2, -70 - i * 24, 0]);
      g.endFill();
    }
    g.beginFill(0xfff3b0, 0.4);
    g.drawCircle(0, 0, 30);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawPolygon(starPoints(0, 0, 5, 22, 10));
    g.endFill();
    g.lineStyle({ width: 3, color: 0xffb41a });
    g.drawPolygon(starPoints(0, 0, 5, 22, 10));
    g.lineStyle(0);
    c.addChild(g);
    const speed = rand(5.2, 6.4) + (45000 - this.timeLeft) / 30000;
    const vx = (fromLeft ? 1 : -1) * speed;
    const vy = speed * rand(0.28, 0.42);
    c.rotation = Math.atan2(vy, vx);
    c.position.set(fromLeft ? -40 : W + 40, rand(90, H * 0.42));
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.hitArea = new PIXI.Circle(0, 0, 46); // generous: it moves fast
    const sh = { c, vx, vy, dead: false };
    c.on('pointerdown', (e) => {
      if (sh.dead || !this.running) return;
      sh.dead = true;
      const gp = G.ev(e);
      Sfx.perfect(); Sfx.sparkle();
      sparkleBurst(gp.x, gp.y, { n: 22, colors: [0xffffff, 0xffe08a, 0xfff3b0], power: 1.4 });
      this.addScore(75, gp.x, gp.y);
      floatText(gp.x, gp.y - 46, 'SHOOTING STAR!', { size: 20, fill: 0xffe08a, stroke: 0x2d2350 });
      tween(c, { alpha: 0 }, 150, { onDone: () => !c.destroyed && c.destroy({ children: true }) });
    });
    this.shooters.push(sh);
    this.playLayer.addChild(c);
    Sfx.whoosh();
  }

  tick(ms) {
    const k = ms / 16.667;
    this.constT -= ms;
    if (this.constT <= 0 && this.timeLeft > 6000) {
      this.spawnConstellation();
      this.constT = rand(9000, 12000);
    }
    this.shootT -= ms;
    if (this.shootT <= 0 && this.timeLeft > 2500) {
      this.spawnShooter();
      this.shootT = rand(5500, 8500);
    }
    for (let i = this.groups.length - 1; i >= 0; i--) {
      const gr = this.groups[i];
      if (gr.dead || gr.c.destroyed) { this.groups.splice(i, 1); continue; }
      gr.c.y += gr.vy * k;
      if (gr.c.y > this.H - 60) {
        gr.dead = true;
        floatText(gr.c.x, this.H - 70, `${gr.caught}/${gr.stars.length} — so close!`, { size: 18, fill: 0xbfe8ff, stroke: 0x2d2350 });
        tween(gr.c, { alpha: 0 }, 250, { onDone: () => !gr.c.destroyed && gr.c.destroy({ children: true }) });
        this.groups.splice(i, 1);
      }
    }
    for (let i = this.shooters.length - 1; i >= 0; i--) {
      const sh = this.shooters[i];
      if (sh.dead || sh.c.destroyed) { this.shooters.splice(i, 1); continue; }
      sh.c.x += sh.vx * k;
      sh.c.y += sh.vy * k;
      if (sh.c.x < -120 || sh.c.x > this.W + 120) { sh.c.destroy({ children: true }); this.shooters.splice(i, 1); }
    }
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
    for (const gr of this.groups) if (!gr.c.destroyed) gr.c.destroy({ children: true });
    for (const sh of this.shooters) if (!sh.c.destroyed) sh.c.destroy({ children: true });
    this.groups = [];
    this.shooters = [];
  }
}
