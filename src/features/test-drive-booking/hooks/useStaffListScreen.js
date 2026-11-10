import { useState } from 'react'
import { App } from 'antd'
import { useStaffVisits } from './useVisits'
import { useAutoRefresh } from './useAutoRefresh'
import { useFocusRefresh } from './useFocusRefresh'
import { buildStaffParams, DEFAULT_STAFF_FILTERS } from '../utils/staffFilters'

const DONE_TEXT = Object.freeze({
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Đã hoàn tất',
  NO_SHOW: 'Đã đánh dấu vắng mặt',
})

/**
 * Trạng thái của tab "Danh sách lượt": bộ lọc, trang, hộp thao tác đang mở và danh sách.
 * - Mọi thao tác ghi thành công (xác nhận, hủy, hoàn tất, vắng mặt, đổi lịch hộ, đặt hộ) TẢI LẠI danh sách ngầm đúng
 *   một lần để lượt về đúng vị trí theo thứ tự của BE (REQ-F42), kèm thông báo nêu mã lượt để nhân viên không mất dấu.
 * - Tự tải ngầm mỗi 60 giây (G10) và khi quay lại tab sau ≥ 30 giây, CHỈ khi tab này đang mở (`active`) và không có
 *   hộp thao tác nào mở, để hàng không nhảy dưới tay nhân viên đang bấm.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F42
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F44
 * @param {{ active: boolean, bookingOpen: boolean }} options
 */
export function useStaffListScreen({ active, bookingOpen }) {
  const { message } = App.useApp()
  const [filters, setFilters] = useState(DEFAULT_STAFF_FILTERS)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState(null)
  const [rescheduling, setRescheduling] = useState(null)
  const list = useStaffVisits(buildStaffParams(filters, page))

  const idle = active && !action && !rescheduling && !bookingOpen
  useFocusRefresh(list.loadedAt, list.reloadSilently, idle)
  useAutoRefresh({ enabled: idle, settledAt: list.settledAt, silentStatus: list.silentStatus, reloadSilently: list.reloadSilently })

  const change = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const open = (visit, status) => {
    if (status === 'RESCHEDULE') setRescheduling(visit)
    else setAction({ visit, status })
  }

  const actionDone = (visit) => {
    message.success(`${DONE_TEXT[action.status]} ${visit.visitCode}`)
    setAction(null)
    list.reloadSilently()
  }

  const rescheduled = ({ visit, previousVisitCode }) => {
    message.success(`Đã đổi lịch: mã mới ${visit.visitCode} (thay cho ${previousVisitCode})`)
    setRescheduling(null)
    list.reloadSilently()
  }

  const booked = (visit) => {
    message.success(`Đã đặt hộ: mã ${visit.visitCode}`)
    list.reloadSilently()
  }

  const stale = (failure) => {
    message.warning(failure.message)
    setRescheduling(null)
    list.reload()
  }

  return {
    filters, page, setPage, action, setAction, rescheduling, setRescheduling, list,
    change, open, actionDone, rescheduled, booked, stale,
  }
}
