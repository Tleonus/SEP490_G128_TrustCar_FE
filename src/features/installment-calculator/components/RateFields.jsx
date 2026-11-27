import { InputNumber } from 'antd'
import FormField from './FormField'
import styles from '../styles/Installment.module.css'

/**
 * Thời hạn vay (ô 04, truyền vào qua `termField`) và lãi suất (ô 05). Chọn ngân hàng tự điền lãi ưu đãi; khách vẫn
 * sửa được. Một mức lãi cho cả kỳ vay.
 * @param {{ values: object, errors: object, setField: Function, termField: import('react').ReactNode }} props
 */
export default function RateFields({ values, errors, setField, termField }) {
  return (
    <div className={styles.twoCols}>
      {termField}
      <FormField id="inst-rate" step="05" label="Lãi suất" error={errors.ratePercent}>
        <InputNumber
          id="inst-rate"
          size="large"
          className={styles.fullWidth}
          value={values.ratePercent}
          onChange={(value) => setField('ratePercent', value)}
          step={0.1}
          controls={false}
          suffix="%/năm"
          inputMode="decimal"
          status={errors.ratePercent ? 'error' : undefined}
          aria-invalid={Boolean(errors.ratePercent)}
          aria-describedby={errors.ratePercent ? 'inst-rate-error' : undefined}
        />
      </FormField>
    </div>
  )
}
