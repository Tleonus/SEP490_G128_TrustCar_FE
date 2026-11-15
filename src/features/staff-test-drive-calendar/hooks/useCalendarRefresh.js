import { useEffect, useRef } from 'react'
import { useAutoRefresh } from '../../test-drive-booking/hooks/useAutoRefresh'
import { useFocusRefresh } from '../../test-drive-booking/hooks/useFocusRefresh'
import { shouldRefreshOnFocus } from '../../test-drive-booking/utils/refreshPolicy'

/**
 * Khi nào tab "Lịch" tự tải lại ngầm (cùng chính sách với tab "Danh sách lượt"):
 * - mỗi 60 giây và khi quay lại tab trình duyệt sau ≥ 30 giây, CHỈ khi `idle` (tab Lịch đang mở và không có hộp nào mở);
 * - một lần khi quay lại tab Lịch sau ≥ 30 giây;
 * - một lần khi hộp "Đặt hộ khách" (ở tiêu đề trang, thuộc tab khác) vừa đóng. Nếu lúc đó tab Lịch không mở thì chờ
 *   tới khi quay lại, không tải ngầm trong tab ẩn.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F13
 * @param {{ active: boolean, bookingOpen: boolean, idle: boolean, data: object }} options  `data`: kết quả `useCalendarVisits`
 */
export function useCalendarRefresh({ active, bookingOpen, idle, data }) {
  const { loadedAt, settledAt, silentStatus, reloadSilently } = data
  useFocusRefresh(loadedAt, reloadSilently, idle)
  useAutoRefresh({ enabled: idle, settledAt, silentStatus, reloadSilently })

  const previousBooking = useRef(bookingOpen)
  const wasActive = useRef(active)
  const dirty = useRef(false)
  useEffect(() => {
    if (previousBooking.current && !bookingOpen) dirty.current = true
    previousBooking.current = bookingOpen
    const becameActive = active && !wasActive.current
    wasActive.current = active
    if (active && !bookingOpen && (dirty.current || (becameActive && shouldRefreshOnFocus(loadedAt)))) {
      dirty.current = false
      reloadSilently()
    }
  }, [active, bookingOpen, loadedAt, reloadSilently])
}

export default useCalendarRefresh
