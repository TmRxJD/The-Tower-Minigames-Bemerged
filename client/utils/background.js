// utils/background.js
// Background management utilities

import { BACKGROUNDS } from '../assets/backgrounds.js';

/**
 * Applies a background style to the document body and persists the choice in localStorage.
 * @param {string} bgKey - The background key from BACKGROUNDS map, or empty string for none
 */
export function applyBackground(bgKey) {
  try {
    const bgSrc = bgKey ? BACKGROUNDS[bgKey] : null;
    if (bgSrc) {
      // Apply to html element for full viewport coverage
      const html = document.documentElement;
      const body = document.body;

      // Ensure html and body take full viewport height
      html.style.height = '100%';
      html.style.minHeight = '100vh';
      body.style.height = '100%';
      body.style.minHeight = '100vh';

      // Apply background to html element
      html.style.backgroundImage = `url(${bgSrc})`;
      html.style.backgroundSize = 'cover';
      html.style.backgroundPosition = 'center center';
      html.style.backgroundRepeat = 'no-repeat';
      html.style.backgroundAttachment = 'fixed';

      // Clear any background from body to avoid conflicts
      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';
    } else {
      // Clear background
      const html = document.documentElement;
      const body = document.body;

      html.style.backgroundImage = '';
      html.style.backgroundSize = '';
      html.style.backgroundPosition = '';
      html.style.backgroundRepeat = '';
      html.style.backgroundAttachment = '';
      html.style.height = '';
      html.style.minHeight = '';

      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';
      body.style.height = '';
      body.style.minHeight = '';
    }
    try {
      localStorage.setItem('background', bgKey || '');
    } catch (e) {}
  } catch (e) {
    // Fallback: apply to document.body if available
    try {
      if (document && document.body) {
        document.body.style.backgroundImage = bgKey ? `url(${BACKGROUNDS[bgKey]})` : '';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      }
    } catch (ee) {}
  }
}
