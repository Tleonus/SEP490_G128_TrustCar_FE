import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// Khớp Roles thật của backend (TrustCar-BE-Develop/src/constants/appConstants.js):
// ADMIN và SALES_STAFF đều có quyền car:read trên /manage/cars (ROLE_PERMISSIONS),
// nên khu vực quản trị cho cả 2 role này, không chỉ riêng ADMIN.
const ADMIN_ROLES = ['ADMIN', 'SALES_STAFF']

export default function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />
  }

  // roleName là field string thật trả về từ backend (user.toSafeObject()), không phải user.role
  // (user.role là object Role đã populate, chứa permissions...).
  if (!ADMIN_ROLES.includes(user?.roleName)) {
    return <Navigate to="/" replace />
  }

  return children
}
