// Module factory utilities: createModuleInstance, normalizeId, stableHash
// These were moved from main.js to keep instance creation logic centralized.

import { ALL_TEMPLATES } from '../game/templates.js';
import { ASSETS } from '../assets/index.js';
import { uid } from '../utils/random.js';

// Normalizes template ids / filenames for lookup
export function normalizeId(id) { return String(id || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Stable hash for instanceId -> integer
export function stableHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Small TYPE_SHAPE mapping (moved here to avoid importing main.js)
const TYPE_SHAPE = {
  Cannon: 'circle',
  Generator: 'triangle',
  Armor: 'square',
  Core: 'diamond',
};


// Resolve asset keys/URLs for a module instance and attach them to the object so the choice is stable.
function resolveAssetsForModule(mod) {
  try {
    // If this instance already had assets assigned, don't reassign — hard-wire once.
    if (mod && mod._assetAssigned) return;
    const dirKey = 'modules_' + ((mod.type || 'Core').toLowerCase());
    const map = ASSETS[dirKey] || {};
    const rarityKey = (mod.rarity || 'Common').toLowerCase();
    const tmpl = normalizeId(mod.templateId || '');

    // frame: prefer exact, else mf_common, else mf_empty
    const frameKeyExact = 'mf_' + rarityKey + (mod.plus ? '_plus' : '');
    let frameKey = null;
    if (map[frameKeyExact]) frameKey = frameKeyExact;
    else if (map['mf_common']) frameKey = 'mf_common';
    else if (map['mf_empty']) frameKey = 'mf_empty';

    // module artwork: template-first resolution
    let moduleKey = null;
    // allow forcing a specific resolved asset URL/dir when we pick a global common
    let forcedAssetSrc = null;
    let forcedAssetDir = null;
    if (tmpl) {
      const prefKey = rarityKey + '_' + tmpl;
      if (map[prefKey]) moduleKey = prefKey;
      else if (map['rare_' + tmpl]) moduleKey = 'rare_' + tmpl;
      else if (map[tmpl]) moduleKey = tmpl;
      else {
        for (const k of Object.keys(map)) {
          if (k.endsWith('_' + tmpl)) { moduleKey = k; break; }
        }
      }
    }

    if (frameKey && frameKey.startsWith && frameKey.startsWith('mf_common')) {
      if (!(moduleKey && moduleKey.startsWith && moduleKey.startsWith('common_'))) {
        if (tmpl && map['common_' + tmpl]) {
          moduleKey = 'common_' + tmpl;
        } else {
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) {
            localCommons.sort();
            moduleKey = localCommons[0];
          } else {
            let found = null;
            const globalList = [];
            for (const dk of Object.keys(ASSETS)) {
              const m = ASSETS[dk] || {};
              for (const k of Object.keys(m)) {
                if (k.startsWith('common_')) globalList.push({ dir: dk, key: k });
              }
            }
            if (globalList.length > 0) {
              globalList.sort((a, b) => {
                const A = a.dir + '::' + a.key;
                const B = b.dir + '::' + b.key;
                return A < B ? -1 : (A > B ? 1 : 0);
              });
              found = globalList[0];
            }
            if (found) {
              moduleKey = found.key;
              forcedAssetDir = found.dir;
              forcedAssetSrc = (ASSETS[found.dir] && ASSETS[found.dir][found.key]) ? ASSETS[found.dir][found.key] : null;
            } else {
              if (map['mf_empty']) frameKey = 'mf_empty'; else frameKey = null;
            }
          }
        }
      }
    }

    const findAssetSrc = (key) => {
      for (const dk of Object.keys(ASSETS)) {
        const m = ASSETS[dk] || {};
        if (m[key]) return m[key];
      }
      return null;
    };
    mod._assetKey = moduleKey || null;
    let resolvedAssetSrc = null;
    if (moduleKey) {
      if (forcedAssetSrc) resolvedAssetSrc = forcedAssetSrc;
      else resolvedAssetSrc = (map[moduleKey]) ? map[moduleKey] : findAssetSrc(moduleKey);
    }
    mod._assetSrc = resolvedAssetSrc || null;
    mod._frameKey = frameKey || null;
    let resolvedFrameSrc = null;
    if (frameKey) {
      if (forcedAssetDir && ASSETS[forcedAssetDir] && ASSETS[forcedAssetDir][frameKey]) resolvedFrameSrc = ASSETS[forcedAssetDir][frameKey];
      else resolvedFrameSrc = (map[frameKey]) ? map[frameKey] : findAssetSrc(frameKey);
    }
    mod._frameSrc = resolvedFrameSrc || null;
    try { mod._assetAssigned = true; } catch (e) {}
  } catch (e) {
    mod._assetKey = null; mod._assetSrc = null; mod._frameKey = null; mod._frameSrc = null;
  }
}

// createModuleInstance: constructs a new module instance object from a templateId
export function createModuleInstance(templateId, rarity = 'Common', plus = false, stars = 0) {
  const t = ALL_TEMPLATES.find(x => x.id === templateId);
  if (!t) throw new Error('Unknown template ' + templateId);
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
