import { useEffect, useReducer } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Result, Skeleton } from 'antd'
import { SafetyCertificateFilled } from '@ant-design/icons'
import { fetchVerifySummary } from '../api/verifyApi'
import { initialVerifyState, verifyReducer, actionForError } from '../utils/verifyState'
import styles from '../styles/VerifyPage.module.css'

const STATUS_LABEL = {
  AVAILABLE: 'Đang bán',
  APPROVED_CPO: 'Đã chứng nhận',
  SOLD: 'Đã bán',
  RESERVED: 'Đang giữ chỗ',
  MAINTENANCE: 'Đang bảo dưỡng',
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN')
}

/**
 * KAN-98 — trang công khai khi khách quét mã QR trên báo cáo lịch sử xe.
 * Ba trạng thái: đã xác thực, không tìm thấy (hash sai/hết hạn), và xe đã bán.
 */
export default function VerifyPage() {
  const { hash } = useParams()
  const [{ status: state, summary }, dispatch] = useReducer(verifyReducer, initialVerifyState)

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'reset' })
    fetchVerifySummary(hash, controller.signal)
      .then((data) => dispatch({ type: 'verified', summary: data }))
      .catch((error) => {
        if (controller.signal.aborted) return
        dispatch(actionForError(error))
      })
    return () => controller.abort()
  }, [hash])

  if (state === 'loading') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </main>
    )
  }

  if (state === 'notfound') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <Result
            status="warning"
            title="Không tìm thấy chứng nhận"
            subTitle="Mã xác thực không hợp lệ hoặc đã hết hiệu lực vì xe được kiểm định lại. Vui lòng dùng mã QR trên báo cáo mới nhất."
          />
          <Link to="/xe"><Button className={styles.touch}>Xem xe đang bán</Button></Link>
        </div>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <Result
            status="error"
            title="Không tải được thông tin xác thực"
            subTitle="Vui lòng thử lại sau ít phút."
          />
        </div>
      </main>
    )
  }

  const vehicle = summary.vehicle || {}
  const title = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Xe TrustCar'
  const sold = summary.status === 'SOLD'

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>
          <SafetyCertificateFilled /> Đã xác thực
        </span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>Chứng nhận này được cấp bởi TrustCar.</p>
        {sold && (
          <p className={styles.sold}>Xe này đã được bán. Chứng nhận vẫn có hiệu lực tại thời điểm cấp.</p>
        )}
        <dl className={styles.facts}>
          <div>
            <dt>Mã chứng nhận</dt>
            <dd className={styles.code}>{summary.certificate?.id || '—'}</dd>
          </div>
          <div>
            <dt>Ngày cấp</dt>
            <dd>{formatDate(summary.certificate?.issuedAt)}</dd>
          </div>
          <div>
            <dt>Điểm kiểm định</dt>
            <dd>{summary.score != null ? `${summary.score}/5 nhóm` : '—'}</dd>
          </div>
          <div>
            <dt>Tình trạng</dt>
            <dd>{STATUS_LABEL[summary.status] || summary.status || '—'}</dd>
          </div>
        </dl>
        {summary.pdfUrl && (
          <Button
            type="primary"
            size="large"
            block
            href={summary.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.touch}
          >
            Xem báo cáo lịch sử xe (PDF)
          </Button>
        )}
      </div>
    </main>
  )
}
