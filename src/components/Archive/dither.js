// ─────────────────────────────────────────────────────────
// Turns a preview image into a 1-bit ordered dither with a
// flowing "damascus steel" pattern folded into the threshold.
// Output: PNG data-URL, black ink on transparent, cropped to
// `aspect` (h / w) exactly like object-fit: cover.
// ─────────────────────────────────────────────────────────

const BAYER = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]

const cache = new Map()

export function makeDither(src, aspect = 0.68, width = 190) {
    const key = `${src}|${aspect}|${width}`
    if (cache.has(key)) return cache.get(key)

    const job = new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
            try {
                const W = width
                const H = Math.round(width * aspect)
                const c = document.createElement('canvas')
                c.width = W; c.height = H
                const ctx = c.getContext('2d', { willReadFrequently: true })

                // cover-crop
                const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
                const dw = img.naturalWidth * s, dh = img.naturalHeight * s
                ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)

                const data = ctx.getImageData(0, 0, W, H)
                const px = data.data
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        const o = (y * W + x) * 4
                        let l = (0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]) / 255
                        l = (l - 0.5) * 1.15 + 0.52                         // a touch more contrast

                        // damascus: broad folded layers + fine flowing grain that wobble the threshold
                        const fold  = Math.sin(x * 0.042 + 3.2 * Math.sin(y * 0.028 + x * 0.009))
                        const grain = Math.sin(y * 0.24 + 4.0 * Math.sin(x * 0.03 + y * 0.012))
                        l += 0.2 * fold + 0.1 * grain

                        const t = (BAYER[y & 7][x & 7] + 0.5) / 64
                        const ink = l < t
                        px[o] = px[o + 1] = px[o + 2] = 0
                        px[o + 3] = ink ? 255 : 0
                    }
                }
                ctx.putImageData(data, 0, 0)
                resolve(c.toDataURL('image/png'))
            } catch {
                resolve(null)
            }
        }
        img.onerror = () => resolve(null)
        img.src = src
    })

    cache.set(key, job)
    return job
}
