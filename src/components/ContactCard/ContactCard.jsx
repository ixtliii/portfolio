import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { createAvatar } from '../Intro/avatar'
import { helperBox } from '../Intro/avatarColors'
import { getLenis } from '../../lib/scroll'
import { submitMessage } from '../../lib/contact'
import { isTouch, isSmall } from '../../lib/perf'
import './ContactCard.css'

if (import.meta.env.DEV && typeof window !== 'undefined') window.__gsap = gsap   // dev only: slow motion for inspection

/* ─────────────────────────────────────────────────────────
   The contact card. Opens from the helper's "Contact me":
   the whole page scales back and dissolves while the card
   rises out of the depth. The card is a collectible: the
   mascot rendered as dot-matrix art over a living, dithered
   gradient, numbered like an edition. It tilts in 3D with the
   pointer. On send the card itself flies into the helper's
   mouth and gets eaten - and the next card rises up with a
   new gradient and a new face.
   ───────────────────────────────────────────────────────── */

const CARDS = [
    { grad: ['#f1fff4', '#b6ebc6', '#62b884'], face: { happy: 0, open: 1.05, tilt: 0 }, title: 'Say hi.', line: 'A direct line to me' },
    { grad: ['#f9f2ff', '#d4c0ff', '#8e72dc'], face: { happy: 1, open: 1, tilt: 0 }, title: 'Another one?', line: 'I read every single one' },
    { grad: ['#fff6ec', '#ffcca3', '#e3875a'], face: { happy: 0, open: 1.32, tilt: -0.35 }, title: 'Oh, hello again.', line: 'Third time’s the charm' },
    { grad: ['#f0f9ff', '#b3dcff', '#6399e0'], face: { happy: 0, open: 0.82, tilt: 0.45 }, title: 'Still curious?', line: 'Ask me anything' },
]
const CELL = 7                       // px per dot
const KEY = 'ad-sent'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const sent = () => { try { return +localStorage.getItem(KEY) || 0 } catch { return 0 } }

export default function ContactCard() {
    const [open, setOpen] = useState(false)
    const [v, setV] = useState(0)                         // which card in the deck
    const [form, setForm] = useState({ name: '', email: '', message: '' })
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)

    const rootRef = useRef(null)
    const cardRef = useRef(null)
    const artRef = useRef(null)
    const fieldsRef = useRef(null)
    const sendRef = useRef(null)
    const avRef = useRef(null)
    const tlRef = useRef(null)
    const card = CARDS[v % CARDS.length]

    // ── open / close: the page recedes, the card rises
    const show = useCallback(() => {
        if (open) return
        setOpen(true)
        window.dispatchEvent(new CustomEvent('contact:state', { detail: { open: true } }))   // the helper switches its menu
    }, [open])

    useEffect(() => {
        const on = () => show()
        window.addEventListener('contact:open', on)
        return () => window.removeEventListener('contact:open', on)
    }, [show])

    useEffect(() => {
        if (!open) return
        const shell = document.querySelector('.shell')
        const root = rootRef.current
        getLenis()?.stop()
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        tlRef.current?.kill()
        const tl = gsap.timeline()
        tlRef.current = tl
        if (shell) tl.to(shell, { scale: 0.84, y: -18, opacity: 0, filter: 'blur(10px)', borderRadius: 32, duration: reduce ? 0.01 : 1.1, ease: 'power3.inOut' }, 0)
        tl.to(root, { '--ct-bg': 1, duration: reduce ? 0.01 : 0.9, ease: 'power2.inOut' }, 0.25)
        tl.fromTo(cardRef.current,
            { y: 70, scale: 0.82, rotationX: 22, opacity: 0, filter: 'blur(14px)' },
            { y: 0, scale: 1, rotationX: 0, opacity: 1, filter: 'blur(0px)', duration: reduce ? 0.01 : 1.2, ease: 'expo.out' }, 0.38)
        tl.fromTo(root.querySelector('.ct-close'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.9)
        tl.add(() => { document.documentElement.dataset.contact = 'open' })        // the page is gone: stop drawing it
        // desktop: jump straight into the name field (on phones that would throw the keyboard up mid-animation)
        if (!isTouch()) setTimeout(() => root.querySelector('input')?.focus({ preventScroll: true }), 900)
    }, [open])

    const close = useCallback(() => {
        if (!open || busy) return
        const shell = document.querySelector('.shell')
        delete document.documentElement.dataset.contact
        window.dispatchEvent(new CustomEvent('contact:state', { detail: { open: false } }))
        tlRef.current?.kill()
        const tl = gsap.timeline({
            onComplete: () => {
                setOpen(false)
                if (shell) gsap.set(shell, { clearProps: 'transform,opacity,filter,borderRadius' })
                getLenis()?.start()
            },
        })
        tlRef.current = tl
        tl.to(rootRef.current.querySelector('.ct-close'), { opacity: 0, scale: 0.6, duration: 0.2 }, 0)
        tl.to(cardRef.current, { y: 60, scale: 0.86, rotationX: -14, opacity: 0, filter: 'blur(12px)', duration: 0.6, ease: 'power3.in' }, 0)
        tl.to(rootRef.current, { '--ct-bg': 0, duration: 0.7, ease: 'power2.inOut' }, 0.2)
        if (shell) tl.to(shell, { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)', borderRadius: 0, duration: 1, ease: 'power3.inOut' }, 0.25)
    }, [open, busy])

    // the helper's menu can close the card or clear the form
    useEffect(() => {
        const onClose = () => close()
        const onClear = () => {
            setForm({ name: '', email: '', message: '' }); setErr('')
            const ta = rootRef.current?.querySelector('textarea'); if (ta) ta.style.height = ''
            avRef.current?.express({ open: 1.3 }); setTimeout(() => avRef.current?.express(card.face), 500)
        }
        window.addEventListener('contact:close', onClose)
        window.addEventListener('contact:clear', onClear)
        return () => { window.removeEventListener('contact:close', onClose); window.removeEventListener('contact:clear', onClear) }
    }, [close, card])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') close() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, close])

    // ── the card art (the mascot as dot-matrix)
    useEffect(() => {
        if (!open) return
        const c = artRef.current
        const fit = () => {
            // the canvas is an exact multiple of the dot size, so pixels and dots line up
            const r = cardRef.current.getBoundingClientRect()
            const w = Math.ceil(cardRef.current.offsetWidth / CELL) * CELL, h = Math.ceil(cardRef.current.offsetHeight / CELL) * CELL
            c.style.width = w + 'px'; c.style.height = h + 'px'
            return r
        }
        fit()
        let av
        try {
            av = createAvatar(c, { a: '#ffffff', b: '#d0d0d4', c: '#8f8f95', ink: '#111112' }, { card: true, cell: CELL, cam: isSmall() ? [0.2, 0.42, 0.9] : [0.4, 0.2, 0.78], gradient: card.grad })
        } catch (e) { console.warn('card art unavailable', e); return }
        av.state.reveal = 1
        av.state.idle = 0.4
        av.express(card.face)
        avRef.current = av
        window.addEventListener('resize', fit)
        return () => { window.removeEventListener('resize', fit); av.destroy(); avRef.current = null }
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    // new card in the deck → new gradient + face
    useEffect(() => {
        const av = avRef.current
        if (!av) return
        av.setGradient(card.grad)
        av.express(card.face)
        av.hop(0.6)
    }, [v]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── 3D tilt + glare + the card mascot watching the pointer
    useEffect(() => {
        if (!open) return
        const el = cardRef.current
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' })
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' })
        const onMove = (e) => {
            if (busy) return
            const r = el.getBoundingClientRect()
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
            const cx = Math.max(-0.5, Math.min(1.5, x)), cy = Math.max(-0.5, Math.min(1.5, y))
            rx(-(cy - 0.5) * 9)
            ry((cx - 0.5) * 12)
            el.style.setProperty('--gx', `${(cx * 100).toFixed(1)}%`)
            el.style.setProperty('--gy', `${(cy * 100).toFixed(1)}%`)
            const av = avRef.current
            if (av) { av.state.lookT.x = (cx - 0.66) * 2; av.state.lookT.y = -(cy - 0.55) * 2 }
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
    }, [open, busy])

    // ── typing: the card mascot's eyes bounce along
    const onChange = (k) => (e) => {
        setForm(f => ({ ...f, [k]: e.target.value }))
        setErr('')
        avRef.current?.syllable(0.35 + Math.random() * 0.2)
        if (k === 'message') { e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px' }
    }

    const shake = (sel) => {
        const el = rootRef.current.querySelector(sel)
        if (el) gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-8, 7, -5, 3, 0] }, duration: 0.45, ease: 'power2.out' })
        el?.querySelector('input,textarea')?.focus()
    }

    // ── send: fold into an envelope → fly to the helper → it eats it → next card
    const onSubmit = async (e) => {
        e.preventDefault()
        if (busy) return
        const name = form.name.trim(), email = form.email.trim(), message = form.message.trim()
        if (!name) { setErr('What should he call you?'); shake('.ct-pill--name'); return }
        if (!EMAIL_RE.test(email)) { setErr('He needs an email to write back.'); shake('.ct-pill--email'); return }
        if (message.length < 2) { setErr('Say a little something first.'); shake('.ct-pill--msg'); return }
        setBusy(true)

        const send = submitMessage({ name, email, message })
        const box = helperBox()
        const tx = window.innerWidth - box.right - box.size / 2
        const ty = window.innerHeight - box.bottom - box.size * 0.55
        const el = cardRef.current
        const rc = el.getBoundingClientRect()
        const dx = tx - (rc.left + rc.width / 2), dy = ty - (rc.top + rc.height / 2)

        // the card itself is the snack: picked up, wobbles, then sucked into the helper's mouth
        await new Promise(res => {
            const tl = gsap.timeline({ onComplete: res })
            tl.to(rootRef.current.querySelector('.ct-close'), { opacity: 0, scale: 0.6, duration: 0.2 }, 0)
            tl.to(el, { rotationX: 0, rotationY: 0, duration: 0.25 }, 0)
            tl.to(el, { scaleX: 1.04, scaleY: 0.93, duration: 0.2, ease: 'power2.out' }, 0.05)
            tl.to(el, { y: -26, scaleX: 0.95, scaleY: 1.04, rotation: -3, duration: 0.32, ease: 'power2.out' }, 0.25)
            tl.add(() => window.dispatchEvent(new CustomEvent('helper:eat-start')), 0.4)
            tl.to(el, { x: dx, duration: 1.05, ease: 'power2.inOut' }, 0.55)
            tl.to(el, { y: dy, duration: 1.05, ease: 'back.in(1.3)' }, 0.55)
            tl.to(el, { scale: 0.05, rotation: 24, rotationY: -30, duration: 1.05, ease: 'power3.in' }, 0.55)
            tl.to(el, { opacity: 0, duration: 0.14 }, 1.48)
            tl.add(() => window.dispatchEvent(new CustomEvent('helper:eat-end')), 1.55)
        })

        const r = await send
        if (!r.ok) {
            window.dispatchEvent(new CustomEvent('helper:say', { detail: { text: "Hmm, that one didn't go through. Try again, or write to me at artem.diakunchak.work@gmail.com" } }))
            gsap.set(cardRef.current, { x: 0, y: 0, rotation: 0, rotationY: 0 })
            gsap.fromTo(cardRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.7)' })
            gsap.to(rootRef.current.querySelector('.ct-close'), { opacity: 1, scale: 1, duration: 0.3 })
            setBusy(false)
            return
        }
        try { localStorage.setItem(KEY, String(sent() + 1)) } catch { /* ignore */ }
        await new Promise(r2 => setTimeout(r2, 1100))           // let it chew

        // the next card rises out of the depth, like the first one
        setForm({ name: '', email: '', message: '' })
        const ta = rootRef.current.querySelector('textarea'); if (ta) ta.style.height = ''
        setV(x => x + 1)
        gsap.set(cardRef.current, { x: 0, rotation: 0, rotationY: 0 })
        gsap.fromTo(cardRef.current,
            { y: 70, scale: 0.82, rotationX: 22, opacity: 0, filter: 'blur(14px)' },
            { y: 0, scale: 1, rotationX: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', onComplete: () => setBusy(false) })
        gsap.to(rootRef.current.querySelector('.ct-close'), { opacity: 1, scale: 1, duration: 0.4, delay: 0.6, ease: 'back.out(2)' })
    }

    return (
        <div ref={rootRef} className={`ct${open ? ' is-open' : ''}`} aria-hidden={!open} onPointerDown={(e) => { if (e.target === rootRef.current) close() }}>
            {open && (
                <>
                    <button className="ct-close" onClick={close} aria-label="Close the contact card">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <div className="ct-stage">
                        <form
                            ref={cardRef}
                            className="ct-card"
                            onSubmit={onSubmit}
                            noValidate
                            role="dialog"
                            aria-label="Write to Artem"
                            style={{ '--g1': card.grad[0], '--g2': card.grad[1], '--g3': card.grad[2] }}
                        >
                            <canvas ref={artRef} className="ct-art" aria-hidden />
                            <span className="ct-glare" aria-hidden />

                            <header className="ct-head">
                                <span className="ct-badge" aria-hidden><i /><i /></span>
                                <span className="ct-who">Artem Diakunchak</span>
                            </header>

                            <h2 className="ct-title">{card.title}</h2>
                            <p className="ct-meta">
                                <span className="ct-dot" aria-hidden />
                                <span>{err || `${card.line} · I usually reply within a day`}</span>
                            </p>

                            <div className="ct-fields" ref={fieldsRef}>
                                <label className="ct-pill ct-pill--name">
                                    <span className="sr-only">Your name</span>
                                    <input value={form.name} onChange={onChange('name')} placeholder="Your name" autoComplete="name" disabled={busy} />
                                </label>
                                <label className="ct-pill ct-pill--email">
                                    <span className="sr-only">Your email</span>
                                    <input type="email" value={form.email} onChange={onChange('email')} placeholder="you@email.com" autoComplete="email" disabled={busy} />
                                </label>
                                <label className="ct-pill ct-pill--msg">
                                    <span className="sr-only">Message</span>
                                    <textarea rows={2} value={form.message} onChange={onChange('message')} placeholder="What's on your mind?" disabled={busy} />
                                </label>
                                {/* the call to action: black, with halftone dots glowing in from both ends */}
                                <button ref={sendRef} className="ct-send" type="submit" disabled={busy}>
                                    <span className="ct-send-dots ct-send-dots--big" aria-hidden />
                                    <span className="ct-send-dots ct-send-dots--small" aria-hidden />
                                    <span className="ct-send-label">
                                        {/* filled + rounded, like the rest of the icon set */}
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                                            <path d="M3.6 2.4c-1-.45-2.02.57-1.56 1.56l2.52 5.43c.17.38.17.8 0 1.18l-2.52 5.43c-.46.99.57 2 1.56 1.56l13.6-6.27c.98-.45.98-1.84 0-2.29L3.6 2.4Z" fill="currentColor" />
                                        </svg>
                                        Send message
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}
