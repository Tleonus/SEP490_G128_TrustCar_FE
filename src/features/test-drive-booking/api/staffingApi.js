import api from '../../../services/api'

// Người phụ trách lượt lái thử và điểm danh nhân viên (BE: /appointments/:id/assignee(s), /staff-attendance).
// Không bắt lỗi: component phân loại bằng staffingErrorMessage. Không tự thử lại lệnh ghi.

/**
 * Nhân viên bán hàng đi làm ngày của lượt, kèm bận/rảnh ở khung đó và số lượt trong ngày.
 * @returns {Promise<{ visitId, scheduledAt, editable: boolean, current: string|null,
 *   options: Array<{ _id, fullName, busy: boolean, visitsThatDay: number, current: boolean }> }>}
 */
export async function fetchAssigneeOptions(visitId, signal) {
  const response = await api.get(`/appointments/${visitId}/assignees`, { signal })
  return response.data.data
}

/** Giao lượt cho nhân viên khác (đi làm hôm đó, rảnh ở khung đó). Trả về lượt đã cập nhật. */
export async function reassignVisit(visitId, staffId) {
  const response = await api.patch(`/appointments/${visitId}/assignee`, { staffId })
  return response.data.data.visit
}

/**
 * Bảng điểm danh một ngày (YYYY-MM-DD).
 * @returns {Promise<{ date, editable, presentCount, total, canManageKeepers: boolean, staff: object[] }>}
 */
export async function fetchAttendance(date, signal) {
  const response = await api.get('/staff-attendance', { params: { date }, signal })
  return response.data.data
}

/**
 * Đánh dấu đi làm / nghỉ. BE xếp lại các lượt sắp tới của ngày đó.
 * @returns {Promise<{ date, staffId, present, reassigned: object[], unassigned: object[] }>}
 */
export async function markAttendance(date, staffId, present) {
  const response = await api.put(`/staff-attendance/${date}/${staffId}`, { present })
  return response.data.data
}

/** ADMIN cho / bỏ quyền điểm danh của một nhân viên. */
export async function setAttendanceKeeper(staffId, enabled) {
  const response = await api.patch(`/staff-attendance/keepers/${staffId}`, { enabled })
  return response.data.data
}

/** Hồ sơ của chính mình (để biết quyền điểm danh mới nhất mà không cần đăng nhập lại). */
export async function fetchMyProfile(signal) {
  const response = await api.get('/auth/me', { signal })
  return response.data.data
}
