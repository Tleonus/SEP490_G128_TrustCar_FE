import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { hasAnyRole } from '../utils/roles'

/**
 * KAN-56 – Chỉ ADMIN vào được /admin/approval, /admin/nhat-ky, /admin/nguoi-dung.
 * AdminRoute bên ngoài đã chặn khách chưa đăng nhập và role ngoài khu quản trị,
 * nên guard này chỉ phân biệt ADMIN với các role nhân sự khác. Backend vẫn kiểm
 * quyền cuối cùng (PUT approve-sale trả 403 với role khác).
 *
 * KAN-93: xét toàn bộ roleNames — người giữ ADMIN ở bất kỳ vị trí nào vẫn vào được.
 */
export default function AdminOnlyRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!hasAnyRole(user, ['ADMIN'])) {
    return <Navigate to="/admin/overview" state={{ from: location }} replace />
  }

  return children
}
