import { Drawer } from 'antd'
import DayAgenda from './DayAgenda'
import { dayLabel } from '../utils/calendarRange'

/**
 * Hộp bên liệt kê lượt của một ngày theo khung giờ (kể cả khung chưa có lượt). Đóng bằng Esc hoặc nút đóng;
 * antd trả focus về phần tử đã mở.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F09
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F18
 * @param {string|null} dayKey   Ngày đang mở (`YYYY-MM-DD`), null: đóng
 * @param {object|undefined} entry
 * @param {() => void} onClose
 * @param {(visit: object) => void} onOpenVisit
 */
export default function DayDrawer({ dayKey, entry, onClose, onOpenVisit }) {
  return (
    <Drawer
      open={Boolean(dayKey)}
      onClose={onClose}
      size={440}
      title={dayKey ? `Lịch ${dayLabel(dayKey)}` : ''}
      destroyOnHidden
      styles={{ wrapper: { maxWidth: '100vw' } }}
    >
      {dayKey && <DayAgenda entry={entry} onOpenVisit={onOpenVisit} />}
    </Drawer>
  )
}
