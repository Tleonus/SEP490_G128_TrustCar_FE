import { Link } from 'react-router-dom'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons'
import logo from '../../assets/logo-transparent.png'
import { CONTACT_INFO } from '../../config/contactInfo'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.brand}>
            <img src={logo} alt="TrustCar" className={styles.brandLogo} />
            <span className={styles.brandName}>TrustCar</span>
          </div>
          <p className={styles.desc}>
            Nền tảng mua bán xe đã qua kiểm định, minh bạch thông tin, đồng hành cùng bạn
            trên mọi hành trình.
          </p>
        </div>

        <div>
          <div className={styles.colTitle}>Liên kết</div>
          <ul className={styles.linkList}>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/xe">Danh sách xe</Link></li>
            <li><Link to="/ve-chung-toi">Về chúng tôi</Link></li>
            <li><Link to="/lien-he">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <div className={styles.colTitle}>Hỗ trợ</div>
          <ul className={styles.linkList}>
            <li><Link to="/lien-he">Tư vấn mua xe</Link></li>
            <li><Link to="/lien-he">Chính sách kiểm định</Link></li>
            <li><Link to="/lien-he">Góp ý, phản hồi</Link></li>
          </ul>
        </div>

        <div>
          <div className={styles.colTitle}>Liên hệ</div>
          <div className={styles.contactItem}>
            <EnvironmentOutlined />
            <a href={CONTACT_INFO.mapUrl} target="_blank" rel="noreferrer">{CONTACT_INFO.showroomDisplay}</a>
          </div>
          <div className={styles.contactItem}>
            <PhoneOutlined />
            <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phoneDisplay}</a>
          </div>
          <div className={styles.contactItem}>
            <MailOutlined />
            <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        © {year} TrustCar. Mọi quyền được bảo lưu.
      </div>
    </footer>
  )
}
