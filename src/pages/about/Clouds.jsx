import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// ─────────────────────────────────────────────────────────
// Slow, subtle clouds in round dither dots.
// Each cloud is a cluster of soft puffs drawn into a tiny density
// canvas; every cell then becomes a dot where the density beats a
// 4×4 Bayer threshold, the same ordered dither as the rest of the site.
// ~30fps, only while on screen.
// ─────────────────────────────────────────────────────────
const CELL = 7
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)

// A cumulus: a flat, wide base with a row of round puffs on top,
// biggest in the middle - the shape a kid would draw, which is what reads as "cloud".
// A cumulus: round puffs of different sizes sitting on a flat base,
// tallest near the middle. Lit from above: dense tops, thinner undersides.
function makeCloud(W, H, x) {
    const s = 0.9 + Math.random() * 0.8
    const w = (320 + Math.random() * 180) * s               // width of the flat base
    const count = 4 + Math.floor(Math.random() * 2)
    const puffs = []
    for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const hump = Math.sin(t * Math.PI)
        const r = w * (0.09 + 0.17 * hump) * (0.85 + Math.random() * 0.3)
        // puffs sit ON the base: their bottoms touch it, so the tops make the bumpy outline
        puffs.push({ dx: (t - 0.5) * w * 0.74 + (Math.random() - 0.5) * w * 0.05, dy: -r * 0.55, r })
    }
    // a couple of small puffs riding on top of the big ones for a lumpier crown
    for (let k = 0; k < 2; k++) {
        const host = puffs[1 + Math.floor(Math.random() * (count - 2))]
        const r = host.r * (0.5 + Math.random() * 0.2)
        puffs.push({ dx: host.dx + (Math.random() - 0.5) * host.r, dy: host.dy - host.r * 0.62, r })
    }
    const top = Math.min(...puffs.map(p => p.dy - p.r))
    return {
        x: x ?? Math.random() * W,
        y: H * (0.18 + Math.random() * 0.75),
        v: 24 + Math.random() * 18 + s * 8,                  // px per second
        a: 0.8 + Math.random() * 0.2,
        w, puffs, top, base: w * 0.11,
    }
}

export default function Clouds() {
    const ref = useRef(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas.getContext('2d')
        const den = document.createElement('canvas')
        const dctx = den.getContext('2d', { willReadFrequently: true })
        const scratch = document.createElement('canvas')
        const sctx = scratch.getContext('2d')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        let W = 0, H = 0, cols = 0, rows = 0, clouds = []
        let color = '#ffffff', visible = false, acc = 0

        const readColor = () => {
            color = getComputedStyle(canvas).getPropertyValue('--ab-cloud').trim() || '#ffffff'
        }
        const resize = () => {
            const r = canvas.getBoundingClientRect()
            W = r.width; H = r.height
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
            cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL)
            den.width = cols; den.height = rows
            const n = Math.max(3, Math.round(W / 420))
            clouds = Array.from({ length: n }, (_, i) => {
                const c = makeCloud(W, H, (i / n) * (W + 500) - 250 + (Math.random() - 0.5) * 120)
                c.y = H * (i % 2 ? 0.62 + Math.random() * 0.25 : 0.2 + Math.random() * 0.22)   // alternate high / low so they don't pile up
                return c
            })
        }

        const draw = () => {
            if (!cols || !rows) return
            // density: soft white puffs on black, at one pixel per dot
            dctx.globalCompositeOperation = 'source-over'
            dctx.fillStyle = '#000'
            dctx.fillRect(0, 0, cols, rows)
            dctx.globalCompositeOperation = 'lighten'      // max, not sum: overlapping clouds keep their shapes
            for (const c of clouds) {
                const pad = 2
                const cw = Math.ceil((c.w * 1.05) / CELL) + pad * 2
                const ch = Math.ceil((-c.top + c.base) / CELL) + pad * 2
                if (scratch.width < cw) scratch.width = cw
                if (scratch.height < ch) scratch.height = ch
                sctx.globalCompositeOperation = 'source-over'
                sctx.clearRect(0, 0, scratch.width, scratch.height)
                const ox = cw / 2, oy = pad - c.top / CELL           // cloud origin (base line) in scratch px
                sctx.globalCompositeOperation = 'lighten'
                // flat base slab
                const bw = c.w / CELL / 2, bh = c.base / CELL
                const bg = sctx.createLinearGradient(0, oy - bh, 0, oy + bh)
                bg.addColorStop(0, `rgba(255,255,255,${c.a * 0.75})`)
                bg.addColorStop(1, `rgba(255,255,255,${c.a * 0.35})`)
                sctx.fillStyle = bg
                sctx.beginPath()
                sctx.roundRect(ox - bw, oy - bh, bw * 2, bh * 2, bh)
                sctx.fill()
                // puffs, lit from the top
                for (const p of c.puffs) {
                    const x = ox + p.dx / CELL, y = oy + p.dy / CELL, r = p.r / CELL
                    const g = sctx.createRadialGradient(x - r * 0.15, y - r * 0.35, 0, x, y, r)
                    g.addColorStop(0, `rgba(255,255,255,${c.a})`)
                    g.addColorStop(0.6, `rgba(255,255,255,${c.a * 0.8})`)
                    g.addColorStop(0.93, `rgba(255,255,255,${c.a * 0.55})`)
                    g.addColorStop(1, 'rgba(255,255,255,0.02)')
                    sctx.fillStyle = g
                    sctx.beginPath(); sctx.arc(x, y, r, 0, Math.PI * 2); sctx.fill()
                }
                // cut a clean flat underside
                sctx.globalCompositeOperation = 'destination-out'
                sctx.fillStyle = '#000'
                sctx.fillRect(0, oy + bh * 0.6, scratch.width, scratch.height)
                dctx.drawImage(scratch, 0, 0, cw, ch, c.x / CELL - ox, c.y / CELL - oy, cw, ch)
            }
            const d = dctx.getImageData(0, 0, cols, rows).data
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const big = new Path2D(), small = new Path2D()
            const R = CELL * 0.36
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const v = d[(y * cols + x) * 4] / 255
                    if (v < 0.1) continue
                    const th = BAYER[(y & 3) * 4 + (x & 3)]
                    if (v > th) {
                        const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2
                        const p = v > 0.6 ? big : small
                        const r = v > 0.6 ? R : R * 0.72
                        p.moveTo(px + r, py)
                        p.arc(px, py, r, 0, Math.PI * 2)
                    }
                }
            }
            ctx.fillStyle = color
            ctx.globalAlpha = 0.9
            ctx.fill(big)
            ctx.globalAlpha = 0.6
            ctx.fill(small)
            ctx.globalAlpha = 1
        }

        const loop = (_t, dt) => {
            if (!visible) return
            const s = dt / 1000
            for (const c of clouds) {
                c.x += c.v * s
                if (c.x - c.w > W + 60) Object.assign(c, makeCloud(W, H, -c.w * 0.7 - 60))
            }
            acc += dt
            if (acc < 40) return          // ~25fps is plenty for drifting clouds
            acc = 0
            draw()
        }

        readColor()
        resize()
        draw()
        const ro = new ResizeObserver(() => { resize(); draw() })
        ro.observe(canvas)
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(canvas)
        const onTheme = () => requestAnimationFrame(() => { readColor(); draw() })
        window.addEventListener('themechange', onTheme)
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!reduce) gsap.ticker.add(loop)
        return () => {
            gsap.ticker.remove(loop)
            ro.disconnect(); io.disconnect()
            window.removeEventListener('themechange', onTheme)
        }
    }, [])

    return <canvas className="ab-clouds" ref={ref} aria-hidden />
}
