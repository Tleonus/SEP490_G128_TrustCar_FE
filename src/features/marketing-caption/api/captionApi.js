/**
 * KAN-69 – Gọi API gợi ý caption: POST /marketing/caption (KAN-68, Backend).
 *
 * Hợp đồng đã đối chiếu trên nhánh origin/feature/KAN-68-marketing-caption:
 *   body   { carId, tone?, platform?, length? }
 *   quyền  ADMIN, SALES_STAFF (verifyToken + requireRole)
 *   trả    { captions: string[], hashtags: string[], imageSuggestion: { url, note },
 *            carId, cached?, source?: 'llm'|'template'|'mixed', droppedCount? }
 *   lỗi    CAR_NOT_FOUND (404), CAR_NOT_ADVERTISABLE (422), CAPTION_DAILY_LIMIT (429)
 *
 * Timeout dài hơn mức 15s mặc định của api client vì phải chờ model soạn văn bản.
 * Không giả lập caption khi Backend lỗi: lỗi thật được ném lên cho UI hiển thị.
 */

import api from '../../../services/api'
import { resolveRequestOptions } from '../constants/captionConstants'

const CAPTION_TIMEOUT_MS = 45000
/** Đăng bài phải chờ Facebook tải ảnh + tạo post nên cho thời gian dài hơn. */
const PUBLISH_TIMEOUT_MS = 60000

/**
 * @param {string} carId ObjectId của xe
 * @param {object} [options]
 * @param {string} [options.presetId] preset giọng điệu trong TONE_PRESETS
 * @param {string} [options.length] short | medium
 */
export async function suggestCaptions(carId, { presetId, length } = {}) {
  if (!carId) throw new Error('Missing carId')
  const { data } = await api.post(
    '/marketing/caption',
    { carId, ...resolveRequestOptions(presetId, length) },
    { timeout: CAPTION_TIMEOUT_MS },
  )
  const payload = data?.data ?? null
  return {
    captions: Array.isArray(payload?.captions) ? payload.captions.filter((item) => String(item ?? '').trim()) : [],
    hashtags: Array.isArray(payload?.hashtags) ? payload.hashtags : [],
    imageSuggestion: payload?.imageSuggestion ?? null,
    source: payload?.source ?? null,
    cached: Boolean(payload?.cached),
  }
}

/**
 * KAN-91 – Đăng bài thật lên Facebook Page qua Backend (Graph API).
 *
 * Backend trả { postId, permalinkUrl, pageId, publishedAt }. Nếu Page chưa được cấu hình,
 * Backend trả 503 FACEBOOK_NOT_CONFIGURED kèm danh sách biến môi trường còn thiếu —
 * Frontend hiển thị đúng lỗi đó, không bao giờ coi như đăng thành công.
 *
 * @param {string} carId ObjectId của xe
 * @param {string} caption nội dung bài viết (đã gồm hashtag)
 */
export async function publishCaptionToFacebook(carId, caption) {
  if (!carId) throw new Error('Missing carId')
  const { data } = await api.post(
    '/marketing/facebook/publish',
    { carId, caption },
    { timeout: PUBLISH_TIMEOUT_MS },
  )
  const payload = data?.data ?? null
  return {
    postId: payload?.postId ?? null,
    permalinkUrl: payload?.permalinkUrl ?? null,
    pageId: payload?.pageId ?? null,
    publishedAt: payload?.publishedAt ?? null,
  }
}
