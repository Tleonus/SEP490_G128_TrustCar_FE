import { Box3, Group, Vector3 } from 'three'
import { ENV_URL, castShadows, loadGLB, normalize } from './assets'
import { paintRack, paintCans, pendantLamp } from './propShapes'

// Đồ vật bày quanh showroom cho đỡ trống. Mô hình lấy từ thư mục gg/ của dự án (đã nén bằng scripts/showroom-3d);
// thùng sơn, kệ sơn, đèn thả trần dựng bằng code. h = chiều cao thật (m), yaw = góc quay.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F15

const Q = Math.PI / 2
export const PROPS = [
  // Không xếp gì ở khoảng tường phía sau xe (nhìn từ các điểm dừng sẽ bị xe che): đồ đặt dọc hai bên tường.
  // --- Studio màu sơn = xưởng sơn (camera điểm 04 ở góc phải gần cửa, nhìn chéo về góc trái phía sau) ---
  { file: 'workbench.glb', h: 0.95, at: [4.2, -21.45], yaw: 0 },
  { file: 'tool-cabinet.glb', h: 1.05, at: [6.7, -21.4], yaw: 0 },
  { file: 'tool-trolley.glb', h: 1.0, at: [7.1, -17.8], yaw: -Q },
  { file: 'pressure-washer.glb', h: 0.98, at: [7.3, -15.2], yaw: -Q },
  { file: 'detailing-cart.glb', h: 1.05, at: [7.2, -12.6], yaw: -Q },
  { file: 'air-compressor.glb', h: 0.78, at: [-7.25, -13.0], yaw: Q },
  // --- Sảnh (nhìn từ cửa vào: phía sau hai kệ xe bị che, nên đồ đặt dọc vách kính phải và hai góc trước) ---
  { file: 'plant2.glb', h: 1.6, at: [8.8, 8.6], yaw: 0.3 },
  { file: 'plant2.glb', h: 1.6, at: [-8.8, 8.6], yaw: 2.1 },
  { file: 'floor-lamp2.glb', h: 1.75, at: [8.7, 5.6], yaw: -Q },
  { file: 'credenza.glb', h: 0.75, at: [-9.15, -2.2], yaw: 0 },
  { file: 'diagnostic.glb', h: 1.45, at: [8.5, 2.4], yaw: -Q },
  { file: 'headlight-tester.glb', h: 1.6, at: [8.4, -0.4], yaw: -Q },
]

const SHAPES = [
  { make: () => paintRack(), at: [-7.65, -10.4], yaw: Q },
  { make: () => paintCans(7), at: [-6.9, -12.0], yaw: 0.2 },
  { make: () => paintCans(5), at: [-6.9, -17.6], yaw: 1.4 },
  { make: () => pendantLamp(), at: [-6.0, 4.3], y: 5.2 },
  { make: () => pendantLamp(), at: [-3.4, -2.4], y: 5.2 },
  { make: () => pendantLamp(), at: [3.4, -2.4], y: 5.2 },
]


function fitHeight(root, h) {
  root.updateMatrixWorld(true)
  const dim = new Box3().setFromObject(root).getSize(new Vector3())
  const holder = normalize(root, 1)
  holder.scale.setScalar(h / dim.y)
  return holder
}

/** Dựng toàn bộ đồ vật. Món nào tải lỗi thì bỏ qua, không làm hỏng showroom. */
export async function buildProps() {
  const g = new Group()
  g.name = 'props'
  for (const s of SHAPES) {
    const o = s.make()
    o.position.set(s.at[0], s.y ?? 0, s.at[1])
    o.rotation.y = s.yaw ?? 0
    g.add(o)
  }
  const cache = new Map()
  await Promise.allSettled(PROPS.map(async (p) => {
    if (!cache.has(p.file)) cache.set(p.file, loadGLB(`${ENV_URL}/${p.file}`))
    const holder = fitHeight(castShadows((await cache.get(p.file)).clone()), p.h)
    holder.position.set(p.at[0], 0, p.at[1])
    holder.rotation.y = p.yaw
    g.add(holder)
  }))
  return g
}
