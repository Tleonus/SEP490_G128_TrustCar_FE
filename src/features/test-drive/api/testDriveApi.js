import api from '../../../services/api'

// Endpoint BE: /test-drives (bắt buộc đăng nhập) và /admin/base-settings, /public/base-settings.
// Giờ hẹn luôn đi kèm offset (ISO 8601), FE gửi lại nguyên giá trị startAt mà BE đã trả.

function unwrapList(data) {
  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    page: data?.meta?.page ?? 1,
    limit: data?.meta?.limit ?? 10,
    totalPages: data?.meta?.totalPages ?? 1,
  }
}

// ── Khách hàng ─────────────────────────────────────────────────────────────
export async function getCarSlots(carId, date) {
  const { data } = await api.get(`/test-drives/cars/${encodeURIComponent(carId)}/slots`, { params: { date } })
  return data?.data ?? []
}

export async function bookTestDrive({ carId, scheduledAt, notes }) {
  const { data } = await api.post('/test-drives', { carId, scheduledAt, notes: notes || undefined })
  return data?.data
}

export async function listMyTestDrives(params) {
  const { data } = await api.get('/test-drives/me', { params })
  return unwrapList(data)
}

export async function cancelMyTestDrive(id) {
  const { data } = await api.post(`/test-drives/${id}/cancel`)
  return data?.data
}

// ── Nhân viên ──────────────────────────────────────────────────────────────
export async function listTestDrives(params) {
  const { data } = await api.get('/test-drives', { params })
  return unwrapList(data)
}

const STAFF_ACTION_REQUESTS = {
  confirm: (id) => api.post(`/test-drives/${id}/confirm`),
  complete: (id, { outcome }) => api.post(`/test-drives/${id}/complete`, { outcome }),
  correct: (id, { outcome }) => api.post(`/test-drives/${id}/correct-no-show`, { outcome }),
  noShow: (id) => api.post(`/test-drives/${id}/no-show`),
  reassign: (id, { staffId }) => api.patch(`/test-drives/${id}/assign`, { staffId }),
  cancel: (id, { reasonCode, note }) => api.post(`/test-drives/${id}/staff-cancel`, { reasonCode, note: note || undefined }),
}

export const runStaffAction = (action, id, payload = {}) => STAFF_ACTION_REQUESTS[action](id, payload)

/** Nhân viên bán hàng đang hoạt động; BE đã sắp xếp theo tên tiếng Việt và không trả thông tin liên hệ. */
export async function listAssignableStaff() {
  const { data } = await api.get('/test-drives/staff')
  return (data?.data ?? []).map((member) => ({ value: member.id, label: member.fullName }))
}

// ── Cấu hình khung giờ ─────────────────────────────────────────────────────
export async function getPublicTestDriveSettings() {
  const { data } = await api.get('/public/base-settings')
  return data?.data?.testDrive
}

export async function getAdminTestDriveSettings() {
  const { data } = await api.get('/admin/base-settings')
  return data?.data?.testDrive
}

/**
 * PUT bắt buộc có đủ contact, businessHours và testDrive, nên đọc lại bản mới nhất ngay trước khi lưu
 * và chỉ đè các trường vừa sửa, để không ghi đè thay đổi của quản trị viên khác.
 * @param {object} changes  Các trường testDrive đã thay đổi trên form.
 */
export async function saveTestDriveSettings(changes) {
  const { data: current } = await api.get('/admin/base-settings')
  const { contact, businessHours, testDrive } = current?.data ?? {}
  const { data } = await api.put('/admin/base-settings', { contact, businessHours, testDrive: { ...testDrive, ...changes } })
  return data?.data?.testDrive
}
