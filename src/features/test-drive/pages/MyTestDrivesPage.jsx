import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Modal, Pagination, Tag, message } from 'antd'
import { EmptyState, ErrorState, LoadingState } from '../../../components/common/StateBlock'
import { cancelMyTestDrive, listMyTestDrives } from '../api/testDriveApi'
import { MY_TEST_DRIVES_PAGE_SIZE, STATUS_COLOR, STATUS_LABEL } from '../constants/testDriveConstants'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { useClampPage } from '../hooks/useClampPage'
import { canCustomerCancel, formatCarName } from '../utils/testDriveActions'
import { getTestDriveErrorMessage, isProfileIncompleteError, isStaleAppointmentError } from '../utils/testDriveErrors'
import { formatAppointmentWhen } from '../utils/testDriveTime'
import styles from '../styles/TestDriveBooking.module.css'

export default function MyTestDrivesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [cancelling, setCancelling] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Đi từ trang chi tiết xe sang thì vị trí cuộn cũ còn giữ, phải về đầu trang để thấy danh sách.
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const list = useAsyncResource(() => listMyTestDrives({ page, limit: MY_TEST_DRIVES_PAGE_SIZE }), `${page}|${refreshKey}`)
  useClampPage(list, page)
  const items = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const now = new Date()

  async function handleCancel() {
    setSubmitting(true)
    setCancelError('')
    try {
      await cancelMyTestDrive(cancelling.id)
      message.success(`Đã hủy lịch ${cancelling.appointmentCode}`)
      setCancelling(null)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setCancelError(getTestDriveErrorMessage(error))
      // Lịch đã đổi trạng thái: tải lại để khách thấy tình trạng mới phía sau hộp thoại.
      if (isStaleAppointmentError(error)) setRefreshKey((key) => key + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <h1 className={styles.title}>Lịch lái thử của tôi</h1>

        {list.loading && <LoadingState text="Đang tải lịch của bạn..." />}
        {!list.loading && isProfileIncompleteError(list.error) && (
          <Alert type="warning" showIcon title={getTestDriveErrorMessage(list.error)} description={<Link to="/hoan-tat-ho-so">Hoàn tất hồ sơ</Link>} />
        )}
        {!list.loading && list.error && !isProfileIncompleteError(list.error) && (
          <ErrorState message={getTestDriveErrorMessage(list.error)} onRetry={() => setRefreshKey((key) => key + 1)} />
        )}
        {!list.loading && !list.error && items.length === 0 && (
          <>
            <EmptyState description="Bạn chưa có lịch lái thử nào." />
            <div className={styles.centerAction}><Button type="primary" size="large" onClick={() => navigate('/xe')}>Chọn xe để lái thử</Button></div>
          </>
        )}
        {!list.loading && !list.error && items.length > 0 && (
          <>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <strong className={styles.code}>{item.appointmentCode}</strong>
                    <Tag color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status] ?? item.status}</Tag>
                  </div>
                  <div className={styles.carName}>{formatCarName(item.car) || 'Xe không còn trên hệ thống'}</div>
                  <div className={styles.hint}>{formatAppointmentWhen(item)}</div>
                  {item.location && <div className={styles.hint}>{item.location}</div>}
                  {item.cancellationReason && <div className={styles.reason}>Lý do hủy: {item.cancellationReason}</div>}
                  {canCustomerCancel(item, now) && (
                    <div className={styles.cardActions}>
                      <Button danger size="large" onClick={() => { setCancelError(''); setCancelling(item) }}>Hủy lịch</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {total > MY_TEST_DRIVES_PAGE_SIZE && (
              <div className={styles.pagination}>
                <Pagination current={page} pageSize={MY_TEST_DRIVES_PAGE_SIZE} total={total} showSizeChanger={false} onChange={(next) => setSearchParams({ page: String(next) })} />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={Boolean(cancelling)}
        title={`Hủy lịch ${cancelling?.appointmentCode ?? ''}`}
        okText="Hủy lịch"
        cancelText="Giữ lịch"
        okButtonProps={{ danger: true, size: 'large' }}
        cancelButtonProps={{ size: 'large', disabled: submitting }}
        confirmLoading={submitting}
        onOk={handleCancel}
        onCancel={() => { if (!submitting) setCancelling(null) }}
      >
        <p>Lần đặt này vẫn được tính vào giới hạn 3 lần đặt mỗi ngày. Muốn đổi giờ, bạn cần hủy rồi đặt lại.</p>
        {cancelError && <Alert type="error" showIcon role="alert" title={cancelError} />}
      </Modal>
    </div>
  )
}
