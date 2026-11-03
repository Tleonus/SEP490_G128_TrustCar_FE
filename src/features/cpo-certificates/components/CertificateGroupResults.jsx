import { Image } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import EvidencePhoto from './EvidencePhoto'
import { REPORT_LEVEL } from '../constants/cpoCertificateConstants'
import styles from '../styles/CpoCertificateDetailPage.module.css'

/**
 * Kết quả 5 nhóm kiểm định. FULL: dấu tích, hạng mục đã kiểm, lỗi nhỏ, ảnh theo nhóm.
 * MINIMAL (xe duyệt qua /inspect cũ): chỉ 5 dấu tích.
 *
 * @param {{ groups: import('../constants/cpoCertificateConstants').ReportGroup[], level: string, forPrint?: boolean }} props
 */
export default function CertificateGroupResults({ groups, level, forPrint = false }) {
  const full = level === REPORT_LEVEL.FULL

  return (
    <ol className={styles.groupList}>
      {groups.map((group, index) => (
        <li key={group.key} className={styles.group}>
          <div className={styles.groupHead}>
            {group.passed ? (
              <CheckCircleFilled className={styles.passIcon} aria-label="Đạt" />
            ) : (
              <CloseCircleFilled className={styles.failIcon} aria-label="Không đạt" />
            )}
            <span className={styles.groupTitle}>
              {index + 1}. {group.label}
            </span>
          </div>

          {full && group.items.length > 0 && (
            <ul className={styles.itemList}>
              {group.items.map((item) => (
                <li key={item.key}>{item.label}</li>
              ))}
            </ul>
          )}

          {full && group.minorDefects.length > 0 && (
            <div className={styles.defects}>
              {group.minorDefects.map((defect, i) => (
                <div key={`${defect.type}-${i}`} className={styles.defect}>
                  <InfoCircleOutlined />
                  <div>
                    <strong>Lỗi nhỏ: {defect.label}</strong>
                    {defect.location && <span> · {defect.location}</span>}
                    {defect.description && <div className={styles.subText}>{defect.description}</div>}
                    {defect.photos.length > 0 && <PhotoGrid photos={defect.photos} alt={`Ảnh lỗi nhỏ ${defect.label}`} forPrint={forPrint} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {full && group.photos.length > 0 && <PhotoGrid photos={group.photos} alt={`Ảnh bằng chứng nhóm ${index + 1}`} forPrint={forPrint} />}
        </li>
      ))}
    </ol>
  )
}

/** Lưới ảnh có xem phóng to. forPrint: ảnh thường, tải ngay, để bản in không thiếu ảnh. */
export function PhotoGrid({ photos, alt, forPrint = false }) {
  if (forPrint) {
    return (
      <div className={styles.photoGrid}>
        {photos.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt={`${alt} (${i + 1})`} className={styles.photo} />
        ))}
      </div>
    )
  }
  return (
    <Image.PreviewGroup>
      <div className={styles.photoGrid}>
        {photos.map((src, i) => (
          <EvidencePhoto key={`${src}-${i}`} src={src} alt={`${alt} (${i + 1})`} />
        ))}
      </div>
    </Image.PreviewGroup>
  )
}
