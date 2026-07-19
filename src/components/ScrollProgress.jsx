import { useEffect, useRef } from 'react'
import './ScrollProgress.css'

export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const progress = h.scrollTop / (h.scrollHeight - h.clientHeight)
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div ref={barRef} className="scroll-progress" aria-hidden />
}
