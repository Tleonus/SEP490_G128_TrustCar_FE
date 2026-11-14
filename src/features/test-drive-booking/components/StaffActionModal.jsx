import { useState } from 'react'
import { Alert, Input, Modal } from 'antd'
import CancelReasonFields from './CancelReasonFields'
import { changeVisitStatus } from '../api/appointmentApi'
import { useRunOnce } from '../hooks/useRunOnce'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { buildCancelBody, isCancelReady } from '../utils/staffCancel'
import { hasUnavailableCar } from '../utils/visitRules'
import { formatVnDateTime } from '../utils/vnTime'
import { OUTCOME_MAX, STAFF_ACTION_LABEL } from '../constants/testDriveConstants'

const PROMPT = {
  CONFIRMED: 'Xác nhận lượt này sau khi đã gọi điện cho khách?',
  CANCELLED: 'Hủy cả lượt này. Hãy chọn lý do (khách sẽ thấy lý do đã chọn).',
  COMPLETED: 'Đánh dấu khách đã đến lái thử.',
  NO_SHOW: 'Đánh dấu khách không đến.',
}

/**
 * Hộp thoại thao tác của nhân viên: xác nhận / hủy (chọn lý do, "Khác" cần ghi chú) / hoàn tất và vắng mặt
 * (kết quả tùy chọn). Gửi đúng một yêu cầu dù bấm đúp. Thất bại: hiện nguyên nhân và báo trang tải lại dòng.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F16
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F17
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F31
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F37
 * @param {{ visit: object, status: string }|null} action
 * @param {() => void} onClose
 * @param {(visit: object) => void} onDone   Lượt đã cập nhật từ BE
 * @param {() => void} onStale               Cần tải lại danh sách
 */
export default function StaffActionModal({ action, onClose, onDone, onStale }) {
  const [outcome, setOutcome] = useState('')
  const [cancel, setCancel] = useState({ code: '', note: '' })
  const [problem, setProblem] = useState(null)
  const { busy, run } = useRunOnce()

  if (!action) return null
  const { visit, status } = action
  const cancelling = status === 'CANCELLED'
  const blocked = cancelling && !isCancelReady(cancel)

  const confirm = () => run(async () => {
    setProblem(null)
    try {
      const body = cancelling ? buildCancelBody(cancel) : { status, outcome }
      onDone(await changeVisitStatus(visit.visitId, body))
    } catch (error) {
      const failure = classifyAppointmentError(error, {}, { audience: 'staff' })
      setProblem(failure)
      if (failure.reload === 'visit') onStale()
    }
  })

  return (
    <Modal
      open
      title={`${STAFF_ACTION_LABEL[status]}${cancelling ? '' : ' lượt'} ${visit.visitCode}`}
      okText={STAFF_ACTION_LABEL[status]}
      cancelText="Đóng"
      okButtonProps={{ loading: busy, disabled: blocked, danger: cancelling }}
      cancelButtonProps={{ disabled: busy }}
      onOk={confirm}
      onCancel={() => { if (!busy) onClose() }}
      maskClosable={!busy}
      keyboard={!busy}
    >
      <p>{PROMPT[status]} ({formatVnDateTime(visit.scheduledAt)}, {visit.customer?.fullName ?? 'khách'})</p>
      {status === 'CONFIRMED' && hasUnavailableCar(visit) && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Có xe trong lượt không còn bán; hệ thống sẽ từ chối xác nhận." />
      )}
      {cancelling && <CancelReasonFields value={cancel} disabled={busy} onChange={(patch) => setCancel((prev) => ({ ...prev, ...patch }))} />}
      {(status === 'COMPLETED' || status === 'NO_SHOW') && (
        <Input.TextArea
          rows={3}
          maxLength={OUTCOME_MAX}
          showCount
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
          placeholder="Kết quả, ghi chú (không bắt buộc)"
          aria-label="Kết quả"
        />
      )}
      {problem && <Alert type="error" showIcon style={{ marginTop: 12 }} message={problem.message} />}
    </Modal>
  )
}
