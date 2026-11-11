/**
 * KAN-55 – Hằng số & định nghĩa checklist kiểm định CPO phía Frontend.
 *
 * Nguồn sự thật là `TrustCar-BE-Develop/src/config/inspectionChecklist.js` (version 1.0).
 * Backend KHÔNG có endpoint trả định nghĩa checklist (chỉ trả `itemKey`/`groupKey` trong
 * bản ghi), nên FE phải giữ bản sao nhãn tiếng Việt ở đây để hiển thị. Nếu BE thêm
 * version mới, thêm một nhánh vào `INSPECTION_CHECKLIST_BY_VERSION` — không sửa nhánh cũ,
 * vì mỗi InspectionRecord lưu `checklistVersion` nó được tạo ra.
 */

/** Version checklist mà FE hiểu được. Bản ghi có version khác sẽ bị khoá (chỉ xem). */
export const SUPPORTED_CHECKLIST_VERSION = '1.0'

/** 4 ảnh tổng thể bắt buộc (BE: OVERVIEW_POSITIONS). */
export const OVERVIEW_POSITIONS = ['FRONT', 'REAR', 'LEFT', 'RIGHT']

export const OVERVIEW_POSITION_LABEL = {
  FRONT: 'Trước xe',
  REAR: 'Sau xe',
  LEFT: 'Bên trái',
  RIGHT: 'Bên phải',
}

/** Kết quả của một hạng mục (BE: ItemResult). */
export const ITEM_RESULT = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  NOT_CHECKABLE: 'NOT_CHECKABLE',
}

export const ITEM_RESULT_LABEL = {
  [ITEM_RESULT.PASS]: 'Đạt',
  [ITEM_RESULT.FAIL]: 'Không đạt',
  [ITEM_RESULT.NOT_CHECKABLE]: 'Không kiểm tra được',
}

export const ITEM_RESULT_COLOR = {
  [ITEM_RESULT.PASS]: 'success',
  [ITEM_RESULT.FAIL]: 'error',
  [ITEM_RESULT.NOT_CHECKABLE]: 'warning',
}

/** Giới hạn nhập liệu, khớp INSPECTION_LIMITS của Backend. */
export const INSPECTION_LIMITS = {
  NOTE_MAX_LENGTH: 1000,
  VEHICLE_TEXT_MAX_LENGTH: 100,
  MIN_YEAR: 1980,
  GROUP_PHOTOS_MAX: 10,
  ITEM_PHOTOS_MAX: 5,
  MINOR_DEFECTS_MAX: 20,
  MINOR_DEFECT_PHOTOS_MAX: 5,
}

/** Thư mục Cloudinary dành cho ảnh bằng chứng (BE: INSPECTION_FOLDER_ROOT). */
export const INSPECTION_FOLDER_ROOT = 'trustcar/inspections'

const item = (key, label) => Object.freeze({ key, label })

/**
 * 5 nhóm tiêu chí CPO. Mỗi nhóm có `criteriaKey` là 1 trong 5 boolean mà Backend
 * dùng để quyết định đạt/không đạt (evaluateCPO), nên "5 tiêu chí" = "5 nhóm".
 */
export const INSPECTION_CHECKLIST = Object.freeze([
  Object.freeze({
    key: 'G1_BODY_FRAME',
    label: 'Khung gầm, thân vỏ không đâm va',
    criteriaKey: 'noMajorAccident',
    requiresOdometerPhoto: false,
    items: Object.freeze([
      item('CHASSIS_RAILS', 'Dầm dọc, sắt xi trước/sau không biến dạng hay cắt hàn'),
      item('PILLARS', 'Trụ A/B/C không cắt hàn'),
      item('FLOOR_WHEEL_ARCHES', 'Sàn xe, hốc bánh không biến dạng'),
      item('PANEL_GAPS', 'Khe hở cửa, nắp capo, cốp đều'),
      item('NO_MAJOR_REPAINT', 'Không sơn lại diện rộng do va chạm'),
    ]),
    minorDefectTypes: Object.freeze([
      item('PAINT_SCRATCH_LIGHT', 'Xước sơn nhẹ'),
      item('DENT_MINOR', 'Móp nhẹ không nứt sơn'),
      item('TRIM_SCUFF', 'Trầy nhựa ốp/cản'),
      item('STONE_CHIP', 'Rỗ đá'),
    ]),
  }),
  Object.freeze({
    key: 'G2_FLOOD',
    label: 'Không ngập nước, thủy kích',
    criteriaKey: 'noWaterDamage',
    requiresOdometerPhoto: false,
    items: Object.freeze([
      item('CARPET_FLOOR', 'Sàn, thảm, nỉ không có bùn hay ẩm mốc'),
      item('SEAT_RAILS_BOLTS', 'Ray ghế, bulong chân ghế không gỉ'),
      item('SEATBELTS', 'Dây đai an toàn không vết bùn'),
      item('CONNECTORS_FUSEBOX', 'Giắc điện, hộp cầu chì không bị ôxy hóa'),
      item('CABIN_ODOR', 'Cabin không mùi ẩm mốc'),
    ]),
    minorDefectTypes: Object.freeze([]),
  }),
  Object.freeze({
    key: 'G3_ENGINE_GEARBOX',
    label: 'Động cơ, hộp số nguyên bản',
    criteriaKey: 'engineGearboxIntact',
    requiresOdometerPhoto: false,
    items: Object.freeze([
      item('ENGINE_START_NOISE', 'Nổ máy êm, không tiếng gõ lạ'),
      item('NO_LEAKS', 'Không rò dầu hay nước làm mát'),
      item('ENGINE_BOLTS_UNTOUCHED', 'Ốc nắp máy không có dấu tháo'),
      item('GEARBOX_SHIFTING', 'Hộp số chuyển số êm, không giật'),
      item('EXHAUST_SMOKE', 'Khói xả bình thường'),
    ]),
    minorDefectTypes: Object.freeze([
      item('ENGINE_BAY_TRIM_SCUFF', 'Trầy nhựa ốp khoang máy'),
      item('SURFACE_RUST_LIGHT', 'Gỉ bề mặt nhẹ'),
    ]),
  }),
  Object.freeze({
    key: 'G4_ODOMETER',
    label: 'ODO chuẩn, không tua',
    criteriaKey: 'verifiedOdo',
    requiresOdometerPhoto: true,
    items: Object.freeze([
      item('ODO_MATCHES_SERVICE_HISTORY', 'Số km khớp lịch sử bảo dưỡng'),
      item('WEAR_MATCHES_ODO', 'Độ mòn vô lăng, bàn đạp, ghế phù hợp số km'),
      item('CLUSTER_UNTAMPERED', 'Cụm đồng hồ không có dấu can thiệp'),
    ]),
    minorDefectTypes: Object.freeze([]),
  }),
  Object.freeze({
    key: 'G5_ELECTRICAL_SAFETY',
    label: 'Điện tử, an toàn hoạt động tốt',
    criteriaKey: 'electricalSystemPassed',
    requiresOdometerPhoto: false,
    items: Object.freeze([
      item('LIGHTS', 'Đèn chiếu sáng, xi nhan, đèn phanh'),
      item('DASHBOARD_WARNINGS', 'Không có đèn cảnh báo trên táp lô (kể cả túi khí)'),
      item('BRAKES_ABS', 'Phanh, ABS'),
      item('AIR_CONDITIONING', 'Điều hòa'),
      item('WINDOWS_LOCKS_MIRRORS', 'Kính điện, khóa cửa, gương'),
      item('INFOTAINMENT_CAMERA', 'Màn hình, âm thanh, camera'),
    ]),
    minorDefectTypes: Object.freeze([
      item('SCREEN_SCRATCH_LIGHT', 'Trầy màn hình nhẹ'),
      item('BUTTON_WEAR', 'Nút bấm mòn'),
    ]),
  }),
])

export const INSPECTION_CHECKLIST_BY_VERSION = {
  [SUPPORTED_CHECKLIST_VERSION]: INSPECTION_CHECKLIST,
}

/** Trả về định nghĩa checklist theo version của bản ghi; null nếu FE chưa hỗ trợ. */
export function getChecklistByVersion(version) {
  return INSPECTION_CHECKLIST_BY_VERSION[version || SUPPORTED_CHECKLIST_VERSION] || null
}

/**
 * Ánh xạ id tiêu chí của component có sẵn `TrustCarInspectionChecklist.jsx`
 * (chassis/engine/flood/odometer/safety) sang groupKey của Backend.
 * Thứ tự hiển thị của component giữ nguyên 01→05, không sửa component.
 */
export const CRITERION_TO_GROUP = {
  chassis: 'G1_BODY_FRAME',
  engine: 'G3_ENGINE_GEARBOX',
  flood: 'G2_FLOOD',
  odometer: 'G4_ODOMETER',
  safety: 'G5_ELECTRICAL_SAFETY',
}

export const GROUP_TO_CRITERION = Object.fromEntries(
  Object.entries(CRITERION_TO_GROUP).map(([criterionId, groupKey]) => [groupKey, criterionId]),
)

/** Nhãn 5 tiêu chí theo criteriaKey (dùng khi liệt kê tiêu chí không đạt). */
export const CRITERIA_LABEL = Object.fromEntries(
  INSPECTION_CHECKLIST.map((group) => [group.criteriaKey, group.label]),
)

/** Trạng thái xe cho phép bắt đầu kiểm định (BE: INSPECTABLE_CAR_STATUSES). */
export const INSPECTABLE_CAR_STATUSES = ['DRAFT', 'INCOMING', 'REJECTED', 'UNDER_INSPECTION']

/** Trạng thái xe hiển thị ở màn danh sách theo yêu cầu KAN-55. */
export const QUEUE_CAR_STATUSES = ['DRAFT', 'UNDER_INSPECTION', 'REJECTED']

/** Nhãn + màu tag cho trạng thái xe. Bổ sung các trạng thái kiểm định mà utils/constants.js chưa có. */
export const CAR_STATUS_META = {
  DRAFT: { label: 'Bản nháp', color: 'default' },
  INCOMING: { label: 'Mới nhập', color: 'blue' },
  UNDER_INSPECTION: { label: 'Đang kiểm định', color: 'processing' },
  APPROVED_CPO: { label: 'Đạt chuẩn CPO', color: 'gold' },
  REJECTED: { label: 'Kiểm định không đạt', color: 'error' },
  MAINTENANCE: { label: 'Đang bảo dưỡng', color: 'orange' },
  AVAILABLE: { label: 'Đang bán', color: 'success' },
  RESERVED: { label: 'Đã đặt cọc', color: 'gold' },
  SOLD: { label: 'Đã bán', color: 'default' },
  DELISTED: { label: 'Đã gỡ bán', color: 'red' },
}

export const INSPECTION_STATUS_META = {
  DRAFT: { label: 'Nháp', color: 'default' },
  SUBMITTED: { label: 'Đã gửi', color: 'blue' },
}

export const INSPECTION_RESULT_META = {
  PASSED: { label: 'Đạt chuẩn CPO', color: 'success' },
  FAILED: { label: 'Không đạt chuẩn CPO', color: 'error' },
}

/** Mã lỗi Backend của luồng kiểm định (dùng để dịch thông báo và xử lý nhánh). */
export const INSPECTION_ERROR_CODE = {
  DRAFT_EXISTS: 'INSPECTION_DRAFT_EXISTS',
  LOCKED: 'INSPECTION_LOCKED',
  NOT_FOUND: 'INSPECTION_NOT_FOUND',
  CAR_NOT_FOUND: 'CAR_NOT_FOUND',
  INVALID_CAR_STATUS: 'INVALID_CAR_STATUS',
  INCOMPLETE: 'INSPECTION_INCOMPLETE',
  EVIDENCE_REQUIRED: 'EVIDENCE_REQUIRED',
  MILEAGE_DECREASE: 'MILEAGE_DECREASE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UPLOAD_NOT_CONFIGURED: 'UPLOAD_NOT_CONFIGURED',
}

/** Trạng thái vòng đời biên bản (InspectionStatus của BE chỉ có 2 giá trị). */
export const INSPECTION_STATUS = { DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED' }

export const QUEUE_PAGE_SIZE = 10

/** Nhãn các trường thông tin xe đã xác nhận tại xưởng. */
export const VEHICLE_INFO_FIELDS = [
  { key: 'make', label: 'Hãng xe', type: 'text' },
  { key: 'model', label: 'Dòng xe', type: 'text' },
  { key: 'variant', label: 'Phiên bản', type: 'text' },
  { key: 'color', label: 'Màu sơn', type: 'text' },
  { key: 'year', label: 'Năm sản xuất', type: 'number' },
  { key: 'mileage', label: 'Số km thực tế (ODO)', type: 'number' },
]
