// Memory Match: flip cards, find fashion pairs. Faster clears score higher.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { makeIcon } from '../../ui.js';
import { sparkleBurst, floatText } from '../../effects.js';
import { tween, Ease, delay } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { shuffle, darken } from '../../util.js';

const FACES = [
  ['heart', 0xff5f9e], ['bow', 0xe0596d], ['shoe', 0xd1274b], ['bag', 0xf5a91a],
  ['gem', 0x5ba8ec], ['crown', 0xf5a91a], ['flower', 0xff8fc7], ['butterfly', 0xa66ae0],
  ['lip', 0xd1274b], ['star', 0xffd35c],
];

export class MemoryScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'memory';
    this.title = 'Memory Match';
    this.icon = 'cards';
    this.howTo = 'Flip two cards at a time and find all 8 matching pairs. The faster you are, the bigger your sparkle bonus!';
    this.duration = 0; // untimed — ends when all pairs found
    this.coinRate = 0.35;
    this.bgTop = 0xffe8f2;
    this.bgBot = 0xf6c4e0;
  }

  setup(W, H) {
    this.elapsed = 0;
    this.flipped = [];
    this.lock = false;
    this.matched = 0;
    this.timerText.text = '';
    const pairs = 8;
    const faces = shuffle(FACES).slice(0, pairs);
    const deck = shuffle([...faces, ...faces].map((f, i) => ({ face: f, key: f[0] })));

    // fit a 4x4 grid
    const cols = 4, rows = 4;
    const pad = 10;
    const availW = Math.min(W - 24, 520);
    const availH = H - 160;
    const cs = Math.min((availW - pad * (cols - 1)) / cols, (availH - pad * (rows - 1)) / rows, 118);
    const gw = cols * cs + (cols - 1) * pad;
    const gh = rows * cs + (rows - 1) * pad;
    const ox = (W - gw) / 2 + cs / 2;
    const oy = 90 + Math.max(0, (availH - gh) / 2) + cs / 2;

    this.cards = deck.map((d, i) => {
      const c = this.makeCard(d, cs);
      c.position.set(ox + (i % cols) * (cs + pad), oy + Math.floor(i / cols) * (cs + pad));
      this.playLayer.addChild(c);
      c.scale.set(0);
      tween(c.scale, { x: 1, y: 1 }, 350, { delay: i * 45, ease: Ease.backOut });
      return c;
    });
  }

  makeCard(d, cs) {
    const c = new PIXI.Container();
    const backC = new PIXI.Container();
    const back = new PIXI.Graphics();
    back.beginFill(0xc2447c);
    back.drawRoundedRect(-cs / 2, -cs / 2, cs, cs, 14);
    back.endFill();
    back.beginFill(0xd8619a);
    back.drawRoundedRect(-cs / 2 + 5, -cs / 2 + 5, cs - 10, cs - 10, 10);
    back.endFill();
    backC.addChild(back);
    const backIc = makeIcon('sparkle', cs * 0.34, 0xf3a8cc);
    backC.addChild(backIc);
    c.addChild(backC);

    const faceC = new PIXI.Container();
    const face = new PIXI.Graphics();
    face.beginFill(0xffffff);
    face.drawRoundedRect(-cs / 2, -cs / 2, cs, cs, 14);
    face.endFill();
    face.lineStyle({ width: 3, color: 0xf3c8e2 });
    face.drawRoundedRect(-cs / 2, -cs / 2, cs, cs, 14);
    face.lineStyle(0);
    faceC.addChild(face);
    const ic = makeIcon(d.face[0], cs * 0.5, d.face[1]);
    faceC.addChild(ic);
    faceC.visible = false;
    c.addChild(faceC);

    c.meta = { key: d.key, open: false, done: false, backC, faceC, cs };
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerdown', () => this.flip(c));
    return c;
  }

  flip(c) {
    if (!this.running || this.lock || c.meta.open || c.meta.done) return;
    Sfx.flip();
    c.meta.open = true;
    this.animFlip(c, true);
    this.flipped.push(c);
    if (this.flipped.length === 2) {
      this.lock = true;
      const [a, b] = this.flipped;
      delay(a.meta.key === b.meta.key ? 260 : 700, () => {
        if (a.meta.key === b.meta.key) {
          a.meta.done = b.meta.done = true;
          this.matched++;
          Sfx.match();
          for (const cc of [a, b]) {
            const gp = G.pt(cc.getGlobalPosition());
            sparkleBurst(gp.x, gp.y, { n: 10 });
            tween(cc.scale, { x: 1.15, y: 1.15 }, 150, { onDone: () => tween(cc.scale, { x: 1, y: 1 }, 200, { ease: Ease.backOut }) });
          }
          const gp = G.pt(b.getGlobalPosition());
          this.addScore(60, gp.x, gp.y);
          if (this.matched === 8) {
            // time bonus: full clear under 30s keeps most of it
            const bonus = Math.max(0, Math.round(420 - this.elapsed / 100));
            if (bonus > 0) {
              this.addScore(bonus);
              floatText(this.W / 2, this.H / 2 - 40, `Speed bonus +${bonus}!`, { size: 30, fill: 0xffe08a });
            }
            delay(700, () => this.finish());
          }
        } else {
          Sfx.miss();
          a.meta.open = b.meta.open = false;
          this.animFlip(a, false);
          this.animFlip(b, false);
          this.addScore(-5);
        }
        this.flipped = [];
        this.lock = false;
      });
    }
  }

  animFlip(c, toFace) {
    tween(c.scale, { x: 0.02 }, 120, {
      ease: Ease.quadIn,
      onDone: () => {
        if (c.destroyed) return;
        c.meta.backC.visible = !toFace;
        c.meta.faceC.visible = toFace;
        tween(c.scale, { x: 1 }, 140, { ease: Ease.quadOut });
      },
    });
  }

  tick(ms) {
    this.elapsed += ms;
    this.timerText.text = (this.elapsed / 1000).toFixed(0) + 's';
  }
}
