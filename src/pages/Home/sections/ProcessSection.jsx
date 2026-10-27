import styles from './ProcessSection.module.css'

const STEPS = [
  {
    title: 'Tìm & chọn xe',
    desc: 'Tìm kiếm theo thương hiệu, giá, năm sản xuất phù hợp với nhu cầu của bạn.',
  },
  {
    title: 'Xem xe & kiểm định',
    desc: 'Đặt lịch xem xe trực tiếp tại showroom, tham khảo hồ sơ kiểm định chi tiết.',
  },
  {
    title: 'Tư vấn & thỏa thuận',
    desc: 'Nhận tư vấn giá, thủ tục, hỗ trợ trả góp từ đội ngũ TrustCar.',
  },
  {
    title: 'Hoàn tất giao dịch',
    desc: 'Ký hợp đồng, sang tên, nhận xe nhanh chóng, minh bạch.',
  },
]

export default function ProcessSection() {
  return (
    <section className={styles.process}>
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">Quy trình mua xe</div>
          <h2 className="section-title">Chỉ 4 bước để sở hữu xe mơ ước</h2>
          <p className="section-desc">
            Quy trình đơn giản, rõ ràng, tiết kiệm thời gian cho khách hàng.
          </p>
        </div>
        <div className={styles.grid}>
          {STEPS.map((step, idx) => (
            <div key={step.title} className={styles.step}>
              <div className={styles.stepNumber}>{idx + 1}</div>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
