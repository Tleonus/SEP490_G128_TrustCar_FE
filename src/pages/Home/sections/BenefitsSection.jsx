import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CustomerServiceOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import ScrollReveal from '../components/ScrollReveal'
import styles from './BenefitsSection.module.css'

const STATS = [
  { value: '150+', label: 'Hạng mục kiểm định' },
  { value: '100%', label: 'Minh bạch hồ sơ' },
  { value: '70%', label: 'Hỗ trợ trả góp' },
]

const BENEFITS = [
  {
    code: '01',
    icon: <SafetyCertificateOutlined />,
    title: 'Kiểm định 150+ hạng mục chuẩn CPO',
    desc: 'Mỗi chiếc xe đều vượt qua quy trình kiểm tra chuyên sâu về động cơ, hộp số, khung gầm và nội thất trước khi trưng bày.',
    tags: ['Động cơ & Hộp số', 'Khung gầm nguyên bản', 'Chứng nhận QR'],
  },
  {
    code: '02',
    icon: <FileProtectOutlined />,
    title: 'Minh bạch lịch sử, cam kết 3 Không',
    desc: 'Công khai đầy đủ đời xe, số km thực tế và lịch sử bảo dưỡng — cam kết bằng văn bản không đâm đụng, không thủy kích, không tua ODO.',
    tags: ['Đúng ODO thực tế', 'Giá niêm yết rõ ràng', 'Pháp lý sang tên'],
  },
  {
    code: '03',
    icon: <CustomerServiceOutlined />,
    title: 'Tư vấn 1-1 & Hỗ trợ tài chính trọn gói',
    desc: 'Đội ngũ chuyên viên đồng hành từ bước chọn xe, lái thử thực tế, tính phương án trả góp ngân hàng đến hoàn tất thủ tục giao xe.',
    tags: ['Trả góp tới 70%', 'Duyệt hồ sơ 24h', 'Lái thử tận nơi'],
  },
]

export default function BenefitsSection() {
  return (
    <section className={styles.benefits}>
      <div className="container">
        <div className={styles.splitLayout}>
          {/* Cột trái: Tuyên ngôn giá trị + 3 chỉ số cam kết */}
          <ScrollReveal variant="left" className={styles.leftColumn}>
            <span className={styles.kicker}>VÌ SAO CHỌN TRUSTCAR</span>
            <h2 className={styles.heading}>An tâm mua xe, yên tâm sử dụng</h2>
            <p className={styles.lead}>
              TrustCar xây dựng quy chuẩn showroom xe đã qua sử dụng minh bạch, nơi mọi chiếc xe đều có hồ sơ kiểm định điện tử và cam kết rõ ràng trước khi giao chìa khóa.
            </p>

            <div className={styles.statsRow}>
              {STATS.map((stat) => (
                <div key={stat.label} className={styles.statBox}>
                  <strong className={styles.statValue}>{stat.value}</strong>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Cột phải: 3 trụ cột dạng danh sách kiến trúc hiện đại */}
          <div className={styles.rightColumn}>
            {BENEFITS.map((item, idx) => (
              <ScrollReveal key={item.code} variant="right" delay={idx * 90}>
                <article className={styles.pillarRow}>
                  <div className={styles.pillarLeft}>
                    <span className={styles.pillarCode}>{item.code}</span>
                    <div className={styles.iconBox} aria-hidden="true">
                      {item.icon}
                    </div>
                  </div>

                  <div className={styles.pillarBody}>
                    <h3 className={styles.pillarTitle}>{item.title}</h3>
                    <p className={styles.pillarDesc}>{item.desc}</p>
                    <div className={styles.tagList}>
                      {item.tags.map((tag) => (
                        <span key={tag} className={styles.tagChip}>
                          <CheckOutlined /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
