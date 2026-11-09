import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { isTouch } from '../../lib/perf'

// ─────────────────────────────────────────────────────────
// Halftone portrait: the photo as round ink dots on a pastel card.
//  • dots grow in on a diagonal sweep
//  • the cursor is a lens: dots under it swell and part
//  • click / tap sends a ripple through the dots
// Falls back to a dotted silhouette until the photo exists.
// ─────────────────────────────────────────────────────────
const CELL = 7

function silhouette(w, h) {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const x = c.getContext('2d')
    const g = x.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#d9d9dc')
    x.fillStyle = g; x.fillRect(0, 0, w, h)
    const s = x.createRadialGradient(w * 0.5, h * 0.36, 0, w * 0.5, h * 0.36, w * 0.3)
    s.addColorStop(0, '#3a3a3e'); s.addColorStop(1, '#6a6a70')
    x.fillStyle = s
    x.beginPath(); x.ellipse(w * 0.5, h * 0.37, w * 0.19, h * 0.17, 0, 0, Math.PI * 2); x.fill()
    x.beginPath()
    x.moveTo(w * 0.08, h * 1.02)
    x.bezierCurveTo(w * 0.1, h * 0.72, w * 0.3, h * 0.6, w * 0.5, h * 0.6)
    x.bezierCurveTo(w * 0.7, h * 0.6, w * 0.9, h * 0.72, w * 0.92, h * 1.02)
    x.fill()
    return c
}

export default function Portrait({ src, grad }) {
    const wrapRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        let W = 0, H = 0, cols = 0, rows = 0
        let lum = new Float32Array(0)
        let img = null
        const st = { grow: 0, mx: -999, my: -999, lens: 0, t: 0 }
        const ripples = []
        let visible = true, alive = true

        const sample = () => {
            if (!cols) return
            const off = document.createElement('canvas')
            off.width = cols; off.height = rows
            const o = off.getContext('2d', { willReadFrequently: true })
            const source = img || silhouette(400, 500)
            const sw = source.naturalWidth || source.width, sh = source.naturalHeight || source.height
            // cover fit, biased up a bit (faces sit high in portraits)
            const k = Math.max(cols / sw, rows / sh)
            const dw = sw * k, dh = sh * k
            o.drawImage(source, (cols - dw) / 2, (rows - dh) * 0.3, dw, dh)
            const d = o.getImageData(0, 0, cols, rows).data
            lum = new Float32Array(cols * rows)
            let lo = 1, hi = 0
            for (let i = 0; i < cols * rows; i++) {
                const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
                lum[i] = l; lo = Math.min(lo, l); hi = Math.max(hi, l)
            }
            // stretch contrast so any photo uses the full dot range
            const r = Math.max(0.05, hi - lo)
            for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - lo) / r
        }

        const resize = () => {
            const r = wrap.getBoundingClientRect()
            W = r.width; H = r.height
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
            cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL)
            sample()
        }

        const draw = () => {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const R = 120, maxR = CELL * 0.56
            const ink = new Path2D(), hot = new Path2D()
            const t = st.t
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    let px = x * CELL + CELL / 2, py = y * CELL + CELL / 2
                    const l = lum[y * cols + x]
                    // entrance: diagonal sweep from the top-left
                    const g = Math.max(0, Math.min(1, st.grow * 2.2 - (x / cols + y / rows) * 0.6))
                    let r = maxR * Math.pow(1 - l, 0.85) * g
                    r *= 0.94 + 0.06 * Math.sin(t * 1.6 + x * 0.22 + y * 0.17)     // slow breathing
                    // lens
                    let near = 0
                    const dx = px - st.mx, dy = py - st.my, dd = Math.hypot(dx, dy)
                    if (dd < R && st.lens > 0) {
                        near = Math.pow(1 - dd / R, 2) * st.lens
                        px += (dx / (dd || 1)) * near * 16
                        py += (dy / (dd || 1)) * near * 16
                        r = Math.min(CELL * 0.75, r * (1 + near * 0.9) + near * 1.2)
                    }
                    // ripples
                    for (const rp of ripples) {
                        const rd = Math.hypot(px - rp.x, py - rp.y)
                        const band = Math.exp(-Math.pow((rd - rp.r) / 22, 2)) * rp.a
                        if (band > 0.02) { r = Math.min(CELL * 0.8, r + band * 2.6); near = Math.max(near, band * 0.8) }
                    }
                    if (r < 0.35) continue
                    const p = near > 0.55 ? hot : ink
                    p.moveTo(px + r, py)
                    p.arc(px, py, r, 0, Math.PI * 2)
                }
            }
            ctx.fillStyle = '#141416'
            ctx.fill(ink)
            ctx.fillStyle = grad[2]
            ctx.fill(hot)
        }

        let acc = 0
        const loop = (time, dt) => {
            if (!alive || !visible) return
            const busy = st.lens > 0.01 || ripples.length || st.grow < 1
            acc += dt
            if (!busy && acc < 33) return
            acc = 0
            st.t = time
            for (let i = ripples.length - 1; i >= 0; i--) {
                const rp = ripples[i]
                rp.r += 7 * (dt / 16.7); rp.a *= Math.pow(0.975, dt / 16.7)
                if (rp.a < 0.03) ripples.splice(i, 1)
            }
            draw()
        }

        const move = (e) => {
            const r = canvas.getBoundingClientRect()
            st.mx = e.clientX - r.left; st.my = e.clientY - r.top
        }
        const enter = (e) => { move(e); gsap.to(st, { lens: 1, duration: 0.5, ease: 'power3.out' }) }
        const leave = () => gsap.to(st, { lens: 0, duration: 0.6, ease: 'power3.out' })
        const down = (e) => {
            const r = canvas.getBoundingClientRect()
            ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 0, a: 1 })
            if (ripples.length > 4) ripples.shift()
        }
        if (!isTouch()) {
            canvas.addEventListener('pointerenter', enter)
            canvas.addEventListener('pointermove', move)
            canvas.addEventListener('pointerleave', leave)
        }
        canvas.addEventListener('pointerdown', down)

        resize()
        const ro = new ResizeObserver(resize); ro.observe(wrap)
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(wrap)

        const im = new Image()
        im.onload = () => { img = im; sample() }
        im.src = `${import.meta.env.BASE_URL}${src}`

        gsap.to(st, { grow: 1, duration: 2.2, ease: 'power2.out', delay: 0.35 })
        gsap.ticker.add(loop)
        return () => {
            alive = false
            gsap.ticker.remove(loop)
            gsap.killTweensOf(st)
            ro.disconnect(); io.disconnect()
            canvas.removeEventListener('pointerenter', enter)
            canvas.removeEventListener('pointermove', move)
            canvas.removeEventListener('pointerleave', leave)
            canvas.removeEventListener('pointerdown', down)
        }
    }, [src, grad])

    return (
        <div
            className="ab-portrait"
            ref={wrapRef}
            style={{ '--g0': grad[0], '--g1': grad[1], '--g2': grad[2] }}
        >
            <canvas ref={canvasRef} aria-label="Portrait of Artem, drawn in dots" role="img" />
        </div>
    )
}
