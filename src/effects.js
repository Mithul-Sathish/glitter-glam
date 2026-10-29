// Particle-ish effects: sparkles, confetti, floating hearts/text, coin flights.
// All drawn with Graphics and animated by one shared updater (registered in main.js).

import { rand, randi, choice, starPoints, drawHeart } from './util.js';
import { tween, Ease } from './tween.js';
import { Sfx } from './sound.js';

export const fxLayer = new PIXI.Container(); // always on top, added by main.js
const parts = [];

const SPARKLE_COLORS = [0xffffff, 0xffe08a, 0xffb3d3, 0xc4e4fb, 0xe6d4fa];

function makeStarG(color, r, spikes = 4) {
  const g = new PIXI.Graphics();
  g.beginFill(color);
  g.drawPolygon(starPoints(0, 0, spikes, r, r * (spikes === 4 ? 0.32 : 0.5)));
  g.endFill();
  return g;
}

/** Star burst at a point (global coordinates). */
export function sparkleBurst(x, y, opts = {}) {
  const n = opts.n || 12;
  const colors = opts.colors || SPARKLE_COLORS;
  for (let i = 0; i < n; i++) {
    const g = makeStarG(choice(colors), rand(4, 10), Math.random() < 0.3 ? 5 : 4);
    g.x = x; g.y = y;
    g.rotation = rand(0, Math.PI);
    const a = rand(0, Math.PI * 2);
    const sp = rand(1.5, 5.5) * (opts.power || 1);
    fxLayer.addChild(g);
    parts.push({ g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, vr: rand(-0.2, 0.2), grav: 0.12, life: rand(500, 900), t: 0, fade: true });
  }
}

/** Gentle ambient falling sparkles across the top of the screen. Call every frame-ish. */
export function ambientSparkle(W, H) {
  if (Math.random() > 0.12) return;
  const g = makeStarG(choice(SPARKLE_COLORS), rand(3, 7));
  g.x = rand(0, W); g.y = -10;
  g.alpha = rand(0.4, 0.9);
  fxLayer.addChild(g);
  parts.push({ g, vx: rand(-0.3, 0.3), vy: rand(0.7, 1.6), vr: rand(-0.05, 0.05), grav: 0, life: 9000, t: 0, floorY: H + 20, twinkle: true });
}

/** Confetti shower from the top. */
export function confetti(W, count = 80) {
  const colors = [0xff5f9e, 0xffd35c, 0x8ec9f5, 0x9be8c8, 0xc39aec, 0xffffff];
  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics();
    const c = choice(colors);
    if (Math.random() < 0.5) { g.beginFill(c); g.drawRect(-4, -6, 8, 12); g.endFill(); }
    else { g.beginFill(c); drawHeart(g, 0, 0, 6); g.endFill(); }
    g.x = rand(0, W); g.y = rand(-200, -10);
    g.rotation = rand(0, Math.PI * 2);
    fxLayer.addChild(g);
    parts.push({ g, vx: rand(-1, 1), vy: rand(2, 5), vr: rand(-0.25, 0.25), grav: 0.03, sway: rand(1, 2.5), swayT: rand(0, 9), life: 4200, t: 0, fade: true });
  }
}

/** Floating heart(s) rising from a point. */
export function floatHearts(x, y, n = 3, color = 0xff5f9e) {
  for (let i = 0; i < n; i++) {
    const g = new PIXI.Graphics();
    g.beginFill(color, 0.9);
    drawHeart(g, 0, 0, rand(6, 12));
    g.endFill();
    g.x = x + rand(-24, 24); g.y = y;
    fxLayer.addChild(g);
    parts.push({ g, vx: rand(-0.4, 0.4), vy: rand(-2.4, -1.2), vr: rand(-0.06, 0.06), grav: -0.005, sway: rand(0.5, 1.4), swayT: rand(0, 9), life: rand(900, 1500), t: 0, fade: true });
  }
}

/** Floating score/text popup at a point. */
export function floatText(x, y, str, opts = {}) {
  const t = new PIXI.Text(str, {
    fontFamily: 'GameFont',
    fontSize: opts.size || 30,
    fontWeight: '900',
    fill: opts.fill || 0xffffff,
    stroke: opts.stroke ?? 0xc2447c,
    strokeThickness: 5,
  });
  t.anchor.set(0.5);
  t.x = x; t.y = y;
  fxLayer.addChild(t);
  tween(t, { y: y - 70, alpha: 0 }, opts.dur || 900, { ease: Ease.quadOut, onDone: () => !t.destroyed && t.destroy() });
  tween(t.scale, { x: 1.15, y: 1.15 }, 160, { ease: Ease.backOut });
}

function drawCoin(g, r = 12) {
  g.beginFill(0xf5b21a); g.drawCircle(0, 0, r); g.endFill();
  g.beginFill(0xffd35c); g.drawCircle(0, 0, r * 0.78); g.endFill();
  g.beginFill(0xf5b21a); drawHeart(g, 0, r * 0.06, r * 0.42); g.endFill();
}

/** Coins fly from (x,y) to (tx,ty); onArrive fires per coin (update the HUD there). */
export function coinFly(x, y, tx, ty, n, onArrive) {
  n = Math.min(n, 14);
  for (let i = 0; i < n; i++) {
    const g = new PIXI.Graphics();
    drawCoin(g);
    g.x = x + rand(-30, 30); g.y = y + rand(-20, 20);
    fxLayer.addChild(g);
    const midx = (g.x + tx) / 2 + rand(-80, 80);
    const midy = Math.min(g.y, ty) - rand(40, 140);
    const p = { x: g.x, y: g.y };
    tween(p, { x: 1 }, 1, {}); // noop keep-alive
    const start = { x: g.x, y: g.y };
    tween({ t: 0 }, { t: 1 }, rand(500, 800), {
      delay: i * 55,
      ease: Ease.quadIn,
      onUpdate: (e) => {
        if (g.destroyed) return;
        const u = 1 - e;
        g.x = u * u * start.x + 2 * u * e * midx + e * e * tx;
        g.y = u * u * start.y + 2 * u * e * midy + e * e * ty;
        g.rotation += 0.15;
      },
      onDone: () => {
        if (!g.destroyed) g.destroy();
        Sfx.coin();
        sparkleBurst(tx, ty, { n: 4, power: 0.5 });
        if (onArrive) onArrive(i);
      },
    });
  }
}

/** Per-frame particle update — call with deltaMS. */
export function updateEffects(ms) {
  const k = ms / 16.667;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += ms;
    if (p.g.destroyed) { parts.splice(i, 1); continue; }
    if (p.sway !== undefined) { p.swayT += ms / 300; p.g.x += Math.sin(p.swayT) * p.sway * k; }
    p.vy += (p.grav || 0) * k;
    p.g.x += p.vx * k;
    p.g.y += p.vy * k;
    p.g.rotation += (p.vr || 0) * k;
    if (p.twinkle) p.g.alpha = 0.5 + 0.5 * Math.sin(p.t / 120);
    if (p.fade && p.t > p.life * 0.6) p.g.alpha = Math.max(0, 1 - (p.t - p.life * 0.6) / (p.life * 0.4));
    const dead = p.t >= p.life || (p.floorY !== undefined && p.g.y > p.floorY);
    if (dead) { p.g.destroy(); parts.splice(i, 1); }
  }
}

/** Quick screen shake on a container (usually the scene root). */
export function shake(container, power = 8, dur = 300) {
  const ox = container.x, oy = container.y;
  const start = performance.now();
  const step = () => {
    const t = (performance.now() - start) / dur;
    if (t >= 1 || container.destroyed) {
      if (!container.destroyed) { container.x = ox; container.y = oy; }
      PIXI.Ticker.shared.remove(step);
      return;
    }
    const damp = 1 - t;
    container.x = ox + rand(-power, power) * damp;
    container.y = oy + rand(-power, power) * damp;
  };
  PIXI.Ticker.shared.add(step);
}
