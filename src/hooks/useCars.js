import { useEffect, useState } from 'react'
import { getCars } from '../services/carService'

export function useCars(filters) {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    getCars(filters)
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError('Không thể tải danh sách xe. Vui lòng thử lại sau.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  return { ...data, loading, error }
}
