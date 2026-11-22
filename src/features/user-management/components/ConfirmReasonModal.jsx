import { useEffect, useState } from 'react'
import { Modal, Input, Alert } from 'antd'

/**
 * KAN-101 — Modal xác nhận cho 3 action nguy hiểm trên trang Quản lý người dùng
 * (reset mật khẩu, khoá, mở khoá tài khoản). Dùng chung một component để tránh
 * copy-paste 3 modal gần giống nhau.
 *
 * Prop `config` quyết định tiêu đề, mô tả, loại button OK và tính bắt buộc của
 * trường "lý do" — khớp với yêu cầu BE (lock: reason bắt buộc, còn lại tuỳ chọn).
 */
const { TextArea } = Input

const DEFAULT_MAX = 200

export default function ConfirmReasonModal({ open, config, user, saving, onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) { setReason(''); setTouched(false) }
  }, [open])

  if (!config || !user) return null

  const trimmed = reason.trim()
  const invalid = config.required && trimmed.length === 0

  const handleOk = async () => {
    setTouched(true)
    if (invalid) return
    const ok = await onConfirm(trimmed || undefined)
    if (ok) onCancel()
  }

  return (
    <Modal
      open={open}
      title={config.title}
      okText={config.okText || 'Xác nhận'}
      okButtonProps={{ danger: config.danger, loading: saving, disabled: invalid }}
      cancelText="Huỷ"
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={!saving}
      destroyOnClose
    >
      <p style={{ margin: '0 0 12px' }}>
        {config.description} <strong>{user.fullName || user.email}</strong>?
      </p>
      {config.warning && (
        <Alert
          type="warning"
          showIcon
          message={config.warning}
          style={{ marginBottom: 12 }}
        />
      )}
      <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>
        Lý do {config.required ? <span style={{ color: '#d4380d' }}>*</span> : <span style={{ color: '#8c8c8c' }}>(tuỳ chọn)</span>}
      </label>
      <TextArea
        rows={3}
        maxLength={DEFAULT_MAX}
        showCount
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={config.placeholder || 'Ghi lại lý do để tra cứu trong Nhật ký sau này…'}
        status={touched && invalid ? 'error' : undefined}
      />
      {touched && invalid && (
        <div style={{ color: '#d4380d', marginTop: 6, fontSize: 13 }}>
          Vui lòng nhập lý do trước khi xác nhận.
        </div>
      )}
    </Modal>
  )
}
