import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { roleBadgeClass, roleLabel } from '../constants/userManagementConstants'
import RoleCheckboxGroup from './RoleCheckboxGroup'
import styles from '../styles/UserManagementPage.module.css'

/**
 * Modal gán nhiều vai trò cho một nhân sự (KAN-93).
 *
 * Lưu ý nghiệp vụ hiển thị cho người dùng: BE tăng tokenVersion khi đổi role, nên
 * phiên đang mở của nhân sự đó bị thu hồi ngay — họ phải đăng nhập lại.
 */
export default function RoleAssignModal({ user, roles, open, saving, onCancel, onSave }) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!open || !user) return
    setSelected(user.roleNames?.length ? [...user.roleNames] : (user.roleName ? [user.roleName] : []))
  }, [open, user])

  const current = user?.roleNames?.length ? user.roleNames : (user?.roleName ? [user.roleName] : [])
  const willRemove = current.filter((n) => !selected.includes(n))

  return (
    <Modal
      title={user ? `Vai trò của ${user.fullName || user.email}` : 'Vai trò'}
      open={open}
      onCancel={onCancel}
      confirmLoading={saving}
      okText="Lưu vai trò"
      cancelText="Hủy"
      onOk={() => onSave(selected)}
      destroyOnHidden
    >
      <p className={styles.modalHint}>
        Chọn một hoặc nhiều vai trò. Vai trò đầu tiên là vai trò chính dùng để hiển thị.
      </p>

      <div className={styles.currentBadges}>
        {current.map((name) => (
          <span key={name} className={`${styles.badge} ${styles[roleBadgeClass(name)]}`}>
            {roleLabel(name)}
          </span>
        ))}
      </div>

      <RoleCheckboxGroup
        roles={roles}
        value={selected}
        primaryName={user?.roleName}
        onChange={setSelected}
        disabled={saving}
      />

      {willRemove.length > 0 && (
        <p className={styles.warning}>
          Bỏ vai trò {willRemove.map(roleLabel).join(', ')} sẽ thu hồi quyền tương ứng ngay
          và đăng xuất mọi phiên đang mở của người này.
        </p>
      )}
    </Modal>
  )
}
