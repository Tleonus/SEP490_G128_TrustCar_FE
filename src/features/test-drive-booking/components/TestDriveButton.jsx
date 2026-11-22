import { useState } from 'react'
import { Button } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/useAuthStore'
import BookingModal from './BookingModal'
import { toCarItem } from '../utils/carSelection'

/**
 * Nút "Đặt lịch lái thử" ở trang chi tiết xe.
 * - Ẩn nếu xe không có id hợp lệ (dữ liệu mẫu), vì BE chỉ nhận id thật.
 * - Chưa đăng nhập: chuyển tới /dang-nhap kèm trang hiện tại để quay lại sau khi đăng nhập.
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
  if (!item) return null

  function handleClick() {
    if (!isAuthenticated) {
      navigate('/dang-nhap', { state: { from: location } })
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
