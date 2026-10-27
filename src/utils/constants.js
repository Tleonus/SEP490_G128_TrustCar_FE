// Giá trị enum theo ERD (Car.fuel_type, Car.transmission, Car Model.body_type, Car.status).
// ERD chỉ ghi kiểu "enum", chưa liệt kê giá trị -> CẦN BACKEND XÁC NHẬN.
// fuel_type / transmission dùng chung giá trị với form nhập xe (features/vehicle-intake).
export const FUEL_TYPE_LABEL = {
  gasoline: 'Xăng',
  diesel: 'Dầu diesel',
  hybrid: 'Hybrid',
  electric: 'Điện',
}

export const TRANSMISSION_LABEL = {
  automatic: 'Số tự động',
  manual: 'Số sàn',
  cvt: 'CVT',
  hybrid: 'e-CVT / Hybrid',
}

export const BODY_TYPE_LABEL = {
  sedan: 'Sedan',
  suv: 'SUV',
  hatchback: 'Hatchback',
  pickup: 'Bán tải',
  mpv: 'MPV',
}

export const CAR_STATUS = {
  AVAILABLE: 'available',
}

export const ACTIVE_STATUS = 'active'

export function labelOf(map, value) {
  return map[value] || value || 'Đang cập nhật'
}

export function toOptions(map) {
  return Object.entries(map).map(([value, label]) => ({ value, label }))
}

export const PRICE_RANGES = [
  { label: 'Dưới 500 triệu', min: 0, max: 500000000 },
  { label: '500 triệu - 1 tỷ', min: 500000000, max: 1000000000 },
  { label: '1 - 1.5 tỷ', min: 1000000000, max: 1500000000 },
  { label: 'Trên 1.5 tỷ', min: 1500000000, max: null },
]

export const MILEAGE_OPTIONS = [
  { value: 20000, label: 'Dưới 20.000 km' },
  { value: 50000, label: 'Dưới 50.000 km' },
  { value: 100000, label: 'Dưới 100.000 km' },
]

const CURRENT_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2009 }, (_, i) => CURRENT_YEAR - i)

export const SORT_OPTIONS = [
  { value: '', label: 'Mới đăng' },
  { value: 'listed_price_asc', label: 'Giá tăng dần' },
  { value: 'listed_price_desc', label: 'Giá giảm dần' },
  { value: 'manufacturing_year_desc', label: 'Năm sản xuất mới nhất' },
  { value: 'manufacturing_year_asc', label: 'Năm sản xuất cũ nhất' },
  { value: 'mileage_km_asc', label: 'Ít km nhất' },
]

export const PAGE_SIZE = 9
