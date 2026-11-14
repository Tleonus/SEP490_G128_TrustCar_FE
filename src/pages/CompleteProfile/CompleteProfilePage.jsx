import { useState } from 'react'
import { App, Button, Form, Input } from 'antd'
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { completeProfile } from '../../services/authService'
import { useAuthStore } from '../../store/useAuthStore'
import styles from '../../components/auth/AuthForm.module.css'

const passwordRule = { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*\-_=+]{8,128}$/, message: 'Mật khẩu phải có chữ hoa, chữ thường và chữ số' }

export default function CompleteProfilePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [submitting, setSubmitting] = useState(false)
  const missingFields = user?.missingFields || ['fullName', 'phone', 'password']

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      const response = await completeProfile(values)
      const updatedUser = response.data ?? response
      updateUser(updatedUser)
      message.success('Hoàn tất hồ sơ thành công.')
      navigate('/', { replace: true })
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể hoàn tất hồ sơ. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Hoàn tất hồ sơ" subtitle="Bổ sung thông tin để sử dụng đầy đủ các tính năng của TrustCar." footer={<><Link to="/">Về trang chủ</Link></>}>
      <Form layout="vertical" onFinish={handleSubmit} className={styles.form} requiredMark={false}>
        {missingFields.includes('fullName') && <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}><Input prefix={<UserOutlined />} size="large" autoComplete="name" /></Form.Item>}
        {missingFields.includes('phone') && <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^(0\d{9}|\+84\d{9})$/, message: 'Số điện thoại không hợp lệ' }]}><Input prefix={<PhoneOutlined />} size="large" autoComplete="tel" /></Form.Item>}
        {missingFields.includes('password') && <>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }, passwordRule]}><Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" /></Form.Item>
          <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['password']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp')) } })]}><Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" /></Form.Item>
        </>}
        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className={styles.submitBtn}>Lưu hồ sơ</Button>
      </Form>
    </AuthLayout>
  )
}
