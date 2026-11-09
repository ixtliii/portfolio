import { PROJECTS } from '../../projects'
import { goTo } from '../../lib/transition'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─────────────────────────────────────────────────────────
// Selected work: three featured projects side by side, plus a small
// app window (like the hero's) that leads to the full archive at /work.
// ─────────────────────────────────────────────────────────
const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

const open = (p) => {
    if (p.to) goTo(p.to)
    else window.open(p.url, '_blank', 'noopener,noreferrer')
}

const Arrow = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

function Card({ p }) {
    return (
        <button type="button" className="ab-sw-card ab-dith" onClick={() => open(p)}>
            <span className="ab-sw-img">
                <img src={asset(p.image)} alt="" loading="lazy" style={{ objectPosition: p.focus || '50% 50%', '--z': p.zoom || 1, '--o': p.zoomFrom || '50% 0%' }} />
            </span>
            <span className="ab-sw-info">
                <span className="ab-sw-meta">{p.company} · {p.year}</span>
                <span className="ab-sw-title">{p.title}</span>
                <span className="ab-sw-sum">{p.blurb || p.summary}</span>
                <span className="ab-sw-foot">
                    <span className="ab-sw-tags">{p.tags.join(' · ')}</span>
                    <span className="ab-sw-go" aria-label={p.to ? 'Read the case study' : 'Visit the project'}><Arrow /></span>
                </span>
            </span>
        </button>
    )
}

export default function Selected({ featured }) {
    const items = featured.map(f => ({ ...PROJECTS.find(p => p.title === f.title), ...f }))
    const all = PROJECTS
    const root = useRef(null)

    // the cards dither in out of the page, one after another: four interleaved
    // grids of round dots grow in Bayer order (0, 3, 1, 2) until they cover the card
    useEffect(() => {
        const els = Array.from(root.current.querySelectorAll('.ab-dith'))
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce) { els.forEach(el => el.classList.remove('ab-dith')); return }
        // batch: whatever enters together is revealed in sequence (a row on desktop, one by one on phones)
        const reveal = (el, delay) => {
            const tl = gsap.timeline({ delay, onComplete: () => el.classList.add('is-in') })
            ;['--d0', '--d3', '--d1', '--d2'].forEach((v, k) => tl.to(el, { [v]: '6.2px', duration: 0.5, ease: 'power2.out' }, k * 0.13))
        }
        const sts = ScrollTrigger.batch(els, {
            start: 'top 85%', once: true,
            onEnter: (batch) => batch.forEach((el, i) => reveal(el, i * 0.28)),
        })
        return () => sts.forEach(t => t.kill())
    }, [])

    return (
        <div className="ab-sw" ref={root}>
            <div className="ab-sw-grid">
                {items.map(p => <Card key={p.title} p={p} />)}

            </div>

            {/* the rest of the work: one quiet window, like the ones in the hero */}
            <div className="ab-sw-more ab-dith">
                <button type="button" className="ab-win ab-win--inline" onClick={() => goTo('/work')} aria-label={`Open the full archive, ${all.length} projects`}>
                    <span className="ab-win-bar">
                        <span className="ab-win-dots" aria-hidden><i /><i /><i /></span>
                        <span className="ab-win-name">work.archive</span>
                        <span className="ab-win-count">{all.length} items</span>
                    </span>
                    <span className="ab-win-row">
                        <span className="ab-win-blocks" aria-hidden>
                            <i style={{ '--a': '#ffcca3', '--b': '#e3875a' }} />
                            <i style={{ '--a': '#d4c0ff', '--b': '#8e72dc' }} />
                            <i style={{ '--a': '#b6ebc6', '--b': '#62b884' }} />
                        </span>
                        <span className="ab-win-copy">
                            <span className="ab-win-title">The full archive</span>
                            <span className="ab-win-sub">Every project, in 3D</span>
                        </span>
                        <span className="ab-win-go">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                    </span>
                </button>
            </div>
        </div>
    )
}
