// ─────────────────────────────────────────────────────────
// Device hints shared by the WebGL bits, so phones don't
// render more pixels than they can afford.
// ─────────────────────────────────────────────────────────
const mq = (q) => typeof window !== 'undefined' && window.matchMedia?.(q).matches

export const isTouch = () => mq('(pointer: coarse)')
export const isSmall = () => mq('(max-width: 700px)')

/** device-pixel-ratio cap: 2 on desktop, 1.5 on phones / touch */
export const maxDpr = () => Math.min(window.devicePixelRatio || 1, isTouch() || isSmall() ? 1.5 : 2)
