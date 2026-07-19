import { useRef, useEffect } from 'react'
import './DitherVideo.css'

const vertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(a_position.x * 0.5 + 0.5, 1.0 - (a_position.y * 0.5 + 0.5));
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;
  uniform sampler2D u_video;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_pixelSize;
  uniform float u_intensity;
  uniform float u_time;
  uniform float u_videoAspect;
  uniform float u_canvasAspect;
  uniform float u_mouseReactive;
  varying vec2 v_uv;

  float bayer(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int idx = x + y * 4;
    float m[16];
    m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
    m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
    m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
    m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
    float v = 0.0;
    for (int i = 0; i < 16; i++) { if (i == idx) v = m[i]; }
    return (v + 0.5) / 16.0;
  }

  vec2 coverUv(vec2 uv) {
    vec2 c = uv - 0.5;
    if (u_canvasAspect > u_videoAspect) {
      c.y *= u_videoAspect / u_canvasAspect;
    } else {
      c.x *= u_canvasAspect / u_videoAspect;
    }
    return c + 0.5;
  }

  void main() {
    float dist = distance(v_uv, u_mouse);
    float influence = smoothstep(0.4, 0.0, dist) * u_mouseReactive;

    /* mouse tightens pixels for a reveal effect */
    float dynamicPixelSize = mix(u_pixelSize, u_pixelSize * 0.4, influence);

    vec2 px = u_resolution / dynamicPixelSize;
    vec2 snapped = floor(v_uv * px) / px;
    vec2 uv = coverUv(snapped);

    vec3 c = texture2D(u_video, uv).rgb;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));

    /* invert + boost contrast sharply for light mode */
    lum = 1.0 - lum;
    lum = clamp((lum - 0.38) * 1.8 + 0.38, 0.0, 1.0);

    vec2 screenPos = v_uv * u_resolution / dynamicPixelSize;
    float threshold = bayer(screenPos);
    float bw = lum > threshold ? 1.0 : 0.0;

    float dynamicIntensity = u_intensity + influence * 0.18;

    gl_FragColor = vec4(0.06, 0.06, 0.06, bw * dynamicIntensity);
  }
`

export default function DitherVideo({
  src,
  pixelSize = 1,
  intensity = 0.22,
  mouseReactive = true,
  className = '',
}) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const resume = () => { video.play().catch(() => {}) }
    const apply = () => { video.playbackRate = 1.2; resume() }

    apply()
    video.addEventListener('loadeddata', apply)
    video.addEventListener('pause', resume)
    video.addEventListener('stalled', resume)
    video.addEventListener('suspend', resume)
    video.addEventListener('waiting', resume)

    const onVisibility = () => { if (!document.hidden) resume() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      video.removeEventListener('loadeddata', apply)
      video.removeEventListener('pause', resume)
      video.removeEventListener('stalled', resume)
      video.removeEventListener('suspend', resume)
      video.removeEventListener('waiting', resume)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!mouseReactive) return
    const onMove = (e) => {
      mouseRef.current.tx = e.clientX / window.innerWidth
      mouseRef.current.ty = e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mouseReactive])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
    if (!gl) return

    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    )
    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    const uVideo        = gl.getUniformLocation(program, 'u_video')
    const uResolution   = gl.getUniformLocation(program, 'u_resolution')
    const uMouse        = gl.getUniformLocation(program, 'u_mouse')
    const uPixelSize    = gl.getUniformLocation(program, 'u_pixelSize')
    const uIntensity    = gl.getUniformLocation(program, 'u_intensity')
    const uTime         = gl.getUniformLocation(program, 'u_time')
    const uVideoAspect  = gl.getUniformLocation(program, 'u_videoAspect')
    const uCanvasAspect = gl.getUniformLocation(program, 'u_canvasAspect')
    const uMouseReact   = gl.getUniformLocation(program, 'u_mouseReactive')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width  = canvas.clientWidth  * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    const startTime = performance.now()

    const render = () => {
      const t = (performance.now() - startTime) / 1000
      const m = mouseRef.current
      m.x += (m.tx - m.x) * 0.05
      m.y += (m.ty - m.y) * 0.05

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        const dpr = Math.min(window.devicePixelRatio, 2)
        const videoAspect  = (video.videoWidth / video.videoHeight) || 1
        const canvasAspect = (canvas.width / canvas.height) || 1

        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
        gl.uniform1i(uVideo, 0)
        gl.uniform2f(uResolution, canvas.width, canvas.height)
        gl.uniform2f(uMouse, m.x, m.y)
        gl.uniform1f(uPixelSize, pixelSize * dpr)
        gl.uniform1f(uIntensity, intensity)
        gl.uniform1f(uTime, t)
        gl.uniform1f(uVideoAspect, videoAspect)
        gl.uniform1f(uCanvasAspect, canvasAspect)
        gl.uniform1f(uMouseReact, mouseReactive ? 1.0 : 0.0)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      raf = requestAnimationFrame(render)
    }

    video.play().catch(() => {})
    render()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [pixelSize, intensity, mouseReactive])

  return (
    <div className={`dither-video ${className}`}>
      <video
        ref={videoRef}
        className="dither-video__source"
        src={src}
        muted
        loop
        playsInline
        autoPlay
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="dither-video__canvas" />
    </div>
  )
}
