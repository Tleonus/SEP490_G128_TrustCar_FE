import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL } from '../../../utils/constants'
import { formatMileage } from '../../../utils/format'
import { getCarTitle, getCoverImage, sortCarImages } from '../../../utils/car'

const CODE = /^TC-\d{4}-\d{4}$/

const DRIVE_LABEL = { FWD: 'Cầu trước (FWD)', RWD: 'Cầu sau (RWD)', AWD: 'AWD', '4WD': '4WD' }

// Chiều dài mô hình khi đặt lên kệ (mét). DB chưa có kích thước xe nên dùng cỡ phổ biến theo kiểu dáng.
const LENGTH_BY_BODY = { SEDAN: 4.8, SUV: 4.85, HATCHBACK: 4.0, PICKUP: 5.3, MPV: 4.6, VAN: 5.0, COUPE: 4.6, WAGON: 4.8 }

const has = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
const num = (v, unit) => `${new Intl.NumberFormat('vi-VN').format(v)} ${unit}`

/** Mã xe hợp lệ để làm tên file mô hình (chặn ký tự lạ đi vào URL). */
export function isVehicleCode(code) {
  return typeof code === 'string' && CODE.test(code)
}

/** Đường dẫn mô hình 3D đã nén của một xe. */
export function carModelUrl(code) {
  return `/showroom-3d/cars/${code}.glb`
}

/** Xe theo thứ tự mã trong database (TC-2026-0001, 0002, ...). */
export function sortByCode(cars = []) {
  return [...cars].filter((c) => isVehicleCode(c?.vehicleCode)).sort((a, b) => a.vehicleCode.localeCompare(b.vehicleCode))
}

export function carLengthMeters(bodyType) {
  return LENGTH_BY_BODY[bodyType] ?? 4.6
}

export function carTitle(car) {
  return getCarTitle(car)
}

/**
 * Mọi ảnh của xe: ảnh trong thư mục xe (đã nén, `showroomPhotos`) trước, rồi ảnh trong database; bỏ trùng.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F07
 */
export function carPhotos(car) {
  const db = sortCarImages(car?.images).map((i) => i?.url).filter(Boolean)
  return [...new Set([...(car?.showroomPhotos ?? []), ...db])]
}

export function carCoverUrl(car) {
  return car?.showroomPhotos?.[0] ?? getCoverImage(car)?.url ?? null
}

/**
 * Các dòng thông số có dữ liệu (bỏ trống thì không hiện, không bịa).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F07
 */
export function buildSpecRows(car) {
  if (!car) return []
  const s = car.specifications ?? {}
  const rows = [
    ['Năm sản xuất', car.year],
    ['Số km đã đi', has(car.mileage) ? formatMileage(car.mileage) : null],
    ['Kiểu dáng', BODY_TYPE_LABEL[car.bodyType] ?? car.bodyType],
    ['Nhiên liệu', FUEL_TYPE_LABEL[car.fuelType] ?? car.fuelType],
    ['Hộp số', TRANSMISSION_LABEL[car.transmission] ?? car.transmission],
    ['Dẫn động', DRIVE_LABEL[car.driveType] ?? car.driveType],
    ['Động cơ', has(s.engineDisplacementCC) ? num(s.engineDisplacementCC, 'cc') : null],
    ['Công suất', has(s.horsePower) ? num(s.horsePower, 'mã lực') : null],
    ['Mô-men xoắn', has(s.torqueNm) ? num(s.torqueNm, 'Nm') : null],
    ['Số chỗ', s.numberOfSeats],
    ['Màu ngoại thất', s.color],
    ['Màu nội thất', s.interiorColor],
    ['Xuất xứ', s.originCountry],
  ]
  return rows.filter(([, v]) => has(v)).map(([label, value]) => ({ label, value: String(value) }))
}
