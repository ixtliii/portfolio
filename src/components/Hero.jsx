import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DitherVideo from './DitherVideo'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

const HERO_VIDEO = `${import.meta.env.BASE_URL}hero_final.mp4`

export default function Hero() {
    const sectionRef  = useRef(null)
    const headlineRef = useRef(null)
    const asideRef    = useRef(null)
    const metaRef     = useRef(null)
    const blob1Ref    = useRef(null)
    const blob2Ref    = useRef(null)
    const [clock, setClock] = useState('')

    useEffect(() => {
        const tick = () => {
            setClock(new Date().toLocaleTimeString('en-GB', {
                timeZone: 'Europe/Brussels',
                hour: '2-digit', minute: '2-digit',
            }))
        }
        tick()
        const id = setInterval(tick, 30000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        const tl = gsap.timeline({ delay: 0.45 })

        tl.fromTo(headlineRef.current.querySelectorAll('.hl-line'),
            { clipPath: 'inset(0 0 100% 0)', y: 24 },
            { clipPath: 'inset(0 0 -10% 0)', y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 }
        )
            .fromTo(asideRef.current.children,
                { y: 16, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.09 },
                '-=0.5'
            )
            .fromTo(metaRef.current.children,
                { y: 8, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.05 },
                '-=0.3'
            )

        gsap.to(headlineRef.current, {
            y: -40, ease: 'none',
            scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top top', end: 'bottom top', scrub: true,
            }
        })

        if (!HERO_VIDEO) {
            const onMouse = (e) => {
                const x = (e.clientX / window.innerWidth  - 0.5) * 50
                const y = (e.clientY / window.innerHeight - 0.5) * 35
                gsap.to(blob1Ref.current, { x: x * 0.9, y: y * 0.7, duration: 1.4, ease: 'power2.out' })
                gsap.to(blob2Ref.current, { x: -x * 0.6, y: -y * 0.5, duration: 1.8, ease: 'power2.out' })
            }
            window.addEventListener('mousemove', onMouse)
            return () => window.removeEventListener('mousemove', onMouse)
        }
    }, [])

    return (
        <section className="hero" ref={sectionRef}>

            {HERO_VIDEO
                ? <DitherVideo src={HERO_VIDEO} pixelSize={4} intensity={0.38} mouseReactive className="hero__dither" />
                : <>
                    <div ref={blob1Ref} className="hero-blob hero-blob--1" />
                    <div ref={blob2Ref} className="hero-blob hero-blob--2" />
                </>
            }

            {/* Bottom-anchored composition */}
            <div className="hero-main">
                <h1 ref={headlineRef} className="hero-headline" aria-label="Product designer who builds what he designs">
                    <span className="hl-line">Product designer</span>
                    <span className="hl-line">who <em className="serif-i">builds</em> what</span>
                    <span className="hl-line">he designs<span className="hl-dot">.</span></span>
                </h1>

                <div ref={asideRef} className="hero-aside">
                    <p className="hero-aside-text">
                        Hybrid product designer & front-end developer based in Belgium — working
                        at the intersection of design systems and shipped code.
                    </p>
                    <div className="hero-aside-actions">
                        <a href="#work" className="btn-primary">
                            <span>View work</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </a>
                        <a href={`${import.meta.env.BASE_URL}Artem_Diakunchak-CV.pdf`} className="btn-secondary" download="Artem Diakunchak — CV.pdf">Résumé ↓</a>
                    </div>
                </div>
            </div>

            {/* Single meta strip */}
            <div ref={metaRef} className="hero-meta">
        <span className="hero-meta-item">
          <span className="hero-avail-dot" />
          Open to work
        </span>
                <span className="hero-meta-sep" />
                <span className="hero-meta-item mono">Belgium — 51.05°N, 3.72°E</span>
                <span className="hero-meta-fill" />
                <span className="hero-meta-item mono">{clock} CET</span>
                <span className="hero-meta-sep" />
                <span className="hero-meta-item mono hero-scroll-cue">Scroll ↓</span>
            </div>

        </section>
    )
}