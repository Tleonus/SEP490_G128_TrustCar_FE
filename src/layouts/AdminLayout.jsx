import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ConfigProvider, Dropdown, theme } from 'antd'
import { HomeOutlined, LogoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import Icon from '../features/vehicle-intake/components/VehicleIntakeIcon'
import { useAuthStore } from '../store/useAuthStore'
import { ADMIN_PATHS } from '../router/paths'
import logo from '../assets/logo-transparent.png'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { to: ADMIN_PATHS.overview, label: 'Tổng quan', icon: 'grid' },
  { to: ADMIN_PATHS.inventory, label: 'Kho xe', icon: 'car' },
  { to: ADMIN_PATHS.vehicleIntake, label: 'Nhập xe & Thẩm định', icon: 'clipboard' },
  // KAN-55: màn lập biên bản kiểm định cho Sale (ADMIN và SALES_STAFF đều vào được)
  { to: ADMIN_PATHS.inspection, label: 'Kiểm định xe', icon: 'shield' },
  { to: ADMIN_PATHS.sales, label: 'Quản lý bán hàng', icon: 'sales' },
  { to: ADMIN_PATHS.baseSettings, label: 'Cấu hình showroom', icon: 'settings' },
  { to: '/admin/chung-nhan', label: 'Chứng nhận CPO', iconNode: <SafetyCertificateOutlined /> },
]

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const currentPage = NAV_ITEMS.find((item) => item.to === pathname)
  const displayName = user?.fullName || user?.email || 'Tài khoản quản lý'
  const roleLabel = user?.roleName === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên bán hàng'
  const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const accountItems = [
    { key: 'home', label: <Link to="/">Về trang chủ</Link>, icon: <HomeOutlined /> },
    { key: 'password', label: <Link to="/doi-mat-khau">Đổi mật khẩu</Link> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout },
  ]

  return (
    <ConfigProvider theme={{
      algorithm: theme.defaultAlgorithm,
      token: { colorPrimary: '#1d4ed8', colorText: '#172b43', colorBorder: '#c6d2df', borderRadius: 8 },
    }}>
      <div className={styles['app-shell']}>
        <aside className={styles.sidebar}>
          <Link to={ADMIN_PATHS.overview} className={styles['brand-lockup']} aria-label="TrustCar - Tổng quan">
            <img src={logo} alt="TrustCar" className={styles['brand-logo']} />
          </Link>
          <div className={styles['workspace-label']}>KHÔNG GIAN QUẢN LÝ</div>
          <nav className={styles['main-nav']} aria-label="Điều hướng quản lý">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) => isActive ? styles.active : undefined}
              >
                {item.iconNode ?? <Icon name={item.icon} />}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className={styles['sidebar-bottom']}>
            <Link to="/lien-he" className={styles['help-card']}>
              <div className={styles['help-icon']}><Icon name="info" size={17} /></div>
              <div><strong>Cần hỗ trợ?</strong><span>Liên hệ TrustCar</span></div>
              <Icon name="chevron" size={16} />
            </Link>
            <div className={styles['profile-row']}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles['profile-copy']}><strong>{displayName}</strong><span>{roleLabel}</span></div>
            </div>
          </div>
        </aside>
        <div className={styles['main-content']}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumbs}>
              <strong>{currentPage?.label || 'Trang quản trị'}</strong>
            </div>
            <div className={styles['topbar-actions']}>
              <span className={styles['role-label']}>{roleLabel}</span>
              <Dropdown menu={{ items: accountItems }} trigger={['click']}>
                <button type="button" className={styles['account-button']} aria-label="Mở menu tài khoản">
                  <span className={styles.avatar}>{initials}</span>
                  <span className={styles['account-name']}>{displayName}</span>
                  <Icon name="chevron" size={16} />
                </button>
              </Dropdown>
            </div>
          </header>
          <main id="management-content" className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </ConfigProvider>
  )
}
