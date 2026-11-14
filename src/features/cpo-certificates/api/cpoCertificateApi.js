import api from '../../../services/api'

// Endpoint BE:
//  - GET /manage/cars, /manage/cars/:id       (đăng nhập + quyền car:read; ADMIN, SALES_STAFF)
//  - GET /public/cars/:id/inspection-report   (công khai; 404 nếu xe không APPROVED_CPO/AVAILABLE)

// parsePagination của BE giới hạn limit tối đa 100.
const MANAGED_CARS_PAGE_LIMIT = 100

/**
 * Chỉ lấy các trường xe cần cho chứng nhận; VIN, số máy, ghi chú nội bộ... bị bỏ ngay tại đây.
 * @param {string} carId
 * @returns {Promise<{ carId: string, vehicleCode: string|null, carStatus: string, certificateId: string|null, vehicle: object }>}
 */
export async function getManagedCarSummary(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  const car = data?.data ?? {}
  return {
    carId: car._id ?? carId,
    vehicleCode: car.vehicleCode ?? null,
    carStatus: car.status,
    certificateId: car.cpoCertificateId ?? null,
    vehicle: { make: car.make ?? null, model: car.model ?? null, year: car.year ?? null },
  }
}

/**
 * Báo cáo kiểm định công khai (đã lọc allow-list ở BE).
 * @param {string} carId  ObjectId hoặc mã xe.
 * @returns {Promise<import('../constants/cpoCertificateConstants').PublicInspectionReport>}
 */
export async function getPublicInspectionReport(carId) {
  const { data } = await api.get(`/public/cars/${encodeURIComponent(carId)}/inspection-report`)
  return data?.data
}

/**
 * Toàn bộ xe đang hoạt động ở mọi trạng thái (khu quản trị), tải lần lượt từng trang 100 xe.
 * BE chưa có API liệt kê chứng nhận nên FE lọc xe có cpoCertificateId từ danh sách này.
 * @returns {Promise<object[]>}
 */
export async function listAllManagedCars() {
  const cars = []
  for (let page = 1; ; page += 1) {
    const { data } = await api.get('/manage/cars', {
      params: { page, limit: MANAGED_CARS_PAGE_LIMIT, sortBy: 'createdAt', sortDir: 'desc' },
    })
    cars.push(...(data?.data ?? []))
    const totalPages = data?.meta?.totalPages ?? 1
    if (page >= totalPages) return cars
  }
}
