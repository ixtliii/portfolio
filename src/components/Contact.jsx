import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const LINKS = [
  { label: 'Email', value: 'artem.diakunchak.work@gmail.com', href: 'mailto:artem.diakunchak.work@gmail.com' },
  { label: 'LinkedIn', value: 'linkedin.com/in/artem-diakunchak', href: 'https://www.linkedin.com/in/artem-diakunchak-b6142123b/' },
  { label: 'Behance', value: 'behance.net/artemdiakunchak', href: 'https://www.behance.net/artemdiakunchak' },
]

export default function Contact() {
  const sectionRef = useRef(null)
  const bigRef = useRef(null)
  const linksRef = useRef(null)

  useEffect(() => {
    // Big text chars reveal
    const chars = bigRef.current.querySelectorAll('.c-char')
    gsap.fromTo(chars,
      { y: '60%', opacity: 0 },
      {
        y: '0%', opacity: 1,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.025,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
      }
    )

    gsap.fromTo(linksRef.current.children,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: linksRef.current, start: 'top 92%' } }
    )
  }, [])

  const line1 = "Let's work"
  const line2 = 'together'

  const renderChars = (text) =>
    text.split('').map((ch, i) => (
      <span key={i} className="c-char">{ch === ' ' ? '\u00A0' : ch}</span>
    ))

  return (
    <section id="contact" className="contact" ref={sectionRef}>
      <div className="contact-inner">

        <div className="contact-top">
          <span className="mono contact-label">06 — Contact</span>
          <span className="mono contact-label">Open to work</span>
        </div>

        <a href="mailto:artem.diakunchak.work@gmail.com" className="contact-big" ref={bigRef}>
          <span className="contact-big-line">{renderChars(line1)}</span>
          <span className="contact-big-line contact-big-line--accent">
            {renderChars(line2)}<span className="c-char contact-big-dot">.</span>
          </span>
          <span className="contact-big-cta mono">Get in touch ↗</span>
        </a>

        <div ref={linksRef} className="contact-links">
          {LINKS.map((link, i) => (
            <a key={i} href={link.href} className="contact-link" target="_blank" rel="noopener noreferrer">
              <span className="contact-link-label mono">{link.label}</span>
              <span className="contact-link-value">{link.value}</span>
              <span className="contact-link-arrow">↗</span>
            </a>
          ))}
        </div>

        <footer className="footer">
          <span className="mono">Artem Diakunchak — Product Designer</span>
          <span className="mono">Designed & built by me · © 2026</span>
        </footer>

      </div>
    </section>
  )
}
