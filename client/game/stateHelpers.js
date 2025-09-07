// stateHelpers.js
// Pure helpers to manipulate the main game state slice. The helpers operate via
// provided getter/setter callbacks so the engine remains pure and side-effect-free.

import { makeStorageHelpers } from '../utils/storage.js';

export function makeStateHelpers(ctx) {
  const get = ctx.get || (() => undefined);
  const set = ctx.set || (() => {});
  const localStorageRef = ctx.localStorage || (typeof window !== 'undefined' ? window.localStorage : null);
  const appendToDebug = ctx.appendToDebug || (() => {});
  const ensureBoardBindings = ctx.ensureBoardBindings || (() => {});
  const updateScoreUI = ctx.updateScoreUI || (() => {});
  const renderBoard = ctx.renderBoard || (() => {});
  const bossHelper = ctx.bossHelper || null;

  // use storage helpers to get save/load functions with guarded access to localStorage
  const storage = makeStorageHelpers({ get, set, localStorageRef, bossHelper, ensureBoardBindings });
  const saveGameState = storage.saveGameState;
  const loadGameState = storage.loadGameState;

  function awardShards(shType, shards) {
    try {
      if (!shType) shType = 'Unknown';
      const n = Number(shards) || 0; if (n === 0) return;
      const cur = get('shardsEarned') || {};
      if (!cur[shType]) cur[shType] = 0;
      cur[shType] += n;
      set('shardsEarned', cur);
      try { set('score', Object.values(cur || {}).reduce((a,b) => a + (Number(b)||0), 0)); } catch (e) {}
      try { updateScoreUI(); } catch (e) {}
      try { appendToDebug && appendToDebug(`awardShards: ${shType} += ${n} (total=${cur[shType]})`); } catch (e) {}
      try { if (typeof window !== 'undefined') { window.lastAwardedDebug = { type: shType, added: n, total: cur[shType] }; } } catch (e) {}
    } catch (e) { console.error('awardShards failed', e); }
  }

  return { saveGameState, loadGameState, awardShards };
}
