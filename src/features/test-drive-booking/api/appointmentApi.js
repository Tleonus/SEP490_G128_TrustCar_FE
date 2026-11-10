import api from '../../../services/api'

// Gọi API đặt lịch lái thử (BE: API-TEST-DRIVE-BOOKING v1.1.0). Dùng axios `api` nên tự gắn Bearer token.
// Không bắt lỗi: lỗi axios được ném lên cho hook/component phân loại bằng classifyAppointmentError.
// Không tự thử lại các lệnh ghi (NFR-F04).

/** Bỏ khóa rỗng/undefined để không gửi tham số thừa (BE từ chối tham số lạ hoặc rỗng). */
const clean = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
)

const listOf = (response) => ({ items: response.data.data ?? [], meta: response.data.meta ?? null })

/**
 * Khung giờ còn trống của các xe đã chọn trong [from, to] (YYYY-MM-DD, giờ VN, tối đa 14 ngày).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F03
 * @returns {Promise<{ days: Array<{ date: string, slots: object[] }> }>}
 */
export async function fetchSlots({ carIds, from, to, excludeVisitId }, signal) {
  const response = await api.get('/customer/appointments/slots', {
    params: clean({ carIds: carIds.join(','), from, to, excludeVisitId }),
    signal,
  })
  return response.data.data
}

/**
 * Đặt một lượt 1–3 xe. `scheduledAt` là đúng chuỗi `start` của khung (có +07:00).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @returns {Promise<object>} lượt vừa tạo (visit)
 */
export async function createVisit({ carIds, scheduledAt, notes }) {
  const body = { carIds, scheduledAt }
  if (notes && notes.trim()) body.notes = notes.trim()
  const response = await api.post('/customer/appointments', body)
  return response.data.data.visit
}

/** @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F08 */
export async function fetchMyVisits(params, signal) {
  return listOf(await api.get('/customer/appointments', { params: clean(params), signal }))
}

/**
 * Hủy cả lượt; `id` là id của bất kỳ lịch nào trong lượt (dùng visitId).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F11
 */
export async function cancelMyVisit(id, reason) {
  const body = reason && reason.trim() ? { reason: reason.trim() } : {}
  const response = await api.patch(`/customer/appointments/${id}/cancel`, body)
  return response.data.data.visit
}

/** @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13 */
export async function fetchStaffVisits(params, signal) {
  return listOf(await api.get('/appointments', { params: clean(params), signal }))
}

/**
 * Nhân viên đổi trạng thái cả lượt: CONFIRMED | CANCELLED (BE 1.1.0: `reasonCode` + ghi chú `reason` tùy chọn)
 * | COMPLETED | NO_SHOW (outcome tùy chọn).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F16
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F31
 */
export async function changeVisitStatus(id, { status, reason, reasonCode, outcome }) {
  const body = { status }
  if (reasonCode) body.reasonCode = reasonCode
  if (reason && reason.trim()) body.reason = reason.trim()
  if (outcome && outcome.trim()) body.outcome = outcome.trim()
  const response = await api.patch(`/appointments/${id}/status`, body)
  return response.data.data.visit
}

// ---- 1.1.0 (API-TEST-DRIVE-BOOKING 1.1.0) ----

/**
 * Khách đổi lịch cả lượt sang khung khác (xe giữ nguyên). Lượt trả về có `visitId`/`visitCode` MỚI.
 * `scheduledAt` là đúng chuỗi `start` của khung.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F27
 * @returns {Promise<{ visit: object, previousVisitCode: string }>}
 */
export async function rescheduleMyVisit(id, scheduledAt) {
  const response = await api.patch(`/customer/appointments/${id}/reschedule`, { scheduledAt })
  return response.data.data
}

/**
 * Lưới khung của nhân viên (có chỗ còn lại và khách đang đặt). `carIds` và `excludeVisitId` tùy chọn.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 * @returns {Promise<{ days: Array<{ date: string, slots: object[] }> }>}
 */
export async function fetchStaffSlots({ from, to, carIds, excludeVisitId }, signal) {
  const response = await api.get('/appointments/slots', {
    params: clean({ from, to, carIds: carIds?.length ? carIds.join(',') : undefined, excludeVisitId }),
    signal,
  })
  return response.data.data
}

/**
 * Nhân viên đổi lịch hộ khách: giữ nguyên trạng thái, không giới hạn 12 giờ / số lần.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @returns {Promise<{ visit: object, previousVisitCode: string }>}
 */
export async function rescheduleVisitAsStaff(id, scheduledAt) {
  const response = await api.patch(`/appointments/${id}/reschedule`, { scheduledAt })
  return response.data.data
}

/**
 * Tìm khách có tài khoản theo tên/SĐT/email (≤ 10 kết quả).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 * @returns {Promise<Array<{ _id: string, fullName: string, phone: string, email: string }>>}
 */
export async function searchCustomers(q, signal) {
  const response = await api.get('/appointments/customers', { params: { q: String(q).trim() }, signal })
  return response.data.data?.customers ?? []
}

/**
 * Nhân viên đặt hộ khách: lượt tạo ra đã `CONFIRMED`.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @returns {Promise<object>} lượt vừa tạo
 */
export async function createVisitForCustomer({ customerId, carIds, scheduledAt, notes }) {
  const body = { customerId, carIds, scheduledAt }
  if (notes && notes.trim()) body.notes = notes.trim()
  const response = await api.post('/appointments', body)
  return response.data.data.visit
}
