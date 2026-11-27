import { InputNumber, Slider } from 'antd'
import { DOWN_MAX } from '../constants/installmentConstants'
import { digitsOnly, groupDigits, maxPriceFor, minDownAmount } from '../utils/installmentInput'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

/** Trả trước theo % giá xe: thanh trượt + các nút mức nhanh (`options`, admin đặt). */
export function PercentInput({ values, setField, downMin, options }) {
  return (
    <>
      <div className={styles.sliderWrap}>
        <Slider
          id="inst-down"
          min={downMin}
          max={DOWN_MAX}
          step={1}
          value={values.downPercent}
          onChange={(value) => setField('downPercent', value)}
          tooltip={{ open: false }}
          ariaLabelForHandle="Trả trước (phần trăm giá xe)"
        />
      </div>
      <div className={styles.chips} role="group" aria-label="Mức trả trước">
        {options.map((pct) => {
          const active = Number(values.downPercent) === pct
          return (
            <button
              key={pct}
              type="button"
              className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              aria-pressed={active}
              onClick={() => setField('downPercent', pct)}
            >
              {pct}%
            </button>
          )
        })}
      </div>
    </>
  )
}

/**
 * Trả trước theo số tiền khách đang có. Trống → tạm tính theo % đang chọn. Một dòng gợi ý: tỉ lệ so với giá xe,
 * số tiền vay và giá xe cao nhất mà số tiền này đủ trả trước tối thiểu.
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F18
 */
export function CashInput({ values, error, setField, downMin }) {
  const price = typeof values.price === 'number' ? values.price : null
  const amount = typeof values.downAmount === 'number' ? values.downAmount : null
  let hint = null
  if (!error && price && amount !== null) {
    const share = String(Math.round((amount * 1000) / price) / 10).replace('.', ',')
    hint = `Bằng ${share}% giá xe · vay ${formatPrice(price - amount)} · đủ trả trước cho xe đến ${formatPrice(maxPriceFor(amount, downMin))}`
  } else if (!error && price) {
    hint = `Chưa nhập: đang tính với trả trước ${values.downPercent}% (${formatPrice(Math.round((price * values.downPercent) / 100))})`
  }
  return (
    <>
      <InputNumber
        id="inst-cash"
        size="large"
        className={styles.fullWidth}
        value={values.downAmount}
        onChange={(value) => setField('downAmount', value ?? null)}
        min={0}
        step={10_000_000}
        controls={false}
        formatter={groupDigits}
        parser={digitsOnly}
        suffix="đ"
        inputMode="numeric"
        placeholder={price ? `Tối thiểu ${groupDigits(minDownAmount(price, downMin))}` : 'Số tiền bạn đang có'}
        status={error ? 'error' : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'inst-cash-error' : undefined}
      />
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </>
  )
}
