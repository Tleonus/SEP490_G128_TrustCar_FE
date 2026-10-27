import api from './api'
import { MOCK_CARS } from '../mock/cars'
import { CAR_MODELS } from '../mock/carModels'
import { BRANDS } from '../mock/brands'
import { CAR_STATUS } from '../utils/constants'

const USE_MOCK_FALLBACK = true

function warnFallback(context, error) {
  console.warn(
    `[carService] Không gọi được Backend (${context}), đang dùng dữ liệu mẫu để hiển thị UI. Chi tiết:`,
    error?.message || error,
  )
}

// Backend được kỳ vọng populate sẵn model + brand + images cho mỗi Car (xem ghi chú endpoint bên dưới).
function withRelations(car) {
  const model = CAR_MODELS.find((m) => m.model_id === car.model_id) || null
  const brand = model ? BRANDS.find((b) => b.brand_id === model.brand_id) || null : null
  return { ...car, model, brand, isMockData: true }
}

const SORTERS = {
  listed_price_asc: (a, b) => a.listed_price - b.listed_price,
  listed_price_desc: (a, b) => b.listed_price - a.listed_price,
  manufacturing_year_asc: (a, b) => a.manufacturing_year - b.manufacturing_year,
  manufacturing_year_desc: (a, b) => b.manufacturing_year - a.manufacturing_year,
  mileage_km_asc: (a, b) => a.mileage_km - b.mileage_km,
}

function publicMockCars() {
  return MOCK_CARS.filter((c) => c.status === CAR_STATUS.AVAILABLE).map(withRelations)
}

function filterMockCars(params = {}) {
  const {
    keyword, brand_id, model_id, body_type, fuel_type, transmission,
    year_from, year_to, price_min, price_max, mileage_max, sort,
  } = params

  let result = publicMockCars()

  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter((c) =>
      [c.brand?.brand_name, c.model?.model_name, c.variant].join(' ').toLowerCase().includes(kw),
    )
  }
  if (brand_id) result = result.filter((c) => c.brand?.brand_id === brand_id)
  if (model_id) result = result.filter((c) => c.model_id === model_id)
  if (body_type) result = result.filter((c) => c.model?.body_type === body_type)
  if (fuel_type) result = result.filter((c) => c.fuel_type === fuel_type)
  if (transmission) result = result.filter((c) => c.transmission === transmission)
  if (year_from) result = result.filter((c) => c.manufacturing_year >= Number(year_from))
  if (year_to) result = result.filter((c) => c.manufacturing_year <= Number(year_to))
  if (price_min) result = result.filter((c) => c.listed_price >= Number(price_min))
  if (price_max) result = result.filter((c) => c.listed_price <= Number(price_max))
  if (mileage_max) result = result.filter((c) => c.mileage_km <= Number(mileage_max))

  if (SORTERS[sort]) result.sort(SORTERS[sort])
  else result.sort((a, b) => (b.listed_date || '').localeCompare(a.listed_date || ''))

  return result
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars?keyword=&brand_id=&model_id=&body_type=&fuel_type=&transmission=
//          &year_from=&year_to=&price_min=&price_max=&mileage_max=&sort=&page=&page_size=
// Chỉ trả xe status = available, KHÔNG trả floor_price / original_price / aging_category / inventory_type.
// Response: { items: Car[], total, page, page_size }
// Car = các cột bảng Car + model: CarModel + brand: Brand + images: CarImage[]
export async function getCars(params = {}) {
  try {
    const { data } = await api.get('/cars', { params })
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getCars', error)
    const filtered = filterMockCars(params)
    const page = Number(params.page) || 1
    const pageSize = Number(params.page_size) || 9
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
      isMockData: true,
    }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars/:stock_code -> Car (cùng cấu trúc như trên)
export async function getCarByStockCode(stockCode) {
  try {
    const { data } = await api.get(`/cars/${encodeURIComponent(stockCode)}`)
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getCarByStockCode', error)
    const car = publicMockCars().find((c) => c.stock_code === stockCode)
    if (!car) {
      const notFoundError = new Error('Không tìm thấy xe', { cause: error })
      notFoundError.status = 404
      throw notFoundError
    }
    return car
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars/:stock_code/similar?limit= -> { items: Car[] }
export async function getSimilarCars(stockCode, limit = 4) {
  try {
    const { data } = await api.get(`/cars/${encodeURIComponent(stockCode)}/similar`, { params: { limit } })
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getSimilarCars', error)
    const all = publicMockCars()
    const current = all.find((c) => c.stock_code === stockCode)
    const items = all
      .filter(
        (c) =>
          c.stock_code !== stockCode &&
          (!current ||
            c.brand?.brand_id === current.brand?.brand_id ||
            c.model?.body_type === current.model?.body_type),
      )
      .slice(0, limit)
    return { items, isMockData: true }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars?is_featured=true&limit= -> { items: Car[] }
export async function getFeaturedCars(limit = 8) {
  try {
    const { data } = await api.get('/cars', { params: { is_featured: true, page_size: limit } })
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getFeaturedCars', error)
    return {
      items: publicMockCars().filter((c) => c.is_featured).slice(0, limit),
      isMockData: true,
    }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// POST /leads { stock_code?, full_name, phone_number, email?, request_content? }
// Map theo bảng Lead (request_content) + Lead Vehicle Interest (stock_code). Backend tự tạo lead_code.
export async function sendContactRequest(payload) {
  const { data } = await api.post('/leads', payload)
  return data
}
