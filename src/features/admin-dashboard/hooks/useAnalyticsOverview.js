import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchAnalyticsOverview } from '../api/analyticsApi'

/** Chuyển lỗi axios/BE thành thông điệp tiếng Việt cho người dùng. */
function analyticsErrorMessage(error) {
  const status = error?.response?.status
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền xem phân tích.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ.'
  return 'Không tải được số liệu phân tích. Vui lòng thử lại.'
}

const DEFAULT_DAYS = 180

function defaultRange() {
  const to = new Date()
  const from = new Date(to.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000)
  return { from, to }
}

/**
 * KAN-100 — Hook nạp số liệu phân tích Admin, có debounce khi đổi range.
 *
 * Trả về `{ data, loading, error, range, setRange, reload }`. `setRange` nhận
 * `{from, to}` dạng Date hoặc null (để reset về default). Nếu cả hai null thì
 * range quay về mặc định 180 ngày tới hôm nay.
 */
export function useAnalyticsOverview() {
  const [range, setRangeState] = useState(defaultRange)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // debounce 300ms khi range đổi liên tục (date-picker drag).
  const debounceRef = useRef(null)
  const [debouncedRange, setDebouncedRange] = useState(range)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedRange(range), 300)
    return () => clearTimeout(debounceRef.current)
  }, [range])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    fetchAnalyticsOverview(debouncedRange, controller.signal)
      .then((result) => { if (active) setData(result) })
      .catch((err) => {
        if (!active || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setData(null)
        setError(analyticsErrorMessage(err))
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false; controller.abort() }
  }, [debouncedRange, reloadKey])

  const setRange = useCallback((next) => {
    if (!next || (!next.from && !next.to)) {
      setRangeState(defaultRange())
      return
    }
    setRangeState((prev) => ({ ...prev, ...next }))
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return useMemo(() => ({ data, loading, error, range, setRange, reload }),
    [data, loading, error, range, setRange, reload])
}

export default useAnalyticsOverview
