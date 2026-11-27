import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../store/useAuthStore'
import { fetchMyProfile } from '../api/staffingApi'
import { canTakeAttendance } from '../utils/staffing'

/**
 * Tài khoản đang đăng nhập có được điểm danh không. ADMIN: luôn được. Nhân viên khác: đọc lại hồ sơ (`/auth/me`)
 * một lần để thấy quyền ADMIN vừa bật/tắt mà không cần đăng nhập lại; lỗi mạng thì dùng thông tin đã lưu.
 * @returns {boolean}
 */
export function useAttendanceAccess() {
  const user = useAuthStore((state) => state.user)
  const stored = canTakeAttendance(user)
  const [fresh, setFresh] = useState(null)

  useEffect(() => {
    if (!user || canTakeAttendance({ roleName: user.roleName, roleNames: user.roleNames })) return undefined
    const controller = new AbortController()
    fetchMyProfile(controller.signal)
      .then((profile) => setFresh(canTakeAttendance(profile)))
      .catch(() => {})
    return () => controller.abort()
  }, [user])

  return fresh ?? stored
}
