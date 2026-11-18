/**
 * Chính sách giá tồn kho của showroom: cứ mỗi 2 tháng (60 ngày) kể từ ngày nhập kho,
 * xe được giảm thêm 5% so với giá gốc. Mốc 60 ngày khớp băng tuổi tồn kho đang dùng
 * (0-30 / 31-60 / 60+ ngày) nên mỗi lần chuyển sang "Tồn lâu" là đúng một lần giảm giá.
 */

/** Mỗi đợt giảm cách nhau bao nhiêu ngày. */
export const DROP_INTERVAL_DAYS = 60

/** Tỷ lệ giảm mỗi đợt, tính trên giá gốc (không phải giá đang bán). */
export const DROP_RATE = 0.05

/** Chặn vòng lặp nếu ngày nhập kho bị nhập sai (quá xa trong quá khứ). */
export const MAX_STEPS = 24
