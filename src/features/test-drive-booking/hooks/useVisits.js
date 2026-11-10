import { useCallback, useEffect, useState } from 'react'
import { fetchMyVisits, fetchStaffVisits } from '../api/appointmentApi'

const LOADING = { status: 'loading', items: [], meta: null, error: null, loadedAt: null, settledAt: null, silentStatus: null }

/**
 * Danh sách lượt có lọc/phân trang. Tải lại khi `params` đổi hoặc gọi `reload()`;
 * `replaceVisit(visit, previousId?)` thay một lượt tại chỗ sau khi hủy/đổi trạng thái/đổi lịch thành công.
 * Đổi lịch tạo `visitId` MỚI nên truyền `previousId` (id cũ); mặc định là `visit.visitId` (1.0.0).
 * Không có lượt nào khớp `previousId` thì không làm gì.
 *
 * `reloadSilently()` (1.2.0, G10): tải lại ngầm, GIỮ nguyên các dòng đang hiện trong lúc tải (không hiện khung chờ);
 * lần ngầm lỗi thì giữ dữ liệu cũ, không báo lỗi, và ghi `silentStatus` (mã HTTP) để hook tự cập nhật biết đường dừng.
 * Chỉ coi là ngầm khi bộ lọc không đổi so với lần tải trước.
 *
 * `loadedAt`: mốc (ms) lần tải thành công gần nhất. `settledAt`: mốc lần tải gần nhất KẾT THÚC (thành công hoặc
 * lỗi ngầm), dùng để lên lịch lần tự tải kế tiếp.
 * status: 'loading' | 'success' | 'error'. `error` là lỗi axios gốc.
 */
function useVisitList(fetcher, params) {
  const paramsKey = JSON.stringify(params)
  const [attempt, setAttempt] = useState({ n: 0, silent: false })
  const [state, setState] = useState({ ...LOADING, requestKey: null })
  const requestKey = `${paramsKey}#${attempt.n}`

  useEffect(() => {
    const controller = new AbortController()
    const silent = attempt.silent
    fetcher(JSON.parse(paramsKey), controller.signal)
      .then(({ items, meta }) => {
        const now = Date.now()
        setState({ requestKey, status: 'success', items, meta, error: null, loadedAt: now, settledAt: now, silentStatus: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (silent) {
          // Giữ dòng cũ; chỉ ghi lại mã lỗi để biết đường dừng (429) hoặc thử lại sau 60 giây.
          setState((prev) => ({ ...prev, requestKey, settledAt: Date.now(), silentStatus: error?.response?.status ?? 0 }))
          return
        }
        setState({ ...LOADING, requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [fetcher, paramsKey, requestKey, attempt.silent])

  const reload = useCallback(() => setAttempt((a) => ({ n: a.n + 1, silent: false })), [])
  const reloadSilently = useCallback(() => setAttempt((a) => ({ n: a.n + 1, silent: true })), [])
  const replaceVisit = useCallback((visit, previousId = visit.visitId) => {
    setState((prev) => ({ ...prev, items: prev.items.map((item) => (item.visitId === previousId ? visit : item)) }))
  }, [])

  // Lần tải ngầm đang chạy cùng bộ lọc: vẫn hiện dòng cũ thay vì khung chờ.
  const keepStale = attempt.silent && state.status === 'success' && state.requestKey?.startsWith(`${paramsKey}#`)
  const current = state.requestKey === requestKey || keepStale ? state : LOADING
  return {
    status: current.status,
    items: current.items,
    meta: current.meta,
    error: current.error,
    loadedAt: current.loadedAt,
    settledAt: current.settledAt,
    silentStatus: current.silentStatus,
    reload,
    reloadSilently,
    replaceVisit,
  }
}

/** @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F08 */
export const useMyVisits = (params) => useVisitList(fetchMyVisits, params)

/** @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13 */
export const useStaffVisits = (params) => useVisitList(fetchStaffVisits, params)
