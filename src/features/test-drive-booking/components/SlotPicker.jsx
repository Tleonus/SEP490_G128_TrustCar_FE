import { Alert, Button, Skeleton } from 'antd'
import DayBar from './DayBar'
import { describeSlot, isSelectable } from '../utils/slotGrid'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { CURRENT_SLOT_LABEL, SLOT_DAYS } from '../constants/testDriveConstants'
import { formatVnTime, sameInstant } from '../utils/vnTime'
import styles from '../styles/SlotPicker.module.css'

/** Ghép class name, bỏ giá trị rỗng. */
const cx = (...names) => names.filter(Boolean).join(' ')

/**
 * Chọn ngày (thanh cuộn ngang 14 ngày) rồi khung giờ (4 nút). Khung không đặt được bị mờ và ghi lý do
 * ngay trên nút (không phụ thuộc di chuột), dùng `aria-disabled` để vẫn đọc được bằng bàn phím/trình đọc màn hình.
 * Khi đổi lịch, `lockedStart` là giờ hiện tại của lượt: khung đó mờ, ghi "Giờ hiện tại" và không chọn được
 * (BE coi nó là khả dụng vì đã loại lượt khỏi phép tính, nên FE tự đánh dấu).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F03
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F22
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F26
 * @param {'idle'|'loading'|'success'|'error'} status
 * @param {object[]} days             Kết quả groupDays
 * @param {object|null} error         Lỗi axios gốc khi status === 'error'
 * @param {string|null} selectedDate  Khóa YYYY-MM-DD đang chọn
 * @param {string|null} selectedStart Chuỗi `start` của khung đang chọn
 * @param {Record<string, string>} carNames  id xe → tên (ghi tên xe bị kín)
 * @param {string} [lockedStart]      Giờ hiện tại của lượt đang đổi lịch (ISO)
 */
export default function SlotPicker({
  status, days, error, selectedDate, selectedStart, carNames, lockedStart, onSelectDate, onSelectSlot, onRetry,
}) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div className={styles.wrap} aria-busy="true" aria-label="Đang tải khung giờ">
        <Skeleton.Button active block style={{ height: 64 }} />
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    )
  }

  if (status === 'error') {
    const { message } = classifyAppointmentError(error, carNames, { newEndpoint: Boolean(lockedStart) })
    return (
      <Alert
        type="warning"
        showIcon
        message="Không thể tải khung giờ"
        description={message}
        action={<Button size="small" onClick={onRetry}>Thử lại</Button>}
      />
    )
  }

  const day = days.find((item) => item.date === selectedDate) ?? days[0]
  if (!day) return <p className={styles.state}>Chưa có khung giờ nào trong {SLOT_DAYS} ngày tới.</p>

  return (
    <div className={styles.wrap}>
      <span className={styles.title}>Chọn ngày và giờ (giờ Việt Nam)</span>

      <DayBar days={days} selectedDate={day.date} onSelectDate={onSelectDate} />

      <div className={styles.slots} role="group" aria-label="Chọn khung giờ">
        {day.slots.map((slot) => {
          const isCurrent = sameInstant(slot.start, lockedStart)
          const info = describeSlot(slot, carNames)
          const on = isSelectable(slot) && !isCurrent
          const chosen = slot.start === selectedStart
          const note = isCurrent ? CURRENT_SLOT_LABEL : info.note
          return (
            <button
              key={slot.start}
              type="button"
              className={cx(styles.slot, !on && styles.slotOff, chosen && styles.slotSelected)}
              aria-disabled={!on}
              aria-pressed={chosen}
              aria-label={isCurrent ? `${formatVnTime(slot.start)} - ${CURRENT_SLOT_LABEL}` : info.label}
              onClick={() => { if (on) onSelectSlot(slot.start) }}
            >
              <span className={styles.time}>{info.time}</span>
              {!on && <span className={styles.note}>{note}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
