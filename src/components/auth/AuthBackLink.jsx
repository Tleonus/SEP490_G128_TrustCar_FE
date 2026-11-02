import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

// Link quay lại cho trang quên/đặt lại mật khẩu: đã đăng nhập thì về trang chủ thay vì trang đăng nhập
export default function AuthBackLink() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated
    ? <Link to="/">Về trang chủ</Link>
    : <Link to="/dang-nhap">Quay lại đăng nhập</Link>
}
