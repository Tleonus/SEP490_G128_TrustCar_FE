/**
 * KAN-69 – Hằng số cho modal gợi ý caption Facebook.
 *
 * Giá trị gửi lên Backend lấy đúng theo KAN-68 (POST /api/v1/marketing/caption):
 *   tone:     professional | friendly | urgent
 *   platform: facebook | zalo
 *   length:   short | medium
 *
 * Ticket KAN-69 ghi 3 lựa chọn giọng điệu là "Vui vẻ, Chuyên nghiệp, Ngắn gọn", nhưng
 * "Ngắn gọn" không phải một tone của Backend — nó là độ dài. Vì vậy "Ngắn gọn" ở đây là
 * một preset: giữ giọng chuyên nghiệp và ép độ dài short. Không tự bịa tone mới, vì
 * Backend sẽ trả 422 nếu gửi giá trị ngoài enum.
 */

/** Nền tảng đăng bài. Ticket chỉ yêu cầu Facebook; Zalo đã có trong enum Backend để dùng sau. */
export const PLATFORM = 'facebook'

export const LENGTH_OPTIONS = [
  { value: 'short', label: 'Ngắn' },
  { value: 'medium', label: 'Trung bình' },
]

export const DEFAULT_LENGTH = 'medium'

/**
 * presetId: giá trị dùng trong UI
 * tone / forcedLength: giá trị thật gửi lên Backend
 */
export const TONE_PRESETS = [
  { presetId: 'friendly', label: 'Vui vẻ', tone: 'friendly', forcedLength: null },
  { presetId: 'professional', label: 'Chuyên nghiệp', tone: 'professional', forcedLength: null },
  { presetId: 'concise', label: 'Ngắn gọn', tone: 'professional', forcedLength: 'short' },
]

export const DEFAULT_PRESET = 'professional'

/** Số phương án tối đa hiển thị (Backend luôn cố trả đủ 3). */
export const OPTION_COUNT = 3

/** Nhãn hiển thị khi Backend cho biết nguồn nội dung. */
export const SOURCE_NOTE = {
  llm: 'Do AI soạn từ thông tin xe.',
  template: 'AI chưa phản hồi nên hệ thống dùng mẫu có sẵn từ thông tin xe.',
  mixed: 'Một phần do AI soạn, phần còn lại dùng mẫu có sẵn.',
}

/** URL mở Facebook để đăng thủ công (không phải share dialog — người dùng tự dán caption). */
export const FACEBOOK_COMPOSER_URL = 'https://www.facebook.com/'

/**
 * Ghép preset giọng điệu + độ dài người dùng chọn thành body gửi Backend.
 * @param {string} presetId
 * @param {string} length
 * @returns {{ tone: string, platform: string, length: string }}
 */
export function resolveRequestOptions(presetId, length) {
  const preset = TONE_PRESETS.find((item) => item.presetId === presetId)
    ?? TONE_PRESETS.find((item) => item.presetId === DEFAULT_PRESET)
  const safeLength = LENGTH_OPTIONS.some((item) => item.value === length) ? length : DEFAULT_LENGTH
  return {
    tone: preset.tone,
    platform: PLATFORM,
    length: preset.forcedLength || safeLength,
  }
}
