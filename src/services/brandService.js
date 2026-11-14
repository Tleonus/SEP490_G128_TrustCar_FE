import api from './api'
import toyota from '../assets/brands/toyota.svg'
import ford from '../assets/brands/ford.svg'
import hyundai from '../assets/brands/hyundai.svg'
import peugeot from '../assets/brands/peugeot.svg'
import vinfast from '../assets/brands/vinfast.svg'
import mercedes from '../assets/brands/mercedes.svg'
import kia from '../assets/brands/kia.svg'
import mazda from '../assets/brands/mazda.svg'

// Logo chỉ là asset hiển thị, không phải dữ liệu mẫu để test.
// Backend chỉ trả về tên hãng (make, dạng chuỗi), không có logo -> map tại FE theo tên.
const BRAND_LOGOS = {
  TOYOTA: toyota,
  FORD: ford,
  HYUNDAI: hyundai,
  PEUGEOT: peugeot,
  VINFAST: vinfast,
  'MERCEDES-BENZ': mercedes,
  MERCEDES: mercedes,
  KIA: kia,
  MAZDA: mazda,
}

function toTitleCase(make) {
  return make
    .split(' ')
    .map((w) => (w ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ')
}

// GET /public/cars/filters -> { success: true, data: { brands: string[], bodyTypes, fuelTypes, transmissions, priceRange, yearRange } }
// brands là danh sách make (chữ HOA) thực tế có trong DB (chỉ tính xe AVAILABLE).
export async function getBrands() {
  const { data } = await api.get('/public/cars/filters')
  const brands = data?.data?.brands ?? []
  return brands.map((make) => ({
    value: make,
    label: toTitleCase(make),
    logo: BRAND_LOGOS[make] || null,
  }))
}

export async function getFilterOptions() {
  const { data } = await api.get('/public/cars/filters')
  return data?.data ?? {}
}
