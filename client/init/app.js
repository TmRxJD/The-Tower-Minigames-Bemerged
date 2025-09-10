// Initialization Module
// Handles UI initialization, Discord integration, and app setup

export function createInitializer({
  initDiscordIfEmbedded,
  getChannelInfo,
  SAVE_KEY,
  localStorage,
  appendToDebug,
  bossHelper,
  BOARD_ROWS,
  BOARD_COLS,
  moveCount,
  getCellAt,
  removeCellAt,
  awardShards,
  renderBoard,
  setBossOnBoard,
  getCellAtRaw,
  cascadeResolve,
  lazyPreloadAssets,
  applyBackground,
  DEV_TOOLS_VISIBLE,
  ensureDebugConsole,
  positionDebugPortal,
  animSpeed,
  useVectorOnly,
  RARITY_COLOR,
  ASSETS,
  HARDCODED_COMMON_SELECTION,
  MINE_ASSET,
  TYPE_TOKENS,
  formatTimer,
  startGameTimer,
  bossImg,
  mineAsset,
  BACKGROUNDS,
  ensureMergeChartElement,
  CHART_VISIBLE,
  ensureHintStyles,
}) {
  // Initialize Discord integration
  async function initDiscordIntegration() {
    try {
      const ok = await initDiscordIfEmbedded();
      if (ok) {
        console.log('Discord integration initialized');
      }
    } catch (e) {
      console.error('Discord integration failed:', e);
    }
  }

  // Initialize boss integration
  function initBossIntegration() {
    try {
      bossHelper.init({
        BOARD_ROWS,
        BOARD_COLS,
        moveCount,
        getCellAt,
        removeCellAt,
        awardShards,
        renderBoard,
        setBossOnBoard,
        getCellAtRaw,
        SAVE_KEY,
        appendToDebug,
      });
    } catch (e) {
      console.error('Boss integration failed:', e);
    }
  }

  // Setup UI elements
  function initUI() {
    // create minimal UI if not present
    const app = document.getElementById('app') || document.body;

    // Ensure the merge chart element exists
    try {
      ensureMergeChartElement();
    } catch (e) {}

    // Startup diagnostic: dump persisted boss/dev keys
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
    } catch (e) {}

    // Promote dev boss settings from main save payload
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
    } catch (e) {}

    if (!document.getElementById('game-board')) {
      // Create the main UI structure
      const outer = document.createElement('div');
      outer.style.display = 'flex';
      outer.style.flexDirection = 'row';
      outer.style.gap = '12px';
      outer.style.alignItems = 'flex-start';
      outer.style.margin = '12px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.flexDirection = 'column';
      left.style.gap = '8px';

      const info = document.createElement('div');
      info.id = 'game-info';
      left.appendChild(info);

      const boardDiv = document.createElement('div');
      boardDiv.id = 'game-board';
      left.appendChild(boardDiv);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';
      left.appendChild(controls);

      outer.appendChild(left);

      // Right column: inventory and dev tools
      const rightCol = document.createElement('div');
      rightCol.id = 'right-column';
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.gap = '8px';
      rightCol.style.alignItems = 'center';

      const inv = document.createElement('div');
      inv.id = 'inventory';
      rightCol.appendChild(inv);
      outer.appendChild(rightCol);

      app.appendChild(outer);
    }

    // Apply restored UI settings
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
        // This would need to be handled by the rendering system
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

    // Inject hint styles
    ensureHintStyles();

    // Initialize debug console
    ensureDebugConsole({
      shuffleRemaining: 3, // These would need to be passed in
      BASE_RATES: {},
      MINE_SPAWN_PERCENT: 1,
      RARITY_RANK: {},
      ALL_TEMPLATES: [],
      animSpeed,
      bossHelper,
    });
  }

  // Apply disable animations
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
    } catch (e) {}
  }

  // Append voice channel name
  async function appendVoiceChannelName() {
    const app = document.querySelector('#app');

    let activityChannelName = 'Unknown';

    try {
      const info = await getChannelInfo();
      if (info && info.channel && info.channel.name) {
        activityChannelName = info.channel.name;
      }
    } catch (e) {}

    const textTagString = `Activity Channel: "${activityChannelName}"`;
    const textTag = document.createElement('p');
    textTag.textContent = textTagString;
    app.appendChild(textTag);
  }

  return {
    initDiscordIntegration,
    initBossIntegration,
    initUI,
    appendVoiceChannelName,
  };
}
