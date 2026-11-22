import { Alert, Button, Empty } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Thông báo trạng thái: danh sách rỗng, hoặc lỗi đã phân loại (`classifyAuditError`) kèm hành động phù hợp:
 * 401 → "Đăng nhập", lỗi tạm thời → "Thử lại", 403/404 → chỉ thông báo.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F08
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F09
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F10
 * @param {'empty'|'error'} kind
 * @param {{ kind: string, message: string, retry: boolean }} [error]
 * @param {() => void} [onRetry]
 * @param {string} [title]
 */
export default function AuditNotice({ kind, error, onRetry, title = 'Không thể tải nhật ký hoạt động' }) {
  const navigate = useNavigate()
  const location = useLocation()

  if (kind === 'empty') return <Empty description="Không có sự kiện khớp bộ lọc" />

  let action = null
  if (error?.kind === 'UNAUTHORIZED') {
    action = <Button size="small" onClick={() => navigate('/dang-nhap', { state: { from: location } })}>Đăng nhập</Button>
  } else if (error?.retry) {
    action = <Button size="small" onClick={onRetry}>Thử lại</Button>
  }

  return (
    <Alert
      type={error?.kind === 'FORBIDDEN' ? 'error' : 'warning'}
      showIcon
      role="alert"
      message={title}
      description={error?.message}
      action={action}
    />
  )
}
