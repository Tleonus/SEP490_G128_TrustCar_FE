import { Tag } from 'antd'
import { CAR_STATE_META, DEPOSIT_STATUS_META, PAYMENT_STATUS_META } from '../constants/depositConstants'

/** Nhãn trạng thái xe (AVAILABLE / RESERVED / SOLD). */
export function CarStateBadge({ state }) {
  const meta = CAR_STATE_META[state]
  if (!meta) return null
  return <Tag color={meta.color}>{meta.label}</Tag>
}

/** Nhãn trạng thái lượt giữ xe. */
export function DepositStatusBadge({ status }) {
  const meta = DEPOSIT_STATUS_META[status] || { label: status, color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

/** Nhãn trạng thái thanh toán (tách riêng tiền cọc và thanh toán đủ). */
export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status] || { label: status, color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export default DepositStatusBadge
