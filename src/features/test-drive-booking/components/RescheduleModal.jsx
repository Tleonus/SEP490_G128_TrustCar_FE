import { Alert, Button, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import SlotPicker from './SlotPicker'
import StaffSlotPicker from './StaffSlotPicker'
import RescheduleResult from './RescheduleResult'
import { useReschedule } from '../hooks/useReschedule'
import { APPOINTMENT_ERROR } from '../utils/appointmentErrors'
import { RESCHEDULE_TITLE } from '../constants/testDriveConstants'
import { formatVnDateTime } from '../utils/vnTime'
import styles from '../styles/BookingModal.module.css'

const carTitle = (car) => [car.make, car.model, car.variant].filter(Boolean).join(' ') || car.vehicleCode || 'Xe'

/** Nội dung hộp thoại; được mount mới mỗi lần mở nên trạng thái luôn bắt đầu sạch. */
function RescheduleDialog({ visit, audience, onClose, onDone, onStale }) {
  const navigate = useNavigate()
  const reschedule = useReschedule({ visit, audience, onStale })
  const { problem, result, submitting } = reschedule
  const Picker = audience === 'staff' ? StaffSlotPicker : SlotPicker // lưới của nhân viên có chỗ còn lại và khách đang đặt

  // Đóng sau khi đổi thành công thì báo trang thay lượt cũ bằng lượt mới.
  // Đang gửi thì chưa đóng được (Esc, nút Đóng, bấm nền), để không mất kết quả của yêu cầu đang chờ.
  const close = () => {
    if (submitting) return
    if (result) onDone(result)
    else onClose()
  }
  const openCars = visit.appointments.filter((item) => item.status === 'PENDING' || item.status === 'CONFIRMED')

  const footer = result ? [
    <Button key="close" type="primary" onClick={close}>Đóng</Button>,
  ] : [
    <Button key="close" disabled={submitting} onClick={close}>Đóng</Button>,
    <Button key="submit" type="primary" loading={submitting} disabled={!reschedule.validStart} onClick={reschedule.submit}>
      Đổi sang khung này
    </Button>,
  ]

  const retry = problem?.kind === APPOINTMENT_ERROR.NETWORK && reschedule.validStart
    ? <Button size="small" onClick={reschedule.submit}>Thử lại</Button>
    : null
  const go = problem?.action
    ? <Button size="small" onClick={() => { onClose(); navigate(problem.action.to) }}>{problem.action.label}</Button>
    : null

  return (
    <Modal
      open
      title={`${RESCHEDULE_TITLE} lượt ${visit.visitCode}`}
      onCancel={close}
      footer={footer}
      width="min(640px, calc(100vw - 24px))"
      maskClosable={!submitting}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' } }}
    >
      {result ? (
        <RescheduleResult result={result} audience={audience} />
      ) : (
        <div className={styles.body}>
          <dl className={styles.summary}>
            <div>
              <dt>Giờ hiện tại (giờ Việt Nam)</dt>
              <dd>{formatVnDateTime(visit.scheduledAt)}</dd>
            </div>
            <div>
              <dt>Xe trong lượt (giữ nguyên; muốn đổi xe hãy hủy và đặt lại)</dt>
              <dd>
                <ul className={styles.carList}>
                  {openCars.map((item) => <li key={item._id}>{carTitle(item.car)}</li>)}
                </ul>
              </dd>
            </div>
          </dl>

          <Picker
            status={reschedule.slots.status}
            days={reschedule.slots.days}
            error={reschedule.slots.error}
            selectedDate={reschedule.activeDate}
            selectedStart={reschedule.validStart}
            carNames={reschedule.carNames}
            lockedStart={visit.scheduledAt}
            onSelectDate={reschedule.selectDate}
            onSelectSlot={reschedule.selectSlot}
            onRetry={reschedule.slots.reload}
          />

          {problem && <Alert type="error" showIcon message={problem.message} action={retry ?? go} />}
        </div>
      )}
    </Modal>
  )
}

/**
 * Hộp thoại đổi lịch cả lượt sang khung khác (xe cố định). Gửi đúng một yêu cầu dù bấm đúp (xem `useReschedule`).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F26
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F27
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F28
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F29
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F39
 * @param {object|null} visit        Lượt đang đổi; null thì không hiện
 * @param {'customer'|'staff'} audience
 * @param {() => void} onClose       Đóng không đổi gì
 * @param {(result: { visit: object, previousVisitCode: string }) => void} onDone  Đóng sau khi đổi thành công
 * @param {(failure: object) => void} onStale  Lỗi buộc đóng hộp và tải lại danh sách (không được đổi, hết lượt, 404…)
 */
export default function RescheduleModal({ visit, audience = 'customer', onClose, onDone, onStale }) {
  if (!visit) return null
  return (
    <RescheduleDialog
      key={visit.visitId}
      visit={visit}
      audience={audience}
      onClose={onClose}
      onDone={onDone}
      onStale={onStale}
    />
  )
}
