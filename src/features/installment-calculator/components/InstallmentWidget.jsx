import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Select, Slider } from 'antd'
import { DEFAULTS, DOWN_MAX } from '../constants/installmentConstants'
import { bankRateFields, formatRate } from '../constants/bankRates'
import { computeInstallment } from '../utils/installmentMath'
import { buildInstallmentLink, isWidgetPrice } from '../utils/installmentInput'
import { useLoanSettings } from '../hooks/useLoanSettings'
import { termLabel } from '../utils/loanConfig'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/InstallmentWidget.module.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Khối "Ước tính trả góp" ở trang chi tiết xe: chỉnh trả trước và thời hạn, thấy ngay tiền trả tháng đầu,
 * tiền vay và tổng lãi của xe đang xem; "Tính chi tiết" mở `/installment` với đúng giá và thông số đã chọn.
 * Không hiện khi xe chưa có giá hợp lệ. Lãi, trả trước tối thiểu và thời hạn theo ngân hàng
 * liên kết trong cấu hình admin.
 *
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F01
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F02
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F03
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F05
 * @ears .sdd/features/installment-widget/SPEC.md#REQ-F07
 * @param {{ price: number|null|undefined, carCode?: string|null }} props  `car.price` (đồng), `car.vehicleCode`
 */
export default function InstallmentWidget({ price, carCode = null }) {
  const id = useId()
  const { config } = useLoanSettings()
  const [pickedDown, setDownPercent] = useState(DEFAULTS.downPercent)
  const [pickedTerm, setTermMonths] = useState(DEFAULTS.termMonths)
  const downPercent = clamp(pickedDown, config.downMin, DOWN_MAX)
  const termMonths = config.terms.includes(pickedTerm) ? pickedTerm : config.terms[config.terms.length - 1]
  const termOptions = config.terms.map((months) => ({ value: months, label: termLabel(months) }))
  const valid = isWidgetPrice(price)
  const result = useMemo(() => (valid
    ? computeInstallment({
      price: Math.round(price), downPercent, termMonths, method: DEFAULTS.method, ...bankRateFields(config.partner),
    })
    : null), [valid, price, downPercent, termMonths, config.partner])

  if (!result) return null

  return (
    <section className={styles.widget} aria-label="Ước tính trả góp">
      <div className={styles.head}>
        <h2 className={styles.title}>Ước tính trả góp</h2>
        <span className={styles.badge}>{config.partner.name} từ {formatRate(config.partner.promoRate)} %/năm</span>
      </div>

      <div className={styles.monthly} aria-live="polite">
        <span className={styles.monthlyLabel}>Trả tháng đầu</span>
        <strong className={styles.monthlyValue}>{formatPrice(result.firstPayment)}</strong>
      </div>

      <div id={`${id}-down-label`} className={styles.label}>
        Trả trước: {downPercent} % ({formatPrice(result.down)})
      </div>
      <div className={styles.sliderWrap}>
        <Slider
          min={config.downMin}
          max={DOWN_MAX}
          step={1}
          value={downPercent}
          onChange={setDownPercent}
          tooltip={{ open: false }}
          ariaLabelledByForHandle={`${id}-down-label`}
        />
      </div>

      <label htmlFor={`${id}-term`} className={styles.label}>Thời hạn vay</label>
      <Select
        id={`${id}-term`}
        size="large"
        className={styles.select}
        value={termMonths}
        options={termOptions}
        onChange={setTermMonths}
      />

      <dl className={styles.facts}>
        <div><dt>Số tiền vay</dt><dd>{formatPrice(result.loan)}</dd></div>
        <div><dt>Tổng lãi</dt><dd>{formatPrice(result.totalInterest)}</dd></div>
      </dl>

      <p className={styles.note}>Chỉ để tham khảo, chưa gồm phí và bảo hiểm; lãi suất do ngân hàng quyết định.</p>
      <Link to={buildInstallmentLink({ price, downPercent, termMonths, carCode })} className={styles.link}>Tính chi tiết</Link>
    </section>
  )
}
