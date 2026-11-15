import { useRef, useState } from 'react'

/**
 * Hộp "Chi tiết lượt". Hộp bị gỡ ngay khi đóng nên không tự trả focus: nhớ phần tử đã mở nó (thẻ lượt) và trả focus về
 * sau khi đóng bằng nút/Esc, để người dùng bàn phím không mất vị trí. `hideDetail` đóng mà không trả focus (khi chuyển
 * sang hộp thao tác).
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F18
 * @returns {{ detail: object|null, openVisit: (visit: object) => void, closeDetail: () => void, hideDetail: () => void }}
 */
export function useDetailBox() {
  const [detail, setDetail] = useState(null)
  const returnFocus = useRef(null)

  const openVisit = (visit) => {
    returnFocus.current = document.activeElement
    setDetail(visit)
  }

  const closeDetail = () => {
    setDetail(null)
    const target = returnFocus.current
    returnFocus.current = null
    if (target) requestAnimationFrame(() => { if (target.isConnected) target.focus() })
  }

  return { detail, openVisit, closeDetail, hideDetail: () => setDetail(null) }
}

export default useDetailBox
