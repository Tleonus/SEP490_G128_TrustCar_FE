import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Result } from 'antd'
import { CloseCircleFilled } from '@ant-design/icons'
import { VNPAY_MESSAGE_BY_CODE } from '../constants/depositConstants'

/**
 * KAN-99 — khách bấm hủy trên trang VNPay (vnp_ResponseCode=24) hoặc giao dịch
 * fail. Lượt cọc vẫn còn PENDING_PAYMENT, giữ xe cho đến khi hết hạn 24h hoặc
 * khách hủy lượt cọc thủ công.
 */
export default function DepositCancelPage() {
  const { id: depositId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code') || ''
  const message = VNPAY_MESSAGE_BY_CODE[code] || 'Giao dịch VNPay đã bị hủy hoặc không thành công.'

  return (
    <Result
      icon={<CloseCircleFilled style={{ color: '#ef4444' }} />}
      title="Giao dịch VNPay chưa hoàn tất"
      subTitle={(
        <>
          {message} Lượt giữ xe của bạn vẫn còn — có thể thanh toán lại hoặc hủy tạm giữ.
        </>
      )}
      extra={[
        <Button
          key="retry"
          type="primary"
          onClick={() => depositId ? navigate(`/dat-coc/${depositId}`) : navigate(-1)}
        >
          Thử thanh toán lại
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>Về trang chủ</Button>,
      ]}
    />
  )
}
