import { useMemo, useRef, useState } from 'react'
import { buildAuditParams, EMPTY_FILTERS, validateRange } from '../utils/buildAuditParams'
import { useAuditDetail } from './useAuditDetail'
import { useAuditList } from './useAuditList'
import { useAuditMeta } from './useAuditMeta'

/**
 * Trạng thái của trang "Nhật ký hoạt động".
 * - Bộ lọc **nháp** (`draft`, đổi theo từng phím) khác bộ lọc **đã áp dụng** (`applied`): chỉ "Lọc"/Enter mới sao nháp sang
 *   đã áp dụng, quay về trang 1 và gửi yêu cầu; gõ vào ô không gọi API (REQ-F04).
 * - Khoảng ngày sai thứ tự: báo lỗi, KHÔNG gửi yêu cầu (REQ-F05).
 * - Bấm "Lọc" khi không có gì đổi → tải lại ngầm cùng trang (như "Làm mới").
 * - Mở một dòng → Drawer chi tiết; đóng thì trả focus về phần tử đã mở nó (hộp bị gỡ khi đóng nên không tự trả focus).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F04
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F05
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F14
 */
export function useAuditScreen() {
  const meta = useAuditMeta()
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [rangeError, setRangeError] = useState(null)
  const [openRow, setOpenRow] = useState(null)
  const returnFocus = useRef(null)

  const params = useMemo(() => buildAuditParams(applied, page), [applied, page])
  const list = useAuditList(params)
  const detail = useAuditDetail(openRow?.id ?? null)

  const change = (patch) => {
    setDraft((previous) => ({ ...previous, ...patch }))
    setRangeError(null)
  }

  const apply = () => {
    const error = validateRange(draft.from, draft.to)
    setRangeError(error)
    if (error) return
    if (JSON.stringify(buildAuditParams(draft, 1)) === JSON.stringify(params)) list.refresh()
    else { setApplied(draft); setPage(1) }
  }

  const reset = () => {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(1)
    setRangeError(null)
  }

  const openDetail = (row) => {
    returnFocus.current = document.activeElement
    setOpenRow(row)
  }

  const closeDetail = () => {
    setOpenRow(null)
    const target = returnFocus.current
    returnFocus.current = null
    if (target) requestAnimationFrame(() => { if (target.isConnected) target.focus() })
  }

  return { meta, draft, applied, page, rangeError, list, detail, openRow, change, apply, reset, setPage, openDetail, closeDetail }
}

export default useAuditScreen
