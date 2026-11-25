import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ConfigProvider, Dropdown, theme } from 'antd'
import {
  AuditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  HomeOutlined,
  KeyOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import Icon from '../features/vehicle-intake/components/VehicleIntakeIcon'
import { useAuthStore } from '../store/useAuthStore'
import { ADMIN_PATHS } from '../router/paths'
import logo from '../assets/logo-transparent.png'
import styles from './AdminLayout.module.css'

const NAV_GROUPS = [
  {
    key: 'executive',
    title: 'Điều hành & Phân tích',
    items: [
      { to: ADMIN_PATHS.overview, label: 'Tổng quan kinh doanh', shortLabel: 'Tổng quan', icon: 'chart', groupLabel: 'ĐIỀU HÀNH' },
      { to: ADMIN_PATHS.inspectionDashboard, label: 'Tổng quan kiểm định', shortLabel: 'TK Kiểm định', icon: 'chart', groupLabel: 'ĐIỀU HÀNH' },
    ],
  },
  {
    key: 'inventory-cpo',
    title: 'Kho xe & Chuẩn CPO',
    items: [
      { to: ADMIN_PATHS.inventory, label: 'Quản lý kho xe', shortLabel: 'Kho xe', icon: 'car', groupLabel: 'KHO & CPO' },
      { to: ADMIN_PATHS.vehicleIntake, label: 'Nhập xe & Thẩm định', shortLabel: 'Nhập xe', icon: 'clipboard', groupLabel: 'KHO & CPO' },
      { to: ADMIN_PATHS.inspection, label: 'Kiểm định xe', shortLabel: 'Kiểm định', icon: 'shield', groupLabel: 'KHO & CPO' },
      { to: ADMIN_PATHS.approval, label: 'Duyệt kiểm định', shortLabel: 'Duyệt CPO', iconNode: <AuditOutlined />, adminOnly: true, groupLabel: 'KHO & CPO' },
      { to: '/admin/chung-nhan', label: 'Chứng nhận CPO', shortLabel: 'Chứng nhận', iconNode: <SafetyCertificateOutlined />, groupLabel: 'KHO & CPO' },
    ],
  },
  {
    key: 'commercial',
    title: 'Kinh doanh & Dịch vụ',
    items: [
      { to: ADMIN_PATHS.sales, label: 'Quản lý bán hàng', shortLabel: 'Bán hàng', icon: 'sales', groupLabel: 'KINH DOANH' },
      { to: '/admin/lich-lai-thu', label: 'Lịch lái thử', shortLabel: 'Lịch lái thử', iconNode: <CalendarOutlined />, groupLabel: 'KINH DOANH' },
      { to: ADMIN_PATHS.services, label: 'Dịch vụ showroom', shortLabel: 'Dịch vụ', iconNode: <ToolOutlined />, groupLabel: 'DỊCH VỤ' },
    ],
  },
  {
    key: 'system',
    title: 'Hệ thống & Bảo mật',
    items: [
      { to: ADMIN_PATHS.baseSettings, label: 'Cấu hình showroom', shortLabel: 'Cấu hình', icon: 'settings', groupLabel: 'HỆ THỐNG' },
      { to: ADMIN_PATHS.auditLogs, label: 'Nhật ký hoạt động', shortLabel: 'Nhật ký', iconNode: <HistoryOutlined />, adminOnly: true, groupLabel: 'BẢO MẬT' },
      { to: ADMIN_PATHS.userManagement, label: 'Quản lý người dùng', shortLabel: 'Nhân sự', iconNode: <TeamOutlined />, adminOnly: true, groupLabel: 'HỆ THỐNG' },
    ],
  },
]

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

const ADMIN_ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  SALES_STAFF: 'Nhân viên bán hàng',
  INSPECTOR: 'Kiểm định viên',
}

/** Role của user dưới dạng mảng (KAN-93: một người có thể giữ nhiều role). */
const rolesOf = (user) => (
  user?.roleNames?.length ? user.roleNames : (user?.roleName ? [user.roleName] : [])
)

function resolveCurrentPage(pathname) {
  const exact = ALL_NAV_ITEMS.find((item) => item.to === pathname)
  if (exact) return exact
  return ALL_NAV_ITEMS.find((item) => pathname.startsWith(`${item.to}/`)) || null
}

const ADMIN_ANTD_THEME = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1d4ed8',
    colorInfo: '#1d4ed8',
    colorSuccess: '#0f766e',
    colorWarning: '#b45309',
    colorError: '#b91c1c',
    colorText: '#0f2137',
    colorTextSecondary: '#475569',
    colorBorder: '#d5e0ee',
    colorBorderSecondary: '#e5edf7',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f1f5fb',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    controlHeight: 40,
    controlHeightLG: 44,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: '0 4px 12px rgba(29, 78, 216, 0.22)',
    },
    Table: {
      headerBg: '#f6f9fd',
      headerColor: '#475569',
      headerSplitColor: 'transparent',
      rowHoverBg: '#f2f7ff',
      borderColor: '#e8eef7',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Card: {
      headerFontSize: 16,
      paddingLG: 22,
    },
    Tabs: {
      itemSelectedColor: '#1d4ed8',
      inkBarColor: '#1d4ed8',
      itemHoverColor: '#1e40af',
      titleFontSize: 14,
    },
    Modal: {
      borderRadiusLG: 16,
    },
  },
}

function formatRealtimeClock(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  return `${hours}:${minutes} ${day}/${month}/${year}`
}

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [now, setNow] = useState(() => new Date())

  // Khu quản trị luôn dùng giao diện sáng chuẩn Studio; ép data-theme="light" trên <html>
  // để mọi Modal/Drawer/Popover render qua Portal ra ngoài .app-shell không bị dính chữ trắng của dark mode.
  useEffect(() => {
    const html = document.documentElement
    const previousTheme = html.getAttribute('data-theme')
    html.setAttribute('data-theme', 'light')
    return () => {
      if (previousTheme) html.setAttribute('data-theme', previousTheme)
    }
  }, [])

  // Đồng hồ thời gian thực trên thanh Topbar (cập nhật mỗi giây theo mẫu "HH:mm DD/MM/YYYY")
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const currentPage = resolveCurrentPage(pathname)
  const displayName = user?.fullName || user?.email || 'Tài khoản quản lý'
  const userRoles = rolesOf(user)
  const isAdmin = userRoles.includes('ADMIN')
  // Primary role quyết định nhãn; KAN-93 giữ roleName = role chính.
  const roleLabel = ADMIN_ROLE_LABELS[user?.roleName] || 'Nhân viên'
  const workspaceEyebrow = isAdmin ? 'ADMIN WORKSPACE' : 'SALES WORKSPACE'
  const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const accountItems = [
    { key: 'home', label: <Link to="/">Về trang chủ khách</Link>, icon: <HomeOutlined /> },
    { key: 'password', label: <Link to="/doi-mat-khau">Đổi mật khẩu</Link>, icon: <KeyOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ]

  return (
    <ConfigProvider theme={ADMIN_ANTD_THEME}>
      <div className={styles['app-shell']}>
        <aside className={styles.sidebar}>
          <div className={styles['sidebar-top']}>
            <Link to={ADMIN_PATHS.overview} className={styles['brand-lockup']} aria-label="TrustCar - Tổng quan">
              <img src={logo} alt="TrustCar" className={styles['brand-logo']} />
            </Link>
            <div className={styles['workspace-badge']}>
              <span className={styles['workspace-dot']} aria-hidden="true" />
              <span>TRUSTCAR STUDIO · CPO</span>
            </div>
          </div>

          <nav className={styles['main-nav']} aria-label="Điều hướng quản lý">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin)
              if (visibleItems.length === 0) return null
              return (
                <div key={group.key} className={styles['nav-group']}>
                  <div className={styles['workspace-label']}>{group.title}</div>
                  <div className={styles['nav-group-items']}>
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={item.label}
                        aria-label={item.label}
                        className={({ isActive }) => isActive ? styles.active : undefined}
                      >
                        <span className={styles['nav-icon']} aria-hidden="true">
                          {item.iconNode ?? <Icon name={item.icon} size={18} />}
                        </span>
                        <span className={styles['nav-label']}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className={styles['sidebar-bottom']}>
            <Link to="/lien-he" className={styles['help-card']}>
              <div className={styles['help-icon']}><Icon name="info" size={17} /></div>
              <div>
                <strong>Trung tâm hỗ trợ</strong>
                <span>Quy trình &amp; kỹ thuật CPO</span>
              </div>
              <Icon name="chevron" size={16} />
            </Link>
            <div className={styles['profile-row']}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles['profile-copy']}>
                <strong>{displayName}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className={styles['main-content']}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumbs}>
              <div className={styles['topbar-icon']} aria-hidden="true">
                {currentPage?.iconNode ?? <Icon name={currentPage?.icon || 'chart'} size={20} />}
              </div>
              <div className={styles['breadcrumb-copy']}>
                <div className={styles['breadcrumb-eyebrow']}>
                  <span className={styles['live-dot']} aria-hidden="true" />
                  <span>{workspaceEyebrow}</span>
                  <span className={styles['breadcrumb-sep']} aria-hidden="true">·</span>
                  <span>{currentPage?.groupLabel || 'HỆ THỐNG CPO'}</span>
                </div>
                <strong className={styles['breadcrumb-title']}>
                  Trung tâm quản trị showroom TrustCar
                </strong>
              </div>
            </div>

            <div className={styles['topbar-actions']}>
              <div className={styles['clock-widget']} aria-label="Thời gian cập nhật hệ thống">
                <span className={styles['clock-label']}>
                  <ClockCircleOutlined aria-hidden="true" /> Cập nhật
                </span>
                <time className={styles['clock-time']} dateTime={now.toISOString()}>
                  {formatRealtimeClock(now)}
                </time>
              </div>
              <Link to="/" className={styles['storefront-link']} title="Về trang chủ khách hàng" aria-label="Về trang chủ">
                <HomeOutlined aria-hidden="true" />
                <span>Trang chủ</span>
              </Link>
              <Dropdown menu={{ items: accountItems }} trigger={['click']} placement="bottomRight">
                <button type="button" className={styles['account-button']} aria-label="Mở menu tài khoản">
                  <span className={styles.avatar}>{initials}</span>
                  <span className={styles['account-meta']}>
                    <span className={styles['account-name']}>{displayName}</span>
                    <span className={styles['account-sub']}>{roleLabel}</span>
                  </span>
                  <span className={styles['account-chevron']} aria-hidden="true">
                    <Icon name="chevron" size={13} />
                  </span>
                </button>
              </Dropdown>
            </div>
          </header>

          <main id="management-content" className={styles.content} key={pathname}>
            <Outlet />
          </main>
        </div>
      </div>
    </ConfigProvider>
  )
}
