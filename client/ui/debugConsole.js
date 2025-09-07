// In-page debug console: create a console viewport under the inventory and forward console calls
function ensureDebugConsole(deps = {}) {
  const { shuffleRemaining = 3, setShuffleRemaining = () => {}, BASE_RATES = { Common: 0.685, Rare: 0.29, Epic: 0.025 }, MINE_SPAWN_PERCENT = 1, setMineSpawnPercent = () => {}, RARITY_RANK = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5, Ancestral: 6 }, ALL_TEMPLATES = [], animSpeed = 1, setAnimSpeed = () => {}, useVectorOnly = false, setUseVectorOnly = () => {}, bossHelper = {} } = deps;
  if (document.getElementById('debug-console-wrap')) return;
  const inv = document.getElementById('inventory');
  // Create a persistent portal attached to document.body so inventory re-renders cannot remove it
  const wrap = document.createElement('div');
  wrap.id = 'debug-console-wrap';
  wrap.style.position = 'absolute';
  wrap.style.marginTop = '12px';
  wrap.style.width = inv ? (inv.offsetWidth ? inv.offsetWidth + 'px' : '260px') : '320px';
  wrap.style.maxWidth = '90%';
  wrap.style.zIndex = '2000';
  wrap.style.boxSizing = 'border-box';

  const hdr = document.createElement('div');
  hdr.style.display = 'flex';
  hdr.style.alignItems = 'center';
  hdr.style.justifyContent = 'space-between';
  hdr.style.gap = '8px';

  const title = document.createElement('div');
  title.textContent = 'Console';
  title.style.fontWeight = '700';
  title.style.color = '#fff';
  hdr.appendChild(title);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '6px';
  const btnClear = document.createElement('button');
  btnClear.textContent = 'Clear';
  btnClear.addEventListener('click', () => { const p = document.getElementById('debug-console'); if (p) p.innerHTML = ''; });
  controls.appendChild(btnClear);
  const btnToggle = document.createElement('button');
  btnToggle.textContent = 'Hide';
  btnToggle.addEventListener('click', () => {
    const p = document.getElementById('debug-console');
    if (!p) return;
    if (p.style.display === 'none') {
      p.style.display = 'block';
      btnToggle.textContent = 'Hide';
    } else {
      p.style.display = 'none';
      btnToggle.textContent = 'Show';
    }
    // Also update the controls button text if present
    const ctrlBtn = document.getElementById('btn-devtools-toggle');
    if (ctrlBtn) ctrlBtn.textContent = p.style.display === 'none' ? 'Show Dev tools' : 'Hide Dev tools';
  });
  controls.appendChild(btnToggle);
  hdr.appendChild(controls);

  const pane = document.createElement('div');
  pane.id = 'debug-console';
  pane.style.background = '#0b0b0b';
  pane.style.color = '#e6e6e6';
  pane.style.fontFamily = 'monospace, monospace';
  pane.style.fontSize = '12px';
  pane.style.padding = '8px';
  pane.style.height = '160px';
  pane.style.overflow = 'auto';
  pane.style.border = '1px solid #222';
  pane.style.boxSizing = 'border-box';

  wrap.appendChild(hdr);
  wrap.appendChild(pane);

  // --- Dev controls (appear below the console) ---
  if (!document.getElementById('dev-controls')) {
    const dev = document.createElement('div');
    dev.id = 'dev-controls';
    dev.style.marginTop = '6px';
    dev.style.display = 'flex';
    dev.style.flexDirection = 'column';
    dev.style.gap = '6px';
    dev.style.paddingTop = '6px';
    dev.style.maxWidth = (pane.offsetWidth ? pane.offsetWidth : 320) + 'px';

    // Compact row: text inputs for swaps and shuffles
    const compact = document.createElement('div');
    compact.style.display = 'flex';
    compact.style.flexDirection = 'row';
    compact.style.gap = '8px';
    compact.style.alignItems = 'center';

  // Common swaps dev control fully removed

    const shufWrap = document.createElement('div');
    shufWrap.style.display = 'flex';
    shufWrap.style.flexDirection = 'column';
    const shufLabel = document.createElement('label');
    shufLabel.textContent = 'Shuffles';
    shufLabel.style.fontSize = '11px';
    const shufInput = document.createElement('input');
    shufInput.type = 'number'; shufInput.id = 'dev-shuffles'; shufInput.value = String(shuffleRemaining); shufInput.style.width = '72px';
    shufInput.addEventListener('change', () => {
      const val = parseInt(shufInput.value || '0', 10);
      setShuffleRemaining(val);
      appendToDebug && appendToDebug('shuffleRemaining -> ' + val);
      const b = document.getElementById('btn-shuffle');
      if (b) {
        b.textContent = `Shuffle (${val})`;
        b.disabled = val <= 0;
      }
      // Keep UI/state consistent
      try { saveGameState(); } catch (e) {}
      renderBoard && renderBoard();
    });
    shufWrap.appendChild(shufLabel); shufWrap.appendChild(shufInput);
    compact.appendChild(shufWrap);

  dev.appendChild(compact);
  // Small label between input rows
  const ratesLabelMid = document.createElement('div');
  ratesLabelMid.textContent = 'Drop rates';
  ratesLabelMid.style.fontSize = '12px';
  ratesLabelMid.style.fontWeight = '700';
  ratesLabelMid.style.marginTop = '4px';
  dev.appendChild(ratesLabelMid);

  // Compact rates row (stacked small inputs)
    const ratesCompact = document.createElement('div');
    ratesCompact.style.display = 'flex';
    ratesCompact.style.gap = '6px';
    ratesCompact.style.alignItems = 'flex-end';

    const makeSmallRate = (id, label, value) => {
      const w = document.createElement('div');
      w.style.display = 'flex';
      w.style.flexDirection = 'column';
      const l = document.createElement('label'); l.textContent = label; l.style.fontSize = '11px';
      const i = document.createElement('input'); i.type = 'number'; i.id = id; i.value = String(value); i.min = '0'; i.step = '0.1'; i.style.width = '64px';
      w.appendChild(l); w.appendChild(i);
      return w;
    };
    const commonPerc = Math.round((BASE_RATES.Common || 0) * 1000) / 10;
    const rarePerc = Math.round((BASE_RATES.Rare || 0) * 1000) / 10;
    const epicPerc = Math.round((BASE_RATES.Epic || 0) * 1000) / 10;
    ratesCompact.appendChild(makeSmallRate('dev-rate-common','Common %', commonPerc));
    ratesCompact.appendChild(makeSmallRate('dev-rate-rare','Rare %', rarePerc));
    ratesCompact.appendChild(makeSmallRate('dev-rate-epic','Epic %', epicPerc));
  ratesCompact.appendChild(makeSmallRate('dev-rate-mine','Mine %', MINE_SPAWN_PERCENT));

    const applyRow = document.createElement('div'); applyRow.style.display = 'flex'; applyRow.style.gap = '6px';
    const applyBtn = document.createElement('button'); applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
      const c = parseFloat(document.getElementById('dev-rate-common').value) || 0;
      const r = parseFloat(document.getElementById('dev-rate-rare').value) || 0;
      const e = parseFloat(document.getElementById('dev-rate-epic').value) || 0;
    const m = parseFloat(document.getElementById('dev-rate-mine').value) || 0;
      const sum = c + r + e; if (sum <= 0) { alert('Rates must sum to > 0'); return; }
      // Assign percentages directly so values >100 are allowed. The game expects fractions, so divide by 100.
      BASE_RATES.Common = c / 100;
      BASE_RATES.Rare = r / 100;
      BASE_RATES.Epic = e / 100;
    // mine spawn percent is stored directly (0..100)
    setMineSpawnPercent(Math.max(0, m));
    try { localStorage.setItem('devMineRate', String(Math.max(0, m))); } catch (e) {}
  try { saveGameState(); } catch (e) {}
  appendToDebug && appendToDebug(`BASE_RATES updated: Common=${c}% Rare=${r}% Epic=${e}% Mine=${Math.max(0, m)}% (fractions: ${BASE_RATES.Common}, ${BASE_RATES.Rare}, ${BASE_RATES.Epic})`);
    });
    const resetBtn = document.createElement('button'); resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      BASE_RATES.Common = 68.5/100; BASE_RATES.Rare = 29/100; BASE_RATES.Epic = 2.5/100;
      setMineSpawnPercent(1);
      document.getElementById('dev-rate-common').value = String(Math.round(BASE_RATES.Common*1000)/10);
      document.getElementById('dev-rate-rare').value = String(Math.round(BASE_RATES.Rare*1000)/10);
      document.getElementById('dev-rate-epic').value = String(Math.round(BASE_RATES.Epic*1000)/10);
      document.getElementById('dev-rate-mine').value = String(1);
      try { saveGameState(); } catch (e) {}
      appendToDebug && appendToDebug('BASE_RATES reset to defaults');
    });
    applyRow.appendChild(applyBtn); applyRow.appendChild(resetBtn);

    dev.appendChild(ratesCompact);
    dev.appendChild(applyRow);

    // --- Dev-only animation controls: speed slider + vector-only toggle ---
    const animRow = document.createElement('div');
    animRow.style.display = 'flex';
    animRow.style.flexDirection = 'row';
    animRow.style.gap = '8px';
    animRow.style.alignItems = 'center';
    const animLabel = document.createElement('label'); animLabel.textContent = 'Anim speed'; animLabel.style.fontSize = '11px';
    const animInput = document.createElement('input'); animInput.type = 'range'; animInput.id = 'anim-speed'; animInput.min = '0.25'; animInput.max = '2.0'; animInput.step = '0.05'; animInput.style.width = '140px';
    const animVal = document.createElement('div'); animVal.id = 'anim-speed-val'; animVal.style.fontSize = '11px'; animVal.style.minWidth = '36px'; animVal.style.textAlign = 'right';
    const chk = document.createElement('input'); chk.type = 'checkbox'; chk.id = 'chk-vector-only'; chk.style.marginLeft = '8px';
    const chkLab = document.createElement('label'); chkLab.textContent = 'Vector-only (no images)'; chkLab.style.fontSize = '11px'; chkLab.htmlFor = 'chk-vector-only';
    animRow.appendChild(animLabel); animRow.appendChild(animInput); animRow.appendChild(animVal); animRow.appendChild(chk); animRow.appendChild(chkLab);
    dev.appendChild(animRow);

    // --- Dev dropdown: pick next Epic (Random = normal behavior) ---
    const epicWrap = document.createElement('div');
    epicWrap.style.display = 'flex'; epicWrap.style.flexDirection = 'column'; epicWrap.style.gap = '4px'; epicWrap.style.marginTop = '6px';
    const epicLabel = document.createElement('label'); epicLabel.textContent = 'Force next Epic'; epicLabel.style.fontSize = '11px';
    const epicSelect = document.createElement('select'); epicSelect.id = 'dev-next-epic'; epicSelect.style.width = '100%'; epicSelect.style.fontSize = '12px';
    const optRandom = document.createElement('option'); optRandom.value = 'Random'; optRandom.textContent = 'Random'; epicSelect.appendChild(optRandom);
    // Populate with available templates that can be Epic (filter by templates that allow Epic rarity)
    try {
      const epicCandidates = ALL_TEMPLATES.filter(t => {
        const min = RARITY_RANK[t.minRarity] ?? 0; const max = RARITY_RANK[t.maxRarity] ?? 0; const epicRank = RARITY_RANK['Epic'];
        return min <= epicRank && epicRank <= max;
      }).sort((a,b) => (a.name||a.id).localeCompare(b.name||b.id));
      for (const t of epicCandidates) {
        const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.id} (${t.type})`;
        epicSelect.appendChild(o);
      }
    } catch (e) {}
    // restore selection immediately from localStorage if present
    try { const devNext = localStorage.getItem('devNextEpic'); if (devNext) epicSelect.value = devNext; } catch(e) {}
    epicSelect.addEventListener('change', () => {
      try { localStorage.setItem('devNextEpic', epicSelect.value); } catch (e) {}
      appendToDebug && appendToDebug('devNextEpic -> ' + epicSelect.value);
    });
    epicWrap.appendChild(epicLabel); epicWrap.appendChild(epicSelect);
    dev.appendChild(epicWrap);

    // initialize from localStorage if present
    try {
      const saved = localStorage.getItem('animSpeed'); if (saved) setAnimSpeed(parseFloat(saved) || animSpeed);
      const savedVec = localStorage.getItem('useVectorOnly'); if (savedVec) setUseVectorOnly(savedVec === '1' || savedVec === 'true');
      // restore devNextEpic selection if present
      try { const devNext = localStorage.getItem('devNextEpic'); if (devNext) {
        const sel = document.getElementById('dev-next-epic'); if (sel) sel.value = devNext;
      } } catch(e) {}
      try { const savedMine = localStorage.getItem('devMineRate'); if (savedMine) {
        const msel = document.getElementById('dev-rate-mine'); if (msel) msel.value = String(parseFloat(savedMine) || 1);
      } } catch(e) {}
    } catch (e) {}
    // Boss dev controls
    let spn, hsp, dth, mth, frq; // Declare variables outside try block for later access
    try {
      const bossWrap = document.createElement('div'); bossWrap.style.display = 'flex'; bossWrap.style.flexDirection = 'column'; bossWrap.style.gap = '4px'; bossWrap.style.marginTop = '6px';
      const bLabel = document.createElement('div'); bLabel.textContent = 'Boss (dev)'; bLabel.style.fontSize = '12px'; bLabel.style.fontWeight = '700'; bossWrap.appendChild(bLabel);
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '4px'; row.style.alignItems = 'center'; row.style.width = '100%';
      // Initialize boss dev inputs using promoted/persisted localStorage values when available
      spn = document.createElement('input'); spn.type = 'number'; spn.id = 'dev-boss-spawn';
      try {
        const s = localStorage.getItem('devBossSpawn');
        let val = 1/250; // default as fraction
        if (s) {
          const parsed = parseFloat(s);
          if (!isNaN(parsed)) {
            val = Math.max(0, Math.min(1, parsed)); // clamp to 0-1
          }
        }
        spn.value = String(val);
      } catch (e) { spn.value = String(1/250); }
      spn.style.flex = '1'; spn.style.minWidth = '60px';

      hsp = document.createElement('input'); hsp.type = 'number'; hsp.id = 'dev-boss-hits';
      try {
        const h = localStorage.getItem('devBossHits');
        if (h) hsp.value = String(parseInt(h, 10) || 100);
        else hsp.value = String(100);
      } catch (e) { hsp.value = String(100); }
      hsp.style.flex = '1'; hsp.style.minWidth = '45px';

      dth = document.createElement('input'); dth.type = 'number'; dth.id = 'dev-boss-threshold';
      try {
        const t = localStorage.getItem('devBossThreshold');
        if (t) dth.value = String(parseInt(t, 10) || 20);
        else dth.value = String(20);
      } catch (e) { dth.value = String(20); }
      dth.style.flex = '1'; dth.style.minWidth = '60px';

      mth = document.createElement('input'); mth.type = 'number'; mth.id = 'dev-boss-move-threshold';
      try {
        const mt = localStorage.getItem('devBossMoveThreshold');
        if (mt) mth.value = String(parseInt(mt, 10) || 4);
        else mth.value = String(4);
      } catch (e) { mth.value = String(4); }
      mth.style.flex = '1'; mth.style.minWidth = '60px';

      frq = document.createElement('input'); frq.type = 'number'; frq.id = 'dev-boss-phase-duration';
      try {
        const pd = localStorage.getItem('devBossPhaseDuration');
        if (pd) frq.value = String(parseInt(pd, 10) || 10);
        else frq.value = String(10);
      } catch (e) { frq.value = String(10); }
      frq.style.flex = '1'; frq.style.minWidth = '55px';

      row.appendChild(spn); row.appendChild(hsp); row.appendChild(dth); row.appendChild(mth); row.appendChild(frq);
      const labels = document.createElement('div'); labels.style.display='flex'; labels.style.gap='4px'; labels.style.width='100%'; labels.innerHTML = '<div style="flex:1; min-width:60px; font-size:10px; text-align:center">Spawn%<br/>(0.001=0.1%)</div><div style="flex:1; min-width:45px; font-size:10px; text-align:center">Hits</div><div style="flex:1; min-width:60px; font-size:10px; text-align:center">Destr<br/>Thresh</div><div style="flex:1; min-width:60px; font-size:10px; text-align:center">Move<br/>Thresh</div><div style="flex:1; min-width:55px; font-size:10px; text-align:center">Phase<br/>Freq</div>';
      bossWrap.appendChild(labels); bossWrap.appendChild(row);
  const applyBoss = document.createElement('button'); applyBoss.textContent = 'Apply Boss Dev'; applyBoss.addEventListener('click', () => {
        const spawnVal = parseFloat(spn.value) || 0.004;
        const hitsVal = parseInt(hsp.value || '100',10) || 100;
        const thVal = parseInt(dth.value || '20',10) || 20;
        const mtVal = parseInt(mth.value || '4',10) || 4;
        const frqVal = parseInt(frq.value || '10',10) || 10;
        // spawn input is always treated as a fraction (0.001 = 0.1%)
        const spawnFrac = Math.max(0, Math.min(1, spawnVal));
        bossHelper.setDevOptions && bossHelper.setDevOptions({ spawnChance: spawnFrac, requiredHits: hitsVal, destructionThreshold: thVal, moveThreshold: mtVal, phaseDuration: frqVal });
        appendToDebug && appendToDebug('Boss dev options applied: spawn=' + spawnFrac + ' hits=' + hitsVal + ' destrThresh=' + thVal + ' moveThresh=' + mtVal + ' phaseFreq=' + frqVal);
  try {
    // store the fraction value directly
    localStorage.setItem('devBossSpawn', String(spawnFrac));
    localStorage.setItem('devBossHits', String(hitsVal));
    localStorage.setItem('devBossThreshold', String(thVal));
    localStorage.setItem('devBossMoveThreshold', String(mtVal));
    localStorage.setItem('devBossPhaseDuration', String(frqVal));
  } catch (e) {}
        try {
          // persist into helper-local state and main save payload immediately
          try { const bs = bossHelper.getStateForSave && bossHelper.getStateForSave(); if (bs) localStorage.setItem('boss_state_v1', JSON.stringify(bs)); } catch (e) {}
          try { saveGameState(); } catch (e) {}
        } catch (e) {}
      });
  bossWrap.appendChild(applyBoss);
  // Quick dev controls: apply manual damage and sync boss state
  try {
    const dmgRow = document.createElement('div'); dmgRow.style.display = 'flex'; dmgRow.style.gap = '6px'; dmgRow.style.alignItems = 'center'; dmgRow.style.marginTop = '6px';
    const dmgInput = document.createElement('input'); dmgInput.type = 'number'; dmgInput.id = 'dev-boss-damage-amt'; dmgInput.value = '1'; dmgInput.style.width = '60px';
    const dmgBtn = document.createElement('button'); dmgBtn.textContent = 'Deal Damage';
    dmgBtn.addEventListener('click', () => {
      try {
        const amt = parseInt(dmgInput.value,10) || 1;
        const ok = bossHelper.applyDamage ? bossHelper.applyDamage(amt) : false;
        appendToDebug && appendToDebug('Dev applied damage ' + amt + ' -> ' + (ok ? 'ok' : 'no-boss'));
      } catch (e) { console.error('Deal Damage failed', e); }
    });
    const dmg10 = document.createElement('button'); dmg10.textContent = 'Deal 10'; dmg10.addEventListener('click', () => { try { const ok = bossHelper.applyDamage ? bossHelper.applyDamage(10) : false; appendToDebug && appendToDebug('Dev applied damage 10 -> ' + (ok ? 'ok' : 'no-boss')); } catch (e) {} });
    const syncBtn = document.createElement('button'); syncBtn.textContent = 'Sync Hits from Boss'; syncBtn.addEventListener('click', () => {
      try {
        const b = bossHelper.getBoss ? bossHelper.getBoss() : (window.__BOSS_MARKER || null);
        if (b && typeof b.hitsRemaining === 'number') {
          hsp.value = String(b.hitsRemaining);
          appendToDebug && appendToDebug('Synced dev-boss-hits from boss: ' + b.hitsRemaining);
        } else appendToDebug && appendToDebug('No boss to sync from');
      } catch (e) { console.error('Sync hits failed', e); }
    });
    const posBtn = document.createElement('button'); posBtn.textContent = 'Show Boss Pos'; posBtn.addEventListener('click', () => { try { appendToDebug && appendToDebug('Boss marker: ' + JSON.stringify(window.__BOSS_MARKER || null)); console.debug('Boss marker', window.__BOSS_MARKER); } catch (e) {} });
    dmgRow.appendChild(dmgInput); dmgRow.appendChild(dmgBtn); dmgRow.appendChild(dmg10); dmgRow.appendChild(syncBtn); dmgRow.appendChild(posBtn);
    bossWrap.appendChild(dmgRow);
  } catch (e) {}
  // restore saved boss dev values if present
  try {
    const s = localStorage.getItem('devBossSpawn');
    if (s) {
      const v = parseFloat(s);
      if (!isNaN(v)) {
        // display as fraction (not percentage) for clarity
        spn.value = String(v);
      }
    }
  } catch (e) {}
  try { const h = localStorage.getItem('devBossHits'); if (h) hsp.value = String(parseInt(h,10) || 100); } catch (e) {}
  try { const t = localStorage.getItem('devBossThreshold'); if (t) dth.value = String(parseInt(t,10) || 20); } catch (e) {}
  try { const mt = localStorage.getItem('devBossMoveThreshold'); if (mt) mth.value = String(parseInt(mt,10) || 4); } catch (e) {}
  try { const pd = localStorage.getItem('devBossPhaseDuration'); if (pd) frq.value = String(parseInt(pd,10) || 10); } catch (e) {}
  // Only apply dev options if boss doesn't exist (prevent overwriting restored boss HP)
  try {
    const currentBoss = bossHelper.getBoss ? bossHelper.getBoss() : null;
    if (!currentBoss) {
      const sp = parseFloat(spn.value) || 0.004;
      const hi = parseInt(hsp.value,10) || 100;
      const th = parseInt(dth.value,10) || 20;
      const mt = parseInt(mth.value,10) || 4;
      const frqVal = parseInt(frq.value,10) || 10;
      const spawnFrac = Math.max(0, Math.min(1, sp));
      const applied = { spawnChance: spawnFrac, requiredHits: hi, destructionThreshold: th, moveThreshold: mt, phaseDuration: frqVal };
      try { bossHelper.setDevOptions && bossHelper.setDevOptions(applied); console.debug('Applied restored boss dev inputs to helper (no active boss)', applied); } catch (e) { console.error('Applying restored boss dev inputs failed', e); }
    } else {
      // Only update options that don't affect existing boss HP
      const sp = parseFloat(spn.value) || 0.004;
      const th = parseInt(dth.value,10) || 20;
      const mt = parseInt(mth.value,10) || 4;
      const frqVal = parseInt(frq.value,10) || 10;
      const spawnFrac = Math.max(0, Math.min(1, sp));
      const applied = { spawnChance: spawnFrac, destructionThreshold: th, moveThreshold: mt, phaseDuration: frqVal };
      try { bossHelper.setDevOptions && bossHelper.setDevOptions(applied); console.debug('Applied restored boss dev inputs to helper (preserving active boss)', applied); } catch (e) { console.error('Applying restored boss dev inputs failed', e); }
    }
  } catch (e) { console.error('Error applying restored boss dev inputs', e); }
      dev.appendChild(bossWrap);
    } catch (e) {}
    // reflect initial values
    animInput.value = String(animSpeed);
    animVal.textContent = String(animSpeed.toFixed ? animSpeed.toFixed(2) : animSpeed);
    chk.checked = !!useVectorOnly;
    // ensure CSS var is set
    try { document.documentElement.style.setProperty('--anim-speed', String(animSpeed || 1)); } catch (e) {}
    // wire events
    animInput.addEventListener('input', () => {
      const val = parseFloat(animInput.value) || 1.0;
      setAnimSpeed(val);
      animVal.textContent = String(val.toFixed ? val.toFixed(2) : val);
      try { document.documentElement.style.setProperty('--anim-speed', String(val || 1)); localStorage.setItem('animSpeed', String(val)); } catch (e) {}
    });
    animInput.addEventListener('change', () => { /* persist already handled on input */ });
    chk.addEventListener('change', () => {
      const val = !!chk.checked;
      setUseVectorOnly(val);
      try { localStorage.setItem('useVectorOnly', val ? '1' : '0'); } catch (e) {}
      try { renderInventory && renderInventory(); renderBoard && renderBoard(); } catch (e) {}
    });

  // Free-swap is a default game behavior now; control removed from dev UI

    wrap.appendChild(dev);
  }

  // Instead of inserting inside #inventory (which may be re-created), append to body as a portal
  // and position it under the inventory via positionDebugPortal(). This prevents accidental removal.
  document.body.appendChild(wrap);
  // Position once now and again on resize
  try { positionDebugPortal(); } catch (e) {}
  if (!window.__debugPortalResizeHooked) {
    window.addEventListener('resize', () => { try { positionDebugPortal(); } catch (e) {} });
    window.__debugPortalResizeHooked = true;
  }

  // Hook console functions to also log to the pane
  const format = (args) => args.map(a => {
    try { if (typeof a === 'string') return a; return JSON.stringify(a); } catch (e) { try { return String(a); } catch (ee) { return '<unserializable>'; } }
  }).join(' ');

  const orig = { log: console.log, info: console.info, debug: console.debug, warn: console.warn, error: console.error };
  ['log','info','debug','warn','error'].forEach((k) => {
    console[k] = function(...args) {
      try {
        const line = document.createElement('div');
        line.style.whiteSpace = 'pre-wrap';
        line.style.marginBottom = '4px';
        if (k === 'error') line.style.color = '#ff8080';
        else if (k === 'warn') line.style.color = '#ffd080';
        else if (k === 'debug') line.style.color = '#9fe6c7';
        else line.style.color = '#e6e6e6';
        line.textContent = '[' + k.toUpperCase() + '] ' + format(args);
        const p = document.getElementById('debug-console');
        if (p) {
          p.appendChild(line);
          // cap messages to last ~500 entries
          while (p.childNodes.length > 500) p.removeChild(p.firstChild);
          p.scrollTop = p.scrollHeight;
        }
      } catch (e) {}
      try { orig[k].apply(console, args); } catch (e) {}
    };
  });
}
// Helper to append to the in-page debug console if present
function appendToDebug(msg) {
  try {
    const p = document.getElementById('debug-console');
    if (!p) return;
    const line = document.createElement('div');
    line.style.whiteSpace = 'pre-wrap';
    line.style.marginBottom = '4px';
    line.style.color = '#9fe6c7';
    line.textContent = '[DBG] ' + msg;
    p.appendChild(line);
    while (p.childNodes.length > 500) p.removeChild(p.firstChild);
    p.scrollTop = p.scrollHeight;
  } catch (e) {}
}

// Position the debug console portal so it visually appears under #inventory when possible.
function positionDebugPortal() {
  const wrap = document.getElementById('debug-console-wrap');
  if (!wrap) return;
  const inv = document.getElementById('inventory');
  // Default: place in the bottom-right of #app
  const app = document.getElementById('app') || document.body;
  if (inv) {
    const rect = inv.getBoundingClientRect();
    // place the portal absolutely under the inventory element (same left, top after inventory)
    wrap.style.left = Math.max(8, rect.left + window.scrollX) + 'px';
    wrap.style.top = Math.max(8, rect.bottom + window.scrollY + 6) + 'px';
    // match width to inventory where possible
    wrap.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
  } else if (app) {
    const rect = app.getBoundingClientRect();
    wrap.style.left = Math.max(8, rect.left + window.scrollX) + 'px';
    wrap.style.top = Math.max(8, rect.bottom + window.scrollY + 6) + 'px';
    wrap.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
  } else {
    wrap.style.left = '8px';
    wrap.style.top = '8px';
    wrap.style.width = '320px';
  }
}

export { ensureDebugConsole, appendToDebug, positionDebugPortal };