/**
 * KAN-35 – Nạp dữ liệu cho trang Tổng quan điều hành.
 *
 * Dùng endpoint có thật, không mock:
 *  - GET /manage/cars?page=&limit=100   (car:read)  → mọi trạng thái, có price/status/soldAt/make
 *  - GET /leads?page=&limit=100         (ADMIN, SALES_STAFF)
 *
 * Phân trang: parsePagination của Backend giới hạn 100 xe/trang, nên phải tải lần lượt
 * từng trang. Có trần CAR_MAX_PAGES để một kho quá lớn không treo trình duyệt; khi chạm
 * trần, hook đánh dấu `partial` và UI cảnh báo số liệu chỉ tính trên phần đã tải.
 *
 * Leads là dữ liệu phụ (bảng hoạt động gần đây): nếu BE trả 404 vì route chưa có thì
 * trả mảng rỗng kèm cờ `leadsAvailable=false`, KHÔNG làm hỏng cả trang.
 */

import api from '../../../services/api'
import { CAR_MAX_PAGES, CAR_PAGE_LIMIT } from '../constants/dashboardConstants'

/** Tải toàn bộ xe quản trị, tối đa CAR_MAX_PAGES trang. */
async function fetchAllCars() {
  const cars = []
  let pages = 0
  let total = 0

  for (let page = 1; page <= CAR_MAX_PAGES; page += 1) {
    const { data } = await api.get('/manage/cars', {
      params: { page, limit: CAR_PAGE_LIMIT, sortBy: 'updatedAt', sortDir: 'desc' },
    })
    const items = Array.isArray(data?.data) ? data.data : []
    cars.push(...items)
    total = data?.meta?.total ?? cars.length
    pages = page
    const totalPages = data?.meta?.totalPages ?? 1
    if (page >= totalPages || items.length === 0) break
  }

  return { cars, total, pages, partial: pages >= CAR_MAX_PAGES && cars.length < total }
}

/** Lead mới nhất. Route chưa tồn tại → coi như không có dữ liệu phụ. */
async function fetchLeads() {
  try {
    const { data } = await api.get('/leads', {
      params: { page: 1, limit: CAR_PAGE_LIMIT },
    })
    return { leads: Array.isArray(data?.data) ? data.data : [], available: true }
  } catch (error) {
    const status = error?.response?.status
    // 404 = route chưa triển khai; 403 = vai trò không đọc lead. Cả hai không chặn dashboard.
    if (status === 404 || status === 403) return { leads: [], available: false }
    throw error
  }
}

/**
 * Nạp toàn bộ dữ liệu dashboard.
 * Xe là bắt buộc: lỗi ở đây làm cả trang báo lỗi. Lead là tuỳ chọn.
 */
export async function loadDashboardData() {
  const [carResult, leadResult] = await Promise.all([fetchAllCars(), fetchLeads()])
  return { ...carResult, ...leadResult }
}

export default loadDashboardData
