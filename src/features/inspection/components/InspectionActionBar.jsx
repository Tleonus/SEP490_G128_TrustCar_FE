/**
 * KAN-55 – Thanh hành động: Lưu nháp / Gửi biên bản.
 *
 * - Chặn bấm đúp: cả hai nút disabled khi đang lưu, đang gửi hoặc đang tải ảnh.
 * - Gửi luôn lưu phần đang soạn dở trước, vì Backend chấm điểm trên bản ghi đã lưu trong DB.
 * - Biên bản đã gửi (SUBMITTED) thì chỉ xem, không còn nút nào.
 */

import { Button, Tag, Tooltip } from 'antd'
import { CloudUploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { INSPECTION_RESULT_META } from '../constants/inspectionConstants'
import styles from '../styles/InspectionDetailPage.module.css'

export default function InspectionActionBar({
  isDirty = false,
  saving = false,
  submitting = false,
  uploading = false,
  uploadingCount = 0,
  locked = false,
  canSubmit = false,
  blockedReason = null,
  submitResult = null,
  onSave,
  onSubmit,
}) {
  if (locked) {
    const resultMeta = submitResult?.inspectionRecord?.result
      ? INSPECTION_RESULT_META[submitResult.inspectionRecord.result]
      : null
    return (
      <div className={styles.actionBar} role="status">
        <span className={styles.actionNote}>
          Biên bản đã được gửi và khoá — không thể chỉnh sửa hay gửi lại bản này.
        </span>
        {resultMeta && <Tag color={resultMeta.color}>{resultMeta.label}</Tag>}
        {submitResult?.inspectionRecord?.cpoCertificateId && (
          <Tag color="gold">Mã CPO: {submitResult.inspectionRecord.cpoCertificateId}</Tag>
        )}
      </div>
    )
  }

  const busy = saving || submitting || uploading

  return (
    <div className={styles.actionBar}>
      <span className={styles.actionNote}>
        {uploading
          ? `Đang tải ${uploadingCount} ảnh lên…`
          : isDirty
            ? 'Có thay đổi chưa lưu.'
            : 'Mọi thay đổi đã được lưu.'}
      </span>

      <div className={styles.actionButtons}>
        <Button
          icon={<SaveOutlined />}
          loading={saving}
          disabled={busy || !isDirty}
          onClick={onSave}
        >
          {saving ? 'Đang lưu…' : 'Lưu nháp'}
        </Button>

        <Tooltip title={canSubmit ? null : blockedReason}>
          <Button
            type="primary"
            icon={submitting ? <CloudUploadOutlined /> : <SendOutlined />}
            loading={submitting}
            disabled={busy || !canSubmit}
            onClick={onSubmit}
          >
            {submitting ? 'Đang gửi…' : 'Gửi biên bản'}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
