import { appendToDebug, ensureDebugConsole, positionDebugPortal } from './debugConsole.js';

function makeControls(ctx) {
  // Extract dependencies from ctx
  const {
    BOARD_COLS,
    BOARD_ROWS,
    board,
    selected,
    mergeSelecting,
    candidateHighlights,
    isDisabledByMine,
    bossImg,
    badLuckCounter,
    inventory,
    updateScoreUI,
    updateMergePreview,
    shuffleRemaining,
    saveGameState,
    resetInactivity,
    adjustRightColumnToBoard,
    evaluateMergeAttempt,
    onCellClick,
    onCellContextMenu,
    handleLongPress,
    longPressTimer,
    appendToDebug,
    hintMove,
    useVectorOnly,
    findTemplate,
    HARDCODED_COMMON_SELECTION,
    MINE_ASSET,
    RARITY_COLOR,
    ASSETS,
    autoShatterRares,
    ORIENTATION,
    CHART_VISIBLE,
    DEV_TOOLS_VISIBLE,
    BACKGROUNDS,
    BASE_RATES,
    MINE_SPAWN_PERCENT,
    ALL_TEMPLATES,
    RARITY_RANK
  } = ctx;

  function ensureControls() {
  const boardDiv = document.getElementById('game-board');
  if (!boardDiv) return;
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
      inventory = { Cannon: null, Generator: null, Armor: null, Core: null };
      shuffleRemaining = 3;
      commonSwapRemaining = 20;
  // reset session stats and shard totals
  try { moveCount = 0; } catch (e) {}
  try { totalMerges = 0; } catch (e) {}
  try { totalShatters = 0; } catch (e) {}
  try { shardsEarned = { Cannon: 0, Armor: 0, Generator: 0, Core: 0 }; } catch (e) {}
  try { score = 0; } catch (e) {}
  // clear boss state on restart
  try { window.__BOSS_MARKER = null; } catch (e) {}
  try { bossHelper.setState && bossHelper.setState(null); } catch (e) {}
  // rebuild board and UI
  createBoard(); renderBoard(); renderInventory();
  try { lazyPreloadAssets(); } catch (e) {}
  try {
  // Initialize board module with bindings to main.js state and helpers
  ensureBoardBindings();
  } catch (e) { try { console.debug && console.debug('boardModule.initBoard failed', e); } catch (ee) {} }
  try { updateScoreUI(); } catch (e) {}
  try { saveGameState(); } catch (e) {}
  try { cascadeResolve(); } catch (e) {}
  // reset and start timer for new game
  try { resetGameTimer(); startGameTimer(); } catch (e) {}
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
    rareCb.addEventListener('change', () => { autoShatterRares = rareCb.checked; try { saveGameState(); } catch (e) {} });
    const rareLabel = document.createElement('span');
    rareLabel.textContent = 'Auto-shatter Rares';
    rareWrap.appendChild(rareCb);
    rareWrap.appendChild(rareLabel);
    settingsMenu.appendChild(rareWrap);

    // Orientation toggle
    const btnOrient = document.createElement('button');
    btnOrient.id = 'btn-orient';
    const updateOrientLabel = () => { btnOrient.textContent = 'Orientation: ' + (ORIENTATION === 'portrait' ? 'Portrait' : 'Landscape'); };
    updateOrientLabel();
    btnOrient.addEventListener('click', () => {
      ORIENTATION = ORIENTATION === 'portrait' ? 'landscape' : 'portrait';
      const targetRows = BOARD_COLS;
      const targetCols = BOARD_ROWS;
      if (!board || !Array.isArray(board) || board.length === 0 || !board[0]) {
        if (ORIENTATION === 'landscape') { BOARD_ROWS = 8; BOARD_COLS = 14; } else { BOARD_ROWS = 14; BOARD_COLS = 8; }
        updateOrientLabel();
        try { saveGameState(); } catch (e) {}
        createBoard(); renderBoard(); renderInventory();
        return;
      }
      const oldRows = BOARD_ROWS;
      const oldCols = BOARD_COLS;
      const oldBoard = board;
      const rotated = [];
      for (let r = 0; r < targetRows; r++) {
        const row = [];
        for (let c = 0; c < targetCols; c++) {
          const srcR = oldRows - 1 - c;
          const srcC = r;
          row.push((oldBoard[srcR] && oldBoard[srcR][srcC]) ? oldBoard[srcR][srcC] : null);
        }
        rotated.push(row);
      }
      for (let i = 0; i < selected.length; i++) {
        const s = selected[i];
        if (!s) continue;
        if (typeof s.r === 'number' && typeof s.c === 'number') {
          const nr = oldRows - 1 - s.c;
          const nc = s.r;
          selected[i] = { ...s, r: nr, c: nc };
        }
      }
      if (hintMove) {
        try {
          const hr = hintMove.r, hc = hintMove.c;
          const hnr = oldRows - 1 - hc;
          const hnc = hr;
          hintMove.r = hnr; hintMove.c = hnc;
          if (typeof hintMove.nr === 'number' && typeof hintMove.nc === 'number') {
            const nr2 = oldRows - 1 - hintMove.nc;
            const nc2 = hintMove.nr;
            hintMove.nr = nr2; hintMove.nc = nc2;
          }
        } catch (e) { }
      }
      if (candidateHighlights && candidateHighlights.size > 0) {
        const newSet = new Set();
        for (const k of candidateHighlights) {
          const parts = k.split(',');
          if (parts.length !== 2) continue;
          const rr = parseInt(parts[0], 10);
          const cc = parseInt(parts[1], 10);
          if (Number.isFinite(rr) && Number.isFinite(cc)) {
            const nr = oldRows - 1 - cc;
            const nc = rr;
            newSet.add(nr + ',' + nc);
          }
        }
        candidateHighlights = newSet;
      }
  board = rotated;
  try { ensureBoardBindings(); } catch (e) {}
      BOARD_ROWS = targetRows;
      BOARD_COLS = targetCols;
      updateOrientLabel();
      try { saveGameState(); } catch (e) {}
      renderBoard(); renderInventory();
      try { positionDebugPortal(); } catch (e) {}
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
    try { animCb.checked = !!localStorage.getItem('disableAnimations') && localStorage.getItem('disableAnimations') !== '0'; } catch (e) { animCb.checked = false; }
    const animLabel = document.createElement('span');
    animLabel.textContent = 'Disable animations';
    animWrap.appendChild(animCb);
    animWrap.appendChild(animLabel);
    settingsMenu.appendChild(animWrap);
    // ensure CSS rule exists when toggled
    function applyDisableAnimations(disable) {
      try {
        if (disable) {
          document.documentElement.classList.add('no-animations');
          let s = document.getElementById('no-animations-style');
          if (!s) {
            s = document.createElement('style'); s.id = 'no-animations-style';
            s.textContent = `html.no-animations * { animation: none !important; transition: none !important; }`;
            document.head.appendChild(s);
          }
        } else {
          document.documentElement.classList.remove('no-animations');
        }
      } catch (e) {}
    }
    animCb.addEventListener('change', () => {
      const disabled = !!animCb.checked;
      try { localStorage.setItem('disableAnimations', disabled ? '1' : '0'); } catch (e) {}
      applyDisableAnimations(disabled);
    });
    // apply initial state
    try { applyDisableAnimations(!!animCb.checked); } catch (e) {}

    // Choose Background dropdown
    try {
      const bgWrap = document.createElement('label');
      bgWrap.style.display = 'flex';
      bgWrap.style.flexDirection = 'column';
      bgWrap.style.gap = '6px';
      const bgTitle = document.createElement('span'); bgTitle.textContent = 'Choose Background'; bgTitle.style.fontWeight = '600';
      const bgSelect = document.createElement('select'); bgSelect.id = 'sel-background';
      // first option: none
      const noneOpt = document.createElement('option'); noneOpt.value = ''; noneOpt.textContent = 'None'; bgSelect.appendChild(noneOpt);
      // populate from BACKGROUNDS map (sorted)
      const bgKeys = Object.keys(BACKGROUNDS).sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      for (const k of bgKeys) {
        const opt = document.createElement('option'); opt.value = k; opt.textContent = formatBackgroundDisplay(k); bgSelect.appendChild(opt);
      }
      // reflect saved state
      try { const saved = localStorage.getItem('background'); if (saved) bgSelect.value = saved; } catch (e) {}
      // wire change
      bgSelect.addEventListener('change', () => {
        const v = bgSelect.value || '';
        applyBackground(v);
      });
      bgWrap.appendChild(bgTitle); bgWrap.appendChild(bgSelect);
      settingsMenu.appendChild(bgWrap);
      // apply initial background now
      try { const saved = localStorage.getItem('background'); applyBackground(saved || ''); } catch (e) {}
    } catch (e) { /* ignore UI failures */ }

    // Dev tools toggle (always placed last in menu when present)
    if (true) {
      // avoid creating duplicate buttons when UI is re-rendered
      if (!document.getElementById('btn-devtools-toggle')) {
        const btnDevTools = document.createElement('button');
        btnDevTools.id = 'btn-devtools-toggle';
        btnDevTools.textContent = DEV_TOOLS_VISIBLE ? 'Hide Dev tools' : 'Show Dev tools';
        btnDevTools.addEventListener('click', () => {
          DEV_TOOLS_VISIBLE = !DEV_TOOLS_VISIBLE;
          const wrap = document.getElementById('debug-console-wrap');
          if (DEV_TOOLS_VISIBLE) {
            try { ensureDebugConsole(); } catch (e) {}
            const w = document.getElementById('debug-console-wrap');
            if (w) w.style.display = 'block';
            try { positionDebugPortal(); } catch (e) {}
            btnDevTools.textContent = 'Hide Dev tools';
          } else {
            if (wrap) wrap.style.display = 'none';
            btnDevTools.textContent = 'Show Dev tools';
          }
        });
        settingsMenu.appendChild(btnDevTools);
      }
    }

    // show/hide menu and position it (prefer opening upward above the button)
    btnSettings.addEventListener('click', (ev) => {
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
          settingsMenu.style.top = (aboveTop) + 'px';
        } else {
          // fallback: position below the button
          const belowTop = rect.bottom + 8;
          settingsMenu.style.left = left + 'px';
          settingsMenu.style.top = (belowTop) + 'px';
        }
        settingsMenu.style.visibility = 'visible';
      } catch (e) { try { settingsMenu.style.display = 'flex'; settingsMenu.style.visibility = 'visible'; } catch (ee) {} }
    });
    // hide when clicking outside (ignore clicks inside the menu or on the settings button)
    document.addEventListener('click', (ev) => {
      try {
        const t = ev && ev.target;
        if (!t) { settingsMenu.style.display = 'none'; rulesMenu && (rulesMenu.style.display = 'none'); return; }
        // if the click happened inside the settings menu or on the settings button, do nothing
        if ((settingsMenu && settingsMenu.contains(t)) || (btnSettings && btnSettings.contains(t))) return;
        // if the click happened inside the rules menu or on the rules button, do nothing
        if ((typeof rulesMenu !== 'undefined' && rulesMenu && rulesMenu.contains(t)) || (typeof btnRules !== 'undefined' && btnRules && btnRules.contains(t))) return;
        // otherwise hide both menus
        try { settingsMenu.style.display = 'none'; } catch (e) {}
        try { if (typeof rulesMenu !== 'undefined' && rulesMenu) rulesMenu.style.display = 'none'; } catch (e) {}
      } catch (e) {}
    });

    // hide menu on resize to avoid misplacement; will be recomputed when opened again
    if (!window.__settingsMenuResizeHooked) {
      window.addEventListener('resize', () => { try { settingsMenu.style.display = 'none'; } catch (e) {} });
      window.__settingsMenuResizeHooked = true;
    }

    // Toggle chart visibility
    const btnToggleChart = document.createElement('button');
    btnToggleChart.id = 'btn-toggle-chart';
    const updateChartBtn = () => { btnToggleChart.textContent = CHART_VISIBLE ? 'Hide Chart' : 'Show Chart'; };
    updateChartBtn();
    btnToggleChart.addEventListener('click', () => {
  try { ensureMergeChartElement(); } catch (e) {}
      CHART_VISIBLE = !CHART_VISIBLE;
      try { saveGameState(); } catch (e) {}
      updateChartBtn();
      const ch = document.getElementById('merge-chart-wrap');
      if (ch) ch.style.display = CHART_VISIBLE ? 'block' : 'none';
      // Reposition dev tools portal after chart visibility/layout changes
      try { positionDebugPortal(); } catch (e) {}
    });
  // ensure chart toggle is first in the control row
  controls.insertBefore(btnToggleChart, controls.firstChild);


    // Hint button in controls
    const btnHint = document.createElement('button');
    btnHint.id = 'btn-hint';
    btnHint.textContent = 'Hint';
    btnHint.addEventListener('click', () => {
      try { console.debug('Controls hint clicked'); } catch(e) {}
      try {
        // guard: ensure board exists
        if (!board || !Array.isArray(board)) {
          appendToDebug && appendToDebug('Controls hint: board is not initialized');
          console.error('Controls hint: board is not initialized', { board });
          return;
        }
        let moves;
        try {
          moves = findValidMovesList();
        } catch (innerErr) {
          const msg = innerErr && innerErr.stack ? innerErr.stack : String(innerErr);
          appendToDebug && appendToDebug('Controls hint: findValidMovesList threw: ' + msg);
          console.error('Controls hint inner error', innerErr);
          return;
        }
        try { console.debug('Controls hint found moves:', moves ? moves.length : 0); } catch(e) {}
        try { appendToDebug && appendToDebug('Controls hint moves: ' + (moves ? moves.length : 0)); } catch (e) {}
        if (!moves || moves.length === 0) { alert('No valid moves available'); return; }
        // show a small sample and board snapshot for debugging
        try { appendToDebug && appendToDebug('Sample moves: ' + JSON.stringify(moves.slice(0,8))); } catch (e) {}
        try { appendToDebug && appendToDebug('Board snapshot: ' + JSON.stringify(board.map(r => r.map(c => c ? { templateId: c.templateId, rarity: c.rarity, plus: !!c.plus, type: c.type } : null)))); } catch (e) {}
        const mv = moves[Math.floor(Math.random() * moves.length)];
        hintMove = mv;
        try { appendToDebug && appendToDebug('Controls hint chosen: ' + JSON.stringify(mv)); } catch (e) {}
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
    const rulesTitle = document.createElement('div'); rulesTitle.textContent = 'Rules'; rulesTitle.style.fontWeight = '700'; rulesTitle.style.fontSize = '16px'; rulesMenu.appendChild(rulesTitle);
    const rulesText = document.createElement('div');
    rulesText.innerHTML = `
      <div style="font-size:15px;line-height:1.5">
      <b>Objective:</b> Merge modules to reach Ancestral 5★ for each type (Cannon, Generator, Armor, Core) as quickly as possible. Extra points for additional 5★ modules.
      <br><br>
      <b>Gameplay:</b>
      <ul>
        <li>Swap and merge modules on the board. Select a base module, then choose valid fodder modules to merge and upgrade.</li>
        <li>Modules have types and rarities. Only valid fodder can be merged into a base; Commons cannot be used as fodder.</li>
        <li>You can swap modules between the board and your inventory. Inventory slots are limited to one per type.</li>
        <li>You may swap any two modules from anywhere on the board, not just adjacent ones.</li>
        <li>Shattering: Groups of 3+ Commons (or Rares if enabled) will auto-shatter and award shards.</li>
        <li>Use the shuffle button to randomize the board (limited uses).</li>
      </ul>
      <b>Controls:</b>
      <ul>
        <li><b>Swap:</b> Click any two modules to swap them (free-swap enabled).</li>
        <li><b>Long Press:</b> Hold a module to enter merge mode, then select valid fodder modules. Complete the merge by pressing the base module again or the preview window.</li>
        <li><b>Right Click:</b> Quickly send a module to inventory (if the slot is available).</li>
        <li><b>Inventory:</b> Click inventory slots to select, swap, or place modules (one per type).</li>
        <li><b>Shuffle:</b> Randomize the board (limited uses).</li>
        <li><b>Settings:</b> Adjust auto-shatter, orientation, and other options.</li>
        <li><b>Dev Tools:</b> (if enabled) Show/hide advanced debug options and adjust drop rates.</li>
      </ul>
      <b>Bosses:</b>
      <ul>
        <li>Bosses may spawn randomly. When present, you cannot use inventory or perform certain actions until the boss is defeated.</li>
        <li>Defeat the boss by merging or shattering modules into it as required. Boss HP is shown at the top of the board.</li>
      </ul>
      <b>Mines:</b>
      <ul>
        <li>Mines may appear on the board. Mines have a countdown and will explode if not removed in time, destroying all modules surrounding it.</li>
        <li>Tiles adjacent to a live mine are disabled and cannot be used for merges or as fodder.</li>
        <li>Mines can be shattered manually if two Commons are in-line with the mine.</li>
      </ul>
      <b>Not Allowed:</b>
      <ul>
        <li>You cannot use Commons as fodder for merges.</li>
        <li>You cannot use inventory while a boss is present.</li>
        <li>Tiles disabled by bosses and mines cannot be used for merges or as fodder, but they may still be swapped.</li>
      </ul>
      <br>
      For more details, see the merge chart and experiment with different strategies!
      </div>
    `;
    rulesMenu.appendChild(rulesText);
    const rulesClose = document.createElement('button'); rulesClose.textContent = 'Close'; rulesClose.addEventListener('click', () => { rulesMenu.style.display = 'none'; });
    rulesMenu.appendChild(rulesClose);
    // position/show logic for rules menu (prefer upward)
    btnRules.addEventListener('click', (ev) => {
      ev.stopPropagation();
      try {
        if (rulesMenu.style.display === 'flex') { rulesMenu.style.display = 'none'; return; }
        rulesMenu.style.display = 'flex'; rulesMenu.style.visibility = 'hidden';
        // Position the rules menu centered over the board
        const boardDiv = document.getElementById('game-board');
        const boardRect = boardDiv ? boardDiv.getBoundingClientRect() : { left: window.innerWidth/2-160, top: window.innerHeight/2-200, width: 320, height: 400 };
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
      } catch (e) { try { rulesMenu.style.display = 'flex'; rulesMenu.style.visibility = 'visible'; } catch (ee) {} }
    });
    // ensure clicks inside rules menu don't close it (document click handler below will check contains)
    controls.appendChild(btnRules);

  // Insert settings button last in the controls row so it appears as the final control
  controls.appendChild(btnSettings);

  // Insert controls after boardDiv
  if (boardDiv.parentNode) boardDiv.parentNode.insertBefore(controls, boardDiv.nextSibling);
  // ensure timer element is placed under the score pill and restore running state
  try { ensureGameTimerPlaced(); } catch (e) {}
  } else {
    // update shuffle button state if controls already exist
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.textContent = `Shuffle (${shuffleRemaining})`;
      btnShuffle.disabled = shuffleRemaining <= 0;
    }
  }
  }

  return { ensureControls };
}

export { makeControls };