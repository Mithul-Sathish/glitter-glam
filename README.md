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
   - ⭐ **Star Catch** — tap falling stars, complete linked constellations for
     a bonus, grab shooting stars, dodge storm clouds
   - 🃏 **Memory Match** — find 8 fashion pairs, speed bonus for fast clears
   - 🫧 **Bubble Pop** — the banner names a target colour; that colour scores
     big, other colours are safe but worth less
   - 🎵 **Runway Rhythm** — 3-lane tap-to-the-beat (keys 1·2·3) that speeds up
     through 7 speed levels
   - 👀 **Style Rush** — "find the Ruby Heels!" reaction rounds
   - 💎 **Encore** — repeat ever-longer gem sequences, 3 lives
2. **Coins** buy outfits in the **Wardrobe** (hair, dresses, shoes, hair deco,
   necklaces, bags and magic extras — fairy wings, heart halos, snow shimmer,
   glitter auras — all drawn procedurally in Pixi). Any item can be **tried
   on** before buying.
3. **Mythic items** can't be bought with coins alone: each has trials (reach a
   level, win runways, collect items, beat minigame scores) shown in the
   wardrobe; finishing them unlocks the price tag.
4. **My Look**: 10 skin tones, hair dye, eye colours, eye shapes, brows,
   lashes, smiles, lip colours, blush and details. Save up to 4 looks, shuffle
   an outfit, or **snap a photo** of your character to download.
5. **Lifetime earnings level you up**. Each level pays a coin bonus, unlocks
   rarer tiers and earns stylist titles from Style Newbie to Queen of Glam.
6. **Fashion Show**: you + 3 NPC rivals walk the red carpet; every judges'
   rating is out of 10.

**Daily**: an attendance calendar pays coins for each day in a row (a gift
item on day 7, one missed day is forgiven), plus three daily challenges with a
bonus for finishing all of them. **Rankings** show a medal and a league
position for every minigame (the rivals are in-game characters, not real
players) along with runway records.

**Saving**: progress is written to `localStorage` after every round, purchase
and outfit change, again whenever the tab is hidden or closed, and to a backup
key that is used if the main save is damaged. The save button on the home
screen gives a copyable save code for moving progress to another browser or
device.

**Accounts and world rankings (optional)**: the small server in `server/`
adds nickname accounts, cloud saves and real-player rankings. It is off unless
`ONLINE_API` is set in `src/config.js`; see `server/README.md`. Left empty, the
game has no accounts and makes no network requests.

🌙 **Night mode**: the moon button on the home screen switches the whole
boutique into a starry evening theme (crescent moon, deepened colors, brighter
sparkles); every scene keeps its hue identity, just after dark. Persisted with
the save.

## Desktop & portal readiness

- Global UI scale: the interface renders at 1× on phones and up to 2× on
  large screens, so nothing looks tiny on desktop; text re-rasterizes crisply.
- Keyboard controls on desktop: Runway Rhythm (arrows / D·F·J / 1-2-3) and
  Encore (arrows / 1-4); every game also plays with mouse or touch.
- Fully self-contained: no external requests (fonts, CDNs, analytics), no
  login, instant load — iframe-friendly for game portals.
- Audio starts only after a user gesture (autoplay-policy safe).
- Background music is generated live in `src/music.js` (no audio files): a home theme, a quicker minigame theme and a runway theme. The note button on the menu turns it on or off and the choice is saved.
- `src/portal.js` is a thin adapter for a portal SDK. No SDK script is
  loaded by default, so every call is a no-op and the page makes no outside
  requests. To publish on CrazyGames, add their SDK script tag back to
  `index.html`.

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
