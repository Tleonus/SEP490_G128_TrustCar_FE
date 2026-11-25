import { CylinderGeometry, DoubleSide, Mesh, MeshStandardMaterial, Vector3 } from 'three'

// Viền phát sáng của kệ xoay (vật liệu Tron_Glow) thành dải đèn LED vàng chạy vòng quanh kệ.
// Mọi kệ dùng chung vật liệu nên chỉ cần cập nhật một biến thời gian.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F21

export const LED_TIME = { value: 0 }

const DOTS = 28 // số đoạn sáng quanh một vòng
const SPEED = 0.55 // vòng / giây (theo đơn vị đoạn sáng)

/** Gắn hiệu ứng chạy cho vật liệu viền sáng trong `root` (mô hình kệ xoay). Trả về true nếu tìm thấy. */
export function makeRunningLed(root) {
  let found = false
  root.traverse((o) => {
    if (!o.isMesh || !/glow/i.test(o.material?.name || '')) return
    const m = o.material
    if (m.userData.led) return
    o.geometry.computeBoundingBox()
    const center = o.geometry.boundingBox.getCenter(new Vector3())
    m.emissive.set('#60a5fa')
    m.emissiveIntensity = 3
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uLedTime = LED_TIME
      shader.uniforms.uLedCenter = { value: center }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLedPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLedPos = position;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uLedTime;\nuniform vec3 uLedCenter;\nvarying vec3 vLedPos;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            vec2 d = vLedPos.xz - uLedCenter.xz;
            float u = fract(atan(d.y, d.x) / 6.2831853 * ${DOTS}.0 - uLedTime * ${SPEED * DOTS});
            float spot = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.38, 0.62, u));
            float wave = 0.5 + 0.5 * sin(atan(d.y, d.x) * 2.0 - uLedTime * 2.2); // sóng sáng lớn chạy chậm
            totalEmissiveRadiance *= 0.12 + 1.4 * spot * (0.55 + 0.45 * wave);
          }`)
    }
    m.customProgramCacheKey = () => 'tc-led-ring'
    m.userData.led = true
    m.needsUpdate = true
    found = true
  })
  return found
}


let bandMaterial = null

/**
 * Dải LED bản rộng ôm quanh thân kệ xoay (viền gốc của mô hình kệ quá mảnh nên khó thấy đèn chạy).
 * Dùng chung một vật liệu (cùng hiệu ứng chạy) cho mọi kệ.
 */
export function ledBand(radius, height, y) {
  if (!bandMaterial) {
    bandMaterial = new MeshStandardMaterial({ name: 'TC_LedBand_glow', color: '#000000', emissive: '#60a5fa', side: DoubleSide })
    const holder = new Mesh(new CylinderGeometry(1, 1, 1, 8, 1, true), bandMaterial)
    makeRunningLed(holder)
  }
  const band = new Mesh(new CylinderGeometry(radius, radius, height, 160, 1, true), bandMaterial)
  band.position.y = y
  band.name = 'led_band'
  return band
}
