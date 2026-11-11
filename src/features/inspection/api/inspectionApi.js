/**
 * KAN-55 – Tầng API của màn kiểm định (chỉ gọi endpoint Backend đã có, không tạo endpoint mới).
 *
 * Backend (TrustCar-BE-Develop/src/routes/inspectionRoutes.js), tất cả yêu cầu đăng nhập,
 * quyền SALES_STAFF hoặc ADMIN:
 *   GET    /manage/cars?status=…              danh sách xe (quyền car:read) – màn danh sách
 *   GET    /manage/cars/:id                   chi tiết xe (populate createdBy) – khối thông tin xe
 *   POST   /inspections/cars/:id/draft        tạo biên bản nháp, xe → UNDER_INSPECTION
 *   GET    /inspections/:id                   đọc biên bản (nháp hoặc đã gửi)
 *   PATCH  /inspections/:id                   lưu từng phần của biên bản nháp
 *   POST   /inspections/:id/upload-signature  chữ ký upload ảnh vào thư mục của biên bản
 *   POST   /inspections/:id/submit            chấm điểm CPO, khoá biên bản, đổi trạng thái xe
 *   POST   /inspections/cars/:id/inspect      kiểm định nhanh 5 boolean (không dùng ở màn này)
 *
 * Envelope: { success, message, data, meta? }; lỗi: { success:false, message, code, errors? }.
 */

import api from '../../../services/api'
import { INSPECTION_ERROR_CODE, QUEUE_CAR_STATUSES, QUEUE_PAGE_SIZE } from '../constants/inspectionConstants'

/**
 * `carService.getCars` của BE gán thẳng `filter.status = query.status`, nên gửi lặp tham số
 * `status` (status=A&status=B) để MongoDB lọc theo $in. Không dùng `params` dạng mảng của axios
 * vì axios mặc định serialise thành `status[]=A`, BE sẽ không đọc được.
 */
function buildCarsQuery({ statuses, search, page, limit, sortBy = 'createdAt', sortDir = 'desc' }) {
  const params = new URLSearchParams()
  ;(statuses || []).forEach((status) => params.append('status', status))
  if (search) params.set('search', search)
  params.set('page', String(page))
  params.set('limit', String(limit))
  params.set('sortBy', sortBy)
  params.set('sortDir', sortDir)
  return params.toString()
}

/**
 * Danh sách xe cần kiểm định (DRAFT, UNDER_INSPECTION, REJECTED).
 * @returns {Promise<{ items: object[], meta: object|null }>}
 */
export async function listInspectionQueueCars({
  statuses = QUEUE_CAR_STATUSES,
  search = '',
  page = 1,
  limit = QUEUE_PAGE_SIZE,
} = {}) {
  const { data } = await api.get(`/manage/cars?${buildCarsQuery({ statuses, search, page, limit })}`)
  return { items: data?.data ?? [], meta: data?.meta ?? null }
}

/** Chi tiết xe ở khu quản trị (mọi trạng thái, có createdBy.fullName). */
export async function getManagedCar(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  return data?.data ?? null
}

/** POST /inspections/cars/:carId/draft — tạo biên bản nháp mới cho xe. */
export async function createInspectionDraft(carId) {
  const { data } = await api.post(`/inspections/cars/${encodeURIComponent(carId)}/draft`)
  return data?.data ?? null
}

/** GET /inspections/:id — đọc biên bản theo id. */
export async function getInspection(inspectionId) {
  const { data } = await api.get(`/inspections/${encodeURIComponent(inspectionId)}`)
  return data?.data ?? null
}

/**
 * PATCH /inspections/:id — lưu từng phần biên bản.
 * BE thay thế TRỌN VẸN mỗi section được gửi: vehicleInfo.confirmed, overviewPhotos, từng group.
 * Section không gửi tới thì giữ nguyên. Trường lạ (status, result, notes…) bị BE loại bỏ.
 * @param {string} inspectionId
 * @param {{ vehicleInfo?: object, overviewPhotos?: object, groups?: object[] }} patch
 */
export async function saveInspectionDraft(inspectionId, patch) {
  const { data } = await api.patch(`/inspections/${encodeURIComponent(inspectionId)}`, patch)
  return data?.data ?? null
}

/**
 * POST /inspections/:id/submit — gửi biên bản.
 * BE đọc bản ghi ĐÃ LƯU trong DB để chấm, nên phải PATCH trước khi gọi hàm này.
 * @returns {Promise<{ car: object, inspectionRecord: object }>}
 */
export async function submitInspection(inspectionId) {
  const { data } = await api.post(`/inspections/${encodeURIComponent(inspectionId)}/submit`)
  return data?.data ?? null
}

/** POST /inspections/:id/upload-signature — chữ ký upload ảnh cho biên bản đang mở. */
export async function requestDraftUploadSignature(inspectionId) {
  const { data } = await api.post(`/inspections/${encodeURIComponent(inspectionId)}/upload-signature`)
  return data?.data ?? null
}

/**
 * POST /inspections/cars/:id/inspect — kiểm định nhanh 5 boolean.
 * Màn hình KAN-55 dùng luồng checklist (draft → PATCH → submit); hàm này được giữ để
 * tái sử dụng khi cần chấm nhanh, đúng theo API BE đang có.
 */
export async function quickInspectCar(carId, { criteria, odo, notes = '', evidenceImages = [] }) {
  const { data } = await api.post(`/inspections/cars/${encodeURIComponent(carId)}/inspect`, {
    criteria,
    odo,
    notes,
    evidenceImages,
  })
  return data?.data ?? null
}

// ── Xử lý lỗi ───────────────────────────────────────────────────────────────

export function errorCodeOf(error) {
  return error?.response?.data?.code || null
}

export function errorStatusOf(error) {
  return error?.response?.status || 0
}

/**
 * BE báo "xe đã có biên bản nháp" bằng lỗi 409 INSPECTION_DRAFT_EXISTS và đặt id của
 * biên bản đó vào errors[0].message (xem inspectionShared.draftExistsError).
 * Đây là cách duy nhất để lấy id biên bản nháp từ carId, vì BE không có
 * endpoint liệt kê biên bản theo xe.
 */
export function extractExistingDraftId(error) {
  if (errorCodeOf(error) !== INSPECTION_ERROR_CODE.DRAFT_EXISTS) return null
  const details = error?.response?.data?.errors
  const entry = Array.isArray(details)
    ? details.find((detail) => detail?.field === 'inspectionId') || details[0]
    : null
  const id = entry?.message || entry?.inspectionId || null
  return id && /^[0-9a-fA-F]{24}$/.test(String(id)) ? String(id) : null
}

/**
 * "Tạo hoặc tải Inspection Draft": thử tạo mới; nếu xe đã có nháp thì lấy id từ lỗi 409
 * rồi đọc biên bản đó lên. Không tạo bản ghi trùng.
 * @returns {Promise<{ record: object, created: boolean }>}
 */
export async function loadOrCreateInspectionDraft(carId) {
  try {
    const record = await createInspectionDraft(carId)
    if (!record) throw new Error('Backend không trả về biên bản nháp.')
    return { record, created: true }
  } catch (error) {
    const existingId = extractExistingDraftId(error)
    if (!existingId) throw error
    const record = await getInspection(existingId)
    if (!record) throw error
    return { record, created: false }
  }
}
