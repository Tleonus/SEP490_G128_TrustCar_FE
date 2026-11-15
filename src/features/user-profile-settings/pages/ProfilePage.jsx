import { useState } from 'react'
import { Skeleton, Tabs } from 'antd'
import { useAuthStore } from '../../../store/useAuthStore'
import ProfileForm from '../components/ProfileForm'
import ProfileNotice from '../components/ProfileNotice'
import SettingsTab from '../components/SettingsTab'
import { useProfile } from '../hooks/useProfile'
import { useSettings } from '../hooks/useSettings'
import styles from '../styles/ProfilePage.module.css'

const PROFILE_TAB = 'profile'
const SETTINGS_TAB = 'settings'

/**
 * Trang /profile: tab "Thông tin cá nhân" cho mọi tài khoản, tab "Cài đặt" chỉ cho khách
 * (nhân viên không thấy tab và không bao giờ gọi /profile/settings, REQ-F15).
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F01
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F15
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F16
 */
export default function ProfilePage() {
  const profile = useProfile()
  const roleName = useAuthStore((state) => state.user?.roleName)
  const [activeTab, setActiveTab] = useState(PROFILE_TAB)
  // Vai trò lấy từ BE khi đã có hồ sơ; trong lúc tải dùng vai trò đã lưu lúc đăng nhập.
  const isCustomer = (profile.profile?.role ?? roleName) === 'CUSTOMER'
  const settings = useSettings(isCustomer && activeTab === SETTINGS_TAB)

  let body
  if (profile.status === 'loading') body = <div className={styles.card}><Skeleton active paragraph={{ rows: 6 }} /></div>
  else if (profile.status === 'error') body = <ProfileNotice error={profile.error} onRetry={profile.reload} />
  else body = <ProfileForm profile={profile.profile} saving={profile.saving} onSave={profile.save} />

  const items = [{ key: PROFILE_TAB, label: 'Thông tin cá nhân', children: body }]
  if (isCustomer && profile.status === 'ready') {
    items.push({ key: SETTINGS_TAB, label: 'Cài đặt', children: <SettingsTab settings={settings} /> })
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Hồ sơ của tôi</h1>
      <p className={styles.subtitle}>Xem và cập nhật thông tin tài khoản của bạn.</p>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} destroyOnHidden={false} />
    </main>
  )
}
