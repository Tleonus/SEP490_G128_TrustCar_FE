import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Popconfirm, Result, Skeleton, message } from 'antd'
import { CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../../store/useAuthStore'
import { CONTACT_INFO } from '../../../config/contactInfo'
import { useCarHoldStatus } from '../hooks/useCarHoldStatus'
import { cancelDeposit, createDeposit } from '../api/depositApi'
import { CAR_STATE, CUSTOMER_ROLE, DEPOSIT_PATHS, DEPOSIT_STATUS } from '../constants/depositConstants'
import { depositErrorMessage, isStaleStateError } from '../utils/depositErrors'
import { formatDateTime, formatVnd } from '../utils/depositFormat'
import CountdownTimer from './CountdownTimer'
import DepositButton from './DepositButton'
import DepositConfirmModal from './DepositConfirmModal'
import PaymentInstructions from './PaymentInstructions'
import { CarStateBadge, DepositStatusBadge, PaymentStatusBadge } from './DepositStatusBadge'
import styles from '../styles/Deposit.module.css'

/**
 * Khối "Đặt cọc giữ xe" hoàn chỉnh cho trang chi tiết xe:
 * nút đặt cọc, modal xác nhận, đồng hồ đếm ngược, trạng thái AVAILABLE / RESERVED / SOLD,
 * thông báo đặt cọc thành công / hết hạn. Mọi trạng thái lấy từ backend.
 *
 * Props: car (object xe đã có ở trang chi tiết – chỉ dùng để hiển thị) hoặc carKey.
 */
export default function CarDepositPanel({ car: carProp, carKey: carKeyProp }) {
  const carKey = carKeyProp || carProp?.vehicleCode || carProp?._id
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const { status, loading, error, clockOffsetMs, refresh } = useCarHoldStatus(carKey)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [notice, setNotice] = useState(null) // { type, title, text }

  const car = status?.car || carProp
  const state = status?.state
  const hold = status?.hold
  const myDeposit = hold?.isMine ? hold.deposit : null
  const holdHours = status?.policy?.holdHours ?? 24

  const handleExpire = useCallback(async () => {
    const latest = await refresh()
    if (myDeposit && latest?.state === CAR_STATE.AVAILABLE) {
      setNotice({
        type: 'warning',
        title: 'Lượt giữ xe đã hết hạn',
        text: 'Bạn chưa hoàn tất thanh toán trong thời gian giữ xe nên xe đã được mở bán lại. Nếu đã chuyển tiền cọc, TrustCar sẽ liên hệ để hoàn cọc theo chính sách.',
      })
    }
  }, [refresh, myDeposit])

  function goLogin() {
    navigate('/dang-nhap', { state: { from: location } })
  }

  function handleDepositClick() {
    setNotice(null)
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để đặt cọc giữ xe.')
      goLogin()
      return
    }
    if (user?.roleName !== CUSTOMER_ROLE) {
      message.warning('Chỉ tài khoản khách hàng mới có thể đặt cọc.')
      return
    }
    setSubmitError(null)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  async function handleConfirm(amount) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createDeposit({ carId: status?.carId || carKey, depositAmount: amount, userId: user?._id })
      setModalOpen(false)
      setNotice({
        type: 'success',
        title: 'Đặt cọc giữ xe thành công',
        text: 'Xe đã được giữ riêng cho bạn. Vui lòng chuyển tiền cọc theo hướng dẫn bên dưới và hoàn tất thanh toán trước khi hết thời gian giữ xe.',
      })
      message.success('Đặt cọc giữ xe thành công!')
      await refresh()
    } catch (err) {
      if (err?.response?.status === 401) {
        setModalOpen(false)
        goLogin()
        return
      }
      if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        setModalOpen(false)
        message.warning(depositErrorMessage(err))
        navigate('/hoan-tat-ho-so', { state: { from: location } })
        return
      }
      setSubmitError(depositErrorMessage(err))
      if (isStaleStateError(err)) {
        const latest = await refresh()
        if (latest && latest.state !== CAR_STATE.AVAILABLE) {
          setModalOpen(false)
          message.error(depositErrorMessage(err))
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!myDeposit) return
    setCancelling(true)
    try {
      await cancelDeposit(myDeposit.id)
      message.success('Đã hủy lượt giữ xe.')
      setNotice(null)
    } catch (err) {
      message.error(depositErrorMessage(err))
    } finally {
      setCancelling(false)
      refresh()
    }
  }

  if (!carKey) return null
  if (loading && !status) return <div className={styles.panel}><Skeleton.Button active block size="large" /></div>
  if (error && !status) {
    // Không chặn trang chi tiết xe nếu module đặt cọc lỗi.
    return (
      <div className={styles.panel}>
        <Alert type="warning" showIcon title="Không tải được trạng thái giữ xe." action={<Button size="small" onClick={refresh}>Thử lại</Button>} />
      </div>
    )
  }
  if (!status || state === CAR_STATE.UNAVAILABLE) return null

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>Đặt cọc giữ xe online</span>
        <CarStateBadge state={state} />
      </div>

      {notice && (
        <Alert
          type={notice.type}
          showIcon
          closable={{ onClose: () => setNotice(null) }}
          title={notice.title}
          description={notice.text}
          className={styles.panelAlert}
        />
      )}

      {state === CAR_STATE.AVAILABLE && (
        <>
          <p className={styles.panelText}>
            <InfoCircleOutlined /> Đặt cọc từ {formatVnd(status.policy?.minAmount)} để giữ riêng xe này trong {holdHours} giờ.
          </p>
          <DepositButton state={state} onClick={handleDepositClick} />
        </>
      )}

      {state === CAR_STATE.RESERVED && myDeposit && (
        <div className={styles.mine}>
          <div className={styles.mineHead}>
            <CheckCircleFilled className={styles.successIcon} />
            <div>
              <strong>Bạn đang giữ xe này</strong>
              <div className={styles.muted}>
                Mã đặt cọc <b>{myDeposit.depositCode}</b> · Tiền cọc {formatVnd(myDeposit.depositAmount)}
              </div>
              <div className={styles.badgeRow}>
                <DepositStatusBadge status={myDeposit.status} />
                <PaymentStatusBadge status={myDeposit.paymentStatus} />
              </div>
            </div>
          </div>

          <CountdownTimer
            expiresAt={hold.expiresAt}
            clockOffsetMs={clockOffsetMs}
            onExpire={handleExpire}
            label="Hoàn tất thanh toán trong"
          />
          <div className={styles.muted}>
            Hết hạn lúc {formatDateTime(hold.expiresAt)} · Còn phải thanh toán sau cọc: <b>{formatVnd(myDeposit.remainingAmount)}</b>
          </div>

          {myDeposit.status === DEPOSIT_STATUS.PENDING_PAYMENT && (
            <PaymentInstructions
              instructions={myDeposit.paymentInstructions}
              hotline={{ href: CONTACT_INFO.phoneHref, display: CONTACT_INFO.phoneDisplay }}
            />
          )}
          {myDeposit.status === DEPOSIT_STATUS.DEPOSIT_PAID && (
            <Alert
              type="success"
              showIcon
              title="TrustCar đã xác nhận nhận tiền cọc"
              description="Vui lòng liên hệ TrustCar để hoàn tất thanh toán phần còn lại và ký hợp đồng trước khi hết thời gian giữ xe."
              action={<Button size="small" href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phoneDisplay}</Button>}
            />
          )}

          <div className={styles.mineActions}>
            <Button onClick={() => navigate(DEPOSIT_PATHS.myDeposits)}>Xem lịch sử đặt cọc</Button>
            {myDeposit.status === DEPOSIT_STATUS.PENDING_PAYMENT && (
              <Popconfirm
                title="Hủy lượt giữ xe?"
                description="Xe sẽ được mở bán lại cho khách hàng khác."
                okText="Hủy giữ xe"
                cancelText="Không"
                okButtonProps={{ danger: true }}
                onConfirm={handleCancel}
              >
                <Button danger loading={cancelling}>Hủy giữ xe</Button>
              </Popconfirm>
            )}
          </div>
        </div>
      )}

      {state === CAR_STATE.RESERVED && !myDeposit && (
        <>
          {/* Không hiển thị bất kỳ thông tin nào của người đang giữ xe. */}
          <p className={styles.panelText}>Xe đang được một khách hàng khác giữ chỗ.</p>
          {hold?.expiresAt && (
            <CountdownTimer expiresAt={hold.expiresAt} clockOffsetMs={clockOffsetMs} onExpire={handleExpire} label="Lượt giữ xe kết thúc sau" />
          )}
          <DepositButton state={state} />
        </>
      )}

      {state === CAR_STATE.SOLD && (
        <Result status="info" title="Xe đã được bán" subTitle="Mời bạn tham khảo các xe tương tự." className={styles.soldResult} />
      )}

      <DepositConfirmModal
        key={modalKey}
        open={modalOpen}
        car={car}
        policy={status.policy}
        submitting={submitting}
        error={submitError}
        onConfirm={handleConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}
