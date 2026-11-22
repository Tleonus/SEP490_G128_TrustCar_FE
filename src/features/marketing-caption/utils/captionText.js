/**
 * KAN-69 – Ghép caption với hashtag thành đoạn văn bản để dán lên Facebook.
 *
 * Backend trả hashtag riêng (mảng string), không nằm trong từng caption, nên người dùng
 * copy một phương án là phải copy cả hashtag đi kèm — nếu không bài đăng thiếu phần cuối.
 */

/** Lọc hashtag: bỏ rỗng, bỏ trùng (không phân biệt hoa thường), thêm # nếu thiếu. */
export function normalizeHashtags(hashtags = []) {
  const seen = new Set()
  const result = []
  for (const raw of Array.isArray(hashtags) ? hashtags : []) {
    const value = String(raw ?? '').trim()
    if (!value) continue
    const tag = value.startsWith('#') ? value : `#${value}`
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}

/**
 * Văn bản đưa vào clipboard: caption, cách một dòng trống, rồi các hashtag trên một hàng.
 * @param {string} caption
 * @param {string[]} [hashtags]
 */
export function captionToClipboard(caption, hashtags = []) {
  const text = String(caption ?? '').trim()
  if (!text) return ''
  const tags = normalizeHashtags(hashtags)
  return tags.length ? `${text}\n\n${tags.join(' ')}` : text
}

/**
 * Cắt bớt caption để xem trước gọn, giữ nguyên dấu câu.
 * @param {string} caption
 * @param {number} maxLength
 */
export function truncateCaption(caption, maxLength = 700) {
  const text = String(caption ?? '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
