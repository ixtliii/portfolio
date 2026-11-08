import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { createAvatar } from '../Intro/avatar'
import { avatarPalette, helperBox } from '../Intro/avatarColors'
import { useTheme } from '../../lib/theme'
import { scrollToY, scrollToEl } from '../../lib/scroll'
import { goTo } from '../../lib/transition'
import { openContact } from '../../lib/contact'
import { isTouch } from '../../lib/perf'
import HelperNav, { NextIcon, PrevIcon, OpenIcon, FirstIcon, TopIcon, MoonIcon, DownloadIcon, CloseIcon, ClearIcon } from './HelperNav'
import { WorksIcon, MailIcon, SunIcon, AboutIcon } from '../Shell/icons'
import './Helper.css'

/* ─────────────────────────────────────────────────────────
   The little helper: the intro mascot, living in the
   bottom-right corner. It watches the cursor, reacts when
   the project changes, drops the odd hint, and opens a
   small menu when clicked to get around the site.

   Talks to the archive through window events:
     → helper:go { to: 'next' | 'prev' | 'first' | index }
     → helper:open        (open the current project)
     → helper:hello       (ask the archive where we are)
     ← projectchange { index, total, title }
   ───────────────────────────────────────────────────────── */

const VOWEL = /[aeiouy]/i
const CV = `${import.meta.env.BASE_URL}Artem_Diakunchak-CV.pdf`
const ABOUT = "I'm Artem, a product designer who also builds. I've shipped a 50+ component design system, an app redesign in 60+ regions and a Three.js street installation."

// a full turn around its own axis
const twirl = (av) => av && gsap.fromTo(av.state, { spin: 0 }, { spin: Math.PI * 2, duration: 1.1, ease: 'power2.inOut', overwrite: true })

export default function Helper({ arrived = false, visible = true }) {
    const canvasRef = useRef(null)
    const avatarRef = useRef(null)
    const bubbleRef = useRef(null)
    const rootRef = useRef(null)
    const typing = useRef(null)
    const hideT = useRef(null)
    const lastAct = useRef(performance.now())

    const [open, setOpen] = useState(false)
    const [text, setText] = useState('')          // what it's saying (typed out)
    const [shown, setShown] = useState(false)     // bubble visible
    const [proj, setProj] = useState({ index: 0, total: 1, title: '' })
    const [failed, setFailed] = useState(false)
    const [inContact, setInContact] = useState(false)   // the contact card is up: the menu is about it

    const { theme, toggle } = useTheme()
    const location = useLocation()
    const onHome = location.pathname === '/'

    // ── the avatar
    useEffect(() => {
        let av
        try { av = createAvatar(canvasRef.current, avatarPalette()) } catch (e) { console.warn('Helper avatar unavailable', e); setFailed(true); return }
        avatarRef.current = av
        av.state.idle = 0.55                          // a gentle sway, so it always looks alive
        if (import.meta.env.DEV) window.__helper = av
        if (arrived) {
            av.state.reveal = 1                       // it flew in from the intro: already there
            av.express({ happy: 1 })
            setTimeout(() => av.express({}), 900)
        } else {
            gsap.to(av.state, { reveal: 1, duration: 1, delay: 0.3, ease: 'steps(12)', onComplete: () => { av.hop(0.8); twirl(av) } })
        }
        const onMove = (e) => {
            const r = canvasRef.current?.getBoundingClientRect()
            if (!r || av.__hold) return
            av.state.lookT.x = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * 1.4))
            av.state.lookT.y = Math.max(-1, Math.min(1, (-(e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)) * 1.4))
            lastAct.current = performance.now()
        }
        const onTheme = () => av.setPalette(avatarPalette())
        window.addEventListener('pointermove', onMove)
        window.addEventListener('themechange', onTheme)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('themechange', onTheme)
            av.destroy()
            avatarRef.current = null
        }
    }, [arrived])

    // ── speaking: type the text out, the eyes bounce on the vowels
    const say = useCallback((msg, { hold = 4.2, look = { x: -0.55, y: 0.45 } } = {}) => {
        const av = avatarRef.current
        clearInterval(typing.current)
        clearTimeout(hideT.current)
        setShown(true)
        setText('')
        if (av && look) { av.__hold = true; av.state.lookT.x = look.x; av.state.lookT.y = look.y }
        let i = 0
        typing.current = setInterval(() => {
            i++
            setText(msg.slice(0, i))
            const ch = msg[i - 1]
            if (av && ch && ch !== ' ') av.syllable(VOWEL.test(ch) ? 0.65 + Math.random() * 0.3 : 0.15)
            if (i >= msg.length) {
                clearInterval(typing.current)
                if (av) setTimeout(() => { av.__hold = false }, 700)
                if (hold) hideT.current = setTimeout(() => setShown(false), hold * 1000)
            }
        }, 42)
    }, [])

    // ── hints
    useEffect(() => {
        if (!visible) return
        const t = setTimeout(() => say(onHome ? `${isTouch() ? 'Swipe' : 'Scroll'} to browse my work. ${isTouch() ? 'Tap' : 'Click'} me if you need a hand.` : `${isTouch() ? 'Tap' : 'Click'} me to get back to the work.`, { hold: 5 }), arrived ? 900 : 1600)
        return () => clearTimeout(t)
    }, [visible, onHome, arrived, say])

    useEffect(() => {
        const onProject = (e) => {
            const d = e.detail || {}
            setProj(p => {
                if (p.index !== d.index && avatarRef.current) {
                    avatarRef.current.hop(0.45)
                    if (d.index === d.total - 1 && !open && !document.documentElement.dataset.contact) setTimeout(() => say("That's the last one for now. Click a block to open it."), 700)
                }
                return { index: d.index ?? 0, total: d.total ?? 1, title: d.title || '' }
            })
            lastAct.current = performance.now()
        }
        window.addEventListener('projectchange', onProject)
        window.dispatchEvent(new CustomEvent('helper:hello'))      // ask where we are (after listening)
        return () => window.removeEventListener('projectchange', onProject)
    }, [open, say])

    // page change: it twirls while the pixels carry you across
    useEffect(() => {
        const onGo = () => { const av = avatarRef.current; if (av) { av.hop(0.6); twirl(av) } }
        window.addEventListener('pagego', onGo)
        return () => window.removeEventListener('pagego', onGo)
    }, [])

    // follow the contact card, so the menu (and hints) match what's on screen
    useEffect(() => {
        const on = (e) => { setInContact(!!e.detail?.open); setOpen(false) }
        window.addEventListener('contact:state', on)
        return () => window.removeEventListener('contact:state', on)
    }, [])

    // the contact card: greet, then eat the mail when it's sent
    useEffect(() => {
        const timers = []
        const later = (fn, ms) => timers.push(setTimeout(fn, ms))
        const onOpen = () => later(() => say('Write him something nice. I’ll deliver it.', { hold: 3.6, look: { x: -0.6, y: 0.5 } }), 1300)
        const onStart = () => {
            const av = avatarRef.current
            if (!av) return
            clearTimeout(hideT.current); setShown(false)
            av.__hold = true
            av.state.lookT.x = -0.8; av.state.lookT.y = 0.7      // eyes on the incoming envelope
            av.express({ open: 1.35 })
            av.mouth(1)
            av.state.squashT = -0.35                               // leans back, mouth wide
        }
        const onEnd = () => {
            const av = avatarRef.current
            if (!av) return
            av.mouth(0)                                            // chomp
            av.state.squashT = 0
            av.boop()
            later(() => { av.mouth(0.4); av.syllable(0.6) }, 220)  // chew…
            later(() => { av.mouth(0); av.boop() }, 380)
            later(() => { av.mouth(0.35) }, 560)
            later(() => { av.mouth(0); av.express({ happy: 1 }); av.hop(0.9); twirl(av) }, 720)
            later(() => say('Yum! Delivered straight to Artem.', { hold: 3, look: { x: -0.5, y: 0.4 } }), 1100)
            later(() => { av.express({}); av.__hold = false }, 4200)
        }
        const onSay = (e) => say(e.detail?.text || '', { hold: 3.5 })
        window.addEventListener('contact:open', onOpen)
        window.addEventListener('helper:eat-start', onStart)
        window.addEventListener('helper:eat-end', onEnd)
        window.addEventListener('helper:say', onSay)
        return () => {
            timers.forEach(clearTimeout)
            window.removeEventListener('contact:open', onOpen)
            window.removeEventListener('helper:eat-start', onStart)
            window.removeEventListener('helper:eat-end', onEnd)
            window.removeEventListener('helper:say', onSay)
        }
    }, [say])

    // a nudge when nothing has happened for a while
    useEffect(() => {
        const id = setInterval(() => {
            if (open || shown || document.querySelector('.ct.is-open')) return   // quiet while the contact card is up
            if (performance.now() - lastAct.current > 16000) {
                lastAct.current = performance.now()
                say(`Need a hand? ${isTouch() ? 'Tap' : 'Click'} me.`, { hold: 3.2 })
                twirl(avatarRef.current)
            }
        }, 2000)
        return () => clearInterval(id)
    }, [open, shown, say])

    // ── the menu
    const close = useCallback(() => {
        setOpen(false); setShown(false)
        if (avatarRef.current) avatarRef.current.__hold = false
    }, [])
    const toggleMenu = () => {
        const av = avatarRef.current
        av?.boop()
        lastAct.current = performance.now()
        if (open) { close(); return }
        clearInterval(typing.current)
        clearTimeout(hideT.current)
        setShown(false)
        setOpen(true)
        if (av) {
            av.express({ open: 1.25 }); setTimeout(() => av.express({}), 600)
            av.__hold = true; av.state.lookT.x = -0.35; av.state.lookT.y = 0.8      // looks up at the menu
        }
    }
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') close() }
        const onDown = (e) => { if (!rootRef.current?.contains(e.target)) close() }
        window.addEventListener('keydown', onKey)
        window.addEventListener('pointerdown', onDown)
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
    }, [open, close])

    const act = (fn, reply, hold = 2.4) => () => {
        fn()
        setOpen(false)
        if (avatarRef.current) avatarRef.current.__hold = false
        avatarRef.current?.express({ happy: 1 })
        setTimeout(() => avatarRef.current?.express({}), 900)
        if (reply) say(reply, { hold })
        else setShown(false)
    }
    const go = (to) => window.dispatchEvent(new CustomEvent('helper:go', { detail: { to } }))

    // other pages: about (told by the mascot until the About page is back), contact, CV
    const about = { Icon: AboutIcon, label: 'About me', run: act(() => {}, ABOUT, 9) }
    const contact = { Icon: MailIcon, label: 'Contact me', run: act(openContact) }
    const cv = { Icon: DownloadIcon, label: 'Download CV', href: CV, download: 'Artem Diakunchak — CV.pdf' }
    const lights = { Icon: theme === 'dark' ? SunIcon : MoonIcon, label: theme === 'dark' ? 'Lights on' : 'Lights off', run: act(toggle, theme === 'dark' ? 'Much better.' : 'Cosy.') }

    const nextSection = () => {
        const hs = Array.from(document.querySelectorAll('.cs-content h1[id], .cs-content h2[id]'))
        const h = hs.find(el => el.getBoundingClientRect().top > 90)
        if (h) scrollToEl(h, { offset: -24, duration: 1.1 })
    }

    const groups = (inContact
        ? [
            { label: 'This card', items: [
                { Icon: CloseIcon, label: onHome ? 'Back to the work' : 'Back to the case study', run: act(() => window.dispatchEvent(new CustomEvent('contact:close'))) },
                { Icon: ClearIcon, label: 'Clear the form', run: act(() => window.dispatchEvent(new CustomEvent('contact:clear')), 'Fresh start.') },
            ] },
            { label: 'Other pages', items: [about, cv] },
            { label: 'Display', items: [lights] },
        ]
        : onHome
        ? [
            { label: 'This page', items: [
                proj.index < proj.total - 1 && { Icon: NextIcon, label: 'Next project', run: act(() => go('next'), 'Here you go!') },
                proj.index > 0 && { Icon: PrevIcon, label: 'Previous project', run: act(() => go('prev')) },
                { Icon: OpenIcon, label: proj.title ? `Open ${proj.title}` : 'Open this project', run: act(() => window.dispatchEvent(new CustomEvent('helper:open'))) },
                proj.index > 1 && { Icon: FirstIcon, label: 'Back to the first one', run: act(() => go('first')) },
            ] },
            { label: 'Other pages', items: [about, contact, cv] },
            { label: 'Display', items: [lights] },
        ]
        : [
            { label: 'This page', items: [
                { Icon: NextIcon, label: 'Next section', run: act(nextSection) },
                { Icon: TopIcon, label: 'Back to top', run: act(() => scrollToY(0, { duration: 1.2 })) },
            ] },
            { label: 'Other pages', items: [{ Icon: WorksIcon, label: 'All work', run: act(() => goTo('/')) }, about, contact, cv] },
            { label: 'Display', items: [lights] },
        ]
    ).map(g => ({ ...g, items: g.items.filter(Boolean) })).filter(g => g.items.length)

    // bubble pop
    useEffect(() => {
        const el = bubbleRef.current
        if (!el) return
        gsap.killTweensOf(el)
        if (shown) gsap.fromTo(el, { scale: 0.4, opacity: 0, filter: 'blur(4px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'elastic.out(1, 0.6)', transformOrigin: '88% 100%' })
        else gsap.to(el, { scale: 0.6, opacity: 0, duration: 0.22, ease: 'power2.in', transformOrigin: '88% 100%' })
    }, [shown])

    const box = helperBox()
    return (
        <div
            ref={rootRef}
            className="hp"
            style={{ '--hp-size': `${box.size}px`, right: box.right, bottom: box.bottom, opacity: visible ? 1 : 0 }}
        >
            <div ref={bubbleRef} className="hp-bubble" style={{ opacity: 0 }} aria-live="polite">
                <p className="hp-text">{text}</p>
                <span className="hp-tail" aria-hidden><i /><i /></span>
            </div>
            {open && <HelperNav groups={groups} onRun={(it) => (it.href ? close() : it.run())} />}
            {/* always-visible cue: the mascot is the way around the site */}
            <button className={`hp-tag${shown || open ? ' is-hidden' : ''}`} onClick={toggleMenu} tabIndex={-1} aria-hidden>
                <span className="hp-tag-dot" />{isTouch() ? 'Tap me to navigate' : 'Click me to navigate'}
            </button>
            <button
                className="hp-btn"
                onClick={toggleMenu}
                aria-label={open ? 'Close the helper menu' : 'Open the helper menu'}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="hp-ring" aria-hidden />
                {failed ? <span className="hp-fallback" aria-hidden /> : <canvas ref={canvasRef} className="hp-canvas" aria-hidden />}
            </button>
        </div>
    )
}
