import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'
import { PROFILE_ERROR } from '../utils/profileErrors'
import styles from '../styles/ProfilePage.module.css'

/**
 * Khối thông báo thay cho form khi không thể hiện form một cách an toàn: hồ sơ chưa đủ (kèm liên kết hoàn tất),
 * không có hồ sơ khách, hết phiên, hoặc tải lỗi (kèm "Thử lại"). Không bao giờ hiện form rỗng có thể bị lưu nhầm.
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F03
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F10
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F11
 * @param {{ error: { kind: string, message: string, action?: { label: string, to: string } }, onRetry?: () => void }} props
 */
export default function ProfileNotice({ error, onRetry }) {
  const retryable = [PROFILE_ERROR.NETWORK, PROFILE_ERROR.SERVER, PROFILE_ERROR.RATE_LIMIT].includes(error.kind)
  const status = error.kind === PROFILE_ERROR.PROFILE_INCOMPLETE ? 'info' : 'warning'

  return (
    <div className={styles.notice} role="alert">
      <Result
        status={status}
        title={error.kind === PROFILE_ERROR.PROFILE_INCOMPLETE ? 'Hoàn tất hồ sơ' : 'Không thể hiển thị thông tin'}
        subTitle={error.message}
        extra={[
          error.action && <Link key="action" to={error.action.to}><Button type="primary" size="large">{error.action.label}</Button></Link>,
          retryable && onRetry && <Button key="retry" size="large" onClick={onRetry}>Thử lại</Button>,
        ]}
      />
    </div>
  )
}
