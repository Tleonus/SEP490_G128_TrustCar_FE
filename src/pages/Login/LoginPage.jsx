import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpg'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const login     = useAuthStore((state) => state.login)
  const loading   = useAuthStore((state) => state.loading)
  const error     = useAuthStore((state) => state.error)

  async function handleSubmit(values) {
    console.log('[LoginPage] 🖱️ Người dùng bấm Đăng nhập:', values.email)

    const ok = await login(values)

    if (ok) {
      // Sau khi login thành công, đọc user từ store (đã được set bởi login action)
      const user = useAuthStore.getState().user
      console.log('[LoginPage] ✅ Đăng nhập OK, user.role =', user?.role)

      // Điều hướng theo role
      if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
        navigate('/admin', { replace: true })
      } else {
        // Quay về trang trước (nếu bị redirect từ route bảo vệ) hoặc về trang chủ
        const redirectTo = location.state?.from?.pathname || '/'
        navigate(redirectTo, { replace: true })
      }
    } else {
      console.warn('[LoginPage] ❌ Đăng nhập thất bại')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} alt="TrustCar Logo" className={styles.logoImg} />
        </div>
        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.desc}>Đăng nhập để sử dụng đầy đủ dịch vụ của TrustCar</p>

        {error && (
          <Alert
            type="error"
            title={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="email@example.com"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className={styles.submitBtn}
          >
            Đăng nhập
          </Button>
        </Form>
      </div>
    </div>
  )
}
