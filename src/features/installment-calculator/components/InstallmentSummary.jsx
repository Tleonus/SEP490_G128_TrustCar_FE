import { Link } from 'react-router-dom'
import {
  ArrowRightOutlined,
  AuditOutlined,
  CarOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { METHOD_ANNUITY } from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const NOTES = [
  'Kết quả chỉ để tham khảo, chưa gồm phí hồ sơ, bảo hiểm, thuế và các khoản phí khác.',
  'Lãi suất thực tế do ngân hàng quyết định; lãi suất nhập ở đây chỉ là số minh họa.',
  'Hạn mức vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).',
]

function Row({ label, value, strong, accent }) {
  const rowClass = [
    styles.row,
    strong ? styles.rowStrong : '',
    accent ? styles.rowAccent : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rowClass}>
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
 * @param {{ result: object|null, method: string, termMonths: number, downPercent?: number, ratePercent?: number }} props
 */
export default function InstallmentSummary({ result, method, termMonths, downPercent, ratePercent }) {
  const totalCost = result?.totalCost || 0
  const downPctOfTotal = totalCost > 0 ? Math.round((result.down / totalCost) * 100) : 0
  const loanPctOfTotal = totalCost > 0 ? Math.round((result.loan / totalCost) * 100) : 0
  const interestPctOfTotal = totalCost > 0 ? Math.max(0, 100 - downPctOfTotal - loanPctOfTotal) : 0

  return (
    <section
      className={`${styles.card} ${styles.noteCard} ${styles.statementSheet}`}
      aria-label="Kết quả tính trả góp"
      aria-live="polite"
    >
      <div className={styles.sheetTopBar}>
        <div className={styles.sheetTitleGroup}>
          <span className={styles.sheetKicker}>
            <AuditOutlined /> PHIẾU DỰ TOÁN TÍN DỤNG
          </span>
          <h2 className={styles.cardTitle}>Kết quả</h2>
        </div>
        <span className={styles.liveSealBadge}>
          <CheckCircleFilled /> {method === METHOD_ANNUITY ? 'Niên kim cố định' : 'Dư nợ giảm dần'}
        </span>
      </div>

      {result ? (
        <>
          <div className={styles.voucherHero}>
            <div className={styles.voucherHeroTop}>
              <span className={styles.voucherHeroLabel}>
                {method === METHOD_ANNUITY ? 'Định mức thanh toán cố định hằng tháng' : 'Định mức thanh toán kỳ đầu tiên'}
              </span>
              <strong className={styles.voucherHeroAmount}>{formatPrice(result.firstPayment)}</strong>
              <div className={styles.voucherHeroSubrow}>
                {method !== METHOD_ANNUITY && (
                  <span className={styles.voucherPill}>
                    Kỳ cuối giảm còn: <strong>{formatPrice(result.lastPayment)}</strong>
                  </span>
                )}
                <span className={styles.voucherPill}>
                  Kỳ hạn: <strong>{termMonths} tháng</strong>
                </span>
                {ratePercent !== undefined && (
                  <span className={styles.voucherPill}>
                    Lãi suất: <strong>{ratePercent}%/năm</strong>
                  </span>
                )}
              </div>
            </div>

            <div className={styles.costBreakdownWrap} aria-hidden="true">
              <div className={styles.costBreakdownHeader}>
                <span>Cấu trúc tổng chi phí sở hữu</span>
                <strong>{formatPrice(result.totalCost)}</strong>
              </div>
              <div className={styles.costBreakdownBar}>
                <div
                  className={styles.costSegmentDown}
                  style={{ width: `${downPctOfTotal}%` }}
                  title={`Trả trước: ${downPctOfTotal}%`}
                />
                <div
                  className={styles.costSegmentLoan}
                  style={{ width: `${loanPctOfTotal}%` }}
                  title={`Gốc vay: ${loanPctOfTotal}%`}
                />
                <div
                  className={styles.costSegmentInterest}
                  style={{ width: `${interestPctOfTotal}%` }}
                  title={`Tổng lãi: ${interestPctOfTotal}%`}
                />
              </div>
              <div className={styles.costBreakdownLegend}>
                <span><i className={styles.dotDown} /> Trả trước ({downPercent ?? Math.round((result.down / result.price) * 100)}%)</span>
                <span><i className={styles.dotLoan} /> Gốc vay ({loanPctOfTotal}%)</span>
                <span><i className={styles.dotInterest} /> Tổng lãi ({interestPctOfTotal}%)</span>
              </div>
            </div>
          </div>

          <dl className={styles.results}>
            <MonthlyRows result={result} method={method} />
            <Row label="Số tiền trả trước" value={formatPrice(result.down)} />
            <Row label="Số tiền vay" value={formatPrice(result.loan)} />
            <Row label="Thời hạn" value={`${termMonths} tháng`} />
            <Row label="Tổng lãi phải trả" value={formatPrice(result.totalInterest)} />
            <Row label="Tổng gốc + lãi" value={formatPrice(result.totalRepay)} />
            <Row accent label="Tổng chi phí (gồm trả trước)" value={formatPrice(result.totalCost)} />
          </dl>
        </>
      ) : (
        <p role="status" className={styles.empty}>Nhập giá xe và lãi suất hợp lệ để xem kết quả.</p>
      )}

      <div className={styles.ruledPaperNote}>
        <div className={styles.ruledPaperHeader}>
          <InfoCircleOutlined />
          <span>Ghi chú nghiệp vụ tín dụng ngân hàng</span>
        </div>
        <ul className={styles.notes}>
          {NOTES.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </div>

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
