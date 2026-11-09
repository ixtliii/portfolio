import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─────────────────────────────────────────────────────────
// Quiet dotted backdrops, same ordered dither + round dots as the
// clouds in "Kind words", so the page reads as one sky:
//   waves · layered swells rolling low behind the bio
//   sun   · a striped sun that rises behind "Your turn." as you arrive
// A density is computed per dot cell and compared to a 4×4 Bayer
// threshold. ~24fps, only while on screen.
// ─────────────────────────────────────────────────────────
const CELL = 7
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

const FIELDS = {
    // rolling wave lines: five crests drifting at their own pace, thicker and denser toward the bottom
    waves(x, y, W, H, t) {
        let v = 0
        for (let k = 0; k < 5; k++) {
            const base = H * (0.34 + k * 0.12)
            const crest = base
                + Math.sin(x / (190 - k * 14) + t * (0.45 + k * 0.08) + k * 1.9) * (28 + k * 4)
                + Math.sin(x / 75 + t * (0.8 + k * 0.06) + k * 0.7) * 5
            const w = 7 + k * 2.5
            const line = Math.exp(-Math.pow((y - crest) / w, 2))
            const wash = sstep(crest, crest + 60, y) * (1 - sstep(crest + 60, crest + 140, y)) * 0.18   // a little spray below
            v = Math.max(v, line * (0.55 + k * 0.1), wash)
        }
        return v
    },
    // a big striped sun; `rise` (0…1) lifts it from below the fold to behind the heading
    sun(x, y, W, H, t, rise) {
        const R = Math.min(W * 0.34, H * 0.42)
        const cx = W / 2, cy = H * (1.05 - 0.5 * rise)
        const d = Math.hypot(x - cx, y - cy)
        let v = 0
        if (d < R) {
            const u = (y - (cy - R)) / (2 * R)                         // 0 top … 1 bottom
            v = 0.85 - 0.35 * u
            // retro stripes cut through the lower half, thickening downwards, drifting slowly
            if (u > 0.42) {
                const s = (u - 0.42) / 0.58
                const period = 26 - s * 8
                const gap = 0.12 + s * 0.42
                if (((y + t * 6) / period) % 1 < gap) v = 0
            }
            v *= sstep(R, R - 10, d)
        }
        // a faint halo around it
        v = Math.max(v, 0.22 * Math.exp(-Math.max(0, d - R) / 70) * (d >= R ? 1 : 0))
        return v
    },
}

export default function Ambient({ kind }) {
    const ref = useRef(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const field = FIELDS[kind]
        let W = 0, H = 0, color = '#fff', visible = false, acc = 0
        const st = { rise: 0 }

        const readColor = () => { color = getComputedStyle(canvas).getPropertyValue('--ab-cloud').trim() || '#fff' }
        const resize = () => {
            const r = canvas.getBoundingClientRect()
            W = r.width; H = r.height
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
        }
        const draw = (t) => {
            if (!W || !H) return
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL)
            const big = new Path2D(), small = new Path2D()
            const R = CELL * 0.36
            for (let j = 0; j < rows; j++) {
                const y = j * CELL + CELL / 2
                for (let i = 0; i < cols; i++) {
                    const x = i * CELL + CELL / 2
                    const v = field(x, y, W, H, t, st.rise)
                    if (v < 0.05 || v <= BAYER[(j & 3) * 4 + (i & 3)]) continue
                    const p = v > 0.6 ? big : small
                    const r = v > 0.6 ? R : R * 0.72
                    p.moveTo(x + r, y)
                    p.arc(x, y, r, 0, Math.PI * 2)
                }
            }
            ctx.fillStyle = color
            ctx.globalAlpha = 0.9; ctx.fill(big)
            ctx.globalAlpha = 0.6; ctx.fill(small)
            ctx.globalAlpha = 1
        }

        readColor(); resize(); draw(0)
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const loop = (time, dt) => {
            if (!visible) return
            acc += dt
            if (acc < 42) return
            acc = 0
            draw(reduce ? 0 : time)
        }
        // the sun rises with the scroll as the section arrives
        const trig = kind === 'sun' ? ScrollTrigger.create({
            trigger: canvas.parentElement, start: 'top bottom', end: 'center center', scrub: true,
            onUpdate: (self) => { st.rise = self.progress },
        }) : null
        const ro = new ResizeObserver(() => { resize(); draw(0) })
        ro.observe(canvas)
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(canvas)
        const onTheme = () => requestAnimationFrame(() => { readColor(); draw(0) })
        window.addEventListener('themechange', onTheme)
        gsap.ticker.add(loop)
        return () => {
            gsap.ticker.remove(loop)
            trig?.kill(); ro.disconnect(); io.disconnect()
            window.removeEventListener('themechange', onTheme)
        }
    }, [kind])

    return <canvas className={`ab-ambient ab-ambient--${kind}`} ref={ref} aria-hidden />
}
