// Kiểm tra nhanh phía FE (chỉ để gợi ý; BE mới là nơi quyết định). Chỉ kiểm các ô nhân viên/khách thực sự sửa được.
// Ref: .sdd/features/user-profile-settings/SPEC.md (CF9, REQ-F05, AC-F06, AC-F07)

import { normalizePhone } from './buildPatch'
import { isValidDob } from './dob'

export const LIMITS = Object.freeze({
  NAME_MIN: 2, NAME_MAX: 100, STREET_MAX: 200, ADDRESS_PART_MAX: 100,
})

const PHONE = /^(0\d{9}|\+84\d{9})$/

const ADDRESS_LABELS = Object.freeze({
  street: 'Số nhà, đường',
  district: 'Quận/huyện',
  city: 'Thành phố',
  province: 'Tỉnh',
})

/**
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F05
 * @param {{ fullName?: string, phone?: string, address?: object, dateOfBirth?: string, gender?: string }} values
 * @param {string[]} editableFields  Danh sách ô sửa được do BE trả về (CF10).
 * @param {string} todayISO          Ngày hôm nay `YYYY-MM-DD` (cho kiểm tra ngày sinh).
 * @param {object} [original]        Hồ sơ đã tải. Ô KHÔNG đổi so với bản gốc thì không bị kiểm tra: một tài khoản có sẵn
 *   dữ liệu cũ không hợp lệ (ví dụ quản trị viên chưa có SĐT) vẫn lưu được các ô khác mà không bị chặn vì ô họ không sửa.
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateProfile(values, editableFields, todayISO, original = null) {
  const errors = {}
  const editable = new Set(editableFields)
  const unchanged = (field, same) => original !== null && same(values[field], original[field])

  if (editable.has('fullName') && !unchanged('fullName', (a, b) => (a ?? '').trim() === (b ?? '').trim())) {
    const name = (values.fullName ?? '').trim()
    if (name.length < LIMITS.NAME_MIN || name.length > LIMITS.NAME_MAX) {
      errors.fullName = `Họ tên phải từ ${LIMITS.NAME_MIN} đến ${LIMITS.NAME_MAX} ký tự.`
    }
  }

  if (editable.has('phone') && !unchanged('phone', (a, b) => normalizePhone(a) === normalizePhone(b)) && !PHONE.test((values.phone ?? '').trim())) {
    errors.phone = 'Số điện thoại không hợp lệ (0xxxxxxxxx hoặc +84xxxxxxxxx).'
  }

  if (editable.has('address')) {
    for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
      const max = key === 'street' ? LIMITS.STREET_MAX : LIMITS.ADDRESS_PART_MAX
      if ((values.address?.[key] ?? '').trim().length > max) errors[`address.${key}`] = `${label} không được quá ${max} ký tự.`
    }
  }

  const dob = values.dateOfBirth ?? ''
  if (editable.has('dateOfBirth') && dob !== '' && !unchanged('dateOfBirth', (a, b) => (a ?? '') === (b ?? '')) && !isValidDob(dob, todayISO)) {
    errors.dateOfBirth = 'Ngày sinh không hợp lệ (từ 01/01/1900 đến hôm nay).'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
