import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { maxDpr, isLowPower, onPerfChange, reducedMotion } from '../../lib/perf'

// ─────────────────────────────────────────────────────────
// Quiet dotted backdrops, same ordered dither + round dots as the
// clouds in "Kind words", so the page reads as one sky:
//   waves · layered swells rolling low behind the bio
//   sun   · a striped sun that rises behind "Your turn." as you arrive
// A density is computed per dot cell and compared to a 4×4 Bayer
// threshold. ~24fps, only while on screen; still on low-power devices.
// ─────────────────────────────────────────────────────────
const CELL = 7
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// Each field fills `out` (one value per cell, column-major: out[i * rows + j]) and only
// visits the cells it can actually light, instead of evaluating every cell of the canvas.
const FIELDS = {
    // rolling wave lines: five crests drifting at their own pace, thicker and denser toward the bottom.
    // A crest only depends on x, so it's computed once per column, not once per dot.
    waves(out, cols, rows, W, H, t) {
        out.fill(0)
        for (let i = 0; i < cols; i++) {
            const x = i * CELL + CELL / 2, o = i * rows
            for (let k = 0; k < 5; k++) {
                const crest = H * (0.34 + k * 0.12)
                    + Math.sin(x / (190 - k * 14) + t * (0.45 + k * 0.08) + k * 1.9) * (28 + k * 4)
                    + Math.sin(x / 75 + t * (0.8 + k * 0.06) + k * 0.7) * 5
                const w = 7 + k * 2.5, amp = 0.55 + k * 0.1
                // the line is invisible past ~2 widths; the spray runs 140px below the crest
                const j0 = Math.max(0, Math.floor((crest - 2 * w) / CELL))
                const j1 = Math.min(rows - 1, Math.ceil((crest + 140) / CELL))
                for (let j = j0; j <= j1; j++) {
                    const y = j * CELL + CELL / 2, dy = (y - crest) / w
                    const line = dy < 2 && dy > -2 ? Math.exp(-dy * dy) * amp : 0
                    const wash = y > crest ? sstep(crest, crest + 60, y) * (1 - sstep(crest + 60, crest + 140, y)) * 0.18 : 0
                    const v = line > wash ? line : wash
                    if (v > out[o + j]) out[o + j] = v
                }
            }
        }
    },
    // a big striped sun; `rise` (0…1) lifts it from below the fold to behind the heading
    sun(out, cols, rows, W, H, t, rise) {
        out.fill(0)
        const R = Math.min(W * 0.34, H * 0.42)
        const cx = W / 2, cy = H * (1.05 - 0.5 * rise)
        const reach = R + 110                                   // the halo fades out by here
        const i0 = Math.max(0, Math.floor((cx - reach) / CELL)), i1 = Math.min(cols - 1, Math.ceil((cx + reach) / CELL))
        const j0 = Math.max(0, Math.floor((cy - reach) / CELL)), j1 = Math.min(rows - 1, Math.ceil((cy + reach) / CELL))
        for (let i = i0; i <= i1; i++) {
            const x = i * CELL + CELL / 2, o = i * rows
            for (let j = j0; j <= j1; j++) {
                const y = j * CELL + CELL / 2
                const d = Math.hypot(x - cx, y - cy)
                let v = 0
                if (d < R) {
                    const u = (y - (cy - R)) / (2 * R)                 // 0 top … 1 bottom
                    v = 0.85 - 0.35 * u
                    // retro stripes cut through the lower half, thickening downwards, drifting slowly
                    if (u > 0.42) {
                        const s = (u - 0.42) / 0.58
                        const period = 26 - s * 8
                        const gap = 0.12 + s * 0.42
                        if (((y + t * 6) / period) % 1 < gap) v = 0
                    }
                    v *= sstep(R, R - 10, d)
                } else {
                    v = 0.22 * Math.exp(-(d - R) / 70)                 // a faint halo around it
                }
                out[o + j] = v
            }
        }
    },
}

export default function Ambient({ kind }) {
    const ref = useRef(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas.getContext('2d')
        const field = FIELDS[kind]
        let W = 0, H = 0, cols = 0, rows = 0, dpr = 1, color = '#fff', visible = false, acc = 0
        let vals = new Float32Array(0)
        const st = { rise: 0, drawnRise: -1 }

        const readColor = () => { color = getComputedStyle(canvas).getPropertyValue('--ab-cloud').trim() || '#fff' }
        const resize = () => {
            const r = canvas.getBoundingClientRect()
            dpr = maxDpr()
            W = r.width; H = r.height
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
            cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL)
            if (vals.length !== cols * rows) vals = new Float32Array(cols * rows)
        }
        const draw = (t) => {
            if (!W || !H) return
            field(vals, cols, rows, W, H, t, st.rise)
            st.drawnRise = st.rise
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const big = new Path2D(), small = new Path2D()
            const R = CELL * 0.36, r2 = R * 0.72
            for (let i = 0; i < cols; i++) {
                const x = i * CELL + CELL / 2, o = i * rows, bi = i & 3
                for (let j = 0; j < rows; j++) {
                    const v = vals[o + j]
                    if (v < 0.05 || v <= BAYER[(j & 3) * 4 + bi]) continue
                    const y = j * CELL + CELL / 2
                    if (v > 0.6) { big.moveTo(x + R, y); big.arc(x, y, R, 0, Math.PI * 2) }
                    else { small.moveTo(x + r2, y); small.arc(x, y, r2, 0, Math.PI * 2) }
                }
            }
            ctx.fillStyle = color
            ctx.globalAlpha = 0.9; ctx.fill(big)
            ctx.globalAlpha = 0.6; ctx.fill(small)
            ctx.globalAlpha = 1
        }

        readColor(); resize(); draw(0)
        const reduce = reducedMotion()
        let frozenAt = 0
        const loop = (time, dt) => {
            if (!visible) return
            acc += dt
            if (acc < 42) return          // ~24fps: the dots step anyway, more frames buy nothing
            acc = 0
            // low-power / reduced motion: hold the drift still, only follow the sun's scroll-linked rise
            if (reduce || isLowPower()) {
                if (st.rise !== st.drawnRise) draw(frozenAt)
                return
            }
            frozenAt = time
            draw(time)
        }
        // the sun rises with the scroll as the section arrives
        const trig = kind === 'sun' ? ScrollTrigger.create({
            trigger: canvas.parentElement, start: 'top bottom', end: 'center center', scrub: true,
            onUpdate: (self) => { st.rise = self.progress },
        }) : null
        const ro = new ResizeObserver(() => { resize(); draw(frozenAt) })
        ro.observe(canvas)
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(canvas)
        const onTheme = () => requestAnimationFrame(() => { readColor(); draw(frozenAt) })
        window.addEventListener('themechange', onTheme)
        const offPerf = onPerfChange(() => { resize(); draw(frozenAt) })
        gsap.ticker.add(loop)
        return () => {
            gsap.ticker.remove(loop)
            trig?.kill(); ro.disconnect(); io.disconnect(); offPerf()
            window.removeEventListener('themechange', onTheme)
        }
    }, [kind])

    return <canvas className={`ab-ambient ab-ambient--${kind}`} ref={ref} aria-hidden />
}
