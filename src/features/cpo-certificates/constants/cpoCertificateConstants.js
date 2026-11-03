import { CAR_STATUS_LABEL, CAR_STATUS_COLOR } from '../../../utils/constants'

/**
 * Kiểu dữ liệu dùng chung của tính năng chứng nhận CPO.
 *
 * @typedef {Object} CertifiedVehicle  Thông tin xe đã xác nhận tại kiểm định (không có VIN, số máy).
 * @property {string|null} make
 * @property {string|null} model
 * @property {string|null} variant
 * @property {string|null} color
 * @property {number|null} year
 * @property {number|null} mileage  Số km đọc tại kiểm định, không phải số người bán khai báo.
 *
 * @typedef {Object} CertificateListItem  Một dòng trong danh sách chứng nhận.
 * @property {string} carId           ObjectId của xe.
 * @property {string} vehicleCode     Mã xe TC-YYYY-NNNN.
 * @property {string} certificateId   Mã CPO-YYYYMMDD-XXXX.
 * @property {string|null} issuedAt   ISO date, lấy từ phần ngày trong mã CPO.
 * @property {string} carStatus       Trạng thái hiện tại của xe (CarStatus của BE).
 * @property {CertifiedVehicle} vehicle
 *
 * @typedef {Object} ReportGroup  Kết quả một nhóm trong báo cáo công khai (BE inspectionReportMapper).
 * @property {string} key
 * @property {string} label
 * @property {boolean} passed
 * @property {{key: string, label: string, result: string}[]} items
 * @property {string[]} photos
 * @property {{type: string, label: string, location: string, description: string, photos: string[]}[]} minorDefects
 *
 * @typedef {Object} PublicInspectionReport  GET /public/cars/:id/inspection-report → data.
 * @property {string} certificateId
 * @property {string|null} issuedAt
 * @property {'FULL'|'MINIMAL'} level
 * @property {string|null} inspector  Tên viết tắt, ví dụ "N.V.A.".
 * @property {CertifiedVehicle} vehicle
 * @property {Object<string, string|null>|null} overviewPhotos  FRONT/REAR/LEFT/RIGHT, chỉ có ở FULL.
 * @property {ReportGroup[]} groups
 * @property {string[]} photos  Ảnh chung, chỉ có ở MINIMAL (xe duyệt qua /inspect cũ).
 * @property {string} scopeNote
 */

export const REPORT_LEVEL = Object.freeze({ FULL: 'FULL', MINIMAL: 'MINIMAL' })

// Chỉ xe ở 2 trạng thái này có báo cáo công khai (BE inspectionReportService), nên chỉ chúng được tạo QR.
export const QR_ELIGIBLE_STATUSES = Object.freeze(['APPROVED_CPO', 'AVAILABLE'])

// Trạng thái xe có thể gặp ở xe đã từng được cấp chứng nhận.
export const CERT_CAR_STATUS_LABEL = Object.freeze({
  APPROVED_CPO: 'Đạt CPO, chờ đăng bán',
  ...CAR_STATUS_LABEL,
})

export const CERT_CAR_STATUS_COLOR = Object.freeze({
  APPROVED_CPO: 'cyan',
  ...CAR_STATUS_COLOR,
})

export const CERT_STATUS_FILTER_OPTIONS = ['APPROVED_CPO', 'AVAILABLE', 'RESERVED', 'SOLD', 'DELISTED'].map(
  (value) => ({ value, label: CERT_CAR_STATUS_LABEL[value] }),
)

export const CERT_SORT_OPTIONS = Object.freeze([
  { value: 'issuedAt:desc', label: 'Ngày cấp mới nhất' },
  { value: 'issuedAt:asc', label: 'Ngày cấp cũ nhất' },
  { value: 'certificateId:asc', label: 'Mã CPO A → Z' },
])

export const DEFAULT_CERT_SORT = 'issuedAt:desc'
export const CERT_PAGE_SIZE = 10

// Dòng phạm vi in trên tem và hiển thị trên trang chi tiết.
export const CERT_SCOPE_LINE = 'Phạm vi: kiểm tra ngoại quan và vận hành theo 5 nhóm; chưa đối chiếu số khung, số máy.'

export const QR_OPTIONS = Object.freeze({
  errorCorrectionLevel: 'Q',
  margin: 4, // vùng trắng 4 module theo chuẩn để máy quét nhận biên
  pngWidth: 1024, // đủ nét khi in tem 4–5 cm
  color: { dark: '#000000', light: '#ffffff' },
})

// Route trang chi tiết xe công khai trên FE (AppRouter: /xe/:stockCode, nhận ObjectId hoặc mã xe).
export const PUBLIC_CAR_PATH = '/xe'
