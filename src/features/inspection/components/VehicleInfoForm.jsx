/**
 * KAN-55 – Thông tin xe đã xác nhận tại xưởng (`vehicleInfo.confirmed`).
 *
 * Backend tự điền sẵn từ hồ sơ xe (vehicleInfo.original) và yêu cầu xác nhận lại cả 6
 * trường khi submit; số km thực tế không được nhỏ hơn số km đang lưu (GBR-09).
 */

import { Input, InputNumber } from 'antd'
import { VEHICLE_INFO_FIELDS, INSPECTION_LIMITS as L } from '../constants/inspectionConstants'
import { toNumberOrNull } from '../data/draftState'
import styles from '../styles/InspectionDetailPage.module.css'

export default function VehicleInfoForm({ confirmed = {}, original = {}, car, onChange, disabled = false }) {
  const recordedMileage = toNumberOrNull(car?.mileage)

  return (
    <section className={styles.card} aria-labelledby="vehicle-info-title">
      <header className={styles.cardHead}>
        <div>
          <h2 id="vehicle-info-title" className={styles.cardTitle}>Thông tin xe xác nhận tại xưởng</h2>
          <p className={styles.cardDesc}>
            Đối chiếu thực tế với hồ sơ, sửa lại nếu sai. Cả 6 trường đều bắt buộc khi gửi biên bản.
          </p>
        </div>
      </header>

      <div className={styles.infoGrid}>
        {VEHICLE_INFO_FIELDS.map(({ key, label, type }) => {
          const originalValue = original?.[key]
          const hint = originalValue !== null && originalValue !== undefined && String(originalValue) !== ''
            ? `Hồ sơ: ${originalValue}`
            : 'Hồ sơ chưa có'
          const value = confirmed[key] ?? ''

          return (
            <label className={styles.field} key={key} htmlFor={`confirmed-${key}`}>
              <span className={styles.fieldLabel}>{label}</span>
              {type === 'number' ? (
                <InputNumber
                  id={`confirmed-${key}`}
                  className={styles.fieldControl}
                  value={value === '' ? null : Number(value)}
                  min={key === 'year' ? L.MIN_YEAR : 0}
                  max={key === 'year' ? new Date().getFullYear() + 1 : undefined}
                  step={1}
                  precision={0}
                  disabled={disabled}
                  placeholder={key === 'mileage' ? 'Số km trên đồng hồ ODO' : 'Năm sản xuất'}
                  onChange={(next) => onChange(key, next === null || next === undefined ? '' : String(next))}
                />
              ) : (
                <Input
                  id={`confirmed-${key}`}
                  className={styles.fieldControl}
                  value={value}
                  maxLength={L.VEHICLE_TEXT_MAX_LENGTH}
                  disabled={disabled}
                  placeholder={label}
                  onChange={(event) => onChange(key, event.target.value)}
                />
              )}
              <span className={styles.fieldHint}>{hint}</span>
              {key === 'mileage' && recordedMileage !== null && toNumberOrNull(value) !== null
                && toNumberOrNull(value) < recordedMileage && (
                <span className={styles.fieldErrorInline}>
                  Số km thực tế không được nhỏ hơn {recordedMileage.toLocaleString('vi-VN')} km đang lưu trên hệ thống.
                </span>
              )}
            </label>
          )
        })}
      </div>
    </section>
  )
}
