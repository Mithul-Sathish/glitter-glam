// Wardrobe: shop + dress-up in one place. Named category tabs, a scrolling
// grid of items, a "My Look" tab for skin / hair colour / eyes / face
// features, saved look slots, Shuffle, and a Snap photo button.
// Owned items equip instantly, anything else can be tried on before buying;
// Mythic pieces open a Trials sheet that shows what you must achieve first.

import { G } from '../game.js';
import { save, spendCoins, ownItem, isOwned, equip, level, persist } from '../save.js';
import { CATS, SKINS, DYES, EYE_COLORS, FEATURES, byCat, byId, isMythic } from '../items.js';
import { trialReport, trialsMet } from '../mythic.js';
import { isNight } from '../theme.js';
import { makeButton, makeHUD, makeBackground, makePanel, makeIcon, iconButton, textStyle, rarityStars, PALETTE } from '../ui.js';
import { characterAtHeight, playerOpts } from '../character.js';
import { sparkleBurst, floatText, shake, confetti } from '../effects.js';
import { tween, Ease } from '../tween.js';
import { Sfx } from '../sound.js';
import { happytime } from '../portal.js';
import { lighten, darken, fmt, clamp, choice, mixColor } from '../util.js';

const TABS = [...CATS, { id: 'look', name: 'My Look', icon: 'face' }];
const MYTHIC_BG = 0x2b1a4f;

export class WardrobeScene {
  constructor(params) { this.params = params; this.ambient = true; }

  build(W, H) {
    const r = this.root;
    r.addChild(makeBackground(W, H, 0xf3e4ff, 0xe3c8fa, 0xffffff));
    const portrait = H > W * 0.9;
    this.portrait = portrait;
    this.cat = this.params.cat || 'dress';
    this.preview = null; // item being tried on (not yet owned)

    // ---- character preview area ----
    const charAreaW = portrait ? W : W * 0.42;
    const charAreaH = portrait ? H * 0.40 : H;
    const area = portrait
      ? { x: 10, y: 66, w: W - 20, h: charAreaH - 76 }
      : { x: 10, y: 70, w: charAreaW - 20, h: H - 84 };
    this.area = area;
    const vg = new PIXI.Graphics();
    vg.beginFill(0xffffff, isNight() ? 0.14 : 0.35);
    vg.drawRoundedRect(area.x, area.y, area.w, area.h, 24);
    vg.endFill();
    r.addChild(vg);

    const ch = portrait ? area.h * 0.88 : Math.min(H * 0.6, 460);
    this.charSpot = {
      x: area.x + area.w / 2,
      feetY: portrait ? area.y + area.h * 0.95 : Math.min(area.y + area.h - 96, H * 0.5 + ch / 2),
      h: ch,
    };
    this.charBase = { ...this.charSpot };
    this.charLayer = new PIXI.Container();
    r.addChild(this.charLayer);
    this.renderChar();

    // ---- saved looks (left of the character) ----
    this.looksBox = new PIXI.Container();
    r.addChild(this.looksBox);
    this.looksPos = { x: area.x + 34, y: area.y + 30 };
    this.refreshLooks();

    // ---- shuffle + snap (right of the character) ----
    const bx = area.x + area.w - 36;
    const mini = (kind, color, label, y, fn) => {
      const b = iconButton(kind, 46, color, fn);
      b.position.set(bx, y);
      r.addChild(b);
      const t = new PIXI.Text(label, textStyle(11, 0xffffff, darken(color, 0.3), 3));
      t.anchor.set(0.5);
      t.position.set(bx, y + 33);
      r.addChild(t);
    };
    mini('dice', PALETTE.pink, 'SHUFFLE', area.y + 36, () => this.shuffleOutfit());
    mini('camera', PALETTE.purple, 'SNAP', area.y + 104, () => this.snapPhoto());

    // ---- tabs (icon + NAME) ----
    const gridX = portrait ? 0 : charAreaW;
    const gridW = portrait ? W : W - charAreaW;
    const tabsY = portrait ? 66 + charAreaH + 2 : 74;
    const perRow = portrait ? 4 : TABS.length;
    const tabGap = 6;
    const tabW = Math.min(portrait ? 200 : 104, (gridW - 16 - tabGap * (perRow - 1)) / perRow);
    const tabH = portrait ? 40 : 60;
    const rowsN = Math.ceil(TABS.length / perRow);
    const tabsW = perRow * tabW + (perRow - 1) * tabGap;
    const tabsX0 = gridX + (gridW - tabsW) / 2;
    this.tabGeom = { tabW, tabH, portrait };
    const tabs = new PIXI.Container();
    TABS.forEach((cat, i) => {
      const b = new PIXI.Container();
      b.bgG = new PIXI.Graphics();
      b.addChild(b.bgG);
      b.catId = cat.id;
      b.catMeta = cat;
      b.position.set(
        tabsX0 + tabW / 2 + (i % perRow) * (tabW + tabGap),
        tabsY + tabH / 2 + Math.floor(i / perRow) * (tabH + tabGap),
      );
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
      tabs.addChild(b);
    });
    r.addChild(tabs);
    this.tabs = tabs;
    this.refreshTabs();

    // ---- scrollable grid ----
    const gy = tabsY + rowsN * (tabH + tabGap) + 2;
    this.gridArea = { x: gridX + 8, y: gy, w: gridW - 16, h: H - gy - 8 };
    this.gridBox = new PIXI.Container();
    r.addChild(this.gridBox);
    this.scrollUi = new PIXI.Container();
    r.addChild(this.scrollUi);
    this.buildGrid();

    // ---- back ----
    const back = iconButton('back', 52, PALETTE.purple, async () => {
      const { MenuScene } = await import('./menu.js');
      G.go(MenuScene);
    });
    back.position.set(38, H - 44);
    r.addChild(back);

    this.hud = makeHUD(W);
    r.addChild(this.hud);

    // mouse wheel anywhere over the grid, even if Pixi misses it
    this.wheelHandler = (e) => {
      if (!this.scroller || this.modal) return;
      const px = e.clientX / G.S, py = e.clientY / G.S;
      const a = this.gridArea;
      if (px < a.x || px > a.x + a.w || py < a.y || py > a.y + a.h) return;
      this.scroller.by(e.deltaY * 0.7);
      e.preventDefault();
    };
    G.app.view.addEventListener('wheel', this.wheelHandler, { passive: false });
    // arrow / page keys scroll too
    this.keyHandler = (e) => {
      if (!this.scroller || this.modal) return;
      const step = { ArrowDown: 90, ArrowUp: -90, PageDown: 300, PageUp: -300 }[e.key];
      if (step) { this.scroller.by(step, true); e.preventDefault(); }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  dispose() {
    if (this.wheelHandler) G.app.view.removeEventListener('wheel', this.wheelHandler);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }

  refreshTabs() {
    const { tabW, tabH, portrait } = this.tabGeom;
    for (const b of this.tabs.children) {
      const active = b.catId === this.cat;
      const bg = b.bgG;
      bg.clear();
      bg.beginFill(active ? PALETTE.pink : 0xffffff, active ? 1 : 0.9);
      bg.drawRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 14);
      bg.endFill();
      bg.lineStyle({ width: 3, color: active ? 0xffffff : 0xe8b8d8 });
      bg.drawRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 14);
      bg.lineStyle(0);
      if (b.ic) { b.ic.destroy(); b.nameT.destroy(); }
      const ic = makeIcon(b.catMeta.icon, portrait ? 20 : 24, active ? 0xffffff : undefined);
      const nameT = new PIXI.Text(b.catMeta.name, { ...textStyle(12, active ? 0xffffff : PALETTE.text, 0xffffff, 0), fontWeight: '800' });
      if (portrait) {
        // icon left, name right
        const room = tabW - 36;
        if (nameT.width > room) nameT.scale.set(room / nameT.width);
        const total = 24 + nameT.width;
        ic.position.set(-total / 2 + 10, 0);
        nameT.anchor.set(0, 0.5);
        nameT.position.set(-total / 2 + 24, 0);
      } else {
        // icon above, name below
        if (nameT.width > tabW - 8) nameT.scale.set((tabW - 8) / nameT.width);
        ic.position.set(0, -10);
        nameT.anchor.set(0.5);
        nameT.position.set(0, 17);
      }
      b.addChild(ic, nameT);
      b.ic = ic;
      b.nameT = nameT;
    }
  }

  /** Equipped set plus whatever is being tried on. */
  effEq() {
    const eq = { ...save.eq };
    if (this.preview) eq[this.preview.cat] = this.preview.id;
    return eq;
  }

  renderChar() {
    if (this.char && !this.char.destroyed) this.char.destroy({ children: true });
    // portrait: while trying something on she steps up and shrinks a little,
    // so the try-on bar sits under her feet instead of over her shoes
    if (this.portrait) {
      const trying = !!this.preview;
      this.charSpot.h = this.charBase.h * (trying ? 0.76 : 1);
      this.charSpot.feetY = trying ? this.area.y + this.area.h - 72 : this.charBase.feetY;
    }
    this.char = characterAtHeight(this.effEq(), save.skin, this.charSpot.h, playerOpts());
    this.char.position.set(this.charSpot.x, this.charSpot.feetY);
    this.charLayer.addChild(this.char);
    const s = this.charSpot.h / 560;
    this.char.scale.set(s * 0.92);
    tween(this.char.scale, { x: s, y: s }, 350, { ease: Ease.backOut });
  }

  charMid() { return { x: this.charSpot.x, y: this.charSpot.feetY - this.charSpot.h / 2 }; }

  // ------------------------------ scrolling ------------------------------

  /**
   * A scroll region. Listeners live on the BOX that contains the cards, so a
   * drag or wheel that starts on a card bubbles up and scrolls (previously
   * the cards swallowed the gesture and only the gaps between them scrolled).
   */
  makeScroller() {
    const { x, y, w, h } = this.gridArea;
    const box = this.gridBox;
    box.removeAllListeners();
    box.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.scrollUi.removeChildren().forEach((c) => c.destroy({ children: true }));

    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(x, y, w, h, 18);
    mask.endFill();
    box.addChild(mask);
    const content = new PIXI.Container();
    content.mask = mask;
    box.addChild(content);
    box.eventMode = 'static';
    box.hitArea = new PIXI.Rectangle(x, y, w, h);

    const thumb = new PIXI.Graphics();
    this.scrollUi.addChild(thumb);
    const mkArrow = (dir) => {
      const b = iconButton('back', 40, PALETTE.pink, () => sc.by(dir * (h - 60), true));
      b.rotation = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      b.position.set(x + w - 28, dir > 0 ? y + h - 28 : y + 28);
      this.scrollUi.addChild(b);
      return b;
    };
    const down = mkArrow(1), up = mkArrow(-1);

    let max = 0, scrollY = 0, startY = 0, startScroll = 0, dragging = false, moved = 0, vel = 0, lastY = 0;
    const paint = () => {
      thumb.clear();
      down.visible = max > 0 && scrollY < max - 4;
      up.visible = max > 0 && scrollY > 4;
      if (max <= 0) return;
      const th = Math.max(36, h * (h / (h + max)));
      const ty = y + 4 + (h - 8 - th) * clamp(scrollY / max, 0, 1);
      thumb.beginFill(PALETTE.pinkDark, 0.18);
      thumb.drawRoundedRect(x + w - 7, y + 4, 5, h - 8, 2.5);
      thumb.endFill();
      thumb.beginFill(PALETTE.pink, 0.85);
      thumb.drawRoundedRect(x + w - 7, ty, 5, th, 2.5);
      thumb.endFill();
    };
    const sc = {
      content,
      setHeight: (ch) => { max = Math.max(0, ch - h + 16); scrollY = clamp(scrollY, 0, max); content.y = -scrollY; paint(); },
      by: (dy, smooth) => {
        scrollY = clamp(scrollY + dy, 0, max);
        if (smooth) tween(content, { y: -scrollY }, 260, { ease: Ease.quadOut });
        else content.y = -scrollY;
        paint();
      },
    };

    box.on('pointerdown', (e) => {
      dragging = true; moved = 0;
      startY = e.global.y / G.S; lastY = startY; startScroll = scrollY; vel = 0;
    });
    box.on('globalpointermove', (e) => {
      if (!dragging) return;
      const py = e.global.y / G.S;
      const dy = py - startY;
      moved = Math.max(moved, Math.abs(dy));
      vel = py - lastY;
      lastY = py;
      if (moved > 8) {
        this.scrollCapture = true; // cards check this to swallow the tap
        scrollY = clamp(startScroll - dy, -40, max + 40);
        content.y = -scrollY;
        paint();
      }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      setTimeout(() => { this.scrollCapture = false; }, 0);
      const target = clamp(Math.abs(vel) > 3 ? scrollY - vel * 12 : scrollY, 0, max);
      scrollY = target;
      tween(content, { y: -target }, Math.abs(vel) > 3 ? 450 : 300, { ease: Ease.cubicOut });
      paint();
    };
    box.on('pointerup', end);
    box.on('pointerupoutside', end);
    this.scroller = sc;
    return sc;
  }

  buildGrid() {
    if (this.cat === 'look') return this.buildLookPanel();
    const { x, y, w } = this.gridArea;
    const sc = this.makeScroller();
    const lv = level();
    const items = byCat(this.cat).slice().sort((a, b) => (isMythic(a) - isMythic(b)) || a.lvl - b.lvl || a.price - b.price);

    const cols = Math.max(2, Math.floor(w / 180));
    const cw = (w - 10) / cols;
    const chh = 148;
    items.forEach((it, i) => {
      const card = this.makeCard(it, cw - 12, chh - 10, lv);
      card.position.set(x + (i % cols) * cw + cw / 2, y + Math.floor(i / cols) * chh + chh / 2);
      sc.content.addChild(card);
      card.alpha = 0;
      card.scale.set(0.8);
      tween(card, { alpha: 1 }, 200, { delay: Math.min(i, 12) * 30 });
      tween(card.scale, { x: 1, y: 1 }, 300, { delay: Math.min(i, 12) * 30, ease: Ease.backOut });
    });
    sc.setHeight(Math.ceil(items.length / cols) * chh + (this.portrait ? 56 : 0));
  }

  makeCard(it, w, h, lv) {
    const c = new PIXI.Container();
    const owned = isOwned(it.id);
    const equipped = save.eq[it.cat] === it.id;
    const locked = lv < it.lvl;
    const afford = save.coins >= it.price;
    const mythic = isMythic(it);
    const trial = mythic && !owned && !trialsMet(it);

    const bg = new PIXI.Graphics();
    const base = mythic ? MYTHIC_BG : equipped ? 0xfff0b8 : 0xffffff;
    bg.beginFill(darken(PALETTE.pink, 0.3), 0.25);
    bg.drawRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 18);
    bg.endFill();
    bg.beginFill(base, locked && !mythic ? 0.6 : 0.97);
    bg.drawRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.endFill();
    bg.lineStyle({ width: 3, color: equipped || mythic ? PALETTE.gold : locked ? 0xcdbcd8 : 0xf3c8e2 });
    bg.drawRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(0);
    c.addChild(bg);

    // swatch: category icon tinted with item colours on a soft circle
    const main = it.p.c1 ?? 0xffc0dd;
    const sw = new PIXI.Graphics();
    sw.beginFill(mythic ? 0x4a3380 : lighten(main, 0.55));
    sw.drawCircle(0, 0, 30);
    sw.endFill();
    sw.lineStyle({ width: 2, color: mythic ? 0xc39aec : darken(main, 0.1), alpha: 0.5 });
    sw.drawCircle(0, 0, 30);
    sw.lineStyle(0);
    sw.position.set(0, -h / 2 + 40);
    c.addChild(sw);
    const catMeta = CATS.find((cc) => cc.id === it.cat);
    // very pale items get a darker tint so they don't vanish into the swatch
    const pale = ((main >> 16) & 255) + ((main >> 8) & 255) + (main & 255) > 700;
    const ic = makeIcon(catMeta.icon, 38, mythic ? lighten(it.p.c2 || main, 0.2) : pale ? darken(main, 0.22) : main);
    ic.position.set(0, -h / 2 + 40);
    c.addChild(ic);

    const stars = rarityStars(it.rar, 11);
    stars.position.set(0, -h / 2 + 76);
    c.addChild(stars);

    const name = new PIXI.Text(it.name, { ...textStyle(15, mythic ? 0xffe9b0 : PALETTE.text, 0xffffff, 0), fontWeight: '700' });
    name.anchor.set(0.5);
    name.position.set(0, -h / 2 + 96);
    if (name.width > w - 14) name.scale.set((w - 14) / name.width);
    c.addChild(name);

    // status row
    const row = new PIXI.Container();
    row.position.set(0, h / 2 - 24);
    c.addChild(row);
    const status = (iconKind, label, color, stroke = 0xffffff) => {
      const t = new PIXI.Text(label, textStyle(16, color, stroke, mythic ? 0 : 2));
      t.anchor.set(0, 0.5);
      let iw = 0;
      if (iconKind) {
        const i2 = makeIcon(iconKind, 20);
        iw = 26;
        i2.x = -(t.width + iw) / 2 + 10;
        row.addChild(i2);
      }
      t.x = -(t.width + iw) / 2 + iw;
      row.addChild(t);
    };
    if (equipped) status(null, '★ Wearing', mythic ? 0xffd35c : 0xc78a00);
    else if (owned) status(null, 'Tap to wear', mythic ? 0xd9c8ff : PALETTE.purple);
    else if (locked) status('lock', 'Lv ' + it.lvl, mythic ? 0xc9b8e8 : 0x9a8aa8);
    else if (trial) {
      const rep = trialReport(it);
      status('mythic', `Trials ${rep.done}/${rep.total}`, 0xd9c8ff);
    } else status('coin', it.price === 0 ? 'Free' : fmt(it.price), mythic ? (afford ? 0x8ff0b8 : 0xff9ab0) : afford ? 0x2f9e57 : 0xd1274b);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      if (this.scrollCapture) return;
      this.onCardTap(it);
    });
    return c;
  }

  onCardTap(it) {
    const mid = this.charMid();
    if (isOwned(it.id)) {
      // toggle equip
      if (this.preview) this.clearPreview(false);
      const isOn = save.eq[it.cat] === it.id;
      const required = ['hair', 'dress', 'shoes'].includes(it.cat);
      if (isOn && required) { Sfx.tap(); return; }
      equip(it.cat, isOn ? null : it.id);
      Sfx.equip();
      sparkleBurst(mid.x, mid.y, { n: 16 });
      this.renderChar();
      this.buildGridKeepScroll();
      return;
    }
    // Not owned (locked or not): try it on first — dressing up IS the game.
    this.preview = it;
    Sfx.equip();
    sparkleBurst(mid.x, mid.y, { n: 14 });
    this.renderChar();
    this.buildTryBar();
  }

  /** Rebuild the grid without throwing the player back to the top. */
  buildGridKeepScroll() {
    const y0 = this.scroller ? -this.scroller.content.y : 0;
    this.buildGrid();
    if (this.scroller && y0) this.scroller.by(y0);
  }

  clearPreview(rerender = true) {
    this.preview = null;
    if (this.tryBar && !this.tryBar.destroyed) this.tryBar.destroy({ children: true });
    this.tryBar = null;
    if (rerender) this.renderChar();
  }

  buildTryBar() {
    if (this.tryBar && !this.tryBar.destroyed) this.tryBar.destroy({ children: true });
    const it = this.preview;
    if (!it) return;
    const lv = level();
    const locked = lv < it.lvl;
    const afford = save.coins >= it.price;
    const mythic = isMythic(it);
    const trial = mythic && !trialsMet(it);
    const bar = new PIXI.Container();

    // The buy button uses the SAME coin icon as the HUD and the cards.
    let label, icon, color;
    if (mythic) { label = 'Trials'; icon = 'mythic'; color = 0x7a4fd0; }
    else if (locked) { label = 'Lv ' + it.lvl; icon = 'lock'; color = 0x9a8aa8; }
    else if (it.price === 0) { label = 'Free!'; icon = null; color = PALETTE.mint; }
    else { label = fmt(it.price); icon = 'coin'; color = afford ? PALETTE.mint : PALETTE.pink; }
    const buy = makeButton(label, {
      w: Math.max(112, label.length * 11 + 66), h: 44, color, fontSize: 18, icon,
      onTap: () => (mythic ? this.openTrials(it) : this.tryBuy(it)),
    });
    const close = iconButton('close', 38, 0xb9a8b8, () => this.clearPreview());
    const maxW = Math.min(this.area.w - 8, 340);
    const textW = maxW - buy.width - 38 - 44;
    const small = new PIXI.Text(locked ? 'Trying on (locked)' : trial ? 'Trying on (Mythic)' : 'Trying on', { ...textStyle(11, 0xffe08a, 0x5a1f3c, 0), fontWeight: '800' });
    small.anchor.set(0, 0.5);
    const name = new PIXI.Text(it.name, { ...textStyle(15, 0xffffff, 0x5a1f3c, 0), fontWeight: '900' });
    name.anchor.set(0, 0.5);
    if (name.width > textW) name.scale.set(textW / name.width);
    const w = maxW;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x8a3060, 0.93);
    bg.drawRoundedRect(-w / 2, -30, w, 60, 22);
    bg.endFill();
    bg.lineStyle({ width: 3, color: 0xffd35c, alpha: 0.9 });
    bg.drawRoundedRect(-w / 2, -30, w, 60, 22);
    bg.lineStyle(0);
    bar.addChild(bg);
    small.position.set(-w / 2 + 16, -11);
    name.position.set(-w / 2 + 16, 8);
    bar.addChild(small, name);
    close.position.set(w / 2 - 28, 0);
    buy.position.set(w / 2 - 54 - buy.width / 2, 0);
    bar.addChild(buy, close);

    bar.position.set(this.charSpot.x, Math.min(this.charSpot.feetY + 44, this.area.y + this.area.h - 34));
    bar.scale.set(0.7);
    tween(bar.scale, { x: 1, y: 1 }, 320, { ease: Ease.backOut });
    this.root.addChild(bar);
    this.tryBar = bar;
    if (this.hud) this.root.addChild(this.hud);
  }

  tryBuy(it) {
    const gp = this.charMid();
    const lv = level();
    const fail = (a, b) => {
      Sfx.bad();
      if (this.tryBar) shake(this.tryBar, 6, 250);
      floatText(gp.x, gp.y - 20, a, { size: 20, fill: 0xffffff, stroke: 0xd1274b });
      if (b) floatText(gp.x, gp.y + 8, b, { size: 16, fill: 0xffffff, stroke: 0xd66d9e, dur: 1300 });
      return false;
    };
    if (lv < it.lvl) return fail(`Reach Lv ${it.lvl} first`, 'Play minigames to level up');
    if (isMythic(it) && !trialsMet(it)) return fail('Finish its trials first');
    if (!spendCoins(it.price)) return fail('Need more coins!', 'Play minigames to earn more');
    ownItem(it.id);
    equip(it.cat, it.id);
    this.clearPreview(false);
    Sfx.buy();
    sparkleBurst(gp.x, gp.y, { n: 20, power: 1.3 });
    floatText(gp.x, gp.y - 30, it.name + ' ♥', { fill: 0xffe08a });
    if (isMythic(it)) { confetti(G.W, 120); Sfx.fanfare(); happytime(); }
    this.hud.refresh();
    this.renderChar();
    this.buildGridKeepScroll();
    return true;
  }

  // ------------------------------ Mythic trials sheet ------------------------------

  openModal(pw, ph, border) {
    const W = G.W, H = G.H;
    const ov = new PIXI.Container();
    const dim = new PIXI.Graphics();
    dim.beginFill(0x1a0a2e, 0.7);
    dim.drawRect(0, 0, W, H);
    dim.endFill();
    dim.eventMode = 'static';
    ov.addChild(dim);
    const box = new PIXI.Container();
    box.position.set(W / 2, H / 2);
    box.addChild(makePanel(pw, ph, { border }));
    ov.addChild(box);
    const fit = Math.min(1, (H - 12) / ph, (W - 8) / pw);
    box.scale.set(fit * 0.75);
    tween(box.scale, { x: fit, y: fit }, 340, { ease: Ease.backOut });
    ov.alpha = 0;
    tween(ov, { alpha: 1 }, 200);
    this.root.addChild(ov);
    this.modal = ov;
    const close = () => {
      this.modal = null;
      if (!ov.destroyed) tween(ov, { alpha: 0 }, 160, { onDone: () => !ov.destroyed && ov.destroy({ children: true }) });
    };
    const x = iconButton('close', 40, 0xb9a8b8, close);
    x.position.set(pw / 2 - 30, -ph / 2 + 30);
    box.addChild(x);
    return { ov, box, close };
  }

  openTrials(it) {
    const rep = trialReport(it);
    const lv = level();
    const rows = [
      { label: 'Reach level', have: Math.min(lv, it.lvl), need: it.lvl, done: lv >= it.lvl, text: `${Math.min(lv, it.lvl)} / ${it.lvl}` },
      ...rep.trials,
    ];
    const pw = Math.min(420, G.W - 16);
    const ph = 210 + rows.length * 62;
    const { box, close } = this.openModal(pw, ph, PALETTE.gold);
    const top = -ph / 2;

    const badge = makeIcon('mythic', 40);
    badge.position.set(-pw / 2 + 40, top + 40);
    box.addChild(badge);
    const tag = new PIXI.Text('MYTHIC TRIALS', { ...textStyle(12, 0x7a4fd0, 0xffffff, 0), letterSpacing: 2 });
    tag.anchor.set(0, 0.5);
    tag.position.set(-pw / 2 + 68, top + 28);
    box.addChild(tag);
    const nm = new PIXI.Text(it.name, textStyle(22, PALETTE.text, 0xffffff, 0));
    nm.anchor.set(0, 0.5);
    nm.position.set(-pw / 2 + 68, top + 52);
    if (nm.width > pw - 130) nm.scale.set((pw - 130) / nm.width);
    box.addChild(nm);
    const sub = new PIXI.Text('Coins alone can\'t buy this. Prove yourself first!', { ...textStyle(13, PALETTE.purple, 0xffffff, 0), fontWeight: '700' });
    sub.anchor.set(0.5);
    sub.position.set(0, top + 88);
    if (sub.width > pw - 30) sub.scale.set((pw - 30) / sub.width);
    box.addChild(sub);

    rows.forEach((t, i) => {
      const y = top + 136 + i * 62;
      const rw = pw - 40;
      const g = new PIXI.Graphics();
      g.beginFill(t.done ? 0xe9f8ef : 0xf7effb);
      g.drawRoundedRect(-rw / 2, y - 26, rw, 52, 14);
      g.endFill();
      box.addChild(g);
      const lab = new PIXI.Text(t.label, { ...textStyle(14, PALETTE.text, 0xffffff, 0), fontWeight: '800' });
      lab.anchor.set(0, 0.5);
      lab.position.set(-rw / 2 + 12, y - 10);
      if (lab.width > rw - 130) lab.scale.set((rw - 130) / lab.width);
      box.addChild(lab);
      const val = new PIXI.Text(t.text, { ...textStyle(13, t.done ? 0x2f9e57 : 0x9a6ab0, 0xffffff, 0), fontWeight: '800' });
      val.anchor.set(1, 0.5);
      val.position.set(rw / 2 - (t.done ? 40 : 12), y - 10);
      box.addChild(val);
      if (t.done) {
        const ok = makeIcon('check', 22);
        ok.position.set(rw / 2 - 20, y - 10);
        box.addChild(ok);
      }
      const bw = rw - 24;
      const bar = new PIXI.Graphics();
      bar.beginFill(0xe2d0ea);
      bar.drawRoundedRect(-rw / 2 + 12, y + 8, bw, 9, 4.5);
      bar.endFill();
      bar.beginFill(t.done ? 0x46c791 : 0x9a6ee0);
      bar.drawRoundedRect(-rw / 2 + 12, y + 8, Math.max(9, bw * Math.min(1, t.need ? t.have / t.need : 1)), 9, 4.5);
      bar.endFill();
      box.addChild(bar);
    });

    const ready = rows.every((t) => t.done);
    const afford = save.coins >= it.price;
    const btn = makeButton(fmt(it.price), {
      w: 210, h: 54, icon: 'coin', fontSize: 22, enabled: ready,
      color: afford ? PALETTE.gold : PALETTE.pink,
      onTap: () => { if (this.tryBuy(it)) close(); else { close(); } },
    });
    btn.position.set(0, top + ph - 46);
    box.addChild(btn);
    const note = new PIXI.Text(
      ready ? (afford ? 'All trials passed — it\'s yours to claim!' : `Trials passed! Save up ${fmt(it.price - save.coins)} more coins.`) : 'Finish every trial to unlock the price tag.',
      { ...textStyle(12, ready ? 0x2f9e57 : 0x9a8aa8, 0xffffff, 0), fontWeight: '800' },
    );
    note.anchor.set(0.5);
    note.position.set(0, top + ph - 86);
    if (note.width > pw - 24) note.scale.set((pw - 24) / note.width);
    box.addChild(note);
  }

  // ------------------------------ My Look (face + colours) ------------------------------

  buildLookPanel() {
    const { x, y, w } = this.gridArea;
    const sc = this.makeScroller();
    const c = sc.content;
    const pad = 14;
    let cy = y + 10;
    const panelG = new PIXI.Graphics();
    c.addChild(panelG);

    const heading = (label) => {
      const t = new PIXI.Text(label.toUpperCase(), { ...textStyle(13, PALETTE.pinkDark, 0xffffff, 0), letterSpacing: 1.5 });
      t.position.set(x + pad, cy);
      c.addChild(t);
      cy += 24;
    };
    const tapGuard = (fn) => () => { if (!this.scrollCapture) fn(); };
    const apply = () => { persist(); Sfx.equip(); this.renderChar(); this.refreshLooks(); this.buildGridKeepScroll(); };

    const swatches = (label, list, isActive, draw, pick) => {
      heading(label);
      const size = 40, gap = 8;
      const per = Math.max(1, Math.floor((w - pad * 2 + gap) / (size + gap)));
      list.forEach((entry, i) => {
        const b = new PIXI.Graphics();
        const active = isActive(i);
        draw(b, entry, size / 2 - 3);
        b.lineStyle({ width: active ? 4 : 2, color: active ? PALETTE.pink : 0xffffff });
        b.drawCircle(0, 0, size / 2 - 1);
        b.lineStyle(0);
        if (active) {
          b.lineStyle({ width: 2, color: 0xffffff });
          b.drawCircle(0, 0, size / 2 + 2);
          b.lineStyle(0);
        }
        b.position.set(x + pad + size / 2 + (i % per) * (size + gap), cy + size / 2 + Math.floor(i / per) * (size + gap));
        b.eventMode = 'static';
        b.cursor = 'pointer';
        b.hitArea = new PIXI.Circle(0, 0, size / 2 + 3);
        b.on('pointertap', tapGuard(() => { pick(i); apply(); }));
        c.addChild(b);
      });
      cy += Math.ceil(list.length / per) * (size + gap) + 10;
    };

    swatches('Skin tone', SKINS, (i) => save.skin === i,
      (b, col, r) => { b.beginFill(col); b.drawCircle(0, 0, r); b.endFill(); },
      (i) => { save.skin = i; });

    swatches('Hair colour', DYES, (i) => (save.look.hairDye || 0) === i,
      (b, d, r) => {
        if (d.hex == null) {
          // "natural" = the hairstyle's own colour
          b.beginFill(0xffffff); b.drawCircle(0, 0, r); b.endFill();
          b.lineStyle({ width: 4, color: PALETTE.pink, cap: PIXI.LINE_CAP.ROUND });
          b.moveTo(-r * 0.55, r * 0.55); b.lineTo(r * 0.55, -r * 0.55);
          b.lineStyle(0);
        } else {
          b.beginFill(d.hex); b.drawCircle(0, 0, r); b.endFill();
          b.beginFill(lighten(d.hex, 0.4), 0.8); b.drawEllipse(-r * 0.3, -r * 0.4, r * 0.35, r * 0.18); b.endFill();
        }
      },
      (i) => { save.look.hairDye = i; });

    swatches('Eye colour', EYE_COLORS, (i) => (save.look.eyeColor || 0) === i,
      (b, e, r) => {
        b.beginFill(0xffffff); b.drawCircle(0, 0, r); b.endFill();
        b.beginFill(e.hex); b.drawCircle(0, 0, r * 0.66); b.endFill();
        b.beginFill(0x2a1a12); b.drawCircle(0, 0, r * 0.3); b.endFill();
        b.beginFill(0xffffff); b.drawCircle(-r * 0.25, -r * 0.28, r * 0.17); b.endFill();
      },
      (i) => { save.look.eyeColor = i; });

    // feature pills
    for (const f of FEATURES) {
      heading(f.name);
      let px = x + pad, rowH = 34;
      f.opts.forEach((opt, i) => {
        const active = (save.look[f.key] || 0) === i;
        const t = new PIXI.Text(opt, { ...textStyle(13, active ? 0xffffff : PALETTE.text, 0xffffff, 0), fontWeight: '800' });
        const pw = t.width + 24;
        if (px + pw > x + w - pad) { px = x + pad; cy += rowH + 6; }
        const b = new PIXI.Container();
        const g = new PIXI.Graphics();
        g.beginFill(active ? PALETTE.pink : 0xffffff);
        g.drawRoundedRect(0, 0, pw, rowH, rowH / 2);
        g.endFill();
        g.lineStyle({ width: 2, color: active ? 0xffffff : 0xe8b8d8 });
        g.drawRoundedRect(0, 0, pw, rowH, rowH / 2);
        g.lineStyle(0);
        b.addChild(g);
        t.anchor.set(0.5);
        t.position.set(pw / 2, rowH / 2);
        b.addChild(t);
        b.position.set(px, cy);
        b.eventMode = 'static';
        b.cursor = 'pointer';
        b.on('pointertap', tapGuard(() => { save.look[f.key] = i; apply(); }));
        c.addChild(b);
        px += pw + 8;
      });
      cy += rowH + 14;
    }

    const contentH = cy - y + 6;
    panelG.beginFill(0xffffff, 0.55);
    panelG.drawRoundedRect(x + 2, y, w - 14, contentH, 18);
    panelG.endFill();
    sc.setHeight(contentH + (this.portrait ? 66 : 10));
  }

  // ------------------------------ saved looks ------------------------------

  refreshLooks() {
    const box = this.looksBox;
    box.removeChildren().forEach((c) => c.destroy({ children: true }));
    const { x, y } = this.looksPos;
    const size = 46, gap = 8;
    const title = new PIXI.Text('LOOKS', textStyle(11, 0xffffff, PALETTE.pinkDark, 3));
    title.anchor.set(0.5);
    title.position.set(x, y - 14);
    box.addChild(title);
    const fits = Math.max(2, Math.min(save.looks.length, Math.floor((this.area.h - 40) / (size + gap))));
    for (let i = 0; i < fits; i++) {
      const look = save.looks[i];
      const slot = new PIXI.Container();
      slot.position.set(x, y + 10 + size / 2 + i * (size + gap));
      const g = new PIXI.Graphics();
      g.beginFill(look ? 0xfff6fb : 0xffffff, look ? 1 : 0.55);
      g.drawRoundedRect(-size / 2, -size / 2, size, size, 12);
      g.endFill();
      g.lineStyle({ width: 2.5, color: look ? PALETTE.pink : 0xd9b8e8 });
      g.drawRoundedRect(-size / 2, -size / 2, size, size, 12);
      g.lineStyle(0);
      slot.addChild(g);
      if (look) {
        // a little live portrait of the saved look
        const m = new PIXI.Graphics();
        m.beginFill(0xffffff);
        m.drawRoundedRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4, 10);
        m.endFill();
        slot.addChild(m);
        const p = characterAtHeight(look.eq, look.skin, 130, { look: look.look });
        p.position.set(0, 352 * (130 / 560) + 4);
        p.mask = m;
        slot.addChild(p);
        const del = new PIXI.Graphics();
        del.beginFill(0xd1274b); del.drawCircle(0, 0, 9); del.endFill();
        del.lineStyle({ width: 2.5, color: 0xffffff, cap: PIXI.LINE_CAP.ROUND });
        del.moveTo(-3.5, -3.5); del.lineTo(3.5, 3.5); del.moveTo(3.5, -3.5); del.lineTo(-3.5, 3.5);
        del.lineStyle(0);
        del.position.set(size / 2 - 3, -size / 2 + 3);
        del.eventMode = 'static';
        del.cursor = 'pointer';
        del.hitArea = new PIXI.Circle(0, 0, 13);
        del.on('pointertap', (e) => {
          e.stopPropagation();
          save.looks[i] = null;
          persist();
          Sfx.tap();
          this.refreshLooks();
        });
        slot.addChild(del);
      } else {
        const plus = new PIXI.Graphics();
        plus.lineStyle({ width: 4, color: 0xc99ad8, cap: PIXI.LINE_CAP.ROUND });
        plus.moveTo(-9, 0); plus.lineTo(9, 0); plus.moveTo(0, -9); plus.lineTo(0, 9);
        plus.lineStyle(0);
        slot.addChild(plus);
      }
      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.on('pointertap', () => {
        const mid = this.charMid();
        if (!save.looks[i]) {
          save.looks[i] = { eq: { ...save.eq }, skin: save.skin, look: { ...save.look } };
          persist();
          Sfx.buy();
          floatText(mid.x, mid.y, `Look ${i + 1} saved!`, { size: 22, fill: 0xffe08a });
          sparkleBurst(slot.x, slot.y, { n: 12 });
        } else {
          const lk = save.looks[i];
          // only wear pieces that are still owned
          for (const cat of Object.keys(save.eq)) {
            const id = lk.eq[cat];
            if (id == null || isOwned(id)) save.eq[cat] = id ?? null;
          }
          save.skin = lk.skin;
          save.look = { ...save.look, ...lk.look };
          persist();
          if (this.preview) this.clearPreview(false);
          Sfx.equip();
          floatText(mid.x, mid.y, `Look ${i + 1} on!`, { size: 22, fill: 0xffffff });
          sparkleBurst(mid.x, mid.y, { n: 18 });
          this.renderChar();
          this.buildGrid();
        }
        this.refreshLooks();
      });
      box.addChild(slot);
    }
  }

  shuffleOutfit() {
    if (this.preview) this.clearPreview(false);
    for (const cat of CATS) {
      const owned = byCat(cat.id).filter((it) => isOwned(it.id));
      const required = ['hair', 'dress', 'shoes'].includes(cat.id);
      if (!owned.length) continue;
      if (!required && Math.random() < 0.3) { save.eq[cat.id] = null; continue; }
      save.eq[cat.id] = choice(owned).id;
    }
    persist();
    Sfx.sparkle();
    const mid = this.charMid();
    sparkleBurst(mid.x, mid.y, { n: 22, power: 1.2 });
    this.renderChar();
    this.buildGridKeepScroll();
  }

  // ------------------------------ Snap: take a photo ------------------------------

  snapPhoto() {
    if (this.modal) return;
    if (this.preview) this.clearPreview();
    const PW = 480, PH = 640;
    // compose the photo off-screen
    const shot = new PIXI.Container();
    const bg = new PIXI.Graphics();
    const night = isNight();
    for (let i = 0; i < 32; i++) {
      bg.beginFill(mixColor(night ? 0x3a2a6e : 0xffc7e4, night ? 0x1c1440 : 0xc9a8f5, i / 31));
      bg.drawRect(0, (PH / 32) * i, PW, PH / 32 + 1);
      bg.endFill();
    }
    for (let i = 0; i < 46; i++) {
      bg.beginFill(0xffffff, 0.25 + Math.random() * 0.5);
      const sx = Math.random() * PW, sy = Math.random() * PH, sr = 2 + Math.random() * 5;
      bg.drawPolygon([sx, sy - sr, sx + sr * 0.3, sy - sr * 0.3, sx + sr, sy, sx + sr * 0.3, sy + sr * 0.3, sx, sy + sr, sx - sr * 0.3, sy + sr * 0.3, sx - sr, sy, sx - sr * 0.3, sy - sr * 0.3]);
      bg.endFill();
    }
    bg.beginFill(0xffffff, 0.3);
    bg.drawEllipse(PW / 2, PH - 86, 170, 30);
    bg.endFill();
    shot.addChild(bg);
    const model = characterAtHeight(save.eq, save.skin, 470, playerOpts());
    model.position.set(PW / 2, PH - 90);
    shot.addChild(model);
    const cap = new PIXI.Text('Glitter & Glam', { ...textStyle(30, 0xffffff, 0xc2447c, 6) });
    cap.anchor.set(0.5);
    cap.position.set(PW / 2, PH - 38);
    shot.addChild(cap);
    // clip to the photo rectangle (wings and auras can poke outside)
    const clip = new PIXI.Graphics();
    clip.beginFill(0xffffff); clip.drawRect(0, 0, PW, PH); clip.endFill();
    shot.addChild(clip);
    shot.mask = clip;

    let canvas = null;
    try {
      const rt = PIXI.RenderTexture.create({ width: PW, height: PH, resolution: 2 });
      G.app.renderer.render(shot, { renderTexture: rt });
      canvas = G.app.renderer.extract.canvas(rt);
      rt.destroy(true);
    } catch (e) { canvas = null; }
    shot.destroy({ children: true });

    // camera flash
    Sfx.clap();
    const flash = new PIXI.Graphics();
    flash.beginFill(0xffffff);
    flash.drawRect(0, 0, G.W, G.H);
    flash.endFill();
    this.root.addChild(flash);
    tween(flash, { alpha: 0 }, 420, { onDone: () => !flash.destroyed && flash.destroy() });
    if (!canvas) { floatText(G.W / 2, G.H / 2, 'Photo not supported here', { size: 20 }); return; }

    const ph = 566, pw = 340;
    const { box, close } = this.openModal(pw, ph, PALETTE.purple);
    const tex = PIXI.Texture.from(canvas);
    const frame = new PIXI.Graphics();
    const fw = 264, fh = 352;
    frame.beginFill(0xffffff);
    frame.drawRoundedRect(-fw / 2 - 10, -fh / 2 - 10, fw + 20, fh + 20, 8);
    frame.endFill();
    frame.lineStyle({ width: 2, color: 0xe3c8dc });
    frame.drawRoundedRect(-fw / 2 - 10, -fh / 2 - 10, fw + 20, fh + 20, 8);
    frame.lineStyle(0);
    const pic = new PIXI.Sprite(tex);
    pic.anchor.set(0.5);
    pic.width = fw; pic.height = fh;
    const polaroid = new PIXI.Container();
    polaroid.addChild(frame, pic);
    polaroid.position.set(0, -28);
    polaroid.rotation = -0.03;
    box.addChild(polaroid);
    const title = new PIXI.Text('Picture perfect!', textStyle(20, PALETTE.pink, 0xffffff, 0));
    title.anchor.set(0.5);
    title.position.set(-16, -ph / 2 + 30);
    box.addChild(title);

    const dl = makeButton('Save photo', {
      w: 160, h: 48, color: PALETTE.mint, fontSize: 17,
      onTap: () => {
        try {
          const a = document.createElement('a');
          a.download = 'glitter-glam-look.png';
          a.href = canvas.toDataURL('image/png');
          document.body.appendChild(a);
          a.click();
          a.remove();
          floatText(G.W / 2, G.H / 2, 'Photo saved!', { size: 24, fill: 0xffe08a });
        } catch (e) {
          floatText(G.W / 2, G.H / 2, 'Could not save here', { size: 20 });
        }
      },
    });
    dl.position.set(-pw / 2 + 92, ph / 2 - 44);
    box.addChild(dl);
    const free = save.looks.findIndex((l) => !l);
    const keep = makeButton(free >= 0 ? 'Keep look' : 'Looks full', {
      w: 140, h: 48, color: PALETTE.purple, fontSize: 17, enabled: free >= 0,
      onTap: () => {
        const slot = save.looks.findIndex((l) => !l);
        if (slot < 0) return;
        save.looks[slot] = { eq: { ...save.eq }, skin: save.skin, look: { ...save.look } };
        persist();
        Sfx.buy();
        this.refreshLooks();
        floatText(G.W / 2, G.H / 2, `Saved as Look ${slot + 1}!`, { size: 24, fill: 0xffe08a });
        close();
      },
    });
    keep.position.set(pw / 2 - 82, ph / 2 - 44);
    box.addChild(keep);
  }

  update(ms) {
    if (this.char && !this.char.destroyed) this.char.charUpdate(ms);
  }
}
