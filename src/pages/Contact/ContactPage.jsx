import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { sendContactRequest } from '../../services/carService'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  const [sending, setSending] = useState(false)
  const [form] = Form.useForm()

  async function handleSubmit(values) {
    setSending(true)
    try {
      await sendContactRequest(values)
      message.success('Đã gửi yêu cầu liên hệ. TrustCar sẽ phản hồi sớm nhất.')
      form.resetFields()
    } catch {
      message.error('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau hoặc gọi hotline.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div className="section-eyebrow">Liên hệ</div>
          <h1 className="section-title">Liên hệ với TrustCar</h1>
          <p className="section-desc">
            Đội ngũ TrustCar luôn sẵn sàng hỗ trợ bạn tìm chiếc xe phù hợp nhất.
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.infoCard}>
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}><EnvironmentOutlined /></div>
              <div>
                <div className={styles.infoTitle}>Showroom</div>
                <p className={styles.infoDesc}>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}><PhoneOutlined /></div>
              <div>
                <div className={styles.infoTitle}>Hotline</div>
                <p className={styles.infoDesc}>1900 1234 (8:00 - 20:00 hàng ngày)</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}><MailOutlined /></div>
              <div>
                <div className={styles.infoTitle}>Email</div>
                <p className={styles.infoDesc}>support@trustcar.vn</p>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nguyễn Văn A" size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="09xxxxxxxx" size="large" />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" size="large" />
              </Form.Item>
              <Form.Item name="message" label="Nội dung">
                <Input.TextArea rows={4} placeholder="Tôi cần tư vấn về..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={sending} block>
                Gửi liên hệ
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
