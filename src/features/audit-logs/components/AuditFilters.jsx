import { Button, Select } from 'antd'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { actionLabel, eventLabel } from '../utils/auditLabels'
import styles from '../styles/AuditLogs.module.css'

const matchesSearch = (input, option) => option.search.includes(input.trim().toLowerCase())

/**
 * Bộ lọc nhật ký: hành động, loại sự kiện, loại đối tượng, người thực hiện (danh sách lấy từ API `/meta`, KAN-92), từ ngày, đến ngày.
 * Gõ/chọn chỉ đổi bản nháp (do cha giữ); "Lọc" hoặc Enter trong một ô mới áp dụng (form `onSubmit`).
 * Ngày dùng ô `type="date"` gốc (không `dayjs`/`DatePicker`). Mọi ô có nhãn gắn đúng; lỗi khoảng ngày hiện cạnh ô ngày.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F04
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F05
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F14
 * @param {{ action: string, eventType: string, targetModel: string, actorEmail: string, from: string, to: string }} draft
 * @param {string|null} rangeError
 * @param {{ eventTypes: string[], targetModels: string[], actions?: string[], eventActions?: Record<string, string>, actorEmails?: string[] }} meta
 * @param {(patch: object) => void} onChange
 * @param {() => void} onApply
 * @param {() => void} onReset
 * @param {() => void} onRefresh
 * @param {boolean} canReset   Có bộ lọc nào đang bật
 * @param {boolean} busy       Đang tải
 */
export default function AuditFilters({ draft, rangeError, meta, onChange, onApply, onReset, onRefresh, canReset, busy }) {
  const eventActions = meta.eventActions ?? {}
  // KAN-92: khi đã chọn Hành động, chỉ liệt kê loại sự kiện thuộc hành động đó (mã chưa có trong bảng vẫn hiện).
  const visibleEvents = draft.action
    ? meta.eventTypes.filter((code) => !eventActions[code] || eventActions[code] === draft.action)
    : meta.eventTypes
  const eventOptions = visibleEvents.map((code) => ({ value: code, label: eventLabel(code), search: `${eventLabel(code)} ${code}`.toLowerCase() }))
  const modelOptions = meta.targetModels.map((name) => ({ value: name, label: name, search: name.toLowerCase() }))
  const actionOptions = (meta.actions ?? []).map((code) => ({ value: code, label: actionLabel(code), search: `${actionLabel(code)} ${code}`.toLowerCase() }))
  const actorOptions = (meta.actorEmails ?? []).map((email) => ({ value: email, label: email, search: email.toLowerCase() }))

  const select = (id, label, key, options, extra = {}) => (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <Select
        id={id}
        allowClear
        showSearch
        placeholder="Tất cả"
        value={draft[key] || undefined}
        options={options}
        filterOption={matchesSearch}
        onChange={(value) => onChange({ [key]: value ?? '' })}
        {...extra}
      />
    </div>
  )

  const dateField = (id, label, key) => (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.date}
        type="date"
        value={draft[key]}
        aria-invalid={rangeError ? 'true' : undefined}
        aria-describedby={rangeError ? 'audit-range-error' : undefined}
        onChange={(event) => onChange({ [key]: event.target.value })}
      />
    </div>
  )

  return (
    <form
      className={styles.filters}
      aria-labelledby="audit-filter-title"
      onSubmit={(event) => { event.preventDefault(); onApply() }}
    >
      <div className={styles.filterHead}>
        <h2 id="audit-filter-title" className={styles.filterTitle}><FilterOutlined aria-hidden="true" /> Bộ lọc</h2>
        <span className={styles.filterHint}>Chọn điều kiện rồi bấm “Lọc” hoặc nhấn Enter</span>
      </div>

      <div className={styles.filterGrid}>
        {select('audit-action', 'Hành động', 'action', actionOptions)}
        {select('audit-event', 'Loại sự kiện', 'eventType', eventOptions)}
        {select('audit-model', 'Loại đối tượng', 'targetModel', modelOptions)}
        {select('audit-actor', 'Người thực hiện', 'actorEmail', actorOptions, { notFoundContent: 'Không có người thực hiện' })}
        {dateField('audit-from', 'Từ ngày', 'from')}
        {dateField('audit-to', 'Đến ngày', 'to')}
        {rangeError && <p id="audit-range-error" className={styles.rangeError} role="alert">{rangeError}</p>}
      </div>

      <div className={styles.filterActions}>
        <Button htmlType="button" icon={<ReloadOutlined />} onClick={onRefresh} disabled={busy} aria-label="Làm mới danh sách nhật ký">Làm mới</Button>
        <span className={styles.spacer} />
        <Button htmlType="button" onClick={onReset} disabled={!canReset}>Đặt lại</Button>
        <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>Lọc</Button>
      </div>
    </form>
  )
}
