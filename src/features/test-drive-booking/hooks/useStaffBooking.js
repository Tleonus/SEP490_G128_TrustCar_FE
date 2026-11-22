import { useState } from 'react'
import { createVisitForCustomer } from '../api/appointmentApi'
import { useCustomerSearch } from './useCustomerSearch'
import { useRunOnce } from './useRunOnce'
import { useSlotChoice } from './useSlotChoice'
import { useStaffSlots } from './useSlots'
import { APPOINTMENT_ERROR, classifyAppointmentError } from '../utils/appointmentErrors'
import { addCar, carIdsOf, carNamesOf, removeCar } from '../utils/carSelection'

/**
 * Trạng thái hộp "Đặt hộ khách": bước 1 tìm khách, bước 2 chọn 1–3 xe, bước 3 chọn khung + ghi chú.
 * - Lưới khung chỉ được tải ở bước 3 (đúng một lần cho mỗi bộ xe).
 * - Gửi đúng MỘT yêu cầu dù bấm đúp (`useRunOnce`).
 * - Lỗi khung/sức chứa/xe → bỏ chọn khung, tải lại lưới, giữ khách và xe; khách không còn → về bước 1.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F36
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F37
 */
export function useStaffBooking() {
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState(null)
  const [selected, setSelected] = useState([])
  const [notes, setNotes] = useState('')
  const [problem, setProblem] = useState(null)
  const [visit, setVisit] = useState(null)
  const { busy, run } = useRunOnce()
  const { search, runSearch } = useCustomerSearch()

  const carIds = carIdsOf(selected)
  const carNames = carNamesOf(selected)
  const slots = useStaffSlots({ carIds, enabled: step === 3 && visit === null })
  const choice = useSlotChoice(slots)

  const changeCars = (next) => {
    setSelected(next)
    choice.clearSlot()
    setProblem(null)
  }

  const fail = (error) => {
    const failure = classifyAppointmentError(error, carNames, { audience: 'staff', newEndpoint: true })
    setProblem(failure)
    if (failure.reload === 'slots') {
      choice.clearSlot()
      slots.reload()
    } else if (failure.kind === APPOINTMENT_ERROR.CUSTOMER_NOT_FOUND) {
      setCustomer(null)
      choice.clearSlot()
      setStep(1)
    }
  }

  const submit = () => run(async () => {
    if (!choice.validStart || !customer) return
    setProblem(null)
    try {
      setVisit(await createVisitForCustomer({ customerId: customer._id, carIds, scheduledAt: choice.validStart, notes }))
    } catch (error) {
      fail(error)
    }
  })

  return {
    step, search, customer, selected, carNames, slots, notes, problem, visit, submitting: busy, ...choice,
    setNotes,
    runSearch,
    chooseCustomer: (item) => { setCustomer(item); setProblem(null); setStep(2) },
    addCar: (item) => changeCars(addCar(selected, item)),
    removeCar: (id) => changeCars(removeCar(selected, id, null)),
    next: () => { if (step === 2 && selected.length > 0) setStep(3) },
    back: () => { setProblem(null); if (step === 3) choice.clearSlot(); setStep((current) => Math.max(1, current - 1)) },
    submit,
  }
}
