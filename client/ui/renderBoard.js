import { requiredTotalForBaseCell } from '../game/rules.js';

export function renderBoard(dependencies = {}) {
  const {
    BOARD_COLS = 14,
    BOARD_ROWS = 8,
    board = [],
    isDisabledByMine = () => false,
    bossImg = '',
    badLuckCounter = 0,
    inventory = {},
    updateScoreUI = () => {},
    updateMergePreview = () => {},
    shuffleRemaining = 3,
    ensureControls = () => {},
    saveGameState = () => {},
    resetInactivity = () => {},
    adjustRightColumnToBoard = () => {},
    evaluateMergeAttempt = () => {},
    onCellClick = () => {},
    onCellContextMenu = () => {},
    handleLongPress = () => {},
    appendToDebug = () => {},
    useVectorOnly = false,
    findTemplate = () => null,
    HARDCODED_COMMON_SELECTION = {},
    MINE_ASSET = '',
    RARITY_COLOR = {},
    ASSETS = {},
    predictMergeResult = () => null,
  } = dependencies;
  let selected = dependencies.selected || [];
  let mergeSelecting = dependencies.mergeSelecting || false;
  let candidateHighlights = dependencies.candidateHighlights || new Set();
  let hintMove = dependencies.hintMove || null;
  let longPressTimer = dependencies.longPressTimer || null;
  let bossShatterSelecting = dependencies.bossShatterSelecting || false;
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) {
    return;
  }
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
        try {
          this._readyToMerge = false;
        } catch (e) {}
        try {
          // Let evaluateMergeAttempt manage clearing selection/state; call it directly.
          evaluateMergeAttempt();
        } catch (e) {}
        return;
      }
      if (this._longPressed) {
        this._longPressed = false;
        return;
      }
      const rr = parseInt(this.dataset.r, 10);
      const cc = parseInt(this.dataset.c, 10);
      onCellClick(ev, rr, cc);
    });
    el.addEventListener('contextmenu', function(ev) {
      ev.preventDefault();
      const rr = parseInt(this.dataset.r, 10);
      const cc = parseInt(this.dataset.c, 10);
      onCellContextMenu(rr, cc);
    });
    // pointer interactions (long-press)
    el._pointerInfo = { pointerDown: false,
      startX: 0,
      startY: 0 };
    el.addEventListener('pointerdown', function(ev) {
      const self = this;
      self._pointerInfo.pointerDown = true;
      self._pointerInfo.startX = ev.clientX;
      self._pointerInfo.startY = ev.clientY;
      // don't start long-press on Commons (Commons should not support long-press merge-select)
      // but allow long-press on boss positions regardless of underlying cell
      try {
        const rr = parseInt(self.dataset.r, 10);
        const cc = parseInt(self.dataset.c, 10);
        const cell = board && board[rr] && board[rr][cc] ? board[rr][cc] : null;
        const bm = window.__BOSS_MARKER || null;
        const isBossPosition = bm && bm.r === rr && bm.c === cc;
        if (cell && cell.rarity === 'Common' && !isBossPosition) {
          return;
        }
      } catch (e) {}
      // Clear any existing timer for this element
      if (self._longPressTimer) {
        clearTimeout(self._longPressTimer);
        self._longPressTimer = null;
      }
      self._longPressTimer = setTimeout(() => {
        self._longPressTimer = null;
        try {
          self._longPressed = true;
        } catch (e) {}
        handleLongPress(parseInt(self.dataset.r, 10), parseInt(self.dataset.c, 10));
      }, 450);
    });
    el.addEventListener('pointerup', function(ev) {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
      this._pointerInfo.pointerDown = false;
    });
    el.addEventListener('pointercancel', function() {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
      this._pointerInfo.pointerDown = false;
    });
    el.addEventListener('pointermove', function(ev) {
      if (!this._pointerInfo.pointerDown) {
        return;
      }
      if (Math.abs(ev.clientX - this._pointerInfo.startX) > 8 || Math.abs(ev.clientY - this._pointerInfo.startY) > 8) {
        if (this._longPressTimer) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
        this._pointerInfo.pointerDown = false;
      }
    });
    boardDiv.appendChild(el);
  }
  // remove extras if grid shrunk
  while (boardDiv.children.length > total) {
    boardDiv.removeChild(boardDiv.lastChild);
  }

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const idx = r * BOARD_COLS + c;
      const el = boardDiv.children[idx];
      const cell = board[r] && board[r][c] ? board[r][c] : null;
      // update dataset for event handlers
      el.dataset.r = String(r);
      el.dataset.c = String(c);
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
        const normalizedSel = selected.map(s => {
          if (!s) {
            return null;
          }
          if (s.inv) {
            return { cell: inventory[s.inv] || s.cell,
              inv: s.inv };
          }
          if (typeof s.r === 'number' && typeof s.c === 'number') {
            return { cell: (board[s.r] && board[s.r][s.c]) || s.cell,
              r: s.r,
              c: s.c };
          }
          return s;
        });
        const predicted = predictMergeResult(normalizedSel);
        const ready = selected.length === required && predicted !== null;
        el.classList.toggle('predicted-clickable', !!ready);
        el.style.cursor = ready ? 'pointer' : 'default';
        el.title = ready ? 'Tap to confirm merge' : '';
        try {
          el._readyToMerge = !!ready;
        } catch (e) {}
      } else {
        // default cursor for cells
        el.style.cursor = 'pointer';
        el.title = '';
        try {
          el._readyToMerge = false;
        } catch (e) {}
      }
      // candidate highlight
      el.classList.toggle('candidate', candidateHighlights && candidateHighlights.has(r + ',' + c));
      // visually mark tiles that are disabled due to adjacency to a live mine
      try {
        el.classList.toggle('disabled-by-mine', !!(cell && isDisabledByMine(cell)));
      } catch (e) {
        /* guard if helper not available in rare cases */
      }
      // hint pulse with alternating outlines
      const hintActive =
        hintMove && ((hintMove.r === r && hintMove.c === c) || (hintMove.nr === r && hintMove.nc === c));
      el.classList.toggle('hint-pulse', !!hintActive);
      if (hintActive) {
        // Determine if this is the first or second cell in the hint move
        const isFirstCell = hintMove.r === r && hintMove.c === c;
        const isSecondCell = hintMove.nr === r && hintMove.nc === c;

        if (isFirstCell) {
          // First cell: green pulsing outline
          el.style.animationName = 'hintPulse';
          el.style.boxShadow = '0 0 12px 6px rgba(0,255,160,0.18)';
          el.style.border = '2px solid rgba(0,255,160,0.6)';
          el.style.zIndex = '30';
          el.style.animationDelay = '0s';
        } else if (isSecondCell) {
          // Second cell: cyan pulsing outline with delay for alternating effect
          el.style.animationName = 'hintPulseAlt';
          el.style.boxShadow = '0 0 12px 6px rgba(0,255,255,0.18)';
          el.style.border = '2px solid rgba(0,255,255,0.6)';
          el.style.zIndex = '30';
          el.style.animationDelay = '0.6s'; // Half the animation duration for alternating
        }
      } else {
        el.style.animationName = '';
        el.style.boxShadow = '';
        el.style.border = '1px solid #222';
        el.style.zIndex = '';
        el.style.animationDelay = '';
      }

      // If same instance already rendered here, skip rebuilding inner shape to avoid image re-creation
      const prevId = el._cellInstanceId || null;
      const curId = cell && cell.instanceId ? cell.instanceId : null;
      if (prevId === curId) {
        // still need to update selection badge in case selection changed
        const existingBadge = el.querySelector('.selection-badge');
        if (existingBadge) {
          existingBadge.remove();
        }
        if (selIdx >= 0) {
          const badge = document.createElement('div');
          badge.className = 'selection-badge';
          badge.textContent = String(selIdx + 1);
          el.appendChild(badge);
        }
        // Update mine badge if movesRemaining changed
        try {
          if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
            const existingMineBadge = el.querySelector('.mine-badge');
            const currentMoves = cell.movesRemaining !== null ? cell.movesRemaining : 10;
            if (existingMineBadge) {
              const displayedMoves = parseInt(existingMineBadge.textContent, 10);
              if (displayedMoves !== currentMoves) {
                existingMineBadge.textContent = String(currentMoves);
              }
            } else {
              // Mine badge missing, need to rebuild
              while (el.firstChild) {
                el.removeChild(el.firstChild);
              }
              el._cellInstanceId = null; // Force rebuild
            }
          }
        } catch (e) {}
        // Sync boss overlay presence even when the cell instance didn't change (avoid stale boss UI)
        try {
          const bm = window.__BOSS_MARKER || null;
          const existingBossImg = el.querySelector('img[data-boss]');
          const existingBossNum = el.querySelector('.boss-number-overlay[data-boss]');
          const existingDamagePreview = el.querySelector('.boss-damage-preview');
          if (bm && bm.r === r && bm.c === c) {
            // ensure boss visuals are present
            if (!existingBossImg) {
              const bi = document.createElement('img');
              bi.src = bossImg;
              bi.alt = 'boss';
              bi.dataset.boss = '1';
              bi.style.position = 'absolute';
              bi.style.left = '50%';
              bi.style.top = '50%';
              bi.style.transform = 'translate(-50%,-50%)';
              bi.style.width = '82%';
              bi.style.height = '82%';
              bi.style.zIndex = '60';
              el.appendChild(bi);
            }
            if (!existingBossNum) {
              const num = document.createElement('div');
              num.className = 'boss-number-overlay';
              num.dataset.boss = '1';
              num.textContent = String(bm.hitsRemaining || '');
              num.style.position = 'absolute';
              num.style.left = '50%';
              num.style.top = '6px';
              num.style.transform = 'translateX(-50%)';
              num.style.color = '#fff';
              num.style.fontWeight = '900';
              num.style.textShadow = '0 0 6px rgba(0,0,0,0.8)';
              num.style.zIndex = '70';
              el.appendChild(num);
            } else {
              // update number text
              try {
                existingBossNum.textContent = String(bm.hitsRemaining || '');
              } catch (e) {}
            }

            // Update or create damage preview
            try {
              if (bossShatterSelecting && selected && selected.length > 0) {
                const selectedModules = selected.filter(s => !(s.r === bm.r && s.c === bm.c));
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
                    if (!existingDamagePreview) {
                      const damagePreview = document.createElement('div');
                      damagePreview.className = 'boss-damage-preview';
                      damagePreview.textContent = `-${totalDamage}`;
                      damagePreview.style.position = 'absolute';
                      damagePreview.style.left = '50%';
                      damagePreview.style.bottom = '6px';
                      damagePreview.style.transform = 'translateX(-50%)';
                      damagePreview.style.color = '#ff0000';
                      damagePreview.style.fontWeight = 'bold';
                      damagePreview.style.fontSize = '18px';
                      damagePreview.style.textShadow = '2px 2px 4px rgba(0,0,0,1), 0 0 8px rgba(255,0,0,0.8)';
                      damagePreview.style.background = 'rgba(0,0,0,0.7)';
                      damagePreview.style.padding = '2px 6px';
                      damagePreview.style.borderRadius = '4px';
                      damagePreview.style.border = '2px solid #ff0000';
                      damagePreview.style.zIndex = '75';
                      el.appendChild(damagePreview);
                    } else {
                      existingDamagePreview.textContent = `-${totalDamage}`;
                    }
                  } else if (existingDamagePreview) {
                    existingDamagePreview.remove();
                  }
                } else if (existingDamagePreview) {
                  existingDamagePreview.remove();
                }
              } else if (existingDamagePreview) {
                existingDamagePreview.remove();
              }
            } catch (e) {
              /* ignore errors in damage preview */
            }

            // apply boss highlight styling
            el.classList.add('boss-pulse');
            el.style.boxShadow = '0 0 12px 6px rgba(255,80,80,0.18)';
            el.style.border = '2px solid rgba(255,80,80,0.6)';
            el.style.zIndex = '30';
          } else {
            // remove stale boss visuals if present
            if (existingBossImg) {
              existingBossImg.remove();
            }
            if (existingBossNum) {
              existingBossNum.remove();
            }
            if (existingDamagePreview) {
              existingDamagePreview.remove();
            }
            el.classList.remove('boss-pulse');
            el.style.boxShadow = '';
            el.style.border = '1px solid #222';
            el.style.zIndex = '';
          }
        } catch (e) {}
        continue;
      }

      // instance changed (or became null) — rebuild content
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      el._cellInstanceId = curId;
      if (cell) {
        const SHAPE_SIZE = 60;
        const shape = buildShape(cell, SHAPE_SIZE, {
          useVectorOnly,
          RARITY_COLOR,
          ASSETS,
          HARDCODED_COMMON_SELECTION,
          MINE_ASSET,
          appendToDebug,
        });
        el.appendChild(shape);
        if (selIdx >= 0) {
          const badge = document.createElement('div');
          badge.className = 'selection-badge';
          badge.textContent = String(selIdx + 1);
          el.appendChild(badge);
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
            bi.style.left = '50%';
            bi.style.top = '50%';
            bi.style.transform = 'translate(-50%, -50%)';
            bi.style.width = '82%';
            bi.style.height = '82%';
            bi.style.zIndex = '60';
            el.appendChild(bi);
            const num = document.createElement('div');
            num.className = 'boss-number-overlay';
            num.dataset.boss = '1';
            num.textContent = String(bm.hitsRemaining || '');
            num.style.position = 'absolute';
            num.style.left = '50%';
            num.style.top = '6px';
            num.style.transform = 'translateX(-50%)';
            num.style.color = '#fff';
            num.style.fontWeight = '900';
            num.style.textShadow = '0 0 6px rgba(0,0,0,0.8)';
            num.style.zIndex = '70';
            el.appendChild(num);

            // Add damage preview directly on the boss cell
            try {
              if (bossShatterSelecting && selected && selected.length > 0) {
                const selectedModules = selected.filter(s => !(s.r === bm.r && s.c === bm.c));
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
                    const damagePreview = document.createElement('div');
                    damagePreview.textContent = `-${totalDamage}`;
                    damagePreview.style.position = 'absolute';
                    damagePreview.style.left = '50%';
                    damagePreview.style.bottom = '6px';
                    damagePreview.style.transform = 'translateX(-50%)';
                    damagePreview.style.color = '#ff0000';
                    damagePreview.style.fontWeight = 'bold';
                    damagePreview.style.fontSize = '18px';
                    damagePreview.style.textShadow = '2px 2px 4px rgba(0,0,0,1), 0 0 8px rgba(255,0,0,0.8)';
                    damagePreview.style.background = 'rgba(0,0,0,0.7)';
                    damagePreview.style.padding = '2px 6px';
                    damagePreview.style.borderRadius = '4px';
                    damagePreview.style.border = '2px solid #ff0000';
                    damagePreview.style.zIndex = '75';
                    el.appendChild(damagePreview);
                  }
                }
              }
            } catch (e) {
              /* ignore errors in damage preview */
            }

            // apply boss highlight styling
            el.classList.add('boss-pulse');
            el.style.boxShadow = '0 0 12px 6px rgba(255,80,80,0.18)';
            el.style.border = '2px solid rgba(255,80,80,0.6)';
            el.style.zIndex = '30';
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
  try {
    saveGameState();
  } catch (e) {
    /* ignore */
  }
  // ensure inactivity timer is running after each render
  resetInactivity();

  // adjust right-column to visually align with the board
  try {
    adjustRightColumnToBoard();
  } catch (e) {}
}

export function buildMiniShape(
  cell,
  size = 36,
  { useVectorOnly, RARITY_COLOR, ASSETS, HARDCODED_COMMON_SELECTION, MINE_ASSET, appendToDebug } = {},
) {
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
    v.style.position = 'absolute';
    v.style.left = '50%';
    v.style.top = '50%';
    v.style.transform = 'translate(-50%,-50%)';
    const bg = RARITY_COLOR[cell.rarity] || '#808080';
    const SH = Math.max(10, Math.round(size * 0.86));
    const s = document.createElement('div');
    s.style.width = SH + 'px';
    s.style.height = SH + 'px';
    s.style.background = bg;
    if (cell.shape === 'circle') {
      s.style.borderRadius = '50%';
    }
    if (cell.shape === 'square') {
      s.style.borderRadius = '4px';
    }
    if (cell.shape === 'triangle') {
      s.style.clipPath = 'polygon(50% 6%, 94% 94%, 6% 94%)';
    }
    if (cell.shape === 'diamond') {
      s.style.transform = 'rotate(45deg)';
    }
    v.appendChild(s);
    wrapper.appendChild(v);
    return wrapper;
  }

  // helper: normalize template id to filename-friendly token
  const normalize = id =>
    String(id || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
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
    if (cell && cell._frameSrc) {
      frameSrc = cell._frameSrc;
    }
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
    }
  } catch (e) {}
  // If persisted assets weren't present, fall back to ASSETS lookup
  if (!frameSrc && ASSETS[dirKey]) {
    if (ASSETS[dirKey][frameKey]) {
      frameSrc = ASSETS[dirKey][frameKey];
    } else {
      const commonKey = 'mf_common' + (cell.plus ? '_plus' : '');
      if (ASSETS[dirKey][commonKey]) {
        frameSrc = ASSETS[dirKey][commonKey];
      } else if (ASSETS[dirKey]['mf_common']) {
        frameSrc = ASSETS[dirKey]['mf_common'];
      } else if (ASSETS[dirKey]['mf_empty']) {
        frameSrc = ASSETS[dirKey]['mf_empty'];
      }
    }
  }
  if (!moduleSrc) {
    try {
      const map = ASSETS[dirKey] || {};
      if (tmpl) {
        // prefer exact rarity-prefixed key if present
        const prefKey = rarityKey + '_' + tmpl;
        if (map[prefKey]) {
          moduleSrc = map[prefKey];
          moduleFoundKey = prefKey;
        }
        // then prefer canonical rare_ prefix
        else if (map['rare_' + tmpl]) {
          moduleSrc = map['rare_' + tmpl];
          moduleFoundKey = 'rare_' + tmpl;
        }
        // then plain template key
        else if (map[tmpl]) {
          moduleSrc = map[tmpl];
          moduleFoundKey = tmpl;
        } else {
          // fallback: find any key that ends with '_' + tmpl
          for (const k of Object.keys(map)) {
            if (k.endsWith('_' + tmpl)) {
              moduleSrc = map[k];
              moduleFoundKey = k;
              break;
            }
          }
        }
      }
    } catch (e) {
      moduleSrc = null;
      moduleFoundKey = null;
    }
  }

  // Respect persisted instance assets: if the instance already has resolved URLs, prefer them and skip re-selection
  let persistedUsed = false;
  try {
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
      if (cell._frameSrc) {
        frameSrc = cell._frameSrc;
      }
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
        if (hard && map[hard]) {
          moduleSrc = map[hard];
          moduleFoundKey = hard;
        }
        // 2) prefer template-specific common in this dir
        else if (tmpl && map['common_' + tmpl]) {
          moduleSrc = map['common_' + tmpl];
          moduleFoundKey = 'common_' + tmpl;
        } else {
          // 3) first local common in this dir (sorted)
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) {
            localCommons.sort();
            moduleFoundKey = localCommons[0];
            moduleSrc = map[moduleFoundKey];
          } else {
            // 4) first global common across ASSETS
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
              moduleFoundKey = found.key;
              moduleSrc = ASSETS[found.dir][found.key];
              forcedAssetDir = found.dir;
              forcedAssetSrc = moduleSrc;
            } else {
              if (ASSETS[dirKey] && ASSETS[dirKey]['mf_empty']) {
                frameSrc = ASSETS[dirKey]['mf_empty'];
              } else {
                frameSrc = null;
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  try {
    appendToDebug &&
      appendToDebug(
        `buildMiniShape: dir=${dirKey} frameKey=${frameKey} frameSrc=${frameSrc} moduleKey=${moduleKey} moduleSrc=${moduleSrc}`,
      );
  } catch (e) {}

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
      try {
        appendToDebug && appendToDebug('imgFrame error: ' + frameSrc);
      } catch (e) {}
      imgFrame.remove();
    });
    imgFrame.addEventListener('load', () => {
      usedImage = true;
      try {
        const v = wrapper.querySelector('.vector-mini');
        if (v) {
          v.remove();
        }
      } catch (e) {}
    });
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
      try {
        appendToDebug && appendToDebug('imgMod error: ' + moduleSrc);
      } catch (e) {}
      imgMod.remove();
    });
    imgMod.addEventListener('load', () => {
      usedImage = true;
      try {
        const v = wrapper.querySelector('.vector-mini');
        if (v) {
          v.remove();
        }
      } catch (e) {}
    });
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
    initials.textContent =
      cell.initials ||
      (typeof cell.templateId === 'string'
        ? findTemplate(cell.templateId) && findTemplate(cell.templateId).initials
        : '');
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
      verts = [
        [50, 6],
        [94, 94],
        [6, 94],
      ];
    } else {
      verts = [
        [50, 6],
        [94, 50],
        [50, 94],
        [6, 50],
      ];
    }
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
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
    if (wrapper.querySelector('.vector-mini')) {
      return;
    }
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
      if (cell.shape === 'circle') {
        s.style.borderRadius = '50%';
      }
      if (cell.shape === 'square') {
        s.style.borderRadius = '4px';
      }
      if (cell.shape === 'triangle') {
        s.style.clipPath = 'polygon(50% 6%, 94% 94%, 6% 94%)';
      }
      if (cell.plus) {
        s.style.boxShadow = '0 0 10px rgba(255,255,255,0.9)';
      }
      v.appendChild(s);
    }
    wrapper.appendChild(v);
  }

  return wrapper;
}

export function buildShape(
  cell,
  size = 56,
  { useVectorOnly, RARITY_COLOR, ASSETS, HARDCODED_COMMON_SELECTION, MINE_ASSET, appendToDebug } = {},
) {
  // Try to render using image assets (frame + module overlay). If images missing, fall back to vector shapes.
  const wrapper = document.createElement('div');
  wrapper.className = 'module-shape';
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
    renderVector();
    return wrapper;
  }

  // Special-case: render mines with a placeholder bomb and movesRemaining badge
  try {
    if (cell && (cell.templateId === '__MINE__' || cell.rarity === 'Mine')) {
      const mineWrap = document.createElement('div');
      mineWrap.className = 'module-shape mine-shape';
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
      badge.textContent = String(cell.movesRemaining !== null ? cell.movesRemaining : 10);
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

  const normalize = id =>
    String(id || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
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
    if (cell && cell._frameSrc) {
      frameSrc = cell._frameSrc;
    }
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
    }
  } catch (e) {}
  // If persisted assets not present, fall back to ASSETS map lookup
  if (!frameSrc && ASSETS[dirKey]) {
    if (ASSETS[dirKey][frameKey]) {
      frameSrc = ASSETS[dirKey][frameKey];
    } else {
      const commonKey = 'mf_common' + (cell.plus ? '_plus' : '');
      if (ASSETS[dirKey][commonKey]) {
        frameSrc = ASSETS[dirKey][commonKey];
      } else if (ASSETS[dirKey]['mf_common']) {
        frameSrc = ASSETS[dirKey]['mf_common'];
      } else if (ASSETS[dirKey]['mf_empty']) {
        frameSrc = ASSETS[dirKey]['mf_empty'];
      }
    }
  }
  if (!moduleSrc) {
    try {
      const map = ASSETS[dirKey] || {};
      if (tmpl) {
        const prefKey = rarityKey + '_' + tmpl;
        if (map[prefKey]) {
          moduleSrc = map[prefKey];
          moduleFoundKey = prefKey;
        } else if (map['rare_' + tmpl]) {
          moduleSrc = map['rare_' + tmpl];
          moduleFoundKey = 'rare_' + tmpl;
        } else if (map[tmpl]) {
          moduleSrc = map[tmpl];
          moduleFoundKey = tmpl;
        } else {
          for (const k of Object.keys(map)) {
            if (k.endsWith('_' + tmpl)) {
              moduleSrc = map[k];
              moduleFoundKey = k;
              break;
            }
          }
        }
      }
    } catch (e) {
      moduleSrc = null;
      moduleFoundKey = null;
    }
  }

  // Enforce: do not use the mf_common frame unless we can show a common_* module inside it.
  // Respect persisted instance assets: if the instance already has resolved URLs, prefer them and skip re-selection
  let persistedUsed = false;
  try {
    if (cell && cell._assetSrc) {
      moduleSrc = cell._assetSrc;
      moduleFoundKey = cell._assetKey || null;
      if (cell._frameSrc) {
        frameSrc = cell._frameSrc;
      }
      persistedUsed = true;
    }
  } catch (e) {}

  // If frameSrc currently points at a common frame but module is not a common variant, try to find a common module (only when not persisted)
  try {
    if (!persistedUsed && frameSrc && frameKey && frameKey.startsWith('mf_common')) {
      const map = ASSETS[dirKey] || {};
      if (!(moduleFoundKey && moduleFoundKey.startsWith('common_'))) {
        // 1) honor hardcoded mapping
        const hard = HARDCODED_COMMON_SELECTION[tmpl];
        if (hard && map[hard]) {
          moduleSrc = map[hard];
          moduleFoundKey = hard;
        }
        // 2) try template-specific common in this dir
        else if (tmpl && map['common_' + tmpl]) {
          moduleSrc = map['common_' + tmpl];
          moduleFoundKey = 'common_' + tmpl;
        } else {
          // 3) first local common
          const localCommons = Object.keys(map).filter(k => k.startsWith('common_'));
          if (localCommons.length > 0) {
            localCommons.sort();
            moduleFoundKey = localCommons[0];
            moduleSrc = map[moduleFoundKey];
          } else {
            // 4) first global common across ASSETS
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
              moduleFoundKey = found.key;
              moduleSrc = ASSETS[found.dir][found.key];
            } else {
              if (ASSETS[dirKey] && ASSETS[dirKey]['mf_empty']) {
                frameSrc = ASSETS[dirKey]['mf_empty'];
              } else {
                frameSrc = null;
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  let usedImage = false;

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
    imgFrame.addEventListener('error', () => {
      try {
        appendToDebug && appendToDebug('imgFrame error: ' + frameSrc);
      } catch (e) {}
      imgFrame.remove();
      if (!moduleSrc) {
        renderVector();
      }
    });
    imgFrame.addEventListener('load', () => {
      usedImage = true;
      // Remove any existing vector shapes when image loads
      const existingVector = wrapper.querySelector('.vector-shape');
      if (existingVector) {
        existingVector.remove();
      }
    });
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
    imgMod.style.width = Math.round(size * 0.86) + 'px';
    imgMod.style.height = Math.round(size * 0.86) + 'px';
    imgMod.style.objectFit = 'contain';
    imgMod.style.zIndex = '2';
    imgMod.addEventListener('error', () => {
      try {
        appendToDebug && appendToDebug('imgMod error: ' + moduleSrc);
      } catch (e) {}
      imgMod.remove();
      if (!usedImage) {
        renderVector();
      }
    });
    imgMod.addEventListener('load', () => {
      usedImage = true;
      // Remove any existing vector shapes when image loads
      const existingVector = wrapper.querySelector('.vector-shape');
      if (existingVector) {
        existingVector.remove();
      }
    });
    wrapper.appendChild(imgMod);
  }

  // If neither asset exists, fallback immediately to vector rendering
  if (!frameSrc && !moduleSrc) {
    renderVector();
    return wrapper;
  }

  // Safety timeout: if images haven't loaded after a reasonable time, show vectors
  // But only if no images have successfully loaded yet
  setTimeout(() => {
    if (!usedImage) {
      renderVector();
    }
  }, 500);

  return wrapper;

  function renderVector() {
    // avoid duplicating if already rendered
    if (wrapper.querySelector('.vector-shape')) {
      return;
    }
    const v = document.createElement('div');
    v.className = 'vector-shape';
    v.style.position = 'absolute';
    v.style.left = '50%';
    v.style.top = '50%';
    v.style.transform = 'translate(-50%,-50%)';
    const bg = RARITY_COLOR[cell.rarity] || '#808080';
    if (cell.shape === 'diamond') {
      const inner = document.createElement('div');
      const SH = Math.max(16, Math.round(size * 0.8));
      inner.style.width = SH + 'px';
      inner.style.height = SH + 'px';
      inner.style.transform = 'rotate(45deg)';
      inner.style.background = bg;
      inner.style.borderRadius = '3px';
      v.appendChild(inner);
    } else {
      const s = document.createElement('div');
      const SH = Math.max(14, Math.round(size * 0.82));
      s.style.width = SH + 'px';
      s.style.height = SH + 'px';
      s.style.background = bg;
      if (cell.shape === 'circle') {
        s.style.borderRadius = '50%';
      }
      if (cell.shape === 'square') {
        s.style.borderRadius = '4px';
      }
      if (cell.shape === 'triangle') {
        s.style.clipPath = 'polygon(50% 6%, 94% 94%, 6% 94%)';
      }
      if (cell.plus) {
        s.style.boxShadow = '0 0 12px rgba(255,255,255,0.9)';
      }
      v.appendChild(s);
    }
    wrapper.appendChild(v);
  }
}
