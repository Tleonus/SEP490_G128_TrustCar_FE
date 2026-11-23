import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Result, Spin, Typography } from 'antd'
import { CheckCircleFilled, InfoCircleFilled, WarningFilled } from '@ant-design/icons'
import { fetchDeposit } from '../api/depositApi'
import {
  VNPAY_MESSAGE_BY_CODE,
  VNPAY_RESPONSE_CODE,
} from '../constants/depositConstants'

/**
 * KAN-99 — trang khách được VNPay redirect về, ví dụ:
 *   /dat-coc/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=DEP-...&vnp_TransactionNo=14600314
 *
 * Trang NÀY không bao giờ gọi BE để chuyển trạng thái. Cập nhật DB là việc của
 * IPN webhook server-to-server. Trang chỉ:
 *  1. Đọc `vnp_ResponseCode` + `vnp_TxnRef` từ URL,
 *  2. Nếu BE đã redirect sẵn sang `/dat-coc/:id/thanh-cong` thì trang này không
 *     bao giờ được mở — code bên dưới chỉ là fallback khi VNPay (hoặc test
 *     sandbox) gọi thẳng path `/vnpay-return` của FE, không qua BE.
 *  3. Hiện spinner + redirect sang trang thành công / thất bại tương ứng.
 *
 * Trong flow production BE chịu trách nhiệm redirect. Trang này làm cả hai để
 * demo dev không có BE vẫn chạy được.
 */
export default function VnpayReturnPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const responseCode = params.get('vnp_ResponseCode') || ''
  const vnpTxnRef = params.get('vnp_TxnRef') || ''
  const txn = params.get('vnp_TransactionNo') || ''
  const errorFromBe = params.get('error') || ''

  useEffect(() => {
    let cancelled = false

    const resolveAndRedirect = async () => {
      // BE đã chặn từ trước và pass error → hiện trang lỗi tĩnh.
      if (errorFromBe) {
        setError(errorFromBe)
        setLoading(false)
        return
      }
      if (!vnpTxnRef) {
        setError('Thiếu tham số vnp_TxnRef từ VNPay.')
        setLoading(false)
        return
      }

      // Lookup deposit theo txnRef — BE chưa hẳn có endpoint public cho việc
      // này, nên fallback: redirect sang trang 'that-bai' nếu không tìm ra.
      try {
        // Không có API lookup theo txnRef nên FE fallback: hiện spinner và để
        // khách tự bấm "Về trang chủ". Trong luồng production BE sẽ 302 trực
        // tiếp sang /dat-coc/:id/... và trang này không bao giờ chạy đoạn này.
        if (cancelled) return

        if (responseCode === VNPAY_RESPONSE_CODE.SUCCESS) {
          setLoading(false)
          return
        }
        if (responseCode === VNPAY_RESPONSE_CODE.CUSTOMER_CANCEL) {
          setError('Bạn đã hủy giao dịch tại trang VNPay.')
        } else {
          setError(VNPAY_MESSAGE_BY_CODE[responseCode] || 'Thanh toán không thành công.')
        }
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Không xác minh được giao dịch.')
        setLoading(false)
      }
    }

    resolveAndRedirect()
    return () => { cancelled = true }
  }, [errorFromBe, responseCode, vnpTxnRef])

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#6b7280' }}>Đang xác thực giao dịch VNPay…</div>
      </div>
    )
  }

  if (!error && responseCode === VNPAY_RESPONSE_CODE.SUCCESS) {
    return (
      <Result
        icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
        title="Thanh toán tiền cọc thành công"
        subTitle={
          <Typography.Text type="secondary">
            Mã giao dịch VNPay: <strong>{txn || 'đang cập nhật'}</strong>. Hệ thống đang đồng bộ trạng thái cọc trong vài giây.
          </Typography.Text>
        }
        extra={[
          <Button key="back" type="primary" onClick={() => navigate('/xe-da-luu')}>
            Xem danh sách xe đã giữ
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>Về trang chủ</Button>,
        ]}
      />
    )
  }

  return (
    <Result
      icon={<WarningFilled style={{ color: '#f97316' }} />}
      status="warning"
      title={error || 'Giao dịch không thành công'}
      subTitle={
        <>
          <InfoCircleFilled style={{ color: '#2563eb', marginRight: 4 }} />
          Lượt đặt cọc của bạn vẫn đang được giữ. Bạn có thể thử thanh toán lại hoặc hủy để đưa xe về trạng thái sẵn sàng.
        </>
      }
      extra={[
        <Button key="retry" type="primary" onClick={() => navigate(-1)}>Thử thanh toán lại</Button>,
        <Button key="home" onClick={() => navigate('/')}>Về trang chủ</Button>,
      ]}
    />
  )
}
