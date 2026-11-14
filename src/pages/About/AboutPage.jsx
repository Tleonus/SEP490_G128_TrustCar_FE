import styles from './AboutPage.module.css'

const STATS = [
  { number: '12+', label: 'Thương hiệu xe' },
  { number: '150+', label: 'Hạng mục kiểm định' },
  { number: '3', label: 'Showroom trên toàn quốc' },
  { number: '10+', label: 'Năm kinh nghiệm' },
]

const VALUES = [
  {
    title: 'Minh bạch',
    desc: 'Công khai thông tin xe, lịch sử sử dụng, không che giấu lỗi hay thổi giá.',
  },
  {
    title: 'Chuyên nghiệp',
    desc: 'Quy trình kiểm định chuẩn hoá, đội ngũ tư vấn được đào tạo bài bản.',
  },
  {
    title: 'Đồng hành lâu dài',
    desc: 'Hỗ trợ khách hàng cả trước và sau khi mua xe, bảo hành và chăm sóc xe.',
  },
]

export default function AboutPage() {
  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Về TrustCar</h1>
          <p className={styles.heroDesc}>
            TrustCar là nền tảng mua bán xe đã qua kiểm định, giúp khách hàng
            an tâm lựa chọn chiếc xe phù hợp với mức giá minh bạch.
          </p>
        </div>
      </section>

      <div className="container">
        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <section className={styles.valuesSection}>
          <div className="section-head">
            <div className="section-eyebrow">Giá trị cốt lõi</div>
            <h2 className="section-title">Điều làm nên sự khác biệt của TrustCar</h2>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map((value) => (
              <div key={value.title} className={styles.valueCard}>
                <div className={styles.valueTitle}>{value.title}</div>
                <p className={styles.valueDesc}>{value.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
