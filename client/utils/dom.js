// Tiny DOM helpers: createEl(tag, props, styles) and setStyle(el, styles)
export function createEl(tag = 'div', props = {}, styles = {}) {
  const el = document.createElement(tag);
  if (props && typeof props === 'object') {
    for (const k of Object.keys(props)) {
      try { el[k] = props[k]; } catch (e) {}
    }
  }
  setStyle(el, styles);
  return el;
}

export function setStyle(el, styles = {}) {
  if (!el || !styles) return;
  for (const k of Object.keys(styles)) {
    try { el.style[k] = styles[k]; } catch (e) {}
  }
}
