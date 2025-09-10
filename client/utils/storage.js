// client/utils/storage.js
// Small helper to encapsulate save/load of the game state with localStorage guards.
export function makeStorageHelpers({ get, set, localStorageRef, bossHelper, ensureBoardBindings } = {}) {
  const SAVE_KEY = 'merge_game_v1';

  // safe wrapper for writing JSON to storage
  function safeSetItem(key, value) {
    try {
      if (!localStorageRef) {
        return false;
      }
      localStorageRef.setItem(key, value);
      return true;
    } catch (e) {
      try {
        console.error('safeSetItem failed', e);
      } catch (ee) {}
      return false;
    }
  }

  // safe wrapper for reading from storage
  function safeGetItem(key) {
    try {
      if (!localStorageRef) {
        return null;
      }
      return localStorageRef.getItem(key);
    } catch (e) {
      try {
        console.error('safeGetItem failed', e);
      } catch (ee) {}
      return null;
    }
  }

  function saveGameState() {
    try {
      const state = {
        board: get('board'),
        inventory: get('inventory'),
        // commonSwapRemaining: deprecated - free swap is now permanent
        shuffleRemaining: get('shuffleRemaining'),
        score: get('score'),
        completed: get('completed'),
        autoShatterRares: get('autoShatterRares'),
        badLuckCounter: get('badLuckCounter'),
        baseRates: get('BASE_RATES'),
        orientation: get('ORIENTATION'),
        boardRows: get('BOARD_ROWS'),
        boardCols: get('BOARD_COLS'),
        chartVisible: get('CHART_VISIBLE'),
        stats: {
          moveCount: get('moveCount') || 0,
          totalMerges: get('totalMerges') || 0,
          totalShatters: get('totalShatters') || 0,
          shardsEarned: get('shardsEarned') || {},
        },
        settings: get('persistedSettings') || {},
      };
      try {
        const bs = bossHelper && bossHelper.getStateForSave && bossHelper.getStateForSave();
        if (bs) {
          state.bossState = bs;
        }
      } catch (e) {}
      safeSetItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      try {
        console.error('saveGameState failed', e);
      } catch (ee) {}
    }
  }

  function loadGameState() {
    try {
      const raw = safeGetItem(SAVE_KEY);
      if (!raw) {
        return false;
      }
      const state = JSON.parse(raw);
      if (!state || !Array.isArray(state.board)) {
        return false;
      }
      const expectedRows = typeof state.boardRows === 'number' ? state.boardRows : get('BOARD_ROWS');
      const expectedCols = typeof state.boardCols === 'number' ? state.boardCols : get('BOARD_COLS');
      if (state.board.length !== expectedRows) {
        return false;
      }
      for (let r = 0; r < expectedRows; r++) {
        if (!Array.isArray(state.board[r]) || state.board[r].length !== expectedCols) {
          return false;
        }
      }
      // restore dimensions & board
      set('BOARD_ROWS', expectedRows);
      set('BOARD_COLS', expectedCols);
      set('ORIENTATION', state.orientation || get('ORIENTATION'));
      set('board', state.board);
      // ensureBoardBindings && ensureBoardBindings();
      set('CHART_VISIBLE', typeof state.chartVisible === 'boolean' ? state.chartVisible : get('CHART_VISIBLE'));
      set('inventory', state.inventory || get('inventory'));
      // set('commonSwapRemaining', typeof state.commonSwapRemaining === 'number' ? state.commonSwapRemaining : get('commonSwapRemaining')); // deprecated - free swap is now permanent
      set(
        'shuffleRemaining',
        typeof state.shuffleRemaining === 'number' ? state.shuffleRemaining : get('shuffleRemaining'),
      );
      if (state.stats && state.stats.shardsEarned && typeof state.stats.shardsEarned === 'object') {
        set('shardsEarned', state.stats.shardsEarned);
        try {
          set(
            'score',
            Object.values(state.stats.shardsEarned || {}).reduce((a, b) => a + (Number(b) || 0), 0),
          );
        } catch (e) {
          set('score', get('score'));
        }
      } else {
        set('score', typeof state.score === 'number' ? state.score : get('score'));
      }
      set('completed', state.completed || get('completed'));
      set('autoShatterRares', !!state.autoShatterRares);
      set('badLuckCounter', typeof state.badLuckCounter === 'number' ? state.badLuckCounter : get('badLuckCounter'));
      if (state.stats && typeof state.stats === 'object') {
        set('moveCount', typeof state.stats.moveCount === 'number' ? state.stats.moveCount : get('moveCount'));
        set('totalMerges', typeof state.stats.totalMerges === 'number' ? state.stats.totalMerges : get('totalMerges'));
        set(
          'totalShatters',
          typeof state.stats.totalShatters === 'number' ? state.stats.totalShatters : get('totalShatters'),
        );
      }
      if (state.baseRates && typeof state.baseRates === 'object') {
        const br = get('BASE_RATES') || {};
        br.Common = typeof state.baseRates.Common === 'number' ? state.baseRates.Common : br.Common;
        br.Rare = typeof state.baseRates.Rare === 'number' ? state.baseRates.Rare : br.Rare;
        br.Epic = typeof state.baseRates.Epic === 'number' ? state.baseRates.Epic : br.Epic;
        set('BASE_RATES', br);
      }
      try {
        if (state.bossState && localStorageRef) {
          localStorageRef.setItem('boss_state_v1', JSON.stringify(state.bossState));
        }
      } catch (e) {}
      // restore persisted UI settings container if present
      if (state.settings && typeof state.settings === 'object') {
        set('persistedSettings', state.settings);
      }
      return true;
    } catch (e) {
      try {
        console.error('loadGameState failed', e);
      } catch (ee) {}
      return false;
    }
  }

  return { saveGameState,
    loadGameState };
}
