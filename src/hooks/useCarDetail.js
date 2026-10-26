import { useEffect, useState } from 'react'
import { getCarById, getSimilarCars } from '../services/carService'

export function useCarDetail(id) {
  const [car, setCar] = useState(null)
  const [similarCars, setSimilarCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    getCarById(id)
      .then((data) => {
        if (!active) return
        setCar(data)
        return getSimilarCars(id)
      })
      .then((similar) => {
        if (!active) return
        if (similar) setSimilarCars(similar)
      })
      .catch((err) => {
        if (!active) return
        setError(
          err.status === 404
            ? 'Không tìm thấy thông tin xe này.'
            : 'Không thể tải thông tin xe. Vui lòng thử lại.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  return { car, similarCars, loading, error }
}
