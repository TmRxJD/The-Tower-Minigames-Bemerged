// game/mergeEngine.js - Core merge logic and evaluation

/**
 * Factory function for merge engine
 * @param {Object} dependencies - Required dependencies
 * @param {Array} dependencies.ALL_TEMPLATES - All available module templates
 * @param {Function} dependencies.canBeFodder - Function to check if a module can be fodder for another
 * @param {Function} dependencies.sameTemplate - Function to check if modules have the same template
 * @param {Function} dependencies.isAncestralStarUpgrade - Function to check ancestral star upgrade
 * @param {Function} dependencies.upgradeAncestralStars - Function to upgrade ancestral stars
 * @param {Function} dependencies.createModuleInstance - Function to create module instances
 * @param {Function} dependencies.placeNewAt - Function to place new modules
 * @param {Function} dependencies.removeCells - Function to remove cells
 * @param {Function} dependencies.renderBoard - Function to render the board
 * @param {Function} dependencies.renderInventory - Function to render inventory
 * @param {Function} dependencies.cascadeResolve - Function to resolve cascades
 * @param {Function} dependencies.resetHintCyclingState - Function to reset hint cycling
 * @param {Function} dependencies.isDisabledByMine - Function to check mine proximity
 * @param {Function} dependencies.appendToDebug - Debug logging function
 * @param {Array} dependencies.board - Game board
 * @param {Object} dependencies.inventory - Player inventory
 * @param {Array} dependencies.selected - Current selection
 * @param {boolean} dependencies.mergeSelecting - Whether in merge selection mode
 * @param {Set} dependencies.candidateHighlights - Candidate highlights set
 * @param {number} dependencies.BOARD_ROWS - Number of board rows
 * @param {number} dependencies.BOARD_COLS - Number of board columns
 * @param {Object} dependencies.completed - Completed modules tracking
 * @param {number} dependencies.totalMerges - Total merges counter
 * @returns {Object} Merge engine functions
 */
export function makeMergeEngine({
  ALL_TEMPLATES,
  canBeFodder,
  sameTemplate,
  isAncestralStarUpgrade,
  upgradeAncestralStars,
  createModuleInstance,
  placeNewAt,
  removeCells,
  renderBoard,
  renderInventory,
  cascadeResolve,
  resetHintCyclingState,
  isDisabledByMine,
  appendToDebug,
  board,
  inventory,
  selected,
  mergeSelecting,
  candidateHighlights,
  BOARD_ROWS,
  BOARD_COLS,
  completed,
  totalMerges,
}) {
  /**
   * Evaluate a merge attempt based on current selection
   */
  function evaluateMergeAttempt() {
    // Defensive wrapper: log selection state and catch exceptions so a silent error doesn't block UX
    try {
      try {
        appendToDebug &&
          appendToDebug(
            'evaluateMergeAttempt called; selected=' +
              JSON.stringify(
                (selected || []).map(s => ({
                  r: s && s.r,
                  c: s && s.c,
                  inv: s && s.inv,
                  templateId: s && s.cell && s.cell.templateId,
                  rarity: s && s.cell && s.cell.rarity,
                })),
              ),
          );
      } catch (e) {}
      try {
        console.debug && console.debug('evaluateMergeAttempt', selected);
      } catch (e) {}
      // Determine selection composition
      // Normalize selection entries to use live board/inventory cell references so
      // preview (which reads live board/inventory) and evaluator match.
      const selOrig = selected.slice();
      const sel = selOrig.map(s => {
        if (!s) {
          return s;
        }
        if (s.inv) {
          return { ...s,
            cell: inventory[s.inv] || s.cell };
        }
        if (typeof s.r === 'number' && typeof s.c === 'number') {
          return { ...s,
            cell: (board[s.r] && board[s.r][s.c]) || s.cell };
        }
        return { ...s,
          cell: s.cell };
      });
      // Defensive: if any normalized selection entries are missing or lack a cell, cancel the merge attempt
      if (sel.some(s => !s || !s.cell)) {
        try {
          appendToDebug &&
            appendToDebug('evaluateMergeAttempt: invalid selection entries found — dumping debug snapshot');
        } catch (e) {}
        try {
          // Minimal normalizedSel view
          const normView = sel.map((s, i) => ({
            i,
            ok: !!(s && s.cell),
            inv: s && s.inv,
            r: s && s.r,
            c: s && s.c,
            tpl: s && s.cell && s.cell.templateId,
            rarity: s && s.cell && s.cell.rarity,
          }));
          // Original selected entries
          const origView = selOrig.map((s, i) => ({
            i,
            inv: s && s.inv,
            r: s && s.r,
            c: s && s.c,
            tpl: s && s.cell && s.cell.templateId,
          }));
          // Inventory snapshot for referenced inv keys
          const invKeys = Array.from(new Set(selOrig.map(s => s && s.inv).filter(Boolean)));
          const invSnap = {};
          for (const k of invKeys) {
            invSnap[k] = inventory[k] || null;
          }
          // Board snapshot around referenced coordinates
          const boardCoords = selOrig
            .filter(s => s && typeof s.r === 'number' && typeof s.c === 'number')
            .map(s => ({ r: s.r,
              c: s.c }));
          const boardSnap = {};
          for (const p of boardCoords) {
            try {
              boardSnap[`${p.r},${p.c}`] = (board[p.r] && board[p.r][p.c]) || null;
            } catch (e) {
              boardSnap[`${p.r},${p.c}`] = '<err>';
            }
          }
          try {
            appendToDebug &&
              appendToDebug(
                'evaluateMergeAttempt debug snapshot: norm=' +
                  JSON.stringify(normView) +
                  ' orig=' +
                  JSON.stringify(origView) +
                  ' invKeys=' +
                  JSON.stringify(invKeys),
              );
          } catch (e) {}
          try {
            console.error('evaluateMergeAttempt debug snapshot', {
              normView,
              origView,
              invSnap,
              boardSnap,
              selected,
              selOrig,
            });
          } catch (e) {}
        } catch (e) {
          try {
            console.error('evaluateMergeAttempt debug dump failed', e);
          } catch (ee) {}
        }
        // Cancel merge so user can continue; keep a visible message in debug console
        try {
          appendToDebug &&
            appendToDebug('Merge cancelled due to invalid selection entries (see console for full snapshot)');
        } catch (e) {}
        selected.length = 0;
        renderBoard();
        return;
      }
      const base = sel[0];
      // Prevent merges if any selected cell is disabled due to proximity to a mine
      try {
        for (const s of sel) {
          if (s && s.cell && isDisabledByMine(s.cell)) {
            appendToDebug && appendToDebug('Merge blocked: one or more tiles are disabled by a nearby mine');
            selected.length = 0;
            renderBoard();
            return;
          }
        }
      } catch (e) {}

      // Helper: clear any inventory slots referenced by the selection (except keepInvKey if provided)
      function purgeInventoryUsed(selection, keepInvKey = null) {
        if (!selection || !Array.isArray(selection)) {
          return;
        }
        for (const s of selection) {
          if (!s) {
            continue;
          }
          if (s.inv && s.inv !== keepInvKey) {
            inventory[s.inv] = null;
          }
          // if selection references an inventory cell object rather than inv key, also clear matching inventory slots
          if (s.cell && s.cell.instanceId) {
            for (const k of Object.keys(inventory)) {
              const invCell = inventory[k];
              if (invCell && invCell.instanceId === s.cell.instanceId && k !== keepInvKey) {
                inventory[k] = null;
              }
            }
          }
        }
      }

      // quick fail: commons cannot be fodder (we treat 'Common' rarity as fodder-ineligible per spec)
      for (let i = 1; i < sel.length; i++) {
        if (sel[i].cell.rarity === 'Common') {
          // cancel selection
          selected.length = 0;
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
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        // remove other two (and clear base if base was a fodder target in board)
        removeCells(sel.slice(1), false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        // leave merge-selection mode and clear candidate highlights so UI resets
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // 1 Rare+ + 2 Rare (fodder) -> Epic
      // Accept either: two non-plus Rares of the same template OR two Rare+ fodder of the same module type
      if (sel.length === 3 && base.cell.rarity === 'Rare' && base.cell.plus) {
        const fodder = sel.slice(1);
        // validate fodder: only two Rare+ items matching the base module type are allowed
        const fodderPlusSameType = fodder.every(
          s => s && s.cell && s.cell.rarity === 'Rare' && s.cell.plus && s.cell.type === base.cell.type,
        );
        if (fodderPlusSameType) {
          const newMod = createModuleInstance(base.cell.templateId, 'Epic', false);
          placeNewAt(base, newMod);
          try {
            totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
          } catch (e) {}
          removeCells(fodder, false);
          purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
          selected.length = 0;
          mergeSelecting = false;
          candidateHighlights.clear();
          renderInventory();
          renderBoard();
          // Reset hint cycling state when a merge is completed
          resetHintCyclingState();
          cascadeResolve();
          return;
        }
        // otherwise invalid
        appendToDebug &&
          appendToDebug(
            'Rare+ merge blocked: fodder must be two non-plus Rares of the same template or two Rare+ of same module type',
          );
        selected.length = 0;
        renderBoard();
        return;
      }

      // 2 of same Epic -> Epic+
      if (sel.length === 2 && sel.every(s => s.cell.rarity === 'Epic') && sel.every(s => sameTemplate(s, sel[0]))) {
        try {
          appendToDebug &&
            appendToDebug(
              'evaluateMergeAttempt -> creating Epic+ from two Epics: baseTemplate=' +
                (base && base.cell && base.cell.templateId),
            );
        } catch (e) {}
        const newMod = createModuleInstance(base.cell.templateId, 'Epic', true);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells(sel.slice(1), false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // 1 Epic+ + 2 Epic+ -> Legendary (fodder must be Epic+; template may differ)
      if (
        sel.length === 3 &&
        base.cell.rarity === 'Epic' &&
        base.cell.plus &&
        sel.slice(1).every(s => s.cell.rarity === 'Epic' && s.cell.plus)
      ) {
        // ensure all fodder entries are the same module type as the base
        if (!sel.slice(1).every(s => s.cell.type === base.cell.type)) {
          appendToDebug && appendToDebug('Epic+ merge blocked: fodder must be same module type as base');
          selected.length = 0;
          renderBoard();
          return;
        }
        const newMod = createModuleInstance(base.cell.templateId, 'Legendary', false);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells(sel.slice(1), false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // 1 Legendary + 1 Epic+ -> Legendary+ (base must be Legendary)
      if (sel.length === 2 && base.cell.rarity === 'Legendary' && sel[1].cell.rarity === 'Epic' && sel[1].cell.plus) {
        // require same templateId (same named module)
        if (sel[1].cell.templateId !== base.cell.templateId) {
          appendToDebug && appendToDebug('Legendary merge blocked: Epic+ fodder must be the same named module as base');
          selected.length = 0;
          renderBoard();
          return;
        }
        const newMod = createModuleInstance(base.cell.templateId, 'Legendary', true);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells([sel[1]], false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // Debug: log Mythic merge attempts to help diagnose blocked merges
      if (base && base.cell && base.cell.rarity === 'Mythic' && sel.length === 2) {
        try {
          const f = sel[1] && sel[1].cell ? sel[1].cell : null;
          appendToDebug &&
            appendToDebug(
              'DEBUG Mythic merge attempt: base=' +
                JSON.stringify({
                  rarity: base.cell.rarity,
                  plus: !!base.cell.plus,
                  type: base.cell.type,
                  templateId: base.cell.templateId,
                }) +
                ' fodder=' +
                JSON.stringify(f ? { rarity: f.rarity,
                  plus: !!f.plus,
                  type: f.type,
                  templateId: f.templateId } : null),
            );
        } catch (e) {}
      }

      // 1 Legendary+ + 1 Legendary+ -> Mythic (both must be Legendary+)
      if (
        sel.length === 2 &&
        base.cell.rarity === 'Legendary' &&
        base.cell.plus &&
        sel[1].cell.rarity === 'Legendary' &&
        sel[1].cell.plus
      ) {
        if (sel[1].cell.type !== base.cell.type) {
          appendToDebug && appendToDebug('Legendary+ merge blocked: fodder must be same module type as base');
          selected.length = 0;
          renderBoard();
          return;
        }
        const newMod = createModuleInstance(base.cell.templateId, 'Mythic', false);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells([sel[1]], false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // 1 Mythic + 1 Legendary+ -> Mythic+ (fodder must be Legendary+)
      if (
        sel.length === 2 &&
        base.cell.rarity === 'Mythic' &&
        !base.cell.plus &&
        sel[1].cell.rarity === 'Legendary' &&
        sel[1].cell.plus
      ) {
        // allow Legendary+ fodder from any template as long as module type matches
        if (sel[1].cell.type !== base.cell.type) {
          appendToDebug && appendToDebug('Mythic merge blocked: Legendary+ fodder must match base module type');
          selected.length = 0;
          renderBoard();
          return;
        }
        const newMod = createModuleInstance(base.cell.templateId, 'Mythic', true);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells([sel[1]], false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // 1 Mythic+ + 2 Epic+ -> Ancestral
      if (
        sel.length === 3 &&
        base.cell.rarity === 'Mythic' &&
        base.cell.plus &&
        sel.slice(1).every(s => s.cell.rarity === 'Epic' && s.cell.plus)
      ) {
        // require Epic+ fodder to match base module type (templates may differ)
        if (!sel.slice(1).every(s => s.cell.type === base.cell.type)) {
          appendToDebug && appendToDebug('Mythic+ merge blocked: Epic+ fodder must match base module type');
          selected.length = 0;
          renderBoard();
          return;
        }
        const newMod = createModuleInstance(base.cell.templateId, 'Ancestral', false, 1);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells(sel.slice(1), false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // Ancestral star upgrade: use canonical helpers (now requires 1 Epic+ of same template)
      if (isAncestralStarUpgrade(base, sel.slice(1))) {
        const newStars = upgradeAncestralStars(base, sel.slice(1));
        const newMod = createModuleInstance(base.cell.templateId, 'Ancestral', false, newStars);
        placeNewAt(base, newMod);
        try {
          totalMerges = typeof totalMerges === 'number' ? totalMerges + 1 : 1;
        } catch (e) {}
        removeCells(sel.slice(1), false);
        purgeInventoryUsed(sel, base && base.inv ? base.inv : null);
        if (newStars === 5) {
          completed[base.cell.templateId] = 5;
        }
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderInventory();
        renderBoard();
        // Reset hint cycling state when a merge is completed
        resetHintCyclingState();
        cascadeResolve();
        return;
      }

      // Additional steps (Mythic, Mythic+, Ancestral, Ancestral stars)
      // For brevity implement a generic progression rule: if base is Mythic+ and we have 2 Epic+ anywhere -> create Ancestral
      if (sel.length >= 3 && base.cell.rarity === 'Mythic+') {
        // This branch is placeholder — full sequence is similar pattern
      }

      // If selection doesn't match any known merge pattern and reaches 4 selections, reset
      if (selected.length >= 4) {
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights.clear();
        renderBoard();
      }
      // If no merge pattern matched, clear the selection
      selected.length = 0;
      mergeSelecting = false;
      candidateHighlights.clear();
      renderBoard();
    } catch (err) {
      try {
        appendToDebug && appendToDebug('evaluateMergeAttempt error: ' + (err && err.stack ? err.stack : String(err)));
      } catch (e) {}
      try {
        console.error && console.error('evaluateMergeAttempt error', err);
      } catch (e) {}
      // best-effort recovery: clear selection and UI so user can continue
      try {
        selected.length = 0;
        mergeSelecting = false;
        candidateHighlights && candidateHighlights.clear();
        renderBoard();
      } catch (e) {}
    }
  }

  return {
    evaluateMergeAttempt,
  };
}
