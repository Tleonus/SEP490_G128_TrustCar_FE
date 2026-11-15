// Tạo gói PATCH /profile chỉ gồm các trường người dùng thực sự đã đổi (BE hỗ trợ cập nhật một phần).
// Ref: .sdd/features/user-profile-settings/SPEC.md (CF3, CF10, REQ-F06, AC-F06, AC-F08, AC-F09)

const ADDRESS_KEYS = ['street', 'district', 'city', 'province']

/** `+84901234567` và `0901234567` là cùng một số: so sánh bằng dạng 0xxxxxxxxx để không bật nút Lưu vô nghĩa. */
export const normalizePhone = (phone) => {
  const text = (phone ?? '').trim()
  return text.startsWith('+84') ? `0${text.slice(3)}` : text
}

const text = (value) => (value ?? '').trim()

/**
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F06
 * @param {object} original         Hồ sơ đã tải (DTO của GET /profile).
 * @param {object} values           Giá trị đang có trong form (chuỗi; ô trống là '').
 * @param {string[]} editableFields Ô sửa được do BE trả về: chỉ những ô này mới có thể vào gói gửi đi.
 * @returns {{ patch: object, hasChanges: boolean }}
 */
export function buildPatch(original, values, editableFields) {
  const editable = new Set(editableFields)
  const patch = {}

  if (editable.has('fullName') && text(values.fullName) !== text(original.fullName)) patch.fullName = text(values.fullName)

  if (editable.has('phone') && normalizePhone(values.phone) !== normalizePhone(original.phone)) patch.phone = text(values.phone)

  if (editable.has('address')) {
    const address = {}
    for (const key of ADDRESS_KEYS) {
      const next = text(values.address?.[key])
      if (next !== text(original.address?.[key])) address[key] = next // '' = xóa ô đó (BE C9)
    }
    if (Object.keys(address).length > 0) patch.address = address
  }

  if (editable.has('dateOfBirth') && text(values.dateOfBirth) !== text(original.dateOfBirth)) {
    patch.dateOfBirth = text(values.dateOfBirth) === '' ? null : text(values.dateOfBirth)
  }

  if (editable.has('gender') && text(values.gender) !== text(original.gender)) {
    patch.gender = text(values.gender) === '' ? null : text(values.gender)
  }

  return { patch, hasChanges: Object.keys(patch).length > 0 }
}

/** Giá trị ban đầu của form từ DTO: mọi ô là chuỗi ('' khi chưa có) để ô nhập luôn có kiểm soát. */
export function toFormValues(profile) {
  return {
    fullName: profile.fullName ?? '',
    phone: profile.phone ?? '',
    address: Object.fromEntries(ADDRESS_KEYS.map((key) => [key, profile.address?.[key] ?? ''])),
    dateOfBirth: profile.dateOfBirth ?? '',
    gender: profile.gender ?? '',
  }
}
