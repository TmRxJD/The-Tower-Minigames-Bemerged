// Game merge rules and basic helpers
// Exports: MERGE_SEQUENCE, RARITY_RANK, BASE_RATES and several small rule helpers.
// Rules are implemented here to be the canonical source for merge logic.

export const MERGE_SEQUENCE = [
  '3Rare_to_RarePlus',
  'RarePlus_plus_2Rare_to_Epic',
  '2Epic_to_EpicPlus',
  'EpicPlus_plus_2Epic_to_Legendary',
  'Legendary_plus_EpicPlus_to_LegendaryPlus',
  'LegendaryPlus_plus_Legendary_to_Mythic',
  'Mythic_plus_Legendary_to_MythicPlus',
  'MythicPlus_plus_2EpicPlus_to_Ancestral',
  'Ancestral_plus_2EpicPlus_to_AncestralStar',
];

export const RARITY_RANK = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
  Ancestral: 5,
};

// Default base drop rates (fractions). These are conservative defaults used by spawning logic.
export const BASE_RATES = {
  Common: 0.685,
  Rare: 0.29,
  Epic: 0.025,
};

// How many total selections (base + fodder) are required to perform a merge for a base of a given rarity.
// Most rarities use 3-of-a-kind merging (total=3). Ancestral progression uses a larger requirement to support
// multi-star progression; default to 5 for Ancestral to represent a 5★ progression mechanic.
export const MERGE_REQUIREMENTS = {
  // Values chosen to match the engine's requiredTotalForBaseCell behavior.
  // Keys without '+' represent non-plus states; keys with '+' show explicit plus-state requirements
  Common: 3,
  Rare: 3,
  'Rare+': 3,
  Epic: 2,
  'Epic+': 3,
  Legendary: 2,
  'Legendary+': 2,
  Mythic: 2,
  'Mythic+': 3,
  Ancestral: 2,
};

export function getRarityRank(rarity) {
  if (!rarity) {
    return -1;
  }
  return RARITY_RANK[rarity] ?? -1;
}

export function rarityFromRank(rank) {
  if (typeof rank !== 'number' || rank < 0 || rank >= MERGE_SEQUENCE.length) {
    return null;
  }
  return MERGE_SEQUENCE[rank] || null;
}

export function getNextRarity(rarity) {
  const r = getRarityRank(rarity);
  if (r < 0) {
    return null;
  }
  return rarityFromRank(r + 1);
}

// Given a base cell object (or a rarity string), return the total number of selections required
// to perform a merge (including the base itself). Accepts either an object with `.rarity` or a string.
export function requiredTotalForBaseCell(base) {
  if (!base) {
    return Infinity;
  }
  const cell = base && base.cell ? base.cell : base;
  const r = cell && cell.rarity ? cell.rarity : null;
  const plus = !!(cell && cell.plus);
  const key = String(r) + (plus ? '+' : '');
  switch (key) {
  case 'Rare':
    return 3;
  case 'Rare+':
    return 3;
  case 'Epic':
    return 2;
  case 'Epic+':
    return 3;
  case 'Legendary':
    return 2;
  case 'Legendary+':
    return 2;
  case 'Mythic':
    return 2;
  case 'Mythic+':
    return 3;
  case 'Ancestral':
    return 2;
  default:
    return Infinity;
  }
}

// Determine whether candidateCell can be used as fodder for baseCell.
// Basic rules implemented here:
// - Both must exist
// - Commons cannot be used as fodder
// - Types must match (Cannon/Generator/Armor/Core)
// - Prevent using the exact same instance as fodder
// - Mines can be used as wildcards (fodder for any base)
export function canBeFodder(baseCell, candidateCell) {
  if (!baseCell || !candidateCell) {
    return false;
  }
  const b = baseCell && baseCell.cell ? baseCell.cell : baseCell;
  const c = candidateCell && candidateCell.cell ? candidateCell.cell : candidateCell;
  try {
    if (typeof arguments[2] === 'function' && arguments[2](c)) {
      return false;
    }
    if (typeof arguments[2] === 'function' && arguments[2](b)) {
      return false;
    }
  } catch (e) {}
  // Mines can be used as wildcards for any base
  if (c.templateId === '__MINE__' || c.rarity === 'Mine') {
    return true;
  }
  if (c.rarity === 'Common' || b.rarity === 'Common') {
    return false;
  }
  if (c.type !== b.type) {
    return false;
  }
  if (b.rarity === 'Rare' && !b.plus) {
    return c.rarity === 'Rare' && !c.plus && c.templateId === b.templateId;
  }
  if (b.rarity === 'Rare' && b.plus) {
    return !!c.plus && c.type === b.type && c.rarity === 'Rare';
  }
  if (b.rarity === 'Epic' && !b.plus) {
    return c.rarity === 'Epic' && !c.plus && c.templateId === b.templateId;
  }
  if (b.rarity === 'Epic' && b.plus) {
    return c.rarity === 'Epic' && c.plus === true && c.type === b.type;
  }
  if (b.rarity === 'Legendary' && !b.plus) {
    return c.rarity === 'Epic' && c.plus === true && c.templateId === b.templateId;
  }
  if (b.rarity === 'Legendary' && b.plus) {
    return c.rarity === 'Legendary' && c.plus === true && c.type === b.type;
  }
  if (b.rarity === 'Mythic' && !b.plus) {
    return c.rarity === 'Legendary' && c.plus === true;
  }
  if (b.rarity === 'Mythic' && b.plus) {
    return c.rarity === 'Epic' && c.plus === true;
  }
  if (b.rarity === 'Ancestral') {
    return c.rarity === 'Epic' && c.plus === true;
  }
  return false;
}

export function sameTemplate(a, b) {
  if (!a || !b) {
    return false;
  }
  const aid = a && a.cell && a.cell.templateId ? a.cell.templateId : a.templateId || a.id || '';
  const bid = b && b.cell && b.cell.templateId ? b.cell.templateId : b.templateId || b.id || '';
  return String(aid) === String(bid);
}

// Detect whether the provided base and fodder set represent an Ancestral star upgrade:
// - base must be Ancestral
// - exactly two fodder cells, each must be Epic and plus===true and match the base template
export function isAncestralStarUpgrade(baseCell, fodderCells) {
  if (!baseCell || !fodderCells || !Array.isArray(fodderCells)) {
    return false;
  }
  const base = baseCell && baseCell.cell ? baseCell.cell : baseCell;
  if (!base || base.rarity !== 'Ancestral') {
    return false;
  }
  // Now requires a single Epic+ of the same template to increase a star
  if (fodderCells.length !== 1) {
    return false;
  }
  const f = fodderCells[0];
  const c = f && f.cell ? f.cell : f;
  return !!(c && c.rarity === 'Epic' && c.plus === true && c.templateId === base.templateId);
}

// Compute the new stars value when performing an Ancestral star upgrade.
// Returns the new stars (1-5) or null if the upgrade isn't valid.
export function upgradeAncestralStars(baseCell, fodderCells) {
  if (!isAncestralStarUpgrade(baseCell, fodderCells)) {
    return null;
  }
  const base = baseCell && baseCell.cell ? baseCell.cell : baseCell;
  const currentStars = Number(base.stars || 0) || 0;
  const newStars = Math.min(5, currentStars + 1);
  return newStars;
}

export default {
  MERGE_SEQUENCE,
  RARITY_RANK,
  BASE_RATES,
  MERGE_REQUIREMENTS,
  getRarityRank,
  rarityFromRank,
  getNextRarity,
  requiredTotalForBaseCell,
  canBeFodder,
  sameTemplate,
  isAncestralStarUpgrade,
  upgradeAncestralStars,
};
