// Wardrobe: shop + dress-up in one place. Tap a tab, tap an item —
// owned items equip instantly, affordable items buy with a sparkle,
// locked items tell you the level you need.

import { G } from '../game.js';
import { save, spendCoins, ownItem, isOwned, equip, level, persist } from '../save.js';
import { CATS, SKINS, byCat, byId } from '../items.js';
import { isNight } from '../theme.js';
import { makeButton, makeHUD, makeBackground, makePanel, makeIcon, iconButton, textStyle, rarityStars, PALETTE } from '../ui.js';
import { characterAtHeight } from '../character.js';
import { sparkleBurst, floatText, shake } from '../effects.js';
import { tween, Ease, killTweensOf } from '../tween.js';
import { Sfx } from '../sound.js';
import { lighten, darken, fmt, clamp } from '../util.js';

export class WardrobeScene {
  constructor(params) { this.params = params; this.ambient = true; }

  build(W, H) {
    const r = this.root;
    r.addChild(makeBackground(W, H, 0xf3e4ff, 0xe3c8fa, 0xffffff));
    const portrait = H > W * 0.9;
    this.cat = this.params.cat || 'dress';

    // ---- character preview area ----
    const charAreaW = portrait ? W : W * 0.42;
    const charAreaH = portrait ? H * 0.40 : H;
    // vanity backdrop
    const vg = new PIXI.Graphics();
    vg.beginFill(0xffffff, isNight() ? 0.14 : 0.35);
    if (portrait) vg.drawRoundedRect(10, 66, W - 20, charAreaH - 76, 24);
    else vg.drawRoundedRect(10, 70, charAreaW - 20, H - 84, 24);
    vg.endFill();
    r.addChild(vg);

    this.charSpot = {
      x: portrait ? W * 0.55 : charAreaW * 0.55,
      y: portrait ? 66 + charAreaH * 0.5 : H * 0.52,
      h: portrait ? charAreaH * 0.82 : Math.min(H * 0.62, 470),
    };
    this.renderChar();

    // ---- skin tone picker (next to character) ----
    const sp = new PIXI.Container();
    const drawSwatch = (b, c, active) => {
      b.clear();
      b.beginFill(c);
      b.drawCircle(0, 0, 15);
      b.endFill();
      b.lineStyle({ width: 3, color: active ? 0xff5f9e : 0xffffff, alpha: 1 });
      b.drawCircle(0, 0, 15);
      b.lineStyle(0);
    };
    const swatches = SKINS.map((c, i) => {
      const b = new PIXI.Graphics();
      drawSwatch(b, c, i === save.skin);
      b.y = i * 38;
      b.eventMode = 'static';
      b.cursor = 'pointer';
      b.on('pointertap', () => {
        save.skin = i;
        persist();
        Sfx.equip();
        this.renderChar();
        swatches.forEach((sw, j) => drawSwatch(sw, SKINS[j], j === i));
      });
      sp.addChild(b);
      return b;
    });
    sp.position.set(portrait ? W * 0.08 : charAreaW * 0.12, portrait ? 96 : H * 0.28);
    r.addChild(sp);

    // ---- tabs ----
    const gridX = portrait ? 0 : charAreaW;
    const gridW = portrait ? W : W - charAreaW;
    const tabsY = portrait ? 66 + charAreaH + 8 : 74;
    const tabs = new PIXI.Container();
    const tabSize = Math.min(58, (gridW - 24 - 6 * (CATS.length - 1)) / CATS.length);
    CATS.forEach((cat, i) => {
      const active = cat.id === this.cat;
      const b = new PIXI.Container();
      const bg = new PIXI.Graphics();
      bg.beginFill(active ? PALETTE.pink : 0xffffff, active ? 1 : 0.85);
      bg.drawRoundedRect(-tabSize / 2, -tabSize / 2, tabSize, tabSize, 14);
      bg.endFill();
      bg.lineStyle({ width: 3, color: active ? 0xffffff : 0xe8b8d8 });
      bg.drawRoundedRect(-tabSize / 2, -tabSize / 2, tabSize, tabSize, 14);
      bg.lineStyle(0);
      b.addChild(bg);
      const ic = makeIcon(cat.icon, tabSize * 0.52, active ? 0xffffff : undefined);
      b.addChild(ic);
      b.position.set(gridX + 12 + tabSize / 2 + i * (tabSize + 6), tabsY + tabSize / 2);
      b.eventMode = 'static';
      b.cursor = 'pointer';
      b.on('pointertap', () => {
        if (this.cat === cat.id) return;
        Sfx.tap();
        this.cat = cat.id;
        this.params.cat = cat.id;
        this.buildGrid();
        this.refreshTabs();
      });
      b.catId = cat.id;
      b.bgG = bg;
      b.tabIcon = ic;
      tabs.addChild(b);
    });
    r.addChild(tabs);
    this.tabs = tabs;
    this.tabSize = tabSize;

    const catLabel = new PIXI.Text('', textStyle(20, 0xffffff, PALETTE.pinkDark, 4));
    catLabel.anchor.set(0.5, 0);
    catLabel.position.set(gridX + gridW / 2, tabsY + tabSize + 8);
    r.addChild(catLabel);
    this.catLabel = catLabel;

    // ---- scrollable grid ----
    this.gridArea = { x: gridX + 8, y: tabsY + tabSize + 38, w: gridW - 16, h: H - (tabsY + tabSize + 46) };
    this.gridBox = new PIXI.Container();
    r.addChild(this.gridBox);
    this.buildGrid();

    // ---- top bar ----
    const back = iconButton('back', 52, PALETTE.purple, async () => {
      const { MenuScene } = await import('./menu.js');
      G.go(MenuScene);
    });
    back.position.set(38, H - 44);
    r.addChild(back);

    this.hud = makeHUD(W);
    r.addChild(this.hud);
  }

  refreshTabs() {
    for (const b of this.tabs.children) {
      const active = b.catId === this.cat;
      const bg = b.bgG;
      bg.clear();
      bg.beginFill(active ? PALETTE.pink : 0xffffff, active ? 1 : 0.85);
      bg.drawRoundedRect(-this.tabSize / 2, -this.tabSize / 2, this.tabSize, this.tabSize, 14);
      bg.endFill();
      bg.lineStyle({ width: 3, color: active ? 0xffffff : 0xe8b8d8 });
      bg.drawRoundedRect(-this.tabSize / 2, -this.tabSize / 2, this.tabSize, this.tabSize, 14);
      bg.lineStyle(0);
    }
  }

  renderChar() {
    if (this.char && !this.char.destroyed) this.char.destroy({ children: true });
    this.char = characterAtHeight(save.eq, save.skin, this.charSpot.h);
    this.char.position.set(this.charSpot.x, this.charSpot.y + this.charSpot.h / 2);
    this.root.addChild(this.char);
    // pop
    const s = this.charSpot.h / 560;
    this.char.scale.set(s * 0.92);
    tween(this.char.scale, { x: s, y: s }, 350, { ease: Ease.backOut });
    if (this.hud) this.root.addChild(this.hud); // keep HUD on top
  }

  buildGrid() {
    const { x, y, w, h } = this.gridArea;
    const box = this.gridBox;
    box.removeChildren().forEach((c) => c.destroy({ children: true }));
    const lv = level();
    const items = byCat(this.cat).slice().sort((a, b) => a.lvl - b.lvl || a.price - b.price);
    const catMeta = CATS.find((c) => c.id === this.cat);
    this.catLabel.text = catMeta.name;

    // mask + content
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(x, y, w, h, 18);
    mask.endFill();
    box.addChild(mask);
    const content = new PIXI.Container();
    content.mask = mask;
    box.addChild(content);

    const cols = Math.max(2, Math.floor(w / 190));
    const cw = w / cols;
    const chh = 148;
    items.forEach((it, i) => {
      const card = this.makeCard(it, cw - 12, chh - 10, lv);
      card.position.set(x + (i % cols) * cw + cw / 2, y + Math.floor(i / cols) * chh + chh / 2);
      content.addChild(card);
      card.alpha = 0;
      card.scale.set(0.8);
      tween(card, { alpha: 1 }, 200, { delay: i * 30 });
      tween(card.scale, { x: 1, y: 1 }, 300, { delay: i * 30, ease: Ease.backOut });
    });

    const contentH = Math.ceil(items.length / cols) * chh;
    this.attachScroll(content, x, y, w, h, contentH);
  }

  attachScroll(content, x, y, w, h, contentH) {
    const maxScroll = Math.max(0, contentH - h + 16);
    let scrollY = 0, startY = 0, startScroll = 0, dragging = false, moved = 0, vel = 0, lastY = 0;
    const hit = new PIXI.Graphics();
    hit.beginFill(0xffffff, 0.001);
    hit.drawRect(x, y, w, h);
    hit.endFill();
    hit.eventMode = 'static';
    this.gridBox.addChildAt(hit, 0);
    hit.on('pointerdown', (e) => {
      dragging = true; moved = 0;
      startY = e.global.y / G.S; lastY = startY; startScroll = scrollY; vel = 0;
    });
    const move = (e) => {
      if (!dragging) return;
      const dy = e.global.y / G.S - startY;
      moved = Math.max(moved, Math.abs(dy));
      vel = e.global.y / G.S - lastY;
      lastY = e.global.y / G.S;
      scrollY = clamp(startScroll - dy, -40, maxScroll + 40);
      content.y = -scrollY;
      if (moved > 12) this.scrollCapture = true; // cards check this to swallow taps
    };
    const up = () => {
      dragging = false;
      setTimeout(() => { this.scrollCapture = false; }, 0);
      // momentum + snap back
      const settle = () => {
        scrollY = clamp(scrollY, 0, maxScroll);
        tween(content, { y: -scrollY }, 300, { ease: Ease.quadOut });
      };
      if (Math.abs(vel) > 3) {
        const target = clamp(scrollY - vel * 12, 0, maxScroll);
        scrollY = target;
        tween(content, { y: -target }, 450, { ease: Ease.cubicOut });
      } else settle();
    };
    hit.on('pointermove', move);
    hit.on('pointerup', up);
    hit.on('pointerupoutside', up);
    // wheel support
    hit.on('wheel', (e) => {
      scrollY = clamp(scrollY + e.deltaY * 0.6, 0, maxScroll);
      content.y = -scrollY;
    });
  }

  makeCard(it, w, h, lv) {
    const c = new PIXI.Container();
    const owned = isOwned(it.id);
    const equipped = save.eq[it.cat] === it.id;
    const locked = lv < it.lvl;
    const afford = save.coins >= it.price;

    const bg = new PIXI.Graphics();
    const base = equipped ? 0xfff0b8 : 0xffffff;
    bg.beginFill(darken(PALETTE.pink, 0.3), 0.25);
    bg.drawRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 18);
    bg.endFill();
    bg.beginFill(base, locked ? 0.6 : 0.97);
    bg.drawRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.endFill();
    bg.lineStyle({ width: 3, color: equipped ? PALETTE.gold : locked ? 0xcdbcd8 : 0xf3c8e2 });
    bg.drawRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(0);
    c.addChild(bg);

    // swatch: category icon tinted with item colors on a soft circle
    const sw = new PIXI.Graphics();
    sw.beginFill(lighten(it.p.c1 ?? 0xffc0dd, 0.55));
    sw.drawCircle(0, 0, 30);
    sw.endFill();
    sw.position.set(0, -h / 2 + 40);
    c.addChild(sw);
    const catMeta = CATS.find((cc) => cc.id === it.cat);
    const ic = makeIcon(catMeta.icon, 38, it.p.c1);
    ic.position.set(0, -h / 2 + 40);
    c.addChild(ic);

    const stars = rarityStars(it.rar, 11);
    stars.position.set(0, -h / 2 + 74);
    c.addChild(stars);

    const name = new PIXI.Text(it.name, { ...textStyle(15, PALETTE.text, 0xffffff, 0), fontWeight: '700' });
    name.anchor.set(0.5);
    name.position.set(0, -h / 2 + 94);
    if (name.width > w - 14) name.scale.set((w - 14) / name.width);
    c.addChild(name);

    // status row
    const row = new PIXI.Container();
    row.position.set(0, h / 2 - 24);
    c.addChild(row);
    if (locked) {
      const lock = makeIcon('lock', 20);
      lock.x = -26;
      row.addChild(lock);
      const t = new PIXI.Text('Lv ' + it.lvl, textStyle(16, 0x9a8aa8, 0xffffff, 2));
      t.anchor.set(0, 0.5);
      t.x = -12;
      row.addChild(t);
    } else if (equipped) {
      const t = new PIXI.Text('★ Wearing', textStyle(16, 0xc78a00, 0xffffff, 2));
      t.anchor.set(0.5);
      row.addChild(t);
    } else if (owned) {
      const t = new PIXI.Text('Tap to wear', textStyle(15, PALETTE.purple, 0xffffff, 2));
      t.anchor.set(0.5);
      row.addChild(t);
    } else {
      const coin = makeIcon('coin', 20);
      coin.x = -26;
      row.addChild(coin);
      const t = new PIXI.Text(it.price === 0 ? 'Free' : fmt(it.price), textStyle(17, afford ? 0x2f9e57 : 0xd1274b, 0xffffff, 2));
      t.anchor.set(0, 0.5);
      t.x = -12;
      row.addChild(t);
    }

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', (e) => {
      if (this.scrollCapture) return;
      this.onCardTap(it, c, G.ev(e));
    });
    return c;
  }

  onCardTap(it, card, gp) {
    const lv = level();
    if (lv < it.lvl) {
      Sfx.bad();
      shake(card, 6, 250);
      floatText(gp.x, gp.y - 20, `Reach Lv ${it.lvl}!`, { fill: 0xffffff, stroke: 0x9a8aa8 });
      return;
    }
    if (isOwned(it.id)) {
      // toggle equip
      const isOn = save.eq[it.cat] === it.id;
      const required = ['hair', 'dress', 'shoes'].includes(it.cat);
      if (isOn && required) { Sfx.tap(); return; }
      equip(it.cat, isOn ? null : it.id);
      Sfx.equip();
      sparkleBurst(this.char.x, this.char.y - this.charSpot.h / 2, { n: 16 });
      this.renderChar();
      this.buildGrid();
      return;
    }
    if (!spendCoins(it.price)) {
      Sfx.bad();
      shake(card, 6, 250);
      floatText(gp.x, gp.y - 20, 'Need more coins!', { fill: 0xffffff, stroke: 0xd1274b });
      floatText(gp.x, gp.y + 8, 'Play minigames to earn ✨', { size: 18, fill: 0xffffff, stroke: 0xd66d9e, dur: 1300 });
      return;
    }
    // bought!
    ownItem(it.id);
    equip(it.cat, it.id);
    Sfx.buy();
    sparkleBurst(gp.x, gp.y, { n: 20, power: 1.3 });
    floatText(gp.x, gp.y - 30, it.name + ' ♥', { fill: 0xffe08a });
    this.hud.refresh();
    this.renderChar();
    this.buildGrid();
  }

  update(ms) {
    if (this.char && !this.char.destroyed) this.char.charUpdate(ms);
  }
}
