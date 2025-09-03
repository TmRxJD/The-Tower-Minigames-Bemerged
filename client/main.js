import { DiscordSDK } from "@discord/embedded-app-sdk";
import "./style.css";
// Also import the chart image using the root import pattern (mirrors the example)
import importedMergeChart from '/merge_chart.png';
import bossImg from '/assets/boss.png';
import bossHelper from './helpers/boss.js';
// Import using a relative path from this file to the assets folder so Vite/dev server can resolve it.
// Expect the asset to live in the client folder root so Vite can resolve it when serving from the client root
// Use root-style import like the example so Vite resolves the asset to a dev URL

// Debug verbosity control: set window.__MERGE_GAME_DEBUG_VERBOSE = true in the browser console
// to re-enable verbose debug output. Default is quiet (console.debug is no-op).
try {
  if (typeof window !== 'undefined') {
    if (!window.__MERGE_GAME_DEBUG_VERBOSE) {
      try { console.debug = function(){}; } catch (e) {}
    }
  }
} catch (e) {}

// Explicitly import module assets so Vite includes them (mirrors the preload list)
import gen_rare_sl from '/assets/modules_generator/rare_sl.png';
import gen_rare_sds from '/assets/modules_generator/rare_sds.png';
import gen_rare_os from '/assets/modules_generator/rare_os.png';
import gen_rare_ar from '/assets/modules_generator/rare_ar.png';
import gen_mf_rare_plus from '/assets/modules_generator/mf_rare_plus.png';
import gen_mf_rare from '/assets/modules_generator/mf_rare.png';
import gen_mf_mythic_plus from '/assets/modules_generator/mf_mythic_plus.png';
import gen_mf_mythic from '/assets/modules_generator/mf_mythic.png';
import gen_mf_legendary_plus from '/assets/modules_generator/mf_legendary_plus.png';
import gen_mf_legendary from '/assets/modules_generator/mf_legendary.png';
import gen_mf_epic_plus from '/assets/modules_generator/mf_epic_plus.png';
import gen_mf_epic from '/assets/modules_generator/mf_epic.png';
import gen_mf_empty from '/assets/modules_generator/mf_empty.png';
import gen_mf_common from '/assets/modules_generator/mf_common.png';
import gen_mf_ancestral from '/assets/modules_generator/mf_ancestral.png';
import gen_generator_type from '/assets/modules_generator/generator_type.png';
import gen_epic_sh from '/assets/modules_generator/epic_sh.png';
import gen_epic_ph from '/assets/modules_generator/epic_ph.png';
import gen_epic_gc from '/assets/modules_generator/epic_gc.png';
import gen_epic_bhd from '/assets/modules_generator/epic_bhd.png';
import gen_common_mc from '/assets/modules_generator/common_mc.png';
import gen_common_ec from '/assets/modules_generator/common_ec.png';

import core_type from '/assets/modules_core/type.png';
import core_rare_ms from '/assets/modules_core/rare_ms.png';
import core_rare_gl from '/assets/modules_core/rare_gl.png';
import core_rare_em from '/assets/modules_core/rare_em.png';
import core_rare_cs from '/assets/modules_core/rare_cs.png';
import core_mf_rare_plus from '/assets/modules_core/mf_rare_plus.png';
import core_mf_rare from '/assets/modules_core/mf_rare.png';
import core_mf_mythic_plus from '/assets/modules_core/mf_mythic_plus.png';
import core_mf_mythic from '/assets/modules_core/mf_mythic.png';
import core_mf_legendary_plus from '/assets/modules_core/mf_legendary_plus.png';
import core_mf_legendary from '/assets/modules_core/mf_legendary.png';
import core_mf_epic_plus from '/assets/modules_core/mf_epic_plus.png';
import core_mf_epic from '/assets/modules_core/mf_epic.png';
import core_mf_empty from '/assets/modules_core/mf_empty.png';
import core_mf_common from '/assets/modules_core/mf_common.png';
import core_mf_ancestral from '/assets/modules_core/mf_ancestral.png';
import core_epic_oc from '/assets/modules_core/epic_oc.png';
import core_epic_mvn from '/assets/modules_core/epic_mvn.png';
import core_epic_hc from '/assets/modules_core/epic_hc.png';
import core_epic_dc from '/assets/modules_core/epic_dc.png';
import core_common_mc from '/assets/modules_core/common_mc.png';
import core_common_ec from '/assets/modules_core/common_ec.png';

import arm_rare_pc from '/assets/modules_armor/rare_pc.png';
import arm_rare_ni from '/assets/modules_armor/rare_ni.png';
import arm_rare_dn from '/assets/modules_armor/rare_dn.png';
import arm_mf_rare_plus from '/assets/modules_armor/mf_rare_plus.png';
import arm_mf_rare from '/assets/modules_armor/mf_rare.png';
import arm_mf_mythic_plus from '/assets/modules_armor/mf_mythic_plus.png';
import arm_mf_mythic from '/assets/modules_armor/mf_mythic.png';
import arm_mf_legendary_plus from '/assets/modules_armor/mf_legendary_plus.png';
import arm_mf_legendary from '/assets/modules_armor/mf_legendary.png';
import arm_rare_sr from '/assets/modules_armor/rare_sr.png';
import arm_mf_epic_plus from '/assets/modules_armor/mf_epic_plus.png';
import arm_mf_epic from '/assets/modules_armor/mf_epic.png';
import arm_mf_empty from '/assets/modules_armor/mf_empty.png';
import arm_mf_common from '/assets/modules_armor/mf_common.png';
import arm_mf_ancestral from '/assets/modules_armor/mf_ancestral.png';
import arm_epic_wr from '/assets/modules_armor/epic_wr.png';
import arm_epic_sd from '/assets/modules_armor/epic_sd.png';
import arm_epic_nmp from '/assets/modules_armor/epic_nmp.png';
import arm_epic_acp from '/assets/modules_armor/epic_acp.png';
import arm_common_mb from '/assets/modules_armor/common_mb.png';
import arm_common_eb from '/assets/modules_armor/common_eb.png';
import arm_type from '/assets/modules_armor/type.png';

import can_mf_rare_plus from '/assets/modules_cannon/mf_rare_plus.png';
import can_mf_rare from '/assets/modules_cannon/mf_rare.png';
import can_mf_mythic_plus from '/assets/modules_cannon/mf_mythic_plus.png';
import can_mf_mythic from '/assets/modules_cannon/mf_mythic.png';
import can_mf_legendary_plus from '/assets/modules_cannon/mf_legendary_plus.png';
import can_mf_legendary from '/assets/modules_cannon/mf_legendary.png';
import can_mf_epic_plus from '/assets/modules_cannon/mf_epic_plus.png';
import can_mf_epic from '/assets/modules_cannon/mf_epic.png';
import can_mf_empty from '/assets/modules_cannon/mf_empty.png';
import can_mf_common from '/assets/modules_cannon/mf_common.png';
import can_mf_ancestral from '/assets/modules_cannon/mf_ancestral.png';
import can_epic_hb from '/assets/modules_cannon/epic_hb.png';
import can_epic_dp from '/assets/modules_cannon/epic_dp.png';
import can_epic_ba from '/assets/modules_cannon/epic_ba.png';
import can_epic_ad from '/assets/modules_cannon/epic_ad.png';
import can_common_mc from '/assets/modules_cannon/common_mc.png';
import can_common_ec from '/assets/modules_cannon/common_ec.png';
import can_type from '/assets/modules_cannon/type.png';
import can_rare_sb from '/assets/modules_cannon/rare_sb.png';
import can_rare_rb from '/assets/modules_cannon/rare_rb.png';
import can_rare_ob from '/assets/modules_cannon/rare_ob.png';
import can_rare_bb from '/assets/modules_cannon/rare_bb.png';

// Build lookup map by directory for runtime resolution (keys match /assets/modules_<type> folder names)
const ASSETS = {
  modules_generator: {
    'rare_sl': gen_rare_sl,
    'rare_sds': gen_rare_sds,
    'rare_os': gen_rare_os,
    'rare_ar': gen_rare_ar,
    'mf_rare_plus': gen_mf_rare_plus,
    'mf_rare': gen_mf_rare,
    'mf_mythic_plus': gen_mf_mythic_plus,
    'mf_mythic': gen_mf_mythic,
    'mf_legendary_plus': gen_mf_legendary_plus,
    'mf_legendary': gen_mf_legendary,
    'mf_epic_plus': gen_mf_epic_plus,
    'mf_epic': gen_mf_epic,
    'mf_empty': gen_mf_empty,
    'mf_common': gen_mf_common,
    'mf_ancestral': gen_mf_ancestral,
    'generator_type': gen_generator_type,
    'epic_sh': gen_epic_sh,
    'epic_ph': gen_epic_ph,
    'epic_gc': gen_epic_gc,
    'epic_bhd': gen_epic_bhd,
    'common_mc': gen_common_mc,
    'common_ec': gen_common_ec,
  },
  modules_core: {
    'type': core_type,
    'rare_ms': core_rare_ms,
    'rare_gl': core_rare_gl,
    'rare_em': core_rare_em,
    'rare_cs': core_rare_cs,
    'mf_rare_plus': core_mf_rare_plus,
    'mf_rare': core_mf_rare,
    'mf_mythic_plus': core_mf_mythic_plus,
    'mf_mythic': core_mf_mythic,
    'mf_legendary_plus': core_mf_legendary_plus,
    'mf_legendary': core_mf_legendary,
    'mf_epic_plus': core_mf_epic_plus,
    'mf_epic': core_mf_epic,
    'mf_empty': core_mf_empty,
    'mf_common': core_mf_common,
    'mf_ancestral': core_mf_ancestral,
    'epic_oc': core_epic_oc,
    'epic_mvn': core_epic_mvn,
    'epic_hc': core_epic_hc,
    'epic_dc': core_epic_dc,
    'common_mc': core_common_mc,
    'common_ec': core_common_ec,
  },
  modules_armor: {
    'rare_pc': arm_rare_pc,
    'rare_ni': arm_rare_ni,
    'rare_dn': arm_rare_dn,
    'mf_rare_plus': arm_mf_rare_plus,
    'mf_rare': arm_mf_rare,
    'mf_mythic_plus': arm_mf_mythic_plus,
    'mf_mythic': arm_mf_mythic,
    'mf_legendary_plus': arm_mf_legendary_plus,
    'mf_legendary': arm_mf_legendary,
    'rare_sr': arm_rare_sr,
    'mf_epic_plus': arm_mf_epic_plus,
    'mf_epic': arm_mf_epic,
    'mf_empty': arm_mf_empty,
    'mf_common': arm_mf_common,
    'mf_ancestral': arm_mf_ancestral,
    'epic_wr': arm_epic_wr,
    'epic_sd': arm_epic_sd,
    'epic_nmp': arm_epic_nmp,
    'epic_acp': arm_epic_acp,
    'common_mb': arm_common_mb,
    'common_eb': arm_common_eb,
    'type': arm_type,
  },
  modules_cannon: {
    'mf_rare_plus': can_mf_rare_plus,
    'mf_rare': can_mf_rare,
    'mf_mythic_plus': can_mf_mythic_plus,
    'mf_mythic': can_mf_mythic,
    'mf_legendary_plus': can_mf_legendary_plus,
    'mf_legendary': can_mf_legendary,
    'mf_epic_plus': can_mf_epic_plus,
    'mf_epic': can_mf_epic,
    'mf_empty': can_mf_empty,
    'mf_common': can_mf_common,
    'mf_ancestral': can_mf_ancestral,
    'epic_hb': can_epic_hb,
    'epic_dp': can_epic_dp,
    'epic_ba': can_epic_ba,
    'epic_ad': can_epic_ad,
    'common_mc': can_common_mc,
    'common_ec': can_common_ec,
    'type': can_type,
    'rare_sb': can_rare_sb,
    'rare_rb': can_rare_rb,
    'rare_ob': can_rare_ob,
    'rare_bb': can_rare_bb,
  }
};
// Use Vite's import.meta.glob to eagerly load any module assets we didn't explicitly import above.
// This ensures the dev server resolves all files under ./assets/modules_*/ and populates ASSETS
// so runtime lookups succeed even if a manual import was missed.
try {
  const __glob = import.meta.glob('./assets/modules_*/**/*.png', { eager: true, query: '?url', import: 'default' });
  let __globCount = 0;
  for (const p in __glob) {
    try {
      // p looks like './assets/modules_generator/mf_rare.png'
      const m = p.match(/\.\/assets\/(modules_[^\/]+)\/([^\/]+)\.png$/);
      if (!m) continue;
      const dir = m[1];
      const name = m[2];
      ASSETS[dir] = ASSETS[dir] || {};
      if (!ASSETS[dir][name]) {
        ASSETS[dir][name] = __glob[p];
        __globCount++;
      }
    } catch (e) { /* ignore single-file parse errors */ }
  }
  try { appendToDebug && appendToDebug(`Globbed ${__globCount} module assets into ASSETS`); } catch (e) {}
} catch (e) {
  // import.meta.glob may not be supported in some non-Vite environments; ignore if it fails.
  try { appendToDebug && appendToDebug('import.meta.glob for module assets not available: ' + String(e)); } catch (e2) {}
}

// Background assets: glob entire backgrounds folder and expose a simple map of name->url
const BACKGROUNDS = {};
try {
  const __bgglob = import.meta.glob('./assets/backgrounds/**/*.png', { eager: true, query: '?url', import: 'default' });
  let __bgCount = 0;
  for (const p in __bgglob) {
    try {
      // p looks like './assets/backgrounds/DarkBeing_channel.png'
      const m = p.match(/\.\/assets\/backgrounds\/([^\/]+)\.png$/i);
      if (!m) continue;
      const name = m[1];
      BACKGROUNDS[name] = __bgglob[p];
      __bgCount++;
    } catch (e) { }
  }
  try { console.debug && console.debug(`Globbed ${__bgCount} background assets into BACKGROUNDS`); } catch (e) {}
} catch (e) {
  try { console.debug && console.debug('import.meta.glob for backgrounds not available: ' + String(e)); } catch (e2) {}
}

// Mine asset: import single mine.png the same way module/background assets are imported
let MINE_ASSET = null;
try {
  const __mine = import.meta.glob('./assets/mine.png', { eager: true, query: '?url', import: 'default' });
  for (const p in __mine) {
    try { MINE_ASSET = __mine[p]; break; } catch (e) {}
  }
  try { appendToDebug && appendToDebug('Loaded mine asset: ' + String(!!MINE_ASSET)); } catch (e) {}
} catch (e) {
  try { appendToDebug && appendToDebug('import.meta.glob for mine asset not available: ' + String(e)); } catch (e2) {}
}

// Initialize boss helper with a small API surface after UI init
function initBossIntegration() {
  try {
    // Build dev options from persisted sources (localStorage keys and/or main save payload)
    let restoredDevOpts = {};
    try {
      const s = localStorage.getItem('devBossSpawn');
      const h = localStorage.getItem('devBossHits');
      const t = localStorage.getItem('devBossThreshold');
      if (s) {
        const v = parseFloat(s);
        if (!isNaN(v)) {
          // stored value may be a percent (e.g. 90) or a fraction (e.g. 0.9)
          restoredDevOpts.spawnChance = (v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v)));
        }
      }
      if (h) restoredDevOpts.requiredHits = parseInt(h,10) || undefined;
      if (t) restoredDevOpts.destructiveMoveThreshold = parseInt(t,10) || undefined;
    } catch (e) {}
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const st = JSON.parse(raw);
        if (st && st.settings) {
          if (!restoredDevOpts.spawnChance && st.settings.devBossSpawn) restoredDevOpts.spawnChance = parseFloat(st.settings.devBossSpawn) || undefined;
          if (!restoredDevOpts.requiredHits && st.settings.devBossHits) restoredDevOpts.requiredHits = parseInt(st.settings.devBossHits,10) || undefined;
          if (!restoredDevOpts.destructiveMoveThreshold && st.settings.devBossThreshold) restoredDevOpts.destructiveMoveThreshold = parseInt(st.settings.devBossThreshold,10) || undefined;
        }
      }
    } catch (e) {}

    bossHelper.init({
      BOARD_ROWS, BOARD_COLS, moveCount,
      getCellAt: (r,c) => (board[r] && board[r][c]) ? board[r][c] : null,
      removeCellAt: (r,c) => { if (board[r]) board[r][c] = null; },
      awardShards: (type, amt) => awardShards(type, amt),
      renderBoard: () => renderBoard(),
      appendToDebug: appendToDebug,
      onBossDefeated: (b) => { /* reward placeholder: grant shards to all players? currently just log */ appendToDebug && appendToDebug('Boss defeated at ' + JSON.stringify(b)); },
      setBossOnBoard: (b) => { /* store boss marker on board for rendering hooks (not placing a real cell) */ window.__BOSS_MARKER = b || null; },
      getCellAtRaw: (r,c) => (board[r] && board[r][c]) ? board[r][c] : null,
    }, restoredDevOpts);

    // Ensure boss marker and helper opts are restored from main save payload if present
    try {
      const rawMain = localStorage.getItem(SAVE_KEY);
      if (rawMain) {
        const st = JSON.parse(rawMain);
        if (st && st.bossState) {
          const bs = st.bossState;
          // write helper-local key for compatibility
          try { localStorage.setItem('boss_state_v1', JSON.stringify(bs)); } catch (e) {}
          // pass the saved state into the boss helper explicitly via setState
          try { bossHelper.setState && bossHelper.setState(bs); } catch (e) {}
          // apply saved opts if present
          if (bs.opts && typeof bs.opts === 'object') {
            try { bossHelper.setDevOptions && bossHelper.setDevOptions(bs.opts); appendToDebug && appendToDebug('Restored boss opts from main save'); } catch (e) {}
          }
        }
      }
    } catch (e) { console.error('initBossIntegration: restore-from-save failed', e); }
    // Apply persisted dev boss overrides if present in localStorage (separate from main save)
      try {
        const s = localStorage.getItem('devBossSpawn');
        const h = localStorage.getItem('devBossHits');
        const t = localStorage.getItem('devBossThreshold');
        try { console.debug('initBossIntegration: loaded devBoss keys', { s, h, t }); } catch (e) {}
        const opts = {};
        if (s) {
          const v = parseFloat(s);
          if (!isNaN(v)) opts.spawnChance = (v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v)));
        }
        if (h) opts.requiredHits = parseInt(h,10) || undefined;
        if (t) opts.destructiveMoveThreshold = parseInt(t,10) || undefined;
        if (Object.keys(opts).length > 0) {
          try { bossHelper.setDevOptions && bossHelper.setDevOptions(opts); appendToDebug && appendToDebug('Applied persisted boss dev opts: ' + JSON.stringify(opts)); console.debug('Applied persisted boss dev opts', opts); } catch (e) { console.error('Failed applying persisted boss dev opts', e); }
        }
      } catch (e) { console.error('Error reading persisted boss dev opts', e); }
  } catch (e) { console.error('initBossIntegration failed', e); }
}

function formatBackgroundDisplay(name) {
  if (!name) return 'None';
  // remove common suffix _channel (case-insensitive)
  let s = String(name).replace(/_channel$/i, '');
  // insert spaces for camelCase (DarkBeing -> Dark Being)
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  // replace underscores with spaces and collapse multiple spaces
  s = s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

function applyBackground(key) {
  try {
    if (!key) {
      document.body.style.backgroundImage = '';
      try { localStorage.setItem('background', ''); } catch (e) {}
      return;
    }
    const url = BACKGROUNDS[key];
    if (!url) {
      document.body.style.backgroundImage = '';
      try { localStorage.setItem('background', ''); } catch (e) {}
      return;
    }
    // Apply to root so background fills viewport and remains fixed during scroll
    try {
      document.body.style.backgroundImage = '';
      const html = document.documentElement;
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
    try { localStorage.setItem('background', key); } catch (e) {}
  } catch (e) {}
}

// Round-robin picker for common_* variants so we distribute multiple common mods evenly
const __commonVariantCounters = {};
function pickCommonVariant(dirKey, tmpl, map) {
  const candidates = [];
  if (tmpl) {
    const exact = 'common_' + tmpl;
    if (map[exact]) candidates.push(exact);
    for (const k of Object.keys(map)) {
      if (k.startsWith('common_') && k.endsWith('_' + tmpl) && !candidates.includes(k)) candidates.push(k);
    }
  }
  if (candidates.length === 0) {
    for (const k of Object.keys(map)) if (k.startsWith('common_')) candidates.push(k);
  }
  if (candidates.length === 0) return null;
  const keyBase = dirKey + '::' + (tmpl || '__any__');
  let idx = __commonVariantCounters[keyBase] || 0;
  const chosen = candidates[idx % candidates.length];
  __commonVariantCounters[keyBase] = (idx + 1) % candidates.length;
  return chosen;
}

// Normalizes template ids / filenames for lookup
function normalizeId(id) { return String(id || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Stable hash for instanceId -> integer
function stableHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Hardcoded common selection map: map normalized templateId -> common key to use (e.g. 'common_mc' or 'common_ec').
// Populate this with the exact template -> common key assignments you want to hard-wire.
const HARDCODED_COMMON_SELECTION = {
  // Example:
  // 'templ1': 'common_mc',
  // 'templ2': 'common_ec',
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
              // no commons anywhere: downgrade frame to empty if available
              if (map['mf_empty']) frameKey = 'mf_empty'; else frameKey = null;
            }
          }
        }
      }
    }

    // Attach resolved keys and URLs for stable rendering
    // Helper: search ASSETS for a given key across directories
    const findAssetSrc = (key) => {
      for (const dk of Object.keys(ASSETS)) {
        const m = ASSETS[dk] || {};
        if (m[key]) return m[key];
      }
      return null;
    };
  mod._assetKey = moduleKey || null;
    // Prefer any moduleSrc already found; otherwise look it up globally
    let resolvedAssetSrc = null;
    if (moduleKey) {
      // if we forced an exact asset earlier, use it; otherwise try current dir then global
      if (forcedAssetSrc) resolvedAssetSrc = forcedAssetSrc;
      else resolvedAssetSrc = (map[moduleKey]) ? map[moduleKey] : findAssetSrc(moduleKey);
    }
    mod._assetSrc = resolvedAssetSrc || null;
    mod._frameKey = frameKey || null;
    // frame may live in a different dir; locate it globally
    let resolvedFrameSrc = null;
    if (frameKey) {
      // if we forced a dir earlier and that dir has the frame, prefer that
      if (forcedAssetDir && ASSETS[forcedAssetDir] && ASSETS[forcedAssetDir][frameKey]) resolvedFrameSrc = ASSETS[forcedAssetDir][frameKey];
      else resolvedFrameSrc = (map[frameKey]) ? map[frameKey] : findAssetSrc(frameKey);
    }
  mod._frameSrc = resolvedFrameSrc || null;
  // Mark assigned so future calls won't change these values
  try { mod._assetAssigned = true; } catch (e) {}
  } catch (e) {
    mod._assetKey = null; mod._assetSrc = null; mod._frameKey = null; mod._frameSrc = null;
  }
}

// Toggle this to show/hide the Dev tools button in the game UI. When `dev` is false,
// the Show/Hide Dev tools control will not appear.
const dev = true;
// Runtime visibility state for the dev tools portal (console). Defaults to visible.
let DEV_TOOLS_VISIBLE = true;
// Timer state (seconds elapsed)
let gameTimerSeconds = 0;
let gameTimerInterval = null;
let gameTimerStart = null; // epoch ms when timer started

function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  // Define units in seconds using reasonable calendar approximations
  const SEC = 1;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY; // approximate month as 30 days
  const YEAR = 365 * DAY; // approximate year as 365 days

  let rem = s;
  const years = Math.floor(rem / YEAR); rem -= years * YEAR;
  const months = Math.floor(rem / MONTH); rem -= months * MONTH;
  const weeks = Math.floor(rem / WEEK); rem -= weeks * WEEK;
  const days = Math.floor(rem / DAY); rem -= days * DAY;
  const hours = Math.floor(rem / HOUR); rem -= hours * HOUR;
  const minutes = Math.floor(rem / MIN); rem -= minutes * MIN;
  const secondsLeft = rem;

  const prefix = [];
  if (years) prefix.push(years + 'Y');
  if (months) prefix.push(months + 'M');
  if (weeks) prefix.push(weeks + 'W');
  if (days) prefix.push(days + 'D');

  const pad = (n) => String(n).padStart(2, '0');
  let timePart;
  if (hours > 0) {
    timePart = `${hours}:${pad(minutes)}:${pad(secondsLeft)}`;
  } else {
    // show minutes:seconds (minutes may be 0, which yields 0:SS)
    timePart = `${minutes}:${pad(secondsLeft)}`;
  }

  if (prefix.length > 0) return prefix.join(' ') + ' ' + timePart;
  return timePart;
}

function startGameTimer() {
  try {
    stopGameTimer();
    // load persisted start if available
    try {
      const saved = localStorage.getItem('gameTimerStart');
      if (saved && !isNaN(parseInt(saved, 10))) gameTimerStart = parseInt(saved, 10);
      if (!gameTimerStart) { gameTimerStart = Date.now(); try { localStorage.setItem('gameTimerStart', String(gameTimerStart)); } catch (e) {} }
    } catch (e) { if (!gameTimerStart) gameTimerStart = Date.now(); }
    try { localStorage.setItem('gameTimerRunning', '1'); } catch (e) {}
  gameTimerInterval = setInterval(() => {
      try {
        const elapsed = Math.floor((Date.now() - (gameTimerStart || Date.now())) / 1000);
        gameTimerSeconds = Math.max(0, elapsed);
    const el = document.getElementById('game-timer');
    if (el) el.textContent = formatTimer(gameTimerSeconds);
      } catch (e) {}
    }, 1000);
  // immediate tick
  try { const el = document.getElementById('game-timer'); if (el) el.textContent = formatTimer(Math.floor((Date.now() - (gameTimerStart || Date.now()))/1000)); } catch (e) {}
  } catch (e) {}
}

function stopGameTimer() {
  try { if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; } try { localStorage.setItem('gameTimerRunning', '0'); } catch (e) {} } catch (e) {}
}

function resetGameTimer() {
  try {
    stopGameTimer();
    gameTimerSeconds = 0;
    gameTimerStart = Date.now();
    try { localStorage.setItem('gameTimerStart', String(gameTimerStart)); localStorage.setItem('gameTimerRunning', '1'); } catch (e) {}
    const el = document.getElementById('game-timer');
    if (el) el.textContent = formatTimer(gameTimerSeconds);
  } catch (e) {}
}
// Top-level debug: log the imported value early so we can see it even if DOMContentLoaded doesn't fire
try { console.debug('Top-level mergeChart import value:', mergeChart); } catch (e) {}

// Discord SDK setup (preserved)
let auth;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");
});
async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds", "applications.commands"],
  });
  const response = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const { access_token } = await response.json();
  auth = await discordSdk.commands.authenticate({ access_token });
  if (auth == null) throw new Error("Authenticate command failed");
}

// Synchronously detect & remove any immediate shatterable groups (Commons always; Rares if enabled).
// This runs without animation to ensure no groups formed by a swap are missed, then returns true
// if any groups were removed. After calling this you should invoke `cascadeResolve()` to animate
// further cascades and falling tiles.
async function resolveImmediateShatters() {
  // detect groups same as in cascadeResolve
  const groups = findAllGroups((cell) => {
            if (!cell) return false; 
            if (cell.rarity === 'Common') return true; 
            if (cell.rarity === 'Rare' && !cell.plus) return !!autoShatterRares; 
            return false; 
  }).filter(g => g.length >= 3 && hasStraightTriple(g));
  if (!groups || groups.length === 0) return false;

    // mark groups for clearing so we can show the clearing animation
  // mark only straight-run positions for clearing animation
  const immediatePositions = [];
  for (const g of groups) {
    const straight = extractStraightRunPositions(g);
    for (const p of straight) {
      const c = board[p.r][p.c];
      if (c) c.clearing = true;
      immediatePositions.push(p);
    }
  }
  renderBoard();
  // small delay to show clearing animation
  await sleepAnimated(160);

  // now actually remove and award score
  for (const g of groups) {
    // compute only the straight-run positions inside this connected group
    const toRemove = extractStraightRunPositions(g);
    for (const p of toRemove) {
      const rem = board[p.r][p.c];
      if (rem) {
          // Mines themselves are not worth shards; only surrounding modules count
          if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
            try {
              const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
              const shards = shardMap[rem.rarity] || 0;
              const shType = rem.type || 'Unknown';
              awardShards(shType, shards);
              totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1;
            } catch (e) {}
          }
      }
      board[p.r][p.c] = null;
    }
  }

  // collapse/fill will be animated by cascadeResolve; do a quick render now
  renderBoard();
  return true;
}

// Bejeweled logic
// Merge puzzle implementation (per spec)
// Support rectangular boards via BOARD_ROWS x BOARD_COLS. Default is portrait 8x14 (rows x cols).
let BOARD_ROWS = 8;
let BOARD_COLS = 14;
// Treat 14 columns as landscape by default
let ORIENTATION = 'landscape'; // 'landscape' => 8x14 (wide), 'portrait' => 14x8 (tall)
let CHART_VISIBLE = true;

// Rarity colors (hex)
const RARITY_COLOR = {
  Common: '#808080', // Gray
  Rare: '#ADD8E6', // Light Blue
  Epic: '#FF69B4', // Pink
  Legendary: '#FFD700', // Gold
  Mythic: '#FF0000', // Red
  Ancestral: '#00FF00', // Green
};

// Shapes by module type
const TYPE_SHAPE = {
  Cannon: 'circle',
  Generator: 'triangle',
  Armor: 'square',
  Core: 'diamond',
};

// Unique modules (start at Epic)
const MODULE_TEMPLATES = [
  // Cannon (circle) - unique
  { id: 'AD', name: 'Astral Deliverance', type: 'Cannon', initials: 'AD', unique: true },
  { id: 'BA', name: 'Being Annihilator', type: 'Cannon', initials: 'BA', unique: true },
  { id: 'DP', name: 'Death Penalty', type: 'Cannon', initials: 'DP', unique: true },
  { id: 'HB', name: 'Havoc Bringer', type: 'Cannon', initials: 'HB', unique: true },

  // Armor / Defense (square) - unique
  { id: 'A-CP', name: 'Anti-Cube Portal', type: 'Armor', initials: 'ACP', unique: true },
  { id: 'NMP', name: 'Negative Mass Projector', type: 'Armor', initials: 'NMP', unique: true },
  { id: 'WR', name: 'Wormhole Redirector', type: 'Armor', initials: 'WR', unique: true },
  { id: 'SD', name: 'Space Displacer', type: 'Armor', initials: 'SD', unique: true },

  // Generator (triangle) - unique
  { id: 'SH', name: 'Singularity Harness', type: 'Generator', initials: 'SH', unique: true },
  { id: 'GC', name: 'Galaxy Compressor', type: 'Generator', initials: 'GC', unique: true },
  { id: 'PH', name: 'Pulsar Harvester', type: 'Generator', initials: 'PH', unique: true },
  { id: 'BHD', name: 'Black Hole Digestor', type: 'Generator', initials: 'BHD', unique: true },

  // Core (diamond) - unique
  { id: 'OC', name: 'Om Chip', type: 'Core', initials: 'OC', unique: true },
  { id: 'HC', name: 'Harmony Conductor', type: 'Core', initials: 'HC', unique: true },
  { id: 'DC', name: 'Dimension Core', type: 'Core', initials: 'DC', unique: true },
  { id: 'MVN', name: 'Multiverse Nexus', type: 'Core', initials: 'MVN', unique: true },
];

// Rare-tier non-unique / fodder templates (can spawn Rare..Legendary)
const RARE_TEMPLATES = [
  // Cannon (circle) - fodder (rare..legendary)
  { id: 'OB', name: 'OB', type: 'Cannon', initials: 'OB', unique: false },
  { id: 'RB', name: 'RB', type: 'Cannon', initials: 'RB', unique: false },
  { id: 'BB', name: 'BB', type: 'Cannon', initials: 'BB', unique: false },
  { id: 'SB', name: 'SB', type: 'Cannon', initials: 'SB', unique: false },

  // Armor / Defense (square) - fodder
  { id: 'NI', name: 'NI', type: 'Armor', initials: 'NI', unique: false },
  { id: 'PC', name: 'PC', type: 'Armor', initials: 'PC', unique: false },
  { id: 'SR', name: 'SR', type: 'Armor', initials: 'SR', unique: false },
  { id: 'DN', name: 'DN', type: 'Armor', initials: 'DN', unique: false },

  // Generator (triangle) - fodder
  { id: 'SL', name: 'SL', type: 'Generator', initials: 'SL', unique: false },
  { id: 'OS', name: 'OS', type: 'Generator', initials: 'OS', unique: false },
  { id: 'AR', name: 'AR', type: 'Generator', initials: 'AR', unique: false },
  { id: 'SDS', name: 'SDS', type: 'Generator', initials: 'SDS', unique: false },

  // Core (diamond) - fodder
  { id: 'GL', name: 'GL', type: 'Core', initials: 'GL', unique: false },
  { id: 'MS', name: 'MS', type: 'Core', initials: 'MS', unique: false },
  { id: 'EM', name: 'EM', type: 'Core', initials: 'EM', unique: false },
  { id: 'CS', name: 'CS', type: 'Core', initials: 'CS', unique: false },
];

// Common-tier named commons (Common-only)
const COMMON_TEMPLATES = [
  // Cannon commons
  { id: 'EC_C', name: 'EC', type: 'Cannon', initials: 'EC', unique: false },
  { id: 'MC_C', name: 'MC', type: 'Cannon', initials: 'MC', unique: false },
  // Armor commons
  { id: 'EB', name: 'EB', type: 'Armor', initials: 'EB', unique: false },
  { id: 'MB', name: 'MB', type: 'Armor', initials: 'MB', unique: false },
  // Generator commons
  { id: 'MC_G', name: 'MC', type: 'Generator', initials: 'MC', unique: false },
  { id: 'EC_G', name: 'EC', type: 'Generator', initials: 'EC', unique: false },
  // Core commons
  { id: 'EC_CO', name: 'EC', type: 'Core', initials: 'EC', unique: false },
  { id: 'MC_CO', name: 'MC', type: 'Core', initials: 'MC', unique: false },
];

// Assign explicit allowed rarity ranges per template.
// Uniques can only spawn as Epic. Non-unique rare templates spawn as Rare. Commons spawn as Common.
MODULE_TEMPLATES.forEach(t => { t.minRarity = 'Epic'; t.maxRarity = 'Epic'; t.unique = true; });
RARE_TEMPLATES.forEach(t => { t.minRarity = 'Rare'; t.maxRarity = 'Rare'; t.unique = false; });
COMMON_TEMPLATES.forEach(t => { t.minRarity = 'Common'; t.maxRarity = 'Common'; t.unique = false; });

const ALL_TEMPLATES = MODULE_TEMPLATES.concat(RARE_TEMPLATES, COMMON_TEMPLATES);

const RARITY_RANK = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4, Ancestral: 5 };

// Base distribution across rarities (percent)
const BASE_RATES = {
  Common: 68.5 / 100,
  Rare: 29 / 100,
  Epic: 2.5 / 100,
};

// --- Mine feature: spawn a mine by percent chance per new tile (configurable)
let MINE_SPAWN_PERCENT = 1; // default: 1% chance per new tile
try { const saved = localStorage.getItem('devMineRate'); if (saved) MINE_SPAWN_PERCENT = Math.max(0, parseFloat(saved) || 1); } catch (e) {}

// pending explosion queue (coords) — used when mines are removed by shatter or countdown
const pendingExplosions = [];

// flag set when a player action caused board changes; used to decrement mines on move
let moveOccurredThisTurn = false;


// If HARDCODED_COMMON_SELECTION is empty, auto-populate it deterministically so commons are hard-wired.
// Assign each COMMON_TEMPLATES entry to one of the common_* keys in that module type's ASSETS dir (round-robin).
try {
  if (Object.keys(HARDCODED_COMMON_SELECTION).length === 0 && typeof COMMON_TEMPLATES !== 'undefined') {
    const byType = {};
    for (const t of COMMON_TEMPLATES) {
      byType[t.type] = byType[t.type] || [];
      byType[t.type].push(t);
    }
    for (const type of Object.keys(byType)) {
      const dirKey = 'modules_' + type.toLowerCase();
      const map = ASSETS[dirKey] || {};
      const commons = Object.keys(map).filter(k => k.startsWith('common_')).sort();
      if (commons.length === 0) continue;
      const list = byType[type];
      for (let i = 0; i < list.length; i++) {
        const tmpl = normalizeId(list[i].id || list[i].templateId || list[i].name || '');
        const chosen = commons[i % commons.length];
        HARDCODED_COMMON_SELECTION[tmpl] = chosen;
      }
    }
  }
} catch (e) { /* ignore */ }

// For simplicity, drops pick a rarity according to BASE_RATES, then pick a template uniformly among MODULE_TEMPLATES
// Epic drop redistributions are handled when Ancestral 5-star modules are completed

let board = []; // grid of module instances or null
let selected = []; // selections (first is base)
let animating = false;
let badLuckCounter = 0; // replenishes since last Epic
let inventory = { Cannon: null, Generator: null, Armor: null, Core: null }; // one slot per type
let completed = {}; // id -> stars (when 5★ Ancestral completed, moved here)
let placingFromInventory = null; // type currently placing (string) or null
let commonSwapRemaining = 20; // limit of swaps that involve Commons
let shuffleRemaining = 3; // number of allowed shuffles
let score = 0; // player score from shattering
// Session stats
let moveCount = 0;
let totalMerges = 0;
let totalShatters = 0; // count of module shatters (not shards)
let shardsEarned = { Cannon: 0, Armor: 0, Generator: 0, Core: 0 };
let autoShatterRares = false; // whether cascade auto-shatters plain Rares (not Rare+)
let longPressTimer = null; // for pointer long-press detection
let mergeSelecting = false; // true while user is in long-press merge selection mode
let candidateHighlights = new Set(); // set of 'r,c' strings for auto-highlighted candidates
// Dev toggle: allow swapping any tiles regardless of adjacency/rules
// Free-swap is now the default game behavior: allow non-adjacent swaps by default
let DEV_FREE_SWAP = true;
// inactivity / hinting
let inactivityTimer = null;
const INACTIVITY_TIMEOUT_MS = 20000; // 20 seconds
let hintMove = null; // {r,c,nr,nc}

// helpers
function rand() { return Math.random(); }
function uid() { return Math.random().toString(36).slice(2, 9); }

function createModuleInstance(templateId, rarity = 'Common', plus = false, stars = 0) {
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

// Centralized shard awarding helper so updates always refresh UI and emit debug logs
function awardShards(shType, shards) {
  try {
    if (!shType) shType = 'Unknown';
    const n = Number(shards) || 0;
    if (n === 0) return;
    if (!shardsEarned[shType]) shardsEarned[shType] = 0;
    shardsEarned[shType] += n;
  // Keep legacy `score` variable synchronized: total shards equals sum of per-type shards
  try { score = Object.values(shardsEarned || {}).reduce((a,b) => a + (Number(b)||0), 0); } catch (e) {}
  try { updateScoreUI(); } catch (e) {}
  try { appendToDebug && appendToDebug(`awardShards: ${shType} += ${n} (total=${shardsEarned[shType]})`); } catch (e) {}
  try { console.debug && console.debug('awardShards', shType, n, shardsEarned[shType]); } catch (e) {}
  // Provide a conspicuous, reliable debug marker for the browser console and tester
  try { window.lastAwardedDebug = { type: shType, added: n, total: shardsEarned[shType] }; } catch (e) {}
  try { console.info && console.info('awardShards (info)', shType, n, shardsEarned[shType]); } catch (e) {}
  } catch (e) {}
}

// Export and mark awardShards on the window for robust runtime detection/debugging
try {
  try { window.awardShards = awardShards; } catch (e) {}
  try { window.__awardShards_marker = 'awardShards_defined_' + (new Date()).toISOString(); } catch (e) {}
  try { console.info && console.info('awardShards exported to window; marker=', window.__awardShards_marker); } catch (e) {}
} catch (e) {}

// Create a mine instance object (special cell). Mines are represented by rarity 'Mine'.
function createMineInstance() {
  const inst = {
    instanceId: uid(),
    templateId: '__MINE__',
    name: 'Mine',
    type: 'Mine',
    shape: 'circle',
    initials: 'M',
    unique: false,
    rarity: 'Mine',
    plus: false,
    stars: 0,
    // movesRemaining until explosion; visible on tile. Default 10 moves.
    movesRemaining: 10,
  };
  return inst;
}

// compute per-template rates for a drop (templates are all candidates for Epic/Rare/Common selection)
function computeTemplateRates() {
  // For this initial implementation: pick rarity by BASE_RATES, then pick template uniformly from MODULE_TEMPLATES
  const templates = MODULE_TEMPLATES;
  return templates.map(t => ({ templateId: t.id, weight: 1 / templates.length }));
}

function rollRarity() {
  const r = rand();
  if (r < BASE_RATES.Common) return 'Common';
  if (r < BASE_RATES.Common + BASE_RATES.Rare) return 'Rare';
  return 'Epic';
}

function makeDrop() {
  // Bad luck protection
  if (badLuckCounter >= 150) {
    badLuckCounter = 0;
    return spawnOfRarity('Epic');
  }
  const rarity = rollRarity();
  if (rarity === 'Epic') badLuckCounter = 0; else badLuckCounter++;
  const inst = spawnOfRarity(rarity);
  return inst;
}

function spawnOfRarity(rarity) {
  // Dev override: if a developer selected a specific Epic template in the in-page debug console,
  // honor that choice and spawn it instead of a random Epic. Stored in localStorage key 'devNextEpic'.
  if (rarity === 'Epic') {
    try {
      const devChoice = localStorage.getItem('devNextEpic');
      if (devChoice && devChoice !== 'Random') {
        const tdev = ALL_TEMPLATES.find(x => x.id === devChoice);
        if (tdev) {
          appendToDebug && appendToDebug('Dev override: spawning Epic ' + devChoice);
          return createModuleInstance(tdev.id, 'Epic', false, 0);
        }
      }
    } catch (e) { /* ignore localStorage errors */ }
  }
  // pick a template uniformly among those whose minRarity <= desired rarity <= maxRarity
  const rank = RARITY_RANK[rarity] ?? 0;
  const candidates = ALL_TEMPLATES.filter(t => {
    const min = RARITY_RANK[t.minRarity] ?? 0;
    const max = RARITY_RANK[t.maxRarity] ?? 0;
    return min <= rank && rank <= max;
  });
  if (candidates.length === 0) {
    // fallback: pick any template of same rarity by mapping rarity -> array
    const fallback = ALL_TEMPLATES.filter(t => {
      const min = RARITY_RANK[t.minRarity] ?? 0;
      const max = RARITY_RANK[t.maxRarity] ?? 0;
      return min <= rank && rank <= max;
    });
    if (fallback.length === 0) throw new Error('No candidate templates for rarity ' + rarity);
    const tf = fallback[Math.floor(Math.random() * fallback.length)];
    return createModuleInstance(tf.id, rarity, false, rarity === 'Ancestral' ? 1 : 0);
  }
  const t = candidates[Math.floor(Math.random() * candidates.length)];
  return createModuleInstance(t.id, rarity, false, rarity === 'Ancestral' ? 1 : 0);
}

function createBoard() {
  try { appendToDebug && appendToDebug('createBoard called'); } catch(e){}
  try { console.debug && console.debug('createBoard() stack', new Error().stack); } catch(e){}
  board = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      const row = [];
      for (let c = 0; c < BOARD_COLS; c++) {
      row.push(makeDrop());
    }
    board.push(row);
  }
}

// Shuffle the board in-place with a small spawning animation, then run cascadeResolve()
async function shuffleBoardAnimated() {
  if (shuffleRemaining <= 0) { alert('No shuffles remaining'); return; }
    shuffleRemaining = Math.max(0, shuffleRemaining - 1);
    // gather all non-null cells and shuffle positions
    const cells = [];
  for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) if (board[r] && board[r][c]) cells.push(board[r][c]);
  // fill any remaining spots with nulls to keep size consistent
  while (cells.length < BOARD_ROWS * BOARD_COLS) cells.push(null);
  // Fisher-Yates
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
  }
  // place back into board and mark as spawning for brief animation
  let idx = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = cells[idx++];
      board[r][c] = cell;
      if (cell) cell.spawning = true;
    }
  }
  renderBoard();
  // brief pause to show spawning animation
  await sleepAnimated(120);
  // clear spawning flags
  for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) if (board[r][c] && board[r][c].spawning) delete board[r][c].spawning;
  renderBoard();
  // run cascade resolution to handle any auto-shatters produced by the shuffle
  cascadeResolve();
}

// Rendering
function renderBoard() {
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) return;
  // ensure preview can be absolutely positioned relative to the board
  boardDiv.style.position = 'relative';
  // Reuse DOM cells to avoid rebuilding images on every render. Create child elements once and update their contents.
  boardDiv.style.display = 'grid';
  boardDiv.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 64px)`;
  boardDiv.style.gridTemplateRows = `repeat(${BOARD_ROWS}, 64px)`;
  boardDiv.style.gridGap = '6px';

  const total = BOARD_ROWS * BOARD_COLS;
  // ensure we have the right number of child placeholders
  while (boardDiv.children.length < total) {
    const el = document.createElement('div');
    el.className = 'module-cell';
    el.style.width = '64px';
    el.style.height = '64px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.position = 'relative';
    el.style.background = '#111';
    el.style.border = '1px solid #222';
    // attach event handlers that read coordinates from dataset so they remain correct when reused
    el.addEventListener('click', function(ev) { 
      // If this placeholder is currently flagged as ready-to-merge, perform merge confirm directly
      // but only when we're actually in mergeSelecting and have a selection (mirror merge-preview behavior).
      if (this._readyToMerge) {
        try { this._readyToMerge = false; } catch (e) {}
        try {
          if (mergeSelecting && selected.length > 0) {
            // Let evaluateMergeAttempt manage clearing selection/state; call it directly.
            evaluateMergeAttempt();
          }
        } catch (e) {}
        return;
      }
      if (this._longPressed) { this._longPressed = false; return; }
      const rr = parseInt(this.dataset.r,10); const cc = parseInt(this.dataset.c,10); onCellClick(ev, rr, cc); });
    el.addEventListener('contextmenu', function(ev) { ev.preventDefault(); const rr = parseInt(this.dataset.r,10); const cc = parseInt(this.dataset.c,10); onCellContextMenu(rr, cc); });
    // pointer interactions (long-press)
    el._pointerInfo = { pointerDown: false, startX: 0, startY: 0 };
    el.addEventListener('pointerdown', function(ev) {
      const self = this;
      self._pointerInfo.pointerDown = true;
      self._pointerInfo.startX = ev.clientX; self._pointerInfo.startY = ev.clientY;
      // don't start long-press on Commons (Commons should not support long-press merge-select)
      try {
        const rr = parseInt(self.dataset.r, 10); const cc = parseInt(self.dataset.c, 10);
        const cell = (board && board[rr] && board[rr][cc]) ? board[rr][cc] : null;
        if (cell && cell.rarity === 'Common') {
          longPressTimer = null;
          return;
        }
      } catch (e) {}
      longPressTimer = setTimeout(() => { longPressTimer = null; try { self._longPressed = true; } catch(e){} handleLongPress(parseInt(self.dataset.r,10), parseInt(self.dataset.c,10)); }, 450);
    });
    el.addEventListener('pointerup', function(ev) { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } this._pointerInfo.pointerDown = false; });
    el.addEventListener('pointercancel', function() { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } this._pointerInfo.pointerDown = false; });
    el.addEventListener('pointermove', function(ev) { if (!this._pointerInfo.pointerDown) return; if (Math.abs(ev.clientX - this._pointerInfo.startX) > 8 || Math.abs(ev.clientY - this._pointerInfo.startY) > 8) { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } this._pointerInfo.pointerDown = false; } });
    boardDiv.appendChild(el);
  }
  // remove extras if grid shrunk
  while (boardDiv.children.length > total) boardDiv.removeChild(boardDiv.lastChild);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const idx = r * BOARD_COLS + c;
      const el = boardDiv.children[idx];
      const cell = (board[r] && board[r][c]) ? board[r][c] : null;
      // update dataset for event handlers
      el.dataset.r = String(r); el.dataset.c = String(c);
      // manage animation classes
      el.classList.toggle('falling', !!(cell && cell.falling));
      el.classList.toggle('spawning', !!(cell && cell.spawning));
      el.classList.toggle('clearing', !!(cell && cell.clearing));
      // selection highlight classes
      const selIdx = selected.findIndex(x => x && x.r === r && x.c === c);
      el.classList.toggle('selected-base', selIdx === 0);
      el.classList.toggle('selected-fodder', selIdx > 0);
      // If this is the base selection and we're in mergeSelecting, compute readiness and show clickable cursor
      if (selIdx === 0 && mergeSelecting) {
        const baseSel = selected[0];
        const baseCell = baseSel && baseSel.cell ? baseSel.cell : null;
        const required = requiredTotalForBaseCell(baseCell);
        const ready = selected.length === required;
        el.classList.toggle('predicted-clickable', !!ready);
        el.style.cursor = ready ? 'pointer' : 'default';
        el.title = ready ? 'Tap to confirm merge' : '';
        try { el._readyToMerge = !!ready; } catch (e) {}
      } else {
        // default cursor for cells
        el.style.cursor = 'pointer';
        el.title = '';
        try { el._readyToMerge = false; } catch (e) {}
      }
      // candidate highlight
      el.classList.toggle('candidate', candidateHighlights && candidateHighlights.has(r + ',' + c));
      // visually mark tiles that are disabled due to adjacency to a live mine
      try {
        el.classList.toggle('disabled-by-mine', !!(cell && isDisabledByMine(cell)));
      } catch (e) { /* guard if helper not available in rare cases */ }
      // hint pulse
      const hintActive = hintMove && ((hintMove.r === r && hintMove.c === c) || (hintMove.nr === r && hintMove.nc === c));
      el.classList.toggle('hint-pulse', !!hintActive);
      if (hintActive) { el.style.boxShadow = '0 0 12px 6px rgba(0,255,160,0.18)'; el.style.border = '2px solid rgba(0,255,160,0.6)'; el.style.zIndex = '30'; } else { el.style.boxShadow = ''; el.style.border = '1px solid #222'; el.style.zIndex = ''; }

      // If same instance already rendered here, skip rebuilding inner shape to avoid image re-creation
      const prevId = el._cellInstanceId || null;
      const curId = cell && cell.instanceId ? cell.instanceId : null;
      if (prevId === curId) {
        // still need to update selection badge in case selection changed
        const existingBadge = el.querySelector('.selection-badge');
        if (existingBadge) existingBadge.remove();
        if (selIdx >= 0) {
          const badge = document.createElement('div'); badge.className = 'selection-badge'; badge.textContent = String(selIdx + 1); el.appendChild(badge);
        }
        // Sync boss overlay presence even when the cell instance didn't change (avoid stale boss UI)
        try {
          const bm = window.__BOSS_MARKER || null;
          const existingBossImg = el.querySelector('img[data-boss]');
          const existingBossNum = el.querySelector('.boss-number-overlay[data-boss]');
          if (bm && bm.r === r && bm.c === c) {
            // ensure boss visuals are present
            if (!existingBossImg) {
              const bi = document.createElement('img');
              bi.src = bossImg;
              bi.alt = 'boss';
              bi.dataset.boss = '1';
              bi.style.position = 'absolute';
              bi.style.left = '50%'; bi.style.top = '50%'; bi.style.transform = 'translate(-50%, -50%)';
              bi.style.width = '82%'; bi.style.height = '82%'; bi.style.zIndex = '60';
              el.appendChild(bi);
            }
            if (!existingBossNum) {
              const num = document.createElement('div');
              num.className = 'boss-number-overlay';
              num.dataset.boss = '1';
              num.textContent = String(bm.hitsRemaining || '');
              num.style.position = 'absolute'; num.style.left = '50%'; num.style.top = '6px'; num.style.transform = 'translateX(-50%)';
              num.style.color = '#fff'; num.style.fontWeight = '900'; num.style.textShadow = '0 0 6px rgba(0,0,0,0.8)'; num.style.zIndex = '70';
              el.appendChild(num);
            } else {
              // update number text
              try { existingBossNum.textContent = String(bm.hitsRemaining || ''); } catch (e) {}
            }
            // apply boss highlight styling
            el.classList.add('boss-pulse');
            el.style.boxShadow = '0 0 12px 6px rgba(255,80,80,0.18)'; el.style.border = '2px solid rgba(255,80,80,0.6)'; el.style.zIndex = '30';
          } else {
            // remove stale boss visuals if present
            if (existingBossImg) existingBossImg.remove();
            if (existingBossNum) existingBossNum.remove();
            el.classList.remove('boss-pulse');
            el.style.boxShadow = ''; el.style.border = '1px solid #222'; el.style.zIndex = '';
          }
        } catch (e) {}
        continue;
      }

      // instance changed (or became null) — rebuild content
      while (el.firstChild) el.removeChild(el.firstChild);
      el._cellInstanceId = curId;
      if (cell) {
        const SHAPE_SIZE = 60;
        const shape = buildShape(cell, SHAPE_SIZE);
        el.appendChild(shape);
        if (selIdx >= 0) {
          const badge = document.createElement('div'); badge.className = 'selection-badge'; badge.textContent = String(selIdx + 1); el.appendChild(badge);
        }
        // If boss marker exists at this coordinate, render boss overlay inside this cell
        try {
          const bm = window.__BOSS_MARKER || null;
          if (bm && bm.r === r && bm.c === c) {
            const bi = document.createElement('img');
            bi.src = bossImg;
            bi.alt = 'boss';
            bi.dataset.boss = '1';
            bi.style.position = 'absolute';
            bi.style.left = '50%'; bi.style.top = '50%'; bi.style.transform = 'translate(-50%, -50%)';
            bi.style.width = '82%'; bi.style.height = '82%'; bi.style.zIndex = '60';
            el.appendChild(bi);
            const num = document.createElement('div');
            num.className = 'boss-number-overlay';
            num.dataset.boss = '1';
            num.textContent = String(bm.hitsRemaining || '');
            num.style.position = 'absolute'; num.style.left = '50%'; num.style.top = '6px'; num.style.transform = 'translateX(-50%)';
            num.style.color = '#fff'; num.style.fontWeight = '900'; num.style.textShadow = '0 0 6px rgba(0,0,0,0.8)'; num.style.zIndex = '70';
            el.appendChild(num);
            // apply boss highlight styling
            el.classList.add('boss-pulse');
            el.style.boxShadow = '0 0 12px 6px rgba(255,80,80,0.18)'; el.style.border = '2px solid rgba(255,80,80,0.6)'; el.style.zIndex = '30';
          }
        } catch (e) {}
      }
    }
  }
  // stats
  const info = document.getElementById('game-info');
  if (info) {
    info.textContent = `BadLuck:${badLuckCounter}  Inventory: C:${inventory.Cannon ? inventory.Cannon.templateId : '-'} G:${inventory.Generator ? inventory.Generator.templateId : '-'} A:${inventory.Armor ? inventory.Armor.templateId : '-'} Co:${inventory.Core ? inventory.Core.templateId : '-'}`;
  }
  // swap-counter UI removed; no visible update required
  // Keep the visible #score element in sync with internal state
  updateScoreUI();
  // update merge preview UI (shows base + up to 2 fodder + predicted result)
  // keep the merge preview always present (4 slots) even when not in merge mode
  updateMergePreview(true);
  const btnShuffle = document.getElementById('btn-shuffle');
  if (btnShuffle) {
    btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
    btnShuffle.disabled = shuffleRemaining <= 0;
  }
  // ensure controls exist (covers case where #game-board was present in HTML)
  ensureControls();
  // persist state after each render so changes survive reloads
  try { saveGameState(); } catch (e) { /* ignore */ }
  // ensure inactivity timer is running after each render
  resetInactivity();

  // adjust right-column to visually align with the board
  try { adjustRightColumnToBoard(); } catch (e) {}
}

// Adjust the right column (inventory + dev tools) to vertically align with the board
function adjustRightColumnToBoard() {
  const boardDiv = document.getElementById('game-board');
  const right = document.getElementById('right-column');
  if (!boardDiv || !right) return;
  // measure board height and position, then set right-column height to match so its
  // contents can be centered vertically relative to the board.
  const br = boardDiv.getBoundingClientRect();
  // compute target height: prefer the board's height but clamp to viewport if needed
  let targetH = Math.min(br.height, window.innerHeight - 40);
  if (targetH <= 0) targetH = br.height || 400;
  right.style.height = targetH + 'px';
  // center contents vertically
  right.style.display = 'flex';
  right.style.flexDirection = 'column';
  right.style.justifyContent = 'center';
}

// keep alignment responsive
window.addEventListener('resize', () => {
  try { adjustRightColumnToBoard(); } catch (e) {}
});

// Sync the single visible score element with the internal `score` variable.
function updateScoreUI() {
  const el = document.getElementById('score');
  try { console.debug && console.debug('updateScoreUI called'); } catch (e) {}
  if (el) {
  // Build a left-aligned pill showing Time, Move #, Total Merges, Total Shatters and Score
  el.textContent = '';
  // Time line (ensure timer span exists)
  const timeLine = document.createElement('div'); timeLine.className = 'time-line';
  const timeLabel = document.createElement('span'); timeLabel.className = 'time-label'; timeLabel.textContent = 'Time:';
  const timeValue = document.createElement('span'); timeValue.className = 'time-value'; timeValue.id = 'game-timer';
  timeLine.appendChild(timeLabel); timeLine.appendChild(timeValue);
  el.appendChild(timeLine);

  // Moves / merges / shatters / score lines
  const movesLine = document.createElement('div'); movesLine.className = 'score-line';
  const movesLabel = document.createElement('span'); movesLabel.className = 'score-label'; movesLabel.textContent = 'Move #:';
  const movesValue = document.createElement('span'); movesValue.className = 'score-value'; movesValue.id = 'stat-move-count'; movesValue.textContent = String(moveCount || 0);
  movesLine.appendChild(movesLabel); movesLine.appendChild(movesValue);
  el.appendChild(movesLine);

  const mergesLine = document.createElement('div'); mergesLine.className = 'score-line';
  const mergesLabel = document.createElement('span'); mergesLabel.className = 'score-label'; mergesLabel.textContent = 'Total Merges:';
  const mergesValue = document.createElement('span'); mergesValue.className = 'score-value'; mergesValue.id = 'stat-total-merges'; mergesValue.textContent = String(totalMerges || 0);
  mergesLine.appendChild(mergesLabel); mergesLine.appendChild(mergesValue);
  el.appendChild(mergesLine);

  const shattersLine = document.createElement('div'); shattersLine.className = 'score-line';
  const shattersLabel = document.createElement('span'); shattersLabel.className = 'score-label'; shattersLabel.textContent = 'Total Shatters:';
  const shattersValue = document.createElement('span'); shattersValue.className = 'score-value'; shattersValue.id = 'stat-total-shatters'; shattersValue.textContent = String(totalShatters || 0);
  shattersLine.appendChild(shattersLabel); shattersLine.appendChild(shattersValue);
  el.appendChild(shattersLine);

  const scoreLine = document.createElement('div'); scoreLine.className = 'score-line';
  // Show total shards instead of numeric score
  const scoreLabel = document.createElement('span'); scoreLabel.className = 'score-label'; scoreLabel.textContent = 'Total Shards:';
  const scoreValue = document.createElement('span'); scoreValue.className = 'score-value'; scoreValue.id = 'stat-score-value';
  // total shards is sum of shardsEarned values
  const totalShards = Object.values(shardsEarned || {}).reduce((a,b) => a + (Number(b) || 0), 0);
  scoreValue.textContent = String(totalShards || 0);
  scoreLine.appendChild(scoreLabel); scoreLine.appendChild(scoreValue);
  el.appendChild(scoreLine);
  // ensure timer update helper exists
  try { ensureGameTimerPlaced(); } catch (e) {}
    // Shards inline in the same pill: left-aligned label, inline icons+counts as the value
    try {
      // Order: Cannon, Armor, Generator, Core
      const types = [ ['Cannon', can_type], ['Armor', arm_type], ['Generator', gen_generator_type], ['Core', core_type] ];
      const shardsLine = document.createElement('div'); shardsLine.className = 'score-line';
      // empty label so the inline items align in the value column under the 'Total Shards' label
      const shardsLabel = document.createElement('span'); shardsLabel.className = 'score-label'; shardsLabel.textContent = '';
      const shardsValue = document.createElement('span'); shardsValue.className = 'score-value shards-inline'; shardsValue.id = 'stat-shards-inline';

      // build inline list of icon + numeric span (double image size)
      types.forEach(([tName, tImg]) => {
        const item = document.createElement('span'); item.className = 'shard-item';
        const img = document.createElement('img'); img.src = tImg; img.alt = tName; img.width = 36; img.height = 36; img.style.borderRadius = '4px';
        const num = document.createElement('span'); num.id = 'shard-' + tName.toLowerCase(); num.textContent = String((shardsEarned[tName] || 0)); num.style.fontWeight = '700'; num.style.marginLeft = '6px';
        item.appendChild(img); item.appendChild(num);
        shardsValue.appendChild(item);
      });

      shardsLine.appendChild(shardsLabel);
      shardsLine.appendChild(shardsValue);
      el.appendChild(shardsLine);
    } catch (e) {}
    return;
  }
  // If no #score element exists in the HTML (edge case), insert one near the swap counter
  const sc = document.getElementById('swap-counter');
  if (sc && sc.parentNode) {
    const div = document.createElement('div');
    div.id = 'score';
  // create score element with label/value line so timer can be added later
  const scoreLine = document.createElement('div'); scoreLine.className = 'score-line';
  const lbl = document.createElement('span'); lbl.className = 'score-label'; lbl.textContent = 'Score:';
  const val = document.createElement('span'); val.className = 'score-value'; val.textContent = String(score);
  scoreLine.appendChild(lbl); scoreLine.appendChild(val);
  div.appendChild(scoreLine);
  sc.parentNode.insertBefore(div, sc);
  }
}

// Dev helper: call from browser console to simulate awarding shards and force UI update.
// Example: runShardDebug() will show console logs and increment Core by 15.
try { window.runShardDebug = function() {
  try { console.debug && console.debug('runShardDebug: pre', JSON.stringify(shardsEarned)); } catch (e) {}
  try { awardShards('Core', 15); } catch (e) {}
  try { console.debug && console.debug('runShardDebug: post', JSON.stringify(shardsEarned)); } catch (e) {}
}; } catch (e) {}

// Ensure spawn/shuffle/restart controls exist and are wired even if #game-board preexists
function ensureControls() {
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) return;
  // controls container placed after the board in the left column
  let controls = document.getElementById('game-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'game-controls';
    controls.style.display = 'flex';
    controls.style.gap = '8px';
  // controls will include Shuffle and Restart

    // Shuffle
    const btnShuffle = document.createElement('button');
    btnShuffle.id = 'btn-shuffle';
    btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
    btnShuffle.addEventListener('click', () => {
      // Use animated shuffle helper which handles remaining count and cascade
      shuffleBoardAnimated();
    });
    controls.appendChild(btnShuffle);

    // Restart
    const btnRestart = document.createElement('button');
    btnRestart.id = 'btn-restart';
    btnRestart.textContent = 'Restart';
    btnRestart.addEventListener('click', () => {
      // reset inventory and counters on restart
      inventory = { Cannon: null, Generator: null, Armor: null, Core: null };
      shuffleRemaining = 3;
      commonSwapRemaining = 20;
  // reset session stats and shard totals
  try { moveCount = 0; } catch (e) {}
  try { totalMerges = 0; } catch (e) {}
  try { totalShatters = 0; } catch (e) {}
  try { shardsEarned = { Cannon: 0, Armor: 0, Generator: 0, Core: 0 }; } catch (e) {}
  try { score = 0; } catch (e) {}
  // rebuild board and UI
  createBoard(); renderBoard(); renderInventory();
  try { updateScoreUI(); } catch (e) {}
  try { saveGameState(); } catch (e) {}
  try { cascadeResolve(); } catch (e) {}
  // reset and start timer for new game
  try { resetGameTimer(); startGameTimer(); } catch (e) {}
    });
    controls.appendChild(btnRestart);

    // Settings menu: consolidate Auto-shatter, Orientation, Disable animations, and Dev tools
    const btnSettings = document.createElement('button');
    btnSettings.id = 'btn-settings';
    btnSettings.textContent = '⚙️ Settings';
    btnSettings.style.position = 'relative';

  const settingsMenu = document.createElement('div');
  settingsMenu.id = 'settings-menu';
  // Use fixed positioning and append to body so the menu stays visible while scrolling.
  settingsMenu.style.position = 'fixed';
  settingsMenu.style.background = '#111';
  settingsMenu.style.border = '1px solid #333';
  settingsMenu.style.padding = '8px';
  settingsMenu.style.display = 'none';
  settingsMenu.style.flexDirection = 'column';
  settingsMenu.style.gap = '8px';
  settingsMenu.style.zIndex = '1000';
  settingsMenu.style.minWidth = '180px';
  // initial coords; will be computed on open
  settingsMenu.style.left = '8px';
  settingsMenu.style.top = '8px';
  document.body.appendChild(settingsMenu);

    // Auto-shatter rares
    const rareWrap = document.createElement('label');
    rareWrap.style.display = 'flex';
    rareWrap.style.alignItems = 'center';
    rareWrap.style.gap = '6px';
    const rareCb = document.createElement('input');
    rareCb.type = 'checkbox';
    rareCb.id = 'cb-auto-shatter-rares';
    rareCb.checked = !!autoShatterRares;
    rareCb.addEventListener('change', () => { autoShatterRares = rareCb.checked; try { saveGameState(); } catch (e) {} });
    const rareLabel = document.createElement('span');
    rareLabel.textContent = 'Auto-shatter Rares';
    rareWrap.appendChild(rareCb);
    rareWrap.appendChild(rareLabel);
    settingsMenu.appendChild(rareWrap);

    // Orientation toggle
    const btnOrient = document.createElement('button');
    btnOrient.id = 'btn-orient';
    const updateOrientLabel = () => { btnOrient.textContent = 'Orientation: ' + (ORIENTATION === 'portrait' ? 'Portrait' : 'Landscape'); };
    updateOrientLabel();
    btnOrient.addEventListener('click', () => {
      ORIENTATION = ORIENTATION === 'portrait' ? 'landscape' : 'portrait';
      const targetRows = BOARD_COLS;
      const targetCols = BOARD_ROWS;
      if (!board || !Array.isArray(board) || board.length === 0 || !board[0]) {
        if (ORIENTATION === 'landscape') { BOARD_ROWS = 8; BOARD_COLS = 14; } else { BOARD_ROWS = 14; BOARD_COLS = 8; }
        updateOrientLabel();
        try { saveGameState(); } catch (e) {}
        createBoard(); renderBoard(); renderInventory();
        return;
      }
      const oldRows = BOARD_ROWS;
      const oldCols = BOARD_COLS;
      const oldBoard = board;
      const rotated = [];
      for (let r = 0; r < targetRows; r++) {
        const row = [];
        for (let c = 0; c < targetCols; c++) {
          const srcR = oldRows - 1 - c;
          const srcC = r;
          row.push((oldBoard[srcR] && oldBoard[srcR][srcC]) ? oldBoard[srcR][srcC] : null);
        }
        rotated.push(row);
      }
      for (let i = 0; i < selected.length; i++) {
        const s = selected[i];
        if (!s) continue;
        if (typeof s.r === 'number' && typeof s.c === 'number') {
          const nr = oldRows - 1 - s.c;
          const nc = s.r;
          selected[i] = { ...s, r: nr, c: nc };
        }
      }
      if (hintMove) {
        try {
          const hr = hintMove.r, hc = hintMove.c;
          const hnr = oldRows - 1 - hc;
          const hnc = hr;
          hintMove.r = hnr; hintMove.c = hnc;
          if (typeof hintMove.nr === 'number' && typeof hintMove.nc === 'number') {
            const nr2 = oldRows - 1 - hintMove.nc;
            const nc2 = hintMove.nr;
            hintMove.nr = nr2; hintMove.nc = nc2;
          }
        } catch (e) { }
      }
      if (candidateHighlights && candidateHighlights.size > 0) {
        const newSet = new Set();
        for (const k of candidateHighlights) {
          const parts = k.split(',');
          if (parts.length !== 2) continue;
          const rr = parseInt(parts[0], 10);
          const cc = parseInt(parts[1], 10);
          if (Number.isFinite(rr) && Number.isFinite(cc)) {
            const nr = oldRows - 1 - cc;
            const nc = rr;
            newSet.add(nr + ',' + nc);
          }
        }
        candidateHighlights = newSet;
      }
      board = rotated;
      BOARD_ROWS = targetRows;
      BOARD_COLS = targetCols;
      updateOrientLabel();
      try { saveGameState(); } catch (e) {}
      renderBoard(); renderInventory();
      try { positionDebugPortal(); } catch (e) {}
    });
    settingsMenu.appendChild(btnOrient);

    // Disable animations
    const animWrap = document.createElement('label');
    animWrap.style.display = 'flex';
    animWrap.style.alignItems = 'center';
    animWrap.style.gap = '6px';
    const animCb = document.createElement('input');
    animCb.type = 'checkbox';
    animCb.id = 'cb-disable-animations';
    // reflect saved state
    try { animCb.checked = !!localStorage.getItem('disableAnimations') && localStorage.getItem('disableAnimations') !== '0'; } catch (e) { animCb.checked = false; }
    const animLabel = document.createElement('span');
    animLabel.textContent = 'Disable animations';
    animWrap.appendChild(animCb);
    animWrap.appendChild(animLabel);
    settingsMenu.appendChild(animWrap);
    // ensure CSS rule exists when toggled
    function applyDisableAnimations(disable) {
      try {
        if (disable) {
          document.documentElement.classList.add('no-animations');
          let s = document.getElementById('no-animations-style');
          if (!s) {
            s = document.createElement('style'); s.id = 'no-animations-style';
            s.textContent = `html.no-animations * { animation: none !important; transition: none !important; }`;
            document.head.appendChild(s);
          }
        } else {
          document.documentElement.classList.remove('no-animations');
        }
      } catch (e) {}
    }
    animCb.addEventListener('change', () => {
      const disabled = !!animCb.checked;
      try { localStorage.setItem('disableAnimations', disabled ? '1' : '0'); } catch (e) {}
      applyDisableAnimations(disabled);
    });
    // apply initial state
    try { applyDisableAnimations(!!animCb.checked); } catch (e) {}

    // Choose Background dropdown
    try {
      const bgWrap = document.createElement('label');
      bgWrap.style.display = 'flex';
      bgWrap.style.flexDirection = 'column';
      bgWrap.style.gap = '6px';
      const bgTitle = document.createElement('span'); bgTitle.textContent = 'Choose Background'; bgTitle.style.fontWeight = '600';
      const bgSelect = document.createElement('select'); bgSelect.id = 'sel-background';
      // first option: none
      const noneOpt = document.createElement('option'); noneOpt.value = ''; noneOpt.textContent = 'None'; bgSelect.appendChild(noneOpt);
      // populate from BACKGROUNDS map (sorted)
      const bgKeys = Object.keys(BACKGROUNDS).sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      for (const k of bgKeys) {
        const opt = document.createElement('option'); opt.value = k; opt.textContent = formatBackgroundDisplay(k); bgSelect.appendChild(opt);
      }
      // reflect saved state
      try { const saved = localStorage.getItem('background'); if (saved) bgSelect.value = saved; } catch (e) {}
      // wire change
      bgSelect.addEventListener('change', () => {
        const v = bgSelect.value || '';
        applyBackground(v);
      });
      bgWrap.appendChild(bgTitle); bgWrap.appendChild(bgSelect);
      settingsMenu.appendChild(bgWrap);
      // apply initial background now
      try { const saved = localStorage.getItem('background'); applyBackground(saved || ''); } catch (e) {}
    } catch (e) { /* ignore UI failures */ }

    // Dev tools toggle (always placed last in menu when present)
    if (typeof dev !== 'undefined' && dev) {
      // avoid creating duplicate buttons when UI is re-rendered
      if (!document.getElementById('btn-devtools-toggle')) {
        const btnDevTools = document.createElement('button');
        btnDevTools.id = 'btn-devtools-toggle';
        btnDevTools.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
        btnDevTools.addEventListener('click', () => {
          DEV_TOOLS_VISIBLE = !DEV_TOOLS_VISIBLE;
          const wrap = document.getElementById('debug-console-wrap');
          if (DEV_TOOLS_VISIBLE) {
            try { ensureDebugConsole(); } catch (e) {}
            const w = document.getElementById('debug-console-wrap');
            if (w) w.style.display = 'block';
            try { positionDebugPortal(); } catch (e) {}
            btnDevTools.textContent = 'Hide Dev tools';
          } else {
            if (wrap) wrap.style.display = 'none';
            btnDevTools.textContent = 'Show Dev tools';
          }
        });
        settingsMenu.appendChild(btnDevTools);
      }
    }

    // show/hide menu and position it (prefer opening upward above the button)
    btnSettings.addEventListener('click', (ev) => {
      ev.stopPropagation();
      try {
        if (settingsMenu.style.display === 'flex') {
          settingsMenu.style.display = 'none';
          return;
        }
        // show temporarily (hidden) to measure
        settingsMenu.style.display = 'flex';
        settingsMenu.style.visibility = 'hidden';
        // compute button rect and menu size
        const rect = btnSettings.getBoundingClientRect();
        const menuRect = settingsMenu.getBoundingClientRect();
        const menuW = menuRect.width || parseInt(settingsMenu.style.minWidth || '180', 10);
        const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
        const aboveTop = rect.top - menuRect.height - 8;
        if (aboveTop >= 8) {
          // position above the button
          settingsMenu.style.left = left + 'px';
          settingsMenu.style.top = (aboveTop) + 'px';
        } else {
          // fallback: position below the button
          const belowTop = rect.bottom + 8;
          settingsMenu.style.left = left + 'px';
          settingsMenu.style.top = (belowTop) + 'px';
        }
        settingsMenu.style.visibility = 'visible';
      } catch (e) { try { settingsMenu.style.display = 'flex'; settingsMenu.style.visibility = 'visible'; } catch (ee) {} }
    });
    // hide when clicking outside (ignore clicks inside the menu or on the settings button)
    document.addEventListener('click', (ev) => {
      try {
        const t = ev && ev.target;
        if (!t) { settingsMenu.style.display = 'none'; rulesMenu && (rulesMenu.style.display = 'none'); return; }
        // if the click happened inside the settings menu or on the settings button, do nothing
        if ((settingsMenu && settingsMenu.contains(t)) || (btnSettings && btnSettings.contains(t))) return;
        // if the click happened inside the rules menu or on the rules button, do nothing
        if ((typeof rulesMenu !== 'undefined' && rulesMenu && rulesMenu.contains(t)) || (typeof btnRules !== 'undefined' && btnRules && btnRules.contains(t))) return;
        // otherwise hide both menus
        try { settingsMenu.style.display = 'none'; } catch (e) {}
        try { if (typeof rulesMenu !== 'undefined' && rulesMenu) rulesMenu.style.display = 'none'; } catch (e) {}
      } catch (e) {}
    });

    // hide menu on resize to avoid misplacement; will be recomputed when opened again
    if (!window.__settingsMenuResizeHooked) {
      window.addEventListener('resize', () => { try { settingsMenu.style.display = 'none'; } catch (e) {} });
      window.__settingsMenuResizeHooked = true;
    }

    // Toggle chart visibility
    const btnToggleChart = document.createElement('button');
    btnToggleChart.id = 'btn-toggle-chart';
    const updateChartBtn = () => { btnToggleChart.textContent = CHART_VISIBLE ? 'Hide Chart' : 'Show Chart'; };
    updateChartBtn();
    btnToggleChart.addEventListener('click', () => {
      CHART_VISIBLE = !CHART_VISIBLE;
      try { saveGameState(); } catch (e) {}
      updateChartBtn();
      const ch = document.getElementById('merge-chart-wrap');
      if (ch) ch.style.display = CHART_VISIBLE ? 'block' : 'none';
      // Reposition dev tools portal after chart visibility/layout changes
      try { positionDebugPortal(); } catch (e) {}
    });
  // ensure chart toggle is first in the control row
  controls.insertBefore(btnToggleChart, controls.firstChild);


    // Hint button in controls
    const btnHint = document.createElement('button');
    btnHint.id = 'btn-hint';
    btnHint.textContent = 'Hint';
    btnHint.addEventListener('click', () => {
      try { console.debug('Controls hint clicked'); } catch(e) {}
      try {
        // guard: ensure board exists
        if (!board || !Array.isArray(board)) {
          appendToDebug && appendToDebug('Controls hint: board is not initialized');
          console.error('Controls hint: board is not initialized', { board });
          return;
        }
        let moves;
        try {
          moves = findValidMovesList();
        } catch (innerErr) {
          const msg = innerErr && innerErr.stack ? innerErr.stack : String(innerErr);
          appendToDebug && appendToDebug('Controls hint: findValidMovesList threw: ' + msg);
          console.error('Controls hint inner error', innerErr);
          return;
        }
        try { console.debug('Controls hint found moves:', moves ? moves.length : 0); } catch(e) {}
        try { appendToDebug && appendToDebug('Controls hint moves: ' + (moves ? moves.length : 0)); } catch (e) {}
        if (!moves || moves.length === 0) { alert('No valid moves available'); return; }
        // show a small sample and board snapshot for debugging
        try { appendToDebug && appendToDebug('Sample moves: ' + JSON.stringify(moves.slice(0,8))); } catch (e) {}
        try { appendToDebug && appendToDebug('Board snapshot: ' + JSON.stringify(board.map(r => r.map(c => c ? { templateId: c.templateId, rarity: c.rarity, plus: !!c.plus, type: c.type } : null)))); } catch (e) {}
        const mv = moves[Math.floor(Math.random() * moves.length)];
        hintMove = mv;
        try { appendToDebug && appendToDebug('Controls hint chosen: ' + JSON.stringify(mv)); } catch (e) {}
        renderBoard();
        resetInactivity();
      } catch (err) {
        const stack = err && err.stack ? err.stack : JSON.stringify(err);
        appendToDebug && appendToDebug('Controls hint handler error: ' + stack);
        console.error('Controls hint handler error', err);
      }
    });
    controls.appendChild(btnHint);

    // Rules button (inserted between Hint and Settings)
    const btnRules = document.createElement('button');
    btnRules.id = 'btn-rules';
    btnRules.textContent = 'Rules';
    btnRules.style.position = 'relative';
    // rules menu portal (fixed) appended to body
    const rulesMenu = document.createElement('div');
    rulesMenu.id = 'rules-menu';
    rulesMenu.style.position = 'fixed';
    rulesMenu.style.background = '#111';
    rulesMenu.style.border = '1px solid #333';
    rulesMenu.style.padding = '12px';
    rulesMenu.style.display = 'none';
    rulesMenu.style.flexDirection = 'column';
    rulesMenu.style.gap = '8px';
    rulesMenu.style.zIndex = '1000';
    rulesMenu.style.minWidth = '320px';
    document.body.appendChild(rulesMenu);
    // populate rules content
    const rulesTitle = document.createElement('div'); rulesTitle.textContent = 'Rules'; rulesTitle.style.fontWeight = '700'; rulesTitle.style.fontSize = '16px'; rulesMenu.appendChild(rulesTitle);
    const rulesText = document.createElement('div');
    rulesText.innerHTML = `
      <p>Goal: Get 1 of each module to Ancestral 5★ as fast as possible.</p>
      <p>Bonus: Extra points for additional 5★ modules beyond the primary set.</p>
      <ul>
        <li>Merge modules by selecting the required fodder combinations.</li>
        <li>Commons cannot be used as fodder for merges.</li>
        <li>Auto-shatter and orientation controls are available in Settings.</li>
        <li>Use inventory and swaps strategically to reach 5★ Ancestrals.</li>
      </ul>
      <p>Track your time using the timer in the controls. Fastest completion wins.</p>
    `;
    rulesMenu.appendChild(rulesText);
    const rulesClose = document.createElement('button'); rulesClose.textContent = 'Close'; rulesClose.addEventListener('click', () => { rulesMenu.style.display = 'none'; });
    rulesMenu.appendChild(rulesClose);
    // position/show logic for rules menu (prefer upward)
    btnRules.addEventListener('click', (ev) => {
      ev.stopPropagation();
      try {
        if (rulesMenu.style.display === 'flex') { rulesMenu.style.display = 'none'; return; }
        rulesMenu.style.display = 'flex'; rulesMenu.style.visibility = 'hidden';
        const rect = btnRules.getBoundingClientRect();
        const menuRect = rulesMenu.getBoundingClientRect();
        const menuW = menuRect.width || parseInt(rulesMenu.style.minWidth || '320', 10);
        const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
        const aboveTop = rect.top - menuRect.height - 8;
        if (aboveTop >= 8) {
          rulesMenu.style.left = left + 'px'; rulesMenu.style.top = (aboveTop) + 'px';
        } else {
          const belowTop = rect.bottom + 8;
          rulesMenu.style.left = left + 'px'; rulesMenu.style.top = (belowTop) + 'px';
        }
        rulesMenu.style.visibility = 'visible';
      } catch (e) { try { rulesMenu.style.display = 'flex'; rulesMenu.style.visibility = 'visible'; } catch (ee) {} }
    });
    // ensure clicks inside rules menu don't close it (document click handler below will check contains)
    controls.appendChild(btnRules);

  // Timer display: moved to sit under the score pill. A helper will create/move it after controls are inserted.

  // ...existing code for controls continues

  // Insert settings button last in the controls row so it appears as the final control
  controls.appendChild(btnSettings);

  // Insert controls after boardDiv
  if (boardDiv.parentNode) boardDiv.parentNode.insertBefore(controls, boardDiv.nextSibling);
  // ensure timer element is placed under the score pill and restore running state
  try { ensureGameTimerPlaced(); } catch (e) {}
  } else {
    // update shuffle button state if controls already exist
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
      btnShuffle.disabled = shuffleRemaining <= 0;
    }
  }
}

// Inventory rendering
function renderInventory() {
  const inv = document.getElementById('inventory');
  if (!inv) return;
  // Ensure the in-page debug console exists (if it was removed) and preserve it across re-renders.
  // This guards against orientation or layout changes recreating parts of the UI.
  try { ensureDebugConsole(); } catch (e) {}
  // Preserve the in-page debug console / dev controls which live in a persistent portal.
  // We query by id (global) rather than assuming it's a child of #inventory.
  const debugWrap = document.getElementById('debug-console-wrap');
  if (debugWrap && debugWrap.parentNode === inv) inv.removeChild(debugWrap);
  inv.innerHTML = '';
  const types = ['Cannon', 'Generator', 'Armor', 'Core'];
  for (const t of types) {
    const slot = document.createElement('div');
  slot.className = 'inv-slot';
  slot.dataset.type = t;
  // layout/size is controlled by CSS grid (#inventory). Keep only border state inline.
  // Use solid border so inventory slots visually match board cells; selected state remains prominent
  slot.style.border = placingFromInventory === t ? '3px solid #fff' : '1px solid #444';
  // ensure absolute-positioned decorative notches inside this slot are positioned correctly
  slot.style.position = 'relative';
  slot.style.overflow = 'visible';
    const content = inventory[t];
    if (content) {
      // Use shared mini-shape renderer so inventory matches board and uses image assets.
      // Request a larger mini-shape so the module fills the inventory slot visually.
      // Inventory slot grid is 96px; request ~84px to leave a small inset.
      const mini = buildMiniShape(content, 84);
      // Keep the inv-shape class for any stylesheet targeting (inline size wins)
      mini.classList.add('inv-shape');
      slot.appendChild(mini);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'inv-initials';
      placeholder.textContent = t[0];
      slot.appendChild(placeholder);
    }
    slot.addEventListener('click', () => onInventoryClick(t));
    // show selection badge if this inventory slot is currently selected
    const selIdx = selected.findIndex(s => s && s.inv === t);
    if (selIdx >= 0) {
      const badge = document.createElement('div');
      badge.className = 'selection-badge inv-badge';
      badge.textContent = String(selIdx + 1);
      slot.appendChild(badge);
      slot.classList.add(selIdx === 0 ? 'selected-base' : 'selected-fodder');
    }
    inv.appendChild(slot);
  }

  // Reposition the debug portal so it remains visually under the inventory
  try { positionDebugPortal(); } catch (e) {}
}

function onInventoryClick(type) {
  // Prevent using inventory while a boss is present on the board
  try {
    if (window.__BOSS_MARKER) {
      appendToDebug && appendToDebug('Inventory action blocked: Boss present on board');
      alert('Cannot use inventory while a Boss is present on the board.');
      return;
    }
  } catch (e) {}
  // Clear any inactivity hint when the user interacts with inventory
  if (hintMove) {
    hintMove = null;
    renderBoard();
  }
  // If the user is currently placing from inventory, toggle placing mode
  if (placingFromInventory) {
    if (placingFromInventory === type) placingFromInventory = null; else placingFromInventory = type;
    renderInventory();
    return;
  }

  // Selection behavior: allow selecting inventory items as base or fodder
  // If nothing selected, select this inventory slot as base
  if (selected.length === 0) {
    if (!inventory[type]) return; // empty slot nothing to select
    selected.push({ inv: type, cell: inventory[type] });
    renderBoard(); renderInventory();
    return;
  }

  // If base selected and user clicks an inventory slot, depending on mode either swap or add as fodder
  const base = selected[0];
  // If clicking the currently selected base -> deselect (toggle)
  if (base && base.inv === type) {
    // if already in mergeSelecting mode, cancel
    if (mergeSelecting) {
      mergeSelecting = false;
      candidateHighlights.clear();
    }
    // remove leading selected inventory base
    const idx = selected.findIndex(s => s && s.inv === type);
    if (idx >= 0) selected.splice(idx, 1);
    renderBoard(); renderInventory();
    return;
  }

  // If in mergeSelecting, attempt to add this inventory slot as fodder (if valid)
  if (mergeSelecting) {
    if (!inventory[type]) return; // cannot use empty slot
    // validate fodder against base
    const candidateCell = inventory[type];
    const baseCell = base.cell;
    if (canBeFodder(baseCell, candidateCell)) {
      const required = requiredTotalForBaseCell(baseCell);
      const already = selected.findIndex(s => s && s.inv === type);
      if (already >= 0) selected.splice(already, 1);
      else {
        if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
        selected.push({ inv: type, cell: candidateCell });
      }
      renderBoard(); renderInventory();
      return;
    }
    // otherwise ignore
    return;
  }

  // If not mergeSelecting and there is a board selection, allow swapping with inventory slot if types match
  if (selected.length === 1 && base) {
    // If base is a board selection, allow clicking inventory to either add/toggle fodder
    // (when the inventory slot contains a module) or pick up / swap the selected board module
    // into the inventory slot when types match. This fixes the previous early-return which
    // prevented picking up into an empty inventory slot.
    if (isBoardSel(base)) {
      const invCell = inventory[type];
      // If the selected board tile matches this inventory slot type, pick it up or swap (prioritize swap/pickup)
      const sCell = board[base.r][base.c];
      if (sCell && sCell.type === type) {
        if (!invCell) {
          // empty slot: move selected tile into inventory
          inventory[type] = board[base.r][base.c];
          board[base.r][base.c] = null;
        } else {
          // occupied slot: swap
          const tmp = inventory[type];
          inventory[type] = board[base.r][base.c];
          board[base.r][base.c] = tmp;
        }
        selected = [];
        renderBoard(); renderInventory();
        cascadeResolve();
        return;
      }
      // If the inventory slot has a module that can act as fodder for the base, toggle it
      if (invCell && canBeFodder(base.cell, invCell)) {
        const already = selected.findIndex(s => s && s.inv === type);
        if (already >= 0) selected.splice(already, 1);
        else {
          const required = requiredTotalForBaseCell(base.cell);
          if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
          selected.push({ inv: type, cell: invCell });
        }
        renderBoard(); renderInventory();
        return;
      }
    }
    // If base is an inventory selection and user clicked another inventory slot, handled earlier
  }
}

// Ensure the #game-timer element exists directly under the score pill.
function ensureGameTimerPlaced() {
  try {
    const scoreEl = document.getElementById('score');
    if (!scoreEl) return;
    // Ensure the score element contains separate label/value spans and the timer
    // is a value-only span. We'll place them so they stack (CSS controls layout).
    let scoreLabel = scoreEl.querySelector('.score-label');
    let scoreValue = scoreEl.querySelector('.score-value');
    if (!scoreLabel) {
      scoreEl.textContent = '';
      scoreLabel = document.createElement('span');
      scoreLabel.className = 'score-label';
      scoreLabel.textContent = 'Score:';
      scoreEl.appendChild(scoreLabel);
    }
    if (!scoreValue) {
      scoreValue = document.createElement('span');
      scoreValue.className = 'score-value';
      scoreEl.appendChild(scoreValue);
    }
    // ensure inline timer label + value exist
    let timeLabel = scoreEl.querySelector('.time-label');
    let timer = document.getElementById('game-timer');
    if (!timeLabel) {
      timeLabel = document.createElement('span');
      timeLabel.className = 'time-label';
      timeLabel.textContent = 'Time:';
      scoreEl.appendChild(timeLabel);
    }
    if (!timer) {
      timer = document.createElement('span');
      timer.id = 'game-timer';
      timer.className = 'time-value';
      // inherit pill typography; numeric value will be bold via CSS
      timer.style.marginLeft = '6px';
      timer.style.fontSize = '0.95rem';
      scoreEl.appendChild(timer);
    }
    // restore seconds/start from storage into the timer element
    try {
      const savedStart = localStorage.getItem('gameTimerStart');
      if (savedStart && !isNaN(parseInt(savedStart, 10))) {
        gameTimerStart = parseInt(savedStart, 10);
        gameTimerSeconds = Math.floor((Date.now() - gameTimerStart) / 1000);
        timer.textContent = formatTimer(gameTimerSeconds);
      } else {
        timer.textContent = formatTimer(gameTimerSeconds);
      }
    } catch (e) { try { timer.textContent = formatTimer(gameTimerSeconds); } catch (ee) {} }
    const running = localStorage.getItem('gameTimerRunning');
    if (running === '1' && !gameTimerInterval) startGameTimer();
  } catch (e) {}
}

function onCellContextMenu(r, c) {
  const cell = board[r][c];
  if (!cell) return; // nothing to pick
  // Prevent right-click inventory pickup/swaps while boss is present
  try {
    if (window.__BOSS_MARKER) {
      appendToDebug && appendToDebug('Context-menu action blocked: Boss present on board');
      alert('Cannot pick up or swap tiles while a Boss is present on the board.');
      return;
    }
  } catch (e) {}
  const slotType = cell.type;
  // if inventory slot empty, pick up
  if (!inventory[slotType]) {
    inventory[slotType] = cell;
    board[r][c] = null;
    renderBoard();
    renderInventory();
  // resolve gravity/cascade after removing a module
  try { moveOccurredThisTurn = true; } catch (e) {}
  cascadeResolve();
    return;
  }
  // else swap
  const tmp = inventory[slotType];
  inventory[slotType] = cell;
  board[r][c] = tmp;
  renderBoard();
  renderInventory();
  try { moveOccurredThisTurn = true; } catch (e) {}
}

// Selection & merge rules (simplified but following the provided sequence)
const MERGE_SEQUENCE = [
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

function findTemplate(templateId) { return MODULE_TEMPLATES.find(t => t.id === templateId); }

function isBoardSel(s) { return s && typeof s.r === 'number' && typeof s.c === 'number'; }
function isInvSel(s) { return s && typeof s.inv === 'string'; }

async function onCellClick(ev, r, c) {
  if (animating) return;
  // Clear any inactivity hint when the user interacts with the board
  if (hintMove) {
    hintMove = null;
    renderBoard();
  }
  const cell = board[r][c];
  // allow callers that accidentally call without event
  ev = ev || { ctrlKey: false, metaKey: false, shiftKey: false };
  // If this is a mine and it's currently eligible for manual shatter (two Commons in-line),
  // allow a simple tap to shatter/detonate it immediately.
  try {
    // If this is a mine and it's currently eligible for manual shatter (two Commons in-line), allow tap
    if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine') && canBeShattered(cell)) {
      shatterAt(r, c);
      return;
    }
    // If boss marker sits on this cell and it's eligible for boss shatter, trigger boss shatter
    const bm = window.__BOSS_MARKER || null;
    if (bm && bm.r === r && bm.c === c && canBossBeShattered(bm)) {
      shatterBossAtMarker(bm);
      return;
    }
  } catch (e) {}
    // Support Ctrl/Cmd-click as a fallback for "pick up to inventory" when right-click/contextmenu isn't available (e.g., on some devices or browsers). 
    // If inventory slot for this type is empty, pick the cell up and remove it from the board.
    if (cell && (ev.ctrlKey || ev.metaKey)) {
      try {
        if (window.__BOSS_MARKER) {
          appendToDebug && appendToDebug('Ctrl/Cmd pickup blocked: Boss present on board');
          alert('Cannot pick up tiles to inventory while a Boss is present on the board.');
          return;
        }
      } catch (e) {}
      const slotType = cell.type; 
      if (!inventory[slotType]) { 
        inventory[slotType] = cell; 
        board[r][c] = null; 
        renderBoard(); 
        renderInventory(); 
        cascadeResolve(); 
        return; 
      } 
    }
  // If we're placing from inventory, allow placing into empty cells only
  if (placingFromInventory) {
    // Prevent placing from inventory while boss is present; cancel placing mode
    try {
      if (window.__BOSS_MARKER) {
        appendToDebug && appendToDebug('Placing from inventory blocked: Boss present on board');
        alert('Cannot place inventory tiles while a Boss is present on the board.');
        placingFromInventory = null;
        renderInventory();
        return;
      }
    } catch (e) {}
    const type = placingFromInventory;
    // only place into empty cell
    if (!board[r][c]) {
      board[r][c] = inventory[type];
      inventory[type] = null;
      placingFromInventory = null;
      renderBoard();
      renderInventory();
    }
    return;
  }
  if (!cell) return;
  // If this tile is already selected, toggle it off
  const alreadyIdx = selected.findIndex(x => x && x.r === r && x.c === c);
  if (alreadyIdx >= 0) {
    const wasBase = alreadyIdx === 0;
    const selEntry = selected[alreadyIdx];
    // If this selection was just created by a long-press, suppress the immediate toggle and clear the flag.
    if (selEntry && selEntry._suppressClick) {
      try { delete selEntry._suppressClick; } catch (e) {}
      // keep selection active
      renderBoard();
      return;
    }
    selected.splice(alreadyIdx, 1);
    // If we were in merge-select mode and the user deselected the base, exit merge mode
    if (mergeSelecting && wasBase) {
      mergeSelecting = false;
      candidateHighlights.clear();
    }
    renderBoard();
    return;
  }
  // if selecting inventory placement
  // normal selection flow: push to selected and attempt merge when selection count matches a known pattern
  if (selected.length === 0) {
  selected.push({ r, c, cell });
  renderBoard();
    return;
  }

  // If one selected and second click is adjacent, default to adding as fodder
  // unless the user held Ctrl/Meta to indicate a swap intent.
  if (selected.length === 1) {
    const a = selected[0];
    // If the current base is an inventory selection, clicking a board tile should add/toggle it as fodder
    if (isInvSel(a)) {
      // if we're in merge-select mode, require candidateHighlights only if present; otherwise allow any valid fodder
      if (mergeSelecting) {
        const key = r + ',' + c;
        if (candidateHighlights.size === 0 || candidateHighlights.has(key)) {
          const already = selected.findIndex(x => x.r === r && x.c === c);
          if (already >= 0) selected.splice(already, 1);
          else {
            const required = requiredTotalForBaseCell(a.cell);
            if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
            selected.push({ r, c, cell });
          }
          renderBoard();
        }
        return;
      }
      // not mergeSelecting: treat click as attempt to add fodder if valid
      if (canBeFodder(a.cell, cell)) {
        const already = selected.findIndex(x => x.r === r && x.c === c);
        if (already >= 0) selected.splice(already, 1);
        else {
          const required = requiredTotalForBaseCell(a.cell);
          if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
          selected.push({ r, c, cell });
        }
        renderBoard();
      }
      return;
    }

    // If base is a board selection, original adjacency/swap behavior applies
    if (isBoardSel(a)) {
    const manhattan = Math.abs(a.r - r) + Math.abs(a.c - c);
    // allow non-adjacent swaps when DEV_FREE_SWAP is enabled (developer mode)
    if (manhattan === 1 || DEV_FREE_SWAP) {
        // If we're in merge-select mode (user long-pressed), tapping a highlighted candidate toggles it
        if (mergeSelecting) {
          const key = r + ',' + c;
          if (candidateHighlights.has(key)) {
            const already = selected.findIndex(x => x.r === r && x.c === c);
            if (already >= 0) {
              selected.splice(already, 1);
            } else {
              // enforce per-base required selection limit
              const base = selected[0];
              const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
              if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
              selected.push({ r, c, cell });
            }
            renderBoard();
            return;
          }
          // non-candidate tap while mergeSelecting: ignore but keep selection
          renderBoard();
          return;
        }

        // Default behavior: unless DEV_FREE_SWAP is enabled, enforce Common-swap rules
        const src = board[a.r][a.c];
        const dst = board[r][c];
        const involvesCommon = (src && src.rarity === 'Common') || (dst && dst.rarity === 'Common');
        if (!DEV_FREE_SWAP) {
          // Disallow swapping two non-Common tiles per spec
          if (!involvesCommon) {
            // Keep the base selected so the player can try a different adjacent Common tile
            renderBoard();
            alert('Swaps are only allowed when at least one tile is Common. You cannot swap two non-Common tiles.');
            return;
          }
          if (involvesCommon && commonSwapRemaining <= 0) {
            selected = [];
            renderBoard();
            alert('No Common swaps remaining');
            return;
          }
        }
  // perform swap
  const tmp = board[r][c];
  board[r][c] = board[a.r][a.c];
  board[a.r][a.c] = tmp;
  try { moveOccurredThisTurn = true; } catch (e) {}
        selected = [];
        // Render to show the swap before we check for any immediate Common group
        renderBoard();
  const commonGroups = findAllGroups((cell) => cell.rarity === 'Common');
        // debug: log groups detected immediately after swap
        try {
          console.debug('Swap performed:', { from: { r: a.r, c: a.c }, to: { r, c } });
          console.debug('Detected Common groups after swap:', commonGroups.map(g => ({ len: g.length, coords: g }))); 
        } catch (e) { }
  const createdCommon = commonGroups.some(g => g.length >= 3);
  // Ensure any groups formed by this swap are immediately resolved so none are missed
  const anyResolved = resolveImmediateShatters();
  // only consume a swap token if the swap involved a Common and it did NOT create a Common group
  if (!DEV_FREE_SWAP && involvesCommon && !createdCommon) {
          commonSwapRemaining = Math.max(0, commonSwapRemaining - 1);
          renderBoard();
        }
  // If we resolved immediate shatters synchronously, continue cascading with animation; otherwise start cascadeResolve which will animate fills and auto-shatters
  if (anyResolved) await cascadeResolve(); else cascadeResolve();
        return;
      }
    }
  }

  // allow selecting up to 4 items (base + fodder)
  // If we're in merge-selecting mode, clicking the base confirms the merge
  if (mergeSelecting) {
    // if user tapped the base while mergeSelecting, attempt merge confirmation
    const base = selected[0];
    if (base && base.r === r && base.c === c) {
      // confirm merge, but only if the required number of selections have been made
      const baseCell = base && base.cell ? base.cell : null;
      const required = requiredTotalForBaseCell(baseCell);
      if (selected.length !== required) {
        appendToDebug && appendToDebug('Merge blocked: base click needs ' + required + ' selections but have ' + selected.length);
        renderBoard();
        return;
      }
      candidateHighlights.clear();
      mergeSelecting = false;
      evaluateMergeAttempt();
      return;
    }
    // If user tapped elsewhere while in mergeSelecting and it's a highlighted candidate, toggle selection
    const key = r + ',' + c;
    if (candidateHighlights.has(key)) {
      // if already selected, remove; else add
      const already = selected.findIndex(x => x.r === r && x.c === c);
      if (already >= 0) {
        selected.splice(already, 1);
      } else {
        const base = selected[0];
        const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
        if (selected.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
        selected.push({ r, c, cell });
      }
      renderBoard();
      return;
    }
    // non-candidate taps while in mergeSelecting do nothing but keep selection
    renderBoard();
    return;
  }

  // enforce a sensible limit: never allow adding more items than the merge requires for the current base
  if (selected.length === 0) {
    // no base, safe to add as base
    selected.push({ r, c, cell });
  } else {
    // there's a base; compute required total and prevent over-selection
    const base = selected[0];
    const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
    if (selected.length >= required) {
      appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
    } else {
      selected.push({ r, c, cell });
    }
  }
  // Try to evaluate merge intent
  evaluateMergeAttempt();
}

// Handle a long-press on a cell: begin merge selection mode if applicable
function handleLongPress(r, c) {
  if (animating) return;
  const cell = board[r][c];
  if (!cell) return;
  // Don't allow long-press on Common rarity tiles
  try { if (cell.rarity === 'Common') return; } catch (e) {}
  // If long-pressing the base when already in mergeSelecting -> cancel selection
  if (selected.length > 0 && selected[0].r === r && selected[0].c === c && mergeSelecting) {
    mergeSelecting = false;
    candidateHighlights.clear();
    renderBoard();
    return;
  }
  // If nothing selected, treat long-press as selecting base and entering mergeSelecting
  if (selected.length === 0) {
    selected.push({ r, c, cell });
  mergeSelecting = true;
  // suppress the immediate click that occurs on pointerup after long-press
  try { selected[0]._suppressClick = true; } catch (e) {}
    // auto highlight all possible fodder candidates for this base
    const cands = findPotentialFodder(r, c);
    candidateHighlights = new Set(cands.map(p => p.r + ',' + p.c));
    renderBoard();
    return;
  }
  // If one selected and long-pressing any tile, enter mergeSelecting and auto-highlight
  const base = selected[0];
  // start mergeSelecting with base retained
  mergeSelecting = true;
  // If this tile isn't already selected, add it as initial fodder (but enforce limits)
  const already = selected.findIndex(x => x.r === r && x.c === c);
  if (already < 0) {
    const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
    // Only add if this candidate is valid fodder for the base
    if (canBeFodder(base && base.cell ? base.cell : null, cell)) {
      if (selected.length < required) selected.push({ r, c, cell }); else { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); }
    } else {
      appendToDebug && appendToDebug('Long-press: tile not valid fodder for selected base');
    }
  }
  // compute potential fodder candidates across the entire board
  const cands = findPotentialFodder(base.r, base.c);
  candidateHighlights = new Set(cands.map(p => p.r + ',' + p.c));
  renderBoard();
  return;
}

// Find potential fodder candidates for a base cell at (br,bc). Returns array of {r,c}
function findPotentialFodder(br, bc) {
  const base = board[br] && board[br][bc];
  if (!base) return [];
  const out = [];
  // scan neighbors (and entire board for matching templates in some cases)
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (r === br && c === bc) continue;
      const cell = board[r][c];
      if (!cell) continue;
  // No adjacency requirement: consider entire board
      if (canBeFodder(base, cell)) out.push({ r, c });
    }
  }
  return out;
}

// Build/update the merge-preview overlay (4 squares: base, fodder, fodder, result)
function updateMergePreview(alwaysShow = false) {
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) return;
  let preview = document.getElementById('merge-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'merge-preview';
    preview.style.position = 'absolute';
    preview.style.top = '-56px';
    preview.style.right = '0';
    preview.style.display = 'flex';
    preview.style.gap = '8px';
    // allow child elements (result slot) to receive clicks
    preview.style.pointerEvents = 'auto';
    preview.style.zIndex = '30';
    preview.style.padding = '6px';
    boardDiv.appendChild(preview);
  }
  preview.innerHTML = '';

  // Determine tile sizing so preview slots scale relative to the board tiles.
  // Default tile size is 64px in renderBoard(); attempt to measure a rendered cell when available.
  let tileSize = 64;
  try {
    const sampleCell = boardDiv.querySelector('.module-cell');
    if (sampleCell) {
      const rect = sampleCell.getBoundingClientRect();
      if (rect && rect.width > 0) tileSize = Math.round(rect.width);
    }
  } catch (e) { /* ignore measurement failures and fall back to default */ }
  // preview slot target ~90% of a board tile; mini-shape inside slot ~90% of slot
  const slotSize = Math.max(40, Math.round(tileSize * 0.9));
  const miniSize = Math.max(28, Math.round(slotSize * 0.9));

  // Ensure preview sits above the board with a small padding gap to avoid overlap.
  try {
    // add ~12px of extra gap above the preview slots
    preview.style.top = '-' + (slotSize + 12) + 'px';
    preview.style.right = '0';
  } catch (e) { }

  // compute canonical cells once using live board or inventory state (so inventory selections show in preview)
  const normalizedSel = selected.map(s => {
    if (!s) return null;
    if (s.inv) return { cell: inventory[s.inv] || s.cell, inv: s.inv };
    if (typeof s.r === 'number' && typeof s.c === 'number') return { cell: (board[s.r] && board[s.r][s.c]) || s.cell, r: s.r, c: s.c };
    return s;
  });
  const baseCell = (normalizedSel[0] && normalizedSel[0].cell) || null;
  const fod1 = (normalizedSel[1] && normalizedSel[1].cell) || null;
  const fod2 = (normalizedSel[2] && normalizedSel[2].cell) || null;
  // Only compute/show the predicted result when the selection meets the required count for the base
  let predicted = null;
  try {
    const requiredForBase = baseCell ? requiredTotalForBaseCell(baseCell) : 0;
    const selCount = normalizedSel.filter(s => !!s).length;
    try { appendToDebug && appendToDebug('updateMergePreview: normalizedSel=' + JSON.stringify(normalizedSel.map(s => ({ templateId: s && s.cell && s.cell.templateId, rarity: s && s.cell && s.cell.rarity, plus: s && s.cell && s.cell.plus, inv: s && s.inv, r: s && s.r, c: s && s.c }))) + ' required=' + requiredForBase + ' selCount=' + selCount); } catch (e) {}
    if (baseCell && selCount === requiredForBase) {
      const rawPred = predictMergeResult(normalizedSel);
      // sanitize predicted cell so preview rendering doesn't accidentally read live base fields
      if (rawPred) {
        predicted = {
          templateId: rawPred.templateId || (baseCell && baseCell.templateId),
          type: rawPred.type || (baseCell && baseCell.type),
          rarity: rawPred.rarity || (baseCell && baseCell.rarity),
          plus: rawPred.plus || false,
          shape: rawPred.shape || (baseCell && baseCell.shape),
          initials: rawPred.initials || (baseCell && baseCell.initials),
          unique: typeof rawPred.unique !== 'undefined' ? rawPred.unique : (baseCell && baseCell.unique),
          stars: typeof rawPred.stars !== 'undefined' ? rawPred.stars : (baseCell && baseCell.stars),
        };
      } else predicted = null;
      try { appendToDebug && appendToDebug('updateMergePreview: predicted(sanitized)=' + JSON.stringify(predicted)); } catch (e) {}
      try { console.debug && console.debug('updateMergePreview predicted', predicted); } catch (e) {}
    }
  } catch (e) { predicted = null; }

  const slots = [ { kind: 'base', cell: baseCell }, { kind: 'fod1', cell: fod1 }, { kind: 'fod2', cell: fod2 }, { kind: 'predicted', cell: predicted } ];

  for (let i = 0; i < slots.length; i++) {
    const info = slots[i];
    const slot = document.createElement('div');
    slot.className = 'merge-slot';
    slot.dataset.kind = info.kind;
  slot.style.position = 'relative';
  slot.style.width = slotSize + 'px';
  slot.style.height = slotSize + 'px';
  slot.style.background = '#0f0f0f';
  slot.style.border = '1px solid #333';
  slot.style.display = 'flex';
  slot.style.alignItems = 'center';
  slot.style.justifyContent = 'center';
  slot.style.boxSizing = 'border-box';
  slot.style.borderRadius = '6px';

    // Only show non-Common cells. For predicted slot we also only show when prediction is non-Common.
  if (info.cell && info.cell.rarity && info.cell.rarity !== 'Common') {
      // pass scaled mini size so preview shapes are ~90% of slot
      slot.appendChild(buildMiniShape(info.cell, miniSize));
      slot.dataset.rarity = info.cell.rarity;
    }

  preview.appendChild(slot);

    // Make the result slot actionable and mark it with a special class
    if (i === 3) {
      slot.classList.add('predicted-slot');
      // compute required selections for the current base
      const baseSel = selected[0];
      const baseCell = baseSel && baseSel.cell ? baseSel.cell : null;
      const required = requiredTotalForBaseCell(baseCell);
      const ready = selected.length === required;
      // only enable pointer interactions when ready
      slot.style.pointerEvents = ready ? 'auto' : 'none';
      slot.style.cursor = ready ? 'pointer' : 'default';
  // always keep predicted slot opaque so it visually matches other preview slots
  slot.style.opacity = '1';
      slot.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (!ready) return;
        if (mergeSelecting && selected.length > 0) {
          candidateHighlights.clear();
          mergeSelecting = false;
          evaluateMergeAttempt();
        }
      });
    }

    // Insert separators between slots
    if (i < slots.length - 1) {
      const sep = document.createElement('div');
      if (i === slots.length - 2) {
        sep.className = 'merge-equals';
        sep.textContent = '=';
        sep.style.pointerEvents = 'none';
        sep.style.cursor = 'default';
      } else {
        sep.className = 'merge-plus';
        sep.textContent = '+';
        sep.style.pointerEvents = 'none';
      }
      preview.appendChild(sep);
    }
  }

  if (selected.length === 0 && !alwaysShow) preview.style.display = 'none'; else preview.style.display = 'flex';
}

function buildMiniShape(cell, size = 36) {
  // Try to render using image assets (frame + module overlay). If assets 404, fall back to vector shapes.
  const wrapper = document.createElement('div');
  wrapper.style.width = size + 'px';
  wrapper.style.height = size + 'px';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.position = 'relative';

  // if dev wants vector-only mode, skip images and render vector fallback immediately
  if (useVectorOnly) {
    const wrapper = document.createElement('div');
    wrapper.style.width = size + 'px';
    wrapper.style.height = size + 'px';
    wrapper.style.position = 'relative';
    // reuse renderVectorMini defined later by constructing a minimal fallback
    const v = document.createElement('div');
    v.className = 'vector-mini';
    v.style.position = 'absolute'; v.style.left = '50%'; v.style.top = '50%'; v.style.transform = 'translate(-50%,-50%)';
    const bg = RARITY_COLOR[cell.rarity] || '#808080';
    const SH = Math.max(10, Math.round(size * 0.86));
    const s = document.createElement('div'); s.style.width = SH + 'px'; s.style.height = SH + 'px'; s.style.background = bg;
    if (cell.shape === 'circle') s.style.borderRadius = '50%';
    if (cell.shape === 'square') s.style.borderRadius = '4px';
    if (cell.shape === 'triangle') s.style.clipPath = 'polygon(50% 6%, 94% 94%, 6% 94%)';
    if (cell.shape === 'diamond') { s.style.transform = 'rotate(45deg)'; }
    v.appendChild(s);
    wrapper.appendChild(v);
    return wrapper;
  }

  // helper: normalize template id to filename-friendly token
  const normalize = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const typeDir = (cell.type || 'Core').toLowerCase();
  const rarityKey = (cell.rarity || 'Common').toLowerCase();
  const plusSuffix = cell.plus ? '_plus' : '';
  // Resolve via imported ASSETS map when available to let Vite bundle the images.
  const frameKey = 'mf_' + rarityKey + (cell.plus ? '_plus' : '');
  const tmpl = normalize(cell.templateId || '');
  const dirKey = 'modules_' + typeDir;
  // Prefer persisted instance URLs when available so visuals stay stable across renders
  let frameSrc = null;
  let moduleSrc = null;
  let moduleFoundKey = null;
  try {
    if (cell && cell._frameSrc) frameSrc = cell._frameSrc;
    if (cell && cell._assetSrc) { moduleSrc = cell._assetSrc; moduleFoundKey = cell._assetKey || null; }
  } catch (e) {}
  // If persisted assets weren't present, fall back to ASSETS lookup
  if (!frameSrc && ASSETS[dirKey]) {
    if (ASSETS[dirKey][frameKey]) frameSrc = ASSETS[dirKey][frameKey];
    else {
      const commonKey = 'mf_common' + (cell.plus ? '_plus' : '');
      if (ASSETS[dirKey][commonKey]) { frameSrc = ASSETS[dirKey][commonKey]; }
      else if (ASSETS[dirKey]['mf_common']) { frameSrc = ASSETS[dirKey]['mf_common']; }
      else if (ASSETS[dirKey]['mf_empty']) { frameSrc = ASSETS[dirKey]['mf_empty']; }
    }
  }
  if (!moduleSrc) {
    try {
      const map = ASSETS[dirKey] || {};
      if (tmpl) {
        // prefer exact rarity-prefixed key if present
        const prefKey = rarityKey + '_' + tmpl;
        if (map[prefKey]) { moduleSrc = map[prefKey]; moduleFoundKey = prefKey; }
        // then prefer canonical rare_ prefix
        else if (map['rare_' + tmpl]) { moduleSrc = map['rare_' + tmpl]; moduleFoundKey = 'rare_' + tmpl; }
        // then plain template key
        else if (map[tmpl]) { moduleSrc = map[tmpl]; moduleFoundKey = tmpl; }
        else {
          // fallback: find any key that ends with '_' + tmpl
          for (const k of Object.keys(map)) {
            if (k.endsWith('_' + tmpl)) { moduleSrc = map[k]; moduleFoundKey = k; break; }
          }
        }
      }
    } catch (e) { moduleSrc = null; moduleFoundKey = null; }
  }

  // Respect persisted instance assets: if the instance already has resolved URLs, prefer them and skip re-selection
  let persistedUsed = false;
  try {
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
      if (cell._frameSrc) frameSrc = cell._frameSrc;
      persistedUsed = true;
    }
  } catch (e) {}

  // Prevent displaying an mf_common frame if there is no common_* module artwork to go inside it
  try {
    if (!persistedUsed && frameSrc && frameKey && frameKey.startsWith('mf_common')) {
      const map = ASSETS[dirKey] || {};
      if (!(moduleFoundKey && moduleFoundKey.startsWith && moduleFoundKey.startsWith('common_'))) {
        // 1) honor a hardcoded mapping if present
        const hard = HARDCODED_COMMON_SELECTION[tmpl];
        if (hard && map[hard]) { moduleSrc = map[hard]; moduleFoundKey = hard; }
        // 2) prefer template-specific common in this dir
        else if (tmpl && map['common_' + tmpl]) { moduleSrc = map['common_' + tmpl]; moduleFoundKey = 'common_' + tmpl; }
        else {
          // 3) first local common in this dir (sorted)
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) { localCommons.sort(); moduleFoundKey = localCommons[0]; moduleSrc = map[moduleFoundKey]; }
          else {
            // 4) first global common across ASSETS
            let found = null;
            const globalList = [];
            for (const dk of Object.keys(ASSETS)) {
              const m = ASSETS[dk] || {};
              for (const k of Object.keys(m)) {
                if (k.startsWith('common_')) globalList.push({ dir: dk, key: k });
              }
            }
            if (globalList.length > 0) {
              globalList.sort((a, b) => { const A = a.dir + '::' + a.key; const B = b.dir + '::' + b.key; return A < B ? -1 : (A > B ? 1 : 0); });
              found = globalList[0];
            }
            if (found) { moduleFoundKey = found.key; moduleSrc = ASSETS[found.dir][found.key]; forcedAssetDir = found.dir; forcedAssetSrc = moduleSrc; }
            else { if (ASSETS[dirKey] && ASSETS[dirKey]['mf_empty']) frameSrc = ASSETS[dirKey]['mf_empty']; else frameSrc = null; }
          }
        }
      }
    }
  } catch (e) {}

  try { appendToDebug && appendToDebug(`buildMiniShape: dir=${dirKey} frameKey=${frameKey} frameSrc=${frameSrc} moduleKey=${moduleKey} moduleSrc=${moduleSrc}`); } catch (e) {}

  let usedImage = false;

  // create frame image only if we have a bundler-resolved URL
  if (frameSrc) {
    const imgFrame = document.createElement('img');
    imgFrame.className = 'module-frame';
    imgFrame.src = frameSrc;
    imgFrame.alt = '';
    // center the frame and scale slightly larger than the wrapper so it visually fills the cell
    imgFrame.style.position = 'absolute';
    imgFrame.style.left = '50%';
    imgFrame.style.top = '50%';
    imgFrame.style.transform = 'translate(-50%,-50%)';
    imgFrame.style.width = Math.round(size * 1.06) + 'px';
    imgFrame.style.height = Math.round(size * 1.06) + 'px';
    imgFrame.style.objectFit = 'cover';
    imgFrame.style.zIndex = '20';
    imgFrame.style.display = 'block';
    wrapper.style.zIndex = '19';
    imgFrame.addEventListener('error', () => {
      try { appendToDebug && appendToDebug('imgFrame error: ' + frameSrc); } catch (e) {}
      imgFrame.remove();
    });
    imgFrame.addEventListener('load', () => { usedImage = true; try { appendToDebug && appendToDebug('imgFrame loaded: ' + imgFrame.src + ' -> ' + imgFrame.naturalWidth + 'x' + imgFrame.naturalHeight); } catch (e) {} });
    wrapper.appendChild(imgFrame);
  }

  // create module overlay image only if we have a bundler-resolved URL
  if (moduleSrc) {
    const imgMod = document.createElement('img');
    imgMod.className = 'module-asset';
    imgMod.src = moduleSrc;
    imgMod.alt = '';
    imgMod.style.position = 'absolute';
    imgMod.style.left = '50%';
    imgMod.style.top = '50%';
    imgMod.style.transform = 'translate(-50%, -50%)';
  // make module art fill more of the slot
  imgMod.style.width = Math.round(size * 0.86) + 'px';
  imgMod.style.height = Math.round(size * 0.86) + 'px';
    imgMod.style.objectFit = 'contain';
    imgMod.style.zIndex = '21';
    imgMod.style.display = 'block';
    imgMod.addEventListener('error', () => {
      try { appendToDebug && appendToDebug('imgMod error: ' + moduleSrc); } catch (e) {}
      imgMod.remove();
    });
    imgMod.addEventListener('load', () => { usedImage = true; try { appendToDebug && appendToDebug('imgMod loaded: ' + imgMod.src + ' -> ' + imgMod.naturalWidth + 'x' + imgMod.naturalHeight); } catch (e) {} });
    wrapper.appendChild(imgMod);
  }

  // If we have neither frame nor module assets, render the vector fallback immediately
  if (!frameSrc && !moduleSrc) {
    renderVectorMini();
    return wrapper;
  }

  // initials overlay (same as board behavior) for non-Common rarities
  if (cell.rarity !== 'Common') {
    const initials = document.createElement('div');
    initials.className = 'module-initials';
    initials.textContent = cell.initials || (typeof cell.templateId === 'string' ? (findTemplate(cell.templateId) && findTemplate(cell.templateId).initials) : '');
    initials.style.position = 'absolute';
    initials.style.fontSize = cell.unique ? '12px' : '11px';
    initials.style.pointerEvents = 'none';
    initials.style.left = '50%';
    initials.style.top = '50%';
    initials.style.transform = cell.shape === 'triangle' ? 'translate(-50%, -40%)' : 'translate(-50%, -50%)';
    wrapper.appendChild(initials);
  }

  // Decorative notches for Rare+ mini shapes to match board visuals
  if (cell.plus) {
    wrapper.classList.add('rare-plus');
    const shape = cell.shape;
    let verts = [];
    if (shape === 'triangle') {
      verts = [ [50,6], [94,94], [6,94] ];
    } else {
      verts = [ [50,6], [94,50], [50,94], [6,50] ];
    }
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      const n = document.createElement('div');
      n.className = 'rare-plus-notch';
      n.style.position = 'absolute';
      n.style.pointerEvents = 'none';
      n.style.width = '8px';
      n.style.height = '3px';
      n.style.background = 'rgba(255,255,255,0.95)';
      n.style.borderRadius = '2px';
      n.style.zIndex = '12';
      n.style.left = mx + '%';
      n.style.top = my + '%';
      n.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
      wrapper.appendChild(n);
    }
  }

  // If images fail to load we render vector mini shapes here
  function renderVectorMini() {
    // avoid duplicating if already rendered
    if (wrapper.querySelector('.vector-mini')) return;
    const v = document.createElement('div');
    v.className = 'vector-mini';
    v.style.position = 'absolute';
    v.style.left = '50%';
    v.style.top = '50%';
    v.style.transform = 'translate(-50%,-50%)';
    const bg = RARITY_COLOR[cell.rarity] || '#808080';
    if (cell.shape === 'diamond') {
      const inner = document.createElement('div');
    // scale vector fallback larger so it better fills the slot
    const SH = Math.max(12, Math.round(size * 0.86));
      inner.style.width = SH + 'px';
      inner.style.height = SH + 'px';
      inner.style.transform = 'rotate(45deg)';
      inner.style.background = bg;
      inner.style.borderRadius = '3px';
      v.appendChild(inner);
    } else {
      const s = document.createElement('div');
        // scale vector fallback to occupy more of the cell
        const SH = Math.max(10, Math.round(size * 0.88));
        s.style.width = SH + 'px';
        s.style.height = SH + 'px';
      s.style.background = bg;
      if (cell.shape === 'circle') s.style.borderRadius = '50%';
      if (cell.shape === 'square') s.style.borderRadius = '4px';
      if (cell.shape === 'triangle') s.style.clipPath = 'polygon(50% 6%, 94% 94%, 6% 94%)';
      if (cell.plus) s.style.boxShadow = '0 0 10px rgba(255,255,255,0.9)';
      v.appendChild(s);
    }
    wrapper.appendChild(v);
  }

  return wrapper;
}

// Very small heuristic to predict merge result given current selection (non-mutating)
function predictMergeResult(sel) {
  if (!sel || sel.length === 0) return null;
  const base = sel[0].cell;
  if (!base) return null;
  // simple predictions matching evaluateMergeAttempt rules
  // 1 Rare+ + 2 Rare+ -> Epic (only allowed when both fodder are Rare+ of same module type)
  if (sel.length === 3 && base.rarity === 'Rare' && base.plus && sel.slice(1).every(s => s && s.cell && s.cell.rarity === 'Rare' && s.cell.plus && s.cell.type === base.type)) {
    return { ...base, rarity: 'Epic', plus: false };
  }
  // 3 non-plus Rares of same template -> Rare+
  if (sel.length === 3 && sel.every(s => s.cell.rarity === 'Rare' && !s.cell.plus) && sel.every(s => s.cell.templateId === sel[0].cell.templateId)) {
    return { ...base, rarity: 'Rare', plus: true };
  }
  // 2 non-plus Epics of same template -> Epic+
  if (sel.length === 2) {
    const allEpicNonPlus = sel.every(s => s && s.cell && s.cell.rarity === 'Epic' && !s.cell.plus);
    const sameTemplate = sel.every(s => s && s.cell && s.cell.templateId === sel[0].cell.templateId);
    if (allEpicNonPlus && sameTemplate) {
      try { appendToDebug && appendToDebug('predictMergeResult -> Epic+: sel=' + JSON.stringify(sel.map(s => ({ templateId: s.cell.templateId, rarity: s.cell.rarity, plus: s.cell.plus })))); } catch (e) {}
      return { ...base, rarity: 'Epic', plus: true };
    }
  }
  // fallback: return base
  return { ...base };
}

function sameTemplate(a, b) { return a.cell.templateId === b.cell.templateId; }

// Reusable shape builder so board cells, inventory slots, and preview shapes render identically.
// size: pixel size for the bounding box. options: { className?: string }
function buildShape(cell, size = 56, options = {}) {
  // Try to render using image assets (frame + module overlay). If images missing, fall back to vector shapes.
  const wrapper = document.createElement('div');
  wrapper.className = options.className || 'module-shape';
  wrapper.style.width = size + 'px';
  wrapper.style.height = size + 'px';
  wrapper.style.overflow = 'hidden';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.color = '#000';
  wrapper.style.fontWeight = '700';
  wrapper.style.userSelect = 'none';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.position = 'relative';

  // If dev enable vector-only mode, render vector fallback immediately and skip images
  if (useVectorOnly) {
    const wrapper = document.createElement('div');
    wrapper.className = options.className || 'module-shape';
    wrapper.style.width = size + 'px';
    wrapper.style.height = size + 'px';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.position = 'relative';
    const color = RARITY_COLOR[cell.rarity] || RARITY_COLOR.Common;
    if (cell.shape === 'diamond') {
      const inner = document.createElement('div');
      const innerSize = Math.round(size * 0.82);
      inner.style.width = innerSize + 'px'; inner.style.height = innerSize + 'px';
      inner.style.background = color; inner.style.transform = 'rotate(45deg)'; inner.style.borderRadius = '4px';
      wrapper.appendChild(inner);
    } else {
      const s = document.createElement('div');
      const SH = Math.round(size * 0.88);
      s.style.width = SH + 'px'; s.style.height = SH + 'px'; s.style.background = color;
      if (cell.shape === 'circle') s.style.borderRadius = '50%';
      if (cell.shape === 'square') s.style.borderRadius = '6px';
      if (cell.shape === 'triangle') s.style.clipPath = 'polygon(50% 2%, 98% 98%, 2% 98%)';
      wrapper.appendChild(s);
    }
    if (cell.plus) wrapper.style.boxShadow = '0 0 12px rgba(255,255,255,0.9)';
    return wrapper;
  }

  // Special-case: render mines with a placeholder bomb and movesRemaining badge
  try {
    if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
      const mineWrap = document.createElement('div');
      mineWrap.className = options.className || 'module-shape mine-shape';
      mineWrap.style.width = size + 'px';
      mineWrap.style.height = size + 'px';
      mineWrap.style.display = 'flex';
      mineWrap.style.alignItems = 'center';
      mineWrap.style.justifyContent = 'center';
      mineWrap.style.position = 'relative';
      mineWrap.style.background = '#2b2b2b';
      mineWrap.style.border = '1px solid #444';
      mineWrap.style.borderRadius = '50%';
      mineWrap.style.color = '#fff';
      mineWrap.style.fontWeight = '700';
      mineWrap.style.boxSizing = 'border-box';
      // Use project mine asset when available, otherwise fall back to bomb emoji
      if (MINE_ASSET) {
        const img = document.createElement('img');
        img.src = MINE_ASSET;
        img.alt = 'mine';
        img.style.width = Math.round(size * 0.72) + 'px';
        img.style.height = Math.round(size * 0.72) + 'px';
        img.style.objectFit = 'contain';
        img.style.zIndex = '3';
        mineWrap.appendChild(img);
      } else {
        const bomb = document.createElement('div');
        bomb.textContent = '💣';
        bomb.style.fontSize = Math.round(size * 0.52) + 'px';
        bomb.style.lineHeight = '1';
        mineWrap.appendChild(bomb);
      }
      // movesRemaining badge
      const badge = document.createElement('div');
      badge.className = 'mine-badge';
      badge.textContent = String(cell.movesRemaining != null ? cell.movesRemaining : 10);
      badge.style.position = 'absolute';
      badge.style.right = '4px';
      badge.style.top = '4px';
      badge.style.background = '#ff6b6b';
      badge.style.color = '#111';
      badge.style.fontSize = '11px';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '10px';
      badge.style.fontWeight = '700';
      mineWrap.appendChild(badge);
      return mineWrap;
    }
  } catch (e) {}

  const normalize = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const typeDir = (cell.type || 'Core').toLowerCase();
  const rarityKey = (cell.rarity || 'Common').toLowerCase();
  const plusSuffix = cell.plus ? '_plus' : '';
  const frameKey = 'mf_' + rarityKey + (cell.plus ? '_plus' : '');
  const tmpl = normalize(cell.templateId || '');
  const dirKey = 'modules_' + typeDir;
  // Prefer persisted instance URLs so visuals remain stable across renders
  let frameSrc = null;
  let moduleSrc = null;
  let moduleFoundKey = null;
  try {
    if (cell && cell._frameSrc) frameSrc = cell._frameSrc;
    if (cell && cell._assetSrc) { moduleSrc = cell._assetSrc; moduleFoundKey = cell._assetKey || null; }
  } catch (e) {}
  // If persisted assets not present, fall back to ASSETS map lookup
  if (!frameSrc && ASSETS[dirKey]) {
    if (ASSETS[dirKey][frameKey]) frameSrc = ASSETS[dirKey][frameKey];
    else {
      const commonKey = 'mf_common' + (cell.plus ? '_plus' : '');
      if (ASSETS[dirKey][commonKey]) { frameSrc = ASSETS[dirKey][commonKey]; }
      else if (ASSETS[dirKey]['mf_common']) { frameSrc = ASSETS[dirKey]['mf_common']; }
      else if (ASSETS[dirKey]['mf_empty']) { frameSrc = ASSETS[dirKey]['mf_empty']; }
    }
  }
  if (!moduleSrc) {
    try {
      const map = ASSETS[dirKey] || {};
      if (tmpl) {
        const prefKey = rarityKey + '_' + tmpl;
        if (map[prefKey]) { moduleSrc = map[prefKey]; moduleFoundKey = prefKey; }
        else if (map['rare_' + tmpl]) { moduleSrc = map['rare_' + tmpl]; moduleFoundKey = 'rare_' + tmpl; }
        else if (map[tmpl]) { moduleSrc = map[tmpl]; moduleFoundKey = tmpl; }
        else {
          for (const k of Object.keys(map)) {
            if (k.endsWith('_' + tmpl)) { moduleSrc = map[k]; moduleFoundKey = k; break; }
          }
        }
      }
    } catch (e) { moduleSrc = null; moduleFoundKey = null; }
  }

  // Enforce: do not use the mf_common frame unless we can show a common_* module inside it.
  // Respect persisted instance assets: if the instance already has resolved URLs, prefer them and skip re-selection
  let persistedUsed = false;
  try {
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
      if (cell._frameSrc) frameSrc = cell._frameSrc;
      persistedUsed = true;
    }
  } catch (e) {}

  // If frameSrc currently points at a common frame but module is not a common variant, try to find a common module (only when not persisted)
  try {
    if (!persistedUsed && frameSrc && frameKey && frameKey.startsWith('mf_common')) {
      const map = ASSETS[dirKey] || {};
      // if moduleFoundKey is already a common_ variant we're good
      if (!(moduleFoundKey && moduleFoundKey.startsWith('common_'))) {
        // 1) honor hardcoded mapping
        const hard = HARDCODED_COMMON_SELECTION[tmpl];
        if (hard && map[hard]) { moduleSrc = map[hard]; moduleFoundKey = hard; }
        // 2) try template-specific common in this dir
        else if (tmpl && map['common_' + tmpl]) { moduleSrc = map['common_' + tmpl]; moduleFoundKey = 'common_' + tmpl; }
        else {
          // 3) first local common
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) { localCommons.sort(); moduleFoundKey = localCommons[0]; moduleSrc = map[moduleFoundKey]; }
          else {
            // 4) first global common across ASSETS
            let found = null;
            const globalList = [];
            for (const dk of Object.keys(ASSETS)) {
              const m = ASSETS[dk] || {};
              for (const k of Object.keys(m)) {
                if (k.startsWith('common_')) globalList.push({ dir: dk, key: k });
              }
            }
            if (globalList.length > 0) { globalList.sort((a, b) => { const A = a.dir + '::' + a.key; const B = b.dir + '::' + b.key; return A < B ? -1 : (A > B ? 1 : 0); }); found = globalList[0]; }
            if (found) { moduleFoundKey = found.key; moduleSrc = ASSETS[found.dir][found.key]; forcedAssetDir = found.dir; forcedAssetSrc = moduleSrc; }
            else { if (ASSETS[dirKey] && ASSETS[dirKey]['mf_empty']) { frameSrc = ASSETS[dirKey]['mf_empty']; } else { frameSrc = null; } }
          }
        }
      }
    }
  } catch (e) {}

  let usedImage = false;

  try { appendToDebug && appendToDebug(`buildShape: dir=${dirKey} frameKey=${frameKey} frameSrc=${frameSrc} moduleKey=${moduleFoundKey} moduleSrc=${moduleSrc}`); } catch (e) {}

  if (frameSrc) {
    const imgFrame = document.createElement('img');
    imgFrame.className = 'module-frame';
    imgFrame.src = frameSrc;
    imgFrame.alt = '';
    imgFrame.style.position = 'absolute';
    imgFrame.style.left = '0';
    imgFrame.style.top = '0';
    imgFrame.style.width = '100%';
    imgFrame.style.height = '100%';
    imgFrame.style.objectFit = 'contain';
    imgFrame.style.zIndex = '1';
    imgFrame.addEventListener('error', () => { try { appendToDebug && appendToDebug('imgFrame error: ' + frameSrc); } catch (e) {} imgFrame.remove(); if (!moduleSrc) renderVector(); });
    imgFrame.addEventListener('load', () => { usedImage = true; try { appendToDebug && appendToDebug('imgFrame loaded: ' + imgFrame.src + ' -> ' + imgFrame.naturalWidth + 'x' + imgFrame.naturalHeight); } catch (e) {} });
    wrapper.appendChild(imgFrame);
  }

  if (moduleSrc) {
    const imgMod = document.createElement('img');
    imgMod.className = 'module-asset';
    imgMod.src = moduleSrc;
    imgMod.alt = '';
    imgMod.style.position = 'absolute';
    imgMod.style.left = '50%';
    imgMod.style.top = '50%';
    imgMod.style.transform = 'translate(-50%, -50%)';
  // make module art fill more of the slot (match mini-shape sizing)
  imgMod.style.width = Math.round(size * 0.86) + 'px';
  imgMod.style.height = Math.round(size * 0.86) + 'px';
    imgMod.style.objectFit = 'contain';
    imgMod.style.zIndex = '2';
    imgMod.addEventListener('error', () => { try { appendToDebug && appendToDebug('imgMod error: ' + moduleSrc); } catch (e) {} imgMod.remove(); if (!usedImage) renderVector(); });
    imgMod.addEventListener('load', () => { usedImage = true; try { appendToDebug && appendToDebug('imgMod loaded: ' + imgMod.src + ' -> ' + imgMod.naturalWidth + 'x' + imgMod.naturalHeight); } catch (e) {} });
    wrapper.appendChild(imgMod);
  }

  // If neither asset exists, fallback immediately to vector rendering
  if (!frameSrc && !moduleSrc) {
    renderVector();
    return wrapper;
  }

  // fallback vector rendering when images not available
  function renderVector() {
    if (wrapper.querySelector('.vector-shape')) return;
    const color = RARITY_COLOR[cell.rarity] || RARITY_COLOR.Common;
    if (cell.shape === 'circle') {
      wrapper.style.borderRadius = '50%';
      wrapper.style.background = color;
    } else if (cell.shape === 'square') {
      wrapper.style.borderRadius = '6px';
      wrapper.style.background = color;
    } else if (cell.shape === 'triangle') {
      // tighten triangle margins so it occupies more of the cell
      wrapper.style.background = color;
      wrapper.style.clipPath = 'polygon(50% 2%, 98% 98%, 2% 98%)';
    } else if (cell.shape === 'diamond') {
      // scale diamond inner box to better fill the slot
      const innerSize = Math.round(size * 0.82);
      const inner = document.createElement('div');
      inner.style.width = innerSize + 'px';
      inner.style.height = innerSize + 'px';
      inner.style.background = color;
      inner.style.transform = 'rotate(45deg)';
      inner.style.borderRadius = '4px';
      inner.style.boxSizing = 'border-box';
      inner.style.margin = 'auto';
      inner.style.display = 'block';
      if (cell.plus) inner.style.boxShadow = '0 0 12px rgba(255,255,255,0.9)';
      wrapper.appendChild(inner);
    }
    if (cell.plus && cell.shape !== 'diamond') {
      wrapper.style.boxShadow = '0 0 12px rgba(255,255,255,0.9)';
    }
  }

  // If images never load, ensure vector appears eventually (safety timeout)
  setTimeout(() => { if (!usedImage) renderVector(); }, 250);

  return wrapper;
}

// Determine whether a candidate cell can serve as fodder for a merge with the base cell.
function canBeFodder(baseCell, candidateCell) {
  if (!baseCell || !candidateCell) return false;
  // tiles disabled by proximity to a mine cannot be used as fodder
  try {
    if (isDisabledByMine(candidateCell)) return false;
    if (isDisabledByMine(baseCell)) return false;
  } catch (e) {}
  // Commons cannot be used as fodder
  if (candidateCell.rarity === 'Common' || baseCell.rarity === 'Common') return false;
  // Global rule: fodder must be of the same module type as the base
  if (candidateCell.type !== baseCell.type) return false;
  // NOTE: template matching is required for many merges (e.g., Rare & Epic non-plus),
  // but Epic+ fodder is intentionally allowed from any template for Epic+/higher merges.

  // Rare rules
  if (baseCell.rarity === 'Rare' && !baseCell.plus) {
    // 3x Rare -> Rare+ : fodder must be Rare non-plus
    return candidateCell.rarity === 'Rare' && !candidateCell.plus && candidateCell.templateId === baseCell.templateId;
  }
  if (baseCell.rarity === 'Rare' && baseCell.plus) {
  // 1 Rare+ + 2 Rare+ -> Epic : fodder must be Rare+ and match module type
  if (candidateCell.rarity !== 'Rare') return false;
  // Only allow Rare+ as fodder for a Rare+ base
  return !!candidateCell.plus && candidateCell.type === baseCell.type;
  }

  // Epic rules
  if (baseCell.rarity === 'Epic' && !baseCell.plus) {
    // 2x Epic -> Epic+ : fodder must be Epic non-plus
  return candidateCell.rarity === 'Epic' && !candidateCell.plus && candidateCell.templateId === baseCell.templateId;
  }
  if (baseCell.rarity === 'Epic' && baseCell.plus) {
    // 1 Epic+ + 2 Epic+ -> Legendary : fodder must be Epic+ (plus true)
  // Allow Epic+ fodder from any template for Epic+ merges BUT require same module type
  return candidateCell.rarity === 'Epic' && candidateCell.plus === true && candidateCell.type === baseCell.type;
  }

  // Legendary rules
  if (baseCell.rarity === 'Legendary' && !baseCell.plus) {
    // Legendary + Epic+ -> Legendary+ : fodder must be Epic+ (plus true)
  // Require same module template (name) as the Legendary base
  return candidateCell.rarity === 'Epic' && candidateCell.plus === true && candidateCell.templateId === baseCell.templateId;
  }
  if (baseCell.rarity === 'Legendary' && baseCell.plus) {
    // 1 Legendary+ + 1 Legendary+ -> Mythic : fodder must be Legendary+ (plus true)
  // Require same module type for Legendary+ merges
  return candidateCell.rarity === 'Legendary' && candidateCell.plus === true && candidateCell.type === baseCell.type;
  }

  // Mythic rules
  if (baseCell.rarity === 'Mythic' && !baseCell.plus) {
    // 1 Mythic + 1 Legendary+ -> Mythic+ : fodder must be Legendary+ (plus true)
    return candidateCell.rarity === 'Legendary' && candidateCell.plus === true;
  }
  if (baseCell.rarity === 'Mythic' && baseCell.plus) {
    // Mythic+ + 2 Epic+ -> Ancestral : fodder must be Epic+
    return candidateCell.rarity === 'Epic' && candidateCell.plus === true;
  }

  // Ancestral rules (upgrade via Epic+)
  if (baseCell.rarity === 'Ancestral') {
    // Ancestral + 2 Epic+ -> Ancestral star upgrade
    return candidateCell.rarity === 'Epic' && candidateCell.plus === true;
  }

  return false;
}

// Return true if a cell object is considered disabled due to being adjacent to a live mine
function isDisabledByMine(cell) {
  if (!cell || !cell.instanceId) return false;
  try {
  // A mine tile itself is never "disabled" by proximity — only surrounding modules are.
  if (cell.templateId === '__MINE__' || cell.rarity === 'Mine') return false;
    // locate its coordinates on board
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const b = board[r][c];
        if (b && b.instanceId === cell.instanceId) {
          // scan surrounding cells for a mine. If any adjacent mine exists and no
          // valid two-Common orthogonal shatter combo is present, the cell is disabled.
          let foundMine = false;
          let shatterComboPresent = false;
          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
                      const nb = board[rr][cc];
                      // treat either a mine tile OR the boss overlay as hazards that can disable nearby modules
                      const isMineHere = !!(nb && nb.templateId === '__MINE__');
                      const isBossHere = !!(window.__BOSS_MARKER && window.__BOSS_MARKER.r === rr && window.__BOSS_MARKER.c === cc);
                      if (!isMineHere && !isBossHere) continue;
              foundMine = true;
              // compute vector from mine -> this cell
              const dr = r - rr, dc = c - cc;
              // only orthogonal shatter combos qualify
              if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
              // only Commons can participate in the two-Common shatter combo
              if (cell.rarity !== 'Common') continue;
              const r2 = r + dr, c2 = c + dc;
              if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) continue;
              const behind = board[r2][c2];
              if (behind && behind.rarity === 'Common' && behind.type === cell.type) {
                shatterComboPresent = true;
              }
            }
          }
          if (foundMine && !shatterComboPresent) return true;
          return false;
        }
      }
    }
  } catch (e) {}
  return false;
}

// Return required total selection count (including base) for merges where baseCell is first selected
function requiredTotalForBaseCell(baseCell) {
  if (!baseCell) return Infinity;
  const r = baseCell.rarity;
  const plus = !!baseCell.plus;
  const key = r + (plus ? '+' : '');
  switch (key) {
  case 'Rare': return 3; // 3 Rare -> Rare+
  case 'Rare+': return 3; // 1 Rare+ + 2 Rare -> Epic (counting base + 2 fodder)
  case 'Epic': return 2; // 2 Epic -> Epic+
  case 'Epic+': return 3; // 1 Epic+ + 2 Epic+ -> Legendary
  case 'Legendary': return 2; // 1 Legendary + 1 Epic+ -> Legendary+
  case 'Legendary+': return 2; // 1 Legendary+ + 1 Legendary+ -> Mythic
  case 'Mythic': return 2; // 1 Mythic + 1 Legendary+ -> Mythic+
  case 'Mythic+': return 3; // 1 Mythic+ + 2 Epic+ -> Ancestral
  case 'Ancestral': return 3; // Ancestral + 2 Epic+ -> Ancestral star upgrade
    default: return Infinity;
  }
}

// Determine whether a cell may be shattered manually/instantly.
function canBeShattered(cell) {
  if (!cell) return false;
  // Special rule: Mines are only manually shatterable when there are two Commons in a straight line
  // touching the mine (one adjacent, one directly behind it). Otherwise mines cannot be
  // manually shattered. Commons, Rare, Epic follow normal rules below.
  if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
    // locate mine on board and check for straight two-Common line
    try {
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const b = board[r][c];
          if (!b || b.instanceId !== cell.instanceId) continue;
          // check only 4 orthogonal directions (no diagonals)
          const dirs = [ [-1,0], [1,0], [0,-1], [0,1] ];
          for (const [dr, dc] of dirs) {
            const r1 = r + dr, c1 = c + dc;
            const r2 = r + dr * 2, c2 = c + dc * 2;
            if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) continue;
            if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) continue;
            const n1 = board[r1][c1];
            const n2 = board[r2][c2];
            // require both Commons and same module type so the straight pair is a valid common run
            if (n1 && n2 && n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) return true;
          }
          return false;
        }
      }
    } catch (e) { /* ignore */ }
    return false;
  }
  // only certain rarities may be shattered; Commons/Rares/Epics follow normal rules
  if (!['Common', 'Rare', 'Epic'].includes(cell.rarity)) return false;
  // Epic+ variants cannot be shattered
  if (cell.rarity === 'Epic' && cell.plus) return false;
  // Unique Epic modules can only be shattered if we've completed a 5★ Ancestral of that template
  if (cell.unique && cell.rarity === 'Epic') {
    const stars = completed[cell.templateId] || 0;
    return stars >= 5;
  }
  return true;
}

// Return true if the boss overlay at a location can be tapped to trigger its effect (mirrors mine behavior)
function canBossBeShattered(bossMarker) {
  if (!bossMarker) return false;
  try {
    const r = bossMarker.r, c = bossMarker.c;
    // Check orthogonal directions for a straight two-Common run that would be used to damage the boss
    const dirs = [ [-1,0], [1,0], [0,-1], [0,1] ];
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc;
      const r2 = r + dr * 2, c2 = c + dc * 2;
      if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) continue;
      if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) continue;
      const n1 = board[r1] && board[r1][c1];
      const n2 = board[r2] && board[r2][c2];
      if (n1 && n2 && n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) return true;
    }
  } catch (e) {}
  return false;
}

// Trigger a boss 'shatter' by consuming the two commons used to hit it and applying damage
function shatterBossAtMarker(bossMarker) {
  if (!bossMarker) return;
  try {
    const r = bossMarker.r, c = bossMarker.c;
    const dirs = [ [-1,0], [1,0], [0,-1], [0,1] ];
    // find the first qualifying direction
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc;
      const r2 = r + dr * 2, c2 = c + dc * 2;
      if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) continue;
      if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) continue;
      const n1 = board[r1] && board[r1][c1];
      const n2 = board[r2] && board[r2][c2];
      if (!n1 || !n2) continue;
      if (n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) {
        // remove these two commons
        const removals = [ { r: r1, c: c1, cell: n1 }, { r: r2, c: c2, cell: n2 } ];
        for (const p of removals) {
          // award shards for commons normally
          try { totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1; } catch (e) {}
          try { const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 }; awardShards(p.cell.type || 'Unknown', shardMap[p.cell.rarity] || 0); } catch (e) {}
          board[p.r][p.c] = null;
        }
        // notify boss helper of shatter (so combos on boss are registered via existing pipeline)
        try { const posCells = removals.map(p => ({ r: p.r, c: p.c, cell: p.cell })); bossHelper.onShatterResolved && bossHelper.onShatterResolved(posCells); } catch (e) {}
  // run collapse/cascade (damage is handled by bossHelper.onShatterResolved)
  try { cascadeResolve(); } catch (e) {}
        return;
      }
    }
  } catch (e) {}
}

function removeCells(cells, awardShards = true) {
  // collect mines removed so we can explode them after removals
  const minesRemoved = [];
  for (const s of cells) {
    if (!s) continue;
    if (s.inv) {
      // remove from inventory slot (unconditionally clear)
      inventory[s.inv] = null;
      continue;
    }
    if (typeof s.r === 'number' && typeof s.c === 'number') {
      // if we're removing a mine tile, queue explosion for that cell
      try {
        const cell = board[s.r][s.c];
        if (cell && cell.templateId === '__MINE__') {
          minesRemoved.push({ r: s.r, c: s.c });
        } else if (cell) {
          // record shatter and shard counts for removals triggered by shatters/explosions
          try {
            if (awardShards) {
              totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1;
              const shType = cell.type || 'Unknown';
              const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
              const shards = shardMap[cell.rarity] || 0;
              awardShards(shType, shards);
            }
          } catch (e) {}
        }
      } catch (e) {}
  board[s.r][s.c] = null;
  try { moveOccurredThisTurn = true; } catch (e) {}
      continue;
    }
    // if selection entry references a cell object that matches an inventory slot, clear that slot
    if (s.cell && s.cell.instanceId) {
      for (const k of Object.keys(inventory)) {
        const invCell = inventory[k];
        if (invCell && invCell.instanceId === s.cell.instanceId) {
          inventory[k] = null;
        }
      }
    }
  }
  // schedule immediate explosions for removed mines
  if (minesRemoved.length > 0) {
    for (const m of minesRemoved) {
      try { pendingExplosions.push(m); } catch (e) {}
    }
  }
}

function placeNewAt(selEntry, newMod) {
  if (!selEntry) return;
  // mark that a player-induced placement occurred
  try { moveOccurredThisTurn = true; } catch (e) {}
  if (selEntry.inv) {
    inventory[selEntry.inv] = newMod;
  } else if (typeof selEntry.r === 'number' && typeof selEntry.c === 'number') {
    board[selEntry.r][selEntry.c] = newMod;
    // Immediately update the DOM for this cell if board is rendered now, to avoid stale visuals.
    try {
      const boardDiv = document.getElementById('game-board');
      if (boardDiv) {
        const idx = selEntry.r * BOARD_COLS + selEntry.c;
        const el = boardDiv.children[idx];
        if (el) {
          // clear existing content and append refreshed shape
          while (el.firstChild) el.removeChild(el.firstChild);
          const SHAPE_SIZE = 60;
          el.appendChild(buildShape(newMod, SHAPE_SIZE));
        }
      }
    } catch (e) {}
  }
}

function evaluateMergeAttempt() {
  // Defensive wrapper: log selection state and catch exceptions so a silent error doesn't block UX
  try {
    try { appendToDebug && appendToDebug('evaluateMergeAttempt called; selected=' + JSON.stringify((selected||[]).map(s => ({ r: s && s.r, c: s && s.c, inv: s && s.inv, templateId: s && s.cell && s.cell.templateId, rarity: s && s.cell && s.cell.rarity })))); } catch (e) {}
    try { console.debug && console.debug('evaluateMergeAttempt', selected); } catch (e) {}
    // Determine selection composition
    // Normalize selection entries to use live board/inventory cell references so
    // preview (which reads live board/inventory) and evaluator match.
    const selOrig = selected.slice();
    const sel = selOrig.map(s => {
      if (!s) return s;
      if (s.inv) return { ...s, cell: inventory[s.inv] || s.cell };
      if (typeof s.r === 'number' && typeof s.c === 'number') return { ...s, cell: (board[s.r] && board[s.r][s.c]) || s.cell };
      return { ...s, cell: s.cell };
    });
    const base = sel[0];
    // Prevent merges if any selected cell is disabled due to proximity to a mine
    try {
      for (const s of sel) {
        if (s && s.cell && isDisabledByMine(s.cell)) {
          appendToDebug && appendToDebug('Merge blocked: one or more tiles are disabled by a nearby mine');
          selected = [];
          renderBoard();
          return;
        }
      }
    } catch (e) {}
  // Helper: clear any inventory slots referenced by the selection (except keepInvKey if provided)
  function purgeInventoryUsed(selection, keepInvKey = null) {
    if (!selection || !Array.isArray(selection)) return;
    for (const s of selection) {
      if (!s) continue;
      if (s.inv && s.inv !== keepInvKey) {
        inventory[s.inv] = null;
      }
      // if selection references an inventory cell object rather than inv key, also clear matching inventory slots
      if (s.cell && s.cell.instanceId) {
        for (const k of Object.keys(inventory)) {
          const invCell = inventory[k];
          if (invCell && invCell.instanceId === s.cell.instanceId && k !== keepInvKey) inventory[k] = null;
        }
      }
    }
  }
  // quick fail: commons cannot be fodder (we treat 'Common' rarity as fodder-ineligible per spec)
  for (let i = 1; i < sel.length; i++) {
    if (sel[i].cell.rarity === 'Common') {
      // cancel selection
      selected = [];
      renderBoard();
      return;
    }
  }

  // Implement the core sequence checks (we check a few allowed combinations)
  // 3 of same Rare -> Rare+
  if (sel.length === 3 && sel.every(s => s.cell.rarity === 'Rare') && sel.every(s => sameTemplate(s, sel[0]))) {
    // produce Rare+ at base
  const newMod = createModuleInstance(base.cell.templateId, 'Rare', true);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  // remove other two (and clear base if base was a fodder target in board)
  removeCells(sel.slice(1), false);
  purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    // leave merge-selection mode and clear candidate highlights so UI resets
    mergeSelecting = false;
    candidateHighlights.clear();
  renderInventory();
  renderBoard();
  cascadeResolve();
    return;
  }

  // 1 Rare+ + 2 Rare (fodder) -> Epic
  // Accept either: two non-plus Rares of the same template OR two Rare+ fodder of the same module type
  if (sel.length === 3 && base.cell.rarity === 'Rare' && base.cell.plus) {
    const fodder = sel.slice(1);
  // validate fodder: only two Rare+ items matching the base module type are allowed
  const fodderPlusSameType = fodder.every(s => s && s.cell && s.cell.rarity === 'Rare' && s.cell.plus && s.cell.type === base.cell.type);
  if (fodderPlusSameType) {
      const newMod = createModuleInstance(base.cell.templateId, 'Epic', false);
    placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
    removeCells(fodder, false);
      purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
      selected = [];
      mergeSelecting = false;
      candidateHighlights.clear();
      renderInventory();
      renderBoard();
      cascadeResolve();
      return;
    }
    // otherwise invalid
    appendToDebug && appendToDebug('Rare+ merge blocked: fodder must be two non-plus Rares of the same template or two Rare+ of same module type');
    selected = [];
    renderBoard();
    return;
  }

  // 2 of same Epic -> Epic+
  if (sel.length === 2 && sel.every(s => s.cell.rarity === 'Epic') && sel.every(s => sameTemplate(s, sel[0]))) {
  try { appendToDebug && appendToDebug('evaluateMergeAttempt -> creating Epic+ from two Epics: baseTemplate=' + (base && base.cell && base.cell.templateId)); } catch (e) {}
  const newMod = createModuleInstance(base.cell.templateId, 'Epic', true);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells(sel.slice(1), false);
  purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    mergeSelecting = false;
    candidateHighlights.clear();
  renderInventory();
  renderBoard();
  cascadeResolve();
    return;
  }

  // 1 Epic+ + 2 Epic+ -> Legendary (fodder must be Epic+; template may differ)
  if (sel.length === 3 && base.cell.rarity === 'Epic' && base.cell.plus && sel.slice(1).every(s => s.cell.rarity === 'Epic' && s.cell.plus)) {
    // ensure all fodder entries are the same module type as the base
    if (!sel.slice(1).every(s => s.cell.type === base.cell.type)) {
      appendToDebug && appendToDebug('Epic+ merge blocked: fodder must be same module type as base');
      selected = [];
      renderBoard();
      return;
    }
    const newMod = createModuleInstance(base.cell.templateId, 'Legendary', false);
      placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
    removeCells(sel.slice(1), false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    mergeSelecting = false;
    candidateHighlights.clear();
    renderInventory();
    renderBoard();
    cascadeResolve();
    return;
  }

  // 1 Legendary + 1 Epic+ -> Legendary+ (base must be Legendary)
  if (sel.length === 2 && base.cell.rarity === 'Legendary' && sel[1].cell.rarity === 'Epic' && sel[1].cell.plus) {
    // require same templateId (same named module)
    if (sel[1].cell.templateId !== base.cell.templateId) {
      appendToDebug && appendToDebug('Legendary merge blocked: Epic+ fodder must be the same named module as base');
      selected = [];
      renderBoard();
      return;
    }
    const newMod = createModuleInstance(base.cell.templateId, 'Legendary', true);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells([sel[1]], false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    mergeSelecting = false;
    candidateHighlights.clear();
    renderInventory();
    renderBoard();
    cascadeResolve();
    return;
  }

  // Debug: log Mythic merge attempts to help diagnose blocked merges
  if (base && base.cell && base.cell.rarity === 'Mythic' && sel.length === 2) {
    try {
      const f = sel[1] && sel[1].cell ? sel[1].cell : null;
      appendToDebug && appendToDebug('DEBUG Mythic merge attempt: base=' + JSON.stringify({ rarity: base.cell.rarity, plus: !!base.cell.plus, type: base.cell.type, templateId: base.cell.templateId }) + ' fodder=' + JSON.stringify(f ? { rarity: f.rarity, plus: !!f.plus, type: f.type, templateId: f.templateId } : null));
    } catch (e) { }
  }

  // 1 Legendary+ + 1 Legendary+ -> Mythic (both must be Legendary+)
  if (sel.length === 2 && base.cell.rarity === 'Legendary' && base.cell.plus && sel[1].cell.rarity === 'Legendary' && sel[1].cell.plus) {
    if (sel[1].cell.type !== base.cell.type) {
      appendToDebug && appendToDebug('Legendary+ merge blocked: fodder must be same module type as base');
      selected = [];
      renderBoard();
      return;
    }
    const newMod = createModuleInstance(base.cell.templateId, 'Mythic', false);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells([sel[1]], false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    mergeSelecting = false;
    candidateHighlights.clear();
    renderInventory(); renderBoard(); cascadeResolve();
    return;
  }

  // 1 Mythic + 1 Legendary+ -> Mythic+ (fodder must be Legendary+)
  if (sel.length === 2 && base.cell.rarity === 'Mythic' && !base.cell.plus && sel[1].cell.rarity === 'Legendary' && sel[1].cell.plus) {
    // allow Legendary+ fodder from any template as long as module type matches
    if (sel[1].cell.type !== base.cell.type) {
      appendToDebug && appendToDebug('Mythic merge blocked: Legendary+ fodder must match base module type');
      selected = [];
      renderBoard();
      return;
    }
    const newMod = createModuleInstance(base.cell.templateId, 'Mythic', true);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells([sel[1]], false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    selected = [];
    mergeSelecting = false;
    candidateHighlights.clear();
    renderInventory(); renderBoard(); cascadeResolve();
    return;
  }

  // 1 Mythic+ + 2 Epic+ -> Ancestral
  if (sel.length === 3 && base.cell.rarity === 'Mythic' && base.cell.plus && sel.slice(1).every(s => s.cell.rarity === 'Epic' && s.cell.plus)) {
    // require Epic+ fodder to match base module type (templates may differ)
    if (!sel.slice(1).every(s => s.cell.type === base.cell.type)) {
      appendToDebug && appendToDebug('Mythic+ merge blocked: Epic+ fodder must match base module type');
      selected = [];
      renderBoard();
      return;
    }
    const newMod = createModuleInstance(base.cell.templateId, 'Ancestral', false, 1);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells(sel.slice(1), false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
  selected = [];
  mergeSelecting = false;
  candidateHighlights.clear();
  renderInventory(); renderBoard(); cascadeResolve();
    return;
  }

  // 1 Ancestral + 2 Epic+ -> Ancestral star upgrade (increase stars up to 5)
  if (sel.length === 3 && base.cell.rarity === 'Ancestral' && sel.slice(1).every(s => s.cell.rarity === 'Epic' && s.cell.plus) && sel.slice(1).every(s => sameTemplate(s, sel[0]))) {
    const currentStars = base.cell.stars || 0;
    const newStars = Math.min(5, currentStars + 1);
    const newMod = createModuleInstance(base.cell.templateId, 'Ancestral', false, newStars);
  placeNewAt(base, newMod);
  try { totalMerges = (typeof totalMerges === 'number') ? totalMerges + 1 : 1; } catch (e) {}
  removeCells(sel.slice(1), false);
    purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
    // if reached 5 stars, record completion
    if (newStars === 5) completed[base.cell.templateId] = 5;
  selected = [];
  mergeSelecting = false;
  candidateHighlights.clear();
  renderInventory(); renderBoard(); cascadeResolve();
    return;
  }

  // Additional steps (Mythic, Mythic+, Ancestral, Ancestral stars)
  // For brevity implement a generic progression rule: if base is Mythic+ and we have 2 Epic+ anywhere -> create Ancestral
  if (sel.length >= 3 && base.cell.rarity === 'Mythic+' ) {
    // This branch is placeholder — full sequence is similar pattern
  }

    // If selection doesn't match any known merge pattern and reaches 4 selections, reset
    if (selected.length >= 4) {
      selected = [];
      mergeSelecting = false;
      candidateHighlights.clear();
      renderBoard();
    }
  } catch (err) {
    try { appendToDebug && appendToDebug('evaluateMergeAttempt error: ' + (err && err.stack ? err.stack : String(err))); } catch (e) {}
    try { console.error && console.error('evaluateMergeAttempt error', err); } catch (e) {}
    // best-effort recovery: clear selection and UI so user can continue
    try { selected = []; mergeSelecting = false; candidateHighlights && candidateHighlights.clear(); renderBoard(); } catch (e) {}
  }
}

// Inventory placement
function placeFromInventory(r, c) {
  // place current selected inventory into a board location if possible
  if (!placingFromInventory) return false;
  const type = placingFromInventory;
  if (board[r][c]) return false;
  board[r][c] = inventory[type];
  inventory[type] = null;
  placingFromInventory = null;
  renderBoard();
  renderInventory();
  return true;
}

// Shattering with cascade: removes a connected group of the same template (if eligible),
// collapses columns, refills, and then iteratively auto-shatters any new groups of 3+
// of eligible rarities (Common/Rare/Epic).
function shatterAt(r, c) {
  const cell = board[r] && board[r][c];
  if (!cell) return;
  // only allow manual shatter for cells that pass canBeShattered
  if (!canBeShattered(cell)) return;

  // For Commons group by type; for Rare/Epic group by template. Only include cells that can be shattered.
  const toRemove = floodFillGroup(r, c, (n) => canBeShattered(n));
  if (toRemove.length === 0) return;
  // enforce straight-3 rule for Commons: only remove if group contains a straight run
  const startCell = board[r] && board[r][c];
  if (startCell && startCell.rarity === 'Common') {
    if (!hasStraightTriple(toRemove)) return;
  }
  // remove only positions that form straight runs
  let toRemoveStraight = toRemove;
  if (startCell && startCell.rarity === 'Common') {
    toRemoveStraight = extractStraightRunPositions(toRemove);
  }

  // Build a set of positions to remove. If a removed position is a mine, include the
  // entire row or column that was used to destroy it (depending on whether the run
  // that contained the mine was horizontal or vertical).
  try { appendToDebug && appendToDebug(`shatterAt start: toRemove=${JSON.stringify(toRemove)}`); } catch (e) {}
  try { console.debug && console.debug('shatterAt toRemove', toRemove); } catch (e) {}
  const removeMap = new Map();
  for (const p of toRemoveStraight) {
    removeMap.set(p.r + ',' + p.c, { r: p.r, c: p.c });
  }

  try { appendToDebug && appendToDebug(`shatterAt straight positions=${JSON.stringify(toRemoveStraight)}`); } catch (e) {}
  try { console.debug && console.debug('shatterAt straight', toRemoveStraight); } catch (e) {}
  // For any mine in the straight run, detect orientation from the straight-run positions
  // and add all cells in that row or column to the removal set.
  for (const p of toRemoveStraight) {
    const cur = board[p.r] && board[p.r][p.c];
    if (!cur) continue;
    if (cur.templateId === '__MINE__') {
      // Find the specific direction(s) that made the mine shatterable (adjacent + behind commons)
      try {
        const dirs = [ [-1,0], [1,0], [0,-1], [0,1] ];
        for (const [dr, dc] of dirs) {
          const r1 = p.r + dr, c1 = p.c + dc;
          const r2 = p.r + dr * 2, c2 = p.c + dc * 2;
          if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) continue;
          if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) continue;
          const n1 = board[r1] && board[r1][c1];
          const n2 = board[r2] && board[r2][c2];
          if (n1 && n2 && n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) {
            // include the commons used in the combo
            removeMap.set(r1 + ',' + c1, { r: r1, c: c1 });
            removeMap.set(r2 + ',' + c2, { r: r2, c: c2 });
            try { appendToDebug && appendToDebug(`mine at ${p.r},${p.c} -> include combo commons ${r1},${c1} and ${r2},${c2}`); } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }

  // Now perform removals once over the aggregated set so we count shatters/shards exactly once
  const removals = Array.from(removeMap.values());
  try { appendToDebug && appendToDebug(`shatterAt aggregated removals=${JSON.stringify(removals)}`); } catch (e) {}
  try { console.debug && console.debug('shatterAt removals', removals); } catch (e) {}
  for (const p of removals) {
    const rem = board[p.r] && board[p.r][p.c];
    if (rem) {
      // Mines do not award score/shards themselves; surrounding modules do
      if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
        try { totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1; } catch (e) {}
        try {
          const shType = rem.type || 'Unknown';
          const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
          const shards = shardMap[rem.rarity] || 0;
          // awardShards will update `shardsEarned`, UI and keep `score` in sync
          awardShards(shType, shards);
        } catch (e) {}
      }

      // If we removed a mine tile, schedule explosion processing for its coords
      try {
        if (rem.templateId === '__MINE__') {
          try { pendingExplosions.push({ r: p.r, c: p.c }); } catch (e) {}
        }
      } catch (e) {}
    }
    board[p.r][p.c] = null;
  }

  // collapse + refill, then resume cascade (but cascade auto-shattering will only target Commons)
  cascadeResolve();
}

// Flood-fill orthogonally for a group. For Common rarity we group by type (so different commons
// of the same type count together); for other rarities we group by templateId.
function floodFillGroup(sr, sc, includePredicate = null) {
  const startCell = board[sr] && board[sr][sc];
  if (!startCell) return [];
  const groupingIsType = startCell.rarity === 'Common';
  const seen = new Set();
  const stack = [{ r: sr, c: sc }];
  const out = [];
  while (stack.length) {
    const { r, c } = stack.pop();
  if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) continue;
    const key = r + ',' + c;
    if (seen.has(key)) continue;
    seen.add(key);
    const cell = board[r][c];
    if (!cell) continue;
    if (includePredicate && !includePredicate(cell)) continue;
    if (groupingIsType) {
      if (!(cell.rarity === 'Common' && cell.type === startCell.type)) continue;
    } else {
      if (cell.templateId !== startCell.templateId) continue;
    }
    out.push({ r, c });
    stack.push({ r: r - 1, c });
    stack.push({ r: r + 1, c });
    stack.push({ r, c: c - 1 });
    stack.push({ r, c: c + 1 });
  }
  return out;
}

// Collapse columns (gravity) so non-null fall to bottom; maintain board as [r][c]
function collapseColumns() {
  for (let c = 0; c < BOARD_COLS; c++) {
    const col = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (board[r][c]) col.push(board[r][c]);
    }
    // fill column bottom-up
    for (let r = BOARD_ROWS - 1, i = 0; r >= 0; r--, i++) {
      board[r][c] = col[i] || null;
    }
  }
}

// Refill empty cells at top with new drops
function refillBoard() {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!board[r][c]) board[r][c] = makeDrop();
    }
  }
}

// Find all connected groups where all members satisfy eligibility predicate
function findAllGroups(predicate) {
  const seen = new Set();
  const groups = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const key = r + ',' + c;
      if (seen.has(key)) continue;
      const cell = board[r][c];
      if (!cell) continue;
      if (!predicate(cell)) continue;
      // Determine grouping mode for this starting cell
      const groupingIsType = cell.rarity === 'Common';
      // flood from here using grouping rules
      const stack = [{ r, c }];
      const group = [];
      while (stack.length) {
        const p = stack.pop();
        const k = p.r + ',' + p.c;
        if (seen.has(k)) continue;
        const cur = board[p.r] && board[p.r][p.c];
        if (!cur) continue;
        if (!predicate(cur)) continue;
        if (groupingIsType) {
          if (!(cur.rarity === 'Common' && cur.type === cell.type)) continue;
        } else {
          if (cur.templateId !== cell.templateId) continue;
        }
        seen.add(k);
        group.push(p);
        stack.push({ r: p.r - 1, c: p.c });
        stack.push({ r: p.r + 1, c: p.c });
        stack.push({ r: p.r, c: p.c - 1 });
        stack.push({ r: p.r, c: p.c + 1 });
      }
      if (group.length) groups.push(group);
    }
  }
  return groups;
}

// Helper: return true if a group (array of {r,c}) contains a straight run of >=3
function hasStraightTriple(group) {
  if (!group || group.length < 3) return false;
  const byRow = {};
  const byCol = {};
  for (const p of group) {
    byRow[p.r] = byRow[p.r] || new Set();
    byRow[p.r].add(p.c);
    byCol[p.c] = byCol[p.c] || new Set();
    byCol[p.c].add(p.r);
  }
  for (const rKey in byRow) {
    const cols = Array.from(byRow[rKey]).map(Number).sort((a,b)=>a-b);
    let run = 1;
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] === cols[i-1] + 1) { run++; if (run >= 3) return true; } else run = 1;
    }
  }
  for (const cKey in byCol) {
    const rows = Array.from(byCol[cKey]).map(Number).sort((a,b)=>a-b);
    let run = 1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] === rows[i-1] + 1) { run++; if (run >= 3) return true; } else run = 1;
    }
  }
  return false;
}

// Given a connected group (array of {r,c}), return only the positions that are part
// of any horizontal or vertical contiguous run of length >= 3.
function extractStraightRunPositions(group) {
  const outMap = new Map();
  if (!group || group.length === 0) return [];
  const byRow = {};
  const byCol = {};
  for (const p of group) {
    byRow[p.r] = byRow[p.r] || new Set();
    byRow[p.r].add(p.c);
    byCol[p.c] = byCol[p.c] || new Set();
    byCol[p.c].add(p.r);
  }
  // horizontal runs
  for (const rKey in byRow) {
    const cols = Array.from(byRow[rKey]).map(Number).sort((a,b)=>a-b);
    let runStart = cols[0];
    let run = [cols[0]];
    for (let i = 1; i <= cols.length; i++) {
      const cur = cols[i];
      const prev = cols[i-1];
      if (cur === prev + 1) {
        run.push(cur);
      } else {
        if (run.length >= 3) {
          for (const c of run) outMap.set(rKey + ',' + c, { r: Number(rKey), c });
        }
        run = cur !== undefined ? [cur] : [];
      }
    }
  }
  // vertical runs
  for (const cKey in byCol) {
    const rows = Array.from(byCol[cKey]).map(Number).sort((a,b)=>a-b);
    let run = [rows[0]];
    for (let i = 1; i <= rows.length; i++) {
      const cur = rows[i];
      const prev = rows[i-1];
      if (cur === prev + 1) {
        run.push(cur);
      } else {
        if (run.length >= 3) {
          for (const r of run) outMap.set(r + ',' + cKey, { r, c: Number(cKey) });
        }
        run = cur !== undefined ? [cur] : [];
      }
    }
  }
  return Array.from(outMap.values());
}

// Check if any allowed adjacency swap (swaps allowed only if at least one tile is Common)
// produces a Common auto-shatter group (length >= 3). Returns true if a valid move exists.
function checkForValidMoves() {
  // helper to deep-clone minimal cell info
  const clone = () => board.map(row => row.map(cell => cell ? ({ ...cell }) : null));
  const isCommonGroupPresent = (b) => {
    // local version of findAllGroups for Commons only
    const seen = new Set();
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const key = r + ',' + c;
        if (seen.has(key)) continue;
        const cell = b[r][c];
        if (!cell || cell.rarity !== 'Common') continue;
        // flood
        const stack = [{ r, c }];
        const group = [];
        while (stack.length) {
          const p = stack.pop();
          const k = p.r + ',' + p.c;
          if (seen.has(k)) continue;
          if (p.r < 0 || p.r >= BOARD_ROWS || p.c < 0 || p.c >= BOARD_COLS) continue;
          const cur = b[p.r] && b[p.r][p.c];
          if (!cur || cur.rarity !== 'Common') continue;
          if (cur.type !== cell.type) continue;
          seen.add(k);
          group.push(p);
          stack.push({ r: p.r - 1, c: p.c });
          stack.push({ r: p.r + 1, c: p.c });
          stack.push({ r: p.r, c: p.c - 1 });
          stack.push({ r: p.r, c: p.c + 1 });
        }
      if (group.length >= 3 && hasStraightTriple(group)) return true;
      }
    }
    return false;
  };

  // iterate over possible adjacency swaps (right and down to avoid duplicates)
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const dirs = [[0,1],[1,0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS) continue;
        const a = board[r][c];
        const b = board[nr][nc];
        // at least one must be Common to allow swap
        const canSwap = (a && a.rarity === 'Common') || (b && b.rarity === 'Common');
        if (!canSwap) continue;
        // simulate swap
        const sim = clone();
        sim[r][c] = b ? ({ ...b }) : null;
        sim[nr][nc] = a ? ({ ...a }) : null;
        // check for any common group >=3
        if (isCommonGroupPresent(sim)) return true;
      }
    }
  }
  return false;
}

// Find all valid adjacency swaps (that respect Common-swap rule) and return as list of {r,c,nr,nc}
function findValidMovesList() {
  const moves = [];

  // Build a safe BOARD_ROWS x BOARD_COLS simulation grid (guards against malformed saved state)
  const makeSim = () => {
    const sim = new Array(BOARD_ROWS);
    for (let rr = 0; rr < BOARD_ROWS; rr++) {
      sim[rr] = new Array(BOARD_COLS);
      for (let cc = 0; cc < BOARD_COLS; cc++) {
        sim[rr][cc] = (board && board[rr] && board[rr][cc]) ? ({ ...board[rr][cc] }) : null;
      }
    }
    return sim;
  };

  const createsCommonGroup = (sim) => {
    const seen = new Set();
    const hasStraightTriple = (group) => {
      // check horizontal runs
      const byRow = {};
      const byCol = {};
      for (const p of group) {
        byRow[p.r] = byRow[p.r] || new Set();
        byRow[p.r].add(p.c);
        byCol[p.c] = byCol[p.c] || new Set();
        byCol[p.c].add(p.r);
      }
      for (const rKey in byRow) {
        const cols = Array.from(byRow[rKey]).map(Number).sort((a,b)=>a-b);
        let run = 1;
        for (let i = 1; i < cols.length; i++) {
          if (cols[i] === cols[i-1] + 1) { run++; if (run >= 3) return true; } else run = 1;
        }
      }
      for (const cKey in byCol) {
        const rows = Array.from(byCol[cKey]).map(Number).sort((a,b)=>a-b);
        let run = 1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] === rows[i-1] + 1) { run++; if (run >= 3) return true; } else run = 1;
        }
      }
      return false;
    };

    for (let rr = 0; rr < BOARD_ROWS; rr++) {
      for (let cc = 0; cc < BOARD_COLS; cc++) {
        const key0 = rr + ',' + cc;
        if (seen.has(key0)) continue;
        const cell = (sim[rr] && sim[rr][cc]) ? sim[rr][cc] : null;
        if (!cell || cell.rarity !== 'Common') continue;
        // flood-fill orthogonally collecting same-type Commons
        const stack = [{ r: rr, c: cc }];
        const group = [];
        while (stack.length) {
          const p = stack.pop();
          const k = p.r + ',' + p.c;
          if (seen.has(k)) continue;
          if (p.r < 0 || p.r >= BOARD_ROWS || p.c < 0 || p.c >= BOARD_COLS) continue;
          const cur = (sim[p.r] && sim[p.r][p.c]) ? sim[p.r][p.c] : null;
          if (!cur || cur.rarity !== 'Common' || cur.type !== cell.type) continue;
          seen.add(k);
          group.push({ r: p.r, c: p.c });
          stack.push({ r: p.r - 1, c: p.c });
          stack.push({ r: p.r + 1, c: p.c });
          stack.push({ r: p.r, c: p.c - 1 });
          stack.push({ r: p.r, c: p.c + 1 });
        }
        if (group.length >= 3 && hasStraightTriple(group)) return true;
      }
    }
    return false;
  };

  // Iterate adjacency swaps (right and down to avoid duplicates)
  const dirs = [[0,1],[1,0]];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS) continue;
        const a = board && board[r] ? board[r][c] : null;
        const b = board && board[nr] ? board[nr][nc] : null;
        if (!a || !b) continue;
        // swap allowed only if at least one is Common
        const canSwap = (a.rarity === 'Common') || (b.rarity === 'Common');
        if (!canSwap) continue;
        const sim = makeSim();
        sim[r][c] = b ? ({ ...b }) : null;
        sim[nr][nc] = a ? ({ ...a }) : null;
        if (createsCommonGroup(sim)) moves.push({ r, c, nr, nc });
      }
    }
  }

  try { console.debug('findValidMovesList found moves:', moves.length, moves.slice(0,6)); } catch (e) {}
  try { appendToDebug && appendToDebug('findValidMovesList found moves: ' + moves.length); } catch (e) {}
  return moves;
}

function pickRandomMoveHint() {
  const moves = findValidMovesList();
  try { console.debug('pickRandomMoveHint moves available:', moves ? moves.length : 0); } catch(e) {}
  try { appendToDebug && appendToDebug('pickRandomMoveHint moves: ' + (moves ? moves.length : 0)); } catch (e) {}
  if (!moves || moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function onInactivityTimeout() {
  // clear previous hint
  hintMove = null;
  const moves = findValidMovesList();
  try { console.debug('onInactivityTimeout moves count:', moves ? moves.length : 0); } catch(e) {}
  try { appendToDebug && appendToDebug('onInactivityTimeout moves: ' + (moves ? moves.length : 0)); } catch (e) {}
  if (!moves || moves.length === 0) {
    // game over
    setTimeout(() => {
      // Ask the player before restarting to avoid unexpected auto-shuffles
      const restart = confirm('No valid moves left — restart the board?');
      if (restart) {
        createBoard(); renderBoard(); renderInventory(); cascadeResolve();
      }
    }, 50);
    return;
  }
  // pick a random move and highlight both cells
  hintMove = pickRandomMoveHint();
  try { appendToDebug && appendToDebug('onInactivityTimeout chose move: ' + JSON.stringify(hintMove)); } catch (e) {}
  renderBoard();
}

function resetInactivity() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  inactivityTimer = setTimeout(onInactivityTimeout, INACTIVITY_TIMEOUT_MS);
}

// Reset inactivity on common user interactions
['click','pointerdown','contextmenu','keydown'].forEach(evt => window.addEventListener(evt, resetInactivity, { capture: true }));

// Cascade resolver: collapse, refill, then auto-shatter any groups of 3+ eligible modules
// Basic sleep (kept for compatibility)
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
// Global animation speed multiplier (1 = normal). Controlled by UI slider.
let animSpeed = 1.0;
// When true, skip image assets and render vector shapes only (helps measure perf impact)
let useVectorOnly = false;
// sleep that respects the global animation speed (divides duration by animSpeed)
function sleepAnimated(ms) { const t = Math.max(0, Math.round(ms / (animSpeed || 1))); return new Promise(res => setTimeout(res, t)); }

async function cascadeResolve() {
  if (animating) return;
  animating = true;
  let loop = 0;
  try {
    while (true) {
      loop++;
      // Stepwise gravity: move single-step until stable so players see tiles falling
      let moved;
      do {
        moved = false;
        for (let c = 0; c < BOARD_COLS; c++) {
          for (let r = BOARD_ROWS - 1; r > 0; r--) {
            if (!board[r][c] && board[r - 1][c]) {
        board[r][c] = board[r - 1][c];
        // mark as falling for animation
        if (board[r][c]) board[r][c].falling = true;
        // If the boss was sitting on the tile that just moved down, move the boss with it
        try {
          if (window.__BOSS_MARKER && window.__BOSS_MARKER.r === (r - 1) && window.__BOSS_MARKER.c === c) {
            window.__BOSS_MARKER.r = r;
            try { bossHelper.renderOverlay && bossHelper.renderOverlay(); } catch (e) {}
          }
        } catch (e) {}
        board[r - 1][c] = null;
              moved = true;
            }
          }
        }
        if (moved) {
          renderBoard();
          await sleepAnimated(80);
  // clear temporary falling flags after the animation step
  for (let rr = 0; rr < BOARD_ROWS; rr++) for (let cc = 0; cc < BOARD_COLS; cc++) if (board[rr][cc] && board[rr][cc].falling) delete board[rr][cc].falling;
              // If boss exists and the tile(s) underneath it are empty, drop the boss marker down to match gravity
              try {
                if (window.__BOSS_MARKER) {
                  let br = window.__BOSS_MARKER.r, bc = window.__BOSS_MARKER.c;
                  // only adjust if marker is within bounds
                  if (typeof br === 'number' && typeof bc === 'number') {
                    // while the cell below is empty and we're not at the bottom, move the boss down
                    while (br + 1 < BOARD_ROWS && (!board[br + 1] || !board[br + 1][bc])) {
                      br++;
                    }
                    if (br !== window.__BOSS_MARKER.r) {
                      window.__BOSS_MARKER.r = br;
                      try { bossHelper.renderOverlay && bossHelper.renderOverlay(); } catch (e) {}
                    }
                  }
                }
              } catch (e) {}
        }
      } while (moved);

      // Refill empty cells from the top gradually
      let filled = false;
      for (let c = 0; c < BOARD_COLS; c++) {
        for (let r = 0; r < BOARD_ROWS; r++) {
          if (!board[r][c]) {
            // create a new drop and possibly convert it into a mine based on configured percent chance
            let newDrop = makeDrop();
            try {
              const pct = Math.max(0, parseFloat(MINE_SPAWN_PERCENT || 0));
              if (pct > 0 && Math.random() * 100 < pct) {
                newDrop = createMineInstance();
                appendToDebug && appendToDebug('Mine spawned (percent ' + pct + '%)');
              }
            } catch (e) {}
            board[r][c] = newDrop;
            if (board[r][c]) board[r][c].spawning = true;
            filled = true;
            // Let boss helper consider spawning at this new tile
            try { bossHelper.spawnIfEligible && bossHelper.spawnIfEligible(r, c); } catch (e) {}
          }
        }
      }
  if (filled) {
  renderBoard();
  await sleepAnimated(120);
  // clear spawning flags
  for (let rr = 0; rr < BOARD_ROWS; rr++) for (let cc = 0; cc < BOARD_COLS; cc++) if (board[rr][cc] && board[rr][cc].spawning) delete board[rr][cc].spawning;
      }

  // detect groups to clear (auto-shatter only for Commons)
  // detect groups to clear: always include Commons; include plain Rares only if autoShatterRares is enabled; Epics remain shatterable only by canBeShattered (manual or via full setting)
  const groups = findAllGroups((cell) => {
    if (!cell) return false;
    if (cell.rarity === 'Common') return true;
    if (cell.rarity === 'Rare' && !cell.plus) return !!autoShatterRares;
    // don't auto-shatter Rare+ or higher via this checkbox; Epic handling remains per canBeShattered but default auto behavior excludes Epics
    return false;
  });
  // enforce straight-3 for Common groups; Rare groups still follow length>=3 and autoShatterRares
  const toShatterGroups = groups.filter(g => g.length >= 3 && hasStraightTriple(g));
      if (toShatterGroups.length === 0) break;

      // Mark clearing visuals only for straight-run positions inside each group
      const allPositionsToRemove = [];
      for (const g of toShatterGroups) {
        const straight = extractStraightRunPositions(g);
        for (const p of straight) {
          const c = board[p.r][p.c];
          if (c) c.clearing = true;
          allPositionsToRemove.push(p);
        }
      }
  console.debug('Auto-shatter will remove groups:', toShatterGroups.map(g => ({ len: g.length, coords: g })));
  renderBoard();
      await sleepAnimated(160);

      // Remove only straight-run positions and award score
      const posCells = allPositionsToRemove.map(p => ({ r: p.r, c: p.c, cell: board[p.r] && board[p.r][p.c] }));
      for (const pc of posCells) {
        const rem = pc.cell;
        if (rem) {
          try { totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1; } catch (e) {}
          try {
            const shType = rem.type || 'Unknown';
            const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
            const shards = shardMap[rem.rarity] || 0;
            awardShards(shType, shards);
          } catch (e) {}
        }
        board[pc.r][pc.c] = null;
      }
      // Notify boss helper once about the resolved shatter
      try {
        try { appendToDebug && appendToDebug('Calling bossHelper.onShatterResolved with positions: ' + JSON.stringify(posCells.map(p=>({r:p.r,c:p.c}))) + ' boss=' + JSON.stringify(window.__BOSS_MARKER || null)); } catch (e) {}
        try { console.debug && console.debug('Calling bossHelper.onShatterResolved', { posCells, boss: window.__BOSS_MARKER }); } catch (e) {}
        bossHelper.onShatterResolved && bossHelper.onShatterResolved(posCells);
      } catch (e) {}
  renderBoard();
  await sleepAnimated(120);

      if (loop > 12) break; // safety
    }
  } finally {
  // cleanup clearing flags
  for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) if (board[r][c] && board[r][c].clearing) delete board[r][c].clearing;
    animating = false;
    renderBoard();
    // First: if any pending explosions (e.g., mines removed via shatter), process them
    try {
      if (pendingExplosions.length > 0) {
        const queue = pendingExplosions.splice(0, pendingExplosions.length);
        for (const ex of queue) {
          const { r, c } = ex;
          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              if (board[rr][cc]) board[rr][cc].clearing = true;
            }
          }
          renderBoard();
          await sleepAnimated(180);
          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              try {
                const rem = board[rr] && board[rr][cc];
                  if (rem) {
                  // Don't award shards/score for the mine tile itself; only award for surrounding modules
                  if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                    try { totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1; } catch (e) {}
                    try {
                      const shType = rem.type || 'Unknown';
                      const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
                      const shards = shardMap[rem.rarity] || 0;
                      awardShards(shType, shards);
                    } catch (e) {}
                    try {
                      const singlePos = [{ r: rr, c: cc, cell: rem }];
                      try { appendToDebug && appendToDebug('Calling bossHelper.onShatterResolved (explosion) with: ' + JSON.stringify(singlePos.map(p=>({r:p.r,c:p.c}))) + ' boss=' + JSON.stringify(window.__BOSS_MARKER || null)); } catch (e) {}
                      try { console.debug && console.debug('Calling bossHelper.onShatterResolved (explosion)', { singlePos, boss: window.__BOSS_MARKER }); } catch (e) {}
                      bossHelper.onShatterResolved && bossHelper.onShatterResolved(singlePos);
                    } catch (e) {}
                  }
                  // If a neighbor removed by an explosion is itself a mine, queue it for its own explosion
                  try { if (rem.templateId === '__MINE__') { pendingExplosions.push({ r: rr, c: cc }); } } catch (e) {}
                }
              } catch (e) {}
              board[rr][cc] = null;
            }
          }
          renderBoard();
          await sleepAnimated(120);
        }
        try { cascadeResolve(); } catch (e) {}
        // return early; cascadeResolve will continue the pipeline
        return;
      }
    } catch (e) { console.error('Pending explosion processing failed', e); }

    // After a player-induced move, decrement mine counters and schedule explosions as needed
    try {
      if (moveOccurredThisTurn) {
  moveOccurredThisTurn = false;
  try { moveCount = (typeof moveCount === 'number') ? moveCount + 1 : 1; } catch (e) {}
      try {
        const bossCleared = bossHelper.onMoveAdvance ? bossHelper.onMoveAdvance() : false;
        // If boss removed tiles, run the cascade resolver to refill and continue the pipeline
        if (bossCleared) {
          try { cascadeResolve(); return; } catch (e) { console.error('cascadeResolve after boss clear failed', e); }
        }
      } catch (e) {}
        const toExplode = [];
        for (let r = 0; r < BOARD_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) {
            const cell = board[r][c];
            if (cell && cell.templateId === '__MINE__') {
              cell.movesRemaining = (typeof cell.movesRemaining === 'number') ? cell.movesRemaining - 1 : 9;
              if (cell.movesRemaining <= 0) toExplode.push({ r, c });
            }
          }
        }
        if (toExplode.length > 0) {
          // queue explosions for processing: mark neighbors clearing, show brief animation, then remove
          for (const ex of toExplode) {
            const { r, c } = ex;
            // mark neighbors
            for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
              for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
                if (board[rr][cc]) board[rr][cc].clearing = true;
              }
            }
            renderBoard();
            // wait a short animation then clear
            await sleepAnimated(180);
            for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
              for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
                try {
                  const rem = board[rr] && board[rr][cc];
                  if (rem) {
                    // Only award for non-mine tiles
                    if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                      try { totalShatters = (typeof totalShatters === 'number') ? totalShatters + 1 : 1; } catch (e) {}
                      try {
                        const shType = rem.type || 'Unknown';
                        const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
                        const shards = shardMap[rem.rarity] || 0;
                        awardShards(shType, shards);
                      } catch (e) {}
                    }
                    // chain any mines hit by this explosion
                    try { if (rem.templateId === '__MINE__') pendingExplosions.push({ r: rr, c: cc }); } catch (e) {}
                  }
                } catch (e) {}
                board[rr][cc] = null;
              }
            }
            renderBoard();
            await sleepAnimated(120);
          }
          // After explosions, run cascade to refill resulting holes
          try { cascadeResolve(); } catch (e) {}
        } else {
          // No explosions but mines counters changed; re-render to show updated numbers
          renderBoard();
        }
      }
    } catch (e) { console.error('Mine processing failed', e); }
    // Check for valid moves (only for Commons swap rules). If none, prompt to restart.
    setTimeout(() => {
      try {
        const hasMove = checkForValidMoves();
        if (!hasMove) {
          const again = confirm('No valid moves left — restart the board?');
          if (again) {
            createBoard();
            renderBoard();
            cascadeResolve();
          }
        }
      } catch (e) {
        console.error('move-check failed', e);
      }
  }, 40);
  }
}

// --- Persistence: save/load game state to localStorage so changes persist across reloads ---
const SAVE_KEY = 'merge_game_v1';
function saveGameState() {
  try {
    const state = {
      board,
      inventory,
      commonSwapRemaining,
      shuffleRemaining,
      score,
  completed,
  autoShatterRares,
      badLuckCounter,
  baseRates: BASE_RATES,
  orientation: ORIENTATION,
  boardRows: BOARD_ROWS,
  boardCols: BOARD_COLS,
    chartVisible: CHART_VISIBLE,
    // session stats
    stats: {
      moveCount: typeof moveCount === 'number' ? moveCount : 0,
      totalMerges: typeof totalMerges === 'number' ? totalMerges : 0,
      totalShatters: typeof totalShatters === 'number' ? totalShatters : 0,
      shardsEarned: shardsEarned || {},
    },
    // include UI settings so they persist together with game state
    settings: {
      background: (() => { try { return localStorage.getItem('background') || ''; } catch (e) { return ''; } })(),
      disableAnimations: (() => { try { return localStorage.getItem('disableAnimations') || '0'; } catch (e) { return '0'; } })(),
      devToolsVisible: !!DEV_TOOLS_VISIBLE,
      animSpeed: typeof animSpeed === 'number' ? animSpeed : null,
      useVectorOnly: !!useVectorOnly,
  // persist boss dev inputs so they behave like other UI dev settings
  devBossSpawn: (() => { try { return localStorage.getItem('devBossSpawn') || ''; } catch (e) { return ''; } })(),
  devBossHits: (() => { try { return localStorage.getItem('devBossHits') || ''; } catch (e) { return ''; } })(),
  devBossThreshold: (() => { try { return localStorage.getItem('devBossThreshold') || ''; } catch (e) { return ''; } })(),
  // timer persistence
  gameTimerStart: (() => { try { return localStorage.getItem('gameTimerStart') || null; } catch (e) { return null; } })(),
  gameTimerRunning: (() => { try { return localStorage.getItem('gameTimerRunning') || '0'; } catch (e) { return '0'; } })(),
    },
    };
    try {
      // include boss helper state when available
      try { const bs = bossHelper.getStateForSave && bossHelper.getStateForSave(); if (bs) state.bossState = bs; } catch (e) {}
    } catch (e) {}
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveGameState failed', e);
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
  // basic validation: board should be an array of arrays matching saved dimensions or current BOARD_ROWS/BOARD_COLS
  if (!state || !Array.isArray(state.board)) return false;
  const expectedRows = typeof state.boardRows === 'number' ? state.boardRows : BOARD_ROWS;
  const expectedCols = typeof state.boardCols === 'number' ? state.boardCols : BOARD_COLS;
  if (state.board.length !== expectedRows) return false;
  // ensure nested rows length
  for (let r = 0; r < expectedRows; r++) if (!Array.isArray(state.board[r]) || state.board[r].length !== expectedCols) return false;
  // adopt saved orientation/dimensions if present
  BOARD_ROWS = expectedRows; BOARD_COLS = expectedCols;
  if (state.orientation) ORIENTATION = state.orientation;
  board = state.board;
  CHART_VISIBLE = typeof state.chartVisible === 'boolean' ? state.chartVisible : CHART_VISIBLE;
  inventory = state.inventory || inventory;
    commonSwapRemaining = typeof state.commonSwapRemaining === 'number' ? state.commonSwapRemaining : commonSwapRemaining;
    shuffleRemaining = typeof state.shuffleRemaining === 'number' ? state.shuffleRemaining : shuffleRemaining;
    // Historically `score` was saved directly. New canonical source is shardsEarned (per-type).
    // Derive score from shardsEarned when loading to preserve invariant total = sum(per-type).
    if (state.stats && state.stats.shardsEarned && typeof state.stats.shardsEarned === 'object') {
      shardsEarned = state.stats.shardsEarned;
      try { score = Object.values(shardsEarned || {}).reduce((a,b) => a + (Number(b)||0), 0); } catch (e) { score = 0; }
    } else {
      score = typeof state.score === 'number' ? state.score : score;
    }
    completed = state.completed || completed;
  autoShatterRares = !!state.autoShatterRares;
    badLuckCounter = typeof state.badLuckCounter === 'number' ? state.badLuckCounter : badLuckCounter;
    // restore stats (preserve previously derived shardsEarned if present)
    if (state.stats && typeof state.stats === 'object') {
      moveCount = typeof state.stats.moveCount === 'number' ? state.stats.moveCount : moveCount;
      totalMerges = typeof state.stats.totalMerges === 'number' ? state.stats.totalMerges : totalMerges;
      totalShatters = typeof state.stats.totalShatters === 'number' ? state.stats.totalShatters : totalShatters;
      // shardsEarned already set above if present; otherwise leave as default
    }
    // custom persisted dev values
    if (state.baseRates && typeof state.baseRates === 'object') {
      BASE_RATES.Common = typeof state.baseRates.Common === 'number' ? state.baseRates.Common : BASE_RATES.Common;
      BASE_RATES.Rare = typeof state.baseRates.Rare === 'number' ? state.baseRates.Rare : BASE_RATES.Rare;
      BASE_RATES.Epic = typeof state.baseRates.Epic === 'number' ? state.baseRates.Epic : BASE_RATES.Epic;
    }
  // restore boss helper state if present (write to helper-local key so bossHelper.init() can read it)
  try { if (state.bossState) { try { localStorage.setItem('boss_state_v1', JSON.stringify(state.bossState)); } catch (e) {} } } catch (e) {}
  // dev toggles: free-swap is always enabled by default and no longer persisted
  // restore UI settings if present
    try {
      if (state.settings && typeof state.settings === 'object') {
        const s = state.settings;
        // background
        if (typeof s.background === 'string') {
          try { localStorage.setItem('background', s.background || ''); } catch (e) {}
        }
        // disable animations
        if (typeof s.disableAnimations === 'string' || typeof s.disableAnimations === 'number') {
          try { localStorage.setItem('disableAnimations', String(s.disableAnimations || '0')); } catch (e) {}
        }
        // dev tools
        if (typeof s.devToolsVisible === 'boolean') DEV_TOOLS_VISIBLE = s.devToolsVisible;
        // anim speed / vector-only
        if (typeof s.animSpeed === 'number') {
          animSpeed = s.animSpeed;
          try { localStorage.setItem('animSpeed', String(animSpeed)); } catch (e) {}
        }
        if (typeof s.useVectorOnly === 'boolean') {
          useVectorOnly = s.useVectorOnly;
          try { localStorage.setItem('useVectorOnly', useVectorOnly ? '1' : '0'); } catch (e) {}
        }
  // restore boss dev inputs if present in saved settings
  try { if (typeof s.devBossSpawn === 'string' && s.devBossSpawn) { localStorage.setItem('devBossSpawn', s.devBossSpawn); } } catch (e) {}
  try { if (typeof s.devBossHits === 'string' && s.devBossHits) { localStorage.setItem('devBossHits', s.devBossHits); } } catch (e) {}
  try { if (typeof s.devBossThreshold === 'string' && s.devBossThreshold) { localStorage.setItem('devBossThreshold', s.devBossThreshold); } } catch (e) {}
        // restore timer fields
        if (typeof s.gameTimerStart === 'string' && s.gameTimerStart) {
          try { localStorage.setItem('gameTimerStart', s.gameTimerStart); } catch (e) {}
        }
        if (typeof s.gameTimerRunning !== 'undefined') {
          try { localStorage.setItem('gameTimerRunning', String(s.gameTimerRunning ? '1' : '0')); } catch (e) {}
        }
      } else {
        // fallback: restore from individual localStorage keys if present
        try {
          const bg = localStorage.getItem('background'); if (bg) {/* leave as-is */}
          const da = localStorage.getItem('disableAnimations'); if (da) {/* leave as-is */}
          const savedAnim = localStorage.getItem('animSpeed'); if (savedAnim) animSpeed = parseFloat(savedAnim) || animSpeed;
          const savedVec = localStorage.getItem('useVectorOnly'); if (savedVec) useVectorOnly = savedVec === '1' || savedVec === 'true';
        } catch (e) {}
      }
    } catch (e) { }
    return true;
  } catch (e) {
    console.error('loadGameState failed', e);
    return false;
  }
}

// Setup UI elements on DOMContentLoaded
function initUI() {
  // create minimal UI if not present
  const app = document.getElementById('app') || document.body;
  // Startup diagnostic: dump persisted boss/dev keys and the main save payload
  try {
    const sSpawn = localStorage.getItem('devBossSpawn');
    const sHits = localStorage.getItem('devBossHits');
    const sThresh = localStorage.getItem('devBossThreshold');
    const bossStateRaw = localStorage.getItem('boss_state_v1');
    let savePayload = null;
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) savePayload = JSON.parse(raw); } catch (e) { savePayload = '<parse error>'; }
    try { appendToDebug && appendToDebug('Startup persist dump: devBossSpawn=' + sSpawn + ' devBossHits=' + sHits + ' devBossThreshold=' + sThresh + ' boss_state_v1=' + (bossStateRaw ? '<present>' : '<missing>') + ' save_hasBossState=' + (savePayload && savePayload.bossState ? '1' : '0')); } catch (e) {}
    try { console.debug('Startup persist dump', { devBossSpawn: sSpawn, devBossHits: sHits, devBossThreshold: sThresh, boss_state_v1: bossStateRaw, savePayload }); } catch (e) {}
  } catch (e) { try { console.error('Startup persist dump failed', e); } catch (e2) {} }
  // Promote dev boss settings from main save payload into localStorage early so UI creation picks them up
  try {
    const rawMain = localStorage.getItem(SAVE_KEY);
    if (rawMain) {
      const st = JSON.parse(rawMain);
      if (st && st.settings) {
        try {
          if (typeof st.settings.devBossSpawn !== 'undefined' && !localStorage.getItem('devBossSpawn')) {
            localStorage.setItem('devBossSpawn', String(st.settings.devBossSpawn));
            appendToDebug && appendToDebug('Promoted devBossSpawn from main save to localStorage');
          }
          if (typeof st.settings.devBossHits !== 'undefined' && !localStorage.getItem('devBossHits')) {
            localStorage.setItem('devBossHits', String(st.settings.devBossHits));
            appendToDebug && appendToDebug('Promoted devBossHits from main save to localStorage');
          }
          if (typeof st.settings.devBossThreshold !== 'undefined' && !localStorage.getItem('devBossThreshold')) {
            localStorage.setItem('devBossThreshold', String(st.settings.devBossThreshold));
            appendToDebug && appendToDebug('Promoted devBossThreshold from main save to localStorage');
          }
        } catch (e) { console.error('Promote dev boss keys failed', e); }
      }
    }
  } catch (e) { console.error('Promote dev boss settings early failed', e); }
  if (!document.getElementById('game-board')) {
    // Outer container: left column (board + controls) and right column (inventory)
    const outer = document.createElement('div');
    outer.style.display = 'flex';
    outer.style.flexDirection = 'row';
    outer.style.gap = '12px';
    outer.style.alignItems = 'flex-start';
    outer.style.margin = '12px';

  // Chart column (left-most); can be hidden via controls
  // Common swaps dev control removed
  // Use the imported value from the bundler when available (mirrors the rocket example)
  let resolvedChartUrl = importedMergeChart || mergeChart;
  try {
    resolvedChartUrl = new URL(String(resolvedChartUrl), location.href).href;
  } catch (e) {
    resolvedChartUrl = String(resolvedChartUrl || '') || './merge_chart.png';
  }
  chartImg.src = resolvedChartUrl;

  // Try a lightweight HEAD request to confirm the resource is reachable and log the status
  try {
    fetch(resolvedChartUrl, { method: 'HEAD', cache: 'no-store' })
      .then(res => {
        appendToDebug && appendToDebug('Merge chart HEAD status: ' + res.status + ' for ' + resolvedChartUrl);
        console.debug('Merge chart HEAD status', res.status, resolvedChartUrl);
      })
      .catch(err => {
        appendToDebug && appendToDebug('Merge chart HEAD error: ' + String(err));
        console.debug('Merge chart HEAD error', err);
      });
  } catch (e) {
    try { appendToDebug && appendToDebug('Merge chart fetch attempt failed: ' + String(e)); } catch (e2) {}
  }

  // Debug: report load attempts to the in-page console and browser console
  chartImg.onload = () => {
    try { appendToDebug && appendToDebug('Merge chart loaded: ' + chartImg.src + ' — ' + chartImg.naturalWidth + 'x' + chartImg.naturalHeight); } catch (e) {}
    try { console.debug('Merge chart loaded', { src: chartImg.src, w: chartImg.naturalWidth, h: chartImg.naturalHeight }); } catch (e) {}
  };
  chartImg.alt = 'Merge chart';
  chartImg.style.width = '100%';
  chartImg.style.height = 'auto';
  chartImg.style.display = 'block';
  chartImg.style.border = '1px solid #222';
  chartImg.style.background = '#070707';
  chartImg.style.padding = '6px';
  chartImg.onerror = () => {
    try { appendToDebug && appendToDebug('Merge chart failed to load: ' + chartImg.src); } catch (e) {}
    chartWrap.innerHTML = '';
    const note = document.createElement('div');
    note.textContent = 'Merge chart not available';
    note.style.color = '#fff';
    note.style.padding = '6px';
    chartWrap.appendChild(note);
  };
  chartWrap.appendChild(chartImg);
  outer.appendChild(chartWrap);

  const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.gap = '8px';

    const info = document.createElement('div');
      info.id = 'game-info';
      left.appendChild(info);

    const boardDiv = document.createElement('div');
    boardDiv.id = 'game-board';
    left.appendChild(boardDiv);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '8px';

    const btnShuffle = document.createElement('button');
    btnShuffle.id = 'btn-shuffle';
    btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
    btnShuffle.addEventListener('click', () => {
      // Use animated shuffle helper which handles remaining count and cascade
      shuffleBoardAnimated();
    });
  controls.appendChild(btnShuffle);

    // Hint button: immediately show a suggested valid move
    const btnHint = document.createElement('button');
    btnHint.id = 'btn-hint';
    btnHint.textContent = 'Hint';
    btnHint.addEventListener('click', () => {
      try { console.debug('Hint button clicked'); } catch(e) {}
      try {
        if (!board || !Array.isArray(board)) {
          appendToDebug && appendToDebug('Hint handler: board is not initialized');
          console.error('Hint handler: board is not initialized', { board });
          return;
        }
        let moves;
        try {
          moves = findValidMovesList();
        } catch (innerErr) {
          const msg = innerErr && innerErr.stack ? innerErr.stack : String(innerErr);
          appendToDebug && appendToDebug('Hint handler: findValidMovesList threw: ' + msg);
          console.error('Hint handler inner error', innerErr);
          return;
        }
        try { console.debug('Hint handler found moves:', moves ? moves.length : 0); } catch(e) {}
        try { appendToDebug && appendToDebug('Hint moves: ' + (moves ? moves.length : 0)); } catch (e) {}
        if (!moves || moves.length === 0) { alert('No valid moves available'); return; }
        try { appendToDebug && appendToDebug('Sample moves: ' + JSON.stringify(moves.slice(0,8))); } catch (e) {}
        try { appendToDebug && appendToDebug('Board snapshot: ' + JSON.stringify(board.map(r => r.map(c => c ? { templateId: c.templateId, rarity: c.rarity, plus: !!c.plus, type: c.type } : null)))); } catch (e) {}
        const mv = moves[Math.floor(Math.random() * moves.length)];
        hintMove = mv;
        try { appendToDebug && appendToDebug('Hint chosen: ' + JSON.stringify(mv)); } catch (e) {}
        renderBoard();
        // keep inactivity timer in sync
        resetInactivity();
      } catch (err) {
        const stack = err && err.stack ? err.stack : JSON.stringify(err);
        appendToDebug && appendToDebug('Hint handler error: ' + stack);
        console.error('Hint handler error', err);
      }
    });
    controls.appendChild(btnHint);

  // Dev tools are intentionally only exposed via the settings menu.

    const btnRestart = document.createElement('button');
    btnRestart.id = 'btn-restart';
    btnRestart.textContent = 'Restart';
    btnRestart.addEventListener('click', () => {
      // reset inventory and counters on restart
      inventory = { Cannon: null, Generator: null, Armor: null, Core: null };
      shuffleRemaining = 3;
      commonSwapRemaining = 20;
  // reset session stats and shard totals
  try { moveCount = 0; } catch (e) {}
  try { totalMerges = 0; } catch (e) {}
  try { totalShatters = 0; } catch (e) {}
  try { shardsEarned = { Cannon: 0, Armor: 0, Generator: 0, Core: 0 }; } catch (e) {}
  try { score = 0; } catch (e) {}
  createBoard();
  renderBoard();
  renderInventory();
  try { updateScoreUI(); } catch (e) {}
  try { saveGameState(); } catch (e) {}
  cascadeResolve();
    });
  controls.appendChild(btnRestart);
    left.appendChild(controls);
    outer.appendChild(left);

  // Right column: wrapper that holds the inventory grid and dev/debug console stacked vertically
  const rightCol = document.createElement('div');
  rightCol.id = 'right-column';
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.gap = '8px';
  rightCol.style.alignItems = 'center';
  // transition handled by CSS; control vertical nudge via CSS variable to avoid inline conflicts
  rightCol.style.transition = 'transform 180ms ease';

  // Ensure CSS variable exists and is set to 3 rows by default so JS and CSS are in sync.
  try {
  // Use priority 'important' so runtime JS takes precedence over stylesheet defaults
  document.documentElement.style.setProperty('--rightcol-rows', '3', 'important');
  } catch (e) {}
  // inventory grid lives inside the right column so dev tools can be stacked below it
  const inv = document.createElement('div');
  inv.id = 'inventory';
  rightCol.appendChild(inv);
  outer.appendChild(rightCol);

    app.appendChild(outer);

  // Debug: report computed transform and bounding rects after layout so we can diagnose why
  // the translate may not be visible in some embed contexts. This will appear in the in-page console.
  requestAnimationFrame(() => {
    try {
      const rc = document.getElementById('right-column');
      const brd = document.getElementById('game-board');
      const cs = rc ? window.getComputedStyle(rc) : null;
      appendToDebug && appendToDebug('DBG:right-column computed transform -> ' + (cs ? cs.transform : '<missing>'));
      if (rc) {
        const rrect = rc.getBoundingClientRect();
        appendToDebug && appendToDebug(`DBG:right-column rect top=${Math.round(rrect.top)}, height=${Math.round(rrect.height)}`);
      }
      if (brd) {
        const brect = brd.getBoundingClientRect();
        appendToDebug && appendToDebug(`DBG:board rect top=${Math.round(brect.top)}, height=${Math.round(brect.height)}`);
      }
    } catch (e) { try { appendToDebug && appendToDebug('DBG:right-column debug failed: ' + String(e)); } catch (e2) {} }
  });
  }

    // Try to load saved state; if none, create a new board
    if (!loadGameState()) {
  createBoard();
  // start fresh timer for new game
  try { resetGameTimer(); startGameTimer(); } catch (e) {}
    }
    // initialize boss integration now that UI and board exist
    try { initBossIntegration(); } catch (e) {}
  cascadeResolve(); // auto-resolve any initial shatterable groups on load
  renderBoard();
  // Sync chart visibility from persisted state (if present)
  const ch = document.getElementById('merge-chart-wrap');
  if (ch) ch.style.display = CHART_VISIBLE ? 'block' : 'none';
  const chartBtn = document.getElementById('btn-toggle-chart');
  if (chartBtn) chartBtn.textContent = CHART_VISIBLE ? 'Hide Chart' : 'Show Chart';
  // fallback: if inventory was not created above, append it to app
  if (!document.getElementById('inventory')) {
    const inv = document.createElement('div');
    inv.id = 'inventory';
    app.appendChild(inv);
  }
  // Swap counter UI removed — common swap count is now a hidden mechanic
  renderInventory();
  // inject hint styles once
  ensureHintStyles();
  // inject an in-page debug console for environments without DevTools
  ensureDebugConsole();
  // Apply restored UI settings: background, animations, anim speed, vector-only, and dev tools visibility
  try {
    try { const savedBg = localStorage.getItem('background'); if (savedBg) applyBackground(savedBg); } catch (e) {}
    try { const da = !!localStorage.getItem('disableAnimations') && localStorage.getItem('disableAnimations') !== '0'; applyDisableAnimations && applyDisableAnimations(da); } catch (e) {}
    try { document.documentElement.style.setProperty('--anim-speed', String(animSpeed || 1)); } catch (e) {}
    try { if (useVectorOnly) { renderInventory && renderInventory(); renderBoard && renderBoard(); } } catch (e) {}
    try {
      const wrap = document.getElementById('debug-console-wrap');
      if (wrap) {
        wrap.style.display = DEV_TOOLS_VISIBLE ? 'block' : 'none';
        const ctrlBtn = document.getElementById('btn-devtools-toggle');
        if (ctrlBtn) ctrlBtn.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
      }
    } catch (e) {}
  } catch (e) {}
}

// Ensure the UI initializer runs whether DOMContentLoaded has already fired or not
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}

// Periodically persist timer state so reloads can resume accurately
setInterval(() => {
  try {
    if (gameTimerStart) localStorage.setItem('gameTimerStart', String(gameTimerStart));
    localStorage.setItem('gameTimerRunning', gameTimerInterval ? '1' : '0');
  } catch (e) {}
}, 2000);

window.addEventListener('beforeunload', () => {
  try {
    if (gameTimerStart) localStorage.setItem('gameTimerStart', String(gameTimerStart));
    localStorage.setItem('gameTimerRunning', gameTimerInterval ? '1' : '0');
  } catch (e) {}
});

// In-page debug console: create a console viewport under the inventory and forward console calls
function ensureDebugConsole() {
  if (document.getElementById('debug-console-wrap')) return;
  const inv = document.getElementById('inventory');
  // Create a persistent portal attached to document.body so inventory re-renders cannot remove it
  const wrap = document.createElement('div');
  wrap.id = 'debug-console-wrap';
  wrap.style.position = 'absolute';
  wrap.style.marginTop = '12px';
  wrap.style.width = inv ? (inv.offsetWidth ? inv.offsetWidth + 'px' : '260px') : '320px';
  wrap.style.maxWidth = '90%';
  wrap.style.zIndex = '2000';
  wrap.style.boxSizing = 'border-box';

  const hdr = document.createElement('div');
  hdr.style.display = 'flex';
  hdr.style.alignItems = 'center';
  hdr.style.justifyContent = 'space-between';
  hdr.style.gap = '8px';

  const title = document.createElement('div');
  title.textContent = 'Console';
  title.style.fontWeight = '700';
  title.style.color = '#fff';
  hdr.appendChild(title);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '6px';
  const btnClear = document.createElement('button');
  btnClear.textContent = 'Clear';
  btnClear.addEventListener('click', () => { const p = document.getElementById('debug-console'); if (p) p.innerHTML = ''; });
  controls.appendChild(btnClear);
  const btnToggle = document.createElement('button');
  btnToggle.textContent = 'Hide';
  btnToggle.addEventListener('click', () => {
    const p = document.getElementById('debug-console');
    if (!p) return;
    if (p.style.display === 'none') {
      p.style.display = 'block';
      btnToggle.textContent = 'Hide';
      DEV_TOOLS_VISIBLE = true;
    } else {
      p.style.display = 'none';
      btnToggle.textContent = 'Show';
      DEV_TOOLS_VISIBLE = false;
    }
    // Also update the controls button text if present
    const ctrlBtn = document.getElementById('btn-devtools-toggle');
    if (ctrlBtn) ctrlBtn.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
  });
  controls.appendChild(btnToggle);
  hdr.appendChild(controls);

  const pane = document.createElement('div');
  pane.id = 'debug-console';
  pane.style.background = '#0b0b0b';
  pane.style.color = '#e6e6e6';
  pane.style.fontFamily = 'monospace, monospace';
  pane.style.fontSize = '12px';
  pane.style.padding = '8px';
  pane.style.height = '160px';
  pane.style.overflow = 'auto';
  pane.style.border = '1px solid #222';
  pane.style.boxSizing = 'border-box';

  wrap.appendChild(hdr);
  wrap.appendChild(pane);

  // --- Dev controls (appear below the console) ---
  if (!document.getElementById('dev-controls')) {
    const dev = document.createElement('div');
    dev.id = 'dev-controls';
    dev.style.marginTop = '6px';
    dev.style.display = 'flex';
    dev.style.flexDirection = 'column';
    dev.style.gap = '6px';
    dev.style.paddingTop = '6px';
    dev.style.maxWidth = (pane.offsetWidth ? pane.offsetWidth : 320) + 'px';

    // Compact row: text inputs for swaps and shuffles
    const compact = document.createElement('div');
    compact.style.display = 'flex';
    compact.style.flexDirection = 'row';
    compact.style.gap = '8px';
    compact.style.alignItems = 'center';

  // Common swaps dev control fully removed

    const shufWrap = document.createElement('div');
    shufWrap.style.display = 'flex';
    shufWrap.style.flexDirection = 'column';
    const shufLabel = document.createElement('label');
    shufLabel.textContent = 'Shuffles';
    shufLabel.style.fontSize = '11px';
    const shufInput = document.createElement('input');
    shufInput.type = 'number'; shufInput.id = 'dev-shuffles'; shufInput.value = String(shuffleRemaining); shufInput.style.width = '72px';
    shufInput.addEventListener('change', () => {
      shuffleRemaining = parseInt(shufInput.value || '0', 10);
      appendToDebug && appendToDebug('shuffleRemaining -> ' + shuffleRemaining);
      const b = document.getElementById('btn-shuffle');
      if (b) {
        b.textContent = `Shuffle (${shuffleRemaining})`;
        b.disabled = shuffleRemaining <= 0;
      }
      // Keep UI/state consistent
      try { saveGameState(); } catch (e) {}
      renderBoard && renderBoard();
    });
    shufWrap.appendChild(shufLabel); shufWrap.appendChild(shufInput);
    compact.appendChild(shufWrap);

  dev.appendChild(compact);
  // Small label between input rows
  const ratesLabelMid = document.createElement('div');
  ratesLabelMid.textContent = 'Drop rates';
  ratesLabelMid.style.fontSize = '12px';
  ratesLabelMid.style.fontWeight = '700';
  ratesLabelMid.style.marginTop = '4px';
  dev.appendChild(ratesLabelMid);

  // Compact rates row (stacked small inputs)
    const ratesCompact = document.createElement('div');
    ratesCompact.style.display = 'flex';
    ratesCompact.style.gap = '6px';
    ratesCompact.style.alignItems = 'flex-end';

    const makeSmallRate = (id, label, value) => {
      const w = document.createElement('div');
      w.style.display = 'flex';
      w.style.flexDirection = 'column';
      const l = document.createElement('label'); l.textContent = label; l.style.fontSize = '11px';
      const i = document.createElement('input'); i.type = 'number'; i.id = id; i.value = String(value); i.min = '0'; i.step = '0.1'; i.style.width = '64px';
      w.appendChild(l); w.appendChild(i);
      return w;
    };
    const commonPerc = Math.round((BASE_RATES.Common || 0) * 1000) / 10;
    const rarePerc = Math.round((BASE_RATES.Rare || 0) * 1000) / 10;
    const epicPerc = Math.round((BASE_RATES.Epic || 0) * 1000) / 10;
    ratesCompact.appendChild(makeSmallRate('dev-rate-common','Common %', commonPerc));
    ratesCompact.appendChild(makeSmallRate('dev-rate-rare','Rare %', rarePerc));
    ratesCompact.appendChild(makeSmallRate('dev-rate-epic','Epic %', epicPerc));
  ratesCompact.appendChild(makeSmallRate('dev-rate-mine','Mine %', MINE_SPAWN_PERCENT));

    const applyRow = document.createElement('div'); applyRow.style.display = 'flex'; applyRow.style.gap = '6px';
    const applyBtn = document.createElement('button'); applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
      const c = parseFloat(document.getElementById('dev-rate-common').value) || 0;
      const r = parseFloat(document.getElementById('dev-rate-rare').value) || 0;
      const e = parseFloat(document.getElementById('dev-rate-epic').value) || 0;
    const m = parseFloat(document.getElementById('dev-rate-mine').value) || 0;
      const sum = c + r + e; if (sum <= 0) { alert('Rates must sum to > 0'); return; }
      // Assign percentages directly so values >100 are allowed. The game expects fractions, so divide by 100.
      BASE_RATES.Common = c / 100;
      BASE_RATES.Rare = r / 100;
      BASE_RATES.Epic = e / 100;
    // mine spawn percent is stored directly (0..100)
    MINE_SPAWN_PERCENT = Math.max(0, m);
    try { localStorage.setItem('devMineRate', String(MINE_SPAWN_PERCENT)); } catch (e) {}
  try { saveGameState(); } catch (e) {}
  appendToDebug && appendToDebug(`BASE_RATES updated: Common=${c}% Rare=${r}% Epic=${e}% Mine=${MINE_SPAWN_PERCENT}% (fractions: ${BASE_RATES.Common}, ${BASE_RATES.Rare}, ${BASE_RATES.Epic})`);
    });
    const resetBtn = document.createElement('button'); resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      BASE_RATES.Common = 68.5/100; BASE_RATES.Rare = 29/100; BASE_RATES.Epic = 2.5/100;
  MINE_SPAWN_PERCENT = 1;
      document.getElementById('dev-rate-common').value = String(Math.round(BASE_RATES.Common*1000)/10);
      document.getElementById('dev-rate-rare').value = String(Math.round(BASE_RATES.Rare*1000)/10);
      document.getElementById('dev-rate-epic').value = String(Math.round(BASE_RATES.Epic*1000)/10);
  document.getElementById('dev-rate-mine').value = String(MINE_SPAWN_PERCENT);
  try { saveGameState(); } catch (e) {}
  appendToDebug && appendToDebug('BASE_RATES reset to defaults');
    });
    applyRow.appendChild(applyBtn); applyRow.appendChild(resetBtn);

    dev.appendChild(ratesCompact);
    dev.appendChild(applyRow);

    // --- Dev-only animation controls: speed slider + vector-only toggle ---
    const animRow = document.createElement('div');
    animRow.style.display = 'flex';
    animRow.style.flexDirection = 'row';
    animRow.style.gap = '8px';
    animRow.style.alignItems = 'center';
    const animLabel = document.createElement('label'); animLabel.textContent = 'Anim speed'; animLabel.style.fontSize = '11px';
    const animInput = document.createElement('input'); animInput.type = 'range'; animInput.id = 'anim-speed'; animInput.min = '0.25'; animInput.max = '2.0'; animInput.step = '0.05'; animInput.style.width = '140px';
    const animVal = document.createElement('div'); animVal.id = 'anim-speed-val'; animVal.style.fontSize = '11px'; animVal.style.minWidth = '36px'; animVal.style.textAlign = 'right';
    const chk = document.createElement('input'); chk.type = 'checkbox'; chk.id = 'chk-vector-only'; chk.style.marginLeft = '8px';
    const chkLab = document.createElement('label'); chkLab.textContent = 'Vector-only (no images)'; chkLab.style.fontSize = '11px'; chkLab.htmlFor = 'chk-vector-only';
    animRow.appendChild(animLabel); animRow.appendChild(animInput); animRow.appendChild(animVal); animRow.appendChild(chk); animRow.appendChild(chkLab);
    dev.appendChild(animRow);

    // --- Dev dropdown: pick next Epic (Random = normal behavior) ---
    const epicWrap = document.createElement('div');
    epicWrap.style.display = 'flex'; epicWrap.style.flexDirection = 'column'; epicWrap.style.gap = '4px'; epicWrap.style.marginTop = '6px';
    const epicLabel = document.createElement('label'); epicLabel.textContent = 'Force next Epic'; epicLabel.style.fontSize = '11px';
    const epicSelect = document.createElement('select'); epicSelect.id = 'dev-next-epic'; epicSelect.style.width = '100%'; epicSelect.style.fontSize = '12px';
    const optRandom = document.createElement('option'); optRandom.value = 'Random'; optRandom.textContent = 'Random'; epicSelect.appendChild(optRandom);
    // Populate with available templates that can be Epic (filter by templates that allow Epic rarity)
    try {
      const epicCandidates = ALL_TEMPLATES.filter(t => {
        const min = RARITY_RANK[t.minRarity] ?? 0; const max = RARITY_RANK[t.maxRarity] ?? 0; const epicRank = RARITY_RANK['Epic'];
        return min <= epicRank && epicRank <= max;
      }).sort((a,b) => (a.name||a.id).localeCompare(b.name||b.id));
      for (const t of epicCandidates) {
        const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.id} (${t.type})`;
        epicSelect.appendChild(o);
      }
    } catch (e) {}
    // restore selection immediately from localStorage if present
    try { const devNext = localStorage.getItem('devNextEpic'); if (devNext) epicSelect.value = devNext; } catch(e) {}
    epicSelect.addEventListener('change', () => {
      try { localStorage.setItem('devNextEpic', epicSelect.value); } catch (e) {}
      appendToDebug && appendToDebug('devNextEpic -> ' + epicSelect.value);
    });
    epicWrap.appendChild(epicLabel); epicWrap.appendChild(epicSelect);
    dev.appendChild(epicWrap);

    // initialize from localStorage if present
    try {
      const saved = localStorage.getItem('animSpeed'); if (saved) animSpeed = parseFloat(saved) || animSpeed;
      const savedVec = localStorage.getItem('useVectorOnly'); if (savedVec) useVectorOnly = savedVec === '1' || savedVec === 'true';
      // restore devNextEpic selection if present
      try { const devNext = localStorage.getItem('devNextEpic'); if (devNext) {
        const sel = document.getElementById('dev-next-epic'); if (sel) sel.value = devNext;
      } } catch(e) {}
      try { const savedMine = localStorage.getItem('devMineRate'); if (savedMine) {
        const msel = document.getElementById('dev-rate-mine'); if (msel) msel.value = String(parseFloat(savedMine) || 1);
      } } catch(e) {}
    } catch (e) {}
    // Boss dev controls
    try {
      const bossWrap = document.createElement('div'); bossWrap.style.display = 'flex'; bossWrap.style.flexDirection = 'column'; bossWrap.style.gap = '4px'; bossWrap.style.marginTop = '6px';
      const bLabel = document.createElement('div'); bLabel.textContent = 'Boss (dev)'; bLabel.style.fontSize = '12px'; bLabel.style.fontWeight = '700'; bossWrap.appendChild(bLabel);
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '6px'; row.style.alignItems = 'center';
      // Initialize boss dev inputs using promoted/persisted localStorage values when available
      const spn = document.createElement('input'); spn.type = 'number'; spn.id = 'dev-boss-spawn';
      try {
        const s = localStorage.getItem('devBossSpawn');
        if (s) spn.value = String(parseFloat(s) || (Math.round((1/250)*100000)/1000));
        else spn.value = String(Math.round((1/250)*100000)/1000);
      } catch (e) { spn.value = String(Math.round((1/250)*100000)/1000); }
      spn.style.width = '72px';

      const hsp = document.createElement('input'); hsp.type = 'number'; hsp.id = 'dev-boss-hits';
      try {
        const h = localStorage.getItem('devBossHits');
        if (h) hsp.value = String(parseInt(h, 10) || 100);
        else hsp.value = String(100);
      } catch (e) { hsp.value = String(100); }
      hsp.style.width = '72px';

      const dth = document.createElement('input'); dth.type = 'number'; dth.id = 'dev-boss-threshold';
      try {
        const t = localStorage.getItem('devBossThreshold');
        if (t) dth.value = String(parseInt(t, 10) || 20);
        else dth.value = String(20);
      } catch (e) { dth.value = String(20); }
      dth.style.width = '72px';
      row.appendChild(spn); row.appendChild(hsp); row.appendChild(dth);
      const labels = document.createElement('div'); labels.style.display='flex'; labels.style.gap='6px'; labels.innerHTML = '<div style="width:72px;font-size:11px">Spawn%</div><div style="width:72px;font-size:11px">Hits</div><div style="width:72px;font-size:11px">Thresh</div>';
      bossWrap.appendChild(labels); bossWrap.appendChild(row);
  const applyBoss = document.createElement('button'); applyBoss.textContent = 'Apply Boss Dev'; applyBoss.addEventListener('click', () => {
        const spawnVal = parseFloat(document.getElementById('dev-boss-spawn').value) || 0.004;
        const hitsVal = parseInt(document.getElementById('dev-boss-hits').value || '100',10) || 100;
        const thVal = parseInt(document.getElementById('dev-boss-threshold').value || '20',10) || 20;
        // convert spawn input interpreted as fraction (if >1 assume percent input)
        const spawnFrac = spawnVal > 1 ? Math.max(0, Math.min(1, spawnVal/100)) : Math.max(0, Math.min(1, spawnVal));
        bossHelper.setDevOptions && bossHelper.setDevOptions({ spawnChance: spawnFrac, requiredHits: hitsVal, destructiveMoveThreshold: thVal });
        appendToDebug && appendToDebug('Boss dev options applied: spawn=' + spawnFrac + ' hits=' + hitsVal + ' thresh=' + thVal);
  try {
    // store human-friendly percentage when user entered a percent (>1) or when they expect percent display
    const storeVal = spawnVal > 1 ? String(Math.round(spawnVal)) : String(spawnFrac * 100);
    localStorage.setItem('devBossSpawn', storeVal);
    localStorage.setItem('devBossHits', String(hitsVal));
    localStorage.setItem('devBossThreshold', String(thVal));
  } catch (e) {}
        try {
          // persist into helper-local state and main save payload immediately
          try { const bs = bossHelper.getStateForSave && bossHelper.getStateForSave(); if (bs) localStorage.setItem('boss_state_v1', JSON.stringify(bs)); } catch (e) {}
          try { saveGameState(); } catch (e) {}
        } catch (e) {}
      });
  bossWrap.appendChild(applyBoss);
  // Quick dev controls: apply manual damage and sync boss state
  try {
    const dmgRow = document.createElement('div'); dmgRow.style.display = 'flex'; dmgRow.style.gap = '6px'; dmgRow.style.alignItems = 'center'; dmgRow.style.marginTop = '6px';
    const dmgInput = document.createElement('input'); dmgInput.type = 'number'; dmgInput.id = 'dev-boss-damage-amt'; dmgInput.value = '1'; dmgInput.style.width = '60px';
    const dmgBtn = document.createElement('button'); dmgBtn.textContent = 'Deal Damage';
    dmgBtn.addEventListener('click', () => {
      try {
        const amt = parseInt(document.getElementById('dev-boss-damage-amt').value,10) || 1;
        const ok = bossHelper.applyDamage ? bossHelper.applyDamage(amt) : false;
        appendToDebug && appendToDebug('Dev applied damage ' + amt + ' -> ' + (ok ? 'ok' : 'no-boss'));
      } catch (e) { console.error('Deal Damage failed', e); }
    });
    const dmg10 = document.createElement('button'); dmg10.textContent = 'Deal 10'; dmg10.addEventListener('click', () => { try { const ok = bossHelper.applyDamage ? bossHelper.applyDamage(10) : false; appendToDebug && appendToDebug('Dev applied damage 10 -> ' + (ok ? 'ok' : 'no-boss')); } catch (e) {} });
    const syncBtn = document.createElement('button'); syncBtn.textContent = 'Sync Hits from Boss'; syncBtn.addEventListener('click', () => {
      try {
        const b = bossHelper.getBoss ? bossHelper.getBoss() : (window.__BOSS_MARKER || null);
        if (b && typeof b.hitsRemaining === 'number') {
          const el = document.getElementById('dev-boss-hits'); if (el) el.value = String(b.hitsRemaining);
          appendToDebug && appendToDebug('Synced dev-boss-hits from boss: ' + b.hitsRemaining);
        } else appendToDebug && appendToDebug('No boss to sync from');
      } catch (e) { console.error('Sync hits failed', e); }
    });
    const posBtn = document.createElement('button'); posBtn.textContent = 'Show Boss Pos'; posBtn.addEventListener('click', () => { try { appendToDebug && appendToDebug('Boss marker: ' + JSON.stringify(window.__BOSS_MARKER || null)); console.debug('Boss marker', window.__BOSS_MARKER); } catch (e) {} });
    dmgRow.appendChild(dmgInput); dmgRow.appendChild(dmgBtn); dmgRow.appendChild(dmg10); dmgRow.appendChild(syncBtn); dmgRow.appendChild(posBtn);
    bossWrap.appendChild(dmgRow);
  } catch (e) {}
  // restore saved boss dev values if present
  try {
    const s = localStorage.getItem('devBossSpawn');
    if (s) {
      const v = parseFloat(s);
      if (!isNaN(v)) {
        // if the stored value is a fraction <= 1 (legacy), convert to percent for display
        document.getElementById('dev-boss-spawn').value = (v > 1 ? String(Math.round(v)) : String(Math.round(v * 100)));
      }
    }
  } catch (e) {}
  try { const h = localStorage.getItem('devBossHits'); if (h) document.getElementById('dev-boss-hits').value = String(parseInt(h,10) || 100); } catch (e) {}
  try { const t = localStorage.getItem('devBossThreshold'); if (t) document.getElementById('dev-boss-threshold').value = String(parseInt(t,10) || 20); } catch (e) {}
  // Ensure restored inputs are applied to the running boss helper immediately
  try {
    const sp = parseFloat(document.getElementById('dev-boss-spawn').value) || 0.004;
    const hi = parseInt(document.getElementById('dev-boss-hits').value,10) || 100;
    const th = parseInt(document.getElementById('dev-boss-threshold').value,10) || 20;
    const spawnFrac = sp > 1 ? Math.max(0, Math.min(1, sp/100)) : Math.max(0, Math.min(1, sp));
    const applied = { spawnChance: spawnFrac, requiredHits: hi, destructiveMoveThreshold: th };
    try { bossHelper.setDevOptions && bossHelper.setDevOptions(applied); console.debug('Applied restored boss dev inputs to helper', applied); } catch (e) { console.error('Applying restored boss dev inputs failed', e); }
  } catch (e) { console.error('Error applying restored boss dev inputs', e); }
      dev.appendChild(bossWrap);
    } catch (e) {}
    // reflect initial values
    animInput.value = String(animSpeed);
    animVal.textContent = String(animSpeed.toFixed ? animSpeed.toFixed(2) : animSpeed);
    chk.checked = !!useVectorOnly;
    // ensure CSS var is set
    try { document.documentElement.style.setProperty('--anim-speed', String(animSpeed || 1)); } catch (e) {}
    // wire events
    animInput.addEventListener('input', () => {
      animSpeed = parseFloat(animInput.value) || 1.0;
      animVal.textContent = String(animSpeed.toFixed ? animSpeed.toFixed(2) : animSpeed);
      try { document.documentElement.style.setProperty('--anim-speed', String(animSpeed || 1)); localStorage.setItem('animSpeed', String(animSpeed)); } catch (e) {}
    });
    animInput.addEventListener('change', () => { /* persist already handled on input */ });
    chk.addEventListener('change', () => {
      useVectorOnly = !!chk.checked;
      try { localStorage.setItem('useVectorOnly', useVectorOnly ? '1' : '0'); } catch (e) {}
      try { renderInventory && renderInventory(); renderBoard && renderBoard(); } catch (e) {}
    });

  // Free-swap is a default game behavior now; control removed from dev UI

    wrap.appendChild(dev);
  }

  // Instead of inserting inside #inventory (which may be re-created), append to body as a portal
  // and position it under the inventory via positionDebugPortal(). This prevents accidental removal.
  document.body.appendChild(wrap);
  // Position once now and again on resize
  try { positionDebugPortal(); } catch (e) {}
  if (!window.__debugPortalResizeHooked) {
    window.addEventListener('resize', () => { try { positionDebugPortal(); } catch (e) {} });
    window.__debugPortalResizeHooked = true;
  }

  // Hook console functions to also log to the pane
  const format = (args) => args.map(a => {
    try { if (typeof a === 'string') return a; return JSON.stringify(a); } catch (e) { try { return String(a); } catch (ee) { return '<unserializable>'; } }
  }).join(' ');

  const orig = { log: console.log, info: console.info, debug: console.debug, warn: console.warn, error: console.error };
  ['log','info','debug','warn','error'].forEach((k) => {
    console[k] = function(...args) {
      try {
        const line = document.createElement('div');
        line.style.whiteSpace = 'pre-wrap';
        line.style.marginBottom = '4px';
        if (k === 'error') line.style.color = '#ff8080';
        else if (k === 'warn') line.style.color = '#ffd080';
        else if (k === 'debug') line.style.color = '#9fe6c7';
        else line.style.color = '#e6e6e6';
        line.textContent = '[' + k.toUpperCase() + '] ' + format(args);
        const p = document.getElementById('debug-console');
        if (p) {
          p.appendChild(line);
          // cap messages to last ~500 entries
          while (p.childNodes.length > 500) p.removeChild(p.firstChild);
          p.scrollTop = p.scrollHeight;
        }
      } catch (e) {}
      try { orig[k].apply(console, args); } catch (e) {}
    };
  });
}
// Helper to append to the in-page debug console if present
function appendToDebug(msg) {
  try {
    const p = document.getElementById('debug-console');
    if (!p) return;
    const line = document.createElement('div');
    line.style.whiteSpace = 'pre-wrap';
    line.style.marginBottom = '4px';
    line.style.color = '#9fe6c7';
    line.textContent = '[DBG] ' + msg;
    p.appendChild(line);
    while (p.childNodes.length > 500) p.removeChild(p.firstChild);
    p.scrollTop = p.scrollHeight;
  } catch (e) {}
}

// Position the debug console portal so it visually appears under #inventory when possible.
function positionDebugPortal() {
  const wrap = document.getElementById('debug-console-wrap');
  if (!wrap) return;
  const inv = document.getElementById('inventory');
  // Default: place in the bottom-right of #app
  const app = document.getElementById('app') || document.body;
  if (inv) {
    const rect = inv.getBoundingClientRect();
    // place the portal absolutely under the inventory element (same left, top after inventory)
    wrap.style.left = Math.max(8, rect.left + window.scrollX) + 'px';
    wrap.style.top = Math.max(8, rect.bottom + window.scrollY + 6) + 'px';
    // match width to inventory where possible
    wrap.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
  } else if (app) {
    const rect = app.getBoundingClientRect();
    wrap.style.left = Math.max(8, rect.left + window.scrollX) + 'px';
    wrap.style.top = Math.max(8, rect.bottom + window.scrollY + 6) + 'px';
    wrap.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
  } else {
    wrap.style.left = '8px';
    wrap.style.top = '8px';
    wrap.style.width = '320px';
  }
}

function ensureHintStyles() {
  if (document.getElementById('hint-styles')) return;
  const s = document.createElement('style');
  s.id = 'hint-styles';
  s.textContent = `
  .hint-pulse {
    animation: hintPulse 1.2s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(0,255,160,0.0);
    border: 2px solid rgba(0,255,160,0.0);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .boss-pulse {
    animation: bossPulse 2.4s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(255,80,80,0.0);
    border: 2px solid rgba(255,80,80,0.0);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  @keyframes hintPulse {
    0% { box-shadow: 0 0 0 0 rgba(0,255,160,0.0); border-color: rgba(0,255,160,0.0); }
    40% { box-shadow: 0 0 12px 6px rgba(0,255,160,0.18); border-color: rgba(0,255,160,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(0,255,160,0.0); border-color: rgba(0,255,160,0.0); }
  }
  @keyframes bossPulse {
    0% { box-shadow: 0 0 0 0 rgba(255,80,80,0.0); border-color: rgba(255,80,80,0.0); }
    40% { box-shadow: 0 0 12px 6px rgba(255,80,80,0.18); border-color: rgba(255,80,80,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(255,80,80,0.0); border-color: rgba(255,80,80,0.0); }
  }
  .inv-shape { width:46px; height:46px; display:flex; align-items:center; justify-content:center; }
  .rare-plus-notch { box-shadow: 0 0 8px rgba(255,255,255,0.08); }
  `;
  document.head.appendChild(s);
}

async function appendVoiceChannelName() {
  const app = document.querySelector('#app');

  let activityChannelName = 'Unknown';

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}
