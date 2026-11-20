// Style Rush: "Find the Ruby Heels!" — tap the right item in the grid
// before the timer melts. Streaks make it faster and worth more.

import { MinigameScene } from '../minigame.js';
import { G } from '../../game.js';
import { makeIcon } from '../../ui.js';
import { sparkleBurst, floatText, shake } from '../../effects.js';
import { tween, Ease } from '../../tween.js';
import { Sfx } from '../../sound.js';
import { shuffle, rand, choice, darken } from '../../util.js';

const STYLES = [
  { icon: 'heart', name: 'Sweet Heart', color: 0xff5f9e },
  { icon: 'bow', name: 'Cherry Bow', color: 0xe0596d },
  { icon: 'shoe', name: 'Ruby Heels', color: 0xd1274b },
  { icon: 'bag', name: 'Star Bag', color: 0xf5a91a },
  { icon: 'gem', name: 'Ocean Gem', color: 0x5ba8ec },
  { icon: 'crown', name: 'Royal Crown', color: 0xf5a91a },
  { icon: 'flower', name: 'Daisy Bloom', color: 0xff8fc7 },
  { icon: 'butterfly', name: 'Flutter Wing', color: 0xa66ae0 },
  { icon: 'lip', name: 'Kiss Gloss', color: 0xd1274b },
  { icon: 'star', name: 'Lucky Star', color: 0xffd35c },
  { icon: 'dress', name: 'Dream Dress', color: 0xff5f9e },
  { icon: 'wand', name: 'Magic Wand', color: 0xffd35c },
];

export class StyleMatchScene extends MinigameScene {
  constructor(p) {
    super(p);
    this.id = 'stylematch';
    this.title = 'Style Rush';
    this.icon = 'eye';
    this.howTo = 'The boutique wants ONE item — read the name, find it in the display and tap it fast! Wrong picks cost points.';
    this.duration = 45000;
    this.coinRate = 0.3;
    this.bgTop = 0xd8f7e8;
    this.bgBot = 0x9edec4;
  }

  setup(W, H) {
    this.streak = 0;
    this.roundStart = 0;
    // prompt ribbon
    const rib = new PIXI.Graphics();
    const rw = Math.min(W - 30, 420);
    rib.beginFill(0x2f9e57, 0.85);
    rib.drawRoundedRect(-rw / 2, -34, rw, 68, 34);
    rib.endFill();
    rib.lineStyle({ width: 3, color: 0xffffff, alpha: 0.8 });
    rib.drawRoundedRect(-rw / 2, -34, rw, 68, 34);
    rib.lineStyle(0);
    const ribbon = new PIXI.Container();
    ribbon.addChild(rib);
    this.promptText = new PIXI.Text('', {
      fontFamily: 'GameFont', fontSize: 24, fontWeight: '900',
      fill: 0xffffff, stroke: 0x1a6a38, strokeThickness: 5,
    });
    this.promptText.anchor.set(0.5);
    ribbon.addChild(this.promptText);
    ribbon.position.set(W / 2, 106);
    this.playLayer.addChild(ribbon);
    this.ribbon = ribbon;

    this.grid = new PIXI.Container();
    this.playLayer.addChild(this.grid);
  }

  begin() { this.newRound(true); }

  newRound(first = false) {
    const { W, H } = this;
    this.grid.removeChildren().forEach((c) => c.destroy({ children: true }));
    const n = Math.min(12, 6 + Math.floor(this.streak / 3)); // grid grows with streak
    const styles = shuffle(STYLES).slice(0, n);
    this.target = choice(styles);
    this.promptText.text = 'Find the ' + this.target.name + '!';
    tween(this.ribbon.scale, { x: 1.06, y: 1.06 }, 140, { onDone: () => tween(this.ribbon.scale, { x: 1, y: 1 }, 200) });
    this.roundStart = performance.now();

    const cols = W > H ? 4 : 3;
    const rows = Math.ceil(n / cols);
    const areaTop = 150;
    const areaH = H - areaTop - 20;
    const cs = Math.min((Math.min(W - 20, 520) - 12 * (cols - 1)) / cols, (areaH - 12 * (rows - 1)) / rows, 130);
    const gw = cols * cs + (cols - 1) * 12;
    const gh = rows * cs + (rows - 1) * 12;
    const ox = (W - gw) / 2 + cs / 2;
    const oy = areaTop + Math.max(0, (areaH - gh) / 2) + cs / 2;

    shuffle(styles).forEach((st, i) => {
      const c = new PIXI.Container();
      const g = new PIXI.Graphics();
      g.beginFill(0xffffff, 0.95);
      g.drawRoundedRect(-cs / 2, -cs / 2, cs, cs, 16);
      g.endFill();
      g.lineStyle({ width: 3, color: 0xbfe0cd });
      g.drawRoundedRect(-cs / 2, -cs / 2, cs, cs, 16);
      g.lineStyle(0);
      c.addChild(g);
      const ic = makeIcon(st.icon, cs * 0.52, st.color);
      c.addChild(ic);
      c.position.set(ox + (i % cols) * (cs + 12), oy + Math.floor(i / cols) * (cs + 12));
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', (e) => this.pick(st, c, G.ev(e)));
      this.grid.addChild(c);
      c.scale.set(0);
      tween(c.scale, { x: 1, y: 1 }, 260, { delay: i * 35, ease: Ease.backOut });
    });
  }

  pick(st, card, gp) {
    if (!this.running) return;
    if (st.icon === this.target.icon) {
      const reactMs = performance.now() - this.roundStart;
      const speedBonus = Math.max(0, Math.round(30 - reactMs / 100));
      this.streak++;
      const pts = 25 + speedBonus + Math.min(25, this.streak * 2);
      Sfx.match();
      sparkleBurst(gp.x, gp.y, { n: 12, colors: [0xffffff, st.color, 0xffe08a] });
      this.addScore(pts, gp.x, gp.y);
      if (reactMs < 1500) floatText(gp.x, gp.y - 44, 'FAST! ⚡', { size: 20, fill: 0xffe08a, stroke: 0x1a6a38 });
      this.newRound();
    } else {
      this.streak = 0;
      Sfx.bad();
      shake(card, 7, 250);
      this.addScore(-10, gp.x, gp.y);
    }
  }

  tick(ms) {}
}
