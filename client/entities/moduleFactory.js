// Module factory utilities: createModuleInstance, normalizeId, stableHash
// These were moved from main.js to keep instance creation logic centralized.

import { ALL_TEMPLATES } from '../game/templates.js';
import { ASSETS } from '../assets/index.js';
import { uid } from '../utils/random.js';
import { resolveAssetsForModule } from '../utils/assets.js';

// Normalizes template ids / filenames for lookup
export function normalizeId(id) {
  return String(id || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Stable hash for instanceId -> integer
export function stableHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Small TYPE_SHAPE mapping (moved here to avoid importing main.js)
const TYPE_SHAPE = {
  Cannon: 'circle',
  Generator: 'triangle',
  Armor: 'square',
  Core: 'diamond',
};

// createModuleInstance: constructs a new module instance object from a templateId
export function createModuleInstance(templateId, rarity = 'Common', plus = false, stars = 0) {
  const t = ALL_TEMPLATES.find(x => x.id === templateId);
  if (!t) {
    throw new Error('Unknown template ' + templateId);
  }
  const inst = {
    instanceId: uid(),
    templateId: t.id,
    name: t.name,
    type: t.type,
    shape: TYPE_SHAPE[t.type],
    initials: t.initials,
    unique: t.unique,
    rarity,
    plus,
    stars, // for Ancestral star levels
  };
  // assign stable asset keys/URLs at creation time so visuals remain consistent for the instance
  resolveAssetsForModule(inst);
  return inst;
}
