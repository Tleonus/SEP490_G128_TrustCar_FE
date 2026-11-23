import { CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, TorusGeometry } from 'three'
import { DOOR, STOPS, STUDIO } from './layout'
import { box, glow, std } from './room'
import { floorTexture, studioWordTexture } from './textures'

const T = 0.3
// Ảnh logo emblem lấy từ mô hình TRUST CAR (vật liệu CAMPUS2_LogoEmblemCutout); 8 % dưới cùng là
// mép chữ của bản gốc nên cắt bỏ.
const LOGO_CROP = 0.08
const LOGO_ASPECT = 1443 / (1158 * (1 - LOGO_CROP))
const LOGO_Y = 3.55 // tâm logo: cao
const LOGO_Z = -15.5 // tâm logo: dọc tường trái
const SIGN_R = 1.85 // bán kính biển logo tròn

function room(g) {
  const { minX, maxX, minZ, maxZ, height: H } = STUDIO
  const W = maxX - minX
  const D = maxZ - minZ
  const cz = (minZ + maxZ) / 2
  const map = floorTexture('#5d6064')
  map.repeat.set(5, 4)
  box(g, [W, 0.1, D], std('#ffffff', 0.38, { map }), [0, -0.05, cz], 'studio_floor')
  box(g, [W, 0.1, D], std('#55585d', 0.9), [0, H + 0.05, cz])
  const wall = std('#6c6f74', 0.92)
  box(g, [T, H, D], wall, [minX - T / 2, H / 2, cz])
  box(g, [T, H, D], wall, [maxX + T / 2, H / 2, cz])
  box(g, [W, H, T], wall, [0, H / 2, minZ - T / 2])
  // vách phía cửa cuốn (mặt trong studio): hai bên cửa + phần trên cửa, kín lên tới trần
  const side = (W - DOOR.width) / 2
  const fz = maxZ - 0.33
  box(g, [side, H, 0.06], wall, [minX + side / 2, H / 2, fz])
  box(g, [side, H, 0.06], wall, [maxX - side / 2, H / 2, fz])
  box(g, [DOOR.width, H - DOOR.height, 0.06], wall, [0, (H + DOOR.height) / 2, fz])
  // dải đèn trần dọc phòng
  box(g, [0.5, 0.04, D - 2], glow('#ffffff', 1.6), [-2.5, H - 0.02, cz])
  box(g, [0.5, 0.04, D - 2], glow('#ffffff', 1.6), [2.5, H - 0.02, cz])
}

function logo(g, logoTexture) {
  const tex = logoTexture.clone()
  tex.repeat.set(1, 1 - LOGO_CROP)
  tex.offset.set(0, LOGO_CROP)
  const h = 2.3
  const mat = new MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.55,
    transparent: true, alphaTest: 0.35, roughness: 0.5, side: DoubleSide,
  })
  // Biển logo tròn treo trên tay đỡ ở tường TRÁI. Dán phẳng lên tường thì nhìn chéo từ điểm 04 thành hình elip,
  // nên mặt biển quay thẳng về phía camera điểm 04 (vẫn là hình tròn khi nhìn từ đó).
  const sign = new Group()
  sign.name = 'logo_sign'
  const [cx, , cz] = STOPS[3].pos
  const yaw = Math.atan2(cx - STUDIO.minX, cz - LOGO_Z)
  const reach = SIGN_R * Math.abs(Math.cos(yaw)) + 0.15 // đẩy ra khỏi tường để mép biển không cắm vào tường
  sign.position.set(STUDIO.minX + reach, LOGO_Y, LOGO_Z)
  sign.rotation.y = yaw
  const back = new Mesh(new CylinderGeometry(SIGN_R, SIGN_R, 0.08, 96), std('#141518', 0.35, { metalness: 0.4 }))
  back.rotation.x = Math.PI / 2
  back.position.z = -0.05
  const rim = new Mesh(new TorusGeometry(SIGN_R, 0.035, 16, 160), std('#c9a227', 0.25, { metalness: 0.9 }))
  const halo = new Mesh(new TorusGeometry(SIGN_R - 0.12, 0.03, 16, 160), glow('#ffffff', 3.2))
  halo.position.z = 0.01
  const emblem = new Mesh(new PlaneGeometry(h * LOGO_ASPECT, h), mat)
  emblem.name = 'logo_emblem'
  emblem.position.z = 0.02
  sign.add(back, rim, halo, emblem)
  g.add(sign)
  // tay đỡ từ tường ra biển
  box(g, [reach, 0.08, 0.08], std('#1b1c1f', 0.4, { metalness: 0.7 }), [STUDIO.minX + reach / 2, LOGO_Y, LOGO_Z])
}

/** Mảng tường trang trí sau biển logo: tấm ốp tối viền vàng, 2 dải LED dọc, chữ thương hiệu. */
function brandWall(g, wordTexture) {
  const x = STUDIO.minX + 0.02
  const z0 = LOGO_Z - 3.2
  const z1 = LOGO_Z + 3.2
  const zc = (z0 + z1) / 2
  const panel = box(g, [0.04, 4.6, z1 - z0], std('#1d1f23', 0.55), [x, 3.0, zc])
  panel.name = 'brand_panel'
  const trim = std('#c9a227', 0.25, { metalness: 0.9 })
  box(g, [0.06, 0.04, z1 - z0], trim, [x + 0.01, 5.3, zc])
  box(g, [0.06, 0.04, z1 - z0], trim, [x + 0.01, 0.7, zc])
  for (const z of [z0 + 0.25, z1 - 0.25]) box(g, [0.06, 4.3, 0.06], glow('#ffd27a', 2.4), [x + 0.02, 3.0, z])
  const word = new Mesh(new PlaneGeometry(3.6, 0.9),
    new MeshStandardMaterial({ map: wordTexture, emissiveMap: wordTexture, emissive: '#ffffff', emissiveIntensity: 0.5, transparent: true }))
  word.position.set(x + 0.03, 1.15, zc + 0.6) // lệch về phía cửa: không bị biển logo (nhô ra) che
  word.rotation.y = Math.PI / 2
  g.add(word)
}

/** Dựng studio màu sơn phía sau cửa cuốn. Vòm đèn quét màu nằm ở `paintSweep.js` (gắn theo kệ xoay). */
export function buildStudio({ logoTexture }) {
  const g = new Group()
  g.name = 'studio'
  room(g)
  brandWall(g, studioWordTexture())
  logo(g, logoTexture)
  return g
}
