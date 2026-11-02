import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import AuthBackLink from '../../components/auth/AuthBackLink'
import { forgotPassword } from '../../services/authService'
import styles from '../../components/auth/AuthForm.module.css'

export default function ForgotPasswordPage() {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit({ email }) {
    setSubmitting(true)
    try {
      const response = await forgotPassword(email)
      setSubmitted(true)
      message.success(response.message || 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.')
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Quên mật khẩu?" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu." footer={<AuthBackLink />}>
      {submitted && <Alert type="success" showIcon message="Hãy kiểm tra hộp thư và làm theo hướng dẫn trong email." className={styles.alert} />}
      <Form layout="vertical" onFinish={handleSubmit} className={styles.form} requiredMark={false}>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
          <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" autoComplete="email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className={styles.submitBtn}>Gửi liên kết đặt lại mật khẩu</Button>
      </Form>
    </AuthLayout>
  )
}
