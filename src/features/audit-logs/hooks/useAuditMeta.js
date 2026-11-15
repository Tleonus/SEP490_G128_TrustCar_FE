import { useEffect, useState } from 'react'
import { fetchAuditMeta } from '../api/auditLogsApi'
import { classifyAuditError } from '../utils/auditErrors'

const LOADING = { status: 'loading', eventTypes: [], targetModels: [], error: null }

/**
 * Danh mục loại sự kiện và loại đối tượng để dựng bộ lọc. Tải đúng MỘT lần khi trang mở (REQ-F02).
 * Lỗi ở đây không chặn trang: các ô chọn chỉ trống.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F02
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F12
 * @returns {{ status: 'loading'|'success'|'error', eventTypes: string[], targetModels: string[], error: object|null }}
 */
export function useAuditMeta() {
  const [state, setState] = useState(LOADING)

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditMeta(controller.signal)
      .then(({ eventTypes, targetModels }) => setState({ status: 'success', eventTypes, targetModels, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ ...LOADING, status: 'error', error: classifyAuditError(error) })
      })
    return () => controller.abort()
  }, [])

  return state
}

export default useAuditMeta
