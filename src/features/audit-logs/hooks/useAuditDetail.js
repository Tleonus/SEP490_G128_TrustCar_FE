import { useCallback, useEffect, useState } from 'react'
import { fetchAuditLog } from '../api/auditLogsApi'
import { classifyAuditError } from '../utils/auditErrors'

/**
 * Chi tiết một sự kiện: tải khi có `id`, hủy yêu cầu khi đóng hoặc đổi `id`; `retry()` tải lại sau lỗi.
 * Mỗi lần mở một sự kiện bắt đầu từ trạng thái 'loading' (không hiện nhầm dữ liệu của sự kiện trước).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F08
 * @param {string|null} id
 * @returns {{ status: 'idle'|'loading'|'success'|'error', data: object|null, error: object|null, retry: () => void }}
 */
export function useAuditDetail(id) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: null, status: 'idle', data: null, error: null })
  const key = id ? `${id}#${attempt}` : null

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    fetchAuditLog(id, controller.signal)
      .then((data) => setState({ key, status: 'success', data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ key, status: 'error', data: null, error: classifyAuditError(error) })
      })
    return () => controller.abort()
  }, [id, key])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = key && state.key === key ? state : { status: key ? 'loading' : 'idle', data: null, error: null }

  return { status: current.status, data: current.data, error: current.error, retry }
}

export default useAuditDetail
