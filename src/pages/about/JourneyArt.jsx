import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// ─────────────────────────────────────────────────────────
// Dot-matrix 3D illustrations for the journey cards, in the same
// language as the contact card's art: a tiny ray-marched scene,
// one canvas pixel per dot (CSS masks each pixel into a round dot),
// ordered-dither shading in the card's own gradient.
//   kind 0 · browser window   (web design)
//   kind 1 · 3D bar chart      (dashboards / data)
//   kind 2 · component layers  (design systems / product)
// ─────────────────────────────────────────────────────────
const CELL = 7

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision mediump float;
uniform vec2  uRes;
uniform float uTime;
uniform float uKind;
uniform vec2  uMouse;
uniform vec3  uG0, uG1, uG2;

float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }

float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdBox2(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2){
    vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
    vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
    vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
    vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
    vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
    float sg = sign(e0.x * e2.y - e0.y * e2.x);
    vec2 d = min(min(vec2(dot(pq0, pq0), sg * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(pq1, pq1), sg * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(pq2, pq2), sg * (v2.x * e2.y - v2.y * e2.x)));
    return -sqrt(d.x) * sign(d.y);
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float scene(vec3 p){
    float t = uTime;
    if (uKind < 0.5) {
        // a chunky 3D cursor arrow, clicking on a little button
        float click = pow(0.5 + 0.5 * sin(t * 1.6), 6.0);
        vec3 bp = p - vec3(0.35, -0.95, -0.2);
        bp.yz *= rot(0.55);
        float button = sdRBox(bp, vec3(0.95, 0.16 - 0.07 * click, 0.42), 0.16);
        p -= vec3(0.0, 0.18 + 0.12 * sin(t * 1.6) - 0.1, 0.0);
        p.xz *= rot(0.25 * sin(t * 0.5) + uMouse.x * 0.6);
        p.xy *= rot(0.12);
        // arrow outline in 2D, then extruded
        vec2 q = p.xy;
        float tri = sdTri(q, vec2(-0.45, 0.85), vec2(-0.45, -0.55), vec2(0.55, -0.05));
        vec2 tq = q - vec2(0.02, -0.38);
        tq *= rot(-0.5);
        float tail = sdBox2(tq, vec2(0.11, 0.38));
        float shape = min(tri, tail) - 0.04;
        vec2 w = vec2(shape, abs(p.z) - 0.13);
        float arrow = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.05;
        return min(arrow, button);
    }
    if (uKind < 1.5) {
        // bar chart: bars rise and fall on a base plate
        p.y += 0.35;
        p.xz *= rot(-0.32 + 0.2 * sin(t * 0.35) + uMouse.x * 0.5);
        p.yz *= rot(0.22);
        float d = sdRBox(p, vec3(1.3, 0.06, 0.55), 0.06);
        for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float h = 0.25 + 0.45 * (0.5 + 0.5 * sin(t * 0.9 + fi * 1.4)) + fi * 0.12;
            vec3 q = p - vec3(-0.9 + fi * 0.6, 0.06 + h, 0.0);
            d = min(d, sdRBox(q, vec3(0.17, h, 0.17), 0.05));
        }
        return d;
    }
    // component layers: three tiles that drift apart and back, with a token on top
    p.yz *= rot(0.3 + uMouse.y * 0.25);
    p.xz *= rot(0.6 + t * 0.25 + uMouse.x * 0.6);
    float spread = 0.42 + 0.14 * sin(t * 0.9);
    float d = 1e3;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec3 q = p - vec3(0.0, (fi - 1.0) * spread - 0.1, 0.0);
        q.xz *= rot(fi * 0.22 * sin(t * 0.5));
        d = min(d, sdRBox(q, vec3(0.7, 0.09, 0.7), 0.16));
    }
    float ball = length(p - vec3(0.2, spread + 0.36 + 0.06 * sin(t * 1.7), -0.15)) - 0.24;
    return min(d, ball);
}

vec3 nrm(vec3 p){
    vec2 e = vec2(0.003, 0.0);
    return normalize(vec3(scene(p + e.xyy) - scene(p - e.xyy), scene(p + e.yxy) - scene(p - e.yxy), scene(p + e.yyx) - scene(p - e.yyx)));
}

void main(){
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = (frag - 0.5 * uRes) / uRes.y;
    float th = bayer4(frag);

    // the field: a slow, dithered wash in the card's light tones
    float n = 0.5 + 0.5 * sin(frag.x / uRes.x * 3.0 + uTime * 0.3 + 1.6 * sin(frag.y / uRes.y * 2.2 - uTime * 0.25));
    float g = clamp(0.25 + 0.4 * (1.0 - frag.y / uRes.y) + 0.3 * n, 0.0, 1.0);
    float gs = floor(g * 4.0 + th) / 4.0;
    vec3 bg = mix(uG0, mix(uG0, uG1, 0.55), gs);

    vec3 ro = vec3(0.0, 0.7, 5.0);
    vec3 rd = normalize(vec3(uv - vec2(0.0, -0.06), -1.75));
    rd.yz *= rot(-0.14);
    float t = 0.0, hit = 0.0;
    for (int i = 0; i < 64; i++) {
        float d = scene(ro + rd * t);
        if (d < 0.004) { hit = 1.0; break; }
        t += d;
        if (t > 11.0) break;
    }
    if (hit < 0.5) {
        // soft contact shadow under the object
        float sh = smoothstep(0.42, 0.0, length(uv * vec2(0.9, 3.0) - vec2(0.0, -0.95)));
        if (sh * 0.85 > th) bg = mix(bg, uG1, 0.7);
        gl_FragColor = vec4(bg, 1.0);
        return;
    }
    vec3 p = ro + rd * t;
    vec3 N = nrm(p);
    vec3 L = normalize(vec3(-0.6, 0.75, 0.7));
    float dif = max(dot(N, L), 0.0);
    float rim = pow(1.0 - max(dot(N, -rd), 0.0), 2.0);
    float top = max(N.y, 0.0);
    // a little ambient occlusion so recesses and gaps read at dot resolution
    float ao = clamp(scene(p + N * 0.14) / 0.14, 0.0, 1.0);
    float side = abs(N.x);                        // side faces a step darker than the front
    float lum = clamp((0.3 + 0.6 * dif + 0.28 * top - 0.42 * rim - 0.14 * side) * mix(0.45, 1.0, ao), 0.0, 1.0);   // dark silhouette edges keep the shape legible
    float q = floor(lum * 4.0 + th) / 4.0;
    vec3 shadow = uG2 * 0.62;
    vec3 col = q < 0.5 ? mix(shadow, uG2, q * 2.0) : mix(uG2, mix(uG0, vec3(1.0), 0.6), (q - 0.5) * 2.0);
    gl_FragColor = vec4(col, 1.0);
}
`

function rgb(hex) {
    const h = hex.replace('#', '')
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
}

export default function JourneyArt({ kind, grad }) {
    const ref = useRef(null)

    useEffect(() => {
        const canvas = ref.current
        const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false })
        if (!gl) return
        const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s }
        const prog = gl.createProgram()
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, 'p')
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U = (n) => gl.getUniformLocation(prog, n)
        const uRes = U('uRes'), uTime = U('uTime'), uKind = U('uKind'), uMouse = U('uMouse')
        gl.uniform1f(uKind, kind)
        gl.uniform3fv(U('uG0'), rgb(grad[0]))
        gl.uniform3fv(U('uG1'), rgb(grad[1]))
        gl.uniform3fv(U('uG2'), rgb(grad[2]))

        let cols = 0, rows = 0
        const resize = () => {
            const r = canvas.parentElement.getBoundingClientRect()
            cols = Math.max(1, Math.ceil(r.width / CELL)); rows = Math.max(1, Math.ceil(r.height / CELL))
            canvas.width = cols; canvas.height = rows
            canvas.style.width = `${cols * CELL}px`; canvas.style.height = `${rows * CELL}px`
            gl.viewport(0, 0, cols, rows)
            gl.uniform2f(uRes, cols, rows)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(canvas.parentElement)

        // the object leans toward the pointer a little
        const m = { x: 0, y: 0, tx: 0, ty: 0 }
        const onMove = (e) => { m.tx = e.clientX / window.innerWidth - 0.5; m.ty = e.clientY / window.innerHeight - 0.5 }
        window.addEventListener('pointermove', onMove)

        let visible = false
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(canvas)
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        let acc = 0
        const draw = (time) => {
            m.x += (m.tx - m.x) * 0.06; m.y += (m.ty - m.y) * 0.06
            gl.uniform1f(uTime, reduce ? 1.0 : time)
            gl.uniform2f(uMouse, m.x, m.y)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        const card = canvas.closest('.ab-stack-card')
        const loop = (time, dt) => {
            if (!visible) return
            if (card && parseFloat(card.style.opacity || '1') < 0.05) return   // buried in the stack
            acc += dt
            if (acc < 33) return            // 30fps is plenty at dot resolution
            acc = 0
            draw(time)
        }
        draw(0)
        gsap.ticker.add(loop)
        return () => {
            gsap.ticker.remove(loop)
            ro.disconnect(); io.disconnect()
            window.removeEventListener('pointermove', onMove)
        }
    }, [kind, grad])

    return <div className="ab-art"><canvas ref={ref} aria-hidden /></div>
}
