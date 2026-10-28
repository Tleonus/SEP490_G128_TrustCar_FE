import { Form, Input, Button, Alert, Checkbox } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  async function handleSubmit(values) {
    console.log('[LoginPage] 🖱️ Người dùng bấm Đăng nhập:', values.email)

    const ok = await login(values)

    if (ok) {
      // Sau khi login thành công, đọc user từ store (đã được set bởi login action)
      const user = useAuthStore.getState().user
      console.log('[LoginPage] ✅ Đăng nhập OK, user.roleName =', user?.roleName)

      // Điều hướng theo role (user.roleName là chuỗi thật từ backend; user.role là object Role đã populate)
      if (user?.roleName === 'ADMIN' || user?.roleName === 'SALES_STAFF') {
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
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để lưu xe yêu thích, đặt lịch xem xe và theo dõi yêu cầu tư vấn."
      footer={
        <>
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
        </>
      }
    >
      {error && <Alert type="error" title={error} showIcon className={styles.alert} />}

      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ remember: true }}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" autoComplete="email" />
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

        <div className={styles.row}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <a href="#" className={styles.forgot} onClick={(e) => e.preventDefault()}>
            Quên mật khẩu?
          </a>
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} className={styles.submitBtn}>
          Đăng nhập
        </Button>
      </Form>
    </AuthLayout>
  )
}
