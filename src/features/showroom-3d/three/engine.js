import { ACESFilmicToneMapping, Clock, Color, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer } from 'three'
import { ENV_URL, disposeTree, loadGLB, loadTexture, normalize } from './assets'
import { CameraRig } from './cameraRig'
import { CarStage } from './carStage'
import { attachInput } from './input'
import { STOPS, TURNTABLE_RADIUS } from './layout'
import { updateDoor } from './door'
import { LED_TIME, makeRunningLed } from './ledRing'
import { buildLights } from './lights'
import { buildLounge } from './lounge'
import { buildProps } from './props'
import { buildHall } from './room'
import { ledTexture, streetTexture } from './textures'
import { buildStudio } from './studio'
import { PaintSweep } from './paintSweep'
import { Realism } from './realism'

/**
 * Lõi showroom 3D (không phụ thuộc React). React gọi API công khai và nhận sự kiện qua `on`.
 * on: { stop(i), select(car), loading({ busy, progress }), frame(state) }
 */
export class ShowroomEngine {
  progress = (p) => this.on.loading?.({ busy: true, progress: p })

  constructor(canvas, on = {}) {
    this.canvas = canvas
    this.on = on
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    Object.assign(this.renderer, { toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.0, outputColorSpace: SRGBColorSpace })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.scene = new Scene()
    this.scene.background = new Color('#c9d3dc') // trời nhạt: nhìn qua kính ở góc xa cũng không thấy khoảng đen
    this.camera = new PerspectiveCamera(50, 1, 0.05, 120)
    this.clock = new Clock()
    this.rig = new CameraRig(this.camera, STOPS)
    this.lastStop = -1
    this.idleFrames = 0
    this.selected = null
    this.resize = this.resize.bind(this)
    this.observer = new ResizeObserver(this.resize)
    this.observer.observe(canvas)
    this.resize()
  }

  /** Dựng cảnh. `images`: { led, outside, logo } (URL ảnh). */
  async init(images) {
    const [logo, platformRoot] = await Promise.all([
      loadTexture(images.logo), loadGLB(`${ENV_URL}/turntable.glb`),
    ])
    this.lights = buildLights(this.renderer, this.scene)
    // màn LED (logo + khẩu hiệu) và cảnh phố ngoài kính vẽ bằng code: không dùng ảnh xe của hãng khác
    const hall = buildHall({ ledTexture: ledTexture(logo.image), outsideTexture: streetTexture() })
    this.door = hall.door
    this.studio = buildStudio({ logoTexture: logo })
    this.scene.add(hall.group, this.studio)
    platformRoot.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false } })
    makeRunningLed(platformRoot) // viền vàng của kệ: đèn LED chạy vòng
    this.stage = new CarStage(this.scene, normalize(platformRoot, TURNTABLE_RADIUS * 2, 0.45))
    this.detachInput = attachInput(this.canvas, this)
    buildLounge().then((g) => this.scene.add(g)).then(() => this.wake(true))
    this.sweep = new PaintSweep(this.stage.tables.studio)
    this.realism = new Realism(this)
    this.renderer.setAnimationLoop(() => this.tick())
  }

  resize() {
    const w = this.canvas.clientWidth || 1
    const h = this.canvas.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.applyFov()
    this.wake()
  }

  /** Góc nhìn theo điểm dừng; màn hình dọc (điện thoại) mở rộng thêm để vẫn thấy đủ xe. */
  /** Góc nhìn theo điểm dừng (chưa tính phóng to); màn dọc mở rộng thêm. */
  baseFov() {
    return this.rig.fov * (this.camera.aspect < 1 ? 1.35 : 1)
  }

  applyFov() {
    this.rig.tilt = this.camera.aspect < 1 ? -0.7 : 0
    const base = this.baseFov()
    // phóng to tại chỗ: thu hẹp góc nhìn theo hệ số zoom
    const fov = (2 * Math.atan(Math.tan((base * Math.PI) / 360) / this.rig.zoom) * 180) / Math.PI
    if (Math.abs(fov - this.camera.fov) < 0.01) return
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  /** Có thay đổi cần vẽ lại. `sceneChanged`: vật thể/vật liệu đổi (ảnh thật phải dựng lại từ đầu). */
  wake(sceneChanged = false) {
    this.idleFrames = 0
    this.idleTime = 0
    this.realism?.interrupt(sceneChanged)
  }

  /** Tới điểm dừng `i`: kề bên thì đi theo đường cố định, xa hơn thì bay thẳng (không qua điểm ở giữa). */
  goTo(i) {
    if (Math.abs(i - this.rig.progress) > 1.01) this.rig.flyTo(i)
    else this.rig.goTo(i)
    this.wake()
  }

  /** Lượng tải mô hình: báo cho React để hiện thanh tiến trình. */
  track(promise) {
    this.on.loading?.({ busy: true, progress: 0 })
    return promise.finally(() => this.on.loading?.({ busy: false, progress: 1 })).finally(() => this.wake(true))
  }


  /** Đặt xe lên 2 kệ sảnh: `shelves` = { left, right } (xe hoặc null = kệ trống). */
  async setShelves(shelves) {
    await this.track(Promise.all(['left', 'right'].map((k) => this.stage.showShelf(k, shelves[k], this.progress))))
    // đồ vật trang trí: chỉ tải sau khi xe đã lên kệ, không làm chậm lúc mở showroom
    this.props ??= buildProps().then((g) => this.scene.add(g)).then(() => this.wake(true))
  }

  /** Chọn xe: đặt lên bục studio và báo React (mở bảng thông số nếu `open`). */
  async selectCar(car, open = true) {
    this.selected = car
    this.paint = null
    if (open) this.on.select?.(car)
    await this.track(this.stage.showStudio(car, this.progress))
    if (this.selected === car) this.sweep.setCar(this.stage.tables.studio.car)
  }

  /** Đổi màu sơn bằng vòm quét từ đầu xe ra đuôi xe. */
  setPaint(key) {
    this.paint = key
    this.sweep.start(key)
    this.wake(true)
  }

  toggleRealism() {
    this.realism?.toggle()
    this.wake()
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1)
    const moving = this.rig.moving
    this.rig.update(dt)
    this.applyFov()
    const { camera, door, studio } = this
    if (updateDoor({ camera, door, studio, studioTable: this.stage.tables.studio.group })) this.wake(true)
    const spun = this.stage.update(dt) // xoay trước, rồi vòm quét theo góc xe mới nhất
    const sweeping = this.sweep.update(dt)
    const spinning = spun || sweeping
    if (moving || spinning) this.wake(spinning)
    // điểm đích: bấm 01→03 thì không lóe tên 02 lúc camera bay ngang
    const stop = Math.round(this.rig.goal)
    if (stop !== this.lastStop) {
      this.lastStop = stop
      this.on.stop?.(stop)
    }
    this.idleTime += dt
    // đèn LED kệ chạy liên tục (vẽ lại mỗi khung); khi bật "Ảnh thật" thì đèn đứng yên để ảnh dựng được mịn
    if (!this.realism?.enabled) {
      LED_TIME.value += dt
      this.idleFrames = 0
    }
    if (this.realism?.tick(this.idleTime)) {
      this.idleFrames = 3 // ảnh thật đang vẽ: không vẽ nhanh đè lên
      return
    }
    if (this.idleFrames++ > 2) return // cảnh đứng yên: không vẽ lại cho đỡ tốn GPU
    this.renderer.shadowMap.needsUpdate = true
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.detachInput?.()
    this.observer.disconnect()
    this.realism?.dispose()
    this.stage?.dispose()
    disposeTree(this.scene)
    this.lights?.envRT.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
