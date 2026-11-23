import { carModelUrl, isVehicleCode, sortByCode } from './carSpecs'

export const MANIFEST_URL = '/showroom-3d/cars/manifest.json'

/**
 * Danh sách mô hình + ảnh do `scripts/showroom-3d/prepare-assets.mjs` sinh ra:
 * { "<MÃ XE>": { model: boolean, photos: string[] } }. Không có / lỗi thì trả về null.
 */
export async function loadManifest(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(MANIFEST_URL, { cache: 'no-cache' })
    const type = res.headers.get('content-type') || ''
    if (!res.ok || type.includes('text/html')) return null
    const data = await res.json()
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/** Ảnh của xe trong manifest (chỉ đường dẫn nằm trong thư mục showroom-3d của chính xe đó). */
export function manifestPhotos(manifest, code) {
  if (!isVehicleCode(code)) return []
  const list = manifest?.[code]?.photos
  const prefix = `/showroom-3d/cars/${code}/`
  return Array.isArray(list) ? list.filter((p) => typeof p === 'string' && p.startsWith(prefix)) : []
}

/** Màu sơn thật khai trong manifest (hex #rrggbb) hoặc null. */
export function manifestPaint(manifest, code) {
  const c = manifest?.[code]?.paint
  return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null
}

/**
 * Có file mô hình thật không. Máy chủ web trả `index.html` (200) cho đường dẫn không có file,
 * nên ngoài mã 200 còn phải loại trả lời dạng HTML.
 */
export async function hasModel(url, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(url, { method: 'HEAD', cache: 'no-cache' })
    const type = res.headers.get('content-type') || ''
    return res.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

/**
 * Xe có mô hình 3D, theo thứ tự mã xe. Có manifest thì đọc manifest; không có thì hỏi từng file (HEAD).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05
 */
export async function findCarsWithModels(cars, fetchImpl = fetch, manifest = null) {
  const sorted = sortByCode(cars)
  if (manifest) return sorted.filter((c) => manifest[c.vehicleCode]?.model === true)
  const flags = await Promise.all(sorted.map((c) => hasModel(carModelUrl(c.vehicleCode), fetchImpl)))
  return sorted.filter((_, i) => flags[i])
}
