import { maxDpr } from '../../lib/perf'

// ─────────────────────────────────────────────────────────
// The intro avatar: a chrome flower that talks with its eyes,
// ray-marched in a single fragment shader (plain WebGL, no deps).
//
// Controls (all smoothed in JS, see createAvatar().state):
//   look   – where the eyes/face point (-1…1)
//   talk   – syllable pulse: the eyes bounce when it "speaks" (0…1)
//   blink  – eyelid closure (0…1)
//   squash – body squash/stretch (-1…1)
//   hop    – vertical bounce
//   reveal – 0 = dissolved into glitchy pixels, 1 = fully there
// ─────────────────────────────────────────────────────────

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uLook;
uniform float uTalk;
uniform float uBlink;
uniform float uSquash;
uniform float uHop;
uniform float uReveal;
uniform vec3  uA;      // jelly colours (palette)
uniform vec3  uB;
uniform vec3  uC;
uniform vec3  uInk;    // eyes
uniform vec3  uGlint;  // eye highlights
uniform float uHappy;  // 0 → 1: eyes curve into smiling crescents
uniform float uOpen;   // eye openness (1 = normal, >1 wide)
uniform float uTilt;   // -1 determined … 1 soft/sad (inner corners)
uniform float uSide;
uniform float uSpin;   // yaw, radians (turns around to show it is 3D)
uniform float uMouth;  // 0…1: a pixel mouth opens (for eating mail)
uniform float uCard;   // 1 = card-art mode (low-res, recoloured with uG1…uG3)
uniform vec3  uG1;     // card gradient: light → mid → deep
uniform vec3  uG2;
uniform vec3  uG3;
uniform vec3  uCam;    // camera: x/y offset, zoom (<1 = closer)
float gEye = 0.0;      // set by shade(): this pixel is eye/mouth ink   // which eye leads a syllable (-1…1)

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// world → body space (hop, lean toward the look, squash & stretch)
vec3 toBody(vec3 p) {
    p.y -= uHop;
    p.y += 0.95;                                   // squash around the bottom, like sitting on a surface
    float sq = uSquash + 0.045 * sin(uTime * 2.1); // + breathing
    p.y /= (1.0 - sq * 0.2);
    p.xz /= (1.0 + sq * 0.1);
    p.y -= 0.95;
    p.xz = rot(uSpin) * p.xz;
    p.xy = rot(uLook.x * 0.16) * p.xy;
    p.yz = rot(-uLook.y * 0.12) * p.yz;
    return p;
}

float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// ellipsoid (good-enough bound)
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }

const float NP = 8.0;                      // petals
const float SECTOR = 0.78539816;           // 2π / NP

// one petal, in its own frame: x points outward from the centre
float petalAt(vec2 pq, float z, float breathe) {
    float x = pq.x - 0.74;
    // petals cup forward a little and their tips curl back
    float zc = z + 0.06 - 0.22 * x * x - 0.05 * x;
    // tapered: narrower toward the tip
    float w = 0.27 * (1.0 - 0.28 * clamp(x / 0.42, -1.0, 1.0));
    return sdEll(vec3(x, pq.y, zc), vec3(0.42 + breathe, w, 0.085));
}

// a chrome flower: eight tapered petals around a domed centre
float sdf(vec3 p) {
    vec3 q = toBody(p);
    float a = atan(q.y, q.x) - 1.5707963 + 0.05 * sin(uTime * 0.7);
    float r = length(q.xy);
    float ar = mod(a + SECTOR * 0.5, SECTOR) - SECTOR * 0.5;
    float breathe = 0.012 * sin(uTime * 1.6);
    float petal = petalAt(r * vec2(cos(ar), sin(ar)), q.z, breathe);
    float ar2 = ar - sign(ar) * SECTOR;                       // the neighbour, so sector seams stay clean
    petal = smin(petal, petalAt(r * vec2(cos(ar2), sin(ar2)), q.z, breathe), 0.03);
    float centre = sdEll(q - vec3(0.0, 0.0, 0.06), vec3(0.6, 0.6, 0.34));
    float d = smin(centre, petal, 0.07);
    d += 0.012 * sin(q.x * 3.1 + uTime * 1.3) * sin(q.y * 2.7 - uTime * 1.1);
    return d * 0.8;
}

vec3 calcNormal(vec3 p) {
    vec2 h = vec2(0.002, 0.0);
    return normalize(vec3(
        sdf(p + h.xyy) - sdf(p - h.xyy),
        sdf(p + h.yxy) - sdf(p - h.yxy),
        sdf(p + h.yyx) - sdf(p - h.yyx)));
}

// ordered dithering threshold (4×4 Bayer), 0…1
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

// studio environment the chrome reflects: bright sky with soft-boxes,
// a dark horizon line, a darker floor — lightly tinted by the palette
vec3 floorTone() { return mix(vec3(0.58, 0.58, 0.6), uC, 0.25); }

vec3 env(vec3 d) {
    float y = d.y;
    vec3 sky = mix(mix(uB, vec3(1.0), 0.55), mix(uA, vec3(1.0), 0.3), smoothstep(0.1, 0.9, y));
    vec3 floorC = mix(vec3(0.58, 0.58, 0.6), uC, 0.25);
    vec3 c = mix(floorC, sky, smoothstep(-0.62, -0.3, y));
    c *= 1.0 - 0.35 * exp(-pow((y + 0.45) / 0.07, 2.0));                 // horizon line, low so the face stays bright
    // dark studio flags: they give the metal its contrast
    c *= 1.0 - 0.32 * smoothstep(0.18, 0.02, abs(d.x - 0.18)) * smoothstep(-0.2, 0.2, y);
    c *= 1.0 - 0.22 * smoothstep(0.55, 0.95, y) * smoothstep(-0.1, 0.4, d.x);
    c = mix(c, floorC * 0.7, smoothstep(-0.7, -0.95, y));
    // soft-boxes
    c += vec3(1.25) * smoothstep(0.1, 0.0, abs(d.x + 0.55)) * smoothstep(0.15, 0.4, y);
    c += vec3(0.9) * smoothstep(0.07, 0.0, abs(d.x - 0.7)) * smoothstep(0.0, 0.3, y) * smoothstep(0.9, 0.5, y);
    c += vec3(0.6) * smoothstep(0.12, 0.0, abs(d.z + 0.2)) * smoothstep(0.75, 0.95, y);
    return c;
}

// eye mask in face space, sampled at one pixel-cell centre (shape distance, normalised)
float eyeDist(vec2 f, float lid) {
    float e = 1e3;
    for (int k = 0; k < 2; k++) {
        float side = k == 0 ? -1.0 : 1.0;
        vec2 c = vec2(0.26 * side, 0.07);
        float pulse = uTalk * (1.0 + 0.35 * side * uSide);
        c.y += 0.018 * pulse;
        vec2 pe = rot(side * uTilt * 0.38) * (f - c);
        vec2 r = vec2(0.125 * (1.0 - 0.04 * pulse), 0.17 * uOpen * (1.0 + 0.16 * pulse) * lid);
        float d0 = length(pe / r) - 1.0;
        float cy = mix(-3.4, -0.62, uHappy) * r.y;
        float bite = length((pe - vec2(0.0, cy)) / (r * vec2(1.35, 1.18))) - 1.0;
        e = min(e, max(d0, -bite));
    }
    // mouth (only while eating): a round pixel "O" under the eyes
    if (uMouth > 0.02) e = min(e, length((f - vec2(0.0, -0.2)) / vec2(0.05 + 0.1 * uMouth, 0.015 + 0.12 * uMouth)) - 1.0);
    return e;
}

vec4 shade(vec2 frag) {
    vec2 uv = (frag - 0.5 * uRes) / uRes.y;
    uv = (uv - uCam.xy) * uCam.z;
    gEye = 0.0;
    vec3 ro = vec3(0.0, 0.05, 3.3);
    vec3 rd = normalize(vec3(uv * 0.86, -1.0));
    float dpx = max(3.0, floor(uRes.y / 150.0));                // dither cell, in device pixels
    float th = bayer4(frag / dpx);
    // round dither: each cell is a dot (the card art does its own dots, one pixel each)
    float inDot = uCard > 0.5 ? 1.0 : step(length(fract(frag / dpx) - 0.5), 0.46);

    float t = 0.0, minD = 1e3;
    bool hit = false;
    for (int i = 0; i < 90; i++) {
        vec3 p = ro + rd * t;
        float d = sdf(p);
        minD = min(minD, d / max(t, 0.5));
        if (d < 0.001) { hit = true; break; }
        t += d;
        if (t > 6.0) break;
    }

    vec2 sh = vec2(uv.x / 0.24, (uv.y + 0.36) / 0.04);
    float shadow = exp(-dot(sh, sh)) * 0.16 * (1.0 - clamp(uHop * 2.5, 0.0, 0.7));

    if (!hit) {
        // a sparse dithered halo just outside the silhouette
        float cov = (1.0 - smoothstep(0.0, 0.017, minD)) * 0.5;
        float dot_ = (cov > th + 0.002 ? 1.0 : 0.0) * inDot;
        vec3 haloCol = hash(floor(frag / dpx) + 11.0) > 0.45 ? vec3(1.0) : uC * 0.75;
        float aOut = max(dot_, shadow);
        return vec4(dot_ > 0.0 ? haloCol : vec3(0.0), aOut);
    }

    vec3 p = ro + rd * t;
    vec3 q = toBody(p);
    vec3 n = calcNormal(p);
    // a fine hammered texture in the chrome
    n = normalize(n + 0.035 * vec3(sin(q.y * 23.0 + q.x * 7.0), sin(q.x * 21.0 - q.z * 9.0), 0.0) * sin(q.z * 17.0 + q.x * 5.0));
    vec3 v = -rd;
    float ndv = max(dot(n, v), 0.0);
    float fres = pow(1.0 - ndv, 3.0);

    // chrome: mirror reflection with chromatic dispersion that grows toward the rim
    vec3 rr = reflect(rd, n);
    float disp = 0.04 + 0.16 * fres;
    vec3 refl = vec3(
        env(normalize(rr + n * disp)).r,
        env(rr).g,
        env(normalize(rr - n * disp)).b);
    // refraction: a glimpse "through" the metal — the bent environment, split into rainbow
    vec3 rf = vec3(
        env(refract(rd, n, 0.70)).r,
        env(refract(rd, n, 0.74)).g,
        env(refract(rd, n, 0.78)).b);
    vec3 col = refl * (0.82 + 0.18 * fres);
    col = mix(col, rf * vec3(0.96, 1.0, 1.06), 0.16 * (1.0 - fres));
    // satin: a blurred, diffuse share of the environment knocks the mirror back
    vec3 diffuse = mix(floorTone(), mix(uB, vec3(1.0), 0.75), smoothstep(-0.7, 0.8, n.y)) * (0.86 + 0.14 * max(dot(n, normalize(vec3(-0.5, 0.8, 0.6))), 0.0));
    col = mix(col, diffuse, 0.45);
    // thin-film shimmer at grazing angles
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fres * 1.6 + q.y * 0.4));
    col = mix(col, col * film * 1.3, fres * 0.22);
    // crisp highlights
    vec3 L = normalize(vec3(-0.55, 0.85, 0.65));
    col += vec3(1.0) * pow(max(dot(rr, L), 0.0), 36.0) * 0.55;
    // ambient occlusion where petals tuck under the centre
    float ao = clamp(0.55 + 2.2 * sdf(p + n * 0.08), 0.0, 1.0);
    col *= mix(0.72, 1.0, ao);
    col = mix(col, vec3(1.0), 0.08);                                    // lighter overall

    // ── eyes: one flat colour, chunky pixels with dithered edges
    float px = 0.017;
    vec2 lo = floor(uLook * vec2(0.15, 0.1) / px + 0.5) * px;     // eye travel snapped to the pixel grid
    vec2 f = q.xy - lo;
    vec2 cell = floor(f / px);
    float lid = 1.0 - clamp(uBlink, 0.0, 1.0) * 0.93;
    float e = eyeDist((cell + 0.5) * px, lid);
    float cov = 1.0 - smoothstep(-0.32, 0.18, e);
    float front = step(0.02, q.z) * step(length(q.xy), 0.52);       // face side only (body space, so it turns with it)
    float eyeDot = uCard > 0.5 ? 1.0 : step(length(fract(f / px) - 0.5), 0.5);   // round eye pixels
    float eye = step(bayer4(cell) * 0.94 + 0.03, cov) * front * eyeDot;
    col = mix(col, uInk, eye);
    gEye = eye;

    // ordered-dither texture over the whole body: the shading falls into a few tones
    float LV = 5.0;
    col = mix(col, floor(col * LV + th) / LV, 0.85);
    col *= mix(0.9, 1.0, inDot);                                       // halftone: the gaps between dots sit a touch darker

    // dithered silhouette: the outer rim breaks up into black + white pixels
    // (only out on the petals, so the crease around the centre doesn't break up)
    float edgeCov = max(smoothstep(0.0, 0.45, ndv), 1.0 - smoothstep(0.66, 0.78, length(q.xy)));
    float a = 1.0;
    // per-pixel noise in the threshold frays the outline, so the shape looks dithered-apart
    float hc = hash(floor(frag / dpx) + floor(uTime * 5.0) * 0.37);
    if (edgeCov + (hash(floor(frag / dpx) + 41.0) - 0.5) * 0.35 < th * 0.95) {
        if (inDot < 0.5) a = 0.0;                            // round dots only out here
        else if (hc > 0.62) col = vec3(1.0);                 // white dots
        else if (hc > 0.42) col = uC * 0.7;                  // dark dots
        else a = 0.0;                                        // holes
    }
    return vec4(col, a);
}

// card-art mode: one pixel per dot (the CSS turns pixels into round dots).
// A flowing gradient, dithered into steps, with the mascot recoloured in the card's hues.
vec4 cardPixel(vec2 frag) {
    vec2 uv = frag / uRes;
    float t = uTime;
    float n = 0.5 + 0.5 * sin(uv.x * 3.1 + t * 0.35 + 1.7 * sin(uv.y * 2.3 - t * 0.27));
    float n2 = 0.5 + 0.5 * sin(uv.y * 4.0 - t * 0.22 + 1.3 * sin(uv.x * 1.9 + t * 0.31));
    float g = clamp(0.1 + 0.45 * uv.y + 0.35 * n * n2 + 0.15 * n, 0.0, 1.0);
    float th = bayer4(frag);
    float gs = floor(g * 5.0 + th) / 5.0;
    vec3 bg = mix(uG3, mix(uG2, uG1, 0.25), gs);               // background stays in the deeper tones
    vec4 m = shade(frag);
    if (m.a < 0.5) return vec4(bg, 1.0);
    if (gEye > 0.5) return vec4(uG3 * 0.32, 1.0);
    float L = dot(m.rgb, vec3(0.299, 0.587, 0.114));
    float Ls = floor(clamp((L - 0.35) * 1.7, 0.0, 1.0) * 4.0 + th) / 4.0;
    vec3 body = mix(mix(uG2, uG1, 0.55), mix(uG1, vec3(1.0), 0.7), Ls);   // the mascot glows lighter than the field
    return vec4(body, 1.0);
}

void main() {
    if (uCard > 0.5) { gl_FragColor = cardPixel(gl_FragCoord.xy); return; }
    vec2 frag = gl_FragCoord.xy;
    float rv = clamp(uReveal, 0.0, 1.0);
    float g = 1.0 - rv;

    // ── glitchy reveal: big pixels that get finer, sliced rows that jump sideways
    float block = floor(mix(46.0, 1.0, pow(rv, 0.6)));
    float row = floor(frag.y / max(block * 2.0, 3.0));
    float tick = floor(uTime * 18.0);
    float jump = step(0.72, hash(vec2(row, tick))) * (hash(vec2(row + 7.0, tick)) - 0.5) * 90.0 * g;
    frag.x += jump;
    vec2 cell = floor(frag / block);
    frag = block > 1.0 ? (cell + 0.5) * block : frag;

    vec4 c = shade(frag);

    // pixels pop in randomly
    float pop = step(hash(cell + 3.1), rv * 1.35 - 0.05);
    c.a *= mix(pop, 1.0, step(0.999, rv));
    // while glitching: posterised colour + a teal/blue channel slip (no red)
    if (g > 0.0) {
        vec3 post = floor(c.rgb * 5.0 + 0.5) / 5.0;
        c.rgb = mix(c.rgb, post, g);
        float slip = step(0.8, hash(vec2(row * 3.0, tick + 1.0))) * g;
        c.rgb = mix(c.rgb, c.rgb * vec3(0.55, 1.05, 1.15) + vec3(0.0, 0.08, 0.12), slip);
        c.rgb += (hash(frag + uTime) - 0.5) * 0.12 * g;            // fuzzy grain
    }
    gl_FragColor = vec4(c.rgb * c.a, c.a);                         // premultiplied
}
`

function hexToRgb(hex) {
    const h = hex.replace('#', '')
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
}

export function createAvatar(canvas, palette, opts = {}) {
    // opts.card: render as card art; opts.cell: CSS px per rendered pixel; opts.cam: [x, y, zoom]
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) throw new Error('WebGL unavailable')
    gl.getExtension('OES_standard_derivatives')

    const sh = (type, src) => {
        const s = gl.createShader(type)
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
        return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const U = {}
    ;['uRes', 'uTime', 'uLook', 'uTalk', 'uBlink', 'uSquash', 'uHop', 'uReveal', 'uA', 'uB', 'uC', 'uInk', 'uGlint', 'uHappy', 'uOpen', 'uTilt', 'uSide', 'uSpin', 'uMouth', 'uCard', 'uG1', 'uG2', 'uG3', 'uCam']
        .forEach(k => (U[k] = gl.getUniformLocation(prog, k)))

    const setPalette = (p) => {
        gl.uniform3fv(U.uA, hexToRgb(p.a))
        gl.uniform3fv(U.uB, hexToRgb(p.b))
        gl.uniform3fv(U.uC, hexToRgb(p.c))
        gl.uniform3fv(U.uInk, hexToRgb(p.ink))
        gl.uniform3fv(U.uGlint, hexToRgb(p.glint || '#ffffff'))
    }
    setPalette(palette)
    const setGradient = (g) => { gl.uniform3fv(U.uG1, hexToRgb(g[0])); gl.uniform3fv(U.uG2, hexToRgb(g[1])); gl.uniform3fv(U.uG3, hexToRgb(g[2])) }
    gl.uniform1f(U.uCard, opts.card ? 1 : 0)
    gl.uniform3fv(U.uCam, opts.cam || [0, 0, 1])
    if (opts.gradient) setGradient(opts.gradient)

    // live state (targets are set from outside, values are smoothed per frame)
    const state = {
        look: { x: 0, y: 0 }, lookT: { x: 0, y: 0 },
        talk: 0, talkT: 0, side: 1,
        // expression (targets → smoothed)
        happy: 0, happyT: 0, open: 1, openT: 1, tilt: 0, tiltT: 0,
        blink: 0,
        squash: 0, squashV: 0, squashT: 0,
        hop: 0, hopV: 0,
        reveal: 0,
        spin: 0,
        idle: 0,          // 0…1: how much it sways and floats on its own
        mouth: 0, mouthT: 0,
    }

    const resize = () => {
        const dpr = maxDpr()
        const w = opts.cell ? Math.max(1, Math.round(canvas.clientWidth / opts.cell)) : Math.round(canvas.clientWidth * dpr)
        const h = opts.cell ? Math.max(1, Math.round(canvas.clientHeight / opts.cell)) : Math.round(canvas.clientHeight * dpr)
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
        gl.viewport(0, 0, w, h)
        gl.uniform2f(U.uRes, w, h)
    }

    // autonomous life: blinking and idle glances
    let nextBlink = 1.2, blinkT = -1, nextGlance = 2, glance = { x: 0, y: 0 }
    let last = performance.now() / 1000

    const frame = (now) => {
        const t = now / 1000
        const dt = Math.min(0.05, t - last); last = t
        const k = (r) => 1 - Math.pow(1 - r, dt * 60)          // frame-rate independent lerp

        // blink
        if (t > nextBlink && blinkT < 0) { blinkT = 0; nextBlink = t + 2.2 + Math.random() * 3.2 + (Math.random() < 0.2 ? -1.9 : 0) }
        if (blinkT >= 0) { blinkT += dt; state.blink = Math.sin(Math.min(1, blinkT / 0.16) * Math.PI); if (blinkT > 0.16) { blinkT = -1; state.blink = 0 } }
        // idle glances layered on top of the pointer
        if (t > nextGlance) { nextGlance = t + 1.5 + Math.random() * 2.5; glance = { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.3 } }

        state.look.x += (state.lookT.x + glance.x * 0.35 - state.look.x) * k(0.06)
        state.look.y += (state.lookT.y + glance.y * 0.35 - state.look.y) * k(0.06)
        state.talk += (state.talkT - state.talk) * k(0.18)
        state.happy += (state.happyT - state.happy) * k(0.12)
        state.open += (state.openT - state.open) * k(0.14)
        state.tilt += (state.tiltT - state.tilt) * k(0.1)
        state.talkT *= Math.pow(0.01, dt)                      // each syllable closes again quickly
        // springs
        state.squashV += (state.squashT - state.squash) * 0.18 * dt * 60
        state.squashV *= Math.pow(0.8, dt * 60)
        state.squash += state.squashV * dt * 60
        state.hopV -= 0.012 * dt * 60                             // gravity
        state.hop = Math.max(0, state.hop + state.hopV * dt * 60)
        if (state.hop === 0 && state.hopV < 0) {                  // landing → squish
            if (state.hopV < -0.03) state.squashV += -state.hopV * 3.2
            state.hopV = 0
        }

        resize()
        gl.uniform1f(U.uTime, t)
        gl.uniform2f(U.uLook, state.look.x, state.look.y)
        gl.uniform1f(U.uTalk, state.talk)
        gl.uniform1f(U.uHappy, state.happy)
        gl.uniform1f(U.uOpen, state.open)
        gl.uniform1f(U.uTilt, state.tilt)
        gl.uniform1f(U.uSide, state.side)
        // idle life: a slow yaw rock + a float, layered on the scripted spin and hop
        const idle = state.idle
        state.mouth += (state.mouthT - state.mouth) * k(0.25)
        gl.uniform1f(U.uMouth, state.mouth)
        gl.uniform1f(U.uSpin, state.spin + idle * (0.3 * Math.sin(t * 0.7) + 0.07 * Math.sin(t * 1.9 + 1.3)))
        gl.uniform1f(U.uBlink, state.blink)
        gl.uniform1f(U.uSquash, state.squash)
        gl.uniform1f(U.uHop, state.hop + idle * 0.035 * (0.5 + 0.5 * Math.sin(t * 1.4)))
        gl.uniform1f(U.uReveal, state.reveal)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        raf = requestAnimationFrame(frame)
    }
    let raf = requestAnimationFrame(frame)

    return {
        state,
        setPalette,
        setGradient,
        /** open (1) / close (0) the eating mouth */
        mouth(v) { state.mouthT = v },
        /** a little jump */
        hop(power = 1) { state.hopV = 0.075 * power; state.squashV -= 0.25 * power },
        /** squish (e.g. when clicked) */
        boop() { state.squashV += 0.9 },
        /** one "spoken" syllable: the eyes bounce, alternating which leads */
        syllable(amount) { state.talkT = Math.max(state.talkT, amount); state.side = -state.side },
        /** set an expression: { happy 0…1, open ~0.6…1.4, tilt -1…1 } */
        express({ happy = 0, open = 1, tilt = 0 } = {}) { state.happyT = happy; state.openT = open; state.tiltT = tilt },
        destroy() {
            cancelAnimationFrame(raf)
            gl.deleteBuffer(buf)
            gl.deleteProgram(prog)
            // (don't lose the context: React may remount on the same canvas)
        },
    }
}
