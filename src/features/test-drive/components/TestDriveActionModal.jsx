import { useState } from 'react'
import { Alert, Input, Modal, Radio, Select } from 'antd'
import { CANCEL_REASONS } from '../constants/testDriveConstants'
import { getTestDriveErrorMessage } from '../utils/testDriveErrors'
import styles from '../styles/TestDriveManagement.module.css'

const COPY = {
  cancel: {
    title: 'Hủy lịch lái thử',
    desc: 'Chỗ sẽ được trả lại. Khách nhận email báo hủy và thấy lý do bạn chọn.',
    ok: 'Hủy lịch',
    danger: true,
  },
  complete: { title: 'Ghi kết quả buổi lái thử', desc: 'Lịch sẽ chuyển sang Đã hoàn thành.', ok: 'Lưu kết quả' },
  correct: {
    title: 'Sửa thành đã hoàn thành',
    desc: 'Dùng khi đánh dấu nhầm khách không đến. Khóa đặt lịch của khách sẽ được tính lại.',
    ok: 'Lưu sửa đổi',
  },
  noShow: {
    title: 'Xác nhận khách không đến?',
    desc: 'Hai lần không đến cách nhau tối đa 30 ngày sẽ khóa đặt lịch online của khách trong 30 ngày.',
    ok: 'Ghi nhận không đến',
    danger: true,
  },
  reassign: { title: 'Đổi nhân viên phụ trách', desc: 'Hệ thống sẽ từ chối nếu người được chọn đã có lịch trùng giờ.', ok: 'Lưu nhân viên' },
}

function validate(action, { reasonCode, note, outcome, staffId }) {
  if (action === 'cancel' && !reasonCode) return 'Hãy chọn lý do hủy.'
  if (action === 'cancel' && reasonCode === 'OTHER' && !note.trim()) return 'Lý do khác cần có ghi chú để khách hiểu vì sao lịch bị hủy.'
  if ((action === 'complete' || action === 'correct') && !outcome.trim()) return 'Hãy nhập kết quả buổi lái thử.'
  if (action === 'reassign' && !staffId) return 'Hãy chọn nhân viên.'
  return ''
}

export default function TestDriveActionModal({ action, appointment, staffOptions, onSubmit, onClose }) {
  const [form, setForm] = useState({ reasonCode: '', note: '', outcome: '', staffId: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const copy = COPY[action]

  const update = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function handleOk() {
    const invalid = validate(action, form)
    if (invalid) {
      setError(invalid)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ reasonCode: form.reasonCode, note: form.note.trim(), outcome: form.outcome.trim(), staffId: form.staffId })
    } catch (requestError) {
      setError(getTestDriveErrorMessage(requestError))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      title={`${copy.title} ${appointment.appointmentCode}`}
      okText={copy.ok}
      cancelText="Quay lại"
      okButtonProps={{ danger: copy.danger, size: 'large' }}
      cancelButtonProps={{ size: 'large', disabled: submitting }}
      confirmLoading={submitting}
      onOk={handleOk}
      // Đang gửi thì không cho đóng: yêu cầu vẫn chạy tiếp và kết quả sẽ không ai thấy.
      onCancel={() => { if (!submitting) onClose() }}
    >
      <div className={styles.modalBody}>
        <p className={styles.muted}>{copy.desc}</p>

        {action === 'cancel' && (
          <>
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldLabel}>Lý do hủy <span className={styles.required}>*</span></legend>
              <Radio.Group
                className={styles.reasons}
                value={form.reasonCode}
                options={CANCEL_REASONS}
                onChange={(event) => update('reasonCode')(event.target.value)}
              />
            </fieldset>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{form.reasonCode === 'OTHER' ? 'Ghi chú (bắt buộc)' : 'Ghi chú (không bắt buộc)'}</span>
              <Input.TextArea rows={3} maxLength={400} showCount value={form.note} onChange={(event) => update('note')(event.target.value)} />
            </label>
          </>
        )}

        {(action === 'complete' || action === 'correct') && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Kết quả buổi lái thử <span className={styles.required}>*</span></span>
            <Input.TextArea rows={4} maxLength={1000} showCount value={form.outcome} onChange={(event) => update('outcome')(event.target.value)} />
          </label>
        )}

        {action === 'reassign' && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nhân viên phụ trách mới <span className={styles.required}>*</span></span>
            <Select
              size="large"
              placeholder="Chọn nhân viên"
              options={staffOptions.filter((option) => option.value !== appointment.assignedTo?.id)}
              value={form.staffId || undefined}
              onChange={update('staffId')}
            />
          </label>
        )}

        {error && <Alert type="error" showIcon title={error} role="alert" />}
      </div>
    </Modal>
  )
}
