/**
 * KAN-56 – Lớp gọi API cho bảng điều khiển duyệt của Admin.
 *
 * Endpoint có thật trên Backend (đã đối chiếu routes/inspectionRoutes.js và carRoutes.js):
 *  - GET /manage/cars?status=...          danh sách xe theo trạng thái (car:read)
 *  - GET /manage/cars/:id                 chi tiết xe (ảnh, ODO, thông số)
 *  - PUT /inspections/cars/:id/approve-sale   duyệt mở bán (ADMIN, APPROVED_CPO → AVAILABLE)
 *
 * Endpoint ticket yêu cầu nhưng Backend CHƯA có (không gọi, không giả lập):
 *  - PUT /inspections/:id/approve
 *  - PUT /inspections/:id/reject
 *  - API lấy biên bản kiểm định theo carId (GET /inspections/:id cần đúng id biên bản,
 *    mà xe không lưu id đó nên không thể xem 5 tiêu chí từ màn này).
 */

import api from '../../../services/api'

function unwrapList(data) {
  return {
    items: data?.data ?? [],
    meta: data?.meta ?? null,
  }
}

/** Danh sách xe theo một trạng thái, có phân trang và tìm kiếm. */
export async function listCarsByStatus({ status, search, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams()
  params.append('status', status)
  if (search) params.append('search', search)
  params.append('page', String(page))
  params.append('limit', String(limit))
  params.append('sortBy', 'updatedAt')
  params.append('sortDir', 'desc')

  const { data } = await api.get(`/manage/cars?${params.toString()}`)
  return unwrapList(data)
}

/** Chi tiết một xe (dùng cho Drawer). */
export async function getCarDetail(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  return data?.data ?? null
}

/**
 * Duyệt mở bán: APPROVED_CPO → AVAILABLE.
 * Backend tự ghi listedDate nếu xe chưa có. Chỉ ADMIN gọi được (403 với role khác).
 * @returns {object} xe sau khi cập nhật
 */
export async function approveSale(carId) {
  const { data } = await api.put(`/inspections/cars/${encodeURIComponent(carId)}/approve-sale`)
  return data?.data ?? null
}
