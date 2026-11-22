import { useSyncExternalStore } from 'react'
import { NARROW_QUERY } from '../constants/calendarConstants'

const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

const subscribe = (onChange) => {
  if (!supported()) return () => {}
  const query = window.matchMedia(NARROW_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getSnapshot = () => (supported() ? window.matchMedia(NARROW_QUERY).matches : false)

/**
 * Màn hình hẹp (≤ 640px)? Dùng để chọn tuần dạng danh sách dọc và tháng dạng chấm màu (CF12).
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F17
 */
export const useIsNarrow = () => useSyncExternalStore(subscribe, getSnapshot, () => false)

export default useIsNarrow
