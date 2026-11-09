import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Button, Drawer, Dropdown } from 'antd'
import { SunOutlined, MoonOutlined, MenuOutlined, UserOutlined, PhoneFilled, HeartFilled, HeartOutlined } from '@ant-design/icons'
import logo from '../../assets/logo-transparent.png'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSavedCarsStore } from '../../features/saved-cars/store/useSavedCarsStore'
import { hasUnseenAlert } from '../../features/saved-cars/utils/savedCars'
import styles from './Header.module.css'
import { useContactInfo } from '../../config/contactInfo'

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/xe', label: 'Danh sách xe' },
  { to: '/ve-chung-toi', label: 'Về chúng tôi' },
  { to: '/lien-he', label: 'Liên hệ' },
]

export default function Header() {
  const CONTACT_INFO = useContactInfo()
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  // ✅ Tách riêng từng selector – KHÔNG trả về object mới mỗi render
  // → tránh lỗi "Maximum update depth exceeded" / "getSnapshot should be cached"
  const user            = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout          = useAuthStore((state) => state.logout)
  const savedCount      = useSavedCarsStore((state) => state.items.length)
  const unseenDrops     = useSavedCarsStore((state) => state.items.filter(hasUnseenAlert).length)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Menu items dùng API mới (antd v5+) – không dùng overlay đã deprecated
  const dropdownItems = [
    {
      key: 'profile',
      label: <Link to="/profile">Thông tin cá nhân</Link>,
    },
    {
      key: 'change-password',
      label: <Link to="/doi-mat-khau">Đổi mật khẩu</Link>,
    },
    // Chỉ hiện "Quản trị" nếu user có role ADMIN hoặc SALES_STAFF.
    // Dùng user.roleName (chuỗi thật từ backend) - user.role là object Role đã populate, không phải chuỗi.
    ...(user?.roleName === 'ADMIN' || user?.roleName === 'SALES_STAFF'
      ? [{ key: 'admin', label: <Link to="/admin">Trang quản trị</Link> }]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      label: <span style={{ color: '#ff4d4f' }}>Đăng xuất</span>,
    },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoLink}>
          {/* logo.jpg đã import đúng chuẩn Vite – dùng imported variable */}
          <img src={logo} alt="TrustCar Logo" className={styles.logoImg} />
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <a href={CONTACT_INFO.phoneHref} className={styles.hotline} aria-label={`Gọi ${CONTACT_INFO.phoneDisplay}`}>
            <span className={styles.hotlineIcon}><PhoneFilled /></span>
            <span className={styles.hotlineCopy}>
              <small>Hotline tư vấn</small>
              <strong>{CONTACT_INFO.phoneDisplay}</strong>
            </span>
          </a>
          <Link
            to="/xe-da-luu"
            className={`${styles.wishlistBtn} ${savedCount > 0 ? styles.wishlistActive : ''}`}
            aria-label={`Xe đã lưu (${savedCount})`}
            title={unseenDrops > 0 ? `${unseenDrops} xe đã lưu vừa giảm giá` : `Xe đã lưu (${savedCount})`}
          >
            {savedCount > 0 ? <HeartFilled /> : <HeartOutlined />}
            {savedCount > 0 && <span className={styles.wishlistCount}>{savedCount}</span>}
            {unseenDrops > 0 && <span className={styles.wishlistAlertDot} aria-hidden="true" />}
          </Link>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={mode === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          </button>

          {/* ✅ Kiểm tra CẢ HAI: isAuthenticated VÀ user phải không null
              Tránh hiện Avatar "U" khi token còn nhưng user đã bị clear */}
          {isAuthenticated && user ? (
            <Dropdown
              menu={{ items: dropdownItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              trigger={['click']}
            >
              <span
                className={styles.userInfo}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Avatar
                  style={{ backgroundColor: '#52c41a', flexShrink: 0 }}
                  icon={!user.fullName ? <UserOutlined /> : undefined}
                >
                  {user.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <span className={styles.userName}>{user.fullName}</span>
              </span>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/dang-nhap')}
              className={styles.loginBtn}
            >
              Đăng nhập
            </Button>
          )}

          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
          >
            <MenuOutlined />
          </button>
        </div>
      </div>

      <Drawer
        title={<img src={logo} alt="TrustCar" className={styles.drawerLogo} />}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        <nav className={styles.drawerNav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? `${styles.drawerNavLink} ${styles.drawerNavLinkActive}`
                  : styles.drawerNavLink
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </Drawer>
    </header>
  )
}
