import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Button, Modal, Form, Input, message } from 'antd'
import {
  CalendarOutlined,
  DashboardOutlined,
  CarOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useCarDetail } from '../../hooks/useCarDetail'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, sortCarImages } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import { sendContactRequest } from '../../services/carService'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState } from '../../components/common/StateBlock'
import styles from './CarDetailPage.module.css'

export default function CarDetailPage() {
  const { stockCode } = useParams()
  const navigate = useNavigate()
  const { car, similarCars, loading, error } = useCarDetail(stockCode)
  const [activeImage, setActiveImage] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form] = Form.useForm()

  if (loading) return <div className="container"><LoadingState text="Đang tải thông tin xe..." /></div>
  if (error) return <div className="container"><ErrorState message={error} onRetry={() => navigate(0)} /></div>
  if (!car) return null

  const title = getCarTitle(car)
  const images = sortCarImages(car.images)
  const current = images[activeImage]

  const specs = [
    { icon: <CalendarOutlined />, label: 'Năm sản xuất', value: car.manufacturing_year },
    { icon: <DashboardOutlined />, label: 'Số km đã đi', value: formatMileage(car.mileage_km) },
    { icon: <CarOutlined />, label: 'Hộp số', value: labelOf(TRANSMISSION_LABEL, car.transmission) },
    { icon: <ThunderboltOutlined />, label: 'Nhiên liệu', value: labelOf(FUEL_TYPE_LABEL, car.fuel_type) },
    { label: 'Kiểu dáng', value: labelOf(BODY_TYPE_LABEL, car.model?.body_type) },
    { label: 'Số chỗ ngồi', value: car.seats },
    { label: 'Dẫn động', value: car.drive_type },
    { label: 'Dung tích động cơ', value: car.engine_capacity },
    { label: 'Mức tiêu hao nhiên liệu', value: car.fuel_consumption },
    { label: 'Màu ngoại thất', value: car.exterior_colour },
    { label: 'Màu nội thất', value: car.interior_colour },
    { label: 'Xuất xứ', value: car.origin },
    { label: 'Mã xe', value: car.stock_code },
  ].filter((s) => s.value != null && s.value !== '')

  async function handleSendContact(values) {
    setSending(true)
    try {
      await sendContactRequest({ stock_code: car.stock_code, ...values })
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
            { title },
          ]}
        />

        {car.isMockData && <div className={styles.mockBadge}>Dữ liệu mẫu (demo UI)</div>}

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.mainImgWrap}>
              {current && (
                <img src={current.image_url} alt={current.caption || title} className={styles.mainImg} />
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.image_id}
                    className={`${styles.thumb} ${idx === activeImage ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`Xem ảnh ${idx + 1}`}
                    aria-pressed={idx === activeImage}
                  >
                    <img src={img.image_url} alt="" className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.price}>{formatPrice(car.listed_price)}</div>

            <div className={styles.specsGrid}>
              {specs.map((s) => (
                <div className={styles.specItem} key={s.label}>
                  <span className={styles.specLabel}>{s.icon} {s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.ctaRow}>
              <Button type="primary" size="large" icon={<PhoneOutlined />} href="tel:19001234" block>
                Gọi tư vấn: 1900 1234
              </Button>
              <Button size="large" icon={<MessageOutlined />} onClick={() => setContactOpen(true)} block>
                Yêu cầu tư vấn
              </Button>
            </div>
          </div>
        </div>

        {Array.isArray(car.key_equipment) && car.key_equipment.length > 0 && (
          <div className={styles.description}>
            <h2 className={styles.descTitle}>Trang bị nổi bật</h2>
            <ul className={styles.descText}>
              {car.key_equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {car.condition_description && (
          <div className={styles.description}>
            <h2 className={styles.descTitle}>Tình trạng xe</h2>
            <p className={styles.descText}>{car.condition_description}</p>
          </div>
        )}

        {similarCars.length > 0 && (
          <div className={styles.similar}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="section-eyebrow">Có thể bạn quan tâm</div>
              <h2 className="section-title">Xe tương tự</h2>
            </div>
            <div className={styles.similarGrid}>
              {similarCars.map((similarCar) => (
                <CarCard key={similarCar.stock_code} car={similarCar} />
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
          <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="phone_number"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' },
            ]}
          >
            <Input placeholder="09xxxxxxxx" inputMode="tel" maxLength={10} />
          </Form.Item>
          <Form.Item name="request_content" label="Lời nhắn">
            <Input.TextArea rows={3} placeholder="Tôi muốn xem xe này..." maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={sending} block>
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
