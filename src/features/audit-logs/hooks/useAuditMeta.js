import { useEffect, useState } from 'react'
import { fetchAuditMeta } from '../api/auditLogsApi'
import { classifyAuditError } from '../utils/auditErrors'

// KAN-92: thêm `actions`, `eventActions` (mã sự kiện → hành động) và `actorEmails`.
const LOADING = { status: 'loading', eventTypes: [], targetModels: [], actions: [], eventActions: {}, actorEmails: [], error: null }

/**
 * Danh mục loại sự kiện và loại đối tượng để dựng bộ lọc. Tải đúng MỘT lần khi trang mở (REQ-F02).
 * Lỗi ở đây không chặn trang: các ô chọn chỉ trống.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F02
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F12
 * @returns {{ status: 'loading'|'success'|'error', eventTypes: string[], targetModels: string[], actions: string[], eventActions: Record<string, string>, actorEmails: string[], error: object|null }}
 */
export function useAuditMeta() {
  const [state, setState] = useState(LOADING)

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditMeta(controller.signal)
      .then((data) => setState({ ...LOADING, ...data, status: 'success', error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ ...LOADING, status: 'error', error: classifyAuditError(error) })
      })
    return () => controller.abort()
  }, [])

  return state
}

export default useAuditMeta
