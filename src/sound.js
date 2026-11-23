// Tiny WebAudio synth — no audio assets needed. All sounds are short cute blips.

let ctx = null;
let enabled = true;

export function setSoundEnabled(v) { enabled = v; }
export function soundEnabled() { return enabled; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** The shared audio context, or null until the first tap has unlocked audio. */
export function audioContext() { return ctx; }

// Unlock audio on first user gesture (mobile requirement).
export function initSound() {
  const unlock = () => { ac(); window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock);
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.16, when = 0, slide = 0) {
  const c = ac();
  if (!c || !enabled) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur = 0.15, vol = 0.08, when = 0) {
  const c = ac();
  if (!c || !enabled) return;
  const t0 = c.currentTime + when;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(g).connect(c.destination);
  src.start(t0);
}

export const Sfx = {
  tap() { tone(660, 0.06, 'sine', 0.1); },
  pop() { tone(520, 0.09, 'triangle', 0.18, 0, 400); noise(0.06, 0.05); },
  sparkle() { tone(1320, 0.1, 'sine', 0.09); tone(1760, 0.12, 'sine', 0.07, 0.05); },
  good() { tone(784, 0.1, 'triangle', 0.14); tone(1047, 0.14, 'triangle', 0.12, 0.07); },
  perfect() { tone(1047, 0.09, 'triangle', 0.13); tone(1319, 0.09, 'triangle', 0.12, 0.06); tone(1568, 0.16, 'triangle', 0.12, 0.12); },
  bad() { tone(220, 0.2, 'sawtooth', 0.08, 0, -80); },
  miss() { tone(300, 0.12, 'sine', 0.07, 0, -120); },
  coin() { tone(988, 0.07, 'square', 0.06); tone(1319, 0.16, 'square', 0.06, 0.06); },
  buy() { tone(659, 0.08, 'triangle', 0.13); tone(880, 0.08, 'triangle', 0.13, 0.07); tone(1319, 0.2, 'triangle', 0.13, 0.14); },
  equip() { tone(880, 0.08, 'sine', 0.12); tone(1175, 0.14, 'sine', 0.1, 0.06); },
  flip() { tone(740, 0.07, 'sine', 0.09, 0, 200); },
  match() { tone(880, 0.09, 'triangle', 0.13); tone(1109, 0.09, 'triangle', 0.12, 0.07); tone(1319, 0.14, 'triangle', 0.12, 0.14); },
  clap() { noise(0.09, 0.12); },
  whoosh() { tone(200, 0.25, 'sine', 0.06, 0, 500); },
  fanfare() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, i * 0.11));
    tone(1568, 0.5, 'triangle', 0.14, seq.length * 0.11);
  },
  drum() { tone(120, 0.2, 'sine', 0.2, 0, -60); noise(0.1, 0.1); },
  note(i) { tone([523, 659, 784, 988][i % 4], 0.18, 'triangle', 0.14); },
  tick() { tone(880, 0.04, 'sine', 0.05); },
  countdown() { tone(660, 0.12, 'sine', 0.12); },
  go() { tone(990, 0.3, 'triangle', 0.15); },
};
