import { useEffect, useState } from 'react'
import { fetchMyVisits } from '../api/appointmentApi'
import { heldCarIds } from '../utils/heldCars'

/**
 * Các xe khách đang giữ ở lượt chưa diễn ra, tải một lần khi mở hộp đặt lịch (2 yêu cầu nhỏ: Chờ xác nhận
 * và Đã xác nhận; mỗi khách chỉ có tối đa 2 lượt mở). Lỗi thì bỏ qua và coi như chưa biết: BE vẫn từ chối
 * khi gửi nên không có gì sai, chỉ mất lời báo sớm.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @returns {Set<string>}
 */
export function useHeldCars() {
  const [held, setHeld] = useState(() => new Set())

  useEffect(() => {
    const controller = new AbortController()
    Promise.all(['PENDING', 'CONFIRMED'].map((status) => fetchMyVisits({ status, limit: 10 }, controller.signal)))
      .then((lists) => setHeld(heldCarIds(lists.flatMap((list) => list.items))))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return held
}
