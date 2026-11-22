import { Alert, Skeleton } from 'antd'
import LoadError from '../../test-drive-booking/components/LoadError'
import RescheduleModal from '../../test-drive-booking/components/RescheduleModal'
import StaffActionModal from '../../test-drive-booking/components/StaffActionModal'
import CalendarToolbar from '../components/CalendarToolbar'
import DayDrawer from '../components/DayDrawer'
import MonthGrid from '../components/MonthGrid'
import VisitDetailModal from '../components/VisitDetailModal'
import WeekGrid from '../components/WeekGrid'
import { MAX_VISITS, MODE } from '../constants/calendarConstants'
import { useCalendarScreen } from '../hooks/useCalendarScreen'
import { useIsNarrow } from '../hooks/useIsNarrow'
import { titleOf, todayKey } from '../utils/calendarRange'
import styles from '../styles/StaffCalendar.module.css'

/**
 * Tab "Lịch" của nhân viên: lượt lái thử dạng lịch tháng/tuần (giờ VN). Bấm ngày để xem lượt theo khung giờ, bấm một lượt
 * để xem chi tiết và xác nhận / hủy / đổi lịch bằng đúng các hộp thao tác của tab "Danh sách lượt".
 * Chỉ ĐỌC dữ liệu (nhiều trang tuần tự); mọi thao tác ghi do `StaffActionModal`/`RescheduleModal` sẵn có đảm nhiệm.
 *
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F01
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F14
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F15
 * @ears .sdd/features/staff-test-drive-calendar/SPEC.md#REQ-F16
 * @param {boolean} active       Tab này đang mở
 * @param {boolean} bookingOpen  Hộp "Đặt hộ khách" (ở tiêu đề trang) đang mở
 */
export default function StaffCalendarTab({ active = true, bookingOpen = false }) {
  const s = useCalendarScreen({ active, bookingOpen })
  const narrow = useIsNarrow()
  const { data } = s
  const today = todayKey()
  const Grid = s.mode === MODE.WEEK ? WeekGrid : MonthGrid

  return (
    <div className={styles.tab}>
      <CalendarToolbar
        title={titleOf(s.mode, s.anchor)}
        mode={s.mode}
        onMode={s.changeMode}
        onPrev={() => s.go(-1)}
        onNext={() => s.go(1)}
        onToday={s.goToday}
        showCancelled={s.showCancelled}
        onShowCancelled={s.setShowCancelled}
        onRefresh={data.reload}
        loading={data.status === 'loading'}
      />

      {data.status === 'loading' && <Skeleton active paragraph={{ rows: 8 }} aria-busy="true" />}
      {data.status === 'error' && <LoadError title="Không thể tải lịch lái thử" error={data.error} onRetry={data.reload} />}

      {data.status === 'success' && (
        <>
          {data.truncated && (
            <Alert
              type="warning"
              showIcon
              message={`Chỉ hiển thị ${MAX_VISITS} lượt đầu của kỳ này`}
              description='Hãy dùng tab "Danh sách lượt" để lọc theo ngày hoặc trạng thái.'
            />
          )}
          {s.days.size === 0 && <p className={styles.empty} role="status">Không có lượt lái thử trong kỳ này</p>}
          <Grid
            anchor={s.anchor}
            days={s.days}
            today={today}
            narrow={narrow}
            onOpenDay={s.setDayOpen}
            onOpenVisit={s.openVisit}
          />
        </>
      )}

      <DayDrawer dayKey={s.dayOpen} entry={s.dayOpen ? s.days.get(s.dayOpen) : undefined} onClose={() => s.setDayOpen(null)} onOpenVisit={s.openVisit} />
      <VisitDetailModal visit={s.detail} onClose={s.closeDetail} onAction={s.open} />

      <StaffActionModal
        key={s.action ? `${s.action.visit.visitId}:${s.action.status}` : 'none'}
        action={s.action}
        onClose={() => s.setAction(null)}
        onDone={s.actionDone}
        onStale={data.reload}
      />
      <RescheduleModal
        visit={s.rescheduling}
        audience="staff"
        onClose={() => s.setRescheduling(null)}
        onDone={s.rescheduled}
        onStale={s.stale}
      />
    </div>
  )
}
