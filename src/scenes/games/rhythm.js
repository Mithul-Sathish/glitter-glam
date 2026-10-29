// Runway Rhythm: hearts, stars and gems slide down three lanes —
// tap the lane pad when they reach the glowing bar. Perfect timing = big combo.

import { MinigameScene } from '../minigame.js';
import { makeIcon } from '../../ui.js';
import { sparkleBurst, floatText } from '../../effects.js';
import { tween, Ease } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { rand, randi } from '../../util.js';

const LANES = [
  { icon: 'heart', color: 0xff5f9e },
  { icon: 'star', color: 0xf5a91a },
  { icon: 'gem', color: 0x5ba8ec },
];

export class RhythmScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'rhythm';
    this.title = 'Runway Rhythm';
    this.icon = 'note';
    this.howTo = 'Tap each lane\'s button exactly when a charm lands on the glowing bar. Perfect taps build a shiny combo!';
    this.duration = 45000;
    this.coinRate = 0.26;
    this.bgTop = 0x3a2a5e;
    this.bgBot = 0x8a4a8e;
  }

  setup(W, H) {
    this.notes = [];
    this.spawnT = 0;
    this.combo = 0;
    this.hitY = H - 150;
    this.travelMs = 1800;
    const laneW = Math.min(110, (W - 40) / 3);
    this.laneX = [W / 2 - laneW - 8, W / 2, W / 2 + laneW + 8].map((x) => x);
    this.laneW = laneW;

    // runway lanes
    const g = new PIXI.Graphics();
    this.laneX.forEach((x) => {
      g.beginFill(0xffffff, 0.08);
      g.drawRoundedRect(x - laneW / 2, 70, laneW, this.hitY - 40, 16);
      g.endFill();
    });
    // hit bar
    g.beginFill(0xffffff, 0.25);
    g.drawRoundedRect(this.laneX[0] - laneW / 2, this.hitY - 8, laneW * 3 + 16 * 2 + (this.laneX[2] - this.laneX[0] - 2 * laneW - 16), 16, 8);
    g.endFill();
    g.lineStyle({ width: 3, color: 0xffe08a, alpha: 0.9 });
    g.drawRoundedRect(this.laneX[0] - laneW / 2 - 4, this.hitY - 12, this.laneX[2] + laneW / 2 + 4 - (this.laneX[0] - laneW / 2 - 4), 24, 12);
    g.lineStyle(0);
    this.playLayer.addChild(g);

    // lane pads
    this.pads = LANES.map((lane, i) => {
      const pad = new PIXI.Container();
      const pg = new PIXI.Graphics();
      pg.beginFill(lane.color);
      pg.drawCircle(0, 0, Math.min(44, laneW * 0.42));
      pg.endFill();
      pg.beginFill(0xffffff, 0.3);
      pg.drawEllipse(0, -10, 26, 12);
      pg.endFill();
      pg.lineStyle({ width: 3, color: 0xffffff, alpha: 0.9 });
      pg.drawCircle(0, 0, Math.min(44, laneW * 0.42));
      pg.lineStyle(0);
      pad.addChild(pg);
      const ic = makeIcon(lane.icon, 34, 0xffffff);
      pad.addChild(ic);
      pad.position.set(this.laneX[i], H - 78);
      pad.eventMode = 'static';
      pad.cursor = 'pointer';
      pad.on('pointerdown', () => this.tapLane(i));
      this.playLayer.addChild(pad);
      return pad;
    });

    this.comboText = new PIXI.Text('', {
      fontFamily: 'GameFont', fontSize: 26, fontWeight: '900',
      fill: 0xffe08a, stroke: 0x5a1f3c, strokeThickness: 5,
    });
    this.comboText.anchor.set(0.5);
    this.comboText.position.set(W / 2, 92);
    this.playLayer.addChild(this.comboText);

    // desktop keys: arrows or D/F/J or 1/2/3
    this.bindKeys({
      ArrowLeft: () => this.tapLane(0), ArrowDown: () => this.tapLane(1), ArrowRight: () => this.tapLane(2),
      d: () => this.tapLane(0), f: () => this.tapLane(1), j: () => this.tapLane(2),
      1: () => this.tapLane(0), 2: () => this.tapLane(1), 3: () => this.tapLane(2),
    });
    const keyHint = new PIXI.Text('⌨ arrows or D · F · J', {
      fontFamily: 'GameFont', fontSize: 13, fontWeight: '700', fill: 0xffffff, stroke: 0x5a1f3c, strokeThickness: 3,
    });
    keyHint.anchor.set(0.5);
    keyHint.alpha = 0.65;
    keyHint.position.set(W / 2, H - 18);
    this.playLayer.addChild(keyHint);
  }

  begin() { this.spawnT = 500; }

  spawn() {
    const lane = randi(0, 2);
    const c = new PIXI.Container();
    const glow = new PIXI.Graphics();
    glow.beginFill(LANES[lane].color, 0.35);
    glow.drawCircle(0, 0, 34);
    glow.endFill();
    c.addChild(glow);
    const ic = makeIcon(LANES[lane].icon, 44, LANES[lane].color);
    c.addChild(ic);
    c.position.set(this.laneX[lane], 60);
    this.playLayer.addChild(c);
    this.notes.push({ c, lane, t: 0, judged: false });
  }

  tapLane(i) {
    if (!this.running) return;
    const pad = this.pads[i];
    tween(pad.scale, { x: 0.85, y: 0.85 }, 60, { onDone: () => tween(pad.scale, { x: 1, y: 1 }, 160, { ease: Ease.backOut }) });
    // nearest unjudged note in lane
    let bestNote = null, bestDist = 1e9;
    for (const n of this.notes) {
      if (n.judged || n.lane !== i) continue;
      const d = Math.abs(n.c.y - this.hitY);
      if (d < bestDist) { bestDist = d; bestNote = n; }
    }
    if (!bestNote || bestDist > 90) {
      Sfx.miss();
      this.combo = 0;
      this.comboText.text = '';
      this.addScore(-2, this.laneX[i], this.hitY - 30);
      return;
    }
    bestNote.judged = true;
    const gp = { x: this.laneX[i], y: this.hitY };
    let pts, label, color;
    if (bestDist < 26) {
      this.combo++;
      pts = 30; label = 'PERFECT'; color = 0xffe08a;
      Sfx.perfect();
      sparkleBurst(gp.x, gp.y, { n: 14, colors: [0xffe08a, 0xffffff, LANES[i].color] });
    } else if (bestDist < 55) {
      this.combo++;
      pts = 15; label = 'good'; color = 0xbef0d8;
      Sfx.good();
      sparkleBurst(gp.x, gp.y, { n: 7 });
    } else {
      this.combo = 0;
      pts = 5; label = 'ok'; color = 0xdddddd;
      Sfx.tap();
    }
    const mult = 1 + Math.min(4, Math.floor(this.combo / 8));
    this.addScore(pts * mult);
    floatText(gp.x, gp.y - 40, label, { size: 24, fill: color, stroke: 0x5a1f3c });
    this.comboText.text = this.combo >= 4 ? `${this.combo} combo ×${mult}` : '';
    tween(bestNote.c.scale, { x: 1.6, y: 1.6 }, 140);
    tween(bestNote.c, { alpha: 0 }, 140, { onDone: () => !bestNote.c.destroyed && bestNote.c.destroy() });
  }

  tick(ms) {
    this.spawnT -= ms;
    const speedUp = (45000 - this.timeLeft) / 45000; // 0..1
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (900 - speedUp * 430) * rand(0.8, 1.25);
    }
    this.travelMs = 1800 - speedUp * 500;
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (n.c.destroyed) { this.notes.splice(i, 1); continue; }
      n.t += ms;
      n.c.y = 60 + (this.hitY - 60) * (n.t / this.travelMs);
      if (!n.judged && n.c.y > this.hitY + 70) {
        n.judged = true;
        this.combo = 0;
        this.comboText.text = '';
        Sfx.miss();
        floatText(n.c.x, this.hitY, 'miss', { size: 20, fill: 0xffb0b0, stroke: 0x5a1f3c });
        tween(n.c, { alpha: 0 }, 200, { onDone: () => !n.c.destroyed && n.c.destroy() });
      }
      if (n.t > this.travelMs + 600) {
        if (!n.c.destroyed) n.c.destroy();
        this.notes.splice(i, 1);
      }
    }
  }

  cleanup() {
    for (const n of this.notes) if (!n.c.destroyed) n.c.destroy();
    this.notes = [];
  }
}
