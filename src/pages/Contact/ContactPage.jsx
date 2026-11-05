import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, LinkOutlined } from '@ant-design/icons'
import { sendContactRequest } from '../../services/carService'
import { CONTACT_INFO } from '../../config/contactInfo'
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
                <p className={styles.infoDesc}>{CONTACT_INFO.showroomDisplay}</p>
                <a href={CONTACT_INFO.mapUrl} target="_blank" rel="noreferrer" className={styles.infoLink}>
                  <LinkOutlined /> Xem vị trí trên Google Maps
                </a>
                <p className={styles.infoMeta}>{CONTACT_INFO.showroomHours}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}><PhoneOutlined /></div>
              <div>
                <div className={styles.infoTitle}>Hotline tư vấn</div>
                <a href={CONTACT_INFO.phoneHref} className={styles.infoLink}>{CONTACT_INFO.phoneDisplay}</a>
                <p className={styles.infoMeta}>{CONTACT_INFO.showroomHours}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}><MailOutlined /></div>
              <div>
                <div className={styles.infoTitle}>Email</div>
                <a href={`mailto:${CONTACT_INFO.email}`} className={styles.infoLink}>{CONTACT_INFO.email}</a>
              </div>
            </div>

            <div className={styles.socialBlock}>
              <div className={styles.infoTitle}>Kênh liên hệ nhanh</div>
              <div className={styles.socialLinks}>
                <a href={CONTACT_INFO.zaloUrl} target="_blank" rel="noreferrer">Zalo</a>
                <a href={CONTACT_INFO.messengerUrl} target="_blank" rel="noreferrer">Messenger</a>
                <a href={CONTACT_INFO.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>
                <a href={CONTACT_INFO.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nguyễn Văn A" size="large" />
              </Form.Item>
              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="09xxxxxxxx" size="large" />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" size="large" />
              </Form.Item>
              <Form.Item name="request_content" label="Nội dung">
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
