import { useState } from 'react'
import { Button, InputNumber } from 'antd'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import styles from './AdminLoanSettings.module.css'

/**
 * Danh sách số khách được chọn (thời hạn vay, mức trả trước): mỗi số là một thẻ có nút bỏ; ô nhập + "Thêm" để thêm số
 * mới. Danh sách luôn tăng dần, không trùng.
 * @param {{ id: string, values: number[], onChange: (next: number[]) => void, min: number, max: number, unit: string,
 *   format: (value: number) => string, maxCount: number, invalid?: (value: number) => boolean }} props
 *   `invalid(value)`: thẻ tô đỏ (ví dụ mức trả trước thấp hơn mức tối thiểu).
 */
export default function OptionList({ id, values, onChange, min, max, unit, format, maxCount, invalid = () => false }) {
  const [draft, setDraft] = useState(null)
  const canAdd = Number.isInteger(draft) && draft >= min && draft <= max && !values.includes(draft) && values.length < maxCount

  const add = () => {
    if (!canAdd) return
    onChange([...values, draft].sort((a, b) => a - b))
    setDraft(null)
  }

  return (
    <div className={styles.optionList}>
      <ul className={styles.optionChips} aria-label="Các lựa chọn hiện tại">
        {values.map((value) => (
          <li key={value} className={invalid(value) ? `${styles.optionChip} ${styles.optionChipBad}` : styles.optionChip}>
            <span>{format(value)}</span>
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Bỏ ${format(value)}`}>
              <CloseOutlined />
            </button>
          </li>
        ))}
        {values.length === 0 && <li className={styles.optionEmpty}>Chưa có lựa chọn nào</li>}
      </ul>
      <div className={styles.optionAdd}>
        <InputNumber
          id={id}
          className={styles.optionInput}
          value={draft}
          onChange={(value) => setDraft(value ?? null)}
          onPressEnter={add}
          min={min}
          max={max}
          precision={0}
          controls={false}
          suffix={unit}
          placeholder="Số mới"
        />
        <Button icon={<PlusOutlined />} onClick={add} disabled={!canAdd}>Thêm</Button>
      </div>
    </div>
  )
}
