import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import {
  fetchAssignableRoles,
  fetchStaffUsers,
  updateUserRoles,
  resetStaffPassword,
  lockStaffUser,
  unlockStaffUser,
} from '../api/userManagementApi'
import { buildRoleIdsPayload, validateRoleSelection } from '../utils/roleSelection'

/**
 * Trạng thái màn quản lý nhân sự (KAN-93). Tách khỏi component để trang chỉ lo
 * trình bày. BE vẫn là nơi kiểm quyền cuối cùng.
 */
export function useStaffUsers() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [roles, setRoles] = useState([])
  const [status, setStatus] = useState('idle')   // idle | loading | ready | error
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async (targetPage = page) => {
    setStatus('loading')
    setError(null)
    try {
      const [list, roleList] = await Promise.all([
        fetchStaffUsers({ page: targetPage, limit: 20 }),
        fetchAssignableRoles(),
      ])
      setItems(list.items)
      setMeta(list.meta)
      setRoles(roleList)
      setStatus('ready')
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách nhân sự.')
      setStatus('error')
    }
  }, [page])

  useEffect(() => { load(page) }, [load, page])

  /**
   * Lưu tập role mới cho một nhân sự. Trả về true khi BE chấp nhận.
   * Cập nhật lại dòng trong danh sách bằng dữ liệu BE trả về — không tự suy đoán
   * để tránh lệch với role chính do BE chọn.
   */
  const saveRoles = useCallback(async (user, selectedNames) => {
    const invalid = validateRoleSelection(selectedNames)
    if (invalid) { message.error(invalid); return false }

    const roleIds = buildRoleIdsPayload(selectedNames, user.roleName, roles)
    if (roleIds.length === 0) { message.error('Vai trò đã chọn không hợp lệ.'); return false }

    setSavingId(user._id)
    try {
      const updated = await updateUserRoles(user._id, roleIds)
      setItems((prev) => prev.map((u) => (
        u._id === user._id
          ? { ...u, roleNames: updated.roleNames, roleName: updated.roleName, roles: updated.roles }
          : u
      )))
      message.success('Đã cập nhật vai trò. Người dùng sẽ phải đăng nhập lại.')
      return true
    } catch (err) {
      message.error(err?.response?.data?.message || 'Cập nhật vai trò thất bại.')
      return false
    } finally {
      setSavingId(null)
    }
  }, [roles])

  /**
   * KAN-101 — chạy một trong 3 action "nguy hiểm": reset / lock / unlock.
   * Trả về true khi BE chấp nhận; UI dùng giá trị trả về để đóng modal.
   * Sau khi thành công reload trang hiện tại để lấy lại trạng thái locked.
   */
  const runAction = useCallback(async (user, type, reason) => {
    setSavingId(user._id)
    try {
      if (type === 'reset') {
        await resetStaffPassword(user._id, { reason })
        message.success('Đã gửi email mật khẩu mới cho nhân sự.')
      } else if (type === 'lock') {
        await lockStaffUser(user._id, { reason })
        message.success('Đã khoá tài khoản. Nhân sự không thể đăng nhập cho tới khi được mở khoá.')
      } else if (type === 'unlock') {
        await unlockStaffUser(user._id, { reason })
        message.success('Đã mở khoá tài khoản.')
      } else {
        return false
      }
      await load(page)
      return true
    } catch (err) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại.')
      return false
    } finally {
      setSavingId(null)
    }
  }, [load, page])

  return { items, meta, roles, status, error, page, setPage, load, saveRoles, savingId, runAction }
}

export default { useStaffUsers }
