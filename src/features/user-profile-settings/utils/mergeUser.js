// Gộp họ tên và SĐT mới vào `user` đang lưu trong useAuthStore/localStorage để tên trên Header đổi ngay.
// KHÔNG thay cả đối tượng bằng DTO của /profile: `user` lúc đăng nhập có `roleName`, `role`, `missingFields`… mà DTO không có,
// thay cả đối tượng sẽ làm mất menu và hỏng các guard theo vai trò.
// Ref: .sdd/features/user-profile-settings/SPEC.md (CF6, REQ-F07, AC-F11, P3)

/**
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F07
 * @param {object|null} user  `user` hiện có trong store.
 * @param {{ fullName?: string, phone?: string }} dto  Hồ sơ BE vừa trả về.
 * @returns {object|null} Bản sao của `user` chỉ đổi `fullName` và `phone`; không đột biến đối tượng gốc.
 */
export function mergeIntoUser(user, dto) {
  if (!user) return null
  const merged = { ...user }
  if (dto?.fullName !== undefined) merged.fullName = dto.fullName
  if (dto?.phone !== undefined) merged.phone = dto.phone
  return merged
}
