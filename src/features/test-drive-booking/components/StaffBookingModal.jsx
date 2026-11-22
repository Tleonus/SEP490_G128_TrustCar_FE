import { Button, Modal } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import StaffBookingSteps from './StaffBookingSteps'
import { useStaffBooking } from '../hooks/useStaffBooking'
import { formatVnDateTime } from '../utils/vnTime'
import bookingStyles from '../styles/BookingModal.module.css'

const carTitle = (car) => [car.make, car.model, car.variant].filter(Boolean).join(' ') || car.vehicleCode || 'Xe'

function BookedResult({ customer, visit }) {
  return (
    <div className={bookingStyles.success} role="status">
      <p className={bookingStyles.code}>
        <CheckCircleFilled style={{ color: 'var(--color-success)', marginRight: 8 }} />
        Đã đặt và xác nhận cho {customer.fullName} — mã {visit.visitCode}
      </p>
      <dl className={bookingStyles.summary}>
        <div><dt>Thời gian (giờ Việt Nam)</dt><dd>{formatVnDateTime(visit.scheduledAt)}</dd></div>
        <div>
          <dt>Xe lái thử</dt>
          <dd>
            <ul className={bookingStyles.carList}>
              {visit.appointments.map((item) => <li key={item._id}>{carTitle(item.car)}</li>)}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Nút ở chân hộp theo bước: 1 chỉ Đóng; 2 Quay lại/Tiếp tục; 3 Quay lại/Đặt và xác nhận; xong: Đóng. */
function footerOf(booking, close) {
  const { step, visit, submitting } = booking
  if (visit) return [<Button key="close" type="primary" onClick={close}>Đóng</Button>]
  if (step === 1) return [<Button key="close" onClick={close}>Đóng</Button>]
  const back = <Button key="back" disabled={submitting} onClick={booking.back}>Quay lại</Button>
  if (step === 2) {
    return [back, <Button key="next" type="primary" disabled={booking.selected.length === 0} onClick={booking.next}>Tiếp tục</Button>]
  }
  return [
    back,
    <Button key="submit" type="primary" loading={submitting} disabled={!booking.validStart} onClick={booking.submit}>
      Đặt và xác nhận
    </Button>,
  ]
}

/** Nội dung hộp thoại; được mount mới mỗi lần mở nên trạng thái luôn bắt đầu sạch. */
function BookingDialog({ onClose, onBooked }) {
  const booking = useStaffBooking()
  const { customer, visit, submitting } = booking

  // Đang gửi thì chưa đóng được; đóng sau khi đặt xong thì báo trang tải lại bảng.
  const close = () => {
    if (submitting) return
    if (visit) onBooked(visit)
    else onClose()
  }

  return (
    <Modal
      open
      title="Đặt hộ khách"
      onCancel={close}
      footer={footerOf(booking, close)}
      width="min(720px, calc(100vw - 24px))"
      maskClosable={!submitting}
      keyboard={!submitting}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto', overflowX: 'hidden' } }}
    >
      {visit ? <BookedResult customer={customer} visit={visit} /> : <StaffBookingSteps booking={booking} />}
    </Modal>
  )
}

/**
 * Hộp "Đặt hộ khách" 3 bước: (1) tìm khách có tài khoản, (2) chọn 1–3 xe, (3) chọn khung + ghi chú rồi đặt.
 * Lượt tạo ra đã ở trạng thái "Đã xác nhận". Gửi đúng một yêu cầu dù bấm đúp (xem `useStaffBooking`).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F39
 * @param {boolean} open
 * @param {() => void} onClose                Đóng không đặt gì
 * @param {(visit: object) => void} onBooked  Đóng sau khi đặt xong (trang tải lại bảng)
 */
export default function StaffBookingModal({ open, onClose, onBooked }) {
  return open ? <BookingDialog onClose={onClose} onBooked={onBooked} /> : null
}
