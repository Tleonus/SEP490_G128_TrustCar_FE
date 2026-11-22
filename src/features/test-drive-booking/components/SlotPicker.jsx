import { Alert, Button, Skeleton } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import DayBar from './DayBar'
import DayCalendar from './DayCalendar'
import { describeSlot, isSelectable } from '../utils/slotGrid'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { CURRENT_SLOT_LABEL, SLOT_DAYS } from '../constants/testDriveConstants'
import { formatVnDate, formatVnTime, sameInstant } from '../utils/vnTime'
import styles from '../styles/SlotPicker.module.css'
import guestStyles from '../styles/BookingGuest.module.css'

/** Ghép class name, bỏ giá trị rỗng. */
const cx = (...names) => names.filter(Boolean).join(' ')

/**
 * Chọn ngày rồi khung giờ. Khung không đặt được bị mờ và ghi lý do ngay trên nút (không phụ thuộc
 * di chuột), dùng `aria-disabled` để vẫn đọc được bằng bàn phím/trình đọc màn hình.
 * Khi đổi lịch, `lockedStart` là giờ hiện tại của lượt: khung đó mờ, ghi "Giờ hiện tại" và không chọn được
 * (BE coi nó là khả dụng vì đã loại lượt khỏi phép tính, nên FE tự đánh dấu).
 *
 * `variant="guest"` (KAN-90) dùng bố cục lịch tháng bên trái + lưới giờ bên phải; màn hình nhân
 * viên không truyền nên giữ nguyên dải ngày ngang cũ.
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
 * @param {string} [blockedNote]      Có giá trị thì mọi khung bị mờ và ghi nội dung này (ví dụ khi xe đã có lượt của chính khách)
 * @param {'guest'} [variant]         Bố cục lịch tháng cho modal khách
 */
export default function SlotPicker({
  status, days, error, selectedDate, selectedStart, carNames, lockedStart, blockedNote, onSelectDate, onSelectSlot, onRetry, variant,
}) {
  const guest = variant === 'guest'

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

  const slotGrid = (
    <div className={guest ? guestStyles.slots : styles.slots} role="group" aria-label="Chọn khung giờ">
      {day.slots.map((slot) => {
        const isCurrent = sameInstant(slot.start, lockedStart)
        const info = describeSlot(slot, carNames)
        const on = isSelectable(slot) && !isCurrent && !blockedNote
        const chosen = slot.start === selectedStart
        const note = blockedNote ?? (isCurrent ? CURRENT_SLOT_LABEL : info.note)
        return (
          <button
            key={slot.start}
            type="button"
            className={guest
              ? cx(guestStyles.slot, !on && guestStyles.slotOff, chosen && guestStyles.slotSelected)
              : cx(styles.slot, !on && styles.slotOff, chosen && styles.slotSelected)}
            aria-disabled={!on}
            aria-pressed={chosen}
            aria-label={isCurrent ? `${formatVnTime(slot.start)} - ${CURRENT_SLOT_LABEL}` : info.label}
            onClick={() => { if (on) onSelectSlot(slot.start) }}
          >
            <span className={guest ? guestStyles.slotTime : styles.time}>{info.time}</span>
            {guest && chosen && <CheckOutlined className={guestStyles.slotCheck} aria-hidden />}
            {!on && <span className={guest ? guestStyles.slotNote : styles.note}>{note}</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={guestStyles.stepRow}>
        <span className={guestStyles.stepBadge} aria-hidden>2</span>
        <span className={guestStyles.stepText}>
          <span className={guestStyles.stepTitle}>Chọn ngày và giờ</span>
          <span className={guestStyles.stepHint}>Giờ Việt Nam · {SLOT_DAYS} ngày tới</span>
        </span>
      </div>

      {guest ? (
        <div className={guestStyles.picker}>
          <DayCalendar days={days} selectedDate={day.date} onSelectDate={onSelectDate} />

          <div className={guestStyles.timePane}>
            <div className={guestStyles.timeHead}>
              <span className={guestStyles.timeHeadDate}>
                {day.weekday}, {formatVnDate(`${day.date}T12:00:00+07:00`)}
              </span>
              <span className={guestStyles.timeHeadCount}>
                {day.availableCount > 0 ? `${day.availableCount} khung trống` : 'Hết khung trống'}
              </span>
            </div>
            {slotGrid}
          </div>
        </div>
      ) : (
        <>
          <DayBar days={days} selectedDate={day.date} onSelectDate={onSelectDate} />
          {slotGrid}
        </>
      )}
    </div>
  )
}
