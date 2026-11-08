import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Intro from './components/Intro/Intro'
import Helper from './components/Helper/Helper'
import PageTransition from './components/PageTransition/PageTransition'
import ContactCard from './components/ContactCard/ContactCard'
import Shell from './components/Shell/Shell'
import Home from './pages/Home'
import CaseStudy from './pages/CaseStudy'
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
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/work/:slug" element={<CaseStudy />} />
                    </Routes>
                </main>
            </Shell>
        </BrowserRouter>
    )
}
