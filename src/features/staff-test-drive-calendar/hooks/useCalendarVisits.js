import { useCallback, useEffect, useState } from 'react'
import { fetchStaffVisits } from '../../test-drive-booking/api/appointmentApi'
import { PAGE_LIMIT } from '../constants/calendarConstants'
import { fetchAllPages } from '../utils/fetchAllPages'

const LOADING = { status: 'loading', items: [], truncated: false, error: null, loadedAt: null, settledAt: null, silentStatus: null }

/**
 * Tải mọi lượt trong [from, to] (YYYY-MM-DD, giờ VN), nhiều trang tuần tự.
 *
 * Cùng hình dạng với `useVisitList` của `test-drive-booking` để dùng lại `useAutoRefresh`/`useFocusRefresh`:
 * `status` ('loading' | 'success' | 'error'), `items`, `error` (lỗi axios gốc), `loadedAt`, `settledAt`, `silentStatus`,
 * `reload()` (hiện khung chờ) và `reloadSilently()` (giữ dữ liệu đang hiện; lỗi ngầm không báo, chỉ ghi `silentStatus`).
 * Đổi khoảng ngày → hủy yêu cầu cũ, hiện khung chờ, kết quả muộn của khoảng cũ bị bỏ qua (REQ-F04).
 * `truncated`: còn lượt chưa tải vì chạm giới hạn trang (REQ-F16).
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F02
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F04
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F13
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F14
 * @param {{ from: string, to: string }} range
 */
export function useCalendarVisits({ from, to }) {
  const rangeKey = `${from}|${to}`
  const [attempt, setAttempt] = useState({ n: 0, silent: false })
  const [state, setState] = useState({ ...LOADING, requestKey: null })
  const requestKey = `${rangeKey}#${attempt.n}`

  useEffect(() => {
    const controller = new AbortController()
    const silent = attempt.silent
    const fetchPage = (page, signal) => fetchStaffVisits({ from, to, page, limit: PAGE_LIMIT }, signal)

    fetchAllPages(fetchPage, { signal: controller.signal })
      .then(({ items, truncated }) => {
        if (controller.signal.aborted) return
        const now = Date.now()
        setState({ requestKey, status: 'success', items, truncated, error: null, loadedAt: now, settledAt: now, silentStatus: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (silent) {
          // Giữ dữ liệu cũ; chỉ ghi mã lỗi để biết đường dừng (429) hoặc thử lại sau 60 giây.
          setState((prev) => ({ ...prev, requestKey, settledAt: Date.now(), silentStatus: error?.response?.status ?? 0 }))
          return
        }
        setState({ ...LOADING, requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [from, to, requestKey, attempt.silent])

  const reload = useCallback(() => setAttempt((a) => ({ n: a.n + 1, silent: false })), [])
  const reloadSilently = useCallback(() => setAttempt((a) => ({ n: a.n + 1, silent: true })), [])

  // Lần tải ngầm đang chạy cùng khoảng ngày: vẫn hiện dữ liệu cũ thay vì khung chờ.
  const keepStale = attempt.silent && state.status === 'success' && state.requestKey?.startsWith(`${rangeKey}#`)
  const current = state.requestKey === requestKey || keepStale ? state : LOADING
  return {
    status: current.status,
    items: current.items,
    truncated: current.truncated,
    error: current.error,
    loadedAt: current.loadedAt,
    settledAt: current.settledAt,
    silentStatus: current.silentStatus,
    reload,
    reloadSilently,
  }
}

export default useCalendarVisits
