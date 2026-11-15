import { useMemo, useState } from 'react'
import { App } from 'antd'
import { MODE } from '../constants/calendarConstants'
import { rangeOf, shiftAnchor, todayKey } from '../utils/calendarRange'
import { groupByDay } from '../utils/groupVisits'
import { useCalendarRefresh } from './useCalendarRefresh'
import { useCalendarVisits } from './useCalendarVisits'
import { useDetailBox } from './useDetailBox'

const DONE_TEXT = Object.freeze({
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Đã hoàn tất',
  NO_SHOW: 'Đã đánh dấu vắng mặt',
})

/**
 * Trạng thái của tab "Lịch": chế độ (tháng/tuần), ngày đang xem, công tắc lượt hủy, các hộp đang mở và dữ liệu.
 * Thao tác ghi thành công (xác nhận, hủy, hoàn tất, vắng mặt, đổi lịch) báo kèm mã lượt rồi TẢI LẠI NGẦM đúng một lần.
 * Tự làm mới: xem `useCalendarRefresh` (chỉ khi tab Lịch đang mở và không có hộp nào mở).
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F03
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F12
 * @param {{ active: boolean, bookingOpen: boolean }} options
 */
export function useCalendarScreen({ active, bookingOpen }) {
  const { message } = App.useApp()
  const [mode, setMode] = useState(MODE.MONTH)
  const [anchor, setAnchor] = useState(() => todayKey())
  const [showCancelled, setShowCancelled] = useState(false)
  const [dayOpen, setDayOpen] = useState(null)
  const [action, setAction] = useState(null)
  const [rescheduling, setRescheduling] = useState(null)
  const box = useDetailBox()

  const data = useCalendarVisits(useMemo(() => rangeOf(mode, anchor), [mode, anchor]))
  const days = useMemo(() => groupByDay(data.items, { showCancelled }), [data.items, showCancelled])
  const idle = active && !action && !rescheduling && !box.detail && !dayOpen && !bookingOpen
  useCalendarRefresh({ active, bookingOpen, idle, data })

  const open = (visit, status) => {
    box.hideDetail()
    if (status === 'RESCHEDULE') setRescheduling(visit)
    else setAction({ visit, status })
  }

  const actionDone = (visit) => {
    message.success(`${DONE_TEXT[action.status]} ${visit.visitCode}`)
    setAction(null)
    data.reloadSilently()
  }

  const rescheduled = ({ visit, previousVisitCode }) => {
    message.success(`Đã đổi lịch: mã mới ${visit.visitCode} (thay cho ${previousVisitCode})`)
    setRescheduling(null)
    data.reloadSilently()
  }

  const stale = (failure) => {
    message.warning(failure.message)
    setRescheduling(null)
    data.reload()
  }

  return {
    mode, anchor, showCancelled, dayOpen, action, rescheduling, data, days,
    detail: box.detail, openVisit: box.openVisit, closeDetail: box.closeDetail,
    changeMode: setMode,
    go: (dir) => setAnchor((current) => shiftAnchor(mode, current, dir)),
    goToday: () => setAnchor(todayKey()),
    setShowCancelled, setDayOpen, setAction, setRescheduling,
    open, actionDone, rescheduled, stale,
  }
}

export default useCalendarScreen
