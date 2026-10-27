import { Link, NavLink } from 'react-router-dom'
import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import heroImg from '../../assets/hero_slides/hero1.jpg'
import logo from '../../assets/logo.jpg'
import styles from './AuthLayout.module.css'

const HIGHLIGHTS = [
  { icon: <SafetyCertificateOutlined />, text: 'Xe kiểm định 150+ hạng mục' },
  { icon: <FileProtectOutlined />, text: 'Minh bạch lịch sử, giấy tờ rõ ràng' },
  { icon: <CustomerServiceOutlined />, text: 'Tư vấn và hỗ trợ sau mua tận tâm' },
]

const STATS = [
  { value: '2.000+', label: 'Xe đã bàn giao' },
  { value: '98%', label: 'Khách hài lòng' },
  { value: '24/7', label: 'Hỗ trợ' },
]

// Khung chung cho trang đăng nhập / đăng ký: bên trái ảnh thương hiệu, bên phải form
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.visual}>
          <img src={heroImg} alt="" className={styles.visualImg} aria-hidden="true" />
          <div className={styles.visualOverlay} />

          <div className={styles.visualTop}>
            <span className={styles.eyebrow}>TrustCar</span>
            <h2 className={styles.visualTitle}>
              Mua xe cũ, <span className={styles.accent}>an tâm</span> như xe mới
            </h2>
            <ul className={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <li key={item.text}>
                  <span className={styles.highlightIcon}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.stat}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className={styles.formPanel}>
          <Link to="/" className={styles.mobileLogo}>
            <img src={logo} alt="TrustCar" />
          </Link>

          <nav className={styles.switcher} aria-label="Chuyển giữa đăng nhập và đăng ký">
            <NavLink
              to="/dang-nhap"
              className={({ isActive }) =>
                isActive ? `${styles.switchItem} ${styles.switchActive}` : styles.switchItem
              }
            >
              Đăng nhập
            </NavLink>
            <NavLink
              to="/dang-ky"
              className={({ isActive }) =>
                isActive ? `${styles.switchItem} ${styles.switchActive}` : styles.switchItem
              }
            >
              Đăng ký
            </NavLink>
          </nav>

          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>

          <div className={styles.formBody}>{children}</div>

          {footer && <div className={styles.footer}>{footer}</div>}
        </section>
      </div>
    </div>
  )
}
