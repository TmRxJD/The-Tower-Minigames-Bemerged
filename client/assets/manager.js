// Asset Management Module
// Handles asset resolution, preloading, and background management

export function createAssetManager({
  ASSETS,
  BACKGROUNDS,
  HARDCODED_COMMON_SELECTION,
  RARITY_COLOR,
  MINE_ASSET,
  TYPE_TOKENS,
  createModuleInstance,
  normalizeId,
  stableHash,
  appendToDebug,
}) {
  // Round-robin picker for common_* variants so we distribute multiple common mods evenly
  const __commonVariantCounters = {};
  function pickCommonVariant(dirKey, tmpl, map) {
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

  // Apply background
  function applyBackground(key) {
    try {
      if (!key) {
        const html = document.documentElement;
        const body = document.body;
        html.style.backgroundImage = '';
        html.style.backgroundSize = '';
        html.style.backgroundPosition = '';
        html.style.backgroundRepeat = '';
        html.style.backgroundAttachment = '';
        html.style.backgroundColor = '';
        html.style.height = '';
        html.style.minHeight = '';
        body.style.height = '';
        body.style.minHeight = '';
        try {
          localStorage.setItem('background', '');
        } catch (e) {}
        return;
      }
      const url = BACKGROUNDS[key];
      if (!url) {
        const html = document.documentElement;
        const body = document.body;
        html.style.backgroundImage = '';
        html.style.backgroundSize = '';
        html.style.backgroundPosition = '';
        html.style.backgroundRepeat = '';
        html.style.backgroundAttachment = '';
        html.style.backgroundColor = '';
        html.style.height = '';
        html.style.minHeight = '';
        body.style.height = '';
        body.style.minHeight = '';
        try {
          localStorage.setItem('background', '');
        } catch (e) {}
        return;
      }
      // Apply to root so background fills viewport and remains fixed during scroll
      try {
        const html = document.documentElement;
        const body = document.body;

        // Ensure html and body take full viewport height
        html.style.height = '100%';
        html.style.minHeight = '100vh';
        body.style.height = '100%';
        body.style.minHeight = '100vh';

        html.style.backgroundImage = `url("${url}")`;
        html.style.backgroundSize = 'cover';
        html.style.backgroundPosition = 'center center';
        html.style.backgroundRepeat = 'no-repeat';
        html.style.backgroundAttachment = 'fixed';
        // optional fallback background color to avoid flash
        html.style.backgroundColor = '#000';
      } catch (e) {
        // fallback
        document.body.style.backgroundImage = `url("${url}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
      }
      try {
        localStorage.setItem('background', key);
      } catch (e) {}
    } catch (e) {}
  }

  return {
    pickCommonVariant,
    applyBackground,
  };
}
