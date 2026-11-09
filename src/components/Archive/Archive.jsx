import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS, KIND_LABEL } from '../../projects'
import { getLenis, scrollToY, getScrollTop, getViewportHeight, offsetTopOf, topInView } from '../../lib/scroll'
import { createArchiveScene } from './scene'
import { goTo } from '../../lib/transition'
import './Archive.css'

gsap.registerPlugin(ScrollTrigger)

const asset = (p) => (p ? import.meta.env.BASE_URL + p.replace(/^\//, '') : p)
const pad = (n) => String(n).padStart(2, '0')

/* ─────────────────────────────────────────────────────────
   THE ARCHIVE - page scroll drives a WebGL track of project
   cards (see scene.js). This component owns scrolling,
   snapping, input and the HTML overlay.
   ───────────────────────────────────────────────────────── */

const SCROLL_PER = 0.5          // viewport-heights of scroll per project

// spring for the cards (per 60fps frame) - page scroll is already smoothed by Lenis
const STIFF = 0.11
const DAMP  = 0.7

export default function Archive() {
    const sectionRef = useRef(null)
    const stageRef   = useRef(null)
    const cursorRef  = useRef(null)
    const progRef    = useRef(null)
    const nameRef    = useRef(null)
    const sceneRef   = useRef(null)

    const target    = useRef(0)     // index driven by scroll (float)
    const current   = useRef(0)     // spring-smoothed index
    const velocity  = useRef(0)
    const lean      = useRef(0)
    const progress  = useRef(0)
    const activeRef = useRef(0)
    const endRef    = useRef(null)
    const pointer   = useRef({ x: 0, y: 0, cx: -1, cy: -1, sx: 0, sy: 0 })
    const hoverRef  = useRef(null)
    const drag      = useRef({ on: false, x: 0, moved: 0, v: 0 })

    const [active, setActive]   = useState(0)
    const [hovered, setHovered] = useState(false)

    // category filter: 'all' or a project kind (see KIND_LABEL in projects.js)
    const [filter, setFilter] = useState('all')
    const items = useMemo(
        () => PROJECTS.filter(p => filter === 'all' || p.kind === filter).map((p, i) => ({ ...p, no: pad(i + 1) })),
        [filter]
    )
    const filters = useMemo(() => [
        { id: 'all', label: 'All', count: PROJECTS.length },
        ...Object.entries(KIND_LABEL).map(([id, label]) => ({ id, label, count: PROJECTS.filter(p => p.kind === id).length })),
    ], [])
    const switching = useRef(false)
    const pickFilter = (id) => {
        if (id === filter || switching.current) return
        switching.current = true
        const stage = stageRef.current
        // the track dips out, the set is swapped, and it comes back from the first project
        gsap.to([stage, nameRef.current], {
            opacity: 0, filter: 'blur(6px)', duration: 0.28, ease: 'power2.in',
            onComplete: () => {
                const el = sectionRef.current
                scrollToY(el ? offsetTopOf(el) : 0, { immediate: true })
                target.current = current.current = velocity.current = 0
                activeRef.current = 0
                setActive(0)
                setFilter(id)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    ScrollTrigger.refresh()
                    gsap.to([stage, nameRef.current], { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', clearProps: 'filter' })
                    switching.current = false
                }))
            },
        })
    }
    const n = items.length
    const project = items[Math.min(active, n - 1)]

    /* ── section geometry helpers ── */
    const yForIndex = useCallback((i) => {
        const el = sectionRef.current
        if (!el) return 0
        const top = offsetTopOf(el)
        const range = el.offsetHeight - getViewportHeight()
        return top + (n > 1 ? (i / (n - 1)) * range : 0)
    }, [n])

    const scrollToIndex = useCallback((i, duration = 1.0) => {
        scrollToY(yForIndex(i), { duration })
    }, [yForIndex])

    /* ── scroll → index, plus a soft snap while the scroll eases out ── */
    useEffect(() => {
        const lenis = getLenis()
        const st = ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                target.current = self.progress * (n - 1)
                progress.current = self.progress
                if (progRef.current) progRef.current.style.transform = `scaleX(${self.progress})`
            },
            snap: !lenis && n > 1 ? { snapTo: 1 / (n - 1), duration: { min: 0.3, max: 0.7 }, delay: 0.1, ease: 'power3.out' } : false,
        })
        target.current = st.progress * (n - 1)
        current.current = target.current
        velocity.current = 0

        let snapping = false, timer
        const snap = (dir) => {
            if (drag.current.on || n < 2 || snapping) return
            const p = st.progress
            if (p <= 0.0005 || p >= 0.9995) return
            const f = p * (n - 1)
            const idx = dir > 0 ? Math.ceil(f - 0.3) : dir < 0 ? Math.floor(f + 0.3) : Math.round(f)
            const y = yForIndex(Math.max(0, Math.min(n - 1, idx)))
            if (Math.abs(y - getScrollTop()) < 2) return
            snapping = true
            getLenis()?.scrollTo(y, {
                duration: 0.7,
                easing: (t) => 1 - Math.pow(1 - t, 3),
                force: true,
                onComplete: () => { snapping = false },
            })
            setTimeout(() => { snapping = false }, 800)
        }
        const onScroll = (l) => {
            clearTimeout(timer)
            if (snapping) return
            if (Math.abs(l.velocity) < 1.2) snap(l.direction)
            else timer = setTimeout(() => snap(l.direction), 140)
        }
        lenis?.on('scroll', onScroll)
        ScrollTrigger.refresh()
        return () => {
            st.kill()
            clearTimeout(timer)
            lenis?.off('scroll', onScroll)
        }
    }, [n, yForIndex])

    /* ── WebGL scene + render loop ── */
    useEffect(() => {
        const stage = stageRef.current
        let scene
        try {
            scene = createArchiveScene(stage, items, { asset })
        } catch (err) {
            console.warn('Archive: WebGL unavailable', err)
            return
        }
        sceneRef.current = scene
        const onTheme = () => requestAnimationFrame(() => scene.setTheme())
        window.addEventListener('themechange', onTheme)
        window.addEventListener('palettechange', onTheme)

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        let visible = true
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
        io.observe(sectionRef.current)

        const ro = new ResizeObserver(() => scene.resize())
        ro.observe(stage)

        // frame-time watch: if frames keep running long, render at a lower resolution
        const perf = { sum: 0, n: 0, cooldown: 0 }
        const loop = (time, dtMs) => {
            const dt = Math.min(dtMs || 16.7, 50) / 16.7
            if (visible && document.visibilityState === 'visible' && dtMs < 200) {
                perf.sum += dtMs; perf.n++
                if (perf.n >= 90) {
                    if (perf.cooldown-- <= 0 && perf.sum / perf.n > 24 && scene.lowerDpr()) perf.cooldown = 2
                    perf.sum = 0; perf.n = 0
                }
            }
            if (reduce) {
                current.current = target.current; velocity.current = 0
            } else {
                velocity.current += (target.current - current.current) * STIFF * dt
                velocity.current *= Math.pow(DAMP, dt)
                current.current += velocity.current * dt
            }
            lean.current += (velocity.current - lean.current) * 0.14 * dt

            const p = pointer.current
            p.sx += (p.x - p.sx) * 0.05 * dt
            p.sy += (p.y - p.sy) * 0.05 * dt

            const idx = Math.max(0, Math.min(n - 1, Math.round(current.current)))
            if (idx !== activeRef.current) {
                activeRef.current = idx
                setActive(idx)
                // the helper mascot listens to this
                window.dispatchEvent(new CustomEvent('projectchange', { detail: { index: idx, total: n, title: items[idx]?.title } }))
            }
            // off-screen, or hidden behind the contact card: don't draw
            if (!visible || document.documentElement.dataset.contact === 'open') return

            // hover (raycast against the last known pointer)
            const hit = p.cx >= 0 && !drag.current.on ? scene.pick(p.cx, p.cy) : null
            const wasHover = !!hoverRef.current
            hoverRef.current = hit
            if (!!hit !== wasHover) setHovered(!!hit)

            const lab = scene.render({
                cur: current.current,
                vel: reduce ? 0 : lean.current,
                time: reduce ? 0 : time,
                mouse: { x: p.sx, y: p.sy },
                hover: hit,
                progress: progress.current,
            })
            // name under the selected block only: follows it, fades out between projects
            const el = nameRef.current
            if (el && lab) {
                const it = items[lab.index]
                const t = it?.title || ''
                if (el.dataset.t !== t) {
                    // title + tags (rebuilt per project, so the tags' entrance replays)
                    el.dataset.t = t
                    el.replaceChildren()
                    const title = document.createElement('span')
                    title.className = 'ax-name-title'
                    title.textContent = t
                    const tags = document.createElement('span')
                    tags.className = 'ax-tags'
                    ;(it?.tags || []).forEach((tag, k) => {
                        const s = document.createElement('span')
                        s.className = 'ax-tag'
                        s.style.setProperty('--k', k)
                        s.textContent = tag
                        tags.appendChild(s)
                    })
                    el.append(title, tags)
                }
                const o = Math.max(0, Math.min(1, (lab.e - 0.7) / 0.3))
                el.style.opacity = o.toFixed(3)
                el.style.transform = `translate(${lab.x.toFixed(1)}px, ${(lab.y + 18).toFixed(1)}px) translate(-50%, 0) translateY(${((1 - o) * 6).toFixed(1)}px)`
                el.style.filter = o < 1 ? `blur(${((1 - o) * 4).toFixed(1)}px)` : 'none'

                // end of the archive: an invitation docks beside the last block
                // (or under its name when there's no room, on phones)
                const end = endRef.current
                if (end) {
                    const oe = lab.index === n - 1 ? Math.max(0, Math.min(1, (lab.e - 0.85) / 0.15)) : 0
                    const vw = stage.clientWidth
                    const side = lab.rx + 36 + end.offsetWidth < vw - 24
                    const x = side ? lab.rx + 36 : lab.x - end.offsetWidth / 2
                    const y = side ? lab.ry - end.offsetHeight / 2 : lab.y + 18 + el.offsetHeight + 28
                    end.style.opacity = oe.toFixed(3)
                    end.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateX(${((1 - oe) * (side ? -14 : 0)).toFixed(1)}px) translateY(${((1 - oe) * (side ? 0 : 10)).toFixed(1)}px)`
                    end.style.filter = oe < 1 ? `blur(${((1 - oe) * 5).toFixed(1)}px)` : 'none'
                    const on = oe > 0.6
                    if (end.classList.contains('is-on') !== on) {
                        end.classList.toggle('is-on', on)
                        end.inert = !on
                    }
                }
            }
        }
        gsap.ticker.add(loop)

        return () => {
            gsap.ticker.remove(loop)
            io.disconnect()
            ro.disconnect()
            window.removeEventListener('themechange', onTheme)
            window.removeEventListener('palettechange', onTheme)
            scene.dispose()
            sceneRef.current = null
        }
    }, [items, n])

    const open = (p) => {
        if (!p) return
        if (p.link.slug) goTo(`/work/${p.link.slug}`)
        else window.open(p.link.url, '_blank', 'noopener,noreferrer')
    }

    // new set after filtering → the helper's menu (next / previous / open) follows it
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('projectchange', { detail: { index: 0, total: items.length, title: items[0]?.title } }))
    }, [items])

    /* ── commands from the helper mascot ── */
    useEffect(() => {
        const go = (e) => {
            const to = e.detail?.to
            const cur = activeRef.current
            const i = to === 'next' ? Math.min(n - 1, cur + 1) : to === 'prev' ? Math.max(0, cur - 1) : to === 'first' ? 0 : Number(to) || 0
            scrollToY(yForIndex(i), { duration: 1.3 })
        }
        const openCur = () => open(items[activeRef.current])
        const report = () => window.dispatchEvent(new CustomEvent('projectchange', { detail: { index: activeRef.current, total: n, title: items[activeRef.current]?.title } }))
        window.addEventListener('helper:go', go)
        window.addEventListener('helper:open', openCur)
        window.addEventListener('helper:hello', report)
        return () => {
            window.removeEventListener('helper:go', go)
            window.removeEventListener('helper:open', openCur)
            window.removeEventListener('helper:hello', report)
        }
    })

    /* ── pointer: hover, parallax, drag along the track, click to select/open ── */
    useEffect(() => {
        const stage = stageRef.current
        const perPx = () => (SCROLL_PER * getViewportHeight()) / (stage.clientWidth * 0.22)

        const down = (e) => {
            if (e.button !== undefined && e.button !== 0) return
            drag.current = { on: true, x: e.clientX, moved: 0, v: 0 }
        }
        const move = (e) => {
            const r = stage.getBoundingClientRect()
            const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
            pointer.current.x = inside ? ((e.clientX - r.left) / r.width) * 2 - 1 : 0
            pointer.current.y = inside ? ((e.clientY - r.top) / r.height) * 2 - 1 : 0
            pointer.current.cx = inside ? e.clientX : -1
            pointer.current.cy = inside ? e.clientY : -1
            if (cursorRef.current) {
                gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
            }
            if (!drag.current.on) return
            const dx = e.clientX - drag.current.x
            drag.current.x = e.clientX
            drag.current.moved += Math.abs(dx)
            drag.current.v = drag.current.v * 0.6 + dx * 0.4
            if (drag.current.moved > 6) stage.classList.add('is-dragging')
            scrollToY(getScrollTop() - dx * perPx(), { immediate: true })
        }
        const up = (e) => {
            if (!drag.current.on) return
            drag.current.on = false
            stage.classList.remove('is-dragging')
            if (drag.current.moved <= 6) {
                // click
                const hit = sceneRef.current?.pick(e.clientX, e.clientY)
                if (hit) {
                    if (hit.index === activeRef.current) open(items[hit.index])
                    else scrollToIndex(hit.index)
                }
                return
            }
            // fling, then settle on a project
            const fling = -drag.current.v * perPx() * 10
            const el = sectionRef.current
            const top = offsetTopOf(el)
            const range = el.offsetHeight - getViewportHeight()
            const y = Math.max(top, Math.min(top + range, getScrollTop() + fling))
            const idx = Math.round(((y - top) / range) * (n - 1))
            scrollToIndex(Math.max(0, Math.min(n - 1, idx)), 0.9)
        }
        stage.addEventListener('pointerdown', down)
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
        return () => {
            stage.removeEventListener('pointerdown', down)
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', up)
        }
    }, [n, items, scrollToIndex])

    /* ── keyboard while pinned ── */
    useEffect(() => {
        const onKey = (e) => {
            const el = sectionRef.current
            if (!el) return
            const t = topInView(el)
            if (t > 1 || t + el.offsetHeight < getViewportHeight() - 1) return
            if (e.key === 'ArrowRight') { e.preventDefault(); scrollToIndex(Math.min(n - 1, activeRef.current + 1)) }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollToIndex(Math.max(0, activeRef.current - 1)) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [n, scrollToIndex])


    return (
        <section
            id="work"
            ref={sectionRef}
            className="ax"
            style={{ height: `calc(var(--box-h, 100vh) * ${1 + (n - 1) * SCROLL_PER})` }}
        >
            <div className="ax-sticky">
                <div ref={cursorRef} className="ax-cursor-wrap" aria-hidden>
                    <div className={`ax-cursor${hovered ? ' is-on' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                        </svg>
                    </div>
                </div>

                {/* the Figma halftone dome sits behind the cards */}

                {/* WebGL stage (canvas is injected by scene.js) */}
                <div
                    className={`ax-stage${hovered ? ' is-hover' : ''}`}
                    ref={stageRef}
                    role="listbox"
                    aria-label="Projects - scroll, drag or use arrow keys to browse"
                />

                <div className="ax-name-tag" ref={nameRef} aria-hidden />

                {/* category filter */}
                <div className="ax-filter" role="group" aria-label="Filter projects by category">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            type="button"
                            className={`ax-filter-btn${filter === f.id ? ' is-on' : ''}`}
                            aria-pressed={filter === f.id}
                            onClick={() => pickFilter(f.id)}
                        >
                            {f.label}<span className="ax-filter-n">{f.count}</span>
                        </button>
                    ))}
                </div>

                {/* after the last project: on to the next part of the site */}
                <div className="ax-end" ref={endRef} inert>
                    <span className="ax-end-note">That's all for now</span>
                    <button
                        type="button"
                        className="ct-send ax-end-btn"
                        onClick={() => goTo('/')}
                    >
                        <span className="ct-send-dots ct-send-dots--big" aria-hidden />
                        <span className="ct-send-dots ct-send-dots--small" aria-hidden />
                        <span className="ct-send-label">
                            Meet the designer
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M3 10h12.5M11 4.8l5.2 5.2-5.2 5.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                    </button>
                </div>
                <p className="sr-only" aria-live="polite">
                    {project ? `${project.title}, ${project.company}, ${project.year}. Click the card to open.` : ''}
                </p>
            </div>
        </section>
    )
}
