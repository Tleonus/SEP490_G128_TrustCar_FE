import styles from './AdminBaseSettingsPage.module.css'

export function Field({ label, htmlFor, hint, children }) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  )
}

export function SectionHeading({ icon, eyebrow, title, description, headingId }) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionIcon} aria-hidden="true">{icon}</div>
      <div>
        <span className={styles.sectionEyebrow}>{eyebrow}</span>
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
