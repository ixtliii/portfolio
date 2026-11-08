import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

/* ─────────────────────────────────────────────────────────
   The helper's menu, in the old navbar's language: a panel
   column of icons where the focused item swells into the
   gradient pill (birds + label), and the pill flows to the
   next item like liquid (goo filter over the panel shapes).

   Mirrored for the bottom-right corner: the column hugs the
   right edge and the pill grows out to the left.
   ───────────────────────────────────────────────────────── */

const G = { pill: 54, icon: 20, gapII: 22, gapIP: 18, pad: 14, col: 61, cap: 20, groupGap: 16 }

// groups stack top→bottom, each in its own panel with a small caption above it
function layout(active, groups) {
    const pos = [], caps = [], cols = []
    let y = 0, k = 0
    groups.forEach((g, gi) => {
        caps[gi] = y
        y += G.cap
        const top = y
        y += G.pad
        const first = k
        g.items.forEach((_, j) => {
            pos[k] = y
            y += k === active ? G.pill : G.icon
            if (j < g.items.length - 1) y += (k === active || k + 1 === active) ? G.gapIP : G.gapII
            k++
        })
        const last = k - 1
        y += G.pad
        // when the pill sits at a panel's end, the panel starts/ends at the pill
        const cTop = active === first ? pos[first] : top
        const cBot = active === last ? pos[last] + G.pill : y
        cols[gi] = { top: cTop, h: cBot - cTop }
        if (gi < groups.length - 1) y += G.groupGap
    })
    return { pos, caps, cols, height: y }
}

export default function HelperNav({ groups, onRun }) {
    const items = groups.flatMap(g => g.items)
    const n = items.length
    const [active, setActive] = useState(0)
    const colRefs = useRef([])
    const blobRef = useRef(null)
    const trailRef = useRef(null)
    const pillRef = useRef(null)
    const pillBtnRef = useRef(null)
    const labelRef = useRef(null)
    const iconRefs = useRef([])
    const prev = useRef(null)
    const navRef = useRef(null)
    const lastPointer = useRef('mouse')
    const pressing = useRef(false)

    const a = Math.min(active, n - 1)
    const L = layout(a, groups)
    const item = items[a]

    // entrance: the panel pours up out of the mascot
    useLayoutEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce) return
        gsap.fromTo(navRef.current, { scaleY: 0.2, scaleX: 0.6, opacity: 0, filter: 'blur(6px)' },
            { scaleY: 1, scaleX: 1, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'elastic.out(1, 0.6)', transformOrigin: '80% 100%' })
    }, [])

    useLayoutEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const first = prev.current === null
        const from = prev.current
        prev.current = a

        const wrapW = (pillBtnRef.current?.offsetWidth || 96) + 16
        const pillY = L.pos[a]
        const kill = [blobRef, trailRef, pillRef].map(r => r.current).concat(colRefs.current, iconRefs.current).filter(Boolean)
        gsap.killTweensOf(kill)

        if (first || reduce) {
            colRefs.current.forEach((el, gi) => el && gsap.set(el, { top: L.cols[gi].top, height: L.cols[gi].h }))
            gsap.set([blobRef.current, trailRef.current], { top: pillY, width: wrapW, scaleX: 1, scaleY: 1 })
            gsap.set(pillRef.current, { top: pillY, scaleX: 1, scaleY: 1 })
            iconRefs.current.forEach((el, k) => el && gsap.set(el, { top: L.pos[k] + (k === a ? (G.pill - G.icon) / 2 : 0), opacity: k === a ? 0 : 1, scale: k === a ? 0.4 : 1 }))
            return
        }

        const dir = a > from ? 1 : -1
        const tl = gsap.timeline()
        colRefs.current.forEach((el, gi) => el && tl.to(el, { top: L.cols[gi].top, height: L.cols[gi].h, duration: 0.5, ease: 'power3.out' }, 0))
        // the wrap leaves first, stretched along the direction of travel…
        // (starts moving immediately, so fast hovering never feels laggy)
        tl.to(blobRef.current, { scaleY: 1.12, scaleX: 0.93, transformOrigin: dir > 0 ? '50% 100%' : '50% 0%', duration: 0.1, ease: 'power2.out' }, 0)
          .to(blobRef.current, { top: pillY, width: wrapW, duration: 0.55, ease: 'elastic.out(1, 0.78)' }, 0)
          .to(blobRef.current, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' }, 0.12)
        // …a droplet left behind catches up, pulling a liquid neck between them
        tl.to(trailRef.current, { width: G.col, scaleX: 1, scaleY: 1, duration: 0.12 }, 0)
          .to(trailRef.current, { top: pillY, duration: 0.5, ease: 'power3.inOut' }, 0.04)
          .to(trailRef.current, { width: wrapW, duration: 0.25, ease: 'power2.out' }, 0.4)
        // the pill rides the wrap, squashing on take-off and wobbling on landing
        tl.to(pillRef.current, { scaleY: 0.88, scaleX: 1.04, duration: 0.1, ease: 'power2.out' }, 0)
          .to(pillRef.current, { top: pillY, duration: 0.55, ease: 'elastic.out(1, 0.78)' }, 0)
          .to(pillRef.current, { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'elastic.out(1.1, 0.5)' }, 0.1)
        iconRefs.current.forEach((el, k) => {
            if (!el) return
            tl.to(el, { top: L.pos[k] + (k === a ? (G.pill - G.icon) / 2 : 0), duration: 0.45, ease: 'power3.out' }, 0)
            if (k === a) tl.to(el, { opacity: 0, scale: 0.4, duration: 0.18, ease: 'power2.in' }, 0)
            // every other icon heads back to full size (also ones left mid-fade by quick hovering)
            else tl.to(el, { opacity: 1, scale: 1, duration: k === from ? 0.5 : 0.25, ease: k === from ? 'elastic.out(1, 0.6)' : 'power2.out' }, k === from ? 0.15 : 0)
        })
        if (labelRef.current) {
            tl.fromTo(labelRef.current, { yPercent: 70 * dir, opacity: 0, filter: 'blur(4px)' },
                { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.38, ease: 'expo.out', immediateRender: false }, 0.04)
        }
        return () => tl.kill()
    }, [a, n]) // eslint-disable-line react-hooks/exhaustive-deps

    const onKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(k => (k + 1) % n) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(k => (k - 1 + n) % n) }
    }

    const Pill = item?.href ? 'a' : 'button'
    return (
        <nav className="hp-nav" ref={navRef} aria-label="Helper menu" style={{ height: L.height }} onKeyDown={onKey}>
            <svg width="0" height="0" className="hp-goo-defs" aria-hidden>
                <defs>
                    <filter id="hp-goo" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <div className="hp-goo" aria-hidden>
                {groups.map((g, gi) => <div key={g.label} className="hp-nav-col" ref={el => (colRefs.current[gi] = el)} />)}
                <div className="hp-nav-blob" ref={trailRef} />
                <div className="hp-nav-blob" ref={blobRef} />
            </div>

            {groups.map((g, gi) => (
                <span key={g.label} className="hp-nav-cap" style={{ top: L.caps[gi] }}>{g.label}</span>
            ))}

            {items.map((it, k) => {
                const Tag = it.href ? 'a' : 'button'
                return (
                    <Tag
                        key={it.label}
                        ref={el => (iconRefs.current[k] = el)}
                        className="hp-nav-btn"
                        href={it.href}
                        download={it.download}
                        onClick={(e) => {
                            // touch has no hover: the first tap shows what it is, the second runs it
                            const touch = (e.nativeEvent.pointerType || lastPointer.current) === 'touch'
                            pressing.current = false
                            if (touch && k !== a) { e.preventDefault(); setActive(k); return }
                            onRun(it)
                        }}
                        onPointerDown={(e) => { lastPointer.current = e.pointerType; pressing.current = true }}
                        onPointerCancel={() => { pressing.current = false }}
                        onPointerEnter={(e) => { if (e.pointerType !== 'touch') setActive(k) }}
                        onFocus={() => { if (!pressing.current) setActive(k) }}   // keyboard focus selects; a tap's focus doesn't
                        aria-label={it.label}
                        title={it.label}
                        tabIndex={k === a ? -1 : 0}
                    >
                        <it.Icon />
                    </Tag>
                )
            })}

            <div className="hp-nav-pill" ref={pillRef}>
                <Pill ref={pillBtnRef} className="sh-pill" href={item?.href} download={item?.download} onClick={() => onRun(item)} autoFocus>
                    {/* the active item's own icon, so the pill says what it does */}
                    <span className="hp-pill-icon" key={item?.label}>{item && <item.Icon />}</span>
                    <span className="sh-pill-label"><span ref={labelRef}>{item?.label}</span></span>
                </Pill>
            </div>
        </nav>
    )
}

/* icons in the same filled, rounded style as the nav set (20×20) */
const S = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true }
const line = { stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }
export const NextIcon = () => <svg {...S}><path d="M3 10h12.5M11 4.8l5.2 5.2-5.2 5.2" {...line} /></svg>
export const PrevIcon = () => <svg {...S}><path d="M17 10H4.5M9 4.8 3.8 10 9 15.2" {...line} /></svg>
export const OpenIcon = () => <svg {...S}><rect x="1.5" y="5" width="12.5" height="13" rx="3" fill="currentColor" /><path d="M10 10l7.2-7.2M11.6 2.6h5.8v5.8" {...line} /></svg>
export const FirstIcon = () => <svg {...S}><path d="M3.4 3.6v12.8" {...line} /><path d="M16.2 4.3v11.4c0 .8-.9 1.3-1.6.8L6.9 11a1.2 1.2 0 0 1 0-2l7.7-5.5c.7-.5 1.6 0 1.6.8Z" fill="currentColor" /></svg>
export const TopIcon = () => <svg {...S}><path d="M10 17V4.5M4.8 9 10 3.8 15.2 9" {...line} /></svg>
export const DownloadIcon = () => <svg {...S}><path d="M10 2.6v9.6M5.6 8.2 10 12.6l4.4-4.4" {...line} /><rect x="2" y="15" width="16" height="3.2" rx="1.6" fill="currentColor" /></svg>
export const CloseIcon = () => <svg {...S}><path fillRule="evenodd" clipRule="evenodd" d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM7.4 6.13a.9.9 0 0 0-1.27 1.27L8.73 10l-2.6 2.6a.9.9 0 1 0 1.27 1.27L10 11.27l2.6 2.6a.9.9 0 0 0 1.27-1.27L11.27 10l2.6-2.6a.9.9 0 0 0-1.27-1.27L10 8.73 7.4 6.13Z" fill="currentColor" /></svg>
export const ClearIcon = () => <svg {...S}><path d="M11.1 2.7a2 2 0 0 1 2.83 0l3.37 3.37a2 2 0 0 1 0 2.83L10.2 16H17a1 1 0 1 1 0 2H6.73a2 2 0 0 1-1.42-.59l-2.62-2.62a2 2 0 0 1 0-2.83L11.1 2.7Z" fill="currentColor" /></svg>
export const MoonIcon = () => <svg {...S}><path d="M16.8 12.6A7.6 7.6 0 0 1 7.4 3.2a.6.6 0 0 0-.8-.7A8.2 8.2 0 1 0 17.5 13.4a.6.6 0 0 0-.7-.8Z" fill="currentColor" /></svg>
