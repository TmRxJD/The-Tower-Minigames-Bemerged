// spawn.js - moved rollRarity, makeDrop, spawnOfRarity
// Exposes a factory makeSpawner(ctx) that returns the functions bound to the provided runtime context.
import { createModuleInstance as sharedCreateModuleInstance } from '../entities/moduleFactory.js';

export function makeSpawner(ctx) {
  const rand = (ctx && ctx.rand) ? ctx.rand : (() => Math.random());
  const BASE_RATES = (ctx && ctx.BASE_RATES) ? ctx.BASE_RATES : { Common: 0.685, Rare: 0.29, Epic: 0.025 };
  const ALL_TEMPLATES = (ctx && ctx.ALL_TEMPLATES) ? ctx.ALL_TEMPLATES : [];
  const RARITY_RANK = (ctx && ctx.RARITY_RANK) ? ctx.RARITY_RANK : {};
  const createModuleInstance = (ctx && ctx.createModuleInstance) ? ctx.createModuleInstance : sharedCreateModuleInstance;
  const appendToDebug = ctx && ctx.appendToDebug ? ctx.appendToDebug : (() => {});
  const localStorageRef = (ctx && typeof ctx.localStorage !== 'undefined') ? ctx.localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const getBadLuck = ctx && ctx.getBadLuck ? ctx.getBadLuck : (() => { return 0; });
  const setBadLuck = ctx && ctx.setBadLuck ? ctx.setBadLuck : (() => {});

  function rollRarity() {
    const r = rand();
    if (r < BASE_RATES.Common) return 'Common';
    if (r < BASE_RATES.Common + BASE_RATES.Rare) return 'Rare';
    return 'Epic';
  }

  function makeDrop() {
    // Bad luck protection
    if (getBadLuck() >= 150) {
      setBadLuck(0);
      return spawnOfRarity('Epic');
    }
    const rarity = rollRarity();
    if (rarity === 'Epic') setBadLuck(0); else setBadLuck(getBadLuck() + 1);
    const inst = spawnOfRarity(rarity);
    return inst;
  }

  function spawnOfRarity(rarity) {
    // Dev override: if a developer selected a specific Epic template in the in-page debug console,
    // honor that choice and spawn it instead of a random Epic. Stored in localStorage key 'devNextEpic'.
    if (rarity === 'Epic') {
      try {
        const devChoice = localStorageRef ? localStorageRef.getItem('devNextEpic') : null;
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

  return { rollRarity, makeDrop, spawnOfRarity };
}
