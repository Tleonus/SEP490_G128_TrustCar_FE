// Mô hình xe đã tách bộ phận bằng Blender (scripts/showroom-3d/blender/split_car.py) có các vật liệu TC_*.
// Mỗi bộ phận được chỉnh chất liệu cho thật: kính bóng tối, lốp cao su mờ, mâm / crôm kim loại, đèn hơi phát sáng.
// Mô hình chưa tách (1 vật liệu) thì giữ nguyên, phần đổi màu dùng mặt nạ ước lượng trong paint.js.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09

export const PAINT_MATERIAL = 'TC_Body_Paint'

const LOOK = {
  TC_Glass: (m) => {
    // kính tối màu đều: bỏ ảnh texture (AI hay in cả gương / nội thất nhìn xuyên kính thành vết đen)
    m.map = null
    m.color.set('#1b2026')
    Object.assign(m, { roughness: 0.04, metalness: 0.15, envMapIntensity: 1.6 })
    m.roughnessMap = null
    m.metalnessMap = null
  },
  TC_Tire: (m) => {
    Object.assign(m, { roughness: 0.88, metalness: 0, envMapIntensity: 0.5 })
    m.metalnessMap = null
  },
  TC_Rim: (m) => {
    Object.assign(m, { roughness: 0.28, metalness: 0.85, envMapIntensity: 1.3 })
    m.roughnessMap = null
    m.metalnessMap = null
  },
  TC_Chrome: (m) => {
    Object.assign(m, { roughness: 0.12, metalness: 1, envMapIntensity: 1.6 })
    m.roughnessMap = null
    m.metalnessMap = null
  },
  TC_Trim: (m) => {
    Object.assign(m, { roughness: 0.55, metalness: 0.05 })
    m.metalnessMap = null
  },
  TC_Light: (m) => {
    m.emissiveMap = m.map
    m.emissive.setRGB(1, 1, 1)
    Object.assign(m, { emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.2 })
  },
  TC_Body_Paint: (m) => {
    Object.assign(m, { roughness: 0.38, metalness: 0.15, envMapIntensity: 1.2 })
    m.roughnessMap = null
    m.metalnessMap = null
  },
}

/** Mô hình đã tách bộ phận chưa (có vật liệu sơn riêng). */
export function isSplitModel(root) {
  let split = false
  root.traverse((o) => {
    if (o.isMesh && [o.material].flat().some((m) => m?.name === PAINT_MATERIAL)) split = true
  })
  return split
}

/** Chỉnh chất liệu từng bộ phận theo tên vật liệu. Trả về true nếu là mô hình đã tách. */
export function applyPartLooks(root) {
  const done = new Set()
  root.traverse((o) => {
    if (!o.isMesh) return
    for (const m of [o.material].flat()) {
      if (!m || done.has(m) || !LOOK[m.name]) continue
      LOOK[m.name](m)
      m.needsUpdate = true
      done.add(m)
    }
  })
  return done.size > 0
}

/**
 * Sơn thân xe theo màu thật `hex` (khi texture AI sai màu): bỏ ảnh màu của vật liệu sơn, giữ bề mặt (normal map).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F18
 */
export function applyTruePaint(root, hex) {
  root.traverse((o) => {
    if (!o.isMesh) return
    for (const m of [o.material].flat()) {
      if (m?.name !== PAINT_MATERIAL) continue
      m.map = null
      m.color.set(hex)
      m.needsUpdate = true
    }
  })
}
