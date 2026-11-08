import { useEffect, useRef, useState } from 'react'
import HalftoneDome from './HalftoneDome'

// The Figma halftone dome as a backdrop that fills its parent (the content box).
// Geometry from the frame: Frame 10 at (10, 442), circle Ø1488, box origin (121.5, 349.5),
// box 1318.5 × 674.5. Scales with whichever box dimension needs it more, so on a tall phone
// it stays a wide dome instead of shrinking to a small ball.
const BOX = { w: 1440 - 121.5, h: 1024 - 349.5 }
const DOME = { d: 1487.9794921875, cx: (10 + 743.99 - 121.5) / BOX.w, top: (442 - 349.5) / BOX.h }

export default function DomeBackdrop() {
    const ref = useRef(null)
    const [geo, setGeo] = useState(null)

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => {
            const { width: w, height: h } = e.contentRect
            if (!w || !h) return
            const s = Math.max(w / BOX.w, h / BOX.h)
            const d = DOME.d * s
            setGeo({ d, x: DOME.cx * w - d / 2, y: DOME.top * h })
        })
        ro.observe(ref.current)
        return () => ro.disconnect()
    }, [])

    return (
        <div className="dome-backdrop" ref={ref} aria-hidden>
            {geo && (
                <div className="intro-dome" style={{ left: geo.x, top: geo.y, width: geo.d, height: geo.d }}>
                    <HalftoneDome size={Math.round(geo.d)} />
                </div>
            )}
        </div>
    )
}
