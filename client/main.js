import { initBossIntegration } from './entities/boss.js';
import { rand } from './utils/random.js';
import { formatBackgroundDisplay, formatTimer } from './utils/format.js';
import './style.css';
// Also import the chart image using the root import pattern (mirrors the example)
// merged chart and boss image are provided via ./assets/index.js
import bossHelper from './entities/boss.js';
import {
  predictMergeResult as _predictMergeResult,
  hasStraightTriple as _hasStraightTriple,
  extractStraightRunPositions as _extractStraightRunPositions,
  findAllGroups as _findAllGroups,
} from './game/engine.js';
import * as boardModule from './game/board.js';
import { COMMON_TEMPLATES, ALL_TEMPLATES } from './game/templates.js';
// Game rules (centralized): rarity ranks, base rates and helper predicates
import {
  RARITY_RANK,
  BASE_RATES,
  requiredTotalForBaseCell,
  canBeFodder,
  sameTemplate,
  isAncestralStarUpgrade,
  upgradeAncestralStars,
} from './game/rules.js';
import { makeSpawner } from './game/spawn.js';
import {
  ASSETS,
  BACKGROUNDS,
  TYPE_TOKENS,
  importedMergeChart as IMPORTED_MERGE_CHART,
  BOSS_IMG,
  MINE_ASSET,
} from './assets/index.js';
import { createModuleInstance, normalizeId } from './entities/moduleFactory.js';
import {
  pendingExplosions,
  isDisabledByMine as minesIsDisabledByMine,
  maybeConvertToMine,
  processMineCountdowns,
  setMineSpawnPercent,
} from './entities/mines.js';
import { makeInventoryHelpers } from './entities/inventory.js';
import { makeStateHelpers } from './game/stateHelpers.js';
import { makeInventoryUI } from './ui/inventoryUI.js';
import { renderBoard as _renderBoard, buildMiniShape } from './ui/renderBoard.js';
import { appendToDebug, ensureDebugConsole, positionDebugPortal } from './ui/debugConsole.js';
// Import utility modules
import { applyBackground } from './utils/background.js';
import { lazyPreloadAssets, getModuleDamageValue } from './utils/assets.js';
import {
  startGameTimer,
  resetGameTimer,
} from './utils/timer.js';
import { updateScoreUI, ensureGameTimerPlaced, initScoreUI } from './utils/ui.js';
import { adjustRightColumnToBoard } from './utils/layout.js';
import { findTemplate } from './utils/templates.js';
import { getBoardStateHash, ensureHintStyles } from './utils/helpers.js';

// Import hint system
import {
  updateHintMovesList,
  resetInactivity,
  setupInactivityListeners,
  resetHintCyclingState,
  getHintMovesList,
  getCurrentHintIndex,
  setCurrentHintIndex,
  getLastBoardState,
  getHintMove,
  setHintMove,
  setHintSystemDependencies,
} from './utils/hintSystem.js';

// Import selection utilities
import { isInvSel, isBoardSel } from './utils/selection.js';

// Import merge preview module
import { makeMergePreview } from './ui/mergePreview.js';

// Import merge candidates module
import { makeMergeCandidates } from './utils/mergeCandidates.js';

// Import merge engine module
import { makeMergeEngine } from './game/mergeEngine.js';

// Import board bindings module
import { makeBoardBindings } from './utils/boardBindings.js';

// Global animation speed multiplier (1 = normal). Controlled by UI slider.
let animSpeed = 1.0;
// When true, skip image assets and render vector shapes only (helps measure perf impact)
let useVectorOnly = false;

// --- Persistence: save/load game state to localStorage so changes persist across reloads ---
const SAVE_KEY = 'merge_game_v1';

// Wrapper function to provide dependencies to the renderBoard function
function renderBoard() {
  _renderBoard({
    BOARD_COLS,
    BOARD_ROWS,
    board,
    selected,
    mergeSelecting,
    bossShatterSelecting,
    candidateHighlights,
    isDisabledByMine,
    bossImg,
    badLuckCounter,
    inventory,
    updateScoreUI,
    updateMergePreview,
    shuffleRemaining,
    ensureControls,
    saveGameState,
    resetInactivity,
    adjustRightColumnToBoard,
    evaluateMergeAttempt,
    onCellClick,
    onCellContextMenu,
    handleLongPress,
    longPressTimer,
    appendToDebug,
    hintMove: getHintMove(),
    useVectorOnly,
    findTemplate,
    HARDCODED_COMMON_SELECTION,
    MINE_ASSET,
    RARITY_COLOR,
    ASSETS,
    predictMergeResult: _predictMergeResult,
  });
}
// Import using a relative path from this file to the assets folder so Vite/dev server can resolve it.
// Expect the asset to live in the client folder root so Vite can resolve it when serving from the client root
// Use root-style import like the example so Vite resolves the asset to a dev URL

// Debug verbosity control: set window.__MERGE_GAME_DEBUG_VERBOSE = true in the browser console
// to re-enable verbose debug output. Default is quiet (console.debug is no-op).
try {
  if (typeof window !== 'undefined') {
    if (!window.__MERGE_GAME_DEBUG_VERBOSE) {
      try {
        console.debug = function() {};
      } catch (e) {} // eslint-disable-line no-empty
    }
  }
} catch (e) {} // eslint-disable-line no-empty

// Backwards-compatible local names expected by the rest of main.js
const importedMergeChart = IMPORTED_MERGE_CHART;
const bossImg = BOSS_IMG;

// UI factories instantiated at runtime. main.js remains the runtime owner; these
// variables hold factory instances created inside initUI.

// Boss handlers moved to ./entities/boss.js; instantiate with runtime getters below

// Hardcoded common selection map: map normalized templateId -> common key to use (e.g. 'common_mc' or 'common_ec').
// Populate this with the exact template -> common key assignments you want to hard-wire.
const HARDCODED_COMMON_SELECTION = {
  // Example:
  // 'templ1': 'common_mc',
  // 'templ2': 'common_ec',
};

// Resolve asset keys/URLs for a module instance and attach them to the object so the choice is stable.
// This function is now provided by ./utils/assets.js

// Toggle this to show/hide the Dev tools button in the game UI. When `dev` is false,
// the Show/Hide Dev tools control will not appear.
// Runtime visibility state for the dev tools portal (console). Defaults to visible.
let DEV_TOOLS_VISIBLE = true;
// Timer state (seconds elapsed)
let gameTimerInterval = null;
let gameTimerStart = null; // epoch ms when timer started

// formatTimer is provided by ./utils/format.js

// Top-level debug: log the imported value early so we can see it even if DOMContentLoaded doesn't fire
try {
  console.debug('Top-level mergeChart import value:', importedMergeChart);
} catch (e) {} // eslint-disable-line no-empty

// Synchronously detect & remove any immediate shatterable groups (Commons always; Rares if enabled).
// This runs without animation to ensure no groups formed by a swap are missed, then returns true
// if any groups were removed. After calling this you should invoke `cascadeResolve()` to animate
// further cascades and falling tiles.
async function resolveImmediateShatters() {
  // detect groups same as in cascadeResolve
  const groups = findAllGroups(cell => {
    if (!cell) {
      return false;
    }
    if (cell.rarity === 'Common') {
      return true;
    }
    if (cell.rarity === 'Rare' && !cell.plus) {
      return !!autoShatterRares;
    }
    return false;
  }).filter(g => g.length >= 3 && hasStraightTriple(g));
  if (!groups || groups.length === 0) {
    return false;
  }

  // mark groups for clearing so we can show the clearing animation
  // mark only straight-run positions for clearing animation
  const immediatePositions = [];
  for (const g of groups) {
    const straight = extractStraightRunPositions(g);
    for (const p of straight) {
      const c = board[p.r][p.c];
      if (c) {
        c.clearing = true;
      }
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
            const shardMap = { Common: 5,
              Rare: 10,
              Epic: 40 };
            const shards = shardMap[rem.rarity] || 0;
            const shType = rem.type || 'Unknown';
            awardShards(shType, shards);
            totalShatters = typeof totalShatters === 'number' ? totalShatters + 1 : 1;
          } catch (e) {} // eslint-disable-line no-empty
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

// Templates and rarity constants are now provided by ./game/templates.js

// --- Mine feature: spawn a mine by percent chance per new tile (configurable)
let MINE_SPAWN_PERCENT = 1; // default: 1% chance per new tile
try {
  const saved = localStorage.getItem('devMineRate');
  if (saved) {
    MINE_SPAWN_PERCENT = Math.max(0, parseFloat(saved) || 1);
  }
} catch (e) {} // eslint-disable-line no-empty

// mine logic moved to ./entities/mines.js

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
      const commons = Object.keys(map)
        .filter(k => k.startsWith('common_'))
        .sort();
      if (commons.length === 0) {
        continue;
      }
      const list = byType[type];
      for (let i = 0; i < list.length; i++) {
        const tmpl = normalizeId(list[i].id || list[i].templateId || list[i].name || '');
        const chosen = commons[i % commons.length];
        HARDCODED_COMMON_SELECTION[tmpl] = chosen;
      }
    }
  }
} catch (e) {
  /* ignore */
}

// For simplicity, drops pick a rarity according to BASE_RATES, then pick a template uniformly among MODULE_TEMPLATES
// Epic drop redistributions are handled when Ancestral 5-star modules are completed

let board = []; // grid of module instances or null

// Helper: initialize or refresh bindings for the board module using getters so the
// board module always resolves live values even if `board` is reassigned.
function ensureBoardBindings() {
  try {
    boardModule.initBoard({
      board: () => board,
      BOARD_ROWS: () => BOARD_ROWS,
      BOARD_COLS: () => BOARD_COLS,
      renderBoard: renderBoard,
      renderInventory: renderInventory,
      makeDrop: makeDrop,
      awardShards: awardShards,
      bossHelper: bossHelper,
      pendingExplosions: pendingExplosions,
      sleepAnimated: sleepAnimated,
      // support both calling signatures: findAllGroups(pred) or findAllGroups(board, pred)
      // or findAllGroups(board, pred, BOARD_ROWS, BOARD_COLS)
      findAllGroups: (b, pred, rows, cols) => {
        try {
          if (typeof pred === 'undefined') {
            pred = b;
            b = board;
            rows = BOARD_ROWS;
            cols = BOARD_COLS;
          } else if (typeof rows === 'undefined') {
            rows = BOARD_ROWS;
            cols = BOARD_COLS;
          }
          return _findAllGroups(b, pred, rows, cols);
        } catch (e) {
          return [];
        }
      },
      hasStraightTriple: _hasStraightTriple,
      extractStraightRunPositions: _extractStraightRunPositions,
      autoShatterRares: () => autoShatterRares,
      isDisabledByMine: isDisabledByMine,
      awardShardsCallback: awardShards,
      cascadeResolve: cascadeResolve,
    });
  } catch (e) {
    try {
      console.debug && console.debug('ensureBoardBindings failed', e);
    } catch (ee) {}
  }

  // Initialize hint system dependencies
  try {
    setHintSystemDependencies({
      getBoardStateHash: () => getBoardStateHash(board),
      findValidMovesList: () => findValidMovesList(),
      board: () => board,
      findAllGroups: (b, pred, rows, cols) => {
        try {
          if (typeof pred === 'undefined') {
            pred = b;
            b = board;
            rows = BOARD_ROWS;
            cols = BOARD_COLS;
          } else if (typeof rows === 'undefined') {
            rows = BOARD_ROWS;
            cols = BOARD_COLS;
          }
          return _findAllGroups(b, pred, rows, cols);
        } catch (e) {
          return [];
        }
      },
      BOARD_ROWS: () => BOARD_ROWS,
      BOARD_COLS: () => BOARD_COLS,
      hasStraightTriple: _hasStraightTriple,
      autoShatterRares: () => autoShatterRares,
      appendToDebug: appendToDebug,
      createBoard: createBoard,
      renderBoard: renderBoard,
      renderInventory: renderInventory,
      cascadeResolve: cascadeResolve,
    });
  } catch (e) {
    try {
      console.debug && console.debug('setHintSystemDependencies failed', e);
    } catch (ee) {}
  }
}
let selected = []; // selections (first is base)
let animating = false;
let badLuckCounter = 0; // replenishes since last Epic
let inventory = { Cannon: null,
  Generator: null,
  Armor: null,
  Core: null }; // one slot per type
let completed = {}; // id -> stars (when 5★ Ancestral completed, moved here)
let shuffleRemaining = 3; // number of allowed shuffles
let score = 0; // player score from shattering
// Session stats
let moveCount = 0;
let totalMerges = 0;
let totalShatters = 0; // count of module shatters (not shards)
let shardsEarned = { Cannon: 0,
  Armor: 0,
  Generator: 0,
  Core: 0 };
let autoShatterRares = false; // whether cascade auto-shatters plain Rares (not Rare+)
let longPressTimer = null; // for pointer long-press detection
let mergeSelecting = false; // true while user is in long-press merge selection mode
let mineShatterSelecting = false; // true while user is in mine shatter selection mode
let bossShatterSelecting = false; // true while user is in boss shatter selection mode
let invalidClickCount = 0; // tracks consecutive clicks outside valid areas to exit selection modes
let baseClickCount = 0; // tracks consecutive clicks on base to exit selection modes when requirements not met
let candidateHighlights = new Set(); // set of 'r,c' strings for auto-highlighted candidates
// Dev toggle: allow swapping any tiles regardless of adjacency/rules
// Free-swap is now the default game behavior: allow non-adjacent swaps by default
// inactivity / hinting
// Moved to utils/hintSystem.js

// helpers (centralized)
// rand and uid provided by ./utils/random.js

// createModuleInstance, normalizeId and stableHash moved to ./entities/moduleFactory.js

// Centralized shard awarding helper so updates always refresh UI and emit debug logs
// awardShards moved into `client/game/stateHelpers.js` and bound via makeStateHelpers;
// a runtime binding named `awardShards` is created later with the state helper.

// window export of awardShards is done after state helpers are initialized below

// mine logic (createMineInstance, pendingExplosions, isDisabledByMine) moved to ./entities/mines.js

// spawn functions (moved to game/spawn.js). Initialize via factory so they use main.js runtime state.
let makeDrop;
{
  const spawner = makeSpawner({
    rand: rand,
    BASE_RATES: BASE_RATES,
    ALL_TEMPLATES: ALL_TEMPLATES,
    RARITY_RANK: RARITY_RANK,
    createModuleInstance: createModuleInstance,
    appendToDebug: appendToDebug,
    localStorage: window && window.localStorage ? window.localStorage : null,
    getBadLuck: () => badLuckCounter,
    setBadLuck: v => {
      badLuckCounter = v;
    },
  });
  makeDrop = spawner.makeDrop;
}

// inventory UI functions (moved to ui/inventoryUI.js). Initialize via factory so they use main.js runtime state.
let renderInventory;
{
  const inventoryUI = makeInventoryUI({
    getBoard: () => board,
    getInventory: () => inventory,
    getSelected: () => selected,
    setSelected: v => {
      selected = v;
    },
    renderBoard: renderBoard,
    renderInventory: renderInventory,
    cascadeResolve: cascadeResolve,
    appendToDebug: appendToDebug,
    getBossMarker: () => window.__BOSS_MARKER,
    useVectorOnly: useVectorOnly,
    RARITY_COLOR: RARITY_COLOR,
    ASSETS: ASSETS,
    HARDCODED_COMMON_SELECTION: HARDCODED_COMMON_SELECTION,
    MINE_ASSET: MINE_ASSET,
    buildMiniShape: buildMiniShape,
  });
  renderInventory = inventoryUI.renderInventory;
}

// merge preview UI functions (moved to ui/mergePreview.js). Initialize via factory so they use main.js runtime state.
let updateMergePreview;
{
  const mergePreview = makeMergePreview({
    getBoard: () => board,
    getInventory: () => inventory,
    getSelected: () => selected,
    setSelected: v => {
      selected = v;
    },
    renderBoard: renderBoard,
    cascadeResolve: cascadeResolve,
    appendToDebug: appendToDebug,
    getBossMarker: () => window.__BOSS_MARKER,
    useVectorOnly: useVectorOnly,
    RARITY_COLOR: RARITY_COLOR,
    ASSETS: ASSETS,
    HARDCODED_COMMON_SELECTION: HARDCODED_COMMON_SELECTION,
    MINE_ASSET: MINE_ASSET,
    buildMiniShape: buildMiniShape,
    predictMergeResult: predictMergeResult,
    requiredTotalForBaseCell: requiredTotalForBaseCell,
    bossHelper: bossHelper,
    candidateHighlights: candidateHighlights,
    mergeSelecting: mergeSelecting,
    mineShatterSelecting: mineShatterSelecting,
    bossShatterSelecting: bossShatterSelecting,
    performMineShatter: performMineShatter,
    damageBossWithModules: damageBossWithModules,
    evaluateMergeAttempt: evaluateMergeAttempt,
    getMergeSelecting: () => mergeSelecting,
    getMineShatterSelecting: () => mineShatterSelecting,
    getBossShatterSelecting: () => bossShatterSelecting,
    getCandidateHighlights: () => candidateHighlights,
    clearCandidateHighlights: () => candidateHighlights.clear(),
  });
  updateMergePreview = mergePreview.updateMergePreview;
}

// merge candidates functions (moved to utils/mergeCandidates.js).
// Initialize via factory so they use main.js runtime state.
let mergeCandidates;
{
  const candidates = makeMergeCandidates({
    ALL_TEMPLATES: ALL_TEMPLATES,
    canBeFodder: canBeFodder,
    appendToDebug: appendToDebug,
    BOARD_ROWS: BOARD_ROWS,
    BOARD_COLS: BOARD_COLS,
  });
  mergeCandidates = candidates;
}

// merge engine functions (moved to game/mergeEngine.js). Initialize via factory so they use main.js runtime state.
let mergeEngine;
{
  const engine = makeMergeEngine({
    ALL_TEMPLATES: ALL_TEMPLATES,
    canBeFodder: canBeFodder,
    sameTemplate: sameTemplate,
    isAncestralStarUpgrade: isAncestralStarUpgrade,
    upgradeAncestralStars: upgradeAncestralStars,
    createModuleInstance: createModuleInstance,
    placeNewAt: placeNewAt,
    removeCells: removeCells,
    renderBoard: renderBoard,
    renderInventory: renderInventory,
    cascadeResolve: cascadeResolve,
    resetHintCyclingState: resetHintCyclingState,
    isDisabledByMine: isDisabledByMine,
    appendToDebug: appendToDebug,
    board: board,
    inventory: inventory,
    selected: selected,
    mergeSelecting: mergeSelecting,
    candidateHighlights: candidateHighlights,
    BOARD_ROWS: BOARD_ROWS,
    BOARD_COLS: BOARD_COLS,
    completed: completed,
    totalMerges: totalMerges,
  });
  mergeEngine = engine;
}

function createBoard() {
  try {
    appendToDebug && appendToDebug('createBoard called');
  } catch (e) {} // eslint-disable-line no-empty
  try {
    console.debug && console.debug('createBoard() stack', new Error().stack);
  } catch (e) {} // eslint-disable-line no-empty
  board = [];
  try {
    ensureBoardBindings();
  } catch (e) {} // eslint-disable-line no-empty
  for (let r = 0; r < BOARD_ROWS; r++) {
    const row = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      row.push(makeDrop());
    }
    board.push(row);
  }
}

// Lazy asset preloader: creates Image() objects for a curated set of assets after the

// Shuffle the board in-place with a small spawning animation, then run cascadeResolve()
async function shuffleBoardAnimated() {
  if (shuffleRemaining <= 0) {
    alert('No shuffles remaining');
    return;
  }
  shuffleRemaining = Math.max(0, shuffleRemaining - 1);
  // gather all non-null cells and shuffle positions
  const cells = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r] && board[r][c]) {
        cells.push(board[r][c]);
      }
    }
  }
  // fill any remaining spots with nulls to keep size consistent
  while (cells.length < BOARD_ROWS * BOARD_COLS) {
    cells.push(null);
  }
  // Fisher-Yates
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }
  // place back into board and mark as spawning for brief animation
  let idx = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = cells[idx++];
      board[r][c] = cell;
      if (cell) {
        cell.spawning = true;
      }
    }
  }
  renderBoard();
  // brief pause to show spawning animation
  await sleepAnimated(120);
  // clear spawning flags
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] && board[r][c].spawning) {
        delete board[r][c].spawning;
      }
    }
  }
  renderBoard();
  // run cascade resolution to handle any auto-shatters produced by the shuffle
  cascadeResolve();
}

// Rendering

// Dev helper: call from browser console to simulate awarding shards and force UI update.
// Example: runShardDebug() will show console logs and increment Core by 15.
try {
  window.runShardDebug = function() {
    try {
      console.debug && console.debug('runShardDebug: pre', JSON.stringify(shardsEarned));
    } catch (e) {} // eslint-disable-line no-empty
    try {
      awardShards('Core', 15);
    } catch (e) {} // eslint-disable-line no-empty
    try {
      console.debug && console.debug('runShardDebug: post', JSON.stringify(shardsEarned));
    } catch (e) {} // eslint-disable-line no-empty
  };
} catch (e) {} // eslint-disable-line no-empty

// ensure CSS rule exists when toggled
function applyDisableAnimations(disable) {
  try {
    if (disable) {
      document.documentElement.classList.add('no-animations');
      let s = document.getElementById('no-animations-style');
      if (!s) {
        s = document.createElement('style');
        s.id = 'no-animations-style';
        s.textContent = 'html.no-animations * { animation: none !important; transition: none !important; }';
        document.head.appendChild(s);
      }
    } else {
      document.documentElement.classList.remove('no-animations');
    }
  } catch (e) {} // eslint-disable-line no-empty
}

// Ensure spawn/shuffle/restart controls exist and are wired even if #game-board preexists
function ensureControls() {
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) {
    return;
  }
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
      inventory = { Cannon: null,
        Generator: null,
        Armor: null,
        Core: null };
      shuffleRemaining = 3;
      // commonSwapRemaining is deprecated - free swap is now permanent
      // reset session stats and shard totals
      try {
        moveCount = 0;
      } catch (e) {} // eslint-disable-line no-empty
      try {
        totalMerges = 0;
      } catch (e) {} // eslint-disable-line no-empty
      try {
        totalShatters = 0;
      } catch (e) {} // eslint-disable-line no-empty
      try {
        shardsEarned = { Cannon: 0,
          Armor: 0,
          Generator: 0,
          Core: 0 };
      } catch (e) {} // eslint-disable-line no-empty
      try {
        score = 0;
      } catch (e) {} // eslint-disable-line no-empty
      // clear boss state on restart
      try {
        window.__BOSS_MARKER = null;
      } catch (e) {} // eslint-disable-line no-empty
      try {
        bossHelper.setState && bossHelper.setState(null);
      } catch (e) {} // eslint-disable-line no-empty
      // rebuild board and UI
      createBoard();
      renderBoard();
      renderInventory();
      try {
        lazyPreloadAssets();
      } catch (e) {} // eslint-disable-line no-empty
      try {
        // Initialize board module with bindings to main.js state and helpers
        ensureBoardBindings();
      } catch (e) {
        try {
          console.debug && console.debug('boardModule.initBoard failed', e);
        } catch (ee) {} // eslint-disable-line no-empty
      }
      try {
        updateScoreUI();
      } catch (e) {} // eslint-disable-line no-empty
      try {
        saveGameState();
      } catch (e) {} // eslint-disable-line no-empty
      try {
        cascadeResolve();
      } catch (e) {} // eslint-disable-line no-empty
      // reset and start timer for new game
      try {
        resetGameTimer();
        startGameTimer();
      } catch (e) {} // eslint-disable-line no-empty
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
    rareCb.addEventListener('change', () => {
      autoShatterRares = rareCb.checked;
      try {
        saveGameState();
      } catch (e) {} // eslint-disable-line no-empty
    });
    const rareLabel = document.createElement('span');
    rareLabel.textContent = 'Auto-shatter Rares';
    rareWrap.appendChild(rareCb);
    rareWrap.appendChild(rareLabel);
    settingsMenu.appendChild(rareWrap);

    // Orientation toggle
    const btnOrient = document.createElement('button');
    btnOrient.id = 'btn-orient';
    const updateOrientLabel = () => {
      btnOrient.textContent = 'Orientation: ' + (ORIENTATION === 'portrait' ? 'Portrait' : 'Landscape');
    };
    updateOrientLabel();
    btnOrient.addEventListener('click', () => {
      ORIENTATION = ORIENTATION === 'portrait' ? 'landscape' : 'portrait';
      const targetRows = BOARD_COLS;
      const targetCols = BOARD_ROWS;
      if (!board || !Array.isArray(board) || board.length === 0 || !board[0]) {
        if (ORIENTATION === 'landscape') {
          BOARD_ROWS = 8;
          BOARD_COLS = 14;
        } else {
          BOARD_ROWS = 14;
          BOARD_COLS = 8;
        }
        updateOrientLabel();
        try {
          saveGameState();
        } catch (e) {} // eslint-disable-line no-empty
        createBoard();
        renderBoard();
        renderInventory();
        return;
      }
      const oldRows = BOARD_ROWS;
      const oldBoard = board;
      const rotated = [];
      for (let r = 0; r < targetRows; r++) {
        const row = [];
        for (let c = 0; c < targetCols; c++) {
          const srcR = oldRows - 1 - c;
          const srcC = r;
          row.push(oldBoard[srcR] && oldBoard[srcR][srcC] ? oldBoard[srcR][srcC] : null);
        }
        rotated.push(row);
      }
      for (let i = 0; i < selected.length; i++) {
        const s = selected[i];
        if (!s) {
          continue;
        }
        if (typeof s.r === 'number' && typeof s.c === 'number') {
          const nr = oldRows - 1 - s.c;
          const nc = s.r;
          selected[i] = { ...s,
            r: nr,
            c: nc };
        }
      }
      if (getHintMove()) {
        try {
          const hm = getHintMove();
          const hr = hm.r,
            hc = hm.c;
          const hnr = oldRows - 1 - hc;
          const hnc = hr;
          setHintMove({ ...hm,
            r: hnr,
            c: hnc });
          if (typeof hm.nr === 'number' && typeof hm.nc === 'number') {
            const nr2 = oldRows - 1 - hm.nc;
            const nc2 = hm.nr;
            setHintMove({ ...getHintMove(),
              nr: nr2,
              nc: nc2 });
          }
        } catch (e) {} // eslint-disable-line no-empty
      }
      if (candidateHighlights && candidateHighlights.size > 0) {
        const newSet = new Set();
        for (const k of candidateHighlights) {
          const parts = k.split(',');
          if (parts.length !== 2) {
            continue;
          }
          const rr = parseInt(parts[0], 10);
          const cc = parseInt(parts[1], 10);
          if (Number.isFinite(rr) && Number.isFinite(cc)) {
            const nr = oldRows - 1 - cc;
            const nc = rr;
            newSet.add(nr + ',' + nc);
          }
        }
        candidateHighlights.clear();
        for (const k of newSet) {
          candidateHighlights.add(k);
        }
      }
      board = rotated;
      try {
        ensureBoardBindings();
      } catch (e) {} // eslint-disable-line no-empty
      BOARD_ROWS = targetRows;
      BOARD_COLS = targetCols;
      updateOrientLabel();
      try {
        saveGameState();
      } catch (e) {} // eslint-disable-line no-empty
      renderBoard();
      renderInventory();
      try {
        positionDebugPortal();
      } catch (e) {} // eslint-disable-line no-empty
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
    try {
      animCb.checked = !!localStorage.getItem('disableAnimations') && localStorage.getItem('disableAnimations') !== '0';
    } catch (e) {
      animCb.checked = false;
    }
    const animLabel = document.createElement('span');
    animLabel.textContent = 'Disable animations';
    animWrap.appendChild(animCb);
    animWrap.appendChild(animLabel);
    settingsMenu.appendChild(animWrap);
    animCb.addEventListener('change', () => {
      const disabled = !!animCb.checked;
      try {
        localStorage.setItem('disableAnimations', disabled ? '1' : '0');
      } catch (e) {} // eslint-disable-line no-empty
      applyDisableAnimations(disabled);
    });
    // apply initial state
    try {
      applyDisableAnimations(!!animCb.checked);
    } catch (e) {} // eslint-disable-line no-empty

    // Choose Background dropdown
    try {
      const bgWrap = document.createElement('label');
      bgWrap.style.display = 'flex';
      bgWrap.style.flexDirection = 'column';
      bgWrap.style.gap = '6px';
      const bgTitle = document.createElement('span');
      bgTitle.textContent = 'Choose Background';
      bgTitle.style.fontWeight = '600';
      const bgSelect = document.createElement('select');
      bgSelect.id = 'sel-background';
      // first option: none
      const noneOpt = document.createElement('option');
      noneOpt.value = '';
      noneOpt.textContent = 'None';
      bgSelect.appendChild(noneOpt);
      // populate from BACKGROUNDS map (sorted)
      const bgKeys = Object.keys(BACKGROUNDS).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      for (const k of bgKeys) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = formatBackgroundDisplay(k);
        bgSelect.appendChild(opt);
      }
      // reflect saved state
      try {
        const saved = localStorage.getItem('background');
        if (saved) {
          bgSelect.value = saved;
        }
      } catch (e) {} // eslint-disable-line no-empty
      // wire change
      bgSelect.addEventListener('change', () => {
        const v = bgSelect.value || '';
        applyBackground(v);
      });
      bgWrap.appendChild(bgTitle);
      bgWrap.appendChild(bgSelect);
      settingsMenu.appendChild(bgWrap);
      // apply initial background now
      try {
        const saved = localStorage.getItem('background');
        applyBackground(saved || '');
      } catch (e) {} // eslint-disable-line no-empty
    } catch (e) {
      /* ignore UI failures */
    }

    // Dev tools toggle (always placed last in menu when present)
    // avoid creating duplicate buttons when UI is re-rendered
    if (!document.getElementById('btn-devtools-toggle')) {
      const btnDevTools = document.createElement('button');
      btnDevTools.id = 'btn-devtools-toggle';
      btnDevTools.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
      btnDevTools.addEventListener('click', () => {
        DEV_TOOLS_VISIBLE = !DEV_TOOLS_VISIBLE;
        const wrap = document.getElementById('debug-console-wrap');
        if (DEV_TOOLS_VISIBLE) {
          try {
            ensureDebugConsole();
          } catch (e) {} // eslint-disable-line no-empty
          const w = document.getElementById('debug-console-wrap');
          if (w) {
            w.style.display = 'block';
          }
          try {
            positionDebugPortal();
          } catch (e) {} // eslint-disable-line no-empty
          btnDevTools.textContent = 'Hide Dev tools';
        } else {
          if (wrap) {
            wrap.style.display = 'none';
          }
          btnDevTools.textContent = 'Show Dev tools';
        }
      });
      settingsMenu.appendChild(btnDevTools);
    }

    // show/hide menu and position it (prefer opening upward above the button)
    btnSettings.addEventListener('click', ev => {
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
          settingsMenu.style.top = aboveTop + 'px';
        } else {
          // fallback: position below the button
          const belowTop = rect.bottom + 8;
          settingsMenu.style.left = left + 'px';
          settingsMenu.style.top = belowTop + 'px';
        }
        settingsMenu.style.visibility = 'visible';
      } catch (e) {
        try {
          settingsMenu.style.display = 'flex';
          settingsMenu.style.visibility = 'visible';
        } catch (ee) {} // eslint-disable-line no-empty
      }
    });
    // hide when clicking outside (ignore clicks inside the menu or on the settings button)
    document.addEventListener('click', ev => {
      try {
        const t = ev && ev.target;
        if (!t) {
          settingsMenu.style.display = 'none';
          rulesMenu && (rulesMenu.style.display = 'none');
          return;
        }
        // if the click happened inside the settings menu or on the settings button, do nothing
        if ((settingsMenu && settingsMenu.contains(t)) || (btnSettings && btnSettings.contains(t))) {
          return;
        }
        // if the click happened inside the rules menu or on the rules button, do nothing
        if (
          (typeof rulesMenu !== 'undefined' && rulesMenu && rulesMenu.contains(t)) ||
          (typeof btnRules !== 'undefined' && btnRules && btnRules.contains(t))
        ) {
          return;
        }
        // otherwise hide both menus
        try {
          settingsMenu.style.display = 'none';
        } catch (e) {} // eslint-disable-line no-empty
        try {
          if (typeof rulesMenu !== 'undefined' && rulesMenu) {
            rulesMenu.style.display = 'none';
          }
        } catch (e) {} // eslint-disable-line no-empty
      } catch (e) {}
    });

    // hide menu on resize to avoid misplacement; will be recomputed when opened again
    if (!window.__settingsMenuResizeHooked) {
      window.addEventListener('resize', () => {
        try {
          settingsMenu.style.display = 'none';
        } catch (e) {} // eslint-disable-line no-empty
      });
      window.__settingsMenuResizeHooked = true;
    }

    // Toggle chart visibility
    const btnToggleChart = document.createElement('button');
    btnToggleChart.id = 'btn-toggle-chart';
    const updateChartBtn = () => {
      btnToggleChart.textContent = CHART_VISIBLE ? 'Hide Chart' : 'Show Chart';
    };
    updateChartBtn();
    btnToggleChart.addEventListener('click', () => {
      try {
        ensureMergeChartElement();
      } catch (e) {} // eslint-disable-line no-empty
      CHART_VISIBLE = !CHART_VISIBLE;
      try {
        saveGameState();
      } catch (e) {} // eslint-disable-line no-empty
      updateChartBtn();
      const ch = document.getElementById('merge-chart-wrap');
      if (ch) {
        ch.style.display = CHART_VISIBLE ? 'block' : 'none';
      }
      // Reposition dev tools portal after chart visibility/layout changes
      try {
        positionDebugPortal();
      } catch (e) {} // eslint-disable-line no-empty
    });
    // ensure chart toggle is first in the control row
    controls.insertBefore(btnToggleChart, controls.firstChild);

    // Hint button in controls
    const btnHint = document.createElement('button');
    btnHint.id = 'btn-hint';
    btnHint.textContent = 'Hint';
    btnHint.addEventListener('click', () => {
      try {
        console.debug('Controls hint clicked');
      } catch (e) {} // eslint-disable-line no-empty
      try {
        // guard: ensure board exists
        if (!board || !Array.isArray(board)) {
          appendToDebug && appendToDebug('Controls hint: board is not initialized');
          console.error('Controls hint: board is not initialized', { board });
          return;
        }

        // Update hint moves list to get prioritized moves (shatter-creating first)
        updateHintMovesList();
        const moves = getHintMovesList();

        try {
          console.debug('Controls hint found moves:', moves ? moves.length : 0);
        } catch (e) {} // eslint-disable-line no-empty
        try {
          appendToDebug && appendToDebug('Controls hint moves: ' + (moves ? moves.length : 0));
        } catch (e) {} // eslint-disable-line no-empty
        if (!moves || moves.length === 0) {
          alert('No valid moves available');
          return;
        }
        // show a small sample and board snapshot for debugging
        try {
          appendToDebug && appendToDebug('Sample moves: ' + JSON.stringify(moves.slice(0, 8)));
        } catch (e) {} // eslint-disable-line no-empty
        try {
          appendToDebug &&
            appendToDebug(
              'Board snapshot: ' +
                JSON.stringify(
                  board.map(r =>
                    r.map(c =>
                      c ? { templateId: c.templateId,
                        rarity: c.rarity,
                        plus: !!c.plus,
                        type: c.type } : null,
                    ),
                  ),
                ),
            );
        } catch (e) {} // eslint-disable-line no-empty
        const mv = moves[Math.floor(Math.random() * moves.length)];
        setHintMove(mv);
        try {
          appendToDebug && appendToDebug('Controls hint chosen: ' + JSON.stringify(mv));
        } catch (e) {} // eslint-disable-line no-empty
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
    rulesMenu.style.maxHeight = '70vh';
    rulesMenu.style.overflowY = 'auto';
    document.body.appendChild(rulesMenu);
    // populate rules content
    const rulesTitle = document.createElement('div');
    rulesTitle.textContent = 'Rules';
    rulesTitle.style.fontWeight = '700';
    rulesTitle.style.fontSize = '16px';
    rulesMenu.appendChild(rulesTitle);
    const rulesText = document.createElement('div');
    rulesText.innerHTML = `
      <div style="font-size:15px;line-height:1.5">
      <b>Objective:</b> Merge modules to reach Ancestral 5★ for each type
      (Cannon, Generator, Armor, Core) as quickly as possible. Extra points for
      additional 5★ modules.
      <br><br>
      <b>Gameplay:</b>
      <ul>
        <li>Swap and merge modules on the board. Select a base module, then choose
        valid fodder modules to merge and upgrade.</li>
        <li>Modules have types and rarities. Only valid fodder can be merged into a
        base; Commons cannot be used as fodder.</li>
        <li>You can swap modules between the board and your inventory. Inventory slots are limited to one per type.</li>
        <li>You may swap any two modules from anywhere on the board, not just adjacent ones.</li>
        <li>Shattering: Groups of 3+ Commons (or Rares if enabled) will auto-shatter and award shards.</li>
        <li>Use the shuffle button to randomize the board (limited uses).</li>
      </ul>
      <b>Controls:</b>
      <ul>
        <li><b>Swap:</b> Click any two modules to swap them (free-swap enabled).</li>
        <li><b>Long Press:</b> Hold a module to enter merge mode, then select valid
        fodder modules. Complete the merge by pressing the base module again or
        the preview window.</li>
        <li><b>Right Click:</b> Quickly send a module to inventory (if the slot is available).</li>
        <li><b>Inventory:</b> Click inventory slots to select, swap, or place modules (one per type).</li>
        <li><b>Shuffle:</b> Randomize the board (limited uses).</li>
        <li><b>Settings:</b> Adjust auto-shatter, orientation, and other options.</li>
        <li><b>Dev Tools:</b> (if enabled) Show/hide advanced debug options and adjust drop rates.</li>
      </ul>
      <b>Bosses:</b>
      <ul>
        <li>Bosses may spawn randomly. When present, you cannot use inventory or
        perform certain actions until the boss is defeated.</li>
        <li>Defeat the boss by long-pressing the boss and selecting 2 modules in-line
        with it to deal damage. The damage dealt is based on the rarity of the
        selected modules.</li>
        <li>Boss HP is shown at the top of the board.</li>
      </ul>
      <b>Mines:</b>
      <ul>
        <li>Mines may appear on the board. Mines have a countdown and will explode
        if not removed in time, destroying all modules surrounding it.</li>
        <li>Tiles adjacent to a live mine are disabled and cannot be used for merges or as fodder.</li>
        <li>Mines can be shattered manually by long-pressing the mine and selecting
        2 Rare modules of the same template in-line with the mine.</li>
      </ul>
      <b>Not Allowed:</b>
      <ul>
        <li>You cannot use Commons as fodder for merges.</li>
        <li>You cannot use inventory while a boss is present.</li>
        <li>Tiles disabled by bosses and mines cannot be used for merges or fodder,
        but they may still be swapped.</li>
      </ul>
      <br>
      For more details, see the merge chart and experiment with different strategies!
      </div>
    `;
    rulesMenu.appendChild(rulesText);
    const rulesClose = document.createElement('button');
    rulesClose.textContent = 'Close';
    rulesClose.addEventListener('click', () => {
      rulesMenu.style.display = 'none';
    });
    rulesMenu.appendChild(rulesClose);
    // position/show logic for rules menu (prefer upward)
    btnRules.addEventListener('click', ev => {
      ev.stopPropagation();
      try {
        if (rulesMenu.style.display === 'flex') {
          rulesMenu.style.display = 'none';
          return;
        }
        rulesMenu.style.display = 'flex';
        rulesMenu.style.visibility = 'hidden';
        // Position the rules menu centered over the board
        const boardDiv = document.getElementById('game-board');
        const boardRect = boardDiv
          ? boardDiv.getBoundingClientRect()
          : { left: window.innerWidth / 2 - 160,
            top: window.innerHeight / 2 - 200,
            width: 320,
            height: 400 };
        const menuRect = rulesMenu.getBoundingClientRect();
        const menuW = menuRect.width || parseInt(rulesMenu.style.minWidth || '320', 10);
        const menuH = menuRect.height || 320;
        // Center horizontally over the board
        const left = boardRect.left + (boardRect.width - menuW) / 2;
        // Center vertically over the board
        const top = boardRect.top + (boardRect.height - menuH) / 2;
        rulesMenu.style.left = Math.max(8, left) + 'px';
        rulesMenu.style.top = Math.max(8, top) + 'px';
        rulesMenu.style.visibility = 'visible';
      } catch (e) {
        try {
          rulesMenu.style.display = 'flex';
          rulesMenu.style.visibility = 'visible';
        } catch (ee) {} // eslint-disable-line no-empty
      }
    });
    // ensure clicks inside rules menu don't close it (document click handler below will check contains)
    controls.appendChild(btnRules);

    // Insert settings button last in the controls row so it appears as the final control
    controls.appendChild(btnSettings);

    // Insert controls after boardDiv
    if (boardDiv.parentNode) {
      boardDiv.parentNode.insertBefore(controls, boardDiv.nextSibling);
    }
    // ensure timer element is placed under the score pill and restore running state
    try {
      ensureGameTimerPlaced();
    } catch (e) {} // eslint-disable-line no-empty
  } else {
    // update shuffle button state if controls already exist
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
      btnShuffle.disabled = shuffleRemaining <= 0;
    }
  }
}

function onCellContextMenu(r, c) {
  const cell = board[r][c];
  if (!cell) {
    return;
  } // nothing to pick
  // Prevent right-click inventory pickup/swaps while boss is present
  // delegate pickup/swap to inventory helpers
  try {
    const helpers = makeInventoryHelpers({
      getBoard: () => board,
      getInventory: () => inventory,
      setCellAt: (rr, cc, v) => {
        if (!board[rr]) {
          board[rr] = [];
        }
        board[rr][cc] = v;
      },
      setInventorySlot: (t, v) => {
        inventory[t] = v;
      },
      renderBoard,
      renderInventory,
      cascadeResolve,
      appendToDebug,
      getBossMarker: () => window.__BOSS_MARKER,
    });
    const didPick = helpers.pickUpToInventory(r, c);
    if (didPick) {
      try {
        moveOccurredThisTurn = true;
      } catch (e) {} // eslint-disable-line no-empty
      return;
    }
    // otherwise attempt swap
    helpers.swapWithInventory(r, c, cell.type);
    try {
      moveOccurredThisTurn = true;
    } catch (e) {} // eslint-disable-line no-empty
    return;
  } catch (e) {} // eslint-disable-line no-empty
}

// MERGE_SEQUENCE is defined in ./game/rules.js and imported at the top of this file.

async function onCellClick(ev, r, c) {
  if (animating) {
    return;
  }
  // Clear any inactivity hint when the user interacts with the board
  if (getHintMove()) {
    setHintMove(null);
    renderBoard();
  }
  const cell = board[r][c];
  // allow callers that accidentally call without event
  ev = ev || { ctrlKey: false,
    metaKey: false,
    shiftKey: false };
  // Check if this position has a boss
  const bm = window.__BOSS_MARKER || null;
  const isBossPosition = bm && bm.r === r && bm.c === c;
  if (!cell && !isBossPosition) {
    return;
  }
  // If we're in mine-shatter-selecting mode
  if (mineShatterSelecting) {
    const base = selected[0];
    // if user tapped the mine again, attempt mine shatter
    if (base && base.r === r && base.c === c) {
      // confirm shatter, but only if at least 2 modules have been selected
      if (selected.length < 3) {
        // base + at least 2 modules
        baseClickCount++;
        if (baseClickCount >= 2) {
          // Exit selection mode after 2 base clicks without meeting requirements
          candidateHighlights.clear();
          mineShatterSelecting = false;
          selected.length = 0;
          invalidClickCount = 0;
          baseClickCount = 0;
          renderBoard();
          return;
        }
        appendToDebug &&
          appendToDebug(
            'Mine shatter blocked: need at least 2 modules selected but have ' +
              (selected.length - 1) +
              ' (click base again to cancel)',
          );
        renderBoard();
        return;
      }
      candidateHighlights.clear();
      mineShatterSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      // Trigger mine shatter
      performMineShatter(r, c);
      selected.length = 0;
      renderBoard();
      return;
    }
    // If user tapped a highlighted candidate, toggle selection
    const key = r + ',' + c;
    if (candidateHighlights.has(key)) {
      const already = selected.findIndex(x => x.r === r && x.c === c);
      if (already >= 0) {
        selected.splice(already, 1);
      } else {
        // For mine shatter, we need up to 4 modules total
        if (selected.length >= 5) {
          appendToDebug && appendToDebug('Cannot select more modules: mine shatter requires up to 4 modules');
          return;
        }
        selected.push({ r,
          c,
          cell });
      }
      invalidClickCount = 0; // Reset on valid action
      baseClickCount = 0; // Reset base click count on valid action
      updateMergePreview();
      renderBoard();
      return;
    }
    // non-candidate taps while in mineShatterSelecting
    invalidClickCount++;
    if (invalidClickCount >= 2) {
      // Exit selection mode after 2 consecutive invalid clicks
      candidateHighlights.clear();
      mineShatterSelecting = false;
      selected.length = 0;
      invalidClickCount = 0;
      renderBoard();
      return;
    }
    updateMergePreview();
    renderBoard();
    return;
  }
  // If we're in boss-shatter-selecting mode
  if (bossShatterSelecting) {
    const base = selected[0];
    // if user tapped the boss again, attempt boss damage
    if (base && base.r === r && base.c === c) {
      // confirm damage, but only if at least 1 module has been selected (allow single Epic+)
      const selectedModules = selected.filter(
        s => s.cell && s.cell.templateId !== '__BOSS__' && s.cell.rarity !== 'Boss',
      );

      // Check if we have at least one module
      if (selectedModules.length < 1) {
        baseClickCount++;
        if (baseClickCount >= 2) {
          // Exit selection mode after 2 base clicks without meeting requirements
          candidateHighlights.clear();
          bossShatterSelecting = false;
          selected.length = 0;
          invalidClickCount = 0;
          baseClickCount = 0;
          renderBoard();
          return;
        }
        appendToDebug &&
          appendToDebug(
            'Boss damage blocked: need at least 1 module selected but have ' +
              selectedModules.length +
              ' (click boss again to cancel)',
          );
        renderBoard();
        return;
      }

      // For single module selections, ensure it's Epic+
      if (selectedModules.length === 1) {
        const singleModule = selectedModules[0];
        if (singleModule && singleModule.cell) {
          const rarityRank = RARITY_RANK[singleModule.cell.rarity];
          if (rarityRank < 2) {
            // Not Epic or higher
            baseClickCount++;
            if (baseClickCount >= 2) {
              // Exit selection mode after 2 base clicks without meeting requirements
              candidateHighlights.clear();
              bossShatterSelecting = false;
              selected.length = 0;
              invalidClickCount = 0;
              baseClickCount = 0;
              renderBoard();
              return;
            }
            appendToDebug && appendToDebug('Boss damage blocked: single module must be Epic or higher');
            renderBoard();
            return;
          }
        }
      }

      candidateHighlights.clear();
      bossShatterSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      // Trigger boss damage
      damageBossWithModules(selectedModules);
      // Ensure boss overlay is updated immediately after damage
      try {
        bossHelper.renderOverlay && bossHelper.renderOverlay();
      } catch (e) {}
      // Ensure the boss tile overlay is also updated
      renderBoard();
      // Remove the selected modules from the board
      for (const mod of selectedModules) {
        if (mod && mod.r !== undefined && mod.c !== undefined) {
          board[mod.r][mod.c] = null;
        }
      }
      selected.length = 0;
      renderBoard();
      cascadeResolve();
      return;
    }
    // If user tapped a highlighted candidate, toggle selection
    const key = r + ',' + c;
    if (candidateHighlights.has(key)) {
      const already = selected.findIndex(x => x.r === r && x.c === c);
      if (already >= 0) {
        selected.splice(already, 1);
      } else {
        selected.push({ r,
          c,
          cell });
      }
      invalidClickCount = 0; // Reset on valid action
      baseClickCount = 0; // Reset base click count on valid action
      updateMergePreview();
      renderBoard();
      return;
    }
    // non-candidate taps while in bossShatterSelecting
    invalidClickCount++;
    if (invalidClickCount >= 2) {
      // Exit selection mode after 2 consecutive invalid clicks
      candidateHighlights.clear();
      bossShatterSelecting = false;
      selected.length = 0;
      invalidClickCount = 0;
      renderBoard();
      return;
    }
    updateMergePreview();
    renderBoard();
    return;
  }
  // If we're in merge-selecting mode
  if (mergeSelecting) {
    // if user tapped the base while mergeSelecting, attempt merge confirmation
    const base = selected[0];
    if (base && base.r === r && base.c === c) {
      // confirm merge, but only if the required number of selections have been made
      const baseCell = base && base.cell ? base.cell : null;
      const required = requiredTotalForBaseCell(baseCell);
      if (selected.length !== required) {
        baseClickCount++;
        if (baseClickCount >= 2) {
          // Exit selection mode after 2 base clicks without meeting requirements
          candidateHighlights.clear();
          mergeSelecting = false;
          selected.length = 0;
          invalidClickCount = 0;
          baseClickCount = 0;
          renderBoard();
          return;
        }
        appendToDebug &&
          appendToDebug(
            'Merge blocked: base click needs ' +
              required +
              ' selections but have ' +
              selected.length +
              ' (click base again to cancel)',
          );
        renderBoard();
        return;
      }
      candidateHighlights.clear();
      mergeSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
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
        if (selected.length >= required) {
          return;
        }
        selected.push({ r,
          c,
          cell });
      }
      invalidClickCount = 0; // Reset on valid action
      baseClickCount = 0; // Reset base click count on valid action
      updateMergePreview();
      renderBoard();
      return;
    }
    // non-candidate taps while in mergeSelecting
    invalidClickCount++;
    if (invalidClickCount >= 2) {
      // Exit selection mode after 2 consecutive invalid clicks
      candidateHighlights.clear();
      mergeSelecting = false;
      selected.length = 0;
      invalidClickCount = 0;
      updateMergePreview();
      renderBoard();
      return;
    }
    updateMergePreview();
    renderBoard();
    return;
  }
  // If this tile is already selected, toggle it off
  const alreadyIdx = selected.findIndex(x => x && x.r === r && x.c === c);
  if (alreadyIdx >= 0) {
    const wasBase = alreadyIdx === 0;
    const selEntry = selected[alreadyIdx];
    // If this selection was just created by a long-press, suppress the immediate toggle and clear the flag.
    if (selEntry && selEntry._suppressClick) {
      try {
        delete selEntry._suppressClick;
      } catch (e) {} // eslint-disable-line no-empty
      // keep selection active
      renderBoard();
      return;
    }
    // Don't deselect the base in mine shatter mode
    if (mineShatterSelecting && wasBase) {
      renderBoard();
      return;
    }
    // Don't deselect the base in boss shatter mode
    if (bossShatterSelecting && wasBase) {
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
    selected.push({ r,
      c,
      cell });
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
          if (already >= 0) {
            selected.splice(already, 1);
          } else {
            const required = requiredTotalForBaseCell(a.cell);
            if (selected.length >= required) {
              appendToDebug &&
                appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
              return;
            }
            selected.push({ r,
              c,
              cell });
          }
          renderBoard();
        }
        return;
      }
      // not mergeSelecting: treat click as attempt to add fodder if valid
      if (canBeFodder(a.cell, cell)) {
        const already = selected.findIndex(x => x.r === r && x.c === c);
        if (already >= 0) {
          selected.splice(already, 1);
        } else {
          const required = requiredTotalForBaseCell(a.cell);
          if (selected.length >= required) {
            appendToDebug &&
              appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
            return;
          }
          selected.push({ r,
            c,
            cell });
        }
        renderBoard();
      }
      return;
    }

    // If base is a board selection, original adjacency/swap behavior applies
    if (isBoardSel(a)) {
      const manhattan = Math.abs(a.r - r) + Math.abs(a.c - c);
      // allow non-adjacent swaps - free swap is now permanent
      if (manhattan >= 1) {
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
              if (selected.length >= required) {
                appendToDebug &&
                  appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
                return;
              }
              selected.push({ r,
                c,
                cell });
            }
            renderBoard();
            return;
          }
          // non-candidate tap while mergeSelecting: ignore but keep selection
          renderBoard();
          return;
        }

        // Default behavior: free swap is now permanent - no Common-swap rules
        const src = board[a.r][a.c];
        const dst = board[r][c];
        // Prevent mines from being moved via swaps
        const srcIsMine = src && (src.templateId === '__MINE__' || src.rarity === 'Mine');
        const dstIsMine = dst && (dst.templateId === '__MINE__' || dst.rarity === 'Mine');
        if (srcIsMine || dstIsMine) {
          selected.length = 0;
          renderBoard();
          alert('Mines cannot be moved via swaps.');
          return;
        }
        // perform swap
        const tmp = board[r][c];
        board[r][c] = board[a.r][a.c];
        board[a.r][a.c] = tmp;
        try {
          moveOccurredThisTurn = true;
        } catch (e) {} // eslint-disable-line no-empty
        selected.length = 0;
        // Reset hint cycling state when a move is made
        resetHintCyclingState();
        // Render to show the swap before we check for any immediate Common group
        renderBoard();
        const commonGroups = findAllGroups(cell => cell.rarity === 'Common');
        // debug: log groups detected immediately after swap
        try {
          console.debug('Swap performed:', { from: { r: a.r,
            c: a.c },
          to: { r,
            c } });
          console.debug(
            'Detected Common groups after swap:',
            commonGroups.map(g => ({ len: g.length,
              coords: g })),
          );
        } catch (e) {} // eslint-disable-line no-empty
        // Ensure any groups formed by this swap are immediately resolved so none are missed
        const anyResolved = resolveImmediateShatters();
        // All swaps are now free - no token consumption
        // If we resolved immediate shatters synchronously, continue cascading with animation;
        // otherwise start cascadeResolve which will animate fills and auto-shatters
        if (anyResolved) {
          await cascadeResolve();
        } else {
          cascadeResolve();
        }
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
        appendToDebug &&
          appendToDebug('Merge blocked: base click needs ' + required + ' selections but have ' + selected.length);
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
        if (selected.length >= required) {
          appendToDebug &&
            appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
          return;
        }
        selected.push({ r,
          c,
          cell });
      }
      renderBoard();
      updateMergePreview();
      return;
    }
    // non-candidate taps while in mergeSelecting do nothing but keep selection
    renderBoard();
    updateMergePreview();
    return;
  }

  // If we're in mine-shatter-selecting mode
  if (mineShatterSelecting) {
    const base = selected[0];
    // if user tapped the mine again, attempt mine shatter
    if (base && base.r === r && base.c === c) {
      // confirm shatter, but only if exactly 3 or 5 modules have been selected (for 3-tile or 5-tile patterns)
      if (selected.length !== 3 && selected.length !== 5) {
        // base + 2 modules or base + 4 modules
        appendToDebug &&
          appendToDebug('Mine shatter blocked: need exactly 2 or 4 modules selected but have ' + (selected.length - 1));
        renderBoard();
        return;
      }
      candidateHighlights.clear();
      mineShatterSelecting = false;
      // Trigger mine shatter
      performMineShatter(r, c);
      selected.length = 0;
      renderBoard();
      return;
    }
    // If user tapped a highlighted candidate, toggle selection
    const key = r + ',' + c;
    if (candidateHighlights.has(key)) {
      const already = selected.findIndex(x => x.r === r && x.c === c);
      if (already >= 0) {
        selected.splice(already, 1);
      } else {
        // For mine shatter, we need up to 4 modules total
        if (selected.length >= 5) {
          appendToDebug && appendToDebug('Cannot select more modules: mine shatter requires up to 4 modules');
          return;
        }
        selected.push({ r,
          c,
          cell });
      }
      renderBoard();
      updateMergePreview();
      return;
    }
    // non-candidate taps while in mineShatterSelecting do nothing but keep selection
    renderBoard();
    updateMergePreview();
    return;
  }
  // If we're in boss-shatter-selecting mode
  if (bossShatterSelecting) {
    const base = selected[0];
    // if user tapped the boss again, attempt boss damage
    if (base && base.r === r && base.c === c) {
      // confirm damage, but only if at least 1 module has been selected (allow single Epic+)
      const selectedModules = selected.filter(
        s => s.cell && s.cell.templateId !== '__BOSS__' && s.cell.rarity !== 'Boss',
      );

      // Check if we have at least one module
      if (selectedModules.length < 1) {
        baseClickCount++;
        if (baseClickCount >= 2) {
          // Exit selection mode after 2 base clicks without meeting requirements
          candidateHighlights.clear();
          bossShatterSelecting = false;
          selected.length = 0;
          invalidClickCount = 0;
          baseClickCount = 0;
          renderBoard();
          return;
        }
        appendToDebug &&
          appendToDebug(
            'Boss damage blocked: need at least 1 module selected but have ' +
              selectedModules.length +
              ' (click boss again to cancel)',
          );
        renderBoard();
        return;
      }

      // For single module selections, ensure it's Epic+
      if (selectedModules.length === 1) {
        const singleModule = selectedModules[0];
        if (singleModule && singleModule.cell) {
          const isEpicOrHigher =
            ['Epic', 'Legendary', 'Mythic', 'Ancestral'].includes(singleModule.cell.rarity) || singleModule.cell.plus;
          if (!isEpicOrHigher) {
            baseClickCount++;
            if (baseClickCount >= 2) {
              // Exit selection mode after 2 base clicks without meeting requirements
              candidateHighlights.clear();
              bossShatterSelecting = false;
              selected.length = 0;
              invalidClickCount = 0;
              baseClickCount = 0;
              renderBoard();
              return;
            }
            appendToDebug && appendToDebug('Boss damage blocked: single module must be Epic or higher');
            renderBoard();
            return;
          }
        }
      }

      // For multi-module selections, allow multiple independent chains (validation done in damageBossWithModules)

      candidateHighlights.clear();
      bossShatterSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      // Trigger boss damage
      damageBossWithModules(selectedModules);
      // Ensure boss overlay is updated immediately after damage
      try {
        bossHelper.renderOverlay && bossHelper.renderOverlay();
      } catch (e) {}
      // Ensure the boss tile overlay is also updated
      renderBoard();
      // Remove the selected modules from the board
      for (const mod of selectedModules) {
        if (mod && mod.r !== undefined && mod.c !== undefined) {
          board[mod.r][mod.c] = null;
        }
      }
      selected.length = 0;
      renderBoard();
      cascadeResolve();
      return;
    }
    // If user tapped a highlighted candidate, toggle selection
    const key = r + ',' + c;
    if (candidateHighlights.has(key)) {
      const already = selected.findIndex(x => x.r === r && x.c === c);
      if (already >= 0) {
        selected.splice(already, 1);
      } else {
        // For boss damage, allow unlimited module selection
        // Removed limit to allow unlimited selection
        selected.push({ r,
          c,
          cell });
      }
      invalidClickCount = 0; // Reset on valid action
      baseClickCount = 0; // Reset base click count on valid action
      renderBoard();
      updateMergePreview();
      return;
    }
    // non-candidate taps while in bossShatterSelecting do nothing but keep selection
    renderBoard();
    updateMergePreview();
    return;
  }

  // enforce a sensible limit: never allow adding more items than the merge requires for the current base
  if (selected.length === 0) {
    // no base, safe to add as base
    selected.push({ r,
      c,
      cell });
  } else {
    // there's a base; compute required total and prevent over-selection
    const base = selected[0];
    const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
    if (selected.length >= required) {
      appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
    } else {
      selected.push({ r,
        c,
        cell });
    }
  }
  // Try to evaluate merge intent
  evaluateMergeAttempt();
}

// Handle a long-press on a cell: begin merge selection mode if applicable
function handleLongPress(r, c) {
  try {
    const cell = board[r][c];
    // Allow long-press on boss positions even if no cell is there
    const bm = window.__BOSS_MARKER || null;
    const isBossPosition = bm && bm.r === r && bm.c === c;
    if (!cell && !isBossPosition) {
      return;
    }
    // Don't allow long-press on Common rarity tiles (but allow on boss positions)
    try {
      if (cell && cell.rarity === 'Common' && !isBossPosition) {
        return;
      }
    } catch (e) {}
    // If long-pressing the base when already in mergeSelecting -> cancel selection
    if (selected.length > 0 && selected[0].r === r && selected[0].c === c && mergeSelecting) {
      mergeSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      candidateHighlights.clear();
      renderBoard();
      return;
    }
    // If long-pressing the base when already in mineShatterSelecting -> cancel selection
    if (selected.length > 0 && selected[0].r === r && selected[0].c === c && mineShatterSelecting) {
      mineShatterSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      candidateHighlights.clear();
      renderBoard();
      return;
    }
    // If long-pressing the base when already in bossShatterSelecting -> cancel selection
    if (selected.length > 0 && selected[0].r === r && selected[0].c === c && bossShatterSelecting) {
      bossShatterSelecting = false;
      invalidClickCount = 0;
      baseClickCount = 0;
      candidateHighlights.clear();
      renderBoard();
      return;
    }
    // If nothing selected, treat long-press as selecting base and entering appropriate mode
    if (selected.length === 0) {
      // For boss positions, create a pseudo-cell
      let selectedCell = cell;
      if (!cell && isBossPosition) {
        selectedCell = { templateId: '__BOSS__',
          rarity: 'Boss',
          type: 'Boss' };
      }
      selected.push({ r,
        c,
        cell: selectedCell });
      // Check if this is a mine - if so, enter mine shatter mode
      if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
        mineShatterSelecting = true;
        invalidClickCount = 0;
        baseClickCount = 0;
        // suppress the immediate click that occurs on pointerup after long-press
        try {
          selected[0]._suppressClick = true;
        } catch (e) {}
        // auto highlight all possible modules that can be selected for mine shattering
        const cands = mergeCandidates.findMineShatterCandidates(r, c, board);
        candidateHighlights.clear();
        cands.forEach(p => candidateHighlights.add(p.r + ',' + p.c));
        renderBoard();
        return;
      }
      // Check if this is a boss - if so, enter boss shatter mode
      else if (isBossPosition || (cell && cell.templateId === '__BOSS__')) {
        bossShatterSelecting = true;
        invalidClickCount = 0;
        baseClickCount = 0;
        // suppress the immediate click that occurs on pointerup after long-press
        try {
          selected[0]._suppressClick = true;
        } catch (e) {}
        // auto highlight all possible modules that can be selected for boss damage
        const cands = mergeCandidates.findBossShatterCandidates(r, c, board);
        candidateHighlights.clear();
        cands.forEach(p => candidateHighlights.add(p.r + ',' + p.c));
        renderBoard();
        return;
      }
      // Regular merge mode (neither mine nor boss)
      else {
        mergeSelecting = true;
        invalidClickCount = 0;
        baseClickCount = 0;
        // suppress the immediate click that occurs on pointerup after long-press
        try {
          selected[0]._suppressClick = true;
        } catch (e) {}
        // auto highlight all possible fodder candidates for this base
        const cands = findPotentialFodder(r, c);
        candidateHighlights.clear();
        cands.forEach(p => candidateHighlights.add(p.r + ',' + p.c));
        renderBoard();
        return;
      }
    }
    // If one selected and long-pressing any tile, enter mergeSelecting and auto-highlight
    const base = selected[0];
    // start mergeSelecting with base retained
    mergeSelecting = true;
    invalidClickCount = 0;
    baseClickCount = 0;
    // If this tile isn't already selected, add it as initial fodder (but enforce limits)
    const already = selected.findIndex(x => x.r === r && x.c === c);
    if (already < 0) {
      const required = requiredTotalForBaseCell(base && base.cell ? base.cell : null);
      // Only add if this candidate is valid fodder for the base
      if (canBeFodder(base && base.cell ? base.cell : null, cell)) {
        if (selected.length < required) {
          selected.push({ r,
            c,
            cell });
        } else {
          appendToDebug &&
            appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections');
        }
      } else {
        appendToDebug && appendToDebug('Long-press: tile not valid fodder for selected base');
      }
    }
    // compute potential fodder candidates across the entire board
    const cands = findPotentialFodder(base.r, base.c);
    candidateHighlights.clear();
    cands.forEach(p => candidateHighlights.add(p.r + ',' + p.c));
    renderBoard();
    return;
  } catch (e) {
    console.error('handleLongPress error', e);
  }
}

// Find potential fodder candidates for a base cell at (br,bc). Returns array of {r,c}
function findPotentialFodder(br, bc) {
  const base = board[br] && board[br][bc];
  if (!base) {
    return [];
  }
  const out = [];
  // scan neighbors (and entire board for matching templates in some cases)
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (r === br && c === bc) {
        continue;
      }
      const cell = board[r][c];
      if (!cell) {
        continue;
      }
      // Exclude mines when in regular merge mode (not mine shatter mode)
      if (!mineShatterSelecting && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
        continue;
      }
      // No adjacency requirement: consider entire board
      if (canBeFodder(base, cell)) {
        out.push({ r,
          c });
      }
    }
  }
  return out;
}

// Deal damage to boss with selected modules
function damageBossWithModules(selectedModules) {
  try {
    // Filter out mythic and ancestral modules (they cannot be used for boss shattering)
    // Also filter out boss cells
    const bossMarker = window.__BOSS_MARKER;
    const validModules = selectedModules.filter(sel => {
      if (!sel || !sel.cell) {
        return false;
      }
      const rarity = sel.cell.rarity;
      // Filter out mythic/ancestral
      if (rarity === 'Mythic' || rarity === 'Mythic+' || rarity === 'Ancestral' || rarity === 'Ancestral+') {
        return false;
      }
      // Filter out boss cells by position
      if (bossMarker && sel.r === bossMarker.r && sel.c === bossMarker.c) {
        return false;
      }
      return true;
    });

    if (validModules.length === 0) {
      appendToDebug && appendToDebug('Boss damage cancelled: no valid modules selected');
      return;
    }

    // Validate combo requirements: allow multiple independent chains
    let isValidCombo = false;
    if (validModules.length > 0) {
      // Group modules by type, rarity, and template (for base rarities)
      const moduleGroups = {};
      validModules.forEach(sel => {
        const cell = sel.cell;
        const baseRarity = cell.rarity.replace(/\+/g, '');
        const requiresExactTemplate = ['Rare', 'Epic'].includes(baseRarity);
        const key = requiresExactTemplate
          ? cell.type + '_' + cell.rarity + '_' + cell.templateId
          : cell.type + '_' + cell.rarity;
        if (!moduleGroups[key]) {
          moduleGroups[key] = [];
        }
        moduleGroups[key].push(sel);
      });

      // Check each group meets minimum requirements
      isValidCombo = Object.values(moduleGroups).every(group => {
        const firstModule = group[0].cell;
        const baseRarity = firstModule.rarity.replace(/\+/g, '');
        const isEpicOrHigher = ['Epic', 'Legendary', 'Mythic', 'Ancestral'].includes(baseRarity) || firstModule.plus;
        const minRequired = isEpicOrHigher ? 1 : 2;
        return group.length >= minRequired;
      });
    }

    if (!isValidCombo) {
      appendToDebug && appendToDebug('Boss damage cancelled: invalid combo selected');
      return;
    }

    let totalDamage = 0;

    // Calculate damage based on selected modules
    for (const sel of validModules) {
      if (sel && sel.cell) {
        totalDamage += getModuleDamageValue(sel.cell);
      }
    }

    // Apply damage to boss using the bossHelper's applyDamage method
    if (bossHelper && bossHelper.applyDamage) {
      bossHelper.applyDamage(totalDamage);
    }
    appendToDebug &&
      appendToDebug('Boss damaged for ' + totalDamage + ' hits from ' + validModules.length + ' modules');
  } catch (e) {
    console.error('damageBossWithModules error', e);
  }
}
function performMineShatter(mineR, mineC) {
  try {
    appendToDebug && appendToDebug('performMineShatter called at (' + mineR + ',' + mineC + ')');

    // For manual mine shattering, destroy all 8 surrounding tiles like an explosion
    const affectedPositions = [];

    // Mark all 8 surrounding tiles (and the mine itself) for clearing
    for (let rr = Math.max(0, mineR - 1); rr <= Math.min(BOARD_ROWS - 1, mineR + 1); rr++) {
      for (let cc = Math.max(0, mineC - 1); cc <= Math.min(BOARD_COLS - 1, mineC + 1); cc++) {
        if (board[rr][cc]) {
          board[rr][cc].clearing = true;
          affectedPositions.push({ r: rr,
            c: cc,
            cell: board[rr][cc] });
        }
      }
    }

    // Clear selection and update UI
    selected.length = 0;
    renderBoard();

    // Brief animation delay
    setTimeout(() => {
      // Award shards and remove tiles
      for (const pos of affectedPositions) {
        try {
          const rem = pos.cell;
          if (rem) {
            // Only award for non-mine tiles
            if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
              try {
                totalShatters = typeof totalShatters === 'number' ? totalShatters + 1 : 1;
                const shType = rem.type || 'Unknown';
                const shardMap = { Common: 5,
                  Rare: 10,
                  Epic: 40 };
                const shards = shardMap[rem.rarity] || 0;
                awardShards(shType, shards);
              } catch (e) {}
            }
            // If a neighbor removed by explosion is itself a mine, queue it for explosion
            try {
              if (rem.templateId === '__MINE__') {
                pendingExplosions.push({ r: pos.r,
                  c: pos.c });
              }
            } catch (e) {}
          }
        } catch (e) {}
        board[pos.r][pos.c] = null;
      }

      renderBoard();

      // Apply gravity to boss marker after manual shatter
      try {
        if (window.__BOSS_MARKER) {
          let br = window.__BOSS_MARKER.r,
            bc = window.__BOSS_MARKER.c;
          // only adjust if marker is within bounds
          if (typeof br === 'number' && typeof bc === 'number') {
            // while the cell below is empty and we're not at the bottom, move the boss down
            while (br + 1 < BOARD_ROWS && (!board[br + 1] || !board[br + 1][bc])) {
              br++;
            }
            if (br !== window.__BOSS_MARKER.r) {
              window.__BOSS_MARKER.r = br;
              try {
                bossHelper.renderOverlay && bossHelper.renderOverlay();
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // Trigger cascade to refill and handle any new matches
      cascadeResolve();
    }, 180); // Animation delay
  } catch (e) {
    console.error('performMineShatter error', e);
    appendToDebug && appendToDebug('performMineShatter error: ' + String(e));
  }
}

// Build/update the merge-preview overlay (moved to ui/mergePreview.js)
// The function is now provided by the mergePreview module and assigned to updateMergePreview variable above

// Wrappers that bind main.js globals where needed and delegate to engine.js
function predictMergeResult(sel) {
  return _predictMergeResult(sel);
}
// rule helpers are provided by ./game/rules.js; the engine still provides predictMergeResult etc.

function isDisabledByMine(cell) {
  // delegate to mines module which owns mine rules; provide live board and bounds
  try {
    return minesIsDisabledByMine(cell, board, BOARD_ROWS, BOARD_COLS);
  } catch (e) {
    return false;
  }
}

// Return true if the boss overlay at a location can be tapped to trigger its effect (mirrors mine behavior)
// Boss shatter logic has been moved to `client/entities/boss.js` and is
// initialized in this file via `makeBossHandlers(...)`. The runtime binding
// `shatterBossAtMarker` is assigned from that factory so no local function
// declaration should exist here.

function removeCells(cells, awardShards = true) {
  return boardModule.removeCells(cells, awardShards);
}

function placeNewAt(selEntry, newMod) {
  return boardModule.placeNewAt(selEntry, newMod);
}

function evaluateMergeAttempt() {
  return mergeEngine.evaluateMergeAttempt();
}

// Find all connected groups where all members satisfy eligibility predicate
function findAllGroups(predicate) {
  return _findAllGroups(board, predicate, BOARD_ROWS, BOARD_COLS);
}

// Helper: return true if a group (array of {r,c}) contains a straight run of >=3
function hasStraightTriple(group) {
  return _hasStraightTriple(group);
}

// Given a connected group (array of {r,c}), return only the positions that are part
// of any horizontal or vertical contiguous run of length >= 3.
function extractStraightRunPositions(group) {
  return _extractStraightRunPositions(group);
}

// Check if any allowed adjacency swap (swaps allowed only if at least one tile is Common)
// produces a Common auto-shatter group (length >= 3). Returns true if a valid move exists.
function checkForValidMoves() {
  return boardModule.checkForValidMoves ? boardModule.checkForValidMoves() : false;
}

// Find all valid adjacency swaps (that respect Common-swap rule) and return as list of {r,c,nr,nc}
function findValidMovesList() {
  return boardModule.findValidMovesList ? boardModule.findValidMovesList() : [];
}

// Global variables for hint cycling
// Moved to utils/hintSystem.js

// Moved to utils/hintSystem.js

// Moved to utils/hintSystem.js

// Moved to utils/hintSystem.js

// Moved to utils/hintSystem.js

// Cascade resolver: collapse, refill, then auto-shatter any groups of 3+ eligible modules
// sleep that respects the global animation speed (divides duration by animSpeed)
function sleepAnimated(ms) {
  const t = Math.max(0, Math.round(ms / (animSpeed || 1)));
  return new Promise(res => setTimeout(res, t));
}

async function cascadeResolve() {
  if (animating) {
    return;
  }
  animating = true;
  let loop = 0;
  let continueCascade = true;
  try {
    while (continueCascade && loop <= 12) {
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
              if (board[r][c]) {
                board[r][c].falling = true;
              }
              // If the boss was sitting on the tile that just moved down, move the boss with it
              try {
                if (window.__BOSS_MARKER && window.__BOSS_MARKER.r === r - 1 && window.__BOSS_MARKER.c === c) {
                  window.__BOSS_MARKER.r = r;
                  try {
                    bossHelper.renderOverlay && bossHelper.renderOverlay();
                  } catch (e) {}
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
          for (let rr = 0; rr < BOARD_ROWS; rr++) {
            for (let cc = 0; cc < BOARD_COLS; cc++) {
              if (board[rr][cc] && board[rr][cc].falling) {
                delete board[rr][cc].falling;
              }
            }
          }
          // If boss exists and the tile(s) underneath it are empty, drop the boss marker down to match gravity
          try {
            if (window.__BOSS_MARKER) {
              let br = window.__BOSS_MARKER.r,
                bc = window.__BOSS_MARKER.c;
              // only adjust if marker is within bounds
              if (typeof br === 'number' && typeof bc === 'number') {
                // while the cell below is empty and we're not at the bottom, move the boss down
                while (br + 1 < BOARD_ROWS && (!board[br + 1] || !board[br + 1][bc])) {
                  br++;
                }
                if (br !== window.__BOSS_MARKER.r) {
                  window.__BOSS_MARKER.r = br;
                  try {
                    bossHelper.renderOverlay && bossHelper.renderOverlay();
                  } catch (e) {}
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
            newDrop = maybeConvertToMine(newDrop);
            board[r][c] = newDrop;
            if (board[r][c]) {
              board[r][c].spawning = true;
            }
            filled = true;
            // Let boss helper consider spawning at this new tile
            try {
              bossHelper.spawnIfEligible && bossHelper.spawnIfEligible(r, c);
            } catch (e) {}
          }
        }
      }
      if (filled) {
        renderBoard();
        await sleepAnimated(120);
        // clear spawning flags
        for (let rr = 0; rr < BOARD_ROWS; rr++) {
          for (let cc = 0; cc < BOARD_COLS; cc++) {
            if (board[rr][cc] && board[rr][cc].spawning) {
              delete board[rr][cc].spawning;
            }
          }
        }
      }

      // detect groups to clear: always include Commons; include plain Rares only if autoShatterRares is enabled
      // Epics remain shatterable only by canBeShattered (manual or via full setting)
      const groups = findAllGroups(cell => {
        if (!cell) {
          return false;
        }
        if (cell.rarity === 'Common') {
          return true;
        }
        if (cell.rarity === 'Rare' && !cell.plus) {
          return !!autoShatterRares;
        }
        // don't auto-shatter Rare+ or higher via this checkbox
        // Epic handling remains per canBeShattered but default auto behavior excludes Epics
        return false;
      });
      // enforce straight-3 for Common groups; Rare groups still follow length>=3 and autoShatterRares
      const toShatterGroups = groups.filter(g => g.length >= 3 && hasStraightTriple(g));
      if (toShatterGroups.length === 0) {
        continueCascade = false;
        break;
      }

      // Mark clearing visuals only for straight-run positions inside each group
      const allPositionsToRemove = [];
      for (const g of toShatterGroups) {
        const straight = extractStraightRunPositions(g);
        for (const p of straight) {
          const c = board[p.r][p.c];
          if (c) {
            c.clearing = true;
          }
          allPositionsToRemove.push(p);
        }
      }
      console.debug(
        'Auto-shatter will remove groups:',
        toShatterGroups.map(g => ({ len: g.length,
          coords: g })),
      );
      renderBoard();
      await sleepAnimated(160);

      // Remove only straight-run positions and award score
      const posCells = allPositionsToRemove.map(p => ({ r: p.r,
        c: p.c,
        cell: board[p.r] && board[p.r][p.c] }));
      for (const pc of posCells) {
        const rem = pc.cell;
        if (rem) {
          try {
            totalShatters = typeof totalShatters === 'number' ? totalShatters + 1 : 1;
          } catch (e) {}
          try {
            const shType = rem.type || 'Unknown';
            const shardMap = { Common: 5,
              Rare: 10,
              Epic: 40 };
            const shards = shardMap[rem.rarity] || 0;
            awardShards(shType, shards);
          } catch (e) {}
        }
        board[pc.r][pc.c] = null;
      }
      renderBoard();
      await sleepAnimated(120);

      if (loop > 12) {
        continueCascade = false;
        break;
      } // safety
    }
  } finally {
    // cleanup clearing flags
    try {
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (board[r][c] && board[r][c].clearing) {
            delete board[r][c].clearing;
          }
        }
      }
    } catch (e) {}
    animating = false;
    try {
      renderBoard();
    } catch (e) {}
    // First: if any pending explosions (e.g., mines removed via shatter), process them
    try {
      if (pendingExplosions.length > 0) {
        const queue = pendingExplosions.splice(0, pendingExplosions.length);
        for (const ex of queue) {
          const { r, c } = ex;
          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              if (board[rr][cc]) {
                board[rr][cc].clearing = true;
              }
            }
          }
          renderBoard();
          await sleepAnimated(180);

          // Calculate boss damage from destroyed modules
          let bossDamage = 0;
          const bossMarker = window.__BOSS_MARKER;

          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              try {
                const rem = board[rr] && board[rr][cc];
                if (rem) {
                  // Don't award shards/score for the mine tile itself; only award for surrounding modules
                  if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                    try {
                      totalShatters = typeof totalShatters === 'number' ? totalShatters + 1 : 1;
                    } catch (e) {}
                    try {
                      const shType = rem.type || 'Unknown';
                      const shardMap = { Common: 5,
                        Rare: 10,
                        Epic: 40 };
                      const shards = shardMap[rem.rarity] || 0;
                      awardShards(shType, shards);
                    } catch (e) {}

                    // Calculate boss damage if boss is present at explosion center
                    if (bossMarker && bossMarker.r === r && bossMarker.c === c) {
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
                      bossDamage += damageMap[rem.rarity] || 0;
                    }
                  }
                  // If a neighbor removed by an explosion is itself a mine, queue it for its own explosion
                  try {
                    if (rem.templateId === '__MINE__') {
                      pendingExplosions.push({ r: rr,
                        c: cc });
                    }
                  } catch (e) {}
                }
              } catch (e) {}
              board[rr][cc] = null;
            }
          }

          // Apply boss damage if any was calculated
          if (bossDamage > 0) {
            try {
              if (bossHelper && bossHelper.applyDamage) {
                bossHelper.applyDamage(bossDamage);
                appendToDebug && appendToDebug('Boss damaged by mine explosion for ' + bossDamage + ' hits');
              }
            } catch (e) {
              console.error('Failed to apply boss damage from mine explosion', e);
            }
            // Reset hint cycling state when boss damage is applied
            resetHintCyclingState();
          }

          renderBoard();
          await sleepAnimated(120);
        }
        try {
          cascadeResolve();
        } catch (e) {}
        // cascadeResolve will continue the pipeline - set flag to exit current cascade
        continueCascade = false;
      }
    } catch (e) {
      console.error('Pending explosion processing failed', e);
    }

    // After a player-induced move, decrement mine counters and schedule explosions as needed
    try {
      if (moveOccurredThisTurn) {
        moveOccurredThisTurn = false;
        try {
          moveCount = typeof moveCount === 'number' ? moveCount + 1 : 1;
        } catch (e) {}
        // Notify boss system that a move has advanced
        try {
          bossHelper && bossHelper.onMoveAdvance && bossHelper.onMoveAdvance();
        } catch (e) {}
        const toExplode = processMineCountdowns(board, BOARD_ROWS, BOARD_COLS);
        if (toExplode.length > 0) {
          // queue explosions for processing: mark neighbors clearing, show brief animation, then remove
          // Calculate boss damage from destroyed modules
          let bossDamage = 0;
          const bossMarker = window.__BOSS_MARKER;

          for (const ex of toExplode) {
            const { r, c } = ex;
            // mark neighbors
            for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
              for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
                if (board[rr][cc]) {
                  board[rr][cc].clearing = true;
                }
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
                      try {
                        totalShatters = typeof totalShatters === 'number' ? totalShatters + 1 : 1;
                      } catch (e) {}
                      try {
                        const shType = rem.type || 'Unknown';
                        const shardMap = { Common: 5,
                          Rare: 10,
                          Epic: 40 };
                        const shards = shardMap[rem.rarity] || 0;
                        awardShards(shType, shards);
                      } catch (e) {}

                      // Calculate boss damage if boss is present at explosion center
                      if (bossMarker && bossMarker.r === r && bossMarker.c === c) {
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
                        bossDamage += damageMap[rem.rarity] || 0;
                      }
                    }
                    // chain any mines hit by this explosion
                    try {
                      if (rem.templateId === '__MINE__') {
                        pendingExplosions.push({ r: rr,
                          c: cc });
                      }
                    } catch (e) {}
                  }
                } catch (e) {}
                board[rr][cc] = null;
              }
            }
            renderBoard();
            await sleepAnimated(120);
          }

          // Apply boss damage if any was calculated
          if (bossDamage > 0) {
            try {
              if (bossHelper && bossHelper.applyDamage) {
                bossHelper.applyDamage(bossDamage);
                appendToDebug && appendToDebug('Boss damaged by mine explosion for ' + bossDamage + ' hits');
              }
            } catch (e) {
              console.error('Failed to apply boss damage from mine explosion', e);
            }
            // Reset hint cycling state when boss damage is applied
            resetHintCyclingState();
          }
          // After explosions, run cascade to refill resulting holes
          try {
            cascadeResolve();
          } catch (e) {}
        } else {
          // No explosions but mines counters changed; re-render to show updated numbers
          renderBoard();
        }
      }
    } catch (e) {
      console.error('Mine processing failed', e);
    }
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
// Wire up state helpers (save/load/award) using makeStateHelpers
const _stateHelpers = makeStateHelpers({
  get: k => {
    try {
      switch (k) {
      case 'board':
        return board;
      case 'inventory':
        return inventory;
      case 'shuffleRemaining':
        return shuffleRemaining;
      case 'score':
        return score;
      case 'completed':
        return completed;
      case 'autoShatterRares':
        return autoShatterRares;
      case 'badLuckCounter':
        return badLuckCounter;
      case 'BASE_RATES':
        return BASE_RATES;
      case 'ORIENTATION':
        return ORIENTATION;
      case 'BOARD_ROWS':
        return BOARD_ROWS;
      case 'BOARD_COLS':
        return BOARD_COLS;
      case 'CHART_VISIBLE':
        return CHART_VISIBLE;
      case 'moveCount':
        return moveCount;
      case 'totalMerges':
        return totalMerges;
      case 'totalShatters':
        return totalShatters;
      case 'shardsEarned':
        return shardsEarned;
      case 'persistedSettings':
        return {
          background: (() => {
            try {
              return localStorage.getItem('background') || '';
            } catch (e) {
              return '';
            }
          })(),
          disableAnimations: (() => {
            try {
              return localStorage.getItem('disableAnimations') || '0';
            } catch (e) {
              return '0';
            }
          })(),
          devToolsVisible: !!DEV_TOOLS_VISIBLE,
          animSpeed: typeof animSpeed === 'number' ? animSpeed : null,
          useVectorOnly: !!useVectorOnly,
        };
      default:
        return undefined;
      }
    } catch (e) {
      return undefined;
    }
  },
  set: (k, v) => {
    try {
      switch (k) {
      case 'board':
        board = v;
        break;
      case 'inventory':
        inventory = v;
        break;
      case 'shuffleRemaining':
        shuffleRemaining = v;
        break;
      case 'score':
        score = v;
        break;
      case 'completed':
        completed = v;
        break;
      case 'autoShatterRares':
        autoShatterRares = v;
        break;
      case 'badLuckCounter':
        badLuckCounter = v;
        break;
      case 'BASE_RATES':
        Object.assign(BASE_RATES, v);
        break;
      case 'ORIENTATION':
        ORIENTATION = v;
        break;
      case 'BOARD_ROWS':
        BOARD_ROWS = v;
        break;
      case 'BOARD_COLS':
        BOARD_COLS = v;
        break;
      case 'CHART_VISIBLE':
        CHART_VISIBLE = v;
        break;
      case 'moveCount':
        moveCount = v;
        break;
      case 'totalMerges':
        totalMerges = v;
        break;
      case 'totalShatters':
        totalShatters = v;
        break;
      case 'shardsEarned':
        shardsEarned = v;
        break;
      case 'persistedSettings':
        /* noop: persisted settings handled elsewhere */ break;
      default:
        break;
      }
    } catch (e) {}
  },
  localStorage: window && window.localStorage ? window.localStorage : null,
  appendToDebug: appendToDebug,
  ensureBoardBindings: ensureBoardBindings,
  updateScoreUI: updateScoreUI,
  renderBoard: renderBoard,
  bossHelper: bossHelper,
});

const saveGameState = _stateHelpers.saveGameState;
const loadGameState = _stateHelpers.loadGameState;
const awardShards = _stateHelpers.awardShards;

// Export awardShards to window for runtime introspection/debugging
try {
  try {
    window.awardShards = awardShards;
  } catch (e) {}
  try {
    window.__awardShards_marker = 'awardShards_defined_' + new Date().toISOString();
  } catch (e) {}
  try {
    console.info && console.info('awardShards exported to window; marker=', window.__awardShards_marker);
  } catch (e) {}
} catch (e) {}

// Ensure the merge chart element exists (create and insert before the board if missing).
function ensureMergeChartElement() {
  try {
    if (document.getElementById('merge-chart-wrap')) {
      return;
    }
    const app = document.getElementById('app') || document.body;
    const chartWrap = document.createElement('div');
    chartWrap.id = 'merge-chart-wrap';
    const chartImg = document.createElement('img');
    chartImg.id = 'merge-chart-img';
    // resolve URL from centralized import or fallback
    let resolvedChartUrl =
      typeof importedMergeChart !== 'undefined' && importedMergeChart
        ? importedMergeChart
        : null;
    try {
      resolvedChartUrl = new URL(String(resolvedChartUrl), location.href).href;
    } catch (e) {
      resolvedChartUrl = String(resolvedChartUrl || '') || '/assets/merge_chart.png';
    }
    chartImg.src = resolvedChartUrl;
    chartImg.alt = 'Merge chart';
    chartImg.style.width = '100%';
    chartImg.style.height = 'auto';
    chartImg.style.display = 'block';
    chartImg.style.border = '1px solid #222';
    chartImg.style.background = '#070707';
    chartImg.style.padding = '6px';
    chartImg.onload = () => {
      try {
        appendToDebug && appendToDebug('Merge chart loaded: ' + chartImg.src);
      } catch (e) {}
    };
    chartImg.onerror = () => {
      try {
        appendToDebug && appendToDebug('Merge chart failed to load: ' + chartImg.src);
      } catch (e) {}
      chartWrap.innerHTML = '';
      const note = document.createElement('div');
      note.textContent = 'Merge chart not available';
      note.style.color = '#fff';
      note.style.padding = '6px';
      chartWrap.appendChild(note);
    };
    chartWrap.appendChild(chartImg);
    // Prefer inserting the chart as a sibling of the main game column so
    // the top-level #app flex row can lay it out to the left of the board.
    const mainCol = document.querySelector('.bejeweled-container');
    if (mainCol && mainCol.parentNode === app) {
      app.insertBefore(chartWrap, mainCol);
    } else {
      // Fallback: if bejeweled container isn't available, try inserting before
      // the board element as previously done, or append to app as a last resort.
      const boardEl = document.getElementById('game-board');
      if (boardEl && boardEl.parentNode) {
        boardEl.parentNode.insertBefore(chartWrap, boardEl);
      } else {
        app.insertBefore(chartWrap, app.firstChild || null);
      }
    }
    chartWrap.style.display = CHART_VISIBLE ? 'block' : 'none';
  } catch (e) {
    try {
      console.debug && console.debug('ensureMergeChartElement failed', e);
    } catch (ee) {}
  }
}

// Setup UI elements on DOMContentLoaded
function initUI() {
  // create minimal UI if not present
  const app = document.getElementById('app') || document.body;

  // Function to set shuffle remaining count
  function setShuffleRemaining(value) {
    shuffleRemaining = Math.max(0, value);
  }
  // Create chart element early so the Show Chart control always has an element to toggle.
  try {
    ensureMergeChartElement();
  } catch (e) {}
  // Startup diagnostic: dump persisted boss/dev keys and the main save payload
  try {
    const sSpawn = localStorage.getItem('devBossSpawn');
    const sHits = localStorage.getItem('devBossHits');
    const sThresh = localStorage.getItem('devBossThreshold');
    const bossStateRaw = localStorage.getItem('boss_state_v1');
    let savePayload = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        savePayload = JSON.parse(raw);
      }
    } catch (e) {
      savePayload = '<parse error>';
    }
    try {
      appendToDebug &&
        appendToDebug(
          'Startup persist dump: devBossSpawn=' +
            sSpawn +
            ' devBossHits=' +
            sHits +
            ' devBossThreshold=' +
            sThresh +
            ' boss_state_v1=' +
            (bossStateRaw ? '<present>' : '<missing>') +
            ' save_hasBossState=' +
            (savePayload && savePayload.bossState ? '1' : '0'),
        );
    } catch (e) {}
    try {
      console.debug('Startup persist dump', {
        devBossSpawn: sSpawn,
        devBossHits: sHits,
        devBossThreshold: sThresh,
        boss_state_v1: bossStateRaw,
        savePayload,
      });
    } catch (e) {}
  } catch (e) {
    try {
      console.error('Startup persist dump failed', e);
    } catch (e2) {}
  }
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
        } catch (e) {
          console.error('Promote dev boss keys failed', e);
        }
      }
    }
  } catch (e) {
    console.error('Promote dev boss settings early failed', e);
  }
  if (!document.getElementById('game-board')) {
    // Outer container: left column (board + controls) and right column (inventory)
    const outer = document.createElement('div');
    outer.style.display = 'flex';
    outer.style.flexDirection = 'row';
    outer.style.gap = '12px';
    outer.style.alignItems = 'flex-start';
    outer.style.margin = '12px';

    // Chart is handled by ensureMergeChartElement() above; merge-chart-wrap will be present.

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.gap = '8px';

    const info = document.createElement('div');
    info.id = 'game-info';
    left.appendChild(info);

    const boardDiv = document.createElement('div');
    boardDiv.id = 'game-board';
    // Create a horizontal wrapper so the chart appears to the left of the board
    const chartBoardWrap = document.createElement('div');
    chartBoardWrap.style.display = 'flex';
    chartBoardWrap.style.flexDirection = 'row';
    chartBoardWrap.style.gap = '12px';
    chartBoardWrap.style.alignItems = 'flex-start';
    // If a merge-chart element exists, move it into the horizontal wrapper and place it left of the board
    try {
      const existingChart = document.getElementById('merge-chart-wrap');
      if (existingChart) {
        existingChart.style.display = CHART_VISIBLE ? 'block' : 'none';
        // constrain chart width so board and chart sit nicely; allow override via CSS
        existingChart.style.maxWidth = '360px';
        existingChart.style.flex = '0 0 auto';
        chartBoardWrap.appendChild(existingChart);
      }
    } catch (e) {}
    // Board goes to the right side of the wrapper
    chartBoardWrap.appendChild(boardDiv);
    left.appendChild(chartBoardWrap);

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

    // Hint button: cycle through suggested valid moves
    const btnHint = document.createElement('button');
    btnHint.id = 'btn-hint';
    btnHint.textContent = 'Hint';
    btnHint.addEventListener('click', () => {
      try {
        console.debug('Hint button clicked');
      } catch (e) {}
      try {
        if (!board || !Array.isArray(board)) {
          appendToDebug && appendToDebug('Hint handler: board is not initialized');
          console.error('Hint handler: board is not initialized', { board });
          return;
        }

        // Update the hint moves list if board has changed
        updateHintMovesList();

        if (getHintMovesList().length === 0) {
          alert('No valid moves available');
          return;
        }

        // Cycle through the available moves
        const selectedMove = getHintMovesList()[getCurrentHintIndex()];
        setHintMove(selectedMove);

        // Move to next move in the list (wrap around)
        setCurrentHintIndex((getCurrentHintIndex() + 1) % getHintMovesList().length);

        try {
          appendToDebug &&
            appendToDebug(
              'Hint cycling: showing move ' +
                (getCurrentHintIndex() + 1) +
                ' of ' +
                getHintMovesList().length +
                ' prioritized moves',
            );
        } catch (e) {}
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
      inventory = { Cannon: null,
        Generator: null,
        Armor: null,
        Core: null };
      shuffleRemaining = 3;
      // commonSwapRemaining is deprecated - free swap is now permanent
      // reset session stats and shard totals
      try {
        moveCount = 0;
      } catch (e) {}
      try {
        totalMerges = 0;
      } catch (e) {}
      try {
        totalShatters = 0;
      } catch (e) {}
      try {
        shardsEarned = { Cannon: 0,
          Armor: 0,
          Generator: 0,
          Core: 0 };
      } catch (e) {}
      try {
        score = 0;
      } catch (e) {}
      createBoard();
      renderBoard();
      renderInventory();
      try {
        updateScoreUI();
      } catch (e) {}
      try {
        saveGameState();
      } catch (e) {}
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
          appendToDebug &&
            appendToDebug(`DBG:right-column rect top=${Math.round(rrect.top)}, height=${Math.round(rrect.height)}`);
        }
        if (brd) {
          const brect = brd.getBoundingClientRect();
          appendToDebug &&
            appendToDebug(`DBG:board rect top=${Math.round(brect.top)}, height=${Math.round(brect.height)}`);
        }
      } catch (e) {
        try {
          appendToDebug && appendToDebug('DBG:right-column debug failed: ' + String(e));
        } catch (e2) {}
      }
    });
  }

  // Try to load saved state; if none, create a new board
  if (!loadGameState()) {
    createBoard();
    // start fresh timer for new game
    try {
      resetGameTimer();
      startGameTimer();
    } catch (e) {}
  }
  try {
    makeBoardBindings(boardModule, setHintSystemDependencies, appendToDebug).ensureBoardBindings.bind({
      board,
      inventory,
      BOARD_ROWS,
      BOARD_COLS,
      pendingExplosions,
      moveOccurredThisTurn,
      awardShards,
      renderBoard,
      sleepAnimated,
      cascadeResolve,
      shuffleRemaining,
      setShuffleRemaining,
      getHintMovesList,
      setHintMove,
      getHintMove,
      findAllGroups,
      hasStraightTriple,
      extractStraightRunPositions,
      autoShatterRares,
      animating,
      makeDrop,
      maybeConvertToMine,
      bossHelper,
      processMineCountdowns,
      moveCount,
      totalShatters,
      setTotalShatters: v => (totalShatters = v),
      checkForValidMoves,
      createBoard,
      resetHintCyclingState,
      __BOSS_MARKER: window.__BOSS_MARKER,
      __main_globals__: {
        hintMovesList: getHintMovesList(),
        currentHintIndex: getCurrentHintIndex(),
        lastBoardState: getLastBoardState(),
      },
    })();
  } catch (e) {}
  // Ensure board module bindings are set up with the correct functions
  try {
    ensureBoardBindings();
  } catch (e) {}
  // initialize boss integration now that UI and board exist
  try {
    initBossIntegration({
      BOARD_ROWS,
      BOARD_COLS,
      moveCount,
      getCellAt: (r, c) => (board[r] && board[r][c] ? board[r][c] : null),
      removeCellAt: (r, c) => {
        if (board[r]) {
          board[r][c] = null;
        }
      },
      awardShards: (type, amt) => awardShards(type, amt),
      renderBoard: () => renderBoard(),
      appendToDebug: appendToDebug,
      onBossDefeated: b => {
        /* reward placeholder: grant shards to all players? currently just log */ appendToDebug &&
          appendToDebug('Boss defeated at ' + JSON.stringify(b));
      },
      setBossOnBoard: b => {
        /* store boss marker on board for rendering hooks (not placing a real cell) */ window.__BOSS_MARKER = b || null;
      },
      getCellAtRaw: (r, c) => (board[r] && board[r][c] ? board[r][c] : null),
      SAVE_KEY: SAVE_KEY,
    });
  } catch (e) {}

  cascadeResolve(); // auto-resolve any initial shatterable groups on load
  renderBoard();
  // start lazy preloads now that the board and UI have rendered
  try {
    lazyPreloadAssets();
  } catch (e) {}
  // Sync chart visibility from persisted state (if present)
  const ch = document.getElementById('merge-chart-wrap');
  if (ch) {
    ch.style.display = CHART_VISIBLE ? 'block' : 'none';
  }
  const chartBtn = document.getElementById('btn-toggle-chart');
  if (chartBtn) {
    chartBtn.textContent = CHART_VISIBLE ? 'Hide Chart' : 'Show Chart';
  }
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
  // Set up hint system inactivity listeners
  try {
    setupInactivityListeners();
  } catch (e) {
    try {
      console.debug && console.debug('setupInactivityListeners failed', e);
    } catch (ee) {}
  }
  // inject an in-page debug console for environments without DevTools
  ensureDebugConsole({
    shuffleRemaining,
    setShuffleRemaining: v => (shuffleRemaining = v),
    BASE_RATES,
    MINE_SPAWN_PERCENT,
    setMineSpawnPercent: setMineSpawnPercent,
    RARITY_RANK,
    ALL_TEMPLATES,
    animSpeed,
    setAnimSpeed: v => (animSpeed = v),
    useVectorOnly,
    setUseVectorOnly: v => (useVectorOnly = v),
    bossHelper,
  });
  // Instantiate score UI factory (delegates score pill rendering and timer placement)
  try {
    initScoreUI({
      getState: () => ({ moveCount,
        totalMerges,
        totalShatters,
        shardsEarned }),
      TYPE_TOKENS: TYPE_TOKENS,
      formatTimer: formatTimer,
      startGameTimer: startGameTimer,
      bossHelper,
    });
    try {
      updateScoreUI();
    } catch (e) {}
  } catch (e) {}
  // Apply restored UI settings: background, animations, anim speed, vector-only, and dev tools visibility
  try {
    try {
      const savedBg = localStorage.getItem('background');
      if (savedBg) {
        applyBackground(savedBg);
      }
    } catch (e) {}
    try {
      const da = !!localStorage.getItem('disableAnimations') && localStorage.getItem('disableAnimations') !== '0';
      applyDisableAnimations(da);
    } catch (e) {}
    try {
      document.documentElement.style.setProperty('--anim-speed', String(animSpeed || 1));
    } catch (e) {}
    try {
      if (useVectorOnly) {
        renderInventory && renderInventory();
        renderBoard && renderBoard();
      }
    } catch (e) {}
    try {
      const wrap = document.getElementById('debug-console-wrap');
      if (wrap) {
        wrap.style.display = DEV_TOOLS_VISIBLE ? 'block' : 'none';
        const ctrlBtn = document.getElementById('btn-devtools-toggle');
        if (ctrlBtn) {
          ctrlBtn.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
        }
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
    if (gameTimerStart) {
      localStorage.setItem('gameTimerStart', String(gameTimerStart));
    }
    localStorage.setItem('gameTimerRunning', gameTimerInterval ? '1' : '0');
  } catch (e) {}
}, 2000);

window.addEventListener('beforeunload', () => {
  try {
    if (gameTimerStart) {
      localStorage.setItem('gameTimerStart', String(gameTimerStart));
    }
    localStorage.setItem('gameTimerRunning', gameTimerInterval ? '1' : '0');
  } catch (e) {}
});
