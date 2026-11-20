import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { hasAnyRole } from '../utils/roles'

// Khớp Roles thật của backend (TrustCar-BE-Develop/src/constants/appConstants.js):
// ADMIN, SALES_STAFF và INSPECTOR đều có quyền đọc trong khu quản trị
// (inspection:read / car:read), nên cả 3 role vào được; BE vẫn kiểm quyền cuối cùng.
const ADMIN_ROLES = ['ADMIN', 'SALES_STAFF', 'INSPECTOR']

export default function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />
  }

  // KAN-93: kiểm tra toàn bộ roleNames, không chỉ role chính.
  if (!hasAnyRole(user, ADMIN_ROLES)) {
    return <Navigate to="/" replace />
  }

  return children
}
