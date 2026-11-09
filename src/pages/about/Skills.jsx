import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─────────────────────────────────────────────────────────
// Skills drop into a pit when the chapter arrives and settle there.
// Pills are DOM (crisp text); Matter.js only moves them, then sleeps.
// The category keys highlight their pills.
// ─────────────────────────────────────────────────────────
const { Engine, Bodies, Body, Composite } = Matter

export default function Skills({ groups }) {
    const pitRef = useRef(null)
    const pillRefs = useRef([])
    const [hot, setHot] = useState(-1)

    const flat = groups.flatMap((g, gi) => g.items.map(label => ({ label, gi })))

    useEffect(() => {
        const pit = pitRef.current
        const engine = Engine.create({ gravity: { x: 0, y: 1.1 } })
        engine.enabled = false
        let W = pit.clientWidth, H = pit.clientHeight
        let walls = []
        const makeWalls = () => {
            if (walls.length) Composite.remove(engine.world, walls)
            const t = 200
            walls = [
                Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
                Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
                Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
            ]
            Composite.add(engine.world, walls)
        }
        makeWalls()

        const pills = pillRefs.current.map((el, i) => {
            const w = el.offsetWidth, h = el.offsetHeight
            const b = Bodies.rectangle(
                W * (0.15 + 0.7 * ((i * 0.618) % 1)), -h - i * 46, w, h,
                { chamfer: { radius: h / 2 - 0.5 }, restitution: 0.35, friction: 0.08, frictionAir: 0.012, density: 0.002 }
            )
            Body.setAngle(b, (Math.random() - 0.5) * 0.8)
            return { el, b, w, h, gi: flat[i].gi }
        })
        Composite.add(engine.world, pills.map(p => p.b))


        // run only while on screen
        let visible = false
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '80px' })
        io.observe(pit)
        let started = false
        const st = ScrollTrigger.create({
            trigger: pit, start: 'top 75%', once: true,
            onEnter: () => { started = true; engine.enabled = true },
        })
        const place = () => {
            for (const p of pills) {
                const { x, y } = p.b.position
                p.el.style.transform = `translate(${(x - p.w / 2).toFixed(1)}px, ${(y - p.h / 2).toFixed(1)}px) rotate(${p.b.angle.toFixed(3)}rad)`
            }
        }
        place()
        let frames = 0
        const loop = (_t, dt) => {
            if (!visible || !engine.enabled) return
            Engine.update(engine, Math.min(dt, 33))
            place()
            if (++frames > 90 && pills.every(p => p.b.speed < 0.02 && Math.abs(p.b.angularSpeed) < 0.002)) engine.enabled = false
        }
        gsap.ticker.add(loop)

        const ro = new ResizeObserver(() => {
            const nw = pit.clientWidth, nh = pit.clientHeight
            if (Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return
            W = nw; H = nh
            makeWalls()
            if (started) { engine.enabled = true; frames = 0 }
            pills.forEach(p => {
                Body.setPosition(p.b, { x: Math.min(W - p.w / 2, Math.max(p.w / 2, p.b.position.x)), y: Math.min(p.b.position.y, H - p.h) })
            })
        })
        ro.observe(pit)

        return () => {
            gsap.ticker.remove(loop)
            io.disconnect(); ro.disconnect(); st.kill()
            Engine.clear(engine)
        }
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="ab-skills">
            <div className="ab-skill-keys">
                {groups.map((g, gi) => (
                    <button
                        key={g.category}
                        type="button"
                        className="ab-skill-key"
                        aria-pressed={hot === gi}
                        style={{ '--g0': g.grad[0], '--g1': g.grad[1], '--g2': g.grad[2] }}
                        onClick={() => setHot(h => (h === gi ? -1 : gi))}
                        onPointerEnter={() => setHot(gi)}
                        onPointerLeave={(e) => e.pointerType === 'mouse' && setHot(-1)}
                    >
                        <i aria-hidden />{g.category}
                    </button>
                ))}
            </div>
            <div className={`ab-pit${hot >= 0 ? ' has-hot' : ''}`} ref={pitRef}>
                {flat.map((s, i) => {
                    const g = groups[s.gi].grad
                    return (
                        <span
                            key={s.label}
                            ref={el => (pillRefs.current[i] = el)}
                            className={`ab-pill${hot === s.gi ? ' is-hot' : ''}`}
                            style={{ '--g0': g[0], '--g1': g[1], '--g2': g[2] }}
                        >
                            {s.label}
                        </span>
                    )
                })}
            </div>
            {/* the same list for screen readers */}
            <ul className="sr-only">
                {groups.map(g => <li key={g.category}>{g.category}: {g.items.join(', ')}</li>)}
            </ul>
        </div>
    )
}
