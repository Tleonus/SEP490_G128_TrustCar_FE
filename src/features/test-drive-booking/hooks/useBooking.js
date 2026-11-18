import { useState } from 'react'
import { createVisit } from '../api/appointmentApi'
import { useSlots } from './useSlots'
import { useHeldCars } from './useHeldCars'
import { addCar, carIdsOf, carNamesOf, removeCar } from '../utils/carSelection'
import { heldAmong } from '../utils/heldCars'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { findSlot, firstAvailableDay, isSelectable } from '../utils/slotGrid'

/**
 * Toàn bộ trạng thái của hộp thoại đặt lịch: xe đã chọn, ngày, khung, ghi chú, lỗi, kết quả.
 * BE là nguồn quyết định: khi gửi bị từ chối, giữ nguyên lựa chọn còn lại và tải lại lưới khung nếu cần.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F07
 * @param {{ id: string, title: string }} currentCar  Xe đang xem (cố định trong lượt)
 */
export function useBooking(currentCar) {
  const [selected, setSelected] = useState([currentCar])
  const [dateKey, setDateKey] = useState(null)
  const [start, setStart] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [problem, setProblem] = useState(null)
  const [visit, setVisit] = useState(null)

  const carIds = carIdsOf(selected)
  const carNames = carNamesOf(selected)
  const slots = useSlots(carIds)
  // Xe đã chọn mà khách đang giữ ở lượt khác: báo ngay, khóa việc đặt (BE vẫn là nơi quyết định cuối).
  const heldIds = useHeldCars()
  const heldSelected = heldAmong(selected, heldIds)

  // Ngày/khung đang chọn chỉ có giá trị khi dữ liệu mới nhất còn cho phép.
  const activeDate = slots.days.some((day) => day.date === dateKey) ? dateKey : firstAvailableDay(slots.days)
  const chosen = findSlot(slots.days, start)
  const validStart = chosen && isSelectable(chosen) ? start : null

  const changeCars = (next) => {
    setSelected(next)
    setStart(null)
    setProblem(null)
  }

  async function submit() {
    if (submitting || !validStart || heldSelected.length > 0) return
    setSubmitting(true)
    setProblem(null)
    try {
      setVisit(await createVisit({ carIds, scheduledAt: validStart, notes }))
    } catch (error) {
      const failure = classifyAppointmentError(error, carNames)
      setProblem(failure)
      if (failure.reload === 'slots') {
        setStart(null)
        slots.reload()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    selected,
    carNames,
    heldIds,
    heldSelected,
    slots,
    activeDate,
    validStart,
    notes,
    submitting,
    problem,
    visit,
    setNotes,
    selectDate: setDateKey,
    selectSlot: setStart,
    addCar: (item) => changeCars(addCar(selected, item)),
    removeCar: (id) => changeCars(removeCar(selected, id, currentCar.id)),
    submit,
  }
}
