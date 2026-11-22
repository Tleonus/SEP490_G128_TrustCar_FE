import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import InstallmentForm from '../components/InstallmentForm'
import InstallmentSummary from '../components/InstallmentSummary'
import ScheduleTable from '../components/ScheduleTable'
import { useInstallment } from '../hooks/useInstallment'
import { initialInput } from '../utils/installmentInput'
import { trackEvent } from '../../../utils/trackEvent'
import styles from '../styles/Installment.module.css'

/**
 * "Tính trả góp" (/installment, công khai): nhập giá xe, trả trước, thời hạn, lãi suất, cách tính và
 * xem ngay số tiền trả hằng tháng, tổng lãi và lịch trả nợ. Không gọi API.
 * `?price=<đồng>` điền sẵn giá xe.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F01
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F04
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F09
 */
export default function InstallmentPage() {
  const { search } = useLocation()
  const { values, setField, errors, result, input } = useInstallment(() => initialInput(search))

  // KAN-97: ghi 1 event CALCULATOR_USE khi trang mở.
  useEffect(() => { trackEvent('CALCULATOR_USE') }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tính trả góp</h1>
      <p className={styles.desc}>
        Ước tính khoản vay mua xe: số tiền trả mỗi tháng, tổng lãi và lịch trả nợ. Thay đổi bất kỳ thông số nào, kết quả cập nhật ngay.
      </p>

      <div className={styles.grid}>
        <InstallmentForm values={values} errors={errors} result={result} setField={setField} />
        <InstallmentSummary result={result} method={values.method} termMonths={input?.termMonths ?? values.termMonths} />
      </div>

      {result && <ScheduleTable rows={result.rows} />}
    </div>
  )
}
