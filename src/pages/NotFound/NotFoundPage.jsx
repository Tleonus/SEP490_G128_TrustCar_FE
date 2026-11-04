import { useEffect } from 'react'
import { Button } from 'antd'
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

const PUBLIC_SUGGESTIONS = [
  { to: '/xe', label: 'Xem danh sách xe' },
  { to: '/ve-chung-toi', label: 'Về TrustCar' },
  { to: '/lien-he', label: 'Liên hệ hỗ trợ' },
]

/**
 * Trang 404 dùng chung. Mặc định cho khu vực public; khu vực admin truyền
 * homePath/homeLabel riêng và suggestions rỗng để không dẫn ra trang public.
 */
export default function NotFoundPage({
  homePath = '/',
  homeLabel = 'Về trang chủ',
  suggestions = PUBLIC_SUGGESTIONS,
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Không tìm thấy trang | TrustCar'
    return () => {
      document.title = previousTitle
    }
  }, [])

  // React Router lưu vị trí trong history.state.idx; idx = 0 nghĩa là người dùng
  // mở thẳng URL lỗi (không có trang trước trong app) nên quay lại sẽ rời khỏi site.
  const canGoBack = (window.history.state?.idx ?? 0) > 0
  const handleBack = () => (canGoBack ? navigate(-1) : navigate(homePath))

  return (
    <section className={`container ${styles.wrapper}`} aria-labelledby="not-found-title">
      <p className={styles.code} aria-hidden="true">404</p>
      <h1 id="not-found-title" className={styles.title}>Không tìm thấy trang</h1>
      <p className={styles.desc}>
        Trang bạn tìm có thể đã bị xoá, đổi địa chỉ hoặc chưa từng tồn tại.
      </p>
      <code className={styles.path} title={pathname}>{pathname}</code>

      <div className={styles.actions}>
        <Button size="large" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Quay lại
        </Button>
        <Button size="large" type="primary" icon={<HomeOutlined />} onClick={() => navigate(homePath)}>
          {homeLabel}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <nav className={styles.suggestions} aria-label="Gợi ý trang">
          <span className={styles.suggestLabel}>Có thể bạn đang tìm:</span>
          <ul className={styles.suggestList}>
            {suggestions.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={styles.suggestLink}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  )
}
