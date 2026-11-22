import api from '../../../services/api'

// Gọi API dịch vụ showroom (KAN-96 BE). Dùng axios `api` nên tự gắn Bearer token.
// Không bắt lỗi: lỗi axios được ném lên cho hook/component phân loại.

/** Bỏ khóa rỗng/undefined để không gửi tham số thừa (BE từ chối tham số lạ hoặc rỗng). */
const clean = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
)

const listOf = (response) => ({ items: response.data.data ?? [], meta: response.data.meta ?? null })

// ── Public ────────────────────────────────────────────────────────────────

/** 6 gói dịch vụ đang ACTIVE (unauth). */
export async function fetchPublicServices(signal) {
  const response = await api.get('/public/services', { signal })
  return response.data.data ?? []
}

// ── Customer booking ──────────────────────────────────────────────────────

/** Lưới khung giờ cho dịch vụ trong [from, to] (YYYY-MM-DD, giờ VN, tối đa 14 ngày). */
export async function fetchServiceSlots({ from, to }, signal) {
  const response = await api.get('/customer/appointments/service/slots', {
    params: clean({ from, to }), signal,
  })
  return response.data.data
}

/** Đặt một lịch dịch vụ. `scheduledAt` là chuỗi `start` của khung (có +07:00). */
export async function createServiceAppointment({ serviceId, scheduledAt, serviceVehiclePlate, notes }) {
  const body = { serviceId, scheduledAt, serviceVehiclePlate }
  if (notes && notes.trim()) body.notes = notes.trim()
  const response = await api.post('/customer/appointments/service', body)
  return response.data.data
}

/** Lịch dịch vụ của chính khách, mới nhất trước. */
export async function fetchMyServiceAppointments(params, signal) {
  return listOf(await api.get('/customer/appointments/service', { params: clean(params), signal }))
}

/** Huỷ một lịch dịch vụ của chính khách. */
export async function cancelMyServiceAppointment(id, reason) {
  const body = reason && reason.trim() ? { reason: reason.trim() } : {}
  const response = await api.patch(`/customer/appointments/service/${id}/cancel`, body)
  return response.data.data
}

// ── Admin CRUD ────────────────────────────────────────────────────────────

export async function fetchAdminServices(params, signal) {
  return listOf(await api.get('/manage/services', { params: clean(params), signal }))
}

export async function fetchAdminService(id, signal) {
  const response = await api.get(`/manage/services/${id}`, { signal })
  return response.data.data
}

export async function createAdminService(payload) {
  const response = await api.post('/manage/services', payload)
  return response.data.data
}

export async function updateAdminService(id, payload) {
  const response = await api.put(`/manage/services/${id}`, payload)
  return response.data.data
}

export async function deactivateAdminService(id) {
  const response = await api.delete(`/manage/services/${id}`)
  return response.data.data
}
