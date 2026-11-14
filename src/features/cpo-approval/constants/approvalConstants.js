/**
 * KAN-56 – Hằng số cho bảng điều khiển duyệt của Admin: /admin/approval
 *
 * Lưu ý nghiệp vụ (đã đối chiếu Backend develop, xem báo cáo KAN-56):
 * - Backend hiện KHÔNG có bước Admin duyệt biên bản. POST /inspections/:id/submit
 *   tự chấm điểm và chuyển xe thẳng sang APPROVED_CPO (đạt) hoặc REJECTED (không đạt).
 *   PUT /inspections/:id/approve và PUT /inspections/:id/reject KHÔNG tồn tại.
 * - PUT /inspections/cars/:id/approve-sale (ADMIN) là endpoint thật: APPROVED_CPO → AVAILABLE.
 */

/** Trạng thái xe của từng tab. */
export const APPROVAL_TAB = Object.freeze({
  INSPECTION: 'inspection',
  SALE: 'sale',
})

/** Xe đang kiểm định — tab "Chờ duyệt thẩm định" (dữ liệu thật, thao tác duyệt chưa có API). */
export const INSPECTION_QUEUE_STATUS = 'UNDER_INSPECTION'

/** Xe đạt CPO chờ mở bán — tab "Chờ duyệt mở bán" (dữ liệu thật, API duyệt có thật). */
export const SALE_QUEUE_STATUS = 'APPROVED_CPO'

export const APPROVAL_PAGE_SIZE = 10

/** Mã lỗi Backend liên quan đến duyệt mở bán. */
export const APPROVAL_ERROR_CODE = Object.freeze({
  INVALID_STATUS: 'INVALID_STATUS_FOR_SALE',
  CAR_NOT_FOUND: 'CAR_NOT_FOUND',
})
