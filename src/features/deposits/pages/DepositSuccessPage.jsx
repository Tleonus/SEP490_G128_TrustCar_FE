import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Result, Spin, Statistic, Typography } from 'antd'
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CrownFilled,
  FileSearchOutlined,
} from '@ant-design/icons'
import usePaymentPolling from '../hooks/usePaymentPolling'
import { formatVnd } from '../utils/depositFormat'
import { DEPOSIT_PATHS, DEPOSIT_STATUS } from '../constants/depositConstants'

/**
 * KAN-99 — trang khách thấy sau khi BE redirect từ VNPay return URL. BE pass
 * depositId trong path (`/dat-coc/:id/thanh-cong`); FE poll lấy trạng thái
 * cọc hiện tại.
 *
 * Kết quả có thể là:
 *  - polling: VNPay đã nhận tiền nhưng IPN chưa về BE → hiện spinner + countdown
 *  - reached: paymentStatus === DEPOSIT_PAID → hiện chúc mừng
 *  - timeout: sau 90 s vẫn chưa reached → hiện CTA liên hệ hotline
 *  - error:   không gọi được API → hiện lỗi, bấm "Thử lại"
 */
export default function DepositSuccessPage() {
  const { id: depositId } = useParams()
  const [params] = useSearchParams()
  const vnpTransactionNo = params.get('txn') || ''
  const navigate = useNavigate()

  const { deposit, status, elapsedMs, error, forceRefresh } = usePaymentPolling({
    depositId,
    targetStatus: 'DEPOSIT_PAID',
    intervalMs: 3_000,
    timeoutMs: 90_000,
    enabled: Boolean(depositId),
  })

  if (!depositId) {
    return (
      <Result status="error" title="Thiếu mã lượt đặt cọc" subTitle="URL không hợp lệ." />
    )
  }

  if (status === 'error') {
    return (
      <Result
        status="error"
        title="Không tải được trạng thái cọc"
        subTitle={error}
        extra={<Button type="primary" onClick={forceRefresh}>Thử lại</Button>}
      />
    )
  }

  const isPaid = deposit?.paymentStatus === 'DEPOSIT_PAID'
    || deposit?.status === DEPOSIT_STATUS.DEPOSIT_PAID
    || deposit?.status === DEPOSIT_STATUS.COMPLETED

  if (status === 'polling' && !isPaid) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
        <Typography.Title level={4} style={{ marginTop: 16 }}>
          Đang chờ VNPay xác nhận
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 480, margin: '0 auto' }}>
          Chúng tôi đã nhận được chứng từ thanh toán từ trang VNPay. Hệ thống đang
          đợi webhook server-to-server xác nhận (mất 2–30 giây).
        </Typography.Paragraph>
        <div style={{ marginTop: 24 }}>
          <Statistic
            prefix={<ClockCircleFilled style={{ color: '#2563eb' }} />}
            title="Đã chờ"
            value={Math.round(elapsedMs / 1000)}
            suffix="giây"
          />
        </div>
        {vnpTransactionNo && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
            Mã giao dịch VNPay: <strong>{vnpTransactionNo}</strong>
          </Typography.Paragraph>
        )}
        <Button type="link" icon={<FileSearchOutlined />} onClick={forceRefresh}>
          Làm mới ngay
        </Button>
      </div>
    )
  }

  if (status === 'timeout' && !isPaid) {
    return (
      <Result
        status="warning"
        title="Hệ thống đang xử lý lâu hơn bình thường"
        subTitle={(
          <>
            Giao dịch VNPay của bạn đã thành công nhưng hệ thống chưa nhận được xác nhận cuối.
            Showroom sẽ liên hệ xác nhận trong vòng 24 giờ.{' '}
            {vnpTransactionNo && <>Mã giao dịch VNPay: <strong>{vnpTransactionNo}</strong>.</>}
          </>
        )}
        extra={[
          <Button key="refresh" type="primary" onClick={forceRefresh}>Kiểm tra lại</Button>,
          <Button key="home" onClick={() => navigate('/')}>Về trang chủ</Button>,
        ]}
      />
    )
  }

  // isPaid
  return (
    <Result
      icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
      title="Đã nhận tiền cọc thành công"
      subTitle={(
        <>
          <CrownFilled style={{ color: '#2563eb', marginRight: 6 }} />
          Xe <strong>{deposit?.carTitle || '…'}</strong> đã được giữ cho bạn.
          Showroom sẽ liên hệ trong vòng 24 giờ để hẹn hoàn tất phần còn lại.
        </>
      )}
      extra={[
        <div key="amount" style={{ marginBottom: 12, color: '#6b7280' }}>
          Số tiền cọc: <strong>{formatVnd(deposit?.depositAmount || 0)}</strong> —
          Mã giao dịch VNPay: <strong>{deposit?.paymentReference || vnpTransactionNo}</strong>
        </div>,
        <Button key="view" type="primary" onClick={() => navigate(DEPOSIT_PATHS.myDeposits)}>
          Xem các lượt giữ xe của tôi
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>Về trang chủ</Button>,
      ]}
    />
  )
}
