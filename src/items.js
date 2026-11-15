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

export const SKINS = [0xffdfc9, 0xf7cdae, 0xeab687, 0xc98d5e, 0x9c6a3f, 0x74492a];

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
];

export const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const byCat = (cat) => ITEMS.filter((i) => i.cat === cat);

/** Style score of an equipped set — the fashion-show judging currency. */
export function styleScore(eq) {
  let s = 20; // base charm
  for (const cat of Object.keys(eq)) {
    const it = eq[cat] && byId[eq[cat]];
    if (it) s += it.rar * 14 + Math.round(it.price / 40);
  }
  return s;
}

/** A plausible random outfit for an NPC around a given level. */
export function randomOutfit(maxLvl) {
  const eq = { hair: null, dress: null, shoes: null, hat: null, neck: null, bag: null, special: null };
  for (const cat of ['hair', 'dress', 'shoes']) {
    const pool = byCat(cat).filter((i) => i.lvl <= maxLvl + 1);
    eq[cat] = pool[Math.floor(Math.random() * pool.length)].id;
  }
  for (const cat of ['hat', 'neck', 'bag', 'special']) {
    if (Math.random() < 0.55) {
      const pool = byCat(cat).filter((i) => i.lvl <= maxLvl + 1);
      if (pool.length) eq[cat] = pool[Math.floor(Math.random() * pool.length)].id;
    }
  }
  return eq;
}
