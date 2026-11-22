// Đọc lại chuỗi `outcome` đã lưu. Chặt chẽ: sai khuôn ở bất kỳ chỗ nào → coi là chữ tự do (không đoán).
// Ref: .sdd/features/test-drive-feedback-form/SPEC.md mục 5 (phần "Phân tích")

import {
  FEEDBACK_HEADER, KEYS, KEY_ORDER, RATING_MAX, LIST_SEPARATOR, LINE_BREAK, NOTES_PREFIX,
} from '../constants/feedbackConstants'

const RATING_PATTERN = new RegExp(`^([1-${RATING_MAX}])/${RATING_MAX}$`)
const KEY_BY_LABEL = Object.fromEntries(KEY_ORDER.map((key) => [KEYS[key], key]))

const plain = (outcome) => ({ structured: false, data: null, raw: typeof outcome === 'string' ? outcome : '' })

function emptyData() {
  return { rating: null, interest: '', likes: [], concerns: [], next: '', notes: '' }
}

function readTags(value) {
  const tags = value.split(LIST_SEPARATOR)
  return tags.every((tag) => tag && tag.trim() === tag) ? tags : null
}

/** Gán giá trị của một dòng khóa vào `data`; trả false nếu giá trị sai khuôn. */
function assign(data, key, value) {
  if (!value || value.trim() !== value) return false
  if (key === 'rating') {
    const match = RATING_PATTERN.exec(value)
    if (!match) return false
    data.rating = Number(match[1])
    return true
  }
  if (key === 'likes' || key === 'concerns') {
    const tags = readTags(value)
    if (!tags) return false
    data[key] = tags
    return true
  }
  data[key] = value // quan tâm, tiếp theo: giữ nguyên chữ (kể cả giá trị lạ từ phiên bản khác)
  return true
}

/**
 * @ears REQ-F09, REQ-F11
 * @returns {{ structured: boolean, data: object|null, raw: string }} không bao giờ ném lỗi.
 */
export function parseFeedback(outcome) {
  if (typeof outcome !== 'string' || !outcome) return plain(outcome)
  const lines = outcome.split(LINE_BREAK)
  if (lines[0] !== FEEDBACK_HEADER || lines.length < 2) return plain(outcome)

  const data = emptyData()
  let lastIndex = -1
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    const colon = line.indexOf(': ')
    const key = colon > 0 ? KEY_BY_LABEL[line.slice(0, colon)] : undefined
    const index = key ? KEY_ORDER.indexOf(key) : -1
    if (index <= lastIndex) return plain(outcome) // khóa lạ, lặp hoặc sai thứ tự
    lastIndex = index
    if (key === 'notes') {
      const notes = [line.slice(NOTES_PREFIX.length), ...lines.slice(i + 1)].join(LINE_BREAK)
      if (!notes.trim()) return plain(outcome)
      data.notes = notes
      return { structured: true, data, raw: outcome }
    }
    if (!assign(data, key, line.slice(colon + 2))) return plain(outcome)
  }
  return { structured: true, data, raw: outcome }
}
