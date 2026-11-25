import { InputNumber, Segmented, Select, Slider } from 'antd'
import {
  AccountBookOutlined,
  CalculatorOutlined,
  PercentageOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  DEFAULTS,
  DOWN_MAX,
  DOWN_MIN,
  METHOD_ANNUITY,
  METHODS,
  TERMS,
} from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const TERM_OPTIONS = TERMS.map((months) => ({ value: months, label: `${months} tháng (${months / 12} năm)` }))

const PRICE_PRESETS = [
  { label: '500 tr', value: 500_000_000 },
  { label: '800 tr', value: 800_000_000 },
  { label: '1,2 tỷ', value: 1_200_000_000 },
  { label: '1,8 tỷ', value: 1_800_000_000 },
  { label: '2,5 tỷ', value: 2_500_000_000 },
]

const DOWN_PRESETS = [30, 40, 50, 70]
const TERM_PRESETS = [
  { label: '3 năm', value: 36 },
  { label: '4 năm', value: 48 },
  { label: '5 năm', value: 60 },
  { label: '7 năm', value: 84 },
]
const RATE_PRESETS = [7.5, 8.5, 9, 10.5]

const groupDots = (value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const stripDots = (value) => `${value ?? ''}`.replace(/\./g, '').replace(/[^\d]/g, '')

function Field({ id, stepCode, label, badge, hint, error, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={id} className={styles.label}>
          {stepCode && <span className={styles.stepIndex}>{stepCode}</span>}
          <span>{label}</span>
        </label>
        {badge && <span className={styles.fieldBadge}>{badge}</span>}
      </div>
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
  const loanPercent = 100 - (Number(values.downPercent) || 0)

  const handleResetDefaults = () => {
    setField('price', DEFAULTS.price)
    setField('downPercent', DEFAULTS.downPercent)
    setField('termMonths', DEFAULTS.termMonths)
    setField('ratePercent', DEFAULTS.ratePercent)
    setField('method', DEFAULTS.method)
  }

  return (
    <form
      className={`${styles.card} ${styles.noteCard} ${styles.formSheet}`}
      onSubmit={(event) => event.preventDefault()}
      aria-label="Thông số khoản vay"
    >
      <div className={styles.sheetTopBar}>
        <div className={styles.sheetTitleGroup}>
          <span className={styles.sheetKicker}>
            <AccountBookOutlined /> PHIẾU THIẾT LẬP KHOẢN VAY
          </span>
          <h2 className={styles.cardTitle}>Thông số khoản vay</h2>
        </div>
        <button
          type="button"
          className={styles.resetPill}
          onClick={handleResetDefaults}
          title="Khôi phục thông số mặc định"
        >
          <ReloadOutlined /> Mặc định
        </button>
      </div>

      <Field
        id="inst-price"
        stepCode="01"
        label="Giá xe"
        badge={result ? formatPrice(result.price) : 'VNĐ'}
        error={errors.price}
      >
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
        <div className={`${styles.presetGrid} ${styles.presetGrid5}`} aria-label="Mức giá xe phổ biến">
          {PRICE_PRESETS.map((preset) => {
            const active = Number(values.price) === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                className={active ? `${styles.presetChip} ${styles.presetChipActive}` : styles.presetChip}
                onClick={() => setField('price', preset.value)}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field
        id="inst-down"
        stepCode="02"
        label={`Trả trước: ${values.downPercent} %`}
        badge={`Vay ngân hàng ${loanPercent} %`}
        hint={result ? `Tương đương ${formatPrice(result.down)}. Vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).` : 'Vay tối đa 70 % giá xe (trả trước tối thiểu 30 %).'}
      >
        <div className={styles.downNoteBox}>
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

          <div className={`${styles.presetGrid} ${styles.presetGrid4}`}>
            {DOWN_PRESETS.map((pct) => {
              const active = Number(values.downPercent) === pct
              return (
                <button
                  key={pct}
                  type="button"
                  className={active ? `${styles.presetChip} ${styles.presetChipActive}` : styles.presetChip}
                  onClick={() => setField('downPercent', pct)}
                >
                  Trả trước {pct}%
                </button>
              )
            })}
          </div>

          {result && (
            <div className={styles.capitalSplitCard} aria-hidden="true">
              <div className={styles.capitalBarTrack}>
                <div
                  className={styles.capitalBarDown}
                  style={{ width: `${values.downPercent}%` }}
                />
                <div
                  className={styles.capitalBarLoan}
                  style={{ width: `${loanPercent}%` }}
                />
              </div>
              <div className={styles.capitalLegendRow}>
                <div className={styles.capitalLegendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotDown}`} />
                  <span>Vốn tự có ({values.downPercent}%):</span>
                  <strong>{formatPrice(result.down)}</strong>
                </div>
                <div className={styles.capitalLegendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotLoan}`} />
                  <span>Ngân hàng ({loanPercent}%):</span>
                  <strong>{formatPrice(result.loan)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </Field>

      <div className={styles.dualFieldGrid}>
        <Field
          id="inst-term"
          stepCode="03"
          label="Thời hạn vay"
          badge={`${(Number(values.termMonths) / 12).toFixed(0)} năm`}
          hint="Chọn kỳ hạn trả góp phù hợp dòng tiền."
        >
          <Select
            id="inst-term"
            size="large"
            className={styles.fullWidth}
            value={values.termMonths}
            options={TERM_OPTIONS}
            onChange={(value) => setField('termMonths', value)}
          />
          <div className={`${styles.presetGrid} ${styles.presetGrid4}`}>
            {TERM_PRESETS.map((preset) => {
              const active = Number(values.termMonths) === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  className={active ? `${styles.presetChip} ${styles.presetChipActive}` : styles.presetChip}
                  onClick={() => setField('termMonths', preset.value)}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field
          id="inst-rate"
          stepCode="04"
          label="Lãi suất năm (tham khảo)"
          badge={<PercentageOutlined />}
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
          <div className={`${styles.presetGrid} ${styles.presetGrid4}`}>
            {RATE_PRESETS.map((rate) => {
              const active = Number(values.ratePercent) === rate
              return (
                <button
                  key={rate}
                  type="button"
                  className={active ? `${styles.presetChip} ${styles.presetChipActive}` : styles.presetChip}
                  onClick={() => setField('ratePercent', rate)}
                >
                  {rate}%
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      <Field
        id="inst-method"
        stepCode="05"
        label="Cách tính"
        badge={<CalculatorOutlined />}
      >
        <Segmented
          id="inst-method"
          block
          size="large"
          options={METHODS}
          value={values.method}
          onChange={(value) => setField('method', value)}
        />
        <div className={styles.methodNoteCallout}>
          {values.method === METHOD_ANNUITY
            ? 'Niên kim cố định: Số tiền gốc + lãi thanh toán mỗi tháng bằng nhau trong suốt kỳ hạn vay.'
            : 'Dư nợ giảm dần: Tiền gốc chia đều mỗi tháng, tiền lãi tính trên dư nợ thực tế còn lại nên giảm dần qua từng kỳ.'}
        </div>
      </Field>
    </form>
  )
}
