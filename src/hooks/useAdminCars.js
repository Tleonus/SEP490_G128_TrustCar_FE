import { useCallback, useEffect, useState } from 'react'
import { getAdminCars } from '../services/adminCarService'

export function useAdminCars(filters) {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Tăng để tải lại cùng bộ lọc (ví dụ sau khi chốt đơn một xe).
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    getAdminCars(filters)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (!active) return
        const status = err.response?.status
        if (status === 401) {
          setError('Bạn cần đăng nhập lại để xem danh sách xe.')
        } else if (status === 403) {
          setError('Bạn không có quyền xem danh sách xe quản trị.')
        } else {
          setError('Không thể tải danh sách xe. Vui lòng thử lại sau.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { ...data, loading, error, reload }
}
