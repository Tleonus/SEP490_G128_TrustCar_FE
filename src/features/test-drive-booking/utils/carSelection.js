// Hàm thuần chọn tối đa 3 xe cho một lượt lái thử (không đụng React hay mạng).
// Phần tử đầu của danh sách là xe đang xem (cố định, không bỏ được).
// Ref: .sdd/features/test-drive-booking/SPEC.md#REQ-F02, #REQ-F04

import { CAR_ID_REGEX, MAX_CARS } from '../constants/testDriveConstants'
import { getCarTitle, getCoverImage } from '../../../utils/car'

/** Id xe hợp lệ của BE; xe dữ liệu mẫu không đặt được. */
export const isCarId = (id) => typeof id === 'string' && CAR_ID_REGEX.test(id)

const norm = (id) => String(id).toLowerCase()

/**
 * Chuyển một xe (từ API công khai) thành mục chọn { id, title, vehicleCode, image }, hoặc null nếu id không hợp lệ.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 */
export function toCarItem(car) {
  const id = car?._id ?? car?.id
  if (!isCarId(id)) return null
  return {
    id: norm(id),
    title: getCarTitle(car) || 'Xe',
    vehicleCode: car.vehicleCode ?? car.stockCode ?? null,
    image: getCoverImage(car)?.url ?? null,
  }
}

/**
 * Có thêm được `id` vào danh sách không? Trả 'ok' | 'invalid' | 'duplicate' | 'full'.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F04
 */
export function canAdd(selected, id) {
  if (!isCarId(id)) return 'invalid'
  if (selected.some((item) => item.id === norm(id))) return 'duplicate'
  if (selected.length >= MAX_CARS) return 'full'
  return 'ok'
}

/** Danh sách mới có thêm `item`; không thêm được thì trả lại đúng danh sách cũ. */
export function addCar(selected, item) {
  return item && canAdd(selected, item.id) === 'ok' ? [...selected, item] : selected
}

/** Bỏ xe `id`; xe cố định (`lockedId`, xe đang xem) không bỏ được. */
export function removeCar(selected, id, lockedId) {
  if (lockedId && norm(id) === norm(lockedId)) return selected
  return selected.filter((item) => item.id !== norm(id))
}

/**
 * Tách ô tìm xe thành các từ khóa. API công khai chỉ khớp *một trường* mỗi lần (hãng, dòng xe hoặc mã xe)
 * nên "Mazda CX-5" không có kết quả; vì vậy gửi lên API từ dài nhất (`apiTerm`) rồi lọc lại bằng `matchesTerms`.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 * @returns {{ apiTerm: string, terms: string[] }}
 */
export function splitSearch(text) {
  const terms = String(text ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const apiTerm = terms.reduce((best, term) => (term.length > best.length ? term : best), '')
  return { apiTerm, terms }
}

/** Mục chọn (tên + mã xe) có chứa mọi từ khóa không? Không phân biệt hoa/thường. */
export function matchesTerms(item, terms) {
  const haystack = `${item.title} ${item.vehicleCode ?? ''}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export const carIdsOf = (selected) => selected.map((item) => item.id)

/** Bảng id → tên xe, để ghi tên xe bị kín vào lý do của khung. */
export const carNamesOf = (selected) => Object.fromEntries(selected.map((item) => [item.id, item.title]))
