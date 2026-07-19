import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import './Nav.css'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function scramble(el, original) {
  let iteration = 0
  const total = original.length * 2.5
  clearInterval(el._scramble)
  el._scramble = setInterval(() => {
    el.textContent = original
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' '
        if (i < iteration / 2.5) return original[i]
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      })
      .join('')
    iteration++
    if (iteration >= total) {
      clearInterval(el._scramble)
      el.textContent = original
    }
  }, 28)
}

export default function Nav() {
  const navRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.15 }
    )

    const links = navRef.current.querySelectorAll('.nav-link')
    links.forEach(link => {
      const original = link.textContent
      link.addEventListener('mouseenter', () => scramble(link, original))
    })
  }, [])

  // Anchor navigation that works from any route
  const goToSection = (e, hash) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/' + hash)
      // after route change, scroll happens via browser hash handling
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    } else {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav ref={navRef} className="nav">
      <Link to="/" className="nav-logo">
        Artem Diakunchak<span className="nav-logo-dot">.</span>
      </Link>
      <div className="nav-links">
        <a href="#work" className="nav-link" onClick={(e) => goToSection(e, '#work')}>Work</a>
        <a href="#about" className="nav-link" onClick={(e) => goToSection(e, '#about')}>About</a>
        <a href="#contact" className="nav-link" onClick={(e) => goToSection(e, '#contact')}>Contact</a>
        <a href={`${import.meta.env.BASE_URL}Artem_Diakunchak-CV.pdf`} className="nav-cta" download="Artem Diakunchak — CV.pdf">Résumé ↓</a>
      </div>
    </nav>
  )
}
