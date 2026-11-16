import { Link } from 'react-router-dom'
import { METHOD_ANNUITY } from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const NOTES = [
  'Kết quả chỉ để tham khảo, chưa gồm phí hồ sơ, bảo hiểm, thuế và các khoản phí khác.',
  'Lãi suất thực tế do ngân hàng quyết định; lãi suất nhập ở đây chỉ là số minh họa.',
  'Hạn mức vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).',
]

function Row({ label, value, strong }) {
  return (
    <div className={strong ? `${styles.row} ${styles.rowStrong}` : styles.row}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function MonthlyRows({ result, method }) {
  if (method === METHOD_ANNUITY) return <Row strong label="Trả mỗi tháng" value={formatPrice(result.firstPayment)} />
  return (
    <>
      <Row strong label="Trả tháng đầu" value={formatPrice(result.firstPayment)} />
      <Row label="Trả tháng cuối" value={formatPrice(result.lastPayment)} />
    </>
  )
}

/**
 * Kết quả tính, lời nhắc và hai nút dẫn đi. `result = null` khi thông số chưa hợp lệ (không hiện số).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F05
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F10
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F11
 * @param {{ result: object|null, method: string, termMonths: number }} props
 */
export default function InstallmentSummary({ result, method, termMonths }) {
  return (
    <section className={styles.card} aria-label="Kết quả tính trả góp" aria-live="polite">
      <h2 className={styles.cardTitle}>Kết quả</h2>
      {result ? (
        <dl className={styles.results}>
          <MonthlyRows result={result} method={method} />
          <Row label="Số tiền trả trước" value={formatPrice(result.down)} />
          <Row label="Số tiền vay" value={formatPrice(result.loan)} />
          <Row label="Thời hạn" value={`${termMonths} tháng`} />
          <Row label="Tổng lãi phải trả" value={formatPrice(result.totalInterest)} />
          <Row label="Tổng gốc + lãi" value={formatPrice(result.totalRepay)} />
          <Row label="Tổng chi phí (gồm trả trước)" value={formatPrice(result.totalCost)} />
        </dl>
      ) : (
        <p role="status" className={styles.empty}>Nhập giá xe và lãi suất hợp lệ để xem kết quả.</p>
      )}

      <ul className={styles.notes}>
        {NOTES.map((note) => <li key={note}>{note}</li>)}
      </ul>

      <div className={styles.actions}>
        <Link to="/lien-he" className={`${styles.cta} ${styles.ctaPrimary}`}>Tư vấn trả góp</Link>
        <Link to="/xe" className={styles.cta}>Xem xe đang bán</Link>
      </div>
    </section>
  )
}
