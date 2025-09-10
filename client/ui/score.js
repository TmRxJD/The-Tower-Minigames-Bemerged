export function makeScoreUI(ctx) {
  const { getState, TYPE_TOKENS = {}, formatTimer = s => String(s), startGameTimer = () => {}, bossHelper } = ctx;

  function ensureGameTimerPlaced() {
    try {
      const state = getState();
      const scoreEl = document.getElementById('score');
      if (!scoreEl) {
        return;
      }
      let scoreLabel = scoreEl.querySelector('.score-label');
      let scoreValue = scoreEl.querySelector('.score-value');
      if (!scoreLabel) {
        scoreEl.textContent = '';
        scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'Score:';
        scoreEl.appendChild(scoreLabel);
      }
      if (!scoreValue) {
        scoreValue = document.createElement('span');
        scoreValue.className = 'score-value';
        scoreEl.appendChild(scoreValue);
      }
      let timeLabel = scoreEl.querySelector('.time-label');
      let timer = document.getElementById('game-timer');
      if (!timeLabel) {
        timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = 'Time:';
        scoreEl.appendChild(timeLabel);
      }
      if (!timer) {
        timer = document.createElement('span');
        timer.id = 'game-timer';
        timer.className = 'time-value';
        timer.style.marginLeft = '6px';
        timer.style.fontSize = '0.95rem';
        scoreEl.appendChild(timer);
      }
      try {
        const savedStart = localStorage.getItem('gameTimerStart');
        if (savedStart && !isNaN(parseInt(savedStart, 10))) {
          try {
            window.gameTimerStart = parseInt(savedStart, 10);
          } catch (e) {}
          try {
            window.gameTimerSeconds = Math.floor((Date.now() - window.gameTimerStart) / 1000);
          } catch (e) {}
          timer.textContent = formatTimer(window.gameTimerSeconds);
        } else {
          timer.textContent = formatTimer(window.gameTimerSeconds || 0);
        }
      } catch (e) {
        try {
          timer.textContent = formatTimer(window.gameTimerSeconds || 0);
        } catch (ee) {}
      }
      const running = localStorage.getItem('gameTimerRunning');
      if (running === '1' && !window.gameTimerInterval) {
        startGameTimer();
      }
    } catch (e) {}
  }

  function updateScoreUI() {
    try {
      const el = document.getElementById('score');
      if (!el) {
        return;
      }
      const state = getState();
      el.textContent = '';

      // Time line
      const timeLine = document.createElement('div');
      timeLine.className = 'time-line';
      const timeLabel = document.createElement('span');
      timeLabel.className = 'time-label';
      timeLabel.textContent = 'Time:';
      const timeValue = document.createElement('span');
      timeValue.className = 'time-value';
      timeValue.id = 'game-timer';
      timeLine.appendChild(timeLabel);
      timeLine.appendChild(timeValue);
      el.appendChild(timeLine);

      // Moves / merges / shatters
      const movesLine = document.createElement('div');
      movesLine.className = 'score-line';
      const movesLabel = document.createElement('span');
      movesLabel.className = 'score-label';
      movesLabel.textContent = 'Move #:';
      const movesValue = document.createElement('span');
      movesValue.className = 'score-value';
      movesValue.id = 'stat-move-count';
      movesValue.textContent = String(state.moveCount || 0);

      // Add boss wave counter if boss exists
      try {
        const bossWaveCount = bossHelper && bossHelper.getBossWaveCount ? bossHelper.getBossWaveCount() : 0;
        const bossExists = bossHelper && bossHelper.getBoss && bossHelper.getBoss();
        if (bossExists) {
          const waveCounter = document.createElement('span');
          waveCounter.className = 'boss-wave-counter';
          waveCounter.textContent = ' +' + bossWaveCount;
          waveCounter.style.color = '#ff4444';
          waveCounter.style.fontWeight = 'bold';
          waveCounter.style.marginLeft = '4px';
          movesValue.appendChild(waveCounter);
        }
      } catch (e) {}

      movesLine.appendChild(movesLabel);
      movesLine.appendChild(movesValue);
      el.appendChild(movesLine);

      const mergesLine = document.createElement('div');
      mergesLine.className = 'score-line';
      const mergesLabel = document.createElement('span');
      mergesLabel.className = 'score-label';
      mergesLabel.textContent = 'Total Merges:';
      const mergesValue = document.createElement('span');
      mergesValue.className = 'score-value';
      mergesValue.id = 'stat-total-merges';
      mergesValue.textContent = String(state.totalMerges || 0);
      mergesLine.appendChild(mergesLabel);
      mergesLine.appendChild(mergesValue);
      el.appendChild(mergesLine);

      const shattersLine = document.createElement('div');
      shattersLine.className = 'score-line';
      const shattersLabel = document.createElement('span');
      shattersLabel.className = 'score-label';
      shattersLabel.textContent = 'Total Shatters:';
      const shattersValue = document.createElement('span');
      shattersValue.className = 'score-value';
      shattersValue.id = 'stat-total-shatters';
      shattersValue.textContent = String(state.totalShatters || 0);
      shattersLine.appendChild(shattersLabel);
      shattersLine.appendChild(shattersValue);
      el.appendChild(shattersLine);

      const scoreLine = document.createElement('div');
      scoreLine.className = 'score-line';
      const scoreLabel = document.createElement('span');
      scoreLabel.className = 'score-label';
      scoreLabel.textContent = 'Total Shards:';
      const scoreValue = document.createElement('span');
      scoreValue.className = 'score-value';
      scoreValue.id = 'stat-score-value';
      const totalShards = Object.values(state.shardsEarned || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      scoreValue.textContent = String(totalShards || 0);
      scoreLine.appendChild(scoreLabel);
      scoreLine.appendChild(scoreValue);
      el.appendChild(scoreLine);

      try {
        ensureGameTimerPlaced();
      } catch (e) {}

      // inline shards
      try {
        const TYPE_ORDER = ['Cannon', 'Armor', 'Generator', 'Core'];
        const shardsLine = document.createElement('div');
        shardsLine.className = 'score-line';
        const shardsLabel = document.createElement('span');
        shardsLabel.className = 'score-label';
        shardsLabel.textContent = '';
        const shardsValue = document.createElement('span');
        shardsValue.className = 'score-value shards-inline';
        shardsValue.id = 'stat-shards-inline';
        TYPE_ORDER.forEach(tName => {
          const imgToken = TYPE_TOKENS[tName];
          const item = document.createElement('span');
          item.className = 'shard-item';
          const img = document.createElement('img');
          img.src = imgToken;
          img.alt = tName;
          img.width = 36;
          img.height = 36;
          img.style.borderRadius = '4px';
          const num = document.createElement('span');
          num.id = 'shard-' + tName.toLowerCase();
          num.textContent = String((state.shardsEarned && state.shardsEarned[tName]) || 0);
          num.style.fontWeight = '700';
          num.style.marginLeft = '6px';
          item.appendChild(img);
          item.appendChild(num);
          shardsValue.appendChild(item);
        });
        shardsLine.appendChild(shardsLabel);
        shardsLine.appendChild(shardsValue);
        el.appendChild(shardsLine);
      } catch (e) {}
    } catch (e) {}
  }

  return { updateScoreUI,
    ensureGameTimerPlaced };
}
