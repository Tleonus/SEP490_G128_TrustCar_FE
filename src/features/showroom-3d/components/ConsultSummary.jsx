import { Link } from 'react-router-dom'
import { formatPrice } from '../../../utils/format'
import { carTitle } from '../utils/carSpecs'
import { carsLink, suggestCars, summaryRows } from '../utils/consult'
import styles from '../panels.module.css'

/**
 * Bảng tóm tắt sau 5 câu + tối đa 3 xe gợi ý. Ghi rõ là không gửi đi đâu.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F08
 */
export default function ConsultSummary({ answers, cars, onEdit, onReset, onShowCar }) {
  const rows = summaryRows(answers)
  const picks = suggestCars(cars, answers)
  return (
    <div className={styles.consult}>
      <p className={styles.consultStep}>Tóm tắt</p>
      <h2 className={styles.consultQ}>Cảm ơn {rows[0].value}. Đây là những gì anh chị đã chọn.</h2>
      <dl className={styles.summary}>
        {rows.map((r) => (
          <div key={r.label} className={styles.specRow}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.picksTitle}>{picks.length ? 'Xe hợp ngân sách' : 'Chưa có xe nào trong khoảng ngân sách này.'}</p>
      <ul className={styles.picks}>
        {picks.map((c) => (
          <li key={c.vehicleCode}>
            <button type="button" className={styles.pick} onClick={() => onShowCar(c)}>
              <span>{carTitle(c)}</span>
              <b>{formatPrice(c.price)}</b>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>Bản demo: thông tin chỉ hiện trên máy này, không gửi đi đâu.</p>
      <div className={styles.consultNav}>
        <button type="button" className={styles.linkBtn} onClick={onEdit}>Sửa lại</button>
        <button type="button" className={styles.linkBtn} onClick={onReset}>Làm lại</button>
        {answers.payment === 'loan' && <Link className={styles.linkBtn} to="/installment">Tính trả góp</Link>}
        <Link className={styles.nextBtn} to={carsLink(answers)}>Xem xe phù hợp</Link>
      </div>
    </div>
  )
}
