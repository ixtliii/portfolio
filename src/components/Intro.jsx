import { useEffect, useRef, useState } from 'react'
import HalftoneDome from './Shell/HalftoneDome'

// First screen of the content box: the halftone dome rising from the bottom.
// Geometry from the Figma frame: Frame 10 at (10, 442), circle Ø1488, box origin (121.5, 349.5),
// box 1318.5 × 674.5. The dome scales with whichever box dimension needs it more, so on a tall
// phone it stays a wide dome instead of shrinking to a small ball.
const BOX = { w: 1440 - 121.5, h: 1024 - 349.5 }
const DOME = { d: 1487.9794921875, cx: (10 + 743.99 - 121.5) / BOX.w, top: (442 - 349.5) / BOX.h }

export default function Intro() {
    const ref = useRef(null)
    const [geo, setGeo] = useState(null)

    useEffect(() => {
        const el = ref.current
        const ro = new ResizeObserver(([e]) => {
            const { width: w, height: h } = e.contentRect
            const s = Math.max(w / BOX.w, h / BOX.h)
            const d = DOME.d * s
            setGeo({ d, x: DOME.cx * w - d / 2, y: DOME.top * h })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return (
        <section id="intro" className="intro" ref={ref} aria-label="Intro">
            {geo && (
                <div
                    className="intro-dome"
                    style={{ left: geo.x, top: geo.y, width: geo.d, height: geo.d }}
                >
                    <HalftoneDome size={Math.round(geo.d)} />
                </div>
            )}
        </section>
    )
}
