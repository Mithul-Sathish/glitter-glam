// Shared minigame scaffolding: intro card, 3-2-1 countdown, score/timer header,
// results panel with coin payout flying into the HUD.

import { G } from '../game.js';
import { save, earnCoins, recordScore, level } from '../save.js';
import { makeButton, makeHUD, makeBackground, makePanel, makeIcon, iconButton, textStyle, PALETTE } from '../ui.js';
import { sparkleBurst, coinFly, confetti, floatText } from '../effects.js';
import { tween, Ease, delay } from '../tween.js';
import { Sfx } from '../sound.js';
import { fmt } from '../util.js';

export class MinigameScene {
  // subclasses set: id, title, icon, howTo, duration (ms, 0 = untimed), coinRate
  constructor(params) {
    this.params = params;
    this.resizeMode = 'scale'; // don't rebuild mid-run on rotate
    this.score = 0;
    this.running = false;
    this.timeLeft = this.duration || 0;
  }

  build(W, H) {
    this.W = W; this.H = H;
    const r = this.root;
    r.addChild(makeBackground(W, H, this.bgTop || 0xdff0ff, this.bgBot || 0xc3ddfb, 0xffffff));

    this.playLayer = new PIXI.Container();
    r.addChild(this.playLayer);

    // header
    const head = new PIXI.Container();
    const pw2 = Math.min(300, W - 140);
    const px = W / 2 - 34; // shifted left so the close button never overlaps
    const hg = new PIXI.Graphics();
    hg.beginFill(0x8a3060, 0.8);
    hg.drawRoundedRect(px - pw2 / 2, 8, pw2, 52, 26);
    hg.endFill();
    head.addChild(hg);
    this.scoreText = new PIXI.Text('0', textStyle(26, 0xffffff, 0x5a1f3c, 4));
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(px - pw2 * 0.13, 34);
    head.addChild(this.scoreText);
    const starIc = makeIcon('star', 26);
    starIc.position.set(px - pw2 * 0.36, 34);
    head.addChild(starIc);
    this.timerText = new PIXI.Text(this.duration ? Math.ceil(this.duration / 1000) : '', textStyle(26, 0xffe08a, 0x5a1f3c, 4));
    this.timerText.anchor.set(0.5);
    this.timerText.position.set(px + pw2 * 0.28, 34);
    head.addChild(this.timerText);
    r.addChild(head);

    const back = iconButton('close', 48, PALETTE.pink, async () => {
      const { GameHubScene } = await import('./gamehub.js');
      G.go(GameHubScene);
    });
    back.position.set(W - 38, 34);
    r.addChild(back);

    this.setup(W, H); // subclass builds its board (paused state)
    this.showIntro();
  }

  showIntro() {
    const { W, H } = this;
    const ov = new PIXI.Container();
    const dim = new PIXI.Graphics();
    dim.beginFill(0x50104a, 0.5);
    dim.drawRect(0, 0, W, H);
    dim.endFill();
    dim.eventMode = 'static';
    ov.addChild(dim);
    const pw = Math.min(400, W - 30);
    const panel = makePanel(pw, 330, { border: PALETTE.pink });
    panel.position.set(W / 2, H / 2);
    ov.addChild(panel);
    const icon = makeIcon(this.icon, 64);
    icon.position.set(W / 2, H / 2 - 118);
    ov.addChild(icon);
    const t = new PIXI.Text(this.title, textStyle(30, PALETTE.pink, 0xffffff, 0));
    t.anchor.set(0.5);
    t.position.set(W / 2, H / 2 - 66);
    ov.addChild(t);
    const how = new PIXI.Text(this.howTo, {
      ...textStyle(18, PALETTE.text, 0xffffff, 0),
      fontWeight: '600',
      wordWrap: true,
      wordWrapWidth: pw - 60,
      lineHeight: 26,
    });
    how.anchor.set(0.5);
    how.position.set(W / 2, H / 2 + 8);
    ov.addChild(how);
    const best = save.best[this.id];
    if (best) {
      const bt = new PIXI.Text('Best: ' + fmt(best), textStyle(17, PALETTE.purple, 0xffffff, 0));
      bt.anchor.set(0.5);
      bt.position.set(W / 2, H / 2 + 72);
      ov.addChild(bt);
    }
    const go = makeButton("Let's go!", {
      w: 200, h: 62, color: PALETTE.mint,
      onTap: () => {
        tween(ov, { alpha: 0 }, 200, { onDone: () => { ov.destroy({ children: true }); this.countdown(); } });
      },
    });
    go.position.set(W / 2, H / 2 + 128);
    ov.addChild(go);
    ov.alpha = 0;
    tween(ov, { alpha: 1 }, 250);
    panel.scale.set(0.7);
    tween(panel.scale, { x: 1, y: 1 }, 380, { ease: Ease.backOut });
    this.root.addChild(ov);
  }

  countdown() {
    const { W, H } = this;
    let n = 3;
    const show = () => {
      if (n === 0) {
        const t = new PIXI.Text('GO!', textStyle(90, 0xffe08a, 0xc2447c, 10));
        t.anchor.set(0.5);
        t.position.set(W / 2, H / 2);
        this.root.addChild(t);
        Sfx.go();
        tween(t.scale, { x: 1.6, y: 1.6 }, 400, { ease: Ease.quadOut });
        tween(t, { alpha: 0 }, 400, { onDone: () => !t.destroyed && t.destroy() });
        this.running = true;
        this.timeLeft = this.duration || 0;
        this.begin();
        return;
      }
      const t = new PIXI.Text(String(n), textStyle(110, 0xffffff, 0xc2447c, 12));
      t.anchor.set(0.5);
      t.position.set(W / 2, H / 2);
      t.scale.set(0.3);
      this.root.addChild(t);
      Sfx.countdown();
      tween(t.scale, { x: 1, y: 1 }, 500, { ease: Ease.backOut });
      tween(t, { alpha: 0 }, 300, { delay: 480, onDone: () => !t.destroyed && t.destroy() });
      n--;
      delay(780, show);
    };
    show();
  }

  addScore(n, x, y) {
    this.score = Math.max(0, this.score + n);
    this.scoreText.text = fmt(this.score);
    tween(this.scoreText.scale, { x: 1.25, y: 1.25 }, 90, {
      ease: Ease.quadOut,
      onDone: () => tween(this.scoreText.scale, { x: 1, y: 1 }, 150),
    });
    if (x !== undefined) {
      floatText(x, y, (n > 0 ? '+' : '') + n, {
        size: 26,
        fill: n > 0 ? 0xffffff : 0xffb0b0,
        stroke: n > 0 ? 0xc2447c : 0x8a2030,
      });
    }
  }

  update(ms) {
    if (this.running && this.duration) {
      this.timeLeft -= ms;
      const s = Math.max(0, Math.ceil(this.timeLeft / 1000));
      if (String(s) !== this.timerText.text) {
        this.timerText.text = String(s);
        if (s <= 5 && s > 0) {
          Sfx.tick();
          this.timerText.style.fill = s <= 3 ? 0xff8080 : 0xffe08a;
          tween(this.timerText.scale, { x: 1.3, y: 1.3 }, 100, { onDone: () => tween(this.timerText.scale, { x: 1, y: 1 }, 160) });
        }
      }
      if (this.timeLeft <= 0) {
        this.running = false;
        this.finish();
        return;
      }
    }
    if (this.running) this.tick(ms);
  }

  finish() {
    if (!this.root || this.root.destroyed || this.finished) return;
    this.finished = true;
    this.running = false;
    if (this.cleanup) this.cleanup();
    const { W, H } = this;
    const coins = Math.max(5, Math.round(this.score * (this.coinRate || 0.5)));
    const isRecord = recordScore(this.id, this.score);
    const before = level();
    const { leveledUp } = earnCoins(coins);

    const ov = new PIXI.Container();
    const dim = new PIXI.Graphics();
    dim.beginFill(0x50104a, 0.55);
    dim.drawRect(0, 0, W, H);
    dim.endFill();
    dim.eventMode = 'static';
    ov.addChild(dim);
    const pw = Math.min(400, W - 30);
    const panel = makePanel(pw, 360, { border: PALETTE.gold });
    panel.position.set(W / 2, H / 2);
    ov.addChild(panel);

    const t = new PIXI.Text(isRecord ? '★ New Record! ★' : 'Fabulous!', textStyle(32, isRecord ? PALETTE.gold : PALETTE.pink, 0xffffff, 0));
    t.anchor.set(0.5);
    t.position.set(W / 2, H / 2 - 130);
    ov.addChild(t);

    const st = new PIXI.Text('Score: ' + fmt(this.score), textStyle(26, PALETTE.text, 0xffffff, 0));
    st.anchor.set(0.5);
    st.position.set(W / 2, H / 2 - 74);
    ov.addChild(st);

    const coinRow = new PIXI.Container();
    const ci = makeIcon('coin', 40);
    coinRow.addChild(ci);
    const ct = new PIXI.Text('+' + fmt(coins), textStyle(34, 0xf5a91a, 0xffffff, 0));
    ct.anchor.set(0, 0.5);
    ct.x = 28;
    coinRow.addChild(ct);
    coinRow.position.set(W / 2 - coinRow.width / 2 + 10, H / 2 - 22);
    ov.addChild(coinRow);

    if (leveledUp) {
      const lv = new PIXI.Text(`✨ LEVEL UP! You're Lv ${level()} ✨`, textStyle(20, 0xffffff, PALETTE.purple, 4));
      lv.anchor.set(0.5);
      lv.position.set(W / 2, H / 2 + 26);
      ov.addChild(lv);
      tween(lv.scale, { x: 1.1, y: 1.1 }, 500, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });
      confetti(W, 60);
      Sfx.fanfare();
    } else {
      const hint = new PIXI.Text('New outfits await in the Wardrobe!', textStyle(16, PALETTE.purple, 0xffffff, 0));
      hint.anchor.set(0.5);
      hint.position.set(W / 2, H / 2 + 26);
      ov.addChild(hint);
    }

    const again = makeButton('Play again', {
      w: pw * 0.42, h: 58, color: PALETTE.mint, fontSize: 20,
      onTap: () => G.go(this.constructor),
    });
    again.position.set(W / 2 - pw * 0.23, H / 2 + 80);
    ov.addChild(again);
    const games = makeButton('Games', {
      w: pw * 0.38, h: 58, color: PALETTE.blue, fontSize: 20,
      onTap: async () => {
        const { GameHubScene } = await import('./gamehub.js');
        G.go(GameHubScene);
      },
    });
    games.position.set(W / 2 + pw * 0.24, H / 2 + 80);
    ov.addChild(games);
    const shop = makeButton('Wardrobe', {
      w: pw * 0.5, h: 50, color: PALETTE.purple, fontSize: 18, icon: 'dress',
      onTap: async () => {
        const { WardrobeScene } = await import('./wardrobe.js');
        G.go(WardrobeScene);
      },
    });
    shop.position.set(W / 2, H / 2 + 146);
    ov.addChild(shop);

    ov.alpha = 0;
    tween(ov, { alpha: 1 }, 300);
    panel.scale.set(0.7);
    tween(panel.scale, { x: 1, y: 1 }, 400, { ease: Ease.backOut });
    this.root.addChild(ov);
    if (isRecord) { confetti(W, 50); Sfx.fanfare(); } else Sfx.good();

    // coins fly to a fake HUD spot top-right
    coinFly(W / 2, H / 2 - 20, W - 130, 34, Math.min(12, Math.ceil(coins / 10)));
  }

  /** Bind keyboard keys (desktop support). Map of e.key -> fn; cleaned up on scene switch. */
  bindKeys(map) {
    this.keyHandler = (e) => {
      const fn = map[e.key];
      if (fn && this.running) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  dispose() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }

  // subclass hooks
  setup(W, H) {}
  begin() {}
  tick(ms) {}
}
