import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

const SKILLS = [
  { category: 'Design', items: ['Product Design', 'UX/UI', 'Design Systems', 'Interaction Design', 'User Research', 'Prototyping'] },
  { category: 'Development', items: ['React', 'Vite', 'GSAP', 'Three.js', 'HTML/CSS/JS', 'Supabase'] },
  { category: 'Tools', items: ['Figma', 'Adobe CC', 'Miro', 'Jira', 'GitHub'] },
]

const EXPERIENCE = [
  { year: '2026 –', role: 'Product Designer', company: 'Mayten Technologies' },
  { year: '2025', role: 'UX/UI Designer', company: 'MarketEcho' },
  { year: '2024', role: 'Web Designer', company: 'Carnivale' },
]

export default function About() {
  const sectionRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(leftRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' } }
    )
    gsap.fromTo(rightRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' } }
    )
  }, [])

  return (
    <section id="about" className="about" ref={sectionRef}>
      <div className="section-header">
        <div className="section-pill">
          <span className="section-num">04</span>
          <span className="section-label">About</span>
        </div>
      </div>

      <div className="about-grid">
        <div ref={leftRef} className="about-card">
          <p className="about-bio">I'm a product designer with a hybrid design and development background, currently finishing my bachelor's in Digital Experience Design at Howest.</p>
          <p className="about-bio">I've shipped real products — a 50+ component design system for a startup MVP, a full legacy app redesign deployed to 60+ regions, and a phygital street installation built with React, Three.js, and real-time data.</p>
          <p className="about-bio">I care about the gap between design and engineering. I work best at the intersection — thinking in systems, building in code, designing with technical constraints in mind from day one.</p>

          <div className="about-experience">
            <span className="about-label">Experience</span>
            {EXPERIENCE.map((item, i) => (
              <div key={i} className="exp-row">
                <span className="exp-year">{item.year}</span>
                <div>
                  <span className="exp-role">{item.role}</span>
                  <span className="exp-company">{item.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={rightRef} className="about-right">
          {SKILLS.map((group, i) => (
            <div key={i} className="skill-card">
              <span className="about-label">{group.category}</span>
              <div className="skill-list">
                {group.items.map((skill, j) => (
                  <span key={j} className="skill-item">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
