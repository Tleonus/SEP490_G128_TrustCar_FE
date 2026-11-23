import { Alert, Button, Input, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { CalendarOutlined } from '@ant-design/icons'
import CarPicker from './CarPicker'
import HeldCarNotice from './HeldCarNotice'
import SlotPicker from './SlotPicker'
import BookingSuccess from './BookingSuccess'
import { useBooking } from '../hooks/useBooking'
import { NOTES_MAX } from '../constants/testDriveConstants'
import guest from '../styles/BookingGuest.module.css'

/**
 * KAN-90 – Khung modal: header cố định (tiêu đề + mô tả), phần thân cuộn dọc khi thiếu chỗ,
 * footer luôn hiển thị. Ba khối nội dung đánh số bước: xe → ngày giờ → ghi chú.
 */
function BookingDialog({ currentCar, onClose }) {
  const navigate = useNavigate()
  const booking = useBooking(currentCar)
  const { problem, visit, submitting } = booking
  const held = booking.heldSelected.length > 0

  const goTo = (path) => {
    onClose()
    navigate(path)
  }

  const footer = visit ? [
    <Button key="close" className={guest.btnGhost} onClick={onClose}>Đóng</Button>,
    <Button key="mine" type="primary" className={guest.btnPrimary} onClick={() => goTo('/lich-hen')}>
      Xem lịch hẹn của tôi
    </Button>,
  ] : [
    <Button key="close" className={guest.btnGhost} onClick={onClose}>Đóng</Button>,
    <Button
      key="submit"
      type="primary"
      className={guest.btnPrimary}
      icon={<CalendarOutlined />}
      loading={submitting}
      disabled={!booking.validStart || held}
      onClick={booking.submit}
    >
      Đặt lịch lái thử
    </Button>,
  ]

  return (
    <Modal
      open
      centered
      className={guest.modal}
      title={(
        <div className={guest.head}>
          <span className={guest.headIcon} aria-hidden><CalendarOutlined /></span>
          <span className={guest.headText}>
            <span className={guest.headTitle}>Đặt lịch lái thử</span>
            <span className={guest.headSub}>
              {visit ? 'Yêu cầu đã được gửi tới showroom' : 'Chọn xe, ngày và khung giờ phù hợp với bạn'}
            </span>
          </span>
        </div>
      )}
      onCancel={onClose}
      footer={footer}
      width="min(720px, calc(100vw - 16px))"
      maskClosable={!submitting}
      styles={{
        header: { padding: '18px 22px 14px', marginBottom: 0 },
        body: {
          padding: '18px 22px',
          background: 'var(--color-bg)',
          maxHeight: 'calc(100dvh - 244px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
        footer: {
          padding: '14px 22px 18px',
          marginTop: 0,
          borderTop: '1px solid var(--color-border)',
        },
      }}
    >
      {visit ? (
        <BookingSuccess visit={visit} />
      ) : (
        <div className={guest.body}>
          <section className={guest.section}>
            <CarPicker
              variant="guest"
              selected={booking.selected}
              lockedId={currentCar.id}
              onAdd={booking.addCar}
              onRemove={booking.removeCar}
              heldIds={booking.heldIds}
              disabled={submitting}
            />
          </section>

          {held && <HeldCarNotice cars={booking.heldSelected} onGo={goTo} />}

          <section className={guest.section}>
            <SlotPicker
              variant="guest"
              status={booking.slots.status}
              days={booking.slots.days}
              error={booking.slots.error}
              selectedDate={booking.activeDate}
              selectedStart={booking.validStart}
              carNames={booking.carNames}
              blockedNote={held ? 'Xe đã có lịch' : undefined}
              onSelectDate={booking.selectDate}
              onSelectSlot={booking.selectSlot}
              onRetry={booking.slots.reload}
            />
          </section>

          <section className={guest.section}>
            <div className={guest.stepRow}>
              <span className={guest.stepBadge} aria-hidden>3</span>
              <span className={guest.stepText}>
                <label className={guest.stepTitle} htmlFor="td-notes">Ghi chú</label>
                <span className={guest.stepHint}>Không bắt buộc · tối đa {NOTES_MAX} ký tự</span>
              </span>
            </div>
            <Input.TextArea
              id="td-notes"
              className={guest.notes}
              rows={3}
              maxLength={NOTES_MAX}
              showCount
              value={booking.notes}
              onChange={(event) => booking.setNotes(event.target.value)}
              placeholder="Ví dụ: muốn chạy thử trên đường cao tốc"
            />
          </section>

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
