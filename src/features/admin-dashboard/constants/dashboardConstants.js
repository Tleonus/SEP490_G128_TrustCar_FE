/**
 * KAN-35 – Hằng số cho trang Tổng quan điều hành (/admin/dashboard).
 *
 * Nguồn dữ liệu là API có thật trên Backend, KHÔNG dùng mock:
 *   GET /manage/cars  (car:read) – mọi trạng thái, có price / status / soldAt / make
 *   GET /leads        (ADMIN, SALES_STAFF) – lead mới nhất, đã populate customer + car
 *
 * Backend chưa có API analytics/revenue. Doanh thu vì vậy được cộng từ `price` của xe
 * đã SOLD trong tháng, KHÔNG phải giá chốt thực tế (SaleRecord.finalPrice chưa có route).
 * Trang ghi rõ điều này để người đọc không hiểu nhầm là số liệu kế toán.
 */

/** Số tháng hiển thị trên biểu đồ doanh thu. */
export const REVENUE_MONTHS = 6

/** Số hãng hiển thị riêng trên biểu đồ tròn; phần còn lại gộp thành "Hãng khác". */
export const BRAND_TOP_N = 5

/** Số dòng bảng hoạt động gần đây. */
export const RECENT_LEADS_LIMIT = 10
export const RECENT_SOLD_LIMIT = 5
export const RECENT_NEW_CARS_LIMIT = 5

/** Trạng thái xe chờ duyệt: tab thẩm định + tab mở bán của /admin/approval. */
export const PENDING_INSPECTION_STATUS = 'UNDER_INSPECTION'
export const PENDING_SALE_STATUS = 'APPROVED_CPO'

/** Giới hạn tải danh sách xe: 100 xe/trang (giới hạn của parsePagination), tối đa 20 trang. */
export const CAR_PAGE_LIMIT = 100
export const CAR_MAX_PAGES = 20

/** Bảng màu biểu đồ. Trung tính, đọc được ở cả nền sáng và nền tối. */
export const CHART_COLORS = [
  '#1d4ed8',
  '#0ea5e9',
  '#1d4ed8',
  '#1f8a4c',
  '#8b5cf6',
  '#e05b4c',
  '#64748b',
]
