import api from '../../../services/api'

/**
 * API quản lý nhân sự (KAN-93/KAN-94). Envelope backend: { success, message, data, meta? }.
 * Toàn bộ endpoint dưới đây chỉ ADMIN gọi được (requireAdmin ở userRoutes).
 */

/** GET /users – danh sách tài khoản nhân sự (phân trang + lọc). */
export async function fetchStaffUsers(params = {}, signal) {
  const { data } = await api.get('/users', { params, signal })
  return { items: data?.data ?? [], meta: data?.meta ?? null }
}

/** GET /users/roles – các role ADMIN được phép gán cho nhân sự (đã loại CUSTOMER). */
export async function fetchAssignableRoles(signal) {
  const { data } = await api.get('/users/roles', { signal })
  return data?.data ?? []
}

/** GET /users/:id */
export async function fetchStaffUser(id, signal) {
  const { data } = await api.get(`/users/${encodeURIComponent(id)}`, { signal })
  return data?.data
}

/**
 * PUT /users/:id/roles – thay toàn bộ tập role của một nhân sự.
 * Phần tử đầu tiên trong roleIds trở thành role chính (hiển thị + JWT legacy).
 */
export async function updateUserRoles(id, roleIds) {
  const { data } = await api.put(`/users/${encodeURIComponent(id)}/roles`, { roleIds })
  return data?.data
}

/** POST /users – tạo tài khoản nhân sự. */
export async function createStaffUser(payload) {
  const { data } = await api.post('/users', payload)
  return data?.data
}

/** PATCH /users/:id/deactivate */
export async function deactivateStaffUser(id) {
  const { data } = await api.patch(`/users/${encodeURIComponent(id)}/deactivate`)
  return data?.data
}

/** PATCH /users/:id/activate */
export async function activateStaffUser(id) {
  const { data } = await api.patch(`/users/${encodeURIComponent(id)}/activate`)
  return data?.data
}
