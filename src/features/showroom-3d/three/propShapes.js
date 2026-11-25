import { CanvasTexture, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { box, glow, std } from './room'
import { PAINTS } from './paint'

// Đồ vật dựng bằng code (không có sẵn mô hình): thùng sơn, kệ sơn, đèn thả trần.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F15

const CAN_COLORS = [...PAINTS.filter((p) => p.color).map((p) => p.color), '#1d4ed8', '#4a6fa5', '#7a7f86', '#b53a1f']

let labelTex = null
/** Nhãn thùng sơn "TRUST CAR · PAINT" (dùng chung). */
function canLabel() {
  if (labelTex) return labelTex
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 64 })
  const g = c.getContext('2d')
  g.fillStyle = '#f2f2f2'
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = '#111'
  g.font = '700 22px Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('TRUST CAR', 128, 30)
  g.font = '600 14px Arial, sans-serif'
  g.fillText('AUTO PAINT', 128, 52)
  labelTex = new CanvasTexture(c)
  labelTex.colorSpace = SRGBColorSpace
  return labelTex
}

const metal = std('#c8ccd2', 0.35, { metalness: 0.8 })

/** Một thùng sơn 4 lít: thân kim loại, nhãn, nắp màu theo màu sơn. */
export function paintCan(color, scale = 1) {
  const g = new Group()
  const body = new Mesh(new CylinderGeometry(0.085, 0.085, 0.19, 24), metal)
  body.position.y = 0.095
  const label = new Mesh(new CylinderGeometry(0.0855, 0.0855, 0.1, 24, 1, true),
    new MeshStandardMaterial({ map: canLabel(), roughness: 0.6 }))
  label.position.y = 0.095
  const lid = new Mesh(new CylinderGeometry(0.087, 0.087, 0.012, 24), std(color, 0.35, { metalness: 0.3 }))
  lid.position.y = 0.196
  const drip = new Mesh(new CylinderGeometry(0.0858, 0.0858, 0.03, 24, 1, true), std(color, 0.3))
  drip.position.y = 0.175
  for (const m of [body, label, lid, drip]) {
    m.castShadow = true
    m.receiveShadow = true
  }
  g.add(body, label, lid, drip)
  g.scale.setScalar(scale)
  return g
}

/** Đống thùng sơn trên sàn (xếp 2 tầng). */
export function paintCans(n = 6) {
  const g = new Group()
  for (let i = 0; i < n; i++) {
    const can = paintCan(CAN_COLORS[i % CAN_COLORS.length], 1.6)
    const top = i >= 4
    const k = top ? i - 4 : i
    can.position.set((k % 2) * 0.3 - 0.15 + (top ? 0.15 : 0), top ? 0.32 : 0, Math.floor(k / 2) * 0.3 - 0.15)
    can.rotation.y = i * 1.3
    g.add(can)
  }
  return g
}

/** Kệ thép 4 tầng chất đầy thùng sơn đủ màu. */
export function paintRack() {
  const g = new Group()
  const frame = std('#2c2f33', 0.5, { metalness: 0.6 })
  const W = 2.4
  const D = 0.55
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) box(g, [0.05, 2.1, 0.05], frame, [x, 1.05, z])
  const levels = [0.15, 0.65, 1.15, 1.65]
  levels.forEach((y, li) => {
    box(g, [W, 0.04, D], frame, [0, y, 0])
    for (let i = 0; i < 9; i++) {
      const can = paintCan(CAN_COLORS[(i + li * 3) % CAN_COLORS.length], 1.35)
      can.position.set(-W / 2 + 0.17 + i * 0.257, y + 0.02, (i % 2) * 0.12 - 0.06)
      can.rotation.y = i * 0.9
      g.add(can)
    }
  })
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true
  })
  return g
}

/** Đèn thả trần: dây + chao đen + đáy phát sáng. Gốc nhóm ở trần. */
export function pendantLamp() {
  const g = new Group()
  const cord = new Mesh(new CylinderGeometry(0.006, 0.006, 1.6, 6), std('#111', 0.6))
  cord.position.y = -0.8
  const shade = new Mesh(new CylinderGeometry(0.12, 0.32, 0.28, 32, 1, true), std('#151618', 0.35, { metalness: 0.7, side: 2 }))
  shade.position.y = -1.74
  const bulb = new Mesh(new CylinderGeometry(0.3, 0.3, 0.01, 32), glow(new Color('#ffe9c7'), 3))
  bulb.position.y = -1.87
  g.add(cord, shade, bulb)
  return g
}
