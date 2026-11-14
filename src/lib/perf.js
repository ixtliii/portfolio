// ─────────────────────────────────────────────────────────
// Device hints + a performance tier shared by every animated bit.
//
// Tier "low" is set up front from hardware hints (few cores, little
// memory, data saver, reduced motion) and later at runtime if frames
// keep running long. It only ever steps down, never back up, so
// nothing flickers between modes. In "low":
//   • canvases render at 1× pixel ratio
//   • decorative loops run at half rate (or freeze)
//   • CSS ambient animations and blurs switch off (html[data-perf="low"])
// ─────────────────────────────────────────────────────────
import { gsap } from 'gsap'

const mq = (q) => typeof window !== 'undefined' && window.matchMedia?.(q).matches

export const isTouch = () => mq('(pointer: coarse)')
export const isSmall = () => mq('(max-width: 700px)')
export const reducedMotion = () => mq('(prefers-reduced-motion: reduce)')

function hintLow() {
    if (typeof navigator === 'undefined') return false
    const cores = navigator.hardwareConcurrency || 8
    const mem = navigator.deviceMemory || 8          // Chromium only; others report nothing
    const save = navigator.connection?.saveData
    return reducedMotion() || save || mem <= 4 || cores <= 4
}

let low = hintLow()
const listeners = new Set()
const apply = () => { if (typeof document !== 'undefined') document.documentElement.dataset.perf = low ? 'low' : 'high' }
apply()

/** true on devices that should get the light version of every effect */
export const isLowPower = () => low

/** subscribe to the switch to "low"; returns an unsubscribe fn */
export function onPerfChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

function setLow() {
    if (low) return
    low = true
    apply()
    listeners.forEach(fn => fn(low))
    window.dispatchEvent(new CustomEvent('perfchange', { detail: { low } }))
}

/** device-pixel-ratio cap: 2 on desktop, 1.5 on phones / touch, 1 on low-power */
export const maxDpr = () => low ? 1 : Math.min(window.devicePixelRatio || 1, isTouch() || isSmall() ? 1.5 : 2)

/** minimum ms between frames for a decorative loop: doubled on low-power */
export const frameGap = (ms) => (low ? ms * 2 : ms)

/** blur for an entrance tween, or nothing on low-power (blur is the priciest thing to animate) */
export const blur = (px) => (low ? {} : { filter: `blur(${px}px)` })

// runtime watch: ~1.5s windows of frame times; two slow windows in a row → low.
// Long gaps (tab hidden, debugger, route swap) are skipped.
if (typeof window !== 'undefined' && !low) {
    let sum = 0, n = 0, strikes = 0
    const watch = (_t, dt) => {
        if (document.hidden || dt > 250) return
        sum += dt; n++
        if (n < 90) return
        const avg = sum / n
        sum = 0; n = 0
        strikes = avg > 24 ? strikes + 1 : 0          // under ~40fps on average
        if (strikes >= 2) { gsap.ticker.remove(watch); setLow() }
    }
    // start once the intro has handed over, so its one-off setup doesn't count
    const start = () => gsap.ticker.add(watch)
    if (document.documentElement.dataset.intro === 'done') start()
    else {
        const onPhase = (e) => { if (e.detail?.phase === 'done') { window.removeEventListener('introphase', onPhase); setTimeout(start, 600) } }
        window.addEventListener('introphase', onPhase)
    }
}
