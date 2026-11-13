import { useState } from 'react'
import { rescheduleMyVisit, rescheduleVisitAsStaff } from '../api/appointmentApi'
import { openCarIdsOf, useRescheduleSlots, useStaffSlots } from './useSlots'
import { useRunOnce } from './useRunOnce'
import { useSlotChoice } from './useSlotChoice'
import { APPOINTMENT_ERROR, classifyAppointmentError } from '../utils/appointmentErrors'

/** id xe → tên của các xe trong lượt, để nêu tên xe bị kín. */
const carNamesOfVisit = (visit) => Object.fromEntries(
  (visit?.appointments ?? [])
    .filter((a) => a.car?._id)
    .map((a) => [a.car._id, [a.car.make, a.car.model].filter(Boolean).join(' ') || a.car.vehicleCode || 'Xe']),
)

/**
 * Toàn bộ trạng thái hộp thoại đổi lịch, dùng chung cho khách (`audience: 'customer'`) và nhân viên (`'staff'`).
 * Xe cố định (xe của lượt). Gửi đúng MỘT yêu cầu dù bấm đúp (`useRunOnce`). Không tự thử lại.
 *
 * Lỗi theo REQ-F29/F36: khung/sức chứa/xe/trùng → giữ hộp, bỏ chọn khung, tải lại lưới khi cần;
 * lỗi cần đóng hộp (không được đổi, hết lượt, 404…) → gọi `onStale(failure)` để trang đóng hộp và tải lại danh sách.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F26
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F27
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F29
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F37
 * @param {{ visit: object, audience: 'customer'|'staff', onStale?: (failure: object) => void }} options
 */
export function useReschedule({ visit, audience, onStale }) {
  const isStaff = audience === 'staff'
  const [problem, setProblem] = useState(null)
  const [result, setResult] = useState(null)
  const { busy, run } = useRunOnce()

  const customerSlots = useRescheduleSlots(visit, !isStaff)
  const staffSlots = useStaffSlots({ carIds: openCarIdsOf(visit), excludeVisitId: visit?.visitId, enabled: isStaff })
  const slots = isStaff ? staffSlots : customerSlots
  const choice = useSlotChoice(slots, visit?.scheduledAt)
  const carNames = carNamesOfVisit(visit)

  const fail = (error) => {
    const failure = classifyAppointmentError(error, carNames, { audience, reschedule: true, newEndpoint: true })
    setProblem(failure)
    if (failure.reload === 'slots') {
      choice.clearSlot()
      slots.reload()
    } else if (failure.kind === APPOINTMENT_ERROR.DUPLICATE) {
      choice.clearSlot()
    } else if (failure.reload === 'visit') {
      onStale?.(failure)
    }
  }

  const submit = () => run(async () => {
    if (!choice.validStart) return
    setProblem(null)
    try {
      const send = isStaff ? rescheduleVisitAsStaff : rescheduleMyVisit
      setResult(await send(visit.visitId, choice.validStart))
    } catch (error) {
      fail(error)
    }
  })

  return { slots, carNames, submitting: busy, problem, result, submit, ...choice }
}
