import { useId, useState } from 'react'
import { Input } from 'antd'
import ChoiceGroup from './ChoiceGroup'
import TagGroup from './TagGroup'
import { RATINGS, INTERESTS, LIKES, CONCERNS, NEXT_STEPS } from '../constants/feedbackConstants'
import { clampNotes, notesCapacity } from '../utils/feedbackFormat'
import styles from '../styles/Feedback.module.css'

const RATING_OPTIONS = RATINGS.map((n) => ({ value: n, label: `${n} ★` }))
const toOptions = (labels) => labels.map((label) => ({ value: label, label }))
const INTEREST_OPTIONS = toOptions(INTERESTS)
const NEXT_OPTIONS = toOptions(NEXT_STEPS)

/**
 * Biểu mẫu phản hồi của khách sau buổi lái thử (mọi ô tùy chọn). Không giữ trạng thái giá trị riêng:
 * `value` và `onChange` do hộp thao tác quản lý. Chọn thêm thẻ làm phần còn lại cho ghi chú giảm → ghi chú
 * dài quá bị cắt và có thông báo.
 *
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F05
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F12
 * @param {{ rating, interest, likes, concerns, next, notes }} value
 * @param {(next: object) => void} onChange
 * @param {boolean} [disabled]
 */
export default function FeedbackFields({ value, onChange, disabled = false }) {
  const [clipped, setClipped] = useState(false)
  const counterId = useId()
  const capacity = notesCapacity(value)
  const left = Math.max(0, capacity - value.notes.length)

  const change = (patch) => {
    const result = clampNotes({ ...value, ...patch })
    setClipped(result.clipped)
    onChange(result.feedback)
  }

  return (
    <div className={styles.form}>
      <ChoiceGroup legend="Đánh giá chung (1–5 sao)" options={RATING_OPTIONS} value={value.rating} disabled={disabled}
        onChange={(rating) => change({ rating })} />
      <ChoiceGroup legend="Mức quan tâm mua xe" options={INTEREST_OPTIONS} value={value.interest} disabled={disabled}
        onChange={(interest) => change({ interest: interest ?? '' })} />
      <TagGroup legend="Điều khách thích" options={LIKES} value={value.likes} disabled={disabled}
        onChange={(likes) => change({ likes })} />
      <TagGroup legend="Điều khách lo ngại" options={CONCERNS} value={value.concerns} disabled={disabled}
        onChange={(concerns) => change({ concerns })} />
      <ChoiceGroup legend="Bước tiếp theo" options={NEXT_OPTIONS} value={value.next} disabled={disabled}
        onChange={(next) => change({ next: next ?? '' })} />
      <div className={styles.notes}>
        <Input.TextArea
          rows={3}
          maxLength={capacity}
          value={value.notes}
          disabled={disabled}
          onChange={(event) => change({ notes: event.target.value })}
          placeholder="Ghi chú thêm (không bắt buộc)"
          aria-label="Ghi chú"
          aria-describedby={counterId}
        />
        <span id={counterId} className={styles.counter}>Còn {left} ký tự</span>
        <p className={styles.notice} role="status">
          {clipped ? 'Ghi chú đã được rút gọn vì các mục vừa chọn chiếm thêm chỗ.' : ''}
        </p>
      </div>
      <p className={styles.hint}>Mọi mục đều không bắt buộc. Phản hồi không sửa được sau khi hoàn tất.</p>
    </div>
  )
}
