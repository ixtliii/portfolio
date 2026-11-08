// ─────────────────────────────────────────────────────────
// Light / dark theme. Sets data-theme on <html> (the CSS
// tokens in index.css switch on it), remembers the choice,
// and fires a `themechange` event for things that read
// colours in JS (the WebGL archive, the halftone dome).
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

const KEY = 'ad-theme'

function initial() {
    try {
        const saved = localStorage.getItem(KEY)
        if (saved === 'light' || saved === 'dark') return saved
    } catch { /* storage unavailable */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
    document.documentElement.dataset.theme = theme
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
}

// apply before React renders so there's no flash
if (typeof document !== 'undefined' && !document.documentElement.dataset.theme) {
    document.documentElement.dataset.theme = initial()
}

export function useTheme() {
    const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')

    useEffect(() => {
        const on = (e) => setTheme(e.detail)
        window.addEventListener('themechange', on)
        return () => window.removeEventListener('themechange', on)
    }, [])

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
        // cross-fade the whole UI while colours swap
        document.documentElement.classList.add('theme-anim')
        applyTheme(next)
        setTimeout(() => document.documentElement.classList.remove('theme-anim'), 500)
    }

    return { theme, toggle }
}
