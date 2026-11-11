import { ADMIN_PATHS } from '../../../router/paths'

// Các giai đoạn kiểm định theo trạng thái xe (CarStatus) của backend.
// Mỗi thẻ dẫn sang màn đang xử lý giai đoạn đó: kho xe (xe mới nhập), hàng đợi kiểm định
// /admin/inspection (bản nháp, đang kiểm định, không đạt) và màn duyệt mở bán /admin/approval (chỉ ADMIN).
export const DASHBOARD_STAGES = [
  { status: 'INCOMING', label: 'Mới nhập', hint: 'Chưa mở biên bản kiểm định', color: 'blue' },
  { status: 'DRAFT', label: 'Bản nháp', hint: 'Hồ sơ xe chưa hoàn tất', color: 'default' },
  { status: 'UNDER_INSPECTION', label: 'Đang kiểm định', hint: 'Biên bản đang điền, chưa gửi', color: 'gold' },
  { status: 'REJECTED', label: 'Không đạt', hint: 'Cần kiểm định lại hoặc gỡ xe', color: 'red' },
  { status: 'APPROVED_CPO', label: 'Chờ mở bán', hint: 'Đạt CPO, chờ ADMIN mở bán', color: 'green' },
]

// Xe còn việc kiểm định phải làm; danh sách "chờ lâu nhất" lấy từ các trạng thái này.
export const PENDING_STATUSES = ['INCOMING', 'DRAFT', 'UNDER_INSPECTION', 'REJECTED']

export const OLDEST_PENDING_LIMIT = 5

/**
 * Trang xử lý một giai đoạn. null khi tài khoản không vào được trang đó
 * (màn duyệt mở bán chỉ dành cho ADMIN).
 */
export function getStageLink(status, roleName) {
  if (status === 'INCOMING') return `${ADMIN_PATHS.inventory}?status=INCOMING`
  if (status === 'APPROVED_CPO') return roleName === 'ADMIN' ? ADMIN_PATHS.approval : null
  return `${ADMIN_PATHS.inspection}?status=${status}`
}

export function getInspectionDetailLink(carId) {
  return `${ADMIN_PATHS.inspection}/${encodeURIComponent(carId)}`
}
