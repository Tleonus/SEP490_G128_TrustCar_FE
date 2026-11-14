import { Alert, Button, Input, Steps } from 'antd'
import CarPicker from './CarPicker'
import CustomerSearch from './CustomerSearch'
import StaffSlotPicker from './StaffSlotPicker'
import { APPOINTMENT_ERROR } from '../utils/appointmentErrors'
import { NOTES_MAX } from '../constants/testDriveConstants'
import styles from '../styles/StaffBooking.module.css'

const STEP_ITEMS = [{ title: 'Tìm khách' }, { title: 'Chọn xe' }, { title: 'Chọn khung' }]

/** Dòng nêu lại khách đã chọn (tránh đặt nhầm người trùng tên). */
const Who = ({ customer }) => (
  <p className={styles.who}>Đặt hộ cho <strong>{customer.fullName}</strong> · {customer.phone}{customer.email && ` · ${customer.email}`}</p>
)

/**
 * Thân hộp "Đặt hộ khách" theo bước hiện tại: (1) tìm khách, (2) chọn xe, (3) chọn khung + ghi chú; kèm lỗi nếu có.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 * @param {ReturnType<import('../hooks/useStaffBooking').useStaffBooking>} booking
 */
export default function StaffBookingSteps({ booking }) {
  const { step, customer, problem } = booking
  const retry = problem?.kind === APPOINTMENT_ERROR.NETWORK && booking.validStart
    ? <Button size="small" onClick={booking.submit}>Thử lại</Button>
    : null

  return (
    <div className={styles.body}>
      <Steps className={styles.steps} size="small" current={step - 1} items={STEP_ITEMS} responsive={false} />

      {step === 1 && <CustomerSearch search={booking.search} onSearch={booking.runSearch} onChoose={booking.chooseCustomer} />}

      {step === 2 && (
        <>
          <Who customer={customer} />
          <CarPicker selected={booking.selected} onAdd={booking.addCar} onRemove={booking.removeCar} />
        </>
      )}

      {step === 3 && (
        <>
          <Who customer={customer} />
          <StaffSlotPicker
            status={booking.slots.status}
            days={booking.slots.days}
            error={booking.slots.error}
            selectedDate={booking.activeDate}
            selectedStart={booking.validStart}
            carNames={booking.carNames}
            onSelectDate={booking.selectDate}
            onSelectSlot={booking.selectSlot}
            onRetry={booking.slots.reload}
          />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="td-staff-notes">Ghi chú (không bắt buộc)</label>
            <Input.TextArea
              id="td-staff-notes"
              rows={2}
              maxLength={NOTES_MAX}
              showCount
              value={booking.notes}
              onChange={(event) => booking.setNotes(event.target.value)}
            />
          </div>
        </>
      )}

      {problem && <Alert type="error" showIcon message={problem.message} action={retry} />}
    </div>
  )
}
