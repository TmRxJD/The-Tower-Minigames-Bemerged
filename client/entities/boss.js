// Consolidated boss module: contains both the helper runtime and the boss-specific
// handler factory used by the main runtime. This file replaces the previous
// `client/helpers/boss.js` and centralizes boss logic here.
//
// BOSS PHASED DESTRUCTION SYSTEM:
// After the destruction threshold is reached, boss enters Phase 1 and destroys surrounding tiles
// at automatically calculated frequencies for the specified duration, then progresses to
// Phase 2, Phase 3, and finally Phase 4 (every move until death).
//
// CONFIGURATION (via dev tools console):
// setBossPhases(destructionThreshold, moveThreshold, phaseDuration)
// Example: setBossPhases(20, 4, 10)
// - destructionThreshold: moves before boss starts destroying
// - moveThreshold: initial frequency (every Nth move in Phase 1)
// - phaseDuration: moves per phase before progressing
//
// Progression pattern:
// Phase 1: every moveThreshold moves for phaseDuration moves
// Phase 2: every (moveThreshold-1) moves for phaseDuration moves
// Phase 3: every (moveThreshold-2) moves for phaseDuration moves
// Phase 4: every move until death
//
// The boss destroys ALL 8 surrounding tiles (including diagonals) when it activates.

// --- Boss helper (migrated from client/helpers/boss.js) --------------------
const DEFAULTS = {
  spawnChance: 1 / 250,
  requiredHits: 100,
  // Boss destruction system with separate threshold and frequency controls
  destructionThreshold: 20, // Moves before boss starts destroying
  moveThreshold: 4, // Initial frequency (every Nth move in Phase 1)
  phaseDuration: 10, // Moves per phase before progressing
};

let opts = { ...DEFAULTS };
let boss = null;
let game = null; // runtime API supplied by main

import { createEl, setStyle } from '../utils/dom.js';

function ensureOverlay() {
  if (!document.getElementById('boss-overlay')) {
    const div = createEl(
      'div',
      { id: 'boss-overlay' },
      {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '6px',
        zIndex: '120',
        pointerEvents: 'none',
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
      },
    );
    document.body.appendChild(div);
  }
}

function renderOverlay() {
  ensureOverlay();
  const wrap = document.getElementById('boss-overlay');
  if (!wrap) {
    return;
  }
  try {
    console.debug && console.debug('renderOverlay called', { boss,
      opts });
  } catch (e) {}
  wrap.innerHTML = '';
  if (!boss) {
    return;
  }
  const barBg = createEl(
    'div',
    {},
    {
      width: '300px',
      height: '18px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px',
      overflow: 'hidden',
    },
  );
  const bar = createEl('div');
  const pct = Math.max(0, Math.min(1, boss.hitsRemaining / (opts.requiredHits || 1)));
  setStyle(bar, {
    width: Math.round(pct * 100) + '%',
    height: '100%',
    background: 'linear-gradient(90deg,#ff6b6b,#ffcf6b)',
  });
  barBg.appendChild(bar);
  const label = createEl('div', { textContent: `Boss HP: ${boss.hitsRemaining || 0}` }, { marginTop: '6px' });
  wrap.appendChild(barBg);
  wrap.appendChild(label);

  // Add phase information
  if (boss.destructiveActive) {
    const phaseText =
      boss.currentPhase === 1
        ? 'Phase 1'
        : boss.currentPhase === 2
          ? 'Phase 2'
          : boss.currentPhase === 3
            ? 'Phase 3'
            : 'Phase 4';
    const phaseInfo = createEl(
      'div',
      {
        textContent: `${phaseText} (${boss.phaseMoveCount}/${opts.phaseDuration || 10})`,
      },
      {
        marginTop: '2px',
        fontSize: '12px',
        color: '#aaa',
      },
    );
    wrap.appendChild(phaseInfo);
  }

  // Add damage preview if modules are selected for boss damage
  try {
    if (game && game.bossShatterSelecting && game.selected && game.selected.length > 0) {
      const selectedModules = game.selected.filter(s => !(s.r === boss.r && s.c === boss.c));
      if (selectedModules.length > 0) {
        let totalDamage = 0;
        for (const sel of selectedModules) {
          if (sel && sel.cell) {
            const damageMap = {
              Common: 1,
              Rare: 2,
              'Rare+': 3,
              Epic: 9,
              'Epic+': 18,
              Legendary: 54,
              'Legendary+': 72,
              Mythic: 0,
              'Mythic+': 0,
              Ancestral: 0,
              'Ancestral+': 0,
              Boss: 0,
            };
            totalDamage += damageMap[sel.cell.rarity] || 0;
          }
        }
        if (totalDamage > 0) {
          const damagePreview = createEl(
            'div',
            {
              textContent: `-${totalDamage}`,
            },
            {
              marginTop: '4px',
              color: '#ff4444',
              fontWeight: 'bold',
              fontSize: '16px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            },
          );
          wrap.appendChild(damagePreview);
        }
      }
    }
  } catch (e) {
    /* ignore errors in damage preview */
  }

  try {
    console.debug && console.debug('renderOverlay updated DOM for boss hp', boss && boss.hitsRemaining);
  } catch (e) {}
}

function clearOverlay() {
  const el = document.getElementById('boss-overlay');
  if (el) {
    el.innerHTML = '';
  }
}

function init(gameApi, devOptions = {}) {
  game = gameApi;
  opts = { ...opts,
    ...(devOptions || {}) };
  ensureOverlay();
}

function setState(state) {
  try {
    if (!state) {
      // Clear boss state when null/falsy is passed
      boss = null;
      clearOverlay();
      try {
        game && game.setBossOnBoard && game.setBossOnBoard(null);
      } catch (e) {}
      try {
        if (typeof window !== 'undefined') {
          window.__BOSS_MARKER = null;
        }
      } catch (e) {}
      return;
    }
    if (state.opts && typeof state.opts === 'object') {
      opts = { ...opts,
        ...state.opts };
    }
    if (state.boss) {
      boss = { ...state.boss };
      try {
        game && game.setBossOnBoard && game.setBossOnBoard(boss);
      } catch (e) {}
      renderOverlay();
    } else if (state && typeof state.r === 'number') {
      boss = {
        r: state.r,
        c: state.c,
        hitsRemaining: state.hitsRemaining || opts.requiredHits,
        destructiveActive: !!state.destructiveActive,
        lastDestructiveTick: state.lastDestructiveTick || 0,
        // New phase tracking
        currentPhase: state.currentPhase || 1,
        phaseMoveCount: state.phaseMoveCount || 0,
        totalDestructiveMoves: state.totalDestructiveMoves || 0,
        // Wave counter
        waveCount: state.waveCount || 0,
      };
      try {
        game && game.setBossOnBoard && game.setBossOnBoard(boss);
      } catch (e) {}
      renderOverlay();
    }
  } catch (e) {}
}

function spawnIfEligible(r, c) {
  if (!game) {
    return;
  }
  if (boss) {
    return;
  }
  const roll = Math.random();
  if (roll < opts.spawnChance) {
    boss = {
      r,
      c,
      hitsRemaining: opts.requiredHits,
      destructiveActive: false,
      lastDestructiveTick: 0,
      // Initialize phase tracking
      currentPhase: 1,
      phaseMoveCount: 0,
      totalDestructiveMoves: 0,
      // Initialize wave counter
      waveCount: 0,
    };
    boss.applyDamage = amount => applyDamage(amount);
    try {
      game.setBossOnBoard(boss);
    } catch (e) {}
    renderOverlay();
    game.appendToDebug && game.appendToDebug('Boss spawned at ' + r + ',' + c + ' hits=' + boss.hitsRemaining);
  }
}

function onShatterResolved(usedPositions) {
  // Boss damage on shatter is completely disabled - boss damage now requires manual selection only
  return;
}

function onMoveAdvance() {
  if (!boss) {
    return;
  }
  try {
    const tick = game.moveCount || 0;
    const threshold = Number(opts.destructionThreshold || 20);
    const ticksSinceThreshold = tick - threshold;
    try {
      game &&
        game.appendToDebug &&
        game.appendToDebug(
          'onMoveAdvance tick=' +
            tick +
            ' threshold=' +
            threshold +
            ' destructiveActive=' +
            !!boss.destructiveActive +
            ' lastDestructiveTick=' +
            (boss.lastDestructiveTick || 0) +
            ' phase=' +
            boss.currentPhase +
            ' phaseMoves=' +
            boss.phaseMoveCount,
        );
    } catch (e) {}

    // Increment wave counter each move
    boss.waveCount = (boss.waveCount || 0) + 1;

    // Activate destructive behavior when threshold is reached
    if (!boss.destructiveActive && ticksSinceThreshold >= 0) {
      boss.destructiveActive = true;
      boss.currentPhase = 1;
      boss.phaseMoveCount = 0;
      boss.totalDestructiveMoves = 0;
      try {
        game &&
          game.appendToDebug &&
          game.appendToDebug('Boss destructive behavior activated at move ' + tick + ' - Phase 1 started');
      } catch (e) {}
    }

    if (boss.destructiveActive) {
      boss.phaseMoveCount++;
      let shouldDestroy = false;
      let frequency = 1; // Default to every move for final phase

      // Determine current phase and frequency using automatic progression
      if (boss.currentPhase === 1) {
        frequency = opts.moveThreshold; // Every moveThreshold moves
        if (boss.phaseMoveCount >= (opts.phaseDuration || 10)) {
          boss.currentPhase = 2;
          boss.phaseMoveCount = 0;
          try {
            game && game.appendToDebug && game.appendToDebug('Boss entered Phase 2 at move ' + tick);
          } catch (e) {}
        }
      } else if (boss.currentPhase === 2) {
        frequency = Math.max(1, opts.moveThreshold - 1); // Every (moveThreshold-1) moves
        if (boss.phaseMoveCount >= (opts.phaseDuration || 10)) {
          boss.currentPhase = 3;
          boss.phaseMoveCount = 0;
          try {
            game && game.appendToDebug && game.appendToDebug('Boss entered Phase 3 at move ' + tick);
          } catch (e) {}
        }
      } else if (boss.currentPhase === 3) {
        frequency = Math.max(1, opts.moveThreshold - 2); // Every (moveThreshold-2) moves
        if (boss.phaseMoveCount >= (opts.phaseDuration || 10)) {
          boss.currentPhase = 4;
          boss.phaseMoveCount = 0;
          try {
            game && game.appendToDebug && game.appendToDebug('Boss entered Phase 4 at move ' + tick);
          } catch (e) {}
        }
      } else if (boss.currentPhase === 4) {
        frequency = 1; // Every move
      }

      // Check if we should destroy this move based on frequency
      if (boss.currentPhase < 4) {
        shouldDestroy = boss.phaseMoveCount % frequency === 0;
      } else if (boss.currentPhase === 4) {
        shouldDestroy = true; // Every move in final phase
      }

      try {
        game &&
          game.appendToDebug &&
          game.appendToDebug(
            'onMoveAdvance shouldDestroy=' +
              shouldDestroy +
              ' phase=' +
              boss.currentPhase +
              ' frequency=' +
              frequency +
              ' phaseMoves=' +
              boss.phaseMoveCount,
          );
      } catch (e) {}

      if (shouldDestroy && boss.lastDestructiveTick !== tick) {
        const toClear = [];
        // Destroy all 8 surrounding tiles (including diagonals)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) {
              continue;
            } // Don't destroy the boss itself
            const rr = boss.r + dr,
              cc = boss.c + dc;
            if (rr < 0 || rr >= game.BOARD_ROWS || cc < 0 || cc >= game.BOARD_COLS) {
              continue;
            }
            toClear.push({ r: rr,
              c: cc });
          }
        }

        let removedAny = false;
        for (const p of toClear) {
          const rem = game.getCellAt && game.getCellAt(p.r, p.c);
          if (rem) {
            removedAny = true;
            try {
              if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                const shardMap = { Common: 5,
                  Rare: 10,
                  Epic: 40 };
                const shards = shardMap[rem.rarity] || 0;
                game.awardShards && game.awardShards(rem.type || 'Unknown', shards);
                try {
                  game.totalShatters = typeof game.totalShatters === 'number' ? game.totalShatters + 1 : 1;
                } catch (e) {}
              }
            } catch (e) {}
            game.removeCellAt && game.removeCellAt(p.r, p.c);
          }
        }

        boss.lastDestructiveTick = tick;
        boss.totalDestructiveMoves++;
        game.renderBoard && game.renderBoard();
        return removedAny;
      }
    }
  } catch (e) {}
  return false;
}

function setDevOptions(o) {
  const prevReq = opts.requiredHits;
  try {
    game &&
      game.appendToDebug &&
      game.appendToDebug(
        'setDevOptions called: ' +
          JSON.stringify(o) +
          ' prevOpts=' +
          JSON.stringify(opts) +
          ' bossHP=' +
          (boss ? boss.hitsRemaining : '<none>'),
      );
  } catch (e) {}
  try {
    console.debug && console.debug('setDevOptions', { o,
      prevOpts: opts,
      boss });
  } catch (e) {}
  opts = { ...opts,
    ...(o || {}) };
  try {
    // Only reset boss health if requiredHits actually changed AND boss exists
    // This prevents overwriting saved boss HP during restoration
    if (boss && typeof opts.requiredHits === 'number' && opts.requiredHits !== prevReq) {
      boss.hitsRemaining = opts.requiredHits;
      try {
        game &&
          game.appendToDebug &&
          game.appendToDebug(
            'setDevOptions: reset boss health to ' + opts.requiredHits + ' (requiredHits changed from ' + prevReq + ')',
          );
      } catch (e) {}
    }
  } catch (e) {}
  try {
    if (boss) {
      const tick = game && game.moveCount ? Number(game.moveCount) : 0;
      const threshold = Number(opts.destructionThreshold || 20);
      boss.destructiveActive = tick - threshold >= 0;
      // Reset phase tracking when options change
      if (boss.destructiveActive) {
        boss.currentPhase = 1;
        boss.phaseMoveCount = 0;
        boss.totalDestructiveMoves = 0;
      }
      try {
        game &&
          game.appendToDebug &&
          game.appendToDebug(
            'setDevOptions: applied to active boss: destructiveActive=' +
              boss.destructiveActive +
              ' tick=' +
              tick +
              ' threshold=' +
              threshold +
              ' phase reset to 1',
          );
      } catch (e) {}
      try {
        game && game.setBossOnBoard && game.setBossOnBoard(boss);
      } catch (e) {}
    }
  } catch (e) {}
  renderOverlay();
  try {
    game && game.renderBoard && game.renderBoard();
  } catch (e) {}
}

function getStateForSave() {
  return { boss: boss ? { ...boss } : null,
    opts: { ...opts } };
}

function applyDamage(amount) {
  try {
    if (!boss) {
      return false;
    }
    const dmg = Number(amount) || 0;
    if (dmg <= 0) {
      return false;
    }
    boss.hitsRemaining = Math.max(0, (boss.hitsRemaining || 0) - dmg);
    renderOverlay();
    try {
      game && game.setBossOnBoard && game.setBossOnBoard(boss);
    } catch (e) {}
    try {
      game && game.renderBoard && game.renderBoard();
    } catch (e) {}
    try {
      game && game.appendToDebug && game.appendToDebug('applyDamage: ' + dmg + ' -> boss.hp=' + boss.hitsRemaining);
    } catch (e) {}
    if (boss.hitsRemaining <= 0) {
      try {
        game && game.appendToDebug && game.appendToDebug('Boss defeated');
      } catch (e) {}
      try {
        game.onBossDefeated && game.onBossDefeated(boss);
      } catch (e) {}
      boss = null;
      clearOverlay();
      try {
        game.setBossOnBoard && game.setBossOnBoard(null);
      } catch (e) {}
      try {
        game && game.renderBoard && game.renderBoard();
      } catch (e) {}
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getBossWaveCount() {
  return boss ? boss.waveCount || 0 : 0;
}

function getBoss() {
  return boss ? { ...boss } : null;
}

// Dev tools helper function for easy boss configuration
function setBossPhases(destructionThreshold, moveThreshold, phaseDuration) {
  const opts = {
    destructionThreshold: destructionThreshold,
    moveThreshold: moveThreshold,
    phaseDuration: phaseDuration,
  };

  // Save to localStorage for persistence
  try {
    localStorage.setItem('devBossDestructionThreshold', destructionThreshold.toString());
    localStorage.setItem('devBossMoveThreshold', moveThreshold.toString());
    localStorage.setItem('devBossPhaseDuration', phaseDuration.toString());
  } catch (e) {}

  setDevOptions(opts);
  console.log('Boss phases configured:', opts);
  return opts;
}

// Make it globally available for dev tools
try {
  window.setBossPhases = setBossPhases;
} catch (e) {}

const bossHelper = {
  init,
  setState,
  spawnIfEligible,
  onShatterResolved,
  onMoveAdvance,
  renderOverlay,
  setDevOptions,
  getStateForSave,
  applyDamage,
  getBoss,
  getBossWaveCount,
  setBossPhases,
};

// --- Boss handler factory (keeps previous API) ----------------------------
export function makeBossHandlers(ctx = {}) {
  const getBoard = ctx.board || (() => []);
  const getRows = ctx.BOARD_ROWS || (() => 0);
  const getCols = ctx.BOARD_COLS || (() => 0);
  const awardShards = ctx.awardShards || (() => {});
  const cascadeResolve = ctx.cascadeResolve || (() => {});
  const bh = ctx.bossHelper || null;

  function canBossBeShattered(bossMarker) {
    if (!bossMarker) {
      return false;
    }
    try {
      const board = getBoard();
      const BOARD_ROWS = getRows();
      const BOARD_COLS = getCols();
      const r = bossMarker.r,
        c = bossMarker.c;
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        const r1 = r + dr,
          c1 = c + dc;
        const r2 = r + dr * 2,
          c2 = c + dc * 2;
        if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) {
          continue;
        }
        if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) {
          continue;
        }
        const n1 = board[r1] && board[r1][c1];
        const n2 = board[r2] && board[r2][c2];
        if (n1 && n2 && n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function shatterBossAtMarker(bossMarker) {
    if (!bossMarker) {
      return;
    }
    try {
      const board = getBoard();
      const BOARD_ROWS = getRows();
      const BOARD_COLS = getCols();
      const r = bossMarker.r,
        c = bossMarker.c;
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        const r1 = r + dr,
          c1 = c + dc;
        const r2 = r + dr * 2,
          c2 = c + dc * 2;
        if (r1 < 0 || r1 >= BOARD_ROWS || c1 < 0 || c1 >= BOARD_COLS) {
          continue;
        }
        if (r2 < 0 || r2 >= BOARD_ROWS || c2 < 0 || c2 >= BOARD_COLS) {
          continue;
        }
        const n1 = board[r1] && board[r1][c1];
        const n2 = board[r2] && board[r2][c2];
        if (!n1 || !n2) {
          continue;
        }
        if (n1.rarity === 'Common' && n2.rarity === 'Common' && n1.type === n2.type) {
          const removals = [
            { r: r1,
              c: c1,
              cell: n1 },
            { r: r2,
              c: c2,
              cell: n2 },
          ];
          for (const p of removals) {
            try {
              /* increment stats handled by caller if needed */
            } catch (e) {}
            try {
              const shardMap = { Common: 5,
                Rare: 10,
                Epic: 40 };
              awardShards(p.cell.type || 'Unknown', shardMap[p.cell.rarity] || 0);
            } catch (e) {}
            board[p.r][p.c] = null;
          }
          try {
            const posCells = removals.map(p => ({ r: p.r,
              c: p.c,
              cell: p.cell }));
            if (bh && bh.onShatterResolved) {
              bh.onShatterResolved(posCells);
            }
          } catch (e) {}
          try {
            cascadeResolve();
          } catch (e) {}
          return;
        }
      }
    } catch (e) {}
  }

  return { canBossBeShattered,
    shatterBossAtMarker };
}

// --- Boss initialization and integration (moved from main.js) ----------------
export function initBossIntegration(gameApi, devOptions = {}) {
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
          restoredDevOpts.spawnChance = v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v));
        }
      }
      if (h) {
        restoredDevOpts.requiredHits = parseInt(h, 10) || undefined;
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem(gameApi.SAVE_KEY || 'merge_game_v1');
      if (raw) {
        const st = JSON.parse(raw);
        if (st && st.settings) {
          if (!restoredDevOpts.spawnChance && st.settings.devBossSpawn) {
            restoredDevOpts.spawnChance = parseFloat(st.settings.devBossSpawn) || undefined;
          }
          if (!restoredDevOpts.requiredHits && st.settings.devBossHits) {
            restoredDevOpts.requiredHits = parseInt(st.settings.devBossHits, 10) || undefined;
          }
          if (!restoredDevOpts.destructionThreshold && st.settings.devBossThreshold) {
            restoredDevOpts.destructionThreshold = parseInt(st.settings.devBossThreshold, 10) || undefined;
          }
        }
      }
    } catch (e) {}

    // Initialize boss helper with the game API
    bossHelper.init(gameApi, { ...restoredDevOpts,
      ...devOptions });

    // Ensure boss marker and helper opts are restored from main save payload if present
    try {
      const rawMain = localStorage.getItem(gameApi.SAVE_KEY || 'merge_game_v1');
      if (rawMain) {
        const st = JSON.parse(rawMain);
        if (st && st.bossState) {
          const bs = st.bossState;
          // write helper-local key for compatibility
          try {
            localStorage.setItem('boss_state_v1', JSON.stringify(bs));
          } catch (e) {}
          // pass the saved state into the boss helper explicitly via setState
          try {
            bossHelper.setState(bs);
          } catch (e) {}
          // apply saved opts if present
          if (bs.opts && typeof bs.opts === 'object') {
            try {
              bossHelper.setDevOptions && bossHelper.setDevOptions(bs.opts);
              gameApi.appendToDebug && gameApi.appendToDebug('Restored boss opts from main save');
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error('initBossIntegration: restore-from-save failed', e);
    }

    // Apply persisted dev boss overrides if present in localStorage (separate from main save)
    try {
      const s = localStorage.getItem('devBossSpawn');
      const h = localStorage.getItem('devBossHits');
      const mt = localStorage.getItem('devBossMoveThreshold');
      const dt = localStorage.getItem('devBossDestructionThreshold');
      const pd = localStorage.getItem('devBossPhaseDuration');
      try {
        console.debug('initBossIntegration: loaded devBoss keys', { s,
          h,
          mt,
          dt,
          pd });
      } catch (e) {}
      const opts = {};
      if (s) {
        const v = parseFloat(s);
        if (!isNaN(v)) {
          opts.spawnChance = v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v));
        }
      }
      if (h) {
        opts.requiredHits = parseInt(h, 10) || undefined;
      }
      if (mt) {
        opts.moveThreshold = parseInt(mt, 10) || undefined;
      }
      if (dt) {
        opts.destructionThreshold = parseInt(dt, 10) || undefined;
      }
      if (pd) {
        opts.phaseDuration = parseInt(pd, 10) || undefined;
      }
      if (Object.keys(opts).length > 0) {
        try {
          bossHelper.setDevOptions && bossHelper.setDevOptions(opts);
          gameApi.appendToDebug && gameApi.appendToDebug('Applied persisted boss dev opts: ' + JSON.stringify(opts));
          console.debug('Applied persisted boss dev opts', opts);
        } catch (e) {
          console.error('Failed applying persisted boss dev opts', e);
        }
      }
    } catch (e) {
      console.error('Error reading persisted boss dev opts', e);
    }
  } catch (e) {
    console.error('initBossIntegration failed', e);
  }
}

export default bossHelper;
