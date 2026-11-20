// Shared UI: glossy buttons, panels, HUD (coins + level), icons, backgrounds.

import { G } from './game.js';
import { tween, Ease, killTweensOf } from './tween.js';
import { Sfx } from './sound.js';
import { sparkleBurst } from './effects.js';
import { save, level, levelProgress } from './save.js';
import { isNight, nite } from './theme.js';
import { drawHeart, drawSparkle, starPoints, lighten, darken, fmt, rand, drawDiamond } from './util.js';

export const FONT = 'GameFont';

export const PALETTE = {
  pink: 0xff5f9e,
  pinkDark: 0xc2447c,
  purple: 0xa66ae0,
  blue: 0x5ba8ec,
  mint: 0x46c791,
  gold: 0xf5a91a,
  cream: 0xfff6fa,
  text: 0x8a3060,
};

export function textStyle(size, fill = 0xffffff, stroke = PALETTE.pinkDark, thick = Math.max(3, size / 7)) {
  return {
    fontFamily: FONT,
    fontSize: size,
    fontWeight: '900',
    fill,
    stroke,
    strokeThickness: thick,
    align: 'center',
  };
}

/** Big glossy pill button. onTap fires after the press pop. */
export function makeButton(label, { w = 260, h = 72, color = PALETTE.pink, fontSize, icon = null, onTap = null, enabled = true } = {}) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  const r = h / 2;
  // drop shadow
  g.beginFill(darken(color, 0.45), 0.5);
  g.drawRoundedRect(-w / 2, -h / 2 + 6, w, h, r);
  g.endFill();
  // body
  g.beginFill(enabled ? color : 0xb9a8b8);
  g.drawRoundedRect(-w / 2, -h / 2, w, h, r);
  g.endFill();
  // glossy top highlight
  g.beginFill(0xffffff, 0.35);
  g.drawRoundedRect(-w / 2 + 8, -h / 2 + 6, w - 16, h * 0.42, h * 0.21);
  g.endFill();
  // rim
  g.lineStyle({ width: 3, color: 0xffffff, alpha: 0.7 });
  g.drawRoundedRect(-w / 2, -h / 2, w, h, r);
  g.lineStyle(0);
  c.addChild(g);

  let tx = 0;
  if (icon) {
    const ic = makeIcon(icon, h * 0.42);
    ic.x = -w / 2 + h * 0.52;
    c.addChild(ic);
    tx = h * 0.18;
  }
  const t = new PIXI.Text(label, textStyle(fontSize || Math.min(30, h * 0.42), 0xffffff, darken(color, 0.35)));
  t.anchor.set(0.5);
  t.x = tx;
  c.addChild(t);
  c.label = t;

  if (enabled) {
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerover', () => { killTweensOf(c.scale); tween(c.scale, { x: 1.04, y: 1.04 }, 130, { ease: Ease.quadOut }); });
    c.on('pointerout', () => { killTweensOf(c.scale); tween(c.scale, { x: 1, y: 1 }, 170, { ease: Ease.quadOut }); });
    c.on('pointerdown', () => {
      Sfx.tap();
      killTweensOf(c.scale);
      tween(c.scale, { x: 0.92, y: 0.92 }, 70, { ease: Ease.quadOut });
    });
    const up = (e) => {
      killTweensOf(c.scale);
      tween(c.scale, { x: 1, y: 1 }, 260, { ease: Ease.elasticOut });
    };
    c.on('pointerupoutside', up);
    c.on('pointerup', (e) => {
      up();
      sparkleBurst(e.global.x / G.S, e.global.y / G.S, { n: 8, power: 0.8 });
      if (onTap) onTap();
    });
  } else {
    c.alpha = 0.85;
  }
  return c;
}

/** Small round icon button (back, sound, close, moon/sun...). */
export function iconButton(kind, size = 56, color = PALETTE.pink, onTap = null) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(darken(color, 0.4), 0.5);
  g.drawCircle(0, 4, size / 2);
  g.endFill();
  g.beginFill(color);
  g.drawCircle(0, 0, size / 2);
  g.endFill();
  g.beginFill(0xffffff, 0.3);
  g.drawEllipse(0, -size * 0.16, size * 0.34, size * 0.2);
  g.endFill();
  g.lineStyle({ width: 2.5, color: 0xffffff, alpha: 0.8 });
  g.drawCircle(0, 0, size / 2);
  g.lineStyle(0);
  c.addChild(g);
  const s = size * 0.26;
  const i = new PIXI.Graphics();
  i.lineStyle({ width: 5, color: 0xffffff, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND });
  if (kind === 'back') {
    i.moveTo(s * 0.5, -s); i.lineTo(-s * 0.6, 0); i.lineTo(s * 0.5, s);
  } else if (kind === 'close') {
    i.moveTo(-s * 0.8, -s * 0.8); i.lineTo(s * 0.8, s * 0.8);
    i.moveTo(s * 0.8, -s * 0.8); i.lineTo(-s * 0.8, s * 0.8);
  } else if (kind === 'sound') {
    i.lineStyle(0);
    i.beginFill(0xffffff);
    i.drawPolygon([-s, -s * 0.5, -s * 0.2, -s * 0.5, s * 0.5, -s, s * 0.5, s, -s * 0.2, s * 0.5, -s, s * 0.5]);
    i.endFill();
  } else if (kind === 'mute') {
    i.lineStyle(0);
    i.beginFill(0xffffff);
    i.drawPolygon([-s, -s * 0.5, -s * 0.2, -s * 0.5, s * 0.5, -s, s * 0.5, s, -s * 0.2, s * 0.5, -s, s * 0.5]);
    i.endFill();
    i.lineStyle({ width: 4, color: 0xff4d6d, cap: PIXI.LINE_CAP.ROUND });
    i.moveTo(-s, -s); i.lineTo(s, s);
  } else if (kind === 'moon') {
    i.lineStyle(0);
    i.beginFill(0xfff3c0);
    i.drawCircle(0, 0, s * 1.05);
    i.endFill();
    i.beginFill(color);
    i.drawCircle(s * 0.55, -s * 0.35, s * 0.85);
    i.endFill();
  } else if (kind === 'sun') {
    i.lineStyle(0);
    i.beginFill(0xffe08a);
    i.drawCircle(0, 0, s * 0.72);
    i.endFill();
    i.lineStyle({ width: 3.5, color: 0xffe08a, cap: PIXI.LINE_CAP.ROUND });
    for (let k2 = 0; k2 < 8; k2++) {
      const a = (k2 / 8) * Math.PI * 2;
      i.moveTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95);
      i.lineTo(Math.cos(a) * s * 1.3, Math.sin(a) * s * 1.3);
    }
    i.lineStyle(0);
  }
  c.addChild(i);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointerdown', () => { Sfx.tap(); tween(c.scale, { x: 0.88, y: 0.88 }, 60); });
  c.on('pointerup', () => {
    tween(c.scale, { x: 1, y: 1 }, 200, { ease: Ease.backOut });
    if (onTap) onTap();
  });
  c.on('pointerupoutside', () => tween(c.scale, { x: 1, y: 1 }, 200, { ease: Ease.backOut }));
  return c;
}

/** Rounded panel with soft border. */
export function makePanel(w, h, { color = 0xffffff, alpha = 0.96, border = PALETTE.pink } = {}) {
  const g = new PIXI.Graphics();
  g.beginFill(darken(border, 0.3), 0.35);
  g.drawRoundedRect(-w / 2 + 4, -h / 2 + 8, w, h, 28);
  g.endFill();
  g.beginFill(color, alpha);
  g.drawRoundedRect(-w / 2, -h / 2, w, h, 28);
  g.endFill();
  g.lineStyle({ width: 4, color: border, alpha: 0.9 });
  g.drawRoundedRect(-w / 2, -h / 2, w, h, 28);
  g.lineStyle(0);
  return g;
}

/** Little vector icons used across cards / buttons. */
export function makeIcon(kind, size = 32, color) {
  const g = new PIXI.Graphics();
  const s = size / 2;
  switch (kind) {
    case 'coin':
      g.beginFill(0xf5b21a); g.drawCircle(0, 0, s); g.endFill();
      g.beginFill(0xffd35c); g.drawCircle(0, 0, s * 0.76); g.endFill();
      g.beginFill(0xf5b21a); drawHeart(g, 0, s * 0.06, s * 0.4); g.endFill();
      break;
    case 'star':
      g.beginFill(color || 0xffd35c);
      g.drawPolygon(starPoints(0, 0, 5, s, s * 0.5));
      g.endFill();
      g.beginFill(0xffffff, 0.7); g.drawCircle(-s * 0.25, -s * 0.3, s * 0.16); g.endFill();
      break;
    case 'heart':
      g.beginFill(color || 0xff5f9e); drawHeart(g, 0, 0, s * 0.85); g.endFill();
      g.beginFill(0xffffff, 0.6); g.drawCircle(-s * 0.3, -s * 0.25, s * 0.18); g.endFill();
      break;
    case 'gem':
      g.beginFill(color || 0x5bc8ec); drawDiamond(g, 0, 0, s); g.endFill();
      g.beginFill(0xffffff, 0.7); g.drawPolygon([0, -s, s * 0.4, -s * 0.2, 0, 0, -s * 0.4, -s * 0.2]); g.endFill();
      break;
    case 'bubble':
      g.beginFill(color || 0x9bd7f5, 0.8); g.drawCircle(0, 0, s); g.endFill();
      g.beginFill(0xffffff, 0.8); g.drawEllipse(-s * 0.35, -s * 0.35, s * 0.24, s * 0.15); g.endFill();
      break;
    case 'note':
      g.beginFill(color || 0xa66ae0);
      g.drawEllipse(-s * 0.35, s * 0.55, s * 0.32, s * 0.24);
      g.drawRect(-s * 0.08, -s * 0.85, s * 0.14, s * 1.45);
      g.moveTo(-s * 0.08, -s * 0.85);
      g.quadraticCurveTo(s * 0.6, -s * 0.75, s * 0.55, -s * 0.15);
      g.quadraticCurveTo(s * 0.4, -s * 0.5, -s * 0.08, -s * 0.5);
      g.endFill();
      break;
    case 'cards':
      g.beginFill(0xffffff); g.drawRoundedRect(-s, -s * 0.7, s * 1.1, s * 1.5, 4); g.endFill();
      g.lineStyle({ width: 2, color: 0xc2447c }); g.drawRoundedRect(-s, -s * 0.7, s * 1.1, s * 1.5, 4); g.lineStyle(0);
      g.beginFill(color || 0xff5f9e); g.drawRoundedRect(-s * 0.1, -s * 0.8, s * 1.1, s * 1.5, 4); g.endFill();
      g.beginFill(0xffffff); drawHeart(g, s * 0.45, -s * 0.05, s * 0.3); g.endFill();
      break;
    case 'eye':
      g.beginFill(0xffffff); g.drawEllipse(0, 0, s, s * 0.62); g.endFill();
      g.beginFill(color || 0x6b4632); g.drawCircle(0, 0, s * 0.4); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(-s * 0.12, -s * 0.14, s * 0.12); g.endFill();
      break;
    case 'simon':
      g.beginFill(0xff5f9e); drawDiamond(g, 0, -s * 0.5, s * 0.42); g.endFill();
      g.beginFill(0xa66ae0); drawDiamond(g, -s * 0.5, 0, s * 0.42); g.endFill();
      g.beginFill(0x5ba8ec); drawDiamond(g, s * 0.5, 0, s * 0.42); g.endFill();
      g.beginFill(0xffd35c); drawDiamond(g, 0, s * 0.5, s * 0.42); g.endFill();
      break;
    case 'dress':
      g.beginFill(color || 0xff5f9e);
      g.drawPolygon([-s * 0.35, -s, s * 0.35, -s, s * 0.2, -s * 0.35, s * 0.75, s * 0.9, -s * 0.75, s * 0.9, -s * 0.2, -s * 0.35]);
      g.endFill();
      g.beginFill(0xffffff, 0.6); drawSparkle(g, s * 0.15, s * 0.3, s * 0.2); g.endFill();
      break;
    case 'hair':
      g.beginFill(color || 0x8a5a3a);
      g.drawCircle(0, -s * 0.2, s * 0.7);
      g.drawEllipse(-s * 0.55, s * 0.35, s * 0.28, s * 0.55);
      g.drawEllipse(s * 0.55, s * 0.35, s * 0.28, s * 0.55);
      g.endFill();
      g.beginFill(0xffdfc9); g.drawCircle(0, 0, s * 0.42); g.endFill();
      break;
    case 'shoe':
      g.beginFill(color || 0xd1274b);
      g.moveTo(-s, s * 0.5); g.quadraticCurveTo(-s * 0.3, -s * 0.6, s * 0.3, -s * 0.1);
      g.lineTo(s * 0.9, s * 0.2); g.lineTo(s * 0.9, s * 0.5); g.closePath();
      g.endFill();
      g.beginFill(darken(color || 0xd1274b, 0.2)); g.drawRect(-s, s * 0.2, s * 0.25, s * 0.32); g.endFill();
      break;
    case 'bow':
      bowIcon(g, 0, 0, color || 0xff5f9e, s);
      break;
    case 'bag':
      g.lineStyle({ width: 3, color: darken(color || 0xf5a91a, 0.25) });
      g.moveTo(-s * 0.4, -s * 0.4); g.quadraticCurveTo(0, -s * 1.05, s * 0.4, -s * 0.4);
      g.lineStyle(0);
      g.beginFill(color || 0xf5a91a); g.drawRoundedRect(-s * 0.8, -s * 0.4, s * 1.6, s * 1.2, s * 0.3); g.endFill();
      g.beginFill(0xffffff, 0.6); g.drawCircle(0, s * 0.1, s * 0.18); g.endFill();
      break;
    case 'wand':
      g.lineStyle({ width: 4, color: 0xffffff });
      g.moveTo(-s * 0.7, s * 0.9); g.lineTo(s * 0.25, -s * 0.25);
      g.lineStyle(0);
      g.beginFill(color || 0xffd35c);
      g.drawPolygon(starPoints(s * 0.45, -s * 0.45, 5, s * 0.55, s * 0.25));
      g.endFill();
      break;
    case 'crown':
      g.beginFill(color || 0xf5a91a);
      g.drawPolygon([-s, s * 0.6, -s, -s * 0.4, -s * 0.45, 0, 0, -s * 0.75, s * 0.45, 0, s, -s * 0.4, s, s * 0.6]);
      g.endFill();
      g.beginFill(0xd1274b); g.drawCircle(0, s * 0.2, s * 0.18); g.endFill();
      break;
    case 'trophy':
      g.beginFill(color || 0xf5a91a);
      g.drawRoundedRect(-s * 0.55, -s * 0.8, s * 1.1, s * 0.9, s * 0.2);
      g.drawRect(-s * 0.12, 0, s * 0.24, s * 0.5);
      g.drawRoundedRect(-s * 0.45, s * 0.5, s * 0.9, s * 0.28, s * 0.1);
      g.endFill();
      g.lineStyle({ width: 3, color: color || 0xf5a91a });
      g.arc(-s * 0.65, -s * 0.5, s * 0.28, Math.PI * 0.5, Math.PI * 1.5);
      g.arc(s * 0.65, -s * 0.5, s * 0.28, -Math.PI * 0.5, Math.PI * 0.5);
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.6); drawSparkle(g, s * 0.1, -s * 0.45, s * 0.2); g.endFill();
      break;
    case 'lock':
      g.beginFill(color || 0x9a8aa8);
      g.drawRoundedRect(-s * 0.6, -s * 0.15, s * 1.2, s * 0.95, s * 0.2);
      g.endFill();
      g.lineStyle({ width: 4, color: color || 0x9a8aa8 });
      g.arc(0, -s * 0.2, s * 0.35, Math.PI, 0);
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.7); g.drawCircle(0, s * 0.3, s * 0.14); g.endFill();
      break;
    case 'lip':
      g.beginFill(color || 0xd1274b);
      g.drawRoundedRect(-s * 0.22, -s * 0.85, s * 0.44, s * 0.6, s * 0.12);
      g.endFill();
      g.beginFill(0x8a3060);
      g.drawRoundedRect(-s * 0.35, -s * 0.25, s * 0.7, s * 1.05, s * 0.15);
      g.endFill();
      g.beginFill(0xffffff, 0.4); g.drawRect(-s * 0.14, -s * 0.78, s * 0.1, s * 0.4); g.endFill();
      break;
    case 'flower':
      g.beginFill(color || 0xff8fc7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.drawEllipse(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.34, s * 0.34);
      }
      g.endFill();
      g.beginFill(0xffd35c); g.drawCircle(0, 0, s * 0.32); g.endFill();
      break;
    case 'butterfly':
      g.beginFill(color || 0xa66ae0, 0.95);
      g.drawEllipse(-s * 0.42, -s * 0.25, s * 0.4, s * 0.5);
      g.drawEllipse(s * 0.42, -s * 0.25, s * 0.4, s * 0.5);
      g.drawEllipse(-s * 0.3, s * 0.32, s * 0.28, s * 0.34);
      g.drawEllipse(s * 0.3, s * 0.32, s * 0.28, s * 0.34);
      g.endFill();
      g.beginFill(0x5b3a29); g.drawEllipse(0, 0, s * 0.12, s * 0.5); g.endFill();
      break;
    case 'sparkle':
      g.beginFill(color || 0xffffff); drawSparkle(g, 0, 0, s); g.endFill();
      break;
  }
  return g;
}

function bowIcon(g, x, y, c, s) {
  g.beginFill(c);
  g.moveTo(x, y);
  g.bezierCurveTo(x - s * 1.4, y - s, x - s * 1.6, y + s * 0.6, x, y + s * 0.15);
  g.moveTo(x, y);
  g.bezierCurveTo(x + s * 1.4, y - s, x + s * 1.6, y + s * 0.6, x, y + s * 0.15);
  g.endFill();
  g.beginFill(darken(c, 0.2));
  g.drawCircle(x, y + s * 0.07, s * 0.28);
  g.endFill();
}

/** HUD with coins + level bar. Scene adds it last so it sits on top. */
export function makeHUD(W) {
  const c = new PIXI.Container();

  // coin pill
  const pill = new PIXI.Container();
  const pg = new PIXI.Graphics();
  pg.beginFill(0x8a3060, 0.85);
  pg.drawRoundedRect(0, 0, 150, 46, 23);
  pg.endFill();
  pg.lineStyle({ width: 2.5, color: 0xffd35c, alpha: 0.9 });
  pg.drawRoundedRect(0, 0, 150, 46, 23);
  pg.lineStyle(0);
  pill.addChild(pg);
  const coin = makeIcon('coin', 34);
  coin.position.set(26, 23);
  pill.addChild(coin);
  const amount = new PIXI.Text(fmt(save.coins), textStyle(24, 0xffe08a, 0x5a1f3c, 3));
  amount.anchor.set(0, 0.5);
  amount.position.set(48, 24);
  pill.addChild(amount);
  pill.position.set(W - 162, 12);
  c.addChild(pill);

  // level pill with progress
  const lp = new PIXI.Container();
  const lg = new PIXI.Graphics();
  lg.beginFill(0x8a3060, 0.85);
  lg.drawRoundedRect(0, 0, 168, 46, 23);
  lg.endFill();
  lg.lineStyle({ width: 2.5, color: 0xff8fc7, alpha: 0.9 });
  lg.drawRoundedRect(0, 0, 168, 46, 23);
  lg.lineStyle(0);
  lp.addChild(lg);
  const starIc = makeIcon('star', 32);
  starIc.position.set(24, 23);
  lp.addChild(starIc);
  const lvText = new PIXI.Text('Lv ' + level(), textStyle(20, 0xffffff, 0x5a1f3c, 3));
  lvText.anchor.set(0, 0.5);
  lvText.position.set(44, 15);
  lp.addChild(lvText);
  // progress bar
  const barBg = new PIXI.Graphics();
  barBg.beginFill(0x5a1f3c);
  barBg.drawRoundedRect(44, 28, 110, 10, 5);
  barBg.endFill();
  lp.addChild(barBg);
  const bar = new PIXI.Graphics();
  bar.beginFill(0xffd35c);
  bar.drawRoundedRect(0, 0, 110, 10, 5);
  bar.endFill();
  bar.position.set(44, 28);
  bar.scale.x = Math.max(0.04, levelProgress());
  lp.addChild(bar);
  lp.position.set(12, 12);
  c.addChild(lp);

  c.coinTarget = () => ({ x: pill.x + 26, y: pill.y + 23 });
  c.refresh = () => {
    amount.text = fmt(save.coins);
    lvText.text = 'Lv ' + level();
    bar.scale.x = Math.max(0.04, levelProgress());
  };
  c.bumpCoin = () => {
    killTweensOf(coin.scale);
    coin.scale.set(1.4);
    tween(coin.scale, { x: 1, y: 1 }, 300, { ease: Ease.backOut });
    c.refresh();
  };
  return c;
}

/** Pretty layered background: vertical gradient bands + soft blobs + dots.
 *  In night mode the same hues are deepened toward an evening plum, the
 *  blobs dim and the dots brighten into stars. */
export function makeBackground(W, H, topColor = 0xffd9ec, botColor = 0xffb1d8, blobColor = 0xffffff) {
  const night = isNight();
  const top = nite(topColor);
  const bot = nite(botColor);
  const g = new PIXI.Graphics();
  const bands = 24;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.beginFill(mixHex(top, bot, t));
    g.drawRect(0, (H / bands) * i - 1, W, H / bands + 2);
    g.endFill();
  }
  // soft blobs
  for (let i = 0; i < 10; i++) {
    g.beginFill(blobColor, night ? 0.05 : 0.1);
    g.drawCircle(rand(0, W), rand(0, H), rand(40, 130));
    g.endFill();
  }
  // tiny dots (stars at night)
  for (let i = 0; i < 40; i++) {
    g.beginFill(0xffffff, night ? rand(0.3, 0.8) : rand(0.15, 0.4));
    g.drawCircle(rand(0, W), rand(0, H), night ? rand(1, 2.5) : rand(1.5, 4));
    g.endFill();
  }
  return g;
}

function mixHex(c1, c2, t) {
  const r = Math.round(((c1 >> 16) & 255) + (((c2 >> 16) & 255) - ((c1 >> 16) & 255)) * t);
  const g = Math.round(((c1 >> 8) & 255) + (((c2 >> 8) & 255) - ((c1 >> 8) & 255)) * t);
  const b = Math.round((c1 & 255) + ((c2 & 255) - (c1 & 255)) * t);
  return (r << 16) | (g << 8) | b;
}

/** Rarity stars row (for shop cards). */
export function rarityStars(n, size = 14) {
  const c = new PIXI.Container();
  for (let i = 0; i < n; i++) {
    const s = makeIcon('star', size);
    s.x = i * (size + 2);
    c.addChild(s);
  }
  c.pivot.x = ((n - 1) * (size + 2)) / 2;
  return c;
}
