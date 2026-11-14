import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import styles from './BenefitsSection.module.css'

const BENEFITS = [
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Kiểm định 150+ hạng mục',
    desc:
      'Mỗi chiếc xe đều trải qua quy trình kiểm định nghiêm ngặt về động cơ, khung gầm, nội thất trước khi lên kệ.',
  },
  {
    icon: <FileProtectOutlined />,
    title: 'Minh bạch lịch sử xe',
    desc:
      'Thông tin đời xe, số km, lịch sử va chạm được công khai rõ ràng, không giấu lỗi, không đội giá.',
  },
  {
    icon: <CustomerServiceOutlined />,
    title: 'Tư vấn tận tâm',
    desc:
      'Đội ngũ tư vấn hỗ trợ xuyên suốt quá trình chọn xe, định giá, thủ tục mua bán và hỗ trợ trả góp.',
  },
]

export default function BenefitsSection() {
  return (
    <section className={styles.benefits}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Vì sao chọn TrustCar</div>
          <h2 className="section-title">An tâm mua xe, yên tâm sử dụng</h2>
          <p className="section-desc">
            TrustCar cam kết mang đến trải nghiệm mua xe cũ minh bạch,
            chuyên nghiệp và đáng tin cậy.
          </p>
        </div>
        <div className={styles.grid}>
          {BENEFITS.map((item) => (
            <div key={item.title} className={styles.card}>
              <div className={styles.icon}>{item.icon}</div>
              <div className={styles.cardTitle}>{item.title}</div>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
