import { useEffect } from 'react'
import { shouldRefreshOnFocus } from '../utils/refreshPolicy'

/**
 * Tải lại danh sách khi người dùng quay lại tab trình duyệt, nhưng chỉ nếu lần tải trước đã ≥ 30 giây.
 * Không thăm dò định kỳ: chỉ nghe `visibilitychange` và gỡ listener khi gỡ component.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F30
 * @param {number|null} loadedAt  Mốc (ms) lần tải thành công gần nhất (null: chưa có, không tự tải).
 * @param {() => void} reload
 * @param {boolean} [enabled]  false (tab khác đang mở hoặc đang mở hộp thao tác) thì không nghe
 */
export function useFocusRefresh(loadedAt, reload, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    const onVisible = () => {
      if (document.visibilityState === 'visible' && shouldRefreshOnFocus(loadedAt, Date.now())) reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadedAt, reload, enabled])
}
