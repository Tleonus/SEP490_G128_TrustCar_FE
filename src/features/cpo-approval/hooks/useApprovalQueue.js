/**
 * KAN-56 – Hook tải danh sách xe chờ duyệt cho một tab của /admin/approval.
 */

import { useCallback, useEffect, useState } from 'react'
import { listCarsByStatus } from '../api/approvalApi'
import { approvalErrorMessage } from '../utils/approvalErrors'
import { APPROVAL_PAGE_SIZE } from '../constants/approvalConstants'

export function useApprovalQueue(filters) {
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

    listCarsByStatus({ ...filters, limit: filters?.limit || APPROVAL_PAGE_SIZE })
      .then((result) => {
        if (!active) return
        setItems(result.items)
        setMeta(result.meta)
      })
      .catch((err) => {
        if (!active) return
        setItems([])
        setMeta(null)
        setError(approvalErrorMessage(err, 'Không tải được danh sách xe chờ duyệt.'))
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

export default useApprovalQueue
