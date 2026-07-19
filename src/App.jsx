import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Loader from './components/Loader'
import Nav from './components/Nav'
import ScrollProgress from './components/ScrollProgress'
import Home from './pages/Home'
import CaseStudy from './pages/CaseStudy'

gsap.registerPlugin(ScrollTrigger)

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => { window.scrollTo(0, 0) }, [pathname])
    return null
}

export default function App() {
    const [loaded, setLoaded] = useState(false)

    return (
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
            <ScrollToTop />
            {!loaded && <Loader onComplete={() => setLoaded(true)} />}
            <ScrollProgress />
            <Nav />
            <main style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/work/:slug" element={<CaseStudy />} />
                </Routes>
            </main>
        </BrowserRouter>
    )
}