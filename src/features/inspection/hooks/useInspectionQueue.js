/**
 * KAN-55 – Hook tải danh sách xe cần kiểm định cho màn /admin/inspection.
 * Gọi GET /manage/cars với tham số `status` lặp lại (DRAFT, UNDER_INSPECTION, REJECTED).
 */

import { useCallback, useEffect, useState } from 'react'
import { listInspectionQueueCars } from '../api/inspectionApi'
import { inspectionErrorMessage } from '../utils/inspectionErrors'
import { QUEUE_PAGE_SIZE } from '../constants/inspectionConstants'

export function useInspectionQueue(filters) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    listInspectionQueueCars({ ...filters, limit: filters?.limit || QUEUE_PAGE_SIZE })
      .then((result) => {
        if (!active) return
        setItems(result.items)
        setMeta(result.meta)
      })
      .catch((err) => {
        if (!active) return
        setItems([])
        setMeta(null)
        setError(inspectionErrorMessage(err, 'Không tải được danh sách xe cần kiểm định.'))
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

  return {
    items,
    meta,
    total: meta?.total ?? items.length,
    page: meta?.page ?? filters?.page ?? 1,
    loading,
    error,
    reload,
  }
}

export default useInspectionQueue
