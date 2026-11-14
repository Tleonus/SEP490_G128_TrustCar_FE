import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

/**
 * KAN-56 – Chỉ ADMIN vào được /admin/approval.
 * AdminRoute bên ngoài đã chặn khách chưa đăng nhập và role ngoài khu quản trị,
 * nên guard này chỉ phân biệt ADMIN với SALES_STAFF. Backend vẫn kiểm quyền
 * cuối cùng (PUT approve-sale trả 403 với role khác).
 */
export default function AdminOnlyRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (user?.roleName !== 'ADMIN') {
    return <Navigate to="/admin/overview" state={{ from: location }} replace />
  }

  return children
}
