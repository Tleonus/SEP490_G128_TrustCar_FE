import { Button, Segmented, Switch } from 'antd'
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import { MODE } from '../constants/calendarConstants'
import styles from '../styles/StaffCalendar.module.css'

const MODE_OPTIONS = [
  { label: 'Tháng', value: MODE.MONTH },
  { label: 'Tuần', value: MODE.WEEK },
]

/**
 * Thanh điều khiển lịch: kỳ trước/sau, "Hôm nay", tiêu đề kỳ (đọc lại khi đổi), Tháng/Tuần, công tắc lượt đã hủy, làm mới.
 * Mọi nút có nhãn truy cập; chỉ phát sự kiện, không giữ trạng thái.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F03
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F07
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F18
 */
export default function CalendarToolbar({
  title, mode, onMode, onPrev, onNext, onToday, showCancelled, onShowCancelled, onRefresh, loading,
}) {
  const unit = mode === MODE.WEEK ? 'tuần' : 'tháng'
  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <Button icon={<LeftOutlined />} onClick={onPrev} aria-label={`Xem ${unit} trước`} />
        <Button icon={<RightOutlined />} onClick={onNext} aria-label={`Xem ${unit} sau`} />
        <Button onClick={onToday}>Hôm nay</Button>
        <h2 className={styles.title} aria-live="polite">{title}</h2>
      </div>
      <div className={styles.group}>
        <Segmented options={MODE_OPTIONS} value={mode} onChange={onMode} aria-label="Chế độ xem lịch" />
        <label className={styles.toggle}>
          <Switch size="small" checked={showCancelled} onChange={onShowCancelled} />
          Hiện cả lượt đã hủy
        </label>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} disabled={loading} aria-label="Làm mới lịch">Làm mới</Button>
      </div>
    </div>
  )
}
