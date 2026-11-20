# 💖 Glitter & Glam — Dress Up!

A girly dress-up game built entirely with **PixiJS**. Play cute minigames to
earn coins, unlock an ever-growing wardrobe of sparkly outfits, and strut the
red carpet in an animated Fashion Show judged against three rivals.

## Play

It's a fully static site — no build step. Serve the folder and open it:

```bash
npx serve .        # or: python3 -m http.server 8080
```

Works on desktop and mobile (touch-first, responsive portrait & landscape).

## The loop

1. **Minigames** (6 of them) earn coins:
   - ⭐ **Star Catch** — tap falling stars, chain combos, dodge storm clouds
   - 🃏 **Memory Match** — find 8 fashion pairs, speed bonus for fast clears
   - 🫧 **Bubble Pop** — pop sparkly bubbles, golden ones pay big
   - 🎵 **Runway Rhythm** — 3-lane tap-to-the-beat with Perfect/Good timing
   - 👀 **Style Rush** — "find the Ruby Heels!" reaction rounds
   - 💎 **Sparkle Simon** — repeat ever-longer gem sequences
2. **Coins** buy outfits in the **Wardrobe** (74 items across hair, dresses,
   shoes, hair deco, necklaces, bags and magic extras — fairy wings, glitter
   auras, orbiting stars, butterfly swarms — plus 6 skin tones, all drawn
   procedurally in Pixi). Wearing any 5★ piece adds an automatic luxury
   shimmer to your whole look.
3. **Lifetime earnings level you up**, unlocking rarer item tiers — a natural
   ramp from a free sundress to the Galaxy Princess ballgown.
4. **Fashion Show**: you + 3 NPC rivals walk the red carpet with clapping
   crowds, camera flashes and an applause meter; judges reveal scores worst-to-
   best and crown Best Dressed. Rarer outfits score higher. Big coin rewards.

A **daily gift** pays bonus coins that scale with your level — claiming on
consecutive days builds a 🔥 streak that raises the payout. Your **first 3
games pay double coins**, and starter items are priced so the first session
delivers several unlocks. Any item — even locked ones — can be **tried on**
in the wardrobe before buying.

🌙 **Night mode**: the moon button on the home screen switches the whole
boutique into a starry evening theme (crescent moon, deepened colors, brighter
sparkles); every scene keeps its hue identity, just after dark. Persisted with
the save.

Progress is saved in `localStorage`.

## Desktop & CrazyGames readiness

- Global UI scale: the interface renders at 1× on phones and up to 2× on
  large screens, so nothing looks tiny on desktop; text re-rasterizes crisply.
- Keyboard controls on desktop: Runway Rhythm (arrows / D·F·J / 1-2-3) and
  Sparkle Simon (arrows / 1-4); every game also plays with mouse or touch.
- Fully self-contained: no external requests (fonts, CDNs, analytics), no
  login, instant load — iframe-friendly for portals like CrazyGames.
- Audio starts only after a user gesture (autoplay-policy safe).
- CrazyGames SDK v3 wired via `src/portal.js` (init, gameplayStart/Stop,
  happytime on wins/level-ups); every call no-ops when the SDK is absent,
  so the same build runs anywhere.

## Tech notes

- PixiJS v7.4.3 vendored at `vendor/pixi.min.js` (MIT).
- ES modules, no bundler. Scenes live in `src/scenes/`, minigames share a
  base class (`minigame.js`) that provides intro cards, countdowns, scoring,
  results and coin payouts.
- All art is Pixi `Graphics` (no image assets); sound is a tiny WebAudio synth
  (no audio assets).
- Sparkles, confetti, floating hearts and coin flights run through one shared
  particle layer (`src/effects.js`); a mini tween engine (`src/tween.js`)
  drives every animation. Day/night theming lives in `src/theme.js`.
