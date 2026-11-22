import { useState } from 'react'
import { Tag } from 'antd'
import { parseFeedback } from '../utils/feedbackParse'
import { interestTone, previewNotes, ratingText } from '../utils/feedbackView'
import { KEYS } from '../constants/feedbackConstants'
import styles from '../styles/Feedback.module.css'

function TagRow({ label, items }) {
  if (!items.length) return null
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}:</span>
      {items.map((item) => <Tag key={item} style={{ margin: 0 }}>{item}</Tag>)}
    </div>
  )
}

function Notes({ text }) {
  const [open, setOpen] = useState(false)
  const preview = previewNotes(text)
  const shown = open ? text : preview.text
  return (
    <div>
      <p className={styles.summaryNotes}><span className={styles.summaryLabel}>{KEYS.notes}:</span> {shown}</p>
      {preview.truncated && (
        <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}

/**
 * Hiển thị kết quả lượt lái thử. Theo khuôn phản hồi → sao, thẻ, ghi chú; ngược lại giữ nguyên chữ cũ
 * `Kết quả: …` như trước khi có biểu mẫu. Mọi giá trị là chữ thường trong JSX (không HTML).
 *
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F08
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F09
 * @ears .sdd/features/test-drive-feedback-form/SPEC.md#REQ-F10
 * @param {string|null|undefined} outcome
 */
export default function FeedbackSummary({ outcome }) {
  const { structured, data, raw } = parseFeedback(outcome)
  if (!raw) return null
  if (!structured) return <span className={styles.summary}>Kết quả: {raw}</span>

  const stars = ratingText(data.rating)
  return (
    <div className={styles.summary}>
      {(stars || data.interest) && (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Phản hồi:</span>
          {stars && <span className={styles.stars}>{stars}</span>}
          {data.interest && <Tag color={interestTone(data.interest)} style={{ margin: 0 }}>Quan tâm: {data.interest}</Tag>}
        </div>
      )}
      <TagRow label={KEYS.likes} items={data.likes} />
      <TagRow label={KEYS.concerns} items={data.concerns} />
      {data.next && <div className={styles.summaryRow}><span className={styles.summaryLabel}>{KEYS.next}:</span> {data.next}</div>}
      {data.notes && <Notes text={data.notes} />}
    </div>
  )
}
