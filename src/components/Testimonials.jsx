import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Testimonials.css'

gsap.registerPlugin(ScrollTrigger)

const TESTIMONIALS = [
  {
    quote: "As a co-founder of MarketEcho, I can highlight Artem as a highly responsible and dedicated UI/UX designer. He worked fast, met all deadlines, and consistently delivered high-quality results. The design received fantastic feedback from our users — many highlighted how clean, intuitive, and enjoyable the product feels to use. Artem clearly cares about real user experience, not just visuals, and I would gladly recommend him as a reliable and hardworking professional. Thank you, Artem!",
    name: "Serhiy Amelin",
    title: "Co-founder, MarketEcho",
    initial: "S",
  },
  {
    quote: "I had a great pleasure working on multiple projects with Artem. He has shown his great talent and attention to details while being able to communicate with both clients and developers. Thanks to his technical background he could easily translate business requirements to design implementations that were both realistic from a development perspective and fulfilled all client requirements. He takes great ownership — bringing features and products from the early stages, all the way until the launch and maintenance.",
    name: "Leonid Romaniukha",
    title: "Full Stack Developer, Mayten",
    initial: "L",
  },
]

export default function Testimonials() {
  const sectionRef = useRef(null)
  const gridRef = useRef(null)
  const headerRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 84%' } }
    )

    gsap.fromTo(gridRef.current.children,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
    )
  }, [])

  return (
    <section className="testimonials" ref={sectionRef}>
      <div ref={headerRef} className="section-header">
        <div className="section-pill">
          <span className="section-num">05</span>
          <span className="section-label">In Their Words</span>
        </div>
      </div>

      <div ref={gridRef} className="testimonials-grid">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="testimonial-card">
            <p className="testimonial-quote">{t.quote}</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.initial}</div>
              <div>
                <p className="testimonial-name">{t.name}</p>
                <p className="testimonial-title">{t.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
