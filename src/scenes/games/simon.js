// Encore: four gems twinkle in a sequence — repeat it!
// Each round adds a gem. Three slips and the show is over.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { sparkleBurst, floatText } from '../../effects.js';
import { tween, Ease, delay } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { randi, drawDiamond, drawHeart, lighten, darken } from '../../util.js';

const GEMS = [
  { color: 0xff5f9e, pos: [0, -1] },
  { color: 0xa66ae0, pos: [-1, 0] },
  { color: 0x5ba8ec, pos: [1, 0] },
  { color: 0xffd35c, pos: [0, 1] },
];

export class SimonScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'simon';
    this.title = 'Encore';
    this.icon = 'simon';
    this.howTo = 'Watch the gems light up, then tap them back in the same order. Every round adds one more sparkle. You have 3 lives (top of the screen). Keys: arrows or 1-4.';
    this.duration = 0;
    this.coinRate = 0.4;
    this.bgTop = 0xfbe6d8;
    this.bgBot = 0xf5c8b8;
  }

  setup(W, H) {
    this.seq = [];
    this.input = 0;
    this.lives = 3;
    this.round = 0;
    this.acceptInput = false;
    this.timerText.text = '';

    // Fit all four gems between the status line and the bottom edge, even on
    // sideways phones where the screen is very short.
    const top = 112, avail = H - top - 10;
    let spread = Math.min(W, H) * 0.21;
    let size = Math.min(W, H) * 0.16;
    const need = 2 * (spread * 1.35 + size * 1.25);
    const fitK = Math.min(1, avail / need);
    spread *= fitK; size *= fitK;
    const cx = W / 2, cy = fitK < 1 ? top + avail / 2 : H / 2 + 34;
    this.gems = GEMS.map((gem, i) => {
      const c = new PIXI.Container();
      const g = new PIXI.Graphics();
      g.beginFill(darken(gem.color, 0.35));
      drawDiamond(g, 0, 4, size);
      g.endFill();
      g.beginFill(gem.color);
      drawDiamond(g, 0, 0, size);
      g.endFill();
      g.beginFill(lighten(gem.color, 0.45), 0.9);
      g.drawPolygon([0, -size, size * 0.32, -size * 0.22, 0, 0, -size * 0.32, -size * 0.22]);
      g.endFill();
      c.addChild(g);
      const lit = new PIXI.Graphics();
      lit.beginFill(0xffffff, 0.85);
      drawDiamond(lit, 0, 0, size);
      lit.endFill();
      lit.alpha = 0;
      c.addChild(lit);
      c.lit = lit;
      c.position.set(cx + gem.pos[0] * spread * 1.7, cy + gem.pos[1] * spread * 1.35);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', () => this.tapGem(i));
      this.playLayer.addChild(c);
      return c;
    });

    // status text + hearts
    this.statusText = new PIXI.Text('', {
      fontFamily: 'GameFont', fontSize: 26, fontWeight: '900',
      fill: 0xc2447c, stroke: 0xffffff, strokeThickness: 5,
    });
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(W / 2, 92);
    this.playLayer.addChild(this.statusText);

    // lives sit in the dark score bar, well away from the gems, in red with a
    // white rim so they can never be mistaken for the pink gem
    this.heartsC = new PIXI.Container();
    this.heartsC.position.set(this.headerSlot.x, this.headerSlot.y);
    this.head.addChild(this.heartsC);
    this.drawHearts();

    // desktop keys: arrows match gem positions, or 1-4
    this.bindKeys({
      ArrowUp: () => this.tapGem(0), ArrowLeft: () => this.tapGem(1),
      ArrowRight: () => this.tapGem(2), ArrowDown: () => this.tapGem(3),
      1: () => this.tapGem(0), 2: () => this.tapGem(1), 3: () => this.tapGem(2), 4: () => this.tapGem(3),
    });
  }

  drawHearts() {
    this.heartsC.removeChildren().forEach((c) => c.destroy());
    for (let i = 0; i < 3; i++) {
      const alive = i < this.lives;
      const h = new PIXI.Graphics();
      h.beginFill(0xffffff, alive ? 1 : 0.35); drawHeart(h, 0, 0, 12); h.endFill();
      h.beginFill(alive ? 0xe8263f : 0x5a1f3c); drawHeart(h, 0, 0, 9.5); h.endFill();
      if (alive) { h.beginFill(0xffffff, 0.7); h.drawCircle(-3.5, -3.5, 2.4); h.endFill(); }
      h.x = (i - 1) * 28;
      this.heartsC.addChild(h);
    }
  }

  begin() {
    delay(400, () => this.nextRound());
  }

  gone() { return !this.root || this.root.destroyed || this.gems.some((g) => g.destroyed); }

  nextRound() {
    if (!this.running || this.gone()) return;
    this.round++;
    this.seq.push(randi(0, 3));
    this.input = 0;
    this.statusText.text = 'Round ' + this.round + ' — watch!';
    this.playSeq(0);
  }

  playSeq(i) {
    if (!this.running || this.gone()) return;
    this.acceptInput = false;
    if (i >= this.seq.length) {
      this.statusText.text = 'Your turn!';
      this.acceptInput = true;
      return;
    }
    const speed = Math.max(260, 620 - this.round * 30);
    delay(speed * 0.55, () => {
      this.light(this.seq[i]);
      delay(speed, () => this.playSeq(i + 1));
    });
  }

  light(i, good = true) {
    if (this.gone()) return;
    const gem = this.gems[i];
    Sfx.note(i);
    gem.lit.alpha = 0.9;
    tween(gem.lit, { alpha: 0 }, 320, { ease: Ease.quadOut });
    tween(gem.scale, { x: 1.15, y: 1.15 }, 120, { onDone: () => tween(gem.scale, { x: 1, y: 1 }, 200, { ease: Ease.backOut }) });
    if (good) {
      const gp = G.pt(gem.getGlobalPosition());
      sparkleBurst(gp.x, gp.y, { n: 6, colors: [0xffffff, GEMS[i].color] });
    }
  }

  tapGem(i) {
    if (!this.running || !this.acceptInput) return;
    if (i === this.seq[this.input]) {
      this.light(i);
      this.input++;
      if (this.input >= this.seq.length) {
        this.acceptInput = false;
        const pts = 20 + this.round * 15;
        this.addScore(pts, this.W / 2, this.H / 2 - 60);
        Sfx.match();
        this.statusText.text = 'Perfect! ✨';
        delay(900, () => this.nextRound());
      }
    } else {
      this.lives--;
      this.drawHearts();
      Sfx.bad();
      const gem = this.gems[this.seq[this.input]];
      // show which one it should have been
      tween(gem, { alpha: 0.4 }, 150, { yoyo: false, onDone: () => tween(gem, { alpha: 1 }, 250) });
      floatText(this.W / 2, this.H / 2, 'oops!', { size: 30, fill: 0xffb0b0, stroke: 0x8a2030 });
      if (this.lives <= 0) {
        this.acceptInput = false;
        this.statusText.text = '';
        delay(700, () => this.finish());
      } else {
        this.acceptInput = false;
        this.statusText.text = 'Watch again!';
        this.input = 0;
        delay(1000, () => this.playSeq(0));
      }
    }
  }

  tick(ms) {}
}
