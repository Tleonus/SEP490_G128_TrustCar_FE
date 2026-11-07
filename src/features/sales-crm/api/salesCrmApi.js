import api from '../../../services/api'

// Endpoint dùng cho Quản lý bán hàng (KAN-18). Đường dẫn tương đối theo API_BASE_URL (/api/v1).
//
// Đã có ở BE (TrustCar-BE-Develop):
//  - GET   /manage/cars, /manage/cars/:id      quyền car:read (ADMIN, SALES_STAFF)
//  - PATCH /manage/cars/:id/status             quyền car:status_change, body { status, reason? }
//    State machine GBR-05: AVAILABLE → RESERVED → SOLD (không cho AVAILABLE → SOLD trực tiếp).
//
// Chưa có ở BE (model Lead / Appointment / SaleRecord đã có, route chưa có). FE gọi theo hợp đồng dưới đây;
// khi BE trả 404 "Route ... not found" thì repository chuyển sang chế độ dự phòng:
//  - GET  /manage/leads?limit=100                   → { data: Lead[] }  (customer, car đã populate)
//  - GET  /manage/appointments?status=COMPLETED     → { data: Appointment[] } (customer, car đã populate)
//  - POST /orders/checkout                          → { data: { saleRecord, car } }
//    body: xem buildCheckoutPayload (utils/checkoutValidation.js)

// parsePagination của BE giới hạn limit tối đa 100.
const PAGE_LIMIT = 100

/**
 * Endpoint chưa được BE khai báo: notFoundHandler trả 404 với message "Route <METHOD> <url> not found.".
 * Phân biệt với 404 nghiệp vụ (ví dụ không tìm thấy xe) để không chuyển nhầm sang chế độ dự phòng.
 */
export function isRouteMissing(error) {
  const status = error?.response?.status
  if (status === 501) return true
  if (status !== 404) return false
  return /^Route\s.+\snot found/i.test(error?.response?.data?.message ?? '')
}

/** Toàn bộ xe đang hoạt động ở mọi trạng thái, tải lần lượt từng trang 100 xe. */
export async function listAllManagedCars() {
  const cars = []
  for (let page = 1; ; page += 1) {
    const { data } = await api.get('/manage/cars', {
      params: { page, limit: PAGE_LIMIT, sortBy: 'listedDate', sortDir: 'desc' },
    })
    cars.push(...(data?.data ?? []))
    const totalPages = data?.meta?.totalPages ?? 1
    if (page >= totalPages) return cars
  }
}

export async function getManagedCar(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  return data?.data
}

export async function updateCarStatus(carId, status, reason) {
  const body = reason ? { status, reason } : { status }
  const { data } = await api.patch(`/manage/cars/${encodeURIComponent(carId)}/status`, body)
  return data?.data
}

export async function listLeads() {
  const { data } = await api.get('/manage/leads', { params: { page: 1, limit: PAGE_LIMIT } })
  return data?.data ?? []
}

export async function listCompletedAppointments() {
  const { data } = await api.get('/manage/appointments', {
    params: { page: 1, limit: PAGE_LIMIT, status: 'COMPLETED' },
  })
  return data?.data ?? []
}

export async function checkoutOrder(payload) {
  const { data } = await api.post('/orders/checkout', payload)
  return data?.data
}
