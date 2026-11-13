import { Empty, Pagination, Skeleton } from 'antd'
import StaffFilters from '../components/StaffFilters'
import StaffVisitTable from '../components/StaffVisitTable'
import StaffActionModal from '../components/StaffActionModal'
import RescheduleModal from '../components/RescheduleModal'
import StaffBookingModal from '../components/StaffBookingModal'
import LoadError from '../components/LoadError'
import { useStaffListScreen } from '../hooks/useStaffListScreen'
import { describeView } from '../utils/staffFilters'
import { STAFF_PAGE_SIZE } from '../constants/testDriveConstants'
import styles from '../styles/StaffVisits.module.css'

/**
 * Tab "Danh sách lượt" của nhân viên: bộ lọc (gồm "Gọi nhắc", "Cần chốt kết quả" và thứ tự), dòng nêu khoảng và
 * thứ tự đang xem, bảng (lượt "Cần xử lý" do BE ghim ở đầu), phân trang, hộp thao tác và hộp đổi lịch hộ.
 * Không có nút "Làm mới": danh sách tự cập nhật ngầm mỗi 60 giây và sau mỗi thao tác ghi (xem `useStaffListScreen`).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F14
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F16
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F32
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F40
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F43
 * @param {boolean} active             Tab này đang mở
 * @param {boolean} bookingOpen        Hộp "Đặt hộ khách" đang mở (nút nằm ở tiêu đề trang)
 * @param {() => void} onBookingClose
 */
export default function StaffVisitsList({ active = true, bookingOpen = false, onBookingClose = () => {} }) {
  const s = useStaffListScreen({ active, bookingOpen })
  const { list } = s

  return (
    <div className={styles.page}>
      <StaffFilters value={s.filters} onChange={s.change} />
      <p className={styles.viewNote} aria-live="polite">{describeView(s.filters)}</p>

      {list.status === 'loading' && <Skeleton active paragraph={{ rows: 6 }} aria-busy="true" />}
      {list.status === 'error' && <LoadError title="Không thể tải lịch lái thử" error={list.error} onRetry={list.reload} />}
      {list.status === 'success' && list.items.length === 0 && <Empty description="Không có lượt nào khớp bộ lọc" />}

      {list.status === 'success' && list.items.length > 0 && (
        <>
          <StaffVisitTable items={list.items} onAction={s.open} />
          <div className={styles.pagination}>
            <Pagination
              current={list.meta?.page ?? s.page}
              pageSize={STAFF_PAGE_SIZE}
              total={list.meta?.total ?? 0}
              showSizeChanger={false}
              hideOnSinglePage
              onChange={s.setPage}
            />
          </div>
        </>
      )}

      <StaffActionModal
        key={s.action ? `${s.action.visit.visitId}:${s.action.status}` : 'none'}
        action={s.action}
        onClose={() => s.setAction(null)}
        onDone={s.actionDone}
        onStale={list.reload}
      />

      <RescheduleModal
        visit={s.rescheduling}
        audience="staff"
        onClose={() => s.setRescheduling(null)}
        onDone={s.rescheduled}
        onStale={s.stale}
      />

      <StaffBookingModal
        open={bookingOpen}
        onClose={onBookingClose}
        onBooked={(visit) => { onBookingClose(); s.booked(visit) }}
      />
    </div>
  )
}
