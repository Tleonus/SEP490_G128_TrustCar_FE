import { Button, Tooltip } from 'antd'
import { LockOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import { CAR_STATE } from '../constants/depositConstants'
import styles from '../styles/Deposit.module.css'

/**
 * Nút "Đặt cọc giữ xe". Chỉ bấm được khi xe AVAILABLE.
 * Việc kiểm tra đăng nhập / vai trò do component cha (CarDepositPanel) xử lý trong onClick.
 */
export default function DepositButton({ state, onClick, loading = false, disabledReason }) {
  if (state === CAR_STATE.RESERVED) {
    return (
      <Button size="large" block disabled icon={<LockOutlined />} className={styles.depositBtnDisabled}>
        Xe đang được giữ chỗ
      </Button>
    )
  }
  if (state === CAR_STATE.SOLD) {
    return (
      <Button size="large" block disabled className={styles.depositBtnDisabled}>
        Xe đã được bán
      </Button>
    )
  }
  if (state !== CAR_STATE.AVAILABLE) return null

  const button = (
    <Button
      size="large"
      block
      type="primary"
      icon={<SafetyCertificateFilled />}
      className={styles.depositBtn}
      onClick={onClick}
      loading={loading}
      disabled={Boolean(disabledReason)}
    >
      Đặt cọc giữ xe
    </Button>
  )
  return disabledReason ? <Tooltip title={disabledReason}>{button}</Tooltip> : button
}
