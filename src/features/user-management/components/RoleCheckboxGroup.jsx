import { Checkbox } from 'antd'
import { roleLabel } from '../constants/userManagementConstants'
import styles from '../styles/UserManagementPage.module.css'

/**
 * Danh sách checkbox chọn nhiều role cho một nhân sự (KAN-93).
 *
 * Role chính (phần tử đầu của `primaryName` / role đang giữ vị trí đầu) được đánh
 * dấu "(chính)" vì BE dùng nó cho cột hiển thị và JWT legacy. Người dùng không
 * chọn thứ tự — thứ tự do buildRoleIdsPayload quyết định.
 *
 * @param {object}   props
 * @param {Array}    props.roles        Role gán được từ GET /users/roles.
 * @param {string[]} props.value        Tên các role đang chọn.
 * @param {string}   props.primaryName  Role chính hiện tại.
 * @param {(names: string[]) => void} props.onChange
 * @param {boolean}  props.disabled
 */
export default function RoleCheckboxGroup({ roles, value, primaryName, onChange, disabled }) {
  const toggle = (name, checked) => {
    const next = checked ? [...value, name] : value.filter((n) => n !== name)
    onChange(next)
  }

  return (
    <div className={styles.roleGroup}>
      {roles.map((role) => {
        const checked = value.includes(role.name)
        const isPrimary = checked && (
          role.name === primaryName || (!value.includes(primaryName) && value[0] === role.name)
        )
        return (
          <label key={role._id} className={styles.roleOption}>
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={(e) => toggle(role.name, e.target.checked)}
            />
            <span className={styles.roleOptionLabel}>
              {roleLabel(role.name)}
              {isPrimary && <span className={styles.primaryTag}>chính</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
