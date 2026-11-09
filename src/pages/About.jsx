import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Portrait from './about/Portrait'
import Skills from './about/Skills'
import Words from './about/Words'
import Clouds from './about/Clouds'
import Ambient from './about/Ambient'
import Windows from './about/Windows'
import Selected from './about/Selected'
import JourneyArt from './about/JourneyArt'
import { PORTRAIT, HELLO, FEATURED, BIO, JOURNEY, SKILLS, WORDS, WORDS_TITLE, WORDS_LINE, GUIDE } from './about/content'
import { openContact, EMAIL } from '../lib/contact'
import { goTo } from '../lib/transition'
import { isTouch } from '../lib/perf'
import { offsetTopOf, getViewportHeight, scrollToY } from '../lib/scroll'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

const PORTRAIT_GRAD = ['#f1fff4', '#b6ebc6', '#62b884']
const say = (text) => window.dispatchEvent(new CustomEvent('helper:say', { detail: { text } }))
const CV = `${import.meta.env.BASE_URL}Artem_Diakunchak-CV.pdf`

// the work email, big enough to read from across the room; one tap copies it
function EmailLine() {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        try { await navigator.clipboard.writeText(EMAIL) } catch { /* old browsers: the mailto link still works */ }
        setCopied(true)
        say('Copied. Paste it anywhere.')
        setTimeout(() => setCopied(false), 1800)
    }
    return (
        <div className="ab-mail" data-rise>
            <a className="ab-mail-link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <button type="button" className={`ab-mail-copy${copied ? ' is-done' : ''}`} onClick={copy} aria-label="Copy the email address">
                {copied ? (
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden><rect x="6.5" y="6.5" width="11" height="11" rx="2.6" fill="currentColor" /><path d="M13 3.6H5.6a2 2 0 0 0-2 2V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
        </div>
    )
}

function Chapter({ no, label, id, children, className = '' }) {
    return (
        <section className={`ab-ch ${className}`} data-chapter={id} id={`about-${id}`}>
            {label && (
                <p className="ab-kicker"><span>{String(no).padStart(2, '0')}</span>{label}</p>
            )}
            {children}
        </section>
    )
}

export default function About() {
    const rootRef = useRef(null)
    const helloRef = useRef(null)
    const bioRef = useRef(null)
    const jourRef = useRef(null)

    // hello: the name slides in from both sides, the card rises between,
    // stickers slap on; afterwards everything leans with the cursor in depth
    useEffect(() => {
        const el = helloRef.current
        const q = (s) => el.querySelector(s)
        const qa = (s) => el.querySelectorAll(s)
        // wait for the intro mascot to hand over, so the entrance isn't played behind it
        const tl = gsap.timeline({ delay: 0.15, paused: document.documentElement.dataset.intro === 'intro' })
        const onPhase = (e) => { if (e.detail.phase !== 'intro' && tl.paused()) tl.play() }
        window.addEventListener('introphase', onPhase)
        tl.fromTo(q('.ab-name-a'), { xPercent: -18, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' })
          .fromTo(q('.ab-name-b'), { xPercent: 18, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }, 0.06)
          .fromTo(q('.ab-hello-card'), { y: 80, rotate: 8, scale: 0.86, opacity: 0 }, { y: 0, rotate: -3, scale: 1, opacity: 1, duration: 1.5, ease: 'expo.out' }, 0.1)
          .fromTo(qa('.ab-sticker'), { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.55)', stagger: 0.12 }, 0.75)
          .fromTo(qa('.ab-win'), { y: 40, scale: 0.9, opacity: 0, filter: 'blur(8px)' }, { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.12 }, 0.9)
          .fromTo(qa('.ab-hello-foot > *'), { y: 14, opacity: 0, filter: 'blur(4px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.6)

        // cursor depth: card tilts toward, name drifts away, stickers float in front
        const layers = [
            [q('.ab-name-a'), -14, -6], [q('.ab-name-b'), -14, -6],
            [q('.ab-hello-tilt'), 10, 8], ...Array.from(qa('.ab-sticker')).map((s, i) => [s, 22 + i * 6, 14]),
            ...Array.from(qa('.ab-wins > *')).map((s, i) => [s, 30 + i * 8, 18 + i * 4]),
        ].map(([node, dx, dy]) => ({ x: gsap.quickTo(node, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(node, 'y', { duration: 1, ease: 'power3.out' }), dx, dy }))
        const rx = gsap.quickTo(q('.ab-hello-tilt'), 'rotationY', { duration: 1, ease: 'power3.out' })
        const ry = gsap.quickTo(q('.ab-hello-tilt'), 'rotationX', { duration: 1, ease: 'power3.out' })
        const move = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5
            layers.forEach(l => { l.x(nx * l.dx * 2); l.y(ny * l.dy * 2) })
            rx(nx * 16); ry(-ny * 12)
        }
        if (!isTouch()) window.addEventListener('pointermove', move)

        // scrolling away: the two halves of the name part, the card sinks back
        const out = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
        out.to(q('.ab-name-a'), { xPercent: -14, ease: 'none' }, 0)
           .to(q('.ab-name-b'), { xPercent: 14, ease: 'none' }, 0)
           .to(q('.ab-hello-card'), { yPercent: 18, scale: 0.9, ease: 'none' }, 0)
        return () => { tl.kill(); out.scrollTrigger?.kill(); out.kill(); window.removeEventListener('pointermove', move); window.removeEventListener('introphase', onPhase) }
    }, [])

    // the corner mascot narrates each chapter once
    useEffect(() => {
        const seen = new Set()
        const sts = Array.from(rootRef.current.querySelectorAll('[data-chapter]')).map(el => {
            const id = el.dataset.chapter
            if (id === 'hello') return null      // the helper greets on arrival
            return ScrollTrigger.create({
                trigger: el, start: 'top 55%',
                onEnter: () => { if (!seen.has(id) && GUIDE[id]) { seen.add(id); say(GUIDE[id]) } },
            })
        }).filter(Boolean)
        return () => sts.forEach(s => s.kill())
    }, [])

    // bio: words light up as you read down
    useEffect(() => {
        const el = bioRef.current
        const words = Array.from(el.querySelectorAll('.ab-w'))
        let last = -1
        const st = ScrollTrigger.create({
            trigger: el, start: 'top 78%', end: 'bottom 55%', scrub: true,
            onUpdate: (self) => {
                const n = Math.round(self.progress * words.length)
                if (n === last) return
                last = n
                words.forEach((w, i) => w.classList.toggle('is-on', i < n))
            },
        })
        return () => st.kill()
    }, [])

    // journey: a pinned stage. Scrolling rolls the big year reel on the left
    // and deals the role cards onto a stack on the right, one per stop.
    useEffect(() => {
        const sec = jourRef.current
        const reel = sec.querySelector('.ab-reel-strip')
        const cards = Array.from(sec.querySelectorAll('.ab-stack-card'))
        const items = Array.from(sec.querySelectorAll('.ab-jl-item'))
        const bar = sec.querySelector('.ab-jl-bar i')
        const n = cards.length
        let last = -1
        const render = (p) => {
            // 0 … n-1, eased so each stop rests for a moment before the next one deals in
            const raw = p * (n - 1), base = Math.min(n - 2, Math.floor(raw)), fr = raw - base
            const sm = (t) => t * t * (3 - 2 * t)
            const f = base + sm(sm(Math.min(1, fr)))
            reel.style.transform = `translate3d(0, ${(-f * 100 / n).toFixed(3)}%, 0)`
            cards.forEach((c, i) => {
                const d = f - i                           // >0: buried under newer cards, <0: still to come
                if (d < -1) { c.style.transform = 'translate3d(0, 120%, 0) rotate(6deg)'; c.style.opacity = 0; return }
                if (d < 0) {                              // the next card slides up from below
                    const t = 1 + d
                    const e = 1 - Math.pow(1 - t, 3)
                    c.style.transform = `translate3d(0, ${((1 - e) * 150).toFixed(2)}%, 0) rotate(${((1 - e) * 6).toFixed(2)}deg)`
                    c.style.opacity = Math.min(1, t * 5).toFixed(3)
                    c.style.filter = 'none'
                    return
                }
                const k = Math.min(d, 3)                  // settled: sink back into the stack
                c.style.transform = `translate3d(0, ${(-k * 7).toFixed(2)}%, 0) scale(${(1 - k * 0.07).toFixed(4)}) rotate(${(k * (i % 2 ? 1.6 : -1.6)).toFixed(2)}deg)`
                c.style.opacity = Math.max(0, 1 - k * 0.32).toFixed(3)
                c.style.filter = k > 0.05 ? `blur(${(k * 1.2).toFixed(2)}px)` : 'none'
            })
            const cur = Math.round(f)
            if (cur !== last) { last = cur; items.forEach((it, i) => it.classList.toggle('is-on', i === cur)) }
            bar.style.transform = `scaleY(${p.toFixed(4)})`
        }
        render(0)
        const st = ScrollTrigger.create({
            trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
            onUpdate: (self) => render(self.progress),
        })
        // jump to a stop from the list
        const jump = (e) => {
            const i = Number(e.currentTarget.dataset.i)
            const y = offsetTopOf(sec) + (sec.offsetHeight - getViewportHeight()) * (i / (n - 1))
            scrollToY(y, { duration: 1.1 })
        }
        items.forEach(it => it.addEventListener('click', jump))
        return () => { st.kill(); items.forEach(it => it.removeEventListener('click', jump)) }
    }, [])

    // reveal-on-enter for the plain blocks
    useEffect(() => {
        const els = rootRef.current.querySelectorAll('[data-rise]')
        const sts = Array.from(els).map(el => {
            gsap.set(el, { y: 36, opacity: 0, filter: 'blur(6px)' })
            return ScrollTrigger.create({
                trigger: el, start: 'top 88%', once: true,
                onEnter: () => gsap.to(el, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'expo.out', delay: Math.min(0.3, Array.prototype.indexOf.call(el.parentElement.children, el) * 0.08), clearProps: 'filter' }),
            })
        })
        return () => sts.forEach(s => s.kill())
    }, [])

    let w = 0
    return (
        <div className="ab" ref={rootRef}>
            {/* 01 · hello */}
            <section className="ab-ch ab-hello" data-chapter="hello" id="about-hello">
                <div className="ab-hello-stage" ref={helloRef}>
                    <h1 className="ab-name" aria-label="Artem Diakunchak">
                        <span className="ab-name-a" aria-hidden>{HELLO.first}</span>
                        <span className="ab-name-b" aria-hidden>{HELLO.last}</span>
                    </h1>
                    <div className="ab-hello-card">
                        <div className="ab-hello-tilt">
                            <Portrait src={PORTRAIT} grad={PORTRAIT_GRAD} />
                            {HELLO.stickers.map((t, i) => (
                                <span key={t} className={`ab-sticker ab-sticker--${i}`}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <Windows />
                    <p className="ab-hello-foot">
                        {HELLO.line.map((t, i) => <span key={i}>{t}</span>)}
                    </p>
                </div>
            </section>

            {/* 02 · selected work */}
            <Chapter no={2} id="work" label="Selected work" className="ab-work">
                <div className="ab-sw-head" data-rise>
                    <h2 className="ab-h2">Things I've shipped</h2>
                    <button type="button" className="ab-sw-link" onClick={() => goTo('/work')}>
                        All projects
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M3 10h12.5M11 4.8l5.2 5.2-5.2 5.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
                <Selected featured={FEATURED} />
            </Chapter>

            {/* 03 · bio */}
            <Chapter no={3} id="bio" label="Who" className="ab-bio has-ambient">
                <Ambient kind="waves" />
                <div className="ab-bio-text" ref={bioRef}>
                    {BIO.map((para, pi) => (
                        <p key={pi}>
                            {para.map(([text, fact], si) => fact ? (
                                <span
                                    key={si} role="button" tabIndex={0} className="ab-chip"
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); say(fact) } }}
                                    style={{ '--k': pi + si }}
                                    onPointerEnter={() => !isTouch() && say(fact)}
                                    onClick={() => say(fact)}
                                >
                                    {text.split(' ').map((word, k, all) => <span key={k} className="ab-w" style={{ '--i': w++ }}>{word}{k < all.length - 1 ? ' ' : ''}</span>)}
                                </span>
                            ) : (
                                text.split(/(\s+)/).filter(Boolean).map((word, k) => /^\s+$/.test(word) ? word : <span key={`${si}-${k}`} className="ab-w" style={{ '--i': w++ }}>{word}</span>)
                            ))}
                        </p>
                    ))}
                </div>
            </Chapter>

            {/* 03 · journey */}
            <section className="ab-ch ab-journey" data-chapter="journey" id="about-journey" ref={jourRef} style={{ '--stops': JOURNEY.length }}>
                <div className="ab-journey-stage">
                    <div className="ab-jl">
                        <p className="ab-kicker"><span>04</span>Journey</p>
                        <div className="ab-reel" aria-hidden>
                            <div className="ab-reel-strip">
                                {JOURNEY.map((s, i) => <span key={i}>{s.year}</span>)}
                            </div>
                        </div>
                        <ol className="ab-jl-list">
                            <span className="ab-jl-bar" aria-hidden><i /></span>
                            {JOURNEY.map((s, i) => (
                                <li key={i}>
                                    <button type="button" className="ab-jl-item" data-i={i}>
                                        <span className="ab-jl-co">{s.company}</span>
                                        <span className="ab-jl-role">{s.role}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="ab-stack">
                        {JOURNEY.map((s, i) => (
                            <article key={i} className="ab-stack-card" style={{ '--g0': s.grad[0], '--g1': s.grad[1], '--g2': s.grad[2], zIndex: i + 1 }}>
                                <span className="ab-stop-dots" aria-hidden />
                                <JourneyArt kind={s.art ?? i} grad={s.grad} />
                                <header>
                                    <span className="ab-stack-no">{String(i + 1).padStart(2, '0')} / {String(JOURNEY.length).padStart(2, '0')}</span>
                                    {s.now && <span className="ab-stop-now"><i />Now</span>}
                                </header>
                                <div className="ab-stack-body">
                                    <h3>{s.role}</h3>
                                    <p className="ab-stop-co">{s.company}</p>
                                    <p className="ab-stop-note">{s.note}</p>
                                    {s.tags && <div className="ab-stack-tags">{s.tags.map(t => <span key={t}>{t}</span>)}</div>}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 04 · skills */}
            <Chapter no={5} id="skills" label="Toolbox" className="ab-skills-ch">
                <h2 className="ab-h2" data-rise>What I work with</h2>
                <div data-rise><Skills groups={SKILLS} /></div>
            </Chapter>

            {/* 05 · kind words */}
            <section className="ab-ch ab-words-ch" data-chapter="words" id="about-words">
                <Clouds />
                <p className="ab-kicker" data-rise><span>06</span>Kind words</p>
                <div data-rise><Words words={WORDS} title={WORDS_TITLE} line={WORDS_LINE} /></div>
            </section>

            {/* 06 · outro */}
            <Chapter no={6} id="outro" className="ab-outro has-ambient">
                <Ambient kind="sun" />
                <p className="ab-kicker" data-rise><span>07</span>That's me</p>
                <h2 className="ab-big" data-rise>Your turn.</h2>
                <EmailLine />
                <div className="ab-outro-actions" data-rise>
                    <button type="button" className="ct-send ab-cta" onClick={openContact}>
                        <span className="ct-send-dots ct-send-dots--big" aria-hidden />
                        <span className="ct-send-dots ct-send-dots--small" aria-hidden />
                        <span className="ct-send-label">
                            Say hi
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M3 10h12.5M11 4.8l5.2 5.2-5.2 5.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                    </button>
                    <a className="ab-ghost" href={CV} download="Artem Diakunchak - CV.pdf">Download CV</a>
                    <button type="button" className="ab-ghost" onClick={() => goTo('/work')}>See all work</button>
                </div>
            </Chapter>
        </div>
    )
}
