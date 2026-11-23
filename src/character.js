// Procedurally drawn chibi character with layered, customizable outfit pieces.
// Coordinate space: feet at (0,0), roughly 300 wide and 500 tall (negative y up).
// createCharacter() returns a Container with an .update(ms) idle animator.

import { byId, SKINS, DYES, EYE_COLORS, LIP_COLORS } from './items.js';
import { save } from './save.js';
import { rand, starPoints, drawHeart, drawSparkle, darken, lighten, drawDiamond, mixColor } from './util.js';

/** Options that draw the player's own face, hair dye and eye colour. */
export function playerOpts() { return { look: save.look }; }

const HEAD_Y = -352;
const HEAD_R = 86;
const SHOULDER_Y = -292;
const HIP_Y = -158;

export function createCharacter(eq, skinIdx = 0, opts = {}) {
  const root = new PIXI.Container();
  const skin = SKINS[skinIdx % SKINS.length];
  const look = opts.look || {};
  let hair = eq.hair ? byId[eq.hair] : null;
  // hair dye recolours any hairstyle (Mythic hair keeps its own night-sky palette)
  const dye = look.hairDye ? DYES[look.hairDye % DYES.length] : null;
  if (hair && dye && dye.hex != null && hair.rar < 6) {
    hair = { ...hair, p: { ...hair.p, c1: dye.hex, c2: lighten(dye.hex, 0.3), tips: undefined } };
  }
  const dress = eq.dress ? byId[eq.dress] : null;
  const shoes = eq.shoes ? byId[eq.shoes] : null;
  const hat = eq.hat ? byId[eq.hat] : null;
  const neck = eq.neck ? byId[eq.neck] : null;
  const bag = eq.bag ? byId[eq.bag] : null;
  const special = eq.special ? byId[eq.special] : null;

  const anim = { t: rand(0, 1000), blinkAt: rand(1500, 4000), blinking: 0, wingT: 0, butterflies: [] };

  // ---------- special: behind layers ----------
  let wings = null;
  if (special && special.p.style === 'wings') {
    wings = drawWings(special.p);
    root.addChild(wings);
  }

  // Wearing any 5★ piece makes the whole look shimmer subtly.
  const maxRar = Math.max(0, ...Object.values(eq).filter(Boolean).map((id) => (byId[id] ? byId[id].rar : 0)));
  anim.maxRar = maxRar;
  if (maxRar >= 5) {
    const lux = new PIXI.Container();
    root.addChild(lux);
    anim.lux = lux;
  }

  // ---------- back hair ----------
  if (hair) root.addChild(drawBackHair(hair.p));

  // ---------- body ----------
  const body = new PIXI.Graphics();
  // legs
  body.beginFill(skin);
  body.drawRoundedRect(-31, -165, 24, 160, 11);
  body.drawRoundedRect(7, -165, 24, 160, 11);
  body.endFill();
  root.addChild(body);

  // ---------- shoes ----------
  if (shoes) root.addChild(drawShoes(shoes.p));

  // ---------- torso + dress ----------
  const torso = new PIXI.Graphics();
  torso.beginFill(skin);
  torso.moveTo(-40, SHOULDER_Y);
  torso.bezierCurveTo(-34, -230, -30, -210, -34, HIP_Y);
  torso.lineTo(34, HIP_Y);
  torso.bezierCurveTo(30, -210, 34, -230, 40, SHOULDER_Y);
  torso.closePath();
  torso.endFill();
  // neck
  torso.beginFill(skin);
  torso.drawRect(-10, -302, 20, 20);
  torso.endFill();
  root.addChild(torso);

  if (dress) root.addChild(drawDress(dress.p));

  // ---------- arms ----------
  const arms = new PIXI.Graphics();
  for (const s of [-1, 1]) {
    arms.lineStyle({ width: 17, color: skin, cap: PIXI.LINE_CAP.ROUND });
    arms.moveTo(s * 36, -282);
    arms.quadraticCurveTo(s * 58, -240, s * 52, -178);
    arms.lineStyle(0);
    arms.beginFill(skin);
    arms.drawCircle(s * 52, -174, 11);
    arms.endFill();
  }
  root.addChild(arms);

  // ---------- bag (hangs from right hand) ----------
  if (bag) root.addChild(drawBag(bag.p));

  // ---------- wand (left hand) ----------
  if (special && special.p.style === 'wand') {
    const w = drawWand(special.p);
    root.addChild(w);
    anim.wand = w;
  }

  // ---------- necklace ----------
  if (neck) root.addChild(drawNecklace(neck.p));

  // ---------- head ----------
  const head = new PIXI.Graphics();
  head.beginFill(skin);
  head.drawEllipse(0, HEAD_Y, HEAD_R * 0.94, HEAD_R * 0.88);
  head.endFill();
  // ears
  head.beginFill(skin);
  head.drawCircle(-HEAD_R * 0.92, HEAD_Y + 8, 12);
  head.drawCircle(HEAD_R * 0.92, HEAD_Y + 8, 12);
  head.endFill();
  root.addChild(head);

  // ---------- face ----------
  const face = drawFace(look, skin, hair ? darken(hair.p.c1, 0.3) : 0x5b3a29);
  root.addChild(face);
  anim.eyesOpen = face.eyesOpen;
  anim.eyesClosed = face.eyesClosed;

  // ---------- front hair ----------
  if (hair) root.addChild(drawFrontHair(hair.p));

  // ---------- hat / hair deco ----------
  if (hat) root.addChild(drawHat(hat.p));

  // ---------- butterflies / orbiting stars special ----------
  if (special && special.p.style === 'butterflies') {
    const bl = new PIXI.Container();
    for (let i = 0; i < 5; i++) {
      const b = drawButterfly(special.p.c1);
      b.meta = { phase: rand(0, Math.PI * 2), rad: rand(90, 150), speed: rand(0.4, 0.8), h: rand(-380, -120) };
      bl.addChild(b);
      anim.butterflies.push(b);
    }
    root.addChild(bl);
  }
  if (special && special.p.style === 'orbit') {
    const bl = new PIXI.Container();
    for (let i = 0; i < 6; i++) {
      const b = new PIXI.Graphics();
      b.beginFill(special.p.c1);
      b.drawPolygon(starPoints(0, 0, 5, rand(8, 13), rand(4, 6)));
      b.endFill();
      b.beginFill(0xffffff, 0.7);
      b.drawCircle(-2, -3, 2.5);
      b.endFill();
      b.meta = { phase: (i / 6) * Math.PI * 2, rad: rand(100, 135), speed: rand(0.5, 0.7), h: rand(-330, -180) };
      bl.addChild(b);
      anim.butterflies.push(b); // same orbital animator
    }
    root.addChild(bl);
  }

  if (special && special.p.style === 'planet') {
    const o = drawOrbit(special.p);
    o.c.position.set(92, -318);
    root.addChild(o.c);
    anim.moons = o.moons;
  }

  // ---------- auras (Glitter Aura, Heart Halo, Snow Shimmer): drawn IN FRONT so they are easy to see ----------
  if (special && special.p.style === 'aura') {
    anim.auraParts = buildAura(root, special.p);
  }

  anim.wings = wings;

  root.charUpdate = (ms) => {
    anim.t += ms;
    // blink
    anim.blinkAt -= ms;
    if (anim.blinkAt <= 0 && anim.blinking <= 0) anim.blinking = 140;
    if (anim.blinking > 0) {
      anim.blinking -= ms;
      const closed = anim.blinking > 0;
      anim.eyesOpen.visible = !closed;
      anim.eyesClosed.visible = closed;
      if (!closed) anim.blinkAt = rand(1800, 5000);
    }
    // wings flutter
    if (anim.wings) anim.wings.scale.x = 1 + Math.sin(anim.t / 260) * 0.06;
    // wand twinkle
    if (anim.wand) anim.wand.rotation = Math.sin(anim.t / 700) * 0.06;
    // auras
    if (anim.auraParts) updateAura(anim.auraParts, anim.t);
    // Cosmic Orbit moons
    if (anim.moons) {
      anim.moons.forEach((m, i) => {
        const o = m.meta;
        const a2 = anim.t / 1000 * (0.9 + i * 0.25) + i * 2.1;
        const lx = Math.cos(a2) * o.rx, ly = Math.sin(a2) * o.ry;
        m.x = lx * Math.cos(o.rot) - ly * Math.sin(o.rot);
        m.y = lx * Math.sin(o.rot) + ly * Math.cos(o.rot);
        m.rotation = a2;
      });
    }
    // luxury shimmer for 5★ looks
    if (anim.lux && Math.random() < 0.05) {
      const g = new PIXI.Graphics();
      g.beginFill(Math.random() < 0.5 ? 0xffffff : 0xffe08a, 0.95);
      drawSparkle(g, 0, 0, rand(3, 7));
      g.endFill();
      g.x = rand(-95, 95); g.y = rand(-500, -10);
      anim.lux.addChild(g);
      g.meta = { life: 700, t: 0 };
    }
    if (anim.lux) {
      for (const g of [...anim.lux.children]) {
        g.meta.t += ms;
        g.alpha = 1 - g.meta.t / g.meta.life;
        g.rotation += ms / 300;
        if (g.meta.t >= g.meta.life) g.destroy();
      }
    }
    // butterflies orbit
    for (const b of anim.butterflies) {
      const m = b.meta;
      const a = anim.t / 1000 * m.speed + m.phase;
      b.x = Math.cos(a) * m.rad;
      b.y = m.h + Math.sin(a * 1.7) * 40;
      b.scale.x = (Math.cos(a) > 0 ? 1 : -1) * (0.8 + Math.sin(anim.t / 90 + m.phase) * 0.2);
    }
  };

  root.charUpdate(0); // place animated pieces so even a still photo shows them
  return root;
}

// ============================== face ==============================

function drawFace(look, skin, browColor) {
  const face = new PIXI.Container();
  const iris = EYE_COLORS[(look.eyeColor || 0) % EYE_COLORS.length].hex;
  const shape = look.eyeShape || 0;   // 0 round, 1 almond, 2 cat-eye, 3 sleepy, 4 sparkle
  const lashes = look.lashes || 0;    // 0 classic, 1 long, 2 bare
  const brows = look.brows || 0;      // 0 soft, 1 arched, 2 straight, 3 bold
  const mouth = look.mouth || 0;      // 0 sweet, 1 grin, 2 smirk, 3 pout, 4 cat
  const lip = LIP_COLORS[(look.lips || 0) % LIP_COLORS.length];
  const blush = look.blush || 0;      // 0 pink, 1 peach, 2 rosy, 3 none
  const marks = look.marks || 0;      // 0 none, 1 freckles, 2 beauty mark, 3 dimples, 4 heart, 5 star
  const LASH = 0x3a2a22;

  const eyesOpen = new PIXI.Graphics();
  const rw = [15, 16.5, 16, 15, 16][shape], rh = [19, 14.5, 16, 15, 20.5][shape];
  for (const s of [-1, 1]) {
    const ex = s * 34, ey = HEAD_Y + 10;
    eyesOpen.beginFill(0xffffff); eyesOpen.drawEllipse(ex, ey, rw, rh); eyesOpen.endFill();
    const iy = ey + rh * 0.14;
    eyesOpen.beginFill(iris); eyesOpen.drawEllipse(ex, iy, rw * 0.7, rh * 0.74); eyesOpen.endFill();
    eyesOpen.beginFill(0x2a1a12); eyesOpen.drawEllipse(ex, iy + 1, rw * 0.4, rh * 0.46); eyesOpen.endFill();
    eyesOpen.beginFill(0xffffff);
    eyesOpen.drawCircle(ex - 4, ey - rh * 0.16, 4.2);
    eyesOpen.drawCircle(ex + 5, ey + rh * 0.42, 2.2);
    eyesOpen.endFill();
    if (shape === 4) {
      eyesOpen.beginFill(0xffffff, 0.95);
      drawSparkle(eyesOpen, ex + 5, ey - rh * 0.3, 5);
      eyesOpen.endFill();
    }
    let lidY = ey - rh * 0.68, peak = ey - rh * 1.16;
    if (shape === 3) {
      // sleepy: a soft lid lowered over the top of the eye
      eyesOpen.beginFill(skin);
      eyesOpen.drawRect(ex - rw - 2, ey - rh - 2, rw * 2 + 4, rh * 0.72);
      eyesOpen.endFill();
      lidY = ey - rh * 0.3; peak = ey - rh * 0.5;
    }
    eyesOpen.lineStyle({ width: lashes === 2 ? 2.6 : 4, color: LASH, cap: PIXI.LINE_CAP.ROUND });
    eyesOpen.moveTo(ex - rw, lidY);
    eyesOpen.quadraticCurveTo(ex, peak, ex + rw, lidY);
    if (shape === 2) { // cat-eye flick
      eyesOpen.moveTo(ex + s * rw, lidY);
      eyesOpen.lineTo(ex + s * (rw + 9), lidY - 8);
    }
    if (lashes === 1) {
      eyesOpen.lineStyle({ width: 2.6, color: LASH, cap: PIXI.LINE_CAP.ROUND });
      for (const [dx, dy] of [[0.55, -0.18], [0.85, 0.0], [1.05, 0.22]]) {
        const bx = ex + s * rw * dx, by = lidY - (1 - dx) * (lidY - peak) * 0.55;
        eyesOpen.moveTo(bx, by);
        eyesOpen.lineTo(bx + s * 7, by - 7 + dy * 10);
      }
    }
    eyesOpen.lineStyle(0);
    // brows
    const by = ey - rh - 11;
    eyesOpen.lineStyle({ width: brows === 3 ? 6 : 3.5, color: browColor, cap: PIXI.LINE_CAP.ROUND });
    if (brows === 1) { // arched: lifts toward the outside
      eyesOpen.moveTo(ex - s * 13, by + 3);
      eyesOpen.quadraticCurveTo(ex + s * 4, by - 9, ex + s * 14, by - 1);
    } else if (brows === 2) {
      eyesOpen.moveTo(ex - 13, by - 2); eyesOpen.lineTo(ex + 13, by - 2);
    } else {
      eyesOpen.moveTo(ex - 13, by);
      eyesOpen.quadraticCurveTo(ex, by - 6, ex + 13, by);
    }
    eyesOpen.lineStyle(0);
  }
  const eyesClosed = new PIXI.Graphics();
  for (const s of [-1, 1]) {
    const ex = s * 34, ey = HEAD_Y + 12;
    eyesClosed.lineStyle({ width: 4.5, color: LASH, cap: PIXI.LINE_CAP.ROUND });
    eyesClosed.moveTo(ex - 13, ey);
    eyesClosed.quadraticCurveTo(ex, ey + 8, ex + 13, ey);
  }
  eyesClosed.visible = false;

  const m = new PIXI.Graphics();
  // blush
  if (blush !== 3) {
    const [bc, ba, bw, bh] = [[0xff8aa8, 0.4, 13, 8], [0xffa46a, 0.42, 13, 8], [0xff5f8f, 0.5, 16, 10]][blush] || [0xff8aa8, 0.4, 13, 8];
    m.beginFill(bc, ba);
    m.drawEllipse(-52, HEAD_Y + 34, bw, bh);
    m.drawEllipse(52, HEAD_Y + 34, bw, bh);
    m.endFill();
  }
  // details
  const ink = darken(skin, 0.32);
  if (marks === 1) {
    m.beginFill(ink, 0.75);
    for (const [fx, fy] of [[-58, 26], [-48, 30], [-40, 24], [-52, 20], [58, 26], [48, 30], [40, 24], [52, 20], [-6, 30], [6, 30], [0, 25]]) m.drawCircle(fx, HEAD_Y + fy, 2);
    m.endFill();
  } else if (marks === 2) {
    m.beginFill(0x3a2a22); m.drawCircle(-50, HEAD_Y + 44, 2.8); m.endFill();
  } else if (marks === 3) {
    m.lineStyle({ width: 2.5, color: ink, alpha: 0.8, cap: PIXI.LINE_CAP.ROUND });
    m.moveTo(-26, HEAD_Y + 42); m.quadraticCurveTo(-30, HEAD_Y + 48, -26, HEAD_Y + 54);
    m.moveTo(26, HEAD_Y + 42); m.quadraticCurveTo(30, HEAD_Y + 48, 26, HEAD_Y + 54);
    m.lineStyle(0);
  } else if (marks === 4) {
    m.beginFill(0xff5f9e); drawHeart(m, 54, HEAD_Y + 20, 6); m.endFill();
  } else if (marks === 5) {
    m.beginFill(0xffd35c); m.drawPolygon(starPoints(-54, HEAD_Y + 20, 5, 7, 3.2)); m.endFill();
  }
  // mouth
  const my = HEAD_Y + 46;
  if (mouth === 1) { // big grin
    m.beginFill(darken(lip, 0.35));
    m.moveTo(-13, my - 2);
    m.quadraticCurveTo(0, my + 2, 13, my - 2);
    m.quadraticCurveTo(10, my + 14, 0, my + 14);
    m.quadraticCurveTo(-10, my + 14, -13, my - 2);
    m.closePath();
    m.endFill();
    m.beginFill(0xffffff); m.drawRoundedRect(-8, my, 16, 4.5, 2); m.endFill();
    m.lineStyle({ width: 3, color: lip, cap: PIXI.LINE_CAP.ROUND });
    m.moveTo(-13, my - 2); m.quadraticCurveTo(0, my + 2, 13, my - 2);
    m.lineStyle(0);
  } else if (mouth === 2) { // smirk
    m.lineStyle({ width: 4, color: lip, cap: PIXI.LINE_CAP.ROUND });
    m.moveTo(-9, my + 3); m.quadraticCurveTo(2, my + 8, 12, my - 2);
    m.lineStyle(0);
  } else if (mouth === 3) { // pout
    m.beginFill(lip);
    m.drawEllipse(-4, my + 2, 5.5, 4);
    m.drawEllipse(4, my + 2, 5.5, 4);
    m.drawEllipse(0, my + 6, 7, 4.5);
    m.endFill();
    m.beginFill(0xffffff, 0.5); m.drawEllipse(-2, my + 6, 2.5, 1.4); m.endFill();
  } else if (mouth === 4) { // cat smile
    m.lineStyle({ width: 3.5, color: lip, cap: PIXI.LINE_CAP.ROUND });
    m.moveTo(-12, my); m.quadraticCurveTo(-6, my + 8, 0, my + 1);
    m.quadraticCurveTo(6, my + 8, 12, my);
    m.lineStyle(0);
  } else {
    m.lineStyle({ width: 4, color: lip, cap: PIXI.LINE_CAP.ROUND });
    m.moveTo(-10, my); m.quadraticCurveTo(0, my + 8, 10, my);
    m.lineStyle(0);
  }
  face.addChild(eyesOpen, eyesClosed, m);
  face.eyesOpen = eyesOpen;
  face.eyesClosed = eyesClosed;
  return face;
}

// ============================== auras ==============================

function flake(g, r, col) {
  g.lineStyle({ width: Math.max(2, r * 0.26), color: col, cap: PIXI.LINE_CAP.ROUND });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
  }
  g.lineStyle(0);
}

function buildAura(root, p) {
  const layer = new PIXI.Container();
  root.addChild(layer);
  const parts = [];
  const shape = p.shape || 'sparkle';
  const add = (g, meta) => { g.meta = meta; layer.addChild(g); parts.push(g); };
  if (shape === 'heart') {
    // a real halo: hearts circling above her head…
    for (let i = 0; i < 9; i++) {
      const g = new PIXI.Graphics();
      g.beginFill(0xffffff); drawHeart(g, 0, 0, 12); g.endFill();
      g.beginFill(p.c1); drawHeart(g, 0, 0, 9.5); g.endFill();
      g.beginFill(0xffffff, 0.7); g.drawCircle(-3, -3, 2.2); g.endFill();
      add(g, { kind: 'ring', ph: (i / 9) * Math.PI * 2 });
    }
    // …and more drifting up beside her
    for (let i = 0; i < 8; i++) {
      const g = new PIXI.Graphics();
      const r = rand(7, 12);
      g.beginFill(0xffffff, 0.9); drawHeart(g, 0, 0, r + 2); g.endFill();
      g.beginFill(i % 2 ? lighten(p.c1, 0.35) : p.c1); drawHeart(g, 0, 0, r); g.endFill();
      add(g, { kind: 'rise', x: (i % 2 ? 1 : -1) * rand(84, 140), ph: i / 8, speed: rand(0.8, 1.2), sway: rand(0, 6) });
    }
  } else if (shape === 'flake') {
    for (let i = 0; i < 18; i++) {
      const g = new PIXI.Graphics();
      const r = rand(7, 13);
      flake(g, r + 1.5, 0x6fb4e6);
      flake(g, r, 0xffffff);
      g.beginFill(p.c1); g.drawCircle(0, 0, r * 0.28); g.endFill();
      add(g, { kind: 'fall', x: rand(-150, 150), ph: i / 18 + rand(0, 0.04), speed: rand(0.8, 1.25), sway: rand(0, 6), spin: rand(-1, 1) });
    }
  } else {
    for (let i = 0; i < 16; i++) {
      const g = new PIXI.Graphics();
      const r = rand(8, 15);
      g.beginFill(p.c1); drawSparkle(g, 0, 0, r); g.endFill();
      g.beginFill(0xffffff, 0.95); drawSparkle(g, 0, 0, r * 0.5); g.endFill();
      const side = i % 2 ? 1 : -1;
      add(g, { kind: 'twinkle', x: side * rand(70, 145), y: rand(-490, -30), ph: rand(0, Math.PI * 2), speed: rand(0.7, 1.4) });
    }
  }
  return parts;
}

function updateAura(parts, t) {
  for (const g of parts) {
    const m = g.meta;
    if (m.kind === 'ring') {
      const a = t / 1300 + m.ph;
      g.x = Math.cos(a) * 78;
      g.y = HEAD_Y - HEAD_R - 26 + Math.sin(a) * 17;
      const front = (Math.sin(a) + 1) / 2;
      g.scale.set(0.72 + front * 0.4);
      g.alpha = 0.6 + front * 0.4;
    } else if (m.kind === 'rise') {
      const u = (t / 3600 * m.speed + m.ph) % 1;
      g.x = m.x + Math.sin(u * 7 + m.sway) * 12;
      g.y = -40 - u * 400;
      g.alpha = Math.sin(u * Math.PI);
      g.scale.set(0.7 + u * 0.5);
    } else if (m.kind === 'fall') {
      const u = (t / 4200 * m.speed + m.ph) % 1;
      g.x = m.x + Math.sin(u * 8 + m.sway) * 16;
      g.y = -530 + u * 540;
      g.alpha = Math.min(1, Math.sin(u * Math.PI) * 1.6);
      g.rotation = t / 900 * m.spin;
    } else {
      const k = Math.abs(Math.sin(t / 520 * m.speed + m.ph));
      g.x = m.x; g.y = m.y;
      g.scale.set(0.25 + k * 0.95);
      g.alpha = 0.35 + k * 0.65;
      g.rotation = t / 1500;
    }
  }
}

// ============================== outfit pieces ==============================

function drawBackHair(p) {
  const g = new PIXI.Graphics();
  const c = p.c1;
  switch (p.style) {
    case 'long': {
      g.beginFill(c);
      g.moveTo(-88, HEAD_Y - 10);
      g.bezierCurveTo(-108, -240, -96, -170, -104, -95);
      g.quadraticCurveTo(-70, -118, -60, -90);
      g.quadraticCurveTo(-30, -120, 0, -95);
      g.quadraticCurveTo(30, -120, 60, -90);
      g.quadraticCurveTo(70, -118, 104, -95);
      g.bezierCurveTo(96, -170, 108, -240, 88, HEAD_Y - 10);
      g.arc(0, HEAD_Y - 6, 89, 0, Math.PI, true);
      g.closePath();
      g.endFill();
      if (p.tips) {
        g.beginFill(p.tips, 0.85);
        for (const x of [-85, -45, 0, 45, 85]) g.drawEllipse(x, -108, 18, 26);
        g.endFill();
      }
      break;
    }
    case 'twin': {
      g.beginFill(c);
      for (const s of [-1, 1]) {
        g.drawEllipse(s * 108, HEAD_Y + 40, 26, 78);
      }
      g.endFill();
      g.beginFill(lighten(c, 0.25));
      for (const s of [-1, 1]) g.drawEllipse(s * 104, HEAD_Y + 14, 10, 26);
      g.endFill();
      // bobbles
      g.beginFill(0xff5f9e);
      g.drawCircle(-96, HEAD_Y - 28, 10);
      g.drawCircle(96, HEAD_Y - 28, 10);
      g.endFill();
      break;
    }
    case 'pony': {
      g.beginFill(c);
      g.moveTo(60, HEAD_Y - 62);
      g.bezierCurveTo(140, HEAD_Y - 40, 128, -180, 96, -120);
      g.bezierCurveTo(112, -180, 84, -230, 62, HEAD_Y + 10);
      g.closePath();
      g.endFill();
      g.beginFill(0xffd35c);
      g.drawCircle(74, HEAD_Y - 48, 9);
      g.endFill();
      break;
    }
    case 'bob': {
      g.beginFill(c);
      g.moveTo(-92, HEAD_Y - 20);
      g.bezierCurveTo(-100, HEAD_Y + 60, -80, HEAD_Y + 86, -58, HEAD_Y + 88);
      g.lineTo(58, HEAD_Y + 88);
      g.bezierCurveTo(80, HEAD_Y + 86, 100, HEAD_Y + 60, 92, HEAD_Y - 20);
      g.arc(0, HEAD_Y - 8, 92, 0, Math.PI, true);
      g.closePath();
      g.endFill();
      break;
    }
    case 'bun': {
      g.beginFill(c);
      g.drawCircle(0, HEAD_Y - HEAD_R - 8, 34);
      g.endFill();
      g.beginFill(lighten(c, 0.2));
      g.drawCircle(-8, HEAD_Y - HEAD_R - 16, 10);
      g.endFill();
      g.beginFill(c);
      g.drawEllipse(-88, HEAD_Y + 30, 14, 30);
      g.drawEllipse(88, HEAD_Y + 30, 14, 30);
      g.endFill();
      break;
    }
    case 'curls': {
      g.beginFill(c);
      for (const [x, y, r] of [[-92, HEAD_Y + 10, 26], [-96, HEAD_Y + 55, 22], [-80, HEAD_Y + 95, 20], [92, HEAD_Y + 10, 26], [96, HEAD_Y + 55, 22], [80, HEAD_Y + 95, 20], [-60, HEAD_Y + 120, 17], [60, HEAD_Y + 120, 17]]) {
        g.drawCircle(x, y, r);
      }
      g.endFill();
      g.beginFill(lighten(c, 0.25));
      g.drawCircle(-88, HEAD_Y + 2, 9);
      g.drawCircle(96, HEAD_Y + 48, 8);
      g.endFill();
      break;
    }
    case 'starfall': {
      // night-sky hair: a long fall that fades to pale tips, with stars caught
      // in it and a couple drifting free
      g.beginFill(c);
      g.moveTo(-92, HEAD_Y - 10);
      g.bezierCurveTo(-124, -250, -110, -150, -118, -60);
      g.quadraticCurveTo(-76, -92, -58, -56);
      g.quadraticCurveTo(-28, -96, 0, -60);
      g.quadraticCurveTo(28, -96, 58, -56);
      g.quadraticCurveTo(76, -92, 118, -60);
      g.bezierCurveTo(110, -150, 124, -250, 92, HEAD_Y - 10);
      g.closePath();
      g.endFill();
      // Pale tips as STRANDS, not a wash: a soft band across the bottom spilled
      // out past the scalloped hem and read as a stray blue arc under the
      // skirt. Vertical streaks stay inside the silhouette at any scale.
      const tip = p.tips || lighten(c, 0.5);
      for (const [tx, ty, tw, th] of [[-96, -108, 10, 34], [-62, -92, 9, 28], [-24, -108, 8, 26], [26, -100, 9, 30], [64, -88, 8, 24], [98, -112, 10, 32]]) {
        g.beginFill(tip, 0.5);
        g.drawEllipse(tx, ty, tw, th);
        g.endFill();
        g.beginFill(tip, 0.28);
        g.drawEllipse(tx, ty - th * 0.9, tw * 0.8, th * 0.7);
        g.endFill();
      }
      // shine sweep
      g.beginFill(p.c2 || lighten(c, 0.32), 0.5);
      g.drawEllipse(-70, -210, 15, 62);
      g.drawEllipse(72, -196, 12, 50);
      g.endFill();
      // stars caught in the fall
      g.beginFill(0xfff3b0, 0.95);
      for (const [x, y, sz] of [[-88, -232, 9], [82, -252, 7], [-64, -132, 6], [96, -150, 8], [-100, -84, 5], [58, -80, 6]]) {
        g.drawPolygon(starPoints(x, y, 5, sz, sz * 0.44));
      }
      g.endFill();
      g.beginFill(0xffffff, 0.9);
      for (const [x, y, sz] of [[-108, -300, 6], [104, -290, 5], [-40, -300, 4]]) drawSparkle(g, x, y, sz);
      g.endFill();
      break;
    }
  }
  return g;
}

function drawFrontHair(p) {
  const g = new PIXI.Graphics();
  const c = p.c1;
  // Shared cute bangs: scalloped fringe over the forehead.
  g.beginFill(c);
  g.moveTo(-90, HEAD_Y - 10);
  g.bezierCurveTo(-92, HEAD_Y - 80, -50, HEAD_Y - 96, 0, HEAD_Y - 94);
  g.bezierCurveTo(50, HEAD_Y - 96, 92, HEAD_Y - 80, 90, HEAD_Y - 10);
  g.quadraticCurveTo(74, HEAD_Y - 44, 58, HEAD_Y - 16);
  g.quadraticCurveTo(46, HEAD_Y - 52, 20, HEAD_Y - 34);
  g.quadraticCurveTo(0, HEAD_Y - 56, -20, HEAD_Y - 34);
  g.quadraticCurveTo(-46, HEAD_Y - 52, -58, HEAD_Y - 16);
  g.quadraticCurveTo(-74, HEAD_Y - 44, -90, HEAD_Y - 10);
  g.closePath();
  g.endFill();
  // shine
  g.beginFill(p.c2 || lighten(c, 0.3), 0.8);
  g.drawEllipse(-34, HEAD_Y - 62, 20, 8);
  g.endFill();
  return g;
}

// Where a skirt's pattern may go: the pattern is authored for a frame of
// y -140..-10, x ±85 and stretched to each silhouette, then CLIPPED to the
// dress outline so nothing can float over the legs or spill past the hem.
const SKIRT_FRAME = {
  mini: { top: -160, bot: -84, hw: 58 },
  aline: { top: -160, bot: -36, hw: 82 },
  tutu: { top: -166, bot: -100, hw: 90 },
  ball: { top: -160, bot: 6, hw: 112 },
  gown: { top: -160, bot: 4, hw: 82 },
  mermaid: { top: -160, bot: 8, hw: 78 },
  highlow: { top: -160, bot: 4, hw: 108 },
};
const ABSOLUTE_DECOS = ['zodiac', 'dragonscale', 'sakura', 'prism', 'bowline', 'none'];

function bodicePath(g, top) {
  g.moveTo(-42, top);
  g.bezierCurveTo(-34, -230, -32, -215, -36, HIP_Y - 4);
  g.lineTo(36, HIP_Y - 4);
  g.bezierCurveTo(32, -215, 34, -230, 42, top);
  g.quadraticCurveTo(0, top - 14, -42, top);
  g.closePath();
}

function skirtPath(g, top, hemY, hemW, flare) {
  g.moveTo(-36, top);
  g.bezierCurveTo(-36 - hemW * flare, (top + hemY) / 2, -hemW, hemY + 14, -hemW, hemY);
  g.quadraticCurveTo(0, hemY + 16, hemW, hemY);
  g.bezierCurveTo(hemW, hemY + 14, 36 + hemW * flare, (top + hemY) / 2, 36, top);
  g.closePath();
}

/** Trace the outer silhouette of a skirt (caller wraps in beginFill/endFill). */
function skirtSilhouette(g, style) {
  const skirtTop = HIP_Y - 8;
  switch (style) {
    case 'mini': skirtPath(g, skirtTop, -95, 62, 0.4); break;
    case 'aline': skirtPath(g, skirtTop, -46, 84, 0.5); break;
    case 'tutu': g.drawEllipse(0, -134, 92, 34); break;
    case 'ball':
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-130, -80, -125, -30, -110, -6);
      g.quadraticCurveTo(0, 18, 110, -6);
      g.bezierCurveTo(125, -30, 130, -80, 36, skirtTop);
      g.closePath();
      break;
    case 'gown':
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-70, -100, -88, -40, -80, -2);
      g.quadraticCurveTo(0, 12, 80, -2);
      g.bezierCurveTo(88, -40, 70, -100, 36, skirtTop);
      g.closePath();
      break;
    case 'mermaid':
      g.moveTo(-34, skirtTop);
      g.bezierCurveTo(-42, -110, -35, -80, -35, -40);
      g.bezierCurveTo(-70, -26, -78, -6, -84, 4);
      g.quadraticCurveTo(0, 22, 84, 4);
      g.bezierCurveTo(78, -6, 70, -26, 35, -40);
      g.bezierCurveTo(35, -80, 42, -110, 34, skirtTop);
      g.closePath();
      break;
    case 'highlow':
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-110, -90, -118, -30, -108, -6);
      g.quadraticCurveTo(0, 14, 108, -6);
      g.bezierCurveTo(118, -30, 110, -90, 36, skirtTop);
      g.closePath();
      break;
  }
}

function drawDress(p) {
  const root = new PIXI.Container();
  const g = new PIXI.Graphics();
  root.addChild(g);
  const c = p.c1, trim = p.c2 || lighten(p.c1, 0.4);
  const top = SHOULDER_Y + 6;
  const skirtTop = HIP_Y - 8;

  // ---- skirt (drawn first so the bodice sits on top of the waist seam) ----
  switch (p.style) {
    case 'mini':
    case 'aline': {
      g.beginFill(c);
      skirtSilhouette(g, p.style);
      g.endFill();
      break;
    }
    case 'tutu': {
      // A tutu sits AT the waist: an opaque underskirt so legs never show
      // through, then three layers of tulle, each a little shorter.
      g.beginFill(darken(c, 0.14));
      g.drawEllipse(0, -134, 92, 34);
      g.endFill();
      g.beginFill(c);
      g.drawEllipse(0, -139, 84, 30);
      g.endFill();
      g.beginFill(lighten(c, 0.22));
      g.drawEllipse(0, -145, 70, 25);
      g.endFill();
      g.beginFill(lighten(c, 0.4));
      g.drawEllipse(0, -151, 54, 19);
      g.endFill();
      // scalloped tulle edge
      g.beginFill(lighten(c, 0.5), 0.9);
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (i / 10);
        g.drawCircle(Math.cos(a) * 88, -134 + Math.sin(a) * 31, 5);
      }
      g.endFill();
      break;
    }
    case 'ball': {
      g.beginFill(c);
      skirtSilhouette(g, 'ball');
      g.endFill();
      // panniers shading
      g.beginFill(trim, 0.5);
      g.moveTo(0, skirtTop);
      g.bezierCurveTo(-40, -90, -34, -40, -20, -8);
      g.quadraticCurveTo(0, -2, 20, -8);
      g.bezierCurveTo(34, -40, 40, -90, 0, skirtTop);
      g.endFill();
      break;
    }
    case 'gown': {
      g.beginFill(c);
      skirtSilhouette(g, 'gown');
      g.endFill();
      // side slit shine
      g.beginFill(trim, 0.6);
      g.moveTo(10, skirtTop);
      g.bezierCurveTo(30, -100, 48, -40, 44, -4);
      g.quadraticCurveTo(28, 0, 18, -2);
      g.closePath();
      g.endFill();
      break;
    }
    case 'mermaid': {
      g.beginFill(c);
      skirtSilhouette(g, 'mermaid');
      g.endFill();
      if (p.deco !== 'dragonscale') {
        g.beginFill(trim, 0.55);
        for (let row = 0; row < 3; row++) {
          for (let i = -1; i <= 1; i++) g.drawCircle(i * 16 + (row % 2) * 8 - 4, -128 + row * 16, 7);
        }
        g.endFill();
      }
      break;
    }
    case 'highlow': {
      // party dress: long floaty back, short twirly front
      g.beginFill(darken(c, 0.12));
      skirtSilhouette(g, 'highlow');
      g.endFill();
      g.beginFill(c);
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-70, -125, -66, -95, -62, -78);
      g.quadraticCurveTo(0, -58, 62, -78);
      g.bezierCurveTo(66, -95, 70, -125, 36, skirtTop);
      g.closePath();
      g.endFill();
      break;
    }
  }

  // ---- bodice + straps ----
  g.beginFill(c);
  bodicePath(g, top);
  g.endFill();
  g.lineStyle({ width: 7, color: c, cap: PIXI.LINE_CAP.ROUND });
  g.moveTo(-26, top - 6); g.lineTo(-12, top - 22);
  g.moveTo(26, top - 6); g.lineTo(12, top - 22);
  g.lineStyle(0);

  // ---- pattern, clipped to the dress outline ----
  const deco = new PIXI.Graphics();
  drawDeco(deco, p);
  const f = SKIRT_FRAME[p.style];
  if (f && !ABSOLUTE_DECOS.includes(p.deco)) {
    const sy = (f.bot - f.top) / 130;
    deco.scale.set(f.hw / 85, sy);
    deco.y = f.top + 140 * sy;
  }
  const mask = new PIXI.Graphics();
  mask.beginFill(0xffffff);
  bodicePath(mask, top);
  mask.endFill();
  mask.beginFill(0xffffff);
  skirtSilhouette(mask, p.style);
  mask.endFill();
  root.addChild(mask);
  deco.mask = mask;
  root.addChild(deco);

  // ---- hems, belt and accents on top (never clipped) ----
  const t = new PIXI.Graphics();
  const hem = (hemW, hemY, w = 6) => {
    t.lineStyle({ width: w, color: trim, cap: PIXI.LINE_CAP.ROUND });
    t.moveTo(-hemW + 2, hemY + 1);
    t.quadraticCurveTo(0, hemY + 17, hemW - 2, hemY + 1);
    t.lineStyle(0);
  };
  if (p.style === 'mini') hem(62, -95);
  else if (p.style === 'aline') hem(84, -46);
  else if (p.style === 'ball') {
    t.lineStyle({ width: 8, color: trim, cap: PIXI.LINE_CAP.ROUND });
    t.moveTo(-108, -6);
    t.quadraticCurveTo(0, 18, 108, -6);
    t.lineStyle(0);
  } else if (p.style === 'highlow') {
    t.lineStyle({ width: 5, color: trim, cap: PIXI.LINE_CAP.ROUND });
    t.moveTo(-62, -79);
    t.quadraticCurveTo(0, -59, 62, -79);
    t.lineStyle(0);
  }
  const belt = -166;
  if (p.deco === 'bowline') {
    t.beginFill(0xd1274b);
    drawHeart(t, 0, belt - 90, 9);
    t.endFill();
    t.lineStyle({ width: 5, color: 0xffffff });
    t.moveTo(-36, belt);
    t.quadraticCurveTo(0, belt + 8, 36, belt);
    t.lineStyle(0);
  } else {
    // waist ribbon: outlined so a white ribbon still shows on a white dress
    t.beginFill(darken(trim, 0.22));
    t.drawRoundedRect(-36, belt - 6, 72, 13, 6);
    t.endFill();
    t.beginFill(trim);
    t.drawRoundedRect(-34, belt - 4, 68, 9, 4.5);
    t.endFill();
  }
  root.addChild(t);
  return root;
}

function drawDeco(g, p) {
  switch (p.deco) {
    case 'dots':
      g.beginFill(0xffffff, 0.85);
      for (const [x, y] of [[-40, -70], [10, -55], [50, -75], [-15, -95], [30, -110], [-55, -105]]) g.drawCircle(x, y, 5);
      g.endFill();
      break;
    case 'hearts':
      g.beginFill(0xffffff, 0.9);
      for (const [x, y, s] of [[-35, -80, 8], [25, -60, 9], [55, -100, 7], [-8, -112, 7], [-60, -55, 7]]) drawHeart(g, x, y, s);
      g.endFill();
      break;
    case 'stars':
      g.beginFill(0xffe08a);
      for (const [x, y, s] of [[-40, -70, 9], [20, -50, 8], [52, -90, 8], [-10, -105, 7], [-62, -40, 7], [40, -25, 6]]) {
        g.drawPolygon(starPoints(x, y, 5, s, s * 0.5));
      }
      g.endFill();
      break;
    case 'sparkle':
      g.beginFill(0xffffff, 0.95);
      for (const [x, y, s] of [[-45, -60, 7], [15, -45, 6], [55, -85, 7], [-12, -100, 6], [-70, -30, 6], [38, -120, 5], [70, -30, 6], [0, -20, 5]]) drawSparkle(g, x, y, s);
      g.endFill();
      break;
    case 'galaxy':
      g.beginFill(0xffffff, 0.9);
      for (const [x, y, s] of [[-50, -60, 3], [20, -40, 2.5], [60, -80, 3], [-15, -95, 2.5], [-80, -25, 3], [45, -115, 2], [80, -35, 2.5], [5, -15, 2]]) g.drawCircle(x, y, s);
      g.endFill();
      g.beginFill(0xff8fc7, 0.8);
      for (const [x, y, s] of [[-30, -110, 6], [65, -55, 6], [-65, -75, 5]]) drawSparkle(g, x, y, s);
      g.endFill();
      break;
    case 'stripes':
      g.beginFill(0xffffff, 0.75);
      // drawn past every edge on purpose — the dress outline clips them
      for (let i = -5; i <= 5; i++) {
        g.drawPolygon([i * 24 - 5, -150, i * 24 + 5, -150, i * 30 + 8, 10, i * 30 - 8, 10]);
      }
      g.endFill();
      break;
    case 'rainbow': {
      const bands = [0xff6f91, 0xffb45c, 0xffe066, 0x7ddba3, 0x7fb8f0, 0xb58fe8];
      bands.forEach((col, i) => {
        const rr = 42 + i * 10;
        g.lineStyle({ width: 8, color: col, alpha: 0.9 });
        g.moveTo(-rr, -58);
        g.arc(0, -58, rr, Math.PI, Math.PI * 2);
      });
      g.lineStyle(0);
      break;
    }
    case 'lace':
      g.lineStyle({ width: 4, color: 0xffffff, alpha: 0.95 });
      g.moveTo(-80, -46);
      for (let i = 0; i < 8; i++) {
        g.arc(-80 + 10 + i * 20, -46, 10, Math.PI, 0, true);
      }
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.85);
      for (let i = 0; i < 8; i++) g.drawCircle(-70 + i * 20, -60, 2.5);
      g.endFill();
      break;
    case 'petals':
      g.beginFill(0xffffff, 0.9);
      for (const [x, y, s] of [[-45, -70, 1], [20, -50, 0.8], [50, -95, 0.9], [-10, -105, 0.8], [-65, -40, 0.7], [35, -125, 0.7]]) {
        for (let pt = 0; pt < 5; pt++) {
          const a = (pt / 5) * Math.PI * 2 - Math.PI / 2;
          g.drawEllipse(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 5 * s, 4 * s, 4 * s);
        }
      }
      g.endFill();
      g.beginFill(0xffd35c);
      for (const [x, y] of [[-45, -70], [20, -50], [50, -95], [-10, -105], [-65, -40], [35, -125]]) g.drawCircle(x, y, 2.5);
      g.endFill();
      break;
    case 'ice':
      g.beginFill(0xffffff, 0.95);
      for (const [x, y, s] of [[-45, -60, 8], [15, -45, 7], [55, -85, 8], [-12, -100, 7], [-70, -30, 6], [38, -120, 6], [65, -40, 6]]) {
        g.drawPolygon(starPoints(x, y, 6, s, s * 0.22));
      }
      g.endFill();
      break;
    // ---- mythic decos (trial-locked endgame dresses) ----
    case 'zodiac': {
      // two turning orbit rings with a sun at the middle and glyph-stars pinned
      // around the outer ring, like a star chart worn as a skirt
      const cx = 0, cy = -76;
      g.lineStyle({ width: 2.5, color: 0x9bd7f5, alpha: 0.55 });
      g.drawEllipse(cx, cy, 78, 30);
      g.drawEllipse(cx, cy, 54, 62);
      g.lineStyle({ width: 2, color: 0xffe08a, alpha: 0.4 });
      g.drawCircle(cx, cy, 40);
      g.lineStyle(0);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rx = Math.cos(a) * 78, ry = Math.sin(a) * 30;
        const s = i % 3 === 0 ? 6.5 : 4;
        g.beginFill(i % 3 === 0 ? 0xffe08a : 0xffffff, 0.95);
        g.drawPolygon(starPoints(cx + rx, cy + ry, i % 3 === 0 ? 5 : 4, s, s * 0.4));
        g.endFill();
      }
      g.beginFill(0xffe08a, 0.22); g.drawCircle(cx, cy, 26); g.endFill();
      g.beginFill(0xfff3b0, 0.95); g.drawCircle(cx, cy, 13); g.endFill();
      g.beginFill(0xffffff, 0.9); g.drawCircle(cx - 4, cy - 4, 4); g.endFill();
      // a moon riding the inner ring
      g.beginFill(0xdff3fb, 0.95);
      g.drawCircle(cx + 46, cy - 40, 9);
      g.beginHole(); g.drawCircle(cx + 51, cy - 44, 6.5); g.endHole();
      g.endFill();
      break;
    }
    case 'dragonscale': {
      // Scales laid out against the mermaid silhouette itself, so they never
      // spill past the hem the way a fixed grid did. halfWidth(y) mirrors the
      // 'mermaid' path in drawDress: narrow column down to y -40, then a flare.
      const halfWidth = (y) => (y <= -40
        ? 26 + ((-40 - y) / 126) * 8          // -166..-40 : 34 -> 26
        : 26 + ((y + 40) / 44) * 58);         // -40..+4   : 26 -> 84
      const scale = (x, y, r, t) => {
        // teardrop plate: ember at the hem, deep crimson up the bodice, with a
        // dark rim so overlapping plates read as armour instead of beads
        g.lineStyle({ width: 1.4, color: 0x40060f, alpha: 0.55 });
        g.beginFill(mixColor(0xff8c2a, 0x6a0f22, t), 0.98);
        g.moveTo(x, y - r);
        g.bezierCurveTo(x + r * 0.98, y - r * 0.45, x + r * 0.82, y + r * 0.8, x, y + r * 0.9);
        g.bezierCurveTo(x - r * 0.82, y + r * 0.8, x - r * 0.98, y - r * 0.45, x, y - r);
        g.closePath();
        g.endFill();
        g.lineStyle(0);
        g.beginFill(mixColor(0xffd35c, 0xc42a1e, t), 0.85);
        g.drawEllipse(x, y - r * 0.1, r * 0.5, r * 0.45);
        g.endFill();
        g.beginFill(0xfff3b0, 0.7 - t * 0.45);
        g.drawEllipse(x - r * 0.16, y - r * 0.36, r * 0.24, r * 0.18);
        g.endFill();
      };
      let row = 0;
      for (let y = -150; y <= 2; y += 13, row++) {
        const t = Math.max(0, 1 - (y + 150) / 140);     // 1 at the waist, 0 at the hem
        const r = 7.5 + (1 - t) * 5.5;                  // plates grow toward the hem
        const hw = halfWidth(y) - r * 1.1;              // keep the whole plate inside
        if (hw <= r * 0.4) { scale(0, y, r, t); continue; }
        const step = r * 1.7;                           // < 2r so plates overlap
        const n = Math.max(1, Math.round((hw * 2) / step));
        for (let i = 0; i <= n; i++) {
          const x = -hw + (i * (hw * 2)) / n + (row % 2 ? step * 0.5 : 0);
          if (Math.abs(x) > hw) continue;
          scale(x, y, r, t);
        }
      }
      // molten seam glowing between the scales
      const seam = [[-6, -160], [5, -132], [-7, -104], [6, -74], [-8, -44], [4, -14]];
      g.lineStyle({ width: 6, color: 0xff5a1a, alpha: 0.55, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND });
      g.moveTo(seam[0][0], seam[0][1]);
      for (const [sx, sy] of seam.slice(1)) g.lineTo(sx, sy);
      g.lineStyle({ width: 2.4, color: 0xfff3b0, alpha: 0.95, cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND });
      g.moveTo(seam[0][0], seam[0][1]);
      for (const [sx, sy] of seam.slice(1)) g.lineTo(sx, sy);
      g.lineStyle(0);
      // embers lifting off the tail
      g.beginFill(0xffd35c, 0.95);
      for (const [x, y, sz] of [[-40, -18, 5], [44, -24, 4.5], [-58, -2, 4], [56, -6, 3.5], [0, -172, 4]]) drawSparkle(g, x, y, sz);
      g.endFill();
      break;
    }
    case 'sakura': {
      // blossom branch across the high hem with petals drifting off it
      g.lineStyle({ width: 4, color: 0x6b4632, alpha: 0.85, cap: PIXI.LINE_CAP.ROUND });
      g.moveTo(-92, -32);
      g.bezierCurveTo(-50, -60, -6, -52, 34, -84);
      g.moveTo(-28, -50); g.lineTo(-16, -74);
      g.moveTo(12, -62); g.lineTo(26, -44);
      g.lineStyle(0);
      const blossom = (x, y, s, a = 1) => {
        for (let k = 0; k < 5; k++) {
          const b = (k / 5) * Math.PI * 2 - 0.4;
          g.beginFill(k % 2 ? 0xffffff : 0xffc9e2, a);
          g.drawEllipse(x + Math.cos(b) * s * 0.8, y + Math.sin(b) * s * 0.8, s * 0.62, s * 0.5);
          g.endFill();
        }
        g.beginFill(0xff5f9e, a); g.drawCircle(x, y, s * 0.3); g.endFill();
      };
      for (const [x, y, s] of [[-84, -34, 9], [-46, -52, 11], [-14, -76, 9], [16, -58, 10], [36, -86, 12], [-66, -18, 8]]) blossom(x, y, s);
      // loose petals falling toward the long back hem
      g.beginFill(0xffd1dc, 0.9);
      for (const [x, y, r] of [[-70, 4, 5], [-24, -10, 4.5], [22, -4, 5], [62, -26, 4.5], [88, -8, 5], [48, 6, 4]]) {
        g.drawEllipse(x, y, r, r * 0.62);
      }
      g.endFill();
      break;
    }
    case 'prism': {
      // White light hitting a diamond at the waist and fanning out across the
      // skirt as a rainbow. Each band's length is measured against the ball
      // silhouette so the fan can never spill off the gown.
      const cx = 0, cy = -140;
      const halfW = (y) => (36 + ((y + 166) / 160) * 74) * 0.94;   // 'ball' skirt, inset
      const inside = (x, y) => y <= 4 && Math.abs(x) <= halfW(y);
      const reach = (a) => {
        let r = 24;
        while (r < 156 && inside(cx + Math.cos(a) * (r + 5), cy + Math.sin(a) * (r + 5))) r += 5;
        return r;
      };
      const bands = [0xff5f9e, 0xf5a91a, 0xffd35c, 0x46c791, 0x5ba8ec, 0x8a5fc0];
      const a0 = 0.42, span = (Math.PI - a0 * 2) / bands.length;
      bands.forEach((col, i) => {
        const s0 = a0 + i * span, s1 = s0 + span;
        const r0 = reach(s0), r1 = reach(s1), rm = reach((s0 + s1) / 2);
        g.beginFill(col, 0.6);
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(s0) * r0, cy + Math.sin(s0) * r0);
        g.quadraticCurveTo(cx + Math.cos((s0 + s1) / 2) * rm, cy + Math.sin((s0 + s1) / 2) * rm,
          cx + Math.cos(s1) * r1, cy + Math.sin(s1) * r1);
        g.closePath();
        g.endFill();
      });
      // starburst of incoming light above the stone
      g.beginFill(0xffffff, 0.85);
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.2;
        g.drawPolygon([
          cx + Math.cos(a) * 34, cy + Math.sin(a) * 34,
          cx + Math.cos(a + 0.05) * 6, cy + Math.sin(a + 0.05) * 6,
          cx + Math.cos(a - 0.05) * 6, cy + Math.sin(a - 0.05) * 6,
        ]);
      }
      g.endFill();
      // the diamond itself — outlined, or it vanishes into a white gown
      g.beginFill(0xc0a8ff, 0.3); g.drawCircle(cx, cy, 36); g.endFill();
      g.lineStyle({ width: 2.5, color: 0x8a5fc0, alpha: 0.9 });
      g.beginFill(0xffffff, 0.99); drawDiamond(g, cx, cy, 26); g.endFill();
      g.lineStyle(0);
      g.beginFill(0xc0a8ff, 0.55);
      g.drawPolygon([cx, cy - 26, cx + 20, cy, cx, cy + 26]);
      g.endFill();
      g.lineStyle({ width: 2, color: 0xffffff, alpha: 0.95 });
      g.moveTo(cx - 20, cy); g.lineTo(cx + 20, cy);
      g.moveTo(cx, cy - 26); g.lineTo(cx, cy + 26);
      g.lineStyle(0);
      g.beginFill(0xffffff, 0.95);
      for (const [x, y, sz] of [[-52, -186, 6], [46, -190, 5], [-86, -24, 5], [88, -28, 5], [0, -8, 4]]) drawSparkle(g, x, y, sz);
      g.endFill();
      break;
    }
  }
}

function drawShoes(p) {
  const g = new PIXI.Graphics();
  const c = p.c1;
  const alpha = p.glass ? 0.75 : 1;
  switch (p.style) {
    case 'flat':
      g.beginFill(c, alpha);
      g.drawRoundedRect(-36, -18, 30, 18, 8);
      g.drawRoundedRect(6, -18, 30, 18, 8);
      g.endFill();
      g.beginFill(lighten(c, 0.4));
      g.drawCircle(-21, -14, 4); g.drawCircle(21, -14, 4);
      g.endFill();
      break;
    case 'sneaker':
      g.beginFill(c, alpha);
      g.drawRoundedRect(-38, -22, 33, 22, 9);
      g.drawRoundedRect(5, -22, 33, 22, 9);
      g.endFill();
      g.beginFill(p.c2 || 0x8ec9f5);
      g.drawRoundedRect(-38, -7, 33, 7, 3);
      g.drawRoundedRect(5, -7, 33, 7, 3);
      g.endFill();
      break;
    case 'boot':
      g.beginFill(c, alpha);
      g.drawRoundedRect(-34, -64, 28, 64, 9);
      g.drawRoundedRect(6, -64, 28, 64, 9);
      g.drawRoundedRect(-38, -16, 34, 16, 7);
      g.drawRoundedRect(4, -16, 34, 16, 7);
      g.endFill();
      g.beginFill(lighten(c, 0.35));
      g.drawRoundedRect(-34, -64, 28, 8, 4);
      g.drawRoundedRect(6, -64, 28, 8, 4);
      g.endFill();
      break;
    case 'heel':
      g.beginFill(c, alpha);
      g.moveTo(-36, -20); g.quadraticCurveTo(-16, -26, -4, -12); g.lineTo(-4, -4); g.lineTo(-10, 0); g.lineTo(-30, 0); g.lineTo(-36, -8); g.closePath();
      g.moveTo(36, -20); g.quadraticCurveTo(16, -26, 4, -12); g.lineTo(4, -4); g.lineTo(10, 0); g.lineTo(30, 0); g.lineTo(36, -8); g.closePath();
      g.endFill();
      g.beginFill(darken(c, 0.15), alpha);
      g.drawRect(-34, -8, 6, 8);
      g.drawRect(28, -8, 6, 8);
      g.endFill();
      if (p.glass) {
        g.beginFill(0xffffff, 0.9);
        drawSparkle(g, -20, -16, 6);
        drawSparkle(g, 20, -16, 6);
        g.endFill();
      }
      break;
    case 'crystal': {
      // faceted heels that look grown, not cobbled — shards spraying up the ankle
      for (const s of [-1, 1]) {
        const bx = s * 20;
        g.beginFill(c, 0.82);
        g.moveTo(bx - s * 17, -22); g.quadraticCurveTo(bx, -30, bx + s * 15, -13);
        g.lineTo(bx + s * 15, -4); g.lineTo(bx + s * 9, 0); g.lineTo(bx - s * 11, 0);
        g.lineTo(bx - s * 17, -9); g.closePath();
        g.endFill();
        // facets
        g.lineStyle({ width: 1.8, color: 0xffffff, alpha: 0.9 });
        g.moveTo(bx - s * 17, -22); g.lineTo(bx, -6);
        g.moveTo(bx + s * 15, -13); g.lineTo(bx - s * 4, -2);
        g.lineStyle(0);
        // shard heel
        g.beginFill(p.c2 || 0xc39aec, 0.85);
        g.drawPolygon([bx - s * 16, -9, bx - s * 10, -9, bx - s * 13, 0]);
        g.endFill();
        // crystal spray climbing the ankle
        for (const [dx, dy, h, w] of [[-2, -26, 16, 5], [6, -30, 22, 4], [-9, -30, 12, 4]]) {
          g.beginFill(p.c2 || 0xc39aec, 0.7);
          g.drawPolygon([bx + s * dx, dy, bx + s * dx + w, dy - h, bx + s * dx + w * 2, dy]);
          g.endFill();
        }
        g.beginFill(0xffffff, 0.95);
        drawSparkle(g, bx, -18, 6);
        drawSparkle(g, bx + s * 8, -38, 4);
        g.endFill();
      }
      break;
    }
  }
  return g;
}

function drawHat(p) {
  const g = new PIXI.Graphics();
  const topY = HEAD_Y - HEAD_R + 4;
  switch (p.style) {
    case 'bow': {
      bow(g, 44, topY - 2, p.c1, 1.1);
      break;
    }
    case 'flower': {
      g.beginFill(p.c1);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.drawEllipse(48 + Math.cos(a) * 12, topY + Math.sin(a) * 12, 8, 8);
      }
      g.endFill();
      g.beginFill(p.c2 || 0xffd35c);
      g.drawCircle(48, topY, 8);
      g.endFill();
      break;
    }
    case 'beret': {
      g.beginFill(p.c1);
      g.drawEllipse(-6, topY - 10, 62, 26);
      g.endFill();
      g.beginFill(darken(p.c1, 0.2));
      g.drawCircle(-6, topY - 34, 6);
      g.endFill();
      break;
    }
    case 'bunny': {
      for (const s of [-1, 1]) {
        g.beginFill(p.c1);
        g.drawEllipse(s * 40, topY - 44, 15, 42);
        g.endFill();
        g.beginFill(p.c2 || 0xffb3d3);
        g.drawEllipse(s * 40, topY - 40, 7, 28);
        g.endFill();
      }
      g.lineStyle({ width: 6, color: p.c1 });
      g.arc(0, topY + 30, 78, -Math.PI * 0.82, -Math.PI * 0.18);
      g.lineStyle(0);
      break;
    }
    case 'tiara': {
      g.beginFill(p.c1);
      g.moveTo(-42, topY + 6);
      g.lineTo(-30, topY - 22);
      g.lineTo(-16, topY + 0);
      g.lineTo(0, topY - 34);
      g.lineTo(16, topY + 0);
      g.lineTo(30, topY - 22);
      g.lineTo(42, topY + 6);
      g.quadraticCurveTo(0, topY + 16, -42, topY + 6);
      g.closePath();
      g.endFill();
      g.beginFill(p.c2 || 0x8ec9f5);
      drawDiamond(g, 0, topY - 12, 8);
      g.endFill();
      break;
    }
    case 'halo': {
      g.lineStyle({ width: 8, color: p.c1, alpha: 0.95 });
      g.drawEllipse(0, topY - 34, 52, 13);
      g.lineStyle({ width: 3, color: 0xffffff, alpha: 0.8 });
      g.drawEllipse(0, topY - 36, 52, 12);
      g.lineStyle(0);
      break;
    }
    case 'starclips': {
      for (const s of [-1, 1]) {
        g.beginFill(p.c1);
        g.drawPolygon(starPoints(s * 58, topY + 24, 5, 14, 7));
        g.endFill();
        g.beginFill(0xffffff, 0.8);
        g.drawCircle(s * 55, topY + 20, 3);
        g.endFill();
      }
      break;
    }
    case 'bfly': {
      const bx = 48, by = topY + 6;
      g.beginFill(p.c1, 0.95);
      g.drawEllipse(bx - 10, by - 6, 10, 13);
      g.drawEllipse(bx + 10, by - 6, 10, 13);
      g.drawEllipse(bx - 7, by + 7, 7, 8);
      g.drawEllipse(bx + 7, by + 7, 7, 8);
      g.endFill();
      g.beginFill(0xffffff, 0.6);
      g.drawCircle(bx - 10, by - 8, 3.5);
      g.drawCircle(bx + 10, by - 8, 3.5);
      g.endFill();
      g.beginFill(0x5b3a29);
      g.drawEllipse(bx, by, 2.5, 10);
      g.endFill();
      break;
    }
    case 'diadem': {
      // a full imperial diadem: winged side sweeps, tall centre spire, a big
      // stone at the heart and a drop pearl under it
      const c1 = p.c1, c2 = p.c2 || 0xff5f9e;
      // wing sweeps
      for (const s of [-1, 1]) {
        g.beginFill(c1, 0.95);
        g.moveTo(s * 30, topY + 2);
        g.quadraticCurveTo(s * 74, topY - 34, s * 86, topY - 6);
        g.quadraticCurveTo(s * 62, topY - 4, s * 44, topY + 12);
        g.closePath();
        g.endFill();
        g.beginFill(lighten(c1, 0.35), 0.9);
        g.drawEllipse(s * 62, topY - 12, 10, 4);
        g.endFill();
      }
      // band + spires
      g.beginFill(c1);
      g.moveTo(-52, topY + 12);
      g.lineTo(-42, topY - 20);
      g.lineTo(-26, topY + 2);
      g.lineTo(-13, topY - 40);
      g.lineTo(0, topY - 62);
      g.lineTo(13, topY - 40);
      g.lineTo(26, topY + 2);
      g.lineTo(42, topY - 20);
      g.lineTo(52, topY + 12);
      g.quadraticCurveTo(0, topY + 24, -52, topY + 12);
      g.closePath();
      g.endFill();
      g.beginFill(lighten(c1, 0.4), 0.75);
      g.drawRoundedRect(-50, topY + 8, 100, 6, 3);
      g.endFill();
      // heart stone + halo
      g.beginFill(c2, 0.3); g.drawCircle(0, topY - 16, 20); g.endFill();
      g.beginFill(c2); drawHeart(g, 0, topY - 16, 13); g.endFill();
      g.beginFill(0xffffff, 0.85); g.drawCircle(-4, topY - 22, 3.5); g.endFill();
      // spire tips + drop pearl
      g.beginFill(0xffffff, 0.95);
      for (const [x, y, sz] of [[0, -66, 7], [-42, -22, 4.5], [42, -22, 4.5]]) drawSparkle(g, x, topY + y + 4, sz);
      g.endFill();
      g.beginFill(0xfdf6ee);
      g.drawEllipse(0, topY + 26, 6, 8);
      g.endFill();
      break;
    }
    case 'crown': {
      g.beginFill(p.c1);
      g.moveTo(-46, topY + 8);
      g.lineTo(-46, topY - 26);
      g.lineTo(-24, topY - 8);
      g.lineTo(0, topY - 38);
      g.lineTo(24, topY - 8);
      g.lineTo(46, topY - 26);
      g.lineTo(46, topY + 8);
      g.quadraticCurveTo(0, topY + 20, -46, topY + 8);
      g.closePath();
      g.endFill();
      g.beginFill(p.c2 || 0xd1274b);
      g.drawCircle(-46, topY - 28, 6); g.drawCircle(0, topY - 40, 7); g.drawCircle(46, topY - 28, 6);
      g.drawCircle(0, topY + 4, 6);
      g.endFill();
      break;
    }
  }
  return g;
}

function bow(g, x, y, c, s = 1) {
  g.beginFill(c);
  g.moveTo(x, y);
  g.bezierCurveTo(x - 34 * s, y - 26 * s, x - 40 * s, y + 14 * s, x, y + 4 * s);
  g.moveTo(x, y);
  g.bezierCurveTo(x + 34 * s, y - 26 * s, x + 40 * s, y + 14 * s, x, y + 4 * s);
  g.endFill();
  g.beginFill(darken(c, 0.18));
  g.drawCircle(x, y + 2, 7 * s);
  g.endFill();
}

function drawNecklace(p) {
  const g = new PIXI.Graphics();
  const y = -276;
  switch (p.style) {
    case 'ribbon':
      g.lineStyle({ width: 8, color: p.c1 });
      g.moveTo(-16, y - 8);
      g.quadraticCurveTo(0, y - 2, 16, y - 8);
      g.lineStyle(0);
      g.beginFill(darken(p.c1, 0.15));
      drawHeart(g, 0, y + 2, 6);
      g.endFill();
      break;
    case 'heart':
      chain(g, y, 0xd8c26a);
      g.beginFill(p.c2 || 0xf76d8e);
      drawHeart(g, 0, y + 22, 9);
      g.endFill();
      g.beginFill(0xffffff, 0.8);
      g.drawCircle(-3, y + 17, 2.5);
      g.endFill();
      break;
    case 'pearls':
      g.beginFill(p.c1);
      for (let i = -4; i <= 4; i++) {
        const t = i / 4;
        g.drawCircle(t * 24, y + 6 + (1 - t * t) * 12, 5);
      }
      g.endFill();
      break;
    case 'gem':
      chain(g, y, 0xcfd8e8);
      g.beginFill(p.c1);
      drawDiamond(g, 0, y + 24, 11);
      g.endFill();
      g.beginFill(0xffffff, 0.85);
      g.drawPolygon([0, y + 13, 5, y + 20, 0, y + 24, -5, y + 20]);
      g.endFill();
      if (p.sparkle) {
        g.beginFill(0xffffff);
        drawSparkle(g, 8, y + 16, 5);
        drawSparkle(g, -9, y + 28, 4);
        g.endFill();
      }
      break;
    case 'royalgem': {
      // a collar of set stones carrying one huge teardrop ruby
      const gold = p.c2 || 0xffd35c;
      g.lineStyle({ width: 4, color: gold, alpha: 0.95 });
      g.moveTo(-30, y - 10);
      g.quadraticCurveTo(0, y + 14, 30, y - 10);
      g.lineStyle(0);
      g.beginFill(gold);
      for (let i = -3; i <= 3; i++) {
        const t = i / 3;
        g.drawCircle(t * 28, y - 4 + (1 - t * t) * 14, 4.5);
      }
      g.endFill();
      g.beginFill(0xffffff, 0.9);
      for (let i = -3; i <= 3; i += 2) {
        const t = i / 3;
        g.drawCircle(t * 28 - 1.4, y - 5.4 + (1 - t * t) * 14, 1.5);
      }
      g.endFill();
      // setting + the stone
      g.beginFill(gold);
      g.drawPolygon([-9, y + 12, 9, y + 12, 13, y + 20, -13, y + 20]);
      g.endFill();
      g.beginFill(p.c1, 0.35); g.drawCircle(0, y + 34, 22); g.endFill();
      g.beginFill(p.c1);
      g.moveTo(0, y + 18);
      g.bezierCurveTo(16, y + 24, 17, y + 44, 0, y + 48);
      g.bezierCurveTo(-17, y + 44, -16, y + 24, 0, y + 18);
      g.closePath();
      g.endFill();
      g.beginFill(lighten(p.c1, 0.45), 0.85);
      g.drawEllipse(-4, y + 30, 4, 7);
      g.endFill();
      g.beginFill(0xffffff, 0.95);
      drawSparkle(g, 12, y + 22, 5);
      drawSparkle(g, -13, y + 40, 4);
      g.endFill();
      break;
    }
  }
  return g;
}

function chain(g, y, c) {
  g.lineStyle({ width: 3, color: c });
  g.moveTo(-20, y - 8);
  g.quadraticCurveTo(0, y + 16, 20, y - 8);
  g.lineStyle(0);
}

function drawBag(p) {
  const g = new PIXI.Graphics();
  const x = 62, y = -150; // hangs by the right hand
  switch (p.style) {
    case 'tote':
      g.lineStyle({ width: 5, color: darken(p.c1, 0.25) });
      g.moveTo(x - 12, y);
      g.quadraticCurveTo(x, y - 22, x + 12, y);
      g.lineStyle(0);
      g.beginFill(p.c1);
      g.drawRoundedRect(x - 20, y, 40, 34, 8);
      g.endFill();
      g.beginFill(0xffffff, 0.7);
      drawHeart(g, x, y + 16, 7);
      g.endFill();
      break;
    case 'purse':
      g.lineStyle({ width: 4, color: p.c2 || 0xffd35c });
      g.moveTo(x - 10, y);
      g.quadraticCurveTo(x, y - 18, x + 10, y);
      g.lineStyle(0);
      g.beginFill(p.c1);
      g.moveTo(x - 22, y + 8);
      g.quadraticCurveTo(x, y - 6, x + 22, y + 8);
      g.quadraticCurveTo(x + 18, y + 34, x, y + 36);
      g.quadraticCurveTo(x - 18, y + 34, x - 22, y + 8);
      g.closePath();
      g.endFill();
      g.beginFill(p.c2 || 0xffd35c);
      g.drawCircle(x, y + 10, 5);
      g.endFill();
      if (p.horn) {
        g.beginFill(0xffd35c);
        g.drawPolygon([x - 4, y + 2, x + 4, y + 2, x, y - 14]);
        g.endFill();
      }
      break;
    case 'heartbag':
      g.lineStyle({ width: 4, color: darken(p.c1, 0.2) });
      g.moveTo(x - 10, y + 2);
      g.quadraticCurveTo(x, y - 16, x + 10, y + 2);
      g.lineStyle(0);
      g.beginFill(p.c1);
      drawHeart(g, x, y + 22, 20);
      g.endFill();
      g.beginFill(0xffffff, 0.5);
      g.drawCircle(x - 7, y + 14, 5);
      g.endFill();
      break;
    case 'clutch':
      g.beginFill(p.c1);
      g.drawRoundedRect(x - 22, y + 4, 44, 26, 10);
      g.endFill();
      g.beginFill(lighten(p.c1, 0.4));
      g.drawRoundedRect(x - 22, y + 4, 44, 10, 5);
      g.endFill();
      g.beginFill(0xffffff);
      drawSparkle(g, x + 10, y + 14, 6);
      g.endFill();
      break;
    case 'comet': {
      // a clutch shaped like a falling star, trailing light behind her hand
      const tail = p.c2 || 0xffe08a;
      for (let i = 0; i < 3; i++) {
        g.beginFill(tail, 0.32 - i * 0.09);
        g.moveTo(x + 4, y + 6);
        g.quadraticCurveTo(x + 40 + i * 14, y - 16 - i * 8, x + 62 + i * 18, y - 40 - i * 14);
        g.quadraticCurveTo(x + 34 + i * 10, y - 4 - i * 4, x + 6, y + 16);
        g.closePath();
        g.endFill();
      }
      g.lineStyle({ width: 4, color: 0x8a7ab8 });
      g.moveTo(x - 10, y - 6);
      g.quadraticCurveTo(x, y - 26, x + 10, y - 6);
      g.lineStyle(0);
      g.beginFill(p.c1);
      g.drawPolygon(starPoints(x, y + 12, 5, 26, 12));
      g.endFill();
      g.beginFill(tail, 0.9);
      g.drawPolygon(starPoints(x, y + 12, 5, 15, 6.5));
      g.endFill();
      g.beginFill(0xffffff, 0.95);
      g.drawCircle(x - 5, y + 6, 3.4);
      drawSparkle(g, x + 20, y - 8, 5);
      drawSparkle(g, x - 16, y + 26, 4);
      g.endFill();
      break;
    }
  }
  return g;
}

function drawWand(p) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.lineStyle({ width: 7, color: 0xffffff });
  g.moveTo(-52, -178);
  g.lineTo(-78, -252);
  g.lineStyle(0);
  g.beginFill(p.c1);
  g.drawPolygon(starPoints(-82, -262, 5, 18, 8));
  g.endFill();
  g.beginFill(0xffffff, 0.9);
  g.drawCircle(-86, -268, 3);
  g.endFill();
  c.addChild(g);
  c.pivot.set(-52, -178);
  c.position.set(-52, -178);
  return c;
}

function drawWings(p) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  const col = p.c1, edge = p.gold ? 0xf3b93c : 0xa8d8f0;
  if (p.phoenix) {
    // Same silhouette as the other wings so she still reads as winged, but
    // built from three nested layers of fire with feather splits and embers.
    const anchor = [20, -270];
    const wingPath = (s, k) => {
      const px = (x) => s * (anchor[0] + (x - anchor[0]) * k);
      const py = (y) => anchor[1] + (y - anchor[1]) * k;
      g.moveTo(px(20), py(-270));
      g.bezierCurveTo(px(150), py(-400), px(190), py(-300), px(60), py(-230));
      g.bezierCurveTo(px(150), py(-250), px(130), py(-160), px(30), py(-190));
      g.closePath();
    };
    for (const s of [-1, 1]) {
      for (const [k, col, a] of [[1, 0xc42a1e, 0.92], [0.8, 0xff7a1a, 0.95], [0.56, p.c2 || 0xffe08a, 0.95]]) {
        g.beginFill(col, a);
        wingPath(s, k);
        g.endFill();
      }
      // feather splits — kept short so they stay on the plumage instead of
      // shooting past the wingtip like whiskers
      g.lineStyle({ width: 3, color: 0x8e1a12, alpha: 0.4, cap: PIXI.LINE_CAP.ROUND });
      for (let i = 0; i < 4; i++) {
        const a2 = -0.95 + i * 0.28;
        g.moveTo(s * (34 + Math.cos(a2) * 26), -262 + Math.sin(a2) * 20);
        g.lineTo(s * (34 + Math.cos(a2) * 84), -262 + Math.sin(a2) * 66);
      }
      g.lineStyle(0);
      // hot leading edge
      g.lineStyle({ width: 5, color: 0xffd35c, alpha: 0.9 });
      g.moveTo(s * 20, -270);
      g.bezierCurveTo(s * 150, -400, s * 190, -300, s * 60, -230);
      g.lineStyle(0);
      // embers drifting off the wingtip
      g.beginFill(0xffd35c, 0.9);
      for (const [ex, ey, r] of [[150, -358, 5], [178, -300, 4], [120, -232, 3.5], [196, -336, 3]]) {
        g.drawCircle(s * ex, ey, r);
      }
      g.endFill();
    }
    g.beginFill(0xfff3b0, 0.95);
    for (const [x, y, sz] of [[-166, -388, 7], [170, -374, 6], [-108, -206, 5], [112, -200, 5]]) drawSparkle(g, x, y, sz);
    g.endFill();
    c.addChild(g);
    c.pivot.set(0, -260);
    c.position.set(0, -260);
    return c;
  }
  for (const s of [-1, 1]) {
    g.beginFill(col, 0.85);
    g.moveTo(s * 20, -270);
    g.bezierCurveTo(s * 150, -400, s * 190, -300, s * 60, -230);
    g.bezierCurveTo(s * 150, -250, s * 130, -160, s * 30, -190);
    g.closePath();
    g.endFill();
    g.lineStyle({ width: 4, color: edge, alpha: 0.9 });
    g.moveTo(s * 20, -270);
    g.bezierCurveTo(s * 150, -400, s * 190, -300, s * 60, -230);
    g.lineStyle(0);
    g.beginFill(0xffffff, 0.6);
    g.drawEllipse(s * 95, -300, 16, 30);
    g.endFill();
  }
  c.addChild(g);
  c.pivot.set(0, -260);
  c.position.set(0, -260);
  return c;
}

/**
 * Cosmic Orbit: a ringed planet at her shoulder with three moons on their own
 * tilted paths. Returns { container, ring, moons } so charUpdate can spin it.
 */
function drawOrbit(p) {
  const c = new PIXI.Container();
  const back = new PIXI.Graphics();
  const front = new PIXI.Container();

  // orbit paths (static, drawn behind everything)
  const paths = [
    { rx: 84, ry: 28, rot: -0.25 },
    { rx: 66, ry: 40, rot: 0.55 },
    { rx: 96, ry: 19, rot: 0.15 },
  ];
  paths.forEach((o, i) => {
    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 2, color: i % 2 ? (p.c2 || 0xff8fc7) : (p.c1 || 0x9bd7f5), alpha: 0.45 });
    ring.drawEllipse(0, 0, o.rx, o.ry);
    ring.lineStyle(0);
    ring.rotation = o.rot;
    back.addChild(ring);
  });

  // the planet itself, tucked up by her shoulder
  const planet = new PIXI.Graphics();
  planet.beginFill(0x6f5ad0, 0.35); planet.drawCircle(0, 0, 26); planet.endFill();
  planet.beginFill(0x8a5fc0); planet.drawCircle(0, 0, 17); planet.endFill();
  planet.beginFill(0xa66ae0, 0.9); planet.drawEllipse(-4, -5, 9, 6); planet.endFill();
  planet.beginFill(0xc39aec, 0.8); planet.drawCircle(6, 5, 4); planet.endFill();
  planet.lineStyle({ width: 4.5, color: p.c2 || 0xffd35c, alpha: 0.9 });
  planet.drawEllipse(0, 2, 28, 9);
  planet.lineStyle({ width: 1.6, color: 0xffffff, alpha: 0.7 });
  planet.drawEllipse(0, 2, 28, 9);
  planet.lineStyle(0);

  const moons = paths.map((o, i) => {
    const m = new PIXI.Graphics();
    const col = [p.c1 || 0x9bd7f5, p.c2 || 0xff8fc7, 0xfff3b0][i % 3];
    m.beginFill(col, 0.3); m.drawCircle(0, 0, 13); m.endFill();
    m.beginFill(col); m.drawPolygon(starPoints(0, 0, 5, 9, 4)); m.endFill();
    m.beginFill(0xffffff, 0.9); m.drawCircle(-2, -2, 2.2); m.endFill();
    m.meta = o;
    front.addChild(m);
    return m;
  });

  c.addChild(back, planet, front);
  return { c, moons };
}

function drawButterfly(color) {
  const g = new PIXI.Graphics();
  g.beginFill(color, 0.95);
  g.drawEllipse(-7, -4, 7, 9);
  g.drawEllipse(7, -4, 7, 9);
  g.drawEllipse(-5, 5, 5, 6);
  g.drawEllipse(5, 5, 5, 6);
  g.endFill();
  g.beginFill(0x5b3a29);
  g.drawEllipse(0, 0, 2.2, 8);
  g.endFill();
  return g;
}

/** Convenience: character scaled to a given pixel height. */
export function characterAtHeight(eq, skin, heightPx, opts) {
  const ch = createCharacter(eq, skin, opts);
  const s = heightPx / 560;
  ch.scale.set(s);
  return ch;
}
