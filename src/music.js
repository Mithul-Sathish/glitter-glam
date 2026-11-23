// Background music, generated live with WebAudio — no audio files.
//
// Three original looping themes share one tiny step sequencer:
//   home   — gentle and sparkly, for the menu, wardrobe and game hub
//   games  — quicker and bouncy, for the minigames
//   runway — a strutting four-on-the-floor beat for the fashion show
//
// Each theme is 8 bars of 16 sixteenth-note steps. Notes are scheduled a
// fraction of a second ahead of the audio clock, so timing stays tight even
// when the frame rate dips. Music only starts after the first tap (browser
// autoplay rules) and pauses while the tab is hidden.

import { audioContext } from './sound.js';

const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
/** 'E5' -> frequency in Hz */
function hz(name) {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  const midi = 12 * (Number(m[2]) + 1) + N[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/** "E5 . G5 ." -> [freq, 0, freq, 0]; '.' is a rest, '-' holds the last note */
const line = (str) => str.trim().split(/\s+/).map((t) => (t === '.' ? 0 : t === '-' ? -1 : hz(t)));

// Chords as [bass note, pad notes...]
const CH = {
  C: ['C2', 'C4', 'E4', 'G4'], Am: ['A1', 'A3', 'C4', 'E4'], F: ['F1', 'F3', 'A3', 'C4'], G: ['G1', 'G3', 'B3', 'D4'],
  Em: ['E2', 'G3', 'B3', 'E4'], D: ['D2', 'F#3', 'A3', 'D4'], Dm: ['D2', 'F3', 'A3', 'D4'],
};

const THEMES = {
  home: {
    bpm: 92, swing: 0.1, lead: 'triangle', leadVol: 0.075, padVol: 0.03, bassVol: 0.09, hatVol: 0.012, kickVol: 0,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'],
    // one string per bar, 8 eighth-notes each
    melody: [
      'E5 . G5 . C6 . G5 .', 'E5 . A5 . C6 - A5 .', 'F5 . A5 . C6 . A5 F5', 'G5 - . D5 G5 . B5 .',
      'C6 . G5 . E5 . G5 .', 'A5 . C6 . E6 - C6 .', 'D6 . A5 . F5 . A5 .', 'G5 . B5 . D6 - . .',
    ],
    arp: true, bass: [0, 8], hats: [4, 12],
  },
  games: {
    bpm: 126, swing: 0, lead: 'square', leadVol: 0.04, padVol: 0.02, bassVol: 0.1, hatVol: 0.02, kickVol: 0.16,
    chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'],
    melody: [
      'B5 . D6 B5 G5 . B5 .', 'G5 . B5 G5 E5 . G5 .', 'E5 G5 C6 . E6 . C6 .', 'D6 . A5 . F#5 A5 D6 .',
      'G6 . D6 . B5 . D6 .', 'E6 . B5 . G5 B5 E6 .', 'C6 E6 G6 . E6 . C6 .', 'D6 . F#6 . A6 - . .',
    ],
    arp: false, bass: [0, 6, 8, 14], hats: [2, 6, 10, 14], kick: [0, 8],
  },
  runway: {
    bpm: 112, swing: 0, lead: 'sawtooth', leadVol: 0.032, padVol: 0.028, bassVol: 0.11, hatVol: 0.022, kickVol: 0.2,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'Em'],
    melody: [
      'A5 . . C6 . E6 . .', 'F5 . . A5 . C6 - .', 'G5 . . C6 . E6 . G6', 'D6 . B5 . G5 . . .',
      'E6 . . C6 . A5 . .', 'C6 . . A5 . F5 - .', 'D6 . F6 . A6 . F6 .', 'E6 - . B5 G5 . . .',
    ],
    arp: false, bass: [0, 3, 6, 8, 11, 14], hats: [2, 6, 10, 14], kick: [0, 4, 8, 12], clap: [4, 12],
  },
};
for (const t of Object.values(THEMES)) {
  t.mel = t.melody.map(line);
  t.ch = t.chords.map((c) => CH[c].map(hz));
}

let enabled = true;
let wanted = 'home';
let playing = null;      // theme currently sounding
let step = 0;            // sixteenth-note counter within the 8-bar loop
let nextTime = 0;        // audio-clock time of the next step
let master = null;
let timer = null;
let noiseBuf = null;

export function musicEnabled() { return enabled; }

export function setMusicEnabled(v) {
  enabled = !!v;
  const c = audioContext();
  if (master && c) master.gain.setTargetAtTime(enabled ? 1 : 0, c.currentTime, 0.08);
  if (enabled) playing = null; // start cleanly from bar one
}

/** Pick the theme for the current screen: 'home' | 'games' | 'runway'. */
export function setMusicTheme(name) { if (THEMES[name]) wanted = name; }

function out(c) {
  if (!master) {
    master = c.createGain();
    master.gain.value = enabled ? 1 : 0;
    // soften the top end so the synth voices sit behind the sound effects
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;
    master.connect(lp).connect(c.destination);
  }
  return master;
}

function voice(c, type, freq, t0, dur, vol, attack = 0.012) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out(c));
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function hiss(c, t0, dur, vol, hp) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(out(c));
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function kick(c, t0, vol) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t0);
  o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
  o.connect(g).connect(out(c));
  o.start(t0);
  o.stop(t0 + 0.2);
}

function playStep(c, th, s, t0, sixteenth) {
  const bar = Math.floor(s / 16) % 8;
  const pos = s % 16;
  const chord = th.ch[bar];
  // pad: one soft chord per bar
  if (pos === 0) for (const f of chord.slice(1)) voice(c, 'sine', f, t0, sixteenth * 15, th.padVol, 0.25);
  // bass
  if (th.bass.includes(pos)) voice(c, 'triangle', chord[0] * 2, t0, sixteenth * 2.4, th.bassVol);
  // gentle broken chord on the off-beats (home theme)
  if (th.arp && pos % 4 === 2) voice(c, 'sine', chord[1 + ((pos >> 2) % 3)] * 2, t0, sixteenth * 2, th.padVol * 1.4);
  // melody on eighth-notes; '-' lets the previous note ring on
  if (pos % 2 === 0) {
    const mel = th.mel[bar];
    const i = pos / 2;
    const f = mel[i];
    if (f > 0) {
      let len = 1;
      while (i + len < 8 && mel[i + len] === -1) len++;
      voice(c, th.lead, f, t0, sixteenth * (2 * len - 0.3), th.leadVol);
      voice(c, 'sine', f * 2, t0, sixteenth * 1.2, th.leadVol * 0.35); // sparkle on top
    }
  }
  if (th.kick && th.kick.includes(pos)) kick(c, t0, th.kickVol);
  if (th.hats.includes(pos)) hiss(c, t0, 0.04, th.hatVol, 7000);
  if (th.clap && th.clap.includes(pos)) hiss(c, t0, 0.11, th.hatVol * 1.8, 1500);
}

function pump() {
  const c = audioContext();
  if (!c || c.state !== 'running' || !enabled || document.hidden) { playing = null; return; }
  if (playing !== wanted) {
    // new screen: restart from bar one after a tiny breath
    playing = wanted;
    step = 0;
    nextTime = c.currentTime + 0.12;
  }
  const th = THEMES[playing];
  const sixteenth = 60 / th.bpm / 4;
  if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05; // fell behind (tab was asleep)
  while (nextTime < c.currentTime + 0.3) {
    const swing = step % 2 ? th.swing * sixteenth : 0;
    playStep(c, th, step, nextTime + swing, sixteenth);
    step = (step + 1) % 128;
    nextTime += sixteenth;
  }
}

export function initMusic(on) {
  enabled = on !== false;
  if (timer) return;
  timer = setInterval(pump, 80);
}
