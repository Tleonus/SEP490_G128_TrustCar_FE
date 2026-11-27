// Người phụ trách lượt lái thử và điểm danh: quyền, thông báo lỗi, câu tóm tắt kết quả.

import { hasAnyRole } from '../../../utils/roles'

const MESSAGE_BY_CODE = {
  APPOINTMENT_STAFF_BUSY: 'Nhân viên này đang phụ trách lượt khác cùng khung giờ.',
  APPOINTMENT_STAFF_UNAVAILABLE: 'Nhân viên này không đi làm ngày đó (hoặc không còn là nhân viên bán hàng).',
  APPOINTMENT_STAFF_NOT_OPEN: 'Lượt đã diễn ra hoặc đã đóng nên không đổi người phụ trách được.',
  APPOINTMENT_NOT_FOUND: 'Không tìm thấy lượt này.',
  ATTENDANCE_DAY_CLOSED: 'Ngày đã qua, không sửa điểm danh được.',
  ATTENDANCE_STAFF_NOT_FOUND: 'Không tìm thấy nhân viên bán hàng này.',
  ATTENDANCE_FORBIDDEN: 'Tài khoản của bạn chưa được giao quyền điểm danh.',
}

/** Câu tiếng Việt cho lỗi axios của các API người phụ trách / điểm danh. */
export function staffingErrorMessage(error) {
  const status = error?.response?.status
  const code = error?.response?.data?.code
  if (status === undefined || status >= 500) return 'Không thể kết nối. Vui lòng thử lại.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn.'
  if (status === 429) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.'
  return MESSAGE_BY_CODE[code] ?? (status === 403 ? 'Bạn không có quyền làm việc này.' : 'Thông tin chưa hợp lệ, vui lòng thử lại.')
}

/** ADMIN luôn điểm danh được; nhân viên khác cần ADMIN bật quyền (`canTakeAttendance`). */
export const canTakeAttendance = (user) => hasAnyRole(user, ['ADMIN']) || user?.canTakeAttendance === true

/** Câu báo sau khi đánh dấu: lượt đã chuyển người và lượt đang thiếu người. */
export function restaffSummary({ reassigned = [], unassigned = [] } = {}) {
  const parts = []
  if (reassigned.length) parts.push(`đã chuyển ${reassigned.length} lượt sang người khác`)
  if (unassigned.length) parts.push(`${unassigned.length} lượt đang thiếu nhân viên, cần gọi khách đổi giờ`)
  return parts.join('; ')
}

/** Tên người phụ trách của lượt cho bảng nhân viên. */
export const assigneeText = (visit) => visit.assignedTo?.fullName ?? 'Chưa có người phụ trách'
