import { useEffect, useState } from 'react'
import { countCarsByStatus } from '../api/inspectionDashboardApi'
import { DASHBOARD_STAGES } from '../constants/inspectionDashboardConstants'

/**
 * Đếm số xe của từng giai đoạn. Giai đoạn nào lỗi thì để null (hiện "—"),
 * các giai đoạn còn lại vẫn hiển thị.
 * @param {number} reloadKey  Tăng để đếm lại.
 */
export function useStageCounts(reloadKey) {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    let active = true
    Promise.allSettled(DASHBOARD_STAGES.map((stage) => countCarsByStatus(stage.status))).then((results) => {
      if (!active) return
      setCounts(Object.fromEntries(DASHBOARD_STAGES.map((stage, index) => [
        stage.status,
        results[index].status === 'fulfilled' ? results[index].value : null,
      ])))
    })
    return () => { active = false }
  }, [reloadKey])

  return counts
}
