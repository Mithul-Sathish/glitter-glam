// Thin adapter for the CrazyGames SDK (v3). Every call is a safe no-op when the
// SDK script isn't present (local play, the artifact build, other portals), so
// the game behaves identically everywhere; on CrazyGames the events light up
// their analytics, ad pacing and "happy moment" features.

function sdk() {
  try { return (window.CrazyGames && window.CrazyGames.SDK) || null; } catch (e) { return null; }
}

let ready = false;

export async function portalInit() {
  try {
    const s = sdk();
    if (s && s.init) { await s.init(); ready = true; }
  } catch (e) { /* SDK missing or blocked — fine */ }
}

/** A play session (minigame round / fashion show) begins. */
export function gameplayStart() {
  try { if (ready) sdk().game.gameplayStart(); } catch (e) {}
}

/** The play session ended (results screen, back to menus). */
export function gameplayStop() {
  try { if (ready) sdk().game.gameplayStop(); } catch (e) {}
}

/** A celebratory moment: level up, fashion-show win, new record. */
export function happytime() {
  try { if (ready) sdk().game.happytime(); } catch (e) {}
}
