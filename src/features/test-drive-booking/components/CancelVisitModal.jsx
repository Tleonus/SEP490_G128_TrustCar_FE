import { useState } from 'react'
import { Alert, Input, Modal } from 'antd'
import { cancelMyVisit } from '../api/appointmentApi'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { isLateHint } from '../utils/visitRules'
import { formatVnDateTime } from '../utils/vnTime'
import { LATE_CANCEL_HOURS, REASON_MAX } from '../constants/testDriveConstants'

/**
 * Xác nhận hủy cả lượt, lý do tùy chọn. Còn dưới 12 giờ thì cảnh báo "hủy sát giờ".
 * Thất bại (409 đã hủy/đổi trạng thái, 404, mạng): hiện thông báo và báo trang tải lại lượt.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F11
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F12
 * @param {object|null} visit  Lượt định hủy; null thì đóng
 * @param {() => void} onClose
 * @param {(visit: object) => void} onCancelled  Lượt đã cập nhật từ BE
 * @param {() => void} onStale                   Cần tải lại danh sách
 */
export default function CancelVisitModal({ visit, onClose, onCancelled, onStale }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(null)

  if (!visit) return null

  async function confirm() {
    setBusy(true)
    setProblem(null)
    try {
      onCancelled(await cancelMyVisit(visit.visitId, reason))
    } catch (error) {
      const failure = classifyAppointmentError(error)
      setProblem(failure)
      if (failure.reload === 'visit') onStale()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={`Hủy lượt ${visit.visitCode}?`}
      okText="Xác nhận hủy"
      cancelText="Giữ lịch"
      okButtonProps={{ danger: true, loading: busy }}
      onOk={confirm}
      onCancel={onClose}
      maskClosable={!busy}
    >
      <p>Lượt lái thử lúc {formatVnDateTime(visit.scheduledAt)} sẽ bị hủy cho tất cả các xe trong lượt.</p>
      {isLateHint(visit) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Còn dưới ${LATE_CANCEL_HOURS} giờ nữa tới giờ hẹn. Showroom có thể ghi nhận đây là hủy sát giờ.`}
        />
      )}
      <Input.TextArea
        rows={2}
        maxLength={REASON_MAX}
        showCount
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Lý do hủy (không bắt buộc)"
        aria-label="Lý do hủy"
      />
      {problem && <Alert type="error" showIcon style={{ marginTop: 12 }} message={problem.message} />}
    </Modal>
  )
}
