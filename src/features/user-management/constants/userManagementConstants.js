/**
 * Nhãn tiếng Việt + màu badge cho từng role. Dùng chung cho danh sách nhân sự
 * và các dropdown gán role (KAN-93/KAN-94).
 */
export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  SALES_STAFF: 'Nhân viên bán hàng',
  INSPECTOR: 'Kiểm định viên',
  CUSTOMER: 'Khách hàng',
}

/** Role hiển thị trên màn quản lý nhân sự (CUSTOMER tự đăng ký, không quản lý ở đây). */
export const STAFF_ROLE_ORDER = ['ADMIN', 'SALES_STAFF', 'INSPECTOR']

export function roleLabel(roleName) {
  return ROLE_LABELS[roleName] || roleName
}

/** Màu badge theo role — tông giống các màn quản trị hiện có. */
export function roleBadgeClass(roleName) {
  switch (roleName) {
    case 'ADMIN': return 'badgeAdmin'
    case 'INSPECTOR': return 'badgeInspector'
    case 'SALES_STAFF': return 'badgeSales'
    default: return 'badgeDefault'
  }
}
