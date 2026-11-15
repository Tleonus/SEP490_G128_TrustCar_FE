import { App, Button, Spin, Switch } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import ProfileNotice from './ProfileNotice'
import styles from '../styles/ProfilePage.module.css'

/**
 * Tab "Cài đặt" của khách: công tắc nhận email tiếp thị (lưu ngay khi bật/tắt) và lối tới trang đổi mật khẩu.
 * Công tắc bị khóa trong lúc lưu; lỗi → công tắc trở về giá trị cũ (do `useSettings` xóa giá trị chờ) và báo lỗi.
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F13
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F14
 * @param {{ settings: ReturnType<typeof import('../hooks/useSettings').useSettings> }} props
 */
export default function SettingsTab({ settings }) {
  const { message } = App.useApp()

  if (settings.status === 'error') return <ProfileNotice error={settings.error} onRetry={settings.reload} />
  if (settings.status !== 'ready') return <div className={styles.notice}><Spin /></div>

  async function handleToggle(next) {
    const result = await settings.toggle(next)
    if (!result.ok && result.error) message.error(result.error.message)
  }

  return (
    <div className={styles.card}>
      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleFirst}`}>Thông báo</h3>
      <div className={styles.settingRow}>
        <div className={styles.settingText}>
          <p className={styles.settingTitle} id="marketing-label">Nhận email tiếp thị từ showroom</p>
          <span className={styles.hint}>Tin về xe mới, ưu đãi và chương trình của TrustCar. Bạn có thể tắt bất cứ lúc nào.</span>
        </div>
        <Switch
          aria-labelledby="marketing-label"
          checked={settings.value}
          loading={settings.saving}
          disabled={settings.saving}
          onChange={handleToggle}
        />
      </div>

      <h3 className={styles.sectionTitle}>Bảo mật</h3>
      <div className={styles.settingRow}>
        <div className={styles.settingText}>
          <p className={styles.settingTitle}>Mật khẩu</p>
          <span className={styles.hint}>Đổi mật khẩu đăng nhập của bạn.</span>
        </div>
        <Link to="/doi-mat-khau"><Button size="large" icon={<LockOutlined />}>Đổi mật khẩu</Button></Link>
      </div>
    </div>
  )
}
