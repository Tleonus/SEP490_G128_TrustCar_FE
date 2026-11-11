import { Button, Select } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { STATUS_LABEL } from '../constants/testDriveConstants'
import { addLocalDays, formatDayLabel, getLocalDate } from '../utils/testDriveTime'
import styles from '../styles/TestDriveManagement.module.css'

const STATUS_TABS = [{ value: '', label: 'Tất cả' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))]

export default function TestDriveToolbar({ date, status, staffId, attentionOnly, staffOptions, onChange }) {
  const today = getLocalDate()
  const goToDate = (next) => onChange({ date: next === today ? null : next })

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarRow}>
        {attentionOnly ? (
          <div className={styles.dateNav}>
            <strong className={styles.attentionTitle}>Đang xem mọi lịch cần xử lý</strong>
            <Button size="large" onClick={() => onChange({ attention: null })}>Quay lại xem theo ngày</Button>
          </div>
        ) : (
          <div className={styles.dateNav}>
            <Button size="large" aria-label="Ngày trước" icon={<LeftOutlined />} onClick={() => goToDate(addLocalDays(date, -1))} />
            <strong className={styles.dayLabel}>{formatDayLabel(date)}</strong>
            <Button size="large" aria-label="Ngày sau" icon={<RightOutlined />} onClick={() => goToDate(addLocalDays(date, 1))} />
            <input
              type="date"
              className={styles.dateInput}
              aria-label="Chọn ngày"
              value={date}
              onChange={(event) => event.target.value && goToDate(event.target.value)}
            />
            <Button size="large" disabled={date === today} onClick={() => goToDate(today)}>Hôm nay</Button>
          </div>
        )}
        {staffOptions.length > 0 && (
          <Select
            size="large"
            allowClear
            className={styles.staffSelect}
            aria-label="Lọc theo nhân viên"
            placeholder="Tất cả nhân viên"
            options={staffOptions}
            value={staffId || undefined}
            onChange={(value) => onChange({ staffId: value })}
          />
        )}
      </div>
      <div className={styles.tabs} role="group" aria-label="Lọc theo trạng thái">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={status === tab.value}
            className={`${styles.tab} ${status === tab.value ? styles.tabActive : ''}`}
            onClick={() => onChange({ status: tab.value })}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
