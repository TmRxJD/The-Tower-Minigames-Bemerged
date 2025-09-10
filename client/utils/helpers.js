// utils/helpers.js
// Miscellaneous utility functions

import { getChannelInfo } from '../integrations/discord.js';

/**
 * Creates a simple hash of the board state to detect changes
 * @param {Array} board - The game board array
 * @returns {string|null} Hash string or null if error
 */
export function getBoardStateHash(board) {
  try {
    return board
      .map(row =>
        row.map(cell => (cell ? `${cell.templateId}_${cell.rarity}_${!!cell.plus}_${cell.type}` : 'empty')).join('|'),
      )
      .join('||');
  } catch (e) {
    return null;
  }
}

/**
 * Injects CSS styles for hints if not already present
 */
export function ensureHintStyles() {
  if (document.getElementById('hint-styles')) {
    return;
  }
  const s = document.createElement('style');
  s.id = 'hint-styles';
  s.textContent = `
  .hint-pulse {
    animation: hintPulse 1.2s ease-in-out infinite;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .boss-pulse {
    animation: bossPulse 2.4s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(255,80,80,0.0);
    border: 2px solid rgba(255,80,80,0.0);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  @keyframes hintPulse {
    0% { box-shadow: 0 0 0 0 rgba(0,255,160,0.0); border-color: rgba(0,255,160,0.0); }
    40% { box-shadow: 0 0 12px 6px rgba(0,255,160,0.18); border-color: rgba(0,255,160,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(0,255,160,0.0); border-color: rgba(0,255,160,0.0); }
  }
  @keyframes hintPulseAlt {
    0% { box-shadow: 0 0 0 0 rgba(0,255,255,0.0); border-color: rgba(0,255,255,0.0); }
    40% { box-shadow: 0 0 12px 6px rgba(0,255,255,0.18); border-color: rgba(0,255,255,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(0,255,255,0.0); border-color: rgba(0,255,255,0.0); }
  }
  @keyframes bossPulse {
    0% { box-shadow: 0 0 0 0 rgba(255,80,80,0.0); border-color: rgba(255,80,80,0.0); }
    40% { box-shadow: 0 0 12px 6px rgba(255,80,80,0.18); border-color: rgba(255,80,80,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(255,80,80,0.0); border-color: rgba(255,80,80,0.0); }
  }
  .inv-shape { width:46px; height:46px; display:flex; align-items:center; justify-content:center; }
  .rare-plus-notch { box-shadow: 0 0 8px rgba(255,255,255,0.08); }
  `;
  document.head.appendChild(s);
}

/**
 * Appends the current voice channel name to the UI
 */
export async function appendVoiceChannelName() {
  const app = document.querySelector('#app');

  let activityChannelName = 'Unknown';

  // Use integration helper which is a no-op when not embedded or when SDK unavailable
  try {
    const info = await getChannelInfo();
    if (info && info.channel && info.channel.name) {
      activityChannelName = info.channel.name;
    }
  } catch (e) {
    /* ignore */
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}
