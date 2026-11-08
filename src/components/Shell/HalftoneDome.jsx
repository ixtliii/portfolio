import { useEffect, useRef, useState } from 'react'
import { ShaderEffect, useWebGPUDevice } from '../../lib/custom-effect-runtime/index'
import {
    setup as setupLens, render as renderLens, manifest as manifestLens,
} from '../../lib/custom-effects/CodeComponentId_505065ffcd2ca330e2c78951d58d5c7d9d78a08d_8353'
import {
    setup as setupBokeh, render as renderBokeh, manifest as manifestBokeh,
} from '../../lib/custom-effects/CodeComponentId_3380eaea43dad9505138f0f1731915a7c6465221_8337'

/* ─────────────────────────────────────────────────────────
   The halftone dome from the Figma frame (Ellipse 2, 1:253):
   a 1488px circle filled with a hexagonal grid of white dots
   (Ellipse 1, 1:252, as a pattern fill), run through the two
   shader effects authored in Figma — Lens distortion, then
   Bokeh blur — with the exact parameters from the file.

   Browsers with HTML-in-Canvas use Figma's <ShaderEffect>
   runtime as-is. Everyone else (that's almost every browser
   today) gets the same two shader modules driven directly
   with WebGPU, using the pattern rasterised to an image as
   input instead of a live DOM capture; the result is read back
   once into a plain 2D canvas (it's a static background). Without
   WebGPU, the plain pattern is shown with a light blur.
   ───────────────────────────────────────────────────────── */

const DESIGN_D = 1487.9794921875

// Same objects, same order, same params as the Figma export (stable identity).
const DOME_SHADERS = [
    {
        setup: setupLens, render: renderLens, manifest: manifestLens,
        params: { chromaticMode: 0, distortionStrength: 0.2800000011920929, aberrationStrength: 0.20000000298023224, centre: { x: 50, y: 50 }, quality: 0 },
    },
    {
        setup: setupBokeh, render: renderBokeh, manifest: manifestBokeh,
        params: { radius: 37.0512809753418, density: 1 },
    },
]

// Ellipse 2's pattern fill, as exported from Figma (full circle, unclipped)
const patternSvg = (px) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${px}" height="${px}" viewBox="0 0 ${DESIGN_D} ${DESIGN_D}">
<circle cx="743.99" cy="743.99" r="743.99" fill="url(#p)"/>
<defs><pattern id="p" patternUnits="userSpaceOnUse" patternTransform="matrix(13.2744 0 0 26.5489 0 0)" preserveAspectRatio="none" viewBox="0 0 18.66 37.32" width="1" height="1">
<use xlink:href="#p_inner" transform="translate(-18.66 0)"/>
<g id="p_inner"><circle cx="3" cy="3" r="3" transform="matrix(-1 0 0 1 6 0)" fill="white"/></g>
<use xlink:href="#p_inner" transform="translate(-9.33 18.66)"/>
<use xlink:href="#p_inner" transform="translate(9.33 18.66)"/>
</pattern></defs></svg>`

const svgUrl = (px) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(patternSvg(px))}`

const hasHtmlInCanvas = () =>
    typeof GPUQueue !== 'undefined' &&
    ('drawElementImageToTexture' in GPUQueue.prototype || 'copyElementImageToTexture' in GPUQueue.prototype)

/** Runs the Figma shader stack once on a static image input with plain WebGPU. */
function ImageShaderCanvas({ size, className, onReady, onFail }) {
    const { device, error } = useWebGPUDevice()
    const [src, setSrc] = useState(null)

    useEffect(() => { if (error) onFail?.() }, [error, onFail])

    useEffect(() => {
        if (!device || !size) return
        let cancelled = false
        let objectUrl = null
        const textures = []

        const run = async () => {
            const scale = Math.min(window.devicePixelRatio || 1, 1.5)
            const W = Math.min(Math.round(size * scale), device.limits.maxTextureDimension2D)
            const renderScale = W / size

            // rasterise the pattern circle
            const img = new Image()
            img.src = svgUrl(W)
            await img.decode()
            if (cancelled) return
            const raster = document.createElement('canvas')
            raster.width = raster.height = W
            raster.getContext('2d').drawImage(img, 0, 0, W, W)

            // The dome is static: render it once on the GPU into a texture, read it back
            // and show it in a 2D canvas. No live WebGPU canvas to keep alive or lose.
            const format = 'rgba8unorm'
            const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            const input = device.createTexture({ size: [W, W, 1], format, usage })
            const inter = [0, 1].map(() => device.createTexture({
                size: [W, W, 1], format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            }))
            textures.push(input, ...inter)
            device.queue.copyExternalImageToTexture(
                { source: raster },
                { texture: input, premultipliedAlpha: true },
                [W, W],
            )

            // same frame-state contract as the Figma runtime (useShaderRuntime → getShaderState)
            const gpu = { device, context: null, format }
            const states = DOME_SHADERS.map(() => ({}))
            const last = DOME_SHADERS.length - 1
            const outFor = (i) => (i === last ? inter[0] : inter[(i + 1) % 2])
            const frameFor = (i) => ({
                gpu,
                input: i === 0 ? input : inter[i % 2],
                output: outFor(i),
                time: 0, deltaTime: 0, frame: 0,
                mousePosition: { x: 0, y: 0, down: false },
                renderScale,
                params: DOME_SHADERS[i].params,
                state: states[i],
            })
            DOME_SHADERS.forEach((sh, i) => sh.setup(device, frameFor(i)))
            DOME_SHADERS.forEach((sh, i) => sh.render(device, frameFor(i)))

            // read back (rows padded to 256 bytes)
            const bpr = Math.ceil((W * 4) / 256) * 256
            const buf = device.createBuffer({ size: bpr * W, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
            const enc = device.createCommandEncoder()
            enc.copyTextureToBuffer({ texture: outFor(last) }, { buffer: buf, bytesPerRow: bpr }, [W, W])
            device.queue.submit([enc.finish()])
            await buf.mapAsync(GPUMapMode.READ)
            if (cancelled) { buf.destroy(); return }
            const raw = new Uint8Array(buf.getMappedRange())
            const img2d = new ImageData(W, W)
            const px = img2d.data
            for (let y = 0; y < W; y++) {
                let o = y * bpr, d = y * W * 4
                for (let x = 0; x < W; x++, o += 4, d += 4) {
                    const a = raw[o + 3]
                    if (a === 0) continue
                    // shader output is premultiplied; ImageData is straight alpha
                    const k = 255 / a
                    px[d] = raw[o] * k; px[d + 1] = raw[o + 1] * k; px[d + 2] = raw[o + 2] * k
                    // Figma's renderer shows this layer at 1−(1−α)² (measured against the
                    // frame's own render at five points) — match it
                    const f = a / 255
                    px[d + 3] = 255 * (1 - (1 - f) * (1 - f))
                }
            }
            buf.unmap(); buf.destroy()
            // hand it over as a plain image (cheapest thing for the compositor to scroll)
            const out2d = document.createElement('canvas')
            out2d.width = out2d.height = W
            out2d.getContext('2d').putImageData(img2d, 0, 0)
            const blob = await new Promise(res => out2d.toBlob(res, 'image/png'))
            if (cancelled || !blob) return
            objectUrl = URL.createObjectURL(blob)
            setSrc(objectUrl)
            onReady?.()
        }

        run().catch((e) => {
            console.warn('Halftone dome: falling back', e)
            if (!cancelled) onFail?.()
        })

        return () => {
            cancelled = true
            textures.forEach(t => t.destroy())
            // keep the previous image on screen until the next one is ready
            if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
        }
    }, [device, size, onReady, onFail])

    return src ? <img src={src} className={className} alt="" aria-hidden draggable="false" /> : null
}

export default function HalftoneDome({ size }) {
    const [mode] = useState(() => {
        if (typeof navigator === 'undefined' || !navigator.gpu) return 'fallback'
        return hasHtmlInCanvas() ? 'html-in-canvas' : 'webgpu'
    })
    const [failed, setFailed] = useState(false)
    const [ready, setReady] = useState(mode === 'html-in-canvas')
    const onReady = useRef(() => setReady(true)).current
    const onFail = useRef(() => setFailed(true)).current

    if (!size) return null

    if (mode === 'fallback' || failed) {
        return <img className="sh-dome sh-dome--fallback is-ready" src={svgUrl(Math.round(size))} alt="" aria-hidden />
    }

    if (mode === 'html-in-canvas') {
        return (
            <ShaderEffect className="sh-dome is-ready" shaders={DOME_SHADERS}>
                <img src={svgUrl(Math.round(size))} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </ShaderEffect>
        )
    }

    // debounce resizes so the (static, one-shot) render isn't redone on every frame of a drag
    return <DebouncedImageShader size={size} ready={ready} onReady={onReady} onFail={onFail} />
}

function DebouncedImageShader({ size, ready, onReady, onFail }) {
    const [s, setS] = useState(size)
    useEffect(() => {
        const id = setTimeout(() => setS(size), 180)
        return () => clearTimeout(id)
    }, [size])
    return (
        <ImageShaderCanvas
            size={s}
            className={`sh-dome${ready ? ' is-ready' : ''}`}
            onReady={onReady}
            onFail={onFail}
        />
    )
}
