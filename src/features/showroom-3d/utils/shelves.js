import { carTitle, sortByCode } from './carSpecs'

// Hai kệ trưng bày ở sảnh (trái, phải). Người xem chọn xe cho từng kệ từ toàn bộ danh sách xe đang bán;
// chỉ xe có mô hình 3D mới lên kệ được.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05

export const SHELVES = [
  { key: 'left', label: 'Kệ trái' },
  { key: 'right', label: 'Kệ phải' },
]

/** Xe mặc định trên 2 kệ: 2 xe đầu tiên có mô hình (thiếu thì để trống). */
export function defaultShelves(modelCars = []) {
  return { left: modelCars[0] ?? null, right: modelCars[1] ?? null }
}

/**
 * Đặt `car` lên kệ `key`. Nếu xe đang ở kệ kia thì hai kệ đổi chỗ cho nhau (không để một xe ở 2 kệ).
 * Trả về object mới.
 */
export function placeOnShelf(shelves, key, car) {
  const other = key === 'left' ? 'right' : 'left'
  const next = { ...shelves, [key]: car }
  if (car && shelves[other]?.vehicleCode === car.vehicleCode) next[other] = shelves[key] ?? null
  return next
}

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/**
 * Danh sách cho bảng "Chọn xe": mọi xe đang bán theo mã, đánh dấu có mô hình 3D, lọc theo từ khóa
 * (tên, mã xe; không phân biệt dấu). `only3d` = chỉ xe có mô hình.
 */
export function pickerList(cars, modelCodes, query = '', only3d = false) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const matches = (car) => {
    const text = fold(`${carTitle(car)} ${car.vehicleCode} ${car.year ?? ''}`)
    return words.every((w) => text.includes(w)) // mọi từ gõ vào đều phải có
  }
  return sortByCode(cars)
    .map((c) => ({ car: c, has3d: modelCodes.has(c.vehicleCode) }))
    .filter((x) => (!only3d || x.has3d) && matches(x.car))
}
