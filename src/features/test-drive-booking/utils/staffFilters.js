// Dựng tham số truy vấn danh sách lượt cho nhân viên từ trạng thái bộ lọc trên giao diện.
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F14

import { STAFF_PAGE_SIZE } from '../constants/testDriveConstants'

/** Bộ lọc mặc định: tất cả lượt từ hôm nay (BE mặc định "từ 00:00 hôm nay"). */
export const DEFAULT_STAFF_FILTERS = Object.freeze({ quick: 'ALL', status: 'ALL', from: '', to: '', sort: 'asc' })

/**
 * Các nút nhanh "Chờ xác nhận" (PENDING), "Xe không còn bán" (CAR_UNAVAILABLE), "Gọi nhắc" (REMINDER) và
 * "Cần chốt kết quả" (OUTCOME) thắng ô chọn trạng thái, vì đó là những việc nhân viên cần làm ngay.
 * REMINDER/OUTCOME chỉ gửi `true`, không bao giờ gửi `false`. Khoảng ngày sai thứ tự (`from` > `to`) thì bỏ `to`.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F14
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F30
 * @returns {{ status?: string, cancellationType?: string, needsReminderCall?: true, needsOutcome?: true, from?: string, to?: string, page: number, limit: number }}
 */
export function buildStaffParams(filters, page = 1) {
  const { quick, status, from, to, sort } = { ...DEFAULT_STAFF_FILTERS, ...filters }
  const params = { page, limit: STAFF_PAGE_SIZE }

  if (quick === 'PENDING') params.status = 'PENDING'
  else if (quick === 'CAR_UNAVAILABLE') params.cancellationType = 'CAR_UNAVAILABLE'
  else if (quick === 'REMINDER') params.needsReminderCall = true
  else if (quick === 'OUTCOME') params.needsOutcome = true
  else if (status && status !== 'ALL') params.status = status

  if (sort === 'desc') params.sort = 'desc' // mặc định 'asc' không gửi để chạy được cả với BE 1.1.0
  if (from) params.from = from
  if (to && !(from && from > to)) params.to = to
  return params
}

/** Khoảng ngày nhập sai thứ tự? (để nhắc người dùng). */
export const isRangeReversed = ({ from, to }) => Boolean(from && to && from > to)

const dmy = (key) => {
  const [y, m, d] = String(key).split('-')
  return `${d}/${m}/${y}`
}

/**
 * Dòng mô tả khoảng và thứ tự đang xem (REQ-F43): khoảng ngày theo bộ lọc (trống = từ hôm nay) và thứ tự phần
 * không ghim. Khoảng ngày ngược thứ tự thì mô tả như BE xử lý (bỏ "Đến ngày").
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F43
 */
export function describeView(filters) {
  const { from, to, sort } = { ...DEFAULT_STAFF_FILTERS, ...filters }
  const useTo = to && !(from && from > to)
  let range = 'từ hôm nay trở đi'
  if (from && useTo) range = `từ ${dmy(from)} đến ${dmy(to)}`
  else if (from) range = `từ ${dmy(from)} trở đi`
  else if (useTo) range = `từ hôm nay đến ${dmy(to)}`
  const order = sort === 'desc' ? 'mới nhất trước' : 'gần nhất trước'
  return `Đang xem ${range} · ${order}. Lượt cần xử lý luôn ở đầu.`
}
