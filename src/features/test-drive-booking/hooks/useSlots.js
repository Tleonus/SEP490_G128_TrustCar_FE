import { useCallback, useEffect, useState } from 'react'
import { fetchSlots, fetchStaffSlots } from '../api/appointmentApi'
import { SLOT_DAYS } from '../constants/testDriveConstants'
import { groupDays } from '../utils/slotGrid'
import { isOpenVisit } from '../utils/visitRules'
import { addDays, vnDayKey } from '../utils/vnTime'

/** 14 ngày kể từ hôm nay theo giờ VN, tính lúc gọi (không lúc render). */
const range = () => {
  const from = vnDayKey(new Date())
  return { from, to: addDays(from, SLOT_DAYS - 1) }
}

const customerGrid = ({ carIds, excludeVisitId }, signal) => fetchSlots({ carIds, excludeVisitId, ...range() }, signal)
const staffGrid = ({ carIds, excludeVisitId }, signal) => fetchStaffSlots({ carIds, excludeVisitId, ...range() }, signal)

/**
 * Hàm lõi: tải lưới khung đúng một lần cho mỗi bộ tham số (14 ngày kể từ hôm nay, giờ VN).
 * Đổi ngày trên giao diện không gọi lại; đổi tham số hoặc `reload()` thì gọi lại và huỷ yêu cầu cũ.
 * `params` là `null` (hoặc `enabled` false) thì không gọi (status 'idle').
 *
 * status: 'idle' | 'loading' | 'success' | 'error'. `error` là lỗi axios gốc.
 */
function useSlotGrid(fetcher, params, enabled) {
  const paramsKey = params === null ? null : JSON.stringify(params)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ requestKey: null, status: 'idle', days: [], error: null })
  const requestKey = `${paramsKey}#${attempt}`
  const active = enabled && paramsKey !== null

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()

    fetcher(JSON.parse(paramsKey), controller.signal)
      .then((data) => setState({ requestKey, status: 'success', days: groupDays(data.days), error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ requestKey, status: 'error', days: [], error })
      })

    return () => controller.abort()
  }, [active, fetcher, paramsKey, requestKey])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  // Kết quả của một bộ tham số/lần tải khác chưa về: coi là đang tải (không cần setState trong effect).
  const current = state.requestKey === requestKey ? state : { status: active ? 'loading' : 'idle', days: [], error: null }
  return { status: current.status, days: current.days, error: current.error, reload }
}

/**
 * Lưới khung của khách cho các xe đang chọn khi đặt lịch.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F03
 * @param {string[]} carIds
 * @param {boolean} [enabled]
 */
export function useSlots(carIds, enabled = true) {
  return useSlotGrid(customerGrid, carIds.length > 0 ? { carIds } : null, enabled)
}

/** Id các xe còn lịch mở của lượt (đổi lịch chỉ chuyển các lịch mở, xe cố định). */
export const openCarIdsOf = (visit) => [...new Set(
  (visit?.appointments ?? []).filter((a) => isOpenVisit(a)).map((a) => a.car?._id).filter(Boolean),
)]

/**
 * Lưới khung cho khách đổi lịch: xe của lượt + `excludeVisitId` (đúng một lần gọi khi mở).
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F26
 * @param {object|null} visit
 */
export function useRescheduleSlots(visit, enabled = true) {
  const carIds = openCarIdsOf(visit)
  const params = visit && carIds.length > 0 ? { carIds, excludeVisitId: visit.visitId } : null
  return useSlotGrid(customerGrid, params, enabled)
}

/**
 * Lưới khung của nhân viên (chỗ còn lại, khách đang đặt). `carIds` rỗng = không lọc xe.
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 * @param {{ carIds?: string[], excludeVisitId?: string, enabled?: boolean }} options
 */
export function useStaffSlots({ carIds = [], excludeVisitId, enabled = true } = {}) {
  return useSlotGrid(staffGrid, { carIds, excludeVisitId }, enabled)
}
