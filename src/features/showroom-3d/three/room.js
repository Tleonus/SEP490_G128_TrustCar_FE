import {
  BoxGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DOOR, HALL } from './layout'
import { floorTexture, rollerDoorTexture, wordmarkTexture } from './textures'

const T = 0.3 // độ dày tường

export const std = (color, roughness = 0.8, extra = {}) => new MeshStandardMaterial({ color, roughness, metalness: 0, ...extra })
export const glow = (color, intensity) => new MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity })

export function box(parent, [w, h, d], mat, [x, y, z], name) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.receiveShadow = true
  if (name) m.name = name
  parent.add(m)
  return m
}

function shell(g) {
  const { minX, maxX, minZ, maxZ, height: H } = HALL
  const W = maxX - minX
  const D = maxZ - minZ
  const floorMap = floorTexture()
  floorMap.repeat.set(6, 4)
  box(g, [W, 0.1, D], std('#ffffff', 0.32, { map: floorMap, envMapIntensity: 1.2 }), [0, -0.05, 0], 'hall_floor')
  box(g, [W, 0.1, D], std('#26282c', 0.9), [0, H + 0.05, 0], 'hall_ceiling')
  box(g, [T, H, D], std('#3a3d42', 0.85), [minX - T / 2, H / 2, 0], 'hall_wall_left')
  // vách sau: hai bên cửa + đầu cửa
  const side = (W - DOOR.width) / 2
  const back = std('#141210', 0.9)
  box(g, [side, H, T], back, [minX + side / 2, H / 2, minZ - T / 2])
  box(g, [side, H, T], back, [maxX - side / 2, H / 2, minZ - T / 2])
  box(g, [DOOR.width, H - DOOR.height, T], back, [0, (H + DOOR.height) / 2, minZ - T / 2])
  // trần: tấm sáng ở giữa + viền LED
  for (const x of [-4, 0, 4]) box(g, [0.35, 0.04, 9], glow('#f4f1ea', 1.6), [x, H - 0.02, -0.5], 'ceiling_light')
  box(g, [W - 0.6, 0.03, 0.06], glow('#ffffff', 1.2), [0, H - 0.03, maxZ - 0.3])
  box(g, [W - 0.6, 0.03, 0.06], glow('#ffffff', 1.2), [0, H - 0.03, minZ + 0.3])
}

/**
 * Vách gỗ nan dọc trên vách sau. Gộp thành 1 lưới (1 lệnh vẽ); không dùng InstancedMesh vì
 * path tracer của "Ảnh thật" không đọc được InstancedMesh. Màu gỗ hơi lệch nhau qua màu đỉnh.
 */
function slats(g) {
  const parts = []
  const tint = new Color()
  for (let x = HALL.minX + 0.2; x < HALL.maxX - 0.1; x += 0.185) {
    if (Math.abs(x) < DOOR.width / 2 + 0.25) continue
    const b = new BoxGeometry(0.07, HALL.height - 0.5, 0.06).toNonIndexed()
    b.translate(x, HALL.height / 2 - 0.05, HALL.minZ + 0.03)
    tint.setHSL(0.08, 0.38, 0.33 + Math.random() * 0.06)
    const n = b.attributes.position.count
    b.setAttribute('color', new Float32BufferAttribute(Array.from({ length: n }, () => [tint.r, tint.g, tint.b]).flat(), 3))
    parts.push(b)
  }
  const mesh = new Mesh(mergeGeometries(parts), std('#8a6744', 0.62, { vertexColors: true }))
  mesh.receiveShadow = true
  mesh.name = 'wood_slats'
  g.add(mesh)
}

function rollerDoor(g) {
  const slatsMap = rollerDoorTexture()
  slatsMap.repeat.set(1, 2.4)
  const door = box(g, [DOOR.width, DOOR.height, 0.06], std('#ffffff', 0.55, { map: slatsMap, metalness: 0.4 }),
    [0, DOOR.height / 2, HALL.minZ - T / 2], 'roller_door')
  box(g, [DOOR.width + 0.3, 0.12, 0.14], std('#0a0a0a', 0.5), [0, DOOR.height + 0.06, HALL.minZ + 0.02])
  // chữ TRUST CAR trên đầu cửa cuốn
  const map = wordmarkTexture()
  const word = new Mesh(new PlaneGeometry(3.4, 0.85),
    new MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.6, transparent: true }))
  word.position.set(0, DOOR.height + 0.72, HALL.minZ + 0.02)
  word.name = 'wordmark'
  g.add(word)
  return door
}

/** Màn hình LED lớn trên tường trái. */
function ledScreen(g, imageTexture) {
  const frame = box(g, [0.12, 3.6, 6.4], std('#0b0b0c', 0.4), [HALL.minX + 0.06, 2.55, -2.2])
  frame.castShadow = false
  const screen = new Mesh(new PlaneGeometry(6.2, 3.4),
    new MeshBasicMaterial({ map: imageTexture, toneMapped: false }))
  screen.position.set(HALL.minX + 0.13, 2.55, -2.2)
  screen.rotation.y = Math.PI / 2
  screen.name = 'led_screen'
  g.add(screen)
}

/**
 * Một mặt vách kính khung đen dài `len` (m) dọc trục X của nhóm, kèm cảnh phố phía ngoài cách `far` m.
 * Nhóm được đặt / xoay sẵn: bên phải sảnh và mặt tiền đều dùng hàm này.
 */
function glassFacade(len, outsideTexture, far = 9) {
  const f = new Group()
  const H = HALL.height
  const mullion = std('#111214', 0.4, { metalness: 0.6 })
  const n = Math.round(len / 2)
  for (let i = 0; i <= n; i++) box(f, [0.1, H, 0.1], mullion, [-len / 2 + (i * len) / n, H / 2, 0])
  box(f, [len, 0.1, 0.1], mullion, [0, 0.05, 0])
  box(f, [len, 0.1, 0.1], mullion, [0, H - 0.05, 0])
  const glass = new Mesh(new PlaneGeometry(len, H),
    new MeshStandardMaterial({ color: '#9fb4c4', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.12 }))
  glass.position.y = H / 2
  f.add(glass)
  // cảnh phố rộng hơn hẳn vách kính để nhìn chéo cũng không lộ mép
  const outside = new Mesh(new PlaneGeometry(len + far * 4, 13),
    new MeshBasicMaterial({ map: outsideTexture, toneMapped: false, color: new Color(0.85, 0.85, 0.85) }))
  outside.position.set(0, 4.2, -far)
  f.add(outside)
  return f
}

/** Vách kính bên phải và mặt tiền kính (sau lưng điểm 01) nhìn ra phố, kèm vỉa hè bên ngoài. */
function glassWalls(g, outsideTexture) {
  const walk = box(g, [60, 0.1, 60], std('#8d9196', 0.9), [0, -0.12, 0], 'sidewalk')
  walk.receiveShadow = false
  const right = glassFacade(HALL.maxZ - HALL.minZ, outsideTexture)
  right.position.set(HALL.maxX, 0, (HALL.maxZ + HALL.minZ) / 2)
  right.rotation.y = -Math.PI / 2 // mặt kính quay vào sảnh, cảnh phố nằm ngoài (phía +X)
  const front = glassFacade(HALL.maxX - HALL.minX, outsideTexture)
  front.position.set((HALL.maxX + HALL.minX) / 2, 0, HALL.maxZ)
  front.rotation.y = Math.PI
  g.add(right, front)
}

/** Dựng sảnh. Trả về group và cửa cuốn (để mở khi camera đi vào studio). */
export function buildHall({ ledTexture, outsideTexture }) {
  const g = new Group()
  g.name = 'hall'
  shell(g)
  slats(g)
  ledScreen(g, ledTexture)
  glassWalls(g, outsideTexture)
  const door = rollerDoor(g)
  return { group: g, door }
}
