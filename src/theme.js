// Day / Night theme. Night keeps every scene's hue identity but deepens it
// toward a plum evening sky; scenes that are already dark stay as designed.

import { save, persist } from './save.js';
import { mixColor } from './util.js';

const NIGHT_INK = 0x241430;

export function isNight() { return save.theme === 'night'; }

export function toggleTheme() {
  save.theme = isNight() ? 'day' : 'night';
  persist();
}

/** Deepen a color for night mode (no-op during the day). */
export function nite(color, amt = 0.66) {
  return isNight() ? mixColor(color, NIGHT_INK, amt) : color;
}

/** Like nite() but with a custom strength, for floors/props that need less dimming. */
export function niteSoft(color) { return nite(color, 0.5); }
