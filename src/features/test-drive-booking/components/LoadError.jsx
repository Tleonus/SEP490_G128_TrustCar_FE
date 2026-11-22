import { Alert, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { classifyAppointmentError } from '../utils/appointmentErrors'

/**
 * Lỗi tải danh sách: thông báo tiếng Việt, nút theo hành động (đăng nhập / hoàn tất hồ sơ) hoặc "Thử lại".
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F19
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F23
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F24
 * @param {object} error  Lỗi axios gốc
 * @param {() => void} onRetry
 */
export default function LoadError({ error, onRetry, title = 'Không thể tải dữ liệu' }) {
  const navigate = useNavigate()
  const failure = classifyAppointmentError(error)
  return (
    <Alert
      type="warning"
      showIcon
      message={title}
      description={failure.message}
      action={failure.action
        ? <Button size="small" onClick={() => navigate(failure.action.to)}>{failure.action.label}</Button>
        : <Button size="small" onClick={onRetry}>Thử lại</Button>}
    />
  )
}
