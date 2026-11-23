import { BufferGeometry, Color, Curve, Group, Matrix4, Mesh, TubeGeometry, Vector3 } from 'three'
import { paintColor, paintUniforms } from './paint'
import { glow } from './room'

// Vòm đèn quét màu ở studio (đứng cố định): bấm một màu, vòm chạy lên phía đầu xe rồi lướt về phía đuôi; phần xe vòm đi
// qua đổi sang màu mới (shader so vị trí điểm ảnh với vị trí vòm), kèm một dải sáng trên thân xe.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09

const RETURN_S = 0.5 // vòm chạy từ đuôi về đầu xe (chưa đổi màu)
const SWEEP_S = 1.6 // vòm quét từ đầu ra đuôi (đổi màu)
const MARGIN = 0.25 // vòm đứng cách đầu / đuôi xe (vẫn nằm trên mặt kệ)
const ease = (t) => t * t * (3 - 2 * t)

/** Nửa elip đứng trong mặt phẳng YZ (vuông góc chiều dài xe): rộng 2a, cao b. */
class HalfEllipse extends Curve {
  constructor(a, b) {
    super()
    this.a = a
    this.b = b
  }

  getPoint(t, out = new Vector3()) {
    const angle = Math.PI * t
    return out.set(0, Math.sin(angle) * this.b, Math.cos(angle) * this.a)
  }
}

export class PaintSweep {
  /**
   * `table`: kệ xoay studio. Vòm đứng CỐ ĐỊNH trong phòng (gắn vào phần không quay của kệ, theo hướng ban đầu
   * của xe): kéo xoay xe thì vòm không quay theo. Đang quét màu vẫn kéo xoay xe được.
   */
  constructor(table) {
    this.table = table
    this.frame = new Group()
    this.frame.rotation.y = table.homeYaw
    table.group.add(this.frame)
    this.arch = new Mesh(new BufferGeometry(), glow('#ffffff', 4))
    this.arch.name = 'sweep_arch'
    this.arch.visible = false
    this.frame.add(this.arch)
    this.model = null
    this.anim = null
    this.archFromCar = new Matrix4()
  }

  /** Xe mới lên bục: dựng vòm vừa cỡ xe, đứng sau đuôi xe; xe về màu gốc. */
  setCar(model) {
    this.model = model
    this.anim = null
    this.arch.visible = Boolean(model)
    if (!model) return
    const uniforms = paintUniforms(model)
    const size = uniforms[0].uCarSize.value
    // vòm cố định mà xe xoay được -> vòm phải ôm được xe ở mọi góc: rộng theo nửa đường chéo xe, đứng trên sàn
    const reach = Math.hypot(size.x / 2, size.z / 2)
    this.front = reach + MARGIN
    this.rear = -this.front
    this.arch.geometry.dispose()
    this.arch.geometry = new TubeGeometry(new HalfEllipse(reach + 0.15, this.table.top + size.y + 0.35), 120, 0.035, 10, false)
    this.arch.position.set(this.rear, 0, 0)
    // "Màu gốc" = màu thân xe đo được, phủ đều (giữ nguyên object uniform vì shader đã tham chiếu)
    const body = model.userData.paintBody
    for (const u of uniforms) {
      u.uOnOld.value = u.uOnNew.value = body ? 1 : 0
      if (body) u.uPaintNew.value.copy(body)
    }
    this.write({ sweep: -1e4, glow: 0 })
  }

  /** Màu tuyến tính của lựa chọn `key`; 'original' = màu thân xe đo được (null nếu không đo được). */
  colorOf(key) {
    if (key === 'original') return this.model.userData.paintBody ?? null
    const hex = paintColor(key)
    return hex ? new Color(hex) : null
  }

  write({ sweep, glow: g }) {
    for (const u of paintUniforms(this.model)) {
      u.uSweep.value = sweep
      u.uGlow.value = g
    }
  }

  /** Bắt đầu quét sang màu `key` ('original' = màu gốc). Đang quét dở thì chốt màu đích cũ rồi quét lại. */
  start(key) {
    if (!this.model) return
    const color = this.colorOf(key)
    for (const u of paintUniforms(this.model)) {
      u.uPaintOld.value.copy(u.uPaintNew.value)
      u.uOnOld.value = u.uOnNew.value
      u.uOnNew.value = color ? 1 : 0
      if (color) u.uPaintNew.value.copy(color)
    }
    this.write({ sweep: 1e4, glow: 0 }) // cả xe vẫn màu cũ cho tới khi vòm đi qua
    this.anim = { t: 0, from: this.arch.position.x }
  }

  /**
   * Vòm đứng yên còn xe có thể đang xoay: mỗi khung hình cho shader biết phép đổi từ toạ độ xe sang toạ độ vòm,
   * để ranh giới màu là mặt phẳng của vòm trong phòng (xe xoay tới đâu, phần đã qua vòm đổi màu tới đó).
   */
  syncFrame() {
    this.model.updateWorldMatrix(true, false)
    this.frame.updateWorldMatrix(true, false)
    this.archFromCar.copy(this.frame.matrixWorld).invert().multiply(this.model.matrixWorld)
    for (const u of paintUniforms(this.model)) u.uArchFromCar.value = this.archFromCar
  }

  /** Gọi mỗi khung hình. Trả về true khi đang quét (cảnh còn thay đổi). */
  update(dt) {
    const a = this.anim
    if (!a) return false
    this.syncFrame()
    a.t += dt
    if (a.t < RETURN_S) {
      this.arch.position.x = a.from + (this.front - a.from) * ease(a.t / RETURN_S)
      return true
    }
    const k = Math.min(1, (a.t - RETURN_S) / SWEEP_S)
    const x = this.front + (this.rear - this.front) * ease(k)
    this.arch.position.x = x
    this.write({ sweep: x, glow: k < 1 ? 1 : 0 })
    if (k >= 1) {
      this.write({ sweep: -1e4, glow: 0 }) // quét xong: cả xe màu mới
      this.anim = null
    }
    return true
  }
}
