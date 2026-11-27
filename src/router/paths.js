export const ADMIN_PATHS = {
  // KAN-35: trang tổng quan hợp nhất. /admin/dashboard cũ chuyển hướng về đây.
  overview: '/admin/overview',
  inventory: '/admin/inventory',
  vehicleIntake: '/admin/vehicle-intake',
  inspection: '/admin/inspection',
  inspectionDashboard: '/admin/inspection-dashboard',
  // KAN-56: bảng điều khiển duyệt kiểm định & mở bán (chỉ ADMIN)
  approval: '/admin/approval',
  sales: '/admin/sales',
  // KAN-22: quản lý lượt đặt cọc giữ xe (ADMIN + SALES_STAFF; hoàn cọc chỉ ADMIN)
  deposits: '/admin/deposits',
  baseSettings: '/admin/base-settings',
  cpoCertificates: '/admin/chung-nhan',
  // KAN-40: nhật ký hoạt động hệ thống (chỉ ADMIN)
  auditLogs: '/admin/nhat-ky',
  // KAN-93: quản lý nhân sự & gán nhiều vai trò (chỉ ADMIN)
  userManagement: '/admin/nguoi-dung',
  // KAN-96: dịch vụ showroom (CRUD + xem lịch)
  services: '/admin/dich-vu',
  // Lãi suất các ngân hàng cho trang tính trả góp (chỉ ADMIN)
  loanSettings: '/admin/lai-suat-tra-gop',
}

