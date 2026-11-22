import { useEffect } from 'react'
import { autoRefreshDelay } from '../utils/refreshPolicy'

/**
 * Tự tải ngầm danh sách theo lịch (G10): 60 giây sau lần tải gần nhất xong; 5 phút nếu lần ngầm trước bị 429.
 * Chỉ chạy khi `enabled` (tab "Danh sách lượt" đang mở, không hộp thao tác nào mở). Tới giờ mà tab trình duyệt đang
 * ẩn thì bỏ qua; khi tab hiện lại, `useFocusRefresh` lo việc tải. Mỗi lần tải xong thì hẹn lại, nên không bao giờ
 * có hai lần tải chồng nhau và không có `setInterval`.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F44
 * @param {{ enabled: boolean, settledAt: number|null, silentStatus: number|null, reloadSilently: () => void }} options
 */
export function useAutoRefresh({ enabled, settledAt, silentStatus, reloadSilently }) {
  useEffect(() => {
    if (!enabled) return undefined
    const delay = autoRefreshDelay(settledAt, silentStatus)
    if (delay === null) return undefined
    const timer = setTimeout(() => {
      if (document.visibilityState === 'visible') reloadSilently()
    }, delay)
    return () => clearTimeout(timer)
  }, [enabled, settledAt, silentStatus, reloadSilently])
}
