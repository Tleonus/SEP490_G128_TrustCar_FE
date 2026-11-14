import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert, Checkbox } from 'antd'
import { MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './LoginPage.module.css'
import { signInWithGoogle } from '../../config/firebase'
import { ADMIN_PATHS } from '../../router/paths'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const googleLogin = useAuthStore((state) => state.googleLogin)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const [hasGuestWishlist] = useState(() => {
    try {
      return Boolean(localStorage.getItem('trustcar:saved-cars'))
    } catch {
      return false
    }
  })

  async function handleSubmit(values) {
    const ok = await login(values)
    if (!ok) return
    const user = useAuthStore.getState().user
    if (user?.roleName === 'ADMIN' || user?.roleName === 'SALES_STAFF') {
      const from = location.state?.from
      const destination = from?.pathname?.startsWith('/admin/')
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : ADMIN_PATHS.overview
      navigate(destination, { replace: true })
    } else {
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    }
  }

  async function handleGoogleLogin() {
    try {
      const idToken = await signInWithGoogle()
      const user = await googleLogin(idToken)
      if (!user) return
      if (user.profileCompleted === false || user.missingFields?.length > 0) {
        navigate('/hoan-tat-ho-so', { replace: true })
        return
      }
      navigate('/', { replace: true })
    } catch (googleError) {
      useAuthStore.setState({ error: googleError.message || 'Đăng nhập Google thất bại.' })
    }
  }

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để lưu xe yêu thích, đặt lịch xem xe và theo dõi yêu cầu tư vấn."
      footer={<>Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link></>}
    >
      {hasGuestWishlist && (
        <Alert
          type="info"
          showIcon
          message="Bạn có xe đã lưu tạm trên trình duyệt"
          description="Sau khi đăng nhập, danh sách này sẽ được đồng bộ vào tài khoản của bạn."
          className={styles.alert}
        />
      )}
      {error && <Alert type="error" title={error} showIcon className={styles.alert} />}

      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ remember: true }}>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
          <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" autoComplete="current-password" />
        </Form.Item>
        <div className={styles.row}>
          <Form.Item name="remember" valuePropName="checked" noStyle><Checkbox>Ghi nhớ đăng nhập</Checkbox></Form.Item>
          <Link to="/quen-mat-khau" className={styles.forgot}>Quên mật khẩu?</Link>
        </div>
        <Button type="primary" htmlType="submit" size="large" block loading={loading} className={styles.submitBtn}>Đăng nhập</Button>
        <Button icon={<GoogleOutlined />} size="large" block onClick={handleGoogleLogin} disabled={loading} className={styles.googleBtn}>Tiếp tục với Google</Button>
      </Form>
    </AuthLayout>
  )
}
