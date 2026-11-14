/**
 * KAN-55 – Panel "còn thiếu gì trước khi gửi".
 * Liệt kê đúng những luật Backend sẽ chặn (mirror collectSubmitViolations) kèm nhãn tiếng
 * Việt, bấm vào là mở đúng tiêu chí cần sửa. Tránh việc Sale bấm Gửi rồi nhận về một
 * danh sách lỗi tiếng Anh từ server.
 */

import { Alert, Button, Tag } from 'antd'
import { CheckCircleFilled, RightOutlined } from '@ant-design/icons'
import { groupViolationCounts } from '../utils/inspectionValidation'
import { isGroupPassed } from '../data/draftState'
import styles from '../styles/InspectionDetailPage.module.css'

const PREVIEW_LIMIT = 8

export default function SubmitReadiness({
  violations = [],
  evidenceCount = 0,
  checklist = [],
  state,
  onJump,
  expanded = false,
  onToggleExpanded,
}) {
  const counts = groupViolationCounts(violations)
  const visible = expanded ? violations : violations.slice(0, PREVIEW_LIMIT)

  const ready = violations.length === 0 && evidenceCount > 0

  return (
    <section className={styles.card} aria-labelledby="readiness-title">
      <header className={styles.cardHead}>
        <div>
          <h2 id="readiness-title" className={styles.cardTitle}>Kiểm tra trước khi gửi</h2>
          <p className={styles.cardDesc}>
            Đối chiếu với đúng các điều kiện Backend áp dụng khi chấm biên bản.
          </p>
        </div>
        <span className={ready ? styles.badgeOk : styles.badgeWarn}>
          {ready && <CheckCircleFilled />}
          {ready ? 'Sẵn sàng gửi' : `${violations.length} mục cần sửa`}
        </span>
      </header>

      {ready ? (
        <Alert
          type="success"
          showIcon
          className={styles.inlineAlert}
          message="Biên bản đã đủ điều kiện gửi."
          description={`Đã có ${evidenceCount} ảnh bằng chứng. Sau khi gửi, hệ thống tự chấm 5 tiêu chí CPO và chuyển trạng thái xe; biên bản sẽ bị khoá, không sửa được nữa.`}
        />
      ) : (
        <Alert
          type={violations.length === 0 ? 'warning' : 'error'}
          showIcon
          className={styles.inlineAlert}
          message={
            violations.length === 0
              ? 'Chưa có ảnh bằng chứng nào.'
              : `Còn ${violations.length} mục phải hoàn tất trước khi gửi biên bản.`
          }
          description={violations.length === 0
            ? 'Tải lên ít nhất một ảnh (ảnh tổng thể, ảnh theo tiêu chí hoặc ảnh hạng mục không đạt).'
            : null}
        />
      )}

      <div className={styles.criteriaRow}>
        {checklist.map((groupDef) => {
          const group = (state?.groups || []).find((entry) => entry.groupKey === groupDef.key)
          const passed = isGroupPassed(group, groupDef)
          const errorCount = counts[groupDef.key] || 0
          return (
            <button
              type="button"
              key={groupDef.key}
              className={styles.criteriaChip}
              onClick={() => onJump?.(groupDef.key)}
              aria-label={`Xem tiêu chí ${groupDef.label}`}
            >
              <span className={passed ? styles.dotOk : styles.dotBad} aria-hidden="true" />
              <span className={styles.criteriaChipLabel}>{groupDef.label}</span>
              {errorCount > 0 && <Tag color="error" className={styles.chipTag}>{errorCount}</Tag>}
            </button>
          )
        })}
      </div>

      {violations.length > 0 && (
        <ul className={styles.violationList}>
          {visible.map((violation, index) => (
            <li key={`${violation.field}-${index}`} className={styles.violationItem}>
              <span className={styles.violationMessage}>{violation.message}</span>
              {violation.groupKey && onJump && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => onJump(violation.groupKey)}
                  aria-label="Mở tiêu chí cần sửa"
                >
                  Sửa <RightOutlined />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {violations.length > PREVIEW_LIMIT && (
        <Button type="link" size="small" onClick={onToggleExpanded}>
          {expanded ? 'Thu gọn danh sách' : `Xem thêm ${violations.length - PREVIEW_LIMIT} mục`}
        </Button>
      )}
    </section>
  )
}
