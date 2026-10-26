import { Link } from 'react-router-dom'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons'
import logo from '../../assets/logo.jpg'
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
            <span>Showroom TrustCar, Quận 1, TP. Hồ Chí Minh</span>
          </div>
          <div className={styles.contactItem}>
            <PhoneOutlined />
            <span>1900 1234</span>
          </div>
          <div className={styles.contactItem}>
            <MailOutlined />
            <span>support@trustcar.vn</span>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        © {year} TrustCar. Mọi quyền được bảo lưu.
      </div>
    </footer>
  )
}
