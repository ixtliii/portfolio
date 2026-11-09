import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Intro from './components/Intro/Intro'
import Helper from './components/Helper/Helper'
import PageTransition from './components/PageTransition/PageTransition'
import ContactCard from './components/ContactCard/ContactCard'
import Shell from './components/Shell/Shell'
// the archive (three.js) and case studies (markdown) load only when visited
const Home = lazy(() => import('./pages/Home'))
const CaseStudy = lazy(() => import('./pages/CaseStudy'))
import About from './pages/About'
import { scrollToY } from './lib/scroll'
import './lib/theme'
import './lib/palette'

gsap.registerPlugin(ScrollTrigger)

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        scrollToY(0, { immediate: true })
        // new page content → re-measure every ScrollTrigger against the box
        requestAnimationFrame(() => ScrollTrigger.refresh())
    }, [pathname])
    return null
}

export default function App() {
    // intro → exiting (mascot flies to the corner, page fades in) → done
    const [phase, setPhase] = useState('intro')
    const onIntroExit = useCallback(() => setPhase('exiting'), [])
    const onIntroDone = useCallback(() => setPhase('done'), [])
    const loaded = phase !== 'intro'
    // pages can wait for the intro to hand over before playing their entrance
    // once the intro is over, fetch the other pages quietly so navigating to them is instant
    useEffect(() => {
        if (phase !== 'done') return
        const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500))
        idle(() => { import('./pages/Home'); import('./pages/CaseStudy') })
    }, [phase])

    useEffect(() => {
        document.documentElement.dataset.intro = phase
        window.dispatchEvent(new CustomEvent('introphase', { detail: { phase } }))
    }, [phase])

    return (
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
            <PageTransition />
            <ContactCard />
            {phase !== 'done' && <Intro onExit={onIntroExit} onComplete={onIntroDone} />}
            {/* mounted while the intro mascot is still flying, so it's drawing by the hand-off */}
            {loaded && <Helper arrived visible={phase === 'done'} />}
            <Shell>
                <ScrollToTop />
                <main style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
                    <Suspense fallback={null}>
                    <Routes>
                        {/* home = who Artem is + selected work; the full archive lives at /work */}
                        <Route path="/" element={<About />} />
                        <Route path="/work" element={<Home />} />
                        <Route path="/work/:slug" element={<CaseStudy />} />
                        <Route path="/about" element={<Navigate to="/" replace />} />
                    </Routes>
                    </Suspense>
                </main>
            </Shell>
        </BrowserRouter>
    )
}
