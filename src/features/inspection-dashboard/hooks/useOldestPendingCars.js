import { useEffect, useState } from 'react'
import { listOldestPendingCars } from '../api/inspectionDashboardApi'

/** Tải danh sách xe chờ kiểm định lâu nhất; tăng `reloadKey` để tải lại. */
export function useOldestPendingCars(reloadKey) {
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((current) => ({ ...current, loading: true, error: false }))
    listOldestPendingCars()
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [reloadKey])

  return state
}
