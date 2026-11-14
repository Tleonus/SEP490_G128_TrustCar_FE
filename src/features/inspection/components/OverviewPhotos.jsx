/**
 * KAN-55 – Bốn ảnh tổng thể bắt buộc (FRONT/REAR/LEFT/RIGHT).
 * Backend chặn submit nếu thiếu bất kỳ vị trí nào (inspectionSubmitRules.checkVehicle).
 */

import { Alert } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import PhotoUploader from './PhotoUploader'
import { OVERVIEW_POSITIONS, OVERVIEW_POSITION_LABEL } from '../constants/inspectionConstants'
import styles from '../styles/InspectionDetailPage.module.css'

export default function OverviewPhotos({ value = {}, onChange, uploadEvidence, disabled = false }) {
  const filled = OVERVIEW_POSITIONS.filter((position) => Boolean(value[position])).length
  const complete = filled === OVERVIEW_POSITIONS.length

  return (
    <section className={styles.card} aria-labelledby="overview-photos-title">
      <header className={styles.cardHead}>
        <div>
          <h2 id="overview-photos-title" className={styles.cardTitle}>Ảnh tổng thể xe</h2>
          <p className={styles.cardDesc}>
            Bắt buộc đủ 4 góc: trước, sau, trái, phải. Ảnh được tải thẳng lên kho lưu trữ
            trong thư mục riêng của biên bản này.
          </p>
        </div>
        <span className={complete ? styles.badgeOk : styles.badgeWarn}>
          {complete && <CheckCircleFilled />}
          {filled}/{OVERVIEW_POSITIONS.length} ảnh
        </span>
      </header>

      {!complete && (
        <Alert
          type="warning"
          showIcon
          className={styles.inlineAlert}
          message={`Còn thiếu ${OVERVIEW_POSITIONS.length - filled} ảnh tổng thể, chưa thể gửi biên bản.`}
        />
      )}

      <div className={styles.overviewGrid}>
        {OVERVIEW_POSITIONS.map((position) => (
          <div className={styles.overviewSlot} key={position}>
            <h3 className={styles.slotTitle}>{OVERVIEW_POSITION_LABEL[position]}</h3>
            <PhotoUploader
              photos={value[position] ? [value[position]] : []}
              onAdd={(url) => onChange(position, url)}
              onRemove={() => onChange(position, null)}
              uploadEvidence={uploadEvidence}
              max={1}
              disabled={disabled}
              label="Chụp/Tải ảnh"
              emptyHint={`Chưa có ảnh ${OVERVIEW_POSITION_LABEL[position].toLowerCase()}.`}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  )
}
