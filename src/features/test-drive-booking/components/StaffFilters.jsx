import { Segmented, Select } from 'antd'
import { isRangeReversed } from '../utils/staffFilters'
import { OUTCOME_LABEL, REMINDER_LABEL, SORT_OPTIONS, VISIT_STATUS } from '../constants/testDriveConstants'
import styles from '../styles/StaffVisits.module.css'

const QUICK = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: REMINDER_LABEL, value: 'REMINDER' },
  { label: OUTCOME_LABEL, value: 'OUTCOME' },
  { label: 'Xe không còn bán', value: 'CAR_UNAVAILABLE' },
]

const STATUS_OPTIONS = [
  { label: 'Mọi trạng thái', value: 'ALL' },
  ...Object.entries(VISIT_STATUS).map(([value, info]) => ({ label: info.label, value })),
]

/**
 * Bộ lọc danh sách lượt cho nhân viên: nút nhanh (gồm "Gọi nhắc", "Cần chốt kết quả"), trạng thái, khoảng ngày
 * (giờ VN) và thứ tự "Gần nhất trước / Mới nhất trước" (chỉ đổi phần không ghim). Không có nút "Làm mới": danh sách
 * tự cập nhật ngầm mỗi 60 giây (G10). Mặc định BE trả các lượt từ 00:00 hôm nay; chọn "Từ ngày" sớm hơn để xem lịch sử.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F14
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F30
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F40
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F45
 * @param {{ quick: string, status: string, from: string, to: string, sort: string }} value
 * @param {(patch: object) => void} onChange
 */
export default function StaffFilters({ value, onChange }) {
  const quickOn = value.quick !== 'ALL'
  return (
    <div className={styles.filters} role="search" aria-label="Lọc lượt lái thử">
      <div className={styles.quick}>
        <Segmented options={QUICK} value={value.quick} onChange={(quick) => onChange({ quick })} />
      </div>

      <label className={styles.field}>
        Thứ tự
        <Select
          style={{ width: '100%' }}
          options={SORT_OPTIONS}
          value={value.sort}
          onChange={(sort) => onChange({ sort })}
          aria-label="Thứ tự sắp xếp"
        />
      </label>

      <label className={styles.field}>
        Trạng thái
        <Select
          style={{ width: '100%' }}
          options={STATUS_OPTIONS}
          value={quickOn ? 'ALL' : value.status}
          disabled={quickOn}
          onChange={(status) => onChange({ status })}
          aria-label="Lọc theo trạng thái"
        />
      </label>

      <label className={styles.field}>
        Từ ngày
        <input
          type="date"
          className={styles.date}
          value={value.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        Đến ngày
        <input
          type="date"
          className={styles.date}
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
        />
        {isRangeReversed(value) && <span className={styles.warn}>"Đến ngày" phải sau "Từ ngày".</span>}
      </label>
    </div>
  )
}
