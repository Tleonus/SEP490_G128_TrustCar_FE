import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Empty, Pagination, Popconfirm, Segmented, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { cancelDeposit, fetchMyDeposits } from '../api/depositApi'
import { DEPOSIT_PATHS, DEPOSIT_STATUS } from '../constants/depositConstants'
import { depositErrorMessage } from '../utils/depositErrors'
import { formatDateTime, formatVnd } from '../utils/depositFormat'
import { DepositStatusBadge, PaymentStatusBadge } from '../components/DepositStatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import styles from '../styles/Deposit.module.css'

const PAGE_SIZE = 10
const FILTERS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ chuyển cọc', value: DEPOSIT_STATUS.PENDING_PAYMENT },
  { label: 'Đã nhận cọc', value: DEPOSIT_STATUS.DEPOSIT_PAID },
  { label: 'Hoàn tất', value: DEPOSIT_STATUS.COMPLETED },
  { label: 'Hết hạn', value: DEPOSIT_STATUS.EXPIRED },
  { label: 'Đã hủy', value: DEPOSIT_STATUS.CANCELLED },
]

/** Lịch sử đặt cọc của khách hàng: /dat-coc-cua-toi (cần đăng nhập, vai trò CUSTOMER). */
export default function MyDepositsPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMyDeposits({ page, limit: PAGE_SIZE, ...(filter ? { status: filter } : {}) })
      setItems(data.items)
      setMeta(data.meta)
      setError(null)
    } catch (err) {
      setError(depositErrorMessage(err, 'Không thể tải lịch sử đặt cọc.'))
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function handleCancel(id) {
    setBusyId(id)
    try {
      await cancelDeposit(id)
      message.success('Đã hủy lượt giữ xe.')
    } catch (err) {
      message.error(depositErrorMessage(err))
    } finally {
      setBusyId(null)
      load()
    }
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Lịch sử đặt cọc</h1>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <Segmented options={FILTERS} value={filter} onChange={(value) => { setFilter(value); setPage(1) }} />
        </div>

        {loading && items.length === 0 && <LoadingState text="Đang tải lịch sử đặt cọc..." />}
        {error && !loading && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <Empty description="Bạn chưa có lượt đặt cọc nào." style={{ padding: '48px 0' }}>
            <Link to="/xe"><Button type="primary">Xem danh sách xe</Button></Link>
          </Empty>
        )}

        <div className={styles.historyList}>
          {items.map((d) => (
            <div key={d.id} className={styles.historyItem}>
              <div className={styles.historyMain}>
                <strong>{d.carTitle || d.carVehicleCode}</strong>
                <span className={styles.muted}>Mã đặt cọc: <b>{d.depositCode}</b> · Mã xe: {d.carVehicleCode || '—'}</span>
                <span>Tiền cọc: <b>{formatVnd(d.depositAmount)}</b> · Giá xe lúc đặt: {formatVnd(d.carPrice)}</span>
                <span className={styles.muted}>Ngày đặt cọc: {formatDateTime(d.createdAt)} · Hạn giữ xe: {formatDateTime(d.expiresAt)}</span>
                {d.paidAt && <span className={styles.muted}>Xác nhận nhận cọc: {formatDateTime(d.paidAt)}</span>}
                {d.completedAt && <span className={styles.muted}>Hoàn tất thanh toán: {formatDateTime(d.completedAt)}</span>}
                {d.holdActive && <CountdownTimer compact expiresAt={d.expiresAt} onExpire={load} />}
                {d.cancelReason && <span className={styles.muted}>Lý do kết thúc: {d.cancelReason}</span>}
                {d.refundedAt && <span className={styles.muted}>Đã hoàn {formatVnd(d.refundAmount)} lúc {formatDateTime(d.refundedAt)}</span>}
              </div>
              <div className={styles.historyActions}>
                <DepositStatusBadge status={d.status} />
                <PaymentStatusBadge status={d.paymentStatus} />
                {d.holdActive && (
                  <Link to={DEPOSIT_PATHS.carDeposit(d.carVehicleCode || d.carId)}>
                    <Button size="small">Xem xe đang giữ</Button>
                  </Link>
                )}
                {d.status === DEPOSIT_STATUS.PENDING_PAYMENT && d.holdActive && (
                  <Popconfirm
                    title="Hủy lượt giữ xe?"
                    okText="Hủy giữ xe"
                    cancelText="Không"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleCancel(d.id)}
                  >
                    <Button size="small" danger loading={busyId === d.id}>Hủy giữ xe</Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>

        {meta && meta.total > PAGE_SIZE && (
          <Pagination
            style={{ marginTop: 20, textAlign: 'center' }}
            current={page}
            pageSize={PAGE_SIZE}
            total={meta.total}
            onChange={setPage}
            showSizeChanger={false}
          />
        )}
      </div>
    </div>
  )
}
