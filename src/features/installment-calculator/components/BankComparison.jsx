import { useMemo } from 'react'
import { BankOutlined, LinkOutlined } from '@ant-design/icons'
import { formatRate } from '../constants/bankRates'
import { compareBanks } from '../utils/bankCompare'
import { bankFit, loanOf } from '../utils/bankFit'
import { formatUpdatedAt } from '../utils/loanConfig'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const money = (estimate, key) => (estimate ? formatPrice(estimate[key]) : '—')

function SourceLink({ bank }) {
  if (!bank.sourceUrl) return null
  return (
    <a
      className={styles.sourceLink}
      href={bank.sourceUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={`Nguồn: web ${bank.name}${bank.sourceDate ? ` (${bank.sourceDate})` : ''}`}
    >
      <LinkOutlined /> Nguồn
    </a>
  )
}

/** Lãi ưu đãi và ghi chú của ngân hàng. */
function RateCell({ bank }) {
  return (
    <td>
      <strong>{formatRate(bank.promoRate)}%</strong>
      {bank.note && <span className={styles.cellSub}>{bank.note}</span>}
    </td>
  )
}

/**
 * So sánh cùng khoản vay giữa các ngân hàng admin cho hiện: ngân hàng liên kết showroom trước, còn lại theo lãi
 * ưu đãi tăng dần. Ước tính dùng lãi ưu đãi cho cả kỳ vay.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F13
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F15
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F16
 * @param {{ input: object|null, config: import('../utils/loanConfig').LoanConfig, bankId: string,
 *   onPick: (id: string) => void }} props
 */
export default function BankComparison({ input, config, bankId, onPick }) {
  const rows = useMemo(() => compareBanks(input, config.banks), [input, config.banks])
  const base = rows[0].estimate
  const updated = formatUpdatedAt(config.updatedAt)
  const loan = loanOf(input)

  return (
    <section className={styles.card} aria-labelledby="bank-compare-title">
      <div className={styles.cardHead}>
        <h2 id="bank-compare-title" className={styles.cardTitle}><BankOutlined /> So sánh ngân hàng</h2>
        <span className={styles.checkedAt}>Lãi công bố trên web ngân hàng{updated ? ` · cập nhật ${updated}` : ''}</span>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th scope="col">Ngân hàng</th>
              <th scope="col">Lãi suất</th>
              <th scope="col">Trả tháng đầu</th>
              <th scope="col">Tổng lãi</th>
              <th scope="col"><span className={styles.srOnly}>Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ bank, estimate }) => {
              const extra = estimate && base ? estimate.totalInterest - base.totalInterest : null
              const misfit = bankFit(bank, loan)
              return (
                <tr key={bank.id} className={bank.isPartner ? styles.rowPartner : undefined}>
                  <th scope="row">
                    <strong>{bank.name}</strong>
                    {bank.cars && <span className={bank.isPartner ? `${styles.tag} ${styles.tagGold}` : styles.tag}>{bank.cars}</span>}
                    {misfit.length > 0 && <span className={styles.cellWarn}>Chưa đạt: {misfit.join('; ')}</span>}
                  </th>
                  <RateCell bank={bank} />
                  <td><strong>{money(estimate, 'firstPayment')}</strong></td>
                  <td>
                    <strong>{money(estimate, 'totalInterest')}</strong>
                    {extra > 0 && <span className={styles.more}>+{formatPrice(extra)}</span>}
                  </td>
                  <td className={styles.actionsCell}>
                    {bank.id !== bankId
                      ? <button type="button" className={styles.linkBtn} onClick={() => onPick(bank.id)}>Tính thử</button>
                      : <span className={styles.pickedMark}>Đang tính</span>}
                    <SourceLink bank={bank} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
