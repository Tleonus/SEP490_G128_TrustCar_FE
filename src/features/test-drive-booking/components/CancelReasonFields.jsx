import { Input, Radio } from 'antd'
import { CANCEL_REASON_OTHER, NOTE_MAX, STAFF_CANCEL_REASONS } from '../constants/testDriveConstants'
import styles from '../styles/StaffVisits.module.css'

const OPTIONS = STAFF_CANCEL_REASONS.map((reason) => ({ value: reason.code, label: reason.label }))

/**
 * Chọn MỘT lý do hủy có sẵn + ghi chú nội bộ (≤ 300; bắt buộc khi chọn "Khác").
 * Nhãn lý do là thứ khách thấy; ghi chú chỉ nhân viên thấy và không gửi cho khách.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F31
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F39
 * @param {{ code: string, note: string }} value
 * @param {(patch: { code?: string, note?: string }) => void} onChange
 * @param {boolean} [disabled]
 */
export default function CancelReasonFields({ value, onChange, disabled = false }) {
  const needsNote = value.code === CANCEL_REASON_OTHER
  const missing = needsNote && value.note.trim() === ''
  return (
    <div className={styles.cancelFields}>
      <Radio.Group
        className={styles.reasons}
        options={OPTIONS}
        value={value.code || undefined}
        disabled={disabled}
        onChange={(event) => onChange({ code: event.target.value })}
        aria-label="Lý do hủy"
      />
      <Input.TextArea
        rows={3}
        maxLength={NOTE_MAX}
        showCount
        value={value.note}
        disabled={disabled}
        onChange={(event) => onChange({ note: event.target.value })}
        placeholder={needsNote ? 'Ghi chú nội bộ (bắt buộc khi chọn "Khác")' : 'Ghi chú nội bộ (không bắt buộc)'}
        aria-label="Ghi chú nội bộ"
        status={missing ? 'warning' : undefined}
      />
      <p className={styles.sub}>Ghi chú này chỉ nhân viên thấy, không gửi cho khách.</p>
    </div>
  )
}
