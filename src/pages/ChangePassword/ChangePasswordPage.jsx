import { useState } from 'react'
import { App, Button, Form, Input } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { changePassword } from '../../services/authService'
import { useAuthStore } from '../../store/useAuthStore'
import styles from '../../components/auth/AuthForm.module.css'

const passwordRule = { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*\-_=+]{8,128}$/, message: 'Mật khẩu phải có chữ hoa, chữ thường và chữ số' }

export default function ChangePasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      await changePassword(values)
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      await logout()
      navigate('/dang-nhap', { replace: true })
    } catch (error) {
      message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đổi mật khẩu" subtitle="Bảo vệ tài khoản bằng một mật khẩu mới." footer={<><Link to="/">Về trang chủ</Link></>}>
      <Form layout="vertical" onFinish={handleSubmit} className={styles.form} requiredMark={false}>
        <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }, passwordRule]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['newPassword']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp')) } })]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className={styles.submitBtn}>Đổi mật khẩu</Button>
      </Form>
    </AuthLayout>
  )
}
