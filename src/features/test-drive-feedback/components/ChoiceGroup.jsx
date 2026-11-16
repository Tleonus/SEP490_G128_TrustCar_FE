import { useId, useRef } from 'react'
import styles from '../styles/Feedback.module.css'

/**
 * Chọn MỘT giá trị (nhóm radio gốc: mũi tên chuyển ô, Tab vào/ra nhóm) và có nút "Bỏ chọn".
 *
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F12
 * @param {string} legend                      Tiêu đề nhóm
 * @param {{ value: string|number, label: string }[]} options
 * @param {string|number|null|''} value         Giá trị đang chọn ('' hoặc null = chưa chọn)
 * @param {(value: string|number|null) => void} onChange   null khi bỏ chọn
 * @param {boolean} [disabled]
 */
export default function ChoiceGroup({ legend, options, value, onChange, disabled = false }) {
  const name = useId()
  const box = useRef(null)
  const chosen = value !== null && value !== '' && value !== undefined

  const clear = () => {
    onChange(null)
    // Nút "Bỏ chọn" biến mất → trả tiêu điểm về ô đầu của nhóm để người dùng bàn phím không mất vị trí.
    box.current?.querySelector('input')?.focus()
  }

  return (
    <fieldset className={styles.group} disabled={disabled} ref={box}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => {
          const checked = chosen && option.value === value
          return (
            <label key={option.value} className={`${styles.chip} ${checked ? styles.checked : ''}`}>
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {chosen && !disabled && (
        <button type="button" className={styles.clear} onClick={clear}>Bỏ chọn</button>
      )}
    </fieldset>
  )
}
