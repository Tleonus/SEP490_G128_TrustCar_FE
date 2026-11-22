import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import { CarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { fetchPublicServices } from '../api/servicesApi'
import { LoadingState, ErrorState, EmptyState } from '../../../components/common/StateBlock'
import { useAuthStore } from '../../../store/useAuthStore'
import styles from '../styles/ServicesPage.module.css'

const { Title, Paragraph, Text } = Typography

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const formatDuration = (minutes) => {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} giờ`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h${minutes % 60}`
  return `${minutes} phút`
}

/**
 * KAN-96: trang công khai liệt kê các gói dịch vụ showroom.
 * Khách click "Đặt lịch" → nếu chưa đăng nhập, dẫn sang /dang-nhap kèm redirect; nếu đã đăng nhập, vào wizard.
 */
export default function ServicesPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [state, setState] = useState({ status: 'loading', items: [], error: null })

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicServices(controller.signal)
      .then((items) => setState({ status: 'ready', items, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', items: [], error })
      })
    return () => controller.abort()
  }, [])

  const handleBook = (service) => {
    const target = `/dich-vu/dat/${service.id}`
    if (!isAuthenticated) {
      // LoginPage đọc redirect từ location.state.from (xem PrivateRoute).
      navigate('/dang-nhap', { state: { from: { pathname: target } } })
      return
    }
    navigate(target)
  }

  const items = useMemo(() => state.items, [state.items])

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Title level={1}>Dịch vụ chăm sóc xe tại showroom</Title>
        <Paragraph className={styles.subtitle}>
          Các gói chăm sóc, bảo dưỡng, vệ sinh và kiểm tra xe — thực hiện ngay tại showroom TrustCar.
        </Paragraph>
      </div>

      {state.status === 'loading' && <LoadingState text="Đang tải danh sách dịch vụ..." />}
      {state.status === 'error' && (
        <ErrorState
          message={state.error?.response?.data?.message || 'Không tải được danh sách dịch vụ.'}
          onRetry={() => setState({ status: 'loading', items: [], error: null })}
        />
      )}
      {state.status === 'ready' && items.length === 0 && (
        <EmptyState description="Hiện chưa có gói dịch vụ nào đang mở." />
      )}

      {state.status === 'ready' && items.length > 0 && (
        <Row gutter={[24, 24]} className={styles.grid}>
          {items.map((service) => (
            <Col key={service.id} xs={24} sm={12} lg={8}>
              <Card
                className={styles.card}
                title={<span className={styles.cardTitle}>{service.serviceName}</span>}
                extra={<Tag color="blue">{service.code}</Tag>}
              >
                <Paragraph className={styles.description} ellipsis={{ rows: 3, tooltip: service.description }}>
                  {service.description || 'Mô tả đang cập nhật.'}
                </Paragraph>
                <div className={styles.meta}>
                  <Text><ClockCircleOutlined /> {formatDuration(service.estimatedDuration)}</Text>
                  <Text strong className={styles.price}>{formatPrice(service.referencePrice)}</Text>
                </div>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CarOutlined />}
                  onClick={() => handleBook(service)}
                >
                  Đặt lịch dịch vụ
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className={styles.footerNote}>
        <Text type="secondary">
          Cần tư vấn thêm? Liên hệ qua <Link to="/lien-he">trang Liên hệ</Link> để được hỗ trợ.
        </Text>
      </div>
    </div>
  )
}
