import { useState } from 'react'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import StaffSlotPicker from './StaffSlotPicker'
import { useStaffSlots } from '../hooks/useSlots'
import { firstAvailableDay } from '../utils/slotGrid'
import styles from '../styles/StaffSlots.module.css'

/**
 * Tab "Lịch trống" (chỉ xem): 14 ngày từ hôm nay, mỗi khung có chỗ còn lại; bấm một khung để xem ai đã đặt.
 * Đúng MỘT yêu cầu `GET /appointments/slots` khi tab được mở lần đầu (antd chỉ dựng tab khi mở); "Làm mới" gọi lại.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 */
export default function StaffAvailabilityTab() {
  const slots = useStaffSlots()
  const [dateKey, setDateKey] = useState(null)
  const activeDate = slots.days.some((day) => day.date === dateKey) ? dateKey : firstAvailableDay(slots.days)

  return (
    <div className={styles.tab}>
      <div className={styles.tabHead}>
        <p className={styles.legend}>Bấm một khung để xem các lượt đã đặt.</p>
        <Button icon={<ReloadOutlined />} onClick={slots.reload} disabled={slots.status === 'loading'} aria-label="Làm mới lịch trống">
          Làm mới
        </Button>
      </div>
      <StaffSlotPicker
        mode="view"
        status={slots.status}
        days={slots.days}
        error={slots.error}
        selectedDate={activeDate}
        onSelectDate={setDateKey}
        onRetry={slots.reload}
      />
    </div>
  )
}
