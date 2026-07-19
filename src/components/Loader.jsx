import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './Loader.css'

export default function Loader({ onComplete }) {
  const loaderRef  = useRef(null)
  const panelLRef  = useRef(null)
  const panelRRef  = useRef(null)
  const countRef   = useRef(null)
  const nameRef    = useRef(null)
  const roleRef    = useRef(null)
  const lineRef    = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    const counter = { val: 0 }

    // Entrance
    tl.fromTo([nameRef.current, roleRef.current],
      { opacity: 0 },
      { opacity: 1, duration: 0.3, stagger: 0.08 }
    )
    .fromTo(lineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: 'power3.inOut', transformOrigin: 'left' },
      0.1
    )
    // Count up 0 → 100
    .to(counter, {
      val: 100,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate() {
        if (countRef.current) {
          countRef.current.textContent = String(Math.round(counter.val)).padStart(2, '0')
        }
      }
    }, 0.15)
    // Panels split apart
    .to(panelLRef.current, {
      xPercent: -100,
      duration: 0.75,
      ease: 'power3.inOut',
    }, '+=0.08')
    .to(panelRRef.current, {
      xPercent: 100,
      duration: 0.75,
      ease: 'power3.inOut',
      onComplete,
    }, '<')
  }, [onComplete])

  return (
    <div ref={loaderRef} className="loader" aria-hidden>
      {/* Left panel */}
      <div ref={panelLRef} className="loader-panel loader-panel--l">
        <span ref={nameRef} className="loader-name">Artem Diakunchak</span>
        <div ref={lineRef} className="loader-line" />
        <span ref={countRef} className="loader-count">00</span>
      </div>
      {/* Right panel */}
      <div ref={panelRRef} className="loader-panel loader-panel--r">
        <span ref={roleRef} className="loader-role">Product Designer</span>
      </div>
    </div>
  )
}
