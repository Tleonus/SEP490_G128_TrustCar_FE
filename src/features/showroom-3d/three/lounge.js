import { Box3, CircleGeometry, Group, Mesh, Vector3 } from 'three'
import { ENV_URL, castShadows, loadGLB, normalize } from './assets'
import { LOUNGE } from './layout'
import { std } from './room'

// Góc tư vấn: nội thất lấy từ thư mục `gg/noithat` của dự án (đã nén bằng scripts/showroom-3d).
// Ghế gốc màu trắng xám: nhuộm sang da nâu cho giống phòng tư vấn.
const LEATHER = '#8a6449'
// size = kích thước ngang lớn nhất (m), height = chiều cao (m) cho đồ đứng.
const ITEMS = [
  { file: 'coffee-table.glb', size: 1.1, at: [0, 0], yaw: 0 },
  { file: 'armchair.glb', size: 0.9, at: [-1.35, -0.2], yaw: Math.PI / 2, tint: LEATHER },
  { file: 'armchair.glb', size: 0.9, at: [1.35, 0.25], yaw: -Math.PI / 2, tint: LEATHER },
  { file: 'floor-lamp2.glb', height: 1.7, at: [-2.4, 1.3], yaw: 0 },
  { file: 'plant2.glb', height: 1.5, at: [-2.6, -1.9], yaw: 0.4 },
]

function fitHeight(root, h) {
  root.updateMatrixWorld(true)
  const dim = new Box3().setFromObject(root).getSize(new Vector3())
  const holder = normalize(root, 1)
  holder.scale.setScalar(h / dim.y) // holder bọc mô hình ở đơn vị gốc
  return holder
}

async function place(group, item, cache) {
  if (!cache.has(item.file)) cache.set(item.file, loadGLB(`${ENV_URL}/${item.file}`))
  const src = (await cache.get(item.file)).clone()
  castShadows(src)
  if (item.tint) {
    src.traverse((o) => {
      if (!o.isMesh) return
      o.material = o.material.clone()
      o.material.color.set(item.tint)
    })
  }
  const holder = item.height ? fitHeight(src, item.height) : normalize(src, item.size)
  holder.position.set(LOUNGE.x + item.at[0], 0, LOUNGE.z + item.at[1])
  holder.rotation.y = item.yaw
  group.add(holder)
}

/** Dựng góc tư vấn (thảm + nội thất). Nội thất tải lỗi thì bỏ qua món đó, không làm hỏng showroom. */
export async function buildLounge() {
  const g = new Group()
  g.name = 'lounge'
  const rug = new Mesh(new CircleGeometry(2.4, 64), std('#3b3631', 0.95))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(LOUNGE.x, 0.005, LOUNGE.z)
  rug.receiveShadow = true
  g.add(rug)
  const cache = new Map()
  await Promise.allSettled(ITEMS.map((it) => place(g, it, cache)))
  return g
}
