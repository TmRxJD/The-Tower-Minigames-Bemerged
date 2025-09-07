// client/utils/random.js
// Small helpers for random utilities used across the client.
export function rand() {
  return Math.random();
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
