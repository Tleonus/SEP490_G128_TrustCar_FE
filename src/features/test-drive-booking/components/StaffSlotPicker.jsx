import { useState } from 'react'
import { Alert, Button, Skeleton, Tag } from 'antd'
import DayBar from './DayBar'
import { describeStaffSlot } from '../utils/staffSlotGrid'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { CURRENT_SLOT_LABEL, SLOT_DAYS } from '../constants/testDriveConstants'
import { formatVnTime, sameInstant } from '../utils/vnTime'
import slotStyles from '../styles/SlotPicker.module.css'
import styles from '../styles/StaffSlots.module.css'

/** Ghép class name, bỏ giá trị rỗng. */
const cx = (...names) => names.filter(Boolean).join(' ')

/** Danh sách lượt đang đặt trong khung (mã, trạng thái, tên, SĐT, xe). */
function SlotVisits({ info }) {
  if (info.visits.length === 0) return <p className={styles.empty}>Khung {info.time} chưa có lượt nào.</p>
  return (
    <ul className={styles.visits} aria-label={`Khách đã đặt khung ${info.time}`}>
      {info.visits.map((visit) => (
        <li key={visit.key} className={styles.visit}>
          <span className={styles.visitHead}>
            <strong>{visit.code}</strong>
            <Tag color={visit.statusColor}>{visit.statusLabel}</Tag>
          </span>
          <span>{visit.name || '(không rõ)'}{visit.phone && <> · <a href={`tel:${visit.phone}`}>{visit.phone}</a></>}</span>
          <span className={styles.sub}>{visit.cars}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Lưới ngày/khung của nhân viên: mỗi khung ghi số chỗ còn lại hoặc lý do không đặt được; bấm một khung để xem
 * các lượt đang đặt. `mode="select"` (đổi lịch hộ, đặt hộ): khung chọn được thì chọn luôn; khung không chọn được
 * (kín, quá khứ, giờ hiện tại) vẫn bấm để xem khách. `mode="view"` (tab "Lịch trống"): chỉ xem.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F39
 * @param {'idle'|'loading'|'success'|'error'} status
 * @param {object[]} days             Kết quả groupDays
 * @param {object|null} error
 * @param {string|null} selectedDate  Khóa YYYY-MM-DD đang hiển thị
 * @param {string|null} [selectedStart] `start` của khung đang chọn (chế độ chọn)
 * @param {Record<string, string>} [carNames]
 * @param {string} [lockedStart]      Giờ hiện tại của lượt đang đổi (ISO): mờ, "Giờ hiện tại", không chọn được
 * @param {'select'|'view'} [mode]
 */
export default function StaffSlotPicker({
  status, days, error, selectedDate, selectedStart = null, carNames = {}, lockedStart, mode = 'select',
  onSelectDate, onSelectSlot = () => {}, onRetry,
}) {
  const [focusStart, setFocusStart] = useState(null)

  if (status === 'loading' || status === 'idle') {
    return (
      <div className={slotStyles.wrap} aria-busy="true" aria-label="Đang tải khung giờ">
        <Skeleton.Button active block style={{ height: 64 }} />
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    )
  }

  if (status === 'error') {
    const { message } = classifyAppointmentError(error, carNames, { audience: 'staff', newEndpoint: true })
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
  if (!day) return <p className={slotStyles.state}>Chưa có khung giờ nào trong {SLOT_DAYS} ngày tới.</p>

  const focus = day.slots.find((slot) => slot.start === (focusStart ?? selectedStart))

  return (
    <div className={slotStyles.wrap}>
      <span className={slotStyles.title}>Lịch trống và lịch đã đặt (giờ Việt Nam)</span>

      <DayBar days={days} selectedDate={day.date} onSelectDate={onSelectDate} />

      <div className={slotStyles.slots} role="group" aria-label="Khung giờ trong ngày">
        {day.slots.map((slot) => {
          const isCurrent = sameInstant(slot.start, lockedStart)
          const info = describeStaffSlot(slot, carNames)
          const pickable = mode === 'select' && info.selectable && !isCurrent
          const chosen = slot.start === selectedStart
          const note = isCurrent ? CURRENT_SLOT_LABEL : info.note
          return (
            <button
              key={slot.start}
              type="button"
              className={cx(slotStyles.slot, !info.selectable && slotStyles.slotOff, info.past && styles.past, chosen && slotStyles.slotSelected)}
              aria-pressed={mode === 'select' ? chosen : slot.start === focus?.start}
              aria-label={isCurrent ? `${formatVnTime(slot.start)} - ${CURRENT_SLOT_LABEL}` : `${info.label}, ${info.visits.length} lượt đã đặt`}
              onClick={() => {
                setFocusStart(slot.start)
                if (pickable) onSelectSlot(slot.start)
              }}
            >
              <span className={slotStyles.time}>{info.time}</span>
              <span className={slotStyles.note}>{note}</span>
              {info.visits.length > 0 && <span className={styles.count}>{info.visits.length} lượt</span>}
            </button>
          )
        })}
      </div>

      {focus && <SlotVisits info={describeStaffSlot(focus, carNames)} />}
    </div>
  )
}
