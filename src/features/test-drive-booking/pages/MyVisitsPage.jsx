import { useState } from 'react'
import { App, Button, Empty, Pagination, Segmented, Skeleton } from 'antd'
import { Link } from 'react-router-dom'
import VisitCard from '../components/VisitCard'
import CancelVisitModal from '../components/CancelVisitModal'
import RescheduleModal from '../components/RescheduleModal'
import LoadError from '../components/LoadError'
import { useMyVisits } from '../hooks/useVisits'
import { VISIT_STATUS } from '../constants/testDriveConstants'
import styles from '../styles/MyVisitsPage.module.css'

const PAGE_SIZE = 10
const FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  ...['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((value) => ({ label: VISIT_STATUS[value].label, value })),
]

/**
 * "Lịch hẹn của tôi" (/lich-hen, cần đăng nhập): các lượt của khách, lọc theo trạng thái, phân trang,
 * hủy lượt và đổi lịch.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F08
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F19
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F25
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F28
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F29
 */
export default function MyVisitsPage() {
  const { message } = App.useApp()
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [cancelling, setCancelling] = useState(null)
  const [rescheduling, setRescheduling] = useState(null)
  const list = useMyVisits({ status: status === 'ALL' ? undefined : status, page, limit: PAGE_SIZE })

  // Đổi lịch tạo lượt MỚI (visitId mới) ở trạng thái "Chờ xác nhận": thay lượt cũ tại chỗ nếu còn khớp bộ lọc, không thì tải lại.
  const handleRescheduled = ({ visit }) => {
    if (status === 'ALL' || visit.status === status) list.replaceVisit(visit, rescheduling.visitId)
    else list.reload()
    setRescheduling(null)
  }
  const handleStale = (failure) => {
    message.warning(failure.message)
    setRescheduling(null)
    list.reload()
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Lịch hẹn của tôi</h1>
      <p className={styles.desc}>Các lượt lái thử bạn đã đặt. Showroom sẽ gọi điện để xác nhận.</p>

      <div className={styles.filter}>
        <Segmented
          options={FILTERS}
          value={status}
          onChange={(value) => { setStatus(value); setPage(1) }}
          aria-label="Lọc theo trạng thái"
        />
      </div>

      {list.status === 'loading' && <Skeleton active paragraph={{ rows: 6 }} aria-busy="true" />}
      {list.status === 'error' && <LoadError title="Không thể tải lịch hẹn" error={list.error} onRetry={list.reload} />}

      {list.status === 'success' && list.items.length === 0 && (
        <Empty description={status === 'ALL' ? 'Bạn chưa có lịch hẹn nào' : 'Không có lịch hẹn nào ở trạng thái này'}>
          <Link to="/xe"><Button type="primary">Xem xe đang bán</Button></Link>
        </Empty>
      )}

      {list.status === 'success' && list.items.length > 0 && (
        <>
          <p className={styles.count}>{list.meta?.total ?? list.items.length} lượt</p>
          <ul className={styles.list}>
            {list.items.map((visit) => (
              <li key={visit.visitId}><VisitCard visit={visit} onCancel={setCancelling} onReschedule={setRescheduling} /></li>
            ))}
          </ul>
          <div className={styles.pagination}>
            <Pagination
              current={list.meta?.page ?? page}
              pageSize={PAGE_SIZE}
              total={list.meta?.total ?? 0}
              showSizeChanger={false}
              hideOnSinglePage
              onChange={setPage}
            />
          </div>
        </>
      )}

      <CancelVisitModal
        key={cancelling?.visitId ?? 'none'}
        visit={cancelling}
        onClose={() => setCancelling(null)}
        onCancelled={(updated) => { list.replaceVisit(updated); setCancelling(null) }}
        onStale={list.reload}
      />

      <RescheduleModal
        visit={rescheduling}
        audience="customer"
        onClose={() => setRescheduling(null)}
        onDone={handleRescheduled}
        onStale={handleStale}
      />
    </div>
  )
}
