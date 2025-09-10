// Factory for merge preview UI logic extracted from main.js
export function makeMergePreview(ctx) {
  const {
    getBoard,
    getSelected,
    getInventory,
    buildMiniShape,
    predictMergeResult,
    requiredTotalForBaseCell,
    appendToDebug,
    evaluateMergeAttempt,
    isDisabledByMine,
    getMergeSelecting,
    clearCandidateHighlights,
    getMineShatterSelecting,
    getBossShatterSelecting,
    getCandidateHighlights,
    performMineShatter,
    damageBossWithModules,
    findBossShatterCandidates,
    renderBoard,
    renderInventory,
    cascadeResolve,
    bossHelper,
    useVectorOnly,
    RARITY_COLOR,
    ASSETS,
    HARDCODED_COMMON_SELECTION,
    MINE_ASSET,
  } = ctx;

  function updateMergePreview(alwaysShow = false) {
    const boardDiv = document.getElementById('game-board');
    if (!boardDiv) {
      return;
    }
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
        if (rect && rect.width > 0) {
          tileSize = Math.round(rect.width);
        }
      }
    } catch (e) {
      /* ignore measurement failures and fall back to default */
    }
    // preview slot target ~90% of a board tile; mini-shape inside slot ~90% of slot
    const slotSize = Math.max(40, Math.round(tileSize * 0.9));
    const miniSize = Math.max(28, Math.round(slotSize * 0.9));

    // Ensure preview sits above the board with a small padding gap to avoid overlap.
    try {
      // add ~12px of extra gap above the preview slots
      preview.style.top = '-' + (slotSize + 12) + 'px';
      preview.style.right = '0';
    } catch (e) {}

    // Handle mine shatter mode differently
    if (getMineShatterSelecting && getMineShatterSelecting()) {
      const selected = getSelected();
      const board = getBoard();
      const mineCell = selected.find(s => s.cell && (s.cell.templateId === '__MINE__' || s.cell.rarity === 'Mine'));
      const selectedModules = selected.filter(
        s => s.cell && s.cell.templateId !== '__MINE__' && s.cell.rarity !== 'Mine',
      );

      const slots = [
        { kind: 'mine',
          cell: mineCell ? mineCell.cell : null },
        { kind: 'module1',
          cell: selectedModules[0] ? selectedModules[0].cell : null },
        { kind: 'module2',
          cell: selectedModules[1] ? selectedModules[1].cell : null },
        { kind: 'module3',
          cell: selectedModules[2] ? selectedModules[2].cell : null },
        { kind: 'module4',
          cell: selectedModules[3] ? selectedModules[3].cell : null },
        { kind: 'shatter',
          cell: null }, // placeholder for shatter action
      ];

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

        if (info.cell && info.cell.rarity && info.cell.rarity !== 'Common') {
          // pass scaled mini size so preview shapes are ~90% of slot
          slot.appendChild(
            buildMiniShape(info.cell, miniSize, {
              useVectorOnly,
              RARITY_COLOR,
              ASSETS,
              HARDCODED_COMMON_SELECTION,
              MINE_ASSET,
              appendToDebug,
            }),
          );
          slot.dataset.rarity = info.cell.rarity;
        } else if (info.kind === 'shatter') {
          // Show shatter icon or text for the action slot
          const shatterText = document.createElement('div');
          shatterText.textContent = '💥';
          shatterText.style.fontSize = '20px';
          shatterText.style.color = '#ff4444';
          slot.appendChild(shatterText);
          slot.style.border = '2px solid #ff4444';
          slot.style.cursor = selectedModules.length === 2 || selectedModules.length === 4 ? 'pointer' : 'default';
          slot.style.opacity = selectedModules.length === 2 || selectedModules.length === 4 ? '1' : '0.5';

          slot.addEventListener('click', ev => {
            ev.stopPropagation();
            if (selectedModules.length === 2 || (selectedModules.length === 4 && mineCell)) {
              // Trigger mine shatter
              const candidateHighlights = getCandidateHighlights ? getCandidateHighlights() : new Set();
              candidateHighlights.clear();
              // Note: This would need to be passed from main.js context
              // performMineShatter(mineCell.r, mineCell.c);
              if (performMineShatter) {
                performMineShatter(mineCell.r, mineCell.c);
              }
            }
          });
        }

        preview.appendChild(slot);

        // Insert separators between slots
        if (i < slots.length - 1) {
          const sep = document.createElement('div');
          if (i === slots.length - 2) {
            sep.className = 'merge-equals';
            sep.textContent = '→';
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

      if (selected.length === 0 && !alwaysShow) {
        preview.style.display = 'none';
      } else {
        preview.style.display = 'flex';
      }
      return;
    }

    // Handle boss shatter mode differently
    if (getBossShatterSelecting && getBossShatterSelecting()) {
      const selected = getSelected();
      const board = getBoard();
      const bossMarker = window.__BOSS_MARKER;
      let bossR, bossC;
      if (bossMarker) {
        bossR = bossMarker.r;
        bossC = bossMarker.c;
      } else if (selected.length > 0) {
        bossR = selected[0].r;
        bossC = selected[0].c;
      }
      const bossCell = selected.find(s => s.r === bossR && s.c === bossC);
      const selectedModules = selected.filter(s => !(s.r === bossR && s.c === bossC));

      // Re-compute candidate highlights based on current board state minus selected modules
      const candidateHighlights = getCandidateHighlights ? getCandidateHighlights() : new Set();
      candidateHighlights.clear();
      if (bossR !== undefined && bossC !== undefined) {
        const tempBoard = selectedModules.length > 0 ? board.map(row => row.slice()) : board;
        if (selectedModules.length > 0) {
          for (const sel of selectedModules) {
            if (sel.r >= 0 && sel.r < 8 && sel.c >= 0 && sel.c < 14) {
              // BOARD_ROWS, BOARD_COLS
              tempBoard[sel.r][sel.c] = null;
            }
          }
        }
        // Use the same logic as findBossShatterCandidates but with tempBoard
        if (findBossShatterCandidates) {
          const cands = findBossShatterCandidates(bossR, bossC, tempBoard, selectedModules);
          // Update the global candidateHighlights set
          candidateHighlights.clear();
          cands.forEach(p => candidateHighlights.add(p.r + ',' + p.c));
        }
      }

      // Check if selection forms valid combos (allow multiple independent chains)
      let canDamage = false;
      if (selectedModules.length > 0) {
        // Group modules by type, rarity, and template (for base rarities)
        const moduleGroups = {};
        selectedModules.forEach(sel => {
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
        canDamage = Object.values(moduleGroups).every(group => {
          const firstModule = group[0].cell;
          const baseRarity = firstModule.rarity.replace(/\+/g, '');
          const isEpicOrHigher = ['Epic', 'Legendary', 'Mythic', 'Ancestral'].includes(baseRarity) || firstModule.plus;
          const minRequired = isEpicOrHigher ? 1 : 2;
          return group.length >= minRequired;
        });
      }

      // Only show damage button if minimum combo is met, but always show preview when there are selections
      if (canDamage || selectedModules.length > 0) {
        const slots = canDamage ? [{ kind: 'damage',
          cell: null }] : [{ kind: 'invalid',
          cell: null }];

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

          if (info.kind === 'damage') {
            // Show damage icon or text for the action slot
            const damageText = document.createElement('div');
            damageText.textContent = '⚔️';
            damageText.style.fontSize = '20px';
            damageText.style.color = '#ff4444';
            slot.appendChild(damageText);
            slot.style.border = '2px solid #ff4444';

            slot.style.cursor = 'pointer';
            slot.style.opacity = '1';

            slot.addEventListener('click', ev => {
              ev.stopPropagation();
              if (bossCell) {
                // Trigger boss damage
                candidateHighlights.clear();
                // Note: This would need to be passed from main.js context
                const filteredModules = selectedModules.filter(s => !(s.r === bossR && s.c === bossC));
                if (damageBossWithModules) {
                  damageBossWithModules(filteredModules);
                }
                // Remove the selected modules from the board
                for (const mod of filteredModules) {
                  if (mod && mod.r !== undefined && mod.c !== undefined) {
                    board[mod.r][mod.c] = null;
                  }
                }
                // Clear selection and trigger cascade
                // selected = []; // This would need to be handled by main.js
                if (renderBoard) {
                  renderBoard();
                }
                if (cascadeResolve) {
                  cascadeResolve();
                }
              }
            });
          } else if (info.kind === 'invalid') {
            // Show invalid combo indicator
            const invalidText = document.createElement('div');
            invalidText.textContent = '❌';
            invalidText.style.fontSize = '20px';
            invalidText.style.color = '#666';
            slot.appendChild(invalidText);
            slot.style.border = '2px solid #666';
            slot.style.cursor = 'default';
            slot.style.opacity = '0.5';
          }

          preview.appendChild(slot);
        }
      }

      // Update boss overlay to show damage preview
      try {
        if (bossHelper && bossHelper.renderOverlay) {
          bossHelper.renderOverlay();
        }
      } catch (e) {}

      if (selected.length === 0 && !alwaysShow) {
        preview.style.display = 'none';
      } else {
        preview.style.display = 'flex';
      }
      return;
    }

    // compute canonical cells once using live board or inventory state (so inventory selections show in preview)
    const selected = getSelected();
    const inventory = getInventory();
    const board = getBoard();
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
    const baseCell = (normalizedSel[0] && normalizedSel[0].cell) || null;
    const fod1 = (normalizedSel[1] && normalizedSel[1].cell) || null;
    const fod2 = (normalizedSel[2] && normalizedSel[2].cell) || null;
    // Only compute/show the predicted result when the selection has at least the required count for the base
    let predicted = null;
    try {
      const requiredForBase = baseCell ? requiredTotalForBaseCell(baseCell) : 0;
      const selCount = normalizedSel.filter(s => !!s).length;
      try {
        appendToDebug &&
          appendToDebug(
            'updateMergePreview: normalizedSel=' +
              JSON.stringify(
                normalizedSel.map(s => ({
                  templateId: s && s.cell && s.cell.templateId,
                  rarity: s && s.cell && s.cell.rarity,
                  plus: s && s.cell && s.cell.plus,
                  inv: s && s.inv,
                  r: s && s.r,
                  c: s && s.c,
                })),
              ) +
              ' required=' +
              requiredForBase +
              ' selCount=' +
              selCount,
          );
      } catch (e) {}
      if (baseCell && selCount >= requiredForBase) {
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
            unique: typeof rawPred.unique !== 'undefined' ? rawPred.unique : baseCell && baseCell.unique,
            stars: typeof rawPred.stars !== 'undefined' ? rawPred.stars : baseCell && baseCell.stars,
          };
        } else {
          predicted = null;
        }
        try {
          appendToDebug && appendToDebug('updateMergePreview: predicted(sanitized)=' + JSON.stringify(predicted));
        } catch (e) {}
        try {
          console.debug && console.debug('updateMergePreview predicted', predicted);
        } catch (e) {}
      }
    } catch (e) {
      predicted = null;
    }

    const slots = [
      { kind: 'base',
        cell: baseCell },
      { kind: 'fod1',
        cell: fod1 },
      { kind: 'fod2',
        cell: fod2 },
      { kind: 'predicted',
        cell: predicted },
    ];

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

      // Only show cells with valid rarity. For predicted slot we also only show when prediction is valid.
      if (info.cell && info.cell.rarity) {
        // pass scaled mini size so preview shapes are ~90% of slot
        slot.appendChild(
          buildMiniShape(info.cell, miniSize, {
            useVectorOnly,
            RARITY_COLOR,
            ASSETS,
            HARDCODED_COMMON_SELECTION,
            MINE_ASSET,
            appendToDebug,
          }),
        );
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
        const ready = selected.length === required && predicted !== null;
        // only enable pointer interactions when ready
        slot.style.pointerEvents = ready ? 'auto' : 'none';
        slot.style.cursor = ready ? 'pointer' : 'default';
        // always keep predicted slot opaque so it visually matches other preview slots
        slot.style.opacity = '1';
        slot.addEventListener('click', ev => {
          ev.stopPropagation();
          if (!ready) {
            return;
          }
          if (getMergeSelecting && getMergeSelecting() && selected.length > 0) {
            try {
              if (clearCandidateHighlights) {
                clearCandidateHighlights();
              }
            } catch (e) {}
            // Note: This would need to be passed from main.js context
            // mergeSelecting = false; // This would need to be handled by main.js
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

    if (selected.length === 0 && !alwaysShow) {
      preview.style.display = 'none';
    } else {
      preview.style.display = 'flex';
    }
  }

  return { updateMergePreview };
}
