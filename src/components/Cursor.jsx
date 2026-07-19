import { useEffect, useRef } from 'react'
import './Cursor.css'

export default function Cursor() {
  const circleRef = useRef(null)

  useEffect(() => {
    const circle = circleRef.current

    const move = (e) => {
      circle.style.left = e.clientX + 'px'
      circle.style.top = e.clientY + 'px'
    }

    const onEnter = () => circle.classList.add('is-hovering')
    const onLeave = () => circle.classList.remove('is-hovering')

    window.addEventListener('mousemove', move)

    const targets = document.querySelectorAll('a, button')
    targets.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      window.removeEventListener('mousemove', move)
      targets.forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return <div ref={circleRef} className="cursor-circle" />
}
