import { describe, expect, it } from 'vitest'
import { PerspectiveCamera } from 'three'
import { CameraRig } from './cameraRig'
import { STOPS } from './layout'

const run = (rig, seconds, now0 = 10000) => {
  let now = now0
  for (let t = 0; t < seconds; t += 1 / 60) {
    now += 1000 / 60
    rig.update(1 / 60, now)
  }
  return now
}

describe('showroom-3d CameraRig', () => {
  it('bắt đầu đúng ở điểm 01', () => {
    const cam = new PerspectiveCamera()
    const rig = new CameraRig(cam, STOPS)
    expect(cam.position.toArray()).toEqual(STOPS[0].pos)
    expect(rig.stop).toBe(0)
  })

  it('cuộn quá ngưỡng nhỏ rồi dừng -> bám tới điểm kế tiếp', () => {
    const rig = new CameraRig(new PerspectiveCamera(), STOPS)
    rig.nudge(0.2, 10000)
    run(rig, 6, 10000)
    expect(rig.goal).toBe(1)
    expect(rig.progress).toBe(1)
    expect(rig.moving).toBe(false)
  })

  it('cuộn rất ít -> quay về điểm cũ', () => {
    const rig = new CameraRig(new PerspectiveCamera(), STOPS)
    rig.goTo(2)
    run(rig, 6)
    rig.nudge(-0.05, 20000)
    run(rig, 6, 20000)
    expect(rig.goal).toBe(2)
  })

  it('không vượt quá điểm đầu / cuối', () => {
    const rig = new CameraRig(new PerspectiveCamera(), STOPS)
    rig.nudge(-5, 10000)
    expect(rig.goal).toBe(0)
    rig.nudge(50, 10010)
    expect(rig.goal).toBe(STOPS.length - 1)
  })

  it('bay thẳng 02 -> 04: không ghé bàn tư vấn, chui qua cửa cuốn, tới đúng điểm 04', () => {
    const cam = new PerspectiveCamera()
    const rig = new CameraRig(cam, STOPS)
    rig.goTo(1)
    run(rig, 6)
    rig.flyTo(3)
    let minX = Infinity
    let crossedDoor = false
    for (let i = 0; i < 400 && rig.flight; i++) {
      rig.update(1 / 60)
      minX = Math.min(minX, cam.position.x)
      if (Math.abs(cam.position.z + 8) < 0.5 && Math.abs(cam.position.x) < 1.5) crossedDoor = true
    }
    expect(rig.flight).toBeNull()
    expect(rig.progress).toBe(3)
    expect(cam.position.toArray().map((v) => +v.toFixed(3))).toEqual(STOPS[3].pos)
    expect(minX).toBeGreaterThan(-1) // bàn tư vấn ở x ≈ -6
    expect(crossedDoor).toBe(true)
  })

  it('đang bay thẳng thì cuộn chuột không làm lệch đường bay', () => {
    const rig = new CameraRig(new PerspectiveCamera(), STOPS)
    rig.flyTo(3)
    rig.nudge(-1, 10000)
    expect(rig.goal).toBe(3)
  })

  it('tới điểm 04 camera nằm trong studio và góc nhìn theo điểm dừng', () => {
    const cam = new PerspectiveCamera()
    const rig = new CameraRig(cam, STOPS)
    rig.goTo(3)
    run(rig, 8)
    expect(cam.position.toArray().map((v) => +v.toFixed(3))).toEqual(STOPS[3].pos)
    expect(rig.fov).toBe(STOPS[3].fov ?? 50)
  })
})
