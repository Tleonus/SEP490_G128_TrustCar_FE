/**
 * KAN-93: một tài khoản có thể giữ nhiều vai trò. Mọi guard/route đọc role phải
 * xét toàn bộ `roleNames` thay vì mỗi `roleName` (role chính) để nhân sự kiêm
 * nhiệm (vd SALES_STAFF + INSPECTOR) không bị chặn nhầm.
 */

/** Trả về mảng tên role của user, chấp nhận cả payload cũ chỉ có roleName. */
export function rolesOf(user) {
  if (!user) return []
  if (Array.isArray(user.roleNames) && user.roleNames.length) return user.roleNames
  return user.roleName ? [user.roleName] : []
}

/** User có ít nhất một trong các role được liệt kê. */
export function hasAnyRole(user, roles) {
  const owned = rolesOf(user)
  return roles.some((role) => owned.includes(role))
}
