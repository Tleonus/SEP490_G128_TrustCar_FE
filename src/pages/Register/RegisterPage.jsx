import { useState } from 'react'
import { Form, Input, Button, Checkbox, App } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { register } from '../../services/authService'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      await register(values)
      message.success('Đăng ký thành công. Vui lòng đăng nhập để đồng bộ xe yêu thích.')
      navigate('/dang-nhap', { state: { from: location.state?.from } })
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản TrustCar"
      subtitle="Đăng ký để lưu xe yêu thích lâu dài và nhận thông báo khi giá xe giảm."
      footer={<>Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></>}
    >
      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' }]}>
          <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" size="large" autoComplete="name" />
        </Form.Item>
        <div className={styles.grid}>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="0901234567" size="large" autoComplete="tel" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" autoComplete="email" />
          </Form.Item>
        </div>
        <div className={styles.grid}>
          <Form.Item name="password" label="Mật khẩu" hasFeedback rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }, { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*\-_=+]{8,128}$/, message: 'Mật khẩu phải có chữ hoa, chữ thường và chữ số' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 8 ký tự" size="large" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['password']} hasFeedback rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp')) } })]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" size="large" autoComplete="new-password" />
          </Form.Item>
        </div>
        <Form.Item name="agree" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý với điều khoản')) }]}>
          <Checkbox>Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a> và <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a></Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className={styles.submitBtn}>Tạo tài khoản</Button>
      </Form>
    </AuthLayout>
  )
}
