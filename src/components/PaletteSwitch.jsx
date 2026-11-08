import { PALETTES, usePalette } from '../lib/palette'
import './PaletteSwitch.css'

// Small floating switch to compare colour palettes (works on the intro too).
export default function PaletteSwitch() {
    const { palette, setPalette } = usePalette()
    return (
        <div className="pal" role="radiogroup" aria-label="Colour palette">
            {PALETTES.map(p => (
                <button
                    key={p.id}
                    role="radio"
                    aria-checked={palette === p.id}
                    className={`pal-opt pal-opt--${p.id}${palette === p.id ? ' is-on' : ''}`}
                    onClick={() => setPalette(p.id)}
                    title={`${p.label} palette`}
                >
                    <span className="pal-dot" aria-hidden />
                    <span className="pal-label">{p.label}</span>
                </button>
            ))}
        </div>
    )
}
