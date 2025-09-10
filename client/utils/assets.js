// utils/assets.js
// Asset selection and management utilities

import { ASSETS } from '../assets/index.js';
import { BACKGROUNDS } from '../assets/backgrounds.js';
import bossImg from '../assets/boss.png';
import mineAsset from '../assets/mine.png';

// Round-robin picker for common_* variants so we distribute multiple common mods evenly
const __commonVariantCounters = {};

/**
 * Round-robin picker for common_* variants to distribute multiple common mods evenly.
 * @param {string} dirKey - The asset directory key (e.g., 'modules_cannon')
 * @param {string} tmpl - Template ID to prefer exact matches for
 * @param {object} map - Asset map for the directory
 * @returns {string|null} The selected common asset key or null if none found
 */
export function pickCommonVariant(dirKey, tmpl, map) {
  const candidates = [];

  if (tmpl) {
    const exact = 'common_' + tmpl;
    if (map[exact]) {
      candidates.push(exact);
    }
    for (const k of Object.keys(map)) {
      if (k.startsWith('common_') && k.endsWith('_' + tmpl) && !candidates.includes(k)) {
        candidates.push(k);
      }
    }
  }
  if (candidates.length === 0) {
    for (const k of Object.keys(map)) {
      if (k.startsWith('common_')) {
        candidates.push(k);
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  const keyBase = dirKey + '::' + (tmpl || '__any__');
  let idx = __commonVariantCounters[keyBase] || 0;
  const chosen = candidates[idx % candidates.length];
  __commonVariantCounters[keyBase] = (idx + 1) % candidates.length;
  return chosen;
}

/**
 * Resolve asset keys/URLs for a module instance and attach them to the object so the choice is stable.
 * @param {object} mod - The module instance to resolve assets for
 */
export function resolveAssetsForModule(mod) {
  try {
    // If this instance already had assets assigned, don't reassign — hard-wire once.
    if (mod && mod._assetAssigned) {
      return;
    }
    const dirKey = 'modules_' + (mod.type || 'Core').toLowerCase();
    const map = ASSETS[dirKey] || {};
    const rarityKey = (mod.rarity || 'Common').toLowerCase();
    const tmpl = mod.templateId || '';

    // frame: prefer exact, else mf_common, else mf_empty
    const frameKeyExact = 'mf_' + rarityKey + (mod.plus ? '_plus' : '');
    let frameKey = null;
    if (map[frameKeyExact]) {
      frameKey = frameKeyExact;
    } else if (map['mf_common']) {
      frameKey = 'mf_common';
    } else if (map['mf_empty']) {
      frameKey = 'mf_empty';
    }

    // module artwork: template-first resolution
    let moduleKey = null;
    // allow forcing a specific resolved asset URL/dir when we pick a global common
    let forcedAssetSrc = null;
    let forcedAssetDir = null;
    if (tmpl) {
      const prefKey = rarityKey + '_' + tmpl;
      if (map[prefKey]) {
        moduleKey = prefKey;
      } else if (map['rare_' + tmpl]) {
        moduleKey = 'rare_' + tmpl;
      } else if (map[tmpl]) {
        moduleKey = tmpl;
      } else {
        for (const k of Object.keys(map)) {
          if (k.endsWith('_' + tmpl)) {
            moduleKey = k;
            break;
          }
        }
      }
    }

    // If frameKey is mf_common, choose a matching common_* artwork in a simple, hardcoded way:
    // 1) prefer 'common_<tmpl>' in the same dir
    // 2) else pick the first local 'common_*' key in the same dir (sorted)
    // 3) else pick the first global 'common_*' key across ASSETS (sorted by dir/key)
    // If no common artwork exists anywhere, fall back to mf_empty if available.
    if (frameKey && frameKey.startsWith && frameKey.startsWith('mf_common')) {
      if (!(moduleKey && moduleKey.startsWith && moduleKey.startsWith('common_'))) {
        // 1) exact local common
        if (tmpl && map['common_' + tmpl]) {
          moduleKey = 'common_' + tmpl;
        } else {
          // 2) first local common
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) {
            localCommons.sort();
            moduleKey = localCommons[0];
          } else {
            // 3) first global common
            let found = null;
            const globalList = [];
            for (const dk of Object.keys(ASSETS)) {
              const m = ASSETS[dk] || {};
              for (const k of Object.keys(m)) {
                if (k.startsWith('common_')) {
                  globalList.push({ dir: dk,
                    key: k });
                }
              }
            }
            if (globalList.length > 0) {
              globalList.sort((a, b) => {
                const A = a.dir + '::' + a.key;
                const B = b.dir + '::' + b.key;
                return A < B ? -1 : A > B ? 1 : 0;
              });
              found = globalList[0];
            }
            if (found) {
              moduleKey = found.key;
              forcedAssetDir = found.dir;
              forcedAssetSrc = ASSETS[found.dir] && ASSETS[found.dir][found.key] ? ASSETS[found.dir][found.key] : null;
            } else {
              // no commons anywhere: downgrade frame to empty if available
              if (map['mf_empty']) {
                frameKey = 'mf_empty';
              } else {
                frameKey = null;
              }
            }
          }
        }
      }
    }

    // Attach resolved keys and URLs for stable rendering
    // Helper: search ASSETS for a given key across directories
    const findAssetSrc = key => {
      for (const dk of Object.keys(ASSETS)) {
        const m = ASSETS[dk] || {};
        if (m[key]) {
          return m[key];
        }
      }
      return null;
    };
    mod._assetKey = moduleKey || null;
    // Prefer any moduleSrc already found; otherwise look it up globally
    let resolvedAssetSrc = null;
    if (moduleKey) {
      // if we forced an exact asset earlier, use it; otherwise try current dir then global
      if (forcedAssetSrc) {
        resolvedAssetSrc = forcedAssetSrc;
      } else {
        resolvedAssetSrc = map[moduleKey] ? map[moduleKey] : findAssetSrc(moduleKey);
      }
    }
    mod._assetSrc = resolvedAssetSrc || null;
    mod._frameKey = frameKey || null;
    // frame may live in a different dir; locate it globally
    let resolvedFrameSrc = null;
    if (frameKey) {
      // if we forced a dir earlier and that dir has the frame, prefer that
      if (forcedAssetDir && ASSETS[forcedAssetDir] && ASSETS[forcedAssetDir][frameKey]) {
        resolvedFrameSrc = ASSETS[forcedAssetDir][frameKey];
      } else {
        resolvedFrameSrc = map[frameKey] ? map[frameKey] : findAssetSrc(frameKey);
      }
    }
    mod._frameSrc = resolvedFrameSrc || null;
    // Mark assigned so future calls won't change these values
    try {
      mod._assetAssigned = true;
    } catch (e) {}
  } catch (e) {
    mod._assetKey = null;
    mod._assetSrc = null;
    mod._frameKey = null;
    mod._frameSrc = null;
  }
}

// Get damage value for a module based on its rarity
export function getModuleDamageValue(cell) {
  if (!cell || !cell.rarity) {
    return 0;
  }
  const rarity = cell.rarity;
  const damageMap = {
    Common: 1,
    Rare: 2,
    'Rare+': 3,
    Epic: 9,
    'Epic+': 18,
    Legendary: 54,
    'Legendary+': 72,
    Mythic: 0, // Prevent mythic from boss shattering
    'Mythic+': 0, // Prevent mythic+ from boss shattering
    Ancestral: 0, // Prevent ancestral from boss shattering
    'Ancestral+': 0, // Prevent ancestral+ from boss shattering
    Boss: 0, // Prevent boss from damaging itself
  };
  return damageMap[rarity] || 0;
}

/**
 * Lazy asset preloader: creates Image() objects for a curated set of assets after the
 * board has been rendered to avoid early network fetches during initial page load.
 * It uses the centralized ASSETS map exported from ./assets/index.js. This function
 * intentionally preloads only reasonable assets (frames, common icons, backgrounds)
 * rather than every single module artwork to keep initial network usage moderate.
 */
export function lazyPreloadAssets() {
  try {
    if (!window || !window.document) {
      return;
    }
    // avoid double-run
    if (window.__LAZY_ASSETS_PRELOADED) {
      return;
    }
    window.__LAZY_ASSETS_PRELOADED = true;
    const toPreload = [];
    try {
      // include global background images
      for (const k of Object.keys(BACKGROUNDS || {})) {
        const v = BACKGROUNDS[k];
        if (v) {
          toPreload.push(v);
        }
      }
      // include boss and mine assets
      if (bossImg) {
        toPreload.push(bossImg);
      }
      if (mineAsset) {
        toPreload.push(mineAsset);
      }
      // include common frames and mf_* defaults from each module dir
      for (const dirKey of Object.keys(ASSETS || {})) {
        const map = ASSETS[dirKey] || {};
        // prefer mf_common, mf_empty and mf_epic variants
        ['mf_common', 'mf_empty', 'mf_epic', 'mf_epic_plus', 'mf_legendary', 'mf_legendary_plus'].forEach(k => {
          if (map[k]) {
            toPreload.push(map[k]);
          }
        });
        // include a small sample of common_* keys
        const commonKeys = Object.keys(map)
          .filter(x => x.startsWith('common_'))
          .slice(0, 4);
        for (const ck of commonKeys) {
          toPreload.push(map[ck]);
        }
      }
    } catch (e) {
      /* best-effort */
    }
    // Deduplicate and actually create Image objects
    const uniq = Array.from(new Set(toPreload.filter(Boolean)));
    for (const src of uniq) {
      try {
        const img = new Image();
        img.src = src;
        // allow GC if not needed; don't attach to DOM
        img.onload = img.onerror = function() {
          /* noop */
        };
      } catch (e) {}
    }
    try {
      console.debug && console.debug('lazyPreloadAssets: started', uniq.length);
    } catch (e) {}
  } catch (e) {}
}
