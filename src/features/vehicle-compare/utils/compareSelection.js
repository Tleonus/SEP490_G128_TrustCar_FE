// Hàm thuần xử lý danh sách xe được chọn để so sánh (không đụng React, localStorage hay mạng).
// Ref: .sdd/features/vehicle-comparison/SPEC.md

import { COMPARE_ID_REGEX, MAX_COMPARE } from '../constants/compareConstants'

/** Một xe trong danh sách: { id, title, image, price } (image, price có thể null). */

/**
 * Id hợp lệ của BE (24 ký tự hex). Dữ liệu mẫu (id khác dạng) không so sánh được.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F05
 */
export const isCompareId = (id) => typeof id === 'string' && COMPARE_ID_REGEX.test(id)

/** Id chuẩn hóa chữ thường, để so khớp không phân biệt hoa/thường. */
export const normalizeId = (id) => (typeof id === 'string' ? id.toLowerCase() : '')

const textOf = (value, nestedKey) => {
  if (typeof value === 'string') return value
  return value && typeof value[nestedKey] === 'string' ? value[nestedKey] : ''
}

const imageOf = (images) => {
  if (!Array.isArray(images) || images.length === 0) return null
  const chosen = images.find((item) => item && typeof item === 'object' && item.isPrimary) ?? images[0]
  const url = typeof chosen === 'string' ? chosen : chosen?.url
  return typeof url === 'string' && url ? url : null
}

const priceOf = (car) => {
  const price = car.price ?? car.listedPrice ?? car.listed_price
  return typeof price === 'number' && Number.isFinite(price) ? price : null
}

/**
 * Chuyển một xe từ danh sách/chi tiết (dạng BE camelCase hoặc dữ liệu mẫu) thành mục để lưu.
 * Trả null nếu xe không có id hợp lệ.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F05
 */
export function toCompareItem(car) {
  const rawId = car?._id ?? car?.id
  if (!isCompareId(rawId)) return null

  const title = [textOf(car.brand, 'brand_name') || car.make, textOf(car.model, 'model_name'), car.variant]
    .filter((part) => typeof part === 'string' && part)
    .join(' ')

  return { id: normalizeId(rawId), title: title || 'Xe', image: imageOf(car.images), price: priceOf(car) }
}

/**
 * Làm sạch dữ liệu đọc từ localStorage: bỏ mục sai dạng, trùng, vượt giới hạn.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F01
 */
export function sanitizeStored(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const items = []
  for (const entry of value) {
    if (!entry || !isCompareId(entry.id)) continue
    const id = normalizeId(entry.id)
    if (seen.has(id)) continue
    seen.add(id)
    items.push({
      id,
      title: typeof entry.title === 'string' && entry.title ? entry.title : 'Xe',
      image: typeof entry.image === 'string' && entry.image ? entry.image : null,
      price: typeof entry.price === 'number' && Number.isFinite(entry.price) ? entry.price : null,
    })
    if (items.length === MAX_COMPARE) break
  }
  return items
}

export const hasItem = (items, id) => items.some((item) => item.id === normalizeId(id))

/**
 * Thêm một xe. Trả { items, status } với status: 'added' | 'duplicate' | 'full' | 'invalid'.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F02
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F04
 */
export function addItem(items, item) {
  if (!item || !isCompareId(item.id)) return { items, status: 'invalid' }
  if (hasItem(items, item.id)) return { items, status: 'duplicate' }
  if (items.length >= MAX_COMPARE) return { items, status: 'full' }
  return { items: [...items, { ...item, id: normalizeId(item.id) }], status: 'added' }
}

/**
 * Bỏ một xe khỏi danh sách.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F03
 */
export const removeItem = (items, id) => items.filter((item) => item.id !== normalizeId(id))

/**
 * Bỏ nhiều xe cùng lúc (xe không còn bán).
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F14
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F15
 */
export function pruneIds(items, ids) {
  const drop = new Set((Array.isArray(ids) ? ids : []).map(normalizeId))
  return items.filter((item) => !drop.has(item.id))
}
