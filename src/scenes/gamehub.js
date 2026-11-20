// Minigame hub: pick one of six sparkly games.

import { G } from '../game.js';
import { save } from '../save.js';
import { makeHUD, makeBackground, makeIcon, iconButton, textStyle, PALETTE } from '../ui.js';
import { tween, Ease } from '../tween.js';
import { Sfx } from '../sound.js';
import { fmt, darken } from '../util.js';

export const GAME_LIST = [
  { id: 'starcatch', name: 'Star Catch', icon: 'star', color: 0xf5a91a, desc: 'Tap falling stars!', mod: () => import('./games/starcatch.js').then((m) => m.StarCatchScene) },
  { id: 'memory', name: 'Memory Match', icon: 'cards', color: 0xff5f9e, desc: 'Find the pairs!', mod: () => import('./games/memory.js').then((m) => m.MemoryScene) },
  { id: 'bubble', name: 'Bubble Pop', icon: 'bubble', color: 0x5ba8ec, desc: 'Pop the sparkles!', mod: () => import('./games/bubblepop.js').then((m) => m.BubblePopScene) },
  { id: 'rhythm', name: 'Runway Rhythm', icon: 'note', color: 0xa66ae0, desc: 'Tap to the beat!', mod: () => import('./games/rhythm.js').then((m) => m.RhythmScene) },
  { id: 'stylematch', name: 'Style Rush', icon: 'eye', color: 0x46c791, desc: 'Spot the style!', mod: () => import('./games/stylematch.js').then((m) => m.StyleMatchScene) },
  { id: 'simon', name: 'Sparkle Simon', icon: 'simon', color: 0xe0596d, desc: 'Repeat the gems!', mod: () => import('./games/simon.js').then((m) => m.SimonScene) },
];

export class GameHubScene {
  constructor(params) { this.params = params; this.ambient = true; }

  build(W, H) {
    const r = this.root;
    r.addChild(makeBackground(W, H, 0xffe3f0, 0xd9c4fa, 0xffffff));

    const title = new PIXI.Text('Minigames', {
      ...textStyle(Math.min(44, W * 0.08), 0xffffff, PALETTE.pinkDark, 7),
      fill: ['#ffffff', '#ffd9ec'],
    });
    title.anchor.set(0.5);
    title.position.set(W / 2, 88);
    r.addChild(title);
    const sub = new PIXI.Text('earn coins • unlock fashion', textStyle(17, 0xfff3fa, 0xb87ad0, 3));
    sub.anchor.set(0.5);
    sub.position.set(W / 2, 122);
    r.addChild(sub);

    if (save.boostLeft > 0) {
      const boost = new PIXI.Text(`✨ Your next ${save.boostLeft === 1 ? 'game pays' : save.boostLeft + ' games pay'} DOUBLE coins! ✨`, textStyle(16, 0xffe08a, 0xc2447c, 4));
      boost.anchor.set(0.5);
      boost.position.set(W / 2, 148);
      if (boost.width > W - 30) boost.scale.set((W - 30) / boost.width);
      r.addChild(boost);
      tween(boost.scale, { x: boost.scale.x * 1.06, y: boost.scale.y * 1.06 }, 550, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });
    }

    // grid of cards
    const areaTop = 150;
    const areaH = H - areaTop - 70;
    const portrait = H > W * 0.9;
    const cols = portrait ? 2 : 3;
    const rows = Math.ceil(GAME_LIST.length / cols);
    const cw = Math.min((W - 24) / cols, 240);
    const chh = Math.min(areaH / rows, 190);
    const gridW = cw * cols;
    const gridH = chh * rows;
    const ox = (W - gridW) / 2;
    const oy = areaTop + Math.max(0, (areaH - gridH) / 2);

    GAME_LIST.forEach((game, i) => {
      const card = this.makeCard(game, cw - 14, chh - 14);
      card.position.set(ox + (i % cols) * cw + cw / 2, oy + Math.floor(i / cols) * chh + chh / 2);
      r.addChild(card);
      card.scale.set(0);
      tween(card.scale, { x: 1, y: 1 }, 400, { delay: 80 + i * 70, ease: Ease.backOut });
    });

    const back = iconButton('back', 52, PALETTE.purple, async () => {
      const { MenuScene } = await import('./menu.js');
      G.go(MenuScene);
    });
    back.position.set(38, H - 44);
    r.addChild(back);

    this.hud = makeHUD(W);
    r.addChild(this.hud);
  }

  makeCard(game, w, h) {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.beginFill(darken(game.color, 0.4), 0.4);
    g.drawRoundedRect(-w / 2 + 3, -h / 2 + 7, w, h, 22);
    g.endFill();
    g.beginFill(0xffffff, 0.96);
    g.drawRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.endFill();
    g.beginFill(game.color, 0.16);
    g.drawRoundedRect(-w / 2, -h / 2, w, h * 0.52, 22);
    g.endFill();
    g.lineStyle({ width: 3.5, color: game.color, alpha: 0.75 });
    g.drawRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.lineStyle(0);
    c.addChild(g);

    const badge = new PIXI.Graphics();
    badge.beginFill(game.color);
    badge.drawCircle(0, 0, h * 0.19);
    badge.endFill();
    badge.beginFill(0xffffff, 0.3);
    badge.drawEllipse(0, -h * 0.06, h * 0.13, h * 0.08);
    badge.endFill();
    badge.position.set(0, -h * 0.22);
    c.addChild(badge);
    const ic = makeIcon(game.icon, h * 0.24, game.icon === 'star' ? 0xffffff : undefined);
    ic.position.set(0, -h * 0.22);
    c.addChild(ic);

    const name = new PIXI.Text(game.name, { ...textStyle(19, darken(game.color, 0.3), 0xffffff, 0), fontWeight: '800' });
    name.anchor.set(0.5);
    name.position.set(0, h * 0.08);
    if (name.width > w - 16) name.scale.set((w - 16) / name.width);
    c.addChild(name);

    const desc = new PIXI.Text(game.desc, { ...textStyle(14, 0xa08aa8, 0xffffff, 0), fontWeight: '600' });
    desc.anchor.set(0.5);
    desc.position.set(0, h * 0.24);
    c.addChild(desc);

    const best = save.best[game.id];
    const bt = new PIXI.Text(best ? '★ ' + fmt(best) : 'NEW!', textStyle(14, best ? 0xf5a91a : 0xff5f9e, 0xffffff, 2));
    bt.anchor.set(0.5);
    bt.position.set(0, h * 0.38);
    c.addChild(bt);
    if (!best) tween(bt.scale, { x: 1.15, y: 1.15 }, 500, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerover', () => tween(c.scale, { x: 1.04, y: 1.04 }, 130, { ease: Ease.quadOut }));
    c.on('pointerout', () => tween(c.scale, { x: 1, y: 1 }, 170, { ease: Ease.quadOut }));
    c.on('pointerdown', () => tween(c.scale, { x: 0.93, y: 0.93 }, 80));
    c.on('pointerupoutside', () => tween(c.scale, { x: 1, y: 1 }, 200, { ease: Ease.backOut }));
    c.on('pointerup', async () => {
      tween(c.scale, { x: 1, y: 1 }, 150);
      Sfx.pop();
      const SceneClass = await game.mod();
      G.go(SceneClass);
    });
    return c;
  }
}
