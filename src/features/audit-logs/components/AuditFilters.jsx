import { Button, Select } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { eventLabel } from '../utils/auditLabels'
import styles from '../styles/AuditLogs.module.css'

const matchesSearch = (input, option) => option.search.includes(input.trim().toLowerCase())

/**
 * Bộ lọc nhật ký: loại sự kiện và loại đối tượng (danh sách lấy từ API `/meta`), email người thực hiện, từ ngày, đến ngày.
 * Gõ/chọn chỉ đổi bản nháp (do cha giữ); "Lọc" hoặc Enter trong một ô mới áp dụng (form `onSubmit`).
 * Ngày dùng ô `type="date"` gốc (không `dayjs`/`DatePicker`). Mọi ô có nhãn gắn đúng; lỗi khoảng ngày hiện cạnh ô ngày.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F04
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F05
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F14
 * @param {{ eventType: string, targetModel: string, actorEmail: string, from: string, to: string }} draft
 * @param {string|null} rangeError
 * @param {{ eventTypes: string[], targetModels: string[] }} meta
 * @param {(patch: object) => void} onChange
 * @param {() => void} onApply
 * @param {() => void} onReset
 * @param {() => void} onRefresh
 * @param {boolean} canReset   Có bộ lọc nào đang bật
 * @param {boolean} busy       Đang tải
 */
export default function AuditFilters({ draft, rangeError, meta, onChange, onApply, onReset, onRefresh, canReset, busy }) {
  const eventOptions = meta.eventTypes.map((code) => ({ value: code, label: eventLabel(code), search: `${eventLabel(code)} ${code}`.toLowerCase() }))
  const modelOptions = meta.targetModels.map((name) => ({ value: name, label: name, search: name.toLowerCase() }))

  return (
    <form
      className={styles.filters}
      aria-label="Bộ lọc nhật ký hoạt động"
      onSubmit={(event) => { event.preventDefault(); onApply() }}
    >
      <div className={styles.field}>
        <label htmlFor="audit-event">Loại sự kiện</label>
        <Select
          id="audit-event"
          allowClear
          showSearch
          placeholder="Tất cả"
          value={draft.eventType || undefined}
          options={eventOptions}
          filterOption={matchesSearch}
          onChange={(value) => onChange({ eventType: value ?? '' })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="audit-model">Loại đối tượng</label>
        <Select
          id="audit-model"
          allowClear
          showSearch
          placeholder="Tất cả"
          value={draft.targetModel || undefined}
          options={modelOptions}
          filterOption={matchesSearch}
          onChange={(value) => onChange({ targetModel: value ?? '' })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="audit-actor">Người thực hiện (email)</label>
        <input
          id="audit-actor"
          className={styles.date}
          type="text"
          autoComplete="off"
          placeholder="admin@trustcar.vn"
          value={draft.actorEmail}
          maxLength={200}
          onChange={(event) => onChange({ actorEmail: event.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="audit-from">Từ ngày</label>
        <input
          id="audit-from"
          className={styles.date}
          type="date"
          value={draft.from}
          aria-invalid={rangeError ? 'true' : undefined}
          aria-describedby={rangeError ? 'audit-range-error' : undefined}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="audit-to">Đến ngày</label>
        <input
          id="audit-to"
          className={styles.date}
          type="date"
          value={draft.to}
          aria-invalid={rangeError ? 'true' : undefined}
          aria-describedby={rangeError ? 'audit-range-error' : undefined}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>

      {rangeError && <p id="audit-range-error" className={styles.rangeError} role="alert">{rangeError}</p>}

      <div className={styles.buttons}>
        <Button type="primary" htmlType="submit">Lọc</Button>
        <Button htmlType="button" onClick={onReset} disabled={!canReset}>Đặt lại</Button>
        <Button htmlType="button" icon={<ReloadOutlined />} onClick={onRefresh} disabled={busy} aria-label="Làm mới danh sách nhật ký">Làm mới</Button>
      </div>
    </form>
  )
}
