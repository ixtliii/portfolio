import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './MarqueeDivider.css'

gsap.registerPlugin(ScrollTrigger)

export default function MarqueeDivider({ items = ['Design Systems', 'UX / UI', 'Prototyping', 'Front-End'], speed = 40 }) {
  const trackRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const total = track.scrollWidth / 2

    // Base scroll animation
    const anim = gsap.to(track, { x: -total, duration: speed, ease: 'none', repeat: -1 })

    // Speed shifts with scroll velocity
    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.abs(self.getVelocity()) / 1000
        gsap.to(anim, { timeScale: 1 + Math.min(v, 3), duration: 0.3, overwrite: true })
      }
    })

    return () => { anim.kill(); st.kill() }
  }, [speed])

  return (
    <div ref={wrapRef} className="marquee-divider" aria-hidden>
      <div ref={trackRef} className="marquee-divider-track">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="marquee-divider-item">
            {item}
            <span className="marquee-divider-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
