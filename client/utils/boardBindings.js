// utils/boardBindings.js - Board module binding management

/**
 * Factory function for board binding utilities
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.boardModule - The board module
 * @param {Function} dependencies.setHintSystemDependencies - Function to set hint system dependencies
 * @param {Function} dependencies.appendToDebug - Debug logging function
 * @returns {Object} Board binding utility functions
 */
export function makeBoardBindings({ boardModule, setHintSystemDependencies, appendToDebug }) {
  /**
   * Ensure board module bindings are set up with current runtime state
   * This function should be called with bind() to provide runtime state from main.js
   */
  function ensureBoardBindings() {
    try {
      console.log('ensureBoardBindings called, this:', this);
      // This function needs to be bound with runtime state from main.js
      // The runtime state should include: board, inventory, BOARD_ROWS, BOARD_COLS, etc.
      // For now, we'll set up basic bindings that can be accessed by the board module

      // Initialize board module with runtime state bindings
      // Note: This function should be called with .bind() or .call() to provide the 'this' context
      // containing the runtime state from main.js
      const runtimeState = this || {};

      // Set up bindings for the board module
      const bindings = {
        // Core board state
        board: runtimeState.board,
        inventory: runtimeState.inventory,
        BOARD_ROWS: runtimeState.BOARD_ROWS,
        BOARD_COLS: runtimeState.BOARD_COLS,

        // Game state
        pendingExplosions: runtimeState.pendingExplosions || [],
        moveOccurredThisTurn: runtimeState.moveOccurredThisTurn,

        // Functions
        awardShards: runtimeState.awardShards,
        renderBoard: runtimeState.renderBoard,
        sleepAnimated: runtimeState.sleepAnimated,
        cascadeResolve: runtimeState.cascadeResolve,

        // Shuffle state
        shuffleRemaining: runtimeState.shuffleRemaining,
        setShuffleRemaining: runtimeState.setShuffleRemaining,

        // Group finding functions
        findAllGroups: runtimeState.findAllGroups,
        hasStraightTriple: runtimeState.hasStraightTriple,
        extractStraightRunPositions: runtimeState.extractStraightRunPositions,

        // Game settings
        autoShatterRares: runtimeState.autoShatterRares,
        animating: runtimeState.animating,

        // Drop and mine functions
        makeDrop: runtimeState.makeDrop,
        maybeConvertToMine: runtimeState.maybeConvertToMine,

        // Boss and mine handling
        bossHelper: runtimeState.bossHelper,
        processMineCountdowns: runtimeState.processMineCountdowns,

        // Game counters
        moveCount: runtimeState.moveCount,
        totalShatters: runtimeState.totalShatters,
        setTotalShatters: runtimeState.setTotalShatters,

        // Utility functions
        checkForValidMoves: runtimeState.checkForValidMoves,
        createBoard: runtimeState.createBoard,
        resetHintCyclingState: runtimeState.resetHintCyclingState,

        // Special markers
        __BOSS_MARKER: runtimeState.__BOSS_MARKER,
        __main_globals__: runtimeState.__main_globals__,

        // Debug
        appendToDebug: appendToDebug,
      };

      // Initialize the board module with these bindings
      boardModule.initBoard(bindings);

      // Set up hint system dependencies if available
      if (setHintSystemDependencies) {
        setHintSystemDependencies({
          getBoardStateHash: () => {
            // Simple hash of board state for change detection
            const board = runtimeState.board;
            if (!board) {
              return '';
            }
            let hash = '';
            for (let r = 0; r < runtimeState.BOARD_ROWS; r++) {
              for (let c = 0; c < runtimeState.BOARD_COLS; c++) {
                const cell = board[r][c];
                hash += cell ? cell.type + cell.rarity + (cell.plus ? '+' : '') : 'empty';
              }
            }
            return hash;
          },
          board: () => runtimeState.board,
          findAllGroups: runtimeState.findAllGroups,
          BOARD_ROWS: runtimeState.BOARD_ROWS,
          BOARD_COLS: runtimeState.BOARD_COLS,
          hasStraightTriple: runtimeState.hasStraightTriple,
          autoShatterRares: runtimeState.autoShatterRares,
          appendToDebug: appendToDebug,
          findValidMovesList: () => {
            const board = runtimeState.board;
            const BOARD_ROWS = runtimeState.BOARD_ROWS;
            const BOARD_COLS = runtimeState.BOARD_COLS;
            const moves = [];

            console.log(
              'findValidMovesList called, board length:',
              board ? board.length : 'null',
              'BOARD_ROWS:',
              BOARD_ROWS,
              'BOARD_COLS:',
              BOARD_COLS,
            );
            console.log(
              'board has commons:',
              board && board.some(row => row && row.some(cell => cell && cell.rarity === 'Common')),
            );

            if (!board) {
              return moves;
            }

            // Find all valid adjacency swaps that create shatterable groups
            for (let r = 0; r < BOARD_ROWS; r++) {
              for (let c = 0; c < BOARD_COLS; c++) {
                const cell = board[r][c];
                if (!cell) {
                  continue;
                }

                // Check adjacent cells
                const directions = [
                  { dr: 0,
                    dc: 1 }, // right
                  { dr: 1,
                    dc: 0 }, // down
                  { dr: 0,
                    dc: -1 }, // left
                  { dr: -1,
                    dc: 0 }, // up
                ];

                for (const dir of directions) {
                  const nr = r + dir.dr;
                  const nc = c + dir.dc;

                  if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
                    const neighbor = board[nr][nc];
                    if (!neighbor) {
                      continue;
                    }

                    // Simulate the swap to check if it creates shatterable groups
                    const tempBoard = board.map(row => row.slice());
                    tempBoard[r][c] = neighbor;
                    tempBoard[nr][nc] = cell;

                    // Check if this swap creates any shatterable groups (3+ in a line)
                    const groups = runtimeState.findAllGroups(
                      tempBoard,
                      cell => {
                        if (!cell) {
                          return false;
                        }
                        if (cell.rarity === 'Common') {
                          return true;
                        }
                        if (cell.rarity === 'Rare' && !cell.plus) {
                          return !!runtimeState.autoShatterRares;
                        }
                        return false;
                      },
                      BOARD_ROWS,
                      BOARD_COLS,
                    );

                    const hasShatterableGroup = groups.some(g => g.length >= 3 && runtimeState.hasStraightTriple(g));

                    // If this swap creates a shatterable group, it's a valid move
                    if (hasShatterableGroup) {
                      console.log(
                        'found valid move that creates shatter:',
                        { r,
                          c,
                          nr,
                          nc },
                        'src:',
                        cell.rarity,
                        'dst:',
                        neighbor.rarity,
                      );
                      moves.push({ r,
                        c,
                        nr,
                        nc });
                    }
                  }
                }
              }
            }

            console.log('findValidMovesList returning moves:', moves.length);
            return moves;
          },
          getHintMovesList: runtimeState.getHintMovesList,
          setHintMove: runtimeState.setHintMove,
          getHintMove: runtimeState.getHintMove,
          createBoard: runtimeState.createBoard,
          renderBoard: runtimeState.renderBoard,
          renderInventory: runtimeState.renderInventory,
          cascadeResolve: runtimeState.cascadeResolve,
        });
      }

      if (appendToDebug) {
        appendToDebug('Board bindings initialized successfully');
      }
    } catch (e) {
      try {
        console.debug && console.debug('ensureBoardBindings failed', e);
        if (appendToDebug) {
          appendToDebug('ensureBoardBindings failed: ' + String(e));
        }
      } catch (ee) {}
    }
  }

  return {
    ensureBoardBindings,
  };
}
