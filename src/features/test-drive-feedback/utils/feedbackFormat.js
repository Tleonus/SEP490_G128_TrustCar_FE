// Tạo chuỗi `outcome` từ biểu mẫu phản hồi và tính ngân sách ký tự (hàm thuần).
// Ref: .sdd/features/test-drive-feedback-form/SPEC.md mục 5

import { OUTCOME_MAX } from '../../test-drive-booking/constants/testDriveConstants'
import {
  FEEDBACK_HEADER, KEYS, RATINGS, RATING_MAX, INTERESTS, LIKES, CONCERNS, NEXT_STEPS,
  LIST_SEPARATOR, LINE_BREAK, NOTES_PREFIX,
} from '../constants/feedbackConstants'

const HIGH_SURROGATE = /[\uD800-\uDBFF]$/

const pickOne = (value, allowed) => (allowed.includes(value) ? value : '')
// Giữ đúng thứ tự khai báo (kết quả không phụ thuộc thứ tự bấm) và bỏ trùng.
const pickMany = (value, allowed) => (Array.isArray(value) ? allowed.filter((label) => value.includes(label)) : [])

function cleanNotes(value) {
  if (typeof value !== 'string') return ''
  return value.normalize('NFC').replace(/\r\n?/g, LINE_BREAK).trim()
}

/** Cắt về `max` đơn vị UTF-16 mà không để dở một cặp thay thế (surrogate pair). */
function cutTo(text, max) {
  if (max <= 0) return ''
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return HIGH_SURROGATE.test(cut) ? cut.slice(0, -1) : cut
}

/**
 * @ears REQ-F04
 * Đưa biểu mẫu về dạng hợp lệ: giá trị lạ bị bỏ, thẻ theo thứ tự cố định, ghi chú NFC và cắt hai đầu.
 */
export function normalizeFeedback(value) {
  const v = value && typeof value === 'object' ? value : {}
  const rating = Number.isInteger(v.rating) && RATINGS.includes(v.rating) ? v.rating : null
  return {
    rating,
    interest: pickOne(v.interest, INTERESTS),
    likes: pickMany(v.likes, LIKES),
    concerns: pickMany(v.concerns, CONCERNS),
    next: pickOne(v.next, NEXT_STEPS),
    notes: cleanNotes(v.notes),
  }
}

function fixedLines(f) {
  const lines = [FEEDBACK_HEADER]
  if (f.rating !== null) lines.push(`${KEYS.rating}: ${f.rating}/${RATING_MAX}`)
  if (f.interest) lines.push(`${KEYS.interest}: ${f.interest}`)
  if (f.likes.length) lines.push(`${KEYS.likes}: ${f.likes.join(LIST_SEPARATOR)}`)
  if (f.concerns.length) lines.push(`${KEYS.concerns}: ${f.concerns.join(LIST_SEPARATOR)}`)
  if (f.next) lines.push(`${KEYS.next}: ${f.next}`)
  return lines
}

/** @ears REQ-F03 Không có ô nào có giá trị (ghi chú toàn khoảng trắng cũng tính là trống). */
export function isEmptyFeedback(feedback) {
  const f = normalizeFeedback(feedback)
  return f.rating === null && !f.interest && !f.likes.length && !f.concerns.length && !f.next && !f.notes
}

/** Độ dài phần cố định (dòng đầu và các dòng không phải ghi chú). */
export function fixedLength(feedback) {
  return fixedLines(normalizeFeedback(feedback)).join(LINE_BREAK).length
}

/**
 * @ears REQ-F05
 * Số ký tự tối đa còn lại cho ghi chú, sao cho toàn bộ `outcome` ≤ OUTCOME_MAX. Không bao giờ âm.
 */
export function notesCapacity(feedback) {
  const room = OUTCOME_MAX - fixedLength(feedback) - LINE_BREAK.length - NOTES_PREFIX.length
  return Math.max(0, room)
}

/**
 * @ears REQ-F05
 * Cắt ghi chú về phần còn lại; `clipped` = true khi có ký tự bị bỏ. Không cắt khoảng trắng (đang gõ dở).
 */
export function clampNotes(feedback) {
  const notes = typeof feedback?.notes === 'string' ? feedback.notes : ''
  const max = notesCapacity(feedback)
  if (notes.length <= max) return { feedback, clipped: false }
  return { feedback: { ...feedback, notes: cutTo(notes, max) }, clipped: true }
}

/**
 * @ears REQ-F03, REQ-F04, REQ-F05
 * Chuỗi `outcome`; biểu mẫu trống cho `text = ''` (không gửi `outcome`). Bảo đảm length ≤ OUTCOME_MAX.
 */
export function serializeFeedback(feedback) {
  const f = normalizeFeedback(feedback)
  if (isEmptyFeedback(f)) return { text: '', length: 0, empty: true }
  const lines = fixedLines(f)
  const notes = cutTo(f.notes, notesCapacity(f)).trim()
  if (notes) lines.push(`${NOTES_PREFIX}${notes}`)
  const text = lines.join(LINE_BREAK)
  return { text, length: text.length, empty: false }
}
