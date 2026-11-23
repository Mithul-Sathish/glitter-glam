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

/** Rough colour family of a 0xRRGGBB colour: pink, red, orange, yellow, green, blue, purple, white, black, brown. */
export function colorFamily(c) {
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.16 || d < 0.08) return l > 0.75 ? 'white' : l < 0.3 ? 'black' : 'grey';
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 14 || h >= 345) return l > 0.62 ? 'pink' : 'red';
  if (h < 40) return l < 0.42 ? 'brown' : 'orange';
  if (h < 68) return 'yellow';
  if (h < 165) return 'green';
  if (h < 255) return 'blue';
  if (h < 292) return 'purple';
  return 'pink';
}
