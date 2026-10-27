import { useState } from 'react'
import { Form, Input, Button, Checkbox, App } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import styles from './RegisterPage.module.css'

// Field theo quy ước cột bảng người dùng (full_name, phone_number, email, password).
// Hiện chỉ có giao diện, chưa gọi API -> CẦN BACKEND XÁC NHẬN endpoint POST /auth/register.
export default function RegisterPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      message.success('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.')
      navigate('/dang-nhap')
    }, 600)
  }

  return (
    <AuthLayout
      title="Tạo tài khoản TrustCar"
      subtitle="Chỉ mất một phút để bắt đầu hành trình tìm chiếc xe phù hợp với bạn."
      footer={
        <>
          Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </>
      }
    >
      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="full_name"
          label="Họ và tên"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" size="large" autoComplete="name" />
        </Form.Item>

        <div className={styles.grid}>
          <Form.Item
            name="phone_number"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0901234567" size="large" autoComplete="tel" />
          </Form.Item>

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
        </div>

        <div className={styles.grid}>
          <Form.Item
            name="password"
            label="Mật khẩu"
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 8 ký tự" size="large" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" size="large" autoComplete="new-password" />
          </Form.Item>
        </div>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý với điều khoản')),
            },
          ]}
        >
          <Checkbox>
            Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a> và{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a>
          </Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className={styles.submitBtn}>
          Tạo tài khoản
        </Button>
      </Form>
    </AuthLayout>
  )
}
