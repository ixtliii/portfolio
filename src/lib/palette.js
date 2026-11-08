// ─────────────────────────────────────────────────────────
// Colour palette (independent of light/dark). Sets
// data-palette on <html> (index.css swaps the tokens),
// remembers the choice and fires `palettechange` for things
// that read colours in JS (archive scene, intro avatar).
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

export const PALETTES = [
    { id: 'blue', label: 'Blue' },
    { id: 'mono', label: 'Mono' },
]
const KEY = 'ad-palette'

// Mono is the site's palette now (Blue was retired); kept as a module so the
// palette tokens stay switchable if another option is ever explored again.
if (typeof document !== 'undefined') {
    document.documentElement.dataset.palette = 'mono'
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function usePalette() {
    const [palette, setP] = useState(() => document.documentElement.dataset.palette || 'mono')
    useEffect(() => {
        const on = (e) => setP(e.detail)
        window.addEventListener('palettechange', on)
        return () => window.removeEventListener('palettechange', on)
    }, [])
    const setPalette = (id) => {
        if (id === palette) return
        try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
        document.documentElement.classList.add('theme-anim')
        document.documentElement.dataset.palette = id
        window.dispatchEvent(new CustomEvent('palettechange', { detail: id }))
        setTimeout(() => document.documentElement.classList.remove('theme-anim'), 500)
    }
    return { palette, setPalette }
}
