import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BankOutlined } from '@ant-design/icons'
import InstallmentForm from '../components/InstallmentForm'
import InstallmentSummary from '../components/InstallmentSummary'
import BankComparison from '../components/BankComparison'
import ScheduleTable from '../components/ScheduleTable'
import { useInstallment } from '../hooks/useInstallment'
import { useCarOptions } from '../hooks/useCarOptions'
import { useLoanSettings } from '../hooks/useLoanSettings'
import { initialInput, parsePriceParam } from '../utils/installmentInput'
import { initialCarId } from '../utils/carOptions'
import { FALLBACK_CONFIG } from '../utils/loanConfig'
import { bankRateFields, formatRate } from '../constants/bankRates'
import { bankFit, loanOf } from '../utils/bankFit'
import { DEFAULTS } from '../constants/installmentConstants'
import { trackEvent } from '../../../utils/trackEvent'
import styles from '../styles/Installment.module.css'

const RATE_FIELDS = ['ratePercent']

/**
 * Lưu ý về ngân hàng đang chọn: khoản vay chưa đạt điều kiện vay của ngân hàng.
 * @param {object|undefined} bank
 * @param {object|null} input  Thông số đã hợp lệ.
 */
const bankNotices = (bank, input) => {
  const misfit = bank && input ? bankFit(bank, loanOf(input)) : []
  return misfit.length > 0 ? [`Khoản vay này chưa đạt điều kiện của ${bank.name}: ${misfit.join('; ')}.`] : []
}

/**
 * "Tính trả góp" (/installment, công khai): chọn xe đang bán (lấy giá), ngân hàng (mặc định ngân hàng liên kết
 * showroom), trả trước, thời hạn, lãi suất, cách tính → tiền trả hằng tháng, tổng lãi, so sánh
 * ngân hàng, lịch trả nợ. Ngân hàng, lãi, trả trước tối thiểu và thời hạn lấy từ cấu hình admin (GET /settings/loan).
 * `?car=<vehicleCode>` chọn sẵn xe; `?price=` (liên kết cũ) dùng giá đó khi không có `?car=`.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F01
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F09
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F13
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F17
 */
export default function InstallmentPage() {
  const { search } = useLocation()
  const carParam = useMemo(() => new URLSearchParams(search).get('car'), [search])
  const hasPriceParam = parsePriceParam(search) !== null
  const { config } = useLoanSettings()
  const rules = useMemo(() => ({ downMin: config.downMin, terms: config.terms }), [config])
  const { values, setField, setFields, errors, result, input } = useInstallment(() => ({
    ...initialInput(search),
    price: parsePriceParam(search), // giá chỉ đến từ xe được chọn (hoặc liên kết cũ ?price=)
  }), rules)
  const cars = useCarOptions()
  const [carId, setCarId] = useState(null)
  const [bankId, setBankId] = useState(FALLBACK_CONFIG.partner.id)
  // Khách đã tự chọn ngân hàng / sửa lãi (hoặc liên kết có ?rate=) → cấu hình tải về không ghi đè lãi đang nhập.
  const [rateTouched, setRateTouched] = useState(() => new URLSearchParams(search).has('rate'))

  // KAN-97: ghi 1 event CALCULATOR_USE khi trang mở.
  useEffect(() => { trackEvent('CALCULATOR_USE') }, [])

  // Cấu hình admin về (hoặc đổi) → áp lãi ngân hàng liên kết và luật trả trước tối thiểu (một lần mỗi cấu hình).
  const [appliedConfig, setAppliedConfig] = useState(FALLBACK_CONFIG)
  if (appliedConfig !== config) {
    setAppliedConfig(config)
    const keepBank = rateTouched && config.banks.some((bank) => bank.id === bankId)
    if (!keepBank) {
      setBankId(config.partner.id)
      setFields(bankRateFields(config.partner))
    }
    if (Number(values.downPercent) < config.downMin) setField('downPercent', config.downMin)
    if (!config.terms.includes(values.termMonths)) {
      setField('termMonths', config.terms.includes(DEFAULTS.termMonths) ? DEFAULTS.termMonths : config.terms[config.terms.length - 1])
    }
  }

  const editField = useCallback((name, value) => {
    if (RATE_FIELDS.includes(name)) setRateTouched(true)
    setField(name, value)
  }, [setField])

  const pickCar = useCallback((id) => {
    const car = cars.options.find((item) => item.id === id)
    if (!car) return
    setCarId(id)
    setField('price', car.price)
  }, [cars.options, setField])

  // Danh sách xe về → chọn sẵn xe theo ?car=, hoặc xe đầu tiên (một lần).
  const [preselected, setPreselected] = useState(false)
  if (!preselected && !cars.loading) {
    setPreselected(true)
    const id = initialCarId(cars.options, { carParam, hasPriceParam })
    const car = cars.options.find((item) => item.id === id)
    if (car) {
      setCarId(id)
      setField('price', car.price)
    }
  }

  const pickBank = useCallback((id) => {
    const bank = config.banks.find((item) => item.id === id)
    if (!bank) return
    setBankId(id)
    setRateTouched(!bank.isPartner)
    setFields(bankRateFields(bank))
  }, [config.banks, setFields])

  const carName = cars.options.find((item) => item.id === carId)?.name ?? null
  const bank = config.banks.find((item) => item.id === bankId)
  const notices = bankNotices(bank, input)

  return (
    <div className={styles.pageShell}>
      <section className={styles.banner}>
        <div className={`container ${styles.bannerInner}`}>
          <div>
            <span className={styles.eyebrow}><BankOutlined /> Trả góp cùng {config.partner.name}</span>
            <h1 className={styles.title}>Tính <span>trả góp</span> mua xe</h1>
          </div>
          <div className={styles.bannerRate}>
            <span>Lãi {config.partner.name} từ</span>
            <strong>{formatRate(config.partner.promoRate)}%<small>/năm</small></strong>
          </div>
        </div>
      </section>

      <div className={`container ${styles.page}`}>
        <div className={styles.grid}>
          <InstallmentForm
            values={values}
            errors={errors}
            setField={editField}
            config={config}
            bankId={bankId}
            onBankChange={pickBank}
            cars={cars}
            carId={carId}
            onCarChange={pickCar}
          />
          <InstallmentSummary
            result={result}
            method={values.method}
            input={input}
            termMonths={input?.termMonths ?? values.termMonths}
            bank={bank}
            carName={carName}
            downMin={config.downMin}
            problem={errors.downAmount ?? null}
            notices={notices}
          />
        </div>

        <BankComparison input={input} config={config} bankId={bankId} onPick={pickBank} />

        {result && (
          <ScheduleTable
            rows={result.rows}
            termMonths={input?.termMonths ?? values.termMonths}
          />
        )}
      </div>
    </div>
  )
}
