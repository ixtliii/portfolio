import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { WorksIcon, AboutIcon, QuoteIcon, MailIcon, Notch } from './icons'

if (import.meta.env.DEV && typeof window !== 'undefined') window.__gsap = gsap

export const NAV_ITEMS = [
    { id: 'work', label: 'Works', Icon: WorksIcon },
    { id: 'about', label: 'About', Icon: AboutIcon },
    { id: 'testimonials', label: 'Kind words', Icon: QuoteIcon },
    { id: 'contact', label: 'Contact', Icon: MailIcon },
]

const G = { pill: 54, icon: 20, gapII: 24, gapIP: 20, pad: 16, over: 14, col: 61 }

function layout(active) {
    const pos = []
    let y = 0
    const colTop = active === 0 ? G.over : 0
    if (active !== 0) y = G.pad
    NAV_ITEMS.forEach((_, k) => {
        pos[k] = y
        y += k === active ? G.pill : G.icon
        if (k < NAV_ITEMS.length - 1) y += (k === active || k + 1 === active) ? G.gapIP : G.gapII
    })
    const last = NAV_ITEMS.length - 1
    const colBottom = active === last ? y - G.over : y + G.pad
    return { pos, colTop, colH: colBottom - colTop, height: Math.max(colBottom, pos[active] + G.pill) }
}

export default function LiquidNav({ active, onSelect }) {
    const colRef = useRef(null)
    const blobRef = useRef(null)
    const trailRef = useRef(null)
    const notchUpRef = useRef(null)
    const notchDownRef = useRef(null)
    const pillRef = useRef(null)
    const pillBtnRef = useRef(null)
    const labelRef = useRef(null)
    const activeIconRef = useRef(null)
    const iconRefs = useRef([])
    const prev = useRef(null)

    const L = layout(active)
    const item = NAV_ITEMS[active]

    useLayoutEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const first = prev.current === null
        const from = prev.current
        prev.current = active

        const wrapW = (pillBtnRef.current?.offsetWidth || 96) + 16
        const pillY = L.pos[active]
        const last = NAV_ITEMS.length - 1

        const instant = first || reduce
        const kill = [colRef, blobRef, trailRef, pillRef, notchUpRef, notchDownRef, activeIconRef, ...iconRefs.current.map(el => ({ current: el }))]
            .map(r => r.current).filter(Boolean)
        gsap.killTweensOf(kill)

        const notches = (dur, ease) => {
            gsap.to(notchUpRef.current, { top: pillY - 13.333, opacity: active === 0 ? 0 : 1, duration: dur, ease })
            gsap.to(notchDownRef.current, { top: pillY + G.pill, opacity: active === last ? 0 : 1, duration: dur, ease })
        }

        if (instant) {
            gsap.set(colRef.current, { top: L.colTop, height: L.colH })
            gsap.set([blobRef.current, trailRef.current], { top: pillY, width: wrapW, scaleX: 1, scaleY: 1 })
            gsap.set(pillRef.current, { top: pillY, scaleX: 1, scaleY: 1 })
            iconRefs.current.forEach((el, k) => el && gsap.set(el, { top: L.pos[k] + (k === active ? (G.pill - G.icon) / 2 : 0), opacity: k === active ? 0 : 1, scale: k === active ? 0.4 : 1 }))
            notches(0)
            return
        }

        const dir = active > from ? 1 : -1
        const tl = gsap.timeline()

        tl.to(colRef.current, { top: L.colTop, height: L.colH, duration: 0.6, ease: 'power3.out' }, 0)

        tl.to(blobRef.current, { scaleY: 1.18, scaleX: 0.9, transformOrigin: dir > 0 ? '50% 100%' : '50% 0%', duration: 0.1, ease: 'power1.out' }, 0)
            .to(blobRef.current, { top: pillY, width: wrapW, duration: 0.6, ease: 'elastic.out(1, 0.75)' }, 0.02)
            .to(blobRef.current, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.45)' }, 0.2)

        tl.set(trailRef.current, { width: G.col, scaleX: 1, scaleY: 1 }, 0)
            .to(trailRef.current, { top: pillY, duration: 0.6, ease: 'power3.out' }, 0.03)
            .to(trailRef.current, { width: wrapW, duration: 0.3, ease: 'power2.out' }, 0.4)

        tl.to(pillRef.current, { scaleY: 0.82, scaleX: 1.06, duration: 0.1, ease: 'power1.out' }, 0)
            .to(pillRef.current, { top: pillY, duration: 0.6, ease: 'elastic.out(1, 0.75)' }, 0.02)
            .to(pillRef.current, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }, 0.2)

        iconRefs.current.forEach((el, k) => {
            if (!el) return
            const y = L.pos[k] + (k === active ? (G.pill - G.icon) / 2 : 0)
            tl.to(el, { top: y, duration: 0.5, ease: 'power3.out' }, 0)
            if (k === active) tl.to(el, { opacity: 0, scale: 0.4, duration: 0.15, ease: 'power2.out' }, 0)
            else if (k === from) tl.fromTo(el, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.6)' }, 0.15)
            else tl.to(el, { opacity: 1, scale: 1, duration: 0.2 }, 0)
        })

        notches(0.6, 'elastic.out(1, 0.75)')

        if (labelRef.current) {
            tl.fromTo(labelRef.current,
                { yPercent: 70 * dir, opacity: 0, filter: 'blur(4px)' },
                { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'expo.out', immediateRender: false }, 0.05)
        }

        if (activeIconRef.current) {
            tl.fromTo(activeIconRef.current,
                { opacity: 0, filter: 'blur(4px)' },
                { opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'expo.out', immediateRender: false }, 0.05)
        }

        return () => tl.kill()
    }, [active])

    return (
        <nav className="sh-nav" aria-label="Sections" style={{ height: L.height }}>
            <svg width="0" height="0" className="sh-goo-defs" aria-hidden>
                <defs>
                    <filter id="sh-goo" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <div className="sh-goo" aria-hidden>
                <div className="sh-nav-col" ref={colRef} />
                <div className="sh-nav-blob sh-nav-blob--trail" ref={trailRef} />
                <div className="sh-nav-blob" ref={blobRef} />
                <span className="sh-nav-notch-wrap sh-nav-notch-wrap--up" ref={notchUpRef}><Notch className="sh-nav-notch sh-nav-notch--up" /></span>
                <span className="sh-nav-notch-wrap" ref={notchDownRef}><Notch className="sh-nav-notch" /></span>
            </div>

            {NAV_ITEMS.map(({ id, label, Icon }, k) => (
                <button
                    key={id}
                    ref={el => (iconRefs.current[k] = el)}
                    className="sh-nav-btn"
                    onClick={() => onSelect(k)}
                    aria-label={label}
                    title={label}
                    tabIndex={k === active ? -1 : 0}
                >
                    <Icon />
                </button>
            ))}

            <div className="sh-nav-pill" ref={pillRef}>
                <button ref={pillBtnRef} className="sh-pill" onClick={() => onSelect(active)} aria-current="true" aria-label={`${item.label} (current section)`}>
                    <span className="sh-pill-bird sh-pill-bird--l" ref={activeIconRef} style={{ color: 'var(--sh-ink-a)' }}>
                        <item.Icon />
                    </span>
                    <span className="sh-pill-label"><span ref={labelRef}>{item.label}</span></span>
                </button>
            </div>
        </nav>
    )
}