import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpg'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  async function handleSubmit(values) {
    const ok = await login(values)
    if (ok) {
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} alt="TrustCar" className={styles.logoImg} />
        </div>
        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.desc}>Đăng nhập để sử dụng đầy đủ dịch vụ của TrustCar</p>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="email@example.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
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

        <p className={styles.note}>
          Chức năng đăng nhập cần Backend cung cấp API xác thực (POST /auth/login).
        </p>
      </div>
    </div>
  )
}
