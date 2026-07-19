import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CASE_STUDIES } from '../caseStudies'
import './CaseStudy.css'

gsap.registerPlugin(ScrollTrigger)

// slugify heading text for anchor ids
const slugify = (s) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

export default function CaseStudy() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const study = CASE_STUDIES[slug]
  const contentRef = useRef(null)
  const heroRef = useRef(null)
  const [activeId, setActiveId] = useState('')

  // Parse markdown → html + TOC
  const { html, toc } = useMemo(() => {
    if (!study) return { html: '', toc: [] }

    const tokens = marked.lexer(study.md)
    const tocItems = []

    tokens.forEach(t => {
      if (t.type === 'heading' && (t.depth === 1 || t.depth === 2)) {
        tocItems.push({ depth: t.depth, text: t.text, id: slugify(t.text) })
      }
    })

    // Custom renderer to add ids to headings
    const renderer = new marked.Renderer()
    renderer.heading = ({ text, depth }) => {
      const id = slugify(text)
      return `<h${depth} id="${id}">${text}</h${depth}>`
    }

    // Rewrite root-absolute image paths in the markdown to respect Vite's base
    // (so /case-studies/... resolves correctly when hosted under a subpath).
    const parsed = marked.parse(study.md, { renderer })
      .replaceAll('src="/case-studies/', `src="${import.meta.env.BASE_URL}case-studies/`)

    return { html: parsed, toc: tocItems }
  }, [study])

  // Entrance animation
  useEffect(() => {
    if (!study) return
    window.scrollTo(0, 0)

    const tl = gsap.timeline({ delay: 0.1 })
    tl.fromTo(heroRef.current.children,
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.08 }
    )
    tl.fromTo(contentRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
      '-=0.3'
    )
  }, [slug, study])

  // Scroll spy — highlight whichever section is currently at the top of the viewport.
  // A plain scroll listener is more reliable than IntersectionObserver here (short
  // sections and fast scrolling can slip through an observer's margin band).
  useEffect(() => {
    if (!study) return
    const content = contentRef.current
    if (!content) return
    const headings = Array.from(content.querySelectorAll('h1[id], h2[id]'))
    if (!headings.length) return

    const OFFSET = 130 // px below the top (clears the fixed nav) where "current" is measured

    const onScroll = () => {
      let current = headings[0].id
      for (const h of headings) {
        if (h.getBoundingClientRect().top - OFFSET <= 0) current = h.id
        else break
      }
      // Near the very bottom, force the last section active so it can highlight
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = headings[headings.length - 1].id
      }
      setActiveId(prev => (prev === current ? prev : current))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [html, study])

  if (!study) {
    return (
      <div className="cs-notfound">
        <p>Case study not found.</p>
        <Link to="/" className="btn-secondary">← Back home</Link>
      </div>
    )
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="cs">
      {/* Top bar */}
      <div className="cs-topbar">
        <button className="cs-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <span className="mono cs-topbar-label">Case Study</span>
      </div>

      {/* Hero */}
      <header ref={heroRef} className="cs-hero" style={{ '--cs-tint': study.color }}>
        <div className="cs-hero-meta">
          <span className="mono">{study.company}</span>
          <span className="mono">{study.year}</span>
        </div>
        <h1 className="cs-title">{study.title}</h1>
        <p className="cs-subtitle">{study.subtitle}</p>
        <div className="cs-facts">
          <div className="cs-fact">
            <span className="cs-fact-label mono">Role</span>
            <span className="cs-fact-value">{study.role}</span>
          </div>
          <div className="cs-fact">
            <span className="cs-fact-label mono">Scope</span>
            <span className="cs-fact-value">{study.tags.join(' · ')}</span>
          </div>
          <div className="cs-fact">
            <span className="cs-fact-label mono">Year</span>
            <span className="cs-fact-value">{study.year}</span>
          </div>
        </div>
        {study.links && study.links.length > 0 && (
          <div className="cs-hero-links">
            {study.links.map((l) => (
              <a
                key={l.url}
                className={`cs-hero-link${l.primary ? '' : ' cs-hero-link--ghost'}`}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{l.label}</span>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden>
                  <path d="M3 12L12 3M12 3H5M12 3v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Body: TOC + content */}
      <div className="cs-body">
        <aside className="cs-toc">
          <span className="cs-toc-label mono">Contents</span>
          <nav>
            {toc.map((item, i) => (
              <button
                key={i}
                className={`cs-toc-item cs-toc-item--d${item.depth}${activeId === item.id ? ' is-active' : ''}`}
                onClick={() => scrollTo(item.id)}
              >
                <span className="cs-toc-marker" />
                {item.text}
              </button>
            ))}
          </nav>
        </aside>

        <div
          ref={contentRef}
          className="cs-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Next project footer */}
      <footer className="cs-footer">
        <Link to="/" className="cs-footer-link">
          <span className="mono">← All work</span>
        </Link>
      </footer>
    </article>
  )
}
