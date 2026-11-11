/**
 * KAN-55 – Banner đỏ khi biên bản bị trả lại / xe không đạt chuẩn CPO.
 *
 * Nội dung lấy từ `rejectedReason` nếu Backend có (hiện Backend CHƯA có trường này —
 * xem utils/rejectedReason.js và báo cáo). Khi chưa có, banner dựng từ dữ liệu thật của
 * biên bản: 5 tiêu chí bị chấm không đạt và ghi chú kỹ thuật đã lưu. Không hardcode.
 */

import { Alert, Tag } from 'antd'
import styles from '../styles/InspectionDetailPage.module.css'

const SOURCE_NOTE = {
  BACKEND_FIELD: null,
  INSPECTION_RECORD: 'Tổng hợp từ biên bản kiểm định đã gửi (Backend chưa có trường rejectedReason).',
  CAR_STATUS_ONLY: 'Backend chưa có API đọc biên bản cũ theo mã xe, nên chưa hiển thị được chi tiết lần kiểm định trước.',
}

export default function RejectedBanner({ notice, onAction, actionLabel = 'Lập biên bản kiểm định lại' }) {
  if (!notice?.shown) return null

  return (
    <Alert
      type="error"
      showIcon
      className={styles.rejectedBanner}
      message={notice.title}
      description={(
        <div className={styles.rejectedBody}>
          <p className={styles.rejectedReason}>{notice.reason}</p>

          {notice.failedCriteria?.length > 0 && (
            <div className={styles.rejectedCriteria}>
              <span className={styles.rejectedLabel}>Tiêu chí không đạt:</span>
              {notice.failedCriteria.map((criterion) => (
                <Tag color="error" key={criterion}>{criterion}</Tag>
              ))}
            </div>
          )}

          {notice.notes?.length > 0 && (
            <ul className={styles.rejectedNotes}>
              {notice.notes.map((note, index) => (
                <li key={`${note.scope}-${index}`}>
                  <strong>{note.scope}:</strong> {note.text}
                </li>
              ))}
            </ul>
          )}

          {SOURCE_NOTE[notice.source] && (
            <p className={styles.rejectedSource}>{SOURCE_NOTE[notice.source]}</p>
          )}

          {onAction && (
            <button type="button" className={styles.rejectedAction} onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    />
  )
}
