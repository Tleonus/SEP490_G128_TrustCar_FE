/**
 * KAN-66 – Hằng số cho màn chọn ảnh chia sẻ mạng xã hội: /admin/inventory/:id
 *
 * Khung preview mô phỏng thẻ chia sẻ Facebook theo tỷ lệ chuẩn 1200x630 (1.91:1).
 * Backend chưa có PATCH /manage/cars/:id/social-image (xem báo cáo KAN-66):
 * FE vẫn gọi đúng endpoint ticket yêu cầu và hiển thị lỗi thật, không giả lập lưu thành công.
 */

/** Tỷ lệ khung preview: 1200 / 630. */
export const SHARE_ASPECT = 1200 / 630

/** Kích thước hiển thị của khung preview (px). */
export const PREVIEW_WIDTH = 600
export const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH / SHARE_ASPECT)

/** Giới hạn upload ảnh xe của Backend (uploadMiddleware: 5 MB/file, tối đa 10 file/lần, 20 ảnh/xe). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES_PER_CAR = 20

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

/** Tên miền hiển thị trên thẻ preview. Crawler thật dùng host của trang chia sẻ (KAN-64). */
export const SHARE_DOMAIN_LABEL = 'trustcar.vn'
