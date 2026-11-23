// Outfit catalog. Every item: category, name, price, unlock level, rarity (1-5 stars)
// and drawing parameters consumed by character.js.

export const CATS = [
  { id: 'hair', name: 'Hair', icon: 'hair' },
  { id: 'dress', name: 'Dresses', icon: 'dress' },
  { id: 'shoes', name: 'Shoes', icon: 'shoe' },
  { id: 'hat', name: 'Hair Deco', icon: 'bow' },
  { id: 'neck', name: 'Necklaces', icon: 'gem' },
  { id: 'bag', name: 'Bags', icon: 'bag' },
  { id: 'special', name: 'Magic', icon: 'wand' },
];

// The first six tones keep their old indices so existing saves still match.
export const SKINS = [0xffdfc9, 0xf7cdae, 0xeab687, 0xc98d5e, 0x9c6a3f, 0x74492a, 0xfbe8dc, 0xdba06e, 0x5a3620, 0x3f2616];

/** Hair dyes. Index 0 keeps the hairstyle's own colour. */
export const DYES = [
  { name: 'Natural', hex: null },
  { name: 'Chestnut', hex: 0x5b3a29 },
  { name: 'Midnight', hex: 0x2b2233 },
  { name: 'Honey Blonde', hex: 0xe9b64c },
  { name: 'Cherry', hex: 0xc23a50 },
  { name: 'Ginger', hex: 0xd9692e },
  { name: 'Hot Pink', hex: 0xff8fc7 },
  { name: 'Violet', hex: 0x9a6ee0 },
  { name: 'Ocean', hex: 0x4fa8e8 },
  { name: 'Mint', hex: 0x5fd3ae },
  { name: 'Silver', hex: 0xb9bccb },
  { name: 'Ice Blonde', hex: 0xf0ecf7 },
  { name: 'Caramel', hex: 0xa9713f },
];

export const EYE_COLORS = [
  { name: 'Hazel', hex: 0x6b4632 },
  { name: 'Ocean', hex: 0x3a6ea8 },
  { name: 'Forest', hex: 0x3f8a4f },
  { name: 'Violet', hex: 0x8a5fc0 },
  { name: 'Rose', hex: 0xc0526b },
  { name: 'Teal', hex: 0x37a8a0 },
  { name: 'Amber', hex: 0xd9912a },
  { name: 'Storm Grey', hex: 0x7c8794 },
  { name: 'Onyx', hex: 0x2a2028 },
  { name: 'Sky', hex: 0x6cc4ee },
];

/** Face and feature options, drawn in character.js. Saved as indices in save.look. */
export const FEATURES = [
  { key: 'eyeShape', name: 'Eye shape', opts: ['Round', 'Almond', 'Cat-eye', 'Sleepy', 'Sparkle'] },
  { key: 'lashes', name: 'Lashes', opts: ['Classic', 'Long', 'Bare'] },
  { key: 'brows', name: 'Brows', opts: ['Soft', 'Arched', 'Straight', 'Bold'] },
  { key: 'mouth', name: 'Smile', opts: ['Sweet', 'Big grin', 'Smirk', 'Pout', 'Cat'] },
  { key: 'lips', name: 'Lip colour', opts: ['Berry', 'Rose', 'Coral', 'Red', 'Plum', 'Nude'] },
  { key: 'blush', name: 'Blush', opts: ['Pink', 'Peach', 'Rosy', 'None'] },
  { key: 'marks', name: 'Details', opts: ['None', 'Freckles', 'Beauty mark', 'Dimples', 'Heart', 'Star'] },
];
export const LIP_COLORS = [0xc2447c, 0xe26a8d, 0xf0785a, 0xd1274b, 0x8a3a6e, 0xb9776a];

/** A random set of face features (rivals on the runway, and the Shuffle button). */
export function randomLook() {
  const look = { hairDye: 0, eyeColor: Math.floor(Math.random() * EYE_COLORS.length) };
  for (const f of FEATURES) look[f.key] = Math.floor(Math.random() * f.opts.length);
  if (Math.random() < 0.5) look.marks = 0;
  return look;
}

export const ITEMS = [
  // ------ HAIR (style, c1 main, c2 shine) ------
  { id: 'hair_waves_choc', cat: 'hair', name: 'Cocoa Waves', price: 0, lvl: 1, rar: 1, p: { style: 'long', c1: 0x5b3a29, c2: 0x7a513a } },
  { id: 'hair_bob_black', cat: 'hair', name: 'Midnight Bob', price: 50, lvl: 1, rar: 1, p: { style: 'bob', c1: 0x2b2233, c2: 0x4a3a57 } },
  { id: 'hair_twin_honey', cat: 'hair', name: 'Honey Twintails', price: 90, lvl: 1, rar: 2, p: { style: 'twin', c1: 0xc98a3d, c2: 0xe3ab5e } },
  { id: 'hair_pony_ruby', cat: 'hair', name: 'Ruby Ponytail', price: 150, lvl: 2, rar: 2, p: { style: 'pony', c1: 0xa93a4e, c2: 0xd05a6e } },
  { id: 'hair_bun_rose', cat: 'hair', name: 'Rose Bun', price: 380, lvl: 3, rar: 3, p: { style: 'bun', c1: 0xe58fb1, c2: 0xf7b6cf } },
  { id: 'hair_long_gold', cat: 'hair', name: 'Golden Waterfall', price: 520, lvl: 4, rar: 3, p: { style: 'long', c1: 0xe9b64c, c2: 0xf9d97e } },
  { id: 'hair_curls_lav', cat: 'hair', name: 'Lavender Curls', price: 750, lvl: 5, rar: 4, p: { style: 'curls', c1: 0xb08ae0, c2: 0xd0b3f2 } },
  { id: 'hair_twin_candy', cat: 'hair', name: 'Candyfloss Tails', price: 980, lvl: 6, rar: 4, p: { style: 'twin', c1: 0xff8fc7, c2: 0xffc0e2 } },
  { id: 'hair_long_mermaid', cat: 'hair', name: 'Mermaid Locks', price: 1500, lvl: 8, rar: 5, p: { style: 'long', c1: 0x37c7bE, c2: 0x7ce8dc, tips: 0xb08ae0 } },
  { id: 'hair_bun_platinum', cat: 'hair', name: 'Platinum Crown Bun', price: 2200, lvl: 9, rar: 5, p: { style: 'bun', c1: 0xe8e6ef, c2: 0xffffff } },
  { id: 'hair_bob_berry', cat: 'hair', name: 'Strawberry Bob', price: 180, lvl: 2, rar: 2, p: { style: 'bob', c1: 0xe8607a, c2: 0xf5899e } },
  { id: 'hair_pony_rosegold', cat: 'hair', name: 'Rose-Gold Pony', price: 820, lvl: 5, rar: 3, p: { style: 'pony', c1: 0xe0927e, c2: 0xf5b8a5 } },
  { id: 'hair_curls_fire', cat: 'hair', name: 'Sunset Curls', price: 1250, lvl: 7, rar: 4, p: { style: 'curls', c1: 0xe06a3c, c2: 0xf59a5e } },
  { id: 'hair_twin_rainbow', cat: 'hair', name: 'Prism Twintails', price: 2500, lvl: 9, rar: 5, p: { style: 'twin', c1: 0x8fd4e8, c2: 0xffb8d9 } },

  // ------ DRESSES (style, c1 body, c2 trim, deco) ------
  { id: 'dress_day_pink', cat: 'dress', name: 'Sunny Day Dress', price: 0, lvl: 1, rar: 1, p: { style: 'aline', c1: 0xff9ec8, c2: 0xffc9e2, deco: 'none' } },
  { id: 'dress_mini_sky', cat: 'dress', name: 'Sky Mini', price: 70, lvl: 1, rar: 1, p: { style: 'mini', c1: 0x8ec9f5, c2: 0xc4e4fb, deco: 'dots' } },
  { id: 'dress_sail', cat: 'dress', name: 'Sailor Sweetheart', price: 140, lvl: 2, rar: 2, p: { style: 'aline', c1: 0x4f6fb8, c2: 0xffffff, deco: 'bowline' } },
  { id: 'dress_tutu_mint', cat: 'dress', name: 'Minty Tutu', price: 190, lvl: 2, rar: 2, p: { style: 'tutu', c1: 0x9be8c8, c2: 0xd6f7e8, deco: 'dots' } },
  { id: 'dress_hearts', cat: 'dress', name: 'Heartbeat Dress', price: 480, lvl: 3, rar: 3, p: { style: 'aline', c1: 0xf76d8e, c2: 0xffd1dc, deco: 'hearts' } },
  { id: 'dress_star_navy', cat: 'dress', name: 'Starry Night Gown', price: 680, lvl: 4, rar: 3, p: { style: 'gown', c1: 0x3b3a7a, c2: 0x8b89d8, deco: 'stars' } },
  { id: 'dress_ball_lilac', cat: 'dress', name: 'Lilac Ballgown', price: 900, lvl: 5, rar: 4, p: { style: 'ball', c1: 0xc39aec, c2: 0xe6d4fa, deco: 'sparkle' } },
  { id: 'dress_mermaid', cat: 'dress', name: 'Pearl Mermaid Gown', price: 1250, lvl: 6, rar: 4, p: { style: 'mermaid', c1: 0x54cfc4, c2: 0xa7ece5, deco: 'sparkle' } },
  { id: 'dress_ruby_ball', cat: 'dress', name: 'Ruby Gala Gown', price: 1700, lvl: 7, rar: 5, p: { style: 'ball', c1: 0xd1274b, c2: 0xff7d9a, deco: 'sparkle' } },
  { id: 'dress_gold_gown', cat: 'dress', name: 'Golden Hour Gown', price: 2400, lvl: 8, rar: 5, p: { style: 'gown', c1: 0xf3b93c, c2: 0xffe08a, deco: 'sparkle' } },
  { id: 'dress_galaxy', cat: 'dress', name: 'Galaxy Princess', price: 3200, lvl: 10, rar: 5, p: { style: 'ball', c1: 0x5230a8, c2: 0x9b6ef0, deco: 'galaxy' } },
  { id: 'dress_candy', cat: 'dress', name: 'Candy Stripes', price: 160, lvl: 2, rar: 2, p: { style: 'aline', c1: 0xff8fb8, c2: 0xffffff, deco: 'stripes' } },
  { id: 'dress_sakura', cat: 'dress', name: 'Sakura Bloom', price: 560, lvl: 3, rar: 3, p: { style: 'tutu', c1: 0xffb8d9, c2: 0xffe3f0, deco: 'petals' } },
  { id: 'dress_flutter', cat: 'dress', name: 'Flutter Gown', price: 760, lvl: 4, rar: 3, p: { style: 'gown', c1: 0xb58fe8, c2: 0xdcc8f5, deco: 'petals' } },
  { id: 'dress_rainbow', cat: 'dress', name: 'Rainbow Swirl', price: 980, lvl: 5, rar: 4, p: { style: 'ball', c1: 0xfdf3f8, c2: 0xffd9ec, deco: 'rainbow' } },
  { id: 'dress_lace', cat: 'dress', name: 'Vintage Lace', price: 1150, lvl: 6, rar: 4, p: { style: 'aline', c1: 0xc9788f, c2: 0xf2d8de, deco: 'lace' } },
  { id: 'dress_ice', cat: 'dress', name: 'Ice Queen Gown', price: 1550, lvl: 7, rar: 4, p: { style: 'gown', c1: 0x9fd4f2, c2: 0xdff3fb, deco: 'ice' } },
  { id: 'dress_neon', cat: 'dress', name: 'Neon Pop Mini', price: 2000, lvl: 8, rar: 5, p: { style: 'mini', c1: 0x3ce0c8, c2: 0xff5f9e, deco: 'stripes' } },
  { id: 'dress_seraph', cat: 'dress', name: 'Seraph Silk', price: 2800, lvl: 9, rar: 5, p: { style: 'gown', c1: 0xfdf8ee, c2: 0xf3b93c, deco: 'sparkle' } },

  // ------ SHOES (style, c1) ------
  { id: 'shoes_flat_pink', cat: 'shoes', name: 'Petal Flats', price: 0, lvl: 1, rar: 1, p: { style: 'flat', c1: 0xf06fa0 } },
  { id: 'shoes_sneaker', cat: 'shoes', name: 'Cloud Sneakers', price: 60, lvl: 1, rar: 1, p: { style: 'sneaker', c1: 0xffffff, c2: 0x8ec9f5 } },
  { id: 'shoes_boot_choc', cat: 'shoes', name: 'Cocoa Boots', price: 170, lvl: 2, rar: 2, p: { style: 'boot', c1: 0x7a513a } },
  { id: 'shoes_heel_red', cat: 'shoes', name: 'Ruby Heels', price: 520, lvl: 3, rar: 3, p: { style: 'heel', c1: 0xd1274b } },
  { id: 'shoes_boot_white', cat: 'shoes', name: 'Snowdrop Boots', price: 760, lvl: 5, rar: 3, p: { style: 'boot', c1: 0xf6f2fb } },
  { id: 'shoes_heel_glass', cat: 'shoes', name: 'Glass Slippers', price: 1200, lvl: 7, rar: 4, p: { style: 'heel', c1: 0xbfe8f7, glass: true } },
  { id: 'shoes_heel_gold', cat: 'shoes', name: 'Gilded Heels', price: 1900, lvl: 9, rar: 5, p: { style: 'heel', c1: 0xf3b93c, glass: true } },
  { id: 'shoes_sneaker_gum', cat: 'shoes', name: 'Bubblegum Kicks', price: 150, lvl: 2, rar: 2, p: { style: 'sneaker', c1: 0xff8fb8, c2: 0xffd35c } },
  { id: 'shoes_flat_lilac', cat: 'shoes', name: 'Lilac Ballet Flats', price: 640, lvl: 4, rar: 3, p: { style: 'flat', c1: 0xb58fe8 } },
  { id: 'shoes_boot_star', cat: 'shoes', name: 'Starlight Boots', price: 1550, lvl: 8, rar: 4, p: { style: 'boot', c1: 0xfdf8ee } },

  // ------ HAIR DECO (hat slot) ------
  { id: 'hat_bow_pink', cat: 'hat', name: 'Cherry Bow', price: 45, lvl: 1, rar: 1, p: { style: 'bow', c1: 0xff5f9e } },
  { id: 'hat_flower', cat: 'hat', name: 'Daisy Clip', price: 95, lvl: 1, rar: 2, p: { style: 'flower', c1: 0xffffff, c2: 0xffd35c } },
  { id: 'hat_beret', cat: 'hat', name: 'Paris Beret', price: 190, lvl: 2, rar: 2, p: { style: 'beret', c1: 0xa93a4e } },
  { id: 'hat_bunny', cat: 'hat', name: 'Bunny Ears', price: 560, lvl: 4, rar: 3, p: { style: 'bunny', c1: 0xffffff, c2: 0xffb3d3 } },
  { id: 'hat_tiara', cat: 'hat', name: 'Starlight Tiara', price: 1100, lvl: 6, rar: 4, p: { style: 'tiara', c1: 0xffe08a, c2: 0x8ec9f5 } },
  { id: 'hat_crown', cat: 'hat', name: 'Royal Crown', price: 2100, lvl: 9, rar: 5, p: { style: 'crown', c1: 0xf3b93c, c2: 0xd1274b } },
  { id: 'hat_starclips', cat: 'hat', name: 'Star Clips', price: 420, lvl: 3, rar: 2, p: { style: 'starclips', c1: 0xffd35c } },
  { id: 'hat_halo', cat: 'hat', name: 'Golden Halo', price: 780, lvl: 5, rar: 3, p: { style: 'halo', c1: 0xf3b93c } },
  { id: 'hat_bfly', cat: 'hat', name: 'Butterfly Pin', price: 1350, lvl: 7, rar: 4, p: { style: 'bfly', c1: 0xb58fe8 } },

  // ------ NECKLACES ------
  { id: 'neck_ribbon', cat: 'neck', name: 'Silk Choker', price: 50, lvl: 1, rar: 1, p: { style: 'ribbon', c1: 0xf06fa0 } },
  { id: 'neck_heart', cat: 'neck', name: 'Heart Locket', price: 160, lvl: 2, rar: 2, p: { style: 'heart', c1: 0xffd35c, c2: 0xf76d8e } },
  { id: 'neck_pearls', cat: 'neck', name: 'Pearl Strand', price: 620, lvl: 4, rar: 3, p: { style: 'pearls', c1: 0xfdf6ee } },
  { id: 'neck_gem_blue', cat: 'neck', name: 'Ocean Teardrop', price: 1050, lvl: 6, rar: 4, p: { style: 'gem', c1: 0x4fa8e8 } },
  { id: 'neck_diamond', cat: 'neck', name: 'Diamond Cascade', price: 2000, lvl: 8, rar: 5, p: { style: 'gem', c1: 0xdff3fb, sparkle: true } },
  { id: 'neck_candy', cat: 'neck', name: 'Candy Charm', price: 440, lvl: 3, rar: 2, p: { style: 'heart', c1: 0xd8c26a, c2: 0xff8fb8 } },
  { id: 'neck_star', cat: 'neck', name: 'Star Pendant', price: 840, lvl: 5, rar: 3, p: { style: 'gem', c1: 0xffd35c } },

  // ------ BAGS ------
  { id: 'bag_tote_mint', cat: 'bag', name: 'Minty Tote', price: 55, lvl: 1, rar: 1, p: { style: 'tote', c1: 0x9be8c8 } },
  { id: 'bag_purse_pink', cat: 'bag', name: 'Blush Purse', price: 180, lvl: 2, rar: 2, p: { style: 'purse', c1: 0xff8fc7, c2: 0xffd35c } },
  { id: 'bag_heart', cat: 'bag', name: 'Sweetheart Bag', price: 640, lvl: 4, rar: 3, p: { style: 'heartbag', c1: 0xf76d8e } },
  { id: 'bag_clutch_gold', cat: 'bag', name: 'Starlet Clutch', price: 1150, lvl: 6, rar: 4, p: { style: 'clutch', c1: 0xf3b93c } },
  { id: 'bag_unicorn', cat: 'bag', name: 'Unicorn Mini-Bag', price: 1900, lvl: 8, rar: 5, p: { style: 'purse', c1: 0xffffff, c2: 0xc39aec, horn: true } },
  { id: 'bag_cloud', cat: 'bag', name: 'Cloud Pouch', price: 460, lvl: 3, rar: 2, p: { style: 'tote', c1: 0xcfe8fa } },
  { id: 'bag_berry', cat: 'bag', name: 'Berry Heart Bag', price: 880, lvl: 5, rar: 3, p: { style: 'heartbag', c1: 0xc9284e } },

  // ------ MAGIC (special) ------
  { id: 'sp_wand', cat: 'special', name: 'Star Wand', price: 400, lvl: 3, rar: 2, p: { style: 'wand', c1: 0xffd35c } },
  { id: 'sp_wings_fairy', cat: 'special', name: 'Fairy Wings', price: 850, lvl: 5, rar: 3, p: { style: 'wings', c1: 0xcfeffb } },
  { id: 'sp_aura', cat: 'special', name: 'Glitter Aura', price: 1400, lvl: 7, rar: 4, p: { style: 'aura', c1: 0xffd35c } },
  { id: 'sp_wings_gold', cat: 'special', name: 'Angel Wings', price: 2600, lvl: 9, rar: 5, p: { style: 'wings', c1: 0xfff3d6, gold: true } },
  { id: 'sp_butterflies', cat: 'special', name: 'Butterfly Swarm', price: 3400, lvl: 10, rar: 5, p: { style: 'butterflies', c1: 0xff8fc7 } },
  { id: 'sp_hearts', cat: 'special', name: 'Heart Halo', price: 620, lvl: 4, rar: 3, p: { style: 'aura', c1: 0xff6f91, shape: 'heart' } },
  { id: 'sp_snow', cat: 'special', name: 'Snow Shimmer', price: 1100, lvl: 6, rar: 4, p: { style: 'aura', c1: 0xbfe8f7, shape: 'flake' } },
  { id: 'sp_starring', cat: 'special', name: 'Ring of Stars', price: 2200, lvl: 8, rar: 5, p: { style: 'orbit', c1: 0xffd35c } },

  // ============================ MYTHIC TIER (rar 6) ============================
  // Coins alone can't buy these. Each carries `req`: trials checked in
  // mythic.js (shows won, high scores, streaks, collections).
  { id: 'hair_starfall', cat: 'hair', name: 'Starfall Cascade', price: 9000, lvl: 11, rar: 6,
    req: [{ k: 'plays', n: 60 }, { k: 'ownCat', cat: 'hair', n: 10 }],
    p: { style: 'starfall', c1: 0x2a1152, c2: 0x7a5ad0, tips: 0x9bd7f5 } },
  { id: 'dress_zodiac', cat: 'dress', name: 'Zodiac Empress Gown', price: 12000, lvl: 12, rar: 6,
    req: [{ k: 'shows', n: 25 }, { k: 'bestShow', n: 9 }],
    p: { style: 'ball', c1: 0x141234, c2: 0x6f6fc4, deco: 'zodiac' } },
  { id: 'dress_dragonheart', cat: 'dress', name: 'Dragonheart Gown', price: 16000, lvl: 13, rar: 6,
    req: [{ k: 'best', game: 'simon', n: 900 }, { k: 'best', game: 'rhythm', n: 1500 }],
    p: { style: 'mermaid', c1: 0x7b1230, c2: 0xff9a3c, deco: 'dragonscale' } },
  { id: 'dress_eternal_sakura', cat: 'dress', name: 'Eternal Sakura Gown', price: 20000, lvl: 14, rar: 6,
    req: [{ k: 'streak', n: 14 }, { k: 'challenges', n: 20 }],
    p: { style: 'highlow', c1: 0xe3a3b6, c2: 0xfaf0f4, deco: 'sakura' } },
  { id: 'dress_prism', cat: 'dress', name: 'Infinity Prism Gown', price: 60000, lvl: 20, rar: 6,
    req: [{ k: 'mythics', n: 6 }, { k: 'wins', n: 100 }, { k: 'earned', n: 80000 }],
    p: { style: 'ball', c1: 0xf4f7ff, c2: 0xc0a8ff, deco: 'prism' } },
  { id: 'hat_diadem', cat: 'hat', name: 'Empress Diadem', price: 14000, lvl: 12, rar: 6,
    req: [{ k: 'winStreak', n: 5 }, { k: 'ownCat', cat: 'hat', n: 7 }],
    p: { style: 'diadem', c1: 0xffd35c, c2: 0xff5f9e } },
  { id: 'shoes_crystal', cat: 'shoes', name: 'Aurora Crystal Heels', price: 10000, lvl: 11, rar: 6,
    req: [{ k: 'best', game: 'starcatch', n: 1200 }, { k: 'ownCat', cat: 'shoes', n: 8 }],
    p: { style: 'crystal', c1: 0xbfe8f7, c2: 0xc39aec, glass: true } },
  { id: 'neck_kingdom', cat: 'neck', name: 'Heart of the Kingdom', price: 18000, lvl: 13, rar: 6,
    req: [{ k: 'wins', n: 50 }, { k: 'earned', n: 30000 }],
    p: { style: 'royalgem', c1: 0xff3d6e, c2: 0xffd35c } },
  { id: 'bag_comet', cat: 'bag', name: 'Comet Clutch', price: 10000, lvl: 11, rar: 6,
    req: [{ k: 'best', game: 'bubble', n: 1000 }, { k: 'ownCat', cat: 'bag', n: 6 }],
    p: { style: 'comet', c1: 0x3a2358, c2: 0xffe08a } },
  { id: 'sp_wings_phoenix', cat: 'special', name: 'Phoenix Wings', price: 22000, lvl: 15, rar: 6,
    req: [{ k: 'winStreak', n: 8 }, { k: 'own', id: 'sp_wings_gold' }],
    p: { style: 'wings', c1: 0xff7a1a, c2: 0xffe08a, phoenix: true } },
  { id: 'sp_orbit', cat: 'special', name: 'Cosmic Orbit', price: 30000, lvl: 16, rar: 6,
    req: [{ k: 'allBest', n: 500 }, { k: 'earned', n: 45000 }],
    p: { style: 'planet', c1: 0x9bd7f5, c2: 0xff8fc7 } },
];

export const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const byCat = (cat) => ITEMS.filter((i) => i.cat === cat);
export const isMythic = (item) => !!(item && item.req);

/** Style score of an equipped set — the fashion-show judging currency. */
export function styleScore(eq) {
  let s = 20; // base charm
  for (const cat of Object.keys(eq)) {
    const it = eq[cat] && byId[eq[cat]];
    if (it) s += it.rar * 14 + Math.round(Math.min(it.price, 3600) / 40);
  }
  return s;
}

/** A plausible random outfit for an NPC around a given level. */
export function randomOutfit(maxLvl) {
  const eq = { hair: null, dress: null, shoes: null, hat: null, neck: null, bag: null, special: null };
  for (const cat of ['hair', 'dress', 'shoes']) {
    const pool = byCat(cat).filter((i) => i.lvl <= maxLvl + 1 && !isMythic(i));
    eq[cat] = pool[Math.floor(Math.random() * pool.length)].id;
  }
  for (const cat of ['hat', 'neck', 'bag', 'special']) {
    if (Math.random() < 0.55) {
      const pool = byCat(cat).filter((i) => i.lvl <= maxLvl + 1 && !isMythic(i));
      if (pool.length) eq[cat] = pool[Math.floor(Math.random() * pool.length)].id;
    }
  }
  return eq;
}
