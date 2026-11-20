// Small shared helpers: math, random, shape paths.

export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Points for a star polygon centered at (cx, cy).
export function starPoints(cx, cy, spikes, outer, inner, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / spikes;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}

export function drawStar(g, cx, cy, spikes, outer, inner, rot) {
  g.drawPolygon(starPoints(cx, cy, spikes, outer, inner, rot));
}

// Cute rounded heart, size = half width.
export function drawHeart(g, cx, cy, size) {
  const s = size;
  g.moveTo(cx, cy + s * 0.95);
  g.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.85, cy - s * 1.1, cx, cy - s * 0.38);
  g.bezierCurveTo(cx + s * 0.85, cy - s * 1.1, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.95);
  g.closePath();
}

// Simple 4-point sparkle (diamond sparkle).
export function drawSparkle(g, cx, cy, r) {
  g.drawPolygon(starPoints(cx, cy, 4, r, r * 0.32));
}

export function drawDiamond(g, cx, cy, r) {
  g.moveTo(cx, cy - r);
  g.lineTo(cx + r * 0.78, cy);
  g.lineTo(cx, cy + r);
  g.lineTo(cx - r * 0.78, cy);
  g.closePath();
}

// Mix two 0xRRGGBB colors.
export function mixColor(c1, c2, t) {
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  const b = Math.round(lerp(c1 & 255, c2 & 255, t));
  return (r << 16) | (g << 8) | b;
}

export const darken = (c, t = 0.25) => mixColor(c, 0x000000, t);
export const lighten = (c, t = 0.35) => mixColor(c, 0xffffff, t);

export function fmt(n) {
  return n.toLocaleString('en-US');
}
