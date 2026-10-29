// Boutique hub: your character under a spotlight on a sparkling pedestal,
// with rich menu cards, live stats, a daily gift and a day/night switch.

import { G } from '../game.js';
import { save, persist, level, giftAvailable, claimGift } from '../save.js';
import { ITEMS, styleScore } from '../items.js';
import { isNight, toggleTheme, nite, niteSoft } from '../theme.js';
import { makeHUD, makeBackground, makeIcon, iconButton, textStyle, PALETTE } from '../ui.js';
import { characterAtHeight } from '../character.js';
import { sparkleBurst, floatHearts, floatText, coinFly, confetti } from '../effects.js';
import { tween, Ease, killTweensOf } from '../tween.js';
import { Sfx, setSoundEnabled, soundEnabled } from '../sound.js';
import { rand, choice, darken, lighten, fmt, mixColor } from '../util.js';

export class MenuScene {
  constructor(params) { this.params = params; this.ambient = true; this.t = 0; }

  build(W, H) {
    const r = this.root;
    const portrait = H > W * 0.95;
    const night = isNight();
    this.portrait = portrait;
    r.addChild(makeBackground(W, H, 0xffd9ec, 0xffabd3));

    // ---------- night sky extras ----------
    if (night) {
      const sky = new PIXI.Graphics();
      // crescent moon
      const mx = portrait ? W * 0.1 : W * 0.08;
      const my = portrait ? H * 0.33 : H * 0.2;
      sky.beginFill(0xfff3c0, 0.95);
      sky.drawCircle(mx, my, 26);
      sky.endFill();
      sky.beginFill(nite(0xffd9ec));
      sky.drawCircle(mx + 11, my - 7, 21);
      sky.endFill();
      // a few bigger twinkle stars
      sky.beginFill(0xfff3c0, 0.9);
      for (let i = 0; i < 8; i++) {
        const sx = rand(0, W), sy = rand(0, H * 0.5);
        sky.drawPolygon([sx, sy - 5, sx + 1.6, sy - 1.6, sx + 5, sy, sx + 1.6, sy + 1.6, sx, sy + 5, sx - 1.6, sy + 1.6, sx - 5, sy, sx - 1.6, sy - 1.6]);
      }
      sky.endFill();
      r.addChild(sky);
    }

    // ---------- drifting bokeh ----------
    this.bokeh = new PIXI.Container();
    this.bokehDots = [];
    for (let i = 0; i < 14; i++) {
      const g = new PIXI.Graphics();
      const col = choice(night ? [0xffffff, 0xb8a8e8, 0x8a7ab8] : [0xffffff, 0xffc7e4, 0xf3d9ff]);
      g.beginFill(col, rand(0.08, night ? 0.12 : 0.18));
      g.drawCircle(0, 0, rand(26, 100));
      g.endFill();
      g.x = rand(0, W); g.y = rand(0, H);
      g.meta = { vy: rand(0.08, 0.35), sway: rand(0.1, 0.5), ph: rand(0, 9) };
      this.bokeh.addChild(g);
      this.bokehDots.push(g);
    }
    r.addChild(this.bokeh);

    // ---------- boutique floor ----------
    const floorY = portrait ? H - 3 * 92 - 92 : H * 0.84;
    this.floorY = floorY;
    const floor = new PIXI.Graphics();
    if (!portrait) {
      floor.beginFill(niteSoft(0xf7b7d9));
      floor.drawRect(0, floorY, W, H - floorY);
      floor.endFill();
      // perspective planks
      for (let i = 0; i < 9; i++) {
        floor.beginFill(niteSoft(i % 2 ? 0xf9c3e0 : 0xf3abd2), 0.8);
        const t0 = i / 9, t1 = (i + 1) / 9;
        floor.drawPolygon([
          W * (0.5 - 0.75 * t0), floorY + (H - floorY) * t0,
          W * (0.5 + 0.75 * t0), floorY + (H - floorY) * t0,
          W * (0.5 + 0.75 * t1), floorY + (H - floorY) * t1,
          W * (0.5 - 0.75 * t1), floorY + (H - floorY) * t1,
        ]);
        floor.endFill();
      }
      floor.beginFill(0xffffff, night ? 0.18 : 0.35);
      floor.drawRect(0, floorY, W, 4);
      floor.endFill();
      r.addChild(floor);
    }

    // ---------- title ----------
    const titleX = portrait ? W / 2 : W * 0.31;
    const titleY = Math.max(portrait ? 92 : 76, H * 0.1);
    const title = new PIXI.Container();
    const glow = new PIXI.Graphics();
    glow.beginFill(night ? 0xb89ae0 : 0xffffff, 0.28);
    glow.drawEllipse(0, 6, Math.min(W * 0.34, 250), 46);
    glow.endFill();
    title.addChild(glow);
    this.titleGlow = glow;
    const t1 = new PIXI.Text('Glitter & Glam', {
      ...textStyle(portrait ? Math.min(52, W * 0.105) : Math.min(58, W * 0.055), 0xffffff, 0xc2447c, 8),
      fill: ['#ffffff', '#ffe3f2', '#ffc7e4'],
      fillGradientType: 0,
    });
    t1.anchor.set(0.5);
    title.addChild(t1);
    const t2 = new PIXI.Text(night ? '🌙 dress up & shine 🌙' : '✨ dress up & shine ✨', textStyle(portrait ? 19 : 21, 0xfff3fa, 0xd66d9e, 4));
    t2.anchor.set(0.5);
    t2.y = t1.height * 0.68;
    title.addChild(t2);
    // orbiting stars
    this.orbitStars = [];
    for (const s of [-1, 1]) {
      const st = makeIcon('star', 22);
      st.meta = { ph: s > 0 ? 0 : Math.PI, rx: t1.width * 0.62, ry: 26 };
      title.addChild(st);
      this.orbitStars.push(st);
    }
    title.position.set(titleX, titleY);
    r.addChild(title);
    this.title = title;

    // ---------- character on pedestal ----------
    const charX = portrait ? W / 2 : W * 0.31;
    const charH = portrait
      ? Math.min((floorY - titleY - 128) * 0.96, 470)
      : Math.min((floorY - titleY - 60) * 0.98, 560);
    // spotlight cone
    if (!portrait) {
      const cone = new PIXI.Graphics();
      cone.beginFill(0xfff6d8, night ? 0.22 : 0.16);
      cone.drawPolygon([charX - 30, 0, charX + 30, 0, charX + charH * 0.42, floorY + 12, charX - charH * 0.42, floorY + 12]);
      cone.endFill();
      r.addChild(cone);
    }
    // pedestal
    const ped = new PIXI.Graphics();
    ped.beginFill(niteSoft(0xdf7fb2), 0.55);
    ped.drawEllipse(charX, floorY + 8, charH * 0.30, charH * 0.062);
    ped.endFill();
    ped.beginFill(0xffffff, night ? 0.3 : 0.5);
    ped.drawEllipse(charX, floorY + 4, charH * 0.26, charH * 0.05);
    ped.endFill();
    r.addChild(ped);
    // rotating sparkle ring
    this.ring = [];
    this.ringC = { x: charX, y: floorY + 6, rx: charH * 0.30, ry: charH * 0.06 };
    for (let i = 0; i < 10; i++) {
      const s = new PIXI.Graphics();
      s.beginFill(choice([0xffffff, 0xffe08a, 0xffc7e4]));
      s.drawPolygon([0, -5, 1.6, -1.6, 5, 0, 1.6, 1.6, 0, 5, -1.6, 1.6, -5, 0, -1.6, -1.6]);
      s.endFill();
      s.meta = { ph: (i / 10) * Math.PI * 2 };
      r.addChild(s);
      this.ring.push(s);
    }

    const ch = characterAtHeight(save.eq, save.skin, charH);
    ch.position.set(charX, floorY + 4);
    r.addChild(ch);
    this.char = ch;
    this.charBaseY = ch.y;
    this.charScale = charH / 560;
    ch.eventMode = 'static';
    ch.cursor = 'pointer';
    ch.on('pointertap', (e) => {
      Sfx.sparkle();
      const lp = G.ev(e);
      sparkleBurst(lp.x, lp.y, { n: 14 });
      floatHearts(charX, ch.y - charH * 0.7, 4);
      killTweensOf(ch.scale);
      tween(ch.scale, { x: this.charScale * 1.06, y: this.charScale * 1.06 }, 120, {
        ease: Ease.quadOut,
        onDone: () => tween(ch.scale, { x: this.charScale, y: this.charScale }, 300, { ease: Ease.elasticOut }),
      });
    });

    // ---------- menu cards ----------
    const owned = save.owned.length;
    const total = ITEMS.length;
    const cardDefs = [
      {
        label: 'Minigames', sub: '6 sparkly games • earn coins', icon: 'star', color: PALETTE.pink,
        go: async () => (await import('./gamehub.js')).GameHubScene,
      },
      {
        label: 'Wardrobe', sub: `${owned}/${total} styles collected`, icon: 'dress', color: PALETTE.purple,
        go: async () => (await import('./wardrobe.js')).WardrobeScene,
      },
      {
        label: 'Fashion Show', sub: save.wins > 0 ? `${save.wins}× Best Dressed 🏆` : 'strut the red carpet!', icon: 'crown', color: PALETTE.gold,
        go: async () => (await import('./fashionshow.js')).FashionShowScene,
      },
    ];
    const cw = portrait ? Math.min(352, W * 0.9) : Math.min(400, W * 0.36);
    const chh = portrait ? 82 : 96;
    const gap = portrait ? 10 : 18;
    const cardsX = portrait ? W / 2 : W * 0.71;
    const cardsY0 = portrait ? floorY + 66 : H / 2 - (chh + gap);
    cardDefs.forEach((def, i) => {
      const card = this.makeCard(def, cw, chh);
      card.position.set(cardsX, cardsY0 + i * (chh + gap));
      r.addChild(card);
      card.scale.set(0);
      tween(card.scale, { x: 1, y: 1 }, 420, { delay: 120 + i * 100, ease: Ease.backOut });
    });

    // ---------- stats chips ----------
    const chips = new PIXI.Container();
    const chipDefs = [
      { icon: 'gem', label: 'style ' + fmt(styleScore(save.eq)), color: 0x5ba8ec },
      { icon: 'trophy', label: fmt(save.wins) + ' wins', color: 0xf5a91a },
      { icon: 'heart', label: fmt(save.plays) + ' plays', color: 0xff5f9e },
    ];
    let cx2 = 0;
    chipDefs.forEach((cd) => {
      const chip = this.makeChip(cd);
      chip.x = cx2 + chip.chipW / 2;
      cx2 += chip.chipW + 8;
      chips.addChild(chip);
    });
    chips.pivot.x = cx2 / 2 - 4;
    if (portrait) chips.position.set(W / 2, titleY + 92);
    else chips.position.set(charX, H - 26);
    r.addChild(chips);

    // ---------- daily gift ----------
    this.buildGift(portrait ? { x: W - 46, y: titleY + 158 } : { x: W - 48, y: H - 120 });

    // ---------- sound + theme toggles ----------
    this.soundPos = { x: W - 44, y: H - 44 };
    this.themePos = { x: W - 44 - 58, y: H - 44 };
    this.buildSound();
    this.buildThemeToggle();

    // subtle nudge
    const hint = new PIXI.Text(this.hintText(), textStyle(15, 0xffffff, 0xd66d9e, 3));
    hint.anchor.set(0.5);
    hint.position.set(portrait ? W / 2 : W * 0.71, portrait ? H - 12 : cardsY0 + 3 * (chh + gap) + 40);
    if (hint.width > W - 110) hint.scale.set((W - 110) / hint.width);
    hint.alpha = 0.9;
    r.addChild(hint);

    this.hud = makeHUD(W);
    r.addChild(this.hud);
  }

  makeCard(def, w, h) {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.beginFill(darken(def.color, 0.45), 0.4);
    g.drawRoundedRect(-w / 2 + 3, -h / 2 + 7, w, h, h / 2.6);
    g.endFill();
    g.beginFill(0xffffff, 0.97);
    g.drawRoundedRect(-w / 2, -h / 2, w, h, h / 2.6);
    g.endFill();
    g.beginFill(def.color, 0.13);
    g.drawRoundedRect(-w / 2, -h / 2, w, h, h / 2.6);
    g.endFill();
    g.lineStyle({ width: 3, color: def.color, alpha: 0.8 });
    g.drawRoundedRect(-w / 2, -h / 2, w, h, h / 2.6);
    g.lineStyle(0);
    c.addChild(g);

    // icon badge
    const br = h * 0.34;
    const badge = new PIXI.Graphics();
    badge.beginFill(def.color);
    badge.drawCircle(0, 0, br);
    badge.endFill();
    badge.beginFill(0xffffff, 0.32);
    badge.drawEllipse(0, -br * 0.32, br * 0.66, br * 0.4);
    badge.endFill();
    badge.position.set(-w / 2 + h * 0.5, 0);
    c.addChild(badge);
    const ic = makeIcon(def.icon, br * 1.15, def.icon === 'star' ? 0xffffff : undefined);
    ic.position.set(-w / 2 + h * 0.5, 0);
    c.addChild(ic);

    const name = new PIXI.Text(def.label, { ...textStyle(h * 0.3, darken(def.color, 0.35), 0xffffff, 0), fontWeight: '900' });
    name.anchor.set(0, 0.5);
    name.position.set(-w / 2 + h * 0.95, -h * 0.17);
    c.addChild(name);
    const sub = new PIXI.Text(def.sub, { ...textStyle(h * 0.18, 0xa87aa0, 0xffffff, 0), fontWeight: '700' });
    sub.anchor.set(0, 0.5);
    sub.position.set(-w / 2 + h * 0.95, h * 0.19);
    c.addChild(sub);

    // chevron
    const chev = new PIXI.Graphics();
    chev.lineStyle({ width: 4, color: def.color, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND });
    chev.moveTo(-6, -10); chev.lineTo(5, 0); chev.lineTo(-6, 10);
    chev.position.set(w / 2 - h * 0.34, 0);
    c.addChild(chev);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerover', () => { killTweensOf(c.scale); tween(c.scale, { x: 1.035, y: 1.035 }, 140, { ease: Ease.quadOut }); });
    c.on('pointerout', () => { killTweensOf(c.scale); tween(c.scale, { x: 1, y: 1 }, 180, { ease: Ease.quadOut }); });
    c.on('pointerdown', () => { Sfx.tap(); killTweensOf(c.scale); tween(c.scale, { x: 0.95, y: 0.95 }, 70); });
    c.on('pointerupoutside', () => tween(c.scale, { x: 1, y: 1 }, 180));
    c.on('pointerup', async (e) => {
      tween(c.scale, { x: 1, y: 1 }, 160);
      const lp = G.ev(e);
      sparkleBurst(lp.x, lp.y, { n: 8, power: 0.8 });
      const SceneClass = await def.go();
      G.go(SceneClass);
    });
    return c;
  }

  makeChip(cd) {
    const c = new PIXI.Container();
    const label = new PIXI.Text(cd.label, textStyle(14, 0xffffff, 0x9a4a78, 3));
    label.anchor.set(0, 0.5);
    const w = label.width + 44;
    const g = new PIXI.Graphics();
    g.beginFill(0x8a3060, 0.55);
    g.drawRoundedRect(-w / 2, -16, w, 32, 16);
    g.endFill();
    c.addChild(g);
    const ic = makeIcon(cd.icon, 18, cd.color);
    ic.position.set(-w / 2 + 16, 0);
    c.addChild(ic);
    label.position.set(-w / 2 + 30, 0);
    c.addChild(label);
    c.chipW = w;
    return c;
  }

  buildGift(pos) {
    if (this.giftBtn && !this.giftBtn.destroyed) this.giftBtn.destroy({ children: true });
    const avail = giftAvailable();
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    const col = avail ? 0xe0596d : 0xb9a8b8;
    // gift box
    g.beginFill(darken(col, 0.4), 0.5);
    g.drawRoundedRect(-24, -18 + 4, 48, 40, 8);
    g.endFill();
    g.beginFill(col);
    g.drawRoundedRect(-24, -18, 48, 40, 8);
    g.endFill();
    g.beginFill(lighten(col, 0.35));
    g.drawRect(-5, -18, 10, 40);
    g.drawRoundedRect(-28, -26, 56, 14, 7);
    g.endFill();
    // bow
    g.beginFill(lighten(col, 0.15));
    g.moveTo(0, -26);
    g.bezierCurveTo(-16, -40, -20, -24, 0, -24);
    g.moveTo(0, -26);
    g.bezierCurveTo(16, -40, 20, -24, 0, -24);
    g.endFill();
    c.addChild(g);
    const label = new PIXI.Text(avail ? 'GIFT!' : 'tomorrow', textStyle(avail ? 14 : 11, 0xffffff, 0x8a3060, 3));
    label.anchor.set(0.5);
    label.y = 34;
    c.addChild(label);
    c.position.set(pos.x, pos.y);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      if (!giftAvailable()) {
        Sfx.tap();
        floatText(pos.x, pos.y - 40, 'Come back tomorrow! ✨', { size: 18, fill: 0xffffff, stroke: 0x9a8aa8 });
        return;
      }
      const amount = claimGift();
      Sfx.buy();
      sparkleBurst(pos.x, pos.y, { n: 20, power: 1.2 });
      floatText(pos.x, pos.y - 46, `Daily gift +${amount}!`, { size: 22, fill: 0xffe08a });
      const tgt = this.hud.coinTarget();
      coinFly(pos.x, pos.y, tgt.x, tgt.y, 8, () => this.hud.bumpCoin());
      this.buildGift(pos);
    });
    if (avail) {
      tween(c.scale, { x: 1.1, y: 1.1 }, 600, { ease: Ease.sineInOut, yoyo: true, repeat: -1 });
    }
    this.root.addChild(c);
    this.giftBtn = c;
    if (this.hud) this.root.addChild(this.hud);
  }

  buildSound() {
    if (this.soundBtn && !this.soundBtn.destroyed) this.soundBtn.destroy({ children: true });
    const sb = iconButton(soundEnabled() ? 'sound' : 'mute', 48, PALETTE.purple, () => {
      const on = !soundEnabled();
      setSoundEnabled(on);
      save.sound = on;
      persist();
      this.buildSound();
    });
    sb.position.set(this.soundPos.x, this.soundPos.y);
    this.root.addChild(sb);
    this.soundBtn = sb;
  }

  buildThemeToggle() {
    if (this.themeBtn && !this.themeBtn.destroyed) this.themeBtn.destroy({ children: true });
    const tb = iconButton(isNight() ? 'sun' : 'moon', 48, isNight() ? 0xe0995c : 0x5e5a9e, () => {
      toggleTheme();
      Sfx.sparkle();
      G.go(MenuScene); // rebuild everything in the new theme
    });
    tb.position.set(this.themePos.x, this.themePos.y);
    this.root.addChild(tb);
    this.themeBtn = tb;
  }

  hintText() {
    if (save.plays === 0) return 'Play minigames to earn coins for fabulous outfits!';
    if (giftAvailable() && save.plays > 2) return 'Your daily gift is waiting! 🎀';
    if (save.owned.length < 6) return 'Visit the Wardrobe — new styles are waiting!';
    if (save.shows === 0) return 'Try the Fashion Show and wow the judges!';
    return `Level ${level()} stylist — keep sparkling! ✨`;
  }

  update(ms) {
    this.t += ms;
    const t = this.t;
    if (this.title && !this.title.destroyed) {
      this.title.scale.set(1 + Math.sin(t / 650) * 0.018);
      this.title.rotation = Math.sin(t / 1600) * 0.01;
      this.titleGlow.alpha = 0.7 + Math.sin(t / 500) * 0.3;
      for (const st of this.orbitStars) {
        const a = t / 1400 + st.meta.ph;
        st.x = Math.cos(a) * st.meta.rx;
        st.y = 4 + Math.sin(a) * st.meta.ry;
        st.scale.set(0.7 + 0.3 * Math.sin(a * 2));
        st.alpha = 0.55 + 0.45 * Math.sin(a * 2);
      }
    }
    if (this.char && !this.char.destroyed) {
      this.char.y = this.charBaseY + Math.sin(t / 800) * 5;
      this.char.charUpdate(ms);
    }
    for (const s of this.ring) {
      if (s.destroyed) continue;
      const a = t / 1900 + s.meta.ph;
      s.x = this.ringC.x + Math.cos(a) * this.ringC.rx;
      s.y = this.ringC.y + Math.sin(a) * this.ringC.ry;
      s.alpha = 0.35 + 0.65 * (0.5 + Math.sin(a * 3 + t / 300) / 2);
    }
    for (const b of this.bokehDots) {
      if (b.destroyed) continue;
      b.y -= b.meta.vy * (ms / 16.7);
      b.x += Math.sin(t / 1200 + b.meta.ph) * b.meta.sway * (ms / 16.7) * 0.3;
      if (b.y < -110) b.y = G.H + 110;
    }
  }
}
