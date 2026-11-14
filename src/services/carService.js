import api from './api'

// Backend thật (TrustCar-BE-Develop): /api/v1/public/cars/*
// Car trả về dạng flat, enum chữ HOA: make, model, variant, year, bodyType,
// fuelType, transmission, driveType, mileage, price, images[].url, vehicleCode...
// Response envelope: sendPaginated -> { success, message, data: Car[], meta: { page, limit, total, totalPages, hasNext, hasPrev } }
//                     sendSuccess   -> { success, message, data }

function unwrapList(data) {
  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    page: data?.meta?.page ?? 1,
    limit: data?.meta?.limit ?? 9,
  }
}

// GET /public/cars?page=&limit=&make=&model=&bodyType=&fuelType=&transmission=
//                  &priceMin=&priceMax=&yearMin=&yearMax=&mileageMax=&search=&sortBy=&sortDir=
// Chỉ trả xe status = AVAILABLE, isActive = true (GBR-11, backend tự enforce).
export async function getCars(params = {}) {
  const { data } = await api.get('/public/cars', { params })
  return unwrapList(data)
}

// GET /public/cars/:id -> id là ObjectId hoặc vehicleCode
export async function getCarByStockCode(stockCode) {
  const { data } = await api.get(`/public/cars/${encodeURIComponent(stockCode)}`)
  return data?.data
}

// Không có endpoint "similar" riêng trên backend -> lấy xe cùng hãng (make) qua /public/cars.
export async function getSimilarCars(make, excludeId, limit = 4) {
  if (!make) return { items: [] }
  const { items } = await getCars({ make, limit: limit + 1 })
  return { items: items.filter((c) => c._id !== excludeId && c.vehicleCode !== excludeId).slice(0, limit) }
}

// GET /public/cars/featured?limit= -> { success: true, data: Car[] }
export async function getFeaturedCars(limit = 8) {
  const { data } = await api.get('/public/cars/featured', { params: { limit } })
  return { items: data?.data ?? [] }
}

// --- CẦN BACKEND XÁC NHẬN: endpoint /leads chưa thấy trong routes hiện tại ---
export async function sendContactRequest(payload) {
  const { data } = await api.post('/leads', payload)
  return data
}
