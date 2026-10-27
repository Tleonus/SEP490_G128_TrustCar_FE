import api from './api'
import { MOCK_CARS } from '../mock/cars'

const USE_MOCK_FALLBACK = true

function warnFallback(context, error) {
  console.warn(
    `[carService] Không gọi được Backend (${context}), đang dùng dữ liệu mẫu để hiển thị UI. Chi tiết:`,
    error?.message || error
  )
}

function filterMockCars(params = {}) {
  let result = [...MOCK_CARS]
  const { keyword, brand, bodyType, yearFrom, yearTo, priceFrom, priceTo, sortBy } = params

  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter((c) =>
      `${c.brand} ${c.model}`.toLowerCase().includes(kw)
    )
  }
  if (brand) result = result.filter((c) => c.brand === brand)
  if (bodyType) result = result.filter((c) => c.bodyType === bodyType)
  if (yearFrom) result = result.filter((c) => c.year >= Number(yearFrom))
  if (yearTo) result = result.filter((c) => c.year <= Number(yearTo))
  if (priceFrom) result = result.filter((c) => c.price >= Number(priceFrom))
  if (priceTo) result = result.filter((c) => c.price <= Number(priceTo))

  if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price)
  if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price)
  if (sortBy === 'year_asc') result.sort((a, b) => a.year - b.year)
  if (sortBy === 'year_desc') result.sort((a, b) => b.year - a.year)

  return result
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars?keyword=&brand=&bodyType=&yearFrom=&yearTo=&priceFrom=&priceTo=&sortBy=&page=&pageSize=
// Kỳ vọng response: { items: Car[], total: number, page: number, pageSize: number }
export async function getCars(params = {}) {
  try {
    const { data } = await api.get('/cars', { params })
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getCars', error)
    const filtered = filterMockCars(params)
    const page = Number(params.page) || 1
    const pageSize = Number(params.pageSize) || 9
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return { items, total: filtered.length, page, pageSize, isMockData: true }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars/:id -> Car
export async function getCarById(id) {
  try {
    const { data } = await api.get(`/cars/${id}`)
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getCarById', error)
    const car = MOCK_CARS.find((c) => c.id === String(id))
    if (!car) {
      const notFoundError = new Error('Không tìm thấy xe', { cause: error })
      notFoundError.status = 404
      throw notFoundError
    }
    return { ...car, isMockData: true }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /cars/:id/similar -> Car[]
export async function getSimilarCars(id, limit = 4) {
  try {
    const { data } = await api.get(`/cars/${id}/similar`, { params: { limit } })
    return data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getSimilarCars', error)
    const current = MOCK_CARS.find((c) => c.id === String(id))
    const similar = MOCK_CARS.filter(
      (c) => c.id !== String(id) && (!current || c.brand === current.brand || c.bodyType === current.bodyType)
    ).slice(0, limit)
    return { items: similar, isMockData: true }
  }
}

// GET /public/cars/featured?limit= -> { success: true, data: Car[] }
export async function getFeaturedCars(limit = 8) {
  try {
    const { data } = await api.get('/public/cars/featured', { params: { limit } })
    // Backend trả về { success: true, data: [...] }
    return data?.data ?? data
  } catch (error) {
    if (!USE_MOCK_FALLBACK) throw error
    warnFallback('getFeaturedCars', error)
    return { items: MOCK_CARS.slice(0, limit), isMockData: true }
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// POST /leads { carId, name, phone, message } -> { success: boolean }
export async function sendContactRequest(payload) {
  const { data } = await api.post('/leads', payload)
  return data
}
