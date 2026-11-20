// Procedurally drawn chibi character with layered, customizable outfit pieces.
// Coordinate space: feet at (0,0), roughly 300 wide and 500 tall (negative y up).
// createCharacter() returns a Container with an .update(ms) idle animator.

import { byId, SKINS } from './items.js';
import { rand, starPoints, drawHeart, drawSparkle, darken, lighten, drawDiamond } from './util.js';

const HEAD_Y = -352;
const HEAD_R = 86;
const SHOULDER_Y = -292;
const HIP_Y = -158;

export function createCharacter(eq, skinIdx = 0, opts = {}) {
  const root = new PIXI.Container();
  const skin = SKINS[skinIdx % SKINS.length];
  const hair = eq.hair ? byId[eq.hair] : null;
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
  if (special && special.p.style === 'aura') {
    const aura = new PIXI.Container();
    root.addChild(aura);
    anim.aura = aura;
    anim.auraColor = special.p.c1;
    anim.auraShape = special.p.shape || 'sparkle';
  }

  // Wearing any 5★ piece makes the whole look shimmer subtly.
  const maxRar = Math.max(0, ...Object.values(eq).filter(Boolean).map((id) => (byId[id] ? byId[id].rar : 0)));
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
  const face = new PIXI.Container();
  const eyesOpen = new PIXI.Graphics();
  const irisColor = opts.irisColor ?? 0x6b4632;
  for (const s of [-1, 1]) {
    const ex = s * 34, ey = HEAD_Y + 10;
    eyesOpen.beginFill(0xffffff); eyesOpen.drawEllipse(ex, ey, 15, 19); eyesOpen.endFill();
    eyesOpen.beginFill(irisColor); eyesOpen.drawEllipse(ex, ey + 3, 10.5, 14); eyesOpen.endFill();
    eyesOpen.beginFill(0x2a1a12); eyesOpen.drawEllipse(ex, ey + 4, 6, 9); eyesOpen.endFill();
    eyesOpen.beginFill(0xffffff); eyesOpen.drawCircle(ex - 4, ey - 3, 4.2); eyesOpen.drawCircle(ex + 5, ey + 8, 2.2); eyesOpen.endFill();
    // lashes
    eyesOpen.lineStyle({ width: 4, color: 0x3a2a22, cap: PIXI.LINE_CAP.ROUND });
    eyesOpen.moveTo(ex - 15, ey - 13);
    eyesOpen.quadraticCurveTo(ex, ey - 22, ex + 15, ey - 13);
    eyesOpen.lineStyle(0);
    // brow
    eyesOpen.lineStyle({ width: 3.5, color: darken(irisColor, 0.2), cap: PIXI.LINE_CAP.ROUND });
    eyesOpen.moveTo(ex - 13, ey - 30);
    eyesOpen.quadraticCurveTo(ex, ey - 36, ex + 13, ey - 30);
    eyesOpen.lineStyle(0);
  }
  const eyesClosed = new PIXI.Graphics();
  for (const s of [-1, 1]) {
    const ex = s * 34, ey = HEAD_Y + 12;
    eyesClosed.lineStyle({ width: 4.5, color: 0x3a2a22, cap: PIXI.LINE_CAP.ROUND });
    eyesClosed.moveTo(ex - 13, ey);
    eyesClosed.quadraticCurveTo(ex, ey + 8, ex + 13, ey);
  }
  eyesClosed.visible = false;
  const mouthEtc = new PIXI.Graphics();
  // blush
  mouthEtc.beginFill(0xff8aa8, 0.4);
  mouthEtc.drawEllipse(-52, HEAD_Y + 34, 13, 8);
  mouthEtc.drawEllipse(52, HEAD_Y + 34, 13, 8);
  mouthEtc.endFill();
  // smile
  mouthEtc.lineStyle({ width: 4, color: 0xc2447c, cap: PIXI.LINE_CAP.ROUND });
  mouthEtc.moveTo(-10, HEAD_Y + 46);
  mouthEtc.quadraticCurveTo(0, HEAD_Y + 54, 10, HEAD_Y + 46);
  face.addChild(eyesOpen, eyesClosed, mouthEtc);
  root.addChild(face);
  anim.eyesOpen = eyesOpen;
  anim.eyesClosed = eyesClosed;

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
    // aura sparkles
    if (anim.aura && Math.random() < 0.12) {
      const g = new PIXI.Graphics();
      g.beginFill(anim.auraColor, 0.9);
      if (anim.auraShape === 'heart') drawHeart(g, 0, 0, rand(5, 9));
      else if (anim.auraShape === 'flake') g.drawPolygon(starPoints(0, 0, 6, rand(5, 9), rand(2, 3)));
      else drawSparkle(g, 0, 0, rand(4, 9));
      g.endFill();
      g.x = rand(-110, 110); g.y = rand(-470, -20);
      anim.aura.addChild(g);
      g.meta = { life: 900, t: 0 };
    }
    if (anim.aura) {
      for (const g of [...anim.aura.children]) {
        g.meta.t += ms;
        g.alpha = 1 - g.meta.t / g.meta.life;
        g.rotation += ms / 400;
        g.y -= ms / 40;
        if (g.meta.t >= g.meta.life) g.destroy();
      }
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

  return root;
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

function drawDress(p) {
  const g = new PIXI.Graphics();
  const c = p.c1, trim = p.c2 || lighten(p.c1, 0.4);
  const top = SHOULDER_Y + 6;
  // bodice
  g.beginFill(c);
  g.moveTo(-42, top);
  g.bezierCurveTo(-34, -230, -32, -215, -36, HIP_Y - 4);
  g.lineTo(36, HIP_Y - 4);
  g.bezierCurveTo(32, -215, 34, -230, 42, top);
  g.quadraticCurveTo(0, top - 14, -42, top);
  g.closePath();
  g.endFill();
  // straps
  g.lineStyle({ width: 7, color: c, cap: PIXI.LINE_CAP.ROUND });
  g.moveTo(-26, top - 6); g.lineTo(-12, top - 22);
  g.moveTo(26, top - 6); g.lineTo(12, top - 22);
  g.lineStyle(0);

  const skirtTop = HIP_Y - 8;
  switch (p.style) {
    case 'mini':
      skirt(g, c, trim, skirtTop, -95, 62, 0.4);
      break;
    case 'aline':
      skirt(g, c, trim, skirtTop, -46, 84, 0.5);
      break;
    case 'tutu': {
      g.beginFill(c, 0.55);
      for (const [rx, ry, y] of [[92, 34, -92], [78, 30, -102], [64, 26, -110]]) g.drawEllipse(0, y, rx, ry);
      g.endFill();
      g.beginFill(c);
      g.drawEllipse(0, -108, 52, 24);
      g.endFill();
      break;
    }
    case 'ball': {
      g.beginFill(c);
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-130, -80, -125, -30, -110, -6);
      g.quadraticCurveTo(0, 18, 110, -6);
      g.bezierCurveTo(125, -30, 130, -80, 36, skirtTop);
      g.closePath();
      g.endFill();
      // panniers shading
      g.beginFill(trim, 0.5);
      g.moveTo(0, skirtTop);
      g.bezierCurveTo(-40, -90, -34, -40, -20, -8);
      g.quadraticCurveTo(0, -2, 20, -8);
      g.bezierCurveTo(34, -40, 40, -90, 0, skirtTop);
      g.endFill();
      // hem
      g.lineStyle({ width: 8, color: trim });
      g.moveTo(-110, -6);
      g.quadraticCurveTo(0, 18, 110, -6);
      g.lineStyle(0);
      break;
    }
    case 'gown': {
      g.beginFill(c);
      g.moveTo(-36, skirtTop);
      g.bezierCurveTo(-70, -100, -88, -40, -80, -2);
      g.quadraticCurveTo(0, 12, 80, -2);
      g.bezierCurveTo(88, -40, 70, -100, 36, skirtTop);
      g.closePath();
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
      g.moveTo(-34, skirtTop);
      g.bezierCurveTo(-40, -110, -22, -80, -26, -40);
      g.bezierCurveTo(-70, -26, -78, -6, -84, 4);
      g.quadraticCurveTo(0, 22, 84, 4);
      g.bezierCurveTo(78, -6, 70, -26, 26, -40);
      g.bezierCurveTo(22, -80, 40, -110, 34, skirtTop);
      g.closePath();
      g.endFill();
      // scales
      g.beginFill(trim, 0.55);
      for (let row = 0; row < 3; row++) {
        for (let i = -2; i <= 2; i++) g.drawCircle(i * 16 + (row % 2) * 8, -128 + row * 16, 7);
      }
      g.endFill();
      break;
    }
  }
  drawDeco(g, p);
  return g;
}

function skirt(g, c, trim, top, hemY, hemW, flare) {
  g.beginFill(c);
  g.moveTo(-36, top);
  g.bezierCurveTo(-36 - hemW * flare, (top + hemY) / 2, -hemW, hemY + 14, -hemW, hemY);
  g.quadraticCurveTo(0, hemY + 16, hemW, hemY);
  g.bezierCurveTo(hemW, hemY + 14, 36 + hemW * flare, (top + hemY) / 2, 36, top);
  g.closePath();
  g.endFill();
  g.lineStyle({ width: 6, color: trim });
  g.moveTo(-hemW + 2, hemY + 1);
  g.quadraticCurveTo(0, hemY + 17, hemW - 2, hemY + 1);
  g.lineStyle(0);
}

function drawDeco(g, p) {
  const belt = -166;
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
    case 'bowline':
      g.beginFill(0xd1274b);
      drawHeart(g, 0, belt - 90, 9);
      g.endFill();
      g.lineStyle({ width: 5, color: 0xffffff });
      g.moveTo(-36, belt);
      g.quadraticCurveTo(0, belt + 8, 36, belt);
      g.lineStyle(0);
      break;
    case 'stripes':
      g.beginFill(0xffffff, 0.75);
      for (let i = -3; i <= 3; i++) {
        g.drawPolygon([i * 26 - 7, -140, i * 26 + 7, -140, i * 26 + 16, -30, i * 26 + 2, -30]);
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
  }
  // waist ribbon for most dresses
  if (p.deco !== 'bowline' && p.style !== 'tutu') {
    g.beginFill(p.c2 || lighten(p.c1, 0.4), 0.9);
    g.drawRoundedRect(-34, belt - 4, 68, 10, 5);
    g.endFill();
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
