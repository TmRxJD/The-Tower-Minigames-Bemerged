// integrations/discord.js
// Runtime detection + dynamic import wrapper for the Discord Embedded App SDK.
// Exports:
//  - initDiscordIfEmbedded(): initializes the SDK if available (no-op if not)
//  - getChannelInfo(): returns { channel, channelId, guildId, auth } or null when unavailable
// When the SDK or embedded environment is not present, both functions behave as safe no-ops.

let _sdk = null;
let _auth = null;
let _embedded = false;
let _initPromise = null;

export async function initDiscordIfEmbedded() {
  if (typeof window === 'undefined') return false;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      // Attempt to dynamically import the SDK. If the import or initialization fails,
      // treat the environment as non-embedded and resolve gracefully.
      const mod = await import('@discord/embedded-app-sdk');
      const DiscordSDK = mod && mod.DiscordSDK ? mod.DiscordSDK : null;
      if (!DiscordSDK) throw new Error('DiscordSDK not found in dynamic import');

      // Use Vite's import.meta.env when available; otherwise allow undefined client id.
      let clientId = undefined;
      try {
        // import.meta is available in ESM environments (Vite). Use try/catch to avoid runtime errors.
        clientId = import.meta && import.meta.env ? import.meta.env.VITE_DISCORD_CLIENT_ID : undefined;
      } catch (e) {
        // Fallback: allow an app to set a global if needed for testing in non-Vite environments
        try { clientId = window && window.__VITE_DISCORD_CLIENT_ID__ ? window.__VITE_DISCORD_CLIENT_ID__ : undefined; } catch (ee) { clientId = undefined; }
      }

      _sdk = new DiscordSDK(clientId);
      await _sdk.ready();

      // Ask Discord to authorize silently (prompt: none). If this environment isn't
      // an embedded app or authorization isn't available, the authorize call may
      // still return but token exchange or authenticate may fail — handle gracefully.
      const { code } = await _sdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify', 'guilds', 'applications.commands'],
      });

      // Exchange code with backend for access token (server must implement /api/token)
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      const access_token = body && body.access_token ? body.access_token : null;
      if (access_token) {
        _auth = await _sdk.commands.authenticate({ access_token });
      }
      _embedded = true;
      return true;
    } catch (err) {
      // Not embedded, or the SDK isn't available at runtime — reset state and return false.
      try { _sdk = null; _auth = null; _embedded = false; } catch (e) {}
      return false;
    }
  })();

  return _initPromise;
}

export async function getChannelInfo() {
  if (!_sdk) return null;
  try {
    // When the app is running in a GDM (no guildId) the DM scope may be required.
    if (_sdk.channelId != null && _sdk.guildId != null) {
      const channel = await _sdk.commands.getChannel({ channel_id: _sdk.channelId });
      return { channel, channelId: _sdk.channelId, guildId: _sdk.guildId, auth: _auth };
    }
    // If there's a channelId but no guildId (DM/GDM) attempt to fetch as well — may require extra scope.
    if (_sdk.channelId != null) {
      try {
        const channel = await _sdk.commands.getChannel({ channel_id: _sdk.channelId });
        return { channel, channelId: _sdk.channelId, guildId: _sdk.guildId, auth: _auth };
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  return null;
}

export function isEmbedded() { return !!_embedded; }
