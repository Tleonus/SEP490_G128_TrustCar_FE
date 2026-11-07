import { TEST_DRIVE_STATUS as STATUS } from '../constants/testDriveConstants'
import { getCarTitle } from '../../../utils/car'
import { formatDayLabel, formatTimeRange, getEndInstant, getLocalDate } from './testDriveTime'

/** Lịch lái thử chỉ có hãng, dòng và năm của xe nên ghép năm vào để dễ nhận biết. */
export function formatCarName(car) {
  return car ? [getCarTitle(car), car.year].filter(Boolean).join(' ') : ''
}

export function isHoldingSlot(appointment) {
  return appointment.status === STATUS.PENDING || appointment.status === STATUS.CONFIRMED
}

/**
 * Thao tác nhân viên được phép làm, theo bảng chuyển trạng thái của BE.
 * BE vẫn là nơi kiểm tra cuối cùng; bảng này chỉ tránh hiện nút chắc chắn bị từ chối.
 * @returns {Array<{ key: string, label: string, kind: 'primary'|'default'|'danger' }>}
 */
export function getStaffActions(appointment, { isAdmin = false, canReassign = false, now = new Date() } = {}) {
  const hasStarted = new Date(appointment.scheduledAt) <= now
  const hasEnded = getEndInstant(appointment) <= now
  const actions = []

  if (appointment.status === STATUS.PENDING && !hasEnded) {
    actions.push({ key: 'confirm', label: 'Xác nhận', kind: 'primary' })
  }
  if (appointment.status === STATUS.CONFIRMED && hasStarted) {
    actions.push({ key: 'complete', label: 'Hoàn thành', kind: 'primary' })
    actions.push({ key: 'noShow', label: 'Khách không đến', kind: 'default' })
  }
  if (appointment.status === STATUS.NO_SHOW && isAdmin) {
    actions.push({ key: 'correct', label: 'Sửa thành hoàn thành', kind: 'primary' })
  }
  if (isHoldingSlot(appointment)) {
    if (canReassign) actions.push({ key: 'reassign', label: 'Đổi nhân viên', kind: 'default' })
    actions.push({ key: 'cancel', label: 'Hủy lịch', kind: 'danger' })
  }
  return actions
}

/** Khách chỉ hủy được lịch đang giữ chỗ và chưa tới giờ hẹn. */
export function canCustomerCancel(appointment, now = new Date()) {
  return isHoldingSlot(appointment) && new Date(appointment.scheduledAt) > now
}

/** Gom lịch theo giờ bắt đầu, giữ nguyên thứ tự BE trả về (đã sắp xếp theo giờ hẹn). */
export function groupBySlot(appointments, { withDate = false } = {}) {
  const groups = new Map()
  appointments.forEach((appointment) => {
    const key = new Date(appointment.scheduledAt).getTime()
    if (!groups.has(key)) {
      const range = formatTimeRange(appointment)
      const label = withDate ? `${formatDayLabel(getLocalDate(appointment.scheduledAt))} · ${range}` : range
      groups.set(key, { key, label, items: [] })
    }
    groups.get(key).items.push(appointment)
  })
  return [...groups.values()]
}
