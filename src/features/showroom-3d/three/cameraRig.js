import { CatmullRomCurve3, Vector3 } from 'three'

const SNAP_AFTER_MS = 200
const SNAP_BIAS = 0.12
const FOLLOW_RATE = 3.0
const DEFAULT_FOV = 50
const TURN_GAIN = 0.004
const MAX_YAW = Math.PI // quay được một vòng
const MAX_PITCH = 0.55
const UP = new Vector3(0, 1, 0)
const MAX_ZOOM = 4

const v3 = (a) => new Vector3(...a)
const smooth = (t) => t * t * (3 - 2 * t)

function makeCurve(points) {
  if (points.length === 2) points.splice(1, 0, points[0].clone().lerp(points[1], 0.5))
  return new CatmullRomCurve3(points, false, 'centripetal')
}

/**
 * Camera đi dọc đường nối các điểm dừng theo `progress` (0 = điểm 01, 3 = điểm 04).
 * Cuộn đẩy `goal`; ngừng cuộn thì `goal` bám vào điểm dừng gần nhất theo hướng vừa cuộn.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F04
 */
export class CameraRig {
  constructor(camera, stops) {
    this.camera = camera
    this.stops = stops
    this.flight = null
    this.last = stops.length - 1
    this.segments = stops.slice(1).map((stop, i) => {
      const prev = stops[i]
      const via = stop.via ?? []
      return {
        pos: makeCurve([v3(prev.pos), ...via.map((w) => v3(w.pos)), v3(stop.pos)]),
        target: makeCurve([v3(prev.target), ...via.map((w) => v3(w.target)), v3(stop.target)]),
      }
    })
    this.fovs = stops.map((s) => s.fov ?? DEFAULT_FOV)
    this.fov = this.fovs[0]
    this.progress = 0
    this.goal = 0
    this.base = 0
    this.lastInput = -Infinity
    this.lookAt = new Vector3()
    this.tilt = 0 // màn hình dọc: hạ điểm nhìn để bớt thấy trần
    // quay đầu nhìn quanh tại chỗ (kéo chỗ trống): yaw trái/phải, pitch lên/xuống; sang điểm dừng khác thì tự về 0
    this.head = { yaw: 0, pitch: 0 }
    this.zoom = 1 // phóng to tại chỗ (cuộn chuột / chụm ngón); sang điểm dừng khác thì tự về 1
    this.apply()
  }

  /**
   * Bay thẳng tới điểm dừng `index` (bấm số ở cột trái), không đi qua các điểm ở giữa.
   * Đi giữa sảnh và studio thì vẫn chui qua cửa cuốn (các điểm `via` của studio) để không xuyên tường.
   */
  flyTo(index) {
    const to = this.stops[index]
    const studio = this.stops.length - 1
    const crossing = (index === studio) !== (this.progress > studio - 0.5)
    const via = crossing ? [...(this.stops[studio].via ?? [])] : []
    if (crossing && index !== studio) via.reverse()
    const target = this.lookAt.clone()
    target.y -= this.tilt
    const pts = [this.camera.position.clone(), ...via.map((w) => v3(w.pos)), v3(to.pos)]
    const tgs = [target, ...via.map((w) => v3(w.target)), v3(to.target)]
    const length = pts.reduce((s, p, i) => (i ? s + p.distanceTo(pts[i - 1]) : 0), 0)
    const dur = Math.min(3, Math.max(1.2, length / 7))
    this.flight = { pos: makeCurve(pts), target: makeCurve(tgs), t: 0, dur, fov0: this.fov, index }
    this.goal = this.base = index
    this.lastInput = -Infinity
  }

  /** Một bước của chuyến bay thẳng; tới nơi thì quay về đường cố định ở đúng điểm dừng. */
  updateFlight(dt) {
    const f = this.flight
    f.t = Math.min(1, f.t + dt / f.dur)
    const e = smooth(f.t)
    f.pos.getPoint(e, this.camera.position)
    f.target.getPoint(e, this.lookAt)
    this.lookAt.y += this.tilt
    this.camera.lookAt(this.lookAt)
    this.turnHead(dt)
    this.fov = f.fov0 + (this.fovs[f.index] - f.fov0) * e
    if (f.t < 1) return
    this.flight = null
    this.progress = f.index
    this.apply()
  }

  /**
   * Kéo chỗ trống để xoay nhìn quanh tại chỗ đang đứng (không cần chế độ riêng).
   * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F14
   */
  turn(dx, dy) {
    this.head.yaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, this.head.yaw - dx * TURN_GAIN))
    this.head.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.head.pitch - dy * TURN_GAIN))
    this.apply()
  }

  /**
   * Phóng to / thu nhỏ `factor` (> 1 là phóng to) về phía điểm dưới con trỏ (ndcX, ndcY ∈ -1..1):
   * quay đầu thêm một chút để điểm đó vẫn nằm dưới con trỏ sau khi đổi góc nhìn.
   * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F20
   */
  zoomAt(factor, ndcX, ndcY, fovDeg, aspect) {
    const next = Math.min(MAX_ZOOM, Math.max(1, this.zoom * factor))
    if (next === this.zoom) return
    const halfV = (z) => Math.atan(Math.tan((fovDeg * Math.PI) / 360) / z)
    const angles = (z) => {
      const v = halfV(z)
      return [Math.atan(ndcX * aspect * Math.tan(v)), Math.atan(ndcY * Math.tan(v))]
    }
    const [ax, ay] = angles(this.zoom)
    const [bx, by] = angles(next)
    this.zoom = next
    this.head.yaw -= ax - bx
    this.head.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.head.pitch + (ay - by)))
    this.apply()
  }

  /** Áp góc quay đầu lên camera (sau lookAt). Đang di chuyển giữa các điểm dừng thì góc này dần về 0. */
  turnHead(dt = 0) {
    if (dt && (this.flight || this.goal !== this.progress)) {
      const k = Math.exp(-dt * 4)
      this.head.yaw *= k
      this.head.pitch *= k
      this.zoom = 1 + (this.zoom - 1) * k
      if (Math.abs(this.head.yaw) + Math.abs(this.head.pitch) < 1e-3) this.head.yaw = this.head.pitch = 0
      if (this.zoom < 1.001) this.zoom = 1
    }
    if (!this.head.yaw && !this.head.pitch) return
    this.camera.rotateOnWorldAxis(UP, this.head.yaw)
    this.camera.rotateX(this.head.pitch)
  }

  /** Cuộn thêm `delta` (đơn vị: điểm dừng). Đang bay thẳng thì bỏ qua. */
  nudge(delta, now = performance.now()) {
    if (this.flight) return
    if (now - this.lastInput > SNAP_AFTER_MS) this.base = Math.round(this.goal)
    this.goal = Math.min(this.last, Math.max(0, this.goal + delta))
    this.lastInput = now
  }

  goTo(index) {
    this.goal = Math.min(this.last, Math.max(0, index))
    this.base = this.goal
    this.lastInput = -Infinity
  }

  snap(now) {
    if (now - this.lastInput < SNAP_AFTER_MS || Number.isInteger(this.goal)) return
    const d = this.goal - this.base
    if (d > SNAP_BIAS) this.goal = Math.min(this.last, Math.ceil(this.goal - 1e-6))
    else if (d < -SNAP_BIAS) this.goal = Math.max(0, Math.floor(this.goal + 1e-6))
    else this.goal = this.base
    this.base = this.goal
  }

  update(dt, now = performance.now()) {
    if (this.flight) return this.updateFlight(dt)
    this.snap(now)
    const diff = this.goal - this.progress
    this.progress = Math.abs(diff) < 1e-4 ? this.goal : this.progress + diff * (1 - Math.exp(-dt * FOLLOW_RATE))
    this.apply(dt)
  }

  apply(dt = 0) {
    const i = Math.min(this.segments.length - 1, Math.floor(this.progress))
    const t = smooth(Math.min(1, this.progress - i))
    const seg = this.segments[i]
    seg.pos.getPoint(t, this.camera.position)
    seg.target.getPoint(t, this.lookAt)
    this.lookAt.y += this.tilt
    this.camera.lookAt(this.lookAt)
    this.turnHead(dt)
    this.fov = this.fovs[i] + (this.fovs[i + 1] - this.fovs[i]) * t
  }

  get moving() {
    return Boolean(this.flight) || this.goal !== this.progress
  }

  /** Điểm dừng gần nhất (0..3). */
  get stop() {
    return Math.round(this.progress)
  }
}
