import { Alert, Button, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { formatVnd } from '../utils/depositFormat'
import styles from '../styles/Deposit.module.css'

/**
 * Hướng dẫn thanh toán tiền cọc. Hệ thống chưa có cổng thanh toán, nên KHÔNG giả lập
 * "thanh toán thành công": trạng thái chỉ đổi khi nhân viên xác thực khoản tiền ở backend.
 */
export default function PaymentInstructions({ instructions, hotline }) {
  if (!instructions) return null
  const { amount, transferContent, bankName, accountNumber, accountName, configured } = instructions

  return (
    <div className={styles.payBox}>
      <strong className={styles.payTitle}>Thanh toán tiền cọc</strong>
      <dl className={styles.payList}>
        <dt>Số tiền</dt>
        <dd>{formatVnd(amount)}</dd>
        <dt>Nội dung chuyển khoản</dt>
        <dd>
          <Typography.Text strong copyable={{ text: transferContent, icon: <CopyOutlined /> }}>{transferContent}</Typography.Text>
        </dd>
        {configured && (
          <>
            <dt>Ngân hàng</dt>
            <dd>{bankName}</dd>
            <dt>Số tài khoản</dt>
            <dd><Typography.Text copyable>{accountNumber}</Typography.Text></dd>
            {accountName && (<><dt>Chủ tài khoản</dt><dd>{accountName}</dd></>)}
          </>
        )}
      </dl>
      {!configured && (
        <Alert
          type="warning"
          showIcon
          title="Vui lòng liên hệ TrustCar để nhận thông tin chuyển khoản, hoặc thanh toán trực tiếp tại showroom."
          action={hotline ? <Button size="small" href={hotline.href}>{hotline.display}</Button> : null}
        />
      )}
      <p className={styles.muted}>
        Sau khi nhận được tiền, nhân viên TrustCar sẽ xác nhận và trạng thái thanh toán chuyển sang “Đã thanh toán cọc”.
        Hệ thống không tự đánh dấu đã thanh toán.
      </p>
    </div>
  )
}
