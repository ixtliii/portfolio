// ─────────────────────────────────────────────────────────
// THE ARCHIVE - WebGL scene (three.js)
//
// Cards ride a track that winds away from the camera: it
// swings left/right, rises and sinks into the distance, so
// the perspective keeps shifting as you scroll. Passed cards
// fly past the camera. The active card faces you, grows and
// sits dead centre; the rest stand at an angle in the fog.
//
// Card shader (same idea as Antwerp Unseen's SubmissionCard):
//   • while moving, the image breaks into jittering blocks and
//     the RGB channels split, proportional to scroll velocity
//   • inactive: desaturated, a faint damascus dither, depth fog
//   • rounded corners (SDF), real geometry bend + idle ripple
// ─────────────────────────────────────────────────────────
import * as THREE from 'three'
import { isTouch, isSmall } from '../../lib/perf'

// block size: landscape on desktop, taller portrait blocks on phones (set per scene)
export let CARD_W = 2
export let CARD_H = 1.36
let FLOOR_Y = -CARD_H / 2
function setDims(portrait) {
    CARD_W = portrait ? 1.6 : 2
    CARD_H = portrait ? 2.06 : 1.36
    CARD_D = portrait ? 0.72 : 0.82
    FLOOR_Y = -CARD_H / 2
}

// track spacing (world units along the track)
export const BASE = 0.78           // scale of the blocks that aren't selected
export const SPACING = 1.9
export const EXTRA = 0.95          // extra room either side of the active card
export const GROW = 0.84           // active card scale bonus

// ── the path: s = distance along the track (0 = focal point) ──
// One wide, even arc (a slice of a circle) that curves away on both sides of the
// focal point - upcoming projects sweep off to the right, passed ones trail off left.
const ARC_R = 8.5
export function trackPoint(s, out = new THREE.Vector3()) {
    // the circle is tilted back ~50°, so both arms rise as they curve away (a sweeping U)
    const a = s / ARC_R
    const k = ARC_R * (1 - Math.cos(a))
    return out.set(ARC_R * Math.sin(a), k * 0.55, -k * 0.7)
}

// ── shaders ──
// Block depth and corner radius (the cards are soft, rounded 3D blocks)
export let CARD_D = 0.82
const CARD_R = 0.34

const cardVert = () => /* glsl */`
    // A subdivided box rounded in the shader: every vertex is pushed onto a
    // rounded box (inner box + radius), which gives smooth edges with plenty of
    // vertices for the jelly bend below.
    //  • uDrag (signed velocity): trailing side drags back, a wave runs across
    //  • uFlow: wave phase · uIdle: soft wobble at rest
    uniform float uDrag;
    uniform float uFlow;
    uniform float uIdle;
    uniform float uTime;
    uniform float uPhase;
    varying vec3 vObj;
    varying vec3 vN;
    varying vec3 vViewN;
    varying vec3 vViewPos;

    const vec3 HALF = vec3(${(CARD_W / 2).toFixed(4)}, ${(CARD_H / 2).toFixed(4)}, ${(CARD_D / 2).toFixed(4)});
    const float R = ${CARD_R.toFixed(4)};

    void main() {
        vec3 inner = HALF - R;
        vec3 c = clamp(position, -inner, inner);
        vec3 dir = position - c;
        float len = length(dir);
        vec3 n = len > 1e-5 ? dir / len : normal;
        vec3 p = c + n * R;
        vObj = p;
        vN = n;

        float u = p.x / HALF.x;                                     // -1…1 across
        float v = p.y / HALF.y;                                     // -1…1 up
        float sp = abs(uDrag);
        float dir2 = uDrag >= 0.0 ? 1.0 : -1.0;
        float t = 0.5 - 0.5 * u * dir2;                             // 0 leading → 1 trailing
        float t2 = t * t;
        // goo: the trailing end gets pulled out like taffy and thins into a neck,
        // the leading end stays round and full; no ripples, just a thick stretch
        float pull = sp * t2 * t;                                   // strongest at the very back
        p.x -= dir2 * pull * 0.9;                                    // trailing end stretches out behind
        p.y *= 1.0 - pull * 0.38;                                    // …and narrows into a neck
        p.z *= 1.0 - pull * 0.3;
        p.y -= pull * 0.12;                                          // heavy, so it sags a little
        p.x *= 1.0 + sp * (1.0 - t) * 0.06;                          // leading end bulges slightly
        p.y *= 1.0 + sp * (1.0 - t) * 0.04;
        // barely-there breathing at rest
        p.y += uIdle * 0.35 * sin(u * 1.6 + uTime * 0.8 + uPhase);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vViewPos = mv.xyz;
        vViewN = normalize(normalMatrix * n);
        gl_Position = projectionMatrix * mv;
    }
`

const cardFrag = () => /* glsl */`
    uniform sampler2D map;
    uniform float hasMap;
    uniform vec3  baseColor;
    uniform vec2  uvScale;
    uniform vec2  uvOffset;
    uniform float velocity;     // signed, ~ -1…1
    uniform float sharp;        // 0 = soft colour block, 1 = image fully in focus
    uniform float fog;          // 0…1
    uniform float uDark;        // 1 in the dark theme
    uniform vec3  fogColor;
    uniform vec3  glowA;        // rim glow colours (mint → sky)
    uniform vec3  glowB;
    uniform float alpha;
    uniform float uTime;
    uniform float uPhase;
    varying vec3 vObj;
    varying vec3 vN;
    varying vec3 vViewN;
    varying vec3 vViewPos;

    const vec2 SIZE = vec2(${CARD_W.toFixed(4)}, ${CARD_H.toFixed(4)});
    const float DEPTH = ${CARD_D.toFixed(4)};

    float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123); }
    // ordered dithering (4×4 Bayer), same as the intro mascot
    float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
    float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

    // mip bias = blur (the texture has mipmaps): 0 sharp … 7 a soft colour wash
    vec3 samp(vec2 uv, float bias) {
        vec4 t = texture2D(map, clamp(uv, 0.002, 0.998) * uvScale + uvOffset, bias);
        return mix(baseColor, t.rgb, t.a);
    }

    // two-tone gradient from the image's palette, with a light band drifting through it
    vec3 gradientFill(vec2 uv) {
        float d = clamp(uv.x * 0.75 + uv.y * 0.35 - vObj.z * 0.35, 0.0, 1.0);    // diagonal, wraps the sides
        float drift = 0.12 * sin(uTime * 0.35 + uPhase);
        vec3 g = mix(glowA, glowB, smoothstep(0.2 + drift, 0.8 + drift, d));
        float band = exp(-pow((d - 0.5 - drift * 2.0) * 3.2, 2.0));
        return mix(g, vec3(1.0), band * mix(0.28, 0.12, uDark));
    }

    vec3 pastel(vec3 c) {
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.35);                                  // a bit more saturated
        return clamp(mix(c, vec3(1.0), 0.18 * (1.0 - uDark)), 0.0, 1.0);           // and lifted, like frosted glass
    }

    void main() {
        vec2 uv = vObj.xy / SIZE + 0.5;
        float front = smoothstep(0.55, 0.97, vN.z);

        // grain scatter while moving (front face, from Antwerp Unseen)
        float av = abs(velocity);
        vec2 bUv = floor(uv * vec2(280.0, ${(280 * CARD_H / CARD_W).toFixed(1)})) / vec2(280.0, ${(280 * CARD_H / CARD_W).toFixed(1)});
        vec2 rnd = vec2(random(bUv), random(bUv + vec2(1.0, 0.0))) * 2.0 - 1.0;
        uv += rnd * av * 0.07 * front;

        vec3 col;
        float clar = 0.0;
        if (hasMap > 0.5) {
            // the image dissolves into its own blurred colours: toward the edges,
            // along a slow drifting band, and fully on the sides and on inactive blocks
            float edge = smoothstep(0.0, mix(0.3, 0.07, sharp), min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
            float wash = 0.5 + 0.5 * sin(uv.x * 2.4 - uTime * 0.35 + uPhase + 1.2 * sin(uv.y * 1.8 + uTime * 0.21));
            float clarity = front * sharp * edge * mix(mix(0.62, 0.93, sharp), 1.0, wash);
            vec3 soft = gradientFill(uv) ;
            soft = mix(soft, pastel(samp(uv, 6.5)), 0.15);           // a hint of the image underneath
            vec3 crisp = samp(uv, 0.0);
            col = mix(soft, crisp, clarity);
            clar = clarity;
        } else {
            col = gradientFill(uv);
        }

        // sides get lighter toward the back, like light passing through
        float back = (1.0 - front) * clamp(0.5 - vObj.z / DEPTH, 0.0, 1.0);
        col = mix(col, gradientFill(uv), (1.0 - front) * 0.65);
        col = mix(col, mix(vec3(1.0), fogColor, uDark), back * 0.18);
        col *= 0.94 + 0.1 * vN.y;                                  // soft top light

        // rim glow (fresnel), slowly shifting mint ↔ sky
        vec3 V = normalize(-vViewPos);
        float fr = pow(1.0 - abs(dot(normalize(vViewN), V)), 2.2);
        vec3 glow = mix(glowA, glowB, 0.5 + 0.5 * sin(uTime * 0.5 + uPhase + vObj.x * 1.4));
        col = mix(col, glow, fr * 0.8 * (1.0 - 0.55 * sharp * front));
        col += glow * fr * 0.18 * (1.0 - uDark);

        // dark theme: the light pastels read chalky on black → deepen them (gamma), keep the
        // in-focus image as is, and let distance sink blocks into the dark rather than a grey veil
        col = mix(col, col * col * 1.12, uDark * 0.75 * (1.0 - clar));
        col = mix(col, fogColor, fog * mix(1.0, 1.7, uDark));
        // feathered silhouette: sides turn translucent and the border dissolves into
        // the background (the halo behind the block carries its colour outward)
        // solid body; only the faint outermost rim softens, the halo behind does the feathering
        float a = alpha * (1.0 - smoothstep(0.75, 1.0, fr) * 0.6);

        // dither texture: tones fall into steps (finer where the image is in focus,
        // so the work stays readable) and the rim frays into black/white pixels + holes
        vec2 dc = floor(gl_FragCoord.xy / 3.0);
        float th = bayer4(dc);
        float inDot = step(length(fract(gl_FragCoord.xy / 3.0) - 0.5), 0.46);   // round dither dots
        float L = mix(4.0, 12.0, clar);
        col = mix(col, floor(col * L + th) / L, 0.8);
        col *= mix(mix(0.9, 0.97, clar), 1.0, inDot);             // halftone gaps, lighter on the focused image
        float edgeCov = 1.0 - smoothstep(0.12, 0.85, fr);
        if (edgeCov < th * 0.95) {
            float hc = random(dc + floor(uTime * 5.0) * 0.17);
            if (inDot < 0.5) a = 0.0;
            else if (hc > 0.6) col = mix(vec3(1.0), glow * 0.75, uDark);
            else if (hc > 0.4) col *= 0.55;
            else a = 0.0;
        }
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
    }
`

const FLOOR_VERT = /* glsl */`
    varying vec3 vWorld;
    void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`
const FLOOR_FRAG = /* glsl */`
    uniform vec3 ink;
    uniform vec3 focus;
    varying vec3 vWorld;
    void main() {
        vec2 g = fract(vWorld.xz * 3.0) - 0.5;
        float dotA = 1.0 - smoothstep(0.022, 0.04, length(g));
        float dist = length(vWorld.xz - focus.xz);
        float fade = 1.0 - smoothstep(2.0, 16.0, dist);
        float a = dotA * 0.32 * fade;
        if (a < 0.003) discard;
        gl_FragColor = vec4(ink, a);
        #include <colorspace_fragment>
    }
`

// ── helpers ──
// Blocks always keep their own image colours (in every palette).
function applyPalette(u, orig) { u.glowA.value.copy(orig.a); u.glowB.value.copy(orig.b) }

// Two vivid colours from an image: the most saturated quarter of its pixels,
// split by hue into two groups, each averaged and pushed to a light, vivid tone.
function imagePalette(img, fallback) {
    try {
        const N = 32
        const c = document.createElement('canvas')
        c.width = c.height = N
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, N, N)
        const d = ctx.getImageData(0, 0, N, N).data
        const px = []
        const hsl = {}
        const col = new THREE.Color()
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 128) continue
            col.setRGB(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, THREE.SRGBColorSpace)
            col.getHSL(hsl, THREE.SRGBColorSpace)
            const vivid = hsl.s * (1 - Math.abs(hsl.l - 0.5) * 1.6)
            px.push({ r: d[i], g: d[i + 1], b: d[i + 2], h: hsl.h, v: vivid })
        }
        px.sort((a, b) => b.v - a.v)
        const top = px.slice(0, Math.max(8, Math.floor(px.length * 0.25)))
        if (!top.length || top[0].v < 0.08) return [new THREE.Color('#b9c6d8'), new THREE.Color('#e6d9f2')]   // greyscale image → cool silver-lilac
        top.sort((a, b) => a.h - b.h)
        const half = Math.ceil(top.length / 2)
        const avg = (arr) => {
            const n = arr.length || 1
            const o = new THREE.Color().setRGB(
                arr.reduce((t, p) => t + p.r, 0) / n / 255,
                arr.reduce((t, p) => t + p.g, 0) / n / 255,
                arr.reduce((t, p) => t + p.b, 0) / n / 255, THREE.SRGBColorSpace)
            o.getHSL(hsl, THREE.SRGBColorSpace)
            return o.setHSL(hsl.h, Math.max(0.55, Math.min(0.95, hsl.s * 1.25)), Math.min(0.78, Math.max(0.62, hsl.l)), THREE.SRGBColorSpace)
        }
        const a = avg(top.slice(0, half))
        const b = avg(top.slice(half).length ? top.slice(half) : top)
        // keep the two tones clearly apart so the gradient always reads
        const ha = {}, hb = {}
        a.getHSL(ha); b.getHSL(hb)
        let dh = Math.abs(ha.h - hb.h); dh = Math.min(dh, 1 - dh)
        if (dh < 0.1) b.setHSL((ha.h + 0.13) % 1, Math.max(0.6, hb.s), Math.min(0.82, hb.l + 0.06))
        return [a, b]
    } catch {
        return [fallback.clone(), fallback.clone()]
    }
}

function cssColor(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return new THREE.Color(v || fallback)
}

function haloTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

function shadowTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(0,0,0,0.16)')
    g.addColorStop(0.45, 'rgba(0,0,0,0.07)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    return tex
}

// ── scene ──
export function createArchiveScene(container, items, { asset }) {
    const portrait = isSmall() && container.clientHeight > container.clientWidth
    setDims(portrait)
    const CARD_VERT = cardVert(), CARD_FRAG = cardFrag()
    // phones: lower pixel ratio, no MSAA (the dither hides the edges anyway)
    const renderer = new THREE.WebGLRenderer({ antialias: !isTouch(), alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'ax-canvas'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200)

    const colors = {
        bg: cssColor('--ax-fog', '#e4f2fe'),
        ink: cssColor('--text-primary', '#161616'),
        dark: document.documentElement.dataset.theme === 'dark',
    }

    // floor dots
    const floorMat = new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
        uniforms: { ink: { value: colors.ink }, focus: { value: new THREE.Vector3() } },
        transparent: true,
        depthWrite: false,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = FLOOR_Y - 0.002
    scene.add(floor)


    // cards
    const loader = new THREE.TextureLoader()
    const shadowTex = shadowTexture()
    const haloTex = haloTexture()
    const GHOSTS = []
    const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3()
    const WHITE = new THREE.Color(1, 1, 1)
    // subdivided box; the vertex shader rounds it and bends it like jelly
    const cardGeo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D, 48, 32, 14)

    const cards = items.map((p, i) => {
        const group = new THREE.Group()
        const tilt = new THREE.Group()
        group.add(tilt)

        const orig = { a: new THREE.Color(p.color || '#8ff0b8'), b: new THREE.Color(p.color || '#6fd0ff').offsetHSL(0.08, 0.1, 0.05) }
        const uniforms = {
            map: { value: null },
            hasMap: { value: 0 },
            baseColor: { value: new THREE.Color(p.color || '#dddddd') },
            uvScale: { value: new THREE.Vector2(1, 1) },
            uvOffset: { value: new THREE.Vector2(0, 0) },
            velocity: { value: 0 },
            sharp: { value: 0 },
            fog: { value: 0 },
            uDark: { value: colors.dark ? 1 : 0 },
            fogColor: { value: colors.bg },
            glowA: { value: new THREE.Color(p.color || '#8ff0b8') },
            glowB: { value: new THREE.Color(p.color || '#6fd0ff').offsetHSL(0.08, 0.1, 0.05) },
            alpha: { value: 1 },
            uDrag: { value: 0 },
            uFlow: { value: 0 },
            uIdle: { value: 0 },
            uTime: { value: 0 },
            uPhase: { value: i * 1.7 },
        }
        const mat = new THREE.ShaderMaterial({
            vertexShader: CARD_VERT,
            fragmentShader: CARD_FRAG,
            uniforms,
            transparent: true,
            depthWrite: true,
            side: THREE.FrontSide,
        })
        const mesh = new THREE.Mesh(cardGeo, mat)
        mesh.userData.index = i
        tilt.add(mesh)

        if (p.image) {
            loader.load(asset(p.image), (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
                const ia = tex.image.width / tex.image.height
                const ca = CARD_W / CARD_H
                if (ia > ca) { uniforms.uvScale.value.set(ca / ia, 1); uniforms.uvOffset.value.set((1 - ca / ia) / 2, 0) }
                else { uniforms.uvScale.value.set(1, ia / ca); uniforms.uvOffset.value.set(0, (1 - ia / ca) / 2) }
                uniforms.map.value = tex
                uniforms.hasMap.value = 1
                // glow + gradient come from the project's own image
                const [ca2, cb2] = imagePalette(tex.image, uniforms.baseColor.value)
                orig.a.copy(ca2); orig.b.copy(cb2)
                applyPalette(uniforms, orig)
            })
        }


        // soft contact shadow
        const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(CARD_W * 1.7, 1.5),
            new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.6 })
        )
        shadow.rotation.x = -Math.PI / 2
        shadow.position.set(0, FLOOR_Y + 0.001, 0.05)
        group.add(shadow)

        // soft halo in the block's own colours behind it, so the block melts into the background
        const halos = [0, 1].map((h) => {
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({
                map: haloTex, color: new THREE.Color(1, 1, 1),
                transparent: true, depthWrite: false, opacity: 0,
            }))
            sp.renderOrder = -1
            group.add(sp)
            return sp
        })

        // ghost copies that lag behind while the block moves → a fading trail
        const ghosts = GHOSTS.map(({ lag }) => {
            const gu = { ...uniforms, alpha: { value: 0 } }
            const gm = new THREE.ShaderMaterial({ vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, uniforms: gu, transparent: true, depthWrite: false })
            const g = new THREE.Mesh(cardGeo, gm)
            g.matrixAutoUpdate = false
            g.visible = false
            g.renderOrder = -0.5
            scene.add(g)
            return { mesh: g, u: gu, lag, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scl: new THREE.Vector3(1, 1, 1), init: false }
        })

        scene.add(group)
        applyPalette(uniforms, orig)
        return {
            orig,
            group, tilt, mesh, uniforms, shadow, halos, ghosts, tiltX: 0, tiltY: 0,
            // per-card springs (follow-through): position along the track, scale, yaw
            init: false, sPos: 0, sVel: 0, sc: BASE, scV: 0, yaw: 0, drag: 0, flow: Math.random() * 10,
        }
    })


    // ── layout ──
    let mobile = false
    const resize = () => {
        const w = container.clientWidth, h = container.clientHeight
        mobile = w < 900
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
    }
    resize()

    const distOf = (i, a) => {
        let d = 0
        for (let j = 0; j < i; j++) {
            const f1 = Math.max(0, 1 - Math.abs(j - a))
            const f2 = Math.max(0, 1 - Math.abs(j - (a - 1)))
            d += SPACING + EXTRA * Math.min(1, f1 + f2)
        }
        return d
    }
    const distAt = (a) => {
        const i0 = Math.max(0, Math.floor(a)), t = a - i0
        const d0 = distOf(i0, a), d1 = distOf(i0 + 1, a)
        return d0 + (d1 - d0) * t
    }

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const camTarget = new THREE.Vector3()
    const pos = new THREE.Vector3()
    const ahead = new THREE.Vector3()
    const ahead2 = new THREE.Vector3()
    const ahead3 = new THREE.Vector3()
    const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))
    const smoothstep = (t) => t * t * (3 - 2 * t)

    // pick card under a client-space point → index or -1
    const pick = (clientX, clientY) => {
        const r = renderer.domElement.getBoundingClientRect()
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
        raycaster.setFromCamera(ndc, camera)
        const hits = raycaster.intersectObjects(cards.map(c => c.mesh), false)
        const hit = hits.find(h => h.object.visible && h.object.material.uniforms.alpha.value > 0.3)
        if (!hit) return null
        const lp = hit.object.worldToLocal(hit.point.clone())
        return { index: hit.object.userData.index, uv: new THREE.Vector2(lp.x / CARD_W + 0.5, lp.y / CARD_H + 0.5) }
    }

    /**
     * cur: smoothed active index (float), vel: smoothed velocity (index/frame),
     * time: seconds, mouse: {x,y} in -1…1, hover: {index, uv} | null
     */
    let lastT = 0
    const _a = new THREE.Vector3()
    const label = { index: 0, e: 0, x: 0, y: 0 }
    const render = ({ cur, vel, time, mouse, hover, progress }) => {
        label.e = 0
        const n = cards.length
        const dt = Math.min(3, Math.max(0.2, ((time - lastT) || 1 / 60) * 60))   // frames @60fps
        lastT = time
        const focus = distAt(cur)
        const lean = Math.max(-1, Math.min(1, vel * 6))
        const glitch = Math.max(-0.75, Math.min(0.75, vel * 7))

        // camera: high and to the left, always aimed at the focal point → active card centred
        const swayX = mouse.x * 0.5 + (progress - 0.5) * 0.8
        if (portrait) {
            // phones: closer and lower, so the tall active block fills the screen and faces you
            const camDist = 12.2, k = camDist / 15
            camera.position.set((-1.1 + swayX * 0.6) * k, 3.4 * k, camDist)
            camTarget.set(0.06, 0.15, 0)
        } else {
            const camDist = mobile ? 18.5 : 12.2
            // same angle as before, just further back (scaled by camDist) → smaller scene, same composition
            const k = camDist / (mobile ? 15 : 9.2)
            camera.position.set(((mobile ? -1.2 : -2.6) + swayX) * k, ((mobile ? 5.2 : 3.3) - mouse.y * 0.3) * k, camDist)
            camTarget.set(mobile ? 0.25 : 0, mobile ? 1.1 : 0.55, 0)
        }
        camera.lookAt(camTarget)
        // a touch of dolly-zoom when moving fast - perspective breathes with the scroll
        const fov = (mobile ? 42 : 34) + Math.min(9, Math.abs(vel) * 70)
        if (Math.abs(camera.fov - fov) > 0.01) { camera.fov += (fov - camera.fov) * 0.15; camera.updateProjectionMatrix() }

        // world shifts so the focal point of the track sits at the origin
        const ox = 0, oy = 0, oz = 0                     // the arc is fixed; cards slide along it
        floorMat.uniforms.focus.value.set(0, 0, 0)
        floor.position.x = -((focus * 0.9) % (1 / 3))     // the floor drifts with the scroll

        for (let i = 0; i < n; i++) {
            const c = cards[i]
            const s = distOf(i, cur) - focus
            const di = i - cur                                   // index distance (signed)
            const abs = Math.abs(di)

            // passed blocks trail off along the left arm of the arc
            const alpha = di < 0 ? Math.max(0, 1 + di * 0.3) : Math.max(0, Math.min(1, (6.5 - di) / 2.5))
            c.group.visible = alpha > 0.004
            if (!c.group.visible) { c.ghosts.forEach(g => (g.mesh.visible = false)); continue }

            // ── follow-through: each card chases its spot on the track with its own spring;
            //    cards further from the focus are looser, so the line ripples like fabric
            if (!c.init) { c.sPos = s; c.sVel = 0; c.init = true }
            const stiff = 0.16 - Math.min(0.09, abs * 0.022)
            c.sVel += (s - c.sPos) * stiff * dt
            c.sVel *= Math.pow(0.66, dt)
            c.sPos += c.sVel * dt

            trackPoint(c.sPos, pos)
            // a gentle lift while travelling, like cloth catching air
            const airLift = Math.min(0.25, Math.abs(c.sVel) * 0.6)
            c.group.position.set(pos.x - ox, trackY(pos.y) - trackY(oy) + airLift, pos.z - oz)

            // how "selected" this card is (1 = active). Spread over a wider stretch of scroll with a
            // smootherstep curve, then eased per card so selecting/deselecting glides rather than snaps
            const x01 = Math.max(0, 1 - abs / 1.35)
            const eRaw = x01 * x01 * x01 * (x01 * (x01 * 6 - 15) + 10)
            if (c.eS === undefined) c.eS = eRaw
            c.eS += (eRaw - c.eS) * 0.055 * dt
            const e = c.eS

            // card's own velocity → how much the fabric drags
            const dragT = Math.max(-1, Math.min(1, c.sVel * 5))
            c.dragV = (c.dragV || 0) + (dragT - c.drag) * 0.05 * dt
            c.dragV *= Math.pow(0.68, dt)
            c.drag = Math.max(-1.2, Math.min(1.2, c.drag + c.dragV * dt))
            c.flow += (0.03 + Math.abs(c.drag) * 0.35) * dt

            // face: active looks straight at the camera; others stand turned ~35° along the track.
            // yaw is sprung too, and swings with the drag
            // ── follow the path: each card is oriented by the track's direction at its spot,
            //    so it swings with every bend of the S
            trackPoint(c.sPos + 0.06, ahead2)
            // card runs ALONG the line (its face is the track's side normal), facing the camera's side
            const dirX = ahead2.x - pos.x, dirZ = ahead2.z - pos.z
            const sideA = Math.atan2(-dirZ, dirX)                  // normal (−dz, dx)
            const sideB = sideA + Math.PI
            const toCamX = camera.position.x - (pos.x - ox), toCamZ = camera.position.z - (pos.z - oz)
            const pathYaw = (Math.sin(sideA) * toCamX + Math.cos(sideA) * toCamZ) >= 0 ? sideA : sideB
            // curvature → bank into the bend
            trackPoint(c.sPos + 0.6, ahead3)
            const curve = wrapAngle(Math.atan2(ahead3.x - ahead2.x, ahead3.z - ahead2.z) - Math.atan2(dirX, dirZ))

            // cards in the fog turn partly toward the camera; the selected one faces the viewport fully
            const faceCam = Math.atan2(camera.position.x - c.group.position.x, camera.position.z - c.group.position.z)
            const yawT = pathYaw + wrapAngle(faceCam - pathYaw) * (0.14 + 0.86 * e) + (lean * 0.25 + c.drag * 0.2) * (1 - e * 0.8)
            if (!c.yawInit) { c.yaw = yawT; c.yawInit = true }
            c.yaw += wrapAngle(yawT - c.yaw) * 0.07 * dt
            c.roll = (c.roll || 0) + ((-curve * 0.9) * (1 - e * 0.7) - (c.roll || 0)) * 0.12 * dt
            c.group.rotation.set(0, c.yaw, c.roll, 'YXZ')

            // grow from the floor - springy, with a soft overshoot
            const scT = BASE + GROW * e
            c.scV += (scT - c.sc) * 0.045 * dt
            c.scV *= Math.pow(0.8, dt)
            c.sc += c.scV * dt
            c.mesh.scale.setScalar(c.sc)
            c.mesh.position.y = FLOOR_Y + (CARD_H / 2) * c.sc + e * 0.06

            // pointer tilt on the active card (Antwerp Unseen)
            const isHover = hover && hover.index === i
            const tx = isHover && e > 0.5 ? (hover.uv.y - 0.5) * -0.16 : 0
            const ty = isHover && e > 0.5 ? (hover.uv.x - 0.5) * 0.16 : 0
            c.tiltX += (tx - c.tiltX) * 0.12
            c.tiltY += (ty - c.tiltY) * 0.12
            c.tilt.rotation.set(c.tiltX, c.tiltY, 0)

            const u = c.uniforms
            u.velocity.value = glitch * (0.55 + 0.45 * e)
            const hoverLift = isHover ? 0.65 : 0
            u.sharp.value = Math.max(e, hoverLift)
            u.fog.value = (1 - e) * Math.min(0.3, 0.0 + abs * 0.06) * (1 - hoverLift * 0.6)
            u.alpha.value = alpha
            u.uDrag.value = c.drag * (1 - e * 0.35)
            u.uFlow.value = c.flow
            u.uIdle.value = 0.05 * (1 - e * 0.5)
            u.uTime.value = time

            c.shadow.material.opacity = alpha * (0.35 + 0.4 * e) * Math.max(0, 1 - pos.y * 0.9)
            c.shadow.position.y = FLOOR_Y + 0.001 - pos.y
            c.shadow.scale.setScalar(c.sc)

            if (e > label.e) {
                label.e = e; label.index = i
                c.mesh.updateWorldMatrix(true, false)
                _a.set(0, -CARD_H / 2, CARD_D / 2).applyMatrix4(c.mesh.matrixWorld).project(camera)
                label.x = (_a.x * 0.5 + 0.5) * renderer.domElement.clientWidth
                label.y = (-_a.y * 0.5 + 0.5) * renderer.domElement.clientHeight
                // right edge, half height: where the end-of-archive button docks
                _a.set(CARD_W / 2, 0, CARD_D / 2).applyMatrix4(c.mesh.matrixWorld).project(camera)
                label.rx = (_a.x * 0.5 + 0.5) * renderer.domElement.clientWidth
                label.ry = (-_a.y * 0.5 + 0.5) * renderer.domElement.clientHeight
            }

            // halos sit just behind the block's centre
            const cy = FLOOR_Y + (CARD_H / 2) * c.sc
            c.halos.forEach((h, k) => {
                h.position.set((k ? 0.55 : -0.55) * c.sc, cy + (k ? -0.1 : 0.12), -CARD_D * 0.6)
                h.scale.set(CARD_W * 1.55 * c.sc, CARD_H * 2.1 * c.sc, 1)
                // light theme: a pale wash of the block's colours; dark theme: lean into the
                // background instead of white, or the glow reads as a white fog
                h.material.color.copy(k ? c.uniforms.glowB.value : c.uniforms.glowA.value).lerp(colors.dark ? colors.bg : WHITE, colors.dark ? 0.1 : 0.5)
                // dark: a light halo over black is what read as a musty white fog, so only the
                // active block keeps a faint glow of its own colour
                h.material.opacity = colors.dark ? alpha * e * 0.1 : alpha * (0.22 + 0.22 * e)
            })

            // ghost trail: each ghost eases toward the block's current pose; visible only while it lags
            c.mesh.updateWorldMatrix(true, false)
            c.mesh.matrixWorld.decompose(_p, _q, _s)
            c.ghosts.forEach((g, k) => {
                if (!g.init) { g.pos.copy(_p); g.quat.copy(_q); g.scl.copy(_s); g.init = true }
                const f = Math.min(1, g.lag * dt)
                g.pos.lerp(_p, f); g.quat.slerp(_q, f); g.scl.lerp(_s, f)
                const gap = g.pos.distanceTo(_p)
                const ga = alpha * GHOSTS[k].a * Math.min(1, gap * 1.6)
                g.u.alpha.value = ga
                g.mesh.visible = ga > 0.01
                g.mesh.matrix.compose(g.pos, g.quat, g.scl)
                g.mesh.matrixWorld.copy(g.mesh.matrix)
            })
        }

        renderer.render(scene, camera)
        return label
    }

    const dispose = () => {
        cards.forEach(c => {
            c.uniforms.map.value?.dispose()
            c.mesh.material.dispose()
            c.shadow.geometry.dispose()
            c.shadow.material.dispose()
        })
        cardGeo.dispose()
        shadowTex.dispose()
        haloTex.dispose()
        cards.forEach(c => {
            c.halos.forEach(h => h.material.dispose())
            c.ghosts.forEach(g => { g.mesh.material.dispose(); scene.remove(g.mesh) })
        })
        floor.geometry.dispose(); floorMat.dispose()
        renderer.dispose()
        renderer.domElement.remove()
    }

    // re-read colours from CSS tokens (light/dark theme switch)
    const setTheme = () => {
        cards.forEach(c => applyPalette(c.uniforms, c.orig))
        colors.bg.copy(cssColor('--ax-fog', '#e4f2fe'))
        colors.ink.copy(cssColor('--text-primary', '#161616'))
        colors.dark = document.documentElement.dataset.theme === 'dark'
        cards.forEach(c => { c.uniforms.uDark.value = colors.dark ? 1 : 0 })
    }

    // adaptive resolution: a struggling device drops a step of pixel ratio (never below 1)
    const lowerDpr = () => {
        const cur = renderer.getPixelRatio()
        if (cur <= 1) return false
        renderer.setPixelRatio(Math.max(1, cur - 0.25))
        resize()
        return true
    }

    return { render, resize, pick, dispose, setTheme, lowerDpr }
}

// floor follows the track's height softly so cards always stand on it
function trackY(y) { return y }
