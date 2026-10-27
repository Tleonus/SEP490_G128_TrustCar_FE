import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Button, Modal, Form, Input, message } from 'antd'
import {
  CalendarOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useCarDetail } from '../../hooks/useCarDetail'
import { formatPrice, formatMileage } from '../../utils/format'
import { sendContactRequest } from '../../services/carService'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState } from '../../components/common/StateBlock'
import styles from './CarDetailPage.module.css'

export default function CarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { car, similarCars, loading, error } = useCarDetail(id)
  const [activeImage, setActiveImage] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form] = Form.useForm()

  if (loading) return <div className="container"><LoadingState text="Đang tải thông tin xe..." /></div>
  if (error) return <div className="container"><ErrorState message={error} onRetry={() => navigate(0)} /></div>
  if (!car) return null

  const images = car.images || []

  async function handleSendContact(values) {
    setSending(true)
    try {
      await sendContactRequest({ carId: car.id, ...values })
      message.success('Đã gửi yêu cầu tư vấn. TrustCar sẽ liên hệ với bạn sớm nhất.')
      setContactOpen(false)
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
        <Breadcrumb
          className={styles.breadcrumb}
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/xe">Danh sách xe</Link> },
            { title: `${car.brand} ${car.model}` },
          ]}
        />

        {car.isMockData && (
          <div className={styles.mockBadge}>Dữ liệu mẫu (demo UI)</div>
        )}

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.mainImgWrap}>
              {images[activeImage] && (
                <img
                  src={images[activeImage]}
                  alt={`${car.brand} ${car.model}`}
                  className={styles.mainImg}
                />
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`${styles.thumb} ${idx === activeImage ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt="" className={styles.thumbImg} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{car.brand} {car.model}</h1>
            <div className={styles.price}>{formatPrice(car.price)}</div>

            <div className={styles.specsGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}><CalendarOutlined /> Năm sản xuất</span>
                <span className={styles.specValue}>{car.year}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}><DashboardOutlined /> Số km đã đi</span>
                <span className={styles.specValue}>{formatMileage(car.mileage)}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}><CarOutlined /> Hộp số</span>
                <span className={styles.specValue}>{car.transmission}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}><ThunderboltOutlined /> Nhiên liệu</span>
                <span className={styles.specValue}>{car.fuel}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Loại xe</span>
                <span className={styles.specValue}>{car.bodyType}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}><EnvironmentOutlined /> Khu vực</span>
                <span className={styles.specValue}>{car.location}</span>
              </div>
            </div>

            <div className={styles.ctaRow}>
              <Button type="primary" size="large" icon={<PhoneOutlined />} block>
                Gọi tư vấn: 1900 1234
              </Button>
              <Button size="large" icon={<MessageOutlined />} onClick={() => setContactOpen(true)} block>
                Yêu cầu tư vấn
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.description}>
          <h2 className={styles.descTitle}>Mô tả chi tiết</h2>
          <p className={styles.descText}>{car.description}</p>
        </div>

        {similarCars && similarCars.length > 0 && (
          <div className={styles.similar}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="section-eyebrow">Có thể bạn quan tâm</div>
              <h2 className="section-title">Xe tương tự</h2>
            </div>
            <div className={styles.similarGrid}>
              {similarCars.map((similarCar) => (
                <CarCard key={similarCar._id || similarCar.id} car={similarCar} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Yêu cầu tư vấn"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSendContact}>
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="09xxxxxxxx" />
          </Form.Item>
          <Form.Item name="message" label="Lời nhắn">
            <Input.TextArea rows={3} placeholder="Tôi muốn xem xe này..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={sending} block>
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
