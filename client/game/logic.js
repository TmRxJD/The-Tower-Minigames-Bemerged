// Game Logic Module
// Handles core game mechanics like cell interactions, merge evaluation, and game state

export function createGameLogic({
  board,
  BOARD_ROWS,
  BOARD_COLS,
  selected,
  mergeSelecting,
  bossShatterSelecting,
  mineShatterSelecting,
  candidateHighlights,
  inventory,
  isDisabledByMine,
  canBeFodder,
  requiredTotalForBaseCell,
  sameTemplate,
  predictMergeResult,
  createModuleInstance,
  removeCells,
  placeNewAt,
  cascadeResolve,
  renderBoard,
  renderInventory,
  updateMergePreview,
  awardShards,
  appendToDebug,
  totalMerges,
  totalShatters,
  moveCount,
  moveOccurredThisTurn,
  window,
  MODULE_TEMPLATES,
  bossHelper,
  pendingExplosions,
}) {
  function isBoardSel(s) {
    return s && typeof s.r === 'number' && typeof s.c === 'number';
  }

  function isInvSel(s) {
    return s && typeof s.inv === 'string';
  }

  function findTemplate(templateId) {
    return MODULE_TEMPLATES.find(t => t.id === templateId);
  }

  // Find potential fodder candidates for a base cell at (br,bc)
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
        const cell = board[r] && board[r][c];
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

  // Find potential modules that can be selected for mine shattering at (mineR, mineC)
  function findMineShatterCandidates(mineR, mineC) {
    const out = [];

    // Check for 5-tile patterns with mine in center
    const patterns = [
      // Plus shape: up1, left1, MINE, right1, down1
      [
        { r: mineR - 1,
          c: mineC },
        { r: mineR,
          c: mineC - 1 },
        { r: mineR,
          c: mineC },
        { r: mineR,
          c: mineC + 1 },
        { r: mineR + 1,
          c: mineC },
      ],
      // L-shape (90-degree angle): down1, MINE, left1, left2, up1
      [
        { r: mineR + 1,
          c: mineC },
        { r: mineR,
          c: mineC },
        { r: mineR,
          c: mineC - 1 },
        { r: mineR,
          c: mineC - 2 },
        { r: mineR - 1,
          c: mineC },
      ],
      // T-shape: up1, up2, MINE, right1, left1
      [
        { r: mineR - 2,
          c: mineC },
        { r: mineR - 1,
          c: mineC },
        { r: mineR,
          c: mineC },
        { r: mineR,
          c: mineC + 1 },
        { r: mineR,
          c: mineC - 1 },
      ],
    ];

    for (const pattern of patterns) {
      // Check if all positions are within bounds
      const validPositions = pattern.filter(
        pos => pos.r >= 0 && pos.r < BOARD_ROWS && pos.c >= 0 && pos.c < BOARD_COLS,
      );

      if (validPositions.length === 5) {
        // Get cells for all positions
        const positionsWithCells = validPositions.map(pos => ({
          ...pos,
          cell: board[pos.r] && board[pos.r][pos.c],
        }));

        // Find mine position and module positions
        const minePos = positionsWithCells.find(p => p.r === mineR && p.c === mineC);
        const modulePositions = positionsWithCells.filter(
          p => p.cell && p.cell.templateId !== '__MINE__' && p.cell.rarity !== 'Mine',
        );

        // Must have exactly 1 mine (the center) and 4 modules
        if (
          minePos &&
          minePos.cell &&
          (minePos.cell.templateId === '__MINE__' || minePos.cell.rarity === 'Mine') &&
          modulePositions.length === 4
        ) {
          // Check if all 4 modules would be valid fodder for some base
          let validFodder = false;
          const mod1 = modulePositions[0].cell;
          const mod2 = modulePositions[1].cell;
          const mod3 = modulePositions[2].cell;
          const mod4 = modulePositions[3].cell;

          // Simplified validation: just check that all modules are the same type
          const allSameType = mod1.type === mod2.type && mod2.type === mod3.type && mod3.type === mod4.type;

          if (allSameType) {
            validFodder = true;
          }

          if (validFodder) {
            modulePositions.forEach(pos => {
              if (!out.find(existing => existing.r === pos.r && existing.c === pos.c)) {
                out.push({ r: pos.r,
                  c: pos.c });
              }
            });
          }
        }
      }
    }

    // Also keep the original 3-tile logic for backward compatibility
    // Check horizontal lines where mine can be in any position in the 3-in-a-row
    for (let offset = -2; offset <= 0; offset++) {
      const c1 = mineC + offset;
      const c2 = mineC + offset + 1;
      const c3 = mineC + offset + 2;
      if (c1 >= 0 && c2 >= 0 && c3 >= 0 && c1 < BOARD_COLS && c2 < BOARD_COLS && c3 < BOARD_COLS) {
        // Find which positions have modules (not mines)
        const positions = [
          { r: mineR,
            c: c1,
            cell: board[mineR] && board[mineR][c1] },
          { r: mineR,
            c: c2,
            cell: board[mineR] && board[mineR][c2] },
          { r: mineR,
            c: c3,
            cell: board[mineR] && board[mineR][c3] },
        ];

        const mineCount = positions.filter(
          p => p.cell && (p.cell.templateId === '__MINE__' || p.cell.rarity === 'Mine'),
        ).length;
        const modulePositions = positions.filter(
          p => p.cell && p.cell.templateId !== '__MINE__' && p.cell.rarity !== 'Mine',
        );

        // If exactly one mine and two modules, check if they would be valid fodder for mine destruction
        if (mineCount === 1 && modulePositions.length === 2) {
          const mod1 = modulePositions[0].cell;
          const mod2 = modulePositions[1].cell;

          // Special case: allow 2 commons of the same type
          const validCommons = mod1.rarity === 'Common' && mod2.rarity === 'Common' && mod1.type === mod2.type;

          // Check if they would be valid fodder for some base according to normal merge rules
          let validFodder = false;

          // Try different hypothetical bases to see if these 2 modules would be valid fodder
          const hypotheticalBases = [
            { rarity: 'Rare',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Rare',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Epic',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Epic',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Legendary',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Legendary',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Mythic',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Mythic',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Ancestral',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
          ];

          for (const base of hypotheticalBases) {
            // Check if both modules would be valid fodder for this base
            if (canBeFodder(base, mod1) && canBeFodder(base, mod2)) {
              validFodder = true;
              break;
            }
          }

          if (validCommons || validFodder) {
            modulePositions.forEach(pos => {
              if (!out.find(existing => existing.r === pos.r && existing.c === pos.c)) {
                out.push({ r: pos.r,
                  c: pos.c });
              }
            });
          }
        }
      }
    }

    // Check vertical lines where mine can be in any position in the 3-in-a-row
    for (let offset = -2; offset <= 0; offset++) {
      const r1 = mineR + offset;
      const r2 = mineR + offset + 1;
      const r3 = mineR + offset + 2;
      if (r1 >= 0 && r2 >= 0 && r3 >= 0 && r1 < BOARD_ROWS && r2 < BOARD_ROWS && r3 < BOARD_ROWS) {
        // Find which positions have modules (not mines)
        const positions = [
          { r: r1,
            c: mineC,
            cell: board[r1] && board[r1][mineC] },
          { r: r2,
            c: mineC,
            cell: board[r2] && board[r2][mineC] },
          { r: r3,
            c: mineC,
            cell: board[r3] && board[r3][mineC] },
        ];

        const mineCount = positions.filter(
          p => p.cell && (p.cell.templateId === '__MINE__' || p.cell.rarity === 'Mine'),
        ).length;
        const modulePositions = positions.filter(
          p => p.cell && p.cell.templateId !== '__MINE__' && p.cell.rarity !== 'Mine',
        );

        // If exactly one mine and two modules, check if they would be valid fodder for mine destruction
        if (mineCount === 1 && modulePositions.length === 2) {
          const mod1 = modulePositions[0].cell;
          const mod2 = modulePositions[1].cell;

          // Special case: allow 2 commons of the same type
          const validCommons = mod1.rarity === 'Common' && mod2.rarity === 'Common' && mod1.type === mod2.type;

          // Check if they would be valid fodder for some base according to normal merge rules
          let validFodder = false;

          // Try different hypothetical bases to see if these 2 modules would be valid fodder
          const hypotheticalBases = [
            { rarity: 'Rare',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Rare',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Epic',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Epic',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Legendary',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Legendary',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Mythic',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Mythic',
              plus: true,
              type: mod1.type,
              templateId: mod1.templateId },
            { rarity: 'Ancestral',
              plus: false,
              type: mod1.type,
              templateId: mod1.templateId },
          ];

          for (const base of hypotheticalBases) {
            // Check if both modules would be valid fodder for this base
            if (canBeFodder(base, mod1) && canBeFodder(base, mod2)) {
              validFodder = true;
              break;
            }
          }

          if (validCommons || validFodder) {
            modulePositions.forEach(pos => {
              if (!out.find(existing => existing.r === pos.r && existing.c === pos.c)) {
                out.push({ r: pos.r,
                  c: pos.c });
              }
            });
          }
        }
      }
    }

    return out;
  }

  // Find potential modules that can be selected for boss damage at (bossR, bossC)
  function findBossShatterCandidates(bossR, bossC, boardOverride = null, selectedModules = []) {
    const out = [];
    appendToDebug &&
      appendToDebug(
        'findBossShatterCandidates called at (' +
          bossR +
          ',' +
          bossC +
          ') with ' +
          selectedModules.length +
          ' selected',
      );
    const boardToUse = boardOverride || board;

    if (selectedModules.length === 0) {
      // No selection yet, highlight only the 4 adjacent squares to the boss
      const adjacentPositions = [
        { r: bossR - 1,
          c: bossC }, // up
        { r: bossR + 1,
          c: bossC }, // down
        { r: bossR,
          c: bossC - 1 }, // left
        { r: bossR,
          c: bossC + 1 }, // right
      ];

      const validAdjacent = adjacentPositions.filter(
        pos => pos.r >= 0 && pos.r < BOARD_ROWS && pos.c >= 0 && pos.c < BOARD_COLS,
      );

      for (const pos of validAdjacent) {
        const cell = boardToUse[pos.r] && boardToUse[pos.r][pos.c];
        if (cell && cell.templateId !== '__BOSS__' && cell.rarity !== 'Boss') {
          out.push({ r: pos.r,
            c: pos.c });
        }
      }
    } else {
      // Always highlight unselected adjacent squares to the boss for starting new chains
      const adjacentPositions = [
        { r: bossR - 1,
          c: bossC }, // up
        { r: bossR + 1,
          c: bossC }, // down
        { r: bossR,
          c: bossC - 1 }, // left
        { r: bossR,
          c: bossC + 1 }, // right
      ];

      const validAdjacent = adjacentPositions.filter(
        pos => pos.r >= 0 && pos.r < BOARD_ROWS && pos.c >= 0 && pos.c < BOARD_COLS,
      );

      for (const pos of validAdjacent) {
        const cell = boardToUse[pos.r] && boardToUse[pos.r][pos.c];
        if (cell && cell.templateId !== '__BOSS__' && cell.rarity !== 'Boss') {
          // Check if not already selected
          const alreadySelected = selectedModules.some(sel => sel.r === pos.r && sel.c === pos.c);
          if (!alreadySelected) {
            out.push({ r: pos.r,
              c: pos.c });
          }
        }
      }

      // Group selected modules by type and rarity to handle multiple chains
      const chains = {};
      selectedModules.forEach((sel, index) => {
        if (!sel.cell) {
          return;
        }
        const baseRarity = sel.cell.rarity.replace(/\+/g, '');
        const requiresExactTemplate = ['Rare', 'Epic'].includes(baseRarity);
        const key = requiresExactTemplate
          ? sel.cell.type + '_' + sel.cell.rarity + '_' + sel.cell.templateId
          : sel.cell.type + '_' + sel.cell.rarity;
        if (!chains[key]) {
          chains[key] = { modules: [],
            lastIndex: -1 };
        }
        chains[key].modules.push({ ...sel,
          index });
        if (index > chains[key].lastIndex) {
          chains[key].lastIndex = index;
        }
      });

      // For each chain, highlight adjacent modules from all selected in that chain
      Object.values(chains).forEach(chain => {
        const targetType = chain.modules[0].cell.type;
        const targetRarity = chain.modules[0].cell.rarity;
        const targetTemplateId = chain.modules[0].cell.templateId;

        // Determine if we need exact template match based on rarity
        const requiresExactTemplate = ['Rare', 'Epic'].includes(targetRarity.replace(/\+/g, ''));

        // Collect all positions to check for adjacent highlights
        const positionsToCheck = chain.modules.map(m => ({ r: m.r,
          c: m.c }));

        positionsToCheck.forEach(pos => {
          const adjacentPositions = [
            { r: pos.r - 1,
              c: pos.c }, // up
            { r: pos.r + 1,
              c: pos.c }, // down
            { r: pos.r,
              c: pos.c - 1 }, // left
            { r: pos.r,
              c: pos.c + 1 }, // right
          ];

          const validAdjacent = adjacentPositions.filter(
            adj => adj.r >= 0 && adj.r < BOARD_ROWS && adj.c >= 0 && adj.c < BOARD_COLS,
          );

          for (const adj of validAdjacent) {
            const cell = boardToUse[adj.r] && boardToUse[adj.r][adj.c];
            if (
              cell &&
              cell.templateId !== '__BOSS__' &&
              cell.rarity !== 'Boss' &&
              cell.type === targetType &&
              cell.rarity === targetRarity
            ) {
              // Additional check for exact template match if required
              if (requiresExactTemplate && cell.templateId !== targetTemplateId) {
                continue;
              }
              // Check if not already selected
              const alreadySelected = selectedModules.some(sel => sel.r === adj.r && sel.c === adj.c);
              if (!alreadySelected) {
                out.push({ r: adj.r,
                  c: adj.c });
              }
            }
          }
        });
      });
    }

    appendToDebug && appendToDebug('Total candidates found: ' + out.length);
    return out;
  }

  // Get damage value for a module based on its rarity
  function getModuleDamageValue(cell) {
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

  // Perform mine shatter
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

  return {
    isBoardSel,
    isInvSel,
    findTemplate,
    findPotentialFodder,
    findMineShatterCandidates,
    findBossShatterCandidates,
    getModuleDamageValue,
    damageBossWithModules,
    performMineShatter,
  };
}
