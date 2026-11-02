import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown } from 'antd'
import { CarOutlined, HomeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import logo from '../assets/logo.jpg'
import { useAuthStore } from '../store/useAuthStore'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [{ to: '/admin/kho-xe', label: 'Kho xe', icon: <CarOutlined /> }]

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const dropdownItems = [
    { key: 'home', label: <Link to="/">Về trang chủ</Link>, icon: <HomeOutlined /> },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span onClick={handleLogout}>Đăng xuất</span>,
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/admin/kho-xe" className={styles.logoLink}>
          <img src={logo} alt="TrustCar" className={styles.logoImg} />
          <span className={styles.logoText}>TrustCar Admin</span>
        </Link>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div />
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
            <span className={styles.userInfo}>
              <Avatar style={{ backgroundColor: '#52c41a' }} icon={!user?.fullName ? <UserOutlined /> : undefined}>
                {user?.fullName?.[0]?.toUpperCase()}
              </Avatar>
              <span className={styles.userName}>{user?.fullName}</span>
            </span>
          </Dropdown>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
