import { useState } from 'react'
import { Alert, Button, Checkbox, Collapse, InputNumber, Modal } from 'antd'
import { SafetyCertificateFilled } from '@ant-design/icons'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { depositPolicyText, REFUND_POLICY_TEXT } from '../constants/depositConstants'
import { formatVnd } from '../utils/depositFormat'
import styles from '../styles/Deposit.module.css'

const STEP = 1_000_000

/**
 * Modal xác nhận đặt cọc: ảnh xe, tên xe, giá bán, số tiền cọc, chính sách cọc/hoàn cọc,
 * thời gian giữ xe. policy (min/max/suggested/holdHours) do backend tính theo giá xe.
 * Component cha đổi `key` mỗi lần mở để form về giá trị mặc định.
 */
export default function DepositConfirmModal({ open, car, policy, submitting, error, onConfirm, onCancel }) {
  const [amount, setAmount] = useState(policy?.suggestedAmount ?? null)
  const [agreed, setAgreed] = useState(false)

  if (!car) return null
  const title = getCarTitle(car)
  const cover = getCoverImage(car)
  const holdHours = policy?.holdHours ?? 24
  const min = policy?.minAmount ?? 0
  const max = policy?.maxAmount ?? 0
  const amountValid = Number.isInteger(amount) && amount >= min && amount <= max && max > 0

  return (
    <Modal
      open={open}
      onCancel={submitting ? undefined : onCancel}
      maskClosable={!submitting}
      title={<span><SafetyCertificateFilled style={{ color: 'var(--color-accent)' }} /> Xác nhận đặt cọc giữ xe</span>}
      width={620}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>Hủy</Button>,
        <Button
          key="ok"
          type="primary"
          className={styles.depositBtn}
          loading={submitting}
          disabled={!agreed || !amountValid}
          onClick={() => onConfirm(amount)}
        >
          Xác nhận đặt cọc
        </Button>,
      ]}
    >
      <div className={styles.modalCar}>
        {cover?.url ? <img src={cover.url} alt={title} className={styles.modalCarImg} /> : <div className={styles.modalCarImg} />}
        <div className={styles.modalCarInfo}>
          <strong className={styles.modalCarTitle}>{title}</strong>
          {car.vehicleCode && <span className={styles.muted}>Mã xe: {car.vehicleCode}</span>}
          <span className={styles.modalCarPrice}>Giá bán: {formatVnd(car.price)}</span>
        </div>
      </div>

      <div className={styles.modalField}>
        <label htmlFor="deposit-amount" className={styles.modalLabel}>Số tiền đặt cọc (VND)</label>
        <InputNumber
          id="deposit-amount"
          size="large"
          style={{ width: '100%' }}
          min={min}
          max={max}
          step={STEP}
          value={amount}
          onChange={(value) => setAmount(value == null ? null : Math.round(Number(value)))}
          formatter={(value) => (value == null || value === '' ? '' : new Intl.NumberFormat('vi-VN').format(value))}
          parser={(value) => String(value || '').replace(/[^\d]/g, '')}
          disabled={submitting}
          status={amount != null && !amountValid ? 'error' : undefined}
        />
        <span className={styles.muted}>
          Tối thiểu {formatVnd(min)} – tối đa {formatVnd(max)}. Đề xuất: {formatVnd(policy?.suggestedAmount)}.
        </span>
      </div>

      <Alert
        type="info"
        showIcon
        className={styles.modalAlert}
        title={`Thời hạn giữ xe: ${holdHours} giờ`}
        description={`Xe được giữ riêng cho bạn trong ${holdHours} giờ. Vui lòng chuyển tiền cọc và hoàn tất thanh toán đủ giá trị xe trước khi hết hạn; quá thời hạn, lượt giữ tự động hết hạn và xe được mở bán lại.`}
      />
      {amountValid && (
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          Còn lại cần thanh toán sau khi trừ cọc: <b>{formatVnd(Math.max(0, (car.price ?? 0) - amount))}</b>
        </p>
      )}

      <Collapse
        size="small"
        className={styles.modalPolicy}
        defaultActiveKey={['deposit']}
        items={[
          {
            key: 'deposit',
            label: 'Chính sách đặt cọc',
            children: <ul className={styles.policyList}>{depositPolicyText(holdHours).map((t) => <li key={t}>{t}</li>)}</ul>,
          },
          {
            key: 'refund',
            label: 'Chính sách hoàn cọc',
            children: <ul className={styles.policyList}>{REFUND_POLICY_TEXT.map((t) => <li key={t}>{t}</li>)}</ul>,
          },
        ]}
      />

      {error && <Alert type="error" showIcon title={error} className={styles.modalAlert} />}

      <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={submitting}>
        Tôi đã đọc và đồng ý với chính sách đặt cọc và hoàn cọc của TrustCar.
      </Checkbox>
    </Modal>
  )
}
