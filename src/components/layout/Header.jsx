import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button, Drawer } from 'antd'
import { SunOutlined, MoonOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import logo from '../../assets/logo.jpg'
import { useThemeStore } from '../../store/useThemeStore'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/xe', label: 'Danh sách xe' },
  { to: '/ve-chung-toi', label: 'Về chúng tôi' },
  { to: '/lien-he', label: 'Liên hệ' },
]

export default function Header() {
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoLink}>
          <img src={logo} alt="TrustCar" className={styles.logoImg} />
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
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={mode === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          </button>

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate('/dang-nhap')}
            className={styles.loginBtn}
          >
            Đăng nhập
          </Button>

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
        title={<img src={logo} alt="TrustCar" style={{ height: 36, borderRadius: 6 }} />}
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
