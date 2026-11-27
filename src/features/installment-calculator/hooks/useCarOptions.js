import { useEffect, useState } from 'react'
import { getCars } from '../../../services/carService'
import { toCarOptions } from '../utils/carOptions'

const MAX_CARS = 100

/**
 * Danh sách xe đang bán (API công khai sẵn có) cho ô "Chọn xe".
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F17
 * @returns {{ options: Array<object>, loading: boolean, failed: boolean }}
 */
export function useCarOptions() {
  const [state, setState] = useState({ options: [], loading: true, failed: false })

  useEffect(() => {
    let cancelled = false
    getCars({ page: 1, limit: MAX_CARS })
      .then(({ items }) => { if (!cancelled) setState({ options: toCarOptions(items), loading: false, failed: false }) })
      .catch(() => { if (!cancelled) setState({ options: [], loading: false, failed: true }) })
    return () => { cancelled = true }
  }, [])

  return state
}
