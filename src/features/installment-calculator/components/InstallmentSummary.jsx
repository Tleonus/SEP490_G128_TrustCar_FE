import { Link } from 'react-router-dom'
import { ArrowRightOutlined, CarOutlined } from '@ant-design/icons'
import { METHOD_ANNUITY } from '../constants/installmentConstants'
import { formatRate } from '../constants/bankRates'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

function Row({ label, value, strong }) {
  return (
    <div className={strong ? `${styles.row} ${styles.rowStrong}` : styles.row}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/**
 * Kết quả tính, một dòng lưu ý và hai nút dẫn đi. `result = null` → chưa có xe/lãi hợp lệ (không hiện số).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F05
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F10
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F11
 * @param {{ result: object|null, method: string, input: object|null, termMonths: number, bank?: object,
 *   carName?: string|null, downMin: number, problem?: string|null, notices?: string[] }} props
 *   `notices`: lưu ý về ngân hàng đang chọn (khoản vay chưa đạt điều kiện vay của ngân hàng).
 *   `problem`: lý do chưa tính được (ví dụ số tiền trả trước chưa đủ mức tối thiểu).
 */
export default function InstallmentSummary({ result, method, input, termMonths, bank, carName, downMin, problem = null, notices = [] }) {
  const annuity = method === METHOD_ANNUITY

  return (
    <section className={`${styles.card} ${styles.resultCard}`} aria-label="Kết quả tính trả góp" aria-live="polite">
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Kết quả</h2>
        {bank && <span className={bank.isPartner ? `${styles.bankTag} ${styles.bankTagPartner}` : styles.bankTag}>{bank.name}</span>}
      </div>

      {result ? (
        <>
          <div className={styles.hero}>
            <span className={styles.heroLabel}>{annuity ? 'Trả mỗi tháng' : 'Trả tháng đầu'}</span>
            <strong className={styles.heroAmount}>{formatPrice(result.firstPayment)}</strong>
            <div className={styles.heroPills}>
              {carName && <span>{carName}</span>}
              <span><b>{termMonths}</b> tháng</span>
              {input && <span><b>{formatRate(input.ratePercent)}%</b>/năm</span>}
            </div>
          </div>

          <dl className={styles.results}>
            <Row label={`Trả trước (${String(result.downShare).replace('.', ',')}%)`} value={formatPrice(result.down)} />
            <Row label="Số tiền vay" value={formatPrice(result.loan)} />
            {!annuity && <Row label="Trả tháng cuối" value={formatPrice(result.lastPayment)} />}
            <Row label="Tổng lãi" value={formatPrice(result.totalInterest)} />
            <Row strong label="Tổng chi phí" value={formatPrice(result.totalCost)} />
          </dl>
        </>
      ) : (
        <p role="status" className={styles.empty}>{problem ?? 'Chọn xe để xem số tiền trả mỗi tháng.'}</p>
      )}

      {result && notices.length > 0 && (
        <ul className={styles.notices} aria-label="Lưu ý về ngân hàng đang chọn">
          {notices.map((text) => <li key={text}>{text}</li>)}
        </ul>
      )}

      <p className={styles.note}>
        Chỉ để tham khảo, chưa gồm phí và bảo hiểm. Vay tối đa {100 - downMin}% giá xe. Tính theo lãi ưu đãi cho cả kỳ
        vay; hết thời gian ưu đãi, lãi thường cao hơn. Lãi thực tế do ngân hàng duyệt.
      </p>

      <div className={styles.actions}>
        <Link to="/lien-he" className={`${styles.cta} ${styles.ctaPrimary}`}>
          <span>Tư vấn trả góp</span>
          <ArrowRightOutlined />
        </Link>
        <Link to="/xe" className={styles.cta}>
          <CarOutlined />
          <span>Xem xe đang bán</span>
        </Link>
      </div>
    </section>
  )
}
