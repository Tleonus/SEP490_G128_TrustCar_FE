import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/useAuthStore'
import BookingModal from './BookingModal'
import { toCarItem } from '../utils/carSelection'
import { pendingBookingId, resumeLocation, withoutResume } from '../utils/resumeBooking'

/**
 * Nút "Đặt lịch lái thử" (trang chi tiết xe, showroom 3D).
 * - Ẩn nếu xe không có id hợp lệ (dữ liệu mẫu), vì BE chỉ nhận id thật.
 * - Chưa đăng nhập: chuyển tới /dang-nhap, nhớ trang hiện tại + xe (?datlich=<id>); đăng nhập xong quay về
 *   đúng trang đó và tự mở lại hộp đặt lịch cho xe đó.
 * - Đã đăng nhập: mở hộp thoại; quyền/hồ sơ do BE quyết định (403 được hiển thị rõ trong hộp thoại).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F01
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 * @param {object} car  Xe từ API công khai
 */
export default function TestDriveButton({ car }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const item = toCarItem(car)
  const resume = Boolean(item) && isAuthenticated && pendingBookingId(location.search) === item.id

  // Vừa đăng nhập xong và quay về: mở hộp đặt lịch, bỏ ?datlich để tải lại trang không mở lại lần nữa.
  useEffect(() => {
    if (!resume) return
    setOpen(true) // eslint-disable-line react-hooks/set-state-in-effect -- phản ứng một lần với đường dẫn (hệ thống ngoài)
    navigate({ pathname: location.pathname, search: withoutResume(location.search), hash: location.hash }, { replace: true })
  }, [resume, navigate, location.pathname, location.search, location.hash])

  if (!item) return null

  function handleClick() {
    if (!isAuthenticated) {
      navigate('/dang-nhap', { state: { from: resumeLocation(location, item.id) } })
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Button size="large" icon={<CalendarOutlined />} onClick={handleClick} block>
        Đặt lịch lái thử
      </Button>
      <BookingModal open={open} currentCar={item} onClose={() => setOpen(false)} />
    </>
  )
}
