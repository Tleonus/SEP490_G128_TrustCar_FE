import styles from '../styles/Feedback.module.css'

/**
 * Chọn NHIỀU thẻ (ô đánh dấu gốc: Space bật/tắt). Kết quả luôn là mảng nhãn theo thứ tự bấm;
 * thứ tự cố định do `normalizeFeedback` xử lý khi tạo chuỗi.
 *
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F12
 * @param {string} legend
 * @param {string[]} options
 * @param {string[]} value
 * @param {(value: string[]) => void} onChange
 * @param {boolean} [disabled]
 */
export default function TagGroup({ legend, options, value, onChange, disabled = false }) {
  const toggle = (label) => {
    onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label])
  }

  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((label) => {
          const checked = value.includes(label)
          return (
            <label key={label} className={`${styles.chip} ${checked ? styles.checked : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(label)} />
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
