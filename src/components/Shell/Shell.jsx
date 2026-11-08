import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { initScroll, getScroller, scrollToY } from '../../lib/scroll'
import { useTheme } from '../../lib/theme'
import { CornerSun } from './icons'
import LiquidNav, { NAV_ITEMS } from './LiquidNav'
import { scrollToEl } from '../../lib/scroll'
import './Shell.css'

/* ─────────────────────────────────────────────────────────
   The site shell (Figma: Desktop - 2, node 1:42).

   ┌────────┬──────────────────────────────────────────╮ ☀
   │ A  D   │                                tagline   │
   │ r  i   │                                          │
   ├────────✦──────────────────────────────────────────┤
   │        │ [Home]                                   │
   │        │  ☀    ← scrollable content box →          │
   │        │  🌐                                       │
   └────────┴──────────────────────────────────────────┘

   Only the bottom-right box scrolls; everything else is fixed.
   ───────────────────────────────────────────────────────── */

// page sections → nav slot (one slot per section)
const TRACKED = NAV_ITEMS.map((it, slot) => ({ id: it.id, slot }))

export default function Shell({ children }) {
    const { theme, toggle } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [active, setActive] = useState(0)

    // The box is the scroller for Lenis + ScrollTrigger. Set it up in the ref callback,
    // which runs before any child's useEffect, so children's ScrollTriggers see it.
    const boxRef = useCallback((el) => {
        if (el) initScroll(el, el.firstElementChild)
    }, [])

    // scale the shell from the 1440×1024 design: x for widths, y for heights
    const shellRef = useRef(null)
    useEffect(() => {
        const set = () => {
            const el = shellRef.current
            if (!el) return
            const w = window.innerWidth, h = window.innerHeight
            const kx = Math.min(1, Math.max(0.42, w / 1440))
            const ky = Math.min(1, Math.max(0.5, h / 1024))
            el.style.setProperty('--kx', kx.toFixed(4))
            el.style.setProperty('--ky', ky.toFixed(4))
            el.style.setProperty('--ks', Math.max(0.72, Math.min(kx, ky)).toFixed(4))
            el.style.setProperty('--kc', Math.min(kx, ky).toFixed(4))
            // the box's visible height, for sections that fill it
            document.documentElement.style.setProperty('--box-h', `${h}px`)
            document.documentElement.style.setProperty('--box-w', `${w}px`)
        }
        set()
        window.addEventListener('resize', set)
        return () => window.removeEventListener('resize', set)
    }, [])

    // section tracking for the pill label
    useEffect(() => {
        if (location.pathname !== '/') { setActive(0); return }
        const root = getScroller()
        const seen = new Map()
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => seen.set(e.target.id, e.intersectionRatio))
            // the section occupying most of the box wins
            let best = TRACKED[0], bestR = -1
            TRACKED.forEach(sec => {
                const r = seen.get(sec.id) ?? 0
                if (r > bestR) { best = sec; bestR = r }
            })
            setActive(best.slot)
        }, { root, threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9] })
        const t = setTimeout(() => {
            TRACKED.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el) })
        }, 50)
        return () => { clearTimeout(t); io.disconnect() }
    }, [location.pathname])

    const goTo = (k) => {
        const el = document.getElementById(NAV_ITEMS[k].id)
        if (location.pathname !== '/') { navigate('/'); return }
        if (k === 0 || !el) scrollToY(0, { duration: 1.4 })
        else scrollToEl(el, { duration: 1.4 })
    }

    return (
        <div className="shell" ref={shellRef}>
            <div className="sh-bg" aria-hidden />
            <div className="sh-bg sh-bg--dark" aria-hidden />

            {/* name, floating top-left (no frame any more) */}
            <p className="sh-name">Artem Diakunchak</p>

            {/* top-right corner + sun */}
            <button
                className="sh-corner-sun"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={theme === 'dark'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
                <CornerSun />
            </button>


            {/* the content box — the only thing that scrolls */}
            <div className="sh-box" ref={boxRef}>
                <div className="sh-box-content">{children}</div>
            </div>

            {/* nav panel (floats over the box, doesn't scroll) */}
            {/* only one section for now, so the nav rests until the others are back:
                <LiquidNav active={active} onSelect={goTo} /> */}
        </div>
    )
}
