import { HalfFloatType, NoBlending, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget } from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

// "Ảnh thật": khi camera đứng yên, vẽ lại cảnh nhiều lần ở độ phân giải cao hơn, mỗi lần lệch điểm ảnh
// một chút (khử răng cưa) và lệch nhẹ vị trí đèn có bóng (bóng đổ mềm), rồi cộng dồn trung bình.
// Ảnh mịn dần như ảnh chụp; có chuyển động là quay về vẽ nhanh.
// (Đã thử path tracing: trên GPU tích hợp mất ~85 s biên dịch shader và đứng hình, nên không dùng.)
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F11

const START_AFTER_S = 0.6
const MAX_SAMPLES = 48
const SUPERSAMPLE = 1.5
const MAX_SIDE = 4096
const LIGHT_JITTER = { DirectionalLight: 0.45, SpotLight: 0.2 }
const EMIT_EVERY = 4

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
const BLEND = `uniform sampler2D tNew, tOld; uniform float weight; varying vec2 vUv;
void main() { gl_FragColor = mix(texture2D(tOld, vUv), texture2D(tNew, vUv), weight); }`
const SHOW = `uniform sampler2D tMap; varying vec2 vUv;
void main() { gl_FragColor = texture2D(tMap, vUv);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`

const halton = (i, b) => {
  let f = 1
  let r = 0
  for (let n = i; n > 0; n = Math.floor(n / b)) {
    f /= b
    r += f * (n % b)
  }
  return r
}

export class Realism {
  constructor(engine) {
    this.e = engine
    this.enabled = false // mặc định tắt: đèn LED kệ chạy liên tục; bấm "Ảnh thật" để bật
    this.samples = 0
    this.state = ''
    const rt = () => new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false })
    this.frame = new WebGLRenderTarget(1, 1, { type: HalfFloatType })
    this.accum = [rt(), rt()]
    this.blend = new FullScreenQuad(new ShaderMaterial({
      uniforms: { tNew: { value: null }, tOld: { value: null }, weight: { value: 1 } },
      vertexShader: VERT, fragmentShader: BLEND, blending: NoBlending, depthTest: false, depthWrite: false, toneMapped: false,
    }))
    this.show = new FullScreenQuad(new ShaderMaterial({
      uniforms: { tMap: { value: null } }, vertexShader: VERT, fragmentShader: SHOW, blending: NoBlending, depthTest: false,
    }))
    this.size = new Vector2()
    this.saved = new Map()
    this.emit('off')
  }

  emit(state) {
    if (state === this.state && state !== 'rendering') return
    this.state = state
    this.e.on.realism?.({ state, samples: this.samples })
  }

  toggle() {
    this.enabled = !this.enabled
    this.samples = 0
    this.emit(this.enabled ? 'waiting' : 'off')
  }

  /** Có chuyển động hoặc cảnh đổi: bỏ ảnh đang cộng dồn. */
  interrupt() {
    this.samples = 0
    if (this.enabled) this.emit('waiting')
  }

  prepare() {
    const r = this.e.renderer
    r.getDrawingBufferSize(this.size)
    const k = Math.min(SUPERSAMPLE, MAX_SIDE / Math.max(this.size.x, this.size.y))
    const w = Math.round(this.size.x * k)
    const h = Math.round(this.size.y * k)
    for (const t of [this.frame, ...this.accum]) if (t.width !== w || t.height !== h) t.setSize(w, h)
  }

  jitterLights(on) {
    this.e.scene.traverse((l) => {
      const amp = l.castShadow && LIGHT_JITTER[l.type]
      if (!amp) return
      if (on) {
        this.saved.set(l, l.position.clone())
        l.position.add(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(amp * 2))
      } else if (this.saved.has(l)) l.position.copy(this.saved.get(l))
    })
    this.saved = on ? this.saved : new Map()
  }

  /** Vẽ một mẫu: cảnh (lệch điểm ảnh + lệch đèn) -> trộn vào ảnh cộng dồn -> đưa ra màn hình. */
  sample() {
    const { renderer: r, scene, camera } = this.e
    const n = this.samples
    const { width: w, height: h } = this.frame
    camera.setViewOffset(w, h, halton(n + 1, 2) - 0.5, halton(n + 1, 3) - 0.5, w, h)
    this.jitterLights(n > 0)
    r.shadowMap.needsUpdate = true
    r.setRenderTarget(this.frame)
    r.render(scene, camera)
    this.jitterLights(false)
    camera.clearViewOffset()
    const [read, write] = n % 2 ? this.accum : [this.accum[1], this.accum[0]]
    Object.assign(this.blend.material.uniforms, { tNew: { value: this.frame.texture }, tOld: { value: read.texture }, weight: { value: 1 / (n + 1) } })
    r.setRenderTarget(write)
    this.blend.render(r)
    r.setRenderTarget(null)
    this.show.material.uniforms.tMap.value = write.texture
    this.show.render(r)
  }

  /** Gọi mỗi khung hình. Trả về true nếu khung này do "Ảnh thật" vẽ. */
  tick(idleSeconds) {
    if (!this.enabled || idleSeconds < START_AFTER_S || this.samples >= MAX_SAMPLES) return false
    if (this.samples === 0) this.prepare()
    this.sample()
    this.samples++
    if (this.samples >= MAX_SAMPLES) this.emit('done')
    else if (this.samples % EMIT_EVERY === 1) this.emit('rendering')
    return true
  }

  dispose() {
    for (const t of [this.frame, ...this.accum]) t.dispose()
    this.blend.dispose()
    this.show.dispose()
  }
}
