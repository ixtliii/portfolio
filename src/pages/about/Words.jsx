import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { openContact } from '../../lib/contact'
import { isSmall } from '../../lib/perf'

// ─────────────────────────────────────────────────────────
// Kind words: a big headline with the cards fanned across its
// lower edge. The card in front is dark and shows the full quote;
// the others peek out tilted on either side. Click a side card
// (or swipe the front one) to bring the next one forward.
// ─────────────────────────────────────────────────────────
const excerpt = (q, n = 12) => q.split(' ').slice(0, n).join(' ') + '…'

const Arrow = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export default function Words({ words, title, line }) {
    const cards = [...words, { slot: true }]
    const n = cards.length
    const [active, setActive] = useState(0)
    const refs = useRef([])
    const first = useRef(true)
    const activeRef = useRef(0)
    activeRef.current = active

    // lay the fan out around the active card
    useEffect(() => {
        const small = isSmall()
        cards.forEach((_, i) => {
            const el = refs.current[i]
            if (!el) return
            let rel = (i - active + n) % n
            if (rel > n / 2) rel -= n                       // −1 left, 0 front, +1 right
            const side = Math.sign(rel)
            const spread = small ? 58 : 66                   // % of the card width
            const pose = rel === 0
                ? { xPercent: -50, x: 0, y: 0, rotate: -2, scale: 1, zIndex: 3 }
                : { xPercent: -50 + side * spread * Math.abs(rel), x: 0, y: small ? 34 : 46, rotate: side * (small ? 7 : 8), scale: 0.86, zIndex: 3 - Math.abs(rel) }
            el.style.zIndex = pose.zIndex
            el.classList.toggle('is-front', rel === 0)
            if (first.current) gsap.set(el, { ...pose, transformOrigin: '50% 100%' })
            else gsap.to(el, { ...pose, duration: 0.85, ease: 'elastic.out(1, 0.82)', overwrite: 'auto' })
        })
        first.current = false
    }, [active])  // eslint-disable-line react-hooks/exhaustive-deps

    const go = (d) => setActive(a => (a + d + n) % n)

    // drag anywhere on the fan: the front card follows, past a threshold the
    // next/previous one comes forward. A drag never also counts as a click.
    const fanRef = useRef(null)
    const dragged = useRef(false)
    useEffect(() => {
        const fan = fanRef.current
        let sx = 0, on = false, dx = 0, el = null
        const down = (e) => {
            if (e.button || e.target.closest('button')) return
            on = true; sx = e.clientX; dx = 0; dragged.current = false
            el = refs.current[activeRef.current]
        }
        const move = (e) => {
            if (!on) return
            dx = e.clientX - sx
            if (Math.abs(dx) > 6 && !dragged.current) { dragged.current = true; fan.setPointerCapture?.(e.pointerId); fan.classList.add('is-drag') }
            if (dragged.current) gsap.set(el, { x: dx, rotate: -2 + dx * 0.04 })
        }
        const up = () => {
            if (!on) return
            on = false
            fan.classList.remove('is-drag')
            if (!dragged.current) return
            if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1)
            else gsap.to(el, { x: 0, rotate: -2, duration: 0.6, ease: 'elastic.out(1, 0.6)' })
            setTimeout(() => { dragged.current = false }, 0)    // swallow the click that follows
        }
        fan.addEventListener('pointerdown', down)
        fan.addEventListener('pointermove', move)
        fan.addEventListener('pointerup', up)
        fan.addEventListener('pointercancel', up)
        return () => {
            fan.removeEventListener('pointerdown', down)
            fan.removeEventListener('pointermove', move)
            fan.removeEventListener('pointerup', up)
            fan.removeEventListener('pointercancel', up)
        }
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="ab-kw">
            <h2 className="ab-kw-title">
                {title.map((t, i) => <span key={i}>{t}</span>)}
            </h2>

            <div className="ab-kw-fan" ref={fanRef} onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}>
                {cards.map((c, i) => (
                    <article
                        key={i}
                        ref={el => (refs.current[i] = el)}
                        className={`ab-kw-card${c.slot ? ' ab-kw-card--slot' : ''}`}
                        onClick={() => { if (!dragged.current && i !== active) setActive(i) }}
                        tabIndex={i === active ? -1 : 0}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && i !== active) { e.preventDefault(); setActive(i) } }}
                        aria-label={c.slot ? 'Leave your own words' : `Words from ${c.name}`}
                    >
                        {c.slot ? (
                            <>
                                <div className="ab-kw-head">
                                    <span className="ab-kw-badge">Open</span>
                                    <Arrow />
                                </div>
                                <p className="ab-kw-quote">Worked with Artem? This spot is yours.</p>
                                <button type="button" className="ab-kw-btn" onClick={(e) => { e.stopPropagation(); openContact() }}>
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M10 3.5v13M3.5 10h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
                                    Leave a few words
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="ab-kw-head">
                                    <span className="ab-kw-mark" aria-hidden>“</span>
                                    <Arrow />
                                </div>
                                <p className="ab-kw-quote ab-kw-quote--full">{c.quote}</p>
                                <p className="ab-kw-quote ab-kw-quote--short" aria-hidden>{excerpt(c.quote)}</p>
                                <footer className="ab-kw-by">
                                    <strong>{c.name}</strong>
                                    <span>{c.title}</span>
                                </footer>
                            </>
                        )}
                    </article>
                ))}
            </div>

            <p className="ab-kw-line">{line}</p>
            <button type="button" className="ab-kw-cta" onClick={openContact}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M2.6 9.2 16.4 3c.8-.36 1.6.44 1.24 1.24L11.4 18c-.4.88-1.7.76-1.92-.18l-1.1-4.6a1 1 0 0 0-.74-.74l-4.6-1.1c-.94-.22-1.06-1.52-.18-1.92Z" fill="currentColor" /></svg>
                Work with me
            </button>
        </div>
    )
}
