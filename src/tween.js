// Tiny tween engine driven by the PIXI ticker (registered in main.js).

const active = [];

export const Ease = {
  linear: (t) => t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  quadIn: (t) => t * t,
  quadInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  cubicOut: (t) => 1 - Math.pow(1 - t, 3),
  backOut: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  elasticOut: (t) =>
    t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  bounceOut: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

/**
 * tween(obj, { x: 10, alpha: 0 }, 400, { ease, delay, onDone, onUpdate, yoyo, repeat })
 * Returns a handle with .cancel().
 */
export function tween(obj, to, dur, opts = {}) {
  const t = {
    obj,
    to,
    from: {},
    dur: Math.max(1, dur),
    t: -(opts.delay || 0),
    ease: opts.ease || Ease.quadOut,
    onDone: opts.onDone,
    onUpdate: opts.onUpdate,
    yoyo: !!opts.yoyo,
    repeat: opts.repeat || 0,
    started: false,
    dead: false,
    cancel() { this.dead = true; },
  };
  active.push(t);
  return t;
}

export function killTweensOf(obj) {
  for (const t of active) if (t.obj === obj) t.dead = true;
}

export function delay(ms, fn) {
  return tween({}, {}, ms, { onDone: fn });
}

export function updateTweens(ms) {
  for (let i = active.length - 1; i >= 0; i--) {
    const t = active[i];
    if (t.dead) { active.splice(i, 1); continue; }
    t.t += ms;
    if (t.t < 0) continue;
    if (!t.started) {
      t.started = true;
      for (const k in t.to) t.from[k] = t.obj[k];
    }
    let p = Math.min(1, t.t / t.dur);
    let e = t.ease(p);
    if (t.yoyo) e = e < 0.5 ? e * 2 : (1 - e) * 2; // triangle back to start
    // Guard against objects destroyed mid-tween (pixi throws on destroyed access).
    try {
      for (const k in t.to) t.obj[k] = t.from[k] + (t.to[k] - t.from[k]) * (t.yoyo ? e : e);
      if (t.onUpdate) t.onUpdate(e, p);
    } catch (err) {
      t.dead = true; active.splice(i, 1); continue;
    }
    if (p >= 1) {
      if (t.repeat !== 0) {
        t.t = 0;
        if (t.repeat > 0) t.repeat--;
      } else {
        active.splice(i, 1);
        if (t.onDone) t.onDone();
      }
    }
  }
}

/** Pulse scale of a display object forever (idle animation). */
export function pulse(obj, amount = 0.05, dur = 900) {
  const base = obj.scale.x;
  return tween(obj.scale, { x: base * (1 + amount), y: base * (1 + amount) }, dur, {
    ease: Ease.sineInOut, yoyo: true, repeat: -1,
  });
}
