import { Button, Result } from 'antd'
import { LoginOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { CERT_ERROR } from '../utils/certificateErrors'

const RESULT_STATUS = {
  [CERT_ERROR.UNAUTHORIZED]: 'warning',
  [CERT_ERROR.FORBIDDEN]: '403',
  [CERT_ERROR.NOT_FOUND]: '404',
  [CERT_ERROR.NETWORK]: 'error',
}

/**
 * Trạng thái lỗi theo loại: 401 → đăng nhập lại, 403/404 → quay lại, lỗi mạng → Thử lại.
 * @param {{ error: ReturnType<import('../utils/certificateErrors').classifyCertificateError>, onRetry?: () => void, backTo?: string }} props
 */
export default function CertificateErrorState({ error, onRetry, backTo }) {
  const navigate = useNavigate()
  const location = useLocation()

  let action = null
  if (error.kind === CERT_ERROR.UNAUTHORIZED) {
    action = (
      <Button type="primary" size="large" icon={<LoginOutlined />} onClick={() => navigate('/dang-nhap', { state: { from: location } })}>
        Đăng nhập lại
      </Button>
    )
  } else if (error.retryable && onRetry) {
    action = (
      <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={onRetry}>
        Thử lại
      </Button>
    )
  } else if (backTo) {
    action = (
      <Button size="large" onClick={() => navigate(backTo)}>
        Về danh sách chứng nhận
      </Button>
    )
  }

  return <Result status={RESULT_STATUS[error.kind]} title={error.title} subTitle={error.message} extra={action} />
}
