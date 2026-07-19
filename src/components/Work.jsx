import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CASE_STUDIES } from '../caseStudies'
import './Work.css'

gsap.registerPlugin(ScrollTrigger)

// Prefix a root-absolute public path with Vite's base (for GitHub Pages subpath hosting)
const asset = (p) => (p ? import.meta.env.BASE_URL + p.replace(/^\//, '') : p)

const UX_PROJECTS = [
    {
        id: '01', slug: 'cogo',
        title: 'Cogo Mobility App',
        company: 'Mayten Technologies', year: '2026',
        tags: ['Product Design', 'Brand'],
        preview: '/prevs/cogo.jpg',
        color: '#dfe7fa',
    },
    {
        id: '02',
        title: 'MarketEcho',
        company: 'MarketEcho', year: '2025',
        tags: ['Design System', 'Dashboard'],
        external: 'https://www.behance.net/gallery/241398813/MarketEcho-Web-App-UXUI',
        preview: '/prevs/marketEcho.jpg',
        color: '#def3e6',
    },
    {
        id: '03',
        title: 'OCare',
        company: 'Mental Health', year: '2025',
        tags: ['UX Research', 'Mobile'],
        external: 'https://www.behance.net/gallery/241707793/OCare-Mental-Health-UXUI',
        preview: '/prevs/ocare.png',
        color: '#f4e3f8',
    },
]

const PLAYGROUND_PROJECTS = [
    {
        id: '01',
        title: 'Antwerp Unseen',
        subtitle: 'Phygital street installation merging real-time motion sensing with anonymous collective urban memory',
        description: 'A capstone installation where passers-by shape a shared, anonymous archive of urban memory through real-time body tracking — the crowd becomes the interface. Built with React, Three.js, GSAP and MediaPipe.',
        tags: ['Interaction Design', 'React', 'Three.js', 'MediaPipe'],
        company: 'Antwerp Visit x Howest', year: '2026',
        url: 'https://antwerp-unseen.vercel.app/',
        image: '/prevs/antwerp-unseen.jpg',
        color: '#12121e',
        dark: true,
    },
    {
        id: '02',
        title: 'The Couturier’s Code',
        subtitle: 'A scroll-driven story on Christian Dior’s superstitions and the botanical symbolism behind the New Look',
        description: 'An interactive digital story made with MoMu (ModeMuseum Antwerp) that traces Dior’s private world of superstition — lucky charms, fortune-tellers and flower symbolism — through a cinematic, scroll-driven experience with interactive rituals.',
        tags: ['Interactive Story', 'WebGL', 'GSAP', 'Editorial'],
        company: 'MoMu × Howest', year: '2026',
        url: 'https://ixtliii.github.io/dior-impress/',
        image: '/prevs/couturiers-code.jpg',
        color: '#f2efe9',
    },
    {
        id: '03',
        title: 'Synesthesia',
        subtitle: 'An audio-reactive web piece on what it feels like when sound leaks into sight',
        description: 'A first-person, glitch-editorial experience about synesthesia — where sound bleeds into color. It builds from fragmented “damaged records” to a live simulation that turns your microphone input into visual frequency, so visitors feel the sensory overload firsthand.',
        tags: ['Experimental', 'Creative Coding', 'Audio-reactive'],
        company: 'Personal', year: '2026',
        url: 'https://artem-diakunchak.be/personal-experience/',
        image: '/prevs/synesthesia.jpg',
        color: '#101018',
        dark: true,
    },
]

/* ═══ Index list with floating preview ═══ */
function WorkIndex() {
    const sectionRef = useRef(null)
    const listRef = useRef(null)
    const previewRef = useRef(null)
    const mouse = useRef({ x: 0, y: 0 })
    const isDesktop = useRef(false)
    const navigate = useNavigate()
    const [active, setActive] = useState(null)

    useEffect(() => {
        // Row entrance
        gsap.fromTo(listRef.current.children,
            { y: 34, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.09,
                scrollTrigger: { trigger: listRef.current, start: 'top 86%' } }
        )

        // Floating preview follows cursor (desktop only)
        isDesktop.current = window.matchMedia('(pointer: fine)').matches
        if (!isDesktop.current) return

        const preview = previewRef.current
        gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.9, opacity: 0 })

        const move = (e) => {
            mouse.current.x = e.clientX
            mouse.current.y = e.clientY
            gsap.to(preview, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.4,
                ease: 'power3.out',
                overwrite: 'auto',
            })
        }
        window.addEventListener('mousemove', move)
        return () => window.removeEventListener('mousemove', move)
    }, [])

    const showPreview = (project) => {
        setActive(project.id)
        const preview = previewRef.current
        if (!preview || !isDesktop.current) return
        // Snap to the cursor before fading in, so it never slides in from a stale spot
        gsap.set(preview, { x: mouse.current.x, y: mouse.current.y })
        gsap.to(preview, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
    }

    const hidePreview = () => {
        const preview = previewRef.current
        if (!preview) { setActive(null); return }
        // Fade out fast, then clear the active row. gsap cancels this tween's
        // onComplete if showPreview overwrites it, so re-hovering won't wrongly clear.
        gsap.to(preview, {
            scale: 0.9, opacity: 0, duration: 0.14, ease: 'power2.in', overwrite: 'auto',
            onComplete: () => setActive(null),
        })
    }

    // Fast scrolling (especially scrolling up) moves rows out from under a
    // stationary cursor without ever firing a mouseleave on the row/list,
    // so the hover + floating preview can get stuck "on". Clear it as soon
    // as the section scrolls instead of waiting for a mouse event that may
    // never come.
    useEffect(() => {
        const onScroll = () => hidePreview()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const activeProject = UX_PROJECTS.find(p => p.id === active)

    return (
        <section id="work" className="windex" ref={sectionRef} onMouseLeave={hidePreview}>
            <div className="windex-header">
                <span className="windex-index mono">02</span>
                <h2 className="windex-title">Selected <em className="serif-i">work</em></h2>
                <span className="windex-count mono">{UX_PROJECTS.length} projects</span>
            </div>

            <ul ref={listRef} className="windex-list" onMouseLeave={hidePreview}>
                {UX_PROJECTS.map((p) => {
                    const onSelect = () => {
                        if (p.external) window.open(p.external, '_blank', 'noopener,noreferrer')
                        else if (p.slug && CASE_STUDIES[p.slug]) navigate(`/work/${p.slug}`)
                    }
                    return (
                        <li key={p.id}>
                            <button
                                className={`windex-row windex-row--linked${active === p.id ? ' is-active' : ''}`}
                                onMouseEnter={() => showPreview(p)}
                                onClick={onSelect}
                            >
                                <span className="windex-num mono">{p.id}</span>
                                <span className="windex-name">{p.title}</span>
                                <span className="windex-meta">
                  <span className="windex-company mono">{p.company}</span>
                  <span className="windex-tags">
                    {p.tags.map(t => <span key={t} className="windex-tag">{t}</span>)}
                  </span>
                  <span className="windex-year mono">{p.year}</span>
                </span>
                                <span className="windex-arrow" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M3 12L12 3M12 3H5M12 3v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>

            {/* Floating preview panel */}
            <div
                ref={previewRef}
                className="windex-preview"
                style={{ background: activeProject?.color || '#eee' }}
                aria-hidden
            >
                {activeProject?.preview
                    ? <img className="windex-preview-img" src={asset(activeProject.preview)} alt="" />
                    : <span className="windex-preview-num mono">{activeProject?.id}</span>}
                <span className="windex-preview-label mono">
          {activeProject?.external ? 'View on Behance ↗' : 'View case study ↗'}
        </span>
            </div>
        </section>
    )
}

/* ═══ Playground ═══ */
function PlaygroundCard({ project, index, onOpen }) {
    const ref = useRef(null)

    useEffect(() => {
        gsap.fromTo(ref.current,
            { y: 42, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.75, ease: 'power3.out',
                scrollTrigger: { trigger: ref.current, start: 'top 90%' },
                delay: (index % 2) * 0.1,
            }
        )
    }, [index])

    return (
        <button
            ref={ref}
            type="button"
            className={`pg-card${project.dark ? ' pg-card--dark' : ''}`}
            onClick={onOpen}
            aria-label={`About ${project.title}`}
        >
            <div className="pg-card-media" style={{ background: project.color }}>
                {project.image
                    ? <img className="pg-card-img" src={asset(project.image)} alt="" loading="lazy" />
                    : <span className="pg-card-num mono">{project.id}</span>}
                <span className="pg-card-cue mono">About ↗</span>
            </div>
            <div className="pg-card-info">
                <div className="pg-card-meta">
                    <span className="mono">{project.company}</span>
                    <span className="mono">{project.year}</span>
                </div>
                <h3 className="pg-card-title">{project.title}</h3>
                <p className="pg-card-sub">{project.subtitle}</p>
                {project.tags.length > 0 && (
                    <div className="pg-card-tags">
                        {project.tags.map(t => <span key={t} className="pg-tag">{t}</span>)}
                    </div>
                )}
            </div>
        </button>
    )
}

/* ═══ Project detail modal ═══ */
function ProjectModal({ project, onClose }) {
    useEffect(() => {
        if (!project) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [project, onClose])

    if (!project) return null

    return (
        <div className="pgm-overlay" onClick={onClose}>
            <div className="pgm-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <button className="pgm-close" onClick={onClose} aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
                {project.image && (
                    <div className="pgm-media" style={{ background: project.color }}>
                        <img src={asset(project.image)} alt="" />
                    </div>
                )}
                <div className="pgm-meta">
                    <span className="mono">{project.company}</span>
                    <span className="mono">{project.year}</span>
                </div>
                <h3 className="pgm-title">{project.title}</h3>
                <p className="pgm-desc">{project.description}</p>
                {project.tags.length > 0 && (
                    <div className="pgm-tags">
                        {project.tags.map(t => <span key={t} className="pg-tag">{t}</span>)}
                    </div>
                )}
                <a className="pgm-visit" href={project.url} target="_blank" rel="noopener noreferrer">
                    <span>Visit project</span>
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M3 12L12 3M12 3H5M12 3v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
            </div>
        </div>
    )
}

export default function Work() {
    const pgHeaderRef = useRef(null)
    const [modalProject, setModalProject] = useState(null)

    useEffect(() => {
        gsap.fromTo(pgHeaderRef.current.children,
            { y: 26, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.08,
                scrollTrigger: { trigger: pgHeaderRef.current, start: 'top 88%' } }
        )
    }, [])

    return (
        <>
            <WorkIndex />

            <section id="playground" className="playground">
                <div ref={pgHeaderRef} className="pg-header">
                    <span className="pg-header-index mono">03</span>
                    <h2 className="pg-header-title">Playground & <em className="serif-i">experiments</em></h2>
                </div>
                <div className="pg-grid">
                    {PLAYGROUND_PROJECTS.map((p, i) => (
                        <PlaygroundCard key={p.id + p.title} project={p} index={i} onOpen={() => setModalProject(p)} />
                    ))}
                </div>
            </section>

            <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
        </>
    )
}