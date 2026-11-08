// ─────────────────────────────────────────────────────────
// Smooth scrolling (Lenis) for the shell's content box.
//
// The page itself never scrolls: everything lives inside the
// bottom-right box of the shell (see components/Shell). That
// box is the scroller for Lenis and for every ScrollTrigger.
//
// Use the helpers below instead of window.scroll* so all
// scrolling goes through the same element and smoothing.
// ─────────────────────────────────────────────────────────
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis = null
let scroller = null
let tickerFn = null

/** Called by the shell (ref callback) before any child effect runs. */
export function initScroll(wrapper, content) {
    if (!wrapper) return null
    if (scroller === wrapper && (lenis || !content)) return lenis
    destroyScroll()

    scroller = wrapper
    // every ScrollTrigger in the app measures against the box, not the window
    ScrollTrigger.defaults({ scroller: wrapper })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

    lenis = new Lenis({ wrapper, content, lerp: 0.085, wheelMultiplier: 1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    tickerFn = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)
    return lenis
}

export function destroyScroll() {
    if (tickerFn) gsap.ticker.remove(tickerFn)
    lenis?.destroy()
    lenis = null
    tickerFn = null
}

export const getLenis = () => lenis
export const getScroller = () => scroller || document.scrollingElement

/** current scroll offset of the box */
export const getScrollTop = () => (lenis ? lenis.scroll : getScroller().scrollTop)

/** visible height of the box */
export const getViewportHeight = () => getScroller().clientHeight || window.innerHeight

/** an element's offset from the top of the scrollable content */
export function offsetTopOf(el) {
    const s = getScroller()
    return el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop
}

/** an element's top relative to the visible top of the box */
export function topInView(el) {
    return el.getBoundingClientRect().top - getScroller().getBoundingClientRect().top
}

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function scrollToY(y, { duration = 1.1, immediate = false } = {}) {
    if (lenis) lenis.scrollTo(y, { duration, immediate, easing: easeOutExpo, force: true })
    else getScroller().scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' })
}

export function scrollToEl(el, opts = {}) {
    if (!el) return
    if (lenis) lenis.scrollTo(el, { duration: 1.2, easing: easeOutExpo, force: true, ...opts })
    else getScroller().scrollTo({ top: offsetTopOf(el) + (opts.offset || 0), behavior: 'smooth' })
}

/** subscribe to scroll of the box; returns an unsubscribe fn */
export function onScroll(fn) {
    if (lenis) {
        lenis.on('scroll', fn)
        return () => lenis?.off('scroll', fn)
    }
    const s = getScroller()
    s.addEventListener('scroll', fn, { passive: true })
    return () => s.removeEventListener('scroll', fn)
}
