import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { createAvatar } from './avatar'
import { avatarPalette, helperBox } from './avatarColors'
import './Intro.css'

/* ─────────────────────────────────────────────────────────
   Opening screen: a jelly avatar glitches into existence,
   then talks in a gooey speech bubble:
     Hi → I'm Artem → Product designer who translates your
     ideas into real products
   then glitches back out and the site appears.
   Click / Space / Enter speeds it up · Esc or "Skip" ends it.
   ───────────────────────────────────────────────────────── */

// each line has an expression for the eyes; `at` lets the expression change mid-line
const LINES = [
    { text: 'Hi', hold: 1.3, face: { happy: 1, open: 1.05 } },
    { text: "I'm Artem", hold: 1.5, twirl: true, face: { happy: 0.15, open: 1.22, tilt: -0.35 } },
    {
        text: 'Product designer who translates your ideas into real products', hold: 2.8,
        face: { happy: 0, open: 1, tilt: 0.25 },
        at: [
            { char: 21, face: { happy: 0, open: 0.82, tilt: 0.45 }, look: { x: 0.35, y: 0.55 } },   // "translates…" - thinking, glancing up
            { char: 48, face: { happy: 0.85, open: 1.1, tilt: 0 }, look: { x: 0, y: 0 } },          // "real products" - beaming
        ],
    },
    { text: 'Welcome!', hold: 1.5, face: { happy: 1, open: 1.1 }, hop: true },
]

const CPS = 15                   // typing speed, characters per second
const VOWEL = /[aeiouyAEIOUY]/

export default function Intro({ onExit, onComplete }) {
    const rootRef = useRef(null)
    const canvasRef = useRef(null)
    const bubbleRef = useRef(null)
    const bodyRef = useRef(null)
    const tailRef = useRef(null)
    const textRef = useRef(null)
    const measureRef = useRef(null)
    const doneRef = useRef(false)
    const stageRef = useRef(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        let avatar = null
        try {
            avatar = createAvatar(canvasRef.current, avatarPalette())
        } catch (e) {
            console.warn('Intro avatar unavailable', e)
            setFailed(true)
        }

        if (import.meta.env.DEV) window.__introAvatar = avatar     // dev only: inspect states
        let speed = reduce ? 3 : 1
        const timers = new Set()
        const wait = (s) => new Promise(res => { const id = setTimeout(() => { timers.delete(id); res() }, (s * 1000) / speed); timers.add(id) })
        let cancelled = false

        // ── the avatar watches the cursor
        const onMove = (e) => {
            if (!avatar || !canvasRef.current) return
            const r = canvasRef.current.getBoundingClientRect()
            const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)
            const y = -(e.clientY - (r.top + r.height * 0.45)) / (window.innerHeight / 2)
            if (lookHold) return
            avatar.state.lookT.x = Math.max(-1, Math.min(1, x * 1.2))
            avatar.state.lookT.y = Math.max(-1, Math.min(1, y * 1.2))
        }
        window.addEventListener('pointermove', onMove)
        // recolour live when the palette or theme switches
        const onColours = () => avatar?.setPalette(avatarPalette())
        window.addEventListener('palettechange', onColours)
        window.addEventListener('themechange', onColours)
        let lookHold = null          // a scripted glance overrides the cursor for a moment

        // ── finish (also used by skip)
        const finish = () => {
            if (doneRef.current) return
            doneRef.current = true
            cancelled = true
            timers.forEach(clearTimeout)
            onExit?.()
            const root = rootRef.current
            const stage = stageRef.current
            root.style.pointerEvents = 'none'
            const tl = gsap.timeline({ onComplete: () => onComplete?.() })
            tl.to(bubbleRef.current, { scale: 0, opacity: 0, transformOrigin: '50% 100%', duration: 0.35, ease: 'back.in(2)' }, 0)
            tl.to(root.querySelector('.intro-skip'), { opacity: 0, duration: 0.2 }, 0)
            tl.to(root, { '--intro-bg': 0, duration: 0.8, ease: 'power2.inOut' }, 0.15)
            if (avatar && stage) {
                // the mascot shrinks and flies into the bottom-right corner, where it stays as the helper
                avatar.express({ happy: 1 })
                avatar.hop(0.7)
                const r = stage.getBoundingClientRect()
                const box = helperBox()
                const tx = window.innerWidth - box.right - box.size / 2
                const ty = window.innerHeight - box.bottom - box.size / 2
                tl.to(stage, {
                    x: tx - (r.left + r.width / 2),
                    y: ty - (r.top + r.height / 2),
                    scale: box.size / r.width,
                    duration: 1.05,
                    ease: 'power3.inOut',
                    onComplete: () => avatar.express({ happy: 0 }),
                }, 0.2)
                // a full turn while it flies, so you see it's a real 3D thing
                tl.fromTo(avatar.state, { spin: 0 }, { spin: Math.PI * 2, idle: 0.55, duration: 1.15, ease: 'power2.inOut', immediateRender: false }, 0.15)   // ends at the helper's sway, so the hand-off is seamless
            } else {
                tl.to(root, { opacity: 0, duration: 0.45 }, 0.3)
            }
        }

        // ── bubble: morph its size to fit the next line, then type the line
        const setLine = async ({ text, face, at = [] }) => {
            const m = measureRef.current
            m.textContent = text
            const w = Math.ceil(m.offsetWidth) + 1
            const h = Math.ceil(m.offsetHeight)
            const padX = 22, padY = 14
            const body = bodyRef.current

            // clear the old text with a quick blur-out
            const old = textRef.current.querySelectorAll('span')
            if (old.length) {
                gsap.to(old, { opacity: 0, filter: 'blur(5px)', y: -4, duration: 0.18, stagger: 0.004, ease: 'power2.in' })
                await wait(0.16)
            }
            if (cancelled) return

            // goo morph: the bubble stretches/squashes into its new size
            gsap.to(body, { width: w + padX * 2, height: h + padY * 2, duration: 0.75 / speed, ease: 'elastic.out(1, 0.55)' })
            gsap.fromTo(tailRef.current.children, { scale: 0.6 }, { scale: 1, duration: 0.6 / speed, ease: 'elastic.out(1.2, 0.4)', stagger: 0.05 })
            textRef.current.style.width = `${w}px`
            textRef.current.innerHTML = ''
            const spans = [...text].map(ch => {
                const s = document.createElement('span')
                s.textContent = ch
                s.style.opacity = '0'
                textRef.current.appendChild(s)
                return s
            })
            avatar?.hop(text.length < 4 ? 0.8 : 0.45)
            avatar?.express(face)
            await wait(0.12)

            // type, moving the mouth on each syllable
            for (let i = 0; i < spans.length && !cancelled; i++) {
                const ch = text[i]
                const cue = at.find(c => c.char === i)
                if (cue && avatar) {
                    avatar.express(cue.face)
                    if (cue.look) {
                        lookHold = cue.look
                        avatar.state.lookT.x = cue.look.x
                        avatar.state.lookT.y = cue.look.y
                        if (cue.look.x === 0 && cue.look.y === 0) lookHold = null
                    }
                }
                gsap.fromTo(spans[i], { opacity: 0, filter: 'blur(6px)', y: 5 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.32, ease: 'power3.out' })
                // the eyes "speak": a bounce on each vowel, a little one on other letters
                if (avatar && ch !== ' ') avatar.syllable(VOWEL.test(ch) ? 0.45 + Math.random() * 0.2 : 0.06)
                await wait(ch === ' ' ? 2.2 / CPS : /[,.]/.test(ch) ? 4 / CPS : 1 / CPS)
            }
        }

        // ── the sequence
        const run = async () => {
            await wait(0.25)
            if (avatar) avatar.state.idle = 1                    // sways and floats the whole time
            if (avatar) {
                // glitchy pixel reveal (stepped, so it reads as digital)
                avatar.express({ open: 1.35 })                       // wakes up wide-eyed…
                await new Promise(res => gsap.to(avatar.state, { reveal: 1, duration: 1.3 / speed, ease: 'steps(14)', onComplete: res }))
                avatar.hop(1)
                await wait(0.25)
                avatar.express({ open: 1 })                          // …and settles
            }
            await wait(0.35)
            if (cancelled) return
            gsap.fromTo(bubbleRef.current,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, transformOrigin: '50% 100%', duration: 0.6 / speed, ease: 'elastic.out(1, 0.55)' })
            for (const line of LINES) {
                if (cancelled) return
                // a little hop as each line starts, a full turn when it introduces itself
                avatar?.hop(line.hop ? 0 : 0.45)
                if (line.twirl && avatar) gsap.fromTo(avatar.state, { spin: 0 }, { spin: Math.PI * 2, duration: 1.2, ease: 'power2.inOut' })
                await setLine(line)
                if (line.hop) avatar?.hop(1.1)
                avatar?.express({ ...line.face, ...(line.at?.length ? line.at[line.at.length - 1].face : {}) })
                await wait(line.hold)
            }
            if (!cancelled) finish()
        }
        run()

        // ── controls
        const onKey = (e) => {
            if (e.key === 'Escape') finish()
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); speed = 3 }
        }
        const onDown = (e) => {
            if (e.target.closest?.('.intro-skip')) return
            avatar?.boop()
            speed = Math.min(speed + 1, 3)
        }
        window.addEventListener('keydown', onKey)
        rootRef.current.addEventListener('pointerdown', onDown)
        const root = rootRef.current
        rootRef.current.__finish = finish

        return () => {
            cancelled = true
            timers.forEach(clearTimeout)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('palettechange', onColours)
            window.removeEventListener('themechange', onColours)
            window.removeEventListener('keydown', onKey)
            root.removeEventListener('pointerdown', onDown)
            avatar?.destroy()
        }
    }, [onComplete, onExit])

    return (
        <div ref={rootRef} className="intro" role="dialog" aria-label="Intro">
            {/* gooey filter for the bubble */}
            <svg width="0" height="0" className="intro-defs" aria-hidden>
                <defs>
                    <filter id="intro-goo" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
                        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g" />
                        <feComposite in="SourceGraphic" in2="g" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <div className="intro-stage" ref={stageRef}>
                <div className="intro-bubble" ref={bubbleRef} style={{ opacity: 0 }}>
                    <div className="intro-goo" aria-hidden>
                        <span className="intro-bubble-body" ref={bodyRef} />
                        <span className="intro-tail" ref={tailRef}>
                            <i /><i /><i />
                        </span>
                    </div>
                    <p className="intro-text" ref={textRef} aria-live="polite" />
                    <span className="intro-measure" ref={measureRef} aria-hidden />
                </div>

                {failed
                    ? <div className="intro-fallback" aria-hidden />
                    : <canvas className="intro-avatar" ref={canvasRef} aria-hidden />}
            </div>

            <button className="intro-skip" onClick={() => rootRef.current?.__finish?.()}>Skip</button>
        </div>
    )
}
