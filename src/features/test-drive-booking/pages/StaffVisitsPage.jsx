import { useState } from 'react'
import { Button, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import StaffVisitsList from './StaffVisitsList'
import StaffAvailabilityTab from '../components/StaffAvailabilityTab'
import styles from '../styles/StaffVisits.module.css'

/**
 * Lịch lái thử cho nhân viên (/admin/lich-lai-thu, ADMIN và SALES_STAFF qua AdminRoute).
 * Hai tab: "Danh sách lượt" (xác nhận, hủy có lý do, đổi lịch, cờ nhắc việc) và "Lịch trống" (xem ai đã đặt khung nào).
 * Nút "Đặt hộ khách" ở tiêu đề. Tab "Lịch trống" chỉ được dựng khi mở lần đầu nên đúng một lần gọi API.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F13
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F33
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F34
 */
export default function StaffVisitsPage() {
  const [booking, setBooking] = useState(false)
  const [tab, setTab] = useState('list')

  const items = [
    {
      key: 'list',
      label: 'Danh sách lượt',
      children: <StaffVisitsList active={tab === 'list'} bookingOpen={booking} onBookingClose={() => setBooking(false)} />,
    },
    { key: 'availability', label: 'Lịch trống', children: <StaffAvailabilityTab /> },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Lịch lái thử</h1>
          <p className={styles.desc}>Lượt khách đặt từ hôm nay. Gọi nhắc trước giờ hẹn, gọi xác nhận các lượt chờ và gọi báo khi xe không còn bán.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setBooking(true)}>Đặt hộ khách</Button>
      </header>

      <Tabs activeKey={tab} onChange={setTab} items={items} />
    </div>
  )
}
