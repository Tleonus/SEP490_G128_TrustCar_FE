import { Group } from 'three'
import { ledBand } from './ledRing'

const DRAG_GAIN = 0.0085
const FRICTION = 2.4
const MAX_SPEED = 6
const IDLE_SPEED = 0.12

/**
 * Một kệ xoay: đĩa `tron_colored` + xe đặt trên mặt đĩa, quay cùng nhau.
 * Kéo thì quay theo tay, thả ra quay tiếp theo quán tính rồi chậm dần.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F06
 */
export class Turntable {
  constructor(key, platform) {
    this.key = key
    this.group = new Group()
    this.group.name = `turntable_${key}`
    this.spin = new Group()
    this.group.add(this.spin)
    this.platform = platform.clone()
    this.spin.add(this.platform)
    this.top = platform.userData.size.y
    // dải LED chạy vòng quanh thân kệ (đứng yên theo kệ ngoài, không quay theo mặt kệ)
    const r = platform.userData.size.x / 2 + 0.012
    this.group.add(ledBand(r, this.top * 0.34, this.top * 0.5))
    this.car = null
    this.carData = null
    this.velocity = 0
    this.dragging = false
    this.idleSpin = false
  }

  place({ x, z, yaw }) {
    this.group.position.set(x, 0, z)
    this.spin.rotation.y = yaw
    this.homeYaw = yaw // hướng ban đầu (vòm quét màu ở studio đứng theo hướng này)
  }

  /** Đặt mô hình xe (đã chuẩn hóa) lên đĩa. `null` = kệ trống. */
  setCar(holder, carData) {
    if (this.car) this.spin.remove(this.car)
    this.car = holder
    this.carData = holder ? carData : null
    if (holder) {
      holder.position.y = this.top
      this.spin.add(holder)
    }
  }

  grab() {
    this.dragging = true
    this.velocity = 0
  }

  drag(dx, dt) {
    const step = dx * DRAG_GAIN
    this.spin.rotation.y += step
    if (dt > 0) this.velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, step / dt))
  }

  release() {
    this.dragging = false
  }

  /** Trả về true nếu đĩa còn đang quay (để biết khi nào cảnh đứng yên). */
  update(dt) {
    if (this.dragging) return true
    if (Math.abs(this.velocity) > 0.005) {
      this.spin.rotation.y += this.velocity * dt
      this.velocity *= Math.exp(-dt * FRICTION)
      return true
    }
    this.velocity = 0
    if (this.idleSpin && this.car) {
      this.spin.rotation.y += IDLE_SPEED * dt
      return true
    }
    return false
  }
}
