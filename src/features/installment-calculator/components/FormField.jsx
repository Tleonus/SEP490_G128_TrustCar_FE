import styles from '../styles/Installment.module.css'

/** Một ô của form trang tính: số thứ tự, nhãn, phần phụ bên phải, lỗi (role="alert"). */
export default function FormField({ id, step, label, aside, error, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={id} className={styles.label}>
          <span className={styles.stepIndex}>{step}</span>
          <span>{label}</span>
        </label>
        {aside && <span className={styles.fieldAside}>{aside}</span>}
      </div>
      {children}
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </div>
  )
}
