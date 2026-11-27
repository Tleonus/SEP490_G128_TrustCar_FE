// Chuẩn bị dữ liệu hiển thị phản hồi (hàm thuần). Ref: SPEC.md REQ-F08, REQ-F10

import { RATING_MAX } from '../constants/feedbackConstants'

export const PREVIEW_MAX = 160

const TONES = { Nóng: 'volcano', Ấm: 'blue', Lạnh: 'blue' }

/** @ears REQ-F08 Màu thẻ mức quan tâm (luôn kèm chữ ở nơi hiển thị); giá trị lạ → màu mặc định. */
export function interestTone(label) {
  return TONES[label] ?? 'default'
}

/** @ears REQ-F08 "★ 4/5"; giá trị không hợp lệ → chuỗi rỗng. */
export function ratingText(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= RATING_MAX ? `★ ${rating}/${RATING_MAX}` : ''
}

/**
 * @ears REQ-F10 Rút gọn ghi chú dài ở bảng; cắt không làm dở cặp thay thế (emoji), thêm "…".
 */
export function previewNotes(text, max = PREVIEW_MAX) {
  const value = typeof text === 'string' ? text : ''
  if (value.length <= max) return { text: value, truncated: false }
  let cut = value.slice(0, max)
  if (/[\uD800-\uDBFF]$/.test(cut)) cut = cut.slice(0, -1)
  return { text: `${cut.trimEnd()}…`, truncated: true }
}
