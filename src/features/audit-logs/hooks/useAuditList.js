import { useCallback, useEffect, useState } from 'react'
import { fetchAuditLogs } from '../api/auditLogsApi'
import { classifyAuditError } from '../utils/auditErrors'

const LOADING = { status: 'loading', items: [], meta: null, error: null }

/**
 * Một trang nhật ký theo `params` (kết quả `buildAuditParams`).
 * - Đổi `params` → hủy yêu cầu cũ bằng `AbortController`, hiện khung chờ, và kết quả muộn của yêu cầu cũ bị bỏ qua (REQ-F06).
 * - Đang tải trang/bộ lọc mới: `status` là 'loading' và `items` vẫn là dòng của kết quả trước (nếu có) để giao diện giữ bảng
 *   và phân trang, chỉ phủ lớp chờ. `reload()` sau lỗi và `refresh()` cũng vậy (REQ-F11). Khi tải LỖI thì `items` rỗng:
 *   không hiện dữ liệu cũ như thể còn mới (REQ-F09).
 * - Không tự thử lại, không tự làm mới nền (CF8).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F02
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F06
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F09
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F11
 * @param {object} params
 * @returns {{ status: 'loading'|'success'|'error', items: object[], meta: object|null, error: object|null, reload: () => void, refresh: () => void }}
 */
export function useAuditList(params) {
  const paramsKey = JSON.stringify(params)
  const [attempt, setAttempt] = useState({ n: 0, keep: false })
  const [state, setState] = useState({ ...LOADING, requestKey: null })
  const requestKey = `${paramsKey}#${attempt.n}`

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditLogs(JSON.parse(paramsKey), controller.signal)
      .then(({ items, meta }) => setState({ requestKey, status: 'success', items, meta, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ ...LOADING, requestKey, status: 'error', error: classifyAuditError(error) })
      })
    return () => controller.abort()
  }, [paramsKey, requestKey])

  const reload = useCallback(() => setAttempt((a) => ({ n: a.n + 1, keep: false })), [])
  const refresh = useCallback(() => setAttempt((a) => ({ n: a.n + 1, keep: true })), [])

  // Làm mới cùng bộ lọc và trang: vẫn hiện dòng cũ thay vì khung chờ.
  const keepStale = attempt.keep && state.status === 'success' && state.requestKey?.startsWith(`${paramsKey}#`)
  const matches = state.requestKey === requestKey || keepStale
  // Đổi trang/bộ lọc: status 'loading' nhưng GIỮ dòng của kết quả thành công trước để bảng và phân trang còn đó
  // (người dùng vẫn đổi trang tiếp được). Lần tải đầu hoặc sau lỗi thì không có dòng cũ.
  const previous = state.status === 'success' ? { items: state.items, meta: state.meta } : { items: [], meta: null }
  const current = matches ? state : { ...LOADING, ...previous }

  return { status: current.status, items: current.items, meta: current.meta, error: current.error, reload, refresh }
}

export default useAuditList
