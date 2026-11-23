import { Color, SRGBColorSpace, Vector3 } from 'three'

// Dò vị trí và cỡ bánh xe từ hình khối mô hình (mô hình AI không tách bánh thành vật riêng).
// Toạ độ "khung xe": x dọc chiều dài (giữa xe = 0), y từ mặt đất lên, z ngang.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09

const MAX_POINTS = 160000
const FALLBACK = { x: 0.295, r: 0.215 } // tỉ lệ thường gặp: trục bánh ở ±29,5 % chiều dài, bán kính 21,5 % chiều cao

function collect(meshes, frames) {
  const pts = []
  const v = new Vector3()
  meshes.forEach((mesh, i) => {
    const pos = mesh.geometry.attributes.position
    const step = Math.max(1, Math.ceil(pos.count / MAX_POINTS))
    for (let k = 0; k < pos.count; k += step) pts.push(v.fromBufferAttribute(pos, k).applyMatrix4(frames[i]).clone())
  })
  return pts
}

/** Tâm theo chiều dài của cụm điểm lốp chạm đất phía trước (side = 1) hoặc sau (side = -1). */
function contactCenter(pts, size, side) {
  const xs = pts.filter((p) => p.y < 0.035 * size.y && side * p.x > 0.15 * size.x).map((p) => p.x).sort((a, b) => a - b)
  if (xs.length < 30) return side * FALLBACK.x * size.x
  return (xs[Math.floor(xs.length * 0.05)] + xs[Math.floor(xs.length * 0.95)]) / 2
}

/** Đỉnh lốp: điểm bắt đầu khe hở đầu tiên phía trên lốp (giữa lốp và vòm bánh), ở mặt ngoài xe. */
function tireTop(pts, size, cx) {
  const ys = pts
    .filter((p) => Math.abs(p.x - cx) < 0.02 * size.x && Math.abs(p.z) > 0.3 * size.z && p.y < 0.75 * size.y)
    .map((p) => p.y)
    .sort((a, b) => a - b)
  for (let i = 1; i < ys.length; i++) {
    if (ys[i - 1] > 0.25 * size.y && ys[i] - ys[i - 1] > 0.015 * size.y) return ys[i - 1]
  }
  return null
}

/**
 * Màu thân xe thật: lấy mẫu ảnh texture tại các đỉnh trên tấm cửa hông (giữa hai bánh, ngang hông, mặt ngoài),
 * lấy màu có độ sáng trung vị. Dùng làm "Màu gốc" phủ đều (texture AI tự nó loang lổ). Không lấy được thì null.
 */
export function sampleBodyColor(mesh, frame, size, wheels) {
  const img = mesh.material.map?.image
  const uv = mesh.geometry.attributes.uv
  if (!img || !uv) return null
  const N = 256
  const g = Object.assign(document.createElement('canvas'), { width: N, height: N }).getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, N, N)
  const px = g.getImageData(0, 0, N, N).data
  const pos = mesh.geometry.attributes.position
  const mid = (wheels.front + wheels.rear) / 2
  const half = (wheels.front - wheels.rear) / 2
  const at = (t) => Math.min(N - 1, Math.floor((t - Math.floor(t)) * N))
  const v = new Vector3()
  const cols = []
  for (let k = 0; k < pos.count; k += Math.max(1, Math.ceil(pos.count / MAX_POINTS))) {
    v.fromBufferAttribute(pos, k).applyMatrix4(frame)
    if (Math.abs(v.x - mid) > 0.55 * half || v.y < 0.3 * size.y || v.y > 0.55 * size.y || Math.abs(v.z) < 0.4 * size.z) continue
    const i = (at(uv.getY(k)) * N + at(uv.getX(k))) * 4
    cols.push([px[i], px[i + 1], px[i + 2]])
  }
  if (cols.length < 20) return null
  cols.sort((a, b) => a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722 - (b[0] * 0.2126 + b[1] * 0.7152 + b[2] * 0.0722))
  const [r, gr, b] = cols[Math.floor(cols.length / 2)]
  return new Color().setRGB(r / 255, gr / 255, b / 255, SRGBColorSpace)
}

/** { front, rear, r } theo mét trong khung xe; dò không ra thì dùng tỉ lệ thường gặp. */
export function detectWheels(meshes, frames, size) {
  const pts = collect(meshes, frames)
  const front = contactCenter(pts, size, 1)
  const rear = contactCenter(pts, size, -1)
  const tops = [tireTop(pts, size, front), tireTop(pts, size, rear)].filter(Boolean)
  const fallbackR = FALLBACK.r * size.y
  let r = tops.length ? Math.min(...tops) / 2 : fallbackR
  if (r < 0.14 * size.y || r > 0.3 * size.y) r = fallbackR
  return { front, rear, r, detected: tops.length > 0 }
}
