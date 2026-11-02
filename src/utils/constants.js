// Giá trị enum khớp với backend thật (TrustCar-BE-Develop/src/constants/appConstants.js).
// Backend dùng chữ HOA cho mọi enum (FuelType, Transmission, BodyType, CarStatus).
export const FUEL_TYPE_LABEL = {
  GASOLINE: 'Xăng',
  DIESEL: 'Dầu diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Điện',
  LPG: 'LPG',
}

export const TRANSMISSION_LABEL = {
  AUTOMATIC: 'Số tự động',
  MANUAL: 'Số sàn',
  CVT: 'CVT',
  DCT: 'DCT',
}

export const BODY_TYPE_LABEL = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  PICKUP: 'Bán tải',
  VAN: 'Van',
  COUPE: 'Coupe',
  CONVERTIBLE: 'Convertible',
  WAGON: 'Wagon',
  MPV: 'MPV',
  MINIVAN: 'Minivan',
}

export function labelOf(map, value) {
  return map[value] || value || 'Đang cập nhật'
}

// Trạng thái xe (CarStatus) khớp backend thật (TrustCar-BE-Develop/src/constants/appConstants.js).
// Dùng cho khu vực quản trị (/admin) - nơi hiển thị TẤT CẢ trạng thái, không chỉ AVAILABLE.
export const CAR_STATUS_LABEL = {
  INCOMING: 'Mới nhập',
  MAINTENANCE: 'Đang bảo dưỡng',
  AVAILABLE: 'Đang bán',
  RESERVED: 'Đã đặt cọc',
  SOLD: 'Đã bán',
  DELISTED: 'Đã gỡ',
}

export const CAR_STATUS_COLOR = {
  INCOMING: 'blue',
  MAINTENANCE: 'orange',
  AVAILABLE: 'green',
  RESERVED: 'gold',
  SOLD: 'default',
  DELISTED: 'red',
}

// Tình trạng tồn kho (agingCategory) - lấy trực tiếp từ field agingCategory do backend
// trả về trên mỗi xe (Car.agingCategory, xem src/models/Car.js), KHÔNG tự tính lại ở FE.
export const AGING_LABEL = {
  FRESH: 'Mới nhập',
  SLOW: 'Tồn chậm',
  STAGNANT: 'Tồn lâu',
}

export const AGING_COLOR = {
  FRESH: 'green',
  SLOW: 'orange',
  STAGNANT: 'red',
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

// sortBy khớp whitelist backend: price | year | mileage | createdAt; sortDir: asc | desc
export const SORT_OPTIONS = [
  { value: '', label: 'Mới đăng' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'year_desc', label: 'Năm sản xuất mới nhất' },
  { value: 'year_asc', label: 'Năm sản xuất cũ nhất' },
  { value: 'mileage_asc', label: 'Ít km nhất' },
]

export function parseSortOption(value) {
  if (!value) return {}
  const [sortBy, sortDir] = value.split('_')
  return { sortBy, sortDir }
}

export const PAGE_SIZE = 9

// sortBy cho /manage/cars (SCR-M03): route này KHÔNG có whitelist bằng Joi ở backend,
// nên FE tự giới hạn chỉ các field chắc chắn tồn tại và hợp lý để sắp xếp.
export const ADMIN_SORT_OPTIONS = [
  { value: '', label: 'Mới nhập trước' },
  { value: 'listedDate_desc', label: 'Ngày nhập kho mới nhất' },
  { value: 'listedDate_asc', label: 'Ngày nhập kho cũ nhất' },
  { value: 'daysInStock_desc', label: 'Tồn kho lâu nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

export const ADMIN_PAGE_SIZE = 10
