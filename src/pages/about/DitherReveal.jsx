import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─────────────────────────────────────────────────────────
// Covers its parent with round dots in the card colour, then
// dissolves them when scrolled into view: each dot shrinks away on
// its own 4×4 Bayer threshold, swept from the lower-left corner,
// the same ordered dither the rest of the site uses.
// ─────────────────────────────────────────────────────────
const CELL = 8
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 15)

export default function DitherReveal({ delay = 0 }) {
    const ref = useRef(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const st = { p: 0 }
        let W = 0, H = 0, color = '#fff'

        const size = () => {
            const r = canvas.parentElement.getBoundingClientRect()
            W = r.width; H = r.height
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
            color = getComputedStyle(canvas).getPropertyValue('--dr-color').trim() || '#fff'
        }
        const draw = () => {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL)
            const R = CELL * 0.74                      // big enough that full dots cover everything
            const p = st.p * 1.3 - 0.15
            const path = new Path2D()
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const sweep = (x / cols + (1 - y / rows)) * 0.5            // lower-left first
                    const thr = sweep * 0.6 + BAYER[(y & 3) * 4 + (x & 3)] * 0.4
                    const k = Math.min(1, Math.max(0, (thr - p) / 0.14))
                    if (k <= 0.02) continue
                    const r = R * k
                    const cx = x * CELL + CELL / 2, cy = y * CELL + CELL / 2
                    path.moveTo(cx + r, cy)
                    path.arc(cx, cy, r, 0, Math.PI * 2)
                }
            }
            ctx.fillStyle = color
            ctx.fill(path)
        }

        size(); draw()
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const done = () => { canvas.style.display = 'none' }
        const trigger = ScrollTrigger.create({
            trigger: canvas.parentElement, start: 'top 80%', once: true,
            onEnter: () => {
                if (reduce) return done()
                size()
                gsap.to(st, { p: 1, duration: 1.5, delay: 0.3 + delay, ease: 'power1.inOut', onUpdate: draw, onComplete: done })
            },
        })
        const ro = new ResizeObserver(() => { if (st.p < 1) { size(); draw() } })
        ro.observe(canvas.parentElement)
        return () => { trigger.kill(); ro.disconnect(); gsap.killTweensOf(st) }
    }, [delay])

    return <canvas ref={ref} className="ab-dither-reveal" aria-hidden />
}
