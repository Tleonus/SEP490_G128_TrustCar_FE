import { describe, expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import { detectWheels } from './carShape'

const SIZE = new Vector3(4.8, 1.9, 2.0)

/** Xe giả: 2 bánh (vòng tròn ở mặt ngoài) + thân xe phía trên vòm bánh, có khe hở giữa lốp và vòm. */
function fakeCar({ front, rear, r }) {
  const pts = []
  for (const cx of [front, rear]) {
    for (let a = 0; a < 360; a += 2) {
      const t = (a * Math.PI) / 180
      for (const z of [-0.9, 0.9]) pts.push(cx + r * Math.cos(t), r + r * Math.sin(t), z)
    }
    for (let y = 2 * r + 0.08; y < 1.3; y += 0.01) for (const z of [-0.95, 0.95]) pts.push(cx, y, z) // thân trên vòm
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return { geometry: g }
}

describe('showroom-3d detectWheels', () => {
  it('tìm đúng trục bánh trước / sau và bán kính lốp', () => {
    const w = detectWheels([fakeCar({ front: 1.55, rear: -1.25, r: 0.38 })], [new Matrix4()], SIZE)
    expect(w.detected).toBe(true)
    expect(w.front).toBeCloseTo(1.55, 1)
    expect(w.rear).toBeCloseTo(-1.25, 1)
    expect(w.r).toBeCloseTo(0.38, 1)
  })

  it('không có điểm chạm đất -> dùng tỉ lệ thường gặp', () => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([0, 1, 0, 1, 1, 0, -1, 1, 0], 3))
    const w = detectWheels([{ geometry: g }], [new Matrix4()], SIZE)
    expect(w.detected).toBe(false)
    expect(w.front).toBeCloseTo(0.295 * 4.8)
    expect(w.rear).toBeCloseTo(-0.295 * 4.8)
    expect(w.r).toBeCloseTo(0.215 * 1.9)
  })
})
