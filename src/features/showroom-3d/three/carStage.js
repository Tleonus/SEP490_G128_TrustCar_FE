import { Group } from 'three'
import { castShadows, disposeTree, loadGLB, normalize } from './assets'
import { SLOTS } from './layout'
import { Turntable } from './turntable'
import { carLengthMeters, carModelUrl } from '../utils/carSpecs'
import { applyPartLooks, applyTruePaint } from './carMaterials'

/**
 * Các kệ xoay và xe trên đó. Mỗi mô hình xe chỉ tải một lần; kệ nào cần thì lấy bản sao
 * (dùng chung hình học), studio lấy bản sao có vật liệu riêng để đổi màu sơn.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05
 */
export class CarStage {
  constructor(scene, platform) {
    this.tables = {}
    for (const key of ['left', 'right', 'studio']) {
      const t = new Turntable(key, platform)
      t.place(SLOTS[key])
      scene.add(t.group)
      this.tables[key] = t
    }
    this.templates = new Map()
    this.tokens = {}
  }

  template(car, onProgress) {
    const code = car.vehicleCode
    if (!this.templates.has(code)) {
      const p = loadGLB(carModelUrl(code), onProgress).then((root) => {
        castShadows(root)
        applyPartLooks(root) // mô hình đã tách bộ phận bằng Blender: kính, lốp, mâm, crôm, đèn đúng chất liệu
        if (car.showroomPaint) applyTruePaint(root, car.showroomPaint)
        const holder = normalize(root, carLengthMeters(car.bodyType))
        const wrap = new Group()
        wrap.name = `car_${code}`
        if (holder.userData.longAxis === 'z') holder.rotation.y = Math.PI / 2
        wrap.add(holder)
        return wrap
      })
      p.catch(() => this.templates.delete(code))
      this.templates.set(code, p)
    }
    return this.templates.get(code)
  }

  /**
   * Đặt xe lên kệ sảnh `key` ('left' | 'right'); `null` = kệ trống (kệ vẫn hiện, chờ mô hình).
   * Bấm đổi xe liên tục thì chỉ lần cuối được đặt.
   */
  async showShelf(key, car, onProgress) {
    const table = this.tables[key]
    const token = (this.tokens[key] = (this.tokens[key] ?? 0) + 1)
    if ((table.carData?.vehicleCode ?? null) === (car?.vehicleCode ?? null)) return // không đổi: giữ nguyên góc xoay
    if (!car) return table.setCar(null)
    const model = await this.template(car, onProgress)
    if (token !== this.tokens[key]) return
    table.setCar(model.clone(), car)
  }

  /** Đặt xe lên bục studio (vật liệu riêng để đổi màu). */
  async showStudio(car, onProgress) {
    const studio = this.tables.studio
    if (!car) return studio.setCar(null)
    if (studio.carData?.vehicleCode === car.vehicleCode) return studio.car
    const model = (await this.template(car, onProgress)).clone()
    model.traverse((o) => {
      if (o.isMesh) o.material = o.material.clone()
    })
    studio.setCar(model, car)
    return model
  }

  /** Kệ có xe bị tia chiếu trúng (bấm / kéo). */
  pick(raycaster) {
    let best = null
    for (const t of Object.values(this.tables)) {
      if (!t.car || !t.group.visible) continue
      const hit = raycaster.intersectObject(t.spin, true)[0]
      if (hit && (!best || hit.distance < best.distance)) best = { table: t, distance: hit.distance }
    }
    return best?.table ?? null
  }

  /** Cập nhật quay; trả về true nếu có kệ đang quay. */
  update(dt) {
    let moving = false
    for (const t of Object.values(this.tables)) if (t.update(dt)) moving = true
    return moving
  }

  dispose() {
    for (const p of this.templates.values()) p.then(disposeTree, () => {})
    this.templates.clear()
  }
}
