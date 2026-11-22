import { InputNumber, Segmented, Select, Slider } from 'antd'
import { DOWN_MAX, DOWN_MIN, METHODS, TERMS } from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const TERM_OPTIONS = TERMS.map((months) => ({ value: months, label: `${months} tháng (${months / 12} năm)` }))

const groupDots = (value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const stripDots = (value) => `${value ?? ''}`.replace(/\./g, '').replace(/[^\d]/g, '')

function Field({ id, label, hint, error, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </div>
  )
}

/**
 * Các ô nhập của trang "Tính trả góp". Giá xe và lãi suất là ô gõ (báo lỗi cạnh ô); trả trước, thời hạn
 * và cách tính luôn hợp lệ.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F03
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F08
 * @param {{ values: object, errors: object, result: object|null, setField: (name: string, value: *) => void }} props
 */
export default function InstallmentForm({ values, errors, result, setField }) {
  return (
    <form className={styles.card} onSubmit={(event) => event.preventDefault()} aria-label="Thông số khoản vay">
      <h2 className={styles.cardTitle}>Thông số khoản vay</h2>

      <Field id="inst-price" label="Giá xe" error={errors.price}>
        <InputNumber
          id="inst-price"
          size="large"
          className={styles.fullWidth}
          value={values.price}
          onChange={(value) => setField('price', value)}
          formatter={groupDots}
          parser={stripDots}
          controls={false}
          addonAfter="đ"
          inputMode="numeric"
          status={errors.price ? 'error' : undefined}
          aria-invalid={Boolean(errors.price)}
          aria-describedby={errors.price ? 'inst-price-error' : undefined}
        />
      </Field>

      <Field
        id="inst-down"
        label={`Trả trước: ${values.downPercent} %`}
        hint={result ? `Tương đương ${formatPrice(result.down)}. Vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).` : 'Vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).'}
      >
        <div className={styles.sliderWrap}>
          <Slider
            id="inst-down"
            min={DOWN_MIN}
            max={DOWN_MAX}
            step={1}
            value={values.downPercent}
            onChange={(value) => setField('downPercent', value)}
            tooltip={{ open: false }}
            ariaLabelForHandle="Trả trước (phần trăm giá xe)"
          />
        </div>
      </Field>

      <Field id="inst-term" label="Thời hạn vay">
        <Select
          id="inst-term"
          size="large"
          className={styles.fullWidth}
          value={values.termMonths}
          options={TERM_OPTIONS}
          onChange={(value) => setField('termMonths', value)}
        />
      </Field>

      <Field
        id="inst-rate"
        label="Lãi suất năm (tham khảo)"
        hint="Số minh họa. Lãi suất thực tế do ngân hàng quyết định."
        error={errors.ratePercent}
      >
        <InputNumber
          id="inst-rate"
          size="large"
          className={styles.fullWidth}
          value={values.ratePercent}
          onChange={(value) => setField('ratePercent', value)}
          step={0.1}
          controls={false}
          addonAfter="%/năm"
          inputMode="decimal"
          status={errors.ratePercent ? 'error' : undefined}
          aria-invalid={Boolean(errors.ratePercent)}
          aria-describedby={errors.ratePercent ? 'inst-rate-error' : undefined}
        />
      </Field>

      <Field id="inst-method" label="Cách tính">
        <Segmented
          id="inst-method"
          block
          size="large"
          options={METHODS}
          value={values.method}
          onChange={(value) => setField('method', value)}
        />
      </Field>
    </form>
  )
}
