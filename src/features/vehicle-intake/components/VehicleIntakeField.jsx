import React from 'react';
import styles from '../styles/VehicleIntake.module.css';

export default function VehicleIntakeField({ label, name, value, onChange, error, required = false, type = 'text', placeholder, suffix, children, inputMode }) {
  return (
    <label className={[styles.field, error ? styles['has-error'] : ''].join(' ')}>
      <span className={styles["field-label"]}>{label}{required && <span className={styles["required"]}>*</span>}</span>
      {children || <span className={[styles['input-wrap'], suffix ? styles['with-suffix'] : ''].join(' ')}>
        <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} inputMode={inputMode} />
        {suffix && <span className={styles["input-suffix"]}>{suffix}</span>}
      </span>}
      {error && <span className={styles["field-error"]}>{error}</span>}
    </label>
  );
}
