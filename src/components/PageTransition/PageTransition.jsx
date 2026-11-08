import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import './PageTransition.css'

/* ─────────────────────────────────────────────────────────
   Between pages the screen dissolves into ordered-dither
   pixels (same language as the mascot and the blocks): they
   spread out from the helper's corner, with a darker
   dithered front, cover the page, the route swaps, and they
   clear away again in the same order. The helper sits above
   the overlay, so it "carries" you across.
   ───────────────────────────────────────────────────────── */

const CELL = 12          // px per pixel-cell
const FRONT = 0.025      // width of the dark leading edge (in threshold units)

// 8×8 Bayer matrix value at (x, y), 0…1
function bayer8(x, y) {
    let v = 0
    for (let bit = 0; bit < 3; bit++) {
        const xb = (x >> bit) & 1, yb = (y >> bit) & 1
        v |= ((xb ^ yb) << (2 * (2 - bit) + 1)) | (yb << (2 * (2 - bit)))
    }
    return v / 64
}

const css = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb

export default function PageTransition() {
    const canvasRef = useRef(null)
    const busy = useRef(false)
    const ours = useRef(false)          // did we start the current route change?
    const grid = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()
    const first = useRef(true)

    const build = () => {
        const c = canvasRef.current
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = window.innerWidth, h = window.innerHeight
        c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
        c.style.width = w + 'px'; c.style.height = h + 'px'
        const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL)
        const thr = new Float32Array(cols * rows)
        const maxD = Math.hypot(cols, rows)
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            // distance from the bottom-right (the helper) + dither + a bit of noise
            const d = Math.hypot(cols - x, rows - y) / maxD
            thr[y * cols + x] = d * 0.8 + bayer8(x & 7, y & 7) * 0.16 + Math.random() * 0.04
        }
        grid.current = { cols, rows, thr, dpr }
    }

    // p 0…1.1; cover: cells below p are filled; reveal: cells above p stay filled
    const draw = (p, mode) => {
        const c = canvasRef.current, g = grid.current
        if (!c || !g) return
        const ctx = c.getContext('2d')
        const s = CELL * g.dpr
        ctx.clearRect(0, 0, c.width, c.height)
        const fill = new Path2D(), front = new Path2D()
        for (let i = 0; i < g.thr.length; i++) {
            const t = g.thr[i]
            const on = mode === 'cover' ? t < p : t >= p
            if (!on) continue
            const x = (i % g.cols) * s, y = Math.floor(i / g.cols) * s
            // round dots, like the rest of the site's dither; they grow to fill as the sweep passes
            const path = Math.abs(t - p) < FRONT ? front : fill
            const r = s * (mode === 'cover' ? Math.min(0.72, 0.42 + (p - t) * 3) : Math.min(0.72, 0.42 + (t - p) * 3))
            path.moveTo(x + s / 2 + r, y + s / 2)
            path.arc(x + s / 2, y + s / 2, r, 0, Math.PI * 2)
        }
        ctx.fillStyle = css('--sh-bg-b', '#e4e4e7')
        ctx.fill(fill)
        ctx.fillStyle = css('--sh-icon', '#85858b')
        ctx.fill(front)
    }

    const run = (state, to, mode, dur) => new Promise(res => {
        gsap.to(state, { p: to, duration: dur, ease: 'power2.inOut', onUpdate: () => draw(state.p, mode), onComplete: res })
    })

    const reveal = async () => {
        const c = canvasRef.current
        const st = { p: 0 }
        c.style.visibility = 'visible'
        draw(0, 'reveal')
        await new Promise(r => setTimeout(r, 220))           // let the new page lay out
        await run(st, 1.15, 'reveal', 1.15)
        c.style.visibility = 'hidden'
        busy.current = false
    }

    useEffect(() => {
        build()
        if (import.meta.env.DEV) window.__pt = { draw: (p, m) => { canvasRef.current.style.visibility = 'visible'; draw(p, m) } }   // dev only: inspect a frame
        const onResize = () => build()
        const onGo = async (e) => {
            const path = e.detail?.path
            if (!path || busy.current) return
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            if (reduce) { navigate(path); return }
            busy.current = true
            ours.current = true
            build()
            const c = canvasRef.current
            c.style.visibility = 'visible'
            await run({ p: 0 }, 1.15, 'cover', 1.0)
            navigate(path)
        }
        window.addEventListener('resize', onResize)
        window.addEventListener('pagego', onGo)
        return () => { window.removeEventListener('resize', onResize); window.removeEventListener('pagego', onGo) }
    }, [navigate])

    // route changed: reveal (also for back/forward, which skip the cover)
    useEffect(() => {
        if (first.current) { first.current = false; return }
        if (!ours.current && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        ours.current = false
        busy.current = true
        reveal()
    }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    return <canvas ref={canvasRef} className="pt-canvas" aria-hidden />
}
