// Centralized templates and rarity constants for the game.
export const MODULE_TEMPLATES = [
  { id: 'AD', name: 'Astral Deliverance', type: 'Cannon', initials: 'AD', unique: true },
  { id: 'BA', name: 'Being Annihilator', type: 'Cannon', initials: 'BA', unique: true },
  { id: 'DP', name: 'Death Penalty', type: 'Cannon', initials: 'DP', unique: true },
  { id: 'HB', name: 'Havoc Bringer', type: 'Cannon', initials: 'HB', unique: true },
  { id: 'A-CP', name: 'Anti-Cube Portal', type: 'Armor', initials: 'ACP', unique: true },
  { id: 'NMP', name: 'Negative Mass Projector', type: 'Armor', initials: 'NMP', unique: true },
  { id: 'WR', name: 'Wormhole Redirector', type: 'Armor', initials: 'WR', unique: true },
  { id: 'SD', name: 'Space Displacer', type: 'Armor', initials: 'SD', unique: true },
  { id: 'SH', name: 'Singularity Harness', type: 'Generator', initials: 'SH', unique: true },
  { id: 'GC', name: 'Galaxy Compressor', type: 'Generator', initials: 'GC', unique: true },
  { id: 'PH', name: 'Pulsar Harvester', type: 'Generator', initials: 'PH', unique: true },
  { id: 'BHD', name: 'Black Hole Digestor', type: 'Generator', initials: 'BHD', unique: true },
  { id: 'OC', name: 'Om Chip', type: 'Core', initials: 'OC', unique: true },
  { id: 'HC', name: 'Harmony Conductor', type: 'Core', initials: 'HC', unique: true },
  { id: 'DC', name: 'Dimension Core', type: 'Core', initials: 'DC', unique: true },
  { id: 'MVN', name: 'Multiverse Nexus', type: 'Core', initials: 'MVN', unique: true },
];

export const RARE_TEMPLATES = [
  { id: 'OB', name: 'OB', type: 'Cannon', initials: 'OB', unique: false },
  { id: 'RB', name: 'RB', type: 'Cannon', initials: 'RB', unique: false },
  { id: 'BB', name: 'BB', type: 'Cannon', initials: 'BB', unique: false },
  { id: 'SB', name: 'SB', type: 'Cannon', initials: 'SB', unique: false },
  { id: 'NI', name: 'NI', type: 'Armor', initials: 'NI', unique: false },
  { id: 'PC', name: 'PC', type: 'Armor', initials: 'PC', unique: false },
  { id: 'SR', name: 'SR', type: 'Armor', initials: 'SR', unique: false },
  { id: 'DN', name: 'DN', type: 'Armor', initials: 'DN', unique: false },
  { id: 'SL', name: 'SL', type: 'Generator', initials: 'SL', unique: false },
  { id: 'OS', name: 'OS', type: 'Generator', initials: 'OS', unique: false },
  { id: 'AR', name: 'AR', type: 'Generator', initials: 'AR', unique: false },
  { id: 'SDS', name: 'SDS', type: 'Generator', initials: 'SDS', unique: false },
  { id: 'GL', name: 'GL', type: 'Core', initials: 'GL', unique: false },
  { id: 'MS', name: 'MS', type: 'Core', initials: 'MS', unique: false },
  { id: 'EM', name: 'EM', type: 'Core', initials: 'EM', unique: false },
  { id: 'CS', name: 'CS', type: 'Core', initials: 'CS', unique: false },
];

export const COMMON_TEMPLATES = [
  { id: 'EC_C', name: 'EC', type: 'Cannon', initials: 'EC', unique: false },
  { id: 'MC_C', name: 'MC', type: 'Cannon', initials: 'MC', unique: false },
  { id: 'EB', name: 'EB', type: 'Armor', initials: 'EB', unique: false },
  { id: 'MB', name: 'MB', type: 'Armor', initials: 'MB', unique: false },
  { id: 'MC_G', name: 'MC', type: 'Generator', initials: 'MC', unique: false },
  { id: 'EC_G', name: 'EC', type: 'Generator', initials: 'EC', unique: false },
  { id: 'EC_CO', name: 'EC', type: 'Core', initials: 'EC', unique: false },
  { id: 'MC_CO', name: 'MC', type: 'Core', initials: 'MC', unique: false },
];

// Assign explicit allowed rarity ranges per template.
MODULE_TEMPLATES.forEach(t => { t.minRarity = 'Epic'; t.maxRarity = 'Epic'; t.unique = true; });
RARE_TEMPLATES.forEach(t => { t.minRarity = 'Rare'; t.maxRarity = 'Rare'; t.unique = false; });
COMMON_TEMPLATES.forEach(t => { t.minRarity = 'Common'; t.maxRarity = 'Common'; t.unique = false; });

export const ALL_TEMPLATES = MODULE_TEMPLATES.concat(RARE_TEMPLATES, COMMON_TEMPLATES);

// RARITY_RANK and BASE_RATES are canonicalized in ./rules.js — re-export them here for compatibility
export { RARITY_RANK, BASE_RATES } from './rules.js';
