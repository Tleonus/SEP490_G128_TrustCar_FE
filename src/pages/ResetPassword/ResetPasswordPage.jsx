import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { resetPassword } from '../../services/authService'
import styles from '../../components/auth/AuthForm.module.css'

const passwordRule = { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*\-_=+]{8,128}$/, message: 'Mật khẩu phải có chữ hoa, chữ thường và chữ số' }

export default function ResetPasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const token = searchParams.get('token') || ''

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      await resetPassword({ token, newPassword: values.newPassword, confirmPassword: values.confirmPassword })
      message.success('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.')
      navigate('/dang-nhap', { replace: true })
    } catch (error) {
      message.error(error.response?.data?.message || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản TrustCar." footer={<><Link to="/dang-nhap">Quay lại đăng nhập</Link></>}>
      {!token && <Alert type="warning" showIcon message="Liên kết đặt lại mật khẩu bị thiếu token." className={styles.alert} />}
      <Form layout="vertical" onFinish={handleSubmit} className={styles.form} requiredMark={false}>
        <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }, passwordRule]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['newPassword']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp')) } })]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block disabled={!token} loading={submitting} className={styles.submitBtn}>Đặt lại mật khẩu</Button>
      </Form>
    </AuthLayout>
  )
}
