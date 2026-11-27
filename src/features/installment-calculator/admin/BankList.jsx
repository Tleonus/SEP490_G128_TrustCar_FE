import { StarFilled, WarningFilled } from '@ant-design/icons'
import { formatRate } from '../constants/bankRates'
import styles from './AdminLoanSettings.module.css'

/**
 * Cột trái: các ngân hàng trong cấu hình (thứ tự = thứ tự lưu). Bấm một ngân hàng → sửa ở khung bên phải.
 * @param {{ banks: object[], errors: object[], selectedKey: string, onSelect: (key: string) => void }} props
 */
export default function BankList({ banks, errors, selectedKey, onSelect }) {
  return (
    <ul className={styles.bankNav} aria-label="Danh sách ngân hàng">
      {banks.map((bank, index) => {
        const selected = bank.key === selectedKey
        const hasError = Object.keys(errors[index] ?? {}).length > 0
        const classes = [styles.bankNavItem, selected && styles.bankNavItemActive, !bank.active && styles.bankNavItemHidden]
        return (
          <li key={bank.key}>
            <button type="button" className={classes.filter(Boolean).join(' ')} onClick={() => onSelect(bank.key)} aria-current={selected ? 'true' : undefined}>
              <span className={styles.bankNavIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.bankNavText}>
                <strong>
                  {bank.name || 'Ngân hàng'}
                  {bank.isPartner && <StarFilled className={styles.bankNavStar} aria-label="Liên kết showroom" />}
                </strong>
                <small>
                  {typeof bank.promoRate === 'number' ? `${formatRate(bank.promoRate)}%/năm` : 'Chưa nhập lãi'}
                  {' · '}
                  {bank.active ? 'Đang hiện' : 'Đang ẩn'}
                </small>
              </span>
              {hasError && <WarningFilled className={styles.bankNavWarn} aria-label="Có ô chưa đúng" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
