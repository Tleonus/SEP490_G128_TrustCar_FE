import { useCallback, useEffect, useState } from 'react'
import { loadSalesPipeline, resetDemoPipeline } from '../data/salesCrmRepository'

const EMPTY = { source: null, cars: [], sellableCars: [], leads: [], appointments: [], customers: [] }

export function describeLoadError(error) {
  const status = error?.response?.status
  if (status === 401) return 'Bạn cần đăng nhập lại để xem dữ liệu bán hàng.'
  if (status === 403) return 'Bạn không có quyền xem dữ liệu bán hàng.'
  return 'Không thể tải dữ liệu bán hàng. Vui lòng thử lại sau.'
}

/**
 * Tải xe + lead + lịch hẹn đã hoàn thành.
 * @param {{ enabled?: boolean }} [options] enabled=false: không tải (ví dụ modal đang đóng).
 */
export function useSalesPipeline({ enabled = true } = {}) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    loadSalesPipeline()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(describeLoadError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enabled, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const resetDemo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await resetDemoPipeline())
    } catch (err) {
      setError(describeLoadError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { ...data, loading, error, reload, resetDemo }
}
