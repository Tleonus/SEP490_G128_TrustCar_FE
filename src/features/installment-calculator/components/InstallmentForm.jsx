import { Segmented, Select } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { DEFAULTS, DOWN_MODE_AMOUNT, DOWN_MODES, METHODS } from '../constants/installmentConstants'
import { formatRate } from '../constants/bankRates'
import { termLabel } from '../utils/loanConfig'
import FormField from './FormField'
import RateFields from './RateFields'
import { CashInput, PercentInput } from './DownPaymentInputs'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const carLabel = (car) => (
  <span className={styles.carOption}>
    {car.image ? <img src={car.image} alt="" loading="lazy" /> : <i aria-hidden="true" />}
    <span>{car.name}</span>
    <strong>{formatPrice(car.price)}</strong>
  </span>
)

const bankOption = (bank) => ({
  value: bank.id,
  label: `${bank.name} · ${formatRate(bank.promoRate)}%${bank.isPartner ? ' (liên kết showroom)' : ''}`,
})

/**
 * Các ô nhập: xe (giá lấy từ xe đang bán), ngân hàng, trả trước (số tiền khách có hoặc % giá xe), thời hạn,
 * lãi suất, cách tính. Ngân hàng, trả trước tối thiểu và thời hạn theo cấu hình admin (`config`).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F03
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F14
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F17
 * @param {object} props
 * @param {object} props.values
 * @param {object} props.errors
 * @param {Function} props.setField
 * @param {import('../utils/loanConfig').LoanConfig} props.config
 * @param {string} props.bankId
 * @param {Function} props.onBankChange
 * @param {{ options: object[], loading: boolean, failed: boolean }} props.cars
 * @param {string|null} props.carId
 * @param {Function} props.onCarChange
 */
export default function InstallmentForm({ values, errors, setField, config, bankId, onBankChange, cars, carId, onCarChange }) {
  const loanPercent = 100 - (Number(values.downPercent) || 0)
  const byAmount = values.downMode === DOWN_MODE_AMOUNT
  const linkPrice = !carId && typeof values.price === 'number'
  const termOptions = config.terms.map((months) => ({ value: months, label: termLabel(months) }))

  const resetDefaults = () => {
    ['downMode', 'downAmount', 'method'].forEach((name) => setField(name, DEFAULTS[name]))
    setField('downPercent', Math.max(DEFAULTS.downPercent, config.downMin))
    setField('termMonths', config.terms.includes(DEFAULTS.termMonths) ? DEFAULTS.termMonths : config.terms[config.terms.length - 1])
    onBankChange(config.partner.id)
  }

  const termField = (
    <FormField id="inst-term" step="04" label="Thời hạn vay">
      <Select
        id="inst-term"
        size="large"
        className={styles.fullWidth}
        value={values.termMonths}
        options={termOptions}
        onChange={(value) => setField('termMonths', value)}
      />
    </FormField>
  )

  return (
    <form className={styles.card} onSubmit={(event) => event.preventDefault()} aria-label="Thông số khoản vay">
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Thông số khoản vay</h2>
        <button type="button" className={styles.ghostBtn} onClick={resetDefaults}>
          <ReloadOutlined /> Mặc định
        </button>
      </div>

      <FormField id="inst-car" step="01" label="Chọn xe">
        <Select
          id="inst-car"
          size="large"
          showSearch
          className={styles.fullWidth}
          placeholder={cars.loading ? 'Đang tải xe…' : (linkPrice ? `Giá theo liên kết: ${formatPrice(values.price)}` : 'Tìm theo hãng, dòng xe…')}
          loading={cars.loading}
          value={carId ?? undefined}
          onChange={onCarChange}
          options={cars.options.map((car) => ({ value: car.id, label: carLabel(car), search: `${car.name} ${car.code ?? ''}` }))}
          filterOption={(input, option) => option.search.toLowerCase().includes(input.trim().toLowerCase())}
          notFoundContent={cars.failed ? 'Không tải được danh sách xe.' : 'Không có xe phù hợp.'}
        />
      </FormField>

      <FormField id="inst-bank" step="02" label="Ngân hàng">
        <Select
          id="inst-bank"
          size="large"
          className={styles.fullWidth}
          value={bankId}
          options={config.banks.map(bankOption)}
          onChange={onBankChange}
        />
      </FormField>

      <FormField
        id={byAmount ? 'inst-cash' : 'inst-down'}
        step="03"
        label={byAmount ? 'Trả trước' : `Trả trước ${values.downPercent}%`}
        aside={byAmount ? null : `Vay ${loanPercent}%`}
        error={byAmount ? errors.downAmount : undefined}
      >
        <Segmented
          size="small"
          options={DOWN_MODES}
          value={values.downMode}
          onChange={(mode) => setField('downMode', mode)}
          className={styles.modeSwitch}
          aria-label="Cách nhập trả trước"
        />
        {byAmount ? (
          <CashInput values={values} error={errors.downAmount} setField={setField} downMin={config.downMin} />
        ) : (
          <PercentInput values={values} setField={setField} downMin={config.downMin} options={config.downOptions} />
        )}
      </FormField>

      <RateFields
        values={values}
        errors={errors}
        setField={setField}
        termField={termField}
      />

      <FormField id="inst-method" step="06" label="Cách tính">
        <Segmented
          id="inst-method"
          block
          size="large"
          options={METHODS}
          value={values.method}
          onChange={(value) => setField('method', value)}
        />
      </FormField>
    </form>
  )
}
