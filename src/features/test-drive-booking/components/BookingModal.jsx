import { Alert, Button, Input, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import CarPicker from './CarPicker'
import SlotPicker from './SlotPicker'
import BookingSuccess from './BookingSuccess'
import { useBooking } from '../hooks/useBooking'
import { NOTES_MAX } from '../constants/testDriveConstants'
import styles from '../styles/BookingModal.module.css'

/** Nội dung của hộp thoại; được mount mới mỗi lần mở nên trạng thái luôn bắt đầu sạch. */
function BookingDialog({ currentCar, onClose }) {
  const navigate = useNavigate()
  const booking = useBooking(currentCar)
  const { problem, visit, submitting } = booking

  const goTo = (path) => {
    onClose()
    navigate(path)
  }

  const footer = visit ? [
    <Button key="close" onClick={onClose}>Đóng</Button>,
    <Button key="mine" type="primary" onClick={() => goTo('/lich-hen')}>Xem lịch hẹn của tôi</Button>,
  ] : [
    <Button key="close" onClick={onClose}>Đóng</Button>,
    <Button key="submit" type="primary" loading={submitting} disabled={!booking.validStart} onClick={booking.submit}>
      Đặt lịch lái thử
    </Button>,
  ]

  return (
    <Modal
      open
      title="Đặt lịch lái thử"
      onCancel={onClose}
      footer={footer}
      width="min(640px, calc(100vw - 24px))"
      maskClosable={!submitting}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' } }}
    >
      {visit ? (
        <BookingSuccess visit={visit} />
      ) : (
        <div className={styles.body}>
          <CarPicker
            selected={booking.selected}
            lockedId={currentCar.id}
            onAdd={booking.addCar}
            onRemove={booking.removeCar}
            disabled={submitting}
          />
          <SlotPicker
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
            <label className={styles.label} htmlFor="td-notes">Ghi chú (không bắt buộc)</label>
            <Input.TextArea
              id="td-notes"
              rows={2}
              maxLength={NOTES_MAX}
              showCount
              value={booking.notes}
              onChange={(event) => booking.setNotes(event.target.value)}
              placeholder="Ví dụ: muốn chạy thử trên đường cao tốc"
            />
          </div>
          {problem && (
            <Alert
              type="error"
              showIcon
              message={problem.message}
              action={problem.action && <Button size="small" onClick={() => goTo(problem.action.to)}>{problem.action.label}</Button>}
            />
          )}
        </div>
      )}
    </Modal>
  )
}

/**
 * Hộp thoại đặt lịch lái thử: chọn xe (≤ 3), ngày, khung giờ, ghi chú rồi gửi.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F05
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F06
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F22
 */
export default function BookingModal({ open, currentCar, onClose }) {
  return open ? <BookingDialog currentCar={currentCar} onClose={onClose} /> : null
}
