import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../../store/useAuthStore'
import { useFocusReturn } from '../hooks/useFocusReturn'
import TestDriveBookingModal from './TestDriveBookingModal'

// API đặt lịch chỉ dành cho khách, nên nhân viên không thấy nút này.
export default function TestDriveBookingButton({ car }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const roleName = useAuthStore((state) => state.user?.roleName)
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { remember, restore } = useFocusReturn()

  if (isAuthenticated && roleName !== 'CUSTOMER') return null

  function handleClick() {
    if (!isAuthenticated) {
      navigate('/dang-nhap', { state: { from: location } })
      return
    }
    remember()
    setOpen(true)
  }

  return (
    <>
      <Button size="large" icon={<CalendarOutlined />} onClick={handleClick} block>
        Đặt lịch lái thử
      </Button>
      {open && <TestDriveBookingModal car={car} onClose={() => { setOpen(false); restore() }} />}
    </>
  )
}
